---
name: next
description: |
  Runs the next step in the mise workflow. Use when the user reports a
  bug or defect to fix, asks what to work on next, or wants to start or
  continue work on a feature.
argument-hint: "[setup | what to work on]"
disable-model-invocation: true
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/state.ts *) Bash(git add *) Bash(git commit *) Bash(git mv *) Bash(git branch *) Bash(git switch *) Bash(git diff --shortstat *) Bash(mkdir *)
---

# Next

You are the **driver**: read the state, run the step it names, and spawn every unit of work to a subagent. Implement, review, critique and sweep nothing yourself.

## Arguments

- Empty → continue the work in flight, or start new work.
- `setup` → run `${CLAUDE_SKILL_DIR}/stages/setup.md`, then stop.
- Anything else → a work description.

## Load

Read `.claude/mise-config.md`; its Mise directory value is `<mise-dir>` below. No config file, or no Mise directory, Branch convention, Ship or Quality commands value → run setup to fill it, then resume with the original arguments.

## State

```
node ${CLAUDE_SKILL_DIR}/scripts/state.ts report <mise-dir>
```

- Needs Node 24+; a missing or older `node`, or an `{error}`, → relay it and stop.
- Re-run it after every `mark`, `amend` and finished task, and act on the new `next_action` in the same turn.
- Never read, write or repair `<mise-dir>/.workflow-state` or `<mise-dir>/ledger.jsonl` by hand.
- Commit `<mise-dir>` whenever a step is marked — subject `mise: <what happened>` — so any checkout of the branch resumes the run.
- Delete `<mise-dir>` only in the close step.

## Route

- `in_flight` true with a description → "Work is already in flight on this branch — run `/mise:next` with no arguments to continue it; start new work on a fresh branch." Stop.
- `in_flight` false with no description → follow the config's `## Backlog` section and present its top items numbered; no such section → ask "Describe what you want to work on:".
- `in_flight` false with a description → flow.md's **start** section, then `report <mise-dir> --write` to open the run.
- Otherwise act on `next_action`: `step:<name>` → the `<name>` section of `${CLAUDE_SKILL_DIR}/flow.md`; `close` → its **close** section.

## Subagents

Every unit of work is an Agent call with `model: opus` and a prompt naming nothing but: the absolute path of `${CLAUDE_SKILL_DIR}/roles/<role>.md`, every scope and path that role file says its prompt names (absolute), and the absolute path of `.claude/mise-config.md`. Keep what it reports; never pull its sources into your own context.

A scope past 20 files — diff files, task files, docs — goes out in batches of 20, one subagent per batch, each named its own `files N–M` slice; you merge their reports and open none of the files. Take a diff's file count from `git diff --shortstat <default-branch>...HEAD`, never its file list: 20 files of diff leaves a fresh context room for the code around them.

## Output

One status line per step: `<step>: <what ran> — <result>`. What you print to the owner is that line, a question in the format below, or the review summary — never a recap of a file, a diff or a subagent's report.

## Questions

Ask 1–3 related questions per turn, numbered, their choices lettered one per line, so the owner can answer `1a,2c`:

```
1. Where should the retry live?
   - a. In the client wrapper
   - b. In each caller

Recommend: 1a (reply `rec` to take all)
```

Every set ends with the `Recommend:` line — pick one even when torn, and add a reason only where the pick is not obvious. Number any other list the owner might answer by number.

## Stopping

Stop only at: the goals approval, the review stage, a `blocked` subagent, a step that has spent its fix rounds, and a value only the owner holds. Never re-ask what `goals.md`, `spec.md` or the state already records; everywhere else, resolve the next step and run it in the same turn.
