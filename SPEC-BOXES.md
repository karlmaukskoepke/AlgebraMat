# The Mat — Boxes & Circles pack spec (DRAFT for Karl, 2026-09-30)

*This builds on SPEC.md and SPEC-LASSO.md: same engine, screen shell, rules (no timers, no penalties, hints after 3 wrong tries), storage and save code. Only what's new is written here. Sources: Karl's description in SPEC-ROADMAP.md, and his answers of 2026-09-30. **The notes page for this pack was not in the PDF I have**, so anything visual below is provisional until Karl sends it (marked ◇).*

## 1. What Boxes & Circles teaches

**Combining like terms.** Variable terms (like `3x` or `−x`) combine with variable terms. Constants combine with constants. The sign in front of a term, meaning its + or − operation, belongs to the term.

- Pack subtitle on the map: **"Combining like terms"**. Blurb: *"Box the x's, circle the numbers, then combine."*
- Every coefficient and constant has an absolute value below 10 (1 to 9). Totals can be larger (9x + 9x = 18x).
- A coefficient of 1 is written `x` or `−x`, and students draw **one** box for it. That's how they learn `x` means `1x`.

## 2. Screens and steps

Same shell as Flip It: header, step bar, the Mat, feedback line, hint line, palette, and the typing pad. Five steps, or six in Levels 4–5:

| # | Step | What the student does |
|---|---|---|
| 0 | **Rewrite** *(Levels 4–5 only)* | As in Flip It: flip both signs of each `− (−…)` term. Or press **Nothing to rewrite**. |
| 1 | **Box** | Box the variable terms, including the sign or operation in front. |
| 2 | **Circle** | Circle the constant terms, including the sign or operation in front. |
| 3 | **Draw** | Draw boxes (or negative boxes) above each boxed term, and + or − counters above each circled term. |
| 4 | **Cancel** | Cancel pairs: a box with a negative box, a + with a −. Only like pieces cancel. |
| 5 | **Answer** | Type the combined expression. |

### The Mat

The expression sits on one line near the bottom of the Mat, in the same style as Flip It's problem line. Each term after the first has **two tappable parts, its operation and its number**: in `3x − 4 − x + 5` the terms are `3x`, `−` `4`, `−` `x`, `+` `5`. The first term has no operation; if it's negative, its sign is part of the number.

Drawings go **above** their term, as columns. A term column holds up to 9 pieces in a grid, at most 3 across. The pieces are at least 44px tap targets on a Chromebook, so a problem never has more than 6 terms and more than about 24 pieces in all.

### ① Box

- The student taps a term's **number** and its **operation** in front of it. A box grows around what's tapped, and it is complete only when it holds both. Tapping again removes a part.
  - Only the number tapped: the box is dashed, meaning it isn't finished. The first term has no operation, so tapping its number completes the box.
- This is the point of the step: **the operation belongs to the term**, and students have to remember to include it.
- **Check** passes only if every variable term has a complete box and nothing else is boxed.
- Feedback is specific, for example:
  - the operation left out: *"Include the sign in front: tap the − too."*
  - a constant boxed: *"That's just a number: no x. Boxes are for the x terms."*
  - one missed: *"An x term is still not boxed."*

### ② Circle

- The same, for the constants: the number and the operation in front of it, in a circle.
- A part that's already boxed can't be circled: *"That one's already boxed."*
- **Check** passes when every constant has a complete circle and nothing else is circled.
- The circle is what makes students see how the operation changes the term: `− 3` is negative 3, and `+ 3` is positive 3.

### ③ Draw

- The palette has four piece buttons: **box**, **− box**, **+**, **−**, and Undo. The student picks a piece, then taps above a term to add one per tap (like Group It's fill: any term, any order).
- A term's pieces come from its **effective sign**: the operation times the number's sign. So `− 4x` → 4 negative boxes, `+ x` → 1 box, and after a rewrite `+ (+2x)` → 2 boxes.
- **Check** validates every term for the type and the count. Feedback is specific, for example: *"This term is − 4x, so it needs 4 negative boxes."* and *"Circled terms are numbers: use + and − counters."*

### ④ Cancel

- Same mechanic as Flip It: tap one piece, then an opposite piece, and the pair gets vermillion slashes (canceled pieces fade to 45%).
- Boxes cancel only with negative boxes, and counters only with counters of the other sign. A box with a counter: *"A box and a number aren't like terms."* Two of the same sign: *"A pair is one + and one −."*
- The student can do the boxes first, then the numbers, or the other way round. The step's opening message suggests boxes first: *"Combine the boxes first, then the numbers."*
- The step is complete when each kind has only one sign left. If nothing is left of a kind, that kind is done.

### ⑤ Answer

- The student types the combined expression on the bottom pad: **x**, **+**, **−**, digits **0–9**, ⌫, and **Check**. **The keyboard works too** (x, +, -, the number keys, Backspace, Enter), and it presses the same buttons.
- The typed expression shows on the student's Kalam line after `=`, under the problem: `3x + 2 − x − 5 = 2x − 3`.
- **What's accepted:**
  - either order (`2x − 3` or `−3 + 2x`)
  - `x` or `1x`, and `−x` or `−1x`
  - each kind appears once, fully combined
  - a kind that cancels completely is left out (`2x + 0` is not accepted)
- Feedback tells them which kind is off, without giving the number: *"Look at the boxes left: what sign and how many?"* or *"Combine all the numbers into one."* A typo-like entry gets *"Type it like 2x − 3."*

## 3. Visual language ◇ (provisional, until Karl's notes page)

- **Shapes carry the meaning, not color:** a term with a **box** around it is a variable term, and a term with a **circle** around it is a constant. Outlines are ink, thick and low-ink for printing.
- **Pieces above the expression:** a box is a square outline with an **x** ◇, a negative box is the same square with a **−** in magenta ◇. Counters are + and − marks exactly as in Flip It.
- Canceled pairs: vermillion slashes, as in Flip It. Magenta means the sign flipped in a rewrite.

## 4. Levels (Karl approved this order)

Each level has 5 problems, the same generator rules as Flip It (seeded, fresh seed each play, no repeated answers, small numbers early), with 3 to 6 terms, at least one variable term and one constant, and terms interleaved so they don't come already grouped.

| Level | New idea | Examples |
|---|---|---|
| 1 | Only + terms | `3x + 2 + 4x + 5` |
| 2 | Negative constants (subtracting a number) | `5x − 3 + 2x − 4`, `4 + 3x − 6` |
| 3 | Negative x terms, and `x` / `−x` as 1x (also a negative first term) | `−2x + 5 + x − 4x`, `−x + 3 − 4x + 2` |
| 4 | **Subtracting a negative term** (with the Rewrite step) | `4x − (−2x) + 3`, `5 − (−3) + 2x − x` |
| 5 | Everything mixed, in any order | `−x + 2 − (−3x) − 5 + 4x` |

- **Limits:** coefficients and constants are 1 to 9. Levels 1–2 lean small (up to 5). Total pieces drawn per problem are at most about 24 (16 in Levels 1–2).
- **Mixes:** Level 2 has at least 2 problems where the constants cancel. Levels 3–5 have at least 2 problems with a coefficient of 1 and at least 2 where some boxes cancel. At most 1 problem per set has a kind that cancels completely (the answer is just `3x` or just `5`), and never both.
- **Level 4** has one or two `− (−…)` terms per problem. **Level 5** has some problems with none, so students use **Nothing to rewrite**.
- The Rewrite step here is Flip It's: tap the operation and the number's sign on each `− (−…)` term (both flip), and the term reads `+ (+2x)`. Boxes and circles then go around the whole rewritten term, parentheses included.

## 5. Engine sketch

- `engine/terms.js`: a term is `{ kind: 'x' | 'int', op: '+' | '-', value }`, where `value` is the signed number written (so `− (−2x)` is `{ kind: 'x', op: '-', value: -2 }`). The effective signed coefficient is `op × value`. Also: `evaluate` to `{ x, n }`, `format`, `rewrite`, and a parser for typed answers.
- `engine/generateTerms.js`: the seeded level generator, in the same style as `generate.js` and `generateLasso.js`.
- `engine/termMoves.js` and `engine/termSession.js`: validators and a reducer with the steps above. Feedback text lives in one table.
- Keyboard: the shared handler looks up palette buttons by a `data-key` attribute (digits, `x`, `+`, `-`, Backspace), so each pack's palette gets quick keys without special cases.

## 6. Pack map, saving, hints

- Boxes & Circles becomes a playable card, open from the start, with 5 levels. The Coming-soon row keeps Groups of Terms and Distribute, then combine.
- **Save code v3** (Flip It 4 + Group It 7 + Boxes & Circles 5 = 16 bits) uses 4 data symbols, so new codes are one character longer (`MAT-5····`). v1 and v2 codes still work.
- **Hints (after 3 wrong tries):** Box and Circle: the terms still to do blink. Draw: faint ghost pieces show what goes above each term. Cancel: a pair blinks. Answer: the leftover boxes and counters blink, and the hint names the sign of each kind, not the count.

## 7. Build order (one step per cycle)

1. Term model, level generator, and save code v3, with tests.
2. Static Mat: expression, boxes and circles, pieces above, canceled pairs, and the typed answer line, using a hard-coded problem.
3. Box and Circle steps (validators, tests, UI).
4. Draw, Cancel and Answer steps, with the typing palette and keyboard quick-keys.
5. Rewrite step (Levels 4–5), level flow, and the pack map.
6. Hints, animations and the touch audit at 1366×657 and 1280×610.

## 8. Questions for Karl

1. **The notes page:** please send the boxes-and-circles page. It sets what a box and a negative box look like (◇ above).
2. **"+ or − above all the terms":** I read this as boxes above the boxed terms and + / − counters above the circled terms. Is that right?
3. **Rewrite in Levels 4–5:** should subtracting a negative term use Flip It's Rewrite step first (flip both signs), as I've drawn it? (Recommended: it's the same idea students just learned.)
4. **Cancel order:** one Cancel step where boxes and numbers can be done in either order, or must the boxes be finished first? (Recommended: either order, with a suggestion.)
5. **Answer forms:** accepting either order and `x` or `1x`, as drawn above. (Recommended.)
6. **Colors:** shapes rather than colors mark box terms and circle terms, keeping green, blue, magenta and vermillion for the meanings they already have. OK?
7. **Boxing by tapping:** students tap the number and then the operation in front of it to complete a box, so they have to remember the operation. Is that the right feel, or would you rather they drag a box around the whole term?
