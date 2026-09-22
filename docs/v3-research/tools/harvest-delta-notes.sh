#!/bin/bash
# Harvest every Delta Review note (live notes file + archive) from every
# <git-common-dir>/delta-review store under /Users/eric/Code, joined with the
# agent responses keyed by noteId. Emits raw JSONL on stdout, one row per note.
# Read-only: only jq + non-mutating git.
set -uo pipefail

for store in $(find /Users/eric/Code -maxdepth 4 -type d -path '*/.git/delta-review' | sort); do
  repodir=${store%/.git/delta-review}
  repo=$(basename "$repodir")
  for nf in "$store"/notes-*.json "$store"/archive-*.json; do
    [ -e "$nf" ] || continue
    base=$(basename "$nf")
    case "$base" in
      notes-*) src=live; sb=${base#notes-}; ;;
      archive-*) src=archive; sb=${base#archive-}; ;;
    esac
    sb=${sb%.json}
    rf="$store/responses-$sb.json"
    [ -e "$rf" ] || rf=/dev/null
    jq -c -n --slurpfile n "$nf" --slurpfile r "$rf" \
       --arg repo "$repo" --arg sb "$sb" --arg src "$src" --arg store "$nf" '
      ($r[0].responses // []) as $resp
      | ($n[0].notes // [])[]
      | . as $note
      | ($resp | map(select(.noteId == $note.id))) as $mine
      | {
          repo: $repo,
          sanitizedBranch: $sb,
          source: $src,
          storeFile: $store,
          id: $note.id,
          file: $note.file,
          side: $note.side,
          line: $note.startLine,
          endLine: $note.endLine,
          date: ($note.createdAt // ($note.turns[0].at // null)),
          deletedAt: ($note.deletedAt // null),
          turnCount: ($note.turns | length),
          noteText: ([$note.turns[].text] | join("\n<<<turn>>>\n")),
          responseCount: ($mine | length),
          response: ([$mine[].response] | join("\n<<<turn>>>\n")),
          status: $note.status,
          outdated: $note.outdated
        }'
  done
done
