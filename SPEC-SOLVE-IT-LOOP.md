# The Solve it loop: the shared structure every Solve it card follows  (Karl, 2026-10-12; revision 1.1; status: designed; 1.1 adds the conformance checklist, §3D-3E and the renderer rule after the first Divide it test)

**What this is.** One document for everything every Solve it card shares: the screen, the choice, the moves loop, the checks, the help row, the scaffolds and the generator rules. **Each card spec follows this document and says only what is specific to that card** (its move, levels, forms, slips, lights, scaffold pictures).

**Precedence.** If a card spec and this document disagree on a shared rule, **this document wins**. If this document changes, every card spec is checked against the new revision. Each card spec opens with: "Follows `SPEC-SOLVE-IT-LOOP.md` rev N."

**Code structure should mirror this.** Build one shared loop (choice, forced-move rule, substitution, Undo, help row, work stack, scaffold ladder). Each card *configures* it with its moves, levels, generator, slips, lights and scaffold pictures. A card should never re-implement the loop.

**Supersedes** the "light-build pattern" in `SPEC-ADD-TO-BOTH-SIDES.md` §0 and any conflicting line in that spec up to revision 2.3 (see "Required edits to existing specs" at the end).

---

## 1. The loop in one page

Every problem is a series of **equation states**: the original equation, then each simplified equation after a correct move.

At **every state in which x is not yet alone**, the line asks: **"Would you like to guess the solution (the value of x), or use a move to make the problem simpler?"** with two buttons, **Guess x** and **Use a move**.

```
STATE (x not alone) ──► Guess x ──► type value ──► substitution
                    │                               ├─ correct ──► DONE (see 1B)
                    │                               └─ wrong ───► Undo ──► forced simplifying move
                    └─► Use a move ─► move
                                      ├─ helpful ───► simplified equation written ──► NEW STATE (choice returns)
                                      └─ unhelpful ─► red/grey light, Undo ──► same STATE (choice shown again)

x is ALONE (after a move) ──► no choice: the x = [▁] row goes live ──► type value ──► substitution ──► DONE
```

### 1A. The choice
- **Until a button is tapped,** the `x = [▁]` row and the move list are both greyed out.
- **Guess x:** the `x = [▁]` row is live with a **blinking cursor**; every move is greyed (tapping one says: "You're guessing this one. Type your guess.").
- **Use a move:** the move list is live. The `x = [▁]` row is **greyed out, with no cursor,** until x is alone.
- **The choice is fixed for the current state, not for the whole problem.** After a correct move the new state offers the choice again.
- **Asking for help from guess mode** (I'm stuck, Teach me) moves that state into move mode (the `x = [▁]` row greys out).
- **The prompt and both buttons are identical at every state.** The prompt text above, with **Guess x** and **Use a move**, comes from **one shared string and one shared component**. No state may reword it ("guess again", "use a step") or show buttons that do nothing. Both buttons always work, and each leads to the same guess mode or move mode every time.
- **Guessing at every state is allowed and intended.** Mental math is valued; moves are still practised through the forced-move rule (1B).

### 1B. Guesses and the final value
**A wrong guess at any state:**
1. The guess is substituted into the **current** equation (the equation on screen at that state, not the original), stepped line by line, ending in a **red `✗ Not balanced`** on its own line. *Why: earlier moves were correct, so the current equation is equivalent and enough.*
2. The line highlights **Undo** ("Press Undo to take your guess back."). The student's click is the student seeing the error.
3. Automatically, the line becomes **"Let's make the equation simpler first, and then find the solution."** and the card's next needed move is highlighted. The state continues as a normal move (§1C), not a walkthrough.
4. A wrong guess is not a stuck click and gets no slip-naming message, except where a card spec names one specific misconception (e.g., Flip it).

**The final value** (a correct guess at any state, or any value typed once x is alone):
- It is substituted all the way back into the **original** equation, shown in the work stack, ending in a **green `✓ Balanced`** (correct) or a **red `✗ Not balanced`** (wrong). The line says "Yes! x = 15, and it balances." with a green **Next** ("Ready for the next problem").
- **A wrong value typed after a move** (x alone): the full substitution into the original is shown, then the card's slip message appears in the line (cards define the slips), and the row clears so the student retypes.
- **Forced-move rule.** The next problem is a **forced move** (no choice; the line says "Let's try solving this one using a move.") **only when the correct guess came at the first state with zero moves made.** A student who made a move on the problem gets a free choice next. After the forced-move problem the choice returns.
- **If that correct guess was the last problem of a level,** a sixth, move-only problem is added, so every level has at least two moves.
- A problem solved by a correct guess counts as solved.

### 1C. Moves
- **A move is one action** in the bare screen: select the move, type an amount if it takes one (± toggles; 0 is refused), press **Go ▶**. Both sides update at once; the amount shows in colour on both sides.
- **Cancelling is shown** on x's side (struck through, then dropped). **The other side is left unsimplified** until the student types the value, so the answer is never shown. Partial cancels show simplified on x's side. Intermediate (non-final) steps may be evaluated.
- **Why? boxes are judged only after Go** (§5).
- **Helpful move:** the simplified equation is written out as a new row, and the **choice returns** (§1A). If x is now alone, there is no choice: the `x = [▁]` row goes live with the cursor, **Solved for x** turns green, and the line says "x is alone. What is it? Type it."
- **Unhelpful move** (a Why? light red, or the expected green does not turn on): the box flashes (red if worse, grey if no change), the line says what happened, and **Undo** is highlighted. **Illegal moves do not exist.** **Undo returns to the same state with the choice shown again.**
- **Three red moves in a row:** the line adds "Try I'm stuck." (There is no other consequence; Start over no longer depends on it.)
- **Undo reverses only the current, uncollapsed move.** Nothing is reversible after the student clicks **Next**, which commits the move and folds it (§3). Going back further is **Start over**.

### 1D. Start over
- **Always live,** except it is **greyed on the original, untouched equation** (nothing to wipe). It goes live the moment the student does anything.
- It **wipes the work stack and returns to the original equation with the choice showing.**
- **The stuck count survives a restart** (it is teacher data). No other record changes.

---

## 2. The screen (bare, stable, top to bottom)

1. **Header:** "<Card> · Level n" and five dots for the five problems.
2. **The line:** always at the top; a **colored box, full width, text and buttons centered inside it.** It holds **actions only**: the choice prompt, the next instruction, a question, a one-sentence result, and buttons (Guess x, Use a move, Next, Undo, Go). One sentence at a time; the newest replaces the old. **It does not hold work.**
3. **The work stack** (left, under the line): the equation, each row of work beneath it, the `x = [▁]` row with **Check ✓ directly under it** (decided 2026-10-12; the pilot spec said "beside", and the built Divide it already has it under), and the substitution check in colour. **Undo** sits directly under the stack. **Rows are added as the work happens and stay until the next problem** (or Start over). Everything that is not an action lives here.
4. **The move panel** (right; under the stack on a phone): headings **Move** and **Why?**; each move is a row with its Why? boxes beside it; the last row is the uber-goal, **Solved for x**.
5. **The help row (permanent, bottom of the equation mat, above the pad):** **I'm stuck**, **Teach me step-by-step**, **Start over.** Always the same place; each greyed unless it is an option.
6. **The number pad** at the very bottom.

**Not on the bare screen:** the seesaw, the "Balanced / Unbalanced" word, the counter tray, the "Add here" buttons, the combining ritual (all scaffolds, §6). Retired everywhere: the "?" button, streaks, the Replay button, the steps bar, "Put it back in".

**Screen rules**
- **Nothing advances on a timer.** Every pause ends with a green **Next** ("Click here when ready").
- **The layout is stable.** Nothing moves, redraws or reflows when a button is pressed or a row is added. No element from one problem or level survives into the next.
- **Anything not an option right now is greyed out** (Check, Go, Undo, Start over, I'm stuck, Teach me, the `x = [▁]` box, unused moves). Nothing sits bold and live when it can't be used.
- **Always say where to click.** When the next step is a button, that button is the one highlighted, and **only one thing is highlighted at a time.** Go: green, flashing, when an amount is in the blank. Undo: pulsing outline after an unhelpful move or a wrong guess. **Check ✓:** grey until the typed text has a numeric value, then green and flashing as soon as it does (a lone "−" does not; "−5" does). **Next:** green. No cursor blinks anywhere except a field the student is about to type in.
- **Answers:** one whole number, typed on the integer pad (digits and ±) into the `x = [▁]` row **inside the work stack.** The student never types an expression. **The solved value is never displayed before the student types it** (a card's watched numeric walkthrough is the only exception, if the card spec says so).
- **Phones are secondary.** Chromebooks and laptops first. Every drag has a tap alternative (many Chromebooks are touch).

---

## 3. The work stack in detail

### 3A. Folding (decided: option C)
- **Only the current move shows its full work.** When the student clicks **Next** after a correct move, that move **folds to one row** (e.g., `−2 both sides → 3x = 12`). History stays visible; it is just compact.
- **Undo reaches only the current, unfolded move.**
- **Start over wipes the stack.**

### 3B. Fit (required)
- **The generator reports the worst-case row count** for every card's problem forms (including the check).
- **Claude Code renders that worst case** at a common Chromebook size (1366×768 as a first test; also check the students' real devices) at the large, bold text the design uses. **The number pad and help row must stay visible with no page scroll.**
- **The stack's height is reserved up front** for the worst case. Rows compress inside it, so nothing below ever moves.
- **If a card fails the test, the fix is more folding, never smaller text.**

### 3C. Highlighting each step (new)
- In every substitution and every simplification, **the operation about to happen is coloured and underlined in the line before; in the next line its result appears in the same colour, and the earlier highlight fades.** One pair at a time, so the eye follows one change down the stack.
- **One operation per click**, in order-of-operations order, left to right on ties.
- **Colour plus underline,** never colour alone (black-and-white print; colour-blind students).
- **The accent colour must be unique:** not green or red (Balanced / Not balanced), not the blue of the icons, not the added-amount colour. Suggested: purple.

### 3D. The operation is blue wherever it appears (new in 1.1)
- **The move's own number** (the amount added, the fraction taken, the flip sign) is **blue everywhere it shows**: in the line's prompt and quiz text, in every work-stack row, and in every piece of check or quiz evidence. If the question says "TAKE ⅓ of ONE SIDE ONLY" with the ⅓ in blue, the matching `⅓(3 × 4)` in the evidence rows has its ⅓ in blue too.
- This is separate from the step highlight (§3C, the accent colour) and from the value placed on x (also blue; see the card specs).

### 3E. Work is shown at every step, on every level (new in 1.1)
- **Every operation writes its rows** into the work stack: the operation applied (in blue), then **what each quantity becomes**. This holds on **every level, numeric L1 and quiz evidence included**: e.g., taking ½ of the left side shows `½(2 × 6) = 3 × 4`, then `6 = 12`, then the Unbalanced mark; taking ½ of the right shows `½(2 × 6) = ½(3 × 4)`, then `6 = 6`, then the Balanced mark. A readout alone is never enough.
- A card spec may not drop this rule for a level.

---

## 4. Checking the work (substitution)

- **Every answer is checked by substituting it back,** right or wrong, whichever path produced it. It is written in the work stack under the problem, never in the line.
- **Before the clicks begin, the value is placed on x.** In **full-check levels** the student **drags the typed value onto x** in the stack (tap alternative: tap the value, then tap x). In **collapsed levels** it slides onto x automatically. (Proposed in design; see Open.)
- **Rendering rule (one shared renderer, with tests).** The first substitution line is the equation exactly as written, with every x replaced by the value, a **negative value in parentheses**, and a **coefficient written as ×**. Test cases: `3x = −12`, −4 → `3 × (−4) = −12` · `x − 6 = 9`, 15 → `15 − 6 = 9` · `−3x = 12`, −4 → `−3 × (−4) = 12` · `12 = −x`, −12 → `12 = −(−12)` · `7 = x + 3`, 4 → `7 = 4 + 3`. The renderer never drops the coefficient, never shows `× −4` without parentheses, and never substitutes into a different equation than the one named in §1B.
- **Full check:** line by line, **one click per line** (a green Next each time), with the step highlighting of §3C, ending in the green or red mark.
- **Collapsed check:** the first substitution line, then the final `✓ Balanced` line (the middle arithmetic skipped). **A wrong value always shows the full check at every level,** because the steps are the evidence of where it broke.
- **Which levels collapse is decided per level, set by each card spec.** Defaults:
  - **Single-step cards** (Add, Divide, Flip it, and similar): **never collapse** (the check is two or three clicks).
  - **Multi-step cards:** levels 1-2 full; from level 3 collapsed.
- The check target (current equation vs original) is set in §1B.

---

## 5. The Move panel and the Why? boxes

- **Full move list on every card of the unit,** same order, unused moves greyed so the play area never changes shape. Current order: **Add ___ to both sides**, **Cross the border**, **Take a fraction of both sides** (×⅓, ÷3), **Multiply both sides by ___**, **Flip everything**, **Trade places**, **Distribute**, **Combine like terms**. *(The order may be revisited, to reflect the order students would use moves; see Open.)*
- **Greyed moves:** tapping one says in the line "That move unlocks on a later card." They never act. Their **Why? boxes show as faint outlines.**
- **Icons.** Each move is a drawn icon (one template: equation shape in grey, the part that changes in colour). **Mouseover shows the text.** The **selected move always shows its text label** and grows slightly; the line names a move in words when it directs the student to it. **Touch devices:** a tap on an icon shows its text for a moment before it acts (long-press alternative on phones). Moves and Why? boxes are in a smaller font, **one line each.**
- **Why? boxes are green ✓ / red ✗ / grey –,** judged only **after Go**, never mid-move. Each card spec defines its boxes and rules.
- **Lights are an unranked checklist by default.** A card spec may rank them only where ranking serves that card, and must say why. A legal move must never be punished by a ranking.
- **Solved for x** (the uber-goal, last row): green when **x is alone** on its side (before the value is typed). A card spec may refine this (e.g., Flip it: x alone *with a positive coefficient*); where a card has several lights, Solved for x goes green when all of them are met.
- **Panel headings:** **Move** and **Why?** ("Strategies" is retired).

---

## 6. Help: I'm stuck and Teach me

**Principle:** supports are things the student **does**. Each support ends by sending the student **back to the choice** (guess, type the value, or try a move). **Nothing opens automatically.** The only exceptions: a wrong guess is followed by its substitution, Undo, and the highlighted move (§1B), and a card spec may name one misconception message.

### "I'm stuck" (one rung per click; each click = +1 stuck count for the level)
- **Rung 1: Model it.** The scaffold picture for the **next needed move** appears (the seesaw with the equation as counters, the tray, the balance word on), with the relevant number highlighted.
- **Rung 2: Choose the move.** The next needed move opens in its **two-action form** or equivalent, shown in the scaffold picture.
- **Rung 3: Guided.** The correct move or amount is pre-selected or pre-filled, and only the next target is highlighted.
- **Rungs restart at each new equation state** (Model it, Choose the move, Guided), because the next needed move has changed. Every click still counts toward the level's stuck count.
- **I'm stuck is always there,** so the student can ask for the next rung after any scaffold.

### "Teach me step-by-step"
The same scaffolds on a **forced path**: only the correct move is accepted, and the student still performs every action and types the answer. It counts as a Teach me use.

### The scaffold follows the next needed move
- When several moves would work, the scaffold shows **the one the card is teaching**. For example, on a Distribute card it pushes distribute then combine, not divide first. **The move menu itself never narrows** and students may choose any legal move.
- **The scaffold redraws the current state exactly,** including any moves already made (the unsimplified side shows as separate groups).
- **A scaffold stays on until the state ends.** The next state starts bare again.
- **A scaffold never clears or blanks the work stack** (new in 1.1). It draws in its reserved area; the equation and every row stay on screen. A scaffold that makes the stack disappear and reappear is a bug.
- **Every rung that has a picture shows the picture.** "I'm stuck" must open the card's diagram on every rung it defines, at every state, **including a state where x is alone but the other side is still an unevaluated expression** (`x = ⅓(6)`). The card spec defines that diagram. A card may not answer "I'm stuck" there with text only.
- **Scaffold pictures are card-specific** (the seesaw for Add, dealing groups for Divide, counters turning to opposites for Flip it). A card spec says where its scaffold picture departs from the default (e.g., the dealing scaffold never deals into an opposite box).
- **Numeric levels** (§7) offer neither I'm stuck nor Teach me.

### Stuck count (teacher-visible)
Per level: number of **I'm stuck** clicks and **Teach me** uses. **Anonymous: scrambled ids only to the class sheet (hard district rule).** No other behavior data is recorded unless a card spec adds it (see Open).

---

## 7. Levels, numeric levels and the diagnostic

- **Five problems per level, no repeated answers within a level.** Level counts are fixed per card: **save codes hold one bit per level.**
- **A card that introduces a new single move opens with a numeric level (L1):** numbers only, no x, balance readout on, a level and not a tutorial. It is where the balance is justified (the move on both sides keeps it; one side upsets it). Every item ends with a green Next. **Cards that combine several moves (two-step, distribute/combine/solve) have no numeric level.**
- **A numeric level can be skipped, but only after the diagnostic** (the card spec sets the threshold). A skipped L1 shows "skipped"; the student can still play it.
- **A diagnostic opens levels; students still play every opened level.** Each card spec sets its diagnostic sample and results.
- **Old levels map forward** so nobody re-earns. Claude Code must read the real old definitions and propose each mapping.

---

## 8. Generator rules (every card, every level)

- **Every generated problem is verified by substituting the answer in code. No hand-typed banks.** (`x − 5 = −2` is 3, not 5.)
- **Answers are whole numbers, never 0, never ±1,** and a card spec adds its own bans (e.g., never ±a when a is the coefficient, so "gave the number in front" can't collide with the correct answer).
- **No repeated answers or equations within a level.**
- **Size is set by the counter model, not arithmetic:** at most **36 counters per side** and **6 boxes** in any scaffold. Within that cap, levels use gentle ranges so progress comes from the new move, not harder arithmetic.
- **No item balances by accident** (numeric levels and quizzes).
- **Slip collisions:** the generator must confirm no slip's wrong answer equals the correct answer, and **report** any problem where two slips share a wrong answer (merge them into one slip and pick the message from the context; do not leave two).
- **Required mixes** (signs, forms, Party/Battle and so on) are set per card per level. **Do not make every answer positive** unless the card spec says so: positive-only invites mental math that skips the move.
- **The generator reports the worst-case work-stack row count** for each card (§3B).
- **Lights are computed on every state,** including states reached by a legal move the card didn't expect first; a legal move is never red.

---

## 9. What a card spec must define

Each card spec opens with "Follows `SPEC-SOLVE-IT-LOOP.md` rev N." and then states only:
1. **The task and move(s)** the card trains, with a worked example.
2. **Levels:** forms, number ranges, what's new, required mixes, sample banks (generator-verified), and whether it has a numeric L1 (with its items).
3. **The picture** for the move (and the scaffold pictures, including any departure from the default).
4. **Why? boxes and lights** this card uses, with rules, and its definition of Solved for x if it differs.
5. **Slips:** typed-value slips, move slips, and any single named misconception message on the guess path.
6. **I'm stuck rungs** where they differ from §6, and what Teach me does.
7. **Collapse levels** for the substitution check (§4) and the **worst-case row count** (§3B).
8. **Banned answers and generator constraints** beyond §8.
9. **Diagnostic** sample and results, and the old-level mapping.
10. **Open items.**

---

## Conformance checklist (new in 1.1): every card must pass this before it is called done

The conventions built on the one-step card must hold on **every card and every level, from now on**. Claude Code runs this list on each card and reports the results; a card that fails any line is not done.

1. **One prompt.** At every state with x not alone, the line shows the same prompt and the same two working buttons (§1A).
2. **Work shown.** Every operation writes its rows with what each quantity becomes, on every level, numeric levels and quiz evidence included (§3E).
3. **Operation in blue** in prompts, work-stack rows and evidence (§3D).
4. **Substitution renders correctly** (the renderer rule and its test cases, §4), and uses the right equation (§1B).
5. **Scaffolds show pictures and never blank the stack,** at every state including x alone with an unevaluated side (§6).
6. **Layout stable:** reserved space, no reflow, no appearing or hiding rows (§2).
7. **Start over, Undo and folding** behave as in §1C, §1D and §3A.
8. **One highlighted target at a time;** Check, Go, Undo and Next follow §2.
9. **Fit:** worst-case row count reported and the fit test run (§3B).
10. **Generator:** every problem verified by substitution, banned answers enforced, collisions reported (§8).
11. **Greyed-out rules** hold (nothing live that can't be used).
12. **Shared code:** the prompt, the row builder, the substitution renderer, the operation colour and the scaffold diagrams are shared components, not re-implemented per card.

---

## Required edits to existing specs

**`SPEC-ADD-TO-BOTH-SIDES.md` (rev 2.3 → 2.4):** replace the "light-build pattern" section with a pointer to this document. Remove or reword: "the choice is fixed for the problem" and "Path is fixed per problem" (now per state); "Start over is live only after three red moves in a row" (now always live, greyed only on the untouched original); "Undo returns to…" (now returns to the same state with the choice shown); the work-stack "seven-row reserve" (now §3B); and add the highlighting (§3C), the drag-onto-x rule (§4) and folding (§3A). Behaviour on this single-step card otherwise barely changes: the checks never collapse, and x alone still goes straight to the typing row. The card's own content (levels, numeric L1, slips, scaffold pictures) stays.

**`SPEC-DIVIDE-IT.md`:** still needs the full light-build pass: a numeric first level instead of the tutorial, the bare screen, the Move/Why? panel, the line and work stack, the choice, and scaffolds on request, as set here. Its ranked lights ("One box greyed until Smaller numbers") should become an unranked checklist unless a reason to rank is stated.

---

## Open items

1. ~~Check target for a wrong typed value when x is alone~~ **Decided (2026-10-12):** the **original** equation (matching the final-answer rule); a wrong *guess* at a simplified state uses the *current* equation.
2. **Collapse defaults** (§4): the single-step / multi-step defaults and "wrong value always shows the full check" are proposals; each card spec confirms.
3. ~~Drag the value onto x~~ **Decided (2026-10-12):** full-check levels drag, collapsed levels slide automatically. Revisit after the first build.
4. **Move order** in the menu is parked; revisit together with card order.
5. **Teacher data scope:** only stuck and Teach me counts today. Also count guess-vs-move choices and correct first guesses?
6. **Old-level mappings** and diagnostic thresholds: Claude Code must read the real old definitions.
7. **Progress loss after site updates:** on the audit list before rollout.
9. **Greyed-move messages** (from `SPEC-FLIP-IT.md`): a move from an *earlier* card says "You don't need that move here."; a move from a *later* card says "That move unlocks on a later card." Decide whether §5 adopts this.
8. **Forced-move wording** ("Let's try solving this one using a move.") may be softened after testing; the rule is fixed, the wording is not.
