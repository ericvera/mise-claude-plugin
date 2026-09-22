#!/usr/bin/env python3
"""Verify the ruleAlreadyExisted column of runs/delta-notes.jsonl.

For each distinct cited rule: (1) read the cited file:line at HEAD and record
the text, (2) find the earliest commit across all refs that introduced the
rule's distinguishing phrase into that file (git log -S, reverse), (3) compare
that date with every citing note's date. Read-only git.

Emits JSON to stdout: {rule: {refs, headLines, firstSeen, firstSha, notes:[...]}}
"""
import json
import re
import subprocess
import sys
from collections import Counter

REPOS = {
    'okven': '/Users/eric/Code/okven',
    'firebase-kit': '/Users/eric/Code/firebase-kit',
    'ericvera.dev': '/Users/eric/Code/ericvera.dev',
    'mise-claude-plugin': '/Users/eric/Code/mise-claude-plugin',
}

# distinguishing phrase to search per cited file:line (chosen from the HEAD text)
PHRASES = {
    ('okven', 'CLAUDE.md', 145): 'Test scenarios, not individual outputs',
    ('okven', 'CLAUDE.md', 101): 'Reuse existing vocabulary',
    ('okven', 'CLAUDE.md', 139): 'No drilling inside',
    ('okven', 'CLAUDE.md', 138): 'Always use inline snapshots',
    ('okven', 'CLAUDE.md', 118): 'types.ts` holds pure types only',
    ('okven', 'CLAUDE.md', 144): 'Check before adding tests',
    ('okven', 'CLAUDE.md', 87): 'Optional means a caller omits it',
    ('okven', 'CLAUDE.md', 146): 'Routing tests stay shallow',
    ('okven', 'CLAUDE.md', 134): 'Module mocks in `__mocks__` directories',
    ('okven', 'CLAUDE.md', 149): 'Use `__mocks__` directories for full module mocks',
    ('okven', 'CLAUDE.md', 108): 'Exhaustive switches',
    ('okven', 'CLAUDE.md', 115): 'One export per file',
    ('okven', 'CLAUDE.md', 130): 'NEVER mock',
    ('okven', 'CLAUDE.md', 84): 'Assign before reading a property off a call',
    ('okven', 'CLAUDE.md', 119): 'Internal utilities',
    ('okven', 'CLAUDE.md', 90): 'JSDoc grounds the reader',
    ('okven', 'CLAUDE.md', 165): 'ui-conventions` skill',
    ('okven', 'functions/CLAUDE.md', 78): 'Helper first',
    ('okven', 'functions/CLAUDE.md', 15): 'setFakeTimer',
    ('okven', 'functions/CLAUDE.md', 32): 'All queries MUST use db-refs',
    ('okven', 'functions/CLAUDE.md', 23): 'Never read Firestore in a test',
    ('okven', 'hosting/CLAUDE.md', 21): 'definePageMeta',
    ('okven', 'hosting/CLAUDE.md', 47): 'Spanish Voice Guidelines',
    ('okven', '.claude/mise-checklist.md', 8): 'colocated test',
    ('okven', '.claude/mise-checklist.md', 12): 'whole values',
    ('okven', '.claude/mise-checklist.md', 16): 'assertNever',
    ('okven', '.claude/mise-checklist.md', 18): 'earns its own setup',
    ('okven', '.claude/mise-checklist.md', 20): 'One name per concept',
    ('okven', '.claude/mise-checklist.md', 24): 'Every comment explains why',
    ('okven', '.claude/mise-config.md', 31): 'spanish-voice.md',
    ('okven', '.claude/mise-config.md', 44): 'gets a colocated test',
    ('okven', '.claude/skills/doc-style/SKILL.md', 32): 'No colons, semicolons, em-dashes',
    ('okven', '.claude/skills/ui-conventions/SKILL.md', 125): 'atoms',
    ('firebase-kit', '.claude/mise-config.md', 22): '__mocks__',
}


def git(repo, *a):
    return subprocess.run(['git', '-C', repo, *a], capture_output=True, text=True)


def head_line(repo, path, n):
    r = git(repo, 'show', f'HEAD:{path}')
    if r.returncode != 0:
        return None
    lines = r.stdout.split('\n')
    return lines[n - 1] if 0 < n <= len(lines) else None


def first_seen(repo, path, phrase):
    r = git(repo, 'log', '--all', '--reverse', '--format=%cI %H', '-S', phrase, '--', path)
    if r.returncode != 0 or not r.stdout.strip():
        return None, None, r.stderr.strip()[:120]
    sha_line = r.stdout.strip().split('\n')[0]
    iso, sha = sha_line.split(' ', 1)
    return iso, sha, None


def parse_refs(rule):
    out = []
    for m in re.finditer(r'([A-Za-z0-9_./-]+\.(?:md|ts)):(\d+)', rule):
        p, n = m.group(1), int(m.group(2))
        if p.startswith('okven/'):
            repo, p = 'okven', p[len('okven/'):]
        elif p.startswith('firebase-kit/'):
            repo, p = 'firebase-kit', p[len('firebase-kit/'):]
        else:
            repo = None  # inherit from note repo
        out.append((repo, p, n))
    return out


def main():
    src = '/Users/eric/Code/mise-claude-plugin/docs/v3-research/runs/delta-notes.jsonl'
    rows = [json.loads(l) for l in open(src)]
    uniq = [r for r in rows if not r.get('duplicateArchiveEntry')]
    esc = [r for r in uniq if r['ruleAlreadyExisted'] != 'no-rule']
    out = {}
    for rule, cnt in Counter(r['ruleAlreadyExisted'] for r in esc).most_common():
        citing = [r for r in esc if r['ruleAlreadyExisted'] == rule]
        note_repo = citing[0]['repo']
        entry = {'count': cnt, 'refs': [], 'notes': [
            {'row': r['row'], 'date': r['date'], 'repo': r['repo'], 'branch': r['branch'],
             'file': r['file'], 'line': r['line'], 'category': r['category'],
             'noteText': r['noteText'][:200]} for r in citing]}
        for repo, path, n in parse_refs(rule):
            repo = repo or note_repo
            rp = REPOS.get(repo)
            if not rp:
                entry['refs'].append({'repo': repo, 'path': path, 'line': n, 'error': 'no repo'})
                continue
            hl = head_line(rp, path, n)
            ph = PHRASES.get((repo, path, n))
            fs, sha, err = first_seen(rp, path, ph) if ph else (None, None, 'no phrase mapped')
            entry['refs'].append({'repo': repo, 'path': path, 'line': n,
                                  'headLine': (hl or '')[:200], 'phrase': ph,
                                  'firstSeen': fs, 'firstSha': (sha or '')[:9], 'error': err})
        earliest = [r['firstSeen'] for r in entry['refs'] if r.get('firstSeen')]
        entry['earliestRuleDate'] = min(earliest) if earliest else None
        if entry['earliestRuleDate']:
            late = [nn['row'] for nn in entry['notes'] if nn['date'] < entry['earliestRuleDate']]
            entry['notesBeforeRuleExisted'] = late
        out[rule] = entry
    json.dump(out, sys.stdout, indent=1)


if __name__ == '__main__':
    main()
