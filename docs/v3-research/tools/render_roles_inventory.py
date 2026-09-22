#!/usr/bin/env python3
"""Renders docs/v3-research/inventory/mise-roles.md from mise-roles.jsonl.

Count tables are computed from the JSONL; the config-knob and state.ts sections
carry hand-verified cites (every value read from the cited file:line).
"""

import json
import os
from collections import Counter, OrderedDict, defaultdict

REPO = "/Users/eric/Code/mise-claude-plugin"
INV = os.path.join(REPO, "docs/v3-research/inventory")

ROLE_FILES = OrderedDict([
    ("skills/next/roles/critic.md", "critic"),
    ("skills/next/roles/reviewer.md", "reviewer"),
    ("skills/next/roles/acceptance.md", "acceptance"),
    ("skills/next/roles/documenter.md", "documenter"),
    ("skills/next/roles/implementer.md", "implementer"),
    ("skills/next/roles/retrospective.md", "retrospective"),
])

SHARED = OrderedDict([
    ("skills/next/references/config-reference.md",
     "setup stage only (never shipped into a project)"),
    (".claude/mise-config.md",
     "every stage + every subagent (all 7 roles)"),
    (".claude/mise-checklist.md",
     "implementer, documenter, reviewer, acceptance, retrospective"),
    ("docs/skill-authoring.md",
     "any role touching instruction files, via mise-config.md:25 (not required)"),
    ("CLAUDE.md", "every session in this repo"),
    ("README.md", "the user only — never loaded by the workflow"),
    ("skills/next/scripts/state.ts", "the orchestrator, as a Bash command"),
])


def load():
    rows = []
    with open(os.path.join(INV, "mise-roles.jsonl")) as fh:
        for line in fh:
            rows.append(json.loads(line))
    return rows


def span(spec):
    if "-" in spec:
        a, b = spec.split("-")
        return set(range(int(a), int(b) + 1))
    return {int(spec)}


def table(head, body):
    out = ["| " + " | ".join(head) + " |",
           "| " + " | ".join("---" for _ in head) + " |"]
    for r in body:
        out.append("| " + " | ".join(str(c) for c in r) + " |")
    return "\n".join(out)


CONFIG_KNOBS = [
    # knob, defined at, default per reference, this repo, okven, overridden?
    ("Mise directory", "config-reference.md:75", "suggested `.mise/`",
     "`.mise/` (mise-config.md:3)", "`.mise/` (okven:3)", "no"),
    ("Branch convention", "config-reference.md:76",
     "no default; example `feat/<slug>`, `fix/<slug>`",
     "example verbatim (:4)", "example verbatim (okven:4)", "no"),
    ("Checklist", "config-reference.md:77",
     "suggested `.claude/mise-checklist.md`; shape `<rule> — <how to check>`, cap 15, never blocking",
     "`.claude/mise-checklist.md`, 6 rules, 103 words, 6/6 use ` — ` (:5)",
     "`.claude/mise-checklist.md`, 15 rules (at cap), 821 words, 3/15 use ` — ` (okven:5)",
     "**yes** — okven sits at the cap and abandons the one-line rule shape"),
    ("Format", "config-reference.md:78", "no default; a run command or list",
     "`yarn format` (:10)",
     "prose, not a command: 'handled by the lint-staged pre-commit hook … no repo-wide format run' (okven:10)",
     "**yes** — slot holds prose where the reference says run command"),
    ("Check", "config-reference.md:78", "no default; 'lint + typecheck'",
     "`yarn typecheck` only, no lint (:11)", "list: `yarn build-tsc`, `yarn lint` (okven:11-13)", "no"),
    ("Unit tests", "config-reference.md:78", "no default; unscoped full-suite command",
     "`yarn test` (:12)",
     "`yarn test <path> from the closest package directory; … yarn test:up first` (okven:14) — carries the `<path>` placeholder the reference reserves for Task tests",
     "**yes** — scoped placeholder in the unscoped slot"),
    ("Task tests", "config-reference.md:78", "optional; omitted means every task runs full Unit tests",
     "**omitted** (:8-12) — every task runs `yarn test` in full",
     "set, same text as Unit tests (okven:15)", "differs between the two configs"),
    ("Mock conditions", "config-reference.md:84", "no default; omitted means never route `full`",
     "omitted", "2 conditions (okven:26-27)", "n/a"),
    ("Mock guidance", "config-reference.md:85", "no default", "omitted",
     "2 non-blank lines, 94 words; the second (okven:33) is a behavioral rule for later rounds, not guidance on how mocks look",
     "**yes** — instructional prose in a config the reference says holds values only (config-reference.md:5-6)"),
    ("Test conventions", "config-reference.md:86", "no default; pointer preferred",
     "inline, 1 line (:16)", "pointer to 3 CLAUDE.md files (okven:37)", "no"),
    ("Test exceptions", "config-reference.md:87",
     "suggested default entry: purely-visual → screenshots",
     "2 entries, neither the suggested one (:20-21)",
     "4 entries; the suggested one adapted (okven:41); entry 4 (okven:44) is an 85-word scope paragraph, not `condition — alternative verification`",
     "**yes** — entry format abandoned in okven"),
    ("Skills & guides", "config-reference.md:88", "no default; `required` means never bypassed",
     "2 doc entries, 0 required (:25-26)", "12 entries, 7 `required` (okven:48-59)", "n/a"),
    ("Models — implementer", "config-reference.md:89", "`session`", "`opus` (:34)", "`opus` (okven:63)", "**yes** in both"),
    ("Models — reviewer", "config-reference.md:89", "`session`", "session (absent)", "`opus` (okven:64)", "**yes** in okven"),
    ("Models — critic", "config-reference.md:89", "`session`", "session (absent)", "`opus` (okven:65)", "**yes** in okven"),
    ("Models — acceptance", "config-reference.md:89", "`session`", "session (absent)", "`opus` (okven:66)", "**yes** in okven"),
    ("Models — explore", "config-reference.md:89", "`session`", "`opus` (:35)", "`opus` (okven:67)", "**yes** in both"),
    ("Models — documenter", "config-reference.md:89",
     "`session`; **presence of the line turns two-pass mode on**",
     "absent → two-pass OFF", "`fable` (okven:68) → two-pass ON", "**yes** in okven"),
    ("Models — retrospective", "config-reference.md:89", "`session`", "`opus` (:36)", "`opus` (okven:69)", "**yes** in both"),
    ("Database migrations", "config-reference.md:90", "omitted", "omitted", "omitted", "no"),
    ("Backlog", "config-reference.md:91", "omitted", "omitted", "Todoist MCP, named project/sections (okven:73)", "n/a"),
    ("Review notes", "config-reference.md:92", "omitted", "Delta Review (:30)", "Delta Review (okven:77)", "n/a"),
    ("Retrospective", "config-reference.md:93", "omitted = **on**", "omitted → on", "omitted → on", "no"),
    ("Ship", "config-reference.md:94", "omitted = close-out asks each time",
     "`merge (squash)` (:6)", "`pr` (okven:6)", "**yes** in both"),
]

UNDOCUMENTED = [
    ("`## Git`", "okven:19-22",
     "4 lines of rebase/push/commit instructions — a section the reference has no slot for"),
    ("`Flaky under machine load:` bullet", "okven:16",
     "a 4th bullet inside `## Quality commands`, not one of the four named slots"),
    ("`Dependencies:` bullet", "okven:17",
     "a 5th bullet inside `## Quality commands`, not one of the four named slots"),
]

# keyed by the row's state.ts line range so ids stay in sync with the JSONL
STATE_PROSE = {
    "1-36": "docs/state-machine.md:1-79 (the whole file is the same spec)",
    "48-59": "state-machine.md:43-48 (stage → artifact table)",
    "67-68": "state-machine.md:54",
    "70-73": "state-machine.md:72, 75; SKILL.md:41 (never apply its rules by hand)",
    "82-92": "state-machine.md:35-41 (route table); README.md:48 (bugfix shortened route)",
    "97-111": "state-machine.md:50",
    "116-136": "state-machine.md:75",
    "138-146": "state-machine.md:31, 75",
    "148-168": "state-machine.md:31, 75",
    "170-179": "state-machine.md:31",
    "181-183": "state-machine.md:13, 75",
    "192-208": "state-machine.md:31",
    "212-229": "state-machine.md:54",
    "233-251": "state-machine.md:54; stages/execute.md:10; state.ts:31-33 (its own comment)",
    "257-278": "state-machine.md:15, 64, 68",
    "285-300": "state-machine.md:74",
    "311-313": "state-machine.md:3; SKILL.md:41, 118",
    "317-320": "state-machine.md:11, 31; SKILL.md:68, 73; config-reference.md:75; CLAUDE.md:3",
    "332-351": "state-machine.md:62",
    "356-367": "state-machine.md:62; references/interaction.md:13",
    "375-378": "state-machine.md:15, 64",
    "385-388": "state-machine.md:63; README.md:31",
    "390-392": "state-machine.md:56, 64",
    "394-398": "state-machine.md:64, 66; stages/execute.md:83",
    "399-401": "state-machine.md:64",
    "404-420": "state-machine.md:11-12; SKILL.md:61, 118",
    "427-437": "state-machine.md:13; references/interaction.md:13",
    "453-469": "state-machine.md:14; references/interaction.md:13",
    "476-484": "state-machine.md:14, 56; stages/plan.md:9; references/interaction.md:67",
    "490-494": "state-machine.md:15",
    "512-523": "state-machine.md:15",
    "525-535": "state-machine.md:15",
    "538-543": "state-machine.md:15",
    "556-562": "state-machine.md:3; README.md:17; SKILL.md:60",
    "572-599": "state-machine.md:9-15 (command table)",
    "578-582": "state-machine.md:14 (route accompanies only goals)",
    "584-588": "state-machine.md:14-15",
}


def main():
    rows = load()
    by_id = {r["id"]: r for r in rows}

    parts = ["# mise roles, config surface and state engine — line-level inventory",
             "",
             f"Rows: **{len(rows)}** over 13 files "
             "(`docs/v3-research/inventory/mise-roles.jsonl`). Every non-blank line of the "
             "12 markdown files is inside at least one row (checked by "
             "`tools/build_roles_inventory.py`); `state.ts` is one row per enforced "
             "invariant, transition or command. Rows share line ranges where one line "
             "carries several instructions, so `lineCount` sums exceed file lengths; the "
             "\"distinct lines\" column is the deduplicated count.",
             "",
             "`runtimeCost` convention: a plain instruction inside a role file is `none` "
             "(it costs only words in a context that spawns anyway). `subagent-spawn` marks "
             "the row that causes a spawn, `tool-run` a row mandating a command, "
             "`loop-multiplier` a row that creates iteration, `driver-context` a file the "
             "orchestrator itself loads, `human-wait` a row that blocks on the user.",
             "", "## 1. Counts", "", "### By kind", ""]

    kind_rows = []
    for kind, n in Counter(r["kind"] for r in rows).most_common():
        sel = [r for r in rows if r["kind"] == kind]
        lc = sum(r["lineCount"] for r in sel)
        distinct = set()
        for r in sel:
            distinct |= {(r["file"], ln) for ln in span(r["lines"])}
        kind_rows.append((kind, len(sel), lc, len(distinct)))
    parts.append(table(["kind", "rows", "sum lineCount", "distinct lines"], kind_rows))

    parts += ["", "### By file / role", ""]
    file_rows = []
    for f in list(ROLE_FILES) + list(SHARED):
        sel = [r for r in rows if r["file"] == f]
        total = len(open(os.path.join(REPO, f)).read().rstrip("\n").split("\n"))
        nonblank = len([l for l in open(os.path.join(REPO, f)) if l.strip()])
        glue = len([r for r in sel if r["kind"] == "glue"])
        spawns = len([r for r in sel if "subagent-spawn" in r["runtimeCost"]])
        role = ROLE_FILES.get(f, "—")
        file_rows.append((f, role, total, nonblank, len(sel), len(sel) - glue, glue, spawns))
    parts.append(table(
        ["file", "role", "lines", "non-blank", "rows", "behavioural", "glue",
         "rows w/ spawn cost"], file_rows))

    parts += ["", "### Reach of the shared files", "",
              table(["file", "read by"], [(f, who) for f, who in SHARED.items()])]

    parts += ["", "### Cost-bearing rows (non-`none` runtimeCost)", ""]
    cost_rows = []
    costs = Counter()
    for r in rows:
        for c in r["runtimeCost"]:
            costs[c] += 1
    for c, n in costs.most_common():
        cost_rows.append((c, n))
    parts.append(table(["runtimeCost", "rows"], cost_rows))

    parts += ["", "## 2. Per role: what it is told to check or produce", "",
              "`also checked by` lists every other row whose `overlapsWith` ties it to the "
              "same failure or instruction; a row naming 2+ other roles is a duplicated "
              "check.", ""]

    # cross-role duplication, counted on direct overlap links only
    links = set()
    for r in rows:
        for o in r["overlapsWith"]:
            links.add(tuple(sorted((r["id"], o))))
    pair = Counter()
    for a, b in links:
        ra, rb = ROLE_FILES.get(by_id[a]["file"]), ROLE_FILES.get(by_id[b]["file"])
        if ra and rb and ra != rb:
            pair[tuple(sorted((ra, rb)))] += 1
    incoming = defaultdict(set)
    for r in rows:
        for o in r["overlapsWith"]:
            incoming[o].add(r["file"])
    multi = []
    for r in rows:
        if r["file"] not in ROLE_FILES:
            continue
        nb = {by_id[o]["file"] for o in r["overlapsWith"]} | incoming[r["id"]]
        roles = {ROLE_FILES[f] for f in nb if f in ROLE_FILES}
        if len(roles) >= 2:
            multi.append((len(roles), r["id"], r["name"], ", ".join(sorted(roles))))
    multi.sort(key=lambda x: (-x[0], x[1]))
    parts += [f"**{sum(pair.values())} direct cross-role duplication links**; "
              f"**{len(multi)}** of the {sum(1 for r in rows if r['file'] in ROLE_FILES and r['kind'] != 'glue')} "
              "behavioural role rows restate something 2+ other roles are also told.", "",
              table(["role pair", "shared instructions"],
                    [(" ↔ ".join(k), v) for k, v in pair.most_common()]), "",
              "Role rows duplicated across 2+ other roles:", "",
              table(["other roles", "id", "instruction", "also in"],
                    [(m[0], m[1], m[2], m[3]) for m in multi]), ""]

    for f, role in ROLE_FILES.items():
        sel = [r for r in rows if r["file"] == f and r["kind"] != "glue"]
        parts += [f"### {role} (`{f}`, {len(sel)} behavioural rows)", ""]
        body = []
        for r in sel:
            others = []
            for oid in r["overlapsWith"]:
                o = by_id[oid]
                tag = ROLE_FILES.get(o["file"])
                if tag is None:
                    tag = os.path.basename(o["file"]).replace(".md", "").replace(".ts", "")
                others.append(f"{tag}:{o['id']}")
            # incoming overlaps too
            for other in rows:
                if r["id"] in other["overlapsWith"] and other["file"] != f:
                    tag = ROLE_FILES.get(other["file"])
                    if tag is None:
                        tag = os.path.basename(other["file"]).replace(".md", "").replace(".ts", "")
                    label = f"{tag}:{other['id']}"
                    if label not in others:
                        others.append(label)
            body.append((r["id"], r["lines"], r["name"], r["does"],
                         ", ".join(sorted(set(others))) or "—"))
        parts.append(table(["id", "line", "name", "does", "also checked by"], body))
        parts.append("")

    st_rows = [r for r in rows if r["file"].endswith(".ts")]
    st_with = [(f"{r['id']} {r['name']}", f"state.ts:{r['lines']}", STATE_PROSE[r["lines"]])
               for r in st_rows if r["lines"] in STATE_PROSE]
    st_without = [(f"{r['id']} {r['name']}", f"state.ts:{r['lines']}")
                  for r in st_rows if r["lines"] not in STATE_PROSE]
    unknown = set(STATE_PROSE) - {r["lines"] for r in st_rows}
    if unknown:
        raise SystemExit(f"stale STATE_PROSE keys: {sorted(unknown)}")

    parts += ["## 3. Config knobs: defaults and overrides", "",
              "Default = what `skills/next/references/config-reference.md` states for an "
              "omitted knob, or the value it tells setup to suggest. okven = "
              "`/Users/eric/Code/okven/.claude/mise-config.md` (77 lines, 698 words, vs the "
              "reference's 57-line example and this repo's 36-line config).", "",
              table(["knob", "defined at", "default", "this repo", "okven", "overridden?"],
                    CONFIG_KNOBS),
              "",
              "### Sections okven carries that the reference defines nowhere", "",
              table(["section", "lines", "what it holds"], UNDOCUMENTED),
              "",
              "Summary: of the 24 knob rows above, okven overrides the default on **13** "
              "(Checklist shape, Format, Unit tests, Mock guidance, Test exceptions, Ship, "
              "and all 7 Models lines — including `documenter`, which switches two-pass mode "
              "on, and the three gate roles the reference expects to stay on the session "
              "model); this repo's own config overrides **4** (Ship, plus the implementer, "
              "explore and retrospective models) and omits `Task tests`, so every task here "
              "runs the full unit suite. Neither config sets `Retrospective: off`. "
              "okven adds 3 config surfaces (`## Git`, and two extra `## Quality commands` "
              "bullets) that no stage or role file is written to read.",
              "",
              "## 4. What `state.ts` enforces that prose also restates", "",
              f"{len(st_with)} of the {len(st_rows)} state-engine "
              "rows have a prose restatement somewhere in the repo — overwhelmingly in "
              "`docs/state-machine.md`, a 79-line file whose stated purpose "
              "(state-machine.md:3) is to be the engine's specification. "
              "`docs/state-machine.md` is also a registered guide "
              "(`.claude/mise-config.md:26`), so it is pulled into a subagent's context "
              "whenever `state.ts` is touched.", "",
              table(["invariant", "code", "prose restating it"], st_with), "",
              "### Enforced in code with no prose restatement found", "",
              table(["invariant", "code"], st_without), "",
              "Restatements that reach a runtime context (not just maintainer docs): "
              "`SKILL.md:41, 60, 61, 68, 73, 118`, `references/interaction.md:13, 67`, "
              "`stages/execute.md:10, 83`, `stages/plan.md:9`, "
              "`references/config-reference.md:75`, `CLAUDE.md:3`, `README.md:17, 31, 48` — "
              "16 lines across 7 files restating engine behaviour the engine already "
              "computes and reports.", ""]

    with open(os.path.join(INV, "mise-roles.md"), "w") as fh:
        fh.write("\n".join(parts).rstrip() + "\n")
    print("wrote mise-roles.md")


if __name__ == "__main__":
    main()
