// run-costs-md.mjs — renders runs/run-costs.md from the rows run-costs.mjs builds.
// Tables only, per docs/v3-research/AGENT-RULES.md.

const TOKKEYS = ["input", "cacheRead", "cacheCreate", "output", "requests"]
const zero = () => ({
  input: 0,
  cacheRead: 0,
  cacheCreate: 0,
  output: 0,
  thinking: 0,
  requests: 0,
})
const addTok = (d, s) => {
  for (const k of TOKKEYS) d[k] = (d[k] || 0) + (s?.[k] || 0)
  return d
}
const sumModels = (b) => {
  const t = zero()
  for (const v of Object.values(b || {})) addTok(t, v)
  return t
}
const addByModel = (d, s) => {
  for (const [m, t] of Object.entries(s || {})) addTok((d[m] ||= zero()), t)
  return d
}

const h = (msV) => (msV == null ? "" : (msV / 3.6e6).toFixed(1))
const m = (msV) => (msV == null ? "" : Math.round(msV / 6e4))
const k = (n) =>
  n == null
    ? ""
    : n >= 1e9
      ? (n / 1e9).toFixed(2) + "G"
      : n >= 1e6
        ? (n / 1e6).toFixed(2) + "M"
        : n >= 1000
          ? Math.round(n / 1000) + "k"
          : String(n)
const pc = (a, b) => (b ? ((100 * a) / b).toFixed(1) + "%" : "—")
const med = (xs) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const i = s.length >> 1
  return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2
}
const pctl = (xs, p) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]
}

const STAGES = [
  "setup",
  "goals",
  "mock",
  "requirements",
  "plan",
  "execute",
  "acceptance",
  "retrospective",
  "cleanup",
  "(unattributed)",
]
const ROLES = [
  "critic",
  "implementer",
  "fix",
  "reviewer",
  "documenter",
  "acceptance",
  "retrospective",
  "other",
  "driver",
]

function table(head, rows) {
  const out = [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
  ]
  for (const r of rows)
    out.push(`| ${r.map((x) => (x == null ? "" : String(x))).join(" | ")} |`)
  return out.join("\n")
}

// tokens actually paid for: output plus everything fed in (cache reads included)
const inTok = (t) => (t.input || 0) + (t.cacheRead || 0) + (t.cacheCreate || 0)

export function renderMd(rows, { unmatched }) {
  const out = []
  const P = (s) => out.push(s, "")

  const nRuns = rows.length
  const nSessions = rows.reduce((a, r) => a + r.sessionCount, 0)

  P("# Run costs — where time and tokens go in a mise run")
  P(
    [
      `Built by \`tools/run-costs.mjs\` from \`runs/digests/**\` joined to \`runs/okven-runs.jsonl\` + \`runs/other-runs/*-runs.jsonl\`.`,
      `Row source: \`runs/run-costs.jsonl\`.`,
      "",
      `**n for everything below: ${nRuns} runs / ${nSessions} sessions / ${rows.reduce((a, r) => a + r.spawnsTotal, 0)} distinct subagents (${rows.reduce((a, r) => a + r.dispatchesTotal, 0)} Agent dispatches — a resumed agent is dispatched more than once against one transcript, so tokens and minutes are counted once per agent), 8 repos, 2026-07-31 → 2026-09-19.**`,
      `Every rate in this file rests on those 28 runs unless the table says otherwise.`,
      "",
      "Scope and known limits, so no number here is read as more than it is:",
      "",
      "- **Bounding.** The mise part of a session is `[first mise marker, last mise marker]`, markers being `state.ts` calls, `/mise:next` and `Skill(mise:next)`, mise-role subagent spawns (and their transcript end), and main-thread tool calls that touch the run's `.mise/` directory. The rule and the stage-assertion order are written out at the top of `tools/run-costs.mjs`. Work outside the span is dropped and counted in `outside` (17 spawns in total, 0.8% of spawns).",
      `- **6 of 42 sessions have lost their raw transcript** since the digests were taken on 2026-09-19 (whole project directories have been pruned from \`~/.claude/projects\`; the digest is now the only record). For those, the session-level wall split and driver tokens are booked whole to the stage \`(unattributed)\` — 10.1% of all active time. They are never spread over stages by guess. This is also why the digest batch was not re-run.`,
      `- **Role of a nested subagent.** ${rows.reduce((a, r) => a + r.spawnDetail.filter((x) => (x.depth || 1) >= 2).length, 0)} of ${rows.reduce((a, r) => a + r.spawnsTotal, 0)} subagents run at depth >= 2; each inherits the mise role of its nearest role-carrying ancestor (an Explore agent spawned by an implementer is charged to \`implementer\`), because that is whose work it is. Depth-1 agents the driver spawned that are not a mise role are \`other\`.`,
      "- **One run distorts the `goals` row.** `feat/home-page@ad5081a1f` (originhypnosis) never left goals: 44 parallel design-concept agents and 1.44M output tokens are booked to `goals` because that run recorded no `mock` approval. Excluding it, `goals` is 1.37M output (2.9% of the remaining 46.87M) rather than 5.8%.",
      '- **Parallelism.** `modelMs`/`toolMs`/`humanWaitMs` partition wall clock and sum exactly to it, so they never double-count; but subagent `duration` sums do — several agents run at once. Read role duration as "agent-minutes", not elapsed.',
      '- **Permission-prompt wait is inside `toolMs`** (the transcript has no "prompt shown" event), so tool time is an upper bound and human-wait a lower bound.',
      "- **Gate commands are matched on the digest's 200-character command prefix**, so two long commands sharing a prefix count as the same command in the re-run table. Section (g) also re-classifies the digester's gate rows and reports both counts.",
      `- ${unmatched.length} mise session could not be joined to a run (\`${unmatched.map((u) => u.session.projectDir.replace("-Users-eric-Code-", "") + "/" + u.session.sessionId.slice(0, 8)).join(", ")}\`): the branch has no surviving \`.mise\` lifecycle in git.`,
      `- No run in the transcript corpus has a mise **1.x** version ceiling (the one 1.6.0 session, \`aydy/9026fc28\`, belongs to a run that finished on 2.0.0). Every "by version" table below is therefore 2.0.0 vs 2.1.0, n=${rows.filter((r) => r.miseVersionCeiling === "2.0.0").length} vs ${rows.filter((r) => r.miseVersionCeiling === "2.1.0").length}.`,
    ].join("\n"),
  )

  // ------------------------------------------------------------------ totals
  const tot = { stages: {}, roles: {} }
  for (const r of rows) {
    for (const [s, b] of Object.entries(r.byStage)) {
      const d = (tot.stages[s] ||= {
        sub: {},
        drv: {},
        modelMs: 0,
        toolMs: 0,
        waitMs: 0,
        waitCapMs: 0,
        spawns: 0,
        gateRuns: 0,
        gateMs: 0,
        gateRunsStrict: 0,
        gateMsStrict: 0,
        writes: 0,
        compactions: 0,
      })
      addByModel(d.sub, b.subTokensByModel)
      addByModel(d.drv, b.driverTokensByModel)
      d.modelMs += b.modelMs
      d.toolMs += b.toolMs
      d.waitMs += b.humanWaitMs
      d.waitCapMs += b.humanWaitCappedMs
      d.spawns += b.spawns
      d.gateRuns += b.gateRuns
      d.gateMs += b.gateMs
      d.gateRunsStrict += b.gateRunsStrict || 0
      d.gateMsStrict += b.gateMsStrict || 0
      d.writes += b.miseArtifactWrites
      d.compactions += b.compactions
    }
    for (const [ro, b] of Object.entries(r.byRole)) {
      const d = (tot.roles[ro] ||= {
        tok: {},
        durMs: 0,
        spawns: 0,
        gateRuns: 0,
        gateMs: 0,
        gateRunsStrict: 0,
        gateMsStrict: 0,
        depth2: 0,
        toolUses: 0,
      })
      addByModel(d.tok, b.tokensByModel)
      d.durMs += b.durationMs
      d.spawns += b.spawns
      d.gateRuns += b.gateRuns
      d.gateMs += b.gateMs
      d.gateRunsStrict += b.gateRunsStrict || 0
      d.gateMsStrict += b.gateMsStrict || 0
      d.depth2 += b.depth2plus
      d.toolUses += b.toolUses || 0
    }
  }
  const allOut = Object.values(tot.stages).reduce(
    (a, d) => a + sumModels(d.sub).output + sumModels(d.drv).output,
    0,
  )
  const allIn = Object.values(tot.stages).reduce(
    (a, d) => a + inTok(sumModels(d.sub)) + inTok(sumModels(d.drv)),
    0,
  )
  const allActive = Object.values(tot.stages).reduce(
    (a, d) => a + d.modelMs + d.toolMs,
    0,
  )
  const allWait = Object.values(tot.stages).reduce((a, d) => a + d.waitMs, 0)

  // ------------------------------------------------------------------ (a)
  P("## (a) Share of tokens and of active time")
  P(
    "Active time = `modelMs + toolMs` on the main thread inside the mise span; human-wait excluded. Output = generated tokens; Input = `input + cacheCreate + cacheRead` (cache reads dominate and are what the context window actually costs). Driver = main thread, Sub = all subagents. n = 28 runs.",
  )

  P("### by stage")
  P(
    table(
      [
        "stage",
        "spawns",
        "out tok",
        "% out",
        "in tok",
        "% in",
        "driver out",
        "sub out",
        "active h",
        "% active",
        "wait h",
      ],
      STAGES.filter((s) => tot.stages[s]).map((s) => {
        const d = tot.stages[s],
          sub = sumModels(d.sub),
          drv = sumModels(d.drv)
        const o = sub.output + drv.output,
          i = inTok(sub) + inTok(drv),
          act = d.modelMs + d.toolMs
        return [
          s,
          d.spawns,
          k(o),
          pc(o, allOut),
          k(i),
          pc(i, allIn),
          k(drv.output),
          k(sub.output),
          h(act),
          pc(act, allActive),
          h(d.waitMs),
        ]
      }),
    ),
  )

  P("### by role (subagents; `driver` = the main thread, which spawns them)")
  P(
    table(
      [
        "role",
        "spawns",
        "% spawns",
        "out tok",
        "% out",
        "in tok",
        "% in",
        "agent-minutes",
        "tool calls",
        "depth>=2",
      ],
      [
        ...ROLES.filter((x) => tot.roles[x] && x !== "driver").map((x) => {
          const d = tot.roles[x],
            t = sumModels(d.tok)
          return [
            x,
            d.spawns,
            pc(
              d.spawns,
              Object.values(tot.roles).reduce((a, y) => a + y.spawns, 0),
            ),
            k(t.output),
            pc(t.output, allOut),
            k(inTok(t)),
            pc(inTok(t), allIn),
            m(d.durMs),
            d.toolUses || "",
            d.depth2,
          ]
        }),
        (() => {
          const drv = Object.values(tot.stages).reduce(
            (a, d) => addByModel(a, d.drv),
            {},
          )
          const t = sumModels(drv)
          return [
            "driver (main thread)",
            "—",
            "—",
            k(t.output),
            pc(t.output, allOut),
            k(inTok(t)),
            pc(inTok(t), allIn),
            m(allActive),
            "—",
            "—",
          ]
        })(),
      ],
    ),
  )

  P("### by mise version ceiling")
  for (const ver of ["2.0.0", "2.1.0"]) {
    const rs = rows.filter((r) => r.miseVersionCeiling === ver)
    const st = {},
      allO = { v: 0 },
      allA = { v: 0 }
    for (const r of rs)
      for (const [s, b] of Object.entries(r.byStage)) {
        const d = (st[s] ||= { o: 0, a: 0, sp: 0 })
        const o =
          sumModels(b.subTokensByModel).output +
          sumModels(b.driverTokensByModel).output
        d.o += o
        d.a += b.modelMs + b.toolMs
        d.sp += b.spawns
        allO.v += o
        allA.v += b.modelMs + b.toolMs
      }
    P(
      `**${ver}** — n = ${rs.length} runs (${rs.map((r) => r.runId.split("@")[0]).join(", ")})`,
    )
    P(
      table(
        ["stage", "spawns", "out tok", "% out", "active h", "% active"],
        STAGES.filter((s) => st[s]).map((s) => [
          s,
          st[s].sp,
          k(st[s].o),
          pc(st[s].o, allO.v),
          h(st[s].a),
          pc(st[s].a, allA.v),
        ]),
      ),
    )
  }

  const roleVer = {}
  for (const r of rows)
    for (const [ro, b] of Object.entries(r.byRole)) {
      const d = (roleVer[ro] ||= {
        "2.0.0": { o: 0, sp: 0 },
        "2.1.0": { o: 0, sp: 0 },
      })
      if (!d[r.miseVersionCeiling]) continue
      d[r.miseVersionCeiling].o += sumModels(b.tokensByModel).output
      d[r.miseVersionCeiling].sp += b.spawns
    }
  const verOut = (v) =>
    rows
      .filter((r) => r.miseVersionCeiling === v)
      .reduce((a, r) => a + r.tokens.combinedOutput, 0)
  P(
    table(
      ["role", "2.0.0 spawns", "2.0.0 % out", "2.1.0 spawns", "2.1.0 % out"],
      ROLES.filter((x) => roleVer[x] && x !== "driver").map((x) => [
        x,
        roleVer[x]["2.0.0"].sp,
        pc(roleVer[x]["2.0.0"].o, verOut("2.0.0")),
        roleVer[x]["2.1.0"].sp,
        pc(roleVer[x]["2.1.0"].o, verOut("2.1.0")),
      ]),
    ),
  )

  // ------------------------------------------------------------------ (b)
  P("## (b) Per-task cost in `execute`")
  const fullRaw = rows.filter((r) => r.rawTranscriptsMissing === 0)
  const exRows = fullRaw.filter((r) => r.byStage.execute && r.taskCount > 0)
  const perTask = exRows.map((r) => {
    const b = r.byStage.execute
    const o =
      sumModels(b.subTokensByModel).output +
      sumModels(b.driverTokensByModel).output
    return {
      runId: r.runId,
      tasks: r.taskCount,
      spawns: b.spawns,
      out: o,
      act: b.modelMs + b.toolMs,
      spawnsPer: b.spawns / r.taskCount,
      outPer: o / r.taskCount,
      minPer: (b.modelMs + b.toolMs) / 6e4 / r.taskCount,
    }
  })
  P(
    `Per task = the \`execute\` stage divided by the run's plan task count (task files in \`.mise/implementation_plan/\`, from git). Restricted to the ${exRows.length} runs that have a task count, an execute stage **and** a complete raw transcript — the 6 pruned runs have no per-stage time. n = ${exRows.length} runs, ${exRows.reduce((a, r) => a + r.taskCount, 0)} tasks.`,
  )
  P(
    table(
      ["metric", "median", "p90", "min", "max"],
      [
        [
          "subagent spawns per task",
          med(perTask.map((x) => x.spawnsPer)).toFixed(1),
          pctl(
            perTask.map((x) => x.spawnsPer),
            90,
          ).toFixed(1),
          Math.min(...perTask.map((x) => x.spawnsPer)).toFixed(1),
          Math.max(...perTask.map((x) => x.spawnsPer)).toFixed(1),
        ],
        [
          "output tokens per task",
          k(Math.round(med(perTask.map((x) => x.outPer)))),
          k(
            Math.round(
              pctl(
                perTask.map((x) => x.outPer),
                90,
              ),
            ),
          ),
          k(Math.round(Math.min(...perTask.map((x) => x.outPer)))),
          k(Math.round(Math.max(...perTask.map((x) => x.outPer)))),
        ],
        [
          "active minutes per task",
          Math.round(med(perTask.map((x) => x.minPer))),
          Math.round(
            pctl(
              perTask.map((x) => x.minPer),
              90,
            ),
          ),
          Math.round(Math.min(...perTask.map((x) => x.minPer))),
          Math.round(Math.max(...perTask.map((x) => x.minPer))),
        ],
      ],
    ),
  )

  // how the execute stage splits, tokens measured inside the execute stage only
  const exTot = { roles: {}, out: 0, drvOut: 0, act: 0 }
  for (const r of rows) {
    const b = r.byStage.execute
    if (!b) continue
    exTot.drvOut += sumModels(b.driverTokensByModel).output
    exTot.out +=
      sumModels(b.subTokensByModel).output +
      sumModels(b.driverTokensByModel).output
    exTot.act += b.modelMs + b.toolMs
    for (const [ro, d] of Object.entries(b.tokensByRole || {})) {
      const t = (exTot.roles[ro] ||= { sp: 0, out: 0, dur: 0 })
      t.sp += d.spawns
      t.out += d.tokens.output
      t.dur += d.durationMs
    }
  }
  P(
    `How the execute stage splits — spawns, output tokens and agent-minutes counted **inside the execute stage only**, over all ${rows.filter((r) => r.byStage.execute).length} runs that reached execute. \`driver overhead\` is main-thread work between spawns (reading state, writing task files, dispatching); its "agent-minutes" column is the stage's elapsed active time, not an agent sum.`,
  )
  P(
    table(
      [
        "component",
        "spawns",
        "output tok",
        "% of execute output",
        "agent-minutes",
      ],
      [
        ...[
          "implementer",
          "fix",
          "reviewer",
          "documenter",
          "critic",
          "acceptance",
          "other",
        ]
          .filter((x) => exTot.roles[x])
          .map((x) => [
            x,
            exTot.roles[x].sp,
            k(exTot.roles[x].out),
            pc(exTot.roles[x].out, exTot.out),
            m(exTot.roles[x].dur),
          ]),
        [
          "driver overhead (main thread)",
          "\u2014",
          k(exTot.drvOut),
          pc(exTot.drvOut, exTot.out),
          m(exTot.act),
        ],
      ],
    ),
  )

  P("Per run (the same split, only the runs with a complete raw transcript):")
  P(
    table(
      [
        "run",
        "tasks",
        "execute spawns",
        "spawns/task",
        "execute out tok",
        "out/task",
        "active min/task",
        "implementer",
        "fix",
        "reviewer",
        "documenter",
        "driver",
      ],
      exRows.map((r) => {
        const b = r.byStage.execute,
          br = b.tokensByRole || {}
        const o =
          sumModels(b.subTokensByModel).output +
          sumModels(b.driverTokensByModel).output
        const sh = (x) => (br[x] ? pc(br[x].tokens.output, o) : "\u2014")
        return [
          r.runId,
          r.taskCount,
          b.spawns,
          (b.spawns / r.taskCount).toFixed(1),
          k(o),
          k(Math.round(o / r.taskCount)),
          Math.round((b.modelMs + b.toolMs) / 6e4 / r.taskCount),
          sh("implementer"),
          sh("fix"),
          sh("reviewer"),
          sh("documenter"),
          pc(sumModels(b.driverTokensByModel).output, o),
        ]
      }),
    ),
  )

  // ------------------------------------------------------------------ (c)
  P("## (c) Driver overhead — what the main thread spends between spawns")
  const drvAll = Object.values(tot.stages).reduce(
    (a, d) => addByModel(a, d.drv),
    {},
  )
  const drvT = sumModels(drvAll)
  P(
    `The driver never idles while a subagent runs — its tokens are the state reads, skill re-reads, task-file writes and dispatch prose around each spawn. Driver = ${k(drvT.output)} output (${pc(drvT.output, allOut)} of all output) and ${k(inTok(drvT))} input (${pc(inTok(drvT), allIn)} of all input) over ${drvT.requests} requests. n = 28 runs.`,
  )
  P(
    table(
      [
        "stage",
        "driver requests",
        "driver out",
        "driver in",
        "driver out / run",
        "`.mise/` file writes",
        "compactions",
      ],
      STAGES.filter((s) => tot.stages[s]).map((s) => {
        const d = tot.stages[s],
          t = sumModels(d.drv)
        return [
          s,
          t.requests,
          k(t.output),
          k(inTok(t)),
          k(Math.round(t.output / rows.length)),
          d.writes,
          d.compactions,
        ]
      }),
    ),
  )

  // skill file reads
  const drvReads = {},
    agReads = {}
  for (const r of rows) {
    for (const b of Object.values(r.byStage))
      for (const [f, e] of Object.entries(b.skillFileReads)) {
        const d = (drvReads[f] ||= { n: 0, chars: 0, runs: new Set() })
        d.n += e.n
        d.chars += e.chars
        d.runs.add(r.runId)
      }
    for (const [key, n] of Object.entries(r.agentSkillReads)) {
      const [role, f] = key.split("|")
      const d = (agReads[f] ||= { n: 0, byRole: {} })
      d.n += n
      d.byRole[role] = (d.byRole[role] || 0) + n
    }
  }
  P(
    "**mise skill files read by the driver** (main thread; a `Read` or a `cat`/`sed` in `Bash`). `est tok` = result characters / 4. `SKILL.md` is not usually read — the harness injects it as a skill body on every `/mise:next`, counted in the second table.",
  )
  P(
    table(
      [
        "file",
        "reads (all runs)",
        "runs that read it",
        "reads / run",
        "result chars",
        "est tok",
      ],
      Object.entries(drvReads)
        .sort((a, b) => b[1].n - a[1].n)
        .map(([f, d]) => [
          f,
          d.n,
          `${d.runs.size}/${rows.length}`,
          (d.n / rows.length).toFixed(2),
          k(d.chars),
          k(Math.round(d.chars / 4)),
        ]),
    ),
  )

  const inj = rows.reduce(
    (a, r) => ({
      n: a.n + r.driverSkillInjections,
      c: a.c + r.driverSkillInjectionChars,
    }),
    { n: 0, c: 0 },
  )
  P(
    table(
      [
        "driver skill-body injections (SKILL.md and other skills, `isMeta` turns)",
        "count",
        "chars",
        "est tok",
        "per run",
      ],
      [
        [
          "total",
          inj.n,
          k(inj.c),
          k(Math.round(inj.c / 4)),
          (inj.n / rows.length).toFixed(1),
        ],
      ],
    ),
  )

  P(
    "**mise skill files read by role subagents** (each spawn re-reads its own role file; this is the per-spawn instruction cost the driver pays for):",
  )
  P(
    table(
      ["file", "reads", "by role"],
      Object.entries(agReads)
        .sort((a, b) => b[1].n - a[1].n)
        .slice(0, 14)
        .map(([f, d]) => [
          f,
          d.n,
          Object.entries(d.byRole)
            .sort((a, b) => b[1] - a[1])
            .map(([r2, n]) => `${r2} ${n}`)
            .join(", "),
        ]),
    ),
  )

  P("**Driver token cost per run** (highest first):")
  P(
    table(
      [
        "run",
        "driver out",
        "driver in",
        "driver reqs",
        "driver % of run output",
        "`.mise/` writes",
        "skill-file reads",
      ],
      [...rows]
        .sort(
          (a, b) => b.tokens.driverTotal.output - a.tokens.driverTotal.output,
        )
        .map((r) => {
          const writes = Object.values(r.byStage).reduce(
            (a, b) => a + b.miseArtifactWrites,
            0,
          )
          const reads = Object.values(r.byStage).reduce(
            (a, b) =>
              a + Object.values(b.skillFileReads).reduce((x, e) => x + e.n, 0),
            0,
          )
          return [
            r.runId,
            k(r.tokens.driverTotal.output),
            k(inTok(r.tokens.driverTotal)),
            r.tokens.driverTotal.requests,
            pc(r.tokens.driverTotal.output, r.tokens.combinedOutput),
            writes,
            reads,
          ]
        }),
    ),
  )

  // ------------------------------------------------------------------ (d)
  P("## (d) Human-wait — where the run sat waiting for the owner")
  P(
    `Human-wait is the gap before a turn the owner actually typed. Total across 28 runs: ${h(allWait)} h, against ${h(allActive)} h of active model+tool time — a ${(allWait / allActive).toFixed(1)}:1 ratio. Capped at 30 min per gap (overnight gaps removed) it is ${h(Object.values(tot.stages).reduce((a, d) => a + d.waitCapMs, 0))} h.`,
  )
  P(
    table(
      [
        "stage",
        "wait h",
        "% of wait",
        "wait h capped 30m",
        "wait : active in this stage",
      ],
      STAGES.filter((s) => tot.stages[s]).map((s) => {
        const d = tot.stages[s],
          act = d.modelMs + d.toolMs
        return [
          s,
          h(d.waitMs),
          pc(d.waitMs, allWait),
          h(d.waitCapMs),
          act ? (d.waitMs / act).toFixed(1) + ":1" : "—",
        ]
      }),
    ),
  )

  const perRunWait = rows.map((r) => r.humanWaitMs)
  const gaps = rows.flatMap((r) => r.topWaits.map((w) => w.ms))
  P(
    table(
      ["measure", "median", "p90", "max"],
      [
        [
          `total human-wait per run (n=${rows.length})`,
          h(med(perRunWait)) + " h",
          h(pctl(perRunWait, 90)) + " h",
          h(Math.max(...perRunWait)) + " h",
        ],
        [
          `longest single wait per run (n=${rows.length})`,
          h(med(rows.map((r) => r.longestHumanWaitMs))) + " h",
          h(
            pctl(
              rows.map((r) => r.longestHumanWaitMs),
              90,
            ),
          ) + " h",
          h(Math.max(...rows.map((r) => r.longestHumanWaitMs))) + " h",
        ],
        [
          `the 5 longest gaps of each run, pooled (n=${gaps.length})`,
          h(med(gaps)) + " h",
          h(pctl(gaps, 90)) + " h",
          h(Math.max(...gaps)) + " h",
        ],
      ],
    ),
  )

  const stageOfLongest = {}
  for (const r of rows) {
    const w = r.topWaits[0]
    stageOfLongest[w ? w.stage : "(pruned \u2014 unknown)"] =
      (stageOfLongest[w ? w.stage : "(pruned \u2014 unknown)"] || 0) + 1
  }
  P("Stage the single longest wait of a run fell in:")
  P(
    table(
      ["stage", "runs whose longest wait is here"],
      Object.entries(stageOfLongest)
        .sort((a, b) => b[1] - a[1])
        .map(([s, n]) => [s, `${n}/${rows.length}`]),
    ),
  )

  P("Per run:")
  P(
    table(
      [
        "run",
        "wait h",
        "capped h",
        "longest gap h",
        "stage of longest gap",
        "active h",
        "wall h",
      ],
      [...rows]
        .sort((a, b) => b.humanWaitMs - a.humanWaitMs)
        .map((r) => [
          r.runId,
          h(r.humanWaitMs),
          h(r.humanWaitCappedMs),
          h(r.longestHumanWaitMs),
          r.topWaits[0]?.stage || "(pruned \u2014 unknown)",
          h(r.activeMs),
          h(r.wallClockMs),
        ]),
    ),
  )

  // ------------------------------------------------------------------ (e)
  P("## (e) Small runs — the cost of a small note")
  const small = rows
    .filter((r) => r.locCodeTotal != null && r.locCodeTotal <= 400)
    .sort((a, b) => a.locCodeTotal - b.locCodeTotal)
  P(
    `Every run whose non-mise code diff is <= 400 changed lines; the \`<=60\` column marks the ones the brief asks for by size. n = ${small.length} runs, of which ${small.filter((r) => r.locCodeTotal <= 60).length} is <= 60 lines (only \`fix/missing-image\` clears that bar; \`fix/menu-availability\` at 63 is the next). "artifact lines" is the total of \`.mise/\` artifact line counts from git (goals, requirements, plan overview + task files, progress, friction, exploration, retrospective).`,
  )
  P(
    table(
      [
        "run",
        "type",
        "<=60",
        "code lines changed",
        "files",
        "mise artifact lines",
        "artifact : code",
        "subagents",
        "wall h",
        "active h",
        "wait h",
        "output tok",
        "gate runs",
        "sessions",
      ],
      small.map((r) => [
        r.runId,
        r.type,
        r.locCodeTotal <= 60 ? "yes" : "",
        r.locCodeTotal,
        r.locFilesChanged,
        r.artifactLinesTotal ?? "\u2014",
        r.artifactLinesTotal && r.locCodeTotal
          ? (r.artifactLinesTotal / r.locCodeTotal).toFixed(1) + "x"
          : "—",
        r.spawnsTotal,
        h(r.wallClockMs),
        h(r.activeMs),
        h(r.humanWaitMs),
        k(r.tokens.combinedOutput),
        r.gates.runs,
        r.sessionCount,
      ]),
    ),
  )

  const big = rows.filter((r) => r.locCodeTotal != null && r.locCodeTotal > 400)
  P(
    'The same run shape, small runs against the rest — this is the "small note takes very long" claim, quantified:',
  )
  P(
    table(
      [
        "cohort",
        "n",
        "median code lines",
        "median artifact lines",
        "median artifact : code",
        "median subagents",
        "median stages entered",
        "median wall h",
        "median active h",
        "median output tok",
      ],
      [
        [
          "<= 400 code lines",
          small.length,
          med(small.map((r) => r.locCodeTotal)),
          med(small.map((r) => r.artifactLinesTotal).filter((x) => x != null)),
          med(
            small
              .filter((r) => r.artifactLinesTotal)
              .map((r) => r.artifactLinesTotal / r.locCodeTotal),
          ).toFixed(1) + "x",
          med(small.map((r) => r.spawnsTotal)),
          med(small.map((r) => Object.keys(r.byStage).length)),
          h(med(small.map((r) => r.wallClockMs))),
          h(med(small.map((r) => r.activeMs))),
          k(Math.round(med(small.map((r) => r.tokens.combinedOutput)))),
        ],
        [
          "> 400 code lines",
          big.length,
          med(big.map((r) => r.locCodeTotal)),
          med(big.map((r) => r.artifactLinesTotal).filter((x) => x != null)),
          med(
            big
              .filter((r) => r.artifactLinesTotal)
              .map((r) => r.artifactLinesTotal / r.locCodeTotal),
          ).toFixed(2) + "x",
          med(big.map((r) => r.spawnsTotal)),
          med(big.map((r) => Object.keys(r.byStage).length)),
          h(med(big.map((r) => r.wallClockMs))),
          h(med(big.map((r) => r.activeMs))),
          k(Math.round(med(big.map((r) => r.tokens.combinedOutput)))),
        ],
      ],
    ),
  )

  P(
    "Full stage timeline of each small run — active minutes / output tokens / subagents per stage:",
  )
  for (const r of small) {
    P(
      `**${r.runId}** — ${r.locCodeTotal} code lines changed in ${r.locFilesChanged} files; ${r.taskCount ?? "?"} plan tasks; ${r.artifactLinesTotal ?? "?"} artifact lines; mise ${r.miseVersionCeiling}`,
    )
    P(
      table(
        [
          "stage",
          "active min",
          "wait min",
          "output tok",
          "driver out",
          "subagents",
          "roles",
          "gate runs",
          "`.mise/` writes",
        ],
        STAGES.filter((s) => r.byStage[s]).map((s) => {
          const b = r.byStage[s]
          return [
            s,
            m(b.modelMs + b.toolMs),
            m(b.humanWaitMs),
            k(
              sumModels(b.subTokensByModel).output +
                sumModels(b.driverTokensByModel).output,
            ),
            k(sumModels(b.driverTokensByModel).output),
            b.spawns,
            Object.entries(b.spawnsByRole)
              .map(([x, n]) => `${x} ${n}`)
              .join(", ") || "—",
            b.gateRuns,
            b.miseArtifactWrites,
          ]
        }),
      ),
    )
  }

  // ------------------------------------------------------------------ (f)
  P("## (f) The 10 most expensive individual subagent runs")
  const spawnsAll = rows.flatMap((r) =>
    r.spawnDetail.map((s) => ({ ...s, runId: r.runId })),
  )
  P(
    `Ranked by output tokens, over all ${spawnsAll.length} in-span subagents of the 28 runs.`,
  )
  P(
    table(
      [
        "#",
        "run",
        "role",
        "stage",
        "depth",
        "model",
        "output tok",
        "input tok",
        "minutes",
        "description",
      ],
      [...spawnsAll]
        .sort((a, b) => b.tokens.output - a.tokens.output)
        .slice(0, 10)
        .map((s, i) => [
          i + 1,
          s.runId.split("@")[0],
          s.role,
          s.stage,
          s.depth ?? "?",
          s.model || "?",
          k(s.tokens.output),
          k(inTok(s.tokens)),
          m(s.durationMs),
          (s.description || "").slice(0, 60),
        ]),
    ),
  )
  P("Same list ranked by wall duration instead:")
  P(
    table(
      ["#", "run", "role", "stage", "minutes", "output tok", "description"],
      [...spawnsAll]
        .sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0))
        .slice(0, 10)
        .map((s, i) => [
          i + 1,
          s.runId.split("@")[0],
          s.role,
          s.stage,
          m(s.durationMs),
          k(s.tokens.output),
          (s.description || "").slice(0, 60),
        ]),
    ),
  )

  // ------------------------------------------------------------------ (g)
  P("## (g) Quality-gate commands")
  const gTot = rows.reduce(
    (a, r) => ({
      runs: a.runs + r.gates.runs,
      ms: a.ms + r.gates.totalMs,
      rep: a.rep + r.gates.repeatSameCommand,
      noEdit: a.noEdit + r.gates.repeatNoInterveningEdit,
      unk: a.unk + r.gates.repeatEditUnknown,
      sRuns: a.sRuns + r.gates.strictRuns,
      sMs: a.sMs + r.gates.strictMs,
      sRep: a.sRep + r.gates.strictRepeatSameCommand,
      sNoEdit: a.sNoEdit + r.gates.strictRepeatNoInterveningEdit,
      sUnk: a.sUnk + r.gates.strictRepeatEditUnknown,
    }),
    {
      runs: 0,
      ms: 0,
      rep: 0,
      noEdit: 0,
      unk: 0,
      sRuns: 0,
      sMs: 0,
      sRep: 0,
      sNoEdit: 0,
      sUnk: 0,
    },
  )
  P(
    [
      "Gate = a Bash run classified as test / lint / typecheck / build, on the main thread or inside any subagent (digest `commandRuns`).",
      "",
      'Two counts are given. **digest** is the digester\'s own classification of the full command. **strict** re-classifies the stored 200-character prefix with quoted strings removed first, which drops false positives like `pgrep -lf "(vitest|eslint)"` (the digester splits on `|` and reads `eslint)"` as a lint run). Strict is the number to quote; the gap between the two is the digester\'s false-positive rate on this corpus.',
      "",
      `Across 28 runs: **${gTot.sRuns} strict gate runs** (digest count ${gTot.runs}; ${pc(gTot.runs - gTot.sRuns, gTot.runs)} of the digest's gate rows are false positives), **${h(gTot.sMs)} h** of measured command time (digest ${h(gTot.ms)} h), ${pc(gTot.sMs, allActive)} of all active time.`,
      "",
      `Of the ${gTot.sRep} strict gate runs that repeated a command already run in the same thread, **${gTot.sNoEdit} had no file edit in that thread in between (${pc(gTot.sNoEdit, gTot.sRep)})**; ${gTot.sUnk} could not be checked (pruned transcript). Same command = identical 200-character prefix, so two long commands sharing a prefix are counted as one.`,
    ].join("\n"),
  )
  P(
    table(
      [
        "stage",
        "gate runs (strict)",
        "gate runs (digest)",
        "gate time h (strict)",
        "% of stage active time",
      ],
      STAGES.filter((s) => tot.stages[s] && tot.stages[s].gateRuns).map((s) => {
        const d = tot.stages[s]
        return [
          s,
          d.gateRunsStrict,
          d.gateRuns,
          h(d.gateMsStrict),
          pc(d.gateMsStrict, d.modelMs + d.toolMs),
        ]
      }),
    ),
  )
  P(
    table(
      ["role running the gate", "gate runs (strict)", "gate time h (strict)"],
      ROLES.filter((x) => tot.roles[x]?.gateRunsStrict)
        .sort(
          (a, b) => tot.roles[b].gateRunsStrict - tot.roles[a].gateRunsStrict,
        )
        .map((x) => [
          x,
          tot.roles[x].gateRunsStrict,
          h(tot.roles[x].gateMsStrict),
        ]),
    ),
  )
  P(
    table(
      [
        "run",
        "gate runs (strict)",
        "gate time h",
        "% of active",
        "kinds (strict)",
        "repeats",
        "repeats with no intervening edit",
        "unknown",
      ],
      [...rows]
        .sort((a, b) => b.gates.strictMs - a.gates.strictMs)
        .map((r) => [
          r.runId,
          r.gates.strictRuns,
          h(r.gates.strictMs),
          pc(r.gates.strictMs, r.activeMs),
          Object.entries(r.gates.strictByKind)
            .map(([x, n]) => `${x} ${n}`)
            .join(", "),
          r.gates.strictRepeatSameCommand,
          r.gates.strictRepeatNoInterveningEdit,
          r.gates.strictRepeatEditUnknown,
        ]),
    ),
  )
  const topRep = {}
  for (const r of rows)
    for (const [c, n] of r.gates.strictTopRepeatedCommands)
      topRep[c] = (topRep[c] || 0) + n
  P("Most-repeated-without-an-edit strict gate commands (80-character key):")
  P(
    table(
      ["command", "times re-run with no intervening edit"],
      Object.entries(topRep)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([c, n]) => ["`" + c.replace(/\|/g, "\\|") + "`", n]),
    ),
  )

  // ------------------------------------------------------------------ index
  P("## Run index")
  P(
    table(
      [
        "run",
        "repo",
        "type",
        "route",
        "status",
        "mise ceiling",
        "code lines",
        "tasks",
        "sessions",
        "wall h",
        "active h",
        "wait h",
        "out tok",
        "spawns",
        "max depth",
        "compactions",
      ],
      rows.map((r) => [
        r.runId,
        r.repo,
        r.type,
        r.route ?? "",
        r.status,
        r.miseVersionCeiling,
        r.locCodeTotal ?? "",
        r.taskCount ?? "",
        r.sessionCount +
          (r.rawTranscriptsMissing
            ? ` (${r.rawTranscriptsMissing} pruned)`
            : ""),
        h(r.wallClockMs),
        h(r.activeMs),
        h(r.humanWaitMs),
        k(r.tokens.combinedOutput),
        r.spawnsTotal,
        r.maxSpawnDepth,
        r.compactions,
      ]),
    ),
  )

  P("Nested subagent depth across the corpus:")
  const depth = {}
  for (const r of rows)
    for (const [d, n] of Object.entries(r.depthCounts))
      depth[d] = (depth[d] || 0) + n
  P(
    table(
      ["spawn depth", "spawns"],
      Object.entries(depth)
        .sort()
        .map(([d, n]) => [d, n]),
    ),
  )

  return out.join("\n")
}
