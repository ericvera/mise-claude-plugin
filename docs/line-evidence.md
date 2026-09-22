# Line evidence

Every non-blank, non-glue line of every shipped skill file maps to an id here, keyed by its first eight words so an edit above a line never shifts the ledger. A line that maps to nothing is cut.

- `E-nnn` — `scorecard/evidence.jsonl` on the `v3-research` branch (https://github.com/ericvera/mise-claude-plugin/tree/v3-research/docs/v3-research).
- `O-nn` — a row of `scorecard/driver-overlay.md` on that branch.
- `D-nn` — a decision in the 2026-09-22 table of `decisions.md` on that branch. `D-01` (build to the overlay) covers a mechanism the overlay leaves untouched, where the draft scorecard's verdict stands (driver-overlay.md:3); the scorecard mechanism id is named in parentheses.
- Glue — frontmatter, headings, fenced blocks and their contents, and table rows — carries no evidence and gets no row. Instructions that repeat word for word (`Skip when: never.`) share one row.

Verify with `node tools/check-line-evidence.mjs <path to this checkout>` from that branch's checkout.

| file                                       | instruction                                                                                           | ids                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| skills/next/SKILL.md                       | You are the **driver**: read the state, run                                                           | E-002, E-005                                  |
| skills/next/SKILL.md                       | Empty → continue the work in flight, or                                                               | D-01 (M03)                                    |
| skills/next/SKILL.md                       | `setup` → run `${CLAUDE_SKILL_DIR}/stages/setup.md`, then stop.                                       | O-07                                          |
| skills/next/SKILL.md                       | Anything else → a work description.                                                                   | D-01 (M03)                                    |
| skills/next/SKILL.md                       | Read `.claude/mise-config.md`. No config file, or no Quality                                          | O-07, E-066, D-14, D-16, D-30                 |
| skills/next/SKILL.md                       | Needs Node 24+; a missing or older `node`,                                                            | E-058                                         |
| skills/next/SKILL.md                       | Re-run it after every `mark`, `amend` and finished                                                    | E-006, O-13                                   |
| skills/next/SKILL.md                       | Never read, write or repair `.mise/.workflow-state` or `.mise/ledger.jsonl`                           | E-058, D-14                                   |
| skills/next/SKILL.md                       | Commit `.mise` whenever a step is marked —                                                            | E-073 (M05)                                   |
| skills/next/SKILL.md                       | Delete `.mise` only in the close step.                                                                | O-12, D-10                                    |
| skills/next/SKILL.md                       | `in_flight` true with a description → "Work is                                                        | E-051, D-01 (M07)                             |
| skills/next/SKILL.md                       | `in_flight` false with no description → ask "Describe                                                 | D-01 (M08), D-22                              |
| skills/next/SKILL.md                       | `in_flight` false with a description → flow.md's **start**                                            | O-13                                          |
| skills/next/SKILL.md                       | Otherwise act on `next_action`: `step:<name>` → the `<name>`                                          | E-058                                         |
| skills/next/SKILL.md                       | Every unit of work is an Agent call                                                                   | D-01, E-005, E-064                            |
| skills/next/SKILL.md                       | A scope past 20 files — diff files,                                                                   | O-10, E-007, E-073                            |
| skills/next/SKILL.md                       | One status line per step: `<step>: <what ran>`                                                        | E-051                                         |
| skills/next/SKILL.md                       | Ask 1–3 related questions per turn, numbered, their                                                   | E-050, E-049                                  |
| skills/next/SKILL.md                       | Every set ends with the `Recommend:` line —                                                           | E-050                                         |
| skills/next/SKILL.md                       | Stop only at: the goals approval, the review                                                          | E-006, E-051, O-12, D-40                      |
| skills/next/flow.md                        | Nine steps, in order. Answer every **Skip when**                                                      | O-13, D-02, D-25                              |
| skills/next/flow.md                        | Log as you go: `log .mise '<json>'` after                                                             | O-09, D-07, D-25, D-36                        |
| skills/next/flow.md                        | Skip when: never.                                                                                     | O-13                                          |
| skills/next/flow.md                        | Write the owner's description verbatim to `.mise/goals.md`.                                           | E-048, E-049                                  |
| skills/next/flow.md                        | Pick the branch from `git branch --show-current`: on                                                  | E-081, D-01 (M10), D-16                       |
| skills/next/flow.md                        | Classify the work as a bug fix or                                                                     | O-05, O-13                                    |
| skills/next/flow.md                        | Commit, then log the `run` event.                                                                     | E-073, O-09, D-36                             |
| skills/next/flow.md                        | Read `goals.md` for contradictions, unstated assumptions, and scope                                   | E-049, E-048                                  |
| skills/next/flow.md                        | A question remains → ask one round at a                                                               | E-050, E-049, D-39                            |
| skills/next/flow.md                        | The config's Mock conditions match → build `.mise/mock/`                                              | E-078, E-052, D-20, D-32, D-39                |
| skills/next/flow.md                        | Fold the answers into `goals.md` and record under                                                     | E-049                                         |
| skills/next/flow.md                        | Print at most 3 lines — the issue,                                                                    | D-13, E-051, O-13, D-32                       |
| skills/next/flow.md                        | Skip when: the work fits one implementer's context                                                    | O-03, O-13, D-38                              |
| skills/next/flow.md                        | Read the code you need yourself.                                                                      | E-061, O-03, D-24                             |
| skills/next/flow.md                        | Write `.mise/spec.md`:                                                                                | O-03, O-13, O-04                              |
| skills/next/flow.md                        | `## What` — the behavior being built, from                                                            | O-03, O-13, O-04                              |
| skills/next/flow.md                        | `## Design` — how the pieces fit, the                                                                 | O-03, O-13, O-04                              |
| skills/next/flow.md                        | `## Hard-to-undo` — data writes and deletes, schema                                                   | O-03, O-13, O-04                              |
| skills/next/flow.md                        | `## Task index` — one row per task:                                                                   | O-03, O-13, O-04, D-27                        |
| skills/next/flow.md                        | Write one file per task at `.mise/tasks/NN_MM_<slug>.md`, each                                        | O-08                                          |
| skills/next/flow.md                        | **Goal** — what this task accomplishes.                                                               | O-08                                          |
| skills/next/flow.md                        | **Files to modify/create** — at most 5 source                                                         | O-08, D-01 (M44)                              |
| skills/next/flow.md                        | **Background** — what prior tasks produced, by file                                                   | O-08, D-33                                    |
| skills/next/flow.md                        | **Guides** — every config Skills & guides entry                                                       | O-08                                          |
| skills/next/flow.md                        | **Implementation details**, **Gotchas**, and **Verification** — the tests                             | O-08, D-28                                    |
| skills/next/flow.md                        | Every task must end green on its own:                                                                 | D-01 (M45)                                    |
| skills/next/flow.md                        | `mark .mise spec done`, commit.                                                                       | E-073                                         |
| skills/next/flow.md                        | Skip when: the spec step was skipped **and**                                                          | O-13, O-04                                    |
| skills/next/flow.md                        | Spawn one `critic` per round over `spec.md`, and                                                      | O-04, D-08, D-27, D-37                        |
| skills/next/flow.md                        | Run the config's `Check` and `Unit tests` once                                                        | E-074, E-058                                  |
| skills/next/flow.md                        | Spawn an `implementer` on the task file; a                                                            | E-074, E-002, D-35, D-40                      |
| skills/next/flow.md                        | `git mv` the task file into `.mise/tasks/done/` and                                                   | E-073                                         |
| skills/next/flow.md                        | After the last task, `reviewer` batches over the                                                      | O-10, E-019, E-018, E-076, E-073, D-34        |
| skills/next/flow.md                        | Skip when: the config has no `## Adherence`                                                           | O-15, D-12                                    |
| skills/next/flow.md                        | Spawn `adherence` subagents per family listed there, in                                               | O-15, D-12, E-051, E-073                      |
| skills/next/flow.md                        | Write `.mise/review.md`: one line per task — what                                                     | O-01, O-12, E-051, E-073, D-21, D-33          |
| skills/next/flow.md                        | Handle each item by what it changes, and                                                              | O-09, O-12, D-26, D-36                        |
| skills/next/flow.md                        | **point** → batch it with the other point                                                             | O-12, E-054, D-18                             |
| skills/next/flow.md                        | **pattern** ("everywhere", "all instances") → list every instance                                     | O-12                                          |
| skills/next/flow.md                        | **decision** → an amendment (below), then the new                                                     | O-11, D-09, O-12, D-29                        |
| skills/next/flow.md                        | **voided** (the approach no longer applies) → offer                                                   | O-12                                          |
| skills/next/flow.md                        | State a factual objection once, briefly, then do                                                      | E-055, O-12, D-10                             |
| skills/next/flow.md                        | Run once, in order: the config's `Check` and                                                          | O-06, E-066, E-023, D-19, D-31                |
| skills/next/flow.md                        | A failure gets one repair through an implementer                                                      | O-06, D-10                                    |
| skills/next/flow.md                        | Log the `close` event, copy `.mise/ledger.jsonl` to `.claude/mise-ledger/<branch>.jsonl`, then delete | D-07, O-12, D-01 (M27, M61), D-15, D-30, D-36 |
| skills/next/flow.md                        | An owner statement that changes a decision already                                                    | O-11, D-09                                    |
| skills/next/flow.md                        | Then `amend .mise "<what changed>"` and re-answer the                                                 | O-11, D-09                                    |
| skills/next/flow.md                        | Read `## Amendments` only when re-answering skip conditions                                           | O-11, D-09, E-073                             |
| skills/next/stages/setup.md                | Interview the owner, then write `.claude/mise-config.md` in the                                       | O-07, E-064                                   |
| skills/next/stages/setup.md                | Ask one question, in SKILL.md's question format: confirm                                              | O-07, E-050, E-066, D-23, D-30, D-31          |
| skills/next/stages/setup.md                | Then list the optional sections by name —                                                             | O-07, E-064, E-068, D-23, D-28                |
| skills/next/stages/setup.md                | Write the file with the sections filled and                                                           | O-07, E-064                                   |
| skills/next/stages/setup.md                | Then ensure `CLAUDE.md` carries this line (creating the                                               | E-080, D-01 (M28), D-14                       |
| skills/next/stages/setup.md                | Never open a pull request for, or merge                                                               | E-080, D-01 (M28)                             |
| skills/next/stages/setup.md                | Commit the config and the guard together: `mise:`                                                     | E-073                                         |
| skills/next/roles/implementer.md           | You are a fresh-context subagent implementing one task                                                | E-002, E-076                                  |
| skills/next/roles/implementer.md           | Read the mise config (quality commands, Skills &                                                      | O-08, E-065, D-33                             |
| skills/next/roles/implementer.md           | A bug fix: write its regression test first                                                            | O-05, D-01 (M40)                              |
| skills/next/roles/implementer.md           | Implement it, following the task's **Guides** entries and                                             | O-08, E-065                                   |
| skills/next/roles/implementer.md           | Comments: none by default. Write one only for                                                         | D-05, E-027, E-044                            |
| skills/next/roles/implementer.md           | Verify, in order: `Check`, then `Unit tests` —                                                        | E-066, E-070, O-08, D-18, D-28, D-31          |
| skills/next/roles/implementer.md           | Fix and re-run until green. Once one command                                                          | E-074, D-40                                   |
| skills/next/roles/implementer.md           | Read your own `git diff` for task requirements                                                        | E-046, E-039                                  |
| skills/next/roles/implementer.md           | Commit the work, subject `Task <id>: <what it`                                                        | E-073, E-038, D-33                            |
| skills/next/roles/implementer.md           | Report in at most 10 lines: the commit                                                                | E-051, E-002, D-35, D-40                      |
| skills/next/roles/implementer.md           | Do not touch files outside the task's scope,                                                          | E-074, D-01 (M45), D-40                       |
| skills/next/roles/reviewer.md              | You are a fresh-context reviewer: you report defects                                                  | O-10, E-018, E-073, D-29, D-34                |
| skills/next/roles/reviewer.md              | Read the scope, then the work itself: `git`                                                           | O-10, E-020, E-073                            |
| skills/next/roles/reviewer.md              | Report correctness only:                                                                              | O-15                                          |
| skills/next/roles/reviewer.md              | behavior the task specifies that the diff misses,                                                     | E-020, E-040                                  |
| skills/next/roles/reviewer.md              | bugs, security holes (injection, XSS, hardcoded secrets), leftover                                    | E-020, E-040                                  |
| skills/next/roles/reviewer.md              | missing test coverage that the task's **Verification** does                                           | E-070, E-040, D-28                            |
| skills/next/roles/reviewer.md              | **Guides** entries in the task that the diff                                                          | E-065                                         |
| skills/next/roles/reviewer.md              | on a diff batch, whatever the goals or                                                                | O-01, D-29                                    |
| skills/next/roles/reviewer.md              | on a diff batch, instruction and config files                                                         | O-01, E-073, D-29                             |
| skills/next/roles/reviewer.md              | Test shape, comment register, naming and project conventions                                          | O-15, E-035, E-036                            |
| skills/next/roles/reviewer.md              | Report each finding as `file:line — <quoted text>`                                                    | O-09, E-018, E-051                            |
| skills/next/roles/critic.md                | You are a fresh-context critic: you review the                                                        | O-04, D-08, E-073, D-27                       |
| skills/next/roles/critic.md                | Check, in this order:                                                                                 | O-04                                          |
| skills/next/roles/critic.md                | **Hard to undo, first.** Every item in the                                                            | O-13, O-04                                    |
| skills/next/roles/critic.md                | Behavior the goals ask for that no task                                                               | O-03                                          |
| skills/next/roles/critic.md                | References in the task files that do not                                                              | O-04, E-011                                   |
| skills/next/roles/critic.md                | Verify a command's reach empirically wherever that is                                                 | O-04                                          |
| skills/next/roles/critic.md                | Report each finding as `<what would be built`                                                         | O-04, D-08                                    |
| skills/next/roles/adherence.md             | You are a fresh-context subagent checking one rule                                                    | O-15, D-12, E-073                             |
| skills/next/roles/adherence.md             | Read the examples file first: it holds the                                                            | O-15, D-03, E-039                             |
| skills/next/roles/adherence.md             | Walk your batch **file by file**, in order                                                            | O-15, D-12, E-073                             |
| skills/next/roles/adherence.md             | A vocabulary family: collect every term introduced in                                                 | O-15, D-12, E-040                             |
| skills/next/roles/adherence.md             | Append to your family's section of `.mise/adherence.md` one                                           | O-15, E-051, E-073                            |
| skills/next/roles/adherence.md             | Report the counts only: files read, files flagged,                                                    | O-15, E-051                                   |
| skills/next/references/config-reference.md | Setup's reference for `.claude/mise-config.md`, never copied into a                                   | O-07, E-064, D-30                             |
| skills/next/references/config-reference.md | Required:                                                                                             | O-07, E-064                                   |
| skills/next/references/config-reference.md | **Quality commands** — Check (lint, typecheck, formatting and                                         | O-07, O-06, E-066, D-18, D-19, D-31           |
| skills/next/references/config-reference.md | Optional — omit what does not apply. A                                                                | E-064, E-065                                  |
| skills/next/references/config-reference.md | **Mock conditions** — bulleted conditions deciding whether the                                        | E-078, E-052                                  |
| skills/next/references/config-reference.md | **Skills & guides** — one entry per line,                                                             | E-065                                         |
| skills/next/references/config-reference.md | **Adherence** — one rule family per line, `-`                                                         | O-15, D-03, D-12, E-073                       |
| skills/retro/SKILL.md                      | Run `node ${CLAUDE_SKILL_DIR}/../next/scripts/state.ts tally .claude/mise-ledger/ <dir>…` over this   | O-14, D-11, O-02, O-09, D-15                  |
| skills/retro/SKILL.md                      | Group the `finding`, `feedback`, `stop`, `skip` and `gate`                                            | O-09, O-02                                    |
| skills/retro/SKILL.md                      | **Eligible**: an issue seen in 3 or more                                                              | O-14, E-033                                   |
| skills/retro/SKILL.md                      | For each eligible issue, answer in order and                                                          | O-14                                          |
| skills/retro/SKILL.md                      | Was the instruction already in the acting agent's                                                     | O-14, E-035                                   |
| skills/retro/SKILL.md                      | Can a tool enforce it — a lint                                                                        | O-14, E-043, E-045                            |
| skills/retro/SKILL.md                      | Is it project-specific or generic? Project-specific belongs in                                        | O-14, D-03                                    |
| skills/retro/SKILL.md                      | Can an existing line be fixed or deleted                                                              | O-14, E-057                                   |
| skills/retro/SKILL.md                      | Which ledger signal will show the change worked,                                                      | O-14, E-031, E-032                            |
| skills/retro/SKILL.md                      | Every added line names the line it removes,                                                           | O-14, E-056                                   |
| skills/retro/SKILL.md                      | Output one table and nothing else, then ask                                                           | O-14, E-031                                   |
