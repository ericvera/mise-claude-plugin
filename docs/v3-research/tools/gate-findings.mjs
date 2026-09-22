#!/usr/bin/env node
// gate-findings.mjs — split every gate run's final message into a verdict and one
// row per individual finding, verbatim.
//
//   node gate-findings.mjs [--in ../runs/gate-outcomes.jsonl] [--out ../runs/gate-findings.jsonl]
//
// Also writes the verdict and finding count back onto the gate-outcomes rows.
//
// Report shapes seen in the corpus (mise 1.6.0 – 2.1.0):
//   critic     markdown sections `## Blocking` / `## Minor` / `## Informative`,
//              numbered or bulleted items; "no blocking findings" on a pass.
//   reviewer   `## Defects` / `Defects:` list, items tagged `prose` | `not-prose`;
//              exactly `none` on a pass.
//   acceptance flat `- REQ-X: verified — …` / `not verified — …` lines plus `## Notes`.
//   documenter "Docs pass committed. Commit: <hash>." | "nothing to document" |
//              "failed (stuck|blocked)" — reports work, not findings.
//   gate-run   pass/fail per step (Format, Check, unit tests, e2e/sanity).

import fs from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const arg = (n, d) => {
  const i = args.indexOf(n)
  return i === -1 ? d : args[i + 1]
}
const IN = path.resolve(
  arg(
    "--in",
    path.join(import.meta.dirname, "..", "runs", "gate-outcomes.jsonl"),
  ),
)
const OUT = path.resolve(
  arg(
    "--out",
    path.join(import.meta.dirname, "..", "runs", "gate-findings.jsonl"),
  ),
)

// ---------------------------------------------------------------- sectioning

const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/
// a bold-only line used as a pseudo heading, e.g. `**Defects:**`
const BOLD_HEADING = /^\s{0,3}\*\*([^*]{1,80}?):?\*\*:?\s*$/
const LEAD_IN =
  /^\s{0,3}(?:\*\*)?(blocking|blockers?|minor|informative|defects?|findings?|issues?|notes?|not verified|failures?)(?:\*\*)?\s*[:：]\s*$/i

const SEV_FROM_SECTION = [
  // "No blocking findings" heads verification prose, not a finding list; items under
  // it are kept only when they carry an explicit inline severity of their own.
  [/\bno\s+(blocking|blockers)\b/i, "SKIP"],
  [/\bblock(ing|ers?)\b/i, "blocking"],
  [/\bminor\b/i, "minor"],
  [/\binformative\b/i, "informative"],
  [/\bnot[- ]verified\b/i, "not-verified"],
  [/\b(defects?|findings?|issues?|problems?|failures?)\b/i, "defect"],
  [/\bnotes?\b|\bobservations?\b|\bnon-blocking\b/i, "note"],
  [
    /\b(verified|passed|pass|confirmed|checked|coverage|summary|verification|what i (read|checked|ran))\b/i,
    "SKIP",
  ],
]

function sectionSeverity(title) {
  for (const [re, sev] of SEV_FROM_SECTION) if (re.test(title)) return sev
  return null
}

// ---------------------------------------------------------------- item split

// Split a section body into top-level list items. Continuation lines (deeper
// indent, code fences, blank-separated prose under the same item) stay with it.
function splitItems(body) {
  const lines = body.split("\n")
  // A section that numbers its findings uses bullets for their sub-points: only the
  // numbers start new items there.
  const numbered = lines.some((l) => /^\s{0,3}\d+[.)]\s+\S/.test(l))
  const TOP = numbered
    ? /^\s{0,3}\d+[.)]\s+\S/
    : /^\s{0,3}(?:\d+[.)]|[-*+])\s+\S/
  const items = []
  let cur = null
  let inFence = false
  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence
    const isTop = !inFence && TOP.test(line)
    const isBoldPara =
      !inFence &&
      !numbered &&
      /^\s{0,3}\*\*[^*].{0,200}?\*\*/.test(line) &&
      !/^\s{0,3}(?:\d+[.)]|[-*+])\s/.test(line)
    if (isTop || (isBoldPara && (!cur || cur.kind === "bold"))) {
      if (cur) items.push(cur)
      cur = { kind: isTop ? "list" : "bold", lines: [line] }
    } else if (cur) {
      cur.lines.push(line)
    } else if (line.trim()) {
      cur = { kind: "para", lines: [line] }
    }
  }
  if (cur) items.push(cur)
  return items
    .map((i) => i.lines.join("\n").trim())
    .filter((t) => t && t.replace(/^[-*+\d.)\s]+/, "").length >= 12)
}

// ---------------------------------------------------------------- inline severity

function inlineSeverity(text) {
  const t = text.slice(0, 400)
  if (
    /\*\*blocking\*\*|\(blocking\)|\[blocking\]|^\s*blocking\b|\bblocking\b\s*[—:-]/i.test(
      t,
    )
  )
    return "blocking"
  if (/\*\*minor\*\*|\(minor\)|\[minor\]|\bminor\b\s*[—:-]/i.test(t))
    return "minor"
  if (/\*\*informative\*\*|\(informative\)|\[informative\]/i.test(t))
    return "informative"
  if (/\bnot[- ]verified\b/i.test(t)) return "not-verified"
  return null
}

function proseTag(text) {
  const t = text.slice(0, 600)
  if (/\bnot-prose\b|`not-prose`|\(not-prose\)/i.test(t)) return "not-prose"
  if (
    /\bprose\b/i.test(t) &&
    /`prose`|\(prose\)|\*\*prose\*\*|—\s*prose\b|:\s*prose\b/i.test(t)
  )
    return "prose"
  return null
}

// ---------------------------------------------------------------- verdicts

function verdictOf(gate, fm, findings) {
  const t = (fm || "").trim()
  if (!t) return "no-final-message"
  const head = t.slice(0, 1500)
  if (gate === "documenter") {
    if (/docs pass committed/i.test(head)) return "committed"
    if (/nothing to document/i.test(head)) return "nothing-to-document"
    if (/docs pass failed \(stuck\)|failed \(stuck\)/i.test(head))
      return "stuck"
    if (/docs pass failed \(blocked\)|failed \(blocked\)/i.test(head))
      return "blocked"
    if (/\bcommit(ted)?\b.*\b[0-9a-f]{7,}\b/i.test(head)) return "committed"
    return "other"
  }
  if (gate === "reviewer") {
    if (/^none\.?$/im.test(t) && findings.length === 0) return "clean"
    return findings.length ? "defects" : "clean-prose"
  }
  if (gate === "critic-requirements" || gate === "critic-plan") {
    const blockers = findings.filter(
      (f) => f.severityStated === "blocking",
    ).length
    if (blockers) return "blocking"
    if (/no blocking findings|no blockers|zero blocking/i.test(t)) return "pass"
    return findings.length ? "non-blocking-only" : "pass-implied"
  }
  if (gate === "acceptance") {
    const nv = findings.filter(
      (f) => f.severityStated === "not-verified",
    ).length
    return nv ? "not-verified-items" : "all-verified"
  }
  if (gate === "gate-run") return gateRunVerdict(t)
  if (gate === "retrospective") {
    if (/no proposals/i.test(head)) return "no-proposals"
    return findings.length ? "proposals" : "other"
  }
  return findings.length ? "findings" : "none"
}

// ---------------------------------------------------------------- per-gate extraction

function extractAcceptance(fm) {
  const out = []
  const lines = (fm || "").split("\n")
  let section = null
  let buf = null
  const flush = () => {
    if (buf) {
      out.push(buf)
      buf = null
    }
  }
  for (const line of lines) {
    const h = line.match(HEADING) || line.match(BOLD_HEADING)
    if (h) {
      flush()
      section = (h[2] ?? h[1]).trim()
      continue
    }
    const m = line.match(
      /^\s{0,3}[-*+]\s+(?:\*\*)?([^:\n]{1,120}?)(?:\*\*)?\s*[:—-]\s*(?:\*\*)?(not verified|verified|not-verified|partially verified|unverifiable|fail(?:ed)?|pass(?:ed)?)\b(?:\*\*)?(.*)$/i,
    )
    if (m) {
      flush()
      const state = m[2]
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace("failed", "fail")
        .replace("passed", "pass")
      buf = {
        severityStated:
          /^not/.test(state) || state === "fail" || state === "unverifiable"
            ? "not-verified"
            : state === "partially-verified"
              ? "not-verified"
              : "verified",
        item: m[1].trim(),
        text: line.trim(),
        section: section || "(verdict list)",
      }
      continue
    }
    if (buf && line.trim() && !/^\s{0,3}[-*+]\s/.test(line)) {
      buf.text += "\n" + line.trim()
      continue
    }
    if (buf) flush()
    if (
      section &&
      /notes?|observ/i.test(section) &&
      /^\s{0,3}[-*+]\s+\S/.test(line)
    ) {
      out.push({
        severityStated: "note",
        item: null,
        text: line.trim(),
        section,
      })
    }
  }
  flush()
  return out
}

// A heading whose title starts `1.` / `M3 —` / `**Blocking 2**` is itself a finding,
// not a section — critics write both shapes, sometimes in the same report.
const ITEM_HEADING =
  /^\s*(?:\d+[.)]|[A-Z]\d+\b|(?:\*\*)?(?:blocking|minor|informative|defect)\s*\d+)/i

function extractSectioned(fm, gate) {
  const text = fm || ""
  const lines = text.split("\n")

  // pass 1 — section spans
  const blocks = []
  let cur = { title: null, sev: null, lines: [] }
  let inFence = false
  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence
    if (!inFence) {
      const h =
        line.match(HEADING) || line.match(BOLD_HEADING) || line.match(LEAD_IN)
      if (h) {
        const title = (h[2] ?? h[1]).trim()
        if (ITEM_HEADING.test(title) || title.length > 90) {
          // a numbered finding written as a heading: keep it inside the section,
          // as the first line of its own item
          cur.lines.push("- " + title)
          continue
        }
        blocks.push(cur)
        cur = { title, sev: sectionSeverity(title), lines: [] }
        continue
      }
    }
    cur.lines.push(line)
  }
  blocks.push(cur)

  const hasFindingSection = blocks.some(
    (x) => x.sev && x.sev !== "SKIP" && x.sev !== "note",
  )
  // a body item only counts as a finding when it names something wrong
  const DEFECT_SIGNAL =
    /\b(defect|bug|wrong|incorrect|missing|misses|fails?|failed|does not|doesn't|never|breach|violat\w*|contradict\w*|stale|unaddressed|untraced|absent|should (be|have)|not covered|no test|leftover|regress\w*|mismatch|inconsistent|unspecified|cannot|can't)\b/i
  const out = []
  for (const b of blocks) {
    const body = b.lines.join("\n")
    let sev = b.sev
    const skipSection = sev === "SKIP"
    let basis = skipSection
      ? "inline-tag-in-skipped-section"
      : "labelled-section"
    // untitled preamble: only mine it when the report has no finding section at all
    if (b.title === null) {
      if (hasFindingSection) continue
      if (!DEFECT_SIGNAL.test(body)) continue
      sev = null
      basis = "body-heuristic"
    }
    for (const item of splitItems(body)) {
      const inline = inlineSeverity(item)
      if (skipSection && !inline) continue
      let severity = inline || sev
      if (!severity) {
        if (
          basis === "body-heuristic" &&
          !DEFECT_SIGNAL.test(item.slice(0, 500))
        )
          continue
        severity = gate.startsWith("critic") ? "unlabelled" : "defect"
      }
      out.push({
        severityStated: severity,
        item: null,
        text: item,
        section: b.title || "(body)",
        prose: proseTag(item),
        basis: inline
          ? basis === "labelled-section"
            ? "labelled-section"
            : "inline-tag"
          : basis,
      })
    }
  }
  return out
}

// Gate reports are free prose. Scoring a fail by counting the word "fail" reads a
// clean run's "0 failed / no failures / the flake did not occur" as a failure, so
// only an explicit verdict statement counts; everything else is `other`.
const EXPLICIT_BLOCKED =
  /(?:^|\n)[^\n]{0,70}\b(?:result|verdict|status)\s*:?\s*\**\s*`?BLOCKED\b|\bblocked at (?:stage|step|P\d)\b|\bdid not complete\b|\bnot run\b[^\n]{0,30}\bsee below\b|\bcannot proceed\b/im
const EXPLICIT_FAIL =
  /(?:^|\n)[^\n]{0,70}\b(?:gate (?:result\s*)?(?:is\s*)?FAILED|baseline gate FAILED|verdict\s*:?\s*\**\s*`?fail|result\s*:?\s*\**\s*`?FAILED|SMOKE_EXIT=1|overall\s*:?\s*\**\s*`?FAIL)/im
const EXPLICIT_PASS = new RegExp(
  [
    /overall\s*:?\s*\**\s*`?pass/,
    /gate\s*(?:passed|is green|complete[^.\n]{0,40}passed)/,
    /\bGATE\s*:\s*\**\s*PASS\b/,
    /verdict\s*:?\s*\**\s*`?pass/,
    /(?:sanity-?e2e|smoke|baseline gate)\s*:?\s*\**\s*`?PASS\b/,
    /\ball\s+(?:\w+\s+){0,3}(?:scenarios|steps|checks|suites|shards|stages|gates|gate steps|tests|test files)\s+(?:pass(?:ed)?|green|are green)/,
    /\b0 fail(?:ures|ed)\b/,
    /\bno failures\b/,
    /\bzero failures\b/,
    /\ball green\b/,
    /\beverything (?:passed|green)\b/,
    /\bpassed with no blockers\b/,
    /\bpassed on the first run\b/,
    /\bno flakes?, no reruns\b/,
  ]
    .map((r) => r.source)
    .join("|"),
  "i",
)
const ABORTED =
  /\byou've hit your (?:session|usage) limit\b|\[Request interrupted/i

function gateRunVerdict(t) {
  const head = t.slice(0, 2500)
  if (ABORTED.test(head)) return "aborted"
  if (EXPLICIT_FAIL.test(head)) return "fail"
  if (EXPLICIT_BLOCKED.test(head)) return "blocked"
  if (EXPLICIT_PASS.test(head)) return "pass"
  if (EXPLICIT_FAIL.test(t)) return "fail"
  if (EXPLICIT_BLOCKED.test(t)) return "blocked"
  if (EXPLICIT_PASS.test(t)) return "pass"
  return "other"
}

// "0 failed", "no failures", "nothing failed" are passes, not findings.
const NEGATED_FAIL =
  /\b(no|zero|0|none|nothing|without)\s+(\w+\s+){0,2}(fail(ures?|ed|s)?|errors?|regress\w*)\b|\bfail(ures?|ed|s)?\s*[:=]?\s*0\b|\bnot? (applied|failures)\b/i
const FAIL_SIGNAL =
  /\b(fail(ed|s|ure|ures)?|errors?|✗|❌|broke|broken|timed out|timeout|regress\w*|red\b|blocked)\b/i

// Gate reports are free prose (they were never given a verdict format), so a
// per-item split is not reliable. The gate's unit of output is one verdict per
// run: emit exactly one finding per failed run, carrying the failure text verbatim.
// Why a gate run did not pass: only the first is the gate doing its job.
const CAUSE = [
  [
    /\bflak(e|y)\b|\bintermittent\b|\bpassed (?:in|on) (?:isolation|rerun|the rerun|a rerun)\b|\bre-?ran? (?:from scratch )?(?:and|then) (?:it )?(?:passed|completed clean)\b/i,
    "flake",
  ],
  [
    /\bnode_modules\b|\bnot bootstrapped\b|\byarn install\b|\bemulator\b|\btmux\b|\bport\b|\benvironment (?:gap|guard)\b|\bSIGTERM\b|\bexit 143\b|\bstale .*session\b/i,
    "environment",
  ],
  [
    /\bblocked\b|\bdid not complete\b|\bnothing executed\b|\bcannot proceed\b|\bnot run\b/i,
    "blocked-runner",
  ],
]
function causeOf(text) {
  for (const [re, name] of CAUSE) if (re.test(text.slice(0, 2500))) return name
  return "code-or-test-failure"
}

function extractGateRun(fm, verdictHint) {
  if (verdictHint !== "fail" && verdictHint !== "blocked") return []
  const text = fm || ""
  const para = text
    .split(/\n\s*\n/)
    .find(
      (p) =>
        FAIL_SIGNAL.test(p) && FAIL_SIGNAL.test(p.replace(NEGATED_FAIL, " ")),
    )
  return [
    {
      severityStated: "gate-failure",
      item: causeOf(text),
      text: (para || text).trim().slice(0, 4000),
      section: "(gate verdict: " + verdictHint + ")",
      basis: "run-verdict",
    },
  ]
}

function extractDocumenter(fm) {
  const text = fm || ""
  if (/failed \((stuck|blocked)\)/i.test(text)) {
    return [
      {
        severityStated: "documenter-failure",
        item: null,
        text: text.split(/\n\s*\n/)[0].trim(),
        section: "(summary)",
      },
    ]
  }
  return []
}

// ---------------------------------------------------------------- run

const runs = fs
  .readFileSync(IN, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l))
const findings = []
const rewritten = []

for (const r of runs) {
  let f = []
  if (r.gate === "acceptance") f = extractAcceptance(r.finalMessage)
  else if (r.gate === "gate-run")
    f = extractGateRun(
      r.finalMessage,
      verdictOf("gate-run", r.finalMessage, []),
    )
  else if (r.gate === "documenter") f = extractDocumenter(r.finalMessage)
  else if (
    r.gate === "critic-requirements" ||
    r.gate === "critic-plan" ||
    r.gate === "reviewer" ||
    r.gate === "retrospective"
  ) {
    f = extractSectioned(r.finalMessage, r.gate)
  }
  const verdict = r.role ? verdictOf(r.gate, r.finalMessage, f) : null
  const counted =
    r.gate === "acceptance"
      ? f.filter((x) => x.severityStated !== "verified")
      : f

  if (
    r.role &&
    [
      "critic-requirements",
      "critic-plan",
      "reviewer",
      "acceptance",
      "documenter",
      "gate-run",
    ].includes(r.gate)
  ) {
    counted.forEach((x, i) => {
      findings.push({
        findingId: `${r.agentId}#${i + 1}`,
        projectDir: r.projectDir,
        session: r.sessionId,
        transcript: r.transcript,
        agentId: r.agentId,
        branch: r.branch,
        gate: r.gate,
        role: r.role,
        target: r.target,
        round: r.round,
        roundInBranch: r.roundInBranch,
        miseVersion: r.miseVersion,
        verdict,
        severity: x.severityStated,
        section: x.section,
        proseTag: x.prose || null,
        extractionBasis: x.basis || null,
        item: x.item,
        findingText: x.text,
        runTokens: r.tokensTotal,
        runDurationMs: r.durationMs,
      })
    })
  }
  rewritten.push({
    ...r,
    verdict,
    findingCount: counted.length,
    verifiedCount: f.filter((x) => x.severityStated === "verified").length,
  })
}

fs.writeFileSync(OUT, findings.map((f) => JSON.stringify(f)).join("\n") + "\n")
fs.writeFileSync(IN, rewritten.map((r) => JSON.stringify(r)).join("\n") + "\n")

const by = {}
for (const f of findings) {
  const g = (by[f.gate] ||= { findings: 0, sev: {} })
  g.findings += 1
  g.sev[f.severity] = (g.sev[f.severity] || 0) + 1
}
const verdicts = {}
for (const r of rewritten)
  if (r.role)
    ((verdicts[r.gate] ||= {}),
      (verdicts[r.gate][r.verdict] = (verdicts[r.gate][r.verdict] || 0) + 1))
console.error(
  JSON.stringify(
    { runs: runs.length, findings: findings.length, by, verdicts },
    null,
    2,
  ),
)
