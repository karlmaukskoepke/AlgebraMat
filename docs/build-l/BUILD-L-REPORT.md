# Build L report: the Multiply menu is multiply / divide / fraction, and Flip leaves it (2026-10-22)

Everything is on `main` and live, with no flags, in two pushes: Parts 0-4, then Part 5 (the placement quiz). Each push came after the
unit tests (1,364 pass) and `npm run parity` passed. Parity was also compared directly with `main` before this build (Build K): problems,
save codes, class-sheet records, all 25 scripted runs and all 62 screens are identical.

## What was built

**Part 0, recorded.** The decision log has "2026-10-21: multiply / divide menu", Karl's answers to Build K's four decisions, and
"Eventually (Karl, 2026-10-21; not for now)" with the three ideas and their design notes; nothing of them is built. The loop spec is rev 2.3
(sections 1C and 5). The Divide it and Flip everything specs carry a Build L note, and Flip's move table and hint table are updated.
**There is no Two-step spec file** (Build K recorded the card in the decision log's card plan and its report), so the change is recorded in
the decision log's item 6 instead.

**Part 1, the menu.** The options are Multiply (a small × beside `▢ ( ) = ▢ ( )`), Divide (a small ÷ beside `1/▢ ( ) = 1/▢ ( )`) and
Fraction (`▢/▢ ( ) = ▢/▢ ( )`). Each previews on hover and is solid on click, as before.
- Divide: the `1/` is printed and the student types only n. The ghost and result rows stay in multiplication form; the line under the row
  says "Dividing by 5 is multiplying by ⅕." (before a number is typed: "Dividing by a number is multiplying by 1 over it.").
- Dividing by n is the Fraction move's own `take` with 1/n, so the rows, checks, lights, shapes, class-sheet events and save bits are the
  same as taking ⅕ (a unit test compares the two states field by field).
- The −1 option is gone. Flip everything is its own panel button, unchanged.

**Part 2, negatives and Flip.**
- −1 typed in Multiply, or in Divide, is Flip everything: the card's own `flip`, so the same preview row, result rows, record and tags as
  the button. Where Flip is greyed (Two-step below Level 5), the −1 gets the card's greyed words; on Divide it, the old −1 explanation.
- Divide takes a negative: −3 is −⅓ (the minus on the top). Where a negative is not allowed (Divide it), it says "Divide by a positive number
  here: 2, 3, 4, 5 or 6."
- A second digit in Divide pops up "Enter a one-digit number to divide by." 0 says "You can’t divide by 0…"; 1 and 7-9 say "Divide both
  sides by 2, 3, 4, 5 or 6." (the same range the Fraction blank accepts).
- `/` in Divide is ignored. `/` in Multiply: see "Decisions" below (Fraction is greyed everywhere, so it switches to Divide when the top is 1).

**Part 3, per card.** Divide it: Divide live, Multiply explained (its message now ends "Try dividing both sides." instead of "Try a
fraction.", since the fraction is greyed), Fraction greyed. Flip everything: Divide from saved Level 4 ("That move unlocks on a later
level." before), Multiply and Fraction greyed. Two-step: Divide once each side is one term (Build K's words before), a negative or −1 from
Level 5; Multiply and Fraction greyed. Add to both sides: unchanged. **Fraction is greyed on every card today; it is for the later Multiply
card (fractional coefficients).**

**Part 4, hints.** Divide it's reminder after Undo, Flip everything's F2 ("…Then divide both sides by 3 (that is, multiply by ⅓).") and F3,
Two-step's D1 and the three-x-boxes message now say "divide both sides by 3 (that is, multiply by ⅓): one of the 3 x boxes is ⅓." The
reminder opens Multiply's options with Divide lit and its preview on the equation. Kept as they were: the fraction cycle after a fraction
that does not split (the list of fractions), and Divide it's I'm stuck rungs ("take ⅕ of both sides", the counters), which belong to that
list and the dealing.

**Part 5, the placement quiz.**
- The probes and their order are unchanged: old Two-step Levels 2 (`ax − b = c`) and 5 (`b − ax = c`), the same problems for a seed.
- What a result opens is now the new card, each old level read through Build K's legacy-credit table (old 2 → 2, old 3 → 4, old 5 → 5,
  old 6 → 6), opening up to the highest. A new student sees:

| First (ax − b) | Second (b − ax) | Before (old card) | Now (new card) |
|---|---|---|---|
| wrong | wrong | old L1 | Level 1 |
| wrong | right | old L1-2 | Levels 1-2 |
| right | wrong | old L1-3 | Levels 1-4 |
| right | right | old L1-6 | Levels 1-6 |

- **Where the order mattered:** "first right, second wrong" used to start at old Level 3 (`b + ax`), which is the new card's Level 4. So
  that student now has Level 3 (x on the right) open too, though neither probe tested it. The old card's Levels 3 and 4 swapped places.
- The quiz only opens levels; it does not mark any finished (as before).
- **Students already placed:** their saved result has no version mark, so it is read as "before Build L" and keeps opening what it opened
  then (the old card's levels; the new card as Build K left it). A result saved part way and finished now gets the new readout. Tested in
  `tests/diagnostic.test.js`. See the decision below.
- For the test link: `?diag=solve` opens a section's quiz and `?seed=` fixes its problems.

## Everything Build K's card needed changed
- `optionOf` / `greyKey`: the Fraction option greyed ("later card"); Divide takes the fraction's old place.
- The Two-step screen's option list, Go button and the hint's lit option (Divide).
- The term layer (Add's) swallowed typing on a forced problem whenever the Add blank was not open; it now lets digits through to an open
  Multiply blank. (Two-step's problems never reach that case today, but Divide is now the way in.)
- Its tests and its eight Features to check items that took a fraction now divide.

## Surprises
1. **No card has Multiply and Flip both live today.** So "typing −1 in Multiply is Flip" can only be seen on Divide it, where Flip is not a
   move and it gets the old −1 explanation. The same rule is reachable on the Flip card as dividing by −1, which is the walked item. A unit
   test configures a card with both live and checks −1 in Multiply gives the Flip button's exact rows.
2. **The pop-up for a greyed option covered the third option** (it sat beside the panel, over the open menu). It now sits beside the options.
3. **The parity screens never open the Multiply menu.** Their Divide steps click a "Take a fraction" button removed in Build D-2, so the
   `div-helpful-move` and `div-end` states never reach the move. I compared the changed screens by hand and photographed them here.
4. **The fraction box retype item (Build H) can no longer be reached**, since the Fraction option is greyed everywhere. I removed it from
   Features to check; it comes back with the Multiply card.
5. **Updated Features to check items keep their ticks.** Ticks are kept by item, so an item Karl already ticked stays ticked though its
   steps changed. The new behaviour is in the six new Build L items, which start unticked.
6. **The Distribute drill** (behind its own link) still has its own −1 option; it is not on the shared menu and was left alone. Its option
   buttons now draw in the new `▢ ( ) = ▢ ( )` look.

7. **An older bug, not from this build:** on the placement quiz's results, One-step equations' button reads "Start at Level -1: x + a = b"
   when both of its problems are wrong (the level number shown is worked out from a level that Add to both sides took over). It is in the
   `l-placement` picture. Not fixed here (the One-step card is not in this build's scope).

## Walked on the live site
All 58 Features to check items pass on https://karlmaukskoepke.github.io/AlgebraMat/ (the six new ones, the 19 updated ones and the rest).
The walk script's own page check needed one change: a button may open the quiz (`diag=`) instead of a card.

## Pictures (this folder), each at 1366×768 and 1366×650
- the menu on Divide it, Flip everything and Two-step (`l-menu-divide`, `l-menu-flip`, `l-menu-two-step`);
- Divide's row with its line (`l-divide-preview`); dividing by −3 (`l-divide-negative`);
- dividing by −1 giving the Flip row (`l-minus-one`); the hint after Undo (`l-hint-divide`);
- the placement quiz's results (`l-placement`).

## Decisions for Karl (recommendations first)
1. **`/` typed in Multiply on Divide it.** Fraction is greyed, so `1` then `/` now opens Divide (its `1/` printed, cursor in the box). Any
   other top (`2/`) says "That move unlocks on a later card." *Recommend:* keep; it is what a student typing 1/5 meant.
2. **Students placed by the quiz before today** keep the new card at Level 1 (Build K's place), because "nothing lost or gained" was the
   rule. *Recommend:* let me give them the new mapping too (a one-line change): it opens on the new card what the quiz already showed they
   know, and Build K's Level 1 start was the bug.
3. **The divide label before a number is typed** reads "Dividing by a number is multiplying by 1 over it." *Recommend:* keep.
4. **Divide it's "Try a fraction."** became "Try dividing both sides." *Recommend:* keep (the fraction option is greyed there).
