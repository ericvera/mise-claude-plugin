#!/usr/bin/env python3
"""Render runs/friction.md (tables only) from runs/friction.jsonl.

  friction-report.py <friction.jsonl> > friction.md

Repetition clustering: friction items are written fresh each run, so "the same item" is never
byte-identical. Items are clustered by rare-token Jaccard (>= 0.45 against a cluster's first
member); each cluster reports its largest verbatim member and the distinct runs it spans.
"""

import json
import re
import statistics
import sys
from collections import Counter, defaultdict

# Hand-checked, 2026-09-20: each numbered proposal in okven's `.mise/_upstream-feedback.md`
# (blob 3e42c2c, written 2026-08-02 under mise 1.6.0) against the mise repo's history and its
# text at 2.1.0. Automated needle/token matching cannot judge these: the file argues for a
# mechanism in prose and never states the text to add.
UPSTREAM = [
    ("1. Stall rule measures the wrong thing (carried-over vs new)", "adopted",
     "1.7.0 `4e828af` \"Replace count-based critic-gate stall rule with convergence tracking\"; today `references/interaction.md:43-53` (recurring/fresh against all prior rounds, recurrence events, three triggers, \"Counts never decide\")"),
    ("2. Strict blocking definition, with two worked examples", "partly adopted",
     "the strict definition is in `roles/critic.md:20` (`57655da`, 2.0.0) as \"a downstream stage would build the wrong behavior\" plus \"ignore cosmetic nits\"; the two worked examples it asked for were never added"),
    ("3. A `needs-decision` tag for decisions with no default", "not adopted",
     "`git log --all -S\"needs-decision\" -- skills/` is empty; `roles/critic.md:20` still tags blocking | minor | informative"),
    ("4. Codebase grounding in round 1", "partly adopted",
     "`roles/critic.md:13` (`57655da`, 2.0.0) makes unverified file references a plan-critic check; the requirements critic (`roles/critic.md:7`) is still artifact-vs-goals only"),
    ("5. Pre-dispatch self-consistency pass over the artifact", "not adopted",
     "`git log --all -S\"consistency pass\" -- skills/` is empty; no such step exists in `references/interaction.md`"),
    ("5b. Corrections tracked as prose + acceptance-criterion pairs", "not adopted",
     "no rule about an override's two landing places anywhere in `skills/`"),
    ("6. One round = N critics with distinct lenses, in parallel", "not adopted",
     "`git log --all -S\"lens\" -- skills/` is empty; `references/interaction.md:31` still dispatches one critic per round"),
    ("7. A touchpoint map and a findings ledger carried between rounds", "partly adopted",
     "no artifact exists (`-S\"ledger\"`, `-S\"touchpoint\"` both empty), but `references/interaction.md:43` makes the orchestrator classify each blocker against *all* prior rounds, which is the ledger's purpose held in context"),
    ("8. Critics must propose replacement text", "not adopted",
     "`roles/critic.md:20` asks for a tagged defect list only; `-S\"replacement text\"` is empty"),
]

CATS = [
    "slow",
    "redundant-work",
    "unclear-instruction",
    "wrong-instruction",
    "tool-or-env",
    "false-positive-gate",
    "missed-defect",
    "context-overload",
    "other",
]

STOP = set(
    """the a an and or of to in for on with that this it is are was were be been as at by from not no
    but if then than so such into over under only also any each every their its your our we you i
    when where which who what how why all both few more most other some own same can will just should
    now one two three task tasks file files line lines text add adds added change changed rule rules
    review found deviations plan none critic round rounds blocking mise""".split()
)


def toks(text):
    return {t for t in re.findall(r"[a-z][a-z0-9_.\-/]{4,}", text.lower()) if t not in STOP}


def table(rows, headers):
    out = ["| " + " | ".join(headers) + " |", "| " + " | ".join("---" for _ in headers) + " |"]
    for r in rows:
        out.append("| " + " | ".join("" if c is None else str(c) for c in r) + " |")
    return "\n".join(out)


def esc(s):
    return s.replace("|", "\\|").replace("\n", " ")


def main():
    rows = [json.loads(l) for l in open(sys.argv[1])]
    real = [r for r in rows if not r.get("reportsNothing")]
    v2 = [r for r in real if (r.get("miseVersionCeiling") or "").startswith("2.")]
    v1 = [r for r in real if (r.get("miseVersionCeiling") or "").startswith("1.")]
    friction_like = [r for r in real if r["type"] in ("friction", "stall", "gate-round-record")]

    P = []
    P.append("# mise self-reported friction and retrospective output\n")
    P.append(
        f"Source: `runs/friction.jsonl` ({len(rows)} rows; {len(rows)-len(real)} are "
        "`Deviations from plan: none` with no item and are excluded from every table below). "
        "Built by `tools/harvest-mise-artifacts.py` (lines/subjects) + `tools/extract-retro-reports.mjs` "
        "+ `tools/build-friction.py`; rendered by `tools/friction-report.py`.\n"
    )

    # ---- every .mise file that ever existed ----
    inv = []
    try:
        inv = [json.loads(l) for l in open(sys.argv[1].replace("friction.jsonl", "mise-artifacts.jsonl"))]
    except OSError:
        pass
    if inv:
        P.append("## Every file ever added under `.mise/`, all refs, all 11 repos\n")
        P.append(
            f"{len(inv)} (path, run-chain) rows in `runs/mise-artifacts.jsonl`, each carrying the "
            "last version that survives before the run deleted the directory "
            "(`tools/harvest-mise-artifacts.py lastversions`). Every repo uses `.mise` as its mise "
            "directory. **No reviewer, critic or acceptance report is ever written to a file** — "
            "those roles report to the orchestrator (`roles/critic.md:20`, `roles/reviewer.md`, "
            "`roles/acceptance.md`), so their findings survive only as `_friction.md` lines, "
            "`_progress.md` sections, commit subjects, or transcripts.\n"
        )
        kinds = Counter(r["kind"] for r in inv)
        P.append(
            table(
                [
                    [
                        k,
                        n,
                        len({r["repo"] for r in inv if r["kind"] == k}),
                        len({(r["repo"], r["branch"]) for r in inv if r["kind"] == k}),
                        statistics.median([r["lastLines"] for r in inv if r["kind"] == k]),
                        max(r["lastLines"] for r in inv if r["kind"] == k),
                    ]
                    for k, n in kinds.most_common()
                ],
                ["kind", "(path, run) rows", "repos", "runs/branches", "median lines in last version", "max"],
            )
        )
        P.append("")
        named = Counter(r["path"].rsplit("/", 1)[-1] for r in inv if r["kind"] not in ("task-file", "other"))
        P.append(
            table(
                [[f"`{b}`", n, ", ".join(sorted({r["repo"] for r in inv if r["path"].endswith("/" + b)}))[:80]] for b, n in named.most_common(14)],
                ["file", "rows", "repos"],
            )
        )
        P.append("")

    # ---- corpus ----
    P.append("## Corpus\n")
    src = Counter(r["sourceKind"] for r in real)
    P.append(
        table(
            [[k, v, sorted({r["repo"] for r in real if r["sourceKind"] == k}).__len__(), len({(r["repo"], r["run"]) for r in real if r["sourceKind"] == k})] for k, v in src.most_common()],
            ["source", "items", "repos", "runs"],
        )
    )
    P.append("")
    P.append(
        table(
            [[k, v] for k, v in Counter(r["type"] for r in real).most_common()],
            ["type", "items"],
        )
    )
    P.append("")
    P.append(
        table(
            [
                [
                    repo,
                    sum(1 for r in real if r["repo"] == repo),
                    sum(1 for r in real if r["repo"] == repo and r["sourceKind"] == "friction-log"),
                    sum(1 for r in real if r["repo"] == repo and r["type"] == "retro-proposal"),
                    len({r["run"] for r in real if r["repo"] == repo}),
                ]
                for repo, _ in Counter(r["repo"] for r in real).most_common()
            ],
            ["repo", "items", "from _friction.md", "retro proposals", "runs/branches"],
        )
    )

    # ---- by category ----
    P.append("\n## Items by category\n")
    P.append(
        table(
            [
                [
                    c,
                    sum(1 for r in real if r["category"] == c),
                    sum(1 for r in v2 if r["category"] == c),
                    sum(1 for r in v1 if r["category"] == c),
                    sum(1 for r in friction_like if r["category"] == c),
                ]
                for c in CATS
            ],
            ["category", "all items", "mise 2.x", "mise 1.x", "_friction.md only"],
        )
    )
    P.append("")
    P.append(f"n: all {len(real)}, 2.x {len(v2)}, 1.x {len(v1)}, `_friction.md` {len(friction_like)}.\n")

    # ---- by mechanism ----
    P.append("## Items by implicated mechanism\n")
    mech = Counter(r["implicatedMechanism"] for r in real)
    P.append(
        table(
            [
                [
                    m,
                    n,
                    sum(1 for r in v2 if r["implicatedMechanism"] == m),
                    sum(1 for r in v1 if r["implicatedMechanism"] == m),
                    len({(r["repo"], r["run"]) for r in real if r["implicatedMechanism"] == m}),
                    Counter(r["category"] for r in real if r["implicatedMechanism"] == m).most_common(1)[0][0],
                ]
                for m, n in mech.most_common()
            ],
            ["mechanism (as the text names it)", "items", "2.x", "1.x", "runs", "top category"],
        )
    )

    # ---- mechanism x category, friction log only ----
    P.append("\n## Mechanism × category, `_friction.md` items only\n")
    mech_f = Counter(r["implicatedMechanism"] for r in friction_like)
    hdr = ["mechanism"] + CATS
    body = []
    for m, _n in mech_f.most_common(14):
        sub = [r for r in friction_like if r["implicatedMechanism"] == m]
        body.append([m] + [sum(1 for r in sub if r["category"] == c) or "" for c in CATS])
    P.append(table(body, hdr))

    # ---- gate rounds ----
    P.append("\n## Gate rounds per gate per run, where recorded\n")
    per = defaultdict(lambda: {"rounds": None, "stall": False, "trigger": set(), "blocking": None, "src": set()})
    for r in real:
        g = r.get("gate")
        if not g:
            continue
        k = (r["repo"], r["run"], g)
        e = per[k]
        if r.get("rounds") is not None:
            e["rounds"] = max(e["rounds"] or 0, r["rounds"])
        if r["type"] == "stall" or r.get("stallTrigger"):
            e["stall"] = True
            if r.get("stallTrigger"):
                e["trigger"].add(r["stallTrigger"])
        if r.get("blockingPerRound"):
            e["blocking"] = r["blockingPerRound"]
        e["src"].add(r["sourceKind"])
    recorded = {k: v for k, v in per.items() if v["rounds"] is not None}
    P.append(
        f"{len(per)} (run, gate) pairs carry a record; {len(recorded)} of them name a round count. "
        f"Budget is 5 rounds per artifact version with a ceiling of 8 across resets "
        "(`skills/next/references/interaction.md:54`, 2.x; 1.4.0–1.7.0 wrote it as a 5-round backstop).\n"
    )
    dist = Counter(v["rounds"] for v in recorded.values())
    P.append(
        table(
            [[n, dist[n], round(100 * dist[n] / max(1, len(recorded))), sum(1 for v in recorded.values() if v["rounds"] == n and v["stall"])] for n in sorted(dist)],
            ["rounds", "(run, gate) pairs", "%", "of which stalled"],
        )
    )
    P.append("")
    bygate = defaultdict(list)
    for (repo, run, g), v in per.items():
        bygate[g].append(v)
    P.append(
        table(
            [
                [
                    g,
                    len(vs),
                    sum(1 for v in vs if v["rounds"] is not None),
                    statistics.median([v["rounds"] for v in vs if v["rounds"] is not None])
                    if any(v["rounds"] is not None for v in vs)
                    else None,
                    max([v["rounds"] for v in vs if v["rounds"] is not None] or [None]) if any(v["rounds"] is not None for v in vs) else None,
                    sum(1 for v in vs if v["stall"]),
                    sum(1 for v in vs if (v["rounds"] or 0) >= 5),
                    sum(1 for v in vs if (v["rounds"] or 0) >= 8),
                ]
                for g, vs in sorted(bygate.items(), key=lambda kv: -len(kv[1]))
            ],
            ["gate", "(run, gate) pairs", "with a round count", "median rounds", "max", "stalled", "rounds ≥5 (budget)", "rounds ≥8 (ceiling)"],
        )
    )
    P.append("")
    trig = Counter(t for v in per.values() for t in v["trigger"])
    P.append(table([[t or "(unnamed)", n] for t, n in trig.most_common()], ["stall trigger named", "records"]))
    P.append("")
    P.append("Every (run, gate) pair with a recorded round count:\n")
    P.append(
        table(
            [
                [
                    repo,
                    run,
                    g,
                    v["rounds"],
                    ",".join(str(x) for x in v["blocking"]) if v["blocking"] else "",
                    "yes" if v["stall"] else "",
                    ";".join(sorted(v["trigger"])),
                    ";".join(sorted(v["src"])),
                ]
                for (repo, run, g), v in sorted(recorded.items(), key=lambda kv: (kv[0][0], kv[0][1], kv[0][2]))
            ],
            ["repo", "run", "gate", "rounds", "blocking per round", "stalled", "trigger", "source"],
        )
    )

    # ---- the gates that keep no round counter ----
    P.append("\n## The other gates: rounds they leave in the friction log\n")
    P.append(
        "The critic gate is the only loop that logs a round count. The end-of-plan gate "
        "(`stages/execute.md:76`, cap: a second failure stops the run), the per-task review "
        "(`stages/execute.md:58`, cap: one fix round) and the acceptance pass "
        "(`stages/execute.md:97`, no stated cap) leave one friction line per firing, so the "
        "line count per run is the round count.\n"
    )
    fires = {
        "end-of-plan gate (`gate:` line)": lambda r: r["implicatedMechanism"].startswith("end-of-plan gate"),
        "baseline gate": lambda r: r["implicatedMechanism"] == "baseline gate",
        "per-task review found defects": lambda r: r["implicatedMechanism"] == "per-task reviewer",
        "acceptance: user flagged": lambda r: r["implicatedMechanism"] == "acceptance pass (user flag)",
        "implementer blocked/stuck": lambda r: r["implicatedMechanism"] == "implementer (task dispatch)",
        "documenter stuck/blocked": lambda r: r["implicatedMechanism"] == "documenter",
        "user correction in flight": lambda r: r["implicatedMechanism"] == "user correction (in flight)",
    }
    frows = []
    for name, pred in fires.items():
        sub = [r for r in friction_like if pred(r)]
        byrun = Counter((r["repo"], r["run"]) for r in sub)
        vals = sorted(byrun.values())
        frows.append(
            [
                name,
                len(sub),
                len(byrun),
                statistics.median(vals) if vals else None,
                max(vals) if vals else None,
                sum(1 for v in vals if v >= 2),
                sum(1 for v in vals if v >= 5),
            ]
        )
    P.append(table(frows, ["gate / loop", "lines", "runs that logged it", "median lines per such run", "max", "runs with ≥2", "runs with ≥5"]))

    # ---- retro proposals ----
    P.append("\n## Retrospective proposals\n")
    rp = [r for r in real if r["type"] == "retro-proposal"]
    parsed = [r for r in rp if r.get("proposalParsed")]
    filebased = [r for r in rp if r["sourceKind"] in ("upstream-feedback", "retrospective")]
    P.append(
        table(
            [
                ["parsed from a retrospective subagent's report (transcripts)", len(parsed), len({(r["repo"], r["run"]) for r in parsed})],
                ["items in `.mise/_upstream-feedback.md` / `retrospective_notes.md`", len(filebased), len({(r["repo"], r["run"]) for r in filebased})],
                ["retrospective reports that yielded no parsable numbered proposal", len(rp) - len(parsed) - len(filebased), None],
            ],
            ["source", "proposals", "runs"],
        )
    )
    P.append("")
    P.append(
        table(
            [[k or "(none stated)", v] for k, v in Counter(r.get("proposalKind") for r in parsed).most_common(10)],
            ["proposal kind (as the report labels it)", "n"],
        )
    )
    P.append("")
    ver = Counter(r.get("adoptedVerdict") for r in parsed)
    P.append(
        table(
            [[k or "(not computed)", v, round(100 * v / max(1, len(parsed)))] for k, v in ver.most_common()],
            ["adoption signal (target file at HEAD)", "n", "%"],
        )
    )
    P.append("")
    P.append(
        "`adopted` = the proposal's exact text is in the repo's history (`git log -S`). "
        "`likely-adopted` = ≥70% of the proposal's rare tokens are in its target file at HEAD; "
        "`partly-present` 40–70%; `not-found` <40%; `undetermined` = target file not resolvable. "
        "Adoption of a *project-guidance* proposal is checked in that project's repo; "
        "plugin-candidate proposals are checked in the mise repo.\n"
    )
    pc = [r for r in rp if r.get("isPluginCandidate")]
    P.append(
        table(
            [
                ["plugin-candidate / upstream proposals", len(pc)],
                ["…whose exact text `git log -S` finds in the mise repo", sum(1 for r in pc if r.get("adoptedInMise"))],
                ["…with ≥70% rare-token presence in `skills/next/`", sum(1 for r in pc if (r.get("targetTokenShareMise") or 0) >= 0.7)],
            ],
            ["plugin candidates (automated signal only — see the hand-check below)", "n"],
        )
    )

    # ---- the one file of upstream proposals, hand-checked ----
    P.append("\n### `.mise/_upstream-feedback.md`, hand-checked against the mise repo\n")
    P.append(
        "One file, one run (okven `eric/attribution`, 2026-08-02, mise 1.6.0, blob `3e42c2c`, "
        "175 lines). It is the only place in any repo where a run wrote mise-plugin proposals to disk.\n"
    )
    P.append(table([[esc(a), b, esc(c)] for a, b, c in UPSTREAM], ["proposal", "adopted in mise?", "evidence"]))
    adopted_n = sum(1 for _a, b, _c in UPSTREAM if b == "adopted")
    partly = sum(1 for _a, b, _c in UPSTREAM if b == "partly adopted")
    P.append(f"\nAdopted {adopted_n}/9, partly {partly}/9, not adopted {9 - adopted_n - partly}/9.\n")

    # cluster retro proposals for repetition
    P.append("\n### Retrospective proposals repeated across runs\n")
    P.append("By target file the proposal names:\n")
    tgt = defaultdict(list)
    for r in parsed:
        t = (r.get("proposalTarget") or "(none named)").strip().strip("`")
        t = re.sub(r"\s*(rule|section|→).*$", "", t).strip() or "(none named)"
        tgt[t].append(r)
    P.append(
        table(
            [
                [
                    t,
                    len(v),
                    len({(r["repo"], r["run"]) for r in v}),
                    len({r["repo"] for r in v}),
                    Counter(r.get("adoptedVerdict") for r in v).most_common(1)[0][0],
                    sum(1 for r in v if r.get("adoptedVerdict") in ("adopted", "likely-adopted")),
                ]
                for t, v in sorted(tgt.items(), key=lambda kv: -len({(r["repo"], r["run"]) for r in kv[1]}))[:15]
            ],
            ["target the proposal names", "proposals", "runs", "repos", "top adoption signal", "adopted/likely"],
        )
    )
    P.append("")
    for th in (0.45, 0.25):
        clusters = cluster(parsed, th)
        rep = [c for c in clusters if len({(r["repo"], r["run"]) for r in c}) >= 3]
        P.append(f"Rare-token clusters at Jaccard ≥ {th}: {len(clusters)} clusters; spanning 3+ runs: {len(rep)}; 2 runs: {len([c for c in clusters if len({(r['repo'], r['run']) for r in c}) == 2])}.\n")
        if rep:
            P.append(
                table(
                    [
                        [
                            len({(r["repo"], r["run"]) for r in c}),
                            len(c),
                            ";".join(sorted({(r.get("proposalTarget") or "")[:24] for r in c}))[:60],
                            Counter(r.get("adoptedVerdict") for r in c).most_common(1)[0][0],
                            esc(max(c, key=lambda r: len(r["itemText"]))["itemText"][:220]),
                        ]
                        for c in sorted(rep, key=lambda c: -len({(r["repo"], r["run"]) for r in c}))
                    ],
                    ["runs", "proposals", "targets", "top adoption signal", "representative text"],
                )
            )
            P.append("")

    # ---- most repeated friction items ----
    P.append("\n## The 20 most repeated friction items\n")
    P.append(
        "Clustered by rare-token Jaccard ≥ 0.45 over the "
        f"{len(friction_like)} `_friction.md` / commit-subject items; count = items in the cluster, "
        "runs = distinct (repo, run) pairs it spans. Text is the cluster's longest member, verbatim.\n"
    )
    fc = cluster(friction_like, 0.45)
    fc.sort(key=lambda c: (-len(c), -len({(r["repo"], r["run"]) for r in c})))
    P.append(
        table(
            [
                [
                    len(c),
                    len({(r["repo"], r["run"]) for r in c}),
                    len({r["repo"] for r in c}),
                    Counter(r["implicatedMechanism"] for r in c).most_common(1)[0][0],
                    Counter(r["category"] for r in c).most_common(1)[0][0],
                    esc(max(c, key=lambda r: len(r["itemText"]))["itemText"][:260]),
                ]
                for c in fc[:20]
            ],
            ["items", "runs", "repos", "mechanism", "category", "verbatim (longest member of the cluster)"],
        )
    )
    P.append("")
    P.append(
        "Clusters of ≥2 items: %d of %d. Items in a cluster of 1 (never repeated): %d.\n"
        % (len([c for c in fc if len(c) > 1]), len(fc), len([c for c in fc if len(c) == 1]))
    )

    print("\n".join(P))


def cluster(rows, thresh):
    out = []
    reps = []
    for r in rows:
        t = toks(r["itemText"])
        if not t:
            continue
        placed = False
        for i, rt in enumerate(reps):
            inter = len(t & rt)
            if inter and inter / len(t | rt) >= thresh:
                out[i].append(r)
                placed = True
                break
        if not placed:
            out.append([r])
            reps.append(t)
    return out


if __name__ == "__main__":
    main()
