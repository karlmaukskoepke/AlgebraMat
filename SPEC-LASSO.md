# The Mat — Group It pack spec (approved 2026-09-28, revised 2026-09-29)

> **Revised 2026-09-29 (Karl): the pack is now "Group It", and §10 replaces the step scripts in §3.** Where §2–§3 and §9 say "lasso", read "group"; where they disagree with §10, §10 wins. The pack's internal id stays `lasso` so saved progress and save codes still work.

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
- *(Build decisions, Lasso step 2)*
  - **Two-column layout.** The problem, its meaning in words ("opposite of 2 groups of −4"), and the final line sit on the left. The lasso stack and arrow chain sit on the right. Stacking everything in one column like the paper would shrink the lassos below 44px on a Chromebook window.
  - **Fractions:** the whole group sits in the left column, and the split parts stack on the right with the take bracket, so up to 6 parts stay tappable.
  - **Magenta underlines are for words only** ("opposite of", "opp."). A lone magenta minus, whether in front of a lasso or in the problem, isn't underlined, because minus-plus-underline reads as "=". The minus sign is itself the shape cue. This follows the notes, which underline "the opposite of" but not the minus.
  - **Parts that aren't taken fade** once any part is taken.
  - **Arrows are drawn shapes,** not font characters, so they read the same in every font.

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
- Once the first lasso is right, the student taps each remaining lasso to copy the group into it: one tap fills one lasso (Karl's choice).
- **Check** confirms every lasso holds B. Feedback: *"Each group is −2, so each lasso needs 2 negatives."* and *"This lasso has 3 — each group is −2."*
- **Build decision:** counters inside lassos are too small to tap one at a time at 44px, so removing is done with **Undo**, not by tapping a counter.

- *(Build decisions, Lasso step 3)*
  - Before the first group is right, tapping another lasso doesn't copy it. The student gets *"Fill the first lasso first: a group of −2 is 2 negatives."*
  - **Undo** takes back the most recent counter or copy.
  - Tapping an already-copied lasso copies again, which refreshes it after the first lasso changed.
  - One lasso can take up to 12 counters, and a student can draw up to 6 lassos (one more than any problem needs), so "too many" can still happen and get feedback.

**④ Count.**
- The student types the total of the groups on the pad, e.g. `−8`. It appears after `→` in the arrow chain.
- For + groups, this is the answer, and the problem is done.
- Wrong: *"Count all the counters in all the lassos."*

**⑤ Opposite** (− groups only; for + groups it shows as done):
- Tap **opp.** Every counter turns over to its opposite and is drawn magenta, and the arrow chain shows `opp. →`.
- Then type the final answer (`8`). Wrong: *"The opposite of −8 is…?"* (the hint gives it).
- *(Build decision, Lasso step 3)* Until **opp.** is tapped, **Check** and the pad stay dimmed (only the current step's controls are live). The typed number appears in the arrow chain as it's entered: `→ ?` while counting, then `opp. → ?` after flipping.

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

- *(Build decisions, Lasso step 4)*
  - The whole group is drawn by tapping the green lasso in the left column, with the same + / − palette and Undo as Fill. It holds at most 12 counters.
  - In Split, **Undo** takes back the latest deal (the counter goes back to the whole) or the latest part. It can't reach back into the already-checked whole.
  - A student can draw up to 7 parts (sixths are the most), so "too many" can still happen.
  - In Take, tapping a part toggles it. A part that isn't taken stays slightly faded while choosing.
  - A wrong fraction count says *"Count the counters in the parts you took."*
  - After Count, every fraction problem asks **opp.** or **No opposite**. The wrong choice gets *"There's a − in front of the fraction — it's the opposite."* or *"Look at the sign in front of the fraction — is there a −?"*
  - The palette is shared between the scripts. Fraction problems show **Add part** in place of **Add lasso**, and **No opposite** in place of the + / − groups buttons.

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
- *(Build decisions, Lasso step 1)*
  - **Level 2's single lasso holds up to 8 counters.** The level table allows B up to ±8, which overrides the general "at most 5 per lasso" limit; one lasso of 8 still fits.
  - **Fractions are in lowest terms:** unit fractions 1/2 through 1/6, and non-unit 2/3, 3/4, 2/5, 3/5, 4/5, 5/6. Unreduced forms like 4/6 are left out, to keep to the friendly fractions in the notes.
  - **Every level mixes signs inside the groups:** at least 2 positive and 2 negative values of B. Level 2 needs 1 of each, plus its 2 hidden-1 problems.
  - **Levels 1–2 lean small:** problems with at most 10 counters are 4× as likely.
  - **Seeds:** the level number is mixed into the seed, so paired levels (1 and 3, 4 and 5, 6 and 7) don't mirror each other under one `?seed=` link.
- **Unlocks:** finishing a level unlocks the next, as in Flip It.
- **Lasso is open from the start** (Karl's choice). It doesn't need Flip It finished first.

## 5. Pack map and future packs

- Lasso becomes a playable card.
- **Every pack card gets a subtitle that names the math** (Karl's choice):

  | Pack | Subtitle |
  |---|---|
  | Flip It | Subtraction with negative numbers |
  | Lasso | The meaning of multiplication as groups and opposites |
  | Boxes & Circles | Combining like terms |
  | Groups of Terms | The distributive property |
  | Distribute, then combine | Distributing, then combining like terms |

  The subtitle sits under the pack name, with the short blurb below it.
- Add "Coming soon" cards, in order, for the next packs in the notes:
  - **Boxes & Circles** (combining like terms: mystery boxes for x)
  - **Groups of Terms** (distributive property)
  - **Distribute, then combine**
- **Planned now so those packs slot in later:** a lasso's contents are a list of *terms*, `{ kind: 'int' | 'x', sign }`. In Lasso every term is a counter (`int`); Groups of Terms will put boxes (`x`) in lassos with the same Fill and Copy group moves.

- *(Build decisions, Lasso step 5)*
  - The pack map shows the two playable packs side by side, and a **Coming soon** row of three smaller dashed cards below them. Each shows only its name and subtitle, with no levels.
  - The Lasso blurb: *"Lasso the groups, fill them, count them, then flip for the opposite."*
  - Future packs are listed with `levels: 0`, so they add nothing to progress or save codes until they're built.
  - Finishing a pack names the next one: *"You finished Flip It! Next up: Lasso, on the pack map."* After Lasso: *"Boxes & Circles is coming soon."*
  - A Lasso level in play resumes after a reload, like Flip It.

## 6. Save code v2

- Lasso adds 7 level bits, 11 in all, which is more than v1's two data symbols hold (961 values, about 9.9 bits).
- **v2:** `MAT-` plus 5 symbols (version, 3 data symbols, checksum). That's 29,791 values, about 14.8 bits, which leaves room for one more pack.
- v1 codes still decode.
- *(Build decision, Lasso step 1)* New codes are always v2, even before Lasso is playable. Codes students write down now will keep working once Lasso ships. The version symbol shows the format: v1 codes start `MAT-3…`, and v2 codes start `MAT-4…`.

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

## 9. Decisions (Karl, 2026-09-28; 1 and 4 replaced by §10)

1. **Opposite:** the magenta "−" goes on each lasso in ②, and the counters flip at the end in ⑤. One tap on **opp.** flips every group at once.
2. **Lasso is open from the start.** Every pack card gets a subtitle naming the math (§5).
3. **Numbers stay limited as drafted.** The goal is conceptual depth, not fluency across the number system. Bigger ranges can come later.
4. **Filling:** the student taps each lasso to fill it, one tap per lasso, with no "fill all" button.

## 10. Revision: Group It (Karl, 2026-09-29)

Karl played Lasso and asked for these before moving on. They jumped the build order, ahead of step 6.

1. **Name:** "Group It", to match Flip It. The word "lasso" is gone from everything students see ("Add group", "group" in every message). Kids don't know what a lasso is.
2. **Bigger instructions** in both packs: the feedback line is 30px semi-bold (26px on short Chromebook screens, 22px on phones). Hints went up too.
3. **Whole-number script:** Groups → + or − → Fill → Flip → Count.
   - **Fill:** pick + or −, then tap *any* group, in any order, one counter per tap. 5(2) is ten taps. No "fill the first group, then copy." Check names the first group that's off ("The second group has 1 — each group is 2.").
   - **The − is part of the group:** choosing "− groups" puts a magenta − beside every group.
   - **Flip** (only for − groups): tap each − (or the group itself) to flip that group, or **Flip all**. A magenta arrow arcs from the − into the group, and its counters turn into their opposites, in magenta. + groups skip Flip.
   - **Count comes last, after the flip,** so the one number counted is the answer. No more counting before the flip and again after.
4. **Fraction script:** Groups → + or − → Fill → Take → Flip → Count.
   - **Groups:** make d groups, where d is the denominator. They're drawn as one **fraction bar**: d rectangles that touch, inside one outline, instead of separate ovals. The old "draw the whole group" step is gone.
   - **+ or −:** as for whole numbers; − puts one magenta − beside the bar.
   - **Fill (deal):** pick + or −, then deal B one counter at a time into the **lit-up** group, top to bottom, then around again. So 1/5(10) is two times around five groups. Tapping a different group says "the next counter goes in the lit-up group" and doesn't count as a wrong try. Undo takes back the latest counter, and the light moves back with it.
   - **Take** n groups, as before.
   - **Flip:** the bar's − (or Flip all) flips the groups taken.
   - **Count** the groups taken, after the flip.
- *(Build decisions, 2026-09-29)*
  - Unflipped −'s get a dashed magenta ring while flipping, to show they're tappable.
  - The static preview page (`?demo=lasso`) was removed. It showed the old flow.
  - `?pack=groupit&level=N` opens a level. `?pack=lasso` still works.
  - Step 6 (hints, the flip animation, the touch audit) comes next, on this new flow. The pack map now scrolls on a Chromebook (the 7-level card plus the Coming-soon row), so step 6's audit should decide whether to compact it.
