#!/usr/bin/env node
// For selected owner-message rows, print the tail of the assistant text that
// immediately precedes them (the question mise asked).
//   node owner-msg-context.mjs <owner-raw.indexed.jsonl> --ids 3,7,12 [--tail 500] [--out f]
//   node owner-msg-context.mjs <indexed.jsonl> --ids-file ids.txt --tail 500
// Streams each transcript once; keeps only the running last assistant text.
import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"

const args = process.argv.slice(2)
const argOf = (n, d) => {
  const i = args.indexOf(n)
  return i === -1 ? d : args[i + 1]
}
const FILE = path.resolve(args[0])
const TAIL = Number(argOf("--tail", 500))
const OUT = argOf("--out", null)
let ids = argOf("--ids", "")
const idsFile = argOf("--ids-file", null)
if (idsFile) ids = fs.readFileSync(idsFile, "utf8")
const want = new Set(
  ids
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number),
)

const rows = fs
  .readFileSync(FILE, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l))
const bySession = new Map()
for (const r of rows) {
  if (!want.has(r.idx)) continue
  if (!bySession.has(r.sessionId)) bySession.set(r.sessionId, [])
  bySession.get(r.sessionId).push(r)
}

const textOf = (content) => {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  return content
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
}

const out = []
for (const [sessionId, want2] of bySession) {
  const tpath = `/Users/eric/.claude/projects/${want2[0].projectDir}/${sessionId}.jsonl`
  if (!fs.existsSync(tpath)) {
    for (const r of want2)
      out.push(`#${String(r.idx).padStart(4, "0")} [transcript deleted]\n===`)
    continue
  }
  const targets = want2.slice().sort((a, b) => a.ts.localeCompare(b.ts))
  let ti = 0
  let pending = "" // running assistant text since last flush
  const rl = readline.createInterface({
    input: fs.createReadStream(tpath),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line || line[0] !== "{") continue
    if (ti >= targets.length) break
    let o
    try {
      o = JSON.parse(line)
    } catch {
      continue
    }
    const ts = o.timestamp
    if (!ts) continue
    if (o.type === "assistant" && !o.isSidechain) {
      const t = textOf(o.message?.content)
      if (t.trim()) pending = t
    }
    while (ti < targets.length && ts >= targets[ti].ts) {
      const r = targets[ti]
      const tail = pending.length > TAIL ? "…" + pending.slice(-TAIL) : pending
      out.push(
        `#${String(r.idx).padStart(4, "0")} ASSISTANT-BEFORE:\n${tail || "[none]"}\n>>> OWNER: ${r.text.slice(0, 300)}\n===`,
      )
      ti++
    }
  }
  while (ti < targets.length) {
    const r = targets[ti]
    const tail = pending.length > TAIL ? "…" + pending.slice(-TAIL) : pending
    out.push(
      `#${String(r.idx).padStart(4, "0")} ASSISTANT-BEFORE:\n${tail || "[none]"}\n>>> OWNER: ${r.text.slice(0, 300)}\n===`,
    )
    ti++
  }
}
out.sort((a, b) => a.slice(0, 5).localeCompare(b.slice(0, 5)))
const text = out.join("\n") + "\n"
if (OUT) fs.writeFileSync(OUT, text)
else process.stdout.write(text)
