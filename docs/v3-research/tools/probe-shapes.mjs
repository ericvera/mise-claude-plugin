import fs from "node:fs"
import readline from "node:readline"
const want = process.argv[2]
const files = process.argv.slice(3)
let n = 0
for (const f of files) {
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
    let hit = false
    if (want === "skill")
      hit =
        o.type === "assistant" &&
        Array.isArray(o.message?.content) &&
        o.message.content.some(
          (b) => b.type === "tool_use" && b.name === "Skill",
        )
    if (want === "localcmd")
      hit = o.type === "system" && o.subtype === "local_command"
    if (want === "apierror")
      hit = o.type === "system" && o.subtype === "api_error"
    if (want === "compact")
      hit =
        (o.type === "system" && o.subtype === "compact_boundary") ||
        o.isCompactSummary
    if (want === "denial") hit = !!o.toolDenialKind
    if (want === "taskoutput")
      hit =
        o.type === "assistant" &&
        Array.isArray(o.message?.content) &&
        o.message.content.some(
          (b) =>
            b.type === "tool_use" &&
            (b.name === "TaskOutput" || b.name === "TaskStop"),
        )
    if (want === "usercmd")
      hit =
        o.type === "user" &&
        !o.toolUseResult &&
        JSON.stringify(o.message?.content || "").includes("command-name")
    if (want === "usermsg") hit = o.type === "user" && !o.toolUseResult
    if (hit) {
      n++
      console.log(JSON.stringify(o).slice(0, 900))
      console.log("---")
    }
    if (n >= Number(process.env.LIMIT || 3)) break
  }
  if (n >= Number(process.env.LIMIT || 3)) break
}
