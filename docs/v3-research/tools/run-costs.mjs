#!/usr/bin/env node
// run-costs.mjs — the cost side of the v3 keep/cut scorecard.
//
// Joins session digests (runs/digests/**, runs/transcript-index.jsonl) to mise runs
// (runs/okven-runs.jsonl + runs/other-runs/*-runs.jsonl, both produced by map-runs.mjs)
// and emits one cost row per run in runs/run-costs.jsonl, plus runs/run-costs.md.
//
// Read-only outside docs/v3-research. Every transcript is streamed line by line.
//
// Usage:  node run-costs.mjs [--root ../runs] [--no-md]
//
// ---------------------------------------------------------------------------
// HOW THE MISE PORTION OF A SESSION IS BOUNDED (a judgement, so it is stated)
//
// A session is not a run: a run spans several sessions, and a session can hold two
// runs plus unrelated work. Per session we collect *mise markers*:
//   1. every `state.ts` invocation                      (digest mise.stateCalls[].ts)
//   2. every `/mise:next` slash command and Skill(mise:next) invocation
//   3. every subagent spawn identified as a mise role   (classifyRole below), and
//      that subagent's transcript end
//   4. every main-thread tool call whose input touches the run's `.mise/` directory
//      (this is what keeps mock-stage design agents, which carry no role marker,
//      inside the span)
// The session's **mise span** is [first marker, last marker]. Events outside it are
// dropped and counted in `outside`, so the discard is visible. Inside it everything
// is charged to the run — an owner side-quest mid-run is part of what the run cost.
// Marker 4 needs the raw transcript; 6 of 43 mise sessions have been pruned from
// ~/.claude/projects since the digests were taken, and fall back to markers 1-3
// (`rawTranscriptsMissing`).
//
// STAGE, within a run (all of its sessions share one timeline). Assertions:
//   'upto' X at t — stage X was current up to t:
//        `state.ts approve X`; git checkpoint transitions approved/reapproved X and
//        accepted acceptance (mise commits each checkpoint, so these are exact).
//   'from' X at t — stage X is current from t, by descending priority:
//        p0 `state.ts report` next_action (stage:X | acceptance | cleanup), and
//           git `reopened X`
//        p1 a mise-role subagent spawn (critic -> its artifact kind; implementer,
//           reviewer, documenter -> execute; acceptance; retrospective)
//        p2 derived: the stage that follows an approved X
// Assertion timestamps cut the span into segments; a segment takes the best 'from'
// at its left edge, else the 'upto' at its right edge, else carries the previous
// segment. Span time before the first assertion is `setup`.
// ---------------------------------------------------------------------------

import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const argVal = (k, d) => {
  const i = args.indexOf(k)
  return i >= 0 ? args[i + 1] : d
}
const ROOT = path.resolve(HERE, argVal("--root", "../runs"))
const WRITE_MD = !args.includes("--no-md")
const MIN = 60000

// ------------------------------------------------------------------ role model

const STAGE_ORDER = [
  "setup",
  "goals",
  "mock",
  "requirements",
  "plan",
  "execute",
  "acceptance",
  "retrospective",
  "cleanup",
]
const ROLE_STAGE = {
  implementer: "execute",
  reviewer: "execute",
  documenter: "execute",
  acceptance: "acceptance",
  retrospective: "retrospective",
}

// digest.miseRole covers >=2.0 prompts, which cite roles/<role>.md. 1.x inlined the
// role text, so fall back to the prompt head and then the spawn description.
function classifyRole(s) {
  if (s.miseRole) return s.miseRole
  const head = String(s.promptHead200 || "")
  const desc = String(s.description || "")
  if (/skills\/next\/stages\/execute\.md/.test(head)) return "implementer"
  if (/fresh-context critic/i.test(head)) return "critic"
  if (/fresh-context reviewer/i.test(head)) return "reviewer"
  if (/^critic\b/i.test(desc)) return "critic"
  if (/^(re-?)?review(er)?\b/i.test(desc)) return "reviewer"
  if (/^implement\b|^fix (task|round)\b/i.test(desc)) return "implementer"
  if (/^documenter\b|^document\b/i.test(desc)) return "documenter"
  if (/^(re-?run )?acceptance\b|acceptance pass/i.test(desc))
    return "acceptance"
  if (/^(close-out )?retrospective\b/i.test(desc)) return "retrospective"
  return null
}
const isFixSpawn = (s) =>
  /^fix\b|fix round|review defect|review fix/i.test(s.description || "")
const roleKey = (s) =>
  s.role
    ? s.role === "implementer" && isFixSpawn(s)
      ? "fix"
      : s.role
    : "other"

// ------------------------------------------------------------------ token maths

const TOKKEYS = [
  "input",
  "cacheRead",
  "cacheCreate",
  "output",
  "thinking",
  "requests",
]
const zero = () => ({
  input: 0,
  cacheRead: 0,
  cacheCreate: 0,
  output: 0,
  thinking: 0,
  requests: 0,
})
const addTok = (d, s) => {
  for (const k of TOKKEYS) d[k] = (d[k] || 0) + (s?.[k] || 0)
  return d
}
const addByModel = (d, s) => {
  for (const [m, t] of Object.entries(s || {})) addTok((d[m] ||= zero()), t)
  return d
}
const sumModels = (b) => {
  const t = zero()
  for (const v of Object.values(b || {})) addTok(t, v)
  return t
}

// ------------------------------------------------------------------ small utils

const readJsonl = (f) =>
  fs
    .readFileSync(f, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))

function semverMax(list) {
  let best = null
  for (const v of list.filter(Boolean)) {
    if (!best) {
      best = v
      continue
    }
    const a = v.split(".").map(Number),
      b = best.split(".").map(Number)
    for (let i = 0; i < 3; i++) {
      if ((a[i] || 0) > (b[i] || 0)) {
        best = v
        break
      }
      if ((a[i] || 0) < (b[i] || 0)) break
    }
  }
  return best
}
function mergeSpans(spans) {
  const s = spans
    .map((x) => [Date.parse(x[0]), Date.parse(x[1])])
    .sort((a, b) => a[0] - b[0])
  const out = []
  for (const iv of s) {
    const last = out[out.length - 1]
    if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1])
    else out.push([...iv])
  }
  return out.reduce((a, iv) => a + (iv[1] - iv[0]), 0)
}

// ------------------------------------------------------------------ load runs

function loadRuns() {
  const runs = []
  const add = (repo, rows) => {
    for (const r of rows) {
      const first = r.firstCommitTs || r.reviewEvidence?.from || null
      const last = r.lastCommitTs || r.reviewEvidence?.to || null
      const extEnd =
        r.reviewEvidence?.to && r.reviewEvidence.to > (last || "")
          ? r.reviewEvidence.to
          : last
      runs.push({
        repo,
        runId: r.runId,
        branch: r.branch,
        type: r.type,
        route: r.route,
        status: r.status,
        first,
        last,
        extEnd,
        loc: r.loc || null,
        miseVersion: r.miseVersion || null,
        taskCount: r.taskCount ?? null,
        tasksDone: r.tasksDone ?? null,
        artifactLines: r.artifactLines || null,
        transitions: r.transitions || [],
        timelineSource: r.timelineSource,
        mergeCommitTs: r.mergeCommit?.ts || null,
      })
    }
  }
  add("okven", readJsonl(path.join(ROOT, "okven-runs.jsonl")))
  const otherDir = path.join(ROOT, "other-runs")
  if (fs.existsSync(otherDir)) {
    for (const f of fs
      .readdirSync(otherDir)
      .filter((x) => x.endsWith("-runs.jsonl"))) {
      add(f.replace("-runs.jsonl", ""), readJsonl(path.join(otherDir, f)))
    }
  }
  return runs
}
const repoOfCwd = (cwd) => {
  const m = /^\/Users\/eric\/Code\/([^/]+)/.exec(cwd || "")
  return m ? m[1].replace(/\.worktrees$/, "") : null
}

// --------------------------------------------------------------- raw scanning

// Only an *installed* mise skill file counts as an instruction read. A bare
// `skills/next/...` path is the plugin's own source being edited (the
// mise-claude-plugin repo runs mise on itself) and is not an instruction read.
const MISE_SKILL_RE =
  /(?:plugins\/(?:cache|marketplaces)\/[^"'\s]*?|\$\{?[A-Z_]+\}?\/)skills\/next\/((?:roles|stages|references)\/[A-Za-z0-9_-]+\.md|SKILL\.md)/g
const skillHits = (s) => [
  ...new Set([...s.matchAll(MISE_SKILL_RE)].map((m) => m[1])),
]

// ---- gate re-classification (stricter than the digest's, applied to the stored
// 200-char command prefix). The digest classifies the *full* command and splits on
// `|`, so `pgrep -lf "(vitest|eslint)"` lands in `lint`. Stripping quoted strings
// before segmenting removes that class of false positive. Both counts are reported.
const RUNNER = String.raw`(?:yarn|npm|pnpm|npx|bun|deno)(?:\s+(?:run|exec|dlx))?`
const GATE_KINDS = [
  [
    "test",
    new RegExp(
      String.raw`^${RUNNER}\s+test(?!:(?:up|down|start|stop|emulator))(?::[\w-]+)?\b`,
    ),
  ],
  ["test", /^(vitest|jest|mocha|ava|pytest|tap)\b/],
  ["test", /^go\s+test\b/],
  [
    "lint",
    new RegExp(
      String.raw`^${RUNNER}\s+(lint|format|prettier|biome|ruff)(?::[\w-]+)?\b`,
    ),
  ],
  ["lint", /^(eslint|biome|ruff|prettier)\b/],
  [
    "typecheck",
    new RegExp(
      String.raw`^${RUNNER}\s+(typecheck|type-check|tsc|types)(?::[\w-]+)?\b`,
    ),
  ],
  ["typecheck", /^tsc\b/],
  ["build", new RegExp(String.raw`^${RUNNER}\s+build(?:[:-][\w-]+)?\b`)],
  ["build", /^(tsup|rollup|webpack|esbuild)\b/],
  ["build", /^vite\s+build\b/],
]
function strictKinds(cmd) {
  const bare = String(cmd).replace(/"[^"]*"|'[^']*'/g, " ")
  const kinds = new Set()
  for (const seg of bare.split(/&&|\|\||[;|\n]/)) {
    const s = seg
      .trim()
      .replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*/, "")
      .replace(/^(?:sudo|time|nice|env)\s+/, "")
    for (const [kind, re] of GATE_KINDS) if (re.test(s)) kinds.add(kind)
  }
  return [...kinds]
}
const SYNTHETIC_USER_TEXT =
  /^\s*(\[Request interrupted by user[^\]]*\]|<local-command-stdout>|<task-notification>|API Error:|No response requested\.)/
const textOf = (c) =>
  typeof c === "string"
    ? c
    : Array.isArray(c)
      ? c
          .filter((b) => b?.type === "text" && typeof b.text === "string")
          .map((b) => b.text)
          .join("\n")
      : ""

// digest-transcript.mjs classifyUser, reimplemented; verified identical on 2 sessions
function isHumanTurn(o) {
  if (o.isSidechain || o.toolUseResult !== undefined) return false
  const c = o.message?.content
  if (Array.isArray(c) && c.some((b) => b?.type === "tool_result")) return false
  if (o.isMeta || o.isCompactSummary) return false
  if (o.origin?.kind && o.origin.kind !== "human") return false
  if (SYNTHETIC_USER_TEXT.test(textOf(c))) return false
  return true
}

async function scanMain(file) {
  const out = {
    ok: false,
    events: [],
    assistant: [],
    skillReads: [],
    miseWrites: [],
    miseTouches: [],
    edits: [],
    skillInjections: [],
    humanTurns: [],
  }
  if (!fs.existsSync(file)) return out
  out.ok = true
  const pendingRead = new Map()
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line.trim()) continue
    let o
    try {
      o = JSON.parse(line)
    } catch {
      continue
    }
    const ts = o.timestamp ? Date.parse(o.timestamp) : null
    if (o.type === "assistant" && !o.isSidechain) {
      if (ts != null) out.events.push({ t: ts, kind: "model" })
      const m = o.message
      if (m?.id)
        out.assistant.push({
          t: ts,
          model: m.model,
          id: m.id,
          u: m.usage || {},
        })
      if (Array.isArray(m?.content)) {
        for (const b of m.content) {
          if (b.type !== "tool_use") continue
          const inp = JSON.stringify(b.input || {})
          if (/\.mise\//.test(inp) && ts != null) out.miseTouches.push(ts)
          const hits = skillHits(inp)
          if (hits.length && (b.name === "Read" || b.name === "Bash"))
            pendingRead.set(b.id, { t: ts, tool: b.name, files: hits })
          if (
            b.name === "Write" ||
            b.name === "Edit" ||
            b.name === "MultiEdit" ||
            b.name === "NotebookEdit"
          ) {
            if (ts != null) out.edits.push(ts)
            const fp = b.input?.file_path || ""
            if (/\/\.mise\//.test(fp))
              out.miseWrites.push({
                t: ts,
                file: fp.replace(/^.*\/\.mise\//, ".mise/"),
                tool: b.name,
              })
          }
        }
      }
    } else if (o.type === "user" && !o.isSidechain) {
      const c = o.message?.content
      if (Array.isArray(c) && c.some((b) => b?.type === "tool_result")) {
        if (ts != null) out.events.push({ t: ts, kind: "tool" })
        for (const b of c) {
          if (b.type !== "tool_result") continue
          const p = pendingRead.get(b.tool_use_id)
          if (!p) continue
          pendingRead.delete(b.tool_use_id)
          const chars =
            typeof b.content === "string"
              ? b.content.length
              : Array.isArray(b.content)
                ? b.content.reduce((a, x) => a + (x?.text?.length || 0), 0)
                : 0
          for (const f of p.files)
            out.skillReads.push({
              t: p.t,
              tool: p.tool,
              file: f,
              resultChars: Math.round(chars / p.files.length),
            })
        }
      } else if (o.isMeta) {
        const t = textOf(c)
        const m = /^Base directory for this skill: (\S+)/.exec(t)
        if (m) out.skillInjections.push({ t: ts, chars: t.length, skill: m[1] })
      } else if (isHumanTurn(o)) {
        if (ts != null) {
          out.events.push({ t: ts, kind: "human" })
          out.humanTurns.push({
            t: ts,
            head: textOf(c)
              .replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, "")
              .trim()
              .slice(0, 120),
          })
        }
      }
    } else if (o.type === "system" && o.subtype === "api_error") {
      if (ts != null) out.events.push({ t: ts, kind: "model" })
    }
  }
  out.events.sort((a, b) => a.t - b.t)
  out.miseTouches.sort((a, b) => a - b)
  return out
}

const scanStats = { agentFiles: 0, agentMissing: 0, agentBytes: 0 }
async function scanAgent(file) {
  const edits = [],
    skillReads = []
  if (!fs.existsSync(file)) {
    scanStats.agentMissing++
    return { ok: false, edits, skillReads }
  }
  scanStats.agentFiles++
  scanStats.agentBytes += fs.statSync(file).size
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line.includes('"tool_use"')) continue
    let o
    try {
      o = JSON.parse(line)
    } catch {
      continue
    }
    if (o.type !== "assistant" || !Array.isArray(o.message?.content)) continue
    const t = o.timestamp ? Date.parse(o.timestamp) : null
    for (const b of o.message.content) {
      if (b.type !== "tool_use") continue
      if (
        b.name === "Write" ||
        b.name === "Edit" ||
        b.name === "MultiEdit" ||
        b.name === "NotebookEdit"
      )
        edits.push(t)
      if (b.name === "Read" || b.name === "Bash") {
        for (const f of skillHits(JSON.stringify(b.input || {}))) {
          skillReads.push({ t, file: f, tool: b.name })
        }
      }
    }
  }
  edits.sort((a, b) => a - b)
  return { ok: true, edits, skillReads }
}

// --------------------------------------------------------- phase 1: sessions

async function buildSession(dg) {
  const src = dg.source
  const sessionDir = src.path.replace(/\.jsonl$/, "")
  const subDir = path.join(sessionDir, "subagents")

  const meta = new Map()
  if (fs.existsSync(subDir)) {
    for (const f of fs
      .readdirSync(subDir)
      .filter((x) => x.endsWith(".meta.json"))) {
      try {
        meta.set(
          f.replace(/^agent-|\.meta\.json$/g, ""),
          JSON.parse(fs.readFileSync(path.join(subDir, f), "utf8")),
        )
      } catch {
        /* ignore */
      }
    }
  }
  const spawns = (dg.subagents || []).map((s) => {
    const m = meta.get(s.agentId) || {}
    return {
      ts: s.ts || s.transcript?.start,
      agentId: s.agentId,
      parentAgentId: m.parentAgentId || null,
      depth: s.spawnDepth ?? m.spawnDepth ?? (s.toolUseId ? 1 : null),
      description: s.description,
      promptHead200: s.promptHead200,
      type: s.subagent_type,
      artifactKind: s.miseArtifactKind,
      miseRole: s.miseRole,
      model: s.resolvedModel || m.model || null,
      byModel: s.transcript?.byModel || {},
      durationMs: s.transcript?.wallMs ?? s.durationMs ?? null,
      transcriptFile: s.transcript?.file || null,
      end: s.transcript?.end || null,
      toolUses: s.toolUses ?? null,
    }
  })
  // One agent can have several `subagents[]` records: the digest emits one per
  // main-thread Agent block, and a resumed agent is dispatched more than once against
  // the same transcript. 73 of 2017 records in this corpus are such repeats. Collapse
  // to one record per agentId (keeping the one that carries the transcript) so tokens
  // and minutes are not multiplied; `dispatches` keeps the dispatch count.
  const collapsed = new Map()
  for (const sp of spawns) {
    const prev = collapsed.get(sp.agentId)
    if (!prev) {
      sp.dispatches = 1
      collapsed.set(sp.agentId, sp)
      continue
    }
    prev.dispatches++
    const better =
      (sumModels(sp.byModel).requests || 0) >
      (sumModels(prev.byModel).requests || 0)
    if (better) {
      sp.dispatches = prev.dispatches
      sp.ts = prev.ts < sp.ts ? prev.ts : sp.ts
      sp.role = sp.role || prev.role
      collapsed.set(sp.agentId, sp)
    }
  }
  spawns.length = 0
  spawns.push(...collapsed.values())
  for (const s of spawns) s.role = classifyRole(s)
  const byId = new Map(spawns.map((s) => [s.agentId, s]))
  for (const s of spawns) {
    if (s.role) continue
    let cur = s,
      guard = 0
    while (cur?.parentAgentId && guard++ < 8) {
      cur = byId.get(cur.parentAgentId)
      if (cur?.role) {
        s.role = cur.role
        s.roleInherited = true
        break
      }
    }
  }

  const main = await scanMain(src.path)

  const markers = []
  for (const c of dg.mise?.stateCalls || []) markers.push(Date.parse(c.ts))
  for (const s of dg.slashCommands || [])
    if (/^\/mise/.test(s.name)) markers.push(Date.parse(s.ts))
  for (const s of dg.skills || [])
    if (/^mise/.test(s.skill)) markers.push(Date.parse(s.ts))
  for (const s of spawns)
    if (s.role && s.ts) {
      markers.push(Date.parse(s.ts))
      if (s.end) markers.push(Date.parse(s.end))
    }
  for (const t of main.miseTouches) markers.push(t)
  if (!markers.length) return null

  // per-agent edit timelines (needed for gate-rerun detection) and skill-file reads
  const agentEdits = new Map()
  const agentSkillReads = {}
  const threads = new Set(
    (dg.commandRuns || [])
      .map((c) => c.thread)
      .filter((t) => t && t !== "main"),
  )
  for (const s of spawns)
    if (s.role && s.transcriptFile) threads.add(`agent:${s.agentId}`)
  for (const th of threads) {
    const id = th.slice(6)
    const sp = byId.get(id)
    const f = sp?.transcriptFile
      ? path.join(path.dirname(sessionDir), sp.transcriptFile)
      : path.join(subDir, `agent-${id}.jsonl`)
    const r = await scanAgent(f)
    agentEdits.set(th, r.ok ? r.edits : null)
    if (sp?.role)
      for (const x of r.skillReads)
        agentSkillReads[`${roleKey(sp)}|${x.file}`] =
          (agentSkillReads[`${roleKey(sp)}|${x.file}`] || 0) + 1
  }
  agentEdits.set("main", main.ok ? main.edits : null)

  return {
    projectDir: src.projectDir,
    sessionId: src.sessionId,
    path: src.path,
    rawAvailable: main.ok,
    cwds: dg.session.cwds,
    branches: dg.session.gitBranches,
    miseVersions: dg.mise?.versions || [],
    sessionStart: dg.session.start,
    sessionEnd: dg.session.end,
    spanStart: Math.min(...markers),
    spanEnd: Math.max(...markers),
    spawns,
    main,
    agentEdits,
    agentSkillReads,
    stateCalls: dg.mise?.stateCalls || [],
    commandRuns: dg.commandRuns || [],
    compactions: dg.compactions || [],
    permissionDenials: (dg.permissionDenials || []).length,
    digestWall: dg.wall,
    digestTokens: dg.tokens,
  }
}

// --------------------------------------------------------- phase 2: join

function joinSessionsToRuns(sessions, runs) {
  const SLACK = 36 * 3600 * 1000
  const out = []
  for (const s of sessions) {
    const repo = repoOfCwd(s.cwds?.[0])
    const branches = (s.branches || []).filter((b) => b && b !== "HEAD")
    const cands = runs.filter((r) => r.repo === repo)
    const ov = (a, b) => Math.min(s.spanEnd, b) - Math.max(s.spanStart, a)
    const score = (r) => {
      if (!r.first) return [-Infinity, -Infinity]
      const commit = ov(
        Date.parse(r.first) - SLACK,
        Date.parse(r.last || r.first) + SLACK,
      )
      const ext = ov(
        Date.parse(r.first) - SLACK,
        Date.parse(r.extEnd || r.last || r.first) + SLACK,
      )
      return [commit, ext]
    }
    let pool = cands.filter((r) => branches.includes(r.branch))
    let basis = pool.length ? "branch" : "repo"
    if (!pool.length) pool = cands
    const scored = pool.map((r) => ({ r, sc: score(r) }))
    // a run's commit window wins when it covers the session; only if no commit window
    // does is the review-ref window (post-rebase work whose branch ref is gone) used
    const commitHits = scored
      .filter((x) => x.sc[0] > 0)
      .sort((a, b) => b.sc[0] - a.sc[0])
    const extHits = scored
      .filter((x) => x.sc[1] > 0)
      .sort((a, b) => b.sc[1] - a.sc[1])
    const top = commitHits[0] || extHits[0] || null
    out.push({
      session: s,
      run: top?.r || null,
      basis: top
        ? `${basis}+${commitHits[0] ? "commit-window" : "review-window"}`
        : null,
      repo,
      branches,
    })
  }
  return out
}

// --------------------------------------------------------- phase 3: timeline

function nextStageAfter(stage, hasMock) {
  const i = STAGE_ORDER.indexOf(stage)
  if (i < 0) return null
  let j = i + 1
  if (STAGE_ORDER[j] === "mock" && !hasMock) j++
  return STAGE_ORDER[j] || null
}

function buildTimeline(run, sessList) {
  const froms = new Map() // t -> {stage, prio}
  const uptos = new Map()
  const addFrom = (t, stage, prio) => {
    if (!STAGE_ORDER.includes(stage)) return
    const cur = froms.get(t)
    if (!cur || prio < cur.prio) froms.set(t, { stage, prio })
  }
  const addUpto = (t, stage) => {
    if (STAGE_ORDER.includes(stage) && !uptos.has(t)) uptos.set(t, stage)
  }

  const hasMock = (run?.transitions || []).some((x) => x.stage === "mock")
  for (const tr of run?.transitions || []) {
    const t = Date.parse(tr.ts)
    if (tr.event === "approved" || tr.event === "reapproved") {
      addUpto(t, tr.stage)
      const nx = nextStageAfter(tr.stage, hasMock)
      if (nx) addFrom(t, nx, 2)
    } else if (tr.event === "reopened") addFrom(t, tr.stage, 0)
    else if (tr.event === "accepted") addUpto(t, "acceptance")
  }
  for (const s of sessList) {
    for (const c of s.stateCalls) {
      const t = Date.parse(c.ts)
      if (c.subcommand === "approve" && c.stage) {
        addUpto(t, c.stage)
        const nx = nextStageAfter(c.stage, hasMock)
        if (nx) addFrom(t, nx, 2)
      }
      const na = c.report?.next_action
      if (na)
        addFrom(
          t,
          na.startsWith("stage:")
            ? na.slice(6)
            : na.startsWith("task:")
              ? "execute"
              : na,
          0,
        )
    }
    for (const sp of s.spawns) {
      if (!sp.role || !sp.ts) continue
      const st =
        sp.role === "critic"
          ? sp.artifactKind === "plan"
            ? "plan"
            : sp.artifactKind === "requirements"
              ? "requirements"
              : /plan/i.test(sp.description || "")
                ? "plan"
                : "requirements"
          : ROLE_STAGE[sp.role]
      if (st) addFrom(Date.parse(sp.ts), st, 1)
    }
  }
  const bounds = [...new Set([...froms.keys(), ...uptos.keys()])].sort(
    (a, b) => a - b,
  )
  const segs = []
  let carry = null
  for (let i = 0; i < bounds.length; i++) {
    const t = bounds[i]
    const stage =
      froms.get(t)?.stage ?? uptos.get(bounds[i + 1]) ?? carry ?? "setup"
    carry = stage
    segs.push({ t, stage })
  }
  return {
    assertions: bounds.length,
    stageAt(t) {
      if (!segs.length || t < segs[0].t) return "setup"
      let lo = 0,
        hi = segs.length - 1,
        ans = 0
      while (lo <= hi) {
        const m = (lo + hi) >> 1
        if (segs[m].t <= t) {
          ans = m
          lo = m + 1
        } else hi = m - 1
      }
      return segs[ans].stage
    },
  }
}

// --------------------------------------------------------- phase 4: aggregate

const newStage = () => ({
  spawns: 0,
  spawnsByRole: {},
  subTokensByModel: {},
  subDurationMs: 0,
  driverTokensByModel: {},
  driverRequests: 0,
  modelMs: 0,
  toolMs: 0,
  humanWaitMs: 0,
  humanWaitCappedMs: 0,
  longestHumanWaitMs: 0,
  humanTurns: 0,
  gateRuns: 0,
  gateMs: 0,
  gateRunsStrict: 0,
  gateMsStrict: 0,
  miseArtifactWrites: 0,
  skillFileReads: {},
  compactions: 0,
  tokensByRole: {},
})
const newRole = () => ({
  spawns: 0,
  tokensByModel: {},
  durationMs: 0,
  gateRuns: 0,
  gateMs: 0,
  gateRunsStrict: 0,
  gateMsStrict: 0,
  depth2plus: 0,
  toolUses: 0,
})

function aggregateRun(run, list) {
  const sessList = list.map((a) => a.session)
  const tl = buildTimeline(run, sessList)
  const stages = {},
    roles = {}
  const S = (k) => (stages[k] ||= newStage())
  const R = (k) => (roles[k] ||= newRole())

  const spans = [],
    sessions = [],
    spawnDetail = [],
    waits = [],
    gateAll = []
  const outside = { spawns: 0, subOutput: 0, driverRequests: 0, ms: 0 }
  const driverByModel = {},
    subByModel = {},
    depthCounts = {},
    agentSkillReads = {}
  let compactions = 0,
    stateCalls = 0,
    maxDepth = 0,
    rawMissing = 0,
    denials = 0
  const skillInjections = []
  const repeats = { checked: 0, noEdit: 0, unknown: 0, byCommand: {} }
  const repeatsStrict = { checked: 0, noEdit: 0, unknown: 0, byCommand: {} }

  for (const a of list) {
    const s = a.session
    const inSpan = (t) => t >= s.spanStart && t <= s.spanEnd
    sessions.push({
      projectDir: s.projectDir,
      sessionId: s.sessionId,
      basis: a.basis,
      rawAvailable: s.rawAvailable,
      spanStart: new Date(s.spanStart).toISOString(),
      spanEnd: new Date(s.spanEnd).toISOString(),
      sessionStart: s.sessionStart,
      sessionEnd: s.sessionEnd,
    })
    if (!s.rawAvailable) rawMissing++
    spans.push([
      new Date(s.spanStart).toISOString(),
      new Date(s.spanEnd).toISOString(),
    ])
    stateCalls += s.stateCalls.length
    denials += s.permissionDenials

    for (const sp of s.spawns) {
      const t = sp.ts ? Date.parse(sp.ts) : null
      maxDepth = Math.max(maxDepth, sp.depth || 0)
      if (t == null || !inSpan(t)) {
        outside.spawns++
        outside.subOutput += sumModels(sp.byModel).output
        sp.stage = null
        continue
      }
      depthCounts[sp.depth ?? "null"] =
        (depthCounts[sp.depth ?? "null"] || 0) + 1
      const st =
        sp.role && sp.role !== "critic" && ROLE_STAGE[sp.role]
          ? ROLE_STAGE[sp.role]
          : tl.stageAt(t)
      sp.stage = st
      const rk = roleKey(sp)
      const b = S(st)
      b.spawns++
      b.spawnsByRole[rk] = (b.spawnsByRole[rk] || 0) + 1
      addByModel(b.subTokensByModel, sp.byModel)
      b.subDurationMs += sp.durationMs || 0
      const bt = (b.tokensByRole[rk] ||= {
        spawns: 0,
        tokens: zero(),
        durationMs: 0,
      })
      bt.spawns++
      addTok(bt.tokens, sumModels(sp.byModel))
      bt.durationMs += sp.durationMs || 0
      const r = R(rk)
      r.spawns++
      addByModel(r.tokensByModel, sp.byModel)
      r.durationMs += sp.durationMs || 0
      r.toolUses += sp.toolUses || 0
      if ((sp.depth || 1) >= 2) r.depth2plus++
      addByModel(subByModel, sp.byModel)
      spawnDetail.push({
        sessionId: s.sessionId,
        agentId: sp.agentId,
        ts: sp.ts,
        role: rk,
        stage: st,
        depth: sp.depth,
        model: sp.model,
        description: sp.description,
        tokens: sumModels(sp.byModel),
        durationMs: sp.durationMs,
        dispatches: sp.dispatches || 1,
      })
    }

    // Sessions whose raw transcript has been pruned from ~/.claude/projects keep only
    // their digest. Their driver tokens and wall split are session-level totals, so they
    // are booked whole to `(unattributed)` rather than guessed onto stages.
    if (!s.rawAvailable) {
      const b = S("(unattributed)")
      addByModel(driverByModel, s.digestTokens?.main?.byModel || {})
      addByModel(b.driverTokensByModel, s.digestTokens?.main?.byModel || {})
      b.driverRequests += sumModels(
        s.digestTokens?.main?.byModel || {},
      ).requests
      b.modelMs += s.digestWall?.modelMs || 0
      b.toolMs += s.digestWall?.toolMs || 0
      b.humanWaitMs += s.digestWall?.humanWaitMs || 0
      b.humanWaitCappedMs += s.digestWall?.humanWaitMsCapped30m || 0
      b.longestHumanWaitMs = Math.max(
        b.longestHumanWaitMs,
        s.digestWall?.longestHumanWaitMs || 0,
      )
      sessions[sessions.length - 1].fallback =
        "session-digest totals booked to (unattributed)"
      sessions[sessions.length - 1].spanCoverageOfSession = +(
        (s.spanEnd - s.spanStart) /
        Math.max(1, Date.parse(s.sessionEnd) - Date.parse(s.sessionStart))
      ).toFixed(3)
    }

    // driver tokens: max per message.id, then to the stage of the first row of that id
    const perId = new Map()
    for (const x of s.main.assistant) {
      const cur = perId.get(x.id) || { t: x.t, model: x.model, u: {} }
      cur.t = Math.min(cur.t, x.t)
      for (const [k, v] of Object.entries(x.u || {}))
        cur.u[k] = Math.max(cur.u[k] || 0, v || 0)
      perId.set(x.id, cur)
    }
    for (const v of perId.values()) {
      const tok = {
        input: v.u.input_tokens || 0,
        cacheRead: v.u.cache_read_input_tokens || 0,
        cacheCreate: v.u.cache_creation_input_tokens || 0,
        output: v.u.output_tokens || 0,
        thinking: 0,
        requests: 1,
      }
      if (!inSpan(v.t)) {
        outside.driverRequests++
        continue
      }
      addTok((driverByModel[v.model] ||= zero()), tok)
      const b = S(tl.stageAt(v.t))
      addTok((b.driverTokensByModel[v.model] ||= zero()), tok)
      b.driverRequests++
    }

    // wall partition
    let lastT = null
    for (const e of s.main.events) {
      if (lastT === null) {
        lastT = e.t
        continue
      }
      const d = e.t - lastT
      if (d < 0) continue
      lastT = e.t
      if (!inSpan(e.t)) {
        outside.ms += d
        continue
      }
      const b = S(tl.stageAt(e.t))
      if (e.kind === "model") b.modelMs += d
      else if (e.kind === "tool") b.toolMs += d
      else {
        b.humanWaitMs += d
        b.humanWaitCappedMs += Math.min(d, 30 * MIN)
        b.longestHumanWaitMs = Math.max(b.longestHumanWaitMs, d)
        b.humanTurns++
        waits.push({
          ms: d,
          stage: tl.stageAt(e.t),
          ts: new Date(e.t).toISOString(),
        })
      }
    }

    for (const r of s.main.skillReads) {
      if (!inSpan(r.t)) continue
      const e = (S(tl.stageAt(r.t)).skillFileReads[r.file] ||= {
        n: 0,
        chars: 0,
      })
      e.n++
      e.chars += r.resultChars || 0
    }
    for (const w of s.main.miseWrites)
      if (inSpan(w.t)) S(tl.stageAt(w.t)).miseArtifactWrites++
    for (const c of s.compactions) {
      const t = Date.parse(c.ts)
      if (!inSpan(t)) continue
      compactions++
      S(tl.stageAt(t)).compactions++
    }
    for (const x of s.main.skillInjections)
      if (inSpan(x.t)) skillInjections.push(x)
    for (const [k, v] of Object.entries(s.agentSkillReads))
      agentSkillReads[k] = (agentSkillReads[k] || 0) + v

    // quality gates (digest commandRuns cover the main thread AND every subagent)
    const agentStage = new Map(s.spawns.map((x) => [x.agentId, x.stage]))
    const agentRole = new Map(s.spawns.map((x) => [x.agentId, roleKey(x)]))
    const gates = []
    for (const c of s.commandRuns) {
      const t = Date.parse(c.ts)
      if (!inSpan(t)) continue
      const id = c.thread?.startsWith("agent:") ? c.thread.slice(6) : null
      const st = id ? (agentStage.get(id) ?? tl.stageAt(t)) : tl.stageAt(t)
      const sk = strictKinds(c.command || "")
      const g = {
        t,
        thread: c.thread || "main",
        kinds: c.kinds || [],
        strict: sk.length > 0,
        strictKinds: sk,
        command: c.command || "",
        durationMs: c.durationMs,
        stage: st,
        role: id ? agentRole.get(id) || "other" : "driver",
      }
      gates.push(g)
      gateAll.push(g)
      const b = S(st)
      b.gateRuns++
      b.gateMs += c.durationMs || 0
      const r = R(g.role)
      r.gateRuns++
      r.gateMs += c.durationMs || 0
      if (g.strict) {
        b.gateRunsStrict++
        b.gateMsStrict += c.durationMs || 0
        r.gateRunsStrict++
        r.gateMsStrict += c.durationMs || 0
      }
    }
    const byThread = new Map()
    for (const g of gates)
      (byThread.get(g.thread) || byThread.set(g.thread, []).get(g.thread)).push(
        g,
      )
    for (const [th, lst] of byThread) {
      lst.sort((a2, b2) => a2.t - b2.t)
      const edits = s.agentEdits.get(th)
      const seen = new Map()
      for (const g of lst) {
        const key = g.command.trim()
        const prev = seen.get(key)
        if (prev != null) {
          const noEdit = edits ? !edits.some((e) => e > prev && e < g.t) : null
          repeats.checked++
          if (noEdit === null) repeats.unknown++
          else if (noEdit) {
            repeats.noEdit++
            repeats.byCommand[key.slice(0, 80)] =
              (repeats.byCommand[key.slice(0, 80)] || 0) + 1
          }
          if (g.strict) {
            repeatsStrict.checked++
            if (noEdit === null) repeatsStrict.unknown++
            else if (noEdit) {
              repeatsStrict.noEdit++
              repeatsStrict.byCommand[key.slice(0, 80)] =
                (repeatsStrict.byCommand[key.slice(0, 80)] || 0) + 1
            }
          }
        }
        seen.set(key, g.t)
      }
    }
  }

  const tot = (f) => Object.values(stages).reduce((a, b) => a + f(b), 0)
  const modelMs = tot((b) => b.modelMs),
    toolMs = tot((b) => b.toolMs)
  const ver = semverMax([
    run.miseVersion,
    ...sessList.flatMap((s) => s.miseVersions),
  ])
  const waitsSorted = waits.sort((a, b) => b.ms - a.ms)

  return {
    runId: run.runId,
    repo: run.repo,
    branch: run.branch,
    type: run.type,
    route: run.route,
    status: run.status,
    miseVersionCeiling: ver,
    miseVersionMajor: ver ? ver.split(".")[0] : null,
    locCodeTotal: run.loc?.codeTotal ?? null,
    locFilesChanged: run.loc?.filesChanged ?? null,
    taskCount: run.taskCount,
    tasksDone: run.tasksDone,
    artifactLines: run.artifactLines,
    artifactLinesTotal: run.artifactLines
      ? Object.values(run.artifactLines).reduce((a, b) => a + (b || 0), 0)
      : null,
    gitFirstCommit: run.first,
    gitLastCommit: run.last,
    sessionCount: sessions.length,
    sessions,
    rawTranscriptsMissing: rawMissing,
    stageAssertions: tl.assertions,
    wallClockMs: mergeSpans(spans),
    modelMs,
    toolMs,
    activeMs: modelMs + toolMs,
    humanWaitMs: tot((b) => b.humanWaitMs),
    humanWaitCappedMs: tot((b) => b.humanWaitCappedMs),
    longestHumanWaitMs: Math.max(
      0,
      ...Object.values(stages).map((b) => b.longestHumanWaitMs),
    ),
    topWaits: waitsSorted.slice(0, 5),
    tokens: {
      driverByModel,
      driverTotal: sumModels(driverByModel),
      subagentByModel: subByModel,
      subagentTotal: sumModels(subByModel),
      combinedOutput:
        sumModels(driverByModel).output + sumModels(subByModel).output,
    },
    spawnsTotal: Object.values(roles).reduce((a, b) => a + b.spawns, 0),
    dispatchesTotal: spawnDetail.reduce((a, x) => a + (x.dispatches || 1), 0),
    maxSpawnDepth: maxDepth,
    depthCounts,
    compactions,
    stateCalls,
    permissionDenials: denials,
    gates: {
      runs: gateAll.length,
      totalMs: gateAll.reduce((a, g) => a + (g.durationMs || 0), 0),
      byKind: gateAll.reduce((a, g) => {
        for (const k of g.kinds) a[k] = (a[k] || 0) + 1
        return a
      }, {}),
      repeatSameCommand: repeats.checked,
      repeatNoInterveningEdit: repeats.noEdit,
      repeatEditUnknown: repeats.unknown,
      topRepeatedCommands: Object.entries(repeats.byCommand)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      strictRuns: gateAll.filter((g) => g.strict).length,
      strictMs: gateAll
        .filter((g) => g.strict)
        .reduce((a, g) => a + (g.durationMs || 0), 0),
      strictByKind: gateAll
        .filter((g) => g.strict)
        .reduce((a, g) => {
          for (const k of g.strictKinds) a[k] = (a[k] || 0) + 1
          return a
        }, {}),
      strictRepeatSameCommand: repeatsStrict.checked,
      strictRepeatNoInterveningEdit: repeatsStrict.noEdit,
      strictRepeatEditUnknown: repeatsStrict.unknown,
      strictTopRepeatedCommands: Object.entries(repeatsStrict.byCommand)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    },
    driverSkillInjections: skillInjections.length,
    driverSkillInjectionChars: skillInjections.reduce((a, x) => a + x.chars, 0),
    agentSkillReads,
    outside,
    byStage: stages,
    byRole: roles,
    spawnDetail,
  }
}

// ------------------------------------------------------------------ run it

const digests = []
for (const d of fs.readdirSync(path.join(ROOT, "digests"))) {
  const dir = path.join(ROOT, "digests", d)
  if (!fs.statSync(dir).isDirectory()) continue
  for (const f of fs.readdirSync(dir))
    digests.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
}
const miseDigests = digests.filter(
  (d) => d.mise?.invoked || (d.mise?.stateCalls || []).length,
)
process.stderr.write(
  `digests ${digests.length}; mise sessions ${miseDigests.length}\n`,
)

const sessions = []
for (const dg of miseDigests) {
  const s = await buildSession(dg)
  if (s) sessions.push(s)
}
process.stderr.write(
  `subagent transcripts scanned ${scanStats.agentFiles} (${(scanStats.agentBytes / 1e6).toFixed(0)} MB), missing ${scanStats.agentMissing}\n`,
)
const runs = loadRuns()
const assigned = joinSessionsToRuns(sessions, runs)
const unmatched = assigned.filter((a) => !a.run)
for (const u of unmatched)
  process.stderr.write(
    `UNMATCHED ${u.session.projectDir}/${u.session.sessionId.slice(0, 8)} branches=${JSON.stringify(u.branches)}\n`,
  )

const groups = new Map()
for (const a of assigned)
  if (a.run)
    (
      groups.get(a.run.runId) || groups.set(a.run.runId, []).get(a.run.runId)
    ).push(a)
const rows = []
for (const [, list] of groups) rows.push(aggregateRun(list[0].run, list))
rows.sort((a, b) =>
  (a.gitFirstCommit || "").localeCompare(b.gitFirstCommit || ""),
)

fs.writeFileSync(
  path.join(ROOT, "run-costs.jsonl"),
  rows.map((r) => JSON.stringify(r)).join("\n") + "\n",
)
process.stderr.write(
  `runs with transcripts ${rows.length}; sessions joined ${assigned.length - unmatched.length}/${assigned.length}\n`,
)

if (WRITE_MD) {
  const { renderMd } = await import("./run-costs-md.mjs")
  fs.writeFileSync(
    path.join(ROOT, "run-costs.md"),
    renderMd(rows, { unmatched }),
  )
  process.stderr.write(`wrote ${path.join(ROOT, "run-costs.md")}\n`)
}
