#!/bin/bash
# For every recorded subagent transcript in the okven repo + worktrees, classify
# the subagent by the mise role file its dispatch prompt names, then report how
# often each instruction source is present (a) in the first 3 records, which is
# where harness-injected context lands, and (b) anywhere in the transcript,
# which also covers the subagent Reading the file itself.
# Aggregate counts only; no transcript content is printed.
set -u
out=${1:-/dev/stdout}
: > "$out"
find /Users/eric/.claude/projects/-Users-eric-Code-okven*/ -mindepth 2 -path '*/subagents/*.jsonl' |
while read -r f; do
  head1=$(head -c 200000 "$f")
  role=other
  case "$head1" in
    *roles/implementer.md*) role=implementer ;;
    *roles/documenter.md*) role=documenter ;;
    *roles/reviewer.md*) role=reviewer ;;
    *roles/critic.md*) role=critic ;;
    *roles/acceptance.md*) role=acceptance ;;
    *roles/retrospective.md*) role=retrospective ;;
  esac
  first=$(head -n 3 "$f")
  for pair in \
    "rootclaude:# Okven Development Guide" \
    "funcclaude:Package-specific guidance for \`functions/\`" \
    "hostclaude:Package-specific guidance for \`hosting/\`" \
    "pkgclaude:Conventions for the shared \`packages/*\` workspaces" \
    "checklist:Answer all 15 rules" \
    "miseconfig:# Mise Configuration" \
    "docstyle:Doc Style (comments & docs)" \
    "inlinesnap:Always use inline snapshots" \
    "uiconv:UI Conventions (hosting/)" ; do
    key=${pair%%:*}; pat=${pair#*:}
    inj=0; any=0
    printf '%s' "$first" | grep -qF "$pat" && inj=1
    grep -qF "$pat" "$f" && any=1
    echo "$role $key $inj $any"
  done
done | awk '{k=$1" "$2; inj[k]+=$3; any[k]+=$4; n[$1]++} END {for (r in n) files[r]=n[r]/9; for (k in inj) {split(k,a," "); printf "%s %s files=%d injected_first3=%d present_anywhere=%d\n", a[1], a[2], files[a[1]], inj[k], any[k]}}' | sort >> "$out"
