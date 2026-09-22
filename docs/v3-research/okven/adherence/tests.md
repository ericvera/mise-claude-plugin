# Adherence examples — tests

Family `tests`, for the `adherence` role. Every finding cites an example id from
this file: `file:line — quoted text — <id>`. Notes are the owner's own words from
Delta Review, verbatim including typos. Ids are `R<row>` in
`docs/v3-research/runs/delta-notes.jsonl`. Sub-patterns and counts come from
`runs/escapes.md` §1.1–1.2 (127 test-style notes over 16 runs, 2026-07-27 ..
2026-09-19). Where the pre-fix source did not survive (61% of notes are only
snapshotted after the fix, escapes.md §10) the row says "shape unrecoverable".

## T1a — a field or index is read inside `expect()` (n=10)

Shape (`loadOrderReplyContext.test.ts:45-57` @ `fb7e42fcc`): `expect(result.type).toMatchInlineSnapshot(...)`, then `expect(result.orderLocation.name)`, `expect(result.menu.name)`, `expect(result.availabilityVersion)`, under the agent's own comment "The full context embeds the whole menu and availability map — too wide to read — so the load-bearing fields are asserted directly". Also `expect(updatedBusiness.afterDoc.data().pendingAgreement).not.toBe('old-agreement-id')` (`handleSetBusinessAgreement.test.ts:318` @ `fcdf1e8f2`).
Fix (both at HEAD): one `expect(result).toMatchInlineSnapshot(...)` over the whole value; for the DB case, `getDBChanges(..., { [DBCollection.Business]: ['pendingAgreement'] })` then one snapshot of `getDBChangesDiff(changes)`.

- T1a-1 R468 — "always check the full object. no prop spot checking"
- T1a-2 R76 — "We should check full result. Applies here and in any methods that generates a result. No prop drilling."
- T1a-3 R278 — "we only expect on full data and do not prop drill like this. We should also always check the db diff."
- T1a-4 R412 — "we check full objects and not these made up complex props/objects"
- T1a-5 R340 — "we must not be prop drilling"

## T1b — a value re-assembled in the test, then snapshotted (n=5)

Shape (`toMetricName.test.ts:13-24` @ `da959b265`): `const names = [toMetricName(MetricType.Count, 'visit'), toMetricName(MetricType.Owners, 'visit')]` then `expect(names).toMatchInlineSnapshot(...)`. Also `const { output, system, ...request } = mockGenerate.mock.calls[0][0]` then `expect(request)...` (`classifyContent.test.ts:44-48` @ `ec65ed587`) — indexes one call, strips two fields, snapshots the remainder.
Fix (`classifyContent.test.ts:61` at HEAD): `expect(mockGenerate.mock.calls[0]).toMatchInlineSnapshot(...)` — the call is snapshotted as it arrived, nothing stripped.

- T1b-1 R506 — "This type of expect is not allows. Fix it here and accross the branch if it shows elsewhere."
- T1b-2 R73 — "this is another case of building objects for expect. Go over all of the tests files and fix this."
- T1b-3 R70 — "do not use these complex objects. Go over all the tests and ensure that this is not happenning. This should be somewhere in the reviewer guides. Maybe the mise review doc?"
- T1b-4 R61 — "check the return values directly rather than aking up objects"

## T1c — the matcher family hides the value (n=4)

Shape: a void function snapshotted as the template literal `undefined` — `expect(checkPeriodKey('2026-W29', SummaryGranularity.Week, TestZone)).toMatchInlineSnapshot(...)` (`checkPeriodKey.test.ts:8-10` @ `d9065e942`); `expect(() => formatClarificationMessage([issue], undefined, undefined)).toThrow('Unexpected clarification issue type: unknown-type')` (`formatClarificationMessage.test.ts:665-667` @ `7119f5770`); `const r = await f(); expect(r)...` in place of `await expect(f()).resolves...`.
Fix (`formatClarificationMessage.test.ts:666-670` at HEAD): `.toThrowErrorMatchingInlineSnapshot(...)` holding `[Error: Unexpected clarification issue type: unknown-type]`. For the void case the owner asked for `.not.toThrow()`.

- T1c-1 R529 — "we should use inline snapshot version of totrowh"
- T1c-2 R71 — "Should these cases, and all others that are similar in the repo, use .not.tothrow() instead of checking for undefined?"
- T1c-3 R471 — "use await expect().resolves.toMatch..."
- T1c-4 R194 — "don't we use `await expect().toResolve...` pattern everywhere?"

## T1d — a file-based `.snap` instead of an inline snapshot (n=1)

Shape unrecoverable. `hosting/composables/__snapshots__/useCampaignSpendForm.test.ts.snap` appears in no commit on any of okven's 8,822 refs and in no `refs/review/*` tree (escapes.md §10); the note is the only evidence it existed. Only one note exists for this sub-pattern.

- T1d-1 R216 — "We only use inline snapshots in this project"

## T2 — a verification split out as its own `it()` (n=13)

Shape unrecoverable as quotable source; escapes.md §1.2 describes it as a second `it()` whose setup duplicates its sibling's and that differs only in the assertion. Covering rule: CLAUDE.md:145, since 2026-03-04.

- T2-1 R62 — "we must not have multiple tests inside an it. That is the whole point."
- T2-2 R235 — "Ensure we have a test per scenario with multiple validations rather than a test per validation. Do this through all the test files in this branch."
- T2-3 R437 — "this seems like something that should just be a verification on an existing test rather than its own test"
- T2-4 R509 — "This feels like a validation in one of the prior tests rather than a new scenario which is agains the repo rules and guides."

## T3 — per-test setup not hoisted into `beforeEach` (n=14)

Shape (`handleFreeformText.test.ts` @ `8ce4af37c`): `clearMenuCache()` in the file's `beforeEach` at line 109 **and again inside individual `it()` bodies** at 1309, 1462, 1522, 2598, 3035, 3195 — 8 occurrences in that snapshot against 2 (import plus `beforeEach`) in the snapshots 9 min before and 28 min after.
Fix: the one `beforeEach` call only. The exception now in functions/CLAUDE.md:21 is `getCachedMenu.test.ts`, where the cache is the subject.

- T3-1 R445 — "should this be set in beforeEach?"
- T3-2 R460 — "should this just be in beforeEach?"
- T3-3 R463 — "should this be in beforeEach?"
- T3-4 R455 — "beforeEach?" (8 of the 14 notes are this word alone, fired in 90 seconds)

## T4 — the `it()` title or `// Verify:` line does not match the fixture (n=9)

Shape: `it('returns item-unavailable when multiple items missing from menu')` over a fixture that removes one item (`handleInitiateOrderPayment.test.ts:1182`); a title saying "no items" over a fixture holding one (`loadOrderReplyContext.test.ts:1457`). Both quoted from escapes.md §1.2; the pre-fix titles do not survive at HEAD.
Fix (`handleInitiateOrderPayment.test.ts:1182` at HEAD): `it('drops the line the menu lost and re-quotes the one it kept', ...)`.

- T4-1 R526 — "the title says "no items", but `items` has one item."
- T4-2 R537 — "the title of the test says multiple items, but only one item is removed. What is going on?"
- T4-3 R170 — "I don't see returned anywhere. Check all the comments in this file and test titles to ensure that they are doing the right thing."
- T4-4 R363 — "the name of the test seems wrong. Ensure all tests are valid desired tests and the test is testing what we expect."

## T5 — a test added where the surrounding convention is no test (n=6)

Shape: `hosting/components/atoms/Checkbox.test.ts`; `hosting/composables/*.test.ts`; `functions/src/utils/db-refs/*.test.ts` that call `await query.get()` against the emulator.
Fix: the file is deleted. mise recorded this one against itself — "correction: user removed the restored Checkbox.test.ts — no other atom in hosting/components/atoms/ has a colocated test, so the gate repair applied the new-file rule where the surrounding convention is none" (`.mise/_friction.md`, feat/close-out-orders). The colocated-test rule causes this defect, so T5 outranks T6 wherever they collide.

- T5-1 R295 — "no atom has tests. Remove this file"
- T5-2 R221 — "We have no tests for vue files in this project so far right? If so, remove all of the ones added in this branch."
- T5-3 R195 — "The existing pattern is that there are no tests for these refs. Let's keep it that way for now."
- T5-4 R132 — "db refs should never try to actually test the queries in this way. Check other de ref tests and follow the pattern. They get tested by their consumers."

## T6 — new code with no colocated test (n=8)

Shape unrecoverable — the defect is an absent file. Detect it with `git diff --diff-filter=A --name-only origin/main...HEAD`, then check each added `.ts` for a sibling `.test.ts`, minus the Test exceptions.

- T6-1 R304 — "Go through all the changes. You seem to be getting sloppy about ensuring that all code files have co-located test files."
- T6-2 R301 — "This file seems to be missing the co-located test."
- T6-3 R384 — "Did you add tests for the new branches? Any other code additions with no tests?"
- T6-4 R283 — "Do we not need a test for this? (follow the pattern for other cases)"

## T7 — mock placement, or internal code mocked (n=8)

Shape (`useHomePage.test.ts:33-36`, escapes.md §1.2): `vi.mock('vue-bare-composables', async (importOriginal) => …)` written inline in the test file rather than in `__mocks__`. The internal-path form still stands at HEAD in the same file: `vi.mock('~/callables/getFastKeepalive', () => ({ ... }))` at line 36 and `vi.mock('~/utils/whatsapp', async (importOriginal) => ({ ... }))` at line 44.
Fix (`useHomePage.test.ts:30` at HEAD): bare `vi.mock('vue-bare-composables')` with the factory moved to `__mocks__`.

- T7-1 R275 — "We should never mock internal utils. Only external modules."
- T7-2 R241 — "Should all vi.mocks be in **mocks** or is there a good reason to keep them collocated in the test files?"
- T7-3 R237 — "why here and not in **mocks**? If there is a good reason document it here."
- T7-4 R7 — "should this move to **mocks**?"

## T8 — the fixture carries values that mean nothing (n=12)

Shape (`createInMemoryStore.test.ts` @ `534a37f08`, before R146): the inline snapshots carry 29 empty-object literals — `"amountTotals": {}`, `"dimensionFirstAt": {}`, `"firstAt": {}` repeated down every expected document. Also the same value twice in a two-value fixture (`getScanWindow.test.ts:95,116`).
Fix: drop the prop from the fixture, or say at the line why it stays. Owner's rule at acceptance: "user flagged empty `{}` props in the day document snapshots — omit them or say why they stay" (`.mise/_friction.md`, eric/attribution-3).

- T8-1 R142 — "there seems to be a lot of `{}` props with empty objects. Should those just not be defined to make the objects simpler? Any reason to keep them?"
- T8-2 R146 — "this still shows empty {}"
- T8-3 R92 — "why the same value twice?"
- T8-4 R167 — "Should we also be avoiding empty maps here? would that be easy? It would certainly make tests easier to deal with."

## T9 — the fixture contradicts the real flow (n=11)

Shape (`handleOrderInitiation.test.ts:1264`): a DB diff showing `taxes` **added** where a real edit would show it **updated**, because the setup never seeded the prior value.
Fix: seed the prior state inside the `it()` so the diff reads as a change.

- T9-1 R534 — "taxes should just be updated right? not be fully new? did we miss adding data in the test setup inside the it?"
- T9-2 R539 — "taxes should have just been updated rather than added here right?"
- T9-3 R391 — "In an actual flow, these would have existed right? So they would not be new in the diff? And also a few other props seems like they should have already existing and be either changes or nothing rather than added?"
- T9-4 R433 — "it seems the setup for the test was lacking. I expect at least taxes to not have changes if items didn't change."

## T10 — the test proves nothing, or asserts the mock (n=12)

Shape: `updateSpendSums.test.ts:78` — a test named for `updateSpendSums` that never calls it, reaching it only through another export; `useCampaignSpendForm.test.ts:263` — every collaborator mocked, so the assertions read back the mocks.
Fix shape unrecoverable (no pre-fix snapshot survives); the accepted answer in both cases was to call the subject directly or delete the test.

- T10-1 R200 — "what is this really testing? I don't see the call to updateSpendSums anywhere"
- T10-2 R233 — "Is this a real tests? It seems like with all the mocks maybe we are not testing anything here? Just checking."
- T10-3 R180 — "Is this actually testing getRowBucket? It seems to be testing a lot more."
- T10-4 R321 — "why does this exist?"

## T11 — eval and case-data quality (n=6)

Shape (`functions/src/evals/message-classification/cases.ts`): eval cases that copy the prompt's own examples verbatim, so the eval scores the prompt against itself.
Fix shape unrecoverable; the accepted answer was variations on the prompt's examples, not the examples.

- T11-1 R331 — "Many of the tests in these files seem to match exactly the examples in the prompt. Perhaps we should use variations more than just those. Do we?"
- T11-2 R326 — "This is a bad example and exactly the kind of case we would not want this warning for. Perhaps something like an extra s somewhere?"
- T11-3 R413 — "this is a bad example for something that shoudl have a forced modifier. Pick a better one."

## T12 — residual: fixture language, fake timers, helpers (n=8)

Shape: mock menu text in English where Spanish is required (`functions/src/__test__/mock-data/menus.ts:499`, `name: 'Coffee'`); a test reading the wall clock instead of calling `setFakeTimer()`.
Fix: Spanish copy per docs/design/spanish-voice.md; `setFakeTimer()` in the file's `beforeEach` (functions/CLAUDE.md:15).

- T12-1 R446 — "why is this in english. Switch the sample text to spanish."
- T12-2 R480 — "Use Spanish instead of Coffe"
- T12-3 R17 — "why not setFakeTimer here?"
- T12-4 R165 — "Is this shared between a bunch of the tests? Should it be extracted? Any other test helpers that could be extracted?"
