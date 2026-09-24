# mise — Claude Code workflow skills

A Claude Code plugin that drives a piece of work, a bug fix or a feature, from description to shipped branch. One flow at every size. Steps the work does not need are skipped once you approve the proposal. Fresh-context Opus subagents read the code, plan, build mocks, implement, review, critique and run your quality commands. The driver, on your session model, talks with you and routes the work, and reads no code itself.

The name comes from _mise en place_, the kitchen practice of preparing everything before cooking starts.

## Install

```
/plugin marketplace add https://github.com/ericvera/mise-claude-plugin
```

```
/plugin install mise@ericvera
```

Requires Node.js 24+ on your PATH. The state engine is TypeScript that Node [runs natively](https://nodejs.org/en/learn/typescript/run-natively), with no build step.

Assumes [auto mode](https://code.claude.com/docs/en/permission-modes). The skill pre-approves only the one command auto mode blocks, the gate's force push with lease after its rebase. That push refuses `main`, `master` and your remote's default branch. In any other mode the run stops on permission prompts.

### Update

```
/plugin update mise@ericvera
```

## Usage

| Command                       | What it does                                        |
| ----------------------------- | --------------------------------------------------- |
| `/mise:next`                  | Continue the work in flight, or ask what to work on |
| `/mise:next some description` | Start a bug fix or feature from that description    |
| `/mise:next your reply`       | Answer the run while it waits for you               |
| `/mise:next setup`            | (Re)run project configuration                       |

## Configuration

Setup writes `.claude/mise-config.md`. `## Quality commands` is required, and holds Check and Unit tests, inferred from your package manifest for you to confirm. `## Mock conditions` and `## Skills & guides` are optional. [setup.md](skills/next/setup.md) defines each section.

Nothing else is configurable. Work in flight lives in `.mise/` on its branch, committed as it goes so any checkout resumes it. New branches are `feat/<slug>` or `fix/<slug>`.

## How it works

One piece of work per branch, eight steps in order. The run waits for you at **goals** and **review**, and whenever it needs an answer only you hold. Otherwise it stops only when something fails.

1. **start** turns your description into `goals.md`, on its own branch.
2. **goals** has an `investigator` read the code, asks the questions where a decision is yours, adds an HTML mock when `## Mock conditions` match, then gives you a proposal of at most 3 lines to approve.
3. **spec** has a `planner` write a design and one file per task, when the work outgrows one implementer or touches anything hard to undo.
4. **critic** runs rounds over the spec, when there is one.
5. **execute** runs an `implementer` per task, then `reviewer`s over the whole diff at once, with fix rounds.
6. **review** gives you `review.md`, which says what changed and how to verify it. Give feedback in chat, or as Delta Review notes where the `delta:review-notes` skill is installed. A changed decision becomes an amendment that adds tasks instead of restarting the run. Feedback you keep repeating can become an entry in `.claude/common-oversights.md`, which implementers follow and reviewers enforce.
7. **gate** rebases the branch onto the latest remote base and force-pushes it with lease, then runs Check, Unit tests and any required e2e suite.
8. **close** pushes the branch and opens a pull request, unless you asked for something else.

The mechanics are in [skills/next/steps/](skills/next/steps/), one file per step.

Results are exactly as good as your verification. The workflow depends on your linters, unit tests and e2e coverage to check the unattended steps.

## Development

Load the plugin straight from a checkout:

```
claude --plugin-dir /path/to/mise-claude-plugin
```

Rules for editing the skill files are in [CLAUDE.md](CLAUDE.md). The state engine's tests run with `yarn test`, and `yarn typecheck` must pass.

## Credits

Forked from [saeedn/workflow-skills](https://github.com/saeedn/workflow-skills) by Saeed Noursalehi. His original skills, and many conversations with him, heavily inspired this workflow's design.
