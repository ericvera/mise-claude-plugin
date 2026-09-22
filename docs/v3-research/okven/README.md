# Proposed okven change

Draft only. Nothing here is applied to `/Users/eric/Code/okven`.

## Copy, in this order

1. `adherence/tests.md`, `adherence/comments.md`, `adherence/vocabulary.md` → okven `.claude/adherence/`. Prune first (below).
2. `mise-config.md` → the fenced block replaces okven `.claude/mise-config.md`. It points `## Adherence` at the three paths from step 1, so step 1 comes first. Read "Sections the v3 reference does not define" before pasting.
3. `eslint-additions.md` → `eslint.mise-rules.mjs` (new, repo root), the two config objects into `eslint.config.mjs`, `scripts/lint-ratchet.ts` (new), the `ci:lint` line in `package.json`. Then `node scripts/lint-ratchet.ts --record` once and commit `.lint-ratchet.json`.
4. `.claude/mise-checklist.md` is left in place. v3 removes the `Checklist:` config key, so nothing reads it after step 2.

## Prune before copying

The example files are the full evidence set, not a shipping doc. Cut them to what you still care about:

- **Drop whole sub-patterns you have stopped seeing.** T1d has one note and no recoverable code. D6 has one. T11 is eval-only. Each deletion removes an id the `adherence` role can cite, which is the point.
- **Cut to three notes per sub-pattern.** Four to six are given so you can pick; more than three is repetition for the reader.
- **Settle the two live contradictions** rather than shipping both sides. (a) CLAUDE.md:139 says snapshot `mock.calls` whole, but the accepted fix in `classifyContent.test.ts` snapshots `mock.calls[0]` — one of them has to change, and the lint rule with 974 hits depends on which. (b) doc-style rule 15 blesses `// Verify:` lists, rule 12 caps inline comments at 2 lines, and 271 wrapped `// Verify:` comments sit in the gap.
- **`vocabulary.md` names `docs/design/naming.md` as the glossary, and that file covers verbs only.** Most flagged terms are nouns. Either add a noun section to naming.md or accept that the "existing code" grep carries nouns alone.
- **Keep the verbatim notes verbatim.** Typos included. They are what makes a finding land as your own words rather than a rule restated.
