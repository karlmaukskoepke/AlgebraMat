# The Mat

A practice site where students act out, by tapping, the modeling moves from Mr. Mauks's notes: rewrite subtraction as adding the opposite, draw ± counters, decide Party or Battle, cancel pairs, and answer. The full design is in [SPEC.md](SPEC.md).

**Live:** https://karlmaukskoepke.github.io/AlgebraMat/ (deploys from `main`)

## Develop

```sh
npm ci
npm run dev        # local dev server
npm test           # Vitest
BASE_PATH=/AlgebraMat/ npm run build   # production build for a sub-path
```

`BASE_PATH` sets Vite's `base`, so the site can later move to a sub-path of grafables.com by changing one line in `.github/workflows/ci-deploy.yml`.

Add `?seed=123` to the URL to replay a fixed problem set, and `?level=2` to open a level directly (locks are ignored). Together they let you project the same problems to a whole class.

## Layout

- `src/engine/`: pure logic, no DOM. `expr.js` (expression model), `generate.js` (seeded levels), `moves.js` (validators), `session.js` (one problem's steps as a reducer), `progress.js` (level unlocks, save code), `hints.js` + `lassoHints.js` (hints after 3 wrong tries), `groups.js` + `generateLasso.js` (Group It problems; files keep the old "lasso" name), `terms.js` + `termPieces.js` + `termMoves.js` + `termSession.js` + `termHints.js` + `generateTerms.js` (Boxes & Circles), `combine.js` + `generateCombine.js` + `integerFeedback.js` + `bigSession.js` + `bigHints.js` (Combine it, and Flip It's mixed level), `termGroups.js` + `generateTermGroups.js` (Groups of Terms), `termGroupMat.js` (its Mat), `termGroupSession.js` + `termGroupMoves.js` + `termGroupHints.js` (its steps), `distribute.js` + `generateDistribute.js` + `distributeSession.js` + `distributeMoves.js` + `distributeHints.js` + `distributeTyped.js` (Distribute, then combine: Rounds 1 to 3 chain Groups of Terms, Write it and Boxes & Circles; Rounds 4 and 5 are typed).
- `src/view/`: DOM and SVG. `mat.js`, `controls.js`, `lassoMat.js` + `lassoLayout.js` (the Group It Mat), `boxMat.js` + `boxLayout.js` + `boxPointer.js` + `boxControls.js` (the Boxes & Circles Mat, its drag and palette), `packmap.js` (home and level-complete panel), `codes.js` (save-code dialogs), `feedback.js` (every message, in one table), `layout.js` (counter geometry).
- `src/storage.js`: localStorage wrapper that falls back to memory.
- `src/play/`: one play adapter per pack (`flipitPlay.js`, `lassoPlay.js`); `main.js` runs whichever the pack uses.
- `src/packs/`: pack definitions (`flipit.js`; `index.js` has Lasso and lists every pack, including the Coming-soon ones).
- `SPEC.md`, `SPEC-LASSO.md`, `SPEC-BOXES.md`, `SPEC-ROADMAP.md`: the specs, and Karl's notes for the packs after Group It.
- `tests/`: Vitest.

## Changelog

### Groups of Terms: what a wrong answer says (SPEC-SCAFFOLD.md §15)
- **`2(4x + 1)` answered `8x + 1`:** the arrows appear above the problem ("2 distributes to both terms…") and the student answers again; a second wrong answer opens the groups.
- **`−3(2x − 1)` answered `−6x − 3`:** box and circle the x term and the number inside, then the arrows, then answer again.
- **`−(2x + 5)` answered `−2x + 5`:** write the hidden −1 first, then the arrows, then answer again.
- **`2(2x + 3)` answered `2x + 5`** (the 2 added as a term): straight to drawing the groups.
- I'm stuck shows the arrows; Teach me step-by-step opens the groups. Checked in a real browser at both Chromebook sizes and a phone (all four slips, then the full walk to the level panel); no page errors, every target at least 44px.

### Boxes & Circles: read the model; and the phone pass (SPEC-SCAFFOLD.md §14)
- **New Boxes & Circles Level 2: read the model.** A picture of columns of boxes, negative boxes and counters; type the expression it shows (any expression worth the same is right). A wrong answer says the key (a box is x, a box with a dash is −x…); a second one labels each column with what it's worth and **reads the model aloud**. The old Levels 2 to 5 are now Levels 3 to 6; **save codes are version 8**, and old codes and saves still work (the new level counts as done once the old Level 2 was).
- **Phones:** the problem comes out bigger (the drawing is cropped to what's in it), the prompt is smaller, the page uses the visible height and leaves 72px under the answer pad so the browser's bottom bar doesn't cover it, the header takes three lines instead of four, the palette's buttons go two to a row, and the pack map no longer runs off the right edge of the screen (one wide card was widening the column).
- **Checked** in a real browser: the model round (wrong, key, labels with the spoken text, right, all five problems, level panel); phone emulation at 390×664 and 360×600 on the pack map, the walks, light mode, the model round, the quiz screens; desktop at 1366×657 and 1280×610 again; no page errors, every target at least 44px.

### Boxes & Circles: light mode, the lasso, and a clearer x (SPEC-SCAFFOLD.md §13)
- **Boxes & Circles starts with typing the answer.** Two buttons are there any time: **Draw boxes & circles** (the Box & Circle step, then back to typing, the shapes kept) and **Rewrite subtractions** (tap the − in front and the number's sign, for as many subtractions as you like, then Done; a dashed line shows what's being flipped).
- **A wrong answer asks for boxes and circles first**, then you retype; only a **second** wrong answer opens the counters (Draw, Cancel, Answer). **Teach me step-by-step** is the whole walk at once.
- **`0x + 13` is no longer wrong:** it's right with a zero term left in, so it says take the zero term out and retype it. (Same on the other typing cards.)
- **`x − 8x` typed as `−8x`:** a lone x has an invisible 1, said once.
- **The x on the pad is labelled *variable*** and sits apart from the + and − (captioned *sign*), so it doesn't look like a times sign.
- **A real lasso:** press anywhere and drag; a dashed line follows (a box for x terms, a pill for numbers) and the terms it covers light up. The first time on a device, a pointer shows how.
- **Checked in a real browser at 1366×657 and 1280×610:** typing, the boxes-and-circles support with real drags, the rewrite support, the walk played to the level panel from Teach me, the lasso drag, the first-time demonstration, the tour on the Boxes Mat; no page errors, every target at least 44px.

### The Uber diagnostic and the fluency challenges (SPEC-SCAFFOLD.md §12)
- **Diagnostic:** a button across the top of the pack map. Twelve problems, two per card at an early and a later level, typed with no support, **nothing marked until the end**, *I don't know* to skip. Stopping part way saves the place on this device. The readout rates each card (Strong / Getting there / Start here) with every problem's typed answer and the right one, recommends a level, and **opens those levels**.
- **Fluency challenges:** the last item on four cards: Adding, Subtracting, Add & subtract, Multiplying, Big multiplying, and Everything. Sixty seconds, typed answers, a wrong answer flashes the right one and **pauses you for a moment** (time, not points). Every 5 correct makes the problems harder: bigger numbers; for multiplying, negative multipliers after 5, unit fractions after 10, other fractions after 15 (big multiplying: multipliers to 12, bigger denominators).
- **High scores** this month / this school year / all time, on this device for now.
- **Fix:** the pack map showed the word "null" at the bottom of the page.
- Checked in a real browser at 1366×657 and 1280×610: both flows end to end (fluency with a wrong answer and the clock running out; the diagnostic stopped and resumed, finished, levels opened on the map); no page errors, every target at least 44px.

### Karl's first round of play-test changes (SPEC-SCAFFOLD.md §11)
- **Combine it:** a sign mistake now gets *circle the numbers with their signs* first (the Boxes & Circles drag), then you type again; a second miss gets the sentence to finish, a third the full walk. **Party! and Battle! now sit on the Mat**, right under *Same signs?* and *Different signs?*.
- **Flip It:** any wrong answer on a subtraction goes straight to **rewriting it**: tap the minus to make it a plus, tap the number's sign to change it (this includes `3 − 8`). The rewritten line stays on the Mat, you try again, and only a second miss opens the counters.
- **Group It:** the − groups button says *opposite*; the wording is "positive groups, or opposite (negative) groups"; the hidden 1 is a dashed gap with an arrow labelled *how many groups?*; the fraction button reads *Add part of group*; two new fraction misconception messages (the whole group's number put in every part, with a bracket on the whole group; counting the parts left behind instead of the part taken); a sign mistake gets *"−1/2(−4) means ____"* with four choices.
- **Bigger fractions, with eighths:** thirds up to 18, fourths 24, fifths 30, sixths 24, eighths 24 (halves 16); a fraction bar can have eight parts.
- **Teach me step-by-step** on every card: the full walk at once.
- **Text on the Mat can't be selected** by dragging or double-clicking.
- **Streak fix:** *I'm stuck* and *Teach me* no longer reset the streak (my first build did; only a wrong typed answer breaks it).
- **Checked in a real browser at 1366×657 and 1280×610:** the circling drag, Party!/Battle! on the Mat (clicks and keys), the rewrite clicks and retry, the Group It cloze and both misconception messages, the hidden-1 label, text selection, every card's walk played through; no page errors, every target at least 44px.

### Light mode on every card, streaks, and keep practicing (SPEC-SCAFFOLD.md §10)
- **Light mode is now how nearly every level plays:** Flip It (all five levels), Combine it Levels 4–5, Group It, Boxes & Circles, Groups of Terms and Distribute, then combine Rounds 1–3. The student types the answer; a wrong answer or **I'm stuck** opens that card's full step-by-step walk on the same problem. (`?light=0` still plays everything the old way.)
- **Flip It's subtractions get the pilot's supports:** typing the numbers' sum with the minus kept (`5 − (−3) = 2`) is its own mistake signature, answered by the party-or-battle question after showing the subtraction as the addition it becomes; the walk starts at Rewrite.
- **Terms cards type with x, + and −.** The first time a card's pad brings those, a one-step spotlight tip points at them (once per device); the first-time tour names whichever pad is lit.
- **Every wrong answer on the new cards is logged with what it looked like** (uncombined, sign flipped, sign dropped, x or number off…), so the on-device log shows which targeted supports to build next.
- **Streaks:** problems in a row with no wrong typed answer (I'm stuck doesn't break it). The header shows *Streak n · Best m*; the best per card and level is kept on the device.
- **Keep practicing:** when a level's five are done, the panel says the next level is open and offers **Next level →**, **Keep practicing** and the pack map. Keep practicing plays fresh sets of the same level endlessly, with **Next level →** in the header the whole time.
- **Header:** the title is slightly smaller, the buttons never wrap their words, and a long title with the streak wraps to a second line instead of overflowing.
- **Checked in a real browser at 1366×657 and 1280×610:** every card's light mode (right answer, wrong answer into the walk, streak), every card's walk played to the level panel from I'm stuck (Boxes, Combine it 5, Groups of Terms, Distribute then combine, Group It), the tour and tip, practice mode; no page errors, every target at least 44px. One catch on the way: giving every problem a `level` made Combine it Level 5's walk start with Rewrite, so the level for the log now travels under its own name.

### Scaffold pilot step 6: light mode is on for Combine it Levels 1 to 3 (SPEC-SCAFFOLD.md §8.6) — the pilot is done
- **Students now get light mode on Combine it Levels 1, 2 and 3 by default:** type the answer; a wrong answer or **I'm stuck** brings in the party-or-battle question, the sign cloze (read aloud, with the leftover counters) or the full counters walk; the support that answers a mistake stays on and fades after three clean answers; the first light problem on a device opens with the spotlight tour; each finished problem goes in the anonymous on-device log.
- **`?light=0`** plays those three levels the old step-by-step way instead (handy for projecting the full walk to a class).
- **Final audit** in a real browser at 1366×657 (and the earlier 1280×610 runs): clicking Combine it Level 1 from the pack map opens light mode with the tour once; Skip is remembered; all three levels play through at both sizes; fading works; the old walk still works with `?light=0`; Boxes & Circles, Groups of Terms, Distribute, then combine (Rounds 3 and 5), Combine it Levels 4 and 5 and Flip It Level 5 all still play through. No page errors, every target at least 44px.
- **What the pilot built, in one place:** `engine/scaffold.js` (reading a wrong answer, the ladder, the cloze), `engine/lightSession.js` (light mode), `engine/skills.js` and `lightStore.js` (supports that stay on and fade, kept per device), `engine/eventlog.js` (the anonymous log), `engine/tour.js` and `view/tour.js` (the tour), `view/speech.js` (reading aloud).
- **Not done yet** (SPEC-JIT.md, in Karl's order): the diagnostic before each card's first round, skip-ahead levels with streaks, and the teacher report; and the same light mode for the other cards (Flip It, Boxes & Circles, Groups of Terms, Distribute, then combine), each needing its own mistake catalog entries.

### Pack map: level buttons fit their cards (fix)
- With six packs a card is about 400px wide, and once the real fonts (Lexend, Kalam) loaded, three levels to a row squeezed "Level 2" and "Level 3" out of their buttons and added a sideways scrollbar. Levels now go **two to a row** on the six-pack map, a button can shrink below its text without spilling over its neighbor, a long pack name wraps inside its card, and a level list never scrolls sideways.
- Checked in a real browser at 1300×820, 1366×657, 1280×610, 1100×800 and 900×900 with a wide stand-in font (the sandbox can't load Google Fonts): 35 buttons overflowed before at 1300 and 1100, none after.

### Scaffold pilot step 5: the spotlight tour (SPEC-SCAFFOLD.md §1b, §8.5)
- **The first light problem on a device opens with a guided tour.** The page dims and each real control lights up in turn with a yellow ring and a caption: the problem ("Here's what you're adding"), the pad ("± makes it negative"), Check, and **I'm stuck**. The I'm stuck step has no Next button: **the student has to press the real button** (or key S), so they have the memory of pressing it and meet the first support (the party-or-battle question). A last step points at the help ("That's the help. Answer its question, then type the answer yourself"), and Got it ends the tour.
- **While it runs, the rest of the page is held:** clicks on the dimmed page and typing do nothing, and Enter or a click can't skip past the required press. **Skip tour** (or Esc) leaves at any point. It lights up the actual controls, so it can't drift out of date.
- **Once per device** (`mat.tour.v1`), however it ends. A small **?** button in the palette replays it (it only points at I'm stuck; no required press), and going back to the pack map ends it.
- `engine/tour.js` is the pure state machine; `view/tour.js` is the overlay. Still behind `?light=1`. Real-browser run at 1280×610 and 1366×657: the five steps, typing and clicking away blocked, the real press, the flag saved, no tour after a reload, the ? replay, Skip; no page errors, every button at least 44px. 509 tests (7 new).

### Scaffold pilot step 4: supports that stay on and fade, and the anonymous log (SPEC-SCAFFOLD.md §5, §6, §8.4)
- **A mistake turns its support on for the next problems; three clean answers in a row turn it off.** A clean answer is right on the first try, never stuck. A wrong first answer starts the count again (for every support that was on), and being stuck without a wrong answer changes nothing. `engine/skills.js` holds the rules (pure); `lightStore.js` keeps `{ partyBattle, sign }` in this device's `localStorage` (`mat.skills.v1`), so a new device starts light.
- **Party-or-battle on:** the question comes first, before the student types. Stuck while it's up, or a wrong answer after it, goes to the full walk.
- **Sign on:** the typed answer is **read back in words as the student types** ("negative 6"), with an intro that says so. **Changed from the spec:** the cloze isn't what stays on, because shown before typing it would hand over the answer; the read-back makes the sign heard without giving anything away. The cloze is still the support right after a sign mistake.
- **The anonymous log:** one small record per finished problem in `localStorage` (`mat.events.v1`, newest 500, never sent anywhere): the problem, the wrong answers typed with the mistake each looked like (`unmatched` ones are where new patterns show up), the supports brought in, times stuck, whether it was clean, and which supports were on. Combine it Levels 1 to 3 problems now carry their level.
- Still behind `?light=1`. Real-browser run: a sign mistake turns the read-back on (3 → 2 → 1 → 0 with each clean answer, then plain light mode), a battle-as-party mistake makes the next problem start with the question. 502 tests (14 new).

### Scaffold pilot step 3: the sign cloze on the Mat (SPEC-SCAFFOLD.md §4, §8.3)
- **A sign mistake now gets the cloze** (a dropped or flipped sign in light mode): a sentence with a blank, "The battle of 2 and −4 leaves ____ standing." (or "The party of −4 and −6 has ____ in all."), and four buttons written with the words "negative" and "positive."
- **Every pick is read aloud** with the browser's built-in speech (offline, so fine on Chromebooks), the whole sentence with the pick in it, and only after the pick. A **Sound on / off** button turns it off; it's remembered on the device, and nothing breaks where speech isn't available.
- **A wrong pick** says what's off (the sign, or the sizes combined the wrong way) and is crossed out, with no penalty. **The right pick** fills in the sentence, **draws the leftover counters** (− in magenta, + in ink) and goes back to typing; the sentence and counters stay on the Mat while the student types the answer with its sign. **I'm stuck** inside the cloze goes to the full walk.
- Still behind `?light=1`. Real-browser runs of Levels 1 to 3 at 1280×610 and 1366×657 with a stubbed speech engine: wrong pick, right pick, the two sentences spoken, counters drawn, no page errors, every target at least 44px. 488 tests (3 new).

### Scaffold pilot step 2: light mode (SPEC-SCAFFOLD.md §2, §4, §8.2)
- **Light mode for Combine it Levels 1 to 3:** the student types the answer (Flip It's pad: ± and digits) and presses Check. Right on the first try is done and counts as a clean answer. A wrong answer, or **I'm stuck**, brings in a support; an empty or garbled answer is not a wrong try.
- **Supports so far:** the party-or-battle question (then back to typing), and the full walk (today's Draw → Party or Battle → Cancel → Answer on the same problem) as the last rung. A wrong answer after a support, or a second I'm stuck, goes to the full walk; an answer that matches no known mistake goes straight to it. The step strip shows the one step in light mode and "Party or Battle? → Answer" during the question. **The sign cloze isn't built yet** (the next step), so a sign mistake gets the party-or-battle question for now.
- **Behind a switch:** light mode opens with `?light=1` (for example `?pack=combineit&level=3&light=1`). Students still get today's walk by default until the pilot is finished.
- `engine/lightSession.js` is the pure reducer; it hands the full walk to Combine it's own session (now `engine/combineSession.js`). `play/lightPlay.js` shows both palettes in the footer, one at a time.
- Real-browser runs of Levels 1 to 3 (a wrong answer then the question, a wrong choice, I'm stuck, stuck twice into the full walk) at 1280×610 and 1366×657: no page errors, every target at least 44px. 12 new tests, 485 in all.

### Scaffold pilot step 1: signatures and the cloze (SPEC-SCAFFOLD.md §3, §4, §8.1)
- **Engine only, nothing on screen yet.** `engine/scaffold.js`: `classify(problem, typed)` reads what a student typed against a two-term Combine it problem and names the mistake behind a wrong answer (`sign-dropped`, `wrong-winner`, `battle-as-party`, `party-as-battle`, or `unmatched`; an empty or garbled answer is `unreadable` and isn't a mistake). `firstSupport`, `nextRung` and `skillOf` say which support answers which mistake (the sign cloze, the party-or-battle question, or the full walk) and which skill a mistake belongs to.
- **The cloze:** `buildCloze` writes the sentence ("The battle of −5 and 3 leaves ____ standing.") with four choices written as words ("negative 2", "positive 2", "negative 8", "positive 8"); the wrong ones are the sign and size mistakes. The order is steady for a problem and varies across problems. `spokenSentence` is what's read aloud after a choice, and `leftover` is what the Mat will draw.
- Tests cover every signature (including numbers that fit two) and check the cloze on every problem Levels 1 to 3 hand out: four different nonzero choices, the right one is the answer.
- The spec for the whole pilot (`SPEC-SCAFFOLD.md`, approved) and the notes behind it (`SPEC-JIT.md`) ride along in this PR.

### Combine it gets a mixed party-or-battle round (SPEC-COMBINE.md §12; first build of SPEC-JIT.md)
- **New Level 3, "party or battle?":** two-term problems where the student has to decide which it is. Every set has a battle a positive wins, a battle a negative wins, a party of negatives, a party of positives, and one of any kind (numbers 1 to 12, no repeated answers). It plays on the same steps as Levels 1 and 2 (Draw → Party or Battle → Cancel → Answer). Until now each of those levels was all one kind, so the choice never had to be made.
- **Combine it now has five levels:** the old Level 3 (three or more numbers) is Level 4 and the old Level 4 (big numbers) is Level 5.
- **Old progress carries over:** a save from before this (localStorage, or a v1–v6 code) is moved into the new places; the mixed round counts as done once the old Level 3 was. A level in play saved before this isn't resumed, since its number means something else now.
- **Save code v7:** `MAT-9` plus nine symbols (35 of about 39.6 bits). v1–v6 codes still work.

### Distribute, then combine step 5: the pack opens, save code v6 (SPEC-DISTRIBUTE.md §6, §7.5)
- **Distribute, then combine is open** on the pack map: five rounds, saved progress, each round opening the next. Six cards now, **three across and two rows** at the Chromebook sizes (the title takes a line of its own, the blurb is left out, and the cards stay equal-size with their levels scrolling). The page scrolls a little to reach the second row. The "Coming soon" section shows only when a pack is still being built, so it's gone for now.
- **Save code v6:** new codes are `MAT-8` plus eight symbols and carry all six packs (34 of about 34.7 bits, so the next pack needs a v7). v1 to v5 codes still work, and a v5 code brings Distribute back unfinished.
- All of Distribute, then combine is built: the model and generators, the two-phase Mat (Groups of Terms, Write it, Boxes & Circles), the invisible 1 and the subtracted group with the magenta note, and the typed Rounds 4 and 5 with hints and Show me.
- The roadmap's "refinements to circle back to" (a mixed party-or-battle round, just-in-time scaffolds, diagnostics, skip-ahead with streaks, teacher visibility) are next, and need a spec of their own.

### Distribute, then combine step 4: Rounds 4 and 5, the supports fade (SPEC-DISTRIBUTE.md §2, §5, §7.4)
- No drawing: **Open it** (type the line with every group opened, none combined) then **Answer** (type the combined result). `engine/distributeTyped.js` is its own small session; the Mat shows the problem, then each typed line under it.
- Help is a hint after 3 wrong tries on a step: **Open it** shows each group's number times each term inside (`−7 · (−3x) = 21x`), **Answer** shows each kind added up (`boxes: 6 − 1 = 5`). A hint shows the move and never makes it, and a new step starts a fresh count.
- **Round 4** adds a **Show me** button (key S) that asks for that same help early; **Round 5** has hints only and no button. Round 5 mixes in two loose terms, groups either side of a term, number-first insides and `B(Cx + D) − A`.
- Show me shows the worked products, not a drawing, because Round 4's numbers are too big to draw (up to 9 groups of 15 pieces). If we want a drawing later, it can open a smaller version of the same problem.
- The pack has all five rounds now, still opened from a link (`?pack=distribute-combine&level=4`) until step 5 adds the pack card and save code v6. Every generated Round 4 and 5 problem walks through in the tests, and in a real browser at 1280×610 and 1366×657 with every target at least 44px.

### Distribute, then combine step 3: Rounds 2 and 3, the invisible 1 and the subtracted group (SPEC-DISTRIBUTE.md §3, §4, §7.3)
- **Round 2** (`A + (Bx + C)`, `A − (Bx + C)`): the student writes the invisible 1 first (a positive single group hides its 1 too now, as `−(B)` did), then the Groups of Terms steps. A subtracted group is an opposite group, so Flip runs inside ①.
- **Round 3** (`A − B(Cx + D)`): the sign trap. The group is `−B` groups, flipped, then Write it asks for the line with the right signs (`5 − 4x + 6`); a wrong sign is named.
- **The magenta note:** once − groups is chosen, the group's Mat shows `subtract = add the opposite` with the `+ −2` underlined in magenta, and Write it shows it again. The problem is never forced into that form, so students can keep thinking of `5 − 7x` as a positive 5 and a negative 7x. The Write it hint adds the note too.
- Rounds 1 to 3 open from a link (`?pack=distribute-combine&level=3`). Every generated problem of Rounds 1 to 3 walks start to finish in the tests, and in a real browser at 1280×610 and 1366×657 with every target at least 44px.

### Distribute, then combine step 2: Round 1 plays, start to finish (SPEC-DISTRIBUTE.md §3, §7.2)
- `engine/distributeSession.js`: one session that runs Groups of Terms on the group (Groups → + or − → Fill → Flip → Answer → Check it), then **Write it** (the whole line with the group opened, in `engine/distributeMoves.js`: it says whether the line is already combined, a sign is off, terms are missing, or it's just off), then Boxes & Circles on that line (Box & Circle → Draw → Cancel → Answer). The step strip names the phase, **① distribute** or **② combine**.
- `play/distributePlay.js` hands each step to the pack that teaches it; both palettes live in the footer, one shown at a time (Next → at Check it goes on to Write it, not to the next problem). The group's Mat shows the whole problem on its left.
- Round 1 opens from a link only (`?pack=distribute-combine&level=1`); the pack is still a Coming-soon card, and a coming-soon pack takes no room in saved progress. Rounds 2 to 5, the pack card and save code v6 are steps 3 to 5.
- Real-browser run of all five Round 1 problems at 1280×610 and 1366×657: no page errors, every target at least 44px.

### The ± button on every integer answer pad
- Combine it Levels 3 and 4 and Flip It's mixed Level 5 now type negatives with the same ± button and digits as Combine it Levels 1 and 2 (Level 3 had x, + and − keys; Level 4 had a lone − after the digits). ± flips a leading minus on what's typed; the keyboard's − key presses it. Algebra problems keep x, + and −.
- A hidden pad key is now also disabled, so it can't catch a keyboard press.
- The roadmap lists the refinements Karl raised the same day (a mixed party/battle round, scaffolding on a wrong answer, diagnostics, skipping ahead with streaks).

### Distribute, then combine step 1: model and generators (SPEC-DISTRIBUTE.md §2, §7.1)
- `engine/distribute.js`: a problem is a list of parts (groups and loose terms) in written order. It writes the problem (`2(3x − 4) − x + 5`), opens the groups into Boxes & Circles terms with the sign on the operation and nothing to rewrite (`6x − 8 − x + 5`), and finds the answer (`5x − 3`). A subtracted group turns into an opposite count for Groups of Terms' arrows check.
- `engine/generateDistribute.js`: five rounds. Rounds 1 to 3 enumerate small problems (at most 20 pieces drawn, answers always have an x part and a number); rounds 4 and 5 sample larger ones with the seeded RNG (hidden 1s, leading minus, number-first insides, two loose terms, groups on both sides of a term). No repeated answers in a set.
- No UI yet: steps 2 to 5 add the Mat, the rounds, the pack card and save code v6.

### Combine it step 4: Level 4, big numbers with no counters (SPEC-COMBINE.md §6.4, §11)

- **Combine it is complete:** Level 4 has numbers from 11 to 60 and no counters. Circle each number with its sign in front, then say **Party or Battle**, **Add or Subtract**, the **Sign**, and type the answer. Your reasoning builds up above the problem as you go (`battle`, `subtract: 41 − 38`, `sign: +`).
- **Three-number problems** add a **Combine** step: tap the two with the same sign and type what they make, then battle the result against the other number.
- **Keys:** P and B for Party and Battle, A and S for Add and Subtract, + and − for the sign.

### Combine it step 3: Level 3, and Flip It's mixed Level 5 (SPEC-COMBINE.md §6.3, §10)

- **Combine it Level 3:** three or four numbers added, with counters in a column above each number: Draw, Cancel, then type the total. No party-or-battle question when there are several numbers.
- **Flip It Level 5:** three or four numbers, adding and subtracting: Rewrite every subtraction (tap the − and the number after it), then Draw, Cancel and Answer. If it's all addition, press **Nothing to rewrite**. Some problems come to zero (type 0).
- **Flip It now has five levels,** so finishing Level 5 is what completes it. Existing progress is kept.

### Combine it step 2: Levels 1 and 2, the pack card (SPEC-COMBINE.md §6.2, §9)

- **Combine it is open** as the first card on the pack map, with its first two levels: add a positive and a negative (battles), then negatives and negatives (parties). Draw the counters, say party or battle, cancel pairs, type the answer. There's no Rewrite step, and the answer sits under the problem.
- **Pack map:** five cards in one row on wide screens, equal size, with each card's levels in a scrolling list. Levels 3 and 4 of Combine it come next.
- **Fixed:** the dashed hover outline on Draw zones flickered near the corners.

### Combine it step 1: model, generators, save code v5 (SPEC-COMBINE.md §6.1, §8)

- **Engine only:** the problem model (`combine.js`), generators for Combine it's four levels and Flip It's mixed Level 5 (`generateCombine.js`), and save code v5.
- **Save code v5:** new codes are `MAT-7` plus seven symbols and have room for Flip It's fifth level and Combine it. v1 to v4 codes still work.
- **Not visible yet:** nothing changes on screen.

### Groups of Terms step 6: hints, animations, touch audit (SPEC-GROUPS-OF-TERMS.md §7.6, §14)

- **Hints after 3 wrong tries:** the group count, the + or − button, what one group is (and the next piece to pick, then Copy to all, with the groups that are off blinking), dealing a fraction, which parts to take, and, for the answer, the signs of the boxes and numbers (never the counts).
- **Small animations:** new pieces pop in; the flip and Check it's arrows were already animated. All off with reduced motion.
- **Touch targets** are at least 44px at 1366 × 657 and 1280 × 610 on every level.
- **Groups of Terms is finished.** Next: Combine it.

### Groups of Terms step 5: Answer, Check it, level flow, the pack card (SPEC-GROUPS-OF-TERMS.md §7.5, §13)

- **Groups of Terms is open** on the pack map: eight levels, saved progress, save code v4. The preview page `?demo=groupterms` is gone.
- **Answer:** type what the groups make on the pad or the keyboard (x, +, −, digits). **Check it** then draws the distributing arrows and the products, show-only; Check becomes **Next →**.
- **Pack map:** four cards in one row on a wide screen, level buttons two to a row, long lists scroll inside their card.

### Zone hover in Draw (Karl's request)

- **A dashed outline shows the zone under the mouse** in Boxes & Circles' Draw step (and will in Combine it), so students see where a tap will land. Mouse only; touch screens don't get it.

### Pack map: level names no longer clip

- **Fixed:** in the equal-size cards, a level button whose name wraps to two or three lines (Group It's "opposite of several groups") could be squeezed shorter than its text. The scrolling now happens in a plain wrapper around the level grid, and the grid's rows are always as tall as their text. Cards are still equal size, and the page still doesn't scroll on a Chromebook.

### Groups of Terms step 4: Take and Flip (SPEC-GROUPS-OF-TERMS.md §7.4, §12)

- **Fractions:** after dealing, tap the parts to take them (exactly the top number).
- **− groups flip:** tap a group's − (or Flip all) and the group is redrawn on the right with every piece turned to its opposite (magenta, no −). On a fraction bar, the one − flips the parts taken.
- **Still hidden:** the pack is a Coming-soon card, playable at `?pack=groups-of-terms&level=N` up to the answer, which comes next.

### Groups of Terms step 3: Groups, + or −, Fill (SPEC-GROUPS-OF-TERMS.md §7.3, §11)

- **Playable up to Fill** at `?pack=groups-of-terms&level=N`: make the groups (typing the hidden 1 for `−(B)`), choose + or − groups, then fill: pick a piece and tap a group, **Copy to all** (key K) for the rest, or, for fractions, deal one kind of piece at a time into the lit-up part.
- **Check** says which group is off and what each needs, without giving the answer.
- **Still hidden:** the pack stays a Coming-soon card; Flip, Take, Answer and Check it come next.

### Groups of Terms step 2: the static Mat (SPEC-GROUPS-OF-TERMS.md §7.2, §10)

- **Preview page at `?demo=groupterms`** draws the Mat in every state: filled ovals, the answer, the distributing arrows (Check it), − groups before and after the flip, a number-first challenge problem, fractions dealt and taken, and the most crowded problems. Nothing is playable yet.
- **Look:** Group It's ovals and fraction bar, with Boxes & Circles' pieces inside (green, then magenta when flipped).
- **Touch targets:** every oval, part and − is at least 49px on a Chromebook, even for the widest problems.

### Groups of Terms step 1: model, level generator, save code v4 (SPEC-GROUPS-OF-TERMS.md §7.1, §9)

- **Engine only:** `termGroups.js` (the problem, its answer, its pieces, and the distributing-arrow lines for Check it) and `generateTermGroups.js` (8 seeded levels, five problems each, no repeated answers, number-first on the two challenge levels).
- **Save code v4:** new codes are `MAT-6` plus six symbols and carry Flip It, Group It, Boxes & Circles and Groups of Terms (24 bits). v1, v2 and v3 codes still work.
- **Not visible yet:** Groups of Terms is still a Coming-soon card.

### Pack map: equal-size cards (SPEC-GROUPS-OF-TERMS.md §6)

- **Every pack card is the same size,** and the cards sit in one row on wide screens (one column per pack). A card with more levels than fit (three rows show) **scrolls inside the card**, so the page doesn't scroll on a Chromebook. Narrower screens use two columns (equal row heights), phones one column as before.

### Boxes & Circles step 6: hints, animations, touch audit (SPEC-BOXES.md §7.6, §14)

- **Hints after 3 wrong tries,** one per step: signs to flip wiggle, unfinished terms blink, dashed pieces show what to draw, a pair that cancels blinks, and leftover pieces blink with the signs named (never the counts).
- **Small animations:** pieces pop in, shapes fade in, slashes draw, signs flip. All off with reduced motion.
- **Touch targets** are at least 44px at 1366 × 657 and 1280 × 610. Columns of 7 or more pieces go three to a row, and the Mat crops to the room a problem needs.
- **Fixed:** Undo with a piece picked in Cancel now lets go of it.
- **Boxes & Circles is finished.** Next in the roadmap: Groups of Terms.

### Boxes & Circles step 5: Rewrite, level flow, the pack map (SPEC-BOXES.md §7.5, §13)

- **Boxes & Circles is open.** Third card on the pack map with five levels; finishing a level saves it and unlocks the next, and it's part of save codes (v3). Groups of Terms and Distribute, then combine are still Coming soon.
- **Rewrite on Levels 4–5:** flip the − and the sign in the parentheses of a `− (−7)` term (it turns magenta and says "is +7"), or press **Nothing to rewrite** (key N).
- **Pack map:** three packs side by side on wide screens, so it still fits without scrolling on a Chromebook.
- **Removed:** the `?demo=boxes` preview page.

### Boxes & Circles step 4: Draw, Cancel and Answer (SPEC-BOXES.md §7.4, §12)

- **A whole level plays through** at `?pack=boxes&level=N`: Box & Circle → Draw the boxes and counters above each term → Cancel pairs (either order) → type the answer.
- **Typing:** on-screen buttons for digits, x, + and −, or the keyboard (digits, x, +, −, Backspace, Enter).
- **Still hidden:** the pack stays a Coming-soon card with no saved progress until the Rewrite step and level flow (step 5).
- **Under the hood:** the shared keyboard handler now presses the first *enabled* matching button.

### Boxes & Circles step 3: Box & Circle (SPEC-BOXES.md §7.3)
- **Playable at `?pack=boxes&level=N`** (levels 1 to 5). The card on the pack map is still Coming soon. A correct Box & Circle moves on to Draw, which says it arrives in the next build.
- **Box and Circle tools** (keys B and C), with **drag-to-select**: press on a term, drag across the operation and the number, and the parts light up yellow while the pointer is still down; letting go draws the shape. Works with mouse, touch and pen. A tap shapes one part (dashed until the sign is included), and tapping a finished shape removes it. A new shape replaces any it overlaps, so fixing a dashed one is a single drag.
- **Check** says what's wrong, most specific first: a shape over two terms, the wrong shape for the term, a shape missing the sign (or the number), then what's missing. Order of boxing and circling is up to the student.
- **Keyboard:** palette buttons can name their quick key with `data-key`, and the shared key handler presses them (B, C, Backspace for Undo, Enter for Check).
- **New files:** `engine/termMoves.js` (the rules), `engine/termSession.js` (the reducer), `view/boxControls.js` (palette), `view/boxPointer.js` (the drag), `view/termFeedback.js` (messages), `play/boxPlay.js` (the adapter).
- **Judgment calls:**
  - Rewrite for Levels 4–5 waits for step 5, so those levels work as written for now.
  - A press in the gap between terms picks the nearest part, so a slightly-off press still lands.
  - `?demo=boxes` stays until the pack is playable.
- **Verified:**
  - 265 tests, including a check that every problem the levels make can be solved by drawing one right shape per term, and that every message key the engine can produce has wording.
  - In a real browser on all five levels: a mouse drag shows the live highlight while the button is down and draws a finished shape on release; touch dragging works the same and doesn't scroll the page; a tap shapes one part (dashed); a drag fixes it; tapping a shape removes it; Backspace undoes; two terms in one shape, wrong shapes and missing shapes each get their own message; B, C and Enter work.
  - The Flip It, Group It, hints, save-code and keyboard flows still pass, and the touch audit is clean at 1366×657 and 1280×610.

### Boxes & Circles step 2: the static Mat (SPEC-BOXES.md §7.2)
- **Preview page at `?demo=boxes`** draws the Mat in every state, using the notes' two examples: shapes done, a dashed unfinished shape (the − left out), the live drag highlight, Draw with the mystery-box key, one piece picked to cancel, canceled and answered, the answer being typed, the rewritten `− (−7)` with its magenta "is +7", and the most crowded problem the levels can make. Nothing is playable yet.
- **Matches the notes:** rounded boxes around x terms, pills around numbers (each with the operation inside), pieces two to a row above their term (an odd one alone at the bottom), boxes `□` and negative boxes `−□`, vermillion slashes, magenta for the rewritten term.
- **Layout (`view/boxLayout.js`)** is pure and tested: columns that fit every problem the generator can make, tap targets of at least 46 wide, and the drag-to-parts math for step 3. **Pieces (`engine/termPieces.js`)** are what each term draws and how pairs cancel.
- **Judgment calls:**
  - Gaps between columns close up when a problem is wide, rather than shrinking the text.
  - The width estimates for text are generous, so a fallback font still fits inside its shape.
  - The preview is temporary, and goes when the pack is playable.
- **Verified:**
  - 241 tests, including layout rules checked against 200 generated problems (every one fits the drawing, no tap targets overlap, columns clear the shapes) and a check that canceling everything always leaves exactly the answer.
  - In the browser: all 9 preview states render with no errors, and the real text always sits inside its shape.
  - The Flip It, Group It, save-code and keyboard flows still pass, and the touch audit is clean.

### Boxes & Circles step 1: term model, level generator, save code v3 (SPEC-BOXES.md §7.1)
- **Term model (`engine/terms.js`):** a term is its operation plus a signed number, so `− 4x`, `+ x` and `− (−7)` are all different and all worth something definite. It can say what a term is worth, how many pieces to draw (and of which sign), what an expression comes to, how to write it the way the notes do, and what the tappable parts of each term are (operation and number, for the drag selection in step 3).
- **Typed answers:** `parseAnswer` reads `2x + 2`, `2+2x`, `−3x+2`, `x`, `1x` and `-x`, and can tell when an answer is not fully combined.
- **Level generator (`engine/generateTerms.js`):** five levels as in the spec, five problems each, seeded, no repeated answers, interleaved variable terms and numbers, and the mix rules (e.g. Level 3 always has a negative x term and at least two bare x's). Only one problem per set can have a kind that vanishes.
- **Save code v3:** new codes are `MAT-5` plus five symbols and carry Flip It, Group It and Boxes & Circles (16 of about 19.8 bits). v1 and v2 codes still work.
- **Not visible yet:** Boxes & Circles is still a Coming-soon card. This step is engine only.
- **Verified:**
  - 223 tests, including:
    - 150 seeds on every level for the generator rules
    - all 65,536 three-pack progress states round-trip through v3 codes
    - every single-letter typo and neighbor swap is rejected
    - every v2 state still decodes
  - In the browser: the save-code dialogs show and accept `MAT-5…` codes, the old `MAT-3238` still restores, and the Flip It, Group It and keyboard flows still pass.

### Group It: redraw on flip, typed hidden 1, keyboard (SPEC-LASSO.md §12)
- **Flip redraws the group.** Tapping a − (or Flip all) leaves the original group and draws an arrow to a copy on the right with the counters flipped and no −. The count comes after that. Fractions do the same with the parts taken, drawn as a new bar.
- **The hidden 1 is typed.** In −(B) problems an arrow points at the gap, and students type the number 1 and check it. Tapping the gap no longer works.
- **Keyboard:** number keys and the number pad, Backspace, − for the sign, and Enter to Check (or go Next). It works in Flip It too, and is ignored in dialogs and text boxes.
- **Judgment calls:**
  - The drawing widens for − groups so everything fits, and the Mat scales down about 8%.
  - Counters close up slightly in wide groups.
  - Flip All is still there.
- **Verified:**
  - 171 tests.
  - Playwright:
    - all 7 levels, alternating the keyboard and the pad, with the redraw checked after each flip
    - the typed 1 (nothing typed, wrong number, right number, arrow gone)
    - keyboard entry in Flip It, ignored behind a dialog, and Enter on Packs still working
    - the Flip It, save-code, hint and pack-map flows
  - The touch audit is clean at 1366×657 and 1280×610.

### Group It step 6: hints, flip animation, pack map fits a Chromebook (SPEC-LASSO.md §11)
- **Hints** after 3 wrong tries on a step (new `engine/lassoHints.js`). They show the move without making it:
  - Groups: the number to make, with Add group pulsing. Extra groups blink so they can be tapped away, and the gap for the hidden 1 pulses.
  - + or −: the right button pulses.
  - Fill: the unfinished groups blink, and the right counter button pulses.
  - Take: the first n groups blink as an example.
  - Count: the groups to count blink, and the hint gives the answer's sign, not the number.
- **Flip animation:** a group's counters turn over like a card when its − is tapped, and the arrow draws in. Flip all turns them all. Both are off under reduced motion.
- **Pack map fits without scrolling** at 1366×657 and 1280×610: a smaller title, tighter cards, Group It's levels three to a row, and the Coming-soon row on one line. Tall screens keep the big layout.
- **Verified:**
  - 165 tests, including the new `lassoHints.test.js`.
  - Playwright:
    - each hint appears on the 3rd wrong try (not the 2nd) and clears on the next step
    - the flip animation plays on the tapped group only, then on the rest with Flip all
    - all 7 Group It levels at both Chromebook sizes
    - the Flip It, save-code, hint and pack-map flows
  - The touch audit is clean at 1366×657 and 1280×610, including the pack map. That was the audit's last failure.
- **Group It's build order (SPEC-LASSO.md §8) is complete.** Boxes & Circles needs a spec from Karl.

### Group It: Karl's fixes (SPEC-LASSO.md §10)
- **Renamed Lasso to "Group It".** "Lasso" is gone from the screens: the button is "Add group", and every message says "group".
- **Bigger instructions** in both packs (30px semi-bold).
- **Whole numbers: Groups → + or − → Fill → Flip → Count.**
  - Fill any group, in any order, one tap per counter.
  - − groups carry a magenta − each. Tap a − (or Flip all) to flip that group, with an arrow into it.
  - Count once, after the flip.
- **Fractions: Groups → + or − → Fill → Take → Flip → Count.**
  - d groups joined in one fraction bar.
  - Deal B one at a time into the lit-up group, top to bottom and around.
  - Take n, flip the taken groups with the bar's −, then count.
- Removed the `?demo=lasso` preview. `?pack=groupit&level=N` opens a level.
- **Verified:** 158 tests (the Group It engine tests were rewritten for the new flow). Playwright:
  - all 7 levels played through at 1366×657 and 1280×610, including out-of-order filling, dealing out of turn, and flipping one group then Flip all
  - no tap target under 44px on the play screens
  - Flip It, save-code and hint flows still pass
  - no horizontal scroll on a phone
- **Known:** the pack map now scrolls on a Chromebook. Step 6's touch audit will look at compacting it.

### Lasso step 5: Lasso on the pack map (SPEC-LASSO.md §8.5)
- **Lasso is open from the start** on the pack map, with its 7 levels, dots and unlocks.
- **Every card has a subtitle naming the math**, e.g. Flip It: "Subtraction with negative numbers"; Lasso: "The meaning of multiplication as groups and opposites".
- **Coming-soon row:** Boxes & Circles, Groups of Terms, and Distribute, then combine, as dashed cards with their subtitles.
- **Saving:** a Lasso level in play resumes after a reload. Lasso progress is in save codes (v2).
- **Messages:** finishing Flip It now says "Next up: Lasso, on the pack map." Finishing Lasso says Boxes & Circles is coming soon.
- `?pack=lasso&level=N` still opens any Lasso level directly.
- **Verified:** 158 tests, including a new `packs.test.js`. Playwright:
  - pack map order and subtitles
  - Lasso Level 1 played from the map, reload mid-level resumes on problem 3, Level 2 unlocks
  - save code round trip
  - the Flip It, save-code, hint and Lasso Level 1–7 flows all pass again
  - no horizontal scroll at phone width, no buttons under 44px at 1280×610

### Lasso step 4: fraction moves, playable (SPEC-LASSO.md §8.4)
- **Engine:**
  - `lassoMoves.js` adds validators for Whole (B in one lasso), Split (d parts, every counter dealt, all equal), Take (exactly n), and opp. / No opposite (No opposite passes only when A > 0).
  - `lassoSession.js` runs the fraction script (Whole → Split → Take → Count → Opposite) alongside the whole-number one.
  - Tested with walkthroughs of `2/3(−6)` and `−1/4(−12)`, including undoing deals, unequal parts, leftover counters, too few or too many parts, the wrong take count, and the wrong opp. / No opposite choice.
- **UI:**
  - Tap the green whole lasso to draw.
  - **Add part** makes blue parts. Tapping a part deals one counter into it during Split, and toggles it taken during Take (the blue bracket appears).
  - Then Count, and **opp.** or **No opposite**.
  - The palette swaps **Add part** / **No opposite** in for fraction problems.
- **Levels 4–7 are playable** at `?pack=lasso&level=4` through `7`. The pack map still says Lasso is coming soon (step 5 opens it).
- **Fixed:** finishing Level 7 before the other levels said "More Lasso levels are coming soon". It now says it's the last level and to finish the others.
- **Verified:**
  - 153 unit tests.
  - A Playwright run played Lasso Levels 4–7 (20 problems). On the first problem of each level it made every wrong move: an extra counter (or the 12-counter cap), no parts, a partial deal, dealing with nothing left, taking none, a wrong count, and the wrong opp. choice.
  - Re-ran Lasso Levels 1–3 and all Flip It runs (four levels, save codes, hints, touch audit). No page errors.
- **Judgment calls** (also in SPEC-LASSO.md §3b):
  - Undo scope in Split (deals and parts only, not the checked whole).
  - Up to 7 parts.
  - Take toggles.
  - The fraction-specific count message.
  - Every fraction problem asks opp. or No opposite.

### Lasso step 3: whole-number moves, playable (SPEC-LASSO.md §8.3)
- **Engine:**
  - `engine/lassoMoves.js` validates each move: Groups (the hidden 1, |A| lassos), + or −, Fill (each lasso holds B), Count (the total before any opposite), and Opposite (the answer after flipping).
  - `engine/lassoSession.js` is a pure reducer through Groups → + or − → Fill → Count → Opposite.
  - Tested move by move and with full walkthroughs of `3(−2)`, `−2(−4)` and `−(−5)` from the notes, including Undo, copy-before-ready, the caps, and moves outside their step.
- **Play adapters (refactor):** the play screen used to be Flip It-only. Now each pack supplies an adapter, and `main.js` runs whichever the pack uses:
  - `play/flipitPlay.js` and `play/lassoPlay.js`
  - each adapter provides the step labels, session, Mat, controls, messages and tap handling
  - the step bar is built from the adapter's labels
  - the palette is rebuilt when the pack changes

  Flip It behaves exactly as before: the four-level playthrough, saving and codes, hints, and the touch audit all pass.
- **UI:**
  - `view/lassoControls.js`: **Add lasso**, **+ groups / − groups**, the + / − palette with **Undo**, **opp.**, **Check**, and the pad.
  - The Lasso Mat makes the hidden 1 a dashed **1?** slot and makes lassos tappable. While counting it shows `→ ?`, and after **opp.** it shows `opp. → ?`, as the number is typed.
  - `view/lassoFeedback.js` holds every Lasso message, with a test that every key has wording.
- **Where to play it:** `?pack=lasso&level=1` (or 2 or 3). The pack map still says Lasso is coming soon. After Level 3, the panel says more levels are coming.
- **Verified:**
  - 145 unit tests.
  - A Playwright run played Lasso Levels 1–3 (15 problems) from the URL. On the first problem of each level it made every wrong move: too few lassos, the wrong group sign, copying too early, an extra counter undone, and a wrong count. It also checked the hidden 1 must be written before a lasso, and that Check and the pad wait for **opp.** No page errors.
  - The Flip It regression runs all pass.
- **Judgment calls** (also in SPEC-LASSO.md §3):
  - Copying waits until the first group is right.
  - Undo takes back the latest counter or copy.
  - Check and the pad stay dimmed until **opp.** is tapped.
  - At most 6 lassos and 12 counters per lasso.
- **Not yet:**
  - Fraction problems (step 4).
  - Opening the Lasso card and saving Lasso progress in the level flow (step 5).
  - Hints, animations and the touch audit for Lasso (step 6).

### Lasso step 2: the static Lasso Mat (SPEC-LASSO.md §8.2)
- **`view/lassoMat.js`** draws both step scripts from a view state (the same state the moves will drive in steps 3–4):
  - **Whole-number groups:** a stack of green lassos with green counters. Opposite groups get a magenta minus in front. After flipping, the counters turn to their opposites in magenta. The arrow chain reads **→ −8**, then a magenta **opp.** arrow to **8**.
  - **Fraction groups:** the whole group (green) in the left column; the split parts (blue) stacked on the right; a blue **take n** bracket beside the taken parts, with parts not taken faded; then the same arrow chain.
  - **The left column:** the problem in meaning colors (magenta minus, blue group count or stacked fraction, green inside), what it means in words as in the notes ("opposite of 2 groups of −4", "2/3 of a group of −6"), and the final line in Kalam. The hidden 1 shows as a written blue 1.
- **`view/lassoLayout.js`:** tested geometry. The biggest cases fit the drawing: 5 lassos, the widest lasso (8), sixths, halves of 12, and the full arrow chain.
- **Preview:** `?demo=lasso` shows 7 hard-coded problems: `3(−2)`, `−2(−4)`, `−(−5)`, `−3(4)`, `2/3(−6)`, `−1/4(−12)` mid-split, and `−3/5(10)`. It's loaded only on that URL; the pack map still says Lasso is coming soon.
- **Verified:**
  - 131 unit tests.
  - Screenshots of all 7 previews, compared against the notes.
  - Re-ran Flip It's storage/save-code run and the four-level playthrough. No page errors.
- **Judgment calls** (also in SPEC-LASSO.md §2):
  - The two-column layout (the one-column paper layout would shrink the lassos below 44px).
  - Magenta underlines are for words only; a lone magenta minus isn't underlined because it would read as "=".
  - Parts that aren't taken fade.
  - Arrows are drawn shapes, not font characters.
  - The preview lives at `?demo=lasso`.

### Lasso step 1: engine, 7-level generator, save code v2 (SPEC-LASSO.md §8.1)
- **`engine/groups.js`:** the group-problem model for A(B), meaning A groups of B.
  - A is a sign plus a fraction n/d (d = 1 for whole numbers), with a `hidden1` flag for problems written −(B).
  - B is a term (`{ kind: 'int', value }`), which leaves room for variable terms in Groups of Terms.
  - It computes the lasso count, the part size, the total before any opposite (the notes' "→ −8"), and the answer.
  - It formats problems as `3(−2)`, `−(−5)`, `−1(−5)`, `2/3(−6)`.
  - Tested against every worked example in the notes.
- **`engine/generateLasso.js`:** seeded 5-problem sets for all 7 levels, within SPEC-LASSO.md §4's limits.
  - Flip It's set-picking code moved into a shared `pickSet` in `generate.js`, so both packs follow the same rules: seeded, no repeated answers, required mixes.
  - Flip It's sets are unchanged, and old `?seed=` links give the same problems.
- **Save code v2:** `MAT-` plus 5 symbols (version, 3 data symbols, checksum) covers Flip It's 4 levels and Lasso's 7, with 3 bits to spare.
  - New codes start `MAT-4…`.
  - v1 codes (`MAT-3…`) still decode.
  - Tested: round-trips all 2,048 two-pack states, rejects every single-letter typo and swap of two neighboring letters, rejects unknown versions, and restores the real v1 code `MAT-3238` both in the tests and in the browser.
- **Progress:** Lasso's 7 levels are now counted in progress and in codes, and progress saved before Lasso still loads. The Lasso card stays "Coming soon" until step 5.
- **Verified:**
  - 124 unit tests.
  - Re-ran the Flip It browser runs: storage and save codes (now 5 letters, plus an old v1 code), the four-level playthrough, the hints, and the touch audit at 1366×657 and 1280×610.
  - All clean, no page errors.
- **Judgment calls** (also in SPEC-LASSO.md §4 and §6):
  - Level 2's single lasso holds up to 8 counters.
  - Fractions are in lowest terms only.
  - Every level mixes the sign of B.
  - Levels 1–2 lean toward totals of 10 or less.
  - The level number is mixed into the seed so paired levels don't mirror each other.
  - New codes are always v2.
- **Nothing visible changes for students yet,** except that save codes are one letter longer.

### Step 7: polish (SPEC §9 step 7). This completes the v1 build order.
- **Hints after 3 wrong tries** (`engine/hints.js`, pure and tested). The hint shows on a second line and never makes the move:
  - **Rewrite:** the unflipped pieces demonstrate a flip. On an addition problem, **Nothing to rewrite** pulses.
  - **Draw:** ghost counters show exactly what goes where.
  - **Party or Battle:** both signed numbers pulse, and the hint says same or different signs.
  - **Cancel:** one valid pair blinks.
  - **Answer:** the surviving counters blink, and the hint names their sign.
- **Animations:** a flipped piece turns over like a card, and cancel slashes draw themselves in. Canceled counters fade so the survivors are easy to count. Everything turns off when the device asks for reduced motion.
- **Touch-target audit:** an automated Playwright check measures every enabled button, input and Mat target at every step, plus the pack map and both dialogs. It runs at 1366×768, 1280×720, and the sizes a Chromebook's browser window actually shows: **1366×657** and **1280×610**.
  - **Found:** at 1366×657, counters were 37px, below 44. The Mat was capped by a fixed CSS guess at the height of everything else on the screen.
  - **Fixed:**
    - The play screen now fits the window exactly, and the Mat fills whatever height is left.
    - The Mat's drawing area drops an unused strip along its top edge.
    - Spacing tightens on short screens.
  - **Result:** everything is 44px or more at all four sizes (counters are 55px at 1366×657 even with a hint showing), with no scrolling.
- **Bug found and fixed during verification:** the flip animation never played, because the code compared problem objects by identity and every move makes a fresh copy of the state.
- **Verified:**
  - 93 unit tests.
  - A Playwright hint run checked each hint appears on the 3rd wrong try (not the 2nd), points at the right pieces, clears when the step changes, and leaves the problem solvable. It also checked both animations fire and that reduced motion turns them off.
  - The touch audit is clean at all four sizes.
  - Re-ran the Step 5 four-level run and the Step 6 storage/save-code run. No page errors.
- **Judgment calls** (also in SPEC §3 and §5):
  - The Answer hint names the sign that survived but not the count.
  - Canceled counters fade to 45%.
  - Hints use a second line instead of replacing the feedback message.
- **Known limit:** on phones, Mat counters are smaller than 44px because the Mat is sized by screen width. Phones aren't a v1 target.

### Step 6: saving progress and the save code (SPEC §7)
- **Storage:** `src/storage.js` wraps localStorage under the one key `mat.v1`. Every read and write is in try/catch. If storage is missing, throws, is corrupt, or hits a quota error partway through, the site keeps working from memory, and the home screen shows a quiet note.
- **Resume:** the level in play (pack, level, seed, problem number) is saved alongside progress. A reload brings the student back to the same problem in the same set of 5.
- **Save code:** `engine/progress.js` has `encodeProgress` and `decodeProgress`. Codes look like `MAT-3238`: a version symbol, two data symbols, and a checksum, using 31 symbols with no 0/O/1/I/L.
  - **Save code** (home and play header) shows the code large.
  - **Enter code** (home) takes a code, forgiving case, spaces and dashes. A bad code shows "That code doesn't look right — check each letter."
- **Verified:**
  - 85 unit tests. They include a round trip for all 16 progress states, rejection of every single-letter typo and every swap of two neighboring letters, junk input, and storage that throws, is missing, is corrupt, or runs out of room.
  - A Playwright run covered:
    - Reloading mid-level lands on the same problem.
    - A finished level survives a reload.
    - Save code shows a code.
    - On a fresh browser, a typo gets the exact error message, and the correct code typed in lowercase restores the levels and survives a reload.
    - With localStorage blocked by the browser, play still works and the note shows.
    - With corrupt saved data, the home screen loads fresh.
  - Re-ran the Step 5 four-level run. No page errors.
- **Judgment calls** (also in SPEC §7):
  - The prefix is `MAT`, not the example's `FLP`, because one code covers all packs.
  - Base 31, not base 32: removing the five look-alikes leaves 31 symbols.
  - Enter code merges with this device's progress instead of replacing it, so an old code can't erase anything.
  - A reload resumes the current problem from its first step. Steps inside a problem aren't saved.
  - Leaving with **← Packs** forgets the level in play.

### Step 5: level flow, unlocks, pack map (SPEC §6)
- **Engine:** `engine/progress.js` holds the progress object from SPEC §7 (`{ v: 1, packs: { flipit: { levels: [...] } } }`).
  - It covers: Level 1 always open, finishing a level unlocks the next, finishing Level 4 completes the pack, replays keep a level finished.
  - Tested.
- **Packs:** `packs/flipit.js` (title, level names, generator) and `packs/index.js` (the pack list, with Lasso as a "Coming soon" card).
- **UI:**
  - The pack map is now the home screen. The Flip It card has level dots and four level buttons; locked levels are dimmed. The Lasso card is dashed and says "Coming soon".
  - Play shows "FLIP IT · Level N" with per-problem dots.
  - After the 5th problem, a level-complete panel offers **Level N+1 →** or **Pack map**.
  - **← Packs** works.
  - After Level 4 the card shows **Complete ✓**.
- **Verified:**
  - 72 unit tests.
  - A Playwright run started from the pack map. It checked that locked levels can't be opened and that leaving Level 1 early doesn't count it. Then it played all four levels in a row (20 problems, read off the screen and solved by tapping), checked each unlock and the panel text, confirmed the pack showed Complete ✓ at the end, and confirmed that a `?level=3&seed=7` link gives the same set twice. No page errors.
  - Also checked at phone width.
- **Judgment calls** (also in SPEC §6):
  - The SPEC could be read as showing Lasso only after Level 4. I show it always, locked, and mention it on the final panel.
  - Levels are chosen from buttons on the pack card, with no separate level screen.
  - Leaving mid-level forgets that level's set without penalty.
  - `?level=N` ignores locks, for projecting.
  - I shortened Level 4's name on the card to "mixed, some addition".
- **Not yet** (done in Step 6): progress lived in memory only.

### Step 4: the five moves (SPEC §5)
- **Engine:**
  - `moves.js` holds a validator for each move, returning `{ ok, feedbackKey }`.
  - `session.js` is a pure reducer that walks one problem through Rewrite → Draw → Party/Battle → Cancel → Answer.
  - It is tested move by move, plus full walk-throughs (Battle, Party, addition).
- **UI:**
  - Rewrite: the operation and the number's sign are tapped on the student's line. Each tap target has a dashed box.
  - Draw: zones are tappable (dashed box). The palette's + / − toggles which counter is added. Tapping a counter removes it.
  - Party / Battle: two buttons.
  - Cancel: tap a counter to select it, then tap its partner.
  - Answer: an on-screen pad with ± and a delete key.
  - Only the current step's controls are enabled.
- **Verified:**
  - 66 unit tests.
  - A Playwright run tapped through a full Level 4 set (2 Battles, 2 Parties, 1 addition). It checked every wrong-move message on the way: one flip, "Nothing to rewrite" on a subtraction, flipping on an addition, drawing before picking a sign, a wrong count, the wrong Party/Battle choice, a same-sign pair, an empty answer, and a wrong answer.
- **Judgment calls** (also noted in SPEC §5):
  - Flipping happens on the Kalam line; the printed problem never changes.
  - On an addition problem, tapping a sign flips nothing. It shows "It's already addition — nothing to rewrite."
  - Draw fills rows of 4 in reading order, then tidies to the balanced grid after Check (Karl's choice).
  - During Cancel, a same-sign second tap shakes, and the first counter stays selected.
  - The answer goes after `=` on the Kalam line. The next problem loads after 2.5 s, or on **Next →**.
  - Added the `?seed=` URL option.
- **Deferred** (done in Step 7): hints after 3 wrong tries, and the flip and cancel animations.
- **Temporary** (replaced in Step 5): the page played endless Level 4 sets.

### Step 3: static Mat
- `view/mat.js` draws the Mat as inline SVG:
  - stroked counters with round caps, 22 px, in 44 px cells
  - magenta with an underline for flipped pieces
  - vermillion slashes for canceled counters
  - Lexend for the problem, Kalam for the student's line
- Counters use a balanced grid, at most 4 across (Karl's choice): 6 = 3 × 2, 7 = 4 + 3, 12 = 4 × 3.
- Counters sit above the original problem line, as in the SPEC. Karl confirmed this.

### Step 2: engine
- `expr.js` and `generate.js`, with the generator rules Karl chose (SPEC §6):
  - no repeated answers in a set of 5
  - Level 2 mixes positive and negative answers
  - Level 3 mixes Party and Battle
  - Levels 1–2 lean toward numbers 1–6
- Fixed a SPEC error: Level 2 (negative − negative) is always a Battle.

### Step 1: scaffold
- Vite + Vitest.
- A GitHub Actions workflow that tests every push and PR and deploys `main` to Pages.
- The graph-paper background.
