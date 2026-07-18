# mise — Claude Code workflow skills

A Claude Code plugin for building complex features autonomously. You describe the goal up front; requirements, planning, and execution run unattended, with fresh-context critic and reviewer agents checking the work at every stage.

The name comes from _mise en place_ — prep everything before the pan gets hot.

## Install

```
/plugin marketplace add https://github.com/ericvera/mise-claude-plugin
```

```
/plugin install mise@ericvera
```

Requires Node.js 24+ on your PATH — the workflow's [state engine](docs/state-machine.md) is TypeScript that Node 24+ [runs natively](https://nodejs.org/en/learn/typescript/run-natively), no build step.

### Update

```
/plugin update mise@ericvera
```

## Usage

The plugin exposes a single command. The first run in a project walks you through configuration; `/mise:next setup` revisits it later. All project-specific details (paths, branch convention, commands, mock conditions, test exceptions) live in the generated `.claude/mise-config.md` — the skill itself stays project-agnostic.

| Command                       | What it does                                                 |
| ----------------------------- | ------------------------------------------------------------ |
| `/mise:next`                  | Run the next stage of the work in flight (or start new work) |
| `/mise:next some description` | Start a new feature or bug fix from that description         |
| `/mise:next ?`                | Describe the next stage without running it                   |
| `/mise:next setup`            | (Re)run project configuration                                |

You can also just describe a bug or ask "what should I work on next?" in plain chat.

## How it works

One piece of work per branch, driven entirely by `/mise:next` — starting new work creates the branch from your configured naming convention (or offers to reuse the branch you're on). You're needed at exactly two points — everything in between runs unattended, for hours if needed.

1. **Goals** _(human gate)_ — a conversation that critiques your goal, asks one batched round of questions, and iterates on an HTML mock when configured. You approve once.
2. **Requirements** — generated from the goals and mock, assumptions recorded explicitly, self-approved by a critic agent.
3. **Plan** — a fine-grained implementation plan with full-context task files, self-approved by a critic agent.
4. **Execute** — each task runs in a fresh-context subagent, is reviewed, committed, and tracked so the run can resume from any checkout.
5. **Acceptance** _(human gate)_ — a requirement-by-requirement checklist; on your confirmation the working docs are cleaned up. The output is the shipped code and tests.

Bug fixes take a shortened route: a bug-understanding conversation, then a fixed test-driven plan — write the failing regression test, then fix without touching it.

The same workflow by actor — the USER column is active exactly twice, at the two human gates:

```text
  USER                  |  ORCHESTRATOR                     |  SUBAGENTS
------------------------+-----------------------------------+--------------------
  describe the work ----|--> goals conversation (+ mock)    |
  [? approve goals? ] <-|--- present goals (+ mocks)        |
    feedback -----------|--> revise, present again (loop)   |
    explicit yes -------|--> approve goals, commit          |
                        |  - - - unattended from here - - - |
                        |  write requirements --------------|--> critic: severity-tagged defects
                        |  revise on blockers, commit <-----|---- (stall: no progress / 5 rounds)
                        |  write plan ----------------------|--> critic (same loop)
                        |                                   |
                        |  for each task: dispatch ---------|--> implementer, then reviewer
                        |                                   |      (defects --> fix subagent)
                        |  task done, commit (loop)         |
                        |                                   |
                        |  acceptance pass -----------------|--> checker: per-item verdicts
  [? confirmed? ] <-----|--- present the checklist          |
    items wrong --------|--> fix, re-run acceptance (loop)  |
    confirmed ----------|--> cleanup: delete mise dir, done |
------------------------+-----------------------------------+--------------------
```

**Caveat:** the results are exactly as good as your verification. The workflow leans hard on linters, unit tests, and especially end-to-end coverage to keep long autonomous runs grounded.

## Design

mise targets the tier of work beyond what a single prompt or Claude Code's plan mode handles well:

1. **Trivial** — one-shot prompt.
2. **Moderate ambiguity** — plan mode asks clarifying questions and plans before coding.
3. **Complex feature** — needs externally imposed rigor. This is what mise is for.

The design follows three principles:

- **Optimize for autonomous runs.** Much of the machinery exists so the work can run overnight and progress unattended for hours at a time.
- **Force thinking at the correct level.** Left alone, an agent jumps straight into coding. The stages focus it on one layer at a time: goals, requirements, design, implementation.
- **Create artifacts at each step.** Artifacts enable review, avoid over-reliance on context, and provide natural rewind checkpoints. They are scaffolding, not deliverables: committed to the feature branch as work progresses (so a dead machine costs nothing and any checkout resumes the work), then removed in a final cleanup commit. The durable output is the code, its tests, and the git history.

## Development

Load the plugin straight from a checkout:

```
claude --plugin-dir /path/to/workflow-skills
```

When editing or adding skill and instruction files, follow the conventions in the [skill authoring guide](docs/skill-authoring.md). The state engine's specification lives in [state-machine.md](docs/state-machine.md); its tests run with `node --test skills/next/scripts/state.test.ts`.

## Credits

Forked from [saeedn/workflow-skills](https://github.com/saeedn/workflow-skills) by Saeed Noursalehi. His original skills — and many conversations with him — heavily inspired this workflow's design.
