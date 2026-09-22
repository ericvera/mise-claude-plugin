#!/usr/bin/env python3
"""Find added comments that restate the code line directly below them.

Deterministic proxy: split the next added code line's identifiers on camelCase
and non-word chars; a comment restates when >=60% of its content words (after
stopword removal) appear in that identifier set and the comment adds <=2 words
the code does not carry.

Also emits the longest added JSDoc blocks (span >= 10) for volume review.

Usage: git log ... -p -U0 --format=$'\x01C\x01%H\x01%aI\x01%s' | restate.py
"""
import json
import re
import sys

HDR = re.compile(r'^\x01C\x01([0-9a-f]+)\x01([^\x01]*)\x01(.*)$')
SRC_EXT = ('.ts', '.tsx', '.js', '.mjs', '.cjs', '.vue')
TEST_RE = re.compile(r'(\.test\.|\.spec\.)[a-z]+$|/__tests__/')
SKIP_RE = re.compile(r'(^|/)(node_modules|\.yarn|dist|build|\.nuxt)/')
STOP = set('a an the of to for from in on at is are be it its this that and or '
           'we you with by as not no so when then if into over per each all '
           'one two do does use uses used using via'.split())


def words(s):
    parts = re.split(r'[^A-Za-z]+', s)
    out = []
    for p in parts:
        for w in re.findall(r'[A-Z]+(?![a-z])|[A-Z][a-z]*|[a-z]+', p):
            out.append(w.lower())
    return out


def main():
    sha = date = subj = None
    path = ok = None
    buf = []
    for line in sys.stdin:
        line = line.rstrip('\n')
        h = HDR.match(line)
        if h:
            sha, date, subj = h.group(1), h.group(2), h.group(3)
            buf = []
            continue
        if line.startswith('+++ '):
            p = line[4:].strip()
            p = p[2:] if p.startswith('b/') else p
            ok = (p.endswith(SRC_EXT) and not TEST_RE.search(p)
                  and not SKIP_RE.search(p))
            path = p
            buf = []
            continue
        if line.startswith('diff --git') or line.startswith('@@'):
            buf = []
            continue
        if not ok or not line.startswith('+') or line.startswith('+++'):
            buf = []
            continue
        s = line[1:].strip()
        if s.startswith('//') or s.startswith('*') or s.startswith('/*'):
            buf.append(s.lstrip('/*').strip().rstrip('*/').strip())
            continue
        if buf and s:
            cw = [w for w in words(' '.join(buf)) if w not in STOP]
            kw = set(words(s))
            if 3 <= len(cw) <= 14:
                shared = sum(1 for w in cw if w in kw)
                extra = len(cw) - shared
                if shared / len(cw) >= 0.6 and extra <= 2:
                    print(json.dumps({
                        'sha': sha, 'date': date, 'subject': subj,
                        'file': path, 'comment': ' '.join(buf)[:300],
                        'code': s[:200], 'overlap': round(shared / len(cw), 2)}))
        buf = []


if __name__ == '__main__':
    main()
