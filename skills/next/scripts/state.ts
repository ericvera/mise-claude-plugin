#!/usr/bin/env node
// State engine for the `next` workflow skill.
//
// The single reader/writer of `.workflow-state` files. Requires Node >= 24,
// which executes TypeScript directly: `node state.ts <cmd> <mise-dir> ...`.
// <mise-dir> is the workflow's single working directory from the config.
// Human-readable spec: ../../../docs/state-machine.md
//
// Commands (all print a JSON report to stdout):
//   report  <mise-dir> [--write]        is work in flight (in_flight:
//                                       true | false)? If so: verify recorded
//                                       approval hashes, apply the mismatch
//                                       cascade, compute next_action.
//                                       Read-only unless --write.
//   approve <mise-dir> goals route=<r>  hash the stage artifact and record the
//   approve <mise-dir> <other-stage>    approval; goals also records the route
//                                       (full | direct | bugfix). A changed
//                                       re-approval deletes every later
//                                       stage's approval; a plan approval
//                                       whose hash doesn't match the recorded
//                                       one also clears the done/ directory.
//   approve <mise-dir> acceptance       record the user's acceptance
//                                       confirmation, hashed over every route
//                                       stage's artifact plus the done/
//                                       listing — any later doc or task
//                                       change makes it stale, and an
//                                       observed mismatch or changed approval
//                                       deletes it outright, so the
//                                       acceptance pass re-runs.
//
// A task is done exactly when its file has been moved to
// <mise-dir>/implementation_plan/done/ — completion is read straight from the
// filesystem. A broken or unexpectedly missing state file is an error, never
// rebuilt by inference: the caller restores it from the last `mise:`
// checkpoint commit (every state change is committed) or deletes the mise
// directory and starts the work over.

import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { createHash } from "node:crypto"
import { join } from "node:path"

type Stage = "goals" | "mock" | "requirements" | "plan"
type Route = "full" | "direct" | "bugfix"

const STAGES: Stage[] = ["goals", "mock", "requirements", "plan"]
const ROUTES: Route[] = ["full", "direct", "bugfix"]

const ARTIFACTS: Record<Stage, string[]> = {
  goals: ["goals.md"],
  mock: ["mocks.html", "mocks.context.md"],
  requirements: ["requirements.md"],
  plan: ["implementation_plan/00_overview.md"],
}

interface State {
  route?: Route
  approved: Partial<Record<Stage, string>>
  accepted?: string
}

const TASK_FILE = /^(\d{2}_\d{2})_.*\.md$/
const SHA1_HEX = /^[0-9a-f]{40}$/

const BROKEN_HINT =
  "restore .workflow-state from the last `mise:` checkpoint commit " +
  "(e.g. `git checkout <mise-directory>/.workflow-state`), or delete the " +
  "mise directory to abandon the work and start over"

function fail(message: string): never {
  console.log(JSON.stringify({ error: message }, null, 2))
  process.exit(1)
}

// Which stages participate, by route. Route unset behaves like direct — it
// only lasts until the goals approval, which always records the route.
function stageOrder(route?: string): Stage[] {
  if (route === "full") {
    return STAGES
  }

  if (route === "bugfix") {
    return ["goals", "plan"]
  }

  return STAGES.filter((s) => s !== "mock")
}

// SHA-1 of the artifact bytes; for multi-file stages, of the concatenation in
// ARTIFACTS order (equivalent to `cat <files> | shasum`). Null if any file is
// missing — a missing artifact is a mismatch, never a shell error.
function hashStage(dir: string, stage: Stage): string | null {
  const bufs: Buffer[] = []

  for (const f of ARTIFACTS[stage]) {
    const p = join(dir, f)

    if (!existsSync(p)) {
      return null
    }

    bufs.push(readFileSync(p))
  }

  return createHash("sha1").update(Buffer.concat(bufs)).digest("hex")
}

// Strict parse: the engine is the only writer, so any semantic deviation
// means the file was edited by hand or written by an older engine — it is
// reported broken and restored from git, never repaired by inference.
function parseState(text: string): { state?: State; problems: string[] } {
  let data: unknown

  try {
    data = JSON.parse(text)
  } catch {
    return { problems: ["state file is not valid JSON"] }
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { problems: ["state file is not a JSON object"] }
  }

  const problems: string[] = []
  const record = data as Record<string, unknown>

  for (const key of Object.keys(record)) {
    if (key !== "route" && key !== "approved" && key !== "accepted") {
      problems.push(`unknown field "${key}"`)
    }
  }

  if ("route" in record && !ROUTES.includes(record.route as Route)) {
    problems.push(`invalid route "${String(record.route)}"`)
  }

  const state: State = { approved: {} }

  if (ROUTES.includes(record.route as Route)) {
    state.route = record.route as Route
  }

  if ("approved" in record) {
    const approved = record.approved

    if (
      typeof approved !== "object" ||
      approved === null ||
      Array.isArray(approved)
    ) {
      problems.push("approved is not an object")
    } else {
      for (const [key, value] of Object.entries(approved)) {
        if (!STAGES.includes(key as Stage)) {
          problems.push(`unknown stage "${key}" in approved`)
        } else if (typeof value !== "string" || !SHA1_HEX.test(value)) {
          problems.push(`invalid hash for approved.${key}`)
        } else {
          state.approved[key as Stage] = value
        }
      }
    }
  }

  if ("accepted" in record) {
    if (
      typeof record.accepted !== "string" ||
      !SHA1_HEX.test(record.accepted)
    ) {
      problems.push("invalid accepted hash")
    } else {
      state.accepted = record.accepted
    }
  }

  if (state.approved.goals && !state.route) {
    problems.push("goals approval recorded without a route")
  }

  if (state.accepted && !state.approved.goals) {
    problems.push("accepted recorded without approvals")
  }

  return problems.length ? { problems } : { state, problems: [] }
}

function serializeState(state: State): string {
  const approved: Partial<Record<Stage, string>> = {}

  for (const s of STAGES) {
    if (state.approved[s]) {
      approved[s] = state.approved[s]
    }
  }

  const out = {
    ...(state.route ? { route: state.route } : {}),
    ...(Object.keys(approved).length ? { approved } : {}),
    ...(state.accepted ? { accepted: state.accepted } : {}),
  }

  return JSON.stringify(out, null, 2) + "\n"
}

// IDs are the exact leading NN_NN of filenames listed in the Task Index of
// 00_overview.md, in order of first appearance. Literal comparison only.
function taskIndexIds(dir: string): string[] {
  const p = join(dir, "implementation_plan/00_overview.md")

  if (!existsSync(p)) {
    return []
  }

  const ids: string[] = []
  const matches = readFileSync(p, "utf8").matchAll(/`(\d{2}_\d{2})_[^`]*\.md`/g)

  for (const m of matches) {
    if (!ids.includes(m[1])) {
      ids.push(m[1])
    }
  }

  return ids
}

// A task is complete exactly when its file sits in
// implementation_plan/done/. IDs come from the filenames.
function doneTaskIds(dir: string): string[] {
  const done = join(dir, "implementation_plan/done")

  if (!existsSync(done)) {
    return []
  }

  const ids: string[] = []

  for (const f of readdirSync(done)) {
    const m = f.match(TASK_FILE)

    if (m && !ids.includes(m[1])) {
      ids.push(m[1])
    }
  }

  return ids
}

// Acceptance is recorded over everything it verified: each route stage's
// artifact hash plus the sorted done/ filenames. Any later doc edit or task
// change makes the recorded value stale, so a confirmed acceptance can never
// survive the work changing underneath it. Null while any artifact is missing.
function hashAcceptance(dir: string, route?: string): string | null {
  const h = createHash("sha1")

  for (const stage of stageOrder(route)) {
    const stageHash = hashStage(dir, stage)

    if (!stageHash) {
      return null
    }

    h.update(stageHash)
  }

  const done = join(dir, "implementation_plan/done")
  const names = existsSync(done)
    ? readdirSync(done)
        .filter((f) => TASK_FILE.test(f))
        .sort()
    : []

  return h.update("\0" + names.join("\0")).digest("hex")
}

function loadState(dir: string): { state: State; file: "ok" | "new" } {
  if (!existsSync(dir)) {
    fail(`mise directory not found: ${dir}`)
  }

  const statePath = join(dir, ".workflow-state")

  if (!existsSync(statePath)) {
    // Fresh start: only goals.md (at most) exists — initialize empty state.
    // Later-stage artifacts without a state file mean the file was lost.
    const laterEvidence =
      STAGES.filter((s) => s !== "goals").some((s) =>
        ARTIFACTS[s].some((f) => existsSync(join(dir, f))),
      ) || existsSync(join(dir, "implementation_plan"))

    if (laterEvidence) {
      fail(`state file missing but stage artifacts exist — ${BROKEN_HINT}`)
    }

    return { state: { approved: {} }, file: "new" }
  }

  const { state, problems } = parseState(readFileSync(statePath, "utf8"))

  if (!state) {
    fail(`state file is broken (${problems.join("; ")}) — ${BROKEN_HINT}`)
  }

  return { state, file: "ok" }
}

function writeState(dir: string, state: State): void {
  writeFileSync(join(dir, ".workflow-state"), serializeState(state))
}

// in_flight: work is in flight exactly when the mise directory exists with content —
// a missing or empty directory means none, and nothing further to report on.
function report(dir: string, write: boolean): object {
  if (!existsSync(dir) || readdirSync(dir).length === 0) {
    return { in_flight: false }
  }

  const { state, file } = loadState(dir)
  const order = stageOrder(state.route)

  const stages: Record<
    string,
    { verdict: string; recorded?: string; current?: string }
  > = {}

  let mismatchAt = -1

  order.forEach((stage, i) => {
    const recorded = state.approved[stage]
    const current = hashStage(dir, stage) ?? undefined

    let verdict: "approved" | "unapproved" | "mismatch"

    if (!recorded) {
      verdict = "unapproved"
    } else if (current === recorded) {
      verdict = "approved"
    } else {
      verdict = "mismatch"
    }

    if (verdict === "mismatch" && mismatchAt < 0) {
      mismatchAt = i
    }

    stages[stage] = { verdict, recorded, current }
  })

  // Only a mismatch cascades: the doc changed after approval, so every LATER
  // approval was reviewed against a stale doc. The mismatched stage keeps its
  // own stale entry (its gate uses it to detect a changed re-approval).
  const reopened: Stage[] = []

  if (mismatchAt >= 0) {
    for (const stage of order.slice(mismatchAt + 1)) {
      if (state.approved[stage]) {
        delete state.approved[stage]
        stages[stage].verdict = "unapproved"
        delete stages[stage].recorded
        reopened.push(stage)
      }
    }
  }

  // A mismatch also invalidates any recorded acceptance: it was confirmed
  // against the doc that just changed. Deleting the record — rather than
  // trusting the composite hash alone — keeps a later revert of the doc to
  // its approved bytes from resurrecting an acceptance for re-executed work.
  let accepted_cleared = false

  if (mismatchAt >= 0 && state.accepted) {
    delete state.accepted
    accepted_cleared = true
  }

  let next_action: string
  let task_index_ids: string[] | null = null
  let tasks_done: string[] = []
  let tasks_remaining: string[] = []

  const nextStage = order.find((s) => stages[s].verdict !== "approved")

  if (nextStage) {
    next_action = `stage:${nextStage}`
  } else {
    task_index_ids = taskIndexIds(dir)
    tasks_done = doneTaskIds(dir).filter((t) => task_index_ids!.includes(t))
    tasks_remaining = task_index_ids.filter((t) => !tasks_done.includes(t))

    if (task_index_ids.length && tasks_remaining.length === 0) {
      next_action =
        state.accepted && state.accepted === hashAcceptance(dir, state.route)
          ? "close_out"
          : "acceptance"
    } else {
      next_action = "stage:execute"
    }
  }

  const dirty = file === "new" || reopened.length > 0 || accepted_cleared

  if (write && dirty) {
    writeState(dir, state)
  }

  return {
    in_flight: true,
    file,
    route: state.route ?? null,
    stages,
    ...(reopened.length ? { reopened } : {}),
    ...(accepted_cleared ? { accepted_cleared } : {}),
    ...(task_index_ids ? { task_index_ids, tasks_done, tasks_remaining } : {}),
    next_action,
    wrote: write && dirty,
    ...(!write && dirty ? { pending_writes: true } : {}),
  }
}

function approve(dir: string, stage: Stage, route?: string): object {
  const { state } = loadState(dir)

  if (stage === "goals") {
    if (!ROUTES.includes(route as Route)) {
      fail(
        `approving goals requires route=<${ROUTES.join("|")}>, got "${route ?? ""}"`,
      )
    }

    state.route = route as Route
  } else if (route) {
    fail(`route accompanies only the goals approval, not ${stage}`)
  }

  const current = hashStage(dir, stage)

  if (!current) {
    fail(
      `cannot approve ${stage}: artifact missing (${ARTIFACTS[stage].join(", ")})`,
    )
  }

  if (!stageOrder(state.route).includes(stage)) {
    fail(
      `stage ${stage} not in this feature's route (${state.route ?? "unset"})`,
    )
  }

  const previous = state.approved[stage]
  const changed = Boolean(previous && previous !== current)

  state.approved[stage] = current

  const reopened: Stage[] = []

  if (changed) {
    const order = stageOrder(state.route)

    for (const later of order.slice(order.indexOf(stage) + 1)) {
      if (state.approved[later]) {
        delete state.approved[later]
        reopened.push(later)
      }
    }
  }

  // done/ is scoped to one approved plan version: it survives only
  // an approval whose hash matches the recorded one (a resume of the same
  // plan). Any other plan approval — changed, or re-approved after a cascade
  // dropped the entry — starts execution over; the revision planned the
  // remaining work from the repo, and git keeps the moved files' history.
  let cleared_done: string[] = []

  if (stage === "plan" && previous !== current) {
    cleared_done = doneTaskIds(dir)

    if (cleared_done.length) {
      rmSync(join(dir, "implementation_plan/done"), { recursive: true })
    }
  }

  // An approval recording a different hash than before — a changed
  // re-approval, or a first approval after a cascade dropped the entry —
  // re-gates a doc the acceptance was confirmed against: drop the record so
  // a byte-identical revert can't resurrect it.
  const accepted_cleared = Boolean(state.accepted && previous !== current)

  if (accepted_cleared) {
    delete state.accepted
  }

  writeState(dir, state)

  return {
    approved: stage,
    hash: current,
    ...(stage === "goals" ? { route: state.route } : {}),
    changed_reapproval: changed,
    ...(reopened.length ? { reopened } : {}),
    ...(cleared_done.length ? { cleared_done } : {}),
    ...(accepted_cleared ? { accepted_cleared } : {}),
  }
}

// The confirmation record for the acceptance pass: valid only while every
// route stage is validly approved and every Task Index ID is done — the same
// conditions under which report says `acceptance`.
function approveAcceptance(dir: string): object {
  const { state } = loadState(dir)

  const unapproved = stageOrder(state.route).filter(
    (s) => !state.approved[s] || state.approved[s] !== hashStage(dir, s),
  )

  if (unapproved.length) {
    fail(
      `cannot approve acceptance: stages not validly approved (${unapproved.join(", ")})`,
    )
  }

  const ids = taskIndexIds(dir)
  const done = doneTaskIds(dir)
  const remaining = ids.filter((t) => !done.includes(t))

  if (!ids.length || remaining.length) {
    fail(
      ids.length
        ? `cannot approve acceptance: tasks remaining (${remaining.join(", ")})`
        : "cannot approve acceptance: the plan overview has no Task Index",
    )
  }

  // Non-null: every stage just hashed successfully above.
  const current = hashAcceptance(dir, state.route)!

  state.accepted = current
  writeState(dir, state)

  return { approved: "acceptance", hash: current }
}

function asStage(value: string | undefined): Stage {
  if (!value || !STAGES.includes(value as Stage)) {
    fail(
      `expected a stage (${STAGES.join(", ")}, acceptance), got "${value ?? ""}"`,
    )
  }

  return value as Stage
}

const nodeMajor = Number(process.versions.node.split(".")[0])

if (nodeMajor < 24) {
  fail(
    `Node ${process.versions.node} is too old — the mise state engine requires Node >= 24`,
  )
}

const [cmd, dir, ...rest] = process.argv.slice(2)

if (!cmd || !dir) {
  fail("usage: state.ts <report|approve> <mise-dir> [args]")
}

let result: object

switch (cmd) {
  case "report": {
    result = report(dir, rest.includes("--write"))
    break
  }

  case "approve": {
    const stage = rest.find((a) => !a.includes("=") && !a.startsWith("--"))
    const route = rest
      .find((a) => a.startsWith("route="))
      ?.slice("route=".length)

    if (stage === "acceptance") {
      if (route) {
        fail("route accompanies only the goals approval, not acceptance")
      }

      result = approveAcceptance(dir)
    } else {
      result = approve(dir, asStage(stage), route)
    }
    break
  }

  default: {
    fail(`unknown command: ${cmd}`)
  }
}

console.log(JSON.stringify(result, null, 2))
