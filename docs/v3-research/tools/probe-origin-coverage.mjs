// Does the broader "not injected" heuristic agree with origin.kind==='human'
// on the sessions where Claude Code stamps origin?
import fs from "node:fs"
import readline from "node:readline"

const SYN =
  /^\s*(\[Request interrupted by user[^\]]*\]|<local-command-stdout>|API Error:|No response requested\.)/
const text = (c) =>
  typeof c === "string"
    ? c
    : Array.isArray(c)
      ? c
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n")
      : ""

let agree = 0,
  heuristicOnly = 0,
  originOnly = 0,
  filesWithOrigin = 0,
  filesWithout = 0
const heurOnlySamples = []
for (const f of process.argv.slice(2)) {
  const rl = readline.createInterface({
    input: fs.createReadStream(f),
    crlfDelay: Infinity,
  })
  let sawOrigin = false,
    a = 0,
    ho = 0,
    oo = 0
  for await (const line of rl) {
    if (!line.trim()) continue
    let o
    try {
      o = JSON.parse(line)
    } catch {
      continue
    }
    if (o.type !== "user" || o.isSidechain || o.toolUseResult !== undefined)
      continue
    const c = o.message?.content
    if (Array.isArray(c) && c.some((b) => b?.type === "tool_result")) continue
    if (o.isMeta || o.isCompactSummary) continue
    if (o.origin) sawOrigin = true
    const t = text(c)
    const heuristic = !SYN.test(t)
    const origin = o.origin?.kind === "human"
    if (!o.origin) continue // only score where origin is ground truth
    if (heuristic && origin) a++
    else if (heuristic && !origin) {
      ho++
      if (heurOnlySamples.length < 8)
        heurOnlySamples.push(
          `${o.origin.kind}: ${JSON.stringify(t.slice(0, 80))}`,
        )
    } else if (!heuristic && origin) oo++
  }
  agree += a
  heuristicOnly += ho
  originOnly += oo
  if (sawOrigin) filesWithOrigin++
  else filesWithout++
}
console.log(
  JSON.stringify({
    agree,
    heuristicOnly,
    originOnly,
    filesWithOrigin,
    filesWithout,
  }),
)
console.log(heurOnlySamples.join("\n"))
