#!/usr/bin/env python3
"""Render runs/delta-notes.md from runs/delta-notes.jsonl."""
import json
import collections
from pathlib import Path

runs = Path(__file__).resolve().parent.parent / "runs"
rows = [json.loads(l) for l in open(runs / "delta-notes.jsonl")]
uniq = [r for r in rows if not r["duplicateArchiveEntry"]]
mise = [r for r in uniq if r["wasMiseRun"]]


def esc(t, n=None):
    t = t.replace("\n", " ⏎ ").replace("|", "\\|").strip()
    return t if n is None or len(t) <= n else t[:n] + "…"


out = []
w = out.append

w("# Delta Review notes, harvested and classified")
w("")
w(f"{len(rows)} note rows across every `<git-common-dir>/delta-review` store under /Users/eric/Code; "
  f"{len(uniq)} distinct notes after dropping {len(rows) - len(uniq)} repeat archive entries "
  "(Clear Resolved appended the same note again). Counts below use distinct notes. "
  f"Every noted branch is a mise run (see `tools/branches.tsv`), so overall == mise-run: {len(mise)} notes.")
w("")

w("## Counts by category")
w("")
w("| category | all notes | mise-run notes |")
w("| --- | --- | --- |")
alln = collections.Counter(r["category"] for r in uniq)
misen = collections.Counter(r["category"] for r in mise)
for c, n in alln.most_common():
    w(f"| {c} | {n} | {misen[c]} |")
w(f"| **total** | **{len(uniq)}** | **{len(mise)}** |")
w("")

w("## Notes per run (mise runs)")
w("")
w("| repo | branch | notes | first note | last note | categories (top 3) |")
w("| --- | --- | --- | --- | --- | --- |")
byrun = collections.defaultdict(list)
for r in mise:
    byrun[(r["repo"], r["branch"])].append(r)
for (repo, br), rs in sorted(byrun.items(), key=lambda kv: -len(kv[1])):
    dates = sorted(x["date"] for x in rs if x["date"])
    top = collections.Counter(x["category"] for x in rs).most_common(3)
    w(f"| {repo} | {br} | {len(rs)} | {dates[0][:10]} | {dates[-1][:10]} | "
      + ", ".join(f"{c} {n}" for c, n in top) + " |")
w("")

w("## Rule escapes (a rule already existed when the note was written)")
w("")
esc_rows = [r for r in mise if not r["ruleAlreadyExisted"].startswith("no-rule")]
w(f"{len(esc_rows)} of {len(mise)} notes ({100*len(esc_rows)//len(mise)}%) flag something a repo rule already forbade.")
w("")
w("| category | count | rule location |")
w("| --- | --- | --- |")
pairs = collections.Counter((r["category"], r["ruleAlreadyExisted"]) for r in esc_rows)
for (cat, rule), n in sorted(pairs.items(), key=lambda kv: -kv[1]):
    w(f"| {cat} | {n} | {esc(rule)} |")
w("")
w("Rules added *after* the note that flagged the same defect (not counted above):")
w("")
w("| row | branch | date | rule |")
w("| --- | --- | --- | --- |")
for r in mise:
    if r["ruleAlreadyExisted"].startswith("no-rule at note time"):
        w(f"| {r['row']} | {r['branch']} | {r['date'][:10]} | {esc(r['ruleAlreadyExisted'])} |")
w("")

w("## No-rule notes")
w("")
norule = [r for r in mise if r["ruleAlreadyExisted"] == "no-rule"]
w(f"{len(norule)} notes where no rule in the repo's CLAUDE.md / .claude / mise files covers the defect.")
w("")
w("| category | count |")
w("| --- | --- |")
for c, n in collections.Counter(r["category"] for r in norule).most_common():
    w(f"| {c} | {n} |")
w("")
w("| row | branch | file:line | note |")
w("| --- | --- | --- | --- |")
for r in norule:
    w(f"| {r['row']} | {r['branch']} | {r['file']}:{r['line']} | {esc(r['noteText'], 150)} |")
w("")

w("## Verbatim examples, top 5 categories")
w("")
for cat, n in alln.most_common(5):
    w(f"### {cat} ({n})")
    w("")
    for r in [x for x in mise if x["category"] == cat][:3]:
        w(f"- `{r['branch']}` {r['file']}:{r['line']} ({r['date'][:10]}) — {esc(r['noteText'], 400)}")
        w(f"  - rule: {esc(r['ruleAlreadyExisted'])}")
    w("")

(runs / "delta-notes.md").write_text("\n".join(out))
print("wrote", runs / "delta-notes.md")
