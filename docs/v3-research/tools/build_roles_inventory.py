#!/usr/bin/env python3
"""Builds docs/v3-research/inventory/mise-roles.{jsonl,md}.

Rows are authored here as tuples with symbolic keys; ids (MR-NNN) are assigned in
emit order and dependsOn/overlapsWith keys resolved to ids. Also verifies the
coverage rule: every non-blank line of every assigned .md file is inside a row.
"""

import json
import os
import re
import sys
from collections import OrderedDict, defaultdict

REPO = "/Users/eric/Code/mise-claude-plugin"
OUT = os.path.join(REPO, "docs/v3-research/inventory")

FILES = {
    "CR": "skills/next/roles/critic.md",
    "RV": "skills/next/roles/reviewer.md",
    "AC": "skills/next/roles/acceptance.md",
    "DC": "skills/next/roles/documenter.md",
    "IM": "skills/next/roles/implementer.md",
    "RT": "skills/next/roles/retrospective.md",
    "CFG": "skills/next/references/config-reference.md",
    "SA": "docs/skill-authoring.md",
    "RM": "README.md",
    "CM": "CLAUDE.md",
    "MC": ".claude/mise-config.md",
    "CL": ".claude/mise-checklist.md",
    "ST": "skills/next/scripts/state.ts",
}

ROWS = []


def R(key, name, kind, fcode, lines, does, prevents, cost, costnote, enf, fires,
      dep=(), ov=()):
    ROWS.append(dict(key=key, name=name, kind=kind, fcode=fcode, lines=str(lines),
                     does=does, prevents=prevents, cost=list(cost), costnote=costnote,
                     enf=enf, fires=fires, dep=list(dep), ov=list(ov)))


# runtimeCost convention: a plain instruction inside a role file is "none" (it
# costs only the words in a context that is spawned anyway); "subagent-spawn"
# marks the row that causes the spawn, "tool-run" a row mandating a command,
# "loop-multiplier" a row that creates iteration, "driver-context" a file the
# orchestrator itself loads, "human-wait" a row that blocks on the user.

# ---------------------------------------------------------------- critic.md
R("cr.head", "Critic file heading", "glue", "CR", "1", "Names the role file", "unstated",
  ["none"], "", "prose", "role:critic")
R("cr.identity", "Fresh-context critic, never edits", "role", "CR", "3",
  "One subagent reviews one artifact and reports defects; never edits it",
  "the artifact's author rationalizing away its own defects (fresh-context, implied)",
  ["subagent-spawn", "loop-multiplier"],
  "1 spawn per artifact per critic round; requirements and plan each loop until no blockers",
  "prose", "role:critic", [], ["rv.identity", "ac.identity", "rt.propose-only"])
R("cr.read-inputs", "Read artifact, upstream, config", "rule", "CR", "3",
  "Read the named artifact, its upstream docs, the mise config and the kind", "unstated",
  ["none"], "", "prose", "role:critic", [],
  ["rv.read-inputs", "ac.read-inputs", "dc.read-inputs", "im.s1-config", "rt.read-inputs"])
R("cr.read-guides", "Read matching Skills and guides", "rule", "CR", "3",
  "Read Skills & guides entries whose conditions match the artifact's subject", "unstated",
  ["none"], "", "prose", "role:critic", ["cfg.k-skills"],
  ["rv.read-guides", "dc.s1-config", "im.s3-config-guides", "rt.src-guidance"])
R("cr.head-check", "What to check heading", "glue", "CR", "5", "Section heading", "unstated",
  ["none"], "", "prose", "role:critic")
R("cr.req-contradictions", "Requirements: find contradictions", "rule", "CR", "7",
  "Check requirements against goals and mocks for contradictions", "unstated", ["none"], "",
  "prose", "role:critic")
R("cr.req-coverage", "Requirements: unaddressed goals", "rule", "CR", "7",
  "Flag goals, logged tweaks or new concepts no requirement addresses", "unstated", ["none"],
  "", "prose", "role:critic", [], ["ac.every-req"])
R("cr.req-testable", "Requirements: untestable or missing", "rule", "CR", "7",
  "Flag untestable or missing requirements", "unstated", ["none"], "", "prose", "role:critic")
R("cr.req-scope-drift", "Requirements: scope drift", "rule", "CR", "7",
  "Flag scope drift from the goals", "unstated", ["none"], "", "prose", "role:critic")
R("cr.plan-basis", "Plan judged against requirements", "rule", "CR", "9",
  "Check the plan against requirements, or against goals on the bugfix route", "unstated",
  ["none"], "", "prose", "role:critic")
R("cr.plan-req-trace", "Plan: REQ traceability", "rule", "CR", "11",
  "Flag REQ-* IDs no task addresses, or addressed but untraced in the Task Index",
  "a requirement silently dropped between plan and execution", ["none"], "", "prose",
  "role:critic", [], ["ac.every-req"])
R("cr.plan-green", "Plan: tasks must end green", "rule", "CR", "12",
  "Flag tasks that cannot end green", "a task the implementer can never finish verified",
  ["none"], "", "prose", "role:critic", [], ["im.green-baseline"])
R("cr.plan-filerefs", "Plan: verify file references", "rule", "CR", "13",
  "Flag paths that do not exist, wrong file:line, or symbols absent from the named file",
  "a plan built on hallucinated code locations", ["tool-run"],
  "reads every file a task references", "prose", "role:critic")
R("cr.plan-e2e", "Plan: e2e covers user-facing behavior", "rule", "CR", "14",
  "Flag user-facing behavior no e2e test covers and no Test exception excuses",
  "shipping user-facing behavior verified only by unit tests", ["none"], "", "prose",
  "role:critic", ["cfg.k-testexc"], ["im.e2e-via-guide", "rv.tests"])
R("cr.plan-e2e-def", "Where plan e2e coverage lives", "rule", "CR", "14",
  "E2e coverage is the overview's End-of-plan gate section plus tasks' own e2e tests",
  "unstated", ["none"], "", "prose", "role:critic", ["cr.plan-e2e"])
R("cr.plan-e2e-nofinding", "Task silence is not a finding", "rule", "CR", "14",
  "Task files never name a pre-existing suite, so their silence about one is not a finding",
  "a critic false positive on every task file", ["none"], "", "prose", "role:critic",
  ["cr.plan-e2e-def"], ["im.never-preexisting-e2e"])
R("cr.plan-guides", "Plan: guides attached to tasks", "rule", "CR", "15",
  "Flag Skills & guides entries missing from a task their conditions match", "unstated",
  ["none"], "", "prose", "role:critic", ["cfg.k-skills"], ["im.s3-config-guides"])
R("cr.plan-cap", "Plan: five-source-file task cap", "gate", "CR", "16",
  "Any task over 5 source files without a Task Index justification is always blocking",
  "large diffs drawing review findings (skill-authoring cites 84% over 1,000 lines)",
  ["none"], "", "prose", "role:critic", [], ["rm.stage-plan", "sa.small-diffs"])
R("cr.head-report", "Reporting back heading", "glue", "CR", "18", "Section heading",
  "unstated", ["none"], "", "prose", "role:critic")
R("cr.report-tags", "Tag each defect by severity", "rule", "CR", "20",
  "Report defects as a list tagged blocking, minor or informative",
  "an orchestrator unable to tell which findings must gate", ["none"], "", "prose",
  "role:critic", [], ["rv.report-tagprose"])
R("cr.report-reverify", "Re-verify every blocker", "rule", "CR", "20",
  "Re-verify each blocker against the artifact's text before reporting it",
  "hallucinated blockers forcing needless revision rounds", ["loop-multiplier"],
  "a second read of the artifact per blocker", "prose", "role:critic")
R("cr.report-scope", "Only downstream-breaking defects", "rule", "CR", "20",
  "Report only defects a downstream stage would build wrong, plus the guardrail breach",
  "a reviewer asked for gaps inventing them (skill-authoring:34)", ["none"], "", "prose",
  "role:critic", [], ["rv.report-scope", "sa.reviewer-findings"])
R("cr.report-none", "Say no blocking findings explicitly", "rule", "CR", "20",
  "Say 'no blocking findings' explicitly when nothing blocks",
  "an ambiguous report read as a blocker", ["none"], "", "prose", "role:critic", [],
  ["rv.report-none", "rt.none-phrase", "dc.rep-nothing"])
R("cr.report-orchestrator", "Final message goes to orchestrator", "rule", "CR", "20",
  "Address the final message to an orchestrator, not the user", "unstated", ["none"], "",
  "prose", "role:critic", [],
  ["rv.report-orchestrator", "ac.orchestrator", "dc.orchestrator", "im.orchestrator",
   "rt.orchestrator"])

# -------------------------------------------------------------- reviewer.md
R("rv.head", "Reviewer file heading", "glue", "RV", "1", "Names the role file", "unstated",
  ["none"], "", "prose", "role:reviewer")
R("rv.identity", "Fresh-context reviewer, never fixes", "role", "RV", "3",
  "One subagent checks one task's committed work and reports defects, never fixing them",
  "the implementer reviewing its own work", ["subagent-spawn", "loop-multiplier"],
  "1 spawn per task, plus 1 per fix round", "prose", "role:reviewer", [],
  ["cr.identity", "ac.identity"])
R("rv.read-inputs", "Read task, commits, config, log", "rule", "RV", "3",
  "Read the task file, commit hashes, the mise config and the progress log", "unstated",
  ["none"], "", "prose", "role:reviewer", [], ["cr.read-inputs", "ac.read-inputs"])
R("rv.git-show", "Run git show per commit", "rule", "RV", "3",
  "Run git show for every commit hash in the dispatch", "unstated", ["tool-run"],
  "1 git show per commit under review", "prose", "role:reviewer", [], ["ac.inspect-commits"])
R("rv.read-checklist", "Read the config's checklist file", "rule", "RV", "3",
  "Read the file named by the config's Checklist: value", "unstated", ["none"], "", "prose",
  "role:reviewer", ["cfg.k-checklist"],
  ["im.s1-config", "dc.s1-config", "ac.read-inputs", "cl.instruction"])
R("rv.read-guides", "Read guides targeting this review", "rule", "RV", "3",
  "Read Skills & guides entries whose conditions target reviewing this kind of work",
  "unstated", ["none"], "", "prose", "role:reviewer", ["cfg.k-skills"], ["cr.read-guides"])
R("rv.head-check", "What to check heading", "glue", "RV", "5", "Section heading", "unstated",
  ["none"], "", "prose", "role:reviewer")
R("rv.taskspec", "Task-spec requirements the diff misses", "rule", "RV", "7",
  "Flag task-spec requirements the diff does not satisfy", "unstated", ["none"], "", "prose",
  "role:reviewer", [], ["im.s5-selfreview", "cl.r4"])
R("rv.guides", "Guides the work does not follow", "rule", "RV", "8",
  "Flag the task's Guides entries the work does not follow", "unstated", ["none"], "",
  "prose", "role:reviewer", [], ["im.s3-conventions", "cr.plan-guides"])
R("rv.correctness", "Bugs, security holes, debug code", "rule", "RV", "9",
  "Flag correctness bugs, security holes and leftover debug code", "unstated", ["none"], "",
  "prose", "role:reviewer", [], ["im.s5-selfreview", "cl.r1"])
R("rv.tests", "Missing test coverage", "rule", "RV", "10",
  "Flag missing test coverage no Test exception cited in the task file excuses", "unstated",
  ["none"], "", "prose", "role:reviewer", ["cfg.k-testexc"],
  ["cl.r2", "cl.r5", "cr.plan-e2e", "ac.substitute"])
R("rv.prose", "Two-pass: review documenter's prose", "rule", "RV", "11",
  "In two-pass mode review the documenter's comments, docstrings and markdown docs",
  "unstated", ["none"], "", "prose", "role:reviewer", ["dc.identity"],
  ["ac.docs-prose", "cl.r6", "dc.s5-prose-rules"])
R("rv.copy", "User-facing copy vs goals and mocks", "rule", "RV", "12",
  "Flag user-facing copy that departs from the approved goals and mocks", "unstated",
  ["none"], "", "prose", "role:reviewer", [], ["im.copy"])
R("rv.cl-merge", "Merge checklist answers across commits", "rule", "RV", "13",
  "Merge Checklist answers across the commits; any commit's pass counts as pass", "unstated",
  ["none"], "", "prose", "role:reviewer", ["im.s7-commit", "dc.s7-answers"])
R("rv.cl-confirm", "Confirm each pass against the diff", "gate", "RV", "13",
  "Confirm every checklist rule answered pass against the diff",
  "a self-answered checklist passing rules the diff fails", ["none"], "", "prose",
  "role:reviewer", ["rv.cl-merge"], ["im.s5-checklist", "sa.checklist-evidence"])
R("rv.cl-answer-na", "Answer n-a rules yourself", "gate", "RV", "13",
  "Answer for yourself every rule left n-a or whose evidence the diff cannot confirm",
  "a missed rule hiding behind an n-a answer (stated)", ["none"], "", "prose",
  "role:reviewer", ["rv.cl-merge"], ["ac.task-checklist"])
R("rv.cl-wrong", "Wrong answer is a defect", "rule", "RV", "13",
  "Report a wrong checklist answer as a defect naming its rule number", "unstated", ["none"],
  "", "prose", "role:reviewer", ["rv.cl-confirm"])
R("rv.cl-missing", "Missing Checklist line is a defect", "rule", "RV", "14",
  "Flag commits with no Checklist: line", "unstated", ["none"], "", "prose", "role:reviewer",
  [], ["ac.task-checklist"])
R("rv.head-report", "Reporting back heading", "glue", "RV", "16", "Section heading",
  "unstated", ["none"], "", "prose", "role:reviewer")
R("rv.report-scope", "Only correctness, spec, guide, checklist", "rule", "RV", "18",
  "Report only correctness, task-spec, guide and checklist failures; ignore cosmetic nits",
  "a reviewer manufacturing findings on sound work (skill-authoring:34)", ["none"], "",
  "prose", "role:reviewer", [], ["cr.report-scope", "sa.reviewer-findings"])
R("rv.report-tagprose", "Tag defects prose or not-prose", "rule", "RV", "18",
  "Tag each defect prose or not-prose so the orchestrator routes it to the right fixer",
  "a prose defect sent to the code fixer, or the reverse", ["none"], "", "prose",
  "role:reviewer", ["dc.param-defects"], ["cr.report-tags"])
R("rv.report-none", "Exactly 'none' when clean", "rule", "RV", "18",
  "Return exactly `none` when there is nothing to report", "unstated", ["none"], "", "prose",
  "role:reviewer", [], ["cr.report-none", "dc.rep-nothing", "rt.none-phrase"])
R("rv.report-orchestrator", "Final message goes to orchestrator", "rule", "RV", "18",
  "Address the final message to an orchestrator", "unstated", ["none"], "", "prose",
  "role:reviewer", [], ["cr.report-orchestrator"])

# ------------------------------------------------------------ acceptance.md
R("ac.head", "Acceptance file heading", "glue", "AC", "1", "Names the role file", "unstated",
  ["none"], "", "prose", "role:acceptance")
R("ac.identity", "Fresh-context acceptance, fixes nothing", "role", "AC", "3",
  "One subagent verifies the finished branch against its requirements and returns verdicts",
  "shipping a branch nobody checked against the approved requirements",
  ["subagent-spawn", "human-wait"],
  "1 spawn per acceptance round; its verdicts then block on the user", "prose",
  "role:acceptance", [], ["cr.identity", "rv.identity"])
R("ac.read-inputs", "Read requirements, overview, log, config", "rule", "AC", "3",
  "Read requirements (goals on bugfix), plan overview, progress log, config, gate results",
  "unstated", ["none"], "", "prose", "role:acceptance", [],
  ["cr.read-inputs", "rv.read-inputs", "rv.read-checklist"])
R("ac.inspect-commits", "Inspect branch commits", "rule", "AC", "3",
  "Inspect the branch's commits with git log and git show", "unstated", ["tool-run"],
  "git log plus git show over the whole branch", "prose", "role:acceptance", [],
  ["rv.git-show", "rt.src-commits"])
R("ac.head-check", "What to check heading", "glue", "AC", "5", "Section heading", "unstated",
  ["none"], "", "prose", "role:acceptance")
R("ac.every-req", "A verdict per requirement", "gate", "AC", "7",
  "Give every requirement, or goal on the bugfix route, a verdict",
  "a requirement quietly unbuilt at ship time", ["none"], "", "prose", "role:acceptance", [],
  ["cr.req-coverage", "cr.plan-req-trace"])
R("ac.gate-stands", "Never re-run e2e or sanity", "rule", "AC", "8",
  "Take the end-of-plan gate's results as given; never re-run the e2e and sanity suites",
  "paying for a second full e2e run at acceptance", ["none"],
  "explicitly avoids a duplicate suite run", "prose", "role:acceptance", [],
  ["im.never-preexisting-e2e", "rm.gate"])
R("ac.substitute", "Run substitute verification sparingly", "rule", "AC", "8",
  "Run a Test exception's substitute verification only where a requirement allows no other check",
  "unstated", ["tool-run"], "0..n substitute verifications", "prose", "role:acceptance",
  ["cfg.k-testexc"], ["im.substitute", "rv.tests"])
R("ac.task-commits", "Find each done task's commits", "rule", "AC", "9",
  "Run git log --grep '^Task <ID>:' over default..HEAD for every Task Index entry",
  "a task marked done whose commits are not on this branch", ["tool-run"],
  "1 git log per done task", "prose", "role:acceptance", ["st.donetasks"])
R("ac.task-checklist", "Task without Checklist line fails", "gate", "AC", "9",
  "A done task with no Checklist: line in any commit becomes a not-verified item",
  "a task shipped without its self-review answers", ["none"], "", "prose", "role:acceptance",
  ["ac.task-commits"], ["rv.cl-missing", "rv.cl-answer-na"])
R("ac.docs-prose", "Prose rules over Docs commits", "gate", "AC", "10",
  "Answer the checklist's Prose rules against the branch's Docs: commits; each fail is not-verified",
  "documenter prose nobody checked end to end", ["tool-run"],
  "1 git log --grep '^Docs:' plus a read of each", "prose", "role:acceptance",
  ["dc.s7-commit"], ["rv.prose", "cl.r6"])
R("ac.head-report", "Reporting back heading", "glue", "AC", "12", "Section heading",
  "unstated", ["none"], "", "prose", "role:acceptance")
R("ac.template", "Verdict report template", "artifact", "AC", "14-23",
  "Fenced template: one line per requirement, task, prose rule, then a Notes section",
  "unstated", ["none"], "", "prose", "role:acceptance")
R("ac.verdicts-two", "Only verified or not verified", "rule", "AC", "25",
  "verified and not verified are the only verdicts", "a hedged verdict the user cannot act on",
  ["none"], "", "prose", "role:acceptance", ["ac.template"])
R("ac.notes", "Notes holds the unverifiable", "rule", "AC", "25",
  "Put what is neither verdict in Notes: an over-15-rule checklist, anything unverifiable",
  "unstated", ["none"], "", "prose", "role:acceptance", ["ac.verdicts-two"],
  ["cfg.checklist-cap"])
R("ac.orchestrator", "Orchestrator relays, user confirms", "human-stop", "AC", "25",
  "Final message goes to an orchestrator; the user confirms the verdicts or flags items",
  "unstated", ["human-wait"], "blocks the run until the user answers", "prose",
  "role:acceptance", [], ["cr.report-orchestrator", "rm.acceptance"])

# ------------------------------------------------------------ documenter.md
R("dc.head", "Documenter file heading", "glue", "DC", "1", "Names the role file", "unstated",
  ["none"], "", "prose", "role:documenter")
R("dc.identity", "Fresh-context documenter writes prose", "role", "DC", "3",
  "One subagent writes comments, docstrings and markdown docs for one set of commits",
  "unstated", ["subagent-spawn"],
  "1 extra spawn per task and per later code-changing commit, only in two-pass mode",
  "prose", "role:documenter", ["cfg.models-documenter"], ["im.mode-two-code-only"])
R("dc.no-behavior", "Never change code behavior", "rule", "DC", "3",
  "Never change code behavior", "a documentation pass silently altering the shipped code",
  ["none"], "", "prose", "role:documenter")
R("dc.no-copy", "Never touch user-facing copy", "rule", "DC", "3",
  "Never touch user-facing copy", "copy drifting from the approved goals and mocks",
  ["none"], "", "prose", "role:documenter", [], ["im.copy", "rv.copy"])
R("dc.read-inputs", "Read progress log and config", "rule", "DC", "3",
  "Read the progress log and the mise config named in the dispatch", "unstated", ["none"],
  "", "prose", "role:documenter", [], ["cr.read-inputs", "im.s2-read"])
R("dc.param-task", "Task dispatch fixes the log heading", "rule", "DC", "5",
  "A Task file: dispatch fixes the progress-log heading `## Docs <ID> — <one line>`",
  "unstated", ["none"], "", "prose", "role:documenter", [], ["im.shape-task"])
R("dc.param-fixscope", "Fix-scope dispatch heading", "rule", "DC", "5",
  "A Fix scope: dispatch covers gate repairs or acceptance fixes; heading `## Docs — <one line>`",
  "unstated", ["none"], "", "prose", "role:documenter", [], ["im.shape-fix"])
R("dc.param-commits", "Commits parameter", "rule", "DC", "6",
  "The Commits: line names the commits whose changes need prose", "unstated", ["none"], "",
  "prose", "role:documenter")
R("dc.param-defects", "Defects parameter on correction round", "rule", "DC", "7",
  "On a correction round Defects: carries the prose defects to fix", "unstated",
  ["loop-multiplier"], "one extra documenter spawn per prose-defect round", "prose",
  "role:documenter", ["rv.report-tagprose"])
R("dc.head-steps", "Steps heading", "glue", "DC", "9", "Section heading", "unstated",
  ["none"], "", "prose", "role:documenter")
R("dc.s1-config", "Read config commands and guides", "rule", "DC", "11",
  "Read Format, Check, the Checklist: file and Skills & guides entries matching comments or docs",
  "unstated", ["none"], "", "prose", "role:documenter", ["cfg.k-quality"],
  ["im.s1-config", "rv.read-checklist", "cr.read-guides"])
R("dc.s1-required", "Required guides are mandatory", "rule", "DC", "11",
  "Follow matching guides; required ones mandatorily", "a required guide treated as optional",
  ["none"], "", "prose", "role:documenter", ["cfg.skills-required"], ["im.s3-config-guides"])
R("dc.s2-scope", "Scope is the named commits' diff", "rule", "DC", "12",
  "Resolve scope to the diff of each commit in Commits: (git show) plus the defects", "unstated",
  ["tool-run"], "1 git show per commit", "prose", "role:documenter", ["dc.param-commits"],
  ["rv.git-show"])
R("dc.s2-never-wider", "Never widen scope", "rule", "DC", "12", "Never document beyond that scope",
  "a prose pass sprawling across untouched files", ["none"], "", "prose", "role:documenter",
  [], ["im.dn-scope", "cl.r4"])
R("dc.s3-read", "Read task, defects, progress log", "rule", "DC", "13",
  "Read the task file or scope line, the defects list, and the progress log", "unstated",
  ["none"], "", "prose", "role:documenter", [], ["im.s2-read"])
R("dc.s3-docs-list", "Task lists the docs it requires", "rule", "DC", "13",
  "Task Files to modify/create entries name the markdown docs the task requires", "unstated",
  ["none"], "", "prose", "role:documenter")
R("dc.s4-order", "Defects first, then file by file", "rule", "DC", "14",
  "Work file by file through the diff, fixing listed defects before anything else", "unstated",
  ["none"], "", "prose", "role:documenter", ["dc.param-defects"])
R("dc.s4-comments", "Write and refresh comments", "rule", "DC", "14",
  "Add and update comments and docstrings for changed code; fix comments the change made stale",
  "stale comments surviving a change", ["none"], "", "prose", "role:documenter", [],
  ["cl.r6", "rv.prose"])
R("dc.s4-stubs", "Fill Check stubs, write the docs", "rule", "DC", "14",
  "Fill the doc-comment stubs Check demanded and write or update the required markdown docs",
  "unstated", ["none"], "", "prose", "role:documenter", ["im.stub"])
R("dc.s5-checklist", "Answer checklist against own diff", "gate", "DC", "15",
  "Answer the config's Checklist: file against the staged and unstaged diff before committing",
  "unstated", ["none"], "", "prose", "role:documenter", ["cfg.k-checklist"],
  ["im.s5-checklist", "cl.instruction"])
R("dc.s5-prose-rules", "Every Prose rule pass or n-a", "gate", "DC", "15",
  "Resolve every ## Prose rule to pass or n-a before committing", "unstated", ["none"], "",
  "prose", "role:documenter", ["dc.s5-checklist"], ["rv.prose", "ac.docs-prose"])
R("dc.s5-code-na", "Code rules answered prose only", "rule", "DC", "15",
  "Answer every ## Code rule `n-a — prose only`", "unstated", ["none"], "", "prose",
  "role:documenter", ["dc.s5-checklist"], ["im.s5-twopass-na"])
R("dc.s6-verify", "Run Format then Check, no tests", "rule", "DC", "16",
  "Run the config's Format, then Check; never tests", "a docs pass paying for a test run",
  ["tool-run"], "2 command runs per documenter pass", "prose", "role:documenter",
  ["cfg.k-quality"], ["im.s4-order"])
R("dc.s6-retry", "Fix and re-run on failure", "loop", "DC", "16",
  "On a failure, fix and re-run the command", "unstated", ["loop-multiplier"],
  "up to 3 attempts per command", "prose", "role:documenter", ["dc.s6-verify"],
  ["im.bounded-retries"])
R("dc.s6-stuck", "Three failures with no hypothesis stops", "gate", "DC", "16",
  "After 3 consecutive failures with no new hypothesis, stop and report stuck",
  "an unbounded retry loop", ["none"], "caps the loop at 3", "prose", "role:documenter",
  ["dc.s6-retry"], ["im.bounded-retries", "sa.bounded-retries"])
R("dc.s7-commit", "Commit prose with the log entry", "rule", "DC", "17",
  "Commit the prose and the progress-log entry together with a `Docs:` subject",
  "a checkpoint that cannot be resumed from a single commit", ["tool-run"],
  "1 commit per documenter pass", "prose", "role:documenter", [],
  ["im.s7-commit", "ac.docs-prose", "sa.durable-state"])
R("dc.s7-answers", "Checklist answers in the body", "rule", "DC", "17",
  "Put the checklist answers in the commit body", "unstated", ["none"], "", "prose",
  "role:documenter", ["dc.s5-checklist"], ["im.s7-commit", "rv.cl-merge"])
R("dc.tpl-log", "Progress-log entry template", "artifact", "DC", "19-21",
  "Fenced template: a single `- Key changes:` line", "unstated", ["none"], "", "prose",
  "role:documenter", [], ["im.tpl-log"])
R("dc.tpl-commit", "Docs commit message template", "artifact", "DC", "23-29",
  "Fenced template: Docs: subject, report body, Checklist: answers line", "unstated",
  ["none"], "", "prose", "role:documenter", [], ["im.tpl-commit"])
R("dc.head-report", "Reporting back heading", "glue", "DC", "31", "Section heading",
  "unstated", ["none"], "", "prose", "role:documenter")
R("dc.rep-success", "Success report format", "rule", "DC", "33",
  "Report 'Docs pass committed. Commit: <hash>.' plus 1-2 lines", "unstated", ["none"], "",
  "prose", "role:documenter", [], ["im.rep-success"])
R("dc.rep-nothing", "Nothing-to-document report", "rule", "DC", "34",
  "Report 'Docs pass: nothing to document.' and commit nothing", "unstated", ["none"], "",
  "prose", "role:documenter", [], ["cr.report-none", "rv.report-none"])
R("dc.rep-fail", "Stuck and blocked report formats", "rule", "DC", "35",
  "Report stuck or blocked, describing everything tried", "unstated", ["none"], "", "prose",
  "role:documenter", ["dc.s6-stuck"], ["im.rep-stuck", "im.rep-blocked"])
R("dc.orchestrator", "Final message goes to orchestrator", "rule", "DC", "37",
  "Address the final message to an orchestrator", "unstated", ["none"], "", "prose",
  "role:documenter", [], ["cr.report-orchestrator"])

# ----------------------------------------------------------- implementer.md
R("im.head", "Implementer file heading", "glue", "IM", "1", "Names the role file", "unstated",
  ["none"], "", "prose", "role:implementer")
R("im.identity", "Fresh-context implementer commits its task", "role", "IM", "3",
  "One subagent implements one task or fix and commits it", "unstated", ["subagent-spawn"],
  "1 spawn per task, plus 1 per defect-fix round", "prose", "role:implementer", [],
  ["sa.fresh-context"])
R("im.read-inputs", "Dispatch names config and log", "rule", "IM", "3",
  "The dispatch names the mise config, the progress log and any previous failure report",
  "unstated", ["none"], "", "prose", "role:implementer", [], ["cr.read-inputs", "dc.read-inputs"])
R("im.no-repeat", "Never repeat what already failed", "rule", "IM", "3",
  "Never repeat an approach the previous attempt's failure report names",
  "a retry loop re-running the same failing approach", ["none"], "", "prose",
  "role:implementer", [], ["im.bounded-retries"])
R("im.shapes", "Three dispatch shapes", "glue", "IM", "3",
  "The dispatch takes one of three shapes, each fixing subject and log heading", "unstated",
  ["none"], "", "prose", "role:implementer")
R("im.shape-task", "Task shape", "rule", "IM", "5",
  "Task file, no defects: build it; commit `Task <ID>:`; entry `## <task ID>`", "unstated",
  ["none"], "", "prose", "role:implementer", ["im.shapes"], ["dc.param-task"])
R("im.shape-taskfix", "Task-fix shape", "rule", "IM", "6",
  "Task file with Defects: fix them; commit `Task <ID>:`; entry `## <task ID> fix`",
  "unstated", ["loop-multiplier"], "one extra implementer spawn per review round", "prose",
  "role:implementer", ["im.shapes"], ["rv.report-tagprose"])
R("im.shape-fix", "Fix-scope shape", "rule", "IM", "7",
  "Fix scope: with Defects and no task file; commit `Fix:`; entry `## Fix`", "unstated",
  ["none"], "", "prose", "role:implementer", ["im.shapes"], ["dc.param-fixscope"])
R("im.green-baseline", "Plan started green, failures are yours", "rule", "IM", "9",
  "Treat every failure hit as this plan's and yours to fix",
  "an implementer excusing a red suite as pre-existing", ["loop-multiplier"],
  "forbids the cheap exit, so failures are fixed inside the task", "prose",
  "role:implementer", [], ["cr.plan-green", "im.dn-skip"])
R("im.no-preexisting", "Never commit over a failure", "rule", "IM", "9",
  "Never call a failure pre-existing and never commit over it", "unstated", ["none"], "",
  "prose", "role:implementer", ["im.green-baseline"], ["im.dn-skip"])
R("im.head-steps", "Steps heading", "glue", "IM", "11", "Section heading", "unstated",
  ["none"], "", "prose", "role:implementer")
R("im.s1-config", "Read config commands, checklist, guides, models", "rule", "IM", "13",
  "Read Format, Check, Unit tests, Task tests, the Checklist: file, Skills & guides and ## Models",
  "unstated", ["none"], "", "prose", "role:implementer", ["cfg.k-quality"],
  ["dc.s1-config", "rv.read-checklist"])
R("im.s1-twopass", "Documenter line means two-pass", "rule", "IM", "13",
  "A documenter line under ## Models switches the run into two-pass mode", "unstated",
  ["none"], "", "prose", "role:implementer", ["cfg.models-documenter"],
  ["rm.exec-twopass", "dc.identity"])
R("im.s2-read", "Read task, defects, log, named files", "rule", "IM", "14",
  "Read the task file or scope line, the defects, the progress log and every file they name",
  "unstated", ["driver-context"], "loads the task file and each named source file", "prose",
  "role:implementer", [], ["dc.s3-read"])
R("im.s2-log-overrides", "Progress log overrides task Background", "rule", "IM", "14",
  "The progress log, not the task's Background, is authoritative on what prior tasks produced",
  "building on a stale Background written before earlier tasks ran", ["none"], "", "prose",
  "role:implementer", ["im.s6-log"])
R("im.s3-conventions", "Follow task conventions and Guides", "rule", "IM", "15",
  "Implement following the task's conventions and its Guides entries", "unstated", ["none"],
  "", "prose", "role:implementer", [], ["rv.guides"])
R("im.s3-config-guides", "Apply matching config guides anyway", "rule", "IM", "15",
  "Apply any config Skills & guides entry matching the work even if the task missed it; required are mandatory",
  "a required guide skipped because the planner forgot to attach it", ["none"], "", "prose",
  "role:implementer", ["cfg.skills-required"], ["cr.plan-guides", "dc.s1-required"])
R("im.s3-typehints", "Complete type hints on public functions", "rule", "IM", "15",
  "Give public functions complete type hints where the language has them", "unstated",
  ["none"], "", "prose", "role:implementer")
R("im.s3-no-abstractions", "No abstractions beyond the task", "rule", "IM", "15",
  "Add no abstractions beyond what the task requires", "speculative generality", ["none"],
  "", "prose", "role:implementer")
R("im.s3-no-req", "Never write REQ IDs into code", "rule", "IM", "15",
  "Never write a REQ-* ID into code, comments, identifiers, test names or strings",
  "workflow artifact IDs leaking into shipped code", ["none"], "", "prose",
  "role:implementer", [], ["cl.r3", "im.s5-selfreview"])
R("im.mode-single", "Single-pass prose rule", "rule", "IM", "16",
  "In single-pass mode write prose as usual, no comments beyond what the task requires",
  "unstated", ["none"], "", "prose", "role:implementer", ["im.s1-twopass"])
R("im.mode-two-code-only", "Two-pass: code only", "rule", "IM", "17",
  "In two-pass mode write code only: no comments, docstrings or markdown docs", "unstated",
  ["none"], "", "prose", "role:implementer", ["im.s1-twopass"], ["dc.identity"])
R("im.mode-two-log", "Progress-log entry stays the implementer's", "rule", "IM", "17",
  "The implementer still writes its own progress-log entry in two-pass mode", "unstated",
  ["none"], "", "prose", "role:implementer", ["im.mode-two-code-only"])
R("im.mode-two-directive", "Directive comments count as code", "rule", "IM", "17",
  "Lint directives, pragmas and license headers are code, not prose",
  "an implementer omitting a lint directive it needs", ["none"], "", "prose",
  "role:implementer", ["im.mode-two-code-only"])
R("im.stub", "Stub the doc comments Check demands", "rule", "IM", "18",
  "Where Check demands a doc comment, write the minimal stub and leave content to the documenter",
  "a two-pass implementer unable to make Check green", ["none"], "", "prose",
  "role:implementer", ["im.mode-two-code-only"], ["dc.s4-stubs"])
R("im.copy", "Copy comes from goals and mocks", "rule", "IM", "19",
  "User-facing copy comes from the approved goals and mocks in both modes",
  "copy invented at implementation time", ["none"], "", "prose", "role:implementer", [],
  ["rv.copy", "dc.no-copy"])
R("im.commit-msg-yours", "Commit message is the implementer's", "rule", "IM", "19",
  "The commit message stays the implementer's own in both modes", "unstated", ["none"], "",
  "prose", "role:implementer")
R("im.s4-order", "Verify: Format, Check, then tests", "gate", "IM", "20",
  "Run Format, then Check, then tests, in that order", "unstated", ["tool-run"],
  "3+ command runs per task attempt", "prose", "role:implementer", ["cfg.k-quality"],
  ["dc.s6-verify", "rm.stage-execute"])
R("im.tasktests", "Task tests slot replaces Unit tests", "rule", "IM", "21",
  "Run Task tests with <path> replaced by the tests changed, or the touched directories, in one invocation",
  "a full unit suite run per task", ["tool-run"], "1 scoped test invocation instead of the full suite",
  "prose", "role:implementer", ["cfg.k-tasktests"], ["rm.stage-execute"])
R("im.tasktests-fallback", "Fall back to Unit tests", "rule", "IM", "21",
  "With no Task tests slot, or nothing testable touched, run Unit tests", "unstated",
  ["tool-run"], "full unit suite when the slot is absent", "prose", "role:implementer",
  ["im.tasktests"])
R("im.task-written-tests", "Run the tests the task writes", "rule", "IM", "22",
  "Also run the tests the task itself writes, including the bugfix regression test", "unstated",
  ["tool-run"], "", "prose", "role:implementer", [], ["cl.r5"])
R("im.e2e-via-guide", "Run task e2e through its guide", "rule", "IM", "23",
  "Run a task-written e2e test through the Skills & guides entry covering e2e runs, honoring required",
  "an e2e runner bypassed", ["tool-run"], "1 e2e run per task that writes one", "prose",
  "role:implementer", ["cfg.skills-required"], ["cr.plan-e2e"])
R("im.substitute", "Run cited Test exception verification", "rule", "IM", "24",
  "Run any substitute verification a cited Test exception names and keep its evidence",
  "unstated", ["tool-run"], "", "prose", "role:implementer", ["cfg.k-testexc"],
  ["ac.substitute", "rv.tests"])
R("im.never-preexisting-e2e", "Never run pre-existing e2e suites", "rule", "IM", "25",
  "Never run a pre-existing e2e or sanity suite", "N task-length e2e runs instead of one gate run",
  ["none"], "removes a full suite run from every task", "prose", "role:implementer", [],
  ["ac.gate-stands", "rm.gate", "cr.plan-e2e-nofinding"])
R("im.list-order", "List slots re-run from the start", "rule", "IM", "26",
  "A slot holding a list runs in order and is re-run from the start after each fix",
  "a partial re-run masking an earlier command's failure", ["loop-multiplier"],
  "re-runs the whole list per fix", "prose", "role:implementer", ["cfg.slot-list"])
R("im.bounded-retries", "Three failures with no hypothesis stops", "gate", "IM", "27",
  "Fix and re-run until green; after 3 consecutive failures with no new hypothesis report stuck",
  "an unbounded retry loop", ["loop-multiplier"], "caps at 3 attempts per command", "prose",
  "role:implementer", [], ["dc.s6-stuck", "sa.bounded-retries"])
R("im.verif-checklist", "Walk the task's verification checklist", "gate", "IM", "29",
  "Walk the task's verification checklist and confirm every item", "unstated", ["none"], "",
  "prose", "role:implementer")
R("im.s5-selfreview", "Self-review the diff", "gate", "IM", "31",
  "Review the staged and unstaged diff for missed requirements, bugs, security holes, dead code, debug statements, REQ-*",
  "defects reaching the reviewer that the author could have caught", ["none"], "", "prose",
  "role:implementer", [], ["rv.correctness", "rv.taskspec", "cl.r1", "cl.r3"])
R("im.s5-checklist", "Answer every checklist rule", "gate", "IM", "31",
  "Answer every rule of the config's Checklist: file against the diff",
  "recurring defect classes (skill-authoring:35)", ["none"], "", "prose", "role:implementer",
  ["cfg.k-checklist"], ["dc.s5-checklist", "rv.cl-confirm", "cl.instruction"])
R("im.s5-twopass-na", "Prose rules n-a in two-pass", "rule", "IM", "31",
  "In two-pass mode answer ## Prose rules `n-a — documenter`", "unstated", ["none"], "",
  "prose", "role:implementer", ["im.s1-twopass"], ["dc.s5-code-na"])
R("im.s5-fix-rerun", "Fix findings and re-verify", "loop", "IM", "31",
  "Fix what the self-review finds and re-run the whole verification step", "unstated",
  ["loop-multiplier"], "re-runs Format/Check/tests per self-review fix", "prose",
  "role:implementer", ["im.s4-order"])
R("im.s6-log", "Append to the progress log", "artifact", "IM", "32",
  "Append an entry under the dispatch's heading, creating the log with a # Progress heading",
  "a later task blind to what earlier tasks produced", ["none"], "", "prose",
  "role:implementer", [], ["dc.s7-commit", "sa.durable-state"])
R("im.tpl-log", "Progress-log entry template", "artifact", "IM", "34-37",
  "Fenced template: Key changes and Deviations from plan lines", "unstated", ["none"], "",
  "prose", "role:implementer", ["im.s6-log"], ["dc.tpl-log", "rt.src-logs"])
R("im.log-oneline", "One line each in the log", "rule", "IM", "39",
  "Keep each log line to one line; anything longer belongs in the commit body",
  "a progress log too long for later readers' context", ["none"], "", "prose",
  "role:implementer", ["im.tpl-log"], ["sa.orchestrator-summaries"])
R("im.s7-commit", "Commit work and log together", "rule", "IM", "41",
  "Commit the work and the log entry together, with the dispatch's subject prefix and checklist answers in the body",
  "a checkpoint that does not resume cleanly", ["tool-run"], "1 commit per task attempt",
  "prose", "role:implementer", ["im.s5-checklist"],
  ["dc.s7-commit", "rv.cl-merge", "sa.durable-state"])
R("im.tpl-commit", "Task commit message template", "artifact", "IM", "43-49",
  "Fenced template: Task <ID> subject, report body, Checklist: answers line", "unstated",
  ["none"], "", "prose", "role:implementer", ["im.s7-commit"], ["dc.tpl-commit"])
R("im.answers-once", "Every rule number appears once", "rule", "IM", "51",
  "Every checklist rule number appears exactly once in the answers line",
  "a silently skipped rule", ["none"], "", "prose", "role:implementer", ["im.s7-commit"],
  ["rv.cl-answer-na"])
R("im.answers-values", "Only pass and n-a are allowed", "rule", "IM", "51",
  "The only answer values in a commit are pass and n-a", "committing with a known fail",
  ["none"], "", "prose", "role:implementer", ["im.s7-commit"], ["cl.instruction"])
R("im.head-report", "Reporting back heading", "glue", "IM", "53", "Section heading",
  "unstated", ["none"], "", "prose", "role:implementer")
R("im.rep-success", "Success report format", "rule", "IM", "55",
  "Report completion with the commit hash plus 2-3 lines on what was built", "unstated",
  ["none"], "", "prose", "role:implementer", [], ["dc.rep-success"])
R("im.rep-stuck", "Stuck report", "rule", "IM", "56",
  "Report 'Task failed (stuck)' on the bounded-retries exit", "unstated", ["none"], "",
  "prose", "role:implementer", ["im.bounded-retries"], ["dc.rep-fail"])
R("im.rep-blocked", "Blocked report", "rule", "IM", "57",
  "Report 'Task failed (blocked)' for a hard blocker no retry fixes", "unstated", ["none"],
  "", "prose", "role:implementer", [], ["dc.rep-fail"])
R("im.rep-fail-detail", "Failures describe everything tried", "rule", "IM", "59",
  "Either failure describes what went wrong and everything tried",
  "the next attempt repeating the same approach", ["none"], "", "prose", "role:implementer",
  ["im.no-repeat"])
R("im.orchestrator", "Report facts, not narrative", "rule", "IM", "61",
  "Final message goes to an orchestrator: facts, summarized results, never pasted output",
  "blowing the orchestrator's context with command output", ["none"], "", "prose",
  "role:implementer", [], ["cr.report-orchestrator", "sa.orchestrator-summaries"])
R("im.head-donot", "Do not heading", "glue", "IM", "63", "Section heading", "unstated",
  ["none"], "", "prose", "role:implementer")
R("im.dn-scope", "Do not change out-of-scope files", "rule", "IM", "65",
  "Never change files outside the task's scope, the progress log excepted", "unstated",
  ["none"], "sanctioned redundancy (skill-authoring:27)", "prose", "role:implementer", [],
  ["cl.r4", "dc.s2-never-wider"])
R("im.dn-skip", "Never skip verification, never commit red", "rule", "IM", "66",
  "Never skip a verification step or commit while anything is red", "unstated", ["none"],
  "sanctioned redundancy (skill-authoring:27)", "prose", "role:implementer",
  ["im.s4-order"], ["im.green-baseline", "im.no-preexisting"])
R("im.dn-architecture", "Do not contradict the task's architecture", "rule", "IM", "67",
  "Never contradict the task file's architecture; report blocked instead", "unstated",
  ["none"], "", "prose", "role:implementer", ["im.rep-blocked"])

# --------------------------------------------------------- retrospective.md
R("rt.head", "Retrospective file heading", "glue", "RT", "1", "Names the role file",
  "unstated", ["none"], "", "prose", "role:retrospective")
R("rt.identity", "Mine the run for guidance edits", "role", "RT", "3",
  "One subagent mines the accepted run for durable guidance improvements as minimal edits",
  "the same friction recurring run after run", ["subagent-spawn"],
  "1 spawn per accepted run, reading the whole run's artifacts and commits", "prose",
  "role:retrospective", ["cfg.k-retro"], ["rm.retro"])
R("rt.propose-only", "Propose only, never edit", "rule", "RT", "3",
  "Never edit a file; propose only", "an unreviewed guidance edit landing automatically",
  ["none"], "", "prose", "role:retrospective", [], ["rt.dn-edit", "cr.identity"])
R("rt.no-plugin-edits", "Never propose plugin file edits", "rule", "RT", "3",
  "Never propose an edit to the mise plugin's own files",
  "a project run rewriting the plugin that drove it", ["none"], "", "prose",
  "role:retrospective", [], ["rt.dn-plugin", "rt.tgt-plugin"])
R("rt.read-inputs", "Dispatch names mise dir and config", "rule", "RT", "3",
  "The dispatch names the mise directory and the mise config", "unstated", ["none"], "",
  "prose", "role:retrospective", [], ["cr.read-inputs"])
R("rt.head-sources", "Sources heading", "glue", "RT", "5", "Section heading", "unstated",
  ["none"], "", "prose", "role:retrospective")
R("rt.read-order", "Read the sources in order", "rule", "RT", "7",
  "Read the listed sources in the given order", "unstated", ["none"], "", "prose",
  "role:retrospective")
R("rt.src-logs", "Read friction and progress logs", "rule", "RT", "9",
  "Read _friction.md (may be absent) and _progress.md, its Deviations entries especially",
  "unstated", ["none"], "", "prose", "role:retrospective", ["im.tpl-log"])
R("rt.src-artifacts", "Read the run's artifacts", "rule", "RT", "10",
  "Read goals.md, requirements.md when present, and the plan overview", "unstated",
  ["none"], "", "prose", "role:retrospective")
R("rt.src-commits", "Read the branch's commits", "rule", "RT", "11",
  "Read git log; fix commits and rework name friction the logs miss", "unstated",
  ["tool-run"], "git log over the branch", "prose", "role:retrospective", [],
  ["ac.inspect-commits"])
R("rt.src-guidance", "Read the run's governing guidance", "rule", "RT", "12",
  "Read the config, its Checklist: file, CLAUDE.md and every Skills & guides doc or skill",
  "unstated", ["none"], "", "prose", "role:retrospective", ["cfg.k-skills"],
  ["cr.read-guides", "rv.read-guides"])
R("rt.actual-text", "Propose against actual text", "rule", "RT", "12",
  "Propose against the guidance's actual text, never against an assumed version",
  "a proposal duplicating a rule the doc already carries", ["none"], "", "prose",
  "role:retrospective", ["rt.src-guidance"])
R("rt.corrections-intro", "Corrections the run leaves observable", "glue", "RT", "14",
  "Introduces the four correction sources below", "unstated", ["none"], "", "prose",
  "role:retrospective")
R("rt.corr-friction", "Friction log corrections", "rule", "RT", "16",
  "Treat `correction:` and `acceptance: user flagged` lines as corrections", "unstated",
  ["none"], "", "prose", "role:retrospective", ["rt.src-logs"])
R("rt.corr-uitweaks", "UI tweaks log corrections", "rule", "RT", "17",
  "Treat the UI Tweaks Log in mocks.context.md as corrections when the run mocked",
  "unstated", ["none"], "", "prose", "role:retrospective", ["cfg.k-mockcond"])
R("rt.corr-usercommits", "User-authored commits are corrections", "rule", "RT", "18",
  "Treat post-run commits without mise:/Task/Fix/Docs prefixes as corrections; read their diffs",
  "unstated", ["tool-run"], "reads each user commit's diff", "prose", "role:retrospective",
  ["rt.src-commits"])
R("rt.corr-reviewnotes", "External review notes are corrections", "rule", "RT", "19",
  "When the config has ## Review notes, follow it verbatim to read the external notes",
  "unstated", ["tool-run"], "reads an external notes file per its contract", "prose",
  "role:retrospective", ["cfg.k-reviewnotes"], ["rm.config-surface"])
R("rt.reviewnotes-verbatim", "Every reviewer turn is a correction", "rule", "RT", "19",
  "Count every reviewer turn in those notes as a correction", "unstated",
  ["loop-multiplier"], "one proposal per reviewer turn", "prose", "role:retrospective",
  ["rt.corr-reviewnotes"], ["rt.every-correction", "rm.reviewnotes-doc"])
R("rt.head-findings", "What counts as a finding heading", "glue", "RT", "21",
  "Section heading", "unstated", ["none"], "", "prose", "role:retrospective")
R("rt.every-correction", "Every correction yields a proposal", "rule", "RT", "23",
  "Every correction yields a proposal; none is dropped",
  "a user correction forgotten by the next run", ["loop-multiplier"],
  "proposal count scales with corrections", "prose", "role:retrospective", [],
  ["rm.corrections"])
R("rt.route-three", "Route each correction to one kind", "rule", "RT", "23",
  "Route each correction to checklist edit, durable doc, or config/plugin", "unstated",
  ["none"], "", "prose", "role:retrospective", ["rt.every-correction"])
R("rt.cl-format", "Checklist edits use the rule format", "rule", "RT", "25",
  "Write a checklist edit as `<rule> — <how to check>`", "unstated", ["none"], "", "prose",
  "role:retrospective", ["cfg.checklist-shape"], ["cl.head-code"])
R("rt.cl-case-ignored", "Sharpen an ignored documented rule", "rule", "RT", "25",
  "A rule already in a doc or CLAUDE.md yet ignored becomes a checkable rule citing that doc",
  "a documented rule the implementer keeps ignoring", ["none"], "", "prose",
  "role:retrospective", ["rt.cl-format"])
R("rt.cl-case-mechanical", "Mechanical rule with no prose home", "rule", "RT", "25",
  "A mechanical, diff-checkable rule with no prose home becomes a checklist rule", "unstated",
  ["none"], "", "prose", "role:retrospective", ["rt.cl-format"])
R("rt.cl-cap", "Fifteen-rule cap forces merges", "gate", "RT", "25",
  "At the 15-rule cap, sharpen or merge existing rules before adding",
  "an unbounded checklist nobody answers honestly", ["none"], "", "prose",
  "role:retrospective", ["cfg.checklist-cap"], ["ac.notes", "cfg.checklist-cap"])
R("rt.doc-route", "Durable doc for decisions and conventions", "rule", "RT", "26",
  "Route a product or design decision, or a genuinely new convention, to a guide or a new doc",
  "unstated", ["none"], "", "prose", "role:retrospective", ["rt.route-three"],
  ["rt.tgt-newdoc"])
R("rt.doc-first", "New conventions land in docs first", "rule", "RT", "26",
  "A new convention lands in a doc first and becomes a checklist rule only when diff-checkable",
  "the checklist filling with unverifiable rules", ["none"], "", "prose",
  "role:retrospective", ["rt.doc-route"], ["rt.cl-cap"])
R("rt.config-plugin-route", "Workflow corrections: config or plugin", "rule", "RT", "27",
  "A correction about the workflow's own approach routes to config-edit or plugin-candidate",
  "unstated", ["none"], "", "prose", "role:retrospective", ["rt.route-three"],
  ["rt.tgt-config", "rt.tgt-plugin"])
R("rt.bar", "Non-correction findings need an incident", "gate", "RT", "29",
  "Every other finding needs a concrete incident a specific guidance edit would have prevented",
  "a retrospective inventing generic advice", ["none"], "", "prose", "role:retrospective",
  [], ["rt.damage-bar", "sa.observed-failures"])
R("rt.first-match", "Route to the first matching target", "rule", "RT", "29",
  "Route each finding to the first matching target in the list below", "unstated", ["none"],
  "", "prose", "role:retrospective", ["rt.bar"])
R("rt.tgt-guide", "Target: an existing guide", "rule", "RT", "31",
  "Prefer an existing Skills & guides entry or a doc it points to", "unstated", ["none"], "",
  "prose", "role:retrospective", ["rt.first-match"])
R("rt.tgt-config", "Target: the mise config", "rule", "RT", "32",
  "Route wrong or missing values — test exceptions, mock conditions, quality commands — to the config",
  "unstated", ["none"], "", "prose", "role:retrospective", ["rt.first-match"],
  ["cfg.head-section"])
R("rt.tgt-claudemd", "Target: CLAUDE.md", "rule", "RT", "33",
  "Route a repo-wide code convention to CLAUDE.md", "unstated", ["none"], "", "prose",
  "role:retrospective", ["rt.first-match"], ["cm.head"])
R("rt.tgt-newdoc", "Target: a new doc, last resort", "rule", "RT", "34",
  "Propose a new doc only when a critical lesson has no home; give content and registration line",
  "guidance scattered across new docs nobody reads", ["none"], "", "prose",
  "role:retrospective", ["rt.first-match"], ["rt.doc-route"])
R("rt.newdoc-condition", "No crisp condition, no doc", "rule", "RT", "34",
  "Without a crisp 'when to use' condition the doc is not ready", "unstated", ["none"], "",
  "prose", "role:retrospective", ["rt.tgt-newdoc"], ["cfg.k-skills"])
R("rt.tgt-plugin", "Target: plugin candidate, report only", "rule", "RT", "35",
  "Describe a flaw in how the stages ran as a plugin candidate for the user to take upstream",
  "unstated", ["none"], "", "prose", "role:retrospective", ["rt.first-match"],
  ["rt.no-plugin-edits", "rt.dn-plugin"])
R("rt.tgt-drop", "Target: drop it", "rule", "RT", "36", "Drop a finding matching no target",
  "unstated", ["none"], "", "prose", "role:retrospective", ["rt.first-match"])
R("rt.head-rules", "Rules heading", "glue", "RT", "38", "Section heading", "unstated",
  ["none"], "", "prose", "role:retrospective")
R("rt.minimal-diffs", "Proposals are minimal diffs", "rule", "RT", "40",
  "Every proposal is a minimal diff", "guidance files growing with every run", ["none"], "",
  "prose", "role:retrospective", [], ["sa.removal-test"])
R("rt.deletion-counts", "Deleting guidance counts", "rule", "RT", "40",
  "Deleting or consolidating existing guidance counts as a proposal", "unstated", ["none"],
  "", "prose", "role:retrospective", ["rt.minimal-diffs"], ["sa.removal-test"])
R("rt.damage-bar", "Proposal must protect a future run", "gate", "RT", "41",
  "An incident justifies a proposal only if ignoring it would plausibly damage a future run",
  "noise proposals", ["none"], "", "prose", "role:retrospective", ["rt.bar"])
R("rt.group", "Group proposals by pattern", "rule", "RT", "42",
  "Group proposals by pattern", "unstated", ["none"], "", "prose", "role:retrospective")
R("rt.covers-incident", "Each proposal cites Covers or Incident", "rule", "RT", "42",
  "Each proposal carries a Covers: line, an Incident: line, or both",
  "a proposal with no traceable origin", ["none"], "", "prose", "role:retrospective",
  ["rt.tpl"])
R("rt.no-cosmetic", "Never a cosmetic wording preference", "rule", "RT", "42",
  "Never propose a cosmetic wording preference", "unstated", ["none"], "", "prose",
  "role:retrospective", [], ["cr.report-scope", "rv.report-scope"])
R("rt.empty-success", "An empty report is a success", "rule", "RT", "43",
  "An empty report is a success when nothing cleared the bar",
  "a retrospective padding its output", ["none"], "", "prose", "role:retrospective", [],
  ["rt.none-phrase", "cr.report-none"])
R("rt.head-report", "Reporting back heading", "glue", "RT", "45", "Section heading",
  "unstated", ["none"], "", "prose", "role:retrospective")
R("rt.number", "Number the proposals", "rule", "RT", "47",
  "Number the proposals so the user can adopt by number", "unstated", ["none"], "", "prose",
  "role:retrospective", [], ["rm.acceptance"])
R("rt.tpl", "Proposal template", "artifact", "RT", "49-54",
  "Fenced template: target and kind, Edit, Covers, Incident lines", "unstated", ["none"], "",
  "prose", "role:retrospective", ["rt.number"])
R("rt.recommend", "Recommend line names adoptions", "rule", "RT", "56",
  "End with `Recommend: adopt <numbers>`, naming only proposals worth staking a run on",
  "unstated", ["human-wait"], "the user picks from this line at the second gate", "prose",
  "role:retrospective", ["rt.number"], ["rm.acceptance"])
R("rt.doubtful", "Doubtful proposals stay off the line", "rule", "RT", "56",
  "A doubtful proposal stays in the report but off the Recommend line", "unstated", ["none"],
  "", "prose", "role:retrospective", ["rt.recommend"])
R("rt.none-phrase", "Exact no-proposals phrase", "rule", "RT", "56",
  "With no proposals report exactly the stated sentence", "unstated", ["none"], "", "prose",
  "role:retrospective", ["rt.empty-success"], ["cr.report-none", "rv.report-none"])
R("rt.orchestrator", "Final message goes to orchestrator", "rule", "RT", "56",
  "Address the final message to an orchestrator", "unstated", ["none"], "", "prose",
  "role:retrospective", [], ["cr.report-orchestrator"])
R("rt.head-donot", "Do not heading", "glue", "RT", "58", "Section heading", "unstated",
  ["none"], "", "prose", "role:retrospective")
R("rt.dn-edit", "Do not edit any file", "rule", "RT", "60",
  "Never edit a file; the orchestrator applies what the user adopts", "unstated", ["none"],
  "sanctioned redundancy (skill-authoring:27)", "prose", "role:retrospective", [],
  ["rt.propose-only"])
R("rt.dn-plugin", "Do not propose plugin edits", "rule", "RT", "61",
  "Never propose an edit to the plugin's own skill or instruction files", "unstated",
  ["none"], "sanctioned redundancy (skill-authoring:27)", "prose", "role:retrospective", [],
  ["rt.no-plugin-edits", "rt.tgt-plugin"])

# ----------------------------------------------------- config-reference.md
R("cfg.head", "Config reference heading", "glue", "CFG", "1", "Names the reference file",
  "unstated", ["none"], "", "prose", "stage:setup")
R("cfg.purpose", "Reference for setup only", "rule", "CFG", "3-4",
  "This file guides setup and is never copied into a project", "a reference file shipped as project config",
  ["driver-context"], "loaded by the setup stage only", "prose", "stage:setup")
R("cfg.setup-interview", "Setup interviews and writes the config", "stage", "CFG", "4-5",
  "Setup interviews the user and writes .claude/mise-config.md", "unstated",
  ["human-wait", "driver-context"], "one interview per project", "prose", "stage:setup", [],
  ["rm.one-command"])
R("cfg.only-applicable", "Write only sections that apply", "rule", "CFG", "5",
  "Write only the sections that apply to the project", "unstated", ["none"], "", "prose",
  "stage:setup")
R("cfg.values-only", "Values, no instructional prose", "rule", "CFG", "5-6",
  "Config holds values and freeform sections only, since every stage and subagent reads it",
  "config bloat multiplied across every subagent's context", ["none"], "", "prose",
  "stage:setup", [], ["cfg.no-consumption-rules", "sa.removal-test"])
R("cfg.no-consumption-rules", "Never restate consumption rules", "rule", "CFG", "8-9",
  "Never restate how a value is consumed here or in the generated config", "duplicated rules drifting apart",
  ["none"], "", "prose", "stage:setup", [], ["cfg.values-only", "sa.derivable"])
R("cfg.head-shape", "Generated file shape heading", "glue", "CFG", "11", "Section heading",
  "unstated", ["none"], "", "prose", "stage:setup")
R("cfg.example", "Worked example config", "artifact", "CFG", "13-69",
  "Full example of a generated mise-config.md with every section filled", "unstated",
  ["driver-context"], "57 lines loaded during setup", "prose", "stage:setup", [],
  ["cfg.head-section"])
R("cfg.head-section", "Section reference heading", "glue", "CFG", "71", "Section heading",
  "unstated", ["none"], "", "prose", "stage:setup")
R("cfg.required-intro", "Four sections are required", "rule", "CFG", "73",
  "The config is unfilled without the four required sections", "unstated", ["none"], "",
  "prose", "stage:setup")
R("cfg.k-misedir", "Knob: Mise directory", "config-knob", "CFG", "75",
  "Where in-flight work lives; suggested value .mise/", "unstated", ["none"],
  "default suggested .mise/", "prose", "stage:setup", [], ["mc.misedir", "rm.config-surface"])
R("cfg.misedir-inflight", "Mise dir existence means in flight", "rule", "CFG", "75",
  "The directory holds stage artifacts and .workflow-state only, so its existence means work is in flight",
  "two pieces of work in flight on one branch", ["none"], "", "prose", "stage:setup",
  ["cfg.k-misedir"], ["st.report-inflight", "cm.no-pr-inflight"])
R("cfg.k-branch", "Knob: Branch convention", "config-knob", "CFG", "76",
  "One line naming how work branches are named, using <slug>", "unstated", ["none"],
  "no default; example feat/<slug>, fix/<slug>", "prose", "stage:setup", [],
  ["mc.branch", "rm.one-work-branch"])
R("cfg.k-checklist", "Knob: Checklist path", "config-knob", "CFG", "77",
  "Top-level value naming the project's review checklist file", "unstated", ["none"],
  "default suggested .claude/mise-checklist.md", "prose", "stage:setup", [],
  ["mc.checklist", "rm.checklist-starter"])
R("cfg.checklist-shape", "Checklist file shape", "artifact", "CFG", "77",
  "Checklist is # Review checklist, one intro line, ## Code then ## Prose, numbered continuously",
  "unstated", ["none"], "", "prose", "stage:setup", ["cfg.k-checklist"],
  ["cl.head", "rt.cl-format", "rm.checklist-starter"])
R("cfg.checklist-cap", "Checklist capped at 15, never blocking", "gate", "CFG", "77",
  "Each rule is answerable pass/fail/n-a against a diff; cap 15 rules; never blocking",
  "a checklist too long to answer honestly", ["none"],
  "bounds per-commit answering cost at 15 rules", "prose", "stage:setup",
  ["cfg.k-checklist"], ["rt.cl-cap", "ac.notes"])
R("cfg.k-quality", "Knob: Quality commands", "config-knob", "CFG", "78",
  "Format, Check (lint + typecheck), Unit tests, optional Task tests", "unstated", ["none"],
  "no defaults; project-specific", "prose", "stage:setup", [],
  ["mc.format", "mc.check", "mc.unit", "rm.config-surface"])
R("cfg.slot-list", "Slot may hold an ordered list", "rule", "CFG", "78",
  "Each slot is one command or a nested-bullet list run in order", "unstated", ["none"], "",
  "prose", "stage:setup", ["cfg.k-quality"], ["im.list-order"])
R("cfg.k-tasktests", "Knob: Task tests is scoped", "config-knob", "CFG", "78",
  "Task tests carries a <path> placeholder that per-task verification fills",
  "running the full unit suite per task", ["none"], "optional; omitted means full Unit tests",
  "prose", "stage:setup", ["cfg.k-quality"], ["im.tasktests", "rm.stage-execute"])
R("cfg.run-only", "Quality commands are run commands", "rule", "CFG", "78",
  "These slots hold run commands only; how tests are written is Test conventions", "unstated",
  ["none"], "", "prose", "stage:setup", ["cfg.k-quality"], ["cfg.k-testconv"])
R("cfg.optional-intro", "Optional sections are omitted when unused", "rule", "CFG", "80-81",
  "Omit an optional section when it does not apply", "unstated", ["none"], "", "prose",
  "stage:setup")
R("cfg.pointer-body", "Body may point at a doc", "rule", "CFG", "81-83",
  "A body is inline values or a pointer to an existing doc or skill, which its reader follows",
  "unstated", ["none"], "", "prose", "stage:setup")
R("cfg.prefer-pointer", "Prefer the pointer when content exists", "rule", "CFG", "82-83",
  "Prefer the pointer whenever the content already lives in the project",
  "duplicating project docs into the config every subagent loads", ["none"], "", "prose",
  "stage:setup", ["cfg.pointer-body"], ["cfg.values-only"])
R("cfg.k-mockcond", "Knob: Mock conditions", "config-knob", "CFG", "84",
  "Bulleted conditions deciding whether a feature gets an HTML mock; match means route full",
  "unstated", ["human-wait"], "a matching condition adds the mock gate to the goals stage",
  "prose", "stage:setup", [], ["rm.stage-goals", "st.stageorder"])
R("cfg.k-mockguide", "Knob: Mock guidance", "config-knob", "CFG", "85",
  "How mocks should look: product name, UI code root, look-and-feel notes", "unstated",
  ["none"], "no default", "prose", "stage:setup", ["cfg.k-mockcond"])
R("cfg.k-testconv", "Knob: Test conventions", "config-knob", "CFG", "86",
  "Where each kind of test lives, naming, frameworks, fixtures", "unstated", ["none"],
  "no default", "prose", "stage:setup", [], ["mc.testconv"])
R("cfg.k-testexc", "Knob: Test exceptions", "config-knob", "CFG", "87",
  "Bulleted `condition — alternative verification` entries for work verified another way",
  "unstated", ["none"], "no default value; one entry suggested", "prose", "stage:setup", [],
  ["mc.exc-markdown", "mc.exc-e2e", "rm.config-surface"])
R("cfg.testexc-method", "Verification never disappears", "rule", "CFG", "87",
  "A Test exception changes the verification method, never removes verification",
  "an exception used to skip verification", ["none"], "", "prose", "stage:setup",
  ["cfg.k-testexc"], ["im.substitute", "ac.substitute", "rv.tests"])
R("cfg.testexc-default", "Suggest the visual-changes exception", "rule", "CFG", "87",
  "Suggest the purely-visual to screenshots entry as a default", "unstated", ["none"],
  "default entry suggested by setup", "prose", "stage:setup", ["cfg.k-testexc"])
R("cfg.k-skills", "Knob: Skills and guides", "config-knob", "CFG", "88",
  "One entry per line: `name-or-path (skill|doc[, required]): when to use`", "unstated",
  ["none"], "no default; each entry reaches critic, implementer, documenter, reviewer",
  "prose", "stage:setup", [],
  ["mc.guide-authoring", "mc.guide-statemachine", "cr.read-guides", "im.s3-config-guides"])
R("cfg.skills-required", "required means never bypassed", "rule", "CFG", "88",
  "A `required` entry MUST be used whenever its condition matches", "an e2e runner bypassed",
  ["none"], "", "prose", "stage:setup", ["cfg.k-skills"],
  ["dc.s1-required", "im.s3-config-guides", "im.e2e-via-guide"])
R("cfg.k-models", "Knob: Models", "config-knob", "CFG", "89",
  "One `- <role>: <model>` line per subagent role", "unstated", ["subagent-spawn"],
  "sets the model, and therefore the cost, of every spawn", "prose", "stage:setup", [],
  ["mc.model-implementer", "rm.exec-models"])
R("cfg.models-roles", "Seven roles take a model", "rule", "CFG", "89",
  "The seven roles are implementer, reviewer, critic, acceptance, explore, documenter, retrospective",
  "unstated", ["none"], "", "prose", "stage:setup", ["cfg.k-models"])
R("cfg.models-values", "Model values include session", "rule", "CFG", "89",
  "Values are haiku, sonnet, opus, fable, plus session meaning inherit the session model",
  "unstated", ["none"], "default for every role is session", "prose", "stage:setup",
  ["cfg.k-models"])
R("cfg.models-omit", "Setup writes only non-session entries", "rule", "CFG", "89",
  "Setup writes only non-session entries and omits the section when every role is session",
  "unstated", ["none"], "", "prose", "stage:setup", ["cfg.models-values"])
R("cfg.models-documenter", "Documenter line switches two-pass on", "config-knob", "CFG", "89",
  "A documenter line's presence turns two-pass mode on, so `documenter: session` is written explicitly",
  "a model setting silently changing the workflow's shape", ["subagent-spawn"],
  "presence adds one documenter spawn per task and per later code commit", "prose",
  "stage:setup", ["cfg.k-models"], ["im.s1-twopass", "dc.identity", "rm.exec-twopass"])
R("cfg.k-migrations", "Knob: Database migrations", "config-knob", "CFG", "90",
  "The project's migration generation command, if it has one", "unstated", ["none"],
  "omitted by default", "prose", "stage:setup")
R("cfg.k-backlog", "Knob: Backlog", "config-knob", "CFG", "91",
  "Freeform instructions for fetching top to-do items; read verbatim", "unstated",
  ["tool-run"], "an external tracker call when used", "prose", "stage:setup", [],
  ["rm.config-surface"])
R("cfg.k-reviewnotes", "Knob: Review notes", "config-knob", "CFG", "92",
  "Freeform instructions for reading the branch's external review notes; read verbatim",
  "unstated", ["none"], "omitted by default", "prose", "stage:setup", [],
  ["mc.reviewnotes", "rt.corr-reviewnotes", "rm.reviewnotes-doc"])
R("cfg.k-retro", "Knob: Retrospective off switch", "config-knob", "CFG", "93",
  "Only ever written as `Retrospective: off`, disabling the post-acceptance retrospective",
  "unstated", ["subagent-spawn"], "off removes one subagent spawn per run", "prose",
  "stage:setup", [], ["rt.identity"])
R("cfg.retro-default", "Retrospective defaults on", "config-knob", "CFG", "93",
  "Omitting the line keeps the retrospective on — the default", "unstated", ["none"],
  "default: on", "prose", "stage:setup", ["cfg.k-retro"])
R("cfg.k-ship", "Knob: Ship", "config-knob", "CFG", "94",
  "Top-level value pr | merge (<style>) | off, deciding the execute close-out", "unstated",
  ["none"], "", "prose", "stage:setup", [], ["mc.ship", "rm.cleanup-ship"])
R("cfg.ship-style", "Merge style is the user's choice", "rule", "CFG", "94",
  "The merge style — squash, merge commit, rebase — is recorded, never assumed", "unstated",
  ["none"], "", "prose", "stage:setup", ["cfg.k-ship"])
R("cfg.ship-default", "Omitting Ship asks each time", "config-knob", "CFG", "94",
  "Omitting the line makes the close-out ask each time", "unstated", ["human-wait"],
  "default: ask; costs one prompt per run", "prose", "stage:setup", ["cfg.k-ship"])

# -------------------------------------------------------- docs/skill-authoring.md
R("sa.head", "Skill authoring heading", "glue", "SA", "1", "Names the guide", "unstated",
  ["none"], "", "prose", "role:implementer")
R("sa.purpose", "This file records decisions", "glue", "SA", "3",
  "The conventions this plugin's instruction files follow; sources carry the general guidance",
  "unstated", ["none"], "", "prose", "role:implementer")
R("sa.snapshot", "Guidance snapshot is dated", "rule", "SA", "5",
  "Re-read the linked sources for anything newer than the August 2026 snapshot", "unstated",
  ["none"], "", "prose", "role:implementer", ["sa.sources"])
R("sa.head-style", "Writing style heading", "glue", "SA", "7", "Section heading", "unstated",
  ["none"], "", "prose", "role:implementer")
R("sa.specificity", "Match specificity to fragility", "rule", "SA", "9",
  "Open-ended work gets heuristics; fragile order-dependent work gets explicit rules",
  "unstated", ["none"], "justifies this workflow spelling out every branch", "prose",
  "role:implementer")
R("sa.rationale", "Rationale only where needed", "rule", "SA", "10",
  "A why-clause earns its place only where the rule would otherwise be misapplied",
  "instruction files padded with rationale", ["none"], "", "prose", "role:implementer", [],
  ["sa.removal-test"])
R("sa.removal-test", "The removal test", "rule", "SA", "11",
  "Cut any line whose removal would not cause a mistake", "rules getting lost in the noise",
  ["none"], "", "prose", "role:implementer", [], ["rt.minimal-diffs", "sa.rationale"])
R("sa.derivable", "Derivable content goes", "rule", "SA", "11",
  "Anything derivable from a stated contract is cut; state a contract once", "restated rules drifting apart",
  ["none"], "", "prose", "role:implementer", ["sa.removal-test"],
  ["cfg.no-consumption-rules"])
R("sa.one-rule-position", "One rule per position", "rule", "SA", "12",
  "Give a load-bearing rule its own bullet, never a mid-parenthesis clause",
  "a buried rule skipped under load", ["none"], "", "prose", "role:implementer")
R("sa.one-term", "One term per concept", "rule", "SA", "13",
  "Use one name per concept across files; prefer plain English over coined terms",
  "a synonym read as a new concept", ["none"], "", "prose", "role:implementer")
R("sa.head-structure", "Structure heading", "glue", "SA", "15", "Section heading",
  "unstated", ["none"], "", "prose", "role:implementer")
R("sa.user-invoked", "next is user-invoked only", "rule", "SA", "17",
  "next carries disable-model-invocation and never preloads into the workflow's subagents",
  "the model starting a long stateful process unprompted", ["none"], "", "prose",
  "role:implementer")
R("sa.description", "Description is the menu documentation", "rule", "SA", "17",
  "The skill description is third-person what + when, for the user's slash menu", "unstated",
  ["none"], "", "prose", "role:implementer", ["sa.user-invoked"])
R("sa.substitutions", "Harness substitutions over prose", "rule", "SA", "18",
  "Anchor commands on ${CLAUDE_SKILL_DIR}, $ARGUMENTS, ${CLAUDE_PROJECT_DIR}; substitution never reaches dispatched files",
  "a path-resolution rule restated per command", ["none"], "", "prose", "role:implementer")
R("sa.role-statement", "Role statement first", "rule", "SA", "19",
  "Open each file with one or two sentences of identity and what the executor never does",
  "unstated", ["none"], "", "prose", "role:implementer", [],
  ["cr.identity", "rv.identity", "ac.identity", "dc.identity", "im.identity", "rt.identity"])
R("sa.role-files", "Role files are self-contained", "rule", "SA", "20",
  "Every subagent role except explore has a self-contained file under roles/, dispatched by path",
  "role instructions inlined into orchestrator files", ["none"], "", "prose",
  "role:implementer", [], ["sa.fresh-context"])
R("sa.stage-assumes", "Stage files assume interaction and config", "rule", "SA", "20",
  "Stage files run in the orchestrator's context and assume interaction.md and the config are loaded",
  "unstated", ["driver-context"], "", "prose", "role:implementer")
R("sa.checklist-longruns", "Progress checklist for long files", "rule", "SA", "21",
  "Multi-phase files open with a copyable checklist whose names match the headings", "unstated",
  ["driver-context"], "", "prose", "role:implementer")
R("sa.exec-order", "Sections in execution order", "rule", "SA", "22",
  "Order sections as they execute and define before use; forward-reference contracts explicitly",
  "a term used before it is defined", ["none"], "", "prose", "role:implementer")
R("sa.construct", "Match construct to control flow", "rule", "SA", "23",
  "Routers use conditional bullets, pipelines numbered steps; one arrow per condition",
  "unstated", ["none"], "", "prose", "role:implementer")
R("sa.stopping-rules", "Stopping rules, not continuation prose", "rule", "SA", "24",
  "State when to stop; continuing is then the default", "prose telling the agent to continue",
  ["none"], "", "prose", "role:implementer")
R("sa.templates", "Templates and exact phrasings verbatim", "rule", "SA", "25",
  "Output formats, dispatch prompts and exact phrasings appear as fenced blocks", "unstated",
  ["none"], "", "prose", "role:implementer", [],
  ["ac.template", "im.tpl-commit", "dc.tpl-commit", "rt.tpl"])
R("sa.progressive", "Progressive disclosure under 500 lines", "rule", "SA", "26",
  "SKILL.md stays an overview under 500 lines; references/ and stages/ carry depth one level deep",
  "a skill file too large to load", ["none"], "roles/ sits outside the 500-line count",
  "prose", "role:implementer")
R("sa.donot-redundancy", "Do-not lists: sanctioned redundancy only", "rule", "SA", "27",
  "Do not lists may restate safety- and gate-critical rules; convenience rules must not creep in",
  "redundancy creeping through the instruction files", ["none"], "", "prose",
  "role:implementer", [], ["im.head-donot", "rt.head-donot"])
R("sa.head-loop", "Agentic-loop patterns heading", "glue", "SA", "29", "Section heading",
  "unstated", ["none"], "", "prose", "role:implementer")
R("sa.scripts-over-prose", "Scripts over prose for fragile ops", "rule", "SA", "31",
  "Anything with exact invariants is code the model runs, not rules applied by hand",
  "state transitions applied inconsistently by hand", ["tool-run"], "", "prose",
  "role:implementer", [], ["st.doc-header"])
R("sa.allowed-tools", "Pre-approve the skill's machinery", "rule", "SA", "32",
  "allowed-tools grants the state engine and checkpoint commits; cleanup deletion stays prompted",
  "an unattended run stalling on a permission prompt", ["human-wait"],
  "avoids a human wait per state call", "prose", "role:implementer")
R("sa.fresh-context", "Fresh context per unit of work", "rule", "SA", "33",
  "Each task, critique, review and acceptance runs in a fresh subagent", "the author's context rationalizing a defect away",
  ["subagent-spawn"], "one spawn per unit of work", "prose", "role:implementer", [],
  ["cr.identity", "rv.identity", "im.identity"])
R("sa.redundancy-across-files", "Redundancy across files is intentional", "rule", "SA", "33",
  "Task and role files repeat background instead of referencing siblings", "unstated",
  ["subagent-spawn"], "duplicated text in every dispatched file", "prose", "role:implementer",
  ["sa.fresh-context"], ["sa.derivable"])
R("sa.reviewer-findings", "Tell every reviewer what counts", "rule", "SA", "34",
  "Role files name what counts as a finding and nothing else",
  "a reviewer reporting gaps even when the work is sound", ["none"], "", "prose",
  "role:implementer", [], ["cr.report-scope", "rv.report-scope"])
R("sa.small-diffs", "Small diffs: the five-file cap", "rule", "SA", "35",
  "84% of diffs over 1,000 lines draw findings against 31% under 50 — hence the five-file cap",
  "large diffs drawing review findings", ["none"], "", "prose", "role:implementer", [],
  ["cr.plan-cap", "rm.stage-plan"])
R("sa.checklist-evidence", "Recorded rules: the checklist", "rule", "SA", "35",
  "A 15-item self-review checklist eliminated recurrences across nine error classes",
  "recurring defect classes", ["none"], "", "prose", "role:implementer", [],
  ["cfg.checklist-cap", "im.s5-checklist", "rv.cl-confirm"])
R("sa.orchestrator-summaries", "Orchestrators hold summaries", "rule", "SA", "36",
  "An orchestrator reads the overview and subagent reports, never task files or source",
  "an orchestrator context that cannot survive a long plan", ["driver-context"],
  "keeps driver context flat across plan length", "prose", "role:implementer", [],
  ["im.orchestrator", "im.log-oneline"])
R("sa.durable-state", "Durable state outside the context window", "rule", "SA", "37",
  "Approvals, completed tasks and decisions live in committed files; checkpoints make any checkout resumable",
  "a resumed session losing the run's decisions", ["tool-run"], "one commit per state change",
  "prose", "role:implementer", [], ["im.s7-commit", "dc.s7-commit", "st.doc-header"])
R("sa.bounded-retries", "Bounded retries with honest failure", "rule", "SA", "38",
  "Every loop carries an exit: 3 attempts with no new hypothesis reports failure",
  "an unbounded retry loop", ["loop-multiplier"], "", "prose", "role:implementer", [],
  ["im.bounded-retries", "dc.s6-stuck"])
R("sa.head-process", "Process heading", "glue", "SA", "40", "Section heading", "unstated",
  ["none"], "", "prose", "role:implementer")
R("sa.observed-failures", "Start from observed failures", "rule", "SA", "42",
  "Run the task without the rule first and note where the model goes wrong; keep it as an eval",
  "rules added on speculation", ["none"], "", "prose", "role:implementer", [], ["rt.bar"])
R("sa.trace-review", "Review by tracing", "rule", "SA", "43",
  "Walk the file as its executor would, with a concrete state in mind", "terms used before definition",
  ["none"], "", "prose", "role:implementer", [], ["mc.exc-markdown"])
R("sa.validate-runs", "Validate edits against real runs", "rule", "SA", "44",
  "Exercise the skill after nontrivial changes: a throwaway-branch run or a dry-run walkthrough",
  "unstated", ["tool-run"], "a full workflow run per validation", "prose", "role:implementer",
  [], ["mc.exc-markdown"])
R("sa.test-models", "Test with every running model", "rule", "SA", "45",
  "Check both directions: enough guidance for the cheapest tier, no over-explaining for the strongest",
  "unstated", ["subagent-spawn"], "", "prose", "role:implementer", [], ["cfg.k-models"])
R("sa.head-sources", "Sources heading", "glue", "SA", "47", "Section heading", "unstated",
  ["none"], "", "prose", "role:implementer")
R("sa.sources", "External source links", "glue", "SA", "49-51",
  "Links to the Anthropic and Claude Code guidance this file distills", "unstated", ["none"],
  "", "prose", "role:implementer")

# ---------------------------------------------------------------- README.md
R("rm.title", "README title", "glue", "RM", "1", "Names the plugin", "unstated", ["none"],
  "", "prose", "always-loaded")
R("rm.pitch", "What the plugin is for", "glue", "RM", "3",
  "Describes unattended requirements, planning and execution checked by fresh-context agents",
  "unstated", ["none"], "documentation only, not loaded at runtime", "prose",
  "always-loaded", [], ["sa.fresh-context"])
R("rm.name", "Name origin", "glue", "RM", "5", "Explains the mise en place name", "unstated",
  ["none"], "", "prose", "always-loaded")
R("rm.head-install", "Install heading", "glue", "RM", "7", "Section heading", "unstated",
  ["none"], "", "prose", "always-loaded")
R("rm.cmd-marketplace", "Marketplace add command", "artifact", "RM", "9-11",
  "The /plugin marketplace add invocation", "unstated", ["none"], "", "prose",
  "always-loaded")
R("rm.cmd-install", "Install command", "artifact", "RM", "13-15",
  "The /plugin install invocation", "unstated", ["none"], "", "prose", "always-loaded")
R("rm.node24", "Node 24+ requirement", "rule", "RM", "17",
  "States Node.js 24+ on PATH is required; the state engine runs TypeScript natively",
  "a run failing on an older Node", ["none"], "", "both", "always-loaded", [],
  ["st.node24"])
R("rm.head-update", "Update heading", "glue", "RM", "19", "Section heading", "unstated",
  ["none"], "", "prose", "always-loaded")
R("rm.cmd-update", "Update command", "artifact", "RM", "21-23",
  "The /plugin update invocation", "unstated", ["none"], "", "prose", "always-loaded", [],
  ["cm.version"])
R("rm.head-usage", "Usage heading", "glue", "RM", "25", "Section heading", "unstated",
  ["none"], "", "prose", "always-loaded")
R("rm.one-command", "One command, setup on first run", "glue", "RM", "27",
  "One command drives everything; its first run walks the user through configuration",
  "unstated", ["none"], "", "prose", "always-loaded", [], ["cfg.setup-interview"])
R("rm.table-head", "Command table header", "glue", "RM", "29-30", "Table header row",
  "unstated", ["none"], "", "prose", "always-loaded")
R("rm.cmd-next", "/mise:next continues work", "glue", "RM", "31",
  "Documents the bare invocation: run the next stage or start new work", "unstated",
  ["none"], "", "prose", "always-loaded", [], ["st.report-next-stage"])
R("rm.cmd-next-desc", "/mise:next with a description", "glue", "RM", "32",
  "Documents starting a feature or bug fix from a description", "unstated", ["none"], "",
  "prose", "always-loaded")
R("rm.cmd-setup", "/mise:next setup", "glue", "RM", "33",
  "Documents re-running project configuration", "unstated", ["none"], "", "prose",
  "always-loaded", [], ["cfg.setup-interview"])
R("rm.config-surface", "Config surface listed for the user", "glue", "RM", "35",
  "Names every config section the generated mise-config.md can carry",
  "a config surface the user cannot discover (CLAUDE.md:5)", ["none"],
  "duplicates the section list in config-reference.md", "prose", "always-loaded",
  ["cm.readme"],
  ["cfg.k-misedir", "cfg.k-quality", "cfg.k-testexc", "cfg.k-skills", "cfg.k-models",
   "cfg.k-backlog", "cfg.k-ship"])
R("rm.reviewnotes-doc", "Review notes feed the retrospective", "glue", "RM", "35",
  "States every reviewer turn in the external notes is a correction", "unstated", ["none"],
  "", "prose", "always-loaded", [], ["rt.reviewnotes-verbatim", "cfg.k-reviewnotes"])
R("rm.checklist-starter", "Setup writes the checklist starter", "glue", "RM", "35",
  "Setup writes the starter checklist at .claude/mise-checklist.md, Code then Prose, max 15",
  "unstated", ["none"], "", "prose", "always-loaded", [],
  ["cfg.checklist-shape", "cfg.checklist-cap", "cl.head"])
R("rm.head-how", "How it works heading", "glue", "RM", "37", "Section heading", "unstated",
  ["none"], "", "prose", "always-loaded")
R("rm.one-work-branch", "One piece of work per branch", "glue", "RM", "39",
  "New work takes a branch from the naming convention, or reuses the current one", "unstated",
  ["none"], "", "prose", "always-loaded", [], ["cfg.k-branch", "cfg.misedir-inflight"])
R("rm.stage-goals", "Stage 1: goals, human gate", "stage", "RM", "41",
  "Goals conversation critiques the goal, batches questions, iterates a mock; user approves once",
  "unstated", ["human-wait"], "one human gate per run", "prose", "always-loaded", [],
  ["cfg.k-mockcond"])
R("rm.stage-requirements", "Stage 2: requirements", "stage", "RM", "42",
  "Requirements generated from goals and mock, assumptions explicit, self-approved by a critic",
  "unstated", ["subagent-spawn"], "critic rounds until no blockers", "prose",
  "always-loaded", [], ["cr.identity"])
R("rm.stage-plan", "Stage 3: plan, file cap", "stage", "RM", "43",
  "Fine-grained plan with task files held to 5 source files or a written justification",
  "unstated", ["subagent-spawn"], "critic rounds until no blockers", "prose",
  "always-loaded", [], ["cr.plan-cap", "sa.small-diffs"])
R("rm.stage-execute", "Stage 4: execute and verify", "stage", "RM", "44",
  "Each task runs in a fresh implementer verified with Format, Check and its scoped tests",
  "unstated", ["subagent-spawn", "loop-multiplier"],
  "1 implementer + 1 reviewer per task, plus fix rounds", "prose", "always-loaded", [],
  ["im.s4-order", "im.tasktests", "cfg.k-tasktests"])
R("rm.exec-checklist", "Checklist answers ride the commit", "glue", "RM", "44",
  "Implementer and every fix subagent answer the checklist against their diff in the commit message",
  "unstated", ["none"], "", "prose", "always-loaded", [], ["im.s5-checklist", "im.s7-commit"])
R("rm.exec-reviewer", "Reviewer verifies the answers", "glue", "RM", "44",
  "Reviewer confirms each pass, answers the n-a rules itself and reports wrong answers",
  "unstated", ["none"], "", "prose", "always-loaded", [],
  ["rv.cl-confirm", "rv.cl-answer-na", "rv.cl-wrong"])
R("rm.exec-twopass", "Two-pass documenter described", "glue", "RM", "44",
  "A documenter line turns on two-pass: implementers write code only, a Docs: pass adds prose",
  "unstated", ["subagent-spawn"], "one extra spawn per task and per later code commit",
  "prose", "always-loaded", [], ["cfg.models-documenter", "im.s1-twopass", "dc.identity"])
R("rm.exec-models", "Models delegate generation roles", "glue", "RM", "44",
  "Generation roles can run on cheaper models; the gates default to the session model",
  "unstated", ["subagent-spawn"], "", "prose", "always-loaded", [],
  ["cfg.k-models", "cfg.models-values"])
R("rm.gate", "Stage 5: end-of-plan gate", "gate", "RM", "45",
  "After the last task, Format, Check, full Unit tests and the named e2e and sanity runs run once",
  "paying for e2e per task", ["tool-run"], "one full verification run per plan", "prose",
  "always-loaded", [], ["im.never-preexisting-e2e", "ac.gate-stands"])
R("rm.acceptance", "Stage 6: acceptance human gate", "human-stop", "RM", "46",
  "One verdict per requirement, per unanswered task and per Prose rule; the gate's results stand",
  "unstated", ["human-wait", "subagent-spawn"], "the run's second and last human gate",
  "prose", "always-loaded", [],
  ["ac.every-req", "ac.task-checklist", "ac.docs-prose", "ac.orchestrator"])
R("rm.retro", "Retrospective mines the run", "glue", "RM", "46",
  "On confirmation a retrospective proposes guide, config, CLAUDE.md or new-doc edits",
  "unstated", ["subagent-spawn"], "one spawn per accepted run", "prose", "always-loaded", [],
  ["rt.identity", "cfg.k-retro"])
R("rm.corrections", "Every correction becomes a proposal", "glue", "RM", "46",
  "Every user correction becomes a checklist, doc, config or plugin-candidate proposal to adopt or reject",
  "unstated", ["human-wait"], "the adopt/reject prompt rides the acceptance gate", "prose",
  "always-loaded", [], ["rt.every-correction", "rt.route-three"])
R("rm.cleanup-ship", "Cleanup then ship", "glue", "RM", "46",
  "Working docs are cleaned up and the branch ships per Ship: pr, merge or off", "unstated",
  ["tool-run"], "", "prose", "always-loaded", [], ["cfg.k-ship", "cm.no-pr-inflight"])
R("rm.bugfix", "Bug fixes take a shortened route", "stage", "RM", "48",
  "Bug fixes run a bug-understanding conversation then a test-driven plan", "unstated",
  ["none"], "skips the requirements stage", "prose", "always-loaded", [],
  ["st.stageorder", "cr.plan-basis"])
R("rm.diagram-intro", "Actor diagram intro", "glue", "RM", "50",
  "States the user acts only at the two human gates", "unstated", ["none"], "", "prose",
  "always-loaded")
R("rm.diagram", "Actor flow diagram", "artifact", "RM", "52-78",
  "ASCII diagram of user, orchestrator and subagent turns across the whole run", "unstated",
  ["none"], "", "prose", "always-loaded", [], ["rm.stage-goals", "rm.acceptance"])
R("rm.caveat", "Caveat: only as good as verification", "glue", "RM", "80",
  "States the workflow leans on linters, unit tests and e2e coverage", "unstated", ["none"],
  "", "prose", "always-loaded")
R("rm.head-design", "Design heading", "glue", "RM", "82", "Section heading", "unstated",
  ["none"], "", "prose", "always-loaded")
R("rm.design-target", "Target: complex features", "glue", "RM", "84",
  "Targets work beyond a single prompt or plan mode, needing externally imposed rigor",
  "unstated", ["none"], "", "prose", "always-loaded")
R("rm.p-autonomous", "Principle: optimize for autonomous runs", "glue", "RM", "86",
  "The machinery exists so work can run overnight, unattended", "unstated", ["none"], "",
  "prose", "always-loaded", [], ["sa.allowed-tools"])
R("rm.p-levels", "Principle: think at the right level", "glue", "RM", "87",
  "Each stage focuses the agent on one layer: goals, requirements, design, implementation",
  "unstated", ["none"], "", "prose", "always-loaded")
R("rm.p-artifacts", "Principle: artifacts at each step", "glue", "RM", "88",
  "Artifacts enable review, limit context reliance and give rewind checkpoints; removed at cleanup",
  "unstated", ["none"], "", "prose", "always-loaded", [], ["sa.durable-state"])
R("rm.head-dev", "Development heading", "glue", "RM", "90", "Section heading", "unstated",
  ["none"], "", "prose", "always-loaded")
R("rm.plugin-dir", "Load the plugin from a checkout", "artifact", "RM", "92-96",
  "The claude --plugin-dir invocation for local development", "unstated", ["none"], "",
  "prose", "always-loaded")
R("rm.authoring-pointer", "Follow the skill authoring guide", "rule", "RM", "98",
  "Follow the skill authoring guide when editing instruction files; roles are self-contained",
  "unstated", ["none"], "", "prose", "always-loaded", [],
  ["sa.head", "sa.role-files", "mc.guide-authoring"])
R("rm.state-spec", "State engine spec and tests", "glue", "RM", "98",
  "Points at state-machine.md and the node --test command for state.test.ts", "unstated",
  ["tool-run"], "", "prose", "always-loaded", [], ["st.doc-header", "mc.guide-statemachine"])
R("rm.head-credits", "Credits heading", "glue", "RM", "100", "Section heading", "unstated",
  ["none"], "", "prose", "always-loaded")
R("rm.credits", "Fork credit", "glue", "RM", "102",
  "Credits the upstream workflow-skills project", "unstated", ["none"], "", "prose",
  "always-loaded")

# ---------------------------------------------------------------- CLAUDE.md
R("cm.head", "CLAUDE.md heading", "glue", "CM", "1", "Names the repo", "unstated",
  ["driver-context"], "loaded into every session in this repo", "prose", "always-loaded")
R("cm.no-pr-inflight", "Never ship a branch holding .mise/", "gate", "CM", "3",
  "Never open a PR for or merge a branch whose tree contains .mise/; finish the run first",
  "shipping in-flight workflow scaffolding into another branch", ["none"], "", "prose",
  "always-loaded", [], ["cfg.misedir-inflight", "st.report-inflight", "rm.cleanup-ship"])
R("cm.readme", "User-visible change updates README", "rule", "CM", "5",
  "A user-visible change updates README.md in the same run, using the skill files' terms",
  "a skill-file-only change shipping an undocumented feature", ["none"], "", "prose",
  "always-loaded", [], ["rm.config-surface"])
R("cm.version", "User-visible change bumps version", "rule", "CM", "7",
  "A user-visible change bumps version in .claude-plugin/plugin.json in the same run",
  "a change that never reaches an installed user, caught by no gate", ["none"], "", "prose",
  "always-loaded", [], ["rm.cmd-update"])

# ------------------------------------------------------ .claude/mise-config.md
R("mc.head", "Config instance heading", "glue", "MC", "1", "Names the generated config",
  "unstated", ["driver-context", "subagent-spawn"],
  "36 lines read by every stage and every subagent", "prose", "always-loaded")
R("mc.misedir", "Value: Mise directory .mise/", "config-knob", "MC", "3",
  "Sets the mise directory to .mise/", "unstated", ["none"], "matches the suggested default",
  "prose", "always-loaded", ["cfg.k-misedir"])
R("mc.branch", "Value: branch convention", "config-knob", "MC", "4",
  "feat/<slug> for features, fix/<slug> for bug fixes", "unstated", ["none"],
  "matches the reference example", "prose", "always-loaded", ["cfg.k-branch"])
R("mc.checklist", "Value: checklist path", "config-knob", "MC", "5",
  "Points at .claude/mise-checklist.md", "unstated", ["none"], "matches the suggested default",
  "prose", "always-loaded", ["cfg.k-checklist"])
R("mc.ship", "Value: Ship merge squash", "config-knob", "MC", "6",
  "Close-out squash-merges the branch into the default branch", "unstated", ["tool-run"],
  "overrides the ask-each-time default", "prose", "always-loaded", ["cfg.k-ship"])
R("mc.head-quality", "Quality commands heading", "glue", "MC", "8", "Section heading",
  "unstated", ["none"], "", "prose", "always-loaded")
R("mc.format", "Value: Format command", "config-knob", "MC", "10", "yarn format", "unstated",
  ["tool-run"], "", "prose", "always-loaded", ["cfg.k-quality"])
R("mc.check", "Value: Check command", "config-knob", "MC", "11",
  "yarn typecheck only — no lint step in this repo", "unstated", ["tool-run"],
  "reference describes Check as lint + typecheck", "prose", "always-loaded",
  ["cfg.k-quality"])
R("mc.unit", "Value: Unit tests command", "config-knob", "MC", "12",
  "yarn test; no Task tests slot, so every task runs the full suite", "unstated",
  ["tool-run"], "Task tests omitted", "prose", "always-loaded",
  ["cfg.k-quality", "cfg.k-tasktests"])
R("mc.head-testconv", "Test conventions heading", "glue", "MC", "14", "Section heading",
  "unstated", ["none"], "", "prose", "always-loaded")
R("mc.testconv", "Value: test conventions inline", "config-knob", "MC", "16",
  "Colocated *.test.ts files run by the Node built-in test runner", "unstated", ["none"],
  "inline values rather than a pointer", "prose", "always-loaded", ["cfg.k-testconv"])
R("mc.head-testexc", "Test exceptions heading", "glue", "MC", "18", "Section heading",
  "unstated", ["none"], "", "prose", "always-loaded")
R("mc.exc-markdown", "Exception: shipped markdown guidance", "config-knob", "MC", "20",
  "Instruction files, docs/ and README verified by reviewer plus dry-run or consistency check",
  "no unit test exists for prose changes", ["none"],
  "replaces the suggested purely-visual default", "prose", "always-loaded",
  ["cfg.k-testexc"], ["sa.trace-review", "sa.validate-runs"])
R("mc.exc-e2e", "Exception: no e2e infrastructure", "config-knob", "MC", "21",
  "Work needing e2e is verified with unit tests plus manual verification", "unstated",
  ["none"], "", "prose", "always-loaded", ["cfg.k-testexc"], ["cr.plan-e2e"])
R("mc.head-skills", "Skills and guides heading", "glue", "MC", "23", "Section heading",
  "unstated", ["none"], "", "prose", "always-loaded")
R("mc.guide-authoring", "Guide: skill authoring", "config-knob", "MC", "25",
  "docs/skill-authoring.md when writing or editing skill instruction files", "unstated",
  ["subagent-spawn"], "51 lines pulled into any role touching instruction files; not required",
  "prose", "always-loaded", ["cfg.k-skills"], ["sa.head", "rm.authoring-pointer"])
R("mc.guide-statemachine", "Guide: state machine", "config-knob", "MC", "26",
  "docs/state-machine.md when touching state.ts or workflow-state semantics", "unstated",
  ["subagent-spawn"], "79 lines pulled in when state.ts changes; not required", "prose",
  "always-loaded", ["cfg.k-skills"], ["st.doc-header", "rm.state-spec"])
R("mc.head-reviewnotes", "Review notes heading", "glue", "MC", "28", "Section heading",
  "unstated", ["none"], "", "prose", "always-loaded")
R("mc.reviewnotes", "Value: Delta Review notes", "config-knob", "MC", "30",
  "Retrospective reads the branch's Delta Review notes per that skill's contract", "unstated",
  ["tool-run"], "", "prose", "always-loaded", ["cfg.k-reviewnotes"], ["rt.corr-reviewnotes"])
R("mc.head-models", "Models heading", "glue", "MC", "32", "Section heading", "unstated",
  ["none"], "", "prose", "always-loaded")
R("mc.model-implementer", "Model: implementer opus", "config-knob", "MC", "34",
  "Implementer subagents run on opus", "unstated", ["subagent-spawn"],
  "overrides the session default", "prose", "always-loaded", ["cfg.k-models"])
R("mc.model-explore", "Model: explore opus", "config-knob", "MC", "35",
  "Explore subagents run on opus", "unstated", ["subagent-spawn"],
  "overrides the session default", "prose", "always-loaded", ["cfg.k-models"])
R("mc.model-retrospective", "Model: retrospective opus", "config-knob", "MC", "36",
  "Retrospective runs on opus; no documenter line, so this repo runs single-pass", "unstated",
  ["subagent-spawn"], "documenter absent: two-pass off", "prose", "always-loaded",
  ["cfg.k-models"], ["cfg.models-documenter"])

# --------------------------------------------------- .claude/mise-checklist.md
R("cl.head", "Checklist heading", "glue", "CL", "1", "Names the review checklist", "unstated",
  ["subagent-spawn"], "15 lines read by implementer, documenter, reviewer, acceptance",
  "prose", "always-loaded", ["cfg.checklist-shape"])
R("cl.instruction", "Answer every rule before committing", "gate", "CL", "3",
  "Answer every rule pass / fail / n-a against your diff before committing", "unstated",
  ["none"], "", "prose", "always-loaded", [],
  ["im.s5-checklist", "dc.s5-checklist", "rv.cl-confirm", "im.answers-values"])
R("cl.head-code", "Code rules heading", "glue", "CL", "5", "Section heading", "unstated",
  ["none"], "", "prose", "always-loaded")
R("cl.r1", "Rule 1: no leftover debug code", "rule", "CL", "7",
  "Grep the diff for print/console/debugger statements and commented-out code", "unstated",
  ["none"], "", "both", "always-loaded", [], ["im.s5-selfreview", "rv.correctness"])
R("cl.r2", "Rule 2: new files have tests", "rule", "CL", "8",
  "Every new file has a colocated test or the task cites a Test exception", "unstated",
  ["none"], "", "prose", "always-loaded", ["cfg.k-testexc"], ["rv.tests"])
R("cl.r3", "Rule 3: no REQ ids", "rule", "CL", "9",
  "Grep the diff for REQ-* identifiers in code, comments, tests or strings", "unstated",
  ["none"], "", "prose", "always-loaded", [], ["im.s3-no-req", "im.s5-selfreview"])
R("cl.r4", "Rule 4: nothing outside task scope", "rule", "CL", "10",
  "Compare the diff's file list against the task's Files to modify/create", "unstated",
  ["none"], "", "prose", "always-loaded", [], ["im.dn-scope", "dc.s2-never-wider"])
R("cl.r5", "Rule 5: test fails without change", "rule", "CL", "11",
  "Changed behavior has a named test that fails without the change", "unstated", ["none"],
  "", "prose", "always-loaded", [], ["im.task-written-tests", "rv.tests"])
R("cl.head-prose", "Prose rules heading", "glue", "CL", "13", "Section heading", "unstated",
  ["none"], "", "prose", "always-loaded")
R("cl.r6", "Rule 6: comments explain why", "rule", "CL", "15",
  "Every comment explains why or a non-obvious what; none restates the code", "unstated",
  ["none"], "", "prose", "always-loaded", [], ["dc.s4-comments", "rv.prose", "ac.docs-prose"])

# ------------------------------------------------------------------ state.ts
R("st.doc-header", "Header comment documents the commands", "glue", "ST", "1-36",
  "Comment block describing report/approve, done-task semantics and the broken-state rule",
  "unstated", ["none"], "restated in full by docs/state-machine.md (79 lines)", "script",
  "script", [], ["mc.guide-statemachine", "rm.state-spec"])
R("st.artifacts", "Stage to artifact filenames", "script", "ST", "48-59",
  "Fixes which files each stage hashes; mock is mocks.html then mocks.context.md", "unstated",
  ["none"], "", "script", "script")
R("st.taskfile-regex", "Task filename and hash patterns", "script", "ST", "67-68",
  "Task files are NN_NN_*.md; recorded hashes must be 40 hex chars", "unstated", ["none"],
  "", "script", "script")
R("st.brokenhint", "Recovery hint text", "script", "ST", "70-73",
  "Every broken-state error names two recoveries: restore from checkpoint, or delete the dir",
  "a model repairing state by inference", ["none"], "", "script", "script", [],
  ["st.parse-strict"])
R("st.fail", "Errors print JSON and exit 1", "script", "ST", "75-78",
  "Any failure prints a JSON error object and exits non-zero", "unstated", ["none"], "",
  "script", "script")
R("st.stageorder", "Route decides participating stages", "script", "ST", "82-92",
  "full keeps all stages, bugfix keeps goals+plan, unset/direct drops mock", "unstated",
  ["none"], "bugfix route skips the requirements stage entirely", "script", "script", [],
  ["rm.bugfix", "cfg.k-mockcond"])
R("st.hashstage", "Artifact hash is SHA-1 of bytes", "script", "ST", "97-111",
  "SHA-1 over the concatenated artifact bytes; null when any file is missing", "unstated",
  ["none"], "a missing artifact is a mismatch, never a shell error", "script", "script",
  ["st.artifacts"])
R("st.parse-strict", "Strict state parse, never repaired", "script", "ST", "116-136",
  "Rejects non-JSON, non-object and unknown fields; the engine is the only writer",
  "a hand-edited or stale-format state file silently accepted", ["none"], "", "script",
  "script", [], ["st.brokenhint"])
R("st.parse-route", "Route field validated against enum", "script", "ST", "138-146",
  "Only full, direct or bugfix parse as a route", "unstated", ["none"], "", "script",
  "script")
R("st.parse-approved", "Approved map validated", "script", "ST", "148-168",
  "approved must be an object of known stages mapped to 40-hex hashes", "unstated", ["none"],
  "", "script", "script", ["st.taskfile-regex"])
R("st.parse-accepted", "Accepted hash validated", "script", "ST", "170-179",
  "accepted must be a 40-hex string", "unstated", ["none"], "", "script", "script")
R("st.parse-goals-route", "Goals approval implies a route", "script", "ST", "181-183",
  "A goals approval recorded without a route is a broken state file",
  "a run with approvals but no route", ["none"], "", "script", "script", [],
  ["st.approve-goals-route"])
R("st.parse-accepted-order", "Acceptance implies approvals", "script", "ST", "185-187",
  "An accepted record without a goals approval is a broken state file", "unstated", ["none"],
  "", "script", "script")
R("st.serialize", "Canonical state serialization", "script", "ST", "192-208",
  "Writes stages in fixed order and omits empty fields", "unstated", ["none"], "", "script",
  "script")
R("st.taskindex", "Task Index IDs parsed from overview", "script", "ST", "212-229",
  "IDs are backticked NN_NN filenames in 00_overview.md, deduped, in first-appearance order",
  "unstated", ["none"], "literal comparison only", "script", "script")
R("st.donetasks", "Done means file in done/", "script", "ST", "233-251",
  "A task is complete exactly when its file is in implementation_plan/done/", "unstated",
  ["none"], "completion read from the filesystem, never from prose", "script", "script", [],
  ["ac.task-commits"])
R("st.hashacceptance", "Acceptance hash covers docs and tasks", "script", "ST", "257-278",
  "Hash of every route stage's hash plus the sorted done/ filenames", "a confirmed acceptance surviving a later doc or task change",
  ["none"], "", "script", "script", ["st.hashstage", "st.donetasks"])
R("st.loadstate-missingdir", "Missing mise directory fails", "script", "ST", "280-283",
  "A missing mise directory is an error", "unstated", ["none"], "", "script", "script")
R("st.loadstate-fresh", "Fresh start versus lost state file", "script", "ST", "285-300",
  "No state file with at most goals.md initializes empty state; later artifacts mean it was lost",
  "rebuilding lost state by inference", ["none"], "", "script", "script", ["st.brokenhint"])
R("st.writestate", "Single writer of the state file", "script", "ST", "311-313",
  "All persistence goes through one write path", "two writers disagreeing on format",
  ["none"], "", "script", "script")
R("st.report-inflight", "in_flight from directory contents", "script", "ST", "317-320",
  "Work is in flight exactly when the mise directory exists with content", "unstated",
  ["none"], "", "script", "script", [], ["cfg.misedir-inflight", "cm.no-pr-inflight"])
R("st.report-verdicts", "Per-stage approved/unapproved/mismatch", "script", "ST", "332-351",
  "Recomputes each route stage's hash and assigns approved, unapproved or mismatch",
  "acting on an approval given to different bytes", ["none"], "", "script", "script",
  ["st.hashstage"])
R("st.report-cascade", "Mismatch cascade reopens later stages", "script", "ST", "356-367",
  "The first mismatch deletes every later stage's approval; the mismatched stage keeps its entry",
  "a later approval reviewed against a doc that has since changed", ["none"],
  "re-runs every later stage", "script", "script", ["st.report-verdicts"])
R("st.report-accepted-clear", "Mismatch clears recorded acceptance", "script", "ST", "375-378",
  "A mismatch deletes the accepted record outright", "a doc revert resurrecting an acceptance",
  ["none"], "", "script", "script", ["st.report-cascade"])
R("st.report-next-stage", "next_action is the first unapproved stage", "script", "ST", "385-388",
  "Reports stage:<first stage not approved> as next_action", "unstated", ["none"], "",
  "script", "script", [], ["rm.cmd-next"])
R("st.report-tasks", "Done filtered to Task Index", "script", "ST", "390-392",
  "Only done/ IDs present in the Task Index count; the rest are ignored",
  "a stale done/ file skipping planned work", ["none"], "", "script", "script",
  ["st.taskindex", "st.donetasks"])
R("st.report-acceptance-closeout", "acceptance versus close_out", "script", "ST", "394-398",
  "All tasks done reports acceptance, or close_out when the accepted hash still matches",
  "re-running the acceptance pass after an interrupted close-out", ["subagent-spawn"],
  "decides whether the acceptance subagent spawns", "script", "script",
  ["st.hashacceptance"])
R("st.report-execute", "Tasks remaining means stage:execute", "script", "ST", "399-401",
  "Any remaining Task Index ID routes to the execute stage", "unstated", ["none"], "",
  "script", "script", ["st.report-tasks"])
R("st.report-write", "Read-only unless --write", "script", "ST", "404-420",
  "Persists only with --write; otherwise reports pending_writes", "a read accidentally mutating state",
  ["none"], "", "script", "script")
R("st.approve-goals-route", "Goals approval requires a route", "script", "ST", "427-437",
  "approve goals demands route=full|direct|bugfix; other stages reject a route argument",
  "a goals approval with no recorded route", ["none"], "", "script", "script", [],
  ["st.parse-goals-route"])
R("st.approve-artifact", "Cannot approve a missing artifact", "script", "ST", "439-445",
  "Approval fails when the stage's artifact files are missing", "unstated", ["none"], "",
  "script", "script", ["st.hashstage"])
R("st.approve-route-member", "Stage must be on the route", "script", "ST", "447-451",
  "Approving a stage outside this feature's route fails", "approving mock on a direct run",
  ["none"], "", "script", "script", ["st.stageorder"])
R("st.approve-cascade", "Changed re-approval reopens later stages", "script", "ST", "453-469",
  "A re-approval with a new hash deletes every later stage's approval",
  "downstream artifacts built from a superseded upstream doc", ["loop-multiplier"],
  "re-runs every later stage", "script", "script", [], ["st.report-cascade"])
R("st.approve-cleardone", "Plan re-approval clears done/", "script", "ST", "476-484",
  "A plan approval whose hash differs from the recorded one deletes implementation_plan/done/",
  "executing a revised plan against another plan version's completion record",
  ["loop-multiplier"], "re-executes every task of the revised plan", "script", "script",
  ["st.donetasks"])
R("st.approve-clearaccepted", "Changed approval clears acceptance", "script", "ST", "490-494",
  "Recording a different hash than before deletes the accepted record",
  "a byte-identical revert resurrecting an acceptance", ["none"], "", "script", "script", [],
  ["st.report-accepted-clear"])
R("st.acc-stages", "Acceptance needs valid approvals", "script", "ST", "512-523",
  "approve acceptance fails unless every route stage is approved at its current hash",
  "recording acceptance over an unapproved doc", ["none"], "", "script", "script",
  ["st.hashstage"])
R("st.acc-tasks", "Acceptance needs every task done", "script", "ST", "525-535",
  "approve acceptance fails with no Task Index or any remaining task", "accepting unfinished work",
  ["none"], "", "script", "script", ["st.taskindex", "st.donetasks"])
R("st.acc-record", "Acceptance record written once", "script", "ST", "538-543",
  "Stores the composite acceptance hash and writes state", "unstated", ["none"], "",
  "script", "script", ["st.hashacceptance"])
R("st.stage-validate", "Stage argument validated", "script", "ST", "546-554",
  "Rejects any approve target that is not a known stage or acceptance", "unstated", ["none"],
  "", "script", "script")
R("st.node24", "Node 24 or newer required", "script", "ST", "556-562",
  "Fails immediately on Node older than 24", "running TypeScript on a Node that cannot",
  ["none"], "", "script", "script", [], ["rm.node24"])
R("st.cli", "Command and directory required", "script", "ST", "564-568",
  "Fails with a usage line when cmd or mise-dir is missing", "unstated", ["none"], "",
  "script", "script")
R("st.route-arg-parse", "Argument parsing for approve", "script", "ST", "578-582",
  "Takes the first non-flag argument as the stage and route= as the route", "unstated",
  ["none"], "", "script", "script")
R("st.acceptance-arg", "approve acceptance rejects a route", "script", "ST", "584-588",
  "Passing route= with acceptance fails", "unstated", ["none"], "", "script", "script",
  ["st.route-arg-parse"])
R("st.dispatch", "Only report and approve exist", "script", "ST", "572-599",
  "Dispatches report or approve; any other command fails", "unstated", ["none"], "",
  "script", "script")


# ---------------------------------------------------------------- emit
def parse_lines(spec):
    if "-" in spec:
        a, b = spec.split("-")
        return int(a), int(b)
    return int(spec), int(spec)


def main():
    keys = [r["key"] for r in ROWS]
    if len(set(keys)) != len(keys):
        dupes = [k for k in keys if keys.count(k) > 1]
        sys.exit(f"duplicate keys: {sorted(set(dupes))}")
    ids = {k: f"MR-{i + 1:03d}" for i, k in enumerate(keys)}

    out_rows = []
    for r in ROWS:
        a, b = parse_lines(r["lines"])
        for ref in r["dep"] + r["ov"]:
            if ref not in ids:
                sys.exit(f"{r['key']}: unknown reference {ref}")
        out_rows.append(OrderedDict([
            ("id", ids[r["key"]]),
            ("name", r["name"]),
            ("kind", r["kind"]),
            ("file", FILES[r["fcode"]]),
            ("lines", r["lines"]),
            ("lineCount", b - a + 1),
            ("does", r["does"]),
            ("preventsClaim", r["prevents"]),
            ("runtimeCost", r["cost"]),
            ("costNote", r["costnote"]),
            ("enforcedBy", r["enf"]),
            ("firesWhen", r["fires"]),
            ("dependsOn", [ids[x] for x in r["dep"]]),
            ("overlapsWith", [ids[x] for x in r["ov"]]),
        ]))

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "mise-roles.jsonl"), "w") as fh:
        for row in out_rows:
            fh.write(json.dumps(row) + "\n")

    # coverage check (md files only)
    gaps = {}
    for code, rel in FILES.items():
        if rel.endswith(".ts"):
            continue
        path = os.path.join(REPO, rel)
        text = open(path).read().split("\n")
        nonblank = {i + 1 for i, line in enumerate(text) if line.strip()}
        covered = set()
        for r in ROWS:
            if r["fcode"] != code:
                continue
            a, b = parse_lines(r["lines"])
            covered |= set(range(a, b + 1))
        missing = sorted(nonblank - covered)
        over = sorted(covered - set(range(1, len(text) + 1)))
        if missing or over:
            gaps[rel] = {"uncovered": missing, "out_of_range": over}
    return out_rows, gaps


if __name__ == "__main__":
    rows, gaps = main()
    print(json.dumps({"rows": len(rows), "coverage_gaps": gaps}, indent=2))
