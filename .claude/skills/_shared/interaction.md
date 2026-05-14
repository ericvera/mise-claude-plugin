# Shared interaction conventions

These conventions apply to every workflow skill. Read this file at the start of any workflow skill before responding to the user.

## Verbosity

Read `Interaction style → Verbosity` from `.claude/workflow-config.md`.

- `normal` (default if unset) — explain reasoning behind suggestions and options.
- `expert` — terse. Assume an experienced developer. Skip rationale unless the user asks.

## Asking the user questions

- Ask in small chunks: **1–3 related questions per turn**. Never dump a wall of questions.
- Number each question (`1.`, `2.`, `3.`).
- Letter each question's answer choices (`a.`, `b.`, `c.`).
- Put each lettered option on its own line (one option per line, not inline).
- This lets the user reply with a compact form like `1a,2c,3a`.

Example:

```
1. Where should X live?
   - a. Inside foo.py
   - b. As a new module bar.py
   - c. Inline in the caller

2. Should we add tests?
   - a. Yes
   - b. No
```

## Recommendations

Always end your numbered/lettered questions with a recommendation line so the user can accept your read in one reply. If you're genuinely torn, still pick one and say so.

- `expert` mode — recommendation only, single line:

  ```
  Recommend: 1a, 2a, 3c
  ```

- `normal` mode — one line per answer with a brief reason:

  ```
  Recommend:
  - 1a — keeps the change scoped to the existing module
  - 2a — tests already cover this path
  - 3c — inline keeps the diff small
  ```

## Other lists

For any list the user might pick from or refer back to, use numbered items (`1.`, `2.`, `3.`) — not bullets — so they can respond by number.
