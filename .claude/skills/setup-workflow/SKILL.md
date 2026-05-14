---
name: setup-workflow
description: Fill out the workflow configuration file with project-specific values
disable-model-invocation: true
---

# Set up workflow

Before responding, read `.claude/skills/_shared/interaction.md` (or `~/.claude/skills/_shared/interaction.md`) for response format, question pacing, and verbosity conventions.

Walk the user through `.claude/workflow-config.md` and replace `<PLACEHOLDER>` values so the rest of the workflow skills work.

If the file does not exist, bootstrap it by copying the global template:

```
mkdir -p .claude && cp ~/.claude/workflow-config.template.md .claude/workflow-config.md
```

The template ships alongside these skills at `~/.claude/workflow-config.template.md`. If it isn't present there either, fall back to copying `workflow-config.md` from the workflow-skills repo into `.claude/`. Then re-run this skill.

## Steps

### 1. Read the file

Open `.claude/workflow-config.md`.

### 2. Replace each `<PLACEHOLDER>`

For each placeholder still present, ask the user for the value, confirm, and write it back.

Required:

- `<NORMAL_OR_EXPERT>` — verbosity preference. Ask:
  > How verbose should the skills be?
  > - a. `normal` — explain reasoning behind suggestions
  > - b. `expert` — terse; skip rationale unless asked
  >
  > Defaults to `normal` if you skip.
- `<PATH_TO_FEATURE_DOCS>` — feature documentation directory (e.g., `docs/features/`, `agent_docs/`)
- `<FORMAT_COMMAND>` — code formatter (single command, or a list)
- `<CHECK_COMMAND>` — lint + typecheck (single command, or a list)
- `<UNIT_TEST_COMMAND>` — unit tests (single command, or a list)

Optional. Offer to skip; if skipped, delete the surrounding section:

- Code conventions section — repo-wide style/structure rules that go beyond what the linter catches (e.g. import ordering, no relative imports)
- `<PRODUCT_NAME>` and `<UI_CODE_ROOT>` — only relevant for projects with a UI
- Test conventions section
- Related skills section
- Database migrations section

### 3. Add an optional Backlog section

Ask:

> Do you track work in an external system (Todoist, Linear, Jira, a markdown file, etc.)? If yes, describe how to fetch the top to-do items, including any tools or queries. If no, say so.

If the user describes a backlog, add (or replace) a `## Backlog` section in the file with their description as free-form prose. The `next` skill reads this section verbatim.

### 4. Verify

Print the final file. Confirm with the user that everything looks right.
