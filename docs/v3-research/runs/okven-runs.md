# mise runs in Okven, from git alone

34 runs, 2026-07-15 to 2026-09-19. Built by `tools/map-runs.mjs`; every field is in `okven-runs.jsonl`.

**Elapsed time here is the span between commit timestamps, not time worked.** Git records when a commit was written, never how long anyone was at the keyboard, so a run that spans three days may hold two hours of work. Active time is not recoverable from git; the transcript directories named in the JSONL are the only place it could be measured.

Timeline quality per run: **checkpoint-commits** 10 (mise wrote a commit per stage approval and per task — stage boundaries are exact), **sampled-snapshots** 4 (branch deleted; boundaries come from Delta Review sync commits, so each stage end is an upper bound and the run span a lower bound), **single-sync-snapshot** 20 (the whole `.mise` directory reached git in one sync — its timestamps say nothing about duration). Only the first two appear in the timing tables below.

## Runs, by date

| start      | end        | branch                             | type    | route  | mise  | status    | timeline | elapsed h | LOC   | code LOC | tasks | req ln | plan ln | gate rounds | fix loops |
| ---------- | ---------- | ---------------------------------- | ------- | ------ | ----- | --------- | -------- | --------- | ----- | -------- | ----- | ------ | ------- | ----------- | --------- |
| 2026-07-15 | 2026-07-21 | eric/item-schedule-ui              | feature | full   | 1.0.1 | merged    | exact    | 163.4     | 8012  | 7966     | 9     | 138    | 78      | —           | 7         |
| 2026-07-21 | 2026-07-21 | eric/item-availability-retro       | feature | —      | 1.4.0 | merged    | one-sync | —         | 47    | 47       | 9     | —      | —       | —           | —         |
| 2026-07-22 | 2026-07-22 | eric/fix-logo-size                 | bugfix  | bugfix | 1.4.0 | merged    | exact    | 4.0       | 12    | 12       | 1     | —      | 67      | —           | 0         |
| 2026-07-23 | 2026-07-24 | eric/restaurant-sales-deck         | feature | full   | 1.4.0 | merged    | one-sync | —         | 3209  | 3209     | 10    | 87     | 101     | —           | 0         |
| 2026-07-23 | 2026-07-23 | eric/playright-token-usage-fix     | feature | direct | 1.4.0 | merged    | one-sync | —         | 1018  | 1018     | 2     | 185    | 116     | r2 p2       | 0         |
| 2026-07-23 | 2026-07-23 | eric/order-at-time                 | feature | —      | 1.4.0 | open      | exact    | 0         | 0     | 0        | 0     | —      | —       | —           | —         |
| 2026-07-24 | 2026-07-24 | eric/referrer-tracking             | feature | —      | 1.5.0 | abandoned | one-sync | —         | —     | —        | 0     | —      | —       | —           | —         |
| 2026-07-24 | 2026-07-24 | eric/menu-availability             | feature | full   | 1.5.0 | merged    | one-sync | —         | 919   | 919      | 3     | 127    | 101     | —           | 0         |
| 2026-07-24 | 2026-07-24 | eric/fix-ending-slash              | bugfix  | bugfix | 1.5.0 | merged    | one-sync | —         | 10    | 10       | 1     | —      | 53      | —           | 0         |
| 2026-07-25 | 2026-07-27 | eric/fab-snippet                   | feature | full   | 1.5.0 | merged    | one-sync | —         | 574   | 574      | 4     | 231    | 98      | r3 p2       | 1         |
| 2026-07-28 | 2026-07-30 | eric/attribution-2                 | feature | full   | 1.5.0 | abandoned | one-sync | —         | —     | —        | 14    | 118    | 77      | r6!         | 7         |
| 2026-07-28 | 2026-07-28 | eric/item-name-size-inc            | feature | direct | 1.6.0 | merged    | one-sync | —         | 127   | 127      | 1     | 32     | 32      | —           | 0         |
| 2026-07-29 | 2026-07-30 | eric/visual-fixes                  | feature | full   | 1.6.0 | merged    | one-sync | —         | 567   | 567      | 11    | 88     | 46      | —           | 0         |
| 2026-07-30 | 2026-07-30 | fix/malformed-manifest             | bugfix  | bugfix | 1.6.0 | merged    | one-sync | —         | 9     | 9        | 1     | —      | 98      | p2          | 0         |
| 2026-07-31 | 2026-08-06 | eric/extract-firebase-callables    | feature | direct | 1.6.0 | merged    | sampled  | 143.4     | 20268 | 20140    | 27    | 554    | 168     | r4! p3!     | 4         |
| 2026-08-01 | 2026-08-02 | _(unknown)_                        | feature | direct | 1.6.0 | abandoned | exact    | 41.1      | 980   | 980      | 6     | 465    | 169     | r5!         | 0         |
| 2026-08-02 | 2026-09-06 | eric/attribution-3                 | feature | full   | 1.6.0 | merged    | exact    | 841.0     | 52626 | 52559    | 50    | 1130   | 98      | r8! p3!     | 40        |
| 2026-08-07 | 2026-08-19 | eric/lo-de-siempre                 | feature | full   | 1.6.0 | merged    | one-sync | —         | 17137 | 17137    | 12    | 240    | 151     | p2          | 5         |
| 2026-08-19 | 2026-08-20 | feat/backfill-order-history        | feature | direct | 2.0.0 | merged    | one-sync | —         | 1795  | 1795     | 5     | 171    | 103     | —           | 0         |
| 2026-08-19 | 2026-08-20 | feat/migrate-firebase-kit          | feature | direct | 2.0.0 | merged    | sampled  | 25.0      | 15341 | 14366    | 7     | 77     | 50      | r2 p2       | 0         |
| 2026-08-21 | 2026-08-21 | feat/remove-backfill-order-history | feature | direct | 2.0.0 | merged    | one-sync | —         | 1769  | 1769     | 4     | 79     | 103     | —           | 0         |
| 2026-08-21 | 2026-08-31 | feat/specials-fixes                | feature | full   | 2.0.0 | merged    | sampled  | 236.4     | 35746 | 33798    | 20    | 468    | 348     | p6! r5!     | 5         |
| 2026-08-21 | 2026-08-24 | fix/menu-preview-changes           | feature | full   | 2.0.0 | merged    | one-sync | —         | 3100  | 3100     | 8     | 241    | 165     | r5 p7!      | 1         |
| 2026-08-26 | 2026-08-31 | feat/close-out-orders              | feature | full   | 2.0.0 | merged    | sampled  | 138.1     | 4288  | 4288     | 8     | 59     | 55      | p2          | 2         |
| 2026-09-05 | 2026-09-05 | fix/menu-availability              | bugfix  | bugfix | 2.0.0 | merged    | one-sync | —         | 63    | 63       | 2     | —      | 143     | p2          | 1         |
| 2026-09-05 | 2026-09-05 | fix/missing-image                  | bugfix  | bugfix | 2.0.0 | merged    | one-sync | —         | 31    | 31       | 1     | —      | 83      | p2          | 0         |
| 2026-09-06 | 2026-09-09 | eric/attribution-3                 | feature | full   | 2.0.0 | abandoned | exact    | 68.2      | 71728 | 71728    | 40    | 497    | 265     | r5! p5!     | 21        |
| 2026-09-07 | 2026-09-09 | feat/voice-notes                   | feature | full   | 2.0.0 | merged    | one-sync | —         | 8761  | 8761     | 10    | 209    | 193     | r3 p3       | 5         |
| 2026-09-07 | 2026-09-19 | feat/first-time-offer              | feature | full   | 2.0.0 | open      | exact    | 276.8     | 11536 | 11536    | 21    | 125    | 132     | r4 p5!      | 9         |
| 2026-09-07 | 2026-09-19 | feat/tips                          | feature | full   | 2.0.0 | open      | exact    | 273.6     | 5583  | 5583     | 17    | 121    | 108     | r12! p3     | 5         |
| 2026-09-10 | 2026-09-10 | fix/voice-note-not-transcribed     | bugfix  | bugfix | 2.0.0 | merged    | one-sync | —         | 1146  | 1146     | 3     | —      | 129     | p3          | 2         |
| 2026-09-10 | 2026-09-12 | fix/menu-pin                       | feature | full   | 2.0.0 | merged    | one-sync | —         | 17675 | 17675    | 10    | 345    | 160     | r6! p7!     | 9         |
| 2026-09-18 | 2026-09-19 | feat/remove-k-prop-migration       | feature | direct | 2.1.0 | merged    | exact    | 2.2       | 920   | 920      | 3     | 35     | 49      | r2 p2       | 1         |
| 2026-09-18 | 2026-09-19 | feat/upgrade-packages              | feature | direct | 2.1.0 | merged    | exact    | 14.5      | 285   | 274      | 1     | 18     | 31      | —           | 1         |

`gate rounds`: max critic rounds per gate from `.mise/_friction.md` (g=goals, m=mock, r=requirements, p=plan; `!` = the gate stalled or hit its ceiling). `fix loops`: review findings that sent a finished task back, from `_friction.md`, else `fix` sections in `_progress.md`. `—` in `elapsed h` means the run has no usable timeline.

## Stage wall clock (median / p90 hours)

| run type | runs | goals          | mock        | requirements   | plan           | execute         | acceptance_closeout | whole run (median) |
| -------- | ---- | -------------- | ----------- | -------------- | -------------- | --------------- | ------------------- | ------------------ |
| feature  | 13   | 1.8 / 74.8 ·12 | 0 / 61.6 ·7 | 0.6 / 10.3 ·12 | 1.3 / 17.0 ·12 | 3.6 / 245.5 ·12 | 11.9 / 302.6 ·4     | 138.1              |
| bugfix   | 1    | 0.4 / 0.4 ·1   | —           | —              | 0.1 / 0.1 ·1   | 0.4 / 0.4 ·1    | 3.2 / 3.2 ·1        | 4.0                |
| all      | 14   | 0.7 / 74.6 ·13 | 0 / 61.6 ·7 | 0.6 / 10.3 ·12 | 1.1 / 15.6 ·13 | 2.9 / 225.3 ·13 | 11.6 / 261.1 ·5     | 103.2              |

| mise major | runs | goals           | mock        | requirements  | plan          | execute        | acceptance_closeout | whole run (median) |
| ---------- | ---- | --------------- | ----------- | ------------- | ------------- | -------------- | ------------------- | ------------------ |
| 1.x        | 6    | 42.4 / 202.3 ·5 | 0 / 0 ·2    | 1.6 / 86.8 ·4 | 0.2 / 13.4 ·5 | 0.7 / 6.2 ·5   | 12.3 / 344.0 ·3     | 92.3               |
| 2.x        | 8    | 0.3 / 26.2 ·8   | 0 / 90.9 ·5 | 0.5 / 4.5 ·8  | 1.3 / 8.9 ·8  | 7.0 / 265.8 ·8 | 6.1 / 10.5 ·2       | 103.2              |

Each stage cell is `median / p90 ·runs-with-that-stage-recorded`; the `runs` column counts runs in the group. `mock` medians of 0 are real: goals and mock are approved in the same commit at one human gate.

Stage hours are measured from the previous stage's approval to this stage's last approval in `.mise/.workflow-state` history; `execute` runs to the last task moved to `done/`; `acceptance_closeout` runs from there to the commit that deletes the mise directory (only 6 runs got that far in a surviving history). A stage re-opened by a later edit is counted up to its last approval, so cascades land in the stage that caused them.

## Run size against elapsed time

| non-.mise LOC | runs | with usable timeline | median elapsed h | p90 elapsed h | median tasks | median plan ln |
| ------------- | ---- | -------------------- | ---------------- | ------------- | ------------ | -------------- |
| 0–60          | 6    | 2                    | 2.0              | 3.6           | 1            | 75             |
| 61–500        | 3    | 1                    | 14.5             | 14.5          | 1            | 32             |
| 501–2 000     | 9    | 2                    | 21.7             | 37.3          | 4            | 103            |
| 2 001–10 000  | 6    | 3                    | 163.4            | 251.6         | 9.5          | 104.5          |
| > 10 000      | 8    | 6                    | 189.9            | 558.9         | 20.5         | 155.5          |

| run                             | LOC   | elapsed h | h per 100 LOC | tasks | timeline |
| ------------------------------- | ----- | --------- | ------------- | ----- | -------- |
| eric/order-at-time              | 0     | 0         | —             | 0     | exact    |
| eric/fix-logo-size              | 12    | 4.0       | 33.6          | 1     | exact    |
| feat/upgrade-packages           | 285   | 14.5      | 5.1           | 1     | exact    |
| feat/remove-k-prop-migration    | 920   | 2.2       | 0.2           | 3     | exact    |
| _(unknown)_                     | 980   | 41.1      | 4.2           | 6     | exact    |
| feat/close-out-orders           | 4288  | 138.1     | 3.2           | 8     | sampled  |
| feat/tips                       | 5583  | 273.6     | 4.9           | 17    | exact    |
| eric/item-schedule-ui           | 8012  | 163.4     | 2.0           | 9     | exact    |
| feat/first-time-offer           | 11536 | 276.8     | 2.4           | 21    | exact    |
| feat/migrate-firebase-kit       | 15341 | 25.0      | 0.2           | 7     | sampled  |
| eric/extract-firebase-callables | 20268 | 143.4     | 0.7           | 27    | sampled  |
| feat/specials-fixes             | 35746 | 236.4     | 0.7           | 20    | sampled  |
| eric/attribution-3              | 52626 | 841.0     | 1.6           | 50    | exact    |
| eric/attribution-3              | 71728 | 68.2      | 0.1           | 40    | exact    |

2 runs have no recoverable size (branch ref deleted and no main commit matches their file set): eric/referrer-tracking, eric/attribution-2.

## SMALL RUNS — 60 or fewer non-.mise LOC

| run                          | date       | LOC | files | tasks | mise  | timeline | goals | mock | requirements | plan | execute | acceptance_closeout | total h | transcript span h |
| ---------------------------- | ---------- | --- | ----- | ----- | ----- | -------- | ----- | ---- | ------------ | ---- | ------- | ------------------- | ------- | ----------------- |
| eric/item-availability-retro | 2026-07-21 | 47  | 3     | 9     | 1.4.0 | one-sync | —     | —    | —            | —    | —       | —                   | —       | —                 |
| eric/fix-logo-size           | 2026-07-22 | 12  | 4     | 1     | 1.4.0 | exact    | 0.4   | —    | —            | 0.1  | 0.4     | 3.2                 | 4.0     | —                 |
| eric/order-at-time           | 2026-07-23 | 0   | 0     | 0     | 1.4.0 | exact    | —     | —    | —            | —    | —       | —                   | 0       | —                 |
| eric/fix-ending-slash        | 2026-07-24 | 10  | 1     | 1     | 1.5.0 | one-sync | —     | —    | —            | —    | —       | —                   | —       | —                 |
| fix/malformed-manifest       | 2026-07-30 | 9   | 1     | 1     | 1.6.0 | one-sync | —     | —    | —            | —    | —       | —                   | —       | —                 |
| fix/missing-image            | 2026-09-05 | 31  | 3     | 1     | 2.0.0 | one-sync | —     | —    | —            | —    | —       | —                   | —       | 0                 |

| run                          | goal                                                         | artifacts written for it (lines)                      | artifact lines ÷ LOC | gate rounds | landed as                                              |
| ---------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- | -------------------- | ----------- | ------------------------------------------------------ |
| eric/item-availability-retro | —                                                            | goals — · req — · plan — · tasks 0 · progress —       | 0×                   | —           | 4e130275b chore: adopt item-availability retrospective |
| eric/fix-logo-size           | Bug: Okven logo renders huge on the home page (and other bar | goals 98 · req — · plan 67 · tasks 158 · progress 23  | 29.2×                | —           | 104e97960 fix: oversized Okven logo on home/menu + non |
| eric/order-at-time           | Goal: support order for a specific time (scheduled / order-a | goals 444 · req — · plan — · tasks 0 · progress —     | —                    | —           | open                                                   |
| eric/fix-ending-slash        | Bug: trailing slash on public vanity/menu URLs returns 404   | goals 66 · req — · plan 53 · tasks 125 · progress 16  | 26×                  | —           | 66128022f fix: trailing slash on public vanity/menu UR |
| fix/malformed-manifest       | Bug: "Received malformed app manifest" crashes the order ter | goals 121 · req — · plan 98 · tasks 272 · progress 37 | 59.4×                | p2          | 889cb7f94 fix: order terminal crashes after a deploy w |
| fix/missing-image            | Goal: stale PWA manifest served from the service-worker prec | goals 81 · req — · plan 83 · tasks 170 · progress 113 | 14.6×                | p2          | 3ba254cbd fix: stop precaching the web manifest so old |

`transcript span h` is the mtime range of the Claude Code session files in the matching worktree project directory — a filesystem signal, not git, and it covers every session in that worktree, so it is an upper bound on one run. It is the only wall-clock evidence available for a run whose mise directory reached git in a single sync.
