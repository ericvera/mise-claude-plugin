#!/usr/bin/env python3
"""Roll commits.jsonl (from scan_offenses.py) into an ISO-week CSV series.

Usage: weekly.py commits.jsonl mise_flags.txt > okven-offenses.csv
mise_flags.txt: one line per commit, "<sha> yes|no" (tree contains .mise/).
"""
import csv
import datetime
import json
import sys

COLS = [
    'iso_week', 'week_start', 'commits', 'mise_commits',
    'test_added', 'inline_snap', 'inline_snap_per_kloc',
    'file_snap', 'snap_files_added',
    'assert_calls', 'big_literal', 'assert2_calls', 'big_literal2',
    'drill', 'drill_per_kloc',
    'src_added', 'comment_lines', 'code_lines', 'comment_ratio',
    'jsdoc_gt5', 'jsdoc_gt5_per_kloc', 'md_added', 'mise_md_added',
]


def main():
    flags = {}
    if len(sys.argv) > 2:
        for line in open(sys.argv[2]):
            p = line.split()
            if len(p) == 2:
                flags[p[0]] = p[1] == 'yes'
    weeks = {}
    for line in open(sys.argv[1]):
        r = json.loads(line)
        d = datetime.datetime.fromisoformat(r['date']).date()
        y, w, _ = d.isocalendar()
        key = f'{y}-W{w:02d}'
        b = weeks.setdefault(key, dict.fromkeys(COLS[2:], 0))
        b['commits'] += 1
        if flags.get(r['sha']):
            b['mise_commits'] += 1
        for k in ('test_added', 'inline_snap', 'file_snap', 'snap_files_added',
                  'assert_calls', 'big_literal', 'assert2_calls',
                  'big_literal2', 'drill', 'src_added', 'comment_lines', 'code_lines',
                  'jsdoc_gt5', 'md_added', 'mise_md_added'):
            b[k] += r.get(k, 0)
    w = csv.DictWriter(sys.stdout, COLS)
    w.writeheader()
    for key in sorted(weeks):
        b = weeks[key]
        y, wk = int(key[:4]), int(key[6:])
        b['iso_week'] = key
        b['week_start'] = str(datetime.date.fromisocalendar(y, wk, 1))
        b['inline_snap_per_kloc'] = (
            round(1000 * b['inline_snap'] / b['test_added'], 1)
            if b['test_added'] else '')
        b['drill_per_kloc'] = (
            round(1000 * b['drill'] / b['test_added'], 1)
            if b['test_added'] else '')
        b['comment_ratio'] = (
            round(b['comment_lines'] / b['code_lines'], 3)
            if b['code_lines'] else '')
        b['jsdoc_gt5_per_kloc'] = (
            round(1000 * b['jsdoc_gt5'] / b['src_added'], 1)
            if b['src_added'] else '')
        w.writerow(b)


if __name__ == '__main__':
    main()
