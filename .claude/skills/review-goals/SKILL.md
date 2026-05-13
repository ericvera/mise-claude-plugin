---
name: review-goals
description: Review a goals document for consistency, gaps, and complications
disable-model-invocation: true
argument-hint: <feature-name>
---

# Review Goals Document

Before responding, read `.claude/skills/_shared/interaction.md` (or `~/.claude/skills/_shared/interaction.md`) for response format, question pacing, and verbosity conventions.

First, read `.claude/workflow-config.md` to find the feature docs directory for this project.

Read my goals document at `<docs-directory>/$ARGUMENTS/goals.md`. This is a high-level description of what I want to achieve, not a requirements document or spec.

Review it and provide feedback on:

- **Consistency**: Are there contradictions or conflicting goals?
- **Gaps**: What important considerations are missing?
- **Complications**: What technical or practical challenges do you foresee?
- **Assumptions**: What unstated assumptions should be validated?
- **Scope risks**: Are any goals vague enough to invite scope creep?
- **Ideas**: What alternatives or enhancements should I consider?

Be critical and thorough. I'd rather discover problems now than during implementation.
