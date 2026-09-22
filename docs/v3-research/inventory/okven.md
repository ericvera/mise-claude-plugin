# Okven agent-instruction inventory

450 rows, 3,238 non-blank-covered lines, 54,434 estimated tokens, 30 files.
Source rows: `okven.jsonl`. Build/scan scripts: `../tools/`.

## 1. Always-loaded vs on-demand

"Always-loaded" = present in every agent context without any action (main session
and every subagent). Measured, not assumed: see §4 evidence note.

| Bucket                                   | When it enters context                                            | Rows | Lines | Tokens     |
| ---------------------------------------- | ----------------------------------------------------------------- | ---- | ----- | ---------- |
| **Always-loaded**                        | every main + subagent context                                     | 111  | 262   | **6,503**  |
| — root `CLAUDE.md`                       | `attachment.type=instructions`                                    | 94   | 189   | 5,551      |
| — skill frontmatter `description`        | skill listing                                                     | 13   | 65    | 905        |
| — `.claude/settings.json` permissions    | harness                                                           | 4    | 8     | 47         |
| **On-demand (total)**                    | —                                                                 | 339  | 2,976 | **47,931** |
| — design docs (`docs/design/*`)          | named as required in config                                       | 36   | 1,024 | 20,651     |
| — skill bodies                           | skill invoked                                                     | 137  | 1,160 | 14,137     |
| — nested `CLAUDE.md`                     | `attachment.type=nested_memory`, on first file touch in that tree | 52   | 186   | 4,353      |
| — `sanity-e2e/runner.md`                 | read by the runner subagent only                                  | 23   | 234   | 3,202      |
| — `mise-config.md` + `mise-checklist.md` | read per mise-role dispatch                                       | 60   | 100   | 2,410      |
| — skill `README.md` files                | never loaded at runtime (by design)                               | 17   | 159   | 2,065      |
| — hook scripts                           | hook process, not model context                                   | 14   | 113   | 1,113      |

Always-loaded is 11.9% of the inventory's tokens. Glue is only 325 of those
6,503 tokens (5%) — the always-loaded block is almost entirely rules.

Largest single on-demand loads: `docs/design/whatsapp-messages.md` 584 lines /
8,114 tokens; `ui-verify/SKILL.md` 284 lines / 3,966; `spanish-voice.md` 98 lines
/ 3,856; `naming.md` 148 / 3,233; `sanity-e2e/runner.md` 234 / 3,202.

## 2. Counts by kind

| kind        | rows | lines | tokens |
| ----------- | ---- | ----- | ------ |
| rule        | 243  | 1,734 | 33,747 |
| glue        | 69   | 534   | 7,906  |
| script      | 38   | 354   | 4,253  |
| config-knob | 43   | 156   | 2,035  |
| gate        | 34   | 159   | 3,213  |
| human-stop  | 8    | 80    | 766    |
| role        | 5    | 63    | 883    |
| loop        | 5    | 49    | 646    |
| artifact    | 5    | 109   | 985    |
| stage       | 0    | 0     | 0      |

No `stage` rows: the Okven repo carries no stage definitions — stages live in the
mise plugin, and the repo supplies only config, checklist, skills and hooks.

Runtime-cost tags: `driver-context` 304 rows, `tool-run` 85, `none` 48,
`subagent-spawn` 16, `loop-multiplier` 15, `human-wait` 14.

## 3. Rules stated in more than one place

Restatement families, each with every location of the same instruction.

| #   | Rule                                             | Locations (file:line)                                                                                                                                                |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Whole-value inline-snapshot assertions           | `CLAUDE.md:138`, `CLAUDE.md:139`, `.claude/mise-checklist.md:12`, `functions/CLAUDE.md:23`, `:24`, `:25`, `.claude/skills/doc-style/SKILL.md:70-71`                  |
| R2  | Comment/JSDoc register and caps                  | `CLAUDE.md:90`, `CLAUDE.md:91`, `.claude/mise-checklist.md:24`, `.claude/skills/doc-style/SKILL.md:44`, `:45-49`, `:50-51`, `:52-58`, `:61-62`, `:65-69`             |
| R3  | One name per concept / vocabulary verbs          | `CLAUDE.md:101`, `CLAUDE.md:102`, `.claude/mise-checklist.md:20-21`, `.claude/skills/doc-style/SKILL.md:25-29`, `docs/design/naming.md:37-77`, `:109-134`            |
| R4  | Sweep a review note across the branch            | `CLAUDE.md:9`, `.claude/mise-checklist.md:19`                                                                                                                        |
| R5  | Exhaustive switch ending in `assertNever`        | `CLAUDE.md:108`, `.claude/mise-checklist.md:16`, `functions/CLAUDE.md:106-113`                                                                                       |
| R6  | Customer copy reaches `send*` as enums           | `CLAUDE.md:79`, `.claude/mise-checklist.md:14`                                                                                                                       |
| R7  | Colocated test per new file / exceptions         | `CLAUDE.md:119`, `.claude/mise-config.md:41-45`, `.claude/mise-checklist.md:8`, `hosting/CLAUDE.md:19-24`                                                            |
| R8  | `internal/` is an export boundary                | `CLAUDE.md:119`, `.claude/mise-checklist.md:15`                                                                                                                      |
| R9  | Helper first / no duplicated flow body           | `functions/CLAUDE.md:78-79`, `.claude/mise-checklist.md:17`, `.claude/skills/ui-conventions/SKILL.md:58-68`, `:75-79`                                                |
| R10 | Each `it()` earns its setup; match the sibling   | `CLAUDE.md:144`, `:145`, `:146`, `functions/CLAUDE.md:21`, `.claude/mise-checklist.md:18`                                                                            |
| R11 | `ui-conventions` required before Vue edits       | `CLAUDE.md:165`, `hosting/CLAUDE.md:3`, `.claude/mise-config.md:48`, `ui-conventions/SKILL.md:3-5`                                                                   |
| R12 | `ui-verify` required before reporting done       | `CLAUDE.md:166-167`, `hosting/CLAUDE.md:3`, `.claude/mise-config.md:49`, `ui-conventions/SKILL.md:167-169`, `ui-verify/SKILL.md:3-5`                                 |
| R13 | Spanish Word Choices table before copy edits     | `hosting/CLAUDE.md:45-48`, `.claude/mise-config.md:31`, `:56`, `ui-conventions/SKILL.md:158-166`, `ui-verify/SKILL.md:193-214`, `docs/design/spanish-voice.md:26-56` |
| R14 | Never read a screenshot in the driver context    | `ui-verify/SKILL.md:14-19`, `sanity-e2e/SKILL.md:17-21`                                                                                                              |
| R15 | Foreign-stack check, stop before taking over     | `ui-verify/SKILL.md:28-40`, `sanity-e2e/SKILL.md:34-48`, `dev-status/SKILL.md:20-37`                                                                                 |
| R16 | Rebuild stale `functions/dist` before exercising | `ui-verify/SKILL.md:41-50`, `sanity-e2e/SKILL.md:49-62`                                                                                                              |
| R17 | Escape hatch: bump the subagent model, say so    | `ui-verify/SKILL.md:168-173`, `sanity-e2e/SKILL.md:89-96`                                                                                                            |
| R18 | Pin `--project-name 'okven sandbox'`             | `sanity-e2e/runner.md:53-75`, `hooks/guard_stripe_sandbox.sh:3-18`, `:60-66`                                                                                         |
| R19 | Commit then push every round                     | `.claude/mise-config.md:22`, `.claude/settings.json:20-32`, `hooks/push_after_commit.sh:10-11`                                                                       |
| R20 | Numbered options, commands in fenced blocks      | `dev-setup/SKILL.md:83-85`, `dev-status/SKILL.md:67-68`, `dev-up/SKILL.md:22-29`, `dev-down/SKILL.md:19-22`                                                          |
| R21 | Show the report, apply only after approval       | `backlog-audit/SKILL.md:7-9`, `backlog-done-check/SKILL.md:7-9`                                                                                                      |
| R22 | `README.md` is not loaded when a skill runs      | `CLAUDE.md:14`, `ui-verify/README.md:1-6`, `sanity-e2e/README.md:1-7`                                                                                                |
| R23 | ID aliases are documentation-only, no casts      | `CLAUDE.md:111-112`, `packages/CLAUDE.md:8`, `eslint.config.mjs:110-124`                                                                                             |
| R24 | Yarn scripts only, never the raw tool            | `CLAUDE.md:40`, `:105`, `:142`                                                                                                                                       |
| R25 | Errors propagate, no swallowing try/catch        | `CLAUDE.md:76`, `hosting/CLAUDE.md:39-40`                                                                                                                            |
| R26 | Nothing outside the declared scope               | `CLAUDE.md:190-191`, `.claude/mise-checklist.md:10`                                                                                                                  |
| R27 | Pre-shipping checklist over each message         | `.claude/mise-checklist.md:3-4`, `docs/design/whatsapp-messages.md:547-567`                                                                                          |

Two internal contradictions found:

- `sanity-e2e/SKILL.md:70` says spawn the runner with `model: 'sonnet'`;
  `sanity-e2e/README.md:23` says the runner is `haiku`; `runner.md:4` says
  "normally on Haiku, sometimes escalated to Sonnet".
- `ui-verify/SKILL.md:169` offers `sonnet` as the escalation from `haiku`;
  `sanity-e2e/SKILL.md:93` offers `opus` as the escalation from `sonnet`.

## 4. Rule-path trace

### Evidence for how project rules reach subagents

Measured over 1,671 subagent transcripts under
`~/.claude/projects/-Users-eric-Code-okven*` with
`../tools/claudemd-attachment-scan.mjs`, `../tools/mise-role-context-scan.mjs`,
`../tools/meta-split.mjs`:

- Root `CLAUDE.md` reaches a subagent as `attachment.type = "instructions"`,
  `files[].type = "Project"`. It is present in **349/349** mise-role subagent
  runs whose transcript metadata carries the current `requestShape` field, and in
  **0/339** runs on Claude Code ≤ 2.1.261. Installed version here: 2.1.272.
- Nested `CLAUDE.md` (`functions/`, `hosting/`, `packages/`) arrive as
  `attachment.type = "nested_memory"`, triggered by touching a file in that tree
  — so they are absent from any role run that never opens a file there.
- `mise-config.md` and `mise-checklist.md` reach roles only because the role
  instruction files tell them to read them: `roles/implementer.md:13`,
  `roles/documenter.md:11`, `roles/reviewer.md:3`, `roles/acceptance.md:3`,
  `roles/critic.md:3` (config only — the critic is never pointed at the
  checklist).
- Skills & guides entries are copied verbatim into a task's `## Guides` section
  by `stages/plan.md:137`; that carries the **entry line**, not the skill body.

Observed per-role reach, Claude Code ≥ 2.1.263 runs only:

| Role        | runs | root CLAUDE.md | mise-config | checklist | `doc-style` body | `functions/CLAUDE.md` |
| ----------- | ---- | -------------- | ----------- | --------- | ---------------- | --------------------- |
| implementer | 216  | 165            | 215         | 213       | 44               | 96                    |
| documenter  | 115  | 111            | 113         | 111       | **111**          | 40                    |
| reviewer    | 111  | 86             | 111         | 111       | **14**           | 29                    |
| critic      | 50   | 20             | 50          | **2**     | **0**            | 12                    |
| acceptance  | 15   | 11             | 15          | 15        | **1**            | 6                     |

(The sub-100% root-CLAUDE.md columns are entirely runs on the older transcript
format; on the current build the figure is 100% — see the 349/349 split above.)

### (a) Test style, including inline snapshots

Exact current wording:

- `CLAUDE.md:138` — "**Always use inline snapshots** — Use
  `toMatchInlineSnapshot()` for value/object assertions. Never use `toContain`,
  `toBe` (for objects), `toMatchObject`, or `expect.objectContaining`. Snapshot
  the full returned value, not a sub-property and not a hand-built object that
  cherry-picks fields — both hide regressions in fields the test author didn't
  think to assert on. Add a brief `// Verify: ...` comment above the snapshot
  … A test that asserts a throw uses `toThrowErrorMatchingInlineSnapshot()`;
  plain `toThrow` / `toThrowError` hide the message."
- `CLAUDE.md:139` — "**No drilling inside `expect()`**: never `.length`, an
  index, `.at()`, `.map()`, or a field read on the value under test. … inject the
  threshold that made it large … one named digest helper … Mock calls are
  snapshotted as the whole `mock.calls`, never one index."
- `.claude/mise-checklist.md:12` (rule 6) — "Test assertions cover whole values:
  the full send\*/mock call args including body text, and full DB diffs. … no
  `.mock.calls[0][0].<field>` drilling, no substring matching, and no hand-built
  partial expected objects (enforces CLAUDE.md Testing §4). …"
- `functions/CLAUDE.md:23` (never read Firestore in a test), `:24` (snapshot the
  whole send), `:25` (register a serializer rather than hand-build).
- `.claude/mise-config.md:37` carries **no wording** — only the pointer "See
  CLAUDE.md → Testing, functions/CLAUDE.md, hosting/CLAUDE.md".
- **No lint rule enforces this family.** The only test-style rule with lint
  backing anywhere in the repo is "no `describe()`" (`CLAUDE.md:126` ↔
  `eslint.config.mjs:194-205`). The rest of `eslint.config.mjs` restricts comment
  position (`:77`), comment length (`:91`), `as <ID>` casts (`:110-124`),
  `handle*` delegation (`:135-152`) and attribution imports (`:161-189`).
  Assertion shape, drilling, snapshot wholeness and `// Verify:` comments are
  prose-enforced only.

| Role        | In context when it writes/judges tests? | Path                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| implementer | **Yes, twice**                          | CLAUDE.md injection (349/349) → `CLAUDE.md:138-139`; checklist rule 6 via `mise-config.md:5` → `roles/implementer.md:13`, answered at `roles/implementer.md:31` (213/216). `functions/CLAUDE.md:23-25` only when it opens a `functions/` file (96/216). |
| documenter  | Yes, but out of mandate                 | CLAUDE.md injection (111/115) and checklist (111/115) carry it, but `roles/documenter.md:3` forbids changing code behavior, so it never writes a test.                                                                                                  |
| reviewer    | **Yes, twice**                          | CLAUDE.md injection (86/111 old format, 100% current) plus checklist read 111/111; `roles/reviewer.md:13` requires re-answering every rule the implementer marked `n-a` or left unconfirmed.                                                            |
| critic      | Only via CLAUDE.md                      | Checklist reaches it in **2/50** runs — `roles/critic.md:3` never names the `Checklist:` file. `roles/critic.md:9-16` gives it no assertion-style mandate, so the rule is present as background text only.                                              |
| acceptance  | Present, not re-checked                 | Checklist read 15/15 and CLAUDE.md injected, but `roles/acceptance.md:9-10` only confirms a `Checklist:` line exists per task commit and answers the `## Prose` rules; it never re-answers Code rule 6.                                                 |

Net: the inline-snapshot wording is in the context of every role that could act
on it, twice over for implementer and reviewer, and it is enforced by no script
or lint anywhere.

### (b) Comment / JSDoc / doc style, including the doc-style skill

Exact current wording:

- `CLAUDE.md:90` — "**JSDoc grounds the reader**: a doc comment states the
  product moment or flow the export serves and what it produces, for a maintainer
  arriving without context — never which functions call it … Implementation
  mechanics go in inline comments. The doc-style skill is the operative rule set."
- `CLAUDE.md:91` — "**Comment and doc register**: follow the `doc-style` skill
  for hard length caps, plain words, and a final rewrite pass over changed text".
- `.claude/mise-config.md:50` — "doc-style (skill, required): before writing
  comments, JSDoc, or Markdown docs, and as a rewrite pass before reporting done".
- `.claude/mise-checklist.md:24` (rule 15) — "Every comment explains why, or a
  non-obvious what. None restates the code. None misdescribes the new behavior,
  including a neighboring comment the diff made stale. … re-read every
  `// Verify:` line against the snapshot directly below it. Every enum member the
  diff adds or sits beside carries a one-line doc comment (doc-style rule 14). …"
- `.claude/skills/doc-style/SKILL.md` — the operative rules, 17 numbered items
  plus a no-churn clause and a rewrite-pass procedure (`:19`–`:92`, 1,139 tokens).
  Key ones: `:20-22` banned prose shapes; `:32-37` no colons, semicolons,
  em-dashes or slashes in prose; `:44` delete any name-derivable comment;
  `:61-62` JSDoc ≤ 3 sentences, inline ≤ 2 lines, never link a doc file;
  `:65-69` every enum member gets a one-line description; `:78-85` compliant text
  stays byte-identical; `:86-92` the rewrite pass.
- Lint enforces two fragments only: `eslint.config.mjs:77`
  (`line-comment-position` above) and `:91` (`max-len` `comments: 80`).

Two-pass mode is **on** for this repo — `.claude/mise-config.md:68` sets
`documenter: fable`, which `stages/execute.md:14` reads as the two-pass switch.

| Role        | Doc-style wording in context when it writes/judges prose? | Path                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| implementer | **Not applicable**                                        | `roles/implementer.md:17` (two-pass mode): "code only — no comments, JSDoc/docstrings, or markdown docs"; `:31` answers `## Prose` rules `n-a — documenter`. It still gets `CLAUDE.md:90-91` by injection and the `doc-style` entry line via the config, and reads the skill body in 44/216 runs — all without prose to write.                                                                                                |
| documenter  | **Yes, full body**                                        | `roles/documenter.md:11` — "the Skills & guides entries whose conditions match comments or docs — follow them, `required` ones mandatorily" → `mise-config.md:50` → skill body read in **111/115** runs. Also CLAUDE.md injection 111/115 and checklist rule 15 111/115. This role runs on `fable`.                                                                                                                           |
| reviewer    | **Pointer only, 87% of runs**                             | `roles/reviewer.md:12` puts the documenter's prose in scope and `:13` requires answering checklist rule 15, but `roles/reviewer.md:3`'s clause is "Skills & guides entries whose conditions **target reviewing** this kind of work", and `mise-config.md:50`'s condition is worded for **writing**. Skill body read in **14/111** runs; it judges prose against `CLAUDE.md:90-91` + `mise-checklist.md:24` alone in the rest. |
| critic      | **Not at all**                                            | Skill body read in **0/50** runs; checklist in 2/50. `roles/critic.md:3` scopes Skills & guides to "the artifact's subject" (requirements/plan docs) and `:6-16` gives it no prose mandate.                                                                                                                                                                                                                                   |
| acceptance  | **Checklist only**                                        | `roles/acceptance.md:10` — "answer the checklist's `## Prose` rules against them" (the `Docs:` commits). Checklist read 15/15; doc-style skill body read in **1/15** runs.                                                                                                                                                                                                                                                    |

Net: the `doc-style` entry **line** reaches every role (865 subagent transcripts
contain it, because every role reads `mise-config.md`), but the 17 rules
themselves reach only the documenter. The two roles that judge the documenter's
output — reviewer and acceptance — do so against `mise-checklist.md:24`, a single
rule that restates four of the seventeen.
