# Flow

Ten steps, in order. Answer every **Skip when** line at the start of the run and again after each amendment; a yes → `mark <mise-dir> <step> skipped "<reason>"` before that step's turn comes. The reported route `quick` skips the goals questions, the spec, the critic and per-task review; `full` skips nothing.

Log as you go: `log <mise-dir> '<json>'` after every spawn (`{"event":"spawn","role":…,"step":…,"round":…,"minutes":…,"verdict":…}`), every finding (`{"event":"finding","source":…,"round":…,"category":…,"changed":…}`), every stop at the owner (`{"event":"stop","step":…,"reason":…,"waitMinutes":…}`), and every gate command (`{"event":"gate","command":…,"seconds":…,"pass":…}`).

## start

Skip when: never.

1. Write the owner's description verbatim to `<mise-dir>/goals.md`.
2. Pick the branch from `git branch --show-current`: on `main` or `master`, derive a name from the config's Branch convention and `git switch -c` it; on any other branch that has no commits past the default branch and a name the convention fits, use it without asking; on any other branch otherwise, ask whether to use it or to branch from it.
3. Classify the work as a bug fix or a feature, asking "Bug fix or new feature?" only where the description leaves it ambiguous. A bug fix's `goals.md` also records the repro steps, the expected behavior, and where its regression test goes.
4. Commit, then `log {"event":"run","repo":…,"branch":…,"route":…,"version":…}`.

## goals

Skip when: no decision in this work is one only the owner can make, and the work is not UI.

1. Read `goals.md` for contradictions, unstated assumptions, and scope the description leaves open. Each point that needs the owner's call becomes a question below; everything else becomes an edit to `goals.md`.
2. Ask one round at a time, in SKILL.md's question format: the owner's calls, the edge cases and error behavior the spec would otherwise have to guess at, and what is out of scope.
3. The config's Mock conditions match → build `<mise-dir>/mock/` as a static HTML mock of every screen and state the work touches, following the config's Mock guidance, and iterate on it with the owner. Ask about behavior and states; never about spacing, wording or layout.
4. Fold the answers into `goals.md` and record under `## Assumptions` every inference you made instead of asking.
5. Present the goals (and the mock) and ask "Approve, or what should change?" Feedback, questions and silence are not approval. On approval: `mark <mise-dir> goals done`, commit.

## spec

Skip when: the work fits one implementer's context — roughly one module, no schema or API change, no new concept. Judge that yourself.

1. Read the code you need yourself. Spawn up to 3 `explore` subagents, one question each, only for facts the answer to which is more than a few file reads away.
2. Write `<mise-dir>/spec.md`:
   - `## What` — the behavior being built, from the approved goals.
   - `## Design` — how the pieces fit, the data and API shapes, what gets removed and when.
   - `## Hard-to-undo` — data writes and deletes, schema and migrations, money, public API changes, repo-wide commands — or `none`.
   - `## Task index` — one row per task: id, one line of what it does, the files it touches.
3. Write one file per task at `<mise-dir>/tasks/NN_MM_<slug>.md`, each readable with zero project context:
   - **Goal** — what this task accomplishes.
   - **Files to modify/create** — at most 5 source files (tests and fixtures do not count); split the task to fit.
   - **Background** — what prior tasks produced, by file and symbol; the patterns to follow, by `file:line`; the design decisions that reach this task.
   - **Guides** — every config Skills & guides entry whose condition matches this task, verbatim, `required` flags kept.
   - **Implementation details**, **Gotchas**, and **Verification** — the tests to run, the tests this task writes, or the cited Test exception and its substitute check.
4. Every task must end green on its own: no task leaves the build or the suite red for a later one to fix.
5. More than 8 tasks → also write `<mise-dir>/requirements.md`: user-facing behavior as testable `REQ-<AREA>-<n>` lines grouped by area, cited in the task index.
6. `mark <mise-dir> spec done`, commit.

## critic

Skip when: the spec step was skipped **and** the work touches nothing hard to undo.

Spawn one `critic` per round over `spec.md` (plus `requirements.md` when present), and revise between rounds. Stop when a round returns no new blocking finding; hard cap 5 rounds. A round that returns a blocking finding is never the quiet round that stops the loop. Then `mark <mise-dir> critic done`, commit.

## execute

Skip when: never.

Run the config's `Check` and `Unit tests` once before the first task; a failure there stops the run. No spec → write the run's one task file, `<mise-dir>/tasks/01_01_<slug>.md`, from `goals.md` in the spec step's task-file shape. Then, per task in `tasks_remaining`, in index order:

1. Spawn an `implementer` on the task file, with `<mise-dir>/progress.md` as its progress log. `blocked` → stop and relay it. `stuck` → one fresh implementer carrying the failure report; a second failure of either kind → stop.
2. Review: the task index spans 3 or more modules → spawn a `reviewer` on this task's commits; otherwise one `reviewer` over the whole branch diff after the last task.
3. Blocking findings → one fix round through an implementer (`Fix scope:` and `Defects:`), then re-review. At most 2 fix rounds, then stop and surface what is left.
4. `git mv` the task file into `<mise-dir>/tasks/done/` and commit `mise: task <id> done`.

`progress.md` carries one entry per task, written by the implementer.

## adherence

Skip when: the config has no `## Adherence` section.

Spawn one `adherence` subagent per family listed there, each over the branch diff with that family's examples file, each writing its own section of `<mise-dir>/adherence.md`. Flagged rows → one fix round through an implementer for that family, then re-run that family; at most 2 rounds per family, then record what is still flagged and move on. `mark <mise-dir> adherence done`, commit.

## sweep

Skip when: never.

Spawn one `sweep` subagent over the branch diff with `goals.md` and `spec.md`. Fix items → one implementer, then re-run the sweep once. `mark <mise-dir> sweep done`, commit.

## review

Skip when: never.

Write `<mise-dir>/review.md`: per task, what changed and how to verify it; the open assumptions from `goals.md` and `spec.md`; every amendment so far. Print at most 5 lines — what to look at, and where — and stop. The run waits here. Feedback arrives in chat, or in the notes the config's `## Review notes` section points at; read those whenever the owner says there are some.

Handle each item by what it changes, and `log {"event":"feedback","verbatim":…,"step":…,"kind":…}` for each:

- **point** → batch it with the other point fixes; run the task tests once per batch; commit.
- **pattern** ("everywhere", "all instances") → list every instance first and show the count, then fix them.
- **decision** → an amendment (below), then the new tasks through execute, adherence for the families the new work touches, and sweep.
- **voided** (the approach no longer applies) → offer a re-plan once; the owner chooses.

State a factual objection once, briefly, then do what the owner decides. The stage ends when the owner says done, accept or ship: `mark <mise-dir> review done`, commit.

## gate

Skip when: never.

Run once, in order: the config's `Build` when it has one, `Format`, `Check`, `Unit tests`, and the e2e suite when a `required` Skills & guides entry names one — through that entry, never directly. Never re-run a command that has had no edit since its last run.

A failure gets one repair through an implementer and one re-run of the gate. A second failure → print it and hand it to the owner as review feedback, handled by the rules above; the gate runs again once the fix lands. On success: `mark <mise-dir> gate done`, commit.

## close

Skip when: never.

`log {"event":"close","codeLines":…,"artifactLines":…}`, copy `<mise-dir>/ledger.jsonl` to the config's Ledger location (default `.claude/mise-ledger/`) as `<branch>.jsonl`, then delete `<mise-dir>/` and commit `mise: close`. Ship per the config's `Ship` value: `pr` → push and open a pull request summarizing the work; `merge (<style>)` → merge into the default branch in that style; `off` → report the branch ready. Shipping fails → report the branch and the action you tried.

## Amendments

An owner statement that changes a decision already recorded in `goals.md` or `spec.md` is appended to `spec.md` — to `goals.md` when there is no spec — under `## Amendments`:

```
- <date> <what changed> — <why> — tasks: <new or affected ids>
```

Then `amend <mise-dir> "<what changed>"` and re-answer the skip conditions it reopens. Only the affected work becomes new tasks — their task files written, and listed in the spec's `## Task index` where there is a spec — while finished tasks stay finished, and nothing is re-approved or sent back to the critic.
