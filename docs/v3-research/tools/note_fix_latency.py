#!/usr/bin/env python3
"""Measure note -> fix latency from Delta Review state snapshots.

refs/review/<branch> is a chain of "delta-review state" commits, each a snapshot
of the branch's changed files written by the extension as work proceeds. For a
note on <file>:<line> at time T we take the snapshot blob of <file> at the last
commit <= T, then walk forward to the first commit > T whose blob for <file>
differs. That commit's committer time is the first observed edit of the file
after the note, i.e. the upper bound on when the fix landed and the lower bound
on the note's age when touched. Read-only git.

Emits JSONL to stdout, one row per measurable note.
"""
import json
import subprocess
import sys
from datetime import datetime

REPOS = {
    'okven': '/Users/eric/Code/okven',
    'firebase-kit': '/Users/eric/Code/firebase-kit',
    'ericvera.dev': '/Users/eric/Code/ericvera.dev',
    'mise-claude-plugin': '/Users/eric/Code/mise-claude-plugin',
}
SRC = '/Users/eric/Code/mise-claude-plugin/docs/v3-research/runs/delta-notes.jsonl'


def git(repo, *a):
    return subprocess.run(['git', '-C', repo, *a], capture_output=True, text=True)


_hist = {}


def history(repo, branch, path):
    """[(sha, dt, blobsha)] newest-first for path on refs/review/<branch>."""
    key = (repo, branch, path)
    if key in _hist:
        return _hist[key]
    r = git(repo, 'log', '--format=%H %cI', f'refs/review/{branch}', '--', path)
    out = []
    if r.returncode == 0:
        for line in r.stdout.splitlines():
            sha, iso = line.split(' ', 1)
            out.append((sha, datetime.fromisoformat(iso)))
    _hist[key] = out
    return out


def main():
    rows = [json.loads(l) for l in open(SRC)]
    rows = [r for r in rows if not r.get('duplicateArchiveEntry')]
    for n in rows:
        repo = REPOS.get(n['repo'])
        if not repo:
            continue
        hist = history(repo, n['branch'], n['file'])
        if len(hist) < 2:
            continue
        t = datetime.fromisoformat(n['date'].replace('Z', '+00:00'))
        after = [c for c in hist if c[1] > t]
        if not after:
            continue
        # history is newest-first; the earliest commit after t is the last of `after`
        fix = after[-1]
        before = [c for c in hist if c[1] <= t]
        base = before[0] if before else None
        print(json.dumps({
            'row': n['row'], 'repo': n['repo'], 'branch': n['branch'],
            'category': n['category'], 'file': n['file'], 'line': n['line'],
            'noteTs': n['date'], 'fixTs': fix[1].isoformat(), 'fixSha': fix[0][:9],
            'baseSha': base[0][:9] if base else None,
            'latencyMin': round((fix[1] - t).total_seconds() / 60, 1),
            'snapshotsAfter': len(after), 'status': n['status'],
            'turnCount': n['turnCount'],
        }))


if __name__ == '__main__':
    main()
