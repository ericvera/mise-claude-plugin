# Write Requirements

Produce `requirements.md` from the approved goals (and mocks, when present). This stage runs past the human gate: it asks nothing, records assumptions instead, and self-approves through the critic gate in `../references/interaction.md`.

## Input

Working directory: `<mise-directory>/` (from the config).

## Sources

- `goals.md` — intent, scope, and the clarifying Q&A folded in at the goals gate.
- `mocks.html` + `mocks.context.md` (full route) — the final UI state plus the Clarifying Q&A, New Concepts, and UI Tweaks Log. These are the durable record of the mock iteration; every logged tweak is a decision the requirements must reflect.
- The codebase — existing functionality the feature integrates with or must preserve.

If `requirements.md` already exists (a reopened stage), revise it against the current sources instead of regenerating.

## Writing the document

Create `<mise-directory>/requirements.md`:

- **Focus on user-facing behavior** — WHAT the system does, never HOW it's built.
- Use `REQ-<CATEGORY>-<N>` identifiers (e.g. `REQ-DIR-1`), grouped by functional area.
- MUST/SHOULD/MAY language; each requirement testable.
- Reference existing behavior that must be preserved.
- Include an **Out of Scope** section (behavior explored but deferred — mock variants that won't ship belong here).
- Include an **Assumptions** section: every non-obvious inference made where the goals/mocks were silent (edge cases, error handling, defaults).

```markdown
# Requirements

This document specifies the user-facing requirements for <feature>.

## 1. <First Major Area>

- **REQ-XXX-1:** The system MUST <requirement>.
- **REQ-XXX-2:** The system SHOULD <requirement>.

## Out of Scope

- <deferred behavior>

## Assumptions

- <non-obvious inference and the default chosen>
```

## Critic gate

Critic gate per `../references/interaction.md` — this stage's critic checks `requirements.md` against `goals.md` and the mocks for: contradictions; unaddressed goals, logged tweaks, or new concepts; untestable or missing requirements; scope drift.
