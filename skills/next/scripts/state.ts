#!/usr/bin/env node
// State engine for the `next` workflow skill (mise v3).
//
// Single reader/writer of `.mise/.workflow-state` and the only appender of
// `.mise/ledger.jsonl`. Node >= 24 runs it directly: `node state.ts <cmd>`.
// No hashes, no cascade: a broken or hand-edited state file is an error, never
// rebuilt by inference.
//
// Every command's output is bounded: counts and one next task file, never a
// list that grows with the run, because the driver re-runs `report` at every
// step and keeps each result in its context.
//
// Commands (each prints JSON to stdout; failures print {error} and exit 1):
//   report <dir> [--write]   in_flight, next_action, tasks, amendments;
//                            --write initializes a fresh state file
//   mark <dir> <step> done|skipped   execute is never marked: it is derived
//                            from spec.md `## Task index` vs tasks/done/; a
//                            skip's reason belongs to the ledger, not the state
//   amend <dir> "<text>"     +1 amendment, reopens adherence and sweep, logs it
//   log <dir> <json>         appends one timestamped ledger event
//   tally <dir>…             counts archived ledgers by event, step and detail,
//                            with the runs and projects each row spans

import {
  appendFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"

type StepState = "done" | "skipped" | null

interface State {
  version: 3
  started: string
  steps: Record<string, StepState>
  amendments: number
}

const STEPS = "goals spec critic execute adherence sweep review gate".split(" ")
const EVENTS = "run spawn finding stop feedback skip amend gate close".split(
  " ",
)
const FIELDS = "version started steps amendments".split(" ")

const TASK_FILE = /^(\d{2}_\d{2})_.*\.md$/
const TASK_REF = /(\d{2}_\d{2})_[^\s`]*\.md/g

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

function freshState(): State {
  return {
    version: 3,
    started: new Date().toISOString(),
    steps: emptySteps(),
    amendments: 0,
  }
}

// Strict parse: the engine is the only writer, so any deviation means the file
// was hand-edited or written by another version — it is reported broken and
// restored from git, never repaired by inference.
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

  if (!Number.isInteger(r.amendments) || (r.amendments as number) < 0)
    problems.push("invalid amendments count")

  if (!isObject(r.steps)) problems.push("steps is not an object")
  else
    for (const [key, value] of Object.entries(r.steps as object)) {
      if (!STEPS.includes(key)) problems.push(`unknown step "${key}" in steps`)
      else if (value === null) continue
      else if (key === "execute")
        problems.push(
          "steps.execute is derived from tasks/done/, never recorded",
        )
      else if (value === "done" || value === "skipped") steps[key] = value
      else problems.push(`invalid value for steps.${key}`)
    }

  if (problems.length) return { problems }

  return {
    state: {
      version: 3,
      started: r.started as string,
      steps,
      amendments: r.amendments as number,
    },
    problems: [],
  }
}

function str(value: unknown): string {
  return JSON.stringify(value) ?? "undefined"
}

function loadState(dir: string): { state: State; file: "ok" | "new" } {
  if (!existsSync(dir)) fail(`mise directory not found: ${dir}`)

  const statePath = join(dir, ".workflow-state")

  // Fresh start: only goals.md (at most) exists. A spec or task files without a
  // state file mean the file was lost — an error, not a new run.
  if (!existsSync(statePath)) {
    if (existsSync(join(dir, "spec.md")) || existsSync(join(dir, "tasks")))
      fail(`state file missing but workflow artifacts exist — ${BROKEN_HINT}`)

    return { state: freshState(), file: "new" }
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

function appendLedger(dir: string, event: Record<string, unknown>): object {
  const entry = { t: new Date().toISOString(), ...event }
  appendFileSync(join(dir, "ledger.jsonl"), JSON.stringify(entry) + "\n")

  return entry
}

// IDs are the leading NN_MM of the task filenames listed under `## Task index`
// in spec.md, in order of first appearance. With no spec there is no index: the
// task files are, starting at one implicit task an amendment can add to.
function taskIndexIds(dir: string, state: State): string[] {
  if (state.steps.spec === "skipped") {
    const ids = [
      ...new Set([...taskFileIds(join(dir, "tasks")), ...doneTaskIds(dir)]),
    ].sort()

    return ids.length ? ids : ["01_01"]
  }

  const spec = join(dir, "spec.md")

  if (!existsSync(spec)) return []

  const section = readFileSync(spec, "utf8")
    .split(/^##\s+/m)
    .find((part) => /^Task index/i.test(part))
  const ids: string[] = []

  for (const match of section?.matchAll(TASK_REF) ?? [])
    if (!ids.includes(match[1])) ids.push(match[1])

  return ids
}

// The ids of the NN_MM task files sitting directly in one directory.
function taskFileIds(dir: string): string[] {
  if (!existsSync(dir)) return []

  const ids: string[] = []

  for (const file of readdirSync(dir)) {
    const match = file.match(TASK_FILE)

    if (match && !ids.includes(match[1])) ids.push(match[1])
  }

  return ids
}

// A task is done exactly when its file sits in tasks/done/ — completion is read
// straight from the filesystem, never marked.
function doneTaskIds(dir: string): string[] {
  return taskFileIds(join(dir, "tasks/done"))
}

// The path of one task's file, relative to the mise directory, so the driver
// can open the next task without listing tasks/ or re-reading the task index.
function taskFile(dir: string, id: string | undefined): string | null {
  if (!id) return null

  const tasks = join(dir, "tasks")

  if (!existsSync(tasks)) return null

  const name = readdirSync(tasks).find((f) => f.match(TASK_FILE)?.[1] === id)

  return name ? join("tasks", name) : null
}

// The first step in order that is still open; execute is open exactly while the
// task index holds ids that are not in tasks/done/.
function nextAction(state: State, remaining: string[]): string {
  for (const step of STEPS) {
    if (step === "execute") {
      if (remaining.length) return "step:execute"
    } else if (state.steps[step] === null) return `step:${step}`
  }

  return "close"
}

// in_flight: work is in flight exactly when the mise directory exists with
// content — a missing or empty directory means none, and nothing to report on.
function report(dir: string, rest: string[]): object {
  if (!existsSync(dir) || readdirSync(dir).length === 0)
    return { in_flight: false }

  const { state, file } = loadState(dir)
  const ids = taskIndexIds(dir, state)
  const done = doneTaskIds(dir).filter((id) => ids.includes(id))
  const remaining = ids.filter((id) => !done.includes(id))

  if (rest.includes("--write") && file === "new") writeState(dir, state)

  return {
    in_flight: true,
    next_action: nextAction(state, remaining),
    tasks: {
      done: done.length,
      remaining: remaining.length,
      next_id: remaining[0] ?? null,
      next_file: taskFile(dir, remaining[0]),
    },
    amendments: state.amendments,
  }
}

// A skip's reason is ledger material — the driver logs the `skip` event with it
// — so the state keeps the value alone and nothing here reads a reason back.
function mark(dir: string, rest: string[]): object {
  const [step, value] = rest

  if (!STEPS.includes(step))
    fail(`expected a step (${STEPS.join(", ")}), got ${str(step)}`)

  if (step === "execute")
    fail("execute is derived from tasks/done/ and is never marked")

  if (value !== "done" && value !== "skipped")
    fail(`expected done|skipped, got ${str(value)}`)

  if (rest.length > 2)
    fail(`mark takes no reason — log a skip event with it instead`)

  const { state } = loadState(dir)

  state.steps[step] = value
  writeState(dir, state)

  return { step, state: value }
}

// An amendment changes a recorded decision: nothing is re-approved or
// re-critiqued, but the driver re-answers the skip conditions for adherence and
// sweep, so both reopen.
function amend(dir: string, rest: string[]): object {
  const text = rest.join(" ").trim()

  if (!text) fail('usage: state.ts amend .mise "<text>"')

  const { state } = loadState(dir)
  const reopened = ["adherence", "sweep"]

  state.amendments += 1

  for (const step of reopened) state.steps[step] = null

  writeState(dir, state)
  appendLedger(dir, { event: "amend", text })

  return { amendments: state.amendments, reopened }
}

function log(dir: string, rest: string[]): object {
  if (!existsSync(dir)) fail(`mise directory not found: ${dir}`)

  let data: unknown

  try {
    data = JSON.parse(rest[0] ?? "")
  } catch {
    fail(`log expects one JSON object, got ${str(rest[0] ?? "")}`)
  }

  if (!isObject(data)) fail("log expects a JSON object")

  const event = data as Record<string, unknown>

  if (!EVENTS.includes(event.event as string))
    fail(`unknown ledger event ${str(event.event)} (${EVENTS.join("|")})`)

  if ("t" in event) fail("the ledger timestamp is set by the engine")

  return appendLedger(dir, event)
}

// Fifty accumulated ledgers run to tens of thousands of lines, so the retro
// never opens one: it reads these counts. Rows group on the fields that repeat
// across runs; free text (reason, text, issue) is left out, since one row
// per distinct wording would be the ledger again rather than an aggregate.
const DETAIL = "role source category changed kind verdict command pass".split(
  " ",
)

interface Row {
  event: string
  step: string | null
  detail: string
  count: number
  runs: Set<string>
  projects: Set<string>
}

function tally(dir: string, rest: string[]): object {
  const dirs = [dir, ...rest]
  const rows = new Map<string, Row>()
  const projects = new Set<string>()
  let ledgers = 0
  let events = 0
  let unreadable = 0

  for (const d of dirs) {
    if (!existsSync(d)) fail(`ledger directory not found: ${d}`)

    for (const name of readdirSync(d).filter((f) => f.endsWith(".jsonl"))) {
      ledgers += 1
      projects.add(d)

      for (const line of readFileSync(join(d, name), "utf8").split("\n")) {
        if (!line.trim()) continue

        let entry: Record<string, unknown>

        try {
          entry = JSON.parse(line)
        } catch {
          unreadable += 1
          continue
        }

        if (!isObject(entry) || typeof entry.event !== "string") {
          unreadable += 1
          continue
        }

        events += 1

        const step = typeof entry.step === "string" ? entry.step : null
        const detail = DETAIL.filter((k) => entry[k] !== undefined)
          .map((k) => `${k}=${String(entry[k]).slice(0, 24)}`)
          .join(" ")
        const key = [entry.event, step, detail].join("\u0000")
        const row = rows.get(key) ?? {
          event: entry.event,
          step,
          detail,
          count: 0,
          runs: new Set<string>(),
          projects: new Set<string>(),
        }

        row.count += 1
        row.runs.add(join(d, name))
        row.projects.add(d)
        rows.set(key, row)
      }
    }
  }

  const sorted = [...rows.values()].sort(
    (a, b) => b.count - a.count || a.event.localeCompare(b.event),
  )

  return {
    ledgers,
    projects: projects.size,
    events,
    ...(unreadable ? { unreadable } : {}),
    rows_total: sorted.length,
    // 50 rows is already more issues than one retro table can act on.
    rows: sorted.slice(0, 50).map((row) => ({
      event: row.event,
      step: row.step,
      detail: row.detail,
      count: row.count,
      runs: row.runs.size,
      projects: row.projects.size,
    })),
  }
}

type Command = (dir: string, rest: string[]) => object

const COMMANDS: Record<string, Command | undefined> = {
  report,
  mark,
  amend,
  log,
  tally,
}

const [cmd, dir, ...rest] = process.argv.slice(2)
const command = COMMANDS[cmd ?? ""]

if (!command || !dir)
  fail("usage: state.ts <report|mark|amend|log|tally> <dir> [args]")

console.log(JSON.stringify(command(dir, rest), null, 2))
