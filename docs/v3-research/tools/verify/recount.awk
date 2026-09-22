# Independent re-implementation of the okven-offenses per-commit counters.
# Written from scratch (awk) to cross-check tools/scan_offenses.py (python).
# Input: git log --branches --remotes --no-merges --since=... -p -U10
#        --format=$'\x01C\x01%H\x01%aI\x01%an\x01%s'
# Output: TSV per commit.

function classify(p) {
  if (p ~ /(^|\/)(node_modules|\.yarn|dist|build|coverage|\.nuxt|\.output)\//) return ""
  if (p ~ /\.snap$/ || p ~ /__snapshots__\//) return "snap"
  if (p ~ /\.md$/) { if (p ~ /^\.mise\//) return "mise_md"; return "md" }
  if (p ~ /\.(ts|tsx|js|mjs|cjs|jsx|mts|cts|vue)$/) {
    if (p ~ /(\.test\.|\.spec\.)[a-z]+$/ || p ~ /\/__tests__\//) return "test"
    return "src"
  }
  return ""
}

function nmatch(s, re,   n, t) { t = s; n = gsub(re, "", t); return n }

function trim(s) { gsub(/^[ \t\r]+/, "", s); gsub(/[ \t\r]+$/, "", s); return s }

function flush_hunk(   i, s, was, isc, inb, inh, j, span, anyadd) {
  if (nh == 0 || kind != "src") { nh = 0; return }
  inb = 0; inh = 0
  for (i = 0; i < nh; i++) {
    s = trim(L[i])
    was = (inb || inh)
    isc = was
    if (!was) {
      if (substr(s, 1, 2) == "/*") {
        isc = 1
        if (index(substr(s, 3), "*/") == 0) inb = 1
      } else if (substr(s, 1, 4) == "<!--") {
        isc = 1
        if (index(s, "-->") == 0) inh = 1
      } else if (substr(s, 1, 2) == "//") {
        isc = 1
      }
    } else {
      if (inb && index(s, "*/") > 0) inb = 0
      if (inh && index(s, "-->") > 0) inh = 0
    }
    if (!A[i]) continue
    if (isc) c_comment++
    else if (length(s) > 0) c_code++
  }
  # JSDoc blocks spanning more than 5 lines with at least one added line
  i = 0
  while (i < nh) {
    s = trim(L[i])
    if (substr(s, 1, 3) == "/**" && index(substr(s, 4), "*/") == 0) {
      j = i + 1
      while (j < nh && index(L[j], "*/") == 0) j++
      if (j < nh) {
        span = j - i + 1
        anyadd = 0
        for (k = i; k <= j; k++) if (A[k]) { anyadd = 1; break }
        if (span > 5 && anyadd) c_jsdoc++
        i = j
      }
    }
    i++
  }
  nh = 0
}

function emit() {
  if (sha == "") return
  printf "%s\t%s\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\t%s\n",
    sha, adate, c_test, c_src, c_md, c_misemd, c_snapadd, c_snapfiles,
    c_inline, c_filesnap, c_assert, c_assert2, c_drill,
    c_comment, c_code, c_jsdoc
  sha = ""
}

BEGIN {
  SEP = sprintf("%c", 1); FS = SEP; HDR = SEP "C" SEP; nh = 0; sha = ""
  RE_INLINE = "toMatchInlineSnapshot"
  RE_FILESNAP = "toMatchFileSnapshot|toMatchSnapshot[ \t]*\\("
  RE_ASSERT = "\\.(toEqual|toStrictEqual|toMatchObject)[ \t]*\\("
  RE_ASSERT2 = "\\.(toHaveBeenCalledWith|toHaveBeenNthCalledWith|toHaveBeenLastCalledWith|toBeCalledWith|toContainEqual|toBe)[ \t]*\\("
  RE_DRILL = "expect\\(.*(\\.length([^A-Za-z0-9_]|$)|\\.mock\\.calls\\[|\\[[0-9]+\\]\\[[0-9]+\\]|\\.at\\(|\\.map\\()"
}

{
  line = $0
  if (substr(line, 1, 3) == HDR) {
    flush_hunk(); emit()
    n = split(line, F, SEP)
    sha = F[3]; adate = F[4]
    c_test = 0; c_src = 0; c_md = 0; c_misemd = 0; c_snapadd = 0; c_snapfiles = 0
    c_inline = 0; c_filesnap = 0; c_assert = 0; c_assert2 = 0; c_drill = 0
    c_comment = 0; c_code = 0; c_jsdoc = 0
    path = ""; kind = ""; newfile = 0
    next
  }
  if (sha == "") next
  if (substr(line, 1, 11) == "diff --git ") { flush_hunk(); path = ""; kind = ""; newfile = 0; next }
  if (substr(line, 1, 13) == "new file mode") { newfile = 1; next }
  if (substr(line, 1, 4) == "+++ ") {
    p = trim(substr(line, 5))
    if (p == "/dev/null") { path = ""; kind = ""; next }
    if (substr(p, 1, 2) == "b/") p = substr(p, 3)
    path = p; kind = classify(p)
    if (kind == "snap" && newfile) c_snapfiles++
    next
  }
  if (substr(line, 1, 2) == "@@") { flush_hunk(); nh = 0; inhunk = 1; next }
  if (!inhunk || kind == "") next
  c1 = substr(line, 1, 1)
  if (c1 == "+") {
    body = substr(line, 2)
    if (kind == "src") { L[nh] = body; A[nh] = 1; nh++ }
    if (kind == "test") {
      c_test++
      c_inline += nmatch(body, RE_INLINE)
      c_filesnap += nmatch(body, RE_FILESNAP)
      c_assert += nmatch(body, RE_ASSERT)
      c_assert2 += nmatch(body, RE_ASSERT2)
      if (body ~ RE_DRILL) c_drill++
    }
    else if (kind == "src") c_src++
    else if (kind == "md") c_md++
    else if (kind == "mise_md") c_misemd++
    else if (kind == "snap") c_snapadd++
    next
  }
  if (c1 == "-") next
  if (c1 == "\\") next
  if (c1 == " " || line == "") {
    if (kind == "src") { L[nh] = (line == "" ? "" : substr(line, 2)); A[nh] = 0; nh++ }
    next
  }
}

END { flush_hunk(); emit() }
