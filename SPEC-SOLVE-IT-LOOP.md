# The Solve it loop: the shared structure every Solve it card follows  (Karl, 2026-10-18; revision 2.2, 2026-10-21; status: matches the live site plus Build I)

**Revision 2.2 (2026-10-21, Build I)** rewrites section 4, items 1-3: the check's first line is the equation itself, the line with the value sits under it (each value under the x it replaced), and picking the value up slides a faint copy of the equation into the check space. **Revision 2.1 (2026-10-20)** adds one rule to section 2B, "Never grey out what the question is about", and a line to the conformance checklist. **Revision 2.0 is a rewrite.** It replaces rev 1.2 (2026-10-12) to match what is built and what Karl decided in live testing (Builds A to D): no Guess x / Use a move choice, no banner, hover previews, spotlight feedback, the check beside the equation, one green button, grabbable terms, and tucked help. Sections 3, 7, 8 and 9 carry over almost unchanged. **Design direction ("the light design"):** fewer elements on screen; more space for the problem; no banner (only just-in-time pop-ups); during any feedback the screen greys out and only what matters is lit (for students, not teachers); previews of moves on mouseover; equations the student can manipulate, with previews built in.

**What this is.** One document for everything every Solve it card shares. **Each card is only problem-type configuration** (its moves, levels, forms, slips, scaffold pictures). **Precedence:** if a card spec and this document disagree on a shared rule, this document wins. Card specs open with "Follows `SPEC-SOLVE-IT-LOOP.md` rev 2.2." **Code mirrors this:** one shared loop; a card never re-implements it. Count it and Build it are separate and read-only; Solve it borrows their scaffolds through a thin adapter in its own code.

---

## 1. The loop in one page

Every problem is a series of **equation states**: the original, then the equation after each correct move.

```
STATE (x not alone)
 ├─ hover a move ─► grey ghost-row preview with dashed blanks ─► click ─► type the amount ─► green button
 │       ├─ helpful ─► new row written (under a rule line) ─► NEW STATE
 │       └─ unhelpful ─► spotlight pop-up, Undo pulses ─► Undo ─► hint pop-up ─► same STATE
 ├─ grab a term (drag / tap the minus) ─► grey preview of where it lands ─► drop ─► same as a move
 └─ type x = value (always live) ─► green button "Check" ─► the check (§4)
        ├─ balanced ─► green "Next"
        └─ not balanced ─► pop-up, Undo (pulses) ─► hint pop-up
x ALONE ─► `x =` is the last step, and the only place that blinks
```

### 1A. No choice, no banner
- There is **no "Guess x / Use a move" choice.** The `x =` field is **always live**, at every state, and never blinks except when x is alone.
- **The top banner no longer exists.** Every message is a **pop-up** (§2A). One-time first-problem pop-up: "Find the value of x."

### 1B. Guesses, the final value and the forced move
- A wrong value at any state is checked (§4) against the **current** equation if x is not alone, or the **original** equation if x is alone. Then Undo, then the hint pop-up (§6).
- **Correct value, any state:** the check ends Balanced; the green button reads **Next**.
- **Forced-move rule.** If the correct value came at the **first state with zero moves made**, the **next problem** is a forced move: everything greys out except the new problem and the moves panel, and a pop-up says "Your mental math is very strong. / Let's try solving this next problem using a move first." The needed move is ringed and pulses. The `x =` field is greyed until one move is made. The pop-up is dismissed by **Next** or by choosing a move. Hovering a move un-greys it and lights its preview. The following problem is free.
- If that guess was the last problem of a level, a sixth, move-only problem is added.

### 1C. Moves
- **Hover** (focus, or first tap on touch) on a move shows a grey ghost row with dashed blue blanks; **click** makes it solid; the student types **one** blank (mirrored on both sides, sign included, 0 refused), then the green button (**Go** word: "Do it"). The result is written under a **rule line**.
- **Cancelling** shows on x's side; the other side is left unsimplified until the student types the value.
- **Helpful move:** new row, new state. **Unhelpful move:** spotlight pop-up (§2A); Undo is the only exit. Illegal moves do not exist.
- **Undo** reverses the current move only. **Start over** wipes the stack; it is greyed on the untouched original; the stuck count survives it.
- **Divide it** takes one move, a **blank the student fills with a fraction** (`1/▢`), with the same preview as Add (decided 2026-10-18). Its failure feedback is the fraction cycle in `SPEC-DIVIDE-IT.md`.

### 1D. Grabbing terms (manipulable equations)
- **Reorder** a term by dragging; **cross the midline** to flip its sign and write both-sides work automatically (constants today; x when x is on both sides); **combine** by dropping a constant on another (both light, rest greys out, the word "Combine" over them, a box below for the typed sum; auto-combine at later levels is a flag, off); **tap a minus** to make it `+ −2` (needed before distributing); **distribute** by dragging the whole factor onto the parentheses.
- **While dragging:** a grey preview of the landing expression in place; the token is **green** (positive) and turns **red** over the midline with the new sign; the midline is thick and obvious and shown **only while dragging**; the destination side is tinted.
- **Dragging x** off an already-alone-on-the-left x gets the info pop-up "x is already on the left side of the equation. Let's keep x there. Try moving a number." Allowed when x is on both sides.
- Every drag has a tap or keyboard alternative; pointer events with a 6 px threshold; `touch-action: none` on grabbables.

---

## 2. The screen (bare, stable)

1. **Header and level dots:** shown for about 3 seconds at the start of each problem, then a thin strip; hovering the top brings them back.
2. **The solving space (left):** the equation, then rows of work (**older lines in lighter ink so the newest stands out**), then `x =` with **the one green button** to its right.
3. **The check space (right of the solving space):** empty until a value is checked (§4). No labels, a faint dotted line or space between.
4. **The moves panel:** a **narrow column of icons only** (44 px, spaced vertically). Hover shows the name and the preview; the pointer **approaching** (about 40 px) starts the preview early. **The lights** stay as a small collapsed column on the right: hover expands a goal. They are a curiosity, not a requirement.
5. **Help is tucked** into a corner: **I'm stuck** flashes gently after **10 s of no action**; **Teach me** appears only after a **second error** on the problem, and flashes when it appears. Start over lives in the same corner.
6. **Keyboard first.** No number pad on devices with a keyboard; on touch devices a compact keypad pops up only while a field is focused.

### 2A. Pop-ups (one component, one rule)
- **Placement:** below wherever the action is; if there is no room, the nearest free space that covers **no equation or work**. It may cover greyed-out things such as the `x =` field.
- **Spotlight (error) pop-up:** dims the page, lights the error, message beside it, **Undo pulses with a hopping arrow** (steady arrow under reduced motion) and is the only exit. **I'm stuck / Teach me are ignored while it is up.** After Undo, a **hint pop-up** (the reminder rung) appears.
- **Info pop-up:** no dimming; closes on the next action.
- **Nudges** with nothing to undo ("type a number") are small pop-ups beside the field.
- The word "still here" after a move that fails to cancel sits below the number it points to.

### 2B. Screen rules
- **One forward button.** **One big green button in exactly the same place on every screen** (right of `x =`). Only its word changes (Check, Next, Do it, Combine, Got it). Greyed when there is nothing to do. Enter presses it. No separate check mark.
- **Only one thing is lit at a time.** **No cursor or `x =` blinks** except the final `x =` step.
- **Nothing advances on a timer** except the problem-start header fade and the help-flash timers above.
- **Layout is stable;** no reflow when a row is added. **Phones are secondary:** Chromebooks and laptops first; every drag has a tap alternative.
- **Never grey out what the question is about.** Whatever the student is being asked about (the numbers in `−8 + 11`, the equation being solved, the two sides that failed to balance) stays at full strength and readable during any pop-up, spotlight or scaffold. Other things grey around it.
- **Answers:** one whole number typed into `x =` (or the blanks). The solved value is never displayed before the student types it.

---

## 3. The work stack in detail
*(unchanged from rev 1.2 except as noted)*

- **3A. Folding.** Only the current move shows full work; **Next** folds it to one row. **Undo reaches only the unfolded move.** Start over wipes the stack.
- **3B. Fit.** The generator reports the worst-case row count; Claude Code renders it at 1366×768 and 1366×650; if it fails, **fold more, never shrink text.** The check space (§4) uses the same reserved height.
- **3C. Highlighting each step.** The operation about to happen is coloured and **bold** (colour plus bold, never colour alone); its result appears in the same colour next line; one pair at a time; accent is unique (not green, red, blue or the added-amount colour). Never underline a row.
- **3D. The operation is blue** wherever it appears (prompts, pop-ups, rows, evidence).
- **3E. Work is shown at every step on every level**, evidence included.

---

## 4. Checking a value (side by side)

1. The student types a value in `x =` and presses the green **Check**. **Everything greys out except the original equation and the check space.** Pop-up: "Drag your value into each x." The typed value and every x blink. After 2.5 seconds with nothing done, a faint copy of the value travels from `x =` to the first x, again and again until the student acts.
2. **Drag the value onto each x** (every card). **Picking the value up** slides a faint shadow copy of the equation being checked into the check space, at the place its first line will take (the same faint look as the travelling value). **Dropping it on an x** makes the copy solid; **dropping it anywhere else** slides the shadow back and changes nothing. Multiple x's need a drop each, in any order; each filled x gets a small green check above it; the check is written once every x has the value.
3. **The check, top to bottom (Build I):**
   - **Line 1: the equation being checked, exactly as written**, every x in the same blue as the x in the original.
   - **Line 2, directly below it: the same equation with the value in each x's place**, the value in blue (in parentheses when negative, as the rendering rules below say). **Each value sits directly under the x it replaced**, so the blue pairs read "this x became this number." A value wider than x moves the rest of line 2, never the pairing; if the first value reaches left of where line 1 starts, line 1 moves right as a whole. Line 1 is never stretched or squeezed. *(Known limit, two x's only: when a number in front of the second x adds a "2 ×" to line 2, the second value can sit to the right of its x; no card has two x's yet.)*
   - **Then one operation per press of the green Next**, as before, ending **✓ Balanced** (green) or **✗ Not balanced** (red). A wrong value lights the last row and Not balanced.
   - **On the seesaw** (opened by I'm stuck or Teach me), the balance mirrors the check: the original equation with an empty x box while the value waits (line 1), the x box swapped for the box of counters when it lands (line 2), then each line's combining.
   - The check space has one more row than before: 4 rows at worst (line 1, line 2, one worked line, the mark) on Add to both sides and Divide it; rendered at 1366×768 and 1366×650.
4. **No text ever covers the equation.** The rendering rules carry over: negative values in parentheses; coefficients as ×; test cases `3x = −12`, −4 → `3 × (−4) = −12` · `−3x = 12`, −4 → `−3 × (−4) = 12` · `12 = −x`, −12 → `12 = −(−12)` · `7 = x + 3`, 4 → `7 = 4 + 3`.
5. **Wrong value pop-up:** "When x = 19, the equation is not balanced." (never "put 19 back into x"). Undo resets to before the guess.
6. **Collapse defaults** unchanged: single-step cards never collapse; multi-step cards full at L1–2, collapsed from L3; a wrong value always shows the full check.

---

## 5. The moves panel and lights

- **Full move list on every card**, unused moves greyed so the panel never changes shape: **Add ___ to both sides**, **Cross the border**, **Take a fraction**, **Multiply**, **Flip everything**, **Trade places**, **Distribute**, **Combine like terms**. Greyed moves say "That move unlocks on a later card." Moves are presented as **properties of equality** (the same rule on both sides).
- **Lights** are an unranked checklist by default, shown as small dots on the right; hover expands the goal. Add judges only **Fewer terms** and **Solved for x**. A legal move is never red. Lights drive messages and class-sheet tags whether or not they are displayed.
- **Solved for x** is green when x is alone (a card may refine it).

---

## 6. Help

**Principle:** every support is something the student **does**, and ends by sending them back to try. Nothing opens automatically except the post-error sequence (§2A) and the forced-move pop-up.

- **Hint pop-up after Undo (the reminder rung).** Lights the needed move with its hover preview and the suggested amount where it helps.
- **I'm stuck** (one rung per click, +1 stuck count): Model it / Choose the move / Guided; rungs restart at each new state; every rung gives the student something to do.
- **Teach me** is the same scaffolds on a forced path. On Add: pop-up "To cancel the +8 we add its opposite, −8, to both sides", **Add lit with its preview and the blank pre-filled**; the green button "Do it"; at x alone the Party/Battle bubble; then the counters walk if still stuck. It never writes the final value.
- **Party / Battle** (Karl's words): party = same signs join; battle = opposite signs, the bigger team wins. **The bubble always floats directly above the two numbers or counters in question, with everything else greyed out.** Afterwards the student crosses off opposite pairs (tap each counter or a whole box; automatic crossing allowed); **crossed-off counters stay visible** (struck through or faded) while the student counts what is left. Numbers over 12 use the big-number walk (no counters).
- **Misconception pop-ups by typed value:** typed the opposite of the number next to x (`x + 8 = …`, typed −8): "−8 is an important number, but it's not the value of x. It's what we add to both sides to find x." Then the hint lights Add with −8. Added the sizes (`−8 + 11` → 19, tag `sizes-added`): after Undo, Party/Battle above the operation. Cards may add one named misconception each.
- **Scaffold rules carried over:** a scaffold never blanks the stack; the picture stays until Next; every rung that has a picture shows it, including x alone with an unevaluated side; numeric levels offer no help.
- **Stuck count (teacher-visible):** per level, I'm stuck clicks and Teach me uses; anonymous scrambled ids only (hard district rule). The class sheet shows lights/goals per student (teacher view); words `hint`, `model`, `move`, `guided`, `crossoff`, `forced` and save-code meaning (v14) do not change.

---

## 7. Levels, numeric levels and the diagnostic
*(unchanged)* Five problems per level, no repeated answers; a new single-move card opens with a numeric level (no x, balance readout on) that can be skipped only after the diagnostic; combined-move cards have none. Save codes hold one bit per level; **displayed Solve it level numbers are one lower than saved** (Level 1 now goes straight to problems; "See why it works" is a button). Old levels map forward.

## 8. Generator rules (every card, every level)
*(unchanged)* Every problem verified by substitution in code; answers whole, never 0 or ±1; no repeated answers or equations within a level; at most 36 counters per side and 6 boxes (counters cap at 12 in Count it's help; Add goes to 15, over 12 uses the big-number walk); no accidental balances; slip collisions reported; required sign mixes per card; worst-case row count reported; lights computed on every state.

## 9. What a card spec must define
1. Task and move(s), with a worked example. 2. Levels and number ranges. 3. The move's picture and scaffold pictures. 4. Lights it judges. 5. Slips and misconception pop-ups. 6. I'm stuck rungs and Teach me where they differ. 7. Collapse levels and worst-case row count. 8. Banned answers. 9. Diagnostic and old-level mapping. 10. Open items. **A card that needs a new engine is a new shape in the scaffold registry, not a new loop.**

---

## Conformance checklist (every card, every level)
1. **No banner.** Every message is a pop-up placed under the action and never covering the equation or work.
2. **One green button,** same place, only the word changes; `x =` never blinks except at x alone.
3. **Hover preview** on every move; one blank; the amount shows in blue on both sides.
4. **Spotlight sequence** on every error: dim, light, message, Undo pulses with arrow, hint pop-up after.
5. **Check is side by side;** value dragged into every x; line 1 the equation, line 2 the value under each x; steps on Next; no text over the equation.
6. **Work shown** at every step; operation in blue; no underline under check rows.
7. **Scaffolds show pictures,** never blank the stack, give something to do, and Party/Battle sits at the numbers with the rest greyed.
8. **Layout stable;** fit test run; worst-case rows reported.
9. **Generator verified;** banned answers; collisions reported.
10. **Shared code:** pop-up component, row builder, check renderer, operation colour, scaffold adapter are shared, not re-implemented per card.
11. **Class-sheet words and save codes unchanged.**
12. **Nothing the question is about is greyed.** The numbers, equation or sides being asked about stay fully readable during every pop-up, spotlight and scaffold (§2B).

---

## Open items
1. **Colour pass** (magenta/green meanings, per-move colours): after Build D.
2. **Add onto the shared loop** (phases P2–P4 of the one-system architecture): next build after D; includes the scaffold classifier and registry.
3. **Divide it `1/▢` blank:** decided; to be built after D (spec the blank and its preview in `SPEC-DIVIDE-IT.md`).
4. **Required edits:** `SPEC-DIVIDE-IT.md` (rev 2.2 → 3.0: blank move, fraction-cycle feedback, no choice, hover preview); `SPEC-FLIP-IT.md` (rev 1.1 → 1.2: pop-up and side-by-side check); `SPEC-ADD-TO-BOTH-SIDES.md` rev 2.4 pointer; `SPEC-LIGHTS-EXPERIMENT-*` are now history.
5. **Opening the site to students** means removing the Netlify team login first, and an audit of progress loss after updates.
6. **Teacher data scope:** only stuck and Teach me counts, plus lights on the class sheet. Add count of first-state correct guesses?
7. **Move order** in the panel is parked.
