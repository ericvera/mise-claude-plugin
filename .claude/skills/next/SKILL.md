---
name: next
description: Show or run the next slash command in the workflow for the current feature
disable-model-invocation: true
argument-hint: [? or what to work on]
---

# Next

Determine the next command in the workflow for the current feature, then either run it or just explain it.

Before responding, read `.claude/skills/_shared/interaction.md` (or `~/.claude/skills/_shared/interaction.md`) for response format, question pacing, and verbosity conventions.

First, read `.claude/workflow-config.md` to find the feature docs directory and any backlog instructions. If the file does not exist or still has `<PLACEHOLDER>` values, run `/setup-workflow` first, then resume here.

## Steps

### 1. Parse `$ARGUMENTS`

- empty → **proceed mode**: figure out the next step and run it
- `?` → **explain mode**: describe the next step without running it
- anything else → free-text description of new work; handle in step 2 then continue in proceed mode

### 2. Resolve the active feature

If `$ARGUMENTS` is a free-text description:

- If it contains "bug", "fix", "broken", "regression", "crashes", "doesn't work", or "fails", read `.claude/skills/fix-bug/SKILL.md` and follow its instructions, treating `$ARGUMENTS` as that skill's `$ARGUMENTS`. Then stop.
- If those signals are weak or ambiguous, ask the user: "Bug fix or new feature?" and dispatch accordingly (read the matching skill's SKILL.md and follow it).
- Otherwise (clearly a new feature), slugify the description (lowercase, hyphens for spaces, alphanumeric only). Create `<docs-directory>/<slug>/`. Write the description to `<docs-directory>/<slug>/goals.md`. Write the slug to `<docs-directory>/.next-current`. Active feature is `<slug>`.

Otherwise:

- If `<docs-directory>/.next-current` exists and points to a real feature folder, use it.
- Else list the subdirectories of `<docs-directory>/`:
  - exactly 1 → use it; write its name to `.next-current`
  - 2 or more → list them numbered; ask the user to pick one; write the choice to `.next-current`
  - 0 → see step 2a

#### 2a. No feature folders

If `workflow-config.md` has a `## Backlog` section, follow those instructions to fetch the top to-do items. Present them numbered, then ask:

> Pick a number, or describe what you want to work on:

If the user picks a number, use the matching item's text as `$ARGUMENTS` and restart from step 2.

If `workflow-config.md` has no Backlog section, ask:

> Describe what you want to work on:

Use the response as `$ARGUMENTS` and restart from step 2.

### 3. Detect the stage

Within `<docs-directory>/<active-feature>/`, the next command depends on what artifacts exist:

- no `goals.md` → ask: "What's the goal for `<feature>`?". Write the answer to `goals.md`. Next: `/review-goals`.
- `goals.md` only → `/review-goals` (or `/create-html-mock` / `/write-requirements` if the user has already reviewed it).
- `mocks.html` and `mocks.context.md` exist, no `requirements.md` → `/extract-requirements-from-mock`.
- `requirements.md` exists, no `architecture.md` → `/write-architecture`.
- `architecture.md` exists, no `implementation_plan/00_overview.md` → `/write-implementation-plan`.
- `implementation_plan/00_overview.md` exists → `/execute-implementation-plan`.

### 4. Staleness check

Compare modification times. Order, upstream → downstream: `goals.md` → `mocks.html` / `mocks.context.md` → `requirements.md` → `architecture.md` → `implementation_plan/00_overview.md`. If any downstream artifact is older than its upstream, flag it as stale and suggest re-running the corresponding skill before continuing.

Use `[ upstream -nt downstream ]` or `find <upstream> -newer <downstream>` to compare.

### 5. Run or explain

**Explain mode (`?`):**

```
Active feature: <feature>
Stage: <one-line stage description>
Next: /<next-command> <feature>
Skip ahead to: /<later-command> <feature>

[any staleness warnings]
```

Don't run anything else.

**Proceed mode:**

Print:

```
Active feature: <feature>
Running: /<next-command> <feature>
```

Then read `.claude/skills/<next-command>/SKILL.md` and follow its instructions, treating `<feature>` as `$ARGUMENTS` for that skill.
