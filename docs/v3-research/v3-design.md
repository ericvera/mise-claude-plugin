# mise v3 design

Binding spec for the build. Decisions: decisions.md (2026-09-22 table). Verdicts: scorecard/driver-overlay.md (O1–O15) over scorecard/scorecard.md. Evidence ids: scorecard/evidence.jsonl (E-nnn). Every non-glue line in a shipped skill file must map to an E-id, an O-id or a decision number in `docs/line-evidence.md`; a line that maps to nothing is cut.

## Principles

- Cut by default. Prose states each instruction once, in the file whose role acts on it (X1). Nothing the state script enforces is restated in prose (X2).
- The driver runs on the session model; every subagent is dispatched with `model: opus`. No Models config.
- What mise prints to the owner is capped: a status line per step, questions in the fixed format, never a recap. Owner's top process complaint was "output too long" (E-051 family).
- Every subagent gets a fresh context, a diff- or artifact-scoped mandate, and returns a short structured result. The driver keeps summaries only (M48).

## Files (line budgets are non-blank lines)

| file                                       | budget | holds                                                                                                                        |
| ------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| skills/next/SKILL.md                       | 50     | frontmatter, argument modes, load config, state engine protocol, dispatch table, question format, output cap, stopping rules |
| skills/next/flow.md                        | 100    | the ten steps with skip conditions, artifacts, amendments, review-stage feedback handling                                    |
| skills/next/stages/setup.md                | 20     | the setup interview                                                                                                          |
| skills/next/roles/implementer.md           | 20     |                                                                                                                              |
| skills/next/roles/reviewer.md              | 15     |                                                                                                                              |
| skills/next/roles/critic.md                | 15     |                                                                                                                              |
| skills/next/roles/adherence.md             | 15     |                                                                                                                              |
| skills/next/roles/sweep.md                 | 10     |                                                                                                                              |
| skills/next/roles/explore.md               | 8      |                                                                                                                              |
| skills/next/references/config-reference.md | 35     | generated config shape + section reference                                                                                   |
| skills/retro/SKILL.md                      | 30     | the change protocol, run over ledgers                                                                                        |
| total                                      | 318    | (v2: 743)                                                                                                                    |

Deleted: stages/goals.md, requirements.md, plan.md, execute.md (folded into flow.md); roles/documenter.md, acceptance.md, retrospective.md; references/interaction.md (folded into SKILL.md); docs/state-machine.md; docs/skill-authoring.md shrinks to 10 lines (M67). `.claude/mise-checklist.md` in this repo is deleted; `.claude/mise-config.md` is rewritten to the v3 shape.

## The flow (one, self-sizing)

Steps run in this order. Each has a skip condition the driver answers at start and again after every amendment; answers are recorded in the state (`mark <step> skipped <reason>`) and the ledger. The owner can say `quick` (skip goals questions, spec, critic, per-task review) or `full` (skip nothing) with the description or at any stop.

| #   | step      | skip when                                                                                                               | artifact                                                                                                                                                                                                                                                                                                                                                                           |
| --- | --------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | start     | never                                                                                                                   | `goals.md` (description verbatim); work branch per Branch convention; bug vs feature (ask only when ambiguous)                                                                                                                                                                                                                                                                     |
| 2   | goals     | no decision only the owner can make, and not UI                                                                         | questions in the fixed format, 1–3 per round; the mock (`mock/`) when Mock conditions match; assumptions recorded in `goals.md`; **owner approves** (`mark goals done`)                                                                                                                                                                                                            |
| 3   | spec      | the work fits one implementer's context (driver's judgement; roughly: one module, no schema/API change, no new concept) | `spec.md`: What, Design, Hard-to-undo (data, schema, deletes, money, public API, repo-wide commands — or "none"), Task index; task files `tasks/NN_MM_<slug>.md`; up to 3 `explore` subagents only when the spec needs codebase facts the driver lacks; a `requirements.md` section-set only when the task index exceeds 8                                                         |
| 4   | critic    | no spec **and** Hard-to-undo is "none"                                                                                  | critic rounds on `spec.md` (and requirements when present); driver revises between rounds; **stop when a round reports no new blocking finding; hard cap 5** (defence item 2); a round that returns a blocking finding never counts toward the cap's "nothing new" condition                                                                                                       |
| 5   | execute   | never                                                                                                                   | baseline: Check + Unit tests once before task 1 (M49); per task: implementer → task tests → reviewer (per task only when the task index spans 3+ modules; otherwise one reviewer over the whole diff after the last task) → fix loop (≤2 fix rounds, then stop and surface) → commit; `progress.md` one entry per task (key changes, deviations); task file moved to `tasks/done/` |
| 6   | adherence | config has no `## Adherence` section                                                                                    | per family: one `adherence` subagent over the branch diff, file by file → `adherence.md` (file × family → pass / flagged / fixed) → fix loop until clean, ≤2 rounds per family                                                                                                                                                                                                     |
| 7   | sweep     | never                                                                                                                   | one `sweep` subagent: (a) everything `spec.md`/`goals.md` says must no longer exist is gone; (b) instruction and config files (CLAUDE.md, docs, config, READMEs) the diff never touched but the change makes stale. Returns fix items → fix loop                                                                                                                                   |
| 8   | review    | never                                                                                                                   | driver writes `review.md` (per task: what changed, how to verify; open assumptions; amendments so far), prints ≤5 lines, and **stops**. The run waits here. Feedback handling below. Ends when the owner says done/accept/ship (`mark review done`)                                                                                                                                |
| 9   | gate      | never                                                                                                                   | rebuild (Build command when configured), Format, Check, Unit tests, e2e when a required Skills & guides entry names one; one repair + one re-run; a command is never re-run without an edit since its last run (E-046 family: 41.8% of repeats had none); failure → back to review with the failure                                                                                |
| 10  | close     | never                                                                                                                   | ledger copied to the Ledger location; `.mise/` removed and committed; ship per config                                                                                                                                                                                                                                                                                              |

### Review-stage feedback

Each item of owner feedback (chat, Delta notes via the Review notes config) is handled by what it changes:

- point fix → batch; task tests once per batch; commit
- pattern ("everywhere", "all instances") → list every instance first, show the count, then fix
- changed decision → amendment (below), then new tasks through execute → adherence (for touched families) → sweep
- voided approach → offer a re-plan once; the owner chooses

The model states a factual objection once, briefly, then does what the owner decides (E: 15% of replies pushed back and changed nothing).

### Amendments

An owner statement that changes a decision recorded in `goals.md` or `spec.md` is appended to `spec.md` (or `goals.md` when there is no spec) under `## Amendments` as `- <date> <what changed> — <why> — tasks: <new or affected ids>`. Only the affected work becomes new tasks; done tasks stay done; nothing is re-approved or re-critiqued (decision 9). The driver re-answers the skip conditions for steps 6–7 (`amend` command reopens them).

## State script

`skills/next/scripts/state.ts`, Node 24, ≤300 code lines, tests in `state.test.ts`. Single reader/writer of `<mise-dir>/.workflow-state` (JSON) and appender of `<mise-dir>/ledger.jsonl`. No hashes. No cascade.

State: `{ version: 3, route: "quick"|"standard"|"full", started: iso, steps: { goals|spec|critic|execute|adherence|sweep|review|gate: "done"|"skipped"|null }, skipReason: {step: text}, amendments: n }`.

Commands (JSON to stdout; non-zero exit and `{error}` on a broken file):

- `report <dir> [--write]` → `{in_flight, route, next_action, tasks_done, tasks_remaining, amendments}`; `--write` initializes a fresh state. `next_action` = the first step in order whose value is null, except execute, which is `step:execute` while the task index (spec.md `## Task index`, or a single implicit task when spec is skipped) has ids not present in `tasks/done/`; then `close` when every step is done or skipped.
- `mark <dir> <step> done|skipped [reason]`
- `route <dir> quick|standard|full`
- `amend <dir> "<text>"` → increments `amendments`, sets adherence and sweep to null, appends a ledger event.
- `log <dir> <json>` → appends one event to `ledger.jsonl` with a timestamp: `{t, event: run|spawn|finding|stop|feedback|skip|amend|gate|close, ...}`.

Ledger event fields: run {repo, branch, route, version}; spawn {role, step, round, minutes, verdict}; finding {source: critic|reviewer|adherence|sweep|gate, round, category, changed: bool}; stop {step, reason, waitMinutes}; feedback {verbatim, step, kind: point|pattern|decision|voided}; skip {step, reason}; amend {text}; gate {command, seconds, pass}; close {codeLines, artifactLines}.

## Config (`.claude/mise-config.md`)

Required: Mise directory, Branch convention, Ship, Quality commands (Format, Check, Unit tests; optional Task tests, Build). Optional: Mock conditions, Mock guidance, Test exceptions, Skills & guides, Adherence, Ledger (default `.claude/mise-ledger/`), Backlog, Review notes. Removed: Checklist, Models, Retrospective.

`## Adherence`: one family per line: `- <family>: <path to examples file>[, glossary: <path>]`. An examples file holds the owner's verbatim past review notes for that family, grouped by sub-pattern, each with the offending code shape. The vocabulary family names a glossary; new terms in added comments/docs not in the glossary or existing code are flagged.

Setup interview (≤20 lines): asks only the required values, offers the optional sections as a list to fill later, writes the file.

## Roles (all dispatched with `model: opus`)

- implementer: one task file; code and tests; comments none by default, only a non-obvious why, within the project's doc-style caps (decision 5); runs task tests; commits; returns ≤10-line summary with deviations.
- reviewer: correctness only against the task (or the whole diff); returns findings `file:line — quoted text — what is wrong — fix`, severity blocking|minor; no style, no checklist (adherence owns style).
- critic: reads spec (+requirements); hard-to-undo first; verifies commands empirically where cheap (`--list-different`, dry runs); returns blocking / non-blocking findings with evidence; states plainly when nothing new blocks.
- adherence: one family, the examples file, the branch diff; file by file; output `file:line — quoted text — matching example id`; writes its section of `adherence.md`.
- sweep: retirements and untouched instruction/config files; returns fix items or "clean".
- explore: read-only codebase facts for the spec; ≤3 per run; returns facts with file:line.

## Retro skill (`/mise:retro`) — the change protocol

Reads every ledger under the Ledger location (and, with a path, other projects'). Eligibility: an issue after 3 runs or 2 projects; once if the harm is irreversible. For each eligible issue, in order: (1) was the instruction already in context — then more prose will not help; (2) can a tool enforce it (lint, types, a test, the state script); (3) project-specific or generic; (4) can an existing line be fixed or deleted instead; (5) which ledger signal will show it worked, checked after N runs, reverted if not. Every added line names a line removed; skill budgets hold. Default outcome: log only. Output: one batch table (issue, count, root cause, where the fix belongs, change, signal) for the owner to approve. Never edits source or plugin files itself (M60).

## Deliverables

- Skill files above; `docs/line-evidence.md`; `docs/skill-authoring.md` (10 lines); README rewritten with the exact step and config terms above; `.claude-plugin/plugin.json` version 3.0.0 and description; marketplace.json description.
- `docs/v3-research/okven/`: proposed `eslint` additions with measured hit counts, `adherence/tests.md`, `adherence/comments.md`, `adherence/vocabulary.md` drafted from `runs/delta-notes.jsonl`, and the v3 `mise-config.md` for okven. Not applied to okven.
