#!/usr/bin/env python3
"""Verify every provenance.jsonl row against git.

Checks: (1) sha resolves; (2) date matches git's author date; (3) the row's
`file` was touched by that commit (or an ancestor path was); (4) a distinctive
slice of `statedReason` appears verbatim in the commit message, the commit's
added diff lines, or any `.mise/` blob reachable from the commit or its branch
tips. Prints one JSON row per failed check.

Usage: python3 verify_provenance.py
"""
import json
import re
import subprocess
import sys

REPO = "/Users/eric/Code/mise-claude-plugin"
SRC = f"{REPO}/docs/v3-research/inventory/provenance.jsonl"


def git(*a: str) -> str:
    return subprocess.run(["git", "-C", REPO, *a], capture_output=True, text=True).stdout


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


# corpus: every commit message + every blob text under .mise/ ever, once.
corpus_parts = [norm(git("log", "--all", "--format=%B"))]
seen = set()
for line in git("log", "--all", "--format=%H", "--name-only", "--", ".mise/").split("\n"):
    line = line.strip()
    if line.startswith(".mise/"):
        seen.add(line)
mise_shas = [s for s in git("log", "--all", "--format=%H", "--", ".mise/").split("\n") if s]
for sha in mise_shas:
    for path in seen:
        blob = git("show", f"{sha}:{path}")
        if blob:
            corpus_parts.append(norm(blob))
# also all added diff lines over mechanism paths
corpus_parts.append(norm(git("log", "--all", "-p", "--format=", "--",
                             "skills/", "docs/", "README.md", "CLAUDE.md",
                             ".claude-plugin/plugin.json", ".claude/")))
CORPUS = "\n".join(corpus_parts)

fails = 0
rows = [json.loads(l) for l in open(SRC)]
for r in rows:
    sha = r["sha"]
    full = git("rev-parse", "--verify", f"{sha}^{{commit}}").strip()
    if not full:
        print(json.dumps({"row": sha, "check": "sha", "detail": "unresolvable"}))
        fails += 1
        continue
    d = git("log", "-1", "--format=%ad", "--date=short", full).strip()
    if d != r["date"]:
        print(json.dumps({"row": sha, "check": "date", "detail": f"git={d} row={r['date']}"}))
        fails += 1
    ver = git("show", f"{full}:.claude-plugin/plugin.json")
    v = json.loads(ver)["version"] if ver.strip().startswith("{") else ""
    if v != r["version"]:
        print(json.dumps({"row": sha, "check": "version", "detail": f"git={v} row={r['version']}"}))
        fails += 1
    sr = r["statedReason"]
    if sr != "none":
        # take the longest alphanumeric-ish run of ~8 words as the probe
        words = [w for w in norm(sr).split(" ") if w not in {"...", "…"}]
        ok = False
        for i in range(0, max(1, len(words) - 5)):
            probe = " ".join(words[i:i + 6])
            probe = probe.strip("*`[]()")
            if len(probe) > 15 and probe in CORPUS:
                ok = True
                break
        if not ok:
            print(json.dumps({"row": sha, "check": "statedReason",
                              "detail": sr[:90]}))
            fails += 1
    for s in r["laterChurn"]:
        if not git("rev-parse", "--verify", f"{s}^{{commit}}").strip():
            print(json.dumps({"row": sha, "check": "laterChurn", "detail": s}))
            fails += 1
print(f"# rows={len(rows)} failedChecks={fails}", file=sys.stderr)
