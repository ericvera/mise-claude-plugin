// Probe config used for section D of runs/okven-offenses.md. Measures how many
// existing Okven files each candidate rule would fail. Read-only: it never
// writes to the Okven repo and is deliberately kept outside it.
//
// Run from the Okven repo root:
//   npx eslint --no-config-lookup -c <abs path to this file> --no-ignore -f json \
//     'functions/src/**/*.test.ts' 'hosting/**/*.test.ts' 'packages/*/src/**/*.test.ts'
//
// Plugin specifiers are absolute because ESLint resolves a config's imports
// relative to the config file, and this file lives in a different repo. Both
// plugins are already installed in Okven (eslint-plugin-jsdoc arrives as a
// transitive dependency of @nuxt/eslint-config), so nothing new is added.
import jsdocCjs from "/Users/eric/Code/okven/node_modules/eslint-plugin-jsdoc/dist/index.cjs"
import tsparser from "/Users/eric/Code/okven/node_modules/@typescript-eslint/parser/dist/index.js"

const jsdoc = jsdocCjs.default ?? jsdocCjs

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { sourceType: "module" },
    },
    plugins: { jsdoc },
    rules: {
      // D6 — "comment restates the code". 1 hit / 184 files: the rule only
      // compares the description to the symbol name, and Okven's restatements
      // paraphrase the type annotation instead.
      "jsdoc/informative-docs": "error",

      // D7 — "comment narrates history / hedges". 19 hits / 187 files, most of
      // them legitimate prose. `contexts: ['any']` is required; without it the
      // rule inspects almost nothing in this codebase.
      "jsdoc/match-description": [
        "error",
        {
          contexts: ["any"],
          matchDescription:
            "^(?![\\s\\S]*\\b(no longer|previously|used to|instead of|we now|this change|originally|may|might|probably|for now)\\b)[\\s\\S]+$",
        },
      ],

      // D3 and D2 — drilling inside expect(), and a literal argument to an
      // equality matcher. 1081 + 34 + 26 hits over 756 test files.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name='expect'] MemberExpression[property.name='length']",
          message: "drill: .length inside expect()",
        },
        {
          selector:
            "CallExpression[callee.name='expect'] MemberExpression[computed=true][property.type='Literal']",
          message: "drill: index inside expect()",
        },
        {
          selector:
            "CallExpression[callee.property.name=/^(toEqual|toStrictEqual|toMatchObject)$/] > :matches(ObjectExpression, ArrayExpression)",
          message: "literal argument to toEqual — use toMatchInlineSnapshot",
        },
      ],
    },
  },
]
