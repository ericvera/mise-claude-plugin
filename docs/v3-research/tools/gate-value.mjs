#!/usr/bin/env node
// gate-value.mjs — build ../runs/gate-value.md: what each mise gate cost and
// what it caught, from gate-outcomes.jsonl + gate-findings.jsonl.
//
//   node gate-value.mjs [--out ../runs/gate-value.md]
//
// Tables only. Every rate carries its n.

import fs from "node:fs"
import path from "node:path"

const R = path.join(import.meta.dirname, "..", "runs")
const args = process.argv.slice(2)
const arg = (n, d) => {
  const i = args.indexOf(n)
  return i === -1 ? d : args[i + 1]
}
const OUT = path.resolve(arg("--out", path.join(R, "gate-value.md")))

const readJsonl = (p) =>
  fs
    .readFileSync(p, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l))
const runs = readJsonl(path.join(R, "gate-outcomes.jsonl"))
const findings = readJsonl(path.join(R, "gate-findings.jsonl"))
const okven = readJsonl(path.join(R, "okven-runs.jsonl"))
const notes = readJsonl(path.join(R, "delta-notes.jsonl"))

const GATES = [
  "critic-requirements",
  "critic-plan",
  "reviewer",
  "acceptance",
  "gate-run",
  "documenter",
  "retrospective",
]
const LABEL = {
  "critic-requirements": "critic-requirements",
  "critic-plan": "critic-plan",
  reviewer: "reviewer",
  acceptance: "acceptance",
  "gate-run": "end-of-plan gate",
  documenter: "documenter",
  retrospective: "retrospective",
}

// ------------------------------------------------------------------ helpers
const sum = (a, f) => a.reduce((x, y) => x + (f(y) || 0), 0)
const pct = (n, d) =>
  d ? `${((n / d) * 100).toFixed(0)}% (${n}/${d})` : `— (0)`
const num = (n) => (n == null ? "—" : n.toLocaleString("en-US"))
const hrs = (ms) => (ms / 3600000).toFixed(1)
const tbl = (head, rows) =>
  [
    `| ${head.join(" | ")} |`,
    `|${head.map(() => "---").join("|")}|`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n")

const byAgent = new Map()
for (const f of findings)
  (byAgent.get(f.agentId) || byAgent.set(f.agentId, []).get(f.agentId)).push(f)

const CHANGED = "code-or-artifact-changed"
const SUBSTANTIVE = new Set(["defect", "convention"])

// run-size join: okven-runs by branch (largest run on a branch wins)
const locByBranch = new Map()
for (const r of okven) {
  const b = r.branch,
    c = r.loc && r.loc.codeTotal
  if (!b || c == null) continue
  locByBranch.set(b, Math.max(locByBranch.get(b) ?? 0, c))
}
const sizeOf = (branch) => {
  const c = locByBranch.get(branch)
  if (c == null) return null
  return c <= 60
    ? "small (≤60 LOC)"
    : c <= 2000
      ? "medium (61–2000)"
      : "large (>2000)"
}

// ------------------------------------------------------------------ core stats
function stats(rs) {
  const fs_ = rs.flatMap((r) => byAgent.get(r.agentId) || [])
  const changed = fs_.filter((f) => f.outcome === CHANGED)
  const subChanged = changed.filter((f) => SUBSTANTIVE.has(f.substance))
  const tokens = sum(rs, (r) => r.tokensTotal)
  return {
    runs: rs.length,
    tokens,
    hours: sum(rs, (r) => r.durationMs),
    findings: fs_.length,
    defect: fs_.filter((f) => f.substance === "defect").length,
    convention: fs_.filter((f) => f.substance === "convention").length,
    nit: fs_.filter((f) => f.substance === "nit").length,
    unclear: fs_.filter((f) => f.substance === "unclear").length,
    falsePos: fs_.filter((f) => f.substance === "false-positive").length,
    changed: changed.length,
    repeated: fs_.filter((f) => f.outcome === "repeated-in-later-round").length,
    noResp: fs_.filter((f) => f.outcome === "no-visible-response").length,
    rejected: fs_.filter((f) => f.outcome === "rejected-by-driver").length,
    subChanged: subChanged.length,
    tokPerSubChange: subChanged.length
      ? Math.round(tokens / subChanged.length)
      : null,
  }
}
const row = (label, s) => [
  label,
  s.runs,
  num(s.tokens),
  hrs(s.hours),
  s.findings,
  s.defect,
  s.convention,
  s.nit,
  s.unclear,
  pct(s.changed, s.findings),
  s.subChanged,
  s.tokPerSubChange == null ? "—" : num(s.tokPerSubChange),
]
const HEAD = [
  "gate",
  "runs",
  "tokens",
  "agent-hours",
  "findings",
  "defect",
  "convention",
  "nit",
  "unclear",
  "outcome=changed",
  "defect/convention changed",
  "tokens per such change",
]

const out = []
out.push("# What each mise gate earned")
out.push("")
out.push(
  `Source: \`gate-outcomes.jsonl\` (${runs.length} subagent runs, ${runs.filter((r) => r.role).length} resolved to a mise role), \`gate-findings.jsonl\` (${findings.length} findings). Corpus frozen 2026-09-20 12:35Z. Tokens = input+cacheRead+cacheCreate+output, max-per-\`message.id\` then summed. Agent-hours = summed transcript spans; parallel and async agents overlap, so this over-counts elapsed time.`,
)
out.push("")

// -------- table 1: per gate
out.push("## 1. Per gate")
out.push("")
out.push(
  tbl(
    HEAD,
    GATES.map((g) => row(LABEL[g], stats(runs.filter((r) => r.gate === g)))),
  ),
)
out.push("")
out.push(
  "`documenter` and `retrospective` emit no findings by design — the documenter reports work done, the retrospective reports proposals — so their finding columns are 0 and the cost columns are the whole measurement.",
)
out.push("")
out.push(
  "### Token composition (the `tokens` column above is dominated by cache reads)",
)
out.push("")
{
  const rows = GATES.map((g) => {
    const rs = runs.filter((r) => r.gate === g)
    const agg = { input: 0, cacheRead: 0, cacheCreate: 0, output: 0 }
    for (const r of rs)
      for (const m of Object.values(r.tokensByModel || {})) {
        agg.input += m.input
        agg.cacheRead += m.cacheRead
        agg.cacheCreate += m.cacheCreate
        agg.output += m.output
      }
    const models = {}
    for (const r of rs)
      for (const m of r.models || []) models[m] = (models[m] || 0) + 1
    return [
      LABEL[g],
      rs.length,
      num(agg.input),
      num(agg.cacheRead),
      num(agg.cacheCreate),
      num(agg.output),
      rs.length
        ? Math.round(agg.output / rs.length).toLocaleString("en-US")
        : "—",
      Object.entries(models)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k} ${v}`)
        .join(", "),
    ]
  })
  out.push(
    tbl(
      [
        "gate",
        "runs",
        "input",
        "cache read",
        "cache create",
        "output",
        "output per run",
        "models (runs)",
      ],
      rows,
    ),
  )
}
out.push("")

// -------- verdict mix
out.push("### Outcome mix per gate (what visibly happened to each finding)")
out.push("")
{
  const rows = GATES.filter((g) => findings.some((f) => f.gate === g)).map(
    (g) => {
      const f = findings.filter((x) => x.gate === g)
      const c = (o) => pct(f.filter((x) => x.outcome === o).length, f.length)
      return [
        LABEL[g],
        f.length,
        c(CHANGED),
        c("repeated-in-later-round"),
        c("rejected-by-driver"),
        c("no-visible-response"),
        c("unclear"),
      ]
    },
  )
  out.push(
    tbl(
      [
        "gate",
        "findings",
        "code or artifact changed",
        "repeated in a later round",
        "rejected by the driver",
        "no visible response",
        "unclear",
      ],
      rows,
    ),
  )
}
out.push("")
out.push("### Verdict mix per gate")
out.push("")
{
  const rows = []
  for (const g of GATES) {
    const rs = runs.filter((r) => r.gate === g)
    const v = {}
    for (const r of rs) v[r.verdict] = (v[r.verdict] || 0) + 1
    rows.push([
      LABEL[g],
      rs.length,
      Object.entries(v)
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => `${k} ${n}`)
        .join(", "),
    ])
  }
  out.push(tbl(["gate", "runs", "verdicts as reported"], rows))
}
out.push("")

// -------- table 2: by round
out.push(
  "## 2. By round (rounds are per branch+target: repeated spawns of the same gate on the same artifact or task)",
)
out.push("")
{
  const rows = []
  for (const g of GATES) {
    for (const [lbl, pred] of [
      ["1", (r) => r.roundInBranch === 1],
      ["2", (r) => r.roundInBranch === 2],
      ["3–5", (r) => r.roundInBranch >= 3 && r.roundInBranch <= 5],
      ["6+", (r) => r.roundInBranch >= 6],
    ]) {
      const rs = runs.filter((r) => r.gate === g && pred(r))
      if (!rs.length) continue
      rows.push(row(`${LABEL[g]} · r${lbl}`, stats(rs)))
    }
  }
  out.push(tbl(HEAD, rows))
}
out.push("")
out.push("### Do rounds 2+ find anything of substance?")
out.push("")
{
  const rows = []
  for (const g of GATES) {
    const r1 = runs.filter((r) => r.gate === g && r.roundInBranch === 1)
    const r2 = runs.filter((r) => r.gate === g && r.roundInBranch >= 2)
    const f1 = r1.flatMap((r) => byAgent.get(r.agentId) || [])
    const f2 = r2.flatMap((r) => byAgent.get(r.agentId) || [])
    if (!f1.length && !f2.length) continue
    const sub = (f) => f.filter((x) => SUBSTANTIVE.has(x.substance))
    const subChanged = (f) =>
      f.filter((x) => SUBSTANTIVE.has(x.substance) && x.outcome === CHANGED)
    rows.push([
      LABEL[g],
      `${f1.length} / ${pct(sub(f1).length, f1.length)} / ${pct(subChanged(f1).length, f1.length)}`,
      `${f2.length} / ${pct(sub(f2).length, f2.length)} / ${pct(subChanged(f2).length, f2.length)}`,
      pct(
        f2.filter((x) => x.outcome === "repeated-in-later-round").length,
        f2.length,
      ),
      num(sum(r2, (r) => r.tokensTotal)),
    ])
  }
  out.push(
    tbl(
      [
        "gate",
        "round 1: findings / defect+convention / …that changed something",
        "rounds 2+: same three",
        "rounds 2+ repeated in a later round",
        "rounds 2+ tokens",
      ],
      rows,
    ),
  )
}
out.push("")

// -------- table 3: by run size
out.push(
  "## 3. By run size (okven branches only, joined to `okven-runs.jsonl` by branch on `loc.codeTotal`)",
)
out.push("")
{
  const rows = []
  const sizes = ["small (≤60 LOC)", "medium (61–2000)", "large (>2000)"]
  for (const g of GATES) {
    for (const s of sizes) {
      const rs = runs.filter((r) => r.gate === g && sizeOf(r.branch) === s)
      if (!rs.length) continue
      rows.push(row(`${LABEL[g]} · ${s}`, stats(rs)))
    }
  }
  out.push(tbl(HEAD, rows))
  const joined = runs.filter((r) => r.role && sizeOf(r.branch))
  const unjoined = runs.filter((r) => r.role && !sizeOf(r.branch))
  out.push("")
  out.push(
    `Joined: ${joined.length} of ${joined.length + unjoined.length} role-resolved runs. The ${unjoined.length} unjoined are non-okven projects (aydy, delta-review, firebase-kit, metaforico, originhypnosis, ericvera.dev, mise-claude-plugin) plus runs whose transcript recorded \`gitBranch: HEAD\` in a detached worktree; \`okven-runs.jsonl\` covers okven only.`,
  )
  out.push("")
  out.push(
    tbl(
      [
        "size bucket",
        "branches with transcripts",
        "role-resolved runs",
        "tokens",
        "agent-hours",
      ],
      sizes.map((s) => {
        const rs = runs.filter((r) => r.role && sizeOf(r.branch) === s)
        return [
          s,
          new Set(rs.map((r) => r.branch)).size,
          rs.length,
          num(sum(rs, (r) => r.tokensTotal)),
          hrs(sum(rs, (r) => r.durationMs)),
        ]
      }),
    ),
  )
}
out.push("")

// -------- table 4: clean first rounds
out.push(
  "## 4. Gates that passed clean on the first round — cost spent to learn nothing",
)
out.push("")
{
  const CLEAN = {
    "critic-requirements": (r) =>
      r.verdict === "pass" || r.verdict === "pass-implied",
    "critic-plan": (r) => r.verdict === "pass" || r.verdict === "pass-implied",
    reviewer: (r) => r.verdict === "clean" || r.verdict === "clean-prose",
    acceptance: (r) => r.verdict === "all-verified",
    "gate-run": (r) => r.verdict === "pass",
    documenter: (r) => r.verdict === "nothing-to-document",
    retrospective: (r) => r.verdict === "no-proposals",
  }
  const rows = []
  for (const g of GATES) {
    const r1 = runs.filter((r) => r.gate === g && r.roundInBranch === 1)
    const clean = r1.filter(CLEAN[g])
    // stricter: clean verdict AND no finding of substance
    const empty = r1.filter((r) => {
      const f = byAgent.get(r.agentId) || []
      return !f.some((x) => SUBSTANTIVE.has(x.substance))
    })
    rows.push([
      LABEL[g],
      r1.length,
      pct(clean.length, r1.length),
      num(sum(clean, (r) => r.tokensTotal)),
      hrs(sum(clean, (r) => r.durationMs)),
      pct(empty.length, r1.length),
      num(sum(empty, (r) => r.tokensTotal)),
    ])
  }
  out.push(
    tbl(
      [
        "gate",
        "first rounds",
        "clean verdict",
        "tokens spent on those",
        "agent-hours",
        "no defect/convention finding at all",
        "tokens spent on those",
      ],
      rows,
    ),
  )
}
out.push("")
{
  // whole-loop view: targets whose every round was clean
  const groups = new Map()
  for (const r of runs) {
    if (!r.role) continue
    const k = [r.projectDir, r.branch || "-", r.gate, r.target].join("|")
    ;(groups.get(k) || groups.set(k, []).get(k)).push(r)
  }
  const rows = []
  for (const g of GATES) {
    const gs = [...groups.entries()]
      .filter(([k]) => k.split("|")[2] === g)
      .map(([, v]) => v)
    if (!gs.length) continue
    const oneRound = gs.filter((v) => v.length === 1)
    const noSubstance = gs.filter(
      (v) =>
        !v
          .flatMap((r) => byAgent.get(r.agentId) || [])
          .some((x) => SUBSTANTIVE.has(x.substance)),
    )
    rows.push([
      LABEL[g],
      gs.length,
      pct(oneRound.length, gs.length),
      (gs.reduce((a, v) => a + v.length, 0) / gs.length).toFixed(1),
      Math.max(...gs.map((v) => v.length)),
      pct(noSubstance.length, gs.length),
      num(sum(noSubstance.flat(), (r) => r.tokensTotal)),
    ])
  }
  out.push(
    tbl(
      [
        "gate",
        "targets (artifact or task, per branch)",
        "settled in one round",
        "mean rounds",
        "max rounds",
        "targets where no round found a defect or convention item",
        "tokens on those",
      ],
      rows,
    ),
  )
}
out.push("")

// -------- table 5: valuable catches
out.push("## 5. Ten of the most valuable catches")
out.push("")
{
  const cand = findings.filter(
    (f) =>
      f.outcome === CHANGED &&
      SUBSTANTIVE.has(f.substance) &&
      f.substanceSource === "hand",
  )
  const score = (f) =>
    (f.severity === "blocking"
      ? 3
      : f.severity === "not-verified"
        ? 2
        : f.severity === "defect"
          ? 2
          : 1) +
    (f.substance === "defect" ? 2 : 1) +
    (f.outcomeSource === "script-unambiguous" ? 1 : 0) +
    (f.roundInBranch === 1 ? 1 : 0)
  const picked = cand
    .sort(
      (a, b) =>
        score(b) - score(a) || b.findingText.length - a.findingText.length,
    )
    .slice(0, 10)
  out.push(
    tbl(
      [
        "#",
        "gate · round",
        "branch",
        "severity / substance",
        "finding (verbatim, trimmed)",
        "what happened",
        "transcript",
      ],
      picked.map((f, i) => [
        i + 1,
        `${LABEL[f.gate]} · r${f.roundInBranch}`,
        f.branch,
        `${f.severity} / ${f.substance}`,
        "`" +
          f.findingText
            .replace(/\s+/g, " ")
            .replace(/\|/g, "\\|")
            .slice(0, 320) +
          "`",
        f.outcomeEvidence.replace(/\|/g, "\\|").slice(0, 130),
        f.transcript,
      ]),
    ),
  )
  out.push("")
  out.push(
    `Selection: hand-classified rows only (${cand.length} of the ${findings.filter((f) => f.outcome === CHANGED && SUBSTANTIVE.has(f.substance)).length} defect-or-convention findings that changed something), ranked by stated severity, substance and strength of the outcome evidence. Restricting to hand-classified rows means every example here was read in full before it was called a catch.`,
  )
}
out.push("")

// -------- table 6: wasteful rounds
out.push("## 6. Ten of the most wasteful rounds")
out.push("")
{
  // only verdict-returning gates: a documenter or retrospective run has no findings
  // by construction, so "zero findings" would be tautological there
  const VERDICT_GATES = [
    "critic-requirements",
    "critic-plan",
    "reviewer",
    "acceptance",
    "gate-run",
  ]
  const cand = runs
    .filter((r) => r.role && VERDICT_GATES.includes(r.gate))
    .map((r) => {
      const f = byAgent.get(r.agentId) || []
      const subChanged = f.filter(
        (x) => SUBSTANTIVE.has(x.substance) && x.outcome === CHANGED,
      ).length
      const repeated = f.filter(
        (x) => x.outcome === "repeated-in-later-round",
      ).length
      return { r, f, subChanged, repeated }
    })
    .filter((x) => x.subChanged === 0 && x.r.tokensTotal > 0)
  const picked = cand
    .sort((a, b) => b.r.tokensTotal - a.r.tokensTotal)
    .slice(0, 10)
  out.push(
    tbl(
      [
        "#",
        "gate · round",
        "branch",
        "tokens",
        "minutes",
        "findings",
        "of which repeats of an earlier round",
        "verdict",
        "transcript",
      ],
      picked.map((x, i) => [
        i + 1,
        `${LABEL[x.r.gate]} · r${x.r.roundInBranch}`,
        x.r.branch,
        num(x.r.tokensTotal),
        (x.r.durationMs / 60000).toFixed(0),
        x.f.length,
        x.repeated,
        x.r.verdict,
        x.r.transcript,
      ]),
    ),
  )
  out.push("")
  out.push(
    `Selection: verdict-returning gates only, no defect-or-convention finding that changed anything, ranked by tokens. ${cand.length} of ${runs.filter((r) => VERDICT_GATES.includes(r.gate)).length} such runs qualify, together ${num(
      sum(
        cand.map((x) => x.r),
        (r) => r.tokensTotal,
      ),
    )} tokens and ${hrs(
      sum(
        cand.map((x) => x.r),
        (r) => r.durationMs,
      ),
    )} agent-hours.`,
  )
  out.push("")
  const worstLoops = []
  {
    const groups = new Map()
    for (const r of runs) {
      if (!VERDICT_GATES.includes(r.gate)) continue
      const k = [r.projectDir, r.branch || "-", r.gate, r.target].join("|")
      ;(groups.get(k) || groups.set(k, []).get(k)).push(r)
    }
    for (const [k, v] of groups) {
      if (v.length < 3) continue
      const f = v.flatMap((r) => byAgent.get(r.agentId) || [])
      const tail = v.filter((r) => r.roundInBranch >= 3)
      const tailF = tail.flatMap((r) => byAgent.get(r.agentId) || [])
      worstLoops.push({
        k,
        rounds: v.length,
        tokens: sum(v, (r) => r.tokensTotal),
        tailTokens: sum(tail, (r) => r.tokensTotal),
        tailChanged: tailF.filter(
          (x) => SUBSTANTIVE.has(x.substance) && x.outcome === CHANGED,
        ).length,
        tailRepeat: tailF.filter((x) => x.outcome === "repeated-in-later-round")
          .length,
        tailF: tailF.length,
      })
    }
  }
  out.push(
    tbl(
      [
        "loop (project · branch · gate · target)",
        "rounds",
        "tokens",
        "tokens after round 2",
        "findings after round 2",
        "of those, repeats",
        "of those, defect/convention that changed something",
      ],
      worstLoops
        .sort((a, b) => b.tailTokens - a.tailTokens)
        .slice(0, 10)
        .map((w) => {
          const [pd, br, g, t] = w.k.split("|")
          return [
            `${pd.replace("-Users-eric-Code-", "")} · ${br} · ${LABEL[g]} · ${t}`,
            w.rounds,
            num(w.tokens),
            num(w.tailTokens),
            w.tailF,
            w.tailRepeat,
            w.tailChanged,
          ]
        }),
    ),
  )
}
out.push("")

// -------- table 7: delta notes
out.push("## 7. Owner Delta Review notes vs what a gate was told to check")
out.push("")
{
  const hasRule = (s) =>
    !!s && s !== "no-rule" && !s.startsWith("no-rule at note time")
  const per = new Map()
  for (const n of notes) {
    const k = `${n.repo}/${n.branch}`
    ;(per.get(k) || per.set(k, []).get(k)).push(n)
  }
  const top5 = [...per.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
  const rows = top5.map(([k, ns]) => {
    const miss = ns.filter((n) => hasRule(n.ruleAlreadyExisted))
    const cats = {}
    for (const n of miss) cats[n.category] = (cats[n.category] || 0) + 1
    return [
      k,
      ns.length,
      pct(miss.length, ns.length),
      Object.entries(cats)
        .sort((a, b) => b[1] - a[1])
        .map(([c, v]) => `${c} ${v}`)
        .join(", "),
    ]
  })
  const all = top5.flatMap(([, ns]) => ns)
  rows.push([
    "**all five**",
    all.length,
    pct(all.filter((n) => hasRule(n.ruleAlreadyExisted)).length, all.length),
    "—",
  ])
  out.push(
    tbl(
      [
        "run (repo/branch)",
        "owner notes",
        "gate miss: a project rule already existed at note time",
        "gate-miss notes by category",
      ],
      rows,
    ),
  )
  out.push("")
  // category level
  const cats = new Map()
  for (const n of all) {
    const c =
      cats.get(n.category) ||
      cats.set(n.category, { n: 0, miss: 0 }).get(n.category)
    c.n += 1
    if (hasRule(n.ruleAlreadyExisted)) c.miss += 1
  }
  out.push(
    tbl(
      [
        "note category",
        "notes on the five runs",
        "of which a rule already existed (gate miss)",
      ],
      [...cats.entries()]
        .sort((a, b) => b[1].n - a[1].n)
        .map(([c, v]) => [c, v.n, pct(v.miss, v.n)]),
    ),
  )
}
out.push("")

// -------- method / accuracy
out.push("## 8. Classification accuracy (how much to trust columns 5–12)")
out.push("")
{
  const hand = findings.filter((f) => f.substanceSource === "hand")
  const rows = []
  for (const g of GATES) {
    const h = hand.filter((f) => f.gate === g)
    if (!h.length) continue
    const agree = h.filter((f) => f.scriptSubstance === f.substance).length
    const all = findings.filter((f) => f.gate === g)
    rows.push([
      LABEL[g],
      all.length,
      h.length,
      pct(agree, h.length),
      pct(h.filter((f) => f.substance === "defect").length, h.length),
      pct(h.filter((f) => f.substance === "convention").length, h.length),
      pct(h.filter((f) => f.substance === "nit").length, h.length),
      pct(h.filter((f) => f.substance === "unclear").length, h.length),
    ])
  }
  out.push(
    tbl(
      [
        "gate",
        "findings",
        "hand-classified (stratified by round × stated severity)",
        "script agreed with hand",
        "hand: defect",
        "hand: convention",
        "hand: nit",
        "hand: unclear / extraction artifact",
      ],
      rows,
    ),
  )
  out.push("")
  out.push(
    "Sample shares reweighted to the population (each stratum weighted by its share of the gate's findings, since the sampler took at least one row from every stratum):",
  )
  out.push("")
  {
    const CLASSES = ["defect", "convention", "nit", "unclear"]
    const rw = []
    for (const g of GATES) {
      const pop = findings.filter((f) => f.gate === g)
      const smp = hand.filter((f) => f.gate === g)
      if (!smp.length) continue
      const key = (f) => `${f.roundInBranch >= 2 ? "r2+" : "r1"}|${f.severity}`
      const popBy = new Map(),
        smpBy = new Map()
      for (const f of pop) popBy.set(key(f), (popBy.get(key(f)) || 0) + 1)
      for (const f of smp)
        (smpBy.get(key(f)) || smpBy.set(key(f), []).get(key(f))).push(f)
      const est = Object.fromEntries(CLASSES.map((c) => [c, 0]))
      let covered = 0
      for (const [k, list] of smpBy) {
        const w = (popBy.get(k) || 0) / pop.length
        covered += w
        for (const c of CLASSES)
          est[c] +=
            w * (list.filter((f) => f.substance === c).length / list.length)
      }
      rw.push([
        LABEL[g],
        smp.length,
        `${(covered * 100).toFixed(0)}%`,
        ...CLASSES.map(
          (c) => `${((est[c] / (covered || 1)) * 100).toFixed(0)}%`,
        ),
        Math.round(
          ((est.defect + est.convention) / (covered || 1)) * pop.length,
        ),
      ])
    }
    out.push(
      tbl(
        [
          "gate",
          "sample n",
          "share of findings in sampled strata",
          "defect",
          "convention",
          "nit",
          "unclear",
          "implied defect+convention findings in the gate",
        ],
        rw,
      ),
    )
  }
  out.push("")
  out.push(
    tbl(
      ["classification source", "rows"],
      [
        ["hand", findings.filter((f) => f.substanceSource === "hand").length],
        [
          "script, unambiguous text",
          findings.filter((f) => f.substanceSource === "script-unambiguous")
            .length,
        ],
        [
          "script, weak signal",
          findings.filter((f) => f.substanceSource === "script-weak").length,
        ],
      ],
    ),
  )
  out.push("")
  out.push(
    tbl(
      ["outcome evidence source", "rows"],
      [
        [
          "script, unambiguous (a later dispatch or the driver's revision quotes the finding's rare tokens twice or more)",
          findings.filter((f) => f.outcomeSource === "script-unambiguous")
            .length,
        ],
        [
          "script, weak (single rare-token match, or absence of any match)",
          findings.filter((f) => f.outcomeSource === "script-weak").length,
        ],
      ],
    ),
  )
}
out.push("")

// -------- role resolution
out.push("## 9. Role resolution and corpus")
out.push("")
{
  const BASIS = {
    "roles-file":
      "prompt cites `roles/<role>.md` (mise 2.0.0+ dispatch template)",
    "gate-prose":
      "driver-written prompt for an end-of-plan / baseline / sanity-e2e gate run",
    "prose-1x":
      'driver-written prompt that self-describes the role ("a fresh-context critic/reviewer", "acceptance verifier") — the mise 1.x shape, still used ad hoc inside 2.x runs',
    "stage-file-1x":
      "prompt cites `stages/implement_task.md` or `stages/retrospective.md` (mise 1.x)",
    unresolved: "no role signal",
  }
  const b = {}
  for (const r of runs) b[r.roleBasis] = (b[r.roleBasis] || 0) + 1
  out.push(
    tbl(
      ["how the role was resolved", "runs"],
      Object.entries(b)
        .sort((a, c) => c[1] - a[1])
        .map(([k, v]) => [BASIS[k] || k, v]),
    ),
  )
  out.push("")
  const un = runs.filter((r) => !r.role)
  const inMise = un.filter((r) =>
    /\.mise\/|mise-config|implementation_plan/.test(r.prompt || ""),
  )
  out.push(
    tbl(
      ["bucket", "runs"],
      [
        ["subagent transcripts read", runs.length],
        ["resolved to a mise role", runs.filter((r) => r.role).length],
        ["**not resolved to a role**", un.length],
        [
          "— of those, prompt cites a `.mise/` artifact (driver-authored helpers: citation sweeps, exploration, design passes)",
          inMise.length,
        ],
        [
          "— of those, no mise artifact in the prompt (ad-hoc fan-out in a session that also ran mise, or a non-mise session)",
          un.length - inMise.length,
        ],
      ],
    ),
  )
  out.push("")
  out.push(
    tbl(
      [
        "gate",
        "mise 1.6.0",
        "mise 2.0.0",
        "mise 2.1.0",
        "version not in prompt",
      ],
      GATES.map((g) => {
        const rs = runs.filter((r) => r.gate === g)
        const c = (v) => rs.filter((r) => r.miseVersion === v).length
        return [
          LABEL[g],
          c("1.6.0"),
          c("2.0.0"),
          c("2.1.0"),
          rs.filter((r) => !r.miseVersion).length,
        ]
      }),
    ),
  )
}
out.push("")
out.push("## 10. Gaps")
out.push("")
out.push(
  tbl(
    ["gap", "effect"],
    [
      [
        "Claude Code deleted 177 subagent transcripts during this study (30-day retention); they existed in the 2026-09-19 digest run and were gone by the 2026-09-20 12:35Z snapshot. Whole runs lost: `feat/migrate-firebase-kit` (30 transcripts), `feat/backfill-order-history` (25), `feat/remove-backfill-order-history` (13), plus 59 of 95 aydy, 41 of 645 `eric/attribution-3`, 9 of 50 delta-review.",
        "The corpus shrinks daily. Re-running these scripts on a later day will not reproduce these numbers.",
      ],
      [
        "No surviving role-resolved run cites a 1.x plugin path: `miseVersion` is 2.0.0 on 714 runs, 2.1.0 on 315, absent on 144.",
        "This measures mise 2.0.0 and 2.1.0. It says nothing about 1.x.",
      ],
      [
        "`outcome` is inferred from token overlap with the next fix dispatch, the driver's own revision, or a later round. A fix that renames nothing the finding named is invisible.",
        '`no-visible-response` is an upper bound on "ignored", not a measurement of it.',
      ],
      [
        "`rejected-by-driver` needs rejection language next to the finding's tokens in the following dispatch. The driver usually rejects silently.",
        "The rejected column is a floor; most of `no-visible-response` is probably silent rejection of minor and informative items.",
      ],
      [
        "The splitter cannot always tell a finding from the verification prose around it. Hand sample: 9–30% of extracted rows per gate are artifacts.",
        "Finding counts are inflated; `unclear` is the artifact column. Rates over defect+convention are the safer read.",
      ],
      [
        "Script-vs-hand agreement on substance is 52% (98/190).",
        "The full-corpus substance columns are indicative. The hand columns in table 8 are the measurement.",
      ],
      [
        "The end-of-plan gate runs mostly in the driver's own thread; only the e2e/sanity/quality runs it delegates appear as subagents.",
        "Its 94 runs and 6 findings cover the delegated part only. Main-thread `Format`/`Check`/unit-test failures are not counted here.",
      ],
      [
        "`round` is scoped to branch+target. A branch that ran mise twice (`eric/attribution-3`, 1.6.0 then 2.0.0) merges both loops; the end-of-plan gate has one target per branch, so its round numbers count every gate run on the branch.",
        "Round depth is over-stated for those two cases.",
      ],
      [
        "Agent-hours sum transcript spans. Parallel and async subagents overlap.",
        "Hours over-count elapsed time; use them to compare gates, not to total a run.",
      ],
    ],
  ),
)
out.push("")

fs.writeFileSync(OUT, out.join("\n") + "\n")
console.error("wrote " + OUT)
