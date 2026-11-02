# Build Y report: Add's number written in a column (2026-11-02)

On `main` and live, with no flag, after the unit tests, the real-browser sweeps and `npm run parity`. Decision log: "2026-11-01: stacked
numbers". Loop spec: revision 2.14 (section 1C, the column; section 3G also brought up to Build AB's gentler cross-out, which the spec
still described as 45°).

**Count it and Build it:** not touched. **What changed for students:** only where Add's number is written, on every Solve it card with
Add. The stored Add move, the check, the shapes, the class-sheet words and events, save codes, problems and generators are unchanged
(parity: problems, save codes, class-sheet records and all 25 scripted traces PASS unchanged).

## The rule, as built

- **The boxes.** Add's number option (and its hover preview) puts a dashed box under the first number of each side, `+ ▢`, right-aligned
  so the digits line up; the number on top keeps its own sign (`+8` over `+ −8`). A side with no number (only x-terms, or a group) gets
  its box at the end of its line, in line (`6x + ▢`). Two or more numbers on a side: under the first.
- **Typing.** Either box takes the keys and the other mirrors it; Tab and the arrows move between them; a click on a box retypes it (the
  first key replaces what is there, **a minus too**: see "surprises"); Go or Enter applies; 0 is refused; the touch keypad comes up as for
  Build T's boxes (the same boxes, `data-side`).
- **The work row.** The amount is written where its box was: `+ −8` under the +8 and under the 11; the cancelling pair crossed out
  (Build AB's stroke; on a positive amount like `+ 6` only the 6 is crossed, its `+` being the column's adding sign, as in Build T);
  the other side's amount left to combine. A side with no number keeps it in line (`6x − 10`). The new row is written as before
  (`x = 11 − 8`). A number dragged across the = is the same Add, so its work row is the same column (it still lands where it is dropped,
  as the spec says).
- **Wrong and partial amounts** keep their spotlights and messages; the lit column now holds the term and the amount under it.
  The wrong cancel and "Add so that one x-term cancels" are untouched. Build T's x-term column is untouched.
- **How it is drawn:** the column is worked out when the row is drawn, from the stored row (the first number among a side's terms), so
  nothing stored changes. Cards: Add to both sides (all levels), Two-step equations, Distribute, combine, solve, Variables on both sides,
  Distribute more, Strange solutions.

## Fit and sizes (Part 3)

A number's column makes its row one line taller. Its two lines sit 0.9 of the text size apart (a written column), so the row grows by about
0.7 of a line (Add to both sides' work row: 50 px → 70 px at 46/32 px text). **The text size chosen did not drop anywhere:** measured on the
first problem of seeds 1, 7, 13, 21 and 29 at every level of every Solve it card, at 1366×768 and 1366×650 (430 cases), before and after:
**identical in all 430**. Row counts are unchanged (the column adds a line inside a row, not a row); older moves fold as before ("fold"
below), and nothing scrolls (the real-browser sweeps check every card on its honest path at both sizes).

What it took: at 1366×650 Add to both sides first dropped from 46 to 38 px. The chooser keeps 168 px under the rows for the pop-up shown
while the value waits to be dragged ("Drag the 3 onto an x above"), but since the fix after Build V that pop-up sits low in the empty
check space beside the rows, never under them; the extra column line was eating a reserve nothing uses. The chooser now leaves the
column's extra line out of that one test (every row without a number's column is measured exactly as before, so no other card's size
can move). With the real screen at 46 px the pop-up and the value are clear of each other (checked by eye and by the panel-room sweep).
The chooser also now counts Add's number boxes open on the fullest state.

| Card | Level (saved) | 1366×768 before → after | 1366×650 before → after |
|---|---|---|---|
| Add to both sides | 2 | 46 → 46 | 46 → 46 |
| Add to both sides | 3 | 46 → 46 | 46 → 46 |
| Add to both sides | 4 | 46 → 46 | 46 → 46 |
| Add to both sides | 5 | 46 → 46 | 46 → 46 |
| Add to both sides | 6 | 46 → 46 | 46 → 46 |
| Divide it | 2 | 46 → 46 | 32 → 32 |
| Divide it | 3 | 46 → 46 | 32 → 32 |
| Divide it | 4 | 46 → 46 | 32 → 32 |
| Divide it | 5 | 46 → 46 | 32 → 32 |
| Divide it | 6 | 46 → 46 | 32 → 32 |
| Flip everything | 2 | 46 → 46 | 34 → 34 |
| Flip everything | 3 | 46 → 46 | 34 → 34 |
| Flip everything | 4 | 46 → 46 | 32 → 32 |
| Flip everything | 5 | 46 → 46 | 32, 34 → 32, 34 |
| Flip everything | 6 | 46 → 46 | 32, 34 → 32, 34 |
| One-step equations | 3 | own screen → own screen | own screen → own screen |
| One-step equations | 4 | own screen → own screen | own screen → own screen |
| One-step equations | 5 | own screen → own screen | own screen → own screen |
| Two-step equations | 1 | 38 fold → 38 fold | 32 → 32 |
| Two-step equations | 2 | 38 fold → 38 fold | 32 → 32 |
| Two-step equations | 3 | 38 fold → 38 fold | 32 → 32 |
| Two-step equations | 4 | 38 fold → 38 fold | 32 → 32 |
| Two-step equations | 5 | 38 fold → 38 fold | 32 → 32 |
| Two-step equations | 6 | 38 fold → 38 fold | 32 → 32 |
| Two-step equations | 7 | 38 fold → 38 fold | 32 → 32 |
| Distribute, combine, solve | 1 | 38 fold → 38 fold | 32 fold → 32 fold |
| Distribute, combine, solve | 2 | 38 fold → 38 fold | 32 fold → 32 fold |
| Distribute, combine, solve | 3 | 38 fold → 38 fold | 32 fold → 32 fold |
| Distribute, combine, solve | 4 | 38 fold → 38 fold | 32 fold → 32 fold |
| Distribute, combine, solve | 5 | 38 fold → 38 fold | 32 fold → 32 fold |
| Variables on both sides | 1 | 38 fold → 38 fold | 32 → 32 |
| Variables on both sides | 2 | 38 fold → 38 fold | 32 fold → 32 fold |
| Variables on both sides | 3 | 38 fold → 38 fold | 32 fold → 32 fold |
| Variables on both sides | 4 | 38 fold → 38 fold | 32 fold → 32 fold |
| Variables on both sides | 5 | 38 fold → 38 fold | 32 fold → 32 fold |
| Distribute more | 1 | 34 fold, 38 fold → 34 fold, 38 fold | 32 fold → 32 fold |
| Distribute more | 2 | 38 fold → 38 fold | 32 fold → 32 fold |
| Distribute more | 3 | 38 fold → 38 fold | 32 fold → 32 fold |
| Distribute more | 4 | 38 fold → 38 fold | 32 fold → 32 fold |
| Distribute more | 5 | 38 fold → 38 fold | 32 fold → 32 fold |
| Strange solutions | 1 | 42 fold → 42 fold | 32 fold → 32 fold |
| Strange solutions | 2 | 42 fold → 42 fold | 32 fold → 32 fold |
| Strange solutions | 3 | 38 fold, 42 fold → 38 fold, 42 fold | 32, 32 fold → 32, 32 fold |

(`own screen`: One-step equations' levels play on another card's screen; nothing to choose.)

**Worst case at 1366×650:** Distribute more after its number Add, older moves folded (`y-worst-case-650.png`): five rows, 32 px as before,
nothing scrolls.

## Part 2: what the walkthrough and the scaffolds draw today (reported, not changed)

- **Add's "See why it works" walkthrough** (x + 3 = 5) draws its own rows by hand, in line: `x + 3 + −3 = 5 + −3`, then the cross-off,
  then `x = 5 + −3`. Changing it to the column would take about ten lines in its drawing (the same column helper) and new pictures; its
  steps and words would not change. Recommended for a small follow-up, since it is the first place students see Add.
- **The seesaw and counters scaffolds** type on the seesaw, not in a box row, so there is no inline blank to replace; the work row a
  seesaw move leaves is drawn by the same code as every other, so its number Add is drawn the same way.
- No hint or pop-up named "the box at the end of the row": nothing to reword.

## Surprises

- **Retyping a box with a minus.** Build T's rule (a clicked box: the first key replaces what is there) skipped the minus key, so clicking
  a box holding −8 and typing −3 gave 83. It also was only on Variables on both sides' family. Now the first key replaces, minus included,
  on every card with Add (only after a box is clicked; recorded runs cannot reach it).
- **x on the right in Add to both sides** must be traded to the left before Add (the card's own rule); the preview still shows the column
  there. The item for it walks the preview, then Trade places, then Add.
- **The parity harness misses changes under the grey cover:** its per-pixel threshold (40 of 255) passes most of the greyed screens. A
  stricter comparison finds 26 changed pictures (13 states at both sizes), each listed in `INTENDED-CHANGES.md`; the harness's own measure
  sees all 26 too but they are already listed above its history line from Build W.
- **A stacked positive amount is a lone digit** (`3`): the cross-out sweep's "within 5% of the centre" asked for 0.6 px on a 12 px digit.
  The stroke is now centred symmetrically on terms without their own sign, and the sweep allows at least one pixel.

## Tests, sweeps, parity, walks

- **Unit tests:** all pass. New `tests/buildY.test.js` (the boxes under the numbers, either box typing and mirroring, a side with no
  number, a group side, the hover preview, the work row and its cross-out, the stored row unchanged, two numbers on a side, Build T's
  x-term column as it was, the other cards' boxes). Updated: Build W's cross-out row test (the −8 is now under the +8).
- **Real-browser sweeps** (run locally before every push): typing, drags, redraws, font size (`screenSweep`), panel room and the cross-out
  (`panelRoom`), the menu (`menuSweep`); no SKIP. No-times-sign and form-words are unit tests (pass).
- **Parity:** PASS on all five families; the 26 screen differences listed one by one.
- **Features to check:** 7 new items (`y-stack-add`, `y-stack-right`, `y-no-number`, `y-either-box`, `y-partial`, `y-two-step`,
  `y-both-sides`) and their walks; 12 earlier items updated for the column (`ab-xo-gentle`, `w-xo-add`, `w-xo-drag`, `s-drag-right`,
  `s-first-drag-distribute`, `s-add-options`, `h-enter-go`, and the students' items for Add to both sides, Two-step equations, Variables
  on both sides, Distribute more, Distribute, combine, solve and Strange solutions). Walked on the live site: see the summary.
- Pictures in `docs/build-y/` at 1366×768 and 1366×650 (and each new item's end state, walked on the live site, `y-stack-*`, `y-no-number*`,
  `y-either-box`, `y-partial`, `y-two-step`, `y-both-sides`): the preview on three equations (`y-preview-both`, `y-preview-one-side`,
  `y-preview-group`), the boxes typed in either box (`y-typed-right-box`, `y-typed-left-box`), the cross-out (`y-crossout`), a side with no
  number (`y-no-number-side`), the worst case (`y-worst-case`).
