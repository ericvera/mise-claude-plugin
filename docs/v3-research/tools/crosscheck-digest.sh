#!/bin/bash
# crosscheck-digest.sh <session.jsonl>
# Independent (jq/grep/awk) recount of the numbers digest-transcript.mjs reports,
# so the two can be compared without sharing any code path.
set -u
F="$1"
S="${F%.jsonl}"

echo "file: $F"
echo "bytes: $(stat -f %z "$F")"
echo "lines: $(wc -l < "$F" | tr -d ' ')"

# A single API response is written as several JSONL rows carrying *progressive*
# usage, so the only correct roll-up is max-per-message.id, then sum per model.
MAXBYID='{id=$1; m[id]=$2;
  if($3>i[id])i[id]=$3; if($4>r[id])r[id]=$4; if($5>c[id])c[id]=$5; if($6>o[id])o[id]=$6}
  END{for(k in m){n[m[k]]++; I[m[k]]+=i[k]; R[m[k]]+=r[k]; C[m[k]]+=c[k]; O[m[k]]+=o[k]}
  for(k in n) printf "  %s reqs=%d in=%d cacheRead=%d cacheCreate=%d out=%d\n",k,n[k],I[k],R[k],C[k],O[k]}'

echo "-- main-thread tokens per model (max per message.id, summed per model) --"
jq -r 'select(.type=="assistant" and (.isSidechain|not)) |
  [.message.id, (.message.model // "-"),
   (.message.usage.input_tokens // 0),
   (.message.usage.cache_read_input_tokens // 0),
   (.message.usage.cache_creation_input_tokens // 0),
   (.message.usage.output_tokens // 0)] | @tsv' "$F" \
| awk -F'\t' "$MAXBYID" | sort

echo "-- subagent spawns --"
echo "  Agent/Task tool_use blocks: $(grep -o '"name":"\(Agent\|Task\)"' "$F" | wc -l | tr -d ' ')"
echo "  tool results carrying agentId: $(grep -o '"agentId":"[^"]*"' "$F" | sort -u | wc -l | tr -d ' ')"
if [ -d "$S/subagents" ]; then
  echo "  subagent transcript files: $(ls "$S"/subagents/*.jsonl 2>/dev/null | wc -l | tr -d ' ')"
  echo "  subagent meta files:       $(ls "$S"/subagents/*.meta.json 2>/dev/null | wc -l | tr -d ' ')"
  echo "-- subagent tokens per model (max per message.id across all subagent transcripts) --"
  jq -r 'select(.type=="assistant") |
    [.message.id, (.message.model // "-"),
     (.message.usage.input_tokens // 0),
     (.message.usage.cache_read_input_tokens // 0),
     (.message.usage.cache_creation_input_tokens // 0),
     (.message.usage.output_tokens // 0)] | @tsv' "$S"/subagents/*.jsonl \
  | awk -F'\t' "$MAXBYID" | sort
else
  echo "  subagent transcript files: 0 (no $S/subagents)"
fi

echo "-- span --"
jq -r 'select(.timestamp != null) | .timestamp' "$F" | sort | sed -n '1p;$p' | awk 'NR==1{print "  start: "$0} NR==2{print "  end:   "$0}'

echo "-- human-origin user turns (origin.kind==human, not meta/tool) --"
echo "  $(jq -r 'select(.type=="user" and (.isSidechain|not) and .toolUseResult==null and (.isMeta|not) and (.origin.kind=="human")) | .uuid' "$F" | wc -l | tr -d ' ')"
echo "-- legacy user turns with no origin field that carry <command-name> --"
echo "  $(jq -r 'select(.type=="user" and (.isSidechain|not) and .toolUseResult==null and (.isMeta|not) and (.origin==null)) | (if (.message.content|type)=="string" then .message.content else ([.message.content[]? | select(.type=="text") | .text] | join("\n")) end)' "$F" | grep -c '<command-name>')"
echo "-- slash commands --"
grep -o '<command-name>/[a-zA-Z0-9:._-]*' "$F" | sed 's|<command-name>||' | sort | uniq -c | sed 's/^/  /'
echo "-- mise state.ts invocations (inside Bash tool_use blocks; one Bash call can chain two) --"
# @json keeps each command on one physical line; commands embed newlines.
jq -r 'select(.type=="assistant" and (.isSidechain|not)) | .message.content[]? |
  select(.type=="tool_use" and .name=="Bash") | [.id, (.input.command // "")] | @json' "$F" \
| grep 'skills/next/scripts/state\\*.ts\|skills/next/scripts/state\.ts' | sort -u \
| grep -o 'state\.ts[ \\n]*[a-z-]*' | sed 's/\\n/ /g;s/  */ /g' | sort | uniq -c | sed 's/^/  /'
echo "  (distinct Bash calls containing state.ts: $(jq -r 'select(.type=="assistant" and (.isSidechain|not)) | .message.content[]? | select(.type=="tool_use" and .name=="Bash") | [.id, (.input.command // "")] | @json' "$F" | grep -c 'skills/next/scripts/state\.ts'))"
echo "-- compact boundaries / api errors / denials --"
echo "  compact_boundary: $(grep -c '"subtype":"compact_boundary"' "$F")"
echo "  api_error:        $(grep -c '"subtype":"api_error"' "$F")"
echo "  toolDenialKind:   $(grep -c '"toolDenialKind"' "$F")"
echo "-- Skill tool invocations --"
echo "  $(grep -o '"name":"Skill","input":{"skill":"[^"]*"' "$F" | sed 's/.*"skill":"//' | sort | uniq -c | tr '\n' ';')"
