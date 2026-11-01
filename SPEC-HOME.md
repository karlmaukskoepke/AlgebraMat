# The home screen: Count it, Build it, Solve it, Solve it Plus (Karl, 2026-10-04; built)

**Four sections since 2026-10-31 (Build X, Part 0b).** Solve it is split in two: **Solve it** (7th grade, coral): Add to both sides,
Divide it, Flip everything, One-step equations, Two-step equations, Distribute, combine, solve. **Solve it Plus** (8th grade, lavender):
Variables on both sides, Distribute more, Strange solutions. Each title carries its grade as a small subtitle. Solve it Plus has no
placement quiz (since Build AB it simply has no Find my level button). Where this spec says "three" panels or titles below, read four.
Pack ids, saved levels, save codes, the class sheet and every `?pack=` link are unchanged.

## 0a. Level popups and section footers (Build AB, 2026-11-01; built). This replaces §0's expanding section title.
- **The section title is a plain heading**; nothing expands from it (Karl, on the expanding title: "not exactly what I want"). The four panels
  keep their title, grade, blurb, status line and card names with their statuses.
- **Pointing at a card name** (resting a quarter of a second; a quick pass does nothing) **shows a small popup beside it** with the card's
  levels: each level's number and name, its status (plain; placed, silver with "One problem earns it"; earned, gold with a star; the
  current one ringed; locked, greyed with a lock and its name, and the note "Finish Level N to open this."), "See why it works" where the
  card has it, and the card's "3 of 5". **A level in the popup opens that level; the name still opens the card.** The popup opens to the
  right of the name, to its left when the right has no room (the last panel), under it (or above) on a narrow window; it stays inside the
  window (a popup taller than the window scrolls inside itself), never covers the name or the names below it, and closes when the pointer
  leaves both the name and the popup (after a fifth of a second, so the gap can be crossed), on Escape, and on a tap or click outside.
- **Touch and keyboard:** a small chevron (›) joined to the right end of each name (finger-sized, 44 px, on a touch screen) opens the same
  popup; a second tap closes it. Tab reaches the name, then its chevron; Enter, Space or the down arrow opens the popup with the current
  level (or the first) focused; the arrows, Home and End move between rows; Enter opens a level; Escape closes it and goes back to the
  chevron; Tab leaves it. Roles: the chevron has `aria-haspopup="menu"`, `aria-expanded` and an accessible name ("Combine it: show its
  levels"); the popup is a `menu` of `menuitem` buttons, each named in words ("Level 3, ax = b, placed: one problem earns it").
- **Every row is a button**, so a later build ("Test out", Build Z) can give a locked row an action: today a locked row carries
  `data-locked` (its saved level) and `aria-disabled`, and a click, tap or Enter only shows its note.
- **Each section's footer**, under a dashed line: **Find my level** (its placement quiz: "Find my level · 3 of 6 done" while one is under
  way, "· see results" once done) on Count it, Build it and Solve it, **not on Solve it Plus** (until the chained test-outs exist); and
  **⏱ Timed challenges** where a section has challenges, today Count it only, which opens a small list (Adding, Subtracting, Add &
  subtract, Multiplying, Big multiplying, Everything, each with its best score). "Everything" sat under Build it's Distribute, then combine
  card before; it is listed with Count it's now (a decision for Karl). The challenges and the quiz are no longer on the card pages.
- The one-time shine and "New levels added!" work in the popup too (a level that went from placed to earned shines when its popup opens).
- At 1366×650 the panels tighten (smaller title, card names at 16 px) so the tallest, Solve it with six cards and its footer, fits with no
  scrolling.

## 0. The main menu (Build X, 2026-11-01; built). This replaces §2's panels-as-buttons and §5's dropdown bar. (Its expanding section title
was replaced by §0a.)
- **Four panels**, each with its title (and grade), its blurb, its status line ("2 of 6 cards gold", or a gold "Every card gold") and its
  **card names** as a list. **A card name opens that card on its own** (its level set, big), with "← All sections" (or Escape) to go back.
- **A section title expands the whole section** over the panels (every card with its levels, and the placement quiz, or "no placement quiz"
  for Solve it Plus): by resting the pointer on it for a quarter of a second (a quick pass does nothing), by a click, by Tab (focus), or by
  a tap. It collapses when the pointer or the focus leaves it, on Escape, on a click or tap outside, on its Close button, or on a second
  tap or click on its title (shown again at the top of the expanded section). Enter on an open title steps into it. The top bar of section
  tabs is gone.
- **Metallic progress** (engine/status.js): every card is plain (a ring), green (a leaf, begun, under half of its displayed levels placed or
  earned), silver (a medal, half or more) or gold (a star, every displayed level earned), with "3 of 5". Level dots: plain, silver
  (placed), a gold star (earned), the current one ringed. A placed level's button says "One problem earns it". Anything that improved
  since the last look shines once (1.5 s; any key or click stops it; nothing moves under reduced motion). A card that shows more levels
  than before says "New levels added!" once.

## 1. Sections
- **Count it** (blue): Combine it, Flip It, Group It. **Build it** (green): Boxes & Circles, Groups of Terms, Distribute then combine, Value it. **Solve it** (light red): one-step, two-step and multi-step equations (cards that say "soon" until they are built). More number cards (fractions, whole numbers) will join Count it later.
- Pastels on the section panels, the bar and the cards; the ink stays dark.

## 2. How it works
- **First screen:** three big panels, each with its cards in small and how many levels are done (`2/5`). Tap one to open it.
- **Open section:** the three titles in a bar across the top (the open one wide and bold, the others small beside it, a short transition); the section's diagnostic; its cards.
- **Nothing stays open (Karl, 2026-10-08).** The home screen is always the three panels with the top menu; no section is remembered or left open, and no title is wider than the others. Coming back from a level, the diagnostic or a challenge lands on that same first screen.
- Four cards in a section sit two across on a computer. On a phone the title is small, the tagline is dropped and the three buttons share a row, so the choice is on the first screen.
- Hover is only decoration; everything works by tap or click.

## 3. A diagnostic for each section
- **Count it:** 6 problems (Combine it, Flip It, Group It, two each). **Build it:** 8 (Boxes & Circles, Groups of Terms, Distribute then combine, Value it, two each). **Solve it:** 4 problems, two each from One-step equations (`x − a = b` and `x / a = b`) and Two-step equations (`ax − b = c` and `b − ax = c`); the answer line reads "x =". It grows as the Multi-step card arrives. Each opens the levels it recommends, as before.
- Saved separately (`mat.diag.v2`). The old single diagnostic is split between the two the first time: every answer keeps its problem (same seed), and the two new Value it problems show as "6 of 8 done".

## 5. Dropdown menus (Karl, 2026-10-08; built)
The section bar is on the home screen at all times. Resting the mouse on a title for **0.2 seconds**, or a click or tap on it (or on its big panel), rolls down that section's **full cards** (the same cards, level buttons and fluency challenges; its diagnostic button on top; coming-soon cards beneath), "big and beautiful". **Moving the mouse off the menu rolls it back up at once**, back to the first screen; moving to another title rolls that one down instead, without the wait. Touch screens (no hover): a tap opens or closes it; Escape closes it. Only on the home screen, not inside a level. The three landing panels remain the first screen.

## 4. Not built
- A teacher-chosen order or hiding of sections; section-level fluency; a sign-in prompt on the first screen.
