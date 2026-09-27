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

Add `?seed=123` to the URL to replay a fixed problem set, for example to project the same problems to a whole class.

## Layout

- `src/engine/`: pure logic, no DOM. `expr.js` (expression model), `generate.js` (seeded levels), `moves.js` (validators), `session.js` (one problem's steps as a reducer).
- `src/view/`: DOM and SVG. `mat.js`, `controls.js`, `feedback.js` (every message, in one table), `layout.js` (counter geometry).
- `tests/`: Vitest.

## Changelog

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
  - 70+ unit tests.
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
- **Temporary:** the page plays endless Level 4 sets. Level flow, unlocks and the pack map are Step 5.

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
