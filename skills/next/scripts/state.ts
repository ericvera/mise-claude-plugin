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
//   mark <dir> <step> done|skipped
//   amend <dir> "<text>"     +1 amendment, reopens execute and adherence, logs it
//   log <dir> <json>         appends one ledger event: EVENT_FIELDS below
//   tally <dir>…             counts archived ledgers (searched recursively) by
//                            event, step and detail, with the runs, projects,
//                            average seconds and example free text of each row
//
// The engine stamps every event with `t` and with `seconds` since the event
// before it, so no duration is ever model-reported: a spawn's seconds is its
// run time, a stop's is the owner's wait.

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

const STEPS = "goals spec critic execute adherence review gate".split(" ")
const FIELDS = "version started steps amendments".split(" ")

// The ledger's schema: `log` takes exactly these fields, and no others, so the
// rows the retro tallies compare across runs and projects.
const EVENT_FIELDS: Record<string, string[] | undefined> = {
  run: ["repo", "branch", "version"],
  spawn: ["role", "step", "round", "verdict"],
  skip: ["step", "reason"],
  finding: ["source", "step", "round", "category", "changed"],
  stop: ["step", "reason"],
  feedback: ["step", "kind", "issue"],
  gate: ["command", "pass"],
  close: ["codeLines", "artifactLines"],
  amend: ["text"],
}

const ROLES = ["implementer", "reviewer", "critic", "adherence"]

type Check = [expected: string, test: (value: unknown) => boolean]

const oneOf = (values: string[]): Check => [
  values.join("|"),
  (v) => values.includes(v as string),
]

const atLeast = (min: 0 | 1): Check => [
  min ? "a positive integer" : "a non-negative integer",
  (v) => Number.isInteger(v) && (v as number) >= min,
]

const BOOLEAN: Check = ["true|false", (v) => typeof v === "boolean"]

// A field's allowed values: a typo or a variant spelling would split the retro's
// tally rows, so `log` refuses it. Fields not listed take any non-empty string.
const FIELD_CHECKS: Record<string, Check> = {
  step: oneOf(["start", ...STEPS, "close"]),
  role: oneOf(ROLES),
  source: oneOf(ROLES),
  kind: oneOf(["point", "pattern", "decision", "voided"]),
  round: atLeast(1),
  changed: BOOLEAN,
  pass: BOOLEAN,
  codeLines: atLeast(0),
  artifactLines: atLeast(0),
}

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
      else if (key === "execute" && value === "skipped")
        problems.push("steps.execute is never skipped")
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
  const now = new Date()
  const previous = lastLedgerTime(join(dir, "ledger.jsonl"))
  const entry = {
    t: now.toISOString(),
    ...event,
    ...(previous === null
      ? {}
      : {
          seconds: Math.max(0, Math.round((now.getTime() - previous) / 1000)),
        }),
  }
  appendFileSync(join(dir, "ledger.jsonl"), JSON.stringify(entry) + "\n")

  return entry
}

// The time of the ledger's last event, or null when there is none to time from.
function lastLedgerTime(path: string): number | null {
  if (!existsSync(path)) return null

  const last = readFileSync(path, "utf8").trimEnd().split("\n").at(-1)

  try {
    const time = Date.parse(JSON.parse(last ?? "").t)

    return Number.isNaN(time) ? null : time
  } catch {
    return null
  }
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

// The index's done and remaining task ids; a done file the index does not list
// is ignored.
function taskProgress(
  dir: string,
  state: State,
): { done: string[]; remaining: string[] } {
  const ids = taskIndexIds(dir, state)
  const done = doneTaskIds(dir).filter((id) => ids.includes(id))

  return { done, remaining: ids.filter((id) => !done.includes(id)) }
}

// The first step in order that is still open; execute stays open while the task
// index holds ids that are not in tasks/done/, and after the last task until its
// review marks it done — so a resume never skips that review.
function nextAction(state: State, remaining: string[]): string {
  for (const step of STEPS) {
    if (step === "execute") {
      if (remaining.length || state.steps.execute !== "done")
        return "step:execute"
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
  const { done, remaining } = taskProgress(dir, state)

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

  if (value !== "done" && value !== "skipped")
    fail(`expected done|skipped, got ${str(value)}`)

  if (step === "execute" && value === "skipped")
    fail("execute is never skipped")

  if (rest.length > 2)
    fail(`mark takes no reason — log a skip event with it instead`)

  const { state } = loadState(dir)

  if (step === "execute") {
    const { remaining } = taskProgress(dir, state)

    if (remaining.length)
      fail(`execute has ${remaining.length} task(s) left, next ${remaining[0]}`)
  }

  state.steps[step] = value
  writeState(dir, state)

  return { step, state: value }
}

// An amendment changes a recorded decision: nothing is re-approved or
// re-critiqued, but its tasks run through execute and its review, and the
// driver re-answers the adherence skip condition, so both steps reopen.
function amend(dir: string, rest: string[]): object {
  const text = rest.join(" ").trim()

  if (!text) fail('usage: state.ts amend .mise "<text>"')

  const { state } = loadState(dir)
  const reopened = ["execute", "adherence"]

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
  const name = event.event
  const fields = EVENT_FIELDS[name as string]

  if (!fields)
    fail(
      `unknown ledger event ${str(name)} (${Object.keys(EVENT_FIELDS).join("|")})`,
    )

  if (name === "amend") fail("an amend event is written by `state.ts amend`")

  if ("t" in event || "seconds" in event)
    fail("the ledger timestamp and seconds are set by the engine")

  const given = Object.keys(event).filter((key) => key !== "event")
  const missing = fields.filter((key) => !given.includes(key))
  const unknown = given.filter((key) => !fields.includes(key))

  if (missing.length || unknown.length)
    fail(
      `a ${name} event takes exactly ${fields.join(", ")}` +
        (missing.length ? `; missing ${missing.join(", ")}` : "") +
        (unknown.length ? `; unknown ${unknown.join(", ")}` : ""),
    )

  for (const key of fields) {
    const check = FIELD_CHECKS[key]
    const value = event[key]

    if (check ? !check[1](value) : typeof value !== "string" || !value.trim())
      fail(
        `${name} ${key} must be ${check ? check[0] : "a non-empty string"}, got ${str(value)}`,
      )
  }

  return appendLedger(dir, event)
}

// Fifty accumulated ledgers run to tens of thousands of lines, so the retro
// never opens one: it reads these counts. Rows group on the fields that repeat
// across runs; free text (reason, text, issue) is left out, since one row
// per distinct wording would be the ledger again rather than an aggregate; each
// row instead carries a few examples of it, enough to name what went wrong.
const FREE_TEXT = ["issue", "reason", "text"]
const EXAMPLES = 3
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
  seconds: number[]
  examples: Set<string>
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

    // Ledgers archive under their branch name, so `feat/x.jsonl` sits in a
    // subdirectory.
    const names = readdirSync(d, { recursive: true, encoding: "utf8" })

    for (const name of names.filter((f) => f.endsWith(".jsonl")).sort()) {
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
          seconds: [],
          examples: new Set<string>(),
        }

        row.count += 1

        if (typeof entry.seconds === "number") row.seconds.push(entry.seconds)

        for (const k of FREE_TEXT)
          if (typeof entry[k] === "string" && row.examples.size < EXAMPLES)
            row.examples.add(entry[k].slice(0, 100))

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
      ...(row.seconds.length
        ? {
            avg_seconds: Math.round(
              row.seconds.reduce((a, b) => a + b, 0) / row.seconds.length,
            ),
          }
        : {}),
      ...(row.examples.size ? { examples: [...row.examples] } : {}),
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
