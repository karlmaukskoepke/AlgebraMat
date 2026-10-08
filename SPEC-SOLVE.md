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
- **Rung 3: the undo, done to both sides, and what's left.** Take a away from both sides (struck); put a on both sides (the negative counters cancel); share the counters equally among the boxes; take a copies of each side. Then a box against the answer's counters, and `x = …`.
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
A diagnostic for the Solve it section; the "drag a term across" card; negatives and fractions; Two-step and Multi-step equations.
