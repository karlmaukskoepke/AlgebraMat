# Build I report: the check shows the substitution, big-number questions in order, the party-of-negatives sign (2026-10-21)

Everything is on `main`, no flags: Part 1 (`9a2cb03`), Parts 2 and 3 (`aaad689`), each pushed after the unit tests and `npm run parity` passed.
Unit tests: 1184 pass. `npm run parity`: all five checks pass. Part 1 changes four screens (every screen with a check); Parts 2 and 3 change
no scripted run and no screen. All are listed in `tests/parity/INTENDED-CHANGES.md`.

**The live site was not walked: this container cannot reach `karlmaukskoepke.github.io` or the Netlify copy** (the network refuses both).
Instead every Features to check item (25) was walked on a local production build of `main` (the same files the site serves): all pass.
The live run is still owed: `node tests/features/walk.mjs https://karlmaukskoepke.github.io/AlgebraMat/ docs/build-i`.

## Part 1: the check writes the equation, then the value under each x
- Picking the value up slides a faint copy of the equation into the check space (the look of the faint travelling number). A drop on x makes
  it solid; a drop anywhere else slides it back and nothing changes.
- Line 1 is the equation being checked, exactly as written, every x blue. Line 2 is the same equation with the value in each x's place, the
  value blue, each value centred under the x it replaced (measured on screen; the walks check it is within 3 px). When a value is wider than
  x, line 1 moves right as a whole; it is never stretched or squeezed. Then Next works it out as before; a wrong value lights the last row
  and Not balanced.
- The new line is drawn by the screen, not kept in the student's state, so the number of Next presses, the class-sheet record and every
  scripted run are unchanged.
- The seesaw mirror still works (its empty x box is line 1, the counters line 2).
- Loop spec rev 2.2 (section 4, conformance line 5) in both copies. The Features to check items that named the old first line (the two
  Not balanced items and both "Play it like a student" items) are updated.

**Worst-case rows (the generators' report, 200 seeds; the check sits beside the work):**

| Card, level shown | Work column | Check column | As one column |
|---|---|---|---|
| Add to both sides, Levels 1-3 | 5 | 4 (was 3) | 9 |
| Add to both sides, Levels 4-5 (Trade places) | 6 | 4 (was 3) | 10 |
| Divide it, Level 1 | 5 | 4 (was 3) | 9 |
| Divide it, Levels 2-5 (a partial fraction) | 6 | 4 (was 3) | 10 |

The tallest check on screen is the one under the seesaw: at 1366×650 its last line ends above the x = row
(`h-seesaw-mirrors-check-650.png`). Nothing needed folding and no text was shrunk.

**Known limit (two x's, a test state only):** with a number in front of the second x (`x + 3 = 2x − 1`), line 2 needs a "2 ×" that line 1
does not have, so the second value cannot sit under its x without stretching line 1. It sits to the right (43 px off for 4, 98 px for −4;
`two-x-check-lines.png`). No card has two x's yet.

## Part 2: big numbers, one question at a time
- A battle: one box, "Who won? −15 or 2?" with a big + and −. The second box does not exist until that is right; then "Subtract 15 − 2 to
  find how many of the −15 are left." appears to its right, and the first box stays put showing the sign picked.
- A party: the same pattern. "A party of what? Pick the sign.", then "Add 2 + 13 to find how many negatives." (or positives). A wrong sign
  gets a short nudge and the same question.
- **Changed without being asked:** the boxes now sit just under the two numbers. Above them (Build H's place) they covered the rows of work
  over the numbers, which broke "no text covers the equation or work". Up to 12 is unchanged. The app never writes the value.

## Part 3: a party of negatives keeps its sign
- At x alone with exactly two negatives on screen (`x = −2 − 13`), a typed value of the right size and wrong sign (15) is the new slip
  `party-neg-sign`. The check runs as usual (Not balanced), then after Undo a box at the two numbers (both lit, the rest grey):
  "−2 and −13 are both negatives. A party of negatives makes ___" with a big + and −. Wrong: "Look again: …" and the same question. Right:
  "Now type x, and keep the sign." with x = lit. Recorded with the existing word `hint`; no other word changes.
- Other wrong values (−17, a wrong size with the wrong sign, any battle) keep today's hint. The same 15 typed before the move (x not alone)
  is still `sign-flipped`.
- Tests: every party-of-negatives shape the generators make (Levels 1-5, 40 seeds), typed +sum, gets the sign question; typed −sum is
  correct; no battle gets it.

## "Never grey out what the question is about"
Nothing found that breaks it. In every new box the numbers asked about stay lit (the walks measure their brightness). In the Not balanced
spotlight, lines 1 and 2 of the check are dimmed but readable, as the first check line was in Build H; the last line and the words
Not balanced are lit.

## Decisions for Karl (recommendations first)
1. **The boxes at big numbers sit under the numbers, not above.** *Recommend: keep* (above, they covered the work). The Party or Battle
   question itself still floats above the numbers, as the loop spec says.
2. **Line 1 moves right when the value is wider than x** (rather than line 2 starting left of the space). *Recommend: keep.*
3. **Two x's with a number in front of the second:** the second value cannot sit exactly under its x unless line 1 gets a small gap.
   *Recommend: decide when Variables on both sides is built, with real problems.*
4. **Allow `karlmaukskoepke.github.io`** in this environment's network settings so a session can walk the live site itself.

## Pictures (this folder)
The faint copy on pick-up; line 1 and line 2 with the blue pairs (Add, Divide, and the two-x test state); Not balanced lit (Add, Divide);
a battle and a party at big numbers (the first box alone, then the second beside it); `−2 − 13` typed 15, the sign question after Undo;
the tallest check at 1366×650; the Features to check page. Linked from the test-links page (Live, "Build I screenshots").
