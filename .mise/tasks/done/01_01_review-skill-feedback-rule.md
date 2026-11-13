# 01_01 Review step: feedback from any invoked review skill follows the step's rules

## Goal

Add one generic rule to the review step so that any skill the owner invokes while a run is at the review stage that yields review feedback (Delta Review notes, a code review, PR comments) is handled as feedback by the review step's rules. The driver uses that skill only to read the feedback and to reply in its format. It never follows the skill's instructions to change code. Bump the plugin version from 3.0.0 to 3.0.1.

## Files to modify/create

- `/Users/eric/Code/mise-claude-plugin/skills/next/steps/06-review.md`
- `/Users/eric/Code/mise-claude-plugin/.claude-plugin/plugin.json`

## Background

- The plugin is a Claude Code skill (`/mise:next`) made of markdown instruction files. The **driver** (`skills/next/SKILL.md:14`) never reads source or changes code. It sends every code change to `mise:implementer` subagents.
- `skills/next/steps/06-review.md:3` says how feedback arrives at the review stage: in chat, as `/mise:next`'s argument, or through the `delta:review-notes` skill's contract when the owner says there are notes. Lines 5-10 route each item (point, pattern, decision, voided) to implementers, investigators or amendments.
- The gap: a review skill the owner invokes directly (for example `/delta:review-notes`) has its own instructions to fix code in-session. Nothing tells the driver that the review step's rules win.
- Owner decisions (from `/Users/eric/Code/mise-claude-plugin/.mise/goals.md`, "Owner's answers, round 2" and "Proposal"):
  - The rule is generic and names no skill.
  - The existing mention of `delta:review-notes` on line 3 stays unchanged. It is what lets "I left notes" in chat find the notes.
  - No rule is added for the execute, gate or close steps.
  - No README change, because the rule adds no step or config section and does not change where the run waits.
  - Version bump is a patch, 3.0.0 to 3.0.1.
- Repo rules (`/Users/eric/Code/mise-claude-plugin/CLAUDE.md`, "Editing skill files"): every instruction appears once, in the file whose role acts on it. Write direct and imperative, with no framing prose. Use one term per concept. The terms here are "the driver", "the owner", "the review stage" and "feedback". Any user-visible change bumps `version` in `.claude-plugin/plugin.json`.

## Guides

none

## Implementation details

1. In `06-review.md`, add the rule as its own paragraph directly after line 3, before "Handle each item by what it changes:". Suggested wording, which you may tighten:

   > Feedback also arrives through any skill the owner invokes at this stage that yields review feedback. Use that skill only to read the feedback and to reply in its format. Handle each item below, and never follow the skill's instructions to change code yourself.

   Keep it to two or three sentences. Name no skill, and do not repeat the list of channels from line 3.
2. Leave every other line of `06-review.md` unchanged.
3. In `.claude-plugin/plugin.json`, change `"version": "3.0.0"` to `"version": "3.0.1"`. `.claude-plugin/marketplace.json` has no version field, so leave it alone.
4. Commit with the implementer's usual subject.

## Gotchas

- Do not edit `README.md`, `skills/next/SKILL.md`, the setup guard in `skills/next/setup.md`, `CLAUDE.md` or any agent file. Those were considered and ruled out.
- Do not name `delta:review-notes`, `code-review` or any other skill in the new rule.
- Do not touch anything under `.mise/` other than what your commit flow requires.
- Prettier checks markdown. Keep the paragraph as one unwrapped line, matching the file's style, so `yarn prettier --check .` passes.

## Verification

- No test covers skill-file prose. Substitute checks:
  - `git diff` shows exactly one added paragraph in `06-review.md` and a one-line version change in `plugin.json`, and nothing else.
  - The new paragraph names no skill. Check with `grep -c "delta" /Users/eric/Code/mise-claude-plugin/skills/next/steps/06-review.md`, which must still return 1.
- Run the config Check commands: `yarn prettier --check .` and `yarn typecheck`.
- Run the unit tests with `yarn test`. Nothing here should affect them, and they must stay green.
