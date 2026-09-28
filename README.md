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

- `src/engine/`: pure logic, no DOM. `expr.js` (expression model), `generate.js` (seeded levels), `moves.js` (validators), `session.js` (one problem's steps as a reducer), `progress.js` (level unlocks, save code).
- `src/view/`: DOM and SVG. `mat.js`, `controls.js`, `packmap.js` (home and level-complete panel), `codes.js` (save-code dialogs), `feedback.js` (every message, in one table), `layout.js` (counter geometry).
- `src/storage.js`: localStorage wrapper that falls back to memory.
- `src/packs/`: pack definitions (`flipit.js`; `index.js` lists every pack).
- `tests/`: Vitest.

## Changelog

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
- **Deferred:**
  - Hints after 3 wrong tries go to Step 7. Wrong tries are already counted per step (`session.tries`).
  - Flip and cancel animations go to Step 7. There's only a small shake and celebrate for now.
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
