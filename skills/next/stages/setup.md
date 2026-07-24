# Set up mise

Interview the user and write `.claude/mise-config.md` from scratch. The generated file must be **minimal** — values and applicable freeform sections only, no instructional prose — because every stage and every fresh-context subagent reads it. The section-by-section reference (what each section means, its exact format, and a full example of the generated file) is `../references/config-reference.md`; read it before interviewing. Do not copy the reference into the project.

If `.claude/mise-config.md` already exists, read it and revisit each section with the user (current value shown, offer to keep) instead of starting blank.

## Interview

Ask in small batches per the question format in `../references/interaction.md`, inferring suggestions from the repo (package.json scripts, existing test dirs, UI framework) so most answers are one letter.

Before asking about the optional sections, scan the repo for existing sources: guide documents (`docs/`, top-level `*.md`) and project skills (`.claude/skills/`). When one covers a section, suggest a pointer to it (`See docs/testing.md`) as the default answer instead of transcribing its content — pointers keep the config terse and the source of truth in one place. Inline only values short enough that a pointer would cost more to follow than to read.

1. **Required values** — the mise directory (the workflow's own working directory — suggest `.mise/`; it must not be a directory holding anything else, since the workflow creates and deletes its contents), the branch convention (how work branches are named — infer a suggestion from recent branch names, e.g. `git branch --sort=-committerdate`, falling back to `feat/<slug>` / `fix/<slug>`), and the three quality commands (Format, Check, Unit tests; each one command or an ordered list).
2. **Mocks** — for projects with a UI: Mock conditions — which kinds of work should get an HTML mock before requirements? Bulleted conditions (e.g. "anything affecting Vue components"). Skip → no section → features never mock. If any conditions were given, also Mock guidance — product name, UI code root, and any look-and-feel notes so mocks match the real product.
3. **Test conventions** — where each kind of test lives, naming, frameworks, fixtures.
4. **Test exceptions** — kinds of fixes/changes that should NOT get a regression test, each with its substitute verification. Suggest the default: `Purely visual changes (spacing, colors, cursor styles) — verify with before/after screenshots`. If the project has no e2e testing at all, capture that here as a blanket exception (e.g. `Anything that would need an e2e test (no e2e infrastructure exists) — verify with unit tests plus manual verification`) — the plan stage treats e2e coverage as mandatory unless an exception excuses it, so without this entry every user-facing plan has no valid shape. Skip → no section.
5. **Skills & guides** — project skills and guide documents agents should use, one per line: `name-or-path (skill|doc[, required]): when to use`. Prompt specifically for: an e2e test runner (mark `required` if e2e tests must never be run directly), an e2e test writing skill, a manual-testing/screenshot skill, and any design/voice/domain guides. Skip → no section.
6. **Database migrations** — the migration generation command, if the project has one.
7. **Backlog** — does the user track work externally (Todoist, Linear, Jira, a markdown file)? If yes, capture how to fetch the top items — tool, query, sections/labels — as freeform prose; it is read verbatim.
8. **Retrospective** — after acceptance, a subagent proposes improvements to the project's guides and config mined from the run; the user adopts or rejects each. On by default: ask whether to keep it, and write `Retrospective: off` only on a no (keep → no line).
9. **Ship** — what the close-out does with the finished branch after the cleanup commit: `pr` (push and open a pull request), `merge` (merge into the default branch — also ask the merge style, squash / merge commit / rebase, and record it, e.g. `Ship: merge (squash)`), or `off` (the user ships manually). Written as a top-level `Ship:` value line; skip → no line → the close-out asks each time.

If the user offers code conventions, they belong in `CLAUDE.md`, not the config — offer to add them there.

## Write and verify

Write `.claude/mise-config.md` in the reference's generated-file shape, containing only the sections the user filled. Print the final file and confirm it looks right.

Then ensure the project's `CLAUDE.md` carries the shipping guard, so sessions running outside the workflow don't ship in-flight work — add this line with the configured mise directory substituted (creating `CLAUDE.md` if needed); if a previous mise guard line is already there, update it to the current directory instead of adding another:

> Never open a pull request for, or merge into another branch, any branch whose tree contains `<mise-directory>/` — that work is still in flight; run `/mise:next` on that branch to finish acceptance and cleanup first.

Once confirmed, commit the config and the guard together (e.g. `mise: setup`) — the config is part of what makes any checkout resumable, same as every other checkpoint.
