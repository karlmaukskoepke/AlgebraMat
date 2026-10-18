# Build C report: the good parts made permanent, and feedback redone (2026-10-18)

Three parts, each pushed to `main` on its own, in order. Parity passes after each part. Every difference is listed in `tests/parity/INTENDED-CHANGES.md` (sections "Build C, Part 1/2/3"). Unit tests: 998 pass. `npm run build` passes.

## Part 1: graduate the lights experiment; delete what's dead

**Add to both sides plays the lights layout at every problem level** (shown Levels 1–5): hover to preview, the amount typed into the equation row, the rule line and Next. The `?ui=lights` flag is gone. "See why it works" is unchanged.

What round 1 didn't cover, and what I did:
- **Trade places (x on the right, from Level 4):** the lights screen draws Trade places live when x is on the right. On the first time in a level the line asks for it, Trade pulses, and Add waits ("First click Trade places…"), as the classic screen did. The layer passes `introTrade` through, and the engine's `tradeAvailable` no longer depends on the deleted choice.
- **The forced-move problem:** after a correct guess, the next problem greys `x =` with "Make one move first." under it. Add gets a steady ring plus a pulse (a steady ring alone for reduced motion). This lasts until a move is committed: Next, or going on (typing x counts once a good move is waiting for its Next). The line says "Show this one with a move first." Divide has the same rule (its move is ringed; `x =` stays grey until a helpful fraction).
- **The first-time Trade places message** shows from the first frame.
- **Three reds:** Start over comes on after three reds in a row. Since Part 2 makes Undo compulsory after a red move, the red count now survives that Undo, so three reds in a row still count.
- **Round 2 (not tested by you yet) stays a Testing item** behind `?ui=grab`: the narrow panel, grabbing terms and the Distribute drill. Its styles are re-scoped so they never touch the default screen.

**Guess x / Use a move is deleted** on Add to both sides, Divide it and the shared Solve it loop:
- What went: the `path` action and state, its buttons, the choice prompt (`CHOICE_PROMPT`, `CHOICE_BUTTONS`), and the messages `aChoose`, `aGuessPrompt`, `aMovePrompt`, `aChooseFirst`, `aGuessing` and `dMovePrompt`. The engine's own forced-move start went too: the card's layer holds that rule for Add, and the loop's `mustMove` + `movedOnce` hold it for Divide.
- What replaced it: the prompt is **"Find x."** on every card and at every state. Moves and `x =` are always live. A value typed while x is not alone is a guess. Going on (a guess, another move, help) folds a helpful move, as acting on the choice used to.
- The tests for the choice were rewritten for the new rules, or deleted.

**The loop spec changes** (`SPEC-SOLVE-IT-LOOP.md`). These sections describe the choice and need rewriting:
- §1, the loop diagram ("choice returns")
- §1A, the choice (all of it)
- §1B, the forced-move rule (now: "x = is greyed and the move ringed until one helpful move")
- §1C ("the choice returns"; "Undo returns to the same state with the choice shown")
- §1D, Start over ("with the choice showing")
- §2 item 2, the line's buttons (Guess x, Use a move)
- §6, the principle ("back to the choice")
- conformance checklist item 1 ("One prompt … the same two working buttons"); item 12's "the prompt" still holds
- "Required edits to existing specs" (the choice per state)

**The tucked layout is deleted:** `?layout=tucked`, its tests, its styles, its Divide screen and adapter branches, its one-off helper row, its test links, and the `noWhys` option of the move panel that only it used.

**The test-links page is a change list** with three headings, Live, Testing and Retired. Each entry is a name, one plain sentence and, for Live and Testing, its buttons. The rule is in `CLAUDE.md`: anything Karl keeps becomes the default and loses its flag; anything retired is deleted.

**Divide and hover-preview:** what it would take. The five fraction buttons sit in their own row, so a preview needs a ghost row under the newest equation, like Add's: `⅓(5x) = ⅓(−15)` in grey on hover of a fraction, solid on click. The fraction would also need the same commit step (a rule line and Next) and the `1/▢` blank, if that wins the separate decision. All of it is in the view, plus a thin layer like Add's around the loop's `take`, about the size of Add's round-1 layer. Not done here, as asked.

## Part 2: the spotlight message

A shared component: `engine/spotlight.js` (which states are errors, Undo as the only way out, the hint after Undo) and `view/spotlight.js` (the overlay). Add and Divide use it, and any later card plugs in with an `error(s)`, `hint(s)` and `prompt(s)` table.

**Errors:**
- The page dims to 60%, and the wrong thing is lit with an outline plus a small label.
- The message pops up beside it: right, else left, else below, else above. It clears the label too and never covers the lit part.
- Undo is drawn above the dimming as a copy at the real one's place. It pulses, has the focus, and Enter or Space presses it.
- Every other action, tap and key is held back.
- `role="alertdialog"`, said once, since nothing re-renders while it is up.
- A move's new row fades in first (1.6 s, as before), then the spotlight comes up, so the move is seen.
- It works on touch (checked with touch emulation) and fits at 1366×650.

**After Undo, the hint:**
- Add: the reminder rung, "Look at the +8 next to x. What would we add to both sides to eliminate it?", with the number outlined and the Add move highlighted.
- Divide: "Pick a fraction of both sides. Which one leaves one box?", with the number in front of x outlined and Take a fraction highlighted.
- At x alone: "x is alone. Work out what x is and type it."
- No dimming. It goes when the move is started (hover on the move, typing the amount, a fraction) or with Got it.
- It isn't asked for, so it adds nothing to the class sheet.

**The line holds the prompt only** while a pop-up is up. Other guidance stays in the line as before.

**Mapped (the starting table, plus what it missed):**

| Situation | Message | Lit | Label |
|---|---|---|---|
| Same-sign move | `aRed`, **`aRed3`** (third red) | the number next to x in the new row | got bigger |
| Partly cancelling | `aPartial` | the number still next to x | still here |
| **Adding 0** (missed) | `lxZero` | the number next to x | no change |
| Zeroed the other side | `aZeroOther` | the side that is now 0 | now 0 |
| Wrong guess | `aUndoGuess` (at "Not balanced") | the failing check line | not balanced |
| Fraction that doesn't split | `dFail`, **`dFail3`** | the side that broke (both: the row) | doesn't split |
| Help while Undo is owed | `aUndoFirstHelp` | the move row waiting for Undo | waiting for Undo |
| Typed-value slips | `aWrong`, **`dWrong`** (Divide's slips) | the `x =` field | check this |

For a wrong value there is nothing to take back, so Undo only closes the pop-up. The hint then says to work out x.

**Not mapped, still in the line:**
- Input nudges with nothing to undo: "type a number first", "too big", "trade places first", the greyed moves' "unlocks later".
- Messages inside the seesaw scaffold.

**A consequence:** since help can't be pressed while an error is up, Build A's "Undo first" line is now reachable only in the seesaw. It's still mapped in case.

## Part 3: help when x is alone

At `x = 11 + −8` (any two numbers on the other side, read from the current row):
1. **First I'm stuck:** "11 + −8: party or battle?" floats at the two numbers, with them lit (a light dim), and Party! and Battle! in the bubble.
2. **A right pick:** "Yes, a battle: the bigger team wins. Now type x." moves to the `x =` field, which is lit. Nothing is combined and no value is written. **A wrong pick:** the existing nudge ("Look at the signs: …"), then again.
3. **I'm stuck again:** Count it's Combine it counters walk appears in a small tray directly above the two numbers (below them only if there is no room above).
   - It is Count it's own engine (`combineSession` / `session.js`) and Mat drawing (`mat.js`), used read-only through a thin adapter in Solve it's code (`addBothMoves.js` `aloneCounters` / `walkStep`, `lightsScreen.js` `aloneTray`).
   - It starts at the counters (Draw). Its Party/Battle step is skipped when it was answered at the numbers.
   - The student draws, checks the drawing and cancels pairs. The walk stops at its answer step ("Count who is left. Type it in x ="), and the value is typed in `x =`. The app never writes it.
   - Count it's palette, bottom line, step bar, streak and auto-advance are left behind. The tray has + and −, Check, and Party/Battle if needed. Count it's Mat is cropped to its counters, since the real numbers are right under the tray.
4. **Teach me** at this shape starts at step 3, keeping the walk's own Party/Battle.

**Class sheet:**
- The question is recorded as `hint` and the counters as `model`.
- `crossoff` is added only when the student cancels a pair.
- No new words. The walk's tries and tags stay inside the walk, never in the card's tags, the device skills or the sheet.

**Numbers above Count it's 12-a-side limit** (possible from Level 4, e.g. `x = 14 + −3`): Count it's big-number walk is not embedded yet, so they get Build A's words-only sum help instead. Embedding the big walk (`bigSession.js`, with its circling by drag) is the remaining piece. Count it and Build it are not touched.

## Acceptance screenshots (real build, 1366×768 and 1366×650, in this folder)

| File | What |
|---|---|
| `bc-01-add-L1-opening-*` | Add Level 1: "Find x.", no Guess/Move buttons |
| `bc-02-add-L3-opening-*` | Add Level 3 (saved L4): the lights layout, no buttons |
| `bc-03-preview-on-hover-*` | hovering Add: the grey preview row |
| `bc-04-red-move-spotlight-*` | Add 8: dimmed, +16 lit "got bigger", the pop-up, Undo pulsing |
| `bc-05-hint-after-undo-*` | after Undo: the hint at the +8, Got it, Add highlighted |
| `bc-06-wrong-guess-*` | a wrong guess: "Not balanced" lit, Undo pulsing |
| `bc-07-divide-opening-*` | Divide: "Find x.", no choice, x = live |
| `bc-08-forced-move-*` | after a correct guess: Add ringed, x = greyed with "Make one move first." |
| `bc-09-x-alone-1-party-or-battle-*` | step 1: the question at 11 + −8 |
| `bc-10-x-alone-2-now-type-x-*` | step 2: "Now type x." at the field |
| `bc-11-x-alone-3-counters-*`, `bc-12-x-alone-3-counted-*` | step 3: the counters drawn, then cancelled and counted |

`take-shots.cjs` re-takes them against a running dev server.

## Files deleted

`src/view/tuckedLayout.js`, `tests/tuckedLayout.test.js`, `src/play/addBothLightsPlay.js` (merged into `addBothPlay.js`). The classic Add screen is gone from `src/view/lightScreen.js`: `renderLightScreen`, `lineBlock` with its choice buttons, `bareBlock`, `panelBlock`, `answerBlock`, `nextButton`, `helpRow` and `validAmount`. Also gone: `buildAddBothControls` and the engine's `answerLive` (Add), and `helperRow` (the tucked row) in `solveScreen.js`. The round-1 lights screen became the default `lightsScreen.js`; round 2's screen moved to `grabScreen.js`.
