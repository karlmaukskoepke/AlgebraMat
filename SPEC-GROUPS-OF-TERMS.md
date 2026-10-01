# The Mat: Groups of Terms pack spec (approved 2026-10-01)

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

## 8. Settled (Karl, 2026-10-01)

1. **Check it is show-only:** the distributing arrows draw themselves and the products appear; the student doesn't type or draw them.
2. **Challenge levels are 5 and 8:** B can be written number first.
3. Earlier answers: x first at early levels; deal one kind at a time, in either order; no separate Collect step (the student writes the final answer, then Check it shows the arrows); pack cards all the same size, scrolling inside long level lists.

## 9. Build decisions, step 1 (model, generator, save code v4)

- **A problem** is `{ kind: 'termgroups', count: { neg, n, d }, inside: [term, term], hidden1 }`. A is stored as in Group It; `inside` is B's two terms **in the order written** (`x` and a number), each signed as it reads after its operation. So `−2/3(6 − 3x)` is neg, n 2, d 3, inside `[int 6, x −3]`.
- **Math:** the groups hold `n·C/d` boxes and `n·D/d` numbers; an opposite flips both. Every candidate has whole products (d divides C and D).
- **Levels as §4,** with these generator limits: whole-number groups use 2–5 ovals, up to 4 boxes and 5 counters per group, at most 20 pieces in all (problems with at most 12 are 4× as likely on Levels 1–4). Fraction levels use denominators 2–6 in lowest terms, C and D multiples of d up to 12 each, and at most 14 pieces to deal out. Level 4 and 5 also include `−1(B)` and the hidden-1 `−(B)` (Level 4 needs at least 2 of those). Level 5 and 8 need at least 2 number-first and at least 1 x-first. Fraction levels need at least 3 problems with a negative term and at least 1 all-positive.
- **Check it lines** (`distributeLines`): one per term in the order written, in the form `−2 · (−4) = 8`, from A as it reads (with its sign), so the arrows run from A itself and agree with the typed answer.
- **Save code v4** (`MAT-6` plus six symbols) carries Groups of Terms (pack id `groups-of-terms`, 8 levels, bits 16–23). The pack is still a Coming-soon card, so its bits are read and dropped until it opens (step 5). v1, v2 and v3 codes still decode.
- **Not visible yet:** this step is engine only.

## 10. Build decisions, step 2 (the static Mat)

- **Preview page:** `?demo=groupterms` draws the Mat in every state: filled ovals, the typed answer, Check it, − groups before and after the flip, the hidden 1, a challenge-level (number first) oval, fractions dealt and taken, both Check it forms, and the most crowded problems. It's removed when the pack becomes playable (step 5).
- **It reuses Group It's Mat:** the same geometry, colors and classes (blue A, green inside, magenta opposite). Pieces are Boxes & Circles': a square for a box, a square with a dash at its left for −x, and + and − marks. They're green in an oval, magenta once flipped.
- **Ovals are 56 tall and bar parts 54** (Group It's are 50 and 48), because this drawing is wider and scales down. Every oval, part and − mark is at least 49px on a Chromebook (the widest problems, 9 pieces per group flipped, scale to about 0.87).
- **The count after the arrow** can be an expression (`→ −8x − 10`), so the drawing widens to fit it, up to about 1100 units.
- **Pieces in an oval close up** from 30 to 22 apart for 6 to 9 in a group, and shrink a little so neighbors don't touch.
- **Check it** replaces the problem text on the left: the problem set out as separate words (A in blue, the terms in green), a blue arrow from A over the top to each term (they draw themselves in), the two products written out below, then the combined line. Fractions read `1/2 · 4x = 2x` there.
- **The left column** is a little smaller than Group It's (the problem at 36px, the final line at 28px and allowed to wrap), so `−2/3(−3x − 6) = …` fits.

## 11. Build decisions, step 3 (Groups, + or −, Fill)

- **Playable up to Fill** at `?pack=groups-of-terms&level=N` (levels 1 to 8) while the pack is built. It's still a Coming-soon card, nothing is saved, and a problem waits after Fill (Flip, Take, Answer and Check it come next).
- **Groups and + or −** are Group It's, unchanged: Add group, tap a group to erase it, the typed hidden 1 for `−(B)`, then + groups or − groups. The checks and most messages are Group It's own; the pack's table only overrides what mentions counters.
- **Fill, whole-number groups:** pick a piece (□, −□, + or −), tap a group to add one. **Copy to all** (key **K**) repeats the first group in every other group; Undo takes back one piece or a whole copy. A group holds what B needs plus 2 (never more). Check names the first group that's off and says what each group needs (*"The second group isn't (2x − 1) yet. Each group needs 2 boxes and 1 negative."*); it accepts the pieces in any order. A wrong sign (a box where a negative box belongs) is off too.
- **Fill, fraction bar:** pick a piece and deal it one at a time into the lit-up part, top to bottom, around again. **One kind at a time, either order:** dealing the other kind before the first is finished says *"Finish dealing the boxes first, then the other kind."* and isn't a wrong try. The light restarts at the top for the next kind. There's no Copy to all (the button hides). Check wants all of B dealt, in equal parts.
- **Keyboard:** digits type the hidden 1, K copies, Backspace is the pad's delete or Undo, Enter is Check (as in the other packs). The x, + and − pad buttons exist but stay dim until the Answer step.
- **Taps:** every play-screen target is at least 44px at 1280 × 610 (checked on Levels 1, 4 and 6).

## 12. Build decisions, step 4 (Take and Flip)

- **Playable up to the answer** at `?pack=groups-of-terms&level=N`: after Flip (or after Fill for + groups) the problem waits for the Answer step in the next build.
- **Take (fractions):** tap a part to take it, tap again to put it back, then Check; exactly n parts (Group It's check, *"The top number says how many groups to take."*).
- **Flip (− groups):** as Group It §12. Tap a group's `−` (or the group, or **Flip all**) and an arrow draws to a redrawn copy on the right, every piece turned to its opposite in magenta and no `−`. The original stays as drawn (the session only marks a group `flipped`). On a fraction bar the one `−` flips the parts taken. When every group has flipped, the problem goes to the Answer step; + groups skip Flip.
- **Palette:** Flip all joins the row. To keep the row on one line at 1280 × 610 (so the Mat doesn't shrink) this pack's buttons are a little tighter (16px labels, 9px padding, 46px piece buttons); every target is still at least 44px.

## 13. Build decisions, step 5 (Answer, Check it, level flow, the pack card)

- **Groups of Terms is open** on the pack map as the fourth card (8 levels, Level 1 open, the rest unlocking in order, saved in `mat.v1` and in save code v4, bits 16 to 23). The Coming-soon row is now only Distribute, then combine. `?demo=groupterms` is gone; `?pack=groups-of-terms&level=N` opens a level.
- **Answer:** the pad (digits, x, +, −, ⌫) and the keyboard (digits, x, +, −, Backspace, Enter) type the combined result, shown after the arrow as it's typed. Boxes & Circles' rules and messages: either order, `x` or `1x`, fully combined, up to 12 characters; wrong answers say which kind is off (the boxes or the numbers), never the number.
- **Check it:** a right answer goes to the Check it step: the problem text becomes the distributing arrows (blue, drawn in, from A to each term), the two products written out (`−1/2 · (−4) = 2`, `−1/2 · 6x = −3x`), and the combined line in the order B is written (`= 2 − 3x`). The Mat's groups stay beside it. It is show-only (Karl). **Check becomes Next →** (Enter does it too); there's no timer, so students can read it. Wrong answers count toward hints; Check it has none.
- **Pack map, four cards:** one row of four on a wide screen, each card about 290px wide, so level buttons go two to a row and a long list (Group It's 7, this pack's 8) scrolls inside its card. The cards are equal size, and the page doesn't scroll at 1366 × 657 or 1280 × 610. Narrower screens use two columns, phones one.

## 14. Build decisions, step 6 (hints, animations, touch audit)

- **Hints** appear after 3 wrong tries on a step (the same rule as the other packs), in Kalam under the feedback, and stay until the step changes. A hint shows the move and never makes it. Group It's hints are used for Groups, + or − and Take (the hidden-1 gap pulses; Add group pulses, or the extra groups blink; the right + groups or − groups button pulses; the first n parts blink as an example). This pack adds:
  - **Fill, whole numbers:** says what one group is (*"Each group is (2x − 1): 2 boxes and 1 negative"*), pulses the next piece to pick for the first group, then Copy to all, and blinks every group that's off.
  - **Fill, fractions:** says what all of B is, and pulses the piece button for the kind being dealt (or the next kind to deal). The lit-up part is already shown.
  - **Answer:** the groups to read (the flipped copies, or the parts taken) blink, and the hint names the sign of the boxes and the numbers, never how many.
  - Flip and Check it have no hints (a − can't be tapped wrongly, and Check it asks for nothing).
- **Animations** (all off with reduced motion): a piece just added pops in (Copy to all pops the new copies), the flip turns the group over and draws its arrow, and Check it's arrows draw themselves in.
- **Touch audit:** every play-screen target is at least 44px at 1366 × 657 and 1280 × 610, checked over Levels 1 to 8, three seeds each: ovals and bar parts 50px or more, the − marks 49px or more, palette buttons 44px.
- **Groups of Terms is complete** (SPEC-GROUPS-OF-TERMS.md §7, all six steps).

