#!/bin/bash
# Emits JSONL: one row per commit that touches mise mechanism paths.
# Fields: sha, date, subject, body, version (plugin.json in effect at that commit),
#         skillsAdded/skillsRemoved (numstat over skills/ + .claude/skills/), files[]
# Usage: commit_table.sh > ../inventory/_commits.jsonl
set -euo pipefail
REPO=/Users/eric/Code/mise-claude-plugin
cd "$REPO"

PATHS=(skills/ docs/ README.md CLAUDE.md .claude-plugin/plugin.json .claude/)

git log --all --reverse --format='%H%x09%ad' --date=short -- "${PATHS[@]}" |
while IFS=$'\t' read -r sha date; do
  ver=$(git show "$sha:.claude-plugin/plugin.json" 2>/dev/null |
        python3 -c 'import sys,json;
try:
    print(json.load(sys.stdin).get("version",""))
except Exception:
    print("")' 2>/dev/null || echo "")
  subject=$(git log -1 --format='%s' "$sha")
  body=$(git log -1 --format='%b' "$sha")
  stats=$(git show --numstat --format='' "$sha" -- skills/ .claude/skills/ 2>/dev/null |
          awk '{a+=$1; r+=$2} END {printf "%d %d", a+0, r+0}')
  add=${stats% *}; rem=${stats#* }
  files=$(git show --name-only --format='' "$sha" -- "${PATHS[@]}" | grep -v '^$' | paste -sd'|' -)
  python3 - "$sha" "$date" "$ver" "$subject" "$body" "$add" "$rem" "$files" <<'PY'
import sys, json
sha, date, ver, subject, body, add, rem, files = sys.argv[1:9]
print(json.dumps({
  "sha": sha[:7], "fullSha": sha, "date": date, "version": ver,
  "subject": subject, "body": body,
  "skillsAdded": int(add or 0), "skillsRemoved": int(rem or 0),
  "files": [f for f in files.split("|") if f],
}))
PY
done
