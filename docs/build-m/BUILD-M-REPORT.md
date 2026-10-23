# Build M report: Distribute, combine, solve, in basic form (2026-10-23)

Everything is on `main` and live, with no flags. There were three pushes: Parts 0-1 (the placement quiz fixes), then the card (all five
levels), then the drill deletion and the Features to check walks. Each push came after the unit tests and a full `npm run parity`
passed (1,426 unit tests at the end). All 15 new Features to check items were walked on the live site and pass; the older items were
walked there again too (see "Walked on the live site").

## What was built

**Part 0, recorded.** `docs/design/DECISION-LOG.md` has "2026-10-23: Build L review and the Distribute card": Build L's decisions
approved, students placed before Build L get the new Two-step levels, and the card's design: dividing first on a parenthesis, Levels 1
and 2 merged, one build, the Build it link in place of a walkthrough, and Build it's modules staying read-only.

**Part 1, the placement quiz.**
- **A result saved before Build L** now opens the new Two-step card's levels it showed, with the same mapping as a new placement. It
  happens once, when the device loads the result, and the result is then saved as today's. It only opens levels: nothing is marked done,
  and nothing already open closes. Tested with an old saved result on a device that had other levels done (`tests/diagnostic.test.js`).
- **"Start at Level −1"** is gone. One-step equations opens at its saved Level 3, so a recommendation of 1 or 2 is now its Level 1.
  The button also starts that level (before, it started One-step's old saved Level 1, `x + a = b`).
- A test link, `?olddiag=solve&seed=7`, puts an old saved result on the device so Karl can see it.

**Part 2, the card.**
- Its id is **`distribute-solve`**, its title is "Distribute, combine, solve" and its subtitle is "Multiply each piece, then solve".
  It sits in Solve it after Two-step equations. (`distribute-combine` is Build it's card, and `distribute-drill` was the drill.)
- Five saved levels, shown as saved, with no walkthrough:
  1. `a(x ± c) = b`
  2. `−a(x ± c) = b`
  3. `n + a(x ± c) = b`
  4. `n − a(x ± c) = b`
  5. like x-terms
- **The moves:**
  - the distribute move;
  - Add;
  - combining by dragging (numbers, and now x-terms);
  - Divide and Flip everything, live once each side is one term. A parenthesis counts as one term, so `3(x + 2) = 15` can be divided
    first.
  - Trade places, Multiply's whole number and Fraction are greyed.
- **Nothing is worked out for the student:** the rows come from the products and sums they type, and the app never writes a value.

**The shared distribute move.** It is a move of Add's term layer, the same layer Add to both sides and Two-step use. A card turns it
on with one option. Nothing in it belongs to this card.
- The factor is grabbed like any term (6 px threshold, pointer events, `touch-action: none`). A drop on the parenthesis opens the
  blanks; a drop anywhere else snaps back.
  - Keyboard route: Tab to the factor, Enter picks it up, → over the parenthesis, Enter drops it.
- **A subtracted factor needs its minus tapped first.** Otherwise: "Tap the minus first, so −2 is a negative number."
- **The blanks:** one per piece, each labelled with its multiplication (`3 · x`, `−2 · 2`). The x blank has its x printed after it.
  Enter goes from a filled blank to the next; Go applies once every blank holds a number.
- **Right products:** the app brings the other terms down (`5 + −2x + −4 = −7`, written as in the notes).
- **A wrong product:** the screen greys, the blank and its label stay lit, and one line says which product is off ("3 · 2 is not 2.
  Multiply this piece too."). Then Undo, then the hint.
- **The ghost hand:** while the factor is lit (the hint, I'm stuck, or the forced-move ring), after 2.5 seconds idle a faint copy of the
  factor travels to the parenthesis.
- **Rows fold as the loop says:** the distribute folds when the student goes on, under the label "3 · each piece".

**Combining x-terms** (shared). Dropping 2x on 3x lights both, with "Combine" over them and a box under them. The sum is typed whole
(`5x`); a bare `5` gets "Type every piece, including the x." A wrong sum stays lit and waits for Undo. Add to both sides and Two-step
never have two x-terms, so nothing changes for them.

**Dividing first.** `3(x + 2) = 15` divided by 3 writes `⅓(3(x + 2)) = ⅓(15)`, then `x + 2 = ⅓(15)`. Nothing is red, and No parentheses
turns green.
- Add −2 then leaves `x = ⅓(15) − 2`: x is alone, and the student types 3.
- A fraction that does not split the factor (⅕ here) gets the shared failure feedback.
- `4(x + 2) = 20` halved gives `2(x + 2) = 10`: legal and neutral, never red.
- Flip first on `−2(x + 4) = −4` gives `2(x + 4) = 4`, which is helpful.
- **No board that dividing or flipping first can make failed to render.** The odd one is a negative factor divided by its size
  (`−4(x + 2) = −20`, ¼). It gives `−(x + 2) = −5`, which is drawn, classified (P2) and finished by a flip (`x + 2 = −(−5)`, Q1). A
  unit test plays it through.

**Add on this card.** A distributed row can hold several numbers beside x (`5 + 2x + 6 = 17`), and nothing is put together for the
student:
- an amount that cancels one of them takes that one away (Add −5 gives `2x + 6 = 17 − 5`, which is helpful);
- one that cancels their sum takes them all;
- any other amount is written beside them and waits for Undo, with Add's own words in the real numbers.

**The lights.** Fewer terms, No parentheses (new, in the by-hand row of the panel, on this card only) and Solved for x, computed from the
shapes. Fewer terms is judged only on an Add; after a distribute, a divide or a flip it is off. A distribute is never red.

**The forced move.** After a right guess with no move, the next problem rings and pulses the factor and the parenthesis, and `x =` stays
greyed until one move is made. A distribute counts as that move, and so does dividing first.

**The check.** A parenthesis is a term of the shared check renderer:
- `3(x + 2) = 15` with x = 3 gives `3(3 + 2) = 15`, then `3(5) = 15`, then `15 = 15`;
- `−2(x + 4) = 6` with −7 gives `−2(−7 + 4) = 6`;
- `5 − 2(x + 2) = −7` with 5 gives `5 − 2(5 + 2) = −7`, then `5 − 2(7)`, then `5 − 14`.
- The check is two stacked lines as in Build I, each value in blue under its x. Level 5's two x's take a drop each.
- **A negative value inside a parenthesis:** when the value is the first piece in the parenthesis it gets no second pair of
  parentheses (`−2(−7 + 4)`, not `−2((−7) + 4)`). That matches the brief's own example. Anywhere else it keeps the usual
  parentheses (`2 × (−3)`).

**The slips** (declared; new tags):
- a wrong product:
  - the piece not multiplied (`2` for 3 · 2): `dist-unmultiplied`;
  - the sign lost (`4` for −2 · 2): `dist-sign-lost`;
  - any other product: `dist-product`;
- a wrong sum:
  - the sizes added (`5 + −4` typed 9): `sizes-added`, an existing word;
  - any other sum: `combine-wrong`;
- a wrong value of x:
  - distributed to the first term only: `first-only`;
  - the factor left out: `no-distribute`;
  - the sign flipped: `sign-flipped`.

Product and sum slips go on the class sheet as answers with their tags (for example "3 · 2 = 2 → dist-unmultiplied"). After Undo the
hint lights what to do, and it is recorded with the existing word `hint`.

**Help, basic form.** I'm stuck and the hint after Undo give the reminder only:
- at a parenthesis: the factor and the parenthesis lit, "Drag the 3 onto the parenthesis to multiply it by each piece.";
- at a subtracted factor: "Tap the minus first, so −2 is a negative number. Then drag −2 onto…";
- at terms not put together: the two like terms lit, "5 and 6 are like terms. Drag one onto the other to combine them."

There is no Teach me, seesaw, counters or area picture.

**"Practice distributing first"** is a small button beside the level dots. It opens Build it's "Distribute, then combine" at its first
unfinished level. It is only a link; Build it is unchanged.

**Save codes and the class sheet.**
- **v17** appends the card's five levels: 93 bits in 19 symbols. Every recorded older code decodes to the same progress and carries
  into v17 unchanged (tested). Codes stay hidden.
- No legacy credit and no diagnostic, as the brief says.
- **The class sheet picks the card up by itself.** The app now sends 15 packs with levels, under the sheet's limit of 30, and 5 levels
  is under its 20. There is no manual step.

## Shapes (classifier and registry)

This card's boards are read with their own family. Each shape is order-free and sign-normalised. The counts are the states seen in the
shape test: 40 seeds a level, all five levels, along every path. The paths are:
- the honest path (with a flip first where the factor is negative);
- each slip, undone;
- an Add at the parenthesis;
- a wrong value;
- dividing first, with an Add that does not cancel;
- Add −n first;
- an Add before the numbers are put together;
- I'm stuck at each state.

| Shape | Board | Entry | States seen |
|---|---|---|---|
| P1 (new) | `a(x + c) = b` | the distribute reminder | 11,033 |
| P2 (new) | `−a(x + c) = b` | the distribute reminder | 13,463 |
| P3 (new) | `n + a(x + c) = b` | the distribute reminder | 10,528 |
| P4 (new) | `n − a(x + c) = b` | the distribute reminder (tap the minus first, until it is tapped) | 13,497 |
| P5 (new) | `a(x + c) + bx = d` | the distribute reminder | 9,991 |
| P6 (new) | `a(x + c) = b + k` | Two-step's W2 ("Put them together") | 4,037 |
| E1 (new) | `n + ax + k = b` (numbers not put together) | the like-terms reminder | 5,882 |
| E2 (new) | `ax + bx + k = d` (x-terms not put together) | the like-terms reminder | 2,016 |
| E4 (new) | `ax + k = b + m` | Two-step's W2 | 2,415 |
| Q1 (new) | `x + c = ⅟a(b)` (after dividing first) | Add to both sides' reminder | 2,360 |
| Q2 (new) | `x = ⅟a(b) + k` | none (x is alone: "Work out the other side, then type what x is.") | 6,123 |
| Q3 (new) | `x + c′ = ⅟a(b) + k` | waits for Undo | 400 |
| W1, W2 | as Two-step | Two-step's | 7,949, 5,686 |
| D1, F2, F5, DF | as Divide it and Flip everything | theirs | 4,020, 2,807, 20,112, 1 |

- No unknown shape was reached. Unknown boards still fail loudly in tests.
- A coverage test checks that every shape has an entry.

**Shapes with no clean reminder:**
- **Q2** has no move left to name; it just says to work out the other side and type x.
- **Q3** waits for Undo on purpose.
- **A red Add's board has no waiting shape of its own.** It is classified as the nearest shape (an Add at `3(x + 2) = 15` reads as P1
  with a number beside it). The loop's "Undo first" answers I'm stuck there, so that reminder is never shown.

## Worst-case rows, seeds and slips

- **Rows** (200 seeds a level, the honest path; the stack folds as the student goes on): the stack holds at most 5 rows at Levels 1, 3
  and 5, and 6 at Levels 2 and 4. With the ghost row and the x = row the total is 7 or 8, and the check beside it is at most 7.
  - The tallest case is Level 4 with every move and a wrong value's full check. At 1366×650 every row is on screen (`m-worst-650.png`),
    with no fold beyond the loop's and no text shrunk.
- **Seeds checked:**
  - 200 seeds a level against every generator rule: substitution, never 0 or ±1, the ranges, the cancel amount (15 at most, never 0),
    the other side (45 at most, never 0), no repeats, no slip equal to the answer, and each level's forms and sign mixes;
  - 300 seeds a level with no failure to fill;
  - 40 seeds a level walked through every path for the shapes;
  - 200 seeds a level played on the honest path for the rows.
- **Slip collisions** (of 1,000 problems a level; the tag order decides):

| Level | first-only = no-distribute | no-distribute = sign-flipped | first-only = sign-flipped |
|---|---|---|---|
| 1 | 14 | 5 | 0 |
| 2 | 0 | 35 | 5 |
| 3 | 11 | 11 | 0 |
| 4 | 0 | 27 | 8 |
| 5 | 1 | 7 | 2 |

The product slips never collide with each other: they could only coincide for a factor of ±1, which never happens.

## The drill, deleted

Deleted, once the shared move was live and tested, and after parity passed:
- `src/engine/distributeDrill.js` (its engine), `src/play/distributeDrillPlay.js` (its play file) and `tests/distributeDrill.test.js`
  (its tests);
- the drill's branches in the Add screen (`s.drill`: its Multiply row and `times` rows, its flip hint, its panel, its missing help and
  rule lines);
- the drill's branches in the term layer and its lights (`s.drill`, `lx.mult`);
- its words (`dxStart`, `dxFlipHint`, `dxMult…` and the rest);
- `?drill=distribute` in `main.js`.

The drill's board pieces that the shared move needed (the factor token and the product row) were kept and generalised. On the test-links
page, the drill's Live entry and its buttons on three older entries are removed, and it is listed under Retired.

## Parity

All five checks pass. Problems, class-sheet records, all 25 scripted runs and all 62 screens of Add to both sides and Divide it are
unchanged. The intended differences are save codes only: the codes are written as v17, and there are five new states for the card's
levels. Both are listed in `tests/parity/INTENDED-CHANGES.md` (Build M). Flip everything and Two-step have no scripted runs; their unit
tests pass unchanged.

## Walked on the live site

All 15 new items pass on https://karlmaukskoepke.github.io/AlgebraMat/: the five levels, the drag with labels, tap the minus, the wrong
product, divide first, combine x-terms, the ghost hand, Practice distributing first, the two Part 1 fixes and Play it like a student.
The 58 older items were walked again with them, and every one passes (73 of 73, plus the page check).

**Two real bugs were found by walking, and fixed:**
1. The label of a folded distribute ("2 · each piece") sat on top of the first term of the row and swallowed the drag meant for it. It
   now sits above the row and never takes a pointer.
2. A long left side (`3 + −3(x − 3)`) ran off the left edge, because the equals line is centred. On this card the equals line sits right
   of centre. The rows still line up on it, and no text is smaller.

## Pictures (this folder), at 1366×768 and 1366×650

- each level's opening (`m-level-1` … `m-level-5`);
- the drag with labelled blanks (`m-drag-labels`);
- the brought-down row (`m-brought-down`);
- the tap-the-minus step (`m-tap-minus-refused`, `m-tap-minus`);
- the wrong-product spotlight and the hint after Undo (`m-wrong-product`, `m-wrong-product-hint`);
- divide first (`m-divide-first`);
- combine x-terms with the blank, and the bare number refused (`m-combine-x`, `m-combine-x-bare`);
- the check for a parenthesis, two stacked lines (`m-check-group`);
- I'm stuck, reminder only (`m-stuck`), and the ghost hand (`m-ghost-hand-768`);
- the forced move and its ring on the factor (`m-forced`, `m-forced-ring`);
- the tallest case at 650 (`m-worst-650`);
- the home screen showing the new card (`m-home`);
- the practice link's card (`m-practice`);
- the placement quiz fixes (`m-placement-old`, `m-placement-level1`);
- a student's wrong sum (`student-distribute`).

## Decisions for Karl (recommendations first)

1. **The way back from "Practice distributing first".** It opens Build it's card. The only way back is ← Packs, then Solve it, then the
   card. *Recommend:* add a "Back to Distribute, combine, solve" button on Build it's card when it was opened from here. It is a small
   change, but it touches Build it's screen, so it needs your yes.
2. **A sign lost on a product** (`4` for −2 · 2). The brief says both "a number without its sign is rejected with a nudge" and "Wrong:
   spotlight". I treated it as a wrong product: the spotlight, then Undo, then the hint, with "Look at the signs." and the tag
   `dist-sign-lost`. The only nudge is for a blank left with no number. *Recommend:* keep, because a sign error is the mistake the
   spotlight is for.
3. **When the ghost hand runs.** It runs only while the factor is lit (the hint, I'm stuck, or the forced-move ring), not on every fresh
   problem after 2.5 seconds. *Recommend:* keep, so a student reading a new problem is not hurried.
4. **Add −5 at `5 + 2x + 6 = 17`** (cancelling one of two numbers) counts as helpful: the 6 stays and nothing is combined for the
   student. *Recommend:* keep.
