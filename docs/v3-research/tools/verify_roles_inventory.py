#!/usr/bin/env python3
"""Independent verification of docs/v3-research/inventory/mise-roles.jsonl.

Does NOT import the builder. Checks, against the source files on disk:
  A. JSON validity, schema shape, id uniqueness, id ordering.
  B. Line ranges parse, are in-range for the file, non-inverted, lineCount matches.
  C. Coverage: every non-blank line of every source file is inside >= 1 row.
  D. Overlap sanity: dependsOn/overlapsWith point at existing ids; overlapsWith
     is symmetric; no self-reference.
  E. Enum sanity for kind / enforcedBy / runtimeCost / firesWhen.
  F. firesWhen vs file: role rows must cite the matching role file.
  G. enforcedBy=script rows must cite state.ts, or name a script mechanism.

Usage: python3 verify_roles_inventory.py [--json]
Exit 0 always; findings printed as TSV / JSONL.
"""

import json
import os
import re
import sys

REPO = "/Users/eric/Code/mise-claude-plugin"
INV = os.path.join(REPO, "docs/v3-research/inventory/mise-roles.jsonl")

SOURCES = [
    "skills/next/roles/acceptance.md",
    "skills/next/roles/critic.md",
    "skills/next/roles/documenter.md",
    "skills/next/roles/implementer.md",
    "skills/next/roles/retrospective.md",
    "skills/next/roles/reviewer.md",
    "skills/next/references/config-reference.md",
    "docs/skill-authoring.md",
    "README.md",
    "CLAUDE.md",
    ".claude/mise-config.md",
    ".claude/mise-checklist.md",
    "skills/next/scripts/state.ts",
]

KINDS = {"rule", "glue", "script", "config-knob", "gate", "artifact", "role",
         "stage", "human-stop", "loop"}
ENF = {"prose", "script", "both"}
COSTS = {"none", "subagent-spawn", "tool-run", "loop-multiplier",
         "driver-context", "human-wait"}
FIELDS = ["id", "name", "kind", "file", "lines", "lineCount", "does",
          "preventsClaim", "runtimeCost", "costNote", "enforcedBy",
          "firesWhen", "dependsOn", "overlapsWith"]

ROLE_FIRES = {
    "role:critic": "skills/next/roles/critic.md",
    "role:reviewer": "skills/next/roles/reviewer.md",
    "role:acceptance": "skills/next/roles/acceptance.md",
    "role:documenter": "skills/next/roles/documenter.md",
    "role:implementer": "skills/next/roles/implementer.md",
    "role:retrospective": "skills/next/roles/retrospective.md",
}

findings = []


def F(code, ident, msg):
    findings.append({"check": code, "id": ident, "msg": msg})


def parse_lines(spec):
    """'3' | '3-7' | '3-7,9' -> sorted set of ints, or None on parse failure."""
    out = set()
    for part in str(spec).split(","):
        part = part.strip()
        if not part:
            return None
        m = re.fullmatch(r"(\d+)(?:-(\d+))?", part)
        if not m:
            return None
        a = int(m.group(1))
        b = int(m.group(2)) if m.group(2) else a
        if b < a:
            return None
        out.update(range(a, b + 1))
    return out


def main():
    # --- A. parse
    rows = []
    with open(INV) as fh:
        for n, line in enumerate(fh, 1):
            if not line.strip():
                F("A.blank-line", f"line{n}", "blank line in JSONL")
                continue
            try:
                rows.append((n, json.loads(line)))
            except Exception as e:  # noqa: BLE001
                F("A.json", f"line{n}", f"invalid JSON: {e}")
    ids = {}
    for n, r in rows:
        missing = [k for k in FIELDS if k not in r]
        extra = [k for k in r if k not in FIELDS]
        if missing:
            F("A.schema", r.get("id", f"line{n}"), f"missing fields {missing}")
        if extra:
            F("A.schema", r.get("id", f"line{n}"), f"extra fields {extra}")
        rid = r.get("id")
        if rid in ids:
            F("A.dup-id", rid, f"duplicate id (lines {ids[rid]} and {n})")
        ids[rid] = n
        if not re.fullmatch(r"MR-\d{3}", str(rid)):
            F("A.id-format", str(rid), "id not MR-NNN")
    seq = [r["id"] for _, r in rows if "id" in r]
    expected = [f"MR-{i:03d}" for i in range(1, len(seq) + 1)]
    if seq != expected:
        bad = [(a, b) for a, b in zip(seq, expected) if a != b][:5]
        F("A.id-order", "-", f"ids not dense/in-order; first mismatches {bad}")

    # --- B/C. line ranges + coverage
    for src in SOURCES:
        path = os.path.join(REPO, src)
        if not os.path.exists(path):
            F("C.missing-src", src, "source file not found")
            continue
        text = open(path).read().split("\n")
        if text and text[-1] == "":
            text.pop()
        nlines = len(text)
        covered = {}
        for n, r in rows:
            if r.get("file") != src:
                continue
            ln = parse_lines(r.get("lines"))
            if ln is None:
                F("B.lines-parse", r["id"], f"unparseable lines {r.get('lines')!r}")
                continue
            if r.get("lineCount") != len(ln):
                F("B.linecount", r["id"],
                  f"lineCount {r.get('lineCount')} != {len(ln)} lines in {r['lines']!r}")
            over = [x for x in ln if x > nlines or x < 1]
            if over:
                F("B.range", r["id"],
                  f"lines {sorted(over)[:4]} outside 1..{nlines} of {src}")
            for x in ln:
                covered.setdefault(x, []).append(r["id"])
        for i, body in enumerate(text, 1):
            if not body.strip():
                continue
            if i not in covered:
                F("C.uncovered", src, f"L{i} uncovered: {body[:100]!r}")
        # blank lines claimed by rows are fine (ranges span them) but flag rows
        # that consist ONLY of blank lines
        for n, r in rows:
            if r.get("file") != src:
                continue
            ln = parse_lines(r.get("lines")) or set()
            if ln and all(
                not text[x - 1].strip() for x in ln if 1 <= x <= nlines
            ):
                F("C.blank-row", r["id"], f"row covers only blank lines {r['lines']}")

    # --- D. link integrity
    idset = set(ids)
    ov = {r["id"]: set(r.get("overlapsWith", [])) for _, r in rows}
    for n, r in rows:
        for k in ("dependsOn", "overlapsWith"):
            for t in r.get(k, []):
                if t not in idset:
                    F("D.dangling", r["id"], f"{k} -> unknown id {t}")
                if t == r["id"]:
                    F("D.self", r["id"], f"{k} -> itself")
        for t in r.get("overlapsWith", []):
            if t in ov and r["id"] not in ov[t]:
                F("D.asym", r["id"], f"overlapsWith {t} but {t} does not list it back")

    # --- E. enums
    for n, r in rows:
        if r.get("kind") not in KINDS:
            F("E.kind", r["id"], f"unknown kind {r.get('kind')!r}")
        if r.get("enforcedBy") not in ENF:
            F("E.enf", r["id"], f"unknown enforcedBy {r.get('enforcedBy')!r}")
        rc = r.get("runtimeCost")
        if not isinstance(rc, list) or not rc:
            F("E.cost", r["id"], f"runtimeCost not a non-empty list: {rc!r}")
        else:
            for c in rc:
                if c not in COSTS:
                    F("E.cost", r["id"], f"unknown runtimeCost {c!r}")
            if "none" in rc and len(rc) > 1:
                F("E.cost", r["id"], f"'none' mixed with other costs: {rc}")
        if rc and rc != ["none"] and not r.get("costNote"):
            F("E.costnote", r["id"], f"cost {rc} but empty costNote")

    # --- F. firesWhen vs file
    for n, r in rows:
        fw = r.get("firesWhen")
        if fw in ROLE_FIRES and r.get("file") != ROLE_FIRES[fw]:
            F("F.fires", r["id"], f"firesWhen {fw} but file {r.get('file')}")
        if r.get("file") in ROLE_FIRES.values():
            want = [k for k, v in ROLE_FIRES.items() if v == r["file"]][0]
            if fw != want:
                F("F.fires", r["id"], f"file {r['file']} but firesWhen {fw!r}")
        if fw == "script" and r.get("file") != "skills/next/scripts/state.ts":
            F("F.fires", r["id"], f"firesWhen script but file {r.get('file')}")

    # --- G. enforcedBy script must be backed by state.ts
    for n, r in rows:
        if r.get("enforcedBy") in ("script", "both") and \
                r.get("file") != "skills/next/scripts/state.ts" and \
                "state.ts" not in (r.get("costNote", "") + r.get("does", "")):
            F("G.script", r["id"],
              f"enforcedBy={r['enforcedBy']} on {r.get('file')} with no script cited")

    if "--json" in sys.argv:
        for f in findings:
            print(json.dumps(f))
    else:
        by = {}
        for f in findings:
            by.setdefault(f["check"], []).append(f)
        print(f"rows={len(rows)} findings={len(findings)}")
        for k in sorted(by):
            print(f"\n== {k} ({len(by[k])})")
            for f in by[k][:400]:
                print(f"  {f['id']}\t{f['msg']}")


if __name__ == "__main__":
    main()
