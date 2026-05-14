# Claude Code workflow skills

This repo contains the Claude Code skills that I have been using with very good results. I'm sharing them with the hope that they are useful to others, and that if you find them useful, you might also give suggestions or PRs to help me continue improving them!

# Overview

I categorize the complexity of tasks that I can accomplish with Claude Code roughly in these categories:

1. Trivial: Just write a prompt and trust that the agent can one-shot the fix.
2. Moderate amounts of ambiguity or complexity: Claude Code's plan mode does a decent job at asking clarifying questions and writing out a plan before it dives into coding. 
3. Complex feature: Once you get beyond the limits of what plan mode can handle, you need to apply your own rigor, and that's where these skills come in.

These skills were built with the following goals in mind:
* Optimize for autonomous coding. A lot of the complexity of the skills comes from the fact that I try to leave Claude Code running overnight and doing useful work as often as I can. So it's important that it be able to work autonomously for hours at a time.
* Force Claude Code to think about the problem at the correct level. Left to its own devices, it will jump straight into coding and try to make fast progress. These skills (and even Claude's own plan mode, to a lesser degree) force it to focus on one layer at a time: goals, requirements, architecture, implementation.
* Create artifacts at each step of the process. This enables review, avoids over-reliance on context, and also provides natural checkpoints to rewind the process when needed.

# Workflow

1. Write a goals.md. This is just a human description of whatever you're trying to achieve. It can be as concrete or as vague as you like.
2. Use `/review-goals` to get more clarity on the goals and start to make them more concrete
3. If your feature includes visuals, use `/create-html-mock`. This will ask you lots of questions and produce a visual mock, and as you give it feedback on the mocks, it records all of that feedback for use in the next step. And this is especially powerful if you ask it to create lots of different variants of the same ideas.
4. Generate a requirements doc
    1. If you created mocks, run `/extract-requirements-from-mock`
    2. Otherwise, run `/write-requirements` to ask you lots of questions about your goals and then generate the requirements based on that
5. Use `/write-architecture` to create an architectural design for your new feature. This helps claude first think about system-wide concerns, before deep diving into line-by-line implementation.
6. Use `/write-implementation-plan` to translate the architecture into a very fine-grained implementation plan, broken down into phases and tasks. This is the key to this whole flow, because the task files are carefully crafted to have full context, all critical instructions, and details on how to validate the work. And crucially, the plan will always include end-to-end tests to verify that the feature works as a user will experience it.
7. Finally use `/execute-implementation-plan` to carry out the work in a robust way, without concern for managing context or compaction.

Tip: Run `/next` at any time to either run or just see the next command in this pipeline for the active feature. `/next ?` only describes it; `/next` runs it; `/next some description` starts a new feature seeded with that description (and routes to `/fix-bug` if the description sounds like a bug). If your project doesn't have a `workflow-config.md` yet, `/setup-workflow` walks you through it.

Caveat:
This whole workflow assumes that you have very good verification, and especially end-to-end test coverage. No matter how good your up front planning is, agents still hallucinate, and the problem compounds with the more code they write in one go. These skills instruct Claude Code to run linters, unit tests, and end-to-end tests all along the way to keep it grounded in reality. And the code that it produces will be exactly as good as the test coverage that it has to adhere to.

# Interactivity

Some skills are designed to ask you questions and wait for your answers. Plan accordingly: you should expect to be at the keyboard for these, and they are not safe to leave running unattended.

Interactive (require human input):
- `/next` — may ask you to pick a feature, fetch backlog items, ask "what's the goal?" if missing, or confirm bug-vs-feature when ambiguous.
- `/setup-workflow` — walks through `.claude/workflow-config.md` placeholders interactively.
- `/review-goals` — surfaces gaps and questions about the goals doc; you steer the next iteration.
- `/create-html-mock` — proposes a feature name and asks clarifying questions before generating mocks, then iterates with you on the mocks.
- `/extract-requirements-from-mock` — presents the extracted requirements and asks whether to regenerate mocks.
- `/write-requirements` — asks clarifying questions before writing the requirements doc.
- `/write-architecture` — asks clarifying questions or raises concerns about the requirements before writing the architecture doc.
- `/write-implementation-plan` — asks clarifying questions about ambiguity or conflicts before writing the plan, and confirms end-to-end test choices afterward.
- `/fix-bug` — Phase 1 stops and waits for you to confirm the bug understanding and the test file location before writing any code.

Non-interactive (safe for autonomous runs):
- `/execute-implementation-plan` — once a plan exists, this can run for hours implementing tasks one at a time, only stopping if a task hits a hard blocker.

Bonus:
I also included a separate `/fix-bug` skill in this repo. It is a simple little skill that is very effective at taking a quick-and-dirty bug description and turning it into an actionable set of repro steps, complete with a regression test and TDD approach to fixing the issue.

# Disclaimer

The skills in this repo are not an exact copy of the skills I have been using, simply because they reference specific paths and other skills that are particular to the repo they are in. What you see here is a refactored copy of the skills that move all of those repo-specific details into the `workflow-config.md` file. I have now begun using these refactored skills myself too, but just be aware that there may be issues resulting from that refactoring.