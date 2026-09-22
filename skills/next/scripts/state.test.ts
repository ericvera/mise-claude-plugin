// Subprocess tests for state.ts: each case builds a throwaway mise directory,
// invokes the script exactly as the skill does, and asserts on the JSON it
// prints. See state.ts for the command contract.

import { test, after } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

const SCRIPT = join(import.meta.dirname, "state.ts")

const SPEC = `# Spec

## What

Ship the thing. Not a task id: 09_09_decoy.md

## Task index

- \`01_01_setup.md\`
- \`01_02_build.md\`
`

const ISO = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/

const tempDirs: string[] = []

after(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function place(dir: string, files: Record<string, string>): string {
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
  }

  return dir
}

function miseDir(files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "mise-"))
  tempDirs.push(dir)

  return place(dir, files)
}

function run(...args: string[]): { code: number; json: any } {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...args], { encoding: "utf8" })
    return { code: 0, json: JSON.parse(stdout) }
  } catch (error) {
    const e = error as { status: number | null; stdout: string }
    return { code: e.status ?? -1, json: JSON.parse(e.stdout) }
  }
}

function ok(...args: string[]): any {
  const { code, json } = run(...args)
  assert.equal(code, 0, `expected success, got: ${JSON.stringify(json)}`)
  return json
}

function fails(...args: string[]): any {
  const { code, json } = run(...args)
  assert.equal(code, 1, `expected failure, got: ${JSON.stringify(json)}`)
  assert.ok(json.error, "failure output should carry an error message")
  return json
}

function state(dir: string): any {
  return JSON.parse(readFileSync(join(dir, ".workflow-state"), "utf8"))
}

function ledger(dir: string): any[] {
  const path = join(dir, "ledger.jsonl")

  if (!existsSync(path)) {
    return []
  }

  return readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

// Move a task file into tasks/done/, as the execute step does.
function markDone(dir: string, filename: string): void {
  const done = join(dir, "tasks", "done")
  mkdirSync(done, { recursive: true })
  writeFileSync(join(done, filename), "# done task")
}

// A started run: goals.md, an initialized state file, then any later artifacts
// (which the engine rejects if they predate the state file).
function started(files: Record<string, string> = {}): string {
  const dir = miseDir({ "goals.md": "# goals" })
  ok("report", dir, "--write")

  return place(dir, files)
}

// --- report: in-flight detection ---------------------------------------------

test("report: missing directory is not in flight", () => {
  assert.deepEqual(ok("report", "/nonexistent/.mise"), { in_flight: false })
})

test("report: empty directory is not in flight", () => {
  assert.deepEqual(ok("report", miseDir()), { in_flight: false })
})

test("report: goals.md without a state file is a fresh start", () => {
  const dir = miseDir({ "goals.md": "# goals" })

  assert.deepEqual(ok("report", dir), {
    in_flight: true,
    next_action: "step:goals",
    tasks: { done: 0, remaining: 0, next_id: null, next_file: null },
    amendments: 0,
  })
  assert.equal(existsSync(join(dir, ".workflow-state")), false)
})

test("report: --write initializes the state file", () => {
  const dir = started()
  const written = state(dir)

  assert.equal(written.version, 3)
  assert.match(written.started, ISO)
  assert.deepEqual(written.steps, {
    goals: null,
    spec: null,
    critic: null,
    execute: null,
    adherence: null,
    review: null,
    gate: null,
  })
  assert.equal(written.amendments, 0)
})

// --- report: next_action order -----------------------------------------------

test("report: the full step order ends at close", () => {
  const dir = started()

  assert.equal(ok("report", dir).next_action, "step:goals")
  ok("mark", dir, "goals", "done")
  assert.equal(ok("report", dir).next_action, "step:spec")

  writeFileSync(join(dir, "spec.md"), SPEC)
  ok("mark", dir, "spec", "done")
  assert.equal(ok("report", dir).next_action, "step:critic")

  ok("mark", dir, "critic", "done")
  assert.equal(ok("report", dir).next_action, "step:execute")

  markDone(dir, "01_01_setup.md")
  assert.equal(ok("report", dir).next_action, "step:execute")

  // The last task done leaves execute open for its whole-diff review.
  markDone(dir, "01_02_build.md")
  assert.equal(ok("report", dir).next_action, "step:execute")

  ok("mark", dir, "execute", "done")
  assert.equal(ok("report", dir).next_action, "step:adherence")

  ok("mark", dir, "adherence", "done")
  assert.equal(ok("report", dir).next_action, "step:review")

  ok("mark", dir, "review", "done")
  assert.equal(ok("report", dir).next_action, "step:gate")

  ok("mark", dir, "gate", "done")
  assert.equal(ok("report", dir).next_action, "close")
})

test("report: the task index drives the task counts", () => {
  const dir = started({ "spec.md": SPEC })
  ok("mark", dir, "spec", "done")

  let report = ok("report", dir)
  assert.deepEqual(report.tasks, {
    done: 0,
    remaining: 2,
    next_id: "01_01",
    next_file: null,
  })

  markDone(dir, "01_02_build.md")
  markDone(dir, "09_09_superseded.md") // not in the index: ignored
  report = ok("report", dir)
  assert.deepEqual(report.tasks, {
    done: 1,
    remaining: 1,
    next_id: "01_01",
    next_file: null,
  })
})

// The report names the next task's file so the driver never lists tasks/ or
// re-reads the spec's index to find it.
test("report: next_file resolves the next task's file, done or not", () => {
  const dir = started({
    "spec.md": SPEC,
    "tasks/01_01_setup.md": "# task",
    "tasks/01_02_build.md": "# task",
  })
  ok("mark", dir, "spec", "done")

  assert.equal(ok("report", dir).tasks.next_file, "tasks/01_01_setup.md")

  markDone(dir, "01_01_setup.md")
  rmSync(join(dir, "tasks", "01_01_setup.md"))

  const report = ok("report", dir)
  assert.deepEqual(report.tasks, {
    done: 1,
    remaining: 1,
    next_id: "01_02",
    next_file: "tasks/01_02_build.md",
  })
})

test("report: only the Task index section supplies ids", () => {
  const dir = started({ "spec.md": "# Spec\n\n## What\n\n`01_01_x.md`\n" })
  ok("mark", dir, "goals", "done")
  ok("mark", dir, "spec", "done")
  ok("mark", dir, "critic", "done")

  assert.equal(ok("report", dir).tasks.remaining, 0)
})

test("report: a skipped spec makes the work one implicit task", () => {
  const dir = started()
  ok("mark", dir, "goals", "skipped")
  ok("mark", dir, "spec", "skipped")
  ok("mark", dir, "critic", "skipped")

  let report = ok("report", dir)
  assert.equal(report.next_action, "step:execute")
  assert.equal(report.tasks.next_id, "01_01")

  markDone(dir, "01_01_only.md")
  report = ok("report", dir)
  assert.equal(report.tasks.done, 1)
  assert.equal(report.tasks.remaining, 0)
})

test("report: with no spec, an added task file reopens execute", () => {
  const dir = started()
  for (const step of ["goals", "spec", "critic"])
    ok("mark", dir, step, "skipped")

  markDone(dir, "01_01_fix.md")
  ok("mark", dir, "execute", "done")
  ok("mark", dir, "adherence", "done")
  assert.equal(ok("report", dir).next_action, "step:review")

  // An amendment in a run with no spec: its new task file is the index.
  ok("amend", dir, "owner changed the empty-state copy")
  place(dir, { "tasks/01_02_copy.md": "# task" })

  const report = ok("report", dir)
  assert.deepEqual(report.tasks, {
    done: 1,
    remaining: 1,
    next_id: "01_02",
    next_file: "tasks/01_02_copy.md",
  })
  assert.equal(report.next_action, "step:execute")
})

test("report: execute reopens when the spec gains a task", () => {
  const dir = started({ "spec.md": SPEC })
  ok("mark", dir, "goals", "done")
  ok("mark", dir, "spec", "done")
  ok("mark", dir, "critic", "done")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")
  ok("mark", dir, "execute", "done")
  assert.equal(ok("report", dir).next_action, "step:adherence")

  writeFileSync(join(dir, "spec.md"), SPEC + "- `01_03_ship.md`\n")
  assert.equal(ok("report", dir).next_action, "step:execute")
})

// --- mark ---------------------------------------------------------------------

test("mark: done and skipped are recorded in the state", () => {
  const dir = started()

  assert.deepEqual(ok("mark", dir, "goals", "done"), {
    step: "goals",
    state: "done",
  })
  assert.deepEqual(ok("mark", dir, "spec", "skipped"), {
    step: "spec",
    state: "skipped",
  })

  const written = state(dir)
  assert.equal(written.steps.goals, "done")
  assert.equal(written.steps.spec, "skipped")
})

// The reason for a skip is the ledger's, logged by the driver: mark neither
// stores it nor writes the event, and a reason passed here is a mistake.
test("mark: a skip carries no reason and writes no ledger event", () => {
  const dir = started()
  ok("mark", dir, "critic", "skipped")

  assert.deepEqual(ledger(dir), [])
  assert.match(
    fails("mark", dir, "adherence", "skipped", "no families").error,
    /takes no reason/,
  )
  assert.equal(state(dir).steps.adherence, null)
})

test("mark: unknown steps and states are rejected", () => {
  const dir = started()

  assert.match(fails("mark", dir, "mock", "done").error, /expected a step/)
  assert.match(fails("mark", dir, "sweep", "done").error, /expected a step/)
  assert.match(fails("mark", dir, "goals", "approved").error, /done\|skipped/)
  fails("mark", dir, "goals")
  fails("mark", dir)
  assert.deepEqual(state(dir).steps.goals, null)
})

test("mark: execute closes only once every task is done, and never skips", () => {
  const dir = started({ "spec.md": SPEC })
  for (const step of ["goals", "spec", "critic"]) ok("mark", dir, step, "done")
  markDone(dir, "01_01_setup.md")

  assert.match(
    fails("mark", dir, "execute", "done").error,
    /1 task\(s\) left, next 01_02/,
  )
  assert.match(fails("mark", dir, "execute", "skipped").error, /never skipped/)
  assert.equal(state(dir).steps.execute, null)

  markDone(dir, "01_02_build.md")
  ok("mark", dir, "execute", "done")
  assert.equal(state(dir).steps.execute, "done")
})

// --- amend --------------------------------------------------------------------

test("amend: reopens execute and adherence and counts up", () => {
  const dir = started({ "spec.md": SPEC })
  for (const step of ["goals", "spec", "critic"]) ok("mark", dir, step, "done")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")
  ok("mark", dir, "execute", "done")
  ok("mark", dir, "adherence", "done")
  ok("mark", dir, "review", "done")
  assert.equal(ok("report", dir).next_action, "step:gate")

  const result = ok("amend", dir, "drop the cache layer")
  assert.equal(result.amendments, 1)
  assert.deepEqual(result.reopened, ["execute", "adherence"])

  const report = ok("report", dir)
  assert.equal(report.next_action, "step:execute")
  assert.equal(report.amendments, 1)

  const written = state(dir)
  assert.equal(written.steps.execute, null)
  assert.equal(written.steps.adherence, null)
  assert.equal(written.steps.review, "done") // review is not reopened

  assert.equal(ok("amend", dir, "and the retry").amendments, 2)
})

test("amend: appends the text to the ledger", () => {
  const dir = started()
  ok("amend", dir, "owner wants soft delete instead")

  const events = ledger(dir)
  assert.equal(events.length, 1)
  assert.match(events[0].t, ISO)
  assert.deepEqual(
    { event: events[0].event, text: events[0].text },
    { event: "amend", text: "owner wants soft delete instead" },
  )
})

test("amend: empty text is rejected", () => {
  const dir = started()

  fails("amend", dir)
  fails("amend", dir, "   ")
  assert.equal(state(dir).amendments, 0)
  assert.deepEqual(ledger(dir), [])
})

// --- log ----------------------------------------------------------------------

test("log: appends timestamped events to ledger.jsonl", () => {
  const dir = started()

  const entry = ok(
    "log",
    dir,
    JSON.stringify({
      event: "run",
      repo: "mise",
      branch: "fix-x",
      version: "3.0.0",
    }),
  )
  assert.match(entry.t, ISO)
  assert.equal(entry.event, "run")

  ok(
    "log",
    dir,
    JSON.stringify({
      event: "spawn",
      role: "critic",
      step: "critic",
      round: 1,
      verdict: "blocking",
    }),
  )

  const events = ledger(dir)
  assert.equal(events.length, 2)
  assert.equal(events[0].branch, "fix-x")
  assert.equal("seconds" in events[0], false)
  assert.deepEqual(Object.keys(events[1]), [
    "t",
    "event",
    "role",
    "step",
    "round",
    "verdict",
    "seconds",
  ])
})

// Durations are never model-reported: each event is timed from the one before.
test("log: the engine times each event from the one before", () => {
  const dir = started()
  const earlier = new Date(Date.now() - 90_000).toISOString()

  writeFileSync(
    join(dir, "ledger.jsonl"),
    JSON.stringify({ t: earlier, event: "run" }) + "\n",
  )
  ok(
    "log",
    dir,
    JSON.stringify({ event: "stop", step: "goals", reason: "approval" }),
  )

  const seconds = ledger(dir)[1].seconds
  assert.ok(seconds >= 90 && seconds < 100, `seconds ${seconds}`)
  assert.match(
    fails(
      "log",
      dir,
      JSON.stringify({
        event: "gate",
        command: "yarn test",
        pass: true,
        seconds: 3,
      }),
    ).error,
    /seconds are set by the engine/,
  )
})

// A variant spelling would split the retro's tally rows, so it is refused.
test("log: field values are checked", () => {
  const dir = started()
  const spawn = {
    event: "spawn",
    role: "reviewer",
    step: "execute",
    round: 1,
    verdict: "none",
  }

  ok("log", dir, JSON.stringify(spawn))

  for (const [bad, message] of [
    [{ step: "Execute" }, /spawn step must be start\|goals/],
    [{ role: "Reviewer" }, /spawn role must be implementer\|reviewer/],
    [{ round: 0 }, /round must be a positive integer/],
    [{ round: "1" }, /round must be a positive integer/],
    [{ verdict: "" }, /verdict must be a non-empty string/],
  ] as const)
    assert.match(
      fails("log", dir, JSON.stringify({ ...spawn, ...bad })).error,
      message,
    )

  assert.match(
    fails(
      "log",
      dir,
      JSON.stringify({ event: "gate", command: "yarn test", pass: "true" }),
    ).error,
    /gate pass must be true\|false/,
  )
  assert.match(
    fails(
      "log",
      dir,
      JSON.stringify({
        event: "feedback",
        step: "review",
        kind: "nit",
        issue: "x",
      }),
    ).error,
    /kind must be point\|pattern\|decision\|voided/,
  )
  assert.equal(ledger(dir).length, 1)
})

// The fields are what the retro tallies on, so a half-formed event is refused
// rather than logged: the message names the ones the event takes.
test("log: an event takes exactly the fields it declares", () => {
  const dir = started()
  const skip = { event: "skip", step: "critic", reason: "no spec" }

  ok("log", dir, JSON.stringify(skip))

  assert.match(
    fails("log", dir, JSON.stringify({ event: "skip", step: "critic" })).error,
    /takes exactly step, reason; missing reason/,
  )
  assert.match(
    fails("log", dir, JSON.stringify({ ...skip, severity: "high" })).error,
    /unknown severity/,
  )
  assert.match(
    fails("log", dir, JSON.stringify({ event: "amend", text: "x" })).error,
    /written by `state.ts amend`/,
  )
  assert.equal(ledger(dir).length, 1)
})

test("log: rejects unknown events and malformed input", () => {
  const dir = started()

  assert.match(
    fails("log", dir, JSON.stringify({ event: "nonsense" })).error,
    /unknown ledger event/,
  )
  fails("log", dir, JSON.stringify({ role: "critic" }))
  fails("log", dir, JSON.stringify(["run"]))
  fails("log", dir, "{not json")
  fails("log", dir)
  fails(
    "log",
    "/nonexistent/.mise",
    JSON.stringify({ event: "run", repo: "r", branch: "b", version: "3.0.0" }),
  )
  assert.deepEqual(ledger(dir), [])
})

test("log: the engine owns the timestamp", () => {
  const dir = started()
  const { error } = fails("log", dir, JSON.stringify({ event: "run", t: "x" }))

  assert.match(error, /timestamp and seconds are set by the engine/)
})

// --- tally ---------------------------------------------------------------------

function jsonl(...entries: object[]): string {
  return entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n"
}

test("tally: counts archived ledgers by event, step and detail", () => {
  const finding = { event: "finding", step: "execute", source: "reviewer" }
  const feedback = { event: "feedback", step: "review", kind: "point" }
  const one = miseDir({
    "feat-a.jsonl": jsonl(
      { ...finding, changed: true },
      { ...finding, changed: true },
      {
        event: "skip",
        step: "critic",
        reason: "no spec, nothing hard to undo",
      },
      { ...feedback, issue: "no retry on the 429 path" },
      { ...feedback, issue: "empty state shows the spinner forever" },
    ),
    "feat-b.jsonl": jsonl({ ...finding, changed: true }),
    "notes.md": "not a ledger",
  })
  const two = miseDir({
    "fix-c.jsonl": jsonl({
      event: "skip",
      step: "critic",
      reason: "entirely different wording",
    }),
  })

  const out = ok("tally", one, two)

  assert.equal(out.ledgers, 3)
  assert.equal(out.projects, 2)
  assert.equal(out.events, 7)
  assert.equal(out.rows_total, 3)
  assert.deepEqual(out.rows[0], {
    event: "finding",
    step: "execute",
    detail: "source=reviewer changed=true",
    count: 3,
    runs: 2,
    projects: 1,
  })
  // Free text never splits a row: the two skips group on event and step alone,
  // and the two feedback items on their kind, whatever their `issue` says.
  // It carries its first distinct wordings instead, as examples.
  assert.deepEqual(out.rows[1], {
    event: "feedback",
    step: "review",
    detail: "kind=point",
    count: 2,
    runs: 1,
    projects: 1,
    examples: [
      "no retry on the 429 path",
      "empty state shows the spinner forever",
    ],
  })
  assert.deepEqual(out.rows[2], {
    event: "skip",
    step: "critic",
    detail: "",
    count: 2,
    runs: 2,
    projects: 2,
    examples: ["no spec, nothing hard to undo", "entirely different wording"],
  })
})

// close archives to `.claude/mise-ledger/<branch>.jsonl`, and every branch is
// `feat/<slug>` or `fix/<slug>`.
test("tally: finds ledgers archived under a branch's folders", () => {
  const dir = miseDir({
    "feat/a.jsonl": jsonl(
      { event: "spawn", role: "critic", seconds: 60 },
      { event: "spawn", role: "critic", seconds: 120 },
    ),
    "fix/b.jsonl": jsonl({ event: "spawn", role: "critic" }),
  })

  const out = ok("tally", dir)

  assert.equal(out.ledgers, 2)
  assert.deepEqual(out.rows[0], {
    event: "spawn",
    step: null,
    detail: "role=critic",
    count: 3,
    runs: 2,
    projects: 1,
    avg_seconds: 90,
  })
})

test("tally: the row list is capped and the total reported", () => {
  const spawns = Array.from({ length: 60 }, (_, i) => ({
    event: "spawn",
    role: `role-${String(i).padStart(2, "0")}`,
  }))
  const dir = miseDir({ "feat-a.jsonl": jsonl(...spawns, spawns[0]) })

  const out = ok("tally", dir)

  assert.equal(out.rows_total, 60)
  assert.equal(out.rows.length, 50)
  assert.equal(out.rows[0].count, 2) // the repeated row sorts first
  assert.equal(out.rows[0].detail, "role=role-00")
})

test("tally: unreadable lines are counted, never fatal", () => {
  const dir = miseDir({
    "feat-a.jsonl": '{"event":"run"}\n{not json\n["run"]\n{"role":"critic"}\n',
  })

  const out = ok("tally", dir)

  assert.equal(out.events, 1)
  assert.equal(out.unreadable, 3)
})

test("tally: an empty directory and a missing one", () => {
  assert.deepEqual(ok("tally", miseDir()), {
    ledgers: 0,
    projects: 0,
    events: 0,
    rows_total: 0,
    rows: [],
  })
  assert.match(
    fails("tally", miseDir(), "/nonexistent/ledgers").error,
    /ledger directory not found/,
  )
})

// --- broken state files are errors, never rebuilt ------------------------------

test("report: unparseable state file is an error, never repaired", () => {
  const raw = '{"version": 3'
  const dir = miseDir({ "goals.md": "# goals", ".workflow-state": raw })

  fails("report", dir)
  fails("report", dir, "--write")
  fails("mark", dir, "goals", "done")
  assert.equal(readFileSync(join(dir, ".workflow-state"), "utf8"), raw)
})

test("report: hand-edited state files are errors", () => {
  const good = {
    version: 3,
    started: "2026-09-22T00:00:00.000Z",
    steps: { goals: null },
    amendments: 0,
  }

  for (const bad of [
    { ...good, version: 2 },
    { ...good, started: "whenever" },
    { ...good, amendments: -1 },
    { ...good, amendments: "two" },
    { ...good, status: "active" },
    { ...good, steps: { goals: "approved" } },
    { ...good, steps: { mock: "done" } },
    { ...good, steps: { execute: "skipped" } },
    { ...good, steps: "goals" },
    { ...good, skipReason: {} }, // the retired v2/v3.0 field
    { version: 3, started: good.started },
  ]) {
    const dir = miseDir({
      "goals.md": "# goals",
      ".workflow-state": JSON.stringify(bad),
    })

    const { error } = fails("report", dir)
    assert.match(error, /broken/, `expected broken: ${JSON.stringify(bad)}`)
    assert.match(error, /checkpoint commit/)
  }
})

test("report: a lost state file with artifacts is an error", () => {
  const cases: Record<string, string>[] = [
    { "spec.md": SPEC },
    { "tasks/01_01_a.md": "# task" },
  ]

  for (const files of cases) {
    const dir = miseDir({ "goals.md": "# goals", ...files })
    const { error } = fails("report", dir)

    assert.match(error, /state file missing/)
    assert.match(error, /delete the mise directory/)
  }
})

test("commands: a missing mise directory fails", () => {
  assert.match(
    fails("mark", "/nonexistent/.mise", "goals", "done").error,
    /not found/,
  )
  fails("amend", "/nonexistent/.mise", "text")
})

// --- CLI ----------------------------------------------------------------------

test("cli: missing arguments and unknown commands fail with usage", () => {
  fails()
  fails("report")
  fails("frobnicate", miseDir())
})

test("cli: the retired v2 commands fail", () => {
  const dir = started()

  fails("approve", dir, "goals", "done")
  fails("approve", dir, "acceptance")
})
