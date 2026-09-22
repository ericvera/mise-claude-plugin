#!/usr/bin/env python3
"""Classify harvested .mise log items into the friction.jsonl schema.

  classify-friction.py <items.jsonl> > friction.jsonl

Every field is derived from the item's own text (the labels mise's rules mandate) or from
git; nothing is inferred beyond what the text names. An item whose mechanism or category
cannot be read off the text gets "unknown" / "other" rather than a guess.
"""

import json
import re
import subprocess
import sys

REPO_CACHE = {}


def git(repo, *args):
    p = subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True, errors="replace")
    return p.stdout if p.returncode == 0 else ""


def children_map(repo):
    """sha -> [child shas], built once per repo from all refs."""
    if repo in REPO_CACHE:
        return REPO_CACHE[repo]
    m = {}
    for line in git(repo, "rev-list", "--all", "--children").splitlines():
        parts = line.split()
        if parts:
            m[parts[0]] = parts[1:]
    REPO_CACHE[repo] = m
    return m


TOUCH_CACHE = {}


def touches_code(repo, sha):
    k = (repo, sha)
    if k in TOUCH_CACHE:
        return TOUCH_CACHE[k]
    out = git(repo, "show", "--name-only", "--pretty=format:%s", sha)
    lines = out.splitlines()
    subject = lines[0] if lines else ""
    paths = [p for p in lines[1:] if p.strip()]
    code = [p for p in paths if not p.startswith(".mise/")]
    TOUCH_CACHE[k] = (subject, code)
    return TOUCH_CACHE[k]


SKIP = re.compile(r"^delta-review ", re.I)
CLOSES = re.compile(r"^mise: (task .* done|approve |cleanup|accept|plan )", re.I)


def following_code_change(repo, sha, depth=15):
    """Did a fix follow this finding?

    mise commits the friction line first (`mise: log task N review friction`), then the
    fix round's commit, then the checkpoint that closes the unit (`mise: task N done`,
    `mise: approve <stage>`). So walk forward from the commit that first carried the item
    and answer True on the first commit touching non-`.mise/` paths, False if a closing
    checkpoint arrives first. `delta-review state` commits are an unrelated VS Code
    extension's auto-commits and are skipped, not counted either way."""
    kids = children_map(repo)
    cur, seen, budget, hops = [sha], set(), depth, 0
    while cur and budget > 0 and hops < 400:
        hops += 1
        c = cur[0]
        if c in seen:
            break
        seen.add(c)
        s, code = touches_code(repo, c)
        if not SKIP.match(s):  # skipped commits do not spend the budget
            budget -= 1
            if code:
                return True, c, s, len(code)
            if c != sha and CLOSES.match(s):
                return False, c, s, 0
        cur = kids.get(c, [])[:1]
    return False, "", "", 0


# ---- mechanism, read off the label mise's own rules mandate -------------------------

GATE_PATTERNS = [
    (re.compile(r"^critic\s+(requirements|plan|goals|mocks?)\b", re.I), "critic gate ({0})", "critic-{0}"),
    (re.compile(r"^task\s+[0-9][0-9._]*[a-z]?\s*:\s*review found", re.I), "per-task reviewer", "per-task-review"),
    (re.compile(r"^acceptance\s*:\s*user flagged", re.I), "acceptance pass", "acceptance"),
    (re.compile(r"^(execute\s+)?baseline gate\b", re.I), "baseline gate", "baseline-gate"),
    (re.compile(r"^gate\s*:", re.I), "end-of-plan gate", "end-of-plan-gate"),
    (re.compile(r"^sanity-e2e\b", re.I), "end-of-plan gate (e2e/sanity)", "end-of-plan-gate"),
]

MECH_PATTERNS = [
    (re.compile(r"^correction\s*:", re.I), "user correction (in-flight)"),
    (re.compile(r"^task\s+[0-9][0-9._]*[a-z]?\s*:\s*(blocked|stuck)", re.I), "implementer (task dispatch)"),
    (re.compile(r"^task\s+[0-9][0-9._]*[a-z]?\s*:\s*documenter", re.I), "documenter"),
    (re.compile(r"^goals\s*:", re.I), "goals stage / goals gate"),
    (re.compile(r"^requirements\s*:", re.I), "requirements stage"),
    (re.compile(r"^execute\s*:", re.I), "execute stage"),
    (re.compile(r"^env\s*:", re.I), "environment / tooling"),
    (re.compile(r"^delta-review\s*:", re.I), "delta-review (external tool)"),
    (re.compile(r"^acceptance\s*:", re.I), "acceptance pass"),
    (re.compile(r"^retrospective\b", re.I), "retrospective role"),
    (re.compile(r"^mocks?\b", re.I), "mock stage"),
    (re.compile(r"^setup\b", re.I), "setup stage"),
    (re.compile(r"^task\s+[0-9][0-9._]*[a-z]?\s*:", re.I), "task execution"),
]

# category keyword rules, applied in order; first hit wins
CATEGORY_RULES = [
    (
        "false-positive-gate",
        r"false (positive|result|negative)|\bnit\b|nitpick|cosmetic|not (a|an actual) defect|no real defect|"
        r"wasn'?t a defect|overclaim|already correct|misread the code|reported .{0,30}as (a )?(failure|defect)",
    ),
    (
        "missed-defect",
        r"\bmissed\b|slipped (through|past)|went unnoticed|no critic saw|shipped .{0,30}(bug|defect|contradiction)|"
        r"neither (task|reviewer) could see|invisible to|unseen by|escaped|only (found|caught) (at|in) acceptance",
    ),
    (
        "context-overload",
        r"context (window|overload|limit|budget)|token|1100-line|too (large|long) to|reads a different slice|"
        r"\bslice\b|ran out of context|compact",
    ),
    (
        "slow",
        r"\d+\s+rounds|stalled|budget exhausted|ceiling|ping-pong|sighting \d|blocking per round|"
        r"minutes|took .{0,20}longer|wall clock",
    ),
    (
        "tool-or-env",
        r"prettier|formatter|lint-staged|\byarn\b|node_modules|worktree|emulator|\bdist\b|"
        r"bootstrap|stack is owned|usage limit|hit its limit|classifier outage|browser subagent|"
        r"driver agent|cheap model|haiku|hook reformatted|approval hash|\.workflow-state|state engine",
    ),
    (
        "redundant-work",
        r"re-?approv|re-?record|re-?ran|re-?run|regenerat|rework|redid|re-?did|"
        r"already (exists|existed|shipped|done|reported)|duplicat|re-?read the same|re-?derive",
    ),
    (
        "wrong-instruction",
        r"contradict|wrong|incorrect|conflates|mis-?states|misstat|mis-?separates|the rule (is|was) (wrong|too)|"
        r"stale rule|rule .{0,25}(wrong|does not|doesn'?t)",
    ),
    (
        "unclear-instruction",
        r"read as|reads as|ambiguous|unclear|misread|wording|reworded|improvised|interpreted|"
        r"does not say|omits|no crisp|overlapping|malformed|two landing places",
    ),
]
CATEGORY_RULES = [(n, re.compile(p, re.I)) for n, p in CATEGORY_RULES]

ROUNDS = re.compile(r"(\d+)\s+rounds?", re.I)
BLOCKING = re.compile(r"blocking(?: per round)?[:\s]*((?:\d+\s*(?:,|→|->|then|and)?\s*)+)", re.I)
SIGHTING = re.compile(r"sighting\s+(\d+)", re.I)
ROUND_N = re.compile(r"\bround\s+(\d+)\b", re.I)
NDEFECTS = re.compile(r"review found (\d+)", re.I)


def classify(row):
    text = " ".join(row["text"].split())
    kind = row["fileKind"]

    gate, mech = "", ""
    for rx, mfmt, gfmt in GATE_PATTERNS:
        m = rx.match(text)
        if m:
            arg = (m.group(1).lower() if m.groups() and m.group(1) else "")
            gate = gfmt.format(arg)
            mech = mfmt.format(arg)
            break
    if not mech:
        for rx, label in MECH_PATTERNS:
            if rx.match(text):
                mech = label
                break

    if kind in ("retrospective", "upstream-feedback"):
        itype = "retro-proposal"
    elif gate:
        itype = "gate-finding"
    else:
        itype = "friction"

    cat = "other"
    for name, rx in CATEGORY_RULES:
        if rx.search(text):
            cat = name
            break

    out = {
        "repo": row["repo"],
        "run": row.get("branch") or "(merged)",
        "runKey": row["runKey"],
        "date": row["date"],
        "sourceFile": row["file"],
        "sourceSha": row["sha"],
        "sourceSubject": row["subject"],
        "runsSeenIn": len(row.get("runsSeenIn", [])),
        "itemText": text,
        "type": itype,
        "implicatedMechanism": mech or "unknown",
        "category": cat,
    }

    if itype == "gate-finding":
        out["gate"] = gate
        rounds = ROUNDS.search(text)
        sight = SIGHTING.search(text)
        rnd = ROUND_N.search(text)
        out["iteration"] = int(sight.group(1)) if sight else (int(rnd.group(1)) if rnd else (int(rounds.group(1)) if rounds else None))
        out["iterationKind"] = "sighting" if sight else ("round" if rnd else ("total-rounds" if rounds else None))
        b = BLOCKING.search(text)
        out["blockingPerRound"] = [int(x) for x in re.findall(r"\d+", b.group(1))] if b else None
        nd = NDEFECTS.search(text)
        out["findingCount"] = int(nd.group(1)) if nd else None
        low = text.lower()
        out["severity"] = (
            "blocking" if re.search(r"\bblock(ing|er|ed)\b", low) else
            "flagged-by-user" if "user flagged" in low else
            "defect" if "defect" in low or "review found" in low else
            "failure" if "failed" in low or "blocked" in low else ""
        )
        led, csha, csubj, nfiles = following_code_change(row["repoPath"], row["sha"])
        out["ledToCodeChange"] = led
        out["codeChangeSha"] = csha
        out["codeChangeSubject"] = csubj
        out["codeChangeFiles"] = nfiles
    return out


if __name__ == "__main__":
    src = sys.argv[1]
    for line in open(src):
        row = json.loads(line)
        if row["fileKind"] == "progress-log":
            continue
        print(json.dumps(classify(row), ensure_ascii=False))
