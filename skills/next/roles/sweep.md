# Sweep

You are a fresh-context subagent running one sweep over finished work. Your prompt names `goals.md`, `spec.md` where there is one, the branch diff range, and the mise config. Work from `git diff --name-only <range>` — file names, never hunks.

Check two things:

1. **Retirements.** Everything the goals or the spec say must no longer exist — code, flags, files, config entries, docs — is gone. Grep the repo for each by name; a survivor is a fix item.
2. **Stale instructions.** Instruction and config files the diff never touched but this change makes wrong: `CLAUDE.md`, the mise config, README files, and every doc under `docs/` or named in Skills & guides. Read at most 20 of them — one batch's worth, the ones whose subject this change touches — name what you left unread, and quote the sentence that is now false.

Return fix items as `<file>:<line or section> — <what is now wrong> — <the edit>`, at most 10 with the count of any beyond, or exactly `clean`. Fix nothing yourself.
