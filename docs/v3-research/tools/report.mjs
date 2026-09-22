#!/usr/bin/env node
// Prints the aggregate tables for mise-flow.md from the built inventory.
import { readFileSync } from "node:fs"
const rows = readFileSync(
  "/Users/eric/Code/mise-claude-plugin/docs/v3-research/inventory/mise-flow.jsonl",
  "utf8",
)
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l))
const byId = new Map(rows.map((r) => [r.id, r]))
const loc = (r) => `${r.file}:${r.lines}`

const out = []
const kinds = {}
for (const r of rows) {
  kinds[r.kind] ??= { n: 0, lc: 0 }
  kinds[r.kind].n++
  kinds[r.kind].lc += r.lineCount
}
out.push("## by kind")
for (const [k, v] of Object.entries(kinds).sort((a, b) => b[1].lc - a[1].lc))
  out.push(`${k}\t${v.n}\t${v.lc}`)

const files = {}
for (const r of rows) {
  files[r.file] ??= { n: 0, lc: 0 }
  files[r.file].n++
  files[r.file].lc += r.lineCount
}
out.push("## by file")
for (const [k, v] of Object.entries(files).sort((a, b) => b[1].lc - a[1].lc))
  out.push(`${k}\t${v.n}\t${v.lc}`)

out.push("## heaviest")
for (const r of [...rows]
  .sort((a, b) => b.lineCount - a.lineCount || a.id.localeCompare(b.id))
  .slice(0, 10))
  out.push(`${r.id}\t${r.lineCount}\t${r.kind}\t${loc(r)}\t${r.name}`)

out.push("## kind=human-stop")
for (const r of rows.filter((r) => r.kind === "human-stop"))
  out.push(`${r.id}\t${loc(r)}\t${r.name}\t${r.costNote}`)

out.push("## human-wait but not human-stop")
for (const r of rows.filter(
  (r) =>
    r.kind !== "human-stop" && (r.runtimeCost ?? []).includes("human-wait"),
))
  out.push(`${r.id}\t${r.kind}\t${loc(r)}\t${r.name}`)

out.push("## kind=loop")
for (const r of rows.filter((r) => r.kind === "loop"))
  out.push(`${r.id}\t${loc(r)}\t${r.name}\t${r.costNote}`)

out.push("## subagent-spawn rows")
for (const r of rows.filter((r) =>
  (r.runtimeCost ?? []).includes("subagent-spawn"),
))
  out.push(`${r.id}\t${r.kind}\t${loc(r)}\t${r.name}\t${r.costNote}`)

// connected components over overlapsWith (symmetrised)
const adj = new Map(rows.map((r) => [r.id, new Set()]))
for (const r of rows)
  for (const o of r.overlapsWith ?? []) {
    adj.get(r.id).add(o)
    adj.get(o)?.add(r.id)
  }
const seen = new Set()
const comps = []
for (const r of rows) {
  if (seen.has(r.id) || adj.get(r.id).size === 0) continue
  const stack = [r.id]
  const comp = []
  seen.add(r.id)
  while (stack.length) {
    const id = stack.pop()
    comp.push(id)
    for (const n of adj.get(id)) if (!seen.has(n)) (seen.add(n), stack.push(n))
  }
  comps.push(comp.sort())
}
out.push("## overlap components")
for (const c of comps.sort((a, b) => b.length - a.length))
  out.push(
    `${c.length}\t${c.map((id) => `${id}@${loc(byId.get(id))}`).join(" | ")}`,
  )

console.log(out.join("\n"))
