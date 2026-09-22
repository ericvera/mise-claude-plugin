#!/usr/bin/env node
// run-digests.mjs — digest every session in the selected project dirs.
//
//   node run-digests.mjs [--projects-root <dir>] [--out <dir>]
//
// Writes <out>/digests/<project-dir>/<sessionId>.json and <out>/transcript-index.jsonl.

import fs from "node:fs"
import path from "node:path"
import { digest } from "./digest-transcript.mjs"

const args = process.argv.slice(2)
const argVal = (name, dflt) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : dflt
}

const PROJECTS_ROOT = argVal(
  "--projects-root",
  path.join(process.env.HOME, ".claude", "projects"),
)
const OUT = argVal(
  "--out",
  path.resolve(new URL("../runs", import.meta.url).pathname),
)

// Project dirs are the cwd with '/' and '.' replaced by '-'. We select on the
// segment after the '-Users-<user>-Code-' prefix.
const PREFIX = /^-Users-[^-]+-Code-/
const SELECT = [
  /^okven/, // okven and every okven-worktrees-* dir
  /^delta-review$/,
  /^metaforico$/,
  /^aydy$/,
  /^firebase-kit$/,
  /^ericvera-dev$/,
  /^originhypnosis$/,
  /^mise-claude-plugin$/,
]

const dirs = fs
  .readdirSync(PROJECTS_ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((name) => {
    const tail = name.replace(PREFIX, "")
    return PREFIX.test(name) && SELECT.some((re) => re.test(tail))
  })
  .sort()

fs.mkdirSync(path.join(OUT, "digests"), { recursive: true })
const indexPath = path.join(OUT, "transcript-index.jsonl")
const indexRows = []
let ok = 0
let failed = 0

for (const dir of dirs) {
  const dirPath = path.join(PROJECTS_ROOT, dir)
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()
  fs.mkdirSync(path.join(OUT, "digests", dir), { recursive: true })
  for (const f of files) {
    const full = path.join(dirPath, f)
    const sessionId = path.basename(f, ".jsonl")
    try {
      const d = await digest(full)
      fs.writeFileSync(
        path.join(OUT, "digests", dir, `${sessionId}.json`),
        JSON.stringify(d),
      )
      const tokensByModel = {}
      for (const [m, t] of Object.entries(d.tokens.main.byModel)) {
        tokensByModel[m] = { thread: "main", ...t }
      }
      const subByModel = {}
      for (const [m, t] of Object.entries(d.tokens.subagents.byModel))
        subByModel[m] = t
      indexRows.push({
        projectDir: dir,
        sessionId,
        path: full,
        bytes: d.source.bytes,
        lines: d.session.lines,
        start: d.session.start,
        end: d.session.end,
        wallMs: d.session.wallMs,
        branches: d.session.gitBranches,
        cwds: d.session.cwds,
        ccVersions: d.session.versions,
        miseInvoked: d.mise.invoked,
        miseVersions: d.mise.versions,
        miseStateCalls: d.mise.stateCalls.length,
        subagentCount: d.subagentSummary.records,
        subagentMainThreadSpawns: d.subagentSummary.mainThreadSpawns,
        subagentBySpawnDepth: d.subagentSummary.bySpawnDepth,
        subagentByMiseRole: d.subagentSummary.byMiseRole,
        subagentTotalDurationMs: d.subagentSummary.totalDurationMs,
        tokensMainByModel: d.tokens.main.byModel,
        tokensSubagentByModel: subByModel,
        tokensCombined: d.tokens.combined,
        modelMs: d.wall.modelMs,
        toolMs: d.wall.toolMs,
        humanWaitMs: d.wall.humanWaitMs,
        humanWaitMsCapped30m: d.wall.humanWaitMsCapped30m,
        longestHumanWaitMs: d.wall.longestHumanWaitMs,
        userMessageCount: d.userMessages.length,
        slashCommands: d.slashCommands.map((s) => s.name),
        skillInvocations: d.skills.map((s) => s.skill),
        toolCallTotal: d.toolCounts.total,
        commandRunCount: d.commandRuns.length,
        commandRunFailures: d.commandRuns.filter((r) => r.pass === false)
          .length,
        compactions: d.compactions.filter((c) => c.kind === "boundary").length,
        apiErrors: d.apiErrors.length,
        permissionDenials: d.permissionDenials.length,
        warnings: d.warnings,
      })
      ok += 1
    } catch (e) {
      failed += 1
      indexRows.push({
        projectDir: dir,
        sessionId,
        path: full,
        error: String(e && e.message),
      })
      process.stderr.write(`FAIL ${full}: ${e && e.message}\n`)
    }
  }
}

indexRows.sort((a, b) => String(a.start).localeCompare(String(b.start)))
fs.writeFileSync(
  indexPath,
  indexRows.map((r) => JSON.stringify(r)).join("\n") + "\n",
)
process.stdout.write(
  `dirs=${dirs.length} sessions=${ok} failed=${failed} index=${indexPath}\n`,
)
