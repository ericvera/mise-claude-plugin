# Transcript digester (`digest-transcript.mjs`)

Deterministic, dependency-free digest of one Claude Code session. Streams line by
line (`readline`), never buffers a file. Candidate for v3's run ledger.

```
node digest-transcript.mjs <session.jsonl> [--out file.json] [--pretty]
node run-digests.mjs [--projects-root ~/.claude/projects] [--out ../runs]
bash crosscheck-digest.sh <session.jsonl>     # independent jq/awk recount
```

Run on 2026-09-19 against Claude Code transcripts written by versions 2.1.190 –
2.1.276.

## On-disk layout (discovered, not assumed)

| Path                                                        | What                                                      | Count on this machine |
| ----------------------------------------------------------- | --------------------------------------------------------- | --------------------- |
| `~/.claude/projects/<encoded-cwd>/`                         | one dir per cwd; `/` and `.` → `-`                        | 49 dirs               |
| `<project>/<sessionId>.jsonl`                               | main thread, `isSidechain:false` on every row             | 106                   |
| `<project>/<sessionId>/subagents/agent-<agentId>.jsonl`     | one file per subagent, every row `isSidechain:true`       | 2126                  |
| `<project>/<sessionId>/subagents/agent-<agentId>.meta.json` | `{agentType,description,toolUseId,spawnDepth,model}`      | 2121                  |
| `<project>/<sessionId>/tool-results/<id>.txt`               | offloaded large tool output; **not read** by the digester | 39 dirs               |
| `<project>/<sessionId>/workflows/`                          | workflow-tool scratch; not read                           | 3 dirs                |
| `<project>/memory/*.md`, `<project>/sessions-index.json`    | not transcripts                                           | —                     |

Findings that drive the code:

- **No sidechain rows live in the main file.** `grep -c '"isSidechain":true'` over
  every `<project>/*.jsonl` is 0. Subagent turns are only ever in
  `subagents/agent-*.jsonl`. Older `Task`-named tool blocks do not occur in this
  corpus; the subagent tool is named `Agent` throughout.
- **Subagent nesting is real and flat on disk.** In
  `okven-worktrees-feat-specials-fixes/19d0c3b2…`, `meta.json` `spawnDepth` is
  `{1:115, 2:52, 3:1}` — 115 main-thread `Agent` blocks but 168 transcript files,
  all in one directory. A depth-2 agent has no row in the main file; it is found
  only by reading the directory.
- **One API response is written as several JSONL rows**, one per content block,
  all sharing `message.id`. In subagent files those rows carry _progressive_
  usage (e.g. `output_tokens` 4 then 111 for the same `message.id`). The only
  correct roll-up is **max per `message.id`, then sum per model** — summing rows
  triples the count, taking the first row undercounts output by ~70%.
- **`origin` is the human-turn discriminator, and it is version-dependent.**
  Builds from ~2.1.237 stamp `origin.kind` = `human` | `task-notification` |
  `peer`. Older rows have no `origin`. Scored on 1366 origin-stamped human turns
  across 76 sessions, "not a synthetic marker" reproduces `origin.kind==='human'`
  with **0 misses**; its only false positives were `<task-notification>` blocks,
  which the marker list excludes. Skill-body injections after a slash command
  carry `isMeta:true` and share the command's `promptId`.

## Digest schema (v1)

| Field                 | Meaning                                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source`              | `{path, bytes, projectDir, sessionId}`                                                                                                                                                                                                                                                                                                          |
| `session`             | `sessionIds[]`, `cwds[]`, `gitBranches[]`, `versions[]`, `entrypoints[]`, `start`/`end` (min/max timestamp over **all** rows), `wallMs`, `lines`, `parseErrors`, `entryTypes{}`                                                                                                                                                                 |
| `wall`                | `modelMs`, `toolMs`, `toolMsByTool{}`, `humanWaitMs`, `humanWaitMsCapped30m`, `longestHumanWaitMs`, `windowStart`/`windowEnd`, `eventsCounted`, `outOfOrderEvents`                                                                                                                                                                              |
| `tokens`              | `main.byModel{model:{input,cacheRead,cacheCreate,output,thinking,requests}}`, `main.total`, `subagents.byModel`, `subagents.total`, `combined`                                                                                                                                                                                                  |
| `subagents[]`         | `{ts, toolUseId, agentId, description, subagent_type, requestedModel, resolvedModel, spawnDepth, runInBackground, isAsync, status, durationMs, tokens, toolUses, toolStats, promptChars, promptHead200, resultChars, miseRole, miseArtifactKind, miseVersion, transcript{file,lines,start,end,wallMs,tokens,byModel,toolCounts,agentToolUses}}` |
| `subagentSummary`     | `records`, `mainThreadSpawns`, `transcriptFiles`, `bySpawnDepth`, `byType`, `byResolvedModel`, `byMiseRole`, `totalDurationMs`                                                                                                                                                                                                                  |
| `skills[]`            | `{ts, skill, toolUseId}` from `Skill` tool blocks                                                                                                                                                                                                                                                                                               |
| `slashCommands[]`     | `{ts, name, argsChars, argsHead200}` from `<command-name>` in human turns                                                                                                                                                                                                                                                                       |
| `userMessages[]`      | `{ts, chars, head300, slash, confidence, gapBeforeMs}`; `chars`/`head300` exclude `<ide_opened_file>`, `<ide_selection>`, `<system-reminder>` wrappers                                                                                                                                                                                          |
| `mise`                | `{invoked, versions[], stateCalls[{ts, durationMs, chainIndex, chainLength, command, subcommand, miseDir, stage, route, miseVersion, report}]}`                                                                                                                                                                                                 |
| `compactions[]`       | `{ts, kind:'boundary', trigger, preTokens, durationMs}` and `{ts, kind:'summary-message', chars}`                                                                                                                                                                                                                                               |
| `apiErrors[]`         | `{ts, code, message, retryAttempt, maxRetries, retryInMs, source}`                                                                                                                                                                                                                                                                              |
| `permissionDenials[]` | `{ts, kind, tool, head}` — `kind` is `user-rejected` \| `interrupted` \| `automode-blocked`                                                                                                                                                                                                                                                     |
| `toolCounts`          | `{byTool{}, total}` — main thread; per-subagent counts live in `subagents[].transcript.toolCounts`                                                                                                                                                                                                                                              |
| `commandRuns[]`       | test/lint/typecheck/build Bash runs, main thread **and** inside every subagent: `{ts, thread, kinds[], command, durationMs, background, isError, exitCode, exitMasked, failSignals[], pass, interrupted}`                                                                                                                                       |
| `crosscheck`          | `agentToolUseBlocks`, `agentResultsWithAgentId`, `subagentTranscriptFiles`, `orphanTranscriptFiles`, `uniqueAssistantMessageIds`, `unresolvedToolUses`, `timelineWindowMs`, `wallPartitionResidualMs`, `untimelinedEdgeMs`                                                                                                                      |

### Wall-clock split

Four row kinds are timeline events: `assistant`, a user row carrying a
`tool_result`, a **real** user message, and `system/api_error`. The gap before
each event is charged to `modelMs` (assistant, api_error), `toolMs`
(tool_result), or `humanWaitMs` (real user message). Every other row type
(`attachment`, `queue-operation`, `file-history-snapshot`, `isMeta` injections,
`task-notification`, hook `system` rows) is ignored, so its elapsed time is
absorbed into the bucket of the next real event. The three buckets therefore sum
exactly to `windowEnd - windowStart`; `crosscheck.wallPartitionResidualMs` is 0
on all 99 sessions digested.

## Validation

Each session digested, then recounted by `crosscheck-digest.sh`, which shares no
code with the digester (jq + awk, max-per-`message.id` implemented separately).

| Session                                                                     | Bytes      | Metric                                                           | Digest                                               | Independent                               |
| --------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| `okven-worktrees-feat-specials-fixes/19d0c3b2` (largest okven worktree)     | 40,146,646 | main tokens `claude-fable-5` reqs/in/cacheRead/cacheCreate/out   | 2114 / 4217 / 1,068,591,382 / 7,667,511 / 1,682,402  | identical                                 |
|                                                                             |            | main tokens `claude-opus-5`                                      | 1173 / 2346 / 649,047,193 / 5,457,530 / 881,472      | identical                                 |
|                                                                             |            | subagent tokens `claude-opus-5`                                  | 5914 / 11,828 / 695,552,432 / 17,625,777 / 2,457,764 | identical                                 |
|                                                                             |            | subagent tokens `claude-fable-5` / `sonnet-5` / `haiku-4-5` reqs | 735 / 896 / 229                                      | 735 / 896 / 229                           |
|                                                                             |            | main-thread `Agent` blocks                                       | 115                                                  | 115                                       |
|                                                                             |            | subagent transcript files                                        | 168                                                  | 168                                       |
|                                                                             |            | user messages                                                    | 245                                                  | 241 origin-stamped + 4 legacy slash = 245 |
|                                                                             |            | slash commands / compactions / api errors / denials              | 28 / 4 / 4 / 7                                       | 28 / 4 / 4 / 7                            |
|                                                                             |            | mise `state.ts` invocations                                      | 28                                                   | 16 report + 11 approve + 1 help = 28      |
| `okven-worktrees-feat-backfill-order-history/840b8b0a` (mid, full mise run) | 2,305,472  | main tokens `claude-fable-5`                                     | 220 / 439 / 40,202,494 / 1,146,851 / 130,982         | identical                                 |
|                                                                             |            | subagent tokens, 4 models                                        | fable 183, opus 274, sonnet 133, haiku 39 reqs       | identical                                 |
|                                                                             |            | `Agent` blocks / transcripts / results-with-agentId              | 25 / 25 / 24                                         | 25 / 25 / 24                              |
|                                                                             |            | user messages / slash / state.ts                                 | 15 / 3 / 12                                          | 14+1 / 3 / 5 approve + 7 report = 12      |
| `mise-claude-plugin/6d4675b6` (small)                                       | 42,488     | main tokens `claude-fable-5`                                     | 4 / 8 / 101,787 / 11,279 / 1557                      | identical                                 |
|                                                                             |            | subagents / users                                                | 0 / 1                                                | 0 / 1                                     |
| `metaforico/c17bccb1` (other project)                                       | 21,683,985 | main tokens `claude-fable-5`                                     | 242 / 484 / 80,971,619 / 540,291 / 375,756           | identical                                 |
|                                                                             |            | subagent tokens `claude-opus-5`                                  | 15 / 30 / 675,548 / 75,134 / 3526                    | identical                                 |
|                                                                             |            | users / slash / state.ts / subagents                             | 44 / 1 / 4 / 1                                       | 44 / 1 / 4 / 1                            |

Span (`start`/`end`) matched the independent min/max timestamp on all four.
`wallPartitionResidualMs` = 0 on all four.

Two bugs were found _by_ this cross-check and fixed: first-row-wins token
accounting (undercounted subagent output by 40–70%), and a non-global regex that
missed the second `state.ts` invocation in a chained Bash call.

### Second, adversarial validation (2026-09-20, different author)

The table above was written by the digester's own author, so a second pass
recounted **two mise sessions the author had not used**, with a script
(`recount-independent.mjs`, `node recount-independent.mjs <session.jsonl>`) that
shares no code with `digest-transcript.mjs` (max-per-`message.id` and the
wall-clock partition reimplemented from the raw rows, not from the digester):

| Session                                                                               | Metric                                                                                                                                     | Digest                                           | Independent recount                                                                                    |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `okven-worktrees-eric-attribution-3/70362e9f` (13.0 MB, 296 subagents — the 50+ case) | main tokens `claude-fable-5-1` reqs/in/cacheRead/cacheCreate/out                                                                           | 650 / 12,156 / 257,866,303 / 5,634,518 / 528,582 | identical                                                                                              |
|                                                                                       | subagent tokens, 4 models + `<synthetic>` (opus 8440 reqs / 5,063,834 out; fable 1047 / 844,070; haiku 1545 / 352,495; sonnet 48 / 14,144) | as listed                                        | identical on every field                                                                               |
|                                                                                       | main-thread `Agent` blocks / transcript files / `meta.json` spawnDepth                                                                     | 183 / 296 / `{1:183, 2:113}`                     | 183 / 296 / `{1:183, 2:113}`                                                                           |
|                                                                                       | `toolMs`                                                                                                                                   | 104,925,692                                      | identical                                                                                              |
|                                                                                       | user messages                                                                                                                              | 60                                               | 60 `origin.kind==='human'` (+4 rejected: 3 `[Request interrupted by user]`, 1 compaction-continuation) |
|                                                                                       | `modelMs` / `humanWaitMs`                                                                                                                  | 57,607,961 / 187,807,228                         | 57,507,357 / 187,911,204 — the whole 104 s difference is those 4 rows                                  |
| `okven-worktrees-fix-voice-note-not-transcribed/d36c38e4` (6.5 MB, 30 subagents)      | main + subagent tokens, all models                                                                                                         | as digested                                      | identical on every field                                                                               |
|                                                                                       | `Agent` blocks / transcript files / meta                                                                                                   | 30 / 30 / `{1:30}`                               | 30 / 30 / `{1:30}`                                                                                     |
|                                                                                       | `modelMs` / `toolMs` / `humanWaitMs`                                                                                                       | 2,585,166 / 16,805,173 / 76,125,551              | identical                                                                                              |
|                                                                                       | `humanWaitMsCapped30m`                                                                                                                     | 14,400,766                                       | 14,400,770 (4 ms; first-event edge)                                                                    |
|                                                                                       | user messages                                                                                                                              | 12                                               | 12 (+1 rejected `[Request interrupted by user for tool use]`)                                          |

**Verdict: no digester bug found; no re-run needed.** The only disagreements were
the recount's own false positives on non-prompt user rows, which
`SYNTHETIC_USER_TEXT` correctly excludes.

Two things the doc above understates, confirmed on `70362e9f`:

- **The main file also repeats `message.id` across rows** (285 of 655 ids), not
  only subagent files. There the repeats carry the _final_ usage on every row, so
  max-per-id equals last-per-id; summing rows would have inflated main output from
  528,582 to 870,784 (+65%). The digester is right either way; the README only
  claimed progressive usage for subagent files.
- **`subagents[].tokens` is not the subagent's cost.** It comes from the `Agent`
  `tool_result` and reports a single request (e.g. 1 request / 506 output) where
  `subagents[].transcript.tokens` reports the real 17 requests / 18,109 output.
  Anything costing subagents must read `transcript.tokens` / `transcript.byModel`;
  `tokens.subagents.byModel` already does.

### Corpus drift — do not re-run the batch blind

Between 2026-09-19 (digest batch) and 2026-09-20, **6 of the 43 mise sessions lost
their raw transcript**. Three whole project directories are gone from
`~/.claude/projects` (`…-feat-backfill-order-history`,
`…-feat-migrate-firebase-kit`, `…-feat-remove-backfill-order-history`); three more
sessions are gone from surviving directories (`aydy/9026fc28`,
`delta-review/b0a2d712`, `…-eric-attribution-3/528f8358`).
`runs/digests/**` is now the only record of them. Re-running `run-digests.mjs`
would silently drop those sessions, which is why the batch was left as it stands.

### Notes for consumers (found while building `run-costs.mjs`)

- **`session.sessionId` in a digest is not always the transcript's file name.** For
  example the digest `…fix-menu-pin/e5dc5db1-f7f5-…json` describes
  `e5dc5db1-9f97-….jsonl`. Join on `source.path`, never on the digest file name.
- **One agent can have several `subagents[]` records** — one per main-thread `Agent`
  block, and a resumed agent is dispatched more than once against one transcript.
  73 of 2017 records in the mise corpus (3.6%, 36 agents) are such repeats, and only
  one of them carries `transcript.tokens`. Summing records triples one 201-minute
  implementer in `eric/attribution-3`. Collapse by `agentId` before costing.
- **`miseRole` is null for 263 of the depth-1 general-purpose spawns in mise
  sessions**, almost all from mise 1.x, whose prompts inlined the role text ("You
  are a fresh-context critic …") instead of citing `roles/<role>.md`, or cited
  `stages/execute.md`. `run-costs.mjs` `classifyRole` adds those fallbacks.
- **`commandRuns[].kinds` has a ~17% false-positive rate on this corpus.** The
  classifier segments on `|` without stripping quotes, so
  `pgrep -lf "…(vitest|eslint)"` is scored as a `lint` run (43 times in one run
  alone). Re-classifying the stored 200-char prefix with quoted strings removed
  first drops 9025 digest gate rows to 7478. `run-costs.mjs` reports both.
- **`commandRuns[].command` is truncated to 200 characters**, so two long commands
  sharing a prefix are indistinguishable — relevant to any "same command re-run"
  measure.

## Batch output

`run-digests.mjs` over project dirs matching `okven*`, `delta-review`,
`metaforico`, `aydy`, `firebase-kit`, `ericvera-dev`, `originhypnosis`,
`mise-claude-plugin`: **29 dirs, 99 sessions, 0 failures, 0.58 GB read in 7.5 s,
860 MB peak RSS** (dominated by the single 146.6 MB session).

- `../runs/digests/<project-dir>/<sessionId>.json` — full digests (7.1 MB)
- `../runs/transcript-index.jsonl` — one row per session with `path, bytes,
lines, start, end, wallMs, branches, cwds, ccVersions, miseInvoked,
miseVersions, miseStateCalls, subagentCount, subagentMainThreadSpawns,
subagentBySpawnDepth, subagentByMiseRole, subagentTotalDurationMs,
tokensMainByModel, tokensSubagentByModel, tokensCombined, modelMs, toolMs,
humanWaitMs, humanWaitMsCapped30m, longestHumanWaitMs, userMessageCount,
slashCommands, skillInvocations, toolCallTotal, commandRunCount,
commandRunFailures, compactions, apiErrors, permissionDenials, warnings`

## Known limitations

1. **Permission-prompt wait is charged to `toolMs`.** The transcript records no
   "prompt shown" event, so time a tool spent blocked on the user's approval is
   indistinguishable from time it spent running.
2. **Parallel and background work overlaps.** `toolMs` is a partition of wall
   clock, not a sum of tool durations: several tools in one assistant message,
   background Bash (`backgroundTaskId`), and async agents (`isAsync`) run
   concurrently. `commandRuns[].durationMs` is `null` for background runs, and
   `subagents[].durationMs` for an async agent comes from its transcript span.
3. **Gate pass/fail is often undeterminable.** Exit codes appear only as
   `Exit code N` in an errored `tool_result`. Commands that pipe to `tail`/`head`
   or append `; echo "exit: $?"` mask `$?`; those are reported as
   `pass:null, exitMasked:true`. On the largest session 1240 of 1473 gate runs
   are `pass:null`. `failSignals` (`tsError`, `eslintProblems`, `vitestFailed`,
   `jestFailed`, `explicitExitNonZero`) is the only evidence there.
4. **No mise "iteration" counter exists.** `skills/next/scripts/state.ts` emits
   `in_flight`, `file`, `route`, `stages{verdict,recorded,current}` and
   `next_action` only. Critic/reviewer rounds are inferable only from repeated
   `Agent` spawns whose prompt cites the same `roles/<role>.md`.
5. **`miseRole` needs the prompt.** It is parsed from `/roles/<role>.md` in the
   `Agent` prompt, so depth-2+ agents (no main-thread row, no stored prompt) and
   resumed agents report `miseRole: null`.
6. **Not every spawn yields a usable result row.** Largest session, 115
   main-thread spawns: `completed` 101, `async_launched` 9 (the `tool_result`
   records only the launch — duration and tokens come from the transcript),
   `user-rejected` 4, `no-result` 1; plus 53 records reconstructed from
   transcript + `meta.json` alone (`transcript-only`, the depth-2/3 agents).
7. **`<synthetic>` appears as a model.** Harness-authored assistant rows carry
   `model:"<synthetic>"` and zero usage; they are counted as requests.
8. **Session identity is not the file.** `session.sessionIds` can hold more than
   one id, branches can change mid-file (`HEAD` shows for detached worktrees),
   and one long-lived session spanned 2026-06-24 → 2026-09-19.
9. **Only same-directory subagents are found.** A subagent whose transcript was
   written under a different project dir (none observed) would be missed.
10. **`tool-results/*.txt` sidecars are not read**, so a tool result offloaded to
    disk contributes no `stdout` to gate-signal detection.

---

# Run-cost joiner (`run-costs.mjs`)

Joins the digests to mise runs and emits the cost side of the v3 scorecard.

```
node map-runs.mjs <repo> --out ../runs/other-runs   # once per non-okven repo
node run-costs.mjs [--root ../runs] [--no-md]
```

Inputs: `runs/digests/**`, `runs/okven-runs.jsonl`, `runs/other-runs/*-runs.jsonl`
(the same `map-runs.mjs`, run read-only against aydy, delta-review, ericvera.dev,
firebase-kit, metaforico, mise-claude-plugin, originhypnosis — 28 more runs), and
the raw main + subagent transcripts, streamed. `runs/other-runs/` is this tool's own
copy of those `map-runs.mjs` outputs, so the join is reproducible regardless of what
else lands in `runs/`.

Outputs: `runs/run-costs.jsonl` (one row per run) and `runs/run-costs.md`
(`run-costs-md.mjs` renders it; tables only).

What it reads from raw that the digest does not carry: per-timestamp main-thread
token usage (for driver tokens per stage), `Read`/`Bash` paths (mise skill-file
reads), `.mise/` file writes and touches (span bounding), and per-thread edit
timestamps (gate re-run detection). Recomputed driver output tokens match the
digest's `tokens.main` to within the out-of-span remainder (0–3% per run) and
subagent output matches exactly.

The session→run join, the mise-span bounding rule and the stage-assertion order
are documented in the header comment of `run-costs.mjs`; the caveats that survive
into the numbers are listed at the top of `runs/run-costs.md`.

---

# Gate accounting (`gate-outcomes.mjs` → `gate-findings.mjs` → `gate-classify.mjs` → `gate-value.mjs`)

What each mise gate cost and what it caught, from the subagent transcripts. Run
in order; each step rewrites the file the next one reads.

```
node gate-outcomes.mjs [--projects-root <dir>] [--canonical-root ~/.claude/projects]
node gate-findings.mjs      # adds `verdict`/`findingCount` to gate-outcomes.jsonl
node gate-classify.mjs      # adds `outcome`/`substance`, merges ../runs/gate-findings-hand.jsonl
node gate-value.mjs         # writes ../runs/gate-value.md
node gate-sample.mjs --gate critic-plan --per 45   # blind sample for hand classification
```

**Read from a frozen copy.** Claude Code's 30-day transcript retention deleted 177
subagent transcripts _during_ the 2026-09-20 run (they were present in the
2026-09-19 digests). Snapshot first, then pass `--projects-root <snapshot>`;
`transcript` is rewritten back to the canonical `~/.claude/projects/...` path.

| Output                             | One row per                   | Key fields                                                                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `../runs/gate-outcomes.jsonl`      | subagent run (1894)           | `role`, `roleBasis`, `gate`, `kind`, `target`, `round`, `roundInBranch`, `models`, `tokensTotal`, `tokensByModel`, `durationMs`, `prompt`, `finalMessage` (verbatim for every role-resolved run), `nextSpawns[]`, `driverEditsAfter`, `verdict`, `findingCount` |
| `../runs/gate-findings.jsonl`      | finding (2344)                | `session`, `gate`, `target`, `round`, `severity` (as stated), `findingText` (verbatim), `verdict`, `outcome`, `substance`, `*Source`, `extractionBasis`                                                                                                         |
| `../runs/gate-findings-hand.jsonl` | hand-classified finding (190) | `findingId`, `substance`, `note` — read by `gate-classify.mjs`, overrides the script                                                                                                                                                                            |
| `../runs/driver-edits.jsonl`       | main-thread Edit/Write        | `ts`, `file`, `text` (first 12 kB written) — the evidence that a critic finding was answered                                                                                                                                                                    |
| `../runs/gate-value.md`            | —                             | the tables                                                                                                                                                                                                                                                      |

## Role resolution

Cascade, most specific first: `roles/<role>.md` in the prompt (2.0.0+ template) →
`stages/implement_task.md` / `stages/retrospective.md` (1.x) → self-describing
prose ("a fresh-context critic", "acceptance verifier") → gate-run prose
("end-of-plan gate", "sanity-e2e"). 1173 of 1894 resolve; the 721 that do not are
driver-authored helper agents (exploration, citation sweeps, design passes,
browser verification), 79 of which cite a `.mise/` path.

## Known limits

1. **Finding splitting is imperfect.** Gate reports interleave findings with the
   verification behind them. Hand sample: 9–30% of extracted rows per gate are
   verification prose, carried as `substance: unclear`.
2. **Script-vs-hand agreement on `substance` is 52% (98/190).** Treat the
   full-corpus substance columns as indicative; the reweighted hand sample in
   `gate-value.md` table 8 is the measurement.
3. **`outcome` is token-overlap evidence, not causation.** `no-visible-response`
   is an upper bound on "ignored"; `rejected-by-driver` is a floor, because the
   driver usually rejects silently and critics have no fix dispatch to reject in.
4. **The end-of-plan gate mostly runs in the driver's thread.** Only its delegated
   e2e/sanity/quality runs appear here (94 runs).
