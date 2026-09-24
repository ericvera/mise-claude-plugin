# mise-claude-plugin

Never open a pull request for, or merge into another branch, any branch whose tree contains `.mise/` — that work is still in flight; run `/mise:next` on that branch to finish it first.

A change that adds, removes or renames a config section or a step, or changes where the run waits for the owner, updates `README.md` in the same run, using the exact terms the skill files use. The README states only those. The mechanics live in `skills/next/steps/` and are never restated in the README.

Any user-visible change bumps `version` in `.claude-plugin/plugin.json` in the same run. Claude Code installs and updates the plugin by version, so a change that ships without a bump never reaches an installed user, and no test or quality gate catches it.

## Editing skill files

- Every instruction appears once, in the file whose role acts on it. No prose restates what `skills/next/scripts/state.ts` enforces or reports.
- For each line ask whether removing it would cause a mistake. If not, cut it. Write direct and imperative, with no framing prose. Add rationale only where a reader would otherwise apply the rule wrongly.
- Use one term per concept, the same in every file. The steps are start, goals, spec, critic, execute, review, gate, close. The artifacts are `goals.md`, `mock/`, `spec.md`, `tasks/`, `tasks/done/`, `review.md`.
- Agent files in `agents/` are self-contained. A subagent gets one agent file as its instructions plus the paths its prompt names, never a sibling file. An agent's `description` lists what its prompt names, because the driver dispatches from it.
- `SKILL.md` keeps `disable-model-invocation: true`. mise assumes auto mode, so `allowed-tools` lists only the commands the driver runs that auto mode's classifier blocks. `${CLAUDE_SKILL_DIR}` is substituted in `SKILL.md` only. Dispatched agents get absolute paths in their prompt.
