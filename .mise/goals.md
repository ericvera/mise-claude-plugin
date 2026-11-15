I received the following feedback. Consider it and get back to me:

The mise workflow's final step is a short instruction file, and what it says is: delete .mise, commit, push, and open a pull request. It says nothing about merging, and nothing in it reads the Ship: merge (squash) line from your .claude/mise-config.md.

So there were two instructions that didn't agree: your config says shipping means a squash merge, and the step I was running stops at the PR. Since a merge into main is hard to undo, I took the narrower one and left PR #4 open.

That may well be a gap in mise 3.0.1 (the config line looks like it is meant to drive this step), or the line may be left over from an earlier version. I haven't checked which.

If you want the config honoured, say so and I'll squash-merge PR #4 now. The only reason to hold off is the two things nothing scripted covered: the title-bar button's visibility and click-to-select.

## Investigation

Not a runtime bug, so there was nothing to reproduce. The close step behaved as written. The `Ship: merge (squash)` line in the other project's config is left over from 2.x.

- skills/next/steps/08-close.md:3: close does `git rm -r -q .mise`, commits `mise: close`, then `git push` and opens a PR "unless the owner asked for something else". It reads no config line and never merges.
- 2.x had a config line `Ship: pr | merge (squash/merge commit/rebase) | off`, asked as interview question 12. Commit c0f1214 (mise 3.0.0) removed it from setup and from this repo's own config.
- The 3.x config shape at skills/next/setup.md:7-35 has only Quality commands (required), Mock conditions and Skills & guides (optional). README.md:40 says "Nothing else is configurable."
- Why stale lines survive: setup.md:3 revisits an existing config only section by section, so top-level 2.x lines (`Ship:`, `Mise directory:`, `Branch convention:`, `Checklist:`) are never removed or flagged. SKILL.md:24 checks only that Quality commands is present. Nothing migrates a 2.x config.
- This repo's .claude/mise-config.md has no Ship line, so the gap shows only in projects configured under 2.x.
- Two fixes the description leaves open:
  - (a) Bring Ship back as a config section that close reads. Edits setup.md:9-35, 08-close.md:3 and README.md:38,53.
  - (b) Have setup and Load drop or flag unknown 2.x lines. Edits setup.md:3 and SKILL.md:24.
- Hard to undo: a merge into the base cannot be taken back. skills/next/scripts/state.ts:509-519 is built so the engine never pushes to main, master or the default branch. A merge option in close would be the first step that writes to the base. The base is recorded at state.ts:76 and state.ts:102.
- A merge in close must come after `git rm .mise` (08-close.md:3), or it breaks the `.mise/` guard in CLAUDE.md:3 and setup.md:47.
- A new config section or changed close behavior must update README.md (lines 38 and 53) and bump `version` 3.0.1 in .claude-plugin/plugin.json:5 in the same run.
- Tests: state.ts parses no config. A regression test fits skills/next/scripts/state.test.ts only if the engine starts reading config (close order is covered at state.test.ts:243-271). Otherwise the change is prose-only and has no automated test.

## Decisions

- `Ship` stays removed. Close keeps ending at the PR.
- Load calls out anything in `.claude/mise-config.md` that the 3.x config does not recognize and offers a fix (owner, 2026-11-15: "as a quick safety we just call out any unrecognized sections in config and offer a fix").

## Assumptions

- "Unrecognized" covers both sections and top-level lines other than Quality commands, Mock conditions and Skills & guides. The 2.x leftovers (`Ship:`, `Mise directory:`, `Branch convention:`, `Checklist:`) are top-level lines.
- The fix offered is removing the unrecognized content from the config. The callout says mise does not read it, so the owner knows it has no effect either way.
- Declining leaves the config as is and the run carries on. The callout repeats on the next run.
- The check is prose in the driver's Load, not in `state.ts`, which parses no config. No automated test.
- Setup removes the same content when it revisits an existing config.
- Load can now wait for the owner, so README.md is updated, and `version` goes to 3.0.2.
- Out of scope: any merge in close, and migrating 2.x values into 3.x sections.

## Proposal

- Issue: a config written under 2.x keeps lines 3.x never reads (`Ship: merge (squash)`), so the config and the close step appear to disagree.
- Fix: Load calls out unrecognized config sections and lines and offers to remove them; setup removes them too. README and version 3.0.2 in the same run.
- Skips: spec and critic — prose in one module, nothing hard to undo.
