# Build Q report: panel polish (2026-10-25)

Everything is on `main` and live, with no flags, pushed a Part at a time after the unit tests and `npm run parity`. Loop spec: rev 2.9.

## Text size, before and after (first problem of seeds 1-6 a level; "+fold": older moves fold out of sight when needed)

| Card | 1366×768 before → after | 1366×650 before → after |
|---|---|---|
| Add to both sides, Levels 1-5 | 46 → 46 | 46 → 46 |
| Divide it, Levels 1-5 | 46 → 46 | 32 → 32 |
| Flip everything, Levels 1-5 | 46 → 46 | 34, 34, 32, 32-34, 32-34 → the same |
| Two-step equations, Levels 1-7 | 34 → **38** (+fold) | 32 → 32 |
| Distribute, combine, solve, Levels 1-5 | 32 → **38** (+fold) | 32 → 32 (+fold) |
| Variables on both sides, Level 1 | 34 → **38** (+fold) | 32 → 32 |
| Variables on both sides, Levels 2-5 | 32 → **38** (+fold) | 32 → 32 (+fold) |

No size dropped anywhere. The extra room is in em, so it grows with the text.

## Worst-case rows (the honest path, every move kept as its own row)

| Card | Rows in the worst case | Shown once older moves fold |
|---|---|---|
| Add to both sides, Divide it, Flip everything | 3 | 3 (nothing folds) |
| Two-step equations | 4 | 4 (nothing to fold: one earlier move) |
| Distribute, combine, solve | 5 | 4: `2x + 8 = 26` folds away |
| Variables on both sides, Levels 1-4 | 4-5 | 4 |
| Variables on both sides, Level 5 | 7 | 4: the three earliest moves fold away |

What folds earlier: when a problem's worst case does not fit at a size, the folded moves before the last one go out of sight, leaving the
original equation, a small ⋮ under it, the last folded move and the move being worked. The size chooser tries every size with all rows
first, then folded, so the text is as large as fits.

## The hint ladder per card (confirmed in the code and the tests)

| Card | I'm stuck, click by click | After a wrong value and Undo |
|---|---|---|
| Divide it (`5x = −15`) | 1. reminder: `5 · x`, Divide lit and previewed (`hint`) · 2. Model it: boxes and counters (`model`) · 3. guided, repeats (`guided`) | the reminder |
| Flip everything (basic form) | the reminder, repeated: `−x = 12` and `−3x = 12` light Flip (now `−3 · x`, no frame); `3x = −12` after a flip is Divide it's reminder with the dot | the same reminder |
| Two-step, Distribute (basic form) | the reminder only; at `2x = 12` it is the dot and the Divide preview | the same |
| Variables on both sides | the reminder only (V1 now outlines the x-term beside the number) | the same |
| Add to both sides | unchanged (not a dividing card) | unchanged |

## Part by part

- **Part 0.** Decision log "2026-10-24: panel polish" and Karl's answers to Build T; loop spec rev 2.9 (1C, 1D, 2, 3B, 3F, 5, 6).
- **Part 1.** The two symbols, drawn on a 32 grid at 26 px: checked at 1366×768, 1366×650 and 125% (pictures `q-panel-*`,
  `q-icons-large`).
- **Part 2.** Rows of the shared stack get 0.1 em above and below; a division row 0.22 em; the "Same as" line its own line with room
  above and below; Distribute's factor row keeps room for its arcs while they show; nudge glows drawn tight (3 px). Measured with every lit
  thing in the probe (the spotlight, the combine glow, the hint, the distribute arcs, the flip strokes): nothing crosses into the next
  row except Distribute's "3 groups of" circles by 3 px at 1366×650 (they still clear the blanks below).
- **Part 3.** The dot is drawn only while the hint is up and goes with the next move; the hint's dashed frame is not drawn on the number
  or the x anywhere (error spotlights, which are red frames for a wrong move, keep theirs).
- **Part 4.** The middle option is the Divide button's checks with the multiplication drawing: one digit, a minus where the card allows
  it, a slash ignored, −1 is Flip, 0 and two digits refused with the same words.
- **Part 5.** A key or a click during a flip's cross-off finishes it and then does what it does.
- **Part 6.** Flagged whatever the sign; the hint after Undo picks the x-term beside the number; V1 outlines it (checked on every Level 1
  problem of seeds 1-30).

## Parity

Problems, save codes and the 25 scripted runs: unchanged. Class-sheet records: two Divide it runs that press I'm stuck twice now record
`hint, model` (were `model, guided`): Karl's new ladder. Screens: 42 differ for the spacing, 2 for the hint, 1 for the symbols, 2 for the
menu, each listed in `tests/parity/INTENDED-CHANGES.md`.

## The sweeps (before every push)

`npm test` (1751 tests, including the real-browser sweep of every card: redraws, drags, typing, the text size) passes. GitHub's check now
runs the same sweep in a job of its own ("Real-browser sweeps", about 2.5 minutes); it passed on the first push. It does not hold up
publishing.

## Surprises

- The generator never makes `2x = 3x + 6` (Level 1 always has the bigger x-term alone), and a link can't name an equation. The Features to
  check item uses the same mistake reached by a student path: `6x = 4x + 10`, Add −10, then Add −4x leaves `6x − 4x − 10 = 0`.
- At 1366×650 Divide it and most multi-step cards could not keep the check's pop-up off `x =` at any size, so they were already at 32 px
  by the chooser's fallback (Build S). Folding does not change that: those problems have only three rows.
- The screen check silently accepted the Multiply-menu and I'm stuck screens because older builds' rows for the same keys are still above
  the history line. I listed them again under Build Q, but the check can't catch an unlisted change on those keys any more.
