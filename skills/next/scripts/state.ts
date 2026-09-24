#!/usr/bin/env node
// State engine for the `next` workflow skill (mise v3).
//
// Single reader/writer of `.mise/.workflow-state`. Node >= 24 runs it
// directly as `node state.ts <cmd>`.
// A state file that breaks the schema is an error, never rebuilt by inference.
//
// Every command's output stays small, with counts, one next task file and one
// slice per 20 files of diff, because the driver re-runs `report` at every
// step and keeps each result in its context.
//
// Commands (each prints JSON to stdout, and a failure prints {error} and exits 1):
//   report <dir> [--write]   in_flight, next_action, step_file, base, tasks, checks,
//                            amendments. --write initializes a fresh state file
//   mark <dir> <step> done|skipped
//   unskip <dir> <step>      a skipped step runs after all
//   fix <dir>                spends a fix round, so the next checks cover its commits
//   amend <dir> [--critic]   +1 amendment, reopens execute (and review, and
//                            with --critic the critic)
//   push <dir>               force-pushes the branch with lease, never main,
//                            master or origin's default branch

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

type StepState = "done" | "skipped" | null

interface State {
  version: 3
  started: string
  base: string
  steps: Record<string, StepState>
  amendments: number
  checks_from: string | null
  fix_rounds: number
}

const STEPS = "goals spec critic execute review gate".split(" ")
const NEVER_SKIPPED = "goals execute review gate".split(" ")
const ORDER = ["start", ...STEPS, "close"]
const FIELDS =
  "version started base steps amendments checks_from fix_rounds".split(" ")

const FIX_ROUNDS = 2
const SLICE = 20
const SHA = /^[0-9a-f]{40,64}$/

// A task file's name is its NN_MM id, a slug, then `.md`. In an index row it is a
// whole word, never the tail of a path the row lists among the files touched.
const TASK_FILE = /^\d{2}_\d{2}_[^\s`|/]*\.md$/
const TASK_REF = /(?:^|[\s`|(\[])(\d{2}_\d{2}_[^\s`|/()[\]]*\.md)/

const BROKEN_HINT =
  "restore .workflow-state from the last `mise:` checkpoint commit " +
  "(e.g. `git checkout .mise/.workflow-state`), or delete the " +
  "mise directory to abandon the work and start over"

function fail(message: string): never {
  console.log(JSON.stringify({ error: message }, null, 2))
  process.exit(1)
}

function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function emptySteps(): Record<string, StepState> {
  return Object.fromEntries(STEPS.map((step) => [step, null]))
}

function freshState(dir: string): State {
  return {
    version: 3,
    started: new Date().toISOString(),
    base: defaultBranch(dir),
    steps: emptySteps(),
    amendments: 0,
    checks_from: null,
    fix_rounds: 0,
  }
}

// Git runs in the repository that holds the mise directory.
function git(dir: string, args: string[], failure?: string): string {
  try {
    return execFileSync("git", args, {
      cwd: dirname(resolve(dir)),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim()
  } catch (error) {
    const lines = String((error as { stderr?: unknown }).stderr ?? "")
      .split("\n")
      .filter(Boolean)
    const reason = lines.find((l) => /error|fatal|rejected/.test(l)) ?? lines[0]

    fail(failure ?? `git ${args.join(" ")} failed: ${reason}`)
  }
}

// The branch the work merges into, recorded once so no step guesses it.
function defaultBranch(dir: string): string {
  const ref = git(
    dir,
    ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"],
    "origin/HEAD is not set — run `git remote set-head origin --auto`",
  )

  return ref.replace(/^origin\//, "")
}

// The engine is the only writer, so any deviation is a hand edit or another
// version's file, reported broken rather than repaired by inference.
function parseState(text: string): { state?: State; problems: string[] } {
  let data: unknown

  try {
    data = JSON.parse(text)
  } catch {
    return { problems: ["state file is not valid JSON"] }
  }

  if (!isObject(data)) return { problems: ["state file is not a JSON object"] }

  const r = data as Record<string, unknown>
  const problems: string[] = []
  const steps = emptySteps()

  for (const key of Object.keys(r))
    if (!FIELDS.includes(key)) problems.push(`unknown field "${key}"`)

  for (const key of FIELDS)
    if (!(key in r)) problems.push(`missing field "${key}"`)

  if (r.version !== 3) problems.push(`unsupported version ${str(r.version)}`)

  if (typeof r.started !== "string" || Number.isNaN(Date.parse(r.started)))
    problems.push("invalid started timestamp")

  if (typeof r.base !== "string" || !r.base) problems.push("invalid base")

  if (!Number.isInteger(r.amendments) || (r.amendments as number) < 0)
    problems.push("invalid amendments count")

  if (
    r.checks_from !== null &&
    (typeof r.checks_from !== "string" || !SHA.test(r.checks_from))
  )
    problems.push("invalid checks_from")

  if (
    !Number.isInteger(r.fix_rounds) ||
    (r.fix_rounds as number) < 0 ||
    (r.fix_rounds as number) > FIX_ROUNDS
  )
    problems.push("invalid fix_rounds")

  if (!isObject(r.steps)) problems.push("steps is not an object")
  else
    for (const [key, value] of Object.entries(r.steps as object)) {
      if (!STEPS.includes(key)) problems.push(`unknown step "${key}" in steps`)
      else if (value === null) continue
      else if (NEVER_SKIPPED.includes(key) && value === "skipped")
        problems.push(`steps.${key} is never skipped`)
      else if (value === "done" || value === "skipped") steps[key] = value
      else problems.push(`invalid value for steps.${key}`)
    }

  if (problems.length) return { problems }

  return {
    state: {
      version: 3,
      started: r.started as string,
      base: r.base as string,
      steps,
      amendments: r.amendments as number,
      checks_from: r.checks_from as string | null,
      fix_rounds: r.fix_rounds as number,
    },
    problems: [],
  }
}

function str(value: unknown): string {
  return JSON.stringify(value) ?? "undefined"
}

// Only `report` sees a run the state file does not hold yet. Every other
// command needs the run opened by `report --write`.
function loadState(
  dir: string,
  fresh = false,
): { state: State; file: "ok" | "new" } {
  if (!existsSync(dir)) fail(`mise directory not found: ${dir}`)

  const statePath = join(dir, ".workflow-state")

  // A fresh start has at most goals.md. A spec or task files without a state
  // file mean the file was lost, an error rather than a new run.
  if (!existsSync(statePath)) {
    if (existsSync(join(dir, "spec.md")) || existsSync(join(dir, "tasks")))
      fail(`state file missing but workflow artifacts exist — ${BROKEN_HINT}`)

    if (!fresh) fail("no run is open — open it with `report .mise --write`")

    return { state: freshState(dir), file: "new" }
  }

  const { state, problems } = parseState(readFileSync(statePath, "utf8"))

  if (!state)
    fail(`state file is broken (${problems.join("; ")}) — ${BROKEN_HINT}`)

  return { state, file: "ok" }
}

function writeState(dir: string, state: State): void {
  const path = join(dir, ".workflow-state")
  writeFileSync(path, JSON.stringify(state, null, 2) + "\n")
}

// The task files sitting directly in one directory, sorted.
function taskFiles(dir: string): string[] {
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter((file) => TASK_FILE.test(file))
    .sort()
}

// The task files spec.md's `## Task index` names, one per row, in row order.
function indexedFiles(dir: string): string[] {
  const spec = join(dir, "spec.md")

  if (!existsSync(spec)) return []

  const section = readFileSync(spec, "utf8")
    .split(/^##\s+/m)
    .find((part) => /^Task index/i.test(part))
  const files: string[] = []

  for (const line of section?.split("\n") ?? []) {
    const file = line.match(TASK_REF)?.[1]

    if (file && !files.includes(file)) files.push(file)
  }

  return files
}

interface Progress {
  done: number
  remaining: string[]
  next: { id: string; file: string | null } | null
}

// A task is done exactly when its file sits in tasks/done/, never by a mark.
// With a spec the tasks are the files its index names, and a done file it does
// not name is ignored. With no spec the task files are the tasks, starting at
// one implicit task whose file execute writes.
function taskProgress(dir: string, state: State): Progress {
  const open = taskFiles(join(dir, "tasks"))
  const finished = taskFiles(join(dir, "tasks/done"))
  const id = (file: string) => file.slice(0, 5)
  const reused = open.find((file) => finished.some((f) => id(f) === id(file)))

  if (reused)
    fail(
      `task ${id(reused)} is in both tasks/ and tasks/done/ — renumber the new one`,
    )

  let files: string[]

  if (state.steps.spec === "skipped") {
    files = [...open, ...finished].sort()

    if (!files.length)
      return {
        done: 0,
        remaining: ["01_01"],
        next: { id: "01_01", file: null },
      }
  } else {
    files = indexedFiles(dir)

    if (state.steps.spec === "done") {
      if (!files.length)
        fail("spec.md's ## Task index names no task file (NN_MM_<slug>.md)")

      const missing = files.filter(
        (file) => !open.includes(file) && !finished.includes(file),
      )

      if (missing.length)
        fail(`the Task index lists ${missing.join(", ")} with no such file`)

      const unlisted = open.find((file) => !files.includes(file))

      if (unlisted) fail(`tasks/${unlisted} is not in the Task index`)
    }
  }

  const remaining = files.filter((file) => !finished.includes(file))
  const first = remaining[0]

  return {
    done: files.length - remaining.length,
    remaining: remaining.map(id),
    next: first ? { id: id(first), file: join(dir, "tasks", first) } : null,
  }
}

// The first step in order that is still open. Execute stays open while tasks
// remain, and after the last one until its checks mark it done.
function nextAction(state: State, remaining: string[]): string {
  for (const step of STEPS) {
    if (step === "execute") {
      if (remaining.length || state.steps.execute !== "done")
        return "step:execute"
    } else if (state.steps[step] === null) return `step:${step}`
  }

  return "close"
}

// The work no round has checked yet, sliced 20 files at a time. That is the
// whole branch against the latest fetched base, then only what the last fix
// round or amendment committed.
function checks(dir: string, state: State): object {
  const range = state.checks_from
    ? `${state.checks_from}..HEAD`
    : `origin/${state.base}...HEAD`
  const files = git(dir, ["diff", "--name-only", range, "--", ".", ":!.mise"])
  const count = files ? files.split("\n").length : 0
  const slices: string[] = []

  for (let first = 1; first <= count; first += SLICE)
    slices.push(`${first}–${Math.min(first + SLICE - 1, count)}`)

  return { range, slices, fix_rounds_left: FIX_ROUNDS - state.fix_rounds }
}

// The file the driver reads for a step, numbered by the step's place in the run.
function stepFile(step: string): string {
  const n = String(ORDER.indexOf(step) + 1).padStart(2, "0")

  return join(import.meta.dirname, "..", "steps", `${n}-${step}.md`)
}

// Work is in flight exactly when the mise directory exists with content.
function report(dir: string, rest: string[]): object {
  if (rest.some((arg) => arg !== "--write"))
    fail("usage: state.ts report .mise [--write]")

  if (!existsSync(dir) || readdirSync(dir).length === 0)
    return { in_flight: false }

  const { state, file } = loadState(dir, true)
  const { done, remaining, next } = taskProgress(dir, state)

  // New tasks after execute closed reopen it even when `amend` never ran, so
  // their checks and the owner's review are never skipped.
  if (file === "ok" && state.steps.execute === "done" && remaining.length) {
    reopen(dir, state)
    writeState(dir, state)
  }

  const next_action = nextAction(state, remaining)

  if (rest.includes("--write") && file === "new") writeState(dir, state)

  return {
    in_flight: true,
    next_action,
    step_file: stepFile(next_action.replace(/^step:/, "")),
    base: state.base,
    tasks: {
      done,
      remaining: remaining.length,
      next_id: next?.id ?? null,
      next_file: next?.file ?? null,
    },
    checks:
      next_action === "step:execute" && !remaining.length
        ? checks(dir, state)
        : null,
    amendments: state.amendments,
  }
}

function mark(dir: string, rest: string[]): object {
  const [step, value] = rest

  if (!STEPS.includes(step))
    fail(`expected a step (${STEPS.join(", ")}), got ${str(step)}`)

  if (value !== "done" && value !== "skipped")
    fail(`expected done|skipped, got ${str(value)}`)

  if (NEVER_SKIPPED.includes(step) && value === "skipped")
    fail(`${step} is never skipped`)

  if (rest.length > 2) fail("usage: state.ts mark .mise <step> done|skipped")

  const { state } = loadState(dir)

  state.steps[step] = value

  // Checked against the state as marked, so `spec done` validates the index.
  const { remaining } = taskProgress(dir, state)

  if (step === "execute" && remaining.length)
    fail(`execute has ${remaining.length} task(s) left, next ${remaining[0]}`)

  // A fix round or amendment that has committed nothing has not run yet.
  if (
    step === "execute" &&
    state.checks_from &&
    state.checks_from === git(dir, ["rev-parse", "HEAD"])
  )
    fail("the last fix round or amendment has committed nothing yet")

  writeState(dir, state)

  return { step, state: value }
}

// An amendment can make a skip condition false, so the skipped step runs in
// its turn. Only a skip is undone, never a done step.
function unskip(dir: string, rest: string[]): object {
  const [step] = rest

  if (!STEPS.includes(step))
    fail(`expected a step (${STEPS.join(", ")}), got ${str(step)}`)

  if (rest.length > 1) fail("usage: state.ts unskip .mise <step>")

  const { state } = loadState(dir)

  if (state.steps[step] !== "skipped") fail(`${step} is not skipped`)

  state.steps[step] = null
  writeState(dir, state)

  return { step, state: null }
}

// The next round of checks covers only what this fix round commits.
function fix(dir: string, rest: string[]): object {
  if (rest.length) fail("usage: state.ts fix .mise")

  const { state } = loadState(dir)

  if (state.fix_rounds >= FIX_ROUNDS)
    fail(`all ${FIX_ROUNDS} fix rounds are spent`)

  state.fix_rounds += 1
  state.checks_from = git(dir, ["rev-parse", "HEAD"])
  writeState(dir, state)

  return { fix_rounds_left: FIX_ROUNDS - state.fix_rounds }
}

// An amendment changes a recorded decision, so its tasks run through execute
// and the owner reviews them. --critic sends them through the critic first.
function amend(dir: string, rest: string[]): object {
  if (rest.some((arg) => arg !== "--critic"))
    fail("usage: state.ts amend .mise [--critic]")

  const { state } = loadState(dir)
  const critic = rest.includes("--critic")

  if (critic && state.steps.spec !== "done")
    fail("--critic needs a written spec — unskip spec and critic instead")

  const reopened = reopen(dir, state)

  if (critic) {
    state.steps.critic = null
    reopened.unshift("critic")
  }

  state.amendments += 1
  writeState(dir, state)

  return { amendments: state.amendments, reopened }
}

// Reopens execute, and review once the owner has closed it. When execute had
// closed, the next checks cover only what commits from here on, with fresh fix
// rounds. While it is still open, the round under way takes the new tasks in.
function reopen(dir: string, state: State): string[] {
  const reopened = ["execute"]

  if (state.steps.review === "done") reopened.push("review")

  if (state.steps.execute === "done") {
    state.checks_from = git(dir, ["rev-parse", "HEAD"])
    state.fix_rounds = 0
  }

  for (const step of reopened) state.steps[step] = null

  return reopened
}

// The run's force push, right after each gate rebase rewrote the branch. It
// reads the branch from the checkout, and the refspec names that branch on
// both sides, so no call can reach main, master or origin's default branch.
function push(dir: string, rest: string[]): object {
  if (rest.length) fail("usage: state.ts push .mise")

  const branch = git(dir, ["branch", "--show-current"])

  if (!branch) fail("HEAD is detached — there is no branch to push")

  if (["main", "master", defaultBranch(dir)].includes(branch))
    fail(`refusing to force-push ${branch}`)

  git(dir, [
    "push",
    "--force-with-lease",
    "--force-if-includes",
    "-u",
    "origin",
    `${branch}:refs/heads/${branch}`,
  ])

  return { pushed: branch }
}

type Command = (dir: string, rest: string[]) => object

const COMMANDS: Record<string, Command | undefined> = {
  report,
  mark,
  unskip,
  fix,
  amend,
  push,
}

const [cmd, dir, ...rest] = process.argv.slice(2)
const command = COMMANDS[cmd ?? ""]

if (!command || !dir)
  fail("usage: state.ts <report|mark|unskip|fix|amend|push> <dir> [args]")

console.log(JSON.stringify(command(dir, rest), null, 2))
