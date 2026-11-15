# Review

## Tasks

- 01_01 flag unrecognized config: before a run starts, Route asks one question listing any `##` section, or line outside the title and sections, that the config shape does not define, offering a. remove or b. keep. Setup removes the same content when it revisits a config. README Configuration and How it works updated; version 3.0.2. Verify: read `skills/next/SKILL.md` (Route, Stopping), `skills/next/setup.md:3`, `README.md`; or add `Ship: merge (squash)` to a config and run `/mise:next`. Commits 9a9c921, 36d6cc7, 0cb7fa9, 735c31e, 186ccd1.

## Open assumptions

- `Ship` stays removed. Close keeps ending at the PR.
- The question is asked only when no run is in flight, once per conversation. A keep answer holds for the rest of the conversation and the question returns in a new one.
- After either answer the description from the triggering `/mise:next` call is routed. "Describe what you want to work on:" is asked only when there was none.
- Remove edits the config without committing. Start's commit carries the edit.
- The check is prose in the driver, not in `state.ts`. No automated test covers it.
- Out of scope: any merge in close, and migrating 2.x values into 3.x sections.

## Not reviewed

- The last two fixes (735c31e, 186ccd1) ran after the fix rounds were used up, so no reviewer has read them.

## Amendments

None.
