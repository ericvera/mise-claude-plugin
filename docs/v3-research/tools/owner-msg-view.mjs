#!/usr/bin/env node
// Render owner-raw.jsonl as a compact human-readable classification view.
//   node owner-msg-view.mjs <owner-raw.jsonl> [--cap 2000] [--blind] [--every 5]
// --blind prints only id + text (for the blind re-check pass).
import fs from "node:fs"

const args = process.argv.slice(2)
const file = args[0]
const capI = args.indexOf("--cap")
const CAP = capI === -1 ? 2000 : Number(args[capI + 1])
const BLIND = args.includes("--blind")
const evI = args.indexOf("--every")
const EVERY = evI === -1 ? 0 : Number(args[evI + 1])

const rows = fs
  .readFileSync(file, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l))
  .sort(
    (a, b) =>
      a.repo.localeCompare(b.repo) ||
      a.sessionId.localeCompare(b.sessionId) ||
      a.ts.localeCompare(b.ts),
  )

const mins = (ms) =>
  ms == null
    ? "?"
    : ms < 60000
      ? `${Math.round(ms / 1000)}s`
      : `${(ms / 60000).toFixed(1)}m`
const out = []
rows.forEach((r, i) => {
  r.idx = i
  if (EVERY && i % EVERY !== 0) return
  const text =
    r.text.length > CAP
      ? r.text.slice(0, CAP) + `\n…[+${r.text.length - CAP} chars]`
      : r.text
  if (BLIND) {
    out.push(`#${String(i).padStart(4, "0")}`)
    out.push(text)
    out.push("---")
    return
  }
  const role = r.miseRoleNearby
    ? `${r.miseRoleNearby}(${(r.lastSubDesc || "").slice(0, 40)})`
    : r.lastMiseRole
      ? `-/prev:${r.lastMiseRole}(${(r.lastMiseRoleDesc || "").slice(0, 40)})`
      : "-"
  out.push(
    `#${String(i).padStart(4, "0")} ${r.repo}/${r.branch || "-"} ${r.sessionId.slice(0, 8)} ${r.ts} st=${r.miseStage || "-"} role=${role} gap=${mins(r.gapBeforeMs)} slash=${r.slash || "-"} chars=${r.chars}${r.truncated ? " TRUNC" : ""}`,
  )
  out.push(text)
  out.push("---")
})
fs.writeFileSync(
  args[1] && !args[1].startsWith("--") ? args[1] : "/dev/stdout",
  out.join("\n") + "\n",
)
// stable index written back so the merge step can use idx
fs.writeFileSync(
  file.replace(/\.jsonl$/, ".indexed.jsonl"),
  rows.map((r) => JSON.stringify(r)).join("\n") + "\n",
)
