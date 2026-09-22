#!/usr/bin/env node
// Build okven.jsonl from the rows-part*.json specs: read each cited file,
// compute lineCount and tokensEstimate (chars/4) from the real line range,
// verify every non-blank line is covered, and check id cross-references.
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const REPO = "/Users/eric/Code/okven"
const HERE = "/Users/eric/Code/mise-claude-plugin/docs/v3-research"

const rows = []
for (const f of readdirSync(join(HERE, "tools"))
  .filter((n) => /^rows-part\d+\.json$/.test(n))
  .sort()) {
  rows.push(...JSON.parse(readFileSync(join(HERE, "tools", f), "utf8")))
}

const fileLines = new Map()
const linesOf = (rel) => {
  if (!fileLines.has(rel))
    fileLines.set(rel, readFileSync(join(REPO, rel), "utf8").split("\n"))
  return fileLines.get(rel)
}

const problems = { badRange: [], unknownDep: [], dupId: [] }
const covered = new Map()
const seenIds = new Set()

for (const r of rows) {
  if (seenIds.has(r.id)) problems.dupId.push(r.id)
  seenIds.add(r.id)
  const src = linesOf(r.file)
  const [a, bRaw] = String(r.lines).split("-").map(Number)
  const b = Number.isFinite(bRaw) ? bRaw : a
  const end = Math.min(b, src.length)
  if (a < 1 || a > src.length)
    problems.badRange.push(
      `${r.id} ${r.file}:${r.lines} (file has ${src.length})`,
    )
  const text = src.slice(a - 1, end).join("\n")
  r.lineCount = end - a + 1
  r.tokensEstimate = Math.round(text.length / 4)
  r.lines = a === end ? String(a) : `${a}-${end}`
  const set = covered.get(r.file) ?? new Set()
  for (let i = a; i <= end; i++) set.add(i)
  covered.set(r.file, set)
}

const corr = JSON.parse(
  readFileSync(join(HERE, "tools", "ref-corrections.json"), "utf8"),
)
for (const r of rows) {
  const c = corr[r.id]
  if (c) Object.assign(r, c)
}
for (const r of rows) {
  for (const k of ["dependsOn", "overlapsWith"]) {
    r[k] = (r[k] ?? []).filter((id) => {
      if (seenIds.has(id)) return true
      problems.unknownDep.push(`${r.id}.${k} -> ${id}`)
      return false
    })
  }
}

const gaps = []
for (const [rel, src] of fileLines) {
  const set = covered.get(rel) ?? new Set()
  const missing = []
  src.forEach((line, i) => {
    if (line.trim() && !set.has(i + 1)) missing.push(i + 1)
  })
  if (missing.length)
    gaps.push(
      `${rel}: ${missing.length} uncovered non-blank lines -> ${missing.slice(0, 20).join(",")}`,
    )
}

const order = [
  "id",
  "name",
  "kind",
  "file",
  "lines",
  "lineCount",
  "tokensEstimate",
  "does",
  "preventsClaim",
  "runtimeCost",
  "costNote",
  "enforcedBy",
  "firesWhen",
  "dependsOn",
  "overlapsWith",
]
const out =
  rows
    .map((r) => JSON.stringify(Object.fromEntries(order.map((k) => [k, r[k]]))))
    .join("\n") + "\n"
writeFileSync(join(HERE, "inventory/okven.jsonl"), out)

console.log(
  JSON.stringify(
    { rowCount: rows.length, filesCovered: fileLines.size, problems, gaps },
    null,
    2,
  ),
)
