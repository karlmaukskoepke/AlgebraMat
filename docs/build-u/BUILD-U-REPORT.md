# Build U report: Distribute more, in basic form, and no × in the work (2026-10-25)

Everything is on `main` and live, with no flags, pushed a Part at a time after the unit tests and `npm run parity`. Loop spec: rev 2.10.
Features to check: 13 new items, 11 earlier ones updated (their rows no longer show a ×); all 150 items walked on the live site, every one passes
(`node tests/features/walk.mjs https://karlmaukskoepke.github.io/AlgebraMat/ docs/build-u`).

## Part by part

- **Part 0.** Decision log "2026-10-25: Distribute more and Strange solutions": the two cards in order, dividing by a negative stays
  accepted (its pop-up adds "Many people flip first (· −1), then divide: two simpler steps."; built), the colour pass parked with its
  conflict (red = a move on paper, an error on screen), and no times sign in written work.
- **Part 1.1, no ×.** Flip's row `−1(−x) = −1(12)`, the Multiply ghost rows `n(5x)`, `1/▢(5x)`, `▢/▢(5x)`, the folded tag
  `−1 · both sides`, the product's button is a dot (`⅓ · 15`, "Click the dot to work out ⅓ · 15."), Divide it's walkthrough `3 · 4 = 2 · 6`
  and its check `3(2) = 6`, the notes `5(5x) makes 25x…`, `−1(5x) makes −5x…`. The × stays on the Moves panel (the floating symbol, the
  menu's option drawings) and on the distribute arcs' small drawing (decision 1). A standing test (`tests/timesSign.test.js`) draws every
  Solve it card's states (the honest path and, at each state, I'm stuck twice, Teach me, every Multiply preview and option, a flip, a
  divide by −3, a wrong value and its check) and Divide it's numbers-only walkthrough, and fails on a × anywhere else. Checked: it fails
  on the code before this Part (200 texts).
- **Part 1.2, the screen check.** Done: the screens were recorded again from `main` at the end of Build Q, all 67 older screen rows moved
  below the history line, and above it there are only this build's: the two `div-stuck-2` screens (the fraction preview without its ×).
  The check now fails on any unlisted difference on every key.

## The card

- **Id `distribute-more`**, "Distribute more", subtitle "The invisible −1 and fractions", in Solve it after Variables on both sides. It is
  Variables on both sides' card (the same loop, layers, screen, help, x-on-one-side rule, no forced move) with its own problems and pack.
- **Levels (saved 1-5 = shown 1-5):** 1 `a(x + b) + c = dx + e`; 2 `−a(x − b) = cx + d` and `a(x ± b) = …`; 3 the invisible −1
  (`px − (x − b)`, `n − (cx + d)`, and `−(cx + d)` at the start of a side); 4 a fraction (`⅔`, `¾`, `⅗`, `½`, `⅓`, `¼`, `⅖`), at least two a set
  with a top above 1; 5 two negative fractions (one with a top above 1) plus one each of Levels 1-2, 3 and 4.
- **The invisible −1:** the bare minus is the factor token. Tap: `7x + −1(x − 6)` (the −1 in colour; tap again to go back; at the start of
  a side too). A drag before the tap goes back: "Tap the minus first: it means −1 times everything inside." A box holding only `−`:
  "Type every piece, including the 1."
- **A fraction factor:** one stacked token with its sign; first look "⅔ of" with the arcs; after a wrong product the labels `⅔ · 9x`,
  `⅔ · −3`. Undo goes back to the boxes (Build T). A negative fraction distributes in one step.
- **Rows** keep Build M's convention: a negative piece after the first shows as a negative number (`6x + −2 = 3x + 10`).

## Generator (200 seeds a level, unit-tested; fails on a banned answer)

Answers whole, 2 to 9 in size; no repeated answers or equations in a level; every number written and every product a distribute writes
at most 15 in size and never 0; distributed x-terms at most 9 (Add's x-term limit); collected x-number 2 to 6 (one Divide); neither side's
numbers put together to 0; no slip value equals the answer. Building the lists: about 0.1-0.3 s per level, once.

**Worst-case rows** (honest path, 200 seeds): Levels 1, 2, 4: 7; Levels 3 and 5: 9 (`2x − (x + 2) = 3x − 10`, `6x − (x − 1) = 7x + 9`).
Older moves fold, so the text never shrinks.

**Text size** (first problem, seeds 1-6): 38 px at 1366×768 and 32 px at 1366×650 on every level, with older moves folding: the same as
Variables on both sides.

**Slip collisions** (1000 problems a level): half-collected = sign-flipped 143 / 60 / 57 / 85 / 96 (the tag then says half-collected, as
in Build R); first-only collides with another slip 21-40 times a level; one-lost (Level 3) 68; frac-top (Level 4) 42. Full list:
`slipCollisions(level)` in `src/engine/generateDistMore.js`.

## Slips (tags)

Products: `dist-one-lost` (the −1 lost: `1` for −1 · x, or a piece copied), `dist-frac-top` (only the top multiplied), `dist-frac-bottom`
(only the bottom divided), plus Build M's `dist-unmultiplied`, `dist-sign-lost`, `dist-product`; each with its own second sentence. Values:
`first-only`, `one-lost`, `frac-top`, plus Build R's `x-sign-lost`, `half-collected`, `sign-flipped`. Combine slips as before
(`sizes-added`). The product slips record `hint` (the labels appear).

## Shapes (states on the honest path, 200 seeds a level)

| Shape | Board | Reminder | States |
|---|---|---|---|
| VG (new) | a parenthesis beside other terms | "Drag the 3 onto the parenthesis to multiply it by each piece." | 8,064 |
| VH (new) | the invisible 1 | "Tap the minus first: it means −1 times everything inside." (once tapped, "Drag the −1 …") | 10,193 |
| VF (new) | a fraction factor | "Drag the ⅔ onto the parenthesis. Each piece is ⅔ of that term." | 10,900 |
| VE (new) | x on both sides, like terms not put together | "6 and −4 are like terms. Drag one onto the other to combine them." | 4,976 |
| VP, V1 | as Build R | as Build R | 7,939, 5,668 |
| E1, E2, W1, W2, D1, F2, F5 | as before | as before | 2,518, 32,497, 5,000, 24,951, 9,693, 7,076, 60,834 |

No unknown shape; every shape has an entry (tested). VE also applies on Variables on both sides wherever its board has two numbers or two
x-terms on a side with x on both sides; no earlier test or walk changed.

## Checks

`⅔(9(4) − 3) = 3(4) + 10`, `⅔(36 − 3)`, `⅔(33)`, `22`, every step shown; `7(4) − (4 − 6)`, `7(4) − (−2)`, `7(4) + 2`, … for the
invisible 1.

## Progress, parity and the sweeps

- Save code layout 19 appends the card's five levels (103 bits, 21 symbols); every older code decodes the same and round-trips (tested).
  The class sheet takes the card by itself (17 packs, under 30).
- `npm run parity`: problems, class-sheet records and the 25 scripted runs unchanged; save codes: five new rows (the new card's levels);
  screens: the two `div-stuck-2` rows (Part 1).
- `npm test`: 1819 tests pass, including the real-browser sweeps (redraws, drags, typing, text size) on every card with the new one. Two
  sweep fixes: the check is followed for up to 14 lines (this card's checks are longer), and the gap right after a parenthesis's own factor
  counts as its own place.

## Not in this build, and later

- Fraction answers, x = 0, no solution, infinitely many: Build V.
- The "take a share" picture (bracket pairs, cross one from each) is a later scaffold.

## Surprises

- The divide-by-a-digit limit means the collected x-number stays 2 to 6, even though the brief allows coefficients to 9 (they appear
  inside the parentheses and on the right).
- Karl's sheet example 4.3 `8 − (3x + 2) = x + 8` has a fraction answer (−½), and 4.2 has x = −1: both are Build V's.
- Generating Level 5 takes about 60 ms a set (a large mixed pool); unnoticeable in the app.
