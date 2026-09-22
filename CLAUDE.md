# mise-claude-plugin

Never open a pull request for, or merge into another branch, any branch whose tree contains `.mise/` — that work is still in flight; run `/mise:next` on that branch to finish it first.

A change that adds, removes or renames a config section or a step, or changes where the run waits for the owner, updates `README.md` in the same run, using the exact terms the skill files use. The README states only those; the mechanics live in `skills/next/flow.md` and are never restated in the README.

Any user-visible change bumps `version` in `.claude-plugin/plugin.json` in the same run — Claude Code installs and updates the plugin by version, so a change that ships without a bump never reaches an installed user, and no test or quality gate catches it.
