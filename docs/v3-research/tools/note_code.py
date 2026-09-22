#!/usr/bin/env python3
"""Pull the code a Delta Review note pointed at.

For a note (repo, branch, file, line, date) find the Delta Review state
snapshot commit on refs/review/<branch> whose committer date is nearest at or
before the note date and that contains the file, then print a window of lines
around the note line. Read-only git.

usage: note_code.py <rows.json>   rows = [{row, repo, branch, file, line, date, ctx?}]
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


def git(repo, *args):
    return subprocess.run(['git', '-C', repo, *args], capture_output=True, text=True)


_cache = {}


def commits_for(repo, branch, path):
    key = (repo, branch, path)
    if key in _cache:
        return _cache[key]
    ref = f'refs/review/{branch}'
    r = git(repo, 'log', '--format=%H %cI', ref, '--', path)
    out = []
    if r.returncode == 0:
        for line in r.stdout.splitlines():
            sha, iso = line.split(' ', 1)
            out.append((sha, datetime.fromisoformat(iso)))
    _cache[key] = out
    return out


def main():
    rows = json.load(open(sys.argv[1]))
    for n in rows:
        repo = REPOS.get(n['repo'])
        ctx = n.get('ctx', 14)
        print('=' * 78)
        print(f"ROW {n['row']} {n['repo']}@{n['branch']} {n['file']}:{n['line']} {n['date']}")
        if not repo:
            print('  NO REPO')
            continue
        cands = commits_for(repo, n['branch'], n['file'])
        if not cands:
            print('  NO SNAPSHOT (file never in refs/review/%s)' % n['branch'])
            continue
        note_dt = datetime.fromisoformat(n['date'].replace('Z', '+00:00'))
        before = [c for c in cands if c[1] <= note_dt]
        pick = before[0] if before else cands[-1]
        tag = 'at-or-before' if before else 'AFTER-NOTE(earliest)'
        blob = git(repo, 'show', f'{pick[0]}:{n["file"]}')
        if blob.returncode != 0:
            print('  BLOB MISSING', pick[0][:9])
            continue
        lines = blob.stdout.split('\n')
        ln = int(n['line'])
        lo, hi = max(1, ln - ctx), min(len(lines), ln + ctx)
        print(f'  snapshot {pick[0][:9]} {pick[1].isoformat()} [{tag}] file {len(lines)} lines')
        for i in range(lo, hi + 1):
            mark = '>>' if i == ln else '  '
            print(f'{mark}{i:5d}| {lines[i - 1]}')


if __name__ == '__main__':
    main()
