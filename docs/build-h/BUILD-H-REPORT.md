# Build H report: Karl's testing of Build F, the seesaw that mirrors the check, big numbers at x alone (2026-10-21)

Everything is on `main` (Parts 0 to 3, each pushed after the unit tests and `npm run parity` passed). No flags. Unit tests: 1163 pass.
`npm run parity`: all five checks pass; the differences are listed in `tests/parity/INTENDED-CHANGES.md` (Part 1 changes some screens; Parts 2 and 3 change none).
Open this first: the test-links page, Features to check section. It has **14 new items** (21 in all); each one is walked in `tests/features/walk.mjs`.

## The first step: Build G's walks on the live site
**Not done: this container cannot reach `karlmaukskoepke.github.io`** (the network answers 403 for that address), exactly as in Build G. What I did instead: ran the
seven Build G walks against a local copy of `main` before starting (all seven pass), and again after Parts 1 to 3 (all seven still pass). The live run is still owed:
`node tests/features/walk.mjs https://karlmaukskoepke.github.io/AlgebraMat/ docs/build-h`, from a machine that can reach the site. To let a future session do it,
add `karlmaukskoepke.github.io` to the environment's allowed domains.

## Part 0: the "never grey out what the question is about" rule
Recorded in `docs/design/DECISION-LOG.md` (2026-10-20: Build F review) and in the loop spec, now rev 2.1 (section 2B and conformance line 12).
Audit of every pop-up and scaffold on Add to both sides and Divide it:

| Pop-up or scaffold | Before | Now |
|---|---|---|
| Not balanced (a wrong guess or value) | only the "Not balanced" label lit; the two values greyed (Karl's item 1) | last check row and label lit; on the seesaw the balance is lit too |
| "Now type x" after the right Party or Battle (Karl's item 5) | the two numbers greyed | the two numbers lit with the field |
| **"That is the equation. Now choose a move." (seesaw just built)** *(not on Karl's list)* | the equation and the seesaw greyed; only the moves lit | equation, seesaw and moves lit |
| **A wrong sum when combining two terms** *(not on Karl's list)* | only the sum box lit; the two terms being combined greyed | the two terms are lit with the box (Features to check item, walked) |
| Checking a value on the seesaw | the seesaw greyed once the first line was written | the seesaw is lit with the check |
| Party or Battle at the numbers; on the seesaw's pair; the forced-move pop-up; the check pop-up; the combine pop-up; Divide's "doesn't split" | already lit what they are about | unchanged |

Left as they are, for your decision: the red-move spotlights ("got bigger", "still here", "now 0") light the numbers the message is about and the sum, and grey the rest of the equation (still readable, not hidden). The student is not being asked about the equation there.

## Part 1: ten quick fixes
1. **Not balanced shows its reason.** The final check row (the two unequal values) is lit with the label, in the error spotlight, on both cards.
2. **The substituted value is blue** in the first check line, the blue of the x it replaced (also when it is the operation about to happen).
3. **Green checks above each filled x** when the equation has more than one x: built in the loop (one drop per x, any order; the copy and its first line appear once every x has the value). No card has two x's, so there is no button; the picture is drawn from a test state (`docs/build-h/two-x-checks.png`, made by the walk).
4. **The faint number starts after 2.5 seconds** (was 4); still dragging only.
5. **No greying of the numbers at "Now type x"** (Add; Divide has no Party or Battle).
6. **The drag preview matches on both sides:** the dragged term is drawn grey in place on the side it stays on, and when it is dropped back where it started (it was a dashed empty box).
7. **A typed / switches Multiply to the fraction blank:** the whole-number box becomes the fraction, what was typed is the top, the cursor is in the bottom (1, /, 5 makes 1/5). A top of more than one digit gets the unit-fraction pop-up.
8. **Fraction boxes can be retyped:** a click on either box clears it and puts the cursor in it; the small cue "Tap a box to retype it" sits under the open fraction. (There is no / key on the touch keypad, so a student on a tablet picks the fraction option instead.)
9. **Enter presses the green button, never I'm stuck, Teach me or Start over.** While a move box holds a valid number the green button says Go, so Enter applies it; the second Enter does nothing.
10. **"Nice drawing!" is gone** from the counters the student did not draw: Solve it's own adapter says "Party or Battle?" instead (Count it is not touched).

## Part 2: the seesaw mirrors the check
Only when the seesaw was opened by I'm stuck or Teach me. As soon as a value is checked, the balance is redrawn as the **original** equation with an empty x box to drop the value on; each press of Next
draws the line just written: the x box becomes that many counters in a blue box with a small x above it (one labelled box past 12), the numbers beside it are counters, and the pair that combined becomes one group.
The beam is level for a right value and tips the way it really tips for a wrong one; the readout says Balanced or Not balanced only at the last line. All of it lives in the right-hand space with the check. 1366×768 and 1366×650 are in this folder. Nothing was left over from the brief.

## Part 3: big numbers at x alone
At `x = b + k` with either number over 12, after the right Party or Battle: a battle shows two small boxes side by side above the numbers ("Who won? −15 or 2?" with a big + and a big −; "Subtract 15 − 2 to find how many are left.", dimmed until the first is answered); a party shows only "Add 2 + 13 to find how many in all." The numbers stay lit, the rest is grey, and the student types x. A wrong sign says why and asks again. Up to 12 is as before. No new class-sheet words (the Party or Battle at the numbers still records `hint`).

## Decisions for Karl (recommendations first)
1. **Red-move spotlights** light the numbers the message is about, not the whole equation. *Recommend: leave.*
2. **The beam is honest from the first line** of the seesaw check (level for a right value from the start), with the words Balanced / Not balanced only at the end. *Recommend: keep.*
3. **Two x's:** the copy of the equation and its first line appear after every x has the value (the loop spec says on the first drop). *Recommend: keep until Variables on both sides is built, then look at it with real problems.*
4. **The "Subtract" or "Add" box has no button.** It wakes when "who won" is answered (a party shows it at once), and the student types x. *Recommend: keep; a Got it button would add a click to every problem.*
5. **The seesaw's own Party or Battle** (its pair beside the move) does not get the two questions at big numbers; only the bare x-alone help does. *Recommend: leave; the seesaw is about the move.*
6. **Allow `karlmaukskoepke.github.io`** in this environment's network settings so a session can walk the live site itself.

## Not verified
- The live site (see above).
- The two-x check on a real problem (no card has one).
- "That is the equation. Now choose a move." keeping the equation and seesaw lit: checked by eye on a screenshot, but it has no Features to check item (building the seesaw by hand is about 20 taps, too long to ask of a tester).

## Pictures (this folder)
`h-*-768.png` and `-650.png` for each item; the two-x test state; the faint number on its way; both sides of the drag preview; the fraction cleared by a click; the seesaw's first line and last line; the two questions for a battle and a party. They are linked from the test-links page (Live, "Build H screenshots").
