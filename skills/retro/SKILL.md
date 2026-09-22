---
name: retro
description: |
  Reviews mise run ledgers across runs and proposes changes to the
  instructions that produced them. Use when the user asks for a mise
  retrospective, or wants to change a mise, project or plugin rule file.
argument-hint: "[path to another project's ledger directory]"
disable-model-invocation: true
---

# Retro

Run `node ${CLAUDE_SKILL_DIR}/../next/scripts/state.ts tally .claude/mise-ledger/ <dir>…` over this project's ledgers and any directory given as an argument. Its rows are your input: never open a ledger yourself, they run to thousands of lines. You edit no source, rule or plugin file, here or after: you output one table and stop.

Group the `finding`, `feedback`, `stop`, `skip` and `gate` rows into issues by what actually went wrong; each row already carries the runs and projects it spans.

**Eligible**: an issue seen in 3 or more runs, or in 2 or more projects. An issue whose harm is irreversible — data loss, a destructive command, money — is eligible after one. Everything else is logged only; say how many runs short it is.

For each eligible issue, answer in order and stop at the first answer that settles it:

1. Was the instruction already in the acting agent's context? Then more prose will not help it — a tool, or nothing.
2. Can a tool enforce it — a lint rule, a type, a test, the state script? Propose that rather than prose.
3. Is it project-specific or generic? Project-specific belongs in that project's rule files or an adherence examples file, never in a skill file.
4. Can an existing line be fixed or deleted instead of a new one added? Prefer that.
5. Which ledger signal will show the change worked, and after how many runs is it checked and reverted if it did not? No signal → do not propose it.

Every added line names the line it removes, and the mise repo's per-file line budgets (`docs/line-evidence.md`) hold. The default outcome is **log only**.

Output one table and nothing else, then ask which rows to apply:

| issue | runs | root cause | where the fix belongs | change | signal |
| ----- | ---- | ---------- | --------------------- | ------ | ------ |
