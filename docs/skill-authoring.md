# Skill authoring

How this plugin's instruction files are written.

- Every instruction appears once, in the file whose role acts on it. No file restates another, and no prose restates what `skills/next/scripts/state.ts` enforces or reports.
- For each line ask whether removing it would cause a mistake; if not, cut it. Every shipped line but glue maps to an evidence id in `docs/line-evidence.md`, keyed by its first eight words — a line that maps to nothing is cut — and the per-file budgets there are ceilings, not targets. Rewording a line's opening words re-keys its row.
- Direct and imperative. No framing prose, no rationale except where a reader would otherwise apply the rule wrongly. One rule per bullet, sections in execution order, templates and exact phrasings as fenced blocks.
- One term per concept, the same term in every file: the steps (start, goals, spec, critic, execute, adherence, review, gate, close) and the artifacts (`goals.md`, `spec.md`, `tasks/`, `tasks/done/`, `adherence.md`, `review.md`, `ledger.jsonl`).
- Role files are self-contained: a fresh-context subagent reads one role file plus the paths its prompt names, never a sibling file. Driver files hold no role instructions.
- Each SKILL.md carries `disable-model-invocation: true`, and `next`'s `allowed-tools` covers the state script, checkpoint commits and the diff's file count so an unattended run never stalls on a permission prompt. `${CLAUDE_SKILL_DIR}` is substituted in SKILL.md only; every dispatched file gets absolute paths in its prompt.
- Changing any of these files — or a project's rule files — goes through `/mise:retro`'s protocol: eligibility, then tool before prose, then a line removed for every line added.
