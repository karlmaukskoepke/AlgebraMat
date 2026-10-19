# Build D-2 report (2026-10-19)

Six pushes to `main`, one per Part (0 to 5), in order. Before each push the unit tests passed (1015 at the end) and `npm run parity`
passed, with every difference listed in `tests/parity/INTENDED-CHANGES.md` (sections "Build D-2, Part 1" to "Part 5"; Part 0 changed
nothing parity sees). Count it, Build it, save codes, seeds and class-sheet words and tags are unchanged. No new tags; new feedback keys
only (they are not class-sheet words).

## Part 0: where students go; save codes hidden; Go
- Students use GitHub Pages: https://karlmaukskoepke.github.io/AlgebraMat/ (Karl's website links there). A push to `main` is built and
  published by `.github/workflows/ci-deploy.yml` in about a minute (checked on the Actions runs). Netlify also builds `main`. It is the
  first entry on the test-links page and in `CLAUDE.md`.
- Every student-facing save-code button and mention is hidden; `?codes=1` brings them back. The progress code still works.
- What was checked, in a real browser: finished levels survive a reload and closing the browser. Moving to a second device through
  Google sign-in is covered by the unit test "moves a student to a second device: levels come back"; a real Google sign-in can't be run
  from here. Clearing site data loses the progress on that browser until the student signs in again, when the class sheet sends the
  finished levels back. The class sheet uses the levels, never the code string.
- The green button says Go (also in Teach me, instead of "Do it").

## Part 1: what an addition did
Only real opposites are crossed off. A sum that doesn't cancel lights the two numbers added and the sum (drawn larger): "Adding to both
sides is used to eliminate terms by adding the opposite. +8 + +8 did not eliminate the term. Let's try again." A partial one: "+8 was only
partially canceled by the −5 you added. What value instead of −5 would have completely canceled the +8?" The "still here" label stays.

## Part 2: x = and checking a value
- x = has no blinking cursor at first. A click shows it (blue outline, blinking); typing, any action, a click elsewhere or tabbing away
  stops it. Digits typed anywhere still go into x =. The last step (x alone) still blinks.
- "Let's check that x = 7 is the solution. / Drag the 7 onto an x above." It fits at 1366×650 (four short lines).
- Dragging only: a click on x does nothing (Enter still places it, for the keyboard). After 4 seconds with nothing done, a faint copy of
  the value travels from x = to the first x, every 2.6 seconds until the student acts (it fades in at x with reduced motion).

## Part 3: dragging a term
- While a term is dragged, the equation itself shows where it would land: the term as a shadow in its new place. There is no extra row.
  A drop up to 220 px above or below the line lands where the row shows it.
- Across the line the token turns red with its new sign and can land before, between or after the terms there.
- The line is 2 px, shown only while dragging, and stops short of the = above and below it.
- x across the line is unchanged. The "end with x on one side before checking" rule isn't built, because no card has x on both sides
  yet. Say if you want it ready now.
- The Distribute drill: Flip writes a `× (−1)` row on both sides before the flipped equation. It fits at 1366×650, so nothing was
  skipped. Products are typed whole (`−2x`); a number alone in the x blank gets "Type every piece, including the x." The x key works.

## Part 4: one Multiply button
- Divide it and the drill: one Multiply button opens three options beside it: `▢ × ( )`, `▢/▢ × ( )`, `−1 × ( )`. Hovering one previews it
  on the equation (dashed); clicking it makes it solid.
- Divide it: the fraction is the move. A whole number or −1 is not applied; Go explains instead ("3 × (5x) makes 15x: still not one x.
  Try a fraction." / "−1 × (5x) makes −5x: the sign changes, but there are still 5 x's."). In the drill all three apply (a whole number
  is written as its own `× (n)` row; negatives allowed).
- The fraction blank: the cursor starts on top; after one digit (or − and a digit) it jumps to the bottom. A second digit, or a top that
  isn't 1 (66, 55), gives "Enter a unit fraction, like ⅕ or ½." So does 7 seconds with the blank open and no unit fraction in it (once
  per opening). Fractions were already single digits (½ to ⅙).
- No outline on the selected box; the blinking cursor shows it (Divide's fraction boxes now blink; before, they only had the outline).

## Part 5: the seesaw
- Add on the seesaw: a box under each side, "↑ type the number to add ↑". Typing once puts the counters on both sides. Typing again
  takes them back off first; Go commits.
- Once built, "That is the equation. Now choose a move." greys everything except the moves and that box. The Add that the first hint left
  open is closed here, so the student really chooses.
- At the end, checking the value: the balance and the checking space sit side by side (before, the check was below the fold at 650).
  Both the x on the balance and the equation under it take the dragged value.
- The big-number (and counters) box is gone as soon as the value is being checked.
- I'm stuck stays lit and clickable on every greyed screen where it is enabled, except an error's spotlight, where only Undo is.

## Decisions for Karl
1. **Divide it's whole-number and −1 options** are shown but not applied: Go explains why they don't leave one x. Recommendation: keep
   it; it is the honest answer for `5x = −15`. The alternative is to apply them and let Undo take them back, which needs the card to
   learn multiplying.
2. **The drill's fraction stays `1/▢`** (only the bottom is typed); Divide's is `▢/▢`. Recommendation: keep `1/▢` in the drill, because
   it only ever needs unit fractions.
3. **"Drag the 7 onto an x above"** on the seesaw: the x's are to the left of the box rather than above it. Recommendation: keep the
   words, one sentence everywhere.

## Found and fixed while testing
- Clearing the x = cursor on the press itself redrew the screen under the pointer, so the click that followed was lost (a move button
  stopped working). The cursor now clears on the click, after the button has had its turn, and on keyboard focus only.
- Divide's fraction boxes never blinked (the blink rule only reached Add); they do now.
- At the end of the seesaw scaffold the value had nowhere to be dropped and the check sat below the fold at 650; both are fixed (Part 5).

## Acceptance screenshots (1366×650, this folder)
01 +8 + +8 lit · 02 partial cancel · 03 x = with no cursor · 04 x = clicked · 05 the ghost value travelling · 06 the check words ·
07 dragging, home · 08 across the line, before the 11 · 09 across, after the 11 · 10 drill "Type every piece" · 11 drill × (−1) ·
12 the three Multiply options · 13 hovering the whole number · 14 hovering −1 · 15 the fraction cursor jumped down · 16 the
unit-fraction pop-up · 17 a whole number's Go · 18 the drill's options · 19 Choose a move greyed, moves and I'm stuck lit · 20 the
seesaw's boxes · 21 the seesaw's check, either x.
