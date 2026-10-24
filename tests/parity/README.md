# Parity tests: proving nothing changed for students

These checks compare the app as it is now with a **baseline** recorded from an earlier commit. The data baseline (problems, save codes, class-sheet events, traces) was recorded from `main` at `0415e23` (2026-10-17), before Build A. The screens were recorded again from `main` at `aa647e9` (2026-10-24, after Build N), because every earlier screen had been listed as an intended change and the check could no longer fail. A difference is a failure unless `INTENDED-CHANGES.md` lists it above its history line.

## How to run

```
npm run parity                   all checks, with screenshots (about 2 minutes)
npm run parity -- --no-screens   everything except screenshots (well under a second; no browser needed)
```

Each check prints **PASS** or **FAIL**. A FAIL lists what differed (the first 15), with before and after. **SKIP** means the screenshots couldn't run, because Playwright isn't installed on this machine. It is not a dependency of the app: it finds one installed globally, or at the folder named in `PLAYWRIGHT_PATH`. The cloud sessions have one at `/opt/node-tools`.

## What each check protects

| Check | What it compares | Protects |
|---|---|---|
| **problems** | Add to both sides and Divide it, every level, seeds 1-30 (360 sets) | Same seeds give the same problems. A seed in a link (`?seed=7`) shows the class the same problems as before |
| **savecodes** | The save code for 72 progress states (empty, each level of each card done alone, everything done), and whether each decodes back to the same code | Students' save codes keep working. (Five states don't decode back to the same code even on the baseline, because old levels are credited forward to the new cards; that's expected and recorded) |
| **events** | The class-sheet record at the end of 25 scripted runs: supports (`hint`, `model`, `move`, `guided`, `crossoff`, `forced`), stuck and Teach me counts, wrong answers and their tags | The class sheet means the same thing as before |
| **traces** | The same 25 runs, the state after every action: the rows, the lights, the message, the help rung and outline, what is typed | What a student sees and what help does, step by step |
| **screens** | 35 key states at 1366×768 and 1366×650 (70 pictures): 31 of Add and Divide, Divide it's Multiply menu, and the opening of Flip everything, Two-step equations and Distribute, combine, solve; real app, seed 7, no flags | The screen looks the same. Animations and the blinking cursor are frozen; up to 0.2% of pixels may differ |

The scripted runs are in `scenarios.mjs` and the screen states in `screens.mjs`. Both are plain lists, easy to extend.

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
