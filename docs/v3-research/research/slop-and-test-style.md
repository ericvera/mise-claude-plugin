# slop-and-test-style

Status: UNVERIFIED — citation check did not run (session limit). Quotes are as reported by the research agent.

| id                    | strength            | date                              | claim                                                                                                                                                                                                              | url                                                                                                                                      |
| --------------------- | ------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| R-slop-enforcement-01 | measured            | 2024-09-02 (v2 2025-12-22)        | A detection study finds comment-to-code ratio is the single feature that separates LLM-written from human-written code across all model/granularity configurations.                                                | https://arxiv.org/abs/2409.01382                                                                                                         |
| R-slop-enforcement-02 | measured            | 2023-06-14                        | A negation benchmark study finds LLMs are insensitive to negation and fail to reason under it, across model sizes.                                                                                                 | https://arxiv.org/abs/2306.08189                                                                                                         |
| R-slop-enforcement-03 | vendor-guidance     | 2026 (current docs)               | Anthropic states that files Claude Opus 5 writes to disk are longer than on prior models and prescribes an explicit length-calibration instruction rather than a prohibition.                                      | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5                                         |
| R-slop-enforcement-04 | vendor-guidance     | 2026 (current docs)               | Anthropic's Opus 5 guidance says positive examples of the wanted style beat instructions about what not to do.                                                                                                     | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5                                         |
| R-slop-enforcement-05 | vendor-guidance     | 2026 (current docs)               | Anthropic's general prompting guide instructs telling Claude what to do rather than what not to do, with a worked before/after.                                                                                    | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices                                 |
| R-slop-enforcement-06 | vendor-guidance     | 2026 (current docs)               | Anthropic ranks examples as one of the most reliable steering levers and recommends 3-5, wrapped in <example> tags.                                                                                                | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices                                 |
| R-slop-enforcement-07 | vendor-guidance     | 2026 (current docs)               | Claude Code docs state that a bloated CLAUDE.md causes Claude to ignore instructions, and that a repeatedly-violated rule is a symptom of file length.                                                             | https://code.claude.com/docs/en/best-practices                                                                                           |
| R-slop-enforcement-08 | vendor-guidance     | 2026 (current docs)               | Claude Code docs say emphasis only works if used on one line, not many.                                                                                                                                            | https://code.claude.com/docs/en/best-practices                                                                                           |
| R-slop-enforcement-09 | vendor-guidance     | 2026 (current docs)               | Claude Code docs explicitly classify CLAUDE.md instructions as advisory and hooks as deterministic, and recommend converting rules into hooks.                                                                     | https://code.claude.com/docs/en/best-practices                                                                                           |
| R-slop-enforcement-10 | vendor-guidance     | 2026 (current docs)               | Claude Code docs recommend naming a specific existing file as the pattern to follow, i.e. style transfer by exemplar path.                                                                                         | https://code.claude.com/docs/en/best-practices                                                                                           |
| R-slop-enforcement-11 | vendor-guidance     | 2026 (current docs)               | Claude Code docs warn that a reviewer subagent asked to find gaps will report some regardless, driving over-engineering.                                                                                           | https://code.claude.com/docs/en/best-practices                                                                                           |
| R-slop-enforcement-12 | vendor-guidance     | 2026 (current docs)               | Anthropic says explicit verification and re-check instructions cause over-verification on Opus 5 and that removing them costs nothing in quality.                                                                  | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5                                         |
| R-slop-enforcement-13 | vendor-guidance     | 2026 (current docs)               | Claude Code provides a documented PostToolUse recipe that runs a formatter on exactly the file just edited.                                                                                                        | https://code.claude.com/docs/en/hooks-guide                                                                                              |
| R-slop-enforcement-14 | vendor-guidance     | 2026 (current docs)               | A PostToolUse command hook cannot block via exit code 2; blocking requires JSON output with decision: block.                                                                                                       | https://code.claude.com/docs/en/hooks                                                                                                    |
| R-slop-enforcement-15 | vendor-guidance     | 2026 (current docs)               | A Stop hook can block the turn until a check passes, but Claude Code caps this at 8 consecutive blocks.                                                                                                            | https://code.claude.com/docs/en/best-practices                                                                                           |
| R-slop-enforcement-16 | vendor-guidance     | 2026 (current docs)               | Files rewritten by Bash escape PostToolUse Edit/Write matchers; the FileChanged event covers them.                                                                                                                 | https://code.claude.com/docs/en/hooks-guide                                                                                              |
| R-slop-enforcement-17 | vendor-guidance     | 2026 (current docs)               | Claude Code supports agent-type hooks that can read files and run commands to make a judgment call before allowing a stop.                                                                                         | https://code.claude.com/docs/en/hooks-guide                                                                                              |
| R-slop-enforcement-18 | vendor-guidance     | 2026 (main branch docs)           | jest/no-large-snapshots takes separate size caps for inline and external snapshots, and external snapshots are only checked if ESLint is told to read .snap files.                                                 | https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-large-snapshots.md                                          |
| R-slop-enforcement-19 | vendor-guidance     | 2026 (main branch docs)           | jest/no-restricted-matchers bans matchers with a custom message, but banning one matcher outright requires listing all six modifier permutations.                                                                  | https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-restricted-matchers.md                                      |
| R-slop-enforcement-20 | vendor-guidance     | 2021-10-10 (v25.0.0)              | There is no prefer-inline-snapshots rule any more; it was deprecated in 2020 and removed in eslint-plugin-jest v25.                                                                                                | https://github.com/jest-community/eslint-plugin-jest/blob/main/CHANGELOG.md                                                              |
| R-slop-enforcement-21 | vendor-guidance     | 2026 (main branch)                | The Vitest ESLint plugin ships under the package name @vitest/eslint-plugin and carries the same snapshot rules (no-large-snapshots, no-restricted-matchers, prefer-snapshot-hint, no-interpolation-in-snapshots). | https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/README.md                                                                   |
| R-slop-enforcement-22 | vendor-guidance     | 2026 (current docs)               | Jest's own docs tell teams to enforce snapshot brevity with tooling, and inline snapshots are auto-written back into source (delegated to prettier when present).                                                  | https://jestjs.io/docs/snapshot-testing                                                                                                  |
| R-slop-enforcement-23 | vendor-guidance     | 2026 (current docs)               | Vitest writes inline snapshots by modifying the test file directly.                                                                                                                                                | https://vitest.dev/guide/snapshot                                                                                                        |
| R-slop-enforcement-24 | vendor-guidance     | 2026 (main branch docs)           | eslint-plugin-jsdoc has a rule specifically for docs that only restate the name they are attached to.                                                                                                              | https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/rules/informative-docs.md                                                    |
| R-slop-enforcement-25 | vendor-guidance     | 2026 (current docs)               | ESLint core no-warning-comments can ban arbitrary phrases anywhere in a comment, matched case-insensitively as whole words.                                                                                        | https://eslint.org/docs/latest/rules/no-warning-comments                                                                                 |
| R-slop-enforcement-26 | vendor-guidance     | 2026 (current docs)               | ESLint core no-restricted-syntax accepts AST selectors with custom messages, which can ban a call expression directly without a test plugin.                                                                       | https://eslint.org/docs/latest/rules/no-restricted-syntax                                                                                |
| R-slop-enforcement-27 | vendor-guidance     | 2026 (current docs)               | Vale lints only the comments in source files, using tree-sitter grammars, with per-language scopes including TypeScript and JavaScript.                                                                            | https://docs.vale.sh/formats/code                                                                                                        |
| R-slop-enforcement-28 | vendor-guidance     | 2026 (v2.3.1, published ~2026-06) | eslint-plugin-comment-length limits and auto-wraps comment line length but does not limit how many comments exist.                                                                                                 | https://github.com/lasselupe33/eslint-plugin-comment-length                                                                              |
| R-slop-enforcement-29 | vendor-guidance     | 2026-08-07                        | sonarjs/no-commented-code (S125) exists for commented-out code but is off by default and silently reports nothing under typescript-eslint's projectService, confirmed by Sonar staff.                              | https://community.sonarsource.com/t/eslint-plugin-sonarjs-s125-no-commented-code-never-reports-under-parseroptions-projectservice/186866 |
| R-slop-enforcement-30 | vendor-guidance     | 2026 (current docs)               | Claude Code exposes deterministic caps on subagent depth, concurrency, and spend.                                                                                                                                  | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5                                         |
| R-slop-enforcement-31 | practitioner-report | 2026-09-05                        | A practitioner measured that adding a comment-reduction rule to CLAUDE.md raised the comment ratio, while moving the same check to a grep over the diff inside a skill lowered median comment lines.               | https://note.com/hacklog_stealth/n/n7e7315d940d9?hl=en                                                                                   |
| R-slop-enforcement-32 | practitioner-report | 2026-08-13                        | A practitioner measured that a comment rule halved overall comment ratio but left long comment blocks untouched.                                                                                                   | https://note.com/ai_eng_tech/n/n7c448ee6c1f4?hl=en                                                                                       |
| R-slop-enforcement-33 | practitioner-report | 2026-09-18                        | A Claude Code practitioner reports prevention-only comment rules cannot eliminate verbosity in long sessions and pairs them with a deterministic post-hoc cleanup skill.                                           | https://gist.github.com/bavanws/123e0343f8a79cec825d9141124a0a83                                                                         |
| R-slop-enforcement-34 | practitioner-report | 2026 (dev.to post)                | A measured debloat of an AI-grown codebase cut 31.7% of lines, and the author had to explicitly stop the agent from reward-hacking the metric by deleting comments.                                                | https://dev.to/maximsaplin/debloating-the-ai-grown-codebase-2om                                                                          |
| R-slop-enforcement-35 | practitioner-report | 2026 (main branch README)         | A published Vale style package targets AI-written code comments specifically, including a rule for comments that restate the code.                                                                                 | https://github.com/Syntaf/vale-llm-slop                                                                                                  |
| R-slop-enforcement-36 | practitioner-report | 2026 (main branch README)         | Maintainers of AI-tell rule packs document per-rule false-positive behaviour and expect per-file or per-project disabling rather than clean detection.                                                             | https://github.com/tbhb/vale-ai-tells                                                                                                    |
| R-slop-enforcement-37 | practitioner-report | 2026 (current revision)           | Wikipedia's AI-writing pattern catalogue explicitly disclaims itself as a detector and warns the patterns appear in human writing.                                                                                 | https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing                                                                              |
| R-slop-enforcement-38 | practitioner-report | 2026-08                           | A widely-linked practitioner PostToolUse lint hook silently discards ESLint output, so failures never reach the model.                                                                                             | https://www.claudedirectory.org/hooks/lint-on-edit                                                                                       |
| R-slop-enforcement-39 | opinion             | repo README (undated)             | write-good describes itself as a naive linter, i.e. it makes no precision claim.                                                                                                                                   | https://github.com/btford/write-good                                                                                                     |

## R-slop-enforcement-01

> SHAP analysis identifies the Comment-to-Code Ratio as the sole universal discriminator.

Implication: Over-commenting is a stable statistical property of model output, not a prompt bug; mise should expect to need mechanical enforcement permanently.

## R-slop-enforcement-02

> insensitivity to the presence of negation ... an inability to capture the lexical semantics of negation ... a failure to reason under negation

Implication: Gives the mechanism behind 'prose rules are not holding': mise's rules are largely prohibitions, the weakest instruction form available.

## R-slop-enforcement-03

> Separate from conversational verbosity, files that Claude Opus 5 writes to disk (reports, Markdown documents, summaries) are often longer than on prior models. If your product includes Claude-authored documents, add explicit length calibration: "Match the length of written documents to what the task needs: cover the substance, but do not pad with filler sections, redundant summaries, or boilerplate."

Implication: AI-slop docs are a known model default, not a rule-following failure. mise should carry one length-calibration line in the documenter/plan stage instead of a prose ban list.

## R-slop-enforcement-04

> To tune narration up, or change its style, the same lever applies in the other direction: explicitly describe what updates should look like and provide examples. Positive examples of the communication style you want tend to be more effective than instructions about what not to do.

Implication: Replace mise's negative prose rules ('no AI-slop comments') with 2-3 checked-in exemplar files the skill points at by path.

## R-slop-enforcement-05

> 1. **Tell Claude what to do instead of what not to do** * Instead of: "Do not use markdown in your response" * Try: "Your response should be composed of smoothly flowing prose paragraphs."

Implication: Every 'do not' in mise's skill files is a candidate for rewriting as a target state; this is the cheapest v3 edit with vendor backing.

## R-slop-enforcement-06

> Examples are one of the most reliable ways to steer Claude's output format, tone, and structure. A few well-crafted examples (known as few-shot or multishot prompting) improve accuracy and consistency. ... Include 3–5 examples for best results.

Implication: A 3-5 example block of good tests (inline snapshots) and good comments is a better use of skill-file bytes than the prose rules currently occupying them.

## R-slop-enforcement-07

> Keep it concise. For each line, ask: _"Would removing this cause Claude to make mistakes?"_ If not, cut it. Bloated CLAUDE.md files cause Claude to ignore your actual instructions! ... If Claude keeps doing something you don't want despite having a rule against it, the file is probably too long and the rule is getting lost.

Implication: mise's recurring defects (no inline snapshots, slop docs) are the documented signature of instruction overload; v3's halving of instruction files is the treatment, and adding more rules is the anti-pattern.

## R-slop-enforcement-08

> If Claude keeps skipping one instruction, add emphasis such as "IMPORTANT" to that line alone. If you emphasize many lines, none of them stands out.

Implication: mise can afford at most one IMPORTANT per skill file; audit and strip the rest, or the inline-snapshot rule keeps losing.

## R-slop-enforcement-09

> Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens. ... **Fix**: Ruthlessly prune. If Claude already does something correctly without the instruction, delete it or convert it to a hook.

Implication: This is the core v3 move: every mise rule that a linter or grep can decide should leave the prose and become a hook + lint rule.

## R-slop-enforcement-10

> **Reference existing patterns.** Point Claude to patterns in your codebase. ... _"look at how existing widgets are implemented on the home page to understand the patterns. HotDogWidget.php is a good example. follow the pattern to implement a new calendar widget..."_

Implication: The plan stage should emit a named exemplar test file and exemplar doc for the executor, rather than restating house style in prose.

## R-slop-enforcement-11

> A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is what it was asked to do. Chasing every finding leads to over-engineering: extra abstraction layers, defensive code, and tests for cases that can't happen. Tell the reviewer to flag only gaps that affect correctness or the stated requirements, and treat the rest as optional.

Implication: mise's critic/reviewer/acceptance loop is a documented source of run length and invented work; v3 should scope reviewer findings to correctness plus stated requirements and make the rest non-blocking.

## R-slop-enforcement-12

> If your prompt contains explicit verification instructions ("include a final verification step for any non-trivial task," "use a subagent to verify"), remove them: instructions like these cause over-verification on Claude Opus 5, and removing them reduces wasted tokens with no loss in quality. The same applies to legacy harness scaffolding that adds separate verification steps.

Implication: Directly targets mise's 'verifying reviewer' and end-of-plan gate added in 2.0.0/2.1.0: they may be the reason runs are long, with no quality return.

## R-slop-enforcement-13

> This hook uses the `PostToolUse` event with an `Edit|Write` matcher, so it runs only after file-editing tools. The command extracts the edited file path with [`jq`](https://jqlang.org/) and passes it to Prettier. ... "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"

Implication: Swap `prettier --write` for `eslint --fix --max-warnings 0` on the changed file to make the snapshot/JSDoc rules self-enforcing during execute.

## R-slop-enforcement-14

> | `PostToolUse` | No | Exit code 2 isn't honored for this event. Use `decision: "block"` in JSON output instead |

Implication: A naive `eslint || exit 2` PostToolUse hook silently does nothing; mise's hook must emit JSON, or gate on Stop instead.

## R-slop-enforcement-15

> **As a deterministic gate**: a [Stop hook](/docs/en/hooks#stop) runs your check as a script and blocks the turn from ending until it passes. Claude Code overrides the hook and ends the turn after 8 consecutive blocks.

Implication: A Stop-hook lint gate is the strongest available enforcement for mise stages, but it is bounded: design the message so one or two iterations fix it, not eight.

## R-slop-enforcement-16

> To reformat a specific file however it changes, including when a `Bash` command rewrites it, use a [FileChanged](/docs/en/hooks#filechanged) hook instead.

Implication: mise agents that write via heredocs or scripts would bypass an Edit|Write lint hook; pair it with FileChanged or gate on Stop.

## R-slop-enforcement-17

> When verification requires inspecting files or running commands, use `type: "agent"` hooks. Unlike prompt hooks, which make a single LLM call, agent hooks spawn a subagent that can read files, search code, and use other tools to verify conditions before returning a decision.

Implication: For comment quality, which no linter decides well, an agent Stop hook is a cheaper structural home than a full documenter/critic stage — but it is flagged experimental.

## R-slop-enforcement-18

> "jest/no-large-snapshots": ["warn", { "maxSize": 12, "inlineMaxSize": 6 }] ... If only `maxSize` is provided on options, the value of `maxSize` will be used for both snapshot types (Inline and External). ... In order to check external snapshots, you must also have `eslint` check files with the `.snap` extension by either passing `--ext snap` on the command line or by explicitly specifying `.snap` in `overrides`.

Implication: Exact config mise can ship: a small inlineMaxSize keeps inline snapshots reviewable; forgetting the .snap wiring silently disables half the rule.

## R-slop-enforcement-19

> Bans are expressed in the form of a map, with the value being either a string message to be shown, or `null` if the default rule message should be used. Bans are checked against the start of the `expect` chain - this means that to ban a specific matcher entirely you must specify all six permutations, but allows you to ban modifiers as well.

Implication: To force inline snapshots, mise must list toMatchSnapshot, not.toMatchSnapshot, resolves./rejects./resolves.not./rejects.not. variants with the message 'Use toMatchInlineSnapshot'.

## R-slop-enforcement-20

> Removes rules `no-expect-resolves`, `no-truthy-falsy`, `no-try-expect`, and `prefer-inline-snapshots`

Implication: Any mise doc or prompt naming prefer-inline-snapshots would be wrong; no-restricted-matchers is the supported mechanism.

## R-slop-enforcement-21

> Next, install `@vitest/eslint-plugin` ... | [no-large-snapshots](docs/rules/no-large-snapshots.md) | disallow large snapshots | ... | [no-restricted-matchers](docs/rules/no-restricted-matchers.md) | disallow the use of certain matchers |

Implication: mise's config can be stack-agnostic: same rule names, only the plugin prefix (jest/ vs vitest/) changes.

## R-slop-enforcement-22

> Ensure that your snapshots are readable by keeping them focused, short, and by using tools that enforce these stylistic conventions. ... By default, Jest handles the writing of snapshots into your source code. However, if you're using prettier in your project, Jest will detect this and delegate the work to prettier instead (including honoring your configuration).

Implication: Upstream endorses lint-based enforcement over convention; also means a mise agent can write `toMatchInlineSnapshot()` empty and let the runner fill it, so the house style costs the agent nothing.

## R-slop-enforcement-23

> Instead of creating a snapshot file, Vitest will modify the test file directly to update the snapshot as a string

Implication: mise's execute stage must expect the test file to change under it after a run; a PostToolUse hook that re-lints on edit will fire again on the runner's write.

## R-slop-enforcement-24

> Reports on JSDoc texts that serve only to restate their attached name. ... Those "uninformative" docs comments take up space without being helpful. This rule requires all docs comments contain at least one word not already in the code.

Implication: jsdoc/informative-docs is the closest thing to a machine check for AI-slop JSDoc and should be in mise's recommended config; it has aliases/uselessWords options for tuning.

## R-slop-enforcement-25

> terms: optional array of terms to match. Defaults to ["todo", "fixme", "xxx"]. Terms are matched case-insensitively and as whole words. ... location: optional string that configures where in your comments to check for matches. Defaults to "start"

Implication: With location:"anywhere" and a short terms list (e.g. comprehensive, robust, seamlessly, leverage), mise gets a deterministic AI-tell check in code comments with no new dependency — but whole-word-only, no regex.

## R-slop-enforcement-26

> You can also specify AST selectors to restrict, allowing much more precise control over syntax patterns. ... Alternatively, the rule also accepts objects, where the selector and an optional custom message are specified

Implication: A one-line selector on MemberExpression[property.name='toMatchSnapshot'] is a zero-dependency alternative to the six-permutation no-restricted-matchers config.

## R-slop-enforcement-27

> Vale lints the comments in source code, found with a tree-sitter grammar for each language below. ... A one-line comment is scoped `text.comment.line` and a comment spanning lines `text.comment.block`, each followed by the file's extension.

Implication: Vale is the only off-the-shelf prose linter that can apply an AI-tell wordlist to .ts comments and to Markdown docs with one config, and it can be scoped per comment type.

## R-slop-enforcement-28

> rules that limit the line length of your comments, and an automatic fix is included such that you can save time manually formatting your comments ... maxLength ... default of 80 characters

Implication: Not a solution for mise's problem: it reflows slop rather than deleting it. The measured practitioner approach (count added comment lines in the diff) has no ESLint equivalent.

## R-slop-enforcement-29

> We confirmed that this configuration causes S125 to miss commented-out code, so this is a real false negative.

Implication: If mise recommends sonarjs/no-commented-code, it must also pin the parser config, or the rule will be a silent no-op in a typical TS project.

## R-slop-enforcement-30

> If your harness is Claude Code or the Claude Agent SDK, the deterministic caps are the `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` and `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` environment variables and the SDK's `max_budget_usd` option.

Implication: If v3 keeps subagents, cap them in settings rather than asking the skill prose to be restrained — same advisory-vs-deterministic split as the lint rules.

## R-slop-enforcement-31

> No rule: 18.5% / After introducing the rule: 19.1%–21.0% ... Median number of comment lines: 27 lines → 21 lines

Implication: The only measured comparison found says a prose rule is worse than nothing and a mechanical post-diff check works; mise should run `git diff | grep` for added comment lines rather than restate the rule.

## R-slop-enforcement-32

> While comment ratio dropped from 21.1% to 8.8%, consecutive comment blocks of 4+ lines barely changed (52 to 50). The maximum block increased from 17 to 18 lines.

Implication: Prose rules trim one-liners but not the AI-slop blocks mise actually objects to; any v3 check should target blocks of N+ consecutive comment lines, which is greppable.

## R-slop-enforcement-33

> Prevention can reduce verbosity, but doesn't eliminate it — the model still narrates the occasional tricky block, especially in long sessions where these instructions compete with a lot of other context. ... Default to no comment. Code shows _how_; comment only to carry _why_ — a non-obvious constraint, deliberate deviation, gotcha, or workaround.

Implication: Supports a two-part v3 design: one positive default-no-comment line up front, plus a deletion pass with an ordered ruleset near the end of execute.

## R-slop-enforcement-34

> 31.7% reduction on the app total, with all features preserved, analyzer clean, and runtime checks ... every comment line has to earn its place

Implication: A deletion pass works but needs an anti-gaming constraint; a mise 'deslop' step measured only by comment count will be gamed.

## R-slop-enforcement-35

> **Slop** catches writing that sounds like AI wrote it. Comments that just repeat the code, buzzwords like "robust" and "delve", fake enthusiasm, empty praise. If Slop flags something, it's probably genuinely bad writing.

Implication: Ready-made: `[*.{ts,tsx,js}] BasedOnStyles = Slop` plus `[*.md] BasedOnStyles = Slop, STE` covers both of mise's slop surfaces; no precision numbers are published, so pilot it at warning level.

## R-slop-enforcement-36

> The loudest rule in the package on ordinary technical writing; a project that keeps the container sense disables it per file. ... Some prose rules matter less for commit messages. If they generate noise, suppress them in your `.vale.ini`

Implication: Budget for tuning: an AI-tell pack cannot be turned on at error level as-is. Start with a hand-picked subset of rules mise's own history shows.

## R-slop-enforcement-37

> Not all text featuring these indicators is AI-generated, as the large language models that power AI chatbots are trained on human writing, including Wikipedia. ... This section is to be taken as literally as possible: a word being overused by AI does not imply that its synonyms are also overused.

Implication: The largest curated AI-tell corpus is exact-phrase only. mise can mine terms from it for no-warning-comments/Vale, but must not generalise to synonyms or treat hits as proof.

## R-slop-enforcement-38

> if [[ -f "$FILE_PATH" && "$FILE_PATH" =~ \.(js|jsx|ts|tsx)$ ]]; then npx eslint --fix ... 2>/dev/null

Implication: Typical published hook recipes are fix-only and non-reporting; mise's hook must surface unfixable violations (JSON decision or Stop gate) or it enforces nothing beyond autofix.

## R-slop-enforcement-39

> Naive linter for English prose for developers who can't write good and wanna learn to do other stuff good too.

Implication: write-good is the weakest of the three prose linters for this job; prefer Vale with a scoped style over write-good or proselint defaults.

## Gaps

- No controlled experiment was found comparing positive exemplars against negative rules for code comments or test style specifically. The support is vendor guidance plus two uncontrolled practitioner measurements; the widely-cited 'Pink Elephant Problem' post (eval.16x.engineer, 2025-08-05) states outright that its evidence is 'anecdotal evidence and not controlled experiments'.
- No published precision/recall or false-positive rate for any AI-tell wordlist (deslop, vale-ai-tells, vale-llm-slop, slopster). Maintainers document false positives qualitatively per rule and expect per-file disabling, but publish no numbers.
- Proselint's often-quoted false-discovery rate (1 false positive per 10 true positives, vs 2:1 for Microsoft Word) could not be verified against a primary source: the PACER 2016 PDF text extraction failed and the claim is absent from the proselint README and repo page. Treat it as unverified.
- No ESLint rule was found that limits the size of toEqual / toStrictEqual object literals. no-restricted-syntax selectors can match the matcher call but cannot count literal size; a custom rule or a diff-level check would be needed. jest/no-large-snapshots covers snapshots only.
- No lint rule was found that caps comment count or comment density per file or per diff. eslint-plugin-comment-length only wraps lines. The only measured mechanism was a hand-written grep over `git diff` inside a skill.
- No data was found on whether PostToolUse or Stop lint hooks change run length, defect rate, or recurrence of style violations. Published hook material is recipes only, with no outcome measurement.
- Two of the measured practitioner sources (note.com/hacklog_stealth, note.com/ai_eng_tech) are Japanese-language posts read through an automated fetch-and-summarise step, so their quotes are machine translations rather than verbatim source text, and neither reports a sample size for its comment-ratio figures.
- Could not determine whether `continueOnBlock` applies to PostToolUse _command_ hooks or only to prompt/agent hooks; the documentation quote covers prompt hooks.
- No evidence was found comparing a separate documentation pass against documenting inline, on any outcome (doc quality, run length, defect rate). Only one practitioner cleanup-skill design was found.
- No repo-local evidence: this was web-only research. mise's own transcripts, git history and skill files were not examined, so the claim that mise's specific rules are not holding is taken from the task statement, not verified here.
- No source was found reporting how often an inline-snapshot house style survives when the agent, rather than a human, runs the test updater; the auto-write behaviour is documented but its interaction with agent workflows is not.
