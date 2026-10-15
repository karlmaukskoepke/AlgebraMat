# The Solve it screen as built (2026-10-13)

**What this is.** A record of what the Solve it screens actually do today, for the design chat to work from. Nothing in the app was changed. Every statement is **observed** (a screenshot, a measurement, or a file and line) or marked **inferred** with the reason.

**How it was captured.** Commit `7d1485f` (main, 2026-10-13). The app ran on the local dev server; pages were driven by Playwright in the pre-installed Chromium, in a **1366×768 window** (key screens also at 1280×720). Fixed seeds (`?pack=add-both&level=2&seed=7&nosignin=1`) so every screen can be reproduced. Measurements are in `measure.json`, colours of the pieces in `pieces.json`, the list of every shot in `manifest.json`.

> **Blind spot to keep in mind.** A Chromebook *screen* is 1366×768, but the page only gets what is left after Chrome's tab strip and address bar (about **1366×650**). Every "fits / doesn't fit" below is for a 768-px-tall page, so the real margin on a student's Chromebook is roughly 120 px worse. Worth one test on a real school Chromebook before any layout decision.

---

## Headlines (what surprised me)

1. **The two cards are built on different engines.** Divide it runs on the shared Solve it loop (`src/engine/solveLoop.js`). **Add to both sides does not:** it has its own reducer (`src/engine/addBothMoves.js`) from before the loop existed. So on Add the choice is still fixed per problem, there is no folding and no Next after a move, Start over follows the old three-red rule, and the scaffold replaces the work stack. Any change to "the loop" today means changing two code paths, or moving Add onto the loop first.
2. **Add to both sides does not fit 1366×768.** The page is 955 px tall; Undo is cut in half at the bottom edge and the help row and number pad are only reachable by scrolling (`add-02`). With I'm stuck open it is 1,100 px. Divide it fits exactly (768 px).
3. **On Add, six of the eight Why? lights turn green together with Fewer terms** although nothing judges them (`add-11`). Only Fewer terms and Solved for x have rules; the others copy Fewer terms through a fallback in `src/view/lightScreen.js:287`. The Add spec (§3E) says only those two boxes should show.
4. **There is no "partly" (yellow) light anywhere.** The only in-between state is Add's grey "–" (Fewer terms after a partly cancelling move, `add-20`), which means "no change", not "progress".
5. **Divide it's lights are not computed from the equation.** Any successful fraction sets Smaller numbers green as a constant (`src/engine/divideMoves.js:227`); One box is "coefficient is 1". Several lights (No fractions, No opposite box, x on the left, Each side simplified) have no rule anywhere in the code.
6. **Nothing previews a move today.** Hovering a live move shows only its name in a tooltip (`add-07`, `div-04`); nothing appears on the equation. On a touchscreen one tap selects the move at once and shows no name (`touch-01`), which is also short of loop §5 ("a tap shows its text for a moment before it acts").
7. **A pilot of idea 7 already exists:** `?layout=tucked` on Divide it (the counters tray slides up only when asked for; the moves sit in a drawer; the lights stand alone in a slim column). It has two bugs I could see: after a move, **the keyboard stops typing** into `x =` (focus lands on the Moves tab, and `src/main.js:541` ignores keys while a non-pad button has focus), and the counters **tray is clipped** at 1366×768 (`divt-24` to `divt-27`). **Update 2026-10-15: both are fixed** (focus now stays on the page after a move, so typing and Enter reach `x =` and Check; the tray lays its drawing and the fractions side by side and fits 1366×768 and 1280×720). The screenshots in this file are from before the fix.
8. **Start over on Add never unlocks after three red moves if the student presses Undo each time** (the spec's own flow): Undo restores the red count saved before the move (`addBothMoves.js:131`), so it never reaches three (`add-23`, `add-24`).
9. **Name clash:** Count it already has a card called **Flip It** (pack id `flipit`, `src/packs/index.js:4`). The Solve it card spec'd as "Flip it" will collide in name and, if reused, in id and save bits.
10. **The bold text is not as bold as the CSS asks.** Only Lexend 400 and 600 are loaded (`index.html:16`), while the line and buttons ask for 700-800. *Inferred:* the browser draws them with the 600 face. If "large and bold" matters, load 700/800.

---

## 1.1 Screenshots

All shots are in `shots/` (WebP), listed by state below and embedded in `CURRENT-STATE.html`. Prefixes: `add-` Add to both sides, `div-` Divide it (classic, the default), `divt-` Divide it with `?layout=tucked`, `touch-` touchscreen emulation. A shot marked *scrolled* has a `-top` twin: the same moment before scrolling.

**Not captured, and why:** Flip it is not built (spec only). "Pressing" a move looks the same as hovering (there is no pressed style). Divide it's L1 final walkthrough was not reached in the script (the five items were). An opposite box is not drawn by any Solve it card (see 1.4).

*(Screenshots are in CURRENT-STATE.pdf, 25 key screens, and in the full CURRENT-STATE.html in the repo. Shot names like `add-11` below refer to them.)*

---

## 1.2 Layout map at 1366×768

Positions are measured (`measure.json`): x, y, width × height in px from the top-left of the page. "Reserved" means the space is kept when empty.

### Add to both sides, Level 2, opening (`add-01`)

The game is a centred 960-px column (x 203 to 1163). The page is **955 px tall** in a 768 window.

| Region | x, y | w × h | Reserved when empty? | What fills it |
|---|---|---|---|---|
| Header (Packs, title, dots, Save code) | 203, 8 | 960 × 54 | always there | |
| Level dots | 917, 22 | 112 × 16 | | five dots |
| The line | 203, 70 | 960 × 157 | min 120; grows to 157 with the two-line prompt + buttons | prompt, Guess x / Use a move, messages, Undo cue |
| Work stack (original equation first) | 203, 253 | 504 × 380 | **yes, 380 reserved** | equation 70 tall, work rows, x = row, check |
| `x = [ ]` row | 384, 329 | 142 × 56 | inside the stack | |
| Check (with Next beside it when stepping) | 385, 397 | 140 × 46 | inside the stack | |
| Substitution list | 455, 451 | — × 108 | **yes, 108** | check rows |
| "Add [ ] to both sides" | 203, 645 | 504 × 56 | **yes, kept invisible until Add is chosen** | the amount blank |
| Undo + Go row | 203, 713 | 504 × 56 | yes | Undo; Go only after Add is chosen |
| Help row | 203, 781 | 504 × 108 | yes | I'm stuck, Teach me, **Start over wraps to a second line** |
| Move / Why? panel | 723, 239 | 440 × 495 | yes | 8 moves × 44 px + gaps, Why? column, Solved for x |
| Number pad | 203, 897 | 960 × 58 | yes | |
| Scaffold area | none on the bare screen | | **not reserved** | I'm stuck **replaces the work stack** with the seesaw (504 × 470) and the page grows to 1,100 |

### Divide it, Level 2, opening, classic (`div-01`)

Full width (1320 px). The page is exactly 768 px tall.

| Region | x, y | w × h | Reserved? | What fills it |
|---|---|---|---|---|
| Header | 23, 8 | 1320 × 54 | | |
| The line | 23, 70 | 1320 × 102 | min 102 | prompt text centred; Guess x / Use a move stacked on the right |
| Work stack | 23, 182 | 538 × 350 | min 300 | equation 44 tall, rows, x = row, Check, substitution (84 reserved) |
| Fractions row "Take × ½ … of both sides" | 23, 536 | 538 × 58 | **yes, greyed until the move is chosen** | five fraction buttons |
| Undo | 23, 598 | 538 × 44 | yes | |
| Help row | 23, 650 | 538 × 50 | yes | I'm stuck, Teach me, Start over on one line |
| Counters / diagram area | 577, 180 | 350 × 215 | **yes, an empty dashed box** "counters appear here when you ask for help" | the group diagram |
| Move / Why? panel | 943, 180 | 400 × 495 | yes | |
| Number pad | 23, 708 | 1320 × 58 | yes | |

### Divide it, `?layout=tucked` (`divt-01`)

| Region | x, y | w × h | Notes |
|---|---|---|---|
| Original equation (pinned) | 23, 70 | 1102 × 58 | |
| Work stack (scrolls) | 23, 134 | 1102 × 338 | shrinks to 120 when the tray is open |
| The line | 23, 478 | 1102 × 102 | **moved below the stack** |
| Helper row (I'm stuck, Teach me, Undo, Start over) | 23, 586 | 1102 × 48 | one row |
| `x =` row + Check | 426, 640 | 296 × 46 | under the helper row, out of the stack |
| Why? column | 1133, 70 | 210 × 616 | lights only, with a Moves tab at its foot |
| Moves drawer | 887, 70 | 470 × 616 | slides over the Why? column, only when opened |
| Counters tray | 23, 470 | 1102 × 220 | slides up only for I'm stuck / Teach me; the diagram inside is 194 tall and **cut off** at the bottom |

### How much vertical space would be freed

- **The Move panel and the scaffold area sit beside the stack, not above it**, so on both cards removing them frees **width** (Add: 456 px; Divide: 366 px for the diagram box and 416 px for the panel), not height. *Inferred from the x positions above.*
- **What costs height is the column under the stack.** On Add: the reserved "Add [ ] to both sides" row (56 + 12 gap), the Undo/Go row (56 + 12) and the two-line help row (108 + 12) add up to **about 256 px**, more than the 187 px Add overflows by. On Divide: the fractions row (58 + 4), Undo (44 + 8) and the help row (50 + 8) are **about 172 px**. Ideas 5 and 6 (blanks in the equation, Undo in a corner, help beside `x =`) would remove most of that. *Sums of measured heights and gaps; an estimate.*
- **Add's scaffold** takes no space until asked for, but then it replaces the stack (against loop §6) and adds 145 px to the page.

---

## 1.3 How the Move panel and the Why? lights work today

### How each Move row is drawn
- **Inline SVG, built in code**, one function per move: `ICONS` and `moveIcon()` in `src/view/lightScreen.js:45-66`. Template: grey `( )` for "whatever is there", the changing part in blue `#0072b2` (`lightScreen.js:32`), a light blue `#6fb6e0` for the "before" of Cross the border. Each sits in a 44-px button, 180-250 px wide (`shots/pieces/move-icon-*.png`).
- **The order** is `MOVES` (`lightScreen.js:17-26`): Add, Cross the border, Take a fraction, Multiply, Flip everything, Trade places, Distribute, Combine.
- **Could the icon be reused as a preview on the equation?** Not directly. The icons are generic pictures (`( ) + ▢ = ( ) + ▢`); the equation rows are **HTML text**, not SVG (`equationRow` and `termsOf` in `src/view/solveScreen.js` and `lightScreen.js`). A preview would be a new "ghost row" drawn with the same HTML row builder, with dashed boxes for the blanks. The **look** (dashed blue box, blue `n`, `1/n`) can be matched in CSS so the icon and the preview read as the same thing. *Inferred from the code.*

### What happens when a move is chosen

**Add to both sides** (bare screen):
1. The line asks **Guess x** or **Use a move**. Until one is tapped the moves are **locked**: greyed, no tooltip (`add-01`, `add-03`).
2. **Use a move**: Add pulses blue (`add-06`).
3. Tap Add: the reserved row **"Add [ ] to both sides"** becomes visible under the stack with a blinking blank; **Go** appears greyed in the Undo row (`add-09`; `lightScreen.js:68`).
4. Type the amount on the pad or keyboard (± toggles the sign). Go turns green and pulses (`add-10`). A number can also be dragged from the equation into the blank.
5. **Go** writes the work row `x + 8 + −8 = 11 + −8` (the amount in blue on both sides, x's pair struck through), then the new row `x = 11 + −8`. The other side is **left unsimplified** so the answer is not shown. The lights are judged (`addBothMoves.js:393` onward, `lightBoard` at `:231`).
6. If x is alone, the `x =` row goes live (`add-11`). There is **no Next and no folding** after a move on this card. Undo stays live for the move.
7. An unhelpful amount: Fewer terms red, the line explains, Undo pulses (`add-18`). Undo keeps Add chosen and clears the blank (`add-19`).

**Divide it** (on the loop):
1. Same choice; moves locked until **Use a move** (`div-01`, `div-03`).
2. Tap *Take a fraction of both sides*: the reserved **fractions row** under the stack goes live (`div-06`).
3. **Tap a fraction: it is applied at once to both sides.** There is no blank and no Go on this card (`divideMoves.js:109`).
4. A fraction that does not split writes a red row with ✗, the line names the side, Undo pulses (`div-08`). Undo returns to the same state with the choice showing (`div-09`).
5. A finishing move writes `⅓(3x) = ⅓(12)` then `x = ⅓(12)`; One box, Smaller numbers and Solved for x turn green; `x =` goes live (`div-10`).
6. A partial move (`4x = 8`, `× ½` → `2x = 4`): the choice returns at once with the same prompt, and a green **Next** appears beside Check (`div-36`). The move **folds** to one row ("½ of both sides 2x = 4") on the student's next action (`div-37`).

**Buttons involved:** Add uses Go + Undo; Divide uses no Go, Undo, and Next (fold) after a partial move. Both use Check, then Next once per substitution line, then "Next problem".

### The Why? lights: every light, its rule, its states, its move

The lights sit in a grid beside the moves they go with (`WHYS`, `lightScreen.js:253-259`); each group is centred on its moves' rows. **Light states that exist in code:** `off` (dashed outline), `green` ✓, `red` ✗, `neutral` (grey –). **There is no partly state.**

| Light | Beside (pairing, `lightScreen.js:253-259`) | Add to both sides | Divide it |
|---|---|---|---|
| **Fewer terms** | Add, Cross the border | **Rule:** `judge()` `addBothMoves.js:84-88`. Terms on x's side are counted as `xTerms` = x, plus 1 if the numbers there add to anything but 0 (`:80`). Green if fewer than before; red if more, or if the number next to x got bigger in size; grey (neutral) otherwise. States: off, green, red, neutral. | forced `off` (`divideScreen.js:92`) |
| **No fractions** | Fraction, Multiply | no rule: **copies Fewer terms' green** (`lightScreen.js:287`) | forced `off` |
| **Smaller numbers** | Fraction, Multiply | no rule: copies Fewer terms' green | **green after any successful fraction**, a constant (`divideMoves.js:227`); never red; a failed fraction leaves it as it was |
| **One box** | Fraction, Multiply | no rule: copies Fewer terms' green | green when the coefficient of x is 1 (`divideMoves.js:227`) |
| **No opposite box** | Flip everything | no rule: copies Fewer terms' green | forced `off` |
| **x on the left** | Trade places | no rule: copies Fewer terms' green (Trade places is live on L5, but this light is never judged) | forced `off` |
| **Each side simplified** | Distribute, Combine | no rule: copies Fewer terms' green | forced `off` |
| **Solved for x** | its own row, last | green when x is the only term on its side (`judge`, `:87`) | green when x is alone (`divideScreen.js` `panelBlock`) |
| **Balanced** (tucked pilot only) | Why? column | — | off; green or red after a check (`divideScreen.js:115-123`). Not in any spec. |

**When they are judged:** only after a committed move (Add: after Go; Divide: after the fraction is taken). A wrong guess does not change them. Undo restores the lights saved before the move.

### Which moves are visible, greyed, hidden or locked

All eight moves are **always drawn** on both cards, at every level (nothing is hidden). What controls it is `movePanel()` (`lightScreen.js:263`) with the card's `active` move and a `locked` flag from each card's `panelBlock`.

| | Add to both sides | Divide it |
|---|---|---|
| Active | Add, every level including L1 | Take a fraction, every level including L1 |
| Also live | Trade places from L5 when x is on the right; the first time it is pointed out and Add waits for it (`addBothMoves.js` `TRADE_LEVEL`, `tradePending`) | — |
| Greyed (tappable, never acts) | the other six; a tap says "That move unlocks on a later card." | the rest; an earlier card's move (Add, Cross, Trade) says "You don't need that move here.", a later one "That move unlocks on a later card." |
| Locked (active move drawn greyed, no tooltip) | before the choice and in guess mode | before the choice and in guess mode |
| Why? boxes of greyed moves | dashed outlines (but they turn green with Fewer terms, see above) | dashed outlines |

### Hover and touch
- **Hover** on a live move shows its name in a dark tooltip to the left of the icon (CSS `::after`, `src/style.css:2943`). Hover on a greyed or locked move shows nothing. **Nothing else depends on hover**; every action is a click or tap.
- **Press**: no pressed style; it looks like hover (`add-08`, `div-05`).
- **Touch** (emulated): one tap selects the move at once; no name is shown (`touch-01`, `touch-02`). The tooltip CSS is not limited to devices that can hover, so on some touch browsers the name may stick after a tap. *Inferred from the CSS.*
- Keyboard: digits, ± and Backspace type into whichever field is live; **Enter** presses the first available of Check, Next, Go (`src/main.js:530-561`).

### The `x =` answer row
- **Add:** `answerBlock()` `lightScreen.js:172`. **Inside the work stack**, under the newest equation, with **Check directly under it** and **Next beside Check** while the substitution steps (`add-13`).
- **Divide:** `answerRow()` `solveScreen.js:113`, same place and order.
- **Live** (white box, blinking cursor) in guess mode, once x is alone, and on Divide while counters are up (`answerOpen`). **Greyed** before the choice, on the move path until x is alone, while a substitution is stepped, and when done. While the value is being placed on x (Divide), the box becomes a chip to drag onto the x.
- **Tucked pilot:** the `x =` row moves **out of the stack** to the bottom of the work column, under the helper row (`divt-01`).

### Where I'm stuck, Teach me, Undo and Start over are
- **Add:** Undo under the stack (150 × 52); help row at the bottom of the left column, 504 × 108, **below the fold** at 1366×768, with Start over wrapping to its own line.
- **Divide (classic):** Undo 150 × 40 above the help row (538 × 50), all three on one line; everything visible.
- **Tucked:** one helper row of four (I'm stuck, Teach me, Undo, Start over), 1102 × 48, right above `x =`.
- I'm stuck and Teach me are live at the start of a problem (an option at any time); Start over is greyed on the untouched original on Divide, and on Add until three red moves.

### I'm stuck and Teach me (for reference)
- **Add:** click 1 is a reminder (the number next to x outlined, the blank opened; `add-25`); click 2 brings in the seesaw and **replaces the work stack** (`add-26`; at L2-L3 it starts with building the equation); click 3 the two-action move; click 4 the amount pre-filled. Teach me: the seesaw with the amount pre-filled, add to each side, Go, then Party/Battle (`add-31` to `add-34`).
- **Divide:** rung 1 shows the boxes and the pile in the reserved diagram area with the fractions live, and the student deals and keeps (`div-25` to `div-28`); rung 2 highlights the needed fraction (`div-33`). At x alone: the pile to deal, then the groups made with one bracketed (`div-29`, `div-30`). The stack never leaves the screen.

---

## 1.4 The look

**Fonts** (`index.html:16`, computed styles in `measure.json`)
- **Lexend** for everything but equations. Loaded weights: **400 and 600 only.** The line asks for 800 at 24 px, Why? labels 600 at 13-14 px, help buttons 600 at 17 px.
- **Kalam 700** (handwritten) for equations: 36 px on Add's stack and Divide's stack.

**Colours**

| Thing | Value | Where set |
|---|---|---|
| Page | white `#ffffff` with a 24-px grid `#e6ecf3` / every 5th `#d5dee9` | `style.css:10-14, 31-45` |
| Ink | `#1d1d1d` | `style.css:3` |
| The line | `#fff6b8` fill, ink border, 14-px corners; red-tinted when a message is "bad", green when done | `style.css:2768` |
| Move / Why? panel | `#fffdf2`, ink border | |
| Operation blue (amount added, fraction, icons' changing part) | `#0072b2` | `lightScreen.js:32`; `style.css:2846` (`.lb-num.is-added`), `:2970` |
| The same blue also marks **"click here"** (pulsing rings), the drop target, hint outlines and the plug-back-in row | `#0072b2` | `style.css:2786, 2794, 2834, 2881, 2966` |
| Step highlight in the check (accent) | purple `#7b3fb0` | `style.css:3044` |
| Positive counters | **Add seesaw:** ink `+` marks in a white rounded box. **Divide diagram:** green `#009e73` | `style.css:2609`; `--inside`, `style.css:7` |
| Negative counters | **Add seesaw:** ink `−` marks in a **dashed** box. **Divide diagram:** magenta `#b8508f` | `style.css:2610`; `--opposite`, `style.css:4` |
| x box | white fill, ink stroke 2.5 px, rounded 6; a bold "x" inside | `style.css:3062-3063` |
| Opposite box | **not drawn by any Solve it card.** Build it's Boxes & Circles draws it in magenta `#b8508f` | `style.css:1342` |
| Light green ✓ | fill `#3aa76d`, border `#1b6e3a` | `style.css:2681` |
| Light red ✗ | fill `#d9534f`, border `#a3281b` | `style.css:2682` |
| Light neutral – | fill `#ececec`, ink border | `style.css:2683` |
| Light off | white, dashed `#9a9a9a` border, grey label | `style.css:2684, 2679` |
| Move button, greyed | `#dcdad2` fill, dashed `#6b685f` border, icon at reduced opacity | computed |

**Inconsistency worth knowing:** the two cards draw counters differently (Add: black marks, sign shown by a dashed box; Divide: green and magenta marks).

**Pieces at 3×** are in `shots/pieces/`: `add-seesaw-x-box`, `add-tray-plus-piece`, `add-seesaw-negative-group-hinted` (the dashed box, shown with its blue hint outline), `divide-counters-positive`, `divide-counters-negative` (boxes and a pile), the four light states, Solved for x green, all eight move icons, and the locked panel. No opposite box exists in Solve it to capture.
