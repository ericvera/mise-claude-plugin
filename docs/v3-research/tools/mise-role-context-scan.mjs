#!/usr/bin/env node
// For mise-role subagents (identified by "roles/<role>.md" in their prompt),
// record which instruction sources reached their context, and the Claude Code
// version that produced the run. Streams JSONL; prints counts only.
import { createReadStream } from "node:fs"
import { readdir, stat } from "node:fs/promises"
import { createInterface } from "node:readline"
import { join } from "node:path"

const ROLE_RE =
  /roles\/(implementer|documenter|reviewer|critic|acceptance|retrospective)\.md/
const MARK = [
  [
    "attach:rootCLAUDEmd",
    (l) => l.includes('"attachment":{"type":"instructions"'),
  ],
  [
    "attach:functionsCLAUDEmd",
    (l) => l.includes('"nested_memory"') && l.includes("functions/CLAUDE.md"),
  ],
  [
    "attach:hostingCLAUDEmd",
    (l) => l.includes('"nested_memory"') && l.includes("hosting/CLAUDE.md"),
  ],
  [
    "attach:packagesCLAUDEmd",
    (l) => l.includes('"nested_memory"') && l.includes("packages/CLAUDE.md"),
  ],
  ["read:mise-config", (l) => l.includes("# Mise Configuration")],
  ["read:mise-checklist", (l) => l.includes("No leftover debug code")],
  ["read:doc-style-SKILL", (l) => l.includes("Doc Style (comments & docs)")],
  ["read:ui-conventions-SKILL", (l) => l.includes("UI Conventions (hosting/)")],
  ["text:inlineSnapshotRule", (l) => l.includes("Always use inline snapshots")],
  [
    "text:jsdocDocStylePointer",
    (l) => l.includes("doc-style skill is the operative rule set"),
  ],
  [
    "text:checklistRule6",
    (l) => l.includes("Test assertions cover whole values"),
  ],
  ["text:checklistRule15", (l) => l.includes("Every comment explains why")],
]
const out = {}
const byVersion = {}
const bump = (o, k) => (o[k] = (o[k] ?? 0) + 1)

const walk = async (dir, acc) => {
  for (const n of await readdir(dir)) {
    const p = join(dir, n)
    const s = await stat(p)
    if (s.isDirectory()) await walk(p, acc)
    else if (n.endsWith(".jsonl") && p.includes("/subagents/")) acc.push(p)
  }
}

const scan = async (path) => {
  const rl = createInterface({
    input: createReadStream(path),
    crlfDelay: Infinity,
  })
  let role = null,
    version = null
  const found = new Set()
  for await (const line of rl) {
    if (!role) {
      const m = line.match(ROLE_RE)
      if (m) role = m[1]
    }
    if (!version) {
      const m = line.match(/"version":"([^"]+)"/)
      if (m) version = m[1]
    }
    for (const [k, fn] of MARK) if (!found.has(k) && fn(line)) found.add(k)
  }
  if (!role) return
  const vnum = (version ?? "0.0.0").split(".").map(Number)
  const modern = vnum[1] > 1 || (vnum[1] === 1 && vnum[2] >= 263)
  if (process.env.MODERN_ONLY === "1" && !modern) return
  out[role] ??= { runs: 0 }
  bump(out[role], "runs")
  for (const f of found) bump(out[role], f)
  const v = version ?? "unknown"
  byVersion[v] ??= { runs: 0, withRootCLAUDEmd: 0 }
  byVersion[v].runs++
  if (found.has("attach:rootCLAUDEmd")) byVersion[v].withRootCLAUDEmd++
}

const files = []
for (const d of process.argv.slice(2)) await walk(d, files)
for (const f of files) await scan(f)
console.log(JSON.stringify({ roles: out, byVersion }, null, 2))
