# Build A report: parity tests (P0) and Add's help reads the current equation (P1)  (2026-10-17)

Spec: `SPEC-BUILD-A-ADD-HELP-AND-PARITY.md` rev 1.0 (in this folder). Branch: `build-a/add-help-current-equation`, from `main` at `0415e23`. The lights experiment (`addBothLights.js`, `?ui=lights` code) was not touched.

## P0: the parity harness

- **One command:** `npm run parity` (add `-- --no-screens` to skip the screenshots). It prints PASS or FAIL for each check. How to run it, how to re-baseline and what each check protects are in `tests/parity/README.md`.
- **Checks:** 5 groups.
  - problems: Add and Divide, L1-L6, seeds 1-30 (360 sets)
  - save codes: 72 progress states, v14
  - class-sheet records: 25 scripted runs
  - engine traces: the state after every action of the same runs
  - screens: 31 states at 1366×768 and 1366×650, 62 pictures
- **Time:** about 0.1 s without screens, about 1¾ minutes with them.
- **Flakiness:** none seen. It passed against its own baseline twice in a row, screens included. Animations and the blinking cursor are frozen for the pictures. The one risk is the Google font: if it fails to load, every screen differs.
- **A baseline oddity, not a bug in this build:** 5 save-code states (`one-step` L1, L2, L3, L5 and `switch` L4) don't decode back to the same code even on `main`, because old levels are credited forward to the new cards. The harness records that as it is.
- **Playwright isn't a dependency of the app.** The screens use a global copy or `PLAYWRIGHT_PATH`, and say SKIP without one.

**After P1:** all checks pass, with 7 class-sheet records, 59 trace steps and 20 screens differing exactly as listed in `tests/parity/INTENDED-CHANGES.md`. The other 42 screens, all 360 problem sets and all 72 save codes are unchanged.

## P1: what changed, with screenshots (real build, 1366×768, seed 7)

| # | Spec | Screenshot | What it shows |
|---|---|---|---|
| 1 | 2.1, 2.6 | `ba-01a-L4-bare-partial-stuck4-undo-first` | A partial move (−5 on `x + 8 = −4`), then I'm stuck ×4. On the bare screen the move waits for Undo, so every ask says "That move only partly cancelled the number next to x. Let's undo it first: press Undo." (See "Could not do as written", item 1.) |
| 1 | 2.1 | `ba-01b-…seesaw-partial-move`, `ba-01c-…guided-current-number` | The same partial move made inside the seesaw: two more asks reach the guided rung, which now says "**−3 cancels the +3**" and pre-fills −3. Compare `add-10` ("−8 cancels the +3") |
| 2 | 2.2 | `ba-02a-…teach`, `ba-02b-…teach-accepted` | Teach me at that state forces −3 and accepts it on both sides ("Both sides got −3: balanced"); −8 is refused |
| 3 | 2.3 | `ba-03a`-`ba-03c` (L2, `x = 11 + −8`) | Ask 1: "x is alone. Work out what x is and type it." (as before). Ask 2: **11 and −8 outlined**, "What is 11 + −8? Is it a party (same signs) or a battle (opposite signs)?". Ask 3 adds "In a battle the bigger team wins." No seesaw, nothing pre-filled, no value |
| 3 | 2.2, 2.3 | `ba-03d-L2-alone-teach` | Teach me there gives all three sentences. It no longer says to add anything, and the answer can be typed (before, typing went into the hidden amount box) |
| 4 | 2.4 | `ba-04a-…wrong-pick`, `ba-04b-…right-pick-not-combined` | In the seesaw after Go: +8 and −8 beside x still cancel on their own. On the other side a wrong pick gets the old nudge; a right pick says "Yes, a party: the teams join. Work it out and type x." and **the row stays `x = −4 + −8`, `x =` empty**. Compare `add-17b` (`x = −12` written for them) |
| 5 | 2.5 | `ba-05-L4-partial-names-plus-3` | "The **+3** is still there, partly cancelled…" (was "+8") |
| 6 | 2.6 | `ba-06a`-`ba-06c` | A red move (+8), I'm stuck: "That move made the equation bigger. Let's undo it first: press Undo.", with Undo highlighted. After Undo, I'm stuck starts again at the reminder |
| 6 | 2.6 | `ba-06d`-`ba-06f` | Divide: ½ on `5x = −15` fails; I'm stuck says "That fraction doesn't split evenly. Let's undo it first…"; after Undo, I'm stuck opens the counters (the first rung) |
| 7 | 2.7 | `ba-07-L4-panel-two-lights` | After the helpful move only Fewer terms and Solved for x are green; the six lights Add doesn't judge stay dashed |

`take-shots.mjs` in this folder re-takes these pictures (`node docs/build-a/take-shots.mjs`).

## Decisions I made (please overturn any)

1. **"Undo first" covers the bare screen, not moves made inside the seesaw.** Taken literally, 2.6 (every grey move waits for Undo) means the guided rung can never be reached after a partial move, which is the situation 2.1 and acceptance item 1 describe: on the bare screen, I'm stuck after a partial move now always says Undo first. A partial move can also happen inside the seesaw (the two-action move with a non-cancelling amount), and there the ladder carries on, so 2.1 and 2.2 show there (`ba-01c`, `ba-02`). This is Q1 below. On Divide, which runs on the loop, the failed-fraction rule applies with the counters up too.
2. **Teach me during the Undo-first rung counts as a Teach me** (taught +1), with the support word `hint`. The spec said the rung counts as one I'm stuck click; I read that as being about I'm stuck.
3. **The sum help at x alone is recorded as `hint`** on the class sheet (it is a text reminder). Before, those asks recorded `model`, `move` and `guided` because the seesaw opened. No new words were added.
4. **Ask 3's wording:** "Think of each number as counters, and count each side." The spec's "Count the counters on each side" pointed at counters that aren't on the screen in this build.
5. **The other side is never combined by the app**, even when x isn't alone yet (a partial move inside the seesaw). Before, it was combined as soon as the right Party/Battle was picked. That matches 2.4 and your lights decision that the system combines x's side only.
6. **The pair beside x is asked about first** (before, the left side came first). With x on the right, the old order would have asked about the other side first, and the x-side pair would never have cancelled.
7. **In the seesaw, the right pick's confirmation is followed by how the move went** ("Yes, a party: the teams join. The +3 is still there, partly cancelled…"), so the grey or red judgement isn't lost.

## Could not do as written

1. **Acceptance item 1 on the bare screen** shows Undo first rather than the guided rung (decision 1). Both pictures are included.
2. **Nothing else.** The A-COUNT code (`addBothMoves.js` `crossOff`, `checkCount`) is untouched and still unreachable, as asked.

## Files changed

- `src/engine/addBothMoves.js`: the guided rung, Teach me, the sum help at x alone, Party/Battle, `aPartial`, Undo first, the ladder reset after Undo.
- `src/engine/solveLoop.js`: `undoFirst` (shared), and the loop's I'm stuck / Teach me / Undo use it. A new card hook `waitingForUndo` / `undoReason`.
- `src/engine/divideMoves.js`: three lines, the failed fraction waits for Undo.
- `src/view/addBothFeedback.js`: `aStuckSum`, `aKindRight`, `aUndoFirstHelp` (Divide falls back to this table, so it shares the line).
- `src/view/lightScreen.js`: the two numbers outlined; the six-light fallback removed.
- `src/view/addBothMat.js`: the same outline in the seesaw.
- Tests: `tests/buildA.test.js` (10 new); three tests in `tests/addBothMoves.test.js` updated to the new behaviour (they pinned the old combining). All 974 pass; `npm run build` passes.
- `tests/parity/` (new), `package.json` (`npm run parity`), `.gitignore` (`tests/parity/out`).

**Did the Divide screen need changes for "Undo first"? No.** Its Undo already pulses after a failed fraction (`divideScreen.js`, `cue: Boolean(s.fail)`), and the line comes from the shared message.

## Surprises

- **Teach me at x alone was worse than the inventory said.** It opened the amount box, so the digits a student typed went into that hidden box and **the answer could not be typed at all** (the baseline run never finishes). That is fixed now (`x-alone-then-teach` finishes).
- **The lights experiment shares Add's engine,** so these help changes also apply under `?ui=lights` at L2-L3. No lights file was edited, and its 15 tests pass.
- **The classic Add screen still doesn't fit 1366×768 in the seesaw** (the help row and pad are cut off, as in `ba-01c`). That's known and out of scope.

## Questions

**Q1. Should "Undo first" also apply inside the seesaw?**
- **(A) Recommended:** no, keep it as built. Inside the seesaw the student is already being walked through the move, and that is the only place the guided rung meets a partial move.
- (B) Yes, everywhere. The guided rung then only ever sees the original equation, and 2.1 becomes unreachable on Add.
- (C) Yes, and the seesaw's partial message drops its "Undo it" line instead.

*Answer: pending.*

**Q2. The grey line inside the seesaw still ends "Undo it and try a different number", but I'm stuck there carries on. Change the wording in the seesaw?**
- **(A) Recommended:** keep it for now, and decide with Q1.
- (B) Drop "Undo it…" in the seesaw.

*Answer: pending.*
