#!/bin/bash
# Per branch store: how many notes survive (live + archive) vs how many distinct
# noteIds the responses file still answers. A responses entry whose noteId has no
# surviving note means the note text is gone (explicit delete, never archived).
set -uo pipefail
printf 'repo\tbranch\tliveNotes\tarchivedNotes\tdistinctRespondedIds\torphanRespondedIds\n'
for store in $(find /Users/eric/Code -maxdepth 4 -type d -path '*/.git/delta-review' | sort); do
  repo=$(basename "${store%/.git/delta-review}")
  for rf in "$store"/responses-*.json; do
    [ -e "$rf" ] || continue
    sb=$(basename "$rf"); sb=${sb#responses-}; sb=${sb%.json}
    nf="$store/notes-$sb.json"; af="$store/archive-$sb.json"
    live=$( [ -e "$nf" ] && jq '.notes|length' "$nf" || echo 0 )
    arch=$( [ -e "$af" ] && jq '.notes|length' "$af" || echo 0 )
    ids=$( { [ -e "$nf" ] && jq -r '.notes[].id' "$nf"; [ -e "$af" ] && jq -r '.notes[].id' "$af"; } | sort -u )
    rids=$(jq -r '.responses[].noteId' "$rf" | sort -u)
    nr=$(printf '%s\n' "$rids" | grep -c . )
    orph=$(comm -23 <(printf '%s\n' "$rids") <(printf '%s\n' "$ids") | grep -c . )
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$repo" "$sb" "$live" "$arch" "$nr" "$orph"
  done
done
