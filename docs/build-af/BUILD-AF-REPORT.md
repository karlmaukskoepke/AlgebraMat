# Build AF report: one box for fraction answers, the Add walkthrough in columns, a parity net for the newer cards (2026-11-10)

Everything is on `main` with no flag, in three pushes in the order asked: **Part 1** (with Part 0's decision log), **Part 2**, then
**Part 3**. Each push came after the unit tests, the real-browser sweeps and `npm run parity`. Decision log: "2026-11-09: one box for
fraction answers; Add walkthrough in columns; parity coverage" (with the parked items). Loop spec: revision 2.21. Count it and Build it,
save codes, class-sheet words, problems and generators unchanged.

## Part 1: one box for a fraction answer

**Where the two boxes were:** Strange solutions' answer (`x = [ ] / [ ]`, every level, since every answer there can be a fraction) and
Try a number's box (Build V2). **Nowhere else:** Fractions of x, Variables on both sides, Distribute more and every other card take a whole
number in one box. (The Multiply menu's fraction blank, `[ ] over [ ]`, is a move's amount, not an answer: unchanged.)

**The one box as built** (both places, one shared set of rules, `src/engine/fractionBox.js`):
- It shows exactly what is typed: `5`, `−4`, `3/2`, `−15/6`. Up to 3 digits on top and 2 below, as before.
- The slash key types the slash. A slash first, a second slash, a minus anywhere but the front, and letters are **ignored, with no
  message**. The keypad's ± still flips the front minus, as on every card.
- Backspace works across the slash (`3/2` → `3/` → `3`).
- `3/` cannot be checked: the green Check (or Try) is greyed and Enter does nothing.
- A bottom of 0: the answer box says "The bottom of a fraction can’t be 0." when checked, as it did; Try a number now says the same
  sentence (it said "Type a whole number, a fraction like 3/2, or a decimal like 1.5.").
- Kept as before: the answer box answers a decimal point with "Write it as a fraction, like 5/2."; Try a number reads a decimal as its
  exact fraction; a click on the box clears it; the box is a field with the same behaviour as every x = (focus, Tab, Enter), its name
  "x equals"; nothing is shown in it before anything is typed.
- **Unchanged:** stored values (the box is kept as the same top, bottom and slash pieces), judging, the check, the class-sheet text
  (`15/6 → unsimplified`), the "Can you simplify this further?" nudge (the box keeps `15/6` on screen; the next digit starts again), every
  tag, the no-help mode.
- After Enter, the value waiting to be dragged into x reads as typed (`3/2`); the check lines, the value dropped into x and the work rows
  draw it stacked, as before.

**Text size, chosen per level (Strange solutions), before → after:** 1366×768: Levels 1, 2, 3, 5: 42 → 42; Level 4: 46 → 46. 1366×650:
Levels 1, 2, 3, 5: 32 → 32; Level 4: 46 → 46. Try a number: 46 → 46 at both. **No drop anywhere.** The answer row keeps its height and
place (52 px; 68 px on Level 4 with the conclusion buttons); the box is 106 px wide (the two boxes were 162 px) and does not grow while
`−15/6` is typed.

**The keypad on touch:** the `/` key was already on Strange solutions' keypad and only there. At 1366×768 the keypad covers nothing. At
1366×650 it covers the top of Start over by 8 px (24 px on Try a number), **the same as before** (the parked keypad problem, not made worse).
At a phone width (390 px) the keypad already covered the answer row, the work and the panel before this build, the same for the answer
box after; Try a number's keypad is one row taller there now (it had no `/` key before).

**Found and fixed: the keypad was off during Try a number.** The problem counts as finished during Try a number, and the keypad switched
itself off on a finished problem, so on a tablet nothing could be typed in Try a number (no slash key either). It stays on for that box now.

## Part 2: the Add walkthrough in columns

- Add's "See why it works" (`x + 3 = 5`) writes its `+ −3` under the `+3` and under the `5`, lined up on the right, with the same helper
  the practice screens use (`stackNum`, now shared); after the next Next the `+3` and the `−3` under it are crossed out with Build AB's
  stroke, one each. The steps and the words are unchanged.
- **Text size at every step, before → after:** 48 px for the equations and 36 px for the work row, both sizes, unchanged. Nothing scrolls
  (by the page's height) and nothing overlaps the panel. At 1366×650 this older screen sits scrolled a little (the header off the top)
  before and after: not new.
- **Reduced motion:** the walkthrough is now static (it faded one row in before; the cross-off was already static).
- **Other walkthroughs and pictures:** Divide it's walkthrough (`3x = 6`) has no added number; Flip everything and Two-step have no
  walkthrough; the help's pictures (the seesaw, the box model) draw no added number in a row. **Left in line** (not the helper's kind of
  drawing): the equation printed on Add's numbers-only practice items (an SVG line under the balance) and the "after" line of a quiz answer
  revealed. An old renderer in `lightScreen.js` (`stackRows`) also writes added numbers in line, but nothing uses it.
- No earlier Features to check item walked the walkthrough; a new one does.

## Part 3: the parity net

**Re-baselined:** every family was recorded again from `main` (Parts 1 and 2 merged; the app code identical to `main`), and every row
`INTENDED-CHANGES.md` listed above its history line moved below it. **Surprise:** the list still held every change since 2026-10-17 (67
problem keys, 114 save-code keys, 11 record keys, 351 trace keys and **all 70 screens**), so the check passed whatever those keys did. With
a clean list, `npm run parity` passes with nothing listed, so it can fail again.

**What is now covered:**

| | problems | save codes | class-sheet records | scripted runs | screens |
|---|---|---|---|---|---|
| Add to both sides | 6 levels × 30 seeds | every level | 15 runs | 15 runs | 21 states + the walkthrough (3) |
| Divide it | 6 levels × 30 seeds | every level | 10 runs | 10 runs | 11 states |
| Fractions of x | 6 levels × 30 seeds (new) | every level, a placed level | 4 runs (new) | 4 runs | 18 states (new) |
| Strange solutions | 5 levels × 30 seeds (new) | every level, a placed level | 6 runs (new) | 6 runs | 13 states (new) |
| Two-step equations | none | every level, a placed level finished | the no-help runs (3) and a placed level (1) | 4 runs | opening; no-help panel, locked door, problem 1 of 2, miss, problem 5 of 5 |
| Flip everything; Distribute, combine, solve | none | every level | none | none | opening only |
| Variables on both sides; Distribute more | none | every level | none | none | none |
| Home screen, card page, level popup | | | | | 4 states (new) |
| Count it and Build it | none | every level | none | none | none |

Counts: problems 690 sets (was 360); save codes 117 progress states plus **189 older codes** (`legacy-codes.json`: the 72 codes of
2026-10-17 and the 117 of 2026-11-10; every one still decodes); 40 scripted runs (575 states; was 25) and their class-sheet records,
`conclusion-wrong`, `15/6 → unsimplified`, `test-out-pass` and `test-out-fail` among them; 156 pictures (78 states; was 70). The newer
screens are taken with reduced motion, the clock fixed and fixed seeds; they use the dev server's test hook to make a card's own moves
(no switch in the app).

**The new picture thresholds (the harness's own now):** a pixel counts when any channel is off by more than 64 of 255, or by more than 24
under the grey cover (nothing within 6 pixels brighter than 150 in either picture); a screen differs at 40 such pixels. **Why the cover
rule:** with 64 alone a change under the cover still slipped through. A test change ("Start over" → "Start Over") made only 1 or 2 pixels
of difference on the greyed error screens, because that word is faint and the cover dims it further (24 to 56 of 255 off). With the rule
it flags 48 pictures, those screens among them; the old measure (0.2% of the screen) passed all of them. **Noise, measured** by comparing
the baseline with a fresh run of the same code: at most 18 pixels on any screen (letter edges), the same as Build AC's measure; two runs of
the newer screens: at most 9. The 70 older screens pass unchanged.

**Time:** `npm run parity` took about 2 minutes; with 86 more pictures it took about 6½ one after another, so the four sets (older and
newer, each size) are now taken side by side: **about 3 minutes**. The data families still take under a second (`--no-screens`).
**GitHub's checks do not run parity** (they run `npm test`, the build and the browser sweeps). The process is unchanged: a build that
changes a recorded screen, run, problem, code or record lists it above the history line.

**Not covered** (the net does not protect it): Count it and Build it (none of their levels); the middle cards beyond their openings;
animations mid-frame; touch layouts and the keypad; phone widths; sign-in and the class sheet's sending; the placement quiz and the
fluency challenge; the problems of cards other than the four above.

## Found on the way

1. **Try a number's keypad was off on touch** (above, fixed).
2. **The parity net could not fail** on any older key (above, fixed by the re-baseline).
3. **A lead, not fixed (Distribute more, not in this build):** while changing the "can I type" sweep, a new state it reached showed a key
   going into the second distribute box while the focus was on the first (after a distribute, a focus on the second blank, Add's x-term
   option and Apply). I put the sweep's list back so it explores what it did before; worth its own look.
4. On touch, the first tap on Add shows its preview and the second opens it (as designed); the keypad item's steps say so.

## Checks

- **`npm test`** before each push, Playwright found (no "screenSweep: SKIP"): Part 1: 115 files, 2,533 tests pass; Part 2: 2,536 pass;
  Part 3: see the push. The sweeps in it: typing, drags, redraws, font size, panel room, the Add cross-out, the menu, form words,
  no-times-sign, parentheses, the test-out and chooser sweeps.
- **New tests:** `tests/buildAF.test.js` (the one box on both places, by the keyboard and the touch keypad: 5, −4, 3/2, −3/2, a slash
  first, a second slash, `3/` then Enter, `3/0`, Backspace across the slash, a minus after the front and letters; the value after Enter;
  `15/6` recorded as before; the no-help mode). `tests/strange.test.js` updated for one box.
- **`npm run parity`:** PASS at every push. Parts 1 and 2 change none of the 70 recorded screens: a picture-by-picture comparison against
  the code before this build gave **0 pixels off on all 70**, both times. Part 3 adds baselines (listed as such in `INTENDED-CHANGES.md`).
- **Features to check:** 6 new items (`af-box`, `af-try-box`, `af-keypad`, `af-simplify`, `af-walkthrough`, `af-student`) and 13 updated
  for one box (`v-level-1`, `v-simplify`, `v-check`, `v-zero`, `v-keys`, `student-strange`, `ad-whole`, `ad-lowest`, `ad-stays`,
  `ad-improper`, `ad-wrong`, `ac-parens-strange`, `v2-try-none`). Walked on the live site: the 22 Strange solutions items pass;
  `af-walkthrough` after Part 2 went live (see the push).
- **Pictures** (`docs/build-af/`, 1366×768 and 1366×650): the box empty is in the parity set (`ss-box-empty`); typed `3/2`
  (`af-box-typed`), after Enter (`af-box-entered`), `3/0` (`af-box-zero`), Try a number waiting on `3/` and with the balance, the keypad
  with its `/` key (`af-keypad`, and on the answer box at both sizes and a phone), the walkthrough's steps before and after
  (`af-walk-before-*`, `af-walk-after-*`).
