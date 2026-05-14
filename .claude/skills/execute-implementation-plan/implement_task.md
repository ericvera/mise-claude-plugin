# Implement Task

You are implementing a single task from an implementation plan. Your job is to read the task file, write the code, verify it works, and commit the changes.

The **subject task file** is the task file from the current TODO entry you just dequeued in the executor (e.g., `<docs-directory>/<feature>/implementation_plan/01_02_replace_changes_tab.md`). Wherever this document refers to "the task file", read that exact path.

First, read `.claude/workflow-config.md` to find the quality commands and related skills for this project.

## CRITICAL: Triage failures before fixing them

If the quality commands or any end-to-end test fails:

- If the failure is **caused by your change**, you MUST fix it before committing.
- If the failure **already existed on the base branch** (verify with `git stash && <re-run the failing check>` or by checking out `HEAD~1` and running the check there), do NOT try to fix it. Report it as a blocker, restore your changes, and stop.

The default assumption is that a failure is yours to fix. Only treat a failure as pre-existing once you've actually verified it reproduces on the base branch — otherwise long autonomous runs accumulate scope creep on unrelated bugs.

## Steps

1. **Read the task file** (the path from the current TODO entry). This file is self-contained — it has everything you need to know about the task, including background, files to modify, implementation details, and verification steps.

2. **Read the files listed** in the task's "Files to modify/create" and "Background" sections. Understand the existing code before making changes.

3. **Implement the task** following the implementation details in the task file. Key rules:
   - Follow the patterns and conventions described in the task file
   - Follow any project-specific code conventions listed in `.claude/workflow-config.md` (Code conventions section, if present)
   - Complete type hints on all public functions, if the language supports them
   - Do not add unnecessary comments or abstractions beyond what the task requires

4. **Run verification** — these are mandatory, not optional. **Auto-fix and continue; do not stop to ask for trivial issues.**
   - Run the project's format command(s) first (from workflow config). Formatters typically rewrite files in place — that's fine, just re-stage and continue. Do not stop to ask about format-only changes.
   - Run the project's check command(s) (from workflow config) for lint and typecheck. If the workflow config provides a list of commands, run them in order and stop at the first failure. **Trivial lint errors** (unused imports, missing semicolons, etc.) — fix them yourself and re-run. **Type errors** introduced by your change — fix them yourself and re-run. Keep iterating until every command in the slot passes.
   - Run the project's unit test command(s) (from workflow config). If tests fail, investigate and fix. Keep iterating until every command in the slot passes.
   - Run any specific end-to-end tests listed in the task's verification checklist. CRITICAL: If the workflow config specifies an end-to-end test skill, always use that skill to run end-to-end tests — never run them directly. Keep iterating until all tests pass.
   - For all of the above: keep fixing and re-running until everything passes. Report a blocker (don't ask the user — surface and stop) **only** if the failure is outside the scope of this task to fix: a missing dependency, a missing API, a fundamental design contradiction, or a failure that already existed on the base branch (see triage rules above).

5. **Walk through the verification checklist** in the task file. Confirm each item passes.

6. **Self-review your diff** before committing:
   - Run `git diff` to see all your staged and unstaged changes
   - Check for: missed requirements from the task spec, bugs, security issues (injection, XSS, hardcoded secrets), dead code, leftover debug statements
   - Fix anything you find and re-run quality commands and unit tests

7. **Commit the changes** with a descriptive message explaining what was built and why. Use this format:
   ```
   git commit -m "$(cat <<'EOF'
   Task <task #>: <one-line of what this task accomplished>

   <detailed report of what this task accomplished>
   EOF
   )"
   ```

## Reporting back

When you're done, report one of:
- **Success**: "Task completed and committed. Commit: <hash>. All verification passed."
- **Failure**: "Task failed. <description of what went wrong and what you tried>."

Do not include full test output in your report — just summarize the result.

## Do not

- Modify files outside the scope of this task
- Skip any verification steps
- Commit if verification is failing
- Make architectural decisions that contradict the task file — if something seems wrong, report it as a failure rather than improvising
