#!/usr/bin/env python3
"""Version timeline: for each plugin.json version, the main-line commit that
introduced it, its date, and the net line delta over skills/ (plus the
pre-plugin .claude/skills/) between the previous version's commit and it.

Usage: python3 version_timeline.py
"""
import json
import subprocess

REPO = "/Users/eric/Code/mise-claude-plugin"


def git(*a: str) -> str:
    return subprocess.run(["git", "-C", REPO, *a], capture_output=True, text=True).stdout


def version_at(sha: str) -> str:
    b = git("show", f"{sha}:.claude-plugin/plugin.json")
    try:
        return json.loads(b)["version"]
    except Exception:
        return ""


main = [l.split("\t") for l in git("log", "main", "--reverse", "--format=%H\t%ad\t%s",
                                   "--date=short").strip().split("\n")]
prev_v = ""
marks = []  # (sha, date, subject, version)
for sha, date, subj in main:
    v = version_at(sha)
    if v != prev_v:
        marks.append((sha, date, subj, v))
        prev_v = v

rows = []
for i, (sha, date, subj, v) in enumerate(marks):
    base = marks[i - 1][0] if i else git("rev-list", "--max-parents=0", "main").strip()
    ns = git("diff", "--numstat", f"{base}", sha, "--", "skills/", ".claude/skills/")
    add = rem = 0
    for line in ns.strip().split("\n"):
        if not line:
            continue
        p = line.split("\t")
        if p[0] != "-":
            add += int(p[0])
            rem += int(p[1])
    end = marks[i + 1][1] if i + 1 < len(marks) else "2026-09-19+"
    rows.append({"version": v or "(pre-plugin)", "sha": sha[:7], "date": date,
                 "until": end, "subject": subj, "skillsAdded": add, "skillsRemoved": rem,
                 "net": add - rem})

for r in rows:
    print(json.dumps(r))
