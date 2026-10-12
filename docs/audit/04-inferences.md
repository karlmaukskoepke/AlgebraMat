# 04 · Inferences about the intended structure

*Each inference is written as a question with my recommended answer and the evidence. Karl confirms them in batches of five at most. Answers are recorded under each question. Status: **Asked** (batch n), **Queued** (not yet asked), **Answered**.*

## Batch 1 (asked and answered 2026-10-12)

### Q1. Should Add to both sides move onto the shared loop before any other card is built?  (Asked)
- **A. Yes, first (recommended).** Port Add onto `createSolveLoop` and `solveScreen`, keeping its own move, scaffold, slips and Trade places as card config.
- B. Later, after Flip it is built on the loop.
- C. Leave Add as is; only new cards use the loop.

*Evidence:* the loop says "a card should never re-implement the loop" and Add is the only Solve it card that does (`addBothMoves.js`, 677 lines). Most Add failures in 03 (choice per state, Start over, rung 1 text-only at x alone, its own renderer) disappear when it uses the loop that Divide already passes. The Divide build notes list it as "the next job". Risk to saves: none (no level count change).

**Answer (2026-10-12):** Worried that a port would erase the day's work on Add. Agreed approach (proposed, awaiting OK): pin today's Add behaviour in tests first, list every behaviour as keep / change (loop rule) / ask, Karl approves the list, port behind a URL flag so the live card is unchanged until Karl has played the new one. Git keeps the old version either way.

### Q2. When does a helpful partial move fold to one row?  (Asked)
- **A. When the student acts on the choice (as built) (recommended),** and change loop §3A to say so.
- B. On a green Next, then the choice appears (loop §3A as written; one extra click per partial move).
- C. Never fold during the problem; fold only on the next problem.

*Evidence:* `solveLoop.js:101,129-135`; Divide build notes §11 explain the two rules ("the same prompt immediately" and "Next folds") can't both hold. A keeps the prompt rule (§1A, which the brief stresses) and needs no new click. It also matches what was tested.

**Answer (2026-10-12):** A. Fold when the student acts on the choice; update loop §3A.

### Q3. What is the first rung of I'm stuck?  (Asked)
- **A. Model it, with the picture, on every card (recommended)** (loop §6 as written). Add's text reminder becomes part of rung 1's line, not a separate rung.
- B. A text reminder first, then the picture (your rule from the Add build, notes §15), and change loop §6.
- C. Each card spec decides.

*Evidence:* loop §6 rung 1 is Model it and §6 forbids text-only help at x alone; Add's build follows the earlier rule and fails that (`addBothMoves.js:199, 220`). Divide already folds the reminder into rung 1 (outline the coefficient + the counters). The loop's own code comment still lists four rungs (`solveLoop.js:28`), which is the leftover of B.

**Answer (2026-10-12):** C. Each card spec decides its first rung ("it really depends"). Follow-up answer: "Text reminders first are usually best." So the default for new cards is rung 1 = a text reminder, rung 2 = the picture. Loop §6 needs an edit: rung 1 may be a text reminder as long as the picture comes on the next rung, including at x alone with an unevaluated side. Divide (rung 1 = counters + outline) stays as built unless Karl asks.

### Q4. Do your students' Chromebooks keep site data between sessions?  (Asked)
- **A. I don't know; please give me a way to check (recommended)** (a one-line test: finish a level, sign out of the Chromebook, sign back in, open the site).
- B. Yes, data stays.
- C. No, it is wiped at sign-out (then the sheet sync is the only real save, and fixing the sign-in bug in 03 §C.1 is urgent).

*Evidence:* inferred only; districts often set Chromebooks to clear browsing data. It decides how much weight to put on local save versus the sheet.

**Answer (2026-10-12):** B. Chromebooks keep site data. New request: prompt sign-in at every visit, before play. On sign-in, the more advanced progress wins; never overwrite more progress with less. (Note: both the app and the sheet already merge level by level and never un-finish a level; the sign-in bug in 03 §C.1 is what stops it working.) Follow-ups: the prompt can be skipped ("Not now") but should nudge, and asks again next visit; a student who signed in before is signed in silently (the device token), no prompt.

### Q5. How far should Count it and Build it be aligned with Solve it?  (Asked)
- **A. Shared frame only (recommended):** the same header, colour tokens, number pad, help placement, line position and type sizes; their own pedagogy (type the answer first, steps, supports) stays. Remove their 2.5 s auto-advance.
- B. Frame plus the Solve it rules (no streaks, no steps bar, help row in the Mat, Next everywhere).
- C. Leave them as they are (your decision log, 2026-10-11: "Only the equations section is retrofitted").

*Evidence:* `DECISION-LOG.md` "Structure", last bullet; screenshots show different line position (bottom vs top), help placement (palette vs help row), streaks and a steps bar on Count it / Build it. Their timer (`main.js:517-518`) breaks a rule you wrote for Solve it ("nothing advances on a timer"); whether it applies to the other sections is the question.

**Answer (2026-10-12):** A, refined: the home screen and card menus are the same across sections; the lesson screens vary naturally (Solve it has the Move / Why? panel). After a plain explanation of "same frame" (the parts around the problem: header, the line, help buttons, number pad, colours, sizes; not how each card teaches).

## Queued for later batches (my current recommendation in bold)

- **I6. Branch name.** You asked for `audit`; this session was assigned `claude/friendly-faraday-xzolrt` and pushes only there. **Keep this branch for the audit; open a PR or rename later.** (Asked in chat, not in the batch.)
- **I7. The shape of a card configuration.** **A card = pack entry (levels, generator) + one loop config (`startBoard, alone, moves, lights, slips, rungs, teach, collapse, pictures`) + its feedback table. The play adapter and the screen become generic.** Evidence: `solveLoop.js:17-32` already lists most fields; `divideMovesPlay.js` and `addBothPlay.js` are near copies.
- **I8. Where shared pieces live.** **A new `src/solveit/` (or `src/shared/`) folder; nothing shared stays in a card file** (`addBothMat.js`, `lightScreen.js`, `addBothFeedback.js` today host shared code).
- **I9. How Count it and Build it relate to Solve it.** **Count it is the source of the models Solve it reuses (counters, Party/Battle, the group diagram from Group It); Build it is the source of expressions (Combine like terms, Distribute) that later Solve it moves will use. Solve it should import their drawings, not copy them.** Evidence: Divide's diagram borrows Group It's; the move list already contains Distribute and Combine like terms.
- **I10. The old One-step and Two-step cards.** **Hide One-step once Divide it is confirmed (keep its bits in the save code; its `ax = b` level already credits Divide L2). Keep Two-step until the new two-step card exists.** Evidence: `packs/index.js:91-104, 129-138`; they break most of the loop and duplicate Divide.
- **I11. The name "Flip it".** Count it already has **Flip It** (subtracting integers); the designed Solve it card is **Flip it** (flip every sign). **Rename one before Flip it is built** (e.g. the Solve it card "Opposite it" or "Flip everything"), because the pack id, save code and teacher sheet all key on names students see. Evidence: `packs/flipit.js:7`, `SPEC-FLIP-IT.md:1`.
- **I12. Divide L1 items.** **The fraction in a "do" item should always divide the number of groups on the side it is taken from** (so ⅓ of `3 × 4`, not ⅓ of `4 × 9`), so the picture can show "keep 1 of 3 groups". Evidence: 03 §B.5.
- **I13. Trade places on Add L5.** **Record it in the Add spec (rev 2.4) as built, or remove it; today the spec and the build disagree.** Evidence: Add build notes §17 vs spec line 5.
- **I14. Answers of ±1 on Add.** **Ban them (loop §8 wins over the Add spec).** Evidence: 03 table line 10.
- **I15. The help row and pad position on Add.** **Same layout as Divide (wide screen: picture area between stack and panel) so Add fits 1366×768.**
- **I16. Fit target.** **Test at 1366×657 (a Chromebook with the browser's bars), not 1366×768**, since that is what students see. Divide fails it by 87 px today.
