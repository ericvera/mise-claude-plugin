# mise self-reported friction and retrospective output

Source: `runs/friction.jsonl` (1650 rows; 52 are `Deviations from plan: none` with no item and are excluded from every table below). Built by `tools/harvest-mise-artifacts.py` (lines/subjects) + `tools/extract-retro-reports.mjs` + `tools/build-friction.py`; rendered by `tools/friction-report.py`.

## Every file ever added under `.mise/`, all refs, all 11 repos

2937 (path, run-chain) rows in `runs/mise-artifacts.jsonl`, each carrying the last version that survives before the run deleted the directory (`tools/harvest-mise-artifacts.py lastversions`). Every repo uses `.mise` as its mise directory. **No reviewer, critic or acceptance report is ever written to a file** — those roles report to the orchestrator (`roles/critic.md:20`, `roles/reviewer.md`, `roles/acceptance.md`), so their findings survive only as `_friction.md` lines, `_progress.md` sections, commit subjects, or transcripts.

| kind                 | (path, run) rows | repos | runs/branches | median lines in last version | max   |
| -------------------- | ---------------- | ----- | ------------- | ---------------------------- | ----- |
| task-file            | 1384             | 10    | 60            | 106.0                        | 429   |
| artifact             | 723              | 11    | 62            | 122                          | 3642  |
| other                | 288              | 5     | 6             | 230.0                        | 21435 |
| state                | 219              | 11    | 61            | 8                            | 10    |
| friction-log         | 145              | 10    | 51            | 23                           | 465   |
| progress-log         | 104              | 10    | 60            | 129.5                        | 6398  |
| exploration-notes    | 55               | 10    | 42            | 90                           | 624   |
| mock-review-feedback | 10               | 1     | 1             | 104.0                        | 140   |
| notes                | 4                | 1     | 1             | 8.0                          | 11    |
| upstream-feedback    | 3                | 1     | 1             | 157                          | 175   |
| checklist-archive    | 1                | 1     | 1             | 233                          | 233   |
| retrospective        | 1                | 1     | 1             | 24                           | 24    |

| file                          | rows | repos                                                                            |
| ----------------------------- | ---- | -------------------------------------------------------------------------------- |
| `.workflow-state`             | 219  | aydy, delta-review, ericvera.dev, firebase-kit, knownhumans, metaforico, mise-cl |
| `goals.md`                    | 205  | aydy, delta-review, ericvera.dev, firebase-kit, knownhumans, metaforico, mise-cl |
| `mocks.html`                  | 151  | aydy, delta-review, ericvera.dev, knownhumans, metaforico, okven, originhypnosis |
| `_friction.md`                | 145  | aydy, delta-review, ericvera.dev, firebase-kit, knownhumans, metaforico, mise-cl |
| `00_overview.md`              | 128  | aydy, delta-review, ericvera.dev, firebase-kit, knownhumans, metaforico, mise-cl |
| `mocks.context.md`            | 120  | aydy, delta-review, ericvera.dev, knownhumans, metaforico, okven, originhypnosis |
| `requirements.md`             | 119  | aydy, delta-review, ericvera.dev, firebase-kit, knownhumans, metaforico, mise-cl |
| `_progress.md`                | 102  | aydy, delta-review, ericvera.dev, firebase-kit, knownhumans, metaforico, mise-cl |
| `_exploration_notes.md`       | 54   | aydy, delta-review, ericvera.dev, firebase-kit, knownhumans, metaforico, mise-cl |
| `feedback.json`               | 10   | ericvera.dev                                                                     |
| `notes-execution.md`          | 4    | knownhumans                                                                      |
| `_upstream-feedback.md`       | 3    | okven                                                                            |
| `_exploration_notes_part2.md` | 1    | okven                                                                            |
| `_checklist_archive.md`       | 1    | okven                                                                            |

## Corpus

| source            | items | repos | runs |
| ----------------- | ----- | ----- | ---- |
| progress-log      | 729   | 10    | 54   |
| friction-log      | 611   | 10    | 51   |
| retro-report      | 163   | 5     | 21   |
| commit-subject    | 53    | 6     | 11   |
| upstream-feedback | 34    | 1     | 1    |
| retrospective     | 4     | 1     | 1    |
| notes             | 4     | 1     | 1    |

| type              | items |
| ----------------- | ----- |
| other             | 737   |
| friction          | 465   |
| retro-proposal    | 197   |
| gate-round-record | 148   |
| stall             | 51    |

| repo                        | items | from _friction.md | retro proposals | runs/branches |
| --------------------------- | ----- | ----------------- | --------------- | ------------- |
| okven                       | 1076  | 403               | 161             | 30            |
| delta-review                | 92    | 32                | 0               | 10            |
| knownhumans                 | 84    | 33                | 0               | 1             |
| aydy                        | 69    | 31                | 0               | 1             |
| mise-claude-plugin          | 67    | 30                | 7               | 4             |
| firebase-kit                | 63    | 35                | 10              | 4             |
| metaforico                  | 60    | 15                | 19              | 3             |
| ericvera.dev                | 50    | 15                | 0               | 1             |
| scdate                      | 21    | 8                 | 0               | 5             |
| unocss-preset-strict-design | 16    | 9                 | 0               | 2             |

## Items by category

| category            | all items | mise 2.x | mise 1.x | _friction.md only |
| ------------------- | --------- | -------- | -------- | ----------------- |
| slow                | 131       | 81       | 50       | 106               |
| redundant-work      | 97        | 55       | 42       | 22                |
| unclear-instruction | 169       | 106      | 63       | 32                |
| wrong-instruction   | 67        | 29       | 38       | 38                |
| tool-or-env         | 283       | 155      | 128      | 74                |
| false-positive-gate | 37        | 22       | 15       | 19                |
| missed-defect       | 133       | 105      | 28       | 95                |
| context-overload    | 7         | 2        | 5        | 2                 |
| other               | 674       | 379      | 295      | 276               |

n: all 1598, 2.x 934, 1.x 664, `_friction.md` 664.

## Items by implicated mechanism

| mechanism (as the text names it) | items | 2.x | 1.x | runs | top category      |
| -------------------------------- | ----- | --- | --- | ---- | ----------------- |
| task execution (plan deviation)  | 729   | 404 | 325 | 54   | other             |
| per-task reviewer                | 229   | 100 | 129 | 37   | other             |
| critic gate (requirements)       | 100   | 39  | 61  | 30   | slow              |
| critic gate (plan)               | 95    | 63  | 32  | 34   | slow              |
| acceptance pass (user flag)      | 70    | 62  | 8   | 21   | missed-defect     |
| user correction (in flight)      | 62    | 62  | 0   | 15   | other             |
| unknown                          | 50    | 13  | 37  | 13   | other             |
| project review checklist         | 45    | 43  | 2   | 18   | other             |
| project CLAUDE.md                | 37    | 35  | 2   | 12   | other             |
| mise config                      | 33    | 33  | 0   | 15   | tool-or-env       |
| critic gate                      | 20    | 2   | 18  | 6    | other             |
| acceptance pass                  | 19    | 15  | 4   | 13   | other             |
| goals stage                      | 17    | 11  | 6   | 15   | tool-or-env       |
| task execution                   | 16    | 8   | 8   | 9    | other             |
| end-of-plan gate                 | 13    | 12  | 1   | 10   | tool-or-env       |
| requirements stage               | 12    | 4   | 8   | 8    | tool-or-env       |
| implementer (task dispatch)      | 9     | 7   | 2   | 8    | tool-or-env       |
| documenter                       | 8     | 8   | 0   | 7    | other             |
| plan stage                       | 8     | 5   | 3   | 6    | tool-or-env       |
| mock stage                       | 5     | 3   | 2   | 4    | redundant-work    |
| retrospective role               | 4     | 0   | 4   | 2    | other             |
| baseline gate                    | 4     | 3   | 1   | 4    | tool-or-env       |
| critic gate (goals)              | 4     | 1   | 3   | 2    | other             |
| environment / tooling            | 2     | 0   | 2   | 2    | tool-or-env       |
| execute stage                    | 2     | 0   | 2   | 1    | tool-or-env       |
| end-of-plan gate (sanity/e2e)    | 2     | 0   | 2   | 2    | other             |
| plan-stage explore               | 1     | 0   | 1   | 1    | other             |
| state engine                     | 1     | 0   | 1   | 1    | tool-or-env       |
| critic gate stall rule           | 1     | 1   | 0   | 1    | wrong-instruction |

## Mechanism × category, `_friction.md` items only

| mechanism                   | slow | redundant-work | unclear-instruction | wrong-instruction | tool-or-env | false-positive-gate | missed-defect | context-overload | other |
| --------------------------- | ---- | -------------- | ------------------- | ----------------- | ----------- | ------------------- | ------------- | ---------------- | ----- |
| per-task reviewer           | 4    | 13             | 21                  | 23                | 26          | 1                   | 10            |                  | 126   |
| critic gate (requirements)  | 48   | 1              | 3                   | 8                 | 2           |                     | 1             | 2                | 35    |
| critic gate (plan)          | 52   |                | 1                   | 2                 | 11          |                     | 4             |                  | 25    |
| acceptance pass (user flag) |      |                |                     |                   |             | 1                   | 69            |                  |       |
| user correction (in flight) |      | 2              | 4                   | 1                 | 2           | 14                  | 11            |                  | 28    |
| unknown                     | 1    | 1              | 1                   |                   | 3           | 1                   |               |                  | 10    |
| task execution              | 1    |                | 1                   |                   | 4           |                     |               |                  | 10    |
| critic gate                 |      |                |                     |                   |             |                     |               |                  | 14    |
| end-of-plan gate            |      |                |                     |                   | 8           |                     |               |                  | 3     |
| goals stage                 |      | 2              |                     | 2                 | 3           |                     |               |                  | 3     |
| acceptance pass             |      |                |                     |                   |             |                     |               |                  | 9     |
| requirements stage          |      | 1              | 1                   | 1                 | 3           |                     |               |                  | 2     |
| baseline gate               |      | 1              |                     |                   | 3           |                     |               |                  |       |
| critic gate (goals)         |      |                |                     |                   | 1           |                     |               |                  | 3     |

## Gate rounds per gate per run, where recorded

63 (run, gate) pairs carry a record; 60 of them name a round count. Budget is 5 rounds per artifact version with a ceiling of 8 across resets (`skills/next/references/interaction.md:54`, 2.x; 1.4.0–1.7.0 wrote it as a 5-round backstop).

| rounds | (run, gate) pairs | %   | of which stalled |
| ------ | ----------------- | --- | ---------------- |
| 2      | 22                | 37  | 0                |
| 3      | 16                | 27  | 6                |
| 4      | 5                 | 8   | 2                |
| 5      | 6                 | 10  | 4                |
| 6      | 6                 | 10  | 6                |
| 7      | 3                 | 5   | 3                |
| 8      | 1                 | 2   | 1                |
| 12     | 1                 | 2   | 1                |

| gate                | (run, gate) pairs | with a round count | median rounds | max | stalled | rounds ≥5 (budget) | rounds ≥8 (ceiling) |
| ------------------- | ----------------- | ------------------ | ------------- | --- | ------- | ------------------ | ------------------- |
| critic plan         | 34                | 31                 | 3             | 7   | 10      | 7                  | 0                   |
| critic requirements | 29                | 29                 | 4             | 12  | 14      | 10                 | 2                   |

| stall trigger named              | records |
| -------------------------------- | ------- |
| unnamed                          | 17      |
| ping-pong                        | 4       |
| 1.x count rule (2 blocking)      | 3       |
| third sighting                   | 3       |
| 1.x count rule (4 blocking)      | 2       |
| 1.x count rule (5 blocking)      | 2       |
| budget exhausted                 | 2       |
| 1.x count rule (9 blocking)      | 1       |
| ping-pong; budget also exhausted | 1       |
| user-granted 3 rounds exhausted  | 1       |
| 1.x count rule (1 blocking)      | 1       |
| 1.x count rule (3 blocking)      | 1       |

Every (run, gate) pair with a recorded round count:

| repo                        | run                                      | gate                | rounds | blocking per round      | stalled | trigger                                                                                           | source       |
| --------------------------- | ---------------------------------------- | ------------------- | ------ | ----------------------- | ------- | ------------------------------------------------------------------------------------------------- | ------------ |
| aydy                        | feat/session-monitor                     | critic plan         | 6      |                         | yes     | unnamed                                                                                           | friction-log |
| aydy                        | feat/session-monitor                     | critic requirements | 6      |                         | yes     | 1.x count rule (2 blocking)                                                                       | friction-log |
| delta-review                | feat/extraction-provenance               | critic plan         | 2      | 2,0                     |         |                                                                                                   | friction-log |
| delta-review                | feat/extraction-provenance               | critic requirements | 2      | 2,0                     |         |                                                                                                   | friction-log |
| delta-review                | feat/moved-file-detection                | critic plan         | 3      | 2,2,0                   |         |                                                                                                   | friction-log |
| delta-review                | feat/moved-file-detection                | critic requirements | 7      | 7,3,1,1,2,1,0           | yes     | unnamed                                                                                           | friction-log |
| delta-review                | feat/review-feedback-batch               | critic requirements | 3      | 1,1,0                   | yes     | 1.x count rule (1 blocking);unnamed                                                               | friction-log |
| delta-review                | fix/comment-overflow-deleted-files       | critic plan         | 2      | 3,0                     |         |                                                                                                   | friction-log |
| delta-review                | fix/review-notes-wrap                    | critic plan         | 2      | 1,0                     |         |                                                                                                   | friction-log |
| delta-review                | fix/review-notes-wrap                    | critic requirements | 3      | 1,1,0                   | yes     | unnamed                                                                                           | friction-log |
| ericvera.dev                | feat/blog                                | critic plan         | 3      | 4,5,0                   | yes     | ping-pong;unnamed                                                                                 | friction-log |
| ericvera.dev                | feat/blog                                | critic requirements | 4      | 1,1,1,0                 |         |                                                                                                   | friction-log |
| firebase-kit                | feat/keepalive-caller                    | critic requirements | 2      | 1,0                     |         |                                                                                                   | friction-log |
| firebase-kit                | feat/publish-firebase-kit-packages       | critic plan         | 2      | 2,0                     |         |                                                                                                   | friction-log |
| firebase-kit                | feat/publish-firebase-kit-packages       | critic requirements | 4      |                         | yes     | 1.x count rule (3 blocking)                                                                       | friction-log |
| firebase-kit                | fix/get-doc-with-cache-store-reset-retry | critic plan         | 2      | 2,0                     |         |                                                                                                   | friction-log |
| firebase-kit                | fix/upgrade-npm-packages                 | critic plan         | 3      | 1,2,2                   | yes     | 1.x count rule (2 blocking)                                                                       | friction-log |
| knownhumans                 | eric/seed-from-okven                     | critic plan         | 2      | 1,0                     |         |                                                                                                   | friction-log |
| knownhumans                 | eric/seed-from-okven                     | critic requirements | 2      | 1,0                     |         |                                                                                                   | friction-log |
| metaforico                  | feat/originhypnosis-site                 | critic plan         | 5      | 3,2,1,1,1               |         |                                                                                                   | friction-log |
| metaforico                  | feat/originhypnosis-site                 | critic requirements | 5      | 2,1,1,1,0               | yes     | ping-pong                                                                                         | friction-log |
| mise-claude-plugin          | feat/critic-stall-heuristic              | critic requirements | 2      | 1,0                     |         |                                                                                                   | friction-log |
| mise-claude-plugin          | feat/next-major-improvements             | critic plan         | 3      | 3,1,0                   |         |                                                                                                   | friction-log |
| mise-claude-plugin          | feat/next-major-improvements             | critic requirements | 3      | 2,2,0                   |         |                                                                                                   | friction-log |
| mise-claude-plugin          | fix/doc-churn-usage                      | critic plan         | 6      | 6,1,3,2,1,1             | yes     | ping-pong;unnamed                                                                                 | friction-log |
| okven                       | backup/pre-rebase-2026-09-09             | critic requirements | 5      | 6,9,7,3,5               | yes     | 1.x count rule (5 blocking);1.x count rule (9 blocking);unnamed                                   | friction-log |
| okven                       | eric/attribution-2                       | critic requirements | 6      | 2,2,4                   | yes     | 1.x count rule (4 blocking)                                                                       | friction-log |
| okven                       | eric/attribution-3                       | critic plan         | 5      | 2,1,0                   | yes     | unnamed                                                                                           | friction-log |
| okven                       | eric/attribution-3                       | critic requirements | 8      | 2,3,2,3,2,1,0           | yes     | 1.x count rule (5 blocking);unnamed                                                               | friction-log |
| okven                       | eric/extract-firebase-callables          | critic plan         | 3      |                         | yes     | 1.x count rule (4 blocking);unnamed                                                               | friction-log |
| okven                       | eric/extract-firebase-callables          | critic requirements | 4      |                         | yes     | 1.x count rule (2 blocking);unnamed                                                               | friction-log |
| okven                       | eric/fab-snippet                         | critic plan         | 2      | 2,0                     |         |                                                                                                   | friction-log |
| okven                       | eric/fab-snippet                         | critic requirements | 3      | 4,3,0                   |         |                                                                                                   | friction-log |
| okven                       | eric/lo-de-siempre                       | critic plan         | 2      | 1,0                     |         |                                                                                                   | friction-log |
| okven                       | eric/playright-token-usage-fix           | critic plan         | 2      | 1,0                     |         |                                                                                                   | friction-log |
| okven                       | eric/playright-token-usage-fix           | critic requirements | 2      | 1,0                     |         |                                                                                                   | friction-log |
| okven                       | eric/restaurant-sales-deck               | critic requirements | 3      | 4,2,0                   |         |                                                                                                   | friction-log |
| okven                       | feat/close-out-orders                    | critic plan         | 2      | 1,0                     |         |                                                                                                   | friction-log |
| okven                       | feat/first-time-offer                    | critic requirements | 4      | 1,5,2,0                 |         |                                                                                                   | friction-log |
| okven                       | feat/migrate-firebase-kit                | critic plan         | 2      | 1,0                     |         |                                                                                                   | friction-log |
| okven                       | feat/remove-k-prop-migration             | critic requirements | 2      | 1,0                     |         |                                                                                                   | friction-log |
| okven                       | feat/specials-fixes                      | critic plan         | 6      | 1,3,1,1,1,0             | yes     | ping-pong;ping-pong; budget also exhausted;third sighting;unnamed;user-granted 3 rounds exhausted | friction-log |
| okven                       | feat/specials-fixes                      | critic requirements | 5      | 2,1,1,0                 | yes     | third sighting;unnamed                                                                            | friction-log |
| okven                       | feat/tips                                | critic plan         | 3      | 2,2,0                   |         |                                                                                                   | friction-log |
| okven                       | feat/tips                                | critic requirements | 12     | 3,2,2,3,2,2,2,2,3,3,2,1 | yes     | budget exhausted                                                                                  | friction-log |
| okven                       | feat/voice-notes                         | critic plan         | 3      | 1,2,0                   |         |                                                                                                   | friction-log |
| okven                       | feat/voice-notes                         | critic requirements | 3      | 6                       |         |                                                                                                   | friction-log |
| okven                       | fix/malformed-manifest                   | critic plan         | 2      | 1,0                     |         |                                                                                                   | friction-log |
| okven                       | fix/menu-pin                             | critic plan         | 7      | 3,1,1,2,1,1,0           | yes     | unnamed                                                                                           | friction-log |
| okven                       | fix/menu-pin                             | critic requirements | 6      | 3,3,3,1,2,0             | yes     | unnamed                                                                                           | friction-log |
| okven                       | fix/menu-preview-changes                 | critic plan         | 7      | 6,2,1,1,1,1,0           | yes     | budget exhausted;third sighting                                                                   | friction-log |
| okven                       | fix/menu-preview-changes                 | critic requirements | 5      | 0                       |         |                                                                                                   | friction-log |
| okven                       | fix/voice-note-not-transcribed           | critic plan         | 3      | 1,1,0                   |         |                                                                                                   | friction-log |
| scdate                      | feat/iso-week                            | critic plan         | 2      | 1,0                     |         |                                                                                                   | friction-log |
| scdate                      | feat/scdate-testing                      | critic plan         | 2      | 1,0                     |         |                                                                                                   | friction-log |
| scdate                      | feat/scdate-testing                      | critic requirements | 2      | 2,0                     |         |                                                                                                   | friction-log |
| unocss-preset-strict-design | feat/native-spacing-engine               | critic plan         | 3      | 2,1,0                   |         |                                                                                                   | friction-log |
| unocss-preset-strict-design | feat/native-spacing-engine               | critic requirements | 3      | 1,1,0                   | yes     | unnamed                                                                                           | friction-log |
| unocss-preset-strict-design | feat/upgrade-tailwind4                   | critic plan         | 2      | 2,0                     |         |                                                                                                   | friction-log |
| unocss-preset-strict-design | feat/upgrade-tailwind4                   | critic requirements | 4      | 1,3,1,0                 |         |                                                                                                   | friction-log |

## The other gates: rounds they leave in the friction log

The critic gate is the only loop that logs a round count. The end-of-plan gate (`stages/execute.md:76`, cap: a second failure stops the run), the per-task review (`stages/execute.md:58`, cap: one fix round) and the acceptance pass (`stages/execute.md:97`, no stated cap) leave one friction line per firing, so the line count per run is the round count.

| gate / loop                     | lines | runs that logged it | median lines per such run | max | runs with ≥2 | runs with ≥5 |
| ------------------------------- | ----- | ------------------- | ------------------------- | --- | ------------ | ------------ |
| end-of-plan gate (`gate:` line) | 13    | 10                  | 1.0                       | 3   | 2            | 0            |
| baseline gate                   | 4     | 4                   | 1.0                       | 1   | 0            | 0            |
| per-task review found defects   | 224   | 36                  | 3.5                       | 46  | 25           | 15           |
| acceptance: user flagged        | 70    | 21                  | 2                         | 12  | 14           | 6            |
| implementer blocked/stuck       | 3     | 3                   | 1                         | 1   | 0            | 0            |
| documenter stuck/blocked        | 2     | 2                   | 1.0                       | 1   | 0            | 0            |
| user correction in flight       | 62    | 15                  | 1                         | 33  | 7            | 2            |

## Retrospective proposals

| source                                                            | proposals | runs |
| ----------------------------------------------------------------- | --------- | ---- |
| parsed from a retrospective subagent's report (transcripts)       | 159       | 17   |
| items in `.mise/_upstream-feedback.md` / `retrospective_notes.md` | 38        | 2    |
| retrospective reports that yielded no parsable numbered proposal  | 0         |      |

| proposal kind (as the report labels it) | n   |
| --------------------------------------- | --- |
| guide edit                              | 38  |
| checklist edit                          | 37  |
| config edit                             | 21  |
| (none stated)                           | 13  |
| claude.md                               | 12  |
| durable doc                             | 4   |
| config edit, mock guidance              | 3   |
| report-only, for upstream               | 3   |
| config edit — `## test conventions`     | 2   |
| config edit, test exceptions            | 2   |

| adoption signal (target file at HEAD) | n   | %   |
| ------------------------------------- | --- | --- |
| not-found                             | 55  | 35  |
| partly-present                        | 40  | 25  |
| likely-adopted                        | 29  | 18  |
| adopted                               | 24  | 15  |
| undetermined                          | 11  | 7   |

`adopted` = the proposal's exact text is in the repo's history (`git log -S`). `likely-adopted` = ≥70% of the proposal's rare tokens are in its target file at HEAD; `partly-present` 40–70%; `not-found` <40%; `undetermined` = target file not resolvable. Adoption of a _project-guidance_ proposal is checked in that project's repo; plugin-candidate proposals are checked in the mise repo.

| plugin candidates (automated signal only — see the hand-check below) | n   |
| -------------------------------------------------------------------- | --- |
| plugin-candidate / upstream proposals                                | 46  |
| …whose exact text `git log -S` finds in the mise repo                | 0   |
| …with ≥70% rare-token presence in `skills/next/`                     | 0   |

### `.mise/_upstream-feedback.md`, hand-checked against the mise repo

One file, one run (okven `eric/attribution`, 2026-08-02, mise 1.6.0, blob `3e42c2c`, 175 lines). It is the only place in any repo where a run wrote mise-plugin proposals to disk.

| proposal                                                         | adopted in mise? | evidence                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Stall rule measures the wrong thing (carried-over vs new)     | adopted          | 1.7.0 `4e828af` "Replace count-based critic-gate stall rule with convergence tracking"; today `references/interaction.md:43-53` (recurring/fresh against all prior rounds, recurrence events, three triggers, "Counts never decide") |
| 2. Strict blocking definition, with two worked examples          | partly adopted   | the strict definition is in `roles/critic.md:20` (`57655da`, 2.0.0) as "a downstream stage would build the wrong behavior" plus "ignore cosmetic nits"; the two worked examples it asked for were never added                        |
| 3. A `needs-decision` tag for decisions with no default          | not adopted      | `git log --all -S"needs-decision" -- skills/` is empty; `roles/critic.md:20` still tags blocking \| minor \| informative                                                                                                             |
| 4. Codebase grounding in round 1                                 | partly adopted   | `roles/critic.md:13` (`57655da`, 2.0.0) makes unverified file references a plan-critic check; the requirements critic (`roles/critic.md:7`) is still artifact-vs-goals only                                                          |
| 5. Pre-dispatch self-consistency pass over the artifact          | not adopted      | `git log --all -S"consistency pass" -- skills/` is empty; no such step exists in `references/interaction.md`                                                                                                                         |
| 5b. Corrections tracked as prose + acceptance-criterion pairs    | not adopted      | no rule about an override's two landing places anywhere in `skills/`                                                                                                                                                                 |
| 6. One round = N critics with distinct lenses, in parallel       | not adopted      | `git log --all -S"lens" -- skills/` is empty; `references/interaction.md:31` still dispatches one critic per round                                                                                                                   |
| 7. A touchpoint map and a findings ledger carried between rounds | partly adopted   | no artifact exists (`-S"ledger"`, `-S"touchpoint"` both empty), but `references/interaction.md:43` makes the orchestrator classify each blocker against _all_ prior rounds, which is the ledger's purpose held in context            |
| 8. Critics must propose replacement text                         | not adopted      | `roles/critic.md:20` asks for a tagged defect list only; `-S"replacement text"` is empty                                                                                                                                             |

Adopted 1/9, partly 3/9, not adopted 5/9.

### Retrospective proposals repeated across runs

By target file the proposal names:

| target the proposal names                               | proposals | runs | repos | top adoption signal | adopted/likely |
| ------------------------------------------------------- | --------- | ---- | ----- | ------------------- | -------------- |
| .claude/mise-checklist.md                               | 22        | 10   | 3     | not-found           | 10             |
| .claude/mise-config.md                                  | 16        | 9    | 3     | not-found           | 3              |
| (none named)                                            | 11        | 7    | 2     | undetermined        | 0              |
| CLAUDE.md                                               | 13        | 7    | 2     | partly-present      | 6              |
| Plugin candidates                                       | 3         | 3    | 1     | not-found           | 0              |
| .claude/skills/ui-verify/SKILL.md                       | 5         | 3    | 1     | partly-present      | 2              |
| docs/design/naming.md                                   | 2         | 2    | 1     | likely-adopted      | 1              |
| functions/CLAUDE.md                                     | 4         | 2    | 1     | adopted             | 3              |
| .claude/skills/doc-style/SKILL.md                       | 2         | 2    | 1     | adopted             | 1              |
| docs/design/spanish-voice.md                            | 2         | 2    | 1     | likely-adopted      | 1              |
| /Users/eric/Code/firebase-kit/CLAUDE.md                 | 2         | 1    | 1     | partly-present      | 0              |
| /Users/eric/Code/firebase-kit/.claude/mise-checklist.md | 3         | 1    | 1     | partly-present      | 1              |
| /Users/eric/Code/firebase-kit/.claude/mise-config.md    | 1         | 1    | 1     | adopted             | 1              |
| /Users/eric/Code/metaforico/CLAUDE.md                   | 1         | 1    | 1     | not-found           | 0              |
| /Users/eric/Code/metaforico/.claude/mise-config.md      | 2         | 1    | 1     | not-found           | 1              |

Rare-token clusters at Jaccard ≥ 0.45: 159 clusters; spanning 3+ runs: 0; 2 runs: 0.

Rare-token clusters at Jaccard ≥ 0.25: 157 clusters; spanning 3+ runs: 0; 2 runs: 1.

## The 20 most repeated friction items

Clustered by rare-token Jaccard ≥ 0.45 over the 664 `_friction.md` / commit-subject items; count = items in the cluster, runs = distinct (repo, run) pairs it spans. Text is the cluster's longest member, verbatim.

| items | runs | repos | mechanism                   | category            | verbatim (longest member of the cluster)                                                                                                                                                                                                                             |
| ----- | ---- | ----- | --------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 27    | 11   | 6     | critic gate (requirements)  | slow                | critic requirements: stalled at 1 blocking after 2 rounds (round-1 fix introduced a new contradiction)                                                                                                                                                               |
| 20    | 19   | 8     | critic gate (requirements)  | slow                | critic requirements: 5 rounds, blocking 1, 1, 2, 2, 0                                                                                                                                                                                                                |
| 17    | 5    | 3     | critic gate (plan)          | other               | mise: revise requirements after critic round 4, log the recurrence                                                                                                                                                                                                   |
| 12    | 4    | 3     | critic gate                 | other               | mise: plan critic round 2 fixes                                                                                                                                                                                                                                      |
| 9     | 1    | 1     | user correction (in flight) | false-positive-gate | correction: files renamed by the vocabulary pass are declared as moved in the Delta Review clusters so the review shows text changes, not new files fix retroactive: review found the doc intro lost the antecedent of "the four", "sets" coined beside the store's  |
| 8     | 1    | 1     | user correction (in flight) | missed-defect       | correction: review notes are reviewed one batch per pass from here on, one reviewer over the batch's commits instead of one per note fix loadNames: review found the cross-case leak fixed in the wrong case (the leaking case never mocks a name, so a nameless bus |
| 7     | 5    | 3     | critic gate (plan)          | slow                | critic plan: 4 rounds, blocking 1 1 2 0 (user-directed rounds 6-9 after the budget stall)                                                                                                                                                                            |
| 5     | 1    | 1     | user correction (in flight) | false-positive-gate | correction: files renamed by the vocabulary pass are declared as moved in the Delta Review clusters so the review shows text changes, not new files fix retroactive: review found the doc intro lost the antecedent of "the four", "sets" coined beside the store's  |
| 3     | 2    | 1     | critic gate (requirements)  | other               | critic requirements: round 1's critic reviewed the artifacts only; from round 2 on, the prompt asked for codebase grounding and the findings changed class entirely (the live `RefSource` enum, the `/pagar` wa.me link matched by string equality, no URL contract  |
| 3     | 2    | 2     | user correction (in flight) | other               | critic plan: user approved the plan after round 6 without a further critic round (option 1)                                                                                                                                                                          |
| 2     | 2    | 1     | baseline gate               | tool-or-env         | baseline gate: hosting suite flaked on Nuxt setup hook timeouts under machine load (mds/spotlight, load ~48); green with yarn test --maxWorkers=4                                                                                                                    |
| 2     | 2    | 1     | critic gate (plan)          | slow                | critic plan: blocker recurred (incomplete test churn inventory, new sighting in resolveRepeatOrder.test.ts), sighting 2                                                                                                                                              |
| 2     | 2    | 1     | critic gate (plan)          | slow                | critic plan: stalled (ping-pong; budget also exhausted) after 5 rounds, blocking 1 3 3 3 3                                                                                                                                                                           |
| 2     | 2    | 1     | end-of-plan gate            | tool-or-env         | gate: documenter unavailable — the config assigns fable and that model hit its usage limit; re-dispatched on the session model                                                                                                                                       |
| 2     | 2    | 1     | critic gate (requirements)  | slow                | critic requirements: blocker recurred (READ-4 exclusive callable list incomplete), sighting 2                                                                                                                                                                        |
| 2     | 2    | 2     | per-task reviewer           | other               | task 01_01: review found commit subject used the role's Task prefix instead of the repo's conventional fix: prefix                                                                                                                                                   |
| 2     | 1    | 1     | critic gate (requirements)  | slow                | critic requirements: passed round 6 with 0 blocking (trend 2,2,4,2,1,0); total 6 rounds                                                                                                                                                                              |
| 2     | 1    | 1     | critic gate (plan)          | tool-or-env         | critic plan: ROOT CAUSE, and it rhymes with the requirements stage. Three of round 3's four blocking findings are the same defect class the two prior rounds also produced: what happens to a TEST file when its subject moves into a package (bare vi.mock losing i |
| 2     | 1    | 1     | critic gate (plan)          | other               | critic plan: hit the 5-round backstop. Counts 5 → 3 → 4 → 3 → 2. Round 5 confirmed the structural fix landed with zero residue — no task moves a test, no package gets a **mocks** directory, all six package-resident tests verified dependency-free against the re |
| 2     | 1    | 1     | project review checklist    | other               | critic plan (round 2, after scope change): 2 blocking then 0. Both blocking findings were the same mistake — I applied the four-document split to the "Files to modify" sections and left the instruction stale everywhere else in the same files, including checkli |

Clusters of ≥2 items: 28 of 525. Items in a cluster of 1 (never repeated): 497.
