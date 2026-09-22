#!/usr/bin/env python3
"""Apply round-2 verification results to runs/delta-notes.jsonl in place.

Every cited rule file:line was opened at okven HEAD and its first-introducing
commit dated with `git log --all -S <phrase> -- <file>` (tools/verify_rule_escapes.py).
This script writes the outcome back: corrected [since] dates, downgrades where
the rule post-dates the note or does not cover it, and reassignments where a
different rule is the real one. Adds `ruleVerified` and `ruleVerifyNote`.
"""
import json

SRC = '/Users/eric/Code/mise-claude-plugin/docs/v3-research/runs/delta-notes.jsonl'

# --- rule strings, dates verified against okven git history -------------------
NEW = {}


def setrule(rows, value, verdict, why):
    for r in rows:
        NEW[r] = (value, verdict, why)


# B. rule did not exist when the note was written
setrule([438, 439, 440, 441, 442, 447, 476],
        'no-rule at note time (okven/CLAUDE.md:87 (Optional means a caller omits it) '
        'first committed ee31fed69 2026-08-31T18:02:49Z, after the note)',
        'downgraded-not-yet-written',
        'okven ee31fed69 introduced CLAUDE.md:87 at 2026-08-31T18:02:49Z; all 7 notes '
        'are 2026-08-31T02:50-17:22Z. The rule is the response to these notes.')

setrule([445, 454, 455, 456, 457, 458, 459, 460, 463, 464, 465, 466, 467, 472],
        'no-rule at note time (okven/functions/CLAUDE.md:21 (Hoist shared setup into '
        'beforeEach) first committed 337012e57 2026-08-31T18:02:22Z, after the note); '
        'the previously cited CLAUDE.md:145 governs assertion grouping, not setup hoisting',
        'downgraded-not-yet-written',
        'The covering rule is functions/CLAUDE.md:21, introduced 2026-08-31T18:02:22Z; '
        'all 14 "beforeEach?" notes are 2026-08-31T03:09-04:52Z. CLAUDE.md:145 (since '
        '2026-03-04) is about splitting assertions per output, not hoisting setup, and '
        'checklist:18 only dates from 2026-08-31T23:57Z.')

setrule([274],
        'no-rule at note time (okven/CLAUDE.md:84 (never reach for a property on a '
        "method's return value) first committed 3d587e712 2026-08-20T23:57:18Z, after "
        'the note at 2026-08-20T22:14:10Z)',
        'downgraded-not-yet-written',
        'Note precedes the rule by 1h43m; the rule is the response to the note.')

# C. rule does not cover the note
setrule([155, 159], 'no-rule', 'downgraded-not-covered',
        'Both notes are on production source packages/attribution/src/internal/'
        'createAttributionStore.ts and ask whether a store method should return the '
        'full object including the id. The no-drilling-inside-expect() rule governs '
        'test assertions only. Keyword false positive.')
setrule([234], 'no-rule', 'downgraded-not-covered',
        '"isn\'t there an error message or something we should validate here?" is a '
        'missing-assertion note, not a duplicated-helper note.')
setrule([535], 'no-rule', 'downgraded-not-covered',
        '"This file has grown impossible to read. Refactor it" is a file-size note; '
        'functions/CLAUDE.md:78 Helper first governs duplicated bodies.')
setrule([59, 93, 95, 231, 261], 'no-rule', 'downgraded-not-covered',
        'okven/CLAUDE.md:118 governs where enums and constants live (constants.ts vs '
        'types.ts). These notes ask whether a value should be an enum at all, how enum '
        'values are cased, or about an unrelated error message. Not covered.')
setrule([136], 'no-rule', 'downgraded-not-covered',
        '"If *ID2 was removed, should this be renamed to ID2 instead of leaving the '
        'hole?" is about a numbering gap in fixtures, not about coining a second term '
        'for an existing concept.')
setrule([176], 'no-rule', 'downgraded-not-covered',
        'okven/CLAUDE.md:146 is "match the shape of the nearest sibling in the same '
        'file". This note asks about the directory a test file was placed in.')
setrule([150, 222], 'no-rule', 'downgraded-not-covered',
        'Both notes are ON db-refs files and ask for one query per helper / no variable '
        'clauses. functions/CLAUDE.md:32 says all queries must GO THROUGH db-refs, which '
        'these already do. No rule stating "one query per helper" exists in okven '
        '(grep of CLAUDE.md, functions/CLAUDE.md, .claude/mise-checklist.md).')
setrule([140], 'no-rule', 'downgraded-not-covered',
        '"There should be no mentions of Okven in any of the attribution packages copy '
        'or comments" is a package-boundary rule. checklist:24 governs whether a comment '
        'explains why and whether it misdescribes.')
setrule([392], 'no-rule', 'downgraded-not-covered',
        '"should this comment be a single line like the ones above?" is comment density, '
        'not explains-why / misdescribes. The density rule (doc-style SKILL.md) arrived '
        '2026-09-10, after this 2026-08-30 note.')
setrule([195, 221, 295], 'no-rule', 'downgraded-not-covered',
        'INVERSE of the cited rule: the agent ADDED tests the project convention forbids '
        '(db-refs tests, Vue-file tests, atom tests) and the owner asked for them to be '
        'removed. The colocated-test rule pushes toward the defect, it does not cover it.')
setrule([239], 'no-rule', 'downgraded-not-covered',
        '"should we validate an app call or result or something?" is a missing-assertion '
        'note, not a missing-colocated-test note.')

# D. reassignments (still an escape, different rule)
setrule([55], 'okven/CLAUDE.md:101 (Reuse existing vocabulary) [since 2026-08-19] '
        '(reassigned from functions/CLAUDE.md:78)', 'reassigned',
        'Note asks for one settled concept name (Report Note / Kind vs Type).')
setrule([475], 'okven/CLAUDE.md:79 (Notification functions own their copy: send* receive '
        'enums for message variants, never raw text) [since 2026-03-30] (reassigned from '
        'functions/CLAUDE.md:78)', 'reassigned',
        'The note quotes this rule almost verbatim: "don\'t we have a rule that send* '
        'methods are the ones to own copy rather than the handle*?"')
setrule([230], 'okven/CLAUDE.md:127 (NO mock cleanup calls - vitest config handles this) '
        '[since 2025-10-14] (reassigned from CLAUDE.md:134+149)', 'reassigned',
        'Note asks whether a global mock clear exists; that is rule 2, not __mocks__ placement.')
setrule([381], 'okven/CLAUDE.md:108 (exhaustive switch + assertNever) + '
        '.claude/mise-checklist.md:16 [since 2026-02-10] (reassigned from CLAUDE.md:118)',
        'reassigned', 'Note asks for switch + assertNever, which is rule 108.')
setrule([296], 'okven/CLAUDE.md:115 (one export per file, matching the file name) '
        '[since 2025-10-03] (reassigned from CLAUDE.md:146)', 'reassigned',
        'Note: "The single exported function should match the file name."')
setrule([414, 434], 'okven/CLAUDE.md:145 (Test scenarios, not individual outputs) '
        '[since 2026-03-04] (reassigned from CLAUDE.md:144)', 'reassigned',
        'Both notes are about grouping/folding tests, not about it() titles.')
setrule([192, 213, 225, 244, 250, 267, 268, 269],
        'okven/.claude/mise-checklist.md:17 (No block in the diff duplicates an existing '
        "flow's body) [since 2026-08-31] (reassigned from functions/CLAUDE.md:78, which "
        'is scoped to functions/ and these files are under hosting/ or packages/)',
        'reassigned',
        'checklist:17 is repo-wide and first committed e9a504a5f 2026-08-31T23:57:15Z; '
        'all 8 notes are 2026-09-16 or later.')

# A. date corrections only
DATEFIX = {
    'okven/.claude/mise-checklist.md:24 (every comment explains why, none misdescribes) + CLAUDE.md:90 [since 2026-08-19]':
        ('okven/.claude/mise-checklist.md:24 (every comment explains why, none misdescribes) '
         '[since 2026-08-19] + CLAUDE.md:90 (JSDoc grounds the reader) [since 2026-07-21]',
         'CLAUDE.md:90 first committed 38094b88c 2026-07-21, earlier than the recorded 2026-08-19.'),
    'okven/CLAUDE.md:139 (No drilling inside expect) + .claude/mise-checklist.md:12 since 2026-08-19 + CLAUDE.md:138 "not a hand-built object that cherry-picks fields" since 2026-04-24 [since 2026-04-24]':
        ('okven/CLAUDE.md:138 "not a hand-built object that cherry-picks fields" [since 2026-04-24] '
         '+ .claude/mise-checklist.md:12 (no hand-built partial expected objects) since 2026-08-19; '
         'the explicit CLAUDE.md:139 "No drilling inside expect()" bullet only since 2026-09-05 and '
         'the checklist "Nothing drills inside expect()" clause only since 2026-09-10',
         'CLAUDE.md:139 first committed 89039f3e2 2026-09-05T22:50:17Z; checklist "Nothing drills '
         'inside" 1b6c72155 2026-09-10. The escape stands on the older 2026-04-24 clause.'),
    'okven/CLAUDE.md:144 (each it() title names what its assertions prove) [since 2026-03-04]':
        ('okven/CLAUDE.md:144 (each it() title names what its assertions prove) [since 2026-02-10]',
         'First committed f0ed29277 2026-02-10, earlier than the recorded 2026-03-04.'),
    'okven/CLAUDE.md:134 + CLAUDE.md:149 (module mocks live in __mocks__) [since 2026-02-10]':
        ('okven/CLAUDE.md:134 + CLAUDE.md:149 (module mocks live in __mocks__) [since 2025-10-14]',
         'CLAUDE.md:149 first committed ee7680d17 2025-10-14.'),
    'okven/hosting/CLAUDE.md:21 (page logic lives in its use<Name>Page composable) [since 2026-07-13]':
        ('okven/hosting/CLAUDE.md:21 (page logic lives in its use<Name>Page composable) [since 2026-08-19]',
         'First committed b88877a7d 2026-08-19, not 2026-07-13. All 4 citing notes are 2026-09-17, '
         'so the escape stands.'),
    'okven/.claude/skills/doc-style/SKILL.md:32 (no colons, semicolons, em-dashes in comment or doc prose) [since 2026-09-07]':
        ('okven/.claude/skills/doc-style/SKILL.md:32 (no colons, semicolons, em-dashes in comment '
         'or doc prose) [since 2026-09-10]',
         'First committed ea9b089c5 2026-09-10, not 2026-09-07. Citing notes are 2026-09-11, so '
         'the escape stands.'),
    'okven/.claude/mise-config.md:31 + hosting/CLAUDE.md:47 (Spanish PR copy per spanish-voice.md) [since 2026-07-15]':
        ('okven/hosting/CLAUDE.md:47 (Spanish copy per spanish-voice.md) [since 2025-08-28] + '
         '.claude/mise-config.md:31 since 2026-07-15',
         'hosting/CLAUDE.md:47 first committed 76ad6e708 2025-08-28, well before the recorded 2026-07-15.'),
}
DATEFIX_STR = {
    '2026-09-07, after 2026-09-03': '2026-09-10, after 2026-09-03',
    '2026-09-07, after 2026-08-26': '2026-09-10, after 2026-08-26',
}


def main():
    rows = [json.loads(l) for l in open(SRC)]
    stats = {'downgraded-not-yet-written': 0, 'downgraded-not-covered': 0,
             'reassigned': 0, 'date-corrected': 0, 'confirmed': 0, 'no-rule': 0}
    for r in rows:
        row = r['row']
        if r['ruleAlreadyExisted'] == 'no-rule':
            r['ruleVerified'] = 'n/a'
            r['ruleVerifyNote'] = ''
            stats['no-rule'] += 1
            continue
        if row in NEW:
            val, verdict, why = NEW[row]
            r['ruleAlreadyExisted'] = val
            r['ruleVerified'] = verdict
            r['ruleVerifyNote'] = why
            stats[verdict] += 1
            continue
        cur = r['ruleAlreadyExisted']
        if cur in DATEFIX:
            val, why = DATEFIX[cur]
            r['ruleAlreadyExisted'] = val
            r['ruleVerified'] = 'date-corrected'
            r['ruleVerifyNote'] = why
            stats['date-corrected'] += 1
            continue
        hit = False
        for a, b in DATEFIX_STR.items():
            if a in cur:
                r['ruleAlreadyExisted'] = cur.replace(a, b)
                r['ruleVerified'] = 'date-corrected'
                r['ruleVerifyNote'] = ('doc-style/SKILL.md:32 first committed ea9b089c5 '
                                       '2026-09-10, not 2026-09-07; conclusion (no rule at '
                                       'note time) unchanged.')
                stats['date-corrected'] += 1
                hit = True
                break
        if hit:
            continue
        r['ruleVerified'] = 'confirmed'
        r['ruleVerifyNote'] = ('Cited file:line opened at okven HEAD and matches the quoted rule; '
                               'first-introducing commit predates the note date.')
        stats['confirmed'] += 1
    with open(SRC, 'w') as f:
        for r in rows:
            f.write(json.dumps(r) + '\n')
    print(json.dumps(stats, indent=1))


if __name__ == '__main__':
    main()
