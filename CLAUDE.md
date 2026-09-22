# mise-claude-plugin

Never open a pull request for, or merge into another branch, any branch whose tree contains `.mise/` — that work is still in flight; run `/mise:next` on that branch to finish it first.

A change that adds, removes or renames a config section or a step, or changes where the run waits for the owner, updates `README.md` in the same run, using the exact terms the skill files use. The README states only those; the mechanics live in `skills/next/flow.md` and are never restated in the README.

Any user-visible change bumps `version` in `.claude-plugin/plugin.json` in the same run — Claude Code installs and updates the plugin by version, so a change that ships without a bump never reaches an installed user, and no test or quality gate catches it.

## Editing skill files

- Every instruction appears once, in the file whose role acts on it. No prose restates what `skills/next/scripts/state.ts` enforces or reports.
- For each line ask whether removing it would cause a mistake; if not, cut it. Direct and imperative, no framing prose, rationale only where a reader would otherwise apply the rule wrongly.
- One term per concept, the same in every file: the steps (start, goals, spec, critic, execute, adherence, review, gate, close) and the artifacts (`goals.md`, `spec.md`, `tasks/`, `tasks/done/`, `adherence.md`, `review.md`).
- Role files are self-contained: a fresh-context subagent reads one role file plus the paths its prompt names, never a sibling file.
- `SKILL.md` keeps `disable-model-invocation: true`, and its `allowed-tools` covers every command the driver runs, so an unattended run never stalls on a permission prompt. `${CLAUDE_SKILL_DIR}` is substituted in `SKILL.md` only; dispatched files get absolute paths in their prompt.
