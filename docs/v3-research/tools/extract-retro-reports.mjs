#!/usr/bin/env node
// extract-retro-reports.mjs — the retrospective role's own output, from the transcripts.
//
// The retrospective never writes a file: roles/retrospective.md:60 forbids editing and sends its
// report to the orchestrator. So its proposals survive only in the subagent transcript. This reads
// every digest under runs/digests, finds subagents with miseRole === 'retrospective' (also any role
// passed with --role), and emits the agent's final assistant text plus its dispatch context.
//
// Read-only; streams each transcript line by line.
//
// Usage: node extract-retro-reports.mjs [--digests ../runs/digests] [--role retrospective]

import {
  createReadStream,
  readFileSync,
  readdirSync,
  existsSync,
  statSync,
} from "node:fs"
import { createInterface } from "node:readline"
import path from "node:path"

const argv = process.argv.slice(2)
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`)
  return i === -1 ? d : argv[i + 1]
}
const digestRoot = path.resolve(
  opt("digests", path.join(import.meta.dirname, "..", "runs", "digests")),
)
const role = opt("role", "retrospective")
const projectsRoot = path.resolve(
  opt("projects-root", `${process.env.HOME}/.claude/projects`),
)

function textOf(msg) {
  const c = msg?.content
  if (typeof c === "string") return c
  if (!Array.isArray(c)) return ""
  return c
    .filter((b) => b?.type === "text")
    .map((b) => b.text)
    .join("\n")
}

async function lastAssistantText(file) {
  if (!existsSync(file))
    return { text: "", lines: 0, missing: true, source: "none" }
  const rl = createInterface({
    input: createReadStream(file),
    crlfDelay: Infinity,
  })
  let last = ""
  let handback = ""
  let lines = 0
  let start = null
  let end = null
  for await (const line of rl) {
    if (!line.trim()) continue
    lines++
    let row
    try {
      row = JSON.parse(line)
    } catch {
      continue
    }
    if (row.timestamp) {
      start ??= row.timestamp
      end = row.timestamp
    }
    if (row.type === "assistant") {
      const t = textOf(row.message)
      if (t.trim()) last = t
      // a newer agent hands its report back through the SubagentHandback tool; the last
      // assistant text is then only a one-line acknowledgement
      for (const b of row.message?.content ?? []) {
        if (
          b?.type === "tool_use" &&
          /handback/i.test(b.name ?? "") &&
          b.input?.message
        ) {
          handback = b.input.message
        }
      }
    }
  }
  const text = handback || last
  return {
    text,
    lines,
    start,
    end,
    missing: false,
    source: handback ? "handback" : "final-assistant",
  }
}

// Fallback: the subagent transcript file is gone (deleted worktree) but the main thread still
// holds the agent's result as a tool_result.
async function resultFromMain(mainFile, toolUseId) {
  if (!mainFile || !existsSync(mainFile) || !toolUseId) return ""
  const rl = createInterface({
    input: createReadStream(mainFile),
    crlfDelay: Infinity,
  })
  let found = ""
  for await (const line of rl) {
    if (!line.includes(toolUseId)) continue
    let row
    try {
      row = JSON.parse(line)
    } catch {
      continue
    }
    for (const b of row.message?.content ?? []) {
      if (b?.type === "tool_result" && b.tool_use_id === toolUseId) {
        const c = b.content
        found =
          typeof c === "string"
            ? c
            : (c ?? [])
                .filter((x) => x?.type === "text")
                .map((x) => x.text)
                .join("\n")
      }
    }
  }
  return found
}

const out = []
for (const dir of readdirSync(digestRoot)) {
  const p = path.join(digestRoot, dir)
  if (!statSync(p).isDirectory()) continue
  for (const f of readdirSync(p)) {
    if (!f.endsWith(".json")) continue
    const d = JSON.parse(readFileSync(path.join(p, f), "utf8"))
    for (const s of d.subagents ?? []) {
      if (s.miseRole !== role) continue
      out.push({
        projectDir: dir,
        mainPath: d.source?.path ?? null,
        toolUseId: s.toolUseId ?? null,
        sessionId: d.source?.sessionId ?? f.replace(/\.json$/, ""),
        cwds: d.session?.cwds ?? [],
        branches: d.session?.gitBranches ?? [],
        ts: s.ts,
        agentId: s.agentId,
        resolvedModel: s.resolvedModel,
        durationMs: s.durationMs,
        resultChars: s.resultChars,
        promptHead200: s.promptHead200,
        miseVersion: s.miseVersion ?? (d.mise?.versions ?? [])[0] ?? null,
        transcript: s.transcript?.file ?? null,
      })
    }
  }
}

for (const r of out) {
  const file = r.transcript
    ? path.join(projectsRoot, r.projectDir, r.transcript)
    : null
  const got = file
    ? await lastAssistantText(file)
    : { text: "", missing: true, source: "none" }
  let text = got.text
  let src = got.source
  if (!text.trim() || text.length < 400) {
    const alt = await resultFromMain(r.mainPath, r.toolUseId)
    if (alt.length > text.length) {
      text = alt
      src = "main-thread-tool-result"
    }
  }
  r.report = text
  r.reportChars = text.length
  r.reportSource = src
  r.transcriptMissing = got.missing
  console.log(JSON.stringify(r))
}
