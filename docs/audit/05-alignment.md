# 05 · Aligning Count it, Build it and Solve it (draft)

*Karl (Q5): the home screen and card menus are the same across sections; lesson screens vary naturally. So rows 1, 3, 4 apply to the shared frame only, not to how each card teaches.*

*Draft: several recommendations depend on Q5 in `04-inferences.md` (how far to align). Nothing here is applied. Evidence: screenshots taken at 1366×768 of Combine it L2, Group It L6, Boxes L3, Value it L2, Add L1/L5, Divide L1/L5, One-step, Two-step, and the code cited.*

**Cost:** S = an hour or two, M = a day, L = several days. **Save risk:** whether students' saved progress could be affected.

| # | Area | Count it | Build it | Solve it | Suggested convention | Cost | Save risk | Deliberate or drift? | Recommendation |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Screen layout | Centred column about 960 px; Mat (SVG, scales to fit) in the middle; pad at the bottom | Same as Count it | Add: centred column, stack left, panel right, **overflows** 1366×768. Divide: **full width**, three columns (stack, picture, panel) | One frame for every card: header, line, work area, help, pad. One width rule (full width on Solve it is needed for the panel; Count/Build can stay centred inside the same frame) | M | None | Add vs Divide width: drift. Solve vs others: partly deliberate (the move panel) | Adopt the frame; fix Add first (it fails fit) |
| 2 | Header and dots | "← Packs", TITLE upper-case, **Streak**, dots, Save code | Same | Same header, no streak | "<Card> · Level n" as the loop says (not upper-case); "← Home" (the home screen is sections now, not "packs") | S | None | "Packs" is left over from the pack map (drift); streaks retired only on Solve it (deliberate) | Change words now; streaks depend on Q5 |
| 3 | The prompt line | Plain large text **under** the Mat (`#feedback`) | Same | Yellow box **at the top**, full width, buttons inside (loop §2) | One line component; position at the top for all (the eye starts there) | M | None | Deliberate for Solve it; open for the others | Ask (Q5); if B, move it |
| 4 | Help | I'm stuck, Teach me, **"?" tour** and support buttons in the bottom palette; Distribute uses **"Show me"** | Same | Help row in the Mat: I'm stuck, Teach me step-by-step, Start over | One help row, same three words everywhere, same place; drop "Show me" for "Teach me" or define the difference | M | None | Different help ladders are deliberate pedagogy; the different places and words are drift | Same place and words; keep each card's ladder |
| 5 | Colour | Meaning tokens (`--opposite`, `--cancel`, `--groups`, `--inside`) in `style.css:3-7` | Same tokens | Hex values written out (`#0072b2` ×31), purple accent only on `.sv-card` | Tokens for every meaning colour: `--op` (operation blue), `--accent` (step highlight), `--good`, `--bad`, `--target`; never a raw hex in a card rule | S-M | None | Drift | Do it early (it's what makes "the operation is blue everywhere" checkable) |
| 6 | Typography | Kalam for the problem, Lexend for words | Same | Same fonts; equation sizes differ between Add and Divide (`is-long`, `is-xlong`) | One type scale (problem, line, row, small label) in tokens | S | None | Drift | With 5 |
| 7 | Names and words | Combine **it**, Flip **It**, Group **It** | Value **it**, Boxes & Circles, Groups of Terms, Distribute, then combine | Add to both sides, Divide **it**, One-step, Two-step | One capitalisation ("Flip it", "Group it"); rename the Solve it "Flip it" before it is built (I11, decided) | S (labels) / M (if an id changes) | **Yes if a pack id changes** (ids key the save code and the sheet). Change titles only, never ids | Drift | Titles only; never rename an id |
| 8 | Introductory levels | Spotlight tour on first visit | Tour; Boxes L2 "read the model" | Numeric L1 on new cards; old cards none | Keep per section (deliberate); one rule: the first thing a student sees on any card tells them where to click | S | None | Deliberate | Keep |
| 9 | After an answer | Correct: celebrate, **auto-advance after 2.5 s**; wrong: slip named, support added | Same | Substitution shown line by line, green Next, nothing on a timer | Nothing advances on a timer, anywhere | S | None | Timer in Count/Build: drift from your own principle (inferred) | Remove the timer everywhere (one line in `main.js:517-518`); ask in Q5 |
| 10 | Levels and saves | One bit per level; diagnostic per section | Same; Value it reserves 5 bits for 4 levels | Same; One-step reserves 8 for 5, Two-step 8 for 7 | Reserve spare bits for every card at its next save-code version | S | Only at a version change | Consistent | Keep; add "skipped" and "opened" to the code at the next version (03 §C.4) |
| 11 | Accessibility (colour never alone) | Magenta always with an underline, vermillion always with a slash (`style.css:4-5`) | Same | Step highlight: colour + underline (good). **Operation blue: colour only**; Why? lights: check they also show ✓/✗/– | Every meaning colour has a second signal (underline, mark, shape) | S-M | None | Blue-only is drift from Count it's own rule | Add a second signal to the operation blue (e.g. bold) or confirm the lights carry marks |
| 12 | Chromebook fit | Fits at 1366×768 and 1366×657 | Fits | Add L5 overflows by 187 px at 768; Divide fits at 768, overflows by 87 at 657; both L1s overflow at 657 | Test at 1366×657; the pad and help row are always visible | M | None | Drift | Make 1366×657 the fit test (I16) |
| 13 | Low-ink printables | No print styles in the app (none found: no `@media print`) | Same | Same | If a screen is ever printed: no grid paper, no filled line box, outlines only | S | None | n/a | Add a print stylesheet only if you print screens |
| 14 | Tone | Short, direct ("Type the answer with the pad, then Check.") | Same | Same voice; Party!/Battle! shared | One voice: second person, one sentence, says where to click | S | None | Consistent | Keep; put shared sentences in one table |

## Proposed one-page section style guide (not applied)

1. **Frame.** Header ("<Card> · Level n", five dots, Save code, ← Home) · the line (top, full width, coloured box, one sentence, its buttons inside) · the work area · the help row (I'm stuck, Teach me step-by-step, Start over) · the number pad. Same on every card.
2. **Fit.** At 1366×657 the pad and help row are visible with no page scroll. Room is reserved; nothing reflows.
3. **Colour tokens only.** `--op` blue for the operation, `--accent` purple for the step highlight, `--good` green, `--bad` red, `--target` for the one place to click; Count it's meaning colours as they are. Every colour has a second signal.
4. **Type scale.** Kalam for anything the student would write on paper; Lexend for instructions and buttons; four sizes only.
5. **One target.** Exactly one highlighted thing at a time; a blinking cursor only where the student is about to type.
6. **No timers.** Every pause ends with a green Next.
7. **Words.** Card names in sentence case ("Group it"); the notes' vocabulary (box, counters, border, Party!, Battle!); never "take away from both sides".
8. **Saves.** Never rename a pack id; never change a level count without a migration and a save-code version.
9. **Print.** Outlines, no fills, no grid.
10. **Reuse.** Before building a piece, check the registry.
