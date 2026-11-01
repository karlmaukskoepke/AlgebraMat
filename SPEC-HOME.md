# The home screen: Count it, Build it, Solve it, Solve it Plus (Karl, 2026-10-04; built)

**Four sections since 2026-10-31 (Build X, Part 0b).** Solve it is split in two: **Solve it** (7th grade, coral): Add to both sides,
Divide it, Flip everything, One-step equations, Two-step equations, Distribute, combine, solve. **Solve it Plus** (8th grade, lavender):
Variables on both sides, Distribute more, Strange solutions. Each title carries its grade as a small subtitle. Solve it Plus has no
placement quiz (its open section says so where the quiz would be). Where this spec says "three" panels or titles below, read four.
Pack ids, saved levels, save codes, the class sheet and every `?pack=` link are unchanged.

## 0. The main menu (Build X, 2026-11-01; built). This replaces §2's panels-as-buttons and §5's dropdown bar.
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
