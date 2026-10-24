# Build P report: nudges, working out a product, cross-offs, moving between blanks, Distribute polish, full checks, one drop per x (2026-10-24)

Everything is on `main` and live, with no flags. Each Part was pushed on its own after the unit tests and a full `npm run parity` passed,
in this order: Part 0; Parts 7 and 8 together (they touch the same check code); Part 1; Part 2; Part 4; Part 5; Part 6; Part 3; Part 9;
then the Features to check items. Before Part 7 the screens were recorded again from `main` at the end of Build O, so every screen
difference in this build had to be listed one by one.

## The two questions

**Why Level 5 of the Distribute card filled the second x by itself.** The card collapsed a *correct* check from saved Level 3
(`collapse: level >= 3`), and a collapsed check skipped the drop altogether: the value went into every x at once and the check jumped
to its first line and the mark. Build M's "a drop per x" was true only for wrong values and Levels 1-2, which are never collapsed. That
was the path running on Level 5. The collapse is now gone from the loop (no card has it), so every check, right or wrong, at every level,
waits for a drop in each x.

**Why the Distribute check was short.** The same setting: the group evaluation was already written out correctly (`3(3 + 2) = 15`,
`3(5) = 15`, `15 = 15`), but from saved Level 3 a right answer showed only the first line and Balanced. Two-step equations had the same
rule from its Level 3. Both now show every step, one per Enter.

## What was built

- **Part 1, the nudge.** One shared piece: after 2.5 s with nothing happening, the target glows and pulses; 1.5 s later a small pop-up
  (placed by the pop-ups' usual rule) and a faint ghost of the action, again every few seconds. Any key, click or wheel clears it; it never
  shows over another pop-up, a move's preview, a check or a scaffold; it changes nothing in the student's record. The combine nudge fires
  when x is not alone and a side holds two numbers or two x-terms (Two-step after Add; Distribute's distributed rows and the other side).
  It never fires on Add to both sides in practice: there, after a helpful Add, x is already alone (typed, not nudged), and a partial Add
  waits for Undo.
- **Part 2, working out a product.** At `x + 2 = (15)/3` (or `⅓ × (15)` from the Fraction option) the fraction bar, or a small × between
  ⅓ and (15), is a button. It opens a box for the signed product; Enter writes `x + 2 = 5`. A wrong product: "15 ÷ 3 is not 4. Press Undo
  and try again." with the fraction and number still lit; after Undo the hint ("15 ÷ 3: what times 3 makes 15? Click the fraction bar and
  type it." / "⅓ × 15 is the same as 15 ÷ 3. Click the × and type it."). Not at x alone. Two new shapes: Q4 `x + c = b` and Q5 `x = b + k`.
  I'm stuck at `x + 2 = (15)/3` now points at the product (it used to point at Add).
- **Part 3, cross-off.** On a Divide, Fraction or Flip work row, the number in front of x (or the distributing factor) and the fraction or
  divisor that cancels it are struck through with a red line drawn in, then faded a little; a flip strikes the two minus signs. When a
  negative cancels a negative, the minus signs are struck too; `⅓(−3x)` strikes only the 3s.
- **Part 4, keys between blanks.** Tab/→ and Shift+Tab/← move between the distribute products and between a fraction's top and bottom; the
  box moved to is selected (white on blue) so typing replaces it. Enter in a fraction's top goes on to an empty bottom. At either end Tab
  is the page's again, so the keyboard can still leave the row. Tested with Playwright's keyboard (real key events), not a physical one.
- **Part 5, Distribute.** First time: the factor in blue, an arc with a small × to each piece, "3 groups of", no labels (their space is
  kept, so nothing moves; the blanks sit 30 px lower than before to make room for the arcs). A wrong product brings `3 · x`, `3 · 2`,
  recorded as `hint`, for the rest of that problem only.
- **Part 6, the x-box picture.** 2x onto 3x typed as 5: three x boxes plus two x boxes and "5 of what?" (a negative term's boxes say −x,
  dashed). Recorded as `hint`. Drawn by a small new Solve it drawing; Count it and Build it untouched.
- **Part 7, full checks** and **Part 8, one drop per x**: while the value is carried every empty x glows; a drop fills only that x (or,
  dropped elsewhere on the row, the nearest empty x); a green check above it and a faint dashed value under each x still waiting.
- **Part 9.** Dividing by −1 is still stored as Flip everything (same record, shapes, check, lights; a unit test compares the class-sheet
  record), drawn as `(−x)/(−1) = (12)/(−1)` then `x = (12)/(−1)`, with "Same as multiplying by −1." and the folded tag "both sides ÷ −1".
  Its pop-up shows once a level, with its own flag; the first-flip pop-up is left for the Flip button. Divide it's whole number is live but
  explained, with the `/` shortcut back. Smaller numbers and One box are beside Divide.

## Parity

Problems, save codes, class-sheet records and the 25 scripted runs: unchanged. Screens: one listed difference, `div-menu@1366x650` (the
whole number no longer greyed; the lights moved beside Divide). The cross-off is not visible to the screen check (it freezes animations
at their first frame, before the line is drawn); the nudges appear after 2.5 s, later than the harness photographs; the other new
screens are not among the 35 recorded states. All of this is noted in `tests/parity/INTENDED-CHANGES.md`. Unit tests: 1,553 (was 1,484).

## Features to check

15 new items (one or more per Part) and 17 earlier items updated: the k- and m-level items whose checks were short, the distribute items
whose labels moved, the bare-5 item, the dividing-by-−1 item, Divide it's whole number in two items, and each card's Play it like a
student (a last step: "wait 3 seconds and watch the nudge"; on Add, Divide it and Flip everything x is alone there, so the good response
is no nudge). The walk results on the live site are at the end of this report.

## Surprises

- **The value-in-x pairing with two x's.** In `3(7 + 2) + 2 × 7 = 41` the second 7 sits a little right of the x above it (the "2 ×" pushes
  it). The loop spec named this as a known limit "no card has two x's yet"; Level 5 of Distribute does, and Part 8 makes it more visible.
  Not fixed in this build.
- **The row under a Divide made with the Divide button fades in again after an Undo** (the entrance animation replays). It was like that
  before; noticeable now because Undo after a wrong product shows the hint on that row a moment before the row is fully back.
- **The check row of a Divide-made fraction is drawn as `⅓(15)`, not `(15)/3`,** in the equation being checked (Build O's division form
  covers the work rows, not the check's copy). Small, left as is.
- **The robot browser sometimes keeps a move's hover preview** when the mouse jumps away in one step; with a hand's movement it ends.
  The nudge never shows while a preview is up, so the walks move the pointer as a hand does.

## The walk on the live site

`node tests/features/walk.mjs https://karlmaukskoepke.github.io/AlgebraMat/ docs/build-p`, after the last push: all 95 items pass, and
so do the page's own checks (96 PASS lines, "Every item passes."). The pictures in this folder are the walk's end states; the Build P ones
are named `p-…` at 1366×768 (`-768`) and 1366×650 (`-650`): each nudge's glow and its pop-up (`p-combine-nudge-glow`, `-popup`,
`p-calc-nudge-glow`, `-popup`), the calculate blank (`p-calc-blank`), a wrong product and its hint, the cross-offs, the keys between
blanks, the distribute arcs (`p-distribute-arcs`), the labels after a wrong product (`p-labels-after-wrong`), the x-box picture
(`p-xboxes`), a full check on Distribute at Level 4 (`p-full-check-distribute`), a two-x check mid-way (`p-two-x-midway`), and dividing
by −1.
