# Proposed ESLint additions for okven

Target: okven's existing flat config (`eslint.config.mjs`, 208 lines), ESLint
10.7.0, vitest 4.1.10, no vitest ESLint plugin installed, `eslint-plugin-jsdoc`
63.0.12 present transitively through `@nuxt/eslint-config`. Nothing new is
installed. Every rule ships as `warn` and is held flat by a ratchet.

## Measured, not estimated

All counts below were produced on 2026-09-22 against okven at HEAD by running
the exact config block in this file, read-only, with `--no-cache`:

```
npx eslint --no-config-lookup -c <config> --no-ignore --no-cache -f json \
  'functions/src/**/*.ts' 'hosting/**/*.ts' 'packages/*/src/**/*.ts' 'scripts/**/*.ts'
```

2,084 `.ts` files, 756 of them `*.test.ts`. **5,177 warnings over 897 files**,
every one at severity 1.

| rule / messageId                             | selector or check                                                                                  | hits  | files |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----- | ----- |
| `mise/comment-punctuation/punct`             | D1 colon, semicolon, em-dash or vertical slash in comment prose                                    | 1,716 | 592   |
| `mise/test-assertions/T1b-mockCallsIndex`    | `MemberExpression[computed=true][object.property.name='calls']`                                    | 974   | 165   |
| `mise/test-assertions/T1a-index`             | `expect() > MemberExpression[computed=true]`                                                       | 903   | 161   |
| `mise/comment-length/inline`                 | D4 inline comment over 2 lines                                                                     | 675   | 310   |
| `mise/test-assertions/T1a-field`             | `expect() > MemberExpression[computed=false][property.name!='value']`                              | 542   | 125   |
| `mise/comment-length/jsdoc`                  | D4 JSDoc over 3 sentences                                                                          | 125   | 111   |
| `mise/test-assertions/T1c-undefinedSnapshot` | `toMatchInlineSnapshot` of `` `undefined` ``                                                       | 119   | 58    |
| `mise/test-assertions/T7-internalMock`       | `vi.mock('./…' \| '~/…' \| '@/…')`                                                                 | 38    | 22    |
| `mise/test-assertions/T7-inlineFactory`      | `vi.mock(…)` with a factory argument                                                               | 32    | 17    |
| `mise/test-assertions/T1a-call`              | `expect() > CallExpression[callee.property.name=/^(at\|map\|filter\|slice\|find\|join\|concat)$/]` | 22    | 15    |
| `mise/test-assertions/T1b-literal`           | `expect() > :matches(ObjectExpression, ArrayExpression)`                                           | 19    | 5     |
| `mise/logger-copy/recovers`                  | D7 log copy saying the run recovers on its own                                                     | 12    | 9     |
| `mise/test-assertions/T1c-bareThrow`         | `CallExpression[callee.property.name=/^toThrowError?$/]`                                           | **0** | 0     |
| `mise/test-assertions/T1d-fileSnapshot`      | `CallExpression[callee.property.name=/^toMatch(File)?Snapshot$/]`                                  | **0** | 0     |

D1 by mark: em-dash 651 comments in 323 files, `;` 610 in 285, `:` 594 in 326,
`|` 17 in 12. D7 was written in `runs/escapes.md` scoped to `logger.error`; at
that scope it finds **0**. Every surviving instance is `logger.info`, so the
rule shipped here matches any logger level and finds 12.

The two zero rules are the point of the exercise: the defect class the owner
names ("tests not using inline snapshots") is invisible at HEAD because he
catches every one before it lands.

### Read the counts honestly before turning anything up to `error`

- **`T1b-mockCallsIndex` (974) flags the accepted fix.** `classifyContent.test.ts:61` at HEAD is `expect(mockGenerate.mock.calls[0]).toMatchInlineSnapshot(...)`, which is what the owner asked for in R506, and the selector flags it. CLAUDE.md:139 says snapshot `mock.calls` whole; practice snapshots one call whole. Either the rule narrows to `calls[n][m]` (two levels of indexing) or CLAUDE.md:139 changes. Until then this is the loudest and least trustworthy line in the table.
- **`T1a-field` (542) contains legitimate reads.** `expect(wrapper.vm.x)` and similar sit inside it. `.value` is already excluded per CLAUDE.md:139.
- **`comment-length/inline` (675): 271 are `// Verify:` comments that wrapped to 3+ lines.** doc-style rule 15 sanctions `// Verify:` lists and rule 12 caps inline comments at 2 lines. The two rules disagree in this codebase and the owner should settle it before this count means anything.
- **`comment-punctuation` measured over `.ts` only.** okven's real config also lints `.vue`; add `'**/*.vue'` to `files` once the `.ts` baseline is recorded, and re-record.
- Hit count is not defect count anywhere in this table.

### Not proposed

`vitest/expect-expect` (T10) and `vitest/no-identical-title` (T2) would need a
new dependency; no vitest ESLint plugin is installed. `jsdoc/informative-docs`
and `jsdoc/match-description` are available without a new install but round 1
measured them at 1 hit / 184 files and 19 hits / 187 files, mostly legitimate
prose, so they are left out.

## Why a local plugin and not more `no-restricted-syntax`

Flat config **replaces** a rule's options rather than merging them, and one rule
carries one severity. okven's `local:rules` block already owns
`no-restricted-syntax` at `error` for the ID-alias casts (`eslint.config.mjs:111`),
and `local:terminal-handlers` (`:135`) already silently drops those two selectors
for `functions/src/utils/whatsapp-webhook/**`. Adding a third block at `warn`
would drop them again across every test file. A rule's `create()` may key its
visitor by an esquery selector — that is exactly how core `no-restricted-syntax`
is implemented (`node_modules/eslint/lib/rules/no-restricted-syntax.js`) — so the
selectors move into a local rule unchanged and nothing existing is disturbed.

## File 1 — `eslint.mise-rules.mjs` (new, repo root)

```js
// Local ESLint rules for the defects the owner keeps catching in Delta Review.
// Ids match the sub-patterns in .claude/adherence/{tests,comments}.md.

const testSelectors = {
  "CallExpression[callee.name='expect'] > MemberExpression[computed=true]":
    "T1a-index",
  "CallExpression[callee.name='expect'] > MemberExpression[computed=false][property.name!='value']":
    "T1a-field",
  "CallExpression[callee.name='expect'] > CallExpression[callee.property.name=/^(at|map|filter|slice|find|join|concat)$/]":
    "T1a-call",
  "CallExpression[callee.name='expect'] > :matches(ObjectExpression, ArrayExpression)":
    "T1b-literal",
  "MemberExpression[computed=true][object.property.name='calls']":
    "T1b-mockCallsIndex",
  "CallExpression[callee.property.name=/^toThrowError?$/]": "T1c-bareThrow",
  "CallExpression[callee.property.name='toMatchInlineSnapshot'] > TemplateLiteral[quasis.0.value.raw='undefined']":
    "T1c-undefinedSnapshot",
  "CallExpression[callee.property.name=/^toMatch(File)?Snapshot$/]":
    "T1d-fileSnapshot",
  "CallExpression[callee.object.name='vi'][callee.property.name='mock'][arguments.length>1]":
    "T7-inlineFactory",
  "CallExpression[callee.object.name='vi'][callee.property.name='mock'] > Literal[value=/^(\\.|~\\/|@\\/)/]":
    "T7-internalMock",
}

const messages = {
  "T1a-index": "T1a index inside expect() — snapshot the whole value",
  "T1a-field": "T1a field read inside expect() — snapshot the whole value",
  "T1a-call": "T1a array method inside expect() — snapshot the whole value",
  "T1b-literal": "T1b value assembled inside expect()",
  "T1b-mockCallsIndex": "T1b mock.calls index — snapshot mock.calls whole",
  "T1c-bareThrow":
    "T1c toThrow hides the message — use toThrowErrorMatchingInlineSnapshot",
  "T1c-undefinedSnapshot":
    "T1c snapshotting `undefined` asserts nothing — use .not.toThrow()",
  "T1d-fileSnapshot": "T1d file snapshot — inline snapshots only",
  "T7-inlineFactory": "T7 inline module mock factory — move it to __mocks__",
  "T7-internalMock": "T7 mocking internal code",
}

const testAssertions = {
  meta: { type: "problem", schema: [], messages },
  create(context) {
    return Object.fromEntries(
      Object.entries(testSelectors).map(([selector, messageId]) => [
        selector,
        (node) => context.report({ node, messageId }),
      ]),
    )
  },
}

// Strip what doc-style rule 6a exempts: quoted code, URLs, JSDoc line stars.
const prose = (text) =>
  text
    .split("\n")
    .map((l) => l.replace(/^\s*\*/, ""))
    .join("\n")
    .replace(/`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+/g, " ")

const commentPunctuation = {
  meta: {
    type: "problem",
    schema: [],
    messages: { punct: "D1 {{marks}} in comment prose (doc-style 6a)" },
  },
  create(context) {
    return {
      Program() {
        for (const c of context.sourceCode.getAllComments()) {
          const marks = new Set()
          for (const [i, raw] of prose(c.value).split("\n").entries()) {
            // Rule 6a allows a colon that introduces a code block, a table or
            // a list. Two shapes carry that: a colon at end of line, and a
            // leading label on the first line, which is how rule 15's
            // `// Verify:` lists are written. Clock times are not prose.
            const line = (
              i === 0 ? raw.replace(/^\s*[A-Z][A-Za-z ]{0,20}:/, "") : raw
            ).replace(/\d:\d/g, "")
            if (/:(?!\s*$)/.test(line)) {
              marks.add(":")
            }
            if (line.includes(";")) {
              marks.add(";")
            }
            if (line.includes("\u2014")) {
              marks.add("em-dash")
            }
            if (line.includes("|")) {
              marks.add("|")
            }
          }
          if (marks.size > 0) {
            context.report({
              loc: c.loc,
              messageId: "punct",
              data: { marks: [...marks].join(" ") },
            })
          }
        }
      },
    }
  },
}

const commentLength = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      jsdoc: "D4 JSDoc runs {{n}} sentences, cap is 3 (doc-style 12)",
      inline: "D4 inline comment runs {{n}} lines, cap is 2 (doc-style 12)",
    },
  },
  create(context) {
    return {
      Program() {
        // Consecutive `//` lines read as one comment, so they are grouped
        // before the 2-line cap is applied.
        let run = []
        const flush = () => {
          if (run.length > 2) {
            context.report({
              loc: { start: run[0].loc.start, end: run.at(-1).loc.end },
              messageId: "inline",
              data: { n: run.length },
            })
          }
          run = []
        }
        for (const c of context.sourceCode.getAllComments()) {
          if (c.type === "Line") {
            if (
              run.length > 0 &&
              c.loc.start.line !== run.at(-1).loc.end.line + 1
            ) {
              flush()
            }
            run.push(c)
            continue
          }
          flush()
          if (c.value.startsWith("*")) {
            const n = prose(c.value)
              .split(/(?<=[.!?])\s+/)
              .filter((s) => /[A-Za-z]/.test(s)).length
            if (n > 3) {
              context.report({ loc: c.loc, messageId: "jsdoc", data: { n } })
            }
          } else {
            const n = c.loc.end.line - c.loc.start.line + 1
            if (n > 2) {
              context.report({ loc: c.loc, messageId: "inline", data: { n } })
            }
          }
        }
        flush()
      },
    }
  },
}

const loggerCopy = {
  meta: {
    type: "problem",
    schema: [],
    messages: { recovers: "D7 log copy says the run will recover on its own" },
  },
  create(context) {
    return {
      "CallExpression[callee.object.name='logger'][callee.property.name=/^(error|warn|info|debug|log)$/] Literal[value=/skipping|left for the next run/i]":
        (node) => context.report({ node, messageId: "recovers" }),
    }
  },
}

export const misePlugin = {
  meta: { name: "mise-adherence", version: "0.1.0" },
  rules: {
    "test-assertions": testAssertions,
    "comment-punctuation": commentPunctuation,
    "comment-length": commentLength,
    "logger-copy": loggerCopy,
  },
}
```

## File 2 — the block to paste into `eslint.config.mjs`

Add the import beside the others at the top, then paste these two config objects
as the last arguments to `defineFlatConfigs(...)`, after `local:test-rules`:

```js
import { misePlugin } from "./eslint.mise-rules.mjs"
```

```js
  // Recurring Delta Review defects, held flat by scripts/lint-ratchet.ts.
  // Warnings on purpose: the counts are large and a codemod has to come first.
  {
    name: 'mise:comments',
    files: ['**/*.ts'],
    plugins: { mise: misePlugin },
    rules: {
      'mise/comment-punctuation': 'warn',
      'mise/comment-length': 'warn',
      'mise/logger-copy': 'warn',
    },
  },
  {
    name: 'mise:tests',
    files: ['**/*.test.ts'],
    plugins: { mise: misePlugin },
    rules: {
      'mise/test-assertions': 'warn',
    },
  },
```

## File 3 — `scripts/lint-ratchet.ts` (new)

One ESLint pass that both reports and ratchets, so `yarn lint` does not run
twice. Errors still fail as before; a `mise/*` warning count that rises fails
too. `node scripts/*.ts` is how okven already runs its scripts.

```ts
// One ESLint pass that both reports and ratchets. Errors fail the build as
// before. The `mise/*` rules ship as warnings, so they never block a commit,
// but their count per rule may not rise above the recorded baseline.
//
//   node scripts/lint-ratchet.ts            check (what `yarn lint` runs)
//   node scripts/lint-ratchet.ts --record   rewrite the baseline
import { ESLint } from "eslint"
import { readFileSync, writeFileSync } from "node:fs"

const BASELINE = ".lint-ratchet.json"
const record = process.argv.includes("--record")

const eslint = new ESLint({ cache: false })
const results = await eslint.lintFiles(["."])

const counts: Record<string, number> = {}
let errors = 0
for (const result of results) {
  for (const message of result.messages) {
    if (message.severity === 2) {
      errors += 1
      continue
    }
    if (!message.ruleId?.startsWith("mise/")) {
      continue
    }
    const key = `${message.ruleId}/${message.messageId}`
    counts[key] = (counts[key] ?? 0) + 1
  }
}

const formatter = await eslint.loadFormatter("stylish")
const output = await formatter.format(results)
if (output) {
  console.log(output)
}

if (record) {
  writeFileSync(BASELINE, `${JSON.stringify(counts, null, 2)}\n`)
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  console.log(
    `Recorded ${total} warnings over ${Object.keys(counts).length} rules.`,
  )
  process.exit(errors > 0 ? 1 : 0)
}

const baseline: Record<string, number> = JSON.parse(
  readFileSync(BASELINE, "utf8"),
)
const risen = Object.keys(counts)
  .filter((key) => counts[key] > (baseline[key] ?? 0))
  .map((key) => `  ${key}: ${baseline[key] ?? 0} -> ${counts[key]}`)
const fallen = Object.keys(baseline)
  .filter((key) => (counts[key] ?? 0) < baseline[key])
  .map((key) => `  ${key}: ${baseline[key]} -> ${counts[key] ?? 0}`)

if (fallen.length > 0) {
  console.log(`Ratchet dropped, re-record with --record:\n${fallen.join("\n")}`)
}
if (risen.length > 0) {
  console.error(`Ratchet rose:\n${risen.join("\n")}`)
}
process.exit(errors > 0 || risen.length > 0 ? 1 : 0)
```

## File 4 — `package.json`

Replace the `ci:lint` line. `lint` already delegates to it, so `yarn lint`
picks the ratchet up unchanged.

```json
"ci:lint": "node scripts/lint-ratchet.ts && stylelint '**/*.vue'",
```

Then, once, at the repo root:

```
node scripts/lint-ratchet.ts --record && git add .lint-ratchet.json
```

## Verification done here

- Every rule in the config block was **run** against okven at HEAD with `--no-cache` and produced the counts in the table. No count is estimated.
- `no-restricted-syntax`'s object form `{ selector, message }` was read from `node_modules/eslint/lib/rules/no-restricted-syntax.js`; its `create()` returning selector-keyed visitors is the mechanism the local rules reuse. No third-party rule name is invented — the four `mise/*` rules are defined in full above.
- `ESLint` class options `cache` and `overrideConfigFile`, and `lintFiles` / `loadFormatter('stylish')`, were confirmed against `node_modules/eslint/lib/api.js` at 10.7.0. `--no-cache` is the negation of the Boolean `cache` option (default `false`) in `lib/options.js`. `stylish` and `json` are built-in formatters in `lib/cli-engine/formatters/`.
- The ratchet script was executed against okven (record, pass, and a forced rise) using the proposed rules over `packages/attribution/src`: `--record` wrote the baseline, a clean check exited 0, and a lowered baseline exited 1 with `Ratchet rose: mise/comment-length/inline: 30 -> 36`. It was **not** run over a full `yarn lint` pass, which also carries okven's type-aware rules.
- Nothing was written into `/Users/eric/Code/okven`. Every run used `--no-config-lookup` with a config kept in this repo and `--no-cache`.
