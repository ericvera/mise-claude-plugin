# improvement-loop

Status: UNVERIFIED — citation check did not run (session limit). Quotes are as reported by the research agent.

| id                    | strength            | date                              | claim                                                                                                                                                                                                                                                                                                           | url                                                                                                          |
| --------------------- | ------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| R-improvement-loop-01 | measured            | 2024-04-18                        | Evaluation criteria cannot be fully fixed in advance: grading outputs is what teaches you the criteria ('criteria drift'), and some criteria depend on the specific outputs observed.                                                                                                                           | https://arxiv.org/abs/2404.12272                                                                             |
| R-improvement-loop-02 | measured            | retrieved 2026-09-19              | SWE-bench-style corpora carry measurable oracle and leakage defects: ~1/3 of Verified issues contain the solution verbatim in the issue text, ~31% of passing patches rest on weak test suites, and pass rates are overstated by 4-7 absolute points.                                                           | https://www.emergentmind.com/topics/swe-bench-verified                                                       |
| R-improvement-loop-03 | measured            | 2026-07-31                        | Instruction-following collapses non-linearly as verified constraints are stacked (~96% at one instruction to 60.4% for Claude Sonnet and 20.1% for GPT-5-mini at twenty); a rewrite that groups, merges and adds precedence rules recovers +11.0 pts on the weakest model but -1.2 pts (n.s.) on the strongest. | https://arxiv.org/html/2608.02639                                                                            |
| R-improvement-loop-04 | measured            | 2026-05-11                        | A 1,650-session factorial study of coding-agent config files found no detectable effect of file size, instruction position, file architecture, or contradictions in adjacent files on adherence; the only strong effect was decay within the session.                                                           | https://arxiv.org/abs/2605.10039                                                                             |
| R-improvement-loop-05 | measured            | v1 2025-07-25, v2 2026-02-14      | Reflective prompt evolution turns very few rollouts into large gains: GEPA beats GRPO by 6% on average using up to 35x fewer rollouts, and matched best GRPO validation scores with as few as 6 training rollouts on some tasks.                                                                                | https://arxiv.org/abs/2507.19457                                                                             |
| R-improvement-loop-06 | measured            | 2024-06-11                        | Textual-gradient optimization (TextGrad) produces modest but real gains on reasoning/coding tasks by backpropagating natural-language feedback through a compound system.                                                                                                                                       | https://arxiv.org/abs/2406.07496                                                                             |
| R-improvement-loop-07 | measured            | 2025-10-06 (ICLR 2026)            | Iteratively rewriting one monolithic context causes 'context collapse' (lossy compounding rewrites); appending compact delta bullets instead preserves prior knowledge and yields +10.6% on agent benchmarks.                                                                                                   | https://arxiv.org/abs/2510.04618                                                                             |
| R-improvement-loop-08 | measured            | 2023-02-20                        | Anytime-valid confidence sequences let an experiment be monitored continuously and stopped on data-dependent rules without the type-I inflation caused by peeking at fixed-horizon tests.                                                                                                                       | https://arxiv.org/abs/2302.10108                                                                             |
| R-improvement-loop-09 | measured            | 2025-07-10                        | Developer perception of AI speedup is unreliable in the opposite direction: in a randomized trial, 16 experienced devs on 246 real issues were 19% slower with AI while believing they were 20% faster.                                                                                                         | https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/                                     |
| R-improvement-loop-10 | vendor-guidance     | 2026-01-09                        | Anthropic's agent-eval guidance says a small task set drawn from real failures is a legitimate start, because early-stage changes have large effect sizes.                                                                                                                                                      | https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents                                       |
| R-improvement-loop-11 | vendor-guidance     | 2026-01-09                        | Trials must start from a clean environment; Anthropic observed Claude gaining unfair advantage by reading git history left by earlier trials.                                                                                                                                                                   | https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents                                       |
| R-improvement-loop-12 | vendor-guidance     | retrieved 2026-09-19              | Anthropic's own guidance treats CLAUDE.md as prunable code: every line must justify itself, bloat causes ignored rules, and changes should be validated by observing behavior.                                                                                                                                  | https://code.claude.com/docs/en/best-practices                                                               |
| R-improvement-loop-13 | vendor-guidance     | retrieved 2026-09-19              | Vendor guidance separates advisory instructions from deterministic enforcement: hooks guarantee an action happens, prompts do not, and repeatedly-ignored rules should be converted to hooks.                                                                                                                   | https://code.claude.com/docs/en/best-practices                                                               |
| R-improvement-loop-14 | vendor-guidance     | retrieved 2026-09-19              | Snapshot conventions are already lint-enforceable: jest/no-large-snapshots caps external snapshots (default 50 lines) and inline snapshots separately; no 'prefer-inline-snapshots' rule ships in eslint-plugin-jest.                                                                                           | https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-large-snapshots.md              |
| R-improvement-loop-15 | practitioner-report | 2025-05-28, modified 2026-09-18   | Error analysis (read traces, open-code notes, cluster into a failure taxonomy, count) is presented as the top-priority eval activity, and it is what decides which evals to write.                                                                                                                              | https://hamel.dev/blog/posts/evals-faq/                                                                      |
| R-improvement-loop-16 | practitioner-report | 2025-05-28, modified 2026-09-18   | Recommended trace volume for error analysis is ~100 traces, first 30 annotated by yourself, stopping at theoretical saturation rather than a fixed count.                                                                                                                                                       | https://hamel.dev/blog/posts/evals-faq/                                                                      |
| R-improvement-loop-17 | practitioner-report | 2026 (v1 dashboard, undated page) | Ramp built a private, contamination-free coding benchmark out of its own merged PRs: repo reconstructed at the PR base commit, merged solution patch and test patch held out as gold, prompt synthesized from the engineer's original messages to the agent.                                                    | https://labs.ramp.com/swebench                                                                               |
| R-improvement-loop-18 | practitioner-report | 2026 (v1 dashboard, undated page) | Ramp filters tasks by discriminative power: tasks every model solves are thrown away, tasks no model solves are suspected broken, and only the middle band is kept.                                                                                                                                             | https://labs.ramp.com/swebench                                                                               |
| R-improvement-loop-19 | practitioner-report | 2026 (v1 dashboard, undated page) | Ramp grades one-shot: a run succeeds only if the diff flips the task's failing tests to passing without breaking others, and context-window exhaustion counts as failure.                                                                                                                                       | https://labs.ramp.com/swebench                                                                               |
| R-improvement-loop-20 | practitioner-report | 2026 (v1 dashboard, undated page) | Task curation is automated up to a human approval gate; LLM judges cross-examine each task for over/under-specification and are run on different providers to avoid same-provider bias.                                                                                                                         | https://labs.ramp.com/swebench                                                                               |
| R-improvement-loop-21 | practitioner-report | 2026-08-15                        | A local-first tool exists that mines a repo's own history into sealed regression tasks for coding agents, withholding the future fix, hidden tests and later git objects, and grading behaviorally.                                                                                                             | https://dev.to/repotrials/repotrials-turn-your-git-history-into-private-coding-agent-benchmarks-4462         |
| R-improvement-loop-22 | practitioner-report | retrieved 2026-09-19              | Leave-one-out prompt ablation at small n needs a significance rule, not eyeballing: a one-item drop on twenty items is noise, and non-significant movement must be recorded as inconclusive rather than 'dead'.                                                                                                 | https://github.com/sjgant80-hub/konomi-ablate                                                                |
| R-improvement-loop-23 | practitioner-report | retrieved 2026-09-19              | Clauses that are individually removable are not jointly removable; a candidate deletion set is not certified until the combined removal is itself tested.                                                                                                                                                       | https://github.com/sjgant80-hub/konomi-ablate                                                                |
| R-improvement-loop-24 | practitioner-report | 2026-08-06                        | A practitioner ablated 19 agent system prompts by swapping each for a null prompt and re-running the same graded tasks; 13 of 19 dropped beyond the measured noise floor, and 4 showed no difference (all with too few test cases to resolve anything).                                                         | https://dev.to/willianpinho/do-your-agent-system-prompts-do-anything-i-measured-19-of-mine-2ek1              |
| R-improvement-loop-25 | practitioner-report | 2025-09-05                        | Encoding conventions as executable lint rules is argued to beat natural-language guidance for agents because prose is ambiguous and advisory; the recommended workflow is to have the LLM draft the ESLint rule after a recurring review finding.                                                               | https://factory.com/news/using-linters-to-direct-agents                                                      |
| R-improvement-loop-26 | practitioner-report | 2026-03-25                        | A production GEPA deployment found small training sets optimal and large ones harmful, and that length constraints act as necessary regularization; weak reflection models produced no optimization at all.                                                                                                     | https://decagon.ai/blog/optimizing-gepa-for-production                                                       |
| R-improvement-loop-27 | practitioner-report | 2026-04-15                        | At 100 examples the minimum detectable effect is ~10-12 points at 80% power; pairing roughly halves required n, and averaging three seeds cuts within-question variance.                                                                                                                                        | https://tianpan.co/blog/2026/04/15/statistical-power-llm-evals                                               |
| R-improvement-loop-28 | practitioner-report | 2026-09-14                        | Concrete small-n uncertainty: a 90% pass rate measured on 20 examples has a 95% interval of 69.9%-97.2%; paired testing uses only the examples where the two versions disagree and needs far fewer.                                                                                                             | https://befailproof.ai/learn/how-many-eval-examples-do-you-need/                                             |
| R-improvement-loop-29 | opinion             | 2026-07-15                        | A rule-hygiene practice: every prompt addition must carry a matching deletion, with rendered prompt size byte-budgeted and the ceiling ratcheted down when fat is removed.                                                                                                                                      | https://blog.shukebeta.com/2026/07/15/adding-a-rule-to-an-agents-system-prompt-delete-one-in-the-same-breath |
| R-improvement-loop-30 | opinion             | 2026-09-07                        | Proposed rule-sunset test: ask of each rule whether it fired in the last month, cut it if you cannot recall it mattering, and re-audit after every model upgrade.                                                                                                                                               | https://hackernoon.com/ai-coding-tip-034-stop-hoarding-rules-in-your-agentsmd                                |

## R-improvement-loop-01

> we identify a phenomenon we dub _criteria drift_: users need criteria to grade outputs, but grading outputs helps users define criteria.

Implication: Expect mise's acceptance checklist to keep changing as the owner reviews runs; version the checklist and re-grade old runs when it changes.

## R-improvement-loop-02

> About 31% of instances with passing patches rely on insufficiently robust test suites

Implication: mise's replay tasks inherit the same risk: the original commit message/issue may contain the answer, and the repo's tests may pass a wrong patch.

## R-improvement-loop-03

> Instruction-following degrades non-linearly: the follow rate falls from ∼96% to as low as 20%, driven by a structured and reproducible set of pairwise conflicts.

Implication: Rule count, not prose volume, is the load-bearing variable; and 'compile the rules into a checklist' may buy mise nothing on a frontier model.

## R-improvement-loop-04

> None of the four structural variables or three two-way interactions produces a detectable contrast after multiple-testing correction.

Implication: Directly challenges 'prose-heavy files cause mise's defects'. Shortening files may buy speed/cost, not compliance; long runs are the adherence risk.

## R-improvement-loop-05

> Across six tasks, GEPA outperforms GRPO by 6% on average and by up to 20%, while using up to 35x fewer rollouts.

Implication: Automated prompt optimization is feasible at mise's run budget in principle, but the reported tasks are short-horizon, not multi-stage coding workflows.

## R-improvement-loop-06

> TextGrad improves the zero-shot accuracy of GPT-4o in Google-Proof Question Answering from 51% to 55%

Implication: Effect sizes of this scale (4 pts) are undetectable at tens of runs; mise cannot validate such optimizers with its own data.

## R-improvement-loop-07

> Prior approaches often suffer from brevity bias, which drops domain insights for concise summaries, and from context collapse, where iterative rewriting erodes details over time.

Implication: Warns against v3's 'rewrite the skill files shorter each iteration' habit; prefer append/remove deltas with provenance over wholesale rewrites.

## R-improvement-loop-08

> Frequent evaluation of fixed-horizon tests ('peeking') leads to inflated type-I error and can result in erroneous conclusions.

Implication: If the owner watches ablation results run-by-run and stops when convinced (likely), use an anytime-valid rule; otherwise the stopping decision invalidates the p-value.

## R-improvement-loop-09

> developers expected AI to speed them up by 24%, and even after experiencing the slowdown, they still believed AI had sped them up by 20%

Implication: The owner's sense that v3 'feels leaner/faster' is not evidence; wall-clock per accepted change must be logged per run and compared paired against v2.

## R-improvement-loop-10

> 20-50 simple tasks drawn from real failures is a great start.

Implication: A v3 eval of 20-50 tasks mined from mise's own recurring defects is defensible; don't wait for a large benchmark.

## R-improvement-loop-11

> in some internal evals we observed Claude gaining an unfair advantage on some tasks by examining the git history from previous trials.

Implication: A replay eval that pins the commit before a change must also strip later git objects/branches, or the agent can read the accepted answer.

## R-improvement-loop-12

> Keep it concise. For each line, ask: "Would removing this cause Claude to make mistakes?" If not, cut it. Bloated CLAUDE.md files cause Claude to ignore your actual instructions!

Implication: Vendor-sanctioned framing for v3's deletion pass; 'test changes by observing whether Claude's behavior actually shifts' is the ablation mandate.

## R-improvement-loop-13

> Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens.

Implication: mise's recurring defects (external snapshots, slop comments) are 'always/never' rules: move them to hooks/lint and delete the prose rule.

## R-improvement-loop-14

> maxSize - Sets the maximum number of lines allowed for external snapshots (default: 50 lines)

Implication: mise's inline-snapshot rule can be enforced by config (maxSize 0 on external snapshots) or a ~30-line custom rule, replacing an instruction that keeps failing.

## R-improvement-loop-15

> Error analysis is the most important activity in evals. Error analysis helps you decide what evals to write in the first place.

Implication: Before cutting/keeping v3 rules, open-code mise's own run transcripts into a counted failure taxonomy; let counts, not intuition, pick which rules survive.

## R-improvement-loop-16

> Start with 100 diverse traces and annotate at least the first 30 yourself.

Implication: Tens of past mise runs is enough for taxonomy work (discovery), even though it is far too few for scoring; separate the two uses.

## R-improvement-loop-17

> To assemble a task, we reconstruct the repository at the PR's base commit, hold out the merged solution patch and associated test patch as gold artifacts, and synthesize a task prompt from the engineer's messages in the original Inspect conversation.

Implication: This is exactly the replay-eval recipe for mise: base commit + held-out patch/tests + the original request text as the prompt.

## R-improvement-loop-18

> When no model solves the task, it could mean a brittle test or broken environment over real difficulty. When every model solves it, the task is discarded for carrying no signal. Tasks worth keeping sit in between, where capability separates models and the failing traces show that the miss is clean.

Implication: Same filter applies to rule ablation at small n: keep only replay tasks where mise-with-rule and mise-without-rule can actually differ.

## R-improvement-loop-19

> A run is graded as a success if the agent's diff flips the task's failing tests to passing without breaking the others. Runs that reach a context window limit are counted as failures.

Implication: Gives mise a binary, cheap grader that needs no LLM judge; counting context-blowups as failures also prices the cost of prose-heavy stage files.

## R-improvement-loop-20

> Task curation is automated except for final human approval, which acts as the primary bottleneck and quality-control step. LLMs excel at surfacing issues, ambiguity, and fairness risks, but human engineering judgement is best for ensuring benchmark quality.

Implication: Build mise's replay corpus with an agent, but keep a one-click human accept/reject; budget the owner's time for that, not for authoring tasks.

## R-improvement-loop-21

> The agent receives the historical workspace without the future fix, hidden tests, or later Git objects.

Implication: Prior art for mise's replay harness; the mining rule (commit that changes source + tests together) is reusable, but no effectiveness data is published.

## R-improvement-loop-22

> Every verdict goes through an exact sign test. Movement that doesn't beat a coin is `INCONCLUSIVE`, never `DEAD`.

Implication: Ablating a mise rule over ~20 replay tasks should use a paired exact sign test; most single-rule verdicts will be inconclusive, and that must be allowed.

## R-improvement-loop-23

> So a candidate set is never certified until the joint run has actually been run

Implication: v3 cannot delete ten mise rules because each tested harmless alone; one extra run of the fully-pruned skill file is mandatory before shipping.

## R-improvement-loop-24

> Swap the agent's system prompt for `You are a helpful assistant.` Re-run the same golden tasks, same subject model, same grader.

Implication: Cheapest first experiment for v3: run mise with each stage file replaced by a one-line stub and see which stages actually move the result.

## R-improvement-loop-25

> No guarantees: advice does not cause builds to fail, allowing drift to accumulate quietly.

Implication: For each surviving v3 rule ask 'can this be a lint rule?'; only unlintable judgement calls stay as prose. No measured effect sizes are published.

## R-improvement-loop-26

> Scaling from 50 to 500 samples caused prompt length to balloon by 75% while performance _decreased_.

Implication: If v3 ever auto-optimizes a stage prompt, cap length explicitly (they got 4x compression for 0.8% loss) and train on 20-100 examples, not more.

## R-improvement-loop-27

> At 100 examples, your minimum detectable effect at 80% power is closer to 10–12 points, not 3.

Implication: At tens of runs mise can only detect large regressions; design ablations around rules expected to swing outcomes, and always pair on the same tasks.

## R-improvement-loop-28

> Running both versions on the same inputs and testing the pairs uses only the examples where the versions disagree, which usually needs far fewer

Implication: Report mise results as discordant-pair counts (rule helped k, hurt m) rather than pass rates; absolute rates at n=20 are meaningless.

## R-improvement-loop-29

> When you add a rule, find the existing rule it makes redundant and cut it.

Implication: Cheap governance for v3: a per-file byte ceiling checked in CI, lowered whenever a rule is cut, prevents the 2.x growth pattern from recurring.

## R-improvement-loop-30

> Re-run the audit after every major model upgrade, and assume some of your rules just became dead weight overnight.

Implication: Pairs with an incident ledger: each mise rule records the run that motivated it and the date it last caught something; no citation in N runs, delete.

## Gaps

- OpenAI's primary post 'Why SWE-bench Verified no longer measures frontier coding capabilities' is JS-gated (HTTP 403 to fetch, empty HTML to curl). The widely repeated numbers (138 audited problems, 64 runs, 59.4% with material test/description issues, 35.5% over-strict tests, 18.8% unspecified-functionality tests) could only be obtained from search summaries and secondary sites, never as a verbatim quote from the source — treated as unverified and excluded from findings.
- The SWE-bench defect statistics in finding 11 come from an aggregator page (emergentmind) that does not attribute them to primary arXiv ids; the underlying studies (UTBoost, PatchDiff) were not read.
- Three directly on-topic arXiv papers are PDF-only and could not be text-extracted by the available tools, so no quotes exist for them: 2601.22025 'When Generic Prompt Improvements Hurt: Evaluation-Driven Iteration for LLM Applications'; 2605.09650 'Workspace Optimization: How to Train Your Agent'; 2607.07702 'From Noisy Traces to Root Causes'. Each likely bears on ablation/trace-driven improvement.
- No source found that measures automated prompt optimizers (DSPy/GEPA/TextGrad/ACE) on a long-horizon, multi-stage coding-agent workflow with subagents. All reported results are single-module or short-horizon; transfer to a mise-shaped workflow is unevidenced in either direction.
- No measured evidence found on 'defect escape via human review notes' or 'time-to-accept' as metrics at n in the tens — only enterprise-scale metric frameworks (DX Core 4, 30-day rework/defect windows) and opinion pieces recommending post-accept edit rate and bug-escape over 90 days.
- No public evidence found for a measured 'human edit distance after the run' metric specific to agentic multi-file runs; edit-distance work found is about inline completion suggestions, not agent diffs.
- No organizational practice found publicly requiring that every lint rule or style rule cite the incident that motivated it (an 'evidence ledger'). Closest available material is ADR supersede/deprecate lifecycle advice and individual blog opinions on rule audits — none with outcome data.
- No evidence found on detecting or measuring 'AI-slop' verbosity in docs/comments (a metric, a lint rule, or proof that a prompt rule reduces it).
- Could not determine run-to-run variance magnitude for coding-agent workflows on repeated identical tasks; sources state that a variance study must precede threshold setting but publish no reference numbers for agentic coding runs.
- The 1,650-session null result on config-file structure (arXiv 2605.10039) is a single unreplicated study on TypeScript repos with Claude Code; whether it generalizes to multi-file skill/stage prose like mise's is undetermined.
- Ramp's page is undated and JS-rendered; quotes were extracted from its JS bundle, and the task count is inconsistent between the page text (79 published tasks) and secondary summaries (80).
