#!/usr/bin/env python3
"""Which instruction files the Claude Code harness injects into each mise
subagent's context, measured from recorded subagent transcripts of the okven
repo and its worktrees.

Classifies each subagent by the mise role file its dispatch prompt names, then
counts, per role: transcripts with an `instructions` attachment carrying the
project root CLAUDE.md, and transcripts with a `nested_memory` attachment per
nested CLAUDE.md path. Aggregate counts only; no transcript text is printed.
"""
import glob, json, os, re, sys
from collections import defaultdict

ROLES = ["implementer", "documenter", "reviewer", "critic", "acceptance", "retrospective"]
files = glob.glob("/Users/eric/.claude/projects/-Users-eric-Code-okven*/*/subagents/*.jsonl")
stats = defaultdict(lambda: defaultdict(int))
nested = defaultdict(lambda: defaultdict(int))

for path in files:
    role = "other"
    got_instr, instr_paths, nested_paths = False, set(), set()
    with open(path, errors="replace") as fh:
        for i, line in enumerate(fh):
            if i == 0:
                m = re.search(r"roles/(\w+)\.md", line)
                if m and m.group(1) in ROLES:
                    role = m.group(1)
            if '"attachment"' not in line:
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue
            att = rec.get("attachment") or {}
            t = att.get("type")
            if t == "instructions":
                got_instr = True
                for f in att.get("files", []):
                    instr_paths.add(os.path.basename(f.get("path", "")))
            elif t == "nested_memory":
                blob = json.dumps(att)
                for p in re.findall(r"([\w./-]*?(?:functions|hosting|packages|scripts|seed)/CLAUDE\.md)", blob):
                    nested_paths.add("/".join(p.split("/")[-2:]))
                if not re.search(r"CLAUDE\.md", blob):
                    nested_paths.add("(unparsed)")
    stats[role]["transcripts"] += 1
    if got_instr:
        stats[role]["instructions_attachment"] += 1
    if "CLAUDE.md" in instr_paths:
        stats[role]["root_CLAUDE.md_injected"] += 1
    if "MEMORY.md" in instr_paths:
        stats[role]["user_MEMORY.md_injected"] += 1
    for p in nested_paths:
        nested[role][p] += 1

for role in sorted(stats):
    s = stats[role]
    print(json.dumps({"role": role, **s, "nested_memory": dict(sorted(nested[role].items()))}))

# --- second pass: injection rate by Claude Code version and month ---
byver = defaultdict(lambda: [0, 0])
bymonth = defaultdict(lambda: [0, 0])
for path in files:
    ver, month, got = "?", "?", False
    with open(path, errors="replace") as fh:
        for i, line in enumerate(fh):
            if i == 0:
                m = re.search(r'"version":"([^"]+)"', line)
                if m:
                    ver = m.group(1)
                m = re.search(r'"timestamp":"(\d{4}-\d{2})', line)
                if m:
                    month = m.group(1)
            if '"type":"instructions"' in line:
                got = True
    byver[ver][0] += 1
    byver[ver][1] += int(got)
    bymonth[month][0] += 1
    bymonth[month][1] += int(got)
print("--- by version ---")
for k in sorted(byver):
    print(json.dumps({"version": k, "transcripts": byver[k][0], "root_CLAUDE_injected": byver[k][1]}))
print("--- by month ---")
for k in sorted(bymonth):
    print(json.dumps({"month": k, "transcripts": bymonth[k][0], "root_CLAUDE_injected": bymonth[k][1]}))
