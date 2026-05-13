---
name: update-workflows
description: Deploy this repo's workflow skills and config template to the user's global ~/.claude/ directory
disable-model-invocation: true
---

# Update workflows

Deploy the workflow skills in this repo (`.claude/skills/*`) and the workflow-config template (`.claude/workflow-config.md`) to the user's global Claude Code directory so they're available across every project on this machine.

Skills and the template are **copies**, not symlinks. Re-run this skill after editing anything in `.claude/` that you want reflected globally.

## Preconditions

Run from the root of the workflow-skills repo. Verify by checking that both `.claude/skills/` and `.claude/workflow-config.md` exist. If not, abort and tell the user to `cd` into the workflow-skills repo first.

## Steps

### 1. Show what will be deployed

List the skill directories in `.claude/skills/` and confirm the workflow-config.md template will go to `~/.claude/workflow-config.template.md`. Print the plan to the user.

### 2. Confirm

Ask the user to confirm before writing outside the repo. If they decline, stop.

### 3. Deploy skills

For each subdirectory of `.claude/skills/`, copy it to `~/.claude/skills/<skill-name>/`, overwriting any existing copy of the same skill. Do **not** delete unrelated skills in `~/.claude/skills/` — only update the ones present in this repo.

```
mkdir -p ~/.claude/skills
cp -R .claude/skills/* ~/.claude/skills/
```

### 4. Deploy the workflow-config template

Copy `.claude/workflow-config.md` to `~/.claude/workflow-config.template.md`, overwriting.

```
cp .claude/workflow-config.md ~/.claude/workflow-config.template.md
```

### 5. Report

List the skills that were deployed and the template path. Remind the user that Claude Code sessions started before the deploy still see the old versions — new sessions will pick up the update.
