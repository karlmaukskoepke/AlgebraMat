# Build D report: the light design, round 1 of fixes (2026-10-18)

Six pushes to `main`, one per Part (0 to 5), in order. After each, `npm run parity` passed with every difference listed in
`tests/parity/INTENDED-CHANGES.md` (sections "Build D, Part 1" to "Part 5"), and the unit tests passed (1004 at the end).
Built to rev 2 of the brief (the lights stay as the collapsed column; Part 1 items 7–11; Divide's fraction becomes a blank).

## Part 0: the decision log
"2026-10-18: the light design" in `docs/design/DECISION-LOG.md`: the principles, the successes, what is retired, and (rev 2) that the
lights stay as the small collapsed column.

## Part 1: remove and simplify
- **No banner** on Add to both sides or Divide it. The line is kept only for screen readers (`srLine`). Every message is a pop-up from
  one component (`view/spotlight.js`) with one placement rule: below wherever the action is; with no room there, the nearest free space
  that covers no equation or work (and, unless it is an error, none of the controls in use). Messages the screen already shows (the
  blank, the green button's word, x = live) say nothing. Input nudges are small pop-ups next to where the student is.
- **One green button** right of `x =`, the same height, the same place on every screen: Check, Go, Next, Got it, Combine, Do it,
  Multiply, Next problem; greyed when there is nothing to move forward; Enter presses it. The ✓ under the blank, the Next on the rule
  line, the Next beside the check and the scaffold's own Go are gone.
- **x = blinks only at the last step** (x alone).
- **The narrow panel** (lights round 2) is the only panel, on both cards, with its collapsed lights. 46 px icons, a little apart; the
  name shows on hover; on Add (and Divide) the preview starts faintly within about 40 px and fully on the icon (only the picture inside
  the button jumps, so the button never moves under the pointer). Round 2 is now how Add plays: `?ui=grab` is gone, the drill is
  `?drill=distribute`.
- **Errors** dim the page, light the wrong thing with its label *under* it, sit below the work, and a hopping arrow points at the
  pulsing Undo (steady for reduced motion).
- **The forced move** (after a correct guess): everything greys except the new problem, the moves and the green Next, with "Your mental
  math is very strong. / Let's try solving this next problem using a move first."; the hovered move's preview is lit too.
- **Help in the corner:** I'm stuck and Start over are small, bottom right. I'm stuck flashes gently after 10 s with nothing done.
  Teach me appears only after a second error on the problem, flashing as it comes. Rungs and counts are unchanged.
- **Keyboard first:** on a keyboard the pad is gone; on touch a compact keypad pops up only while a field is in use.
- **The header** shows for about 3 s at the start of each problem, then fades to a thin line in place (nothing moves); the top of the
  screen or the keyboard brings it back.
- **Earlier lines in lighter ink**; the work on the left, the checking space on the right; bigger equations.
- The very first problem of a visit shows a small "Find the value of x." that goes at the first action.

## Part 2: checking a value side by side
Check greys everything but the equation being checked and the space to its right: "Drag your value into each x.", the value and x
blink. The drop (or a tap on x, or Enter) writes the copy with the value in parentheses on the right; one step per green Next; then
Balanced or Not balanced. A wrong value: "When x = 19, the equation is not balanced." with Undo and the arrow; Undo goes back to before
the guess. Misconceptions: the opposite of the number next to x (new tag `gave-opposite`, tried last so older tags keep their meaning)
gets its own words and, after Undo, Add lit with that amount in its blank; added sizes at x alone (read from the numbers on screen, as 19
is also 11 + 8's `wrong-op`) get party or battle right above the numbers; anything else gets the usual reminder. Built once
(`checkSpace` in `view/solveScreen.js`; `placeValue` in both engines).

## Part 3: dragging terms
A grey preview of the equation the drop would make, right under the newest row, following the slot. The token is green while positive
and turns red with its new sign across the line; the line shows only while dragging, strong, with the landing side tinted. A number
lands in the slot it is dropped on. x across the line is refused with an info pop-up when it is the only side with x, and carried when
both sides have x (`crossX`, built, no card uses it). Combine: the two terms lit with "Combine" over them, the rest greyed, the box for
the sum under them; a wrong sum is an error. The drill has Flip everything and Multiply (by 1 over a number), and a hint lights Flip at
a negative in front of x.

## Part 4: Divide it
The can't-split box stays. After its Undo: the boxes bracketed, "We want only one of the five x boxes.", "What fraction of these boxes
should we find?", and ½ ⅓ ¼ ⅕ ⅙ with the tried ones crossed off and disabled. The right one applies at once and keeps 1 of the boxes
and 1/5 of the counters in the picture until the green Next; a wrong one cycles. The five fraction buttons are gone: the move is a blank
(`engine/divideBlank.js`, a layer round the engine) with the same hover preview as Add, `▢(5x) = ▢(−15)`; type `1/5` (or top and
bottom) and Go. Save bits and class-sheet words are unchanged.

## Part 5: scaffolds
Party or Battle floats at the numbers or the groups of counters with the rest greyed; the panel's old buttons are gone. In the seesaw a
battle beside x stays on the balance with its pairs crossed off until Next. Count it's counters already keep crossed-off counters
(slashed). Teach me: "To cancel the +8 we add its opposite, −8, to both sides", −8 in the Add blank, Add lit, "Do it"; then party or
battle at the numbers; then the counters if asked again; never the value. The seesaw tray bug: the side taps were being sent to the
counters walk; now every tap adds one piece and the piece stays picked. Numbers past 12 at x alone get Count it's big-number walk
(party or battle, add or subtract, the sign) beside the numbers, then x is typed.

## Found and fixed while testing
- The header collapsing made the page jump up 3 s into each problem (a click could land on the wrong thing): it now fades in place.
- A redraw under a still pointer could start a preview on/off loop on the Add icon: fixed in `view/lightsPointer.js`.
- A lifted token in a long row could shrink and shift the row: tokens no longer shrink.

## Not done / for Karl
- "See why it works" (the numeric walkthroughs) still has its banner and wide panel: the brief is about the Solve it problem screens.
- The Teach me test link needs two errors first (by design, item 7).

## Acceptance screenshots (`bd-NN-…-768.png` and `-650.png`, this folder; `take-shots.cjs` re-takes them)
01 opening, no banner · 02–04 the green button (Go, Next, Check) in one place · 05 error below the work with the arrow · 06–10 the check
side by side (drag, copy, stepping, Balanced) · 11–12 not balanced, the usual hint · 13–14 the opposite · 15–16 added sizes · 17 the
forced move · 18 a drag over the line, red, with the grey preview · 19 Combine · 20–24 Divide's cycle (½, ⅓ crossed off, then ⅕) ·
25–26 party or battle at the counters, pairs crossed off · 27 counters crossed off · 28 Teach me.

## Files deleted
`src/view/lightsScreen.js` (the old default screen with the wide panel and the banner), `src/view/grabScreen.js` (merged into the new
`src/view/addBothScreen.js`). Removed from Divide's screen: the banner line, the fractions row, the wide Move / Why? panel, the separate
Check and Next. Gone from Add: the green ✓ under the blank, the Next on the rule line, the panel's Party/Battle buttons.
