# Setup

Interview the owner, then write `.claude/mise-config.md` in the shape below. An existing config is revisited section by section, its current value shown.

## Config shape

The file holds values only — never this file's prose — because every step and every fresh-context subagent reads it. The `##` sections, in this order:

```markdown
# Mise Configuration

## Quality commands

- Check:
  - yarn lint
  - yarn typecheck
- Unit tests: yarn test

## Adherence

- tests: .claude/adherence/tests.md
- vocabulary: .claude/adherence/vocabulary.md, glossary: docs/design/naming.md
```

Required:

- **Quality commands** — Check (lint, typecheck, formatting and the build where the project has them) and Unit tests. Each slot is one command or a nested list run in order; these are run commands only.

Optional — omit what does not apply. A body is inline values or a pointer to a project doc or skill (`See docs/testing.md`), which its reader follows:

- **Mock conditions** — bulleted conditions deciding whether the goals step builds a mock.
- **Skills & guides** — one entry per line, `name-or-path (skill|doc[, required]): when to use`; `required` means it must never be bypassed.
- **Adherence** — one rule family per line, `- <family>: <examples file>[, glossary: <path>]`. The examples file holds the owner's verbatim past review notes for that family, grouped by sub-pattern, each with the code shape that drew the note; keep it under ~150 lines, because every adherence subagent reads it whole. No section, no adherence step.

## Interview

Ask one question, in SKILL.md's question format: confirm the Quality commands, inferred from `package.json` or the repo's equivalent.

Then list the optional sections by name, say any of them can be filled later by re-running `/mise:next setup`, and fill now only the ones the owner names.

Write the file with the sections filled and nothing else, print it, and confirm it is right. Code conventions the owner offers along the way belong in `CLAUDE.md` — offer to add them there.

Then ensure `CLAUDE.md` carries this line (creating the file if needed, replacing any earlier mise guard rather than adding a second):

> Never open a pull request for, or merge into another branch, any branch whose tree contains `.mise/` — that work is still in flight; run `/mise:next` on that branch to finish it first.

Commit the config and the guard together: `mise: setup`.
