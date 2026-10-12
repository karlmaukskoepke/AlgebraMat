# Divide it: solve `ax = b` by keeping 1/n of both sides  (Karl, 2026-10-11; status: designed)

Section: Solve it.   Prerequisite card(s): Group It (fractions of a group), Add to both sides (this card reuses its tutorial pattern, balance readout, lights, stuck ladder and early-answer path; see `SPEC-ADD-TO-BOTH-SIDES.md`).

**Fractions lead; division is the secondary readout.** Dividing both sides is taught as **taking a fraction of both sides** (`⅓` of 3 boxes is 1 box, `⅓` of −12 is −4). Division appears only as the small second line on the button.

---

## 1. The task

**Example:** `3x = −12`. The student sees 3 boxes on the left and 12 negative counters on the right (L1-L3), or just the symbols (L4-L5).

**What they do:** pick the button **`× ⅓`** (with **`÷ 3`** in small type beneath it). The −12 counters are then **shared evenly into 3 groups** by tapping each group (one counter per tap) while the 3 boxes on the left mirror the same 3 groups. When the groups are even and all 12 are used, the student keeps **one group** (⅓ of both sides). The readout shows `⅓(3x) = ⅓(−12)` and, below it, the simplified `x = −4`.

**What they type:** one whole number (`−4`) on the existing integer pad.

**Card-wide rules**
- **Positive coefficients only.** `−x = b` and `−3x = b` belong to the next card (**Flip it**). `x/a = b` belongs to **Fraction equations**.
- **Every problem has a whole-number answer.** The coefficient always divides the right side.
- **No streaks.** Only a stuck count (see §4).
- **Typing early is allowed** at any time (see §4).
- **The card opens with the numeric tutorial** for every student, even those a diagnostic opened levels for.
- **The menu always shows all five fractions** (`½ ⅓ ¼ ⅕ ⅙`). Wrong ones are allowed to fail visibly. The menu is never narrowed to the right answer.
- The tools shown are only fraction buttons, deal/keep, Undo and the answer pad. No add-to-both-sides on this card.

---

## 2. Levels (6 in the save code; L6 is reserved and not shown)

Five problems per level, **no repeated answers within a level**, answers never 0 and never ±1.
"Counter cap": the right side never has more than **36 counters**. The picture allows up to **6 boxes** on this card (raised from 5).

| Level | Forms | Numbers | What's new | Working surface |
|---|---|---|---|---|
| **L1** | `ax = b`, a = 2 or 3 | answer 2-5 (so b ≤ 15 counters), positive and negative | The first fraction move. Deal by hand, then keep one group. Wrong fractions fail visibly. | Counters, student deals by hand |
| **L2** | `ax = b`, a = 2-5 | answer 2-6 (b ≤ 30) | More boxes and counters. Same moves. | Counters, deal by hand |
| **L3** | `ax = b`, a = 2-5 | b up to 36 counters | **Deal a round** button (one counter to every group). Groups arrive pre-built. Symbols shown alongside. | Counters, pre-built groups |
| **L4** | `ax = b`, a = 4 or 6 (composite) | b up to 36 | Several fractions are legal (`½`, `⅓`, `¼`, `⅙` as the numbers allow). Each earns green on "Smaller numbers" but may not finish. Student takes a fraction twice. Adds the second light "One box". | Symbols only. Counter mode on stuck rung 1. |
| **L5** | `ax = b`, a = 2-6, mixed | b up to 36 | Mixed, symbols only. One-screen bridge: "⅓ of 12 and 12 ÷ 3 are the same thing" (see §9). Mastery gate for the next card. | Symbols only |
| **L6** | reserved | n/a | A bit is reserved for later. Not displayed. | n/a |

**Form counts per level**
- **L1:** at least 2 of each coefficient (2 and 3). At least 2 negative and 2 positive answers.
- **L2:** at least 1 of each of a = 2, 3, 4, 5. At least 2 negative and 2 positive answers.
- **L3:** at least 2 negative and 2 positive answers.
- **L4:** at least 2 of each of a = 4 and 6. At least 2 negative and 2 positive answers. At least 2 problems where two different first fractions are legal.
- **L5:** at least 2 negative and 2 positive answers. At least one problem for each of a = 2, 3, 4, 5, 6 across the level is not required, but at least 3 different coefficients must appear.

**Sample banks (answers checked by substitution; the generator must do the same automatically)**
- L1: `2x=−10` → −5 · `3x=−12` → −4 · `2x=8` → 4 · `3x=9` → 3 · `2x=−6` → −3
- L2: `4x=−20` → −5 · `5x=15` → 3 · `2x=−14` → −7 · `4x=24` → 6 · `5x=−10` → −2
- L3: `3x=−21` → −7 · `5x=30` → 6 · `4x=−32` → −8 · `2x=18` → 9 · `3x=15` → 5
- L4: `6x=12` → 2 · `6x=−18` → −3 · `4x=−24` → −6 · `6x=30` → 5 · `4x=16` → 4
- L5: `5x=−35` → −7 · `6x=−30` → −5 · `3x=24` → 8 · `2x=26` → 13 · `4x=−36` → −9

---

## 3. The model / picture

### 3A. Numeric tutorial (opens the card, every student, every time)

Equation with no unknown: **`3 × 4 = 2 × 6`**, readout **`12 = 12  Balanced ✓`**.

1. **Take ⅓ of the left only.** Readout: `⅓(3 × 4) = 2 × 6` → `4 = 12  Unbalanced ✗`, with a tilt showing the right side heavier.
2. **Take ⅓ of the right as well.** Readout: `⅓(3 × 4) = ⅓(2 × 6)` → `4 = 4  Balanced ✓`. **Go** enables only when balanced.
3. **Try other fractions.** `½` on both sides gives `6 = 6 ✓`. `½` on the left and `⅓` on the right gives `6 = 4 ✗`. `⅕`: the 12 counters are dealt into 5 groups and 2 are left over ("12 can't make 5 equal groups"), so the move can't finish. Undo.
4. **Quiz (3 items):** "Did it keep the balance or upset the balance?"
   - ⅓ of the left side only → **upsets**
   - ⅓ of both sides → **keeps**
   - ⅓ of the left and ½ of the right → **upsets**
   A wrong answer shows a **side-by-side** of the two equations with their readouts. The student retries that item.
5. **Counters with a box:** `3x = 6`. Three boxes on the left, 6 positive counters on the right. The student picks `× ⅓`, deals the 6 into 3 groups (2 each), keeps one group → `x = 2`. The readout shows **tilt only** and never the solution.
6. **Symbols:** `⅓(3x) = ⅓(6)` → `x = 2`.

Tutorial numbers must not balance by accident: both sides are the same value, so any matching fraction balances and any mismatched pair does not. The generator checks that no quiz item balances unexpectedly.

### 3B. The picture during problems

- **Pile and groups.** Right side: a pile of counters (all the same sign). Left side: the boxes. The student taps a fraction button (for example `× ⅓`) and **3 empty groups appear on the right**; the 3 boxes on the left **separate into the same 3 groups** (mirroring).
- **Dealing.** Tapping a group moves one counter from the pile into it. **Deal a round** (L3 onward) puts one counter into every group.
- **Two readouts while dealing:** a count ("9 of 12 shared") and an evenness check ("groups hold 4, 3, 2"). **Go/Keep** enables only when all are shared and the groups are equal.
- **Keep one group.** The student taps one group to keep. The other groups fade on **both** sides at once. That tap is "⅓ of both sides". Tapping a different group moves the selection. Only one group can be kept.
- **Wrong fraction (shown, not committed).** The fraction can fail on either or both sides, and the picture shows whichever breaks:
  - `3x = −12` with `½`: the 3 boxes can't make 2 equal groups (one box left over). Message: "3 boxes can't make 2 equal groups."
  - `3x = −12` with `¼`: −12 splits into 4 groups of −3, but the 3 boxes leave one group with no box. Same message pattern.
  - `3x = −12` with `⅕`: both fail (3 boxes, and 12 leaves 2 over).
  The student taps **Undo / Try another fraction**. The failed attempt counts toward the wrong-move ladder (§4).
- **Phones:** secondary. Chromebooks and laptops first. Every drag still has a tap alternative (tap the pile, then tap the group), since many Chromebooks are touch.

### 3C. The readout (the record)

The record shows the move on **both whole sides, in parentheses, with the fraction outside**, then the simplified result:

```
⅓(3x) = ⅓(−12)
   x  =   −4
```

For a partial move on `6x = 12`: `½(6x) = ½(12)` → `3x = 6`. No big division bar and no `÷3 ÷3` record. Division appears only as the small `÷3` line on the button.

### 3D. The button

Stacked vertically: **`× ⅓`** large on top, **`÷ 3`** small beneath. Menu: `×½/÷2`, `×⅓/÷3`, `×¼/÷4`, `×⅕/÷5`, `×⅙/÷6`. The word "take" is not on the button. The annotation after a completed move reads "⅓ of both sides".

### 3E. Lights (ranked **per level**; green / neutral / red)

| Level | Lights | Rule |
|---|---|---|
| L1-L3 | **Smaller numbers** only | Green when every number in the equation gets smaller in absolute value. Neutral if unchanged. |
| L4-L5 | **1. Smaller numbers**, **2. One box** | "One box" (coefficient is 1) is greyed out until "Smaller numbers" is green. On a prime coefficient both go green at the same time. |

- These lights never go red on this card. A fraction that doesn't split evenly is a **failed attempt** (shown and undone), not a committed move.
- Fraction lights ("no fractions left in the problem") arrive on the Fraction equations card and outrank size there.
- The label **"Box alone"** from the pilot is not used on this card, since a box alone on its side is true from the start.

---

## 4. Supports (the ladder)

Supports are things the student **does**. Each one ends by sending them back to the answer pad.

### "I'm stuck" (one rung at a time; each click = +1 stuck count)
- **Rung 1:** counter mode (already on in L1-L3, where this rung instead prompts: "How many boxes? What would share the −12 among them?"). Ends with "Do you know x now?" and the pad.
- **Rung 2:** the number in front of x is highlighted ("3 boxes"). Prompt: "Which fraction keeps one box?" The student picks. A wrong pick fails visibly. Ends with the pad.
- **Rung 3 (guided):** the matching fraction button is highlighted. The student still deals every counter and keeps a group.

### "Teach me step-by-step"
The same loop on a **forced path**: only the correct fraction is enabled, the student performs every deal and the keep, then types the answer. No exploring.

### Failed-attempt ladder (a fraction that doesn't split evenly)
1. **First failed attempt:** show the picture, name the side that broke, offer **Undo / Try another fraction**.
2. **Second in a row:** same, plus counter mode opens (stuck rung 1, no stuck count added).
3. **Third in a row:** a **Start over** button appears. The menu is never narrowed.

### "Do you know x?" (always on)
After every move, the pad is a prompt away. Mental math is welcome.

### Early answer (typed before using moves)
- **Correct:** "Yes!" Then two required steps: (1) **drag the value onto x** (tap alternative: tap the value, then tap x) and click through the order of operations (`3 × (−4)` → `−12`) to see **Balanced ✓**; (2) **perform the first good move** (pick the fraction, deal or symbol-keep).
- **Wrong:** the drag-check shows **Unbalanced ✗** and where it failed. The student can retype or continue with moves. This is discovery, not a stuck click.

### Stuck count (teacher-visible)
Number of "I'm stuck" clicks and Teach me uses per level, anonymous (scrambled id only), as in the pilot.

---

## 5. What a wrong answer looks like (the slips)

Typed-answer slips (each wrong answer tagged by the mistake that produces exactly that number; all values checked):

| Slip | Example → wrong answer | Message the student sees | Rung |
|---|---|---|---|
| **Undid addition** (−12 + 3 or −12 − 3) | `3x=−12` → **−9** or **−15** | "3x means 3 boxes, not 3 more. Share the −12 among the 3 boxes." | 1 |
| **Multiplied** | `3x=−12` → **−36** | "Three boxes with −12 in each would be −36. We want what's in **one** box." | 1 |
| **Gave the number of boxes** | `3x=−12` → **3** | "3 is how many boxes. How many negatives are in each one?" | 1 |
| **Ignored the number in front** | `3x=−12` → **−12** | "Put −12 back in: 3 boxes of −12 is −36, not −12." | drag-check, then 1 |
| **Right size, wrong team** | `3x=−12` → **4** | "Right size, wrong team. 3 boxes of +4 is +12, not −12." | drag-check |
| **Wrong number of groups** | `3x=−12` → **−6** (÷2) or **−3** (÷4); `4x=24` → **8** (÷3) | "You shared into 2 groups, but there are 3 boxes. One group per box." | 1 or 2 |
| **Stopped halfway** | `6x=12` → **6** (after ½) or **4** (after ⅓); `6x=−18` → **−9** or **−6**; `4x=24` → **12** | "6 is what's in each **group of 3 boxes**. Keep going until it's one box." | 2 |

Move-level slips:

| Slip | Example | What happens |
|---|---|---|
| **Fraction doesn't split the boxes** | `3x=−12`, `×½` | Failed attempt on the left. Picture and message name the left side. Undo offered. |
| **Fraction doesn't split the counters** | `3x=−12`, `×⅕` | Failed on both sides. Picture names both. Undo offered. |
| **Uneven deal** | taps one group five times, another once | Evenness readout shows "groups hold 5, 1, 0". **Keep** stays disabled. |
| **Keeps the wrong number of groups** | taps two groups | Only one group can be kept. Selection moves. |

---

## 6. Words

Reuse: **box, counters, border, balance, check, groups, a fraction of a group** (Group It's wording). The printed notes' "share the other side evenly, one share per box" is kept for the dealing action.

New or changed:
- **Divide it:** the card name. Replaces "Share it" (sharing is easy to confuse with other meanings; taking a fraction of something is dividing it).
- **`× ⅓` / `÷ 3`:** the stacked button. The fraction is the main label.
- **Keep one group:** the action that finishes the move ("⅓ of both sides").
- The record is written as `⅓(3x) = ⅓(−12)`, never `÷3 ÷3`.
- Say "split the **boxes** into 3 equal groups" (a set of boxes), not "split the box into 3 parts". The printed notes use "split the box into 3 equal parts" for **one** box (Fraction equations). Keep the two apart.

---

## 7. Edge cases and limits

- **Whole numbers only:** a always divides b. Answers are never 0 and never ±1. b is never ±a.
- **No repeated answers** within a level; no two identical equations.
- **Counter limits:** right side ≤ 36 counters; ≤ 6 boxes; deal-by-hand cap is about 15 counters in L1 and 30 in L2.
- **Automated check:** every problem is verified by substitution. Every slip's wrong answer is verified to differ from the correct answer.
- **Composite coefficients (L4):** list all legal fractions per problem (every common divisor of a and b, other than 1). The generator must confirm at least two different first fractions are legal in at least 2 problems.
- **No divisor above 6** in the menu. No negative fractions in the menu.
- **L5 symbols-only:** stuck rung 1 opens counter mode, so b stays ≤ 36 (see §9 for larger values).
- **Accidental balance in tutorials** (§3A) is excluded.

---

## 8. Diagnostic

- Sample: **one L2-type, one L4-type, one L5-type** problem, nothing marked until the end.
- Proposed results: L2 wrong → opens **L1-L2**. L2 right and L4 wrong → **L1-L3**. L4 right and L5 wrong → **L1-L4**. L5 right → **L1-L5**.
- **A diagnostic opens levels; the numeric tutorial still runs in full at the start of the card.** Students still play every opened level.

---

## 9. Not decided / open questions

1. **Old-level mapping:** old One-step `ax = b` (old L3) and mixed (old L5) should map to this card. Claude Code must read the real old definitions and propose a mapping so nobody re-earns anything. `x/a = b` maps to Fraction equations. `−x = b` maps to Flip it.
2. **The ÷ bridge at L5.** The `÷ 3` line is on every button from L1. Do you also want a one-screen bridge at L5 explaining that ⅓ of 12 and 12 ÷ 3 are the same thing, or is the always-visible small line enough?
3. **Printed notes.** The notes' page is titled "Sharing Among Boxes" and the new card is "Divide it". Update one or the other?
4. **Keep tap.** The keep-one-group tap is the single action on both sides. Confirm that is acceptable (the numeric tutorial and the readout carry the "both sides" idea), or whether the keep should happen automatically once the groups are even.
5. **Larger values in L5.** You said larger values can come as dealing becomes more automatic. If L5 should exceed 36 counters, stuck rung 1 needs grouped counters ("×5 each"). Not specified.
6. **Deal a round at L3.** Confirm L3 (rather than earlier or later).
7. **Light wording.** "Smaller numbers" and "One box" are working labels. Confirm they match how you say it.
8. **Failed attempts.** They count toward the wrong-move ladder but never toward the stuck count. Confirm.
9. **Prerequisite gate.** Does this card open after finishing the Add to both sides card, or after L3 of it?
