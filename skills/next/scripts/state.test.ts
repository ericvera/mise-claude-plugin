// Subprocess tests for state.ts. Each case builds a throwaway repository with a
// mise directory, invokes the script in a subprocess, as the skill does, and asserts on
// the JSON it prints. See state.ts for the command contract.

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
const STEP_FILES = join(import.meta.dirname, "..", "steps")

const SPEC = `# Spec

## What

Ship the thing. Not a task id: 09_09_decoy.md

## Task index

- \`01_01_setup.md\`
- \`01_02_build.md\`
`

// The task files SPEC's index lists, as the spec step writes them.
const TASKS = {
  "tasks/01_01_setup.md": "# task",
  "tasks/01_02_build.md": "# task",
}

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

// Git with no user or system config, so the owner's settings never leak in.
const ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "test",
  GIT_COMMITTER_EMAIL: "test@example.com",
}

function git(root: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: root, env: ENV, encoding: "utf8" })
    .toString()
    .trim()
}

// A repository on a feature branch whose origin's default branch is main,
// with the mise directory at its root.
function miseDir(
  files: Record<string, string> = {},
  { originHead = true } = {},
): string {
  const root = mkdtempSync(join(tmpdir(), "mise-"))
  tempDirs.push(root)

  git(root, "init", "-q", "-b", "main")
  git(root, "commit", "-q", "--allow-empty", "-m", "init")
  git(root, "update-ref", "refs/remotes/origin/main", "HEAD")
  if (originHead)
    git(
      root,
      "symbolic-ref",
      "refs/remotes/origin/HEAD",
      "refs/remotes/origin/main",
    )
  git(root, "switch", "-q", "-c", "feat/x")

  const dir = join(root, ".mise")
  mkdirSync(dir)

  return place(dir, files)
}

// Commit files at the repository root, as an implementer does.
function commit(dir: string, files: Record<string, string>): string {
  const root = dirname(dir)
  place(root, files)
  git(root, "add", "--", ".", ":!.mise")
  git(root, "commit", "-q", "-m", "work")

  return git(root, "rev-parse", "HEAD")
}

// n source files, named so their diff order is stable.
function sources(n: number, prefix = "src"): Record<string, string> {
  const files: Record<string, string> = {}

  for (let i = 1; i <= n; i++)
    files[`${prefix}/${String(i).padStart(2, "0")}.ts`] =
      `export const n = ${i}\n`

  return files
}

function run(...args: string[]): { code: number; json: any } {
  try {
    const stdout = execFileSync("node", [SCRIPT, ...args], {
      encoding: "utf8",
      env: ENV,
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

function state(dir: string): any {
  return JSON.parse(readFileSync(join(dir, ".workflow-state"), "utf8"))
}

// Move a task file into tasks/done/, as the execute step does.
function markDone(dir: string, filename: string): void {
  const done = join(dir, "tasks", "done")
  mkdirSync(done, { recursive: true })
  rmSync(join(dir, "tasks", filename), { force: true })
  writeFileSync(join(done, filename), "# done task")
}

// A started run has goals.md, an initialized state file, then any later
// artifacts (which the engine rejects if they predate the state file).
function started(files: Record<string, string> = {}): string {
  const dir = miseDir({ "goals.md": "# goals" })
  ok("report", dir, "--write")

  return place(dir, files)
}

// A run whose goals are approved and whose spec and critic are skipped.
function noSpec(dir: string): void {
  ok("mark", dir, "goals", "done")
  ok("mark", dir, "spec", "skipped")
  ok("mark", dir, "critic", "skipped")
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
    step_file: join(STEP_FILES, "02-goals.md"),
    base: "main",
    tasks: { done: 0, remaining: 0, next_id: null, next_file: null },
    checks: null,
    amendments: 0,
  })
  assert.equal(existsSync(join(dir, ".workflow-state")), false)
})

test("report: --write initializes the state file", () => {
  const dir = started()
  const written = state(dir)

  assert.equal(written.version, 3)
  assert.match(written.started, ISO)
  assert.equal(written.base, "main")
  assert.deepEqual(written.steps, {
    goals: null,
    spec: null,
    critic: null,
    execute: null,
    review: null,
    gate: null,
  })
  assert.equal(written.amendments, 0)
  assert.equal(written.checks_from, null)
  assert.equal(written.fix_rounds, 0)
})

test("report: a repository whose origin/HEAD is unset cannot start a run", () => {
  const dir = miseDir({ "goals.md": "# goals" }, { originHead: false })

  assert.match(fails("report", dir, "--write").error, /set-head origin --auto/)
  assert.equal(existsSync(join(dir, ".workflow-state")), false)
})

// --- report: next_action order -----------------------------------------------

// Every step the report names has its file on disk, numbered in run order.
function expectStep(dir: string, action: string): void {
  const report = ok("report", dir)
  const step = action.replace(/^step:/, "")

  assert.equal(report.next_action, action)
  assert.match(report.step_file, new RegExp(`/\\d{2}-${step}\\.md$`))
  assert.ok(existsSync(report.step_file), report.step_file)
}

test("report: the full step order ends at close", () => {
  const dir = started()

  expectStep(dir, "step:goals")
  ok("mark", dir, "goals", "done")
  expectStep(dir, "step:spec")

  place(dir, { "spec.md": SPEC, ...TASKS })
  ok("mark", dir, "spec", "done")
  expectStep(dir, "step:critic")

  ok("mark", dir, "critic", "done")
  expectStep(dir, "step:execute")

  markDone(dir, "01_01_setup.md")
  expectStep(dir, "step:execute")

  // The last task done leaves execute open for its whole-diff review.
  markDone(dir, "01_02_build.md")
  expectStep(dir, "step:execute")

  ok("mark", dir, "execute", "done")
  expectStep(dir, "step:review")

  ok("mark", dir, "review", "done")
  expectStep(dir, "step:gate")

  ok("mark", dir, "gate", "done")
  expectStep(dir, "close")
  assert.ok(existsSync(join(STEP_FILES, "01-start.md")))
})

test("report: the task index drives the task counts", () => {
  const dir = started({ "spec.md": SPEC, ...TASKS })
  ok("mark", dir, "spec", "done")

  let report = ok("report", dir)
  assert.deepEqual(report.tasks, {
    done: 0,
    remaining: 2,
    next_id: "01_01",
    next_file: join(dir, "tasks", "01_01_setup.md"),
  })

  markDone(dir, "01_02_build.md")
  markDone(dir, "09_09_superseded.md") // not in the index, so ignored
  report = ok("report", dir)
  assert.deepEqual(report.tasks, {
    done: 1,
    remaining: 1,
    next_id: "01_01",
    next_file: join(dir, "tasks", "01_01_setup.md"),
  })
})

// The report names the next task's file so the driver never lists tasks/ or
// re-reads the spec's index to find it.
test("report: next_file resolves the next task's file, done or not", () => {
  const dir = started({ "spec.md": SPEC, ...TASKS })
  ok("mark", dir, "spec", "done")

  assert.equal(
    ok("report", dir).tasks.next_file,
    join(dir, "tasks", "01_01_setup.md"),
  )

  markDone(dir, "01_01_setup.md")

  const report = ok("report", dir)
  assert.deepEqual(report.tasks, {
    done: 1,
    remaining: 1,
    next_id: "01_02",
    next_file: join(dir, "tasks", "01_02_build.md"),
  })
})

// An index the engine cannot read would let execute close with nothing built.
test("mark: a spec is done only once its Task index names every task file", () => {
  const dir = started({
    "spec.md": "# Spec\n\n## What\n\n`01_01_setup.md`\n",
    ...TASKS,
  })
  ok("mark", dir, "goals", "done")

  // Only the Task index section names task files.
  assert.match(fails("mark", dir, "spec", "done").error, /names no task file/)

  // Bare ids are not task file names.
  const bare = "## Task index\n\n| id | what |\n| --- | --- |\n| 01_01 | a |\n"
  writeFileSync(join(dir, "spec.md"), bare)
  assert.match(fails("mark", dir, "spec", "done").error, /names no task file/)

  writeFileSync(join(dir, "spec.md"), SPEC + "- `01_03_ship.md`\n")
  assert.match(
    fails("mark", dir, "spec", "done").error,
    /lists 01_03_ship.md with no such file/,
  )
  assert.equal(state(dir).steps.spec, null)

  place(dir, { "tasks/01_03_ship.md": "# task" })
  ok("mark", dir, "spec", "done")
})

test("mark: index rows name task files, never a touched path's tail", () => {
  const dir = started({
    "spec.md":
      "## Task index\n\n" +
      "| file | what | touches |\n| --- | --- | --- |\n" +
      "| `01_01_notes.md` | a | docs/changelog/2026_09_22_release.md |\n" +
      "| `01_02_more.md` | b | src/01_03_old.md, `01_04_x.md` |\n",
    "tasks/01_01_notes.md": "# task",
    "tasks/01_02_more.md": "# task",
  })
  ok("mark", dir, "goals", "done")
  ok("mark", dir, "spec", "done")

  assert.equal(ok("report", dir).tasks.remaining, 2)
})

test("report: a task file the index does not name is an error", () => {
  const dir = started({ "spec.md": SPEC, ...TASKS })
  ok("mark", dir, "goals", "done")
  ok("mark", dir, "spec", "done")

  // Renamed on disk but not in the index, so the index row has no file.
  rmSync(join(dir, "tasks", "01_02_build.md"))
  place(dir, { "tasks/02_01_build.md": "# task" })

  assert.match(fails("report", dir).error, /01_02_build.md with no such file/)

  writeFileSync(join(dir, "spec.md"), SPEC.replace("01_02", "02_01"))
  place(dir, { "tasks/03_01_stray.md": "# task" })
  assert.match(fails("report", dir).error, /03_01_stray.md is not in the Task/)
})

test("report: a new task reusing a finished task's id is an error", () => {
  const dir = started()
  noSpec(dir)
  markDone(dir, "01_01_fix.md")
  place(dir, { "tasks/01_01_more.md": "# task" })

  assert.match(fails("report", dir).error, /01_01 is in both/)
})

test("report: a skipped spec makes the work one implicit task", () => {
  const dir = started()
  noSpec(dir)

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
  noSpec(dir)

  markDone(dir, "01_01_fix.md")
  ok("mark", dir, "execute", "done")
  assert.equal(ok("report", dir).next_action, "step:review")

  // An amendment in a run with no spec: its new task file is the index.
  ok("amend", dir)
  place(dir, { "tasks/01_02_copy.md": "# task" })

  const report = ok("report", dir)
  assert.deepEqual(report.tasks, {
    done: 1,
    remaining: 1,
    next_id: "01_02",
    next_file: join(dir, "tasks", "01_02_copy.md"),
  })
  assert.equal(report.next_action, "step:execute")
})

test("report: execute reopens when the spec gains a task", () => {
  const dir = started({ "spec.md": SPEC, ...TASKS })
  ok("mark", dir, "goals", "done")
  ok("mark", dir, "spec", "done")
  ok("mark", dir, "critic", "done")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")
  ok("mark", dir, "execute", "done")
  assert.equal(ok("report", dir).next_action, "step:review")

  place(dir, { "tasks/01_03_ship.md": "# task" })
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

test("mark: a skip takes no reason", () => {
  const dir = started()

  assert.match(
    fails("mark", dir, "critic", "skipped", "no spec").error,
    /usage/,
  )
  assert.equal(state(dir).steps.critic, null)
})

test("mark: unknown steps and states are rejected", () => {
  const dir = started()

  assert.match(fails("mark", dir, "mock", "done").error, /expected a step/)
  assert.match(fails("mark", dir, "sweep", "done").error, /expected a step/)
  assert.match(fails("mark", dir, "adherence", "done").error, /expected a step/)
  for (const step of ["goals", "review", "gate"])
    assert.match(fails("mark", dir, step, "skipped").error, /never skipped/)
  assert.match(fails("mark", dir, "goals", "approved").error, /done\|skipped/)
  fails("mark", dir, "goals")
  fails("mark", dir)
  assert.deepEqual(state(dir).steps.goals, null)
})

test("mark: execute closes only once every task is done, and never skips", () => {
  const dir = started({ "spec.md": SPEC, ...TASKS })
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

test("amend: reopens execute and counts up", () => {
  const dir = started({ "spec.md": SPEC, ...TASKS })
  for (const step of ["goals", "spec", "critic"]) ok("mark", dir, step, "done")
  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")
  ok("mark", dir, "execute", "done")
  ok("mark", dir, "review", "done")
  assert.equal(ok("report", dir).next_action, "step:gate")

  const result = ok("amend", dir)
  assert.equal(result.amendments, 1)
  assert.deepEqual(result.reopened, ["execute", "review"])

  const report = ok("report", dir)
  assert.equal(report.next_action, "step:execute")
  assert.equal(report.amendments, 1)

  const written = state(dir)
  assert.equal(written.steps.execute, null)
  assert.equal(written.steps.review, null) // the owner reviews the new work
  assert.equal(written.steps.critic, "done")

  assert.equal(ok("amend", dir).amendments, 2)
  fails("amend", dir, "--now")
})

test("report: tasks added after execute closed reopen it without amend", () => {
  const dir = started()
  noSpec(dir)
  commit(dir, sources(2))
  markDone(dir, "01_01_fix.md")
  ok("mark", dir, "execute", "done")
  ok("mark", dir, "review", "done")
  assert.equal(ok("report", dir).next_action, "step:gate")

  // A planner wrote the amendment's task, then the session ended before amend.
  const at = git(dirname(dir), "rev-parse", "HEAD")
  place(dir, { "tasks/02_01_more.md": "# task" })
  assert.equal(ok("report", dir).next_action, "step:execute")

  const written = state(dir)
  assert.equal(written.steps.execute, null)
  assert.equal(written.steps.review, null)
  assert.equal(written.checks_from, at)

  commit(dir, sources(1, "more"))
  markDone(dir, "02_01_more.md")
  assert.deepEqual(ok("report", dir).checks, {
    range: `${at}..HEAD`,
    slices: ["1–1"],
    fix_rounds_left: 2,
  })

  // The amend that follows keeps the range the reopen set.
  ok("amend", dir)
  assert.equal(state(dir).checks_from, at)
})

test("amend: --critic sends the new tasks through the critic first", () => {
  const dir = started({ "spec.md": SPEC, ...TASKS })
  for (const step of ["goals", "spec", "critic"]) ok("mark", dir, step, "done")

  assert.deepEqual(ok("amend", dir, "--critic").reopened, ["critic", "execute"])
  assert.equal(ok("report", dir).next_action, "step:critic")

  const bare = started()
  noSpec(bare)
  assert.match(fails("amend", bare, "--critic").error, /unskip spec and critic/)
})

test("amend: while execute is open, the round under way takes the new tasks", () => {
  const dir = started()
  noSpec(dir)
  commit(dir, sources(2))
  markDone(dir, "01_01_fix.md")

  ok("amend", dir)
  const report = ok("report", dir)
  assert.equal(report.checks.range, "origin/main...HEAD")
  assert.equal(state(dir).checks_from, null)
})

// --- checks and fix rounds -----------------------------------------------------

test("report: checks slice the branch diff once no task is left", () => {
  const dir = started({ "spec.md": SPEC, ...TASKS })
  for (const step of ["goals", "spec", "critic"]) ok("mark", dir, step, "done")
  commit(dir, sources(25))
  place(dir, { "notes.md": "not committed, not in the diff" })

  assert.equal(ok("report", dir).checks, null) // tasks remain

  markDone(dir, "01_01_setup.md")
  markDone(dir, "01_02_build.md")

  assert.deepEqual(ok("report", dir).checks, {
    range: "origin/main...HEAD",
    slices: ["1–20", "21–25"],
    fix_rounds_left: 2,
  })

  ok("mark", dir, "execute", "done")
  assert.equal(ok("report", dir).checks, null)
})

test("fix: each round's checks cover only its commits, two rounds at most", () => {
  const dir = started()
  noSpec(dir)
  commit(dir, sources(3))
  markDone(dir, "01_01_fix.md")

  assert.deepEqual(ok("fix", dir), { fix_rounds_left: 1 })
  assert.match(
    fails("mark", dir, "execute", "done").error,
    /committed nothing yet/,
  )
  const first = git(dirname(dir), "rev-parse", "HEAD")
  assert.deepEqual(ok("report", dir).checks, {
    range: `${first}..HEAD`,
    slices: [],
    fix_rounds_left: 1,
  })

  commit(dir, { "src/01.ts": "export const n = 0\n" })
  assert.deepEqual(ok("report", dir).checks.slices, ["1–1"])

  assert.deepEqual(ok("fix", dir), { fix_rounds_left: 0 })
  assert.match(fails("fix", dir).error, /2 fix rounds are spent/)
  assert.equal(state(dir).fix_rounds, 2)
  fails("fix", dir, "extra")
})

test("amend: its checks cover only its commits, with fresh fix rounds", () => {
  const dir = started()
  noSpec(dir)
  commit(dir, sources(3))
  markDone(dir, "01_01_fix.md")
  ok("fix", dir)
  commit(dir, { "src/01.ts": "export const n = 0\n" })
  ok("mark", dir, "execute", "done")

  ok("amend", dir)
  const at = git(dirname(dir), "rev-parse", "HEAD")
  place(dir, { "tasks/01_02_copy.md": "# task" })
  commit(dir, sources(2, "copy"))
  markDone(dir, "01_02_copy.md")

  assert.deepEqual(ok("report", dir).checks, {
    range: `${at}..HEAD`,
    slices: ["1–2"],
    fix_rounds_left: 2,
  })
})

// --- unskip -------------------------------------------------------------------

test("unskip: a skipped step runs in its turn again", () => {
  const dir = started()
  noSpec(dir)
  markDone(dir, "01_01_fix.md")
  assert.equal(ok("report", dir).next_action, "step:execute")

  assert.deepEqual(ok("unskip", dir, "spec"), { step: "spec", state: null })
  assert.equal(ok("report", dir).next_action, "step:spec")
  assert.equal(state(dir).steps.spec, null)
})

test("unskip: only a skipped step can be unskipped", () => {
  const dir = started()
  ok("mark", dir, "goals", "done")

  assert.match(fails("unskip", dir, "goals").error, /not skipped/)
  assert.match(fails("unskip", dir, "spec").error, /not skipped/)
  assert.match(fails("unskip", dir, "sweep").error, /expected a step/)
  fails("unskip", dir, "spec", "extra")
  assert.equal(state(dir).steps.goals, "done")
})

// --- push ---------------------------------------------------------------------

// A bare origin holding main, with origin/HEAD pointing at `head`.
function withOrigin(dir: string, head = "main"): string {
  const root = dirname(dir)
  const origin = mkdtempSync(join(tmpdir(), "mise-origin-"))
  tempDirs.push(origin)

  git(origin, "init", "-q", "--bare")
  git(root, "remote", "add", "origin", origin)
  git(root, "push", "-q", "origin", "main")
  if (head !== "main") git(root, "push", "-q", "origin", `main:${head}`)
  git(root, "fetch", "-q", "origin")
  git(
    root,
    "symbolic-ref",
    "refs/remotes/origin/HEAD",
    `refs/remotes/origin/${head}`,
  )

  return origin
}

test("push: force-pushes the branch with lease, rewritten history included", () => {
  const dir = miseDir()
  const origin = withOrigin(dir)
  commit(dir, sources(1))

  assert.deepEqual(ok("push", dir), { pushed: "feat/x" })

  git(dirname(dir), "commit", "-q", "--amend", "-m", "rewritten")
  ok("push", dir)
  assert.equal(
    git(origin, "rev-parse", "feat/x"),
    git(dirname(dir), "rev-parse", "HEAD"),
  )
  assert.equal(
    git(dirname(dir), "rev-parse", "--abbrev-ref", "@{u}"),
    "origin/feat/x",
  )
})

test("push: never main, master or origin's default branch", () => {
  const dir = miseDir()
  withOrigin(dir, "develop")
  const root = dirname(dir)

  for (const branch of ["main", "master", "develop"]) {
    git(root, "switch", "-q", "-C", branch)
    assert.match(fails("push", dir).error, new RegExp(`refusing.*${branch}`))
  }

  git(root, "switch", "-q", "--detach")
  assert.match(fails("push", dir).error, /detached/)
  fails("push", dir, "origin", "main")
})

test("push: a remote branch with commits this checkout lacks is not overwritten", () => {
  const dir = miseDir()
  const origin = withOrigin(dir)
  commit(dir, sources(1))
  ok("push", dir)

  // Someone else pushes to the branch; this checkout never fetches it.
  const other = mkdtempSync(join(tmpdir(), "mise-other-"))
  tempDirs.push(other)
  git(other, "clone", "-q", "-b", "feat/x", origin, ".")
  git(other, "commit", "-q", "--allow-empty", "-m", "theirs")
  git(other, "push", "-q", "origin", "feat/x")

  git(dirname(dir), "commit", "-q", "--amend", "-m", "ours")
  assert.match(fails("push", dir).error, /rejected|stale/)
  assert.equal(git(origin, "log", "-1", "--format=%s", "feat/x"), "theirs")
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

test("report: state files that break the schema are errors", () => {
  const good = {
    version: 3,
    started: "2026-09-22T00:00:00.000Z",
    base: "main",
    steps: { goals: null },
    amendments: 0,
    checks_from: null,
    fix_rounds: 0,
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
    { ...good, steps: { review: "skipped" } },
    { ...good, steps: { adherence: "done" } }, // not a step
    { ...good, base: "" },
    { ...good, checks_from: "HEAD~1" },
    { ...good, fix_rounds: 3 },
    { ...good, steps: "goals" },
    { ...good, skipReason: {} },
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

test("commands: only report --write opens a run", () => {
  const dir = miseDir({ "goals.md": "# goals" })

  for (const args of [
    ["mark", "goals", "done"],
    ["unskip", "spec"],
    ["fix"],
    ["amend"],
  ])
    assert.match(fails(args[0], dir, ...args.slice(1)).error, /no run is open/)

  assert.match(fails("report", dir, "--wirte").error, /usage/)
  assert.equal(existsSync(join(dir, ".workflow-state")), false)
})

test("commands: a missing mise directory fails", () => {
  assert.match(
    fails("mark", "/nonexistent/.mise", "goals", "done").error,
    /not found/,
  )
  fails("amend", "/nonexistent/.mise")
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
