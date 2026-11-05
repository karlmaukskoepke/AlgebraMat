# Build AD report: the check simplifies fractions, a slower rewrite, a shorter locked-level note (2026-11-05)

Everything is on `main` with no flag, in three pushes (Parts 0 and 1, then Part 3, then Part 2), each after the unit tests, the
real-browser sweeps and `npm run parity`. Decision log: "2026-11-03: check simplifies fractions; slower rewrite animation" (it also records
that Karl ticked and kept Build Z's six items). Loop spec: revision 2.18 (section 4 item 8, 4A, 1D, section 7).

## Part 1: the check never carries a fraction that could be simpler

**Where it reaches.** A scan of every Solve it and Solve it Plus card, every level, 200 seeds, with the right value and wrong ones, played
along the honest path to the check (`tests/buildAD.test.js` keeps it):

- **Strange solutions, Levels 1-3: changes.** Its fraction check wrote "nothing reduced: the denominator is the value's all the way down",
  so `−6/3` was carried into `−6/3 + 18/3` and `12/3 = 12/3`. About 550-750 of 1,000 checks a level carried such a fraction.
- **Fractions of x: unchanged.** Its check already wrote each result simplest (`2(9)/3` → `18/3` → `6`); a wrong value's `20/3` is already in
  lowest terms and stays.
- **Every other card (Add to both sides, Divide it, Flip everything, Two-step equations, Distribute, combine, solve, Variables on both
  sides, Distribute more): unchanged.** Their answers are whole numbers, and the scan found no fraction and no decimal on any check line.

**The rule as built** (in the fraction check, `src/engine/fractionCheck.js`): simplifying is a step of its own, the first kind of operation.
Whenever a line holds a fraction that could be simpler, the next line writes every such fraction, on both sides at once, in its simplest
form: a whole-number fraction as the number, any other in lowest terms; one already in lowest terms stays, proper or improper, never a
mixed number or a decimal. It looks inside sums, products and parentheses. Two kinds are written over a bottom on purpose and stay until
their next step: a number written over the common bottom to be added (`15/2 + 4` → `15/2 + 8/2` → `23/2`), and, at the end of a Not
balanced check whose two sides have different bottoms, the two sides written over one bottom to compare them (`15/2 = 7` → `15/2 = 14/2`).

**Before and after, one of each kind** (`docs/build-ad/ad-*-before-*.png`, `ad-*-after-*.png`, 1366×768 and 1366×650):

| Strange solutions | Before | After |
|---|---|---|
| L1 seed 2, x = −1/3 (whole) | `−6/3 + 6 = −3/3 + 5` · `−6/3 + 18/3 = −3/3 + 15/3` · `12/3 = 12/3` | `−6/3 + 6 = −3/3 + 5` · `−2 + 6 = −1 + 5` · `4 = 4` |
| L1 seed 7, x = 11/6 (lowest terms, in a sum) | `33/6 − 15 …` · `33/6 − 90/6 …` · `−57/6 = −57/6` | `33/6 − 15 …` · `11/2 − 15 …` · `11/2 − 30/2 …` · `−19/2 = −19/2` |
| L1 seed 7, a wrong 5/6 (Not balanced) | `15/6 − 90/6 = −15/6 − 24/6` · `−75/6 = −39/6` | `5/2 − 15 = −5/2 − 4` · `5/2 − 30/2 = −5/2 − 8/2` · `−25/2 = −13/2` |
| L3 seed 4, x = 13/3 (improper, simplest) | `65/3 − 3 …` · `65/3 − 9/3 …` · `56/3 = 56/3` | the same |

**Text sizes, before and after, at 1366×768 and 1366×650**: the size chosen for each of 600 Strange solutions problems (Levels 1-3, seeds
1-40, all five problems) was measured on both builds: **identical on every one**. At 768: Level 1 42 px, Level 2 42 px, Level 3 38 or 42 px.
At 650: 32 px on all three levels. No other card's check changed, so no other size could. **Fit:** some checks are one line longer (the
simplifying line, then the common bottom); the longest is 5 lines and the mark (Level 1 seed 4, `ad-worst-after-650.png`), still 62 px clear
of x = at 1366×650, no scrolling on any of the 600, the panel, keypad and pop-ups clear.

## Part 2: the rewrite animation takes about 3 seconds

At the normal pace ⅔x → 2x/3 shows its five frames for 0.45, 0.85, 0.85, 0.45 and 0.4 s (3.0 s; the two long holds are x/1 appearing and
the dot between the fractions), and 2x/3 → ⅔x for 0.4, 0.5, 1.1, 0.6 and 0.4 s (3.0 s; the long hold is x split out as x/1).
`?animslow=1` is four times as long (12 s each way); measured in the browser, every frame starts within 0.1 s of plan. Everything else
is as Build AC built it (a key or click finishes it, reduced motion shows none, never replayed, a second tap finishes then toggles, dots
only, no row moves). New filmstrips: `ad-film-times-1…6-*.png` and `ad-film-over-1…6-*.png`, each frame frozen at its middle.

## Part 3: a shorter note on a locked level

"Finish Level N or tap to skip ahead." on every Solve it and Solve it Plus card's popup (pointing, focus, a tap) and the row's accessible
name. **Count it and Build it keep their own note, "Finish Level N to open this."**: it is a different sentence, so it is unchanged.
A tap still opens the panel; the card page's locked rows still say "Locked" and "Tap to skip ahead". Pictures: `ad-note-solveit-*` and
`ad-note-countit-*`, before and after.

## Checks

- **Unit tests and real-browser sweeps** (`npm test`, Playwright found, no SKIP): 110 files, 2,336 tests, all pass, before each push.
  The sweeps by name, run again on their own after the last push: typing and the touch keypad (Build N, 17), the screen sweep (redraws,
  drags, the text size within a problem: 9 cards), panel room (21), the menu (14), no times sign (10), form words (8), parentheses (3),
  the Add column and cross-out (Build Y, 12; Build AB, 15) and the test-out sweep (11): all pass. (Form words hit its 5-second limit once
  while ten browser sweeps and the live walk ran at the same time; it passes on its own in 11 s and in both full runs.)
- **Parity**: PASS on problems, save codes, class-sheet records, the 25 scripted runs and the 70 screens, at every push. The **stricter
  comparison** (every pixel off by more than 64 of 255 counted, a screen flagged at 40) of the 70 screens against the build before: **0
  pixels off on every screen**, after Part 1 and again after Part 2. None of the recorded states is a Strange solutions check, the menu or
  a rewrite; every changed screen outside the set is listed one by one in `tests/parity/INTENDED-CHANGES.md` (Build AD, Parts 1-3).
- **Features to check**: 8 new items (five checks, the animation at normal and slow pace, Play it like a student: Fractions of x) and 7
  earlier items updated (the note: `ab-pop-point`, `ab-pop-locked`, `ab-pop-tap`, `z-tap-locked`; the pace: `ac-toggle-anim`, `aa-toggle`,
  `student-fractions-ac`). No earlier item showed the old unsimplified lines (their checks have none that change). Walked on the live site: **all 234 items pass**, the 8 new ones included, on the first run.

## Anything that surprised me

- **Only one card needed Part 1.** The brief expected Variables on both sides, Distribute more and Distribute, combine, solve to substitute
  fractions; their answers are whole numbers, so their checks never hold one.
- **A few checks get one line longer**, not shorter: `63/6 + 2` now goes to `21/2 + 2` before the common bottom. The lines themselves are
  shorter, and the size and fit are unchanged.
- **A small animation fix on the way:** the new `/1`'s fade-in in Build AC ran on the shared clock while its frame was still hidden, so it
  was never seen; each piece now keeps to its own frame.
- **The compare line at the end of a Not balanced check** (`15/2 = 14/2`) keeps a whole number over a bottom on purpose; it is the last
  line, so nothing carries it.
