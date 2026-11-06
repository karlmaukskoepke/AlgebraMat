# Build AE report: "Try with no help" at the start of every level, and multiply-first help on Fractions of x (2026-11-06)

Everything is on `main` with no flag, in two pushes (and two small follow-ups: two items given a third step, then the pictures) in the order asked: **Part 6 first, on its own**, then **Parts 0-5** together (the
chooser, the no-help attempt on an open level, a miss, the locked-level door and the data). Each push came after the unit tests, the
real-browser sweeps and `npm run parity`. Decision log: "2026-11-05: Fractions of x suggests multiplying by the bottom first" and
"2026-11-03: no-help choice". Loop spec: revision 2.19 (section 6 for Part 6; section 7's test-out item is now the no-help choice).
Solve it and Solve it Plus cards only; Count it and Build it unchanged.

## Part 6: Fractions of x suggests multiplying by the bottom first

- **What changed.** On a non-unit fraction of x (`⅔x = 6`, and through the shape registry also `2x/3 = 6`, the mirrored forms, and a
  negative once flipped) the one reminder the help uses now names multiplying both sides by the bottom and lights Multiply (with its
  preview), wherever it shows: I'm stuck on Levels 2, 4, 5 and 6 (first click), the reminder that follows the box on Levels 1 and 3, the hint
  after a wrong value and Undo on Levels 2, 4, 5 and 6, and the hint after a move and Undo everywhere. After the multiply the state is
  `2x = 18` and the next reminder is the existing "2x means 2 · x. Divide both sides by 2."
- **The words.** Divide-by form (as Build AA wrote it): "2x/3 means 2x divided by 3. Multiply both sides by 3 to cancel the divide by 3."
  Fraction-words form: "⅔x means ⅔ of x. Multiply both sides by 3 to cancel the bottom 3." Build AA's fraction-words sentence for this key
  ("…Multiply both sides by 3 to put the 3 parts back together.") was never shown to students (the divide reminder always came first) and
  is not right for `⅔x` (3 × ⅔x is 2x, not the 3 parts), so I rewrote it: a decision below.
- **Unchanged:** dividing by the top first is still helpful and never red; if a student divides first (`⅓x = 3`) the next reminder is
  "multiply both sides by 3"; the box and its "one part" row; Level 2's one-time instruction; the unit-fraction reminders; −1 first on a
  negative fraction; class-sheet words, slips and tags; the generator.
- **The largest number a student multiplies to** (200 seeds a level, 1,000 problems each):

  | Level | Largest | Over 60 | Who writes it |
  |---|---|---|---|
  | 1, 2 (unit fractions) | 4 · 9 = 36 | none | the student types it (`x = 4(9)`) |
  | 3 | 6 · 15 = 90 | 129 of 1,000 | the Mat writes `5x = 90`; the student then divides |
  | 4, 5, 6 | 6 · 15 = 90 | 59-72 of 1,000 | the same |

  Nothing reaches 100: the generator already caps the right-hand number at 15 (12 on Levels 1-2), so the brief's "about 180" cannot happen.
  On a non-unit fraction the student never does the multiplication: the Mat writes the new equation and the student divides (`90 ÷ 5`).
  Capping the right-hand number at 12 on Levels 3-6 would remove about a fifth of the non-unit problems (224 of 1,000 on Level 3; 102-111 of
  about 500 on Levels 4-6) and bring the largest to 72 (6 · 12). Karl decides; I recommend leaving it.

## Parts 1-2: the chooser

- **Where it opens:** a level that is open and fresh (not placed, not earned, no problem started on it) of a Solve it or Solve it Plus card,
  from Level 1 on, from every way in: the card page, the level popup, the level-done panel's "Level N →", the header's Next level, the
  placement quiz's Start and a link a student follows. From anywhere but the card page, the card page opens first and the panel opens over it.
- **Where it does not:** a level in progress (started with help on this device, or the level being resumed after a reload), placed or
  earned; Count it and Build it; a link with `seed=` (every Features to check walk and sweep); `choose=0`. `choose=1` brings it back on a
  test link (testers); a started, placed or earned level still opens straight into play with it.
- **Levels with no help to switch off:** none are left as levels. Divide it's and Add to both sides' numeric saved Level 1 is "See why it
  works" (not a level, not offered), and Flip everything's Level 1 is not built. So every displayed level offers the choice.
- **What it is:** two large buttons and one small line, no heading: "Start with help" (filled, focused) and "Try with no help" with "2
  problems" under it; 88 px tall (72 px stacked at phone width). Escape or a tap outside closes it and the focus goes back to the level. A
  dialog named "Start Level 3"; arrows and Tab move between the buttons.
- **Enter can never start a test:** Start with help has the focus, a Try with no help pressed by a key within 0.4 s of the panel opening is
  ignored, and the locked door focuses Not now.
- **"In progress"** is remembered per device in its own key (`mat.started.v1`): never in the save code, never synced, never on the sheet.
- **Start with help** is today's level, unchanged. **Try with no help** is Build Z's attempt (the first two problems for a fresh seed; a test
  link's seed gives the same ones), its no-help mode unchanged, the bar "No help · Level 3 · Problem 1 of 2 · Give up" on both doors.
- **A pass:** "2 of 2 balanced!", then the card with "No help needed! Do one more problem on Level 3 to make it gold." in the silver box;
  the level and every displayed level below it placed, the next open; one more problem earns gold (Build X). Nothing is ever lowered.
- **Fractions of x:** I checked that an attempt draws no box and never sets the once-per-device memory (`mat.fxmodel.v1`), on Levels 1 and
  3 (a unit test and a browser check). After a miss the box does not draw itself on the later problems either (the help ladder still has it).

## Part 4: a miss, Give up, leaving

- **A miss on an open level** (a wrong value whose check reaches "Not balanced"): the bar goes and the level carries on with help on the
  same problem, showing exactly what the card shows after a wrong value with help on: the error pop-up "When x = 9, the equation is not
  balanced." with Undo, then the usual hint. No new message.
- **How credit is counted:** the attempt's problems are the level's first two for its seed, so the level simply continues from where the
  student is, with all five dots; a problem solved in the attempt is a filled dot, as if solved with help. The problem with the miss is an
  ordinary problem whose first check was wrong. Finishing the five earns the level (gold) as any level does.
- **Give up on an open level** carries on with help on the same problem (no "Not yet" panel). **Leaving with ← Packs** mid-try logs a
  give-up (`test-out-fail`) as in Build Z. Either way the level is now in progress, so it opens straight into play next time: the no-help
  try is offered once per fresh start.
- **On a locked level** a miss, Give up and leaving are as Build Z built them, with unlimited retries.

## Part 3: the locked-level door

The same small panel with one choice: "Try with no help" ("2 problems") and "Not now" (focused). Build Z's "Want to try it? Solve 2
problems here to skip ahead." and its heading are gone. The locked rows ("Locked", "Tap to skip ahead") and Build AD's popup note are
unchanged.

## Part 5: data

- **Credit:** Build X's placed state through `placeLevels` (device, sign-in sync, earned over placed over none). Save-code layout unchanged.
- **Class sheet:** no new words. Every attempt's problems are their usual Log rows with `test-out-pass` or `test-out-fail` in Supports,
  held until the attempt ends. A pass: two `test-out-pass` rows. A miss on an open level: the problems solved before it and the problem
  with the miss (written when that problem ends, solved with help or left) carry `test-out-fail`; the rest of the level logs as usual.
  **Nothing to do in the sheet** (the script is unchanged and takes these words already, since Build Z).

## Checks

- **Unit tests and the real-browser sweeps** (`npm test`, Playwright found, no SKIP line): Part 6 push 111 files, 2,346 tests, all pass;
  Parts 1-5 push 112 files, 2,403 tests: two failed at first (two new items had only two steps; the test-links rule wants three) and pass
  after the fix. The sweeps: typing, drags, redraws, font size, panel room, Add cross-out, menu, form words, no-times-sign, parentheses,
  the test-out sweep (now 18 runs: each of the 9 cards on a locked level and on its open first level, with no help of any kind on screen;
  Flip everything's first level has no move in the list that opens an error pop-up, so that one step is skipped there), and the new
  chooser sweep (8 checks: when it opens and when not, Escape, a tap outside, focus back, arrows and Tab, Enter mashed or held, room at
  1366×768, 1366×650 and 390 px, Next level, a pass, a miss, Give up, leaving, the locked door).
- **New unit tests** (`tests/buildAE.test.js`, 13): Part 6's reminders and lit move, divide-first still helpful, the largest products;
  the chooser's rule on every card and level, `seed=`, `choose=0`, `choose=1`, in progress, placed, earned, Count it and Build it; the
  started memory (and storage refused); a pass on an open level (silver, next open, nothing lowered); the model memory untouched; the
  class-sheet word.
- **Parity** (`npm run parity`): PASS on problems, save codes, class-sheet records, the 25 scripted runs and the 70 screens, at both pushes.
  The **stricter comparison** (every pixel off by more than 64 of 255 counted, a screen flagged at 40) of the 70 screens against the build
  before: **0 pixels off on every screen**, after Part 6 and again after Parts 1-5. Every screen that changes is outside the recorded set
  and listed one by one in `tests/parity/INTENDED-CHANGES.md` (Build AE, Part 6; Build AE, Parts 1-5).
- **Features to check:** 12 new items (`ae-multiply-first`; the chooser from the card page, the popup, by keyboard, by touch, from Next
  level; a pass; a miss; Give up; leaving and coming back; the locked door; Play it like a student: Try with no help). Updated: five Build
  AA/AC help items (the divide-first reminder) and four Build Z/AB items (Z's old panel words: `z-tap-locked`, `z-pass`, `z-fail`,
  `z-giveup`, `z-gold`, `z-student` steps say "Try with no help"; `ab-pop-locked`, `ab-pop-tap` describe the new door). No earlier item
  opens a level without a seed, so none opened straight into play where the chooser now appears. Walked on the live site: **all 245
  items pass** (the walk was cut off once by its time limit and finished in a second run).
- **Pictures** (`docs/build-ae/`, from the live site, 1366×768 and 1366×650): `ae-chooser-*` (an open level), `ae-locked-door-*`,
  `ae-chooser-touch-768`, `ae-problem-1-of-2-*` (the new bar), `ae-pass-*` (the warm message, Level 1 silver), `ae-miss-*` (help on after
  the miss), `ae-giveup-*`, `ae-student-*`, `ae-multiply-first-*`.

## Anything that surprised me

- **Enter mashed fast landed nowhere.** The first build of the panel waited for the dialog's close before starting the level; five Enters in
  a row could reopen the panel on the hidden card and leave the student on neither screen. Found by the chooser sweep: the choice now acts
  at once, and a late close from an earlier panel is ignored.
- **The sign-in prompt shares the dialog.** A signed-out student following a link with no seed sees the sign-in prompt at the start of the
  visit, which takes the place of the chooser; after Not now they are on the card and tap the level again. Left as is.
- **"Started" is per device.** A level started on another Chromebook shows the chooser here once. It never lowers or changes credit.
- **The attempt's rows do not update the device's skill tallies** (as in Build Z): they go to the class sheet only.
