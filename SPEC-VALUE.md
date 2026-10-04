# Value it: evaluating expressions (Karl, 2026-10-04; light build)

*A card of the "Build it" section to come (SPEC-ROADMAP). Builds on SPEC-SCAFFOLD.md (light mode) and Boxes & Circles' pieces.*

## 1. The task
`2x + 6, x = 4`: put the value in for x and work it out. The student types the answer (the ± pad, integers only).

## 2. Levels (built: 1 to 3)
1. **positive values** in positive expressions: `ax`, `ax + b`, `b + ax`, x from 2 to 9.
2. **negative values** in the same expressions: x from −9 to −2.
3. **everything mixed**: subtracting, negative coefficients, positive and negative values (`6 − x, x = −9`; `−3x + 8, x = −6`).

Every problem is drawable as filled boxes: at most 5 boxes and 24 counters inside them. Five problems a level, no repeated answers. **Next (not built):** Level 4, fractional coefficients of x (`½x + 3, x = 8`); Level 5, an expression over a fraction, which needs a "simplify the fraction" step and its own visual (parked until simplifying fractions has one).

## 3. Supports (light mode only; one rung per wrong answer or I'm stuck)
- **Rung 0:** the problem and `x = 4`; type the answer.
- **Rung 1: substitute.** The problem is rewritten with x replaced by its value *in parentheses* (`2(4) + 6`, `5 − 2(−3)`), the value in blue. The message names the slip.
- **Rung 2: filled boxes.** Each x term is |coefficient| boxes, each holding |x| counters of x's sign (a negative box has the dash and holds the opposite); a number is its counters. Under each term, what it comes to.
- **Rung 3: the sum** (`−6 + 7`), and the answer line.
- **Teach me step-by-step** goes straight to rung 3. A streak counts only clean answers (as everywhere).

## 4. What a wrong answer looked like (`tagValue`)
- `no-parens`: the value written beside the number, not multiplied (`2x`, x = 4 read as 24 → 30; `3x`, x = −2 read as "3 − 2"). **The main slip (Karl).**
- `added`: `2x` read as 2 + x.
- `neg-neg`: a negative times a negative left negative (`5 − 2x`, x = −3 → 5 − 6).
- `sign-lost` (x's negative dropped), `sign-flipped` (the opposite of the answer), else `unmatched`.
- More supports are meant to borrow from the operations-with-negatives and fractions cards (the Group It / Flip It misconception scripts) as those slips show up in play.

## 5. Save code
v9 adds Value it with room for 5 levels (3 used), so adding the fraction levels needs no new version. v8 and older codes still read.
