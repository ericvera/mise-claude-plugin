# Line evidence

Every non-blank line of every shipped skill file maps to an id here. A line that maps to nothing is cut.

- `E-nnn` — `scorecard/evidence.jsonl` on the `v3-research` branch (https://github.com/ericvera/mise-claude-plugin/tree/v3-research/docs/v3-research).
- `O-nn` — a row of `scorecard/driver-overlay.md` on that branch.
- `D-nn` — a decision in the 2026-09-22 table of `decisions.md` on that branch. `D-01` (build to the overlay) covers a mechanism the overlay leaves untouched, where the draft scorecard's verdict stands (driver-overlay.md:3); the scorecard mechanism id is named in parentheses.
- `glue` — frontmatter, headings, fences, and table or template syntax.

Verify with `node tools/check-line-evidence.mjs` from that branch's checkout, run against this one.

| file                                       | lines   | ids                         |
| ------------------------------------------ | ------- | --------------------------- |
| skills/next/SKILL.md                       | 1-8     | glue                        |
| skills/next/SKILL.md                       | 9       | E-005 (M01)                 |
| skills/next/SKILL.md                       | 10-13   | glue                        |
| skills/next/SKILL.md                       | 14      | E-002, E-005                |
| skills/next/SKILL.md                       | 15-17   | glue                        |
| skills/next/SKILL.md                       | 18      | D-01 (M03)                  |
| skills/next/SKILL.md                       | 19      | O-07                        |
| skills/next/SKILL.md                       | 20      | O-13, D-02                  |
| skills/next/SKILL.md                       | 21      | D-01 (M03)                  |
| skills/next/SKILL.md                       | 22-24   | glue                        |
| skills/next/SKILL.md                       | 25      | O-07, E-066                 |
| skills/next/SKILL.md                       | 26-28   | glue                        |
| skills/next/SKILL.md                       | 29-31   | E-058, E-073                |
| skills/next/SKILL.md                       | 32-33   | E-058                       |
| skills/next/SKILL.md                       | 34      | E-006, O-13                 |
| skills/next/SKILL.md                       | 35      | E-058                       |
| skills/next/SKILL.md                       | 36      | E-073 (M05)                 |
| skills/next/SKILL.md                       | 37      | O-12, D-10                  |
| skills/next/SKILL.md                       | 38-40   | glue                        |
| skills/next/SKILL.md                       | 41      | E-051, D-01 (M07)           |
| skills/next/SKILL.md                       | 42      | D-01 (M08)                  |
| skills/next/SKILL.md                       | 43      | O-13                        |
| skills/next/SKILL.md                       | 44      | E-058                       |
| skills/next/SKILL.md                       | 45-47   | glue                        |
| skills/next/SKILL.md                       | 48      | D-01, E-005, E-064          |
| skills/next/SKILL.md                       | 49-51   | glue                        |
| skills/next/SKILL.md                       | 52      | E-051                       |
| skills/next/SKILL.md                       | 53-55   | glue                        |
| skills/next/SKILL.md                       | 56      | E-050, E-049                |
| skills/next/SKILL.md                       | 57-65   | E-050                       |
| skills/next/SKILL.md                       | 66      | E-050                       |
| skills/next/SKILL.md                       | 67-69   | glue                        |
| skills/next/SKILL.md                       | 70      | E-006, E-051, O-12          |
| skills/next/flow.md                        | 1-2     | glue                        |
| skills/next/flow.md                        | 3       | O-13, D-02                  |
| skills/next/flow.md                        | 4-5     | O-09, D-07                  |
| skills/next/flow.md                        | 6-8     | glue                        |
| skills/next/flow.md                        | 9       | O-13                        |
| skills/next/flow.md                        | 10-11   | E-048, E-049                |
| skills/next/flow.md                        | 12      | E-081, D-01 (M10)           |
| skills/next/flow.md                        | 13      | O-05, O-13                  |
| skills/next/flow.md                        | 14      | E-073, O-09                 |
| skills/next/flow.md                        | 15-17   | glue                        |
| skills/next/flow.md                        | 18      | O-13, E-049                 |
| skills/next/flow.md                        | 19-20   | E-049, E-048                |
| skills/next/flow.md                        | 21      | E-050, E-049                |
| skills/next/flow.md                        | 22      | E-078, E-052                |
| skills/next/flow.md                        | 23      | E-049                       |
| skills/next/flow.md                        | 24      | E-051, O-13                 |
| skills/next/flow.md                        | 25-27   | glue                        |
| skills/next/flow.md                        | 28      | O-03, O-13                  |
| skills/next/flow.md                        | 29-30   | E-061, O-03                 |
| skills/next/flow.md                        | 31-35   | O-03, O-13, O-04            |
| skills/next/flow.md                        | 36-37   | O-08                        |
| skills/next/flow.md                        | 38      | O-08, D-01 (M44)            |
| skills/next/flow.md                        | 39-41   | O-08                        |
| skills/next/flow.md                        | 42      | D-01 (M45)                  |
| skills/next/flow.md                        | 43      | O-03                        |
| skills/next/flow.md                        | 44      | E-073                       |
| skills/next/flow.md                        | 45-47   | glue                        |
| skills/next/flow.md                        | 48      | O-13, O-04                  |
| skills/next/flow.md                        | 49-50   | O-04, D-08                  |
| skills/next/flow.md                        | 51-53   | glue                        |
| skills/next/flow.md                        | 54      | O-13                        |
| skills/next/flow.md                        | 55-56   | E-074                       |
| skills/next/flow.md                        | 57-58   | E-074, E-002                |
| skills/next/flow.md                        | 59      | O-10, E-019                 |
| skills/next/flow.md                        | 60      | E-018, E-076                |
| skills/next/flow.md                        | 61      | E-073                       |
| skills/next/flow.md                        | 62-63   | E-037, E-038, O-08          |
| skills/next/flow.md                        | 64-66   | glue                        |
| skills/next/flow.md                        | 67      | O-15, D-12                  |
| skills/next/flow.md                        | 68-69   | O-15, D-12, E-041           |
| skills/next/flow.md                        | 70-72   | glue                        |
| skills/next/flow.md                        | 73      | O-13                        |
| skills/next/flow.md                        | 74-75   | O-01                        |
| skills/next/flow.md                        | 76-78   | glue                        |
| skills/next/flow.md                        | 79      | O-13, O-12                  |
| skills/next/flow.md                        | 80-81   | O-01, O-12, E-051           |
| skills/next/flow.md                        | 82-83   | O-09, O-12                  |
| skills/next/flow.md                        | 84-85   | O-12, E-054                 |
| skills/next/flow.md                        | 86      | O-12                        |
| skills/next/flow.md                        | 87      | O-11, D-09, O-12            |
| skills/next/flow.md                        | 88      | O-12                        |
| skills/next/flow.md                        | 89-90   | E-055, O-12, D-10           |
| skills/next/flow.md                        | 91-93   | glue                        |
| skills/next/flow.md                        | 94      | O-13, D-10                  |
| skills/next/flow.md                        | 95-96   | O-06, E-066, E-023          |
| skills/next/flow.md                        | 97-98   | O-06, D-10                  |
| skills/next/flow.md                        | 99-101  | glue                        |
| skills/next/flow.md                        | 102     | O-13                        |
| skills/next/flow.md                        | 103-104 | D-07, O-12, D-01 (M27, M61) |
| skills/next/flow.md                        | 105-107 | glue                        |
| skills/next/flow.md                        | 108     | O-11, D-09                  |
| skills/next/flow.md                        | 109-112 | glue, O-11                  |
| skills/next/flow.md                        | 113-114 | O-11, D-09                  |
| skills/next/stages/setup.md                | 1-2     | glue                        |
| skills/next/stages/setup.md                | 3       | O-07, E-064                 |
| skills/next/stages/setup.md                | 4-5     | O-07, E-050                 |
| skills/next/stages/setup.md                | 6-7     | O-07                        |
| skills/next/stages/setup.md                | 8       | O-07, E-081                 |
| skills/next/stages/setup.md                | 9       | O-07, E-066                 |
| skills/next/stages/setup.md                | 10      | D-01 (M27)                  |
| skills/next/stages/setup.md                | 11-12   | O-07, E-064, E-068          |
| skills/next/stages/setup.md                | 13-14   | O-07, E-064                 |
| skills/next/stages/setup.md                | 15-18   | E-080, D-01 (M28)           |
| skills/next/stages/setup.md                | 19-20   | E-073                       |
| skills/next/roles/implementer.md           | 1-2     | glue                        |
| skills/next/roles/implementer.md           | 3       | E-002, E-076                |
| skills/next/roles/implementer.md           | 4-5     | O-08, E-065                 |
| skills/next/roles/implementer.md           | 6       | O-05, D-01 (M40)            |
| skills/next/roles/implementer.md           | 7       | O-08, E-065                 |
| skills/next/roles/implementer.md           | 8       | D-05, E-027, E-044          |
| skills/next/roles/implementer.md           | 9       | E-066, E-070, O-08          |
| skills/next/roles/implementer.md           | 10      | E-074                       |
| skills/next/roles/implementer.md           | 11      | E-046, E-039                |
| skills/next/roles/implementer.md           | 12      | E-037, E-038                |
| skills/next/roles/implementer.md           | 13      | E-073                       |
| skills/next/roles/implementer.md           | 14-15   | E-051, E-002                |
| skills/next/roles/implementer.md           | 16-17   | E-074, D-01 (M45)           |
| skills/next/roles/reviewer.md              | 1-2     | glue                        |
| skills/next/roles/reviewer.md              | 3       | O-10, E-018                 |
| skills/next/roles/reviewer.md              | 4-5     | O-10, E-020                 |
| skills/next/roles/reviewer.md              | 6-7     | O-15                        |
| skills/next/roles/reviewer.md              | 8-10    | E-020, E-040                |
| skills/next/roles/reviewer.md              | 11      | E-070, E-040                |
| skills/next/roles/reviewer.md              | 12      | E-065                       |
| skills/next/roles/reviewer.md              | 13-14   | O-15, E-035, E-036          |
| skills/next/roles/reviewer.md              | 15-16   | O-09, E-018                 |
| skills/next/roles/critic.md                | 1-2     | glue                        |
| skills/next/roles/critic.md                | 3       | O-04, D-08                  |
| skills/next/roles/critic.md                | 4-5     | O-04                        |
| skills/next/roles/critic.md                | 6-7     | O-13, O-04                  |
| skills/next/roles/critic.md                | 8       | O-03                        |
| skills/next/roles/critic.md                | 9       | O-04, E-011                 |
| skills/next/roles/critic.md                | 10-11   | O-04                        |
| skills/next/roles/critic.md                | 12-13   | O-04, D-08                  |
| skills/next/roles/adherence.md             | 1-2     | glue                        |
| skills/next/roles/adherence.md             | 3       | O-15, D-12                  |
| skills/next/roles/adherence.md             | 4-5     | O-15, D-03, E-039           |
| skills/next/roles/adherence.md             | 6-7     | O-15, D-12                  |
| skills/next/roles/adherence.md             | 8-9     | O-15, D-12, E-040           |
| skills/next/roles/adherence.md             | 10-11   | O-15                        |
| skills/next/roles/adherence.md             | 12-16   | glue, O-15                  |
| skills/next/roles/adherence.md             | 17-18   | O-15, E-051                 |
| skills/next/roles/sweep.md                 | 1-2     | glue                        |
| skills/next/roles/sweep.md                 | 3-5     | O-01                        |
| skills/next/roles/sweep.md                 | 6-7     | O-01                        |
| skills/next/roles/sweep.md                 | 8       | O-01                        |
| skills/next/roles/sweep.md                 | 9-10    | O-01                        |
| skills/next/roles/explore.md               | 1-2     | glue                        |
| skills/next/roles/explore.md               | 3       | E-061, O-03                 |
| skills/next/roles/explore.md               | 4-5     | E-061                       |
| skills/next/roles/explore.md               | 6-7     | E-051, E-061                |
| skills/next/references/config-reference.md | 1-2     | glue                        |
| skills/next/references/config-reference.md | 3       | O-07, E-064                 |
| skills/next/references/config-reference.md | 4-20    | glue, O-07                  |
| skills/next/references/config-reference.md | 21-24   | O-15, D-12                  |
| skills/next/references/config-reference.md | 25-28   | glue                        |
| skills/next/references/config-reference.md | 29      | O-07, E-073                 |
| skills/next/references/config-reference.md | 30      | O-07, E-081                 |
| skills/next/references/config-reference.md | 31      | D-01 (M27)                  |
| skills/next/references/config-reference.md | 32      | O-07, O-06, E-066           |
| skills/next/references/config-reference.md | 33-34   | E-064, E-065                |
| skills/next/references/config-reference.md | 35-36   | E-078, E-052                |
| skills/next/references/config-reference.md | 37      | E-078                       |
| skills/next/references/config-reference.md | 38      | E-070, E-040                |
| skills/next/references/config-reference.md | 39      | E-065                       |
| skills/next/references/config-reference.md | 40      | O-15, D-03, D-12            |
| skills/next/references/config-reference.md | 41      | D-07, O-09                  |
| skills/next/references/config-reference.md | 42      | D-01 (M24)                  |
| skills/next/references/config-reference.md | 43      | O-12, E-054                 |
| skills/retro/SKILL.md                      | 1-12    | glue                        |
| skills/retro/SKILL.md                      | 13      | O-14, D-11, O-02            |
| skills/retro/SKILL.md                      | 14-15   | O-09, O-02                  |
| skills/retro/SKILL.md                      | 16-17   | O-14, E-033                 |
| skills/retro/SKILL.md                      | 18-19   | O-14                        |
| skills/retro/SKILL.md                      | 20-21   | O-14, E-035                 |
| skills/retro/SKILL.md                      | 22      | O-14, E-043, E-045          |
| skills/retro/SKILL.md                      | 23      | O-14, D-03                  |
| skills/retro/SKILL.md                      | 24      | O-14, E-057                 |
| skills/retro/SKILL.md                      | 25      | O-14, E-031, E-032          |
| skills/retro/SKILL.md                      | 26-27   | O-14, E-056                 |
| skills/retro/SKILL.md                      | 28-29   | O-14, E-031                 |
| skills/retro/SKILL.md                      | 30-32   | glue, O-14                  |
