# Build E report: Add onto the shared loop (phases P2, P3, P4), 2026-10-19

Four pushes to `main`:
1. the documents: `SOLVE-IT-ONE-SYSTEM.md` and `SCAFFOLD-INVENTORY.md`, copied from `claude/lucid-planck-q6gtu7`, and the loop spec at rev 2.0;
2. P2, the shape classifier;
3. P3, the scaffold registry, with Divide first;
4. P4, Add on the loop, with this report.

Every push passed the unit tests (1058 at the end) and `npm run parity` on all five groups. No `?ui=loop` flag was needed: parity passed
with every difference explained, so Add on the loop went straight in as the default and the old Add path was deleted in the same push.
Count it and Build it were not touched, and nothing changed in:
- save codes (v14), level ids or save bits;
- the class-sheet words (`hint`, `model`, `move`, `guided`, `crossoff`, `forced`) or tags;
- the problems a seed makes.

## What now runs on the shared loop
- **Both Solve it cards.** Add to both sides is now a card configuration of `engine/solveLoop.js`, like Divide it. The loop now owns, for Add as well as Divide:
  - the `x =` row;
  - the check beside the equation (the same lines and the same renderer as Divide);
  - committing a move;
  - Undo and Start over;
  - the forced move;
  - I'm stuck and Teach me.
- **One help ladder** (`engine/solveit/registry.js`). It reads the **shape** of the equation on screen (`engine/solveit/shape.js`) and gives that shape's next rung. The cards only register their rungs: `engine/solveit/rungs/add.js` and `rungs/divide.js`. The ladder covers:
  - the hint after Undo;
  - I'm stuck: the reminder, Model it, Choose the move and Guided;
  - Teach me;
  - Party/Battle at the numbers, the counters walk and the big-number walk;
  - the "Undo first" answer for every waiting state.

  It records the class-sheet words exactly as before; the class-sheet records of all 25 scripted runs are identical.
- **The lights come from the shapes** (`lightsOf(shape before, shape after)`) on both cards. Parity shows they are exactly as before.
- **One shared play adapter** (`play/solvePlay.js`). Both cards are short configurations of it in `play/solveCards.js`.

## What was deleted
| File | Before | After |
|---|---|---|
| `src/play/addBothPlay.js` | 99 lines | deleted |
| `src/play/divideMovesPlay.js` | 97 lines | deleted |
| `src/engine/addBothMoves.js` | 831 lines (Add's own reducer and ladder) | 97 lines (pure board helpers only: making the board, combining two numbers, the move and its work row; kept because the card, its help, its screen and the seesaw all read them) |
| `src/engine/addBothLights.js` | 486 lines | 412 (its own "waiting for Next" bookkeeping and its copy of the hint went to the loop and the registry) |
| Add's ladder, Teach me, Undo, check and substitution | in `addBothMoves.js` | gone: the loop's and the registry's |
| Dead code | the unreachable "count what's left" step of the seesaw | removed |

Across `src`: +1272 lines, −1173 lines.
- **Add's own code** went from 1416 lines to 1177:
  - `cards/add.js` 446 (its move, Trade places, the seesaw and the pairs, the walks at x alone);
  - `cards/addHelp.js` 80;
  - `rungs/add.js` 142;
  - `addBothMoves.js` 97;
  - `addBothLights.js` 412.
- **New shared pieces**:
  - `shape.js` 119;
  - `registry.js` 64;
  - `solvePlay.js` 50.

## The shapes, with how often the tests reach each
200 problems a level from the real generators (Levels 2 to 6 of both cards), walked along the optimal path and the common slips.
| Shape | What it is | States reached in the tests |
|---|---|---|
| S1 | `x + c = b` | 46,539 |
| S2 | `x = b + k` | 26,645 |
| S3 | `x + c′ = b + k`, partly done or bigger (waits for Undo) | 6,542 |
| S4 | `x + c′ = 0`, the other side zeroed (waits for Undo) | 1,211 |
| S5, S6 | moves stacked without Undo | 0: can no longer happen (the loop requires Undo first) |
| S7 | `x = v`, after the student's own combining | 1,000 |
| T0 | the seesaw being built | 2,401 |
| T1, T2 | the seesaw's two-sided move, one side done / both sides done | 383 / 1,201 |
| D1 | `ax = b` | 10,770 |
| D2 | `x = ⅟a(b)` | 8,606 |
| DF | a fraction that does not split (waits for Undo) | 1,000 |

The tests also cover the edge cases:
- **Unknown shapes** (x on both sides, no x, a term the classifier does not know) fail the tests loudly.
- **The shape-coverage test** checks that every state the 25 parity scripts reach has a known shape and a registry entry. The entry is a ladder, a "waits for Undo", or an explicit "no scaffold here".

## Shapes without a clean scaffold
- **S2 `x = −3 + 5`.** The ladder there is Party/Battle at the numbers, then Count it's counters walk (or its big-number walk past 12). Two pieces are not built yet:
  - the student counting and cancelling the pairs themselves;
  - "Cross off for me".

  Both are phase P5 in the architecture document.
- **S3, S4, DF (waiting for Undo).** The help is only "Undo first", with no picture of what went wrong (P5).
- **S7 and T0.** No scaffold, on purpose: at S7 the only thing left is typing x, and while the seesaw is being built, help waits.
- **Divide D1 has no reminder rung.** Divide's ladder starts at the picture. The inventory's question Q4 is still open.

## Parity differences (all listed in `tests/parity/INTENDED-CHANGES.md`, section "Build E, P4")
The class-sheet records and save codes are identical. The run-by-run comparison (old code against new) found only these:
- **Bookkeeping:**
  - the loop's `needUndo` replaces Add's `undoCue` (same value at every step);
  - the rung counter counts the reminder;
  - the check records which equation it goes into.
- **A wrong guess placed in x** no longer says "This unbalances the equation" before the steps are worked through.
- **A move made on the seesaw** is now written into the work stack.
- **Screens: only 2 of 31 states differ (4 of the 62 pictures).** After the move that leaves x alone, the green button says **Check** (instead of Next), the rule line is solid, and Start over is live. The before/after pair is `be-01-after-the-move-before-vs-after-768.png` and `-650.png`.

## Decisions for Karl
1. **No Next after the move that leaves x alone.** On the loop the move is committed at once, and the green button says Check until x is
   typed; it was Next before. Divide already worked this way. **Recommendation: keep it.** It is one click fewer and the same on both cards.
2. **Start over is live as soon as anything has been done.** It used to light up only after three wrong moves. The spec (§1C) says it is
   greyed only on the untouched original. **Recommendation: keep it.**
3. **On the seesaw, a move that only partly helps now waits for Undo,** as on the bare screen. I'm stuck then says "Undo first", and one Undo
   takes the whole seesaw move back. This is the inventory's Q1 recommendation. **Recommendation: keep it.**
4. **Add's generator gives answers of 1 or −1** in 6–14% of problems a level, and the spec bans them. Fixing it changes the problems some seeds
   make, so it needs your go-ahead. **Recommendation: fix it in its own small build.**
5. **The seesaw still covers the work stack while it is up** (the only failed point of conformance line 7). **Recommendation: fix it with the
   one-screen phase (P6),** when the seesaw gets its own place beside the work.

## Conformance checklist (`docs/build-e/CONFORMANCE.md`)
| Line | Add | Divide |
|---|---|---|
| 1. No banner | Pass | Pass |
| 2. One green button; `x =` blinks only at the end | Pass, with the D-2 exception | Pass, with the D-2 exception |
| 3. Hover previews | Pass | Pass |
| 4. Spotlight on errors | Partial (not in the seesaw) | Pass |
| 5. Check side by side | Pass | Pass |
| 6. Work shown | Pass | Pass |
| 7. Scaffolds | Fail on one point (the seesaw covers the stack) | Pass |
| 8. Layout and fit | Partial (no worst-case row report) | Pass |
| 9. Generator | Fail (±1 answers; no collision report) | Partial (no collision report) |
| 10. Shared code | Partial | Partial |
| 11. Class sheet and save codes | Pass | Pass |

## What to click first
The test-links page, "Add to both sides on the shared loop (Build E)", under Live. Start with Level 1 (shown on screen as Level 1):
1. Make the move.
2. Note there is no Next.
3. Type x.
4. Try I'm stuck four times on Level 3 (the seesaw).

## Screenshots (this folder, at 1366×768 and 1366×650)
- **01:** the one state that looks different, before and after.
- **02–11:** Add on the loop:
  - 02 opening;
  - 03 red move;
  - 04 reminder;
  - 05 seesaw;
  - 06 the amount filled in;
  - 07 Party/Battle at x alone;
  - 08 counters;
  - 09 wrong guess;
  - 10 the end;
  - 11 building at Level 2.
- **12–14:** Divide for comparison:
  - 12 opening;
  - 13 I'm stuck;
  - 14 the end.
- **15–16:** a seesaw move that only partly helps, then I'm stuck saying "Undo first".
