#!/usr/bin/env node
import { readFileSync } from "node:fs"
const rows = readFileSync(
  "/Users/eric/Code/mise-claude-plugin/docs/v3-research/inventory/okven.jsonl",
  "utf8",
)
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l))

const sum = (rs) => rs.reduce((a, r) => a + r.tokensEstimate, 0)
const group = (fn) => {
  const m = {}
  for (const r of rows) {
    const k = fn(r)
    m[k] ??= { rows: 0, lines: 0, tokens: 0 }
    m[k].rows++
    m[k].lines += r.lineCount
    m[k].tokens += r.tokensEstimate
  }
  return Object.fromEntries(
    Object.entries(m).sort((a, b) => b[1].tokens - a[1].tokens),
  )
}

const load = (r) =>
  r.firesWhen === "always-loaded"
    ? "always-loaded"
    : r.firesWhen === "hook:nested_memory"
      ? "nested-memory (on file touch)"
      : r.firesWhen.startsWith("role:")
        ? "per-mise-role dispatch"
        : r.firesWhen.startsWith("hook:")
          ? "hook process"
          : r.firesWhen === "stage:goals"
            ? "per-mise-role dispatch"
            : r.firesWhen === "script"
              ? "never loaded at runtime"
              : "skill body on demand"

console.log("## byLoad")
console.log(JSON.stringify(group(load), null, 1))
console.log("## byKind")
console.log(
  JSON.stringify(
    group((r) => r.kind),
    null,
    1,
  ),
)
console.log("## byFile")
console.log(
  JSON.stringify(
    group((r) => r.file),
    null,
    1,
  ),
)
console.log("## byRuntimeCost")
const rc = {}
for (const r of rows)
  for (const c of r.runtimeCost) {
    rc[c] ??= { rows: 0, tokens: 0 }
    rc[c].rows++
    rc[c].tokens += r.tokensEstimate
  }
console.log(JSON.stringify(rc, null, 1))

// overlap clusters: undirected components over overlapsWith
const idx = new Map(rows.map((r) => [r.id, r]))
const adj = new Map(rows.map((r) => [r.id, new Set()]))
for (const r of rows)
  for (const o of r.overlapsWith) {
    if (adj.has(o)) {
      adj.get(r.id).add(o)
      adj.get(o).add(r.id)
    }
  }
const seen = new Set()
const clusters = []
for (const r of rows) {
  if (seen.has(r.id) || adj.get(r.id).size === 0) continue
  const stack = [r.id],
    comp = []
  while (stack.length) {
    const x = stack.pop()
    if (seen.has(x)) continue
    seen.add(x)
    comp.push(x)
    for (const y of adj.get(x)) if (!seen.has(y)) stack.push(y)
  }
  if (comp.length > 1) clusters.push(comp.sort())
}
clusters.sort((a, b) => b.length - a.length)
console.log("## overlapClusters", clusters.length)
for (const c of clusters)
  console.log(
    c.length,
    c
      .map(
        (id) =>
          `${id}[${idx.get(id).file.replace(".claude/skills/", "sk:").replace("docs/design/", "dd:")}:${idx.get(id).lines}] ${idx.get(id).name}`,
      )
      .join(" | "),
  )
console.log(
  "## totals",
  JSON.stringify({
    rows: rows.length,
    lines: rows.reduce((a, r) => a + r.lineCount, 0),
    tokens: sum(rows),
  }),
)
