# Shared interaction conventions

These conventions apply to every stage of the workflow. This file owns the conversation side — how gates run and how questions are asked; state semantics (approval hashes, the cascade, task completion) are the state engine's, and its reports say everything a stage needs.

## Gates

There are exactly two **human gates**: the goals(+mock) gate at the start, and the acceptance pass at the end. Every stage in between self-approves through the critic gate below and continues in the same session — the user is never asked to approve requirements or plans.

### The human gate (goals stage only)

1. After presenting the artifacts (and any revisions), ask explicitly: "Approve goals<and mocks, when present>, or what should change?"
2. **Feedback, questions, or silence are NOT approval.** Revise and re-present until the user says yes. Never advance on an unapproved artifact.
3. On explicit approval, run `node ../scripts/state.ts approve <mise-directory> goals route=<full|direct|bugfix>` (then `... approve <mise-directory> mock` when the route is `full`) — the route is recorded atomically with the goals approval, so decide it before gating. The engine hashes the artifact and records the approval; on a **changed re-approval** (the new hash differs from the recorded one) it also deletes every later stage's approval, since downstream docs were built against the previous version (first approvals and unchanged re-approvals delete nothing).
4. Commit the mise directory (artifacts plus `.workflow-state`), e.g. `mise: approve goals`.
5. Continue in-session: re-run the state engine report and dispatch the next stage without ending the turn.

### The critic gate (requirements and plan stages)

1. After writing the artifact, dispatch a **fresh-context critic subagent** (general-purpose Agent, run synchronously). Its prompt: read the artifact and the upstream doc(s) the dispatching stage names, plus any matching Skills & guides entries from `.claude/mise-config.md`, and report a list of concrete defects — the stage names what to check for — each tagged **blocking** (downstream stages would build the wrong behavior), **minor**, or **informative**. Ignore cosmetic nits.
2. **Pass = a report with zero blocking findings** — a fresh critic can always find _something_, so "no findings at all" is never the bar. Apply any minor findings worth fixing, without re-dispatching a critic over them.
3. Blocking findings → revise and re-dispatch a fresh critic. **Stall** when a revision round fails to reduce the blocking count below the previous round's (the fixes aren't converging), or after **5 rounds** total as a backstop.
4. At a stall, stop and present the artifact, the per-round blocking counts (the trend, not the raw defect list, is the user's decision signal), and the remaining blocking defects — an honest stall beats looping.
5. On a pass, run `node ../scripts/state.ts approve <mise-directory> <stage>`, commit the checkpoint (e.g. `mise: approve requirements`), and continue in-session to the next stage.
6. If approving `plan` returns `cleared_done`, the engine deleted `implementation_plan/done/` — those tasks were completed under a different plan version, their work is already in the repo (git keeps the files' history), and the revised plan was written against that reality, so its tasks are all pending by definition. Just mention the cleared IDs in the checkpoint report.

### Assumptions instead of questions

Stages past the goals gate never ask clarifying questions. Infer defaults from the goals, mocks, codebase, and `.claude/mise-config.md`, and record every non-obvious inference in an **Assumptions** section of the artifact so it is reviewable and covered by the stage's approval hash. Stop and ask only on a genuine blocker: a contradiction between docs, or missing information that no reasonable default resolves.

## Asking the user questions

- Ask in small chunks: **1–3 related questions per turn**. Never dump a wall of questions.
- Number each question (`1.`, `2.`, `3.`).
- Letter each question's answer choices (`a.`, `b.`, `c.`).
- Put each lettered option on its own line (one option per line, not inline).
- This lets the user reply with a compact form like `1a,2c,3a`.

Example:

```
1. Where should X live?
   - a. Inside foo.ts
   - b. As a new module bar.ts
   - c. Inline in the caller

2. Should we add tests?
   - a. Yes
   - b. No
```

## Recommendations

Always end your numbered/lettered questions with a recommendation line so the user can accept your read in one reply. If you're genuinely torn, still pick one and say so.

```
Recommend: 1a, 2a, 3c
```

Add a brief reason after any pick that isn't obvious (`1a — keeps the change scoped to the existing module`); skip rationale otherwise.

## Other lists

For any list the user might pick from or refer back to, use numbered items (`1.`, `2.`, `3.`) — not bullets — so they can respond by number.
