#!/usr/bin/env node
// Among modern-version (>=2.1.263) mise-role subagents, what distinguishes
// runs whose context carried the root CLAUDE.md attachment from those without?
import { createReadStream, readFileSync, existsSync } from "node:fs"
import { readdir, stat } from "node:fs/promises"
import { createInterface } from "node:readline"
import { join } from "node:path"
const ROLE_RE =
  /roles\/(implementer|documenter|reviewer|critic|acceptance|retrospective)\.md/
const out = {}
const bump = (k) => (out[k] = (out[k] ?? 0) + 1)
const walk = async (d, acc) => {
  for (const n of await readdir(d)) {
    const p = join(d, n)
    const s = await stat(p)
    if (s.isDirectory()) await walk(p, acc)
    else if (n.endsWith(".jsonl") && p.includes("/subagents/")) acc.push(p)
  }
}
const files = []
for (const d of process.argv.slice(2)) await walk(d, files)
for (const path of files) {
  const rl = createInterface({
    input: createReadStream(path),
    crlfDelay: Infinity,
  })
  let role = null,
    version = null,
    hasAttach = false,
    firstLines = 0
  for await (const line of rl) {
    if (!role) {
      const m = line.match(ROLE_RE)
      if (m) role = m[1]
    }
    if (!version) {
      const m = line.match(/"version":"([^"]+)"/)
      if (m) version = m[1]
    }
    if (line.includes('"attachment":{"type":"instructions"')) hasAttach = true
    firstLines++
  }
  if (!role) continue
  const v = (version ?? "0.0.0").split(".").map(Number)
  if (!(v[1] > 1 || (v[1] === 1 && v[2] >= 263))) continue
  const metaPath = path.replace(/\.jsonl$/, ".meta.json")
  let meta = {}
  if (existsSync(metaPath)) {
    try {
      meta = JSON.parse(readFileSync(metaPath, "utf8"))
    } catch {}
  }
  const key =
    (meta.requestShape ? "meta-has-requestShape" : "meta-lacks-requestShape") +
    " | " +
    (hasAttach ? "rootCLAUDEmd-ATTACHED" : "rootCLAUDEmd-ABSENT")
  bump(key)
}
console.log(
  Object.entries(out)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${String(v).padStart(4)} ${k}`)
    .join("\n"),
)
