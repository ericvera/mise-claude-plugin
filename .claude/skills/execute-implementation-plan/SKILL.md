---
name: execute-implementation-plan
description: |
  Execute an implementation plan by working through each task file in order.
  Use when an implementation plan folder exists in the feature docs directory.
disable-model-invocation: true
argument-hint: <feature-name>
---

# Execute Implementation Plan

Before responding, read `.claude/skills/_shared/interaction.md` (or `~/.claude/skills/_shared/interaction.md`) for response format, question pacing, and verbosity conventions.

First, read `.claude/workflow-config.md` to find the feature docs directory and quality commands for this project.

## Input

Feature name: $ARGUMENTS

## Before starting

1. **Read the overview file** at `<docs-directory>/$ARGUMENTS/implementation_plan/00_overview.md`. This is the ONLY file you read right now — do not read any task files yet.

2. **Build the TODO list** from the Task Index table in the overview. For each row, create a TODO entry with this exact format:

   `Read and execute <docs-directory>/$ARGUMENTS/implementation_plan/<filename>`

   For example:
   - "Read and execute docs/features/my-feature/implementation_plan/01_01_install_diffs.md" — pending
   - "Read and execute docs/features/my-feature/implementation_plan/01_02_replace_changes_tab.md" — pending
   - "Read and execute docs/features/my-feature/implementation_plan/02_01_add_config_fields.md" — pending

## Executing tasks

Work through the TODO list in order. For each entry:

1. Mark it as in_progress
2. Read the task file specified in the TODO entry
3. Follow the instructions in `implement_task.md` (in the same directory as this skill) to implement, verify, self-review, and commit the task
4. Mark it as completed
5. Move to the next entry

## Stopping rules

Stop only on real blockers: a verification failure outside this task's scope (after the auto-fix attempts in `implement_task.md`), a genuine ambiguity unresolvable from the task file/codebase/workflow-config, or a missing dependency/API/design contradiction. If a task file appears to authorize a red intermediate state, treat it as a planning bug — stop and ask the user to regenerate the plan. Otherwise keep going.

## Do not

- Read task files ahead of time — only read each task file when you start working on it
- Skip verification steps (quality commands from workflow config, end-to-end tests)
- Commit if verification is failing
- Ask the user for confirmation between tasks while everything is green — just continue
- Ask the user which rule wins when a task note conflicts with a skill default — task notes never win on safety/verification rules
