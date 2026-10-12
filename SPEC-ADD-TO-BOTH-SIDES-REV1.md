# Add to both sides: solve `x + a = b` and `x − a = b` by adding the opposite to both sides  (Karl, 2026-10-11; status: designed)

Section: Solve it.   Prerequisite card(s): Combine it L2 (adding a positive and a negative). Replaces the old One-step L1-L2 and the old Switch sides card (see §9).

This is the **pilot** for the new moves-based Solve it. Everything here (tutorial pattern, lights, hint ladder, early-answer path) is reused by the multiply/divide, fraction, two-step, distribute and both-sides cards, so build it as reusable pieces.

---

## 1. The task

**Example:** `x − 5 = −2`. The student sees the equation with a balance readout above it, a menu of moves (only the moves this level allows), and a "Do you know x?" answer pad that is always available.

**What they do:** choose "Add ___ to both sides", pick the amount (here +5), add it to one side, then add the same amount to the other side (two separate actions). The +5 and −5 cancel, and −2 + 5 is a Battle that leaves +3. They finish by typing `3` on the pad.

**What they type:** one whole number (`3`). The pad is the existing integer pad (digits and ±). The student never types x or an expression.

**Card-wide rules**
- **No streaks.** The only counted thing is **stuck clicks** per level (see §4).
- **Typing early is allowed at any time** (see §4, "Early answer").
- **Every card opens with the numeric tutorial** (§3A), even for students a diagnostic opened levels for. The tutorial is replayed in full, not shortened.
- Only tools this level needs are shown. No extra menu items.

---

## 2. Levels (6, fixed; no room reserved beyond 6 for now)

Five problems per level, **no repeated answers within a level**. In all levels the coefficient of x is 1.
Notation: **Party** = the added opposite lands on a same-sign number on the right. **Battle** = it lands on an opposite-sign number.

| Level | Forms | Numbers | What's new | Working surface |
|---|---|---|---|---|
| **L1** | `x + a = b` | a: 1-9. b: -9 to 12 | Add the opposite (−a) to both sides. Cancel the pair on the left. Right side is a Party (negative answers) or a Battle (positive answers). | Counters, built from scratch by the student |
| **L2** | `x − a = b` | a: 2-9. b: -9 to 12 | Adding a **positive** to cancel a **negative**. Battles with a negative b and positive answers. | Counters, built from scratch |
| **L3** | Mixed `x + a = b` and `x − a = b` | a: 2-9. b: -10 to 12 | Choosing the right opposite without being told the form. Answers positive and negative. | Counters **pre-built** for the student. Symbols shown alongside. |
| **L4** | x on the right: `b = x + a`, `b = x − a` (and the L3 forms mixed in) | a: 1-9. b: -9 to 12 | **Trade places** is introduced with its own numeric tutorial (§3B). Useful but never required. Convention nudge for `4 = x` (§4). | Symbols only. Counter mode available as stuck rung 1. |
| **L5** | All forms, either side | a: 1-14. b: -15 to 15 | Larger numbers. Mastery gate for L6. A combined "Add to both sides" one-tap option appears, alongside the two-action path. | Symbols only |
| **L6** | Same forms as L5 | as L5 | **Unlocks after L5.** New move: **Cross the border** (a term crosses and switches teams). Own numeric tutorial (§3C). Student may still use add-to-both-sides. | Symbols only |

**Form counts per level (required mix of the 5 problems)**
- **L1:** 3 Party (negative answers), 2 Battle (positive answers or a negative answer, e.g. `x + 5 = 2`).
- **L2:** at least 2 Battle with a negative b. At least 1 Party (b positive). Answers mix signs.
- **L3:** at least 2 of each form. At least 2 negative answers and 2 positive answers.
- **L4:** 3 x-on-the-right problems, 2 x-on-the-left. At least 2 negative answers.
- **L5:** at least 1 of each of: `x + a = b`, `x − a = b`, `b = x + a`, `b = x − a`. At least 2 negative answers.
- **L6:** mix of `x + a = b` and `x − a = b` (x on the left only, so the focus is the new move).

**Do NOT make every answer positive.** Positive-only would let students skip the opposites and just do mental math. Negative numbers in the problem are the reason the move is needed.

**Sample banks (answers checked by substitution; the generator must do the same check automatically)**
- L1: `x+3=−6` → −9 · `x+4=−2` → −6 · `x+7=−5` → −12 · `x+5=2` → −3 · `x+6=10` → 4
- L2: `x−5=−2` → 3 · `x−3=−6` → −3 · `x−4=3` → 7 · `x−6=−1` → 5 · `x−2=−9` → −7
- L3: `x+8=3` → −5 · `x−7=−4` → 3 · `x−2=5` → 7 · `x+9=−1` → −10 · `x−4=−10` → −6
- L4: `7=x+3` → 4 · `−2=x−5` → 3 · `5=x+9` → −4 · `−8=x+1` → −9 · `6=x−4` → 10
- L5: `x+12=−3` → −15 · `−6=x−9` → 3 · `x−11=4` → 15 · `8=x+14` → −6 · `x+10=2` → −8
- L6: `x+6=−4` → −10 · `x−7=2` → 9 · `x−4=−9` → −5 · `x+8=1` → −7 · `x−9=−2` → 7

Note: in the design conversation the example `x − 5 = −2` was spoken as having answer 5. It is **3**. Every bank must be generated and verified by code, not typed by hand.

---

## 3. The model / picture

### 3A. Numeric tutorial for "add to both sides" (opens the card, every student, every time)

Equation with no unknown: **`4 + 1 = 2 + 3`**. Above it, lightly written: **`5 = 5`  Balanced ✓**. The readout recalculates after every action.

1. **Explore.** The student may add a number to the left side. Example: adds −1 to the left → readout `4 = 5  Unbalanced ✗`. They then add −1 to the right → `4 = 4  Balanced ✓`.
2. **Go button.** A move can only be committed (**Go**) when the readout is balanced. Mid-move (after the first of the two actions) Go is disabled and the readout shows the tilt.
3. **Try more.** The student is encouraged to try other amounts (+2, −3, +5). Amount 0 is not offered. Every time, they see that the same amount on both sides keeps the balance, and different amounts do not.
4. **Quiz (near the end, 3 items):** "Did it keep the balance or upset the balance?"
   - Adding 3 to one side only → **upsets**
   - Adding 3 to both sides → **keeps**
   - Adding 3 to the left and 2 to the right → **upsets**
   On a wrong answer: a **side-by-side comparison** of the two equations with readouts. The student then retries that item.
5. **Counters with a box.** Same idea with a box: `x + 2 = 5`. The student adds counters to both sides and watches pairs cancel. The readout shows only **tilt** ("left side heavier by 2"), based on the moves made. It never shows the hidden x or the solution.
6. **Symbols only.** Same equation shown with symbols. Then the card's levels begin.

Number-choice rule for tutorial items: no item may balance by accident (adding 0, or two different amounts that happen to total the same). The generator checks this.

### 3B. Trade places tutorial (introduced at the start of L4)

Numeric: **`5 = 2 + 3`** → press **Trade places** → **`2 + 3 = 5`**. Readout stays **Balanced ✓**. A second item with different numbers (`7 = 4 + 3`).
- **Motion:** the two sides **rotate around the = sign**: the left expression travels down and over to the right, the right expression travels up and over to the left. Nothing is mirrored. Every term keeps its sign and orientation. About 1 second, with tap-to-skip.
- Vocabulary: **Trade places**. Do not say "flip". "Flip" is reserved for signs (flip everything, a later card).
- Quiz: "Did trading places keep the balance?" (yes). Plus one contrast: "Changing the sign of just one term" (upsets).
- Then a worked L4 problem `7 = x + 3` showing both routes: (a) add −3 to both sides, or (b) trade places first. Neither is wrong.

### 3C. Cross the border tutorial (L6)

Numeric, `4 + 1 = 2 + 3` again, with a **move 1 across the = sign** option:
1. Student drags (or taps) the +1 across the border. It lands as +1 on the right: `4 = 2 + 3 + 1` → readout `4 = 6  Unbalanced ✗`.
2. Student taps the +1 to change its sign (it becomes −1 when it crosses): `4 = 2 + 3 + −1` → `4 = 4  Balanced ✓`. Go enables only when balanced.
3. The student may also change the sign of just one term anywhere and sees it upset the balance. Changing **every** sign on both sides keeps the balance (this foreshadows the "flip everything" card; here it is shown only, not required).
4. Quiz: "Crossing the border and **not** switching teams: keep or upset?" (upset). "Crossing and switching teams: keep or upset?" (keep).
5. Then L6 problems. Annotation on a completed move: "crossed the border, switched teams". Cross the border is **justified by the balance readout**, not described as shorthand for adding to both sides.

### 3D. Picture during problems

- **Boxes:** this card has exactly one box (x). The border is the = sign.
- **Counters:** + and − counters, **max 36 per side**. All problem numbers are chosen to stay readable (|numbers| ≤ 15).
- **L1-L2:** the student **builds** the equation from counters (tap a +/− chip to add one, tap a counter to remove it). Then performs moves on it.
- **L3:** counters arrive **pre-built**. Student performs moves on them.
- **L4+:** symbols only. The counter model appears only on request via the stuck ladder (rung 1).
- **Add to both sides (two actions):**
  1. Student picks an amount with the ± pad (no 0). Taps **Add to left** (or taps the left side). The amount appears as counters/term on the left, and the **tilt readout** shows "left heavier by n" (or lighter).
  2. A prompt appears: "Now add the same to the right." The amount is **pre-filled**; the student taps **Add to right**. Readout returns to Balanced. **Go** enables.
  3. Cancel pairs: student taps a + and a − (counter mode), or taps the pair (symbols) to cancel them. Cancelling is only accepted on a real +/− pair (tapping a lone number to "cancel" it shows unbalanced and is undoable).
  4. From L5, a combined **Add to both sides** menu button also appears (type the amount, one action). The two-action path remains available.
- **Undo:** always one tap, always visible.
- **Phones:** every tap target ≥ 44 px, picture fits 390 px wide, **every drag has a tap alternative** (tap term, then tap destination).

### 3E. Balance readout (above the equation)

- Numeric tutorial: shows both values (`5 = 5 ✓`).
- With x: shows **Balanced ✓ / Unbalanced ✗** plus a small tilt (which side is heavier, by how much), computed **only from the moves the student made**. It never shows or reveals the value of x. (Check: it must not be derivable from the hidden solution.)

### 3F. Lights (ranked; green / neutral / red)

Shown beside the equation after each **committed** move. Mid-move states are never judged (the equation is unbalanced by design during the two-action move).

| Rank | Light | Green | Neutral | Red | Active |
|---|---|---|---|---|---|
| 1 | **Fewer terms** | total terms decreased | unchanged | increased | from L1 |
| 2 | **x alone** | x is the only term on its side | not yet | (never red) | greyed out until a move has earned green on light 1 in this problem |
| 3 | **x on the left** | x alone is on the left | x alone is on the right | (never red) | L4+, greyed out until light 2 is green |

- Terms are counted after pairs cancel and like numbers combine **on the same side**.
- Only these lights appear on this card. No size or fraction lights yet (those arrive on later cards).
- Red example: `x + 3 = −6`, adding **+3** to both sides gives `x + 6 = −3`. Terms did not decrease, so it is red, with a teaching tip (§4).

---

## 4. Supports (the ladder)

**Principle:** supports are things the student **does**, not steps they watch. Every support ends by sending the student back to the answer pad.

### "I'm stuck" (just-in-time, one rung at a time; each click = +1 stuck count)
- **Rung 1: Counter mode.** The equation is drawn with manipulable counters (add n to the left, add n to the right, cancel pairs). In L1-L3 the student is already there, so rung 1 instead says: "Which number would cancel the +3?" and highlights the term. Ends with "Do you know x now?" and the pad.
- **Rung 2: Choose the move.** The menu shows only "Add ___ to both sides". The student picks the amount. A wrong amount is allowed (shows the result and the lights). Ends with the pad.
- **Rung 3: Guided move.** The amount that cancels the number next to x is highlighted ("−3 cancels +3"). The student still performs both add actions and the cancel. Ends with the pad.

### "Teach me step-by-step" (guided walkthrough)
The same loop on a **forced path**: all rungs are on, in order, leading to the answer, with **only the correct amount enabled**. The student performs every action (add to left, add to right, cancel pairs, type the answer). No exploring.

### Wrong-move ladder (a red or wrong committed move)
1. **First red:** show the result and the light. Offer **Undo** and a one-line tip, e.g. "Adding +3 made more terms. Try the opposite of +3." Undo is offered, not forced, so the student sees what happened.
2. **Second red in a row:** the same, **plus** counter mode opens (the stuck rung 1). This does not add to the stuck count.
3. **Third red in a row:** a **Start over** button appears next to Undo. The menu is **never** narrowed to the correct move (that would make the menu an answer key).

### "Do you know x?" (always on)
After every committed move a persistent prompt reminds the student they can type x. Mental math is welcome and never penalized.

### Early answer (a student types the answer before using moves)
- **Correct:** "Yes!" Then two things, both required before the problem is marked complete:
  1. **Check by dragging.** The student drags the typed value onto the x in the equation (tap alternative: tap value, then tap x). It replaces x. They click through the order of operations step by step (they do not need to calculate; the click-through shows each step), and see **Balanced ✓**.
  2. **First good move.** "Which move would get you there?" The student performs the first good move (add the opposite to both sides, two actions) on the equation.
  There is no stuck penalty for typing early.
- **Wrong:** the drag-check shows **Unbalanced ✗** and the step where it failed (e.g. `−3 + 3 = 0, not −6`). The student can then continue with moves or retype. This is discovery, not a stuck click.

### Convention nudge for `4 = x` (L4+)
- The moment the equation is `4 = x`, the **"x alone" light is green and the problem is credited** ("Yes!"). No gate, no penalty.
- First appearance: one quiet line, "You found it. We usually write x first, so everyone reads answers the same way." The **Trade places** button pulses once.
- Later appearances: just the pulsing button. From L5: the light **"x on the left"** alone.
- Never a blocking requirement. The typed answer is always `x = 4`, so the pad does not care which side x is on.

### Stuck count (teacher-visible)
Per level: number of **I'm stuck** clicks (and Teach me uses). Written to the anonymous class sheet with the scrambled id only. No other behavior data is required for this card (see §9 about undo counts and move badges).

---

## 5. What a wrong answer looks like (the slips)

Typed-answer slips. Each wrong typed answer is **tagged** by recognizing which mistake produces that exact answer. (Example numbers checked.)

| Slip | Example problem → wrong answer | Message the student sees | Rung it triggers |
|---|---|---|---|
| **Added the same number instead of its opposite** (b + a) | `x+3=−6` → **−3**; `x+4=−2` → **2** | "You added +3 to the right, but the +3 on the left needs its **opposite** to cancel. Try adding −3 to both sides." | Rung 1 |
| **Added the wrong opposite to the right** (added −a to the left, +a to the right, or the reverse) | `x−5=−2` → **−7** | "That's −5 on the left, which makes it −10, not a cancelled pair. To cancel a −5, add the opposite." | Rung 1 |
| **Ignored the number next to x** | `x+3=−6` → **−6** | "Put −6 back in for x: −6 + 3 = −3, not −6. What's still hiding next to x?" | Early-answer drag-check, then rung 1 |
| **Battle won by the wrong team / sign dropped** | `x+5=2` → **3** (correct −3) | "Battle! −5 and +2 fight. Which team has more?" | Rung 1 (counter mode, cancel pairs) |
| **Added the sizes of opposite numbers** (treated a Battle as a Party) | `x−5=−2` → **7** (correct 3); `x−3=−6` → **9** (correct −3) | "+5 and −2 are opposites, so it's a **Battle**, not a Party. Take the bigger side's sign." | Rung 1 |
| **Right size, wrong team** | `x+4=−2` → **6** (correct −6); `x+7=−5` → **12** | "Right size, wrong team. Put it back in: 6 + 4 is not −2." | Drag-check, then rung 1 |
| **Moved a term across without switching teams** (x on the right) | `7=x+3` → **10** (correct 4) | "The 3 changed sides but stayed +3. Put 10 back in: 10 + 3 is not 7." | Rung 1 |

Move-level slips (committed moves, judged by the lights):

| Slip | Example | What happens |
|---|---|---|
| **Adds the same sign** | `x+3=−6`, add +3 both sides → `x+6=−3` | Light 1 **red**. Tip: "Adding +3 made more terms. Try the opposite." Undo offered. |
| **Adds a partly-cancelling amount** | `x+3=−6`, add −5 both sides → `x−2=−11` | Light 1 **neutral**. Tip: "The +3 is still there, partly cancelled. What would cancel it all?" |
| **Adds to one side only** | adds −3 to the left, never the right | Tilt readout shows the imbalance. **Go** stays disabled. Tip: "Both sides must hold the same amount." |
| **Tries to cancel a lone number** | taps a +3 with no −3 | Nothing cancels. Tip: "Only a + and − pair can cancel." |

---

## 6. Words

Reuse the printed notes' words: **box, counters, border, Party!, Battle!, cancel pairs, add the opposite, balance, check**. We never say "take away from both sides" or "subtract from both sides"; the menu reads **"Add −3 to both sides."**

New or changed words:
- **Trade places:** the button that swaps the two sides. The sides rotate around the = sign. Not "flip", not "mirror".
- **Cross the border:** the L6 move where a term crosses the = sign and **switches teams** (printed notes: "Only things you can draw can cross the border. When they cross, they switch teams.").
- **Lights:** "Fewer terms", "x alone", "x on the left".
- The old card name **"Switch sides" is retired**. The printed notes still say "A · Switch sides" for the border-crossing move; see §9 for the notes update question.

---

## 7. Edge cases and limits

- **Answer never 0.** b is never 0. A problem is never already solved.
- **No repeated answers** within a level. Generator must also confirm no two problems in a level are the same equation.
- **Size limits:** all numbers |n| ≤ 15; max **36 counters per side**; one box. The counter picture for L1-L3 must fit a 390 px-wide screen.
- **Amount 0** is never selectable for "add to both sides".
- **Slip collisions:** the generator must confirm that no slip's wrong answer equals the correct answer (it can't when a ≠ 0), and should report problems where two slips share the same wrong answer (fine, but pick one message).
- **Automated check:** every generated problem is verified by substituting the answer into the equation. Never hand-typed banks.
- **Negative result display:** a Battle that leaves a negative (e.g. `x+5=2` → −3) must show the leftover counters on the correct side of zero.
- **Mid-move:** while the move is half-done (one add action made), lights are not judged, Go is disabled, and Undo must reverse **both** actions together.
- **Accidental balance in tutorials** (see §3A) must be excluded.
- **Trade places on a solved equation** (`x = 4`) is allowed, neutral, tip: "Same equation, new view."
- **Trade places on x-on-the-left problems** is allowed and neutral.

---

## 8. Diagnostic

- Sample: **one L2-type problem** (`x − a = b`, Battle) and **two L5-type problems** (one each from x-on-the-left and x-on-the-right), nothing marked until the end.
- Results (proposed, see §9): L2 wrong → opens **L1-L2** only. L2 right and L5 wrong → opens **L1-L4**. L5 both right → opens **L1-L5**. **L6 is never opened by a diagnostic**; it unlocks only by finishing L5 (and then its tutorial).
- **A diagnostic opens levels; the tutorial still runs in full at the start of the card and again at L4 (Trade places) and L6 (Cross the border).** Students still play every opened level.

---

## 9. Not decided / open questions

1. **Old-level mapping.** Claude Code has to read the real definitions of the old One-step L1-L2 and Switch sides levels, then propose a mapping from old completed levels to these six, so nobody re-earns anything. My guess: old One-step L1-L2 → new L1-L2; old Switch sides one-step → L3; x on the right → L4; negatives → L5. Not decided. The old One-step L3-L4 (multiply/divide) map to the next card, not this one.
2. **Tutorial completion bit.** Save codes hold one bit per level. Does the tutorial need its own bit (so it is not shown "again" in the same session), or does it simply replay each time the card is opened? Karl wants it experienced every time.
3. **Teacher data beyond stuck count.** Do you want undo counts and "moves used" in the class sheet? Not added.
4. **Move badges / prizes.** Idea: a badge the first time a student uses a *new* move and it earns a green light (not just any use, to avoid gaming). Needs a new data structure in save codes and sync. **Not in this spec.**
5. **Name for the L6 move.** "Cross the border" is a placeholder that matches the printed notes. Confirm or rename.
6. **Printed notes update.** The notes still call the border-crossing move "A · Switch sides". The notes need to match "Cross the border" and add "Trade places".
7. **Combined "Add to both sides" button at L5.** Confirm it should appear at L5 (single action with typed amount), or later.
8. **Counter mode on L1-L2.** The student *builds* the equation from counters at L1-L2 as the working surface, and rung 1 of "I'm stuck" is the same mode. Confirm that duplication is what you want (the rung then only adds a prompt).
9. **Diagnostic thresholds** in §8 are proposals.
10. **Progress loss on updates.** Not part of this card, but it must be fixed on the build list **before** rollout (progress sometimes disappears after a site update).
