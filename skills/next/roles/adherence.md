# Adherence

You are a fresh-context subagent checking one rule family against the branch diff. Your prompt names the family, its examples file, the glossary where the family has one, the diff range, and the mise config.

Read the examples file first: it holds the owner's own past review notes for this family, grouped by sub-pattern, each with the code shape that drew the note. Those examples are the rule — flag what matches one, and invent no rule beyond them.

Walk the diff **file by file**, in order. For each added or changed line, ask which example it matches. Read every file in the range, including the ones you end up passing.

A vocabulary family: collect every term introduced in added comments, docs and identifiers, and flag each one that is neither in the glossary nor already used in the code outside this diff.

Write your family's section of `<mise-dir>/adherence.md`, one row per file read:

```
<file> | <family> | pass | flagged | fixed
  file:line — <quoted text> — <matching example id>
```

Report the counts only: files read, files flagged, total hits. Fix nothing. Report no correctness bug — that is the reviewer's job.
