#!/usr/bin/env python3
"""Sub-pattern taxonomy for the two recurring defects.

Every row id below was assigned by reading the verbatim note text (and, where
the branch snapshot survives on refs/review/<branch>, the code at the cited
file:line). Rows outside the test-style / comment-doc-slop categories are kept
in a separate `ADJACENT` map so the in-category counts stay comparable with the
harvest.
"""
import json
import collections
import sys

SRC = '/Users/eric/Code/mise-claude-plugin/docs/v3-research/runs/delta-notes.jsonl'

TESTS = {
    'T1a drilled field/index inside expect()': [18, 19, 20, 76, 81, 278, 323, 340, 412, 468],
    'T1b value re-assembled in the test, then snapshotted': [61, 70, 73, 506, 508],
    'T1c wrong matcher family where a snapshot is required': [71, 194, 471, 529],
    'T1d file-based .snap instead of an inline snapshot': [216],
    'T2 a verification split out as its own it()': [62, 232, 235, 279, 350, 414, 428, 434, 436, 437, 507, 509, 555],
    'T3 per-test setup not hoisted into beforeEach': [445, 454, 455, 456, 457, 458, 459, 460, 463, 464, 465, 466, 467, 472],
    'T4 it() title or Verify comment does not match the fixture': [168, 169, 170, 172, 348, 360, 363, 526, 537],
    'T5 tests added where the convention is no test': [84, 132, 195, 221, 277, 295],
    'T6 new code with no colocated test': [23, 283, 301, 304, 384, 411, 418, 519],
    'T7 mock placement / internal code mocked': [7, 8, 173, 196, 230, 237, 241, 275],
    'T8 fixture carries values that mean nothing': [87, 91, 92, 100, 106, 141, 142, 146, 151, 167, 171, 525],
    'T9 fixture contradicts the real flow': [88, 157, 310, 332, 370, 371, 388, 391, 433, 534, 539],
    'T10 the test proves nothing / asserts the mock': [86, 180, 182, 200, 203, 233, 234, 239, 290, 291, 321, 368],
    'T11 eval and case-data quality': [326, 327, 331, 343, 364, 413],
    'T12 residual (helpers, fake timers, fixture language, constants)': [17, 35, 66, 165, 179, 238, 446, 480],
}

DOCS = {
    'D1 punctuation register: colon, semicolon, em-dash in prose': [3, 69, 72, 75],
    'D2 coined jargon the reader cannot decode': [77, 79, 80, 82, 85, 103, 144, 188, 477, 482, 505, 542],
    'D3 comment misdescribes the code or went stale': [394, 415, 430, 431, 488],
    'D4 verbose or restates a nearby source': [31, 116, 330, 392, 510],
    'D5 the why is missing': [46, 113, 527, 538],
    'D6 doc written as a history log, not the final state': [112],
    'D7 operator-facing copy that broadcasts the wrong thing': [307, 308],
    'D8 residual (design-doc facts, package-boundary copy)': [272, 294],
}

ADJACENT = {
    'T4 it() title or Verify comment does not match the fixture': [452],
    'T5 tests added where the convention is no test': [176],
    'T10 the test proves nothing / asserts the mock': [311, 312, 341],
    'D2 coined jargon the reader cannot decode': [162, 166, 183, 207, 211, 212, 220, 229],
    'D3 comment misdescribes the code or went stale': [129, 202],
    'D4 verbose or restates a nearby source': [336, 554],
    'D5 the why is missing': [338],
    'D6 doc written as a history log, not the final state': [111],
    'D8 residual (design-doc facts, package-boundary copy)': [140, 289, 359, 375, 397],
}


def main():
    rows = {json.loads(l)['row']: json.loads(l)
            for l in open(SRC) if not json.loads(l).get('duplicateArchiveEntry')}
    seen = collections.Counter()
    out = {}
    for label, ids in list(TESTS.items()) + list(DOCS.items()):
        adj = ADJACENT.get(label, [])
        for i in ids + adj:
            seen[i] += 1
        notes = [rows[i] for i in ids if i in rows]
        adjn = [rows[i] for i in adj if i in rows]
        ruled = [n for n in notes + adjn
                 if n['ruleAlreadyExisted'] != 'no-rule'
                 and not n['ruleAlreadyExisted'].startswith('no-rule at note time')]
        out[label] = {
            'n': len(notes), 'nAdjacent': len(adjn),
            'ruleCovered': len(ruled),
            'rules': sorted({n['ruleAlreadyExisted'].split(' [')[0][:95] for n in ruled}),
            'branches': dict(collections.Counter(n['branch'] for n in notes + adjn)),
            'dates': [min(n['date'][:10] for n in notes + adjn),
                      max(n['date'][:10] for n in notes + adjn)],
            'quotes': [{'row': n['row'], 'file': n['file'], 'line': n['line'],
                        'date': n['date'][:10], 'text': n['noteText']}
                       for n in (notes + adjn)],
        }
    # coverage check
    tsd = [r for r in rows.values() if r['category'] in ('test-style', 'comment-doc-slop')]
    unassigned = [r['row'] for r in tsd if seen[r['row']] == 0]
    dupes = [i for i, c in seen.items() if c > 1]
    json.dump({'taxonomy': out, 'unassignedInCategory': unassigned,
               'assignedTwice': dupes, 'inCategoryTotal': len(tsd)},
              sys.stdout, indent=1)


if __name__ == '__main__':
    main()
