#!/usr/bin/env python3
"""Hand-assigned type for every `correction` row in runs/owner-messages.jsonl.

Indices are the row's position among the correction rows in file order. Each was
assigned by reading its verbatim `correctionOf` clause (and, where that was
ambiguous, the row's `text`). No keyword rule: a regex pass over the same clauses
misfired on 9 of a 30-row sample, so it was discarded.
"""
import json
import collections

SRC = '/Users/eric/Code/mise-claude-plugin/docs/v3-research/runs/owner-messages.jsonl'

TYPES = {
    'visual / mock / layout iteration': [
        4, 5, 6, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
        33, 34, 37, 38, 39, 69, 80, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128,
        129, 130, 131, 132, 133, 134, 135, 143, 147, 148, 157, 170, 171, 173, 174, 175,
        176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 188, 189],
    'product behaviour or design wrong': [
        1, 2, 3, 7, 13, 42, 43, 47, 48, 50, 52, 54, 55, 56, 57, 58, 59, 62, 63, 65, 67,
        70, 71, 73, 75, 76, 77, 79, 81, 83, 84, 85, 86, 90, 91, 92, 103, 104, 105, 114,
        118, 136, 137, 140, 141, 142, 145, 150, 151, 154, 168, 169, 172],
    'user-facing copy / wording': [
        44, 98, 99, 101, 102, 138, 139, 144, 146, 149, 155, 156, 158, 159, 160, 161,
        162, 163, 165, 35],
    'mise artifact or process output wrong': [
        8, 9, 36, 41, 49, 110, 111, 112, 113, 115, 116, 117, 153, 167],
    'naming / vocabulary': [51, 53, 88, 93, 94, 95, 96, 106, 107, 108, 109],
    'test or eval defect': [60, 61, 64, 66, 68, 72, 78, 100],
    'sweep incomplete / rule not applied everywhere': [10, 12, 74, 87, 89, 97, 164],
    'comment / doc slop': [40, 45, 46, 152, 166, 187],
    'environment / tooling': [0, 11, 14],
    'convention / code structure': [82],
}


def main():
    rows = [json.loads(l) for l in open(SRC)]
    cor = [r for r in rows if r['class'] == 'correction']
    label = {}
    for name, ids in TYPES.items():
        for i in ids:
            assert i not in label, f'index {i} assigned twice'
            label[i] = name
    missing = [i for i in range(len(cor)) if i not in label]
    extra = [i for i in label if i >= len(cor)]
    by_type = collections.Counter(label.get(i, 'UNASSIGNED') for i in range(len(cor)))
    print(f'correction rows: {len(cor)}; assigned {len(label)}; missing {missing}; extra {extra}')
    for k, v in by_type.most_common():
        print(f'{v:5d}  {k}')
    print()
    # cross-tabs
    print('type x stage')
    stages = ['goals', 'mock', 'requirements', 'plan', 'execute', 'close-out', None]
    print('%-46s' % 'type' + ''.join('%9s' % (s or 'none') for s in stages))
    for name in TYPES:
        row = [sum(1 for i, r in enumerate(cor)
                   if label.get(i) == name and r['miseStage'] == s) for s in stages]
        print('%-46s' % name[:46] + ''.join('%9d' % v for v in row))
    print()
    print('type x repo (okven vs other)')
    for name in TYPES:
        ok = sum(1 for i, r in enumerate(cor) if label.get(i) == name and r['repo'] == 'okven')
        ot = sum(1 for i, r in enumerate(cor) if label.get(i) == name and r['repo'] != 'okven')
        print('%-46s okven %3d   other %3d' % (name[:46], ok, ot))


if __name__ == '__main__':
    main()
