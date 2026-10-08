# Solve it: one-step equations (Karl, 2026-10-08; light build)

*The first card of the "Solve it" section. Builds on SPEC-SCAFFOLD.md (light mode), Boxes & Circles' pieces and Value it's "put it back in".*

## 1. The task
`x + 5 = 12`: find x. The student types the number (the ± pad, integers only); "x =" is already on the Mat. Check **puts the typed answer back into the equation**, so a right answer shows `12 = 12 ✓ balanced` and a wrong one shows `17 ≠ 12 ✗ not balanced`.

## 2. Levels (built: 1 to 5; the save code has room for 8)
1. `x + a = b`  2. `x − a = b`  3. `ax = b`  4. `x / a = b`  5. all four mixed (at least one of each).

Answers are whole numbers and positive for now. Every problem is drawable: at most 36 counters on a side. Five a level, no repeated answers. **Later, each in its own level:** negative answers, negative coefficients, fractions of x. **Later card (Karl):** the other way to teach it, dragging a term across the equals sign so it becomes its opposite.

## 3. Supports (light mode only; one rung per wrong answer or I'm stuck)
- **Rung 0:** the equation; type x.
- **Rung 1: your answer put back in.** Shown automatically after a wrong answer: the equation with the typed value in blue, then whether the sides balance. The message names the slip (§4).
- **Rung 2: the balance.** x is a **box** (a number we don't know) and counters: `x + a = b` is a box and a counters against b counters; `x − a = b` a box and a negative counters; `ax = b` a boxes against b counters; `x / a = b` one box in a equal parts, one part lit, against b counters.
- **Rung 3: the undo, done to both sides, and what's left.** **Never "take away" (Karl, 2026-10-08): always add the opposite to both sides** (`x + 5 = 12`: add −5 to both sides, and the pairs cancel; `x − 3 = 6`: add +3), so students see negatives cancel positives in pairs. Then share the counters equally among the boxes; or take a copies of each side. Then a box against the answer's counters, and `x = …`.
- **Teach me step-by-step** goes straight to rung 3; I'm stuck before anything is typed skips rung 1. A streak counts only clean answers (as everywhere).

## 4. What a wrong answer looked like (`tagSolve`)
- `wrong-op`: did the same thing the equation does instead of undoing it (`x + 5 = 12` → 17; `4x = 24` → 96).
- `other-op`: a different operation (`4x = 24` → 20; `x/4 = 3` → 7).
- `untouched`: gave the right side as x (→ 12).
- `flipped`: the numbers the wrong way round (`x + 5 = 12` → −7).
- else `unmatched`.

## 5. Save code
v10 adds One-step equations with room for 8 levels (5 used, 49 of about 49.5 bits), so the later levels need no new version; Two-step and Multi-step will need v11. v9 and older codes still read.

## 6. Not built
The "drag a term across" card; negatives and fractions in One-step; Multi-step equations.

## 7. Two-step equations (Karl, 2026-10-08; light build)
`3x + 6 = 21`, `5 + 4x = 13`, `21 = 3x + 6` (x on the right), `5 − 2x = −3` (a negative coefficient). Same screen as One-step: type x, Check puts the answer back in.

**Levels (7; the save code has room for 8):** 1. `ax + b = c`  2. `ax − b = c`  3. `b + ax = c`  4. the same turned round (`c = ax + b`)  5. `b − ax = c`, **c negative in at least two** (`5 − 2x = −3`)  6. negative answers  7. all mixed. The first four are positive; negatives come in at Level 5. Drawable: a, 2 to 5; b, 1 to 12; |c| at most 30.

**Undo the constants first (Karl).** The picture does it in that order: the opposite of the number is added to both sides and the pairs cancel (never "take away"), then what is left is shared equally among the boxes, then (negative coefficient) both sides are flipped to the opposite: the boxes hold −x, so what the boxes make is −x. A student who divides first is allowed to, but **must divide every term on both sides**, and the messages say so with the equation's own numbers (`3x ÷ 3 = x, 6 ÷ 3 = 2, 21 ÷ 3 = 7`): this reinforces the distributive property of division.

**What a wrong answer looked like (the big one), with A·x + B = C, x = (C − B)/A:**
- `divided-one-term`: C/A − B (divided the x term and the other side, not the number).
- `stopped-early`: C − B (undid the number, not the multiplying).
- `skipped-constant`: C/A. `constant-wrong-way`: (C + B)/A (added when it should take away, or the reverse).
- `multiplied`: (C − B)·A. `untouched`: C. `sign-flipped` (A > 0) and `sign-lost` (A < 0, the boxes are −x): −x.
- Only slips that come out as whole numbers can be typed, so only those are tagged.

**Supports:** as One-step: the answer put back in (with the slip named), the balance (a box and counters; negative boxes are labelled −x), then the undo, share, what's left (and flip). **Diagnostic:** Solve it's diagnostic gains `ax − b = c` and `b − ax = c` (4 problems in all). **Save code:** v11 (57 of about 59.4 bits); v10 and older codes still read.

## 8. Switch sides (Karl, 2026-10-08; built)
The other way to solve it, from the class notes ("Moving Counters": *only things you can draw can cross the border; when they cross, they switch teams*). A card between One-step and Two-step. **The student moves the number**: the group of counters that is added to or subtracted from x is **dragged across the border** (the dashed line at the equals sign) **or tapped** (Enter or Space on a keyboard). It switches teams, `+4` becomes `−4`, and the work is written the notes' way: `x = −2 + −4`. Then they add up the other side (and, in a two-step equation, share it among the boxes) and type x; Check puts the answer back in, as everywhere.

**Levels (6):** 1. `x + a = b`  2. `x − a = b`  3. negative answers (`x + 4 = −2`)  4. x on the right (`12 = x + 5`, the number crosses to the left)  5. two-step (`2x + 6 = 14`: switch, then share)  6. two-step with negative answers. The problems are One-step and Two-step problems, so they are checked the same way.

**Supports:** letting go before the border springs the group back. Stuck before the move makes the move; Teach me makes it and shows everything. After the move: a wrong answer puts the answer back in (rung 1), then the **pairs cancel** (the crossed counters and their opposites on the other side, struck, rung 2), then **what's left** (and the sharing, for two-step; rung 3). **The main slip, named:** the number crossed but didn't switch teams (`−2 + 4` for `−2 + −4`), the same `wrong-op` / `constant-wrong-way` tags as before, with the message "it crossed the border, but it didn't switch teams".

**Save code:** v12 adds Switch sides (6 levels; 63 of about 64.4 bits); v11 and older still read. **Not built:** the diagnostic has no Switch sides problems; switching in Multi-step.
