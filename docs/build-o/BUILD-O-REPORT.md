# Build O report: the Moves panel, its two bugs, floating symbols, and a real Divide button (2026-10-24)

Everything is on `main` and live, with no flags. Four pushes, each after the unit tests and a full `npm run parity` passed:

1. **Part 0:** the decision log, the loop spec rev 2.4, and the screen part of the safety net repaired (on its own, first);
2. **Part 1:** the two bugs;
3. **Part 2:** the heading, the property names, the symbols;
4. **Parts 3-5 together:** the Divide button, the Multiply menu back to two options, the hints lighting Divide. (Parts 3 and 4 could not
   go separately: with only Part 3 there would have been two Divides, the button and the Multiply option.)

Then the Features to check items, walked on the live site.

## Part 0: the safety net

- The screens were recorded again from `main` as Build N left it (`aa647e9`). The old blanket screen entries in
  `tests/parity/INTENDED-CHANGES.md` moved below a history line the harness does not read, so any screen difference not listed above
  that line fails. Proved: the first run after Part 2 failed on all 70 screens until each was listed.
- Four states were added (Divide it's Multiply menu open; the opening of Flip everything, Two-step equations and Distribute, combine,
  solve), so a change to the shared panel shows on every Solve it card: 70 pictures, was 62.
- **Surprise:** the harness's Divide steps clicked a "Take a fraction" button that has not existed since Build D-2, so every `div-*`
  picture after a move showed no move at all. Fixed in Part 0 (they reach the real move), and again in Part 3 (the Divide button).
- `npm run parity -- --record-screens` re-records the screens only; the four data families are untouched by it. After Part 2 went to
  `main` the screens were recorded again, so Parts 3-5's differences are listed against Part 2, one key per row.

## Part 1: the two bugs

1. **Add stayed yellow.** Opening Multiply (or choosing Flip) left Add selected with its box open. Now opening Multiply, Flip or Divide
   clears Add as if it had not been clicked; Add, Undo, Esc and applying a move clear the others. Pictures:
   `bug1-add-stays-selected-before-*.png` / `-after-*.png`.
2. **The preview outlived the hover.** Root cause: the grab layer's own hover handler redrew the panel first, so by the time Add's
   "pointer left" handler ran, the icon it came from was already replaced, and that handler treated a replaced icon as "the pointer is
   still here". The preview also only faded to a faint "near" state on leaving, and came back near Add while the pointer sat on
   Multiply. Now leaving ends it at once, the faint approach preview never shows while the pointer is on another move, and a keyboard
   focus leaving a move ends its preview too. Pictures: `bug2-preview-outlives-hover-before-*.png` / `-after-*.png`.

## Part 2: the panel

- Heading "Moves", small grey capitals. Hover and focus names are the properties of equality, exactly as in the brief.
- Order: Add, Multiply, Divide, Flip everything, Trade places.
- Symbols are drawn SVG (26 px, ink), with accessible names: Plus sign, Times sign, Division sign, Circle of two arrows, Double arrow.
  Build L's small × and ÷ on the Multiply options are gone.
- **The panel is 142 px wide (was 121) and 388 px tall (was 306)**, at 1366×768 and 1366×650 alike. It fits at 650 with room to spare.
- **Subtraction audit: nothing to remove.** No card, label, hint or pop-up offers or names "subtract ___ from both sides" as a move. What
  I found and left: arithmetic in help ("Subtract 15 − 2 to find how many are left", the big-number "Add or Subtract" step), the Count it
  and Build it cards' "subtracting is adding the opposite" (read-only, and they support the rule), "Subtracting is adding a negative"
  on the Add and Distribute cards (it names a term, not a move), and the old Two-step card's "the number was taken away, so add +5 to
  both sides" (the move named is Add).

## Part 3: the Divide button

- Icon `( )/n = ( )/n`. Hover draws each whole side in parentheses over a long bar with a dashed blank beneath; the blanks mirror. One
  digit, a minus allowed; a second digit says "Enter a one-digit number to divide by." beside the blank. Go applies.
- **Display only.** The move goes through the same code as the Fraction option (taking 1/n, `−1/3` for −3): the same boards, checks,
  shapes, lights, class-sheet record and save bits (unit tests compare them directly). Only the drawing differs: rows made by the
  Divide button carry a `shown: 'div'` mark, and the fractions they made are drawn as division in later rows too (`x = (15)/3 − 2` after
  Add on Distribute), a view-only list of their ids. The scripted parity runs are unchanged.
- A row made with the Fraction option is drawn as before (`⅕(5x) = ⅕(−15)`).
- Under a Divide work row: "Same as multiplying by ⅕." (−⅓ for −3). A folded Divide move's tag reads "both sides ÷ 5".
- Dividing by −1 is Flip everything (same rows as the Flip button; on Divide it, explained, as before).
- Gating as Build L's Divide option: greyed (drawn grey, but a tap says why) where the card says so, with each card's message.

## Part 4: the Multiply menu

Two options: whole number and fraction. Divide it: Fraction live, whole number greyed. Flip everything: Divide and Fraction from saved
Level 4. Two-step and Distribute: Divide and Fraction under the single-term rule. Add to both sides: Multiply and Divide greyed.

## Part 5: hints

The hint after Undo (and I'm stuck's reminder) now lights the Divide button and shows its preview, without opening Multiply's options.
Typing a digit goes straight into its blank (Build N's rule kept). Wording unchanged: "divide both sides by 5 (that is, multiply by ⅕)".

## Parity

Problems, save codes, class-sheet records, scripted runs: unchanged. Screens: every one of the 70 changed, listed individually in
`tests/parity/INTENDED-CHANGES.md` (Part 2 rows now in its history section; Parts 3-5 rows active).

## Features to check

New (10): the panel; Add not staying selected; a preview ending; previews swapping; the Divide button; dividing by −3; dividing by −1;
the two-option menu with the fraction back; the hint lighting Divide; and Build H's "retype a fraction box", restored.
Updated (28 earlier items) to the Divide button and the division-form rows. Removed (5), because what they described no longer exists:
Build L's three-option menu, its Divide preview, its negative and −1 items (replaced by Build O's), and Build H's "a slash in the
whole-number box" (see the decisions).
