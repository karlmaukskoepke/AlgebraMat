# Flip everything: solve equations where x has a minus  (Karl, 2026-10-12; revision 1.2, 2026-10-21; status: built in basic form, Build J)

**Follows `SPEC-SOLVE-IT-LOOP.md` rev 2.2** (including "Never grey out what the question is about" and its conformance checklist). Everything shared (the screen, x = at every state, the forced-move rule, the check, Undo and Start over, folding, the help ladder, generator rules) is the loop's and wins any conflict. This spec states only what is specific to this card.

**Revision 1.2 (Build J)** rewrites rev 1.0 (written before the light design) to match what is built. It drops the Guess x / Use a move choice, the Why? boxes beside each move, the two-action flip, the seesaw and dealing scaffolds and Teach me (none are in basic form), and names the card "Flip everything". Rev 1.1 was never in the repository. Where this file and the Build J brief differ, the brief won.

Section: Solve it, after Divide it and before One-step equations. Card id **`flip-everything`** (`flipit` is Count it's subtraction card). Prerequisite: Divide it (Take a fraction). Old levels: none map here (there was never an old `−x = b` level). No diagnostic.

---

## 1. The task

**Example:** `−x = 12`. The student uses **Flip everything** (multiply both sides by −1). The work row is `−1 × (−x) = −1 × (12)` and the new equation is `x = −(12)`: the other side is **not** worked out. The student types **−12**; the check is `−x = 12`, under it `−(−12) = 12`, then `12 = 12 ✓ Balanced`.

**With a number in front:** `−3x = 12`. Every order is helpful:
- **Flip, then a fraction:** `3x = −12` (a flip that does not finish shows the new numbers), then ⅓ of both sides: `⅓(3x) = ⅓(−12)` → `x = ⅓(−12)`.
- **A fraction, then flip:** ⅓ of both sides gives `−x = 4`, then the flip gives `x = −(4)`.
- **−⅓ in one move** (Karl: accept both): `−⅓(−3x) = −⅓(12)` → `x = −⅓(12)`.

The student always types the value. **The solved value is never shown** before it is typed.

**Words:** box, counters, balance, check, the opposite of. **Flip everything** is the move; "multiply both sides by −1" is what it does, and the hints say both.

---

## 2. Levels (saved 1-6, shown 1-5)

Five problems per level, no repeated answers or equations, whole answers never 0 or ±1, and never ±a when a ≥ 2. Every problem is built from its answer and checked by substitution in code. |b| ≤ 36 (the loop's counter limit).

| Saved | Shown | Forms | Numbers | Mix |
|---|---|---|---|---|
| 1 | — | numbers only ("See why it works") | — | **not built**: no button on the card; a link to it plays saved Level 2 |
| 2 | 1 | `−x = b` | \|b\| 2-15 | ≥ 2 positive b, ≥ 2 negative b |
| 3 | 2 | `b = −x` | \|b\| 2-15 | the same; Trade places live |
| 4 | 3 | `−ax = b` | a 2-6, \|x\| 2-9 | ≥ 3 different a; ≥ 2 positive, ≥ 2 negative b; fractions live |
| 5 | 4 | all four: `−x = b`, `b = −x`, `−ax = b`, `b = −ax` | a = 1: \|x\| 2-12; a 2-6: \|x\| 2-9 | one of each form; ≥ 2 with x on the right; both signs of b |
| 6 | 5 | the same forms, bigger | a = 1: \|x\| 8-20; a 2-4: \|x\| 5-18 | ≥ 3 answers of 8 or more in size |

Levels unlock in order. Tested on 200 seeds per level (`tests/flip.test.js`).

---

## 3. Moves (the shared panel, as it is)

| Move | Where | Live |
|---|---|---|
| **Flip everything** | the panel's Flip button, and Multiply's **−1 × ( )** option (the same move) | every level |
| **Take a fraction** | Multiply's **▢ over ▢** option: the shared move, blank, preview and fraction-cycle feedback of Divide it (`engine/fractionMove.js`, `engine/multiplyMenu.js`, `view/multiplyRow.js`). The top may be −1 (−⅓ in one move) | from saved Level 4; before that it says "That move unlocks on a later level." |
| **Trade places** | the panel's Trade button, when x is on the right | from saved Level 3; not required (flip first is fine). The first time in a level, Add to both sides' pop-up points it out, now with "This is the symmetric property: if a = b, then b = a." (on both cards) |
| Add; Multiply by a whole number | greyed | "That move unlocks on a later card." |

**Hover** a move to see its preview under the equation (`−1 × (−x) = −1 × (12)`, dashed and grey); **click** to make it solid; the green **Go** applies it.

**Judging (a legal move is never red):**
- **Helpful:** a flip when x has a minus; any fraction that splits (the number in front of x gets smaller), including −⅓ in one move.
- **Unhelpful:** a flip when x has no minus (`3x = −12` → `−3x = 12`). Spotlight: the new `−3x` framed in red, labelled "x has a minus", the new equation lit, and "Flipping 3x = −12 made −3x = 12: now x has a minus. Press Undo." Undo, then the hint for `3x = −12`.
- **A fraction that does not split:** Divide it's shared feedback ("3 boxes can't make 2 equal groups…"), Undo, then the boxes and counters with the fractions to choose from, the ones tried crossed off.

**Lights (Goals):** **No opposite box** (beside Flip): green when the move took the minus off x, red when it put one on, grey otherwise. **Solved for x:** x alone with a plain 1 in front. Every other light stays in the dashed off state. (Divide it's Smaller numbers now compares by size, so it works with negative coefficients; Divide's own results are unchanged.)

---

## 4. Shapes and help (basic form)

The classifier reads this card's boards with its own family (`shapeOfBoard(board, 'flip')`), sign-normalised, either side (x on the right is the same id with `r`):

| Shape | Board | Reminder (I'm stuck, and the hint after Undo) |
|---|---|---|
| **F1** | `−x = b` | "−x means x has a minus. To get rid of it, multiply both sides by −1: Flip everything." The Flip button lit, its preview on the equation |
| **F2** | `−ax = b` | "−3x has a minus. To get rid of it, multiply both sides by −1: Flip everything. Then take ⅓ of both sides." Flip lit and previewed |
| **F3** | `ax = b` (after a flip) | Divide it's reminder: "To get one x, take a fraction of both sides: one of the 3 x boxes is ⅓." Multiply's fraction option lit and previewed |
| **F4** | `x = −(b)` | "x is alone. −(12) means the opposite of 12. Work it out and type x." x = lit |
| **F5** | `x = ⅓(b)` or `x = −⅓(b)` | "x is alone. ⅓(−12) is 1 of 3 equal groups of −12. Work it out and type x." x = lit |
| **FF** | a fraction that does not split | waits for Undo (the loop's "Undo first"), then the fraction cycle |

Each reminder is one rung that repeats, recorded as **`hint`**. **Not built yet:** Teach me, the seesaw, counters and the opposite-box picture, the numeric "See why it works".

**Misconceptions (by typed value), with the existing tags:**
- **`sign-flipped`** (12 for `−x = 12`, 4 for `−3x = 12`) and **`ignored-front`** (±b for `−3x = 12`): after the check and Undo, "−x = 12 means the opposite of x is 12, so x is not 12. Flip everything: multiply both sides by −1." (with a number in front: "In −3x = 12 the minus belongs to x. Flip everything first…"), Flip lit with its preview.
- **`gave-boxes`** (±a), **`unmatched`**: the shape's reminder.
- For `−x = b`, `b` is also `−x`, so `sign-flipped` and `ignored-front` always collide; the tag order makes it `sign-flipped` (reported by the generator).

---

## 5. The check, the forced move, the rows

- The check is the loop's (§4): `−x = 12`, x = −12 → `−(−12) = 12`; `12 = −x` → `12 = −(−12)`; `−3x = 12`, x = −4 → `−3 × (−4) = 12`. Single-step card: never collapsed.
- Forced move: as the loop. After a correct first guess, the next problem greys x = until one move is made; the needed move (Flip when x has a minus) is ringed.
- Worst case (generator report, 200 seeds): saved Level 2: 9 rows counted as one column; Levels 3-4: 10; Levels 5-6: 11 (x on the right with a number in front: the original, Trade places, a folded flip, the fraction's work row and equation, x =, and a 4-row check beside the work). Rendered at 1366×650: it fits with room to spare, since Trade places and the flip fold into one row.

---

## 6. Progress

Six saved levels; save codes gain a **v15** layout with this card appended at the end (17 symbols); v1-v14 codes decode exactly as before. The class sheet adds its columns (`flip-everything-1` … `-6`) by itself. No legacy credit.

## 7. Open

1. "See why it works" (numbers only, flipping both sides of a balance, the opposite box drawn as −□): not built.
2. Teach me, the seesaw/counters/opposite-box scaffolds: next builds.
3. The fold label after Trade places then a flip reads "−1 × both sides" (the trade is folded into it).
4. After a fraction that does not split, the picture shows the boxes by size (3 boxes for −3x), not opposite boxes.
