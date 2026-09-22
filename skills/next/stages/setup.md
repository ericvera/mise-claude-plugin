# Setup

Interview the owner, then write `.claude/mise-config.md` in the shape `../references/config-reference.md` defines — read it first, and never copy it into the project. An existing config is revisited section by section, its current value shown.

Ask one question, in SKILL.md's question format: confirm the Quality commands, inferred from `package.json` or the repo's equivalent.

Then list the reference's optional sections by name, say any of them can be filled later by re-running `/mise:next setup`, and fill now only the ones the owner names.

Write the file with the sections filled and nothing else, print it, and confirm it is right. Code conventions the owner offers along the way belong in `CLAUDE.md` — offer to add them there.

Then ensure `CLAUDE.md` carries this line (creating the file if needed, replacing any earlier mise guard rather than adding a second):

> Never open a pull request for, or merge into another branch, any branch whose tree contains `.mise/` — that work is still in flight; run `/mise:next` on that branch to finish it first.

Commit the config and the guard together: `mise: setup`.
