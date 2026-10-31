# Build W report: a bigger, simpler Moves panel, no goal lights for students, a diagonal Add cross-out (2026-10-31)

Everything is on `main` and live, with no flags, after the unit tests and `npm run parity`. Loop spec: rev 2.13. Decision log:
"2026-10-26: panel simplification".

Features to check: 14 new items (the panel on each of the 8 Solve it cards, the Multiply menu, no lights, the lights for a teacher, the
cross-out three ways), and 19 earlier items updated (their words or walks named the old symbols, the old icons or the lights). Pictures in
`docs/build-w/`: each card's panel before (`before-panel-*`) and after (`w-panel-*`), at 1366×768 and 1366×650; the Multiply menu; a screen
without the lights and the teacher view with them; the cross-out while it draws, drawn, and settled; the stacked pair.

## Part 0

Decision log "2026-10-26: panel simplification": Karl's six decisions (bigger square buttons with plain symbols; no floating symbols; no
lights for students, logic kept; a diagonal Add cross-out; Build X then V2 next; his answers to Build V's four decisions, with unsimplified
tries on the class sheet queued for V2).

## Part 1: the panel

- **Five square buttons, one big plain symbol each, nothing else drawn on them:** `+`, `×`, `÷`, `×(−1)` (one short label: a drawn ×
  the height of the digits, then (−1)), and two curved arrows chasing each other round a circle (no equals sign, no plus or minus). Each
  symbol has its own accessible name ("Plus sign", "Times sign", "Division sign", "Times negative one", "Two curved arrows making a
  circle"); each button keeps its formal property name on hover, on focus and as its name. Greyed (dashed, still tappable for its
  message), selected (yellow and a thicker edge) and the keyboard order are unchanged.
- **No floating symbols** beside the buttons or beside the Multiply options; the buttons no longer draw the equation forms.
- **Sizes.** Buttons 76 × 76 px at 1366×650 and 88 × 88 px on a window 740 px tall or more (so 88 at 1366×768). Panel 98 × 466 px at
  650 (was 142 × 388) and 110 × 526 px at 768 (was 142 × 388). The symbols are 60% of the button (46 px and 53 px); ×(−1) is 64 × 32 px
  and 74 × 37 px. Touch targets 76 and 88 px (at least 56). This is as large as fits at 1366×650: at 76 px the panel is 466 px tall and
  the work area beside it 477 px, so a larger button would make the panel taller than the work and the page longer.
- **Text sizes, before → after** (41 problems: every level of every card, seeds 7 and 21, both window sizes): **no change anywhere.**

  | Card | 1366×768 | 1366×650 |
  |---|---|---|
  | Add to both sides | 46 → 46 | 46 → 46 |
  | Divide it | 46 → 46 | 32 → 32 |
  | Flip everything | 46 → 46 | 32-34 → 32-34 |
  | Two-step equations | 38 → 38 | 32 → 32 |
  | Distribute, combine, solve | 38 → 38 | 32 → 32 |
  | Variables on both sides | 38 → 38 | 32 → 32 |
  | Distribute more | 34-38 → 34-38 | 32 → 32 |
  | Strange solutions | 38-42 → 38-42 | 32 → 32 |

- **Collisions.** A new real-browser sweep (`tests/panelRoom.test.js`, also in GitHub's "Real-browser sweeps" job) plays every card's
  honest path at 1366×650 with the touch keypad and at 1366×768, at every state: with x = in use (the keypad up), with each move's blank
  open, with the Multiply options open, through the check and with the value waiting to be dragged. It fails if the panel overlaps the
  keypad, the answer row (Strange solutions' two boxes too), the work or check space, the corner buttons or any pop-up, if the page
  scrolls, or if anything covers the value waiting to be dragged. **All 16 runs pass; no card needed a change.** (Seen on the way, not
  the panel's: on touch at 650 the keypad at the bottom covers the top of Start over and I'm stuck while it is up. It was like that before.)

## Part 2: no goal lights on screen

- The lights column, its dots, the by-hand row, the Solved for x row and the flashes are gone from every card's student view. The lights
  are still worked out (the judgement, the class sheet, the nudges; every engine test of the lights still runs).
- **`?lights=1`** draws them beside the buttons exactly as before (a line in `CLAUDE.md`, a Live entry and a Features to check item).
- **Goal words.** Only one message named a goal: "Fewer terms: that move helped. Press Next." It is now "That move helped: the equation has
  fewer terms now. Press Next." (and the same for the older screen's "…Keep going, or type your guess for x."). On the current cards it
  is silent, so students never saw it. No hint, reminder or pop-up names "No parentheses", "x on one side", "Smaller numbers", "One box"
  or "Solved for x"; phrases like "one box" and "Get x on one side first." are the move's own words, not a light's, and stay.
- **The space it freed** (44 px across at 650, 32 px at 768) goes to the work column. The text-size chooser measures the real column, so it
  could use it, but no card's size rose: every card's size is set by the height of its worst case, not its width.

## Part 3: the diagonal cross-out

- Each cancelling term of an Add (button or drag) is crossed out **whole, sign and all** (`+8`, `−8`, `4x`, `−4x`) by one straight red
  stroke from the lower left to the upper right. It draws itself from the lower left once, then the term's ink fades as before while the
  stroke stays at full strength; drawn still under reduced motion (and whenever animations are off).
- **Measured on screen** (a real-browser test at 1366×768, 1366×650 and browser zoom 125%): every stroke at **45.0°**, crossing the
  term's whole ink with 0.1em to spare at each end, **6 px** heavy (was a 4 px horizontal line under the number only). Lengths: `+8`/`−8`
  85 px (80 at 125%), a stacked `4x` 48 px and `−4x` 72 px at 768 (41 and 62 at 650). A unit test checks the stroke's geometry
  (`crossGeometry`: 40-50°, both ends past the term, heavier than 4 px) and the styles that draw it.
- **Stacked pairs (Build T):** both partners are crossed the same way; in the lower one the stroke crosses `−4x`, not the `+` in front (that
  is the column's adding sign).
- **The other marks:** Build P's cross-off of the two 3s (and the numbers in a divide) keeps its slant (−18°, a slash through the digit, not
  an underline) and its timing. Flip's vertical strokes through the minus signs are unchanged. There is no separate combine cancel mark
  (a combine to 0 is typed).

## Tests and parity

- `npm test`: **1,964 tests pass**, including the real-browser sweeps (typing, drags, redraws, text size, no times sign, form words, and
  the new panel-room and cross-out sweeps); no "screenSweep: SKIP".
- **Walked on the live site:** all 172 Features to check items pass (`node tests/features/walk.mjs https://karlmaukskoepke.github.io/AlgebraMat/ docs/build-w`).
  The first live run failed the 8 new panel items only because their walk used a developer shortcut the live site does not have; the walk
  now clicks as a person would, and those 8 pass on the live site.
- `npm run parity`: problems, save codes, class-sheet records and the 25 scripted runs unchanged; **all 70 screens differ**, each listed
  individually in `tests/parity/INTENDED-CHANGES.md` (the panel on every screen; the cross-out on the six with a helpful Add's work row;
  the Multiply menu without its floating symbols). Build U's two stale `div-stuck-2` rows moved below the history line so each key is
  listed once. The two older notes (`trace:add-both/wrong-guess-then-undo#3`, `…stuck-x4-then-solve#10-`) were there before this build.

## Decisions for Karl (each with a recommendation)

1. **The middle Multiply option without its ÷.** `1/▢ ( ) = 1/▢ ( )` now reads as "multiply by one over a number": a student who knows
   that dividing is multiplying by one over will see division in it; others will not. Divide's own ÷ button sits right beside the menu,
   and choosing the option still says "Dividing by 5 is multiplying by ⅕." Recommend: keep it as is (the brief's rule, no floating symbols).
2. **Button size.** 76 px at 1366×650, 88 px on taller windows: the largest that fits without lowering any text size or lengthening the
   page. Recommend: keep.
3. **The diagonal on a wide term reaches above and below the digits** (a true 45° across `+8` is taller than the 8). Recommend: keep; it is
   what makes it read as a cross-out. The alternative is 40°, a little flatter.
4. **Build P's slanted cross-off of the two 3s** stays at its −18° slant (it reads as a slash, not an underline). Recommend: keep; say if
   you want it to match the Add stroke.

## Found on the way

- The panel's old floating-symbol column sat between the buttons and their hover names and the Multiply options (44 px apart); both now sit
  12 px from the button.
- Several older Features to check items described the Flip button as "the third box, −x → x" (it has been the fourth button since
  Build O); they now say "the fourth button, ×(−1)".
