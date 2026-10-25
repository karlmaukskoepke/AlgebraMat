# Build T report: help in the screen's own words, a stacked x-term Add, fixes from Karl's testing (2026-10-25)

Everything is on `main` and live, with no flags, pushed a Part at a time after the unit tests (1711 pass, including the real-browser
sweep of every card: redraws, drags, the text size) and `npm run parity` (problems, save codes, class-sheet records and the 25 scripted
runs unchanged; 3 recorded screens differ, each listed under "Build T" in `tests/parity/INTENDED-CHANGES.md`). Loop spec: rev 2.8.
Features to check (all 128 items walked on the live site, every one passes): 13 new items, 31 earlier ones updated (the check’s parentheses, the new Undo, the stacked Add, and the fraction-bar mistake on five Play it like a student items), walked on the live site
(`node tests/features/walk.mjs https://karlmaukskoepke.github.io/AlgebraMat/ docs/build-t`).

## Part 1: three small fixes

- **The check writes products with parentheses**, every card, every line: `7(3)`, `−3(−4)`, `4 − 3(5)`, `3(7 + 2) + 2(7)`. The value
  stays blue and right under its x. Loop spec §4's test cases now read `3(−4) = −12`, `−3(−4) = 12`, `12 = −(−12)`, `7 = 4 + 3`.
  Not changed: the move rows that multiply both sides (Flip's `−1 × (−x)`, the fraction option's `⅓ × (15)`) and Divide it's
  numbers-only walkthrough (`3 × 4 = 2 × 6`): they are moves, not the check (see the decision below).
- **Flip's red stroke** now goes through the middle of each minus. Measured on screen: it used to sit about 3 px (at 32 px) below the
  bar, reaching 11 px below it and 3 px above (a T); now it reaches as far above as below, within 1 to 1.5 px, for the Flip button,
  dividing by −1 and dividing by −3, at 1366×768, 1366×650 and browser zoom 125%, and with reduced motion. The walk measures it.
- **A refused drag ends with a move that applies.** The audit of every refusal against every shape:

| Shape (x's side) | Before | After |
|---|---|---|
| `x + 4 = 9` (one number beside x) | …Try moving a number. | …Try moving the number. |
| `2x + 3 + 1 = 9` (numbers beside x) | …Try moving a number. | (unchanged) |
| `3x = 15` | …Try moving a number. | …To get one x from 3x, divide both sides by 3. |
| `−x = 15` | …Try moving a number. | …To get x from −x, divide both sides by −1. |
| `x = 9` (x alone) | …Try moving a number. | …x is already alone. Type its value. |
| `2x + 3x = 10` | …Try moving a number. | …Combine the x-terms first: drag one onto the other. |
| `3(x + 2) = 15` (the parenthesis dragged) | x is already on the left side… Try moving a number. | …Drag the 3 onto its parenthesis to multiply it in. |
| `5x = 3(x + 2)` (x inside the other side's parenthesis) | x is already on the left side… Let's keep x there. | The other side has an x too, inside the parenthesis. Drag the 3 onto its parenthesis first. |
| `x = (15)/3`, the fraction dragged | x is already on the right side… (wrong: it was not x) | x is 15 divided by 3. Work it out, then type x. |
| `x + 2 = ⅓(15)`, the fraction dragged | the same | Work out ⅓ of 15 first: click the ×. (division form: "…15 divided by 3 first: click the fraction bar.") |

  "Only like terms combine…" and "Drag the 3 onto its parenthesis…" fit every shape and stay.

## Part 2: help in the form on the screen (the messages changed)

1. I'm stuck / hint after Undo at x alone on a fraction (Flip's F5, used by Two-step, Distribute, Variables): "x is alone. ⅓(15) is 1 of 3
   equal groups of 15…" → "x is 15 divided by 3. Work it out, then type x." (fraction bar) / "x is ⅓ of 15. Work it out, then type x."
2. The same at `x = (12)/(−1)` (dividing by −1, Flip's F4): "−(12) means the opposite of 12…" → "x is 12 divided by −1…" (a flip made
   with the Flip button keeps "the opposite of 12").
3. Divide it at x alone (D2), the counters: "What is ⅕ of −15?" → "What is −15 divided by 5?" (fraction rows keep ⅕); the kept group:
   "that is ⅕ of it" → "that is −15 divided by 5".
4. A division that does not come out even: "…Press Undo and try another fraction." → "…try another number to divide by."; the third:
   "⅓ doesn't split evenly" → "Dividing by 3 doesn't come out even"; I'm stuck while it waits: "That fraction doesn't split evenly" →
   "That division doesn't come out even"; after Undo, "What fraction of these boxes should we find?" with ½ … ⅙ → "What should we divide
   both sides by?" with ÷ 2 … ÷ 6, the Divide button lit (not Multiply), and a choice writes the division row.
5. The product hint in fraction form: "⅓ × 15 is the same as 15 ÷ 3. Click the × and type it." → "⅓ × 15 is ⅓ of 15: split 15 into 3
   equal groups and take one. Click the × and type it." (division form unchanged: "15 ÷ 3: what times 3 makes 15?")
6. Refused drags of a fraction (Part 1's table, last two rows).
7. Not changed, by design: the hints before anything is divided ("divide both sides by 5 (that is, multiply by ⅕)"), the row's own
   "Same as multiplying by ⅕." line, the nudge ("Click the fraction bar to divide 15 by 3." / "Click the × to work out ⅓ × 15."), the
   product pop-ups ("What is 15 ÷ 3?" / "What is ⅓ × 15?"), and "Dividing by −3 flips every sign…".

A standing test (`tests/formWords.test.js`) plays every level of the five cards with a division in both forms (Distribute also divides
first) and, at every state after it, gathers every help text (three I'm stucks, Teach me, every term dragged across, a wrong product
then Undo, a wrong value then Undo then I'm stuck): no fraction words in division form (exception: "fraction bar"), no "divide" or ÷ in
fraction form. It checks about 9,800 texts.

## Part 3: back to the blank (which typed moves changed)

- **A wrong distribute product** (Distribute, Variables Level 5): Undo used to go back to before the drag ("Drag the 3 onto the
  parenthesis…"); now the distribute stays in progress: the factor in colour, the arcs, "3 groups of", the labels, both blanks empty,
  the cursor in the first; "Try again: type what 3 · x and 3 · 2 make, one in each box." 
- **A wrong sum** (every card that combines): Undo used to close the box ("Put them together: drag one onto the other…"); now the box
  stays open and empty with its two terms lit: "Try again: what is 19 − 4? Type it in the box."
- **A wrong worked-out product** (`⅓(15)`): the same: "Try again: what is ⅓ × 15? It is ⅓ of 15. Type it in the box."
- Add's amount already went back to its box (Build A); unchanged. A second Undo closes the open box, as before. Keyboard order,
  click-to-retype and the class sheet unchanged (none of these hints recorded anything before).

## Part 4: the wrong cancel

On Variables on both sides, an Add (button or drag) that leaves 0 on one side and x-terms and numbers together on the other gets the
spotlight and waits for Undo, tagged `zeroed-side`; the hint after Undo (recorded as `hint`) opens Add's x-term option with the x-term
that keeps the x-term left positive. After a number that empties its side, the hint opens Add's number option with the opposite of the
number beside x. The decision log notes the exception to "a legal move is never red". See the decision below about `0 = x + 6`.

## Part 5: the stacked x-term Add

- The x-term option (and its hover preview) draws a grey copy of the row with a box under the first x-term of each side (its first term
  where it has none), `+ ▢x`. Either box takes the keys and the other mirrors; Tab switches; a click selects the amount to retype; Go or
  Enter applies; 0 is refused. The keypad comes up for each box.
- The work row writes the amount under that x-term (a column as wide as the wider of the two, the x's lined up), crosses out the pair
  that cancels and nothing else, and the new row puts the added x-term right after the x-term it was added to: `5x − 2x + 5 = 14`.
  **I kept that order** (it did not hurt any row builder: the honest path, the shapes, the check and the typing test all pass). An
  x-term dragged across the = is the same Add, so it gets the same column, the same place and a preview that matches.
- An amount that cancels no x-term: the spotlight on the stacked row ("nothing cancels"), "Add so that one x-term cancels. To cancel 2x,
  add −2x. Press Undo.", then the x-term option open with −2. This replaces "+2x + +2x did not eliminate the term" and "…only partially
  canceled…" for x-terms (numbers keep theirs).
- Only Variables on both sides has the x-term option; no other card turns it on.
- **Text size, before and after** (Variables on both sides, the first problem of six seeds a level): 1366×768: Level 1 34 px, Levels 2-5
  32 px; 1366×650: 32 px on every level, the same before and after. The size chooser now also measures the open x-term boxes on the
  fullest row. Walking every level's full solution at 1366×650 (every move kept as its own row, Next after each), nothing scrolls,
  before or after. The rows were already at the smallest size (32), so Build Q's spacing pass has no room to give back here.

## The sweeps (run before every push)

`npm test` runs the real-browser sweep (`tests/screenSweep.test.js`: every card and level through the honest path, every term picked up,
hovers, typing into x =, the fraction bar, Undo, the check; no row replayed or redrawn, the text size never changes): passes, 6 of 6.
The typing test (`tests/canType.test.js`, extended to the two stacked boxes: a key must land in the focused box): 580 states on Variables
on both sides, passes on every card. Adding the new actions shuffled its random walks into three states no build had reached, each a
real bug, fixed: Start over while a distribute, sum or product was being typed, then Go, stopped Distribute with an error; after
combining two x-terms with Add's box still open, the cursor went to x = while the keys went to the box; x = kept a typed number,
greyed and unchangeable, after a move put x back on both sides (it now empties).

## Surprises

- A number added while x was already alone (`x = 2 + ⅓(28)` + 2 on Distribute) said "+0 + +2 did not eliminate the term"; it now says
  "x was already alone: adding +2 put a number next to it. Press Undo."
- After a division that did not come out even, Undo offered fractions (½ … ⅙) even though the student had divided: exactly the "new idea
  thrust on them" Karl described. Fixed with Part 2.
