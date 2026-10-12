# 06 · Refactor plan (draft)

*Draft: steps R4 and R7 depend on Q1-Q3 in `04-inferences.md`. Each step is a small build brief: one change, its own PR, CI green, no level-count change unless it says so. Order: what protects students first, then the shared pieces with the highest value, then the big port.*

## The tests that would have caught the Divide it regressions

These are the acceptance tests the steps below add. They run on **every Solve it card config**, so a new card inherits them.

| Regression (brief) | Test | Level |
|---|---|---|
| The prompt changed between states (C1) | At every state with x not alone, on every legal path: the line's text equals `CHOICE_PROMPT` and both choice buttons are present and enabled, and each leads to its mode. | Engine (exists for Divide: `tests/divideMoves.test.js:52-83`) **and screen** (new) |
| Missing work rows (A1) | Every committed move adds the operation row (with the operation marked blue) and then the resulting equation; every numeric-level action adds rows down to the Balanced / Unbalanced mark. | Engine + screen |
| A wrong substitution (B1) | The loop's five renderer cases, plus: for every card form, a correct guess at the first state and after a partial move renders from the right equation with the coefficient as × and negatives in parentheses. | Engine (renderer exists) + card |
| The scaffold blanked the screen (B2) | For every rung at every state (x alone with an unevaluated side included): after the click, the work stack still holds every row it held before, and the picture area is not empty. | **Screen** (new) |

"Screen" tests need a DOM in the test runner. Vitest can run a file in a simulated browser (`happy-dom` or `jsdom`); that is one new dev dependency (R0).

## Steps

### R0. A screen-test harness  (S)
- **Goal:** render a card's screen in tests from a session state and query it.
- **Files:** `package.json` (add `happy-dom` as a dev dependency), `vite.config.js` (per-file environment), `tests/helpers/screen.js` (new).
- **Acceptance:** one test renders Divide L2's first state and finds the line, the stack's one row, the greyed answer row and the help row.
- **Risk to saves:** none. **Decision needed:** adding a dev dependency.

### R1. Stop the progress loss  (S-M) — highest value
- **Goal:** fix the two observed causes in 03 §C.
- **Files:** `src/syncStore.js` (keep `{ mode: 'device', id, token, label }` across reloads), `src/main.js` (`saveProgress`: read what is stored, union it with memory, keep packs this build doesn't know, then write; read `mat.v1.backup` at start and union it in), `tests/syncStore.test.js` (new), `tests/progress.test.js`.
- **Acceptance:** a device sign-in survives `loadSync(saveSync(x))`; two "tabs" (two app instances on one fake storage) each finishing a different level end with both done; a store holding an unknown pack keeps it after a save from an older pack list.
- **Also (Karl, 2026-10-12):** ask students to sign in at every visit, before play (details pending: skippable or not, how a returning student confirms). Merge stays level by level: a level finished on either side stays finished.
- **Risk to saves:** reduces it. No code-format change.

### R2. Shared Solve it home and tokens  (S)
- **Goal:** move shared pieces out of card files; no behaviour change.
- **Files:** new `src/solveit/` with `dom.js` (`html`), `messages.js` (the shared lines now in `addBothFeedback.js:40-51`), `choice.js` (prompt + both buttons as one component, used by both `lineBlock`s), `panel.js` (`movePanel`, `moveIcon` from `lightScreen.js`), `balance.js` (`drawBalance`, `actionRow` from `addBothMat.js`); `style.css` tokens `--op`, `--accent`, `--good`, `--bad`, `--target` replacing raw hex in Solve it rules.
- **Acceptance:** all 931 tests pass; no file under `src/solveit/` imports a card file; a grep finds no `#0072b2` in Solve it rules; screenshots before and after match.
- **Risk to saves:** none.

### R3. One work-stack row builder  (M)
- **Goal:** one `stackRows` for every card; the fold label comes from the card (`foldLabel(move)`), not hard-wired to fractions.
- **Files:** `src/solveit/stack.js` (from `solveScreen.js:56`), `view/divideScreen.js`, later Add.
- **Acceptance:** the "missing work rows" test, engine and screen, for Divide.
- **Risk to saves:** none.

### R4. One substitution renderer for Add  (S)
- **Goal:** Add uses `solveTerms.substitutionLines` (with the step highlight) and the loop's choice of equation; delete `substitutionSteps`/`substitutionParts`.
- **Files:** `engine/addBothMoves.js`, `view/lightScreen.js`, `tests/addBothMoves.test.js`.
- **Acceptance:** the renderer cases for Add's four forms, both guess paths, after Trade places.
- **Risk to saves:** none. Can be folded into R7 if Q1 = A.

### R5. The operation colour everywhere  (S)
- **Goal:** one helper marks the move's number blue (with a second signal) in the line, rows, fold rows and evidence, for any move (amount, fraction, sign).
- **Files:** `src/solveit/op.js`, the line, stack and numeric screens.
- **Acceptance:** for each card, a test finds the operation's text inside `.is-op-blue` in the line, the work row and the evidence row.
- **Risk to saves:** none.

### R6. One group-diagram component  (M)
- **Goal:** `groupDiagram` is the single fraction-of-a-group drawing for Solve it; later (separate, optional) Group It's `fractionScript` draws through it.
- **Files:** `view/groupDiagram.js` → `src/solveit/groupDiagram.js`; optional `view/lassoMat.js`.
- **Acceptance:** the "scaffold never blanks" screen test at `x = ⅓(6)`, `⅕(35)`, `⅙(−18)`; Group It screenshots unchanged if the optional part is done.
- **Risk to saves:** none (Group It's id and levels untouched).

### R7. Add to both sides onto the shared loop  (L) — Karl's condition: nothing from the day's work is lost
- **Before porting:** (a) characterisation tests pin today's Add behaviour (build notes §8-17: zero-the-other-side, Trade places on L5, hint box round sign and number, Check under the x row, Enter, combining Party/Battle, the amount blank, lighter first I'm stuck); (b) a list of every behaviour marked keep / change (and the loop line that requires it) / ask; Karl approves it; (c) the port runs behind `?addloop=1` until Karl has played it, then replaces the old one.
- **Goal:** Add becomes a loop config (its move with the amount, its zero-the-other-side slip, Trade places, its seesaw scaffold and combining as rungs); `addBothMoves.js` shrinks to the card.
- **Files:** `engine/addBothMoves.js`, `play/addBothPlay.js`, `view/lightScreen.js` (retired), `view/addBothMat.js` (scaffold only).
- **Acceptance:** every conformance test above runs on Add and passes; Start over is live once touched; the choice returns after Trade places; I'm stuck at `x = 9 + 6` shows a picture; Add fits 1366×657.
- **Risk to saves:** none (6 levels unchanged). Behaviour changes students will notice: say so in the PR.

### R8. One numeric-level engine  (M)
- **Goal:** Add L1 and Divide L1 share one engine and screen (do items, quiz, walkthrough), so Add L1 writes its work rows (brief A1, still failing on Add).
- **Files:** `engine/numericLevel.js` + `engine/divideNumeric.js` → `src/solveit/numeric.js`; both numeric screens.
- **Acceptance:** "work shown" test on both L1s; the walkthrough keeps every step.
- **Risk to saves:** none.

### R9. Generator rules as shared checks  (S)
- **Goal:** one `verifyLevel(problems, { banned, cardBans })` used by every Solve it generator: verified by substitution, never 0 or ±1, no repeats, slip collisions **reported**, worst-case rows reported.
- **Files:** `src/solveit/generatorRules.js`, `engine/generateAddBoth.js`, `engine/generateDivide.js`.
- **Acceptance:** Add generates no ±1 answers over 1,500 seeds; both cards report their worst case.
- **Risk to saves:** none (problem sets change, levels don't).

### R10. A fit test  (M)
- **Goal:** the loop's §3B test runs in CI.
- **Files:** a Playwright script (Chromium) driving each card to its worst case at 1366×657; `ci-deploy.yml` step.
- **Acceptance:** fails today on Add and Divide (as measured in 03); passes after layout work.
- **Risk to saves:** none. **Decision needed:** a heavier CI job.

### R11. One number pad  (S)
- **Goal:** `buildPad` (`view/quiz.js:20`) is the pad for every card.
- **Acceptance:** keyboard and tap tests on two cards from different sections.
- **Risk to saves:** none.

### R12. Retire old Solve it content  (S) — depends on I10
- **Goal:** hide One-step from the menu; block `?pack=switch`.
- **Acceptance:** One-step's bits still decode and still credit Divide it.
- **Risk to saves:** none if ids and bits stay (they must).
