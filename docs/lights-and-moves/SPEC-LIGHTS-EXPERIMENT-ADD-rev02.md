# SPEC rev 0.2: Lights experiment, round 2 (adds to rev 0.1, 2026-10-17)

Pasted by Karl into Claude Code on 2026-10-18 (Build B). Built on `main` behind `?ui=lights`; the branch name in the original is ignored.
Rev 0.1 (`SPEC-LIGHTS-EXPERIMENT-ADD.md`) is not in the repository; its build report is `LIGHTS-EXPERIMENT-REPORT.md` and the code is the truth.

## Part A. Fixes and the compact panel

- **A1 Forced move.** It applies to the next problem after a correct first guess. On that problem the move the student needs has a steady ring plus a pulse (the move, never the amount); `x =` is greyed with a one-line note until one move is made (a committed Add, or a cross-drag, combine or distribute from Part B), then stays live.
- **A2** The dashed centre line goes in front of the "=", visible on every row of the newest equation (it is Part B's drop line).
- **A3 The panel.** Four narrow moves only, in this order: Add ___ to both sides, Multiply both sides, Flip everything (× −1), Trade places. About 64–72 px wide, 44 px tall; name on hover/focus. Live as before (Add on L2–3; the others greyed with today's message). Label Why? → Goals (flag-scoped strings). Lights are small round dots, no text, same states and shapes; hover/focus expands a light in place into a pill with its goal text, touch tap toggles, one open at a time. Each light beside its paired move; Each side simplified and the by-hand part of Fewer terms in a small second group under the moves, no icon; Solved for x keeps its own row. Only Fewer terms and Solved for x judged. Target panel width ≤ 150 px (was 440).

## Part B. Grab the terms (Add L2–3; Distribute as a drill route)

- **B0** Every additive term of the newest row is a token with its sign. Pointer events, 6 px drag threshold, `touch-action: none`, a copy lifted about 40 px above the pointer, a dashed gap where it was. Keyboard: Tab to a term, Enter picks up, ←/→ move between slots (across the centre line too), Enter drops, Esc cancels.
- **B1 Reorder** within a side: replaces the newest row in place, undoable, never judged.
- **B2 Cross the border:** over the line on the other side the token shows the opposite sign live (with ⇄); on drop the system writes the same rows the Add button writes, via the engine's `go` with the amount from the term. Judged as a move. Constants only: `x` snaps back with "That moves x. Try the number."
- **B3 Combine like terms:** drop onto a like term on the same side; a blank for the signed sum (the two terms dimmed); Enter or ✓ applies. Right → a new row with one term. Wrong → red, one line naming the sum, Undo; reuse an existing rung or only the line. `AUTO_COMBINE_FROM_LEVEL` = never.
- **B4 Minus is a negative, on request:** tap the minus of `x − 2` → `x + −2` (display only); tap again to restore; Undo covers it. Required before distributing a subtracted factor.
- **B5 Judging:** B2 and B3 are judged as today; B1 and B4 never change a light.
- **B6 Distribute drill:** `?ui=lights&drill=distribute`, problems `5 − 2(x + 2) = 3` and `3(x + 1) = 9`: tap the minus, drag the factor onto the parenthesis (refused with "Tap the minus first, so −2 is a negative number." while it shows `− 2`), one labelled blank per product (`−2 · x`, `−2 · 2`; the x blank has its x printed), Enter or ✓, the other terms brought down; then B1–B3. Only Solved for x judged.

**Logging (flag only):** per problem: drags started; outcomes (reorder / cross / combine / distribute / snap-back / keyboard); minus taps; light hovers (how many, which); move hovers; sums typed wrong.

**Acceptance:** `lx2-NN-…` screenshots at 1366×768 and 1366×650, touch emulation for drags, and `LIGHTS-EXPERIMENT-REPORT-2.md` here: 1 narrow panel (width measured), 2 a light expanded, 3 forced move, 4 the line in front of "=", 5 a token lifted, 6 the opposite sign over the line, 7 after the drop, 8 combine (blank, wrong, right), 9 reorder, 10 x snap-back, 11 minus tap and back, 12 the drill, 13 a keyboard-only B2 run, 14 Add L2 without the flag unchanged.

**Out of scope:** the scaffold tree; automatic combining; dragging on Divide or Flip; Multiply/Flip/Trade as drags; colour per move; moving Add onto the shared loop.

**Decisions in the spec (E):** 1 grabbing a negative term carries its minus; 2 reorder replaces the row in place; 3 only constants cross; 4 a cross-drag fills the amount itself.
