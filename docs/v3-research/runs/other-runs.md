# mise runs outside Okven, from git alone

34 runs across 10 repos, 2026-07-17 to 2026-09-18. Built by `tools/map-runs.mjs` (one `<repo>-runs.jsonl` per repo, same schema as `okven-runs.jsonl`); rendered by `tools/other-runs-report.py`. Two `map-runs.mjs` fixes were needed to generalize it off Okven: the friction parser now strips a leading `- ` bullet and tolerates a `critic plan (v2):` suffix — without them the gate-round columns read empty for every repo that writes its friction log as a bullet list. 2 further rows were dropped here as duplicates: a Delta-Review-ref-only run whose branch run carries the same artifact line counts is the same run seen twice (delta-review agentic-change-review, originhypnosis feat/home-page); their artifact evidence is merged into the surviving row.

**Elapsed is the span between commit timestamps, not time worked.** A run whose `.mise` directory reached git in one Delta Review sync has no usable timeline at all.

## Per repo

| repo                        | runs | date range              | run types           | routes                     | mise version ceilings                    | usable timelines | median elapsed h (usable) | median code LOC | status                         |
| --------------------------- | ---- | ----------------------- | ------------------- | -------------------------- | ---------------------------------------- | ---------------- | ------------------------- | --------------- | ------------------------------ |
| delta-review                | 12   | 2026-07-17 → 2026-09-08 | feature 8, bugfix 4 | full 5, bugfix 4, direct 3 | 1.2.0, 1.4.0, 1.5.0, 1.6.0, 1.7.0, 2.0.0 | 11/12            | 5.33                      | 1161            | merged 10, abandoned 1, open 1 |
| metaforico                  | 3    | 2026-08-31 → 2026-09-05 | bugfix 2, feature 1 | bugfix 2, full 1           | 2.0.0                                    | 3/3              | 27.02                     | 289             | merged 3                       |
| aydy                        | 1    | 2026-07-31 → 2026-09-01 | feature 1           | full 1                     | 1.6.0                                    | 1/1              | 750.73                    | 43690           | open 1                         |
| knownhumans                 | 1    | 2026-07-28 → 2026-07-30 | feature 1           | full 1                     | 1.5.0                                    | 1/1              | 51.77                     | 55413           | open 1                         |
| firebase-kit                | 4    | 2026-08-07 → 2026-09-18 | feature 2, bugfix 2 | direct 2, bugfix 2         | 1.6.0, 2.1.0                             | 4/4              | 48.01                     | 2240.5          | merged 4                       |
| ericvera.dev                | 1    | 2026-08-25 → 2026-08-27 | feature 1           | full 1                     | 2.0.0                                    | 1/1              | 63.93                     | 20861           | open 1                         |
| unocss-preset-strict-design | 2    | 2026-07-18 → 2026-07-19 | feature 2           | direct 2                   | 1.4.0                                    | 2/2              | 8.68                      | 1409.5          | merged 2                       |
| scdate                      | 5    | 2026-07-21 → 2026-08-11 | feature 3, bugfix 2 | direct 3, bugfix 2         | 1.4.0, 1.6.0                             | 0/5              | —                         | 276             | merged 5                       |
| originhypnosis              | 1    | 2026-08-29 → 2026-08-31 | feature 1           | — 1                        | 2.0.0                                    | 1/1              | 32.44                     | 2556            | open 1                         |
| mise-claude-plugin          | 4    | 2026-07-28 → 2026-09-12 | feature 3, bugfix 1 | direct 3, bugfix 1         | 1.5.0, 1.6.0, 1.7.0, 2.0.0               | 3/4              | 10.32                     | 641.5           | merged 4                       |

## Every run

| repo                        | start      | end        | branch                                   | type    | route  | mise  | status    | timeline | elapsed h | code LOC | tasks | req ln | plan ln | gate rounds | fix loops |
| --------------------------- | ---------- | ---------- | ---------------------------------------- | ------- | ------ | ----- | --------- | -------- | --------- | -------- | ----- | ------ | ------- | ----------- | --------- |
| delta-review                | 2026-07-17 | 2026-07-17 | agentic-change-review                    | feature | full   | 1.2.0 | merged    | exact    | 3.5       | 2309     | 9     | 89     | 630     | —           | 0         |
| delta-review                | 2026-07-17 | 2026-07-17 | feat/archive-deleted-notes*              | feature | full   | 1.2.0 | merged    | exact    | 1.34      | 242      | 4     | 55     | 310     | —           | 0         |
| delta-review                | 2026-07-17 | 2026-07-18 | feat/archive-deleted-notes*              | feature | full   | 1.2.0 | merged    | exact    | 21.38     | 299      | 3     | 65     | 237     | —           | 0         |
| unocss-preset-strict-design | 2026-07-18 | 2026-07-18 | feat/upgrade-tailwind4                   | feature | direct | 1.4.0 | merged    | exact    | 14.76     | 1103     | 3     | 237    | 702     | p2 r4       | 2         |
| delta-review                | 2026-07-18 | 2026-07-23 | feat/inline-diff-comments                | feature | full   | 1.4.0 | merged    | exact    | 103.09    | 4845     | 10    | 209    | 1227    | p2 r3!      | 6         |
| unocss-preset-strict-design | 2026-07-18 | 2026-07-19 | feat/native-spacing-engine               | feature | direct | 1.4.0 | merged    | exact    | 2.59      | 1716     | 4     | 255    | 328     | p3 r3!      | 1         |
| scdate                      | 2026-07-21 | 2026-07-21 | feat/short-time-format                   | feature | direct | 1.4.0 | merged    | one-sync | —         | 276      | 1     | 42     | 110     | —           | 0         |
| delta-review                | 2026-07-24 | 2026-07-24 | fix/review-notes-wrap                    | bugfix  | bugfix | 1.5.0 | merged    | exact    | 0.61      | 73       | 2     | —      | 173     | p2          | 0         |
| knownhumans                 | 2026-07-28 | 2026-07-30 | eric/seed-from-okven                     | feature | full   | 1.5.0 | open      | exact    | 51.77     | 55413    | 29    | 169    | 1732    | p2 r2       | 44        |
| mise-claude-plugin          | 2026-07-28 | 2026-07-28 | feat/model-delegation                    | feature | direct | 1.5.0 | merged    | one-sync | —         | 1161     | 2     | 42     | 188     | —           | 0         |
| delta-review                | 2026-07-28 | 2026-07-29 | feat/moved-file-detection                | feature | full   | 1.6.0 | merged    | exact    | 19.09     | 2878     | 9     | 174    | 1143    | p3 r7       | 3         |
| scdate                      | 2026-07-31 | 2026-07-31 | feat/scdate-testing                      | feature | direct | 1.6.0 | merged    | one-sync | —         | 449      | 4     | 240    | 1032    | p2 r2       | 6         |
| scdate                      | 2026-07-31 | 2026-07-31 | fix/dst-fallback-and-actions-bump        | bugfix  | bugfix | 1.6.0 | merged    | one-sync | —         | 254      | 3     | —      | 310     | —           | 0         |
| aydy                        | 2026-07-31 | 2026-09-01 | feat/session-monitor                     | feature | full   | 1.6.0 | open      | exact    | 750.73    | 43690    | 25    | 494    | 3761    | p6! r6      | 28        |
| delta-review                | 2026-08-05 | 2026-08-06 | fix/comment-overflow-deleted-files       | bugfix  | bugfix | 1.6.0 | merged    | exact    | 3.89      | 1161     | 2     | —      | 985     | p2          | 2         |
| firebase-kit                | 2026-08-07 | 2026-08-12 | feat/publish-firebase-kit-packages       | feature | direct | 1.6.0 | merged    | exact    | 120.66    | 15545    | 12    | 566    | 2401    | p2 r4!      | 11        |
| scdate                      | 2026-08-11 | 2026-08-11 | feat/iso-week                            | feature | direct | 1.6.0 | merged    | one-sync | —         | 390      | 2     | 44     | 158     | p2          | 0         |
| scdate                      | 2026-08-11 | 2026-08-11 | fix/skipped-midnight                     | bugfix  | bugfix | 1.6.0 | merged    | one-sync | —         | 108      | 2     | —      | 281     | —           | 2         |
| firebase-kit                | 2026-08-13 | 2026-08-17 | fix/upgrade-npm-packages                 | bugfix  | bugfix | 1.6.0 | merged    | exact    | 92.28     | 2308     | 8     | —      | 1559    | p3!         | 0         |
| delta-review                | 2026-08-13 | 2026-08-14 | feat/review-feedback-batch               | feature | direct | 1.6.0 | merged    | exact    | 7.4       | 1559     | 6     | 57     | 467     | p2 r3!      | 0         |
| mise-claude-plugin          | 2026-08-13 | 2026-08-14 | feat/critic-stall-heuristic              | feature | direct | 1.6.0 | merged    | exact    | 21.91     | 27       | 2     | 75     | 167     | r2          | 0         |
| mise-claude-plugin          | 2026-08-18 | 2026-08-19 | feat/next-major-improvements             | feature | direct | 1.7.0 | merged    | exact    | 10.32     | 1161     | 12    | 84     | 834     | p3 r3       | 22        |
| delta-review                | 2026-08-19 | 2026-08-19 | fix/duplicate-reply-boxes                | bugfix  | bugfix | 1.7.0 | abandoned | one-sync | —         | —        | 1     | —      | 100     | p2          | 0         |
| delta-review                | 2026-08-19 | 2026-08-19 | feat/archive-deleted-notes               | feature | direct | 2.0.0 | merged    | exact    | 1.31      | 696      | 3     | 59     | 263     | —           | 2         |
| delta-review                | 2026-08-20 | 2026-08-20 | fix/unmark-all-reviewed-diff-base        | bugfix  | bugfix | 2.0.0 | merged    | exact    | 5.33      | 745      | 3     | —      | 300     | —           | 0         |
| ericvera.dev                | 2026-08-25 | 2026-08-27 | feat/blog                                | feature | full   | 2.0.0 | open      | exact    | 63.93     | 20861    | 23    | 163    | 1351    | p3! r4      | 13        |
| originhypnosis              | 2026-08-29 | 2026-08-31 | feat/home-page                           | feature | —      | 2.0.0 | open      | exact    | 32.44     | 2556     | 0     | —      | —       | —           | 0         |
| metaforico                  | 2026-08-31 | 2026-09-02 | feat/originhypnosis-site                 | feature | full   | 2.0.0 | merged    | exact    | 27.02     | 12686    | 15    | 182    | 2554    | p5 r5!      | 14        |
| metaforico                  | 2026-09-02 | 2026-09-02 | fix/ios-seal-and-photo                   | bugfix  | bugfix | 2.0.0 | merged    | exact    | 16.78     | 289      | 1     | —      | 441     | —           | 2         |
| metaforico                  | 2026-09-03 | 2026-09-05 | fix/ios-ring-arcs-scroll                 | bugfix  | bugfix | 2.0.0 | merged    | exact    | 67.74     | 187      | 1     | —      | 171     | —           | 0         |
| delta-review                | 2026-09-08 | 2026-09-08 | feat/extraction-provenance               | feature | direct | 2.0.0 | open      | exact    | 11.61     | 3421     | 9     | 113    | 729     | p2 r2       | 10        |
| mise-claude-plugin          | 2026-09-12 | 2026-09-12 | fix/doc-churn-usage                      | bugfix  | bugfix | 2.0.0 | merged    | exact    | 2.9       | 122      | 3     | —      | 331     | p6!         | 3         |
| firebase-kit                | 2026-09-14 | 2026-09-15 | feat/keepalive-caller                    | feature | direct | 2.1.0 | merged    | sampled  | 3.73      | 2173     | 6     | 271    | 1160    | r2          | 11        |
| firebase-kit                | 2026-09-18 | 2026-09-18 | fix/get-doc-with-cache-store-reset-retry | bugfix  | bugfix | 2.1.0 | merged    | exact    | 1.71      | 345      | 2     | —      | 424     | p2          | 0         |

`gate rounds`: max critic rounds per gate (g=goals, m=mock, r=requirements, p=plan; `!` = stalled), from `.mise/_friction.md`, else from commit subjects. `elapsed h` is blank where the timeline is not usable.

## Median wall clock per stage (usable timelines only)

27 of 34 runs have a usable timeline (Counter({'checkpoint-commits': 26, 'sampled-snapshots': 1})); the other 7 reached git in a single Delta Review sync.

| stage               | runs with a figure | median h | max h  |
| ------------------- | ------------------ | -------- | ------ |
| goals               | 26                 | 0.72     | 26.61  |
| mock                | 9                  | 0        | 0      |
| requirements        | 18                 | 0.3      | 2.68   |
| plan                | 26                 | 0.36     | 27.9   |
| execute             | 26                 | 0.97     | 472.35 |
| acceptance_closeout | 20                 | 7.98     | 97.61  |
| whole run           | 27                 | 14.76    | 750.73 |

Per repo, same runs:

| repo                        | runs | goals | mock | requirements | plan  | execute | acceptance_closeout | whole run |
| --------------------------- | ---- | ----- | ---- | ------------ | ----- | ------- | ------------------- | --------- |
| delta-review                | 11   | 0.41  | 0    | 0.25         | 0.28  | 0.88    | 2.42                | 5.33      |
| metaforico                  | 3    | 3.22  | 0    | 2.68         | 0.3   | 0.53    | 15.72               | 27.02     |
| aydy                        | 1    | 4.58  | 0    | 1.22         | 27.9  | 472.35  | —                   | 750.73    |
| knownhumans                 | 1    | 4.27  | 0    | 0.18         | 10.33 | 36.98   | —                   | 51.77     |
| firebase-kit                | 4    | 2.53  | —    | 0.0          | 0.29  | 1.58    | 40.54               | 48.01     |
| ericvera.dev                | 1    | 12.51 | 0    | 0.46         | 1.74  | 11.92   | —                   | 63.93     |
| unocss-preset-strict-design | 2    | 0.32  | —    | 0.52         | 0.55  | 0.76    | 13.06               | 8.68      |
| originhypnosis              | 1    | —     | —    | —            | —     | —       | —                   | 32.44     |
| mise-claude-plugin          | 3    | 2.75  | —    | 0.39         | 1.16  | 0.85    | 1.03                | 10.32     |

## Run size distribution

| code LOC          | runs | median LOC | median tasks | usable timelines | median elapsed h | median artifact lines |
| ----------------- | ---- | ---------- | ------------ | ---------------- | ---------------- | --------------------- |
| ≤60               | 1    | 27         | 2            | 1                | 21.91            | 343                   |
| 61–300            | 9    | 242        | 2            | 6                | 9.84             | 418                   |
| 301–1k            | 5    | 449        | 3            | 3                | 1.71             | 426                   |
| 1k–5k             | 13   | 2173       | 6            | 12               | 10.96            | 1238                  |
| >5k               | 5    | 20861      | 23           | 5                | 63.93            | 4246                  |
| LOC unrecoverable | 1    | —          | 1            | 0                | —                | —                     |

## Small runs (≤60 code LOC)

| repo               | branch                      | start      | type    | mise  | code LOC | tasks | elapsed h | timeline | artifact lines | artifact:code | commits |
| ------------------ | --------------------------- | ---------- | ------- | ----- | -------- | ----- | --------- | -------- | -------------- | ------------- | ------- |
| mise-claude-plugin | feat/critic-stall-heuristic | 2026-08-13 | feature | 1.6.0 | 27       | 2     | 21.91     | exact    | 343            | 13×           | 12      |

`artifact lines` sums every `.mise` artifact the run left in git (goals, requirements, plan overview + task files, mocks, friction, progress, exploration). n = 1: only one run in the ten repos is at or under 60 code LOC. The next bracket, for comparison:

| repo               | branch                            | start      | type    | mise  | code LOC | tasks | elapsed h | timeline | artifact lines | artifact:code | commits |
| ------------------ | --------------------------------- | ---------- | ------- | ----- | -------- | ----- | --------- | -------- | -------------- | ------------- | ------- |
| delta-review       | fix/review-notes-wrap             | 2026-07-24 | bugfix  | 1.5.0 | 73       | 2     | 0.61      | exact    | 222            | 3x            | 9       |
| scdate             | fix/skipped-midnight              | 2026-08-11 | bugfix  | 1.6.0 | 108      | 2     | —         | one-sync | 390            | 4x            | 6       |
| mise-claude-plugin | fix/doc-churn-usage               | 2026-09-12 | bugfix  | 2.0.0 | 122      | 3     | 2.9       | exact    | 453            | 4x            | 24      |
| metaforico         | fix/ios-ring-arcs-scroll          | 2026-09-03 | bugfix  | 2.0.0 | 187      | 1     | 67.74     | exact    | 354            | 2x            | 10      |
| delta-review       | feat/archive-deleted-notes*       | 2026-07-17 | feature | 1.2.0 | 242      | 4     | 1.34      | exact    | 746            | 3x            | 14      |
| scdate             | fix/dst-fallback-and-actions-bump | 2026-07-31 | bugfix  | 1.6.0 | 254      | 3     | —         | one-sync | 418            | 2x            | 6       |
| scdate             | feat/short-time-format            | 2026-07-21 | feature | 1.4.0 | 276      | 1     | —         | one-sync | 213            | 1x            | 3       |
| metaforico         | fix/ios-seal-and-photo            | 2026-09-02 | bugfix  | 2.0.0 | 289      | 1     | 16.78     | exact    | 662            | 2x            | 13      |
| delta-review       | feat/archive-deleted-notes*       | 2026-07-17 | feature | 1.2.0 | 299      | 3     | 21.38     | exact    | 669            | 2x            | 14      |

## Evidence surviving per run

| repo                        | branch                                   | _friction.md | lines | _progress.md | retro proposals (transcript) | sessions naming the branch | sessions overlapping in repo | MB   | mise subagents | Delta notes | review refs | friction.jsonl items |
| --------------------------- | ---------------------------------------- | ------------ | ----- | ------------ | ---------------------------- | -------------------------- | ---------------------------- | ---- | -------------- | ----------- | ----------- | -------------------- |
| aydy                        | feat/session-monitor                     | yes          | 46    | yes          | —                            | 1                          | 2                            | 1.9  | 24             | —           | 1           | 74                   |
| delta-review                | agentic-change-review                    | —            |       | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 7                    |
| delta-review                | feat/archive-deleted-notes*              | —            |       | yes          | —                            | —                          | —                            | —    | —              | —           | —           | —                    |
| delta-review                | feat/archive-deleted-notes*              | —            |       | yes          | —                            | —                          | —                            | —    | —              | —           | —           | —                    |
| delta-review                | feat/inline-diff-comments                | yes          | 12    | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 1                    |
| delta-review                | fix/review-notes-wrap                    | yes          | 3     | yes          | —                            | —                          | —                            | —    | —              | —           | —           | 34                   |
| delta-review                | feat/moved-file-detection                | yes          | 11    | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 21                   |
| delta-review                | fix/comment-overflow-deleted-files       | yes          | 5     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 6                    |
| delta-review                | feat/review-feedback-batch               | yes          | 5     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 8                    |
| delta-review                | fix/duplicate-reply-boxes                | yes          | 3     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 1                    |
| delta-review                | feat/archive-deleted-notes               | yes          | 3     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 5                    |
| delta-review                | fix/unmark-all-reviewed-diff-base        | —            |       | yes          | 1                            | 1                          | 1                            | 1.0  | 9              | —           | —           | 1                    |
| delta-review                | feat/extraction-provenance               | yes          | 10    | yes          | —                            | 1                          | 1                            | 2.0  | 30             | —           | 1           | 17                   |
| ericvera.dev                | feat/blog                                | yes          | 17    | yes          | —                            | 3                          | 3                            | 6.2  | 73             | 2           | 2           | 50                   |
| firebase-kit                | feat/publish-firebase-kit-packages       | yes          | 23    | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 29                   |
| firebase-kit                | fix/upgrade-npm-packages                 | yes          | 5     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 9                    |
| firebase-kit                | feat/keepalive-caller                    | yes          | 13    | yes          | 7                            | 1                          | 1                            | 3.2  | 34             | 6           | 1           | 22                   |
| firebase-kit                | fix/get-doc-with-cache-store-reset-retry | yes          | 3     | yes          | 3                            | 1                          | 1                            | 1.3  | 8              | —           | 1           | 5                    |
| knownhumans                 | eric/seed-from-okven                     | yes          | 35    | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 88                   |
| metaforico                  | feat/originhypnosis-site                 | yes          | 16    | yes          | 9                            | 3                          | 3                            | 24.9 | 55             | —           | 1           | 47                   |
| metaforico                  | fix/ios-seal-and-photo                   | yes          | 3     | yes          | 6                            | 1                          | 1                            | 0.9  | 7              | —           | 2           | 9                    |
| metaforico                  | fix/ios-ring-arcs-scroll                 | —            |       | yes          | 4                            | 1                          | 1                            | 1.1  | 6              | —           | 1           | 5                    |
| mise-claude-plugin          | feat/model-delegation                    | yes          | 3     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 3                    |
| mise-claude-plugin          | feat/critic-stall-heuristic              | yes          | 3     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 3                    |
| mise-claude-plugin          | feat/next-major-improvements             | yes          | 19    | yes          | —                            | —                          | —                            | —    | —              | 1           | 2           | 37                   |
| mise-claude-plugin          | fix/doc-churn-usage                      | yes          | 13    | yes          | 7                            | 2                          | 2                            | 3.0  | 11             | —           | 1           | 26                   |
| originhypnosis              | feat/home-page                           | —            |       | —            | —                            | 2                          | 2                            | 28.4 | —              | —           | 1           | —                    |
| scdate                      | feat/short-time-format                   | —            |       | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 1                    |
| scdate                      | feat/scdate-testing                      | yes          | 8     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 14                   |
| scdate                      | fix/dst-fallback-and-actions-bump        | —            |       | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 3                    |
| scdate                      | feat/iso-week                            | yes          | 3     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 1                    |
| scdate                      | fix/skipped-midnight                     | yes          | 3     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 3                    |
| unocss-preset-strict-design | feat/upgrade-tailwind4                   | yes          | 7     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 10                   |
| unocss-preset-strict-design | feat/native-spacing-engine               | yes          | 6     | yes          | —                            | —                          | —                            | —    | —              | —           | 1           | 8                    |

`sessions` / `MB` / `mise subagents` come from `runs/transcript-index.jsonl` (sessions naming the branch whose window overlaps the run). `Delta notes` from `runs/delta-notes.jsonl` (see `runs/delta-notes.md`). `retro proposals` are rows in `runs/friction.jsonl` parsed out of that run's retrospective subagent transcript.

## Evidence coverage, all runs

| evidence                                               | runs | share of all runs |
| ------------------------------------------------------ | ---- | ----------------- |
| `.mise/_friction.md` survives                          | 26   | 76%               |
| `.mise/implementation_plan/_progress.md` survives      | 33   | 97%               |
| a retrospective report survives in a transcript        | 7    | 21%               |
| a transcript session names the branch                  | 11   | 32%               |
| a transcript session overlaps the run in the same repo | 11   | 32%               |
| Delta Review notes survive                             | 3    | 9%                |
| a Delta Review state ref survives                      | 30   | 88%               |
| usable timeline                                        | 27   | 79%               |
| code LOC recoverable                                   | 33   | 97%               |
