# The Mat: Distribute, then combine pack (approved 2026-10-02)

*Builds on SPEC-GROUPS-OF-TERMS.md (the lasso, deal-out and arrows check), SPEC-BOXES.md (Boxes & Circles) and SPEC-COMBINE.md: same shell, rules (no timers, no penalties, hints after 3 wrong tries), storage and keyboard quick-keys. Only what's new is written here. Source: SPEC-ROADMAP.md and Karl's answers of 2026-10-02.*

## 1. What it teaches

*"You can't combine until you know how many of each you have. Open the groups first!"* Two phases on one problem: **① distribute** (open the groups), then **② combine** (collect like terms). `2(3x − 4) − x + 5` → `6x − 8 − x + 5` → `5x − 3`.

A term's sign is the operation in front of it, **whether or not it's rewritten as adding the opposite** (Karl teaches both ways). So the pack never forces the rewrite: the circle step (as in Boxes & Circles) shows `5 − 7x` is a positive 5 and a negative 7x. The rewrite `+ −2(2x − 3)` appears only as the magenta note (§4).

## 2. The five rounds

| # | Form | Support |
|---|---|---|
| 1 | `A + B(Cx + D)` and `B(Cx + D) + A` (group first is not harder: it puts the distributing first, so students start there) | Full: lasso, deal-out and arrows check, then Boxes & Circles |
| 2 | `A + (Bx + C)` and `A − (Bx + C)` | Full, plus the invisible 1 (§3) |
| 3 | `A − B(Cx + D)`: B negative, integer A, C, D | Full; the sign trap |
| 4 | Mixed forms of rounds 1 to 3, larger values | Fading: type the distributed line and the answer; the Mat is optional (a **Show me** button opens the drawing), supports come as hints |
| 5 | Mixed forms, larger values, `B(Cx + D) − A`, groups on both sides of a term | Type only; supports show up as hints only |

- 5 problems per round, a fresh seed each play, no repeated answers in a set.
- Rounds 1 to 3 use small values so drawing stays fast: |B| ≤ 4, |C| ≤ 3, |D| ≤ 5, |A| ≤ 6. Rounds 4 and 5 can grow slightly (|B| ≤ 9, |C| ≤ 6, |D| ≤ 9, |A| ≤ 12).
- Answers are `Px + Q` with both parts nonzero except occasionally (never both zero). Problems where the x-terms cancel entirely are left out of rounds 1 to 3.

## 3. Steps (rounds 1 to 3)

**Draw the groups → check → combine:**

1. **Group** (Round 2 and 3 first, **Rewrite the 1**): in Round 2, the student writes the invisible 1 or −1 in front of the parentheses (the hidden-1 gap Group It pulses). In Round 3 the count is read from the circle, with its minus.
2. **Distribute.** Groups of Terms' lasso and deal-out on the group (the count of groups and the terms inside), ending with what the group makes, typed: `6x − 8`.
3. **Check it** (between ① and ②). Groups of Terms' simple multiplication arrows, show only.
3b. **Write it.** The whole line with the group opened, typed: `6x − 8 − x + 5` (every term in order, none combined; a term's sign is the operation in front of it). Built as its own step after Check it, so the check comes first, and the line is correct before ② starts: a wrong ① never carries forward.
4. **Circle the terms** (Boxes & Circles), with each term's sign or operation in front.
5. **Draw** the boxes and counters (small values), **Cancel** the opposite pairs.
6. **Answer** `5x − 3`, typed with the pad.

The steps strip across the top is labeled **① distribute** and **② combine**.

## 4. The magenta note: "subtract = add the opposite"

- **Rounds 2 and 3:** shown every time a group is subtracted (Karl left the call to me, so: always, for clarity), after the student has the sign: the `+ −2` underlined in magenta, as in the notes.
- **Also a hint** after a wrong distribution or after a negative group isn't noticed.
- **Rounds 4 and 5:** hints only.

## 5. Later rounds (4 and 5)

Scaffolding falls away slowly; the supports become internalized and appear as hints only (Karl). Hints keep the same ladder: nudge → pointer → the Mat step shown.

## 6. Pack map and save code

- **Pack map:** six open cards; **three over three** at the Chromebook sizes, equal-size cards, with scrolling in cards that have many levels (Karl: we can't keep going wider). The `packs-6` class replaces `packs-5`.
- **Save code v6:** `MAT-8`, one more symbol for Distribute (5 levels). v1 to v5 codes still decode. Id: `distribute-combine`.

## 7. Build order (one step per Go)

1. Engine and generators (`distribute.js`, `generateDistribute.js`) for all five rounds, with tests.
2. Round 1: session, Mat, controls and play adapter (distribute → check → combine).
3. Rounds 2 and 3: the invisible 1, the sign trap, the magenta note.
4. Rounds 4 and 5: fading supports, Show me, hints.
5. Pack map (three over three), save code v6, README and docs.
