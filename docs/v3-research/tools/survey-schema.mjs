// Probe: aggregate structural facts across many session files without loading them into context.
import fs from "node:fs"
import readline from "node:readline"

const counts = new Map()
const bump = (k, n = 1) => counts.set(k, (counts.get(k) || 0) + n)

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
      bump("PARSE_FAIL")
      continue
    }
    bump(`type=${o.type}`)
    if (o.isSidechain) bump(`sidechain:type=${o.type}`)
    if (o.type === "system") bump(`system.subtype=${o.subtype}`)
    if (o.isMeta) bump("isMeta")
    if (o.toolDenialKind) bump(`toolDenialKind=${o.toolDenialKind}`)
    if (o.isCompactSummary) bump("isCompactSummary")
    if (o.compactMetadata) bump("compactMetadata")
    if (o.type === "user") {
      bump(`user.promptSource=${o.promptSource ?? "-"}`)
      bump(`user.origin=${o.origin ?? "-"}`)
      const c = o.message?.content
      if (typeof c === "string") bump("user.content=string")
      else if (Array.isArray(c)) for (const b of c) bump(`user.block=${b.type}`)
    }
    if (o.type === "assistant") {
      bump(`model=${o.message?.model ?? "-"}`)
      const c = o.message?.content
      if (Array.isArray(c))
        for (const b of c) {
          bump(`asst.block=${b.type}`)
          if (b.type === "tool_use") bump(`tool=${b.name}`)
        }
      if (o.message?.usage) bump("usage.present")
      const st = o.message?.stop_reason
      if (st) bump(`stop_reason=${st}`)
    }
    if (o.type === "attachment") bump(`attachment.type=${o.attachment?.type}`)
  }
}
for (const [k, v] of [...counts].sort((a, b) => b[1] - a[1])) console.log(v, k)
