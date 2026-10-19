# The loop spec's conformance checklist, run for Add to both sides and Divide it (Build E, 2026-10-19)

Against `docs/design/SPEC-SOLVE-IT-LOOP.md` rev 2.0, on the code after Build E (both cards on the shared loop). How each line was checked:
the unit tests, the parity runs, the 62 parity screens, and clicking through in Chromium at 1366×768 and 1366×650.

| # | Line | Add to both sides | Divide it |
|---|---|---|---|
| 1 | No banner; every message is a pop-up under the action, never over the equation or work | **Pass** | **Pass** |
| 2 | One green button, same place, only the word changes; `x =` never blinks except at x alone | **Pass** (with the D-2 exception Karl approved: `x =` also blinks once it is clicked) | **Pass** (same exception) |
| 3 | Hover preview on every move; one blank; the amount in blue on both sides | **Pass** | **Pass** (the preview is on the three Multiply options, Build D-2) |
| 4 | Spotlight on every error: dim, light, message, Undo pulsing with the arrow, hint after | **Partial**: on the bare screen yes; in the seesaw an error is a plain pop-up (no dimming, no arrow), as before | **Pass** |
| 5 | The check is side by side; the value dragged into every x; steps on Next; no text over the equation | **Pass** (now the loop's check and the shared renderer, the same as Divide) | **Pass** |
| 6 | Work shown at every step; the operation in blue; no underline under check rows | **Pass** (a move made on the seesaw is now written into the work too) | **Pass** |
| 7 | Scaffolds show pictures, never blank the stack, give something to do; Party/Battle at the numbers with the rest greyed | **Fail on one point**: while the seesaw is up it takes the place of the work stack. The rest passes | **Pass** |
| 8 | Layout stable; fit test run; worst-case rows reported | **Partial**: every parity screen fits at 768 and 650; the generator does not report its worst-case row count | **Pass** (`worstCaseRows` in the generator, tested) |
| 9 | Generator verified; banned answers; collisions reported | **Fail**: every problem is verified by substitution, but answers of 1 or −1 appear (6–14% of problems a level over 200 seeds; the spec bans ±1), and slip collisions are not reported | **Partial**: verified, no 0 or ±1; slip collisions not reported |
| 10 | Shared code: pop-up component, row builder, check renderer, operation colour, scaffold adapter | **Partial**: pop-up, check renderer, help registry and play adapter are shared; the row builder and the operation colour are still each card's own | **Partial** (the same) |
| 11 | Class-sheet words and save codes unchanged | **Pass** (parity: events and save codes identical) | **Pass** |

What would close the gaps (none is in this build): the seesaw drawn beside the work instead of over it, and one row builder (the one-screen
phase, P6); a worst-case row report for Add; the ±1 answers (changes the problems some seeds make, so it needs Karl's go-ahead); a
slip-collision report in both generators.
