# The Solve it screen as built (2026-10-13)

**What this is.** A record of what the Solve it screens actually do today, for the design chat to work from. Nothing in the app was changed. Every statement is **observed** (a screenshot, a measurement, or a file and line) or marked **inferred** with the reason.

**How it was captured.** Commit `7d1485f` (main, 2026-10-13). The app ran on the local dev server; pages were driven by Playwright in the pre-installed Chromium, in a **1366×768 window** (key screens also at 1280×720). Fixed seeds (`?pack=add-both&level=2&seed=7&nosignin=1`) so every screen can be reproduced. Measurements are in `measure.json`, colours of the pieces in `pieces.json`, the list of every shot in `manifest.json`.

> **Blind spot to keep in mind.** A Chromebook *screen* is 1366×768, but the page only gets what is left after Chrome's tab strip and address bar (about **1366×650**). Every "fits / doesn't fit" below is for a 768-px-tall page, so the real margin on a student's Chromebook is roughly 120 px worse. Worth one test on a real school Chromebook before any layout decision.

---

## Headlines (what surprised me)

1. **The two cards are built on different engines.** Divide it runs on the shared Solve it loop (`src/engine/solveLoop.js`). **Add to both sides does not:** it has its own reducer (`src/engine/addBothMoves.js`) from before the loop existed. So on Add the choice is still fixed per problem, there is no folding and no Next after a move, Start over follows the old three-red rule, and the scaffold replaces the work stack. Any change to "the loop" today means changing two code paths, or moving Add onto the loop first.
2. **Add to both sides does not fit 1366×768.** The page is 955 px tall; Undo is cut in half at the bottom edge and the help row and number pad are only reachable by scrolling (`add-02`). With I'm stuck open it is 1,100 px. Divide it fits exactly (768 px).
3. **On Add, six of the eight Why? lights turn green together with Fewer terms** although nothing judges them (`add-11`). Only Fewer terms and Solved for x have rules; the others copy Fewer terms through a fallback in `src/view/lightScreen.js:287`. The Add spec (§3E) says only those two boxes should show.
4. **There is no "partly" (yellow) light anywhere.** The only in-between state is Add's grey "–" (Fewer terms after a partly cancelling move, `add-20`), which means "no change", not "progress".
5. **Divide it's lights are not computed from the equation.** Any successful fraction sets Smaller numbers green as a constant (`src/engine/divideMoves.js:227`); One box is "coefficient is 1". Several lights (No fractions, No opposite box, x on the left, Each side simplified) have no rule anywhere in the code.
6. **Nothing previews a move today.** Hovering a live move shows only its name in a tooltip (`add-07`, `div-04`); nothing appears on the equation. On a touchscreen one tap selects the move at once and shows no name (`touch-01`), which is also short of loop §5 ("a tap shows its text for a moment before it acts").
7. **A pilot of idea 7 already exists:** `?layout=tucked` on Divide it (the counters tray slides up only when asked for; the moves sit in a drawer; the lights stand alone in a slim column). It has two bugs I could see: after a move, **the keyboard stops typing** into `x =` (focus lands on the Moves tab, and `src/main.js:541` ignores keys while a non-pad button has focus), and the counters **tray is clipped** at 1366×768 (`divt-24` to `divt-27`).
8. **Start over on Add never unlocks after three red moves if the student presses Undo each time** (the spec's own flow): Undo restores the red count saved before the move (`addBothMoves.js:131`), so it never reaches three (`add-23`, `add-24`).
9. **Name clash:** Count it already has a card called **Flip It** (pack id `flipit`, `src/packs/index.js:4`). The Solve it card spec'd as "Flip it" will collide in name and, if reused, in id and save bits.
10. **The bold text is not as bold as the CSS asks.** Only Lexend 400 and 600 are loaded (`index.html:16`), while the line and buttons ask for 700-800. *Inferred:* the browser draws them with the 600 face. If "large and bold" matters, load 700/800.

---

## 1.1 Screenshots

All shots are in `shots/` (WebP), listed by state below and embedded in `CURRENT-STATE.html`. Prefixes: `add-` Add to both sides, `div-` Divide it (classic, the default), `divt-` Divide it with `?layout=tucked`, `touch-` touchscreen emulation. A shot marked *scrolled* has a `-top` twin: the same moment before scrolling.

**Not captured, and why:** Flip it is not built (spec only). "Pressing" a move looks the same as hovering (there is no pressed style). Divide it's L1 final walkthrough was not reached in the script (the five items were). An opposite box is not drawn by any Solve it card (see 1.4).

<!-- GALLERY START -->
### Add to both sides

#### Add to both sides · L2

**`add-01`** Level 2 · opening state of a problem (the choice). Move list and x = row are greyed until a button is tapped.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 2 · opening state of a problem (the choice)](shots/add-01-L2-opening.webp)

**`add-02`** Level 2 · opening, scrolled to the bottom (what is below the fold at 1366×768). The page scrolls by 187 px: Undo is cut off at the top position, and the help row and pad are only reachable by scrolling. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 2 · opening, scrolled to the bottom (what is below the fold at 1366×768) (top)](shots/add-02-L2-opening-scrolled-top.webp)
![Level 2 · opening, scrolled to the bottom (what is below the fold at 1366×768)](shots/add-02-L2-opening-scrolled.webp)

**`add-03`** Level 2 · hovering the Add move before the choice. Before the choice the move is locked: no tooltip.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 2 · hovering the Add move before the choice](shots/add-03-L2-hover-locked-add.webp)

**`add-04`** Level 2 · hovering a greyed move. Hovering a greyed move shows nothing.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 2 · hovering a greyed move](shots/add-04-L2-hover-grey.webp)

**`add-05`** Level 2 · tapping a greyed move.  
The line says: “That move unlocks on a later card.”  
![Level 2 · tapping a greyed move](shots/add-05-L2-tap-grey.webp)

**`add-06`** Level 2 · after “Use a move” (the Move / Why? panel as the student sees it). Add pulses; x = row greyed.  
The line says: “Choose “Add ___ to both sides” in the move list.”  
![Level 2 · after “Use a move” (the Move / Why? panel as the student sees it)](shots/add-06-L2-usemove.webp)

**`add-07`** Level 2 · hovering the Add move (live). The move name appears in a tooltip to the left of the icon. Nothing changes on the equation.  
The line says: “Choose “Add ___ to both sides” in the move list.”  
![Level 2 · hovering the Add move (live)](shots/add-07-L2-hover-add.webp)

**`add-08`** Level 2 · pressing the Add move (mouse held down).  
The line says: “Choose “Add ___ to both sides” in the move list.”  
![Level 2 · pressing the Add move (mouse held down)](shots/add-08-L2-press-add.webp)

**`add-09`** Level 2 · Add chosen: “Add [ ] to both sides” appears under the equation. The blank blinks; Go is greyed until an amount is typed.  
The line says: “Type a number to add to both sides, then press Go.”  
![Level 2 · Add chosen: “Add [ ] to both sides” appears under the equation](shots/add-09-L2-add-chosen.webp)

**`add-10`** Level 2 · amount typed, before Go. Go turns green and pulses.  
The line says: “Type a number to add to both sides, then press Go.”  
![Level 2 · amount typed, before Go](shots/add-10-L2-amount-typed.webp)

**`add-11`** Level 2 · result of a helpful move. Work row with the amount in colour, x’s side cancelled; Fewer terms and Solved for x green; x = row live.  
The line says: “x is alone. What is it? Type it.”  
![Level 2 · result of a helpful move](shots/add-11-L2-after-go-helpful.webp)

**`add-12`** Level 2 · value typed once x is alone (Check flashing).  
The line says: “x is alone. What is it? Type it.”  
![Level 2 · value typed once x is alone (Check flashing)](shots/add-12-L2-value-typed.webp)

**`add-13`** Level 2 · Check pressed: substitution, step 1.  
The line says: “Let’s plug 3 back in for x, into the original equation. Click Next for each line.”  
![Level 2 · Check pressed: substitution, step 1](shots/add-13-L2-check-1.webp)

**`add-14`** Level 2 · substitution, step 2.  
The line says: “Let’s plug 3 back in for x, into the original equation. Click Next for each line.”  
![Level 2 · substitution, step 2](shots/add-14-L2-check-2.webp)

**`add-15`** Level 2 · substitution, step 3.  
The line says: “Let’s plug 3 back in for x, into the original equation. Click Next for each line.”  
![Level 2 · substitution, step 3](shots/add-15-L2-check-3.webp)

**`add-16`** Level 2 · substitution, step 4.  
The line says: “Yes! x = 3, and it balances.”  
![Level 2 · substitution, step 4](shots/add-16-L2-check-4.webp)

**`add-17`** Level 2 · end-of-problem state (correct value, Balanced).  
The line says: “Yes! x = 3, and it balances.”  
![Level 2 · end-of-problem state (correct value, Balanced)](shots/add-17-L2-done.webp)

**`add-18`** Level 2 · result of an unhelpful move (added the same sign). Fewer terms red; Undo pulses.  
The line says: “That didn’t give you fewer terms. Try adding the opposite of the number next to x. Undo it and try a different number to add to both sides.”  
![Level 2 · result of an unhelpful move (added the same sign)](shots/add-18-L2-after-go-unhelpful.webp)

**`add-19`** Level 2 · after Undo. Add stays chosen; blank cleared.  
The line says: “Undone. Choose “Add ___ to both sides” and try a different number.”  
![Level 2 · after Undo](shots/add-19-L2-undo.webp)

**`add-20`** Level 2 · a partly cancelling move (the “grey” light). Fewer terms grey (neutral): the only in-between state the build has.  
The line says: “The +4 is still there, partly cancelled. What would cancel it all? Undo it and try a different number.”  
![Level 2 · a partly cancelling move (the “grey” light)](shots/add-20-L2-after-go-partial.webp)

**`add-21`** Level 2 · zeroing the side without x (named misconception).  
The line says: “The right side is 0, but x isn’t any more alone. Look at the left side. Press Undo.”  
![Level 2 · zeroing the side without x (named misconception)](shots/add-21-L2-zero-other.webp)

**`add-22`** Level 2 · after Undo of the zero-the-other-side move. The number next to x is outlined.  
The line says: “What do we add to both sides to eliminate this?”  
![Level 2 · after Undo of the zero-the-other-side move](shots/add-22-L2-zero-other-undone.webp)

**`add-23`** Level 2 · three red moves in a row. Start over goes live only now on this card (it predates loop §1D). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “That didn’t give you fewer terms. Try adding the opposite of the number next to x. Undo it and try a different number to add to both sides.”  
![Level 2 · three red moves in a row (top)](shots/add-23-L2-three-red-top.webp)
![Level 2 · three red moves in a row](shots/add-23-L2-three-red.webp)

**`add-24`** Level 2 · after Start over.  
The line says: “That didn’t give you fewer terms. Try adding the opposite of the number next to x. Undo it and try a different number to add to both sides.”  
![Level 2 · after Start over](shots/add-24-L2-start-over.webp)

#### Add to both sides · L2 help

**`add-25`** Level 2 · I’m stuck, click 1. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Look at the +8 next to x. What would we add to both sides to eliminate it? Type it in the blank, then press Go.”  
![Level 2 · I’m stuck, click 1 (top)](shots/add-25-L2-stuck-1-top.webp)
![Level 2 · I’m stuck, click 1](shots/add-25-L2-stuck-1.webp)

**`add-26`** Level 2 · I’m stuck, click 2. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Which number would cancel the +8? Tap it, then add its opposite to both sides. Do you know x now?”  
![Level 2 · I’m stuck, click 2 (top)](shots/add-26-L2-stuck-2-top.webp)
![Level 2 · I’m stuck, click 2](shots/add-26-L2-stuck-2.webp)

**`add-27`** Level 2 · I’m stuck, click 3. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Choose "Add ___ to both sides" and pick an amount. Do you know x now?”  
![Level 2 · I’m stuck, click 3 (top)](shots/add-27-L2-stuck-3-top.webp)
![Level 2 · I’m stuck, click 3](shots/add-27-L2-stuck-3.webp)

**`add-28`** Level 2 · I’m stuck, click 4. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “−4 cancels the +8. Add it to both sides yourself.”  
![Level 2 · I’m stuck, click 4 (top)](shots/add-28-L2-stuck-4-top.webp)
![Level 2 · I’m stuck, click 4](shots/add-28-L2-stuck-4.webp)

**`add-29`** Level 2 · I’m stuck: build the equation on the seesaw (L2-L3). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “−4 cancels the +8. Add it to both sides yourself.”  
![Level 2 · I’m stuck: build the equation on the seesaw (L2-L3) (top)](shots/add-29-L2-build-top.webp)
![Level 2 · I’m stuck: build the equation on the seesaw (L2-L3)](shots/add-29-L2-build.webp)

#### Add to both sides · L4 help

**`add-30`** Level 4 · Teach me step-by-step. Pre-built seesaw at L4+, correct amount pre-filled. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Step by step: the −9 next to x cancels with its opposite, +9. Add +9 to the left, then to the right, then Go.”  
![Level 4 · Teach me step-by-step (top)](shots/add-30-L4-teach-top.webp)
![Level 4 · Teach me step-by-step](shots/add-30-L4-teach.webp)

**`add-31`** Level 4 · Teach me: amount added to one side (beam tips). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “9 on the left: the left side is heavier by 9. Now add the same to the other side.”  
![Level 4 · Teach me: amount added to one side (beam tips) (top)](shots/add-31-L4-teach-one-side-top.webp)
![Level 4 · Teach me: amount added to one side (beam tips)](shots/add-31-L4-teach-one-side.webp)

**`add-32`** Level 4 · Teach me: both sides (beam level), before Go. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Both sides got 9: balanced. Tap Go.”  
![Level 4 · Teach me: both sides (beam level), before Go (top)](shots/add-32-L4-teach-both-top.webp)
![Level 4 · Teach me: both sides (beam level), before Go](shots/add-32-L4-teach-both.webp)

**`add-33`** Level 4 · Teach me: after Go (combining ritual). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Look at the highlighted −9 and 9. Is this a Party or a Battle?”  
![Level 4 · Teach me: after Go (combining ritual) (top)](shots/add-33-L4-teach-go-top.webp)
![Level 4 · Teach me: after Go (combining ritual)](shots/add-33-L4-teach-go.webp)

**`add-34`** Level 4 · I’m stuck, click 1 (reminder). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Look at the −9 next to x. What would we add to both sides to eliminate it? Type it in the blank, then press Go.”  
![Level 4 · I’m stuck, click 1 (reminder) (top)](shots/add-34-L4-stuck-1-top.webp)
![Level 4 · I’m stuck, click 1 (reminder)](shots/add-34-L4-stuck-1.webp)

**`add-35`** Level 4 · I’m stuck, click 2 (model it: pre-built seesaw). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Which number would cancel the −9? Tap it, then add its opposite to both sides. Do you know x now?”  
![Level 4 · I’m stuck, click 2 (model it: pre-built seesaw) (top)](shots/add-35-L4-stuck-2-top.webp)
![Level 4 · I’m stuck, click 2 (model it: pre-built seesaw)](shots/add-35-L4-stuck-2.webp)

**`add-36`** Level 4 · I’m stuck, click 3 (choose the move). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Choose "Add ___ to both sides" and pick an amount. Do you know x now?”  
![Level 4 · I’m stuck, click 3 (choose the move) (top)](shots/add-36-L4-stuck-3-top.webp)
![Level 4 · I’m stuck, click 3 (choose the move)](shots/add-36-L4-stuck-3.webp)

**`add-37`** Level 4 · I’m stuck, click 4 (guided amount). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “+9 cancels the −9. Add it to both sides yourself.”  
![Level 4 · I’m stuck, click 4 (guided amount) (top)](shots/add-37-L4-stuck-4-top.webp)
![Level 4 · I’m stuck, click 4 (guided amount)](shots/add-37-L4-stuck-4.webp)

#### Add to both sides · L4 guess

**`add-38`** Level 4 · Guess x chosen (guess mode). x = row live with a blinking cursor; moves greyed.  
The line says: “Type your guess for x in the x = row, then press Check.”  
![Level 4 · Guess x chosen (guess mode)](shots/add-38-L4-guess-mode.webp)

**`add-39`** Level 4 · wrong guess, substitution step 1.  
The line says: “You guessed x = −8. This unbalances the equation.”  
![Level 4 · wrong guess, substitution step 1](shots/add-39-L4-wrong-guess-1.webp)

**`add-40`** Level 4 · wrong guess, step 2.  
The line says: “You guessed x = −8. This unbalances the equation.”  
![Level 4 · wrong guess, step 2](shots/add-40-L4-wrong-guess-2.webp)

**`add-41`** Level 4 · wrong guess, step 3.  
The line says: “You guessed x = −8. This unbalances the equation.”  
![Level 4 · wrong guess, step 3](shots/add-41-L4-wrong-guess-3.webp)

**`add-42`** Level 4 · wrong guess, step 4.  
The line says: “Press Undo to take your guess back.”  
![Level 4 · wrong guess, step 4](shots/add-42-L4-wrong-guess-4.webp)

**`add-43`** Level 4 · wrong guess taken back with Undo. “Make the equation simpler first”; Add highlighted.  
The line says: “Let’s make the equation simpler first, and then find the solution.”  
![Level 4 · wrong guess taken back with Undo](shots/add-43-L4-wrong-guess-undo.webp)

**`add-44`** Level 4 · correct guess: substitution and Balanced.  
The line says: “Yes! x = −8, and it balances.”  
![Level 4 · correct guess: substitution and Balanced](shots/add-44-L4-correct-guess.webp)

**`add-45`** Level 4 · the next problem is a forced move. No choice; “Let’s try solving this one using a move.”  
The line says: “Let’s try solving this one using a move.”  
![Level 4 · the next problem is a forced move](shots/add-45-L4-forced-move.webp)

#### Add to both sides · L5

**`add-46`** Level 5 · opening state, x on the right.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 5 · opening state, x on the right](shots/add-46-L5-opening.webp)

**`add-47`** Level 5 · Use a move: Trade places offered (first time pointed out).  
The line says: “x is on the right. Click “Trade places” to rewrite the equation with x on the left.”  
![Level 5 · Use a move: Trade places offered (first time pointed out)](shots/add-47-L5-usemove-trade.webp)

**`add-48`** Level 5 · hovering Trade places.  
The line says: “x is on the right. Click “Trade places” to rewrite the equation with x on the left.”  
![Level 5 · hovering Trade places](shots/add-48-L5-hover-trade.webp)

**`add-49`** Level 5 · after Trade places (no Go: one tap).  
The line says: “The same equation with the sides traded: x is on the left now. Choose “Add ___ to both sides”.”  
![Level 5 · after Trade places (no Go: one tap)](shots/add-49-L5-after-trade.webp)

**`add-50`** Level 5 · after Add, x alone.  
The line says: “x is alone. What is it? Type it.”  
![Level 5 · after Add, x alone](shots/add-50-L5-after-add.webp)

#### Add to both sides · L1

**`add-51`** Level 1 (numeric) · item 1 opening.  
The line says: “Numbers only: this equation is balanced. Choose “Add ___ to both sides” and add a positive number to both sides.”  
![Level 1 (numeric) · item 1 opening](shots/add-51-L1-opening.webp)

**`add-52`** Level 1 · Add chosen, amount pre-filled. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Try adding 4: it is already in the blank. Add it to the left side, then to the right.”  
![Level 1 · Add chosen, amount pre-filled (top)](shots/add-52-L1-add-chosen-top.webp)
![Level 1 · Add chosen, amount pre-filled](shots/add-52-L1-add-chosen.webp)

**`add-53`** Level 1 · added to one side (Unbalanced). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “4 on the left: 10 ≠ 6 Unbalanced ✗. One side got more than the other.”  
![Level 1 · added to one side (Unbalanced) (top)](shots/add-53-L1-one-side-top.webp)
![Level 1 · added to one side (Unbalanced)](shots/add-53-L1-one-side.webp)

**`add-54`** Level 1 · added to both sides (Balanced). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “4 on both sides: 10 = 10 Balanced ✓. Press Go.”  
![Level 1 · added to both sides (Balanced) (top)](shots/add-54-L1-both-sides-top.webp)
![Level 1 · added to both sides (Balanced)](shots/add-54-L1-both-sides.webp)

**`add-55`** Level 1 · after go. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “4 on both sides kept the balance: 10 = 10 Balanced ✓”  
![Level 1 · after go (top)](shots/add-55-L1-after-go-top.webp)
![Level 1 · after go](shots/add-55-L1-after-go.webp)

**`add-56`** Level 1 · after next. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Numbers only: this equation is balanced. Choose “Add ___ to both sides” and add a negative number to both sides.”  
![Level 1 · after next (top)](shots/add-56-L1-after-next-top.webp)
![Level 1 · after next](shots/add-56-L1-after-next.webp)

#### Add to both sides · 1280

**`add-57`** 1280×720 · Level 2 opening.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![1280×720 · Level 2 opening](shots/add-57-1280-L2-opening.webp)

**`add-58`** 1280×720 · Level 2 after a helpful move.  
The line says: “x is alone. What is it? Type it.”  
![1280×720 · Level 2 after a helpful move](shots/add-58-1280-L2-after-go.webp)

#### Add to both sides · touch

**`touch-01`** Touch · one tap on the Add move (touchscreen emulation). A single tap selects the move at once; whether the name tooltip shows depends on the browser’s sticky hover.  
The line says: “Type a number to add to both sides, then press Go.”  
![Touch · one tap on the Add move (touchscreen emulation)](shots/touch-01-add-tap-move.webp)

### Divide it

#### Divide it · L2

**`div-01`** Level 2 · opening state (the choice).  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 2 · opening state (the choice)](shots/div-01-L2-opening.webp)

**`div-02`** Level 2 · hovering a greyed move.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 2 · hovering a greyed move](shots/div-02-L2-hover-grey.webp)

**`div-03`** Level 2 · after “Use a move” (Move / Why? panel as seen).  
The line says: “Choose “Take a fraction of both sides”.”  
![Level 2 · after “Use a move” (Move / Why? panel as seen)](shots/div-03-L2-usemove.webp)

**`div-04`** Level 2 · hovering “Take a fraction of both sides”. Only a tooltip with the name; nothing on the equation.  
The line says: “Choose “Take a fraction of both sides”.”  
![Level 2 · hovering “Take a fraction of both sides”](shots/div-04-L2-hover-fraction.webp)

**`div-05`** Level 2 · pressing the move (mouse held down).  
The line says: “Choose “Take a fraction of both sides”.”  
![Level 2 · pressing the move (mouse held down)](shots/div-05-L2-press-fraction.webp)

**`div-06`** Level 2 · move chosen: the fractions row goes live. One tap on a fraction applies it to both sides; there is no Go on this card.  
The line says: “Pick a fraction of both sides. Which one leaves one box?”  
![Level 2 · move chosen: the fractions row goes live](shots/div-06-L2-fraction-chosen.webp)

**`div-07`** Level 2 · hovering a fraction button.  
The line says: “Pick a fraction of both sides. Which one leaves one box?”  
![Level 2 · hovering a fraction button](shots/div-07-L2-hover-take.webp)

**`div-08`** Level 2 · unhelpful move: × 1/2 does not split (failed attempt). Red row with ✗; Undo pulses.  
The line says: “3 boxes can't make 2 equal groups. Press Undo and try another fraction.”  
![Level 2 · unhelpful move: × 1/2 does not split (failed attempt)](shots/div-08-L2-failed.webp)

**`div-09`** Level 2 · after Undo. Same state, the choice shown again.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 2 · after Undo](shots/div-09-L2-undo.webp)

**`div-10`** Level 2 · helpful move: × 1/3, x alone. x = ⅓(12) left unevaluated; Smaller numbers, One box and Solved for x green.  
The line says: “x is alone. What is it? Type it.”  
![Level 2 · helpful move: × 1/3, x alone](shots/div-10-L2-helpful.webp)

**`div-11`** Level 2 · value typed, Check flashing.  
The line says: “x is alone. What is it? Type it.”  
![Level 2 · value typed, Check flashing](shots/div-11-L2-typed.webp)

**`div-12`** Level 2 · correct value: Check pressed: drag (or tap) the value onto x.  
The line says: “Drag your answer onto the x in the original equation (or tap your answer, then tap the x).”  
![Level 2 · correct value: Check pressed: drag (or tap) the value onto x](shots/div-12-check-place.webp)

**`div-13`** Level 2 · correct value: value landed on x.  
The line says: “Let’s plug 4 back in for x, into the original equation. Click Next for each line.”  
![Level 2 · correct value: value landed on x](shots/div-13-check-landed.webp)

**`div-14`** Level 2 · correct value: substitution, click 1.  
The line says: “Let’s plug 4 back in for x, into the original equation. Click Next for each line.”  
![Level 2 · correct value: substitution, click 1](shots/div-14-check-line1.webp)

**`div-15`** Level 2 · correct value: substitution, click 2.  
The line says: “Let’s plug 4 back in for x, into the original equation. Click Next for each line.”  
![Level 2 · correct value: substitution, click 2](shots/div-15-check-line2.webp)

**`div-16`** Level 2 · correct value: substitution, click 3.  
The line says: “Yes! x = 4, and it balances.”  
![Level 2 · correct value: substitution, click 3](shots/div-16-check-line3.webp)

**`div-17`** Level 2 · end-of-problem state.  
The line says: “Yes! x = 4, and it balances.”  
![Level 2 · end-of-problem state](shots/div-17-L2-done.webp)

#### Divide it · L2 guess

**`div-18`** Level 2 · Guess x chosen.  
The line says: “Type your guess for x in the x = row, then press Check.”  
![Level 2 · Guess x chosen](shots/div-18-L2-guess-mode.webp)

**`div-19`** Level 2 · wrong guess: Check pressed: drag (or tap) the value onto x.  
The line says: “Drag your answer onto the x in the current equation (or tap your answer, then tap the x).”  
![Level 2 · wrong guess: Check pressed: drag (or tap) the value onto x](shots/div-19-check-place.webp)

**`div-20`** Level 2 · wrong guess: value landed on x.  
The line says: “Let’s plug 2 back in for x, into this equation. Click Next for each line.”  
![Level 2 · wrong guess: value landed on x](shots/div-20-check-landed.webp)

**`div-21`** Level 2 · wrong guess: substitution, click 1.  
The line says: “Let’s plug 2 back in for x, into this equation. Click Next for each line.”  
![Level 2 · wrong guess: substitution, click 1](shots/div-21-check-line1.webp)

**`div-22`** Level 2 · wrong guess: substitution, click 2.  
The line says: “Let’s plug 2 back in for x, into this equation. Click Next for each line.”  
![Level 2 · wrong guess: substitution, click 2](shots/div-22-check-line2.webp)

**`div-23`** Level 2 · wrong guess: substitution, click 3.  
The line says: “Press Undo to take your guess back.”  
![Level 2 · wrong guess: substitution, click 3](shots/div-23-check-line3.webp)

**`div-24`** Level 2 · wrong guess taken back (Undo).  
The line says: “Let’s make the equation simpler first, and then find the solution.”  
![Level 2 · wrong guess taken back (Undo)](shots/div-24-L2-wrongguess-undo.webp)

**`div-31`** Level 2 · correct guess (substitution, Balanced).  
The line says: “Yes! x = −3, and it balances.”  
![Level 2 · correct guess (substitution, Balanced)](shots/div-31-L2-correct-guess.webp)

**`div-32`** Level 2 · next problem is a forced move.  
The line says: “Let’s try solving this one using a move.”  
![Level 2 · next problem is a forced move](shots/div-32-L2-forced.webp)

#### Divide it · L2 help

**`div-25`** Level 2 · I’m stuck, rung 1 (model it and deal it).  
The line says: “3 boxes and 6 counters. What fraction of both sides leaves one box? Choose it, share the counters, and keep one group.”  
![Level 2 · I’m stuck, rung 1 (model it and deal it)](shots/div-25-L2-stuck-1.webp)

**`div-26`** Level 2 · rung 1: fraction chosen, empty groups to deal into.  
The line says: “3 boxes make 3 groups of 1. Now share the 6 counters into 3 equal groups: tap a group to give it one counter.”  
![Level 2 · rung 1: fraction chosen, empty groups to deal into](shots/div-26-L2-stuck-groups.webp)

**`div-27`** Level 2 · rung 1: all counters dealt.  
The line says: “Shared evenly. Tap one group to keep it: that is ⅓ of it.”  
![Level 2 · rung 1: all counters dealt](shots/div-27-L2-stuck-dealt.webp)

**`div-28`** Level 2 · rung 1: a group kept (the move is made; the picture stays until Next).  
The line says: “x is alone. What is it? Type it.”  
![Level 2 · rung 1: a group kept (the move is made; the picture stays until Next)](shots/div-28-L2-stuck-kept.webp)

**`div-29`** Level 2 · I’m stuck at x alone, rung 1 (pile to deal).  
The line says: “What is ⅓ of −6? Share the counters into 3 equal groups: tap a group to give it a counter.”  
![Level 2 · I’m stuck at x alone, rung 1 (pile to deal)](shots/div-29-L2-stuck-xalone-1.webp)

**`div-30`** Level 2 · I’m stuck at x alone, rung 2 (guided: groups made, one bracketed).  
The line says: “The counters are already in 3 equal groups, with 1 of the 3 kept. Count it, and type what x is.”  
![Level 2 · I’m stuck at x alone, rung 2 (guided: groups made, one bracketed)](shots/div-30-L2-stuck-xalone-2.webp)

**`div-33`** Level 2 · I’m stuck, rung 2 (guided: the fraction highlighted).  
The line says: “3 boxes: take ⅓ of both sides to leave one box. Tap ⅓, then share out the counters and keep one group.”  
![Level 2 · I’m stuck, rung 2 (guided: the fraction highlighted)](shots/div-33-L2-stuck-2.webp)

**`div-34`** Level 2 · Teach me step-by-step.  
The line says: “Step by step: 2 boxes, so take ½ of both sides. Tap ½.”  
![Level 2 · Teach me step-by-step](shots/div-34-L2-teach.webp)

#### Divide it · L5

**`div-35`** Level 5 · opening (composite coefficient).  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 5 · opening (composite coefficient)](shots/div-35-L5-opening.webp)

**`div-36`** Level 5 · partial move × ½ (smaller numbers, not one box). The choice returns at once with the same prompt; the move folds on the next action.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 5 · partial move × ½ (smaller numbers, not one box)](shots/div-36-L5-partial.webp)

**`div-37`** Level 5 · after Use a move: the partial move folded to one row.  
The line says: “Choose “Take a fraction of both sides”.”  
![Level 5 · after Use a move: the partial move folded to one row](shots/div-37-L5-folded.webp)

**`div-38`** Level 5 · finishing move: x alone.  
The line says: “x is alone. What is it? Type it.”  
![Level 5 · finishing move: x alone](shots/div-38-L5-finish.webp)

#### Divide it · L1

**`div-39`** Level 1 (numeric) · item 1 opening. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Numbers only: this equation is balanced. Choose “Take a fraction of both sides” and take ⅓ of each side.”  
![Level 1 (numeric) · item 1 opening (top)](shots/div-39-L1-opening-top.webp)
![Level 1 (numeric) · item 1 opening](shots/div-39-L1-opening.webp)

**`div-40`** Level 1 · after [data-action="choose"][data-move="fraction"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Take ⅓: it is already chosen. Take it of the left side, then of the right.”  
![Level 1 · after [data-action="choose"][data-move="fraction"] (top)](shots/div-40-L1-step0-top.webp)
![Level 1 · after [data-action="choose"][data-move="fraction"]](shots/div-40-L1-step0.webp)

**`div-41`** Level 1 · after [data-action="takeSide"]:not([disabled]). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “⅓ of the left: 12 ≠ 36 Unbalanced ✗. One side got smaller than the other.”  
![Level 1 · after [data-action="takeSide"]:not([disabled]) (top)](shots/div-41-L1-step1-top.webp)
![Level 1 · after [data-action="takeSide"]:not([disabled])](shots/div-41-L1-step1.webp)

**`div-42`** Level 1 · after [data-action="takeSide"]:not([disabled]). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “⅓ of both sides: 12 = 12 Balanced ✓. Press Go.”  
![Level 1 · after [data-action="takeSide"]:not([disabled]) (top)](shots/div-42-L1-step2-top.webp)
![Level 1 · after [data-action="takeSide"]:not([disabled])](shots/div-42-L1-step2.webp)

**`div-43`** Level 1 · after [data-action="go"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “⅓ of both sides kept the balance: 12 = 12 Balanced ✓”  
![Level 1 · after [data-action="go"] (top)](shots/div-43-L1-step3-top.webp)
![Level 1 · after [data-action="go"]](shots/div-43-L1-step3.webp)

**`div-44`** Level 1 · after [data-action="next"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Numbers only: this equation is balanced. Choose “Take a fraction of both sides” and take ½ of each side.”  
![Level 1 · after [data-action="next"] (top)](shots/div-44-L1-step4-top.webp)
![Level 1 · after [data-action="next"]](shots/div-44-L1-step4.webp)

**`div-45`** Level 1 · after [data-action="choose"][data-move="fraction"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Take ½: it is already chosen. Take it of the left side, then of the right.”  
![Level 1 · after [data-action="choose"][data-move="fraction"] (top)](shots/div-45-L1-step5-top.webp)
![Level 1 · after [data-action="choose"][data-move="fraction"]](shots/div-45-L1-step5.webp)

**`div-46`** Level 1 · after [data-action="takeSide"]:not([disabled]). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “½ of the left: 12 ≠ 24 Unbalanced ✗. One side got smaller than the other.”  
![Level 1 · after [data-action="takeSide"]:not([disabled]) (top)](shots/div-46-L1-step6-top.webp)
![Level 1 · after [data-action="takeSide"]:not([disabled])](shots/div-46-L1-step6.webp)

**`div-47`** Level 1 · after [data-action="takeSide"]:not([disabled]). *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “½ of both sides: 12 = 12 Balanced ✓. Press Go.”  
![Level 1 · after [data-action="takeSide"]:not([disabled]) (top)](shots/div-47-L1-step7-top.webp)
![Level 1 · after [data-action="takeSide"]:not([disabled])](shots/div-47-L1-step7.webp)

**`div-48`** Level 1 · after [data-action="go"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “½ of both sides kept the balance: 12 = 12 Balanced ✓”  
![Level 1 · after [data-action="go"] (top)](shots/div-48-L1-step8-top.webp)
![Level 1 · after [data-action="go"]](shots/div-48-L1-step8.webp)

**`div-49`** Level 1 · after [data-action="next"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Quick question. Read it below, then pick an answer.”  
![Level 1 · after [data-action="next"] (top)](shots/div-49-L1-step9-top.webp)
![Level 1 · after [data-action="next"]](shots/div-49-L1-step9.webp)

**`div-50`** Level 1 · after [data-action="quiz"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Yes! It upsets the balance.”  
![Level 1 · after [data-action="quiz"] (top)](shots/div-50-L1-step10-top.webp)
![Level 1 · after [data-action="quiz"]](shots/div-50-L1-step10.webp)

**`div-51`** Level 1 · after [data-action="next"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Quick question. Read it below, then pick an answer.”  
![Level 1 · after [data-action="next"] (top)](shots/div-51-L1-step11-top.webp)
![Level 1 · after [data-action="next"]](shots/div-51-L1-step11.webp)

**`div-52`** Level 1 · after [data-action="quiz"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “You said upsets. Look: it keeps the balance.”  
![Level 1 · after [data-action="quiz"] (top)](shots/div-52-L1-step12-top.webp)
![Level 1 · after [data-action="quiz"]](shots/div-52-L1-step12.webp)

**`div-53`** Level 1 · after [data-action="next"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Quick question. Read it below, then pick an answer.”  
![Level 1 · after [data-action="next"] (top)](shots/div-53-L1-step13-top.webp)
![Level 1 · after [data-action="next"]](shots/div-53-L1-step13.webp)

**`div-54`** Level 1 · after [data-action="quiz"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Yes! It upsets the balance.”  
![Level 1 · after [data-action="quiz"] (top)](shots/div-54-L1-step14-top.webp)
![Level 1 · after [data-action="quiz"]](shots/div-54-L1-step14.webp)

**`div-55`** Level 1 · after [data-action="quizNext"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “We don’t know x yet, but the = sign tells us both sides are balanced. Tap “Take a fraction of both sides”.”  
![Level 1 · after [data-action="quizNext"] (top)](shots/div-55-L1-step15-top.webp)
![Level 1 · after [data-action="quizNext"]](shots/div-55-L1-step15.webp)

**`div-56`** Level 1 · after [data-action="choose"][data-move="fraction"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “3 boxes: take ⅓ of both sides to leave one box. Tap ⅓.”  
![Level 1 · after [data-action="choose"][data-move="fraction"] (top)](shots/div-56-L1-step16-top.webp)
![Level 1 · after [data-action="choose"][data-move="fraction"]](shots/div-56-L1-step16.webp)

**`div-57`** Level 1 · after [data-action="go"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Take 1 of the 3 groups on each side: that is what × ⅓ does. Press Next.”  
![Level 1 · after [data-action="go"] (top)](shots/div-57-L1-step17-top.webp)
![Level 1 · after [data-action="go"]](shots/div-57-L1-step17.webp)

**`div-58`** Level 1 · after [data-action="wtNext"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Only the kept group is left: one box, x, and ⅓ of the 6. Press Next.”  
![Level 1 · after [data-action="wtNext"] (top)](shots/div-58-L1-step18-top.webp)
![Level 1 · after [data-action="wtNext"]](shots/div-58-L1-step18.webp)

**`div-59`** Level 1 · after [data-action="wtNext"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Now we have x = 2. Press Next.”  
![Level 1 · after [data-action="wtNext"] (top)](shots/div-59-L1-step19-top.webp)
![Level 1 · after [data-action="wtNext"]](shots/div-59-L1-step19.webp)

**`div-60`** Level 1 · after [data-action="wtNext"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “2 is the amount that makes it balance. Press Next.”  
![Level 1 · after [data-action="wtNext"] (top)](shots/div-60-L1-step20-top.webp)
![Level 1 · after [data-action="wtNext"]](shots/div-60-L1-step20.webp)

**`div-61`** Level 1 · after [data-action="wtNext"]. *(two views: the top of the page, then scrolled to the bottom)*  
The line says: “Taking a fraction of both sides can leave one box. Press Next to go on.”  
![Level 1 · after [data-action="wtNext"] (top)](shots/div-61-L1-step21-top.webp)
![Level 1 · after [data-action="wtNext"]](shots/div-61-L1-step21.webp)

#### Divide it · 1280

**`div-62`** 1280×720 · Level 2 opening.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![1280×720 · Level 2 opening](shots/div-62-1280-L2-opening.webp)

**`div-63`** 1280×720 · after a helpful move.  
The line says: “x is alone. What is it? Type it.”  
![1280×720 · after a helpful move](shots/div-63-1280-L2-helpful.webp)

**`div-64`** 1280×720 · I’m stuck rung 1.  
The line says: “3 boxes and 12 counters. What fraction of both sides leaves one box? Choose it, share the counters, and keep one group.”  
![1280×720 · I’m stuck rung 1](shots/div-64-1280-L2-stuck.webp)

#### Divide it · touch

**`touch-02`** Touch · one tap on Take a fraction.  
The line says: “Pick a fraction of both sides. Which one leaves one box?”  
![Touch · one tap on Take a fraction](shots/touch-02-divide-tap-move.webp)

### Divide it (tucked pilot)

#### Divide it (tucked pilot) · L2

**`divt-01`** Level 2 · opening state (the choice).  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 2 · opening state (the choice)](shots/divt-01-L2-opening.webp)

**`divt-02`** Level 2 · after “Use a move” (Move / Why? panel as seen).  
The line says: “Choose “Take a fraction of both sides”.”  
![Level 2 · after “Use a move” (Move / Why? panel as seen)](shots/divt-02-L2-usemove.webp)

**`divt-03`** Level 2 · hovering “Take a fraction of both sides”. Only a tooltip with the name; nothing on the equation.  
The line says: “Choose “Take a fraction of both sides”.”  
![Level 2 · hovering “Take a fraction of both sides”](shots/divt-03-L2-hover-fraction.webp)

**`divt-04`** Level 2 · pressing the move (mouse held down).  
The line says: “Choose “Take a fraction of both sides”.”  
![Level 2 · pressing the move (mouse held down)](shots/divt-04-L2-press-fraction.webp)

**`divt-05`** Level 2 · move chosen: the fractions row goes live. One tap on a fraction applies it to both sides; there is no Go on this card.  
The line says: “Pick a fraction of both sides. Which one leaves one box?”  
![Level 2 · move chosen: the fractions row goes live](shots/divt-05-L2-fraction-chosen.webp)

**`divt-06`** Level 2 · hovering a fraction button.  
The line says: “Pick a fraction of both sides. Which one leaves one box?”  
![Level 2 · hovering a fraction button](shots/divt-06-L2-hover-take.webp)

**`divt-07`** Level 2 · unhelpful move: × 1/2 does not split (failed attempt). Red row with ✗; Undo pulses.  
The line says: “3 boxes can't make 2 equal groups. Press Undo and try another fraction.”  
![Level 2 · unhelpful move: × 1/2 does not split (failed attempt)](shots/divt-07-L2-failed.webp)

**`divt-08`** Level 2 · after Undo. Same state, the choice shown again.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 2 · after Undo](shots/divt-08-L2-undo.webp)

**`divt-09`** Level 2 · helpful move: × 1/3, x alone. x = ⅓(12) left unevaluated; Smaller numbers, One box and Solved for x green.  
The line says: “x is alone. What is it? Type it.”  
![Level 2 · helpful move: × 1/3, x alone](shots/divt-09-L2-helpful.webp)

**`divt-10`** Level 2 · value typed, Check flashing.  
The line says: “x is alone. What is it? Type it.”  
![Level 2 · value typed, Check flashing](shots/divt-10-L2-typed.webp)

**`divt-11`** Level 2 · correct value: Check pressed: drag (or tap) the value onto x.  
The line says: “Drag your answer onto the x in the original equation (or tap your answer, then tap the x).”  
![Level 2 · correct value: Check pressed: drag (or tap) the value onto x](shots/divt-11-check-place.webp)

**`divt-12`** Level 2 · correct value: value landed on x.  
The line says: “Let’s plug 4 back in for x, into the original equation. Click Next for each line.”  
![Level 2 · correct value: value landed on x](shots/divt-12-check-landed.webp)

**`divt-13`** Level 2 · correct value: substitution, click 1.  
The line says: “Let’s plug 4 back in for x, into the original equation. Click Next for each line.”  
![Level 2 · correct value: substitution, click 1](shots/divt-13-check-line1.webp)

**`divt-14`** Level 2 · correct value: substitution, click 2.  
The line says: “Let’s plug 4 back in for x, into the original equation. Click Next for each line.”  
![Level 2 · correct value: substitution, click 2](shots/divt-14-check-line2.webp)

**`divt-15`** Level 2 · correct value: substitution, click 3.  
The line says: “Yes! x = 4, and it balances.”  
![Level 2 · correct value: substitution, click 3](shots/divt-15-check-line3.webp)

**`divt-16`** Level 2 · end-of-problem state.  
The line says: “Yes! x = 4, and it balances.”  
![Level 2 · end-of-problem state](shots/divt-16-L2-done.webp)

#### Divide it (tucked pilot) · L2 guess

**`divt-17`** Level 2 · Guess x chosen.  
The line says: “Type your guess for x in the x = row, then press Check.”  
![Level 2 · Guess x chosen](shots/divt-17-L2-guess-mode.webp)

**`divt-18`** Level 2 · wrong guess: Check pressed: drag (or tap) the value onto x.  
The line says: “Drag your answer onto the x in the current equation (or tap your answer, then tap the x).”  
![Level 2 · wrong guess: Check pressed: drag (or tap) the value onto x](shots/divt-18-check-place.webp)

**`divt-19`** Level 2 · wrong guess: value landed on x.  
The line says: “Let’s plug 2 back in for x, into this equation. Click Next for each line.”  
![Level 2 · wrong guess: value landed on x](shots/divt-19-check-landed.webp)

**`divt-20`** Level 2 · wrong guess: substitution, click 1.  
The line says: “Let’s plug 2 back in for x, into this equation. Click Next for each line.”  
![Level 2 · wrong guess: substitution, click 1](shots/divt-20-check-line1.webp)

**`divt-21`** Level 2 · wrong guess: substitution, click 2.  
The line says: “Let’s plug 2 back in for x, into this equation. Click Next for each line.”  
![Level 2 · wrong guess: substitution, click 2](shots/divt-21-check-line2.webp)

**`divt-22`** Level 2 · wrong guess: substitution, click 3.  
The line says: “Press Undo to take your guess back.”  
![Level 2 · wrong guess: substitution, click 3](shots/divt-22-check-line3.webp)

**`divt-23`** Level 2 · wrong guess taken back (Undo).  
The line says: “Let’s make the equation simpler first, and then find the solution.”  
![Level 2 · wrong guess taken back (Undo)](shots/divt-23-L2-wrongguess-undo.webp)

**`divt-30`** Level 2 · correct guess (substitution, Balanced).  
The line says: “Yes! x = −3, and it balances.”  
![Level 2 · correct guess (substitution, Balanced)](shots/divt-30-L2-correct-guess.webp)

**`divt-31`** Level 2 · next problem is a forced move.  
The line says: “Let’s try solving this one using a move.”  
![Level 2 · next problem is a forced move](shots/divt-31-L2-forced.webp)

#### Divide it (tucked pilot) · L2 help

**`divt-24`** Level 2 · I’m stuck, rung 1 (model it and deal it).  
The line says: “3 boxes and 6 counters. What fraction of both sides leaves one box? Choose it, share the counters, and keep one group.”  
![Level 2 · I’m stuck, rung 1 (model it and deal it)](shots/divt-24-L2-stuck-1.webp)

**`divt-25`** Level 2 · rung 1: fraction chosen, empty groups to deal into.  
The line says: “3 boxes make 3 groups of 1. Now share the 6 counters into 3 equal groups: tap a group to give it one counter.”  
![Level 2 · rung 1: fraction chosen, empty groups to deal into](shots/divt-25-L2-stuck-groups.webp)

**`divt-26`** Level 2 · rung 1: all counters dealt.  
The line says: “Shared evenly. Tap one group to keep it: that is ⅓ of it.”  
![Level 2 · rung 1: all counters dealt](shots/divt-26-L2-stuck-dealt.webp)

**`divt-27`** Level 2 · rung 1: a group kept (the move is made; the picture stays until Next).  
The line says: “x is alone. What is it? Type it.”  
![Level 2 · rung 1: a group kept (the move is made; the picture stays until Next)](shots/divt-27-L2-stuck-kept.webp)

**`divt-28`** Level 2 · I’m stuck at x alone, rung 1 (pile to deal).  
The line says: “What is ⅓ of −6? Share the counters into 3 equal groups: tap a group to give it a counter.”  
![Level 2 · I’m stuck at x alone, rung 1 (pile to deal)](shots/divt-28-L2-stuck-xalone-1.webp)

**`divt-29`** Level 2 · I’m stuck at x alone, rung 2 (guided: groups made, one bracketed).  
The line says: “The counters are already in 3 equal groups, with 1 of the 3 kept. Count it, and type what x is.”  
![Level 2 · I’m stuck at x alone, rung 2 (guided: groups made, one bracketed)](shots/divt-29-L2-stuck-xalone-2.webp)

**`divt-32`** Level 2 · I’m stuck, rung 2 (guided: the fraction highlighted).  
The line says: “3 boxes: take ⅓ of both sides to leave one box. Tap ⅓, then share out the counters and keep one group.”  
![Level 2 · I’m stuck, rung 2 (guided: the fraction highlighted)](shots/divt-32-L2-stuck-2.webp)

**`divt-33`** Level 2 · Teach me step-by-step.  
The line says: “Step by step: 2 boxes, so take ½ of both sides. Tap ½.”  
![Level 2 · Teach me step-by-step](shots/divt-33-L2-teach.webp)

#### Divide it (tucked pilot) · L5

**`divt-34`** Level 5 · opening (composite coefficient).  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 5 · opening (composite coefficient)](shots/divt-34-L5-opening.webp)

**`divt-35`** Level 5 · partial move × ½ (smaller numbers, not one box). The choice returns at once with the same prompt; the move folds on the next action.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![Level 5 · partial move × ½ (smaller numbers, not one box)](shots/divt-35-L5-partial.webp)

**`divt-36`** Level 5 · after Use a move: the partial move folded to one row.  
The line says: “Choose “Take a fraction of both sides”.”  
![Level 5 · after Use a move: the partial move folded to one row](shots/divt-36-L5-folded.webp)

**`divt-37`** Level 5 · finishing move: x alone.  
The line says: “x is alone. What is it? Type it.”  
![Level 5 · finishing move: x alone](shots/divt-37-L5-finish.webp)

#### Divide it (tucked pilot) · 1280

**`divt-38`** 1280×720 · Level 2 opening.  
The line says: “Would you like to guess the solution (the value of x), or use a move to make the problem simpler?”  
![1280×720 · Level 2 opening](shots/divt-38-1280-L2-opening.webp)

**`divt-39`** 1280×720 · after a helpful move.  
The line says: “x is alone. What is it? Type it.”  
![1280×720 · after a helpful move](shots/divt-39-1280-L2-helpful.webp)

**`divt-40`** 1280×720 · I’m stuck rung 1.  
The line says: “3 boxes and 12 counters. What fraction of both sides leaves one box? Choose it, share the counters, and keep one group.”  
![1280×720 · I’m stuck rung 1](shots/divt-40-1280-L2-stuck.webp)

### Pieces at 3×

**add-seesaw-negative-group-hinted**  
![add-seesaw-negative-group-hinted.png](shots/pieces/add-seesaw-negative-group-hinted.png)

**add-seesaw-x-box**  
![add-seesaw-x-box.png](shots/pieces/add-seesaw-x-box.png)

**add-tray-plus-piece**  
![add-tray-plus-piece.png](shots/pieces/add-tray-plus-piece.png)

**divide-counters-negative**  
![divide-counters-negative.png](shots/pieces/divide-counters-negative.png)

**divide-counters-positive**  
![divide-counters-positive.png](shots/pieces/divide-counters-positive.png)

**light-green**  
![light-green.png](shots/pieces/light-green.png)

**light-neutral-grey**  
![light-neutral-grey.png](shots/pieces/light-neutral-grey.png)

**light-off**  
![light-off.png](shots/pieces/light-off.png)

**light-red**  
![light-red.png](shots/pieces/light-red.png)

**light-solved-green**  
![light-solved-green.png](shots/pieces/light-solved-green.png)

**move-icon-add**  
![move-icon-add.png](shots/pieces/move-icon-add.png)

**move-icon-combine**  
![move-icon-combine.png](shots/pieces/move-icon-combine.png)

**move-icon-cross**  
![move-icon-cross.png](shots/pieces/move-icon-cross.png)

**move-icon-distribute**  
![move-icon-distribute.png](shots/pieces/move-icon-distribute.png)

**move-icon-flip**  
![move-icon-flip.png](shots/pieces/move-icon-flip.png)

**move-icon-fraction**  
![move-icon-fraction.png](shots/pieces/move-icon-fraction.png)

**move-icon-multiply**  
![move-icon-multiply.png](shots/pieces/move-icon-multiply.png)

**move-icon-trade**  
![move-icon-trade.png](shots/pieces/move-icon-trade.png)

**move-panel-grid-locked**  
![move-panel-grid-locked.png](shots/pieces/move-panel-grid-locked.png)

<!-- GALLERY END -->

---

## 1.2 Layout map at 1366×768

Positions are measured (`measure.json`): x, y, width × height in px from the top-left of the page. "Reserved" means the space is kept when empty.

### Add to both sides, Level 2, opening (`add-01`)

The game is a centred 960-px column (x 203 to 1163). The page is **955 px tall** in a 768 window.

| Region | x, y | w × h | Reserved when empty? | What fills it |
|---|---|---|---|---|
| Header (Packs, title, dots, Save code) | 203, 8 | 960 × 54 | always there | |
| Level dots | 917, 22 | 112 × 16 | | five dots |
| The line | 203, 70 | 960 × 157 | min 120; grows to 157 with the two-line prompt + buttons | prompt, Guess x / Use a move, messages, Undo cue |
| Work stack (original equation first) | 203, 253 | 504 × 380 | **yes, 380 reserved** | equation 70 tall, work rows, x = row, check |
| `x = [ ]` row | 384, 329 | 142 × 56 | inside the stack | |
| Check (with Next beside it when stepping) | 385, 397 | 140 × 46 | inside the stack | |
| Substitution list | 455, 451 | — × 108 | **yes, 108** | check rows |
| "Add [ ] to both sides" | 203, 645 | 504 × 56 | **yes, kept invisible until Add is chosen** | the amount blank |
| Undo + Go row | 203, 713 | 504 × 56 | yes | Undo; Go only after Add is chosen |
| Help row | 203, 781 | 504 × 108 | yes | I'm stuck, Teach me, **Start over wraps to a second line** |
| Move / Why? panel | 723, 239 | 440 × 495 | yes | 8 moves × 44 px + gaps, Why? column, Solved for x |
| Number pad | 203, 897 | 960 × 58 | yes | |
| Scaffold area | none on the bare screen | | **not reserved** | I'm stuck **replaces the work stack** with the seesaw (504 × 470) and the page grows to 1,100 |

### Divide it, Level 2, opening, classic (`div-01`)

Full width (1320 px). The page is exactly 768 px tall.

| Region | x, y | w × h | Reserved? | What fills it |
|---|---|---|---|---|
| Header | 23, 8 | 1320 × 54 | | |
| The line | 23, 70 | 1320 × 102 | min 102 | prompt text centred; Guess x / Use a move stacked on the right |
| Work stack | 23, 182 | 538 × 350 | min 300 | equation 44 tall, rows, x = row, Check, substitution (84 reserved) |
| Fractions row "Take × ½ … of both sides" | 23, 536 | 538 × 58 | **yes, greyed until the move is chosen** | five fraction buttons |
| Undo | 23, 598 | 538 × 44 | yes | |
| Help row | 23, 650 | 538 × 50 | yes | I'm stuck, Teach me, Start over on one line |
| Counters / diagram area | 577, 180 | 350 × 215 | **yes, an empty dashed box** "counters appear here when you ask for help" | the group diagram |
| Move / Why? panel | 943, 180 | 400 × 495 | yes | |
| Number pad | 23, 708 | 1320 × 58 | yes | |

### Divide it, `?layout=tucked` (`divt-01`)

| Region | x, y | w × h | Notes |
|---|---|---|---|
| Original equation (pinned) | 23, 70 | 1102 × 58 | |
| Work stack (scrolls) | 23, 134 | 1102 × 338 | shrinks to 120 when the tray is open |
| The line | 23, 478 | 1102 × 102 | **moved below the stack** |
| Helper row (I'm stuck, Teach me, Undo, Start over) | 23, 586 | 1102 × 48 | one row |
| `x =` row + Check | 426, 640 | 296 × 46 | under the helper row, out of the stack |
| Why? column | 1133, 70 | 210 × 616 | lights only, with a Moves tab at its foot |
| Moves drawer | 887, 70 | 470 × 616 | slides over the Why? column, only when opened |
| Counters tray | 23, 470 | 1102 × 220 | slides up only for I'm stuck / Teach me; the diagram inside is 194 tall and **cut off** at the bottom |

### How much vertical space would be freed

- **The Move panel and the scaffold area sit beside the stack, not above it**, so on both cards removing them frees **width** (Add: 456 px; Divide: 366 px for the diagram box and 416 px for the panel), not height. *Inferred from the x positions above.*
- **What costs height is the column under the stack.** On Add: the reserved "Add [ ] to both sides" row (56 + 12 gap), the Undo/Go row (56 + 12) and the two-line help row (108 + 12) add up to **about 256 px**, more than the 187 px Add overflows by. On Divide: the fractions row (58 + 4), Undo (44 + 8) and the help row (50 + 8) are **about 172 px**. Ideas 5 and 6 (blanks in the equation, Undo in a corner, help beside `x =`) would remove most of that. *Sums of measured heights and gaps; an estimate.*
- **Add's scaffold** takes no space until asked for, but then it replaces the stack (against loop §6) and adds 145 px to the page.

---

## 1.3 How the Move panel and the Why? lights work today

### How each Move row is drawn
- **Inline SVG, built in code**, one function per move: `ICONS` and `moveIcon()` in `src/view/lightScreen.js:45-66`. Template: grey `( )` for "whatever is there", the changing part in blue `#0072b2` (`lightScreen.js:32`), a light blue `#6fb6e0` for the "before" of Cross the border. Each sits in a 44-px button, 180-250 px wide (`shots/pieces/move-icon-*.png`).
- **The order** is `MOVES` (`lightScreen.js:17-26`): Add, Cross the border, Take a fraction, Multiply, Flip everything, Trade places, Distribute, Combine.
- **Could the icon be reused as a preview on the equation?** Not directly. The icons are generic pictures (`( ) + ▢ = ( ) + ▢`); the equation rows are **HTML text**, not SVG (`equationRow` and `termsOf` in `src/view/solveScreen.js` and `lightScreen.js`). A preview would be a new "ghost row" drawn with the same HTML row builder, with dashed boxes for the blanks. The **look** (dashed blue box, blue `n`, `1/n`) can be matched in CSS so the icon and the preview read as the same thing. *Inferred from the code.*

### What happens when a move is chosen

**Add to both sides** (bare screen):
1. The line asks **Guess x** or **Use a move**. Until one is tapped the moves are **locked**: greyed, no tooltip (`add-01`, `add-03`).
2. **Use a move**: Add pulses blue (`add-06`).
3. Tap Add: the reserved row **"Add [ ] to both sides"** becomes visible under the stack with a blinking blank; **Go** appears greyed in the Undo row (`add-09`; `lightScreen.js:68`).
4. Type the amount on the pad or keyboard (± toggles the sign). Go turns green and pulses (`add-10`). A number can also be dragged from the equation into the blank.
5. **Go** writes the work row `x + 8 + −8 = 11 + −8` (the amount in blue on both sides, x's pair struck through), then the new row `x = 11 + −8`. The other side is **left unsimplified** so the answer is not shown. The lights are judged (`addBothMoves.js:393` onward, `lightBoard` at `:231`).
6. If x is alone, the `x =` row goes live (`add-11`). There is **no Next and no folding** after a move on this card. Undo stays live for the move.
7. An unhelpful amount: Fewer terms red, the line explains, Undo pulses (`add-18`). Undo keeps Add chosen and clears the blank (`add-19`).

**Divide it** (on the loop):
1. Same choice; moves locked until **Use a move** (`div-01`, `div-03`).
2. Tap *Take a fraction of both sides*: the reserved **fractions row** under the stack goes live (`div-06`).
3. **Tap a fraction: it is applied at once to both sides.** There is no blank and no Go on this card (`divideMoves.js:109`).
4. A fraction that does not split writes a red row with ✗, the line names the side, Undo pulses (`div-08`). Undo returns to the same state with the choice showing (`div-09`).
5. A finishing move writes `⅓(3x) = ⅓(12)` then `x = ⅓(12)`; One box, Smaller numbers and Solved for x turn green; `x =` goes live (`div-10`).
6. A partial move (`4x = 8`, `× ½` → `2x = 4`): the choice returns at once with the same prompt, and a green **Next** appears beside Check (`div-36`). The move **folds** to one row ("½ of both sides 2x = 4") on the student's next action (`div-37`).

**Buttons involved:** Add uses Go + Undo; Divide uses no Go, Undo, and Next (fold) after a partial move. Both use Check, then Next once per substitution line, then "Next problem".

### The Why? lights: every light, its rule, its states, its move

The lights sit in a grid beside the moves they go with (`WHYS`, `lightScreen.js:253-259`); each group is centred on its moves' rows. **Light states that exist in code:** `off` (dashed outline), `green` ✓, `red` ✗, `neutral` (grey –). **There is no partly state.**

| Light | Beside (pairing, `lightScreen.js:253-259`) | Add to both sides | Divide it |
|---|---|---|---|
| **Fewer terms** | Add, Cross the border | **Rule:** `judge()` `addBothMoves.js:84-88`. Terms on x's side are counted as `xTerms` = x, plus 1 if the numbers there add to anything but 0 (`:80`). Green if fewer than before; red if more, or if the number next to x got bigger in size; grey (neutral) otherwise. States: off, green, red, neutral. | forced `off` (`divideScreen.js:92`) |
| **No fractions** | Fraction, Multiply | no rule: **copies Fewer terms' green** (`lightScreen.js:287`) | forced `off` |
| **Smaller numbers** | Fraction, Multiply | no rule: copies Fewer terms' green | **green after any successful fraction**, a constant (`divideMoves.js:227`); never red; a failed fraction leaves it as it was |
| **One box** | Fraction, Multiply | no rule: copies Fewer terms' green | green when the coefficient of x is 1 (`divideMoves.js:227`) |
| **No opposite box** | Flip everything | no rule: copies Fewer terms' green | forced `off` |
| **x on the left** | Trade places | no rule: copies Fewer terms' green (Trade places is live on L5, but this light is never judged) | forced `off` |
| **Each side simplified** | Distribute, Combine | no rule: copies Fewer terms' green | forced `off` |
| **Solved for x** | its own row, last | green when x is the only term on its side (`judge`, `:87`) | green when x is alone (`divideScreen.js` `panelBlock`) |
| **Balanced** (tucked pilot only) | Why? column | — | off; green or red after a check (`divideScreen.js:115-123`). Not in any spec. |

**When they are judged:** only after a committed move (Add: after Go; Divide: after the fraction is taken). A wrong guess does not change them. Undo restores the lights saved before the move.

### Which moves are visible, greyed, hidden or locked

All eight moves are **always drawn** on both cards, at every level (nothing is hidden). What controls it is `movePanel()` (`lightScreen.js:263`) with the card's `active` move and a `locked` flag from each card's `panelBlock`.

| | Add to both sides | Divide it |
|---|---|---|
| Active | Add, every level including L1 | Take a fraction, every level including L1 |
| Also live | Trade places from L5 when x is on the right; the first time it is pointed out and Add waits for it (`addBothMoves.js` `TRADE_LEVEL`, `tradePending`) | — |
| Greyed (tappable, never acts) | the other six; a tap says "That move unlocks on a later card." | the rest; an earlier card's move (Add, Cross, Trade) says "You don't need that move here.", a later one "That move unlocks on a later card." |
| Locked (active move drawn greyed, no tooltip) | before the choice and in guess mode | before the choice and in guess mode |
| Why? boxes of greyed moves | dashed outlines (but they turn green with Fewer terms, see above) | dashed outlines |

### Hover and touch
- **Hover** on a live move shows its name in a dark tooltip to the left of the icon (CSS `::after`, `src/style.css:2943`). Hover on a greyed or locked move shows nothing. **Nothing else depends on hover**; every action is a click or tap.
- **Press**: no pressed style; it looks like hover (`add-08`, `div-05`).
- **Touch** (emulated): one tap selects the move at once; no name is shown (`touch-01`, `touch-02`). The tooltip CSS is not limited to devices that can hover, so on some touch browsers the name may stick after a tap. *Inferred from the CSS.*
- Keyboard: digits, ± and Backspace type into whichever field is live; **Enter** presses the first available of Check, Next, Go (`src/main.js:530-561`).

### The `x =` answer row
- **Add:** `answerBlock()` `lightScreen.js:172`. **Inside the work stack**, under the newest equation, with **Check directly under it** and **Next beside Check** while the substitution steps (`add-13`).
- **Divide:** `answerRow()` `solveScreen.js:113`, same place and order.
- **Live** (white box, blinking cursor) in guess mode, once x is alone, and on Divide while counters are up (`answerOpen`). **Greyed** before the choice, on the move path until x is alone, while a substitution is stepped, and when done. While the value is being placed on x (Divide), the box becomes a chip to drag onto the x.
- **Tucked pilot:** the `x =` row moves **out of the stack** to the bottom of the work column, under the helper row (`divt-01`).

### Where I'm stuck, Teach me, Undo and Start over are
- **Add:** Undo under the stack (150 × 52); help row at the bottom of the left column, 504 × 108, **below the fold** at 1366×768, with Start over wrapping to its own line.
- **Divide (classic):** Undo 150 × 40 above the help row (538 × 50), all three on one line; everything visible.
- **Tucked:** one helper row of four (I'm stuck, Teach me, Undo, Start over), 1102 × 48, right above `x =`.
- I'm stuck and Teach me are live at the start of a problem (an option at any time); Start over is greyed on the untouched original on Divide, and on Add until three red moves.

### I'm stuck and Teach me (for reference)
- **Add:** click 1 is a reminder (the number next to x outlined, the blank opened; `add-25`); click 2 brings in the seesaw and **replaces the work stack** (`add-26`; at L2-L3 it starts with building the equation); click 3 the two-action move; click 4 the amount pre-filled. Teach me: the seesaw with the amount pre-filled, add to each side, Go, then Party/Battle (`add-31` to `add-34`).
- **Divide:** rung 1 shows the boxes and the pile in the reserved diagram area with the fractions live, and the student deals and keeps (`div-25` to `div-28`); rung 2 highlights the needed fraction (`div-33`). At x alone: the pile to deal, then the groups made with one bracketed (`div-29`, `div-30`). The stack never leaves the screen.

---

## 1.4 The look

**Fonts** (`index.html:16`, computed styles in `measure.json`)
- **Lexend** for everything but equations. Loaded weights: **400 and 600 only.** The line asks for 800 at 24 px, Why? labels 600 at 13-14 px, help buttons 600 at 17 px.
- **Kalam 700** (handwritten) for equations: 36 px on Add's stack and Divide's stack.

**Colours**

| Thing | Value | Where set |
|---|---|---|
| Page | white `#ffffff` with a 24-px grid `#e6ecf3` / every 5th `#d5dee9` | `style.css:10-14, 31-45` |
| Ink | `#1d1d1d` | `style.css:3` |
| The line | `#fff6b8` fill, ink border, 14-px corners; red-tinted when a message is "bad", green when done | `style.css:2768` |
| Move / Why? panel | `#fffdf2`, ink border | |
| Operation blue (amount added, fraction, icons' changing part) | `#0072b2` | `lightScreen.js:32`; `style.css:2846` (`.lb-num.is-added`), `:2970` |
| The same blue also marks **"click here"** (pulsing rings), the drop target, hint outlines and the plug-back-in row | `#0072b2` | `style.css:2786, 2794, 2834, 2881, 2966` |
| Step highlight in the check (accent) | purple `#7b3fb0` | `style.css:3044` |
| Positive counters | **Add seesaw:** ink `+` marks in a white rounded box. **Divide diagram:** green `#009e73` | `style.css:2609`; `--inside`, `style.css:7` |
| Negative counters | **Add seesaw:** ink `−` marks in a **dashed** box. **Divide diagram:** magenta `#b8508f` | `style.css:2610`; `--opposite`, `style.css:4` |
| x box | white fill, ink stroke 2.5 px, rounded 6; a bold "x" inside | `style.css:3062-3063` |
| Opposite box | **not drawn by any Solve it card.** Build it's Boxes & Circles draws it in magenta `#b8508f` | `style.css:1342` |
| Light green ✓ | fill `#3aa76d`, border `#1b6e3a` | `style.css:2681` |
| Light red ✗ | fill `#d9534f`, border `#a3281b` | `style.css:2682` |
| Light neutral – | fill `#ececec`, ink border | `style.css:2683` |
| Light off | white, dashed `#9a9a9a` border, grey label | `style.css:2684, 2679` |
| Move button, greyed | `#dcdad2` fill, dashed `#6b685f` border, icon at reduced opacity | computed |

**Inconsistency worth knowing:** the two cards draw counters differently (Add: black marks, sign shown by a dashed box; Divide: green and magenta marks).

**Pieces at 3×** are in `shots/pieces/`: `add-seesaw-x-box`, `add-tray-plus-piece`, `add-seesaw-negative-group-hinted` (the dashed box, shown with its blue hint outline), `divide-counters-positive`, `divide-counters-negative` (boxes and a pile), the four light states, Solved for x green, all eight move icons, and the locked panel. No opposite box exists in Solve it to capture.
