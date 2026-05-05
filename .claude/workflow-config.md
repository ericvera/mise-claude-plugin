# Workflow Configuration

This file provides project-specific settings consumed by the generic workflow skills
(`next`, `review-goals`, `create-html-mock`, `extract-requirements-from-mock`,
`write-requirements`, `write-architecture`, `write-implementation-plan`,
`execute-implementation-plan`, `fix-bug`).

**Setup:** Copy this file into your project at `.claude/workflow-config.md` and replace
all `<PLACEHOLDER>` values with your project's specifics. Delete any sections that don't apply
to your project.

---

## Feature docs directory

Feature documentation lives at:

```
<PATH_TO_FEATURE_DOCS>
```

Example: `docs/features/`, `agent_docs/`, etc.

Within this directory, each feature has its own folder named `<feature-name>/`, containing
`goals.md`, `requirements.md`, `architecture.md`, `mocks.html`, `mocks.context.md`,
and `implementation_plan/` as applicable.

## Backlog

(Optional.) The `next` skill reads this section to list pending work when no feature is in
progress. Describe how to fetch the top to-do items from your backlog — what tool to use,
what query to run, which sections or labels to pull from, and any other context the agent
needs.

Example: "Use the Todoist MCP to list tasks in the project 'Engineering', filtered to the
sections 'Doing' and 'To Do', sorted by priority."

(Delete this section if you don't track work externally.)

## Quality commands

Run these commands to verify code quality. All must pass before committing.

Each slot accepts either a single command or a list of commands. When a list is provided, run the commands in the order they appear and stop at the first failure (treat the slot as failing).

- **Format**: `<FORMAT_COMMAND>`
- **Check (lint + typecheck)**: `<CHECK_COMMAND>`
- **Unit tests**: `<UNIT_TEST_COMMAND>`

## Product identity

The product is called **<PRODUCT_NAME>**. When creating HTML mocks, match the look and feel of
the existing UI. Don't guess at what it looks like — read the UI code at `<UI_CODE_ROOT>` and
create a close approximation.

(Delete this section if not relevant, e.g. for backend-only projects.)

## Test conventions

### Test locations

<DESCRIBE_WHERE_EACH_TYPE_OF_TEST_LIVES_AND_HOW_THEY_ARE_NAMED>

Example:
```
- End-to-end tests: `tests/e2e/` — named `test_<feature>.py`
- Unit tests: alongside source files — `foo_test.py` for `foo.py`
```

### Test authoring guidance

<DESCRIBE_ANY_PROJECT_SPECIFIC_TEST_CONVENTIONS_FRAMEWORKS_OR_PATTERNS>

Example: "Tests use Playwright for browser automation. Use `data-testid` attributes for
element selectors. End-to-end tests require a running database seeded via fixtures."

(Delete this subsection if not applicable.)

## Related skills

These project-specific skills are referenced by the workflow skills. If a skill is not
available in your project, the instruction referencing it can be skipped.

- **Manual testing / screenshots**: `<SKILL_NAME_OR_DELETE>` — launch the app and interact
  with the UI to take screenshots or manually test features.
- **Write end-to-end test**: `<SKILL_NAME_OR_DELETE>` — instructions for writing new
  end-to-end tests, including framework setup and test patterns.
- **Run end-to-end tests**: `<SKILL_NAME_OR_DELETE>` — MUST be used to run end-to-end tests
  (never run them directly).
- **Debug end-to-end tests**: `<SKILL_NAME_OR_DELETE>` — debug failing end-to-end tests,
  covers common failure modes and investigation strategies.

(Delete any entries that don't apply. Delete this entire section if you have no related skills.)

## Database migrations

<DESCRIBE_MIGRATION_TOOLING_OR_DELETE_THIS_SECTION>

Example:
```
npx prisma migrate dev --name "<migration message>"
```

(Delete this section if your project doesn't use database migrations.)
