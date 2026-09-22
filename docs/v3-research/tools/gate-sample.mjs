#!/usr/bin/env node
// gate-sample.mjs — stratified sample of findings for blind hand classification.
//
//   node gate-sample.mjs [--per 45] [--chars 380] [--seed 20260920] [--gate critic-plan]
//
// Strata: gate × round bucket (1 | 2+) × stated severity, proportional, deterministic.
// Prints the finding id and the verbatim text only — never the script's own guess,
// so the hand pass is blind to it.

import fs from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const arg = (n, d) => {
  const i = args.indexOf(n)
  return i === -1 ? d : args[i + 1]
}
const PER = Number(arg("--per", 45))
const CHARS = Number(arg("--chars", 380))
const ONLY = arg("--gate", null)
let seed = Number(arg("--seed", 20260920))
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff

const rows = fs
  .readFileSync(
    path.join(import.meta.dirname, "..", "runs", "gate-findings.jsonl"),
    "utf8",
  )
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l))

const gates = [...new Set(rows.map((r) => r.gate))].filter(
  (g) => !ONLY || g === ONLY,
)
for (const gate of gates) {
  const sub = rows.filter((r) => r.gate === gate)
  const strata = new Map()
  for (const r of sub) {
    const k = `${(r.roundInBranch || 1) >= 2 ? "r2+" : "r1"}|${r.severity}`
    ;(strata.get(k) || strata.set(k, []).get(k)).push(r)
  }
  const keys = [...strata.keys()].sort()
  const picked = []
  // proportional allocation, at least one from each stratum
  const total = sub.length
  for (const k of keys) {
    const pool = strata
      .get(k)
      .slice()
      .sort((a, b) => a.findingId.localeCompare(b.findingId))
    let want = Math.max(1, Math.round((pool.length / total) * PER))
    want = Math.min(want, pool.length)
    const idx = new Set()
    while (idx.size < want) idx.add(Math.floor(rnd() * pool.length))
    for (const i of idx) picked.push(pool[i])
  }
  console.log(
    `\n########## ${gate}  (sample ${picked.length} of ${sub.length})`,
  )
  for (const r of picked) {
    const t = (r.findingText || "").replace(/\s+/g, " ").slice(0, CHARS)
    console.log(
      `\n[${r.findingId}] round=${r.roundInBranch} sev=${r.severity} branch=${r.branch}`,
    )
    console.log(t)
  }
}
