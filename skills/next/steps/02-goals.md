# Goals

1. `goals.md` has no `## Investigation` yet → spawn an `investigator` on it, and write its report there under `## Investigation`.
2. Read `goals.md` for contradictions, unstated assumptions, and scope the description leaves open. Each point that needs the owner's call becomes a question below, and so do the repro steps of a bug the investigator could not reproduce. Everything else becomes an edit to `goals.md`.
3. A question remains → write it to `goals.md` under `## Open questions`, then ask one round at a time, in SKILL.md's question format. Ask about the owner's calls, the edge cases and error behavior the spec would otherwise have to guess at, and what is out of scope.
4. Fold the answers into `goals.md`, clearing `## Open questions`, and record under `## Assumptions` every inference you made instead of asking. A bug fix's `goals.md` also records the repro steps, the expected behavior, and where its regression test goes.
5. The config's Mock conditions match and `.mise/mock/` does not exist yet → spawn a `mock` on `.mise/mock/`. Record what it had to guess under `## Assumptions`. The owner's feedback on the mock goes to a new `mock` as `Feedback:`, and the proposal below is printed and asked again.
6. Answer the skip conditions below. Write at most 3 lines to `goals.md` under `## Proposal`, covering the issue, the fix or approach you propose, and what the run will skip. Print them with the path of the mock's `index.html` when there is one, and ask "Approve, or what should change?" Feedback, questions and silence are not approval. On approval, `mark .mise <step> skipped` for each skip `## Proposal` names, then `mark .mise goals done`.

## Skip conditions

Every step runs except these:

- Skip **spec** when the work fits one implementer's context (roughly one module, no schema or API change, no new concept) and touches nothing hard to undo.
- Skip **critic** when spec is skipped.
