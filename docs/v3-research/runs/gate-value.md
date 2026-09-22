# What each mise gate earned

Source: `gate-outcomes.jsonl` (1894 subagent runs, 1173 resolved to a mise role), `gate-findings.jsonl` (2344 findings). Corpus frozen 2026-09-20 12:35Z. Tokens = input+cacheRead+cacheCreate+output, max-per-`message.id` then summed. Agent-hours = summed transcript spans; parallel and async agents overlap, so this over-counts elapsed time.

## 1. Per gate

| gate                | runs | tokens      | agent-hours | findings | defect | convention | nit | unclear | outcome=changed | defect/convention changed | tokens per such change |
| ------------------- | ---- | ----------- | ----------- | -------- | ------ | ---------- | --- | ------- | --------------- | ------------------------- | ---------------------- |
| critic-requirements | 74   | 125,806,350 | 8.6         | 711      | 454    | 15         | 123 | 119     | 44% (312/711)   | 216                       | 582,437                |
| critic-plan         | 90   | 430,043,664 | 15.3        | 820      | 429    | 96         | 129 | 166     | 44% (364/820)   | 248                       | 1,734,047              |
| reviewer            | 236  | 501,321,271 | 31.3        | 382      | 111    | 101        | 10  | 160     | 71% (270/382)   | 173                       | 2,897,811              |
| acceptance          | 94   | 324,028,446 | 9.8         | 425      | 173    | 36         | 193 | 23      | 19% (81/425)    | 42                        | 7,714,963              |
| end-of-plan gate    | 94   | 353,227,276 | 27.6        | 6        | 1      | 0          | 0   | 5       | 0% (0/6)        | 0                         | —                      |
| documenter          | 139  | 313,963,656 | 15.7        | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| retrospective       | 17   | 36,225,903  | 1.9         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |

`documenter` and `retrospective` emit no findings by design — the documenter reports work done, the retrospective reports proposals — so their finding columns are 0 and the cost columns are the whole measurement.

### Token composition (the `tokens` column above is dominated by cache reads)

| gate                | runs | input  | cache read  | cache create | output    | output per run | models (runs)                                                              |
| ------------------- | ---- | ------ | ----------- | ------------ | --------- | -------------- | -------------------------------------------------------------------------- |
| critic-requirements | 74   | 4,717  | 117,667,843 | 6,865,660    | 1,268,130 | 17,137         | claude-opus-5 56, claude-fable-5 11, claude-fable-5-1 7                    |
| critic-plan         | 90   | 10,116 | 413,979,894 | 13,713,561   | 2,340,093 | 26,001         | claude-opus-5 70, claude-fable-5 12, claude-fable-5-1 7, claude-opus-4-8 1 |
| reviewer            | 236  | 15,735 | 475,856,766 | 21,913,646   | 3,535,124 | 14,979         | claude-opus-5 170, claude-fable-5 51, claude-fable-5-1 15                  |
| acceptance          | 94   | 8,164  | 311,070,624 | 11,662,990   | 1,286,668 | 13,688         | claude-opus-5 81, claude-fable-5-1 8, claude-fable-5 5                     |
| end-of-plan gate    | 94   | 8,773  | 343,414,057 | 9,043,460    | 760,986   | 8,096          | claude-opus-5 72, claude-sonnet-5 22                                       |
| documenter          | 139  | 46,605 | 297,613,961 | 14,409,990   | 1,893,100 | 13,619         | claude-fable-5-1 105, claude-opus-5 18, claude-fable-5 13                  |
| retrospective       | 17   | 880    | 34,236,830  | 1,662,404    | 325,789   | 19,164         | claude-opus-5 17                                                           |

### Outcome mix per gate (what visibly happened to each finding)

| gate                | findings | code or artifact changed | repeated in a later round | rejected by the driver | no visible response | unclear     |
| ------------------- | -------- | ------------------------ | ------------------------- | ---------------------- | ------------------- | ----------- |
| critic-requirements | 711      | 44% (312/711)            | 28% (196/711)             | 0% (0/711)             | 26% (183/711)       | 3% (20/711) |
| critic-plan         | 820      | 44% (364/820)            | 24% (198/820)             | 0% (0/820)             | 26% (217/820)       | 5% (41/820) |
| reviewer            | 382      | 71% (270/382)            | 0% (0/382)                | 4% (14/382)            | 23% (86/382)        | 3% (12/382) |
| acceptance          | 425      | 19% (81/425)             | 17% (74/425)              | 1% (6/425)             | 55% (234/425)       | 7% (30/425) |
| end-of-plan gate    | 6        | 0% (0/6)                 | 0% (0/6)                  | 0% (0/6)               | 50% (3/6)           | 50% (3/6)   |

### Verdict mix per gate

| gate                | runs | verdicts as reported                                                |
| ------------------- | ---- | ------------------------------------------------------------------- |
| critic-requirements | 74   | blocking 56, pass 17, non-blocking-only 1                           |
| critic-plan         | 90   | blocking 67, pass 18, pass-implied 5                                |
| reviewer            | 236  | defects 135, clean 53, clean-prose 48                               |
| acceptance          | 94   | all-verified 73, not-verified-items 21                              |
| end-of-plan gate    | 94   | pass 64, other 21, fail 3, blocked 3, aborted 2, no-final-message 1 |
| documenter          | 139  | committed 119, other 12, nothing-to-document 8                      |
| retrospective       | 17   | proposals 14, other 3                                               |

## 2. By round (rounds are per branch+target: repeated spawns of the same gate on the same artifact or task)

| gate                       | runs | tokens      | agent-hours | findings | defect | convention | nit | unclear | outcome=changed | defect/convention changed | tokens per such change |
| -------------------------- | ---- | ----------- | ----------- | -------- | ------ | ---------- | --- | ------- | --------------- | ------------------------- | ---------------------- |
| critic-requirements · r1   | 13   | 12,162,736  | 1.3         | 149      | 106    | 2          | 24  | 17      | 48% (72/149)    | 53                        | 229,486                |
| critic-requirements · r2   | 12   | 18,496,278  | 1.5         | 114      | 78     | 1          | 16  | 19      | 57% (65/114)    | 51                        | 362,672                |
| critic-requirements · r3–5 | 27   | 50,315,391  | 3.3         | 277      | 181    | 8          | 43  | 45      | 52% (143/277)   | 97                        | 518,715                |
| critic-requirements · r6+  | 22   | 44,831,945  | 2.4         | 171      | 89     | 4          | 40  | 38      | 19% (32/171)    | 15                        | 2,988,796              |
| critic-plan · r1           | 20   | 71,205,422  | 3.1         | 188      | 97     | 22         | 35  | 34      | 52% (97/188)    | 66                        | 1,078,870              |
| critic-plan · r2           | 18   | 63,553,741  | 2.7         | 162      | 77     | 23         | 24  | 38      | 42% (68/162)    | 46                        | 1,381,603              |
| critic-plan · r3–5         | 26   | 142,826,968 | 5.0         | 283      | 151    | 37         | 41  | 54      | 48% (135/283)   | 90                        | 1,586,966              |
| critic-plan · r6+          | 26   | 152,457,533 | 4.5         | 187      | 104    | 14         | 29  | 40      | 34% (64/187)    | 46                        | 3,314,294              |
| reviewer · r1              | 231  | 491,876,740 | 30.7        | 371      | 107    | 99         | 10  | 155     | 70% (260/371)   | 167                       | 2,945,370              |
| reviewer · r2              | 5    | 9,444,531   | 0.6         | 11       | 4      | 2          | 0   | 5       | 91% (10/11)     | 6                         | 1,574,089              |
| acceptance · r1            | 21   | 83,048,106  | 2.3         | 164      | 60     | 16         | 81  | 7       | 16% (27/164)    | 11                        | 7,549,828              |
| acceptance · r2            | 11   | 38,764,568  | 1.4         | 51       | 21     | 3          | 26  | 1       | 25% (13/51)     | 9                         | 4,307,174              |
| acceptance · r3–5          | 17   | 53,929,040  | 2.1         | 69       | 28     | 8          | 26  | 7       | 20% (14/69)     | 8                         | 6,741,130              |
| acceptance · r6+           | 45   | 148,286,732 | 4.0         | 141      | 64     | 9          | 60  | 8       | 19% (27/141)    | 14                        | 10,591,909             |
| end-of-plan gate · r1      | 13   | 10,242,358  | 5.0         | 1        | 0      | 0          | 0   | 1       | 0% (0/1)        | 0                         | —                      |
| end-of-plan gate · r2      | 11   | 10,705,305  | 6.3         | 2        | 1      | 0          | 0   | 1       | 0% (0/2)        | 0                         | —                      |
| end-of-plan gate · r3–5    | 22   | 101,759,074 | 5.7         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| end-of-plan gate · r6+     | 48   | 230,520,539 | 10.6        | 3        | 0      | 0          | 0   | 3       | 0% (0/3)        | 0                         | —                      |
| documenter · r1            | 91   | 197,685,131 | 10.0        | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| documenter · r2            | 21   | 41,463,290  | 2.8         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| documenter · r3–5          | 19   | 61,971,131  | 2.3         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| documenter · r6+           | 8    | 12,844,104  | 0.7         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| retrospective · r1         | 17   | 36,225,903  | 1.9         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |

### Do rounds 2+ find anything of substance?

| gate                | round 1: findings / defect+convention / …that changed something | rounds 2+: same three               | rounds 2+ repeated in a later round | rounds 2+ tokens |
| ------------------- | --------------------------------------------------------------- | ----------------------------------- | ----------------------------------- | ---------------- |
| critic-requirements | 149 / 72% (108/149) / 36% (53/149)                              | 562 / 64% (361/562) / 29% (163/562) | 29% (161/562)                       | 113,643,614      |
| critic-plan         | 188 / 63% (119/188) / 35% (66/188)                              | 632 / 64% (406/632) / 29% (182/632) | 25% (156/632)                       | 358,838,242      |
| reviewer            | 371 / 56% (206/371) / 45% (167/371)                             | 11 / 55% (6/11) / 55% (6/11)        | 0% (0/11)                           | 9,444,531        |
| acceptance          | 164 / 46% (76/164) / 7% (11/164)                                | 261 / 51% (133/261) / 12% (31/261)  | 23% (61/261)                        | 240,980,340      |
| end-of-plan gate    | 1 / 0% (0/1) / 0% (0/1)                                         | 5 / 20% (1/5) / 0% (0/5)            | 0% (0/5)                            | 342,984,918      |

## 3. By run size (okven branches only, joined to `okven-runs.jsonl` by branch on `loc.codeTotal`)

| gate                                   | runs | tokens      | agent-hours | findings | defect | convention | nit | unclear | outcome=changed | defect/convention changed | tokens per such change |
| -------------------------------------- | ---- | ----------- | ----------- | -------- | ------ | ---------- | --- | ------- | --------------- | ------------------------- | ---------------------- |
| critic-requirements · medium (61–2000) | 2    | 1,198,063   | 0.1         | 2        | 1      | 0          | 0   | 1       | 0% (0/2)        | 0                         | —                      |
| critic-requirements · large (>2000)    | 53   | 111,627,159 | 6.7         | 554      | 354    | 11         | 92  | 97      | 45% (248/554)   | 173                       | 645,244                |
| critic-plan · small (≤60 LOC)          | 2    | 3,670,459   | 0.3         | 9        | 6      | 1          | 1   | 1       | 67% (6/9)       | 5                         | 734,092                |
| critic-plan · medium (61–2000)         | 7    | 10,321,951  | 0.7         | 29       | 13     | 7          | 5   | 4       | 79% (23/29)     | 17                        | 607,174                |
| critic-plan · large (>2000)            | 58   | 369,928,549 | 11.5        | 616      | 330    | 63         | 93  | 130     | 44% (268/616)   | 182                       | 2,032,574              |
| reviewer · small (≤60 LOC)             | 1    | 893,598     | 0.1         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| reviewer · medium (61–2000)            | 9    | 9,906,239   | 1.4         | 13       | 4      | 5          | 0   | 4       | 69% (9/13)      | 6                         | 1,651,040              |
| reviewer · large (>2000)               | 160  | 397,465,135 | 23.7        | 289      | 80     | 82         | 9   | 118     | 71% (206/289)   | 132                       | 3,011,100              |
| acceptance · small (≤60 LOC)           | 2    | 1,144,510   | 0.1         | 8        | 0      | 0          | 7   | 1       | 50% (4/8)       | 0                         | —                      |
| acceptance · medium (61–2000)          | 5    | 13,995,949  | 0.6         | 30       | 8      | 3          | 17  | 2       | 10% (3/30)      | 2                         | 6,997,975              |
| acceptance · large (>2000)             | 56   | 227,430,558 | 6.2         | 223      | 92     | 19         | 103 | 9       | 21% (46/223)    | 25                        | 9,097,222              |
| end-of-plan gate · small (≤60 LOC)     | 4    | 2,772,943   | 0.6         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| end-of-plan gate · medium (61–2000)    | 15   | 41,766,539  | 3.3         | 1        | 0      | 0          | 0   | 1       | 0% (0/1)        | 0                         | —                      |
| end-of-plan gate · large (>2000)       | 71   | 304,706,512 | 20.0        | 4        | 1      | 0          | 0   | 3       | 0% (0/4)        | 0                         | —                      |
| documenter · small (≤60 LOC)           | 2    | 2,693,115   | 0.2         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| documenter · medium (61–2000)          | 10   | 7,683,628   | 1.2         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| documenter · large (>2000)             | 120  | 270,592,441 | 13.3        | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| retrospective · small (≤60 LOC)        | 1    | 605,897     | 0.1         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| retrospective · medium (61–2000)       | 4    | 14,696,717  | 0.6         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |
| retrospective · large (>2000)          | 6    | 15,809,828  | 0.8         | 0        | 0      | 0          | 0   | 0       | — (0)           | 0                         | —                      |

Joined: 907 of 1173 role-resolved runs. The 266 unjoined are non-okven projects (aydy, delta-review, firebase-kit, metaforico, originhypnosis, ericvera.dev, mise-claude-plugin) plus runs whose transcript recorded `gitBranch: HEAD` in a detached worktree; `okven-runs.jsonl` covers okven only.

| size bucket      | branches with transcripts | role-resolved runs | tokens        | agent-hours |
| ---------------- | ------------------------- | ------------------ | ------------- | ----------- |
| small (≤60 LOC)  | 1                         | 14                 | 13,678,270    | 1.4         |
| medium (61–2000) | 4                         | 66                 | 174,214,489   | 12.4        |
| large (>2000)    | 8                         | 827                | 5,243,700,861 | 219.8       |

## 4. Gates that passed clean on the first round — cost spent to learn nothing

| gate                | first rounds | clean verdict | tokens spent on those | agent-hours | no defect/convention finding at all | tokens spent on those |
| ------------------- | ------------ | ------------- | --------------------- | ----------- | ----------------------------------- | --------------------- |
| critic-requirements | 13           | 8% (1/13)     | 403,053               | 0.0         | 0% (0/13)                           | 0                     |
| critic-plan         | 20           | 25% (5/20)    | 5,598,536             | 0.6         | 10% (2/20)                          | 2,632,468             |
| reviewer            | 231          | 43% (99/231)  | 174,939,383           | 12.0        | 54% (125/231)                       | 234,751,556           |
| acceptance          | 21           | 57% (12/21)   | 35,524,766            | 1.1         | 19% (4/21)                          | 9,891,048             |
| end-of-plan gate    | 13           | 77% (10/13)   | 6,897,985             | 1.6         | 100% (13/13)                        | 10,242,358            |
| documenter          | 91           | 8% (7/91)     | 1,897,971             | 0.1         | 100% (91/91)                        | 197,685,131           |
| retrospective       | 17           | 0% (0/17)     | 0                     | 0.0         | 100% (17/17)                        | 36,225,903            |

| gate                | targets (artifact or task, per branch) | settled in one round | mean rounds | max rounds | targets where no round found a defect or convention item | tokens on those |
| ------------------- | -------------------------------------- | -------------------- | ----------- | ---------- | -------------------------------------------------------- | --------------- |
| critic-requirements | 13                                     | 8% (1/13)            | 5.7         | 14         | 0% (0/13)                                                | 0               |
| critic-plan         | 20                                     | 10% (2/20)           | 4.5         | 25         | 10% (2/20)                                               | 5,153,400       |
| reviewer            | 231                                    | 98% (226/231)        | 1.0         | 2          | 53% (123/231)                                            | 232,673,060     |
| acceptance          | 21                                     | 48% (10/21)          | 4.5         | 20         | 19% (4/21)                                               | 10,526,074      |
| end-of-plan gate    | 13                                     | 15% (2/13)           | 7.2         | 20         | 92% (12/13)                                              | 286,529,457     |
| documenter          | 91                                     | 77% (70/91)          | 1.5         | 11         | 100% (91/91)                                             | 313,963,656     |
| retrospective       | 17                                     | 100% (17/17)         | 1.0         | 1          | 100% (17/17)                                             | 36,225,903      |

## 5. Ten of the most valuable catches

| #   | gate · round             | branch              | severity / substance | finding (verbatim, trimmed)                                                                                                                                                                                                                                                                                                        | what happened                                                                                                  | transcript                                                                                                                                                     |
| --- | ------------------------ | ------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | critic-plan · r1         | eric/attribution-3  | blocking / defect    | `- `buildChartSeries`emits one dataset keyed by v1's`AttributionChartMetric = 'captured' \| 'ordersCaptured'`over report`periods` (`buildChartSeries.ts:1,13,23,61-71`). Task 6.5 and 7.3 plan to "reuse" it for Contactos / Visitas / Clientes nuevos; Tasks 7.4, 7.5 need multi-series legend charts (REQ-SRC-5, REQ-SRC-11`     | the driver's revision before the next round writes buildChartSeries, periods, ChartColors, showLegend          | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-eric-attribution-3/bf648c37-f4af-4772-9f16-0a3a9d92e742/subagents/agent-a018a448c7f212d95.jsonl  |
| 2   | reviewer · r1            | eric/attribution-3  | defect / defect      | `4. `hosting/composables/useCampaignSpendForm.ts:261`— the success snackbar`'Gasto guardado. Entra al reporte esta noche.'` is now false in both halves. Task 5.1 deleted the report page (`hosting/pages/staff/attribution/`holds only`spend/`, and `urlStaffAttributionReport` no longer exists), and this task makes an ac`     | next fix dispatch quotes hosting, composables, useCampaignSpendForm.ts:261, guardado                           | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-eric-attribution-3/bf648c37-f4af-4772-9f16-0a3a9d92e742/subagents/agent-ac817598696b347d7.jsonl  |
| 3   | critic-plan · r9         | feat/specials-fixes | blocking / defect    | `**1. Task 4.5 — a promoted item leaves `lastAssistantOutput`still saying`t:'u'`, so the next turn re-raises a resolved item.** `interpretOrder.ts:96`computes`rawOutput = JSON.stringify(response.output)`*before* anything the plan touches, and Task 4.5 places the promotion after the funnel (step 3).`handleOrderText`       | the driver's revision before the next round writes lastAssistantOutput, t:'u', interpretOrder.ts:96, rawOutput | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-feat-specials-fixes/99505f46-79e1-4ff3-9af9-611fb6ca24ae/subagents/agent-a451ec0aee7e4cced.jsonl |
| 4   | reviewer · r1            | fix/menu-pin        | defect / defect      | `**2. Tax-list comparison is position-sensitive, so a pure reorder kills a live checkout — `functions/src/utils/order/buildMenuDrift.ts:36-44`** `hasTaxListChanged`walks the two lists by index, so a republish that reorders`taxRateGroups[].taxRateIds`with identical ids, rates and amounts yields`changed: true`. REQ-PI`     | next fix dispatch quotes functions, utils, order, hasTaxListChanged                                            | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-fix-menu-pin/e5dc5db1-9f97-4541-b221-98f855fecf81/subagents/agent-a153917a86f38f7e1.jsonl        |
| 5   | reviewer · r1            | eric/attribution-3  | defect / defect      | `**1. The three redirects (REQ-DASH-7) never fire in production — `hosting/nuxt.config.ts:102-104`** The rules are Nitro `routeRules` `redirect`s, but `hosting`ships as a fully static build:`ci:build`is`nuxt typecheck && nuxt generate`, `hosting/dist`is a symlink to`.output/public`, and `firebase.json`rewrites`*`         | next fix dispatch quotes hosting, nuxt.config.ts:102-104, routeRules, redirect                                 | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-eric-attribution-3/bf648c37-f4af-4772-9f16-0a3a9d92e742/subagents/agent-a02c1b9d71308d755.jsonl  |
| 6   | reviewer · r1            | fix/menu-pin        | defect / defect      | `- 3. REQ-DROP-6's `note`half has no test REQ-DROP-6 ("A line that survives with the same ids MUST keep its quantity and note") is in this task's Requirements addressed. Quantity is covered (the`q: 2`cases), but no`buildMenuDrift.test.ts`case puts a`note` on a stored line, so nothing proves a survivor keeps it. Th`       | next fix dispatch quotes note, buildMenuDrift.test.ts, updateOrder, functions                                  | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-fix-menu-pin/e5dc5db1-9f97-4541-b221-98f855fecf81/subagents/agent-a153917a86f38f7e1.jsonl        |
| 7   | reviewer · r1            | eric/attribution-3  | defect / defect      | `1. `hosting/components/dashboard/DashboardChange.vue:39`, `DashboardKpiCard.vue:32`, `DashboardKeyValueRows.vue:33-36`— the mock's`font-variant-numeric: tabular-nums` is dropped from all three numeric surfaces (`.delta`line 79,`.kpi .n`line 134,`.kv .v`line 141 of`.mise/mocks.html`) on a false premise. The reco`         | next fix dispatch quotes hosting, components, dashboard, DashboardChange.vue:39                                | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-eric-attribution-3/bf648c37-f4af-4772-9f16-0a3a9d92e742/subagents/agent-ac44cbfcb77ebf58f.jsonl  |
| 8   | critic-requirements · r1 | feat/specials-fixes | blocking / defect    | `1. **Missing requirement for goals rule R6 (all matches unavailable, name not exact — mock board 19).** Section 3 walks candidate counts 1 (REQ-MATCH-2) and ≥2 (REQ-MATCH-6), and the exact-name branch (REQ-MATCH-3/4/5, scoped by "the customer's words exactly name an item"). "quiero birria" names no item exactly; after ` | the file or symbol it names was written next (REQ-MATCH-2, REQ-MATCH-6)                                        | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-feat-specials-fixes/99505f46-79e1-4ff3-9af9-611fb6ca24ae/subagents/agent-ad508945cd86cb9d2.jsonl |
| 9   | reviewer · r1            | eric/attribution-3  | defect / defect      | `2. **Test title names a key part that is not in the key, and contradicts REQ-TOUCH-2.** `/Users/eric/Code/okven.worktrees/eric-attribution-3/hosting/utils/attribution/trackAttributionEvent.test.ts:139`—`it('sends one visit per device, page and Puerto Rico day')`. `toSentVisitKey` keys on device, sticky source, sticky`   | next fix dispatch quotes handle, page, REQ-TOUCH-2, trackAttributionEvent.test.ts                              | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-eric-attribution-3/bf648c37-f4af-4772-9f16-0a3a9d92e742/subagents/agent-a850477821a72ee14.jsonl  |
| 10  | reviewer · r1            | HEAD                | defect / defect      | `1. **Word-count rule contradicts the task's gotcha inside code fences** — `hosting/modules/content/listenTime.ts`: `MDC_ATTRIBUTES` (`/\{[^{}]*\}/g`) strips brace-enclosed text everywhere, including fence contents, after only the fence delimiter lines are removed. The task specifies "code fences count as words (they'd ` | next fix dispatch quotes hosting, modules, content, listenTime.ts                                              | /Users/eric/.claude/projects/-Users-eric-Code-ericvera-dev/4a02672f-878b-43de-a144-65eac106f519/subagents/agent-a50430ef43308d4b2.jsonl                        |

Selection: hand-classified rows only (57 of the 679 defect-or-convention findings that changed something), ranked by stated severity, substance and strength of the outcome evidence. Restricting to hand-classified rows means every example here was read in full before it was called a catch.

## 6. Ten of the most wasteful rounds

| #   | gate · round           | branch                | tokens     | minutes | findings | of which repeats of an earlier round | verdict      | transcript                                                                                                                                                       |
| --- | ---------------------- | --------------------- | ---------- | ------- | -------- | ------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | end-of-plan gate · r12 | feat/voice-notes      | 21,451,352 | 19      | 0        | 0                                    | other        | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-feat-voice-notes/f23e7541-37fb-46a0-8962-c9d47548ab47/subagents/agent-ae966a95df3a10f5c.jsonl      |
| 2   | end-of-plan gate · r14 | feat/specials-fixes   | 20,552,729 | 24      | 0        | 0                                    | other        | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-feat-specials-fixes/19d0c3b2-3cda-452a-a653-98c62e47d26c/subagents/agent-a87718a0f4535b8a4.jsonl   |
| 3   | acceptance · r3        | feat/specials-fixes   | 17,696,087 | 15      | 0        | 0                                    | all-verified | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-feat-specials-fixes/19d0c3b2-3cda-452a-a653-98c62e47d26c/subagents/agent-aebd4630272891924.jsonl   |
| 4   | end-of-plan gate · r18 | feat/voice-notes      | 16,730,766 | 15      | 0        | 0                                    | pass         | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-feat-voice-notes/f23e7541-37fb-46a0-8962-c9d47548ab47/subagents/agent-a915c59f862f47a87.jsonl      |
| 5   | end-of-plan gate · r4  | feat/close-out-orders | 16,416,299 | 23      | 0        | 0                                    | pass         | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-feat-close-out-orders/0ac4ed3a-1ba2-4b3f-af9b-cf4e166f1676/subagents/agent-adafd51473fe2726f.jsonl |
| 6   | end-of-plan gate · r3  | feat/voice-notes      | 15,975,879 | 15      | 0        | 0                                    | pass         | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-feat-voice-notes/f23e7541-37fb-46a0-8962-c9d47548ab47/subagents/agent-aa8e8e6ad0dc9ccb4.jsonl      |
| 7   | end-of-plan gate · r5  | feat/specials-fixes   | 15,709,622 | 18      | 0        | 0                                    | pass         | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-feat-specials-fixes/19d0c3b2-3cda-452a-a653-98c62e47d26c/subagents/agent-a00d17fb0acf03f86.jsonl   |
| 8   | end-of-plan gate · r9  | eric/attribution-3    | 15,566,108 | 18      | 0        | 0                                    | pass         | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-eric-attribution-3/bf648c37-f4af-4772-9f16-0a3a9d92e742/subagents/agent-a2a76606144e87edf.jsonl    |
| 9   | end-of-plan gate · r10 | eric/attribution-3    | 15,003,269 | 18      | 0        | 0                                    | pass         | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-eric-attribution-3/bf648c37-f4af-4772-9f16-0a3a9d92e742/subagents/agent-a89f94c0f77d4c038.jsonl    |
| 10  | end-of-plan gate · r15 | feat/voice-notes      | 14,871,527 | 18      | 0        | 0                                    | pass         | /Users/eric/.claude/projects/-Users-eric-Code-okven-worktrees-feat-voice-notes/f23e7541-37fb-46a0-8962-c9d47548ab47/subagents/agent-a2c4a60a6a602ad75.jsonl      |

Selection: verdict-returning gates only, no defect-or-convention finding that changed anything, ranked by tokens. 371 of 588 such runs qualify, together 1,043,979,018 tokens and 61.2 agent-hours.

| loop (project · branch · gate · target)                                                             | rounds | tokens      | tokens after round 2 | findings after round 2 | of those, repeats | of those, defect/convention that changed something |
| --------------------------------------------------------------------------------------------------- | ------ | ----------- | -------------------- | ---------------------- | ----------------- | -------------------------------------------------- |
| okven-worktrees-feat-specials-fixes · feat/specials-fixes · critic-plan · implementation_plan/      | 25     | 142,322,075 | 132,300,001          | 185                    | 79                | 39                                                 |
| okven-worktrees-feat-voice-notes · feat/voice-notes · end-of-plan gate · end-of-plan-gate           | 20     | 99,722,405  | 99,178,416           | 1                      | 0                 | 0                                                  |
| okven-worktrees-feat-specials-fixes · feat/specials-fixes · acceptance · acceptance                 | 20     | 101,746,076 | 98,780,738           | 93                     | 40                | 6                                                  |
| okven-worktrees-feat-specials-fixes · feat/specials-fixes · end-of-plan gate · end-of-plan-gate     | 18     | 70,916,980  | 70,068,976           | 2                      | 0                 | 0                                                  |
| okven-worktrees-eric-attribution-3 · eric/attribution-3 · end-of-plan gate · end-of-plan-gate       | 16     | 66,697,819  | 63,845,395           | 0                      | 0                 | 0                                                  |
| okven-worktrees-fix-menu-pin · fix/menu-pin · critic-plan · implementation_plan/                    | 7      | 71,970,025  | 55,976,566           | 51                     | 2                 | 31                                                 |
| aydy · feat/session-monitor · acceptance · acceptance                                               | 14     | 56,393,970  | 43,256,407           | 38                     | 10                | 6                                                  |
| okven-worktrees-fix-menu-pin · fix/menu-pin · end-of-plan gate · end-of-plan-gate                   | 9      | 33,902,906  | 32,384,146           | 0                      | 0                 | 0                                                  |
| okven-worktrees-eric-attribution-3 · eric/attribution-3 · acceptance · acceptance                   | 16     | 57,793,414  | 31,596,708           | 0                      | 0                 | 0                                                  |
| okven-worktrees-feat-close-out-orders · feat/close-out-orders · end-of-plan gate · end-of-plan-gate | 6      | 32,310,598  | 31,390,834           | 0                      | 0                 | 0                                                  |

## 7. Owner Delta Review notes vs what a gate was told to check

| run (repo/branch)           | owner notes | gate miss: a project rule already existed at note time | gate-miss notes by category                                                                                        |
| --------------------------- | ----------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| okven/eric/attribution-3    | 241         | 26% (63/241)                                           | test-style 20, naming 16, dead-or-duplicate-code 11, convention-violation 9, comment-doc-slop 6, wrong-behaviour 1 |
| okven/feat/specials-fixes   | 158         | 22% (35/158)                                           | test-style 16, convention-violation 7, naming 5, dead-or-duplicate-code 3, comment-doc-slop 3, question 1          |
| okven/fix/menu-pin          | 37          | 32% (12/37)                                            | convention-violation 4, test-style 4, naming 2, comment-doc-slop 1, dead-or-duplicate-code 1                       |
| okven/feat/close-out-orders | 32          | 41% (13/32)                                            | test-style 6, convention-violation 5, naming 1, dead-or-duplicate-code 1                                           |
| okven/feat/voice-notes      | 30          | 20% (6/30)                                             | test-style 4, comment-doc-slop 1, convention-violation 1                                                           |
| **all five**                | 498         | 26% (129/498)                                          | —                                                                                                                  |

| note category          | notes on the five runs | of which a rule already existed (gate miss) |
| ---------------------- | ---------------------- | ------------------------------------------- |
| test-style             | 115                    | 43% (50/115)                                |
| convention-violation   | 69                     | 38% (26/69)                                 |
| question               | 59                     | 2% (1/59)                                   |
| wrong-behaviour        | 59                     | 2% (1/59)                                   |
| naming                 | 53                     | 45% (24/53)                                 |
| ui-visual              | 44                     | 0% (0/44)                                   |
| dead-or-duplicate-code | 35                     | 46% (16/35)                                 |
| comment-doc-slop       | 33                     | 33% (11/33)                                 |
| over-engineering       | 21                     | 0% (0/21)                                   |
| other                  | 6                      | 0% (0/6)                                    |
| missed-requirement     | 4                      | 0% (0/4)                                    |

## 8. Classification accuracy (how much to trust columns 5–12)

| gate                | findings | hand-classified (stratified by round × stated severity) | script agreed with hand | hand: defect | hand: convention | hand: nit   | hand: unclear / extraction artifact |
| ------------------- | -------- | ------------------------------------------------------- | ----------------------- | ------------ | ---------------- | ----------- | ----------------------------------- |
| critic-requirements | 711      | 47                                                      | 53% (25/47)             | 62% (29/47)  | 4% (2/47)        | 26% (12/47) | 9% (4/47)                           |
| critic-plan         | 820      | 48                                                      | 42% (20/48)             | 52% (25/48)  | 13% (6/48)       | 21% (10/48) | 15% (7/48)                          |
| reviewer            | 382      | 46                                                      | 54% (25/46)             | 24% (11/46)  | 41% (19/46)      | 4% (2/46)   | 30% (14/46)                         |
| acceptance          | 425      | 43                                                      | 58% (25/43)             | 23% (10/43)  | 19% (8/43)       | 30% (13/43) | 28% (12/43)                         |
| end-of-plan gate    | 6        | 6                                                       | 50% (3/6)               | 17% (1/6)    | 0% (0/6)         | 0% (0/6)    | 83% (5/6)                           |

Sample shares reweighted to the population (each stratum weighted by its share of the gate's findings, since the sampler took at least one row from every stratum):

| gate                | sample n | share of findings in sampled strata | defect | convention | nit | unclear | implied defect+convention findings in the gate |
| ------------------- | -------- | ----------------------------------- | ------ | ---------- | --- | ------- | ---------------------------------------------- |
| critic-requirements | 47       | 100%                                | 64%    | 4%         | 24% | 7%      | 486                                            |
| critic-plan         | 48       | 100%                                | 54%    | 12%        | 20% | 13%     | 546                                            |
| reviewer            | 46       | 100%                                | 23%    | 41%        | 4%  | 32%     | 244                                            |
| acceptance          | 43       | 100%                                | 23%    | 18%        | 30% | 28%     | 176                                            |
| end-of-plan gate    | 6        | 100%                                | 17%    | 0%         | 0%  | 83%     | 1                                              |

| classification source    | rows |
| ------------------------ | ---- |
| hand                     | 190  |
| script, unambiguous text | 386  |
| script, weak signal      | 1768 |

| outcome evidence source                                                                                        | rows |
| -------------------------------------------------------------------------------------------------------------- | ---- |
| script, unambiguous (a later dispatch or the driver's revision quotes the finding's rare tokens twice or more) | 1085 |
| script, weak (single rare-token match, or absence of any match)                                                | 1259 |

## 9. Role resolution and corpus

| how the role was resolved                                                                                                                                             | runs |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| prompt cites `roles/<role>.md` (mise 2.0.0+ dispatch template)                                                                                                        | 1029 |
| no role signal                                                                                                                                                        | 721  |
| driver-written prompt for an end-of-plan / baseline / sanity-e2e gate run                                                                                             | 94   |
| driver-written prompt that self-describes the role ("a fresh-context critic/reviewer", "acceptance verifier") — the mise 1.x shape, still used ad hoc inside 2.x runs | 50   |

| bucket                                                                                                              | runs |
| ------------------------------------------------------------------------------------------------------------------- | ---- |
| subagent transcripts read                                                                                           | 1894 |
| resolved to a mise role                                                                                             | 1173 |
| **not resolved to a role**                                                                                          | 721  |
| — of those, prompt cites a `.mise/` artifact (driver-authored helpers: citation sweeps, exploration, design passes) | 79   |
| — of those, no mise artifact in the prompt (ad-hoc fan-out in a session that also ran mise, or a non-mise session)  | 642  |

| gate                | mise 1.6.0 | mise 2.0.0 | mise 2.1.0 | version not in prompt |
| ------------------- | ---------- | ---------- | ---------- | --------------------- |
| critic-requirements | 0          | 67         | 7          | 0                     |
| critic-plan         | 0          | 83         | 7          | 0                     |
| reviewer            | 0          | 168        | 66         | 2                     |
| acceptance          | 0          | 35         | 11         | 48                    |
| end-of-plan gate    | 0          | 0          | 0          | 94                    |
| documenter          | 0          | 38         | 101        | 0                     |
| retrospective       | 0          | 12         | 5          | 0                     |

## 10. Gaps

| gap                                                                                                                                                                                                                                                                                                                                                                                                   | effect                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code deleted 177 subagent transcripts during this study (30-day retention); they existed in the 2026-09-19 digest run and were gone by the 2026-09-20 12:35Z snapshot. Whole runs lost: `feat/migrate-firebase-kit` (30 transcripts), `feat/backfill-order-history` (25), `feat/remove-backfill-order-history` (13), plus 59 of 95 aydy, 41 of 645 `eric/attribution-3`, 9 of 50 delta-review. | The corpus shrinks daily. Re-running these scripts on a later day will not reproduce these numbers.                             |
| No surviving role-resolved run cites a 1.x plugin path: `miseVersion` is 2.0.0 on 714 runs, 2.1.0 on 315, absent on 144.                                                                                                                                                                                                                                                                              | This measures mise 2.0.0 and 2.1.0. It says nothing about 1.x.                                                                  |
| `outcome` is inferred from token overlap with the next fix dispatch, the driver's own revision, or a later round. A fix that renames nothing the finding named is invisible.                                                                                                                                                                                                                          | `no-visible-response` is an upper bound on "ignored", not a measurement of it.                                                  |
| `rejected-by-driver` needs rejection language next to the finding's tokens in the following dispatch. The driver usually rejects silently.                                                                                                                                                                                                                                                            | The rejected column is a floor; most of `no-visible-response` is probably silent rejection of minor and informative items.      |
| The splitter cannot always tell a finding from the verification prose around it. Hand sample: 9–30% of extracted rows per gate are artifacts.                                                                                                                                                                                                                                                         | Finding counts are inflated; `unclear` is the artifact column. Rates over defect+convention are the safer read.                 |
| Script-vs-hand agreement on substance is 52% (98/190).                                                                                                                                                                                                                                                                                                                                                | The full-corpus substance columns are indicative. The hand columns in table 8 are the measurement.                              |
| The end-of-plan gate runs mostly in the driver's own thread; only the e2e/sanity/quality runs it delegates appear as subagents.                                                                                                                                                                                                                                                                       | Its 94 runs and 6 findings cover the delegated part only. Main-thread `Format`/`Check`/unit-test failures are not counted here. |
| `round` is scoped to branch+target. A branch that ran mise twice (`eric/attribution-3`, 1.6.0 then 2.0.0) merges both loops; the end-of-plan gate has one target per branch, so its round numbers count every gate run on the branch.                                                                                                                                                                 | Round depth is over-stated for those two cases.                                                                                 |
| Agent-hours sum transcript spans. Parallel and async subagents overlap.                                                                                                                                                                                                                                                                                                                               | Hours over-count elapsed time; use them to compare gates, not to total a run.                                                   |
