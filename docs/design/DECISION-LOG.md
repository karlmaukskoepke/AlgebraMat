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

**Kept after all (Karl, rev 2 of the brief):** the lights stay, as the small collapsed column of dots beside the narrow panel (hover
opens a dot into its goal; no new labels). Now that they take little room, Karl likes them as a curiosity.

## 2026-10-20: Build F review (Karl, after testing Build F live)

**Successes (keep, and only tweak from now on):**
- Divide's hint after Undo: it lights the fraction option and names the idea with real numbers.
- Crossing off pairs at `x = −3 + 5`.

**Karl's answers to Build F's decisions:**
- Keep the wider page.
- Keep counters that arrive already drawn.
- Add's hint after Undo counts as `hint` on the class sheet.

**New rule (loop spec rev 2.1):** never grey out what the question is about. The numbers in `−8 + 11`, the equation being solved, or the
two sides that failed to balance stay at full strength and readable during any pop-up, spotlight or scaffold. Other things grey around them.

## 2026-10-21: card plan (Karl, recorded at the start of Build K)

1. **Card order:** Flip everything (Build J), Two-step (Build K), Distribute + combine + solve, Variables on both sides, Multiply last. One
   card per build.
2. **Basic form** means: the moves, levels, generator, lights, the check, the forced move, the spotlight errors and the hint after Undo all
   work; I'm stuck shows the reminder only (it lights the needed move). No Teach me, seesaw, counters or opposite-box scaffolds until a
   later build.
3. **Two-step rule (Karl chose "B"):** the multiply-type moves (take a fraction, flip everything) are live only when each side is a single
   term. Dividing first or flipping first on a side of two terms (`6x + 12 = 18`, times 1/6) needs the real Distribute mechanic and arrives
   with the Distribute card.
4. **Distribute card requirement (Karl):** the shared loop gets the improved distribute move, with the multiplying factors labelled above
   each blank (as in the hidden drill), as a shared move, not a drill. When it exists, Two-step gets divide-first and flip-first by
   configuration.
5. **Parked for the end of the cards build (Karl):** add the drag features to Build it's Combine like terms and Distribute modules. This
   lifts the "Count it and Build it are read-only" rule for those two modules only. It needs its own spec, parity for Build it, and Karl's
   explicit go-ahead at that time. Build it is not touched in Build K.

## 2026-10-21: multiply / divide menu (Karl's review, recorded at the start of Build L)

**Why:** Flip everything had two doors (its own panel button and Multiply's third option, `−1 × ( )`), and students think "divide both
sides", not "multiply by a fraction", so the menu made them translate first.

1. **Flip everything keeps its own panel button and leaves the Multiply menu.** The `−1 × ( )` option is gone.
2. **The Multiply menu offers three options:** Multiply (a whole number, `n ( ) = n ( )`, negatives allowed), **Divide** (`1/n ( ) = 1/n ( )`:
   the `1/` is printed, the student types only n, one digit, a minus allowed) and Fraction (the general `▢/▢` blank, Build D-2's rules).
   The menu never changes shape; greyed options say why when tapped.
3. **Typing −1 as a multiplier is Flip everything** (the same move, preview, row, class-sheet record and tags as the Flip button), and so
   is dividing by −1. Where Flip is greyed, the typed −1 gets that card's existing greyed message.
4. **The Divide blank accepts negatives.** Dividing by −3 is multiplying by −⅓ (the sign goes on the numerator). It is the same move as
   the Fraction option with a top of −1: one code path, three ways in.
5. **The equation always stays in multiplication form.** Dividing by n is shown as multiplying by 1/n (`⅕ × (5x) = ⅕ × (−15)`), with a
   short label beside the row: "Dividing by 5 is multiplying by ⅕." Dividing by n writes the same rows, checks, lights, class-sheet events
   and save bits as taking 1/n did.
6. **Which options each card turns on:** Divide it: Divide (Multiply explained, not applied; Fraction greyed). Flip everything: Divide from
   saved Level 4 (dividing by −a, or by a, or −1/a in one move: either order). Two-step: Divide once each side is one term (Flip from
   Level 5, as before). Fraction is greyed on every card today; it is for the later Multiply card (fractional coefficients).
7. **Hints name the divide.** Wherever a hint names a fraction, it says "Divide both sides by 5 (that is, multiply by ⅕)", and lights
   the Divide option with its preview.

**Karl's answers to Build K's decisions (all approved):**
- The first-flip pop-up shows once per level, like Trade places.
- The "three x boxes" message appears only when the amount added is the number in front of x.
- Fewer terms goes back to off after a fraction or a flip.
- The placement quiz (the diagnostic) is pointed at the new Two-step card (Build L, Part 5).

## Eventually (Karl, 2026-10-21; not for now)

Ideas recorded, nothing built.

1. **Don't let I'm stuck be spammed past problems.** Karl's idea: after the first I'm stuck on a problem, further clicks mean the problem
   doesn't count toward finishing the level, so students can't look like they're learning by clicking through. Not a penalty. Design
   notes: decide by support type (a reminder is mild; Teach me and the guided step that fills in the amount are the ones that carry the
   answer), not by raw click count; a problem that doesn't count should be replaced by a fresh one, with a cap so no student is stuck
   forever; first read the class sheet's real `hint`/`model`/`guided` counts before choosing thresholds.
2. **Teacher dashboard:** a progress summary, assign specific levels to specific students, see when they are completed. Design note:
   students are anonymous scrambled ids (a hard district rule), so the id-to-name key must stay with the teacher, never in the app.
3. **Other teachers sign up their classes securely.** Design note: keep students anonymous (class codes, no names or emails). This implies
   a real backend in place of the Google Sheet, and a student-data-privacy review (FERPA, COPPA, New York's student data privacy law)
   before anyone outside Karl's district uses it.
4. **Just-in-time hints for choosing a move** (Karl, 2026-10-25; not for now). After a pause with no move, a visual clue: the move
   button glows, a ghost of the action, a short note ("try distributing", "try adding the opposite of 1"). Design notes: this is not
   the 2.5-second nudge, which only covers mechanical steps with one possible action; a hint that names the move is help and records
   `hint`; the wait must allow for slower processors (proposal: the 10-second I'm stuck flash stays; a glow on the move at about 12-15
   seconds; the words only after about 20; the wait adapts to the student's own pace, for example at least 2.5 times that student's
   median time per step on this level, and doubles after a dismissed hint). Tutoring systems tend to make hints student-requested or
   trigger them on errors or long inactivity, not after a few seconds, so a short fixed timer risks teaching students to wait for the
   hint: check this against classroom data (the class sheet's step times) first.
5. **A teacher setting for that wait time** (later).

## 2026-10-23: Build L review and the Distribute card (Karl; built in Build M)

**Build L's decisions, approved:**
- Typing `1` then `/` in Multiply on Divide it switches to Divide (Fraction is greyed there).
- Divide it's "Try dividing both sides." wording stays.
- The divide label before a number is typed stays ("Dividing by a number is multiplying by 1 over it.").
- **Students placed by the quiz before Build L get the new Two-step levels** (Build M, Part 1). Their saved placement opens the new card's
  levels it already showed they know, with the same mapping as a new placement. It only opens levels: nothing is credited as finished,
  and nothing already open is lost. (Build L had kept them at Level 1 under "nothing lost or gained"; Karl: that start was the bug.)
- The placement quiz's results never show a level below 1 (One-step equations said "Start at Level −1" when both its problems were wrong).

**The Distribute card ("Distribute, combine, solve"), basic form, one build:**
1. Solve `3(x + 2) = 15` by distributing, combining, and finishing as in Two-step. Drag the factor onto the parenthesis: a row of blanks,
   one per product, each labelled with its multiplication (`3 · x`, `3 · 2`); the x blank has the x printed after it; every piece is typed
   with its sign. The app brings the other terms down. It never writes a solved value.
2. **The distribute move is shared:** a move of the shared loop any card can turn on, not a drill and not card-only code. The hidden
   Distribute drill (`?drill=distribute`) is deleted once the shared move is live.
3. **Divide-first on a group is accepted:** at `3(x + 2) = 15`, dividing both sides by 3 is helpful and writes `x + 2 = ⅓(15)`. A group
   counts as one term for the single-term rule. A fraction that splits both sides but only partly cancels the factor is legal and neutral.
4. **Combining x-terms** (`3x + 2x`) is new on the shared layer: the student types every piece, the x too (`5x`); a bare `5` is sent back.
5. **Levels:** Karl's levels 1 and 2 are merged (both signs of c). Five levels: `a(x ± c) = b`; `−a(x ± c) = b`; `n + a(x ± c) = b`;
   `n − a(x ± c) = b` (tap the minus first); like x-terms (`a(x ± c) + bx = d`, either order). No walkthrough.
6. **"Practice distributing first"** links to Build it's "Distribute, then combine" instead of a walkthrough (Build it teaches it).
7. **Build it's Combine and Distribute modules stay read-only.** Drag features for them are parked for the end of the cards build.

## 2026-10-23: the Moves panel (Karl; built in Build O)

**Why:** the panel is a column of pictures with no heading, its hover names are informal, and division (the move students think of) is
hidden inside the Multiply menu. Students also read "subtract" as a separate move, when the property is one: add the same number, positive
or negative, to both sides.

1. **The panel is headed "Moves".** Each move's hover name is its formal property of equality: Add, "Addition property of equality: add the
   same number to both sides"; Multiply, "Multiplication property of equality"; Divide, "Division property of equality"; Flip everything,
   "Multiplication property of equality: multiply both sides by −1"; Trade places, "Symmetric property of equality: if a = b, then b = a".
   Order: Add, Multiply, Divide, Flip everything, Trade places.
2. **There is no subtraction move.** Add is the addition property: the student adds a positive or a negative. No card offers or names
   "subtract ___ from both sides" as a move. Arithmetic inside help ("Subtract 15 − 2 to find how many are left") stays: that is arithmetic,
   not a move.
3. **Each move button gets a larger floating symbol to its left** (not a small symbol on the button): + for Add, × for Multiply, ÷ for
   Divide, a small circle of two arrows for Flip everything, a double arrow for Trade places. Build L's small × and ÷ on the Multiply menu's
   options go.
4. **Divide returns as its own button** with a visible division form (`( )/n = ( )/n`), alongside Multiply. This partly reverses Build L
   (which moved division into the Multiply menu): Multiply's menu goes back to whole number and fraction, and the Divide button is a second
   way in. **Divide is display-only:** it is stored and checked exactly as multiplying by 1/n (`−1/3` for a divisor of −3). A row made with
   the Divide button is drawn in division form (`(5x)/5 = (−15)/5`, then `x = (−15)/5`) with a small line under it, "Same as multiplying by
   1/5."; a row made with the Fraction option is drawn as before. Dividing by −3 is written with −3 under each bar. Dividing by −1 is Flip
   everything.
5. **The loop spec goes to rev 2.4** (sections 1C, 2 and 5: the panel, the move list, the Multiply menu and the Divide button).
6. **The screen part of the safety net is repaired first** (Build N found every recorded screen listed as an intended change, so the
   screenshot check passed whatever the screens looked like). The screens are re-baselined to `main` as it was (Build N), the old screen
   entries move to a dated history section the harness does not read, and every screen difference from then on is listed one by one.

## 2026-10-23: nudges and Distribute polish (Karl; built in Build P)

1. **The nudge rule.** After about 2.5 seconds with nothing happening, the app nudges when the next step is **mechanical and there is
   only one thing to do** (combine two numbers, calculate a product): the target glows and pulses, then a small pop-up says what to do,
   with a faint ghost of the action. It **waits for I'm stuck when choosing the move is the thinking**; otherwise the app gives the move
   away. A nudge is not help: nothing is recorded on the class sheet. The 10-second I'm stuck flash is separate and unchanged.
2. **Collapse is off for every card.** The check always shows every step, one per press of Next or Enter, ending Balanced or Not
   balanced, because Karl wants students to watch the order of operations.
3. **One drop per x** when the equation has several x's: every empty x glows while the value is dragged, a drop fills that x only, and
   the copy completes when every x has it.
4. **Distribute's operation labels (`3 · x`, `3 · 2`) appear only after a wrong product.** The first time, the dragged factor is shown in
   colour with arcs to each term inside the parenthesis and "3 groups of"; the labels are the scaffold after a wrong product (recorded
   as `hint`), and the next problem starts without them.
5. **The loop spec goes to rev 2.5** (section 4: no collapsing; sections 2A and 6: the nudge rule).

**Build O's decisions, approved:** Divide it's whole-number option is live but explained again (with the `/` shortcut); "Smaller
numbers" and "One box" move beside Divide; a folded Divide move's tag reads "both sides ÷ 5"; Divide-made fractions stay in division form.

**Karl's answers to Build P's decisions (2026-10-24, all approved):** I'm stuck at `x + 2 = (15)/3` points at working out the product; no
combine nudge on Add to both sides (x is already alone there); the second value of a two-x check is to sit under its x (done in Build R's
shared column grid); a Divide-made fraction is to be drawn in division form in the check's copy too (still to do); Karl tries Tab and the
arrows with a physical keyboard.

## 2026-10-24: Variables on both sides (Karl; built in Build R)

1. **x on one side before checking** (Karl's rule from Build D-2, Part 3). With x on both sides the student must end with x on one side
   before checking: `x =` stays greyed, with a short note ("Get x on one side first."), until x is on only one side. No forced-move rule
   on this card (the student cannot guess first).
2. **Moving an x-term works three ways:** the Add move with an x-term amount (Add has two options: a number, `+ ▢`, or an x-term,
   `+ ▢x`), dragging the x-term across the midline (its sign flips live, as for numbers), and, later, combining.
3. **The check with two or more x's:** one drop per x (built in Build P), on a shared column grid, so each value sits under the x it
   replaced.
4. **Distribution appears at the group level** (Level 5), with the shared distribute move from Build M.
5. The loop spec's guess rule (section 1B) says "x on one side before checking" on cards with x on both sides (rev 2.6).

## 2026-10-24: redraw and drag bugs (Karl, testing Builds P and R; built in Build S)

What Karl found: picking up an x-term made it and the row under it vanish and the last step's animation play again; typing x after a
division, or clicking the fraction bar, replayed the cross-off of the two 3s; the equation's text size jumped from step to step (large,
small, large); with x on the right (`8 = 5x + 3`) dragging the `+ 3` across did nothing; Flip everything's cross-off was too fast and too
flat to see the two minus signs turn positive.

1. **Re-rendering never replays an entrance animation and never hides what the student is holding.** An entrance or cross-off plays
   once, when its row or mark first appears; a redraw for any other reason (a pickup, typing, a click, Undo, hover, a pop-up, the nudge)
   leaves every row already on screen exactly as it was.
2. **The font size never changes while the student works a problem.** It is chosen once, when the problem starts, from that problem's
   worst case, and kept through every row, fold, pop-up, check, Undo and Start over. The loop's rule stays: fold rows when space runs
   out, never shrink text.
3. **Every drag either works or snaps back with a message, never silently fails**, from either side of the =, and the first drag after
   a message works.
4. **Flip everything's cross-off is slower and shows the signs turning:** a vertical stroke through each minus sign makes it a plus, one
   mark at a time, then the pair resolves into the positive result. The cross-off of the two 3s is unchanged.

**Build Q (panel polish) is still pending.** Build R's report said "there was no Build Q"; that was wrong: Build Q is the panel polish
(icons, spacing, the lighter hint, the three-option Multiply menu) and comes next, after Build S.

## 2026-10-25: scaffolds follow the screen; stacked x-term Add (Karl; built in Build T)

1. **The check never writes × for multiplication.** Every substituted line writes a product with parentheses: `7(3)`, `−3(−4)`, `2(7)`,
   `3(3 + 2)`; at most a dot between two numbers. "7 × 3" next to all the x's was confusing.
2. **Flip's red stroke is centred on its minus**, extending equally above and below, so the minus reads as a plus (not a capital T).
3. **A refused drag names a move that applies.** "x is already on the left side… Try moving a number." only says "Try moving the number"
   where a number sits on x's side; at `ax = b` it says to divide; at x alone, to type its value.
4. **Help wording uses the form on the screen.** A row made with the Divide button (a fraction bar) gets division words ("15 divided by
   3"); a row made with the Fraction option gets fraction words ("⅓ of 15"). Before anything is divided, the hint naming the move may
   give both ways ("Divide both sides by 5, which is the same as multiplying by ⅕").
5. **Undo after a wrong typed amount returns to that blank**, not to the gesture before it: a wrong distribute keeps the distribute in
   progress (the factor in colour, the arcs, "3 groups of", the labels, the blanks empty and focused); a wrong sum or a wrong product
   keeps its two terms lit and its blank empty and focused.
6. **An Add that empties one side is the wrong cancel** (`0 = −2x + 10`): legal, but a deliberate teaching exception to "a legal move is
   never red": the spotlight, Undo and a hint (cancel just one x-term), recorded as `hint` with the slip tag `zeroed-side`.
7. **Adding an x-term is stacked under the x-terms**, like adding in a column: a dashed box under the first x-term on each side, one
   amount mirrored in both, the cancelling pair crossed out, then the new row with the added x-term beside the one it was added to.
   An amount that cancels no x-term gets the spotlight ("To cancel 3x, add −3x."), Undo and a hint. Constants stay in line.
8. Karl's ideas for later are in "Eventually" (items 4 and 5: hints on a timer for choosing a move, and a teacher setting for the wait).


## 2026-10-24: panel polish (Karl's review of Build O; built in Build Q)

**Why:** Build O's two arrow symbols were hard to read at panel size; Divide's fraction bars made the work crowded, with highlights,
boxes and notes spilling into the next row; the hint before dividing (a box round the coefficient and another round the x) was too much;
and taking the division option out of the Multiply menu removed a moment Karl wants students to have.

1. **Two new symbols.** Flip everything: two rounded arrows making a circle, like a recycling symbol with two arrows, a minus at the left
   and a plus at the right; one arrow curves up and right from the minus to the plus, the other curves down and left from the plus back
   to the minus ("cycling between negative and positive"; accessible name "Cycle between minus and plus"). Trade places: an equals sign
   in the middle with the same two circling arrows round it ("Equals sign with two circling arrows"). About 26 px, ink, drawn, and
   still clear at that size, at 1366×768 and 1366×650, browser zoom 100% and 125%.
2. **More vertical room wherever the division bar needs it.** Every row is tall enough for the tallest thing it can hold (a division
   row with its bars and blanks, a group, a fraction, a cross-off), so nothing a lit area, outline, blank or pop-up anchor draws crosses
   into the next row. The "Same as multiplying by 1/5." line under a Divide row gets its own reserved line. Fit still wins and the text
   size never drops: if the problem no longer fits, fold sooner (loop spec 3B), never shrink.
3. **A lighter hint when the next move is dividing.** Instead of boxing the coefficient and the x, the row shows a multiplication dot
   between them (`5 · x`, only while the hint shows) and previews the Divide button's fraction bars with the box beneath. The same is
   I'm stuck's first rung; the second is the model ("Model it": boxes equal to the amount, the amount dealt out) where the card has one.
4. **The Multiply menu has three options again**, each with a larger floating symbol to its left in the panel's style: a whole number
   (`n ( ) = n ( )`, ×), one over a blank (`1/▢ ( ) = 1/▢ ( )`, ÷; Build L's option: one digit, a minus allowed, written in
   multiplication form with the line "Dividing by 5 is multiplying by 1/5.", stored as the fraction move with a top of 1), and a fraction
   (`▢/▢ ( ) = ▢/▢ ( )`, a small fraction picture). **The Divide button stays as well: division is reachable two ways on purpose.**
   Karl: a student who clicks Multiply may notice a division option there and question it, and that question is the point.
5. Flip's cross-off (about 3.4 s a flip since Build S) can be skipped: any key, click or Next finishes it at once.
6. The real-browser sweeps run before every push, and their results go in the report.
7. **The loop spec goes to rev 2.9** (sections 1C, 2, 3B, 5 and 6).

**Karl's answers to Build T's decisions (2026-10-25), recorded in Build Q:**

1. The added x-term sits right after its like term (`5x + −2x + 5 = 14`), and an x-term dragged across the = gives the same row: kept.
2. The × stays in the move rows that multiply both sides (`−1 × (−x)`, `⅓ × (15)`) and in Divide it's numbers-only walkthrough: kept for now.
3. An x-term that only part-cancels gets the single "Add so that one x-term cancels." message: kept.
4. **The wrong cancel, corrected (built in Build Q, Part 6).** Build T flagged an Add that leaves 0 on one side and an x-term and a number
   together on the other only when the x-term left was negative (`0 = −2x + 10`). Karl's rule is broader: the error is not separating
   the x-terms and the numbers onto opposite sides, whatever the sign. `2x = 3x + 6` plus −2x (`0 = x + 6`) is flagged too (spotlight,
   Undo, `zeroed-side`, the message as built). The hint after Undo never sends the student back to the same move: it cancels the x-term on
   the side that holds the number, so the number ends alone on its side (`2x = 3x + 6`: add −3x, giving `2x + −3x = 6`); where both
   sides hold a number, the smaller x-term, as before. A negative number in front of x afterwards is fine (Flip handles it): negative
   coefficients are not the concern. Build R's reminder (V1) follows the same rule: where one side is a lone x-term, it outlines the
   x-term on the other side, the one sharing a side with the number.

## 2026-10-25: Distribute more and Strange solutions (Karl; built in Builds U and V)

**Why:** Karl's quiz review sheet (sections 4 and 5: "Distribute, then solve" and "Distribute a fraction") asks for distributing with an
invisible −1 and with a fraction factor, then solving with x on both sides. His quiz is Friday; the review is Thursday.

1. **Two cards, in this order.** **Distribute more** (Build U): distributing (an invisible −1, a fraction factor), combining, then x on
   both sides, whole-number answers only. Then **Strange solutions** (Build V): fraction answers, x = 0, no solution, infinitely many.
   Build V uses Distribute more's moves.
2. **Dividing by a negative stays accepted** (a legal move is never red). Karl teaches flipping first, because more small steps that
   simplify are better than one confusing step, so the pop-up for dividing by a negative gets one more sentence: "Many people flip
   first (· −1), then divide: two simpler steps."
3. **Colour (parked, a colour-pass item; nothing built).** Karl asked for the most consistent choice. His paper convention: **red** = a
   move on both sides, **blue** = a rewrite (swap, commute, distribute, combine), **pink** = constants. The app uses blue for the
   operation and red for errors. The conflict to settle in the colour pass: red means "a move" on paper but "an error" on screen. (Errors
   on screen already carry a cross and an outline, never colour alone, so red could be freed for moves if Karl wants it.)
4. **No times sign in written work (reverses Build T decision 3, "kept for now").** Wherever the problem is written out, a product is a
   dot between two bare numbers or a number and a bare x-term (`3 · 4`, `5 · x`), or the number next to its parentheses when the second
   factor is a parenthesised value or term (`−1(−x) = −1(12)`, `⅓(15)`). The × stays only on the Moves panel (the floating symbol and
   the menu's option drawings).

## 2026-10-25: Strange solutions (Karl; Build V builds Levels 1-3 and the fraction answers, the rest is V2)

**Why:** Karl's quiz review sheet and answer key (sections 3, 4 and 5) have fraction answers, x = 0, no solution and infinitely many.
Its notes: "Improper fractions are full credit, no mixed numbers" and "x can be 0". The quiz is Friday; the review is Thursday.

1. **An unsimplified fraction answer gets a gentle nudge, not red:** "Can you simplify this further?" beside the field, and the student
   retypes. After a second unsimplified try it adds "Divide the top and the bottom by the same number." It is not a wrong answer (tag
   `unsimplified`, recorded with `hint` only when the second line shows).
2. **When x disappears** (`3 = 7`, `3 = 3`), `x =` greys with a note, and two buttons appear: "No solution" and "Infinitely many"
   (Karl: "I love that"). V2.
3. **Two deliberate overrides of the loop's rules, for this card only.** An answer may be **0** (`x = 0` is taught on purpose and must
   never be confused with no solution); and an answer may be **a fraction** (the loop's "one whole number typed" rule, sections 4 and 8,
   gets an exception). Improper fractions are full credit; mixed numbers are not taught and are not accepted; decimals are not accepted
   ("Write it as a fraction, like 5/2."). ±1 stays banned.
4. **Checking a no-solution or infinitely-many answer** (Claude's design, Karl's question), two layers: the final statement is the check
   (a false statement can never become true, a true one is always true); then an optional "Try a number" that runs the usual check on the
   original equation with any number, never graded, never red, recording nothing. V2. The loop spec (rev 2.11) has the new answer kinds.
5. **Karl's answer to Build U:** the small multiplication sign on the distribute arcs stays. The Moves panel and the arcs are the only
   places the times sign remains.
6. **Queued after this build, before V2 (record only; nothing built here):** a panel, menu and cross-out build: a bigger, simpler Moves
   panel (square buttons, large plain symbols, no floating symbols, no goal lights on screen), a diagonal Add cross-out, and a main menu
   where each card is clickable with metallic progress colours.
7. **Scope of Build V (Karl, 2026-10-26):** Levels 1-3 (a fraction answer already simple; one to simplify; x = 0 mixed in) and the
   fraction answers. Levels 4-5 are reserved in the pack and the save code now (so no second layout change), hidden from students until
   V2. Dividing never fails on this card: `6x = 15` divided by 6 writes `x = 15/6`.

## 2026-10-27: Two fixes after Build V (Karl)

1. **The note while the value waits to be dragged** ("Let's check that x = 7 is the solution. Drag the 7 onto an x above.") covered the
   value on a shorter window (1366×650), so students could not drag it up (Enter still worked). It now sits low in the empty check space
   on every Solve it card, and no pop-up may cover the value waiting to be dragged.
2. **The check is faster.** "If there are multiple values of x, these should multiply their coefficients in the same step. Same with
   combining values after. Not one at a time at all." Each press now does every operation of one kind at once, on both sides: inside the
   parentheses, then every product, then (with fractions) every whole number over the denominator, then every sum. This replaces rev 2.5's
   one operation a press, on every card. Loop spec rev 2.12, section 4.

## 2026-10-26: panel simplification (Karl; Build W)

1. **The top five Moves work well; the buttons are too small and their symbols too small to read.** The buttons become larger and
   square, each with one large plain symbol: Add `+`, Multiply `×`, Divide `÷`, Flip everything `×(−1)`, Trade places two curved arrows
   making a circle (the recycling look, no equals sign and no plus or minus; this replaces Build Q's two arrow icons). The preview on the
   equation already shows the work on both sides, so the buttons no longer draw the equation form (`( )/n = ( )/n` and the like).
2. **No floating symbols anywhere,** on the panel or beside the Multiply menu's options. The options keep their own equation-form
   drawings (`n( ) = n( )`, `1/▢( ) = 1/▢( )`, `▢/▢( ) = ▢/▢( )`).
3. **The goal lights are gone for students** (Karl: "an extra detail students do not pay attention to"). The logic stays (the helpful /
   unhelpful judgement, the class-sheet records and the nudges depend on it); `?lights=1` shows them as before, for a teacher or for
   debugging. A teacher view comes later with the class views.
4. **The Add cancel mark reads as a diagonal cross-out,** not an underline: a stroke from the lower left to the upper right at about
   45°, across the whole term, heavier than before.
5. **Queued after this build:** Build X (a clickable main menu with metallic progress colours), then Build V2 (Strange solutions
   Levels 4-5).
6. **Karl's answers to Build V's decisions (all kept):** Level 3 keeps two x = 0 problems; the two answer boxes stay side by side;
   dividing by a number that would leave a fraction beside x is not made (with its message). Also approved, queued for V2: list
   unsimplified tries in the class sheet's answers column (`15/6 → unsimplified`, clearly not a wrong answer).

## 2026-10-26: main menu and progress colours (Karl; built in Build X)

1. **Clicking a card name opens that card's level set directly.** Pointing at or clicking a section title (for example "Solve it")
   expands the whole section. Pointing is never the only way: a tap and keyboard focus (Tab, Enter) do the same.
2. **Metallic progress, on each card and each section.** A card with nothing done is plain; begun and under 50% of its displayed levels
   done is green (emerald); 50% or more is silver; every displayed level earned is gold. Exactly 50% is silver (Karl said "more than
   50%": a choice, reported in Build X). A section is gold when every card in it is gold. Never colour alone: each status also has its own
   shape and the "3 of 5" text.
3. **Two kinds of done per level.** *Earned*: finished by doing it on this card. *Placed*: credited by the placement quiz, or by a finished
   level on an older card (the legacy credit). A placed level shows silver; the student earns gold by opening it and doing one extra
   problem. A card is gold only when every displayed level is earned.
4. **Counting rules.** Only displayed levels count: not hidden levels (Strange solutions 4-5 until they ship), not the "See why it works"
   saved level, not retired or coming-soon cards. Placed levels count toward green and silver. The pack flags the home screen already uses
   (`firstLevel`, `whyLevel`, `lastLevel`) decide what is displayed, so the menu, the level dots and the "3 of 5" text always agree.
5. **Eventually (not now): the support-aware progress rule.** Karl: "If a student gets a full walkthrough of a problem, it shouldn't count
   as much toward progress; the more scaffolds used, the more practice is needed." Proposal, to evaluate against class data first: a level
   needs 5 credits; a problem with no support, the first reminder or the model picture counts 1; a problem that needed the guided step or
   Teach me counts half; a cap of about 12 problems per level, after which the level completes and the teacher sees a flag. Gold should
   mean earned by that rule once it exists; Build X only decides what the colours mean now.
6. **Eventually: the teacher class view** (and assignments).

## 2026-10-31: two Solve it sections (Karl; built in Build X, Part 0b)

1. **Solve it is too big: it becomes two sections.** "Solve it" (7th grade): Add to both sides; Divide it; Flip everything; One-step
   equations; Two-step equations; Distribute, combine, solve. "Solve it Plus" (8th grade): Variables on both sides; Distribute more;
   Strange solutions. Each section title carries a small subtitle ("7th grade", "8th grade").
2. **Only the sections change.** Pack ids, saved levels, save codes, the class sheet and every `?pack=` link are unchanged; resuming lands
   on the right card in either section. The placement quiz stays the Solve it (7th grade) quiz; Solve it Plus has no placement quiz.
3. **The boundary:** no Solve it (7th grade) level has x on both sides (that starts Variables on both sides). Checked in Build X:
   Distribute, combine, solve has x once inside a group (Levels 1-4) and, at Level 5, like x-terms on one side only.
4. **Queued, build nothing yet:** a "Fractions of x" card in Solve it (Karl, 2026-11-01: six levels, from unit fractions `1/3 x = 4`
   through `x/3 = 4`, non-unit fractions `2/3 x = 6`, negatives and x on the right, with a box cut into equal parts as its first
   scaffold). It replaces One-step equations completely; One-step is then retired, with the placement quiz repointed first.
5. **Queued, record only:** a later Solve it Plus card for fractions as coefficients, solved by rewriting `2/3 x` as `2x/3` and by
   multiplying both sides by the reciprocal (the 7th grade card handles `2/3 x = 6` with the box model first).

## 2026-11-01: level popups (Karl; built in Build AB)

1. **The section title no longer expands on hover** (Karl, on Build X's expanding title: "not exactly what I want"). The four panels stay;
   the title is a plain heading and nothing expands from it.
2. **Pointing at a card name shows a small popup of that card's levels**, like a mega-menu: each level's name, its status (plain, placed
   in silver, earned in gold, the current one ringed, locked greyed), "See why it works" where the card has it, and the card's "3 of 5".
   Clicking a card name still opens the card; clicking a level in the popup opens that level. A small chevron beside each name opens the
   same popup for touch and the keyboard, so pointing is never the only way. A locked level is greyed with a short note for now; each
   row is built so Build Z's "Test out" can make a locked row tappable.
3. **The placement quiz ("Find my level") and the timed challenges move to each section's footer.**
4. **Solve it Plus shows no quiz button** until the chained test-outs exist (Karl: "b, yes"). The "Solve it Plus has no placement quiz"
   line goes.
5. **The Timed challenges button appears only where challenges exist** (today, Count it's). No challenges are added.
6. **Separately: a gentler cross-out** (Karl, on Build W's 45° stroke: it is "too big and thick and sometimes hides the numbers; on a
   negative number it lands between the minus and the digit and above the number instead of through the term"). The strike-through
   cancel marks become about 30° (25-35°, shallower on a wide term so the stroke rises no more than about 15% above the term's height),
   centred on the middle of the term's ink (sign included), about half as heavy (about 3 px at the largest text size), with a smaller
   overshoot (about 0.05em at each end), drawn behind the glyphs. Flip's strokes through the minus signs are not changed.

## 2026-11-01: stacked numbers (Karl; built in Build Y)

1. **Add's number is written in a column, like an added x-term (Build T), as the standard on every level of every card with Add:** it
   previews where the number goes and matches how students write the work in class. The amount sits directly under the first number
   (constant) on each side, digits lined up, its sign beside them. Either box takes the keys and the other mirrors it, exactly as the x-term
   boxes behave (Tab between them, a click retypes, Go or Enter applies, 0 refused, the touch keypad for each box).
2. **A side with no number gets the amount at the end of its line, in line** (Karl's variation): `2x + 1 = 5x`, adding −1, stacks `−1`
   under the `1` on the left and writes `5x + −1` on the right. The same for a side that is a group or an x-term only. The hover preview
   shows both placements before an amount is chosen.
3. Two or more numbers on a side: under the first (the combine nudge handles the rest).
4. The pair that cancels is crossed out with the diagonal stroke; the other side's amount stays for the student to combine. The new row
   is written as before. Only the chosen option's boxes show (x-term under the x-term, number under the number).
5. Unchanged: the stored Add move, the check, the shapes, the class-sheet words, save codes, problems; wrong and partial amounts get the
   same spotlights, the stacked amounts lit. Text never shrinks for the extra line: older moves fold sooner instead.

## 2026-11-01: Fractions of x (Karl; built in Build AA)

1. **A 7th grade card, "Fractions of x", replaces One-step equations completely.** It is in Solve it (not Plus), in One-step's slot (after
   Flip everything, before Two-step equations). One-step equations is retired: off the home screen, its saved levels kept.
2. **The box cut into equal parts is the card's pedagogy.** The problem is shown as it is (the student may try it mentally); the model is the
   first scaffold (I'm stuck's first click, and the hint after a wrong value and Undo), drawn automatically the first time a student meets
   a unit fraction (Level 1) and a non-unit fraction (Level 3).
3. **The algebraic way is its own level (Level 2)**, taught the first time with a one-time instruction, after the visual level.
4. **Every fraction of x is a whole number and x is a whole number.** No reciprocal method on this card.
5. **Later, in Solve it Plus (not built):** rewriting `2/3 x` as `2x/3` as the method itself, multiplying by the reciprocal, and answers that
   are not whole. On this card Multiply's whole number is live for the first time, and the fraction can be rewritten by a tap (the rewrite
   toggle, `(p/q)x` ↔ `px/q`; Karl: "Love the toggle."); the loop spec says so (rev 2.15).

## 2026-11-03: Fractions of x refinements (Karl, after playing Build AA; built in Build AC)

1. **"Use a move" is suspended on Levels 1 and 3** (the two model-first levels). A student who solves with the model (the five steps, then
   typing x) or who types a correct value is never asked to use moves there: no "Your mental math is very strong" pop-up and no forced move
   on the next problem. The model's steps count as the student's work. Levels 2, 4, 5 and 6, and every other card, keep the forced-move
   rule as built. It is a setting on the card's levels (`noForcedMove: [1, 3]`), so another level or card can be switched off with one line.
2. **The model is the first help only on Levels 1 and 3.** On Levels 2, 4, 5 and 6 I'm stuck's first click is the reminder naming the move,
   in the form on screen ("Multiply both sides by 3 to cancel the divide by 3.", "Divide both sides by 2: one part is ⅓x = 3."); the second
   click draws the model on the current equation (never on its own); a third repeats the reminder. The hint after a wrong value and Undo
   is the reminder there too (the model on the next I'm stuck). Levels 1 and 3 are unchanged (model, then the reminder).
3. **A negative fraction asks for −1 first, then the box is drawn** (Karl's answer to Build AA). With a minus in front of the fraction
   (`−⅔x = 6`) the first I'm stuck says "Multiply both sides by −1 first." and lights Flip everything; asking for the model before the flip
   says "Multiply both sides by −1 first, then I can draw the box." (recorded as a reminder, `hint`), and after the flip the model draws
   from the current equation. This replaces Build AA's "minus moved over" model for that case. A negative on the right only (`⅔x = −6`)
   keeps Build AA's model (parts worth negative amounts). Either order of moves stays helpful and never red.
4. **The rewrite toggle is shown as a short animation** (about 1.5 s, any key or click finishes it, none under reduced motion, only on the
   tap): `⅔x` → `2x/3`: the x lifts off, is written over 1 (`x/1`), a dot appears (`⅔ · x/1`), the tops and bottoms join and the row is
   printed. `2x/3` → `⅔x`, the reverse: `2 · x` over 3, the x split out as `x/1` (`⅔ · x/1`), the `/1` drops, the row is printed. Dots only,
   never a times sign; a minus in front stays put. The stored term and the "rewrite" row are as Build AA made them.
5. **Parentheses are as tall as what is inside them** (a stacked fraction, a fraction of x, a divide row), with the same weight as their
   neighbours, everywhere in Solve it, through one shared drawing piece. Karl saw it on dividing `⅔x = 6` by 2.
6. **The model appears by itself once per device** (Karl's answer to Build AA: not once per run): the first time on this device on the first
   problem of Level 1, and the first time on Level 3; then it is one click away. Remembered in the browser only (not in the save code, not
   synced, not on the class sheet); if storage is refused it is shown each time. `?model=auto` brings it back for testers. On a shared
   Chromebook only the first student to reach Level 1 (or Level 3) sees it drawn by itself.
7. **The old Two-step item stays removed** (Karl's answer to Build AA).

## 2026-11-01: test out (Karl; built in Build Z)

1. **Students can skip ahead on their own by showing they can do it.** Any student can tap a locked level on a Solve it or Solve it Plus
   card (in the card's level list or its level popup). A small panel asks "Want to try it? Solve 2 problems here to skip ahead." with
   Try it and Not now. No timer, no countdown. Strange solutions' hidden Levels 4-5 are not displayed, so they cannot be tried; "See why
   it works" is not a level here. Count it and Build it are not changed.
2. **The bar is two independent problems** from that level, fresh problems each attempt. **Independent** means the first value the
   student checks (a guess before x is alone, or the final value) is right. A wrong value ends the attempt; so does Give up.
3. **No scaffolds in a test-out**, as in the placement quiz: no I'm stuck, no Teach me, no model pictures, no nudges, no hints after Undo,
   no spotlights or messages beyond the check's Balanced or Not balanced. Undo and Start over stay (they are not help); the moves, the
   previews and the check work as normal.
4. **A pass places** (silver), it does not earn: the level tried and every displayed level below it become placed, the next level opens,
   and the student is taken to the card with a short, warm message. The student earns gold with one extra problem on the level (Build X's
   rule). Placed counts as done for opening the next level.
5. **A fail costs nothing:** "Not yet. Try Level N first." (N is the highest level the student has open), the level stays locked, and the
   student can try again at once, as often as they like, with new problems each time.
6. **Two new class-sheet words, `test-out-pass` and `test-out-fail`.** Each problem of an attempt is logged as a usual per-problem row
   (level, answers and tags) with the attempt's word in its Supports, so the sheet shows the topic's level from a test-out instead of
   leaving a gap. The placed credit goes to the sheet's placed column as Build X defined it.
7. **Eventually (not built):** a chain of test-outs as an adaptive per-card placement; a limited scaffold set in a test-out; a teacher
   switch to open all levels on a device.
8. **Karl's answers to Build Z's decisions (2026-11-03, all four kept as built):** an unsimplified fraction on Strange solutions is not a
   wrong answer in a test-out, and the check's "Can you simplify this further?" is allowed there; a move that makes things worse is written
   and waits for Undo with Undo outlined and no words; the result shows after a 1.5-second pause (a click skips it); "Try Level N first"
   names the highest level the student already has open.

## 2026-11-03: check simplifies fractions; slower rewrite animation (Karl; built in Build AD)

1. **The check never carries a fraction that could be simpler** (Karl: carrying `−20/5` from line to line "seems a little absurd"). A
   fraction may appear on the line whose step produced it, and every step is still shown, but the next line writes it in its simplest form:
   a fraction equal to a whole number becomes that number (`−20/5` → `−4`, `18/3` → `6`); one not in lowest terms goes to lowest terms
   (`10/4` → `5/2`); one already in lowest terms stays a fraction, proper or improper (`7/5`, `−8/5`, `47/2`), never a mixed number or a
   decimal. Everywhere in a line, a fraction inside a sum or a product too (`−20/5 + 3` → `−4 + 3`). A sum of fractions keeps its steps
   (a common bottom, then add), and each result is simplified on its next line. Unchanged: every step shown, the order of operations, a line
   never rewritten after it appears, how a typed answer is judged, the work rows (the solved value is never written for the student).
2. **The rewrite animation on Fractions of x takes about 3 seconds** (Build AC's 1.5 s was far too fast to follow), holding longest on the
   frames that carry the idea: `x/1` appearing and the dot between the fractions; in the reverse direction, `x` split out as `x/1`.
   Everything else as Build AC built it; `?animslow=1` stays four times slower than the new pace.
3. **A shorter note on a locked level:** "Finish Level N or tap to skip ahead." (it was "Finish Level N to open this, or tap to skip
   ahead.", too many words for the little pop-up). What a tap does, the panel, the card page's locked rows and Count it and Build it's note
   are unchanged.
4. **Build Z's six Features to check items: ticked and kept** (2026-11-03).

## 2026-11-03: no-help choice (Karl; built in Build AE, Parts 1-5)

1. **One idea, two doors.** A level is entered with help or by trying it with no help; a locked level has only the second door. At the
   start of every fresh open level of a Solve it or Solve it Plus card, from Level 1 on, a small panel (the **chooser**, not a small button
   on each row) asks "Start with help" (the default: filled and focused, so Enter or Space starts it; today's level, unchanged) or "Try with
   no help" (outlined, "2 problems" under it; never the default). Escape or a tap outside leaves the student on the card. A level in
   progress, placed or earned opens as today; Count it and Build it get no chooser. A first step toward the parked "support-aware
   progress".
2. **The attempt is Build Z's** (the first two problems for a fresh seed, its no-help mode and "independent", the bar now "No help · Level 3
   · Problem 1 of 2 · Give up" everywhere). **Credit 2 + 1 on an open level too:** two independent problems place the level and every
   displayed level below it (silver) and open the next; one more problem earns gold (Build X). The message: "No help needed! Do one more
   problem on Level 3 to make it gold." (a locked level keeps "You skipped ahead!").
3. **A miss on an open level carries on with help on the same problem** (no fail panel, no new message: the usual spotlight after a wrong
   value is the message). Problems already solved in the attempt count as ordinary credits on the level. Give up, or leaving mid-try, also
   carries on with help (leaving is logged as a give-up, as in Build Z); the level is then in progress, so the no-help try is offered once
   per fresh start. On a locked level a miss, Give up or leaving is as Build Z built it, with unlimited retries.
4. **The class-sheet words `test-out-pass` and `test-out-fail` are reused for every no-help attempt** (no new words); a miss on an open level
   logs the attempt's rows, the problem with the miss included, with `test-out-fail`, and the rest of the level logs as any level does.
5. **The locked-level door** is the same small panel with one choice: "Try with no help" ("2 problems") and "Not now". Build Z's "Want to
   try it? Solve 2 problems here to skip ahead." goes. The card page's locked rows ("Locked", "Tap to skip ahead") and Build AD's popup note
   ("Finish Level N or tap to skip ahead.") are unchanged.

## 2026-11-05: Fractions of x suggests multiplying by the bottom first (Karl; built in Build AE, Part 6)

1. **On a non-unit fraction of x the first move suggested is multiplying both sides by the bottom** (Karl: on `⅔x = 6`, suggesting
   "divide both sides by 2" first, to reach `⅓x = 3`, "makes sense for the visual way, but doesn't make sense for the algebraic way").
   Wherever the algebraic help names or lights the first move on `⅔x = 6`, `2x/3 = 6`, the mirrored forms and a negative once flipped (the
   reminder, I'm stuck, the hint after a wrong value or a move and Undo, the reminder after the model), it now says "Multiply both sides by
   3" with Multiply lit: "2x/3 means 2x divided by 3. Multiply both sides by 3 to cancel the divide by 3." and, in fraction words, "⅔x
   means ⅔ of x. Multiply both sides by 3 to cancel the bottom 3." After the multiply, `2x = 18`, the next reminder is "Divide both sides
   by 2."
2. **Unchanged:** dividing first stays legal and helpful, never red (either order helps; if a student divides first the next reminder is
   multiply by the bottom); the model and its bridge row `⅓x = 3` (the visual way); Level 2's one-time instruction; the unit-fraction
   reminders; −1 first on a negative fraction; the class-sheet words, slips and tags; the generator.


## 2026-11-07: a placed level needs one more problem (Karl, after testing Build AE; built in Build V2, Part A)

1. **A placed level opens on its last problem.** Karl: after passing two problems with no help (the level placed, silver), going back to
   "do one more problem to make it gold" still asked for all five problems. Now a level placed by any route (a no-help pass on an open
   level, a locked level's no-help pass, the placement quiz, an older card's credit) opens on problem 5 of 5, with the first four dots
   filled in silver (credited, not worked). It is the level's fifth problem for a fresh seed. Solving it earns the level (gold) and shows
   the usual "Level N complete!" panel; nothing more is asked (not even the extra move problem a correct guess owes on Add's cards). Help is
   available on it as on any level; a miss carries on as on any problem.
2. **Unchanged:** earned levels; a level in progress resumes where it is; the placement quiz and its credit; save codes; the class-sheet
   rows (the problem logs as an ordinary problem); the chooser (a placed level opens straight into play).
