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
