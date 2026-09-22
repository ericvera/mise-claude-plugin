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
