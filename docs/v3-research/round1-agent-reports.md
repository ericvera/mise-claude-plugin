# Round 1 agent reports (unverified: verifier agents did not run)

## provenance

89 mechanism rows over 62 commits, 2026-03-16..2026-09-12, all refs. Triggers: named-failure-in-a-real-run 24, owner-preference 23, unknown 19, refactor 13, speculative 10; 8 rows have no stated reason anywhere. 11 versions plus a pre-plugin era; skills/ md went 974 lines (pre-plugin) to 743 at 1.0.0 to 993 at 2.1.0, words 8298 to 11267 (1.7.0) to 9974. Only 2.0.0 (+563/-455) and 1.5.0 (+274 code) are large; 1.0.1-1.7.0 are +2..+73 md lines each. Eleven mechanisms were reworked 3+ times; the critic gate and the setup interview top at 6 commits each. Automated verification of all 89 rows against git: 0 date/version/sha failures, 1 quote flagged and confirmed verbatim by hand (execute.md:48 @50c377e). Main coverage: 41 of 46 commits; the 5 uncovered are non-mechanism.

Gaps:

- 66 non-main branch commits (mise: state checkpoints, per-task 'Task N.N fix' commits) carry no provenance row; their content is attributed to the squash commit on main. Mechanism-level attribution inside a branch was decomposed only where the stated reason exists nowhere else (133d2de, be77bae, 5d765fe, 33d9e93 etc.).
- Cannot determine which mise version a run in another repo actually used: the repo records when a version landed on main, not when the owner ran /plugin update. The date->version table is a ceiling, not the installed version.
- No .mise/ artifacts survive for versions 1.0.0-1.5.0 - the earliest .mise/ commit in any ref is a55481c (2026-07-28), and only three branches (feat/critic-stall-heuristic, feat/next-major-improvements, fix/doc-churn-usage) ever committed goals/friction files. For every mechanism before 2026-08-13 the only evidence is the commit message and the file text, which is why 19 rows are trigger=unknown.
- The Kaizen retrospective has run since 1.4.0 (58d4b1a) but its proposals land as ordinary commits; except where the message says so (4051f82, cb905af), retrospective-originated changes cannot be distinguished from hand-authored ones.
- 'Reworked N times' counts commits that touched the anchored mechanism, not semantic reversals. The provenance rows' laterChurn lists were curated, not machine-derived; the independent section-level count in provenance.md (tools/section_churn.py) is main-line only and headings shift across renames.

## okven-offenses

Corpus: 1000 branch commits (905 with .mise/ in tree); 5748 Delta Review autosave commits excluded. Vitest + ESLint 10.7 flat config; no vitest lint plugin. A: the named defect is absent — 5357 toMatchInlineSnapshot, 0 toMatchSnapshot, 0 .snap files ever, 136 toEqual/toStrictEqual/toMatchObject calls of which 0 take a ≥5-line literal. The live offense is drilling inside expect(): 530 added lines, 1081 instances at HEAD across 756 test files; 3 out-of-band sweeps (+9010/−2791, 49 files) undid it. B: 23043 comment vs 74157 code lines (0.31); 1236 JSDoc blocks >5 lines; documenter-stage commits run 11.66 comment:code (2437 vs 209) plus 7272 md lines; attribution.md rewritten 95× to land at 241 lines. 15 examples given; lexical "slop" markers mostly false-positive — the defect is volume and restatement. C: only the 2026-09-05 no-drilling rule has adequate n (3.4→1.1/kloc) and is confounded. D: drilling is lintable today via no-restricted-syntax, no new dependency.

Gaps:

- Who caught each escape is not in git: all 1000 commits are authored by Eric Vera, 5 carry Co-Authored-By. 'Rework = an escape a human caught' is unmeasurable; A.3 uses a commit-subject convention proxy. Delta Review human note text is not stored in refs/review-notes/* (those refs hold only UUID-named file snapshots).
- The mise-run flag (.mise/ in tree, 905/1000) marks 'a run was in flight on this branch', not 'this commit was written by a mise subagent'.
- Every before/after in section C is confounded by branch composition: 596 of 1000 commits sit on backup/pre-rebase-2026-09-09. No comparison should be read as causal.
- The 2026-09-18 checklist change has only 1 day and 107 commits after it — insufficient n.
- The inline-snapshot rule has not changed since 2025-10-14, so no in-window before/after comparison exists for it.
- Span-based counters (big_literal, jsdoc_gt5) are lower bounds: hunks read at -U10, so a call or block closing more than 10 unchanged lines past the last change is missed. Single-line counters are exact (toMatchInlineSnapshot matched grep at 5357).
- Historical comment detection is regex-based, not AST-based; a template-literal line starting with // counts as a comment. The D3/D6/D7 figures come from real ESLint runs and are unaffected.
- Squash merges hide authored dates; section C uses the earliest branch commit carrying each rule phrase, still an upper bound.
- No transcript evidence was read (task scoped to git history), so 'the agent was told the rule and broke it anyway' is not established.
- docs/v3-research/inventory/provenance.md does not exist; mise versions were derived from plugin.json history instead.
- Lint candidates D2, D8 and D10 were written but not run repo-wide; only D1, D3, D6 and D7 have measured hit counts.

## inv-mise-roles

425 rows: every non-blank line of the 12 assigned markdown files plus 44 state.ts invariants. Role files 228 lines → 210 rows (186 behavioural): implementer 58, retrospective 55, documenter 34, critic 24, reviewer 23, acceptance 16. 93 direct cross-role duplication links; 52 role rows restate something 2+ other roles are also told — heaviest documenter↔implementer 25, implementer↔reviewer 10, critic↔reviewer 9. The checklist is answered or verified by 4 roles; "read the config" and "final message to an orchestrator" appear in all 6. 24 config knobs: okven overrides 13 (all 7 Models lines, documenter→two-pass on; checklist at the 15-rule cap, 821 words, 3/15 in the mandated `<rule> — <how>` shape) versus this repo's 4; okven adds 3 sections the reference defines nowhere. 37 of 44 state.ts invariants are restated in prose; 16 restating lines sit in runtime-loaded files.

Gaps:

- runtimeCost/costNote are derived from the instruction text, not measured: actual spawn counts, iteration counts and token costs per run were not observed (no transcripts read in this task).
- preventsClaim is "unstated" on 297 of 425 rows — the text states or clearly implies no failure for them; I did not infer one.
- overlapsWith is my reading of shared subject matter; the files carry no marker for it, so there is no ground truth and the 93-link count is a judgement, not a measurement.
- The firesWhen enum given in the task has no value for a file never loaded at runtime. README.md's 48 rows carry firesWhen "always-loaded" with a costNote saying it is documentation only; that enum value is not literally true for them.
- Whether docs/skill-authoring.md actually reaches a subagent in any given run depends on the Skills & guides condition matching (it is not `required`); not determinable from the files.
- The state.ts prose-restatement search was grep-driven over SKILL.md, stages/, references/ and docs/. A restatement using different vocabulary could have been missed; the 7 "no prose restatement found" rows are negative results from that search, not proof of absence.
- okven comparison used only the current working-tree /Users/eric/Code/okven/.claude/mise-config.md and mise-checklist.md. Whether a default was overridden at some earlier point in okven's history was not examined.
- Where one line carries several rules, the rows share that line range; which clause of the line each row covers is not recorded in the JSONL.

## inv-mise-flow

365 rows cover all 496 non-blank lines of the 8 assigned files (script-verified coverage). Kinds: rule 162 rows/190 lines, artifact 28/108, glue 68/74, role 14/46, script 28/39, human-stop 19/24, config-knob 19/23, gate 14/14, loop 9/9, stage 4/4. Enforcement: 316 prose, 35 script, 14 both — no hook, no lint. 15 subagent spawn sites; worst case for T tasks = 7T+19+N+4F two-pass (4T+19+N+3F single-pass), where 19 = 16 critic + 1 gate repair + 1 acceptance + 1 retrospective, and explore count N and acceptance-fix rounds F are unbounded in the text. 30 human stop sites, 11 terminal, against interaction.md:7's "exactly two human gates". 9 stage-file loops, 3 with no stated bound. 34 instructions restated across 2-10 locations. docs/state-machine.md (53 lines) is never loaded at runtime.

Gaps:

- execute.md:58-63 does not say whether a reviewer is re-dispatched after a fix round; the reviewer multiplier is recorded as 1 per task on that reading, so per-task worst case could be higher.
- plan.md:27 states no bound on the number of `explore` subagents per plan stage — N is undetermined.
- execute.md:97 states no bound on user-flagged acceptance rounds — F is undetermined, and each round costs 1 acceptance + up to 2 fixes + a full gate.
- goals.md:73 and interaction.md:12 state no iteration bound for the goals/mock gate loop.
- 138 of 365 rows have preventsClaim "unstated": the text names no failure. Where a failure is clearly implied I wrote it prefixed "(implied: …)"; I did not invent one otherwise.
- Whether interaction.md is re-read per stage dispatch or loaded once per session cannot be determined from the files: SKILL.md:35 loads it once and says dispatched files assume it, while goals.md:17,29,75, requirements.md:43, plan.md:36 and execute.md:5 each cite `../references/interaction.md` again.
- runtimeCost and costNote are structural readings of the instruction text, not measured from transcripts; no run was executed or timed.
- enforcedBy=script rests on docs/state-machine.md plus the command surface at skills/next/scripts/state.ts:9-36 and 317-545; state.ts was not itself inventoried (not an assigned file), so prose/script splits inside individual engine behaviours are unverified line by line.
- The `Review notes` config knob (setup.md:38) has no consumer in any assigned file — could not determine what reads it.
- skills/next/roles/*.md and references/config-reference.md were out of scope, so rows whose behaviour lands inside a role (e.g. the checklist rules at setup.md:19-27) describe only what the assigned files state.

## delta-notes

9 delta-review stores exist (okven, delta-review, ericvera.dev, firebase-kit, getsetdel, knownhumans, metaforico, mise-claude-plugin, scdate); okven's 8 worktrees share okven/.git, no per-worktree stores. Harvested 555 rows / 537 distinct notes across 16 branches; all 16 are mise runs, so mise counts == overall. Categories: test-style 127, convention-violation 71, question 69, wrong-behaviour 64, naming 50, ui-visual 45, dead-or-duplicate 37, comment-doc-slop 35, over-engineering 25, missed-requirement 8, other 6. Per run: attribution-3 238, specials-fixes 157, menu-pin 37, close-out-orders 32, voice-notes 25. 178/537 (33%) are rule escapes (top: CLAUDE.md:145 test-scenarios 24, CLAUDE.md:101 vocabulary 21, functions/CLAUDE.md:78 helper-first 15, CLAUDE.md:139 no-drilling 11, colocated-test 11); 354 no-rule. Retention: notes survive merge/branch deletion only if cleared via Clear Resolved (archived); explicit deletes leave nothing — 421 of 955 responded noteIds have no surviving note text (lo-de-siempre 209/212, extract-firebase-callables 51/51).

Gaps:

- Category per note is my manual judgment (tools/categories.txt), not a labeled ground truth; boundary cases (question vs defect, ui-visual used for user-facing copy, wasteful-query notes filed as wrong-behaviour) would shift counts by a few percent.
- ruleAlreadyExisted is keyword-regex matching against a curated rule table (tools/rules.tsv); spot checks showed roughly 5% false positives (e.g. rows 335, 533 matched HELPER/VOCAB loosely). 'no-rule' means nothing in my table matched, not proof no rule exists anywhere in the repo.
- Rule-escape counts assume the note flags a real defect; I did not read the 1MB of agent responses to check which notes the agent answered with 'no change needed' or pushback.
- 421 of 955 responded noteIds have no surviving note text (explicit deletes are never archived per DEVELOPMENT.md:138), so the escape record is biased toward branches where the reviewer used Clear Resolved, and toward Aug-Sep 2026. Whole runs are missing: eric/extract-firebase-callables (51), eric/restaurant-sales-deck (32), eric/lo-de-siempre (209 of 212), firebase-kit fix/upgrade-npm-packages (5), scdate feat-scdate-testing (1), getsetdel feat-testing-subpath (2).
- wasMiseRun could not be computed as `git log <branch> -- .mise` for 8 deleted branches; I used the PR head oid (still in the local object DB or via the GitHub commits API) and, for eric/attribution-2 and firebase-kit feat/keepalive-caller where no PR exists, the presence of .mise/* paths in refs/review/<branch> trees. That last evidence is indirect.
- Note dates are createdAt only; nothing in the store says which mise stage produced the code, or whether mise's own critic/reviewer/acceptance gates saw the defect first. That link cannot be made from these files.
- status is the note file's own field, which the extension only refreshes while running, so 'resolved'/'addressed' is not a reliable outcome signal.
- Multi-turn threads are concatenated with a <<<turn>>> separator in noteText and response; per-turn timing and who-asked-what ordering is flattened.
- delta-review, knownhumans and metaforico stores hold clusters files only — no notes were ever written there, so those repos contribute zero evidence.

## inv-okven

450 rows over 30 files, 3,238 non-blank lines, 54,434 est. tokens; every non-blank line covered, no unresolved id refs. Always-loaded 6,503 tokens (11.9%; root CLAUDE.md 5,551, skill descriptions 905, settings 47) vs on-demand 47,931 (design docs 20,651, skill bodies 14,137, nested CLAUDE.md 4,353, runner.md 3,202, mise config+checklist 2,410, READMEs 2,065, hooks 1,113). Kinds: rule 243, glue 69, config-knob 43, script 38, gate 34, human-stop 8, role 5, loop 5, artifact 5, stage 0. 27 restatement families; 2 internal contradictions (runner model haiku/sonnet; escalation target sonnet/opus). Measured from 1,671 subagent transcripts: root CLAUDE.md attaches to 349/349 current-format role runs, 0/339 on ≤2.1.261. doc-style body reaches documenter 111/115, reviewer 14/111, acceptance 1/15, critic 0/50; checklist reaches critic 2/50. No lint enforces inline-snapshot rules.

Gaps:

- Design docs (spanish-voice, whatsapp-messages, order, message-classification-flow, naming = 1,024 lines, 20,651 tokens) are inventoried at section granularity, not one row per instruction: they are product spec rather than agent instruction, and line-level splitting was out of budget. Coverage is complete but their internal restatements are not resolved.
- Claude Code does not persist system prompts in JSONL, so skill-listing cost (the 905 tokens of frontmatter descriptions) is estimated from file text, not measured in-context.
- The 349/349 vs 114 root-CLAUDE.md split uses presence of `requestShape` in subagent meta.json as a proxy for CLI build; older subagent transcripts do not record a reliable per-run CLI version, so the exact version boundary between 2.1.261 and 2.1.263 is inferred from main-transcript version fields.
- Could not determine whether a nested CLAUDE.md (functions/hosting/packages) is attached BEFORE the role writes the relevant code — the scan only proves the `nested_memory` attachment appears somewhere in the run.
- `.claude/settings.local.json` exists (extra `mcp__playwright__browser_click` allow, `enabledMcpjsonServers` todoist+playwright, `outputStyle: Concise`) but was outside the assigned scope, so it is not inventoried.
- `.mise/` task files are deleted at close-out, so the rendered `## Guides` section of a real task file could not be read directly; the claim that config Skills & guides entries are copied verbatim rests on skills/next/stages/plan.md:109-110,137 plus 865 subagent transcripts containing the doc-style entry line.
- The other 9 design docs linked at CLAUDE.md:52-64 (business, schedule, test-mode, order-payment-flow, repeat-order, menu-markup, message-processing-mode, pwa-updates, financial-report, attribution, customer-sensitive-data, vue-state-management, dev-environment) are indexed but not made mandatory by any assigned file, so they are not inventoried; their token cost is unmeasured.
- Per-role reach percentages mix all branches and dates; no attempt was made to weight by recency, and runs where a role legitimately had no reason to read a file are not separated from runs where it should have.

## digester

Layout: main `<project>/<sessionId>.jsonl`; subagents in `<sessionId>/subagents/agent-<id>.jsonl` + `.meta.json` (2126/2121 files); zero sidechain rows in main files. Digester validated on 4 sessions (40.1MB, 2.3MB, 21.7MB, 42KB) against an independent jq/awk recount: per-model tokens, spawns (115), transcripts (168), users (245), slash (28), compactions (4), api errors (4), denials (7), state.ts calls (28) all matched exactly; wall-partition residual 0. Cross-check exposed two real bugs, now fixed: subagent rows repeat a message.id with progressive usage (first-row-wins undercounted output 40-70%), and chained `state.ts` calls were half-counted. Batch: 29 dirs, 99 sessions, 0.58GB, 0 failures, 7.5s, 860MB peak. Aggregate 128.3h model, 332.6h tool, 4461.5h human-wait, 2142 subagents, 43 mise sessions. Subagent nesting real: spawnDepth {1:115, 2:52, 3:1}.

Gaps:

- Gate pass/fail is undeterminable for most runs: exit codes appear only as `Exit code N` on errored tool_results, and piping to tail/head or `; echo "exit: $?"` masks $?. 1240 of 1473 gate runs in the largest session are pass:null.
- Permission-prompt wait time is indistinguishable from tool execution time — no 'prompt shown' event exists in the transcript — so it is charged to toolMs.
- No mise iteration counter exists anywhere: state.ts emits only in_flight/file/route/stages{verdict}/next_action. Critic-round counts must be inferred from repeated Agent spawns citing the same roles/<role>.md.
- miseRole cannot be resolved for depth-2/3 subagents (53 of 168 records in the largest session): they have no main-thread row and their prompt is not stored in meta.json.
- Could not determine why 5 of 115 Agent spawns in the largest session have no result row carrying agentId (1 no-result, 4 user-rejected) — whether compaction dropped them or they were interrupted is not recorded.
- Subagent model attribution mixes two vocabularies: meta.json says `fable`/`opus`/`sonnet`/`haiku`, tool results say `claude-opus-5[1m]`/`claude-fable-5`. 36 of 168 records in the largest session resolve to `unknown` because neither source was present.
- tool-results/*.txt sidecars (39 dirs) are not read, so any tool output offloaded to disk contributes no stdout to failure-signal detection.
- The 30-minute human-wait cap (humanWaitMsCapped30m) is an arbitrary choice, not evidence-derived; raw gaps run to 288.8h in one long-lived session.

## run-map

34 mise runs in Okven, 2026-07-15 to 09-19: 27 merged, 4 abandoned, 3 open. Sources: 33 branch refs plus 38 Delta Review state refs, which are the only surviving record for 24 runs whose branches were squash-merged and deleted. Timeline quality: 10 exact (checkpoint commits), 4 sampled, 20 unusable (whole .mise arrived in one sync). Medians over the 14 usable: goals 0.7h, mock 0h (approved with goals), requirements 0.6h, plan 1.1h, execute 2.9h (p90 225h), close-out 11.6h; whole run 103h (1.x 92h, 2.x 103h). Size vs elapsed: ≤60 LOC → 2.0h (n=2), >10k LOC → 190h (n=6). Six small runs (≤60 LOC); a 9-LOC fix carried 535 artifact lines — ratios 15–59× across them. Gate rounds survive for 21 runs.

Gaps:

- Wall-clock is unrecoverable for 20 of 34 runs: their branch refs were deleted after squash merge and the only .mise history is a Delta Review chain written in one sync (e.g. fix/menu-availability's whole run spans 39 seconds of commit time). Active working time is never in git for any run.
- The SMALL-RUN list has exact per-stage times for only 2 of 6 runs (eric/fix-logo-size, eric/order-at-time); for eric/fix-ending-slash, fix/malformed-manifest, fix/missing-image and eric/item-availability-retro the per-stage elapsed cannot be determined from git — transcripts would be needed, and for the three July ones the worktree transcript directories no longer exist.
- Run size is unrecoverable for 2 runs (eric/referrer-tracking, eric/attribution-2): branch gone and no main commit matches their file sets. eric/attribution-2's best candidate reached only 0.55 file-set coverage.
- One run (2026-08-01, 'portable attribution package (design spike)') has no recoverable branch name — it survives only on refs/heads/backup/pre-rebase-2026-09-09 and no Delta Review ref holds its goals.md blob.
- The two attribution runs on that backup branch (2026-08-02 'Atribución' and 2026-09-06 'Attribution v2') both feed PR #77; the matcher credits the merge to the first and marks the second abandoned. Which run actually landed is not determinable from git.
- miseVersion is the version published on the plugin repo's main line at run start; the installed plugin may have lagged, and that lag is not observable. inventory/provenance.md was used only as a cross-check because it has no rows for 1.1.0-1.5.0; it disagrees with plugin.json for 11 runs, all inside that hole.
- Gate iterations exist only where .mise/_friction.md survived (21 of 34 runs) and are reported as the maximum rounds per gate, since a gate can report several stall counts; the commit-subject fallback ('mise: revise X after critic round N') covers only 3 runs. Fix-loop counts come from friction review findings or _progress.md 'fix' sections — no run records them in a structured field.
- Delta Review snapshots record a file the branch deleted as a one-line placeholder, so artifact sizes for one run (eric/item-availability-retro) are null rather than measured.
- Run type follows the recorded route, so 3 fix/* branches that ran the full route are typed feature; the branch prefix disagrees.
- Stage boundaries for the 4 sampled-snapshot runs are upper bounds (the sync commit follows the approval), and their run spans are lower bounds.
