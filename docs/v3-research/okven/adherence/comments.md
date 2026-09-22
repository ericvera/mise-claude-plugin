# Adherence examples — comments and docs

Family `comments`, for the `adherence` role. Every finding cites an example id
from this file: `file:line — quoted text — <id>`. Notes are the owner's own
words from Delta Review, verbatim including typos; `R<row>` indexes
`docs/v3-research/runs/delta-notes.jsonl`. Sub-patterns and counts come from
`runs/escapes.md` §1.3 (35 in-category notes plus 21 in naming /
over-engineering / convention-violation about the same thing). The operative
rule set is `.claude/skills/doc-style/SKILL.md`; the numbers below name its
rules. Where the pre-fix prose did not survive the row says "shape
unrecoverable" — 61% of these notes are only snapshotted after the fix
(escapes.md §10).

Boundary with `vocabulary.md`: a coined **term** in an identifier, type, field
or file name is V-n. The same term inside comment or doc prose is D2-n here.

## D1 — punctuation register: colon, semicolon, em-dash, vertical slash in prose (n=4)

Shape unrecoverable. The only surviving snapshots of `getEventConfigs.ts` and `readDerivedEvents.ts` post-date the notes by 8–11 min, so they hold the rewritten prose. The register that survived the rewrite still shows what the complaint was about (`readDerivedEvents.ts:11-15` @ `1c1f80278`): `/** Drains one record hook and checks what it yielded against the config. A refused record comes back as a rejection, and a hook that throws takes the run down with it. */`
Fix: doc-style rule 6a — split into two sentences, or join with a comma, "so", or "because". A colon introducing a code block, a table or a list is fine, and code quoted inside a comment keeps its own punctuation (a `day|2026-08-01` id, a type union, a CSS selector). No rule existed at note time; doc-style:32 was committed 2026-09-10, a week after all three okven notes.

- D1-1 R69 — "The sentence reads as AI slop." then "do not use colon. Use a more natural human sentence"
- D1-2 R75 — "Go over all sentences with semicolon and rewrite them as a normal human would." then "do the same with em-dashed" then "I still see more like in readDerivedEvents. Be thorough."
- D1-3 R72 — "skip the em-dashes. Use better comment"
- D1-4 R3 — "Bring over from the Okven project the lines about avoiding ;, em dash, semicolon in prose/docs/comments."

## D2 — coined jargon the reader cannot decode (n=12, +8 adjacent — the largest)

Shape (`listPeriodKeys.ts:6-11`, escapes.md §1.3): a JSDoc saying the window "is half-open like every other range in the package".
Fix (same file @ `5b623628c`), the term replaced by what it means rather than explained:

> Lists every period key one granularity covers a window with, in order.
>
> The window includes `from` and stops before `to`, like every other range in the package, so a `to` sitting exactly on a period's first instant does not pull that period in.
> doc-style rule 4: define module jargon in 2–4 plain words on first use, or replace it. `half-open` still stands in 3 files at HEAD outside the attribution package.

- D2-1 R80 — "what does this 'round-trips' mean? Is there a more clear way to describe it in all tests and comments that use that phrase?"
- D2-2 R82 — "what dos half-open mean? Is there a better way to describe it that does not require explaining it?"
- D2-3 R144 — "How can I get you to never again use the word gloss in this context? Where do you get it from?" then "Fix the doc-style skill."
- D2-4 R103 — "what is "the settle line". Make it clear here and anywhere else it shows."
- D2-5 R188 — "what does "keep such a map out" mean here? I see the map with a"
- D2-6 R542 — "what tap?"

## D3 — the comment misdescribes the code, or went stale (n=5, +2)

Shape (`formatDurationSeconds.ts:1-4`): a JSDoc still naming a "90-second cap" the code no longer enforced. Also `it('skips dropped items message when no unresolved issues')` over a fixture with no dropped items, and a live reference to ISO weeks after the concept was removed.
Fix (`formatDurationSeconds.ts:1-4` at HEAD): `/** Voice note length for the staff conversation view, whole seconds only ("9s", "60s", "124s"). */` — the cap sentence is gone, not softened. doc-style rule 6b: describe what exists, never the change that produced it.

- D3-1 R488 — "the comment about 90-second cap seems like a leftover with no meaning."
- D3-2 R430 — "there are no dropped. This comment seems wrong."
- D3-3 R431 — "there are no dropped items here."
- D3-4 R202 — "Why are we making references to ISO weeks? We removed that concept a while back. Did we miss removing any code related to it or just a stray comment?"
- D3-5 R394 — "this comment seems to be out of place"

## D4 — verbose, or restates a nearby source (n=5, +2)

Shape: a `types.ts` field doc the owner called "very verbose" (`packages/attribution/src/types.ts:280`); a 60-word voice-note instruction line duplicating the main prompt (`constants.ts:77`).
Fix: one noun phrase per field, per doc-style rules 12–14 — the same file at HEAD reads `/** IANA zone. The package reads local days and months in it */` and `/** Where the events the host does not log come from */`. Caps: JSDoc ≤ 3 sentences, inline ≤ 2 lines.

- D4-1 R116 — "What does this mean?" then "that is very verbose. See the doc style skill before rewriting."
- D4-2 R510 — "Is `every food word the transcript says goes in o, and the restaurant it names goes in r.` redundant with what is already in the main prompt?"
- D4-3 R330 — "Look at the existing text and the density of content and the amount of examples. We want to keep this as short as possible while still doing what we need it to do. Re-think this thoroughly."
- D4-4 R31 — "Also ensure to keep MD entries concise and matching the density and language of the document they end-up at."
- D4-5 R392 — "should this comment be a single line like the ones above?"

## D5 — the why is missing (n=4, +1)

Shape: `unresolvedClarifications: undefined` passed into `updateOrder` with no comment saying why dropping them is safe (`handleOrderMenuChange.ts:48`); a workaround in `nuxt.config.ts:50` with no link to the GitHub issue behind it.
Fix (`handleOrderMenuChange.ts:48-50` at HEAD): `// A caller with an answerable question replies with it instead of coming` / `// here, so a question still stored is one the republished menu cannot ask.` Checklist rule: a line that clears, discards or overwrites stored state carries a comment saying why nothing is lost.

- D5-1 R527 — "We need a comment here explaining why we drop the unresolvedClarifications."
- D5-2 R538 — "Add a note here about why it is ok to clear unresolved."
- D5-3 R46 — "Is there a github bug or any reference to why this happens?" then "Add links to the GH issues in the comment"
- D5-4 R113 — "This is missing proper documentation for consistency."

## D6 — the doc is written as a history log, not the final state (n=1, +1)

Shape: `docs/design/attribution.md` titled as the v2 design; `docs/notes/attribution-v2-rationale.md` kept in the repo.
Fix (at HEAD): the doc opens `# Attribution` / "The design for attribution and the staff **Dashboard**." and the rationale note is gone from `docs/notes/`.

- D6-1 R112 — "There should be no v2 here. "v1" was never released and was just an iteration to get here. All docs should read as the final state rather than a log of history. Particularly if there is nothing left of the old design."
- D6-2 R111 — "notes must not be kept in the repo they are artifacts while building only."

## D7 — operator-facing copy that broadcasts the wrong thing (n=2)

Shape: `logger.error('… order left for the next run')` and a log line ending `'skipping'` (`handleCloseOutStaleOrders.test.ts:711,893`).
Fix: name the state and ask for a human — the owner's words were "'capture failed' is enough here" plus "needs investigation". Note the scope: at HEAD no `logger.error` carries either phrase, but 12 `logger.info` calls in 9 files still do, so the check is "any logger level", not `error` alone.

- D7-1 R307 — "the 'order left for the next run' makes it feel like this will be addressed on its own. We should not broadcast it this way. This must be investigated. 'capture failed' is enough here"
- D7-2 R308 — "remove the 'skipping' use a more direct 'order needs investigation' or something like that"

## D8 — residual: package-boundary copy, design-doc facts, enum JSDoc (n=2, +5)

Shape: the string `Okven` inside `packages/attribution/**` comments, test titles and copy — the package is host-agnostic and `eslint.config.mjs` already blocks its _imports_ (`local:attribution-isolation`) but not its prose. Also enum members with no doc comment (doc-style rule 14).
Fix: strip the host's name from the package's prose; give every enum member the diff adds or sits beside one telegraphic line.

- D8-1 R140 — "There should be no mentions of Okven in any of the attributino packages copy or comments. Go through all the files."
- D8-2 R289 — "Do we have any rules/conventions about naming enums/JSDoc for them? If so, apply throughout this file."
- D8-3 R359 — "This name is odd. Is there a better name? Also, the JSDoc above seem to not match our doc guidelines"
- D8-4 R294 — "what do you mean system/automated callers? That shoudl not happen right?"
- D8-5 R272 — "Isn't resolution only deterministic for the hub button?"
