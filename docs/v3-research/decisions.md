# v3 decisions

Owner decisions, 2026-09-19. All earlier mise assumptions are open to challenge.

| #                | Decision                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Packaging        | Branch `v3` of this plugin, not a separate plugin.                                                                                                                                          |
| Cut policy       | Cut by default. Keep only what run evidence supports, plus guards against irreversible harm. Add back after a few runs if the data asks for it.                                             |
| Evidence sources | Git history, `.mise/` artifacts in history, session transcripts, Delta Review notes.                                                                                                        |
| Projects         | Deep: okven. Git + transcripts: delta-review, firebase-kit, metaforico, aydy, mise-claude-plugin. Git only: knownhumans, ericvera.dev, unocss-preset-strict-design, scdate, originhypnosis. |
| Enforcement      | Prose in skill files, plus lint rules in the target project. v3 ships no check scripts or hooks of its own.                                                                                 |
| Small work       | Sized at entry. Small work runs with no human stop; the owner reviews the diff in Delta afterwards.                                                                                         |
| Success metric   | Owner review notes per run (defects that escaped), and time.                                                                                                                                |
| Models           | Fable: the driver, one end-of-run check inside the driver, prose (under test against Okven data). Everything else, gates included, runs as Opus subagents.                                  |
| Okven skills     | Inventory only. Trims are proposed as a separate Okven change.                                                                                                                              |
| Improvement loop | Passive: a per-run metrics ledger and a retro that reads it. No replay evals.                                                                                                               |
| Checkpoint       | Owner reviews the keep/cut scorecard before anything is built.                                                                                                                              |

## 2026-09-22: build approved

All twelve review-page recommendations accepted, plus: the owner drafts nothing (I draft the Okven adherence example files from Delta notes); the skill keeps the name `/mise:next`.

| #   | Decision                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Build v3 to the overlay as amended by the defence (scorecard/driver-overlay.md).                                                                      |
| 2   | One flow at every size; each step carries a skip condition answered at entry and after any amendment. Owner can force "quick" or "full".              |
| 3   | Per-project files of the owner's verbatim past notes replace checklist prose for the adherence pass.                                                  |
| 4   | Okven lint rules drafted alongside the build, as a separate Okven change, shipped as warnings with a ratchet.                                         |
| 5   | The implementer writes comments: none by default, only a non-obvious why, within the project's doc-style caps.                                        |
| 6   | Raise session-log retention in the owner's user config.                                                                                               |
| 7   | Run log under `.mise/` during the run, copied at close-out to a per-project location that survives cleanup.                                           |
| 8   | Parallel critics not in v3.0; serial loop with the new stop rule, rounds logged.                                                                      |
| 9   | Late owner decisions become dated amendments to the spec; no reset, no re-approval, no critic on them.                                                |
| 10  | Review is a stage, open until the owner closes it; the full gate runs once afterwards.                                                                |
| 11  | Change protocol applies to mise, project rule files and this repo.                                                                                    |
| 12  | Adherence pass: lint, then a fresh-context agent per rule family over the diff file by file with a per-file log, then a glossary check for new terms. |
| 13  | Every run stops once before implementation: a ≤3-line issue/approach statement, approved explicitly (supersedes the no-stop small path).              |
| 14  | The mise directory is always `.mise/`: no config value, no placeholder, no setup question.                                                            |
| 15  | Run ledgers are always archived to `.claude/mise-ledger/`: no config value.                                                                           |
| 16  | Branches are always `feat/<slug>` for features and `fix/<slug>` for bug fixes: no config value, no setup question.                                    |
| 17  | Ship defaults to `pr`; the config line is written only for `merge (<style>)` or `off`.                                                                |
| 18  | No Task tests slot: the implementer runs `Unit tests`, scoped to its files where the runner takes a path.                                             |
| 19  | No Build slot: a project that needs a build lists it under `Check`, which the gate runs.                                                              |
| 20  | No Mock guidance: the mock is built from the repo's own code and `CLAUDE.md`.                                                                         |
| 21  | No Review notes config: the review step reads the branch's Delta Review notes through the `delta:review-notes` skill where it is installed.           |
| 22  | No Backlog config: `/mise:next` with no description and nothing in flight asks what to work on.                                                       |
| 23  | Setup infers Format, Check and Unit tests from the repo and asks two questions: confirm them, and how to ship.                                        |
| 24  | No `explore` role: the driver reads the code itself in the spec step.                                                                                 |
| 25  | `mark <step> skipped` takes no reason; the state file stores the value and the ledger's `skip` event carries the reason.                              |
| 26  | The ledger's `feedback` event stores `issue` — one line naming the defect or changed decision — not the owner's words verbatim.                       |
| 27  | No `requirements.md`: the spec's task index and the task files carry the behavior the critic checks the goals against.                                |
| 28  | No `Test exceptions` config: the task file's **Verification** states how a task is verified, and the spec writer names any substitute check there.    |
| 29  | No sweep step or role: the retirements grep and the stale instruction/config check are two bullets of the reviewer's mandate over the whole diff.     |
| 30  | No `Ship` config: close always pushes and opens a pull request.                                                                                      |
| 31  | No `Format` quality command: a project that wants formatting lists it under `Check`.                                                                 |
| 32  | No mock iteration loop: the mock is presented at the goals approval and revised through that approval's feedback.                                    |
| 33  | No `progress.md`: the implementer's commit message carries key changes and deviations, and `review.md` is written from the task files and `git log`.  |
| 34  | Review runs once over the whole diff after the last task, in batches: no per-task review, no 3-modules rule.                                          |
| 35  | No `stuck` retry: an implementer failure of either kind stops the run and is relayed.                                                                |
| 36  | The ledger's event fields live in `state.ts`: one header line per event, and `log` rejects a call that misses or invents a field. flow.md names only the moments to log. |
| 37  | No loop-stop caveat on the critic: a round that returns a blocking finding is not a round that returned no new blocking finding.                      |
| 38  | No "Judge that yourself" on the spec skip: every skip condition is already the driver's own call.                                                     |
| 39  | The goals step carries no parts-skip clause: each numbered part states its own condition.                                                             |
| 40  | One implementer failure report — `Task failed: <what you tried, what stopped you>`; no stuck/blocked distinction, the driver stops and relays it.     |
