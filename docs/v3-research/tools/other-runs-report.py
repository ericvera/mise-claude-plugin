#!/usr/bin/env python3
"""Render runs/other-runs.md (tables only) from the ten non-Okven <repo>-runs.jsonl files.

  other-runs-report.py <runs-dir> > other-runs.md

Joins, per run:
  transcript-index.jsonl  sessions whose branch matches and whose window overlaps the run
  delta-notes.jsonl       Delta Review notes on that branch
  friction.jsonl          items harvested from that run's .mise log files
"""

import json
import os
import statistics
import sys
from collections import Counter, defaultdict
from datetime import datetime

REPOS = [
    "delta-review",
    "metaforico",
    "aydy",
    "knownhumans",
    "firebase-kit",
    "ericvera.dev",
    "unocss-preset-strict-design",
    "scdate",
    "originhypnosis",
    "mise-claude-plugin",
]
STAGES = ["goals", "mock", "requirements", "plan", "execute", "acceptance_closeout"]
USABLE = {"checkpoint-commits", "sampled-snapshots"}


def ts(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None


def table(rows, headers):
    out = ["| " + " | ".join(headers) + " |", "| " + " | ".join("---" for _ in headers) + " |"]
    for r in rows:
        out.append("| " + " | ".join("—" if c is None else str(c) for c in r) + " |")
    return "\n".join(out)


def med(vals):
    vals = [v for v in vals if v is not None]
    return round(statistics.median(vals), 2) if vals else None


def main():
    d = sys.argv[1]
    runs = []
    for repo in REPOS:
        p = os.path.join(d, f"{repo}-runs.jsonl")
        for line in open(p):
            r = json.loads(line)
            r["_repo"] = repo
            runs.append(r)

    # map-runs folds a Delta-Review-ref run into its branch run when they share a goals.md blob;
    # where the blob differs the review copy survives as a second row. Drop a review-only run
    # whose window sits inside a branch run of the same name.
    dropped = []
    keep = []
    for r in runs:
        r["_label"] = r["branch"] or r["runId"].split("@")[0] + "*"
        keep.append(r)
    def same_artifacts(a, b):
        """Two rows describe the same run when two or more artifacts match line for line."""
        aa, bb = a.get("artifactLines") or {}, b.get("artifactLines") or {}
        return sum(1 for k, v in aa.items() if v is not None and bb.get(k) == v) >= 2

    for r in list(keep):
        if not all(x.startswith("refs/review/") for x in r["refs"]):
            continue
        twin = [
            o
            for o in keep
            if o is not r
            and o["_label"] == r["_label"]
            and o["_repo"] == r["_repo"]
            and not all(x.startswith("refs/review/") for x in o["refs"])
            and same_artifacts(o, r)
        ]
        if twin:
            # the review snapshot is the same run; keep its evidence on the survivor
            keeper = twin[0]
            ka = keeper.setdefault("artifactLines", {}) or {}
            for k, v in (r.get("artifactLines") or {}).items():
                if v is not None and (ka.get(k) is None or v > ka.get(k)):
                    ka[k] = v
            keeper["artifactLines"] = ka
            kd = keeper.setdefault("deltaReview", {}) or {}
            kd["refs"] = sorted(set((kd.get("refs") or []) + ((r.get("deltaReview") or {}).get("refs") or []) + r["refs"]))
            keeper["deltaReview"] = kd
            dropped.append(r)
    runs = [r for r in keep if r not in dropped]

    tx = [json.loads(l) for l in open(os.path.join(d, "transcript-index.jsonl"))]
    notes = [json.loads(l) for l in open(os.path.join(d, "delta-notes.jsonl"))]
    fr = [json.loads(l) for l in open(os.path.join(d, "friction.jsonl"))]

    notes_by = Counter((n["repo"], n["branch"]) for n in notes)
    fr_by = defaultdict(Counter)
    for f in fr:
        fr_by[(f["repo"], f["run"])][f["sourceKind"]] += 1

    # transcripts: a session is attributed to a run only when it names the run's branch AND its
    # window overlaps the run. Sessions that overlap the window in the same repo without naming
    # the branch (detached worktrees record `HEAD`) are counted separately, never attributed.
    def sessions_for(r):
        named, overlapping = [], []
        for t in tx:
            cw = " ".join(t.get("cwds") or []) + " " + t.get("projectDir", "")
            if r["_repo"].replace(".", "-") not in cw.replace(".", "-"):
                continue
            a, b = ts(t["start"]), ts(t["end"])
            ra, rb = ts(r["firstCommitTs"]), ts(r["lastCommitTs"])
            if not (a and b and ra and rb and a <= rb and b >= ra):
                continue
            overlapping.append(t)
            if r["branch"] and r["branch"] in (t.get("branches") or []):
                named.append(t)
        return named, overlapping

    for r in runs:
        r["_sessions"], r["_sessionsOverlap"] = sessions_for(r)
        r["_notes"] = notes_by.get((r["_repo"], r["branch"]), 0)
        r["_fr"] = fr_by.get((r["_repo"], r["branch"]), Counter())

    P = []
    P.append("# mise runs outside Okven, from git alone\n")
    P.append(
        f"{len(runs)} runs across {len(REPOS)} repos, "
        f"{min(r['firstCommitTs'][:10] for r in runs)} to {max(r['lastCommitTs'][:10] for r in runs)}. "
        "Built by `tools/map-runs.mjs` (one `<repo>-runs.jsonl` per repo, same schema as "
        "`okven-runs.jsonl`); rendered by `tools/other-runs-report.py`. "
        "Two `map-runs.mjs` fixes were needed to generalize it off Okven: the friction parser now "
        "strips a leading `- ` bullet and tolerates a `critic plan (v2):` suffix — without them the "
        "gate-round columns read empty for every repo that writes its friction log as a bullet list. "
        f"{len(dropped)} further rows were dropped here as duplicates: a Delta-Review-ref-only run "
        "whose branch run carries the same artifact line counts is the same run seen twice "
        "(" + ", ".join(f"{x['_repo']} {x['_label']}" for x in dropped) + "); their artifact "
        "evidence is merged into the surviving row.\n"
    )
    P.append(
        "**Elapsed is the span between commit timestamps, not time worked.** A run whose `.mise` "
        "directory reached git in one Delta Review sync has no usable timeline at all.\n"
    )

    # ---- per repo summary ----
    P.append("## Per repo\n")
    rows = []
    for repo in REPOS:
        rs = [r for r in runs if r["_repo"] == repo]
        us = [r for r in rs if r["timelineQuality"] in USABLE]
        rows.append(
            [
                repo,
                len(rs),
                f"{min(r['firstCommitTs'][:10] for r in rs)} → {max(r['lastCommitTs'][:10] for r in rs)}",
                ", ".join(f"{k} {v}" for k, v in Counter(r["type"] for r in rs).most_common()),
                ", ".join(f"{k} {v}" for k, v in Counter(r.get("route") or "—" for r in rs).most_common()),
                ", ".join(sorted({r["miseVersion"] for r in rs if r.get("miseVersion")})),
                f"{len(us)}/{len(rs)}",
                med([r["elapsedHoursAuthorTime"] for r in us]),
                med([(r["loc"] or {}).get("codeTotal") for r in rs]),
                ", ".join(f"{k} {v}" for k, v in Counter(r["status"] for r in rs).most_common()),
            ]
        )
    P.append(
        table(
            rows,
            ["repo", "runs", "date range", "run types", "routes", "mise version ceilings", "usable timelines", "median elapsed h (usable)", "median code LOC", "status"],
        )
    )

    # ---- every run ----
    P.append("\n## Every run\n")
    rows = []
    for r in sorted(runs, key=lambda r: r["firstCommitTs"]):
        g = r.get("gateRoundsFriction") or {}
        gr = " ".join(
            f"{k[0]}{v.get('maxRounds') or '?'}{'!' if v.get('stalled') else ''}" for k, v in sorted(g.items())
        )
        if not gr:
            gr = " ".join(f"{k[0]}{v}" for k, v in sorted((r.get("gateRoundsCommitSubjects") or {}).items()))
        a = r.get("artifactLines") or {}
        rows.append(
            [
                r["_repo"],
                r["firstCommitTs"][:10],
                r["lastCommitTs"][:10],
                r["_label"],
                r["type"],
                r.get("route") or "—",
                r.get("miseVersion"),
                r["status"],
                {"checkpoint-commits": "exact", "sampled-snapshots": "sampled", "single-sync-snapshot": "one-sync"}.get(
                    r["timelineQuality"], r["timelineQuality"]
                ),
                r["elapsedHoursAuthorTime"] if r["timelineQuality"] in USABLE else None,
                (r["loc"] or {}).get("codeTotal"),
                r.get("taskCount"),
                a.get("requirements"),
                (a.get("planOverview") or 0) + (a.get("planTaskLines") or 0) or None,
                gr or None,
                sum((r.get("fixLoops") or {}).get(k, 0) or 0 for k in ("frictionReviewFindings", "progressFixSections")) or 0,
            ]
        )
    P.append(
        table(
            rows,
            ["repo", "start", "end", "branch", "type", "route", "mise", "status", "timeline", "elapsed h", "code LOC", "tasks", "req ln", "plan ln", "gate rounds", "fix loops"],
        )
    )
    P.append(
        "\n`gate rounds`: max critic rounds per gate (g=goals, m=mock, r=requirements, p=plan; "
        "`!` = stalled), from `.mise/_friction.md`, else from commit subjects. `elapsed h` is blank "
        "where the timeline is not usable.\n"
    )

    # ---- stage medians ----
    P.append("\n## Median wall clock per stage (usable timelines only)\n")
    us = [r for r in runs if r["timelineQuality"] in USABLE]
    P.append(
        f"{len(us)} of {len(runs)} runs have a usable timeline "
        f"({Counter(r['timelineQuality'] for r in us)}); the other "
        f"{len(runs) - len(us)} reached git in a single Delta Review sync.\n"
    )
    rows = []
    for s in STAGES:
        vals = [(r.get("stageHours") or {}).get(s) for r in us]
        vals = [v for v in vals if v is not None]
        rows.append([s, len(vals), med(vals), round(max(vals), 2) if vals else None])
    rows.append(
        [
            "whole run",
            len(us),
            med([r["elapsedHoursAuthorTime"] for r in us]),
            round(max([r["elapsedHoursAuthorTime"] for r in us] or [0]), 2),
        ]
    )
    P.append(table(rows, ["stage", "runs with a figure", "median h", "max h"]))
    P.append("")
    P.append("Per repo, same runs:\n")
    rows = []
    for repo in REPOS:
        rs = [r for r in us if r["_repo"] == repo]
        if not rs:
            continue
        rows.append(
            [repo, len(rs)] + [med([(r.get("stageHours") or {}).get(s) for r in rs]) for s in STAGES] + [med([r["elapsedHoursAuthorTime"] for r in rs])]
        )
    P.append(table(rows, ["repo", "runs"] + STAGES + ["whole run"]))

    # ---- size distribution ----
    P.append("\n## Run size distribution\n")
    buckets = [(0, 60, "≤60"), (61, 300, "61–300"), (301, 1000, "301–1k"), (1001, 5000, "1k–5k"), (5001, 10**9, ">5k")]
    rows = []
    for lo, hi, name in buckets:
        rs = [r for r in runs if (r["loc"] or {}).get("codeTotal") is not None and lo <= r["loc"]["codeTotal"] <= hi]
        usable = [r for r in rs if r["timelineQuality"] in USABLE]
        rows.append(
            [
                name,
                len(rs),
                med([r["loc"]["codeTotal"] for r in rs]),
                med([r.get("taskCount") for r in rs]),
                len(usable),
                med([r["elapsedHoursAuthorTime"] for r in usable]),
                med([sum(v for k, v in (r.get("artifactLines") or {}).items() if isinstance(v, int)) for r in rs]),
            ]
        )
    unknown = [r for r in runs if (r["loc"] or {}).get("codeTotal") is None]
    rows.append(["LOC unrecoverable", len(unknown), None, med([r.get("taskCount") for r in unknown]), 0, None, None])
    P.append(table(rows, ["code LOC", "runs", "median LOC", "median tasks", "usable timelines", "median elapsed h", "median artifact lines"]))

    # ---- small runs ----
    P.append("\n## Small runs (≤60 code LOC)\n")
    small = [r for r in runs if (r["loc"] or {}).get("codeTotal") is not None and r["loc"]["codeTotal"] <= 60]
    rows = []
    for r in sorted(small, key=lambda r: r["firstCommitTs"]):
        a = r.get("artifactLines") or {}
        alines = sum(v for v in a.values() if isinstance(v, int))
        loc = r["loc"]["codeTotal"]
        rows.append(
            [
                r["_repo"],
                r["_label"],
                r["firstCommitTs"][:10],
                r["type"],
                r.get("miseVersion"),
                loc,
                r.get("taskCount"),
                r["elapsedHoursAuthorTime"] if r["timelineQuality"] in USABLE else None,
                {"checkpoint-commits": "exact", "sampled-snapshots": "sampled", "single-sync-snapshot": "one-sync"}.get(r["timelineQuality"]),
                alines,
                f"{round(alines / loc)}×" if loc else None,
                (r.get("commits") or {}).get("totalInWindow"),
            ]
        )
    P.append(
        table(
            rows,
            ["repo", "branch", "start", "type", "mise", "code LOC", "tasks", "elapsed h", "timeline", "artifact lines", "artifact:code", "commits"],
        )
    )
    P.append(
        "\n`artifact lines` sums every `.mise` artifact the run left in git (goals, requirements, "
        "plan overview + task files, mocks, friction, progress, exploration). "
        f"n = {len(small)}: only one run in the ten repos is at or under 60 code LOC. The next "
        "bracket, for comparison:\n"
    )
    rows = []
    for r in sorted([x for x in runs if (x["loc"] or {}).get("codeTotal") is not None and 60 < x["loc"]["codeTotal"] <= 300], key=lambda r: r["loc"]["codeTotal"]):
        a = r.get("artifactLines") or {}
        alines = sum(v for v in a.values() if isinstance(v, int))
        loc = r["loc"]["codeTotal"]
        rows.append(
            [
                r["_repo"],
                r["_label"],
                r["firstCommitTs"][:10],
                r["type"],
                r.get("miseVersion"),
                loc,
                r.get("taskCount"),
                r["elapsedHoursAuthorTime"] if r["timelineQuality"] in USABLE else None,
                {"checkpoint-commits": "exact", "sampled-snapshots": "sampled", "single-sync-snapshot": "one-sync"}.get(r["timelineQuality"]),
                alines,
                f"{round(alines / loc)}x" if loc else None,
                (r.get("commits") or {}).get("totalInWindow"),
            ]
        )
    P.append(
        table(
            rows,
            ["repo", "branch", "start", "type", "mise", "code LOC", "tasks", "elapsed h", "timeline", "artifact lines", "artifact:code", "commits"],
        )
    )

    # ---- evidence ----
    P.append("\n## Evidence surviving per run\n")
    rows = []
    for r in sorted(runs, key=lambda r: (r["_repo"], r["firstCommitTs"])):
        a = r.get("artifactLines") or {}
        sess = r["_sessions"]
        f = r["_fr"]
        rows.append(
            [
                r["_repo"],
                r["_label"],
                "yes" if a.get("friction") else "—",
                a.get("friction") or "",
                "yes" if a.get("progress") else "—",
                f.get("retro-report", 0) or "—",
                len(sess) or "—",
                len(r["_sessionsOverlap"]) or "—",
                round(sum(s["bytes"] for s in sess) / 1e6, 1) if sess else None,
                sum(sum((s.get("subagentByMiseRole") or {}).values()) for s in sess) or "—",
                r["_notes"] or "—",
                len(((r.get("deltaReview") or {}).get("refs")) or []) or "—",
                sum(f.values()) or "—",
            ]
        )
    P.append(
        table(
            rows,
            ["repo", "branch", "_friction.md", "lines", "_progress.md", "retro proposals (transcript)", "sessions naming the branch", "sessions overlapping in repo", "MB", "mise subagents", "Delta notes", "review refs", "friction.jsonl items"],
        )
    )
    P.append(
        "\n`sessions` / `MB` / `mise subagents` come from `runs/transcript-index.jsonl` "
        "(sessions naming the branch whose window overlaps the run). `Delta notes` from "
        "`runs/delta-notes.jsonl` (see `runs/delta-notes.md`). `retro proposals` are rows in "
        "`runs/friction.jsonl` parsed out of that run's retrospective subagent transcript.\n"
    )

    # ---- coverage summary ----
    P.append("\n## Evidence coverage, all runs\n")
    ev = [
        ("`.mise/_friction.md` survives", lambda r: bool((r.get("artifactLines") or {}).get("friction"))),
        ("`.mise/implementation_plan/_progress.md` survives", lambda r: bool((r.get("artifactLines") or {}).get("progress"))),
        ("a retrospective report survives in a transcript", lambda r: r["_fr"].get("retro-report", 0) > 0),
        ("a transcript session names the branch", lambda r: len(r["_sessions"]) > 0),
        ("a transcript session overlaps the run in the same repo", lambda r: len(r["_sessionsOverlap"]) > 0),
        ("Delta Review notes survive", lambda r: r["_notes"] > 0),
        ("a Delta Review state ref survives", lambda r: len(((r.get("deltaReview") or {}).get("refs")) or []) > 0),
        ("usable timeline", lambda r: r["timelineQuality"] in USABLE),
        ("code LOC recoverable", lambda r: (r["loc"] or {}).get("codeTotal") is not None),
    ]
    P.append(
        table(
            [[name, sum(1 for r in runs if pred(r)), f"{round(100 * sum(1 for r in runs if pred(r)) / len(runs))}%"] for name, pred in ev],
            ["evidence", "runs", "share of all runs"],
        )
    )

    print("\n".join(P))


if __name__ == "__main__":
    main()
