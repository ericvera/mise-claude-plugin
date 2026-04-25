---
name: execute-implementation-plan
description: |
  Execute an implementation plan by working through each task file in order.
  Use when an implementation plan folder exists in the feature docs directory.
disable-model-invocation: true
argument-hint: <feature-name>
---

# Execute Implementation Plan

First, read `.claude/workflow-config.md` to find the feature docs directory and quality commands for this project.

## Input

Feature name: $ARGUMENTS

## Before starting

1. **Read the overview file** at `<docs-directory>/$ARGUMENTS/implementation_plan/00_overview.md`. This is the ONLY file you read right now — do not read any task files yet.

2. **Build the TODO list** from the `tasks:` YAML block in the overview (the human-readable Task Index table is for humans; do not parse it). The YAML block looks like:

   ```yaml
   tasks:
     - file: 01_01_install_diffs.md
       phase: 1
     - file: 01_02_replace_changes_tab.md
       phase: 1
     - file: 02_01_add_config_fields.md
       phase: 2
   ```

   For each entry in `tasks:`, in order, create a TODO entry with this exact format:

   `Read and execute <docs-directory>/$ARGUMENTS/implementation_plan/<file>`

   For example:
   - "Read and execute docs/features/my-feature/implementation_plan/01_01_install_diffs.md" — pending
   - "Read and execute docs/features/my-feature/implementation_plan/01_02_replace_changes_tab.md" — pending
   - "Read and execute docs/features/my-feature/implementation_plan/02_01_add_config_fields.md" — pending

   If the YAML block is missing or malformed, stop and ask the user to regenerate `00_overview.md` with `/write-implementation-plan` rather than guessing from the table.

## Executing tasks

Work through the TODO list in order. For each entry:

1. Mark it as in_progress
2. Read the task file specified in the TODO entry
3. Follow the instructions in `implement_task.md` (in the same directory as this skill) to implement, verify, self-review, and commit the task
4. Mark it as completed
5. Move to the next entry

If a task fails with a hard blocker you cannot resolve, stop and ask the user how to proceed.

## Do not

- Read task files ahead of time — only read each task file when you start working on it
- Skip verification steps (quality commands from workflow config, end-to-end tests)
- Commit if verification is failing
- Proceed past a failed task without asking the user
