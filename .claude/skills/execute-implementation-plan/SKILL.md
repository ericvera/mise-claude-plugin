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

## Stopping rules

**Stop only on blocking issues.** Run autonomously past everything else.

A blocking issue is:
- A verification failure that resists the auto-fix attempts in `implement_task.md` (you've tried and the failure is real and outside the scope of this task to fix)
- A genuine ambiguity in the task file that you cannot resolve from the file itself, the codebase, or `.claude/workflow-config.md`
- A missing dependency, missing API, or fundamental design contradiction surfaced during implementation

**Not** blocking issues (do not stop for these):
- Trivial format/lint errors → auto-fix and continue
- A clean task completion → mark done, move to the next task without confirming
- A passing self-review → commit and continue

## Plan vs. skill precedence

Task notes in the plan **never** authorize a red build, a skipped verification, or a commit on failed checks. The "every task ends green" rule from `write-implementation-plan` is absolute. If a task file appears to authorize a red intermediate state, treat it as a **planning bug**: stop, report it as a blocker, and ask the user to regenerate the plan with `/write-implementation-plan`. Do not ask the user whether to commit anyway.

## Do not

- Read task files ahead of time — only read each task file when you start working on it
- Skip verification steps (quality commands from workflow config, end-to-end tests)
- Commit if verification is failing
- Ask the user for confirmation between tasks while everything is green — just continue
- Ask the user which rule wins when a task note conflicts with a skill default — task notes never win on safety/verification rules
