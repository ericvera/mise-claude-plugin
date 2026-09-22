# Flow

Nine steps, in order. Answer every **Skip when** line at the start of the run; a yes → `mark .mise <step> skipped` before that step's turn comes.

## start

Skip when: never.

1. Write the owner's description verbatim to `.mise/goals.md`.
2. Pick the branch from `git branch --show-current`: on `main` or `master`, `git switch -c feat/<slug>` for a feature or `fix/<slug>` for a bug fix, `<slug>` a kebab-case slug of the work; on any other branch that has no commits past the default branch and one of those two shapes, use it without asking; on any other branch otherwise, ask whether to use it or to branch from it.
3. Classify the work as a bug fix or a feature, asking "Bug fix or new feature?" only where the description leaves it ambiguous. A bug fix's `goals.md` also records the repro steps, the expected behavior, and where its regression test goes.
4. Commit.

## goals

Skip when: never.

1. Read `goals.md` for contradictions, unstated assumptions, and scope the description leaves open. Each point that needs the owner's call becomes a question below; everything else becomes an edit to `goals.md`.
2. A question remains → ask one round at a time, in SKILL.md's question format: the owner's calls, the edge cases and error behavior the spec would otherwise have to guess at, and what is out of scope.
3. The config's Mock conditions match → build `.mise/mock/` as a static HTML mock of every screen and state the work touches, its product name and look taken from the repo's own UI code and `CLAUDE.md`.
4. Fold the answers into `goals.md` and record under `## Assumptions` every inference you made instead of asking.
5. Print at most 3 lines — the issue, the fix or approach you propose, what the run will skip — with the mock when there is one, and ask "Approve, or what should change?" Feedback, questions and silence are not approval. On approval: `mark .mise goals done`.

## spec

Skip when: the work fits one implementer's context — roughly one module, no schema or API change, no new concept — and touches nothing hard to undo.

1. Read the code you need yourself.
2. Write `.mise/spec.md`:
   - `## What` — the behavior being built, from the approved goals.
   - `## Design` — how the pieces fit, the data and API shapes, what gets removed and when.
   - `## Hard-to-undo` — data writes and deletes, schema and migrations, money, public API changes, repo-wide commands — or `none`.
   - `## Task index` — one row per task: id, one line of what it does, the files it touches.
3. Write one file per task at `.mise/tasks/NN_MM_<slug>.md`, each readable with zero project context:
   - **Goal** — what this task accomplishes.
   - **Files to modify/create** — at most 5 source files (tests and fixtures do not count); split the task to fit.
   - **Background** — what prior tasks produced, by file and symbol; the patterns to follow, by `file:line`; the design decisions that reach this task.
   - **Guides** — every config Skills & guides entry whose condition matches this task, verbatim, `required` flags kept.
   - **Implementation details**, **Gotchas**, and **Verification** — the tests to run, the tests this task writes, or the substitute check that verifies work no test covers.
4. Every task must end green on its own: no task leaves `Check` or the suite red for a later one to fix.
5. `mark .mise spec done`.

## critic

Skip when: the spec step was skipped.

Spawn one `critic` per round over `spec.md`, and revise between rounds. Stop when a round returns no new blocking finding; hard cap 5 rounds. Then `mark .mise critic done`.

## execute

Skip when: never.

Run the config's `Check` and `Unit tests` once before the first task; a failure there stops the run. No spec and no task file yet → write the run's one task file, `.mise/tasks/01_01_<slug>.md`, from `goals.md` in the spec step's task-file shape. Then, one task at a time, the file the report's `tasks.next_file` names:

1. Spawn an `implementer` on the task file; a `Task failed:` report → stop and relay it.
2. `git mv` the task file into `.mise/tasks/done/` and commit `mise: task <id> done`.

After the last task, `reviewer` batches over the whole branch diff — after an amendment's tasks, one `reviewer` over their commits alone. Blocking findings → one fix round through an implementer (`Fix scope:` and `Defects:`), then re-review the fix commits alone. At most 2 fix rounds, then stop and surface what is left. No blocking finding left → `mark .mise execute done`.

## adherence

Skip when: the config has no `## Adherence` section.

Spawn `adherence` subagents per family listed there, in batches over the branch diff, each with that family's examples file, each appending only its flagged rows to that family's section of `.mise/adherence.md`. Flagged rows → one fix round through an implementer for that family, then re-run that family over the flagged files alone; at most 2 rounds per family, then record what is still flagged and move on. `mark .mise adherence done`.

## review

Skip when: never.

Write `.mise/review.md`: one line per task — what changed and how to verify it, from the task files and `git log` — then the open assumptions from `goals.md` and `spec.md` and the amendments so far, at most 60 lines in all; past that, one line per area instead of per task. Print at most 5 lines — what to look at, and where — and stop. The run waits here. Feedback arrives in chat, or through the `delta:review-notes` skill's contract wherever that skill is installed and the owner says there are notes.

Handle each item by what it changes:

- **point** → batch it with the other point fixes and send each batch to one implementer (`Fix scope:` and `Defects:`).
- **pattern** ("everywhere", "all instances") → list every instance first and show the count, then send them to one implementer as a batch.
- **decision** → an amendment (below), then the new tasks through execute, and adherence for the families the new work touches.
- **voided** (the approach no longer applies) → offer a re-plan once; the owner chooses.

State a factual objection once, briefly, then do what the owner decides. The stage ends when the owner says done, accept or ship: `mark .mise review done`.

## gate

Skip when: never.

Run once, in order: the config's `Check` and `Unit tests`, then the e2e suite when a `required` Skills & guides entry names one — through that entry, never directly. Never re-run a command that has had no edit since its last run.

A failure gets one repair through an implementer and one re-run of the gate. A second failure → print it and hand it to the owner as review feedback, handled by the rules above; the gate runs again once the fix lands. On success: `mark .mise gate done`.

## close

Skip when: never.

Delete `.mise/` and commit `mise: close`. Push the branch and open a pull request summarizing the work; that fails → report the branch and the action you tried.

## Amendments

An owner statement that changes a decision already recorded in `goals.md` or `spec.md` is appended to `spec.md` — to `goals.md` when there is no spec — under `## Amendments`:

```
- <date> <what changed> — <why> — tasks: <new or affected ids>
```

Then `amend .mise` and re-answer the skip conditions it reopens. Only the affected work becomes new tasks — their task files written, and listed in the spec's `## Task index` where there is a spec — while finished tasks stay finished, and nothing is re-approved or sent back to the critic.

Read `## Amendments` only when re-answering skip conditions and when writing `review.md`; elsewhere the report's `amendments` count is what you need.
