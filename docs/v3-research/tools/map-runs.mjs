#!/usr/bin/env node
// map-runs.mjs — enumerate mise runs across all refs of a repo, from git alone.
//
// Read-only. Every git command used here (for-each-ref, log, rev-list, diff, cat-file,
// ls-tree, merge-base --is-ancestor, rev-parse, show) is non-mutating; nothing is written
// inside the target repo. Output goes to --out only.
//
// A run = one <mise-dir>/ lifecycle on a branch: from the commit where the directory first
// appears on that ref's first-parent line to the commit that removes it, or to the ref tip.
//
// Ref policy (measured; see docs/v3-research/runs/okven-runs.md):
//   refs/heads/*, refs/remotes/*  -> authoritative run history ("branch" source).
//   refs/review/*  -> Delta Review state refs: orphan-rooted chains of "delta-review state"
//       commits whose trees hold the branch's changed files plus the .mise directory. They
//       share no history with main. For a branch that still exists they duplicate the run;
//       for a branch that was deleted after its squash merge they are the ONLY surviving
//       record of the run ("review" source, timelineSource=delta-review-snapshots — the
//       timestamps are review-sync times, not mise checkpoint times).
//   refs/review-notes/*  -> reviewer note refs; evidence only.
//   main's first-parent line -> a squash-merged PR can carry the .mise directory into main
//       and delete it a commit later. Those 1-2 commit segments are merge artifacts, not
//       runs; they are folded into the run that shares a goals.md blob.
// Runs from different sources are folded together when they share a goals.md blob and
// their windows overlap. A run's merge into main is identified by file-set overlap with a
// main first-parent commit (coverage/precision recorded), which also supplies the LOC of a
// run whose branch ref is gone.
//
// Usage:
//   node map-runs.mjs <repo-path> [--out <dir>] [--mise-dir .mise]
//        [--plugin-repo <path>] [--projects-dir <path>] [--provenance <file>]
// Emits <out>/<repoName>-runs.jsonl (one row per run) and a stderr summary.

import { spawnSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"

const US = "\x1f"
const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
const GENERATED =
  /(^|\/)(yarn\.lock|package-lock\.json|pnpm-lock\.yaml|\.yarn\/|dist\/|\.nuxt\/)/

// ---------- args ----------
const argv = process.argv.slice(2)
const repo = path.resolve(argv[0] ?? ".")
const opt = (name, dflt) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? dflt : argv[i + 1]
}
const miseDir = opt("mise-dir", ".mise")
const outDir = path.resolve(opt("out", path.join(process.cwd(), "runs")))
const pluginRepo = path.resolve(
  opt("plugin-repo", "/Users/eric/Code/mise-claude-plugin"),
)
const projectsDir = path.resolve(
  opt("projects-dir", `${process.env.HOME}/.claude/projects`),
)
const provenanceFile = opt(
  "provenance",
  path.join(outDir, "..", "inventory", "provenance.md"),
)
const repoName = path.basename(repo)
const worktreeRoot = `${repo}.worktrees`

// ---------- git plumbing ----------
function git(args, { buffer = false, allowFail = false, input } = {}) {
  const r = spawnSync("git", ["-C", repo, ...args], {
    encoding: buffer ? undefined : "utf8",
    maxBuffer: 1024 * 1024 * 1024,
    input,
  })
  if (r.status !== 0 && !allowFail) {
    throw new Error(
      `git ${args.join(" ")} failed: ${r.stderr?.toString?.() ?? r.status}`,
    )
  }
  return r.stdout ?? (buffer ? Buffer.alloc(0) : "")
}
function gitIn(repoPath, args) {
  const r = spawnSync("git", ["-C", repoPath, ...args], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  })
  return r.status === 0 ? r.stdout : ""
}
const isAncestor = (a, b) =>
  spawnSync("git", ["-C", repo, "merge-base", "--is-ancestor", a, b]).status ===
  0

// One process for many blob reads. Returns Map(spec -> content|null).
function catFileBatch(specs) {
  const out = new Map()
  const uniq = [...new Set(specs)]
  if (!uniq.length) return out
  const buf = git(["cat-file", "--batch"], {
    buffer: true,
    input: uniq.join("\n") + "\n",
    allowFail: true,
  })
  let off = 0
  for (const spec of uniq) {
    if (off >= buf.length) {
      out.set(spec, null)
      continue
    }
    const nl = buf.indexOf(10, off)
    const header = buf.slice(off, nl).toString("utf8")
    off = nl + 1
    const parts = header.split(" ")
    if (parts[parts.length - 1] === "missing") {
      out.set(spec, null)
      continue
    }
    const size = Number(parts[2])
    out.set(spec, buf.slice(off, off + size).toString("utf8"))
    off += size + 1
  }
  return out
}
// Resolve many <commit>:<path> specs to blob shas in one process.
function batchCheck(specs) {
  const out = new Map()
  const uniq = [...new Set(specs)]
  if (!uniq.length) return out
  const raw = git(["cat-file", "--batch-check"], {
    input: uniq.join("\n") + "\n",
    allowFail: true,
  })
  const lines = raw.split("\n").filter(Boolean)
  uniq.forEach((spec, i) => {
    const parts = (lines[i] ?? "").split(" ")
    out.set(spec, parts[1] === "blob" ? parts[0] : null)
  })
  return out
}
const lineCount = (s) =>
  s == null
    ? null
    : s.length === 0
      ? 0
      : s.replace(/\n$/, "").split("\n").length
const iso = (unix) => new Date(unix * 1000).toISOString()
const hours = (a, b) =>
  a == null || b == null ? null : Math.round(((b - a) / 3600) * 100) / 100

// ---------- refs ----------
const branchRefs = () =>
  git(["for-each-ref", "--format=%(refname)", "refs/heads", "refs/remotes"])
    .split("\n")
    .filter((r) => r && !r.endsWith("/HEAD"))
const reviewStateRefs = () =>
  git(["for-each-ref", "--format=%(refname)", "refs/review"])
    .split("\n")
    .filter(Boolean)
const reviewNoteRefs = () =>
  git(["for-each-ref", "--format=%(refname)", "refs/review-notes"])
    .split("\n")
    .filter(Boolean)
const refPriority = (ref) =>
  ref.startsWith("refs/review/")
    ? 6
    : ref.startsWith("refs/heads/backup/")
      ? 4
      : ref.startsWith("refs/heads/")
        ? 1
        : ref.startsWith("refs/remotes/")
          ? 2
          : 5
const shortRef = (ref) =>
  ref
    .replace(/^refs\/heads\//, "")
    .replace(/^refs\/remotes\/[^/]+\//, "")
    .replace(/^refs\/review-notes\//, "")
    .replace(/^refs\/review\//, "")

// ---------- log parsing / segmentation ----------
function logRef(ref) {
  const fmt = `@@C@@%H${US}%ct${US}%at${US}%P${US}%s`
  const raw = git([
    "log",
    "--first-parent",
    "--root",
    "--reverse",
    "--name-status",
    `--format=${fmt}`,
    ref,
    "--",
    miseDir,
  ])
  const commits = []
  for (const chunk of raw.split("@@C@@").slice(1)) {
    const nl = chunk.indexOf("\n")
    const header = nl === -1 ? chunk : chunk.slice(0, nl)
    const body = nl === -1 ? "" : chunk.slice(nl + 1)
    const [sha, ct, at, parents, subject] = header.split(US)
    const changes = []
    for (const line of body.split("\n")) {
      if (!line.includes("\t")) continue
      const parts = line.split("\t")
      changes.push({
        status: parts[0][0],
        from: parts.length > 2 ? parts[1] : null,
        path: parts[parts.length - 1],
      })
    }
    commits.push({
      sha,
      ct: +ct,
      at: +at,
      parents: parents ? parents.split(" ") : [],
      subject: subject ?? "",
      changes,
    })
  }
  return commits
}
function segment(ref) {
  const commits = logRef(ref)
  const live = new Set()
  const runs = []
  let cur = null
  for (const c of commits) {
    const before = live.size
    for (const ch of c.changes) {
      if (ch.status === "D") live.delete(ch.path)
      else if (ch.status === "R") {
        if (ch.from) live.delete(ch.from)
        live.add(ch.path)
      } else live.add(ch.path)
    }
    if (before === 0 && live.size > 0)
      cur = {
        ref,
        commits: [],
        paths: new Set(),
        lastTouch: new Map(),
        history: new Map(),
      }
    if (!cur) continue
    cur.commits.push(c)
    for (const ch of c.changes) {
      if (ch.status === "D") continue
      cur.paths.add(ch.path)
      cur.lastTouch.set(ch.path, c.sha)
      const h = cur.history.get(ch.path) ?? []
      h.push(c.sha)
      if (h.length > 6) h.shift()
      cur.history.set(ch.path, h)
    }
    if (live.size === 0) {
      cur.cleanedUp = true
      runs.push(cur)
      cur = null
    }
  }
  if (cur) {
    cur.cleanedUp = false
    runs.push(cur)
  }
  return runs
}

// ---------- mise version timeline ----------
// plugin.json on the plugin repo's main line is the authoritative record of what was
// published when. inventory/provenance.md (when present) is a per-change table whose
// version column is cross-checked against it, not used in its place: it is incomplete
// (it carries no row for 1.1.0-1.5.0) and its rows are changes, not releases.
function pluginTimeline() {
  const rows = []
  const mainRef = ["refs/remotes/origin/main", "refs/heads/main"].find((r) =>
    gitIn(pluginRepo, ["rev-parse", "--verify", "--quiet", r]).trim(),
  )
  const raw = gitIn(pluginRepo, [
    "log",
    "--first-parent",
    mainRef ?? "HEAD",
    "--format=%H%x1f%ct",
    "--",
    ".claude-plugin/plugin.json",
  ])
  for (const line of raw.split("\n").filter(Boolean)) {
    const [sha, ct] = line.split(US)
    const json = gitIn(pluginRepo, [
      "show",
      `${sha}:.claude-plugin/plugin.json`,
    ])
    const m = json.match(/"version"\s*:\s*"([^"]+)"/)
    if (m)
      rows.push({
        ts: +ct,
        version: m[1],
        source: `plugin.json@${sha.slice(0, 9)} on ${mainRef ?? "HEAD"}`,
      })
  }
  return rows.sort((a, b) => a.ts - b.ts)
}
function provenanceTimeline() {
  if (!existsSync(provenanceFile)) return []
  const firstSeen = new Map()
  for (const line of readFileSync(provenanceFile, "utf8").split("\n")) {
    const m = line.match(
      /^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*v?(\d+\.\d+\.\d+)\s*\|/,
    )
    if (!m) continue
    const ts = Date.parse(`${m[1]}T00:00:00Z`) / 1000
    if (!firstSeen.has(m[2]) || ts < firstSeen.get(m[2]))
      firstSeen.set(m[2], ts)
  }
  return [...firstSeen.entries()]
    .map(([version, ts]) => ({
      ts,
      version,
      source: path.basename(provenanceFile),
    }))
    .sort((a, b) => a.ts - b.ts)
}
function versionAt(timeline, ts) {
  let cur = null
  for (const row of timeline) if (row.ts <= ts) cur = row
  return cur
    ? { version: cur.version, source: cur.source }
    : { version: null, source: null }
}

// ---------- transcripts ----------
let projectDirCache = null
function projectDirs() {
  if (projectDirCache) return projectDirCache
  projectDirCache = []
  if (!existsSync(projectsDir)) return projectDirCache
  for (const d of readdirSync(projectsDir)) {
    if (!d.includes(repoName)) continue
    const full = path.join(projectsDir, d)
    let files = []
    try {
      files = readdirSync(full).filter((f) => f.endsWith(".jsonl"))
    } catch {
      /* unreadable */
    }
    let min = null,
      max = null,
      bytes = 0
    for (const f of files) {
      try {
        const st = statSync(path.join(full, f))
        bytes += st.size
        const m = Math.floor(st.mtimeMs / 1000)
        if (min == null || m < min) min = m
        if (max == null || m > max) max = m
      } catch {
        /* ignore */
      }
    }
    const wt = d.startsWith(`-Users-eric-Code-${repoName}-worktrees-`)
      ? d.slice(`-Users-eric-Code-${repoName}-worktrees-`.length)
      : null
    projectDirCache.push({
      dir: full,
      name: d,
      worktreeSlug: wt,
      sessions: files.length,
      bytes,
      mtimeFirst: min,
      mtimeLast: max,
    })
  }
  return projectDirCache
}
function transcriptDirs(branch, firstAt, lastAt) {
  const slug = branch ? branch.replace(/\//g, "-") : null
  const out = []
  for (const d of projectDirs()) {
    const exact =
      slug != null &&
      (d.worktreeSlug === slug || d.worktreeSlug === `${slug}.data`)
    const overlaps =
      d.mtimeFirst != null &&
      d.mtimeLast != null &&
      d.mtimeLast >= firstAt &&
      d.mtimeFirst <= lastAt + 86400
    const shared = d.worktreeSlug == null
    if (!exact && !overlaps) continue
    out.push({
      dir: d.dir,
      sessions: d.sessions,
      bytes: d.bytes,
      mtimeFirst: d.mtimeFirst ? iso(d.mtimeFirst) : null,
      mtimeLast: d.mtimeLast ? iso(d.mtimeLast) : null,
      match: exact
        ? "worktree-slug-exact"
        : shared
          ? "main-checkout-mtime-overlap"
          : "worktree-mtime-overlap",
      shared,
    })
  }
  return out.sort(
    (a, b) =>
      (a.match === "worktree-slug-exact" ? -1 : 1) -
      (b.match === "worktree-slug-exact" ? -1 : 1),
  )
}

// ---------- delta review ----------
function deltaReviewDirs() {
  const dirs = [path.join(repo, ".git", "delta-review")]
  const wtRoot = path.join(repo, ".git", "worktrees")
  if (existsSync(wtRoot))
    for (const w of readdirSync(wtRoot))
      dirs.push(path.join(wtRoot, w, "delta-review"))
  if (existsSync(worktreeRoot)) {
    for (const w of readdirSync(worktreeRoot))
      dirs.push(path.join(worktreeRoot, w, ".git", "delta-review"))
  }
  return dirs.filter((d) => existsSync(d))
}
const DR_DIRS = null // lazily filled in main
let drIndex = null
function deltaReview(branch, reviewRefSet) {
  if (!branch) return { files: [], refs: [], kinds: [] }
  const slug = branch.replace(/\//g, "-")
  const files = (drIndex ?? []).filter((f) =>
    path.basename(f).endsWith(`-${slug}.json`),
  )
  const kinds = [...new Set(files.map((f) => path.basename(f).split("-")[0]))]
  const rs = [`refs/review/${branch}`, `refs/review-notes/${branch}`].filter(
    (r) => reviewRefSet.has(r),
  )
  return { files, refs: rs, kinds }
}

// ---------- friction / progress ----------
function parseFriction(text) {
  if (!text) return null
  const gates = {}
  const reviewTasks = []
  const other = []
  for (const raw of text.split("\n")) {
    // friction entries are written as bullets in some runs and as bare lines in others;
    // strip the marker so one parser reads both
    const line = raw.trim().replace(/^[-*]\s+/, "")
    if (!line || line.startsWith("#")) continue
    let m = line.match(
      /^critic\s+(\w+)(?:\s*\([^)]*\))?:\s*(?:.*?\b(\d+)\s*rounds?)/i,
    )
    if (m) {
      const g = (gates[m[1].toLowerCase()] ??= {
        maxRounds: null,
        reports: [],
        stalled: false,
        blocking: null,
      })
      g.maxRounds = Math.max(g.maxRounds ?? 0, +m[2])
      g.reports.push(+m[2])
      if (/stall/i.test(line)) g.stalled = true
      const b = line.match(/blocking\s+([\d/,]+)/i)
      if (b) g.blocking = b[1]
      continue
    }
    m = line.match(/^critic\s+(\w+)(?:\s*\([^)]*\))?:/i)
    if (m) {
      const g = (gates[m[1].toLowerCase()] ??= {
        maxRounds: null,
        reports: [],
        stalled: false,
        blocking: null,
      })
      if (/stall/i.test(line)) g.stalled = true
      continue
    }
    m = line.match(/^task\s+(\d+[._]\d+)\s*(?:fix)?:\s*(.*)$/i)
    if (m) {
      reviewTasks.push({
        task: m[1],
        kind: /review found/i.test(m[2])
          ? "review"
          : /blocked/i.test(m[2])
            ? "blocked"
            : "other",
        text: m[2].slice(0, 400),
      })
      continue
    }
    other.push(line.slice(0, 400))
  }
  return {
    gates,
    taskLines: reviewTasks,
    otherLines: other,
    lines: lineCount(text),
  }
}
function parseProgress(text) {
  if (!text) return null
  const heads = [...text.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim())
  return {
    sections: heads.length,
    fixSections: heads.filter((h) => /\bfix\b/i.test(h)).length,
    lines: lineCount(text),
    checklistAnswers: (text.match(/Checklist:/g) ?? []).length,
  }
}

// ---------- merge matching: which main commit squash-merged this run ----------
function mainIndex(mainRef) {
  const raw = git([
    "log",
    "--first-parent",
    "--name-only",
    `--format=@@%H${US}%ct${US}%s`,
    mainRef,
  ])
  const commits = []
  for (const chunk of raw.split("@@").slice(1)) {
    const nl = chunk.indexOf("\n")
    const [sha, ct, subj] = chunk
      .slice(0, nl === -1 ? chunk.length : nl)
      .split(US)
    const files = new Set(
      (nl === -1 ? "" : chunk.slice(nl + 1))
        .split("\n")
        .filter((f) => f && !f.startsWith(`${miseDir}/`)),
    )
    commits.push({ sha, ct: +ct, subj, files })
  }
  return commits
}
// How many main commits ever touched each path: a file touched by most commits (CLAUDE.md,
// yarn.lock, config) identifies nothing, a file touched two or three times identifies a run.
function fileFrequency(index) {
  const df = new Map()
  for (const c of index)
    for (const p of c.files) df.set(p, (df.get(p) ?? 0) + 1)
  return df
}
function matchMerge(index, fileSet, t0, t1, df) {
  const set = [...fileSet].filter((p) => (df.get(p) ?? 0) <= 40)
  if (!set.length || !index.length) return null
  let best = null
  for (const c of index) {
    if (c.ct < t0 - 86400 || c.ct > t1 + 45 * 86400) continue
    const matched = set.filter((p) => c.files.has(p))
    if (!matched.length) continue
    const rare = matched.filter((p) => (df.get(p) ?? 0) <= 5).length
    const cov = matched.length / set.length
    const prec = matched.length / Math.max(1, c.files.size)
    if (!best || matched.length > best.hit) {
      best = {
        sha: c.sha,
        ts: iso(c.ct),
        at: c.ct,
        subject: c.subj,
        hit: matched.length,
        rareHits: rare,
        coverage: +cov.toFixed(2),
        precision: +prec.toFixed(2),
        commitFiles: c.files.size,
        runFilesScored: set.length,
      }
    }
  }
  return best
}

// Fallback for a run too small for file-set voting: a file's blob is unique, so the oldest
// main commit that introduced that exact blob is the commit that landed this run's work.
function matchMergeByBlob(fileSet, tipSha, df, mainRef, t0) {
  const files = [...fileSet]
    .filter((p) => (df.get(p) ?? 0) <= 40)
    .sort((a, b) => (df.get(a) ?? 0) - (df.get(b) ?? 0))
    .slice(0, 8)
  const votes = new Map()
  for (const p of files) {
    const blob = git(["rev-parse", `${tipSha}:${p}`], {
      allowFail: true,
    }).trim()
    if (!/^[0-9a-f]{40}$/.test(blob)) continue
    const lines = git(
      [
        "log",
        "--first-parent",
        `--format=%H${US}%ct${US}%s`,
        `--find-object=${blob}`,
        mainRef,
      ],
      { allowFail: true },
    )
      .split("\n")
      .filter(Boolean)
    if (!lines.length) continue
    const [sha, ct, subj] = lines[lines.length - 1].split(US) // oldest: where the blob entered main
    if (+ct < t0 - 86400) continue
    const v = votes.get(sha) ?? {
      sha,
      at: +ct,
      subject: subj,
      hit: 0,
      files: [],
    }
    v.hit++
    v.files.push(p)
    votes.set(sha, v)
  }
  let best = null
  for (const v of votes.values()) if (!best || v.hit > best.hit) best = v
  if (!best) return null
  return {
    sha: best.sha,
    ts: iso(best.at),
    at: best.at,
    subject: best.subject,
    hit: best.hit,
    rareHits: best.hit,
    coverage: +(best.hit / Math.max(1, files.length)).toFixed(2),
    precision: null,
    commitFiles: null,
    runFilesScored: files.length,
    method: "identical blob entered main in this commit",
    matchedFiles: best.files,
  }
}

// ---------- main ----------
function main() {
  drIndex = deltaReviewDirs().flatMap((d) =>
    readdirSync(d).map((f) => path.join(d, f)),
  )
  const bRefs = branchRefs()
  const rRefs = reviewStateRefs()
  const noteRefs = reviewNoteRefs()
  const reviewRefSet = new Set([...rRefs, ...noteRefs])
  const timeline = pluginTimeline()
  const provTimeline = provenanceTimeline()
  const mainRefs = [
    "refs/remotes/origin/main",
    "refs/heads/main",
    "refs/remotes/origin/master",
    "refs/heads/master",
  ].filter((r) =>
    git(["rev-parse", "--verify", "--quiet", r], { allowFail: true }).trim(),
  )
  const mainFirstParent = new Set(
    mainRefs.length
      ? git(["rev-list", "--first-parent", mainRefs[0]])
          .split("\n")
          .filter(Boolean)
      : [],
  )
  const mIndex = mainRefs.length ? mainIndex(mainRefs[0]) : []
  const mainFileFreq = fileFrequency(mIndex)

  // goals.md blob -> branch names taken from Delta Review state ref names. A run whose
  // branch ref was deleted (and whose pre-rebase copy survives only on a backup branch)
  // can still be named this way, even when its snapshot chain is attached elsewhere.
  const reviewGoalsBlob = new Map()
  for (const ref of rRefs) {
    const shas = git(["log", "--format=%H", ref, "--", `${miseDir}/goals.md`], {
      allowFail: true,
    })
      .split("\n")
      .filter(Boolean)
    for (const b of batchCheck(
      shas.map((x) => `${x}:${miseDir}/goals.md`),
    ).values()) {
      if (!b) continue
      const set = reviewGoalsBlob.get(b) ?? new Set()
      set.add(shortRef(ref))
      reviewGoalsBlob.set(b, set)
    }
  }

  const raw = []
  for (const ref of bRefs)
    for (const run of segment(ref)) {
      run.kind = "branch"
      raw.push(run)
    }
  for (const ref of rRefs) {
    const segs = segment(ref)
    if (!segs.length) continue
    // A Delta Review chain writes one commit per file per sync, and the .mise commits are
    // only some of them, so the branch's changed files sit in commits the .mise-filtered log
    // never sees. Attribute every chain commit's non-.mise files to the nearest run.
    const chain = []
    const rawLog = git(
      [
        "log",
        "--first-parent",
        "--root",
        "--name-only",
        `--format=@@%H${US}%at`,
        ref,
      ],
      { allowFail: true },
    )
    for (const chunk of rawLog.split("@@").slice(1)) {
      const nl = chunk.indexOf("\n")
      const [sha, at] = chunk.slice(0, nl === -1 ? chunk.length : nl).split(US)
      const files = (nl === -1 ? "" : chunk.slice(nl + 1))
        .split("\n")
        .filter((f) => f && !f.startsWith(`${miseDir}/`))
      chain.push({ sha, at: +at, files })
    }
    for (const run of segs) {
      run.kind = "review"
      run.nonMisePaths = new Set()
      run.firstAt = run.commits[0].at
      run.lastAt = run.commits[run.commits.length - 1].at
    }
    const dist = (seg, at) =>
      at < seg.firstAt
        ? seg.firstAt - at
        : at > seg.lastAt
          ? at - seg.lastAt
          : 0
    for (const c of chain) {
      if (!c.files.length) continue
      let best = segs[0]
      for (const seg of segs) if (dist(seg, c.at) < dist(best, c.at)) best = seg
      for (const f of c.files) best.nonMisePaths.add(f)
    }
    for (const run of segs) raw.push(run)
  }

  // Hydrate: goals.md blobs (the fold key), window, mainline flag, changed non-mise files.
  const goalsSpecs = []
  for (const run of raw) {
    run.goalsCommits = run.commits
      .filter((c) =>
        c.changes.some(
          (ch) => ch.path === `${miseDir}/goals.md` && ch.status !== "D",
        ),
      )
      .map((c) => c.sha)
    for (const s of run.goalsCommits)
      goalsSpecs.push(`${s}:${miseDir}/goals.md`)
    run.firstAt = run.commits[0].at
    run.lastAt = run.commits[run.commits.length - 1].at
    run.onMainline = mainFirstParent.has(run.commits[0].sha)
  }
  const goalsBlobShas = batchCheck(goalsSpecs)
  for (const run of raw) {
    run.goalsBlobs = run.goalsCommits
      .map((s) => goalsBlobShas.get(`${s}:${miseDir}/goals.md`))
      .filter(Boolean)
  }

  // Fold in two phases. Phase 1 unions branch-source segments that share a goals.md blob
  // and overlap in time (the same run seen on refs/heads, refs/remotes, the rebase backup
  // branch and main's squash commit). Phase 2 attaches each Delta Review snapshot chain to
  // at most ONE branch group: a chain often spans two consecutive runs on a branch, and
  // unioning through it would glue those runs into one.
  const SLACK = 2 * 86400
  const overlaps = (a, b) =>
    a.firstAt - SLACK <= b.lastAt && b.firstAt - SLACK <= a.lastAt
  const branchRuns = raw.filter((r) => r.kind === "branch")
  const reviewRuns = raw.filter((r) => r.kind === "review")
  const parent = branchRuns.map((_, i) => i)
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const union = (a, b) => {
    const ra = find(a),
      rb = find(b)
    if (ra !== rb) parent[ra] = rb
  }
  for (let x = 0; x < branchRuns.length; x++) {
    for (let y = x + 1; y < branchRuns.length; y++) {
      const a = branchRuns[x],
        b = branchRuns[y]
      if (a.goalsBlobs.some((g) => b.goalsBlobs.includes(g)) && overlaps(a, b))
        union(x, y)
    }
  }
  const groupsById = new Map()
  branchRuns.forEach((run, i) => {
    const r = find(i)
    const g = groupsById.get(r) ?? []
    g.push(run)
    groupsById.set(r, g)
  })
  const entries = [...groupsById.entries()].map(([id, group]) => ({
    key: `b${id}`,
    group,
  }))
  for (const rev of reviewRuns) {
    let best = null
    for (const e of entries) {
      const shared = e.group.reduce(
        (n, r) =>
          n + rev.goalsBlobs.filter((g) => r.goalsBlobs.includes(g)).length,
        0,
      )
      if (!shared || !e.group.some((r) => overlaps(rev, r))) continue
      // Prefer the branch run whose own window sits inside the chain's window.
      const span = Math.min(
        ...e.group.map((r) => Math.abs(r.firstAt - rev.firstAt)),
      )
      if (
        !best ||
        shared > best.shared ||
        (shared === best.shared && span < best.span)
      )
        best = { e, shared, span }
    }
    if (best) best.e.group.push(rev)
    else entries.push({ key: `r${entries.length}`, group: [rev] })
  }
  for (const e of entries) {
    e.group.sort(
      (a, b) =>
        refPriority(a.ref) - refPriority(b.ref) ||
        b.commits.length - a.commits.length,
    )
  }
  const rows = entries.map((e) =>
    buildRow(e, {
      timeline,
      provTimeline,
      mainRefs,
      mainFirstParent,
      reviewRefSet,
      mIndex,
      mainFileFreq,
      reviewGoalsBlob,
    }),
  )
  rows.sort((a, b) => a.firstCommitTs.localeCompare(b.firstCommitTs))

  mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `${repoName}-runs.jsonl`)
  writeFileSync(outFile, rows.map((r) => JSON.stringify(r)).join("\n") + "\n")
  const bySrc = rows.reduce(
    (m, r) => ((m[r.timelineSource] = (m[r.timelineSource] ?? 0) + 1), m),
    {},
  )
  process.stderr.write(
    `branch refs: ${bRefs.length}; review state refs: ${rRefs.length}; raw segments: ${raw.length}; ` +
      `runs: ${rows.length} (${JSON.stringify(bySrc)})\nwrote ${outFile}\n`,
  )
}

function buildRow(entry, ctx) {
  const {
    timeline,
    provTimeline,
    mainRefs,
    mainFirstParent,
    reviewRefSet,
    mIndex,
    mainFileFreq,
    reviewGoalsBlob,
  } = ctx
  const { key, group } = entry
  // Squash artifacts carried into main are bookkeeping, not the run's own history.
  const squashSegs = group.filter((r) => r.onMainline && r.commits.length <= 3)
  const squashCommits = squashSegs.flatMap((r) =>
    r.commits.map((c) => ({ sha: c.sha, ts: iso(c.at), subject: c.subject })),
  )
  const body = group.filter((r) => !squashSegs.includes(r))
  const run = (body.length ? body : group)[0]
  const mainlineOnly = !body.length
  const timelineSource = mainlineOnly
    ? "main-squash-commits-only"
    : run.kind === "review"
      ? "delta-review-snapshots"
      : "branch-commits"
  const first = run.commits[0]
  const last = run.commits[run.commits.length - 1]
  const base =
    run.kind === "review" ? EMPTY_TREE : (first.parents[0] ?? EMPTY_TREE)

  // --- branch attribution ---
  const named =
    group.find(
      (r) =>
        r.ref.startsWith("refs/heads/") &&
        !r.ref.startsWith("refs/heads/backup/") &&
        !r.onMainline,
    ) ??
    group.find((r) => r.ref.startsWith("refs/remotes/") && !r.onMainline) ??
    group.find(
      (r) => r.ref.startsWith("refs/review/") && shortRef(r.ref) !== "HEAD",
    )
  let branch = named ? shortRef(named.ref) : null
  let branchSource = named
    ? named.ref.startsWith("refs/review/")
      ? `recovered from Delta Review state ref ${named.ref}`
      : named.ref
    : null
  const recovered = new Set()
  for (const seg of group)
    for (const b of seg.goalsBlobs)
      for (const n of reviewGoalsBlob.get(b) ?? []) recovered.add(n)
  if (!branch && recovered.size === 1) {
    branch = [...recovered][0]
    branchSource = `recovered from the Delta Review state ref holding this run's goals.md blob`
  }

  // --- state-file history -> stage transitions ---
  const statePath = `${miseDir}/.workflow-state`
  const stateCommits = run.commits.filter((c) =>
    c.changes.some((ch) => ch.path === statePath && ch.status !== "D"),
  )
  const stateBlobs = catFileBatch(
    stateCommits.map((c) => `${c.sha}:${statePath}`),
  )
  const transitions = []
  let prev = { route: null, approved: {}, accepted: null }
  let route = null
  for (const c of stateCommits) {
    let st
    try {
      st = JSON.parse(stateBlobs.get(`${c.sha}:${statePath}`) ?? "")
    } catch {
      continue
    }
    const approved = st.approved ?? {}
    if (st.route && st.route !== route) {
      route = st.route
      transitions.push({
        event: "route",
        stage: null,
        value: st.route,
        ts: iso(c.at),
        at: c.at,
        sha: c.sha,
        subject: c.subject,
      })
    }
    for (const [stage, hash] of Object.entries(approved)) {
      if (!(stage in prev.approved))
        transitions.push({
          event: "approved",
          stage,
          ts: iso(c.at),
          at: c.at,
          sha: c.sha,
          subject: c.subject,
        })
      else if (prev.approved[stage] !== hash)
        transitions.push({
          event: "reapproved",
          stage,
          ts: iso(c.at),
          at: c.at,
          sha: c.sha,
          subject: c.subject,
        })
    }
    for (const stage of Object.keys(prev.approved)) {
      if (!(stage in approved))
        transitions.push({
          event: "reopened",
          stage,
          ts: iso(c.at),
          at: c.at,
          sha: c.sha,
          subject: c.subject,
        })
    }
    if (st.accepted && st.accepted !== prev.accepted) {
      transitions.push({
        event: "accepted",
        stage: "acceptance",
        ts: iso(c.at),
        at: c.at,
        sha: c.sha,
        subject: c.subject,
      })
    }
    prev = { route: st.route ?? null, approved, accepted: st.accepted ?? null }
  }

  // --- task files ---
  const taskRe = new RegExp(
    `^${miseDir.replace(".", "\\.")}/implementation_plan/(done/)?(\\d\\d_\\d\\d[^/]*\\.md)$`,
  )
  const taskFiles = new Set()
  const doneFiles = new Set()
  for (const p of run.paths) {
    const m = p.match(taskRe)
    if (!m) continue
    taskFiles.add(m[2])
    if (m[1]) doneFiles.add(m[2])
  }
  const doneCommits = run.commits.filter((c) =>
    c.changes.some(
      (ch) =>
        ch.status !== "D" &&
        ch.path.includes(`${miseDir}/implementation_plan/done/`),
    ),
  )
  const lastDoneAt = doneCommits.length
    ? doneCommits[doneCommits.length - 1].at
    : null
  const firstDoneAt = doneCommits.length ? doneCommits[0].at : null

  // --- artifacts (final version inside the run) ---
  const wanted = [
    `${miseDir}/goals.md`,
    `${miseDir}/requirements.md`,
    `${miseDir}/implementation_plan/00_overview.md`,
    `${miseDir}/mocks.html`,
    `${miseDir}/mocks.context.md`,
    `${miseDir}/_friction.md`,
    `${miseDir}/implementation_plan/_progress.md`,
    `${miseDir}/implementation_plan/_exploration_notes.md`,
    `${miseDir}/retrospective_notes.md`,
  ].filter((p) => run.lastTouch.has(p))
  const taskPathList = [...run.paths].filter((p) => taskRe.test(p))
  const specs = []
  for (const p of [...wanted, ...taskPathList])
    for (const sha of run.history.get(p) ?? [run.lastTouch.get(p)])
      specs.push(`${sha}:${p}`)
  const blobs = catFileBatch(specs)
  // A Delta Review snapshot records a file the branch deleted as a one-line placeholder,
  // so the newest blob for a path can be that placeholder rather than the artifact.
  const isPlaceholder = (t) =>
    t != null && t.startsWith("delta-review: file deleted")
  const artText = (p) => {
    const hist =
      run.history.get(p) ?? (run.lastTouch.has(p) ? [run.lastTouch.get(p)] : [])
    for (let i = hist.length - 1; i >= 0; i--) {
      const t = blobs.get(`${hist[i]}:${p}`)
      if (t != null && !isPlaceholder(t)) return t
    }
    return null
  }
  const artLines = (p) => lineCount(artText(p))
  // A task file appears twice once it is done: at its plan path and under done/. Count each
  // task once, preferring the done/ copy.
  const taskById = new Map()
  for (const p of taskPathList) {
    const id = p.match(taskRe)[2].slice(0, 5)
    if (!taskById.has(id) || p.includes("/done/")) taskById.set(id, p)
  }
  const taskLinesTotal = [...taskById.values()].reduce(
    (n, p) => n + (artLines(p) ?? 0),
    0,
  )
  const miseDeletedInSnapshots =
    run.kind === "review" &&
    isPlaceholder(
      blobs.get(
        `${run.lastTouch.get(`${miseDir}/goals.md`)}:${miseDir}/goals.md`,
      ),
    )

  // Notes-shaped artifacts recorded with path + blob sha for a later reading pass.
  const noteRe = /(friction|retro|review|progress|exploration|notes)/i
  const notePaths = [...run.paths].filter(
    (p) => noteRe.test(path.basename(p)) && !taskRe.test(p),
  )
  const noteShas = batchCheck(
    notePaths.map((p) => `${run.lastTouch.get(p)}:${p}`),
  )
  const noteArtifacts = notePaths.map((p) => ({
    path: p,
    atCommit: run.lastTouch.get(p),
    blob: noteShas.get(`${run.lastTouch.get(p)}:${p}`),
    lines: artLines(p),
  }))

  const friction = parseFriction(artText(`${miseDir}/_friction.md`))
  const progress = parseProgress(
    artText(`${miseDir}/implementation_plan/_progress.md`),
  )
  const goalsText = artText(`${miseDir}/goals.md`)

  // --- commits in the run window ---
  const baseIsAncestor = run.kind === "branch" && isAncestor(base, last.sha)
  const windowSubjects = baseIsAncestor
    ? git(["log", "--first-parent", "--format=%s", `${base}..${last.sha}`], {
        allowFail: true,
      })
        .split("\n")
        .filter(Boolean)
    : run.commits.map((c) => c.subject)
  const count = (re) => windowSubjects.filter((s) => re.test(s)).length

  // Gate rounds are also visible in commit subjects, independent of _friction.md.
  const criticRounds = {}
  for (const s of windowSubjects) {
    const m = s.match(/^mise: revise (\w+).*critic round (\d+)/i)
    if (m)
      criticRounds[m[1].toLowerCase()] = Math.max(
        criticRounds[m[1].toLowerCase()] ?? 0,
        +m[2],
      )
  }

  // --- non-.mise diff ---
  const numstat = baseIsAncestor
    ? git(
        [
          "diff",
          "--numstat",
          base,
          last.sha,
          "--",
          ":/",
          `:(exclude)${miseDir}`,
        ],
        { allowFail: true },
      )
    : ""
  let added = 0,
    removed = 0,
    filesChanged = 0,
    binaryFiles = 0,
    codeAdded = 0,
    codeRemoved = 0,
    codeFiles = 0
  for (const line of numstat.split("\n").filter(Boolean)) {
    const parts = line.split("\t")
    const [a, d] = parts
    const p = parts[parts.length - 1]
    filesChanged++
    if (a === "-" || d === "-") {
      binaryFiles++
      continue
    }
    added += +a
    removed += +d
    if (!GENERATED.test(p)) {
      codeAdded += +a
      codeRemoved += +d
      codeFiles++
    }
  }
  // Churn actually authored inside the run (each commit against its own parent).
  let ownAdded = 0,
    ownRemoved = 0
  const ownRaw = baseIsAncestor
    ? git(
        [
          "log",
          "--first-parent",
          "--no-merges",
          "--numstat",
          "--format=",
          `${base}..${last.sha}`,
          "--",
          ":/",
          `:(exclude)${miseDir}`,
        ],
        { allowFail: true },
      )
    : ""
  for (const line of ownRaw.split("\n").filter(Boolean)) {
    const [a, d] = line.split("\t")
    if (a === "-" || d === "-") continue
    ownAdded += +a
    ownRemoved += +d
  }
  const nameStatus = baseIsAncestor
    ? git(
        [
          "diff",
          "--name-status",
          base,
          last.sha,
          "--",
          ":/",
          `:(exclude)${miseDir}`,
        ],
        { allowFail: true },
      )
    : ""
  const addedFiles = []
  for (const line of nameStatus.split("\n").filter(Boolean)) {
    const parts = line.split("\t")
    if (parts[0][0] === "A") addedFiles.push(parts[parts.length - 1])
  }

  // --- which main commit carries this run's work ---
  // A Delta Review snapshot tree is exactly the branch's changed-file set, which is what a
  // squash commit on main reproduces — so it matches even when the branch ref is gone.
  const changedSet = baseIsAncestor
    ? new Set(
        nameStatus
          .split("\n")
          .filter(Boolean)
          .map((l) => {
            const p = l.split("\t")
            return p[p.length - 1]
          }),
      )
    : new Set([
        // The last snapshot can be the cleanup one, whose tree holds only the mise directory,
        // so take the union of every file the snapshots touched and the last tree.
        ...group.flatMap((r) => [...(r.nonMisePaths ?? [])]),
        ...git(["ls-tree", "-r", "--name-only", last.sha], { allowFail: true })
          .split("\n")
          .filter((p) => p && !p.startsWith(`${miseDir}/`)),
      ])
  const firstAtAll = Math.min(...group.map((r) => r.firstAt))
  const lastAtAll = Math.max(...group.map((r) => r.lastAt))
  let merge = matchMerge(
    mIndex,
    changedSet,
    firstAtAll,
    lastAtAll,
    mainFileFreq,
  )
  let mergeOk =
    merge != null &&
    merge.coverage >= 0.6 &&
    (merge.hit >= 3 || merge.rareHits >= 1)
  if (!mergeOk && changedSet.size && mainRefs.length) {
    const byBlob = matchMergeByBlob(
      changedSet,
      last.sha,
      mainFileFreq,
      mainRefs[0],
      firstAtAll,
    )
    if (byBlob && byBlob.coverage >= 0.5) {
      merge = byBlob
      mergeOk = true
    }
  }

  // LOC: prefer the run's own branch diff; fall back to the squash commit that landed it
  // (either the one matched by file set, or the one that carried .mise into main).
  const squashCarrier = squashCommits.length ? squashCommits[0].sha : null
  const locCommit = baseIsAncestor
    ? null
    : (squashCarrier ?? (mergeOk ? merge.sha : null))
  if (locCommit) {
    const ns = git(
      [
        "show",
        "--numstat",
        "--format=",
        locCommit,
        "--",
        ":/",
        `:(exclude)${miseDir}`,
      ],
      { allowFail: true },
    )
    for (const line of ns.split("\n").filter(Boolean)) {
      const parts = line.split("\t")
      const [a, d] = parts
      const p = parts[parts.length - 1]
      filesChanged++
      if (a === "-" || d === "-") {
        binaryFiles++
        continue
      }
      added += +a
      removed += +d
      if (!GENERATED.test(p)) {
        codeAdded += +a
        codeRemoved += +d
        codeFiles++
      }
    }
  }
  const locKnown = baseIsAncestor || !!locCommit
  const locSource = baseIsAncestor
    ? `diff ${base.slice(0, 9)}..${last.sha.slice(0, 9)} (branch history)`
    : squashCarrier
      ? `squash commit ${squashCarrier.slice(0, 9)} on main (carried the mise directory)`
      : mergeOk
        ? `main commit ${merge.sha.slice(0, 9)} (${merge.method ?? "file-set match"}, coverage ${merge.coverage})`
        : "unavailable: no branch history and no matching main commit"

  // --- merge status ---
  let ancestorOfMain = false
  for (const m of mainRefs)
    if (isAncestor(last.sha, m)) {
      ancestorOfMain = true
      break
    }
  const mainRef = mainRefs[0] ?? null
  const branchRefExists = group.some(
    (r) =>
      (r.ref.startsWith("refs/heads/") &&
        !r.ref.startsWith("refs/heads/backup/")) ||
      r.ref.startsWith("refs/remotes/"),
  )
  let status, statusBasis
  if (squashCommits.length) {
    status = "merged"
    statusBasis = `.mise carried into main by ${squashCommits.map((c) => c.sha.slice(0, 9)).join(",")}`
  } else if (ancestorOfMain) {
    status = "merged"
    statusBasis = "run tip is an ancestor of main"
  } else if (mergeOk) {
    status = "merged"
    statusBasis = `merged into main as ${merge.sha.slice(0, 9)} "${merge.subject.slice(0, 60)}" (${merge.method ?? "file-set match"}, coverage ${merge.coverage}${merge.precision == null ? "" : `, precision ${merge.precision}`})`
  } else if (branchRefExists) {
    status = "open"
    statusBasis = "branch ref still exists, no matching main commit"
  } else {
    status = "abandoned"
    statusBasis = "no live branch ref, no matching main commit"
  }

  // --- stage wall clock (author timestamps; stable across the rebases this repo uses) ---
  const routeStages =
    route === "full"
      ? ["goals", "mock", "requirements", "plan"]
      : route === "bugfix"
        ? ["goals", "plan"]
        : ["goals", "requirements", "plan"]
  const lastApproval = {}
  for (const t of transitions)
    if ((t.event === "approved" || t.event === "reapproved") && t.stage)
      lastApproval[t.stage] = t.at
  const stageHours = {}
  let cursor = first.at
  for (const stage of routeStages) {
    const end = lastApproval[stage]
    if (end == null) {
      stageHours[stage] = null
      continue
    }
    stageHours[stage] = hours(cursor, Math.max(end, cursor))
    cursor = Math.max(cursor, end)
  }
  const executeEnd = lastDoneAt ?? (run.cleanedUp ? last.at : null)
  stageHours.execute =
    executeEnd != null ? hours(cursor, Math.max(executeEnd, cursor)) : null
  const acceptStart = executeEnd ?? cursor
  stageHours.acceptance_closeout = run.cleanedUp
    ? hours(acceptStart, Math.max(last.at, acceptStart))
    : null

  const goalTitle =
    (goalsText?.split("\n").find((l) => l.startsWith("# ")) ?? "")
      .replace(/^#\s*/, "")
      .trim() || null
  const type =
    route === "bugfix"
      ? "bugfix"
      : route
        ? "feature"
        : branch && /^fix\//.test(branch)
          ? "bugfix"
          : branch && /^(feat|eric)\//.test(branch)
            ? "feature"
            : "other"
  const version = versionAt(timeline, first.at)
  const provVersion = versionAt(provTimeline, first.at)
  const lastTs = squashCommits.length
    ? Math.max(last.at, ...squashCommits.map((c) => Date.parse(c.ts) / 1000))
    : last.at

  const reviewSeg = group.find((r) => r.kind === "review")
  const stateTs = [...new Set(stateCommits.map((c) => c.at))].sort(
    (a, b) => a - b,
  )
  const stateSpanHours =
    stateTs.length > 1 ? hours(stateTs[0], stateTs[stateTs.length - 1]) : 0
  const timelineQuality =
    timelineSource === "branch-commits"
      ? "checkpoint-commits"
      : stateTs.length >= 4 && stateSpanHours >= 2
        ? "sampled-snapshots"
        : "single-sync-snapshot"
  const syncSessions = reviewSeg
    ? reviewSeg.commits.reduce(
        (n, c, i, arr) => (i === 0 || c.at - arr[i - 1].at > 1800 ? n + 1 : n),
        0,
      )
    : null
  return {
    runId: `${branch ?? shortRef(run.ref)}@${first.sha.slice(0, 9)}`,
    dedupeKey: key,
    branch,
    branchSource,
    branchCandidatesFromReviewRefs: [...recovered],
    refs: group.map((r) => r.ref),
    primaryRef: run.ref,
    timelineSource,
    timelineQuality,
    timelineQualityNote:
      timelineQuality === "checkpoint-commits"
        ? "each mise checkpoint is its own commit: stage boundaries are exact"
        : timelineQuality === "sampled-snapshots"
          ? "stage boundaries come from Delta Review syncs, so each is an upper bound on when the stage ended and the run span is a lower bound"
          : "the whole mise directory was snapshotted in one sync: timestamps carry no information about how long the run took",
    stateSnapshots: stateTs.length,
    stateSnapshotSpanHours: stateSpanHours,
    syncSessions,
    timelineSourceNote:
      timelineSource === "delta-review-snapshots"
        ? "branch ref deleted; timestamps are Delta Review sync commits, so stage boundaries are sampled, not exact"
        : timelineSource === "main-squash-commits-only"
          ? "only the squash commit survives; the run window is not the working window"
          : "mise checkpoint commits on the branch",
    reviewEvidence: reviewSeg
      ? {
          ref: reviewSeg.ref,
          snapshots: reviewSeg.commits.length,
          from: iso(reviewSeg.firstAt),
          to: iso(reviewSeg.lastAt),
          spanHours: hours(reviewSeg.firstAt, reviewSeg.lastAt),
        }
      : null,
    type,
    typeSource: route
      ? ".workflow-state route"
      : "branch-name prefix (no route recorded in state)",
    route,
    goalTitle,
    firstCommitTs: iso(first.at),
    lastCommitTs: iso(lastTs),
    firstCommitTsCommitter: iso(first.ct),
    lastCommitTsCommitter: iso(last.ct),
    elapsedHoursAuthorTime: hours(first.at, lastTs),
    elapsedHoursNote:
      "commit-timestamp span; active working time is not recoverable from git",
    endedWithCleanup: run.cleanedUp || miseDeletedInSnapshots === true,
    cleanupEvidence: run.cleanedUp
      ? "a commit removed the mise directory"
      : miseDeletedInSnapshots
        ? "the last Delta Review snapshot records goals.md as deleted"
        : "the mise directory is still present at the end of the surviving history",
    firstCommit: first.sha,
    lastCommit: last.sha,
    baseCommit: base,
    baseIsAncestorOfTip: baseIsAncestor,
    squashMergeCommits: squashCommits,
    transitions,
    stageHours,
    taskCount: taskFiles.size,
    tasksDone: doneFiles.size,
    firstTaskDoneTs: firstDoneAt ? iso(firstDoneAt) : null,
    lastTaskDoneTs: lastDoneAt ? iso(lastDoneAt) : null,
    gateRoundsFriction: friction ? friction.gates : null,
    gateRoundsCommitSubjects: criticRounds,
    gateRoundsSource: friction
      ? `${miseDir}/_friction.md + commit subjects`
      : "commit subjects only",
    fixLoops: {
      progressFixSections: progress ? progress.fixSections : null,
      frictionReviewFindings: friction
        ? friction.taskLines.filter((t) => t.kind === "review").length
        : null,
      frictionTaskLines: friction ? friction.taskLines.length : null,
      fixCommits: count(/^(fix:|Fix:|Task .*fix\b)/),
    },
    frictionTaskLines: friction ? friction.taskLines : null,
    frictionOtherLines: friction ? friction.otherLines : null,
    commits: {
      totalInWindow: windowSubjects.length,
      miseBookkeeping: count(/^mise:/),
      taskDoneCommits: count(/^mise: task \d/),
      taskCommits: count(/^Task \d/),
      docsCommits: count(/^[Dd]ocs[: ]/),
      commitsTouchingMiseDir: run.commits.length,
    },
    loc: locKnown
      ? {
          filesChanged,
          added,
          removed,
          binaryFiles,
          addedFiles: addedFiles.length,
          total: added + removed,
          codeAdded,
          codeRemoved,
          codeFiles,
          codeTotal: codeAdded + codeRemoved,
          ownCommitChurn: baseIsAncestor ? ownAdded + ownRemoved : null,
          source: locSource,
          note: "non-mise LOC added+removed; code* also excludes lockfiles and build output",
        }
      : {
          filesChanged: null,
          added: null,
          removed: null,
          binaryFiles: null,
          addedFiles: null,
          total: null,
          codeAdded: null,
          codeRemoved: null,
          codeFiles: null,
          codeTotal: null,
          ownCommitChurn: null,
          source: locSource,
          note: "run size is not recoverable: branch ref deleted and no main commit matches its file set",
        },
    mergeCommit: merge ? { ...merge, accepted: mergeOk } : null,
    artifactLines: {
      goals: artLines(`${miseDir}/goals.md`),
      requirements: artLines(`${miseDir}/requirements.md`),
      planOverview: artLines(`${miseDir}/implementation_plan/00_overview.md`),
      planTaskFiles: taskById.size,
      planTaskLines: taskLinesTotal,
      mocksHtml: artLines(`${miseDir}/mocks.html`),
      mocksContext: artLines(`${miseDir}/mocks.context.md`),
      friction: friction ? friction.lines : null,
      progress: progress ? progress.lines : null,
      progressChecklistAnswers: progress ? progress.checklistAnswers : null,
      exploration: artLines(
        `${miseDir}/implementation_plan/_exploration_notes.md`,
      ),
      retrospective: artLines(`${miseDir}/retrospective_notes.md`),
    },
    noteArtifacts,
    status,
    statusBasis,
    statusEvidence: {
      ancestorOfMain,
      branchRefExists,
      changedFiles: changedSet.size,
      mainRef,
    },
    miseVersion: version.version,
    miseVersionSource: version.source,
    miseVersionMajor: version.version ? version.version.split(".")[0] : null,
    miseVersionFromProvenanceMd: provVersion.version,
    miseVersionNote:
      "version published on the plugin repo main line at run start; the installed plugin may lag behind it",
    // A run with no usable timeline needs a wider candidate window: its git window can be
    // the few minutes of one Delta Review sync, while the work happened in the days before.
    transcriptDirs: transcriptDirs(
      branch,
      timelineQuality === "checkpoint-commits"
        ? first.at
        : first.at - 7 * 86400,
      merge && mergeOk ? Math.max(lastTs, merge.at) : lastTs,
    ),
    deltaReview: deltaReview(branch, reviewRefSet),
  }
}

main()
