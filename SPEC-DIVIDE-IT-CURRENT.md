# Divide it: solve `ax = b` by taking a fraction of both sides  (current spec, as built; 2026-10-12)

**Status.** This is the spec as it is actually built and live (the original `SPEC-DIVIDE-IT.md` rewritten on the light-build pattern, with the build notes folded in). It does **not** yet include `SPEC-SOLVE-IT-LOOP.md` rev 1.0 (the shared loop): the changes that the loop will make to this card are listed in §10. Where this spec and the loop disagree, the loop wins once it is built.

Section: Solve it (after Add to both sides).   Prerequisite card(s): Group It (fractions of a group), Add to both sides.

**Fractions lead; division is the secondary readout.** Dividing both sides is taught as **taking a fraction of both sides** (`⅓` of 3 boxes is 1 box, `⅓` of −12 is −4). Division appears only as the small second line on each fraction button.

---

## 1. The task

**Example:** `3x = −12`. The student chooses **Use a move**, chooses **Take a fraction of both sides**, and taps **`× ⅓`** (with **`÷ 3`** in small type beneath it). One tap takes ⅓ of **both** sides. The work stack shows `⅓(3x) = ⅓(−12)` (the fraction in blue) and then `x = ⅓(−12)`. The right side is **not** simplified, so the student works out **−4** and types it into the `x = [▁]` row. The check follows: `3 × (−4) = −12`, `−12 = −12`, `✓ Balanced`.

**What they type:** one whole number on the integer pad. **The solved value is never displayed** before the student types it (the one exception is the watched numeric walkthrough).

**Card-wide rules**
- **Positive coefficients only.** `−x = b` belongs to the next card (**Flip it**); `x/a = b` belongs to **Fraction equations**.
- **Every problem has a whole-number answer.** The coefficient always divides the right side. Answers are never 0, never ±1, and never equal to a.
- **No streaks.** Only a stuck count.
- **Typing a guess is allowed** at any time (Guess x).
- **The menu always shows all five fractions** (`½ ⅓ ¼ ⅕ ⅙`). Wrong ones fail visibly; the menu is never narrowed.

---

## 2. Levels (6; Level 1 is numeric)

Five problems per level, **no repeated answers**, answers never 0 and never ±1. At most **36 counters** on the right and **6 boxes**.

| Level | What it is |
|---|---|
| **L1** | **Numeric** (no x). `3 × 4 = 2 × 6`-type items on a balance readout (see §3A), then a watched `3x = 6`. |
| **L2** | `ax = b`, a = 2 or 3, answers 2–5 in size (b ≤ 15), positive and negative. |
| **L3** | `ax = b`, a = 2–5, answers 2–6 (b ≤ 30). |
| **L4** | `ax = b`, a = 2–5, b up to 36. **Deal a round** is available in the counters scaffold. |
| **L5** | `ax = b`, a = 4 or 6 (composite): several fractions are legal; one takes it to one box, the others are partial moves. |
| **L6** | `ax = b`, a = 2–6 mixed, b up to 36. |

(The original spec's levels 1–5 are this card's Levels 2–6.)

**Form counts:** L2: at least 2 of each a (2 and 3), at least 2 negative and 2 positive answers. L3: at least 1 of each a = 2, 3, 4, 5, at least 2 negative and 2 positive. L4: at least 2 negative and 2 positive. L5: at least 2 of each of a = 4 and 6, at least 2 negative and 2 positive. L6: at least 2 negative and 2 positive, at least 3 different coefficients.

**Sample bank (the generator verifies every problem by substitution; no hand-typed banks):** `2x=−10` → −5 · `3x=−12` → −4 · `5x=15` → 3 · `4x=−20` → −5 · `6x=−18` → −3 · `5x=−35` → −7.

---

## 3. The screen and the picture

### 3A. Level 1 (numeric)
`3 × 4 = 2 × 6` with a readout (`12 = 12  Balanced ✓`). Five items, each ending in a green Next; nothing advances on a timer.
1. **Do (⅓):** choose *Take a fraction of both sides*, then **Take ⅓ of the left** (`⅓(3 × 4) = 2 × 6`, `4 ≠ 12  Unbalanced ✗`), then **Take ⅓ of the right** (`4 = 4  Balanced ✓`), then Go.
2. **Do (½):** the same with ½ on another equation.
3. **Quiz:** "What happens if we **TAKE ⅓ of ONE SIDE ONLY**? Does it keep the balance, or upset it?"
4. **Quiz:** "… **TAKE ⅓ of BOTH SIDES**?"
5. **Quiz:** "… **TAKE ⅓ of the LEFT and ½ of the RIGHT**?"
- After either answer the work shows what happened (the equation, what each side comes to, ✓ Balanced / ✗ Unbalanced), says whether the guess was right, and waits for the green Next. **No retry.** The room for it is reserved above the question, so nothing moves.
- **Final walkthrough** (watched, no typing, every step stays on screen): `3x = 6` → `⅓(3x) = ⅓(6)` → `x = ⅓(6)` → `x = 2` → plug in: `3 × 2 = 6 ✓ Balanced`. Takeaway: "Taking a fraction of both sides can leave one box."
- No I'm stuck / Teach me on Level 1. (There is no seesaw picture yet; only the readout.)

### 3B. Levels 2–6: the bare screen
Top to bottom: **the line** (a coloured box, centred, one sentence at a time); **the work stack** (the equation, each move under it, the `x = [▁]` row with **Check ✓** under it and the green **Next** beside it, the substitution); the **fractions row** ("Take × ½ × ⅓ × ¼ × ⅕ × ⅙ of both sides", each button stacked `× ⅓` over `÷ 3`), shown once the move is chosen; **Undo**; the **help row** (I'm stuck, Teach me step-by-step, Start over); the number pad. On the right, the **Move / Why?** panel (§4).

- **Guess x or Use a move** is chosen first; the other is greyed. (Under the loop this becomes per-state; see §10.)
- **Choosing the move:** tap *Take a fraction of both sides* in the panel, then a fraction. **Enter** moves forward through Check, any Next, or Go.
- **One action:** the fraction is taken of **both** sides at once. The work stack gets `⅓(3x) = ⅓(−12)` (fraction in blue) and the new equation. On the move that finishes (x alone), the right side stays as `x = ⅓(−12)` until the student types the value; on a partial move it shows the smaller numbers (`½` on `4x = 24` → `2x = 12`).
- **A fraction that doesn't split** (the boxes or the counters don't make n equal groups) is a **failed attempt**: its row is shown in red with ✗, the line says which side broke ("3 boxes can't make 2 equal groups", "12 can't be shared into 5 equal groups (2 left over)"), **Undo** is highlighted, a new try replaces it, and three in a row offer Start over. A failed attempt counts toward that ladder and never toward the stuck count.
- **Plugging back in** (every typed value): the original equation is outlined ("plugging back into this equation") with its x in blue, the value is blue in the first line (in parentheses when negative), and the check is written a line a click: `3 × (−4) = −12`, `−12 = −12`, `✓ Balanced`. A wrong guess ends red with Undo highlighted, then "Let's make the equation simpler first." A correct guess forces the next problem to be a move (and adds a sixth, move-only problem if it was the last).
- **Layout is stable;** nothing advances on a timer.

### 3C. The counters scaffold (from I'm stuck and Teach me)
- The **boxes** on the left and the **pile** of counters on the right (the size of the number on the right, at most 36, all one sign).
- Choosing a fraction that splits both sides draws **n empty groups** on the right and splits the boxes into the same n clusters on the left.
- **Dealing:** tapping a group gives it one counter. **Deal a round** (one to every group, only while a whole round is left) is available from Level 4. Under the model: "9 of 12 shared · groups hold 4, 3, 2".
- **Keeping:** once every counter is shared evenly, the groups become tappable; tapping one keeps it, which takes that fraction of both sides. Keeping early says how many are still in the pile; uneven groups say what they hold.
- **Undo** takes the whole attempt back. While counters are being dealt the fraction row is hidden to save room.
- Not built: the other groups fading on both sides when one is kept.

---

## 4. The Move / Why? panel and the lights

- **Move list (same on every card):** Add ___ to both sides, Cross the border, **Take a fraction of both sides (active here)**, Multiply both sides by ___, Flip everything, Trade places, Distribute, Combine like terms. Each is an icon; the name pops up outside the box on hover; greyed moves are a grey fill with a dark grey dashed edge.
- **Why? boxes beside their moves:** Fewer terms (Add, Cross the border); **No fractions, Smaller numbers, One box** (the fraction and multiply moves); No opposite box (Flip everything); x on the left (Trade places); Each side simplified (Distribute, Combine); **Solved for x** at the bottom.
- **Judged on this card:** **Smaller numbers** (green after a move that splits both sides) and **One box** (green when the coefficient is 1, grey until then). They never go red. The other boxes follow the good move (green together, faint until then). The lights are an **unranked checklist**.

---

## 5. Help

- **I'm stuck (one rung per click; each click is +1 stuck count):** 1) the number in front of x is outlined and the line asks "What fraction of both sides leaves one box?" with the fraction row open; 2) **the counters appear** (§3C); 3) the right fraction button is highlighted.
- **Teach me step-by-step:** the counters up, only the right fraction accepted, the student performs every action and types the answer.
- With x alone, I'm stuck just says to work out x.

---

## 6. What a wrong answer looks like (the slips)

One tag per wrong value, in this priority order, each with its message (shown after the substitution, in the line):

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

The generator confirms no slip's wrong answer equals the correct answer; answers equal to a are dropped for that reason.

---

## 7. Words

**box, counters, groups, a fraction of a group, balance, check.** The card is **Divide it** (replacing "Share it" and the printed notes' "Sharing Among Boxes", which is to be renamed). The button is `× ⅓` over `÷ 3`; the fraction is the main label. The record is `⅓(3x) = ⅓(−12)`, never `÷3 ÷3`. Say "split the **boxes** into 3 equal groups" (a set of boxes), not "split the box into 3 parts" (that is Fraction equations).

---

## 8. Progress, diagnostic, old levels

- **Save code v14** holds Divide it's six levels (16 data symbols; v13 codes still read).
- **Old levels map forward** (nobody re-earns): old One-step `ax = b` (level 3) credits Divide it **Level 2**; the old mixed level (5) credits **Level 3**; Level 1 is never credited; Levels 4–6 are new.
- **Diagnostic (3 problems):** one problem each of the original spec's L2, L4 and L5 types (the card's Levels 3, 5 and 6), nothing marked until the end. A wrong first opens Levels 1–2; right then wrong, 1–4; then 1–5; all right, 1–6. A right first problem **skips Level 1** (it is marked done; the student can still play it).
- **Teacher data:** stuck and Teach me counts per level, anonymous.

---

## 9. Edge cases and limits

- Whole numbers only; a always divides b; answers never 0, ±1 or a; b is never ±a.
- ≤ 36 counters on the right, ≤ 6 boxes, no divisor above 6 in the menu, no negative fractions.
- Every problem is verified by substitution. No repeated answers or equations within a level.
- Phones are secondary; every drag has a tap alternative.

---

## 10. What the Solve it loop (rev 1.0) will change here, and what is still open

**Changes the loop makes to this card (not built yet):**
1. **The choice is per equation state, not per problem.** After a partial move (`4x = 24` → `2x = 12`) the choice (guess or move) comes back.
2. **Guesses at any state:** a wrong guess is checked in the **current** equation; a correct answer or a wrong value, in the **original**. The next problem is forced to be a move **only** when the correct guess came at the first state with no move made.
3. **Moves:** a helpful move writes the new equation and waits for a green **Next**, which **folds** the move to one row and brings the choice back; **Undo** reaches only the current, unfolded move and returns to the same state with the choice showing.
4. **Start over** is always live (greyed only on the untouched original); it no longer depends on three failed attempts.
5. **Substitution highlighting:** the operation about to happen is underlined in the accent colour, its result appears in the next line in the same colour; the typed value is **dragged onto x** first (tap alternative) on full-check levels.
6. **I'm stuck rungs restart at each new equation state.**
7. **Lights stay an unranked checklist** (already the case).

**Open (needs your decision):**
- Whether the **counters scaffold** should also show the other groups fading when one is kept.
- **Level 1** has a readout but no seesaw picture; add one?
- **Level 4+ Deal a round**: confirm it should arrive at the card's Level 4 (the original spec's L3).
- The **greyed-move messages** ("unlocks on a later card" vs "you don't need that move here").
- Renaming the printed notes' "Sharing Among Boxes" to "Divide it".
