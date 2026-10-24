# Build R report: Variables on both sides, basic form (2026-10-24)

Everything is on `main` and live, with no flags. Each Part was pushed after the unit tests (1607 pass) and a full `npm run parity`
passed (the only screen differences are the five new save-code rows listed under "Build R" in `tests/parity/INTENDED-CHANGES.md`).
All eleven Features to check items were walked on the live site (`node tests/features/walk.mjs https://karlmaukskoepke.github.io/AlgebraMat/ docs/build-r`):
every one passes. Screenshots are in this folder.

## The card

- **Id:** `variables-both-sides`. Title "Variables on both sides", subtitle "Get x on one side, then solve". It sits in Solve it after
  Distribute, combine, solve, and takes the place of the "Multi-step equations (soon)" placeholder, which is gone (from the pack list
  and the Solve it section). `home-card.png`.
- **Levels:** 1 `ax = bx + c`, 2 `ax + b = cx + d`, 3 more x on the right, 4 negatives, 5 parentheses. 200 seeds checked per level
  (1000 problems a level): every problem has a whole-number answer, no banned answers, numbers up to 15, a side's terms up to 30, and the
  collected coefficient between 2 and 6.
- **Moves:** Add has two options (`+ ▢` and `+ ▢x`, an `x` printed after each box); an x-term dragged across the = turns red and
  negative and lands as the Add of its opposite; combine (an x-term with an x-term, a number with a number); Divide, Fraction and Flip
  under the single-term rule; Trade places; Level 5 has the distribute move from Distribute, combine, solve. No forced move.
- **`x =`** is greyed with "Get x on one side first." until x is on one side, then works as usual.
- **Lights:** x on one side (new), No parentheses at Level 5, Solved. Fewer terms is lit only by an Add or a combine.
- **Save code:** layout 18 appends the card's 5 levels at the end; older codes mean what they meant. Class sheet: nothing to do, its
  script adds columns as needed (16 packs, well under its limits).

## Shapes and reminders

Two new shapes, both with an entry in the reminder registry:

- **V1** (x on both sides, no parenthesis): the smaller x-term (the right one on a tie) is outlined, a ghost of it glides across the =,
  and the pop-up says "Move this x-term to the other side. Drag it across the =, or use Add."
- **VP** (x on both sides with a parenthesis): the Distribute card's reminder to distribute.

Once x is on one side, the card reuses the existing shapes. States reached by the test walks: V1 600, E2 400, W1 300, VP 142, D1 100.
No state with x on both sides is unknown, and no shape is without a reminder.

## Worst-case rows

The widest openings over 200 seeds: Level 4 `−2x + 14 = 2x − 14` (seed 4) and Level 5 `5(x − 3) = 2(x + 6)` (seed 2). The widest row
on the board is the Add row before it folds, `−2x + 14 − 2x = 2x − 14 − 2x`: about 600 px wide, inside the board at 650 px tall with no
sideways scroll. `worst-l4-650.png`, `worst-l5-650.png`.

## Slips (wrong answers the class sheet names)

- `x-sign-lost`: the x-term moved without changing its sign, (D − B)/(A + C).
- `half-collected`: only one x-term counted, (D − B)/A.
- `sign-flipped`: the right size, the wrong sign.
- Collisions: at Level 3 (174 of 1000) and Level 5 (205 of 1000), half-collected gives the same number as sign-flipped (whenever the
  right x-term is twice the left). The tag then says half-collected. Levels 1, 2 and 4 have none.

## The questions in the brief

- **Why Distribute Level 5 filled the second x by itself:** found and fixed in Build P. A correct check was collapsed from saved Level 3,
  and a collapsed check skipped the drops. The collapse is gone from every card.
- **Build I's rule (the check's x lined up under the x above it):** kept for a single x. With several x's the check now uses a shared
  column grid: each term of the equation and of every check row sits in the same column, so each dropped value sits under its own x.
  Measured offsets: 0 px.

## Surprises

- After distributing at Level 5 the row reads `4x + −12 = 2x − 6` and the green button says Next. Until Next is pressed, the first drag
  on the board only clears the "Distributed" message and does not move the term. The Distribute card behaves the same way.
- There was no Build Q; Build P already held what would have been Part 8 of this brief.
- The check writes products as `5 × 4`, not `5(4)`, as on the other cards.
- Add's two options have no hover preview of their own; the preview appears once a number is typed.
- The step after Undo in "Play it like a student" shows the combine hint at once, so the nudge (which stays quiet while a hint is up) is
  not what the student sees there; the item says so.
