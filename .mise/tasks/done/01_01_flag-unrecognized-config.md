# 01_01 Flag unrecognized config content

## Goal

A config written under mise 2.x keeps lines 3.x never reads (for example `Ship: merge (squash)`), so the config appears to promise behavior the close step does not have. Make the driver's Load call out any content in `.claude/mise-config.md` that the 3.x config shape does not define and offer to remove it. Make setup remove the same content when it revisits an existing config. Update `README.md` and bump the plugin version to 3.0.2.

## Files to modify/create

- `/Users/eric/Code/mise-claude-plugin/skills/next/SKILL.md`
- `/Users/eric/Code/mise-claude-plugin/skills/next/setup.md`
- `/Users/eric/Code/mise-claude-plugin/README.md`
- `/Users/eric/Code/mise-claude-plugin/.claude-plugin/plugin.json`

## Background

- This repo is a Claude Code plugin made of prose skill files. `skills/next/SKILL.md` is the driver. Its `## Load` section (SKILL.md:22-24) reads `.claude/mise-config.md` and only checks that Quality commands is present.
- The 3.x config shape is defined once, in `skills/next/setup.md:5-35`: the title `# Mise Configuration`, then `## Quality commands` (required), `## Mock conditions` and `## Skills & guides` (optional), in that order.
- 2.x configs carried top-level lines that 3.x removed in commit c0f1214: `Ship:`, `Mise directory:`, `Branch convention:`, `Checklist:`. Nothing removes or flags them today. `setup.md:3` revisits an existing config only section by section, so these lines survive.
- Owner decisions (in `/Users/eric/Code/mise-claude-plugin/.mise/goals.md`):
  - `Ship` stays removed. Close keeps ending at the PR. Do not touch `skills/next/steps/08-close.md`.
  - "Unrecognized" means any `##` section or any line outside the sections setup.md's Config shape defines (the `# Mise Configuration` title is recognized).
  - The fix offered is removing the unrecognized content. The callout says mise does not read it, so it has no effect either way.
  - Declining leaves the config as is and the run carries on. The callout repeats on the next run.
  - The check is prose in Load, not code in `skills/next/scripts/state.ts`, which parses no config.
  - Out of scope: any merge in close, and migrating 2.x values into 3.x sections.
- Patterns to follow:
  - Load's existing branch, SKILL.md:24: "No config file, or no Quality commands value → run setup to fill it, then resume with the original arguments." Mirror its arrow form and its "resume with the original arguments".
  - The question format, SKILL.md:56-68. The callout is one question in that format.
  - Where the run stops, SKILL.md:70-72 `## Stopping`. Load now waits for the owner, so it must be listed there.
  - Setup's commit subject style, setup.md:49 (`mise: setup`).
- Repo rules (`/Users/eric/Code/mise-claude-plugin/CLAUDE.md`):
  - Every instruction appears once, in the file whose role acts on it. Load must point to setup.md's Config shape rather than restate the three section names.
  - Cut any line whose removal would not cause a mistake. Write direct and imperative, with no framing prose.
  - A change to where the run waits for the owner updates `README.md` in the same run, using the exact terms the skill files use. The README states only that, not the mechanics.
  - Any user-visible change bumps `version` in `.claude-plugin/plugin.json`.

## Guides

None. The config has no Skills & guides section.

## Implementation details

1. `skills/next/SKILL.md` `## Load`: after the existing line, add one branch: any `##` section or line outside those `${CLAUDE_SKILL_DIR}/setup.md`'s Config shape defines → ask one question that lists them verbatim, says mise does not read them, and offers a. remove them (recommended) and b. keep them. On remove, delete them from `.claude/mise-config.md` and commit with subject `mise: config cleanup`. On either answer, resume with the original arguments. Keep it to one or two lines.
2. `skills/next/SKILL.md` `## Stopping` (line 72): add the unrecognized-config question to the list of places the run stops.
3. `skills/next/setup.md:3`: when revisiting an existing config, setup also removes any section or line the Config shape below does not define. One clause added to the existing sentence.
4. `README.md`:
   - `## Configuration` (line 38-40): one sentence saying that anything in `.claude/mise-config.md` that setup does not define is called out when a run loads it, with an offer to remove it, and that setup removes it. Keep "Nothing else is configurable."
   - `## How it works` (line 44): the sentence listing where the run waits gains the unrecognized-config question.
5. `.claude-plugin/plugin.json:5`: `"version": "3.0.1"` → `"version": "3.0.2"`.

## Gotchas

- Do not add the three section names to SKILL.md. Reference setup.md's Config shape.
- Do not restate in the README how the check works (what counts as a line, commit subject, decline behavior). State only that it happens and that the run waits for it.
- Do not edit `skills/next/steps/08-close.md` or `skills/next/scripts/state.ts`.
- `${CLAUDE_SKILL_DIR}` is substituted in `SKILL.md` only. Do not use it in setup.md or README.md.
- `yarn prettier --check .` runs over the Markdown and JSON files. Keep the README table and lists prettier-clean.

## Verification

- Run Check: `yarn prettier --check .` and `yarn typecheck`. Run Unit tests: `yarn test`. All must pass.
- No automated test covers this change: it is prose only and `state.ts` parses no config. Substitute check:
  - Read the edited SKILL.md `## Load` and `## Stopping`, setup.md:3, and README.md `## Configuration` and `## How it works`, and confirm each matches items 1-4 above with no instruction stated twice.
  - `grep -n '"version"' /Users/eric/Code/mise-claude-plugin/.claude-plugin/plugin.json` shows `3.0.2`.
  - `git diff --stat` touches only the four files listed above.
