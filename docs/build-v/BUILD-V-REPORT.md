# Build V report: Strange solutions, Levels 1-3 and the fraction answers (2026-10-27)

Everything is on `main` and live, with no flags, after the unit tests and `npm run parity`. Loop spec: rev 2.11. Scope as Karl set it on
2026-10-26: Levels 1-3 and Part 1. Levels 4-5 and Parts 2-3 (No solution, Infinitely many, Try a number) are V2's; their design stays
in the build brief and the decision log.

Features to check: 7 new items. Every item on the page (157, the older ones too, since this build touched shared code) was walked on
the live site and passes (`node tests/features/walk.mjs https://karlmaukskoepke.github.io/AlgebraMat/ docs/build-v`). Pictures of each new
item's end state, at 1366×768 and 1366×650, and the home card, are in `docs/build-v/`.

## Part by part

- **Part 0.** Decision log "2026-10-25: Strange solutions": the nudge, the conclusion buttons (V2), the two overrides (0 and fractions as
  answers; improper fractions full credit, no mixed numbers, no decimals), the two-layer check of a conclusion (V2), Karl's answer on the
  arcs' times sign (it stays), the queued panel, menu and cross-out build (record only), and this build's scope. Loop spec rev 2.11: a new
  section 4A (answer kinds), with the exceptions in sections 4 (answers) and 8 (generator rules).
- **Part 1.** Built: the two boxes, the nudge, the check with fractions, the slips, dividing that never fails. Details below.
- **Parts 2 and 3.** Not built (V2). The shapes for a statement with no x (true, false) and their reminder are in the registry already.

## The card

- **Id `strange-solutions`**, "Strange solutions", subtitle "Fractions and zero", in Solve it after Distribute more. It is Variables on
  both sides' card (the same loop, moves, layers, help, x-on-one-side rule, no forced move): the card was turned into a small factory
  (`makeBothCard`) so this card can bring its own answer, divide and shapes. Variables on both sides and Distribute more are unchanged
  (parity: traces and screens identical).
- **Levels (saved 1-5, shown 1-3):** 1 a fraction answer already in lowest terms (`9x + 1 = 7x + 6`, 5/2); 2 one to simplify
  (`2x + 10 = −4x − 5`, the divide writes −15/6, the answer −5/2; the sheet's `10x − 4 = 4x + 5` and `4x + 1 = −2x + 16` are in the pool);
  3 two x = 0 problems (`2x − 7 = 8x − 7`) mixed with two of Level 1 and one of Level 2.
- **Levels 4-5 hidden:** the pack has 5 saved levels and `lastLevel: 3`. Home shows "0/3" and three level buttons; the progress dots,
  "Complete ✓", "Level 3 complete!" (no "Level 4 →"), Keep practicing's Next level, and a link with `level=4` all stop at Level 3. The
  hidden levels are saved (always false) in progress, save codes and on the class sheet, so V2 needs no layout change.
- **Dividing never fails here.** Divide it's fraction cycle is configurable per card now: this card's `take` comes first. Dividing by the
  number in front of x writes `x = 15/6` (a new term kind, a fraction left as written, drawn stacked); the division row and its "Same as
  multiplying by ⅙." are as everywhere. A divide that splits both sides (`6x = 15` ÷ 3 → `2x = 5`) is the shared move. A divide by another
  number that would leave a fraction beside x (`6x = 15` ÷ 2) is not made: "Divide by 6, the number in front of x: then x is alone." (not
  red, nothing written). `−6x = 15` ÷ −6 gives `x = −15/6`; ÷ 6 gives `−x = 15/6`, and a flip gives `x = −(15/6)`.

## The answer: x = [ ] / [ ]

- Two boxes side by side with a slash between, each the size of the old `x =` box (the row keeps its height, so the text never shrinks
  for it). Digits go to the top; `/`, Tab or ↓ to the bottom (moving there selects what it holds, so the next digit replaces it); Shift+Tab
  or ↑ back; Backspace in an empty bottom goes back to the top; a click on a box clears it. The minus (key or ±) is always the top's. A
  whole number (0 included) is the top alone. The touch keypad has a `/` key on this card.
- A decimal point is written where it was typed and answered at once: "Write it as a fraction, like 5/2." (never red; Check stays off).
- **Unsimplified** (`15/6`, `0/5`): "Can you simplify this further?" beside the boxes, never red, nothing checked, not a wrong answer.
  The second time: "…Divide the top and the bottom by the same number." (recorded `hint`). Tag `unsimplified` (on the problem; see
  decision 3). The nudge comes for any unsimplified fraction, right or wrong, so it never gives away that the value is right.
- **The check with a fraction:** the value is dragged as one stacked fraction into each x (one drop per x). Every step shows:
  `9(5/2) + 1 = 7(5/2) + 6`, `45/2 + 1`, `45/2 + 2/2` (a whole number written over the denominator, on a line of its own), `47/2`, then
  the right side the same way, ending `47/2 = 47/2` ✓ Balanced. Nothing is reduced (the denominator stays the value's). Products in
  parentheses; a negative value in parentheses with its sign on the top, `3(−5/2) + 4 = (−5/2) + 9`; a negative result after another
  term is a subtraction. When the two sides end as a fraction and a whole number, one more line writes both over the same bottom
  (`8/2 = 4` → `8/2 = 8/2`). Every fraction in the check is drawn top over bottom. A whole value on a board with no fraction keeps every
  other card's check, so x = 0 reads `2(0) − 7 = 8(0) − 7` … `−7 = −7`. (The arithmetic is exact, in its own module, `fractionCheck.js`.)

## Generator (Levels 1-3, 200 seeds a level, unit-tested)

`Ax + B = Cx + D`: A 2 to 9, C ±2 to 9, A ≠ C; |A − C| 2 to 6 (one Divide, one digit); B, D 1 to 15 in size; |D − B| at most 30.
Answers p/q in lowest terms, q 2 to 6, |p| at most 15, never whole, never ±1, improper allowed (a mixed number is never asked for); 0 only
at Level 3. Every problem verified by substitution with exact fractions. No repeated answers or equations in a level, except Level 3's two
zeros (different equations: decision 1). No accidental balances (no slip value is the answer). Sign mixes: Level 1 two negative and two
positive answers and one with a negative x-term on the right; Level 2 a negative answer, two with subtraction, one dividing by 6. The
tests fail on a banned answer and on any answer not in lowest terms. Building the lists: about 0.2 s per level, once.

**Worst-case rows** (honest path, 200 seeds, each move kept on its own row): 6 on every level (e.g. `9x + 1 = 7x + 6`); the longest check
7 lines. **Text size** (first problem, seeds 1-6): at 1366×768, 42 px (38 px on two Level 3 problems); at 1366×650, 32 px; never below
Distribute more's (38 px and 32 px).

**Slip collisions** (1000 problems a level; the tag then says the first in the list): Level 1: frac-no-divide = x-sign-lost 76,
sign-flipped = half-collected 54. Level 2: frac-reduced-wrong = half-collected 186, frac-reduced-wrong = x-sign-lost 140,
frac-swapped = frac-no-divide 75, sign-flipped = half-collected 34, frac-swapped = half-collected 7. Level 3: 35, 33, 14, 31, 11, 1 of
the same pairs. Full list: `slipCollisions(level)` in `src/engine/generateStrange.js`.

## Slips (tags)

`sign-flipped` (−5/2 for 5/2), `frac-swapped` (2/5: upside down; adds "Check which number goes on top: x is the number divided by the
number in front of x.", recorded `hint`), `frac-no-divide` (9 for 9/6; adds "Remember to divide by the number in front of x: the answer can
be a fraction.", `hint`), `frac-reduced-wrong` (9/6 made 9/2: only one part divided; 3/6 is unsimplified, so it is nudged first),
`x-sign-lost`, `half-collected` (as Build R, with fractions); `unsimplified` (not a wrong answer). A wrong answer is recorded as typed,
`-5/2 → sign-flipped`.

## Shapes (states on the honest path, 200 seeds a level)

| Shape | Board | Reminder | States |
|---|---|---|---|
| SD (new) | `6x = 15`, the divide does not split | "To get one x, divide both sides by 6. The answer can be a fraction: that is fine." (Divide lit with its preview) | 8,018 |
| SR (new) | `x = 15/6`, not simplified | "Simplify 15/6: divide the top and bottom by the same number, then type x." | 6,704 |
| SQ (new) | `x = 5/2`, simplified | "x is 5/2. Type it in x =: the top, then /, then the bottom." | 8,078 |
| SF, SM (new) | `−x = 15/6`, `x = −(15/6)` | "x has a minus: flip both sides (· −1) to get x alone." / "x is the opposite of 15/6. Simplify it, then type x with its sign." | off the honest path (unit-tested) |
| NT, NF (new) | no x: `3 = 3`, `3 = 7` | "x disappeared. Is this statement ever true?" | V2 (never reached on Levels 1-3) |
| V1, E2, W1, W2, D1, F2, F5 | as before | as before | 3,000, 15,244, 3,000, 12,669, 1,496, 130, 1,200 |

No unknown shape; every shape has an entry (tested in `tests/strange.test.js`).

## Progress, class sheet, parity and the sweeps

- **Save code layout 20** appends the card's five levels (108 bits, 22 symbols); every older code decodes the same and round-trips
  (tested); the hidden levels' bits round-trip too.
- **Class sheet: no change needed.** It takes the card by itself (18 cards, under 30). It adds columns `strange-solutions-1` to `-5`; the
  last two stay FALSE until V2 (as One-step equations' hidden early levels do today). A fraction answer arrives as text, `-2/5 → frac-swapped`
  (tested against the sheet script). The event log needed no change.
- **`npm run parity`:** problems, class-sheet records, the 25 scripted runs and all 70 screens unchanged; save codes: five new rows (the
  new card's levels), listed in `tests/parity/INTENDED-CHANGES.md`. No screen differences.
- **`npm test`:** 1,876 tests pass, including the real-browser sweeps (redraws, drags, typing, text size) on every card with the new one
  (no "screenSweep: SKIP"). The standing tests have the card: typing (`canType`, now also the two boxes, `/`, the decimal point and the
  nudge), the sweeps, `formWords`, `timesSign`, the save-code, class-sheet and pack lists.

## Found on the way (fixed)

- **A digit lost on Distribute, combine, solve (older card, real bug):** on the problem after a correct guess, I'm stuck, then Multiply,
  then pointing at Divide shows its box with the cursor, but a typed digit went nowhere (the guard that keeps x = closed while a move is
  owed took the digit for x ='s). Fixed in the shared layer; the typing test found it once its walks changed.
- **The drag sweep's way back to a state:** after a drag folded the move before it and Undo restored the board, the sweep accepted the
  folded layout and dropped terms at the old places (silent "did nothing" reports). It now also needs the same rows.
- Two tests that generate a lot hit the 5-second limit under the full run; they have the 1-2 minute limit their neighbours have.

## Decisions for Karl (each with a recommendation)

1. **Level 3 has two x = 0 problems** (different equations), so the answer 0 repeats once. Recommend: keep (one would be easy to miss).
2. **The two answer boxes sit side by side** (`[15] / [6]`), not stacked; the value becomes a stacked fraction once it is dragged into x.
   Stacked boxes would make the answer row about twice as tall and cost text size. Recommend: keep side by side.
3. **Unsimplified tries on the class sheet:** today they show only as `hint` when the second line appears (the brief: "not a wrong
   answer"). Recommend: also list them in the answers column as `15/6 → unsimplified`, clearly not wrong, so you can see who skips
   simplifying.
4. **Dividing by a number that would leave a fraction beside x** (`6x = 15` ÷ 2) is not made, with "Divide by 6, the number in front
   of x." Recommend: keep (writing `3x = 15/2` leads nowhere useful at this level).

## Not in this build

Levels 4-5, "No solution" / "Infinitely many", "Try a number" (V2, after the panel, menu and cross-out build); pictures for simplifying;
Teach me; mixed numbers; the colour pass.
