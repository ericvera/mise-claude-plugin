# Review

## Tasks

- 01_01 (f9145bd): one paragraph added after line 3 of `skills/next/steps/06-review.md`, saying feedback from any skill the owner invokes at the review stage is handled by the step's rules and the driver never follows that skill's instructions to change code. `version` in `.claude-plugin/plugin.json` goes from 3.0.0 to 3.0.1. Verify: `git diff origin/main...HEAD -- skills .claude-plugin` shows only those two changes, and the new paragraph names no skill.

## Open assumptions

- `implement_task` means the `implementer` agent; "close-out" means the close step.
- 6h8jQ7jCHm449mjm (commit conventions) is dropped: nothing in mise parses the implementer's commit messages, and the owner squash-merges.
- No run in flight: `/delta:review-notes` used directly is the right path, so nothing changes there.
- A session that never ran `/mise:next` is out of scope: the owner inits with a bare `/mise:next` first, so no line is added to the guard setup writes into `CLAUDE.md`.
- Replies to notes in delta's responses file work today, per the owner, so nothing changes there.
- The `version` bump is a patch.
- No README change: the rule adds no step or config section and does not change where the run waits.
- The rule's effect was not tried in a live session. No test covers skill-file prose.

## Follow-ups outside this run

- Delta repository: "[infra] make delta review-notes defer to the session's harness: when one is driving, hand it the notes and act only as the notes and responses format".

## Amendments

None.
