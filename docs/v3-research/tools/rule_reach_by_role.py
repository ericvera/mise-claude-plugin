#!/usr/bin/env python3
"""Per mise role, how many recorded okven subagent transcripts contain the text
of specific project rules (checklist rules, doc-style skill, test-style rules).
Presence means the text entered that subagent's context by any path: harness
injection, a Read tool result, or the agent quoting it. Aggregate counts only."""
import glob, json, re, sys
from collections import defaultdict

ROLES = ["implementer", "documenter", "reviewer", "critic", "acceptance", "retrospective"]
MARKERS = {
    "checklist_rule1_debug": "No leftover debug code",
    "checklist_rule6_whole_values": "Test assertions cover whole values",
    "checklist_rule15_prose": "Every comment explains why",
    "checklist_path": ".claude/mise-checklist.md",
    "docstyle_path": "skills/doc-style/SKILL.md",
    "docstyle_body": "Doc Style (comments & docs)",
    "docstyle_rule12_caps": "JSDoc ≤ 3 sentences",
    "claudemd_inline_snapshots": "Always use inline snapshots",
    "claudemd_jsdoc_grounds": "JSDoc grounds the reader",
    "uiconv_body": "UI Conventions (hosting/)",
    "uiverify_path": "skills/ui-verify",
}
MINVER = (2, 1, 267)

def ver_tuple(v):
    try:
        return tuple(int(x) for x in v.split("."))
    except Exception:
        return (0, 0, 0)

stats = defaultdict(lambda: defaultdict(int))
for path in glob.glob("/Users/eric/.claude/projects/-Users-eric-Code-okven*/*/subagents/*.jsonl"):
    with open(path, errors="replace") as fh:
        head = fh.readline()
        body = head + fh.read()
    m = re.search(r"roles/(\w+)\.md", head)
    role = m.group(1) if m and m.group(1) in ROLES else "other"
    vm = re.search(r'"version":"([^"]+)"', head)
    recent = ver_tuple(vm.group(1)) >= MINVER if vm else False
    for scope in ("all", "recent") if recent else ("all",):
        stats[(role, scope)]["transcripts"] += 1
        for key, pat in MARKERS.items():
            if pat in body:
                stats[(role, scope)][key] += 1

for (role, scope) in sorted(stats):
    print(json.dumps({"role": role, "scope": scope, **stats[(role, scope)]}))
