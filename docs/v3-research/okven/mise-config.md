# okven `.claude/mise-config.md`, rewritten to the v3 shape

Reference: `docs/v3-research/v3-design.md` §Config. Required sections are Mise
directory, Branch convention, Ship, Quality commands. Optional are Mock
conditions, Mock guidance, Test exceptions, Skills & guides, Adherence, Ledger,
Backlog, Review notes. Checklist, Models and Retrospective are removed.

Every value below that survives is carried over verbatim from okven's current
file. Copy the fenced block over `.claude/mise-config.md`.

```md
# Mise Configuration

Mise directory: .mise/
Branch convention: feat/<slug> for features, fix/<slug> for bug fixes
Ship: pr

## Quality commands

- Format: handled by the lint-staged pre-commit hook (prettier on staged files); no repo-wide format run
- Check:
  - yarn build-tsc
  - yarn lint
- Unit tests: yarn test <path> from the closest package directory; for tests under functions/, run yarn test:up first (idempotent emulator start)
- Task tests: yarn test <path> from the closest package directory; for tests under functions/, run yarn test:up first (idempotent emulator start)
- Flaky under machine load: the hosting suite's Nuxt setup hooks time out when several worktrees build at once. A hook-timeout failure is not a regression — rerun that suite with `yarn test --maxWorkers=4` before investigating it.
- Dependencies: after any `package.json` dependency edit, run `yarn install` and commit the resulting `yarn.lock` — CI runs `yarn install --immutable` and fails on a stale lockfile

## Git

- At the start of a run, and again before the first execute task: git fetch, rebase onto origin/main, push --force-with-lease.
- Commit and push at the end of every fix/review round.

## Mock conditions

- Anything adding or changing UI in `hosting/` (Vue components, pages, layouts)
- Anything adding or changing WhatsApp messages

## Mock guidance

Product: Okven. UI code root: `hosting/`. UnoCSS strict theme (only config tokens exist), mobile-first, Spanish (Puerto Rico) copy per docs/design/spanish-voice.md. WhatsApp message mocks must follow docs/design/whatsapp-messages.md. Emphasize a UI term or button name with bold — never «» or quote characters (in code this is the `<Strong />` atom).

Mock copy is a draft, not a contract. A design, copy, or fresh-eyes pass that finds an approved label ambiguous, calqued, or too wide at 375px raises it as a defect for that round, rather than recording it unfixed because the task pins the wording.

## Test exceptions

- Purely visual changes (spacing, colors, styles) — verify with ui-verify screenshots
- Anything that would need a browser/e2e test (no e2e infrastructure) — verify with unit tests plus ui-verify, and sanity-e2e when the order flow is touched; sanity-e2e runs once per branch, as the final gate before the PR — tasks do not run (or re-defer) it individually
- Changes to existing files with no colocated test, where similar files also have none — do not introduce a new test file; verify with ui-verify (UI) or emulator smoke (backend)
- These exceptions cover **existing** files only. Any file this work creates gets a colocated test, including files under `internal/` and inside `packages/`. The exceptions are `hosting/components/` and `hosting/pages/`, where no atom, no molecule and no page carries a colocated test, so a new one follows that convention and is verified with ui-verify (a page's logic belongs in a composable, and the composable is tested), and any `__test__/` or `__mocks__/` directory, where a mock, fixture or helper is verified by the tests that use it.

## Skills & guides

- ui-conventions (skill, required): before writing or editing any Vue component or page
- ui-verify (skill, required): after any UI change, before reporting done
- doc-style (skill, required): before writing comments, JSDoc, or Markdown docs, and as a rewrite pass before reporting done
- sanity-e2e (skill): order-lifecycle smoke test before PR/merge
- wa (skill): drive the WhatsApp emulator as a customer
- dev-up (skill): start the dev emulator stack
- dev-status (skill): check dev emulator health
- dev-down (skill): stop the dev emulator stack
- CLAUDE.md → Testing, functions/CLAUDE.md, hosting/CLAUDE.md (doc, required): any test change
- docs/design/spanish-voice.md (doc, required): any user-facing Spanish copy
- docs/design/whatsapp-messages.md (doc, required): any WhatsApp message changes
- docs/design/order.md (doc, required): any change to order statuses, transitions, timeouts, or close-out paths, updated in the same task
- docs/design/message-classification-flow.md (doc, required): any change to the classifier prompt, its output schema, or freeform routing

## Adherence

- tests: .claude/adherence/tests.md
- comments: .claude/adherence/comments.md
- vocabulary: .claude/adherence/vocabulary.md, glossary: docs/design/naming.md

## Ledger

.claude/mise-ledger/

## Backlog

Use the Todoist MCP to list tasks in project "Okven - R&D" (id `6XCj9JhwCfqr95Fm`), sections "To Do (Urgent)" then "To Do", top items in order.

## Review notes

Delta Review notes file for the branch, per the `delta:review-notes` skill's contract.
```

## What changed

| Current section                                                                                                       | v3                   | Note                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Mise directory`, `Branch convention`, `Ship`                                                                         | kept                 | required, values unchanged                                                                                                                                                                                                     |
| `Checklist: .claude/mise-checklist.md`                                                                                | **dropped**          | Checklist is removed in v3. `.claude/mise-checklist.md` in okven is not deleted by this change; the adherence example files replace what rules 6, 12, 14, 15 and 24 of it were doing, and the rest is unowned once this lands. |
| `## Quality commands`                                                                                                 | kept                 | values unchanged. No `Build` entry is added — `build-tsc` already runs under `Check`. Add `- Build: yarn build` if step 9's rebuild should be a separate command.                                                              |
| `## Mock conditions`, `## Mock guidance`, `## Test exceptions`, `## Skills & guides`, `## Backlog`, `## Review notes` | kept                 | values unchanged                                                                                                                                                                                                               |
| `## Test conventions`                                                                                                 | **folded**           | its one line ("See CLAUDE.md → Testing, functions/CLAUDE.md, hosting/CLAUDE.md") became a required `doc` entry under Skills & guides, which is the only v3 section that carries "read this before doing that".                 |
| `## Models`                                                                                                           | **dropped**          | v3 dispatches every subagent with `model: opus` and the driver runs on the session model. okven's `documenter: fable` line has no v3 home, because the documenter role is deleted.                                             |
| —                                                                                                                     | `## Adherence` added | three families. The vocabulary family names the glossary, per the v3 line format `- <family>: <path>[, glossary: <path>]`.                                                                                                     |
| —                                                                                                                     | `## Ledger` added    | the v3 default is `.claude/mise-ledger/`; written explicitly so the retro skill can find it without reading the reference.                                                                                                     |

## Sections the v3 reference does not define

- **`## Git`** — kept in the block above because dropping it loses real behavior, but v3's config reference has no such section. The rebase-at-start instruction has no v3 home at all: flow step 1 creates the branch and says nothing about rebasing onto `origin/main`, and step 5 commits per task. Either v3 gains a `Git` section in `references/config-reference.md`, or these two lines move into `Ship`.
- **Two bullets inside `## Quality commands`** — `Flaky under machine load` and `Dependencies` are not `Format`, `Check`, `Unit tests`, `Task tests` or `Build`. They are conditions on how a command is run and how its failure is read. v3 defines the command list, not per-command notes. They are kept as bullets here; if the reference is strict about the five names, they need a home.
- **`## Test conventions`** — no v3 section; folded into Skills & guides above.
- There is no `## Retrospective` section in okven's current file, so that removal is a no-op here.
