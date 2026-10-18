# Lights experiment on Add to both sides, round 2: build report (2026-10-18)

Spec: `SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md` (rev 0.2, in this folder). Built on `main` behind `?ui=lights`, Add to both sides Levels 2–3 (shown as Levels 1–2 since the "See why it works" change), plus the drill at `?ui=lights&drill=distribute`. Built on top of Build A (the help fixes), which went live first. Without the flag nothing changes: `npm run parity` passes (problems, save codes, class-sheet records, traces and all 62 screens as before).

All of Part A and Part B, B6 included, is built.

## What a student sees (flag on)

**Part A**
- **A1 Forced move.** A correct first guess finishes the problem, and the next problem is the move (the card's own rule, as on the classic screen; round 1's "same problem" rule is gone). On it, Add has a steady ring plus the pulse, `x =` is greyed with "Make one move first." under it, and the line says "Show this one with a move: use Add, or drag the number across the line." `x =` comes live once a move is committed (Next, or going on without it) or a combine is applied, and then stays live.
- **A2** The dashed centre line is drawn in front of the "=" on every row (see decision 1).
- **A3 The panel**: four narrow moves (Add, Multiply, Flip, Trade), each 66 × 44 px, with their name on hover/focus as before. Only Add is live; the others give today's message. The label is **Goals**. The lights are round dots, 18–22 px, with the same states and shapes (✓ ✗ – dashed). Hover, keyboard focus or a tap opens a dot in place into a pill with its goal. The pill grows to the left over the moves, one at a time; on touch a second tap closes it. Each dot sits beside its move. **Each side simplified** and **Fewer terms (by hand)** are a second group under the moves, with no icon. **Solved for x** keeps its row.
- **Panel width: 121 px** (target ≤ 150; was 440). The work column gained 319 px (504 → 823 px at 1366 wide).

**Part B (Add L2–3)**
- **B0** Every term of the newest row is a token with its sign (`x`, `− 4`, `+ 8`). It is grabbed with mouse, touch or pen: 6 px threshold, `touch-action: none`, a copy 40 px above the pointer, a dashed gap where it was. With the keyboard: Tab to a term, Enter picks it up, ←/→ move it between slots (across the line too), Enter drops, Esc puts it back. Older rows are inert.
- **B1 Reorder**: dropped in another gap on its side (a blue bar shows where). It replaces the newest row in place and is undone by Undo. It is never judged.
- **B2 Cross**: over the other side of the line the copy reads its opposite (`− 4` → `+ 4 ⇄`) and that side gets a dashed outline. On drop the engine's own `go` runs with the amount from the term, so the rows, lights and messages are exactly the Add button's (a test checks they're identical). `x` snaps back with "That moves x. Try the number."
- **B3 Combine**: drop a term on a like term on its side. The target is outlined green while hovering. A blank opens in the ghost row (the two terms dimmed), with "What is −3 + 4? Type it in the box." Enter or ✓ applies. A wrong sum turns red with "−3 + 4 is not 5. Try the sum again, or Undo.", Undo is highlighted, and the next key starts the blank again. A right sum writes a new row. `AUTO_COMBINE_FROM_LEVEL = Infinity`.
- **B4 Minus**: rows now read as they are said, `x − 4 = −3` (see decision 2). Tapping the minus of a subtracted term (or pressing the minus key with it focused) shows `x + −4`, with −4 in the negative style (purple, underlined), and the line says what it means. Tapping again goes back. Undo covers it. No new row, no light.
- **B5 Judging**: a cross is judged by the engine as today. A combine lights the by-hand Fewer terms and recomputes Solved for x (decision 3). Reorder and minus never change a light.

**B6 The Distribute drill** (`?ui=lights&drill=distribute`): `5 − 2(x + 2) = 3`, then `3(x + 1) = 9`, on the same screen.
1. Dragging the 2 onto the parentheses is refused with "Tap the minus first, so −2 is a negative number."
2. Tapping the minus gives `5 + −2(x + 2) = 3`.
3. Dragging −2 onto `(x + 2)` (outlined green) opens one blank per product, labelled `−2 · x` and `−2 · 2`, with the x printed after the first blank. Enter goes from one blank to the next.
4. A wrong product turns red: "−2 · 2 is not −3. Try that one again, or Undo." The right products give `5 + −2x + −4 = 3`.
5. Then combine, cross and combine again: `1 + −2x = 3`, `−2x = 3 − 1`, `−2x = 2`.
6. Typing x = −1 lights Solved for x, and Next problem gives `3(x + 1) = 9`, which has no minus to tap.

## Screenshots (real build, 1366 wide, each at 768 and 650 tall)

| Acceptance item | Files |
|---|---|
| 1. Opening, narrow panel, L2 and L3 | `lx2-01-opening-L2-*`, `lx2-01-opening-L3-*` (width measured: 121 px) |
| 2. A light expanded on hover | `lx2-02-light-hover-*`, `lx2-02b-light-hover-multiply-*` |
| 3. Forced move: ring, `x =` greyed with its note; after the move, live | `lx2-03a-forced-move-*`, `lx2-03b-forced-after-move-*`, `lx2-03c-forced-x-live-*` |
| 4. Dashed line in front of the "=" | `lx2-04-line-in-front-*` |
| 5. A token lifted, the dashed gap | `lx2-05-drag-lifted-*` |
| 6. Over the line: opposite sign | `lx2-06-over-the-line-*` |
| 7. After the drop: work row and new row | `lx2-07-after-drop-*` |
| 8. Combine: blank, wrong, typed, right | `lx2-08a…08d-*` |
| 9. Reorder | `lx2-09-reorder-*` |
| 10. `x` snaps back | `lx2-10-x-snaps-back-*` |
| 11. Minus tapped, and back | `lx2-11a-minus-tapped-*`, `lx2-11b-minus-back-*` |
| 12. The drill: refused, minus, factor over the parenthesis, two blanks, brought down, solved, problem 2 | `lx2-12a…12j-*`, keyboard: `lx2-12i-keyboard-factor-768` |
| 13. Keyboard-only B2 | `lx2-13a…13e-*` |
| 14. Add L2 without the flag | `lx2-14-noflag-L2-*`; parity also passes on its L2 screens |
| Touch (CDP touch events, Chromebook size) | `lx2-15-touch-over-line-*`, `lx2-15b-touch-dropped-*`, `lx2-15c-touch-light-*` |

`take-shots-2.cjs`, `take-shots-2-touch.cjs` and `take-shots-2-drill.cjs` re-take them against a running dev server (`node docs/lights-and-moves/take-shots-2.cjs http://localhost:5173/ docs/lights-and-moves 768`).

**13. Keyboard-only run (B2)** on `x − 4 = −3`:
1. Two Tabs from the line reach `− 4`, outlined in blue.
2. Enter lifts it in place.
3. → moves it to the gap after its side.
4. → again carries it over the line, where it reads `+ 4 ⇄` beside `−3` and the right side lights up.
5. Enter drops it: the work row and `x = −3 + 4`, with Fewer terms green and Next focused.
6. Esc at any point puts it back.

Tab doesn't leave a held term behind. For the drill's factor, → goes onto the parenthesis and ← goes back.

**Touch on a Chromebook-sized screen** (1366×768 with touch, events sent as real touch points):
- A tap on the minus (no movement) shows −4 as a negative, and a second tap goes back.
- A finger drag lifts the term. The copy's bottom edge rides 43 px above the finger, so it's never hidden.
- The page never scrolled during a drag.
- Tapping a light opens its pill, and a second tap closes it.
- There's no conflict with the Add icon's tap-to-preview.

Playwright's touch is an emulation: a real Chromebook trackpad and screen still need a try (see decision 4).

## Logging (flag only, this device only: `mat.lights.v1`, never the class sheet)

Per problem, on top of round 1's fields:
- `drags`
- `outcomes { reorder, cross, combine, distribute, snapBack, keyboard }`
- `minusTaps`
- `lightHovers { fewer: n, … }` and `moveHovers { flip: n, … }`, counted once per look
- `sumsWrong`
- `forced`, and `guessedRight`, which now means a correct guess finished the problem

The drill adds `productsWrong` and `refusedMinus`. The class-sheet record of an Add problem is unchanged: same fields, same words.

## Decisions I made (please overturn any)

1. **The line in front of "=" makes it read like "≠".** Built as the spec asks (`lx2-04`). Recommended: draw it in front only while a term is being dragged, and behind the "=" otherwise.
2. **Rows read as subtraction under the flag.** Round 1 (and the classic screen) write `x + −4`; B4 assumes `x − 4`, so under the flag every row now reads `x − 4`, `x = 11 − 8`, and the work row `x + 8 − 8 = 11 − 8`. Without the flag nothing changed.
3. **What a combine lights.** Today's judging only looks at x's side, so a combine on the other side would turn Fewer terms grey. Instead it lights the by-hand Fewer terms (the A3 second group) and recomputes Solved for x, and Add's Fewer terms keeps its state. Each side simplified isn't judged (rev 0.1: only Fewer terms and Solved for x).
4. **A wrong sum shows only the line** (plus Undo highlighted). No rung was reused: none fits a sum the student chose to make. I'm stuck still works there: it closes the blank and runs Build A's ladder.
5. **"One move" for the forced problem** means a committed move: a move with Next pressed (or gone on from), or a combine. A red or partly cancelling move doesn't open `x =`.
6. **Round 1's drag of a number into the Add box** is replaced by grabbing terms on the newest row (a dropped number now crosses, reorders or combines). The box is still typed into after choosing Add.
7. **The drill:** the parenthesis as a whole can be reordered but never crosses ("Open the parentheses first…"). The factor is its own handle. The drill ends by typing x after `−2x = 2`, since Multiply isn't a live move yet. Its help buttons and Add are greyed. Products are written `+ −2x + −4`, as the spec shows, and keep that look in every row. Each drill problem ends with "x = −1. That's it!"
8. **Rows can grow to six in the drill** (four on Add after a combine). From four rows on, the rows get a little smaller, so everything still fits at 1366×650 (checked: no scrolling).

## Could not do as written

Nothing is left out. Two notes:
- The keyboard route's "slots" include combine targets (onto a like term), as a separate stop between gaps.
- Rev 0.1 (`SPEC-LIGHTS-EXPERIMENT-ADD.md`) isn't in the repository, so I worked from its build report and the code.

## Engine files touched

- `src/engine/addBothMoves.js` (the card's engine): **not touched.**
- `src/engine/addBothLights.js` (round 1's flag wrapper): the forced-move rule, plus the drop, minus, combine and undo actions, all in the wrapper. A cross calls the engine's own `go`.
- New, flag-only:
  - `src/engine/lightsGrab.js`: pure slots and outcomes, reorder, combine, how a term is written.
  - `src/engine/distributeDrill.js`: the drill's board and reducer, because the Add engine has no parentheses.

## Files changed

- **Engine:** `src/engine/addBothLights.js`, `src/engine/lightsGrab.js` (new), `src/engine/distributeDrill.js` (new).
- **Views:**
  - `src/view/lightsScreen.js`: rows, tokens, sum and product blanks, the panel.
  - `src/view/lightsGrabPointer.js` (new): pointer and keyboard grabbing, the lights' hover, focus and tap.
  - `src/view/lightsPointer.js`: binds the new layer first.
  - `src/view/addBothLightsFeedback.js`: new lines.
- **Play:** `src/play/addBothLightsPlay.js` (the forced move, the pad for sums), `src/play/distributeDrillPlay.js` (new: the hidden drill pack).
- **`src/main.js`:** with `?ui=lights&drill=distribute` only, the drill pack is added and opened.
- **`src/style.css`:** a new section, all under `.ui-lights`, apart from the drag copy and the grabbing cursor, which only appear under the flag.
- **Tests:** `tests/addBothLightsGrab.test.js` (14), `tests/distributeDrill.test.js` (5), and one round-1 test rewritten for A1. All 994 pass, `npm run build` passes, and parity passes.
- **Test links:** `public/test-links.json`.
