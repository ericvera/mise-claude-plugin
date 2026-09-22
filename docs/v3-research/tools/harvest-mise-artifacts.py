#!/usr/bin/env python3
"""Harvest mise self-reported artifacts (.mise/) from any repo, read-only.

Usage:
  harvest-mise-artifacts.py inventory <repo>...      # every path ever added under .mise
  harvest-mise-artifacts.py lastversions <repo>...   # last surviving version of every .mise path
  harvest-mise-artifacts.py lines <repo>...          # per-line rows from log-shaped .mise files
  harvest-mise-artifacts.py subjects <repo>...       # commit subjects that record a gate round/stall

Only non-mutating git plumbing/porcelain is used (log, show, cat-file, for-each-ref,
branch --contains). Nothing is written outside stdout.

Log-shaped files grow by appending, so the same line repeats across many commits of one
run. We reconstruct runs by prefix-chaining successive blob versions of a path: version B
continues run R when R's newest line list is a prefix of B's. Each line is then attributed
to the commit that first appended it.
"""

import json
import re
import subprocess
import sys
from collections import OrderedDict

LABEL = re.compile(r"^[A-Za-z][A-Za-z0-9 _/()\u2011\-]{0,55}:\s")
# Measured: splitting on any `<word>: ` that follows a sentence end cuts real sentences in half
# (`... `all: unset` makes properties inherit: body copy ...`), so only the labels mise's own
# rules mandate (STRONG) break an item. Kept for reference; not applied.
SPLIT = re.compile(r'(?<=[.!?)"`*\u201d])\s+(?=[A-Za-z][A-Za-z0-9 _/()\u2011\-]{0,55}:\s)')
# the labels mise's own rules mandate; unambiguous enough to break an item mid-sentence,
# which matters because entries are appended without a blank line between them
STRONG = re.compile(
    # lookbehinds keep a compound label ("critic requirements:", "baseline gate:",
    # "execute baseline gate:") from being cut at its own second word
    r"(?<!critic)(?<!baseline)(?<!execute)\s+"
    r"(?=(?:correction|acceptance|gate|goals|env|requirements|setup|mocks?|"
    r"delta-review|sanity-e2e|baseline gate|execute baseline gate|retrospective|"
    r"documenter|reviewer|implementer|"
    r"critic (?:requirements|plan|goals|mocks?)[^:\n]{0,30}|"
    r"task [0-9][0-9._]*[a-z]?)"
    r": )",
    re.I,
)

# path basename -> kind
KINDS = {
    "_friction.md": "friction-log",
    "retrospective_notes.md": "retrospective",
    "_upstream-feedback.md": "upstream-feedback",
    "_progress.md": "progress-log",
    "_progress-09-02.md": "progress-log",
    "_progress-09-03.md": "progress-log",
    "notes-execution.md": "notes",
    "_checklist_archive.md": "checklist-archive",
    "_exploration_notes.md": "exploration-notes",
    "_exploration_notes_part2.md": "exploration-notes",
    "feedback.json": "mock-review-feedback",
    ".workflow-state": "state",
    "goals.md": "artifact",
    "requirements.md": "artifact",
    "00_overview.md": "artifact",
    "mocks.html": "artifact",
    "mocks.context.md": "artifact",
}

# files whose content is a growing log we mine line by line
LINE_KINDS = {"friction-log", "retrospective", "upstream-feedback", "progress-log", "notes"}

# Delta Review state refs record a file the branch deleted as this one-line placeholder
# (docs/v3-research/runs/okven-runs.md); such a blob is not a version of the file.
DELETED_PLACEHOLDER = "delta-review: file deleted"


def git(repo, *args):
    p = subprocess.run(
        ["git", "-C", repo, *args], capture_output=True, text=True, errors="replace"
    )
    if p.returncode != 0:
        return ""
    return p.stdout


def kind_of(path):
    base = path.rsplit("/", 1)[-1]
    if base in KINDS:
        return KINDS[base]
    if base.endswith(".md") and "/implementation_plan/" in path:
        return "task-file"
    return "other"


def added_paths(repo):
    """Every path ever added under .mise, with the sha/date of its first add."""
    out = git(
        repo,
        "log",
        "--all",
        "--diff-filter=A",
        "--name-only",
        "--date=short",
        "--pretty=format:@@@%H|%ad|%s",
        "--",
        ".mise",
    )
    rows = OrderedDict()
    sha = date = subj = ""
    for line in out.splitlines():
        if line.startswith("@@@"):
            sha, date, subj = line[3:].split("|", 2)
        elif line.strip():
            rows.setdefault(line, {"path": line, "firstAddSha": sha, "firstAddDate": date, "firstAddSubject": subj})
    return list(rows.values())


def versions(repo, path, split_labels=True):
    """Every (commit, date, subject, blob) version of path across all refs, oldest first."""
    out = git(
        repo,
        "log",
        "--all",
        "--date=iso-strict",
        "--pretty=format:%H|%ad|%s",
        "--",
        path,
    )
    commits = []
    for line in out.splitlines():
        if not line.strip():
            continue
        sha, date, subj = line.split("|", 2)
        commits.append((sha, date, subj))
    # oldest first BY AUTHOR DATE: `git log` orders by committer date, and a rebased branch
    # (okven's backup/pre-rebase-*) carries committer dates months after the work, which would
    # otherwise date an item to the Delta Review snapshot that merely copied it
    commits.sort(key=lambda c: c[1])
    vs = []
    by_blob = {}
    for sha, date, subj in commits:
        ls = git(repo, "ls-tree", "-r", "--full-tree", sha, "--", path).split()
        if len(ls) < 3:
            continue  # deleted at this commit
        blob = ls[2]
        if blob in by_blob:
            # same content reachable from several refs (rebase, worktree, delta-review
            # state duplicates): keep the earliest commit only
            continue
        body = git(repo, "cat-file", "-p", blob)
        if body.strip() == DELETED_PLACEHOLDER:
            continue
        v = {
            "sha": sha,
            "date": date,
            "subject": subj,
            "blob": blob,
            "lines": [ln.rstrip() for ln in body.splitlines()],
        }
        # chain on items, not physical lines: the repo formatter re-wraps these
        # files, so line breaks are not stable across versions of one run
        v["items"] = items_of(v["lines"], split_labels)
        v["norm"] = [norm(t) for _h, t in v["items"]]
        by_blob[blob] = v
        vs.append(v)
    return vs


def norm(line):
    """Content key for a log line: bullet markers and whitespace are cosmetic and get
    reflowed between versions of the same run."""
    s = line.strip()
    while s[:2] in ("- ", "* "):
        s = s[2:].strip()
    return " ".join(s.split()).lower()


def chain_runs(vs):
    """Group versions of one path into runs. Log files only ever grow, so two versions
    belong to the same run when one's normalized line list is a prefix of the other's.
    Shortest-first assignment makes this independent of commit-date ordering across
    branches."""
    order = sorted(vs, key=lambda v: (len(v["norm"]), v["date"]))
    runs = []  # each: {"versions": [...]} kept longest-last
    for v in order:
        best, best_len = None, -1
        for r in runs:
            prev = r["versions"][-1]["norm"]
            if len(prev) <= len(v["norm"]) and v["norm"][: len(prev)] == prev:
                if len(prev) > best_len:
                    best, best_len = r, len(prev)
        if best is None:
            runs.append({"versions": [v]})
        else:
            best["versions"].append(v)
    for r in runs:
        r["versions"].sort(key=lambda v: (len(v["norm"]), v["date"]))
    return runs


REFMAP_CACHE = {}


def ref_map(repo):
    """sha -> [ref names], over EVERY ref, not just branches.

    `git branch --contains` sees refs/heads and refs/remotes only. For runs whose branch was
    deleted after a squash merge the only surviving record is a Delta Review state ref
    (refs/review/<branch>), an orphan chain sharing no history with main, so those must be
    walked too."""
    if repo in REFMAP_CACHE:
        return REFMAP_CACHE[repo]
    m = {}
    refs = [r for r in git(repo, "for-each-ref", "--format=%(refname)").splitlines() if r.strip()]
    refs.append("HEAD")
    for ref in refs:
        if ref.endswith("/HEAD"):
            continue
        for sha in git(repo, "rev-list", ref).split():
            m.setdefault(sha, []).append(ref)
    REFMAP_CACHE[repo] = m
    return m


def branch_of(repo, sha):
    """The work branch a commit belongs to, from any ref namespace."""
    refs = ref_map(repo).get(sha, [])
    names = []
    for r in refs:
        n = r
        for pre in ("refs/heads/", "refs/remotes/origin/", "refs/review/", "refs/review-notes/", "refs/remotes/"):
            if n.startswith(pre):
                n = n[len(pre) :]
                break
        names.append(n)
    work = [
        n
        for n in names
        if n not in ("main", "master", "HEAD", "stash")
        and not n.startswith("backup/")
        and not n.startswith("refs/stash")
    ]
    if work:
        return sorted(work, key=len)[0], refs
    return (names[0] if names else "(unreferenced)"), refs


def good_branch(b):
    return b not in ("(unreferenced)", "main", "master", "HEAD", "stash") and not b.startswith(
        ("backup/", "refs/stash")
    )


def code_touch(repo, sha):
    """non-.mise paths changed by this commit"""
    out = git(repo, "show", "--name-only", "--pretty=format:", sha)
    paths = [p for p in out.splitlines() if p.strip()]
    return [p for p in paths if not p.startswith(".mise/")]


def next_commits(repo, sha, n=3):
    """The n commits following sha on the first branch that contains it."""
    out = git(repo, "rev-list", "--all", "--children", "--max-count=1", sha)
    kids = out.split()[1:] if out.split() else []
    res, cur = [], kids[:1]
    while cur and len(res) < n:
        c = cur[0]
        res.append(c)
        out = git(repo, "rev-list", "--all", "--children", "--max-count=1", c)
        cur = out.split()[1:2]
    return res


def cmd_inventory(repos):
    for repo in repos:
        name = repo.rstrip("/").rsplit("/", 1)[-1]
        for row in added_paths(repo):
            row["repo"] = name
            row["kind"] = kind_of(row["path"])
            print(json.dumps(row, ensure_ascii=False))


def items_of(lines, split_labels=True):
    """Split a markdown log into logical items, independently of hard-wrapping.

    These files live inside the repo, so the project formatter re-wraps them between
    commits; splitting on physical lines makes the "same" item look different across
    versions. So: join each bullet / paragraph into one string first, then split that
    string wherever a new `<stage or task>: ` label starts a sentence — the format the
    friction log mandates (skills/next/references/interaction.md:19)."""
    out = []
    heads = []
    block = []

    def emit(raw):
        text = " ".join(x.strip() for x in raw).strip().lstrip("-* ").strip()
        if not text:
            return
        cuts = (
            sorted({0, len(text)} | {m.start() for m in STRONG.finditer(text)})
            if split_labels
            else [0, len(text)]
        )
        for a, b in zip(cuts, cuts[1:]):
            piece = text[a:b].strip()
            if piece:
                out.append((" > ".join(heads), piece))

    def flush():
        if not block:
            return
        bullets = [i for i, l in enumerate(block) if l.lstrip()[:2] in ("- ", "* ") and not l.startswith("  ")]
        if bullets:
            for a, b in zip(bullets, bullets[1:] + [len(block)]):
                emit(block[a:b])
        else:
            emit(block)
        block.clear()

    for ln in lines:
        s = ln.strip()
        if not s:
            flush()
            continue
        if s.startswith("#"):
            flush()
            lvl = len(s) - len(s.lstrip("#"))
            heads = heads[: lvl - 1] + [s.lstrip("# ").strip()]
            continue
        block.append(ln)
    flush()
    return out


def run_key(repo, sha, path, cache):
    """Identify the mise run a version belongs to by the blob the log file had when it was
    first created on this line of history. Blob identity survives rebase and cherry-pick,
    which commit shas do not, and a run creates its log exactly once.

    Caveat: a run that deletes and re-creates the file (a restart) reads as two runs, and
    two runs whose first entry is byte-identical read as one."""
    key = (sha, path)
    if key in cache:
        return cache[key]
    add = git(repo, "log", sha, "--diff-filter=A", "-n", "1", "--format=%H|%ad", "--date=short", "--", path).strip()
    if not add:
        res = {"runKey": "noadd:" + sha[:12], "runStartSha": sha, "runStartDate": ""}
    else:
        gsha, gdate = add.split("|")
        ls = git(repo, "ls-tree", "-r", "--full-tree", gsha, "--", path).split()
        blob = ls[2] if len(ls) >= 3 else gsha
        res = {"runKey": blob[:12], "runStartSha": gsha, "runStartDate": gdate}
    cache[key] = res
    return res


def cmd_lastversions(repos):
    """The last surviving version of every .mise path, per run-chain.

    `.mise/` is deleted at close-out, so 'the file as the run left it' is the newest blob that
    still exists in some tree, not the state of any ref tip."""
    for repo in repos:
        name = repo.rstrip("/").rsplit("/", 1)[-1]
        for row in added_paths(repo):
            path = row["path"]
            kind = kind_of(path)
            vs = versions(repo, path, split_labels=kind != "progress-log")
            if not vs:
                print(json.dumps({**row, "repo": name, "kind": kind, "versions": 0, "runs": 0}, ensure_ascii=False))
                continue
            for run in chain_runs(vs):
                last = run["versions"][-1]
                branch, refs = branch_of(repo, last["sha"])
                print(
                    json.dumps(
                        {
                            "repo": name,
                            "path": path,
                            "kind": kind,
                            "firstAddSha": row["firstAddSha"],
                            "firstAddDate": row["firstAddDate"],
                            "versionsInChain": len(run["versions"]),
                            "lastSha": last["sha"],
                            "lastBlob": last["blob"],
                            "lastDate": last["date"][:10],
                            "lastSubject": last["subject"],
                            "lastLines": len(last["lines"]),
                            "lastItems": len(last["items"]),
                            "branch": branch,
                            "refs": refs[:6],
                        },
                        ensure_ascii=False,
                    )
                )


GATE_SUBJECT = re.compile(
    r"critic round\s*(\d+)|after\s+(\d+)\s+critic rounds?|critic stalled at\s+(\d+)\s+rounds?|"
    r"(?:gate|critic)[^,]*\bround\s*(\d+)|stalled on (budget|ping-pong|third sighting)",
    re.I,
)


def cmd_subjects(repos):
    """Commit subjects that record a gate round or a stall. Independent of .mise/ survival:
    the subject stays in history after the run deletes its mise directory."""
    for repo in repos:
        name = repo.rstrip("/").rsplit("/", 1)[-1]
        out = git(repo, "log", "--all", "--date=short", "--pretty=format:%H|%ad|%s")
        seen = set()
        for line in out.splitlines():
            if not line.strip():
                continue
            sha, date, subj = line.split("|", 2)
            if not subj.lower().startswith("mise:"):
                continue
            if not GATE_SUBJECT.search(subj):
                continue
            branch, refs = branch_of(repo, sha)
            # rebase / review-ref copies repeat a subject inside one run; two different runs
            # can legitimately carry the same subject, so dedupe per branch, not globally
            if (subj, branch) in seen:
                continue
            seen.add((subj, branch))
            print(
                json.dumps(
                    {
                        "repo": name,
                        "repoPath": repo,
                        "file": "(commit subject)",
                        "fileKind": "commit-subject",
                        "heading": "",
                        "runKey": branch,
                        "runStartSha": sha,
                        "runStartDate": date,
                        "runsSeenIn": [branch],
                        "branch": branch,
                        "sha": sha,
                        "date": date,
                        "subject": subj,
                        "text": subj,
                    },
                    ensure_ascii=False,
                )
            )


DEVIATION = re.compile(r"^deviations?\b", re.I)


def cmd_lines(repos):
    bcache, rcache = {}, {}
    for repo in repos:
        name = repo.rstrip("/").rsplit("/", 1)[-1]
        paths = sorted({r["path"] for r in added_paths(repo) if kind_of(r["path"]) in LINE_KINDS})
        for path in paths:
            kind = kind_of(path)
            # One row per distinct item text. The same item repeats across every later
            # version of its own run's log, and across rebase/worktree copies of it, so
            # the row is keyed on the text and attributed to its earliest commit; every
            # run and commit it was seen in is kept on the row.
            split = kind != "progress-log"
            first = {}
            runs = {}
            branches = {}
            for v in versions(repo, path, split):
                rk = run_key(repo, v["sha"], path, rcache)
                br, _refs = branch_of(repo, v["sha"])
                for heading, item in items_of(v["lines"], split):
                    # a progress log is per-task narrative; only its Deviations bullets are
                    # self-reported friction (roles/retrospective.md:9 names them as the source)
                    if kind == "progress-log" and not DEVIATION.match(item):
                        continue
                    k = norm(item)
                    # The same text reappears in every later version of its run and in every
                    # rebase / review-ref copy. Date and sha come from the EARLIEST version that
                    # carried it (when the run wrote it); the branch comes from the earliest copy
                    # a ref still names, which is often a later Delta-Review snapshot.
                    if k not in first:
                        first[k] = [v, heading, item, br, v]
                    elif not good_branch(first[k][3]) and good_branch(br):
                        first[k][3] = br
                        first[k][4] = v
                    runs.setdefault(k, set()).add(rk["runKey"])
                    branches.setdefault(k, set()).add(br)
            for k, (v, heading, item, br, vbr) in first.items():
                rk = run_key(repo, v["sha"], path, rcache)
                refs = branch_of(repo, vbr["sha"])[1]
                print(
                    json.dumps(
                        {
                            "repo": name,
                            "repoPath": repo,
                            "file": path,
                            "fileKind": kind,
                            "heading": heading,
                            **rk,
                            "runsSeenIn": sorted(runs[k]),
                            "branchesSeenIn": sorted(branches[k]),
                            "branch": br,
                            "refs": refs[:6],
                            "sha": v["sha"],
                            "date": v["date"][:10],
                            "subject": v["subject"],
                            "branchSha": vbr["sha"],
                            "branchDate": vbr["date"][:10],
                            "text": item,
                        },
                        ensure_ascii=False,
                    )
                )


def cmd_codeafter(repos_and_shas):
    """stdin: json lines with repo+sha; adds code-change signal"""
    for line in sys.stdin:
        row = json.loads(line)
        repo = row["repoPath"]
        sha = row["sha"]
        row["codeInSameCommit"] = code_touch(repo, sha)
        row["nextShas"] = next_commits(repo, sha, 3)
        row["codeInNext"] = {c: code_touch(repo, c) for c in row["nextShas"]}
        print(json.dumps(row, ensure_ascii=False))


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "inventory":
        cmd_inventory(sys.argv[2:])
    elif cmd == "lastversions":
        cmd_lastversions(sys.argv[2:])
    elif cmd == "subjects":
        cmd_subjects(sys.argv[2:])
    elif cmd == "lines":
        cmd_lines(sys.argv[2:])
    elif cmd == "codeafter":
        cmd_codeafter(sys.argv[2:])
    else:
        sys.exit("unknown command: " + cmd)
