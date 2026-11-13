Investigate the following tasks. Do not take them as required. Investigate first whether they make sense from your own critical perspective.

6hJM2m6f9wr9cmwm [infra] warm up a mise session so it handles delta review-note fixes with its own config
6hJJxc58hWWR6CHm [infra] add a review-notes step to mise before close-out
6hJJxgQqVpQ8M5gm [infra] show mise retrospective changes for approval before commit and push
6h8jQ7jCHm449mjm [infra] make mise implement_task defer to project commit conventions

## Investigation

Investigation of the 4 infra tasks against v3 (3.0.0). Not a bug fix, so nothing to reproduce.

1. Task 6hJJxgQqVpQ8M5gm (show retrospective changes for approval) is obsolete. The retrospective role was `skills/next/roles/retrospective.md` and was deleted in c0f1214 (3.0.0). No tracked file outside `.mise/` mentions a retrospective. The closest v3 feature is the opt-in `.claude/common-oversights.md` entry, which already asks the owner first (skills/next/steps/06-review.md:12).
2. Task 6h8jQ7jCHm449mjm (`implement_task` should defer to commit conventions) refers to a role removed in 57655da (2.0.0). Its v3 equivalent still hardcodes the commit subjects `Task <id>: ...` and `Fix: ...` and a two-line body (agents/implementer.md:18). Nothing in the implementer tells it to read project commit conventions.
3. For point 2: state.ts never parses `Task`/`Fix` subjects. Its only subject dependency is the `mise:` checkpoint (skills/next/scripts/state.ts:55, skills/next/SKILL.md:36). So only the implementer's subjects could follow project conventions. `mise:` must stay.
4. For point 2: review.md lines are built from task files plus `git log` (06-review.md:3), so subjects do not need to carry the task id. Commit conventions are meant to live in `CLAUDE.md` (skills/next/setup.md:43).
5. Task 6hJJxc58hWWR6CHm (review-notes step before close) is mostly done already. The review step takes `delta:review-notes` feedback when the owner says there are notes (06-review.md:3), and the README says so (README.md:51). Order is review, then gate, then close (state.ts:39-41), so notes are handled before close.
6. For point 5: a separate step would also mean changing STEPS (state.ts:39) and its validation (state.ts:162, 396, 435), plus state.test.ts and README.md:44-53. It would duplicate the review stage, which goes against the one-instruction-per-file rule in CLAUDE.md.
7. Task 6hJM2m6f9wr9cmwm (warm up a session so delta note fixes use mise's config) is covered inside a run. There, review notes go to `implementer`s with the mise config as point or pattern fixes (06-review.md:7-8, agents/implementer.md:9).
8. For point 7: outside a run (after close, or with no `.mise/`), notes have no mise path. The Route treats a description with `in_flight` false as new work (SKILL.md:44-46). That gap is all that is left of the task, and it is unclear whether it fits the one-run-per-branch model (README.md:44).
9. Nothing in these tasks is hard to undo, and none changes a public API or migrates data. Any change the user can see must bump `version` in `.claude-plugin/plugin.json` (CLAUDE.md). Adding a step must update README.md in the same run.
10. Where `goals.md` conflicts with the code: it uses 2.x terms (`implement_task`, retrospective, close-out) that v3 no longer has (c0f1214, 57655da). In the code's terms these are the `implementer` and the close step.
11. What the code suggests: drop point 1 and fold point 5 into the existing review stage, both as already done. Point 2 is a one-line change to implementer.md:18. Point 7 needs an owner decision on scope.

## Owner's answers, round 1

- 6hJJxgQqVpQ8M5gm (retrospective) and 6hJJxc58hWWR6CHm (separate review-notes step): dropped.
- 6h8jQ7jCHm449mjm (commit conventions): the owner squash-merges, so the implementer's commit messages do not matter to them. The task is worth doing only if mise itself derives something from those messages. To establish in a second investigation: does anything in mise (state.ts, any step file, any agent file, the reviewer in particular) read or depend on the subject or the body of the implementer's commits, beyond the `mise:` checkpoint subject? What does the two-line body carry, and who reads it?
- 6hJM2m6f9wr9cmwm (warm up), restated by the owner: "start a new Claude session on an active mise project and somehow the notes should execute the same as if I would have ran the notes skill within a mise Claude session." To establish in a second investigation, for a fresh Claude session that has none of the driving session's context:
  - Run in flight at the review stage: what does `/mise:next` with a description saying there are Delta Review notes do, step by step, and does it differ in any way from the same reply given in the session that drove the run?
  - Run in flight at any other step (execute, gate, close): what happens to that same description?
  - No run in flight (after close, or a project with a mise config and no `.mise/`): what happens?
  - `/delta:review-notes` invoked directly, without `/mise:next`, in each of those states: does anything route the fixes through mise's `implementer`s and the mise config, or tell the owner to use `/mise:next` instead?
  - What is the smallest change, if any, that closes each gap found, and what would it cost in the terms CLAUDE.md sets (one instruction per file, README and version updates)?

## Investigation, round 2

Read-only. Nothing to reproduce. Traced by reading the code; no live session was run.

1. Commit messages, part 1: state.ts never reads a commit subject or body. Its git calls are only symbolic-ref, diff --name-only, rev-parse, branch and push (skills/next/scripts/state.ts:104,335,421,460,500,515,522). Its one subject reference is the `mise:` hint (state.ts:55). state.test.ts checks only a test-made subject (state.test.ts:751).
2. Commit messages, part 2: the reviewer reads the diff and the `tasks/done/` files, not `git log` (agents/reviewer.md:13). The implementer's report already gives the driver the hash and every deviation (agents/implementer.md:20).
3. Commit messages, part 3: the only thing that reads them is the driver, which writes `review.md` "from the task files and `git log`" (skills/next/steps/06-review.md:3). The body's `Key changes`/`Deviations` (implementer.md:18) repeat the task file and the report. `Fix:` commits have no task file, so `git log` is the only record of what they changed. Following project conventions breaks nothing mechanical, but a `review.md` line can no longer be matched to a task id by subject.
4. Fresh session at the review stage, `/mise:next <there are notes>`: it reads the config (SKILL.md:24), runs report (SKILL.md:29), then `in_flight` plus a description counts as a reply to the step (SKILL.md:41). From there it goes to 06-review.md:3, the delta contract, and then point, pattern, decision or voided to `implementer`s with the config (06-review.md:7-10). Every input is on disk, so this matches the driving session. A bare `/mise:next` just reprints the review summary and stops (06-review.md:3).
5. Gap in both sessions: delta requires one note at a time with an immediate response, never batched (delta 0.7.0 SKILL.md:147-149). Its anchor snapshot must be the exact current text of the line (SKILL.md:109). mise instead groups point fixes per implementer (06-review.md:7). The driver may not read source (SKILL.md:14), and the implementer's report returns no anchors (implementer.md:20). Nothing in mise says who writes the responses file.
6. Execute: a reply is handled only when blocking findings have outlived the fix rounds (05-execute.md:9). Any other time, nothing handles the notes; it is left to the driver's guess.
7. Gate: a reply is handled only after a second failure (07-gate.md:5).
8. Close: `next_action` "close" sends the reply to 08-close.md, which has no reply handling (08-close.md:3). The driver may go ahead with `git rm .mise`, push and the PR while ignoring the notes. That is the one risky path.
9. No run in flight: a description starts a new run (SKILL.md:43). It is written verbatim to goals.md, and on a branch with commits it asks whether to use it or branch from it (01-start.md:3-4). After close the notes still exist, because the delta files are keyed by branch (delta SKILL.md:35).
10. `/delta:review-notes` called directly, in any state: delta fixes the notes in-session "following project conventions" (delta SKILL.md:147) and never mentions mise. mise's only text in a project's CLAUDE.md is the PR guard (setup.md:47-49). Nothing sends the fixes to `implementer`s or points the owner to `/mise:next`.
11. Fix for point 10: add a sentence to the guard setup.md writes, for example "while `.mise/` exists, give review notes to `/mise:next`". This means editing setup.md:49 and this repo's CLAUDE.md:3, and existing users must re-run setup (setup.md:47 replaces the old guard). No README change (it is not a section or step); bump the version.
12. Fix for points 6-8: one Route line saying review feedback that arrives at a step with no reply handling goes through 06-review.md (SKILL.md:41). If gate and close count as places the run waits, README.md:46 needs updating. Bump the version.
13. Fix for point 5: notes need ids passed through `Defects:` and a responses writer named in a role file. The implementer would have to carry the delta contract (agents are self-contained, CLAUDE.md "Editing skill files"), or the driver would need anchors from the implementer's report. Each option touches 06-review.md and implementer.md, plus a version bump.
14. Point 9 lies outside the one-run-per-branch model (README.md:44). The smallest fix is none: direct delta use is the right path there.

Delta contract read from: /Users/eric/.claude/plugins/cache/delta-review/delta/0.7.0/skills/review-notes/SKILL.md

## Owner's answers, round 2

- The owner's flow in a fresh session: a bare `/mise:next` at the review stage is the "init" (it reloads the run from `.mise/`, prints the review summary and waits), then the owner invokes `/delta:review-notes`.
- Decided: `/delta:review-notes` invoked in a session driving a run at the review stage is review feedback. mise stays in charge: the driver uses the delta skill only as the notes contract and handles each note by the review step's rules (implementers, mise config), never fixing code itself as delta's default tells it to. The rule goes in mise's review step. The owner also owns delta, so a delta-side change is available if the mise-side rule cannot hold on its own.
- Saying "I left notes" in chat, or as `/mise:next`'s argument, already works and stays.
- Owner's later ask: the rule is generic to any form of review, not specific to `delta:review-notes`. It names no skill.
- Out of scope: notes handed over while the run is at execute, gate or close. The owner only leaves notes at the review stage, so no rule is added for those steps.

## Follow-ups outside this run

- Owner's idea, for the delta repository: a task for `delta:review-notes` to follow the rules of whatever harness is driving the session. Proposed wording: "[infra] make delta review-notes defer to the session's harness: when one is driving, hand it the notes and act only as the notes and responses format". It complements the mise-side rule decided in round 2 and cannot be built in this repository.

## Open questions

## Proposal

- Issue: a review skill the owner invokes in a session driving a run at the review stage (`/delta:review-notes`, a code review, PR comments) brings its own instructions to change code, while mise says the driver never touches code. Nothing says which wins.
- Approach: one generic rule in `skills/next/steps/06-review.md`, naming no skill: whatever the owner invokes at the review stage that yields review feedback is feedback handled by the step's rules. The driver uses that skill only to read the feedback and to reply in its format, and never follows its instructions to change code. The step's existing mention of `delta:review-notes` stays, because it is what lets "I left notes" in chat find the notes. Plus a `version` bump in `.claude-plugin/plugin.json`. The other three tasks are dropped and the delta-side task is a follow-up.
- Skips: spec and critic.

## Assumptions

- Replies to notes in delta's responses file work today, per the owner, so nothing changes there (investigation round 2, points 5 and 13 are dropped).
- The `version` bump is a patch, 3.0.0 to 3.0.1.
- No README change: the rule adds no step or config section and does not change where the run waits.

- 6h8jQ7jCHm449mjm (commit conventions) is dropped: nothing in mise parses the implementer's commit messages, and the owner squash-merges.
- No run in flight: `/delta:review-notes` used directly is the right path, so nothing changes there.
- A session that never ran `/mise:next` and gets `/delta:review-notes` on a branch with a run in flight is out of scope: the owner inits with a bare `/mise:next` first, so no line is added to the guard setup writes into `CLAUDE.md`.

- `implement_task` means the `implementer` agent; "close-out" means the close step.
- The `mise:` checkpoint subject stays as is; only the implementer's `Task`/`Fix` subjects are in question.
