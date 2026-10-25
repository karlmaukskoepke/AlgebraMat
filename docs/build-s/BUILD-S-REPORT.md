# Build S report: redraws, text size, drags, Flip's cross-off (2026-10-24)

Everything is on `main` and live, with no flags. Each push came after the unit tests (1650 pass, including the new real-browser sweep)
and a full `npm run parity` (problems, save codes, class-sheet records and the 25 scripted runs unchanged; 16 screens differ, each listed
under "Build S" in `tests/parity/INTENDED-CHANGES.md`). The Features to check items were walked on the live site
(`node tests/features/walk.mjs https://karlmaukskoepke.github.io/AlgebraMat/ docs/build-s`). Loop spec: rev 2.7.

## Part 1: the causes

Reproduced in Chromium at 1366×768 on every Solve it card.

- **The replay (bugs 1, 2, 3 and Build P's Undo fade-in).** Every change of state, even a pickup, a key or a hover, drew the whole Mat
  again from scratch (`main.js` replaced it), so every row was a new element and a new element plays its entrance animation. A guard was
  meant to draw a row "already settled" the second time, but it was keyed to Add's typed move only (`s.work`): after a drag across, a
  combine, Divide, Flip or a distribute it never matched, so the newest rows replayed on every redraw. The fade-in starts invisible and
  waits 1.6 s, which is the "vanishes, then reappears". Undo made the row above newest again, so it faded in again.
  Cards affected: Add to both sides, Two-step, Distribute, Variables on both sides (all drawn by the Add screen). Divide it and Flip
  everything drew every row already settled (an earlier fix), so they never replayed, but their cross-offs never animated at all.
  Pictures: `s-replay-before-*` (the previous build: 1 divided, 2 the moment 5 is typed, the last line gone and the 3s un-struck, 3 it
  coming back) and `s-replay-after-*` (this build: nothing moves).
- **The font size (bug 4).** One style rule shrank every row from 46 px to 32 px (work rows 32 → 24) as soon as the stack held a fourth
  row, and its padding too; Undo back to three rows made them big again. Nothing was fitted to width or height.
- **The drag (bug 5) and the first drag after distributing.** One cause. A drag across the = makes the Add move; when the move before it
  still showed its work (not yet folded with Next), making the move folds it first, which empties the undo history. The drag checked
  "did the move happen?" by the history getting longer, so it read the move as refused, put the term back and cleared the message
  ("Distributed" disappeared, nothing moved). With x on the right it bit more often because there is usually a move before it.

## Part 2: animations play once

The Mat is now laid onto the one on screen (`src/view/keepRows.js`): each row has a key (its place, kind and content); a row still there is
the same element and only what changed in it changes; a settled row never becomes unsettled; a row settles once its animations are over.
A pickup leaves the dashed gap and the lifted copy, and nothing else changes. The standing test `tests/screenSweep.test.js` (runs with
`npm test` in a real browser, skipped where Playwright is not installed, which includes GitHub's check) plays every card and level through
the honest path, picks up every term, hovers, types into x =, clicks the fraction bar, presses Undo, goes through the check, and fails if a
row already on screen starts an animation or is taken off and put back. With the old redraw it fails at once.

## Part 3: the text size

Chosen once, when the problem starts (`src/view/fitSize.js`): the honest path is played ahead (`src/engine/solveit/honest.js`, Next pressed
after every move, so every move keeps its own row), its biggest moments are drawn out of sight, and the largest of 46/42/38/34/32 px is
taken at which nothing scrolls, no row runs past its space and the check's pop-up has room away from `x =`. It never changes within the
problem; a new window size chooses again. The sweep records the size at every step and fails on any change.

Sizes chosen (first five problems of seeds 7 and 1, every level):

| Card | 1366×768 | 1366×650 |
|---|---|---|
| Add to both sides | 46 | 46 |
| Divide it | 46 | 32 |
| Flip everything | 46 | 34 (Levels 1-2), 32 (Level 3), 32 or 34 by problem (Levels 4-5) |
| Two-step equations | 34 | 32 |
| Distribute, combine, solve | 32 | 32 |
| Variables on both sides | 34 (Level 1), 32 (Levels 2-5) | 32 |

The multi-step cards open smaller than before (they used to open at 46 and drop to 32 at the fourth row). Pictures: `s-same-size-1/2/3`.

## Part 4: drags

Fixed: the refused-but-made drag (above). The drag sweep (every term of the newest row, to across the = at both ends, onto each term,
between terms, onto a parenthesis, away from the equation) found these silent drops, now each with its message and the term put back:

- a term dropped on a term it cannot combine with (x onto a number, a number onto an x): "Only like terms combine: an x-term with an
  x-term, a number with a number." (every card whose terms can be picked up);
- a term dropped onto a parenthesis, or a parenthesis onto a number: "A parenthesis has to be distributed before anything joins it. Drag
  its number onto the parenthesis first." (Distribute, Variables Level 5);
- a parenthesis's factor let go on the equation but not on its parenthesis: "Drag the 3 onto its parenthesis to multiply it in."
  (Distribute, Variables Level 5).

Dropped where it was, or away from the equation, a term simply goes back (no message), as before.

## Part 5: Flip's cross-off

Each cancelling minus gets a red vertical stroke (so it reads as a plus), drawn over 1.3 s, the second starting 1.5 s after the first;
then the two fade a little and the next row comes in (about 3.4 s). Reduced motion: both pluses drawn, still. Applies to the Flip button,
dividing by −1 and dividing by a negative (its minus signs; its numbers keep the usual cross-off). On Divide it and Flip everything the
newest flip now animates once (their other cross-offs stay drawn still, as before). The cross-off of the two 3s is unchanged: 0.45 s,
both at once, after 0.7 s. Pictures: `s-flip-1/2/3`.

## Part 6: Add's options

On Variables on both sides, pointing at (or tabbing to) `+ ▢` or `+ ▢x` draws the grey ghost row with dashed boxes, the x after each box
for the second. Pictures: `s-add-options-*`.

## Surprises

- On the previous build, at 1366×650, Divide it's check pop-up ("Drag the 4 onto an x above.") covered x =, so the value could not be
  picked up. The size chooser now keeps that pop-up off x = on every card (the sweep checks it).
- Drawing the board ahead to choose the size used to close the once-a-visit "Find the value of x." pop-up; fixed before pushing.
- The full live walk of every Features to check item found one thing this build broke: Build I's big-number questions (the first box
  moved 6 px when the second appeared), because the row they ask about was still fading in. Fixed: a pop-up over rows already on screen
  makes them finish their entrance at once (they jump to how they end; nothing replays). Walked again: passes.
- A development-only hook (`window.__mat`) lets the browser tests drive the app; it is not in the students' site.
