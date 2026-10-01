# The Mat: Combine it pack, plus Flip It's mixed level (DRAFT for Karl's approval, 2026-10-01)

*Builds on SPEC.md (Flip It), SPEC-BOXES.md and SPEC-LASSO.md: same shell, rules (no timers, no penalties, hints after 3 wrong tries), storage and keyboard quick-keys. Only what's new is written here. Source: Karl's request of 2026-10-01 (SPEC-ROADMAP.md) and his answers the same day.*

## 1. What it teaches

**Combining integers by addition.** Flip It teaches that subtraction is adding the opposite. Combine it is the addition itself, without the flipping: given signed numbers added together, find the total.

- A **party** is two numbers with the same sign (they add up). A **battle** is two numbers with different signs (they cancel, and the bigger side wins).
- It sits **before Flip It on the pack map** (Karl): Combine it first, then Flip It, Group It, Boxes & Circles, and the rest.

## 2. The four levels

| # | Levels | Examples | How |
|---|---|---|---|
| 1 | A positive and a negative: **all battles** | `5 + (−8)`, `−7 + 3` | Modeled with + and − counters |
| 2 | Negatives and negatives: **all parties** | `−4 + (−6)` | Modeled with counters |
| 3 | **Three or more terms**, any mix | `5 + (−8) + 2`, `−3 + (−4) + 6 + (−2)` | Modeled with counters |
| 4 | **Larger values (11 to 60), no modeling** | `−23 + 41`, `37 + (−52)`, `−48 + (−19)` | Circle each term, then party or battle, add or subtract, and the sign |

- 5 problems per level, a fresh seed each play, **no repeated answers** in a set, and no zero answers (as Flip It's Levels 1 to 3).
- Levels 1 and 2 use the numbers 1 to 12 and lean small, as Flip It does. Level 1 mixes who wins (at least 2 positive and 2 negative answers). Level 3 uses 3 or 4 terms with numbers 1 to 9, at least 2 positives and 2 negatives overall, and at most 20 counters in all. Level 4 has two terms, each 11 to 60, with answers that can be positive or negative, and a mix of parties and battles (at least 2 of each).
- Problems print as Flip It prints them: the first number as it is (`−7`), then `+`, then the next number in parentheses if it's negative (`+ (−8)`).

## 3. Steps

**Levels 1 and 2** (two terms) are Flip It's steps without Rewrite: **Draw → Party or Battle → Cancel → Answer**. It's the same engine and Mat as Flip It: counters above each number, vermillion slashes on canceled pairs, and the Flip It number pad (± and digits, keyboard too). A party skips Cancel.

**Level 3** (three or more terms) is **Draw → Cancel → Answer**. There's no single party-or-battle question when several numbers are added, so that step is left out. The Mat is the Boxes & Circles Mat (counters in a column above each term, which fits up to 4 terms), with Boxes & Circles' Draw and Cancel (tap a piece, then its opposite, in either order), and Flip It's number pad for the answer.

**Level 4** (no counters) is **Circle → Party or Battle → Add or Subtract → Sign → Answer**:

1. **Circle.** Drag a circle (pill) around each term **with its sign or operation in front**, as in Boxes & Circles: the first number is circled with its own sign (`−23`), the second with the `+` in front of it (`+ 41`). Live highlighter selection, taps as a fallback, a dashed shape until it's whole.
2. **Party or Battle?** Same signs or different signs.
3. **Add or Subtract?** Party: add the values (ignore the signs). Battle: subtract the smaller from the larger. The buttons are **Add** and **Subtract**.
4. **Sign:** which sign does the answer have: **+** or **−**. For a party, the sign they share; for a battle, the sign of the bigger value.
5. **Answer.** Type the result with the number pad.

- The Mat shows the circled terms; each step's choice appears on the student's Kalam line as it's made (`battle`, `subtract: 41 − 23`, `sign: +`) so the reasoning stays visible and builds toward `18`.
- Wrong choices say what to look at without giving the answer (*"Look at the signs: same or different?"*). Retries are unlimited, and hints come after 3 wrong tries on a step.
- Hints: Circle (the terms still to circle blink), Party or Battle (both signs pulse, naming whether they match), Add or Subtract (the two values pulse and the hint says whether the signs matched), Sign (the bigger value blinks for a battle), Answer (the sign is named, not the number).

## 4. Flip It's mixed level (Karl)

A **Level 5** on the Flip It pack, so both operations show up as the final challenge there: **three to four integers, a combination of addition and subtraction**, for example `5 − (−3) + (−7)`, `−4 + 6 − 2 − (−5)`. *"There may be a Flip it step, or maybe it's all addition and there's nothing to flip. The variety is the point."*

- **Steps:** Rewrite → Draw → Cancel → Answer, on the Boxes & Circles Mat. Rewrite is Boxes & Circles' (tap the `−` in front and the sign of the number, both; the term then says "is +3" in magenta). **Nothing to rewrite** (key N) is the right move when every term is added. Draw, Cancel and the answer are as in Combine it's Level 3.
- **Variety rules:** each set of 5 has at least 1 problem with nothing to rewrite, at least 1 with a single subtraction, and at least 2 with two or more subtractions; some with a negative first number; no repeated answers; zero answers allowed (as Flip It's Level 4). Numbers 1 to 9, at most 20 counters in all.
- Unlocks after Level 4, and finishing it completes the pack (as Level 4 does now).
- Because Flip It gets a fifth level, its save-code bits grow by one (see §5).

## 5. Pack map, saving, hints

- **Pack id `combineit`,** the first card on the map (open from the start, 4 levels), ahead of Flip It. Cards stay equal-sized.
- **Save code v5:** Combine it takes 4 bits, and Flip It grows from 4 to 5. The layout becomes Flip It 5 + Group It 7 + Boxes & Circles 5 + Groups of Terms 8 + Combine it 4 = 29 bits, which needs 6 data symbols, so new codes are one character longer (`MAT-7` plus seven symbols). v1 to v4 codes still decode, with Flip It's new level and Combine it unfinished.
- Hints after 3 wrong tries, never making the move: Draw (faint dashed pieces), Party or Battle and Cancel and Answer as in Flip It and Boxes & Circles, plus the Level 4 hints in §3.

## 6. Build order (one step per cycle)

1. Combine it model and generator (Levels 1 to 4), Flip It's Level 5 generator, and save code v5, with tests.
2. Combine it Levels 1 and 2 playable through Flip It's engine (Rewrite skipped), the pack card, and the pack map order.
3. Level 3 and Flip It's Level 5 on the Boxes & Circles integer Mat (Draw, Cancel, Answer, with Rewrite for Level 5).
4. Level 4: Circle, Party or Battle, Add or Subtract, Sign, Answer.
5. Hints, animations and the touch audit.

## 7. Open questions for Karl

1. **Level 3's name and order:** I put the mixed three-or-more-terms level third, before the large-numbers level. OK?
2. **Level 4 with three terms?** I made it two terms (it needs one party-or-battle answer). Should a few problems have 3 terms (e.g. `−23 + 41 + (−15)`), where the student would circle three terms and the party-or-battle idea becomes "add the negatives, add the positives, then battle"?
3. **Flip It Level 5 and Party or Battle:** with 3 to 4 terms I dropped the party-or-battle question, as in Combine it's Level 3. OK?
4. **Mat for Level 3 and Flip It Level 5:** the Boxes & Circles Mat (counters in columns above each term). It looks like Boxes & Circles without the x terms. OK, or do you want it closer to Flip It's two-zone Mat?
