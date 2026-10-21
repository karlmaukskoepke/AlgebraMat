# Build J report: the Flip everything card, in basic form (2026-10-21)

Everything is on `main` and live, with no flags. There are three pushes: the card plus the shared fraction move (`a3980b1`), then the test page, walks and spec (`1585558`), then this report and the pictures. Each was pushed only after the unit tests and `npm run parity` passed. Unit tests: 1251 pass.

**The live site was walked.** It is reachable from this container now. All 38 Features to check items pass on https://karlmaukskoepke.github.io/AlgebraMat/: the 13 new ones, and also Build I's and Build H's, which had never been walked live before.

## What was built
- **The card.** Its id is `flip-everything`; `flipit` stays Count it's subtraction card. It sits in the Solve it section after Divide it and before One-step equations. Its title is "Flip everything" and its subtitle "When x has a minus".
- **Flip everything** is the panel's Flip button and also Multiply's −1 × ( ) option; both are the same move.
  - Hovering it previews `−1 × (−x) = −1 × (12)`. Go writes that line, then `x = −(12)`, and the other side is never worked out for the student.
  - A flip is helpful when x has a minus. On x with no minus it is unhelpful: the spotlight frames the new −3x, says what happened in the real numbers, and leaves only Undo; after Undo comes the hint.
- **Take a fraction** is live from saved Level 4 and is shared with Divide it.
  - The move itself, its blank, its preview, the failure when a fraction doesn't split, and the fractions to choose from afterwards were lifted out of Divide's files into `engine/fractionMove.js`, `engine/multiplyMenu.js` and `view/multiplyRow.js`. Divide is now one configuration of them.
  - On this card the top of the fraction can be −1, so −⅓ of both sides in one move is accepted (Karl: accept both).
  - Every order is helpful: flip then fraction, fraction then flip, or −⅓ in one move.
- **Trade places** is live from saved Level 3, and either order works (trade first or flip first). The first Trade places pop-up on both cards now ends: "This is the symmetric property: if a = b, then b = a."
- **Moves that are greyed:** Add and Multiply's whole number ("That move unlocks on a later card."). Before saved Level 4 the fraction option says "That move unlocks on a later level."
- **Lights:** No opposite box and Solved for x; the other lights stay off.
  - The shared Smaller numbers light now compares by size, so −3x to −x lights it.
  - Divide's results are unchanged; tests compare it against the old rule.
- **Save codes:** a v15 layout appends the card's six levels at the end (17 symbols). All 72 recorded v14 codes decode to the same progress and carry over into v15 unchanged (tested). Codes stay hidden from students.
- **Class sheet:** it adds the card's columns (`flip-everything-1` … `-6`) by itself. There is no manual step, and the new card is pack 14 of the sheet's limit of 30.

## Numeric "See why it works": not shipped
Divide's numbers-only level is its own engine, screen and watched walkthrough, about 500 lines. Building one for this card (flipping both sides of a balance, the opposite box drawn as −□) is large, so per the brief the card ships with the button hidden. Saved Level 1 is reserved; a link to it plays the first equation level.

## Shapes (the classifier and registry)
Flip boards are read with the card's own family (`shapeOfBoard(board, 'flip')`), so `3x = −12` here is not Divide's D1 with its counters. All shapes are sign-normalised, and x on the right is the same id.

**Counts:** states seen in the shape tests: 200 problems a level, saved Levels 2-6, along every path (each order, −⅟a, the unhelpful flip and Undo, a fraction that doesn't split, the sign slip).

| Shape | Board | States seen |
|---|---|---|
| F1 | `−x = b` | 8,504 |
| F2 | `−ax = b` | 14,217 |
| F3 | `ax = b` | 10,133 |
| F4 | `x = −(b)` | 10,872 |
| F5 | `x = ⅓(b)` or `−⅓(b)` | 5,524 |
| FF | a fraction that does not split | 838 |

No unknown shape was reached. Unknown boards still fail loudly in tests.

**Shapes with no clean reminder:**
- **FF** has none on purpose: it waits for Undo, then the fraction cycle.
- **F5's negative case** reads "−⅓(12) is the opposite of 1 of 3 equal groups of 12". It is correct but a mouthful.
- After a fraction fails on `−3x = 12`, the shared fraction picture shows three ordinary boxes, not opposite boxes.

## Worst-case rows (generator report, 200 seeds a level)

| Saved level (shown) | As one column | Notes |
|---|---|---|
| 2 (Level 1) | 9 | |
| 3 (Level 2) | 10 | Trade places adds a row |
| 4 (Level 3) | 10 | a folded flip |
| 5 and 6 (Levels 4-5) | 11 | x on the right with a number in front: Trade, flip and fraction |

The check column is 4 rows. At 1366×650 the tallest case fits with room to spare (`j-worst-650.png`), because Trade places and the flip fold into one row.

## Seeds checked
- 200 seeds a level for every generator rule: substitution, no 0, ±1 or ±a, no repeats, both signs of b, and each level's form mix.
- 300 seeds a level with no generator failure.
- 40 seeds a level (200 problems) walked through every path for the shapes.

**Slip collisions:** for `−x = b`, typing b is both `sign-flipped` and `ignored-front`. That is every problem at saved Levels 2-3, and about 455 of 1,000 at 5-6. The tag order records `sign-flipped`. There are none at saved Level 4.

## Parity
- **Divide it is unchanged.** Compared directly with `main` before this build (Build I): problems, class-sheet records and all 25 scripted runs are identical, and all 62 screens match pixel for pixel.
- **The only intended differences** are the 72 save-code strings, now written as v15, and 6 new save-code keys for the new card. All are listed in `tests/parity/INTENDED-CHANGES.md`.
- **Add to both sides:** its first Trade places pop-up gains one sentence. None of the 31 parity screens shows that pop-up.

## "Never grey out what the question is about"
The unhelpful-flip spotlight keeps the whole new equation lit, as well as the framed −3x. The reminders keep the equation readable; they do not dim the page.

## Decisions for Karl (recommendations first)
1. **The "See why it works" numbers level is not built.** *Recommend:* build it in the next Flip pass, together with the seesaw scaffold, since both draw the opposite box.
2. **The −1 move lives in two places:** the Flip button and Multiply's −1 option, as the brief asks. *Recommend:* keep both.
3. **The reminder on `−3x = 12` names Flip first** (then ⅓), though every order is accepted. *Recommend:* keep; it matches the worked example.
4. **When Trade places and a flip fold together,** the folded row is labelled "−1 × both sides". *Recommend:* leave for now.

## Pictures (this folder)
Each level's opening (`j-level-1` … `j-level-5`), a helpful flip, the unhelpful flip's spotlight, −⅓ in one move, the check for a negated x, typed 12 then the hint, Trade places with the symmetric-property line, the forced move, I'm stuck (`student-flip-stuck.png`) and the worst case at 650. Each is at 1366×768 and 1366×650. They are linked from the test-links page under Live, "Build J screenshots".
