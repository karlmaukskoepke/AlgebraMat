# Build V2 report: Strange solutions Levels 4-5, No solution and Infinitely many, Try a number with the balance (2026-11-07)

Everything is on `main` with no flags, in three pushes: **Part A first, on its own** (and a follow-up that keeps Count it and Build it
unchanged), then **Parts 0-6 together** (the conclusion buttons and Level 4, Level 5, Try a number, the balance, the class-sheet change,
the no-help mode). Each push came after the unit tests, the real-browser sweeps and `npm run parity`. Decision log: "2026-11-07: a placed
level needs one more problem" and "2026-11-02: Strange solutions Levels 4-5 and the balance". Loop spec: revision 2.20.

## Part A: a placed level needs only one more problem

**How it played before (the same on every route):** a placed level (a no-help pass on an open level, a locked level's no-help pass, the
placement quiz, an older card's credit) opened on **problem 1 of 5**, five empty dots. The first problem solved with at most a reminder
showed "Level N earned!" for a moment and turned the level gold, but the level carried on to problem 5 and nothing told the student they
were done. With more help than a reminder it stayed silver until a problem was solved with less. So yes: the quiz-placed and legacy-placed
levels behaved exactly like the no-help-placed ones. Build X's rule was honoured by the progress record, not by the level screen.

**Now (every route, Solve it and Solve it Plus cards):** a placed level opens on **problem 5 of 5** (the level's fifth problem for a fresh
seed, never one of the attempt's), the first four dots **silver** (credited, not worked). Solving it earns gold and shows the usual "Level N
complete!" panel (Level N+1 →, Keep practicing). Help works as on any problem, and the level is earned when the problem is solved, whatever
help was used. One extra rule: on Add's family of cards a correct guess normally owes one more problem solved with a move; on this one
problem it does not (Karl: "not asked for more"). Unchanged: earned levels, a level in progress (a reload resumes it, silver dots kept),
the quiz and its credit, save codes, class-sheet rows, the chooser. **Count it and Build it are unchanged** (their placed levels still open
at problem 1): the first push applied to them too and was corrected in the next push, minutes later.

## Part 1: Levels 4 and 5 (200 seeds a level, unit-tested)

- **Level 4** (named "No solution or infinitely many"): problem 1 is always Karl's form, positive numbers and the same x-terms
  (`5x + 3 = 5x + 7`, `3x + 1 = 3x + 1`). Then one infinitely many and one no solution in any form (negatives and subtraction,
  `−6x + 1 = −11 − 6x`; a group, `2(x − 7) = 2x − 14`; Karl's shapes with the x-terms not yet together, `5 + x + x = 2x + 5`,
  `3x − 9 + x = 4x − 9`), then two ordinary problems: a fraction answer (Level 1-3 kinds, and `5x + 2 = x + 7`, like Karl's `4x + 1 = x + 5`)
  and **the zero case in every set** (`3x + 4 = 4`, answer 0). 200 seeds: 389 no solution, 211 infinitely many, 400 one solution.
- **Level 5** ("All mixed"): a group in every problem (a whole factor, a negative factor, the invisible −1, a fraction factor), with one no
  solution, one infinitely many, one fraction answer, one 0, and one more of any kind except 0 in every set.
- Each problem **stores its type**; a test checks it against a direct computation (substituting 0 and 1). Answers in lowest terms, the bottom
  2 to 6, never ±1, never whole except 0; no repeated equations or answers; every answer checked by substitution with exact fractions.
- **Worst-case rows** (honest path, every move on its own row): Level 4: 6 (`2x − 6 = 6x − 12`, seed 1); Level 5: 9
  (`−5(x − 1) + 3x = −6x − 5`, seed 52); longest check 5 and 9 lines.
- **Text size** (first problem, seeds 1-6): Level 4: 46 px at 1366×768 and at 1366×650 (the first problem is always short); Level 5:
  38-42 px at 768 and 32-42 px at 650. Levels 1-3 are 38-42 px and 32 px, so nothing drops below them.
- **Slip collisions** (1,000 problems a level): Level 4: frac-reduced-wrong = half-collected 9, sign-flipped = half-collected 9,
  frac-swapped = frac-no-divide 8, frac-no-divide = x-sign-lost 7, frac-reduced-wrong = x-sign-lost 4. Level 5: frac-no-divide =
  half-collected 37, sign-flipped = half-collected 20, frac-reduced-wrong = half-collected 15, frac-no-divide = x-sign-lost 13,
  frac-reduced-wrong = x-sign-lost 12, frac-swapped = frac-no-divide 5, a three-way 2.
- **"New levels added!"** checked with `?demo=grew` (now: Levels 1-3 earned): the note shows once under the name, the card is silver,
  "3 of 5", the three earned levels kept; after a reload the note is gone. Build X's mechanism needed no change.
- **Level 5's pool** is thinned evenly (every 10th one-solution and every 4th no-solution candidate) so a set is drawn in about 20 ms, as
  Level 4's; the first version took 180 ms a set and timed out two standing tests.

## Part 2: x disappears; the conclusion buttons

- **Reaching the statement** works on every path I tried, and on all 1,000 problems of Levels 4-5 by the honest path: Add's x-term option
  cancels both x-terms at once (both pairs crossed, the stacked cross-out); dragging an x-term across does the same; Karl's unmerged shapes
  work in both orders (combine `x + x` to `2x` first, then cancel; or cancel first, which leaves `5 + x − 2x + x = 5`, then combine twice,
  the last combine typed `0` or `0x`, and the term drops). Add's number option can also lead there (`3x + 1 = 3x + 1`, add −1, then −3x,
  gives `0 = 0`). **No path failed to reach a no-x statement.**
- The note "x disappeared. What does the equation say?" under the greyed `x =`; the two buttons beside it in the answer row (real buttons:
  Tab reaches them, Enter or Space picks). Typing is refused while x is gone, so a typed 0 can never stand for "no solution".
- **A right pick:** the confirm line in the checking space, the picked button stays (green), the green button says Next problem.
- **A wrong pick:** the statement lit (never greyed) with "never true" / "always true", the pop-up with Undo, then the reminder at the
  buttons. Tag `conclusion-wrong`, the pick recorded in the answers column (`Infinitely many → conclusion-wrong`).
- **Shapes NT and NF** (no x, true and false) have their reminder, "x disappeared. Is this statement ever true?", at the buttons. Shape
  counts on the honest path (200 seeds): Level 4: V1 610, E2 580, W1 400, NF 389, NT 211, D1 200, F5 200, W2 200, SD 200, VE 190, SQ 145,
  VP 75, SR 55. Level 5: E2 1,163, VE 922, VG 638, W1 528, NF 385, W2 332, SD 332, NT 304, SQ 233, F5 200, V1 188, VH 184, VF 137, F2 101,
  SR 99, D1 99, E1 70, VP 41, W4 4. **No unknown shape.**

## Part 3: Try a number

After a right pick, "Try a number" opens a box in the checking space (`x = [ ]/[ ]`: a whole number, a fraction, or a decimal, which is
read as its exact fraction, 1.5 is 3/2). The green button becomes **Try**. **How the check handles x being gone:** it uses the original
equation (row 1, the one at the top). The student drags the value into each x of that row, one drop per x, and steps through the usual
check, a line per Enter. It stops at the last line with no Balanced or Not balanced mark (so it is never red), and the balance takes its
place. Never graded, no Undo, nothing recorded (no answers, tags or supports; the problem stays solved). The line after says the pattern:
"Try another number: it is still heavier by 10." or "Try another number: it balances every time." The button stays for more tries.

## Part 4: the balance (drawn from Karl's page, in the Mat's own code)

**What I copied from `karlmaukskoepke/Balanced_Or_Not-`** (`js/balance.js`): the drawing size and every part (stand, post, beam with its
pointer, dashed chains, pans), the colours and gradients, the **size rule** (each piece `24·√|value|`, at least 30), blocks with a blue edge
and a white bevel, the **dashed hatched block marked 0** for a value of 0, one net number per side as a **green ball** (positive) or a **red
balloon on a string** (negative: that is how his page draws a subtracted number; the brief guessed a green token with its sign), blue-edged
balloons for blocks of negative value, his easing (a short exponential follow) with the little settle at level, and the snap under reduced
motion. The totals sit under the pans with their working, `7(3/2) + 3 = 27/2`.

**What I changed:** (1) **the tilt's scale**: his page scales the tilt to each equation's slider range, and a no-solution equation always
leans 60% of the cap. Here there is no slider, and you asked for a tilt that grows with the difference and is capped. So it is his curve,
18° × (difference ÷ 10)^0.6: a difference of 10 or more leans fully (the cap). (2) An x-term with a minus (`−6x`) gives blocks stamped with
the opposite value; his 12 equations have none. (3) Pieces are capped at 58 units and fold onto more rows when a pan is crowded, never
the text. **Nothing failed to fit** at 1366×768 or 1366×650 (the largest pans are 9 blocks of a 3-digit value).

- It is a picture (role img), its accessible name the same sentence as the line under it; nothing in it is a control.
- It sits in the checking space, never over the work, the panel or a pop-up (the panel-room sweep passes); on a narrow window it drops
  below the work with the checking space.
- It shows only what the student tried.
- **Blue clash (parked for the colour pass, not changed):** his blocks' blue edge (#1F5FBF) means "x". The Mat's blue (#0072B2) means the
  operation in the work rows (the `+ −7x` under each side) and the value dropped into x in the check. On the screen with the balance both
  blues are visible at once: the blocks (x) and, just before, the value in the check (also x, so that pairing agrees). The clash is with the
  work rows' blue "+ −7x" (an operation).

## Part 5: class sheet and progress

- Unsimplified tries are listed in the answers column: `15/6 → unsimplified` (every unsimplified try, not only the second).
- A wrong pick is listed as `No solution → conclusion-wrong` or `Infinitely many → conclusion-wrong`. A right pick is not listed, as a right
  value never is (the answers column holds what went wrong). **Nothing to do in the sheet:** the script takes any typed text (up to 20
  characters) and any tag (up to 30).
- Levels 4-5 columns (`strange-solutions-4`, `-5`) fill in now; save codes unchanged (the bits were reserved in Build V); levels unlock in
  order; no legacy credit or diagnostic; Try a number writes nothing.
- **Level names** for the popup: Level 4 "No solution or infinitely many", Level 5 "All mixed". The popups, the statuses, "N of 5", the
  test-out doors, the chooser and the card page show five levels.

## Part 6: the no-help mode

The conclusion buttons and their note appear in an attempt (they are the answer); "Try a number" and the balance do not. **Independent**
is unchanged: the first pick counts as the first value checked. A wrong pick on a locked level ends the attempt (the fail panel); on an open
level help comes on, with the wrong-pick spotlight and Undo. The confirm line after a right pick is kept, as Balanced's line is. The
"unsimplified" nudge stays (as Build Z kept it). Added to the test-out sweep (locked and open Level 4, a right pick, a wrong pick, no Try a
number, no balance) and to Features to check.

## Found on the way (fixed)

1. **Flip crashed the card on a statement with no x** (`3 = 13`, ×(−1): a page error). Found by the no-times-sign sweep. Every move that
   needs an x (Add, Multiply, Divide, Flip, Trade places) is now not made while no x is left, with "x disappeared: no move is needed. What
   does the equation say?", never red. Dragging and combining the numbers still works.
2. **The reminder after Undo said "(7x is the one with the smaller number in front.)"** when both x-terms are 7x. Now the parenthesis is
   left out when the two sides' x-terms are the same (only Strange solutions Levels 4-5 have such boards).
3. **Add's x-term option kept the number of an undone Add** (typing −7 made −37). Switching between the number and x-term options now starts
   the blank empty. This is shared with Variables on both sides and Distribute more (parity unchanged).
4. **The drag sweep's way back to a state** replayed moves by term ids from before a reload, so on one Level 5 path every drag "did
   nothing". It now works each move out again from the board. A drop past the end of a very long side that lands in the checking space now
   counts as a drop away from the equation (it goes back, as any such drop does).

## Checks

- **`npm test`** (Playwright found, no "screenSweep: SKIP"): Part A push: 113 files, 2,410 tests, one expected failure fixed (the old
  "Level 1 earned!" note in the chooser sweep). Parts 0-6 push: 114 files, 2,470 tests; the last full run had one failure, the drag sweep
  above; after the fix that sweep was rerun and passes (the fix touched only that test file). **The sweeps:** typing, drags, redraws, font size, panel room, the Add cross-out, the menu, form words,
  no-times-sign, parentheses, the test-out sweep (its 18 runs plus a new Strange solutions Level 4 check) and the chooser sweep. Levels 4-5 are in every standing list.
- **New unit tests:** `tests/buildV2.test.js` (Part A; Levels 4-5 on 200 seeds, stored type = computed type, banned answers; the honest path
  finishes all 1,000 problems; the buttons, a right pick, a wrong pick, the 0/0x combine in both orders, the zero case, NT/NF) and
  `tests/strangeTry.test.js` (the balance's direction and words against a direct computation, 200 seeds × 6 tries; "heavier by" never
  changes on a no-solution problem; the cap; Try a number records nothing).
- **`npm run parity`:** PASS at both pushes on problems, save codes, class-sheet records, the 25 scripted runs and the 70 screens (none of
  them is Strange solutions or a placed level). Every screen that changes is listed in `tests/parity/INTENDED-CHANGES.md`.
- **Features to check:** 13 new items (`v2-placed-one-more`, `v2-no-solution`, `v2-infinitely-many`, `v2-wrong-pick`, `v2-unmerged`,
  `v2-try-none`, `v2-try-all`, `v2-zero-answer`, `v2-zero-not-none`, `v2-new-levels`, `v2-level5-fraction`, `v2-student`,
  `v2-student-nohelp`) and updated: `z-gold`, `x-placed-earned` (placed levels: one problem now), `x-new-levels`, `x-card-name`,
  `x-statuses`, `x-shine`, `x-reduced-motion`, `ab-pop-edge` (five levels), `z-student` (a placed level opens on its last problem).
  **The whole list (258 items) was walked on the live site:** every item passes except `z-student`, which still expected a placed level to
  open on problem 1. Its words and walk were updated, pushed, and walked again on the live site: pass.
- **A test-only link setting**, `problem=N` (with `seed=`), opens a level on problem N of its set, so the test links can show Karl's exact
  equations (`5 + x + x = 2x + 5` is problem 4 of Level 4's seed 931; `3x + 4 = 4` problem 5 of seed 178). It does nothing without a seed.
- **Pictures** (`docs/build-v2/`, from the live site, 1366×768 and 1366×650): `v2-placed-last-problem`, `v2-placed-one-more`, `v2-gone`
  (the x-vanished state), `v2-no-solution` (a right pick), `v2-infinitely-many`, `v2-wrong-pick` (and `-hint`), `v2-unmerged`,
  `v2-try-mid-placing` and `v2-try-mid` (Try a number mid-check), `v2-try-none-1` and `-2` (two tries, at the cap), `v2-try-all`,
  `v2-zero-answer`, `v2-zero-not-none`, `v2-new-levels`, `v2-level5-fraction`, `v2-student`, `v2-student-nohelp`, `z-gold`,
  `x-placed-earned`.

## Anything that surprised me

- **Karl's page draws a subtracted number as a red balloon**, not a green token with a minus. I followed his page.
- **The silver dots are quiet** at 16 px (a light grey metal gradient with a darker edge): visible, but not loud. They match the menu's
  silver.
- The green button reads **Next** while the cancel move is still unfolded, beside the two conclusion buttons. Pressing it only commits the
  move; picking a button works either way.
