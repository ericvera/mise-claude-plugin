#!/bin/bash
# Find, for each rule phrase, every commit that added or removed it in Okven's
# agent-instruction files. Excludes refs/review/* (Delta Review editor-state
# autosave refs, not authored commits).
# Usage: rule_timeline.sh [repo]
REPO=${1:-/Users/eric/Code/okven}
PATHS=('*CLAUDE.md' '.claude/*')
phrases=(
  'Always use inline snapshots'
  'No drilling inside'
  'Never bulk-regenerate snapshots'
  'Snapshot the whole send'
  'Never read Firestore in a test'
  'toMatchInlineSnapshot'
  'JSDoc grounds the reader'
  'Comment and doc register'
  'Comment line width'
  'doc-style'
  'Every comment explains why'
  'None restates the code'
  'Comments on line above code'
  'writing-style'
)
for p in "${phrases[@]}"; do
  echo "### $p"
  git -C "$REPO" log --branches --remotes --format='%H|%ad|%s' --date=short \
    -S"$p" -- "${PATHS[@]}" | grep -v 'delta-review' | cut -c1-150
  echo
done
