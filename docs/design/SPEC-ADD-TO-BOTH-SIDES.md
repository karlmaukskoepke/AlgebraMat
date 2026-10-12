# Add to both sides: solve `x + a = b` and `x − a = b` by adding the opposite to both sides  (Karl, 2026-10-12; status: designed, revision 2.3 "light build", third build review folded in)

Section: Solve it.   Prerequisite card(s): Combine it L2 (adding a positive and a negative). Replaces the old One-step L1-L2 and the old Switch sides card (see §9).

**Revision 2 replaces revision 1 (2026-10-11) and the build briefing of 2026-10-12.** It returns the card to the **light build**: a bare screen with two paths, and every scaffold held back until the student asks for it. Trade places and Cross the border are **no longer on this card** (each gets its own card).

## The light-build pattern (every Solve it card follows this; this card is the pilot)

1. **Bare screen:** one line, the equation with its work stack, the move list with its "Why?" boxes. Nothing else.
2. **One path per problem, chosen at the outset:** **Guess x** or **Use a move**. The path not chosen is greyed out. The choice is fixed for that problem.
3. **Scaffolds enter only from "I'm stuck" or "Teach me step-by-step".** Feedback on the student's own action (the line, a checkbox changing colour, Undo, the substitution check) is not a scaffold.
4. **Level 1 of every card is a numeric level** (numbers only, no x). It is a level, not a tutorial.
5. **The full move list is on every card of the unit.** Moves the card doesn't use are greyed out, so the play area never changes shape.
6. **The line is for actions only:** prompts, questions, buttons. **Everything else is the work stack** under it (the equation, each move made, each substitution check) and stays visible until the next problem.
7. **Nothing advances on a timer.** Every pause ends with a green **Next** ("Click here when ready").
8. **The layout is stable.** Nothing moves, redraws or reflows when a button is pressed.
9. **Every answer is checked by substituting it back,** shown in the work stack **line by line, one click per line** (a green Next each time), whether it is right or wrong and whichever path produced it. The last line is a **green, balanced** equation or a **red, unbalanced** one.
10. **After a correct guess, the next problem is a forced move.** After that move problem, the choice returns.
11. **Anything that is not an option right now is greyed out** (Check, Go, Undo, Start over, I'm stuck, Teach me, the `x =` box, unused moves). Nothing sits bold and live when it can't be used.
12. **No "?" button, no streaks, no Replay button, no steps bar.**

---

## 1. The task

**Example:** `x − 6 = 9`. The student chooses **Use a move**, taps "Add ___ to both sides", types **6** and presses Go. The work stack reads `x − 6 + 6 = 9 + 6`, the −6 and +6 on x's side cancel on their own, and the next row is `x = 9 + 6`. The right side is **not** simplified, so the student works out the Party and types **15** in the `x = [▁]` row of the stack. Check turns green, and under the stack the substitution appears in colour: `15 − 6 = 9  ✓ Balanced`.

**What they type:** one whole number, on the integer pad (digits and ±), into the `x = [▁]` row **inside the work stack** (not at the bottom of the screen). The student never types an expression. **The solved value is never displayed** before the student types it (the one exception is the watched L1 walkthrough, §3D item 6).

### The bare screen, top to bottom
1. **Header:** "Add to both sides · Level n" and five dots for the five problems.
2. **The line** (always at the top: a **colored box, full width, text and buttons centered inside it**). It holds **actions only**: the choice prompt, the next instruction, a question, a button (Next, Go, Undo...). See §3F.
3. **The work stack** (left, under the line): the equation, then each row of work beneath it, the `x = [▁]` row with **Check ✓** beside it, and the substitution check in colour (§3I). **Undo** sits directly under the stack.
4. **The move panel (right side; under the stack on a phone):** headings **Move** and **Why?**; each move is a row with its Why? boxes beside it; the last row is the uber-goal, **Solved for x**.
5. **The help row (permanent, at the bottom of the equation mat, above the divider and the pad):** **I'm stuck**, **Teach me step-by-step**, **Start over**. All three are always in the same place; each is greyed unless it is an option (**Start over** is live only after three red moves in a row).
6. **The number pad** at the very bottom of the screen.

**Not on the bare screen:** the seesaw, the "Balanced / Unbalanced" word, the counter tray, the "Add here" buttons, the steps bar, the "?" button, the Replay button. The first four are scaffolds (§4). The rest are retired.

### Choosing a path (decided 2026-10-12, third review)
At the start of every problem the line asks: **"Would you like to guess the solution (the value of x), or use a move to make the problem simpler?"** with two buttons, **Guess x** and **Use a move**. Until one is tapped, the `x = [▁]` row and the move list are both greyed out.
- **Guess x:** the `x = [▁]` row is live with a **blinking cursor**; every move is greyed. Tapping a greyed move says: "You're guessing this one. Type your guess."
- **Use a move:** the move list is live (tap one and it becomes the active move); the `x = [▁]` row is **greyed out and shows no cursor** until x is alone, when it goes live.
- **The choice is fixed for the problem.** A student who asks for help from guess mode (I'm stuck, Teach me) is moved into move mode. **Start over** returns to the choice.
- **Forced-move problem:** the problem after a correct guess has no choice. The line says **"Let's try solving this one using a move."** and the field stays greyed until x is alone.
- Both paths end with the same substitution check (§3I).

---

## 2. Levels (6, fixed; L1 is numeric)

Five problems per level, **no repeated answers within a level**. In every level with x, the coefficient of x is 1. "Party" = the added opposite lands on a same-sign number on the right. "Battle" = it lands on an opposite-sign number. All problems are generated by code and verified by substituting the answer.

| Level | Forms | Numbers | What's new | Working surface |
|---|---|---|---|---|
| **L1** | Numeric: `a + b = c + d` | whole numbers, results ≤ 15 | The balance. Adding the same to both sides keeps it; one side only upsets it (§3D). Ends with one guided `x + 3 = 5`. | The seesaw with number groups, **balance readout ON** (numbers only) |
| **L2** | `x + a = b` | a: 1-9. b: -9 to 12 | Add the opposite (−a) to both sides. Right side is a Party (negative answers) or a Battle (positive answers). | Bare screen |
| **L3** | `x − a = b` | a: 2-9. b: -9 to 12 | Adding a **positive** to cancel a negative. Battles with a negative b and positive answers. | Bare |
| **L4** | Mixed `x + a = b` and `x − a = b` | a: 2-9. b: -10 to 12 | Choosing the right opposite without being told the form. Answers positive and negative. | Bare |
| **L5** | x on the right: `b = x + a`, `b = x − a` (L4 forms mixed in) | a: 1-9. b: -9 to 12 | x on the other side of the border. | Bare |
| **L6** | All four forms | a: 1-14. b: -15 to 15 | Bigger numbers. | Bare |

**Form counts per level (required mix of the 5 problems)**
- **L1:** 2 "do" problems and 3 "quiz" problems, then one guided walkthrough with x (see §3D).
- **L2:** 3 Party (negative answers), 2 Battle (positive answers, or a negative answer such as `x + 5 = 2`).
- **L3:** at least 2 Battle with a negative b. At least 1 Party (b positive). Answers mix signs.
- **L4:** at least 2 of each form. At least 2 negative answers and 2 positive answers.
- **L5:** 3 x-on-the-right problems, 2 x-on-the-left. At least 2 negative answers.
- **L6:** at least 1 of each of the four forms. At least 2 negative answers.

**Do NOT make every answer positive.** Positive-only would let students skip the opposites and use mental math. Negative numbers in the problem are the reason the move is needed.

**Sample banks (answers checked by substitution; the generator must do the same automatically)**
- L2: `x+3=−6` → −9 · `x+4=−2` → −6 · `x+7=−5` → −12 · `x+5=2` → −3 · `x+6=10` → 4
- L3: `x−5=−2` → 3 · `x−3=−6` → −3 · `x−4=3` → 7 · `x−6=−1` → 5 · `x−2=−9` → −7
- L4: `x+8=3` → −5 · `x−7=−4` → 3 · `x−2=5` → 7 · `x+9=−1` → −10 · `x−4=−10` → −6
- L5: `7=x+3` → 4 · `−2=x−5` → 3 · `5=x+9` → −4 · `−8=x+1` → −9 · `6=x−4` → 10
- L6: `x+12=−3` → −15 · `−6=x−9` → 3 · `x−11=4` → 15 · `8=x+14` → −6 · `x+10=2` → −8

Note: in the design conversation `x − 5 = −2` was once spoken as having answer 5. It is **3**. Every bank must be generated and verified by code, not typed by hand.

**Old levels map forward** (so nobody re-earns): proposed map, to be confirmed by Claude Code from the real definitions: new L2 ← old One-step L1; L3 ← old One-step L2; L4 ← old Switch sides L1 and L2; L5 ← old Switch sides L4; L6 ← old Switch sides L3 and L4. Nothing earns L1 (the numeric level is new). See §9.

---

## 3. The model / picture

### 3A. The move list (the same on every card of the unit)
Rows, in this order (decided 2026-10-12): **Add ___ to both sides**, **Cross the border** (second, because it goes with the Fewer terms goal), **Take a fraction of both sides** (×⅓, ÷3), **Multiply both sides by ___**, **Flip everything**, **Trade places**, then **Distribute** and **Combine like terms** last (they act on one side of the equation, not both).
- On this card only **Add ___ to both sides** is active. The others are **greyed out**. Tapping a greyed move says in the line: "That move unlocks on a later card."
- The **Why?** boxes sit beside the active move. Greyed moves show no boxes (so the column stays short). The last row, **Solved for x**, is always visible.
- **Icons (proposed, not decided; see §3H).**
- **Size:** every move and its Why? boxes are in a **smaller font and smaller buttons**, **on one line each**. The **selected** move grows a little. Only a move that is waiting for input (a flashing amount) gets extra activity. Every other row stays quiet.

### 3B. Path B: use a move, in one action
1. In move mode, tap **Add ___ to both sides**; it becomes the active move. **Only now** does the blank show a **blinking cursor**, and **only now** does the row **Amount to add: [   ]** appear above the pad. No cursor blinks anywhere else.
2. **Type a number** with the pad (± toggles the sign). The amount 0 is refused ("Add a number that isn't 0"). The student may also **drag a number off the equation into the blank**; it copies the number and the student still chooses the sign.
3. Press **Go ▶**. **One action:** the work stack gets a row with the amount added to **both** sides at once, **the added amount in colour on both sides** (`x − 6 + 6 = 9 + 6`).
4. **The cancelling is shown.** The next row shows the pair on x's side visibly cancelling (struck through, then dropped), and reads `x = 9 + 6`. A partial cancel shows `x − 2`. **The other side is left unsimplified** so the answer isn't shown.
5. **Why? boxes are judged** after Go (§3E). When x is alone, the line says "x is alone. What is it? Type it.", **Solved for x** turns green, and the **`x = [▁]` row appears in the stack directly under `x = 9 + 6`**, live, with the blinking cursor. The student works the number out and types it. As soon as the typed text has a numeric value, **Check ✓ (beside the field) turns green and flashes** (§3G).
6. **Checking.** The substitution is written under the stack **line by line, one green Next per line** (`15 − 6 = 9`, `9 = 9`), ending in a **green `✓ Balanced`** for a correct value or a **red `✗ Not balanced`** for a wrong one. A correct value: the line says "Yes! x = 15, and it balances." and the last Next reads "Ready for the next problem". A wrong value: the slip message appears in the line (§5) and the row clears so the student retypes.
7. **An unhelpful amount.** If the amount does not meet **Fewer terms**, the box flashes (red if the move made things worse, grey if it changed nothing) and the line says: "That didn't give you fewer terms. Try adding the opposite of the number next to x." **Undo** is highlighted and the line adds: "Undo it and try a different number to add to both sides."
8. **The misconception to catch: zeroing the wrong side.** The student adds the opposite of the number on the side **without x**, making that side 0 (`x + 3 = −5`, add **5**). The work stack shows everything: `x + 3 + 5 = −5 + 5`, then `x + 8 = 0` (the −5 and +5 cancel on the right too, so the student sees the 0 they were after, and x's side shows `x + 8`). The line says: **"The right side is 0, but x isn't any more alone. Look at the left side."** **Undo** is highlighted. When the student presses it, the work stack returns to the equation, **the amount blank is cleared** (not pre-filled), the term next to x (**the +3**) is highlighted in the equation, and the line asks: **"What do we add to both sides to eliminate this?"** The correct amount (−3) is never given. This is tagged as its own slip (§5) and counts toward the three-red-moves Start over.

### 3C. Path A: guess x
- **Correct guess** (decided 2026-10-12, third review: **no walkthrough**). The work stack shows the guess, then the substitution **line by line, one click per line** (`x = 15`, `15 − 6 = 9`, `9 = 9`), ending in a **green `✓ Balanced`**. The line says "Yes! x = 15, and it balances." and shows the green **Next**. **The next problem is a forced move** ("Let's try solving this one using a move."). When that problem is solved, the choice returns.
- **Wrong guess.** Same line-by-line, click-per-line substitution, ending in a **red `✗ Not balanced`** (a green Next for each step). The equations read **down the screen, one line each** (guess 3 in `x − 6 = 9`):
  1. The line: "You guessed x = 3. This unbalances the equation." The guess slides onto x.
  2. `3 − 6 = 9`
  3. `−3 = 9`
  4. On **its own line, under the equations**: `✗ Not balanced`.
  5. The line highlights **Undo**: "Press Undo to take your guess back." The student clicks it. That click is the student seeing the error for themselves.
  6. **Automatically** the line changes to: **"Let's make the equation simpler first, and then find the solution."** and **Add ___ to both sides** is highlighted. The problem continues as a normal move (§3B), not as a walkthrough.
  - A wrong guess does not count as a stuck click. There is no "Put it back in" button, and the slip-naming messages of §5 do not appear on this path (they apply to a wrong value typed after a move).

### 3D. Level 1: the numeric level (the only level where the balance shows by default)
The screen shows numbers only: `4 + 1 = 2 + 3`, standing on a **seesaw** as groups of counters, with a big readout: **`5 = 5   Balanced ✓`**. The prompt is in the line. **Every item ends with a green Next ("Click here when ready").** Nothing advances on a timer. **The layout does not move**: the seesaw tilts, but the diagram, the buttons and the page do not redraw or shift when a button is pressed (build bug in the first build: pressing "Add to left" redrew the whole page). Five items, then one walkthrough:
1. **Do (+3):** the student taps **Add ___ to both sides**; the amount blank shows **+3 pre-filled the moment the move is highlighted**. They add it to the **left** (the button is highlighted: `8 ≠ 5   Unbalanced ✗`, the beam tips), then to the **right** (highlighted: `8 = 8   Balanced ✓`), then Go. Two actions here are the point of the level.
2. **Do (−2):** the same with a negative.
3. **Quiz:** "What happens if we **ADD 3 to ONE SIDE ONLY**? Does it keep the balance, or upset it?" (*Keeps the balance* / *Upsets the balance*.)
4. **Quiz:** "What happens if we **ADD 3 to BOTH SIDES**?"
5. **Quiz:** "What happens if we **ADD 3 to the LEFT and 2 to the RIGHT**?"
- **After either answer, right or wrong, the work stack shows what happened**, one line each, and ends with a Balanced or Unbalanced mark. For item 3: `4 + 1 = 2 + 3`, `4 + 1 + 3 = 2 + 3`, `8 = 5`, `✗ Unbalanced`. The line then says whether the guess was right ("Yes!" or "You said keeps. Look: it upsets the balance.") and the green Next appears. (Whether a wrong answer is retried: §9.)
6. **Final walkthrough (a watched demonstration, not a problem; no typing). Nothing is erased: every step stays on screen.** `x + 3 = 5` on the bare screen with a **balance indicator at the top** and the note **"We don't know x yet, but the = sign tells us both sides are balanced."** Each animation plays, then waits for a click on the one highlighted target:
   - (a) Highlighted: **Add ___ to both sides**.
   - (b) **−3 is pre-filled the moment the move is highlighted.** Highlighted: **Go**. The work stack adds `x + 3 + −3 = 5 + −3`, the −3 in colour on both sides.
   - (c) **Next:** the +3 and −3 on x's side cancel (struck through) and the stack adds `x = 5 + −3`. The Why? boxes go green (**Fewer terms**, **Solved for x**).
   - (d) **Next:** the stack adds `x = 2`. Line: **"Now we have x = 2."** (This is the **only place the value is shown for the student**, because they are watching a demonstration.)
   - (e) **Next:** under the stack, in colour: **"Let's plug x = 2 back in:"** `2 + 3 = 5`, `✓ Balanced` and "2 is the amount that makes it balance."
   - Takeaway in the line: **"Adding to both sides can make the problem simpler."** Then a green Next moves to L2. **No sixth dot:** the header shows the five dots, then the label "Walkthrough". The Move/Why? panel is visible with **only Add active** (decided), so the play area is the same shape at every level.
   - **Build bug to fix:** at the end of L1 a dashed vertical line (an artifact) appears by the = sign and **stays on screen into L2**. Remove it, and make sure no L1 element survives into the next level.
- Amount 0 is never accepted. No item may balance by accident (the generator checks).
- "I'm stuck" and "Teach me" are not offered on this level.
- Number choices change each time (the shape is fixed; the numbers vary and are verified).
- **Directed walkthrough:** in every guided item the line says what to do and **only the one next place to click is highlighted** (a pulsing outline). **No cursor blinks** except in a field the student is about to type in, and none between items.

### 3E. The Why? boxes (green ✓ / red ✗ / grey –), judged only after Go
| Box | Beside | Rule |
|---|---|---|
| **Fewer terms** | Add ___ to both sides | Judged on **x's side only** (changed in 2.3; see §9). **Green** if x's side has fewer terms. **Red** if x's side has more terms **or the number next to x got bigger in size** (e.g. `x + 3 = −6` plus +3 gives `x + 6`). **Grey** if neither. (This keeps "zero the other side" from lighting up green; that move gets its own message, §3B step 8.) |
| **Solved for x** | bottom of the panel (uber-goal) | **Green** when x is the only term on its side (either side). The student still types the value. |

- Only these two boxes appear on this card. Size, fraction and "no opposite box" boxes arrive on later cards.
- Because the light looks only at x's side, it never depends on the unsimplified side, and the screen never shows the combined value.

### 3F. The line (actions only)
Always the same spot, above the work stack, one sentence at a time (the newest replaces the old). **It holds only what the student must read and act on:** the choice prompt; the next instruction ("Add the opposite of the number next to x."); a question ("What do we add to both sides to eliminate this?"); the result of their last action in a sentence ("Yes! x = 15, and it balances."); the buttons (Guess x, Use a move, Next, Undo). **It does not hold the work.** Equations, the substitution and the checks go in the work stack (§3I).

### 3G. Always say where to click (Go, Undo, Check, Next)
Whenever the next step is a button, **that button is the one highlighted**, and only one thing is highlighted at a time.
- **Go ▶:** green and flashing, when an amount is in the blank.
- **Undo:** a pulsing outline, after an unhelpful move or a wrong guess.
- **Everything else is greyed out when it can't be used** (Go until there is an amount, Undo until there is something to undo, Check until a number is typed).
- **Check ✓ (decided):** greyed out until the typed text has a numeric value, then green and flashing **as soon as the typed text has a numeric value**. A lone **−** does not trigger it; **−5** does. Same on both paths. It sits beside the `x = [▁]` row.
- **Next:** green, labelled "Click here when ready" (or "Ready for the next problem" between problems). **It is the only way to move forward. Nothing advances on a timer**, because a student may still be reading.

### 3H. Move icons (proposed; Karl's idea, not yet decided; see §9 item 18)
One small pictogram per move, beside the label, in a fixed template: the equation shape in grey, the part that changes in colour (outside numbers in blue, matching the ⅓ on the fraction button).
| Move | Icon |
|---|---|
| Add ___ to both sides | `[ ] = [ ]` with a `+ ▢` dotted box on each side |
| Cross the border | `▢ + n = ▢` with an arrow carrying `+n` over the = and landing as `−n` |
| Take a fraction of both sides | `1/n ( ▢ ) = 1/n ( ▢ )`, the fractions in blue |
| Multiply both sides by ___ | `n ( ▢ ) = n ( ▢ )`, the n in blue |
| Flip everything | `−x = n` with an arrow to `x = −n` |
| Trade places | `▢ = ▢` with a curved arrow carrying the left box over the = to the right, and back |
| Distribute | `n ( ▢ + ▢ )` with arrows from the n to each box |
| Combine like terms | `2x + 3x = 5x` |
Rules if adopted: icons are about 24 px and sit in the row without making it taller; the full-size picture appears only for the selected move or a tapped greyed move, in the line's space; every icon has a text label so nothing depends on the picture.

### 3I. The work stack (everything that is not an action)
The left column under the line. **Rows are added beneath the equation as the work happens and are never erased until the next problem.** Undo removes only the rows of the last action. This is also where checking the work goes: the substitution is always written **under the problem**, in colour, like an annotation (green `✓ Balanced`, red `✗ Not balanced`), never inside the line.

Move path, `x − 6 = 9`:
```
x − 6 = 9
x − 6 + 6 = 9 + 6      (the added 6 in colour on both sides)
x = 9 + 6              (the cancelled pair struck through above)
x = [▁]                (live; Check beside it)
-- after Check --
x = 15
15 − 6 = 9   ✓ Balanced
```
Guess path: the equation, `x = [guess]`, the substitution lines, then the Balanced or Not balanced mark. **Build note:** reserve room for about seven rows so the page never shifts as rows appear (scroll inside the column if more).

---

## 4. Supports (the ladder)

**Principle:** supports are things the student **does**, not steps they watch. Every support ends by sending the student back to the answer line. **Nothing opens automatically**, with one exception Karl chose: a wrong guess is followed by the substitution (stepped by clicks), Undo, and a direction to the move (§3C). The scaffolds below are the existing build (the seesaw, the tray, the two-action move, the combining ritual), now held back until asked for.

**Asking for help from guess mode** moves the problem into move mode (the `x = [▁]` row greys out), because the scaffolds are about moves.

### "I'm stuck" (just-in-time, one rung at a time; each click = +1 stuck count per level)
- **Rung 1: Model it.** The seesaw appears with the equation standing on it as counters, with the tray, and the **balance word** ("Balanced ✓ / Unbalanced ✗") turns on. In L2-L3 the board starts **empty** and the student builds the equation by dragging □, + and − up from the tray (tap alternative: tap a piece, then a side). In L4-L6 it arrives pre-built. The number next to x is highlighted: "Which number would cancel the +3?" Ends with "Do you know x now?" and the pad.
- **Rung 2: Choose the move.** "Add ___ to both sides" opens in its **two-action form**: type an amount, add it to one side (the beam tips, "Unbalanced: the right side is heavier by 9"), then add the same to the other side (the beam levels), then Go. Then **combine the groups**: tap two groups on a side, choose **Party!** or **Battle!**, and type how many are left. "Cross off for me" strikes the cancelling pairs but the student still types the count.
- **Rung 3: Guided amount.** The correct amount is pre-filled ("−3 cancels the +3. Add it to both sides yourself.").

### "Teach me step-by-step" (guided walkthrough)
The same scaffolds on a **forced path**: model on, the move opened in its two-action form, **only the correct amount accepted**. The student still performs every action (add to one side, add to the other, Go, combine the groups) and types the answer. It counts as a Teach me use.

### When a scaffold ends
Scaffolds stay on until the problem ends. The next problem starts bare again. If the student asks for help mid-problem, the scaffold **redraws the current equation, including any moves already made** (the unsimplified side shows as separate groups).

### Wrong-move handling (a move that is red or grey)
1. **Every red or grey move:** the line says what happened (see §3B step 6) and **Undo** is highlighted, so the student takes the move back and tries a different number. Nothing else opens by itself.
2. **Three red moves in a row:** **Start over** appears and the line adds: "Try I'm stuck." The menu is never narrowed to the correct move.

### Stuck count (teacher-visible)
Per level: number of **I'm stuck** clicks and **Teach me** uses. Anonymous (scrambled id only). No other behavior data is recorded for this card (see §9).

---

## 5. What a wrong answer looks like (the slips)

Typed-answer slips (a wrong value typed **after a move**, when x is alone). They do not appear after a wrong first guess (§3C), where the sequence is substitution, Undo, "make the equation simpler first". Each wrong answer is **tagged** by recognizing which mistake produces that exact answer. Messages are built from the equation (`con` = the number next to x, `opp` = its opposite). Examples are checked by code.

| Slip | Example → wrong answer | Message the student sees (in the line) | After a wrong answer |
|---|---|---|---|
| **Added the same number instead of its opposite** (b + a) | `x+3=−6` → **−3**; `x+4=−2` → **2** | "Put −3 back in for x and it doesn't balance. The +3 next to x needs its **opposite** to cancel: add −3 to both sides, not +3." | Substitution shown; the student retypes |
| **Ignored the number next to x** | `x+3=−6` → **−6** | "Put −6 back in for x: −6 + 3 = −3, not −6. What's still hiding next to x?" | Substitution shown; the student retypes |
| **Right size, wrong team / sign dropped** | `x+4=−2` → **6** (correct −6); `x+5=2` → **3** (correct −3) | Party: "Right size, wrong team. Check the sign." Battle: "Battle! −5 and +2 fight, and the bigger team wins. Which team has more?" | Substitution shown; the student retypes |
| **Added the sizes of opposite numbers** (a Battle treated as a Party) | `x−5=−2` → **7** (correct 3); `x−3=−6` → **9** (correct −3) | "+5 and −2 are opposites, so it's a **Battle**, not a Party. Take the bigger side's sign." | Substitution shown; the student retypes |
| **Moved a term across without switching teams** (x on the right) | `7=x+3` → **10** (correct 4) | "The 3 changed sides but stayed +3. Put 10 back in: 10 + 3 is not 7." | Substitution shown; the student retypes |
| **Added the wrong opposite to the right** | `x−5=−2` → **−7** | "That's −5 on the left, which makes it −10, not a cancelled pair. To cancel a −5, add the opposite." | Substitution shown; the student retypes |
| **Anything else** | | "Cancel the +3 with its opposite, −3, on both sides." | Substitution shown; the student retypes |

Move slips (Path B, judged by the Why? boxes):

| Slip | Example | What happens |
|---|---|---|
| **Adds the same sign as the number next to x** | `x+3=−6`, add +3 → `x + 3 + 3 = −6 + 3` | Fewer terms **red**. Line: "That didn't give you fewer terms. Try adding the opposite of the number next to x." Undo offered. |
| **Adds a partly cancelling amount** | `x+3=−6`, add −5 → `x + 3 + −5 = −6 + −5` (x's side shows `x − 2`) | Fewer terms **grey**. Line: "The +3 is still there, partly cancelled. What would cancel it all?" |
| **Zeroes the side without x** | `x+3=−5`, add 5 → `x + 3 + 5 = −5 + 5`, `x + 8 = 0` | Fewer terms red (or grey if x's side didn't grow). Line: "The right side is 0, but x isn't any more alone. Look at the left side." **Undo** highlighted. After Undo: amount cleared, the number next to x highlighted, "What do we add to both sides to eliminate this?" (§3B step 8) |
| **Adds 0 or nothing** | Go pressed with an empty or 0 blank | Go disabled / "Add a number that isn't 0." |

Scaffold-only slips (the existing build; judged by the beam and the combining ritual): adding to one side only (the beam stays tipped, Go stays disabled: "Both sides must hold the same amount"); a counter of the wrong sign dragged in; a wrong Party/Battle pick; adding the sizes of opposite groups when combining ("The pairs cancel. Count what is left").

---

## 6. Words

Reuse the printed notes' words: **box, counters, border, Party!, Battle!, cancel pairs, add the opposite, balance, check**. We never say "take away from both sides" or "subtract from both sides"; the menu reads **"Add −3 to both sides."**

New or changed:
- **Move** and **Why?**: the two column headings of the right-hand panel ("Strategies" is retired).
- **Fewer terms**: the first Why? box. **Solved for x**: the uber-goal at the bottom (replaces "x alone"/"Box alone" on this card).
- **Trade places** and **Cross the border** are listed (greyed) but belong to their own cards. "Trade places" never means "flip"; "flip" is reserved for signs.
- The old card name **"Switch sides" is retired.** The printed notes still say "A · Switch sides" for the border-crossing move; see §9.

---

## 7. Edge cases and limits

- **Answer never 0.** b is never 0. A problem is never already solved. No repeated answers or equations within a level.
- **Size limits:** all numbers |n| ≤ 15 (a ≤ 14); at most **36 counters per side** in a scaffold; one box.
- **Amount 0** is never accepted.
- **Cancelling is shown** (struck through, then dropped) on x's side only; the other side stays unsimplified until the student types the value. A partial cancel (`x − 2`) is shown simplified on x's side.
- **No screen or message ever shows the solved value** (`x = 3`) before the student types it. The one exception is the watched L1 walkthrough (§3D item 6). The checkbox counts terms as if the right side were combined.
- **Undo** always reverses one whole move.
- **Greyed moves** can be tapped (the line says they unlock later) but never act.
- **Guess and move mixed:** a student who guesses wrong and then uses a move gets the move normally; the guess has no penalty.
- **Scaffold redraw** mid-problem (§4) must reproduce the current equation exactly, including an unsimplified side.
- **Slip collisions:** the generator must confirm no slip's wrong answer equals the correct answer, and report problems where two slips share a wrong answer (pick one message).
- **Automated check:** every generated problem is verified by substituting the answer. No hand-typed banks.
- **Numeric level (L1):** no item may balance by accident; quiz answers are shuffled; nothing outside the five-item shape is shown.
- **The layout never shifts** when a button is pressed or a row is added (§3I build note). No element from one problem or level survives into the next.
- **Path is fixed per problem.** Start over returns to the choice. A problem solved by a correct guess counts as solved.
- **A correct guess owes one move problem.** If the correct guess was the last problem of a level, a sixth, move-only problem is added (decided).
- **Phones are secondary.** Chromebooks and laptops first; keep every drag with a tap alternative (many Chromebooks are touch).

---

## 8. Diagnostic

- Sample: **one L3-type problem** (`x − a = b`, Battle) and **two L6-type problems** (one x-on-the-left, one x-on-the-right), nothing marked until the end.
- Proposed results: L3-type wrong → opens **L1-L3**. L3 right and an L6 wrong → **L1-L5**. Both L6 right → **L1-L6**.
- **L1 (numeric) is not earned by old progress. It can be skipped, but only after the diagnostic** (decided 2026-10-12): a student whose diagnostic result clears the skip threshold (§9) sees L1 marked "skipped" and L2 open; they can still play it (a replay is just L1 again). Everyone else plays L1 first. Other levels: a diagnostic *opens* levels; students still play them.

---

## 9. Decided and open

**Decided (2026-10-12):**
- Solved for x is green when x is alone, before the value is typed.
- Move order: Add, Cross the border, Take a fraction, Multiply, Flip everything, Trade places, Distribute, Combine like terms.
- Check turns green and flashes on the first numeric value typed ("−" alone does not; "−5" does).
- **Path chosen at the outset** (Guess x or Use a move). Guess mode: field live with a blinking cursor, moves greyed. Move mode: moves live, field greyed until x is alone.
- **Correct guess:** substitution and "correct" in the work stack, a green Next, **no walkthrough**. The next problem is a **forced move**; after it the choice returns.
- **Wrong guess:** equations read down the screen, `✗ Not balanced` on its own line, stepped by clicks, then Undo, then "Let's make the equation simpler first", then a normal move. No slip-naming message.
- **The line is for actions only.** Work and substitution checks go in the work stack under the problem and stay until the next problem.
- **The `x = [▁]` row lives in the work stack**, not at the bottom of the screen.
- **Nothing advances on a timer.** Every pause ends with a green Next.
- **Layout is stable.** No redraws.
- **Zeroing the side without x** is caught specifically (§3B step 8): shown, Undo, amount cleared, the term next to x highlighted, "What do we add to both sides to eliminate this?" This settles the old unfinished-sentence question: the prompt is to add the opposite of the number next to x.
- **Substitution (right or wrong, either path, and a typed value after a move):** line by line, one click per line, ending in a green Balanced or a red Not balanced.
- **Help row:** I'm stuck, Teach me and Start over live together, permanently, at the bottom of the equation mat above the pad. **Everything not available is greyed out.**
- **L1 can be skipped, but only after the diagnostic.**
- L1: +3 or −3 pre-filled as soon as the move is highlighted; the quiz asks in capitals (ADD 3 to ONE SIDE ONLY); every quiz answer shows the substitution; the walkthrough keeps every step on screen and ends by plugging x = 2 back in; Move/Why? panel stays, only Add active; replay is the same L1; the stray dashed line is a bug.

**Decided (continued):**
- **Last problem was a correct guess:** a sixth, move-only problem is added, so every level has at least two moves.
- **L1 quiz:** no retry. A wrong answer gets the evidence and Next.
- **Check** sits beside the `x = [▁]` row in the work stack; the pad and I'm stuck / Teach me stay at the bottom.
- **Path is fixed per problem.** No changing your mind.

**Open:**
1. **Skip threshold.** Proposal: L1 is skipped when the diagnostic's L3-type problem is right (results L1-L5 or L1-L6); a wrong L3-type problem plays L1 first. Note the cost: skipping loses the walkthrough that introduces the move. OK?
2. **Start over** returns to the choice (my assumption).
3. **Why? boxes for greyed moves.** Hidden now. Show them as faint outlines?
4. **Red for a worse move.** Keep red, or neutral plus the message?
5. **Old-level mapping and diagnostic thresholds** (§2, §8) are proposals. Claude Code must read the real old definitions.
6. **Printed notes.** Rename "A · Switch sides"; add "Trade places" and "Cross the border" when those cards exist.
7. **Teacher data.** Only stuck and Teach me counts today. Worth also counting guess-vs-move choices and correct first guesses?
8. **Progress loss after site updates.** On the audit list before rollout.
9. **Move icons (§3H).** Adopt?

---

## Appendix: changes to the build (from the 2026-10-12 briefing)

- **Hide until scaffolded:** seesaw, balance word, counter tray, the "Add here" side buttons, the combining ritual (Party/Battle tap and count), the two-action move. All of these become **scaffold mode**, turned on by I'm stuck rung 1 or Teach me.
- **Remove:** the steps bar, the "?" button, the Replay button, the Tutorial step, the "Build it" step as a default, the faded move panel while simplifying, the automatic counters on a second red move, the L5 one-tap button (the bare move is already one action).
- **Move to their own cards:** Trade places and its tutorial, Cross the border and its tutorial, the `4 = x` convention nudge. L6 (Cross the border) is gone from this card; the card is numeric + five levels.
- **Change:** the prompt line moves to the top, above the equation, highlighted, and carries all messages; the move is one action with automatic simplifying on x's side; the right panel gets the **Move / Why?** headings and the full greyed move list; **Solved for x** is the uber-goal; a correct guess shows the substitution and forces the next problem to be a move (2.3: no walkthrough); a wrong guess animates the substitution under the equation and steps by clicks, then Undo, then the move is highlighted (no "Put it back in").
- **Add:** the numeric level L1 (§3D), the Guess x / Use a move buttons (§1).
- **Changes from the first build review (2026-10-12):** (L1) highlight only the next place to click; the blinking cursor and the "Amount to add" row appear only after the move is selected, and no cursor blinks between items; add the final guided `x + 3 = 5`. (L3) center the line's text and buttons and remove unused space; delete "Put it back in"; a wrong guess shows the substitution, then "make the equation simpler first", then the move; show the added amount in colour on both sides and show the cancelling (struck through); an unhelpful amount highlights Undo; Check turns green and flashes when it is time to check. (Move menu) smaller font and buttons on one line each; the selected move grows; Cross the border second; Distribute and Combine like terms last.
- **Changes from the second review (2026-10-12, revision 2.2):** the L1 walkthrough becomes a watched demonstration with a balance indicator and ends with the value and the substitution check; a wrong guess is animated and stepped by clicks (guess named, substitution, Undo, "make the equation simpler first"); Check triggers on the first numeric typed value; Trade places position confirmed; icons proposed (§3H).
- **Changes from the third review (2026-10-12, revision 2.3):** (L1) pre-fill the amount when the move is highlighted; stop the page redrawing when Add to left/right is pressed; ADD...ONE SIDE ONLY in capitals; show the substitution after every quiz answer; green Next instead of auto-advance everywhere; the walkthrough keeps every step and ends with the plug-back-in check; remove the stray dashed line that survives into L2. (All levels) choose Guess x or Use a move first, with the other path greyed; the `x = [▁]` row moves into the work stack; the line holds actions only and the substitution check goes under the problem; a correct guess shows the substitution and forces the next problem to be a move; a wrong guess lists the equations down the screen with "Not balanced" on its own line; catch and name the zero-the-other-side misconception; Fewer terms counts x's side only.
- **Changes from the fourth pass (2026-10-12):** substitution is always line by line, one click per line, ending green-balanced or red-unbalanced; I'm stuck / Teach me / Start over become a permanent help row at the bottom of the equation mat; anything not available is greyed out (Check was bold when idle); L1 skippable only after the diagnostic.
