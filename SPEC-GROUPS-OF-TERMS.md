# The Mat: Groups of Terms pack spec (revised 2026-10-01 with Karl's answers; awaiting go-ahead)

*Builds on SPEC.md, SPEC-LASSO.md (Group It) and SPEC-BOXES.md (Boxes & Circles): same shell, rules (no timers, no penalties, hints after 3 wrong tries), storage and keyboard quick-keys. Only what's new is written here. Source: Mr. Mauks's notes, page 2 (Distributive Property), plus Karl's answers of 2026-10-01.*

## 1. What it teaches

**A(B) is still A groups of B. Now B has two terms.** `3(2x − 1)` is 3 groups of (2x − 1): each group holds two boxes and a negative counter, so the three groups hold 6 boxes and 3 negatives, which is `6x − 3`. A negative A takes the opposite of the whole thing, as in Group It: `−2(x − 4)` is the opposite of `2x − 8`, which is `−2x + 8`.

- A is a whole number (2 to 5), the opposite of one (`−`, written `−1`), the opposite of a whole number, or a friendly fraction (`1/2` to `5/6`, positive or negative), as in Group It.
- B is `Cx + D` with C and D nonzero whole numbers of either sign (`2x − 1`, `−x + 4`, `−3x − 2`). The x term comes first in the early levels; the **challenge levels flip it** (`3(5 + 2x)`, `−2(4 − x)`), see §4. A bare `x` or `−x` is allowed (`1x`, `−1x`), as in Boxes & Circles.
- Every product has whole-number coefficients (a fraction's denominator divides both C and D).
- The distributive property is named in the notes' language: *"Still A groups of B. Now B has 2+ terms."*

## 2. Visual language (Group It's colors, Boxes & Circles' pieces)

- **Blue:** how many groups (A, a fraction's numerator and denominator, the split parts, "take").
- **Green:** inside a group: B and the ovals.
- **Magenta, underlined for words only:** opposite (the `−` beside a group, the **opp.** arrow, and pieces after the flip).
- **Pieces are Boxes & Circles': □ is x, −□ is −x, and counters are + and −.** A box has a rounded square outline; the key `□ = x, −□ = −x` shows during Fill, as in Boxes & Circles.
- **A group is an oval holding a row of pieces,** boxes first and then counters: `□□−`. Ovals stack in a column, as in the notes. A group can hold up to 4 boxes and 5 counters.
- **The arrow chain** reads to the right: `→ 6x − 3`, then magenta `opp. →` to the flipped result, as in the notes.

## 3. Steps

**Whole-number A** (`3(2x − 1)`, `−2(x − 4)`, `−(x + 3)`): **Groups → + or − → Fill → Flip → Answer → Check it**. Flip appears only for − groups. A positive A skips it, and the step bar shows it done.

1. **Groups.** Add A empty ovals with **Add group**; tapping an oval removes it. A problem written `−(B)` first needs its hidden 1 typed, as in Group It.
2. **+ or −.** Choose + groups or − groups. A − puts a magenta `−` beside every oval.
3. **Fill: one, then copy** (Karl's choice).
   - Pick a piece (□, −□, +, −), then tap the **first** oval to add it, one per tap. **Undo** takes back the latest.
   - **Copy to all** (key **K**) repeats the first oval's pieces into every other oval. It stays dim until the first oval has pieces. Tapping any other oval with a piece picked adds one to just that oval, so students can still fill each by hand or fix one.
   - **Check** names the first oval that's off: *"The second group has 2 boxes. Each group is 2x − 1: 2 boxes and 1 negative."* The words never give the final answer.
4. **Flip** (− groups only). As Group It §12: tap a group's `−` (or **Flip all**) and an arrow draws to a **redrawn copy on the right**, same shape, every piece turned to its opposite in magenta, and no `−`. The flipped copies are what gets read for the answer.
5. **Answer** (Karl: *collect by writing out the final answer*, no separate Collect step). The student reads the boxes and counters across all the groups and **types the combined result** with the Boxes & Circles pad (digits, x, +, −, ⌫ and keyboard quick-keys). Same rules: either order, `x` or `1x`, fully combined, and the line reads `3(2x − 1) = 6x − 3`. Wrong answers say which kind is off (*"Count all the boxes in all the groups: positive or negative?"*), never the number.
6. **Check it: the distributing arrows** (new, Karl). After the answer is right, the Mat draws the shorthand: **an arrow from A to each term of B**, and the two products written out: `3 · 2x = 6x` and `3 · (−1) = −3`, then `6x − 3`. It checks the picture against the algorithm, so students see the two methods agree and meet the "multiply each term" rule. **Show-only at first** (the arrows draw themselves, in blue for A and green for B, magenta for a negative A's opposite), so the picture stays the main work; see Open question 1.

**Fraction A** (`1/2(4x + 6)`, `−2/3(3x − 6)`): **Groups → + or − → Fill → Take → Flip → Answer → Check it**, following Group It §10.4.

- **Groups:** d groups drawn as one fraction bar (d touching rectangles in one outline). The − (if any) is one magenta `−` beside the bar.
- **Fill (deal), either order** (Karl): deal **all of one kind first, then the other**, boxes then counters or counters then boxes, whichever the student likes. Pick a piece, then deal it one at a time into the **lit-up** part, top to bottom and around again. When the kind changes, the light restarts at the top. So `1/2(4x + 6)` is four boxes (2 + 2) and six counters (3 + 3). Dealing a different kind before the first kind is finished says *"Finish dealing the boxes first, then the counters."* and isn't a wrong try.
- **Take** n parts. **Flip**, **Answer** and **Check it** are as above, on the parts taken. For a fraction, the arrows in Check it run from the fraction to each term and the products are written as fractions first, `1/2 · 4x = 2x` and `1/2 · 6 = 3`.

## 4. Levels (draft, climbing as Group It does)

| # | Levels | Examples |
|---|---|---|
| 1 | A positive, B = `Cx + D`, all positive | `3(2x + 1)`, `2(x + 4)` |
| 2 | A positive, B has a negative constant | `3(2x − 1)`, `4(x − 3)` |
| 3 | A positive, B has a negative x term (or both negative) | `3(−x + 2)`, `2(−2x − 1)` |
| 4 | A negative, B = `x + D` (flip, with the hidden 1 for `−(…)`) | `−2(x + 4)`, `−(x + 3)` |
| 5 ★ | A negative, B has negatives; **challenge: the number can come first** | `−3(2x − 1)`, `−2(4 − x)` |
| 6 | Unit fraction of a group | `1/2(4x + 6)`, `1/3(3x − 6)` |
| 7 | Fraction of a group | `2/3(3x − 6)`, `3/4(8x + 4)` |
| 8 ★ | Negative fractions; **challenge: the number can come first** | `−1/2(4x − 6)`, `−2/3(6 − 3x)` |

- **★ Challenge levels (5 and 8) flip the order** (Karl: "x first at early levels, flip it at the challenge levels"): at least 2 of the 5 problems write B number first (`4 − x`, `5 + 2x`); the rest keep x first. The Fill step is the same: boxes and counters go in the oval in the order they're written, so the oval for `4 − x` is `+ + + + −□`, not boxes first. Cancelling isn't part of this pack, so order inside the oval is only for matching the problem.
- Generator rules (as for Boxes & Circles): 5 problems per level, no repeated answers, products with whole coefficients, and a cap on pieces so the Mat stays readable (A·|C| boxes plus A·|D| counters at most 20 pieces before the flip). Levels unlock in order. Group It's A limits apply (2 to 5 groups; fractions from `1/2` to `5/6`).

## 5. Mat and play screen

- The drawing is two-column like Group It's, **widening for − groups and fractions** so the original ovals, the arrow and the redrawn copy fit. Pieces inside an oval are only tapped as the Fill step adds them; they're removed with Undo (never one by one), so there are no tiny targets. Every play-screen target is at least 44px at 1366 × 657 and 1280 × 610, as before.
- The palette has the four piece buttons from Boxes & Circles, **Add group**, **+ groups** / **− groups**, **Copy to all**, **Flip all**, **Undo**, **Check**, and the pad (digits, ±, x, +, −, ⌫). Only the current step's buttons are live.
- Keys: digits, x, +, −, Backspace and Enter as in Boxes & Circles; **K** copies.

## 6. Hints, saving, pack map

- **Hints** after 3 wrong tries on a step, never making the move: Groups (the number in front, Add group pulses), + or − (the sign in front), Fill (what one group is, the piece button pulses, the groups that are off blink), Take, Collect (the groups to count blink, naming the sign, not the number), Answer (names each kind's sign, never the counts).
- **Save code v4:** Groups of Terms takes 8 more bits (Flip It 4 + Group It 7 + Boxes & Circles 5 + this 8 = 24). That needs 5 data symbols, so new codes are one character longer (`MAT-6` plus six symbols). v1, v2 and v3 codes still decode.
- **Pack map** (Karl: *all the same size, with scrolling inside any card that has many levels*): a fourth card, open from the start, 8 levels. **Every pack card is the same size**, and a card whose levels don't fit (Group It's 7, this pack's 8) **scrolls inside the card**, so the cards line up and the page doesn't scroll. On a wide screen (1100px+) the four cards sit in **one row**, left to right in the order students meet them; narrower screens use two columns, and phones one. The Coming-soon row keeps only Distribute, then combine. Because this helps right away, it can ship ahead of the pack as its own small step.

## 7. Build order (one step per cycle)

0. *(Optional, ahead of the pack)* Pack map: equal-size cards in one row, scrolling inside long level lists.
1. Term-group model (problem forms, the product, flip), level generator, and save code v4, with tests.
2. Static Mat: ovals with pieces in rows, the key, the arrow chain, the flipped copy and the fraction bar.
3. Groups and + or −, then Fill (one, copy to all, hand-fix).
4. Flip, Take (fractions) and Collect.
5. Answer (the pad), Check it (the distributing arrows), level flow, pack card, save code.
6. Hints, animations and the touch audit.

## 8. Open questions for Karl (answered ones are settled in the text above)

1. **Check it, show or type?** I made the distributing arrows **show-only** (they draw themselves and the products appear). The stronger version has the student **type the two products** (`6x`, `−3`) before the arrows confirm it, or even **draw the arrows** by tapping A then each term. Which do you want, or show-only at Levels 1–4 and typed after that?
2. **Challenge levels:** I picked 5 and 8 (the last whole-number level and the last fraction level). OK?
