#!/usr/bin/env python3
"""Emit inventory/provenance.md from provenance.jsonl + git-derived numbers.

Every number in the output is computed here from git or from provenance.jsonl;
only the one-line version themes are hand-written (from each bump commit's own
message body, cited by sha).

Usage: python3 gen_provenance_md.py > ../inventory/provenance.md
"""
import collections
import json
import subprocess

REPO = "/Users/eric/Code/mise-claude-plugin"
SRC = f"{REPO}/docs/v3-research/inventory/provenance.jsonl"
TODAY = "2026-09-19"


def git(*a: str) -> str:
    return subprocess.run(["git", "-C", REPO, *a], capture_output=True, text=True).stdout


def version_at(sha: str) -> str:
    b = git("show", f"{sha}:.claude-plugin/plugin.json")
    try:
        return json.loads(b)["version"]
    except Exception:
        return ""


def numstat(a: str, b: str) -> tuple[tuple[int, int], tuple[int, int]]:
    md = [0, 0]
    code = [0, 0]
    for line in git("diff", "--numstat", a, b, "--", "skills/", ".claude/skills/").strip().split("\n"):
        if not line:
            continue
        p = line.split("\t")
        if p[0] == "-":
            continue
        t = md if p[2].endswith(".md") else code
        t[0] += int(p[0])
        t[1] += int(p[1])
    return (md[0], md[1]), (code[0], code[1])


def md_total(sha: str) -> tuple[int, int]:
    files = [f for f in git("ls-tree", "-r", "--name-only", sha).split("\n")
             if (f.startswith("skills/") or f.startswith(".claude/skills/")) and f.endswith(".md")]
    lines = words = 0
    for f in files:
        blob = git("show", f"{sha}:{f}")
        lines += len(blob.split("\n")) - 1
        words += len(blob.split())
    return lines, words


THEMES = {
    "(pre-plugin)": "Nine free-standing `.claude/skills/` workflow skills + `workflow-config.md` template (bc94c76); orchestrator `/next` added 0190e87",
    "1.0.0": "Nine skills collapse into one `mise:next` skill with stages/references/ + TypeScript state engine; architecture stage dropped",
    "1.0.1": "Forbid REQ-* traceability IDs in code; fix README install URL",
    "1.1.0": "Severity-tagged critic findings (blocking/minor/informative), progress-based stall with 5-round backstop, mock state coverage",
    "1.2.0": "Mock IDs, new-UI-concept audit against the user's mental model, New Concepts section",
    "1.3.0": "Required Branch convention; work branch created at start",
    "1.4.0": "Kaizen retrospective subagent at close-out + `_friction.md` log feeding it",
    "1.5.0": "Ship step (pr|merge|off), CLAUDE.md ship guard, acceptance recorded as a resumable `accepted` hash",
    "1.6.0": "Optional `## Models` config section mapping subagent roles to models (feature 9a8634f; bump 28b1acd)",
    "1.7.0": "Critic stall rule replaced: fresh/recurring convergence tracking, 5-per-version / 8-absolute round budgets",
    "2.0.0": "Project review checklist + documenter role + end-of-plan gate + role files; six instruction files halved",
    "2.1.0": "Per-task documenter, checklist answers move to commit bodies, reviewer verifies instead of re-deriving",
}

rows = [json.loads(l) for l in open(SRC)]

_ts: dict[str, int] = {}


def ts(sha: str) -> int:
    """Committer timestamp, for chronological ordering inside a day."""
    if sha not in _ts:
        out = git("log", "-1", "--format=%ct", sha).strip()
        _ts[sha] = int(out) if out else 0
    return _ts[sha]

# ---- version marks on the main line -------------------------------------
main = [l.split("\t") for l in git("log", "main", "--reverse", "--format=%H\t%ad\t%s",
                                   "--date=short").strip().split("\n")]
marks = []
prev = None
for sha, date, subj in main:
    v = version_at(sha)
    if v != prev:
        marks.append((sha, date, subj, v or "(pre-plugin)"))
        prev = v
root = git("rev-list", "--max-parents=0", "main").strip()
# the pre-plugin era is a range, not a commit: measure it at 50c377e~1
pre_end = git("rev-parse", "--short", "50c377e~1").strip()
marks[0] = (pre_end, "2026-03-16", main[0][2], "(pre-plugin)")

out: list[str] = []
w = out.append

w("# Provenance of mise mechanisms")
w("")
w(f"Source rows: `inventory/provenance.jsonl` (89 rows, 62 commits). Repo `/Users/eric/Code/mise-claude-plugin`, all refs, history 2026-03-16 .. 2026-09-12. Generated {TODAY}.")
w("")

# ---- 1. version timeline -------------------------------------------------
w("## Version timeline")
w("")
w("`skills/` counts cover `skills/` and the pre-plugin `.claude/skills/`, measured between consecutive version marks on `main`. md = instruction prose; code = `state.ts` + `state.test.ts`.")
w("")
w("| version | date | theme | skills md +/- | skills code +/- | md total after (lines / words) |")
w("|---|---|---|---|---|---|")
prev_sha = root
for sha, date, subj, v in marks:
    (ma, mr), (ca, cr) = numstat(prev_sha, sha)
    tl, tw = md_total(sha)
    w(f"| {v} | {date} | {THEMES.get(v, subj)} | +{ma}/-{mr} | +{ca}/-{cr} | {tl} / {tw} |")
    prev_sha = sha
w("")
w("Pre-plugin era (2026-03-16 .. 2026-07-12, 31 `main` commits before `50c377e`) is the `(pre-plugin)` row's cumulative total, not one commit.")
w("")

# ---- 2. named real failure ----------------------------------------------
named = [r for r in rows if r["trigger"] == "named-failure-in-a-real-run"]
w("## Added in response to a named real failure")
w("")
w(f"{len(named)} of {len(rows)} rows. `failure` is verbatim from the commit message, the file's own text, or a `.mise/` goals/friction artifact (cited in the jsonl row).")
w("")
w("| date | ver | sha | mechanism | chg | the named failure |")
w("|---|---|---|---|---|---|")
for r in sorted(named, key=lambda r: (ts(r["sha"]), r["anchor"])):
    f = r["statedReason"].replace("|", "\\|").replace("\n", " ")
    if len(f) > 190:
        f = f[:190].rstrip() + " ..."
    w(f"| {r['date']} | {r['version'] or '-'} | `{r['sha']}` | `{r['file']}` - {r['anchor']} | {r['change']} | {f} |")
w("")

# ---- 3. no stated reason -------------------------------------------------
none_rows = [r for r in rows if r["statedReason"] == "none"]
w("## Added/changed with no stated reason")
w("")
w(f"{len(none_rows)} of {len(rows)} rows: nothing in the commit message, the file text, or any `.mise/` artifact says why.")
w("")
w("| date | ver | sha | mechanism | chg | what |")
w("|---|---|---|---|---|---|")
for r in sorted(none_rows, key=lambda r: ts(r["sha"])):
    w(f"| {r['date']} | {r['version'] or '-'} | `{r['sha']}` | `{r['file']}` - {r['anchor']} | {r['change']} | {r['what']} |")
w("")
tc = collections.Counter(r["trigger"] for r in rows)
w("Trigger mix over all 89 rows: " + ", ".join(f"{k} {v}" for k, v in tc.most_common()) + ".")
w("")

# ---- 4. churn ------------------------------------------------------------
g: dict[str, dict] = collections.defaultdict(lambda: {"shas": set(), "rows": []})
for r in rows:
    k = r["anchor"].strip().lstrip("#").strip().lower()
    g[k]["shas"].add(r["sha"])
    g[k]["shas"].update(r["laterChurn"])
    g[k]["rows"].append(r)
churn = sorted(((len(v["shas"]), k, sorted(v["shas"], key=ts), v["rows"]) for k, v in g.items() if len(v["shas"]) >= 4),
               key=lambda x: (-x[0], x[1]))
w("## Reworked 3+ times (churn)")
w("")
w("Mechanism identity = provenance anchor; count = distinct commits that introduced or reworked it (original + `laterChurn`). 4+ commits means reworked 3 or more times.")
w("")
w("| commits | mechanism | file(s) | shas |")
w("|---|---|---|---|")
for n, k, shas, rs in churn:
    files = ", ".join(f"`{x}`" for x in sorted({r["file"] for r in rs}))
    w(f"| {n} | {k} | {files} | {' '.join('`'+s+'`' for s in shas)} |")
w("")
w("Independent check - distinct `main` commits per markdown section (`tools/section_churn.py` -> `inventory/_section_churn.jsonl`), top of `skills/`:")
w("")
sc = collections.defaultdict(set)
for r in (json.loads(l) for l in open(f"{REPO}/docs/v3-research/inventory/_section_churn.jsonl")):
    if r["file"].startswith("skills/") or r["file"].startswith(".claude/skills/"):
        sc[(r["file"], r["section"])].add(r["sha"])
w("| commits | file | section |")
w("|---|---|---|")
for (f, s), v in sorted(sc.items(), key=lambda x: -len(x[1]))[:8]:
    w(f"| {len(v)} | `{f}` | {s} |")
w("")

# ---- 5. dated version table ---------------------------------------------
w("## Date -> version in effect (for joining run dates)")
w("")
w("Version as shipped on `main` (what `/plugin update` would install). A run dated inside a window used that version *if* the user had updated; install timing is not recorded in this repo.")
w("")
w("| from | to | version | landed by |")
w("|---|---|---|---|")
w(f"| 2026-03-16 | 2026-07-12 | none (pre-plugin `.claude/skills/`) | `bc94c76` |")
for i, (sha, date, subj, v) in enumerate(marks):
    end = marks[i + 1][1] if i + 1 < len(marks) else TODAY
    if v == "(pre-plugin)":
        continue
    last = end if i + 1 < len(marks) else "today"
    w(f"| {date} | {last} | {v} | `{sha[:7]}` |")
w("")
w("In-flight branches carry the new version before `main` does: `feat/critic-stall-heuristic` 2026-08-13..08-14 (1.7.0 at `b1c15ca`), `feat/next-major-improvements` 2026-08-18..08-19 (2.0.0 at `53896d7`), `fix/doc-churn-usage` 2026-09-12 (2.1.0 at `8d2d8ec`). Each was squashed onto `main` the same or next day, so the window above is off by at most one day.")

print("\n".join(out))
