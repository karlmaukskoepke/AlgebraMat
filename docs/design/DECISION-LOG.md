# The Mat: decision log

Format: decision, why, date. All dated 2026-10-11 unless noted.

## Structure
- **Solve it is rebuilt around moves, not step count.** Each card trains a move, so students learn why moves work, not a procedure.
- **Card order:** add to both sides (one-step, pilot) → multiply/divide one-step → fraction equations → two-step → distribute, combine, solve → variables on both sides. Fractions now come before two-step so all the moves exist before they are combined.
- **Old Switch sides + old One-step merge** into the add-to-both-sides card. X-on-the-right and negative answers live in the two new one-step cards. The name "Switch sides" is retired.
- **Old completed levels map to new cards** (nobody re-earns). Google sign-in is already built; no new work there.
- **Only the equations section is retrofitted.** Count it and Build it stay as they are.

## Pedagogy
- **Every card opens with a numeric tutorial** for its move, for every student, including those a diagnostic opened levels for (justification is the point).
- **Tutorial fade:** numbers → counters with a box → symbols only. Scaffolds are removed on purpose.
- **Tutorial quiz** near the end: "keeps or upsets the balance?" with side-by-side feedback on a miss.
- **Each move is justified by the balance readout**, not as shorthand for another move. Cross the border (move-and-flip) is its own move, justified separately.
- **Add to both sides takes two actions** at first (add to one side, then add the same to the other). A combined button comes later (L5).
- **Negatives from the start**, positive answers included. The "positive first, then negatives" principle is retired for Solve it, because positive-only problems invite mental math that skips the opposites.
- **Move-and-flip (Cross the border) is a bonus unlock** after add-to-both-sides, with its own tutorial (L6).
- **Trade places** (not "flip") swaps the two sides. It rotates around the = sign with no mirroring, is introduced in L4 with a numeric tutorial, stays on afterward, is useful but never required. "Flip" is reserved for signs.
- **`4 = x`:** celebrate and credit first, then a quiet convention nudge ("so everyone reads answers the same way"). Never a gate. A light ("x on the left") replaces the nudge from L5.

## Lights (indicators)
- **Three states: green, neutral, red.** Ranked objectives: a lower objective is greyed out until the one above is met.
- **One light at first,** more arrive as moves arrive. Add-to-both-sides card uses: Fewer terms → x alone → x on the left (L4+).
- **Fractions outrank size** (later cards). When fractions are gone, "reduce the size" becomes the next objective.
- **"No opposite box"** (−x → x, with an icon) is the coefficient light (later cards). It means the variable's coefficient is positive, not that x's value is positive.
- **Distribute + combine like terms are one cycle** so the "each side simplified" light can go green (later card).
- **Flip everything** (multiply both sides by −1) is its own move with annotation "take the opposite of both sides" (later card).
- **Lights judge only after a move is committed,** never mid-move.

## Help and feedback
- **I'm stuck** = just-in-time rungs, one at a time, always back to the answer pad. Counter mode is rung 1.
- **Teach me** = the same loop on a forced path, student performs every action, only the correct move enabled.
- **Wrong-move ladder:** undo + tip → counter mode opens → start over appears. The menu never narrows to the correct move.
- **No streaks.** Only a **stuck count** per level, anonymized.
- **Early answer is welcome.** The student then drags the value onto x and clicks through the order of operations to see the balance, and performs the first good move. Needs a tap alternative.
- **Balance readout with x** shows tilt based only on the student's moves. It never reveals the solution.

## Build list (not design decisions)
- **Progress sometimes disappears after site updates.** Fix before rollout.
- **Manipulable counters** (add to left, add to right, cancel pairs; tap alternatives at 390 px; 36-counter cap) are the largest build.
- **Problem generators verify every answer by substitution.** (Example: `x − 5 = −2` is 3, not 5.)
- **Printed notes update:** rename "A · Switch sides" to the new move name and add Trade places.

## Next
- Pilot spec (`SPEC-ADD-TO-BOTH-SIDES.md`) goes to Claude Code. Karl reviews and reports back.
- In parallel, design **multiply/divide one-step** and then **fraction equations** here.

## Added during the build (Claude Code, 2026-10-11)
- **Tutorials play once per student, then by choice** (replay button). Applies to every card's tutorial. (Karl)
- **Add to both sides screen redesigned** after Karl's first look: balance and seesaw on the dashed border, board above the equation, drag-up tray, Balancing moves panel, checkboxes. (Karl)
- **Divide it** spec saved (`SPEC-DIVIDE-IT.md`); review and defaults in `SPEC-DIVIDE-IT-BUILD-NOTES.md`.

## 2026-10-18: the light design (Karl, after testing Builds C and the round-2 experiment live)

The direction every later build serves. **Principles:** fewer elements on screen; a much smaller moves panel; fewer buttons; more
space for the problem; no banner at the top, only just-in-time pop-ups; the screen greys out and the relevant thing is lit during any
feedback loop; previews of moves on mouseover; manipulable equations with previews built in.

**Successes (keep, and only tweak from now on):**
- Hover-preview of a move on the equation, and filling the blank in that row.
- Error pop-ups that dim the page, light the error and are cleared only by a pulsing Undo, followed by a hint pop-up.
- The narrow moves panel.
- Dragging terms: reorder, cross the midline, combine.
- Distributing by dragging the factor onto the parentheses, after tapping the minus to make it a negative.
- Party/Battle shown right at the numbers.
- Level 1 going straight to problems, with "See why it works" as a button.
- The test-links page and its Live / Testing / Retired list.
- Divide's first feedback box (the "can't split 5x in half evenly" box).
- Dragging the tested value into every x (from Divide).

**Retired:**
- Guess x / Use a move.
- The tucked layout.
- The banner for feedback.
- The Why? lights column and the goal labels in the student view. (The engine may keep judging internally, for messages and
  class-sheet tags; nothing of it is shown.)
