# v3 scorecard summary

Numbers from `evidence.jsonl` (`E-###`). `R-*` = unverified desk research, supporting only.

## (a) Verdicts and prose

| verdict | n   | verdict        | n   |     | bucket                            | now                             | after           |
| ------- | --- | -------------- | --- | --- | --------------------------------- | ------------------------------- | --------------- |
| shrink  | 34  | size-gate      | 2   |     | shipped prose `skills/next/**.md` | 743 distinct (761 by mechanism) | ~350 (**-54%**) |
| keep    | 19  | move-to-lint   | 1   |     | repo docs + config                | 206                             | ~77 (-63%)      |
| cut     | 7   | move-to-script | 1   |     | `state.ts`                        | 454 code                        | ~300 (-34%)     |
| cap     | 3   | merge-into     | 1   |     |                                   |                                 |                 |

Cut outright: `M02` dispatcher checklist, `M15` state-machine doc, `M19` checklist-answering machinery,
`M23` Models config, `M26` retrospective off-switch, `M29` two-pass mode, `M52` per-task documenter.
Seven subagent roles become five: documenter gone, explore size-gated to large work.

## (b) Effect on a run

**Median run today** (n=28, E-001): 37.5 spawns / 818k output tokens / 5.38 active h / 3.2 h capped wait / 13 owner turns.

Output tokens = role share (E-002) x the verdict's measured reduction:

| role                         | share | change                                                  | basis        | delta      |
| ---------------------------- | ----- | ------------------------------------------------------- | ------------ | ---------- |
| documenter                   | 4.9%  | cut (M52)                                               | E-026        | -4.9       |
| critic                       | 9.4%  | cap 3 rounds removes r4+, ~59% of critic tokens         | E-012, E-013 | -5.5       |
| acceptance                   | 3.1%  | cap 1 round removes r2+ = 74% of acceptance tokens      | E-022        | -2.3       |
| other (delegated e2e/sanity) | 9.9%  | end-of-plan cap removes r2+ = 97% of its 1.6% of output | E-023, E-024 | -1.5       |
| reviewer                     | 9.1%  | -10% (checklist re-answer and prose review gone)        | E-018, E-036 | -0.9       |
| retrospective                | 0.8%  | -40% (routing taxonomy gone)                            | E-031, E-033 | -0.3       |
| driver                       | 23.9% | -25% (fewer dispatches, 54% less prose to re-read)      | E-005, E-056 | -6.0       |
| implementer + fix            | 38.9% | unchanged - this is the work                            | E-002        | 0          |
|                              |       |                                                         | **total**    | **-21.4%** |

- **Output:** 818k x 0.786 = **~643k**.
- **Spawns:** per-role medians (E-001, summing to 31.0, not the 37.5 run median) - documenter 2.0->0, critic 4.5->2.7 (cap 3 against means of 5.7 and 4.5, E-014), acceptance 1.5->1.0, other 6.0->4.0. 31.0 -> 24.7 = **-20%, ~30 spawns**.
- **Active:** measured gates are 110.2 agent-h of the corpus's 387.3 active h (E-010/011/018/021/023/026). Cut = documenter 15.7 + 0.59x23.9 (14.1) + 0.74x9.8 (7.3) + 0.97x27.6 (26.8) = 63.9 agent-h = 16.5% of active; with the driver cut, **5.38 h -> ~4.3 h (-20%)**.
- **Owner stops:** 13 -> **~10** (critic stall stop fired in 17 of 60 gate pairs, ~0.6/run, E-015; acceptance r2+, E-022; `?` and backlog prompts).
- **Wait:** acceptance is 34.7% of all wait (E-006); removing 74% gives 3.2 x (1 - 0.74x0.347) = **~2.4 h**.

**Small run today** (<=400 LOC, n=7, E-007): 11 spawns / 228k output / 1.62 active h / 14.9 wall h / 8 owner turns / 458 artifact lines.

| change                                   | basis                              | spawns | output           | active min     |
| ---------------------------------------- | ---------------------------------- | ------ | ---------------- | -------------- |
| baseline (stage medians, E-079)          |                                    | 11     | 228k             | 74.5           |
| requirements size-gated out (M36)        | E-069, E-079                       | 0      | -15.4k           | -3.4           |
| documenter cut (M52)                     | E-079 small-run median 12.2k       | -1     | -12.2k           | -4             |
| acceptance subagent size-gated out (M57) | E-069: 0 changes on <=60 LOC       | -1     | -17.5k           | -6.3           |
| plan template halved (M42, M43)          | E-079 plan median 54.2k / 18.2 min | 0      | -15k             | -9.1           |
| retrospective shrunk (M59)               | E-031                              | 0      | -5k              | -0.5           |
| **after**                                |                                    | **~9** | **~163k (-29%)** | **~51 (-32%)** |

Owner stops on a small run: **8 -> 1** (the initial description) - `decisions.md` runs small work with no
human stop, and 55.2% of the owner's fixes already happen in Delta afterwards (E-054). Artifact lines
458 -> **~200** (requirements, exploration notes and checklist bullets gone).

## (c) Escape categories and the v3 channel meant to catch them

| category (n notes)                                                   | v3 channel                                                                                                                                                                                                                                                | does evidence say it works?                                                                                                                                                                                                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| test-style T1a/T1b/T1c/T1d, T5, T7 (48)                              | **project lint**: `no-restricted-syntax` on drilling inside `expect()`, on `mock.calls` indexing, on an undefined inline snapshot, on `toMatchSnapshot`/`toMatchFileSnapshot`; `vi.mock` factory or internal path; a path-scoped block on atom test files | Probe-measured, not outcome-measured: 2,649 hits over 300 of 756 files (E-043). Hits are not defects, so the drilling rule ships as `warn` plus a ratchet. The one before/after that exists (3.4 -> 1.1 per kloc) is confounded by branch composition. |
| test-style T2, T4, T9, T10 (45)                                      | per-task reviewer (M53)                                                                                                                                                                                                                                   | **No.** 115 test-style notes reached the owner on 5 runs, 50 with a rule already in place (E-041), every one after a reviewer passed the code (E-039).                                                                                                 |
| test-style T3, T8, T11, T12 (40)                                     | **nothing**                                                                                                                                                                                                                                               | No rule existed at note time for T3/T8/T11 (E-042) and none is lintable (E-043). Plainly uncaught in v3.                                                                                                                                               |
| comment/doc D1 punctuation, D4 length, D7 operator copy (11)         | **project lint**: a ~20-line local rule over `sourceCode.getAllComments()`                                                                                                                                                                                | Not yet run. The selectors were written but never executed (E-044). Untested channel.                                                                                                                                                                  |
| comment/doc D2 jargon, D3 stale, D5 missing why, D6 history-log (22) | implementer prose + reviewer                                                                                                                                                                                                                              | **No.** Checklist rule 15 and doc-style rules 10 and 15 existed, were answered pass by four roles, and the owner still flagged them on three runs (E-035, E-036). Cutting the documenter removes the volume source (E-027) but nothing detects these.  |
| naming / vocabulary (50)                                             | **nothing**                                                                                                                                                                                                                                               | 45% already had a rule and it did not hold (E-041); a banned-word list is reactive by construction (E-044). Plainly uncaught in v3.                                                                                                                    |
| convention violations (71)                                           | project lint where expressible, reviewer otherwise                                                                                                                                                                                                        | Partly. 38% already had a rule (E-041); okven's only lint-backed convention rule is `no describe()` (E-045).                                                                                                                                           |
| dead / duplicate code (37)                                           | checklist rule 1 to lint (`no-console`, `no-debugger`); reviewer for duplication                                                                                                                                                                          | **Weak.** 46% already had a rule (E-041); duplication is not lintable here (R-slop-enforcement-29, supporting).                                                                                                                                        |
| visual / mock iteration (45 notes, 67 of 190 corrections)            | mock stage (M33) plus the goals gate (M35)                                                                                                                                                                                                                | **No catch evidence**, but 44 of the 67 corrections already land in goals, before code exists (E-052). 0 of 44 ui-visual notes had a rule (E-041). The mock is containment, not detection.                                                             |
| wrong behaviour (64)                                                 | reviewer (M53), critic-on-plan (M47), acceptance (M57)                                                                                                                                                                                                    | **Yes, partly.** 6 of the 10 hand-verified best catches are reviewer r1 and 2 are critic-plan (E-020); 173 reviewer and 248 critic-plan findings changed something (E-011, E-018). Still 64 escaped, 63 with no rule to break (E-041).                 |

Three categories have no v3 channel at all - **test-style T3/T8/T11/T12, naming/vocabulary, and the
non-lintable comment defects D2/D3/D5/D6** - together about 112 of 537 notes (21%).

## (d) The ten least certain verdicts

| #   | verdict                                             | what would settle it                                                                                                                                                                       |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `M36` requirements size-gated above ~2000 LOC       | Threshold rests on 2 medium-bucket critic runs against 53 large ones (E-069). Ledger: size at entry, and acceptance not-verified items split by whether requirements ran.                  |
| 2   | `M65` cut the never-ask-past-goals rule             | Removing it may add stops. Ledger: questions asked after the goals gate and whether each changed the artifact.                                                                             |
| 3   | `M52` cut the documenter                            | Its catch side is 0 by construction, so "caught nothing" is not a measurement. Ledger: comment/doc notes per run vs the 2.1.0 baseline, plus comment:code on implementer commits.          |
| 4   | `M38` cap at exactly 3 rounds                       | The r3-5 bucket cannot be split (E-012 caveat), so 3 is interpolated from r1, r2 and r6+. Ledger: per-round blocking counts and which round produced each change.                          |
| 5   | `M13` cut the mismatch cascade from `state.ts`      | No run evidence either way; no firing is recorded anywhere. Ledger: reopened stages per run and what each reopen invalidated.                                                              |
| 6   | `M33` shrink the mock template                      | Mock runs in 10 of 28 runs at median 0 artifact lines (E-078) yet owns the largest correction class (E-052). Ledger: visual corrections split by before/after code existed.                |
| 7   | `M18` move the checklist to lint                    | The one measured rule effect is confounded by branch composition (`okven-offenses` section C). Ledger: notes per category after each lint rule ships, dated.                               |
| 8   | `M57` acceptance capped at 1, skipped on small work | The owner's 57 flags are raised off its verdict list (E-046); removing the subagent may remove his prompt. Ledger: items flagged at acceptance and whether the verdict list surfaced them. |
| 9   | `M41` explore size-gated                            | Median usage is already 0 (E-061), so the gate may be a no-op - or the 6-agent runs are exactly where it mattered. Ledger: explore spawns and whether the plan cited what they found.      |
| 10  | `M59` shrink the retrospective's routing taxonomy   | 53 of 159 proposals were adopted (E-031) but adoption is a `git log -S` proxy. Ledger: proposals, adoptions, and whether the defect class recurred.                                        |

## (e) What the per-run ledger must record

Written **during** the run: transcripts expire in 30 days (E-067) and `decisions.md` allows a passive
ledger and a retro only. Reshape `.mise/_friction.md` (`M62`) into it - it already names the catcher of
every defect and supplied E-015, E-016, E-046, E-074 and E-077.

| field                                                                                    | shape     | add-back triggers it serves                                      |
| ---------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| `runId`, `repo`, `branch`, `route`, `miseVersion`                                        | string    | all                                                              |
| `sizeAtEntry` (LOC bucket), `sizeFinal`                                                  | enum, int | M09, M36, M41, M57                                               |
| `tasks`, `filesPerTask`                                                                  | int, list | M43, M44                                                         |
| `spawns[]` = role, stage, round, model, outputTokens, minutes, verdict                   | list      | M38, M41, M47, M52, M53, M55, M57, M59                           |
| `gateRounds[]` = gate, round, blockingCount, changedArtifact                             | list      | M38, M47, M55, M57                                               |
| `findings[]` = gate, round, category, changedSomething                                   | list      | M38, M39, M47, M53, M57                                          |
| `ownerStops[]` = stage, reason, waitMinutes, answerChars                                 | list      | M08, M32, M34, M35, M58, M64, M65                                |
| `ownerCorrections[]` = verbatim, stage, lastRole, category                               | list      | M32, M52, M59, M65, X1                                           |
| `terminalStops[]` = rule, stage                                                          | list      | M12, M49, M51                                                    |
| `qualityCommands[]` = kind, seconds, pass, repeatedWithNoEdit                            | list      | M17, M46, M55                                                    |
| `stateEvents[]` = command, reopenedStages, error                                         | list      | M05, M07, M13, M14                                               |
| `ruleBreaks[]` = ruleId, file, statedIn (own-file / other-file)                          | list      | X1, M18, M22                                                     |
| `commitStats[]` = sha, role, codeLines, commentLines, mdLines                            | list      | M52, M63                                                         |
| `artifactLines` per artifact, at close-out                                               | map       | M33, M36, M41, M42, M43, M63                                     |
| `reviewNotes[]` (post-run, from Delta) = category, ruleExisted, ruleId, gateThatPassedIt | list      | **the success metric** - M18, M52, M53, M57 and every row of (c) |
| `retroProposals[]` = target, adopted                                                     | list      | M59, M60                                                         |

Two fields carry most of the weight and neither exists today: `findings[].changedSomething`, inferred
today from token overlap at 52% script-vs-hand agreement (E-010 caveat), and
`reviewNotes[].gateThatPassedIt`, which cannot be reconstructed at all - the notes store carries no
stage or role and task files are deleted at close-out (E-039 caveat).
