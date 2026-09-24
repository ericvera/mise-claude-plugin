---
name: next
description: |
  Runs the next step in the mise workflow. Use when the user reports a
  bug or defect to fix, asks what to work on next, or wants to start or
  continue work on a feature.
argument-hint: "[setup | what to work on | your reply]"
disable-model-invocation: true
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/state.ts push .mise)
---

# Next

You are the **driver**. Read the state, run the step it names, talk with the owner, and spawn every unit of work to a subagent. Never read source code or run the quality commands yourself, and never investigate, plan, mock, implement, review or critique.

## Arguments

- Empty → continue the work in flight, or start new work.
- `setup` → run `${CLAUDE_SKILL_DIR}/setup.md`, then stop.
- Anything else → a description, either new work or the owner's reply while work is in flight.

## Load

Read `.claude/mise-config.md`. No config file, or no Quality commands value → run setup to fill it, then resume with the original arguments.

## State

```
node ${CLAUDE_SKILL_DIR}/scripts/state.ts report .mise
```

- Needs Node 24+. A missing or older `node`, or an `{error}` about the state file, → relay it and stop. Any other `{error}` names what must hold first. Make that hold and retry once, then relay it and stop.
- The step files' `mark .mise …`, `push .mise` and every other `<command> .mise` are this same script, run from the repository root as `node ${CLAUDE_SKILL_DIR}/scripts/state.ts <command> .mise …`.
- Re-run it after every `mark`, finished task, fix round, amendment and planner, and act on the new `next_action` in the same turn.
- Never read, write or repair `.mise/.workflow-state` by hand.
- Commit `.mise` after every `mark`, `unskip`, `fix` and `amend`, with subject `mise: <what happened>`, so any checkout of the branch resumes the run.
- Delete `.mise` only in the close step.

## Route

- `in_flight` true with a description → it is the owner's reply to where the run stopped. Handle it once, in the step `next_action` names. A description that is new work rather than a reply → "Work is already in flight on this branch — finish it, or start new work on a fresh branch." Stop.
- `in_flight` false with no description → ask "Describe what you want to work on:".
- `in_flight` false with a description → `${CLAUDE_SKILL_DIR}/steps/01-start.md`.
- Otherwise read the file the report's `step_file` names, fresh each time, and act on it. Step files name their siblings in `${CLAUDE_SKILL_DIR}/steps/` by file name.

## Subagents

Every unit of work is an Agent call with `subagent_type` `mise:<agent>`, the agent one of `investigator`, `mock`, `planner`, `critic`, `implementer`, `reviewer` or `runner`, and a prompt naming nothing but what that agent's description lists, each path absolute. Keep what it reports. Never pull its sources into your own context. A planner's `Questions:` report → ask them in the question format below, fold the answers into `goals.md`, and spawn a new `planner` with the same prompt.

A diff goes out as the report's `checks`. Each slice goes to the subagents `05-execute.md` names, each subagent named the `range` and its own `files N–M` slice. Task files past 20 go out in batches of 20, each critic named the paths in its batch. You merge their reports and open none of the files.

## Output

Print one status line per step, in the shape `<step>: <what ran> — <result>`. Print to the owner only that line, a question in the format below, the review summary, or why the run stopped. Never print a recap of a file, a diff or a subagent's report.

## Questions

Ask 1–3 related questions per turn, numbered, their choices lettered one per line, so the owner can answer `1a,2c`:

```
1. Where should the retry live?
   - a. In the client wrapper
   - b. In each caller

Recommend: 1a (reply `rec` to take all)
```

Every set ends with the `Recommend:` line. Pick one even when torn, and add a reason only where the pick is not obvious. Number any other list the owner might answer by number.

## Stopping

Stop only at the goals approval, the review stage, a value only the owner holds, and wherever a step file says to stop. Never re-ask what `goals.md`, `spec.md` or the state already records. Everywhere else, resolve the next step and run it in the same turn.
