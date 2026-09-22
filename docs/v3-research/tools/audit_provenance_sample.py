#!/usr/bin/env python3
"""Strict audit of every 5th provenance.jsonl row (1-indexed).

For each sampled row: resolve sha, compare date/version to git, and check each
"..."-separated segment of statedReason verbatim (whitespace-normalised) against
the narrowest plausible source, in this order:
  1. that commit's own message
  2. that commit's own added diff lines (+ lines)
  3. the .mise/ blob named in a trailing [.mise/<file> ...] citation
  4. any .mise/ blob anywhere in history (weakest; flagged as WIDE)
Prints one JSON verdict per sampled row.

Usage: python3 audit_provenance_sample.py [stride]
"""
import json, re, subprocess, sys

REPO = "/Users/eric/Code/mise-claude-plugin"
SRC = f"{REPO}/docs/v3-research/inventory/provenance.jsonl"
STRIDE = int(sys.argv[1]) if len(sys.argv) > 1 else 5


def git(*a):
    return subprocess.run(["git", "-C", REPO, *a], capture_output=True, text=True).stdout


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


# every .mise/ blob ever, keyed by "sha:path" and pooled
mise_paths = sorted({l.strip() for l in git("log", "--all", "--format=", "--name-only", "--", ".mise/").split("\n") if l.strip().startswith(".mise/")})
mise_shas = [s for s in git("log", "--all", "--format=%H", "--", ".mise/").split("\n") if s]
MISE_POOL = []
MISE_BY_PATH = {}
for sha in mise_shas:
    for p in mise_paths:
        b = git("show", f"{sha}:{p}")
        if b:
            n = norm(b)
            MISE_POOL.append(n)
            MISE_BY_PATH.setdefault(p, []).append(n)
MISE_POOL = "\n".join(MISE_POOL)

rows = [json.loads(l) for l in open(SRC)]
for i, r in enumerate(rows, 1):
    if i % STRIDE:
        continue
    out = {"row": i, "sha": r["sha"], "checks": {}}
    full = git("rev-parse", "--verify", f"{r['sha']}^{{commit}}").strip()
    out["checks"]["sha"] = "ok" if full else "MISSING"
    if not full:
        print(json.dumps(out)); continue
    d = git("log", "-1", "--format=%ad", "--date=short", full).strip()
    out["checks"]["date"] = "ok" if d == r["date"] else f"git={d}"
    vj = git("show", f"{full}:.claude-plugin/plugin.json")
    v = json.loads(vj)["version"] if vj.strip().startswith("{") else ""
    out["checks"]["version"] = "ok" if v == r["version"] else f"git={v!r}"
    # sources
    msg = norm(git("log", "-1", "--format=%B", full))
    diff = git("show", "--format=", "-U0", full)
    added = norm("\n".join(l[1:] for l in diff.split("\n") if l.startswith("+") and not l.startswith("+++")))
    cite = re.findall(r"\[(\.mise/[^\s\]]+)", r["statedReason"])
    cited = "\n".join(sum((MISE_BY_PATH.get(c, []) for c in cite), [])) if cite else ""
    segs = [norm(s).strip("*`") for s in re.split(r"\s*(?:\.\.\.|…)\s*", r["statedReason"]) if norm(s)]
    res = []
    for s in segs:
        if s == "none":
            res.append("none"); continue
        probe = s.strip('*`"')
        if probe in msg: res.append("commit-msg")
        elif probe in added: res.append("commit-diff")
        elif cited and probe in cited: res.append("cited-mise")
        elif probe in MISE_POOL: res.append("WIDE-mise-pool")
        else:
            # try dropping markdown emphasis chars entirely
            strip = lambda t: re.sub(r"[*`]", "", t)
            if strip(probe) in strip(msg): res.append("commit-msg~")
            elif strip(probe) in strip(added): res.append("commit-diff~")
            elif cited and strip(probe) in strip(cited): res.append("cited-mise~")
            elif strip(probe) in strip(MISE_POOL): res.append("WIDE-mise-pool~")
            else: res.append("NOT-FOUND:" + probe[:70])
    out["checks"]["statedReason"] = res
    out["trigger"] = r["trigger"]
    out["subject"] = git("log", "-1", "--format=%s", full).strip()
    print(json.dumps(out, ensure_ascii=False))
