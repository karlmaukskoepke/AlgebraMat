# Parity tests: proving nothing changed for students

These checks compare the app as it is now with a **baseline** recorded from an earlier commit. **Every family was recorded again from `main` on 2026-11-10 (Build AF, Part 3)**, with the newer cards added, and every row that `INTENDED-CHANGES.md` still listed as intended moved below its history line: until then the list held every change since 2026-10-17 (all 70 screens among them), so the check passed whatever those keys did. (Earlier baselines: the data at `0415e23`, 2026-10-17; the screens at `aa647e9`, `b7c62f3` and `f31cc10`.) A difference is a failure unless `INTENDED-CHANGES.md` lists it above its history line.

## How to run

```
npm run parity                   all checks, with screenshots (about 3 minutes; it was about 2 before Build AF added 86 pictures)
npm run parity -- --no-screens   everything except screenshots (well under a second; no browser needed)
```

Each check prints **PASS** or **FAIL**. A FAIL lists what differed (the first 15), with before and after. **SKIP** means the screenshots couldn't run, because Playwright isn't installed on this machine. It is not a dependency of the app: it finds one installed globally, or at the folder named in `PLAYWRIGHT_PATH`. The cloud sessions have one at `/opt/node-tools`.

## What each check protects

| Check | What it compares | Protects |
|---|---|---|
| **problems** | Add to both sides, Divide it, Fractions of x and Strange solutions, every level, seeds 1-30 (690 sets) | Same seeds give the same problems. A seed in a link (`?seed=7`) shows the class the same problems as before |
| **savecodes** | The save code for 117 progress states (empty, each level of every card done alone, everything done, placed levels, a placed level finished), whether each decodes back to the same code; and 189 **older codes** (`legacy-codes.json`: the codes of 2026-10-17 and of 2026-11-10), each still decoding, kept as the code it decodes to now | Students' save codes keep working, old ones included |
| **events** | The class-sheet record at the end of 40 scripted runs: supports, stuck and Teach me counts, wrong answers and their tags (`conclusion-wrong`, `15/6 → unsimplified`), the no-help rows (`test-out-pass`, `test-out-fail`) | The class sheet means the same thing as before |
| **traces** | The same 40 runs, the state after every action (575 states): the rows, the message, the help, what is typed, the check | What a student sees and what help does, step by step |
| **screens** | 78 states at 1366×768 and 1366×650 (156 pictures), real app, fixed seeds, no flags | The screen looks the same |

**The runs** (`scenarios.mjs`, the 25 older ones on Add to both sides and Divide it; `scenarios2.mjs`, 15 since Build AF): Fractions of x Levels 1, 3 (and with I'm stuck first) and 6; Strange solutions' no-solution pick, infinitely-many pick, a wrong pick then Undo, a Level 5 fraction answer, the zero case and an unsimplified answer; a no-help pass (both problems), a no-help miss on an open level (help comes on), a locked level's fail (a wrong pick); a placed level's fifth problem (gold). The newer runs work out each move from the state as it is (the honest moves), so they never name a term by an id from another run. A no-help run is played as `main.js` plays an attempt: the no-help switch on, the session cleaned after every action, help actions dropped.

**The screens** (`screens.mjs`): the 35 older states (31 of Add and Divide, Divide it's Multiply menu, the openings of Flip everything, Two-step equations and Distribute, combine, solve) and, since Build AF, 43 more: Fractions of x (each level's opening, the box model's five steps with the bridge row, the rewrite both ways, the divide row's tall parentheses, a check, I'm stuck on a model-first and a move-first level, −1 first), Strange solutions (Levels 3-5 openings, a fraction check with its simplified line, x gone with its two buttons, a right and a wrong pick, Try a number mid-check and with the balance on a no-solution and an infinitely-many problem, the one box empty and typed), the no-help panel, a locked door, problem 1 of 2, a miss turning help on, a placed level on problem 5 of 5, the home screen (a new student and the test student), a card page and a level popup, and Add's "See why it works" in columns. The newer states are taken with reduced motion (every animation at its end, the balance at rest) and the clock fixed; they may use the dev server's test hook (`window.__mat`, which exists only on the dev server) to make a card's own moves. Nothing in the app is switched for the tests. The four sets (older and newer, each size) are taken side by side.

**The picture comparison** (Build AF; it was "at most 0.2% of pixels off by more than 40 of 255", about 2,000 pixels, which let small changes and changes under the grey cover through): a pixel counts when any channel is off by **more than 64 of 255**, or, **under the grey cover** (nothing within 6 pixels brighter than 150 in either picture), by **more than 24**; a screen differs at **40 such pixels** or more. **Noise, measured:** the same code taken twice gives at most 18 such pixels on any screen (the edges of letters). **Checked:** changing one word's letter ("Start over" to "Start Over") flags 48 pictures, the greyed error screens among them; under the old measure every one of them passed.

**Not covered** (so the net does not protect it): Count it and Build it (none of their 40-odd levels); the cards between, Flip everything, Two-step equations, Distribute, combine, solve, Variables on both sides and Distribute more, beyond their openings and the no-help runs; animations mid-frame; touch layouts and the keypad; phone widths; sign-in and the class sheet's sending; the placement quiz and the fluency challenge; the problems of cards other than the four above. The standing sweeps (`npm test`: typing, drags, redraws, font size, panel room, the test-out and chooser sweeps) cover some of this in other ways.

**Fixtures that never change:** `legacy-codes.json` (the older save codes above) and `v14-savecodes.json` (the 72 codes and their round-trip flags as recorded on 2026-10-17, read by the save-code unit tests in `tests/flip.test.js`, `tests/savecode.test.js` and `tests/twoStep.test.js`; they read the baseline file until Build AF re-recorded it).

## When a change is meant to happen

List each intended difference in `INTENDED-CHANGES.md`, above the history line: one table row per change, with the **key** the harness printed, in backticks, in the first column. Rows below the history line (`<!-- history: … -->`) are the record of changes already accepted by a re-baseline; the harness does not read them. A trace key ending `#N-` allows step N and every later step of that run, since one change carries through the rest of the run. The harness also notes any listed key where nothing differed (a stale line).

## Re-baselining (only on purpose)

```
npm run parity -- --record
```

This writes a new baseline from whatever the code does now, so **it accepts every change**. Do it only after the changes have been reviewed and merged, then move the rows it accepted below the history line in the same commit.

```
npm run parity -- --record-screens
```

The same for the screens only: the four data families are compared as usual and left as they are. A recorded screen that is no longer taken counts as a difference.

The current pictures of each run go to `tests/parity/out/` (not committed), to open when a screen fails.
