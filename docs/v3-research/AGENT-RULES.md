# Rules for research agents

Context: we are designing a leaner experimental v3 of the "mise" Claude Code plugin (repo /Users/eric/Code/mise-claude-plugin, branch v3). mise drives feature/bugfix work through stages (goals, requirements, plan, execute) with critic, reviewer, documenter, acceptance and retrospective subagents. The owner finds runs very long, the skill files prose-heavy, and some defects recurring despite rules. v3 keeps only what evidence from real runs supports. You produce one input to that decision. Owner decisions so far: decisions.md. What round 1 found, with its gaps: round1-agent-reports.md. Transcript layout and digest schema: tools/README.md.

- Write only under /Users/eric/Code/mise-claude-plugin/docs/v3-research/. Every other path on this machine is read-only. In other repos use only non-mutating git commands (log, show, diff, blame, ls-tree, cat-file, for-each-ref, worktree list). Never checkout, switch, stash, reset, fetch, pull, commit, or edit files there.
- Report what the data shows, including "no evidence" and "could not determine". Never fill a gap with a plausible guess; list it under gaps.
- State n for every rate or comparison. Say "insufficient n" rather than implying a trend.
- Cite every claim: file:line, commit sha, transcript path + timestamp, or URL.
- Large inputs (git history, JSONL transcripts up to hundreds of MB): aggregate with scripts you write under tools/, never by reading raw files into context. Reuse existing scripts in tools/ before writing new ones.
- Where you classify text by judgement, classify from the verbatim text, keep the verbatim text in the output row, and re-check every 5th row blind before finishing.
- Write tersely: JSONL and tables over prose. No preamble, no recap, no advice beyond what is asked.
- Final message: files written, the key numbers in at most 150 words, and gaps. Nothing else.
