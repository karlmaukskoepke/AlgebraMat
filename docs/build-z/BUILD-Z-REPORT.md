# Build Z report: skip ahead by testing out of a locked level (2026-11-03)

Everything is on `main` with no flag, after the unit tests, the real-browser sweeps and `npm run parity`. Decision log: "2026-11-01: test
out". Loop spec: revision 2.17 (a new item in section 7). Solve it and Solve it Plus cards only; Count it and Build it are not changed.

## What was built

- **A locked level is tappable** on every Solve it and Solve it Plus card, in the card's level list (a dashed button, "Locked" and "Tap to
  skip ahead") and in its level popup (the note reads "Finish Level N to open this, or tap to skip ahead."). Tapping opens a small panel:
  "Want to try it? Solve 2 problems here to skip ahead." with Try it and Not now. No timer. Strange solutions' Levels 4-5 are not displayed,
  so they cannot be tried; "See why it works" is not a level here. Count it and Build it rows still only show their note.
- **The attempt** is the level's first two problems for a fresh seed (a test link's `seed` gives the same first attempt; each retry is a new
  set). A bar at the top says "Skip ahead · Level 3 · Problem 1 of 2 · Give up"; the header's title is hidden under it; two problem dots.
- **No-help mode** (one switch, `src/engine/noHelp.js`, on only during an attempt): I'm stuck and Teach me are hidden and their actions
  (buttons, S and T keys) ignored; the spotlight draws nothing (no error pop-up, no hint after Undo, no question); no nudge, no idle flash;
  no model drawn by itself; nothing pointed out once a level (Trade places, the flip, dividing by a negative, the rewrite's instruction);
  no forced move. After every action the session is cleaned (`quiet` in `src/engine/testOut.js`): no hint spot, no outlined move, and
  the line shows only the check's own words (placing the value, plugging it in, Balanced; Strange solutions' "Can you simplify this
  further?"), everything else back to "Find x.". Undo and Start over stay (Start over works even while a move waits for Undo). A move that
  makes things worse is written and waits for Undo, with Undo outlined, as on the card, but with no words.
- **Independent, as built:** the first value the student checks is right, whether it is a guess before x is alone or the final value. A
  wrong value ends the attempt once its check reaches "✗ Not balanced"; Give up ends it at once; leaving with ← Packs mid-try is logged
  as a give-up.
- **Pass:** "2 of 2 balanced!" for 1.5 s (a click skips the wait), then the card opens with "You skipped ahead! Do one more problem on
  Level 3 to make it gold." in a silver box. The level and every displayed level below it are placed (silver), the next level opens.
- **Fail:** "This try is over." for 1.5 s, then in place of the Mat: "Not yet." / "Try Level N first." / "x = 9 did not balance." (only
  after a wrong value) / "You can try again any time, with new problems." with Go to Level N, Try again and Pack map. N is the highest
  level the student has open. Nothing is lowered; Try again starts at once with new problems.
- **Gold:** Build X's rule unchanged, no new hook: the placed level becomes earned with one problem on the level itself (where help is back).

## Data

- Credit is Build X's placed state (`placeLevels`): on the device, in the Google sign-in sync, merged earned over placed over none.
  Nothing is ever lowered (tests).
- **Class sheet:** each problem of an attempt is its usual Log row (level, problem, answers and tags), with **`test-out-pass`** or
  **`test-out-fail`** in its Supports column; rows are held until the attempt ends, then written together. Placed levels reach the sheet's
  placed column as in Build X. **Nothing to do in the sheet**: the script is unchanged and takes the new words as they come.
- **Save codes:** no change (codes carry earned levels only; a test-out's placed credit is not in a code, as Build X noted).

## Tests

- `tests/buildZ.test.js` (16): which levels can be tried; two fresh problems; a pass; a correct guess; each kind of fail; help actions
  dropped; the no-help cleaning; no intros or model; the credit below the level (skipping "See why it works"); next level unlocked; the same
  level twice; nothing lowered; gold by one problem; save code unchanged; the suggested level; the class-sheet rows and words.
- `tests/testOutSweep.test.js` (11, real browser): tapping a locked level in the card and the popup; for **each of the 9 cards**, a move that
  opens the error pop-up on the card as students play it, help asked anyway (actions and the S key), Undo, and 5 s idle: the test fails if any
  pop-up, hint, nudge, flash, model, outlined move or help button appears; then a full pass (message, silver levels, next level open, two
  `test-out-pass` rows). A fail, Try again (new problems), Give up, nothing lowered, help back on the suggested level.
- Two older browser checks changed on purpose (`tests/menuSweep.test.js`): Divide it's locked row's words, and a touch tap on a Solve it
  locked row now opens the panel (a Count it row still shows its note).

## Before every push: the real-browser sweeps

`npm test` ran with Playwright found (no "SKIP" line): **109 files, 2261 tests, all pass**, including the typing, drag, redraw, font-size
(screen sweep), panel-room and Add cross-out sweeps, the menu sweep and the new test-out sweep. GitHub's "Real-browser sweeps" job runs them
too.

## Parity

`npm run parity`: **PASS** on all five checks (problems, save codes, class-sheet records, traces, 70 screens), nothing new. The one note
it prints (two trace keys listed but unchanged) was already there before this build. The screens that change are outside the recorded set
(the main menu and the card views), listed one card at a time in `tests/parity/INTENDED-CHANGES.md` under Build Z.

## Test-links and Features to check

Six new items (tap a locked level; a pass; a fail and Try again; Give up; a silver level turning gold; Play it like a student), a Live
entry, and three Build AB items updated because their locked-row note and tap changed (`ab-pop-point`, `ab-pop-locked`, `ab-pop-tap`).
Walked on the live site: the six new items pass; the full list's result is at the end of this report.

## Pictures (`docs/build-z/`, 1366×768 and 1366×650, from the live site)

`z-locked-*` (a card's locked levels), `z-ask-*` (the panel), `z-popup-row-*` (the popup note), `z-problem-1-of-2-*`, `z-pass-*` (the warm
message, levels in silver), `z-not-balanced-768` (the try ending), `z-fail-*` (the fail panel), `z-giveup-*`, `z-silver-*`, `z-gold-*`,
`z-student-undo-*`.

## Could Count it and Build it take it later?

Yes, with moderate work. The level rule (`canTestOut`) is one list of sections, and the credit, the records and the panel are shared. What
they would need is their own no-help cleaning: their light-mode cards have different help (the tour, the supports a wrong answer brings
in, their own I'm stuck rungs) and no Solve it spotlight, so `quiet` and the hidden buttons would need a version for their sessions, and
"independent" there would be the first typed answer right. Not built (Karl: read-only).

## Anything that surprised me

- **Enter through the check.** A student who keeps pressing Enter through a wrong check would have pressed "Go to Level 1" on the fail
  panel by accident. The panel now takes the focus itself (Tab reaches the buttons), so extra Enters do nothing. Found by the walk.
- **The result waits 1.5 s** so the student sees "Balanced" or "Not balanced" before the card or the fail panel. A click skips the wait;
  Enter does not (the play screen's Enter key is taken first), so Enter just waits the 1.5 s.
- **Divide it's "doesn't split" pop-up** is keyed to its message, so in a test-out (where the message is cleared) it does not hold the
  screen for Undo; the move still waits for Undo, as every red move does.
- **Leaving mid-try** (← Packs) is logged as a give-up (`test-out-fail`), so the sheet has no attempt with no outcome.

## The full Features to check list, walked on the live site

All 226 items: 221 passed on the first run. Two (`ac-help-l4`, `s-add-options`) timed out loading the page and pass on a second run. Three
Build AB items failed because they expected the old locked-row note ("Finish Level 4 to open this.") and the old tap; they were updated
(items and walks) and pass on the live site after the second push.
