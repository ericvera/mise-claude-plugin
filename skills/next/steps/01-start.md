# Start

1. Write the owner's description verbatim to `.mise/goals.md`, then `report .mise --write` to open the run. Its `base` is the branch the work merges into.
2. `git fetch origin <base>`, then pick the branch from `git branch --show-current`. On `<base>`, `git switch -c fix/<slug>` for a bug fix (work that corrects existing behavior) or `feat/<slug>` otherwise, `<slug>` a kebab-case slug of the work. On any other branch that has no commits past `origin/<base>` and one of those two shapes, use it without asking. Otherwise, ask whether to use the current branch or to branch from it.
3. Commit.
