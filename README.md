# mise — Claude Code workflow skills

A Claude Code plugin that drives a piece of work — a bug fix, a feature — from description to shipped branch. One flow at every size: a step the work does not need skips itself. Fresh-context Opus subagents implement, review and critique; the driver, on your session model, only routes.

The name comes from _mise en place_ — prep everything before the pan gets hot.

## Install

```
/plugin marketplace add https://github.com/ericvera/mise-claude-plugin
```

```
/plugin install mise@ericvera
```

Requires Node.js 24+ on your PATH — the state engine is TypeScript that Node [runs natively](https://nodejs.org/en/learn/typescript/run-natively), no build step.

### Update

```
/plugin update mise@ericvera
```

## Usage

| Command                       | What it does                                        |
| ----------------------------- | --------------------------------------------------- |
| `/mise:next`                  | Continue the work in flight, or ask what to work on |
| `/mise:next some description` | Start a bug fix or feature from that description    |
| `/mise:next setup`            | (Re)run project configuration                       |

## Configuration

Setup writes `.claude/mise-config.md`. Required: `## Quality commands` — Check and Unit tests, inferred from your package manifest for you to confirm. Optional: `## Mock conditions`, `## Skills & guides`, `## Adherence`. [setup.md](skills/next/setup.md) defines each section.

Nothing else is configurable: work in flight lives in `.mise/` on its branch, committed as it goes so any checkout resumes it; branches are `feat/<slug>` or `fix/<slug>`.

## How it works

One piece of work per branch, nine steps in order. The run waits for you at **goals** and **review**; otherwise it stops only on a failure it cannot fix.

1. **start** — your description becomes `goals.md`, on a new branch.
2. **goals** — questions where a decision is yours, an HTML mock when `## Mock conditions` match, then a statement of at most 3 lines for you to approve.
3. **spec** — a design and one file per task, when the work outgrows one implementer or touches anything hard to undo.
4. **critic** — rounds over the spec, when there is one.
5. **execute** — an `implementer` per task, then a `reviewer` over the whole diff.
6. **adherence** — the diff checked against your own past review notes, one subagent per rule family `## Adherence` names.
7. **review** — `review.md` says what changed and how to verify it. Give feedback in chat, or as Delta Review notes where the `delta:review-notes` skill is installed; a changed decision becomes an amendment that adds tasks instead of restarting the run.
8. **gate** — Check, Unit tests and any required e2e suite.
9. **close** — the branch pushed and a pull request opened.

The mechanics are in [skills/next/flow.md](skills/next/flow.md).

**Caveat:** results are exactly as good as your verification — the workflow leans on your linters, unit tests and e2e coverage to keep unattended steps grounded.

## Development

Load the plugin straight from a checkout:

```
claude --plugin-dir /path/to/mise-claude-plugin
```

Rules for editing the skill files are in [CLAUDE.md](CLAUDE.md). The state engine's tests run with `yarn test`; `yarn typecheck` must pass.

## Credits

Forked from [saeedn/workflow-skills](https://github.com/saeedn/workflow-skills) by Saeed Noursalehi. His original skills — and many conversations with him — heavily inspired this workflow's design.
