# Build AA report: Fractions of x, in One-step equations' place (2026-11-03)

On `main` and live, with no flag, after the unit tests, the real-browser sweeps and `npm run parity`. Pushed in two parts: the card with
all six levels, the retirement and the quiz (first push), then the cleanup on its own (second push). Decision log: "2026-11-01: Fractions
of x". Loop spec: revision 2.15.

**Count it and Build it:** not touched. Class-sheet words and what a save code means: unchanged (new slip tags `fx-*`; a new code layout,
v21, that appends the card).

## The card

- **Id:** `fractions-of-x`. Title "Fractions of x", subtitle "Cut the box, then solve". In Solve it (7th grade), between Flip everything
  and Two-step equations. Six saved levels, shown as saved (no walkthrough).
- **What it is built on:** Flip everything's card (`engine/cards/flip.js`: one term each side, the shared Multiply menu, Flip everything,
  Trade places on the shared loop), not Strange solutions' `makeBothCard` (that factory is for x on both sides; this card never has x on
  both sides). What changed: the term, Multiply's whole number, the divide on a fraction of x, the rewrite toggle, the model, the check's
  lines, its shapes and help.
- **The stored term (the toggle):** an x-term with a fraction in front, `{ kind: 'x', coef: top, den: q, form }`. `⅔x` is
  `{ coef: 2, den: 3, form: 'times' }`; `2x/3` is `{ coef: 2, den: 3, form: 'over' }`. A rewrite changes only `form` (a test checks it).
- **Levels (values: q 2-6, p 1-5, p < q, lowest terms, b divisible by p, |x| ≤ 36, never 0 or ±1):** 1 `⅓x = b`; 2 `⅓x` and `x/q` mixed
  (its first problem is `⅓x`, for the tip); 3 `⅔x = b`; 4 negatives (`−⅔x = b`, `⅔x = −b`, unit and non-unit); 5 x on the right with the
  negative twins; 6 everything, `2x/3` included. 200 seeds a level in the unit tests; a banned answer fails them.
- **Moves:** Multiply's whole number is live (here first). Multiplying by the bottom crosses off the multiplier and the bottom; `x = 3(4)`
  when x is left alone (never worked out), else the new numbers (`2x = 18`). Dividing by the top is helpful (`⅔x = 6` ÷ 2 is `⅓x = 3`).
  Either order is helpful and never red. A multiply that does not cancel the bottom, or a divide that does not go into the top, is legal
  and not helpful (spotlight, Undo, then the reminder). A divide that does not go into the other side fails as on Divide it. Flip
  everything from Level 4, Trade places from Level 5. Add, one over a blank and the fraction are greyed ("That move unlocks on a later
  card."). Flip on Levels 1-3 says "…later level."
- **The check:** every step shown, products in parentheses, no times sign: `⅔(9) = 6`, `6 = 6`; `2(9)/3 = 6`, `18/3 = 6`, `6 = 6`;
  `12/3 = 4`, `4 = 4`. A wrong value can leave a fraction (`20/3 = 6`), written exactly.
- **The rewrite toggle:** a tap on the fraction in the newest row (Enter or Space from the keyboard) writes the other form as its own row,
  labelled "rewrite", with Undo. Resting the pointer on it (or a keyboard focus) shows a faint ghost of the other form. Either side, every
  level.
- **The model:** in the right-hand space, never with the check and never over the work. Drawn on its own on the first problem of Levels
  1 and 3 (once a run of the level); otherwise I'm stuck's first click, and the hint after a wrong value and Undo. The five steps are
  as specified. The "one part" row worked as planned: it is written from the typed amount, as its own row with Undo. Messages use the
  real numbers ("The fraction says 2 of the 3 parts.", "2 parts make 6. What does 1 part make?"). A negative fraction is modelled with the
  minus moved over (`−⅔x = 6` as `⅔x = −6`).

## Shapes (new, family `fracx`), with counts on the honest paths

On every problem of every level over 200 seeds, both orders and the rewrite: FU 5,908; FM 8,621; FUD 3,060; FP 2,787; FPD 1,927; FN 3,901;
FW 2,520; FWN 1,579; and Flip everything's F5 2,520, F4 859. No unknown shape. An unknown board still fails loudly (a test checks it).
FU `⅓x = b` · FUD `x/q = b` · FP `⅔x = b` · FPD `2x/3 = b` · FN a negative fraction, either form · FW `2x = 18` after the multiply ·
FWN `−2x = 18` · FM `x = 3(4)`.

Help follows the form on the screen: `⅔x` gets fraction words ("⅔ of x"), `2x/3` and `x/3` get divide-by words. The form-words test now
checks this on every level.

## Slips, worst cases and text size

- **Slips (new tags):** `fx-given` (6 for `⅔x = 6`), `fx-part` (3), `fx-top` (12), `fx-bottom` (18), `fx-divided` (2), `fx-sign`. Slip
  collisions over 200 seeds a level: **none** on any level. (On a unit fraction the part is the given number, so `fx-part` is not offered
  there.) After a wrong value the hint is the model.
- **Worst-case rows** (moves + answer + check, counted as one column): Levels 1-6: 9, 9, 10, 11, 12, 13. The worst is Level 6, x on the
  right with a negative `2x/3` (four moves). Its end state at 1366×650 is in `aa-worst-case-650.png`: nothing scrolls.
- **Text size** (the size chosen for the first problem, seeds 1-12, every level): 46 px at 1366×768 (Two-step equations: 38 px) and 32 px
  at 1366×650 (Two-step: also 32 px). It never drops below Two-step's.

## Progress, legacy credit, the quiz

- **Save codes:** v21, 24 data symbols (one more than v20), the card appended. Every older code decodes as before (tested v1-v20).
- **Legacy credit:** old One-step Level 4 (`x/a = b`) or Level 5 (mixed) **places** Fractions of x's Levels 1 and 2 (silver); nothing
  credits Levels 3-6. A save from before Build X still gets this card's credit as placed (the card is new).
- **One-step equations:** `retired: true`, off Solve it, kept in `PACKS` with its saved levels; `LEGACY_ADD_BOTH` and `LEGACY_DIVIDE` still
  read it.
- **The placement quiz:** the One-step probe keeps its place in the list. Its two slots now ask the Add card's `x − a = b` (saved Level 3)
  and Fractions of x's Level 2. The seeds are worked out the same way, so no later problem changed (the test lists them). In the results,
  the Add slot joins Add to both sides' row (its level the higher of the two). The Fractions slot right places Levels 1-2 and opens Level 3.
  A device with an old saved result: loading it opens and credits nothing new (tested). Its results page would now mark those two old
  answers against the new problems; that page is only seen again if the student reopens it.
- **Class sheet:** it picks the card up on its own (it reads the pack list; 19 cards, its limit is 30). No step is needed.

## Cleanup (second push)

Deleted the code only the retired cards used: One-step's and the old Two-step's light-mode engine, Mat, rows, words and play adapter, and
Switch sides' engine, Mat, pointer, words and adapter. That is **11 files, 733 lines**, plus **274 lines** of their play-only tests and
**24 lines** of CSS, about **1,030 lines** in all. Kept: the pack entries and their generators, the save-code bits, the legacy-credit
tables, and the quiz's Two-step problems (its reader in `lightCards.js`). I did not delete more because the remaining old-card code
(`solve.js`, `solve2.js`, the generators, `equation.js`) is still read by the quiz's Two-step slots and the pack entries.

A `?pack=` link to a retired card opens its replacement at its first level with the note "That set has moved. Here is the new one." (One-step
→ Fractions of x; Switch sides and the old Two-step → Two-step equations). The note goes with the next click or key.

## Tests, sweeps and parity (the same results before each push)

- `npm test`: 104 files, **2,159 tests pass** (2,180 before the cleanup removed the old cards' play-only tests). No "SKIP": the
  real-browser sweeps ran (typing, drags, redraws, font size, panel room; the card is registered in each, and in no-times-sign,
  form-words, the panel test and the typing-everywhere test).
- `npm run parity`: **PASS** on all five checks. Problems, class-sheet records and the 25 scripted runs are unchanged. **Save codes:** the six
  new states `savecode:fractions-of-x-L1` … `-L6` are listed in `INTENDED-CHANGES.md`. **Screens:** none of the 70 differs from `main`
  before this build. I compared them picture by picture, more strictly than the harness does. The placement quiz's screens change on the
  site, but the quiz is not among the recorded screens.
- **Features to check:** 14 new items, each walked on the live site (all pass). Two older items changed. "The placement quiz never says
  Start at Level −1" now reads Fractions of x's button. "Finished old Two-step levels already count" is removed: its link plays the old
  card, which now redirects (the credit itself is covered by unit tests). Every other earlier item passes locally.

## Pictures (`docs/build-aa/`, 1366×768 and 1366×650)

`aa-level-1…6-opening-*` (each level's opening) · `aa-model-step1…5-*` (the model's five steps) · `aa-model-l1-*` · `aa-model-l3-*` ·
`aa-bridge-*` (the "one part" row) · `aa-toggle-ghost-*`, `aa-toggle-over-*`, `aa-toggle-times-*` (both forms) · `aa-level2-tip-*` (the
one-time tip) · `aa-multiply-crossoff-*` · `aa-worst-case-650` · `aa-home-*` (the card in place) · `aa-help-model-*`, `aa-help-reminder-*`,
`aa-model-wrong-*`, `aa-divide-first-*`, `aa-negative-*`, `aa-right-*`, `aa-retired-*`, `aa-quiz-*`, `aa-student-*`.

## What surprised me

- The audit file the brief points to (`docs/audit/LOOP-FIT-AND-SCAFFOLDS.md`) is not in the repository or its history. I worked out what
  was retired-only from the import graph instead.
- The shared Multiply menu treated "one over a blank" as the same switch as Divide, so a card could not grey one and keep the other. It
  now passes the option's own name to the card (other cards are unchanged).
- The shared "honest path" (used to choose the text size and by the sweeps) read `⅓x` as "x alone", because its number in front is 1. Fixed:
  a fraction of x is never alone.
- The model appears automatically once per run of Levels 1 and 3 (the first problem each time the level is started), not once per device.
- Retiring One-step showed that "Finished old Two-step levels count" could only be tested by playing the old card. That item is gone.
