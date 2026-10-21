# Build K report: the new Two-step equations card, in basic form (2026-10-21)

Everything is on `main` and live, with no flags. Each push came after the unit tests (1,330 pass) and `npm run parity` passed. The live
site was walked: all 15 new Features to check items pass on https://karlmaukskoepke.github.io/AlgebraMat/, and so do the 38 older ones.

## What was built
- **The card.** Its id is `two-step-equations` (the old id `two-step` keeps its 7 saved levels and their meaning). Title "Two-step
  equations", subtitle "Add, combine, then take a fraction". It sits in the old card's slot in Solve it, after One-step equations.
- **Moves:** Add (all levels); combining the other side by dragging one number onto the other and typing the sum; Multiply › fraction;
  Trade places from Level 3; Flip everything from Level 5. Multiply's whole number says "That move unlocks on a later card."
- **Karl's rule "B":** the fraction and the flip are live only when each side is one term. Before that they say "That move works once
  each side is one term." Flip below Level 5 says "That move unlocks on a later level." So does −⅓ in one move, which comes with Flip.
- **Nothing is worked out for the student:** after Add the other side stays `19 − 4` until they combine it; after the fraction it is
  `x = ⅓(15)`.
- **Judging.** These are helpful:
  - an Add that cancels the number beside x (Add first at Level 3 is never red);
  - a combine with the right sum;
  - a fraction that splits;
  - a flip of a minus;
  - Trade places, which counts as the move on a forced problem.
- **The other cases:**
  - An Add that does not cancel gets Add to both sides' own spotlight words.
  - Adding the number in front of x at `3x = 15` (−3 or 3) gets the new message: "3x is three x boxes, not a 3 to cancel. Adding −3 does
    not take them away. To get one x, take a fraction of the three x boxes: ⅓." The 3x is outlined and the added numbers are lit.
  - After Undo, Divide it's hint: Multiply's options open, the fraction lit and previewed, "one of the 3 x boxes is ⅓".
- **Lights:** Fewer terms and Solved for x, computed from the shapes; they work with a minus on x. After a fraction or flip, Fewer terms goes
  back to off rather than showing "no change", since that move is not about the number beside x.
- **The check:** `3 × 5 + 4 = 19`. An x with a minus after a number reads as subtraction: `4 − 3x = −11` and `4 − 3 × 5 = −11`.
  - The check is full at Levels 1-2 and short from Level 3: the first line, then Balanced.
  - A wrong value always gets the full check.
- **Slips (new tags):** `skipped-fraction` (15 for `3x + 4 = 19`), `added-constant` (23), `sign-flipped` (−5). After Undo, the hint
  lights the needed move.
- **Help, basic form:** I'm stuck gives the reminder only, recorded as `hint`. There is no Teach me, no seesaw and no counters.
- **Flip everything:** the first flip of a level that helps shows "Multiplying both sides by −1 flips every sign. −x becomes x."
  - It is the same small pop-up beside the panel as the first Trade places, and it shows once a level, the way Trade places does.
  - It shows on both cards.

## Shapes (classifier and registry)
Two-step boards are read with their own family, `shapeOfBoard(board, 'two')`. Each shape is order-free (`4 + 3x` is the same as
`3x + 4`), sign-normalised, and the same with x on the right. Counts are the states seen in the shape tests: 200 problems a level, all
seven levels, along every path. The paths are the optimal one (with Trade places, and either order of flip and fraction), and each slip
undone: bigger, part-cancel, zeroed, the x boxes, a wrong sum, a fraction that doesn't split, a flip of a plain x, and I'm stuck twice.

| Shape | Board | Entry | States seen |
|---|---|---|---|
| W1 (new) | `ax + c = b` (any order, either sign of a) | Add to both sides' reminder (S1's), with these numbers | 19,604 |
| W2 (new) | `ax = b + k` (after Add) | new reminder: the two numbers lit, "Put them together: drag one onto the other…" | 12,856 |
| W3 (new) | `ax + c′ = b + k` (an Add that did not cancel) | waits for Undo | 4,035 |
| W4 (new) | `ax + c′ = 0` (the other side zeroed) | waits for Undo | 664 |
| D1 | `ax = b` | Divide it's | 20,248 |
| F1 | `−x = b` (after ⅓ of `−3x`) | Flip everything's | 570 |
| F2 | `−ax = b` | Flip everything's | 5,159 |
| F4 | `x = −(b)` | Flip everything's | 295 |
| F5 | `x = ⅓(b)` or `x = −⅓(b)` | Flip everything's | 15,751 |
| DF | a fraction that does not split | waits for Undo, then the fraction cycle | 1,400 |

No unknown shape was reached. Unknown boards still fail loudly in tests, and a coverage test checks that every shape has an entry.

D1's reminder now finds x on either side; Divide it's results are unchanged. D1 also brings Divide's picture rungs, but this card never
shows them: in basic form I'm stuck asks the registry for the shape's reminder only.

**Shapes with no clean reminder:**
- W3, W4 and DF have none on purpose: they wait for Undo.
- F5 with a minus still reads "the opposite of 1 of 3 equal groups of 15" (from Build J).

## What the Add change on coefficient boards touched
The Add move's own code was lifted out of the Add card into a shared module, `engine/addMove.js` (the move, its checks and its judging).
The Add card and the Two-step card both use it. Three small changes let a board carry a number in front of x:
- The work row writes `3x`, not `x`.
- A number written before x (`4 + 3x`) keeps its place.
- The check writes `4 − 3x`, as above.

Add to both sides' boards never have any of these, so its rows are byte-for-byte the same; parity confirms it.

Other shared pieces were made to take a second card rather than copied:
- **Add's term layer** (drag, combine, the Add blank) and **Add's screen** take a card. The Two-step screen is Add's screen configured
  with the shared Multiply row.
- **The flip and its fraction** were lifted out of the Flip card into `engine/flipMove.js`.
- **The shared Multiply menu** can say why a greyed option is grey.
- **The shared loop** can give the reminder only.

## Legacy credit, as built

| New level | Credited when the student finished | Note |
|---|---|---|
| 1 `ax + b = c` | old Two-step 1, or Switch sides 5 | |
| 2 `ax − b = c` | old Two-step 2, or Switch sides 5 | |
| 3 x on the right | old Two-step 4 | the old L4 is the three forms turned round |
| 4 `b + ax = c` | old Two-step 3, or Switch sides 5 | |
| 5 `b − ax = c` | old Two-step 5 | |
| 6 negative answers | old Two-step 6, or Switch sides 6 | |
| 7 all mixed | old Two-step 7 | |

I compared the forms and found the brief's mapping right.
- Switch sides 5 has one each of `ax + b`, `ax − b` and `b + ax`, so it credits 1, 2 and 4.
- Switch sides 6 is negative answers, so it credits 6.
- Nothing else is credited. The only difference is that the old levels allowed an answer of 1; that is not a skill.
- Levels open up to the highest credited one, as today.

**One change:** a level finished on an old card now counts on its new card straight away. Before, it counted at the next load. This
applies to all the credited cards.

## Save codes and the class sheet
- **v16** appends the new card's 7 levels (88 bits, 18 symbols). Every recorded older code decodes to the same progress and carries
  over into v16 unchanged (tested). Codes stay hidden.
- **The class sheet** adds the new columns (`two-step-equations-1` … `-7`) by itself, and the old `two-step-` columns stay. There is no
  manual step: the app sends 14 packs with levels, under the sheet's limit of 30, and 7 levels is under its 20.

## The old card and the diagnostic
- Two-step is `retired: true`. It is off the home screen and kept in the pack list with its bits. No code, files, tests or ids were deleted.
- Its links still open it; they are under Retired on the test-links page.
- The Solve it diagnostic's two probes of the old card (Levels 2 and 5) still run: same problems, same checking.
- But what they open is the old card's levels, which no longer show. A student placed by the diagnostic starts the new card at Level 1.

## Worst-case rows, seeds and slips
- **Rows** (generator report, 200 seeds a level): Levels 1, 2 and 4: 11; Levels 3, 5 and 6: 12; Level 7: 13.
  - The count is conservative: it gives Trade places its own row, and in play it folds into the Add row.
  - The tallest case (Level 7, Trade, Add, flip, fraction, then a wrong value with the full check) fits at 1366×650 with room to spare
    (`k-worst-650.png`).
- **Seeds checked:**
  - 200 seeds a level for every generator rule: substitution, never 0 or ±1, a 2-5, b 1-12, |c| ≤ 30, no repeats, no slip equal to the
    answer, each level's forms and signs.
  - 300 seeds a level with no failure to fill.
  - 40 seeds a level (200 problems) walked through every path for the shapes.
- **Slip collisions:** typing c + B equals −x on some problems (`added-constant = sign-flipped`). That is 30, 13, 38, 26 and 22 of 1,000
  at Levels 2, 3, 5, 6 and 7, and none at Levels 1 and 4. The tag order records `added-constant`.

## Parity
- **Compared directly with `main` before this build:** problems, class-sheet records and all 25 scripted runs are identical, and all 62
  Add and Divide screens match pixel for pixel. The save codes are written as v16 with the same meaning; the intended changes are
  listed in `tests/parity/INTENDED-CHANGES.md`.
- **Flip everything** has no scripted runs, so I compared it with `main` directly: 1,000 problems through two paths each give identical
  states. The only difference is the new first-flip pop-up, which those paths don't trigger.

## Decisions for Karl (recommendations first)
1. **The diagnostic still places students on the old Two-step card.** *Recommend:* point its two probes at the new card's matching
   levels in the next build. It needs care, because saved diagnostic places depend on the probe order.
2. **The first-flip pop-up shows once a level, like Trade places.** It does not show once ever. *Recommend:* keep, so a student coming
   back meets it again.
3. **The three-x-boxes message shows only when the number added is the number in front of x** (±3 at `3x = 15`). Any other amount gets
   Add's usual "did not eliminate the term". *Recommend:* keep.
4. **After a fraction or a flip, Fewer terms goes back to off.** It does not show "no change". *Recommend:* keep.

## Pictures (this folder)
All are at 1366×768 and 1366×650:
- each level's opening (`k-level-1` … `k-level-7`);
- Add, combine, fraction (`k-worked`);
- the three x boxes (`k-boxes`);
- the greyed fraction (`k-frac-grey`);
- Level 3 with the Trade places ring (`k-trade`);
- a negative coefficient flipped (`k-bax-flip`);
- I'm stuck, reminder only (`k-stuck`);
- the home screen with the new card in place (`k-home`);
- the first-flip pop-up on Flip everything (`k-flip-intro`);
- a student's wrong sum (`student-two-step`);
- the tallest case (`k-worst-650`).
