# Review

Arriving with the owner's reply → handle it below. Otherwise, when `.mise/review.md` is missing or lacks a line for a task in `tasks/done/`, write it. It holds one line per task (what changed and how to verify it, from the task files and `git log`), then the open assumptions from `goals.md` and `spec.md`, and the amendments so far, at most 60 lines in all. When one line per task would pass 60 lines, write one line per area instead. Print at most 5 lines on what to look at and where, the last saying `/mise:next ship` ends the stage, and stop. The run waits here. Feedback arrives in chat, as `/mise:next`'s argument, or through the `delta:review-notes` skill's contract wherever that skill is installed and the owner says there are notes.

Handle each item by what it changes:

- **point** → group it with the other point fixes and send each group to one implementer, with the files or directories the points concern as `Fix scope:` and the points as `Defects:`.
- **pattern** ("everywhere", "all instances") → spawn an `investigator` on it as a `Pattern:` and show the owner the count. Then send one implementer the files it lists as `Fix scope:`, and the pattern and any instances it lists as `Defects:`.
- **decision** → an amendment, by `amendments.md`, then the new tasks through execute.
- **voided** (the approach no longer applies) → offer a re-plan, as an amendment, once. The owner chooses.

A pattern item, or one the owner says has come up before → offer once to add it to `.claude/common-oversights.md`. On yes, append it as a numbered entry and commit it with the fix. The rule is one line a reviewer can check against a diff, with a wrong and a right example under it when the rule alone is not clear:

```markdown
3. Snapshots are inline, never in `.snap` files.
   - Wrong: `expect(result).toMatchSnapshot()`
   - Right: `expect(result).toMatchInlineSnapshot()`
```

State a factual objection once, briefly, then do what the owner decides. The stage ends when the owner says done, accept or ship. Then `mark .mise review done`.
