# mise — Claude Code workflow skills

A Claude Code plugin that drives a piece of work — a bug fix, a feature — from description to shipped branch. One flow at every size: each step checks whether the work needs it and skips itself when it does not. Fresh-context subagents implement, review, critique and sweep; the driver only routes.

The name comes from _mise en place_ — prep everything before the pan gets hot.

v3 was cut from two months of measured runs: every surviving instruction cites the run evidence that earned it ([docs/line-evidence.md](docs/line-evidence.md)). What did not earn its cost — a documenter pass, an acceptance subagent, a per-run retrospective, a checklist every role re-answers, and resets when an early document changes — is gone.

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

| Command                       | What it does                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `/mise:next`                  | Continue the work in flight, or pick new work from your backlog              |
| `/mise:next some description` | Start a bug fix or feature from that description                             |
| `/mise:next quick …`          | Same, skipping the goals questions, the spec, the critic and per-task review |
| `/mise:next full …`           | Same, skipping nothing                                                       |
| `/mise:next setup`            | (Re)run project configuration                                                |
| `/mise:retro`                 | Tally the run ledgers and propose changes under the change protocol          |

Project details live in the generated `.claude/mise-config.md`. Required: `Mise directory`, `Branch convention`, `Ship`, and the `## Quality commands` (Format, Check, Unit tests; optional Task tests and Build). Optional sections: `## Mock conditions`, `## Mock guidance`, `## Test exceptions`, `## Skills & guides`, `## Adherence`, `## Ledger`, `## Backlog`, `## Review notes`. Setup asks only for the required values.

## How it works

One piece of work per branch. The ten steps run in order; each has a **skip condition** the driver answers at the start and again after any amendment.

| Step               | Skips when                                | What runs                                                                                                                                                                                                                  |
| ------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **start**          | never                                     | your description goes to `goals.md` verbatim; branch per your convention; bug fix or feature                                                                                                                               |
| **goals** _(you)_  | no decision only you can make, and not UI | one round of questions at a time; an HTML mock when `## Mock conditions` match; your approval                                                                                                                              |
| **spec**           | the work fits one implementer's context   | `spec.md` (What, Design, Hard-to-undo, Task index) and one file per task; a `requirements.md` only past 8 tasks; up to 3 `explore` subagents for facts                                                                     |
| **critic**         | no spec and nothing hard to undo          | rounds over the spec; stops when a round finds nothing new that blocks; hard cap 5                                                                                                                                         |
| **execute**        | never                                     | per task: `implementer` (a bug fix's regression test first, seen to fail) → task tests → `reviewer` (per task when the work spans 3+ modules, else over the whole diff in 20-file batches) → at most 2 fix rounds → commit |
| **adherence**      | no `## Adherence` section                 | one `adherence` subagent per rule family per 20-file batch of the diff, file by file, against your own past review notes; fixes until its log is clean                                                                     |
| **sweep**          | never                                     | one `sweep` subagent: things the spec retires are gone; instruction and config files the diff never touched are still right                                                                                                |
| **review** _(you)_ | never                                     | `review.md` — one line per task, 60 at most — says what changed and how to verify it; the run waits until you say done                                                                                                     |
| **gate**           | never                                     | Build, Format, Check, Unit tests, e2e through its required guide — once, one repair, one re-run                                                                                                                            |
| **close**          | never                                     | ledger copied to `## Ledger`; mise directory removed; ship per `Ship`                                                                                                                                                      |

**Review stage.** Feedback is handled by what it changes: a **point** fix is batched; a **pattern** ("everywhere") is listed in full before it is fixed; a changed **decision** becomes a dated amendment to the spec, and only the affected work becomes new tasks — finished tasks stay finished, nothing is re-approved or re-critiqued; a **voided** approach gets one offer of a re-plan, your call. The model states a factual objection once, then does what you decide.

**Adherence.** The step for the defects written rules do not stop. `## Adherence` names rule families (tests, comments, vocabulary…), each pointing at a file of your verbatim past review notes grouped by sub-pattern with the code shape that drew them — keep each under ~150 lines, since every subagent reads it whole. A fresh-context subagent per family and batch reads the diff file by file, cites the matching example for each hit, and logs a row per flagged file, never one per passing file. Lint what lint can catch first; the vocabulary family also checks new terms against a glossary.

**Ledger.** Every run appends `ledger.jsonl`: spawns, findings and whether they changed anything, stops and wait time, your feedback verbatim, skips, amendments, gate runs. `/mise:retro` never opens a ledger: `state.ts tally` counts them by event, step and detail with the runs and projects each row spans, and the retro applies the change protocol to those rows: an issue is eligible after 3 runs or 2 projects (once, if the harm is irreversible); before any edit — was the rule already in context, can a tool enforce it, is it project or generic, can a line be fixed or deleted instead, which ledger signal will show it worked. Every added line names a line removed. Default outcome: log only. You approve a batch table; the retro never edits files itself.

**Models.** The driver runs on your session model; every subagent is dispatched on Opus.

**Caveat:** results are exactly as good as your verification — the workflow leans on your linters, unit tests and e2e coverage to keep unattended steps grounded.

## Design

- **One flow, self-sizing** — size was a proxy; the questions that matter are whether a decision needs you, whether the work fits one context, and whether anything is hard to undo.
- **Cut by default** — a mechanism stays only while the ledger shows it earning its cost.
- **Artifacts are scaffolding** — committed as work progresses so any checkout resumes it, removed at close.
- **Every artifact and every read is bounded** — whole-diff passes go out in 20-file batches whose summaries the driver merges without opening a file; `adherence.md` lists flagged files only; an implementer reads just the `progress.md` entries its task names; `review.md` is one sitting's reading; the state report returns counts and the next task's path, not lists that grow with the run.

## Development

Load the plugin straight from a checkout:

```
claude --plugin-dir /path/to/mise-claude-plugin
```

Follow [docs/skill-authoring.md](docs/skill-authoring.md) when editing instruction files; each shipped file has a line budget and every line maps to evidence in [docs/line-evidence.md](docs/line-evidence.md). The state engine's tests run with `yarn test`; `yarn typecheck` must pass. The research behind v3 is under the `v3-research` branch (https://github.com/ericvera/mise-claude-plugin/tree/v3-research/docs/v3-research).

## Credits

Forked from [saeedn/workflow-skills](https://github.com/saeedn/workflow-skills) by Saeed Noursalehi. His original skills — and many conversations with him — heavily inspired this workflow's design.
