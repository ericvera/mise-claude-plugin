# mise driver flow — line-level mechanism inventory (MF)

365 rows over 496 non-blank lines in 8 files. `lineCount` = non-blank lines in the row's range; rows overlap where one line carries several rules, so the kind totals (531) exceed 496.

## 1. Counts and line totals by kind

| kind        | rows | lineCount |
| ----------- | ---- | --------- |
| rule        | 162  | 190       |
| artifact    | 28   | 108       |
| glue        | 68   | 74        |
| role        | 14   | 46        |
| script      | 28   | 39        |
| human-stop  | 19   | 24        |
| config-knob | 19   | 23        |
| gate        | 14   | 14        |
| loop        | 9    | 9         |
| stage       | 4    | 4         |
| **total**   | 365  | 531       |

Per file (rows / lineCount): plan.md 66/102 · SKILL.md 62/91 · execute.md 58/90 · interaction.md 52/79 · state-machine.md 33/53 · goals.md 37/48 · setup.md 40/41 · requirements.md 17/27.

`docs/state-machine.md` (53 non-blank lines) is never read at runtime by the skill — only `state.ts:7` and `README.md:17,98` reference it; all 33 rows are `firesWhen: script`.

## 2. Ten heaviest rows by lineCount

| id     | lc  | kind     | location                                    | name                           |
| ------ | --- | -------- | ------------------------------------------- | ------------------------------ |
| MF-136 | 12  | artifact | skills/next/stages/goals.md:49-69           | Mock context template          |
| MF-154 | 11  | artifact | skills/next/stages/requirements.md:22-39    | Requirements document template |
| MF-261 | 9   | role     | skills/next/stages/execute.md:85-94         | Dispatch acceptance            |
| MF-328 | 9   | artifact | skills/next/references/interaction.md:81-90 | Question format example        |
| MF-344 | 9   | artifact | docs/state-machine.md:21-29                 | State file example             |
| MF-008 | 8   | rule     | skills/next/SKILL.md:16-24                  | Copy the progress checklist    |
| MF-242 | 8   | role     | skills/next/stages/execute.md:36-44         | Dispatch a documenter          |
| MF-244 | 8   | role     | skills/next/stages/execute.md:48-56         | Dispatch a reviewer            |
| MF-049 | 7   | rule     | skills/next/SKILL.md:98-104                 | next_action to file table      |
| MF-238 | 7   | role     | skills/next/stages/execute.md:23-30         | Dispatch an implementer        |

## 3. Subagent spawn points

T = task count. Two-pass = config has a `documenter` line (execute.md:14).

| id         | site                                       | role                     | multiplier                      | worst case                     |
| ---------- | ------------------------------------------ | ------------------------ | ------------------------------- | ------------------------------ |
| MF-175     | plan.md:27                                 | explore                  | per run (plan stage), N         | N — no bound stated            |
| MF-301/156 | interaction.md:31 ← requirements.md:43     | critic                   | per round, per artifact version | 8 (ceiling, interaction.md:54) |
| MF-301/180 | interaction.md:31 ← plan.md:36, plan.md:20 | critic                   | per round, per artifact version | 8 (ceiling)                    |
| MF-238     | execute.md:23-30                           | implementer              | per task                        | T                              |
| MF-241     | execute.md:34                              | implementer              | ≤1 per task (stuck retry)       | T                              |
| MF-242     | execute.md:36-44                           | documenter               | per task (two-pass)             | T                              |
| MF-243     | execute.md:46                              | documenter               | ≤1 per task (stuck retry)       | T                              |
| MF-244     | execute.md:48-56                           | reviewer                 | 1 per task                      | T                              |
| MF-246     | execute.md:60                              | implementer              | ≤1 per task (single-pass fix)   | T                              |
| MF-247     | execute.md:61                              | implementer + documenter | ≤2 per task (two-pass fix)      | 2T                             |
| MF-257     | execute.md:78                              | documenter               | ≤1 per gate run (prose repair)  | 1 + F                          |
| MF-258     | execute.md:79                              | implementer              | ≤1 per gate run                 | 1 + F                          |
| MF-261     | execute.md:85-94                           | acceptance               | 1 per acceptance round          | 1 + F                          |
| MF-263     | execute.md:97                              | implementer/documenter   | ≤2 per flagged round            | 2F                             |
| MF-266     | execute.md:100-104                         | retrospective            | ≤1 per run                      | 1                              |

F = user-flagged acceptance rounds (execute.md:97 states no bound).

Worst-case spawns for a run with T tasks:

- full/direct route, two-pass: **7T + 19 + N + 4F** (7 per task = 3 implementer + 3 documenter + 1 reviewer; 19 = 16 critic + 1 gate repair + 1 acceptance + 1 retrospective).
- full/direct route, single pass: **4T + 19 + N + 3F**.
- bugfix route (no requirements stage, no explore step), two-pass, T=2 by plan.md:15: **25**.

## 4. Human stops

Type: `blocking-question` waits for an answer and continues; `terminal-stop` ends the run.

| id             | location                          | type              | waits for                                                      |
| -------------- | --------------------------------- | ----------------- | -------------------------------------------------------------- |
| MF-012         | SKILL.md:30                       | terminal-stop     | `?` usage print                                                |
| MF-028         | SKILL.md:60                       | terminal-stop     | missing/old node                                               |
| MF-032         | SKILL.md:64                       | terminal-stop     | broken state file (also MF-361/363, state-machine.md:72,75)    |
| MF-037         | SKILL.md:73                       | terminal-stop     | work already in flight + a description                         |
| MF-038         | SKILL.md:74-76                    | blocking-question | pick a backlog item or describe the work                       |
| MF-040         | SKILL.md:81                       | blocking-question | bug fix or new feature                                         |
| MF-044         | SKILL.md:85                       | blocking-question | use this branch or create one                                  |
| MF-046         | SKILL.md:88                       | blocking-question | what's the goal for this work                                  |
| MF-051         | SKILL.md:107                      | blocking-question | backlog prompt again after acceptance                          |
| MF-022/023/024 | SKILL.md:46,47,48                 | blocking-question | config gate → setup interview                                  |
| MF-064..MF-096 | setup.md:3-41                     | blocking-question | 12 interview items, 1-3 questions per turn (interaction.md:79) |
| MF-099         | setup.md:47                       | blocking-question | confirm the written config                                     |
| MF-111         | goals.md:14                       | blocking-question | repro steps / expected vs actual                               |
| MF-114         | goals.md:17                       | blocking-question | bugfix gate: confirm understanding + test location             |
| MF-121         | goals.md:29                       | blocking-question | the one batched feature question round                         |
| MF-129         | goals.md:39                       | blocking-question | mock route, only if genuinely ambiguous                        |
| MF-138         | goals.md:73                       | blocking-question | goals/mock iteration, unbounded                                |
| MF-139/287/288 | goals.md:75, interaction.md:11,12 | blocking-question | explicit "approve goals" — gate 1 of 2                         |
| MF-231         | execute.md:11                     | terminal-stop     | baseline gate failure                                          |
| MF-240         | execute.md:33                     | terminal-stop     | implementer `blocked`                                          |
| MF-241         | execute.md:34                     | terminal-stop     | second `stuck` failure                                         |
| MF-248         | execute.md:63                     | terminal-stop     | fix round without a clean report                               |
| MF-256         | execute.md:76                     | terminal-stop     | second gate failure                                            |
| MF-262         | execute.md:96                     | blocking-question | acceptance verdicts → close out? — gate 2 of 2                 |
| MF-267         | execute.md:106                    | blocking-question | which retrospective proposals to adopt                         |
| MF-270         | execute.md:110                    | blocking-question | Ship value or merge style when unrecorded                      |
| MF-272         | execute.md:114                    | terminal-stop     | ambiguity the overview and config cannot resolve               |
| MF-273         | execute.md:114                    | terminal-stop     | task authorizes a red intermediate state                       |
| MF-316         | interaction.md:55-59              | blocking-question | critic stall — the only stop between the two gates             |
| MF-321         | interaction.md:71                 | blocking-question | doc contradiction or irreducible gap                           |

interaction.md:7 (MF-284) claims exactly two human gates; the table above shows 30 distinct stop sites, 11 of them terminal.

## 5. Loops and exit conditions

| id     | location            | loop                                       | exit                                                                                                                                                                                |
| ------ | ------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MF-055 | SKILL.md:111 (+:23) | dispatch next stage in-session             | next_action is a human gate, an execute stop, or close_out; ~4 iterations                                                                                                           |
| MF-138 | goals.md:73         | iterate goals + mocks                      | the user approves — no bound stated                                                                                                                                                 |
| MF-288 | interaction.md:12   | revise and re-present at the gate          | explicit yes — no bound stated                                                                                                                                                      |
| MF-306 | interaction.md:43   | critic round                               | zero blocking findings (`:42`), a stall trigger (`:53`), or budget 5 / ceiling 8 (`:54`); a mid-loop rewrite resets the budget (`:54`), a user-directed round may exceed it (`:54`) |
| MF-237 | execute.md:21       | TODO list over tasks                       | list empty; T iterations                                                                                                                                                            |
| MF-241 | execute.md:34       | stuck retry                                | success, or a second failure → stop                                                                                                                                                 |
| MF-245 | execute.md:58       | review → fix round                         | one round only; anything but a clean report → stop                                                                                                                                  |
| MF-256 | execute.md:76       | gate → repair → re-run gate                | gate passes, or a second failure → stop                                                                                                                                             |
| MF-263 | execute.md:97       | acceptance-blocker fix → gate → acceptance | the user confirms — no bound stated                                                                                                                                                 |

Two more loops are engine-driven, not in the stage files: the mismatch cascade re-running reopened stages (MF-355, state-machine.md:62) and a cleared `done/` re-executing every task of a revised plan (MF-353, state-machine.md:56).

## 6. Instructions stated more than once

| instruction                                                      | locations                                                                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Commit the mise directory at every checkpoint                    | SKILL.md:42 · interaction.md:14 · interaction.md:19 · interaction.md:67 · setup.md:53 · goals.md (via gate) · execute.md:65 · execute.md:98 · execute.md:109 |
| Friction line format and "log friction here"                     | interaction.md:19 (owner) · interaction.md:21-26 · :45-50 · :55-59 · :61-65 · execute.md:32 · :46 · :58 · :76 · :97                                          |
| Continue in-session; never stop between self-approving stages    | SKILL.md:23 · SKILL.md:111 · SKILL.md:117 · interaction.md:15 · interaction.md:67                                                                            |
| Never guess silently / never ask what is already decided         | SKILL.md:81 · SKILL.md:84 · SKILL.md:111 · SKILL.md:116 · goals.md:39                                                                                        |
| Cite a Test exception and its substitute verification            | setup.md:20 · setup.md:34 · goals.md:15 · plan.md:18 · plan.md:116-120 · plan.md:126-130 · plan.md:138 · plan.md:148 · plan.md:159                           |
| Verification / Tests named in every task                         | plan.md:116-120 · plan.md:126-130 · plan.md:138 · plan.md:147                                                                                                |
| Copy matching Skills & guides entries into the task file         | setup.md:35 · plan.md:16 · plan.md:107-110 · plan.md:137                                                                                                     |
| Retry bounds (1 stuck retry, 1 fix round, 1 gate repair)         | execute.md:34 · execute.md:46 · execute.md:58 · execute.md:76 · execute.md:120                                                                               |
| Never skip baseline gate / end-of-plan gate / acceptance         | execute.md:11 · execute.md:69 · execute.md:114 · execute.md:118                                                                                              |
| Two human gates; never ask approval for requirements/plan        | SKILL.md:111 · SKILL.md:115 · goals.md:3 · interaction.md:7                                                                                                  |
| Route decided before, and recorded with, the goals approval      | goals.md:39 · goals.md:75 · interaction.md:13 · state-machine.md:13 · state-machine.md:35                                                                    |
| Changed re-approval deletes every later approval                 | interaction.md:13 · state-machine.md:14 · state-machine.md:62                                                                                                |
| State only through the engine; never hand-edit                   | SKILL.md:41 · SKILL.md:118 · state-machine.md:3                                                                                                              |
| Broken state → relay the two options and stop                    | SKILL.md:64 · state-machine.md:72 · state-machine.md:75                                                                                                      |
| Artifact existence is never approval                             | SKILL.md:106 · state-machine.md:63                                                                                                                           |
| Reopened artifact is revised, never regenerated                  | goals.md:7 · requirements.md:11 · plan.md:9                                                                                                                  |
| Record non-obvious inferences under Assumptions                  | requirements.md:20 · requirements.md:22-39 · plan.md:58-60 · interaction.md:71                                                                               |
| Critic gate invocation (same gate, three call sites)             | interaction.md:31 · requirements.md:43 · plan.md:20 · plan.md:36                                                                                             |
| Task must not exceed its declared files                          | setup.md:22 · plan.md:103-105 · plan.md:142                                                                                                                  |
| Done = the task file sits in `done/`                             | execute.md:10 · execute.md:65 · state-machine.md:31 · state-machine.md:54                                                                                    |
| One piece of work per branch (in-flight = directory has content) | SKILL.md:68 · SKILL.md:73 · state-machine.md:11 · state-machine.md:31 · state-machine.md:79                                                                  |
| Never delete the directory / ship before confirmation            | SKILL.md:119 · setup.md:51 · execute.md:109 · execute.md:121 · state-machine.md:66                                                                           |
| Model routing / seven roles                                      | setup.md:39 · execute.md:5 · interaction.md:75                                                                                                               |
| Question format (1-3 numbered, lettered, Recommend line)         | interaction.md:79 · :81-90 · :92 · :94-96 · setup.md:7 · goals.md:14 · goals.md:29                                                                           |
| Numbered lists so the user can answer by number                  | interaction.md:100 · SKILL.md:74-76 · execute.md:106                                                                                                         |
| Retrospective edits guidance only, never source                  | setup.md:30 · execute.md:108 · execute.md:122                                                                                                                |
| e2e mandatory for user-facing work                               | plan.md:148 · plan.md:159                                                                                                                                    |
| Migration command from the config                                | setup.md:36 · plan.md:152                                                                                                                                    |
| Retrospective on/off                                             | setup.md:40 · execute.md:98                                                                                                                                  |
| Ship value                                                       | setup.md:41 · execute.md:110                                                                                                                                 |
| Backlog prompt                                                   | SKILL.md:74-76 · SKILL.md:107                                                                                                                                |
| Regression test must fail before the fix                         | setup.md:23 · plan.md:16                                                                                                                                     |
| Orchestrator/dispatcher does no work itself                      | SKILL.md:14 · execute.md:5                                                                                                                                   |
| No red intermediate state                                        | plan.md:143 · execute.md:114                                                                                                                                 |
