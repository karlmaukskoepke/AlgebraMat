# The loop spec's conformance checklist, run again for Add to both sides and Divide it (Build F, 2026-10-20)

Checked against `docs/design/SPEC-SOLVE-IT-LOOP.md` rev 2.0, on the code after Build F, Part 3. How each line was checked:
- the unit tests (1073);
- `npm run parity` (all five groups pass; every difference was compared run by run with the code before each part);
- 18 seesaw states at 1366×768 and 1366×650 (before and after, in this folder);
- the Part 3 flows clicked through in Chromium at both sizes.

Each line passes, or gives a one-line reason.

| # | Line | Add to both sides | Divide it |
|---|---|---|---|
| 1 | No banner; every message is a pop-up under the action, never over the equation or work | **Pass.** Pop-ups now also stay off the seesaw; with the seesaw in the right-hand space they use the room under the work. | **Pass** |
| 2 | One green button, same place, only the word changes; `x =` never blinks except at x alone | **Pass**, with the D-2 exception Karl approved (`x =` also blinks once clicked). The button no longer moves between seesaw states: one reserved height. | **Pass** (same exception) |
| 3 | Hover preview on every move; one blank; the amount in blue on both sides | **Pass** | **Pass.** The reminder after Undo now opens the fraction option with its preview. |
| 4 | Spotlight on every error: dim, light, message, Undo pulsing with the arrow, hint after | **Pass** (was Partial). A wrong seesaw move is now a picture spotlight; Undo pulses with the arrow; then the hint. | **Pass** |
| 5 | The check is side by side; the value dragged into every x; steps on Next; no text over the equation | **Pass.** On the seesaw the check sits under it, in the same right-hand space, without overlap. | **Pass** |
| 6 | Work shown at every step; the operation in blue; no underline under check rows | **Pass.** The work stack now stays on screen while the seesaw is up. | **Pass** |
| 7 | Scaffolds show pictures, never blank the stack, give something to do; Party/Battle at the numbers with the rest greyed | **Pass** (was Fail on one point). The seesaw, its tray and the walks draw beside the work. At x alone the student crosses off the pairs. | **Pass** |
| 8 | Layout stable; fit test run; worst-case rows reported | **Pass** (was Partial). Worst-case rows: 8 at Levels 2–4, 9 at Levels 5–6 (Part 1). x =, the green button and the corners keep one place in all 18 seesaw states at both sizes. Every seesaw tap target is 44 px or more at 650. | **Pass** (8–9 rows) |
| 9 | Generator verified; banned answers; collisions reported | **Pass** (was Fail). No answer of 0, 1 or −1 over 200 seeds a level. Slip collisions are reported; the common one is "wrong operation = sizes added", in 40–61% of problems. | **Pass** (was Partial). Collisions are reported, for example "gave the boxes = wrong groups". |
| 10 | Shared code: pop-up component, row builder, check renderer, operation colour, scaffold adapter | **Partial.** The row builder and the operation colour are still each card's own. That is the one-screen phase (P6), not in this build. | **Partial** (the same) |
| 11 | Class-sheet words and save codes unchanged | **Pass.** No new words or tags. `crossoff` is recorded when the student crosses off, as before. | **Pass.** The same words. The reminder after Undo now records the existing word `hint`, as the brief asked. |
