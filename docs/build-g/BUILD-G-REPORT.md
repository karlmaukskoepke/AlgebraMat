# Build G report: "Features to check" on the test-links page (2026-10-20)

Only the test-links page, its data file, `CLAUDE.md`, one new unit test and a new walk-through script changed. Nothing a student
sees changed: no file under `src/` was touched. Unit tests: 1096 pass (23 new). `npm run parity`: all five checks pass, with the same
intended differences as before and no new ones.

## What was built
- **The section:** "Features to check" is the first thing on `/test-links.html`, above Live / Testing / Retired. Its items are the
  `checks` list in `public/test-links.json`. Each has a name, the build it came from, one big button, numbered steps, what you
  should see, and a tick box.
- **Ticks:** saved in the browser under their own key (`mat.checks.v1`), so "Reset my progress" leaves them alone. A ticked item drops
  into a collapsed "Checked (n)" group; unticking brings it back. "Clear all ticks" sits at the top.
- **7 items:** the five Build F ones plus one "Play it like a student" per live card (Add to both sides, Divide it).
- **The walk-through:** `tests/features/walk.mjs` opens each item's link in a real browser, does the steps one by one and checks the
  words on screen; it also checks the page (the section is first, ticks persist through a reload, Checked group, Clear all ticks,
  Reset leaves ticks alone). Run it on the live site with
  `node tests/features/walk.mjs https://karlmaukskoepke.github.io/AlgebraMat/ docs/build-g`.
- **`CLAUDE.md`:** rules 8 to 10 (every build adds its items and walks them; every new card adds a "Play it like a student" item; no
  backfill) and rule 1 (reports open with "Open this first: the test-links page, Features to check section" and the item count).
- **`tests/testLinks.test.js`:** every item has exactly the promised parts, its link carries the card, level, seed and sign-in skip, and
  its words contain no file names, branch names or developer words.

## Where the site did not match what the brief said (or what a student might hit)
1. **x = −3 + 5 needs a second I'm stuck.** The brief's order is I'm stuck → Party/Battle → cross off → count → type x. On the site the
   first I'm stuck asks Party or Battle at the numbers; a right answer goes straight to "Now type x" with no counters. The counters and
   the cross-off come with a second I'm stuck (and then it asks Party or Battle again). The item says this. Not changed (Build F's
   own design, and Count it's engine is not ours to change).
2. **"Nice drawing!" on counters the student did not draw.** At that second I'm stuck the counters arrive drawn, and the words still
   say "Nice drawing! Party or Battle?" The sentence comes from Count it's walk, which we do not change. Worth a decision.
3. **Enter after I'm stuck presses I'm stuck again.** After clicking I'm stuck, a student who types −3 and presses Enter (instead of
   clicking Go) gets the next clue, and the second Enter fills in −8 over what they typed. This is by design (a focused action
   button keeps its own Enter) but a student will do it. The steps tell Karl to click Go.
4. **A half-cancel asks a question it has no box for.** After Add −5 the greyed screen asks "What value instead of −5 would have
   completely canceled the +8?" but only Undo is live; the same question comes back as the hint after Undo. It works, but the first
   asking has nowhere to answer.
5. **On Divide it, waiting with a blank fraction open** shows "Enter a unit fraction, like ⅕ or ½." and delays the I'm stuck flash
   (the note's redraw restarts the 10 seconds). By design (Build D-2), so the "ignore the screen" mistake comes first in both items.
6. **I'm stuck is greyed while a value is being checked.** A student who is lost at the check cannot ask for help there; the pop-up
   says what to do.

## Not verified
- **The live site itself.** This container cannot reach `karlmaukskoepke.github.io` (the proxy answers 403), so every walk ran on a
  local copy of the same code (the Vite dev server on this branch, which equals `main` apart from this build's page, data and
  tests). Run the command above against the live address once the deploy is done.

## Screenshots (this folder)
One end state per item, taken at 1366×768: `f-no-0-1-minus1`, `f-seesaw-beside-work-768` and `-614` (a 125% zoom of a 768-tall
window), `f-divide-hint-after-undo`, `f-seesaw-wrong-move`, `f-cross-off-one-pair` and `f-cross-off-at-x-alone`, the
`student-add-*` and `student-divide-*` pictures (one per mistake), and the page itself (`features-to-check-page`,
`features-to-check-page-ticked`).
