#!/bin/bash
# For each sha on stdin, print: sha|date|branches|files|+ins|-del|in-mise-run|subject
# branches = refs/heads/* containing the commit (Delta Review refs excluded).
REPO=${1:-/Users/eric/Code/okven}
while read -r sha; do
  [ -z "$sha" ] && continue
  d=$(git -C "$REPO" show -s --format=%ad --date=short "$sha")
  s=$(git -C "$REPO" show -s --format=%s "$sha")
  b=$(git -C "$REPO" branch --contains "$sha" --format='%(refname:short)' 2>/dev/null | paste -sd, -)
  st=$(git -C "$REPO" show --numstat --format='' "$sha" |
    awk -F'\t' 'NF==3 && $1!="-"{f++; a+=$1; d+=$2} END{printf "%d|%d|%d", f, a, d}')
  m=$(git -C "$REPO" cat-file -e "$sha:.mise" 2>/dev/null && echo yes || echo no)
  echo "$sha|$d|$b|$st|$m|$s"
done
