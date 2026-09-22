#!/usr/bin/env python3
"""Stream `git log -p` and emit one JSON record per commit with test-style and
comment/doc-verbosity counts over ADDED lines only.

Usage:
  git -C <repo> log --branches --remotes --since=... --no-merges -p -U10 \
      --format='%x01C%x01%H%x01%aI%x01%an%x01%s' | python3 scan_offenses.py > out.jsonl

Reads stdin as a stream; never holds more than one commit's hunks in memory.
"""

import json
import re
import sys

SRC_EXT = ('.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx', '.mts', '.cts', '.vue')
TEST_RE = re.compile(r'(\.test\.|\.spec\.)[a-z]+$|/__tests__/')
SKIP_RE = re.compile(
    r'(^|/)(node_modules|\.yarn|dist|build|coverage|\.nuxt|\.output)/'
)
ASSERT_RE = re.compile(r'\.(toEqual|toStrictEqual|toMatchObject)\s*\(')
# Secondary matchers: the assertions that actually compete with inline
# snapshots in this repo (see runs/okven-offenses.md, section A).
ASSERT2_RE = re.compile(
    r'\.(toHaveBeenCalledWith|toHaveBeenNthCalledWith|toHaveBeenLastCalledWith'
    r'|toBeCalledWith|toContainEqual|toBe)\s*\('
)
INLINE_SNAP_RE = re.compile(r'toMatchInlineSnapshot')
FILE_SNAP_RE = re.compile(r'toMatchFileSnapshot|(?<!Inline)\btoMatchSnapshot\s*\(')

HDR = re.compile(r'^\x01C\x01([0-9a-f]+)\x01([^\x01]*)\x01([^\x01]*)\x01(.*)$')
# "No drilling inside expect()" (okven CLAUDE.md Testing 4, added 2026-09-05).
DRILL_RE = re.compile(
    r'expect\(.*?(\.length\b|\.mock\.calls\[|\[\d+\]\[\d+\]|\.at\(|\.map\()')


def classify(path):
    if path is None or SKIP_RE.search(path):
        return None
    if path.endswith('.snap') or '__snapshots__/' in path:
        return 'snap'
    if path.endswith('.md'):
        return 'mise_md' if path.startswith('.mise/') else 'md'
    if path.endswith(SRC_EXT):
        return 'test' if TEST_RE.search(path) else 'src'
    return None


def span_of_call(lines, li, ci):
    """lines: list of post-image text. li/ci: index of the '(' char.
    Returns (span_lines, literal_bool) or None if unterminated in window."""
    depth = 0
    i, j = li, ci
    started = False
    literal = None
    quote = None
    while i < len(lines):
        line = lines[i]
        while j < len(line):
            ch = line[j]
            if quote:
                if ch == '\\':
                    j += 2
                    continue
                if ch == quote:
                    quote = None
                j += 1
                continue
            if ch in '"\'`':
                quote = ch
                j += 1
                continue
            if ch in '([{':
                if started and literal is None and depth == 1:
                    literal = ch in '[{'
                depth += 1
                started = True
                j += 1
                continue
            if ch in ')]}':
                depth -= 1
                if depth == 0:
                    return (i - li + 1, bool(literal))
                j += 1
                continue
            if started and literal is None and depth == 1 and not ch.isspace():
                literal = False
            j += 1
        i += 1
        j = 0
        if quote == '`':
            continue
        quote = None
    return None


class Commit:
    def __init__(self, sha, date, author, subject):
        self.sha, self.date, self.author, self.subject = sha, date, author, subject
        self.m = dict(
            test_added=0, src_added=0, md_added=0, mise_md_added=0,
            snap_added=0, snap_files_added=0,
            inline_snap=0, file_snap=0, big_literal=0, big_literal2=0,
            assert_calls=0, assert2_calls=0, drill=0,
            comment_lines=0, code_lines=0, jsdoc_gt5=0,
            test_files=0, src_files=0,
        )
        self.examples = []


class Parser:
    def __init__(self, out, ex_out):
        self.out = out
        self.ex_out = ex_out
        self.c = None
        self.path = None
        self.kind = None
        self.new_file = False
        self.hunk = None          # list of (text, is_added)
        self.files_seen = set()

    # ---------- hunk analysis ----------
    def flush_hunk(self):
        if not self.hunk or self.kind is None:
            self.hunk = None
            return
        lines = [t for t, _ in self.hunk]
        added = [a for _, a in self.hunk]
        m = self.c.m
        if self.kind == 'test':
            for i, (txt, is_add) in enumerate(self.hunk):
                if not is_add:
                    continue
                m['inline_snap'] += len(INLINE_SNAP_RE.findall(txt))
                if DRILL_RE.search(txt):
                    m['drill'] += 1
                m['file_snap'] += len(FILE_SNAP_RE.findall(txt))
                for rx, ck, bk in ((ASSERT_RE, 'assert_calls', 'big_literal'),
                                   (ASSERT2_RE, 'assert2_calls',
                                    'big_literal2')):
                    for mt in rx.finditer(txt):
                        m[ck] += 1
                        r = span_of_call(lines, i, mt.end() - 1)
                        if r and r[1] and r[0] >= 5:
                            m[bk] += 1
                            if len(self.c.examples) < 6:
                                self.c.examples.append({
                                    'type': bk, 'file': self.path,
                                    'line': txt.strip()[:160], 'span': r[0],
                                })
        elif self.kind == 'src':
            in_block = False
            in_html = False
            for i, (txt, is_add) in enumerate(self.hunk):
                s = txt.strip()
                was_block = in_block or in_html
                is_comment = was_block
                if not was_block:
                    if s.startswith('/*'):
                        is_comment = True
                        if '*/' not in s[2:]:
                            in_block = True
                    elif s.startswith('<!--'):
                        is_comment = True
                        if '-->' not in s:
                            in_html = True
                    elif s.startswith('//'):
                        is_comment = True
                else:
                    if in_block and '*/' in s:
                        in_block = False
                    if in_html and '-->' in s:
                        in_html = False
                if not is_add:
                    continue
                if is_comment:
                    m['comment_lines'] += 1
                elif s:
                    m['code_lines'] += 1
            # JSDoc blocks
            i = 0
            while i < len(lines):
                s = lines[i].strip()
                if s.startswith('/**') and '*/' not in s[3:]:
                    j = i + 1
                    while j < len(lines) and '*/' not in lines[j]:
                        j += 1
                    if j < len(lines):
                        span = j - i + 1
                        if span > 5 and any(added[i:j + 1]):
                            m['jsdoc_gt5'] += 1
                            if len(self.c.examples) < 6:
                                body = ' '.join(
                                    x.strip().lstrip('*').strip()
                                    for x in lines[i:j + 1]
                                ).strip()
                                self.c.examples.append({
                                    'type': 'jsdoc', 'file': self.path,
                                    'line': body[:400], 'span': span,
                                })
                        i = j
                i += 1
        self.hunk = None

    # ---------- stream ----------
    def feed(self, line):
        h = HDR.match(line)
        if h:
            self.flush_hunk()
            self.emit()
            self.c = Commit(h.group(1), h.group(2), h.group(3), h.group(4))
            self.path = None
            self.kind = None
            return
        if self.c is None:
            return
        if line.startswith('diff --git '):
            self.flush_hunk()
            self.path = None
            self.kind = None
            self.new_file = False
            return
        if line.startswith('new file mode'):
            self.new_file = True
            return
        if line.startswith('+++ '):
            p = line[4:].strip()
            if p == '/dev/null':
                self.path, self.kind = None, None
                return
            if p.startswith('b/'):
                p = p[2:]
            self.path = p
            self.kind = classify(p)
            if self.kind and self.path not in self.files_seen:
                pass
            if self.kind == 'test':
                self.c.m['test_files'] += 1
            elif self.kind == 'src':
                self.c.m['src_files'] += 1
            elif self.kind == 'snap' and self.new_file:
                self.c.m['snap_files_added'] += 1
            return
        if line.startswith('@@'):
            self.flush_hunk()
            self.hunk = []
            return
        if self.hunk is None or self.kind is None:
            return
        if line.startswith('+'):
            self.hunk.append((line[1:], True))
            k = self.kind
            if k == 'test':
                self.c.m['test_added'] += 1
            elif k == 'src':
                self.c.m['src_added'] += 1
            elif k == 'md':
                self.c.m['md_added'] += 1
            elif k == 'mise_md':
                self.c.m['mise_md_added'] += 1
            elif k == 'snap':
                self.c.m['snap_added'] += 1
        elif line.startswith('-'):
            return
        elif line.startswith(' ') or line == '':
            self.hunk.append((line[1:] if line else '', False))
        elif line.startswith('\\'):
            return

    def emit(self):
        if self.c is None:
            return
        rec = {'sha': self.c.sha, 'date': self.c.date,
               'author': self.c.author, 'subject': self.c.subject}
        rec.update(self.c.m)
        self.out.write(json.dumps(rec) + '\n')
        for e in self.c.examples:
            e2 = {'sha': self.c.sha, 'date': self.c.date,
                  'subject': self.c.subject}
            e2.update(e)
            self.ex_out.write(json.dumps(e2) + '\n')
        self.c = None


def main():
    ex_path = sys.argv[1] if len(sys.argv) > 1 else '/dev/null'
    with open(ex_path, 'w') as ex:
        p = Parser(sys.stdout, ex)
        for line in sys.stdin:
            p.feed(line.rstrip('\n'))
        p.flush_hunk()
        p.emit()


if __name__ == '__main__':
    main()
