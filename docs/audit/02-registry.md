# 02 · Shared-components registry (as the code stands)

*Audit of commit `17835f7`. For each piece: where it lives, what it does, who uses it, and every place the same job is done again. "Shared" means one implementation used by more than one card. Status: **Shared**, **Partly shared** (one copy, but it lives in a card's file or carries one card's details), **Duplicated** (two or more copies), **Missing**.*

## Summary

| # | Piece | Status | Canonical home today | Copies elsewhere |
|---|---|---|---|---|
| 1 | Choice prompt (text) | Shared | `engine/solveLoop.js:34` `CHOICE_PROMPT` | none (Add imports it, `view/addBothFeedback.js:40`) |
| 1b | Choice buttons | Duplicated | `engine/solveLoop.js:35` `CHOICE_BUTTONS`, drawn in `view/solveScreen.js:24` | `view/lightScreen.js:84` hard-codes "Guess x", "Use a move" |
| 2 | Work-stack row builder | Duplicated | `view/solveScreen.js:56` `stackRows` | `view/lightScreen.js:142` `stackRows`; `view/divideNumericScreen.js:23` `workStack`; `view/numericScreen.js` (Add L1) builds its own rows |
| 3 | Substitution renderer | Duplicated | `engine/solveTerms.js:96` `substitutionLines` (tested with the loop's 5 cases) | `engine/addBothMoves.js:604-620` `substitutionSteps` / `substitutionParts` (Add's own, x ± a only) |
| 4 | Operation colour (blue) | Partly shared | CSS class `.is-blue` | colour `#0072b2` written 31 times in `style.css`, no token; Divide's "blue in the line" helper `blueFractions` (`solveScreen.js:17`) only knows fraction glyphs |
| 4b | Step-highlight accent (purple) | Partly shared | `--accent: #7b3fb0` on `.sv-card` (`style.css:3044`); `.is-op`/`.is-res` (`style.css:3053-3054`) | Add does not use it (its substitution has no step highlight) |
| 5 | The line (coloured box) | Duplicated | `view/solveScreen.js:19` `lineBlock` | `view/lightScreen.js:80` `lineBlock`; Count it / Build it use `#feedback` at the bottom of the page (`index.html`) |
| 6 | Help row | Duplicated | `view/solveScreen.js:154` `helpRow` | `view/lightScreen.js:210` `helpRow` (Start over rule differs); Count it / Build it put I'm stuck / Teach me in the palette (`view/lightControls.js:24`, `walkLightControls.js:37`, `boxLightControls.js:29`) |
| 7 | Move / Why? panel | Partly shared | `view/lightScreen.js:263` `movePanel` + `moveIcon` (line 60) | used by Add, Add L1, Divide, Divide L1; lives in Add's screen file |
| 8 | Number pad | Duplicated | `view/quiz.js:20` `buildPad` (fluency, diagnostic only) | own pads in `addBothControls.js`, `divideControls.js`, `numericControls.js`, `lightControls.js`, `walkLightControls.js`, `boxControls.js`, `boxLightControls.js`, `lassoControls.js`, `termGroupControls.js`, `distributeTypedControls.js`, `controls.js`, `bigControls.js` |
| 9 | Seesaw (balance) | Partly shared | `view/addBothMat.js:115` `drawBalance` | used by Add scaffold, Add L1, Divide L1; lives in Add's Mat file |
| 10 | Counters tray | Single use | `view/addBothMat.js:289` `trayFor` | Add only |
| 10b | Dealing (pile → groups → keep) | Single use | engine `engine/divideMoves.js` (`deal`, `dealRound`, `keep`); drawing `view/groupDiagram.js` | Divide only; spec says Flip it reuses it |
| 11 | Group diagram (fraction of a group) | Duplicated | `view/groupDiagram.js:51` `groupDiagram` (Divide) | `view/lassoMat.js:202` `fractionScript` (Group It). `groupDiagram` borrows `el` and `counter` from `lassoMat.js` but is a separate drawing |
| 12 | Check / Next / Go highlighting | Duplicated | class `is-target` | set in 6 view files (`addBothMat`, `lightScreen`, `solveScreen`, `divideScreen`, `numericScreen`, `divideNumericScreen`); each decides on its own what is the one target |
| 12b | Undo / Go row | Partly shared | `view/addBothMat.js:254` `actionRow` | used by Add, Divide (`solveScreen.js:168` `undoRow`), both numeric levels |
| 13 | Generators | Per card (by design) | helpers `engine/generate.js` (`mulberry32`, `pickSet`) | 13 `generate*.js` |
| 13b | Verification by substitution | Duplicated | each card's `make*` throws on a failed check (`addBoth.js:22`, `divide.js:13`) | not a shared function; Add's and Divide's checks are different code |
| 13c | Worst-case row count | Single use | `engine/generateDivide.js:113-134` | Missing for Add |
| 14 | Slip tagging | Per card (by design) | `tag*` functions: `addBoth.js:55`, `divide.js:49`, `solve.js:84`, `solve2.js:86`, `value.js:90`, `lightCards.js:24,72,90` | no shared collision checker (loop §8 asks the generator to report collisions) |
| 14b | Message text | Per card | ~25 `view/*Feedback.js` files, a key → text table each | the loop's shared messages (`aChoose`, `aLater`, `aNotNeeded`...) live in Add's table (`addBothFeedback.js:40-51`); Divide falls back to it (`divideFeedback.js:4`). Shared, but in a card file |
| 15 | Save-code encode / decode | Shared | `engine/progress.js:142-275` | none |
| 15b | Local save | Shared | `storage.js` + `main.js:110-119` | 6 other stores call `localStorage` directly (`syncStore`, `lightStore`, `fluencyStore`, `diagStore`, `speech`, `installPrompt`) |
| 16 | Anonymous sync | Shared | `engine/sync.js`, `sync.js`, `syncStore.js`, `teacher/Code.gs` | none |
| 17 | The loop itself (choice, forced move, fold, Undo, Start over, help ladder) | Duplicated | `engine/solveLoop.js` `createSolveLoop` (Divide) | `engine/addBothMoves.js` (Add: its own copy, with older rules) |
| 19 | Tucked layout shell (pilot, `?layout=tucked`) | Shared (one card so far) | `src/view/tuckedLayout.js` on branch `tucked-pilot`: work column, slim Why? column, Moves drawer, counter tray; `withTuckedUi` view state | Divide it L2-6 only |
| 18 | Term algebra (board text, signed, fractions) | Partly shared | `engine/solveTerms.js` | Add uses `engine/addBoth.js` `signed` and its own board shape |

## Notes per piece

**1. Choice prompt.** Observed: one string, imported by both Solve it cards. The *buttons* are not shared: Add writes its own labels (`lightScreen.js:84`). Add also shows the buttons only at the start of a problem (`!s.path`, and its path is fixed for the problem, `addBothMoves.js:276`). A shared component would be one function that returns the prompt and both buttons together.

**2. Work-stack row builder.** Observed: four builders. `solveScreen.stackRows` knows `eq`, `work`, `fold` rows and the "plugging back into this equation" tag; but its fold label is hard-wired to "<fraction> of both sides" (`solveScreen.js:76`), so it is Divide-shaped. Inferred: the next card would have to edit it, which is the drift the brief warns about.

**3. Substitution renderer.** Observed: `solveTerms.substitutionLines` passes the loop's five cases (checked by running it: `3 × (−4) = −12`, `15 − 6 = 9`, `−3 × (−4) = 12`, `12 = −(−12)`, `7 = 4 + 3`) and a fraction side (`2 = ⅓(6)`). Add's own `substitutionSteps` is correct for its forms but separate and has no step highlight.

**4. Operation blue.** Observed: no CSS variable; the meaning colour `--groups` (`style.css:6`) is the same hex. The loop §3D says the operation is blue *wherever it appears*; today each view decides what is blue. Divide's line uses `blueFractions` (only ½-⅙ glyphs); Add colours its added amount in its own way (`lightScreen.workTerms`).

**5-6. Line and help row.** Observed: two copies each. The help rows differ in the rule for Start over: Divide `loop.startOverOk` (live once touched, `solveLoop.js:68`), Add `s.startOver` (only after three red moves, `addBothMoves.js:151,155`).

**7. Move / Why? panel.** Observed: one implementation, used by all four Solve it screens. It is in Add's screen file, so the "shared" screen imports Add's file (`solveScreen.js:7-8`, `divideScreen.js:7-8`). Dependency points the wrong way: inferred risk that an Add change breaks Divide.

**11. Group diagram.** Observed: the Divide build notes (§11) say Group It's `fractionScript` could not be reused as is (one bar beside a text column), so `groupDiagram.js` is a sibling that borrows Group It's helpers and CSS classes. The brief asked for *one* component; there are two drawings. Inferred: Count it / Group It could later move onto `groupDiagram`, but that touches a working Count it card.

**12. One highlighted target.** Observed: each screen sets `is-target` on its own. There is no single function "what is the one target now?", which is why the build notes report one exception (rung 1: the coefficient outline plus a blinking cursor).

**17. The loop.** Observed: the loop exists and Divide uses it; Add does not (build notes §11 "Not built / open": "Add to both sides is not yet on the loop"). This is the largest duplication and the root of most Add conformance failures in 03.

## Missing pieces (asked for by the loop or the brief, not found)

- A shared **fit test** (render the worst case at 1366×768 and assert the pad and help row are visible). Divide has a row count; no rendering test exists.
- A shared **slip-collision reporter** for generators.
- A **DOM test harness** (none of the 63 test files renders a screen).
- A single **"greyed-out rules"** function (what is live in each state). Each screen computes it.
