# mise-config reference

Reference for setup (`../stages/setup.md`). This file is **not copied into
projects** — setup interviews the user and writes a minimal `.claude/mise-config.md`
from scratch containing only the sections that apply. Keep the generated file terse:
values and freeform sections only, no instructional prose — every stage and every
fresh-context subagent reads it, so each explanatory line is paid for repeatedly.

This file defines what each section means and its exact format. How the sections
are consumed is defined by the stage and reference files that read them — do not
restate consumption rules here or in the generated config.

## Generated file shape

```markdown
# Mise Configuration

Mise directory: .mise/
Branch convention: feat/<slug> for features, fix/<slug> for bug fixes

## Quality commands

- Format: yarn format
- Check:
  - yarn lint
  - yarn typecheck
- Unit tests: yarn test

## Mock conditions

- Anything affecting Vue components

## Mock guidance

Product: Acme Dashboard. UI code root: `src/ui/`.

## Test conventions

See docs/testing.md

## Test exceptions

- Purely visual changes (spacing, colors, cursor styles) — verify with before/after screenshots

## Skills & guides

- run-e2e (skill, required): running end-to-end tests — never run them directly
- write-e2e-test (skill): writing new end-to-end tests
- docs/voice-guide.md: any user-facing copy

## Database migrations

`yarn prisma migrate dev --name "<migration message>"`

## Backlog

Use the Todoist MCP to list tasks in the project "Engineering", sections "Doing"
and "To Do", sorted by priority.
```

## Section reference

Required — the config is unfilled without these:

- **Mise directory** — the workflow's own working directory (suggest `.mise/`). The single place where in-flight work lives: its stage artifacts and `.workflow-state`, committed to the feature branch as work progresses and deleted in a final cleanup commit. The workflow owns this directory — it must not hold anything else, and its existence means work is in flight.
- **Branch convention** — how work branches are named, as one line using `<slug>` for a short kebab-case slug derived from the work description (e.g. `feat/<slug>` for features, `fix/<slug>` for bug fixes). Starting new work creates the branch from this convention; a missing value blocks starting new work.
- **Quality commands** — Format, Check (lint + typecheck), Unit tests. Each slot is one command or a list (nested bullets); a list means: run in order, and when one fails, fix and re-run the slot from the start. Missing or placeholder values block the execute stage. These are _run_ commands only — how tests are written and where they live is Test conventions.

Optional — omit the section entirely when it doesn't apply. A section body may be
inline values or a pointer to an existing project doc or skill (e.g. `See
docs/testing.md`) — whoever reads the section follows the pointer. Prefer a
pointer whenever the content already lives in the project (a testing doc, a
design guide, a project skill); inline only values short enough that a pointer
would cost more to follow than to read:

- **Mock conditions** — bulleted conditions deciding _whether_ a feature gets an HTML mock before requirements (matching any condition → `route: full`; otherwise direct). Section absent = never mock. The user can always override in conversation. Mock guidance shapes _how_ the mock looks.
- **Mock guidance** — how mocks should look: product name, UI code root, any look-and-feel notes so mocks match the real product. Omit unless the project mocks.
- **Test conventions** — authoring: where each kind of test lives, naming, frameworks, fixtures. The commands that _run_ tests are Quality commands.
- **Test exceptions** — bulleted `condition — alternative verification` entries. Matching work is exempt from the regression-test / mandatory-e2e rules and verified the stated way instead; an exception changes the verification method, never removes verification. Suggest the purely-visual → screenshots entry as a default.
- **Skills & guides** — open-ended list, one entry per line: `name-or-path (skill|doc[, required]): when to use`. `required` means the entry MUST be used whenever its condition matches (e.g. an e2e-runner skill that must never be bypassed).
- **Database migrations** — the migration generation command, if the project has one.
- **Backlog** — freeform instructions for fetching top to-do items from an external tracker; read verbatim.
- **Retrospective** — a top-level value line (next to Branch convention), not a section, and only ever written as `Retrospective: off`: disables the post-acceptance retrospective (a subagent that mines the finished run for guidance improvements the user can adopt). Omit the line entirely to keep the retrospective on — that is the default.

There is no code-conventions section: repo-wide conventions belong in `CLAUDE.md`, which every agent — including fresh-context subagents — loads automatically.
