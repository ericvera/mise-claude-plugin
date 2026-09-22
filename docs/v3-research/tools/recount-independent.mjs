#!/usr/bin/env node
// Independent recount of a Claude Code session. Written without reading digest-transcript.mjs.
// Usage: node recount.mjs <main.jsonl>
import fs from "node:fs"
import path from "node:path"

const main = process.argv[2]
const dir = main.replace(/\.jsonl$/, "")
const subDir = path.join(dir, "subagents")

function rows(file) {
  const out = []
  const txt = fs.readFileSync(file, "utf8")
  for (const line of txt.split("\n")) {
    if (!line.trim()) continue
    try {
      out.push(JSON.parse(line))
    } catch {
      out.push({ __parseError: true })
    }
  }
  return out
}

// ---- token roll-up: max per message.id then sum per model ----
function tokensOf(rs) {
  const perId = new Map() // id -> {model, out, in, cr, cc, think}
  for (const r of rs) {
    if (r.type !== "assistant" || !r.message) continue
    const m = r.message
    const id = m.id || `__noid_${r.uuid}`
    const u = m.usage || {}
    const cur = perId.get(id) || { model: m.model, out: 0, in: 0, cr: 0, cc: 0 }
    cur.model = m.model || cur.model
    cur.out = Math.max(cur.out, u.output_tokens || 0)
    cur.in = Math.max(cur.in, u.input_tokens || 0)
    cur.cr = Math.max(cur.cr, u.cache_read_input_tokens || 0)
    cur.cc = Math.max(cur.cc, u.cache_creation_input_tokens || 0)
    perId.set(id, cur)
  }
  const byModel = {}
  let rowsSum = 0,
    firstWins = {}
  for (const v of perId.values()) {
    const b = (byModel[v.model] ||= {
      output: 0,
      input: 0,
      cacheRead: 0,
      cacheCreate: 0,
      requests: 0,
    })
    b.output += v.out
    b.input += v.in
    b.cacheRead += v.cr
    b.cacheCreate += v.cc
    b.requests += 1
  }
  // naive row-sum for contrast
  for (const r of rs)
    if (r.type === "assistant" && r.message?.usage)
      rowsSum += r.message.usage.output_tokens || 0
  return { byModel, uniqueIds: perId.size, naiveRowSumOutput: rowsSum }
}

const mainRows = rows(main)
const mainTok = tokensOf(mainRows)

// ---- subagents ----
let subFiles = []
if (fs.existsSync(subDir))
  subFiles = fs
    .readdirSync(subDir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => path.join(subDir, f))
const subTok = { byModel: {}, uniqueIds: 0, naiveRowSumOutput: 0 }
const perAgent = []
for (const f of subFiles) {
  const rs = rows(f)
  const t = tokensOf(rs)
  subTok.uniqueIds += t.uniqueIds
  subTok.naiveRowSumOutput += t.naiveRowSumOutput
  for (const [m, b] of Object.entries(t.byModel)) {
    const d = (subTok.byModel[m] ||= {
      output: 0,
      input: 0,
      cacheRead: 0,
      cacheCreate: 0,
      requests: 0,
    })
    for (const k of Object.keys(b)) d[k] += b[k]
  }
  const ts = rs
    .map((r) => r.timestamp)
    .filter(Boolean)
    .sort()
  perAgent.push({
    file: path.basename(f),
    lines: rs.length,
    start: ts[0],
    end: ts[ts.length - 1],
    byModel: t.byModel,
  })
}

// ---- spawns: main-thread Agent/Task tool_use blocks ----
let spawnBlocks = 0,
  spawnByName = {}
const nestedFromMeta = {}
for (const r of mainRows) {
  if (r.type !== "assistant") continue
  const c = r.message?.content
  if (!Array.isArray(c)) continue
  for (const b of c)
    if (b.type === "tool_use" && (b.name === "Agent" || b.name === "Task")) {
      spawnBlocks++
      spawnByName[b.name] = (spawnByName[b.name] || 0) + 1
    }
}
let metaFiles = []
if (fs.existsSync(subDir))
  metaFiles = fs.readdirSync(subDir).filter((f) => f.endsWith(".meta.json"))
const depth = {}
for (const f of metaFiles) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(subDir, f), "utf8"))
    depth[m.spawnDepth ?? "null"] = (depth[m.spawnDepth ?? "null"] || 0) + 1
  } catch {}
}

// ---- real user messages ----
const MARKERS = [
  "<command-name>",
  "<local-command-stdout>",
  "<task-notification>",
  "<system-reminder>",
  "<user-prompt-submit-hook>",
]
function textOf(msg) {
  const c = msg?.content
  if (typeof c === "string") return c
  if (Array.isArray(c))
    return c
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
  return ""
}
let originHuman = 0,
  originOther = {},
  noOrigin = 0,
  noOriginHumanish = 0
const humanEvents = []
for (const r of mainRows) {
  if (r.type !== "user" || r.isSidechain) continue
  const c = r.message?.content
  const hasToolResult =
    Array.isArray(c) && c.some((b) => b.type === "tool_result")
  if (hasToolResult) continue
  if (r.origin && r.origin.kind) {
    if (r.origin.kind === "human") {
      originHuman++
      humanEvents.push(r.timestamp)
    } else originOther[r.origin.kind] = (originOther[r.origin.kind] || 0) + 1
  } else {
    noOrigin++
    const t = textOf(r.message)
    const isMarker = MARKERS.some((m) => t.includes(m)) || r.isMeta
    if (!isMarker && t.trim()) {
      noOriginHumanish++
      humanEvents.push(r.timestamp)
    }
  }
}

// ---- wall clock partition ----
// events: assistant rows (model), user rows w/ tool_result (tool), real human user msgs (humanWait), system api_error (model)
const humanSet = new Set(humanEvents)
const ev = []
for (const r of mainRows) {
  if (!r.timestamp) continue
  if (r.type === "assistant")
    ev.push({ t: Date.parse(r.timestamp), k: "model" })
  else if (r.type === "user" && !r.isSidechain) {
    const c = r.message?.content
    if (Array.isArray(c) && c.some((b) => b.type === "tool_result"))
      ev.push({ t: Date.parse(r.timestamp), k: "tool" })
  } else if (
    r.type === "system" &&
    (r.subtype === "api_error" ||
      (r.level === "error" && /api/i.test(r.subtype || "")))
  )
    ev.push({ t: Date.parse(r.timestamp), k: "model" })
}
for (const ts of humanEvents) ev.push({ t: Date.parse(ts), k: "human" })
ev.sort((a, b) => a.t - b.t)
let modelMs = 0,
  toolMs = 0,
  humanWaitMs = 0,
  humanCapped = 0,
  longestHuman = 0,
  outOfOrder = 0
for (let i = 1; i < ev.length; i++) {
  const gap = ev[i].t - ev[i - 1].t
  if (gap < 0) {
    outOfOrder++
    continue
  }
  if (ev[i].k === "model") modelMs += gap
  else if (ev[i].k === "tool") toolMs += gap
  else {
    humanWaitMs += gap
    humanCapped += Math.min(gap, 30 * 60 * 1000)
    longestHuman = Math.max(longestHuman, gap)
  }
}
const allTs = mainRows
  .map((r) => r.timestamp)
  .filter(Boolean)
  .map(Date.parse)
  .sort((a, b) => a - b)

console.log(
  JSON.stringify(
    {
      file: main,
      lines: mainRows.length,
      span: {
        start: new Date(allTs[0]).toISOString(),
        end: new Date(allTs[allTs.length - 1]).toISOString(),
        wallMs: allTs[allTs.length - 1] - allTs[0],
      },
      mainTokens: mainTok,
      subagentTokens: subTok,
      subagentFiles: subFiles.length,
      metaFiles: metaFiles.length,
      spawnBlocks,
      spawnByName,
      metaSpawnDepth: depth,
      users: {
        originHuman,
        originOther,
        noOrigin,
        noOriginHumanish,
        total: originHuman + noOriginHumanish,
      },
      wall: {
        modelMs,
        toolMs,
        humanWaitMs,
        humanCapped,
        longestHuman,
        outOfOrder,
        eventWindowMs: ev.length ? ev[ev.length - 1].t - ev[0].t : 0,
        sum: modelMs + toolMs + humanWaitMs,
      },
    },
    null,
    1,
  ),
)
