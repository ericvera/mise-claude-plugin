#!/usr/bin/env python3
"""Offense rates before vs after each rule-change date.

Usage: before_after.py commits.jsonl <YYYY-MM-DD:label> ...
Windows are the full in-range history on each side of the date (exclusive of
the date itself on the "before" side). Prints n for every cell.
"""
import json
import sys


def main():
    rows = [json.loads(l) for l in open(sys.argv[1])]
    events = [a.split(':', 1) for a in sys.argv[2:]]
    print('| rule change | side | commits | test+ lines | drill | drill/kloc '
          '| src+ lines | cmt lines | code lines | cmt:code | jsdoc>5 | '
          'jsdoc>5/kloc |')
    print('|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|')
    for date, label in events:
        for side in ('before', 'after'):
            sel = [r for r in rows
                   if (r['date'][:10] < date if side == 'before'
                       else r['date'][:10] >= date)]
            t = sum(r['test_added'] for r in sel)
            d = sum(r['drill'] for r in sel)
            s = sum(r['src_added'] for r in sel)
            c = sum(r['comment_lines'] for r in sel)
            k = sum(r['code_lines'] for r in sel)
            j = sum(r['jsdoc_gt5'] for r in sel)
            print(f'| {label} ({date}) | {side} | {len(sel)} | {t} | {d} | '
                  f'{1000*d/t:.1f} | {s} | {c} | {k} | {c/k:.2f} | {j} | '
                  f'{1000*j/s:.1f} |' if t and k and s else
                  f'| {label} ({date}) | {side} | {len(sel)} | {t} | {d} | - |'
                  f' {s} | {c} | {k} | - | {j} | - |')


if __name__ == '__main__':
    main()
