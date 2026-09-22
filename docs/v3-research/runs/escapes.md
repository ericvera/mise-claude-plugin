# Defect-escape record

What the owner had to catch himself, from 537 Delta Review notes over 16 mise runs
(2026-07-27 .. 2026-09-19) plus the session transcripts of the runs that produced them.
Tables only. Sources: `runs/delta-notes.jsonl` (re-verified and rewritten in this round),
`runs/owner-messages.jsonl` (new), okven's `.mise/_friction.md` on 26 review refs, and the 99
session digests. Scripts: `tools/verify_rule_escapes.py`, `tools/fix_rule_escapes.py`,
`tools/taxonomy.py`, `tools/note_code.py`, `tools/note_fix_commits.py`,
`tools/note_fix_latency.py`, `tools/correction_types.py`,
`tools/lint-probe/eslint.escapes.mjs`, `tools/extract-owner-messages.mjs`.

**The three things this report asks the reader to carry away.** (1) "Tests not using inline
snapshots" means an assertion applied to a drilled or re-assembled sub-value, not a missing
`toMatchInlineSnapshot` — section 1.1. (2) 62 of the 162 test/doc notes had **no written rule
at the time**, and 22 of the 41 corrected rule-escapes were credited to rules committed hours
_after_ the notes that produced them — sections 0.2 and 1.5. (3) Only 4 of 222 questions mise
asked the owner were answerable from the repo, so the friction is not redundant asking; it is
54 verbatim complaints about output the owner cannot read and gates that run before he has
finished looking — sections 8 and 9.

---

## 0. Verification of the input (round 1's delta-notes.jsonl)

### 0.1 Blind re-classification, every 4th note

| Metric                                                          | Value                             |
| --------------------------------------------------------------- | --------------------------------- |
| n re-classified blind (rows 4, 8, 12 … of the 537 unique notes) | 134                               |
| Agreement with the recorded category                            | 128 (95.5%)                       |
| Disagreements                                                   | 6, all on the `question` boundary |

| Row  | Recorded               | Blind                | Note (truncated)                                                                                                            |
| ---- | ---------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| R16  | over-engineering       | question             | "Why are the touch and the 'resolved to a location' mixed in the touch itself?"                                             |
| R159 | dead-or-duplicate-code | question             | "should this return the full object including the id instead of just the data?"                                             |
| R191 | wrong-behaviour        | question             | "Isn't the spendConfig optional?"                                                                                           |
| R259 | question               | convention-violation | "Does the type of prop.stages and StageLabels match in a way that if another stage is added, a compile error will surface…" |
| R485 | question               | over-engineering     | "Is there by chance a well maintained npm package that already does this without a lot of baggage?"                         |
| R554 | over-engineering       | comment-doc-slop     | "is the description here really needed as it is already mentioned multiple times in the prompt"                             |

No disagreement touched `test-style` or `comment-doc-slop`, the two categories this
report is built on. Round 1's own stated gap (question-vs-defect boundary) is the only
one that reproduces.

### 0.2 Rule-escape list: every cited rule opened and dated

Each distinct `ruleAlreadyExisted` string was resolved to its `file:line`, that line was
read at okven HEAD, and the rule's first-introducing commit was found with
`git log --all -S '<phrase>' -- <file>`. 32 cited `file:line` refs; all 32 resolve at HEAD
to text matching the quoted rule (0 citation errors). Dates were another matter.

| Outcome                                                           | Rows                   | Effect                                                     |
| ----------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------- |
| Confirmed (rule covers the note, rule predates the note)          | 80                     | kept                                                       |
| Date corrected, verdict unchanged                                 | 47                     | 42 kept; 5 were already `no-rule at note time` and stay so |
| Reassigned to the rule that actually covers it                    | 15                     | kept                                                       |
| **Downgraded — the rule did not exist when the note was written** | **22**                 | dropped                                                    |
| **Downgraded — the rule does not cover the note**                 | **19**                 | dropped                                                    |
| Already `no-rule`                                                 | 354                    | —                                                          |
| **Verified rule escapes**                                         | **137 (25.5% of 537)** | was 178 (33%)                                              |

The 41 downgrades:

| Rows                                     | Cited rule                                                   | Why it fails                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R438, R439, R440, R441, R442, R447, R476 | okven/CLAUDE.md:87 "Optional means a caller omits it"        | Rule first committed `ee31fed69` **2026-08-31T18:02:49Z**. All 7 notes are 2026-08-31T02:50–17:22Z. The rule is the _response_ to these notes.                                                                                                                                                                       |
| R445, R454–R460, R463–R467, R472         | okven/CLAUDE.md:145 "Test scenarios, not individual outputs" | The rule that covers "beforeEach?" is **functions/CLAUDE.md:21 "Hoist shared setup into beforeEach"**, first committed `337012e57` **2026-08-31T18:02:22Z**; all 14 notes are 2026-08-31T03:09–04:52Z. CLAUDE.md:145 governs assertion grouping, not setup hoisting; checklist:18 only dates from 2026-08-31T23:57Z. |
| R274                                     | okven/CLAUDE.md:84                                           | Rule committed `3d587e712` 2026-08-20T23:57:18Z; note at 2026-08-20T22:14:10Z — 1h43m earlier.                                                                                                                                                                                                                       |
| R155, R159                               | CLAUDE.md:139 no-drilling                                    | Both notes are on production source `createAttributionStore.ts`, asking whether a store method returns the full object. The rule governs test assertions. Keyword false positive.                                                                                                                                    |
| R59, R93, R95, R231, R261                | CLAUDE.md:118 enum placement                                 | Rule says where enums and constants live. These ask whether a value should be an enum at all, how enum values are cased, or about an error message.                                                                                                                                                                  |
| R195, R221, R295                         | mise-config.md:44 colocated test                             | **Inverse of the rule**: the agent _added_ tests the project convention forbids (db-refs, Vue files, atoms) and the owner asked for them to be removed. The rule pushes toward the defect.                                                                                                                           |
| R239, R234                               | colocated-test / helper-first                                | Missing-assertion notes, not missing-test or duplicated-helper notes.                                                                                                                                                                                                                                                |
| R150, R222                               | functions/CLAUDE.md:32 "all queries go through db-refs"      | Both notes are _on_ db-refs files asking for one query per helper. No such rule exists anywhere in okven (grepped CLAUDE.md, functions/CLAUDE.md, .claude/mise-checklist.md).                                                                                                                                        |
| R140, R392                               | checklist:24 comment rule                                    | Package-boundary copy and comment density; the rule is explains-why / misdescribes.                                                                                                                                                                                                                                  |
| R136                                     | CLAUDE.md:101 vocabulary                                     | A numbering gap in fixture ids, not a second term for a concept.                                                                                                                                                                                                                                                     |
| R176                                     | CLAUDE.md:146 nearest sibling                                | Asks about the directory a test file was placed in.                                                                                                                                                                                                                                                                  |
| R535                                     | functions/CLAUDE.md:78 helper first                          | "This file has grown impossible to read. Refactor it" — a file-size note.                                                                                                                                                                                                                                            |

Date claims corrected (rule stands, `[since]` was wrong):

| Rule                                        | Recorded                  | Verified                                                                                                         | Direction                                       |
| ------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| okven/hosting/CLAUDE.md:21                  | 2026-07-13                | 2026-08-19 (`b88877a7d`)                                                                                         | rule is **younger** than claimed                |
| doc-style/SKILL.md:32                       | 2026-09-07                | 2026-09-10 (`ea9b089c5`)                                                                                         | rule is **younger** than claimed                |
| CLAUDE.md:139 "No drilling inside expect()" | (family dated 2026-04-24) | the bullet itself only 2026-09-05 (`89039f3e2`); checklist "Nothing drills inside" only 2026-09-10 (`1b6c72155`) | escape stands on the older CLAUDE.md:138 clause |
| CLAUDE.md:90 JSDoc                          | 2026-08-19                | 2026-07-21 (`38094b88c`)                                                                                         | older                                           |
| CLAUDE.md:144                               | 2026-03-04                | 2026-02-10 (`f0ed29277`)                                                                                         | older                                           |
| CLAUDE.md:149 **mocks**                     | 2026-02-10                | 2025-10-14 (`ee7680d17`)                                                                                         | older                                           |
| hosting/CLAUDE.md:47 Spanish                | 2026-07-15                | 2025-08-28 (`76ad6e708`)                                                                                         | older                                           |

`runs/delta-notes.jsonl` was rewritten in place with the corrected `ruleAlreadyExisted`
strings plus two new fields, `ruleVerified` and `ruleVerifyNote`, carrying the verdict and
its evidence for every row.

**The finding that matters here is not the 41 corrections. It is that on three separate
occasions (CLAUDE.md:87, functions/CLAUDE.md:21, CLAUDE.md:84) a rule was committed within
hours of the burst of notes it answers — 22 of the 41 downgrades.** A rules-vs-escapes
count that does not date the rule reads the retrospective's own output back as evidence
that rules do not work.

---

## 1. Headline: what the two recurring defects actually are

### 1.1 "Tests not using inline snapshots"

The literal reading is false and the falseness is a survivorship artefact. Across okven's
8,822 commits on all refs there is **not one `toMatchSnapshot(`, not one `.snap` file, and
not one `__snapshots__/` path** — and round 1 counted 5,357 `toMatchInlineSnapshot`. But
R216, 2026-09-17, is a Delta Review note anchored at line 1 of
`hosting/composables/__snapshots__/useCampaignSpendForm.test.ts.snap`, reading _"We only use
inline snapshots in this project"_. The file existed in the working tree, the owner caught
it, and it never reached a commit or even a Delta Review state snapshot (the first snapshot
of that test file, `refs/review/eric/attribution-3` at 2026-09-17T05:10:02Z, post-dates the
note). Git cannot see this defect class **because the owner catches it**.

What the complaint covers in the owner's own words is a family of 20 notes: an assertion
that is not one whole-value inline snapshot. `toMatchInlineSnapshot` is usually present —
applied to the wrong expression.

| #   | Sub-pattern                                       | n   | Offending code shape                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Rule covered it?                                                                                                                                                                 | Lintable?                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1a | Drilled field / index inside `expect()`           | 10  | `expect(result.type).toMatchInlineSnapshot(...)` then `expect(result.orderLocation.name)…`, `expect(result.menu.name)…` — with the agent's own justifying comment above it: _"The full context embeds the whole menu and availability map — too wide to read — so the load-bearing fields are asserted directly."_ (`loadOrderReplyContext.test.ts:43-57` @ `fb7e42fcc`). Also `expect(updatedBusiness.afterDoc.data().pendingAgreement).not.toBe('old-agreement-id')` (`handleSetBusinessAgreement.test.ts:318` @ `fcdf1e8f2`). | Yes, 8/10 — CLAUDE.md:138 _"not a hand-built object that cherry-picks fields"_ since 2026-04-24; the explicit CLAUDE.md:139 bullet only since 2026-09-05                         | **Yes.** `no-restricted-syntax` on `**/*.test.ts`: `CallExpression[callee.name='expect'] > MemberExpression[property.name!='value']`, `…> MemberExpression[computed=true]`, `…> MemberExpression[property.name='length']`, `…> CallExpression[callee.property.name=/^(at\|map\|filter\|slice\|find)$/]`. okven already carries 2 `no-restricted-syntax` blocks in `eslint.config.mjs` (lines 111, 135) plus a `no-restricted-imports` boundary block (line 161), so no new dependency. |
| T1b | Value re-assembled in the test, then snapshotted  | 5   | `const names = [toMetricName(A), toMetricName(B)]; expect(names).toMatchInlineSnapshot(...)` (`toMetricName.test.ts:13-24` @ `da959b265`). And `const { output, system, ...request } = mockGenerate.mock.calls[0][0]; expect(request).toMatchInlineSnapshot(...)` (`classifyContent.test.ts:44-48` @ `ec65ed587`) — indexes one call, strips two fields, snapshots the remainder.                                                                                                                                                | Yes, 5/5 — CLAUDE.md:138 and checklist:12 _"No assertion snapshots a collection assembled from several calls' results"_ / _"`mock.calls` is snapshotted whole, never one index"_ | **Partly.** `CallExpression[callee.name='expect'] > ArrayExpression`, `… > ObjectExpression` catch the literal form; `MemberExpression[computed=true][object.property.name='calls']` catches `mock.calls[0]`. The destructure-then-expect form needs the `calls[0]` selector to fire upstream.                                                                                                                                                                                         |
| T1c | Wrong matcher family where a snapshot is required | 4   | `expect(checkPeriodKey(...)).toMatchInlineSnapshot(\`undefined\`)`on a`void` function (`checkPeriodKey.test.ts:8-10`@`d9065e942`); `expect(() => formatClarificationMessage(...)).toThrow('Unexpected clarification issue type: unknown-type')` (`formatClarificationMessage.test.ts:665-667`@`7119f5770`); `const r = await f(); expect(r)…`instead of`await expect(f()).resolves…`                                                                                                                                             | 2/4 — CLAUDE.md:138 names `toThrowErrorMatchingInlineSnapshot` (since 2026-07-12); nothing covers the `undefined`-snapshot or the `.resolves` form                               | **Partly.** `CallExpression[callee.property.name=/^toThrowError?$/]` and `CallExpression[callee.property.name='toMatchInlineSnapshot'] > TemplateLiteral[quasis.0.value.raw='undefined']` are exact. The await-then-assert form is value-equivalent and prose only.                                                                                                                                                                                                                    |
| T1d | File-based `.snap` instead of inline              | 1   | `hosting/composables/__snapshots__/useCampaignSpendForm.test.ts.snap` — produced by a `toMatchSnapshot()` call, never committed                                                                                                                                                                                                                                                                                                                                                                                                  | Yes — CLAUDE.md:138 since 2025-10-14                                                                                                                                             | **Yes, trivially.** `CallExpression[callee.property.name=/^toMatch(File)?Snapshot$/]`, plus an ESLint block scoped to `files: ['**/__snapshots__/**']` that errors on the file existing at all.                                                                                                                                                                                                                                                                                        |

Three verbatim notes per sub-pattern:

| Sub-pattern | Verbatim                                                                                                                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1a         | R76 2026-09-03 `readDerivedEvents.test.ts:44` — "We should check full result. Applies here and in any methods that generates a result. No prop drilling."                                                                                                                                                                    |
| T1a         | R468 2026-08-31 `loadOrderReplyContext.test.ts:45` — "always check the full object. no prop spot checking"                                                                                                                                                                                                                   |
| T1a         | R81 2026-09-05 `createInMemoryStore.test.ts:115` — "This is another instance of drill propping on expect. Generate a list of all of the test files in this change and split among a few agents (use opus) to ensure that there are no remaining instances of this as I feel like I've asked multiple times to address this." |
| T1b         | R73 2026-09-03 `getEventConfigs.test.ts:5` — "this is another case of building objects for expect. Go over all of the tests files and fix this."                                                                                                                                                                             |
| T1b         | R70 2026-09-03 `encodeSummaryKey.test.ts:27` — "do not use these complex objects. Go over all the tests and ensure that this is not happenning. This should be somewhere in the reviewer guides. Maybe the mise review doc?"                                                                                                 |
| T1b         | R506 2026-09-08 `classifyVoiceNote.test.ts:47` — "This type of expect is not allows. Fix it here and accross the branch if it shows elsewhere."                                                                                                                                                                              |
| T1c         | R71 2026-09-03 `checkPeriodKey.test.ts:8` — "Should these cases, and all others that are similar in the repo, use .not.tothrow() instead of checking for undefined?"                                                                                                                                                         |
| T1c         | R529 2026-09-12 `formatClarificationMessage.test.ts:668` — "we should use inline snapshot version of totrowh"                                                                                                                                                                                                                |
| T1c         | R471 2026-08-31 `loadOrderReplyContext.test.ts:231` — "use await expect().resolves.toMatch..."                                                                                                                                                                                                                               |
| T1d         | R216 2026-09-17 `__snapshots__/useCampaignSpendForm.test.ts.snap:1` — "We only use inline snapshots in this project"                                                                                                                                                                                                         |

### 1.2 The rest of the test-style corpus

The inline-snapshot family is 20 of 127 test-style notes. The other 107 are what the owner
also files under "tests":

| #   | Sub-pattern                                                     | n   | in-cat + adj | Offending code shape                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Rule covered it?                                                                                                                                                                                                                                                                                                        | Lintable?                                                                                                                                                                           |
| --- | --------------------------------------------------------------- | --- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T3  | Per-test setup not hoisted into `beforeEach`                    | 14  | 14+0         | `clearMenuCache()` called in the file's `beforeEach` (line 109) **and again inside individual `it()` bodies** (lines 1309, 1462, 1522, …) — `handleFreeformText.test.ts` @ `8ce4af37c`, the snapshot written 2026-08-31T04:50:51Z, inside the note burst (04:49:43–04:51:34Z). That snapshot holds 8 occurrences of `clearMenuCache`; the snapshot 9 min earlier (`0bdb35804`, 04:41:23Z) and the one 28 min later (2026-08-31T00:18:36-05:00 → 05:18:36Z) both hold 2 (import + `beforeEach`). The owner watched the duplication appear and fired six notes in 90 seconds. | **No.** The covering rule (functions/CLAUDE.md:21 "Hoist shared setup into `beforeEach`") was committed 2026-08-31T18:02:22Z, 13h _after_ the notes — and its stated exception ("`getCachedMenu.test` clears the cache inside each test because the cache is what it tests") is the agent's own reply to R459 reworded. | Repo-specific only: a `no-restricted-syntax` selector per known-repeated call inside an `it()` arrow body. Brittle. Effectively **prose only**.                                     |
| T2  | A verification split out as its own `it()`                      | 13  | 13+0         | A second `it()` whose setup duplicates its sibling's and that differs only in the assertion                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Yes, 13/13 — CLAUDE.md:145 since 2026-03-04                                                                                                                                                                                                                                                                             | **Prose only.** `vitest/no-identical-title` catches exact title dupes only, and no vitest ESLint plugin is installed.                                                               |
| T10 | The test proves nothing / asserts the mock                      | 12  | 12+3         | e.g. `updateSpendSums.test.ts:78` — a test named for `updateSpendSums` that never calls it; `useCampaignSpendForm.test.ts:263` where every collaborator is mocked                                                                                                                                                                                                                                                                                                                                                                                                           | **No rule**                                                                                                                                                                                                                                                                                                             | Partly: `vitest/expect-expect` catches an `it()` with no assertion at all. Otherwise prose only.                                                                                    |
| T8  | Fixture carries values that mean nothing                        | 12  | 12+0         | `createInMemoryStore.test.ts` @ `534a37f08` (2026-09-11T05:47Z, before R146) holds **29** `{}` literals inside its inline snapshots — `"amountTotals": {}`, `"dimensionFirstAt": {}`, `"firstAt": {}` repeated down every expected document. Also the same value repeated twice in a two-value fixture (`getScanWindow.test.ts:95,116`).                                                                                                                                                                                                                                    | **No rule**                                                                                                                                                                                                                                                                                                             | **Prose only** — the values live inside snapshot text, not in selectable AST.                                                                                                       |
| T9  | Fixture contradicts the real flow                               | 11  | 11+0         | e.g. a DB diff showing `taxes` _added_ where a real edit would show it _updated_ (`handleOrderInitiation.test.ts:1264`)                                                                                                                                                                                                                                                                                                                                                                                                                                                     | **No rule** until checklist:18's "a DB diff showing a field added where the title says updated" (2026-08-31)                                                                                                                                                                                                            | **Prose only.**                                                                                                                                                                     |
| T4  | `it()` title or `// Verify:` comment does not match the fixture | 9   | 9+1          | `it('returns item-unavailable when multiple items missing from menu')` with one item removed (`handleInitiateOrderPayment.test.ts:1182`); a title saying "no items" over a fixture with one (`loadOrderReplyContext.test.ts:1457`)                                                                                                                                                                                                                                                                                                                                          | Yes, 7/10 — CLAUDE.md:144 since 2026-02-10                                                                                                                                                                                                                                                                              | **Prose only.**                                                                                                                                                                     |
| T7  | Mock placement / internal code mocked                           | 8   | 8+0          | `vi.mock('vue-bare-composables', async (importOriginal) => …)` inline in the test file rather than in `__mocks__` (`useHomePage.test.ts:33-36`)                                                                                                                                                                                                                                                                                                                                                                                                                             | Yes, 8/8 — CLAUDE.md:130/134/149 since 2025-10-14                                                                                                                                                                                                                                                                       | **Yes.** `CallExpression[callee.object.name='vi'][callee.property.name='mock'][arguments.length>1]` for factory mocks; `…[arguments.0.value=/^[@~]?[./]/]` for internal-path mocks. |
| T6  | New code with no colocated test                                 | 8   | 8+0          | A new `.ts` beside no `.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Yes, 7/8 — mise-config.md:44 since 2026-08-05                                                                                                                                                                                                                                                                           | **Not ESLint** (one-file-at-a-time). Needs a project script.                                                                                                                        |
| T5  | Tests added where the convention is _no_ test                   | 6   | 6+1          | `hosting/components/atoms/Checkbox.test.ts`, `hosting/composables/*.test.ts`, `db-refs/*.test.ts` that call `await query.get()`                                                                                                                                                                                                                                                                                                                                                                                                                                             | 2/7 — and the covering rule (colocated-test) **causes** it                                                                                                                                                                                                                                                              | **Yes, as a path rule**: an ESLint block scoped to `hosting/components/atoms/**/*.test.ts` etc. that errors unconditionally.                                                        |
| T11 | Eval and case-data quality                                      | 6   | 6+0          | Eval cases that copy the prompt's own examples verbatim (`evals/message-classification/cases.ts`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | **No rule**                                                                                                                                                                                                                                                                                                             | **Prose only.**                                                                                                                                                                     |
| T12 | Residual: helpers, fake timers, fixture language, constants     | 8   | 8+0          | Mock menu text in English where Spanish is required (`__test__/mock-data/menus.ts:499 name: 'Coffee'`); tests reading the wall clock instead of `setFakeTimer()`                                                                                                                                                                                                                                                                                                                                                                                                            | 4/8 — functions/CLAUDE.md:15, hosting/CLAUDE.md:47                                                                                                                                                                                                                                                                      | Fake timers: yes (`Identifier[name='Date']`-scoped bans in test files). Fixture language: prose only.                                                                               |

### 1.3 "Very verbose AI-slop docs and comments"

35 in-category notes, plus 21 in `naming` / `over-engineering` / `convention-violation`
that are about the same thing. Four distinct complaints hide under "AI slop", and only one
of them is about punctuation.

| #   | Sub-pattern                                                          | n   | in-cat + adj | Offending prose shape                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Rule covered it?                                                                                                                 | Lintable?                                                                                                                                                                                                                                           |
| --- | -------------------------------------------------------------------- | --- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D2  | **Coined jargon the reader cannot decode** — the largest             | 12  | 12+8         | `/** … The window is half-open like every other range in the package … */` (`listPeriodKeys.ts:6-11`); `it('writes the settle line for a customer with test access at a live location')`; `it('stops the tap with the handled Stripe error')`; "round-trips", "by its position", "keep such a map out", "gloss", "ledger", "level", "owners", "hooks"                                                                                                                                                                 | 6/20 — CLAUDE.md:101 _Reuse existing vocabulary_ (2026-08-19) and checklist:20 _One name per concept_ (2026-09-12)               | **Prose only.** A banned-word list is possible only after the word is known; it is reactive.                                                                                                                                                        |
| D3  | Comment misdescribes the code or went stale                          | 5   | 5+2          | `it('skips dropped items message when no unresolved issues')` over a fixture with no dropped items; a JSDoc still naming a "90-second cap" the code no longer enforces (`formatDurationSeconds.ts:1-4`); a live reference to ISO weeks after the concept was removed                                                                                                                                                                                                                                                  | Yes, 6/7 — checklist:24 _"None misdescribes the new behavior, including a neighboring comment the diff made stale"_ (2026-08-19) | **Prose only.**                                                                                                                                                                                                                                     |
| D4  | Verbose, or restates a nearby source                                 | 5   | 5+2          | A `types.ts` field doc the owner called _"very verbose"_ that the fix reduced to `/** The summary's storage id */`; a 60-word voice-note instruction line duplicating the main prompt (`constants.ts:77`); a classification prompt the owner asked to re-structure rather than patch                                                                                                                                                                                                                                  | 1/7 — doc-style/SKILL.md:32 only since 2026-09-10                                                                                | **Partly**: a ~20-line local ESLint rule over `sourceCode.getAllComments()` can enforce the hard length caps doc-style already states. Restatement is prose only.                                                                                   |
| D5  | The _why_ is missing                                                 | 4   | 4+1          | `unresolvedClarifications: undefined` passed with no comment saying why it is safe to drop (`handleOrderMenuChange.ts:48`); a workaround with no link to the GitHub issue behind it (`nuxt.config.ts:50`)                                                                                                                                                                                                                                                                                                             | Yes, 5/5 — checklist:24 + CLAUDE.md:90                                                                                           | **Partly**: `eslint-plugin-jsdoc`'s `require-jsdoc` enforces presence on exports, never quality.                                                                                                                                                    |
| D1  | **Punctuation register: colon, semicolon, em-dash in prose**         | 4   | 4+0          | _Offending text unrecoverable_ — the only surviving snapshots of `getEventConfigs.ts` and `readDerivedEvents.ts` on `refs/review/eric/attribution-3` post-date the notes by 8–11 min, so they hold the rewritten prose. The register that survived the rewrite still shows the complaint: `/** Drains one record hook and checks what it yielded against the config. A refused record comes back as a rejection, and a hook that throws takes the run down with it. */` (`readDerivedEvents.ts:11-15` @ `1c1f80278`). | **No** — doc-style/SKILL.md:32 was committed `ea9b089c5` 2026-09-10, after all three okven notes (2026-09-03)                    | **Yes, with a local rule.** Not expressible as a `no-restricted-syntax` selector (comments are not selectable AST nodes); needs ~20 lines over `sourceCode.getAllComments()`. okven already ships local flat-config rules, so this is a small step. |
| D7  | Operator-facing copy that broadcasts the wrong thing                 | 2   | 2+0          | `logger.error('… order left for the next run')`, `'skipping'`                                                                                                                                                                                                                                                                                                                                                                                                                                                         | **No rule at note time**; functions/CLAUDE.md now names exactly these strings                                                    | **Yes.** `CallExpression[callee.object.name='logger'][callee.property.name='error'] Literal[value=/skipping\|left for the next run/i]`.                                                                                                             |
| D6  | Doc written as a history log, not the final state                    | 1   | 1+1          | `docs/design/attribution.md` titled as v2; `docs/notes/attribution-v2-rationale.md` kept in the repo                                                                                                                                                                                                                                                                                                                                                                                                                  | **No rule**                                                                                                                      | **Prose only.**                                                                                                                                                                                                                                     |
| D8  | Residual: design-doc facts, package-boundary copy, JSDoc conventions | 2   | 2+5          | "There should be no mentions of Okven in any of the attribution packages copy or comments"                                                                                                                                                                                                                                                                                                                                                                                                                            | 3/7                                                                                                                              | Package-boundary mentions: **yes**, a `no-restricted-syntax` Literal/comment scan scoped to `packages/attribution/**`.                                                                                                                              |

Three verbatim notes for the two named complaints:

| Sub-pattern | Verbatim                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1          | R69 2026-09-03 `buildMultiPeriodNote.ts:18` — "The sentence reads as AI slop. ‹turn› do not use colon. Use a more natural human sentence"                                                                                                                                                                                                                                                                                                   |
| D1          | R75 2026-09-03 `readDerivedEvents.ts:13` — "Go over all sentences with semicolon and rewrite them as a normal human would. ‹turn› do the same with em-dashed ‹turn› I still see more like in readDerivedEvents. Be thorough."                                                                                                                                                                                                               |
| D1          | R72 2026-09-03 `getEventConfigs.ts:8` — "skip the em-dashes. Use better comment"                                                                                                                                                                                                                                                                                                                                                            |
| D2          | R80 2026-09-05 `getPeriodRange.test.ts:225` — "what does this 'round-trips' mean? Is there a more clear way to describe it in all tests and comments that use that phrase?"                                                                                                                                                                                                                                                                 |
| D2          | R144 2026-09-11 `doc-style/SKILL.md:24` — "How can I get you to never again use the word gloss in this context? Where do you get it from? ‹turn› Fix the doc-style skill."                                                                                                                                                                                                                                                                  |
| D2          | R82 2026-09-05 `listPeriodKeys.ts:9` — "what dos half-open mean? Is there a better way to describe it that does not require explaining it?"                                                                                                                                                                                                                                                                                                 |
| D4          | R116 2026-09-11 `types.ts:280` — "What does this mean? ‹turn› that is very verbose. See the doc style skill before rewriting."                                                                                                                                                                                                                                                                                                              |
| D4          | R330 2026-08-25 `constants.ts:26` — "Look at the existing text and the density of content and the amount of examples. We want to keep this as short as possible while still doing what we need it to do. Re-think this thoroughly. ‹turn› Lines 27 and 28 don't feel like they belong. Approach this form an expert in prompts perspective. Structure rather than 'patching' a document should be the goal so the model can better adhere." |
| D4          | R31 2026-09-02 `CLAUDE.md:98` — "Also ensure to keep MD entries concise and matching the density and language of the document they end-up at."                                                                                                                                                                                                                                                                                              |

### 1.4 The candidate lint rules, actually run

`tools/lint-probe/eslint.escapes.mjs`, run read-only from the okven root over its 756 test
files with ESLint 10.7 and okven's own `@typescript-eslint/parser` (nothing installed, nothing
written):

```
npx eslint --no-config-lookup -c tools/lint-probe/eslint.escapes.mjs --no-ignore -f json \
  'functions/src/**/*.test.ts' 'hosting/**/*.test.ts' 'packages/*/src/**/*.test.ts'
```

| Sub-pattern | Selector                                                                                            | Hits at HEAD | Files | Read                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------- | ------------ | ----- | ------------------------------------------------------------------------- |
| T1b         | `MemberExpression[computed=true][object.property.name='calls']`                                     | 974          | 165   | `mock.calls[0]` indexing — CLAUDE.md:139 says snapshot `mock.calls` whole |
| T1a         | `CallExpression[callee.name='expect'] > MemberExpression[computed=true]`                            | 903          | 161   | index inside `expect()`                                                   |
| T1a         | `CallExpression[callee.name='expect'] > MemberExpression[computed=false][property.name!='value']`   | 542          | 125   | field read inside `expect()` (`.value` excluded per CLAUDE.md:139)        |
| T1c         | `…[callee.property.name='toMatchInlineSnapshot'] > TemplateLiteral[quasis.0.value.raw='undefined']` | 119          | 58    | snapshotting `undefined` as a proxy for "does not throw"                  |
| T7          | `vi.mock(<relative \| ~/ \| @/ specifier>)`                                                         | 38           | 22    | internal code mocked                                                      |
| T7          | `vi.mock(…)` with a factory argument                                                                | 32           | 17    | inline module mock that belongs in `__mocks__`                            |
| T1a         | `…> CallExpression[callee.property.name=/^(at\|map\|filter\|slice\|find\|join\|concat)$/]`          | 22           | 15    | array method inside `expect()`                                            |
| T1b         | `CallExpression[callee.name='expect'] > :matches(ObjectExpression, ArrayExpression)`                | 19           | 5     | value assembled inline in `expect()`                                      |
| **T1c**     | `CallExpression[callee.property.name=/^toThrowError?$/]`                                            | **0**        | 0     | already clean at HEAD                                                     |
| **T1d**     | `CallExpression[callee.property.name=/^toMatch(File)?Snapshot$/]`                                   | **0**        | 0     | already clean at HEAD — the owner catches every one                       |

2,649 hits over 300 of 756 test files. Round 1's narrower drilling probe measured
1,081 + 34 + 26 on the same corpus; the broader selectors here reach 1,467 for T1a alone.
These are **hit counts, not defect counts** — `expect(wrapper.vm.x)` and other legitimate
reads are inside the 542, so the rule needs either an allow-list or a codemod before it can
be turned on. The two rules with 0 hits are the interesting ones: the defect class the owner
names ("tests not using inline snapshots") is invisible to a lint run at HEAD for exactly
the reason it is invisible to `git log`.

### 1.5 What the taxonomy says about rules

| Bucket                                             | Sub-patterns                           | Notes  | Covered by a rule that existed |
| -------------------------------------------------- | -------------------------------------- | ------ | ------------------------------ |
| A written rule existed and was broken              | T1a, T1b, T1d, T2, T4, T6, T7, D3, D5  | 62     | 62                             |
| A written rule existed but does not cover the note | T1c (2 of 4), T5, T12 (4 of 8)         | 12     | 0                              |
| **No rule existed at note time**                   | T3, T8, T9, T10, T11, D1, D6, D7       | **62** | 0                              |
| Rule arrived _after_ the notes that prompted it    | T3, D1, D7, CLAUDE.md:87, CLAUDE.md:84 | 22     | —                              |

Coverage is complete and disjoint: 162 in-category notes, 0 unassigned, 0 double-assigned
(`tools/taxonomy.py` self-checks this).

---

## 2. Agent responses to notes

534 of 537 notes carry a response. 60 responses (every 9th note) were read and classified;
12 of those were re-read blind, 12/12 agreed.

| Outcome                                                                            | n / 60 | %         |
| ---------------------------------------------------------------------------------- | ------ | --------- |
| Fixed as asked                                                                     | 31     | 51.7%     |
| Fixed partly, rest argued away                                                     | 2      | 3.3%      |
| Answered only — the owner asked a question or said "no changes"                    | 15     | 25.0%     |
| **Pushback: agent argued the code was right, changed nothing (or only a comment)** | **9**  | **15.0%** |
| Deferred to a Todoist item                                                         | 1      | 1.7%      |
| Other (opened a browser for a visual check)                                        | 2      | 3.3%      |
| **No code change of any kind**                                                     | **25** | **41.7%** |

Corpus-wide lower bounds (regex over all 534 responses, so undercounts):

| Metric                                                                | n         | %         |
| --------------------------------------------------------------------- | --------- | --------- |
| Response contains an explicit no-change phrase in its first 600 chars | 56        | 10.5%     |
| …of those, where the **owner** did not ask for discussion/no-change   | 49        | 9.2%      |
| Notes where the owner explicitly asked for discussion only            | 24        | 4.5%      |
| Responses citing at least one resolvable commit sha                   | 277       | 51.9%     |
| Median response length                                                | 699 chars | p90 2,115 |

Pushback examples (verbatim opening): R306 _"I cannot reproduce an error on that line, so I
want to check what you are seeing before changing anything."_; R441 _"This one stays
optional, with the reason now in its gloss."_; R536 _"I would keep it at warn, and the
reason is that the system already fixes it without a human."_

Re-asking pressure:

| Metric                                                               | n         | % of 537 |
| -------------------------------------------------------------------- | --------- | -------- |
| Notes demanding a branch- or repo-wide sweep rather than a point fix | 28        | 5.2%     |
| …of which test-style / convention-violation / comment-doc-slop       | 9 / 8 / 3 | —        |
| Notes saying the thing was already asked, or is still happening      | 6         | 1.1%     |

---

## 3. Notes per run

| Run                                               | Notes | test-style | comment-doc-slop | verified escapes | note span (days) |
| ------------------------------------------------- | ----- | ---------- | ---------------- | ---------------- | ---------------- |
| okven @ eric/attribution-3                        | 238   | 50         | 16               | 61               | 28.0             |
| okven @ feat/specials-fixes                       | 157   | 45         | 7                | 35               | 6.0              |
| okven @ fix/menu-pin                              | 37    | 7          | 3                | 12               | 0.2              |
| okven @ feat/close-out-orders                     | 32    | 9          | 3                | 13               | 0.9              |
| okven @ feat/voice-notes                          | 25    | 4          | 4                | 6                | 0.4              |
| okven @ eric/attribution-2                        | 14    | 5          | 0                | 3                | 0.0              |
| okven @ feat/migrate-firebase-kit                 | 7     | 3          | 0                | 1                | 0.0              |
| firebase-kit @ feat/keepalive-caller              | 6     | 2          | 1                | 2                | 0.1              |
| okven @ fix/voice-note-not-transcribed            | 5     | 1          | 0                | 1                | 0.0              |
| okven @ eric/fab-snippet                          | 3     | 0          | 0                | 1                | 0.0              |
| okven @ feat/backfill-order-history               | 3     | 1          | 0                | 2                | 0.0              |
| okven @ eric/lo-de-siempre                        | 3     | 0          | 1                | 0                | 0.0              |
| ericvera.dev @ feat/blog                          | 2     | 0          | 0                | 0                | 0.0              |
| okven @ feat/first-time-offer                     | 2     | 0          | 0                | 0                | 0.0              |
| okven @ fix/menu-preview-changes                  | 2     | 0          | 0                | 0                | 0.9              |
| mise-claude-plugin @ feat/next-major-improvements | 1     | 0          | 0                | 0                | 0.0              |

---

## 4. Note → fix latency

Two independent measures.

**(a) From the fix commit the agent named in its own response** (`tools/note_fix_commits.py`).
277 of 534 responses cite a 9-hex sha; 270 resolve to a commit dated after the note and
within 30 days.

| Metric | Value                 |
| ------ | --------------------- |
| n      | 270                   |
| Median | **31.9 min**          |
| p90    | **144.5 min (2.4 h)** |
| Max    | 48.8 h                |

| Category               | n   | median (min) | p90 (min) |
| ---------------------- | --- | ------------ | --------- |
| test-style             | 79  | 21.3         | 114.9     |
| convention-violation   | 45  | 29.6         | 472.1     |
| wrong-behaviour        | 29  | 34.7         | 113.6     |
| dead-or-duplicate-code | 26  | 32.5         | 130.4     |
| ui-visual              | 24  | 45.5         | 131.1     |
| naming                 | 22  | 61.2         | 106.9     |
| question               | 19  | 25.5         | 1748.9    |
| comment-doc-slop       | 13  | 20.6         | 146.6     |
| over-engineering       | 10  | 39.6         | 1719.7    |
| missed-requirement     | 2   | 428.8        | 761.2     |

**(b) From Delta Review state snapshots** — the first `refs/review/<branch>` autosave after
the note in which the noted file's blob changed (`tools/note_fix_latency.py`): n=440,
median 2.6 min, p90 333.5 min. This measure is contaminated: the owner writes notes while
the agent is editing the same files, so "file changed" is not "note fixed". **Measure (a)
is the one to quote.**

Fixes are batched. The 270 fix commits collapse onto far fewer subjects — one commit,
_"refactor: one terminal handler for the active-order menu prompt…"_, carries 19 notes;
_"Fix: every changed test asserts one scenario whole, and the …"_ carries 5.

### What handled the fix, between note and commit

For each of the 270, the skill / slash-command events recorded in the session digests
between (note − 30 min) and the fix commit:

| Flow                                                             | n       | %         |
| ---------------------------------------------------------------- | ------- | --------- |
| **No skill and no slash command in the window — an ad hoc turn** | **149** | **55.2%** |
| `delta:review-notes` skill or `/delta:review-notes`              | 78      | 28.9%     |
| Some other skill or slash command                                | 31      | 11.5%     |
| `/mise:next` (fix landed inside a mise run)                      | 12      | 4.4%      |

Across all 99 digested sessions: `/mise:next` 51, `/delta:review-notes` 43,
`/delta:cluster` 22, `/model` 35. There is **no mise bugfix route in evidence for review-note
fixes** — 12 of 270 is the whole of it. More than half the review-note fixes are the owner
typing into a chat turn.

---

## 5. The other escape record: `.mise/_friction.md`

Delta Review notes are the _post-merge-gate_ record. mise keeps its own: `.mise/_friction.md`
survives on 26 `refs/review/<branch>` trees in okven, 470 lines. It separates what mise's own
reviewer caught from what the owner had to flag at the end-of-plan acceptance gate.

| Line kind                              | n      | Who caught it                                    |
| -------------------------------------- | ------ | ------------------------------------------------ |
| `task NN_NN: review found …`           | 104    | mise's per-task reviewer                         |
| `critic …: stalled / blocker recurred` | 91     | mise's critic (gate churn, not a defect)         |
| `acceptance: user flagged …`           | **57** | **the owner, at the end-of-plan gate**           |
| `correction: …`                        | **23** | **the owner, correcting mise's process mid-run** |
| `gate: …` (test/lint/e2e)              | 10     | the tool chain                                   |
| other prose                            | 185    | —                                                |

Owner-caught totals, by escape surface: **57** at the acceptance gate + **537** in Delta
Review afterwards = 594, against **104** the per-task reviewer caught. Units differ (a task
finding can bundle several defects; a Delta note is one), so read this as an order of
magnitude, not a ratio.

Acceptance flags per run: attribution-3 14, lo-de-siempre 10, specials-fixes 6, voice-notes 6,
close-out-orders 5, menu-preview-changes 3, voice-note-not-transcribed 3, migrate-firebase-kit
2, missing-image 2, six runs with 1 each.

### The two recurring defects, in mise's own friction words

| Run                            | Verbatim friction line                                                                                                                                                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| eric/attribution-3             | "acceptance: user flagged **AI-slop punctuation** — colons, semicolons, em-dashes and vertical slashes are banned in comment and doc prose and in copy, exempting code and CSS inside comments; the voice guide lacked the colon and slash rules and doc-style lacked the slash and the code exemption" |
| eric/attribution-3             | "acceptance: user flagged **prose rule 15** — stale Verify lines, undocumented enum members, uncommented store clears, over-long JSDoc, test titles outrunning assertions"                                                                                                                              |
| eric/attribution-3             | "acceptance: user flagged **empty `{}` props in the day document snapshots** — omit them or say why they stay"                                                                                                                                                                                          |
| eric/attribution-3             | "acceptance: user flagged Okven mentions — the attribution package's copy and comments never name Okven"                                                                                                                                                                                                |
| feat/specials-fixes            | "acceptance: user flagged **prose rule 10** — a Verify comment claims 'both twins listed with prices' over a snapshot with no prices"                                                                                                                                                                   |
| feat/specials-fixes            | "acceptance: user flagged **prose rule 10** — eight stale comments/doc lines misdescribe the code"                                                                                                                                                                                                      |
| feat/voice-notes               | "acceptance: user flagged **prose fixes (item 7)** — nine comments in the docs pass misdescribe the code or their snapshot"                                                                                                                                                                             |
| feat/voice-notes               | "correction: comments must follow doc-style and describe what exists, never the progression (moved, renamed, extracted, now)"                                                                                                                                                                           |
| fix/voice-note-not-transcribed | "acceptance: user flagged two stale prose spots — design doc shape line and the constants.ts prefix comment"                                                                                                                                                                                            |
| eric/lo-de-siempre             | "acceptance: user flagged stale/misdescribing comments — versioned-link Verify, orphaned CustomerSensitiveData JSDoc, removed age-limit rationale, mangled Verify wraps"                                                                                                                                |
| feat/migrate-firebase-kit      | "acceptance: user flagged **extraneous relational assertions** in handleSetBusinessAgreement.test.ts — the diff already covers absent→present; trimmed to the overwrite test" (this is sub-pattern T1a)                                                                                                 |
| feat/close-out-orders          | "correction: **user removed the restored Checkbox.test.ts** — no other atom in hosting/components/atoms/ has a colocated test, so the gate repair applied the new-file rule where the surrounding convention is none" (this is sub-pattern T5, the rule causing the defect, recorded by mise itself)    |

### The 23 mid-run process corrections, grouped by implicated mechanism

All verbatim from `.mise/_friction.md` on the branch named.

| Mechanism                                                          | n   | Verbatim                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Critic gate — stalls the owner had to break by hand**            | 2   | attribution-3: "correction: user approved requirements after the stall without a further critic round (1a)" · "correction: user approved the plan after the stall without a further critic round (1a)"                                                                                                                                                                                                                                                                                                                                                                   |
| **End-of-plan gate ordering vs the human review**                  | 2   | attribution-3: "correction: hold sanity-e2e and acceptance until the user finishes the Delta Review pass" · "correction: the end-of-plan gate waits until the user finishes the Delta Review pass **(restated at the acceptance dispatch)**" — the same correction had to be given twice in one run                                                                                                                                                                                                                                                                      |
| **Post-gate fix path**                                             | 1   | attribution-3: "correction: changes after the gate go through the mise fix path (implementer, documenter, reviewer), never inline; three inline changes get retroactive documenter and reviewer passes"                                                                                                                                                                                                                                                                                                                                                                  |
| **Reviewer dispatch granularity (cost)**                           | 1   | attribution-3: "correction: review notes are reviewed one batch per pass from here on, **one reviewer over the batch's commits instead of one per note**"                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Where a subagent runs**                                          | 1   | migrate-firebase-kit: "correction: gate validation runs (e2e, smoke) should run in an opus subagent, not the orchestrator context"                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Delta Review clusters contract**                                 | 1   | attribution-3: "correction: files renamed by the vocabulary pass are declared as moved in the Delta Review clusters so the review shows text changes, not new files"                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Interaction rules — what mise may do without asking**            | 3   | tips: "correction: goals — applied picker copy after a wording preference … instead of re-presenting options; **feedback is never acceptance**" · tips: "correction: requirements — planned a Todoist item for stale doc pointers; user: **never open Todoist items without approval**, and stale docs are updated as part of the change" · menu-preview-changes: "correction: rendered and screenshotted mocks.html myself (local http server plus Playwright) three times during the goals stage — **the user opens the mocks, the workflow should not**"              |
| **A rule applied where the surrounding convention says otherwise** | 1   | close-out-orders: "correction: user removed the restored Checkbox.test.ts — no other atom in hosting/components/atoms/ has a colocated test, so the gate repair applied the new-file rule where the surrounding convention is none"                                                                                                                                                                                                                                                                                                                                      |
| Code-quality findings recorded as corrections                      | 11  | specials-fixes ×7 (improvised prompt wording, rule placement chosen to avoid renumbering, "entry" as a second name for "item", a parameter and a return field both named `issues` holding different types, a `joinNames` helper duplicating `joinWithConjunction` **after reporting that no shared util existed**, a wholesale clear that would have wiped the customer's items, "tests regenerated with `--update` rather than re-derived, leaving a test asserting the opposite of its own name"), attribution-3 ×1, backfill ×1, voice-notes ×1, menu-availability ×1 |

Two of these are the recurring defects restated as process: _"tests regenerated with `--update`
rather than re-derived, leaving a test asserting the opposite of its own name"_
(feat/specials-fixes) is exactly sub-pattern T4, and it happened **with the rule already in
place** — CLAUDE.md:147 _"Never bulk-regenerate snapshots: update one file at a time and read
every regenerated snapshot"_ was committed `8df40c62c` 2026-08-19, and feat/specials-fixes ran
2026-08-25 to 08-31. _"comments must follow doc-style and
describe what exists, never the progression (moved, renamed, extracted, now)"_
(feat/voice-notes) is sub-pattern D3.

"prose rule 10" and "prose rule 15" are okven's **doc-style skill** rules — `SKILL.md:52`
_"Every fact at its level"_ and `SKILL.md:70` _"Test `// Verify:` comments: terse list of the
load-bearing…"_. Both existed, both were answered `pass` by the checklist-answering roles, and
the owner still flagged them at acceptance on three separate runs. Writing the rule down and
making a role answer for it did not stop the defect.

---

## 6. Owner messages in mise runs

`runs/owner-messages.jsonl` — 1,092 real human turns across **43 of 43 mise-invoked sessions**,
8 project dirs (okven 826, originhypnosis 77, metaforico 66, aydy 39, ericvera-dev 30,
firebase-kit 27, mise-claude-plugin 14, delta-review 13), verbatim text kept per row.

| class                                             | n      | %        | high conf | low conf |
| ------------------------------------------------- | ------ | -------- | --------- | -------- |
| approval — a go-ahead carrying no new information | 270    | 24.7%    | 200       | 70       |
| redirect — new instruction or scope change        | 251    | 23.0%    | 84        | 167      |
| answer — supplies something mise asked for        | 222    | 20.3%    | 152       | 70       |
| correction — the output is wrong and must change  | 190    | 17.4%    | 106       | 84       |
| unrelated                                         | 105    | 9.6%     | 47        | 58       |
| **process-complaint — friction with mise itself** | **54** | **4.9%** | 24        | 30       |

| class             | goals   | mock  | requirements | plan    | execute | close-out | no stage | total    |
| ----------------- | ------- | ----- | ------------ | ------- | ------- | --------- | -------- | -------- |
| approval          | 74      | 5     | 55           | 57      | 39      | 5         | 35       | 270      |
| redirect          | 73      | 0     | 42           | 35      | 27      | 5         | 69       | 251      |
| answer            | 91      | 3     | 35           | 18      | 11      | 22        | 42       | 222      |
| correction        | 66      | 0     | 35           | 28      | 35      | 2         | 24       | 190      |
| process-complaint | 10      | 0     | 17           | 5       | 9       | 3         | 10       | 54       |
| unrelated         | 36      | 1     | 17           | 21      | 20      | 1         | 9        | 105      |
| **total**         | **350** | **9** | **201**      | **164** | **141** | **38**    | **189**  | **1092** |

**350 of 1,092 owner turns (32%) are spent in the goals stage, before any code exists.**
Execute takes 141 (13%).

Two independent blind re-checks disagree about how clean these labels are:

| Re-check                                   | n   | Agreement | Where it broke                                                                                                                                                                                                  |
| ------------------------------------------ | --- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The classifying agent's own, every 5th row | 219 | 97.7%     | all 5 disagreements were rows it had already marked `classConfidence: low`; 4 were corrected                                                                                                                    |
| Mine, independent, every 28th row          | 39  | **79%**   | 4 on `approval` vs `redirect` ("note pass", "do another pass", "another pass" read as instructions, not approvals), 2 on `redirect` vs `answer`, 1 each on `redirect`/`correction` and `unrelated`/`correction` |

Read `approval` and `redirect` as one bucket of 521 "go-ahead or next instruction" turns; the
split between them is not stable. `correction` and `process-complaint` held in both re-checks.
48% of all rows carry `classConfidence: low`. The taxonomy has no `question` class and roughly
100 rows are owner questions; they were routed to `unrelated` (no change demanded), `redirect`
(asks for new output) or `correction` (implies a defect), with the rule recorded per row.

---

## 7. Corrections by type, stage and role

190 corrections. Type was hand-assigned from each row's verbatim clause
(`tools/correction_types.py`); a keyword pass over the same clauses misfired on 9 of a 30-row
sample and was discarded.

| Type                                           | n      | okven | other repos | dominant stage                        |
| ---------------------------------------------- | ------ | ----- | ----------- | ------------------------------------- |
| **visual / mock / layout iteration**           | **67** | 23    | 44          | goals 44, plan 19                     |
| product behaviour or design wrong              | 53     | 47    | 6           | execute 23, requirements 14, goals 10 |
| user-facing copy / wording                     | 20     | 20    | 0           | requirements 7, no-stage 8            |
| mise artifact or process output wrong          | 14     | 9     | 5           | no-stage 7, goals 4                   |
| naming / vocabulary                            | 11     | 11    | 0           | requirements 5                        |
| test or eval defect                            | 8      | 8     | 0           | execute 6                             |
| sweep incomplete / rule not applied everywhere | 7      | 5     | 2           | requirements 3                        |
| comment / doc slop                             | 6      | 4     | 2           | goals 3, close-out 2                  |
| environment / tooling                          | 3      | 0     | 3           | plan 2                                |
| convention / code structure                    | 1      | 1     | 0           | requirements 1                        |

**The single largest correction type is not a code defect.** 67 of 190 (35%) are the owner
iterating on a mock or a rendered layout — 44 of them in the `goals` stage, mostly in the two
design-heavy repos (metaforico, originhypnosis) but also 19 in okven's `plan` stage
(fix/menu-preview-changes: "the new layout is worse", "layout still wrong after several
attempts", "X height differs between dialogs with and without a title").

Only 8 corrections are test defects and 6 are comment/doc slop — because those two defect
classes are caught in Delta Review _after_ the run, not in the chat during it. Section 1 is
where they live.

Producing role. `miseRoleNearby` (literal last subagent of any kind) is null on 68% of rows,
so the usable column is `lastMiseRole`, the last **mise-role** subagent before the turn:

| Role            | corrections | process-complaints | all owner turns |
| --------------- | ----------- | ------------------ | --------------- |
| implementer     | **60**      | 16                 | 271             |
| acceptance      | **36**      | 5                  | 216             |
| critic          | 8           | 10                 | 69              |
| documenter      | 7           | 5                  | 62              |
| retrospective   | 3           | 1                  | 43              |
| reviewer        | 1           | 1                  | 12              |
| none resolvable | 75          | 16                 | 419             |

This is proximity, not authorship: it says which role last ran, not which role wrote the code
being corrected. `reviewer` at 1 is an artefact of reviewers being dispatched inside other
roles' turns, not evidence that the reviewer causes no corrections.

---

## 8. Process complaints, verbatim — the owner's friction log

All 54, grouped by the mechanism they implicate. Every one is the owner's own text.

**Output too long or unreadable — the owner cannot follow mise** — 19

| ts               | run                          | verbatim                                                                                                                                                                                                                                                                                                             |
| ---------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-21T21:09 | `fix/menu-preview-changes`   | "Explain the problem with one liners to see if I can help faster. Keep it simple and if useful with a concrete example and/or table."                                                                                                                                                                                |
| 2026-08-22T21:38 | `feat/specials-fixes`        | "too long. Give me an actionable summary of what is happening."                                                                                                                                                                                                                                                      |
| 2026-08-22T21:40 | `feat/specials-fixes`        | "too long. Give me an actionable summary of what is happening."                                                                                                                                                                                                                                                      |
| 2026-08-22T21:41 | `feat/specials-fixes`        | "Let's go one by one. Explain in 1-2 sentences the problem and then one liners of what you tried so far."                                                                                                                                                                                                            |
| 2026-08-22T22:05 | `feat/specials-fixes`        | "Always add row numbers on tables or lists so that it is easier to reference them. I was thinking that the flag would come from the intent. Then we would use it for processing the response from the ordering model call. If question, never add. Show options (or options). If not question, do what we do today." |
| 2026-08-22T22:08 | `feat/specials-fixes`        | "never use REQ- or CAT- references when talking to me. I don't know when by memory. Use examples and direct to the point details."                                                                                                                                                                                   |
| 2026-08-26T00:27 | `feat/specials-fixes`        | "you are being too verbose. Summarize your messages from now on. So birria should match birria de res and birria de pollo, but birria de res should never return birria de pollo"                                                                                                                                    |
| 2026-08-26T00:33 | `feat/specials-fixes`        | "I am so confused."                                                                                                                                                                                                                                                                                                  |
| 2026-08-26T17:53 | `feat/specials-fixes`        | "explain it simpler"                                                                                                                                                                                                                                                                                                 |
| 2026-08-26T17:56 | `feat/specials-fixes`        | "Still makes no sense. I see in 'Actual', entityName: Mofongo Expecial as entity-unavailable which seems right, then in rawOutput I see `c` as i5 and i4 which seems like what we would use to generate the right message? What am I missing?"                                                                       |
| 2026-08-28T20:15 | `feat/specials-fixes`        | "show me the expected output in what we have vs the shorter mock-up. Just that. No more explanation."                                                                                                                                                                                                                |
| 2026-08-29T02:30 | `feat/specials-fixes`        | "I am confused. Show me the conversation of the first scenario again."                                                                                                                                                                                                                                               |
| 2026-08-29T13:53 | `feat/specials-fixes`        | "Show me again the issues from the gate with one liner description and suggested fix if any."                                                                                                                                                                                                                        |
| 2026-08-30T19:59 | `main/feat/home-page`        | "this is way too verbose. Be more concise in your responses."                                                                                                                                                                                                                                                        |
| 2026-09-05T17:56 | `fix/menu-availability`      | "That was a very confusing response. Did you fix the issue or not?"                                                                                                                                                                                                                                                  |
| 2026-09-07T22:25 | `feat/tips`                  | "this is confusing. Restate the issue(s) and the proposed solution. No need to refer to the requirement IDs."                                                                                                                                                                                                        |
| 2026-09-12T02:10 | `fix/menu-pin`               | "too long. simplify this."                                                                                                                                                                                                                                                                                           |
| 2026-09-14T19:43 | `feat/keepalive-caller/main` | "I am confused. Be concise. 1. Does the callables API support keepalive natively? (yes or no) 2. Is this better implemented as an http method rather than a callable?"                                                                                                                                               |
| 2026-09-18T22:00 | `eric/attribution-3`         | "too long. sumarize the last message."                                                                                                                                                                                                                                                                               |

**mise proceeds without showing the change, or without approval** — 8

| ts               | run                   | verbatim                                                                                                                                                                                                                                              |
| ---------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-21T16:42 | `feat/specials-fixes` | "show me the examples. Do not proceed with the process until I tell you my choices and have said continue"                                                                                                                                            |
| 2026-08-26T01:00 | `feat/specials-fixes` | "I want to see your changes first"                                                                                                                                                                                                                    |
| 2026-08-29T04:38 | `feat/specials-fixes` | "wait. show me the new signature"                                                                                                                                                                                                                     |
| 2026-08-29T04:38 | `feat/specials-fixes` | "show me the signatures before proceeding"                                                                                                                                                                                                            |
| 2026-08-30T03:11 | `main/feat/home-page` | "Before proceeding. Always. Show me a plan with one liners of what you will do next."                                                                                                                                                                 |
| 2026-09-07T21:17 | `feat/tips`           | "stop. Still working on it. When I provide feedback that is never an acceptance. Show me options with that."                                                                                                                                          |
| 2026-09-11T00:59 | `eric/attribution-3`  | "The close out will happen after the review is complete. Only proceed with the closeout once explicitely approved. About @docs/design/attribution.md , I see IDs based on same words. Isn't that against Firestore guidance? To have sequential IDs?" |
| 2026-09-12T00:57 | `fix/menu-pin`        | "Approved. When done run /delta:review-notes and do not proceed with the mise clouse out until I explicitly approve it."                                                                                                                              |

**A gate runs before the owner has finished reviewing** — 3

| ts               | run                   | verbatim                                                                                                              |
| ---------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 2026-08-31T18:16 | `feat/specials-fixes` | "why don't you look into the notes before you run all the tests?"                                                     |
| 2026-09-13T19:26 | `eric/attribution-3`  | "wait for the 2e2 until I am done with reviewing"                                                                     |
| 2026-09-14T19:44 | `eric/attribution-3`  | "Commit the _unused > _ (we should just use _ for unused. The end of plan run should wait until I am done reviewing." |

**Cost: work the owner did not want, or run in the wrong place** — 8

| ts               | run                           | verbatim                                                                                                                                                                                                                                        |
| ---------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-20T18:44 | `feat/migrate-firebase-kit`   | "are all of these running with a subagent? if not, they should run with an opus sub-agent"                                                                                                                                                      |
| 2026-08-20T23:24 | `feat/backfill-order-history` | "restart the full suite, but do it on a subagent running on opus"                                                                                                                                                                               |
| 2026-08-25T22:29 | `feat/specials-fixes`         | "Run only the releavant tests rather than the full suite for testing the changes and then move to the full suite when the tweak seems to work on the tests of interest."                                                                        |
| 2026-08-26T00:59 | `feat/specials-fixes`         | "Tell me what you are going to do. I do not want you to start running tests on promps without checking-in with me first as those cost!"                                                                                                         |
| 2026-08-30T03:14 | `main/feat/home-page`         | "No screenshots. Just update the mock.html and let me know when done. No captures. Proceed"                                                                                                                                                     |
| 2026-08-30T21:44 | `main/feat/home-page`         | "don't generate it. Tell me, for an image I have, that is 512x512, wht should be the size of the seal?"                                                                                                                                         |
| 2026-09-12T04:00 | `main/fix/doc-churn-usage`    | "<command-message>mise:next</command-message> <command-name>/mise:next</command-name> <command-args>a recent change seems to be cause a lot of usage as well as a lot of churn in documentation. Investigate and propose a fix.</command-args>" |
| 2026-09-12T06:53 | `fix/menu-pin`                | "no more cluster refreshes. Continue with the full gate run and if succesful, close out."                                                                                                                                                       |

**The critic loop is not converging** — 3

| ts               | run                   | verbatim                                                                                                                                                                       |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-22T00:50 | `feat/specials-fixes` | "are we better off if we just start from the mocks again?"                                                                                                                     |
| 2026-08-23T20:02 | `feat/specials-fixes` | "we should reset the critic count."                                                                                                                                            |
| 2026-08-29T14:13 | `feat/specials-fixes` | "This branch is not in a good state so stop it with the warnings about going over initial plan. The plan is to have high quality code only make it to production. 1.1 2.1 3.1" |

**A question or its answer got lost in the conversation** — 4

| ts               | run                     | verbatim                                                                                                            |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 2026-08-26T03:56 | `feat/close-out-orders` | "Recommend from what? I am missing some info here"                                                                  |
| 2026-09-07T23:32 | `feat/first-time-offer` | "Earlier, I asked a question about how the discount shows in Stripe checkout, but I missed the answer."             |
| 2026-09-17T12:58 | `eric/attribution-3`    | "Previous messages are buried in conversation. Show me again. Numbered with suggested approaches for any questions" |
| 2026-09-18T03:51 | `eric/attribution-3`    | "what were the other options? I thought I answered."                                                                |

**mise's own rule not followed, or the owner cannot tell it is running** — 4

| ts               | run                  | verbatim                                                                                                                                                                                                                                                                                                                            |
| ---------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-12T02:22 | `fix/menu-pin`       | "Is this about one of the notes? If so, response there."                                                                                                                                                                                                                                                                            |
| 2026-09-12T07:00 | `eric/attribution-3` | "Prepare this in-flight mise run to resume under plugin 2.1.0, which moved checklist answers out of the progress log. Do exactly this, no more: 1. Confirm `~/.claude/plugins/cache/ericvera/mise/2.1.0/` exists; stop and tell me if it doesn't. 2. Run this script from the worktree root. It moves every `- Checklist:` bulle …" |
| 2026-09-14T21:32 | `eric/attribution-3` | "Dis you already load `mise:next` in this session? I want to make sure the fixes use the mise process for the changes (sub-agents, verifications, doc styles, etc.)"                                                                                                                                                                |
| 2026-09-18T05:24 | `eric/attribution-3` | "two more notes. Whenever you finish notes, you are supposed to check if there are new ones until you do a pass and there are none."                                                                                                                                                                                                |

**Pacing and progress signal** — 2

| ts               | run                     | verbatim                                        |
| ---------------- | ----------------------- | ----------------------------------------------- |
| 2026-08-02T19:54 | `-Users-eric-Code-aydy` | "you must never stop until all phases are done" |
| 2026-08-19T22:38 | `eric/attribution-3`    | "do you really need to wait that long?"         |

**Artifact bloat and unasked-for autonomy** — 3

| ts               | run                        | verbatim                                                                                                                              |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-21T17:49 | `fix/menu-preview-changes` | "Approve. Also add a retrospective note to stop opening the mocks on your own."                                                       |
| 2026-08-23T21:28 | `fix/menu-preview-changes` | "Are you able to analyze the screenshots and see that they are not aligned. That the X is too far down?"                              |
| 2026-09-07T23:17 | `feat/first-time-offer`    | "Update the mock document to just show the final mocks rather than all the ones considered (open a todoist to encode this into mise)" |

Two were sent twice, minutes apart, because the first had no effect:
_"too long. Give me an actionable summary of what is happening."_ at 2026-08-22T21:38 and again
at 21:40; _"wait. show me the new signature"_ at 2026-08-29T04:38:28 and _"show me the
signatures before proceeding"_ 12 seconds later.

The heaviest run is `feat/specials-fixes` (22 of 54), then `eric/attribution-3` (10),
`fix/menu-pin` 4, originhypnosis `feat/home-page` 4, `fix/menu-preview-changes` 3. By stage:
requirements 17, goals 10, execute 9, plan 5, close-out 3, no stage 10.

These 54 are the transcript half of the friction record. The 23 `correction:` lines in
`.mise/_friction.md` (section 5) are mise's own half, written by the run itself. They overlap
on exactly two mechanisms — gate ordering vs the owner's review, and what mise may do without
asking — and the transcript half is 2.3× larger.

---

## 9. Questions mise asked the owner

Using the 222 `answer` turns as the count of questions that reached the owner and got a reply:

| Could the answer have been read instead of asked?                         | n       | %     |
| ------------------------------------------------------------------------- | ------- | ----- |
| **No — a product, design or business decision only the owner holds**      | **212** | 95.5% |
| Yes — the fact was already in the repo, a config file, or an earlier turn | 4       | 1.8%  |
| Could not determine                                                       | 6       | 2.7%  |

The four that were already available:

| ts               | Owner's answer (verbatim, truncated)                                                                | Where it was already written                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 2026-08-26T03:52 | "AwaitingConfirmation should be logger.error as it is not expected to happen…"                      | `okven/functions/CLAUDE.md:80`                                                          |
| 2026-08-29T19:07 | "proceed with the fix as suggested. use añadir. never agregar. check afains spanish and wa guides." | `okven/docs/design/spanish-voice.md:35`, marked required by `.claude/mise-config.md:56` |
| 2026-09-18T23:55 | "done not. Not commited yet. You commit it."                                                        | `git status`                                                                            |
| 2026-08-30T03:01 | "people will come for hypnosis. We should refocus to that from the brief."                          | the client brief mise had been pointed at in the kickoff                                |

So **mise does not waste the owner's time asking things it could have looked up** — that is not
the friction. The friction is the shape of the asking:

| Metric                                                                  | Value            |
| ----------------------------------------------------------------------- | ---------------- |
| `answer` turns whose whole text is ≤10 characters                       | 76 of 222 (34%)  |
| `answer` turns whose whole text is ≤3 characters (`1a`, `2b`, `1`, `b`) | 52 of 222 (23%)  |
| Median `answer` length                                                  | 51 chars         |
| `approval` turns ≤10 characters                                         | 165 of 270 (61%) |
| Median `approval` length                                                | 8 chars          |
| `answer` turns in the goals stage                                       | 91 of 222 (41%)  |

Half of everything the owner types back to mise is a menu pick or a go-ahead of ten characters
or fewer, and 4 of the 54 process complaints are about those menus failing anyway — options
scrolling out of view (_"what were the other options? I thought I answered."_), the answer
getting buried (_"Earlier, I asked a question about how the discount shows in Stripe checkout,
but I missed the answer."_), the question arriving without what is needed to answer it
(_"Recommend from what? I am missing some info here"_), and the whole set needing to be re-shown
(_"Previous messages are buried in conversation. Show me again. Numbered with suggested
approaches for any questions"_).

`answerWasInRepo` is a bounded judgement: the classifying agent read okven's root and
`functions/` CLAUDE.md, `.claude/mise-config.md`, `.claude/mise-checklist.md`,
`docs/design/spanish-voice.md` and the doc-style skill, but did not exhaustively grep every
product doc in every repo. `No` means no evidence was found that the fact was written down.

---

## 10. Method and gaps

| Item                                                                | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corpus                                                              | 537 distinct Delta Review notes (555 rows, 18 archive duplicates), 16 branches, 4 repos, 2026-07-27 .. 2026-09-19. All 16 are mise runs.                                                                                                                                                                                                                                                                                                          |
| Re-verification done here                                           | (a) every 4th note re-classified blind, n=134, 95.5% agreement; (b) all 32 cited rule `file:line` refs opened at HEAD and dated with `git log --all -S`; (c) 60 agent responses read and classified, 12 of those re-read blind, 12/12 agreement; (d) `runs/delta-notes.jsonl` rewritten in place with `ruleVerified` + `ruleVerifyNote`.                                                                                                          |
| **Offending code is mostly unrecoverable**                          | The pre-fix source survives only where a Delta Review state snapshot of that file predates the note. For the 162 test-style + comment-doc-slop notes: **58 (36%) at-or-before the note, 99 (61%) only after the fix, 5 (3%) never snapshotted.** Every code shape quoted above is labelled with its snapshot sha; where the shape could not be recovered the row says so.                                                                         |
| **The `.snap` file cannot be shown**                                | R216's `hosting/composables/__snapshots__/useCampaignSpendForm.test.ts.snap` appears in no commit on any of okven's 8,822 refs and in no `refs/review/*` tree; the first snapshot of its test file post-dates the note by 5 h. The note text is the only evidence it existed. `git grep toMatchSnapshot` is 0 everywhere, including every working-tree snapshot — which is what a defect the owner always catches looks like in git.              |
| Fix-latency measure                                                 | Uses the commit sha the agent named in its own response (277 of 534 responses carry one; 270 resolve in-window). Notes whose fix was never committed with a cited sha are invisible to it, and the agent may cite a commit that only partly addresses the note.                                                                                                                                                                                   |
| Flow attribution                                                    | Reads skill/slash-command events from the 99 session digests. A fix driven by a plain chat turn inside a session where `/delta:review-notes` ran earlier in the same window is credited to that skill, so the 28.9% is an upper bound and the 55.2% ad hoc share a lower bound.                                                                                                                                                                   |
| No stage/role attribution for Delta notes                           | The notes store carries no stage or role field, and `.mise/` task files are deleted at close-out, so a note cannot be traced to the subagent that wrote the code. `.mise/_friction.md` is the only artefact that names a producer, and it names the _catcher_ (`task NN: review found …` vs `acceptance: user flagged …`), not the writer. Every Delta note is by construction a defect that passed mise's critic, reviewer and acceptance gates. |
| `_friction.md` coverage                                             | 26 of okven's branches carry one; `refs/review/HEAD` (310 lines) was excluded to avoid double-counting an unidentified branch. Runs whose branch was squash-merged and whose review ref was never written contribute nothing. Line kinds were classified by prefix regex, so the 185 "other" lines are unanalysed.                                                                                                                                |
| Category boundary                                                   | Round 1's `question` vs defect boundary is the only one that moves under blind re-classification (6 of 6 disagreements). Counts for `test-style` and `comment-doc-slop` are stable.                                                                                                                                                                                                                                                               |
| Lintability column                                                  | The 10 selectors in section 1.4 **were run** read-only over okven's 756 test files (`tools/lint-probe/eslint.escapes.mjs`); their hit counts are measured, not estimated. The selectors for the comment/doc defects (D1, D4, D7) were **not** run — they need a local ESLint rule over `sourceCode.getAllComments()` that does not exist. Hit count is not defect count: `expect(wrapper.vm.x)` sits inside the 542 T1a field reads.              |
| Owner-message extraction                                            | 1,092 rows from 43 of 43 mise sessions; 25 of 25 sampled rows matched the raw transcript verbatim. Session `bf648c37` writes every row 3× (29 groups, 54 extra rows); deduped by uuid, so the digest's 117-message count for it is inflated.                                                                                                                                                                                                      |
| **6 session transcripts have been deleted**                         | since the 2026-09-19 digest run: `aydy/9026fc28`, `delta-review/b0a2d712`, okven `eric-attribution-3/528f8358`, `feat-backfill-order-history/840b8b0a`, `feat-migrate-firebase-kit/68e7f630`, `feat-remove-backfill-order-history/c8743e06`. Their 86 rows fall back to the digest's `head300`; 6 exceed 300 chars and carry `truncated: true`, and no assistant context is recoverable for them.                                                 |
| `miseStage` null on 189 rows (17%)                                  | `state.ts` stamps `stage` only on `approve`; the fallback is `report.next_action`. Rows before the first stage-bearing call have none. Two vocabulary deviations are recorded deliberately: `mock` is emitted literally (9 rows) and observed `acceptance` maps to `close-out`.                                                                                                                                                                   |
| Role attribution is proximity, not authorship                       | `miseRoleNearby` is null on 746 of 1,092 rows (68%) because the literal last spawn is often a non-mise agent; `lastMiseRole` is null on 419. Neither says which role wrote the code the owner is correcting.                                                                                                                                                                                                                                      |
| Class labels are less stable than the agent's own re-check suggests | Its every-5th-row re-check agreed 97.7% (n=219); my independent every-28th-row re-check agreed 79% (n=39), all breaks on `approval`/`redirect` and `redirect`/`answer`. 48% of rows are `classConfidence: low`. Treat `approval` + `redirect` as one bucket.                                                                                                                                                                                      |
| Complaint recall is deliberately generous, and still a floor        | 54 rows, 24 high / 30 low confidence. Rows where process friction rides along with a dominant answer or redirect intent ("I would like to review the changes you make before fully proceeding", "do up to 3 rounds of critics") are classed by dominant intent with the friction recorded in `notes`; grep `notes` for "friction" to widen the set.                                                                                               |
| Repo skew                                                           | 546 of 555 rows are okven, 238 of 537 notes are one run (eric/attribution-3). Nothing here generalises beyond okven without that caveat.                                                                                                                                                                                                                                                                                                          |
