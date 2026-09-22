// Verifies docs/line-evidence.md: every non-blank line of every shipped skill
// file is covered by a row, every id resolves, and every file is under budget.
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..")

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
  readFileSync(join(repo, "docs/v3-research/scorecard/evidence.jsonl"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l).id),
)

const errors = []
const covered = new Map(Object.keys(budgets).map((f) => [f, new Map()]))

for (const line of readFileSync(
  join(repo, "docs/line-evidence.md"),
  "utf8",
).split("\n")) {
  const m = line.match(
    /^\|\s*(\S+\.md)\s*\|\s*(\d+)(?:-(\d+))?\s*\|\s*(.+?)\s*\|$/,
  )
  if (!m) continue
  const [, file, from, to, idCell] = m
  if (!covered.has(file)) {
    errors.push(`${file}: row for a file that is not in the budget table`)
    continue
  }
  const ids = idCell
    .replace(/\([^)]*\)/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (ids.length === 0) errors.push(`${file}:${from} has no id`)
  for (const id of ids) {
    const ok =
      id === "glue" ||
      (evidenceIds.has(id) && /^E-\d{3}$/.test(id)) ||
      (/^O-\d{2}$/.test(id) && +id.slice(2) >= 1 && +id.slice(2) <= 15) ||
      (/^D-\d{2}$/.test(id) && +id.slice(2) >= 1 && +id.slice(2) <= 12)
    if (!ok) errors.push(`${file}:${from} unknown id ${id}`)
  }
  for (let n = +from; n <= +(to ?? from); n++) {
    covered.get(file).set(n, ids)
  }
}

console.log(
  "file                                        lines  budget  covered",
)
let total = 0
for (const [file, budget] of Object.entries(budgets)) {
  const src = readFileSync(join(repo, file), "utf8").split("\n")
  if (src.at(-1) === "") src.pop()
  const nonBlank = src.filter((l) => l.trim() !== "").length
  total += nonBlank
  const rows = covered.get(file)
  const uncovered = []
  src.forEach((text, i) => {
    if (text.trim() !== "" && !rows.has(i + 1)) uncovered.push(i + 1)
  })
  for (const n of rows.keys()) {
    if (n > src.length)
      errors.push(`${file}:${n} row covers a line past end of file`)
  }
  if (uncovered.length)
    errors.push(`${file}: uncovered non-blank lines ${uncovered.join(", ")}`)
  if (nonBlank > budget)
    errors.push(`${file}: ${nonBlank} non-blank lines over budget ${budget}`)
  console.log(
    `${file.padEnd(43)} ${String(nonBlank).padStart(5)}  ${String(budget).padStart(6)}  ${
      uncovered.length ? `MISSING ${uncovered.length}` : "all"
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
  "\nline-evidence.md covers every non-blank line; every file is under budget.",
)
