#!/usr/bin/env python3
"""Note -> fix-commit latency, measured from the commit SHAs the agent cites.

Many Delta Review responses name the commit that carried the fix ("Commit
bb669d9fa", "fixed in 7dac9c9e6"). Those SHAs are resolvable in the repo's
object DB even for deleted branches. For each note we take the earliest cited
commit whose committer date is after the note and inside a 30-day window, and
report the gap. This is an independent measure of the snapshot-based one in
note_fix_latency.py: it needs no assumption about what a Delta Review autosave
captured. Read-only git.
"""
import json
import re
import subprocess
from datetime import datetime, timedelta

REPOS = {
    'okven': '/Users/eric/Code/okven',
    'firebase-kit': '/Users/eric/Code/firebase-kit',
    'ericvera.dev': '/Users/eric/Code/ericvera.dev',
    'mise-claude-plugin': '/Users/eric/Code/mise-claude-plugin',
}
SRC = '/Users/eric/Code/mise-claude-plugin/docs/v3-research/runs/delta-notes.jsonl'
SHA = re.compile(r'\b([0-9a-f]{9,40})\b')
_cache = {}


def commit_time(repo, sha):
    key = (repo, sha)
    if key in _cache:
        return _cache[key]
    r = subprocess.run(['git', '-C', repo, 'show', '-s', '--format=%cI%n%s', sha],
                       capture_output=True, text=True)
    out = None
    if r.returncode == 0 and r.stdout.strip():
        iso, _, subj = r.stdout.strip().partition('\n')
        try:
            out = (datetime.fromisoformat(iso), subj)
        except ValueError:
            out = None
    _cache[key] = out
    return out


def main():
    rows = [json.loads(l) for l in open(SRC)]
    rows = [r for r in rows if not r.get('duplicateArchiveEntry')]
    for n in rows:
        repo = REPOS.get(n['repo'])
        if not repo or not n['response'].strip():
            continue
        t = datetime.fromisoformat(n['date'].replace('Z', '+00:00'))
        best = None
        for m in set(SHA.findall(n['response'])):
            ct = commit_time(repo, m)
            if not ct:
                continue
            dt, subj = ct
            if t < dt < t + timedelta(days=30):
                if best is None or dt < best[0]:
                    best = (dt, m, subj)
        if best:
            print(json.dumps({
                'row': n['row'], 'repo': n['repo'], 'branch': n['branch'],
                'category': n['category'], 'noteTs': n['date'],
                'fixCommit': best[1], 'fixTs': best[0].isoformat(),
                'fixSubject': best[2][:90],
                'latencyMin': round((best[0] - t).total_seconds() / 60, 1),
            }))


if __name__ == '__main__':
    main()
