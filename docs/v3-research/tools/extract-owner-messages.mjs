#!/usr/bin/env node
// Extract every real owner (human) message from the mise-invoked sessions.
//
//   node extract-owner-messages.mjs --digests ../runs/digests --out /tmp/owner-raw.jsonl
//
// Streams each transcript line by line (files up to 146 MB); never buffers a file.
// Human-turn discriminator copied verbatim from digest-transcript.mjs (classifyUser),
// which tools/README.md validates against 1366 origin-stamped turns across 76 sessions.
import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"

const args = process.argv.slice(2)
const argOf = (n, d) => {
  const i = args.indexOf(n)
  return i === -1 ? d : args[i + 1]
}
const DIGESTS = path.resolve(argOf("--digests", "../runs/digests"))
const OUT = path.resolve(argOf("--out", "/tmp/owner-raw.jsonl"))

// ---------------------------------------------------------------- discriminator
const textOf = (content) => {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  return content
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
}
const INJECTED_WRAPPER =
  /<ide_opened_file>[\s\S]*?<\/ide_opened_file>|<ide_selection>[\s\S]*?<\/ide_selection>|<system-reminder>[\s\S]*?<\/system-reminder>/g
const SYNTHETIC_USER_TEXT =
  /^\s*(\[Request interrupted by user[^\]]*\]|<local-command-stdout>|<task-notification>|API Error:|No response requested\.)/
const SLASH_RE = /<command-name>\s*(\/[\w:.-]+)\s*<\/command-name>/

function classifyUser(o) {
  if (o.isSidechain) return null
  if (o.toolUseResult !== undefined) return null
  const content = o.message?.content
  const hasToolResult =
    Array.isArray(content) && content.some((b) => b?.type === "tool_result")
  if (hasToolResult) return null
  if (o.isMeta || o.isCompactSummary) return null
  const raw = textOf(content)
  const slash = raw.match(SLASH_RE)
  if (o.origin?.kind && o.origin.kind !== "human") return null
  if (SYNTHETIC_USER_TEXT.test(raw)) return null
  const stripped = raw.replace(INJECTED_WRAPPER, "").trim()
  return {
    raw,
    stripped,
    slash: slash ? slash[1] : null,
    confidence: o.origin?.kind === "human" ? "origin" : "heuristic",
  }
}

// ---------------------------------------------------------------- stage mapping
// state.ts sets `stage` only on `approve`; `report` carries next_action `stage:<x>`.
// Observed vocabulary: goals, requirements, mock, plan, execute, acceptance.
const STAGE_MAP = {
  goals: "goals",
  requirements: "requirements",
  mock: "mock",
  plan: "plan",
  execute: "execute",
  acceptance: "close-out",
  "close-out": "close-out",
}
function effectiveStage(call) {
  const direct = call.stage && STAGE_MAP[call.stage]
  if (direct) return direct
  const na = call.report?.next_action
  if (typeof na === "string") {
    const m = na.match(/^stage:(\w[\w-]*)$/)
    if (m && STAGE_MAP[m[1]]) return STAGE_MAP[m[1]]
    if (STAGE_MAP[na]) return STAGE_MAP[na]
  }
  return null
}

const repoOf = (projectDir) => {
  const s = projectDir.replace(/^-Users-eric-Code-/, "")
  const m = s.match(/^([a-z0-9-]+?)-worktrees-/)
  if (m) return m[1]
  return s
}
const branchOf = (projectDir, digest) => {
  const b = (digest.session?.gitBranches || []).filter((x) => x && x !== "HEAD")
  if (b.length) return b.join("|")
  const m = projectDir.match(/-worktrees-(.+)$/)
  return m ? m[1] : null
}

// ---------------------------------------------------------------- main
const digestFiles = []
for (const dir of fs.readdirSync(DIGESTS)) {
  const full = path.join(DIGESTS, dir)
  if (!fs.statSync(full).isDirectory()) continue
  for (const f of fs.readdirSync(full)) {
    if (f.endsWith(".json")) digestFiles.push(path.join(full, f))
  }
}

const out = fs.createWriteStream(OUT)
let sessions = 0
let rows = 0
let dropped = 0
let missingInDigest = 0
const warnings = []

for (const df of digestFiles.sort()) {
  const d = JSON.parse(fs.readFileSync(df, "utf8"))
  if (!d.mise?.invoked) continue
  sessions++
  const projectDir = d.source.projectDir
  const sessionId = d.source.sessionId
  const tpath = d.source.path
  const repo = repoOf(projectDir)
  const branch = branchOf(projectDir, d)

  const calls = (d.mise.stateCalls || [])
    .map((c) => ({ ts: c.ts, stage: effectiveStage(c), sub: c.subcommand }))
    .filter((c) => c.ts)
    .sort((a, b) => a.ts.localeCompare(b.ts))
  const subs = (d.subagents || [])
    .filter((s) => s.ts)
    .sort((a, b) => a.ts.localeCompare(b.ts))
  const byTs = new Map()
  for (const u of d.userMessages || []) byTs.set(u.ts, u)

  const stageAt = (ts) => {
    let stage = null
    for (const c of calls) {
      if (c.ts <= ts && c.stage) stage = c.stage
      else if (c.ts > ts) break
    }
    return stage
  }
  const subsAt = (ts) => {
    let lastSub = null
    let lastRoleSub = null
    for (const s of subs) {
      if (s.ts > ts) break
      lastSub = s
      if (s.miseRole) lastRoleSub = s
    }
    return { lastSub, lastRoleSub }
  }

  // Transcript deleted since the digest run: fall back to the digest's own
  // userMessages[], which carry only head300 -> rows flagged truncated.
  if (!fs.existsSync(tpath)) {
    warnings.push(`missing transcript ${tpath}`)
    for (const u of d.userMessages || []) {
      const { lastSub, lastRoleSub } = subsAt(u.ts)
      rows++
      out.write(
        JSON.stringify({
          id: `${sessionId.slice(0, 8)}#${u.ts}`,
          repo,
          projectDir,
          branch,
          sessionId,
          ts: u.ts,
          chars: u.chars,
          digestChars: u.chars,
          text: u.head300,
          fromDigest: true,
          truncated: u.chars > (u.head300 || "").length,
          slash: u.slash || null,
          gapBeforeMs: u.gapBeforeMs ?? null,
          confidence: u.confidence,
          miseStage: stageAt(u.ts),
          miseRoleNearby: lastSub ? lastSub.miseRole || null : null,
          lastSubDesc: lastSub ? lastSub.description || null : null,
          lastMiseRole: lastRoleSub ? lastRoleSub.miseRole : null,
          lastMiseRoleDesc: lastRoleSub
            ? lastRoleSub.description || null
            : null,
        }) + "\n",
      )
    }
    continue
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(tpath),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line || line[0] !== "{") continue
    if (!line.includes('"type":"user"')) continue
    let o
    try {
      o = JSON.parse(line)
    } catch {
      continue
    }
    if (o.type !== "user") continue
    const h = classifyUser(o)
    if (!h) continue
    const ts = o.timestamp
    const text = h.stripped
    if (!text) {
      dropped++
      continue
    }
    const dig = byTs.get(ts)
    if (!dig) missingInDigest++

    const stage = stageAt(ts)
    const { lastSub, lastRoleSub } = subsAt(ts)

    rows++
    out.write(
      JSON.stringify({
        id: `${sessionId.slice(0, 8)}#${ts}`,
        uuid: o.uuid || null,
        repo,
        projectDir,
        branch,
        sessionId,
        ts,
        chars: text.length,
        digestChars: dig ? dig.chars : null,
        text,
        slash: h.slash,
        gapBeforeMs: dig ? dig.gapBeforeMs : null,
        confidence: h.confidence,
        miseStage: stage,
        miseRoleNearby: lastSub ? lastSub.miseRole || null : null,
        lastSubDesc: lastSub ? lastSub.description || null : null,
        lastMiseRole: lastRoleSub ? lastRoleSub.miseRole : null,
        lastMiseRoleDesc: lastRoleSub ? lastRoleSub.description || null : null,
      }) + "\n",
    )
  }
}
await new Promise((r) => out.end(r))
console.error(
  JSON.stringify(
    { sessions, rows, droppedEmpty: dropped, missingInDigest, warnings },
    null,
    1,
  ),
)
