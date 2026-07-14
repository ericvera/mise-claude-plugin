# Write Implementation Plan

Create a plan that a developer with zero project context can follow. Each task is a self-contained file so the implementing agent never holds the full plan. This stage runs past the human gate: it asks nothing, records assumptions, and self-approves through the critic gate in `../references/interaction.md`.

## Input

Working directory: `<mise-directory>/` (from the config).

**Revising a plan mid-execution**: completed task files sit in `implementation_plan/done/` and their work is already in the repo (see `_progress.md` and the git log). Plan the *remaining* work from that reality — never re-plan work the repo already contains. Approving the revised plan clears `done/` (its contents are scoped to one plan version), so every task in the new plan is pending by definition.

## Bugfix route

If the state's `route` is `bugfix`, skip the general path: the plan is generated from a fixed template, not designed. Read `goals.md` (the confirmed bug understanding) and the config, then write `implementation_plan/00_overview.md` plus:

- **No matching Test exception** — two tasks:
  - `01_01_regression_test.md`: write the regression test at the location recorded in `goals.md`, exercising the exact repro scenario, asserting the _correct_ behavior — then **verify it FAILS for the bug's reason** (a passing test doesn't capture the bug: revise assertions and retry; an unrelated failure is a setup problem to fix first). Copy the config's matching Skills & guides entries (writing and running tests) into the task's Guides section. Commit the failing test.
  - `01_02_fix.md`: make the minimal fix so the test passes. **The test file is frozen — modifying it is not allowed**; the test is the specification. Name the test file explicitly in this task.
- **A Test exception matched** (recorded in `goals.md`) — one task:
  - `01_01_fix.md`: fix the bug and verify it the exception's stated way (e.g. before/after screenshots via a Skills & guides entry that covers manual testing); include the evidence in the task report.

Fill each task file's Background from `goals.md` (repro steps, expected/actual, affected code paths — investigate enough to name them concretely), then go to the critic gate below.

## Feature routes

1. **Gather sources**: read `goals.md`, `requirements.md` (the `REQ-*` IDs you must trace), and skim `mocks.html` / `mocks.context.md` for UI specifics if present.

2. **Deeply analyze the codebase** before writing anything. Understand the patterns in play — state management, routing, API endpoints, component structure, testing, whichever the project actually has — and the exact integration points.

   **Context management — critical to avoid "prompt too long" failures:**
   - **Delegate broad exploration to read-only subagents** (Explore or general-purpose). Give each a focused question ("how does routing work", "where do settings persist") and ask for a compact summary: key paths, relevant functions/types/variables, patterns with file:line references, integration points. The files they read never enter your context.
   - Read directly only the handful of files you'll cite most heavily, and spot-check any file:line reference a subagent gave you before copying it into a task file — task files must not contain unverified pointers.

3. **Create `implementation_plan/`** in the mise directory now, before writing files into it.

4. **Write exploration notes** to `implementation_plan/_exploration_notes.md`: key file paths and roles, relevant functions/types/variables, patterns to follow (file:line), integration points. If you run low on context later, re-read this instead of re-reading source.

5. **Design, in the overview.** `00_overview.md` carries the feature's design — there is no separate architecture document. Scale the Design section's depth to the feature: a paragraph for a contained change; component diagrams, data-model changes, and a migration strategy for a structural one. Build only what the requirements need — no speculative extensibility; note alternatives considered and risks only when they earn their space.

6. **Write the plan** as `00_overview.md` first, then each task file, sequentially, yourself (no subagents for writing — earlier Write calls compress out of context as you go).

7. **Critic gate**: per `../references/interaction.md` — this stage's critic checks the plan against `requirements.md` (`goals.md` on the bugfix route) for: unaddressed or untraced REQ-IDs, tasks that can't end green, unverified file references, missing e2e coverage that no Test exception excuses, missing Guides entries on matching tasks.

## Output structure

```
implementation_plan/
  00_overview.md          # Design + index of all tasks in order
  01_01_<task_name>.md    # First task of phase 1
  01_02_<task_name>.md
  02_01_<task_name>.md
  ...
```

### `00_overview.md` format

```markdown
# Implementation Plan

## Summary

<2-3 sentence summary of what's being built and why>

## Design

<How the pieces fit: components and their interactions (ASCII diagrams where
they help), data-model / schema / API-type changes, migration strategy if any,
code-removal plan if replacing existing code. Depth scaled to the feature.>

## Assumptions

<Non-obvious inferences made where the docs were silent, and the default chosen>

## Phases

- **Phase 1: <Name>** — <what this phase achieves>
- ...

## Phase Rationale

<why this order — what depends on what, what unblocks testing early>

## Task Index

| File              | Task                | Phase | Requirements         |
| ----------------- | ------------------- | ----- | -------------------- |
| `01_01_<name>.md` | <short description> | 1     | REQ-XXX-1, REQ-XXX-2 |
| ...               |                     |       |                      |
```

### Individual task file format

Each task file must be **completely self-contained** — executable by someone who has read only this file and the source files it references.

```markdown
# Task X.Y: <Task Name>

## Goal

<what this task accomplishes>

## Requirements addressed

REQ-XXX-1, REQ-XXX-2

## Background

<Everything needed with zero project context: what the feature is (1-2
sentences); what prior tasks produced, named concretely ("Task 1.2 added
`FooService` at `path/to/fooService.ts`, registered in `container.ts:45`");
the existing patterns involved, naming files, functions, types, variables;
design decisions from the overview that affect this task.>

## Files to modify/create

- `path/to/file.ts` — <what changes and why>

## Guides

<Skills & guides entries from the config whose conditions match this task,
verbatim, with `required` flags preserved. Omit the section if none match.>

## Implementation details

1. <step-by-step guidance referencing specific functions, types, patterns>

## Testing suggestions

- <how to verify this task works>
- <specific e2e tests exercising the changed paths, by file and test name —
  or the Test exception that applies and its substitute verification>

## Gotchas

- <things that look right but aren't>

## Verification checklist

- [ ] <task-specific checks>
- [ ] End-to-end tests: <specific test files/names> <or substitute verification per the noted Test exception>
```

## Key rules for task files

- **Redundancy is intentional.** Repeat shared context rather than saying "see overview" or "as described in Task 1.1" — the implementing agent reads one file at a time.
- **Name concrete code.** Not "follow the existing pattern" — "follow `SettingsPage.tsx` where `handleSettingChange` calls `updateField(...)` on line 213".
- **State what prior tasks produced** by file, type, and function — never "depends on Phase 2".
- **Route the guides.** Match each task against the config's Skills & guides list and copy matching entries into its Guides section — implementers and reviewers act on what's in the task file.
- **Include validation in every file.** Every task ends with a verification checklist naming its e2e tests (or its Test exception's substitute). No generic quality commands — the executor handles those.

## Design principles

- **Every task ends green.** A plan needing a red intermediate state (one task breaks the build, a later one fixes it) is a planning bug — use expand-contract or bundle the breaking change with its caller fixes. If no green ordering exists, rethink task boundaries.
- **Thin vertical slices over horizontal layers** — each phase produces working, testable functionality end-to-end.
- **Remove before building** — schedule removal of replaced code early.
- **Earlier phases unblock later phases** — foundations first, enabling incremental testing.
- **Test as you go** — verification in every task, not a final "test everything" phase.
- **E2e tests are mandatory for user-facing functionality** — new UI, new workflows, changed user-facing behavior — _unless_ a config Test exception matches, in which case the task notes the exception and its substitute verification explicitly (an explicit decision, never a silent omission). If testability needs new test attributes, add them in the relevant implementation tasks and call that out.

## Database migrations

If the plan includes database migrations, tasks must use the migration generation command from the config's Database migrations section, never raw migration tools.

## Do not

- Write code or code snippets in the plan (describe, don't implement)
- Include time estimates
- Create tasks smaller than meaningful progress or larger than ~2 hours of focused work
- Use vague references like "follow the existing pattern" without file/function/line
- Reference other task files for context (repeat it instead)
- Omit e2e tests for user-facing features without a matching, cited Test exception
