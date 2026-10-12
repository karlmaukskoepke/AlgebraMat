# Build brief: Divide it fixes from Karl's second test  (2026-10-12, brief b)

**For Claude Code.** Read first: `SPEC-SOLVE-IT-LOOP.md` **rev 1.2** (changed: §3C step highlight, §4 drag target, §6 scaffold rules, the conformance checklist) and `SPEC-DIVIDE-IT.md` **rev 2.2** (§10 items 22-27). Do this **together with brief a** (`BUILD-BRIEF-DIVIDE-IT-2026-10-12-a.md`). **This brief supersedes brief a's B2 rung structure:** at x alone, "I'm stuck" now has **two** rungs (see D3), not three.

**Principle behind this round:** the check must visibly connect to the original equation, a scaffold click must give the student something to do (not just a picture), and a picture the student needs must not disappear. As in brief a, please treat these as shared behaviours and put them in **shared components**, so no card can drop them.

---

## D. Fixes

**D1. The drag target is unclear, and the value isn't shown replacing x in the original equation.** *Symptom:* the student isn't told what to do when dragging or clicking the solution back onto x, and the substituted equation just appears under the place where the solution is listed, with no visible link to the original equation at the top. *Expected:* the line says **"Drag your answer onto the x in the original equation."** (tap alternative: "or tap your answer, then tap the x"). The **drop target is the x in the original equation row at the top of the stack** (for a wrong guess at a simplified state, the x in the current equation row) and it pulses blue. On the drop, the value **flies to that x and takes its place in that row** (blue, in parentheses when negative); the substituted equation is then written as the **first check row**, and the top row goes back to x, so the history stays. The check then runs a line per click. *Spec:* loop §4; Divide it §3B. *Acceptance:* after the drop, the substituted value is visible in the top row before the first check row appears. A check that only writes a line under the answer fails. This is my reading of "show it replacing it at the top"; if the result isn't what Karl meant, tell us what you built.

**D2. A stray underline sits under the first check equation.** *Symptom:* a line under the first equation of the check looks like a division bar. Karl: it's an underline, confusing and redundant; a bracket would be better but is unnecessary. *Expected:* **no underline or bracket under any check row.** The step highlight is **bold plus the accent colour on exactly the characters of the operation about to happen**, and its result appears in the next line in the same colour. *Spec:* loop §3C (changed in 1.2). *Acceptance:* no underline, border or bracket element is drawn under any check row; the highlight covers only the operation's characters. **Suspects:** the old "outline the equation being plugged into" border, or a step highlight drawn across the whole row.

**D3. "I'm stuck" at x alone: the first rung is just a pile of counters.** *Symptom:* at `x = ⅓(−18)`, I'm stuck draws a box of 18 negative counters, which doesn't help. *Expected:* **two rungs.** **Rung 1 (merged):** the expression stays on screen and the counters appear in one pile with the line "What is ⅓ of −18? Share the counters into 3 equal groups." **The student can deal at once** into 3 groups and keep 1 of the 3 with a bracket; they count it and type the value, or type at any point. **Rung 2 (guided):** the counters arrive already in 3 equal groups with one group bracketed; the student counts it and types it. No numeral is printed. *Spec:* Divide it §5. *Acceptance:* at `x = ⅓(−18)` the first click lets the student deal immediately, Check works after dealing, and typing is allowed at any point. Also check `x = ⅕(35)` and `x = ⅙(−18)`.

**D4. "I'm stuck" at a normal state: merge the first two rungs.** *Symptom:* the first click only shows how many counters there are. *Expected:* **two rungs.** **Rung 1 (merged):** the counters scaffold appears with the equation standing on it (`6x = 12` is **six x boxes** on the left and **all 12 counters** on the right), the number in front of x outlined, and the question "What fraction of both sides leaves one box?" The student can start dealing immediately, then takes the fraction (in the order the scaffold already uses), and can type the answer at any point. **Rung 2 (guided):** the matching fraction button is highlighted; the student still deals every counter and keeps a group. *Spec:* Divide it §5. *Acceptance:* on `6x = 12`, one click gives boxes, counters and working dealing. The dealing itself already works and should not change.

**D5. Applying the fraction deletes the picture.** *Symptom:* after the student deals, then takes the fraction and clicks it, the picture they just made disappears. *Expected:* the counters and groups **stay on screen** exactly as the student left them, with the kept group highlighted, until the student clicks **Next** (which folds the move). The student likely still needs them. *Spec:* Divide it §3C; loop §6. *Acceptance:* after Go, the picture is still there and the work-stack row for the move has been added; it goes away only on Next. (Whether the other groups also fade is still undecided, so don't add that yet.)

---

## Please report back

1. Results of the loop's **conformance checklist** (updated in rev 1.2, lines 4 and 5) for Divide it.
2. For **D1**, a short description or screenshot of what the drop now looks like.
3. For **D2**, where the stray underline was coming from.
4. Where the shared pieces now live: the drag-to-x interaction, the step highlight, the scaffold-picture persistence.
5. Anything in loop rev 1.2 or Divide it rev 2.2 you couldn't follow or that conflicts with the code.
