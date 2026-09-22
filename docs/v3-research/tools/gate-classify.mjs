#!/usr/bin/env node
// gate-classify.mjs — give every finding in gate-findings.jsonl an `outcome`
// (what visibly happened to it) and a `substance` (what kind of thing it was).
//
//   node gate-classify.mjs [--findings ../runs/gate-findings.jsonl] [--runs ../runs/gate-outcomes.jsonl]
//                          [--hand ../runs/gate-findings-hand.jsonl]
//
// outcome   code-or-artifact-changed | rejected-by-driver | repeated-in-later-round
//           | no-visible-response | unclear
// substance defect | convention | nit | false-positive | unclear
//
// Evidence for `outcome` is the transcript after the gate run: the prompt of the
// next implementer/documenter spawn (`Defects:` / `Fix scope:` blocks quote the
// finding), the files that spawn edited, the driver's own edits before the next
// spawn, and the findings of later rounds on the same target.
//
// Matching is by *distinctive tokens* — backticked identifiers, `file:line`
// citations, REQ-* ids, paths, CamelCase symbols — not by prose similarity.
// Rows the script can decide from unambiguous text are marked
// classifiedBy=script-unambiguous; the rest script-weak. A hand-classified file
// (--hand) overrides both and is marked classifiedBy=hand.

import fs from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const arg = (n, d) => {
  const i = args.indexOf(n)
  return i === -1 ? d : args[i + 1]
}
const R = path.join(import.meta.dirname, "..", "runs")
const FINDINGS = path.resolve(
  arg("--findings", path.join(R, "gate-findings.jsonl")),
)
const RUNS = path.resolve(arg("--runs", path.join(R, "gate-outcomes.jsonl")))
const HAND = path.resolve(
  arg("--hand", path.join(R, "gate-findings-hand.jsonl")),
)

const readJsonl = (p) =>
  fs.existsSync(p)
    ? fs
        .readFileSync(p, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l))
    : []

const findings = readJsonl(FINDINGS)
const runs = readJsonl(RUNS)
const runById = new Map(runs.map((r) => [r.agentId, r]))

// Main-thread edits, per session, sorted by time. A critic's findings are answered
// by the driver rewriting the artifact itself, not by a fix subagent, so the text
// the driver wrote is the evidence.
const driverEdits = new Map()
for (const e of readJsonl(path.join(R, "driver-edits.jsonl"))) {
  const k = e.projectDir + "|" + e.sessionId
  ;(driverEdits.get(k) || driverEdits.set(k, []).get(k)).push(e)
}
for (const list of driverEdits.values())
  list.sort((a, b) => String(a.ts).localeCompare(String(b.ts)))

// The next run of the same gate on the same target closes the window in which a
// driver edit can count as a response to this round's findings.
const nextRoundStart = new Map()
{
  const groups = new Map()
  for (const r of runs) {
    if (!r.role) continue
    const k = [r.projectDir, r.sessionId, r.gate, r.target].join("|")
    ;(groups.get(k) || groups.set(k, []).get(k)).push(r)
  }
  for (const g of groups.values()) {
    g.sort((a, b) => String(a.start).localeCompare(String(b.start)))
    g.forEach((r, i) =>
      nextRoundStart.set(r.agentId, g[i + 1] ? g[i + 1].start : null),
    )
  }
}

function driverTextAfter(run) {
  const list = driverEdits.get(run.projectDir + "|" + run.sessionId) || []
  const from = run.end
  const to = nextRoundStart.get(run.agentId) || null
  const cap =
    to || new Date(Date.parse(run.end || 0) + 6 * 3600e3).toISOString()
  const picked = list.filter((e) => e.ts > from && e.ts <= cap)
  return picked
    .map((e) => (e.file || "") + "\n" + (e.text || ""))
    .join("\n")
    .slice(0, 400000)
}

// ---------------------------------------------------------------- tokens

const STOP = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "from",
  "into",
  "task",
  "file",
  "test",
  "tests",
  "plan",
  "code",
  "line",
  "lines",
  "true",
  "false",
  "null",
  "const",
  "type",
  "string",
  "number",
  "index",
  "main",
  "src",
  "md",
])

function tokensOf(text) {
  const t = new Set()
  const s = String(text || "")
  for (const m of s.matchAll(/`([^`\n]{3,90})`/g)) {
    for (const piece of m[1].split(/[\s/(),{}[\]<>|]+/)) {
      const p = piece.replace(/^[.#$-]+|[.,;:]+$/g, "")
      if (p.length >= 4 && !STOP.has(p.toLowerCase())) t.add(p)
    }
  }
  for (const m of s.matchAll(/\bREQ-[A-Z0-9]+-\d+\b/g)) t.add(m[0])
  for (const m of s.matchAll(/\b(?:Task|Rule|rule)\s+(\d+[._]\d+|\d+)\b/g))
    t.add("TASK:" + m[1].replace("_", "."))
  for (const m of s.matchAll(
    /\b([A-Za-z0-9_.-]+\.(?:ts|tsx|js|mjs|vue|rs|md|json|yml|yaml|css|html))\b/g,
  ))
    t.add(m[1])
  for (const m of s.matchAll(/\b([a-z][a-zA-Z0-9]{5,}[A-Z][a-zA-Z0-9]{2,})\b/g))
    t.add(m[1])
  for (const m of s.matchAll(/\b([A-Z][a-z]+[A-Z][A-Za-z0-9]{3,})\b/g))
    t.add(m[1])
  return t
}

// token rarity across the whole finding corpus — a match on a token that appears
// everywhere (e.g. `_progress.md`) is not evidence
const df = new Map()
const findingTokens = findings.map((f) => {
  const t = tokensOf(f.findingText)
  for (const x of t) df.set(x, (df.get(x) || 0) + 1)
  return t
})
const N = Math.max(findings.length, 1)
const isRare = (tok) => (df.get(tok) || 0) / N < 0.01

function overlap(tokens, haystack) {
  if (!haystack) return { hits: [], rare: 0 }
  const hits = []
  for (const t of tokens) {
    if (haystack.includes(t)) hits.push(t)
  }
  return { hits, rare: hits.filter(isRare).length }
}

// ---------------------------------------------------------------- substance lexicon

const DEFECT = [
  /\bcannot end green\b/i,
  /\bwill not compile\b/i,
  /\bbreaks?\b/i,
  /\bbroken\b/i,
  /\bwrong behaviou?r\b/i,
  /\bincorrect\b/i,
  /\bbug\b/i,
  /\bcrash(es)?\b/i,
  /\bno (task|requirement) addresses\b/i,
  /\buntraced\b/i,
  /\bunaddressed\b/i,
  /\bcontradicts?\b/i,
  /\bcontradiction\b/i,
  /\bmisses the\b/i,
  /\bnever (fires|runs|called|reached|set)\b/i,
  /\bregress\w*/i,
  /\bdata loss\b/i,
  /\bsecurity\b/i,
  /\brace\b/i,
  /\b(missing|no) (test|coverage|e2e)\b/i,
  /\btest (fails|failed|is flaky|flake)/i,
  /\bfails? (the|in|when|under)\b/i,
  /\bdoes not (exist|match|hold|fire|run|apply|cover)\b/i,
  /\bREQ-[A-Z0-9]+-\d+\b[^.]{0,60}\b(not|never|no)\b/i,
  /\bunverified file reference\b/i,
  /\bpath that does not exist\b/i,
  /\bwrong `?file:line`?\b/i,
  /\bthrows?\b/i,
  /\bundefined\b/i,
  /\bunreachable\b/i,
  /\bstale\b/i,
  /\bdisagree\b/i,
  /\bambiguous\b|\bambiguit(y|ies)\b/i,
  /\binconsisten\w*/i,
  /\bmismatch\w*/i,
  /\buntested\b/i,
  /\bunspecified\b/i,
  /\bnot observable\b/i,
  /\bcannot\b|\bcan't\b/i,
  /\bwrong (line|precedent|file|value|order|flag|field|type)\b/i,
  /\bdeleted?\b[^.]{0,40}\bstill (imports?|uses?|references?)\b/i,
  /\bdoes not exist\b/i,
  /\bnever addressed\b/i,
  /\bno requirement\b/i,
  /\bnot covered by\b/i,
  /\bsilently\b/i,
  /\bexception\b/i,
  /\bnull\b[^.]{0,20}\bderef/i,
  /\bwould (break|fail|throw|crash)\b/i,
]
const CONVENTION = [
  /\bchecklist rule\b/i,
  /\brule \d+\b/i,
  /\bguide(s|line)?\b[^.]{0,40}\b(entry|entries|not followed|violat)/i,
  /\bconvention\b/i,
  /\bnaming\b/i,
  /\bCLAUDE\.md\b/,
  /\bSkills? (&|and) guides\b/i,
  /\bover cap\b/i,
  /\b5 source files\b/i,
  /\bfile cap\b/i,
  /\bguardrail\b/i,
  /\bREQ-\*? ?IDs? in code\b/i,
  /\bproject rule\b/i,
  /\bhouse style\b/i,
  /\blint\b/i,
  /\bTask Index row\b/i,
  /\bnot traced in the Task Index\b/i,
  /\bprose rule\b/i,
  /\bno `?Checklist:`? line\b/i,
  /\bcommit (message|subject)\b/i,
]
const NIT = [
  /\bnit\b/i,
  /\bcosmetic\b/i,
  /\btypo\b/i,
  /\bwording\b/i,
  /\bphrasing\b/i,
  /\breword/i,
  /\bstyle\b/i,
  /\breadability\b/i,
  /\bclarity\b/i,
  /\bprefer\b/i,
  /\bconsider\b/i,
  /\bwould read better\b/i,
  /\bpurely editorial\b/i,
  /\bharmless\b/i,
  /\bno action needed\b/i,
  /\bworth (saying|noting|a line)\b/i,
  /\bfor the record\b/i,
  /\bnot a defect\b/i,
]
const FALSE_POS_SELF = [
  /\bi was wrong\b/i,
  /\bfalse positive\b/i,
  /\bmy earlier (claim|finding) was\b/i,
]

function lexScore(text, list) {
  let n = 0
  for (const re of list) if (re.test(text)) n += 1
  return n
}

// Gate reports interleave findings with the verification they did; the splitter
// cannot always tell them apart, so a row that opens as verification prose and
// names nothing wrong is an extraction artifact, not a finding.
const ARTIFACT_LEAD =
  /^\s*(?:[-*+]|\d+[.)])?\s*(?:\*\*)?(?:i\s+)?(?:ran|re-?ran|read|reviewed|verified|checked|confirmed|compared|independently|spot-check\w*|reproduc\w*|none\b|no defects|reported back|verification|path check|working tree|the gate results|cross-check\w*)/i
const ARTIFACT_CLEAN =
  /\b(?:all|every|both|each)\b[^.\n]{0,70}\b(?:pass(?:es|ed)?|conform(?:s|ed)?|check(?:s)? out|green|clean|resolve[sd]?|hold[s]?|match(?:es|ed)?|accurate|correct)\b|\bno (?:defects|findings|blocking findings|issues)\b|\bnothing (?:is )?(?:wrong|pending|hidden)\b|\bcompliant\b/i
const HARD_FAULT =
  /\bfail(?:s|ed|ure)?\b|\bdefect\b|\bwrong\b|\bmissing\b|\bnot verified\b|\bbreach\b|\bcontradict\w*|\bstale\b|\bincorrect\b|\bbug\b|\bnever\b|\bunspecified\b|\bambiguous\b|\bno requirement\b|\bnot a\b/i

function substanceOf(f) {
  const t = f.findingText || ""
  const head = t.slice(0, 900)
  if (FALSE_POS_SELF.some((re) => re.test(head)))
    return ["false-positive", "unambiguous"]
  const lead = t.slice(0, 220)
  if (
    (ARTIFACT_LEAD.test(lead) || ARTIFACT_CLEAN.test(lead)) &&
    !HARD_FAULT.test(lead)
  ) {
    return ["unclear", "unambiguous"] // verification prose the splitter picked up
  }
  const d = lexScore(head, DEFECT),
    c = lexScore(head, CONVENTION),
    n = lexScore(head, NIT)
  // an explicit severity of `informative` with nit language and no defect language
  if (n > 0 && d === 0 && c === 0)
    return ["nit", n >= 2 ? "unambiguous" : "weak"]
  if (c > d && c > n)
    return ["convention", c >= 2 && d === 0 ? "unambiguous" : "weak"]
  if (d > 0 && d >= c && d >= n)
    return ["defect", d >= 2 && c === 0 && n === 0 ? "unambiguous" : "weak"]
  if (c > 0) return ["convention", "weak"]
  if (n > 0) return ["nit", "weak"]
  // lexicon silent → fall back on the severity the gate itself stated
  if (f.severity === "informative" || f.severity === "note")
    return ["nit", "weak"]
  if (
    f.severity === "blocking" ||
    f.severity === "not-verified" ||
    f.severity === "gate-failure"
  )
    return ["defect", "weak"]
  return ["unclear", "weak"]
}

// ---------------------------------------------------------------- outcome

const REJECT =
  /\b(not a defect|declin(e|ed)|reject(ed)?|won'?t fix|by design|out of scope|no change needed|leaving as is|leave as is|disagree|the critic is wrong|false positive|overrul)/i

// later-round findings on the same (branch, gate, target)
const laterIndex = new Map()
findings.forEach((f, i) => {
  const key = [f.projectDir, f.branch || "-", f.gate, f.target].join("|")
  ;(laterIndex.get(key) || laterIndex.set(key, []).get(key)).push(i)
})

function outcomeOf(f, i) {
  const run = runById.get(f.agentId)
  const toks = findingTokens[i]
  if (!run) return ["unclear", "weak", "no run row"]
  if (toks.size === 0) return ["unclear", "weak", "no distinctive tokens"]

  const nexts = run.nextSpawns || []
  const fixSpawns = nexts.filter((n) =>
    ["implementer", "documenter"].includes(n.role),
  )
  const fixText = fixSpawns.map((n) => n.promptHead || "").join("\n")
  const fixFiles = fixSpawns.flatMap((n) => n.filesEdited || []).join("\n")
  const driverText = driverTextAfter(run)

  const inFix = overlap(toks, fixText)
  const inFixFiles = overlap(toks, fixFiles)
  const inDriver = overlap(toks, driverText)

  // rejection stated in the dispatch that followed
  if (inFix.rare >= 1 && REJECT.test(fixText)) {
    const around = fixText.slice(
      Math.max(0, fixText.indexOf(inFix.hits[0]) - 300),
      fixText.indexOf(inFix.hits[0]) + 300,
    )
    if (REJECT.test(around))
      return [
        "rejected-by-driver",
        "weak",
        "rejection language near the finding in the next dispatch",
      ]
  }

  if (inFix.rare >= 1 || inFix.hits.length >= 3) {
    return [
      "code-or-artifact-changed",
      inFix.rare >= 2 ? "unambiguous" : "weak",
      `next fix dispatch quotes ${inFix.hits.slice(0, 4).join(", ")}`,
    ]
  }
  if (inDriver.rare >= 2) {
    return [
      "code-or-artifact-changed",
      "unambiguous",
      `the driver's revision before the next round writes ${inDriver.hits.filter(isRare).slice(0, 4).join(", ")}`,
    ]
  }
  if (inFixFiles.rare >= 1 || inDriver.rare >= 1) {
    return [
      "code-or-artifact-changed",
      "weak",
      `the file or symbol it names was written next (${[...inFixFiles.hits, ...inDriver.hits].slice(0, 3).join(", ")})`,
    ]
  }

  // repeated in a later round on the same target
  const key = [f.projectDir, f.branch || "-", f.gate, f.target].join("|")
  for (const j of laterIndex.get(key) || []) {
    const g = findings[j]
    if (g.roundInBranch <= f.roundInBranch) continue
    const o = overlap(toks, g.findingText)
    if (o.rare >= 2 || (o.rare >= 1 && o.hits.length >= 3)) {
      return [
        "repeated-in-later-round",
        o.rare >= 2 ? "unambiguous" : "weak",
        `round ${g.roundInBranch} repeats ${o.hits.slice(0, 3).join(", ")}`,
      ]
    }
  }

  // the artifact/task moved on with nothing quoting this finding
  if (nexts.length === 0)
    return ["unclear", "weak", "no spawn followed in this session"]
  return [
    "no-visible-response",
    fixSpawns.length ? "weak" : "weak",
    "no following dispatch, edit or later round quotes it",
  ]
}

// ---------------------------------------------------------------- run

const hand = new Map(readJsonl(HAND).map((h) => [h.findingId, h]))
const out = findings.map((f, i) => {
  const [substance, sConf] = substanceOf(f)
  const [outcome, oConf, evidence] = outcomeOf(f, i)
  const h = hand.get(f.findingId)
  return {
    ...f,
    outcome: h?.outcome ?? outcome,
    outcomeEvidence: h?.outcome ? h.note || "hand-classified" : evidence,
    outcomeSource: h?.outcome
      ? "hand"
      : oConf === "unambiguous"
        ? "script-unambiguous"
        : "script-weak",
    substance: h?.substance ?? substance,
    substanceSource: h?.substance
      ? "hand"
      : sConf === "unambiguous"
        ? "script-unambiguous"
        : "script-weak",
    substanceNote: h?.substance ? h.note || null : null,
    scriptSubstance: substance,
    classifiedBy: h?.substance
      ? "hand"
      : sConf === "unambiguous" && oConf === "unambiguous"
        ? "script-unambiguous"
        : "script-weak",
  }
})

// script-vs-hand agreement on the hand-classified sample, per gate
const agree = {}
for (const r of out) {
  if (r.substanceSource !== "hand") continue
  const a = (agree[r.gate] ||= { n: 0, agree: 0, confusion: {} })
  a.n += 1
  if (r.scriptSubstance === r.substance) a.agree += 1
  else
    a.confusion[`${r.scriptSubstance}->${r.substance}`] =
      (a.confusion[`${r.scriptSubstance}->${r.substance}`] || 0) + 1
}

fs.writeFileSync(FINDINGS, out.map((r) => JSON.stringify(r)).join("\n") + "\n")

const tally = (key) => {
  const m = {}
  for (const r of out)
    ((m[r.gate] ||= {}), (m[r.gate][r[key]] = (m[r.gate][r[key]] || 0) + 1))
  return m
}
console.error(
  JSON.stringify(
    {
      findings: out.length,
      hand: hand.size,
      classifiedBy: out.reduce(
        (a, r) => ((a[r.classifiedBy] = (a[r.classifiedBy] || 0) + 1), a),
        {},
      ),
      outcome: tally("outcome"),
      scriptVsHand: agree,
      substance: tally("substance"),
    },
    null,
    2,
  ),
)
