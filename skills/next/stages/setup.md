# Setup

Interview the owner, then write `.claude/mise-config.md` in the shape `../references/config-reference.md` defines — read it first, and never copy it into the project. An existing config is revisited section by section, its current value shown.

Ask in SKILL.md's question format, suggesting a value inferred from the repo for every item (package.json scripts, test directories, recent branch names, existing docs and skills). Where a project doc already covers a section, offer a pointer to it (`See docs/testing.md`) as the default answer.

1. Mise directory — suggest `.mise/`.
2. Branch convention — infer from `git branch --sort=-committerdate`, else suggest `feat/<slug>` for features, `fix/<slug>` for bug fixes.
3. Quality commands — Format, Check, Unit tests; then Task tests (a command with a `<path>` placeholder) and Build, where the project has them.
4. Ship — `pr`, `merge` (ask the style: squash, merge commit, or rebase), or `off`.

Then list the optional sections by name — Mock conditions, Mock guidance, Test exceptions, Skills & guides, Adherence, Ledger, Backlog, Review notes — say any of them can be filled later by re-running `/mise:next setup`, and fill now only the ones the owner names.

Write the file with the sections filled and nothing else, print it, and confirm it is right. Code conventions the owner offers along the way belong in `CLAUDE.md` — offer to add them there.

Then ensure `CLAUDE.md` carries this line, with the mise directory substituted (creating the file if needed, replacing any earlier mise guard rather than adding a second):

> Never open a pull request for, or merge into another branch, any branch whose tree contains `<mise-dir>/` — that work is still in flight; run `/mise:next` on that branch to finish it first.

Commit the config and the guard together: `mise: setup`.
