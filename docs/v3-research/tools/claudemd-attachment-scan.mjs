#!/usr/bin/env node
// Which instruction files (CLAUDE.md, memory) are attached into main vs
// subagent contexts? Streams Claude Code JSONL; reads only `attachment`
// entries of type "instructions" and tallies files[].path / files[].type.
import { createReadStream } from "node:fs"
import { readdir, stat } from "node:fs/promises"
import { createInterface } from "node:readline"
import { join, basename } from "node:path"

const tally = { main: {}, subagent: {} }
const fileSeen = { main: 0, subagent: 0 }
const fileWithInstr = { main: 0, subagent: 0 }
const agentTypes = {}

const walk = async (dir, out) => {
  for (const name of await readdir(dir)) {
    const p = join(dir, name)
    const s = await stat(p)
    if (s.isDirectory()) await walk(p, out)
    else if (name.endsWith(".jsonl")) out.push(p)
  }
}

const scan = async (path) => {
  const kind = path.includes("/subagents/") ? "subagent" : "main"
  fileSeen[kind]++
  let hit = false
  const rl = createInterface({
    input: createReadStream(path),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line.includes('"instructions"')) continue
    let e
    try {
      e = JSON.parse(line)
    } catch {
      continue
    }
    if (e.type !== "attachment" || e.attachment?.type !== "instructions")
      continue
    for (const f of e.attachment.files ?? []) {
      const rel = String(f.path).replace(
        /^.*?\/(okven(\.worktrees\/[^/]+)?)\//,
        "",
      )
      const key = `${f.type}:${rel}`
      tally[kind][key] = (tally[kind][key] ?? 0) + 1
      hit = true
    }
  }
  if (hit) fileWithInstr[kind]++
  if (kind === "subagent") {
    // agent type from the sibling .meta.json name is not read here; count by file
    agentTypes[hit ? "withInstructions" : "withoutInstructions"] =
      (agentTypes[hit ? "withInstructions" : "withoutInstructions"] ?? 0) + 1
  }
}

const list = []
for (const d of process.argv.slice(2)) await walk(d, list)
for (const f of list) await scan(f)
const sortObj = (o) =>
  Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]))
console.log(
  JSON.stringify(
    {
      fileSeen,
      fileWithInstr,
      agentTypes,
      tally: { main: sortObj(tally.main), subagent: sortObj(tally.subagent) },
    },
    null,
    2,
  ),
)
