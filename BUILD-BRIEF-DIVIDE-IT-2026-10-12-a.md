# Build brief: Divide it fixes from Karl's first test  (2026-10-12, brief a)

**For Claude Code.** Read first: `SPEC-SOLVE-IT-LOOP.md` **rev 1.1** (note the new §3D, §3E, the renderer rule in §4, and the **Conformance checklist**) and `SPEC-DIVIDE-IT.md` **rev 2.1** (§10 items 15-21). These fixes sit on top of the rev 2.0 changes (§10 items 1-14). If any of items 1-14 are not built yet, build them in the same pass. Fix C1 below is the same thing as §10 item 1.

**Why this brief exists.** Karl built the one-step card to get a set of conventions right, and the rule is that **those conventions hold on every card from now on**. The three groups of fixes below are all places where Divide it dropped a convention. Please treat them as symptoms of the same cause: parts of the loop re-implemented per card. Where you can, **move each shared piece into one shared component** (the choice prompt, the work-stack row builder, the substitution renderer, the operation colour, the scaffold diagrams) so the next card can't drop it.

---

## A. Level 1 (numeric)

**A1. No work shown.** *Symptom:* taking ½ of the left side and then ½ of the right side doesn't show what each quantity becomes. *Expected:* each action adds rows to the work stack: the fraction applied (in blue), then the evaluated sides, then the Balanced / Unbalanced mark. Same for the ⅓ item and for every quiz answer. *Spec:* Divide it §3A items 1-2; loop §3E. *Acceptance:* in L1 item 2 with `2 × 6 = 3 × 4`, the stack reads `½(2 × 6) = 3 × 4`, `6 = 12`, `✗ Unbalanced`, then `½(2 × 6) = ½(3 × 4)`, `6 = 6`, `✓ Balanced`. A readout alone fails.

**A2. The matching operation isn't blue in the evidence.** *Symptom:* the quiz question colours the fraction blue (good), but the evidence rows shown after the answer don't colour the matching fraction. *Expected:* the fraction is blue in the question **and** in every evidence row. *Spec:* loop §3D; Divide it §3A quiz bullet. *Acceptance:* for "TAKE ⅓ of ONE SIDE ONLY", the evidence row `⅓(3 × 4) = 2 × 6` has its ⅓ in blue.

**A3. The final walkthrough needs the group diagram.** *Symptom:* the `3x = 6` walkthrough selects "take ⅓ of both sides" but shows no picture of what that means. *Expected:* **three groups of x** on the left (one box each) and **6 counters in three groups of 2** on the right; at the ⅓ step a **bracket around 1 of the 3 groups on each side** labelled "take 1 of the 3 groups: that is what × ⅓ does", the other groups fading; then the kept group alone. Karl: "that's honestly going to have to be added as a scaffold later anyway, so let's build it there", meaning this is the shared diagram component. *Spec:* Divide it §3A walkthrough, §3D. *Acceptance:* the bracket and the fade are visible at the ⅓ step, and the same component is what the counters scaffold and the x-alone "I'm stuck" use.

## B. Level 2

**B1. The substitution is rewritten incorrectly after a correct guess.** *Symptom:* when a correct guess is entered, the substitution is shown but the expression is not rendered correctly. (Karl didn't note exactly what was wrong; **please reproduce it and tell us what it showed**.) *Expected:* the loop's renderer rule: the equation exactly as written, every x replaced by the value, **negative values in parentheses**, **coefficient written as ×**. Test cases to put in the test suite: `3x = −12`, −4 → `3 × (−4) = −12` · `x − 6 = 9`, 15 → `15 − 6 = 9` · `−3x = 12`, −4 → `−3 × (−4) = 12` · `12 = −x`, −12 → `12 = −(−12)` · `7 = x + 3`, 4 → `7 = 4 + 3`. Suspects to check first: a negative value shown without parentheses, the coefficient dropped (`−4 = −12`), substituting into a simplified equation when the original is required (loop §1B). Check **both guess paths** (a correct guess at the first state, and a guess typed after a partial move). *Spec:* loop §4, §1B. *Acceptance:* the tests above pass, and a correct guess on every L2 form renders correctly.

**B2. "I'm stuck" at the last step shows no diagram, and the equation vanishes.** *Symptom:* at `x = ⅓(6)`, pressing I'm stuck makes the equation disappear and then reappear; no rung starts and there is no diagram. *Expected:* the **group diagram** on every rung, drawn in its reserved area, with **the work stack staying on screen**: Rung 1, 6 counters in one pile and "What is ⅓ of 6? Share the 6 into 3 equal groups."; Rung 2, the student deals the 6 into 3 groups and keeps 1 of the 3; Rung 3, the 6 arrive already in 3 groups with one bracketed. **No numeral is printed:** the student counts the kept group and types it. Karl: "this is the same kind of diagram we'd use in Count it, where we deal with fraction multiplication", so **find and reuse that component** (the fraction-of-a-group work in Count it / Group It). *Spec:* Divide it §5 (x-alone ladder), §3D; loop §6. *Acceptance:* at `x = ⅓(6)`, each of the three clicks of I'm stuck shows its diagram and the equation never leaves the screen. Check the same at `x = ⅕(35)` and at `x = ⅙(−18)` (negative counters).

## C. Level 3

**C1. The choice prompt changes and offers options that don't work.** *Symptom:* on `4x = −16`, taking ½ of both sides gives `2x = −8`; the line then asks the student to "guess again" or "use a step", and that is not actually an option. *Expected:* **the same prompt, word for word, and the same two working buttons after every move**: "Would you like to guess the solution (the value of x), or use a move to make the problem simpler?" with **Guess x** and **Use a move**. Guess x always leads to guess mode (the `x = [▁]` row live, moves greyed); Use a move always leads to move mode. *Spec:* loop §1A (the shared-string rule); Divide it §3B, §10 items 1 and 20. *Acceptance:* write a test that walks `4x = −16` through `×½` and asserts, at every state with x not alone, that the line text equals the shared constant and both buttons are enabled and lead to the right mode. The same prompt must be used by every Solve it card.

---

## Please report back

1. The results of the **Conformance checklist** (loop, the section after §8) for Divide it, line by line.
2. **What B1 actually showed** before the fix.
3. The **name and file of the fraction-of-a-group diagram component** you reused for A3 and B2 (so we can confirm it is the Count it one).
4. The **deployed address** where Karl can test, and whether Divide it is behind a flag or already visible.
5. Anything in rev 2.1 that you couldn't follow or that conflicts with the code.
