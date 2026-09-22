#!/usr/bin/env python3
"""Per-commit, per-file markdown section churn on the main line.

For every commit on `main` that touches a mechanism path, reconstruct which
markdown sections (## / ### headings) the diff's changed lines fall inside, by
replaying the pre-image line numbers of each hunk against the parent blob's
heading map. Emits JSONL: {sha, date, file, section, added, removed}.

Usage: python3 section_churn.py > ../inventory/_section_churn.jsonl
"""
import json
import re
import subprocess
import sys

REPO = "/Users/eric/Code/mise-claude-plugin"
PATHS = [
    "skills/",
    "docs/",
    "README.md",
    "CLAUDE.md",
    ".claude-plugin/plugin.json",
    ".claude/",
]
HEAD_RE = re.compile(r"^(#{1,4}) +(.+?)\s*$")
HUNK_RE = re.compile(r"^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@")


def git(*args: str) -> str:
    return subprocess.run(
        ["git", "-C", REPO, *args], capture_output=True, text=True
    ).stdout


def heading_map(sha: str, path: str) -> dict[int, str]:
    """line number (1-based) -> enclosing heading, for a blob."""
    blob = git("show", f"{sha}:{path}")
    out: dict[int, str] = {}
    cur = "(top)"
    in_fence = False
    for i, line in enumerate(blob.split("\n"), 1):
        if line.startswith("```"):
            in_fence = not in_fence
        if not in_fence:
            m = HEAD_RE.match(line)
            if m:
                cur = m.group(2)
        out[i] = cur
    return out


def main() -> None:
    shas = git(
        "log", "main", "--reverse", "--format=%H%x09%ad", "--date=short", "--", *PATHS
    ).strip().split("\n")
    for row in shas:
        if not row:
            continue
        sha, date = row.split("\t")
        parents = git("rev-list", "--parents", "-n", "1", sha).split()
        parent = parents[1] if len(parents) > 1 else None
        diff = git(
            "show", sha, "--format=", "--unified=0", "--no-color", "--", *PATHS
        )
        cur_file = None
        hmap: dict[int, str] = {}
        counts: dict[tuple[str, str], list[int]] = {}
        old_ln = 0
        section = "(top)"
        for line in diff.split("\n"):
            if line.startswith("diff --git "):
                cur_file = line.split(" b/")[-1]
                hmap = heading_map(parent, cur_file) if parent else {}
                continue
            if line.startswith("@@"):
                m = HUNK_RE.match(line)
                if m:
                    old_ln = int(m.group(1))
                    section = hmap.get(old_ln, hmap.get(max(old_ln - 1, 1), "(new file)"))
                continue
            if cur_file is None:
                continue
            key = (cur_file, section)
            if line.startswith("+") and not line.startswith("+++"):
                counts.setdefault(key, [0, 0])[0] += 1
            elif line.startswith("-") and not line.startswith("---"):
                counts.setdefault(key, [0, 0])[1] += 1
        for (f, s), (a, r) in counts.items():
            print(
                json.dumps(
                    {"sha": sha[:7], "date": date, "file": f, "section": s,
                     "added": a, "removed": r}
                )
            )


if __name__ == "__main__":
    main()
