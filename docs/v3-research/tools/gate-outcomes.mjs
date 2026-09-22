#!/usr/bin/env node
// gate-outcomes.mjs — one row per subagent run across every Claude Code session
// on this machine, with its mise role, target artifact/task, round number,
// model, tokens, duration, and final message verbatim.
//
//   node gate-outcomes.mjs [--projects-root ~/.claude/projects] [--out ../runs/gate-outcomes.jsonl]
//
// Streams every transcript line by line; never buffers a file.
// Token roll-up is max-per-message.id then sum-per-model (see tools/README.md).

import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"

const args = process.argv.slice(2)
function arg(name, dflt) {
  const i = args.indexOf(name)
  return i === -1 ? dflt : args[i + 1]
}
const ROOT = arg(
  "--projects-root",
  path.join(process.env.HOME, ".claude", "projects"),
)
const OUT = path.resolve(
  arg(
    "--out",
    path.join(import.meta.dirname, "..", "runs", "gate-outcomes.jsonl"),
  ),
)
// Claude Code deletes transcripts older than its retention window while this runs,
// so the corpus is read from a frozen copy; `transcript` is rewritten to the
// canonical live path the file was copied from.
const CANON = arg(
  "--canonical-root",
  path.join(process.env.HOME, ".claude", "projects"),
)
const canonical = (p) =>
  ROOT === CANON ? p : path.join(CANON, path.relative(ROOT, p))
const MAIN_OUT = path.resolve(
  arg(
    "--main-out",
    path.join(import.meta.dirname, "..", "runs", "driver-edits.jsonl"),
  ),
)

// ---------------------------------------------------------------- discovery

function listSessions() {
  const out = []
  for (const pd of fs.readdirSync(ROOT)) {
    const pdir = path.join(ROOT, pd)
    let st
    try {
      st = fs.statSync(pdir)
    } catch {
      continue
    }
    if (!st.isDirectory()) continue
    for (const entry of fs.readdirSync(pdir)) {
      const sdir = path.join(pdir, entry)
      let sst
      try {
        sst = fs.statSync(sdir)
      } catch {
        continue
      }
      if (!sst.isDirectory()) continue
      const sub = path.join(sdir, "subagents")
      if (!fs.existsSync(sub)) continue
      const files = fs
        .readdirSync(sub)
        .filter((f) => /^agent-.*\.jsonl$/.test(f))
        .map((f) => path.join(sub, f))
      if (!files.length) continue
      out.push({
        projectDir: pd,
        sessionId: entry,
        sessionFile: path.join(pdir, entry + ".jsonl"),
        files,
      })
    }
  }
  return out
}

// ---------------------------------------------------------------- helpers

function textOf(content) {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  return content
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
}

async function eachLine(file, fn) {
  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: "utf8" }),
    crlfDelay: Infinity,
  })
  let n = 0,
    bad = 0
  for await (const line of rl) {
    if (!line.trim()) continue
    n += 1
    let row
    try {
      row = JSON.parse(line)
    } catch {
      bad += 1
      continue
    }
    fn(row)
  }
  return { lines: n, parseErrors: bad }
}

// ---------------------------------------------------------------- role resolution
//
// Cascade, most specific first. Version history of the dispatch templates:
//   1.0.x–1.7.0  orchestrator-authored prose prompts; implementer + retrospective
//                cite stages/implement_task.md / stages/retrospective.md.
//   2.0.0+       every role cites roles/<role>.md (skills/next/roles/, added in 57655da).
// The end-of-plan gate (2.0.0+) and the 1.x baseline/e2e gates run in the main
// thread but often delegate the e2e/sanity/quality commands to a subagent; those
// are tagged `gate-run`.

const ROLE_FILE = /roles\/([a-z_-]+)\.md/

function resolveRole(prompt, desc) {
  const p = prompt || ""
  const d = desc || ""
  let m = p.match(ROLE_FILE)
  if (m) {
    const r = m[1]
    if (
      [
        "critic",
        "reviewer",
        "acceptance",
        "documenter",
        "implementer",
        "retrospective",
      ].includes(r)
    ) {
      return { role: r, basis: "roles-file" }
    }
    return { role: r, basis: "roles-file-other" }
  }
  if (/stages\/implement_task\.md/.test(p))
    return { role: "implementer", basis: "stage-file-1x" }
  if (/stages\/retrospective\.md/.test(p))
    return { role: "retrospective", basis: "stage-file-1x" }
  if (/stages\/(execute|plan|requirements|goals)\.md/.test(p))
    return { role: "stage-orchestrator", basis: "stage-file-1x" }

  // 1.x prose prompts, self-describing.
  if (
    /fresh-context critic|\bcritic\b[^.]{0,60}(reviewing|review)\s+(a|an|the)\s+(requirements|implementation plan|plan)/i.test(
      p,
    )
  ) {
    return { role: "critic", basis: "prose-1x" }
  }
  if (
    /fresh-context reviewer|you are a reviewer[^.]{0,80}task spec|review one commit against the task spec/i.test(
      p,
    )
  ) {
    return { role: "reviewer", basis: "prose-1x" }
  }
  if (
    /acceptance (verifier|gate|pass|review)|verifying (a|the) (finished|already-finished|shipped) (feature )?branch|verify (a|the) finished (feature )?branch|verifying shipped code|verifying an implementation against requirements|gathering evidence for an acceptance/i.test(
      p,
    )
  ) {
    return { role: "acceptance", basis: "prose-1x" }
  }
  if (
    /(end-of-plan|baseline|quality) (validation )?gate|sanity-e2e|yarn smoke.*(gate|step)|running the .*gate for/i.test(
      p,
    ) ||
    (/^(run|gate:)/i.test(d) && /(sanity|e2e|gate|smoke)/i.test(d))
  ) {
    return { role: "gate-run", basis: "gate-prose" }
  }
  return { role: null, basis: "unresolved" }
}

function resolveKindAndTarget(role, prompt) {
  const p = prompt || ""
  // `Fix scope:` values contain backticks and prose, so take the rest of the line
  const grab = (label) => {
    const m = p.match(new RegExp("^\\s*" + label + ":\\s*(.+)$", "m"))
    if (!m) return null
    return (
      m[1]
        .replace(/\s{2,}[A-Z][a-z]+:.*$/, "")
        .trim()
        .replace(/^`|`$/g, "")
        .trim() || null
    )
  }
  let kind = null,
    target = null,
    targetKind = null

  if (role === "critic") {
    const km = p.match(/Kind:\s*`?(requirements|plan)`?/i)
    let artifact = grab("Artifact")
    if (artifact) artifact = artifact.replace(/\s+Kind:.*$/i, "").trim()
    if (km) kind = km[1].toLowerCase()
    if (!kind && artifact)
      kind = /implementation_plan/.test(artifact)
        ? "plan"
        : /requirements\.md/.test(artifact)
          ? "requirements"
          : null
    if (!kind) {
      if (
        /requirements document|requirements\.md/i.test(p) &&
        !/implementation plan/i.test(p)
      )
        kind = "requirements"
      else if (/implementation plan|implementation_plan/i.test(p)) kind = "plan"
    }
    if (!artifact) {
      const am = p.match(
        /([^\s`"']*\.mise[^\s`"']*(?:requirements\.md|implementation_plan\/?))/,
      )
      artifact = am ? am[1] : null
    }
    // Normalise: a plan critic always judges the whole implementation_plan/ directory,
    // a requirements critic always requirements.md — prompts spell the scope out in prose
    // that would otherwise fragment the round count.
    if (kind === "plan") target = "implementation_plan/"
    else if (kind === "requirements") target = "requirements.md"
    else target = artifact ? shortTarget(artifact) : "artifact:unknown"
    targetKind = "artifact"
  } else if (
    role === "reviewer" ||
    role === "implementer" ||
    role === "documenter"
  ) {
    const tf = grab("Task file") || grab("Subject task file")
    const fs_ = grab("Fix scope")
    if (tf) {
      target = shortTarget(tf)
      targetKind = "task"
    } else if (fs_) {
      target = "fix:" + fs_.slice(0, 70)
      targetKind = "fix-scope"
    } else {
      const am = p.match(
        /implementation_plan\/(?:done\/)?([0-9][0-9_a-z]*\.md)/i,
      )
      if (am) {
        target = am[1]
        targetKind = "task"
      } else {
        const cm = p.match(/Commits?:\s*`?([0-9a-f]{7,40})/i)
        if (cm) {
          target = "commit:" + cm[1].slice(0, 9)
          targetKind = "commit"
        }
      }
    }
    if (role === "documenter" && !target) {
      target = "docs-pass"
      targetKind = "fix-scope"
    }
  } else if (role === "acceptance") {
    // One acceptance target per branch: 1.x prose prompts and 2.x `Requirements:` prompts
    // judge the same thing, so they share a round sequence.
    target = "acceptance"
    targetKind = "branch"
  } else if (role === "retrospective") {
    target = "retrospective"
    targetKind = "run"
  } else if (role === "gate-run") {
    target = "end-of-plan-gate"
    targetKind = "gate"
  }
  return { kind, target, targetKind }
}

// A run whose prompt names no artifact, task or fix scope is its own target, so it
// never inflates another target's round count.
function fallbackTarget(role, agentId) {
  return role ? "unscoped:" + agentId : null
}

function shortTarget(p) {
  const s = String(p).replace(/\/$/, "")
  if (/implementation_plan$/.test(s)) return "implementation_plan/"
  const parts = s.split("/")
  return parts[parts.length - 1] || s
}

// ---------------------------------------------------------------- per-subagent digest

async function digestSubagent(file) {
  const agentId = path
    .basename(file)
    .replace(/^agent-/, "")
    .replace(/\.jsonl$/, "")
  let meta = {}
  try {
    meta = JSON.parse(
      fs.readFileSync(file.replace(/\.jsonl$/, ".meta.json"), "utf8"),
    )
  } catch {}

  let prompt = null,
    firstTs = null,
    lastTs = null
  let gitBranch = null,
    cwd = null,
    version = null,
    sessionId = null
  const usageByMsg = new Map() // message.id -> {model, usage}
  const toolCounts = {}
  const filesEdited = new Set()
  const commits = new Set()
  let lastAssistantId = null
  const textByMsg = new Map()
  let assistantRows = 0
  let interrupted = false

  const { lines, parseErrors } = await eachLine(file, (row) => {
    const ts = row.timestamp
    if (ts) {
      if (!firstTs || ts < firstTs) firstTs = ts
      if (!lastTs || ts > lastTs) lastTs = ts
    }
    if (row.gitBranch && !gitBranch) gitBranch = row.gitBranch
    if (row.cwd && !cwd) cwd = row.cwd
    if (row.version) version = row.version
    if (row.sessionId && !sessionId) sessionId = row.sessionId

    if (row.type === "user" && prompt === null && !row.toolUseResult) {
      const t =
        typeof row.message?.content === "string"
          ? row.message.content
          : textOf(row.message?.content)
      if (t) prompt = t
    }
    if (row.type === "user") {
      const c = row.message?.content
      if (Array.isArray(c)) {
        for (const b of c) {
          if (
            b?.type === "tool_result" &&
            typeof b.content === "string" &&
            /\[Request interrupted/.test(b.content)
          )
            interrupted = true
        }
      } else if (typeof c === "string" && /\[Request interrupted/.test(c))
        interrupted = true
    }
    if (row.type === "assistant") {
      assistantRows += 1
      const id = row.message?.id
      const model = row.message?.model || meta.model || "unknown"
      const u = row.message?.usage
      if (id && u) {
        const prev = usageByMsg.get(id)
        const cur = {
          model,
          input: u.input_tokens || 0,
          cacheRead: u.cache_read_input_tokens || 0,
          cacheCreate: u.cache_creation_input_tokens || 0,
          output: u.output_tokens || 0,
        }
        if (!prev) usageByMsg.set(id, cur)
        else {
          prev.input = Math.max(prev.input, cur.input)
          prev.cacheRead = Math.max(prev.cacheRead, cur.cacheRead)
          prev.cacheCreate = Math.max(prev.cacheCreate, cur.cacheCreate)
          prev.output = Math.max(prev.output, cur.output)
        }
      }
      const c = row.message?.content
      if (Array.isArray(c)) {
        for (const b of c) {
          if (b?.type === "text" && b.text && b.text.trim()) {
            if (id) {
              textByMsg.set(
                id,
                (textByMsg.get(id) || "") +
                  (textByMsg.has(id) ? "\n" : "") +
                  b.text,
              )
              lastAssistantId = id
            }
          }
          if (b?.type === "tool_use") {
            toolCounts[b.name] = (toolCounts[b.name] || 0) + 1
            const inp = b.input || {}
            if (
              ["Edit", "Write", "NotebookEdit", "MultiEdit"].includes(b.name) &&
              inp.file_path
            )
              filesEdited.add(inp.file_path)
            if (b.name === "Bash" && typeof inp.command === "string") {
              const cm = inp.command.match(/git\s+commit/)
              if (cm) commits.add("commit-cmd")
            }
          }
        }
      }
    }
  })

  const byModel = {}
  let tokensTotal = 0
  for (const u of usageByMsg.values()) {
    const m = (byModel[u.model] ||= {
      input: 0,
      cacheRead: 0,
      cacheCreate: 0,
      output: 0,
      requests: 0,
    })
    m.input += u.input
    m.cacheRead += u.cacheRead
    m.cacheCreate += u.cacheCreate
    m.output += u.output
    m.requests += 1
    tokensTotal += u.input + u.cacheRead + u.cacheCreate + u.output
  }
  const billable = Object.values(byModel).reduce(
    (a, m) => a + m.input + m.cacheRead + m.cacheCreate + m.output,
    0,
  )
  const models = Object.keys(byModel).filter((m) => m !== "<synthetic>")

  const finalMessage = lastAssistantId ? textByMsg.get(lastAssistantId) : null

  return {
    agentId,
    file,
    meta,
    prompt,
    firstTs,
    lastTs,
    gitBranch,
    cwd,
    version,
    sessionId,
    lines,
    parseErrors,
    assistantRows,
    interrupted,
    tokensByModel: byModel,
    tokensTotal: billable,
    models,
    toolCounts,
    toolUses: Object.values(toolCounts).reduce((a, b) => a + b, 0),
    filesEdited: [...filesEdited],
    ranGitCommit: commits.size > 0,
    finalMessage,
  }
}

// ---------------------------------------------------------------- main thread edits

async function digestMain(sessionFile) {
  const edits = []
  if (!fs.existsSync(sessionFile)) return edits
  await eachLine(sessionFile, (row) => {
    if (row.type !== "assistant" || row.isSidechain) return
    const c = row.message?.content
    if (!Array.isArray(c)) return
    for (const b of c) {
      if (
        b?.type === "tool_use" &&
        ["Edit", "Write", "NotebookEdit", "MultiEdit"].includes(b.name)
      ) {
        const inp = b.input || {}
        // the written text is what says whether a finding was acted on; the path alone does not
        const written = [
          inp.new_string,
          inp.content,
          inp.new_source,
          ...(Array.isArray(inp.edits)
            ? inp.edits.map((e) => e.new_string)
            : []),
        ]
          .filter((x) => typeof x === "string")
          .join("\n")
          .slice(0, 12000)
        edits.push({
          ts: row.timestamp,
          tool: b.name,
          file: inp.file_path || null,
          text: written,
        })
      }
    }
  })
  return edits
}

// ---------------------------------------------------------------- run

const sessions = listSessions()
const outRows = []
const mainRows = []
let unresolved = 0,
  total = 0,
  excludedResearch = 0
const basisCount = {}

// The v3-research sessions themselves spawn subagents; they are not mise runs.
const isResearchAgent = (p) => /docs\/v3-research/.test(p || "")

for (const s of sessions) {
  const runs = []
  for (const f of s.files) {
    const d = await digestSubagent(f)
    if (isResearchAgent(d.prompt)) {
      excludedResearch += 1
      continue
    }
    total += 1
    const { role, basis } = resolveRole(d.prompt, d.meta.description)
    basisCount[basis] = (basisCount[basis] || 0) + 1
    if (!role) unresolved += 1
    const { kind, target, targetKind } = resolveKindAndTarget(role, d.prompt)
    runs.push({
      ...d,
      role,
      roleBasis: basis,
      kind,
      target: target || fallbackTarget(role, d.agentId),
      targetKind: targetKind || (role ? "unscoped" : null),
    })
  }
  runs.sort((a, b) => String(a.firstTs).localeCompare(String(b.firstTs)))

  // round numbers: repeated spawns of the same role on the same target, in order
  const seen = new Map()
  for (const r of runs) {
    const key = [r.role || "unresolved", r.kind || "-", r.target || "-"].join(
      "|",
    )
    const n = (seen.get(key) || 0) + 1
    seen.set(key, n)
    r.round = n
    r.roundKey = key
  }
  const totalRounds = new Map()
  for (const r of runs)
    totalRounds.set(
      r.roundKey,
      Math.max(totalRounds.get(r.roundKey) || 0, r.round),
    )

  const mainEdits = await digestMain(s.sessionFile)
  for (const e of mainEdits)
    mainRows.push({ projectDir: s.projectDir, sessionId: s.sessionId, ...e })

  for (let i = 0; i < runs.length; i++) {
    const r = runs[i]
    const isGate = [
      "critic",
      "reviewer",
      "acceptance",
      "documenter",
      "gate-run",
      "retrospective",
    ].includes(r.role)
    // the spawns that follow this one, in order (for outcome attribution)
    const next = (isGate ? runs.slice(i + 1, i + 5) : []).map((n) => ({
      agentId: n.agentId,
      role: n.role,
      target: n.target,
      round: n.round,
      ts: n.firstTs,
      promptHead: (n.prompt || "").slice(0, 6000),
      filesEdited: n.filesEdited,
    }))
    const driverEditsAfter = mainEdits.filter(
      (e) =>
        r.lastTs &&
        e.ts > r.lastTs &&
        (!runs[i + 1] || e.ts < runs[i + 1].firstTs),
    )
    outRows.push({
      projectDir: s.projectDir,
      sessionId: s.sessionId,
      agentId: r.agentId,
      transcript: canonical(r.file),
      seq: i + 1,
      role: r.role,
      roleBasis: r.roleBasis,
      gate: r.role === "critic" ? "critic-" + (r.kind || "unknown") : r.role,
      kind: r.kind,
      target: r.target,
      targetKind: r.targetKind,
      round: r.round,
      roundsOnTarget: totalRounds.get(r.roundKey),
      branch: r.gitBranch,
      cwd: r.cwd,
      ccVersion: r.version,
      miseVersion:
        (r.prompt || "").match(/mise\/([0-9]+\.[0-9]+\.[0-9]+)\//)?.[1] || null,
      agentType: r.meta.agentType || null,
      requestedModel: r.meta.model || null,
      models: r.models,
      description: r.meta.description || null,
      spawnDepth: r.meta.spawnDepth ?? null,
      start: r.firstTs,
      end: r.lastTs,
      durationMs:
        r.firstTs && r.lastTs
          ? Date.parse(r.lastTs) - Date.parse(r.firstTs)
          : null,
      lines: r.lines,
      assistantTurns: r.assistantRows,
      toolUses: r.toolUses,
      toolCounts: r.toolCounts,
      tokensTotal: r.tokensTotal,
      tokensByModel: r.tokensByModel,
      filesEdited: r.filesEdited,
      interrupted: r.interrupted,
      // verbatim for every resolved mise role; truncated for ad-hoc driver agents,
      // which are out of scope for gate accounting
      prompt: r.role ? r.prompt : (r.prompt || "").slice(0, 1200),
      finalMessage: r.role
        ? r.finalMessage
        : (r.finalMessage || "").slice(0, 1200),
      nextSpawns: next,
      driverEditsAfter: driverEditsAfter.map((e) => e.file),
      driverEditWindow: {
        from: r.lastTs,
        to: runs[i + 1] ? runs[i + 1].firstTs : null,
      },
    })
  }
}

// Round number scoped to the branch rather than the session: a critic loop or an
// acceptance loop can resume in a later session on the same branch.
{
  const groups = new Map()
  for (const r of outRows) {
    const key = [
      r.projectDir,
      r.branch || "-",
      r.gate || "unresolved",
      r.kind || "-",
      r.target || "-",
    ].join("|")
    ;(groups.get(key) || groups.set(key, []).get(key)).push(r)
  }
  for (const [, g] of groups) {
    g.sort((a, b) => String(a.start).localeCompare(String(b.start)))
    g.forEach((r, i) => {
      r.roundInBranch = i + 1
      r.roundsOnTargetInBranch = g.length
    })
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, outRows.map((r) => JSON.stringify(r)).join("\n") + "\n")
fs.writeFileSync(
  MAIN_OUT,
  mainRows.map((r) => JSON.stringify(r)).join("\n") + "\n",
)

const byRole = {}
for (const r of outRows)
  byRole[r.gate || "UNRESOLVED"] = (byRole[r.gate || "UNRESOLVED"] || 0) + 1
console.error(
  JSON.stringify(
    {
      sessions: sessions.length,
      subagentRuns: total,
      excludedResearch,
      unresolved,
      byRole,
      roleBasis: basisCount,
      out: OUT,
    },
    null,
    2,
  ),
)
