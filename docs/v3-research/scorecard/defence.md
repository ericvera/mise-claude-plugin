# Defence of the cuts

Bar: a cut stands unless a **concrete past catch** is produced that no surviving v3 channel would make.
Arguments about what a mechanism could prevent do not count. Row-level hand classifications with the
verbatim text are in `defence-rows.jsonl` (96 rows). Git checks are read-only (`git show`/`grep`/`log -S`)
in the target repos.

## Summary

| #   | cut under test                                                                                    | unique catches that would be lost                                               | n examined                                             | verdict                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | O1 cut the acceptance subagent                                                                    | **2** (1 certain)                                                               | 42 (whole population)                                  | stands with a named replacement channel                                                                                    |
| 2   | O4 cap critic at 2 / draft cap 3                                                                  | **~247** at cap 2, **~162** at cap 3 (extrapolated from a 54-row hand read)     | 54 hand-read of 357                                    | **overturn** -> cap 5, stop at the first round with no first-time blocking finding                                         |
| 3   | O3 merge requirements below 2000 LOC                                                              | **0**                                                                           | 2 (whole population)                                   | stands                                                                                                                     |
| 4   | M55 end-of-plan gate rounds 2+                                                                    | **0**                                                                           | 81 (whole population, all read)                        | stands with a named replacement channel (rebuild before the gate)                                                          |
| 5   | M52 cut the documenter                                                                            | **1** (against: 0 owner praise, 5 complaints, 6 acceptance flags on its output) | 71 of 1,794 comment-edit hunks, 176 documenter commits | stands with a named replacement channel (same one as item 1)                                                               |
| 6   | O2 retrospective out of the run                                                                   | **1, and weak**                                                                 | 24 adopted proposals (of 159)                          | stands, provided the on-demand retro keeps `M60`                                                                           |
| 7   | O10 whole-diff instead of per-task review                                                         | **0 on small, 1 on medium**                                                     | 175 of 270 reviewer findings, 14 runs                  | stands on small and medium; per-task stays on large                                                                        |
| 8   | O8 task file to 12 lines; draft cuts Phase Rationale / Assumptions / Testing suggestions / Guides | **0 owner corrections; 34 reviewer findings rest on a section O8 cuts**         | 214 section mentions across the finding corpus         | partly overturn: keep Guides, Gotchas, Background, Implementation details, Testing suggestions; cut Requirements addressed |
| 9   | anything cut that guards irreversible harm                                                        | **1**                                                                           | corpus-wide sweep                                      | O4 cap 2 and draft cap 3 must carry a blocking-severity carve-out                                                          |

## 1. Acceptance subagent (O1 cut, draft cap 1)

Population: every acceptance finding whose substance is `defect` or `convention` **and** whose outcome is
`code-or-artifact-changed` = 42 of 425. All 42 hand-read from the verbatim text; the named file/symbol of
each was then checked in the target repo at the branch tip.

| hand class of the 42                                                                               | n     |
| -------------------------------------------------------------------------------------------------- | ----- |
| not a finding at all (pass/verification statement scored as a defect)                              | 10    |
| nit, process or artifact-only                                                                      | 11    |
| restatement of another finding in the same run                                                     | 2     |
| a real defect or convention finding                                                                | 19    |
| ...of those, git-confirmed to have produced the change it asked for                                | 5     |
| ...of those 5, the per-task reviewer had seen that code and passed it, or no reviewer could see it | 5     |
| ...of those 5, the owner's own acceptance flag names the same item                                 | 3     |
| **left: only this subagent caught it, and it changed code**                                        | **2** |

The 2: `#28` certain, `#34` possibly inside the owner's bundled flag "the five code nits". Blind re-check
of every 5th row: 8/8 agreement. The 5 confirmed repairs sit at acceptance rounds **1, 2, 2, 13 and 17**,
so the draft's "cap at 1 round" loses 4 of the 5 on its own.

| #   | verbatim (trimmed)                                                                                                                                                                                                                                                                                                                                                                         | source                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 28  | "Narrow hole in the asking strip (`interpretOrder.ts:145-158`): survival is keyed on item id alone, so a re-emitted line for an id already in the order is kept with whatever `q`/`m`/`v` the model returned. If the model bumps a quantity on an asking turn, that bump reaches `commitOrderState`. The test ... asserts "the unchanged order" but only exercises identical re-emission." | `.../okven-worktrees-feat-specials-fixes/19d0c3b2.../subagents/agent-a5d730a970a931f51.jsonl` (acceptance r13, 2026-08-29). Fix landed: `interpretOrder.ts` at `953c8c2ad` maps the re-emitted line back to the stored one (`previousItemBySourceItem`), commit `d4b4190ea` 2026-08-30. Reviewers had read `interpretOrder.ts` twice (`04_02`, `04_05`) and passed it.                          |
| 19  | "`functions/CLAUDE.md` says scheduled functions are accessed via `__endpoint.scheduledFunction`, but the v2 manifest field is `scheduleTrigger` (what `scheduled.test.ts` snapshots) - config file, outside the documenter's remit"                                                                                                                                                        | `.../okven-worktrees-feat-close-out-orders/0ac4ed3a.../subagents/agent-a18c65404209d20eb.jsonl` (acceptance r1, 2026-08-26 10:57Z). `functions/CLAUDE.md:27` at `05eb5e2a4` now reads `__endpoint.scheduleTrigger`. No task touched that file, so no per-task reviewer could see it. Owner flagged it too, 7 h later.                                                                           |
| 17  | "REQ-RETIRE-1 (`Every` sentinel): not verified - `Every = '__every__'` survives at `packages/attribution/src/constants.ts:15` and is live"                                                                                                                                                                                                                                                 | `.../okven-worktrees-eric-attribution-3/bf648c37.../subagents/agent-a9b83ab438058c8be.jsonl` (acceptance r2). Structurally acceptance-only: a "MUST no longer exist" requirement is a whole-branch absence check no per-task reviewer can make. **But the code never changed** - the symbol is still at `constants.ts:15` on both `127de1e18` and `c1cb4a81c`, so it is a catch with no repair. |

Against the cut's own premise. The overlay's basis is "Owner flags (57) are his own reading". Timing says
otherwise: in **11 of 12** branches the owner's first acceptance-stage turn _follows_ the acceptance
subagent's first run (e.g. `feat/close-out-orders` gate 2026-08-26T10:57:21Z, first owner acceptance turn
2026-08-26T17:59:58Z). The owner's flags are downstream of the verdict list, not independent of it.

Against keeping it. 10 of 42 "findings" are pass statements; two of the three strongest catches (`#13`
REQ-RESP-4, `#16` REQ-DASH-7) are **duplicates of reviewer round-1 findings** the reviewer had already
made; and 4 of the 5 confirmed repairs sit at rounds 1, 2, 13 and 17, so the draft's "cap at 1 round"
loses 3 of 5 on its own.

**Verdict: stands with a named replacement channel.** Two classes must move into the driver's end-of-run
verification list, because no per-task reviewer can see them by construction: (a) _removal/retirement_
requirements ("X MUST no longer exist") verified by one grep over the branch tip; (b) repo instruction
and config files (`CLAUDE.md`, `functions/CLAUDE.md`, guides) the diff never touches but the change
falsifies.

## 2. Critic rounds 3+ (O4 cap 2, draft cap 3)

### (a) Yield by round, whole population (n=1,531 critic findings)

| bucket  | n   | changed the artifact | repeat of an earlier round | no visible response |
| ------- | --- | -------------------- | -------------------------- | ------------------- |
| r1      | 348 | 178 (51.1%)          | 78 (22.4%)                 | 84 (24.1%)          |
| r2      | 289 | 141 (48.8%)          | 69 (23.9%)                 | 72 (24.9%)          |
| r3      | 253 | 121 (47.8%)          | 49 (19.4%)                 | 57 (22.5%)          |
| r4-5    | 345 | 176 (51.0%)          | 59 (17.1%)                 | 100 (29.0%)         |
| **r6+** | 296 | **60 (20.3%)**       | **139 (47.0%)**            | 87 (29.4%)          |

The cliff is at round 6, not round 3 and not round 2. r3 and r4-5 are indistinguishable from r1 and r2 on
both yield and repetition. The same shape holds separately for `critic-requirements` (56.4% / 46.2% / 19.0%
changed at r3 / r4-5 / r6+) and `critic-plan` (41.3% / 56.5% / 21.5%).

### (b) Hand read of what those changed findings are (n=54, stratified by bucket and gate)

| bucket | n   | first-time defect of substance | repeat or rewording | introduced by the previous revision | nit |
| ------ | --- | ------------------------------ | ------------------- | ----------------------------------- | --- |
| r3     | 20  | **14 (70%)**                   | 0                   | 0                                   | 6   |
| r4-5   | 20  | **16 (80%)**                   | 0                   | 0                                   | 4   |
| r6+    | 14  | 5 (36%)                        | 1                   | 0                                   | 8   |

Blind re-check of every 5th row: 10/10 agreement. Caveat: the sample is drawn from findings whose outcome
is already `code-or-artifact-changed`, and `repeated-in-later-round` is a _separate_ outcome value, so the
repeat column is suppressed by construction - use the population table in (a) for the repeat rate.
Second caveat: the r6+ collapse is branch-specific. `feat/specials-fixes` (15/144 changed at r6+) and
`feat/tips` (3/67) supply most of the waste, while `fix/menu-pin` holds 13/14 (93%) and `HEAD`
(ericvera.dev) 11/14 (79%).

Extrapolating the hand rates to the changed populations: cap 2 discards ~**247** first-time substantive
findings (85 at r3 + 141 at r4-5 + 21 at r6+); cap 3 discards ~**162**.

| #   | verbatim (trimmed)                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | source                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| r5  | "**Blocking - the format guardrail lands two tasks too late, so the first task destroys the approved mock and the archive (REQ-SITE-12).** Task 1.3 creates `.prettierignore`, but Tasks 1.1 and 1.2 run first, and the implementer role runs the config's `Format` command (`yarn format` = `prettier --write .`) ... I confirmed the damage empirically: `npx prettier --list-different .` reports **75 files** today, including `.mise/mocks.html` ... and the whole six-round archive." | `.../-Users-eric-Code-metaforico/9bd9580e.../subagents/agent-aa957219f66c89fcb.jsonl` (critic-plan r5). Landed: the run's squashed commit metaforico `5d51972` ships `.prettierignore`, commented "Mise working directory. It holds the approved design mock, whose hero headline depends on inter-element whitespace that prettier's HTML formatter moves." and "Preserved design archive ... approved as-is and kept as process history." The run is squashed, so git shows the file and its reasoning but not which task created it. |
| r4  | "Task 3.5 drops two existing notes from the payable summary ... Following the instruction literally, the meets-minimum branch loses `PaymentLinkInvalidatedNote` and `notAddedText`. Failure: a customer whose item was 86'd mid-round, or whose payment link died, gets a payable summary with the discount lines but no "no anadi X" / "el enlace anterior ya no sirve" note - on the one message they read before paying."                                                               | `gate-findings.jsonl` `a71483bb801787d21#1`, critic-plan r5, `feat/first-time-offer`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| r7  | "**BLOCKING - the merge still drops `show-percentage`, so REQ-PRICE-1 loses its percentage.** The round's fix re-landed all three `:pre-markup-price` bindings but missed the fourth binding on the same element ... Worse, this round's edit _removed_ the last trace: `02_04`'s checklist item previously read "... and percentage" and was replaced with a strikethrough-only item."                                                                                                     | `.../okven-worktrees-fix-menu-preview-changes/733ec0b9.../subagents/agent-ad8f6c4e6e8eaa1b1.jsonl` (critic-plan r7). This is the **only** instance in 894 r3+ critic findings of a defect the previous round's revision introduced, and it was caught two rounds past the draft's cap.                                                                                                                                                                                                                                                  |

**Verdict: overturn.** Cap at **5** rounds, and stop earlier at the first round that produces no
first-time blocking finding. The token argument (E-012/E-013) is unchanged and real, but it prices
_tokens per change_, not _defects lost_; the yield data says rounds 3-5 are the same product as rounds
1-2. A cap of 2 is the most expensive line in either document by this measure. The price of overturning
is explicit: rounds 3-5 cost 2.17M (plan) and 850k (requirements) tokens per change against 1.20M and
295k at r1-2 (E-012), so a cap of 5 buys ~162 substantive findings back at roughly 2x the r1-2 rate - and
it is a _bound_, not a target: 38 of 60 (run, gate) pairs already settle at <=3 (E-015).

## 3. Requirements artifact and its critic below 2000 LOC (O3)

Population: every `critic-requirements` finding on a branch whose `loc.codeTotal` is under 2000. Joining
`gate-findings.jsonl` to the `*-runs.jsonl` `loc.codeTotal` gives **37 runs** under 2000 LOC, of which 8
have a surviving transcript in the finding corpus. Seven of those 8 produced **zero** critic-requirements
findings. The eighth, `feat/remove-k-prop-migration` (920 LOC), produced **2**.

| n   | finding (verbatim)                                                                                                                                                                                                                                             | outcome               | would the plan critic have seen it in a merged spec?                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| 1   | "Report delivered: 1 blocking finding (REQ-KEEP-1's "types.ts unchanged" contradicts removing `ClarificationRoundsMigrationReport`, which lives there), 2 minor (db-refs suite missing from REQ-KEEP-3; orphaned `MaxFunctionTimeoutSeconds`), 1 informative." | `no-visible-response` | Yes - an internal contradiction between two "what" statements survives the merge verbatim |
| 2   | "Review delivered. No blocking findings; one minor (orphan `// Queries (Migration)` header in `orderRefs.ts:206` contradicting REQ-DOC-2) and two informative notes."                                                                                          | `no-visible-response` | Yes - same                                                                                |

Both drew no visible response. n examined = 2 = the whole population.

**Verdict: stands.** 0 catches lost. (E-069's "2 runs, 2 findings, 0 changed" reproduces exactly.)

## 4. End-of-plan gate rounds 2+ (M55 cap)

Population: all 94 `gate-run` spawns; 81 have `roundInBranch >= 2` (= E-024's 81). **All 81 final
messages read in full.**

| class                                                  | n     | of which are genuine end-of-plan spawns |
| ------------------------------------------------------ | ----- | --------------------------------------- |
| clean pass                                             | 57    | 42                                      |
| tool-or-env                                            | 11    | 10                                      |
| no report at all (progress text, empty, session limit) | 8     | 7                                       |
| flake (timeout, passes on rerun)                       | 4     | 4                                       |
| **real code defect**                                   | **1** | **0**                                   |
| already reported in r1                                 | 0     | 0                                       |

**Real code defects caught by an end-of-plan gate at round 2 or later: 0.** The single
`real-code-defect` row is a _baseline_ gate (the prompt reads "You are running the **baseline gate**"),
sitting at `roundInBranch=2` only because round 1 is a misclassified read-only explorer spawn.

| #                                                  | verbatim (trimmed)                                                                                                                                                                                                              | source                                                                                                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the one real defect, and it is a **baseline** gate | "Baseline gate FAILED. ... `handleUpdateOrderStatus.test.ts(2375,5): error TS2304: Cannot find name 'createMockCapturedPaymentIntent'` ... **Branch-introduced:** the file was last touched on this branch by `b7bdcaccf`"      | `.../okven-worktrees-eric-attribution-3/bf648c37.../subagents/agent-a0d9e8aaec53a5cf9.jsonl`, 2026-09-07T01:17:01Z. Supports **M49 keep**, not M55 rounds 2+.                               |
| closest near-miss, scored PASS                     | "**Scenario D's quote looks wrong.** The customer asked for 3 tacos and the resulting quote reads `1x Birria de Res (Tacos)` ... the quantity did not follow the modification. Probably worth a look independent of this gate." | `.../okven-worktrees-feat-voice-notes/f23e7541.../subagents/agent-a05dc14dc188e153f.jsonl` r17. Not a failing test, type error or build break; no follow-up failure anywhere in the corpus. |
| the only thing rounds 2+ did catch, 7 times        | "P1c caught a **stale bundle** - `functions/dist` was from Aug 29 while source commits ran through Aug 31 ... Without this the run would have validated 2-day-old code"                                                         | `feat/specials-fixes` rib16. Classified `tool-or-env`: not branch code, but it is the gate catching that _it was about to validate the wrong tree_.                                         |

**Verdict: stands with a named replacement channel.** 0 real code defects in 81 rounds. But the capped
gate must carry the one thing rounds 2+ demonstrably did: a **rebuild of `functions/dist` (or the
project's build output) immediately before the single gate run**, plus the 4 flake reruns that the cap
already allows as "one repair + one re-run". Without the rebuild step the single run validates a stale
bundle 7 times in 94.

Correction to E-024 while here: `roundInBranch` conflates 63 genuine end-of-plan spawns, 15 nested
sanity-e2e runner subagents that double-count their parent, and 3 pre-implementation baseline gates, so
"81 runs, rounds 2+" overstates end-of-plan re-runs by ~18.

## 5. Documenter (M52 cut) - counts both ways

Convention discovered, not assumed: documenter commits carry the subject prefix `Docs:` (set in
`roles/documenter.md` from `f098fb0`/1.7.0). Scanning all commit objects across 6 repos gives **176**
documenter commits (okven 170, metaforico 5, firebase-kit 1; **0** in aydy, delta-review,
mise-claude-plugin) and **1,804** code-file hunks that remove at least one comment line - 1,794 of which
also add comment lines, i.e. a prose _edit_, not an addition. **71 hunks hand-read**, stratified over 11
runs / 38 commits / 3 repos. Blind re-check of every 5th row: 17/17.

| what the documenter's edit did                                                    | n / 71 |
| --------------------------------------------------------------------------------- | ------ |
| **factual correction** (the prose contradicted the code or the snapshot below it) | **16** |
| stale vocabulary (names an identifier the code no longer uses)                    | 17     |
| style only (colon / semicolon / em-dash bans)                                     | 20     |
| compression (accurate rationale deleted)                                          | 8      |
| expansion (old text vague, not false)                                             | 7      |
| clarity                                                                           | 3      |

Who wrote the wrong or stale prose (33 rows): another commit 17, **the documenter's own earlier pass 10**,
the same run's implementer 5, a lowercase `docs:` pass 1.

Attribution of the 16 factual corrections - traceable in 6:

| case                                                             | who actually found it                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `f7ae591fb` `hosting/error.vue`                                  | **documenter, unprompted - the one clean instance**                                                          |
| metaforico `c32e8c215` `RingBand.vue`                            | critic-plan named it first                                                                                   |
| `ed6169730` / `a33c17e6a` (nine voice-note comment inaccuracies) | owner at the acceptance gate; all nine were introduced 13 h earlier by the documenter's own pass `61e72e95c` |
| `95c949c0b` pay-spinner comment                                  | documenter fixing its own pass `1e5003147` 50 min later                                                      |
| `15e8f5e40` `parse*` exception                                   | reviewer (friction 2026-09-18 feat/tips task 3.1)                                                            |
| `554906707`                                                      | acceptance gate, per its own commit subject                                                                  |

**Unique catches lost: 1.**

| #       | verbatim (trimmed)                                                                                                                                                                                                                                                                                                                             | source                                                                                                                                                                                                                                                                                                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| the one | before: "`// Hard reload to get the latest version. The service worker is already // configured with skipWaiting and clientsClaim, so it will automatically // update on reload.`" -> after: "`// A plain reload is enough: the service worker fetches navigations // NetworkFirst, so the page and its chunks come from the current deploy.`" | okven `f7ae591fb` `hosting/error.vue:148`. At `f7ae591fb^`, `skipWaiting`/`clientsClaim` appear nowhere in `hosting/` except this comment; `nuxt.config.ts:161` is `handler: 'NetworkFirst'`. The wrong comment was introduced by `ade0815a3` (2025-10-07) **on main**, and `hosting/error.vue` is in no implementer commit on the branch - so no diff-scoped reviewer could see it. |
| against | "acceptance: user flagged prose fixes (item 7) - **nine comments in the docs pass misdescribe the code** or their snapshot"                                                                                                                                                                                                                    | `runs/friction.jsonl`, okven `feat/voice-notes` 2026-09-07, `.mise/_friction.md` `8dd52beb4`                                                                                                                                                                                                                                                                                         |
| against | "a recent change seems to be cause a lot of usage as well as a lot of churn in documentation. Investigate and propose a fix." then "No. That is not it. **Mostly changes to comments.**"                                                                                                                                                       | `runs/owner-messages.jsonl` 2026-09-12T04:00:10.760Z and T04:08:45.529Z, mise-claude-plugin `fix/doc-churn-usage`                                                                                                                                                                                                                                                                    |

Owner messages **praising** the documenter: **0 of 1,092**. A praise-regex sweep returns 14 hits, all on UI
mocks and design output. Owner messages **complaining** about its output: **5**, plus **6** owner
acceptance flags naming the prose pass as the source ("eight stale comments/doc lines misdescribe the
code", "stale/misdescribing comments - versioned-link Verify, orphaned CustomerSensitiveData JSDoc, ...",
`friction.jsonl` 2026-08-19 .. 2026-09-18 across 5 branches). The only owner message that mentions the
role by name is `/mise:next setup - mark all of the of the subagents to use opus except the documenter`.

**Verdict: stands with a named replacement channel** - the _same_ channel item 1 needs. The single catch
is not "the documenter writes better prose"; it is "someone read a file the diff never touched and found
its comment was already false". Add that sweep to the driver's end-of-run verification list and the class
is covered. Everything else the documenter fixed it had itself written (10 of 33), or another gate had
already named (5 of the 6 traceable factual corrections).

## 6. Retrospective out of the run (O2)

Population: the 24 proposals in `friction.jsonl` with an exact-text `git log -S` adoption match (of 159
total, E-031's 53 "adopted or likely-adopted" includes the looser class). **11 of the 24 have an adoption
commit that predates the proposal** - the proposal restated text that already existed, so they are not
adoptions. The 13 real ones reduce to 9 distinct defect classes.

| class                                                                               | adoption                                                    | n before | n after | later runs covered                                 | clears the bar?                |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------- | ------- | -------------------------------------------------- | ------------------------------ |
| shared test setup not hoisted into `beforeEach`                                     | okven `functions/CLAUDE.md:21`, `337012e57` 2026-08-31      | **14**   | **0**   | 5 runs, 45 later notes on `functions/**/*.test.ts` | **yes - the only one**         |
| optional param every caller fills                                                   | okven `CLAUDE.md:87`, `ee31fed69` 2026-08-31                | 2        | **4**   | 3 runs                                             | no - got worse                 |
| one name per concept (vocabulary drift)                                             | `.claude/mise-checklist.md` rule 15, `f2ea0997c` 2026-09-12 | 36       | **38**  | 2 runs                                             | no - got worse                 |
| log level on a bail-out                                                             | okven `functions/CLAUDE.md`, `8d3fbf15a` 2026-09-01         | 2        | **2**   | 2 runs                                             | no - rule rewritten twice more |
| design doc not updated in the same task                                             | `.claude/mise-config.md`, `730aad3d5` 2026-08-31            | 2        | **2**   | 2 runs                                             | no                             |
| ui-verify finding closed by reasoning; `disabled` opacity; dialog title as H1       | `ui-verify/SKILL.md`, `ui-conventions/SKILL.md`, 2026-08-24 | 1 each   | 0       | 3-4 runs                                           | no - n before < 2              |
| metaforico bundle (device check, iOS test exception, design archive, em-dash scope) | metaforico `CLAUDE.md`, `7ea2311b5` 2026-09-02              | 1 each   | 2       | only 1 later run exists                            | no                             |

**Unique catches lost: 1, and it is weak.** All 14 `beforeEach` instances are one run on one morning
(`feat/specials-fixes` 2026-08-31T03:09-04:52Z, verbatim "should this be in beforeEach?"), the class
appears in 0 of the ~20 okven runs before it, and later exposure halved (82 -> 45 notes). A one-run spike
followed by absence is as consistent with the base rate as with prevention.

| #                                                    | verbatim (trimmed)                                                                                                                                                                                                                                                                | source                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| the one that clears                                  | rule text landed in okven `functions/CLAUDE.md:21`, `337012e57` 2026-08-31T18:02:22Z, hours after 14 notes reading "should this be in beforeEach?"                                                                                                                                | `runs/delta-notes.jsonl`, okven `feat/specials-fixes`                   |
| got worse after the rule                             | "why is menu optional and not required?" (`selectUnresolvedClarifications.ts:13`, 2026-09-12); "Isn't the spendConfig optional?" (`updateSpendSums.ts:207`, 2026-09-16); "optional offer on SendOrderSummaryPromptData lets three production calls omit it" (2026-09-19)          | `runs/delta-notes.jsonl`, `runs/friction.jsonl` - all after `ee31fed69` |
| the rule needed rewriting because the class recurred | "why is this a warning and not an error? is an error logged elsewhere?" x2 (`handleVoiceNote.ts`, 2026-09-08); "a misnamed error-log label" (2026-09-11) - then two further retro proposals (checklist rule 14 on 2026-09-09; `4ebcccc0b` 2026-09-12) exist _because_ it recurred | `runs/delta-notes.jsonl`, `runs/friction.jsonl`                         |

**Verdict: stands.** 1 weak catch in 24 adopted proposals, 2 classes measurably worse after adoption, and
11 of the 24 "adoptions" are not adoptions. The one condition: the on-demand retro must keep `M60`'s
"guidance only, never source or plugin files" - that guard has no run evidence against it and it is the
only thing stopping a retro from editing code with no review.

## 7. Per-task review vs whole-diff review (O10)

Determinable only as **file-level co-touch**, not as a proven dependency. Method: reviewer findings with
`outcome='code-or-artifact-changed'`; task order from the earliest `gate-outcomes` spawn per task target;
files per task from `filesEdited` on that task's implementer spawns (357 of 429 spawns carry it, 2,908
file entries). Git was not usable as the primary source - 11 okven branches were squash-merged and their
`lastCommit` resolves into a `refs/review/<branch>` delta-review snapshot chain.

|                                                                           | n                      |
| ------------------------------------------------------------------------- | ---------------------- |
| reviewer findings that changed code                                       | 270                    |
| analysable (task in order, file extractable, a later task with file data) | **175** in **14 runs** |
| named a file a **later implementation task then edited**                  | **41 (23%)**           |
| same, bare-basename matches included (upper bound)                        | 68 (39%)               |

| run size            | runs | findings | hit | rate    |
| ------------------- | ---- | -------- | --- | ------- |
| small < 1,500 LOC   | 2    | 4        | 0   | **0%**  |
| medium 1,500-10,000 | 5    | 22       | 1   | **5%**  |
| large >= 10,000     | 7    | 149      | 40  | **27%** |

Per-run: mean 15.0%, median **0%**; 6 of 14 runs have at least one. 31 of the 41 hits come from one run
(`eric/attribution-3`, 71.7k LOC, 35 tasks).

| #   | verbatim (trimmed)                                                                                                                                                                                                                                                                                                                                                                               | source and the later task                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "**`loadBusiness` wipes an error `load()` just surfaced, and the two actions share one `loading` flag** - `hosting/stores/useAttributionDocumentsStore.ts:185-186, 207` vs `:168-169, 181` ... **Task 7.2 drives both from the same page** ... so picking a business after a failed `load()` clears the Error component REQ-STATE-6 requires to stay up ... No test covers either interleaving." | reviewer r1 on task 19 `06_02_documents_store.md`, `.../okven-worktrees-eric-attribution-3/bf648c37.../subagents/agent-a20bc8217ba73f092.jsonl`. Later task 21 `06_04_span_helpers.md` edited the same store, commit `49de9e386`. The finding itself names task 7.2 as the dependant. |
| 2   | "`hosting/composables/useCampaignSpendForm.ts:54-62` vs `functions/src/utils/callable/app/handleRecordCampaignSpend.ts:85-96` - the field validator still refuses only dates after today ... while the callable's ceiling moved to last night ... two messages about the same field disagree about whether today is allowed."                                                                    | reviewer r1 on task 15 `05_03_switch_host_to_v2.md`, `.../agent-ac817598696b347d7.jsonl`. Later task 26 `07_01_urls_menu_and_spend_pages.md` edited **both** files, commit `11dd0a2fe`.                                                                                               |
| 3   | "**Checklist rules 2 and 5 fail for the cross-file validation and sort** - `hosting/modules/content/index.ts` (`readPosts`): duplicate slug, duplicate `type+number`, and unresolved `related` slug rejection, plus the newest-first sort comparator, have no automated test anywhere ... Inverting the dedupe condition or the sort direction leaves `yarn test` green today"                   | reviewer r1 on task 3 `01_04_content_pipeline.md`, `.../-Users-eric-Code-ericvera-dev/4a02672f.../subagents/agent-a50430ef43308d4b2.jsonl`. Later tasks 12, 13 and 14 all edited the same file (`f5fa466e4`, `45500b935`).                                                            |

**Verdict: stands.** On small runs the cost of deferring review is measured at **0 of 4** and on medium at
**1 of 22**; both are exactly the buckets O10 moves to a whole-diff review. The large bucket's 27% is
one run's number, and per-task review stays on large runs under O10 anyway. Caveat that cuts against
the 23%: co-touch is not dependency, and the blind re-check found at least one "hit" whose text is a
reviewer _accepting a rebuttal_, not a finding.

## 8. Task-file detail (O8) and the plan-overview sections the draft cuts

Owner corrections traceable to a thin task file: **0**. The 16 unique friction lines that name the task
file as the cause are implementer self-reports of the form "a file the task did not list" - and O8 _keeps_
the Files list, so they do not defend a cut section.

What the cut sections are actually used for, counted by how many gate findings quote them:

| template section             | findings naming it | of those, changed something | of those, by a reviewer | draft/overlay verdict | earned?                                         |
| ---------------------------- | ------------------ | --------------------------- | ----------------------- | --------------------- | ----------------------------------------------- |
| Background                   | 32                 | 15                          | 6                       | cut (O8)              | yes                                             |
| Gotchas                      | 39                 | 23                          | 11                      | cut (draft M43 + O8)  | yes                                             |
| Guides list / required guide | 28                 | 15                          | 2                       | cut (O8)              | yes                                             |
| Implementation details       | 26                 | 19                          | 11                      | cut (O8)              | yes                                             |
| Requirements addressed       | 24                 | 9                           | 1                       | cut (draft M43)       | **no** - all 9 are Task-Index trace bookkeeping |
| Assumptions (plan/overview)  | 47                 | 23                          | 0                       | cut (draft M42)       | yes, but only for critics and acceptance        |
| Testing suggestions          | 14                 | 7                           | 4                       | cut (draft M43)       | yes                                             |
| Phase Rationale              | 4                  | 2                           | 0                       | cut (draft M42)       | thin, but see the example below                 |

| #                         | verbatim (trimmed)                                                                                                                                                                                                                                                           | source                                                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase Rationale + Gotchas | "The overview's own **Phase Rationale** asserts the opposite ("the repo-wide ignore files must land before anyone runs `yarn format`"), and Task 1.1's **Gotchas** even acknowledges "Task 1.3 keeps lint and prettier off it" without protecting itself."                   | `agent-aa957219f66c89fcb.jsonl`, critic-plan r5 - the two cut sections are the evidence for the corpus's one irreversible-harm catch                       |
| Testing suggestions       | "the task's Implementation detail 2 makes the duplicate checks required validation and its **Testing suggestions** call for each validation failure case to assert its thrown message. The progress log claims `index.ts` under the config's "would...""                     | `gate-findings.jsonl` `a50430ef43308d4b2#3`, **reviewer** r1, ericvera.dev - the Testing suggestions are the standard the reviewer held the commit to      |
| Guides list               | "`hosting/composables/useLabPage.ts:42` - the Lab snackbar uses a semicolon ... `docs/design/spanish-voice.md` is a **required guide for this task** and states "**No semicolons in customer-facing copy**""                                                                 | `gate-findings.jsonl` `ac817598696b347d7#1`, **reviewer** r1, `eric/attribution-3` - the Guides entry is what makes the rule enforceable against this diff |
| Background                | "**Task-spec miss - the 404 page has no title or meta description.** The task Goal says "Every public page has a descriptive title + meta description" (REQ-META-1) and the **Background's page list** explicitly includes the 404. `hosting/error.vue` sets no head at all" | `gate-findings.jsonl` `acaca1d73f4a12e2d#2`, **reviewer** r1, ericvera.dev - the Background's page list is the only place the 404 is enumerated            |

**Verdict: partly overturn.** `Requirements addressed` cuts cleanly (9 of 9 changed findings are index
bookkeeping, and the owner asked mise to stop using REQ- ids). `Phase Rationale` and `Assumptions` are
critic-only inputs and can go if the critic is told to reason about task ordering itself. But
**Guides, Gotchas, Implementation details, Background and Testing suggestions are read by the
reviewer** (11, 11, 11, 4 reviewer findings respectively): cutting them removes the standard the reviewer
holds the commit to, not just words from a template. A 12-line task file leaves the reviewer with the
task goal and a file list.

## 9. Irreversible harm

Corpus sweep of `friction.jsonl` (1,650 lines) and `gate-findings.jsonl` (2,344 findings) for destructive
git, data loss, format-over-protected-files, and merging in-flight state. **One** concrete incident is
guarded by something either document cuts.

| what                                                                                                                                        | verbatim                                                                                                                                                                                                                                                         | cut by                                                                         | status                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `prettier --write .` would have reflowed the client's approved mock and the whole preserved six-round design archive on the very first task | "so the first task destroys the approved mock and the archive (REQ-SITE-12) ... `npx prettier --list-different .` reports **75 files** today, including `.mise/mocks.html`, `sites/originhypnosis/docs/design/mocks/index.html` and the whole six-round archive" | **O4 (cap 2) and the draft (cap 3)** - the catch is at critic-plan **round 5** | Harm averted: the run's squashed commit metaforico `5d51972` ships `.prettierignore` with the critic's own reasoning in its comments |

Two near-misses that the _surviving_ channels caught, recorded so they are not attributed to a cut
mechanism: the prototype-pollution hole ("any such link silently destroys the visitor's real attribution
for the rest of the session", per-task reviewer on task `04_04`, `eric/attribution-3` `_friction.md`
`00d5d539e`) and "clearing `lastAssistantOutput` wholesale on re-entry would have wiped the order's items
on the customer's next message" (owner correction in flight, `feat/specials-fixes` `_friction.md`
`ba5d0e5b2`). Both channels survive in v3 (per-task reviewer on large runs; the goals gate).

Nothing else cut by either document guards an irreversible action. `M28` (no PR/merge with `.mise/` in
the tree), `M61` (cleanup before ship), `M27` (ship style), `M60` (retrospective never edits source),
`M49` (baseline gate) and `M07` (one piece of work per branch) are all **keep** in the draft and the
overlay is silent on them, so they stand.

**Verdict: O4's cap 2 and the draft's cap 3 both need one carve-out** - a round that returns a
`blocking` finding does not consume the cap. That is the only rule needed to preserve the one incident.

## Citation check

Every `R-*` id cited in `scorecard.md` and `summary.md` (12; `R-size` and `R-` in the grep are
false positives from "PR-size" and the literal `` `R-*` ``). Each was looked up in `../research/*.jsonl`,
its URL fetched live, and the `verified` field written back. 11 set true, 1 left false.

| id                        | url                                                   | quote found | claim supported | supports the scorecard sentence | verified  | failure                                                                                                                                                                                                                                |
| ------------------------- | ----------------------------------------------------- | ----------- | --------------- | ------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-anthropic-01            | anthropic.com/engineering/multi-agent-research-system | yes         | yes             | **partial**                     | true      | `scorecard.md:83` says "the one multi-agent shape with published measured gain"; the source supports the gain, not the exclusivity                                                                                                     |
| R-claude-code-platform-01 | code.claude.com/docs/en/plugins-reference#agents      | yes         | yes             | yes                             | true      | -                                                                                                                                                                                                                                      |
| R-claude-code-platform-04 | code.claude.com/docs/en/sub-agents#choose-a-model     | yes         | yes             | yes                             | true      | FORCE detail is on the page but outside the quote; needs v2.1.257+                                                                                                                                                                     |
| R-failure-modes-04        | arxiv.org/abs/2507.11538                              | yes         | yes             | yes                             | true      | IFScale stacks _distinct_ instructions; X1 is about restating one rule at many sites                                                                                                                                                   |
| R-failure-modes-08        | arxiv.org/abs/2606.22528                              | yes         | yes             | yes                             | true      | -                                                                                                                                                                                                                                      |
| R-failure-modes-09        | arxiv.org/abs/2505.06120                              | yes         | yes             | yes                             | true      | -                                                                                                                                                                                                                                      |
| R-failure-modes-16        | arxiv.org/html/2604.10508v1                           | yes         | yes             | yes                             | true      | execution-feedback self-repair on code benchmarks, not reviewer-driven fix rounds                                                                                                                                                      |
| R-failure-modes-27        | arxiv.org/html/2604.12147v2                           | yes         | yes             | yes                             | true      | a v3 exists (2026-08-07); the row cites v2                                                                                                                                                                                             |
| R-improvement-loop-03     | arxiv.org/html/2608.02639                             | yes         | yes             | yes                             | true      | Table 4 gives .200 for gpt-5-mini at stack=20 vs .201 in prose                                                                                                                                                                         |
| R-slop-enforcement-01     | arxiv.org/abs/2409.01382                              | yes         | yes             | **no**                          | true      | paper says "sole **universal** discriminator" and adds "its predictive magnitude varies drastically across models"; `scorecard.md:94` says "single **strongest** LLM-authorship signal"                                                |
| R-slop-enforcement-11     | code.claude.com/docs/en/best-practices                | yes         | yes             | yes                             | true      | -                                                                                                                                                                                                                                      |
| **R-slop-enforcement-29** | community.sonarsource.com/t/.../186866                | yes         | **no**          | **no**                          | **false** | The claim's "off by default" is nowhere in the thread (0 hits for "default" about the rule). `summary.md:69` cites it for "duplication is not lintable here"; the thread is about commented-out code and has 0 mentions of duplication |

Three scorecard sentences need rewording regardless of the `verified` flag: `summary.md:69`,
`scorecard.md:94`, `scorecard.md:83`. Files re-parse as JSONL with unchanged line counts (51 / 49 / 42 /
30 / 39); only the `verified` field of the 12 listed rows was touched.

## Gaps

| #   | gap                                                                                                                                                                                                 | effect                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `outcome='code-or-artifact-changed'` is inferred from token overlap at 52% script-vs-hand agreement (E-010 caveat). Git checking 9 of the 42 acceptance findings found **5 changed, 4 not changed** | The 42-row population is an upper bound. Items 2 and 7 inherit the same field and were not git-checked row by row                        |
| 2   | Item 2's split is extrapolated from 54 hand-read rows onto 357 changed findings                                                                                                                     | The ~247 / ~162 figures carry the sampling error of n=54; the population table in 2(a) does not                                          |
| 3   | Item 2's r6+ collapse is branch-specific: `feat/specials-fixes` (15/144) and `feat/tips` (3/67) supply most of it while `fix/menu-pin` holds 93%                                                    | A flat cap is the wrong instrument; a convergence rule fits the data better than any number                                              |
| 4   | Item 7's 23% is **file-level co-touch, not dependency**; 95 of 270 findings unusable; 31 of 41 hits come from one run                                                                               | The large-run 27% is one run's number. Whether a later task rested on the unfixed lines is not determinable from any field in the corpus |
| 5   | Item 4: `roundInBranch` conflates 63 end-of-plan spawns, 15 nested sanity-e2e runners and 3 baseline gates; 8 of 81 produced no report                                                              | E-024's "81 runs" overstates end-of-plan re-runs by ~18; 73 of 81 are classifiable                                                       |
| 6   | Item 5: 71 of 1,794 hunks judged; "who found it" traceable for only 6 of the 16 factual corrections                                                                                                 | The 1 unique catch is a floor on the traceable subset, not a census                                                                      |
| 7   | Item 6: class counting is lexical over `delta-notes.jsonl` (546 of 555 rows are okven) and post-adoption windows for the 2026-09-12 rules are 7 days                                                | "0 after" is weak for the late adoptions; no signal outside okven                                                                        |
| 8   | Whether the owner's 57 acceptance flags are independent of the verdict list is settled only by **timing** (11 of 12 branches: owner turn follows the gate), not by content                          | A flag the owner would have raised anyway is indistinguishable from one the verdict list prompted                                        |
| 9   | 11 okven branches were squash-merged and their refs deleted; several `lastCommit` values resolve into `refs/review/<branch>` delta-review snapshot chains                                           | `git log --name-only` is not a usable task->file source across the corpus; `filesEdited` on implementer spawns was used instead          |
