# The Mat — Lasso pack spec (DRAFT for Karl's review)

*This builds on SPEC.md: same engine, screen shell, rules (no timers, no penalties, hints after 3 wrong tries), storage and save code. Only what's new or different is written here. The source is Mr. Mauks's notes, "Integers & Algebraic Expressions", page 1 (Multiplication) and page 2 (A fraction of a group), plus Karl's answers on 2026-09-28.*

## 1. What Lasso teaches

**A(B) means A groups of B.** A is the number of groups and B is what's inside each group.

- A can be a whole number (3), the opposite of one (−, written as −1), the opposite of a whole number (−3), or a friendly fraction (1/2 up to 5/6, denominators 2–6, positive or negative).
- B is a positive or negative whole number.
- Students lasso groups of counters, count them, and take the opposite when the groups are negative.

## 2. Visual language (as in the notes)

| Color | Meaning in Lasso |
|---|---|
| Blue `#0072B2` | **How many groups:** A, the fraction's numerator and denominator, the *split* lassos, and the "take" bracket. |
| Green `#009E73` | **Inside a group:** B, the regular lassos, and the counters inside them. |
| Magenta `#B8508F` + underline | **Opposite:** the minus in front of an opposite group, the **opp.** arrow, and counters after flipping. |
| Ink | Problem text, totals, answers. |

- **Split color deviates from the notes, by Karl's choice.** The notes draw the denominator and split lassos in magenta. On the Mat they're **blue**, so magenta only ever means "opposite".
- **A lasso** is a stroked oval (no fill) around one row of counters. Lassos stack in a column, as in the notes.
- **Counters** are the same stroked + and − marks as Flip It, drawn green inside a lasso.
- **Opposite group:** a magenta, underlined "−" sits just left of each lasso that is an opposite group.
- **The arrow chain** reads to the right of the stack, as in the notes: `→ −8`, then magenta `opp. → 8`.
- **The student's final line** is written in Kalam at the bottom, e.g. `−2(−4) = 8`.
- Vermillion (cancel) isn't used in Lasso.

## 3. Screens and steps

Same shell as Flip It: header, step bar, Mat, feedback line, hint line, palette, and number pad. Two step scripts are needed: one for whole-number groups and one for fraction groups. The step bar shows whichever script the current problem uses.

### 3a. Whole-number groups: 3(−2), −(−5), −2(−4)

**① Groups.**
- *Only for problems written `−(B)`:* first rewrite it as `−1(B)`. Tapping the gap before the parenthesis writes a blue Kalam **1**. Feedback: *"There's 1 hidden group — write the 1."*
- Tap **Add lasso** to draw empty lassos, one per tap. Tapping a lasso removes it. **Check** confirms there are |A| lassos. Feedback: *"The number of groups is 3 — you have 2 lassos."*

**② + or − groups?**
- The student chooses **+ groups** or **− groups (opposite)**.
- Choosing − puts the magenta "−" in front of every lasso.
- Wrong choice: *"Look at the sign in front of the groups."*

**③ Fill.**
- Pick + or − in the palette, then tap the first lasso to add counters, one per tap. **Undo** removes the last one.
- Once the first lasso is right, **Copy group** fills the next empty lasso on each tap.
- **Check** confirms every lasso holds B. Feedback: *"Each group is −2, so each lasso needs 2 negatives."* and *"This lasso has 3 — each group is −2."*
- **Build decision:** counters inside lassos are too small to tap one at a time at 44px, so removing is done with **Undo**, not by tapping a counter.

**④ Count.**
- The student types the total of the groups on the pad, e.g. `−8`. It appears after `→` in the arrow chain.
- For + groups, this is the answer, and the problem is done.
- Wrong: *"Count all the counters in all the lassos."*

**⑤ Opposite** (− groups only; for + groups it shows as done):
- Tap **opp.** Every counter turns over to its opposite and is drawn magenta, and the arrow chain shows `opp. →`.
- Then type the final answer (`8`). Wrong: *"The opposite of −8 is…?"* (the hint gives it).

### 3b. Fraction groups: 2/3(−6), −1/4(−16)

**① Whole group.** Draw B as one green lasso, using the same palette and Undo as Fill. Check confirms the type and count.

**② Split** (Karl's choice: the student deals the counters out):
- Tap **Add part** to draw d empty **blue** lassos under the whole.
- Tapping a part moves one counter from the whole into it.
- Check requires that the whole is empty and every part is equal. Feedback:
  - *"Split into 3 parts — you have 2."*
  - *"The parts aren't equal yet — each part needs the same number."*
  - *"Deal out every counter first."*

**③ Take.** Tap parts to take them; a blue bracket labeled "take n" appears. Check confirms n parts are taken. Wrong: *"The top number says how many parts to take."*

**④ Count.** Type the value of the taken parts (−4).

**⑤ Opposite.** Choose **opp.** or **No opposite**. The choice is required, like "Nothing to rewrite", so students can't flip blindly. Negative fractions then flip and ask for the answer again, as in 3a ⑤.

**Answer entry:** same ± pad. Every step's answers are signed integers.

## 4. Levels (Karl's order)

Each level has 5 problems, the same generator rules as Flip It (seeded, no repeated answers, small numbers favored early), and no zero anywhere.

| Level | Type | Examples | Limits |
|---|---|---|---|
| 1 | Positive groups | 3(−2), 4(3) | A 2–5, B ±1–5, |A·B| ≤ 20. At least 2 with positive B and 2 with negative B. |
| 2 | Opposite of one group | −(−5), −(4), −1(−3) | B ±1–8. At least 2 written `−(B)`, so the student has to write the 1. |
| 3 | Opposite of several groups | −3(5), −2(−4) | A −2 to −5, B ±1–5, |A·B| ≤ 20 |
| 4 | Unit fraction of a group | 1/4(−16), 1/2(6) | d 2–6, B = ±d·k with k 1–3, |B| ≤ 12 |
| 5 | Opposite unit fraction | −1/3(−9) | as Level 4 |
| 6 | Fraction of a group | 2/3(−6), 4/5(−10) | 1 < n < d ≤ 6, B a multiple of d, |B| ≤ 12 |
| 7 | Opposite fraction | −2/3(−6) | as Level 6 |

- **Counter limits:** at most 20 counters on the Mat, at most 5 lassos of at most 5 counters for whole-number groups, and at most 12 counters to deal in fraction problems. That keeps every tap target at 44px on a Chromebook window (1366×657).
- **Unlocks:** finishing a level unlocks the next, as in Flip It.
- **Proposal: Lasso is open from the start.** It's a separate topic, and teachers may assign it directly, so it wouldn't need Flip It finished first.

## 5. Pack map and future packs

- Lasso becomes a playable card.
- Add "Coming soon" cards, in order, for the next packs in the notes:
  - **Boxes & Circles** (combining like terms: mystery boxes for x)
  - **Groups of Terms** (distributive property)
  - **Distribute, then combine**
- **Planned now so those packs slot in later:** a lasso's contents are a list of *terms*, `{ kind: 'int' | 'x', sign }`. In Lasso every term is a counter (`int`); Groups of Terms will put boxes (`x`) in lassos with the same Fill and Copy group moves.

## 6. Save code v2

- Lasso adds 7 level bits, 11 in all, which is more than v1's two data symbols hold (961 values, about 9.9 bits).
- **v2:** `MAT-` plus 5 symbols (version, 3 data symbols, checksum). That's 29,791 values, about 14.8 bits, which leaves room for one more pack.
- v1 codes still decode.

## 7. Required tests (Vitest)

- **Generator:** every Lasso level meets its limits (A, B, d, n ranges; |A·B| ≤ 20; B divisible by d; no zero; no repeated answers; the Level 2 mix). The same seed gives the same set.
- **Groups:** the lasso count must equal |A|. On `−(B)` problems, the 1 must be written first.
- **+ or −:** correct for every sign of A.
- **Fill:** every lasso must hold B, with the right type and count. Copy group copies exactly the first lasso.
- **Split:** the whole must be empty, there must be d parts, and they must be equal. Unequal or leftover counters are rejected with the right feedback key.
- **Take:** exactly n parts.
- **Count and Opposite:** only the right signed integers pass. "No opposite" passes only when A > 0.
- **Save code v2:** round-trips every state of both packs, v1 codes still decode, and a bad checksum is rejected.

## 8. Build order (one step per cycle, as before)

1. Lasso engine (group-problem model, 7-level generator) with tests, plus save code v2.
2. Static Lasso Mat for both scripts: lassos, opposite marks, arrow chain, split parts, take bracket. Uses a hard-coded problem.
3. Whole-number moves: Groups (with the rewritten 1) → + or − → Fill (+ Copy group) → Count → Opposite. Validators and tests first, then the UI.
4. Fraction moves: Whole → Split (deal) → Take → Count → Opposite. Validators and tests first.
5. Lasso level flow on the pack map, the new "Coming soon" cards, and saving.
6. Lasso hints, the flip animation for groups, and the touch-target audit at 1366×657.

## 9. Open questions for Karl

1. **Order inside ① and ②:** your notes draw the groups, then take the opposite of the *total*. Your message says to mark each lasso as opposite *before* filling. This draft does both: the − marks go on in ②, and the counters flip in ⑤. OK?
2. **Is Lasso open from the start,** or does it unlock after Flip It?
3. **Limits:** up to 5 groups of up to 5 (and fractions of up to 12). Too big, too small?
4. **Copy group:** one tap per lasso (as drafted), or one tap fills all the rest?
