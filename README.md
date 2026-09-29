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

- `src/engine/`: pure logic, no DOM. `expr.js` (expression model), `generate.js` (seeded levels), `moves.js` (validators), `session.js` (one problem's steps as a reducer), `progress.js` (level unlocks, save code), `hints.js` (hints after 3 wrong tries), `groups.js` + `generateLasso.js` (Lasso problems).
- `src/view/`: DOM and SVG. `mat.js`, `controls.js`, `lassoMat.js` + `lassoLayout.js` (the Lasso Mat), `packmap.js` (home and level-complete panel), `codes.js` (save-code dialogs), `feedback.js` (every message, in one table), `layout.js` (counter geometry).
- `src/storage.js`: localStorage wrapper that falls back to memory.
- `src/play/`: one play adapter per pack (`flipitPlay.js`, `lassoPlay.js`); `main.js` runs whichever the pack uses.
- `src/packs/`: pack definitions (`flipit.js`; `index.js` has Lasso and lists every pack, including the Coming-soon ones).
- `tests/`: Vitest.

## Changelog

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
