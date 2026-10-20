# Build F report: answers, the seesaw beside the work, and the help gaps (2026-10-20)

Three pushes to `main`. Each passed the unit tests (1073 at the end) and `npm run parity`, with every difference compared run by run
against the code before it. There are no flags; everything is live. Count it and Build it were not changed (Count it's walk engine is
used as it is), and none of these changed:
- save codes (v14);
- level ids;
- the class-sheet words.

## Part 1: no Add answer of 0, 1 or −1 (pushed earlier)
- **The rule:** Add's generator skips any problem whose answer is 0, 1 or −1. It skips them inside each level's groups, so the other
  problems keep their order.
- **Problem sets that changed:**

  | Seeds | L2 (shown 1) | L3 | L4 | L5 | L6 |
  |---|---|---|---|---|---|
  | 1–30 | 5 | 21 | 20 | 14 | 7 |
  | 0–1000 | 311 | 615 | 522 | 461 | 390 |

- **Seed 7 (the test links):** unchanged at L2, L4 and L6. At L3 the first problem is now x − 3 = −1. At L5 the fourth problem changed.
- **New generator reports:**
  - worst-case rows: 8 at Levels 2–4, 9 at Levels 5–6; Divide 8–9;
  - slip collisions on both cards.

## Part 2: the seesaw in the right-hand space
- **Beside the work, never over it:** the seesaw, its tray, the counters walk and the big-number walk draw in the right-hand space. The
  work stack stays on the left the whole time.
- **The check at the end:** it sits under the seesaw in the same space, without overlap. The D-2 add boxes and prompts are as built.
- **A wider page:** both Solve it cards use up to 1280 px instead of 960, so the seesaw keeps its size. It is drawn at 0.59–0.77 of full
  size at 768 tall, and 0.53–0.65 at 650 tall.
- **Space reserved:**
  - Add's work area has one height, so x =, the green button and the corners stay in the same place in all 18 seesaw states at both
    sizes.
  - Add splits the work and the right-hand space evenly in every state, so the work never shifts sideways. The widest work rows
    (Level 5) fit.
- **At 650 tall:** the seesaw shrinks, never the work. Every tap target is 44 px or more: each box and group got an invisible tap area,
  and the counters in the walk are 46 px.
- **Pop-ups:** they never cover the seesaw; they use the room under the work.
- **Before it was worse:** at 650 the build state pushed x =, the green button and the corners off the screen (pair 01).
- **Also fixed:** pressing Enter on the seesaw's x placed nothing (an error in the console).

## Part 3: the help gaps
1. **Divide it, after Undo:**
   - the Multiply options open, with the fraction option lit and its preview on the equation;
   - the line reads: "To get one x, take a fraction of both sides: one of the 5 x boxes is ⅕.";
   - the class sheet records `hint`.

   After a fraction that did not split, the hint is still the boxes and the fractions to choose from.
2. **A wrong move on the seesaw: a picture spotlight.**
   - **The picture:** the screen greys and the pair beside x is drawn again. Its cancelled pairs are crossed off, and what is left
     (or what joined) is lit and labelled "still here" or "got bigger". The other side is lit too.
   - **The message, in real numbers:** for example "Battle! 8 and −3: 3 pairs cancel (crossed off), but 5 is still beside x. Press
     Undo."
   - **Then:** Undo pulses with the arrow. After Undo comes the hint: the +8 outlined, Add lit, the add boxes open.
3. **x = 11 + −8: the student crosses off.**
   - **Drawn for them:** the counters come drawn, over their numbers.
   - **The order:** Party/Battle (at the numbers), then cross off, then count, then type x.
   - **Crossing off:** tapping a counter crosses it off together with an opposite counter. Tapping a whole box crosses off every pair
     it can. Crossed-off counters stay visible.
   - **A Party:** "Count them all."

## Parity
All listed in `tests/parity/INTENDED-CHANGES.md` ("Build F, Part 2" and "Build F, Part 3").
- **Problems and save codes:** problems as in Part 1; save codes identical.
- **Class sheet:** one scripted run changed. In Divide's wrong guess then Undo, `supports` goes from [] to [`hint`].
- **Traces:** only that run, the reminder after Undo.
- **Screens:**
  - all 62 changed in Part 2 (the wider page, the seesaw beside the work);
  - the 42 Add screens moved a little again in Part 3 (the even split);
  - Divide's screens did not change in Part 3.
- **Not in any scripted run:** the seesaw's wrong-move picture and the drawn walk. They are covered by unit tests
  (`tests/spotlight.test.js`, `tests/aloneHelp.test.js`) and the screenshots below.

## Conformance (`CONFORMANCE.md`)
Every line passes except line 10 (shared code), which is still Partial: the row builder and the operation colour are still each card's
own (phase P6, not in this build). Lines 4, 7, 8 and 9 moved to Pass for Add, and line 9 for Divide.

## Decisions for Karl
1. **The wider page** (1280 px) on both Solve it cards. **Recommendation: keep.** Without it the seesaw beside the work is too small to
   tap.
2. **The counters come drawn at x alone.** The student no longer draws them first, which follows the order in the brief.
   **Recommendation: keep.** Drawing is Count it's job.
3. **Divide records `hint` for its reminder after Undo; Add's reminder after Undo records nothing** (as before). **Recommendation:**
   make Add record it too, in a small later build, so the class sheet means the same on both cards.

## What to click first
On the test-links page, under Live:
1. "Help gaps closed (Build F, Part 3)": the wrong move on the seesaw.
2. "The seesaw beside the work (Build F, Part 2)": Level 1, building the seesaw.

## Screenshots (this folder)
- `before-*` and `after-*`: 18 seesaw states at 768 and 650.
- `pair-*`: before and after side by side, for building, the add boxes, the check and the counters walk.
- `f3-*`: Part 3 at both sizes:
  - Divide's reminder;
  - the partial and the "got bigger" pictures;
  - the hint after Undo;
  - the drawn counters, with one pair and then a whole box crossed off.
