#!/usr/bin/env node
// digest-transcript.mjs — deterministic digest of one Claude Code session transcript.
// No dependencies. Streams line by line; never buffers a whole file.
//
//   node digest-transcript.mjs <session.jsonl> [--out <file.json>] [--pretty]
//
// Layout it expects (verified 2026-09-19, see README.md):
//   <projectDir>/<sessionId>.jsonl                          main thread
//   <projectDir>/<sessionId>/subagents/agent-<id>.jsonl      one per subagent, isSidechain:true
//   <projectDir>/<sessionId>/subagents/agent-<id>.meta.json  {agentType,description,toolUseId,spawnDepth,model}
//   <projectDir>/<sessionId>/tool-results/<id>.txt           offloaded large tool output (not read)

import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"

const SCHEMA_VERSION = 1

// ---------------------------------------------------------------- utilities

const ms = (a, b) => Date.parse(b) - Date.parse(a)

function newTokens() {
  return {
    input: 0,
    cacheRead: 0,
    cacheCreate: 0,
    output: 0,
    thinking: 0,
    requests: 0,
  }
}

function addUsage(acc, u) {
  acc.input += u.input_tokens || 0
  acc.cacheRead += u.cache_read_input_tokens || 0
  acc.cacheCreate += u.cache_creation_input_tokens || 0
  acc.output += u.output_tokens || 0
  acc.thinking += u.output_tokens_details?.thinking_tokens || 0
  acc.requests += 1
}

function addTokens(acc, t) {
  for (const k of Object.keys(acc)) acc[k] += t[k] || 0
}

/**
 * One API response is written as several JSONL rows (one per content block), and
 * in subagent transcripts those rows carry *progressive* usage: an early row may
 * say output_tokens=4 and the final row 111. Both the main thread and subagent
 * threads therefore need max-per-message.id accounting, not first- or sum-per-row.
 */
class UsageLedger {
  constructor() {
    this.byId = new Map()
  }

  record(id, model, u) {
    if (!id || !u) return
    const key = model || "unknown"
    const prev = this.byId.get(id)
    const next = {
      model: key,
      input: u.input_tokens || 0,
      cacheRead: u.cache_read_input_tokens || 0,
      cacheCreate: u.cache_creation_input_tokens || 0,
      output: u.output_tokens || 0,
      thinking: u.output_tokens_details?.thinking_tokens || 0,
    }
    if (!prev) {
      this.byId.set(id, next)
      return
    }
    for (const k of [
      "input",
      "cacheRead",
      "cacheCreate",
      "output",
      "thinking",
    ]) {
      if (next[k] > prev[k]) prev[k] = next[k]
    }
    if (prev.model === "unknown" && key !== "unknown") prev.model = key
  }

  rollup() {
    const total = newTokens()
    const byModel = {}
    for (const r of this.byId.values()) {
      if (!byModel[r.model]) byModel[r.model] = newTokens()
      const m = byModel[r.model]
      for (const k of [
        "input",
        "cacheRead",
        "cacheCreate",
        "output",
        "thinking",
      ]) {
        total[k] += r[k]
        m[k] += r[k]
      }
      total.requests += 1
      m.requests += 1
    }
    return { total, byModel }
  }

  get size() {
    return this.byId.size
  }
}

const textOf = (content) => {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  return content
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
}

// Wrappers the harness injects into an otherwise human message.
const INJECTED_WRAPPER =
  /<ide_opened_file>[\s\S]*?<\/ide_opened_file>|<ide_selection>[\s\S]*?<\/ide_selection>|<system-reminder>[\s\S]*?<\/system-reminder>/g

const SYNTHETIC_USER_TEXT =
  /^\s*(\[Request interrupted by user[^\]]*\]|<local-command-stdout>|<task-notification>|API Error:|No response requested\.)/

const SLASH_RE = /<command-name>\s*(\/[\w:.-]+)\s*<\/command-name>/

/**
 * A "real user message" is a turn the human actually submitted.
 * Discriminators, in order of reliability:
 *   1. origin.kind === 'human'            (Claude Code >= ~2.1.237 stamps this)
 *   2. no origin field at all             (older builds) -> accept only if the text
 *      is a typed slash command and not a local-command echo / interrupt marker
 * Always excluded: tool results, isMeta (skill-body injections, caveats),
 * isCompactSummary, isSidechain, origin.kind of 'task-notification' | 'peer'.
 */
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

  // Builds before ~2.1.237 do not stamp `origin`. Scored against 1366 origin-stamped
  // human turns across 76 sessions, "not a synthetic marker" reproduces origin.kind
  // === 'human' with 0 misses; its only false positives were <task-notification>
  // blocks, which SYNTHETIC_USER_TEXT now excludes.
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

// ------------------------------------------------------- command classifier

// Classification runs per shell *segment* and only on the segment's head word, so
// `echo "=== vitest.config.ts ==="` and a python heredoc that mentions `yarn build`
// are not mistaken for gate runs. Script names are matched after the package runner.
const RUNNER = String.raw`(?:yarn|npm|pnpm|npx|bun|deno)(?:\s+(?:run|exec|dlx))?`
const SEGMENT_KINDS = [
  // `test:up`/`test:down` start and stop emulators; they are not a test run.
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

// $? is not what the gate returned once the command masks or reroutes it.
const EXIT_MASKED =
  /\|\|\s*true|;\s*echo|\|\s*(head|tail|grep|tee|sed|awk|jq)\b|>\s*\/dev\/null|2>&1\s*\|/

// Heredoc bodies are data, not shell commands.
const HEREDOC = /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1[\s\S]*?^\s*\2\s*$/gm

function shellSegments(cmd) {
  return cmd
    .replace(HEREDOC, " ")
    .split(/&&|\|\||[;|\n]/)
    .map((s) =>
      s
        .trim()
        // drop leading env assignments (FOO=bar cmd) and `time`/`sudo` prefixes
        .replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*/, "")
        .replace(/^(?:sudo|time|nice|env)\s+/, ""),
    )
    .filter(Boolean)
}

function classifyCommand(cmd) {
  const kinds = new Set()
  for (const seg of shellSegments(cmd)) {
    for (const [kind, re] of SEGMENT_KINDS) if (re.test(seg)) kinds.add(kind)
  }
  return [...kinds]
}

const EXIT_CODE_RE = /^\s*(?:Error:\s*)?Exit code (\d+)/

const FAIL_SIGNALS = [
  ["tsError", /error TS\d+/],
  ["eslintProblems", /✖\s+\d+ problems?/],
  ["vitestFailed", /\b\d+ failed\b|Tests\s+\d+\s+failed|FAIL\s+\S/],
  ["jestFailed", /Tests:\s+\d+ failed/],
  ["explicitExitNonZero", /\bexit:\s*[1-9]\d*\b/],
]

// ---------------------------------------------------------- mise state calls

// A single Bash call often chains two state.ts invocations
// (`approve ... && git commit ... && ... report --write`), so this is matched globally.
const MISE_STATE_RE =
  /(?:^|[\s;&|(])(?:node\s+)?(\S*skills\/next\/scripts\/state\.ts)\s+([\w-]+)\s+(\S+)([^\n;&|]*)/g
const MISE_VERSION_RE = /\/mise\/(\d+\.\d+\.\d+)\//
const ROLE_RE = /\/roles\/([a-z-]+)\.md/
const KIND_RE = /\bKind:\s*([\w-]+)/

function parseMiseState(cmd) {
  MISE_STATE_RE.lastIndex = 0
  const found = []
  let m
  while ((m = MISE_STATE_RE.exec(cmd)) !== null) {
    const [, scriptPath, subcommand, miseDir, rest] = m
    const args = rest.trim().split(/\s+/).filter(Boolean)
    // `approve <dir> <stage> [route=x]`, `report <dir> --write`, ...
    const stage =
      subcommand === "approve" && args[0] && !args[0].startsWith("--")
        ? args[0]
        : null
    const routeArg = args.find((a) => a.startsWith("route="))
    found.push({
      scriptPath,
      miseVersion: (scriptPath.match(MISE_VERSION_RE) || [])[1] || null,
      subcommand,
      miseDir,
      stage,
      route: routeArg ? routeArg.slice("route=".length) : null,
      args,
    })
  }
  return found
}

function parseMiseReport(stdout) {
  if (!stdout) return null
  const start = stdout.indexOf("{")
  if (start < 0) return null
  let obj
  try {
    obj = JSON.parse(stdout.slice(start))
  } catch {
    return null
  }
  if (typeof obj !== "object" || obj === null) return null
  const stages = {}
  for (const [k, v] of Object.entries(obj.stages || {}))
    stages[k] = v?.verdict ?? null
  return {
    in_flight: obj.in_flight ?? null,
    file: obj.file ?? null,
    route: obj.route ?? null,
    next_action: obj.next_action ?? null,
    stages,
    error: obj.error ?? null,
  }
}

// ------------------------------------------------- gate-run record builder

function buildCommandRun({
  cmd,
  pendTs,
  ts,
  resultBlock,
  toolUseResult,
  runInBackground,
  thread,
}) {
  const kinds = classifyCommand(cmd)
  if (!kinds.length) return null
  const stdout = String(toolUseResult?.stdout ?? "")
  const stderr = String(toolUseResult?.stderr ?? "")
  const body =
    typeof resultBlock?.content === "string" ? resultBlock.content : ""
  const exitMatch =
    body.match(EXIT_CODE_RE) || String(toolUseResult ?? "").match(EXIT_CODE_RE)
  const signals = FAIL_SIGNALS.filter(
    ([, re]) => re.test(stdout) || re.test(stderr),
  ).map(([n]) => n)
  const masked = EXIT_MASKED.test(cmd)
  const background = !!runInBackground || !!toolUseResult?.backgroundTaskId
  const durationMs = pendTs && ts ? ms(pendTs, ts) : null
  const isError = !!resultBlock?.is_error
  return {
    ts: pendTs,
    thread,
    kinds,
    command: cmd.slice(0, 200),
    durationMs: background ? null : durationMs,
    background,
    isError,
    exitCode: exitMatch ? Number(exitMatch[1]) : isError ? null : 0,
    exitMasked: masked,
    failSignals: signals,
    pass: background
      ? null
      : isError
        ? false
        : signals.length
          ? false
          : masked
            ? null
            : true,
    interrupted: !!toolUseResult?.interrupted,
  }
}

// ------------------------------------------------------ subagent transcripts

async function digestSubagentFile(file) {
  const out = {
    path: file,
    lines: 0,
    parseErrors: 0,
    start: null,
    end: null,
    tokens: newTokens(),
    byModel: {},
    toolCounts: {},
    agentToolUses: 0,
    promptChars: null,
    commandRuns: [],
  }
  const ledger = new UsageLedger()
  const pending = new Map()
  const agentId = path.basename(file, ".jsonl").replace(/^agent-/, "")
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line.trim()) continue
    out.lines += 1
    let o
    try {
      o = JSON.parse(line)
    } catch {
      out.parseErrors += 1
      continue
    }
    if (o.timestamp) {
      if (!out.start || o.timestamp < out.start) out.start = o.timestamp
      if (!out.end || o.timestamp > out.end) out.end = o.timestamp
    }
    if (out.promptChars === null && o.type === "user" && !o.toolUseResult) {
      out.promptChars = textOf(o.message?.content).length
    }
    if (o.type === "user") {
      const blocks = Array.isArray(o.message?.content)
        ? o.message.content.filter((b) => b?.type === "tool_result")
        : []
      for (const b of blocks) {
        const pend = pending.get(b.tool_use_id)
        if (pend?.name === "Bash") {
          const run = buildCommandRun({
            cmd: String(pend.input?.command ?? ""),
            pendTs: pend.ts,
            ts: o.timestamp,
            resultBlock: b,
            toolUseResult: o.toolUseResult,
            runInBackground: pend.input?.run_in_background,
            thread: `agent:${agentId}`,
          })
          if (run) out.commandRuns.push(run)
        }
        pending.delete(b.tool_use_id)
      }
      continue
    }
    if (o.type !== "assistant") continue
    ledger.record(o.message?.id, o.message?.model, o.message?.usage)
    const content = o.message?.content
    if (Array.isArray(content)) {
      for (const b of content) {
        if (b?.type !== "tool_use") continue
        out.toolCounts[b.name] = (out.toolCounts[b.name] || 0) + 1
        if (b.name === "Agent" || b.name === "Task") out.agentToolUses += 1
        pending.set(b.id, {
          name: b.name,
          ts: o.timestamp,
          input: b.input || {},
        })
      }
    }
  }
  const rolled = ledger.rollup()
  out.tokens = rolled.total
  out.byModel = rolled.byModel
  out.wallMs = out.start && out.end ? ms(out.start, out.end) : null
  return out
}

// ------------------------------------------------------------- main digester

export async function digest(sessionFile) {
  const abs = path.resolve(sessionFile)
  const stat = fs.statSync(abs)
  const projectDir = path.basename(path.dirname(abs))
  const sessionId = path.basename(abs, ".jsonl")
  const subagentDir = path.join(path.dirname(abs), sessionId, "subagents")

  const d = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    source: { path: abs, bytes: stat.size, projectDir, sessionId },
    session: {
      sessionIds: [],
      cwds: [],
      gitBranches: [],
      versions: [],
      entrypoints: [],
      start: null,
      end: null,
      wallMs: 0,
      lines: 0,
      parseErrors: 0,
      entryTypes: {},
    },
    wall: {
      totalMs: 0,
      modelMs: 0,
      toolMs: 0,
      toolMsByTool: {},
      humanWaitMs: 0,
      humanWaitMsCapped30m: 0,
      longestHumanWaitMs: 0,
      windowStart: null,
      windowEnd: null,
      eventsCounted: 0,
      outOfOrderEvents: 0,
    },
    tokens: {
      main: { byModel: {}, total: newTokens() },
      subagents: { byModel: {}, total: newTokens() },
      combined: newTokens(),
    },
    subagents: [],
    skills: [],
    slashCommands: [],
    userMessages: [],
    mise: { invoked: false, versions: [], stateCalls: [] },
    compactions: [],
    apiErrors: [],
    permissionDenials: [],
    toolCounts: { byTool: {}, total: 0 },
    commandRuns: [],
    crosscheck: {},
    warnings: [],
  }

  const sets = {
    sessionIds: new Set(),
    cwds: new Set(),
    gitBranches: new Set(),
    versions: new Set(),
    entrypoints: new Set(),
    miseVersions: new Set(),
  }

  const mainLedger = new UsageLedger()
  const pendingTools = new Map() // tool_use_id -> {name, ts, input}
  const agentByToolUse = new Map() // tool_use_id -> subagent record
  let agentToolUseBlocks = 0

  // timeline state
  let lastTs = null

  const attribute = (ts, kind) => {
    if (!d.wall.windowStart) d.wall.windowStart = ts
    d.wall.windowEnd = ts
    if (lastTs === null) {
      lastTs = ts
      d.wall.eventsCounted += 1
      return
    }
    let delta = Date.parse(ts) - Date.parse(lastTs)
    if (delta < 0) {
      d.wall.outOfOrderEvents += 1
      delta = 0
    } else {
      lastTs = ts
    }
    if (kind === "assistant" || kind === "api_error") d.wall.modelMs += delta
    else if (kind === "tool_result") d.wall.toolMs += delta
    else if (kind === "user") {
      d.wall.humanWaitMs += delta
      d.wall.humanWaitMsCapped30m += Math.min(delta, 30 * 60 * 1000)
      if (delta > d.wall.longestHumanWaitMs) d.wall.longestHumanWaitMs = delta
    }
    d.wall.eventsCounted += 1
    return delta
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(abs),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    if (!line.trim()) continue
    d.session.lines += 1
    let o
    try {
      o = JSON.parse(line)
    } catch {
      d.session.parseErrors += 1
      continue
    }
    d.session.entryTypes[o.type] = (d.session.entryTypes[o.type] || 0) + 1
    if (o.sessionId) sets.sessionIds.add(o.sessionId)
    if (o.cwd) sets.cwds.add(o.cwd)
    if (o.gitBranch) sets.gitBranches.add(o.gitBranch)
    if (o.version) sets.versions.add(o.version)
    if (o.entrypoint) sets.entrypoints.add(o.entrypoint)
    if (o.timestamp) {
      if (!d.session.start || o.timestamp < d.session.start)
        d.session.start = o.timestamp
      if (!d.session.end || o.timestamp > d.session.end)
        d.session.end = o.timestamp
    }
    if (o.isSidechain) continue // subagent rows never appear here today; belt and braces

    const ts = o.timestamp

    // ---- assistant -----------------------------------------------------
    if (o.type === "assistant") {
      if (ts) attribute(ts, "assistant")
      mainLedger.record(o.message?.id, o.message?.model, o.message?.usage)
      const content = o.message?.content
      if (Array.isArray(content)) {
        for (const b of content) {
          if (b?.type !== "tool_use") continue
          d.toolCounts.byTool[b.name] = (d.toolCounts.byTool[b.name] || 0) + 1
          d.toolCounts.total += 1
          pendingTools.set(b.id, { name: b.name, ts, input: b.input || {} })

          if (b.name === "Skill") {
            d.skills.push({
              ts,
              skill: b.input?.skill ?? null,
              toolUseId: b.id,
            })
          }
          if (b.name === "Agent" || b.name === "Task") {
            agentToolUseBlocks += 1
            const prompt = String(b.input?.prompt ?? "")
            const rec = {
              ts,
              toolUseId: b.id,
              description: b.input?.description ?? null,
              subagent_type: b.input?.subagent_type ?? null,
              requestedModel: b.input?.model ?? null,
              runInBackground: !!b.input?.run_in_background,
              promptChars: prompt.length,
              promptHead200: prompt.slice(0, 200),
              miseRole: (prompt.match(ROLE_RE) || [])[1] || null,
              miseArtifactKind: (prompt.match(KIND_RE) || [])[1] || null,
              miseVersion: (prompt.match(MISE_VERSION_RE) || [])[1] || null,
              // filled from the tool_result
              agentId: null,
              resolvedModel: null,
              status: "no-result",
              isAsync: false,
              durationMs: null,
              tokens: null,
              toolUses: null,
              toolStats: null,
              resultChars: null,
              spawnDepth: null,
              transcript: null,
            }
            if (rec.miseVersion) sets.miseVersions.add(rec.miseVersion)
            agentByToolUse.set(b.id, rec)
            d.subagents.push(rec)
          }
        }
      }
      continue
    }

    // ---- user ----------------------------------------------------------
    if (o.type === "user") {
      const content = o.message?.content
      const toolResultBlocks = Array.isArray(content)
        ? content.filter((b) => b?.type === "tool_result")
        : []

      if (o.toolUseResult !== undefined || toolResultBlocks.length) {
        const firstTool = toolResultBlocks.length
          ? pendingTools.get(toolResultBlocks[0].tool_use_id)?.name
          : null
        const gap = ts ? attribute(ts, "tool_result") : 0
        const bucket = firstTool || "unknown"
        d.wall.toolMsByTool[bucket] =
          (d.wall.toolMsByTool[bucket] || 0) + (gap || 0)
        for (const b of toolResultBlocks) {
          const pend = pendingTools.get(b.tool_use_id)
          const tur = o.toolUseResult
          const durationMs = pend?.ts && ts ? ms(pend.ts, ts) : null

          if (o.toolDenialKind) {
            d.permissionDenials.push({
              ts,
              kind: o.toolDenialKind,
              tool: pend?.name ?? null,
              head: String(
                pend?.input?.command ?? pend?.input?.file_path ?? "",
              ).slice(0, 120),
            })
          }

          // Agent result
          const rec = agentByToolUse.get(b.tool_use_id)
          if (rec && tur && typeof tur === "object") {
            rec.agentId = tur.agentId ?? null
            rec.resolvedModel = tur.resolvedModel ?? null
            rec.status =
              tur.status ?? (o.toolDenialKind ? o.toolDenialKind : "unknown")
            rec.isAsync = !!tur.isAsync
            rec.durationMs = tur.totalDurationMs ?? durationMs
            rec.toolUses = tur.totalToolUseCount ?? null
            rec.toolStats = tur.toolStats ?? null
            rec.resultChars = Array.isArray(tur.content)
              ? tur.content.reduce((n, c) => n + (c?.text?.length || 0), 0)
              : typeof tur.content === "string"
                ? tur.content.length
                : null
            if (tur.usage) {
              rec.tokens = newTokens()
              addUsage(rec.tokens, tur.usage)
            }
          } else if (rec && o.toolDenialKind) {
            rec.status = o.toolDenialKind
          }

          // Bash gate runs
          if (pend?.name === "Bash") {
            const cmd = String(pend.input?.command ?? "")
            const run = buildCommandRun({
              cmd,
              pendTs: pend.ts,
              ts,
              resultBlock: b,
              toolUseResult: tur,
              runInBackground: pend.input?.run_in_background,
              thread: "main",
            })
            if (run) d.commandRuns.push(run)

            const miseCalls = parseMiseState(cmd)
            // Only the last invocation in a chain produced the stdout we can parse.
            const report = miseCalls.length
              ? parseMiseReport(String(tur?.stdout ?? ""))
              : null
            miseCalls.forEach((mise, i) => {
              d.mise.invoked = true
              if (mise.miseVersion) sets.miseVersions.add(mise.miseVersion)
              d.mise.stateCalls.push({
                ts: pend.ts,
                durationMs,
                chainIndex: i,
                chainLength: miseCalls.length,
                command: cmd.slice(0, 300),
                subcommand: mise.subcommand,
                miseDir: mise.miseDir,
                stage: mise.stage,
                route: mise.route,
                miseVersion: mise.miseVersion,
                report: i === miseCalls.length - 1 ? report : null,
              })
            })
          }

          pendingTools.delete(b.tool_use_id)
        }
        continue
      }

      if (o.isCompactSummary) {
        d.compactions.push({
          ts,
          kind: "summary-message",
          chars: textOf(content).length,
        })
        continue
      }

      const human = classifyUser(o)
      if (!human) continue
      const gapBeforeMs = ts ? attribute(ts, "user") : null
      if (human.slash) {
        const argsMatch = human.raw.match(
          /<command-args>([\s\S]*?)<\/command-args>/,
        )
        d.slashCommands.push({
          ts,
          name: human.slash,
          argsChars: argsMatch ? argsMatch[1].length : 0,
          argsHead200: argsMatch ? argsMatch[1].slice(0, 200) : "",
        })
        if (human.slash.startsWith("/mise")) d.mise.invoked = true
      }
      d.userMessages.push({
        ts,
        chars: human.stripped.length,
        head300: human.stripped.slice(0, 300),
        slash: human.slash,
        confidence: human.confidence,
        gapBeforeMs: gapBeforeMs ?? null,
      })
      continue
    }

    // ---- system --------------------------------------------------------
    if (o.type === "system") {
      if (o.subtype === "api_error") {
        if (ts) attribute(ts, "api_error")
        d.apiErrors.push({
          ts,
          code: o.error?.connection?.code ?? o.error?.type ?? null,
          message: String(o.error?.formatted ?? o.error?.message ?? "").slice(
            0,
            200,
          ),
          retryAttempt: o.retryAttempt ?? null,
          maxRetries: o.maxRetries ?? null,
          retryInMs: o.retryInMs ?? null,
          source: o.source ?? null,
        })
      } else if (o.subtype === "compact_boundary") {
        d.compactions.push({
          ts,
          kind: "boundary",
          trigger: o.compactMetadata?.trigger ?? null,
          preTokens: o.compactMetadata?.preTokens ?? null,
          durationMs: o.compactMetadata?.durationMs ?? null,
        })
      } else if (o.subtype === "local_command") {
        // /usage, /model, /compact echoes — recorded as slash commands only when
        // the user entry carried <command-name>; nothing to do here.
      }
      continue
    }
  }

  const mainRolled = mainLedger.rollup()
  d.tokens.main.total = mainRolled.total
  d.tokens.main.byModel = mainRolled.byModel

  // Snapshot before the transcript pass backfills agentIds from filenames.
  const agentResultsWithAgentId = [...agentByToolUse.values()].filter(
    (r) => r.agentId,
  ).length

  // ---- subagent transcripts ---------------------------------------------
  let subagentFiles = []
  if (fs.existsSync(subagentDir)) {
    subagentFiles = fs
      .readdirSync(subagentDir)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => path.join(subagentDir, f))
  }
  const byAgentId = new Map()
  for (const rec of d.subagents)
    if (rec.agentId) byAgentId.set(rec.agentId, rec)

  const orphanFiles = []
  for (const file of subagentFiles) {
    const agentId = path.basename(file, ".jsonl").replace(/^agent-/, "")
    const sub = await digestSubagentFile(file)
    const metaPath = file.replace(/\.jsonl$/, ".meta.json")
    let meta = null
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, "utf8"))
      } catch {
        d.warnings.push(`unparseable meta: ${metaPath}`)
      }
    }
    let rec = byAgentId.get(agentId)
    if (!rec && meta?.toolUseId) rec = agentByToolUse.get(meta.toolUseId)
    if (!rec) {
      rec = {
        ts: sub.start,
        toolUseId: meta?.toolUseId ?? null,
        description: meta?.description ?? null,
        subagent_type: meta?.agentType ?? null,
        requestedModel: meta?.model ?? null,
        runInBackground: null,
        promptChars: sub.promptChars,
        promptHead200: "",
        miseRole: null,
        miseArtifactKind: null,
        miseVersion: null,
        agentId,
        resolvedModel: null,
        status: "transcript-only",
        isAsync: null,
        durationMs: sub.wallMs,
        tokens: null,
        toolUses: null,
        toolStats: null,
        resultChars: null,
        spawnDepth: meta?.spawnDepth ?? null,
        transcript: null,
      }
      orphanFiles.push(path.basename(file))
      d.subagents.push(rec)
    }
    rec.agentId = rec.agentId || agentId
    rec.spawnDepth = rec.spawnDepth ?? meta?.spawnDepth ?? null
    if (!rec.subagent_type && meta?.agentType)
      rec.subagent_type = meta.agentType
    if (!rec.description && meta?.description)
      rec.description = meta.description
    rec.transcript = {
      file: path.relative(path.dirname(abs), file),
      lines: sub.lines,
      start: sub.start,
      end: sub.end,
      wallMs: sub.wallMs,
      tokens: sub.tokens,
      byModel: sub.byModel,
      toolCounts: sub.toolCounts,
      agentToolUses: sub.agentToolUses,
      parseErrors: sub.parseErrors,
    }
    if (rec.durationMs == null) rec.durationMs = sub.wallMs
    if (!rec.tokens) rec.tokens = { ...sub.tokens }
    for (const run of sub.commandRuns) d.commandRuns.push(run)
  }
  d.commandRuns.sort((a, b) => String(a.ts).localeCompare(String(b.ts)))

  // Subagent token roll-up: prefer the transcript (per-model, covers async runs);
  // fall back to the Agent tool_result usage when no transcript file exists.
  for (const rec of d.subagents) {
    if (rec.transcript) {
      addTokens(d.tokens.subagents.total, rec.transcript.tokens)
      for (const [m, t] of Object.entries(rec.transcript.byModel)) {
        if (!d.tokens.subagents.byModel[m])
          d.tokens.subagents.byModel[m] = newTokens()
        addTokens(d.tokens.subagents.byModel[m], t)
      }
    } else if (rec.tokens) {
      addTokens(d.tokens.subagents.total, rec.tokens)
      const m = rec.resolvedModel || rec.requestedModel || "unknown"
      if (!d.tokens.subagents.byModel[m])
        d.tokens.subagents.byModel[m] = newTokens()
      addTokens(d.tokens.subagents.byModel[m], rec.tokens)
    }
  }
  addTokens(d.tokens.combined, d.tokens.main.total)
  addTokens(d.tokens.combined, d.tokens.subagents.total)

  d.subagentSummary = {
    records: d.subagents.length,
    mainThreadSpawns: agentToolUseBlocks,
    transcriptFiles: subagentFiles.length,
    bySpawnDepth: {},
    byType: {},
    byResolvedModel: {},
    byMiseRole: {},
    totalDurationMs: 0,
  }
  for (const r of d.subagents) {
    const dep = r.spawnDepth ?? "unknown"
    d.subagentSummary.bySpawnDepth[dep] =
      (d.subagentSummary.bySpawnDepth[dep] || 0) + 1
    const ty = r.subagent_type ?? "unknown"
    d.subagentSummary.byType[ty] = (d.subagentSummary.byType[ty] || 0) + 1
    const mo = r.resolvedModel ?? r.requestedModel ?? "unknown"
    d.subagentSummary.byResolvedModel[mo] =
      (d.subagentSummary.byResolvedModel[mo] || 0) + 1
    if (r.miseRole)
      d.subagentSummary.byMiseRole[r.miseRole] =
        (d.subagentSummary.byMiseRole[r.miseRole] || 0) + 1
    if (typeof r.durationMs === "number")
      d.subagentSummary.totalDurationMs += r.durationMs
  }

  d.session.sessionIds = [...sets.sessionIds]
  d.session.cwds = [...sets.cwds]
  d.session.gitBranches = [...sets.gitBranches]
  d.session.versions = [...sets.versions].sort()
  d.session.entrypoints = [...sets.entrypoints]
  d.mise.versions = [...sets.miseVersions].sort()
  d.session.wallMs =
    d.session.start && d.session.end ? ms(d.session.start, d.session.end) : 0
  d.wall.totalMs = d.wall.modelMs + d.wall.toolMs + d.wall.humanWaitMs

  d.crosscheck = {
    agentToolUseBlocks,
    agentResultsWithAgentId,
    subagentTranscriptFiles: subagentFiles.length,
    orphanTranscriptFiles: orphanFiles.length,
    orphanTranscriptNames: orphanFiles.slice(0, 20),
    uniqueAssistantMessageIds: mainLedger.size,
    unresolvedToolUses: pendingTools.size,
    timelineWindowMs:
      d.wall.windowStart && d.wall.windowEnd
        ? ms(d.wall.windowStart, d.wall.windowEnd)
        : 0,
    wallPartitionResidualMs:
      (d.wall.windowStart && d.wall.windowEnd
        ? ms(d.wall.windowStart, d.wall.windowEnd)
        : 0) - d.wall.totalMs,
    untimelinedEdgeMs:
      d.session.wallMs -
      (d.wall.windowStart && d.wall.windowEnd
        ? ms(d.wall.windowStart, d.wall.windowEnd)
        : 0),
  }
  if (d.crosscheck.unresolvedToolUses > 0)
    d.warnings.push(
      `${d.crosscheck.unresolvedToolUses} tool_use blocks never got a tool_result`,
    )
  if (Math.abs(d.crosscheck.wallPartitionResidualMs) > 1000)
    d.warnings.push(
      `wall partition residual ${d.crosscheck.wallPartitionResidualMs}ms — timeline buckets do not sum to the attributed window`,
    )

  return d
}

// ------------------------------------------------------------------ CLI

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(new URL(import.meta.url).pathname)
if (isMain) {
  const args = process.argv.slice(2)
  const file = args.find((a) => !a.startsWith("--"))
  if (!file) {
    console.error(
      "usage: digest-transcript.mjs <session.jsonl> [--out file.json] [--pretty]",
    )
    process.exit(2)
  }
  const outIdx = args.indexOf("--out")
  const out = outIdx >= 0 ? args[outIdx + 1] : null
  const pretty = args.includes("--pretty")
  const result = await digest(file)
  const json = JSON.stringify(result, null, pretty ? 2 : 0)
  if (out) {
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, json)
  } else {
    process.stdout.write(json + "\n")
  }
}
