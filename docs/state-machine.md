# Workflow state machine

Precise semantics of `.workflow-state` and the state engine at [skills/next/scripts/state.ts](../skills/next/scripts/state.ts). The engine (Node 24+, which executes TypeScript directly) is the single reader/writer of state files; this document is its specification, for maintainers and as the reference behind `state.test.ts`. The workflow itself never applies these rules by hand — it acts only on the engine's reports.

## Engine commands

All commands print a JSON report. `<mise-directory>` is the workflow's single working directory, from the config.

| Command                                                                   | Effect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node state.ts report <mise-directory>`                                   | Answers whether work is in flight: `in_flight: false` (directory missing or empty — nothing else is reported) or `true`. One piece of work runs at a time, and the mise directory is the only place it can live. When work is in flight, also verify every approval hash, compute `next_action`, and report what a `--write` run would persist. Read-only.                                                                                                                                                                                                            |
| `node state.ts report <mise-directory> --write`                           | Same, and persist: initialize the state file on a fresh start, apply the mismatch cascade.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `node state.ts approve <mise-directory> goals route=full\|direct\|bugfix` | Hash `goals.md` and record the approval and the route in one write — a goals approval without a route is unrepresentable. Re-approving with a different route re-records it.                                                                                                                                                                                                                                                                                                                                                                                          |
| `node state.ts approve <mise-directory> <stage>`                          | Hash the stage's artifact and record the approval (mock, requirements, plan — the route argument accompanies only goals). A **changed re-approval** (new hash differs from the recorded one) deletes every later stage's approval. A plan approval whose hash doesn't match the recorded one also clears `implementation_plan/done/` (below).                                                                                                                                                                                                                         |
| `node state.ts approve <mise-directory> acceptance`                       | Record the user's acceptance confirmation as `accepted`. The hash covers every route stage's artifact hash plus the sorted `done/` filenames, so any later doc edit or task change makes it stale and the pass re-runs. Fails unless every route stage is validly approved and every Task Index ID is done. The record is also deleted outright (`accepted_cleared`) whenever a report observes a doc mismatch or an approval records a different hash than before — so reverting a doc to its approved bytes can never resurrect an acceptance for re-executed work. |

## State file format

JSON:

```json
{
  "route": "full",
  "approved": {
    "goals": "a1b2c3…",
    "requirements": "d4e5f6…"
  }
}
```

`route` (`full` | `direct` | `bugfix`) is recorded by the goals approval and omitted until then. `approved` maps each stage to the SHA-1 of its artifact at approval time and is omitted while empty. An optional `accepted` field holds the acceptance-confirmation hash (below) and is omitted until the user confirms the acceptance checklist. That is the whole file — task completion lives in `implementation_plan/done/` (below), and there is no other completion field: the mise directory's existence is what marks work in flight, and the cleanup that finishes the work deletes the directory outright.

## Routes, stages, artifacts, hashes

The **route** decides which stages participate. It is recorded atomically with the goals approval, so it can never be lost while goals is approved; before that approval, unset behaves like `direct` (goals is first in every route, so nothing branches on it earlier).

| Route  | Stages                                         |
| ------ | ---------------------------------------------- |
| full   | goals → mock → requirements → plan → (execute) |
| direct | goals → requirements → plan → (execute)        |
| bugfix | goals → plan → (execute)                       |

| Stage        | Artifact(s)                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------- |
| goals        | `goals.md`                                                                                    |
| mock         | `mocks.html` + `mocks.context.md` (both)                                                      |
| requirements | `requirements.md`                                                                             |
| plan         | `implementation_plan/00_overview.md` (only this file — task-file edits never reopen the plan) |

`goals` and `mock` are produced and approved together at the single human gate; they remain separate approval entries so an edit to either one cascades independently. Hash = SHA-1 hex of the artifact bytes; for `mock`, of the concatenation `mocks.html` then `mocks.context.md` (equivalent to `cat mocks.html mocks.context.md | shasum`). A missing artifact — for mock, either file — makes a recorded approval a **mismatch**, never an error.

## The done directory

A task is done exactly when its file has been moved to `<mise-directory>/implementation_plan/done/` — the execute stage moves it there and commits, e.g. `mise: task 01_02 done`. IDs are the exact leading `NN_NN` of filenames; the report matches them literally against the Task Index of `00_overview.md`.

`done/` is scoped to **one approved plan version**. It survives only a plan approval whose hash matches the recorded one (a resume of the same plan); any other plan approval — a changed re-approval, or a re-approval after an upstream cascade dropped the entry — deletes it (reported as `cleared_done`). A revised plan is written against the current repository, where completed work already lives, so its tasks are all pending by definition; git keeps the deleted files' history. A `done/` file whose ID is not in the current Task Index is ignored — a stale entry can delay work, never skip it.

## Computing `next_action`

Evaluated in order:

1. **Mismatch cascade.** An approval is valid exactly when recomputing the hash reproduces the recorded value. The _first_ mismatch means that doc changed after approval: delete every LATER stage's approval — even hash-valid ones, since they were reviewed against the old doc (reported as `reopened`). The mismatched stage keeps its own stale entry; its gate uses it to detect a changed re-approval. A stage with NO entry was simply never approved: it blocks as the next stage but deletes nothing.
2. The next stage is the **first stage in the route not validly approved** → `stage:<name>`. Artifact existence is never approval (a deleted `00_overview.md` just makes `plan` the next stage, and the stage rebuilds it).
3. All doc stages approved → compare `done/` against the Task Index: tasks remaining → `stage:execute` with `tasks_done` and `tasks_remaining`; every index ID done → `acceptance`, or `close_out` when `accepted` matches the current acceptance hash (every route stage's artifact hash plus the sorted `done/` filenames — any doc or task change invalidates a recorded acceptance).

`acceptance` triggers the workflow's **acceptance pass and close-out**: the finished work is checked against its docs; the user's confirmation is recorded as `accepted` (`approve … acceptance`), then the workflow runs its close-out retrospective (user-adopted guidance edits land as ordinary commits — the engine is not involved), deletes the mise directory (artifacts, plan, state file — all of it) and commits the deletion, and finally ships per the config's `Ship` value. Artifacts are committed to the feature branch at every checkpoint so any checkout can resume the work, but they never reach the merged history — the code, tests, and git log are the durable output. An interrupted close-out (crash anywhere between the user's confirmation and the deletion) resumes from the record: the next run reports `close_out`, and the retrospective and cleanup finish without re-running the pass.

The `accepted` record is deliberately conservative: its hash covers every task-shaped filename in `done/` — even stray ones the task gates ignore — so it can over-invalidate but never under-invalidate; and it covers only the mise directory, so post-confirmation commits to the branch itself do not invalidate it.

## Missing or broken state file

The engine never rebuilds state by inference — the user decides between git's copy and a fresh start.

- **Fresh start**: state file missing and the directory holds at most `goals.md` (no later-stage artifacts, no `implementation_plan/`) → initialize empty state (`file: "new"`; `--write` persists it).
- **Anything else** — state file missing with later artifacts present, unparseable JSON, or any semantic deviation (unknown fields, invalid route or hash, a goals approval without a route) → every command errors, naming the user's two options: restore `.workflow-state` from the last `mise:` checkpoint commit (every state change is committed, e.g. `git checkout <mise-directory>/.workflow-state`), or delete the mise directory to abandon the work and start over.

## Concurrency

Each engine invocation is a single read → single write, but there is no locking across invocations: never point two sessions at the same mise directory.
