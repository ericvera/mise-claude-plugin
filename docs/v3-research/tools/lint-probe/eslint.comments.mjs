// Probe config for the comment/doc defects D1, D4 and D7 of runs/escapes.md.
// Section 1.3 wrote these three as candidate rules and section 10 records that
// they were never run, because D1 and D4 are not expressible as
// `no-restricted-syntax` selectors (comments are not selectable AST nodes) and
// need a local rule over `sourceCode.getAllComments()`. This file is that rule,
// written against okven's doc-style skill as the source of the thresholds:
//   D1  <- doc-style/SKILL.md:32 rule 6a (no colon, semicolon, em-dash or
//          vertical slash inside comment or doc prose; a colon introducing a
//          code block, table or list is fine; code quoted in the comment keeps
//          its own punctuation)
//   D4  <- doc-style/SKILL.md rule 12 (JSDoc <= 3 sentences, inline <= 2 lines)
//   D7  <- the selector written in runs/escapes.md section 1.3
//
// Read-only. It never writes to the okven repo and is kept outside it.
//
// Run from the okven repo root:
//   npx eslint --no-config-lookup -c <abs path to this file> --no-ignore \
//     --no-cache -f json 'functions/src/**/*.ts' 'hosting/**/*.ts' \
//     'packages/*/src/**/*.ts' 'scripts/**/*.ts'
import tsparser from "/Users/eric/Code/okven/node_modules/@typescript-eslint/parser/dist/index.js"

// Strip the parts of a comment that rule 6a exempts: quoted code, URLs and the
// leading `*` of a JSDoc line.
const prose = (text) =>
  text
    .split("\n")
    .map((l) => l.replace(/^\s*\*/, ""))
    .join("\n")
    .replace(/`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+/g, " ")

const sentences = (text) =>
  prose(text)
    .split(/(?<=[.!?])\s+/)
    .filter((s) => /[A-Za-z]/.test(s)).length

const commentPunctuation = {
  meta: {
    type: "problem",
    schema: [],
    messages: { punct: "D1 {{marks}} in comment prose" },
  },
  create(context) {
    const sc = context.sourceCode
    return {
      Program() {
        for (const c of sc.getAllComments()) {
          const marks = new Set()
          const lines = prose(c.value).split("\n")
          for (const [i, raw] of lines.entries()) {
            // Rule 6a allows a colon that introduces a code block, a table or
            // a list. Two shapes carry that here: a colon at end of line, and
            // a leading label on the comment's first line, which is how
            // doc-style rule 15's `// Verify:` lists are written. Clock times
            // are not prose punctuation either.
            const line = (
              i === 0 ? raw.replace(/^\s*[A-Z][A-Za-z ]{0,20}:/, "") : raw
            ).replace(/\d:\d/g, "")
            if (/:(?!\s*$)/.test(line)) {
              marks.add(":")
            }
            if (line.includes(";")) {
              marks.add(";")
            }
            if (line.includes("—")) {
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
      jsdoc: "D4 JSDoc runs {{n}} sentences, cap is 3",
      inline: "D4 inline comment runs {{n}} lines, cap is 2",
    },
  },
  create(context) {
    const sc = context.sourceCode
    return {
      Program() {
        const all = sc.getAllComments()
        // Consecutive `//` lines read as one comment, so they are grouped
        // before the 2-line cap is applied.
        let run = []
        const flushRun = () => {
          if (run.length > 2) {
            context.report({
              loc: { start: run[0].loc.start, end: run.at(-1).loc.end },
              messageId: "inline",
              data: { n: run.length },
            })
          }
          run = []
        }
        for (const c of all) {
          if (c.type === "Line") {
            if (
              run.length > 0 &&
              c.loc.start.line !== run.at(-1).loc.end.line + 1
            ) {
              flushRun()
            }
            run.push(c)
            continue
          }
          flushRun()
          if (c.value.startsWith("*")) {
            const n = sentences(c.value)
            if (n > 3) {
              context.report({
                loc: c.loc,
                messageId: "jsdoc",
                data: { n },
              })
            }
          } else {
            const lines = c.loc.end.line - c.loc.start.line + 1
            if (lines > 2) {
              context.report({
                loc: c.loc,
                messageId: "inline",
                data: { n: lines },
              })
            }
          }
        }
        flushRun()
      },
    }
  },
}

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { sourceType: "module" },
    },
    plugins: {
      local: {
        rules: {
          "comment-punctuation": commentPunctuation,
          "comment-length": commentLength,
        },
      },
    },
    rules: {
      "local/comment-punctuation": "error",
      "local/comment-length": "error",
      // D7 — operator-facing copy that broadcasts the wrong thing. Verbatim
      // from runs/escapes.md section 1.3.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='logger'][callee.property.name='error'] Literal[value=/skipping|left for the next run/i]",
          message: "D7 logger.error copy says the run will recover on its own",
        },
        // D7-wide — the same phrases on any logger level. R307 and R308 were
        // written against logger.error, but every surviving instance at HEAD
        // is logger.info, so the narrow selector reports nothing.
        {
          selector:
            "CallExpression[callee.object.name='logger'][callee.property.name=/^(info|warn|debug|log)$/] Literal[value=/skipping|left for the next run/i]",
          message: "D7-wide logger copy says the run will recover on its own",
        },
      ],
    },
  },
]
