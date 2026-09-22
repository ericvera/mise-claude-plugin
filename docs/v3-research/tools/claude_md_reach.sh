#!/bin/bash
# Does project CLAUDE.md / checklist / config text appear inside subagent
# (isSidechain:true) records of Claude Code transcripts for okven + worktrees?
# Aggregate counts only; no transcript content is printed.
set -u
FILES=$(ls /Users/eric/.claude/projects/-Users-eric-Code-okven*/*.jsonl 2>/dev/null)
side_total=0; main_total=0; nfiles=0
for f in $FILES; do
  nfiles=$((nfiles+1))
  s=$(grep -c '"isSidechain":true' "$f" | tr -d ' \n'); m=$(grep -c '"isSidechain":false' "$f" | tr -d ' \n')
  side_total=$((side_total+s)); main_total=$((main_total+m))
done
echo "files=$nfiles sidechain_records=$side_total main_records=$main_total"
while IFS='|' read -r label pat; do
  side=0; main=0
  for f in $FILES; do
    s=$(grep '"isSidechain":true' "$f" | grep -cF "$pat" | tr -d ' \n')
    m=$(grep '"isSidechain":false' "$f" | grep -cF "$pat" | tr -d ' \n')
    side=$((side+s)); main=$((main+m))
  done
  echo "$label sidechain=$side main=$main"
done <<'PATS'
root_claude_md|# Okven Development Guide
functions_claude_md|Package-specific guidance for `functions/`
hosting_claude_md|Package-specific guidance for `hosting/`
packages_claude_md|Conventions for the shared `packages/*` workspaces
checklist|Answer all 15 rules
mise_config|# Mise Configuration
role_dispatch|Read and follow the instructions at
doc_style_rules|Doc Style (comments & docs)
inline_snapshot_rule|Always use inline snapshots
PATS
