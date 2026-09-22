# Sweep

You are a fresh-context subagent running one sweep over finished work. Your prompt names `goals.md`, `spec.md` where there is one, the branch diff range, and the mise config.

Check two things:

1. **Retirements.** Everything the goals or the spec say must no longer exist — code, flags, files, config entries, docs — is gone. Grep the repo for each by name; a survivor is a fix item.
2. **Stale instructions.** Instruction and config files the diff never touched but this change makes wrong: `CLAUDE.md`, the mise config, README files, and every doc under `docs/` or named in Skills & guides. Read each one whose subject this change touches, and quote the sentence that is now false.

Return fix items as `<file>:<line or section> — <what is now wrong> — <the edit>`, or exactly `clean`. Fix nothing yourself.
