---
name: next
description: |
  Runs the next step in the mise workflow. Use when the user reports a
  bug or defect to fix, asks what to work on next, or wants to start or
  continue work on a feature.
argument-hint: "[? | setup | what to work on]"
disable-model-invocation: true
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/state.ts *) Bash(git add *) Bash(git commit *) Bash(git mv *) Bash(git branch *) Bash(git switch *) Bash(mkdir *)
---

# Next

Determine the next step for the work, then run it (proceed mode) or just describe it (explain mode, `?`).

You are the **dispatcher**: read the state, continue or start the work, and route to the right instruction file — never do stage work except under a dispatched stage's instructions. Stages own their artifacts and record their own approvals; `next` writes only what routing requires.

One piece of work — a feature or a bug fix — moves through the pipeline at a time (goals → mock when routed → requirements → plan → execute → acceptance), and it lives in exactly one working directory: the **mise directory**, created when work starts and deleted when the result is accepted.

Every run walks the same five steps. Copy this checklist and check off each step as you complete it:

```
Progress:
- [ ] 1. Match the arguments to a mode
- [ ] 2. Load context, check the config gate
- [ ] 3. Run the state engine, then continue the work in flight or start new work
- [ ] 4. Report the next step, then act on next_action
- [ ] 5. After a self-approving stage, loop from step 3; stop only at the goals gate, the acceptance pass, or a real blocker
```

## Modes

- Empty `$ARGUMENTS` → **proceed**: run the checklist end to end.
- Exactly `?` → **explain**: follow the same steps, then describe the next step instead of running it. `?` followed by anything else → print `Usage: /mise:next [? | setup | <what to work on>]` and stop.
- Exactly `setup` → dispatch setup (see Dispatch below) even if the config is already filled — this is how an existing config gets revisited. Then stop.
- Anything else → work description: carry it into Continue or start the work below, then continue in proceed mode.

Explain mode is read-only: no dispatch (not even to setup), no deletions, and no state writes of any kind — the state-engine commands below have a read-only form for this. Report the would-be action instead ("would dispatch the goals stage", "would ask 'Bug fix or new feature?'"); wherever a rule below says to ask the user something, report the question instead of asking it.

## Load context

Read two files before anything else:

1. `references/interaction.md` — the question format and the gate rules (one human gate at goals(+mock), critic gates everywhere else, acceptance at the end).
2. The project's `.claude/mise-config.md` — routing reads its Mise directory value (written `<mise-directory>` everywhere below) and optional `## Backlog` section; the config gate below also checks its quality-commands values.

Ground rules for everything that follows:

- To **dispatch** a stage or setup is to read its instruction file and follow it — the files are not registered skills; reading and following them is the only mechanism.
- This skill's directory is `${CLAUDE_SKILL_DIR}`. Every relative path in the instruction files it dispatches resolves against the file that mentions it — never against the project.
- All reads and writes of `.workflow-state` files go through the **state engine**, `${CLAUDE_SKILL_DIR}/scripts/state.ts`, which needs Node 24+ (it executes TypeScript directly). If `node` is missing or older, report that to the user and stop — never inspect or edit a state file, or apply its rules, by hand.
- Artifacts live on the feature branch: commit the mise directory at every checkpoint — creation, each approval, each recorded decision, each completed task, and the final cleanup — so a dead machine costs nothing and any checkout of the branch resumes the work. Every dispatched stage honors this; `next` commits only its routing writes.
- Checkpoint commits use the bare `mise:` prefix (e.g. `mise: approve goals`, `mise: task 01_02 done`, `mise: cleanup`) so workflow bookkeeping stays distinguishable from code commits.

**Config gate** — the config is **unfilled** if the file is missing or it has no Mise directory value (the directory itself is legitimately absent between pieces of work — only the config value matters here):

- Unfilled, proceed mode → dispatch setup (see Dispatch below), then resume with the original `$ARGUMENTS`.
- Unfilled, explain mode → print `Next step: setup — run /mise:next to configure` plus one line naming what's missing, then stop.
- Partially filled: missing quality-commands values block only the execute dispatch, and a missing Branch convention blocks only starting new work — this gate re-fires at both points; other missing optional sections never block.

## The state engine

`<mise-directory>/.workflow-state` drives everything, and the state engine is the only way to touch it:

```
node ${CLAUDE_SKILL_DIR}/scripts/state.ts report <mise-directory>          # explain mode — read-only
node ${CLAUDE_SKILL_DIR}/scripts/state.ts report <mise-directory> --write  # proceed mode
```

One `report` run verifies every recorded approval hash, initializes the state file on a fresh start, applies the mismatch cascade, and computes `next_action` — a task counts as done exactly when its file sits in `implementation_plan/done/`. With `--write` it persists what it did; without, it only reports it. A single run supplies both `in_flight` (the in-flight gate below) and `next_action` — re-run it only after something changes: content in the mise directory is created, moved, or deleted, or a stage records an approval. There is no locking: never point two sessions at the same mise directory.

Surface what the engine did before acting on it: `reopened: [...]` means a doc changed after approval — tell the user which stages reopened and why. (A stage with no approval entry blocks as the next stage but never cascades — only a changed doc does.)

The engine refuses a broken or hand-edited state file with an `{error}` whose message names the user's options (restore it from the last `mise:` checkpoint, or delete the mise directory and start the work over). Relay the error and stop — never rebuild state by hand or work around it.

## Continue or start the work

The mise directory is the single source of truth here: its existence means **work is in flight** — one piece at a time per branch — and finishing the work deletes it.

**In-flight gate** — act on the report's `in_flight` field:

- **`true`** — work is in flight (any content in the mise directory counts; a fresh directory's state file is initialized by the first `--write` run):
  - No description → continue that work; done here.
  - Any description (bug reports included) → report and stop, starting nothing: "Work is already in flight on this branch — run `/mise:next` (no arguments) to continue it. Finish it before starting new work; for a bug fix or another feature, use a fresh branch."
- **`false`** — nothing in flight (directory missing or empty):
  - A description → start it below.
  - No description → the backlog prompt.

**With a description** (nothing in flight):

1. Classify it: clearly a defect — "fix", "bug", "regression", "crashes" — takes the bugfix route; clearly new behavior is a feature. Ambiguous → ask: "Bug fix or new feature?" — never guess silently.
2. Ensure a work branch — new work never starts on the default branch. If the config has no Branch convention value, the config gate re-fires: dispatch setup, then resume here. Check `git branch --show-current`:
   - On the default branch (`main`/`master`) → derive a branch name from the config's Branch convention and the description (the classification picks the pattern when the convention distinguishes fixes from features) and create it: `git switch -c <name>`.
   - On any other branch → ask: "Use the current branch `<branch>` for this work, or create a new one from it?" — switch only if the user chooses new.
3. Start it: create `<mise-directory>/` and write the description verbatim to `goals.md` — the engine's first `--write` run initializes `.workflow-state`. Commit the new directory. Carry the classification into the goals dispatch: the route (`bugfix`, or `full`/`direct` from the config's Mock conditions) is decided by the goals stage and recorded with its approval — `next` never records it.

**Backlog prompt:** if the config has a `## Backlog` section, follow its instructions to fetch the top to-do items and present them numbered: "Pick a number, or describe what you want to work on:". Without one, just ask: "Describe what you want to work on:". Treat the answer as a work description and re-enter this section from the top.

**When continuing in-flight work** (proceed mode): if `goals.md` is missing, ask "What's the goal for this work?" and write the answer verbatim — it stays unapproved until the goals stage gates it. `goals.md` is the only stage artifact `next` ever writes; it never records approvals.

## Act on `next_action`

Stage instruction files:

| Stage        | Instructions                                                                          |
| ------------ | ------------------------------------------------------------------------------------- |
| goals        | `stages/goals.md`                                                                     |
| mock         | `stages/goals.md` (a reopened mock re-enters the goals stage's iterate-and-gate loop) |
| requirements | `stages/requirements.md`                                                              |
| plan         | `stages/plan.md`                                                                      |
| execute      | `stages/execute.md`                                                                   |

Each `next_action` maps to exactly one move:

- **`stage:<name>`** → dispatch that stage's instruction file. Artifact existence is never approval: artifact missing → the stage's instructions create it; present but unapproved → the same instructions review and revise it to approval.
- **`acceptance`** — all tasks done: dispatch execute, which runs the **acceptance pass** and, on the user's confirmation, the **retrospective** (a subagent mines the run for guidance improvements; the user adopts or rejects each proposal) and then the cleanup: delete `<mise-directory>` and commit the deletion — the artifacts served their purpose; the merged history keeps the code and tests, not the docs. Afterwards offer the backlog prompt.
- **`stage:execute`** → the config gate re-fires here: if the config's Format / Check / Unit-tests commands are missing or still placeholders, dispatch setup first. Otherwise dispatch execute — it skips tasks already in `implementation_plan/done/`; `next` never manages individual tasks.

## Report, then dispatch

Explain mode — print exactly one block, then stop:

```
Stage: <one line, noting the route and any unapproved or changed-since-approval artifacts>
Next step: <stage> — run /mise:next to proceed
```

When the next step is a question rather than a stage (a gate above, the acceptance pass), the `Next step:` line states that question instead.

Proceed mode — print, then dispatch:

```
Running stage: <stage>
```

**Dispatch** — read the instruction file (the stage's file from the table above, or `stages/setup.md` for setup) and follow it. Every dispatched file assumes `references/interaction.md` and the project's `.claude/mise-config.md` are already loaded (you read both above) and does not restate it.

## Stopping rules

Once a stage is dispatched, stop only at the goals gate, the acceptance pass, or a real blocker; the bug-vs-feature routing question above still asks as written. When a dispatched stage self-approves at its critic gate (requirements, plan), do not end the turn and do not tell the user to re-run `/mise:next` — re-run `report --write` and dispatch the next stage in the same session. After the goals gate, the work runs unattended from requirements through execution to the acceptance checklist.

## Do not

- Advance past the goals(+mock) gate without the user's explicit approval, or past a critic gate without a critic pass.
- Re-ask decisions already recorded in `.workflow-state` — and never delete a recorded approval except via the engine's mismatch cascade or a changed re-approval at a gate.
- Ask for confirmation before dispatching when the next step is unambiguous — resolve and run.
- Stop between self-approving stages — per the stopping rules, they run in one session.
- Touch `.workflow-state` except through `scripts/state.ts`. Stage approvals (and the route, which rides on the goals approval) are recorded by producing stages at their gates — `next`'s only state write is `report --write`.
- Delete the mise directory unless the user has confirmed the work finished or abandoned — the acceptance-confirmed cleanup is the only unprompted deletion.
