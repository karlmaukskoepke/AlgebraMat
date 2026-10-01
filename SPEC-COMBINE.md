# The Mat: Combine it pack, plus Flip It's mixed level (approved 2026-10-01)

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
| 4 | **Larger values (11 to 60), no modeling** | `−23 + 41`, `37 + (−52)`, `−48 + (−19)`; some with three terms: `−23 + 41 + (−15)` | Circle each term, then party or battle, add or subtract, and the sign (three terms: combine the negatives and the positives first, then battle) |

- 5 problems per level, a fresh seed each play, **no repeated answers** in a set, and no zero answers (as Flip It's Levels 1 to 3).
- Levels 1 and 2 use the numbers 1 to 12 and lean small, as Flip It does. Level 1 mixes who wins (at least 2 positive and 2 negative answers). Level 3 uses 3 or 4 terms with numbers 1 to 9, at least 2 positives and 2 negatives overall, and at most 20 counters in all. Level 4 has terms of 11 to 60, with answers that can be positive or negative. Of the five, **two have three terms**, and the other three have two terms (at least one party and at least one battle among them); the three-term problems (Karl: *"combine negatives and positives, then battle"*) always have two of one sign and one of the other, so the combining is a party and the last step is a battle. The odd one out can be in any position.
- Problems print as Flip It prints them: the first number as it is (`−7`), then `+`, then the next number in parentheses if it's negative (`+ (−8)`).

## 3. Steps

**Levels 1 and 2** (two terms) are Flip It's steps without Rewrite: **Draw → Party or Battle → Cancel → Answer**. It's the same engine and Mat as Flip It: counters above each number, vermillion slashes on canceled pairs, and the Flip It number pad (± and digits, keyboard too). A party skips Cancel.

**Level 3** (three or more terms) is **Draw → Cancel → Answer**. There's no single party-or-battle question when several numbers are added, so that step is left out. The Mat is the Boxes & Circles Mat (counters in a column above each term, which fits up to 4 terms). **When the mouse is over a zone you can tap, a dashed line shows the whole zone** (Karl's request). It uses Boxes & Circles' Draw and Cancel (tap a piece, then its opposite, in either order), and Flip It's number pad for the answer.

**Level 4** (no counters), two terms: **Circle → Party or Battle → Add or Subtract → Sign → Answer**:

1. **Circle.** Drag a circle (pill) around each term **with its sign or operation in front**, as in Boxes & Circles: the first number is circled with its own sign (`−23`), the second with the `+` in front of it (`+ 41`). Live highlighter selection, taps as a fallback, a dashed shape until it's whole.
2. **Party or Battle?** Same signs or different signs.
3. **Add or Subtract?** Party: add the values (ignore the signs). Battle: subtract the smaller from the larger. The buttons are **Add** and **Subtract**.
4. **Sign:** which sign does the answer have: **+** or **−**. For a party, the sign they share; for a battle, the sign of the bigger value.
5. **Answer.** Type the result with the number pad.

**Level 4 with three terms** (two of the five problems): **Circle → Combine → Party or Battle → Add or Subtract → Sign → Answer**. After circling all three terms, **Combine** the two that share a sign: they're a party, so the student adds their values and types the result with its sign (`−23 + (−15) = −38`). That leaves two numbers of opposite signs (`−38` and `+41`), and the rest is the two-term steps (a battle, subtract, the sign, the answer).

- The Mat shows the circled terms; each step's choice appears on the student's Kalam line as it's made (`battle`, `subtract: 41 − 38`, `sign: +`) so the reasoning stays visible and builds toward `3`.
- Wrong choices say what to look at without giving the answer (*"Look at the signs: same or different?"*). Retries are unlimited, and hints come after 3 wrong tries on a step.
- Hints: Circle (the terms still to circle blink), Combine (the two terms with the same sign blink), Party or Battle (both signs pulse, naming whether they match), Add or Subtract (the two values pulse and the hint says whether the signs matched), Sign (the bigger value blinks for a battle), Answer (the sign is named, not the number).

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

1. Combine it model and generator (Levels 1 to 4, including the three-term Level 4 problems), Flip It's Level 5 generator, and save code v5, with tests.
2. Combine it Levels 1 and 2 playable through Flip It's engine (Rewrite skipped), the pack card, and the pack map order.
3. Level 3 and Flip It's Level 5 on the Boxes & Circles integer Mat (Draw, Cancel, Answer, with Rewrite for Level 5).
4. Level 4: Circle, Combine (three terms), Party or Battle, Add or Subtract, Sign, Answer.
5. Hints, animations and the touch audit.

## 7. Settled (Karl, 2026-10-01)

1. The three-or-more-terms level is third, before the large-numbers level.
2. Level 4 includes three-term problems: combine the negatives and the positives, then battle.
3. No Party or Battle question when there are three or four terms (Combine it's Level 3 and Flip It's Level 5).
4. Levels 3 and 5 use the Boxes & Circles Mat (counters in a column above each term), with a dashed line around the zone under the mouse. (Built already for Boxes & Circles' Draw zones.)
5. Combine it comes before Flip It on the pack map.

## 8. Build decisions, step 1 (model, generators, save code v5)

- **Two models.** Levels 1 and 2 are Flip It's two-term problems (`engine/expr.js`, `5 + (−8)`) so Flip It's engine and Mat can run them. Everything longer (Level 3, Level 4, and Flip It's Level 5) is an expression of integer terms from `engine/terms.js` (each `{ kind: 'int', op, value }`), written `5 + (−8) + 2` or `5 − (−3) + (−7) − 2`. `engine/combine.js` holds the helpers: total, the subtracted terms, counters drawn, party or battle, and for Level 4's three terms which pair to combine first (`combineFirst`).
- **Flip It's Rewrite on Level 5 flips every subtraction,** `− 2` as well as `− (−3)`, as Flip It does (it's adding the opposite); that's wider than Boxes & Circles' Rewrite, which only flips `− (−7)`.
- **Generator limits:** Levels 1 and 2 use the numbers 1 to 12 and lean small (both numbers 1 to 6 are 6× as likely). Level 1 has at least 2 positive and 2 negative answers. Level 3 has 3 or 4 terms (at least 2 of each) with 1 to 9, both signs in every problem, at most 20 counters, and at least 2 positive and 2 negative answers. Level 4 has at least one two-term party, one two-term battle and two three-term problems, all terms 11 to 60. Flip It's Level 5 has 3 or 4 terms with 1 to 9, at most 20 counters, and in each set at least one with nothing to rewrite, one with one subtraction, two with two or more, and one with a negative first number. Zero answers are allowed only in Flip It's Level 5.
- **Save code v5** (`MAT-7` plus seven symbols) is Flip It 5 + Group It 7 + Boxes & Circles 5 + Groups of Terms 8 + Combine it 4 = 29 bits, with 6 data symbols. Flip It's fifth bit and Combine it's four are read and dropped until those packs open. v1 to v4 codes still decode.
- **Not visible yet:** this step is engine only.

## 9. Build decisions, step 2 (Levels 1 and 2 playable, the pack card)

- **Levels 1 and 2 play on Flip It's engine and Mat** with Rewrite left out: **Draw → Party or Battle? → Cancel → Answer** (a Party skips Cancel). The step bar lists those four, the palette has no *Nothing to rewrite* button, and Flip It's messages and hints are used as they are (every Draw, Party or Battle, Cancel and Answer message already read right for an addition).
- **The Mat** draws the problem once (`−1 + 3`) with the counters above it, and under it only the answer in the problem's columns (`=` under the `+`, the answer under the second number), since there's no rewritten line to show.
- **The pack card** is open from the start as the **first card** (ahead of Flip It), pack id `combineit`. **It lists only the two levels that are built** (a card with unplayable levels would be a dead end for students), and Levels 3 and 4 are added as they're built. Progress and save codes already have room for all four (save code v5), so nothing about saved progress changes then.
- **Pack map, five cards:** at 1280px or wider all five packs sit in one row (cards about 235px wide, equal size). To fit, level buttons go **one to a row in a list that scrolls inside the card** (four and a half rows show, so the next one peeks out), the long blurb is left out, and each card's dots sit under its title so the cards line up. Between 1100 and 1279px the cards go three across (the page scrolls); narrower screens are as before. The page doesn't scroll at 1366 × 657 or 1280 × 610.
- **Fix to the hover outline (Boxes & Circles):** rounding the zone's corners on hover made the pointer flicker in and out near the corners. The corners are now always rounded, and hover only changes the line and tint.

## 10. Build decisions, step 3 (Combine it Level 3, Flip It Level 5)

- **Both run on Boxes & Circles' steps and Mat** with counters only: a column of counters above each number, as in the notes. The problem carries a `mode`: `integers` (Combine it Level 3: **Draw → Cancel → Answer**) or `integers-flip` (Flip It Level 5: **Rewrite → Draw → Cancel → Answer**). The Box & Circle step is left out, since there are no x terms to box and circle.
- **Draw** works as in Boxes & Circles (pick + or −, tap above a number; tap a counter to take it away; Undo; the dashed hover outline), but the palette has only the + and − counters (no box pieces, no Box and Circle tools) and the Mat shows no mystery-box key. Check names the first number that's off (*"This term is + (−8), so it needs 8 negatives."*).
- **Cancel** is Boxes & Circles': tap a + and then a −, from any numbers, in either order. When everything is canceled (or nothing cancels) it goes on by itself.
- **Answer** is one number, typed with the digits and a − (the x and + keys are gone; the keyboard's − works). Wrong answers say what to count (*"Count the counters that are left: are they positive or negative, and how many?"*), never the number. **A total of zero is typed as 0** (it can happen in Flip It's mixed level).
- **Rewrite (Flip It Level 5)** flips **every subtraction**: tap the `−` in front and the number after it (`− 2` and `− (−3)` alike); both must flip. A flipped part turns magenta, the term says "is −2" or "is +3" under it, and its counters are drawn magenta. **Nothing to rewrite** (key N) is right when every term is added. This is wider than Boxes & Circles' Rewrite, which only flips `− (−7)`; a term says so itself (`flip`), so Boxes & Circles is unchanged.
- **Messages and hints** for integers are their own table (`integerFeedback.js`), falling back to Boxes & Circles': the Draw hint shows dashed counters, the Cancel hint blinks a + and a −, and the Answer hint names the sign of what's left (never the count).
- **Pack lists:** Combine it now lists **three levels** (Level 4 comes next). **Flip It has five** (Level 5, "add and subtract, 3 or 4 numbers", last). Finishing Level 5 is what completes Flip It now; students who had finished the first four see Level 5 open, and the pack shows Complete again once they've done it.
- **Adapters per level:** a pack can use a different play adapter for some levels (Combine it Levels 1–2 are Flip It's two-term engine; Level 3 and Flip It's Level 5 are the integer steps).
- **Touch:** every target is at least 44px at 1366 × 657 and 1280 × 610, checked on the most crowded Level 3 and Level 5 problems (four terms, up to 20 counters).

