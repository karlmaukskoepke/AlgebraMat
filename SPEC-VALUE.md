# Value it: evaluating expressions (Karl, 2026-10-04; light build)

*A card of the "Build it" section to come (SPEC-ROADMAP). Builds on SPEC-SCAFFOLD.md (light mode) and Boxes & Circles' pieces.*

## 1. The task
`2x + 6, x = 4`: put the value in for x and work it out. The student types the answer (the ± pad, integers only).

## 2. Levels (built: 1 to 4)
1. **positive values** in positive expressions: `ax`, `ax + b`, `b + ax`, x from 2 to 9.
2. **negative values** in the same expressions: x from −9 to −2.
3. **everything mixed**: subtracting, negative coefficients, positive and negative values (`6 − x, x = −9`; `−3x + 8, x = −6`).

4. **fractions of x**: a fractional coefficient written `(3/4)x`, with the forms of Level 3 (`(1/2)x + 3`, `5 − (2/3)x`, `−(1/5)x − 2`, `(3/4)x` alone), proper fractions with bottom numbers 2 to 5, positive and negative values of x. **x is always a multiple of the bottom number** (up to 24), so every answer is a whole number and the pad stays the integer pad.

Every problem is drawable as filled boxes: at most 5 boxes and 24 counters inside them. Five problems a level, no repeated answers. **Next (not built):** Level 5, an expression over a fraction, which needs a "simplify the fraction" step and its own visual (parked until simplifying fractions has one).

## 3. Supports (light mode only; one rung per wrong answer or I'm stuck)
- **Rung 0:** the problem and `x = 4`; type the answer.
- **Rung 1: substitute.** The problem is rewritten with x replaced by its value *in parentheses* (`2(4) + 6`, `5 − 2(−3)`), the value in blue. The message names the slip.
- **Rung 2: filled boxes.** Each x term is |coefficient| boxes, each holding |x| counters of x's sign (a negative box has the dash and holds the opposite); a number is its counters. Under each term, what it comes to.
- **Rung 2 for a fraction of x:** ONE box holding the |x| counters in *d* equal parts (the bottom number), with the top number of parts taken solid and lightly filled, the rest dashed; what the taken parts make is the term's worth.
- **Rung 3: the sum** (`−6 + 7`), and the answer line.
- **Teach me step-by-step** goes straight to rung 3. A streak counts only clean answers (as everywhere).

## 4. What a wrong answer looked like (`tagValue`)
- `no-parens`: the value written beside the number, not multiplied (`2x`, x = 4 read as 24 → 30; `3x`, x = −2 read as "3 − 2"). **The main slip (Karl).**
- `added`: `2x` read as 2 + x.
- `neg-neg`: a negative times a negative left negative (`5 − 2x`, x = −3 → 5 − 6).
- Fractions: `top-only` (3/4 of 8 read as 3 × 8), `bottom-only` (8 ÷ 4), `upside-down` (the fraction flipped, when that is a whole number).
- `sign-lost` (x's negative dropped), `sign-flipped` (the opposite of the answer), else `unmatched`.
- More supports are meant to borrow from the operations-with-negatives and fractions cards (the Group It / Flip It misconception scripts) as those slips show up in play.

## 5. Save code
v9 adds Value it with room for 5 levels (4 used), so the last level needs no new version. v8 and older codes still read.
