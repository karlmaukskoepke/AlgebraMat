# Divide it: solve `ax = b` by taking a fraction of both sides  (Karl, 2026-10-12; revision 2.2; status: designed)

**Follows `SPEC-SOLVE-IT-LOOP.md` rev 1.2** (including its conformance checklist). Everything shared (the screen, the guess-or-move choice at every state, the forced-move rule, substitution checks, Undo and Start over, the work stack and folding, the help row, the scaffold ladder, generator rules) is defined there and wins any conflict. This spec states only what is specific to Divide it.

**Build L note (2026-10-21, loop rev 2.3):** the move is now Multiply's **Divide** option: the student types n into `1/▢` (one digit), and the rows stay in multiplication form (`⅕ × (5x) = ⅕ × (15)`, labelled "Dividing by 5 is multiplying by ⅕."). Dividing by n is the same move as taking 1/n: the rows, checks, lights, class-sheet events and the fraction cycle are unchanged. The Multiply menu's options here are Multiply (explained, not applied, as before), Divide (live) and Fraction (greyed: "That move unlocks on a later card."); the old `−1 × ( )` option is gone, and −1 typed in Multiply or Divide gets the old −1 explanation. The hint after Undo says "To get one x, divide both sides by 5 (that is, multiply by ⅕): one of the 5 x boxes is ⅕." and lights the Divide option. **Revision 2.0 brings the built card (rev 1.x, live) into line with the loop.** §10 lists every change from what is built, for Claude Code. Everything not listed there stays as built. **Revision 2.1 adds the fixes from Karl's first test of the build** (§10 items 15-21, with the matching rules in §3A, §3B, §3D and §5). **Revision 2.2 adds the second round** (§10 items 22-27, in §3B, §3C and §5).

Section: Solve it (after Add to both sides).   Prerequisite card(s): Group It (fractions of a group), Add to both sides.

**Fractions lead; division is the secondary readout.** Dividing both sides is taught as **taking a fraction of both sides** (`⅓` of 3 boxes is 1 box, `⅓` of −12 is −4). Division appears only as the small second line on each fraction button.

---

## 1. The task

**Example:** `3x = −12`. The student chooses **Use a move**, chooses **Take a fraction of both sides**, and taps **`× ⅓`** (with **`÷ 3`** in small type beneath it). One tap takes ⅓ of **both** sides. The work stack shows `⅓(3x) = ⅓(−12)` (the fraction in blue) and then `x = ⅓(−12)`. The right side is **not** simplified, so the student works out **−4** and types it into the `x = [▁]` row. The check follows (loop §4): `3 × (−4) = −12`, `−12 = −12`, `✓ Balanced`.

**Two-move example (composite coefficient):** `6x = 12`. `× ½` gives `½(6x) = ½(12)` → `3x = 6` (a partial step is evaluated). After **Next**, the move folds and the **choice returns** at the new state. Then `× ⅓` gives `⅓(3x) = ⅓(6)` → `x = ⅓(6)`, and the student types **2**. (Taking `× ⅙` first would have finished in one move.)

**What they type:** one whole number on the integer pad. **The solved value is never displayed** before the student types it (the one exception is the watched L1 walkthrough, §3A).

**Card-wide rules**
- **Positive coefficients only.** `−x = b` belongs to **Flip it**; `x/a = b` belongs to **Fraction equations**.
- **Every problem has a whole-number answer.** The coefficient always divides the right side. **Answers are never 0, never ±1, and never ±a** (a = the coefficient). *Why ±a: on `3x = −9` the answer −3 and the wrong value 3 would be produced by two different slips ("wrong team" and "gave the number of boxes"), so the answer must never be ±a.*
- **No streaks.** Only a stuck count.
- **Guess x is available at every state** (loop §1A).
- **The menu always shows all five fractions** (`½ ⅓ ¼ ⅕ ⅙`). Wrong ones fail visibly; the menu is never narrowed.

---

## 2. Levels (6; Level 1 is numeric)

Five problems per level, **no repeated answers**, answers never 0, ±1 or ±a. At most **36 counters** on the right and **6 boxes**.

| Level | What it is |
|---|---|
| **L1** | **Numeric** (no x). `3 × 4 = 2 × 6`-type items on a seesaw with a balance readout (§3A), then a watched `3x = 6`. |
| **L2** | `ax = b`, a = 2 or 3, answers 2-5 in size (b ≤ 15), positive and negative. |
| **L3** | `ax = b`, a = 2-5, answers 2-6 (b ≤ 30). |
| **L4** | `ax = b`, a = 2-5, b up to 36. **Deal a round** is available in the counters scaffold. |
| **L5** | `ax = b`, a = 4 or 6 (composite): several fractions are legal; one takes it to one box, the others are partial moves. |
| **L6** | `ax = b`, a = 2-6 mixed, b up to 36. |

(The original spec's levels 1-5 are this card's Levels 2-6.)

**Form counts:** L2: at least 2 of each a (2 and 3), at least 2 negative and 2 positive answers. L3: at least 1 of each a = 2, 3, 4, 5, at least 2 negative and 2 positive. L4: at least 2 negative and 2 positive. L5: at least 2 of each of a = 4 and 6, at least 2 negative and 2 positive. L6: at least 2 negative and 2 positive, at least 3 different coefficients.

**Sample bank (the generator verifies every problem by substitution; no hand-typed banks; none has an answer of ±a):** `2x=−10` → −5 · `3x=−12` → −4 · `5x=15` → 3 · `4x=−20` → −5 · `6x=−18` → −3 · `5x=−35` → −7.

---

## 3. The screen and the picture

### 3A. Level 1 (numeric)
**The picture is a seesaw, reusing the component built for Add to both sides' L1** (the same seesaw with number groups and the balance word on, numbers only). Each side shows its counters grouped as the expression reads (`3 × 4` as 3 groups of 4, `2 × 6` as 2 groups of 6); taking a fraction of a side keeps that fraction of its counters; the beam tips or levels with the readout `12 = 12  Balanced ✓`. The prompt is in the line. Five items, each ending in a green Next; nothing advances on a timer.
1. **Do (⅓):** choose *Take a fraction of both sides*, then **Take ⅓ of the left**, then **Take ⅓ of the right**, then Go. Two actions are the point of the level. **Each action adds rows to the work stack showing what each side becomes** (loop §3E; the fraction in blue):
   ```
   3 × 4 = 2 × 6                  12 = 12   Balanced ✓
   ⅓(3 × 4) = 2 × 6               (take ⅓ of the left)
   4 = 12                         ✗ Unbalanced
   ⅓(3 × 4) = ⅓(2 × 6)            (take ⅓ of the right)
   4 = 4                          ✓ Balanced
   ```
2. **Do (½):** the same with ½ on another equation, every row shown as in item 1 (e.g., `2 × 6 = 3 × 4`: `½(2 × 6) = 3 × 4`, `6 = 12`, `✗ Unbalanced`; then `½(2 × 6) = ½(3 × 4)`, `6 = 6`, `✓ Balanced`). **Showing only the readout is not enough.**
3. **Quiz:** "What happens if we **TAKE ⅓ of ONE SIDE ONLY**? Does it keep the balance, or upset it?"
4. **Quiz:** "… **TAKE ⅓ of BOTH SIDES**?"
5. **Quiz:** "… **TAKE ⅓ of the LEFT and ½ of the RIGHT**?"
- After either answer the work shows what happened (the equation, the fraction applied, what each side comes to, ✓ Balanced / ✗ Unbalanced), says whether the guess was right, and waits for the green Next. **The matching fraction is blue in every evidence row** (loop §3D), exactly as it is blue in the question. For item 3: `3 × 4 = 2 × 6`, `⅓(3 × 4) = 2 × 6`, `4 = 12`, `✗ Unbalanced`. **No retry.** The room for it is reserved above the question, so nothing moves.
- **Final walkthrough** (watched, no typing, every step stays on screen), **with the group diagram of §3D**: `3x = 6` is drawn as **three groups of x** on the left (one box each) and **6 counters in three groups of 2** on the right. (a) highlighted: **Take a fraction of both sides**, then `× ⅓`. (b) the work stack adds `⅓(3x) = ⅓(6)` (⅓ in blue) and the diagram draws a **bracket around 1 of the 3 groups on each side**, labelled "take 1 of the 3 groups: that is what × ⅓ does"; the other two groups fade. (c) **Next:** the stack adds `x = ⅓(6)`; the diagram shows the kept group alone (one box; 2 counters). (d) **Next:** `x = 2`. (e) **Next:** plug in: `3 × 2 = 6 ✓ Balanced`. (The value shows here only because this is a watched demonstration.) Takeaway: "Taking a fraction of both sides can leave one box." The **Move/Why? panel is visible with only Take a fraction active**, so the play area is the same shape at every level.
- **No I'm stuck / Teach me on Level 1.**

### 3B. Levels 2-6: the bare screen
Top to bottom: **the line** (a coloured box, centred, one sentence at a time); **the work stack** (the equation, each move under it, the `x = [▁]` row with **Check ✓ directly under it** and the green **Next** beside it, the substitution); the **fractions row** ("Take × ½ × ⅓ × ¼ × ⅕ × ⅙ of both sides", each button stacked `× ⅓` over `÷ 3`); **Undo**; the **help row** (I'm stuck, Teach me step-by-step, Start over); the number pad. On the right, the **Move / Why?** panel (§4).

- **The choice at every state** (loop §1A): the line asks "Would you like to guess the solution (the value of x), or use a move to make the problem simpler?" The choice returns after every correct move that leaves x not yet alone. When x is alone there is no choice: the `x = [▁]` row goes live.
- **The prompt never changes.** After **every** correct move (a partial move such as `4x = −16` → `2x = −8` included), the line shows the **same prompt, word for word,** with the **same two buttons, both working** (loop §1A). It must never say "guess again" or "use a step", and must never show an option that does nothing. Guess x leads to guess mode and Use a move leads to move mode, every time.
- **Choosing the move:** tap *Take a fraction of both sides* in the panel, then a fraction. **Enter** moves forward through Check, any Next, or Go.
- **The fractions row reserves its space at all times.** It is greyed out until the move is chosen and **greyed again while counters are dealt** (it is never hidden), so nothing reflows (loop §2).
- **One action:** the fraction is taken of **both** sides at once. The work stack gets `⅓(3x) = ⅓(−12)` (fraction in blue) and the new equation. **On the move that finishes** (x alone), the right side stays as `x = ⅓(−12)` until the student types the value. **On a partial move** (`6x = 12`, `×½`) it shows the smaller numbers (`3x = 6`), the move folds on **Next**, and the choice returns.
- **A fraction that doesn't split** (the boxes or the counters don't make n equal groups) is a **failed attempt**: its row is shown in red with ✗, the line says which side broke ("3 boxes can't make 2 equal groups", "12 can't be shared into 5 equal groups (2 left over)"), **Undo** is highlighted, and a new try replaces it. **Three red in a row add "Try I'm stuck."** to the line (loop §1C). A failed attempt counts toward that and never toward the stuck count.
- **Plugging back in** (loop §1B and §4). The line says **"Drag your answer onto the x in the original equation."** (tap alternative: "or tap your answer, then tap the x"). The **drop target is the x in the original equation row at the top of the stack** (for a wrong guess at a simplified state, the x in the current equation row), and it pulses blue. **On the drop the value flies to that x and takes its place in the top row** (blue, in parentheses when negative); the substituted equation is then written as the **first check row**, and the top row goes back to x so the history stays. Then the check runs a line a click with the step highlighting of loop §3C (`3 × (−4) = −12`, `−12 = −12`, `✓ Balanced`). **No underline or bracket is drawn under any check row** (decided 2026-10-12; loop §3C). The step highlight is **bold in the accent colour on the operation's characters only.** **This card never collapses the check** (it is two or three lines).
- **A wrong guess** ends red with Undo highlighted, then "Let's make the equation simpler first, and then find the solution." with the next needed move highlighted. A correct final value forces the **next problem** to be a move **only if the correct guess came at the first state with no move made** (and adds a sixth, move-only problem if that was the level's last).

### 3C. The counters scaffold (from I'm stuck and Teach me)
- The **boxes** on the left and the **pile** of counters on the right (the size of the number on the right, at most 36, all one sign). **The scaffold redraws the current state exactly**, including after a partial move (`3x = 6` shows 3 boxes and 6 counters).
- Choosing a fraction that splits both sides draws **n empty groups** on the right and splits the boxes into the same n clusters on the left.
- **Dealing:** tapping a group gives it one counter. **Deal a round** (one to every group, only while a whole round is left) is available from Level 4. Under the model: "9 of 12 shared · groups hold 4, 3, 2".
- **Keeping:** once every counter is shared evenly, the groups become tappable; tapping one keeps it, which takes that fraction of both sides. Keeping early says how many are still in the pile; uneven groups say what they hold.
- **Undo** takes the whole attempt back. **The dealing scaffold is also what Flip it reuses** (it never deals into an opposite box).
- **The picture stays after the move is applied** (new in 2.2). Clicking Go on the fraction must not delete the counters or groups. They stay on screen exactly as the student left them, with the kept group highlighted, until the student clicks **Next** (which folds the move). The student likely still needs them. (Whether the other groups also fade is still open, §11.)
- *Not built yet; see Open:* the other groups fading on both sides when one is kept.

### 3D. The group diagram (fraction of a group)
**One shared diagram component, reused from the existing fraction-of-a-group work in the Count it section (Group It).** Claude Code finds that component in the repo and reuses it, instead of drawing a new one. It draws a quantity as counters (or boxes), splits it into n equal groups, and puts a **bracket around the kept group(s)** with the label "take 1 of the 3 groups". It is used in three places:
1. **The L1 final walkthrough** (§3A): three groups of x on the left, six counters in three groups of 2 on the right, a bracket on one group of each.
2. **The counters scaffold** (§3C), when a move is chosen.
3. **"I'm stuck" at x alone** (§5): the diagram of the **right side only**, for an expression such as `x = ⅓(6)`.

**In a real problem the diagram never prints the answer as a numeral.** It draws the counters and the groups (the student counts the kept group and types the number). In the L1 watched walkthrough only, the 2 may be shown.

---

## 4. The Move / Why? panel and the lights

- **Move list (same on every card):** Add ___ to both sides, Cross the border, **Take a fraction of both sides (active here)**, Multiply both sides by ___, Flip everything, Trade places, Distribute, Combine like terms. Each is an icon; the name pops up outside the box on hover; greyed moves are a grey fill with a dark grey dashed edge. **Tapping a greyed move** says: for a move from an **earlier card** (Add, Cross the border, Trade places), "You don't need that move here."; for a move from a **later card**, "That move unlocks on a later card." (see Open).
- **Why? boxes judged on this card (after the move):** **Smaller numbers** (green when every number in the equation gets smaller in size; grey if unchanged; never red) and **One box** (green when the coefficient of x is 1; grey until then). **Every other Why? box is a faint outline** and is not judged on this card; **No fractions** ("no fractions left in the problem") arrives on the Fraction equations card.
- **Solved for x** (the uber-goal, last row): green when **x is alone on its side** (the coefficient is always positive here, so this is exactly when One box goes green).
- **The lights are an unranked checklist** (loop §5). A partial move (`6x = 12`, `×½`) turns Smaller numbers green and leaves One box grey; the finishing move turns One box and Solved for x green.

---

## 5. Help

All supports follow the loop (§6). Specific to this card:

### "I'm stuck" (one rung per click; each click = +1 stuck count; rungs restart at each new equation state)
- **Rung 1: Model it and deal it** (merged in 2.2: a picture-only first rung was not helpful, and every rung must give the student something to do, loop §6). The **counters scaffold appears** (§3C) with the equation standing on it (`6x = 12` is **six x boxes** on the left and **all 12 counters** on the right), the number in front of x **outlined**, and the line asks: **"What fraction of both sides leaves one box?"** **The student can start dealing immediately:** deal every counter into the groups and take the fraction (in the order the scaffold already uses). The student may **type the answer at any point**, and Check works after any deal.
- **Rung 2: Guided.** The matching fraction button is highlighted; the student still deals every counter and keeps a group, then types the value.
- **The next needed move is the fraction that reaches one box** (**1/a**, always legal because a divides b), even where partial fractions are also legal (L5). Partial fractions are accepted in free play and never pushed.
- **After every scaffold the choice returns** (guess, type the value, or try a move). I'm stuck is always there for the next rung.
- **At x alone with an unevaluated right side (`x = ⅓(6)`), I'm stuck opens the group diagram** (§3D) on every rung (this replaces "I'm stuck just says to work out x", which is what the build did and which blanked the screen):
  - **Rung 1: Model it and deal it** (merged in 2.2: the pile alone, e.g. a box of 18 negative counters, was not helpful). The expression stays on screen and the diagram appears: **the counters in one pile** (for `x = ⅓(−18)`, 18 negative counters) with the line "What is ⅓ of −18? Share the counters into 3 equal groups." **The student can deal at once** into 3 groups (tap alternative; Deal a round from L4) and keep 1 of the 3 with a bracket; they count it and type the value, **or type at any point**.
  - **Rung 2: Guided.** The counters arrive **already in 3 equal groups with one group bracketed** ("1 of the 3"); the student counts the kept group and types it. No numeral is printed.
  - **The work stack stays on screen throughout** (loop §6); the diagram draws in its reserved area.

### "Teach me step-by-step"
The same scaffolds on a **forced path:** only **1/a** is accepted, the student performs every deal and the keep, then types the answer. It counts as a Teach me use.

**L1 gets neither button.**

---

## 6. What a wrong answer looks like (the slips)

**Typed-value slips** (x alone after a move). One tag per wrong value, in this priority order, each with its message (shown after the full substitution, in the line). **A wrong guess gets no slip message** (loop §1B).

| Tag | Example (`3x = −12`) | Message |
|---|---|---|
| ignored the number in front | −12 | "Put −12 back in: 3 boxes of −12 is −36, not −12." |
| wrong team | 4 | "Right size, wrong team. 3 boxes of 4 is 12, not −12." |
| multiplied | −36 | "3 boxes with −12 in each would be −36. We want what is in one box." |
| stopped halfway (`6x = 12` → 6 after ½, 4 after ⅓) | | "6 is what is in each group of 3 boxes. Keep going until it is one box." |
| wrong number of groups | −6 (÷2), −3 (÷4) | "You shared into 2 groups, but there are 3 boxes. One group per box." |
| gave the number of boxes | 3 | "3 is how many boxes. How many negatives are in each one?" |
| undid addition | −9, −15 | "3x means 3 boxes, not 3 more. Share the −12 among the 3 boxes." |
| anything else | | "Put it back in … Share the −12 evenly among the 3 boxes." |

**Slip collisions:** with answers never ±a, "wrong team" (−answer) and "gave the number of boxes" (a) can never share a value. The generator still confirms no slip's wrong answer equals the correct answer and **reports** any problem where two slips share a wrong answer (merge them into one slip and pick the message from the context).

**Move slips:**

| Slip | Example | What happens |
|---|---|---|
| **Fraction doesn't split the boxes** | `3x=−12`, `×½` | Failed attempt on the left. Picture and message name the left side. Undo highlighted. |
| **Fraction doesn't split the counters** | `3x=−12`, `×⅕` | Failed on both sides. Picture names both. Undo highlighted. |
| **A legal partial fraction** (composite a) | `6x=12`, `×½` | **Not a slip.** Smaller numbers green, One box grey; the choice returns. |
| **Uneven deal** (scaffold) | taps one group five times, another once | Evenness readout shows "groups hold 5, 1, 0". **Keep** stays disabled. |
| **Keeps the wrong number of groups** (scaffold) | taps two groups | Only one group can be kept. Selection moves. |

---

## 7. Words

**box, counters, groups, a fraction of a group, balance, check.** The card is **Divide it** (replacing "Share it" and the printed notes' "Sharing Among Boxes", which is to be renamed). The button is `× ⅓` over `÷ 3`; the fraction is the main label. The record is `⅓(3x) = ⅓(−12)`, never `÷3 ÷3`. Say "split the **boxes** into 3 equal groups" (a set of boxes), not "split the box into 3 parts" (that is Fraction equations).

---

## 8. Progress, diagnostic, old levels

- **Save code v14** holds Divide it's six levels (16 data symbols; v13 codes still read). **This revision does not change the level count.**
- **Old levels map forward** (nobody re-earns): old One-step `ax = b` (level 3) credits Divide it **Level 2**; the old mixed level (5) credits **Level 3**; Level 1 is never credited; Levels 4-6 are new.
- **Diagnostic (3 problems):** one problem each of the original spec's L2, L4 and L5 types (the card's Levels 3, 5 and 6), nothing marked until the end. A wrong first opens Levels 1-2; right then wrong, 1-4; then 1-5; all right, 1-6. A right first problem **skips Level 1** (it is marked done; the student can still play it). A diagnostic opens levels; students still play every opened level.
- **Teacher data:** stuck and Teach me counts per level, anonymous (scrambled ids only).

---

## 9. Edge cases and limits

- Whole numbers only; a always divides b; **answers never 0, ±1 or ±a**; b is never ±a.
- ≤ 36 counters on the right, ≤ 6 boxes, no divisor above 6 in the menu, no negative fractions.
- Every problem is verified by substitution. No repeated answers or equations within a level.
- **Fit (loop §3B).** The generator reports the **worst-case work-stack row count** for this card. A partial-then-final problem like `6x = 12` is roughly **8 to 9 rows** (the original, the folded partial move, the finishing move's two rows, the typing row, the typed value, and a 2 to 3 line check). This is an estimate; Claude Code renders the real worst case at a Chromebook size with the pad and help row visible and no page scroll.
- The check never collapses on this card.
- Phones are secondary; every drag has a tap alternative.

---

## 10. Changes from the built version (rev 1.x → 2.0), for Claude Code

1. **The choice is per equation state.** After a partial move (`6x = 12` → `3x = 6`) the choice returns (loop §1A).
2. **Check targets:** a wrong guess is substituted into the **current** equation; a correct final value, or a wrong value typed once x is alone, into the **original** (loop §1B). The next problem is forced to be a move **only** when the correct guess came at the first state with no move made.
3. **Folding:** a helpful move writes the new equation and waits for a green **Next**, which **folds** the move to one row. **Undo** reaches only the current, unfolded move and returns to the same state with the choice showing (loop §1C, §3A).
4. **Start over is always live,** greyed **only** on the original, untouched equation (nothing to wipe), and live the moment the student does anything. It wipes the stack and returns to the original equation with the choice showing; the stuck count survives. **Remove** "three failed attempts in a row offer Start over"; three red only adds "Try I'm stuck." to the line.
5. **Substitution highlighting and drag onto x:** the operation about to happen is bold in the accent colour, never underlined, and its result appears in the next line in the same colour (loop §3C); the typed value is dragged onto x first, with a tap alternative (loop §4).
6. **"I'm stuck" rungs follow the loop:** Rung 1 shows the counters (with the number in front outlined and the question), Rung 2 is choosing a fraction and dealing, Rung 3 is guided. They restart at each new equation state. (The built Rung 1 was a hint without the counters.)
7. **The fractions row reserves its space** and is greyed out (not hidden) while counters are dealt, so nothing reflows.
8. **Check ✓ sits directly under the `x = [▁]` row,** as built. **The loop is updated to match** (the pilot spec said "beside").
9. **Answers are never ±a** (was "never a"). The generator must drop any problem whose answer is ±a, re-verify the banks, and report slip collisions.
10. **Defined:** **Solved for x** is green when x is alone on its side. **Why? boxes other than Smaller numbers and One box are faint outlines** on this card (the built version lit them green with the good move; **No fractions** now arrives on the Fraction equations card).
11. **L1 gets a seesaw,** reusing the code of Add to both sides' L1, and shows the Move/Why? panel with only Take a fraction active.
12. **Fit:** the generator reports the worst-case row count; Claude Code runs the loop's fit test.
13. **Greyed-move messages** follow §4 (earlier card vs later card).
14. **No change to:** the level count and save code v14, the old-level mapping, the diagnostic, the slip table, the fractions menu and its failed-attempt behaviour, the counters scaffold's deal and keep, and Level 1's item structure.

**Added in 2.1 (from Karl's first test of the build; see `BUILD-BRIEF-DIVIDE-IT-2026-10-12-a.md` for symptoms and acceptance checks):**
15. **L1 shows its work** (§3A): every action adds rows showing what each side becomes, in both Do items and in the quiz evidence.
16. **The matching fraction is blue in the evidence rows** as well as in the question (loop §3D).
17. **The L1 final walkthrough gets the group diagram** (§3A, §3D), reusing the existing fraction-of-a-group component.
18. **The substitution renderer is fixed** (loop §4 renderer rule and test cases): the build rewrote the substitution wrongly after a correct guess on Level 2.
19. **"I'm stuck" at x alone opens the group diagram** on every rung and never blanks the stack (§5).
20. **The choice prompt never changes** (§3B): the same words and two working buttons at every state, including after a partial move.
21. **Run the loop's conformance checklist** on this card and report the results.

**Added in 2.2 (from Karl's second test of the build; see `BUILD-BRIEF-DIVIDE-IT-2026-10-12-b.md`):**
22. **The drag target is the x in the original equation at the top,** and the value visibly flies onto it before the check rows are written (§3B; loop §4).
23. **No underline or bracket under any check row;** the step highlight is bold in the accent colour on the operation's characters only (§3B; loop §3C).
24. **"I'm stuck" is merged to two rungs** on normal states (model-and-deal, then guided) (§5).
25. **"I'm stuck" at x alone is merged to two rungs** (pile-and-deal, then guided); the student may type at any point (§5).
26. **The scaffold picture stays after the fraction is applied,** until Next (§3C; loop §6).
27. **The step in brief a's B2 (three rungs at x alone) is superseded** by item 25.

---

## 11. Open

1. **Other groups fading** on both sides when one is kept (§3C). Not built. Recommendation: build it, because it shows "both sides" at the moment of the keep.
2. **Trade places on this card.** Trade places appears in later levels of Add to both sides and again in later levels of other early cards. Does it go live in later Divide it levels? That would need `b = ax` forms (x on the right) in, say, L5-L6. That changes forms, not the level count. Not decided; not built in.
3. **Greyed-move message wording** ("You don't need that move here." vs "That move unlocks on a later card."), shared with the loop and Flip it.
4. **Deal a round at L4** (the original spec's L3): confirm.
5. **Printed notes:** rename "Sharing Among Boxes" to "Divide it".
6. **Old-level mapping** is already in the live build; keep as is unless the real old definitions say otherwise.
