# Build AB report: level popups, section footers and a gentler cross-out (2026-11-01)

Everything is on `main` and live, with no flags, after the unit tests, the real-browser sweeps and `npm run parity`, in three pushes: Parts 0
and 1 (the cross-out, on its own, first), Parts 3 and 4 (the popups and footers), and a fix to the cross-out's placement (anchored to the
text's baseline) with this report. Decision log: "2026-11-01: level popups". Home-screen spec: `SPEC-HOME.md` §0a.

Features to check: 9 new items (the gentler cross-out; the popup by pointing, by the keyboard and by a tap; a level opened from the popup; a
locked level; near the right edge; Find my level; Timed challenges). Updated: 3 cross-out items (`w-xo-add`, `w-xo-drag`, `w-xo-stacked`:
their words), `x-two-solve-sections`, `m-placement-old` and `m-practice` (they clicked a section title). Removed: Build X's three
expanding-title items (`x-expand-point`, `x-expand-keys`, `x-expand-tap`), since that feature is retired (its entry is under Retired).

**What this build touched that Count it and Build it appear on:** the shared home screen only: their panels get the chevrons and a footer,
their card names a popup, and their card pages lose the ⏱ challenge buttons (the challenges are in Count it's footer now). Nothing in how
their cards play changed. Class-sheet words, save codes' meaning, the stored form of every move, problems and seeds are unchanged.

## Part 1: the cross-out, as built

- **Which marks:** every strike-through cancel mark of the addition property: Add's number pairs and x-term pairs, by the button or by
  dragging across the =, and the stacked x-term pairs (all drawn by one function). Not Flip's vertical strokes through the minus signs.
  Build P's slash through the two 3s of a division or fraction (4 px, 18°) was looked at and left as it is: it does not have the fault (it
  crosses a single number, not a sign and a digit).
- **Angle:** 30°, shallower on a wide term so the stroke rises no more than 15% above the digits' height, never below 25°. Measured:
  `+8`, `−8` 28.4°; `−3`, `+3` 29°; `−13`, `+13` 25.0°; `4x` 30.0°; `−4x` 26.6°.
- **Centred:** the stroke's midpoint is on the centre of the term's ink box (the digits' height and the term's width, sign included).
  Measured from the glyphs' own ink, at 1366×768, 1366×650 and 125% zoom: within 0.5 px vertically and 1.1 px horizontally on every term
  (the allowance is 5% of the ink box: 1.0 to 1.4 px vertically, 1.3 to 2.8 px horizontally). It crosses sign and digits; never between
  the minus and the digit, never under the number.
- **Weight:** 0.075em, at least 2 px: 3 px at the largest (40 px) text, 2.4 px at 32 px, 2 px on the smaller x-terms (Build W: 6.4 px).
- **Ends:** it runs past the ink by about 0.05em (measured 0.7 to 2.9 px) (Build W: 0.1em each side, and much more above and below).
- **Z-order:** behind the glyphs. The term's wrapper isolates its layers and the stroke sits underneath, so each digit is painted over
  it (the faded digits still let it show through, as before). No transparency was needed.
- **How it is placed:** an empty box 0.375em tall stands on the text's baseline; the stroke is centred on its top (the digits' middle).
  The first version centred it on the term's box instead; on GitHub's test machine, whose fonts render a hair differently, that put the
  small `4x` of Distribute more 1.4 px off (its allowance is 1.0 px) and turned that check red for Part 1 (publishing was not held up). The
  baseline anchor fixed it on both machines.
- Reduced motion: drawn still. It still draws itself from the lower left once when its row appears, never again on a redraw.
- Pictures: `xo-before-*.png` and `xo-after-*.png` at 1366×768, 1366×650 and 125% zoom (four cases each: `+8`/`−8`, `−3`/`+3`,
  `−13`/`+13`, a stacked `4x` over `−4x`).

## Part 2: the home screen before this build (reported before building)

- **The placement quiz button** lived only inside the expanded section: pointing at, clicking, tabbing to or tapping a section title opened
  the whole section over the four panels, with the quiz bar at its top ("Take the Count it diagnostic to find your levels", "Continue … (3
  of 6 done)" or "See my … results"); Solve it Plus showed "Solve it Plus has no placement quiz: start at Level 1 of any card." there.
  It was not on the first screen or on a card page.
- **The timed challenges** were ⏱ buttons at the foot of four cards: Combine it (Adding), Flip It (Subtracting, Add & subtract), Group It
  (Multiplying, Big multiplying), and, in Build it, Distribute, then combine (Everything). They showed in the expanded section and on each
  of those cards' own pages.
- **Keep practicing** is not on the home screen: it is a button on the "Level N complete!" screen. Untouched.
- **Each panel after Build X:** a section with one big button (the title, the grade, the blurb and the status line, all inside it), then
  the list of card names (each a button: its shape, its name, "3 of 5"), then the hidden expanded section. Dots and level buttons were only
  on the expanded section and the card page.
- **The title expansion** opened that hidden section. **Without it,** the panel keeps its title, grade, blurb, status line and card names,
  but the menu would have had no way to the placement quiz and only the card pages for the challenges: hence the footer.
- **The plan to fit it** (as built): the chevron joined to the name's right end (one pill, two buttons); the footer under a dashed line;
  at 1366×650 the panels tighten so the tallest, Solve it, still fits with no scrolling; the popup placed by the script beside the name,
  flipping left near the right edge, under or above on a narrow window, kept inside the window; on a touch screen the chevron and names are
  44 px; the keyboard follows the usual menu pattern.

## Parts 3 and 4: what was where, and where it is now

| | Before | Now |
|---|---|---|
| Placement quiz | the bar at the top of the expanded section | "Find my level" in the footer of Count it, Build it, Solve it; none on Solve it Plus |
| "no placement quiz" line | in Solve it Plus's expanded section | gone |
| Timed challenges | ⏱ buttons on four cards (expanded section and card pages) | "⏱ Timed challenges" in Count it's footer: a list of all six |
| A card's levels | the expanded section (every card) or the card page | the card's popup (pointing, chevron, keyboard) or the card page |

- **The popup**: the card's name and its badge ("3 of 5"), then one row per level: "Level 3" and its name, its status (earned: gold with a
  star; placed: silver with a medal and "One problem earns it"; the current level ringed; open: a plain dot; locked: greyed, dashed, a
  lock, its name still showing, and the note "Finish Level 2 to open this." on pointing, focus or a tap), then See why it works where the
  card has it. A row opens its level; the name still opens the card.
- **Pointing:** opens after resting 0.25 s (a quick pass opens nothing); resting on another name moves it there; it closes 0.2 s after the
  pointer has left both the name and the popup (so the small gap can be crossed), on Escape, or on a click outside.
- **Where it opens:** to the right of the name (a little above its top); to the left for the last panel; moved up to stay inside a short
  window; under the name (or above) on a narrow window. It never covers its own name or the names below it (checked for 15 names at both
  sizes, and at 390 and 900 px wide).
- **Keyboard:** Tab: the name, then its chevron. Enter, Space or the down arrow opens the popup with the current level (or the first)
  focused; up and down, Home and End move; Enter opens a level; Escape closes it and returns to the chevron; Tab goes on to the next name.
- **Touch:** the chevron is 44 px wide (names and chevrons 44 px tall); a tap opens or closes the popup; a tap outside closes it; a tap on
  a name opens the card; a tap on a locked row shows its note.
- **Roles:** the chevron has `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` and a name ("Combine it: show its levels"); the
  popup is a `menu` of `menuitem` buttons, each named in words ("Level 3, bigger numbers, placed: one problem earns it"; "Level 5, all
  mixed, locked. Finish Level 4 to open this."; "…, the level you are on"). A locked row is `aria-disabled`.
- **For Build Z:** every row is a button. A locked row carries `data-locked` (its saved level) and `data-lock-pack`, and today a click,
  tap or Enter only shows its note; Test out can give it an action without redoing the popup.
- **Kept:** the statuses, shapes, "3 of 5", the one-time shine (a level that went from placed to earned shines when its popup opens; a
  key or click stops it; nothing moves under reduced motion, and the popup simply appears) and "New levels added!" (on the panel, and in
  the popup).

## Tests, sweeps and parity

- **Unit tests:** all pass (see the numbers in the summary). New: `tests/buildAB.test.js` (every card's chevron and popup, each row's
  words and status, a locked row, a fresh student, the shine and New levels added! in a popup, where a popup goes, the footers, that no
  challenge or quiz was lost and none added, the card pages without challenges, plain titles). Updated: Build W's cross-out geometry and
  styles test.
- **Real-browser sweeps, run locally before every push:** typing, drags, redraws and font size (`screenSweep`), the room round the Moves
  panel and the Add cross-out (`panelRoom`, the cross-out now measured from the glyphs' ink), and the menu (`menuSweep`, extended: the
  popup by pointing and not on a quick pass, its rows and statuses, a locked row's note, closing, a level opening from it, flipping near the
  edge at 768 and 650, the keyboard, touch, 390 and 900 px wide, the footers, no scroll at 1366×768 and 1366×650, reduced motion, the shine
  in a popup). All pass; no SKIP line.
- **Parity:** PASS on all five families. Problems, save codes, class-sheet records and the 25 scripted runs' traces are unchanged. The
  screens: 12 of the 70 differ from `main` before this build, each under the 0.2% tolerance, all Add cancel marks (listed one by one in
  `INTENDED-CHANGES.md`): `add-helpful-move`, `add-end`, `add-alone-teach`, `add-alone-stuck-1`, `-2`, `-3`, each at 1366×768 and
  1366×650. No home screen is in the screen set; the home screen differences are listed one by one there too.
