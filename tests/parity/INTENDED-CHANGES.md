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
| `screen:div-wrong-guess@1366x768` | the substitution ending “Not balanced” | the same, dimmed, the failing line lit (“not balanced”), the pop-up beside it, Undo pulsing | Part 2 |
| `screen:div-wrong-guess@1366x650` | as above | as above | Part 2 |
| `screen:div-failed@1366x650` | the failed row, in red | the same, dimmed, the row lit (“doesn’t split”), the pop-up beside it, Undo pulsing | Part 2 |
