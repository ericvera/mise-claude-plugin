// Verifies docs/line-evidence.md: every non-blank, non-glue line of every
// shipped skill file is covered by a row keyed on the line's first eight words,
// every row still matches a line, every id resolves, and every file is under
// budget. Rows carry no line numbers, so an edit above a line shifts nothing.
//
//   node tools/check-line-evidence.mjs [path to the skills checkout]
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const research = join(here, "..", "..", "..")
const repo = resolve(process.argv[2] ?? research)

const budgets = {
  "skills/next/SKILL.md": 50,
  "skills/next/flow.md": 100,
  "skills/next/stages/setup.md": 20,
  "skills/next/roles/implementer.md": 20,
  "skills/next/roles/reviewer.md": 15,
  "skills/next/roles/critic.md": 15,
  "skills/next/roles/adherence.md": 15,
  "skills/next/roles/sweep.md": 10,
  "skills/next/roles/explore.md": 8,
  "skills/next/references/config-reference.md": 35,
  "skills/retro/SKILL.md": 30,
}

const evidenceIds = new Set(
  readFileSync(join(research, "docs/v3-research/scorecard/evidence.jsonl"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l).id),
)

// A row's key and a line's first eight words compare in this form: markdown
// formatting, list markers and pipe escapes carry no meaning.
const normalize = (text) =>
  text
    .replace(/[`*_\\]/g, "")
    .trim()
    .replace(/^>\s*/, "")
    .replace(/^([-*]|\d+\.)\s+/, "")
    .split(/\s+/)
    .slice(0, 8)
    .join(" ")

// Glue — frontmatter, headings, fenced blocks and their contents, table rows —
// is structure, not instruction, and is deliberately uncovered.
function instructions(src) {
  const out = []
  let frontmatter = false
  let fence = false

  src.forEach((line, i) => {
    const text = line.trim()
    if (text === "") return
    if (i === 0 && text === "---") return void (frontmatter = true)
    if (frontmatter) return void (frontmatter = text !== "---")
    if (text.startsWith("```")) return void (fence = !fence)
    if (fence || text.startsWith("#") || text.startsWith("|")) return
    out.push({ n: i + 1, key: normalize(line) })
  })

  return out
}

const errors = []
const rowKeys = new Map(Object.keys(budgets).map((f) => [f, new Map()]))

for (const line of readFileSync(join(repo, "docs/line-evidence.md"), "utf8").split(
  "\n",
)) {
  // Cells split on unescaped pipes: a key may quote one as `\|`.
  const cells = line.split(/(?<!\\)\|/).map((cell) => cell.trim())
  if (cells.length !== 5 || !cells[1].endsWith(".md")) continue
  const [, file, key, idCell] = cells
  if (!rowKeys.has(file)) {
    errors.push(`${file}: row for a file that is not in the budget table`)
    continue
  }
  const ids = idCell
    .replace(/\([^)]*\)/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (ids.length === 0) errors.push(`${file}: "${key}" has no id`)
  for (const id of ids) {
    const ok =
      (evidenceIds.has(id) && /^E-\d{3}$/.test(id)) ||
      (/^O-\d{2}$/.test(id) && +id.slice(2) >= 1 && +id.slice(2) <= 15) ||
      (/^D-\d{2}$/.test(id) && +id.slice(2) >= 1 && +id.slice(2) <= 13)
    if (!ok) errors.push(`${file}: "${key}" unknown id ${id}`)
  }
  const normal = normalize(key)
  if (rowKeys.get(file).has(normal))
    errors.push(`${file}: duplicate row for "${key}"`)
  rowKeys.get(file).set(normal, ids)
}

console.log("file                                        lines  budget  covered")
let total = 0

for (const [file, budget] of Object.entries(budgets)) {
  const src = readFileSync(join(repo, file), "utf8").split("\n")
  if (src.at(-1) === "") src.pop()
  const nonBlank = src.filter((l) => l.trim() !== "").length
  total += nonBlank

  const rows = rowKeys.get(file)
  const lines = instructions(src)
  const uncovered = lines.filter((l) => !rows.has(l.key))
  const matched = new Set(lines.map((l) => l.key))

  for (const key of rows.keys())
    if (!matched.has(key))
      errors.push(`${file}: row "${key}" matches no line — stale or reworded`)

  if (uncovered.length)
    errors.push(
      `${file}: uncovered non-blank lines ${uncovered.map((l) => l.n).join(", ")}`,
    )
  if (nonBlank > budget)
    errors.push(`${file}: ${nonBlank} non-blank lines over budget ${budget}`)

  console.log(
    `${file.padEnd(43)} ${String(nonBlank).padStart(5)}  ${String(budget).padStart(6)}  ${
      uncovered.length ? `MISSING ${uncovered.length}` : `all ${lines.length}`
    }`,
  )
}

console.log(
  `${"total".padEnd(43)} ${String(total).padStart(5)}  ${String(318).padStart(6)}`,
)

if (errors.length) {
  console.error("\n" + errors.join("\n"))
  process.exit(1)
}

console.log(
  "\nline-evidence.md covers every non-blank, non-glue line by key; every file is under budget.",
)
