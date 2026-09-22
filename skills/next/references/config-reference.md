# mise-config reference

Setup's reference for `.claude/mise-config.md`, never copied into a project. The file holds values only — no instructional prose — because every step and every fresh-context subagent reads it. `Ship` first where it is written, then the `##` sections, in this order:

```markdown
# Mise Configuration

Ship: merge (squash)

## Quality commands

- Format: yarn format
- Check:
  - yarn lint
  - yarn typecheck
- Unit tests: yarn test

## Adherence

- tests: .claude/adherence/tests.md
- vocabulary: .claude/adherence/vocabulary.md, glossary: docs/design/naming.md
```

Required:

- **Quality commands** — Format, Check (lint, typecheck and the build where the project has one), Unit tests. Each slot is one command or a nested list run in order; these are run commands only.

Optional — omit what does not apply. A body is inline values or a pointer to a project doc or skill (`See docs/testing.md`), which its reader follows:

- **Ship** — `merge (squash | merge commit | rebase)` or `off`; written only for those, since no value means `pr`: what the close step does with the finished branch.
- **Mock conditions** — bulleted conditions deciding whether the goals step builds a mock.
- **Test exceptions** — bulleted `condition — alternative verification` entries: matching work is verified that stated way instead of by a regression test.
- **Skills & guides** — one entry per line, `name-or-path (skill|doc[, required]): when to use`; `required` means it must never be bypassed.
- **Adherence** — one rule family per line, `- <family>: <examples file>[, glossary: <path>]`. The examples file holds the owner's verbatim past review notes for that family, grouped by sub-pattern, each with the code shape that drew the note; keep it under ~150 lines, because every adherence subagent reads it whole. No section, no adherence step.
