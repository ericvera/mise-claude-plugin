import fs from "node:fs"
import readline from "node:readline"
const origins = new Map(),
  previews = new Map()
const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1)
for (const f of process.argv.slice(2)) {
  const rl = readline.createInterface({
    input: fs.createReadStream(f),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line.trim()) continue
    let o
    try {
      o = JSON.parse(line)
    } catch {
      continue
    }
    if (o.type !== "user" || o.toolUseResult || o.isSidechain) continue
    const c = o.message?.content
    const text =
      typeof c === "string"
        ? c
        : Array.isArray(c)
          ? c
              .filter((b) => b.type === "text")
              .map((b) => b.text)
              .join("\n")
          : ""
    bump(
      origins,
      `origin=${o.origin?.kind ?? "-"} meta=${!!o.isMeta} compact=${!!o.isCompactSummary} src=${o.promptSource ?? "-"}`,
    )
    if (!o.isMeta && !o.isCompactSummary && text.length < 120)
      bump(previews, JSON.stringify(text.slice(0, 90)))
  }
}
console.log("--- flag combos ---")
for (const [k, v] of [...origins].sort((a, b) => b[1] - a[1])) console.log(v, k)
console.log("--- short texts (candidate synthetic) ---")
for (const [k, v] of [...previews].sort((a, b) => b[1] - a[1]).slice(0, 40))
  console.log(v, k)
