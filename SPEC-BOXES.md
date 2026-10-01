# The Mat — Boxes & Circles pack spec (REVISED for Karl's review, 2026-09-30)

*This builds on SPEC.md and SPEC-LASSO.md: same engine, screen shell, rules (no timers, no penalties, hints after 3 wrong tries), storage and save code. Only what's new is written here. Sources: Karl's notes, page 2, "Combining Like Terms", and his answers of 2026-09-30. One design principle from Karl: **wherever the math allows, the student chooses the order**, to remind them of the flexibility of algebra.*

## 1. What Boxes & Circles teaches

**Combining like terms.** Variable terms (like `3x` or `−x`) combine with variable terms; numbers combine with numbers. The sign in front of a term, meaning its + or − operation, **goes with the term**.

- Pack subtitle on the map: **"Combining like terms"**. Blurb: *"Box the x's, circle the numbers, then combine."*
- Every coefficient and constant has an absolute value below 10 (1 to 9). Totals can be larger.
- A coefficient of 1 is written `x` or `−x`, and students draw **one** box for it. That's how they learn `x` means `1x`.

## 2. Screens and steps

Same shell as Flip It. The notes have three steps: **① Box x terms. Circle numbers. Take the sign in front with them! ② Draw each term. ③ Cancel pairs.** We add typing the answer, and a Rewrite step for subtracting a negative:

| # | Step | What the student does |
|---|---|---|
| 0 | **Rewrite** *(Levels 4–5 only)* | Flip both signs of each `− (−…)` term, as in Flip It. Or press **Nothing to rewrite**. |
| 1 | **Box & Circle** | Box the variable terms and circle the numbers, each **with the sign or operation in front**. Either order. |
| 2 | **Draw** | Draw boxes (or negative boxes) above each boxed term, and + or − counters above each circled term. |
| 3 | **Cancel** | Cancel pairs, boxes with negative boxes and + with −. Either order. |
| 4 | **Answer** | Type the combined expression. |

### The Mat

The expression sits on one line near the bottom of the Mat. Each term sits in its own **column**, spaced out so its drawing can go straight above it, as in the notes. A term after the first is made of its **operation** and its **number**: in `3x − 5 + 7 − x` the terms are `3x`, `− 5`, `+ 7`, `− x`. A negative first term keeps its sign with the number: `−5`.

**Drawings are stacked above their term in a grid two pieces wide**, like the notes (7 counters are 2 + 2 + 2 + 1). Pieces are at least 44px tap targets on a Chromebook, so a problem has at most 6 terms and about 24 pieces in all.

### ① Box & Circle

- **Two tools on the palette:** **Box** and **Circle**. The student picks one and drags across a term (or taps it) to draw that shape around it. Karl's words: *"Box the variable terms, remembering to include the signs and + or − operation in front of it."* Then *"circle the constant terms, also including the sign and/or operation in front."* The order isn't enforced.
- **Live highlight while dragging.** As the finger or mouse moves, everything it covers turns **highlighter yellow** with bolder text, so the student sees exactly what they're selecting **before they let go**. On release, the shape is drawn around that run. A plain tap highlights and shapes a single part.
  - **Boxes** are rounded squares and **circles** are pills (capsules), both with the **operation included**: `3x`, `− x`, `+ 3`, `− 5`, as in the notes.
  - Tapping a finished shape removes it, and **Undo** removes the latest.
- **Check** passes when every variable term has one box spanning exactly its operation and number, every number has one circle spanning exactly its operation and number, and nothing else is drawn.
- Feedback is specific, for example:
  - the operation left out: *"Include the sign in front: take the − with it."*
  - two terms in one shape: *"One term at a time: this shape has two."*
  - the wrong shape: *"That's just a number: no x. Circle it."* and *"That one has an x: box it."*
  - one missed: *"An x term is still not boxed."* or *"A number is still not circled."*

### ② Draw

- The palette has four piece buttons: **box**, **− box**, **+**, **−**, and Undo. The student picks a piece and taps above a term to add one per tap: any term, any order (like Group It's fill). The pieces are grouped above each term in a 2-wide grid.
- **Mystery-box key** on the Mat, from the notes: `□ = x` and `−□ = −x`.
- A term's pieces come from its **effective sign**: the operation times the number's sign. So `− 4x` → 4 negative boxes, `+ x` → 1 box, and `− (−7)` → 7 + counters.
- **Check** validates every term for type and count. Feedback is specific, for example: *"This term is − 4x, so it needs 4 negative boxes."* and *"A circled term is a number: use + and − counters."*

### ③ Cancel

- Same mechanic as Flip It: tap one piece, then an opposite piece, and both get vermillion slashes, as in the notes. Canceled pieces fade to 45%.
- Boxes cancel only with negative boxes, and counters only with counters of the other sign. A box with a counter: *"A box and a number aren't like terms."* Two of the same sign: *"A pair is one + and one −."*
- **Student choice:** the boxes or the numbers can go first, and any pair in any order. The opening message suggests *"Combine the boxes, then the numbers,"* but nothing is enforced.
- The step is complete when each kind has only one sign left (or nothing).

### ④ Answer

- The student types the combined expression on the pad at the bottom: **x**, **+**, **−**, digits **0–9**, ⌫, and **Check**. **The keyboard works too** (x, +, −, the number keys, Backspace, Enter), quick-keying the same buttons.
- It shows on the student's Kalam line after `=`, like the notes: `= 2x + 2`.
- **What's accepted:**
  - either order (`2x + 2` or `2 + 2x`)
  - `x` or `1x`, and `−x` or `−1x`
  - each kind appears once, fully combined
  - a kind that cancels completely is left out (`2x + 0` isn't accepted)
- Feedback tells them which kind is off without giving the number: *"Look at the boxes left: what sign and how many?"* or *"Combine all the numbers into one."* An entry that can't be read gets *"Type it like 2x + 2."*

### ⓪ Rewrite (Levels 4–5)

- As in Flip It: tap the **operation** and the **sign inside the parentheses** of a `− (−7)` term; both must flip. Then the notes' label appears under the term in magenta with an underline: **"is +7"**.
- The printed expression never changes. A term that's been rewritten is drawn with **magenta** pieces in the Draw step (they're the opposite), as in the notes' second example.
- On a problem with nothing to rewrite (Level 5 has some), the student presses **Nothing to rewrite**.

## 3. Visual language (from Karl's notes)

- **Mystery boxes:** `□` is **x**, a small square outline. `−□` is **−x**, the same square with a short dash at its left.
- **Counters** are + and − marks, exactly as in Flip It.
- **Shapes carry the kind:** a rounded-square **box** around an x term, and a **pill** around a number. Ink outlines, low ink for printing.
- **Colors:** pieces are ink. **Vermillion** is cancel. **Magenta** is opposite (rewritten terms and their "is +7" labels). The live selection is highlighter yellow.
- Written lines use Kalam, as in the notes.

## 4. Levels (Karl approved this order)

Each level has 5 problems, the same generator rules as Flip It (seeded, fresh seed each play, no repeated answers, small numbers early), with 3 to 6 terms, at least one variable term and one number, and terms interleaved so they don't come already grouped.

| Level | New idea | Examples |
|---|---|---|
| 1 | Only + terms | `3x + 2 + 4x + 5` |
| 2 | Negative numbers (subtracting a number) | `5x − 3 + 2x − 4`, `4 + 3x − 6` |
| 3 | Negative x terms, and `x` / `−x` as 1x (also a negative first term) | **`3x − 5 + 7 − x`** (the notes' Example 1), `−x + 3 − 4x + 2` |
| 4 | **Subtracting a negative term** (with Rewrite) | **`−5 − 2x − x − (−7)`** (the notes' Example 2), `4x − (−2x) + 3` |
| 5 | Everything mixed, in any order | `−x + 2 − (−3x) − 5 + 4x` |

- **Limits:** coefficients and constants are 1 to 9. Levels 1–2 lean small (up to 5). Total pieces drawn per problem are at most about 24 (16 in Levels 1–2).
- **Mixes:** Level 2 has at least 2 problems where the numbers cancel. Levels 3–5 have at least 2 problems with a coefficient of 1 and at least 2 where some boxes cancel. At most 1 problem per set has a kind that cancels completely (the answer is just `3x` or just `5`), and never both.
- **Level 4** has one or two `− (−…)` terms per problem. **Level 5** has some problems with none.

## 5. Engine sketch

- `engine/terms.js`: a term is `{ kind: 'x' | 'int', op: '+' | '-', value }`, where `value` is the signed number written, so `− (−7)` is `{ kind: 'int', op: '-', value: -7 }`. The effective signed coefficient is `op × value`. It also has `evaluate` to `{ x, n }`, `format`, a parser for typed answers, and the parts of each term (operation, number) with their positions, so a dragged selection can be matched to terms.
- `engine/generateTerms.js`: the seeded level generator, in the style of `generate.js` and `generateLasso.js`.
- `engine/termMoves.js` and `engine/termSession.js`: validators and a reducer with the steps above. Feedback text lives in one table.
- **Keyboard:** the shared handler looks up palette buttons by a `data-key` attribute (digits, `x`, `+`, `-`, Backspace), so each pack's palette gets quick keys without special cases.
- **Dragging** uses pointer events (mouse, touch and pen all work), with live highlighting, and taps work as a fallback.

## 6. Pack map, saving, hints

- Boxes & Circles becomes a playable card, open from the start, with 5 levels. The Coming-soon row keeps Groups of Terms and Distribute, then combine.
- **Save code v3** (Flip It 4 + Group It 7 + Boxes & Circles 5 = 16 bits) uses 4 data symbols, so new codes are one character longer (`MAT-5` and five more symbols). v1 and v2 codes still work.
- **Hints (after 3 wrong tries):** Box & Circle: the terms still to do blink. Draw: faint ghost pieces show what goes above each term. Cancel: a pair blinks. Answer: the leftover pieces blink, and the hint names the sign of each kind, not the count. Rewrite: the signs still to flip wiggle, as in Flip It.

## 7. Build order (one step per cycle)

1. Term model, level generator, and save code v3, with tests.
2. Static Mat: expression columns, shapes, pieces in 2-wide grids, canceled pairs, and the typed answer line, using the notes' two examples.
3. Box & Circle (validators, tests, the drag selection with live highlight, and the tap fallback).
4. Draw, Cancel and Answer, with the typing palette and keyboard quick-keys.
5. Rewrite (Levels 4–5), level flow, and the pack map.
6. Hints, animations and the touch audit at 1366×657 and 1280×610.

## 8. Decisions since the first draft

Karl answered: *(1)* the notes page was there all along, on page 2 (my mistake); *(2)* boxes go above the boxed terms and counters above the circled terms; *(3)* yes to Rewrite for subtracting a negative; *(4)* cancel in either order, with student choice built in wherever possible; *(5)* dragging a box around the term is preferred, but tapping is fine for now, and a live visual indicator of what's being selected is needed.

My calls, open to change:
- **Box and Circle are one step**, as in the notes, with a tool for each. That also gives the student the choice of order.
- **Dragging is built**, with taps as a fallback, rather than tapping only.
- The **"is +7" label** in magenta is how Rewrite shows its result, following the notes.
- The **mystery-box key** (`□ = x`, `−□ = −x`) shows on the Mat during Draw.

## 9. Build decisions, step 1 (term model, generator, save code v3)

- A term is `{ kind, op, value }`. The **first term's `op` is always `+`** and is never shown; a negative first term keeps its sign in `value`. A later term is either `+`/`−` with a positive number, or `− (−…)` (subtracting a negative). `+ (−…)` is never generated.
- **Generator, by level:**
  - Level 1: all +, coefficients 2 to 9 (no bare `x` until Level 3).
  - Level 2: positive x terms and a positive first term. At least one subtracted number every time, and at least 2 per set where the numbers cancel.
  - Level 3: at least one negative x term every time, at least 2 per set with a bare x, and at least 2 where boxes cancel.
  - Level 4: every problem has one or two `− (−…)` terms, on both x terms and numbers.
  - Level 5: five or six terms, at least 2 per set with a `− (−…)` term and at least 2 without.
  - Levels 1–2 lean small (85% of values are 5 or less), with at most 16 pieces to draw. Levels 3–5 allow up to 24.
  - **One kind vanishes** (the answer is just `3x` or just `5`) in at most one problem per set, only in Levels 3–5, about half the sets. Everything cancelling is never generated.
  - The seed is mixed with the level, so the same seed gives different sets on different levels, and the same set every time on one level.
- **Typed answers** are read as: digits (up to 3), `x`, `+`, `−` (the keyboard's `-` too), spaces ignored. A term after the first needs its sign. `2x3`, `2++3` and a trailing sign are unreadable. `2x + 3 − 1` is readable but **not combined**, and so is `2x + 0`, so Check can say *"Combine all the numbers into one."*
- **Save code v3:** Boxes & Circles takes bits 11 to 15. It isn't in the game's pack list until the pack is playable (step 5), so its bits are read and dropped until then. Nobody can have progress in it before that.

## 10. Build decisions, step 2 (the static Mat)

- **Preview page:** `?demo=boxes` draws the Mat in every state with the notes' two examples (and the most crowded problem the generator can make). It's removed when the pack becomes playable (step 5).
- **The drawing is 860 × 340.** The expression is one row (baseline y = 250), with the typed answer line under it (y = 322) and the key at the right of that line. Pieces stand above in columns up to y ≈ 15.
- **Columns:** each term has a column, as wide as its text or its pieces, whichever is wider, centered as a group. The gap between columns is 20, closing up to 8 for a wide problem, so six terms always fit with at least 12 to spare at each edge.
- **Piece grid:** two pieces to a row, full rows on top, an odd piece alone at the bottom and centered (7 is 2 + 2 + 2 + 1). Cells are 42 × 38, which keeps pieces at least 44px on a Chromebook. A term has at most 9 pieces, so a column is at most 5 rows tall.
- **Pieces:** a counter is a + or − mark; a box is a 22-unit square; a negative box is the same square with a dash touching its left side. A canceled piece fades to 45% and gets a vermillion slash. A piece picked for canceling gets a dashed ring.
- **Shapes:** a box around an x term is a rounded square; a number gets a pill (capsule). Both stand 9 units off the text. A shape that doesn't include the operation, or whose parts aren't complete, is **dashed** (the "incomplete" look).
- **Live selection:** a highlighter-yellow bar behind the covered parts, with bolder text.
- **Tap targets:** each part (operation, number) has a hit box at least 46 wide and 56 tall that never reaches into its neighbor. A drag covers every part between its two ends.
- **"is +7"** sits under a rewritten term in magenta Kalam with an underline, and its pieces are magenta.
- **Pieces are listed in reading order** (top-left first). When there's nothing left to cancel, each kind has only one sign left, and the leftovers always equal what the expression comes to (tested for every generated problem).

## 11. Build decisions, step 3 (Box & Circle)

- **Playable at `?pack=boxes&level=N`** (levels 1 to 5) while the pack is built. It's still a Coming-soon card, and the level can't be finished yet: a correct Box & Circle moves to the Draw step, which says it comes in the next build.
- **Tools:** **Box** and **Circle** buttons (keys **B** and **C**), the chosen one stays pressed until the other is picked. **Undo** is Backspace. Enter checks. With no tool picked, a press on the expression says *"Pick Box or Circle first."*
- **Dragging:** press on a part, drag, and the parts under the pointer turn highlighter yellow with bold text, live, until release. On release the shape is drawn around everything between the two ends (either direction). Mouse, touch and pen all work; a drag across the Mat never scrolls the page. A press in the small gap between terms lands on the nearest part (within 18 units).
- **Taps:** a tap on a part draws the shape around just that part (dashed, since it isn't a whole term yet). A tap on a **finished shape removes it**.
- **A new shape replaces any shape it overlaps**, so fixing the dashed shape is one drag across the whole term, and switching tool and dragging again turns a box into a circle.
- **A shape is finished (solid)** only when it surrounds exactly one whole term: the operation and the number. The first term has no operation, so its number alone is whole.
- **Check says what's wrong, most specific first:** a shape over two terms (*"One term at a time"*), then the wrong shape (*"That one has an x: box it."* / *"That's just a number: no x. Circle it."*), then an unfinished shape (*"Take the sign in front with it…"* or *"Take the number too…"*), then what's missing (*"An x term is still not boxed."* / *"A number is still not circled."*). Each wrong Check counts toward a hint (hints come in the last build).
- **`− (−7)` is a number:** its circle must take the `−` and the whole `(−7)`.
- **Rewrite (Levels 4–5) isn't built yet** (build step 5), so Box & Circle works on those levels as written.
- **Keyboard quick keys are now generic:** any palette button can name a key with `data-key` (a letter or Backspace), and the shared handler presses it. The Answer step's x, + and − buttons will use this.
- **On a phone** the Mat is small (about 40% scale), as in Group It. The target is a Chromebook.
