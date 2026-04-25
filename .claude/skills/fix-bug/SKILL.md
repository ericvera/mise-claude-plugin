---
name: fix-bug
description: |
  Fix a bug using test-driven development: first write a regression test that
  demonstrates the bug, confirm it fails, then fix the bug without modifying
  the test.
  Input: a description of the bug to fix.
---

# Fix Bug (Test-Driven Bug Fix)

This skill fixes bugs using a strict test-driven workflow:

1. **Understand the bug** — get full clarity on the repro steps and expected behavior
2. **Decide: end-to-end test or visual verification?**
   - **Behavioral bugs**: write a regression test, confirm it fails, fix the bug, confirm it passes. NEVER modify the test during the fix phase.
   - **Purely visual bugs** (cursor style, spacing, colors, etc.): skip the end-to-end test. Verify with before/after screenshots via the manual testing skill (if available).
3. **Fix the bug** and verify the fix

First, read `.claude/workflow-config.md` to find the quality commands, test conventions (including test directory locations and naming), and related skills for this project. All project-specific paths and commands referenced below come from that config file.

## Input

The user provides a description of the bug to fix.

## Phase 1: Understand the Bug

Before writing any code, get full clarity on the bug. The goal is to have a precise, reproducible understanding of:
- **What the user did** (exact steps to reproduce)
- **What they expected to happen**
- **What actually happened** (the buggy behavior)

### Investigate

1. **Ask the user questions** if the bug description is vague or incomplete. Don't guess — ask about:
   - Exact steps to reproduce
   - Expected vs actual behavior
   - Which part of the UI is affected
   - Any error messages they saw
   - Whether the bug is intermittent or consistent

2. **Read the relevant source code** to understand how the feature works. Trace the code path from the UI through to the backend to build a mental model of the expected behavior.

3. **Use the manual testing skill** (if available in workflow config) to reproduce the bug yourself if needed. Launch the app in a headless browser, follow the user's repro steps, and take screenshots to confirm you can see the same buggy behavior. This is especially useful when:
   - The bug description is ambiguous
   - You need to verify your understanding of the UI flow
   - You want to see the exact error state before writing the test

### Exit criteria for Phase 1

Do NOT proceed to Phase 2 until you can clearly articulate:
- The exact sequence of user actions that triggers the bug
- What the correct behavior should be (this becomes your test assertion)
- What the buggy behavior is (this is what you expect the test to fail on)

**Getting user confirmation (MANDATORY — you MUST stop here and wait):**

Write out your understanding as a summary in your response text, covering the three points above. Also include:
- Whether this is a **behavioral** or **purely visual** bug
- If behavioral: the **test file location** where you plan to write the regression test, based on the test conventions from the workflow config. Include a brief explanation of why you chose that location (e.g., "this is a regression for an existing feature" vs "this feature is still under active development"). If you're placing it in the regression/stable directory, also mention the path of the closest existing test file for the same feature area, if one exists, so the user can judge whether the location is the right choice.

End your message by explicitly asking the user to confirm both your understanding of the bug and the test file location, e.g.: "Does this match your understanding of the bug? Is the test file location correct? Please confirm so I can proceed to writing the regression test."

Then **STOP. Do not proceed to Phase 2. Do not write any code.** Wait for the user to confirm before moving on.

## Phase 2: Write the Regression Test

### Decision: end-to-end test or visual verification?

Before writing a test, decide whether the bug is **purely visual** or **behavioral**:

- **Purely visual bugs** affect only appearance — cursor style, spacing, colors, z-index, font size, alignment, etc. They do not change what happens when the user interacts with the UI.
- **Behavioral bugs** affect what happens — clicks not working, wrong data displayed, missing elements, incorrect navigation, broken state, etc.

**If the bug is purely visual**, skip the end-to-end test. Instead:
1. Use the manual testing skill (if available) to take a **before screenshot** that shows the bug.
2. Proceed directly to **Phase 3** to fix the bug.
3. After the fix, use the manual testing skill to take an **after screenshot** confirming the fix.
4. Include both screenshots in your response so the user can verify.
5. Commit the fix (no test file to commit).

**If the bug is behavioral** (or has both visual and behavioral aspects), write an end-to-end test as described below.

### Choosing the test location

Decide where to place the test based on the test conventions in the workflow config. Typically this involves deciding whether the buggy feature is **stable** or **under active development**, and placing the test in the appropriate directory.

Use these signals to decide:

| Signal | Stable / Regression | Active development |
|---|---|---|
| User says "not a regression" or "still in development" | | Yes |
| User explicitly asks for a specific folder | Follow their request | Follow their request |
| Bug was reported by a user in production | Yes | |
| Feature has been shipping for a while with no recent changes | Yes | |
| The expected behavior might change soon as the feature evolves | | Yes |
| There's already an existing test file for this feature in the active dev directory | | Yes (add to it) |

When in doubt (no clear signals), default to the regression/stable directory.

### Deciding between end-to-end test and unit test

Most bugs should be covered by an **end-to-end test** (the default). However, in rare cases an end-to-end test may not be feasible — for example, the bug is in pure backend logic with no UI surface, or the scenario is too difficult to set up end-to-end.

If a **unit test** is more appropriate:
- Place it following the project's unit test conventions from the workflow config.
- Do NOT put unit tests in the end-to-end test directories.

### Writing the end-to-end test (behavioral bugs only)

Use the write-e2e-test skill (if available in workflow config) to write and run the test, with the test location and naming convention determined above.

- **Test design**: The test should exercise the exact scenario described in the bug report. Write assertions that would **pass if the bug is fixed** and **fail if the bug is present**.

Follow the write-e2e-test skill for everything else (test framework setup, running tests, etc.).

### Confirm the test fails

After the test is written and runnable, verify it **fails with an error related to the bug**. This is the key difference from normal test writing — here we *expect* failure.

- If the test passes, it does not capture the bug — revise the test assertions and try again.
- If the test fails for an unrelated reason (e.g., infrastructure problems), use the debug-e2e-test skill (if available) to fix the test setup.

Once the test fails as expected, commit the test file to git.

## Phase 3: Fix the Bug

Now fix the actual bug in the codebase. During this phase:

### STRICT RULE: Do NOT modify the test

**It is NOT ALLOWED to change the test file created in Phase 2.** The test is the specification — the code must be fixed to make the test pass, not the other way around.

### Fix workflow

1. **Investigate the bug**: Read the relevant source code, understand the root cause.
2. **Implement the fix**: Make the minimal code change needed to fix the bug.
3. **Run the test**: Use the end-to-end test skill (from workflow config) to run the regression test.
4. **If the test still fails**: Use the debug-e2e-test skill (if available) to diagnose the failure, then iterate on the fix.
5. **Repeat** steps 2–4 until the test passes.

### After the test passes

1. Run the project's check command(s) (from workflow config) to ensure no formatting, lint, or type errors were introduced. If the workflow config provides a list of commands, run them in order and stop at the first failure; iterate until every command in the slot passes.
2. Run the full end-to-end test suite for the area you changed to check for regressions.
3. Commit the fix.

## Summary Checklist

### All bugs

- [ ] Bug understood: repro steps, expected behavior, and actual behavior are clear
- [ ] User confirmed understanding before proceeding
- [ ] Bug fixed in source code
- [ ] Quality checks pass (check command from workflow config)
- [ ] Fix committed

### Behavioral bugs (additional)

- [ ] Test written in the appropriate directory (per test conventions in workflow config)
- [ ] Test confirmed to fail (demonstrates the bug)
- [ ] Test committed
- [ ] Test passes after fix
- [ ] Test file was NOT modified during the fix phase

### Purely visual bugs (additional)

- [ ] Before screenshot taken with manual testing skill
- [ ] After screenshot taken with manual testing skill confirming the fix
