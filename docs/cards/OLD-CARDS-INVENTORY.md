# Solve it: the old cards, the shared loop, and what the new cards need (read-only inventory, 2026-10-20)

## Plain summary

- Solve it today shows four cards and one "coming soon" card: **Add to both sides** and **Divide it** (both on the new shared loop), then the older **One-step equations** and **Two-step equations**, then **Multi-step equations (soon)**. A fifth old card, **Switch sides**, is already off the home screen, but its links still work.
- The old One-step and Two-step cards only ask students to type x, with help pictures. They have no moves. Nothing in them can be reused as a loop card except their problem lists and their finished-level records.
- **Flip it is not built.** Its spec is there, but there's no card, no level and no help for it. Small parts exist: a Flip button and its light are drawn but greyed, the hidden Distribute drill can multiply by −1, and Divide it explains −1 without doing it.
- Reusable now: the loop itself, the Add move, Divide's fraction move with its dealing help, dragging terms (crossing x across is coded but no card uses it), and combining terms by hand. Distributing and multiplying by a whole number or −1 work only in the hidden drill, not on the loop.
- Sizes: **Flip it**, **Two-step** and **Multiply** are medium, mostly configuration plus new equation shapes. **Distribute + combine + solve** and **Variables on both sides** need new engine work.
- Students keep their progress. Old levels stay saved, and a new card can credit them the same way Add and Divide already do. An old card should be hidden ("retired") when its replacement goes live, never deleted from the card list, or its saved levels are dropped.
- Karl decides: the Flip it name (Count it already has a "Flip It"), how old levels count toward the new cards, the build order, and when the old cards go.

---

Evidence key: **obs** = I saw it in the file at that line; **inf** = I inferred it (reason given). Paths are relative to the repository root. Read against `main` after Build F, Part 1 (no Add answer of 0 or ±1; the generators' row and slip-collision reports); line numbers are from that commit and may drift as Build F goes on.

## 1. What exists today

### 1A. The Solve it section (home screen)

Section `solve`, "Solving equations", cards in this order: `add-both`, `divide-it`, `one-step`, `two-step`, `multi-step` (obs: `src/packs/index.js:180`). Students reach a card from the home screen's Solve it panel or tab (obs: `src/view/packmap.js:91-127`). A retired card is not listed in any section, but a `?pack=` link still opens it (obs: `src/main.js:629-631` starts any pack that has an adapter; `retired` is checked only when resuming, `src/main.js:615`).

| # | Card (title / id) | Menu flags | Engine and adapter | Saved levels | Shown on screen |
|---|---|---|---|---|---|
| 1 | **Add to both sides** / `add-both` | `firstLevel: 2`, `whyLevel: 1` (obs `packs/index.js:108-118`) | Loop card `src/engine/cards/add.js`, adapter `addBothPlay` in `src/play/solveCards.js:29` (obs `main.js:77`) | 6 | Levels 1-5 = saved 2-6. Saved 1 is the "See why it works" button |
| 2 | **Divide it** / `divide-it` | `firstLevel: 2`, `whyLevel: 1` (obs `packs/index.js:145-155`) | Loop card `src/engine/divideMoves.js`, adapter `divideMovesPlay` (obs `main.js:76`) | 6 | Levels 1-5 = saved 2-6 |
| 3 | **One-step equations** / `one-step` | `firstLevel: 3` (obs `packs/index.js:91-102`) | Old type-x engine `src/engine/solveLight.js`, adapter `solveLightPlay` (obs `main.js:73`) | 5 (8 bits reserved in codes) | Levels 1-3 = saved 3-5. Saved 1-2 are hidden |
| 4 | **Two-step equations** / `two-step` | none (obs `packs/index.js:133-141`) | Same old engine and adapter (obs `main.js:74`) | 7 (8 bits reserved) | Levels 1-7 |
| 5 | **Multi-step equations** / `multi-step` ("Variables on both sides") | `comingSoon`, 0 levels (obs `packs/index.js:158,173`) | none | 0 (nothing saved) | a "soon" card |
| — | **Switch sides** / `switch` | `retired: true`, not in any section (obs `packs/index.js:121-130,177-181`) | Old drag-across engine `src/engine/switchSides.js`, adapter `switchPlay` (obs `main.js:75`) | 6 | link only |

### 1B. Level contents (from the generators)

**Add to both sides** (obs `src/engine/generateAddBoth.js:40-75`; Build F working tree also bans answers 0 and ±1, `:78-79`):

| Saved level | Name (obs `packs/index.js:116`) | Forms and numbers |
|---|---|---|
| 1 | numbers only | the numeric walkthrough ("See why it works") |
| 2 | x + a = b | a 1-9, b −9..12; 3 party, 2 battle |
| 3 | x − a = b | a 2-9, b −9..12 |
| 4 | both forms | a 2-9, b −10..12; both signs of answer |
| 5 | x on the right | both forms, 3 of 5 with x on the right; Trade places from here (obs `cards/add.js:31`) |
| 6 | all four forms, bigger | a 1-14, b −15..15, answers ≤ 15 in size (obs `:79-80` limit) |

**Divide it** (obs `src/engine/generateDivide.js:29-56`; the card's level n = generator level n−1, `packs/index.js:154`):

| Saved level | Name | Forms and numbers |
|---|---|---|
| 1 | numbers only | numeric walkthrough |
| 2 | ax = b, a = 2 or 3 | answers ±2..5, ≤ 15 counters |
| 3 | a = 2 to 5 | answers ±2..6, ≤ 30 counters |
| 4 | bigger numbers | a 2-5, up to 36 counters |
| 5 | a = 4 or 6 | composite coefficients (several fractions are legal) |
| 6 | all mixed | a 2-6, at least 3 different a |

Divide it only has `ax = b` with **a positive** (2-6) and x on the left. There's no negative coefficient and no x on the right (obs `generateDivide.js:13-21`, `divideBoard.js:12`).

**One-step equations** (obs `src/engine/generateSolve.js:14-62`). All answers are positive (obs `:2-3`).

| Saved level | Name | Forms and numbers | Shown? |
|---|---|---|---|
| 1 | x + a = b | a 2-12, x 2-12 | hidden (Add took it) |
| 2 | x − a = b | a 2-12, b positive | hidden (Add took it) |
| 3 | ax = b | a 2-6, x 2-12, ≤ 36 | shown as Level 1 |
| 4 | x / a = b | a 2-6, b 2-12, x = a·b ≤ 36 | shown as Level 2 |
| 5 | all four mixed | one of each form + 1 | shown as Level 3 |

There is **no `−x = b` level**, even though `SPEC-FLIP-IT.md` §8 says "old One-step `−x = b` maps here" (obs `generateSolve.js:46-62`; `docs/design/SPEC-FLIP-IT.md:5,181`).

**Two-step equations** (obs `src/engine/generateSolve2.js:40-75`). a 2-5, b 1-12, |c| ≤ 30.

| Saved level | Name | Forms |
|---|---|---|
| 1 | ax + b = c | answers 1-9 |
| 2 | ax − b = c | answers 1-9 |
| 3 | b + ax = c | answers 1-9 |
| 4 | x on the right | the three forms mirrored (c = ax + b) |
| 5 | b − ax = c | **negative coefficient** (coef = −a, obs `solve2.js:12`), c negative in 2 of 5 |
| 6 | negative answers | −9..−1, some mirrored |
| 7 | all mixed | all four forms, both signs, mirrored |

Two-step allows an answer of **1** (obs `generateSolve2.js:13`, `POSITIVE = 1..9`). The loop spec bans ±1 (obs `SPEC-SOLVE-IT-LOOP.md:123`), so the new Two-step generator differs here (inf).

**Switch sides** (retired; obs `src/engine/generateSwitch.js:36-59`): 1 x + a = b; 2 x − a = b; 3 negative answers; 4 x on the right; 5 two-step (Two-step's L1-3 forms); 6 two-step, negative answers.

### 1C. Equations solved elsewhere (not Solve it)

- **Count it › Flip It** / `flipit`: integer subtraction ("subtract by adding the opposite"), 5 levels (obs `src/packs/flipit.js:5-22`). **This is not the Flip it card.** Same name, different thing. The id `flipit` is taken in saves, save codes (first in every layout, obs `progress.js:176-266`) and as the default `?pack` (obs `main.js:626`). The new card needs a different id (inf).
- **Build it › Distribute, then combine** / `distribute-combine`: expressions, not equations (A + B(Cx + D)), 5 levels (obs `packs/index.js:66-75`). It's read-only for Solve it.
- **Distribute drill** / `distribute-drill`: hidden, behind `?drill=distribute` only (obs `main.js:80-82`). Two fixed problems, `5 − 2(x + 2) = 3` and `3(x + 1) = 9`, with its own board and reducer, **not on the loop** (obs `src/engine/distributeDrill.js:1-6,19-22`).

### 1D. Flip it: is any of SPEC-FLIP-IT built?

**No card is built** (obs: no pack in `packs/index.js:160-174`; no Flip shape in `shape.js:23-37`; no rungs in `registry.js:141`). The spec on disk says **revision 1.0, "status: designed", follows loop rev 1.2** (obs `docs/design/SPEC-FLIP-IT.md:1,3`). `SPEC-FLIP-IT.md` at the repo root is identical (obs `diff -q`). The loop spec lists "SPEC-FLIP-IT.md rev 1.1 → 1.2" as a required edit (obs `SPEC-SOLVE-IT-LOOP.md:149`), so the rev 1.1 the brief names isn't in the repo (inf). Spec: 6 levels (numeric L1, `−x = b`, `b = −x`, `−ax = b`, mixed, bigger), the move Flip everything plus Take a fraction from L4 (obs `SPEC-FLIP-IT.md:31-38,61-64`).

Pieces that exist:
- The panel button "Flip everything (× −1)" and its light "No opposite box" are defined, but no card makes them live (obs `src/view/narrowPanel.js:14`; Add's panel `addBothScreen.js:478-490`; Divide's `divideScreen.js:193`).
- The drill flips every term (×−1) on its own board (obs `distributeDrill.js:49-60,168-172`).
- On Divide it, Multiply › −1 is explained but not applied (obs `divideBlank.js:12-14,50-54`; message `view/divideFeedback.js:26`).

## 2. Old level ids, save bits, and keeping progress

### 2A. How progress is stored

- **On the device:** localStorage key `mat.v1` holds `{ v, packs: { <id>: { levels: [bool…], first?, open? } }, current, layout }`, with a backup in `mat.v1.backup` if a save would ever lower the count (obs `main.js:100-123`, `progress.js:8-19`). Class-sheet state is in `mat.sync.v1` (obs `src/syncStore.js:6`).
- **Google sign-in / class sheet:** the app sends `levels` per pack (obs `src/engine/sync.js:46-52`). The sheet (`teacher/Code.gs`) keeps one column per pack-level, like `one-step-3` (obs `Code.gs:20,365-373`), merges "finished anywhere stays finished" and sends the merged progress back (obs `Code.gs:13-15`). The app merges it with `normalizeProgress` + `mergeProgress` (obs `sync.js:71-74`). Sheet limits: 30 packs, 20 levels a pack (obs `Code.gs:24`).
- **Save codes** (hidden, behind `?codes=1`): `MAT-` + base-31 bitmask. **v14** = 16 data symbols, 75 bits used, in this pack order (obs `progress.js:259-269`):

| Order | Pack | Bits | Bit range |
|---|---|---|---|
| 1 | flipit (Count it) | 5 | 0-4 |
| 2 | lasso | 7 | 5-11 |
| 3 | boxes | 6 | 12-17 |
| 4 | groups-of-terms | 8 | 18-25 |
| 5 | combineit | 5 | 26-30 |
| 6 | distribute-combine | 5 | 31-35 |
| 7 | value | 5 | 36-40 |
| 8 | **one-step** | 8 (5 used) | 41-48 |
| 9 | **two-step** | 8 (7 used) | 49-56 |
| 10 | **switch** | 6 | 57-62 |
| 11 | **add-both** | 6 | 63-68 |
| 12 | **divide-it** | 6 | 69-74 |

16 base-31 symbols hold about 79.3 bits (obs `progress.js:162`). With 75 used, a new 6-level card doesn't fit, so each new card needs a **v15 layout** (17 symbols) appended at the end. Old codes keep their meaning (inf, from the layout table and decoder `progress.js:305-327`).

### 2B. Legacy credit, as it works today (the model for new cards)

`withLegacyCredit` runs every time progress is loaded, decoded or merged from the sheet (obs `progress.js:92`, `sync.js:73`). It only ever adds:

| New level (saved) | Credited when the student finished | Evidence |
|---|---|---|
| add-both 2 (x + a) | one-step 1 | obs `progress.js:101-108` |
| add-both 3 (x − a) | one-step 2 | same |
| add-both 4 (both) | switch 1 and switch 2 | same |
| add-both 5 (x right) | switch 4 | same |
| add-both 6 (all, bigger) | switch 3 and switch 4 | same |
| divide-it 2 | one-step 3 (ax = b) | obs `progress.js:112` |
| divide-it 3 | one-step 5 (mixed) | same |
| add-both 1, divide-it 1, divide-it 4-6 | never credited (new) | obs comments `:97,110-111` |

It also opens the levels up to the highest credited one (obs `progress.js:114-123`). The old levels keep their own bits, so they still sit in codes and on the sheet.

### 2C. What happens when an old card is replaced

- **Retire it, don't remove it.** `normalizeProgress` keeps only packs that are in `PACKS` (obs `progress.js:75-77`). If a pack were deleted from `PACKS`, a student's finished levels for it would be dropped from the device on the next load and save. Legacy credit that reads them would stop working, and new codes would write zeros there (inf from `:75-92` and `encodeProgress :289-301`). Switch sides shows the safe pattern: `retired: true`, kept in `PACKS` "so its saved levels are kept for the two-step card" (obs `packs/index.js:123`). The sheet keeps old columns either way (inf: `Code.gs` reads every header, `:376-389`).
- **Credit already given stays.** Once add-both bits are written true they are saved in their own right (obs `completeLevel`/save path, `main.js:122`). Credit from a new card's rule is worked out again on every load (inf).
- **Watch out:** finishing a level of a retired card from a link still saves it (obs `main.js:381` checks only `comingSoon`/`hidden`).
- **The Solve it diagnostic** still probes `one-step` levels 2 and 4 and `two-step` levels 2 and 5 (obs `src/engine/diagnostic.js:22-23`), through the old `solve` typed card (obs `lightCards.js:190-196,227`). Saved diagnostic places depend on the probe order (obs comment `diagnostic.js:26,32`). Retiring the old cards means changing the probes carefully (inf).

### 2D. Old levels that map forward (proposal, for each new card)

| Old level | Natural new home | Note |
|---|---|---|
| one-step 4 (x / a = b) | Multiply card, its first equation level | positive only (inf) |
| one-step 5 (mixed) | already credits divide-it 3; could also credit a Multiply mixed level | inf |
| two-step 1-3 | Two-step card's first levels (ax ± b = c, b + ax = c) | same forms (inf) |
| two-step 4 | Two-step "x on the right" | inf |
| two-step 5 (b − ax) | Two-step with a negative coefficient (needs Flip) | inf |
| two-step 6-7 | Two-step negatives / mixed | inf |
| switch 5-6 | Two-step L1-3 / negatives (kept for this, obs `packs/index.js:123`) | |
| (none) | Flip it | no old `−x = b` level exists (obs §1B) |
| (none) | Distribute + combine + solve, Variables on both sides | Build it's distribute-combine is expressions, not equations; no credit suggested (inf) |

## 3. What the shared loop can do for new cards

### 3A. The loop (`src/engine/solveLoop.js`)

It owns the x = row, guesses and the check, the forced move, commit/fold, Undo, Start over, and help through the registry (obs `solveLoop.js:1-13,46-291`). A card supplies `startBoard`, `alone`, `reduce`, `tag`, `slip`, `collapse`, `answerBlocked`, `waitingForUndo` and the rest (obs `:19-36`). Limits:
- Answers are whole numbers only (obs `:172,191`).
- `collapse(level)` exists for multi-step cards (obs `:204`).
- The check renderer knows `x` (with coef), `num` and `frac` (1/n of terms). It has **no parentheses group and no times-term** (obs `src/engine/solveTerms.js:2,15,27-28`).

### 3B. Moves

| Move | Where it works | On the loop? |
|---|---|---|
| Add ___ to both sides | Add card (obs `cards/add.js:5-7,299-305`) | yes. The amount is a whole number only (obs `cards/add.js:37`), so it can't add `3x` (inf → needed for Variables on both sides) |
| Trade places | Add, Level 5 up (obs `cards/add.js:29-35`) | yes (Add only) |
| Cross the border (drag a number across) | Add's term layer (obs `addBothLights.js:1-12`; `lightsGrab.js:45-51,65-68`) | yes, numbers. **x across (`crossX`) is coded but "no card uses it yet"** (obs `lightsGrab.js:46,51`) |
| Combine like terms (drag onto a like term, type the sum) | Add's term layer and the drill (obs `addBothLights.js:10-11`; `lightsGrab.js:102` builds x or number sums) | numbers on Add, yes. **x terms combine only in the drill** (inf: Add boards have one x, `addBothMoves.js:10`) |
| Multiply › fraction (1/n of both sides) | Divide it, with dealing help (obs `divideMoves.js:87-157`; `divideBlank.js:41-42`) | yes |
| Multiply › whole number | Divide: **explained, not applied** (obs `divideBlank.js:12-14,50-54`). Drill: **applied** (obs `distributeDrill.js:53,227`) | **no** (drill only) |
| Multiply › −1 / Flip everything | Divide: explained, not applied (same lines). Drill: applied (obs `distributeDrill.js:51,168-172,223-225`) | **no** (drill only) |
| Distribute (drag the factor onto the parentheses, type each product) | drill only (obs `distributeDrill.js:3-5,204-221`) | **no** |
| Tap a minus (− 2 → + −2) | drill (obs `distributeDrill.js:190`) | no |

The panel only knows four move buttons: Add, Multiply, Flip, Trade (obs `narrowPanel.js:11-16`). Distribute and Combine are "by hand" goals there (obs `:17-18`). The older 8-move list is still in `lightScreen.js:13-22` (used by the numeric screens).

### 3C. Shapes the classifier knows (`src/engine/solveit/shape.js`)

S1-S7, T0-T2 (Add) and D1, D2, DF (Divide) (obs `shape.js:23-37`). Everything else is `unknown`:
- x on both sides (obs `:52`)
- anything but a number beside x (a group, a fraction) (obs `:57`)
- a coefficient with more terms (`ax + c`) (obs `:75-76`)

A board where x has any `coef` is treated as the Divide family (obs `:59`). So `−x = 5` would be read as **D1 with a = −1**, and `(1/3)x = 4` as D1 with a = 1/3 (inf from `:58-77`). The Divide lights compare `now.coef < prev.coef` (obs `:111-113`). That gives the wrong answer with negative coefficients (e.g. −3x → −x would not light "Smaller numbers") (inf).

An unregistered shape logs an error and tests fail on it (obs `registry.js:150-156`), so every new shape must be added to the classifier and the registry together.

### 3D. Scaffolds per shape (registry)

| Shape | Entry | Ladder |
|---|---|---|
| S1, T1, T2 | `rungs/add.js` S1 | hint pop-up → Model it → Choose the move → Guided (obs `rungs/add.js:20,142`) |
| S2, S5 | S2 | Party/Battle → counters walk (obs `:107,142`) |
| S7 | none on purpose ("solved") (obs `:136`) | — |
| T0 | none (building) (obs `:138`) | — |
| S3, S4, S6 | waiting for Undo (obs `:140-142`) | — |
| D1, D2 | `rungs/divide.js` | Model it → Guided, plus Teach me (obs `rungs/divide.js:11,46,59`) |
| DF | waiting for Undo (obs `:93-95`) | — |

### 3E. New shapes each card would bring (inf, from the spec forms and §3C)

| Card | New shapes | Missing scaffolds |
|---|---|---|
| Flip it | `−x = b`, `−ax = b` (and x-right twins), `x = −(b)` (needs a "negated" term kind), the failed-flip waiting state | flip-both-sides seesaw (two-action), opposite-box picture (Build it's box drawing is not exported, obs `SOLVE-IT-ONE-SYSTEM.md:251`), dealing that flips first (spec §4) |
| Two-step | `ax + c = b`, `ax = b + k`, `c + ax = b`, mirrored; then D1/D2 | a "which first?" rung; Add's S1/S2 rungs and Divide's D1 rungs would need to read a coefficient (inf) |
| Multiply (x/3 = 4) | `(1/a)x = b`, `x = a(b)` (a times-term) | a "groups of x/3" picture (architecture suggests C10's boxes, obs `SOLVE-IT-ONE-SYSTEM.md:227`) |
| Distribute + combine + solve | `a(x + c) = b`, `n + a(x + c) = b`, unsimplified sides with like terms | everything: Groups of Terms / Boxes & Circles adapters (obs `SOLVE-IT-ONE-SYSTEM.md:61,64,229`) |
| Variables on both sides | `ax + c = dx + e` and its steps | like-terms rung (C5), cross-x rung |

## 4. Rough size of each new card (as configuration of the loop)

| Card | Size | Why (one line) |
|---|---|---|
| **Flip it** | **Medium** | A new no-amount move, a few new shapes, negative-coefficient lights and an opposite-box picture; Take a fraction must be lifted out of `divideMoves.js` so two cards share it. |
| **Two-step** | **Medium** | Add's and Divide's moves on one board with a coefficient and a number (today Add's x has no coefficient, `addBothMoves.js:10`), new mixed shapes, collapse from L3; `b − ax` needs Flip first. |
| **Distribute + combine + solve** | **Needs new engine work** | Parentheses, distribute and x-term combining exist only in the off-loop drill; the board, check renderer and classifier have no group term. |
| **Multiply (fractional coefficients)** | **Medium (smallest of the new engine pieces)** | The whole-number option is already in Divide's Multiply menu (explained, not applied) and works in the drill; it needs an `x/a` term, the `x = a(b)` shape and a picture. |
| **Variables on both sides** | **Needs new engine work** | x on both sides is "unknown" to the classifier, Add's amount can't be `3x`, and crossing x is coded but unused; it also needs everything Two-step and Distribute bring. |

The architecture doc estimates each at "M" and plans Flip it first (obs `SOLVE-IT-ONE-SYSTEM.md:226-230,297`). The decision log's order puts fractions before two-step "so all the moves exist before they are combined" (obs `docs/design/DECISION-LOG.md:7`).

## 5. What to retire when each replacement goes live (listed, not deleted)

Retire means: set `retired: true`, take the card out of its section, keep it in `PACKS` and keep its save-code bits (see §2C). Delete code only after the diagnostic and any other users are moved.

| When this goes live | Retire | Files used only by it (obs import map) |
|---|---|---|
| Multiply card | One-step L4 (x / a); with Divide already live, the whole **One-step equations** card (`one-step`) | `src/engine/solveLight.js` (also used by switch), `src/engine/generateSolve.js` (also used by generateSwitch), `src/play/solveLightPlay.js`, `src/view/solveMat.js`, `src/view/solveFeedback.js`, `src/view/undoConstant.js`; `lightCards.js` `solve` entry (used by the diagnostic, `:190-196`); tests `tests/solve.test.js` |
| Two-step card | **Two-step equations** (`two-step`) and Switch sides' last uses (`switch` L5-6) | `src/engine/solve2.js`, `src/engine/generateSolve2.js`, `src/view/solve2Rows.js`, `src/engine/equation.js` (once nothing uses it), `src/engine/switchSides.js`, `src/engine/generateSwitch.js`, `src/play/switchPlay.js`, `src/view/switchMat.js`, `src/view/switchFeedback.js`, `src/view/switchPointer.js`; tests `solve2.test.js`, `switch.test.js` |
| Flip it | Divide's "−1 explained, not applied" message (`dFlipNo`, `divideBlank.js:50-54`, `divideFeedback.js:26`) once Flip is real | — |
| Multiply card | Divide's "whole number explained" (`dWholeNo`, `dZeroNo`) if the whole option becomes real there | — |
| Distribute + combine + solve | the hidden **Distribute drill** (`?drill=distribute`) | `src/engine/distributeDrill.js`, `src/play/distributeDrillPlay.js`, the drill branches in `src/view/addBothScreen.js:334-350,486-490` and `addBothLights.js` (`s.drill`) |
| Variables on both sides | the **Multi-step equations (soon)** placeholder (`packs/index.js:173`) | — |
| any of them | Solve it diagnostic probes for `one-step`/`two-step` (`diagnostic.js:22-23`) | — |
| docs | `SPEC-SOLVE.md` (old one/two-step/switch spec), the root copy of `SPEC-FLIP-IT.md` (identical to `docs/design/`) | — |

Keep: the save-code layouts v1-v14 and their pack ids (CLAUDE.md: don't change what a code means), and `src/view/solveScreen.js` and `lightScreen.js`, which the new cards use (obs import map).

## 6. Questions for Karl (recommended option first)

1. **What do we call the new card for `−x = 12`?** Count it already has a card called "Flip It" (subtracting negatives).
   (A) "Flip everything", a new name that matches the move button · (B) keep "Flip it" for both · (C) rename Count it's card.
2. **Should finished old levels count on the new cards?**
   (A) Yes, level for level where the problems match (old Two-step 1-7 and Switch sides 5-6 → new Two-step; old One-step x / a → Multiply), so nobody repeats work · (B) No, everyone starts the new cards fresh · (C) Only a finished old card counts, as all of the new card.
3. **Build order?**
   (A) Flip it → Multiply → Two-step → Distribute → Variables on both sides (one-move cards first, so every move exists before they're combined) · (B) Multiply → Flip it → … (your list order) · (C) Two-step first, since it's the most used in class.
4. **When a new card goes live, what happens to the old one?**
   (A) It leaves the home screen the same day, and its finished levels are kept (like Switch sides) · (B) Both stay on the home screen for a week or two · (C) The old one is deleted.
5. **Flip it's numbers-only Level 1** (flip one side vs. both, with a short quiz):
   (A) Make it the "See why it works" button, like Add and Divide · (B) Make it a normal first level · (C) Leave it out.

## Links to look at

The test-links page: https://karlmaukskoepke.github.io/AlgebraMat/test-links.html. It has entries for Add, Divide and the drill, but **none for One-step, Two-step or Switch sides**. The links below for those three are new, built the same way.

All of these work on the live site now. Finishing a level from a link saves it in that browser (even for retired Switch sides).

**Old cards (to be replaced)**
- One-step, ax = b (shown as Level 1): https://karlmaukskoepke.github.io/AlgebraMat/?pack=one-step&level=3&seed=7&nosignin=1
- One-step, x / a = b (shown as Level 2): https://karlmaukskoepke.github.io/AlgebraMat/?pack=one-step&level=4&seed=7&nosignin=1
- One-step, all four mixed (shown as Level 3): https://karlmaukskoepke.github.io/AlgebraMat/?pack=one-step&level=5&seed=7&nosignin=1
- Two-step, ax + b = c: https://karlmaukskoepke.github.io/AlgebraMat/?pack=two-step&level=1&seed=7&nosignin=1
- Two-step, x on the right: https://karlmaukskoepke.github.io/AlgebraMat/?pack=two-step&level=4&seed=7&nosignin=1
- Two-step, b − ax = c (negative coefficient): https://karlmaukskoepke.github.io/AlgebraMat/?pack=two-step&level=5&seed=7&nosignin=1
- Two-step, all mixed: https://karlmaukskoepke.github.io/AlgebraMat/?pack=two-step&level=7&seed=7&nosignin=1
- Switch sides (retired), x + a = b: https://karlmaukskoepke.github.io/AlgebraMat/?pack=switch&level=1&seed=7&nosignin=1
- Switch sides (retired), two-step: https://karlmaukskoepke.github.io/AlgebraMat/?pack=switch&level=5&seed=7&nosignin=1

**Cards already on the loop (reused from test-links.json)**
- Add to both sides, Level 1: https://karlmaukskoepke.github.io/AlgebraMat/?pack=add-both&level=2&seed=7&nosignin=1
- Add to both sides, x on the right (Trade places): https://karlmaukskoepke.github.io/AlgebraMat/?pack=add-both&level=5&seed=1&nosignin=1
- Divide it, Level 2 (the Multiply menu with whole number, fraction and −1): https://karlmaukskoepke.github.io/AlgebraMat/?pack=divide-it&level=3&seed=7&nosignin=1
- Distribute drill (Flip and Multiply work here): https://karlmaukskoepke.github.io/AlgebraMat/?drill=distribute&nosignin=1

**The other "Flip It" and Build it's distributing (for comparison only)**
- Count it › Flip It (subtracting negatives): https://karlmaukskoepke.github.io/AlgebraMat/?pack=flipit&level=1&seed=7&nosignin=1
- Build it › Distribute, then combine: https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-combine&level=1&seed=7&nosignin=1
- Home screen (Solve it, with "Multi-step equations: soon"): https://karlmaukskoepke.github.io/AlgebraMat/?nosignin=1

One-step's hidden levels 1 and 2 also open from a link (`level=1`, `level=2`), but the title would read "Level −1" / "Level 0" (inf: `main.js:263` with `packs/index.js:190`), so I left them out.
