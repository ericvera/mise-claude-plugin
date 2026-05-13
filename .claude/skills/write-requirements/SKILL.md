---
name: write-requirements
description: Write a requirements document from a goals document
argument-hint: <feature-name>
---

# Write Requirements Document

Before responding, read `.claude/skills/_shared/interaction.md` (or `~/.claude/skills/_shared/interaction.md`) for response format, question pacing, and verbosity conventions.

First, read `.claude/workflow-config.md` to find the feature docs directory for this project.

Read my goals document at `<docs-directory>/$ARGUMENTS/goals.md` and analyze the codebase to understand existing functionality.

Write a requirements document to `<docs-directory>/$ARGUMENTS/requirements.md`.

## Before writing:

Ask me clarifying questions. Focus on:
- Edge cases and error scenarios
- User-facing behaviors that aren't explicitly stated
- Integration points with existing functionality
- What is explicitly OUT of scope

## Document structure:

- Use `REQ-<CATEGORY>-<N>` identifiers (e.g., `REQ-DIR-1`, `REQ-TASK-3`)
- Group requirements by functional area
- Include an "Out of Scope" section
- Include an acceptance criteria summary table

## Writing guidelines:

- Focus on WHAT, not HOW (pure requirements, no implementation details)
- Use MUST/SHOULD/MAY language for clarity
- Each requirement should be testable
- Reference existing behavior that must be preserved
