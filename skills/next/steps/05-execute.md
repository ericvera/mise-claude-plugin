# Execute

Before the run's first task, spawn a `runner` on the config's `Check` and `Unit tests`. A failure there stops the run. Then, one task at a time, spawn an `implementer` on the file the report's `tasks.next_file` names. When `next_file` is null and `next_id` is not, first spawn a `planner` with `Single task:` and that id. Its `Hard to undo:` report → `unskip .mise spec` and `unskip .mise critic`, so the run goes back to spec. A `Task failed:` report → stop and relay it.

When the report has `checks`, spawn its round all at once. Spawn one `reviewer` per slice. Then:

- No blocking finding → `mark .mise execute done`.
- `fix_rounds_left` above 0 → `fix .mise`, then one implementer over every blocking finding, and every defect the last fix round left unfixed (`Fix scope:` and `Defects:`), then the next round.
- No fix round left → blocking findings stop the run, surfaced. Handle the owner's reply as review feedback, by `06-review.md`, and once they accept what is left, `mark .mise execute done`.
