#!/usr/bin/env node
// Scan subagent transcripts for evidence that project CLAUDE.md text is
// injected into a subagent's context. Streams JSONL; prints counts only.
import { createReadStream } from "node:fs"
import { readdir, stat } from "node:fs/promises"
import { createInterface } from "node:readline"
import { join } from "node:path"

const MARKERS = {
  rootHeader: "Okven Development Guide",
  functionsHeader: "Package-specific guidance for `functions/`",
  hostingHeader: "Package-specific guidance for `hosting/`",
  inlineSnap: "Always use inline snapshots",
  docStyleLine: "doc-style skill is the operative rule set",
  projectInstr: "project instructions, checked into the codebase",
  sysReminder: "<system-reminder>",
}
const counts = {}
const files = { scanned: 0, withAnyMarker: [] }

const textOf = (e) => {
  const c = e?.message?.content
  if (typeof c === "string") return c
  if (Array.isArray(c))
    return c
      .map((b) => (typeof b === "string" ? b : (b?.text ?? "")))
      .join("\n")
  return ""
}

const walk = async (dir, out) => {
  for (const name of await readdir(dir)) {
    const p = join(dir, name)
    const s = await stat(p)
    if (s.isDirectory()) await walk(p, out)
    else if (name.endsWith(".jsonl") && p.includes("/subagents/")) out.push(p)
  }
}

const scan = async (path) => {
  files.scanned++
  const hits = new Set()
  const rl = createInterface({
    input: createReadStream(path),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line.trim()) continue
    let e
    try {
      e = JSON.parse(line)
    } catch {
      continue
    }
    const t = textOf(e)
    if (!t) continue
    for (const [k, m] of Object.entries(MARKERS)) {
      if (t.includes(m)) {
        counts[k] = (counts[k] ?? 0) + 1
        hits.add(k)
      }
    }
  }
  if (hits.size)
    files.withAnyMarker.push([
      path.split("/").slice(-1)[0],
      [...hits].join(","),
    ])
}

const list = []
for (const d of process.argv.slice(2)) await walk(d, list)
for (const f of list) await scan(f)
console.log(
  JSON.stringify(
    {
      subagentFiles: files.scanned,
      markerHits: counts,
      perFile: files.withAnyMarker.slice(0, 25),
    },
    null,
    2,
  ),
)
