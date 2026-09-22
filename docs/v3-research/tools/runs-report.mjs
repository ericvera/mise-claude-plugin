#!/usr/bin/env node
// runs-report.mjs — render runs/<repo>-runs.md from runs/<repo>-runs.jsonl (map-runs.mjs output).
// Usage: node runs-report.mjs [runs/okven-runs.jsonl] [runs/okven-runs.md]
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const inFile = path.resolve(process.argv[2] ?? "runs/okven-runs.jsonl")
const outFile = path.resolve(
  process.argv[3] ?? inFile.replace(/\.jsonl$/, ".md"),
)
const rows = readFileSync(inFile, "utf8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l))

const num = (v, d = 1) =>
  v == null
    ? "—"
    : typeof v === "number"
      ? Number.isInteger(v)
        ? String(v)
        : v.toFixed(d)
      : String(v)
const quantile = (xs, q) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b)
  if (!s.length) return null
  const i = (s.length - 1) * q
  const lo = Math.floor(i),
    hi = Math.ceil(i)
  return s[lo] + (s[hi] - s[lo]) * (i - lo)
}
const med = (xs) => quantile(xs, 0.5)
const p90 = (xs) => quantile(xs, 0.9)
const day = (ts) => ts.slice(0, 10)
const major = (v) => (v ? `${v.split(".")[0]}.x` : "unknown")
const table = (head, body) =>
  [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...body.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n")

const STAGES = [
  "goals",
  "mock",
  "requirements",
  "plan",
  "execute",
  "acceptance_closeout",
]
const exact = rows.filter((r) => r.timelineQuality === "checkpoint-commits")
const sampled = rows.filter((r) => r.timelineQuality === "sampled-snapshots")
const usable = [...exact, ...sampled]
const gateMax = (r) => {
  const vals = [
    ...Object.values(r.gateRoundsFriction ?? {}).map((g) => g.maxRounds),
    ...Object.values(r.gateRoundsCommitSubjects ?? {}),
  ].filter((v) => v != null)
  return vals.length ? Math.max(...vals) : null
}
const gateDetail = (r) => {
  const parts = Object.entries(r.gateRoundsFriction ?? {})
    .filter(([, g]) => g.maxRounds != null)
    .map(([k, g]) => `${k[0]}${g.maxRounds}${g.stalled ? "!" : ""}`)
  return parts.length ? parts.join(" ") : "—"
}
const fixes = (r) =>
  r.fixLoops.frictionReviewFindings ?? r.fixLoops.progressFixSections ?? null
const transcriptSpan = (r) => {
  const d = r.transcriptDirs.filter(
    (t) => t.match === "worktree-slug-exact" && t.mtimeFirst,
  )
  if (!d.length) return null
  const a = Math.min(...d.map((t) => Date.parse(t.mtimeFirst)))
  const b = Math.max(...d.map((t) => Date.parse(t.mtimeLast)))
  return (b - a) / 36e5
}

const out = []
out.push("# mise runs in Okven, from git alone")
out.push("")
out.push(
  `${rows.length} runs, ${day(rows[0].firstCommitTs)} to ${day(rows[rows.length - 1].lastCommitTs)}. Built by \`tools/map-runs.mjs\`; every field is in \`okven-runs.jsonl\`.`,
)
out.push("")
out.push(
  "**Elapsed time here is the span between commit timestamps, not time worked.** Git records when a commit was written, never how long anyone was at the keyboard, so a run that spans three days may hold two hours of work. Active time is not recoverable from git; the transcript directories named in the JSONL are the only place it could be measured.",
)
out.push("")
out.push(
  `Timeline quality per run: **checkpoint-commits** ${exact.length} (mise wrote a commit per stage approval and per task — stage boundaries are exact), **sampled-snapshots** ${sampled.length} (branch deleted; boundaries come from Delta Review sync commits, so each stage end is an upper bound and the run span a lower bound), **single-sync-snapshot** ${rows.length - usable.length} (the whole \`.mise\` directory reached git in one sync — its timestamps say nothing about duration). Only the first two appear in the timing tables below.`,
)
out.push("")

// ---------- 1. run table ----------
out.push("## Runs, by date")
out.push("")
out.push(
  table(
    [
      "start",
      "end",
      "branch",
      "type",
      "route",
      "mise",
      "status",
      "timeline",
      "elapsed h",
      "LOC",
      "code LOC",
      "tasks",
      "req ln",
      "plan ln",
      "gate rounds",
      "fix loops",
    ],
    rows.map((r) => [
      day(r.firstCommitTs),
      day(r.lastCommitTs),
      r.branch ?? "_(unknown)_",
      r.type,
      r.route ?? "—",
      r.miseVersion ?? "—",
      r.status,
      r.timelineQuality === "checkpoint-commits"
        ? "exact"
        : r.timelineQuality === "sampled-snapshots"
          ? "sampled"
          : "one-sync",
      usable.includes(r) ? num(r.elapsedHoursAuthorTime) : "—",
      r.loc.total == null ? "—" : String(r.loc.total),
      r.loc.codeTotal == null ? "—" : String(r.loc.codeTotal),
      String(r.taskCount),
      num(r.artifactLines.requirements),
      num(r.artifactLines.planOverview),
      gateDetail(r),
      fixes(r) == null ? "—" : String(fixes(r)),
    ]),
  ),
)
out.push("")
out.push(
  "`gate rounds`: max critic rounds per gate from `.mise/_friction.md` (g=goals, m=mock, r=requirements, p=plan; `!` = the gate stalled or hit its ceiling). `fix loops`: review findings that sent a finished task back, from `_friction.md`, else `fix` sections in `_progress.md`. `—` in `elapsed h` means the run has no usable timeline.",
)
out.push("")

// ---------- 2. stage wall clock ----------
out.push("## Stage wall clock (median / p90 hours)")
out.push("")
const cell = (set, stage) => {
  const xs = set.map((r) => r.stageHours[stage]).filter((v) => v != null)
  return xs.length ? `${num(med(xs))} / ${num(p90(xs))} ·${xs.length}` : "—"
}
const groupRow = (label, set) => [
  label,
  String(set.length),
  ...STAGES.map((s) => cell(set, s)),
  num(med(set.map((r) => r.elapsedHoursAuthorTime))),
]
const byType = [
  groupRow(
    "feature",
    usable.filter((r) => r.type === "feature"),
  ),
  groupRow(
    "bugfix",
    usable.filter((r) => r.type === "bugfix"),
  ),
  groupRow("all", usable),
]
out.push(table(["run type", "runs", ...STAGES, "whole run (median)"], byType))
out.push("")
const versions = [...new Set(usable.map((r) => major(r.miseVersion)))].sort()
out.push(
  table(
    ["mise major", "runs", ...STAGES, "whole run (median)"],
    versions.map((v) =>
      groupRow(
        v,
        usable.filter((r) => major(r.miseVersion) === v),
      ),
    ),
  ),
)
out.push("")
out.push(
  "Each stage cell is `median / p90 ·runs-with-that-stage-recorded`; the `runs` column counts runs in the group. `mock` medians of 0 are real: goals and mock are approved in the same commit at one human gate.",
)
out.push("")
out.push(
  `Stage hours are measured from the previous stage's approval to this stage's last approval in \`.mise/.workflow-state\` history; \`execute\` runs to the last task moved to \`done/\`; \`acceptance_closeout\` runs from there to the commit that deletes the mise directory (only ${rows.filter((r) => r.endedWithCleanup).length} runs got that far in a surviving history). A stage re-opened by a later edit is counted up to its last approval, so cascades land in the stage that caused them.`,
)
out.push("")

// ---------- 3. size against elapsed ----------
out.push("## Run size against elapsed time")
out.push("")
const buckets = [
  ["0–60", (l) => l <= 60],
  ["61–500", (l) => l > 60 && l <= 500],
  ["501–2 000", (l) => l > 500 && l <= 2000],
  ["2 001–10 000", (l) => l > 2000 && l <= 10000],
  ["> 10 000", (l) => l > 10000],
]
out.push(
  table(
    [
      "non-.mise LOC",
      "runs",
      "with usable timeline",
      "median elapsed h",
      "p90 elapsed h",
      "median tasks",
      "median plan ln",
    ],
    buckets.map(([label, f]) => {
      const all = rows.filter((r) => r.loc.total != null && f(r.loc.total))
      const t = all.filter((r) => usable.includes(r))
      return [
        label,
        String(all.length),
        String(t.length),
        t.length ? num(med(t.map((r) => r.elapsedHoursAuthorTime))) : "—",
        t.length ? num(p90(t.map((r) => r.elapsedHoursAuthorTime))) : "—",
        all.length ? num(med(all.map((r) => r.taskCount))) : "—",
        all.length
          ? num(med(all.map((r) => r.artifactLines.planOverview)))
          : "—",
      ]
    }),
  ),
)
out.push("")
out.push(
  table(
    ["run", "LOC", "elapsed h", "h per 100 LOC", "tasks", "timeline"],
    usable
      .slice()
      .sort((a, b) => (a.loc.total ?? 0) - (b.loc.total ?? 0))
      .map((r) => [
        r.branch ?? "_(unknown)_",
        r.loc.total == null ? "—" : String(r.loc.total),
        num(r.elapsedHoursAuthorTime),
        r.loc.total ? num((r.elapsedHoursAuthorTime / r.loc.total) * 100) : "—",
        String(r.taskCount),
        r.timelineQuality === "checkpoint-commits" ? "exact" : "sampled",
      ]),
  ),
)
out.push("")
out.push(
  `${rows.filter((r) => r.loc.total == null).length} runs have no recoverable size (branch ref deleted and no main commit matches their file set): ${rows
    .filter((r) => r.loc.total == null)
    .map((r) => r.branch ?? "(unknown)")
    .join(", ")}.`,
)
out.push("")

// ---------- 4. small runs ----------
out.push("## SMALL RUNS — 60 or fewer non-.mise LOC")
out.push("")
const small = rows
  .filter((r) => r.loc.total != null && r.loc.total <= 60)
  .sort((a, b) => a.firstCommitTs.localeCompare(b.firstCommitTs))
out.push(
  table(
    [
      "run",
      "date",
      "LOC",
      "files",
      "tasks",
      "mise",
      "timeline",
      ...STAGES,
      "total h",
      "transcript span h",
    ],
    small.map((r) => [
      r.branch ?? "_(unknown)_",
      day(r.firstCommitTs),
      String(r.loc.total),
      String(r.loc.filesChanged ?? 0),
      String(r.taskCount),
      r.miseVersion ?? "—",
      r.timelineQuality === "checkpoint-commits"
        ? "exact"
        : r.timelineQuality === "sampled-snapshots"
          ? "sampled"
          : "one-sync",
      ...STAGES.map((s) => (usable.includes(r) ? num(r.stageHours[s]) : "—")),
      usable.includes(r) ? num(r.elapsedHoursAuthorTime) : "—",
      transcriptSpan(r) == null ? "—" : num(transcriptSpan(r)),
    ]),
  ),
)
out.push("")
const artTotal = (r) =>
  [
    "goals",
    "requirements",
    "planOverview",
    "planTaskLines",
    "progress",
    "friction",
  ].reduce((n, k) => n + (r.artifactLines[k] ?? 0), 0)
out.push(
  table(
    [
      "run",
      "goal",
      "artifacts written for it (lines)",
      "artifact lines ÷ LOC",
      "gate rounds",
      "landed as",
    ],
    small.map((r) => [
      r.branch ?? "_(unknown)_",
      (r.goalTitle ?? "—").replace(/\|/g, "/").slice(0, 60),
      `goals ${num(r.artifactLines.goals)} · req ${num(r.artifactLines.requirements)} · plan ${num(r.artifactLines.planOverview)} · tasks ${num(r.artifactLines.planTaskLines)} · progress ${num(r.artifactLines.progress)}`,
      r.loc.total ? `${num(artTotal(r) / r.loc.total)}×` : "—",
      gateDetail(r),
      r.mergeCommit?.accepted
        ? `${r.mergeCommit.sha.slice(0, 9)} ${r.mergeCommit.subject.replace(/\|/g, "/").slice(0, 44)}`
        : r.status,
    ]),
  ),
)
out.push("")
out.push(
  "`transcript span h` is the mtime range of the Claude Code session files in the matching worktree project directory — a filesystem signal, not git, and it covers every session in that worktree, so it is an upper bound on one run. It is the only wall-clock evidence available for a run whose mise directory reached git in a single sync.",
)
out.push("")

writeFileSync(outFile, out.join("\n"))
process.stderr.write(`wrote ${outFile}\n`)
