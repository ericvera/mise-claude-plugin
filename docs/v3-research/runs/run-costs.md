# Run costs — where time and tokens go in a mise run

Built by `tools/run-costs.mjs` from `runs/digests/**` joined to `runs/okven-runs.jsonl` + `runs/other-runs/*-runs.jsonl`.
Row source: `runs/run-costs.jsonl`.

**n for everything below: 28 runs / 42 sessions / 1926 distinct subagents (1999 Agent dispatches — a resumed agent is dispatched more than once against one transcript, so tokens and minutes are counted once per agent), 8 repos, 2026-07-31 → 2026-09-19.**
Every rate in this file rests on those 28 runs unless the table says otherwise.

Scope and known limits, so no number here is read as more than it is:

- **Bounding.** The mise part of a session is `[first mise marker, last mise marker]`, markers being `state.ts` calls, `/mise:next` and `Skill(mise:next)`, mise-role subagent spawns (and their transcript end), and main-thread tool calls that touch the run's `.mise/` directory. The rule and the stage-assertion order are written out at the top of `tools/run-costs.mjs`. Work outside the span is dropped and counted in `outside` (17 spawns in total, 0.8% of spawns).
- **6 of 42 sessions have lost their raw transcript** since the digests were taken on 2026-09-19 (whole project directories have been pruned from `~/.claude/projects`; the digest is now the only record). For those, the session-level wall split and driver tokens are booked whole to the stage `(unattributed)` — 10.1% of all active time. They are never spread over stages by guess. This is also why the digest batch was not re-run.
- **Role of a nested subagent.** 508 of 1926 subagents run at depth >= 2; each inherits the mise role of its nearest role-carrying ancestor (an Explore agent spawned by an implementer is charged to `implementer`), because that is whose work it is. Depth-1 agents the driver spawned that are not a mise role are `other`.
- **One run distorts the `goals` row.** `feat/home-page@ad5081a1f` (originhypnosis) never left goals: 44 parallel design-concept agents and 1.44M output tokens are booked to `goals` because that run recorded no `mock` approval. Excluding it, `goals` is 1.37M output (2.9% of the remaining 46.87M) rather than 5.8%.
- **Parallelism.** `modelMs`/`toolMs`/`humanWaitMs` partition wall clock and sum exactly to it, so they never double-count; but subagent `duration` sums do — several agents run at once. Read role duration as "agent-minutes", not elapsed.
- **Permission-prompt wait is inside `toolMs`** (the transcript has no "prompt shown" event), so tool time is an upper bound and human-wait a lower bound.
- **Gate commands are matched on the digest's 200-character command prefix**, so two long commands sharing a prefix count as the same command in the re-run table. Section (g) also re-classifies the digester's gate rows and reports both counts.
- 1 mise session could not be joined to a run (`mise-claude-plugin/8cec5c4e`): the branch has no surviving `.mise` lifecycle in git.
- No run in the transcript corpus has a mise **1.x** version ceiling (the one 1.6.0 session, `aydy/9026fc28`, belongs to a run that finished on 2.0.0). Every "by version" table below is therefore 2.0.0 vs 2.1.0, n=21 vs 7.

## (a) Share of tokens and of active time

Active time = `modelMs + toolMs` on the main thread inside the mise span; human-wait excluded. Output = generated tokens; Input = `input + cacheCreate + cacheRead` (cache reads dominate and are what the context window actually costs). Driver = main thread, Sub = all subagents. n = 28 runs.

### by stage

| stage          | spawns | out tok | % out | in tok  | % in  | driver out | sub out | active h | % active | wait h |
| -------------- | ------ | ------- | ----- | ------- | ----- | ---------- | ------- | -------- | -------- | ------ |
| setup          | 11     | 402k    | 0.8%  | 62.50M  | 0.5%  | 319k       | 83k     | 2.7      | 0.7%     | 32.4   |
| goals          | 57     | 2.80M   | 5.8%  | 548.43M | 4.1%  | 1.63M      | 1.17M   | 11.4     | 2.9%     | 47.6   |
| mock           | 4      | 381k    | 0.8%  | 58.72M  | 0.4%  | 324k       | 57k     | 1.8      | 0.5%     | 29.3   |
| requirements   | 150    | 3.00M   | 6.2%  | 422.93M | 3.2%  | 1.18M      | 1.81M   | 15.4     | 4.0%     | 20.0   |
| plan           | 144    | 4.85M   | 10.0% | 952.66M | 7.1%  | 1.68M      | 3.18M   | 33.2     | 8.6%     | 73.2   |
| execute        | 1396   | 31.12M  | 64.4% | 9.02G   | 67.3% | 3.18M      | 27.95M  | 256.1    | 66.1%    | 481.7  |
| acceptance     | 142    | 4.13M   | 8.5%  | 1.98G   | 14.8% | 2.05M      | 2.08M   | 25.6     | 6.6%     | 421.6  |
| retrospective  | 22     | 527k    | 1.1%  | 66.15M  | 0.5%  | 88k        | 439k    | 1.7      | 0.4%     | 9.3    |
| (unattributed) | 0      | 1.09M   | 2.3%  | 297.17M | 2.2%  | 1.09M      | 0       | 39.3     | 10.1%    | 98.8   |

### by role (subagents; `driver` = the main thread, which spawns them)

| role                 | spawns | % spawns | out tok | % out | in tok  | % in  | agent-minutes | tool calls | depth>=2 |
| -------------------- | ------ | -------- | ------- | ----- | ------- | ----- | ------------- | ---------- | -------- |
| critic               | 242    | 12.6%    | 4.55M   | 9.4%  | 657.14M | 4.9%  | 1896          | 7344       | 49       |
| implementer          | 630    | 32.7%    | 14.97M  | 31.0% | 4.33G   | 32.3% | 10681         | 27320      | 303      |
| fix                  | 154    | 8.0%     | 3.83M   | 7.9%  | 1.02G   | 7.6%  | 2718          | 9896       | 0        |
| reviewer             | 292    | 15.2%    | 4.38M   | 9.1%  | 579.14M | 4.3%  | 2209          | 8649       | 21       |
| documenter           | 166    | 8.6%     | 2.36M   | 4.9%  | 397.01M | 3.0%  | 1132          | 5450       | 16       |
| acceptance           | 108    | 5.6%     | 1.48M   | 3.1%  | 380.71M | 2.8%  | 693           | 1913       | 56       |
| retrospective        | 21     | 1.1%     | 408k    | 0.8%  | 41.86M  | 0.3%  | 138           | 714        | 0        |
| other                | 313    | 16.3%    | 4.80M   | 9.9%  | 1.29G   | 9.6%  | 4426          | 5442       | 63       |
| driver (main thread) | —      | —        | 11.53M  | 23.9% | 4.71G   | 35.1% | 23239         | —          | —        |

### by mise version ceiling

**2.0.0** — n = 21 runs (feat/session-monitor, feat/backfill-order-history, feat/migrate-firebase-kit, fix/unmark-all-reviewed-diff-base, feat/remove-backfill-order-history, feat/specials-fixes, fix/menu-preview-changes, feat/blog, feat/close-out-orders, feat/home-page, feat/originhypnosis-site, fix/ios-seal-and-photo, fix/ios-ring-arcs-scroll, fix/menu-availability, fix/missing-image, eric/attribution-3, feat/voice-notes, feat/extraction-provenance, fix/voice-note-not-transcribed, fix/menu-pin, fix/doc-churn-usage)

| stage          | spawns | out tok | % out | active h | % active |
| -------------- | ------ | ------- | ----- | -------- | -------- |
| setup          | 9      | 306k    | 0.9%  | 2.0      | 0.7%     |
| goals          | 52     | 2.63M   | 7.5%  | 10.3     | 3.6%     |
| mock           | 4      | 362k    | 1.0%  | 1.8      | 0.6%     |
| requirements   | 91     | 2.27M   | 6.5%  | 11.0     | 3.8%     |
| plan           | 117    | 4.24M   | 12.1% | 30.2     | 10.5%    |
| execute        | 905    | 20.96M  | 59.6% | 173.6    | 60.4%    |
| acceptance     | 101    | 3.12M   | 8.9%  | 23.3     | 8.1%     |
| retrospective  | 16     | 317k    | 0.9%  | 1.0      | 0.4%     |
| (unattributed) | 0      | 953k    | 2.7%  | 34.1     | 11.9%    |

**2.1.0** — n = 7 runs (eric/attribution-3, feat/first-time-offer, feat/tips, feat/keepalive-caller, fix/get-doc-with-cache-store-reset-retry, feat/remove-k-prop-migration, feat/upgrade-packages)

| stage          | spawns | out tok | % out | active h | % active |
| -------------- | ------ | ------- | ----- | -------- | -------- |
| setup          | 2      | 95k     | 0.7%  | 0.7      | 0.7%     |
| goals          | 5      | 169k    | 1.3%  | 1.1      | 1.1%     |
| mock           | 0      | 20k     | 0.1%  | 0.1      | 0.1%     |
| requirements   | 59     | 723k    | 5.5%  | 4.4      | 4.4%     |
| plan           | 27     | 613k    | 4.7%  | 3.0      | 3.0%     |
| execute        | 491    | 10.16M  | 77.4% | 82.6     | 82.6%    |
| acceptance     | 41     | 1.01M   | 7.7%  | 2.3      | 2.3%     |
| retrospective  | 6      | 210k    | 1.6%  | 0.7      | 0.7%     |
| (unattributed) | 0      | 135k    | 1.0%  | 5.2      | 5.2%     |

| role          | 2.0.0 spawns | 2.0.0 % out | 2.1.0 spawns | 2.1.0 % out |
| ------------- | ------------ | ----------- | ------------ | ----------- |
| critic        | 165          | 10.9%       | 77           | 5.5%        |
| implementer   | 409          | 29.3%       | 221          | 35.6%       |
| fix           | 115          | 7.6%        | 39           | 8.9%        |
| reviewer      | 194          | 7.5%        | 98           | 13.2%       |
| documenter    | 59           | 3.0%        | 107          | 10.0%       |
| acceptance    | 84           | 2.7%        | 24           | 4.0%        |
| retrospective | 16           | 0.7%        | 5            | 1.2%        |
| other         | 253          | 11.2%       | 60           | 6.5%        |

## (b) Per-task cost in `execute`

Per task = the `execute` stage divided by the run's plan task count (task files in `.mise/implementation_plan/`, from git). Restricted to the 21 runs that have a task count, an execute stage **and** a complete raw transcript — the 6 pruned runs have no per-stage time. n = 21 runs, 204 tasks.

| metric                   | median | p90  | min | max  |
| ------------------------ | ------ | ---- | --- | ---- |
| subagent spawns per task | 4.0    | 7.4  | 1.0 | 12.0 |
| output tokens per task   | 65k    | 189k | 18k | 246k |
| active minutes per task  | 44     | 87   | 10  | 223  |

How the execute stage splits — spawns, output tokens and agent-minutes counted **inside the execute stage only**, over all 27 runs that reached execute. `driver overhead` is main-thread work between spawns (reading state, writing task files, dispatching); its "agent-minutes" column is the stage's elapsed active time, not an agent sum.

| component                     | spawns | output tok | % of execute output | agent-minutes |
| ----------------------------- | ------ | ---------- | ------------------- | ------------- |
| implementer                   | 630    | 14.97M     | 48.1%               | 10681         |
| fix                           | 154    | 3.83M      | 12.3%               | 2718          |
| reviewer                      | 292    | 4.38M      | 14.1%               | 2209          |
| documenter                    | 166    | 2.36M      | 7.6%                | 1132          |
| other                         | 154    | 2.41M      | 7.8%                | 2691          |
| driver overhead (main thread) | —      | 3.18M      | 10.2%               | 15369         |

Per run (the same split, only the runs with a complete raw transcript):

| run                                                | tasks | execute spawns | spawns/task | execute out tok | out/task | active min/task | implementer | fix   | reviewer | documenter | driver |
| -------------------------------------------------- | ----- | -------------- | ----------- | --------------- | -------- | --------------- | ----------- | ----- | -------- | ---------- | ------ |
| feat/specials-fixes@e2931120d                      | 20    | 117            | 5.8         | 3.79M           | 189k     | 87              | 36.2%       | 7.9%  | 9.4%     | 2.7%       | 25.8%  |
| fix/menu-preview-changes@54b283d8d                 | 8     | 63             | 7.9         | 1.80M           | 226k     | 76              | 50.3%       | 7.7%  | 8.7%     | 4.4%       | 10.9%  |
| feat/blog@5d40a6c8a                                | 23    | 61             | 2.7         | 3.26M           | 142k     | 44              | 79.0%       | 3.9%  | 11.6%    | 3.3%       | 2.2%   |
| feat/close-out-orders@997620e72                    | 8     | 57             | 7.1         | 1.01M           | 126k     | 51              | 57.6%       | 9.8%  | 10.7%    | 12.0%      | 4.0%   |
| feat/originhypnosis-site@627fcc805                 | 15    | 42             | 2.8         | 1.13M           | 75k      | 41              | 46.4%       | 24.8% | 21.0%    | 3.7%       | 4.1%   |
| fix/ios-seal-and-photo@cfaf1831c                   | 1     | 4              | 4.0         | 103k            | 103k     | 37              | 45.2%       | 14.4% | 15.9%    | 19.3%      | 5.3%   |
| fix/ios-ring-arcs-scroll@f252fe0ca                 | 1     | 3              | 3.0         | 59k             | 59k      | 37              | 49.7%       | —     | 17.0%    | 20.0%      | 13.3%  |
| fix/menu-availability@ea5419d5e                    | 2     | 11             | 5.5         | 102k            | 51k      | 59              | 36.0%       | 8.7%  | 15.1%    | 12.0%      | 16.9%  |
| fix/missing-image@a1e1f0a69                        | 1     | 7              | 7.0         | 40k             | 40k      | 39              | 13.4%       | 6.7%  | 7.4%     | 30.6%      | 24.6%  |
| eric/attribution-3@aa365a440                       | 40    | 223            | 5.6         | 2.83M           | 71k      | 75              | 40.2%       | 14.4% | 12.0%    | 7.4%       | 18.7%  |
| feat/voice-notes@88d930903                         | 10    | 74             | 7.4         | 647k            | 65k      | 78              | 24.1%       | 24.9% | 7.2%     | 11.2%      | 20.0%  |
| feat/first-time-offer@3f5c18367                    | 21    | 59             | 2.8         | 971k            | 46k      | 50              | 46.3%       | 14.7% | 15.1%    | 13.2%      | 10.6%  |
| feat/tips@3d1a89e01                                | 17    | 58             | 3.4         | 647k            | 38k      | 36              | 49.6%       | 14.1% | 16.0%    | 8.9%       | 11.4%  |
| feat/extraction-provenance@705558755               | 9     | 25             | 2.8         | 232k            | 26k      | 21              | 55.2%       | 8.0%  | 28.4%    | —          | 8.4%   |
| fix/voice-note-not-transcribed@54b2acca9           | 3     | 20             | 6.7         | 275k            | 92k      | 74              | 23.4%       | 4.7%  | 11.4%    | 15.1%      | 18.2%  |
| fix/menu-pin@06d873433                             | 10    | 74             | 7.4         | 1.34M           | 134k     | 107             | 35.0%       | 13.3% | 11.6%    | 5.5%       | 7.5%   |
| fix/doc-churn-usage@c3e987767                      | 3     | 3              | 1.0         | 138k            | 46k      | 10              | 23.0%       | 41.6% | 14.9%    | —          | 20.6%  |
| feat/keepalive-caller@62be8a224                    | 6     | 19             | 3.2         | 307k            | 51k      | 14              | 64.4%       | 8.4%  | 19.5%    | —          | 7.7%   |
| fix/get-doc-with-cache-store-reset-retry@c5199f791 | 2     | 4              | 2.0         | 76k             | 38k      | 11              | 76.0%       | —     | 19.1%    | —          | 4.8%   |
| feat/remove-k-prop-migration@beda70153             | 3     | 10             | 3.3         | 54k             | 18k      | 32              | 37.2%       | 6.1%  | 23.0%    | 16.0%      | 17.7%  |
| feat/upgrade-packages@1435d90a6                    | 1     | 12             | 12.0        | 246k            | 246k     | 223             | 26.6%       | 26.6% | 6.6%     | 5.8%       | 5.5%   |

## (c) Driver overhead — what the main thread spends between spawns

The driver never idles while a subagent runs — its tokens are the state reads, skill re-reads, task-file writes and dispatch prose around each spawn. Driver = 11.53M output (23.9% of all output) and 4.71G input (35.1% of all input) over 11808 requests. n = 28 runs.

| stage          | driver requests | driver out | driver in | driver out / run | `.mise/` file writes | compactions |
| -------------- | --------------- | ---------- | --------- | ---------------- | -------------------- | ----------- |
| setup          | 415             | 319k       | 36.74M    | 11k              | 12                   | 0           |
| goals          | 1330            | 1.63M      | 348.51M   | 58k              | 239                  | 0           |
| mock           | 199             | 324k       | 53.24M    | 12k              | 83                   | 0           |
| requirements   | 777             | 1.18M      | 212.39M   | 42k              | 343                  | 2           |
| plan           | 1062            | 1.68M      | 411.77M   | 60k              | 584                  | 0           |
| execute        | 4133            | 3.18M      | 1.84G     | 113k             | 31                   | 16          |
| acceptance     | 2654            | 2.05M      | 1.49G     | 73k              | 6                    | 6           |
| retrospective  | 86              | 88k        | 22.27M    | 3k               | 0                    | 0           |
| (unattributed) | 1152            | 1.09M      | 297.17M   | 39k              | 0                    | 0           |

**mise skill files read by the driver** (main thread; a `Read` or a `cat`/`sed` in `Bash`). `est tok` = result characters / 4. `SKILL.md` is not usually read — the harness injects it as a skill body on every `/mise:next`, counted in the second table.

| file                           | reads (all runs) | runs that read it | reads / run | result chars | est tok |
| ------------------------------ | ---------------- | ----------------- | ----------- | ------------ | ------- |
| references/interaction.md      | 42               | 24/28             | 1.50        | 332k         | 83k     |
| stages/execute.md              | 34               | 21/28             | 1.21        | 239k         | 60k     |
| stages/goals.md                | 26               | 21/28             | 0.93        | 132k         | 33k     |
| stages/plan.md                 | 24               | 18/28             | 0.86        | 206k         | 52k     |
| stages/requirements.md         | 16               | 12/28             | 0.57        | 27k          | 7k      |
| stages/setup.md                | 7                | 6/28              | 0.25        | 35k          | 9k      |
| references/config-reference.md | 7                | 6/28              | 0.25        | 38k          | 9k      |
| roles/critic.md                | 6                | 6/28              | 0.21        | 15k          | 4k      |
| roles/implementer.md           | 4                | 4/28              | 0.14        | 19k          | 5k      |
| roles/acceptance.md            | 3                | 3/28              | 0.11        | 15k          | 4k      |
| roles/documenter.md            | 3                | 3/28              | 0.11        | 7k           | 2k      |
| SKILL.md                       | 3                | 1/28              | 0.11        | 5k           | 1k      |
| roles/reviewer.md              | 3                | 3/28              | 0.11        | 14k          | 4k      |
| roles/retrospective.md         | 3                | 3/28              | 0.11        | 11k          | 3k      |
| stages/acceptance.md           | 1                | 1/28              | 0.04        | 942          | 236     |

| driver skill-body injections (SKILL.md and other skills, `isMeta` turns) | count | chars | est tok | per run |
| ------------------------------------------------------------------------ | ----- | ----- | ------- | ------- |
| total                                                                    | 144   | 1.15M | 287k    | 5.1     |

**mise skill files read by role subagents** (each spawn re-reads its own role file; this is the per-spawn instruction cost the driver pays for):

| file                           | reads | by role                                        |
| ------------------------------ | ----- | ---------------------------------------------- |
| roles/implementer.md           | 433   | implementer 288, fix 141, critic 2, reviewer 2 |
| roles/reviewer.md              | 238   | reviewer 234, implementer 4                    |
| roles/critic.md                | 164   | critic 164                                     |
| roles/documenter.md            | 146   | documenter 136, implementer 8, reviewer 2      |
| roles/acceptance.md            | 47    | acceptance 46, implementer 1                   |
| roles/retrospective.md         | 17    | retrospective 17                               |
| stages/plan.md                 | 6     | critic 6                                       |
| stages/execute.md              | 4     | implementer 3, reviewer 1                      |
| SKILL.md                       | 3     | implementer 3                                  |
| references/interaction.md      | 1     | implementer 1                                  |
| stages/requirements.md         | 1     | critic 1                                       |
| references/config-reference.md | 1     | retrospective 1                                |

**Driver token cost per run** (highest first):

| run                                                | driver out | driver in | driver reqs | driver % of run output | `.mise/` writes | skill-file reads |
| -------------------------------------------------- | ---------- | --------- | ----------- | ---------------------- | --------------- | ---------------- |
| feat/specials-fixes@e2931120d                      | 3.20M      | 1.86G     | 3678        | 42.7%                  | 245             | 30               |
| eric/attribution-3@aa365a440                       | 1.01M      | 379.80M   | 918         | 28.9%                  | 144             | 9                |
| eric/attribution-3@731401043                       | 801k       | 312.65M   | 931         | 9.1%                   | 0               | 7                |
| feat/originhypnosis-site@627fcc805                 | 663k       | 135.11M   | 453         | 31.4%                  | 82              | 12               |
| feat/close-out-orders@997620e72                    | 608k       | 547.13M   | 1003        | 34.4%                  | 57              | 11               |
| feat/session-monitor@23a95b496                     | 561k       | 140.51M   | 427         | 12.4%                  | 0               | 4                |
| fix/menu-preview-changes@54b283d8d                 | 519k       | 354.32M   | 634         | 18.5%                  | 74              | 5                |
| feat/first-time-offer@3f5c18367                    | 480k       | 111.01M   | 419         | 31.1%                  | 244             | 9                |
| fix/menu-pin@06d873433                             | 435k       | 93.85M    | 300         | 21.0%                  | 182             | 12               |
| feat/blog@5d40a6c8a                                | 418k       | 123.48M   | 338         | 10.3%                  | 208             | 7                |
| feat/home-page@ad5081a1f                           | 363k       | 154.09M   | 391         | 25.2%                  | 3               | 4                |
| feat/tips@3d1a89e01                                | 357k       | 83.74M    | 342         | 30.7%                  | 24              | 9                |
| feat/voice-notes@88d930903                         | 338k       | 118.68M   | 293         | 29.5%                  | 0               | 5                |
| feat/migrate-firebase-kit@3329fcef3                | 236k       | 78.66M    | 291         | 25.5%                  | 0               | 0                |
| fix/voice-note-not-transcribed@54b2acca9           | 232k       | 29.06M    | 165         | 40.1%                  | 6               | 13               |
| feat/keepalive-caller@62be8a224                    | 212k       | 30.93M    | 129         | 29.8%                  | 0               | 9                |
| feat/extraction-provenance@705558755               | 159k       | 21.79M    | 102         | 31.9%                  | 12              | 5                |
| fix/doc-churn-usage@c3e987767                      | 158k       | 16.83M    | 102         | 33.7%                  | 0               | 3                |
| feat/backfill-order-history@4a7c78e7f              | 131k       | 41.35M    | 220         | 25.1%                  | 0               | 0                |
| fix/ios-ring-arcs-scroll@f252fe0ca                 | 120k       | 6.50M     | 46          | 53.4%                  | 0               | 5                |
| fix/menu-availability@ea5419d5e                    | 107k       | 17.49M    | 115         | 44.6%                  | 17              | 4                |
| fix/ios-seal-and-photo@cfaf1831c                   | 84k        | 5.83M     | 65          | 36.9%                  | 0               | 4                |
| fix/unmark-all-reviewed-diff-base@8c89bf18a        | 76k        | 8.84M     | 76          | 30.4%                  | 0               | 0                |
| fix/missing-image@a1e1f0a69                        | 70k        | 12.04M    | 104         | 51.7%                  | 0               | 4                |
| feat/remove-backfill-order-history@ad3e4036c       | 63k        | 10.25M    | 91          | 34.0%                  | 0               | 0                |
| fix/get-doc-with-cache-store-reset-retry@c5199f791 | 49k        | 5.58M     | 56          | 24.0%                  | 0               | 8                |
| feat/upgrade-packages@1435d90a6                    | 43k        | 5.06M     | 58          | 8.2%                   | 0               | 1                |
| feat/remove-k-prop-migration@beda70153             | 36k        | 5.99M     | 61          | 27.2%                  | 0               | 2                |

## (d) Human-wait — where the run sat waiting for the owner

Human-wait is the gap before a turn the owner actually typed. Total across 28 runs: 1213.9 h, against 387.3 h of active model+tool time — a 3.1:1 ratio. Capped at 30 min per gap (overnight gaps removed) it is 141.9 h.

| stage          | wait h | % of wait | wait h capped 30m | wait : active in this stage |
| -------------- | ------ | --------- | ----------------- | --------------------------- |
| setup          | 32.4   | 2.7%      | 6.8               | 12.0:1                      |
| goals          | 47.6   | 3.9%      | 21.7              | 4.2:1                       |
| mock           | 29.3   | 2.4%      | 2.6               | 16.0:1                      |
| requirements   | 20.0   | 1.6%      | 5.1               | 1.3:1                       |
| plan           | 73.2   | 6.0%      | 9.4               | 2.2:1                       |
| execute        | 481.7  | 39.7%     | 51.5              | 1.9:1                       |
| acceptance     | 421.6  | 34.7%     | 30.8              | 16.5:1                      |
| retrospective  | 9.3    | 0.8%      | 1.7               | 5.5:1                       |
| (unattributed) | 98.8   | 8.1%      | 12.3              | 2.5:1                       |

| measure                                        | median | p90     | max     |
| ---------------------------------------------- | ------ | ------- | ------- |
| total human-wait per run (n=28)                | 16.3 h | 129.3 h | 280.0 h |
| longest single wait per run (n=28)             | 13.1 h | 43.7 h  | 118.1 h |
| the 5 longest gaps of each run, pooled (n=115) | 1.6 h  | 17.9 h  | 118.1 h |

Stage the single longest wait of a run fell in:

| stage              | runs whose longest wait is here |
| ------------------ | ------------------------------- |
| acceptance         | 10/28                           |
| execute            | 8/28                            |
| (pruned — unknown) | 4/28                            |
| goals              | 2/28                            |
| plan               | 1/28                            |
| requirements       | 1/28                            |
| setup              | 1/28                            |
| retrospective      | 1/28                            |

Per run:

| run                                                | wait h | capped h | longest gap h | stage of longest gap | active h | wall h |
| -------------------------------------------------- | ------ | -------- | ------------- | -------------------- | -------- | ------ |
| feat/session-monitor@23a95b496                     | 280.0  | 6.4      | 118.1         | acceptance           | 25.6     | 306.7  |
| feat/specials-fixes@e2931120d                      | 169.4  | 35.7     | 24.0          | execute              | 53.5     | 222.8  |
| feat/close-out-orders@997620e72                    | 129.3  | 8.2      | 99.0          | acceptance           | 11.6     | 140.8  |
| eric/attribution-3@aa365a440                       | 120.1  | 13.3     | 43.7          | execute              | 55.2     | 175.4  |
| eric/attribution-3@731401043                       | 101.3  | 12.4     | 20.2          | execute              | 54.2     | 155.5  |
| fix/menu-pin@06d873433                             | 62.9   | 7.6      | 22.4          | setup                | 22.8     | 85.7   |
| fix/menu-preview-changes@54b283d8d                 | 60.3   | 7.2      | 19.1          | plan                 | 14.7     | 75.0   |
| feat/voice-notes@88d930903                         | 50.5   | 4.0      | 28.4          | execute              | 16.8     | 67.4   |
| feat/blog@5d40a6c8a                                | 33.1   | 4.2      | 18.1          | acceptance           | 30.9     | 64.6   |
| feat/home-page@ad5081a1f                           | 28.3   | 6.1      | 15.3          | goals                | 4.3      | 32.6   |
| fix/voice-note-not-transcribed@54b2acca9           | 25.9   | 4.4      | 10.1          | requirements         | 5.6      | 26.1   |
| fix/ios-ring-arcs-scroll@f252fe0ca                 | 22.8   | 1.5      | 13.8          | acceptance           | 1.4      | 24.2   |
| feat/backfill-order-history@4a7c78e7f              | 22.0   | 2.1      | 19.9          | (pruned — unknown)   | 5.1      | 27.0   |
| feat/migrate-firebase-kit@3329fcef3                | 16.4   | 2.4      | 14.0          | (pruned — unknown)   | 9.8      | 26.1   |
| fix/menu-availability@ea5419d5e                    | 16.3   | 1.7      | 12.4          | acceptance           | 3.1      | 19.4   |
| fix/ios-seal-and-photo@cfaf1831c                   | 15.5   | 0.7      | 15.3          | acceptance           | 1.2      | 16.8   |
| feat/originhypnosis-site@627fcc805                 | 11.8   | 5.1      | 7.2           | acceptance           | 15.6     | 27.5   |
| feat/tips@3d1a89e01                                | 10.5   | 4.0      | 4.4           | execute              | 13.7     | 24.3   |
| feat/upgrade-packages@1435d90a6                    | 10.1   | 1.8      | 8.1           | retrospective        | 4.8      | 14.9   |
| feat/first-time-offer@3f5c18367                    | 10.1   | 5.4      | 2.5           | execute              | 21.3     | 32.3   |
| feat/extraction-provenance@705558755               | 7.4    | 1.0      | 5.0           | execute              | 4.2      | 11.8   |
| fix/unmark-all-reviewed-diff-base@8c89bf18a        | 4.2    | 1.3      | 3.1           | (pruned — unknown)   | 1.2      | 4.5    |
| feat/keepalive-caller@62be8a224                    | 1.8    | 1.8      | 0.4           | acceptance           | 3.2      | 5.1    |
| fix/doc-churn-usage@c3e987767                      | 1.2    | 1.2      | 0.3           | execute              | 1.8      | 3.0    |
| fix/get-doc-with-cache-store-reset-retry@c5199f791 | 0.9    | 0.9      | 0.6           | acceptance           | 0.8      | 1.8    |
| feat/remove-backfill-order-history@ad3e4036c       | 0.9    | 0.8      | 0.6           | (pruned — unknown)   | 1.2      | 1.9    |
| fix/missing-image@a1e1f0a69                        | 0.7    | 0.7      | 0.4           | goals                | 1.6      | 2.4    |
| feat/remove-k-prop-migration@beda70153             | 0.1    | 0.1      | 0.1           | acceptance           | 1.9      | 2.0    |

## (e) Small runs — the cost of a small note

Every run whose non-mise code diff is <= 400 changed lines; the `<=60` column marks the ones the brief asks for by size. n = 7 runs, of which 1 is <= 60 lines (only `fix/missing-image` clears that bar; `fix/menu-availability` at 63 is the next). "artifact lines" is the total of `.mise/` artifact line counts from git (goals, requirements, plan overview + task files, progress, friction, exploration, retrospective).

| run                                                | type    | <=60 | code lines changed | files | mise artifact lines | artifact : code | subagents | wall h | active h | wait h | output tok | gate runs | sessions |
| -------------------------------------------------- | ------- | ---- | ------------------ | ----- | ------------------- | --------------- | --------- | ------ | -------- | ------ | ---------- | --------- | -------- |
| fix/missing-image@a1e1f0a69                        | bugfix  | yes  | 31                 | 3     | 458                 | 14.8x           | 13        | 2.4    | 1.6      | 0.7    | 135k       | 31        | 1        |
| fix/menu-availability@ea5419d5e                    | bugfix  |      | 63                 | 3     | 637                 | 10.1x           | 17        | 19.4   | 3.1      | 16.3   | 240k       | 45        | 1        |
| fix/doc-churn-usage@c3e987767                      | bugfix  |      | 122                | 10    | 453                 | 3.7x            | 11        | 3.0    | 1.8      | 1.2    | 469k       | 11        | 1        |
| fix/ios-ring-arcs-scroll@f252fe0ca                 | bugfix  |      | 187                | 1     | 354                 | 1.9x            | 6         | 24.2   | 1.4      | 22.8   | 225k       | 15        | 1        |
| feat/upgrade-packages@1435d90a6                    | feature |      | 274                | 15    | 109                 | 0.4x            | 15        | 14.9   | 4.8      | 10.1   | 526k       | 52        | 1        |
| fix/ios-seal-and-photo@cfaf1831c                   | bugfix  |      | 289                | 7     | 662                 | 2.3x            | 7         | 16.8   | 1.2      | 15.5   | 228k       | 22        | 1        |
| fix/get-doc-with-cache-store-reset-retry@c5199f791 | bugfix  |      | 345                | 9     | 546                 | 1.6x            | 8         | 1.8    | 0.8      | 0.9    | 205k       | 26        | 1        |

The same run shape, small runs against the rest — this is the "small note takes very long" claim, quantified:

| cohort            | n   | median code lines | median artifact lines | median artifact : code | median subagents | median stages entered | median wall h | median active h | median output tok |
| ----------------- | --- | ----------------- | --------------------- | ---------------------- | ---------------- | --------------------- | ------------- | --------------- | ----------------- |
| <= 400 code lines | 7   | 187               | 458                   | 2.3x                   | 11               | 7                     | 14.9          | 1.6             | 228k              |
| > 400 code lines  | 21  | 5583              | 2566                  | 0.31x                  | 68               | 6                     | 32.3          | 13.7            | 1.44M             |

Full stage timeline of each small run — active minutes / output tokens / subagents per stage:

**fix/missing-image@a1e1f0a69** — 31 code lines changed in 3 files; 1 plan tasks; 458 artifact lines; mise 2.0.0

| stage         | active min | wait min | output tok | driver out | subagents | roles                                                   | gate runs | `.mise/` writes |
| ------------- | ---------- | -------- | ---------- | ---------- | --------- | ------------------------------------------------------- | --------- | --------------- |
| setup         | 1          | 0        | 2k         | 2k         | 0         | —                                                       | 0         | 0               |
| goals         | 9          | 28       | 21k        | 21k        | 0         | —                                                       | 0         | 0               |
| requirements  | 19         | 0        | 16k        | 15k        | 1         | other 1                                                 | 4         | 0               |
| plan          | 19         | 0        | 36k        | 10k        | 2         | critic 2                                                | 0         | 0               |
| execute       | 39         | 0        | 40k        | 10k        | 7         | other 2, implementer 1, reviewer 1, documenter 2, fix 1 | 27        | 0               |
| acceptance    | 9          | 15       | 18k        | 11k        | 2         | acceptance 2                                            | 0         | 0               |
| retrospective | 0          | 0        | 2k         | 547        | 1         | retrospective 1                                         | 0         | 0               |

**fix/menu-availability@ea5419d5e** — 63 code lines changed in 3 files; 2 plan tasks; 637 artifact lines; mise 2.0.0

| stage         | active min | wait min | output tok | driver out | subagents | roles                                                   | gate runs | `.mise/` writes |
| ------------- | ---------- | -------- | ---------- | ---------- | --------- | ------------------------------------------------------- | --------- | --------------- |
| setup         | 25         | 228      | 76k        | 62k        | 2         | other 2                                                 | 2         | 4               |
| requirements  | 1          | 2        | 2k         | 2k         | 0         | —                                                       | 0         | 0               |
| plan          | 33         | 0        | 43k        | 23k        | 2         | critic 2                                                | 1         | 13              |
| execute       | 118        | 0        | 102k       | 17k        | 11        | other 2, implementer 4, reviewer 3, fix 1, documenter 1 | 42        | 0               |
| acceptance    | 6          | 746      | 10k        | 2k         | 1         | acceptance 1                                            | 0         | 0               |
| retrospective | 1          | 0        | 7k         | 658        | 1         | retrospective 1                                         | 0         | 0               |

**fix/doc-churn-usage@c3e987767** — 122 code lines changed in 10 files; 3 plan tasks; 453 artifact lines; mise 2.0.0

| stage         | active min | wait min | output tok | driver out | subagents | roles                            | gate runs | `.mise/` writes |
| ------------- | ---------- | -------- | ---------- | ---------- | --------- | -------------------------------- | --------- | --------------- |
| setup         | 0          | 0        | 2k         | 2k         | 0         | —                                | 0         | 0               |
| goals         | 12         | 18       | 49k        | 49k        | 0         | —                                | 0         | 0               |
| requirements  | 4          | 0        | 19k        | 19k        | 0         | —                                | 0         | 0               |
| plan          | 46         | 22       | 209k       | 47k        | 6         | critic 6                         | 0         | 0               |
| execute       | 31         | 20       | 138k       | 28k        | 3         | implementer 1, reviewer 1, fix 1 | 10        | 0               |
| acceptance    | 5          | 8        | 23k        | 2k         | 1         | acceptance 1                     | 0         | 0               |
| retrospective | 7          | 4        | 29k        | 11k        | 1         | retrospective 1                  | 1         | 0               |

**fix/ios-ring-arcs-scroll@f252fe0ca** — 187 code lines changed in 1 files; 1 plan tasks; 354 artifact lines; mise 2.0.0

| stage         | active min | wait min | output tok | driver out | subagents | roles                                   | gate runs | `.mise/` writes |
| ------------- | ---------- | -------- | ---------- | ---------- | --------- | --------------------------------------- | --------- | --------------- |
| setup         | 0          | 0        | 1k         | 1k         | 0         | —                                       | 0         | 0               |
| goals         | 13         | 180      | 57k        | 57k        | 0         | —                                       | 0         | 0               |
| requirements  | 9          | 0        | 40k        | 40k        | 0         | —                                       | 0         | 0               |
| plan          | 12         | 0        | 39k        | 5k         | 1         | critic 1                                | 0         | 0               |
| execute       | 37         | 0        | 59k        | 8k         | 3         | implementer 1, reviewer 1, documenter 1 | 15        | 0               |
| acceptance    | 11         | 1186     | 19k        | 7k         | 1         | acceptance 1                            | 0         | 0               |
| retrospective | 0          | 0        | 10k        | 1k         | 1         | retrospective 1                         | 0         | 0               |

**feat/upgrade-packages@1435d90a6** — 274 code lines changed in 15 files; 1 plan tasks; 109 artifact lines; mise 2.1.0

| stage         | active min | wait min | output tok | driver out | subagents | roles                                                   | gate runs | `.mise/` writes |
| ------------- | ---------- | -------- | ---------- | ---------- | --------- | ------------------------------------------------------- | --------- | --------------- |
| setup         | 1          | 7        | 2k         | 2k         | 0         | —                                                       | 0         | 0               |
| goals         | 1          | 0        | 4k         | 4k         | 0         | —                                                       | 0         | 0               |
| requirements  | 0          | 0        | 545        | 545        | 0         | —                                                       | 0         | 0               |
| execute       | 223        | 116      | 246k       | 13k        | 12        | implementer 1, documenter 2, reviewer 1, fix 1, other 7 | 49        | 0               |
| acceptance    | 22         | 1        | 117k       | 8k         | 1         | acceptance 1                                            | 2         | 0               |
| retrospective | 39         | 484      | 157k       | 15k        | 2         | retrospective 1, other 1                                | 1         | 0               |

**fix/ios-seal-and-photo@cfaf1831c** — 289 code lines changed in 7 files; 1 plan tasks; 662 artifact lines; mise 2.0.0

| stage         | active min | wait min | output tok | driver out | subagents | roles                                          | gate runs | `.mise/` writes |
| ------------- | ---------- | -------- | ---------- | ---------- | --------- | ---------------------------------------------- | --------- | --------------- |
| setup         | 0          | 0        | 1k         | 1k         | 0         | —                                              | 0         | 0               |
| goals         | 6          | 8        | 22k        | 22k        | 0         | —                                              | 0         | 0               |
| requirements  | 0          | 0        | 172        | 172        | 0         | —                                              | 0         | 0               |
| plan          | 18         | 0        | 65k        | 43k        | 1         | critic 1                                       | 0         | 0               |
| execute       | 37         | 0        | 103k       | 5k         | 4         | implementer 1, reviewer 1, fix 1, documenter 1 | 21        | 0               |
| acceptance    | 6          | 920      | 13k        | 4k         | 1         | acceptance 1                                   | 0         | 0               |
| retrospective | 7          | 5        | 23k        | 8k         | 1         | retrospective 1                                | 1         | 0               |

**fix/get-doc-with-cache-store-reset-retry@c5199f791** — 345 code lines changed in 9 files; 2 plan tasks; 546 artifact lines; mise 2.1.0

| stage         | active min | wait min | output tok | driver out | subagents | roles                     | gate runs | `.mise/` writes |
| ------------- | ---------- | -------- | ---------- | ---------- | --------- | ------------------------- | --------- | --------------- |
| setup         | 3          | 5        | 12k        | 12k        | 0         | —                         | 0         | 0               |
| goals         | 2          | 12       | 5k         | 5k         | 0         | —                         | 0         | 0               |
| requirements  | 3          | 0        | 15k        | 15k        | 0         | —                         | 0         | 0               |
| plan          | 16         | 0        | 74k        | 7k         | 2         | critic 2                  | 1         | 0               |
| execute       | 22         | 0        | 76k        | 4k         | 4         | implementer 2, reviewer 2 | 23        | 0               |
| acceptance    | 4          | 39       | 11k        | 6k         | 1         | acceptance 1              | 2         | 0               |
| retrospective | 0          | 0        | 12k        | 368        | 1         | retrospective 1           | 0         | 0               |

## (f) The 10 most expensive individual subagent runs

Ranked by output tokens, over all 1926 in-span subagents of the 28 runs.

| #   | run                   | role        | stage   | depth | model             | output tok | input tok | minutes | description                           |
| --- | --------------------- | ----------- | ------- | ----- | ----------------- | ---------- | --------- | ------- | ------------------------------------- |
| 1   | eric/attribution-3    | implementer | execute | 1     | claude-opus-5[1m] | 196k       | 76.66M    | 69      | Implementer: spend ledger decisions   |
| 2   | feat/specials-fixes   | fix         | execute | 1     | claude-opus-5[1m] | 162k       | 38.91M    | 66      | Fix eval telemetry leak               |
| 3   | feat/blog             | implementer | execute | 1     | claude-opus-5[1m] | 158k       | 44.39M    | 41      | Restore functions source conventions  |
| 4   | feat/session-monitor  | implementer | execute | 1     | claude-opus-5[1m] | 153k       | 38.34M    | 48      | Implement task 05_04                  |
| 5   | feat/blog             | implementer | execute | 1     | claude-opus-5[1m] | 140k       | 39.87M    | 42      | Implement task 4.1 admin auth         |
| 6   | feat/blog             | implementer | execute | 1     | claude-opus-5[1m] | 136k       | 46.43M    | 81      | Restore hosting CSS and config parity |
| 7   | feat/session-monitor  | implementer | execute | 1     | claude-opus-5[1m] | 132k       | 22.85M    | 36      | Implement task 05_01                  |
| 8   | feat/blog             | implementer | execute | 1     | claude-opus-5[1m] | 130k       | 24.79M    | 39      | Implement task 2.3 post page          |
| 9   | feat/first-time-offer | implementer | execute | 1     | claude-opus-5[1m] | 124k       | 165.52M   | 97      | Implement task 02_04                  |
| 10  | feat/session-monitor  | implementer | execute | 1     | claude-opus-5     | 123k       | 23.85M    | 44      | Live-verify extension requirements    |

Same list ranked by wall duration instead:

| #   | run                       | role        | stage   | minutes | output tok | description                                        |
| --- | ------------------------- | ----------- | ------- | ------- | ---------- | -------------------------------------------------- |
| 1   | eric/attribution-3        | implementer | execute | 946     | 7k         | Re-verify notes and range bar wrap                 |
| 2   | fix/menu-pin              | implementer | execute | 515     | 48k        | Implement Task 2.5                                 |
| 3   | feat/specials-fixes       | other       | execute | 332     | 107k       | Compress prompt, diversify evals                   |
| 4   | eric/attribution-3        | implementer | execute | 302     | 75k        | Implementer: **mocks** sweep and a test title      |
| 5   | eric/attribution-3        | implementer | execute | 300     | 86k        | Implementer: component placement, reuse, month tag |
| 6   | fix/menu-pin              | other       | execute | 263     | 5k         | End-of-plan gate: check and full tests             |
| 7   | feat/migrate-firebase-kit | other       | execute | 221     | 43k        | Run e2e and smoke gate                             |
| 8   | eric/attribution-3        | implementer | execute | 201     | 35k        | Implement task 08_01 seed and verify               |
| 9   | fix/menu-pin              | other       | execute | 181     | 80k        | Third delta review-notes pass                      |
| 10  | eric/attribution-3        | implementer | execute | 121     | 24k        | Implement task 3.2: day builder                    |

## (g) Quality-gate commands

Gate = a Bash run classified as test / lint / typecheck / build, on the main thread or inside any subagent (digest `commandRuns`).

Two counts are given. **digest** is the digester's own classification of the full command. **strict** re-classifies the stored 200-character prefix with quoted strings removed first, which drops false positives like `pgrep -lf "(vitest|eslint)"` (the digester splits on `|` and reads `eslint)"` as a lint run). Strict is the number to quote; the gap between the two is the digester's false-positive rate on this corpus.

Across 28 runs: **7478 strict gate runs** (digest count 9025; 17.1% of the digest's gate rows are false positives), **73.5 h** of measured command time (digest 82.6 h), 19.0% of all active time.

Of the 467 strict gate runs that repeated a command already run in the same thread, **195 had no file edit in that thread in between (41.8%)**; 4 could not be checked (pruned transcript). Same command = identical 200-character prefix, so two long commands sharing a prefix are counted as one.

| stage         | gate runs (strict) | gate runs (digest) | gate time h (strict) | % of stage active time |
| ------------- | ------------------ | ------------------ | -------------------- | ---------------------- |
| setup         | 3                  | 3                  | 0.0                  | 0.2%                   |
| goals         | 0                  | 2                  | 0.0                  | 0.0%                   |
| mock          | 1                  | 1                  | 0.0                  | 0.0%                   |
| requirements  | 41                 | 65                 | 0.4                  | 2.5%                   |
| plan          | 20                 | 37                 | 0.2                  | 0.8%                   |
| execute       | 7045               | 8186               | 66.3                 | 25.9%                  |
| acceptance    | 368                | 725                | 6.6                  | 25.7%                  |
| retrospective | 0                  | 6                  | 0.0                  | 0.0%                   |

| role running the gate | gate runs (strict) | gate time h (strict) |
| --------------------- | ------------------ | -------------------- |
| implementer           | 3521               | 29.0                 |
| fix                   | 1360               | 11.8                 |
| reviewer              | 1006               | 7.7                  |
| driver                | 817                | 15.0                 |
| other                 | 442                | 4.7                  |
| documenter            | 320                | 5.2                  |
| acceptance            | 8                  | 0.0                  |
| critic                | 4                  | 0.0                  |

| run                                                | gate runs (strict) | gate time h | % of active | kinds (strict)                             | repeats | repeats with no intervening edit | unknown |
| -------------------------------------------------- | ------------------ | ----------- | ----------- | ------------------------------------------ | ------- | -------------------------------- | ------- |
| eric/attribution-3@aa365a440                       | 1353               | 16.5        | 29.9%       | build 421, lint 384, test 727              | 181     | 120                              | 0       |
| eric/attribution-3@731401043                       | 1407               | 13.3        | 24.5%       | build 483, lint 428, test 722, typecheck 1 | 31      | 9                                | 1       |
| feat/specials-fixes@e2931120d                      | 1040               | 11.7        | 21.9%       | build 337, lint 266, test 658              | 74      | 24                               | 0       |
| fix/menu-pin@06d873433                             | 478                | 5.6         | 24.5%       | build 159, lint 113, test 283              | 50      | 7                                | 0       |
| feat/first-time-offer@3f5c18367                    | 357                | 5.1         | 23.9%       | build 120, lint 107, test 202, typecheck 1 | 11      | 6                                | 0       |
| feat/voice-notes@88d930903                         | 449                | 4.3         | 25.7%       | build 159, lint 112, test 234              | 48      | 10                               | 0       |
| feat/tips@3d1a89e01                                | 283                | 3.9         | 28.2%       | build 98, lint 75, test 141                | 26      | 2                                | 0       |
| feat/blog@5d40a6c8a                                | 559                | 2.3         | 7.5%        | lint 241, build 228, test 257              | 9       | 3                                | 0       |
| feat/close-out-orders@997620e72                    | 243                | 1.9         | 16.7%       | test 129, build 94, lint 68, typecheck 1   | 21      | 6                                | 0       |
| feat/upgrade-packages@1435d90a6                    | 44                 | 1.4         | 30.1%       | build 23, lint 12, test 14                 | 3       | 3                                | 0       |
| feat/backfill-order-history@4a7c78e7f              | 66                 | 1.1         | 22.0%       | build 25, lint 25, test 30                 | 2       | 0                                | 2       |
| fix/menu-preview-changes@54b283d8d                 | 136                | 1.0         | 6.6%        | build 71, lint 44, test 37                 | 4       | 2                                | 0       |
| feat/session-monitor@23a95b496                     | 246                | 0.8         | 3.3%        | test 126, build 155, lint 158              | 1       | 0                                | 1       |
| fix/voice-note-not-transcribed@54b2acca9           | 119                | 0.8         | 14.8%       | build 45, lint 35, test 53                 | 5       | 2                                | 0       |
| feat/migrate-firebase-kit@3329fcef3                | 83                 | 0.8         | 7.7%        | build 25, lint 23, test 44                 | 0       | 0                                | 0       |
| feat/remove-k-prop-migration@beda70153             | 30                 | 0.7         | 35.9%       | build 15, lint 15, test 9                  | 0       | 0                                | 0       |
| fix/menu-availability@ea5419d5e                    | 41                 | 0.5         | 16.9%       | build 20, lint 12, test 11                 | 0       | 0                                | 0       |
| feat/extraction-provenance@705558755               | 94                 | 0.4         | 9.5%        | lint 71, build 38, test 37                 | 0       | 0                                | 0       |
| feat/remove-backfill-order-history@ad3e4036c       | 38                 | 0.4         | 31.0%       | build 19, lint 14, test 8                  | 0       | 0                                | 0       |
| fix/missing-image@a1e1f0a69                        | 30                 | 0.3         | 16.2%       | build 17, lint 10, test 5                  | 0       | 0                                | 0       |
| feat/originhypnosis-site@627fcc805                 | 206                | 0.3         | 1.6%        | lint 132, typecheck 71, build 37           | 0       | 0                                | 0       |
| feat/keepalive-caller@62be8a224                    | 74                 | 0.2         | 6.6%        | lint 50, build 20, test 18, typecheck 2    | 0       | 0                                | 0       |
| fix/unmark-all-reviewed-diff-base@8c89bf18a        | 33                 | 0.1         | 8.4%        | lint 24, build 11, test 10                 | 0       | 0                                | 0       |
| fix/get-doc-with-cache-store-reset-retry@c5199f791 | 24                 | 0.1         | 8.5%        | lint 13, build 7, test 11                  | 1       | 1                                | 0       |
| fix/doc-churn-usage@c3e987767                      | 9                  | 0.0         | 1.5%        | lint 7, typecheck 6, test 6                | 0       | 0                                | 0       |
| fix/ios-seal-and-photo@cfaf1831c                   | 21                 | 0.0         | 1.4%        | lint 17, typecheck 11                      | 0       | 0                                | 0       |
| fix/ios-ring-arcs-scroll@f252fe0ca                 | 15                 | 0.0         | 1.2%        | lint 12, typecheck 8                       | 0       | 0                                | 0       |
| feat/home-page@ad5081a1f                           | 0                  | 0.0         | 0.0%        |                                            | 0       | 0                                | 0       |

Most-repeated-without-an-edit strict gate commands (80-character key):

| command                                                                              | times re-run with no intervening edit |
| ------------------------------------------------------------------------------------ | ------------------------------------- |
| `cd "$(git rev-parse --show-toplevel)"; yarn prettier --check packages/attributio`   | 10                                    |
| `yarn build-tsc 2>&1 \| tail -40`                                                    | 9                                     |
| `cd /Users/eric/Code/okven.worktrees/eric-attribution-3/functions && yarn test sr`   | 8                                     |
| `cd /Users/eric/Code/okven.worktrees/feat-voice-notes/functions && yarn test src/`   | 7                                     |
| `yarn build-tsc 2>&1 \| tail -30`                                                    | 6                                     |
| `cd functions && yarn test 2>&1 \| tail -6`                                          | 5                                     |
| `cd /Users/eric/Code/okven.worktrees/fix-menu-pin/functions && yarn test src/util`   | 5                                     |
| `cd .. && yarn build-tsc 2>&1 \| grep "error TS" \| head -3; echo "--- tsc ok ---";` | 4                                     |
| `cd /Users/eric/Code/okven.worktrees/feat-specials-fixes/functions && yarn test s`   | 4                                     |
| `yarn build-tsc 2>&1 \| tail -20`                                                    | 4                                     |
| `yarn test src/utils/whatsapp-webhook/internal/routing/handleVoiceNote.test.ts 2>`   | 4                                     |
| `cd /Users/eric/Code/okven.worktrees/eric-attribution-3/hosting && yarn test comp`   | 3                                     |

## Run index

| run                                                | repo               | type    | route  | status    | mise ceiling | code lines | tasks | sessions     | wall h | active h | wait h | out tok | spawns | max depth | compactions |
| -------------------------------------------------- | ------------------ | ------- | ------ | --------- | ------------ | ---------- | ----- | ------------ | ------ | -------- | ------ | ------- | ------ | --------- | ----------- |
| feat/session-monitor@23a95b496                     | aydy               | feature | full   | open      | 2.0.0        | 43690      | 25    | 2 (1 pruned) | 306.7  | 25.6     | 280.0  | 4.52M   | 95     | 2         | 0           |
| eric/attribution-3@731401043                       | okven              | feature | full   | merged    | 2.1.0        | 52559      | 50    | 4 (1 pruned) | 155.5  | 54.2     | 101.3  | 8.85M   | 369    | 3         | 2           |
| feat/backfill-order-history@4a7c78e7f              | okven              | feature | direct | merged    | 2.0.0        | 1795       | 5     | 1 (1 pruned) | 27.0   | 5.1      | 22.0   | 522k    | 25     | 1         | 0           |
| feat/migrate-firebase-kit@3329fcef3                | okven              | feature | direct | merged    | 2.0.0        | 14366      | 7     | 1 (1 pruned) | 26.1   | 9.8      | 16.4   | 925k    | 30     | 2         | 0           |
| fix/unmark-all-reviewed-diff-base@8c89bf18a        | delta-review       | bugfix  | bugfix | merged    | 2.0.0        | 745        | 3     | 1 (1 pruned) | 4.5    | 1.2      | 4.2    | 251k    | 9      | 1         | 0           |
| feat/remove-backfill-order-history@ad3e4036c       | okven              | feature | direct | merged    | 2.0.0        | 1769       | 4     | 1 (1 pruned) | 1.9    | 1.2      | 0.9    | 185k    | 13     | 1         | 0           |
| feat/specials-fixes@e2931120d                      | okven              | feature | full   | merged    | 2.0.0        | 33798      | 20    | 4            | 222.8  | 53.5     | 169.4  | 7.50M   | 191    | 3         | 8           |
| fix/menu-preview-changes@54b283d8d                 | okven              | feature | full   | merged    | 2.0.0        | 3100       | 8     | 1            | 75.0   | 14.7     | 60.3   | 2.81M   | 86     | 2         | 0           |
| feat/blog@5d40a6c8a                                | ericvera.dev       | feature | full   | open      | 2.0.0        | 20861      | 23    | 1            | 64.6   | 30.9     | 33.1   | 4.04M   | 81     | 1         | 0           |
| feat/close-out-orders@997620e72                    | okven              | feature | full   | merged    | 2.0.0        | 4288       | 8     | 1            | 140.8  | 11.6     | 129.3  | 1.77M   | 68     | 2         | 2           |
| feat/home-page@ad5081a1f                           | originhypnosis     | feature |        | open      | 2.0.0        | 2556       | 0     | 1            | 32.6   | 4.3      | 28.3   | 1.44M   | 44     | 1         | 0           |
| feat/originhypnosis-site@627fcc805                 | metaforico         | feature | full   | merged    | 2.0.0        | 12686      | 15    | 3            | 27.5   | 15.6     | 11.8   | 2.11M   | 59     | 1         | 0           |
| fix/ios-seal-and-photo@cfaf1831c                   | metaforico         | bugfix  | bugfix | merged    | 2.0.0        | 289        | 1     | 1            | 16.8   | 1.2      | 15.5   | 228k    | 7      | 1         | 0           |
| fix/ios-ring-arcs-scroll@f252fe0ca                 | metaforico         | bugfix  | bugfix | merged    | 2.0.0        | 187        | 1     | 1            | 24.2   | 1.4      | 22.8   | 225k    | 6      | 1         | 0           |
| fix/menu-availability@ea5419d5e                    | okven              | bugfix  | bugfix | merged    | 2.0.0        | 63         | 2     | 1            | 19.4   | 3.1      | 16.3   | 240k    | 17     | 2         | 0           |
| fix/missing-image@a1e1f0a69                        | okven              | bugfix  | bugfix | merged    | 2.0.0        | 31         | 1     | 1            | 2.4    | 1.6      | 0.7    | 135k    | 13     | 1         | 0           |
| eric/attribution-3@aa365a440                       | okven              | feature | full   | abandoned | 2.0.0        | 71728      | 40    | 1            | 175.4  | 55.2     | 120.1  | 3.51M   | 247    | 3         | 12          |
| feat/voice-notes@88d930903                         | okven              | feature | full   | merged    | 2.0.0        | 8761       | 10    | 1            | 67.4   | 16.8     | 50.5   | 1.14M   | 119    | 2         | 0           |
| feat/first-time-offer@3f5c18367                    | okven              | feature | full   | open      | 2.1.0        | 11536      | 21    | 3            | 32.3   | 21.3     | 10.1   | 1.54M   | 89     | 2         | 0           |
| feat/tips@3d1a89e01                                | okven              | feature | full   | open      | 2.1.0        | 5583       | 17    | 2            | 24.3   | 13.7     | 10.5   | 1.16M   | 100    | 2         | 0           |
| feat/extraction-provenance@705558755               | delta-review       | feature | direct | open      | 2.0.0        | 3421       | 9     | 1            | 11.8   | 4.2      | 7.4    | 499k    | 41     | 2         | 0           |
| fix/voice-note-not-transcribed@54b2acca9           | okven              | bugfix  | bugfix | merged    | 2.0.0        | 1146       | 3     | 2            | 26.1   | 5.6      | 25.9   | 578k    | 30     | 1         | 0           |
| fix/menu-pin@06d873433                             | okven              | feature | full   | merged    | 2.0.0        | 17675      | 10    | 2            | 85.7   | 22.8     | 62.9   | 2.07M   | 103    | 2         | 0           |
| fix/doc-churn-usage@c3e987767                      | mise-claude-plugin | bugfix  | bugfix | merged    | 2.0.0        | 122        | 3     | 1            | 3.0    | 1.8      | 1.2    | 469k    | 11     | 1         | 0           |
| feat/keepalive-caller@62be8a224                    | firebase-kit       | feature | direct | merged    | 2.1.0        | 2173       | 6     | 1            | 5.1    | 3.2      | 1.8    | 711k    | 34     | 1         | 0           |
| fix/get-doc-with-cache-store-reset-retry@c5199f791 | firebase-kit       | bugfix  | bugfix | merged    | 2.1.0        | 345        | 2     | 1            | 1.8    | 0.8      | 0.9    | 205k    | 8      | 1         | 0           |
| feat/remove-k-prop-migration@beda70153             | okven              | feature | direct | merged    | 2.1.0        | 920        | 3     | 1            | 2.0    | 1.9      | 0.1    | 131k    | 16     | 1         | 0           |
| feat/upgrade-packages@1435d90a6                    | okven              | feature | direct | merged    | 2.1.0        | 274        | 1     | 1            | 14.9   | 4.8      | 10.1   | 526k    | 15     | 2         | 0           |

Nested subagent depth across the corpus:

| spawn depth | spawns |
| ----------- | ------ |
| 1           | 1418   |
| 2           | 503    |
| 3           | 5      |
