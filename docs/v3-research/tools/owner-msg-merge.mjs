#!/usr/bin/env node
// Join the extracted owner rows with the hand-written classification labels and
// emit the deliverable JSONL.
//   node owner-msg-merge.mjs <indexed.jsonl> <labels.txt> <out.jsonl>
// Label line format: idx|class|confidence|key=value|key=value...
//   keys: corr, cmpl, q, inrepo (t|f|n), n, n2, ctx, dup
// Rows that repeat the same transcript uuid inside one session (a duplication
// artefact of that transcript file) are collapsed to their first occurrence.
import fs from "node:fs"

const [FILE, LABELS, OUT] = process.argv.slice(2)
const rows = fs
  .readFileSync(FILE, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l))

const labels = new Map()
for (const line of fs.readFileSync(LABELS, "utf8").split("\n")) {
  if (!line.trim()) continue
  const parts = line.split("|")
  const idx = Number(parts[0])
  const rec = { class: parts[1], conf: parts[2], fields: {} }
  for (const kv of parts.slice(3)) {
    if (!kv) continue
    const i = kv.indexOf("=")
    if (i === -1) continue
    rec.fields[kv.slice(0, i)] = kv.slice(i + 1)
  }
  labels.set(idx, rec)
}

const INREPO = { t: true, f: false, n: null }
const seen = new Set()
const out = []
let dropped = 0
let missing = 0
for (const r of rows) {
  const key = `${r.sessionId}#${r.uuid || `D${r.ts}${r.text.slice(0, 40)}`}`
  if (seen.has(key)) {
    dropped++
    continue
  }
  seen.add(key)
  const lab = labels.get(r.idx)
  if (!lab) {
    missing++
    continue
  }
  const f = lab.fields
  const notes = [f.n, f.n2].filter(Boolean).join("; ")
  const truncated = Boolean(r.truncated)
  const noteParts = []
  if (notes) noteParts.push(notes)
  if (truncated)
    noteParts.push(
      `text truncated at ${r.text.length} of ${r.chars} chars: the transcript file for this session no longer exists, only the digest head300 survives`,
    )
  out.push({
    repo: r.repo,
    projectDir: r.projectDir,
    sessionId: r.sessionId,
    ts: r.ts,
    chars: r.chars,
    text: r.text,
    truncated,
    slash: r.slash,
    gapBeforeMs: r.gapBeforeMs ?? null,
    class: lab.class,
    classConfidence: lab.conf,
    miseStage: r.miseStage,
    miseRoleNearby: r.miseRoleNearby,
    correctionOf: lab.class === "correction" ? f.corr || null : null,
    complaintAbout: lab.class === "process-complaint" ? f.cmpl || null : null,
    answersQuestion: lab.class === "answer" ? f.q || null : null,
    answerWasInRepo: lab.class === "answer" ? (INREPO[f.inrepo] ?? null) : null,
    notes: noteParts.join("; "),
    // provenance kept out of the schema's required fields but useful downstream
    branch: r.branch,
    lastMiseRole: r.lastMiseRole,
  })
}
fs.writeFileSync(OUT, out.map((o) => JSON.stringify(o)).join("\n") + "\n")
console.error(
  JSON.stringify({
    written: out.length,
    duplicatesDropped: dropped,
    missingLabel: missing,
  }),
)
