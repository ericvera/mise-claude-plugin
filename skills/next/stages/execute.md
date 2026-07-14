# Execute Implementation Plan

## Role

You are the **orchestrator**. You do not implement tasks yourself — each task runs in a subagent with a fresh context, so a late task in a long plan gets the same clean context as the first one. Your own context holds only the overview, the TODO list, and each subagent's short report; you never read task files or source code.

## Before starting

1. **Read the overview file** at `<mise-directory>/implementation_plan/00_overview.md`. This is the ONLY plan file you read — never the task files.

2. **Get `tasks_done`** from the state-engine report that dispatched you (or run `node ../scripts/state.ts report <mise-directory>`) — a task is done exactly when its file sits in `implementation_plan/done/`, and the report reads that directory. Those tasks are complete from a previous session — exclude them. If all tasks are done, go straight to the acceptance pass (below).

3. **Baseline gate** — before the plan's first task only (`done/` is empty): run the project's Format, Check, and Unit-test commands (from `.claude/mise-config.md`). If anything fails, stop and report — the plan must start from a green baseline so that every later failure is unambiguously the work's to fix; pre-existing failures are the user's call, never yours. On a resumed session (tasks already in `done/`), skip the gate: every checkpoint ended green, so anything red now was introduced by this plan's work — the next subagent's verification catches and fixes it, and nothing mid-plan is ever "pre-existing".

4. **Build the TODO list** from the remaining Task Index rows in the overview, in order, one entry per task:

   `Implement <mise-directory>/implementation_plan/<filename>`

## Executing tasks

Work through the TODO list in order. For each entry:

1. Mark it as in_progress.
2. **Dispatch a fresh implementer subagent** (general-purpose Agent, run synchronously) with this prompt, all paths absolute:

   > Read and follow the instructions at `<skill-dir>/stages/implement_task.md`.
   > Subject task file: `<path to this task's file>`
   > Progress log: `<mise-directory>/implementation_plan/_progress.md`
   > Mise config: `<project>/.claude/mise-config.md`

   The subagent implements, verifies, self-reviews, appends to the progress log, commits, and reports back either success (commit hash + summary) or a failure report.

3. **On failure**, route by the report's kind (`implement_task.md` defines both):
   - **`blocked`** (missing dependency or API, design contradiction) → no retry can fix it: stop and relay the report to the user (see Stopping rules).
   - **`stuck`** (out of hypotheses) → dispatch ONE fresh implementer for the same task, same prompt plus one line: `> Previous attempt's failure report: <the report>` — a fresh context often finds the approach a stuck one couldn't, and the report keeps it from repeating what failed. If the retry fails too, either kind, stop and relay both reports.

   Never fix it yourself, and never dispatch a second retry.
4. **On success, dispatch a fresh reviewer subagent** (fresh context catches what the author's context rationalizes away). Prompt it to: read the task file, run `git show <commit hash>`, and check the diff for missed requirements from the task spec, non-compliance with the task's Guides entries, bugs, security issues, and leftover debug code — reporting a list of concrete defects, or "none". Include any config Skills & guides entries whose condition targets reviewing this kind of work. Missing test coverage is a defect only if no Test exception cited in the task file excuses it. Ignore cosmetic nits. If it reports real defects, dispatch one fix subagent with the defect list and the same implement_task.md instructions (its task: fix the defects, re-verify, commit). One review/fix round per task — if the fix subagent's commit still looks wrong, stop and report.
5. Record the task by moving its file into `done/` — `mkdir -p <mise-directory>/implementation_plan/done && git mv <mise-directory>/implementation_plan/<task file> <mise-directory>/implementation_plan/done/` — and commit (e.g. `mise: task <task ID> done`). The move is the completion record: it's what lets any checkout of the branch resume without redoing work. Mark the TODO entry completed and move on.

## Acceptance pass, then cleanup

After the last task (or when dispatched with everything already done):

1. **Dispatch a fresh acceptance subagent.** Prompt it to: read `requirements.md` (`goals.md` on the bugfix route), read the plan overview and `_progress.md`, inspect the feature branch's commits, and verify each requirement is actually addressed — running the relevant e2e tests (via the Skills & guides entry that covers running them, when one is listed — honor its `required` flag) or the Test exceptions' substitute verifications where those apply. It returns a checklist: each requirement/goal with a verdict (verified — with what evidence · not verified — why) plus anything unverifiable.
2. **Present the checklist to the user** and ask whether to close the feature out. This and the goals gate are the pipeline's only human gates.
3. Items the user flags as wrong are blockers: dispatch fix subagents with the specifics, then re-run the acceptance pass.
4. On the user's confirmation, **clean up**: delete the mise directory `<mise-directory>/` entirely and commit the deletion (e.g. `mise: cleanup`) — the artifacts served their purpose; the merged history keeps the code and tests, not the docs. Report the feature finished.

## Stopping rules

Stop only on real blockers: the baseline gate failing, a `blocked` failure report, an implementer's `stuck` report that survived its one fresh retry, a fix subagent failing or its commit still looking wrong after review, or a genuine ambiguity unresolvable from the task file/codebase/config. If a subagent reports that a task file authorizes a red intermediate state, treat it as a planning bug — stop and ask the user to regenerate the plan. Otherwise keep going.

## Do not

- Implement tasks or read task files in your own context — only the overview and subagent reports
- Skip the baseline gate before the plan's first task, or let a subagent skip verification
- Ask the user for confirmation between tasks while everything is green — just continue
- Retry a failed task more than once — one fresh implementer for a `stuck` report, none for `blocked`
- Skip the acceptance pass or delete the mise directory before the user confirms the checklist
- Ask the user which rule wins when a task note conflicts with a skill default — task notes never win on safety/verification rules
