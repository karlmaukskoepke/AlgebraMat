# Intended changes since the baseline

Every difference the parity harness finds must be listed here, or it fails. The first column is the key the harness prints, in backticks. A trace key ending `#N-` covers step N and every later step of that run.

**Build A, P1** (`docs/build-a/SPEC-BUILD-A-ADD-HELP-AND-PARITY.md`). The baseline is `main` at `0415e23`. Spec item numbers are in brackets.

| Key | Before | After | Why |
|---|---|---|---|
| `trace:add-both/stuck-x4-then-solve#9-` | The right Party pick on the other side combined `−4 + −8` into `x = −12` | It confirms ("Yes, a party: the teams join. Work it out and type x."); the row stays `x = −4 + −8`; the student types −12 | [2.4] the app never writes the answer |
| `trace:add-both/teach-me#6-` | The same, inside Teach me | The same confirmation; the numbers stay | [2.4] |
| `trace:add-both/partial-then-stuck-x4#5-` | The grey line named the original +8; I'm stuck ×4 climbed the ladder over a move waiting for Undo, and the guided rung offered −8 | The line names the +3 now there; every I'm stuck says "That move only partly cancelled the number next to x. Let's undo it first: press Undo." and opens nothing | [2.5], [2.6] |
| `trace:add-both/partial-then-teach#5-` | The same grey line; Teach me forced −8 and refused the −3 that works (Go: "not yet") | The +3 is named; Teach me says Undo first | [2.5], [2.6] |
| `trace:add-both/x-alone-then-stuck-x4#7-` | At `x = −4 + −8`: text, then the seesaw with nothing to do, then a Party/Battle question that wrote `x = −12` | Text (rung 0 as before), then the two numbers outlined and "What is −4 + −8? Is it a party…", a little more each ask; no seesaw; never the value; the student types −12 | [2.3], [2.4] |
| `trace:add-both/x-alone-then-teach#6-` | Teach me at `x = −4 + −8` said "Add −8 to the left…", opened the seesaw, and typing went to the amount, so the answer couldn't be typed | The full sum help (outline and all three sentences), no seesaw, no forced amount; the answer can be typed and the problem finishes | [2.2], [2.3] |
| `trace:add-both/red-then-stuck#5-` | I'm stuck after a red move gave the reminder, then the seesaw, over a move waiting for Undo; after Undo the ladder carried on at rung 2 | "That move made the equation bigger. Let's undo it first: press Undo." each time; after Undo, I'm stuck starts again at the reminder (rung 0) | [2.6] |
| `trace:add-both/zero-other-then-undo-stuck#5-` | The same over a zeroed other side | "That move made the other side 0, but x isn't alone. Let's undo it first…"; after Undo, rung 0 again | [2.6] |
| `trace:divide-it/failed-then-stuck#4-` | I'm stuck over a fraction that didn't split opened the counters | "That fraction doesn't split evenly. Let's undo it first: press Undo."; after Undo, the ladder's first rung (the counters) | [2.6], on the shared loop |
| `event:add-both/partial-then-stuck-x4` | supports `hint, model, move, guided` | supports `hint` (the Undo-first rung uses the reminder's word); stuck still 4 | [2.6] |
| `event:add-both/partial-then-teach` | supports `forced` | supports `hint`; Teach me still counted (taught 1) | [2.6] |
| `event:add-both/x-alone-then-stuck-x4` | supports `hint, model, move, guided` | supports `hint` (the sum help is a text reminder); stuck still 4 | [2.3] |
| `event:add-both/x-alone-then-teach` | the run never finished | it finishes; supports `forced`, taught 1, as before | [2.2] |
| `event:add-both/red-then-stuck` | supports `hint, model, move` | supports `hint`; stuck still 3 | [2.6] |
| `event:add-both/zero-other-then-undo-stuck` | supports `hint, model` | supports `hint`; stuck still 2 | [2.6] |
| `event:divide-it/failed-then-stuck` | supports `model, guided` | supports `hint, model`; stuck still 3 | [2.6] |

## Below the pixel tolerance (the harness passes; listed for the record)

**"See why it works" (2026-10-18).** Add to both sides and Divide it open at their first equation level, shown as Level 1; the numeric walkthrough (saved Level 1) is the "See why it works" button on the card. Problems, save codes, class-sheet records and traces are unchanged (all PASS). On screen:

| Where | Before | After | Why |
|---|---|---|---|
| Header of every `add-*` screen (saved Level 4; `add-L2-stuck-2` is saved Level 2) | `ADD TO BOTH SIDES · Level 4` (`· Level 2`) | `· Level 3` (`· Level 1`) | Levels are counted from the first equation level. About 0.01% of pixels, under the 0.2% tolerance, so no key fails |
| Header of every `div-*` screen (saved Level 3) | `DIVIDE IT · Level 3` | `DIVIDE IT · Level 2` | The same |
| Home: Add to both sides and Divide it cards (not in the screen set) | Six level buttons, Level 1 "numbers only" first | Five level buttons from "x + a = b" / "ax = b", and a small "See why it works" button by the dots | Karl, 2026-10-18 |
| The walkthrough itself (not in the screen set) | Header `· Level 1`; done screen "Level 1 complete!" | Header `· See why it works`; done screen "Now you’ve seen why it works!" with a Level 1 button | The same |

## Build C, Part 1 (2026-10-18): the lights layout is the default; Guess x / Use a move and the tucked layout are deleted

Problems and save codes are unchanged (PASS). The class-sheet records are unchanged too, apart from Build A's listed ones: the scripted runs give the same supports, stuck and Teach me counts, answers and tags. The scripted runs lost their `path` steps (the action no longer exists), and the Add runs now go through the card's layer (`withLights`), as students play it.

| Key | Before | After | Why |
|---|---|---|---|
| `trace:add-both/L2-build#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/L5-trade-places#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/clean-move#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/correct-guess#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/forced-move#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/partial-then-stuck-x4#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/partial-then-teach#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/red-then-stuck#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/red-then-undo#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/stuck-x4-then-solve#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/teach-me#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/wrong-guess-then-undo#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/x-alone-then-stuck-x4#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/x-alone-then-teach#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:add-both/zero-other-then-undo-stuck#0-` | the choice, its prompt and its greyed rules | no choice | Add to both sides now plays the lights layout at every level: no Guess x / Use a move, the prompt is “Find x.”, the move's blank is in the equation row with a Next, a correct guess forces the next problem (the trace now runs through that layer, so every step's state differs) |
| `trace:divide-it/clean-move#0-` | the choice, its prompt and its greyed rules | no choice | The loop has no choice: the prompt is “Find x.”, the fraction move and x = are live from the start, Undo returns to the same state (“Undone. Pick a different fraction.”), Start over says “Back to the start.” |
| `trace:divide-it/correct-guess#0-` | the choice, its prompt and its greyed rules | no choice | The loop has no choice: the prompt is “Find x.”, the fraction move and x = are live from the start, Undo returns to the same state (“Undone. Pick a different fraction.”), Start over says “Back to the start.” |
| `trace:divide-it/failed-then-stuck#0-` | the choice, its prompt and its greyed rules | no choice | The loop has no choice: the prompt is “Find x.”, the fraction move and x = are live from the start, Undo returns to the same state (“Undone. Pick a different fraction.”), Start over says “Back to the start.” |
| `trace:divide-it/failed-then-undo#0-` | the choice, its prompt and its greyed rules | no choice | The loop has no choice: the prompt is “Find x.”, the fraction move and x = are live from the start, Undo returns to the same state (“Undone. Pick a different fraction.”), Start over says “Back to the start.” |
| `trace:divide-it/forced-move#0-` | the choice, its prompt and its greyed rules | no choice | The loop has no choice: the prompt is “Find x.”, the fraction move and x = are live from the start, Undo returns to the same state (“Undone. Pick a different fraction.”), Start over says “Back to the start.” |
| `trace:divide-it/partial-composite#0-` | the choice, its prompt and its greyed rules | no choice | The loop has no choice: the prompt is “Find x.”, the fraction move and x = are live from the start, Undo returns to the same state (“Undone. Pick a different fraction.”), Start over says “Back to the start.” |
| `trace:divide-it/stuck-x2-then-solve#0-` | the choice, its prompt and its greyed rules | no choice | The loop has no choice: the prompt is “Find x.”, the fraction move and x = are live from the start, Undo returns to the same state (“Undone. Pick a different fraction.”), Start over says “Back to the start.” |
| `trace:divide-it/teach-me#0-` | the choice, its prompt and its greyed rules | no choice | The loop has no choice: the prompt is “Find x.”, the fraction move and x = are live from the start, Undo returns to the same state (“Undone. Pick a different fraction.”), Start over says “Back to the start.” |
| `trace:divide-it/wrong-guess-then-undo#0-` | the choice, its prompt and its greyed rules | no choice | The loop has no choice: the prompt is “Find x.”, the fraction move and x = are live from the start, Undo returns to the same state (“Undone. Pick a different fraction.”), Start over says “Back to the start.” |
| `trace:divide-it/x-alone-then-stuck-x2#0-` | the choice, its prompt and its greyed rules | no choice | The loop has no choice: the prompt is “Find x.”, the fraction move and x = are live from the start, Undo returns to the same state (“Undone. Pick a different fraction.”), Start over says “Back to the start.” |

## Build C, Part 2 (2026-10-18): errors are spotlight pop-ups, and Undo is the only way out

The scripted runs now go through the spotlight (`withSpotlight`) as students play. While an error is up, every action but Undo is ignored, so the runs that press I'm stuck or Teach me over a waiting move count fewer of them. These keys are already listed above (Build A, Part 1); the Part 2 change in each:

| Key | Before (Part 1) | After | Why |
|---|---|---|---|
| `event:add-both/partial-then-stuck-x4` | supports `hint`, stuck 4 | supports none, stuck 0 | the four I'm stuck presses over the partly cancelling move are ignored until Undo |
| `event:add-both/partial-then-teach` | supports `hint`, taught 1 | supports none, taught 0 | the same for Teach me |
| `event:add-both/red-then-stuck` | supports `hint`, stuck 3 | supports `hint`, stuck 1 | the two presses over the red move are ignored; the one after Undo counts |
| `event:add-both/zero-other-then-undo-stuck` | stuck 2 | stuck 1 | the same |
| `event:divide-it/failed-then-stuck` | supports `hint, model`, stuck 3 | supports `model`, stuck 1 | the same over the fraction that didn't split |

No new class-sheet words. The hint after Undo is not asked for, so it adds nothing to `supports`. Traces: after an error's Undo the line's message is the hint (`aStuckHint`, `dPickFraction`, `aStuckSolved`), and on Add the move stays open with its blank cleared (the scripted runs `red-then-undo` and `wrong-guess-then-undo` type the amount straight in). Screens with an error (`add-red-move`, `add-partial-move`, `add-wrong-guess`, `div-failed`) show the dimmed page, the lit part and the pop-up.

## Build C, Part 3 (2026-10-18): help at x alone is Party/Battle at the numbers, then Count it's counters

| Key | Before (Part 2) | After | Why |
|---|---|---|---|
| `event:add-both/x-alone-then-stuck-x4` | supports `hint` | supports `hint, model` | the second I'm stuck at `x = −4 + −8` opens Count it's counters walk (recorded with the existing `model` word); stuck still 4 |
| `event:add-both/x-alone-then-teach` | supports `forced` | supports `forced, model` | Teach me at x alone starts at the counters |

Traces of those two runs (already listed) and the screens `add-alone-stuck-1/2/3`, `add-alone-teach` (already listed) show the question bubble at the two numbers, then the counters tray, in place of Build A's words-only help. `crossoff` is added only when the student cancels a pair in the walk.

## Build D, Part 1 (2026-10-18): the light design

Problems, save codes, class-sheet records and the engine traces are unchanged (the engines were not touched: the openings' pop-ups, the error count for Teach me and the faint preview on approach are view state). Every screen of Add to both sides and Divide it changed on purpose:

- **No banner.** The line is kept for screen readers only; every message is a pop-up (errors below the work with a hopping arrow at Undo; hints, notes and nudges in the nearest free space that covers no equation or work).
- **One green button** right of x = (Check, Go, Next, Got it, Combine, Next problem); the ✓ under the blank, the Next on the rule line and the Next beside the check are gone.
- **The narrow panel** (round 2) with its collapsed lights is the only panel; the wide Move / Why? panel is gone from both cards.
- **Round 2 is the default** on Add: rows read "x − 4", terms can be grabbed; the dashed midline shows only while a term is dragged.
- **The work on the left, the checking space on the right**; earlier lines in lighter ink; bigger equations.
- **Help in the corner:** I'm stuck and Start over small, bottom right; Teach me appears after a second error (so the `*-teach` states show no Teach me button and the screen stays as it was before it).
- **No pad on a keyboard** (the screens are taken with a mouse); the header fades to a strip after 3 seconds (the screens are taken before that).
- **x = blinks only at the last step**; the first problem of a visit shows "Find the value of x.".

(Its screen rows are in the history section at the end: the screens were re-baselined on 2026-10-24.)

## Build D, Part 2 (2026-10-18): checking a value side by side

Problems, save codes and the class-sheet records are unchanged (PASS). The class sheet gains one slip word, `gave-opposite` (the
opposite of the number next to x typed as the value), which Karl asked for; it is tried last, so a number that fits an older slip
keeps its old tag. The engine traces change from each run's Check on, and every such step was already covered by the `#N-` rows above
(Build A and Build C), so no new trace row is needed; for the record:

- **Check** now says `aPlace` ("Drag your value into each x.") and the value waits in `sub.placing`; **placeValue** writes the copy and
  its first line at once (step 1). Add's scripted check is `check, placeValue, nextLine, nextLine` (it was `check, nextLine ×3`);
  Divide's loses its "landed" step (the value no longer sits on x first: the copy is written beside it).
- A finished wrong guess says `aUndoGuess` with the slip's tag; a wrong value's error lights the Not balanced line (it lit x =).
- At x alone the Party/Battle question reads the sum as the row reads it ("11 − 8", was "11 + −8").
- The screen states `add-wrong-guess`, `add-wrong-guess-undone`, `add-forced-move` and `add-end` tap x after Check (listed under Part 1).

## Build D, Part 3 (2026-10-18): dragging terms

No data change (PASS); no scripted run drags a term. On screen (listed under Part 1): the dashed midline is gone except while dragging.
In play: a dropped number lands in the slot it was dropped on (`x = −8 + 11` when dropped before the 11; the Add move still writes it
last); x dragged across is refused with "x is already on the left side…"; a wrong sum is a spotlight error; the drill has Flip
everything and Multiply.

## Build D, Part 4 (2026-10-18): Divide it's fraction as a blank, and the list after a fraction that does not split

Problems, save codes and class-sheet records unchanged (PASS): the move still goes through Divide's own `take`, so its rows, save bits
and sheet words are as before. Changes in play (the traces that reach them were already covered by Build A and Build C rows):

- The five fraction buttons are gone: hovering the move previews `▢(5x) = ▢(−15)`; the blank takes `1/5` (or top and bottom), Go takes it.
  The screen states' `take(n)` now type 1 and n into the blank and press Go.
- After a fraction that did not split, Undo's hint is `dWhichFraction` (it was `dPickFraction`) with the move open (`menu: 'fraction'`):
  the boxes bracketed, "We want only one of the five x boxes.", "What fraction of these boxes should we find?" and ½ ⅓ ¼ ⅕ ⅙, the tried
  ones crossed off. A choice from the list is `take` with `fromList`; the right one leaves its picture (1 of the 5 boxes kept) until Next.

## Build D, Part 5 (2026-10-18): scaffolds

| Key | Before | After | Why |
|---|---|---|---|
| `event:add-both/teach-me` | supports `forced` | supports `forced, hint` | Teach me's move is in the Add blank ("Do it"), then party or battle is asked at the numbers (recorded as `hint`, as at x alone since Build C) |

Traces (already covered by the Build A/C rows): Teach me on a bare screen no longer opens the seesaw (`teach` gives `aTeachDo` with the
amount in the blank; Go commits it; at x alone `aAlonePB`); Teach me at x alone asks party or battle first (`aAlonePB`, it was
`aAloneCounters`); in the seesaw a battle beside x is `step: 'struck'` (crossed off, kept) until `crossNext`. The scripted runs
`stuck-x4-then-solve` (adds `crossNext`) and `teach-me` (now `teach, go, kind party, check`) follow the new flow. Numbers past 12 at x
alone get Count it's big-number walk (no scripted run reaches it).

## Build D-2, Part 1 (2026-10-19): what an addition did

No data change outside the traces' messages (PASS). `aRed`, `aRed3` and `aPartial` now carry `before` (the number next to x before the
move) and `added` (the amount), so the pop-ups say "+8 + +8 did not eliminate the term" and "+8 was only partially canceled by the −5
you added…" (those trace steps were already covered by the Build A/C rows). On screen: the work row strikes numbers only when they
really cancel; the two numbers added are lit with the sum, which is drawn larger.

## Build D-2, Part 2 (2026-10-19): x = and checking a value

No data change (PASS). On screen only: x = shows no cursor until it is clicked (a view flag, `ui.fieldCursor`, cleared by any other
action, a press elsewhere or the focus moving on); the last step still blinks. The check's pop-up reads "Let’s check that x = 7 is the
solution. / Drag the 7 onto an x above." A pointer click on x no longer places the value (Enter still does); after about 4 s idle a faint
copy of the value travels from x = to the first x, repeating until the student acts.

## Build D-2, Part 3 (2026-10-19): dragging a term

No data change (PASS). On screen only: while a term is dragged the newest row itself shows where it would land (the moved term as a
shadow; no grey row under it); across the line the slot can be before, between or after the terms there (the drop's `at`, which the Add
engine already honoured; the drill's own cross now honours it too); a drop up to 220 px above or below the row lands in the slot shown;
the midline is 2 px, shown only while dragging, in two pieces that stop short of the =. The Distribute drill (a hidden pack, not in
parity) types each product whole (`−2x`; a number alone in the x blank gets `dxTypeX`, "Type every piece, including the x.") and writes
Flip everything as a `times` row, both sides × (−1), before the flipped equation.

## Build D-2, Part 4 (2026-10-19): one Multiply button

No data change (PASS): the scripted runs still choose the fraction with the card's own `choose`. On screen: Divide it's Multiply button
sends `multOpen`, which opens three options beside it (`s.mopts`; `multPick` with `whole`, `frac` or `flip`); hovering one sets
`ui.preview` to its kind (the old preview when the button itself was approached is gone). The fraction is the card's own move; a whole
number or −1 is not applied in Divide it (new feedback keys `dWholeNo`, `dZeroNo`, `dFlipNo`). The fraction blank takes one digit (or −
and a digit) on top, then the cursor jumps to the bottom; a second digit, or a top that is not 1, gives `dUnitFraction` (also after 7 s
with the blank open and no unit fraction in it: `fracStuck`). No outline on the selected box. In the Distribute drill (not in parity) the
same three options replace Flip everything and Multiply; a whole number (negatives allowed) and −1 are written as `times` rows.

## Build D-2, Part 5 (2026-10-19): the seesaw

No data change (PASS): the scripted runs use `addTo` directly. On screen and in the light layer: on the seesaw, Add shows a box under
each side; typing the number once runs the card's own `addTo` left and right (marked `pending.auto`; typing again takes those counters
back off first), and Go with a number already in the box (Teach me, the guided rung) does the same before committing. When the build is
finished (`aBuilt`) an Add left open from the hint before is closed, so the student chooses the move; that screen greys all but the moves
and the question. While a value is checked on the seesaw the balance and the checking space sit side by side, and both the x on the
balance and the equation under it take the value. The walk's box (Party/Battle, big numbers) is gone once the value is being checked.
I'm stuck is lit in every greyed layer except an error's, when it is enabled.

## Build E, P2 (2026-10-19): the shape classifier

No difference (PASS on all five groups). `engine/solveit/shape.js` reads the shape of every state (Add S1–S7, the seesaw's T0–T2,
Divide D1, D2, DF), and both cards' lights now come from `lightsOf(shape before, shape after)` instead of each card's own code; parity
shows the lights are exactly the same.

## Build E, P3 (2026-10-19): the scaffold registry and one ladder, Divide first

No difference (PASS on all five groups). The help ladder (I'm stuck, Teach me, the hint after Undo) is now the loop's, reading
`engine/solveit/registry.js` by shape; Divide it's rungs moved to `engine/solveit/rungs/divide.js` (D1, D2, DF) with the same messages and
class-sheet words. Add to both sides joins in P4.

## Build E, P4 (2026-10-19): Add to both sides on the shared loop

PASS on all five groups. Earlier sections already list every Add run with `#0-`, which would hide new differences, so this build was
also compared directly: the same 25 runs from the commit before P4 against the new code, and the 62 screens taken from both. The
class-sheet records (events) and the save codes are identical. Every remaining difference:

| Key | Before | After | Why |
|---|---|---|---|
| `trace:add-both/*` (every step) | `undoCue: true/false` | `needUndo: true/false`, `unfolded: false` | The loop's own flags replace Add's copy: `needUndo` equals the old `undoCue` at every step of every run (checked); `unfolded` is never true on Add (every helpful Add move leaves x alone) |
| `trace:add-both/*` (I'm stuck) | `rung` 0, 1, 2, 3 | `rung` 1, 2, 3, 4 | The one ladder (`engine/solveit/registry.js`) counts the reminder click as a rung, as on every card; the rungs given are the same |
| `trace:add-both/*` (check, place) | `feedback.params` without `where`; `sub.target: null` | `where` and `sub.target` `'original'` / `'current'` | The loop's check (shared with Divide it): it says which equation the value goes into |
| `trace:add-both/wrong-guess-then-undo#3` | `aGuessed` (bad: "This unbalances the equation") | `aPlugCurrent` | The loop's words: a wrong guess is not judged before its lines are worked through (no verdict before the steps) |
| `trace:add-both/stuck-x4-then-solve#10-` | `rows` stays at the original equation in the seesaw | the move's work row and `x = −4 + −8` are written | Loop §6: a scaffold never blanks the stack; a move made on the seesaw is written into the work like any other |

Not in the scripted runs, but changed by the same rules (unit tests updated): a second move while one waits for Undo now says
`aUndoFirst` (stacking is gone, so shapes S5 and S6 can no longer happen); in the seesaw, a move that only partly helps waits for Undo, and
one Undo takes the whole seesaw move back; three reds in a row are counted across their Undos by the spotlight, as on the bare screen.

## Build F, Part 1 (2026-10-19): no answer of 0, 1 or −1 on Add to both sides

The loop spec (§8) bans answers of 0, 1 and −1. Add's generator now skips them while picking (the pool and its shuffle are unchanged), so only a set that drew one changes: the first banned problem is replaced by the next allowed one in the same group, and the rest of that set can shift. Seeds 1–30 that changed (the parity check covers these):

| Key | Why |
|---|---|
| `problem:add-both/L2/seed2` | this set had an answer of 1 or −1 |
| `problem:add-both/L2/seed10` | this set had an answer of 1 or −1 |
| `problem:add-both/L2/seed13` | this set had an answer of 1 or −1 |
| `problem:add-both/L2/seed26` | this set had an answer of 1 or −1 |
| `problem:add-both/L2/seed27` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed2` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed3` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed4` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed5` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed7` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed8` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed9` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed10` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed11` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed12` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed13` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed15` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed16` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed17` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed18` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed20` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed21` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed22` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed24` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed29` | this set had an answer of 1 or −1 |
| `problem:add-both/L3/seed30` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed1` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed2` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed3` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed4` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed5` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed6` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed8` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed10` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed12` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed13` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed16` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed17` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed18` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed21` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed22` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed23` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed24` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed25` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed29` | this set had an answer of 1 or −1 |
| `problem:add-both/L4/seed30` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed1` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed3` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed7` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed8` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed9` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed10` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed11` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed13` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed16` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed17` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed19` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed21` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed23` | this set had an answer of 1 or −1 |
| `problem:add-both/L5/seed27` | this set had an answer of 1 or −1 |
| `problem:add-both/L6/seed3` | this set had an answer of 1 or −1 |
| `problem:add-both/L6/seed5` | this set had an answer of 1 or −1 |
| `problem:add-both/L6/seed6` | this set had an answer of 1 or −1 |
| `problem:add-both/L6/seed13` | this set had an answer of 1 or −1 |
| `problem:add-both/L6/seed24` | this set had an answer of 1 or −1 |
| `problem:add-both/L6/seed26` | this set had an answer of 1 or −1 |
| `problem:add-both/L6/seed29` | this set had an answer of 1 or −1 |

Over seeds 0–1000 the sets that changed are: Level 2 (shown as Level 1) 311, Level 3 615, Level 4 522, Level 5 461, Level 6 390. Seed 7 (the test links and the parity screens) is unchanged at Levels 2, 4 and 6; at Level 3 its first problem is now x − 3 = −1 (it was x − 4 = −3, answer 1), and at Level 5 its fourth problem changed (the test-link words were updated).

## Build F, Part 2: the seesaw beside the work (2026-10-20)

Every screen of both Solve it cards changed, and nothing else did: problems, save codes, class-sheet events and traces are identical to the code before this part (checked by running parity on both and comparing the 62 screens pixel by pixel).
- **Both cards:** the page is wider (up to 1280 px instead of 960), so the seesaw fits beside the work.
- **Add:** x =, the green button and the corners sit a little lower, at one height in every state, and the seesaw, its tray and the walks at x alone draw in the right-hand space.

(Its screen rows are in the history section at the end: the screens were re-baselined on 2026-10-24.)

## Build F, Part 3: the help gaps (2026-10-20)

Compared run by run with the code before this part: one scripted run changed, and the screens.
- **Divide it, after Undo (the reminder):** the fraction option under Multiply opens lit, with its preview, and the line says "To get one x, take a fraction of both sides: one of the 5 x boxes is ⅕." It is recorded as a reminder (`hint`). When the fraction is then chosen, the line keeps "Pick a fraction of both sides…" (it went back to "Find the value of x." before).
- **Add, the screens:** the work and the right-hand space are split evenly in every state, so the work never shifts sideways when the seesaw or a walk comes in. All Add screens move a little; they are already listed under Part 2.
- **Not reached by the scripted runs** (covered by unit tests in `tests/spotlight.test.js` and `tests/aloneHelp.test.js`):
  - a wrong seesaw move's picture spotlight;
  - the counters walk drawn for the student, with tap-to-cross-off.

| Key | Why |
|---|---|
| `event:divide-it/wrong-guess-then-undo` | the reminder after Undo is recorded: `supports` [] → [`hint`] (its trace, from step 8, is already allowed by an earlier entry) |

## Build H, Part 1: the quick fixes (2026-10-21)

Compared screen by screen with the code before this part (`main` at `5a528b1`): no scripted run changed (no trace, event, problem or save code), only these screens. Every one of them is already allowed by an earlier part; they are listed again here with what this part did to them.
- **A check that ends Not balanced** (`add-wrong-guess`, `div-wrong-guess`, `div-end`): the last row of the check (the two values that are not equal) is lit with the "Not balanced" label instead of greyed; the value dropped into each x is blue in the first row.
- **The check's first row, wherever a check is on screen** (`add-end`): the value dropped into x is blue.
- **Walk and help screens** (`add-alone-stuck-2`, `add-alone-stuck-3`, `div-alone-stuck-1`, `div-failed-stuck`, `div-stuck-1`, `div-stuck-2`): a few pixels only (under 0.2%).

(Its screen rows are in the history section at the end: the screens were re-baselined on 2026-10-24.)

## Build H, Part 2: the seesaw mirrors the check (2026-10-21)

Compared with the code before this part: no scripted run (trace, event, problem, save code) and no screen changed. None of the 31 screens draws a check on the seesaw, so the new picture is covered by `tests/seesawCheck.test.js` (the mirror's states line by line, the 12-counter limit, a wrong value, x on the right) and by the walk of its Features to check item. No new key is needed.

## Build H, Part 3: big numbers at x alone (2026-10-21)

Compared with the code before this part: no scripted run and no screen changed (no scripted run reaches x alone with a number past 12; the scripted ones use −4 + −8 and 11 − 8, which are as before). The two small questions are covered by `tests/bigPairs.test.js`, which also checks that up to 12 is unchanged and that the class-sheet words are the same (`hint` only, from the Party or Battle at the numbers). No new key is needed.

## Build I, Part 1: the check writes the equation, then the value under each x (2026-10-21)

Compared screen by screen with the code before this part (`main` at `25f65f0`): no scripted run changed (no trace, event, problem or save code: the new first line is drawn by the screen, not kept in the state, and the number of Next presses is the same), only the four screens that show a check. Each is already allowed by an earlier part; listed again with what this part did.
- **Every check** (`add-wrong-guess`, `add-end`, `div-wrong-guess`, `div-end`): the check space starts with the equation itself, every x blue (`x + 8 = −4`, `5x = −15`); the line with the value is directly under it, each value under the x it replaced (the first line moves right a little when the value is wider than x). Everything below moves down one row.

(Its screen rows are in the history section at the end: the screens were re-baselined on 2026-10-24.)

## Build I, Parts 2 and 3: big numbers one question at a time; a party of negatives keeps its sign (2026-10-21)

Compared with the code after Part 1: no scripted run and no screen changed. No scripted run reaches x alone with a number past 12, and none types a party of negatives without its sign (the scripted runs at `x = −4 + −8` type −12). The new behaviour is covered by `tests/bigPairs.test.js` (one question at a time, for a battle and now a party) and `tests/buildI.test.js` (every party-of-negatives shape from the generators, typed +sum, gets the sign question after Undo; typed −sum is correct; a battle never gets it; the class sheet keeps the word `hint`). The new slip tag `party-neg-sign` appears only in those runs. No new key is needed.


## Build J: the Flip everything card, and Take a fraction shared (2026-10-21)

**Save codes.** New codes are written in a v15 layout: the twelve earlier cards in the same places, then Flip everything's six levels at the end (17 symbols instead of 16). So every code the harness writes changes (the version letter `G` becomes `H`, and one more symbol). Nothing about what an older code means changes: every v1-v14 code still decodes to the same progress, and each of these 72 recorded v14 codes is checked in `tests/flip.test.js` to decode, re-encode as the same v14 code, and carry its levels into v15 unchanged.

**Divide it, Add to both sides and the rest.** Take a fraction (the move, its blank, its preview, a fraction that does not split and the fractions to choose from after it) moved out of Divide it's own files into shared ones (`engine/fractionMove.js`, `engine/multiplyMenu.js`, `view/multiplyRow.js`); Divide it is configured on them. Problems, class-sheet records and every trace are unchanged, and the screens were compared pixel by pixel with Build I's: no screen of Divide it changed. Divide's Smaller numbers light now compares by size (identical for its positive coefficients). The only words that changed on Add to both sides are the first Trade places pop-up, which gains one sentence: "This is the symmetric property: if a = b, then b = a." (none of the 31 screens shows it).

| Key | Before | After | Why |
|---|---|---|---|
| `savecode:empty` | `MAT-G2222222222222222X` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:combineit-L1` | `MAT-G22222222224CPPC4X` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:combineit-L2` | `MAT-G22222222226QCBP6V` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:combineit-L3` | `MAT-G2222222222BDPNBAR` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:combineit-L4` | `MAT-G2222222222MSC9MJG` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:combineit-L5` | `MAT-G22222222238HPH83W` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:flipit-L1` | `MAT-G2222222222222223H` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:flipit-L2` | `MAT-G22222222222222244` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:flipit-L3` | `MAT-G22222222222222269` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:flipit-L4` | `MAT-G222222222222222AK` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:flipit-L5` | `MAT-G222222222222222J8` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:lasso-L1` | `MAT-G22222222222222333` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:lasso-L2` | `MAT-G22222222222222447` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:lasso-L3` | `MAT-G2222222222222266F` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:lasso-L4` | `MAT-G22222222222222AAY` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:lasso-L5` | `MAT-G22222222222222JJZ` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:lasso-L6` | `MAT-G22222222222223435` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:lasso-L7` | `MAT-G2222222222222464B` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:boxes-L1` | `MAT-G22222222222226A6Q` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:boxes-L2` | `MAT-G2222222222222AJAG` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:boxes-L3` | `MAT-G2222222222222K3JJ` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:boxes-L4` | `MAT-G22222222222235537` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:boxes-L5` | `MAT-G2222222222224884F` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:boxes-L6` | `MAT-G2222222222226EE6Y` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:groups-of-terms-L1` | `MAT-G222222222222ATTAZ` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:groups-of-terms-L2` | `MAT-G222222222222KMKJ3` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:groups-of-terms-L3` | `MAT-G22222222222368637` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:groups-of-terms-L4` | `MAT-G222222222224AEA4F` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:groups-of-terms-L5` | `MAT-G222222222226JTJ6Y` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:groups-of-terms-L6` | `MAT-G22222222222B4M3AF` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:groups-of-terms-L7` | `MAT-G22222222222M774JF` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:groups-of-terms-L8` | `MAT-G222222222237CC73X` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:distribute-combine-L1` | `MAT-G2222222224F2BZE4R` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:distribute-combine-L2` | `MAT-G2222222226V2NYT62` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:distribute-combine-L3` | `MAT-G222222222BQ3AXKAY` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:distribute-combine-L4` | `MAT-G222222222ND4KV5JD` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:distribute-combine-L5` | `MAT-G2222222239R76Q93P` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:value-L1` | `MAT-G222222224HFCBDG4A` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:value-L2` | `MAT-G222222226ZVPMRX6N` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:value-L3` | `MAT-G22222222BZRC8GUAY` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:value-L4` | `MAT-G22222222NZFPEYNJ9` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:add-both-L1` | `MAT-G222DR25MB7KMC65AA` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:add-both-L2` | `MAT-G222SF297MD67PA8JX` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:add-both-L3` | `MAT-G223HV2GD7RADBJF3E` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:add-both-L4` | `MAT-G2252Q2XRDFJRN3V44` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:add-both-L5` | `MAT-G2283D3VFRW4G95Q6S` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:add-both-L6` | `MAT-G22E4R5QWGS6XG9DA3` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:divide-it-L1` | `MAT-G22T7F9ESYHBUXGRJQ` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:divide-it-L2` | `MAT-G23KCVGUJWZNPUYG36` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:divide-it-L3` | `MAT-G255QQYP4TZACPWX4P` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:divide-it-L4` | `MAT-G289EEXB7MYJQCTU6D` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:divide-it-L5` | `MAT-G2EGTUUMD8X4DQMNAJ` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:divide-it-L6` | `MAT-G2TYMPP7RFU6SE89JT` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:one-step-L1` | `MAT-G22222224KXSNPUJ47` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:one-step-L2` | `MAT-G222222276VJACP36D` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:one-step-L3` | `MAT-G2222222CBR3JQB4A3` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:one-step-L4` | `MAT-G2222222PNF54DM6JE` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:one-step-L5` | `MAT-G2222223C9V86S7B3J` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:switch-L1` | `MAT-G22227PURKM2AJ6F6F` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:switch-L2` | `MAT-G2222DCPG672K3AVAV` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:switch-L3` | `MAT-G2222RQBXAC354KQJZ` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:switch-L4` | `MAT-G2223GDNUJP4876E3B` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:switch-L5` | `MAT-G2224XSAP4B6ECAT4X` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:switch-L6` | `MAT-G2227VHKB6MATPKK66` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:two-step-L1` | `MAT-G222222QB3J7FYRPJ4` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:two-step-L2` | `MAT-G222223DM53CWXGC3V` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:two-step-L3` | `MAT-G222224S784QTUXP4Y` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:two-step-L4` | `MAT-G222227HCE7EMPVB6H` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:two-step-L5` | `MAT-G22222CZPTCU8CQMAF` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:two-step-L6` | `MAT-G22222QZCKQNEQE7J8` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:two-step-L7` | `MAT-G22223EYQ6E9UDTD33` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:everything` | `MAT-G3MX89FVET36ERJFGJ` | the same state, written as v15 (one symbol longer) | it still reads back the same |
| `savecode:flip-everything-L1` | none (the card is new) | a v15 code with Flip everything's saved Level 1 done | the new card's levels are saved in the code |
| `savecode:flip-everything-L2` | none (the card is new) | a v15 code with Flip everything's saved Level 2 done | the new card's levels are saved in the code |
| `savecode:flip-everything-L3` | none (the card is new) | a v15 code with Flip everything's saved Level 3 done | the new card's levels are saved in the code |
| `savecode:flip-everything-L4` | none (the card is new) | a v15 code with Flip everything's saved Level 4 done | the new card's levels are saved in the code |
| `savecode:flip-everything-L5` | none (the card is new) | a v15 code with Flip everything's saved Level 5 done | the new card's levels are saved in the code |
| `savecode:flip-everything-L6` | none (the card is new) | a v15 code with Flip everything's saved Level 6 done | the new card's levels are saved in the code |

## Build K (2026-10-21): the new Two-step equations card; the first-flip pop-up on Flip everything

**Compared directly with `main` before this build (Build J, `671f6d2`):** a baseline recorded from that commit, with nothing listed as
intended. Problems, class-sheet records and all 25 scripted runs are identical, and all 62 screens of Add to both sides and Divide it match
pixel for pixel. The only differences are save codes:

- The 72 recorded states are now written as **v16** (one symbol longer: the new card's seven levels are appended at the end). Each decodes
  to the same progress as before. Their keys are already listed above (from Build J), so they pass here.
- Nine of them (`savecode:two-step-L1` … `-L7`, `savecode:switch-L5`, `savecode:switch-L6`) no longer read back as the identical code,
  because decoding now credits the matching levels of the new card (the same pattern as Add to both sides' and Divide it's credit). The
  old card's own levels keep their bits and their meaning.
- Seven new states, the new card's levels:

| Key | Before | After | Why |
|---|---|---|---|
| `savecode:two-step-equations-L1` | none (the card is new) | a v16 code with the new Two-step card's Level 1 done | the new card's levels are saved in the code |
| `savecode:two-step-equations-L2` | none (the card is new) | a v16 code with its Level 2 done | the same |
| `savecode:two-step-equations-L3` | none (the card is new) | a v16 code with its Level 3 done | the same |
| `savecode:two-step-equations-L4` | none (the card is new) | a v16 code with its Level 4 done | the same |
| `savecode:two-step-equations-L5` | none (the card is new) | a v16 code with its Level 5 done | the same |
| `savecode:two-step-equations-L6` | none (the card is new) | a v16 code with its Level 6 done | the same |
| `savecode:two-step-equations-L7` | none (the card is new) | a v16 code with its Level 7 done | the same |

**Not in the harness (Flip everything has no scripted runs):** the first flip of a level that helps now says "Multiplying both sides by −1
flips every sign. −x becomes x." (a small pop-up beside the panel, once a level, like the first Trade places). Everything else on Flip
everything is unchanged; its unit tests (`tests/flip.test.js`) pass as before, and a flip without the level's flag says what it said.

## Build L (2026-10-22): the Multiply menu is multiply / divide / fraction, and Flip leaves it; the placement quiz opens the new Two-step card

**Compared directly with `main` before this build (Build K, `267811f`):** a baseline recorded from that commit, with nothing listed as
intended. Problems, save codes, class-sheet records, all 25 scripted runs and all 62 screens of Add to both sides and Divide it are
identical, so nothing is added to the table above.

**Why the screens did not change:** none of the 62 recorded states opens the Multiply menu (its options and the Divide row show only after a
click on Multiply, and the harness's Divide steps still click the old "Take a fraction" button, which has not existed since Build D-2, so
those states never reach the move). The screens that do change were compared by hand and photographed in `docs/build-l/` instead:

| Where | Before | After | Why |
|---|---|---|---|
| Divide it, Flip everything, Two-step: Multiply's options | `▢ × ( )`, `▢/▢ × ( )`, `−1 × ( )` | `× ▢ ( ) = ▢ ( )`, `÷ 1/▢ ( ) = 1/▢ ( )`, `▢/▢ ( ) = ▢/▢ ( )` (greyed on every card today) | Build L, Parts 1 and 3 |
| The row under the equation while Divide is hovered or chosen | (the fraction's two boxes) | `1/▢ × (5x) = 1/▢ × (−15)`, the 1/ printed, and the line "Dividing by 5 is multiplying by ⅕." under it | Part 1 |
| The rows written after the move | `⅕(5x) = ⅕(−15)`, `x = ⅕(−15)` | the same: dividing by 5 writes what taking ⅕ wrote | must not change |
| The hint after Undo (Divide it D1, Flip everything F2 and F3, Two-step's three x boxes) | "take a fraction of both sides", the fraction option lit | "divide both sides by 5 (that is, multiply by ⅕)", the Divide option lit and previewed | Part 4 |
| Add to both sides | the Multiply button greyed, no options | unchanged | Part 3 |

**Not in the harness:** Flip everything and Two-step have no scripted runs; their unit tests (`tests/flip.test.js`, `tests/twoStep.test.js`,
`tests/shape.test.js`) now play the fraction through Divide and pass with the same rows, shapes and lights, and `tests/buildL.test.js`
checks that dividing by −1 gives the same rows, words and class-sheet record as the Flip button. The placement quiz is not in the harness
either: `tests/diagnostic.test.js` checks that its problems and their order are unchanged and that a result saved before Build L opens what
it opened then.

## Build M (2026-10-23): the Distribute, combine, solve card; the placement quiz fixes

**Compared with the baseline as Build L left it:** problems, class-sheet records, all 25 scripted runs and all 62 screens of Add to both
sides and Divide it are unchanged, so nothing about them is added. The only differences are save codes:

- The 72 recorded states are now written as **v17** (one symbol longer: the new card's five levels are appended at the end). Each decodes to
  the same progress as before, and every older code carries into v17 unchanged (`tests/savecode.test.js`). Their keys are already listed
  above, so they pass here.
- Five new states, the new card's levels:

| Key | Before | After | Why |
|---|---|---|---|
| `savecode:distribute-solve-L1` | none (the card is new) | a v17 code with Distribute, combine, solve's Level 1 done | the new card's levels are saved in the code |
| `savecode:distribute-solve-L2` | none (the card is new) | a v17 code with its Level 2 done | the same |
| `savecode:distribute-solve-L3` | none (the card is new) | a v17 code with its Level 3 done | the same |
| `savecode:distribute-solve-L4` | none (the card is new) | a v17 code with its Level 4 done | the same |
| `savecode:distribute-solve-L5` | none (the card is new) | a v17 code with its Level 5 done | the same |

<!-- history: nothing below this line is read by the harness -->

## History: screen changes accepted by the re-baseline of 2026-10-24 (Build O, Part 0)

Build N found that all 62 recorded screens were listed above as intended changes, so the screen check passed whatever the screens looked like. On 2026-10-24 the screens were recorded again from `main` as it was then (Build N, `aa647e9`), with four more states (Divide it's Multiply menu open, and the opening of Flip everything, Two-step equations and Distribute, combine, solve), and the harness's Divide steps were fixed to reach the real move. The rows below are what each earlier build listed, kept for the record; the harness reads nothing below the history line, so every screen difference from now on must be listed above it, one key per row.

### From "Intended changes since the baseline"

| Key | Before | After | Why |
|---|---|---|---|
| `screen:add-helpful-move@1366x768` | Six lights Add doesn't judge copied Fewer terms' green | Only Fewer terms and Solved for x show a state | [2.7] |
| `screen:add-helpful-move@1366x650` | as above | as above | [2.7] |
| `screen:add-end@1366x768` | as above | as above | [2.7] |
| `screen:add-end@1366x650` | as above | as above | [2.7] |
| `screen:add-alone-stuck-1@1366x768` | as above | as above (the line is unchanged) | [2.7] |
| `screen:add-alone-stuck-1@1366x650` | as above | as above | [2.7] |
| `screen:add-alone-stuck-2@1366x768` | The seesaw, with nothing to do | The work stack, the two numbers outlined, the sum question | [2.3], [2.7] |
| `screen:add-alone-stuck-2@1366x650` | as above | as above | [2.3], [2.7] |
| `screen:add-alone-stuck-3@1366x768` | Party or Battle? (about to write the value) | The sum question with "In a party the teams join." | [2.3], [2.7] |
| `screen:add-alone-stuck-3@1366x650` | as above | as above | [2.3], [2.7] |
| `screen:add-alone-teach@1366x768` | The seesaw and "Add −8 to the left…" | The sum help in full | [2.2], [2.3], [2.7] |
| `screen:add-alone-teach@1366x650` | as above | as above | [2.2], [2.3], [2.7] |
| `screen:add-partial-stuck-4@1366x768` | The seesaw with "−8 cancels the +3" | "…Let's undo it first: press Undo." on the bare screen | [2.6] |
| `screen:add-partial-stuck-4@1366x650` | as above | as above | [2.6] |
| `screen:add-partial-teach@1366x768` | The seesaw forcing −8 | Undo first | [2.6] |
| `screen:add-partial-teach@1366x650` | as above | as above | [2.6] |
| `screen:add-red-stuck@1366x768` | The reminder rung over the red move | Undo first | [2.6] |
| `screen:add-red-stuck@1366x650` | as above | as above | [2.6] |
| `screen:div-failed-stuck@1366x768` | The counters over the failed fraction | Undo first | [2.6] |
| `screen:div-failed-stuck@1366x650` | as above | as above | [2.6] |

### From "Build C, Part 1 (2026-10-18): the lights layout is the default; Guess x / Use a move and the tucked layout are deleted"

| Key | Before | After | Why |
|---|---|---|---|
| `screen:add-L2-stuck-2@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-L2-stuck-2@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-forced-move@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-forced-move@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-opening@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-opening@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-partial-move@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-partial-move@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-red-move@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-red-move@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-stuck-1@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-stuck-1@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-stuck-2@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-stuck-2@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-stuck-3@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-stuck-3@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-stuck-4@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-stuck-4@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-teach@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-teach@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-wrong-guess-undone@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-wrong-guess-undone@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-wrong-guess@1366x650` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:add-wrong-guess@1366x768` | the classic screen | the lights layout (preview row, blank in the equation, rule line and Next, bottom row, corner Undo / Start over) | Build C, Part 1 |
| `screen:div-failed@1366x768` | the classic screen with the choice | no Guess x / Use a move buttons in the line | Build C, Part 1 |
| `screen:div-opening@1366x650` | the classic screen with the choice | no Guess x / Use a move buttons in the line | Build C, Part 1 |
| `screen:div-opening@1366x768` | the classic screen with the choice | no Guess x / Use a move buttons in the line | Build C, Part 1 |

### From "Build C, Part 2 (2026-10-18): errors are spotlight pop-ups, and Undo is the only way out"

| Key | Before | After | Why |
|---|---|---|---|
| `screen:div-wrong-guess@1366x768` | the substitution ending “Not balanced” | the same, dimmed, the failing line lit (“not balanced”), the pop-up beside it, Undo pulsing | Part 2 |
| `screen:div-wrong-guess@1366x650` | as above | as above | Part 2 |
| `screen:div-failed@1366x650` | the failed row, in red | the same, dimmed, the row lit (“doesn’t split”), the pop-up beside it, Undo pulsing | Part 2 |

### From "Build D, Part 1 (2026-10-18): the light design"

| Key | Before | After | Why |
|---|---|---|---|
| `screen:add-opening@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-opening@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-helpful-move@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-helpful-move@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-red-move@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-red-move@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-partial-move@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-partial-move@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-stuck-1@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-stuck-1@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-stuck-2@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-stuck-2@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-stuck-3@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-stuck-3@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-stuck-4@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-stuck-4@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-teach@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-teach@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-wrong-guess@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-wrong-guess@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-wrong-guess-undone@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-wrong-guess-undone@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-forced-move@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-forced-move@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-end@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-end@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-partial-stuck-4@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-partial-stuck-4@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-partial-teach@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-partial-teach@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-alone-stuck-1@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-alone-stuck-1@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-alone-stuck-2@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-alone-stuck-2@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-alone-stuck-3@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-alone-stuck-3@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-alone-teach@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-alone-teach@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-red-stuck@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-red-stuck@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:add-L2-stuck-2@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:add-L2-stuck-2@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:div-opening@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:div-opening@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:div-helpful-move@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:div-helpful-move@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:div-failed@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:div-failed@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:div-stuck-1@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:div-stuck-1@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:div-stuck-2@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:div-stuck-2@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:div-teach@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:div-teach@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:div-wrong-guess@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:div-wrong-guess@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:div-end@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:div-end@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:div-failed-stuck@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:div-failed-stuck@1366x650` | the Build C screen | the light design | Part 1 |
| `screen:div-alone-stuck-1@1366x768` | the Build C screen | the light design | Part 1 |
| `screen:div-alone-stuck-1@1366x650` | the Build C screen | the light design | Part 1 |

### From "Build E, P4 (2026-10-19): Add to both sides on the shared loop"

| Key | Before | After | Why |
|---|---|---|---|
| `screen:add-helpful-move@*`, `screen:add-alone-teach@*` | green Next after the move; dashed rule line; Start over greyed | green Check (greyed until x is typed); solid rule line; Start over live | The loop: a move that leaves x alone is committed at once (the next thing is typing x), and Start over is live once anything has been done (spec §1C). Pairs in `docs/build-e/be-01-…` |

### From "Build F, Part 2: the seesaw beside the work (2026-10-20)"

| Key | Before | After | Why |
|---|---|---|---|
| `screen:add-L2-stuck-2@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-L2-stuck-2@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-alone-stuck-1@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-alone-stuck-1@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-alone-stuck-2@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-alone-stuck-2@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-alone-stuck-3@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-alone-stuck-3@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-alone-teach@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-alone-teach@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-end@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-end@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-forced-move@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-forced-move@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-helpful-move@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-helpful-move@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-opening@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-opening@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-partial-move@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-partial-move@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-partial-stuck-4@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-partial-stuck-4@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-partial-teach@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-partial-teach@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-red-move@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-red-move@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-red-stuck@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-red-stuck@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-stuck-1@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-stuck-1@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-stuck-2@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-stuck-2@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-stuck-3@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-stuck-3@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-stuck-4@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-stuck-4@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-teach@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-teach@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-wrong-guess-undone@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-wrong-guess-undone@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-wrong-guess@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:add-wrong-guess@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-alone-stuck-1@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-alone-stuck-1@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-end@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-end@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-failed-stuck@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-failed-stuck@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-failed@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-failed@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-helpful-move@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-helpful-move@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-opening@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-opening@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-stuck-1@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-stuck-1@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-stuck-2@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-stuck-2@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-teach@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-teach@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-wrong-guess@1366x650` | the wider page; on Add the seesaw and walks beside the work, one height for the work |
| `screen:div-wrong-guess@1366x768` | the wider page; on Add the seesaw and walks beside the work, one height for the work |

### From "Build H, Part 1: the quick fixes (2026-10-21)"

| Key | Before | After | Why |
|---|---|---|---|
| `screen:add-wrong-guess@1366x768` | the last check row is lit with "Not balanced"; the substituted value is blue |
| `screen:add-wrong-guess@1366x650` | as above |
| `screen:div-wrong-guess@1366x768` | as above |
| `screen:div-wrong-guess@1366x650` | as above |
| `screen:div-end@1366x768` | the substituted value is blue in the first check row |
| `screen:div-end@1366x650` | as above |
| `screen:add-end@1366x768` | as above |
| `screen:add-end@1366x650` | as above |

### From "Build I, Part 1: the check writes the equation, then the value under each x (2026-10-21)"

| Key | Before | After | Why |
|---|---|---|---|
| `screen:add-wrong-guess@1366x768` | the check's new first line, the equation; the value under its x |
| `screen:add-wrong-guess@1366x650` | as above |
| `screen:add-end@1366x768` | as above |
| `screen:add-end@1366x650` | as above |
| `screen:div-wrong-guess@1366x768` | as above |
| `screen:div-wrong-guess@1366x650` | as above |
| `screen:div-end@1366x768` | as above |
| `screen:div-end@1366x650` | as above |
