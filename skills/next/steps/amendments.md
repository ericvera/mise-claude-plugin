# Amendments

An owner statement that changes a decision already recorded in `goals.md` or `spec.md` is appended to `spec.md`, or to `goals.md` when there is no spec, under `## Amendments`:

```
- <date> <what changed> — <why> — tasks: <new or affected ids>
```

Then re-answer the skip conditions in `02-goals.md`. A skipped step whose condition no longer holds → `unskip .mise <step>`. Unless the spec step was just unskipped (its planner writes them), spawn a `planner` with the amendment as `Amendment:` to write its task files. Then `amend .mise`, adding `--critic` when there is a spec and the planner reports a `## Hard-to-undo` item it wrote. Nothing is re-approved, and no other amendment goes to the critic except through an unskipped spec.

Read `## Amendments` only when re-answering skip conditions and when writing `review.md`.
