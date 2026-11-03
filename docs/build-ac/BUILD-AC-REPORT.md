# Build AC report: Fractions of x refinements (2026-11-03)

On `main` and live, with no flag, each Part after the unit tests, the real-browser sweeps and `npm run parity`. Pushed in five commits:
Parts 0 and 1, Part 2, Part 5, Part 4, Part 3 (with the test-links items). Decision log: "2026-11-03: Fractions of x refinements". Loop
spec: revision 2.16.

**Count it and Build it:** not touched (they do not use the rows, the previews or the new parentheses piece; only Solve it's screens
import it). Class-sheet words, what a save code means, the problems, the stored term and the `rewrite` row: unchanged.

## Part 1: the suspended rule

- **The rule:** the forced-move rule (loop spec 1B). Its words, a pop-up on the next problem: "Your mental math is very strong. / Let's try
  solving this next problem using a move first." (`FORCED_TEXT`, `view/solveScreen.js`), with x = greyed until one move is made.
- **What triggered it on this card:** the shared loop marks a correct value typed at the first state with no move made
  (`engine/solveLoop.js`, `guessedFirst`), and the app makes the next problem a forced move (`main.js`, `nextProblem`). On Level 1 the
  model writes no row for a unit fraction (one part is the given number), so finishing the model and typing x counted as "a correct guess
  with no move". On Level 3 the model's "one part" row is a row, so the full model did not trigger it, but typing the right value did.
- **How it is switched off:** a setting on the card's levels, `noForcedMove: [1, 3]` in the pack list (`packs/index.js`), read by
  `forcedMoveOn(pack, level)` where the app decides whether a move is owed. The loop is unchanged. **Another level or card is switched off
  with one line** (add `noForcedMove: [...]` to that card). Class-sheet records are unchanged (nothing new is recorded). A wrong value takes
  the usual path.

## Part 2: the help order, as built

| Levels | I'm stuck, 1st click | 2nd click | 3rd and later | After a wrong value and Undo |
|---|---|---|---|---|
| 1, 3 (model first) | the model | the reminder | the reminder | the model |
| 2, 4, 5, 6 (the move first) | the reminder | the model, drawn on the current equation | the reminder | the reminder (the next I'm stuck is the model) |
| 4-6, a minus in front (`−⅔x = 6`) | "Multiply both sides by −1 first." (Flip lit) | "Multiply both sides by −1 first, then I can draw the box." (Flip lit, no box; recorded as `hint`) | the reminder | "Multiply both sides by −1 first." |

After the flip the ladder starts again on the new equation: the reminder ("Divide both sides by 2: one part is ⅓x = 3."), then the model
drawn from it. Either order of moves stays helpful and never red. Levels 1 and 3 draw the original problem, as built (on a later level
the model is drawn from the equation on screen, so after a divide it is the "one part" equation). The reminders are Build AA's, in the
form on screen ("Multiply both sides by 3 to cancel the divide by 3.", "Divide both sides by 2: one part is ⅓x = 3.").

- **`⅔x = −6`** (a negative on the right only) keeps Build AA's model: "The fraction says 2 of the 3 parts make −6.", "These 2 parts make
  −6. What does 1 part make?", each part −3, the whole box −9. It reads correctly and I recommend no change (decision 2 below).
- **Class sheet:** `model` and `hint` as before, no new words.
- **Build Z's test-out:** every change here is inside I'm stuck, the hint after Undo, or the model drawing itself (now less often). None is
  reachable in an attempt that offers no help, so no new help path opens there.

## Part 3: the rewrite as an animation

- **Pace:** five frames of 0.3 s each, 1.5 s in all, with a short crossfade between frames (chosen by eye: quicker felt like a flicker,
  slower held up the student). `?animslow=1` plays it four times slower (6 s), for testers (a button on the test-links page, Live).
- **Frames:** `⅔x` (the x lifts) · `⅔ x/1` · `⅔ · x/1` · `2·x` over `3·1` · `2x/3`, then printed. The other way: `2x/3` · `2·x` over 3 ·
  `⅔ · x/1` · `⅔ · x/1` with the `/1` dropping · `⅔x`, then printed. A unit fraction: `⅓ · x/1` · `1·x` over `3·1` · `x/3`. Dots only. A
  minus in front stays outside the frames. Filmstrips (six pictures each, 768 and 650): `ac-film-times-*`, `ac-film-over-*`, and
  `ac-film-right-*` (x on the right).
- **Rules:** it plays on the tap (or Enter/Space) only. The printed term is in place the whole time (hidden while it plays), so no row moves
  and the text size is unchanged. A redraw keeps it playing (the row stays on screen, `keepRows`), and it is never started again (its row
  is remembered). A reload starts the problem again, so a rewrite row is never redrawn fresh. Any key or click finishes it at once. A second
  tap finishes it, then toggles. Under reduced motion no frames are drawn. Undo removes the row as before. The record is Build AA's.

## Part 4: parentheses, every place, and other cards

One shared piece (`view/parens.js`): round anything stacked the pair is drawn as tall as the group (the font's glyph kept, transparent,
for the width and the words), at the text's stroke weight. Round plain text it is the font's own parentheses, exactly as before.

| Place | Before | After | Was it wrong? |
|---|---|---|---|
| Fractions of x, the divide row `(⅔x)/2` | about half the fraction's height | as tall as `⅔x` | yes (Karl's report) |
| Fractions of x, the Divide preview | the same | tall | yes |
| Fractions of x, the multiply row `3(⅓x)` and its preview | small | tall | yes |
| Fractions of x, the flip row `−1(−⅔x)` | small | tall | yes |
| Strange solutions, a fraction value in the check `2(−2/5)` | small | tall | yes |
| Every other card's rows, previews and checks | font parentheses round plain text | unchanged | no: nothing stacked sits inside them |
| The check lines of Fractions of x (`2(9)/3`), the "one part" row, the rewrite row, pop-ups and reminders | | unchanged | no parentheses round anything stacked |

Pictures: `ac-parens-{divide,divpreview,multiply,multpreview,flip}-{before,after}-{768,650}`, `ac-parens-strange-before-*` and the walk's
`ac-parens-strange-*` (after).

**Text sizes** (the size chosen for the first problem, seeds 1-4, every level of every Solve it card, before and after): **no change
anywhere.** Fractions of x 46 px at 1366×768 and 32 px at 1366×650 on all six levels; Strange solutions 42 px (38 px on one seed of Level
3) and 32 px. The worst case (Level 6, `−6 = −2x/5`, a rewrite and four moves, the check) at 1366×650: `ac-worst-case-650.png`, 32 px,
nothing scrolls. The new geometry test (`tests/parenSweep.test.js`) measures every place above at 1366×768, 1366×650 and 125% zoom: each
parenthesis is at least as tall as the fraction inside it (1 px tolerance), and no font parenthesis is left beside a stacked fraction.

## Part 5: the model by itself, once per device

- **How it is remembered:** in the browser only, under its own key `mat.fxmodel.v1` (the levels already shown, `[1, 3]`). It is read and
  written through a wrapper (`src/fxModelStore.js`), so a refused store or a private window cannot break the page. If storage is
  unavailable, the model is drawn each time. It is not in the save code, not synced, not on the class sheet.
- **How a teacher clears it:** clear the site's data in the browser (or the test-links page's Reset my progress, which now clears it too).
  `?model=auto` draws it every time (a button on the test-links page, Live).
- **For Karl:** on a Chromebook shared across periods, only the first student to reach Level 1 (or Level 3) sees the model drawn by
  itself. For everyone after that it is one click away (I'm stuck on Levels 1 and 3).

## Tests, sweeps, parity (the same results before each push)

- `npm test`: 108 files, **2,216 tests pass**. No "SKIP": the real-browser sweeps ran (typing, drags, redraws, font size, panel room, the
  menu, plus the new parentheses sweep); no-times-sign and form-words are unit tests and pass. New: `tests/buildAC.test.js` (the setting
  per level, the help order per level, the negative-fraction prompt and no box before the flip, the model's memory with a refused store),
  `tests/buildACplay.test.js` (once per device as played; the animation's frames, no replay on a redraw, a key finishes it, Undo),
  `tests/parenSweep.test.js`. One Build AA test now expects the reminder first on Levels 2 and 6.
- `npm run parity`: **PASS** on all five checks. Problems, save codes, class-sheet records and the 25 scripted runs unchanged. **Screens:**
  none of the 70 differs, by the harness and by the stricter comparison (every pixel off by more than 64 counted, flagged at 40; two runs of
  the same code differ by up to 18 such pixels). None of the recorded states shows a stacked fraction in parentheses or this card. The
  screens that change are outside the recorded set and are listed one by one in `INTENDED-CHANGES.md` (Build AC).
- **Features to check:** 11 new items and three updated Build AA items (model-help, model-wrong, toggle). The whole list, 219 items, walked on the live site: every item passes. Each new item's end state is in this folder.

## Decisions for Karl

1. **`⅔x = −6` (the negative on the right):** the parts are worth −3 each and the box is −9. It reads correctly. *Recommendation: keep it.*
2. **The pace of the rewrite (1.5 s):** *Recommendation: keep it.* If it feels slow in class, 1 s is a one-number change.
3. **Shared Chromebooks:** the model draws itself once per computer, not once per student. *Recommendation: keep it (your choice in
   Build AA's questions).* If you want it per student, it could follow sign-in later.

## What surprised me

- The rule fired on Level 1 even when the student used the whole model, because a unit fraction's model writes no row, so the loop saw a
  correct value "with no move". On Level 3 it fired only on a typed value. The setting covers both.
- The reminder pop-up after I'm stuck has no Got it button (only the hint after Undo does). Steps say "Click I'm stuck again" instead.
- Level 3 is locked for a fresh student, so the "once per computer" item uses the browser's Reload for the second run.
- The harness's screen threshold could not have caught Part 4 anyway: none of its 70 states has a fraction in parentheses.
- Strange solutions' check writes `2(` and `)` as separate pieces around the value, so the shared piece has a second entry for check
  lines that joins them into one tall pair.
