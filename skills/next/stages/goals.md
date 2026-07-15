# Goals (and Mock)

The single human-gated stage of the pipeline. Everything downstream self-approves, so this conversation is where all intent gets captured: critique the goals, ask every clarifying question the later stages would otherwise need, decide the route, and — when the route is `full` — produce the HTML mock. It ends at the combined approval gate from `../references/interaction.md`.

## Input

The working directory is `<mise-directory>/` (from the config) and `goals.md` in it already holds the user's description (the dispatcher guarantees this). If mock or goals artifacts already exist (a reopened stage), review and revise them with the user — never regenerate from scratch.

## Bugfix route

If the work is a bug fix — the dispatcher classified it when starting, or the recorded route is `bugfix` (a reopened stage) — this stage is a bug-understanding conversation instead of the feature path below:

1. Read the relevant source code; trace the code path to build a model of the expected behavior. If a Skills & guides entry covers manual testing, reproduce the bug yourself when that helps.
2. If the description is vague, ask (batched, per the question format): exact repro steps, expected vs actual behavior, error messages, intermittent or consistent.
3. Check the description against the config's **Test exceptions**. A match means the fix will be verified the exception's way instead of by a regression test; note which entry matched.
4. Rewrite `goals.md` as the durable record: repro steps, expected behavior (this becomes the test assertion), actual buggy behavior, matched test exception (if any), and — when a regression test will be written — the planned test file location per the config's Test conventions, with one line on why that location.
5. **Gate**: present the summary and ask the user to confirm the understanding and the test location. No code, no test, no plan before explicit confirmation. On approval: `approve goals route=bugfix`, commit, continue in-session.

## Feature routes

### 1. Critique

Read `goals.md` and review it critically — the user would rather find problems now than during implementation:

- **Consistency**: contradictions or conflicting goals?
- **Gaps**: important considerations missing?
- **Complications**: technical or practical challenges ahead?
- **Assumptions**: unstated assumptions worth validating?
- **Scope risks**: goals vague enough to invite scope creep?
- **Ideas**: alternatives or enhancements worth considering?

The critique is working notes, never output — do not present it as a standalone review. Each finding surfaces as a clarifying question in the round below (carrying enough context to answer it), or as a direct edit to `goals.md` when no user call is needed — the approval gate covers it either way.

### 2. One batched round of questions

This is the last point in the pipeline where a human is guaranteed present — later stages record assumptions instead of asking. Fold everything into one round (question format per `../references/interaction.md`), covering:

- The critique points above that need the user's call.
- What the requirements stage would otherwise ask: edge cases and error scenarios, user-facing behaviors not explicitly stated, integration points with existing functionality, what is explicitly OUT of scope.
- Mock-shaping questions, when a mock is coming (see route below): where the feature surfaces (new page, modal, inline), which scenarios/states matter, what data it shows. Do NOT ask about visual detail — spacing, wording, layout — the mock draft itself elicits those better than questions can.

Fold the answers into `goals.md` so the approved artifact, not the conversation, carries them.

### 3. Route

Match the feature against the config's **Mock conditions**: any match → `full`, none → `direct`; no section → `direct`. The user saying "mock this" / "no mock" at any point overrides. Ask only if genuinely ambiguous — never guess silently, never ask when the conditions decide it (and never re-ask a route the state already records). The route is recorded with the approval at the gate below, not here.

### 4. Mock (`full` route only)

Create `mocks.html` and `mocks.context.md` in the mise directory.

- **Match the product.** If the config has a Mock guidance section, follow it: read the UI code at its UI code root and closely approximate the real look and feel — never guess. Apply any matching Skills & guides entries (voice guides, design guides).
- In the single HTML file, mock each relevant scenario/state, labeled, with a one-line description of what it demonstrates, shown inside a realistic application window with realistic sample data. Variants of the same idea are cheap here and valuable — offer them.
- **Cover the canonical states, not just the happy path**: empty (no data yet), loading when meaningful, error — including where errors appear — and, for every submit or action, its success and failure outcomes. A state skipped here becomes a requirements-stage assumption instead of a user decision. How each state renders (toast vs. inline, empty-state style) follows the config's Mock guidance like everything else.
- Initialize `mocks.context.md`:

  ```markdown
  # Mock Context

  ## Original Description

  <the user's original description>

  ## Clarifying Q&A

  <the questions asked above and the user's answers>

  ## UI Tweaks Log

  <every piece of mock feedback: what was requested, what changed>
  ```

### 5. Iterate and gate

Present goals (and mocks) together. Iterate on both in the same loop — mock feedback goes in the UI Tweaks Log (note _(Logged: …)_ when you record one); goal edits go straight into `goals.md`. The tweaks log feeds requirements extraction, so keep it thorough.

Then the human gate per `../references/interaction.md`, recording the route decided above (`full`/`direct`) at the approval. This is the user's last required touchpoint until the acceptance pass.
