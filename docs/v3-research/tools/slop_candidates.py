#!/usr/bin/env python3
"""Pull added comment/doc passages that carry mechanical slop markers.

Reads the same `git log -p` stream as scan_offenses.py. Emits one JSONL record
per added comment run (consecutive added comment lines) or added .md paragraph
whose text matches a marker, tagged with the markers it hit.

Usage: git log ... -p -U3 --format=$'\x01C\x01%H\x01%aI\x01%s' | slop_candidates.py
"""
import json
import re
import sys

HDR = re.compile(r'^\x01C\x01([0-9a-f]+)\x01([^\x01]*)\x01(.*)$')
SRC_EXT = ('.ts', '.tsx', '.js', '.mjs', '.cjs', '.vue')
TEST_RE = re.compile(r'(\.test\.|\.spec\.)[a-z]+$|/__tests__/')
SKIP_RE = re.compile(r'(^|/)(node_modules|\.yarn|dist|build|\.nuxt)/')

MARKERS = {
    # restates code: comment text is the identifier below it, respaced
    'filler_opener': re.compile(
        r'^\W*(This (function|helper|method|component|composable|file|module|'
        r'type|interface|constant)|Helper (to|that|for)|Function (to|that)|'
        r'Utility (to|for)|Used to|Simply|Basically|Note that|Note:|'
        r'A helper (to|that)|Returns the|Gets the|Sets the)\b', re.I),
    'history': re.compile(
        r'\b(no longer|previously|used to|instead of|we (now|changed|moved|'
        r'renamed)|before (this|the) (change|refactor)|as of (this|the)|'
        r'was (renamed|moved|replaced)|legacy|after the rename|'
        r'this (change|refactor|commit|PR)|originally)\b', re.I),
    'hedge': re.compile(
        r'\b(may|might|could|should probably|in case|if needed|for now|'
        r'presumably|likely|typically|generally|usually|ideally|'
        r'it is possible|potentially)\b', re.I),
    'obvious': re.compile(
        r'\b(loop (over|through)|iterate over|check if|set the|get the|'
        r'return the|call the|create a new|initialize the|'
        r'add the|remove the|update the)\b', re.I),
    'meta': re.compile(
        r'\b(TODO|FIXME|for readability|self-explanatory|as (mentioned|'
        r'described) above|see below|as follows|in other words|that said|'
        r'it(\'s| is) worth noting|keep in mind|important to note)\b', re.I),
}


def is_comment(s):
    return s.startswith('//') or s.startswith('/*') or s.startswith('*') \
        or s.startswith('<!--')


def main():
    sha = date = subj = None
    path = kind = None
    run = []
    out = sys.stdout

    def flush():
        nonlocal run
        if not run:
            return
        text = ' '.join(x.lstrip('/*<!- ').rstrip('*/->') for x in run).strip()
        text = re.sub(r'\s+', ' ', text)
        hits = [k for k, rx in MARKERS.items() if rx.search(text)]
        if hits and len(text) > 25:
            out.write(json.dumps({
                'sha': sha, 'date': date, 'subject': subj, 'file': path,
                'kind': kind, 'markers': hits, 'lines': len(run),
                'text': text[:600]}) + '\n')
        run = []

    for line in sys.stdin:
        line = line.rstrip('\n')
        h = HDR.match(line)
        if h:
            flush()
            sha, date, subj = h.group(1), h.group(2), h.group(3)
            path = kind = None
            continue
        if line.startswith('diff --git ') or line.startswith('@@'):
            flush()
            continue
        if line.startswith('+++ '):
            flush()
            p = line[4:].strip()
            p = p[2:] if p.startswith('b/') else p
            path, kind = p, None
            if SKIP_RE.search(p) or p == '/dev/null':
                path = None
            elif p.endswith('.md') and not p.startswith('.mise/'):
                kind = 'md'
            elif p.endswith(SRC_EXT) and not TEST_RE.search(p):
                kind = 'src'
            elif p.endswith(SRC_EXT):
                kind = 'test'
            continue
        if kind is None:
            continue
        if line.startswith('+') and not line.startswith('+++'):
            s = line[1:].strip()
            if kind == 'md':
                if s:
                    run.append(s)
                else:
                    flush()
            elif is_comment(s):
                run.append(s)
            else:
                flush()
        else:
            flush()
    flush()


if __name__ == '__main__':
    main()
