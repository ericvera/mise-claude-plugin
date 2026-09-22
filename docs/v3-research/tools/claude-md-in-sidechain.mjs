#!/usr/bin/env node
// Does CLAUDE.md text reach subagent (sidechain) contexts?
// Scans Claude Code JSONL transcripts line-by-line (never loading a whole file)
// and counts, separately for main-session and sidechain entries, how many
// carry a <system-reminder> containing a CLAUDE.md marker string.
// Usage: node claude-md-in-sidechain.mjs <dir> [<dir>...]
import { createReadStream } from "node:fs"
import { readdir } from "node:fs/promises"
import { createInterface } from "node:readline"
import { join } from "node:path"

const MARKERS = [
  "Okven Development Guide", // root CLAUDE.md line 1
  "Package-specific guidance for `functions/`", // functions/CLAUDE.md line 3
  "Package-specific guidance for `hosting/`", // hosting/CLAUDE.md line 3
  "Always use inline snapshots", // root CLAUDE.md Testing rule 4
  "doc-style skill is the operative rule set", // root CLAUDE.md Code Style
]

const stats = {}
const bump = (chain, key) => {
  stats[chain] ??= { entries: 0 }
  stats[chain][key] = (stats[chain][key] ?? 0) + 1
}

const textOf = (entry) => {
  const c = entry?.message?.content
  if (typeof c === "string") return c
  if (Array.isArray(c))
    return c
      .map((b) => (typeof b === "string" ? b : (b?.text ?? "")))
      .join("\n")
  return ""
}

const scanFile = async (path) => {
  const rl = createInterface({
    input: createReadStream(path),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line.trim()) continue
    let entry
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }
    if (entry.type !== "user" && entry.type !== "assistant") continue
    const chain = entry.isSidechain ? "sidechain" : "main"
    bump(chain, "entries")
    const text = textOf(entry)
    if (!text) continue
    for (const m of MARKERS) if (text.includes(m)) bump(chain, `marker:${m}`)
    if (text.includes("<system-reminder>")) bump(chain, "system-reminder")
  }
}

const dirs = process.argv.slice(2)
for (const dir of dirs) {
  for (const name of await readdir(dir)) {
    if (!name.endsWith(".jsonl")) continue
    await scanFile(join(dir, name))
  }
}
console.log(JSON.stringify(stats, null, 2))
