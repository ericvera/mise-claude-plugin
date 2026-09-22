# mise-config reference

Setup's reference for `.claude/mise-config.md`, never copied into a project. The file holds values only — no instructional prose — because every step and every fresh-context subagent reads it. The `##` sections, in this order:

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
