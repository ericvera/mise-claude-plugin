# mise roles, config surface and state engine — line-level inventory

Rows: **425** over 13 files (`docs/v3-research/inventory/mise-roles.jsonl`). Every non-blank line of the 12 markdown files is inside at least one row (checked by `tools/build_roles_inventory.py`); `state.ts` is one row per enforced invariant, transition or command. Rows share line ranges where one line carries several instructions, so `lineCount` sums exceed file lengths; the "distinct lines" column is the deduplicated count.

`runtimeCost` convention: a plain instruction inside a role file is `none` (it costs only words in a context that spawns anyway). `subagent-spawn` marks the row that causes a spawn, `tool-run` a row mandating a command, `loop-multiplier` a row that creates iteration, `driver-context` a file the orchestrator itself loads, `human-wait` a row that blocks on the user.

## 1. Counts

### By kind

| kind        | rows | sum lineCount | distinct lines |
| ----------- | ---- | ------------- | -------------- |
| rule        | 215  | 222           | 152            |
| glue        | 81   | 119           | 112            |
| script      | 43   | 428           | 418            |
| config-knob | 35   | 35            | 31             |
| gate        | 21   | 21            | 18             |
| artifact    | 14   | 137           | 137            |
| role        | 6    | 6             | 6              |
| stage       | 6    | 7             | 7              |
| human-stop  | 2    | 2             | 2              |
| loop        | 2    | 2             | 2              |

### By file / role

| file                                       | role          | lines | non-blank | rows | behavioural | glue | rows w/ spawn cost |
| ------------------------------------------ | ------------- | ----- | --------- | ---- | ----------- | ---- | ------------------ |
| skills/next/roles/critic.md                | critic        | 20    | 13        | 24   | 21          | 3    | 1                  |
| skills/next/roles/reviewer.md              | reviewer      | 18    | 13        | 23   | 20          | 3    | 1                  |
| skills/next/roles/acceptance.md            | acceptance    | 25    | 17        | 16   | 13          | 3    | 1                  |
| skills/next/roles/documenter.md            | documenter    | 37    | 26        | 34   | 31          | 3    | 1                  |
| skills/next/roles/implementer.md           | implementer   | 67    | 47        | 58   | 53          | 5    | 1                  |
| skills/next/roles/retrospective.md         | retrospective | 61    | 42        | 55   | 48          | 7    | 1                  |
| skills/next/references/config-reference.md | —             | 94    | 64        | 44   | 41          | 3    | 3                  |
| .claude/mise-config.md                     | —             | 36    | 23        | 23   | 16          | 7    | 6                  |
| .claude/mise-checklist.md                  | —             | 15    | 10        | 10   | 7           | 3    | 1                  |
| docs/skill-authoring.md                    | —             | 51    | 39        | 42   | 34          | 8    | 3                  |
| CLAUDE.md                                  | —             | 7     | 4         | 4    | 3           | 1    | 0                  |
| README.md                                  | —             | 102   | 74        | 48   | 14          | 34   | 7                  |
| skills/next/scripts/state.ts               | —             | 601   | 482       | 44   | 43          | 1    | 1                  |

### Reach of the shared files

| file                                       | read by                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| skills/next/references/config-reference.md | setup stage only (never shipped into a project)                           |
| .claude/mise-config.md                     | every stage + every subagent (all 7 roles)                                |
| .claude/mise-checklist.md                  | implementer, documenter, reviewer, acceptance, retrospective              |
| docs/skill-authoring.md                    | any role touching instruction files, via mise-config.md:25 (not required) |
| CLAUDE.md                                  | every session in this repo                                                |
| README.md                                  | the user only — never loaded by the workflow                              |
| skills/next/scripts/state.ts               | the orchestrator, as a Bash command                                       |

### Cost-bearing rows (non-`none` runtimeCost)

| runtimeCost     | rows |
| --------------- | ---- |
| none            | 339  |
| tool-run        | 31   |
| subagent-spawn  | 27   |
| loop-multiplier | 16   |
| human-wait      | 10   |
| driver-context  | 9    |

## 2. Per role: what it is told to check or produce

`also checked by` lists every other row whose `overlapsWith` ties it to the same failure or instruction; a row naming 2+ other roles is a duplicated check.

**93 direct cross-role duplication links**; **52** of the 186 behavioural role rows restate something 2+ other roles are also told.

| role pair                   | shared instructions |
| --------------------------- | ------------------- |
| documenter ↔ implementer    | 25                  |
| implementer ↔ reviewer      | 10                  |
| critic ↔ reviewer           | 9                   |
| acceptance ↔ reviewer       | 8                   |
| critic ↔ implementer        | 8                   |
| critic ↔ retrospective      | 7                   |
| documenter ↔ reviewer       | 7                   |
| acceptance ↔ critic         | 5                   |
| critic ↔ documenter         | 4                   |
| retrospective ↔ reviewer    | 3                   |
| acceptance ↔ implementer    | 2                   |
| acceptance ↔ retrospective  | 2                   |
| acceptance ↔ documenter     | 2                   |
| implementer ↔ retrospective | 1                   |

Role rows duplicated across 2+ other roles:

| other roles | id     | instruction                                     | also in                                                      |
| ----------- | ------ | ----------------------------------------------- | ------------------------------------------------------------ |
| 5           | MR-003 | Read artifact, upstream, config                 | acceptance, documenter, implementer, retrospective, reviewer |
| 5           | MR-024 | Final message goes to orchestrator              | acceptance, documenter, implementer, retrospective, reviewer |
| 4           | MR-004 | Read matching Skills and guides                 | documenter, implementer, retrospective, reviewer             |
| 3           | MR-002 | Fresh-context critic, never edits               | acceptance, retrospective, reviewer                          |
| 3           | MR-023 | Say no blocking findings explicitly             | documenter, retrospective, reviewer                          |
| 3           | MR-029 | Read the config's checklist file                | acceptance, documenter, implementer                          |
| 3           | MR-035 | Missing test coverage                           | acceptance, critic, implementer                              |
| 3           | MR-046 | Exactly 'none' when clean                       | critic, documenter, retrospective                            |
| 3           | MR-074 | Read config commands and guides                 | critic, implementer, reviewer                                |
| 3           | MR-109 | Read config commands, checklist, guides, models | critic, documenter, reviewer                                 |
| 3           | MR-206 | Exact no-proposals phrase                       | critic, retrospective, reviewer                              |
| 2           | MR-014 | Plan: e2e covers user-facing behavior           | implementer, reviewer                                        |
| 2           | MR-017 | Plan: guides attached to tasks                  | implementer, reviewer                                        |
| 2           | MR-022 | Only downstream-breaking defects                | retrospective, reviewer                                      |
| 2           | MR-026 | Fresh-context reviewer, never fixes             | acceptance, critic                                           |
| 2           | MR-027 | Read task, commits, config, log                 | acceptance, critic                                           |
| 2           | MR-028 | Run git show per commit                         | acceptance, documenter                                       |
| 2           | MR-030 | Read guides targeting this review               | critic, retrospective                                        |
| 2           | MR-033 | Guides the work does not follow                 | critic, implementer                                          |
| 2           | MR-036 | Two-pass: review documenter's prose             | acceptance, documenter                                       |
| 2           | MR-037 | User-facing copy vs goals and mocks             | documenter, implementer                                      |
| 2           | MR-038 | Merge checklist answers across commits          | documenter, implementer                                      |
| 2           | MR-040 | Answer n-a rules yourself                       | acceptance, implementer                                      |
| 2           | MR-044 | Only correctness, spec, guide, checklist        | critic, retrospective                                        |
| 2           | MR-045 | Tag defects prose or not-prose                  | critic, implementer                                          |
| 2           | MR-049 | Fresh-context acceptance, fixes nothing         | critic, reviewer                                             |
| 2           | MR-050 | Read requirements, overview, log, config        | critic, reviewer                                             |
| 2           | MR-051 | Inspect branch commits                          | retrospective, reviewer                                      |
| 2           | MR-055 | Run substitute verification sparingly           | implementer, reviewer                                        |
| 2           | MR-058 | Prose rules over Docs commits                   | documenter, reviewer                                         |
| 2           | MR-067 | Never touch user-facing copy                    | implementer, reviewer                                        |
| 2           | MR-068 | Read progress log and config                    | critic, implementer                                          |
| 2           | MR-084 | Every Prose rule pass or n-a                    | acceptance, reviewer                                         |
| 2           | MR-089 | Commit prose with the log entry                 | acceptance, implementer                                      |
| 2           | MR-090 | Checklist answers in the body                   | implementer, reviewer                                        |
| 2           | MR-095 | Nothing-to-document report                      | critic, reviewer                                             |
| 2           | MR-100 | Dispatch names config and log                   | critic, documenter                                           |
| 2           | MR-106 | Plan started green, failures are yours          | critic, implementer                                          |
| 2           | MR-114 | Apply matching config guides anyway             | critic, documenter                                           |
| 2           | MR-123 | Copy comes from goals and mocks                 | documenter, reviewer                                         |
| 2           | MR-130 | Run cited Test exception verification           | acceptance, reviewer                                         |
| 2           | MR-131 | Never run pre-existing e2e suites               | acceptance, critic                                           |
| 2           | MR-133 | Three failures with no hypothesis stops         | documenter, implementer                                      |
| 2           | MR-135 | Self-review the diff                            | implementer, reviewer                                        |
| 2           | MR-136 | Answer every checklist rule                     | documenter, reviewer                                         |
| 2           | MR-140 | Progress-log entry template                     | documenter, retrospective                                    |
| 2           | MR-142 | Commit work and log together                    | documenter, reviewer                                         |
| 2           | MR-158 | Propose only, never edit                        | critic, retrospective                                        |
| 2           | MR-166 | Read the run's governing guidance               | critic, reviewer                                             |
| 2           | MR-180 | Fifteen-rule cap forces merges                  | acceptance, retrospective                                    |
| 2           | MR-199 | Never a cosmetic wording preference             | critic, reviewer                                             |
| 2           | MR-200 | An empty report is a success                    | critic, retrospective                                        |

### critic (`skills/next/roles/critic.md`, 21 behavioural rows)

| id     | line | name                                  | does                                                                                    | also checked by                                                                                                         |
| ------ | ---- | ------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| MR-002 | 3    | Fresh-context critic, never edits     | One subagent reviews one artifact and reports defects; never edits it                   | README:MR-318, acceptance:MR-049, retrospective:MR-158, reviewer:MR-026, skill-authoring:MR-269, skill-authoring:MR-282 |
| MR-003 | 3    | Read artifact, upstream, config       | Read the named artifact, its upstream docs, the mise config and the kind                | acceptance:MR-050, documenter:MR-068, implementer:MR-100, implementer:MR-109, retrospective:MR-160, reviewer:MR-027     |
| MR-004 | 3    | Read matching Skills and guides       | Read Skills & guides entries whose conditions match the artifact's subject              | config-reference:MR-240, documenter:MR-074, implementer:MR-114, retrospective:MR-166, reviewer:MR-030                   |
| MR-006 | 7    | Requirements: find contradictions     | Check requirements against goals and mocks for contradictions                           | —                                                                                                                       |
| MR-007 | 7    | Requirements: unaddressed goals       | Flag goals, logged tweaks or new concepts no requirement addresses                      | acceptance:MR-053                                                                                                       |
| MR-008 | 7    | Requirements: untestable or missing   | Flag untestable or missing requirements                                                 | —                                                                                                                       |
| MR-009 | 7    | Requirements: scope drift             | Flag scope drift from the goals                                                         | —                                                                                                                       |
| MR-010 | 9    | Plan judged against requirements      | Check the plan against requirements, or against goals on the bugfix route               | README:MR-330                                                                                                           |
| MR-011 | 11   | Plan: REQ traceability                | Flag REQ-* IDs no task addresses, or addressed but untraced in the Task Index           | acceptance:MR-053                                                                                                       |
| MR-012 | 12   | Plan: tasks must end green            | Flag tasks that cannot end green                                                        | implementer:MR-106                                                                                                      |
| MR-013 | 13   | Plan: verify file references          | Flag paths that do not exist, wrong file:line, or symbols absent from the named file    | —                                                                                                                       |
| MR-014 | 14   | Plan: e2e covers user-facing behavior | Flag user-facing behavior no e2e test covers and no Test exception excuses              | implementer:MR-129, mise-config:MR-362, reviewer:MR-035                                                                 |
| MR-015 | 14   | Where plan e2e coverage lives         | E2e coverage is the overview's End-of-plan gate section plus tasks' own e2e tests       | —                                                                                                                       |
| MR-016 | 14   | Task silence is not a finding         | Task files never name a pre-existing suite, so their silence about one is not a finding | implementer:MR-131                                                                                                      |
| MR-017 | 15   | Plan: guides attached to tasks        | Flag Skills & guides entries missing from a task their conditions match                 | implementer:MR-114, reviewer:MR-033                                                                                     |
| MR-018 | 16   | Plan: five-source-file task cap       | Any task over 5 source files without a Task Index justification is always blocking      | README:MR-319, skill-authoring:MR-285                                                                                   |
| MR-020 | 20   | Tag each defect by severity           | Report defects as a list tagged blocking, minor or informative                          | reviewer:MR-045                                                                                                         |
| MR-021 | 20   | Re-verify every blocker               | Re-verify each blocker against the artifact's text before reporting it                  | —                                                                                                                       |
| MR-022 | 20   | Only downstream-breaking defects      | Report only defects a downstream stage would build wrong, plus the guardrail breach     | retrospective:MR-199, reviewer:MR-044, skill-authoring:MR-284                                                           |
| MR-023 | 20   | Say no blocking findings explicitly   | Say 'no blocking findings' explicitly when nothing blocks                               | documenter:MR-095, retrospective:MR-200, retrospective:MR-206, reviewer:MR-046                                          |
| MR-024 | 20   | Final message goes to orchestrator    | Address the final message to an orchestrator, not the user                              | acceptance:MR-063, documenter:MR-097, implementer:MR-151, retrospective:MR-207, reviewer:MR-047                         |

### reviewer (`skills/next/roles/reviewer.md`, 20 behavioural rows)

| id     | line | name                                     | does                                                                                   | also checked by                                                                                                             |
| ------ | ---- | ---------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| MR-026 | 3    | Fresh-context reviewer, never fixes      | One subagent checks one task's committed work and reports defects, never fixing them   | acceptance:MR-049, critic:MR-002, skill-authoring:MR-269, skill-authoring:MR-282                                            |
| MR-027 | 3    | Read task, commits, config, log          | Read the task file, commit hashes, the mise config and the progress log                | acceptance:MR-050, critic:MR-003                                                                                            |
| MR-028 | 3    | Run git show per commit                  | Run git show for every commit hash in the dispatch                                     | acceptance:MR-051, documenter:MR-076                                                                                        |
| MR-029 | 3    | Read the config's checklist file         | Read the file named by the config's Checklist: value                                   | acceptance:MR-050, documenter:MR-074, implementer:MR-109, mise-checklist:MR-373                                             |
| MR-030 | 3    | Read guides targeting this review        | Read Skills & guides entries whose conditions target reviewing this kind of work       | critic:MR-004, retrospective:MR-166                                                                                         |
| MR-032 | 7    | Task-spec requirements the diff misses   | Flag task-spec requirements the diff does not satisfy                                  | implementer:MR-135, mise-checklist:MR-378                                                                                   |
| MR-033 | 8    | Guides the work does not follow          | Flag the task's Guides entries the work does not follow                                | critic:MR-017, implementer:MR-113                                                                                           |
| MR-034 | 9    | Bugs, security holes, debug code         | Flag correctness bugs, security holes and leftover debug code                          | implementer:MR-135, mise-checklist:MR-375                                                                                   |
| MR-035 | 10   | Missing test coverage                    | Flag missing test coverage no Test exception cited in the task file excuses            | acceptance:MR-055, config-reference:MR-238, critic:MR-014, implementer:MR-130, mise-checklist:MR-376, mise-checklist:MR-379 |
| MR-036 | 11   | Two-pass: review documenter's prose      | In two-pass mode review the documenter's comments, docstrings and markdown docs        | acceptance:MR-058, documenter:MR-081, documenter:MR-084, mise-checklist:MR-381                                              |
| MR-037 | 12   | User-facing copy vs goals and mocks      | Flag user-facing copy that departs from the approved goals and mocks                   | documenter:MR-067, implementer:MR-123                                                                                       |
| MR-038 | 13   | Merge checklist answers across commits   | Merge Checklist answers across the commits; any commit's pass counts as pass           | documenter:MR-090, implementer:MR-142                                                                                       |
| MR-039 | 13   | Confirm each pass against the diff       | Confirm every checklist rule answered pass against the diff                            | README:MR-322, implementer:MR-136, mise-checklist:MR-373, skill-authoring:MR-286                                            |
| MR-040 | 13   | Answer n-a rules yourself                | Answer for yourself every rule left n-a or whose evidence the diff cannot confirm      | README:MR-322, acceptance:MR-057, implementer:MR-144                                                                        |
| MR-041 | 13   | Wrong answer is a defect                 | Report a wrong checklist answer as a defect naming its rule number                     | README:MR-322                                                                                                               |
| MR-042 | 14   | Missing Checklist line is a defect       | Flag commits with no Checklist: line                                                   | acceptance:MR-057                                                                                                           |
| MR-044 | 18   | Only correctness, spec, guide, checklist | Report only correctness, task-spec, guide and checklist failures; ignore cosmetic nits | critic:MR-022, retrospective:MR-199, skill-authoring:MR-284                                                                 |
| MR-045 | 18   | Tag defects prose or not-prose           | Tag each defect prose or not-prose so the orchestrator routes it to the right fixer    | critic:MR-020, implementer:MR-104                                                                                           |
| MR-046 | 18   | Exactly 'none' when clean                | Return exactly `none` when there is nothing to report                                  | critic:MR-023, documenter:MR-095, retrospective:MR-206                                                                      |
| MR-047 | 18   | Final message goes to orchestrator       | Address the final message to an orchestrator                                           | critic:MR-024                                                                                                               |

### acceptance (`skills/next/roles/acceptance.md`, 13 behavioural rows)

| id     | line  | name                                     | does                                                                                             | also checked by                                                                             |
| ------ | ----- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| MR-049 | 3     | Fresh-context acceptance, fixes nothing  | One subagent verifies the finished branch against its requirements and returns verdicts          | critic:MR-002, reviewer:MR-026, skill-authoring:MR-269                                      |
| MR-050 | 3     | Read requirements, overview, log, config | Read requirements (goals on bugfix), plan overview, progress log, config, gate results           | critic:MR-003, reviewer:MR-027, reviewer:MR-029                                             |
| MR-051 | 3     | Inspect branch commits                   | Inspect the branch's commits with git log and git show                                           | retrospective:MR-165, reviewer:MR-028                                                       |
| MR-053 | 7     | A verdict per requirement                | Give every requirement, or goal on the bugfix route, a verdict                                   | README:MR-326, critic:MR-007, critic:MR-011                                                 |
| MR-054 | 8     | Never re-run e2e or sanity               | Take the end-of-plan gate's results as given; never re-run the e2e and sanity suites             | README:MR-325, implementer:MR-131                                                           |
| MR-055 | 8     | Run substitute verification sparingly    | Run a Test exception's substitute verification only where a requirement allows no other check    | config-reference:MR-238, implementer:MR-130, reviewer:MR-035                                |
| MR-056 | 9     | Find each done task's commits            | Run git log --grep '^Task <ID>:' over default..HEAD for every Task Index entry                   | state:MR-397                                                                                |
| MR-057 | 9     | Task without Checklist line fails        | A done task with no Checklist: line in any commit becomes a not-verified item                    | README:MR-326, reviewer:MR-040, reviewer:MR-042                                             |
| MR-058 | 10    | Prose rules over Docs commits            | Answer the checklist's Prose rules against the branch's Docs: commits; each fail is not-verified | README:MR-326, documenter:MR-084, documenter:MR-089, mise-checklist:MR-381, reviewer:MR-036 |
| MR-060 | 14-23 | Verdict report template                  | Fenced template: one line per requirement, task, prose rule, then a Notes section                | skill-authoring:MR-276                                                                      |
| MR-061 | 25    | Only verified or not verified            | verified and not verified are the only verdicts                                                  | —                                                                                           |
| MR-062 | 25    | Notes holds the unverifiable             | Put what is neither verdict in Notes: an over-15-rule checklist, anything unverifiable           | config-reference:MR-226, retrospective:MR-180                                               |
| MR-063 | 25    | Orchestrator relays, user confirms       | Final message goes to an orchestrator; the user confirms the verdicts or flags items             | README:MR-326, critic:MR-024                                                                |

### documenter (`skills/next/roles/documenter.md`, 31 behavioural rows)

| id     | line  | name                                    | does                                                                                          | also checked by                                                                                        |
| ------ | ----- | --------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| MR-065 | 3     | Fresh-context documenter writes prose   | One subagent writes comments, docstrings and markdown docs for one set of commits             | README:MR-323, config-reference:MR-246, implementer:MR-110, implementer:MR-119, skill-authoring:MR-269 |
| MR-066 | 3     | Never change code behavior              | Never change code behavior                                                                    | —                                                                                                      |
| MR-067 | 3     | Never touch user-facing copy            | Never touch user-facing copy                                                                  | implementer:MR-123, reviewer:MR-037                                                                    |
| MR-068 | 3     | Read progress log and config            | Read the progress log and the mise config named in the dispatch                               | critic:MR-003, implementer:MR-100, implementer:MR-111                                                  |
| MR-069 | 5     | Task dispatch fixes the log heading     | A Task file: dispatch fixes the progress-log heading `## Docs <ID> — <one line>`              | implementer:MR-103                                                                                     |
| MR-070 | 5     | Fix-scope dispatch heading              | A Fix scope: dispatch covers gate repairs or acceptance fixes; heading `## Docs — <one line>` | implementer:MR-105                                                                                     |
| MR-071 | 6     | Commits parameter                       | The Commits: line names the commits whose changes need prose                                  | —                                                                                                      |
| MR-072 | 7     | Defects parameter on correction round   | On a correction round Defects: carries the prose defects to fix                               | —                                                                                                      |
| MR-074 | 11    | Read config commands and guides         | Read Format, Check, the Checklist: file and Skills & guides entries matching comments or docs | critic:MR-004, implementer:MR-109, reviewer:MR-029                                                     |
| MR-075 | 11    | Required guides are mandatory           | Follow matching guides; required ones mandatorily                                             | config-reference:MR-241, implementer:MR-114                                                            |
| MR-076 | 12    | Scope is the named commits' diff        | Resolve scope to the diff of each commit in Commits: (git show) plus the defects              | reviewer:MR-028                                                                                        |
| MR-077 | 12    | Never widen scope                       | Never document beyond that scope                                                              | implementer:MR-153, mise-checklist:MR-378                                                              |
| MR-078 | 13    | Read task, defects, progress log        | Read the task file or scope line, the defects list, and the progress log                      | implementer:MR-111                                                                                     |
| MR-079 | 13    | Task lists the docs it requires         | Task Files to modify/create entries name the markdown docs the task requires                  | —                                                                                                      |
| MR-080 | 14    | Defects first, then file by file        | Work file by file through the diff, fixing listed defects before anything else                | —                                                                                                      |
| MR-081 | 14    | Write and refresh comments              | Add and update comments and docstrings for changed code; fix comments the change made stale   | mise-checklist:MR-381, reviewer:MR-036                                                                 |
| MR-082 | 14    | Fill Check stubs, write the docs        | Fill the doc-comment stubs Check demanded and write or update the required markdown docs      | implementer:MR-122                                                                                     |
| MR-083 | 15    | Answer checklist against own diff       | Answer the config's Checklist: file against the staged and unstaged diff before committing    | implementer:MR-136, mise-checklist:MR-373                                                              |
| MR-084 | 15    | Every Prose rule pass or n-a            | Resolve every ## Prose rule to pass or n-a before committing                                  | acceptance:MR-058, reviewer:MR-036                                                                     |
| MR-085 | 15    | Code rules answered prose only          | Answer every ## Code rule `n-a — prose only`                                                  | implementer:MR-137                                                                                     |
| MR-086 | 16    | Run Format then Check, no tests         | Run the config's Format, then Check; never tests                                              | implementer:MR-125                                                                                     |
| MR-087 | 16    | Fix and re-run on failure               | On a failure, fix and re-run the command                                                      | implementer:MR-133                                                                                     |
| MR-088 | 16    | Three failures with no hypothesis stops | After 3 consecutive failures with no new hypothesis, stop and report stuck                    | implementer:MR-133, skill-authoring:MR-289                                                             |
| MR-089 | 17    | Commit prose with the log entry         | Commit the prose and the progress-log entry together with a `Docs:` subject                   | acceptance:MR-058, implementer:MR-139, implementer:MR-142, skill-authoring:MR-288                      |
| MR-090 | 17    | Checklist answers in the body           | Put the checklist answers in the commit body                                                  | implementer:MR-142, reviewer:MR-038                                                                    |
| MR-091 | 19-21 | Progress-log entry template             | Fenced template: a single `- Key changes:` line                                               | implementer:MR-140                                                                                     |
| MR-092 | 23-29 | Docs commit message template            | Fenced template: Docs: subject, report body, Checklist: answers line                          | implementer:MR-143, skill-authoring:MR-276                                                             |
| MR-094 | 33    | Success report format                   | Report 'Docs pass committed. Commit: <hash>.' plus 1-2 lines                                  | implementer:MR-147                                                                                     |
| MR-095 | 34    | Nothing-to-document report              | Report 'Docs pass: nothing to document.' and commit nothing                                   | critic:MR-023, reviewer:MR-046                                                                         |
| MR-096 | 35    | Stuck and blocked report formats        | Report stuck or blocked, describing everything tried                                          | implementer:MR-148, implementer:MR-149                                                                 |
| MR-097 | 37    | Final message goes to orchestrator      | Address the final message to an orchestrator                                                  | critic:MR-024                                                                                          |

### implementer (`skills/next/roles/implementer.md`, 53 behavioural rows)

| id     | line  | name                                            | does                                                                                                                  | also checked by                                                                                   |
| ------ | ----- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| MR-099 | 3     | Fresh-context implementer commits its task      | One subagent implements one task or fix and commits it                                                                | skill-authoring:MR-269, skill-authoring:MR-282                                                    |
| MR-100 | 3     | Dispatch names config and log                   | The dispatch names the mise config, the progress log and any previous failure report                                  | critic:MR-003, documenter:MR-068                                                                  |
| MR-101 | 3     | Never repeat what already failed                | Never repeat an approach the previous attempt's failure report names                                                  | implementer:MR-133                                                                                |
| MR-103 | 5     | Task shape                                      | Task file, no defects: build it; commit `Task <ID>:`; entry `## <task ID>`                                            | documenter:MR-069                                                                                 |
| MR-104 | 6     | Task-fix shape                                  | Task file with Defects: fix them; commit `Task <ID>:`; entry `## <task ID> fix`                                       | reviewer:MR-045                                                                                   |
| MR-105 | 7     | Fix-scope shape                                 | Fix scope: with Defects and no task file; commit `Fix:`; entry `## Fix`                                               | documenter:MR-070                                                                                 |
| MR-106 | 9     | Plan started green, failures are yours          | Treat every failure hit as this plan's and yours to fix                                                               | critic:MR-012, implementer:MR-154                                                                 |
| MR-107 | 9     | Never commit over a failure                     | Never call a failure pre-existing and never commit over it                                                            | implementer:MR-154                                                                                |
| MR-109 | 13    | Read config commands, checklist, guides, models | Read Format, Check, Unit tests, Task tests, the Checklist: file, Skills & guides and ## Models                        | critic:MR-003, documenter:MR-074, reviewer:MR-029                                                 |
| MR-110 | 13    | Documenter line means two-pass                  | A documenter line under ## Models switches the run into two-pass mode                                                 | README:MR-323, config-reference:MR-246, documenter:MR-065                                         |
| MR-111 | 14    | Read task, defects, log, named files            | Read the task file or scope line, the defects, the progress log and every file they name                              | documenter:MR-068, documenter:MR-078                                                              |
| MR-112 | 14    | Progress log overrides task Background          | The progress log, not the task's Background, is authoritative on what prior tasks produced                            | —                                                                                                 |
| MR-113 | 15    | Follow task conventions and Guides              | Implement following the task's conventions and its Guides entries                                                     | reviewer:MR-033                                                                                   |
| MR-114 | 15    | Apply matching config guides anyway             | Apply any config Skills & guides entry matching the work even if the task missed it; required are mandatory           | config-reference:MR-240, config-reference:MR-241, critic:MR-004, critic:MR-017, documenter:MR-075 |
| MR-115 | 15    | Complete type hints on public functions         | Give public functions complete type hints where the language has them                                                 | —                                                                                                 |
| MR-116 | 15    | No abstractions beyond the task                 | Add no abstractions beyond what the task requires                                                                     | —                                                                                                 |
| MR-117 | 15    | Never write REQ IDs into code                   | Never write a REQ-* ID into code, comments, identifiers, test names or strings                                        | implementer:MR-135, mise-checklist:MR-377                                                         |
| MR-118 | 16    | Single-pass prose rule                          | In single-pass mode write prose as usual, no comments beyond what the task requires                                   | —                                                                                                 |
| MR-119 | 17    | Two-pass: code only                             | In two-pass mode write code only: no comments, docstrings or markdown docs                                            | documenter:MR-065                                                                                 |
| MR-120 | 17    | Progress-log entry stays the implementer's      | The implementer still writes its own progress-log entry in two-pass mode                                              | —                                                                                                 |
| MR-121 | 17    | Directive comments count as code                | Lint directives, pragmas and license headers are code, not prose                                                      | —                                                                                                 |
| MR-122 | 18    | Stub the doc comments Check demands             | Where Check demands a doc comment, write the minimal stub and leave content to the documenter                         | documenter:MR-082                                                                                 |
| MR-123 | 19    | Copy comes from goals and mocks                 | User-facing copy comes from the approved goals and mocks in both modes                                                | documenter:MR-067, reviewer:MR-037                                                                |
| MR-124 | 19    | Commit message is the implementer's             | The commit message stays the implementer's own in both modes                                                          | —                                                                                                 |
| MR-125 | 20    | Verify: Format, Check, then tests               | Run Format, then Check, then tests, in that order                                                                     | README:MR-320, documenter:MR-086                                                                  |
| MR-126 | 21    | Task tests slot replaces Unit tests             | Run Task tests with <path> replaced by the tests changed, or the touched directories, in one invocation               | README:MR-320, config-reference:MR-229                                                            |
| MR-127 | 21    | Fall back to Unit tests                         | With no Task tests slot, or nothing testable touched, run Unit tests                                                  | —                                                                                                 |
| MR-128 | 22    | Run the tests the task writes                   | Also run the tests the task itself writes, including the bugfix regression test                                       | mise-checklist:MR-379                                                                             |
| MR-129 | 23    | Run task e2e through its guide                  | Run a task-written e2e test through the Skills & guides entry covering e2e runs, honoring required                    | config-reference:MR-241, critic:MR-014                                                            |
| MR-130 | 24    | Run cited Test exception verification           | Run any substitute verification a cited Test exception names and keep its evidence                                    | acceptance:MR-055, config-reference:MR-238, reviewer:MR-035                                       |
| MR-131 | 25    | Never run pre-existing e2e suites               | Never run a pre-existing e2e or sanity suite                                                                          | README:MR-325, acceptance:MR-054, critic:MR-016                                                   |
| MR-132 | 26    | List slots re-run from the start                | A slot holding a list runs in order and is re-run from the start after each fix                                       | config-reference:MR-228                                                                           |
| MR-133 | 27    | Three failures with no hypothesis stops         | Fix and re-run until green; after 3 consecutive failures with no new hypothesis report stuck                          | documenter:MR-087, documenter:MR-088, skill-authoring:MR-289                                      |
| MR-134 | 29    | Walk the task's verification checklist          | Walk the task's verification checklist and confirm every item                                                         | —                                                                                                 |
| MR-135 | 31    | Self-review the diff                            | Review the staged and unstaged diff for missed requirements, bugs, security holes, dead code, debug statements, REQ-* | mise-checklist:MR-375, mise-checklist:MR-377, reviewer:MR-032, reviewer:MR-034                    |
| MR-136 | 31    | Answer every checklist rule                     | Answer every rule of the config's Checklist: file against the diff                                                    | README:MR-321, documenter:MR-083, mise-checklist:MR-373, reviewer:MR-039, skill-authoring:MR-286  |
| MR-137 | 31    | Prose rules n-a in two-pass                     | In two-pass mode answer ## Prose rules `n-a — documenter`                                                             | documenter:MR-085                                                                                 |
| MR-138 | 31    | Fix findings and re-verify                      | Fix what the self-review finds and re-run the whole verification step                                                 | —                                                                                                 |
| MR-139 | 32    | Append to the progress log                      | Append an entry under the dispatch's heading, creating the log with a # Progress heading                              | documenter:MR-089, skill-authoring:MR-288                                                         |
| MR-140 | 34-37 | Progress-log entry template                     | Fenced template: Key changes and Deviations from plan lines                                                           | documenter:MR-091, retrospective:MR-163                                                           |
| MR-141 | 39    | One line each in the log                        | Keep each log line to one line; anything longer belongs in the commit body                                            | skill-authoring:MR-287                                                                            |
| MR-142 | 41    | Commit work and log together                    | Commit the work and the log entry together, with the dispatch's subject prefix and checklist answers in the body      | README:MR-321, documenter:MR-089, documenter:MR-090, reviewer:MR-038, skill-authoring:MR-288      |
| MR-143 | 43-49 | Task commit message template                    | Fenced template: Task <ID> subject, report body, Checklist: answers line                                              | documenter:MR-092, skill-authoring:MR-276                                                         |
| MR-144 | 51    | Every rule number appears once                  | Every checklist rule number appears exactly once in the answers line                                                  | reviewer:MR-040                                                                                   |
| MR-145 | 51    | Only pass and n-a are allowed                   | The only answer values in a commit are pass and n-a                                                                   | mise-checklist:MR-373                                                                             |
| MR-147 | 55    | Success report format                           | Report completion with the commit hash plus 2-3 lines on what was built                                               | documenter:MR-094                                                                                 |
| MR-148 | 56    | Stuck report                                    | Report 'Task failed (stuck)' on the bounded-retries exit                                                              | documenter:MR-096                                                                                 |
| MR-149 | 57    | Blocked report                                  | Report 'Task failed (blocked)' for a hard blocker no retry fixes                                                      | documenter:MR-096                                                                                 |
| MR-150 | 59    | Failures describe everything tried              | Either failure describes what went wrong and everything tried                                                         | —                                                                                                 |
| MR-151 | 61    | Report facts, not narrative                     | Final message goes to an orchestrator: facts, summarized results, never pasted output                                 | critic:MR-024, skill-authoring:MR-287                                                             |
| MR-153 | 65    | Do not change out-of-scope files                | Never change files outside the task's scope, the progress log excepted                                                | documenter:MR-077, mise-checklist:MR-378                                                          |
| MR-154 | 66    | Never skip verification, never commit red       | Never skip a verification step or commit while anything is red                                                        | implementer:MR-106, implementer:MR-107                                                            |
| MR-155 | 67    | Do not contradict the task's architecture       | Never contradict the task file's architecture; report blocked instead                                                 | —                                                                                                 |

### retrospective (`skills/next/roles/retrospective.md`, 48 behavioural rows)

| id     | line  | name                                      | does                                                                                               | also checked by                                                |
| ------ | ----- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| MR-157 | 3     | Mine the run for guidance edits           | One subagent mines the accepted run for durable guidance improvements as minimal edits             | README:MR-327, config-reference:MR-250, skill-authoring:MR-269 |
| MR-158 | 3     | Propose only, never edit                  | Never edit a file; propose only                                                                    | critic:MR-002, retrospective:MR-209                            |
| MR-159 | 3     | Never propose plugin file edits           | Never propose an edit to the mise plugin's own files                                               | retrospective:MR-191, retrospective:MR-210                     |
| MR-160 | 3     | Dispatch names mise dir and config        | The dispatch names the mise directory and the mise config                                          | critic:MR-003                                                  |
| MR-162 | 7     | Read the sources in order                 | Read the listed sources in the given order                                                         | —                                                              |
| MR-163 | 9     | Read friction and progress logs           | Read _friction.md (may be absent) and _progress.md, its Deviations entries especially              | implementer:MR-140                                             |
| MR-164 | 10    | Read the run's artifacts                  | Read goals.md, requirements.md when present, and the plan overview                                 | —                                                              |
| MR-165 | 11    | Read the branch's commits                 | Read git log; fix commits and rework name friction the logs miss                                   | acceptance:MR-051                                              |
| MR-166 | 12    | Read the run's governing guidance         | Read the config, its Checklist: file, CLAUDE.md and every Skills & guides doc or skill             | critic:MR-004, reviewer:MR-030                                 |
| MR-167 | 12    | Propose against actual text               | Propose against the guidance's actual text, never against an assumed version                       | —                                                              |
| MR-169 | 16    | Friction log corrections                  | Treat `correction:` and `acceptance: user flagged` lines as corrections                            | —                                                              |
| MR-170 | 17    | UI tweaks log corrections                 | Treat the UI Tweaks Log in mocks.context.md as corrections when the run mocked                     | —                                                              |
| MR-171 | 18    | User-authored commits are corrections     | Treat post-run commits without mise:/Task/Fix/Docs prefixes as corrections; read their diffs       | —                                                              |
| MR-172 | 19    | External review notes are corrections     | When the config has ## Review notes, follow it verbatim to read the external notes                 | README:MR-312, config-reference:MR-249, mise-config:MR-367     |
| MR-173 | 19    | Every reviewer turn is a correction       | Count every reviewer turn in those notes as a correction                                           | README:MR-313, retrospective:MR-175                            |
| MR-175 | 23    | Every correction yields a proposal        | Every correction yields a proposal; none is dropped                                                | README:MR-328                                                  |
| MR-176 | 23    | Route each correction to one kind         | Route each correction to checklist edit, durable doc, or config/plugin                             | README:MR-328                                                  |
| MR-177 | 25    | Checklist edits use the rule format       | Write a checklist edit as `<rule> — <how to check>`                                                | config-reference:MR-225, mise-checklist:MR-374                 |
| MR-178 | 25    | Sharpen an ignored documented rule        | A rule already in a doc or CLAUDE.md yet ignored becomes a checkable rule citing that doc          | —                                                              |
| MR-179 | 25    | Mechanical rule with no prose home        | A mechanical, diff-checkable rule with no prose home becomes a checklist rule                      | —                                                              |
| MR-180 | 25    | Fifteen-rule cap forces merges            | At the 15-rule cap, sharpen or merge existing rules before adding                                  | acceptance:MR-062, config-reference:MR-226                     |
| MR-181 | 26    | Durable doc for decisions and conventions | Route a product or design decision, or a genuinely new convention, to a guide or a new doc         | retrospective:MR-189                                           |
| MR-182 | 26    | New conventions land in docs first        | A new convention lands in a doc first and becomes a checklist rule only when diff-checkable        | retrospective:MR-180                                           |
| MR-183 | 27    | Workflow corrections: config or plugin    | A correction about the workflow's own approach routes to config-edit or plugin-candidate           | retrospective:MR-187, retrospective:MR-191                     |
| MR-184 | 29    | Non-correction findings need an incident  | Every other finding needs a concrete incident a specific guidance edit would have prevented        | retrospective:MR-196, skill-authoring:MR-291                   |
| MR-185 | 29    | Route to the first matching target        | Route each finding to the first matching target in the list below                                  | —                                                              |
| MR-186 | 31    | Target: an existing guide                 | Prefer an existing Skills & guides entry or a doc it points to                                     | —                                                              |
| MR-187 | 32    | Target: the mise config                   | Route wrong or missing values — test exceptions, mock conditions, quality commands — to the config | config-reference:MR-219                                        |
| MR-188 | 33    | Target: CLAUDE.md                         | Route a repo-wide code convention to CLAUDE.md                                                     | CLAUDE:MR-345                                                  |
| MR-189 | 34    | Target: a new doc, last resort            | Propose a new doc only when a critical lesson has no home; give content and registration line      | retrospective:MR-181                                           |
| MR-190 | 34    | No crisp condition, no doc                | Without a crisp 'when to use' condition the doc is not ready                                       | config-reference:MR-240                                        |
| MR-191 | 35    | Target: plugin candidate, report only     | Describe a flaw in how the stages ran as a plugin candidate for the user to take upstream          | retrospective:MR-159, retrospective:MR-210                     |
| MR-192 | 36    | Target: drop it                           | Drop a finding matching no target                                                                  | —                                                              |
| MR-194 | 40    | Proposals are minimal diffs               | Every proposal is a minimal diff                                                                   | skill-authoring:MR-261                                         |
| MR-195 | 40    | Deleting guidance counts                  | Deleting or consolidating existing guidance counts as a proposal                                   | skill-authoring:MR-261                                         |
| MR-196 | 41    | Proposal must protect a future run        | An incident justifies a proposal only if ignoring it would plausibly damage a future run           | —                                                              |
| MR-197 | 42    | Group proposals by pattern                | Group proposals by pattern                                                                         | —                                                              |
| MR-198 | 42    | Each proposal cites Covers or Incident    | Each proposal carries a Covers: line, an Incident: line, or both                                   | —                                                              |
| MR-199 | 42    | Never a cosmetic wording preference       | Never propose a cosmetic wording preference                                                        | critic:MR-022, reviewer:MR-044                                 |
| MR-200 | 43    | An empty report is a success              | An empty report is a success when nothing cleared the bar                                          | critic:MR-023, retrospective:MR-206                            |
| MR-202 | 47    | Number the proposals                      | Number the proposals so the user can adopt by number                                               | README:MR-326                                                  |
| MR-203 | 49-54 | Proposal template                         | Fenced template: target and kind, Edit, Covers, Incident lines                                     | skill-authoring:MR-276                                         |
| MR-204 | 56    | Recommend line names adoptions            | End with `Recommend: adopt <numbers>`, naming only proposals worth staking a run on                | README:MR-326                                                  |
| MR-205 | 56    | Doubtful proposals stay off the line      | A doubtful proposal stays in the report but off the Recommend line                                 | —                                                              |
| MR-206 | 56    | Exact no-proposals phrase                 | With no proposals report exactly the stated sentence                                               | critic:MR-023, reviewer:MR-046                                 |
| MR-207 | 56    | Final message goes to orchestrator        | Address the final message to an orchestrator                                                       | critic:MR-024                                                  |
| MR-209 | 60    | Do not edit any file                      | Never edit a file; the orchestrator applies what the user adopts                                   | retrospective:MR-158                                           |
| MR-210 | 61    | Do not propose plugin edits               | Never propose an edit to the plugin's own skill or instruction files                               | retrospective:MR-159, retrospective:MR-191                     |

## 3. Config knobs: defaults and overrides

Default = what `skills/next/references/config-reference.md` states for an omitted knob, or the value it tells setup to suggest. okven = `/Users/eric/Code/okven/.claude/mise-config.md` (77 lines, 698 words, vs the reference's 57-line example and this repo's 36-line config).

| knob                   | defined at             | default                                                                                        | this repo                                                         | okven                                                                                                                                                           | overridden?                                                                                              |
| ---------------------- | ---------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Mise directory         | config-reference.md:75 | suggested `.mise/`                                                                             | `.mise/` (mise-config.md:3)                                       | `.mise/` (okven:3)                                                                                                                                              | no                                                                                                       |
| Branch convention      | config-reference.md:76 | no default; example `feat/<slug>`, `fix/<slug>`                                                | example verbatim (:4)                                             | example verbatim (okven:4)                                                                                                                                      | no                                                                                                       |
| Checklist              | config-reference.md:77 | suggested `.claude/mise-checklist.md`; shape `<rule> — <how to check>`, cap 15, never blocking | `.claude/mise-checklist.md`, 6 rules, 103 words, 6/6 use `—` (:5) | `.claude/mise-checklist.md`, 15 rules (at cap), 821 words, 3/15 use `—` (okven:5)                                                                               | **yes** — okven sits at the cap and abandons the one-line rule shape                                     |
| Format                 | config-reference.md:78 | no default; a run command or list                                                              | `yarn format` (:10)                                               | prose, not a command: 'handled by the lint-staged pre-commit hook … no repo-wide format run' (okven:10)                                                         | **yes** — slot holds prose where the reference says run command                                          |
| Check                  | config-reference.md:78 | no default; 'lint + typecheck'                                                                 | `yarn typecheck` only, no lint (:11)                              | list: `yarn build-tsc`, `yarn lint` (okven:11-13)                                                                                                               | no                                                                                                       |
| Unit tests             | config-reference.md:78 | no default; unscoped full-suite command                                                        | `yarn test` (:12)                                                 | `yarn test <path> from the closest package directory; … yarn test:up first` (okven:14) — carries the `<path>` placeholder the reference reserves for Task tests | **yes** — scoped placeholder in the unscoped slot                                                        |
| Task tests             | config-reference.md:78 | optional; omitted means every task runs full Unit tests                                        | **omitted** (:8-12) — every task runs `yarn test` in full         | set, same text as Unit tests (okven:15)                                                                                                                         | differs between the two configs                                                                          |
| Mock conditions        | config-reference.md:84 | no default; omitted means never route `full`                                                   | omitted                                                           | 2 conditions (okven:26-27)                                                                                                                                      | n/a                                                                                                      |
| Mock guidance          | config-reference.md:85 | no default                                                                                     | omitted                                                           | 2 non-blank lines, 94 words; the second (okven:33) is a behavioral rule for later rounds, not guidance on how mocks look                                        | **yes** — instructional prose in a config the reference says holds values only (config-reference.md:5-6) |
| Test conventions       | config-reference.md:86 | no default; pointer preferred                                                                  | inline, 1 line (:16)                                              | pointer to 3 CLAUDE.md files (okven:37)                                                                                                                         | no                                                                                                       |
| Test exceptions        | config-reference.md:87 | suggested default entry: purely-visual → screenshots                                           | 2 entries, neither the suggested one (:20-21)                     | 4 entries; the suggested one adapted (okven:41); entry 4 (okven:44) is an 85-word scope paragraph, not `condition — alternative verification`                   | **yes** — entry format abandoned in okven                                                                |
| Skills & guides        | config-reference.md:88 | no default; `required` means never bypassed                                                    | 2 doc entries, 0 required (:25-26)                                | 12 entries, 7 `required` (okven:48-59)                                                                                                                          | n/a                                                                                                      |
| Models — implementer   | config-reference.md:89 | `session`                                                                                      | `opus` (:34)                                                      | `opus` (okven:63)                                                                                                                                               | **yes** in both                                                                                          |
| Models — reviewer      | config-reference.md:89 | `session`                                                                                      | session (absent)                                                  | `opus` (okven:64)                                                                                                                                               | **yes** in okven                                                                                         |
| Models — critic        | config-reference.md:89 | `session`                                                                                      | session (absent)                                                  | `opus` (okven:65)                                                                                                                                               | **yes** in okven                                                                                         |
| Models — acceptance    | config-reference.md:89 | `session`                                                                                      | session (absent)                                                  | `opus` (okven:66)                                                                                                                                               | **yes** in okven                                                                                         |
| Models — explore       | config-reference.md:89 | `session`                                                                                      | `opus` (:35)                                                      | `opus` (okven:67)                                                                                                                                               | **yes** in both                                                                                          |
| Models — documenter    | config-reference.md:89 | `session`; **presence of the line turns two-pass mode on**                                     | absent → two-pass OFF                                             | `fable` (okven:68) → two-pass ON                                                                                                                                | **yes** in okven                                                                                         |
| Models — retrospective | config-reference.md:89 | `session`                                                                                      | `opus` (:36)                                                      | `opus` (okven:69)                                                                                                                                               | **yes** in both                                                                                          |
| Database migrations    | config-reference.md:90 | omitted                                                                                        | omitted                                                           | omitted                                                                                                                                                         | no                                                                                                       |
| Backlog                | config-reference.md:91 | omitted                                                                                        | omitted                                                           | Todoist MCP, named project/sections (okven:73)                                                                                                                  | n/a                                                                                                      |
| Review notes           | config-reference.md:92 | omitted                                                                                        | Delta Review (:30)                                                | Delta Review (okven:77)                                                                                                                                         | n/a                                                                                                      |
| Retrospective          | config-reference.md:93 | omitted = **on**                                                                               | omitted → on                                                      | omitted → on                                                                                                                                                    | no                                                                                                       |
| Ship                   | config-reference.md:94 | omitted = close-out asks each time                                                             | `merge (squash)` (:6)                                             | `pr` (okven:6)                                                                                                                                                  | **yes** in both                                                                                          |

### Sections okven carries that the reference defines nowhere

| section                            | lines       | what it holds                                                                        |
| ---------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `## Git`                           | okven:19-22 | 4 lines of rebase/push/commit instructions — a section the reference has no slot for |
| `Flaky under machine load:` bullet | okven:16    | a 4th bullet inside `## Quality commands`, not one of the four named slots           |
| `Dependencies:` bullet             | okven:17    | a 5th bullet inside `## Quality commands`, not one of the four named slots           |

Summary: of the 24 knob rows above, okven overrides the default on **13** (Checklist shape, Format, Unit tests, Mock guidance, Test exceptions, Ship, and all 7 Models lines — including `documenter`, which switches two-pass mode on, and the three gate roles the reference expects to stay on the session model); this repo's own config overrides **4** (Ship, plus the implementer, explore and retrospective models) and omits `Task tests`, so every task here runs the full unit suite. Neither config sets `Retrospective: off`. okven adds 3 config surfaces (`## Git`, and two extra `## Quality commands` bullets) that no stage or role file is written to read.

## 4. What `state.ts` enforces that prose also restates

37 of the 44 state-engine rows have a prose restatement somewhere in the repo — overwhelmingly in `docs/state-machine.md`, a 79-line file whose stated purpose (state-machine.md:3) is to be the engine's specification. `docs/state-machine.md` is also a registered guide (`.claude/mise-config.md:26`), so it is pulled into a subagent's context whenever `state.ts` is touched.

| invariant                                        | code             | prose restating it                                                            |
| ------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------- |
| MR-382 Header comment documents the commands     | state.ts:1-36    | docs/state-machine.md:1-79 (the whole file is the same spec)                  |
| MR-383 Stage to artifact filenames               | state.ts:48-59   | state-machine.md:43-48 (stage → artifact table)                               |
| MR-384 Task filename and hash patterns           | state.ts:67-68   | state-machine.md:54                                                           |
| MR-385 Recovery hint text                        | state.ts:70-73   | state-machine.md:72, 75; SKILL.md:41 (never apply its rules by hand)          |
| MR-387 Route decides participating stages        | state.ts:82-92   | state-machine.md:35-41 (route table); README.md:48 (bugfix shortened route)   |
| MR-388 Artifact hash is SHA-1 of bytes           | state.ts:97-111  | state-machine.md:50                                                           |
| MR-389 Strict state parse, never repaired        | state.ts:116-136 | state-machine.md:75                                                           |
| MR-390 Route field validated against enum        | state.ts:138-146 | state-machine.md:31, 75                                                       |
| MR-391 Approved map validated                    | state.ts:148-168 | state-machine.md:31, 75                                                       |
| MR-392 Accepted hash validated                   | state.ts:170-179 | state-machine.md:31                                                           |
| MR-393 Goals approval implies a route            | state.ts:181-183 | state-machine.md:13, 75                                                       |
| MR-395 Canonical state serialization             | state.ts:192-208 | state-machine.md:31                                                           |
| MR-396 Task Index IDs parsed from overview       | state.ts:212-229 | state-machine.md:54                                                           |
| MR-397 Done means file in done/                  | state.ts:233-251 | state-machine.md:54; stages/execute.md:10; state.ts:31-33 (its own comment)   |
| MR-398 Acceptance hash covers docs and tasks     | state.ts:257-278 | state-machine.md:15, 64, 68                                                   |
| MR-400 Fresh start versus lost state file        | state.ts:285-300 | state-machine.md:74                                                           |
| MR-401 Single writer of the state file           | state.ts:311-313 | state-machine.md:3; SKILL.md:41, 118                                          |
| MR-402 in_flight from directory contents         | state.ts:317-320 | state-machine.md:11, 31; SKILL.md:68, 73; config-reference.md:75; CLAUDE.md:3 |
| MR-403 Per-stage approved/unapproved/mismatch    | state.ts:332-351 | state-machine.md:62                                                           |
| MR-404 Mismatch cascade reopens later stages     | state.ts:356-367 | state-machine.md:62; references/interaction.md:13                             |
| MR-405 Mismatch clears recorded acceptance       | state.ts:375-378 | state-machine.md:15, 64                                                       |
| MR-406 next_action is the first unapproved stage | state.ts:385-388 | state-machine.md:63; README.md:31                                             |
| MR-407 Done filtered to Task Index               | state.ts:390-392 | state-machine.md:56, 64                                                       |
| MR-408 acceptance versus close_out               | state.ts:394-398 | state-machine.md:64, 66; stages/execute.md:83                                 |
| MR-409 Tasks remaining means stage:execute       | state.ts:399-401 | state-machine.md:64                                                           |
| MR-410 Read-only unless --write                  | state.ts:404-420 | state-machine.md:11-12; SKILL.md:61, 118                                      |
| MR-411 Goals approval requires a route           | state.ts:427-437 | state-machine.md:13; references/interaction.md:13                             |
| MR-414 Changed re-approval reopens later stages  | state.ts:453-469 | state-machine.md:14; references/interaction.md:13                             |
| MR-415 Plan re-approval clears done/             | state.ts:476-484 | state-machine.md:14, 56; stages/plan.md:9; references/interaction.md:67       |
| MR-416 Changed approval clears acceptance        | state.ts:490-494 | state-machine.md:15                                                           |
| MR-417 Acceptance needs valid approvals          | state.ts:512-523 | state-machine.md:15                                                           |
| MR-418 Acceptance needs every task done          | state.ts:525-535 | state-machine.md:15                                                           |
| MR-419 Acceptance record written once            | state.ts:538-543 | state-machine.md:15                                                           |
| MR-421 Node 24 or newer required                 | state.ts:556-562 | state-machine.md:3; README.md:17; SKILL.md:60                                 |
| MR-423 Argument parsing for approve              | state.ts:578-582 | state-machine.md:14 (route accompanies only goals)                            |
| MR-424 approve acceptance rejects a route        | state.ts:584-588 | state-machine.md:14-15                                                        |
| MR-425 Only report and approve exist             | state.ts:572-599 | state-machine.md:9-15 (command table)                                         |

### Enforced in code with no prose restatement found

| invariant                                | code             |
| ---------------------------------------- | ---------------- |
| MR-386 Errors print JSON and exit 1      | state.ts:75-78   |
| MR-394 Acceptance implies approvals      | state.ts:185-187 |
| MR-399 Missing mise directory fails      | state.ts:280-283 |
| MR-412 Cannot approve a missing artifact | state.ts:439-445 |
| MR-413 Stage must be on the route        | state.ts:447-451 |
| MR-420 Stage argument validated          | state.ts:546-554 |
| MR-422 Command and directory required    | state.ts:564-568 |

Restatements that reach a runtime context (not just maintainer docs): `SKILL.md:41, 60, 61, 68, 73, 118`, `references/interaction.md:13, 67`, `stages/execute.md:10, 83`, `stages/plan.md:9`, `references/config-reference.md:75`, `CLAUDE.md:3`, `README.md:17, 31, 48` — 16 lines across 7 files restating engine behaviour the engine already computes and reports.
