# Okven recurring-defect measurement — 2026-07-01 → 2026-09-19

Repo `/Users/eric/Code/okven`, read-only (`git log`/`show`/`for-each-ref`/`cat-file` only).
Weekly series: `okven-offenses.csv`. Scripts: `../tools/`.

## Scope and corpus

| item                                                  |       value | source                                                                |
| ----------------------------------------------------- | ----------: | --------------------------------------------------------------------- |
| Commits in window, `--branches --remotes --no-merges` |        1000 | `git rev-list --count --branches --remotes --since=2026-07-01`        |
| …of which tree contains `.mise/` (mise run in flight) |         905 | `tools/scan_offenses.py` + `git cat-file --batch-check '<sha>:.mise'` |
| Merge commits in window                               |           0 | `--no-merges` count equals total count                                |
| Distinct patch-ids among the 1000                     |         999 | `git log -p \| git patch-id --stable`                                 |
| Author on all 1000                                    | `Eric Vera` | `git log --format=%an \| sort \| uniq -c`                             |

**Refs excluded, and why.** `refs/review/*` (38 refs, 6 118 commits reachable in window) and
`refs/review-notes/*` (4 refs, 44 commits) are Delta Review extension autosave refs.
`git log --all --since=2026-07-01` returns 7 521 commits; 6 162 of them have a
`delta-review …` subject and are working-tree snapshots that duplicate authored work
(e.g. `19b903a3c` = a 4-line snapshot of `functions/src/utils/offer/constants.ts`).
Counting them would inflate every figure ~7×. `refs/stash` (384) excluded for the same reason.

**Counting rules.** Added lines only (`+`, not `+++`). Test file =
`*.test.*`/`*.spec.*`/`__tests__/`. Non-test source = `.ts .tsx .js .mjs .cjs .jsx .mts .cts .vue`
outside those. `node_modules .yarn dist build coverage .nuxt .output` skipped.
`.md` split into inside/outside `.mise/`. Hunks read with `-U10` so a multi-line call or
JSDoc block can be closed inside the window.

**Framework and lint setup.**

|                                                                       |                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test runner                                                           | Vitest, root `vitest.config.ts:1-8`, projects `./packages/* ./functions/ ./hosting/`, `mockReset: true`. No Jest anywhere.                                                                                                                                                                        |
| ESLint                                                                | v10.7.0 flat config, `okven/eslint.config.mjs:1-8` — `@nuxt/eslint-config/flat` + `@unocss/eslint-config/flat` + `eslint-plugin-vue-scoped-css`                                                                                                                                                   |
| Typed lint                                                            | `eslint.config.mjs:32-49` `local:typed-lint`, `projectService: true`                                                                                                                                                                                                                              |
| Existing custom enforcement                                           | `no-restricted-syntax` at `eslint.config.mjs:111` (ID-alias casts), `:135` (terminal `handle*`, block `local:terminal-handlers` at `:131`), `:198` `no-restricted-globals` (`describe` ban, block `local:test-rules`); `line-comment-position` `:77`; `max-len` `{code: 999, comments: 80}` `:85` |
| Test-specific lint today                                              | one rule only: `no-restricted-globals: describe` (`eslint.config.mjs:198`). No vitest/jest ESLint plugin installed.                                                                                                                                                                               |
| Plugins already resolvable (transitive deps of `@nuxt/eslint-config`) | `eslint-plugin-jsdoc@63.0.12`, `@stylistic/eslint-plugin`, `eslint-plugin-unicorn`, `eslint-plugin-regexp`, `eslint-plugin-import-x`                                                                                                                                                              |

---

## A. Test style

### A.1 Weekly series (added lines in test files)

Full series in `okven-offenses.csv`. `drill` = added test line where an `expect(...)`
argument reaches inside the value under test (`.length`, `.at(`, `.map(`, `.mock.calls[`,
`[n][n]`) — the offense named by `okven/CLAUDE.md:139`.

| ISO week  |  commits | test+ lines | `toMatchInlineSnapshot` |    /kloc | `toMatchSnapshot` | `__snapshots__` files | `toEqual/toStrictEqual/toMatchObject` calls | of those, literal arg ≥5 lines |   drill | drill/kloc |
| --------- | -------: | ----------: | ----------------------: | -------: | ----------------: | --------------------: | ------------------------------------------: | -----------------------------: | ------: | ---------: |
| 2026-W28  |       47 |       2 547 |                      88 |     34.6 |                 0 |                     0 |                                           0 |                              0 |      11 |        4.3 |
| 2026-W29  |       84 |       3 968 |                     164 |     41.3 |                 0 |                     0 |                                           0 |                              0 |      10 |        2.5 |
| 2026-W30  |       67 |       6 812 |                     357 |     52.4 |                 0 |                     0 |                                           0 |                              0 |       0 |        0.0 |
| 2026-W31  |       93 |         313 |                       4 |     12.8 |                 0 |                     0 |                                           0 |                              0 |       0 |        0.0 |
| 2026-W32  |      147 |      39 361 |                     987 |     25.1 |                 0 |                     0 |                                         125 |                              0 |      70 |        1.8 |
| 2026-W33  |      122 |      17 080 |                     322 |     18.9 |                 0 |                     0 |                                           9 |                              0 |      30 |        1.8 |
| 2026-W34  |       21 |      14 509 |                     344 |     23.7 |                 0 |                     0 |                                           0 |                              0 |     144 |        9.9 |
| 2026-W35  |        6 |       1 410 |                      33 |     23.4 |                 0 |                     0 |                                           0 |                              0 |       0 |        0.0 |
| 2026-W36  |      106 |      38 393 |                     868 |     22.6 |                 0 |                     0 |                                           1 |                              0 |     121 |        3.2 |
| 2026-W37  |      197 |      62 726 |                     949 |     15.1 |                 0 |                     0 |                                           0 |                              0 |     140 |        2.2 |
| 2026-W38  |      107 |      58 050 |                   1 241 |     21.4 |                 0 |                     0 |                                           1 |                              0 |       4 |        0.1 |
| **total** | **1000** | **245 182** |               **5 357** | **21.8** |             **0** |                 **0** |                                     **136** |                          **0** | **530** |    **2.2** |

(W26 and W27 hold 3 commits and 13 added test lines; omitted from the table, present in the CSV.)

### A.2 What the numbers say

- **The stated defect "tests not using inline snapshots" does not appear in committed code.**
  Zero `toMatchSnapshot`, zero `toMatchFileSnapshot`, zero `__snapshots__`/`.snap` files added
  in the window. `git log --all --diff-filter=A -- '*.snap' '**/__snapshots__/**'` returns
  nothing for the repo's entire history — Okven has never had an external snapshot file.
  The only `toMatchSnapshot` string in all refs is inside a `delta-review state` autosave (`24b4a534b`).
- **`toEqual`-with-a-big-literal is also absent.** 136 `toEqual`/`toStrictEqual`/`toMatchObject`
  calls added across 245 182 test lines (0.55/kloc); **0** of them take a literal argument
  spanning 5+ lines. Manual read of the 136: every one is single-line and scalar/short-array,
  e.g. `expect(await storedIds()).toEqual(['entry-2'])`, `expect(inEmulator()).toEqual(false)`.
  Widening to `toBe/toHaveBeenCalledWith/toContainEqual/toHaveBeenNthCalledWith` adds 100 more
  calls, 3 of which take a ≥5-line literal.
- **The live test-style offense is a different one: drilling inside `expect()`.**
  530 added lines in the window; **1 081 instances present in the tree at HEAD** across
  756 test files (ESLint probe, section D). The dominant shape is
  `expect(vi.mocked(sendX).mock.calls[0]).toMatchInlineSnapshot(...)` — inline snapshot used
  correctly, one array index drilled. `okven/.claude/mise-checklist.md` rule 6 names this
  exactly: "`mock.calls` is snapshotted whole, never one index."
- Pre-window comparison: 4 244 `toMatchInlineSnapshot` and 323 `toEqual` added before
  2026-07-01, so inline-snapshot dominance is not new to the mise era.

### A.3 Test-style rework commits

Git records no reviewer identity (single author, 5 `Co-Authored-By` trailers in 1000 commits).
"Human caught" is therefore **not directly observable** — see Gaps. The column below is a
convention proxy: commits following mise's in-run subject conventions (`Task N.N`,
`Task N.N (review fixes)`, `Docs:`) are agent-stage output; bare Conventional-Commit subjects
(`refactor:`, `fix:`, `test:`, `chore:`) are out-of-band cleanup sessions.

| sha         | date       | branch                       | files |         +/− | `.mise/` in tree | provenance proxy      | subject                                                                                                        |
| ----------- | ---------- | ---------------------------- | ----: | ----------: | ---------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `a942d4355` | 2026-09-05 | backup/pre-rebase-2026-09-09 |    36 | +6279/−2147 | yes              | out-of-band           | refactor: snapshot whole values instead of drilled properties across the branch tests                          |
| `1079817d7` | 2026-09-03 | backup/pre-rebase-2026-09-09 |     9 |  +2686/−583 | yes              | out-of-band           | refactor: snapshot whole results instead of drilled sub-properties                                             |
| `70ad7e050` | 2026-09-03 | backup/pre-rebase-2026-09-09 |     4 |     +45/−61 | yes              | out-of-band           | refactor: direct assertions for the remaining assembled-array expects                                          |
| `150d463d8` | 2026-09-03 | backup/pre-rebase-2026-09-09 |     1 |       +5/−5 | yes              | out-of-band           | refactor: assert void checkers with not.toThrow                                                                |
| `840d9e99d` | 2026-09-03 | backup/pre-rebase-2026-09-09 |     5 |     +59/−53 | yes              | out-of-band           | fix: direct-value test assertions for the assembled-collection class, natural footnote wording, checklist rule |
| `92aa5346e` | 2026-09-18 | feat/first-time-offer        |    10 |   +149/−122 | yes              | in-run (Task)         | Task 2.4: Snapshot mock.calls whole and write the retry top-up with a dotted update                            |
| `be75f4d92` | 2026-08-07 | backup/pre-rebase-2026-09-09 |     2 |      +73/−4 | yes              | in-run (review fixes) | Task 6.5 (review fixes): the scope-echo test snapshots the whole report instead of one sub-property            |
| `a283fad73` | 2026-08-13 | backup/pre-rebase-2026-09-09 |     8 |    +122/−39 | yes              | in-run (review fixes) | Task 2.1 (review fixes): stale reversal comments corrected, byRange call count asserted                        |
| `fe228e842` | 2026-08-13 | backup/pre-rebase-2026-09-09 |     8 |    +263/−39 | yes              | in-run (review fixes) | Task 2.3 (review fixes): restore the roll-up id the tests assert on, correct stale layout comments…            |
| `814a4f07a` | 2026-08-07 | backup/pre-rebase-2026-09-09 |     5 |     +71/−24 | yes              | in-run (review fixes) | Task 5.2 (review fixes): assert the export off the real entry point…                                           |
| `7f9db6391` | 2026-08-03 | backup/pre-rebase-2026-09-09 |     4 |     +62/−26 | yes              | in-run (review fixes) | Task 4.1 (review fixes): …assert the fallback capture's credit instant                                         |
| `1fb37100a` | 2026-08-03 | backup/pre-rebase-2026-09-09 |     2 |      +48/−7 | yes              | in-run (review fixes) | Task 4.2 (review fixes): the design doc names the real emit handler, snapshot count corrected                  |
| `9a5811f0d` | 2026-07-17 | eric/item-schedule-ui        |     7 |    +169/−44 | yes              | in-run (review fix)   | Task 3.2 (review fix): …assertNever, bold entity name in validation error                                      |
| `195852db5` | 2026-09-18 | feat/tips                    |     2 |     +16/−16 | yes              | out-of-band           | test: follow the API version bump to 22 in the hosting request snapshots                                       |
| `46b76a7c6` | 2026-07-11 | eric/item-schedules-ui       |     1 |       +4/−1 | **no**           | out-of-band           | test: mock nanoid in handleInitiateOrderPayment so quoteVersion snapshots are deterministic                    |
| `b7bdcaccf` | 2026-08-31 | backup/pre-rebase-2026-09-09 |    15 |   +476/−282 | yes              | out-of-band (rebase)  | chore: reconcile snapshots and test seeds after rebasing onto availability-aware main                          |
| `47237cbb2` | 2026-08-20 | backup/pre-rebase-2026-09-09 |     2 |     +35/−19 | yes              | out-of-band (rebase)  | chore: reconcile lockfile, snapshot mask, and doc wording after rebasing onto firebase-kit 2.0.0 main          |
| `21f2be110` | 2026-08-19 | backup/pre-rebase-2026-09-09 |     4 |      +27/−9 | yes              | out-of-band (rebase)  | chore: refresh repeat-order snapshots and import style after rebasing onto main                                |

Scale: the three out-of-band sweeps of 2026-09-03/05 alone are **+9 010/−2 791 over 49 files**,
against a window total of 245 182 added test lines — i.e. ~3.7 % of all test lines added in
the window were written to undo drilling that mise's own checklist rule 6 already forbade.

---

## B. Comment and doc verbosity

### B.1 Weekly series (added lines in non-test source, and `.md` outside `.mise/`)

| ISO week  |  src+ lines | comment lines | code lines | comment:code | JSDoc blocks >5 lines | /kloc src | `.md`+ outside `.mise/` | `.md`+ inside `.mise/` |
| --------- | ----------: | ------------: | ---------: | -----------: | --------------------: | --------: | ----------------------: | ---------------------: |
| 2026-W28  |       5 721 |         1 049 |      4 078 |         0.26 |                    44 |       7.7 |                   1 625 |                      0 |
| 2026-W29  |       6 512 |           851 |      4 913 |         0.17 |                    27 |       4.1 |                     304 |                  1 336 |
| 2026-W30  |       9 775 |         1 608 |      7 134 |         0.23 |                    62 |       6.3 |                     846 |                  3 031 |
| 2026-W31  |         773 |           148 |        539 |         0.28 |                     4 |       5.2 |                   4 529 |                  7 832 |
| 2026-W32  |      22 929 |         6 074 |     14 253 |         0.43 |                   325 |      14.2 |                   2 808 |                  7 785 |
| 2026-W33  |       9 903 |         4 716 |      4 678 |     **1.01** |                   412 |  **41.6** |                     712 |                  4 655 |
| 2026-W34  |       4 099 |           829 |      2 855 |         0.29 |                    52 |      12.7 |                     591 |                    622 |
| 2026-W35  |       1 042 |           146 |        776 |         0.19 |                     6 |       5.8 |                     135 |                      0 |
| 2026-W36  |      11 864 |         2 951 |      7 891 |         0.37 |                   173 |      14.6 |                   1 518 |                  5 785 |
| 2026-W37  |      16 185 |         1 749 |     12 454 |         0.14 |                    61 |       3.8 |                     489 |                  4 283 |
| 2026-W38  |      20 094 |         2 922 |     14 583 |         0.20 |                    70 |       3.5 |                     636 |                    695 |
| **total** | **108 900** |    **23 043** | **74 157** |     **0.31** |             **1 236** |  **11.4** |              **14 463** |             **36 024** |

`.mise/` markdown (36 024 lines) is 2.5× the product markdown (14 463) and 0.49× all
non-test source lines added.

### B.2 Prose volume by mise stage (commit-subject bucket)

| bucket                                                   | commits | comment lines | code lines | comment:code | JSDoc >5 | `.md`+ |
| -------------------------------------------------------- | ------: | ------------: | ---------: | -----------: | -------: | -----: |
| `Docs: …` (documenter stage)                             |     117 |         2 437 |        209 |    **11.66** |      126 |  7 272 |
| `Task N…` (implementer)                                  |     213 |         5 510 |     25 617 |         0.22 |      278 |  3 094 |
| `mise: …` (state)                                        |     419 |             0 |          0 |            — |        0 |     62 |
| other (`feat:`/`refactor:`/`docs:`/`fix:`/squash merges) |     251 |        15 096 |     48 331 |         0.31 |      832 |  4 035 |

The documenter stage produces ~21 comment lines and ~62 markdown lines per commit against
1.8 code lines. 59 commits in the window add comment lines and **zero** code lines
(2 149 comment lines total).

Single-commit extremes:

| sha         | date       | comment lines | code lines | JSDoc >5 | subject                                                                          |
| ----------- | ---------- | ------------: | ---------: | -------: | -------------------------------------------------------------------------------- |
| `da2228554` | 2026-08-10 |         1 799 |        356 |      137 | refactor: attribution vocabulary enums, nanoid device ids, comment register pass |
| `1ad7b243e` | 2026-09-09 |           713 |      **0** |        9 | Docs: comments and JSDoc for the Dashboard cycle                                 |
| `a38992b65` | 2026-09-02 |           602 |        205 |       30 | docs: doc-style pass over the attribution branch…                                |
| `c5815da66` | 2026-08-10 |           577 |         15 |       65 | refactor: make the stored lifecycle metric names host-neutral                    |
| `b4a1b9f54` | 2026-09-03 |           322 |      **0** |       29 | docs: rewrite em-dash and semicolon comment joiners across the branch            |

### B.3 Doc churn

| file                                           | added | deleted | commits touching | lines at `main` |
| ---------------------------------------------- | ----: | ------: | ---------------: | --------------: |
| `docs/design/attribution.md`                   | 5 442 |   4 990 |               95 |             241 |
| `docs/design/attribution-package.md`           | 1 284 |   1 284 |               13 | **0** (deleted) |
| `docs/design/attribution-package-contracts.md` |   866 |       — |                — |               — |
| `packages/attribution/README.md`               |   571 |       — |                — |               — |
| `docs/design/attribution-package-mechanics.md` |   571 |       — |                — |               — |
| `docs/design/whatsapp-messages.md`             |   307 |      15 |               11 |             584 |

`attribution.md` was rewritten 95 times to land at 241 lines — 22.6 lines written per surviving line.

### B.4 Comment/doc rework commits

| sha          | date       | files |         +/− | subject                                                                                           |
| ------------ | ---------- | ----: | ----------: | ------------------------------------------------------------------------------------------------- |
| `a38992b65`  | 2026-09-02 |   257 | +1653/−2314 | docs: doc-style pass over the attribution branch, with the qr-scan and SummaryGranularity renames |
| `da22285546` | 2026-08-10 |   247 | +3353/−4358 | refactor: attribution vocabulary enums, nanoid device ids, comment register pass                  |
| `b4a1b9f54`  | 2026-09-03 |   170 |   +655/−632 | docs: rewrite em-dash and semicolon comment joiners across the branch                             |
| `e91760c32`  | 2026-08-19 |    29 |     +97/−54 | Docs: prose pass — settle comments, owed doc notes, stale-claim sweep                             |
| `dba486a09`  | 2026-08-10 |    23 |     +66/−69 | docs: replace the beacon jargon with plain browser-event wording                                  |
| `ea4be09b0`  | 2026-09-03 |    19 |     +38/−37 | docs: rewrite em-dash comment sentences in the package                                            |
| `c7a29dedb`  | 2026-09-03 |    12 |     +30/−29 | docs: rewrite semicolon-joined comment sentences in the package                                   |
| `adc27a0ed`  | 2026-09-07 |    10 |     +26/−27 | Task 5.1: point the kept attribution helpers' JSDoc away from the deleted pages                   |
| `fe76bf00b`  | 2026-09-05 |     7 |     +21/−17 | docs: say what each round-trip test and comment actually checks                                   |
| `50f3d2e73`  | 2026-08-10 |     5 |   +90/−1783 | docs: add the writing-style skill, comment register pass on design docs, enum-vs-const rule       |
| `ca0ee744a`  | 2026-08-14 |     3 |      +22/−5 | Task 4.4 (review fixes): correct the notes comment and the campaigns Verify line                  |
| `2d468cd63`  | 2026-09-05 |     3 |       +7/−6 | docs: call the touch location-selected in the switch and handle test comments                     |
| `d63dbb319`  | 2026-08-14 |     2 |      +15/−2 | Task 2.4 (review fix): correct a stale card stat comment in the summarization test                |
| `89d2cc249`  | 2026-08-24 |     2 |      +1/−28 | refactor: drop the tracking-absence comment and test plumbing from the short-link page            |
| `4aa2dc719`  | 2026-09-03 |     2 |       +5/−8 | fix: plain-register wording for the multi-period footnote                                         |
| `fcd1b02a9`  | 2026-08-12 |     1 |       +4/−5 | docs: simplify the summary prefix encoder's doc comment                                           |
| `caf512d40`  | 2026-09-05 |     1 |       +3/−2 | docs: explain the whole-key prefix scan comment plainly                                           |
| `e3e78db42`  | 2026-09-05 |     1 |       +0/−4 | docs: drop the JSDoc glosses on the attribution id aliases to match the rest                      |
| `e2b1969b5`  | 2026-09-03 |     1 |       +1/−1 | docs: reword the getEventConfigs comment without em-dashes                                        |
| `f0fa94426`  | 2026-08-02 |     1 |       +2/−2 | docs: specify keepalive beacon delivery and correct missed-emit backstop wording                  |
| `50dd1a170`  | 2026-08-02 |     1 |       +5/−4 | docs: tighten label charset to lowercase alphanumerics and hyphens                                |

All 21 have `.mise/` in tree. Top three total **+5 661/−7 304 over 674 files**.
Three of them (`b4a1b9f54`, `ea4be09b0`, `c7a29dedb`, `e2b1969b5`) exist only to remove
em-dashes and semicolons from comments — a punctuation rule, not a content rule.

### B.5 Fifteen offending passages added during mise runs

All from commits whose tree contains `.mise/`. "Why slop" uses: **restates** (the words are
the identifier below, respaced), **narrates** (tells the change's history rather than the
code's meaning), **hedges**, **filler** (contentless opener), **scaffolding** (agent process
leaked into source), **volume** (correct content, disproportionate length).

| #   | sha                                      | file                                                                                   | text                                                                                                                                                                                                                                                                                                                                                                   | why slop                                                                                                                                                                                                         |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `7b2e9f26d`                              | `functions/src/utils/callable/app/handleGetCampaignSpend.ts`                           | `// 2. API Version Check` above `const data = checkAPIVersion(auth, dataWithVersion, 21)`                                                                                                                                                                                                                                                                              | restates — 100 % word overlap with the call. Replicated verbatim in ≥6 callables added in the window (`498efd41f`, `622357072`, `6fc21cb08`, `40634df74`, `614e695f5`, `a5e6bd153`).                             |
| 2   | `12c483442`                              | `packages/types/src/functions/jobs.ts`                                                 | `/** Request data type for a given JobsCommand */` above `export type JobsRequestFor<A extends JobsCommand> =`                                                                                                                                                                                                                                                         | restates — name is `JobsRequestFor<A extends JobsCommand>`                                                                                                                                                       |
| 3   | `12c483442`                              | `packages/types/src/functions/jobs.ts`                                                 | `/** Response data type for a given JobsCommand */` above `export type JobsResponseFor<A extends JobsCommand> =`                                                                                                                                                                                                                                                       | restates — same, mirrored                                                                                                                                                                                        |
| 4   | `a38992b65`                              | `packages/types/src/functions/jobs.ts`                                                 | `* Used to build per-action request and response types.`                                                                                                                                                                                                                                                                                                               | filler — "Used to build" opener; says nothing the type name and its two members do not                                                                                                                           |
| 5   | `8dc21b703`                              | `packages/attribution/src/types.ts`                                                    | `/** The credited source, or \`Absent\` */`above`source: S['source'] \| typeof Absent`                                                                                                                                                                                                                                                                                 | restates — the union is the sentence                                                                                                                                                                             |
| 6   | `8dc21b703`                              | `packages/attribution/src/types.ts`                                                    | `/** The credited label, or \`Absent\` */`above`label: string \| typeof Absent`                                                                                                                                                                                                                                                                                        | restates — sibling of #5, same template                                                                                                                                                                          |
| 7   | `8dc21b703`                              | `packages/attribution/src/types.ts`                                                    | `/** The breakout value, or \`Absent\` */`above`value: string \| typeof Absent`                                                                                                                                                                                                                                                                                        | restates — third instance of the same template in one file                                                                                                                                                       |
| 8   | `8dc21b703`                              | `packages/attribution/src/types.ts`                                                    | `/** One row per credited source, in source order */` above `sources: readonly SummarySourceRow<S>[]`                                                                                                                                                                                                                                                                  | restates — "row per source, in order" = `readonly SummarySourceRow[]`                                                                                                                                            |
| 9   | `c85a6c51f` → `b5a28a446`                | `packages/attribution/src/types.ts`                                                    | `/** The owner type events of this type require, or \`'none'\` */` then re-landed the next day (`b5a28a446`, 2026-09-03) as `…or \`Ownerless\``                                                                                                                                                                                                                        | restates + churn — the comment's only content is the union member, so renaming the member forces a comment edit                                                                                                  |
| 10  | `5b623628c`                              | `packages/types/src/attributionDocument.ts`                                            | `/** Events per event type */` above `counts: Partial<Record<DeclaredEventType<OkvenAttributionShape>, number>>`                                                                                                                                                                                                                                                       | restates                                                                                                                                                                                                         |
| 11  | `a5e6bd153`                              | `hosting/utils/attribution/trackAttributionEvent.ts`                                   | `/** The Functions emulator port from \`firebase.json\`. */`above`const FunctionsEmulatorPort = 5001`                                                                                                                                                                                                                                                                  | restates — name carries "Functions emulator port"                                                                                                                                                                |
| 12  | `d93f76331` / `fdad1006c`                | `hosting/components/molecules/ScheduleRuleRow.vue`                                     | `/** Label of the remove action */` above `removeLabel?: string`                                                                                                                                                                                                                                                                                                       | restates; added twice (two branches)                                                                                                                                                                             |
| 13  | `220c3fc01` (also `70491a6c4`)           | `hosting/composables/useMenuAvailabilityPage.ts`                                       | `// TODO: CONTINUE HERE. DO NOT REMOVE OR DO ANYTHING WITH THIS COMMENT.` and `// TODO: Should we update the back-end so that it supports multiple operations per call so that we can do this in a single call? Let's discuss.`                                                                                                                                        | scaffolding — agent run-state and a conversational aside committed to source. Gone from HEAD, so it survived at least one review round. Checklist rule 1 bans leftover debug code; neither line is "debug code". |
| 14  | `b37e2cd93`                              | `packages/types/src/attributionSummary.ts`, `attributionCard.ts`, `attributionMeta.ts` | 20–22-line JSDoc blocks whose middle paragraph — "carries neither `Testable` (test entities emit nothing at all, so a `test` field would be dead on every document and would imply a filtering path that must not exist) nor `Versioned` (the schema belongs to…)" — is repeated near-verbatim in 3 sibling files in one commit (+154 comment lines vs +88 code lines) | volume + duplication — one rationale, three copies, each needing its own future edit                                                                                                                             |
| 15  | `423a00837` (re-landed from `622357072`) | `functions/src/utils/callable/app/handleGetCampaigns.ts`                               | 29-line JSDoc opening "Serves `/staff/atribucion/campanas` in one request… Two sources of fact, and which one answers what is the whole design…" — a design-doc section inside a function header; the 21-line predecessor was rewritten to 29 lines 0 days later in a `(review fixes)` commit                                                                          | volume + churn — design rationale duplicated between `docs/design/attribution.md` and the header, so both drift                                                                                                  |

Two further markdown examples of narration/hedging survive in `docs/design/attribution.md`
(`18704f1cd` and `423a00837` add near-identical 3-sentence passages about "the **unfiltered**
location queries… because the orderable-status pair would report a paused restaurant as
unresolvable") — the same paragraph written twice in the same week, in a file that was
rewritten 95 times.

**Counter-finding.** A marker sweep for restating/narrating/hedging/filler phrases over every
added comment run and markdown paragraph (`tools/slop_candidates.py`) returned 1 129 candidates
from 1 000 commits; of the 472 in-mise-run source/markdown candidates only **21 matched two or
more markers**, and reading those 21 shows most are dense, load-bearing prose that happens to
contain the word "may" or "no longer". The lexical-slop hypothesis is **not supported**: what
the data supports is _volume_ (11.66 comment:code in the documenter stage, 1 236 JSDoc blocks
over 5 lines) and _restatement of adjacent code_ (§B.5 #1–#12), not filler language.

---

## C. Rule timeline vs offense rate

mise versions (from `git log` of `mise-claude-plugin/.claude-plugin/plugin.json`; no
`inventory/provenance.md` exists yet — checked 2026-09-19):

| version | first commit date | sha         |
| ------- | ----------------- | ----------- |
| 1.0.0   | 2026-07-13        | `50c377e29` |
| 1.0.1   | 2026-07-14        | `d313ce642` |
| 1.1.0   | 2026-07-15        | `f374756e5` |
| 1.2.0   | 2026-07-16        | `a4e384692` |
| 1.3.0   | 2026-07-17        | `c9d5646ef` |
| 1.4.0   | 2026-07-18        | `58d4b1ad3` |
| 1.5.0   | 2026-07-23        | `50b5f2b9c` |
| 1.6.0   | 2026-07-28        | `28b1acd30` |
| 1.7.0   | 2026-08-14        | `b1c15ca2e` |
| 2.0.0   | 2026-08-18        | `53896d72a` |
| 2.1.0   | 2026-09-12        | `8d2d8ecd5` |

Okven rule changes (`git log -S` over `*CLAUDE.md` and `.claude/*`, Delta Review refs excluded;
dates are the earliest authored commit carrying the phrase, not the squash-merge date):

| rule                                     | phrase                                                                     | first added                                | later reworded                                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| inline snapshots                         | "Always use inline snapshots" (`CLAUDE.md:138`)                            | **2025-10-04** `175cd64fa`                 | 2025-10-14 `ee7680d17`. **Unchanged through the whole window.**                                             |
| snapshot whole send                      | "Snapshot the whole send" (`functions/CLAUDE.md:24`)                       | 2026-08-19 `4d530d5ad`                     | none                                                                                                        |
| no Firestore reads in tests              | "Never read Firestore in a test" (`functions/CLAUDE.md:23`)                | 2026-08-19 `4d530d5ad`                     | none                                                                                                        |
| no bulk snapshot refresh                 | "Never bulk-regenerate snapshots" (`CLAUDE.md:147`)                        | 2026-08-19 `4d530d5ad`                     | none                                                                                                        |
| **no drilling**                          | "**No drilling inside `expect()`**" (`CLAUDE.md:139`)                      | **2026-09-05** `b808c9719`                 | 2026-09-18 `201000116` (wording only: "make it small:" → "make it small by injecting")                      |
| comment/doc register + `doc-style` skill | "Comment and doc register" (`CLAUDE.md:91`), `.claude/skills/doc-style/`   | **2026-08-10** `50f3d2e73`                 | 2026-09-07 `780b6a228`, 2026-09-09 `96e20f6b2`, 2026-09-18 `201000116`                                      |
| comment line width                       | "Comment line width" (`CLAUDE.md:89`)                                      | 2026-04-23 `44af3c3d9`                     | none in window                                                                                              |
| comments above code                      | "Comments on line above code" (`CLAUDE.md:88`)                             | 2025-08-28 `76ad6e708`                     | none in window                                                                                              |
| **project review checklist**             | `.claude/mise-checklist.md` (rule 6 whole-value assertions, rule 15 prose) | **2026-08-19** `bd05067fb` ("mise: setup") | 2026-08-31, 2026-09-03, 2026-09-05, 2026-09-09, 2026-09-12, 2026-09-18 `e41081f76` ("answers all 15 rules") |

### C.1 Before/after, with n

Each row is the whole in-window corpus on that side of the date. `n` = added lines, and the
commit count.

| rule change                     | side   | commits | test+ lines (n) | drill | drill/kloc | src+ lines (n) | comment lines | code lines | cmt:code | JSDoc>5 | /kloc |
| ------------------------------- | ------ | ------: | --------------: | ----: | ---------: | -------------: | ------------: | ---------: | -------: | ------: | ----: |
| doc-style skill (2026-08-10)    | before |     441 |          53 014 |    91 |        1.7 |         45 713 |         9 730 |     30 920 |     0.31 |     462 |  10.1 |
|                                 | after  |     559 |         192 168 |   439 |        2.3 |         63 187 |        13 313 |     43 237 |     0.31 |     774 |  12.2 |
| mise-checklist (2026-08-19)     | before |     563 |          70 094 |   121 |        1.7 |         55 616 |        14 446 |     35 598 |     0.41 |     874 |  15.7 |
|                                 | after  |     437 |         175 088 |   409 |        2.3 |         53 284 |         8 597 |     38 559 |     0.22 |     362 |   6.8 |
| no-drilling rule (2026-09-05)   | before |     614 |         114 756 |   386 |        3.4 |         71 950 |        18 188 |     46 670 |     0.39 |   1 091 |  15.2 |
|                                 | after  |     386 |         130 426 |   144 |        1.1 |         36 950 |         4 855 |     27 487 |     0.18 |     145 |   3.9 |
| checklist "all 15" (2026-09-18) | before |     893 |         187 132 |   526 |        2.8 |         88 806 |        20 121 |     59 574 |     0.34 |   1 166 |  13.1 |
|                                 | after  |     107 |          58 050 |     4 |        0.1 |         20 094 |         2 922 |     14 583 |     0.20 |      70 |   3.5 |

### C.2 Reading

- **Inline-snapshot rule:** no in-window change to compare against. The rule has been stable
  since 2025-10-04 and its offense count in the window is 0. **No comparison possible.**
- **doc-style skill (2026-08-10):** comment:code identical on both sides (0.31 vs 0.31,
  n = 30 920 / 43 237 code lines); JSDoc>5 per kloc rose 10.1 → 12.2 (n = 45 713 / 63 187 src
  lines). **No improvement detectable**; direction is slightly worse.
- **mise-checklist (2026-08-19):** comment:code 0.41 → 0.22, JSDoc>5/kloc 15.7 → 6.8
  (n = 55 616 / 53 284 src lines). Drill/kloc went the wrong way, 1.7 → 2.3
  (n = 70 094 / 175 088 test lines).
- **no-drilling rule (2026-09-05):** drill/kloc 3.4 → 1.1 (n = 114 756 / 130 426 test lines,
  386 → 144 occurrences). This is the one comparison with adequate n on both sides **and** a
  large move. It is confounded: the 2026-09-03/05 out-of-band sweeps (§A.3) removed the
  violations at the same moment the rule was written, and the "after" side is dominated by two
  different feature branches.
- **checklist "all 15" (2026-09-18):** after side is **1 day and 107 commits** on one branch
  (`feat/first-time-offer`, `feat/upgrade-packages`). **Insufficient n** — do not read a trend.
- **Every comparison above is confounded by branch composition**, not just by time: 596 of the
  1 000 commits sit on `backup/pre-rebase-2026-09-09` (the attribution v2 work), which supplies
  most of August. A per-branch, per-rule design would be needed to separate rule effect from
  feature effect, and the window does not contain enough branches to do it.

---

## D. Lint feasibility in Okven's existing setup

All probes run read-only from `/Users/eric/Code/okven` with
`npx eslint --no-config-lookup -c <probe> --no-ignore`; config kept out of the repo. No
Okven file was modified. Probe config preserved at `../tools/lint-probe/eslint.probe.mjs`.

| #   | offense                                                                                   | concrete rule                                                                                                                                                                                                                                                                                                                                                                                                      | new dependency? | autofixable                                                                                        | measured on Okven                                                                                                                                                                                                                                                                                                                                                                                                                             | expected false positives                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | external snapshot file (`toMatchSnapshot`, `.snap`)                                       | `no-restricted-syntax` selector `CallExpression[callee.property.name=/^(toMatchSnapshot\|toMatchFileSnapshot)$/]`, scoped to `**/*.test.ts`                                                                                                                                                                                                                                                                        | none            | no                                                                                                 | 0 hits in added lines in the window, and 0 occurrences in the tree at HEAD (`grep -rn 'toMatchSnapshot' --include='*.ts' functions hosting packages`)                                                                                                                                                                                                                                                                                         | ~0                                                                                                                                                                                                                                                                                                                                                                                       |
| D2  | big literal passed to `toEqual`/`toStrictEqual`/`toMatchObject`                           | `no-restricted-syntax` selector `CallExpression[callee.property.name=/^(toEqual\|toStrictEqual\|toMatchObject)$/] > :matches(ObjectExpression, ArrayExpression)`                                                                                                                                                                                                                                                   | none            | no                                                                                                 | **26 hits** across 756 test files                                                                                                                                                                                                                                                                                                                                                                                                             | moderate: the selector cannot measure line span, so it also flags `toEqual(['entry-2'])`. A minimal custom rule reading `node.loc.end.line - node.loc.start.line >= 4` removes them; ESLint's `context.sourceCode` gives `loc` directly, ~20 lines of rule code.                                                                                                                         |
| D3  | **drilling inside `expect()`** (the live offense)                                         | `no-restricted-syntax`, two selectors: `CallExpression[callee.name='expect'] MemberExpression[property.name='length']` and `CallExpression[callee.name='expect'] MemberExpression[computed=true][property.type='Literal']`                                                                                                                                                                                         | none            | no                                                                                                 | **1 081 + 34 hits** across 756 test files (probe run 2026-09-19)                                                                                                                                                                                                                                                                                                                                                                              | low. 14 sampled hits were all genuine: `expect(vi.mocked(sendCTAURLMessage).mock.calls[0]).toMatchInlineSnapshot(…)`. Real FPs: an index on _setup_ data inside `expect`, e.g. `expect(fixtures[0].id)`. Add `.at(`/`.map(` selectors for the remaining forms in `CLAUDE.md:139`. **Backlog of 1 081 means it must ship as `warn` + `--max-warnings` ratchet, or with a baseline file.** |
| D4  | JSDoc block longer than N lines                                                           | no stock rule. Minimal custom rule: iterate `sourceCode.getAllComments()`, flag `Block` comments starting `*` where `loc.end.line - loc.start.line + 1 > N`. ~15 lines.                                                                                                                                                                                                                                            | none            | no                                                                                                 | at N=5: **1 236 blocks added in the window**; span distribution 6→194, 7→112, 8→56, 9→51, 10→42, ≥11 → 106                                                                                                                                                                                                                                                                                                                                    | low (mechanical). Judgment lives entirely in choosing N.                                                                                                                                                                                                                                                                                                                                 |
| D5  | comment:code ratio per file/diff                                                          | not expressible as an ESLint rule (ESLint has no diff or cross-node aggregate). Closest deterministic proxy: a CI script over `git diff --numstat`-style added lines — `tools/scan_offenses.py` already computes it per commit.                                                                                                                                                                                    | —               | no                                                                                                 | documenter-stage commits sit at 11.66; implementer at 0.22                                                                                                                                                                                                                                                                                                                                                                                    | n/a                                                                                                                                                                                                                                                                                                                                                                                      |
| D6  | comment restates the code below it                                                        | `jsdoc/informative-docs` (plugin **already installed** as a transitive dep of `@nuxt/eslint-config`)                                                                                                                                                                                                                                                                                                               | none            | no                                                                                                 | **1 hit** across 184 files probed — the rule only compares the description to the _symbol name_, and Okven's restatements paraphrase the _type annotation_. **Effectively useless here.** A custom rule comparing comment tokens to the next declaration's identifier **and** its type annotation, camelCase-split, ≥60 % overlap and ≤2 novel words, finds 76 in the window / 24 in mise runs (`tools/restate.py`) and produced §B.5 #1–#12. | the custom proxy misses comments too short to score (<3 content words); its FPs are enum-member one-liners that CLAUDE.md and checklist rule 15 **require**, so the rule would contradict a standing rule unless enum members are exempted.                                                                                                                                              |
| D7  | comment narrates history / hedges                                                         | `jsdoc/match-description` with `contexts: ['any']` and a negative-lookahead `matchDescription` banning `no longer\|previously\|used to\|instead of\|we now\|this change\|originally\|may\|might\|probably\|for now`                                                                                                                                                                                                | none            | no                                                                                                 | **19 hits** across 187 files probed                                                                                                                                                                                                                                                                                                                                                                                                           | high. Manual read of the top multi-marker candidates (§B.5 counter-finding) shows most hits are legitimate — "`share` and `flyer` are no longer produced but survive in already-shared links" is exactly the comment a maintainer needs. Not recommended as an error.                                                                                                                    |
| D8  | em-dash / semicolon joiners in comments (the thing 4 rework commits removed)              | `no-restricted-syntax` cannot see comment text; a custom rule over `getAllComments()` with `/—\|; /` is ~10 lines                                                                                                                                                                                                                                                                                                  | none            | **yes** (trivial text replace, but the replacement is a judgment call — `—` → `.` changes meaning) | not probed                                                                                                                                                                                                                                                                                                                                                                                                                                    | low mechanically; the autofix is unsafe, so `warn`-only.                                                                                                                                                                                                                                                                                                                                 |
| D9  | prose quality: "is this comment worth its length", "does this doc restate the design doc" | **no lint rule can decide this.** Closest deterministic proxies, in order of how much they actually catch: D4 (length cap), D5 (ratio ceiling per diff), D6-custom (restatement), plus "a JSDoc paragraph that also appears in `docs/design/*.md`" — a duplicate-substring check over comment text vs the design docs, which would have caught §B.5 #15 and the duplicated `docs/design/attribution.md` paragraph. | —               | —                                                                                                  | —                                                                                                                                                                                                                                                                                                                                                                                                                                             | —                                                                                                                                                                                                                                                                                                                                                                                        |
| D10 | scaffolding left in source (`TODO: CONTINUE HERE`, "Let's discuss")                       | `no-warning-comments` (ESLint core) with `terms: ['todo','fixme','continue here','let's discuss']`, `location: 'anywhere'`                                                                                                                                                                                                                                                                                         | none            | no                                                                                                 | not probed; §B.5 #13 shows 2 instances reached commits on 2 branches                                                                                                                                                                                                                                                                                                                                                                          | low — but the repo may legitimately want `TODO`s; scope to `terms` beyond plain TODO if so.                                                                                                                                                                                                                                                                                              |

**Summary for D.** Everything the owner named as "test style" is already at zero except
drilling, and drilling is the one offense that is exactly, cheaply lintable today (D3) with no
new dependency — at the cost of a 1 081-instance backlog. Everything the owner named as
"AI-slop prose" is only mechanically reachable as _length_ (D4) and _ratio_ (D5); the one
stock rule for restatement (D6) finds 1 case in 184 files, and the one stock rule for register
(D7) has an unacceptable false-positive rate on this codebase's prose.

---

## Reproduce

```sh
cd /Users/eric/Code/okven
git log --branches --remotes --since=2026-07-01 --no-merges -p -U10 \
  --format=$'\x01C\x01%H\x01%aI\x01%an\x01%s' \
| python3 ../mise-claude-plugin/docs/v3-research/tools/scan_offenses.py examples.jsonl > commits.jsonl
python3 ../mise-claude-plugin/docs/v3-research/tools/weekly.py commits.jsonl mise_flags.txt > okven-offenses.csv
python3 ../mise-claude-plugin/docs/v3-research/tools/before_after.py commits.jsonl 2026-09-05:no-drilling
bash ../mise-claude-plugin/docs/v3-research/tools/rule_timeline.sh
```

## Gaps

1. **Who caught each escape is not in git.** All 1 000 commits have author `Eric Vera`; only 5
   carry a `Co-Authored-By` trailer. "Rework = an escape a human caught" cannot be measured from
   history. §A.3 uses a commit-subject convention proxy (`Task N.N (review fixes)` = mise's
   reviewer stage vs bare `refactor:`/`fix:` = out-of-band session) and labels it as such. The
   Delta Review human notes live in `refs/review-notes/*`, but those refs store only
   UUID-named _file snapshots_ (verified: `refs/review-notes/feat/first-time-offer` holds two
   blobs, both plain source/markdown) — the note text is not in git.
2. **The mise-run flag is coarse.** `.mise/` in tree = 905/1000 commits; it marks "a mise run
   was in flight on this branch", not "this commit was written by a mise subagent".
3. **Branch composition confounds every before/after in §C.** 596 of 1 000 commits are on one
   branch. Not enough independent branches in the window to separate rule effect from feature
   effect. No comparison in §C should be read as causal.
4. **Multi-line detection is hunk-bounded.** `-U10` context; a `toEqual` literal or JSDoc block
   whose close falls more than 10 unchanged lines past the last changed line is not counted.
   Cross-checked against `grep`: `toMatchInlineSnapshot` count matches exactly (5 357), so the
   single-line counters are exact; the span-based counters (`big_literal`, `jsdoc_gt5`) are
   lower bounds.
5. **Comment detection is regex-based**, not AST-based, for the historical sweep — a line
   inside a template literal that starts with `//` counts as a comment. The D3/D6/D7 numbers
   are AST-based (real ESLint run) and are not affected.
6. **Squash merges hide authored dates.** Rules that reach `main` in a squash (`4d530d5ad`,
   `201000116`) were written earlier on a branch; §C uses the earliest branch commit carrying
   the phrase, which is still an upper bound on when the rule was first written.
7. **No transcript evidence.** This task was scoped to git history; mise run transcripts were
   not read, so "the agent was told the rule and broke it anyway" is not established — only
   that the rule text and the offense coexist in the repo.
8. **`inventory/provenance.md` does not exist** (checked 2026-09-19); mise versions in §C were
   derived from `plugin.json` history instead.
9. **D2/D8/D10 hit counts are unmeasured** (selectors written but not run repo-wide); only
   D1, D3, D6, D7 were probed with a real ESLint run.
