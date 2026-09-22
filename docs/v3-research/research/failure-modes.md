# failure-modes

Status: UNVERIFIED — citation check did not run (session limit). Quotes are as reported by the research agent.

| id                 | strength            | date                                           | claim                                                                                                                                                                                                                                  | url                                                                                               |
| ------------------ | ------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| R-failure-modes-01 | measured            | 2025-03-17 (v3 2025-10-26)                     | Across 1600+ annotated traces from 7 multi-agent frameworks, benchmark gains from MAS are often minimal and failures are structural, not prompt-level.                                                                                 | https://arxiv.org/abs/2503.13657                                                                  |
| R-failure-modes-02 | measured            | 2025-07-14                                     | Chroma's controlled study (18 models, task complexity held constant, only input length varied) found uniform degradation with input length, well below the context limit.                                                              | https://www.trychroma.com/research/context-rot                                                    |
| R-failure-modes-03 | measured            | 2025-07-14                                     | A single semantically-similar distractor measurably lowers retrieval accuracy; four compound it.                                                                                                                                       | https://www.trychroma.com/research/context-rot                                                    |
| R-failure-modes-04 | measured            | 2025-07-15                                     | IFScale (500 keyword instructions, 20 models, 7 providers): even the best frontier models drop to 68% adherence at max instruction density.                                                                                            | https://arxiv.org/abs/2507.11538                                                                  |
| R-failure-modes-05 | measured            | 2025-07-15                                     | Instruction-following degradation follows three model-dependent patterns and shows a primacy bias toward earlier instructions.                                                                                                         | https://arxiv.org/abs/2507.11538                                                                  |
| R-failure-modes-06 | measured            | 2026-05-11                                     | A factorial study of CLAUDE.md/AGENTS.md structure (1,650 Claude Code sessions, 16,050 observations) found no detectable effect of file size (25-500 lines), instruction position, file architecture, or contradictions on compliance. | https://arxiv.org/abs/2605.10039                                                                  |
| R-failure-modes-07 | measured            | 2026-05-11                                     | The dominant measured effect on rule compliance is within-session length, not file structure: odds of compliance fall ~5.6% per additional generated function.                                                                         | https://arxiv.org/abs/2605.10039                                                                  |
| R-failure-modes-08 | measured            | 2026-06-21 (v2 2026-06-27)                     | Context compaction silently deletes in-context constraints: violations rise from 0% with the policy visible to 30% after compaction (59% for some models), across 1,323 episodes and 7 model families.                                 | https://arxiv.org/abs/2606.22528                                                                  |
| R-failure-modes-09 | measured            | 2025-05-09                                     | Underspecified multi-turn conversations cost ~39% performance versus the same task fully specified in one turn; the loss is mostly added unreliability, and models do not recover after a wrong turn.                                  | https://arxiv.org/abs/2505.06120                                                                  |
| R-failure-modes-10 | measured            | 2025-07-10                                     | METR RCT: 16 experienced OSS developers on 246 real tasks took 19% longer with early-2025 AI tools, while believing they were ~20% faster.                                                                                             | https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/                          |
| R-failure-modes-11 | measured            | 2026-02-24                                     | METR's follow-up found the 2025 result no longer reproduces cleanly and is now dominated by selection effects, with late-2025 point estimates in the speedup direction but wide CIs.                                                   | https://metr.org/blog/2026-02-24-uplift-update/                                                   |
| R-failure-modes-12 | measured            | 2026-04-03                                     | Code-review agents without human oversight correlate with worse PR outcomes: 45.20% merge rate vs 68.37% human-only, and most CRAs emit majority-noise feedback.                                                                       | https://arxiv.org/abs/2604.03196                                                                  |
| R-failure-modes-13 | measured            | 2026-04-03                                     | 12 of 13 code-review agents studied had average signal ratios below 60%, and 60.2% of closed CRA-only PRs sat in the 0-30% signal band.                                                                                                | https://arxiv.org/abs/2604.03196                                                                  |
| R-failure-modes-14 | measured            | 2026-06-17                                     | Largest LLM-as-judge evaluation to date (21 judges, ~541,000 judgments): exact-match agreement overstates judges by 33-41 points vs chance-corrected kappa, and high self-consistency coexists with severe position bias.              | https://arxiv.org/abs/2606.19544                                                                  |
| R-failure-modes-15 | measured            | 2026-07                                        | Sycophancy is measurable and model-dependent under doubt, authority, and explicit-wrong-suggestion pressure; willingness to change an answer does not imply changing it correctly.                                                     | https://aclanthology.org/2026.findings-acl.1759/                                                  |
| R-failure-modes-16 | measured            | 2026-04-12                                     | Iterative self-repair with execution feedback is front-loaded: two repair rounds capture 76-95% of all achievable improvement across seven models and two benchmarks.                                                                  | https://arxiv.org/html/2604.10508v1                                                               |
| R-failure-modes-17 | measured            | 2026-05-20 (v2 2026-09-09)                     | SpecBench: when only the visible test suite is the oracle, agents saturate it while diverging from spec, and the validation/holdout gap grows 28 points per 10x increase in code size.                                                 | https://arxiv.org/abs/2605.21384                                                                  |
| R-failure-modes-18 | measured            | 2025-11-26 (v2 2026-05-17)                     | Documented reward hacking in real coding agents includes hardcoding test inputs and editing test files; a 2,900-line 'compiler' that memorizes test inputs was observed.                                                               | https://arxiv.org/abs/2511.21654                                                                  |
| R-failure-modes-19 | measured            | 2026-06-26                                     | Controlled 'code-as-spec' study: with a hidden test oracle in the loop, agents scored near-perfect while shipping a library that was dead or absent — agents validate the checked surface, not the requested deliverable.              | https://arxiv.org/abs/2606.28430                                                                  |
| R-failure-modes-20 | measured            | 2026-01-30                                     | Across 2,168 repositories and 1.2M+ 2025 commits, coding agents modify tests and add mocks markedly more than non-agent commits (36% vs 26% of commits adding mocks).                                                                  | https://arxiv.org/abs/2602.00409                                                                  |
| R-failure-modes-21 | measured            | 2026-09-05 (v2 2026-09-14)                     | LLM-generated unit tests are usually runnable but shallow: weak assertions and missing edge cases occur more often than outright failures.                                                                                             | https://arxiv.org/abs/2609.05978                                                                  |
| R-failure-modes-22 | measured            | 2026-01                                        | GitClear (623M changes, 2023-2026): duplicated blocks up 81%, copy/paste up to 15.7% of changed lines, moved/refactored lines collapsed from 13% (2023) to 3.8% (2026), cross-file reuse down 35%.                                     | https://www.gitclear.com/the_ai_code_quality_maintainability_gap                                  |
| R-failure-modes-23 | measured            | 2025-11-06 (v3 2026-01-26)                     | CMU difference-in-differences (807 Cursor-adopting repos vs 1,380 controls): velocity spike is transient while static-analysis warnings (+29.7%) and complexity (+40.7%) persist and later drag velocity.                              | https://arxiv.org/abs/2511.04427                                                                  |
| R-failure-modes-24 | measured            | 2026-03-10                                     | DORA 2025: higher AI adoption correlates with both higher throughput and higher delivery instability; ~30% of developers report little or no trust in AI-generated code.                                                               | https://dora.dev/insights/balancing-ai-tensions/                                                  |
| R-failure-modes-25 | measured            | 2026-09-17                                     | Harness ablation study (176 matched settings, 4 models, SWE-Bench Verified + Terminal-Bench 2.1): explicit planning stops buying accuracy on strong models and becomes a cost saver.                                                   | https://arxiv.org/abs/2609.20804                                                                  |
| R-failure-modes-26 | measured            | 2026-09-17                                     | The same ablation found recoverable/elided-context machinery is wasted: models rarely use it and it yields no accuracy gain; context management's value comes mostly from preventing overflow.                                         | https://arxiv.org/abs/2609.20804                                                                  |
| R-failure-modes-27 | measured            | 2026-04-28                                     | Plan-compliance study of 16,991 SWE-bench trajectories: removing the plan lowers success, but a bad/incomplete plan hurts more than no plan; periodic plan re-injection improved success.                                              | https://arxiv.org/html/2604.12147v2                                                               |
| R-failure-modes-28 | measured            | 2025-12-01 (v3)                                | Blind expert evaluation of LLM-generated Javadoc on post-cutoff code found most AI comments at least as good as the originals — no measured support for a blanket 'AI docs are worse' claim.                                           | https://arxiv.org/abs/2408.14007                                                                  |
| R-failure-modes-29 | measured            | 2026-07-08                                     | Repository-mining of agent-authored PRs shows they are reviewed less, merged faster and discussed less — but the sign of the trend flips under equally defensible analysis choices.                                                    | https://arxiv.org/abs/2607.07980                                                                  |
| R-failure-modes-30 | vendor-guidance     | 2026-03-03                                     | On a ~300,000-PR third-party benchmark, the top-scoring commercial review tool reached 49.2% precision / 53.5% recall / 51.2% F1 — roughly one in two comments leads to a change.                                                      | https://www.coderabbit.ai/blog/coderabbit-tops-martian-code-review-benchmark                      |
| R-failure-modes-31 | vendor-guidance     | 2026-07-24                                     | Anthropic removed over 80% of Claude Code's system prompt for Claude 5 generation models with no measurable eval loss, framing the shift as rules-to-judgment and repetition-to-concision.                                             | https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models       |
| R-failure-modes-32 | vendor-guidance     | 2026-08-19 (per search index; no date on page) | OpenAI frames the harness (turn loop, tool definitions, compaction, approvals) as the reusable asset and reports compaction plus retained reasoning tripling an agent benchmark score while cutting output tokens sixfold.             | https://developers.openai.com/blog/codex-as-a-platform                                            |
| R-failure-modes-33 | practitioner-report | 2025-06-12                                     | Cognition's core anti-multi-agent principle is that parallel sub-agents carry conflicting implicit decisions; they prescribe single-threaded agents with full shared traces.                                                           | https://cognition.com/blog/dont-build-multi-agents                                                |
| R-failure-modes-34 | practitioner-report | 2025-06-12                                     | Sub-agents cannot see each other's work, so their outputs are mutually inconsistent even when each is individually correct.                                                                                                            | https://cognition.com/blog/dont-build-multi-agents                                                |
| R-failure-modes-35 | practitioner-report | 2025-06-16                                     | LangChain's synthesis of the debate: read-oriented multi-agent work parallelizes; write-oriented does not, and multi-agent only pays when the task is high-value and breadth-first.                                                    | https://www.langchain.com/blog/how-and-when-to-build-multi-agent-systems                          |
| R-failure-modes-36 | practitioner-report | 2026-06-15                                     | Four AI reviewers run in parallel over 146 real PRs produced 679 findings with almost no overlap — 93.4% of 617 distinct flagged locations were found by exactly one tool.                                                             | https://addyosmani.com/blog/agentic-code-review/                                                  |
| R-failure-modes-37 | practitioner-report | 2025-08-29                                     | HumanLayer's research/plan/implement practice justifies planning by review leverage, not model accuracy: plan errors multiply into code errors, and humans can review plans they could not review as code.                             | https://www.humanlayer.dev/blog/advanced-context-engineering                                      |
| R-failure-modes-38 | practitioner-report | 2025-09 (repo doc; blog version 2025-08-29)    | The same practice targets 40-60% context utilization and discards sessions rather than letting them fill, with reported outcomes of 35k LOC across two features in 7 hours.                                                            | https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md |
| R-failure-modes-39 | practitioner-report | 2026-08-03                                     | Claude Code's original author advises periodically deleting all custom instructions, skills and hooks and re-adding only what the model still gets wrong, because instructions are patches for older models.                           | https://lucadidomenico.studio/en/blog/delete-claude-md-every-6-months                             |
| R-failure-modes-40 | practitioner-report | 2026-05-01                                     | Multivocal review of 67 sources reports the contradiction directly: large per-task gains alongside a rigorous RCT slowdown and telemetry showing far more PRs with far longer reviews and flat delivery metrics.                       | https://arxiv.org/abs/2605.01160                                                                  |
| R-failure-modes-41 | opinion             | 2026-03-29                                     | Enterprise critique of spec-driven tools: mandatory multi-phase pipelines mismatch real work, and spec output can exceed the cost of the change itself.                                                                                | https://martinelli.ch/why-spec-driven-development-tools-fail-in-the-enterprise/                   |
| R-failure-modes-42 | opinion             | 2026-03-29                                     | Same source, on trivial changes: a one-line fix should not trigger the full pipeline.                                                                                                                                                  | https://martinelli.ch/why-spec-driven-development-tools-fail-in-the-enterprise/                   |

## R-failure-modes-01

> Despite enthusiasm for Multi-Agent LLM Systems (MAS), their performance gains on popular benchmarks are often minimal.

Implication: Adding roles is unlikely to buy quality by itself; v3 should justify each remaining subagent by a measured defect it catches, not by coverage of a stage.

## R-failure-modes-02

> models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows

Implication: Long prose skill files plus accumulated stage artifacts degrade adherence before any window limit is hit; shortening instruction files is a performance change, not just aesthetics.

## R-failure-modes-03

> Even a single distractor reduces performance relative to the baseline (needle only), and adding four distractors compounds this degradation further

Implication: Near-duplicate rules across skill files (same rule restated in goals/plan/execute) act as distractors, not reinforcement.

## R-failure-modes-04

> We evaluate 20 state-of-the-art models across seven major providers and find that even the best frontier models only achieve 68% accuracy at the max density of 500 instructions.

Implication: There is a hard ceiling on simultaneous rules. Every rule mise adds statistically displaces another; a rule budget per stage is defensible.

## R-failure-modes-05

> Our analysis reveals model size and reasoning capability to correlate with 3 distinct performance degradation patterns, bias towards earlier instructions, and distinct categories of instruction-following errors.

Implication: If mise keeps many rules, the load-bearing ones (inline snapshots, no-slop docs) belong at the top of the file, not appended at the end.

## R-failure-modes-06

> None of the four structural variables or three two-way interactions produces a detectable contrast after multiple-testing correction.

Implication: Directly challenges 'shorten and reposition the skill files to improve adherence'. Halving instruction files may buy tokens and human readability, not compliance.

## R-failure-modes-07

> The largest effect we measured is within-session: each additional function the agent generates is associated with approximately 5.6% lower odds of compliance per step (OR = 0.944) within the session-length range we tested, though the relationship is non-monotonic rather than a constant per-step effect.

Implication: Recurring defects (tests without inline snapshots) are more likely a long-run artifact than a rule-wording artifact. Fix by shortening execute units / re-asserting the rule late in the run, not by rewording.

## R-failure-modes-08

> in-context governance constraints that agents reliably obey while visible can be silently removed by compaction

Implication: mise's long runs almost certainly compact. Rules that must survive (snapshot style, doc terseness) need re-injection at each stage boundary or a pinning mechanism; stating them once at session start is not enough.

## R-failure-modes-09

> all the top open- and closed-weight LLMs we test exhibit significantly lower performance in multi-turn conversations than single-turn, with an average drop of 39% across six generation tasks

Implication: Argues for mise's front-loaded requirements stage (specify once, fully) and against long interactive back-and-forth; also argues for restarting a derailed run rather than patching it.

## R-failure-modes-10

> When developers are allowed to use AI tools, they take 19% longer to complete issues

Implication: Owner perception that runs are 'very long' is the more trustworthy signal than perceived speedup; v3 should measure wall-clock per change, not felt velocity.

## R-failure-modes-11

> Due to the severity of these selection effects, we are working on changes to the design of our study.

Implication: Do not carry the 19%-slowdown result into v3 design as current fact; treat productivity claims (both directions) as unsettled and instrument mise's own runs.

## R-failure-modes-12

> CRA-only PRs achieve a 45.20% merge rate, 23.17 percentage points lower than human-only PRs (68.37%), with significantly higher abandonment.

Implication: An automated reviewer stage that gates without a human read can raise abandonment/rework. mise's verifying reviewer should filter to a small number of must-fix findings.

## R-failure-modes-13

> our signal-to-noise analysis reveals that 60.2% of closed CRA-only PRs fall into the 0-30% signal range, and 12 of 13 CRAs exhibit average signal ratios below 60%, indicating substantial noise in automated review feedback

Implication: Expect ~half of critic output to be noise by default; budget reviewer rounds accordingly and require the critic to rank/limit findings.

## R-failure-modes-14

> kappa deflation between exact match and Cohen's kappa is universal (33--41 pp on MT-Bench), judge rankings shift by up to 14 positions across benchmarks, high test--retest reliability (>0.95) coexists with severe position bias (>0.10) in two production-deployed judges

Implication: A mise acceptance/critic agent that reliably repeats its verdict is not thereby valid. Any checklist-style judging should compare against a held-out human verdict before being trusted as a gate.

## R-failure-modes-15

> Results show substantial variation in pressure robustness and selective updating, and further show that willingness to update does not by itself imply selectivity.

Implication: When the mise driver pushes back on a critic finding (or vice versa), capitulation is a known failure mode — convergence between agents is weak evidence the issue was real.

## R-failure-modes-16

> two repair rounds (R0 through R2) capture the majority (76–95%) of the total achievable improvement

Implication: Hard-cap critic/reviewer loops at about two rounds; further rounds are where mise's run length is being spent for little gain.

## R-failure-modes-17

> the gap also scales sharply with task length: it grows by 28 percentage points for every tenfold increase in code size

Implication: Green tests are a weaker acceptance signal the larger the change. Acceptance should include a spec-to-behavior check the agent could not see while implementing, and plans should keep units small.

## R-failure-modes-18

> We find the LLM judge to be highly effective at detecting reward hacking in unambiguous cases, and observe only minimal improvement from the use of held out test cases.

Implication: Cheap detection exists: an LLM check specifically asked 'did this change weaken or special-case a test?' beats adding more held-out tests. Worth a narrow acceptance check rather than a broad rule.

## R-failure-modes-19

> With the oracle in the loop, the score reaches near-perfect, but from a demo holding the tested behavior directly, the library left dead or absent.

Implication: mise's acceptance stage must exercise the user-facing path, not just the tests the executor wrote; otherwise the gate measures the gate.

## R-failure-modes-20

> coding agents are more likely to modify tests and to add mocks to tests than non-coding agents

Implication: Over-mocking is an agent-population-level tendency, not a mise-specific regression; a narrow explicit rule/check on mocks and on touching existing tests is evidence-backed.

## R-failure-modes-21

> Weak assertions and missing edge cases occur more often than blocking failures, showing that runnable tests can still be shallow.

Implication: Assertion strength needs its own explicit check (inline snapshot with real expected values). 'Tests pass' is the wrong acceptance predicate.

## R-failure-modes-22

> the percentage of moved code dropped to 13% of changed lines in 2023, before freefalling to 3.8% year-to-date in 2026

Implication: The measurable AI-era defect is duplication and non-reuse, not verbose prose. A reuse/duplication check has more supporting evidence than an anti-slop-wording rule.

## R-failure-modes-23

> a statistically significant, large, but transient increase in project-level development velocity, along with a substantial and persistent increase in static analysis warnings and code complexity

Implication: Lint/static-analysis and complexity gates target the measured regression; they are the quality gates most worth keeping in a leaner v3.

## R-failure-modes-24

> higher AI adoption is associated with an increase in both software delivery throughput and software delivery instability.

Implication: Keeps a case for some verification stage in v3 — the industry-level signal is instability, i.e. change failure and rework, which acceptance/test gates address directly.

## R-failure-modes-25

> Planning shifts from an accuracy scaffold for weaker models to a cost saver for stronger models, with little change in accuracy.

Implication: Justify mise's plan stage by token/time savings and human reviewability, not by expected accuracy gain on a frontier model — and drop it where the change is small.

## R-failure-modes-26

> adds machinery that models rarely use and yields no accuracy gain

Implication: Optional-lookup artifacts (linkable research docs the agent may re-read) are likely dead weight; prefer cheap rule-based elision plus summarization.

## R-failure-modes-27

> The negative impact of a bad, incomplete plan is greater on trajectories than the impact of no plan at all

Implication: A thin, low-quality plan produced to satisfy a stage is worse than skipping the stage. If v3 keeps planning, it must keep the plan-quality gate — or drop both.

## R-failure-modes-28

> A qualitative assessment of the comments-performed independently by two experts-showed that 58.8% were equivalent to, and 27.7% superior to, the original comments.

Implication: The 'AI-slop docs' rule is not externally supported as a general defect; if v3 keeps it, justify it from mise's own transcripts, and define it as a concrete style constraint rather than a taste rule.

## R-failure-modes-29

> the direction of these trends flips under different but equally defensible analysis choices, so the traces establish what is changing without explaining why

Implication: Warns against tuning v3 to published aggregate trends; mise's own run data is the only reliable basis for dropping a stage.

## R-failure-modes-30

> Precision is a measure of the % of true positives out of all review comments from a tool.

Implication: Even best-in-class review precision is ~50%; a mise gate that requires addressing every critic finding spends roughly half its rounds on non-defects.

## R-failure-modes-31

> removed over 80% of Claude Code's system prompt for models like Claude Opus 5 and Claude Fable 5 with no measurable loss on our coding evaluations

Implication: Strongest available precedent that prose-heavy skill files can be cut hard without regression — but only measurable if v3 keeps an eval to check against.

## R-failure-modes-32

> On ARC-AGI-3, retained reasoning and context compaction raised GPT-5.6 Sol's score from 13.3% to 38.3% while reducing output tokens sixfold.

Implication: Mechanical context handling, not more instructional prose, is where the measured wins are; v3 effort is better spent on what gets carried between stages.

## R-failure-modes-33

> Actions carry implicit decisions, and conflicting decisions carry bad results

Implication: Any mise subagent that writes (executor, documenter, fixer) risks decisions that contradict the driver's. Keep writes single-threaded; reserve subagents for read/analysis.

## R-failure-modes-34

> Subagent 1 and subagent 2 cannot not see what the other was doing and so their work ends up being inconsistent with each other.

Implication: Critic/reviewer/documenter running off separate contexts will produce mutually inconsistent asks; a single verifying pass with the full trace is cheaper than reconciling three.

## R-failure-modes-35

> Multi-agent systems that primarily 'read' are easier than those that 'write'

Implication: Supports keeping research/discovery subagents in v3 while collapsing write-side roles into the main thread.

## R-failure-modes-36

> The four tools never once flagged the same line.

Implication: Agreement between review passes is not evidence of correctness, and repeated same-model review rounds likely re-cover the same narrow band. Diversity (different model/role) buys more than more rounds.

## R-failure-modes-37

> A bad line of a **plan** could lead to hundreds of bad lines of code. And a bad line of **research**...could land you with thousands of bad lines of code.

Implication: If v3 keeps a plan stage, the plan's job is human review leverage; anything in the plan a human will not read should be cut.

## R-failure-modes-38

> keeping utilization in the 40%-60% range (depends on complexity of the problem)

Implication: A concrete, testable stopping rule for mise stages: hand off to a fresh session at a context threshold rather than compacting in place.

## R-failure-modes-39

> every six months, delete your CLAUDE.md, your skills and your hooks. Then watch how the model behaves.

Implication: Directly supports the v3 method: strip to zero, re-add each rule only against an observed failure on the current model.

## R-failure-modes-40

> telemetry across 10,000+ developers shows 98% more pull requests but 91% longer review times with flat delivery metrics

Implication: Review capacity, not generation, is the bottleneck; v3 should optimize for what a human can review per run (small diffs, short plans) rather than for stage completeness.

## R-failure-modes-41

> The documentation overhead can be significant, sometimes generating more markdown files to review than it would take to build the feature itself.

Implication: Names the exact failure mode the owner reports. An explicit small-change path that skips goals/requirements documents is the standard remedy.

## R-failure-modes-42

> A single-line bug fix in a legacy system should not trigger a full spec generation pipeline.

Implication: Stage set should be selected by change size at entry, not fixed per run.

## Gaps

- No measured study found on inline-snapshot testing specifically (agents blessing/regenerating snapshots instead of writing expected values). Closest evidence is indirect: over-mocking (arXiv 2602.00409), weak assertions (2609.05978), and test-suite gaming (SpecBench 2605.21384, EvilGenie 2511.21654).
- No measured study found on 'AI-slop' verbose documentation or comments as a defect; the one controlled evaluation found (arXiv 2408.14007) reports AI comments equal or better than human originals. Could not determine whether verbosity harms maintainers.
- No head-to-head measured comparison found of multi-agent vs single-thread on real code-editing tasks. Cognition/LangChain are practitioner argument; MAST (2503.13657) measures failures within MAS but does not run a controlled single-thread arm.
- No measured evidence found on role-specialized subagents of the kind mise uses (critic / documenter / acceptance) — no study isolates their marginal value.
- Martian/Code Review Bench per-tool precision/recall numbers are only published for CodeRabbit on the vendor page; the full leaderboard was not retrieved, and the benchmark is reported by the winning vendor.
- SycoBench-600 numeric flip rates under doubt/authority/wrong-suggestion pressure are in the PDF only; abstract gives no per-condition numbers.
- METR's 2026 update states a returning-developer 'speedup of -18% with a confidence interval between -38% and +9%'; sign convention (faster vs slower) is ambiguous from the blog text and was not resolved.
- The Boris Cherny 'delete your CLAUDE.md every six months' quote is secondhand (a blog write-up of a YC Startup School talk, 2026-07); no primary transcript or recording URL was located.
- https://developers.openai.com/blog/codex-as-a-platform carries no visible publication date on the fetched page; 2026-08-19 comes from the search index only.
- Could not determine an evidence-based threshold for 'how many simultaneous rules mise can carry' — IFScale measures 10-500 keyword instructions in a writing task, not procedural coding rules, and the one coding-agent config study (2605.10039) found a null for file size.
- No measured evidence found on diminishing returns of repeated _review_ rounds specifically; the 76-95%-in-two-rounds result (2604.10508) is self-repair against execution feedback, not critic review.
- Claims circulating about a '441.5% increase in median review duration' and 'Greptile comment acceptance 30% -> 43%' appeared only in secondary blog summaries; primary sources were not located and these are excluded from findings.
