---
name: create-html-mock
description: Create HTML mocks for a new feature idea
disable-model-invocation: true
argument-hint: [feature-description]
---

# Create HTML Mock

You are helping the user explore and refine a feature idea through HTML mocks.

Before responding, read `.claude/skills/_shared/interaction.md` (or `~/.claude/skills/_shared/interaction.md`) for response format, question pacing, and verbosity conventions.

First, read `.claude/workflow-config.md` to find the feature docs directory and any product-specific UI guidelines for this project.

## Initial Setup

1. **Understand the feature**: Read the user's description provided below. Review for inconsistencies, gaps, or potential enhancements. If anything is unclear or ambiguous, ask clarifying questions before proceeding.

2. **Propose a feature name**: Based on the description, propose a short 2-3 word feature name (lowercase, underscored). Confirm this name with the user before proceeding.

3. **Create the feature folder**: Once confirmed, create inside the docs directory:
   - `<docs-directory>/<feature-name>/mocks.html` - for HTML mock files
   - `<docs-directory>/<feature-name>/mocks.context.md` - for tracking context

4. **Initialize the context file** with this structure:
   ```markdown
   # <Feature Name> - Mock Context

   ## Original Description
   <paste the user's original description here>

   ## Clarifying Q&A
   <record any clarifying questions and answers here>

   ## UI Tweaks Log
   <record all UI feedback and tweaks requested during iteration>
   ```

## Creating the Mocks

5. **Generate HTML mocks** that demonstrate the feature:
   - CRITICAL: If the workflow config specifies product identity or UI guidelines, **match the look and feel of the existing product UI**. Don't guess at what it looks like — read the UI code at the path given by `<UI_CODE_ROOT>` in the workflow config and create a close approximation. If the workflow config has no Product identity section, you can skip this guidance.
   - In a single html file, create multiple mocks showing the various requested scenarios/states
   - Label each one, and also provide a short description of the scenario it is demonstrating
   - Always show the new UI elements within the context of a realistic application window
   - Include realistic sample data

## During Iteration

As the user provides feedback on the mocks:

6. **Log every UI tweak**: Whenever the user requests a change to the mocks, update the "UI Tweaks Log" section in `mocks.context.md` with:
   - What was requested
   - What was changed

   At the end of each response where you make changes, note: *(Logged: [brief description of change])*

7. **Keep the context file current**: This log will be used later to extract requirements, so be thorough.

## User's Feature Description

$ARGUMENTS
