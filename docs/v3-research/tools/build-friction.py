#!/usr/bin/env python3
"""Build runs/friction.jsonl: one row per self-reported mise friction / retrospective item.

  build-friction.py <items.jsonl> <subjects.jsonl> <retro.jsonl> > friction.jsonl

Inputs (all produced read-only from git and from Claude Code transcripts):
  items.jsonl     harvest-mise-artifacts.py lines <repo>...      (.mise log files, all refs)
  subjects.jsonl  harvest-mise-artifacts.py subjects <repo>...   (gate rounds in commit subjects)
  retro.jsonl     extract-retro-reports.mjs                      (the retrospective role's report,
                  which it never writes to a file: roles/retrospective.md:60)

Every classified field is read off the item's own text — the labels mise's own rules mandate
(references/interaction.md:19,48,58,64; stages/execute.md:32,46,58,76,97) — or off git. An item
whose mechanism or category the text does not name gets "unknown" / "other", never a guess.
"""

import json
import re
import subprocess
import sys
import os

MISE_REPO = "/Users/eric/Code/mise-claude-plugin"
REPO_PATHS = {}


def git(repo, *args):
    p = subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True, errors="replace")
    return p.stdout if p.returncode == 0 else ""


# ---------- mise version ceiling ------------------------------------------------------------
def version_table():
    """(date, version) for every version published on the plugin repo's main line.

    A run in another repo records when a version landed on main, never which version was
    installed, so this is a ceiling (docs/v3-research/round1-agent-reports.md, run-map gaps)."""
    out = git(MISE_REPO, "log", "--first-parent", "--reverse", "--date=short", "--format=%H|%ad", "refs/remotes/origin/main")
    table = []
    last = None
    for line in out.splitlines():
        if not line.strip():
            continue
        sha, date = line.split("|")
        body = git(MISE_REPO, "show", f"{sha}:.claude-plugin/plugin.json")
        m = re.search(r'"version"\s*:\s*"([^"]+)"', body)
        v = m.group(1) if m else None
        if v and v != last:
            table.append((date, v, sha))
            last = v
    return table


VTABLE = None


def version_ceiling(date):
    global VTABLE
    if VTABLE is None:
        VTABLE = version_table()
    v = None
    for d, ver, _sha in VTABLE:
        if d <= date:
            v = ver
        else:
            break
    return v or "pre-1.0.0"


# ---------- type ----------------------------------------------------------------------------
STALL = re.compile(r"\bstall(ed|s|ing)?\b", re.I)
ROUNDS_REC = re.compile(
    r"^(?:-\s*)?critic\s+[\w ()]*?:\s*(?:.*?\b\d+\s*rounds?|.*?blocking\b|.*?passed on round|.*?sighting\s*\d)",
    re.I,
)
RECUR = re.compile(r"blocker recurred|sighting\s*\d", re.I)
SUBJ_ROUND = re.compile(r"critic round\s*(\d+)|(\d+)\s+critic rounds?|stalled at\s+(\d+)\s+rounds?|round\s*(\d+)", re.I)

ROUNDS_N = re.compile(r"\b(\d+)\s*rounds?\b", re.I)
PASSED_ON = re.compile(r"passed on round\s*(\d+)", re.I)
BLOCKING_LIST = re.compile(r"blocking(?:\s+per\s+round)?[:\s]+([0-9][0-9,\s/–—→>-]*)", re.I)
TRIGGER = re.compile(r"stalled\s*\(([^)]+)\)|stalled (?:at|on)\s+([\w -]+?)(?:\s+after|,|\.|$)", re.I)
GATE_NAME = re.compile(r"^(?:-\s*)?critic\s+(requirements|plan|goals|mocks?)\b", re.I)


def gate_fields(text):
    """Rounds / blocking counts / stall trigger, read off the mandated line shapes."""
    out = {}
    g = GATE_NAME.match(text)
    if g:
        out["gate"] = f"critic {g.group(1).lower()}"
    elif re.match(r"^(?:-\s*)?(execute\s+)?baseline gate", text, re.I):
        out["gate"] = "baseline gate"
    elif re.match(r"^(?:-\s*)?gate\s*:", text, re.I):
        out["gate"] = "end-of-plan gate"
    m = ROUNDS_N.search(text) or PASSED_ON.search(text)
    if m:
        out["rounds"] = int(m.group(1))
    b = BLOCKING_LIST.search(text)
    if b:
        nums = [int(x) for x in re.findall(r"\d+", b.group(1))]
        if nums:
            out["blockingPerRound"] = nums
            out.setdefault("rounds", len(nums))
    s = RECUR.search(text)
    if s:
        n = re.search(r"sighting\s*(\d+)", text, re.I)
        out["sighting"] = int(n.group(1)) if n else None
    if STALL.search(text):
        t = TRIGGER.search(text)
        trig = (t.group(1) or t.group(2) or "").strip().lower() if t else "unnamed"
        # 1.4.0-1.6.0 wrote `stalled at <n> blocking after <N> rounds`: the rule had a single
        # trigger and the number is the count, not a named trigger
        if re.fullmatch(r"\d+\s*blocking", trig):
            trig = f"1.x count rule ({trig})"
        out["stallTrigger"] = trig
    return out


GATE_CONTEXT = re.compile(r"^(?:-\s*)?(critic\b|gate\s*:|sanity-?e2e|baseline gate)|^mise: ", re.I)


def item_type(kind, text):
    if kind in ("retrospective", "upstream-feedback", "retro-report"):
        return "retro-proposal"
    if kind == "commit-subject":
        return "stall" if STALL.search(text) and GATE_CONTEXT.match(text) else "gate-round-record"
    if kind == "friction-log":
        # "stall" is the gate's term; a stalled network stream is not a gate stall
        if STALL.search(text) and GATE_CONTEXT.match(text):
            return "stall"
        if ROUNDS_REC.match(text) or RECUR.search(text):
            return "gate-round-record"
        return "friction"
    return "other"


# ---------- implicated mechanism --------------------------------------------------------------
# 1) the label the item opens with (the shape mise's rules mandate)
LABEL_MECH = [
    (re.compile(r"^(?:-\s*)?critic\s+(requirements|plan|goals|mocks?)\b[\w ()]*:", re.I), "critic gate ({0})"),
    (re.compile(r"^(?:-\s*)?critic\s*:", re.I), "critic gate"),
    (re.compile(r"^(?:-\s*)?task\s+[0-9][0-9._]*[a-z]?\s*(?:fix)?\s*:\s*review found", re.I), "per-task reviewer"),
    (re.compile(r"^(?:-\s*)?task\s+[0-9][0-9._]*[a-z]?\s*:\s*documenter", re.I), "documenter"),
    (re.compile(r"^(?:-\s*)?task\s+[0-9][0-9._]*[a-z]?\s*:\s*(blocked|stuck)", re.I), "implementer (task dispatch)"),
    (re.compile(r"^(?:-\s*)?task\s+[0-9][0-9._]*[a-z]?\s*(?:fix)?\s*:", re.I), "task execution"),
    (re.compile(r"^(?:-\s*)?acceptance\s*:\s*user flagged", re.I), "acceptance pass (user flag)"),
    (re.compile(r"^(?:-\s*)?acceptance\s*:", re.I), "acceptance pass"),
    (re.compile(r"^(?:-\s*)?correction\s*:", re.I), "user correction (in flight)"),
    (re.compile(r"^(?:-\s*)?(execute\s+)?baseline gate\b", re.I), "baseline gate"),
    (re.compile(r"^(?:-\s*)?gate\s*:", re.I), "end-of-plan gate"),
    (re.compile(r"^(?:-\s*)?sanity-?e2e\b", re.I), "end-of-plan gate (sanity/e2e)"),
    (re.compile(r"^(?:-\s*)?goals\s*:", re.I), "goals stage"),
    (re.compile(r"^(?:-\s*)?mocks?\s*:", re.I), "mock stage"),
    (re.compile(r"^(?:-\s*)?requirements\s*:", re.I), "requirements stage"),
    (re.compile(r"^(?:-\s*)?plan\s*:", re.I), "plan stage"),
    (re.compile(r"^(?:-\s*)?execute\s*:", re.I), "execute stage"),
    (re.compile(r"^(?:-\s*)?setup\s*:", re.I), "setup stage"),
    (re.compile(r"^(?:-\s*)?env(ironment)?\s*:", re.I), "environment / tooling"),
    (re.compile(r"^(?:-\s*)?state engine\s*:", re.I), "state engine"),
    (re.compile(r"^(?:-\s*)?delta-?review\s*:", re.I), "delta-review (external tool)"),
    (re.compile(r"^(?:-\s*)?retrospective\b", re.I), "retrospective role"),
    (re.compile(r"^(?:-\s*)?documenter\b", re.I), "documenter"),
    (re.compile(r"^(?:-\s*)?reviewer\b", re.I), "per-task reviewer"),
    (re.compile(r"^(?:-\s*)?implementer\b", re.I), "implementer (task dispatch)"),
    (re.compile(r"^(?:-\s*)?deviations?\b", re.I), "task execution (plan deviation)"),
    (re.compile(r"^mise: revise (\w+).*critic round", re.I), "critic gate ({0})"),
    (re.compile(r"^mise: (\w+) draft through critic round", re.I), "critic gate ({0})"),
    (re.compile(r"^mise: (?:revise )?(\w+) after \d+ critic rounds?", re.I), "critic gate ({0})"),
    (re.compile(r"^mise: (\w+) draft, critic stalled", re.I), "critic gate ({0})"),
]

# 2) failing that, the first mechanism the body names
BODY_MECH = [
    (r"critic gate|the critic\b|a fresh critic|critic prompt|critic round", "critic gate"),
    (r"\bstall (rule|trigger)|ping-pong|third sighting|budget exhausted", "critic gate stall rule"),
    (r"end-of-plan gate|\bthe gate\b", "end-of-plan gate"),
    (r"baseline gate", "baseline gate"),
    (r"\breviewer\b|per-task review|review round", "per-task reviewer"),
    (r"\bdocumenter\b|two-pass|docs pass|prose pass", "documenter"),
    (r"\bimplementer\b|task subagent|fix round", "implementer (task dispatch)"),
    (r"\bacceptance\b", "acceptance pass"),
    (r"retrospective", "retrospective role"),
    (r"\bchecklist\b", "project review checklist"),
    (r"mise[- ]config|the config\b", "mise config"),
    (r"task file|implementation plan|00_overview|the plan\b|plan stage", "plan stage"),
    (r"requirements (doc|stage|artifact)|the requirements\b", "requirements stage"),
    (r"\bgoals\b", "goals stage"),
    (r"\bmocks?\b", "mock stage"),
    (r"state engine|\.workflow-state|approval hash|state\.ts", "state engine"),
    (r"delta[- ]review", "delta-review (external tool)"),
    (r"CLAUDE\.md", "project CLAUDE.md"),
    (r"exploration|explore subagent", "plan-stage explore"),
    (r"setup interview|setup stage", "setup stage"),
]
BODY_MECH = [(re.compile(p, re.I), n) for p, n in BODY_MECH]


def mechanism(text):
    for rx, label in LABEL_MECH:
        m = rx.match(text)
        if m:
            if "{0}" in label:
                return label.format((m.group(1) or "").lower())
            return label
    best = None
    for rx, name in BODY_MECH:
        m = rx.search(text)
        if m and (best is None or m.start() < best[0]):
            best = (m.start(), name)
    return best[1] if best else "unknown"


# ---------- category --------------------------------------------------------------------------
# keyword rules over the verbatim text, most specific first; first hit wins
CATEGORY_RULES = [
    (
        "false-positive-gate",
        r"false[- ](positive|result|negative)|\bnits?\b|nitpick|cosmetic|not (a|an actual|a real) defect|"
        r"no real defect|wasn'?t a defect|overclaim|already correct|misread the code|flagged .{0,40}correct|"
        r"reported .{0,40}as (a )?(failure|defect)|relitigat|restatements of accepted",
    ),
    (
        "missed-defect",
        r"\bmissed\b|slipped (through|past)|went unnoticed|no critic saw|neither .{0,30}saw|invisible to|"
        r"unseen by|escaped|only (found|caught|surfaced) (at|in|by) (acceptance|the user|review)|"
        r"shipped .{0,40}(bug|defect|contradiction)|did not catch|failed to catch|user flagged|user caught",
    ),
    (
        "context-overload",
        r"context (window|overload|limit|budget)|\bK tokens\b|token (budget|cost|spend|tax)|"
        r"1,?100-line|too (large|long) to|reads a different slice|ran out of context|compact(ion|ed)|"
        r"re-?read the same|context (is|was) full",
    ),
    (
        "tool-or-env",
        r"prettier|formatter|lint-staged|\byarn\b|npm\b|node_modules|worktree|emulator|\bdist\b|bootstrap|"
        r"usage limit|rate limit|session limit|quota|hit its limit|outage|hook (reformatted|rewrote)|"
        r"approval hash|\.workflow-state|state engine|state\.ts|typecheck|\bCI\b|playwright|"
        r"browser subagent|git (hook|stash)|delta[- ]review (extension|state)|environment|\benv\b|"
        r"timed out|\btimeouts?\b|flak(e|y)",
    ),
    (
        "wrong-instruction",
        # "wrong" alone is almost always about the code under review, not the instruction:
        # it must be scoped to a rule / doc / task file / plan to count here
        r"contradict|conflates|mis-?state|mis-?separate|measures the wrong|instructed the opposite|"
        r"states its own refutation|actively instructed|stale rule|"
        r"(rule|doc|guide|guidance|config|task file|plan|requirement|instruction)s?\b[^.]{0,40}"
        r"\b(is|was|are|were|says|said|reads?)\b[^.]{0,20}\b(wrong|incorrect|false|stale|backwards)\b|"
        r"\b(wrong|incorrect|stale)\s+(rule|doc|guide|guidance|instruction|config|assumption|claim)",
    ),
    (
        "unclear-instruction",
        r"read as|reads as|ambiguous|ambiguity|unclear|misread|wording|reworded|improvised|interpreted|"
        r"does not say|doesn'?t say|says nothing|omits|no crisp|overlapping|malformed|two landing places|"
        r"never defines|undefined|vs intent|open to|left to the (agent|implementer)",
    ),
    (
        "redundant-work",
        r"re-?approv|re-?record|re-?ran|re-?run|regenerat|rework|redid|re-?did|re-?derive|rediscover|"
        r"already (exists|existed|shipped|done|reported|correct)|duplicat|repeated the same|"
        r"independently (discovered|re-?read)|twice|second time",
    ),
    (
        "slow",
        r"\b\d+\s+rounds?\b|\bminutes?\b|\bhours?\b|wall clock|took .{0,20}longer|serial|slow|"
        r"blocking per round|sighting \d|budget exhausted|ceiling|ping-pong|stalled",
    ),
]
CATEGORY_RULES = [(n, re.compile(p, re.I)) for n, p in CATEGORY_RULES]


def category(text):
    for name, rx in CATEGORY_RULES:
        if rx.search(text):
            return name
    return "other"


# ---------- retrospective report parsing ------------------------------------------------------
PROP_START = re.compile(r"^\s{0,3}(?:\*\*)?(\d{1,2})[.)]\s+(?!\d)(.{3,})$")
RECOMMEND = re.compile(r"Recommend:\s*adopt\s*([^\n]*)", re.I)
KIND_PAREN = re.compile(r"\(([^)]{3,40})\)")
TARGET = re.compile(r"`([^`]+)`|\*\*([^*]+)\*\*")


def split_proposals(report):
    """The role file mandates a numbered list, each item `<target file> (<kind>)` with Edit /
    Covers / Incident lines (roles/retrospective.md:47-54). Split on the numbering."""
    lines = report.split("\n")
    starts = []
    for i, ln in enumerate(lines):
        m = PROP_START.match(ln)
        if not m:
            continue
        # a numbered item inside a fenced block or an indented sub-list is not a proposal
        if ln.startswith(("    ", "\t")):
            continue
        starts.append((i, int(m.group(1))))
    # keep only a monotone 1..N run (numbered proposals), dropping stray numbered prose
    keep = []
    expect = 1
    for i, n in starts:
        if n == expect:
            keep.append(i)
            expect += 1
    props = []
    for a, b in zip(keep, keep[1:] + [len(lines)]):
        text = "\n".join(lines[a:b]).strip()
        if len(text) > 15:
            props.append(text)
    return props


def proposal_meta(text):
    head = text.split("\n", 1)[0]
    t = TARGET.search(head)
    target = (t.group(1) or t.group(2)).strip() if t else ""
    k = KIND_PAREN.search(head)
    kind = k.group(1).strip().lower() if k else ""
    edit = ""
    m = re.search(r"-\s*Edit:\s*(.*?)(?=\n\s*-\s*(?:Covers|Incident):|\Z)", text, re.S | re.I)
    if m:
        edit = m.group(1).strip()
    return target, kind, edit


PLUGIN_TARGET = re.compile(r"plugin[- ]candidate|mise plugin|skills/next|upstream", re.I)


def distinctive(edit_text, n=60):
    """Longest plain prose run inside the proposed edit, used as a -S needle."""
    body = re.sub(r"```[a-z]*", "", edit_text)
    cands = [ln.strip(" -`*>") for ln in body.split("\n")]
    cands = [c for c in cands if len(c) >= 25 and not c.startswith("#")]
    cands.sort(key=len, reverse=True)
    for c in cands[:3]:
        # a mid-sentence slice survives renumbering and surrounding edits
        s = c[:n] if len(c) <= n + 20 else c[10 : 10 + n]
        if len(s) >= 25:
            return s
    return ""


STOP = set(
    """the a an and or of to in for on with that this it is are was were be been as at by from not no
    but if then than so such into over under only also any each every their its it's your our we you i
    when where which who whom what how why all both few more most other some own same can will just
    should now rule edit covers incident file line lines text add adds added change changed one two""".split()
)


def rare_tokens(text, n=12):
    toks = [t for t in re.findall(r"[a-zA-Z][a-zA-Z0-9_.\-/]{5,}", text.lower()) if t not in STOP]
    seen = []
    for t in toks:
        if t not in seen:
            seen.append(t)
    # longest tokens first: the rarest words in an edit are its identifiers and coined phrases
    seen.sort(key=len, reverse=True)
    return seen[:n]


HEAD_TEXT = {}


def head_text(repo, target):
    """Current text of the proposal's target file (or the repo's guidance files) at HEAD."""
    key = (repo, target)
    if key in HEAD_TEXT:
        return HEAD_TEXT[key]
    body = ""
    cands = []
    if target:
        t = target.strip().strip("`")
        cands.append(t)
        cands.append(t.lstrip("./"))
    for c in cands:
        body = git(repo, "show", f"HEAD:{c}")
        if body:
            break
    if not body and target:
        # the file may have been renamed or the target is a section, not a path: fall back to
        # every guidance file the config can name
        for c in (".claude/mise-checklist.md", ".claude/mise-config.md", "CLAUDE.md"):
            body += git(repo, "show", f"HEAD:{c}")
    HEAD_TEXT[key] = body
    return body


def token_adoption(repo, target, text):
    """Fraction of the proposal's rare tokens present in the target file today.

    A proposal is applied by a human editor, so its exact sentence rarely survives verbatim;
    the identifiers and coined phrases it introduces do."""
    toks = rare_tokens(text)
    if not toks or not os.path.isdir(repo):
        return None, 0, 0
    body = head_text(repo, target).lower()
    if not body:
        return None, 0, len(toks)
    hit = sum(1 for t in toks if t in body)
    return round(hit / len(toks), 2), hit, len(toks)


ADOPT_CACHE = {}


def adopted(repo, needle, pathspec=None):
    if not needle or not os.path.isdir(repo):
        return None, ""
    key = (repo, needle, pathspec)
    if key in ADOPT_CACHE:
        return ADOPT_CACHE[key]
    args = ["log", "--all", "--date=short", "--format=%H|%ad|%s", f"-S{needle}"]
    if pathspec:
        args += ["--", pathspec]
    out = git(repo, *args).strip()
    res = (False, "")
    if out:
        first = out.splitlines()[-1]
        res = (True, first)
    ADOPT_CACHE[key] = res
    return res


# ---------- rows --------------------------------------------------------------------------------
def verdict(exact, token_share):
    """adopted | likely-adopted | not-found | undetermined, from the two independent signals."""
    if exact:
        return "adopted"
    if token_share is None:
        return "undetermined"
    if token_share >= 0.7:
        return "likely-adopted"
    if token_share >= 0.4:
        return "partly-present"
    return "not-found"


def base_row(**kw):
    return kw


def rows_from_items(path):
    for line in open(path):
        r = json.loads(line)
        text = " ".join(r["text"].split())
        kind = r["fileKind"]
        t = item_type(kind, text)
        # "Deviations from plan: none." with nothing after it reports no item
        none_dev = bool(re.match(r"^deviations? from plan\s*:\s*(none|no deviations?)\b", text, re.I)) and len(text) < 130
        row = {
            "repo": r["repo"],
            "run": r.get("branch") or r["runKey"],
            "branch": r.get("branch"),
            "runKey": r["runKey"],
            "date": r["date"],
            "miseVersionCeiling": version_ceiling(r["date"]),
            "sourcePath": r["file"],
            "sourceKind": kind,
            "sourceSha": r["sha"],
            "sourceSubject": r["subject"],
            "heading": r.get("heading", ""),
            "itemText": text,
            "type": t,
            "implicatedMechanism": mechanism(text),
            "category": category(text),
            "seenInRuns": len(r.get("runsSeenIn", [])),
            "branchesSeenIn": r.get("branchesSeenIn", []),
            "reportsNothing": none_dev,
        }
        if t in ("gate-round-record", "stall"):
            row.update(gate_fields(text))
        yield row


def rows_from_subjects(path):
    for line in open(path):
        r = json.loads(line)
        text = r["text"]
        t = item_type("commit-subject", text)
        row = {
            "repo": r["repo"],
            "run": r["branch"],
            "branch": r["branch"],
            "runKey": r["runKey"],
            "date": r["date"],
            "miseVersionCeiling": version_ceiling(r["date"]),
            "sourcePath": "(commit subject)",
            "sourceKind": "commit-subject",
            "sourceSha": r["sha"],
            "sourceSubject": r["subject"],
            "heading": "",
            "itemText": text,
            "type": t,
            "implicatedMechanism": mechanism(text),
            "category": category(text),
            "seenInRuns": 1,
            "branchesSeenIn": [r["branch"]],
        }
        g = gate_fields(text)
        m = SUBJ_ROUND.search(text)
        if m and "rounds" not in g:
            g["rounds"] = int(next(x for x in m.groups() if x))
        row.update(g)
        yield row


REPO_OF_DIR = {}


def repo_for(project_dir, cwds):
    for c in cwds or []:
        base = c.split("/Users/eric/Code/", 1)[-1]
        name = base.split("/")[0].split(".worktrees")[0]
        if os.path.isdir(f"/Users/eric/Code/{name}"):
            return name
    m = re.match(r"-Users-eric-Code-([a-z0-9-]+?)(?:-worktrees-.*)?$", project_dir)
    if m:
        cand = m.group(1)
        for name in (cand, cand.replace("ericvera-dev", "ericvera.dev")):
            if os.path.isdir(f"/Users/eric/Code/{name}"):
                return name
    return project_dir


def rows_from_retro(path):
    for line in open(path):
        r = json.loads(line)
        report = r.get("report") or ""
        repo = repo_for(r["projectDir"], r.get("cwds"))
        branch = next((b for b in (r.get("branches") or []) if b not in ("main", "master", "HEAD")), None)
        if not branch:
            m = re.search(r"-worktrees-(.+)$", r["projectDir"])
            branch = m.group(1).replace("-", "/", 1) if m else "(unknown)"
        date = (r.get("ts") or "")[:10]
        props = split_proposals(report)
        rec = RECOMMEND.search(report)
        recommended = set(re.findall(r"\d+", rec.group(1))) if rec else set()
        if not props:
            yield {
                "repo": repo,
                "run": branch,
                "branch": branch,
                "runKey": r["agentId"],
                "date": date,
                "miseVersionCeiling": version_ceiling(date) if date else None,
                "sourcePath": r.get("transcript") or "(transcript deleted)",
                "sourceKind": "retro-report",
                "sourceSha": None,
                "sourceAgentId": r["agentId"],
                "sourceSubject": "",
                "heading": "",
                "itemText": " ".join(report.split())[:4000],
                "type": "retro-proposal" if report.strip() else "other",
                "implicatedMechanism": mechanism(report) if report.strip() else "unknown",
                "category": category(report) if report.strip() else "other",
                "seenInRuns": 1,
                "branchesSeenIn": [branch],
                "proposalParsed": False,
                "reportChars": r.get("reportChars", 0),
                "note": "no numbered proposals parsed" if report.strip() else "report text not recoverable",
            }
            continue
        for i, p in enumerate(props, 1):
            target, kind, edit = proposal_meta(p)
            text = " ".join(p.split())
            needle = distinctive(edit or p)
            in_mise = None
            in_mise_ev = ""
            plugin_cand = bool(PLUGIN_TARGET.search(kind or "") or PLUGIN_TARGET.search(target or ""))
            if plugin_cand or repo == "mise-claude-plugin":
                in_mise, in_mise_ev = adopted(MISE_REPO, needle)
            proj_adopted, proj_ev = adopted(f"/Users/eric/Code/{repo}", needle) if repo != "mise-claude-plugin" else (None, "")
            tok_share, tok_hit, tok_n = token_adoption(f"/Users/eric/Code/{repo}", target, edit or p)
            if plugin_cand or repo == "mise-claude-plugin":
                mtok, mhit, mn = token_adoption(MISE_REPO, target if repo == "mise-claude-plugin" else "", edit or p)
            else:
                mtok = mhit = None
                mn = 0
            yield {
                "repo": repo,
                "run": branch,
                "branch": branch,
                "runKey": r["agentId"],
                "date": date,
                "miseVersionCeiling": version_ceiling(date) if date else None,
                "sourcePath": r.get("transcript") or "(transcript deleted)",
                "sourceKind": "retro-report",
                "sourceSha": None,
                "sourceAgentId": r["agentId"],
                "sourceSubject": "",
                "heading": f"proposal {i}",
                "itemText": text,
                "type": "retro-proposal",
                "implicatedMechanism": mechanism(p),
                "category": category(p),
                "seenInRuns": 1,
                "branchesSeenIn": [branch],
                "proposalParsed": True,
                "proposalTarget": target,
                "proposalKind": kind,
                "proposalRecommended": str(i) in recommended if recommended else None,
                "isPluginCandidate": plugin_cand,
                "adoptionNeedle": needle,
                "adoptedInMise": in_mise,
                "adoptedInMiseEvidence": in_mise_ev,
                "adoptedInProject": proj_adopted,
                "adoptedInProjectEvidence": proj_ev,
                "targetTokenShareProject": tok_share,
                "targetTokenHitsProject": f"{tok_hit}/{tok_n}" if tok_share is not None else None,
                "targetTokenShareMise": mtok,
                "adoptedVerdict": verdict(proj_adopted, tok_share) if repo != "mise-claude-plugin" else verdict(in_mise, mtok),
            }


def main():
    items, subjects, retro = sys.argv[1], sys.argv[2], sys.argv[3]
    out = []
    out += list(rows_from_items(items))
    out += list(rows_from_subjects(subjects))
    out += list(rows_from_retro(retro))
    # adoption for the file-based retro proposals (_upstream-feedback.md, retrospective_notes.md)
    for row in out:
        if row["type"] == "retro-proposal" and row["sourceKind"] in ("upstream-feedback", "retrospective"):
            needle = distinctive(row["itemText"])
            row["adoptionNeedle"] = needle
            row["isPluginCandidate"] = row["sourceKind"] == "upstream-feedback"
            a, ev = adopted(MISE_REPO, needle)
            row["adoptedInMise"] = a
            row["adoptedInMiseEvidence"] = ev
            tok, hit, n = token_adoption(MISE_REPO, "skills/next/references/interaction.md", row["itemText"])
            row["targetTokenShareMise"] = tok
            row["targetTokenHitsMise"] = f"{hit}/{n}" if tok is not None else None
            row["adoptedVerdict"] = verdict(a, tok)
    for row in out:
        print(json.dumps(row, ensure_ascii=False))


if __name__ == "__main__":
    main()
