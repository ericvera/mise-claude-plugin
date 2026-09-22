# mise-config reference

Setup's reference for `.claude/mise-config.md`, never copied into a project. The file holds values only — no instructional prose — because every step and every fresh-context subagent reads it. Top-level values first, then the `##` sections, in this order:

```markdown
# Mise Configuration

Mise directory: .mise/
Branch convention: feat/<slug> for features, fix/<slug> for bug fixes
Ship: pr

## Quality commands

- Format: yarn format
- Check:
  - yarn lint
  - yarn typecheck
- Unit tests: yarn test
- Task tests: yarn test <path>

## Adherence

- tests: .claude/adherence/tests.md
- vocabulary: .claude/adherence/vocabulary.md, glossary: docs/design/naming.md
```

Required:

- **Mise directory** — where in-flight work lives (suggest `.mise/`): this run's artifacts, state and ledger, nothing else, so its existence means work is in flight.
- **Branch convention** — the branch-name patterns, `<slug>` standing for a kebab-case slug of the work.
- **Ship** — `pr`, `merge (squash | merge commit | rebase)`, or `off`: what the close step does with the finished branch.
- **Quality commands** — Format, Check (lint and typecheck), Unit tests, plus optional Task tests (its `<path>` placeholder is filled per task) and Build. Each slot is one command or a nested list run in order; these are run commands only.

Optional — omit a section that does not apply. A body is inline values or a pointer to a project doc or skill (`See docs/testing.md`), which its reader follows:

- **Mock conditions** — bulleted conditions deciding whether the goals step builds a mock.
- **Mock guidance** — product name, UI code root, look-and-feel notes.
- **Test exceptions** — bulleted `condition — alternative verification` entries: matching work is verified that stated way instead of by a regression test.
- **Skills & guides** — one entry per line, `name-or-path (skill|doc[, required]): when to use`; `required` means it must never be bypassed.
- **Adherence** — one rule family per line, `- <family>: <examples file>[, glossary: <path>]`. The examples file holds the owner's verbatim past review notes for that family, grouped by sub-pattern, each with the code shape that drew the note; keep it under ~150 lines, because every adherence subagent reads it whole. No section, no adherence step.
- **Ledger** — where run ledgers are kept after cleanup; default `.claude/mise-ledger/`.
- **Backlog** — freeform instructions for fetching the top to-do items from an external tracker; read verbatim.
- **Review notes** — freeform instructions for reading the owner's external review notes for the branch (e.g. its Delta Review notes file); read verbatim.
