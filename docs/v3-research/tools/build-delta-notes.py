#!/usr/bin/env python3
"""Join the harvested notes with the manual categories, the branch mise map and
the rule table, and write runs/delta-notes.jsonl.

Inputs (all under docs/v3-research/tools/, except the harvest which is piped in):
  raw-notes.jsonl  - output of harvest-delta-notes.sh, row order is stable
  categories.txt   - manual category per row number
  branches.tsv     - wasMiseRun per sanitized branch, with evidence
  rules.tsv        - rule citations + first-seen date + matching regex
"""
import json
import re
import sys
from pathlib import Path

tools = Path(__file__).resolve().parent
runs = tools.parent / "runs"

raw = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]

cats = {}
for line in open(tools / "categories.txt"):
    if line.startswith("#") or not line.strip():
        continue
    c, nums = line.split(":", 1)
    for n in nums.strip().split(","):
        cats[int(n)] = c.strip()

branches = {}
for line in open(tools / "branches.tsv"):
    if line.startswith("#") or not line.strip():
        continue
    repo, sb, br, mise, ev = line.rstrip("\n").split("\t")
    branches[(repo, sb)] = (br, mise == "true", ev)

rules = []
for line in open(tools / "rules.tsv"):
    if line.startswith("#") or not line.strip():
        continue
    repo, key, cite, since, rx = line.rstrip("\n").split("\t")
    rules.append((repo, key, cite, since, re.compile(rx, re.I)))

out = []
seen_ids = set()
for i, n in enumerate(raw, start=1):
    br, mise, ev = branches.get((n["repo"], n["sanitizedBranch"]), (n["sanitizedBranch"], None, "no branch evidence"))
    cat = cats[i]
    key = (n["repo"], br, n["id"])
    dup = key in seen_ids
    seen_ids.add(key)
    date = (n["date"] or "")[:10]
    rule = "no-rule"
    for repo, key, cite, since, rx in rules:
        if repo != n["repo"] or not rx.search(n["noteText"]):
            continue
        if date and date >= since:
            rule = f"{cite} [since {since}]"
        else:
            rule = f"no-rule at note time ({cite} added {since}, after {date})"
        break
    out.append({
        "repo": n["repo"],
        "branch": br,
        "file": n["file"],
        "line": n["line"],
        "date": n["date"],
        "noteText": n["noteText"],
        "response": n["response"],
        "status": n["status"],
        "wasMiseRun": mise,
        "category": cat,
        "ruleAlreadyExisted": rule,
        # provenance / bookkeeping
        "row": i,
        "noteId": n["id"],
        "source": n["source"],
        "storeFile": n["storeFile"],
        "side": n["side"],
        "endLine": n["endLine"],
        "turnCount": n["turnCount"],
        "responseCount": n["responseCount"],
        "deletedAt": n["deletedAt"],
        "miseEvidence": ev,
        "duplicateArchiveEntry": dup,
    })

runs.mkdir(parents=True, exist_ok=True)
with open(runs / "delta-notes.jsonl", "w") as f:
    for r in out:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print(f"wrote {len(out)} rows")
