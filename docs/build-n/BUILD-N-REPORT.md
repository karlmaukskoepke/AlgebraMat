# Build N report: students can't type in a blank (2026-10-24)

Everything is on `main` and live, with no flags. Six pushes, each after the unit tests and a full `npm run parity` passed:

1. the first fix;
2. the fixes the sweep and the standing test found;
3. the tests;
4. `x =` keeping its cursor;
5. the hint's Divide blank on touch;
6. the keypad hiding on a number key.

Then the Features to check items. There are 1,454 unit tests at the end.

## What was wrong (the school report)

On Divide it, Level 3, a student typed a number and nothing appeared in the "divide both sides by" blank. Three ways caused it. All
three were reproduced in a real browser at 1366×768, then fixed.

1. **After a wrong answer and Undo.** The hint opens the Multiply options and shows the Divide blank under the equation ("divide both
   sides by 3"). That blank was only a preview: a typed 3 closed the options, the blank vanished, and the 3 went into `x =`. This
   matches "it may have followed a wrong answer". Pictures: `n1-hint-after-undo-type-3-before.png` / `-after.png`.
2. **A click on the Divide box first.** The click left the focus on the box. The page ignores every key while a button on the Mat has
   the focus, and Divide it typed through the page's keys, so nothing could be typed. It happened on every problem, on Divide it and
   Flip everything, whenever the student clicked the box before typing. Pictures: `n2-click-box-type-3-before.png` / `-after.png`.
3. **The problem after a right answer.** After a correct mental-math answer, the next problem asks for a move first and `x =` is
   greyed. The hidden keypad was switched off with it, and Divide it typed by pressing that keypad, so the blank took nothing. Pictures:
   `n3-after-right-answer-type-2-before.png` / `-after.png`.

The prime suspects in the brief were partly right. The Multiply menu (suspect 1) and the routing of digits (suspect 2) were the causes.
Touch detection (suspect 3) was not, but the sweep found a keypad problem of its own (below). Focus after Undo and after the hint
(suspect 4) was cause 1.

## The fix, at the root

- **One rule for keys on every Solve it card** (`src/view/typingKeys.js`): a digit, the minus and Backspace go straight to the problem,
  which puts them in whatever is open (a move's blank first, then `x =`), whatever has the focus. Divide it and Flip everything now
  use it. Add to both sides, Two-step and Distribute already did.
- **The field the keys go to always shows the cursor and has the focus**, and gets it back after every redraw: after Undo, a pop-up,
  the options toggled, a scaffold step, I'm stuck, Teach me, Start over.
- **The hint's Divide blank is a real field.** A digit or the minus goes into it. It shows the cursor, a tap on its box picks Divide,
  Backspace leaves it open, and the touch keypad comes up for it.
- **The keypad (touch) is on and comes up for every blank:** the Divide and Multiply blanks, the fraction, the sums, the distribute
  blanks and the seesaw's box. It stays down while an error waits for Undo, because only Undo can be pressed then.

## What else the sweep and the standing test found (all fixed)

- `x =` lost its cursor when it was typed into without a click, or emptied with Backspace, while the keys still went there (all cards).
- **Add's blank (Two-step, Distribute):**
  - It kept the keys while a Multiply preview was drawn over it.
  - After Go shook it empty, the keys went on into `x =`.
- Multiply or Flip opened over an open sum or the distribute blanks (Distribute). Those kept the keys while the Divide blank had the
  cursor.
- **The focus was in one place and the keys in another:**
  - After Esc on Add, the Add button kept the focus, so Enter would have pressed Add instead of Check.
  - After a click on Undo, Undo kept the focus.
  - On a factor that said "tap the minus first", the factor kept it.
- The seesaw's Add box (Add to both sides, Levels 1-2 scaffold) had no cursor, and no keypad on touch.
- **A touchscreen with a keyboard:** the first number key is meant to hide the keypad. The cards' keys took the digit first, so the
  keypad stayed up over the screen. This was true of Add to both sides before this build too.

## The sweep (Part 1): `tests/typing/sweep.mjs`

It plays Divide it at displayed Levels 1-5 (saved 2-6) in a real browser at 1366×768. After each state it opens Divide, presses 3, and
checks that the 3 is in the blank and the blank has the focus. Where Divide is not on offer but `x =` is waiting, it checks `x =`
instead.

It reaches 23 named states on each level:

- a fresh problem;
- after clicking the Divide box;
- after a wrong divide number and Undo;
- after the fraction does not split, Undo and Got it;
- after a divide number that is not allowed;
- after a wrong guess and Undo;
- after the hint after Undo;
- after the one-digit pop-up;
- after typing and clearing;
- after Multiply opened and closed 5 times;
- after choosing Multiply, then Divide;
- after a whole number that does not help;
- after tapping the greyed fraction;
- after I'm stuck 1, 2, 3 and 4 times;
- after Teach me;
- after Start over;
- after a correct move and Undo;
- after a check and Undo;
- after switching tabs and back;
- on the problem after a right answer.

| Run | Before the fix (old version) | After |
|---|---|---|
| Keyboard, named states, Level 3 | 0 of 23 pass (4 keys lost, 19 with no focus) | 23 of 23 |
| Keyboard, named states, all levels | n/a | 115 of 115 at the start, and 114 of 114 on the final code (one state offered no Divide) |
| 1,000 random orders of student actions | n/a | Divide offered in 931; 930 pass. The one failure was the script timing out on a click, not a key |
| Touch: tapping the keypad, and a touchscreen with a keyboard, all levels | n/a | 230 of 230 (the keypad comes up and takes the tap; a number key lands and hides the keypad) |

## The standing test (Part 3): `tests/canType.test.js`, runs with `npm test`

Every Solve it card (Add, Divide, Flip everything, Two-step, Distribute) is played by fixed random walks from every level. The walks
use wrong values, Undo, I'm stuck, Teach me, the menus, moves half made and correct moves, including distributing and combining.

In every state that waits for a typed value, the test draws the real screen and binds the card's real keys. It presses a key, finds
which field changed, and checks that this field was visible, live, had the focus and showed the cursor, and that the keypad was on. The
fields covered are a move blank, `x =`, a sign, a sum, the distribute blanks, the seesaw box and the hint's blank.

About 1,600 typing states, covering every shape the walks reach on each card:

- Add: S1, S2, S7, T2
- Divide: D1, D2
- Flip: F1-F5
- Two-step: W1, W2, D1, F2, F5
- Distribute: P1-P6, E1, E2, E4, Q1, Q2, W1, W2, D1, F2, F5

Shapes that only wait for Undo (S3, DF, FF, W3, Q3) take no typing, by design.

`tests/buildN.test.js` has one regression test for each failure above (17). With the standing test that makes 22 new tests.
A new library, happy-dom, draws the screen for these tests. It is used only by the tests, not by the app.

## Touch and the touchscreen Chromebook

How the app decides (unchanged): a device is "touch" only if its main pointer is a finger and nothing hovers. Otherwise it is
"keyboard".

- **Touchscreen Chromebook, laptop mode** (keyboard and trackpad): classified **keyboard**. No keypad; typed keys go into the fields.
  Tapping the screen still works.
- **Tablet mode** (folded back, no keyboard): classified **touch**. The keypad pops up for each field. After this build it also comes
  up for the Divide and Multiply blanks, the hint's Divide blank and the seesaw box. Before, it did not come up for the Build L Divide
  blank at all.
- **Tablet mode with a keyboard attached:** it starts as touch, and the first number key hides the keypad. That had stopped working on
  Add to both sides (and would have on every card with the new keys); it is fixed.

I tested this by emulation (a finger as the main pointer, no hover), not on a real Chromebook.

## Parity

`npm run parity` passes after every push: problems, save codes, class-sheet events, traces and screens. No new difference was added to
`tests/parity/INTENDED-CHANGES.md`.

**A blind spot:** all 62 parity screenshots were already listed there as intended changes by earlier builds, so the screenshot check
passes whatever the screen looks like. The visible changes in this build were checked by hand with the pictures in this folder:

- `x =` and the blanks keep their cursor while typed in;
- the hint's Divide blank shows a cursor;
- the seesaw box shows a cursor.

## Features to check

- **New:** "Type after a mistake: Divide it" and "Type on the problem after a right answer: Divide it".
- **Updated:** each card's "Play it like a student" has a new last mistake, "a mistake, Undo, then type in the blank", started fresh
  from the item's button.
- **Live:** an entry "Build N: typing always lands where the cursor is".

All seven items were walked on the live site, along with the page check, and pass. Pictures: `n-type-after-*.png` and
`student-*-typed-after-undo.png`.
