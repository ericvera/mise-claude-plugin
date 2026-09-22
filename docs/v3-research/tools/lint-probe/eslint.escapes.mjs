// Probe config for runs/escapes.md section 1: measures how many existing Okven
// test files each candidate rule for the recurring test defects would flag.
// Read-only — it never writes to the Okven repo and is kept outside it.
// Extends tools/lint-probe/eslint.probe.mjs (round 1, which measured the
// drilling selectors at 1081 + 34 + 26 hits over 756 test files).
//
// Run from the Okven repo root:
//   npx eslint --no-config-lookup -c <abs path to this file> --no-ignore -f json \
//     'functions/src/**/*.test.ts' 'hosting/**/*.test.ts' 'packages/*/src/**/*.test.ts'
//
// Message prefixes match the sub-pattern ids in runs/escapes.md.
import tsparser from "/Users/eric/Code/okven/node_modules/@typescript-eslint/parser/dist/index.js"

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { sourceType: "module" },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        // T1a — a field read on the value under test. `.value` is excluded:
        // CLAUDE.md:139 says reading a Vue ref's .value is the value itself.
        {
          selector:
            "CallExpression[callee.name='expect'] > MemberExpression[computed=false][property.name!='value']",
          message: "T1a field read inside expect()",
        },
        {
          selector:
            "CallExpression[callee.name='expect'] > MemberExpression[computed=true]",
          message: "T1a index inside expect()",
        },
        {
          selector:
            "CallExpression[callee.name='expect'] > CallExpression[callee.property.name=/^(at|map|filter|slice|find|join|concat)$/]",
          message: "T1a array method inside expect()",
        },
        // T1b — a value assembled in the test and then snapshotted.
        {
          selector:
            "CallExpression[callee.name='expect'] > :matches(ObjectExpression, ArrayExpression)",
          message: "T1b literal assembled inside expect()",
        },
        {
          selector:
            "MemberExpression[computed=true][object.property.name='calls']",
          message: "T1b index into mock.calls (snapshot mock.calls whole)",
        },
        // T1c — a matcher family that hides the value.
        {
          selector: "CallExpression[callee.property.name=/^toThrowError?$/]",
          message:
            "T1c toThrow hides the message — use toThrowErrorMatchingInlineSnapshot",
        },
        {
          selector:
            "CallExpression[callee.property.name='toMatchInlineSnapshot'] > TemplateLiteral[quasis.0.value.raw='undefined']",
          message:
            "T1c snapshotting `undefined` asserts nothing — use .not.toThrow()",
        },
        // T1d — a file-based snapshot.
        {
          selector:
            "CallExpression[callee.property.name=/^toMatch(File)?Snapshot$/]",
          message: "T1d file snapshot — inline snapshots only",
        },
        // T7 — module mocks that belong in __mocks__, and mocks of our own code.
        {
          selector:
            "CallExpression[callee.object.name='vi'][callee.property.name='mock'][arguments.length>1]",
          message: "T7 inline module mock factory — move it to __mocks__",
        },
        {
          selector:
            "CallExpression[callee.object.name='vi'][callee.property.name='mock'] > Literal[value=/^(\\.|~\\/|@\\/)/]",
          message: "T7 mocking internal code (relative, ~/ or @/ specifier)",
        },
      ],
    },
  },
]
