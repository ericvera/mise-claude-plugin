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
const OVERVIEW =
  "# Plan\n\nTask Index:\n\n- `01_01_setup.md`\n- `01_02_build.md`\n"

const tempDirs: string[] = []

after(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function miseDir(files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "mise-"))
  tempDirs.push(dir)

  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
  }

  return dir
}

function run(...args: string[]): { code: number; json: any } {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...args], {
      encoding: "utf8",
    })
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

// Approve the direct-route stages up to and including `through`, creating
// artifacts along the way. Returns the mise dir.
function directRoute(through: "goals" | "requirements" | "plan"): string {
  const dir = miseDir({ "goals.md": "# goals" })
  ok("approve", dir, "goals", "route=direct")

  if (through === "goals") {
    return dir
  }

  writeFileSync(join(dir, "requirements.md"), "# reqs")
  ok("approve", dir, "requirements")

  if (through === "requirements") {
    return dir
  }

  mkdirSync(join(dir, "implementation_plan"), { recursive: true })
  writeFileSync(join(dir, "implementation_plan", "00_overview.md"), OVERVIEW)
  ok("approve", dir, "plan")

  return dir
}

// Move a task file into done/, as the execute stage does.
function markDone(dir: string, filename: string): void {
  const done = join(dir, "implementation_plan", "done")
  mkdirSync(done, { recursive: true })
  writeFileSync(join(done, filename), "# done task")
}

// --- report: in-flight detection ----------------------------------------------

test("report: missing directory is not in flight", () => {
  assert.deepEqual(ok("report", "/nonexistent/mise-dir"), { in_flight: false })
})

test("report: empty directory is not in flight", () => {
  assert.deepEqual(ok("report", miseDir()), { in_flight: false })
})

test("report: goals.md without a state file is a fresh start", () => {
  const report = ok("report", miseDir({ "goals.md": "# goals" }))
  assert.equal(report.in_flight, true)
  assert.equal(report.file, "new")
  assert.equal(report.next_action, "stage:goals")
  assert.equal(report.route, null)
})

test("report: --write persists the fresh state file", () => {
  const dir = miseDir({ "goals.md": "# goals" })

  assert.equal(ok("report", dir, "--write").wrote, true)
  const state = JSON.parse(readFileSync(join(dir, ".workflow-state"), "utf8"))
  assert.deepEqual(state, {})
  assert.equal(ok("report", dir).file, "ok")
})

// --- report: next_action progression ---------------------------------------

test("report: direct route walks requirements then plan then execute", () => {
  const dir = directRoute("goals")
  assert.equal(ok("report", dir).next_action, "stage:requirements")

  writeFileSync(join(dir, "requirements.md"), "# reqs")
  ok("approve", dir, "requirements")
  assert.equal(ok("report", dir).next_action, "stage:plan")

  mkdirSync(join(dir, "implementation_plan"), { recursive: true })
  writeFileSync(join(dir, "implementation_plan", "00_overview.md"), OVERVIEW)
  ok("approve", dir, "plan")

  const report = ok("report", dir)
  assert.equal(report.next_action, "stage:execute")
  assert.deepEqual(report.task_index_ids, ["01_01", "01_02"])
  assert.deepEqual(report.tasks_done, [])
  assert.deepEqual(report.tasks_remaining, ["01_01", "01_02"])
})

test("report: full route includes the mock stage", () => {
  const dir = miseDir({ "goals.md": "# goals" })
  ok("approve", dir, "goals", "route=full")
  assert.equal(ok("report", dir).next_action, "stage:mock")
})

test("report: bugfix route goes straight to plan", () => {
  const dir = miseDir({ "goals.md": "# bug understanding" })
  ok("approve", dir, "goals", "route=bugfix")
  assert.equal(ok("report", dir).next_action, "stage:plan")
})

test("report: done/ drives remaining tasks and acceptance", () => {
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")

  let report = ok("report", dir)
  assert.equal(report.next_action, "stage:execute")
  assert.deepEqual(report.tasks_done, ["01_01"])
  assert.deepEqual(report.tasks_remaining, ["01_02"])

  markDone(dir, "01_02_build.md")
  report = ok("report", dir)
  assert.equal(report.next_action, "acceptance")
})

test("report: done files not in the task index are ignored", () => {
  const dir = directRoute("plan")
  markDone(dir, "09_09_superseded.md")

  const report = ok("report", dir)
  assert.deepEqual(report.tasks_done, [])
  assert.deepEqual(report.tasks_remaining, ["01_01", "01_02"])
})

test("report: a missing overview simply makes plan the next stage", () => {
  const dir = directRoute("requirements")
  mkdirSync(join(dir, "implementation_plan"), { recursive: true })
  writeFileSync(join(dir, "implementation_plan", "01_01_setup.md"), "# task")

  assert.equal(ok("report", dir).next_action, "stage:plan")
})

// --- report: mismatch cascade ----------------------------------------------

test("report: editing an approved artifact reopens every later stage", () => {
  const dir = directRoute("requirements")
  writeFileSync(join(dir, "goals.md"), "# goals, edited after approval")

  const report = ok("report", dir)
  assert.equal(report.stages.goals.verdict, "mismatch")
  assert.equal(report.stages.requirements.verdict, "unapproved")
  assert.deepEqual(report.reopened, ["requirements"])
  assert.equal(report.next_action, "stage:goals")
})

test("report: cascade is read-only without --write", () => {
  const dir = directRoute("requirements")
  const before = readFileSync(join(dir, ".workflow-state"), "utf8")
  writeFileSync(join(dir, "goals.md"), "# edited")

  const report = ok("report", dir)
  assert.equal(report.pending_writes, true)
  assert.equal(report.wrote, false)
  assert.equal(readFileSync(join(dir, ".workflow-state"), "utf8"), before)
})

test("report: --write persists the cascade", () => {
  const dir = directRoute("requirements")
  writeFileSync(join(dir, "goals.md"), "# edited")

  assert.equal(ok("report", dir, "--write").wrote, true)
  const state = JSON.parse(readFileSync(join(dir, ".workflow-state"), "utf8"))
  assert.equal(state.approved?.requirements, undefined)
  assert.match(state.approved?.goals ?? "", /^[0-9a-f]{40}$/)
})

// --- report: broken state files are errors -------------------------------------

test("report: missing state file with later artifacts is an error", () => {
  const dir = miseDir({ "goals.md": "# goals", "requirements.md": "# reqs" })

  const { error } = fails("report", dir)
  assert.match(error, /mise:.*checkpoint/)
  assert.match(error, /delete the mise directory/)
})

test("report: unparseable state file is an error, never repaired", () => {
  const raw = '{"route": "direct"'
  const dir = miseDir({ "goals.md": "# goals", ".workflow-state": raw })

  fails("report", dir)
  fails("report", dir, "--write")
  assert.equal(readFileSync(join(dir, ".workflow-state"), "utf8"), raw)
})

test("report: hand-edited fields make the state file an error", () => {
  for (const bad of [
    { route: "sideways" },
    { status: "active" },
    { route: "direct", approved: { goals: "nothex" } },
    { approved: { goals: "0123456789abcdef0123456789abcdef01234567" } }, // no route
  ]) {
    const dir = miseDir({
      "goals.md": "# goals",
      ".workflow-state": JSON.stringify(bad),
    })

    const { error } = fails("report", dir)
    assert.match(
      error,
      /broken/,
      `expected broken error for ${JSON.stringify(bad)}`,
    )
  }
})

// --- approve -----------------------------------------------------------------

test("approve: goals records the hash and the route together", () => {
  const dir = miseDir({ "goals.md": "# goals" })

  const result = ok("approve", dir, "goals", "route=direct")
  assert.equal(result.approved, "goals")
  assert.equal(result.route, "direct")
  assert.match(result.hash, /^[0-9a-f]{40}$/)
  assert.equal(result.changed_reapproval, false)

  const report = ok("report", dir)
  assert.equal(report.route, "direct")
  assert.equal(report.stages.goals.verdict, "approved")
})

test("approve: goals without a route fails", () => {
  const dir = miseDir({ "goals.md": "# goals" })
  fails("approve", dir, "goals")
  fails("approve", dir, "goals", "route=sideways")
})

test("approve: route on a non-goals stage fails", () => {
  const dir = directRoute("goals")
  writeFileSync(join(dir, "requirements.md"), "# reqs")
  fails("approve", dir, "requirements", "route=direct")
})

test("approve: re-approving goals can change the route", () => {
  const dir = directRoute("goals")

  const result = ok("approve", dir, "goals", "route=full")
  assert.equal(result.route, "full")
  assert.equal(result.changed_reapproval, false) // same hash, new route
  assert.equal(ok("report", dir).next_action, "stage:mock")
})

test("approve: changed re-approval drops later approvals", () => {
  const dir = directRoute("requirements")
  writeFileSync(join(dir, "goals.md"), "# edited")

  const result = ok("approve", dir, "goals", "route=direct")
  assert.equal(result.changed_reapproval, true)
  assert.deepEqual(result.reopened, ["requirements"])
  assert.equal(ok("report", dir).next_action, "stage:requirements")
})

test("approve: missing artifact fails", () => {
  fails("approve", miseDir(), "goals", "route=direct")
})

test("approve: missing mise directory fails", () => {
  fails("approve", "/nonexistent/mise-dir", "goals", "route=direct")
})

test("approve: stage outside the current route fails", () => {
  const dir = directRoute("goals")
  writeFileSync(join(dir, "mocks.html"), "<html></html>")
  writeFileSync(join(dir, "mocks.context.md"), "# context")
  fails("approve", dir, "mock")
})

test("approve: unknown stage name fails", () => {
  fails("approve", miseDir({ "goals.md": "# goals" }), "nonsense")
})

test("approve: broken state file fails with the restore hint", () => {
  const dir = miseDir({
    "goals.md": "# goals",
    ".workflow-state": "not json",
  })
  const { error } = fails("approve", dir, "goals", "route=direct")
  assert.match(error, /broken/)
})

// --- approve: done/ is scoped to one plan version ------------------------------

test("approve: changed plan re-approval clears done/", () => {
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")
  writeFileSync(
    join(dir, "implementation_plan", "00_overview.md"),
    OVERVIEW + "\n- `01_03_ship.md`\n",
  )

  const result = ok("approve", dir, "plan")
  assert.equal(result.changed_reapproval, true)
  assert.deepEqual(result.cleared_done, ["01_01"])
  assert.equal(existsSync(join(dir, "implementation_plan", "done")), false)
  assert.deepEqual(ok("report", dir).tasks_remaining, [
    "01_01",
    "01_02",
    "01_03",
  ])
})

test("approve: plan re-approval after a cascade also clears done/", () => {
  // Upstream edit cascades away the plan approval; the later plan approval
  // has no recorded previous hash, but done/ must still not survive
  // into a different plan version.
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")
  writeFileSync(join(dir, "goals.md"), "# edited upstream")
  ok("report", dir, "--write")
  ok("approve", dir, "goals", "route=direct")
  ok("approve", dir, "requirements")
  writeFileSync(
    join(dir, "implementation_plan", "00_overview.md"),
    OVERVIEW + "\n- `01_03_ship.md`\n",
  )

  const result = ok("approve", dir, "plan")
  assert.equal(result.changed_reapproval, false) // cascade dropped the previous entry
  assert.deepEqual(result.cleared_done, ["01_01"])
})

test("approve: unchanged plan re-approval keeps done/", () => {
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")

  const result = ok("approve", dir, "plan")
  assert.equal(result.changed_reapproval, false)
  assert.equal(result.cleared_done, undefined)
  assert.deepEqual(ok("report", dir).tasks_done, ["01_01"])
})

// --- acceptance ---------------------------------------------------------------

test("approve: acceptance flips next_action to close_out", () => {
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")
  assert.equal(ok("report", dir).next_action, "acceptance")

  const result = ok("approve", dir, "acceptance")
  assert.equal(result.approved, "acceptance")
  assert.match(result.hash, /^[0-9a-f]{40}$/)
  assert.equal(ok("report", dir).next_action, "close_out")

  const state = JSON.parse(readFileSync(join(dir, ".workflow-state"), "utf8"))
  assert.equal(state.accepted, result.hash)
})

test("approve: acceptance with tasks remaining fails", () => {
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")

  const { error } = fails("approve", dir, "acceptance")
  assert.match(error, /tasks remaining \(01_02\)/)
})

test("approve: acceptance with unapproved stages fails", () => {
  const dir = directRoute("requirements")
  const { error } = fails("approve", dir, "acceptance")
  assert.match(error, /not validly approved \(plan\)/)
})

test("approve: route on acceptance fails", () => {
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")
  fails("approve", dir, "acceptance", "route=direct")
})

test("report: doc edits after acceptance re-run the pass", () => {
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")
  ok("approve", dir, "acceptance")

  // Editing goals cascades away the later approvals; re-walking the stages
  // clears done/ (different plan approval), and redoing the tasks lands back
  // on identical artifacts — but the goals bytes changed, so the recorded
  // acceptance is stale and the pass must re-run.
  writeFileSync(join(dir, "goals.md"), "# edited after acceptance")
  ok("report", dir, "--write")
  ok("approve", dir, "goals", "route=direct")
  ok("approve", dir, "requirements")
  ok("approve", dir, "plan")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")

  assert.equal(ok("report", dir).next_action, "acceptance")
})

test("report: an observed mismatch clears the acceptance record", () => {
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")
  ok("approve", dir, "acceptance")

  const overview = join(dir, "implementation_plan", "00_overview.md")
  const original = readFileSync(overview, "utf8")
  writeFileSync(overview, original + "\n<!-- tweak -->\n")
  assert.equal(ok("report", dir, "--write").accepted_cleared, true)
  writeFileSync(overview, original)

  // The overview is byte-identical to what was accepted, but the observed
  // mismatch dropped the record — a revert cannot resurrect an acceptance.
  assert.equal(ok("report", dir).next_action, "acceptance")
})

test("approve: a changed approval clears the acceptance record", () => {
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")
  ok("approve", dir, "acceptance")

  writeFileSync(join(dir, "requirements.md"), "# reqs v2")
  assert.equal(ok("approve", dir, "requirements").accepted_cleared, true)

  const state = JSON.parse(readFileSync(join(dir, ".workflow-state"), "utf8"))
  assert.equal(state.accepted, undefined)
})

test("approve: an unchanged re-approval keeps the acceptance record", () => {
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")
  ok("approve", dir, "acceptance")

  const result = ok("approve", dir, "plan")
  assert.equal(result.accepted_cleared, undefined)
  assert.equal(ok("report", dir).next_action, "close_out")
})

test("report: a done/ change alone makes the acceptance stale", () => {
  const dir = directRoute("plan")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")
  ok("approve", dir, "acceptance")

  // A stray done file changes no stage hash and no task verdict, but it is
  // part of the delivered state the acceptance hashed — the pass re-runs.
  markDone(dir, "09_09_stray.md")
  assert.equal(ok("report", dir).next_action, "acceptance")
})

test("report: invalid accepted hash is broken state", () => {
  const dir = miseDir({
    "goals.md": "# goals",
    ".workflow-state": JSON.stringify({ accepted: "nothex" }),
  })

  const { error } = fails("report", dir)
  assert.match(error, /broken/)
})

test("report: accepted without approvals is broken state", () => {
  const dir = miseDir({
    "goals.md": "# goals",
    ".workflow-state": JSON.stringify({
      accepted: "0123456789abcdef0123456789abcdef01234567",
    }),
  })

  const { error } = fails("report", dir)
  assert.match(error, /broken/)
})

// --- CLI ------------------------------------------------------------------------

test("cli: missing arguments and unknown commands fail with usage", () => {
  fails()
  fails("report")
  fails("frobnicate", miseDir())
})

test("cli: the retired set and reopen commands fail", () => {
  const dir = directRoute("goals")
  fails("set", dir, "route=direct")
  fails("reopen", dir, "goals")
})
