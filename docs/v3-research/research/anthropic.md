# anthropic

Status: UNVERIFIED — citation check did not run (session limit). Quotes are as reported by the research agent.

| id             | strength            | date                | claim                                                                                                                                                                                                | url                                                                                                      |
| -------------- | ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| R-anthropic-01 | measured            | 2025-06-13          | Multi-agent orchestration measured a 90.2% lift over a single agent — on breadth-first research, not coding.                                                                                         | https://www.anthropic.com/engineering/multi-agent-research-system                                        |
| R-anthropic-02 | measured            | 2025-06-13          | Multi-agent systems burn ~15x the tokens of chat (agents ~4x), so they need high-value, parallel tasks to pay off.                                                                                   | https://www.anthropic.com/engineering/multi-agent-research-system                                        |
| R-anthropic-03 | measured            | 2025-09-29          | Context rot is real and universal: recall degrades as context grows, so context is a finite attention budget.                                                                                        | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents                        |
| R-anthropic-04 | measured            | 2026-03-24          | The full multi-agent harness cost 20x more than a solo run ($200/6h vs $9/20min); a simplified v2 harness ran 3h50m for $124.70.                                                                     | https://www.anthropic.com/engineering/harness-design-long-running-apps                                   |
| R-anthropic-05 | measured            | 2026-08-13          | Same-model agents are low variance, so one agent's bad decision tends to be replicated by the others.                                                                                                | https://www.anthropic.com/research/multiagent-systems                                                    |
| R-anthropic-06 | measured            | 2025-11-04          | Moving orchestration into code instead of tool calls cut context from 150,000 to 2,000 tokens in Anthropic's MCP example.                                                                            | https://www.anthropic.com/engineering/code-execution-with-mcp                                            |
| R-anthropic-07 | vendor-guidance     | 2024-12-19          | Anthropic's core agent-design advice is to start with the simplest solution and add complexity only when it demonstrably helps — possibly no agentic system at all.                                  | https://www.anthropic.com/engineering/building-effective-agents                                          |
| R-anthropic-08 | vendor-guidance     | 2024-12-19          | Workflows (predefined code paths) buy predictability for well-defined tasks; agents buy flexibility where model-driven decisions are needed at scale.                                                | https://www.anthropic.com/engineering/building-effective-agents                                          |
| R-anthropic-09 | vendor-guidance     | 2025-06-13          | Anthropic explicitly says coding is a poor fit for multi-agent architectures relative to research.                                                                                                   | https://www.anthropic.com/engineering/multi-agent-research-system                                        |
| R-anthropic-10 | vendor-guidance     | 2025-06-13          | Delegation quality is the lever: a subagent prompt must state objective, output format, tool/source guidance and task boundaries, or agents duplicate work and leave gaps.                           | https://www.anthropic.com/engineering/multi-agent-research-system                                        |
| R-anthropic-11 | vendor-guidance     | 2025-09-29          | The design target is the smallest set of high-signal tokens — minimal, which is not the same as short.                                                                                               | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents                        |
| R-anthropic-12 | vendor-guidance     | 2025-09-29          | Prompts fail at two altitudes: brittle hardcoded if-else logic, and vague guidance; the fix is heuristics specific enough to steer but flexible.                                                     | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents                        |
| R-anthropic-13 | vendor-guidance     | 2025-09-29          | Do not enumerate every edge case in a prompt; curate a few diverse canonical examples instead.                                                                                                       | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents                        |
| R-anthropic-14 | vendor-guidance     | 2025-09-29          | Just-in-time retrieval beats preloading: keep lightweight identifiers and let the agent load context at runtime; Claude Code uses a hybrid (CLAUDE.md up front, glob/grep on demand).                | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents                        |
| R-anthropic-15 | vendor-guidance     | 2025-09-29          | For long-horizon work Anthropic names three techniques — compaction, structured note-taking, and sub-agents — and says tool-result clearing is the safest, lightest compaction.                      | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents                        |
| R-anthropic-16 | vendor-guidance     | 2025-09-11          | Tool/interface design is where token efficiency is won: build few high-impact tools and cap responses (Claude Code caps tool output at 25,000 tokens).                                               | https://www.anthropic.com/engineering/writing-tools-for-agents                                           |
| R-anthropic-17 | vendor-guidance     | accessed 2026-09-19 | Every Claude Code best practice descends from one constraint: context fills fast and performance degrades as it fills.                                                                               | https://code.claude.com/docs/en/best-practices                                                           |
| R-anthropic-18 | vendor-guidance     | accessed 2026-09-19 | CLAUDE.md must pass a deletion test; bloat causes Claude to ignore the rules you care about.                                                                                                         | https://code.claude.com/docs/en/best-practices                                                           |
| R-anthropic-19 | vendor-guidance     | accessed 2026-09-19 | Emphasis only works if it is rare.                                                                                                                                                                   | https://code.claude.com/docs/en/best-practices                                                           |
| R-anthropic-20 | vendor-guidance     | accessed 2026-09-19 | Hooks are deterministic where prose is advisory; docs explicitly say to delete a rule the model already follows, or convert it to a hook.                                                            | https://code.claude.com/docs/en/best-practices                                                           |
| R-anthropic-21 | vendor-guidance     | accessed 2026-09-19 | The same page gives the disposal rule for rules that do not earn their place.                                                                                                                        | https://code.claude.com/docs/en/best-practices                                                           |
| R-anthropic-22 | vendor-guidance     | accessed 2026-09-19 | Verification should be a check the agent can run, escalating from prompt, to a goal condition, to a Stop hook that blocks the turn, to a second-opinion subagent.                                    | https://code.claude.com/docs/en/best-practices                                                           |
| R-anthropic-23 | vendor-guidance     | accessed 2026-09-19 | An adversarial reviewer will always find something, and chasing its findings causes over-engineering.                                                                                                | https://code.claude.com/docs/en/best-practices                                                           |
| R-anthropic-24 | vendor-guidance     | accessed 2026-09-19 | Skill authoring's first principle is token economy — challenge each sentence, assume Claude is already smart.                                                                                        | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices                         |
| R-anthropic-25 | vendor-guidance     | accessed 2026-09-19 | Specificity should match task fragility: high freedom for judgement work, low freedom (exact scripts) only where operations are fragile and consistency is critical.                                 | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices                         |
| R-anthropic-26 | vendor-guidance     | accessed 2026-09-19 | Structural limits: keep SKILL.md under 500 lines and keep every reference exactly one level deep, because nested references get partially read.                                                      | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices                         |
| R-anthropic-27 | vendor-guidance     | accessed 2026-09-19 | Anthropic tells skill authors to build evaluations before writing extensive documentation, starting from observed failures.                                                                          | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices                         |
| R-anthropic-28 | vendor-guidance     | accessed 2026-09-19 | For complex multistep work, the recommended device is a copyable checklist plus a validator loop, not narrative instructions.                                                                        | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices                         |
| R-anthropic-29 | vendor-guidance     | accessed 2026-09-19 | Explaining why an instruction exists outperforms a bare rule, because Claude generalizes from the explanation.                                                                                       | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| R-anthropic-30 | vendor-guidance     | accessed 2026-09-19 | Emphatic language now causes over-triggering on current models; docs say to dial it back.                                                                                                            | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| R-anthropic-31 | vendor-guidance     | accessed 2026-09-19 | Anthropic ships a ready-made anti-overengineering block covering scope, documentation, defensive coding and abstractions — including not adding comments to code you did not change.                 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| R-anthropic-32 | vendor-guidance     | accessed 2026-09-19 | There is an official prompt block for test-gaming/hard-coding, framing tests as verification rather than specification.                                                                              | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| R-anthropic-33 | vendor-guidance     | accessed 2026-09-19 | For multi-context-window work, use a different prompt for the first window and rely on the filesystem for state; current models discover state from the filesystem extremely well.                   | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| R-anthropic-34 | vendor-guidance     | accessed 2026-09-19 | Current models spawn subagents readily and can overuse them where a direct grep would be faster.                                                                                                     | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| R-anthropic-35 | vendor-guidance     | accessed 2026-09-19 | On Opus 5, explicit verification instructions cause over-verification; Anthropic says to delete them and the legacy harness scaffolding that adds separate verification steps.                       | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5         |
| R-anthropic-36 | vendor-guidance     | accessed 2026-09-19 | Opus 5 guidance explicitly bars verification subagents and points to deterministic caps for delegation.                                                                                              | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5         |
| R-anthropic-37 | vendor-guidance     | accessed 2026-09-19 | Review prompts that say "only report high-severity issues" are now followed literally and suppress findings; the fix is coverage-first reporting with filtering as a separate pass.                  | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5         |
| R-anthropic-38 | vendor-guidance     | accessed 2026-09-19 | Current models follow instructions literally and do not generalize scope from one item to another.                                                                                                   | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5       |
| R-anthropic-39 | vendor-guidance     | accessed 2026-09-19 | Written deliverables from Opus 5 run long by default and need explicit length calibration.                                                                                                           | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5         |
| R-anthropic-40 | vendor-guidance     | accessed 2026-09-19 | Hooks can carry judgement, not just scripts: prompt hooks call a model (Haiku by default) and agent hooks spawn a verifying subagent that can run the test suite before allowing a stop.             | https://code.claude.com/docs/en/hooks-guide                                                              |
| R-anthropic-41 | vendor-guidance     | accessed 2026-09-19 | Skill content is a recurring cost: it stays in context across turns, and Anthropic says to state what to do rather than narrating how or why, and to use hooks when a skill stops steering behavior. | https://code.claude.com/docs/en/skills                                                                   |
| R-anthropic-42 | vendor-guidance     | accessed 2026-09-19 | `claude plugin eval` measures a plugin against a no-plugin baseline, so each rule or stage can be tested for whether it contributes anything.                                                        | https://code.claude.com/docs/en/plugin-evals                                                             |
| R-anthropic-43 | vendor-guidance     | 2026-01-09          | Claude Code's own team added evals for concision and over-engineering — the same defects mise reports — rather than writing more instructions.                                                       | https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents                                   |
| R-anthropic-44 | vendor-guidance     | 2026-01-09          | Graders must be hack-resistant, because agents will otherwise satisfy the check rather than the problem.                                                                                             | https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents                                   |
| R-anthropic-45 | practitioner-report | 2025-11-26          | Long-running agents fail two ways — trying to one-shot the app, and later declaring victory — and the fix is structured artifacts: feature list in JSON, progress file, git commits.                 | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents                        |
| R-anthropic-46 | practitioner-report | 2025-11-26          | Anthropic's own anti-test-deletion rule is a single strongly-worded line attached to a machine-readable file.                                                                                        | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents                        |
| R-anthropic-47 | practitioner-report | 2026-03-24          | Every harness component encodes an assumption about what the model cannot do; those assumptions go stale and should be removed one at a time and measured.                                           | https://www.anthropic.com/engineering/harness-design-long-running-apps                                   |
| R-anthropic-48 | practitioner-report | 2026-03-24          | Agents praise their own work; separating generator from evaluator is the lever, and tuning a skeptical standalone evaluator is far more tractable than making a generator self-critical.             | https://www.anthropic.com/engineering/harness-design-long-running-apps                                   |
| R-anthropic-49 | practitioner-report | 2026-03-24          | An evaluator agent is not a permanent fixture: it pays only when the task sits beyond what the model does reliably alone, and became overhead on a stronger model.                                   | https://www.anthropic.com/engineering/harness-design-long-running-apps                                   |
| R-anthropic-50 | practitioner-report | 2026-04-08          | A concrete example of stale scaffolding: context resets added for Sonnet 4.5's context anxiety became dead weight on Opus 4.5.                                                                       | https://www.anthropic.com/engineering/managed-agents                                                     |
| R-anthropic-51 | practitioner-report | 2026-02-05          | In a fully autonomous agent-team build, nearly all the engineering effort went into the verifier: an imperfect test harness makes the agent solve the wrong problem.                                 | https://www.anthropic.com/engineering/building-c-compiler                                                |

## R-anthropic-01

> We found that a multi-agent system with Claude Opus 4 as the lead agent and Claude Sonnet 4 subagents outperformed single-agent Claude Opus 4 by 90.2% on our internal research eval.

Implication: The strongest published subagent evidence is for parallel research; mise should keep subagents for discovery/sweeps, not for every stage.

## R-anthropic-02

> In our data, agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats. For economic viability, multi-agent systems require tasks where the value of the task is high enough to pay for the increased performance.

Implication: Quantifies why mise runs feel long/expensive; each extra critic/reviewer/documenter agent is a multiplier, not an additive cost.

## R-anthropic-03

> Studies on needle-in-a-haystack style benchmarking have uncovered the concept of context rot : as the number of tokens in the context window increases, the model’s ability to accurately recall information from that context decreases.

Implication: Long prose-heavy stage files compete with the actual work; halving instruction files is a performance change, not just tidiness.

## R-anthropic-04

> The harness was over 20x more expensive, but the difference in output quality was immediately apparent.

Implication: Sets the exchange rate the owner is implicitly paying for extra mise roles; worth measuring mise's own per-stage cost the same way.

## R-anthropic-05

> And, by implication, this means that when one agent makes a bad decision, it is likely that many agents will make that same bad decision. What would have been isolated problems can quickly become systemic failures.

Implication: A same-model critic sharing the generator's context is weakly independent; mise gets more from a different check (script/lint/tests) than another Claude opinion.

## R-anthropic-06

> This reduces the token usage from 150,000 tokens to 2,000 tokens—a time and cost saving of 98.7% .

Implication: Strongest number for "prose to tooling": mise steps that are really loops/filters should be scripts the agent runs, not instructions it follows.

## R-anthropic-07

> When building applications with LLMs, we recommend finding the simplest solution possible, and only increasing complexity when needed. This might mean not building agentic systems at all.

Implication: Supports v3's premise: each stage/subagent must earn its place; default to removing, not adding.

## R-anthropic-08

> When more complexity is warranted, workflows offer predictability and consistency for well-defined tasks, whereas agents are the better option when flexibility and model-driven decision-making are needed at scale.

Implication: mise's fixed stage sequence is a workflow: it should be encoded in script/hook control flow, not in prose the model may reinterpret.

## R-anthropic-09

> For instance, most coding tasks involve fewer truly parallelizable tasks than research, and LLM agents are not yet great at coordinating and delegating to other agents in real time.

Implication: Argues against mise's multi-role pipeline for ordinary feature/bugfix work; favors one driver plus targeted read-only subagents.

## R-anthropic-10

> Each subagent needs an objective, an output format, guidance on the tools and sources to use, and clear task boundaries. Without detailed task descriptions, agents duplicate work, leave gaps, or fail to find necessary information.

Implication: If v3 keeps subagents, invest the prose budget in the delegation template (4 slots), not in role-personality instructions.

## R-anthropic-11

> Given that LLMs are constrained by a finite attention budget, good context engineering means finding the smallest possible set of high-signal tokens that maximize the likelihood of some desired outcome.

Implication: Gives v3 a test for every retained line: does it raise the odds of the desired outcome, or is it commentary?

## R-anthropic-12

> At one extreme, we see engineers hardcoding complex, brittle logic in their prompts to elicit exact agentic behavior. This approach creates fragility and increases maintenance complexity over time.

Implication: mise's accumulated per-defect rules are the brittle extreme; recurring defects should move to lint/hooks, leaving heuristics in prose.

## R-anthropic-13

> However, teams will often stuff a laundry list of edge cases into a prompt in an attempt to articulate every possible rule the LLM should follow for a particular task. We do not recommend this. Instead, we recommend working to curate a set of diverse, canonical examples that effectively portray the expected behavior of the agent.

Implication: For recurring defects (inline snapshots, slop comments) ship one canonical good/bad example pair rather than another rule paragraph.

## R-anthropic-14

> Claude Code is an agent that employs this hybrid model: CLAUDE.md files are naively dropped into context up front, while primitives like glob and grep allow it to navigate its environment and retrieve files just-in-time, effectively bypassing the issues of stale indexing and complex syntax trees.

Implication: v3 should load a thin stage index and let the model fetch the one rule file it needs, rather than front-loading every stage's prose.

## R-anthropic-15

> An example of low-hanging superfluous content is clearing tool calls and results – once a tool has been called deep in the message history, why would the agent need to see the raw result again? One of the safest lightest touch forms of compaction is tool result clearing

Implication: A notes file plus tool-result clearing may replace much of mise's hand-rolled state prose; pick per task type (notes for milestone work).

## R-anthropic-16

> For Claude Code, we restrict tool responses to 25,000 tokens by default.

Implication: Any mise script that feeds an agent (test output, checklist dumps) needs the same budget discipline as a tool response.

## R-anthropic-17

> Most best practices are based on one constraint: Claude’s context window fills up fast, and performance degrades as it fills.

Implication: Frames v3's success metric: tokens-to-first-useful-change and context headroom at each stage boundary.

## R-anthropic-18

> Keep it concise. For each line, ask: “Would removing this cause Claude to make mistakes?” If not, cut it. Bloated CLAUDE.md files cause Claude to ignore your actual instructions!

Implication: Apply the same line-level test to every mise skill file; a rule that is ignored because of neighbours is worse than no rule.

## R-anthropic-19

> If Claude keeps skipping one instruction, add emphasis such as “IMPORTANT” to that line alone. If you emphasize many lines, none of them stands out.

Implication: mise's repeated MUST/NEVER phrasing is self-cancelling; v3 should allow at most one emphasized line per file.

## R-anthropic-20

> Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens.

Implication: Direct support for moving mise's recurring-defect rules (inline snapshots, comment style) out of prose into hooks/lint gates.

## R-anthropic-21

> Fix : Ruthlessly prune. If Claude already does something correctly without the instruction, delete it or convert it to a hook.

Implication: Gives v3 a concrete triage: for each existing rule, test without it — delete, or make it a hook; prose is the last resort.

## R-anthropic-22

> As a deterministic gate : a Stop hook runs your check as a script and blocks the turn from ending until it passes. Claude Code overrides the hook and ends the turn after 8 consecutive blocks.

Implication: mise's acceptance/end-of-plan gates can be Stop hooks running the repo's own checks instead of a stage the model narrates through.

## R-anthropic-23

> A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is what it was asked to do. Chasing every finding leads to over-engineering: extra abstraction layers, defensive code, and tests for cases that can’t happen.

Implication: Explains mise's long runs and bloat: critic/reviewer loops manufacture work. Scope reviewers to correctness plus stated requirements, and let the driver dismiss the rest.

## R-anthropic-24

> The context window is a public good.

Implication: v3 skill files should be rewritten against the three challenge questions, notably “Does this paragraph justify its token cost?”

## R-anthropic-25

> Set appropriate degrees of freedom Match the level of specificity to the task’s fragility and variability.

Implication: Gives a sorting rule for v3: plan/goals stages = high freedom prose; release/commit/cleanup steps = exact scripted commands.

## R-anthropic-26

> Keep references one level deep from SKILL.md . All reference files should link directly from SKILL.md to ensure Claude reads complete files when needed.

Implication: If v3 splits stage files into references, they must hang off one index; chained stage-to-stage references risk head -100 partial reads.

## R-anthropic-27

> Create evaluations BEFORE writing extensive documentation. This ensures your Skill solves real problems rather than documenting imagined ones.

Implication: v3 should ship 3 failure-derived eval cases (inline snapshots, slop docs, run length) before re-writing any stage prose.

## R-anthropic-28

> Break complex operations into clear, sequential steps. For particularly complex workflows, provide a checklist that Claude can copy into its response and check off as it progresses.

Implication: Supports keeping mise's checklist mechanic while deleting the prose around it; pair each checklist with a runnable validator.

## R-anthropic-29

> Providing context or motivation behind your instructions, such as explaining to Claude why such behavior is important, can help Claude better understand your goals and deliver more targeted responses.

Implication: When a rule survives triage, write it as one sentence with its reason ("inline snapshots because diffs review faster"), not as a decree.

## R-anthropic-30

> Where you might have said "CRITICAL: You MUST use this tool when...", you can use more normal prompting like "Use this tool when...".

Implication: mise's escalated phrasing likely causes stage/subagent over-triggering and long runs; v3 should normalize tone across all skill files.

## R-anthropic-31

> - Documentation: Don't add docstrings, comments, or type annotations to code you didn't change. Only add comments where the logic isn't self-evident.

Implication: Replaces mise's home-grown AI-slop rules with vendor-tested wording; adopt verbatim rather than re-deriving it in each stage file.

## R-anthropic-32

> Do not hard-code values or create solutions that only work for specific test inputs. Instead, implement the actual logic that solves the problem generally.

Implication: Use this canonical wording once in the execute stage instead of per-defect rules accumulated from past runs.

## R-anthropic-33

> **Starting fresh versus compacting:** When a context window is cleared, consider starting with a brand new context window rather than using compaction. Claude's latest models are extremely effective at discovering state from the local filesystem.

Implication: v3 can drop hand-written state-carrying prose between stages if each stage leaves files/commits a fresh session can read.

## R-anthropic-34

> Claude Opus 4.6 has a strong predilection for subagents and may spawn them in situations where a simpler, direct approach would suffice.

Implication: mise's "delegate" habit may now be self-sustaining; v3 needs damping guidance plus caps, not encouragement.

## R-anthropic-35

> If your prompt contains explicit verification instructions ("include a final verification step for any non-trivial task," "use a subagent to verify"), remove them: instructions like these cause over-verification on Claude Opus 5, and removing them reduces wasted tokens with no loss in quality. The same applies to legacy harness scaffolding that adds separate verification steps.

Implication: The single most direct instruction for v3: mise's verifying-reviewer and end-of-plan verification stages are the named anti-pattern on the session model.

## R-anthropic-36

> Delegate to a subagent only for large tasks that are genuinely independent and parallelizable, such as a wide multi-file investigation. Do not delegate work you can finish yourself in a handful of tool calls, and do not use subagents to verify or double-check your own work.

Implication: Cut critic/verifier subagents on the session model; keep delegation for wide read-only sweeps, and enforce with CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS/SPAWN_DEPTH.

## R-anthropic-37

> If your review prompt says "only report high-severity issues" or "be conservative," the model may follow that instruction literally and report less; ask it to report everything and filter in a separate pass instead.

Implication: If v3 keeps any review step, split finding from filtering; mise's severity-bar prose is silently dropping real findings.

## R-anthropic-38

> Claude Sonnet 5 interprets prompts literally and explicitly, particularly at lower effort levels. It does not silently generalize an instruction from one item to another, and it does not infer requests you didn't make.

Implication: A v3 rule must name its scope ("every new test file", not "tests"); vague scoping explains rules that appear obeyed once then dropped.

## R-anthropic-39

> Separate from conversational verbosity, files that Claude Opus 5 writes to disk (reports, Markdown documents, summaries) are often longer than on prior models.

Implication: mise's AI-slop docs are a known model default, not a rule failure: fix with one length-calibration line in the documenter step, or drop the step.

## R-anthropic-40

> Use prompt hooks when the hook input data alone is enough to make a decision. Use agent hooks when you need to verify something against the actual state of the codebase.

Implication: mise's acceptance gate can become a Stop agent-hook: same judgement, enforced by the harness, with no stage prose and no driver-context cost.

## R-anthropic-41

> Keep the body itself concise. Once a skill loads, its content [stays in context across turns](#skill-content-lifecycle), so every line is a recurring token cost. State what to do rather than narrating how or why

Implication: Directly indicts mise's prose-heavy stage skills; note the tension with the "explain why" prompting advice — reasons belong in one-line form, not paragraphs.

## R-anthropic-42

> If a case scores 1.0 both with and without the plugin, the plugin isn't what made it pass.

Implication: Gives v3 the evidence mechanism the owner wants: keep only stages/rules with a positive Δ over the no-plugin baseline, gated in CI.

## R-anthropic-43

> Later, we added evals—first for narrow areas like concision and file edits, and then for more complex behaviors like over-engineering.

Implication: Precedent for v3: treat verbosity/over-engineering as measurable behaviours with regression evals, not as rule-coverage gaps.

## R-anthropic-44

> Tasks and graders should be designed so that passing genuinely requires solving the problem rather than exploiting unintended loopholes.

Implication: If v3 gates on scripts, the gate itself becomes the target; design gates (snapshot lint, doc-length lint) that cannot be passed by deleting tests or docs.

## R-anthropic-45

> After some experimentation, we landed on using JSON for this, as the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files.

Implication: If v3 keeps a plan/task file, make it JSON with a status field rather than Markdown prose the agent rewrites.

## R-anthropic-46

> It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality.

Implication: Model for mise's test rules: one line, attached to the artifact it governs, instead of a section of test philosophy.

## R-anthropic-47

> every component in a harness encodes an assumption about what the model can’t do on its own, and those assumptions are worth stress testing, both because they may be incorrect, and because they can quickly go stale as models improve

Implication: Exactly the v3 method: ablate one stage/role per run and compare, rather than redesigning wholesale (the author's radical cut failed).

## R-anthropic-48

> But tuning a standalone evaluator to be skeptical turns out to be far more tractable than making a generator critical of its own work, and once that external feedback exists, the generator has something concrete to iterate against.

Implication: Keep one separated verifier role if any is kept — and expect it to need prompt tuning against real transcripts, not more rules.

## R-anthropic-49

> The practical implication is that the evaluator is not a fixed yes-or-no decision. It is worth the cost when the task sits beyond what the current model does reliably solo.

Implication: v3 should make the reviewer conditional (large/multi-file/risky changes) rather than a mandatory stage on every run.

## R-anthropic-50

> We addressed this by adding context resets to the harness. But when we used the same harness on Claude Opus 4.5, we found that the behavior was gone. The resets had become dead weight.

Implication: Any mise mechanism added to compensate for an older model (extra summaries, re-reads, reminders) should be re-tested before v3 keeps it.

## R-anthropic-51

> Claude will work autonomously to solve whatever problem I give it. So it’s important that the task verifier is nearly perfect, otherwise Claude will solve the wrong problem.

Implication: Budget v3's effort into the checks (test style lint, doc-slop lint, acceptance script), not into more reviewer prose.

## Gaps

- No Anthropic source found that addresses inline-snapshot testing specifically, or any test-style convention; the only adjacent guidance is the generic anti-hard-coding prompt block and "it is unacceptable to remove or edit tests".
- No published measurement of how much a critic/reviewer/documenter stage adds or costs in a Claude Code plugin; the only cost comparisons are whole-harness ($9 solo vs $200 full harness; $124.70 v2 run; $20k for the C-compiler agent team).
- Unresolved conflict in Anthropic's own guidance: skill-authoring docs advise escalating to stronger language ("using stronger language such as \"MUST filter\" instead of \"always filter,\"") while current-model prompting guidance says to dial emphatic language back because it causes over-triggering. No source reconciles them.
- Second conflict: prompting best practices say explaining _why_ improves generalization, while the Claude Code skills doc says to "State what to do rather than narrating how or why" because skill content is a recurring token cost. No source states how to trade these off.
- No data on optimal number of workflow stages, or on whether staged pipelines beat a single well-specified prompt for ordinary feature/bugfix work; the multi-agent evidence is all research-shaped, and Anthropic explicitly says coding parallelizes less.
- `claude plugin eval` is documented but no published results show its variance or how many runs are needed to detect a small regression; the doc only states three runs per case by default.
- Could not determine whether any Anthropic engineering post after 2026-05-25 ("How we contain Claude across products") covers agentic-coding harness design; the engineering index lists nothing between then and 2026-09-19 except the Aug 13 2026 research post on multiagent systems.
- Docs pages (best practices, skills, hooks, plugin evals, model prompting pages) carry no publication or revision dates, so all doc citations are "accessed 2026-09-19" and cannot be ordered against the dated blog posts.
