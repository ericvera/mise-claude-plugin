# Provenance of mise mechanisms

Source rows: `inventory/provenance.jsonl` (89 rows, 62 commits). Repo `/Users/eric/Code/mise-claude-plugin`, all refs, history 2026-03-16 .. 2026-09-12. Generated 2026-09-19.

## Version timeline

`skills/` counts cover `skills/` and the pre-plugin `.claude/skills/`, measured between consecutive version marks on `main`. md = instruction prose; code = `state.ts` + `state.test.ts`.

| version      | date       | theme                                                                                                                              | skills md +/- | skills code +/-                                                                | md total after (lines / words) |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ | ------------------------------ |
| (pre-plugin) | 2026-03-16 | Nine free-standing `.claude/skills/` workflow skills + `workflow-config.md` template (bc94c76); orchestrator `/next` added 0190e87 | +974/-0       | +0/-0                                                                          | 974 / 6939                     |
| 1.0.0        | 2026-07-13 | Nine skills collapse into one `mise:next` skill with stages/references/ + TypeScript state engine; architecture stage dropped      | +743/-974     | +871/-0                                                                        | 743 / 8298                     |
| 1.0.1        | 2026-07-14 | Forbid REQ-* traceability IDs in code; fix README install URL                                                                      | +2/-1         | +0/-0                                                                          | 744 / 8336                     |
| 1.1.0        | 2026-07-15 | Severity-tagged critic findings (blocking/minor/informative), progress-based stall with 5-round backstop, mock state coverage      | +9/-4         | +0/-0                                                                          | 749 / 8544                     |
| 1.2.0        | 2026-07-16 | Mock IDs, new-UI-concept audit against the user's mental model, New Concepts section                                               | +8/-3         | +0/-0                                                                          | 754 / 8644                     |
| 1.3.0        | 2026-07-17 | Required Branch convention; work branch created at start                                                                           | +9/-4         | +0/-0                                                                          | 759 / 8849                     |
| 1.4.0        | 2026-07-18 | Kaizen retrospective subagent at close-out + `_friction.md` log feeding it                                                         | +73/-8        | +0/-0                                                                          | 824 / 9977                     |
| 1.5.0        | 2026-07-23 | Ship step (pr                                                                                                                      | merge         | off), CLAUDE.md ship guard, acceptance recorded as a resumable `accepted` hash | +21/-7                         | +274/-7 | 838 / 10477 |
| 1.6.0        | 2026-07-28 | Optional `## Models` config section mapping subagent roles to models (feature 9a8634f; bump 28b1acd)                               | +21/-9        | +0/-0                                                                          | 850 / 10826                    |
| 1.7.0        | 2026-08-14 | Critic stall rule replaced: fresh/recurring convergence tracking, 5-per-version / 8-absolute round budgets                         | +17/-2        | +0/-0                                                                          | 865 / 11267                    |
| 2.0.0        | 2026-08-19 | Project review checklist + documenter role + end-of-plan gate + role files; six instruction files halved                           | +563/-455     | +0/-0                                                                          | 973 / 9795                     |
| 2.1.0        | 2026-09-12 | Per-task documenter, checklist answers move to commit bodies, reviewer verifies instead of re-deriving                             | +63/-43       | +0/-0                                                                          | 993 / 9974                     |

Pre-plugin era (2026-03-16 .. 2026-07-12, 31 `main` commits before `50c377e`) is the `(pre-plugin)` row's cumulative total, not one commit.

## Added in response to a named real failure

24 of 89 rows. `failure` is verbatim from the commit message, the file's own text, or a `.mise/` goals/friction artifact (cited in the jsonl row).

| date       | ver   | sha       | mechanism                                                                                                     | chg      | the named failure                                                                                                                                                                                  |
| ---------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-25 | -     | `c4835cd` | `.claude/skills/execute-implementation-plan/implement_task.md` - CRITICAL: Triage failures before fixing them | reworked | implement_task.md previously declared "ALL failures are your responsibility" with no escape hatch, which caused scope creep on long autonomous runs (the agent would chase unrelated, pre-exis ... |
| 2026-05-14 | -     | `972e826` | `.claude/skills/execute-implementation-plan/implement_task.md` - CRITICAL: No pre-existing failures           | removed  | The triage escape hatch let the agent declare too many failures as pre-existing, undermining the autonomous-run safety net.                                                                        |
| 2026-08-14 | 1.6.0 | `f7656c2` | `skills/next/references/interaction.md` - ### The critic gate - points 3 and 4                                | reworked | Points 3 and 4 ... now decide continuation by defect identity instead of blocking counts, which misfired whenever a round of all-new findings matched or exceeded the previous round's count e ... |
| 2026-08-14 | 1.7.0 | `cb905af` | `CLAUDE.md` - A user-visible change also bumps `version` in `.claude-plugin/plugin.json`                      | added    | Claude Code installs and updates the plugin by version, so a change that ships without a bump never reaches an installed user, and no test or quality gate catches it.                             |
| 2026-08-14 | 1.7.0 | `4e828af` | `skills/next/references/interaction.md` - ### The critic gate (requirements and plan stages)                  | reworked | I often run into the following case. I would like to improve the system so that this does not happen. The stop seems unnecessary. [.mise/goals.md 'Original report', branch feat/critic-stall- ... |
| 2026-08-18 | 1.7.0 | `387a764` | `skills/next/references/config-reference.md` - Checklist: / Task tests: / Review notes                        | added    | A project file of **checkable rules** ... owned by the project and registered in `.claude/mise-config.md` as a required value; the config gate blocks execution without it [.mise/goals.md Goa ... |
| 2026-08-18 | 1.7.0 | `c83ca3a` | `skills/next/roles/reviewer.md` - # Reviewer                                                                  | added    | a fresh-context reviewer must be told to flag only correctness/requirement gaps or it will always report something [.mise/goals.md, External guidance]                                             |
| 2026-08-18 | 1.7.0 | `f098fb0` | `skills/next/roles/retrospective.md` - Every correction yields a proposal                                     | reworked | The retrospective now treats every user correction as a proposal for that checklist ... so feedback you've given once becomes a rule the workflow enforces from then on. [.mise/goals.md Origi ... |
| 2026-08-18 | 1.7.0 | `33d9e93` | `skills/next/stages/execute.md` - ## End-of-plan gate                                                         | added    | **Per task**: implement ... -> scoped verification (format + check + the task's tests via a new optional config value `Task tests:` ...) ... **Once at the end of the plan**: documenter pass ...  |
| 2026-08-18 | 1.7.0 | `401d676` | `skills/next/stages/plan.md` - Task-size guardrail                                                            | added    | Anthropic's PR-size data shows >1000-line diffs get findings 84% of the time vs 31% for <50 lines [.mise/goals.md, External guidance]; This replaces the "~2 hours of focused work" ceiling. [ ... |
| 2026-08-18 | 1.7.0 | `e259176` | `skills/next/SKILL.md` - `?` explain mode                                                                     | removed  | the `?` explain mode once [used] [.mise/goals.md, Other usage facts]; Behavior cuts and keeps decided at the gate: **cut** the `?` explain mode [Goal 2.4]                                         |
| 2026-08-19 | 2.0.0 | `58fed2b` | `skills/next/SKILL.md` - branch question                                                                      | reworked | correction: review notes on v2 files - ... branch question skipped for a new correctly named branch (fixed) [.mise/_friction.md @a6f5016~1]                                                        |
| 2026-08-19 | 2.0.0 | `6d50aa9` | `skills/next/references/interaction.md` - ## Recommendations                                                  | reworked | correction: review notes on v2 files - ... rec shortcut for recommendations (fixed) [.mise/_friction.md @a6f5016~1]                                                                                |
| 2026-08-19 | 2.0.0 | `278851b` | `skills/next/roles/` - <default> in the Docs: commit lookup                                                   | reworked | correction: "<default>... never its own history" read as commit-on-main - reworded at three sites (acceptance, execute, documenter) [.mise/_friction.md @a6f5016~1]                                |
| 2026-08-19 | 2.0.0 | `04a3681` | `skills/next/references/interaction.md` - ## Recommendations                                                  | reworked | correction: Recommend line should show the rec hint itself (fixed) [.mise/_friction.md @a6f5016~1]                                                                                                 |
| 2026-08-19 | 2.0.0 | `0d68a8a` | `skills/next/roles/retrospective.md` - checklist routing priority                                             | reworked | correction: checklist routing priority - documented-but-ignored or mechanical rules to the checklist, new conventions to durable docs first (fixed, option b) [.mise/_friction.md @a6f5016~1]      |
| 2026-08-19 | 2.0.0 | `4051f82` | `.claude/mise-config.md` - ## Review notes                                                                    | added    | Adopt retrospective learnings: reviewer term in Test exceptions, Review notes section                                                                                                              |
| 2026-09-12 | 2.0.0 | `133d2de` | `skills/next/stages/execute.md` - End-of-plan gate step 1 (documenter)                                        | removed  | `stages/execute.md` re-runs the gate from step 1 "after any commit lands past a finished gate (a repair, an acceptance-blocker fix)", and step 1 is the documenter. That is how attribution-3 ...  |
| 2026-09-12 | 2.0.0 | `133d2de` | `skills/next/roles/reviewer.md` - checklist verification                                                      | reworked | Okven's checklist is at 14 of the 15-rule cap ... All 14 are answered by the implementer (`roles/implementer.md` step 5), again by every fix implementer, and independently again by the revie ... |
| 2026-09-12 | 2.0.0 | `133d2de` | `skills/next/stages/execute.md` - documenter scope                                                            | reworked | `fix/menu-pin`, commit `45b0bad8c` - **61 files, 349 insertions, 100 deletions, of which 345 added and 100 removed are comment lines**. One subagent, one commit, a 61-file comment rewrite. [ ... |
| 2026-09-12 | 2.0.0 | `133d2de` | `skills/next/roles/implementer.md` - progress-log entry / Checklist bullet                                    | reworked | `eric/attribution-3`'s `_progress.md` reached **56,330 words / 68 entries** ... **46% of it is dead weight.** Of 56,330 words, **26,172 are the `- Checklist:` bullets** (65 of them) that 2.0 ... |
| 2026-09-12 | 2.0.0 | `be77bae` | `skills/next/stages/execute.md` - per-task defect router                                                      | reworked | task 01_01: review found the per-task defect router's bullets overlapping (single-pass mixed lists drop prose defects) and a malformed nested code span [.mise/_friction.md @5fabf88~1]            |
| 2026-09-12 | 2.0.0 | `5d765fe` | `skills/next/stages/execute.md` - two-pass mode contract                                                      | reworked | correction: instruction files must stay concise and targeted; task 01_01 grew the six files 3793 -> 4406 words (+16%), against the branch's own purpose since every subagent reads them [.mise ... |
| 2026-09-12 | 2.1.0 | `b13fa5c` | `skills/next/` - mise 2.1.0 squash                                                                            | reworked | Fixes the token and wall-clock regression 2.0.0 introduced, measured on two okven runs                                                                                                             |

## Added/changed with no stated reason

8 of 89 rows: nothing in the commit message, the file text, or any `.mise/` artifact says why.

| date       | ver   | sha       | mechanism                                                                       | chg      | what                                                                                      |
| ---------- | ----- | --------- | ------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| 2026-04-25 | -     | `823501d` | `.claude/workflow-config.md` - UI_CODE_ROOT                                     | added    | UI code root slot so mocks can read the real UI                                           |
| 2026-04-25 | -     | `aee7cd1` | `.claude/skills/` - argument-hint                                               | reworked | Standardize argument-hint syntax across all skills                                        |
| 2026-04-25 | -     | `d221a55` | `.claude/skills/extract-requirements-from-mock/SKILL.md` - conversation history | added    | Handle an empty conversation history                                                      |
| 2026-05-14 | -     | `642a30b` | `.claude/skills/execute-implementation-plan/implement_task.md` - step 4 wording | removed  | Revert step 4 verification wording to main's                                              |
| 2026-05-14 | -     | `80ffb3f` | `.claude/skills/setup-workflow/SKILL.md` - press enter to skip                  | reworked | Replace 'press enter to skip' with chat-friendly phrasing                                 |
| 2026-05-14 | -     | `c926cc3` | `.claude/skills/execute-implementation-plan/SKILL.md` - tasks: YAML block       | removed  | Revert the machine-readable tasks: YAML block added 19 days earlier                       |
| 2026-07-13 | 1.0.0 | `50c377e` | `skills/next/stages/` - architecture stage                                      | removed  | The write-architecture stage is dropped: README goes from 5 mentions of architecture to 0 |
| 2026-07-28 | 1.6.0 | `28b1acd` | `.claude-plugin/plugin.json` - version 1.6.0                                    | reworked | Version bump shipping the Models section (the feature commit did not bump)                |

Trigger mix over all 89 rows: named-failure-in-a-real-run 24, owner-preference 23, unknown 19, refactor 13, speculative 10.

## Reworked 3+ times (churn)

Mechanism identity = provenance anchor; count = distinct commits that introduced or reworked it (original + `laterChurn`). 4+ commits means reworked 3 or more times.

| commits | mechanism                                      | file(s)                                                                          | shas                                                        |
| ------- | ---------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 6       | mise-config.md interview                       | `skills/next/stages/setup.md`                                                    | `50c377e` `c9d5646` `50b5f2b` `9a8634f` `57655da` `b13fa5c` |
| 6       | the critic gate (requirements and plan stages) | `skills/next/references/interaction.md`                                          | `50c377e` `f374756` `58d4b1a` `4e828af` `57655da` `b13fa5c` |
| 5       | next (single mise:next command)                | `skills/next/SKILL.md`                                                           | `50c377e` `c9d5646` `58d4b1a` `50b5f2b` `57655da`           |
| 4       | acceptance pass, then cleanup                  | `skills/next/stages/execute.md`                                                  | `50c377e` `58d4b1a` `50b5f2b` `57655da`                     |
| 4       | checklist verification                         | `skills/next/roles/reviewer.md`                                                  | `133d2de` `be77bae` `5d765fe` `b13fa5c`                     |
| 4       | documenter scope                               | `skills/next/stages/execute.md`                                                  | `133d2de` `be77bae` `5d765fe` `b13fa5c`                     |
| 4       | extract requirements                           | `.claude/skills/extract-requirements-from-mock/SKILL.md`                         | `3b8eef8` `ffc5890` `a42137b` `d313ce6`                     |
| 4       | implementer                                    | `skills/next/roles/implementer.md`                                               | `dc1687b` `3d58711` `133d2de` `b13fa5c`                     |
| 4       | progress-log entry / checklist bullet          | `skills/next/roles/implementer.md`                                               | `133d2de` `be77bae` `5d765fe` `b13fa5c`                     |
| 4       | recommendations                                | `.claude/skills/_shared/interaction.md`, `skills/next/references/interaction.md` | `4bd508d` `50c377e` `6d50aa9` `04a3681`                     |
| 4       | shared interaction conventions                 | `.claude/skills/_shared/interaction.md`                                          | `44d2cd4` `4bd508d` `50c377e` `2527288`                     |

Independent check - distinct `main` commits per markdown section (`tools/section_churn.py` -> `inventory/_section_churn.jsonl`), top of `skills/`:

| commits | file                                                           | section                                        |
| ------- | -------------------------------------------------------------- | ---------------------------------------------- |
| 8       | `.claude/skills/execute-implementation-plan/implement_task.md` | Steps                                          |
| 6       | `skills/next/stages/setup.md`                                  | Interview                                      |
| 5       | `skills/next/references/interaction.md`                        | The critic gate (requirements and plan stages) |
| 5       | `skills/next/references/config-reference.md`                   | Section reference                              |
| 4       | `.claude/skills/extract-requirements-from-mock/SKILL.md`       | Steps                                          |
| 4       | `skills/next/references/config-reference.md`                   | Generated file shape                           |
| 4       | `skills/next/stages/execute.md`                                | Executing tasks                                |
| 3       | `.claude/skills/create-html-mock/SKILL.md`                     | (top)                                          |

## Date -> version in effect (for joining run dates)

Version as shipped on `main` (what `/plugin update` would install). A run dated inside a window used that version _if_ the user had updated; install timing is not recorded in this repo.

| from       | to         | version                             | landed by |
| ---------- | ---------- | ----------------------------------- | --------- |
| 2026-03-16 | 2026-07-12 | none (pre-plugin `.claude/skills/`) | `bc94c76` |
| 2026-07-13 | 2026-07-14 | 1.0.0                               | `50c377e` |
| 2026-07-14 | 2026-07-15 | 1.0.1                               | `d313ce6` |
| 2026-07-15 | 2026-07-16 | 1.1.0                               | `f374756` |
| 2026-07-16 | 2026-07-17 | 1.2.0                               | `a4e3846` |
| 2026-07-17 | 2026-07-18 | 1.3.0                               | `c9d5646` |
| 2026-07-18 | 2026-07-23 | 1.4.0                               | `58d4b1a` |
| 2026-07-23 | 2026-07-28 | 1.5.0                               | `50b5f2b` |
| 2026-07-28 | 2026-08-14 | 1.6.0                               | `28b1acd` |
| 2026-08-14 | 2026-08-19 | 1.7.0                               | `4e828af` |
| 2026-08-19 | 2026-09-12 | 2.0.0                               | `57655da` |
| 2026-09-12 | today      | 2.1.0                               | `b13fa5c` |

In-flight branches carry the new version before `main` does: `feat/critic-stall-heuristic` 2026-08-13..08-14 (1.7.0 at `b1c15ca`), `feat/next-major-improvements` 2026-08-18..08-19 (2.0.0 at `53896d7`), `fix/doc-churn-usage` 2026-09-12 (2.1.0 at `8d2d8ec`). Each was squashed onto `main` the same or next day, so the window above is off by at most one day.
