# Lights experiment on Add to both sides: build report

Spec: SPEC-LIGHTS-EXPERIMENT-ADD.md rev 0.1 (2026-10-15). Built in the real app behind `?ui=lights`, Add to both sides, Levels 2 and 3 only.

**To try it:** `?pack=add-both&level=2&ui=lights` (or `level=3`). Add `&seed=7` to get the problems in these screenshots. With the flag on, Levels 1, 4 and 5 show the classic screen.

**Branch:** `claude/new-session-yadpxi`, not `exp/lights-add`. This session could only push to that branch. Rename or cherry-pick if you want it under the spec's name.

## What a student sees (flag on)

- The line says only **"Find x."** There are no Guess x / Use a move buttons.
- Under the newest equation sits a **ghost row**. Its space is always kept, and it stays empty until it's needed:
  - **Hover or keyboard focus on Add** shows a grey preview: `x + 8 + ▢ = 11 + ▢`.
  - **Click, Enter or Space** turns it solid. The left box gets the cursor, and the right box copies what's typed as it's typed.
  - Once the box holds a whole number, **✓** appears. Enter or ✓ applies it.
- **The result rows are today's:** the work row with x's pair struck through, then `x = 11 + −8`. The other side is never combined.
  - A dashed **rule line** goes under the result, with a green **Next** at its right end.
  - Next commits the move: the line goes solid and Undo no longer reaches it. Typing in `x =` or pressing Check commits it too.
- **Bottom row:** `[I'm stuck]  x = [ ] [Check ✓]  [Teach me]`. The substitution (and its Next) shows under it.
  - Small **Undo** (bottom left) and **Start over** (bottom right), 36 px high. Start over stays greyed until three red moves, as today.
- **Panel:** Add is live from the first frame. Only Fewer terms and Solved for x are judged. The other six lights stay dashed and off; the old fallback is switched off under the flag.

## Screenshots (real build, 1366 wide, each at 768 and 650 tall)

| §7 item | Files |
|---|---|
| 1. Opening (S0), L2 and L3 | `lx-01-s0-L2-*`, `lx-01-s0-L3-*` |
| 2. S1 hover, S1 first tap (touch) | `lx-02-s1-hover-*`, `lx-02-s1-touch-firsttap-*` |
| 3. S2 chosen, box focused, copy showing (mouse and touch) | `lx-03-s2-chosen-*`, `lx-03-s2-touch-secondtap-*` |
| 4. S3 typed `−8` with ✓ | `lx-04-s3-typed-*` |
| 5. S4 result with rule line and Next | `lx-05-s4-result-*` |
| 6. After Next (and then solved) | `lx-06-after-next-*`, `lx-06b-solved-*` |
| 7. Unhelpful `+8`: red, Undo pulsing, then S2 after Undo | `lx-07a-red-*`, `lx-07b-after-undo-*` |
| 8. Wrong guess before any move | `lx-08-wrong-guess-*` |
| 9. Correct guess, then the move is owed: field greyed, Add pulsing | `lx-09-correct-guess-forced-*` |
| 10. I'm stuck rung 1, and the seesaw | `lx-10a-stuck-rung1-*`, `lx-10b-seesaw-*` |
| 11. Keyboard-only run | described below |
| 12. L2 without the flag | `lx-12-noflag-L2-before-768` (before), `lx-12-noflag-L2-768` / `-650` (after), `lx-12-noflag-L2-fontfix-reverted-768` |
| extra: a number dragged into the box from S0 | `lx-13-drag-into-box-650` |

The touch pair (items 2 and 3) uses Chromium touch emulation (`hasTouch`, real tap events with `pointerType: touch`).

## Fit: measured heights

Top and bottom edges in px, from the live page. The pad is the number pad, the last thing on the screen.

| State | 1366×650: left column | 1366×650: pad | 1366×768: left column | 1366×768: pad |
|---|---|---|---|---|
| Every bare state: S0 to S4, after Next, solved, red, after Undo, wrong guess, correct guess, stuck rung 1 (L2 and L3) | 150–582 | 594–638 | 162–594 | 616–660 |
| Seesaw (I'm stuck ×2) | 150–925 | 937–981 ✗ | 162–937 | 959–1003 ✗ |

- **Bare screen:** fits at 650 with 12 px to spare and nothing scrolls (page height = viewport). It fits at 768 with 108 px to spare.
- **Nothing moves between states:** the same numbers hold in every bare state. The line, stack, ghost row and substitution all keep their space.
- **For comparison, today's L2 at 768:** pad at 897–955, so 187 px of overflow, as your estimate said.
- **Levers used, all allowed:**
  - line minimum height 150 → 84 px (it still holds a two-line message without moving anything)
  - stack reserve 380 → 236 px
  - the help row merged into the `x =` row
  - the Undo/Go row and the Add row removed
  - **panel rows 44 → 36 px with 4 px gaps.** The panel was the tallest thing once the left column shrank: 495 px pushed the pad to 689 at 650. Nothing in it is hidden.
- **Seesaw:** see "Could not do" below.

## Keyboard-only run (item 11)

Driven entirely from the keyboard at 1366×650:

1. **Tab ×6** reaches the Add icon. The preview appears on focus.
2. **Esc** clears the preview. Focus stays on Add.
3. **Enter** chooses. The box gets focus and the line says "What do you add to both sides? Type it in the box."
4. **Enter with the box empty:** the box shakes and outlines red, and nothing else happens.
5. **Esc** cancels back to S0, and focus returns to the Add icon.
6. **Space** chooses again.
7. **`-` `8`** types −8 into the box; the right box copies it.
8. **Enter** applies: work row, `x = 11 + −8`, rule line, Next. Focus moves to Next.
9. **Enter** presses Next. The move is committed and focus goes to `x =`.
10. **`3` Enter** checks: the substitution starts and focus is on its Next.
11. **Enter ×3** steps "3 + 8 = 11", "11 = 11", "✓ Balanced". Focus is on "Next problem".
12. **Enter** goes to the next problem.

Enter does the first of: apply the box, Next, the substitution's Next, Check. No page errors.

## Could not do, or did differently (please overturn any)

1. **✓ sits just under the box, not beside it.**
   - Beside the box, it either pushes the left side over when it appears (a reflow, loop §2) or leaves a gap before "=" while hidden.
   - Under it, it floats, so nothing moves. See `lx-04`.
2. **Correct guess: I read "the problem must still be done with a move" as the same problem.**
   - The guess's substitution stays visible (faded), `x =` greys out, the line says "Nice. Now show it with a move.", and Add pulses (blue ring). When x is alone, the field comes back.
   - Because of that, the **next** problem is *not* also forced under the flag (today's add-45 forces the next one). Say if you want both.
3. **Next shows only after a helpful (green) move.**
   - A red, partly cancelling or zero move keeps today's path: Undo pulses and there's no Next. Undo goes back to S2 with the box cleared and focused (add-19).
4. **Implicit commit also happens on choosing Add again, I'm stuck and Teach me.** Not just on typing in `x =` and Check ("never block the student").
5. **A 0 in the box needed one engine line.** `addBothMoves.js` `go` refused 0, so it now allows it when `s.allowZero` is set, which only the flag does. The line then says "Adding 0 keeps everything the same. Undo it and try a different number." Nothing else in the engine changed.
6. **The rung 4 amount pre-fill was not moved.**
   - The first I'm stuck (the reminder) now opens the blank in the equation row (cleared, the +8 outlined): `lx-10a`.
   - But the pre-fill (the guided rung, and Teach me) only happens once the seesaw is up. The seesaw never used the old "Add [ ] to both sides" row: it shows the amount on its own "Add −8 here" side buttons. The ghost row isn't drawn in the seesaw, so the pre-fill still lands on those buttons, as today. Moving it would mean redesigning the scaffold, so I stopped there.
7. **Seesaw fit (not fixed, as asked).** The bottom row stays visible and usable at 768 (747–801). At 650 it starts at 735, below the fold.
   - The page body scrolls, so it can be reached (about 980 px of content against 947 today; the extra is the corner row).
   - The scaffold's own Undo is hidden under the flag so there is one Undo, the corner one.

## Surprises

- **The Lexend fix changes every screen.** The page asked for 700/800 but only 400/600 loaded, so the browser was faking bold.
  - With the fix, the no-flag L2 screen differs from the old screenshot **only in text weight** (22k pixels inside the text areas).
  - With just the font line reverted, it is **pixel-identical** to the screenshot taken before any change (`lx-12-…-fontfix-reverted` vs `…-before`).
- **The page's own key handler skips digits when any button on the Mat has focus.** The box and `x =` are buttons, so typed digits went nowhere at first. The flag screen handles digits, ± and Backspace itself.
- **Redraws and focus.** The Mat is rebuilt on every change. Removing the focused Add icon fires a focus-out mid-redraw, which crashed a nested redraw once. Those dispatches now wait a tick, and focus is restored after each redraw.
- **The preview count is an "episode" count.** Hovering on and off before doing anything else counts once. But a mouse resting on the icon when the ghost row comes back after a move counts as a new look. `previewedBeforeChoose` (true/false) is the cleaner signal.

## Logging (§3 teacher data and §6)

- **`typedBeforeMove`** is added to the card's own problem record in `mat.events.v1` (the log that goes to the class sheet). That's a one-line change in `eventlog.js`, and the field is only there when the flag sets it.
- **The test log** is one line a problem in **`localStorage['mat.lights.v1']`** (newest 500, never synced). It's also printed to the console as `[ui=lights] {…}`. Example:
  ```
  {"t":…,"level":2,"previews":1,"previewedBeforeChoose":true,"chosenCold":0,"typedBeforeMove":false,"sameSignRed":0,
   "nextPressed":1,"implicitCommits":0,"stuck":0,"teach":0,"guessedRight":false,"problem":"x + 8 = 11"}
  ```
- **What the fields mean:**
  - `previews`: preview episodes (hover, keyboard focus, or a first tap).
  - `previewedBeforeChoose` / `chosenCold`: how Add was chosen.
  - `typedBeforeMove`: a digit was typed in `x =` before any move.
  - `sameSignRed`: red first moves with the same sign as the number next to x.
  - `nextPressed` / `implicitCommits`: Next pressed, or the move committed by going on.
  - `stuck`, `teach`: help counts.
  - `guessedRight`: a correct guess on the original.

## Tests

- 15 new unit tests for the wrapper (`tests/addBothLights.test.js`).
- The whole suite passes: **964/964** (949 before).

## Files changed

- `index.html`: Lexend 700 and 800 now load (all screens).
- `src/main.js`: reads `?ui=lights` and routes Add L2–L3 to the new adapter.
- `src/engine/addBothMoves.js`: one guarded line (`allowZero`).
- `src/engine/eventlog.js`: one line (`typedBeforeMove` when present).
- `src/view/lightScreen.js`: `movePanel` takes `noTip` and `preview`, used only by the flag screen.
- `src/view/addBothControls.js`: a `makeAddBothControls(liveOf)` factory. The classic controls are unchanged.
- `src/style.css`: new rules, all under `.ui-lights`, appended at the end.
- New: `src/engine/addBothLights.js` (the wrapper reducer), `src/view/lightsScreen.js`, `src/view/lightsPointer.js`, `src/view/addBothLightsFeedback.js`, `src/play/addBothLightsPlay.js`, `tests/addBothLights.test.js`, and this folder.
