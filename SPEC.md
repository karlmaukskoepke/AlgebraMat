# The Mat — Build Spec v1 (Engine + "Flip It" pack)

*Working name. Final site name and URL (planned under grafables.com) still to be decided.*

## 1. What this is

A practice site where students act out, by tapping, the same modeling moves they do on paper in Mr. Mauks's notes: drawing +/− counters above numbers, rewriting subtraction as adding the opposite, deciding Party or Battle, and canceling pairs.

The site checks each **move**, not just the final answer. Students can't get past a step with a missed sign.

It is built as **one engine plus content packs**. Version 1 ships the engine and one pack, **Flip It** (subtracting, especially subtracting a negative). Later packs, starting with Lasso, reuse the same engine.

### Audience and constraints

- 7th/8th graders on Chromebooks, trackpad or touchscreen.
- Some students work slowly:
  - **no timers**
  - no penalties for wrong moves
  - all numbers small (|n| ≤ 12)
- No accounts and no student tracking. Progress is saved in the browser, plus an optional save code.

## 2. Tech stack

| Area | Choice |
|---|---|
| Build | Vite + vanilla JavaScript (ES modules). No UI framework. |
| Rendering | Inline SVG for the Mat (crisp at any zoom, easy to animate). HTML/CSS for buttons and panels. |
| Tests | Vitest for all pure logic: generator, validators, save code. CI runs the tests on every push (GitHub Actions). |
| Deploy | GitHub Pages via GitHub Action. Vite `base` must be configurable, because the final URL may be a sub-path of grafables.com. |
| Fonts | Lexend (printed type) and Kalam (the "handwritten" type used for student work), both from Google Fonts. |

### Architecture

Keep the logic in `src/engine/` free of any DOM code, so it is fully testable.

```
src/
  engine/        # pure logic, no DOM
    expr.js      # expression model: terms, ops, signs
    moves.js     # move validators, return {ok, feedbackKey}
    generate.js  # seeded problem generators with constraints
    progress.js  # progress object, save-code encode/decode
  view/          # DOM + SVG only
    mat.js       # renders the Mat and counter zones
    controls.js  # palette, buttons, number pad
    feedback.js  # messages, animations
  packs/
    flipit.js    # levels, problem specs, step script
  storage.js     # localStorage wrapper (try/catch)
  main.js
tests/
```

## 3. Visual design (match the printed notes)

**Background:** white with a light graph-paper grid: 24px squares, lines `#E6ECF3`, every 5th line `#D5DEE9`.

**Color meanings.** These are the same as the notes. Never use them decoratively.

| Color | Hex | Meaning |
|---|---|---|
| Ink | `#1D1D1D` | Default text and counters |
| Blue | `#0072B2` | How many groups (not used in Flip It) |
| Green | `#009E73` | Inside a group (not used in Flip It) |
| Magenta | `#B8508F` | Opposite. Always paired with an underline. |
| Vermillion | `#D55E00` | Cancel. Always shown as a slash through a counter. |

**Counters:** drawn as stroked `+` and `−` marks with round caps (not text glyphs), about 22px in size. They sit above their number, as in the notes, in a balanced grid at most 4 across (see §5 ② Draw).

**Canceling:** a vermillion slash through each canceled counter.

**Type:**
- The problem is in Lexend 600, large (≈48px on a Chromebook screen).
- The student's rewritten line is in Kalam 700.

**Touch targets:** at least 44×44px. Nothing depends on hover. Every color cue has a shape cue as well (underline, slash).

## 4. Screen layout

```
┌──────────────────────────────────────────────────────────────┐
│ ← Packs   FLIP IT · Level 2        ● ● ◐ ○ ○       Save code │
├──────────────────────────────────────────────────────────────┤
│  ① Rewrite  ② Draw  ③ Party or Battle?  ④ Cancel  ⑤ Answer    │  step bar
│                                                              │
│                 [counter zone]      [counter zone]           │
│                        5      −     (−3)                     │  the problem
│                        5      +     (+3)                     │  rewritten line
│                                                              │
│  feedback line (one sentence, friendly)                      │
├──────────────────────────────────────────────────────────────┤
│ Palette: [ + ] [ − ]     [Party!] [Battle!]     [ Check ✓ ]  │
└──────────────────────────────────────────────────────────────┘
```

- Only the controls for the current step are enabled. The others are visible but dimmed, so students see the whole path.
- The step bar mirrors the numbered steps in the notes.

## 5. The moves (engine v1)

Each move has a validator in `engine/moves.js` that returns `{ ok, feedbackKey }`. Feedback text lives in one table, so it is easy to edit.

### ① Rewrite

- Applies when the operation is subtraction.
- Tapping the **operation** `−` flips it to `+`.
- Tapping the **number's sign** flips it (−3 → +3, or 6 → −6).
- **Both flips are required.** After one flip, the step stays open and the feedback says: *"Flip both signs!"*
- Flipped pieces turn magenta and get an underline, with a short flip animation. Tapping a flipped piece undoes it.
- *(Build decision)* Flipping happens on the student's Kalam line under the problem; the printed problem line never changes. On an addition problem, tapping a sign flips nothing and shows the message below.
- **"Nothing to rewrite" button:** when the problem is addition, the correct move is to press this button instead of flipping. This keeps students from flipping everything blindly.
  - If they flip on an addition problem: *"It's already addition — nothing to rewrite."*

### ② Draw

- The student selects `+` or `−` in the palette, then taps a counter zone to add one counter per tap. Tapping a counter removes it.
- Each zone holds up to 12 counters, above its number. Up to 4 sit in one row; more form a balanced grid, never more than 4 across, with wider rows nearest the number (6 = 3 × 2, 7 = 4 + 3, 12 = 4 × 3).
- Counters for the flipped (opposite) number are drawn in magenta, as in the notes.
- *(Build decision)* While drawing, counters fill rows of 4 from the bottom, left to right, so nothing moves once placed. After Check passes, the zone tidies into the balanced grid.
- **Check** validates that each zone has the right **type** and **count**. Feedback is specific, for example:
  - *"That number is −3, so it needs 3 negatives."*
  - *"Count again — you have 4, the number is 5."*

### ③ Party or Battle

- The student chooses **Party!** (same signs → add) or **Battle!** (different signs → cancel).
- Wrong choice: *"Look at the signs — are they the same or different?"*

### ④ Cancel (Battle only)

- The student taps one `+` and one `−`, and the pair gets vermillion slashes.
- Tapping two of the same sign does nothing, with a small shake and *"A pair is one + and one −."*
- The step is complete when only one kind is left.
- *(Build decision)* The first tap selects a counter (dashed ring); the second tap pairs it. Tapping the selected counter again deselects it. After a same-sign tap, the first counter stays selected.
- Party problems skip this step (it shows as done).

### ⑤ Answer

- The student uses an on-screen pad: a `±` toggle plus digits.
- Correct answer: celebrate briefly, then go to the next problem.
- Wrong answer: *"Count who is left."* Unlimited retries.
- *(Build decision)* The answer appears after an `=` on the student's Kalam line. The pad takes up to 2 digits. After a correct answer, the next problem loads after 2.5 s, or right away with **Next →**.

**General rules:**
- There is never a penalty.
- After 3 wrong tries on the same step, show a hint that demonstrates the move (for example, the flip animates itself). The student still has to do it.

## 6. Flip It pack

Each level has 5 problems, generated with a seed. All |values| ≤ 12, and there are no zero answers until Level 4.

| Level | Problem type | Example | Notes |
|---|---|---|---|
| 1 | positive − (negative) | 5 − (−3) | Always a Party after rewriting |
| 2 | negative − (negative) | −2 − (−6) | Always a Battle after rewriting. Mix of positive and negative answers |
| 3 | number − positive | 2 − 6, −4 − 5 | Flip to + (−6) |
| 4 | Mixed | 3 − (−2), −4 + (−5) | Includes 1–2 addition problems (answer: "Nothing to rewrite"). Zero answers are allowed. |

**Generator rules:**
- Operands are nonzero with |n| ≤ 12. Answers are not capped (up to 24).
- Within a set of 5: no two problems share an answer (so no repeated problems either).
- Levels 1–2 lean toward small numbers: problems with both numbers in 1–6 are 6× as likely to be picked. Numbers 7–12 still appear.
- Level 2: at least 2 positive and at least 2 negative answers.
- Level 3: at least 2 Party (negative first number) and at least 2 Battle (positive first number).
- Level 4: 1 or 2 addition problems, the rest subtraction with any signs.
- A new seed on each play gives a fresh set; the same seed always gives the same set. Keeping the current seed across a reload is part of Step 6 (storage).

**Unlocks:**
- Finishing a level unlocks the next one.
- Finishing Level 4 marks the pack complete. It also shows the **Lasso** pack card as "Coming soon" (not playable in v1).

**Pack map (home screen):** cards for Flip It (open) and Lasso (locked, "Coming soon"). Each card shows its level dots.

*(Build decisions, Step 5)*
- The Lasso card is always on the pack map, locked and marked "Coming soon". When Level 4 is finished, the Flip It card shows **Complete ✓**, and the level-complete panel says Lasso is coming soon.
- Students pick a level from buttons on the pack card. Finished levels can be replayed; locked levels are dimmed and can't be tapped.
- Finishing the 5th problem shows a level-complete panel with **Level N+1 →** and **Pack map**. After Level 4, it shows **Play Level 4 again** and **Pack map**.
- **← Packs** in the middle of a level leaves without penalty. Coming back starts a fresh set of 5.
- `?level=N` (with or without `?seed=`) opens a level directly, ignoring locks, so a teacher can project a specific level.

## 7. Progress and save code

**localStorage.** One key, `mat.v1`, holding JSON:

```json
{ "v": 1, "packs": { "flipit": { "levels": [true, true, false, false] } } }
```

- Every read and write is wrapped in try/catch. If storage is unavailable, the site still works and shows a quiet note that progress won't be remembered.

**Save code.** A "Save code" button shows a short code, for example `FLP-7K2Q`, that encodes the progress object.

- Use a base32 alphabet without look-alike characters (no 0/O, 1/I/L), plus a checksum character.
- The home screen has "Enter code" to restore on any device. A bad code shows: *"That code doesn't look right — check each letter."*
- The encoding must leave room for future packs (versioned payload).

## 8. Required tests (Vitest)

- **Generator:** every level's problems meet its constraints (types, |n| ≤ 12, no zero answer before Level 4). Same seed gives the same problems.
- **Rewrite:**
  - Only both flips pass.
  - One flip fails with `flipBoth`.
  - Flipping on an addition problem fails with `alreadyAddition`.
  - "Nothing to rewrite" passes only on addition problems.
- **Draw:** type and count validation, including the magenta zone after a flip.
- **Party/Battle:** correct for every sign combination.
- **Cancel:** same-sign pairs are rejected. The step completes exactly when one kind remains.
- **Answer:** accepts only the correct signed integer.
- **Save code:** round-trip for all progress states. A bad checksum is rejected.
- **Storage:** works (in memory) when localStorage throws.

## 9. Build order for Claude Code (one step at a time; test each before moving on)

1. Scaffold Vite, Vitest, the GitHub Pages deploy action, and a "hello" page on the graph-paper background.
2. `engine/expr.js` and `generate.js`, with tests.
3. Render one hard-coded problem on the Mat (static SVG, notes styling).
4. Moves one at a time: Rewrite → Draw → Party/Battle → Cancel → Answer. Each move gets its validator and tests first, then the UI.
5. Level flow (5 problems per level), progress dots, level unlocks, pack map.
6. localStorage and save code, with tests.
7. Polish: flip and cancel animations, hints after 3 tries, touch-target audit on a Chromebook.

## 10. Out of scope for v1

- Lasso and all other packs (only a locked card appears).
- Integer Wars linking.
- Sound.
- Teacher dashboard or any data collection.
- Variables and boxes. Leave room in `expr.js` for a `term.kind = 'x'` later.

## 11. Open decisions

- Site name and final URL. It needs to be on the same domain as Integer Wars if they will share progress later.
- Whether to have sound effects (default off, if added).
