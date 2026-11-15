I received the following feedback. Consider it and get back to me:

The mise workflow's final step is a short instruction file, and what it says is: delete .mise, commit, push, and open a pull request. It says nothing about merging, and nothing in it reads the Ship: merge (squash) line from your .claude/mise-config.md.

So there were two instructions that didn't agree: your config says shipping means a squash merge, and the step I was running stops at the PR. Since a merge into main is hard to undo, I took the narrower one and left PR #4 open.

That may well be a gap in mise 3.0.1 (the config line looks like it is meant to drive this step), or the line may be left over from an earlier version. I haven't checked which.

If you want the config honoured, say so and I'll squash-merge PR #4 now. The only reason to hold off is the two things nothing scripted covered: the title-bar button's visibility and click-to-select.
