# Adherence examples — vocabulary

Family `vocabulary`, for the `adherence` role. Every finding cites an example id
from this file: `file:line — quoted text — <id>`. Notes are the owner's own
words from Delta Review, verbatim including typos; `R<row>` indexes
`docs/v3-research/runs/delta-notes.jsonl`. Drawn from the 50 `naming` notes plus
the identifier half of escapes.md §1.3 D2. Covering rules: CLAUDE.md:101
("Reuse existing vocabulary"), CLAUDE.md:102 (function verbs), checklist rule 14
("One name per concept").

Boundary with `comments.md`: a coined term in an identifier, type, field or file
name is V-n here. The same term inside comment or doc prose is D2-n there.

## Glossary

`docs/design/naming.md`, 149 lines, cited by CLAUDE.md:102 and by
`.claude/skills/doc-style/SKILL.md:26`. It holds: a layers table (manipulation /
`send*` / `handle*`, and which of them may write or send); an accepted-vocabulary
table of 44 verb rows, each with its object slot, contract and an example export;
formulas for `update`, `convert` and `select`; the error convention (expected
outcomes are values, throws are for broken invariants); a "Do not coin" table of
rejected synonyms (`commit`/`settle`/`persist` → `update<Entity><Aspect>`,
`derive`/`compute`/`generate` → `build`, `filter`/`pick`/`keep` → `select`, and
five more rows); and the context-suffix table (`FromTerminal`, `AsCustomer`, …).

**Gap the owner should know before pruning:** naming.md governs _exported
function verbs only_. It holds no domain nouns. Most notes below are nouns —
ledger, level, row, owner, breakout, tap, drift, issue — which the glossary
cannot answer today, so the "existing code" half of the rule carries them.

## Rule for a new term

A term the diff introduces is **new** when both hold: it is not a verb row in
`docs/design/naming.md`, and `git grep -i '<term>' origin/main` over source paths
returns nothing outside the files this branch added. Every new term in anything
the diff adds — identifier, type, field, file name, test title, comment, doc —
is **flagged, never silently fixed**: `file:line — quoted text — V-n`. Two ways
to close a finding: reuse what the code already calls the concept, naming the
grep and the count of instances renamed (checklist rule 14); or, for a verb, add
its row to the naming.md table in the same change (naming.md:9). A noun has no
table, so the finding goes to the owner with options.

## V — a second name for a concept the code already has (n=5)

Shape: `menuChanged` and `menuDrift` both live in the diff for one concept.
Fix (at HEAD): `menuDrift` in 30 files, `menuChanged` down to 3 (the
`formatMenuChangedNote` family). One name wins and the loser is renamed branch-wide.

- V-1 R530 — "Should menuChanged be renamed to menuDrift for consistency or menuDrift to menuChanged? We should keep consistent vocabulary."
- V-2 R531 — "'re-pinned' is weird. Do we have another name for this? We must keep vocabulary consistent. No creative synonims or renaming of things."
- V-3 R378 — "are unclear and unresolved to separate terms or do they talk about the same thing?"
- V-4 R55 — "What is a "Report Note"? Do we have an existing or better concept name that is less ambiguous or more descriptive? Also are we using Kind interchangably with Type? In that case we should consolidate in a single name for a concept (settle on Type)"
- V-5 R30 — "Do we have another name in the project for the concept we refer to as 'range' here?"

## V — a coined noun the reader cannot decode (n=6)

Shape: `updateSpendSums.test.ts:32,49` naming a "ledger"; `addOwnerToLevel.ts` naming a "level" and a "row"; `types.ts:259` naming a "breakout".
Fix (at HEAD): `ledger` is gone from `packages/attribution` (0 files), `breakout` is gone (the owner's answer was "groupBy"), `addOwnerToLevel` is gone. `rowBucket`/`getRowBucket` survive in 8 files, so "row" was kept deliberately — check before flagging it again.

- V-6 R207 — "What is this ledger concept? Can we rename this? Do we need it?"
- V-7 R162 — "What is a 'level'? Do we have multiple names for it? Also, what it a row? Also have multiple names for it? Any other similar names? Any overlap between terms like that?"
- V-8 R183 — "what does 'owners' stand for here?"
- V-9 R63 — "what is a breakout and is there a better term? Let's discuss first. Don't make any changes unless I approve them."
- V-10 R166 — "what is this "hooks" concept? It seems like a new concept."
- V-11 R542 — "what tap?"

## V — the coined term has already spread, so the fix is a sweep (n=5)

Shape unrecoverable as a single site — the defect is the count. R207 flagged "ledger" once; R211, R212 and R220 are the owner finding it again in the same run, in a test, a test at another line, and a design doc.
Fix: list every instance first and show the count, then rename. When a rename moves files, run `/delta:cluster` so the review shows text changes rather than new files (the owner asks for this in V-14 and in `.mise/_friction.md`, eric/attribution-3).

- V-12 R211 — "This also makes reference to ledger"
- V-13 R212 — "more ledger references"
- V-14 R193 — "I thought we got read of the 'owner' concept. Should we also rename files and methods? Is so, ensure that you run the cluster skill and those are appropriately mapped in delta review to avoid unnecessary re-reviews."
- V-15 R397 — "WE should do a pass on all variables called filter* and see if there are better names for them too. Also look at adjacent comments."
- V-16 R220 — "more ledger references"

## V — an ambiguous or misleading name (n=6)

Shape: `useShortLinkPage.ts` / `ShortLink*` for something only menus use.
Fix (at HEAD): `ShortLink` is gone, `MenuLink` stands in 3 files — the name says which thing it links.

- V-17 R229 — "ShortLink is misleading... any better names? this is specific to menu it seem."
- V-18 R324 — "It seems like this is a misnomer as it is also used by menu editor? Perhaps just getMenuVisibility? Also, possibly should be positioned in core/src/menu-availability?"
- V-19 R390 — "State in updateOrderState feels ambiguous. Is there a better word/phrase we can use? Let's discuss before fixing."
- V-20 R41 — "We use Time for hours:minutes. Do we have another name that would be less ambiguous?"
- V-21 R246 — "'cerrados' reads odd. It sounds like the business is closed and I think this means that the month is closed out. Is there a better name/word/term for this? Let's discuss before making changes."
- V-22 R473 — "The method name seems to be a misnommer. Fix it. Run the /delta:cluster skill when done with the move to flag it appropriately."

## V — a verb outside the naming.md table, or the wrong layer (n=5)

Shape: a composable helper named `toMessage` that both performs the send and returns text, against naming.md's `to` row ("Small pure mapper, one shape in, one out"); a router helper not named `handle*` although it terminates the dispatch.
Fix: take the verb from the naming.md table, or add the row in the same change (naming.md:9). The layers table decides: only `handle*` both writes and sends.

- V-23 R461 — "should this be a handle* method?"
- V-24 R224 — "toMessage seems to both execute and resturn a text result. The name is perhaps not the best."
- V-25 R399 — "Is there a better naming convention for these methods that process something through an LLM? Let's discuss before making any changes."
- V-26 R109 — "what is the difference between emit and track?"
- V-27 R58 — "Do we have any rules for the use of the word `Derived` or similar?"

## V — enum and constant value wording (n=4)

Shape: an attribution event enum whose member names the owner read as ambiguous (`packages/constants/src/attribution.ts:5-12`).
Fix (at HEAD): `ConversationStarted = 'conversation-started'` at line 8 and `LocationSelected = 'location-selected'` at line 13 — both the owner's own wording from the note threads, member name and string value agreeing.

- V-28 R49 — "This is a bit ambiguous. Is there a better name? Let's discuss before making any changes." then "Go with `conversation-started`"
- V-29 R50 — "Is LocationSelected a better name? Perhaps simpler and more consistent?"
- V-30 R33 — "Is this is only QR scans, any reason to not use QRScan = 'qr-scan'? (less ambiguous in the future)"
- V-31 R68 — "This is confusing. What is this about?" then "i think the "bynextmonth" part is unnatural" then "Sure... go for Returned and ensure that the description is good"
