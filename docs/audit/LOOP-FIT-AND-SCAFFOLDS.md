# Scaffold catalog and loop-fit audit of Count it and Build it (read-only, 2026-10-31)

**Read against** `main` = `d22163a` (after Build V). **No application code, tests, data or settings were changed.** The only new files are this report and its pictures in `docs/audit/shots/` (75 pictures, 1366×768, from a local build of the same commit with a fixed seed; the live site's bundle also contains Build V's Strange solutions, so it is the same generation of code).

**Evidence key.** **obs** = I saw it, with file and line (paths are under `src/` unless they say otherwise; line numbers are from `d22163a`). **inf** = I inferred it, with the reason. "Pack" means a card; "levels" are the saved levels unless I say "shown".

**This report gives facts and sizes. It does not recommend unifying or not unifying, and it does not recommend a plan.** Where "Questions for Karl" shows a recommended option, it is only a way to answer the question, not a position on the migration.

---

## Plain summary

- **What exists.** Count it and Build it are 7 cards (Combine it, Flip It, Group It; Boxes & Circles, Groups of Terms, Distribute then combine, Value it) with **40 levels** between them. I found **36 distinct scaffolds** a student can meet (Part 1). **31 of the 36** have pure logic (an engine or a drawing that takes plain data); only 5 are tangled with the screen frame (obs; Part 1C). The part that is tangled is the frame around them: the step bar, the bottom sentence line, the palette, the streak and the 2.5 s auto-advance (obs, `main.js`).
- **They only fade in one place.** Only Combine it Levels 1-3 and Flip It Levels 1-4 have a scaffold that fades (the party-or-battle question and the typed-answer read-back, off after 3 clean answers, `engine/skills.js:12,38-50`). Every other scaffold appears again at each new problem (obs: `walkLight.js:34` and `boxLight.js:38` start every problem with no supports on).
- **Solve it already borrows a little, in one direction only.** Add to both sides borrows Combine it's counter walk and big-number walk (`engine/cards/addHelp.js`, `engine/cards/add.js`); Divide it draws with Group It's counter (`view/groupDiagram.js:15`). No Count it or Build it file imports a Solve-it-only file. The one coupling the other way is `engine/lightCards.js`, which imports Solve it's old typed checkers (`equation.js`, `addBoth.js`, `divide.js`) for the diagnostic.
- **Prerequisite map (Part 2).** Solve it records **33 distinct slip words**. **13** point straight at a Count it / Build it level (the distribute slips, `sizes-added`, `combine-wrong`, `party-neg-sign`, `wrong-team`), **13** point at one only in part (`sign-flipped`, `ignored-front`, `halfway`, `x-sign-lost`, ...), and **7** have no home (`untouched`, `zeroed-side`, the three fraction-answer slips, `unsimplified`, `dist-product`). Skills with no home: **simplifying a fraction**, **dividing by a negative / division as its own skill**, and **the equation ideas themselves** (do the same to both sides; the amount you add versus the value of x). **Signed multiplication does have a home** (Group It Levels 1-3), which you suspected it might not.
- **Notation (Part 3).** The same sum is written `5 + (−8)` in Count it and Boxes & Circles but `x − 8` in Solve it. Multiplication is written three ways (`3(3)`, `3 × (−4)`, `3 · x`). The colours carry different meanings in the two areas (Count/Build's CSS uses 14 colour tokens with four named meanings; Solve it's uses 58 with hard-coded hex values). The old One-step card is drawn in Count it's frame, not Solve it's. **22 identical copies** of the one-line signed-number writer exist.
- **Loop fit (Part 4).** The shared loop is built for equations: its board has two sides, it has an `x =` row, and its check is "drop the value into each x" (obs, `solveLoop.js:1-36`, `solveTerms.js:2`; "one whole number" is loop spec §2B). Only **Groups of Terms** and **Distribute then combine** use moves the loop already has (distribute, combine, tap the minus, the invisible 1, a fraction factor). They would still need a one-sided "expression" board, a goal, and a check by evaluating at a test value, which do not exist. **Combine it Levels 1-3, Flip It, Group It, Boxes Level 2 and Value it are not loops** (counting, modelling or evaluating).
- **Code size (Part 5).** `src/` is **28,405 lines of JavaScript** plus **3,905 of CSS**, and **15,199 lines in 97 test files** (plus 3,223 in test harness scripts). Count it + Build it are about **10.9k** JavaScript lines; Solve it is about **14.8k**, of which the loop and its layers are about **7.2k**. A new Solve it card costs about **0.5k** source lines (Flip 524, Two-step 544, Distribute-solve 547, Strange ~480); a Count it / Build it card costs 0.5k-2.5k.
- **"Would sharing code reduce code?" (Part 5).** Retiring the three superseded Solve it cards would remove about **1.2k** source lines, about **0.5k** test lines and about **0.16k** CSS lines, **about 1.9k lines, about 4% of everything**. The duplication between Count/Build and Solve it that a migration would remove is small (22 one-line copies, ten near-identical palette builders, about 0.25k lines of exact repeats inside Count it / Build it); most of Count/Build's code is content (generators, validators, drawings, messages) that a migration would keep. During a migration the code would grow; I estimate a long-run range of **roughly flat to +3k lines**, with the saving showing up in the cost of each *new* card (inf; reasoning in Part 5).
- **One-step (Part 6).** It is still live (3 levels shown). **`x / a = b` is taught by no other live card**: Multiply by a whole number is not a live move anywhere. The placement quiz still probes it (`engine/diagnostic.js:22`), and two Solve-it levels are credited from it (`engine/progress.js:107-116`).
- **Sections (Part 7).** A section is mostly data (`packs/index.js:271-275`) plus one CSS colour line and a three-column grid. A second Solve it section is **a config change plus about four small edits** (grid columns, colour line, five tests that assert the exact card list, the Solve diagnostic's probe list). **There is no section-level progress, gold or class-sheet column anywhere in the repo, and Build X's menu is not in the repo** (searched code, specs, decision log, test links).
- **Safety net.** The parity net (traces, class-sheet events, screens, problem sets) covers **Add to both sides and Divide it only**; for Count it and Build it it checks only save codes. A migration of those cards would need its own net first (Part 4).
- **What surprised me.** See the last section.

---

## Part 1. Scaffold catalog

### 1A. Every level's skill (obs, from the generators; seed 7)

| Pack (id) | Level: skill, example |
|---|---|
| **Combine it** (`combineit`) | 1 positive + negative: `−4 + 12` · 2 negative + negative: `−5 + (−4)` · 3 party or battle (mixed): `2 + (−1)` · 4 three or four numbers: `−3 + 2 + (−1)` · 5 big numbers 11-60, no counters: `−49 + (−20)` |
| **Flip It** (`flipit`) | 1 positive − negative: `6 − (−2)` · 2 negative − negative: `−10 − (−3)` · 3 number − positive: `4 − 6` · 4 mixed, some addition: `−5 − 1` · 5 add and subtract 3-4 numbers: `−2 + (−9) + 6` |
| **Group It** (`lasso`; `groupit` also works, `main.js:676`) | 1 positive groups: `4(−3)` · 2 opposite of one group: `−(−5)` · 3 opposite of several groups: `−3(−4)` · 4 unit fraction of a group: `1/4(−20)` · 5 opposite unit fraction: `−1/2(−4)` · 6 fraction of a group: `5/6(−24)` · 7 opposite fraction: `−4/5(−10)` |
| **Boxes & Circles** (`boxes`) | 1 only + terms: `6x + 1 + 2x + 2x` · 2 read the model (a picture of boxes and counters, write the expression) · 3 subtracting numbers: `2 + 2 + 2x + 2 − 5` · 4 negative x terms: `7 − x − 2 − 1` · 5 subtracting a negative: `5 + 1 + 3x − (−5)` · 6 everything mixed |
| **Groups of Terms** (`groups-of-terms`) | 1 all positive: `2(4x + 2)` · 2 a negative number: `4(x − 1)` · 3 a negative x term: `4(−2x + 1)` · 4 opposite groups: `−4(x + 2)`, `−(4x + 4)` · 5 challenge, number first: `−1(−2 − 3x)` · 6 unit fraction of a group: `1/2(8x + 2)` · 7 fraction of a group: `4/5(5x + 5)` · 8 challenge, negative fractions: `−1/2(−12 − 2x)` |
| **Distribute, then combine** (`distribute-combine`) | 1 `A + B(Cx + D)`: `3 + 2(−x − 5)` · 2 the invisible 1: `−6x − (−2x − 3)` · 3 subtracting a group: `1 − 4(x + 2)` · 4 mixed, bigger numbers (typed): `9x + 6(−5x − 1)` · 5 everything mixed (typed): `9(−2x − 6) − 5 + 3x` |
| **Value it** (`value`) | 1 positive values: `4 + 3x, x = 3` · 2 negative values: `2x, x = −2` · 3 mixed: `7 − 4x, x = −3` · 4 fractions of x: `−(3/4)x + 2, x = 16` |

Home-screen sections: Count it = `combineit`, `flipit`, `lasso`; Build it = `boxes`, `groups-of-terms`, `distribute-combine`, `value` (obs, `packs/index.js:273-275`). The save-code order you gave (`flipit, lasso, boxes, ...`) is the order of the older layouts; no other packs exist in these two sections (obs, `PACKS`, `packs/index.js:249-268`).

### 1B. How help is built (obs), so the table reads clearly

Every Count it / Build it level is **"type the answer first"** (light mode, the default; `?light=0` plays the old step-by-step way, `main.js:66`). Each pack has a **reducer** (a pure state machine: `lightSession.js`, `walkLight.js`, `boxLight.js`, `groupLight.js`, `valueLight.js`, ...) that decides which support a wrong answer or **I'm stuck** brings in, then the card's own **walk** (counters, circles, groups, ...) as the last rung. A wrong answer gets a **tag** (`engine/scaffold.js:28-42`, `engine/lightCards.js:28-130`) that picks the first support. Most walks also give a **hint after 3 wrong tries at one step** (`engine/hints.js:8`, `termHints.js:19`, `distributeHints.js:10`).

- **Self-contained** = a pure function of plain data (an engine with no DOM, or a drawing that takes a view-state and returns SVG/HTML). **Tangled** = needs the card's adapter, step bar, palette or feedback frame.
- **Reusable**: *yes* = lifts out by importing and drawing; *with work* = needs a data-format conversion or its pointer layer; *no* = only makes sense inside its own frame.
- **Size to lift** into another screen (inf, from the files' sizes and imports): **S** = under about 150 new lines of glue; **M** = about 150-500; **L** = over 500 or needs a data conversion as well.
- The two term formats matter: Build it's `terms.js` writes a term as `{kind: 'x'|'int', op, value}` (22 importers); Solve it's `solveTerms.js` writes `{kind: 'x'|'num'|'frac'|'group', ...}` (31 importers) (obs, `engine/terms.js:1-12`, `engine/solveTerms.js:2`). Anything that touches terms needs a conversion between them.

### 1C. The catalog

Trigger words: **wrong** = a wrong typed answer (with the tag shown); **stuck** = the I'm stuck button (key S); **teach** = Teach me step-by-step (key T); **start** = shown at the start of a problem or level. "Fades" says whether it goes away as the student improves.

| # | Pack · levels | Scaffold (what it shows and the interaction) | Trigger | Fades? | Where (file:lines) | Self-contained or tangled | Reusable | Size | Shot |
|---|---|---|---|---|---|---|---|---|---|
| 1 | All light cards (first problem on a device) | **Spotlight tour**: the screen dims and the problem, pad, Check and I'm stuck light up in turn; the student must press I'm stuck once; replay with the `?` button | start (once per device, `mat.tour.v1`) | once per device | `engine/tour.js:7-13`; `view/tour.js:171-178`; `lightStore.js:35-42` | tangled (spotlights Count it's real palette) | with work | M | `ci-tour` |
| 2 | Combine L1-3, Flip L1-4 | **Party or Battle? question**: "Same signs?" over Party!, "Different signs?" over Battle! on the Mat (keys P, B); a right pick says the word and returns to typing | stuck with no error yet; tags `battle-as-party`, `party-as-battle`, `minus-as-minus`; or shown first when the skill is on | **yes**: off after 3 clean answers (`FADE_AFTER = 3`) | `lightSession.js:131-134,268-276`; `scaffold.js:48-55`; `skills.js:12,38-50`; `lightMat.js:44-54` | self-contained (`validatePartyBattle`, `moves.js`) | yes | S | `ci-L1-stuck1`, `ci-L3-battle-as-party`, `ci-L3-fade-upfront` |
| 3 | Combine L1-3 | **Circle each number with its sign**: drag across a number starting at its sign; checked once every number has a circle | wrong: `sign-dropped`, `wrong-winner` | no | `lightSession.js:113-118,160-174`; `bigSession.js:17-26`; `view/boxPointer.js` | engine pure; the drag layer is Boxes & Circles' | with work | M | `ci-L1-signslip-circle` |
| 4 | Combine L1-3, Flip L1-4 | **Sign cloze, read aloud**: "The battle of −1 and 4 leaves ____ standing." four choices (negative 3, positive 3, ...); a wrong pick says what is off; a right pick draws the leftover counters | second rung after Circle (or after a repeat of the sign mistake) | no | `scaffold.js:117-156`; `lightSession.js:125-130,250-265`; `lightMat.js:55-70`; `view/speech.js:24`; CSS 1886-1937 | self-contained | yes | S | `ci-L1-signslip-cloze` |
| 5 | Combine L1-3, Flip L1-4 | **Sign read-back**: the typed answer is spoken in words as it is typed ("negative 2") | the sign skill is on after a sign mistake | **yes**: 3 clean answers | `skills.js:4-8,38-50`; `play/lightPlay.js:106` | tangled (needs `lightStore` skills and `speech`) | no | S | none (only shows on a later problem) |
| 6 | Flip L1-4 | **Rewrite the subtraction as adding the opposite**: tap the minus, then tap the number's sign; "Nothing to rewrite" if it is already an addition | wrong or stuck on any subtraction | no | `scaffold.js:60-62`; `lightSession.js:119-123,177-190`; `engine/session.js` (Rewrite step); `view/mat.js:140` | engine pure; drawn on the Count it Mat | with work | S | `fi-L1-stuck1-rewrite` |
| 7 | Combine L1-3, Flip L1-4 | **Counters walk**: Draw (add + and − counters) → Party or Battle? → Cancel (tap pairs) → Answer; starts at Rewrite for a subtraction; at most 12 counters per zone | teach, or the last rung | no | `engine/session.js:12`; `moves.js:8`; `view/mat.js:189`; `view/controls.js` | engine and drawing pure; its palette, step bar and sentence line are the frame | yes (engine, drawing); no (frame) | M | `ci-L1-teach`, `ci-L1-signslip-walk`, `fi-L1-stuck2-walk` |
| 8 | Combine L4, Flip L5 | **Counters walk on 3-4 numbers** (Draw → Cancel → Answer; Flip L5 starts at Rewrite): the integer mode of the Boxes & Circles walk | wrong or stuck | no | `engine/termSession.js:14-24,37-42` | engine pure | with work (term format) | M | `ci-L4-wrong-walk`, `fi-L5-wrong-walk` |
| 9 | Combine L5 | **Big-number walk** (no counters): Circle → Party or Battle? → Add or Subtract? → Sign → Answer; for a third number, Combine first | wrong or stuck | no | `engine/bigSession.js:17-26` | engine pure | yes (already used by Add to both sides, `cards/add.js`) | S | `ci-L5-wrong-walk` |
| 10 | All walks | **Step hints after 3 wrong tries**: a hint that lights where the move is, per step | 3 wrong tries at one step | no | `hints.js:8-11`; `bigHints.js`; `termHints.js:19`; `lassoHints.js`; `termGroupHints.js`; `distributeHints.js:10` | engine pure, keyed to its walk's step ids | with work | S each | none |
| 11 | Group It L1-3 (and any group problem with a sign slip) | **Closed passage**: `2(−3) means ____` with four choices ("2 groups of −3", "the opposite of 2 groups of 3", ...); a wrong pick says why and is crossed out | wrong: `sign-dropped`, `wrong-winner` (once per problem) | no | `lightCards.js:125-143`; `walkLight.js:129-140` | self-contained | yes | S | `gi-L1-signslip-cloze`, `gi-L1-cloze-wrong-pick` |
| 12 | Group It L1-3 | **Groups walk** (whole numbers): Groups → + or − → Fill → Flip → Count; a hidden 1 ("how many groups?") on `−(B)`; the flipped groups are drawn as opposites | teach, stuck, or second miss | no | `lassoSession.js:15-21`; `view/lassoMat.js:170`; `lassoControls.js` | engine and drawing pure; Divide it already reuses `lassoMat`'s counter (obs, `groupDiagram.js:15`) | yes (drawing) | M | `gi-L1-walk`, `gi-L2-walk` |
| 13 | Group It L4-7 | **Fraction walk**: Groups → ± → Fill → Take → Flip → Count; the parts of one bar, counters dealt, "Add part of group" | teach, stuck or wrong | no | `lassoSession.js:23-30`; `view/lassoMat.js:202`; `lassoLayout.js` | engine pure; layout is a 860×330 two-column drawing | with work | L | `gi-L4-fraction-walk` |
| 14 | Group It L4-7 | **Misconception words**: "whole group put in every part" and "taking away instead of taking" (`removed-part`: "That's what's left in the parts you didn't take") | wrong: `removed-part` is logged; the words come when the walk's Count step is wrong | no | `lassoMoves.js:79`; `lightCards.js:62`; words `countRemoved` in `view/lassoFeedback.js:92` | messages only | yes | S | `gi-L4-removed-part` |
| 15 | Boxes L1,3-6 | **Draw boxes & circles**: a box round each x term, a circle round each number (drag across them; a one-time pointer demo shows how), then back to typing with the shapes kept | wrong (first rung); the button at any time | no | `boxLight.js:82-94,174-178`; `view/boxPointer.js`; `view/boxMat.js:91`; `view/dragDemo.js`; `boxLayout.js` | engine pure; drag layer is Boxes' own | with work | M | `bx-L1-wrong-boxes` |
| 16 | Boxes L3-6 | **Rewrite subtractions** as adding the opposite (tap the − and the number's sign, for any number of subtractions; "flip both" if only one half is tapped; Done rewriting) | the button at any time | no | `boxLight.js:131-161,179-189` | engine pure | with work | S | `bx-L3-rewrite-button` |
| 17 | Boxes L3-6 | **Invisible 1 note**: "Look at an x with no number in front. It..." once, before any support | wrong: `invisible-one` (`x − 8x` typed as `−8x`) | once per problem | `boxLight.js:212-216`; `lightCards.js:35-37` | message only | yes | S | `bx-L4-invisible-one` |
| 18 | Boxes, Groups of Terms | **Zero-term refusal**: `0x + 13` is right with a zero term left in; it asks for the zero to be taken out, not a wrong answer | typed answer | no | `boxLight.js:196`; `lightCards.js:27`; `walkLight.js:116` | message only | yes | S | none |
| 19 | Boxes L1,3-6 | **Boxes walk**: (Rewrite) → Box & Circle → Draw (x boxes and counters) → Cancel pairs → Answer; Rewrite comes first from the old Level 4 (shown Level 5) | second wrong, stuck after the boxes, or teach | no | `termSession.js:20-22,37-42`; `boxMat.js`; `termPieces.js` | engine and drawing pure | with work | L | `bx-L1-teach`, `bx-L1-wrong2-walk`, `bx-L5-teach-rewrite` |
| 20 | Boxes L2 (read the model) | **Key, then "say it" per column**: wrong 1 gives the key ("A box is x. A box with a dash is −x. A + counter is +1..."); wrong 2 or teach: "Column 1 has ____" with four choices per column, read aloud, labels stay on the Mat | wrong, stuck, teach | no | `boxModel.js:1-7,17-26,46-60`; `play/boxModelPlay.js`; `view/boxModelControls.js:19-24` | engine pure; drawing is `boxMat` with its text hidden | with work | M | `bx-L2-model-start`, `-wrong1-key`, `-wrong2-columns`, `-teach` |
| 21 | Groups of Terms L1-5; Distribute L1-3 | **Arrows**: arrows from the number out front to each term inside, "2 distributes to both terms: each arrow is a multiplication" | wrong: `dist-one`; stuck | no | `groupLight.js:29`; `view/groupLightMat.js:72` | self-contained | yes | S | `got-L1-dist-one-arrows`, `got-L1-stuck1-arrows`, `dc-L1-dist-one-arrows` |
| 22 | Groups of Terms L2-3; Distribute L3 | **Box and circle the inside terms, then arrows** | wrong: `inside-sign-lost` | no | `groupLight.js:29` (`PLAN`); `lightCards.js:83` | engine pure; uses Boxes' drag | with work | M | `got-L2-inside-sign-lost`, `dc-L3-inside-sign-lost` |
| 23 | Groups of Terms L4-5; Distribute L2 | **Write the hidden 1**: an empty dashed gap labelled "how many groups?", then arrows | wrong: `neg-first` | no | `groupLight.js:29`; `termGroupSession.js` (`wroteOne`) | engine pure | yes | S | `got-L4-neg-first-hidden1`, `dc-L2-neg-first-hidden1` |
| 24 | Groups of Terms L1-8 | **Groups walk**: Groups → + or − → Fill → Flip → Answer → Check it (fractions add Take); the "Check it" lines read `3 · 2x = 6x`, `3 · (−1) = −3` | teach; second miss; `outer-as-term` goes straight here | no | `termGroupSession.js:17-34`; `view/termGroupMat.js:292` (Check it); `termGroups.js:104-118` | engine and drawing pure | yes (drawing) | L | `got-L1-outer-as-term-walk`, `got-L1-teach`, `got-L6-fraction-walk` |
| 25 | Distribute L1-3 | **Two-stage walk**: Groups of Terms' steps on the group, then Write it (type the opened line), then Boxes & Circles on that line | teach or second miss | no | `distributeSession.js:1-25`; `distributeMat.js` | composition of two walks | with work | L | `dc-L1-teach-walk` |
| 26 | Distribute L4-5 | **Typed rounds**: Open it (type the line with the groups opened) → Answer; a hint after 3 wrong tries; **Show me** (Round 4 only) writes the products `6 · (−5x) = −30x`, `6 · (−1) = −6` without making the move | wrong x3; Show me button | the help *fades by design* (Round 5 has no Show me) | `distributeTyped.js:22,101-123`; `view/distributeTypedMat.js` | engine pure | yes | S | `dc-L4-typed-start`, `dc-L4-show-me`, `dc-L4-hint-after-3-wrong`, `dc-L5-typed-start` |
| 27 | Value it L1-4 | **Rung 1, the value in parentheses**: `4 + 3(3)` with `x = 3` shown (tag-specific words: `no-parens`, `added`, `neg-neg`, `sign-lost`, `top-only`, `bottom-only`, `upside-down`) | first wrong or stuck | no | `valueLight.js:9,29-38`; `value.js:75-100`; `view/valueMat.js:74` | self-contained | yes | S | `val-L1-rung1` |
| 28 | Value it L1-4 | **Rung 2, filled boxes**: each x box holds the value's counters, what each term comes to under it (a fraction variant for L4) | second wrong or stuck | no | `valueLight.js:36`; `valueMat.js:24,33` (`boxShape`, `modelLayout`, exported) | self-contained | yes | S | `val-L1-rung2` |
| 29 | Value it L1-4 | **Rung 3, the sum**; Teach me jumps straight here and never writes the answer | third wrong, or teach | no | `valueLight.js:12,38` | self-contained | yes | S | `val-L1-rung3`, `val-L4-teach` |
| 30 | Count it, Build it | **Streak and Keep practicing**: streak of clean answers (I'm stuck does not break it), best per level, Keep practicing plays fresh sets | every level | n/a | `engine/streak.js`; `lightStore.js:63`; `main.js:412-430` | tangled (the header and dots) | no | S | `ci-L1-start` |
| 31 | Count it L1-L5 etc. | **Fluency challenges**: 60-second timed rows (Adding, Subtracting, Add & subtract, Multiplying (concepts), Big multiplying, Everything); a wrong answer flashes the right one and pauses 2.5 s; high scores per device | the pack map | difficulty climbs | `engine/fluency.js`; `view/fluency.js`; `engine/highscores.js` | self-contained (own screen) | with work | M | `home` (pack map) |
| 32 | All three sections | **Placement diagnostic**: about two problems per card, nothing marked until the end; it opens levels (does not mark them done) | the pack-map button | n/a | `engine/diagnostic.js:14-43`; `view/diagnostic.js` | tangled (needs `lightCards` for every card) | no | n/a | `home` |
| 33 | All light cards | **Sound**: speaks the cloze sentence or the model columns, only after a choice is made | the Sound button | n/a | `view/speech.js:6-30` | self-contained | yes | S | none |
| 34 | Combine L1-3 | **Wrong-winner / battle-as-party words**: each tag has its own sentence | wrong | n/a | `view/lightFeedback.js`; `scaffold.js:28-42` | messages | yes | S | none |
| 35 | Boxes, Groups of Terms | **Pad groups**: x sits apart under "variable", + and − under "sign" | every algebra pad | n/a | `view/walkLightControls.js:20-33` | tangled (palette) | no | S | `got-L1-start` |
| 36 | Distribute L1-3 | **Group light mat**: the arrows drawn in once, then still while the student types | arrows | no | `view/groupLightMat.js:72` | self-contained | yes | S | `got-L1-dist-one-arrows` |

**Counts.** 36 rows. **Tangled with the frame (5):** rows 1 (tour), 5 (read-back), 30 (streak header), 32 (diagnostic), 35 (pad groups). **Pure logic (31):** of these, the ones that lift out by importing and drawing, with no data conversion (*reusable: yes*), are rows 2, 4, 9, 11, 14, 17, 18, 21, 23, 26, 27, 28, 29, 33, 34, 36 and the engines and drawings of rows 7, 12, 24; the rest (rows 3, 6, 8, 10, 13, 15, 16, 19, 20, 22, 25, 31) need a data conversion or the Boxes & Circles drag layer first.

**Which of these Solve it already has, written separately (obs, inf).** Arrows and the hidden 1 (#21, #23): Solve it's distribute move draws a coloured factor with an arc and a small × to each piece, and "the invisible 1" is tapped into view (loop spec §1D; `engine/distributeMove.js`). The `x − 8x` / zero-term words (#17, #18) have no Solve it twin. The "party or battle" bubble (#2) exists on Add's seesaw as its own implementation (`engine/cards/addHelp.js`, 7 mentions of Party), written separately from `lightSession.js`.

### 1D. Pictures worth looking at first

`ci-L1-stuck1` (Party or Battle on the Mat), `ci-L1-signslip-cloze`, `gi-L1-signslip-cloze`, `bx-L2-model-wrong2-columns`, `got-L1-dist-one-arrows`, `val-L1-rung2`, `dc-L4-hint-after-3-wrong`; for comparison `sv-divide-it-L2-stuck1` and `sv-one-step-L4-stuck2` (Part 3).

---

## Part 2. Prerequisite map (the bridge to Solve it)

**How the site opens a level (obs).** `main.js:675-681` reads `?pack=<id>&level=<n>` (and an optional `seed`) and starts that level with no unlock check. The app itself never builds such a URL, except through the in-app `practice` button (`main.js:269-272`, `642`), which calls `startLevel(pack, level)` directly. Two consequences: a **"Need a refresher?" button inside Solve it can call `startLevel` the same way `practice` does** (Distribute, combine, solve already does that with "Practice distributing first"; its `practice: { pack: 'distribute-combine', label }` is in `packs/index.js:202`), and **there is no "return to where I was"**: Back goes to the home screen (`$('back')` calls `goHome`), and only one `current` problem is saved (`main.js:119-129`), so a refresher replaces the Solve it problem in progress (inf). The link form for a test or a class link is `https://karlmaukskoepke.github.io/AlgebraMat/?pack=<id>&level=<n>&nosignin=1` (add `&seed=<n>` to fix the problems).

### 2A. Every Solve it slip word, with its home

"Clean" = a Count it / Build it level teaches that exact skill; "partial" = it teaches part of it or a nearby version; "none" = no level teaches it. Tags are recorded on the class sheet as typed-answer tags (`answers`) (obs, `engine/eventlog.js:12-24`).

| Slip word (where recorded) | What the student did | Skill | Home in Count it / Build it | Match | Refresher target (pack · level · link tail) |
|---|---|---|---|---|---|
| `sizes-added` (Add `addBoth.js:46,52,61`; typed sums `cards/bothSides.js:393`, `cards/distribute.js:214`) | Treated a battle as a party: added the sizes (`−8 + 11` → 19) | Adding signed numbers: battle | **Combine it L3** "party or battle?" and L1 (the same misconception, tag `battle-as-party`, `scaffold.js:39`) | clean | `combineit` · 3 · `?pack=combineit&level=3` |
| `combine-wrong` (`cards/bothSides.js:393`, `cards/distribute.js:214`) | Typed a wrong sum of two numbers (not the sizes slip) | Adding signed numbers | Combine it L1-L3; L4 for three numbers | clean | `combineit` · 1 or 4 |
| `party-neg-sign` (`cards/add.js:220`) | A negative party: right size, wrong sign | Adding two negatives | **Combine it L2** (`sign-dropped`, `wrong-winner` + the sign cloze) | clean | `combineit` · 2 |
| `wrong-team` (Divide `divide.js:52`) | The right size, the wrong sign (`15/5` as `−3`) | Sign of a quotient/product | **Group It L1-L3** (signed multiplication; `4(−3)`, `−3(−4)`; sign cloze) | clean | `lasso` · 1-3 |
| `first-only` (`distSolve.js:59`, `bothSides.js:59,73`) | Distributed to the first term only | Distributive property | **Groups of Terms L1** (`dist-one` + arrows); Distribute then combine L1 | clean | `groups-of-terms` · 1 |
| `no-distribute` (`distSolve.js:61`) | Left the factor out (`x + c`) | Distributive property, outer number as groups | **Groups of Terms L1** (`outer-as-term`: "the number out front isn't a term to add") | clean | `groups-of-terms` · 1 |
| `dist-unmultiplied` (`distributeMove.js:31`) | Typed the piece unchanged (`2` for `3 · 2`) | Distributive property | Groups of Terms L1 | clean | `groups-of-terms` · 1 |
| `dist-sign-lost` (`distributeMove.js:32`) | The right size, the sign lost (`4` for `−2 · 2`) | Negative factor | **Groups of Terms L2-L3** (`inside-sign-lost`) | clean | `groups-of-terms` · 2 |
| `dist-one-lost`, `one-lost` (`distributeMove.js:31-32`, `bothSides.js:59,74`) | Lost the invisible 1's minus (`7x − (x − 6)` read as `7x + x − 6`) | Distributing a minus, the hidden 1 | **Groups of Terms L4-L5** (`neg-first`, "write the hidden 1"); **Distribute then combine L2** "the invisible 1" | clean | `distribute-combine` · 2 |
| `dist-frac-top`, `dist-frac-bottom`, `frac-top` (`distributeMove.js:33-34`, `bothSides.js:60,75`) | Used only the top (or bottom) of a fraction factor | Fraction of a group of terms | **Groups of Terms L6-L8** | clean | `groups-of-terms` · 6 |
| `sign-flipped` (every card: `addBoth.js:51`, `flip.js:25`, `twoStep.js:49`, `distSolve.js:62`, `bothSides.js:84`) | The right size on the wrong team (the opposite of x) | Sign of an answer | Depends on the card: Add → Combine it L1-L2; Divide/Flip → Group It L1-L3; Two-step → Combine it + Group It | partial | `combineit` · 1-2 or `lasso` · 1-3 |
| `wrong-op` (`addBoth.js:43,51`) | Added the same number instead of its opposite | Opposites cancel to zero | Combine it L1 (battle: the Cancel step in the walk; `+8` and `−8` pair off) | partial | `combineit` · 1 |
| `gave-opposite` (`addBoth.js:47,51`) | Gave the amount to add (−8) instead of the value of x | "The move versus the answer" | none that names it; Combine it L1's cancel is the nearest | partial | none |
| `ignored-front`, `gave-boxes` (`divide.js`, `flip.js:25-37`) | Gave b (the coefficient ignored) or gave a | A coefficient is a number of groups/boxes | Boxes L1 (`6x` as six boxes); Group It L1 ("4 groups of −3") | partial | `boxes` · 1 |
| `multiplied`, `halfway`, `wrong-groups` (`divide.js:49-60`) | Multiplied `a × b`; stopped at a legal fraction that did not finish; shared into the wrong number of groups | Taking a fraction of a number; equal groups | **Group It L4-L7** (`1/4(−20)`; the dealing) is the nearest | partial | `lasso` · 4 |
| `undid-add` (`divide.js:58`) | `b + a` or `b − a` as if x were added | Which operation undoes which | none | partial (nearest: Combine it, adding the opposite) | none |
| `x-sign-lost`, `half-collected` (`bothSides.js:53-54,82-83`; `generateStrange.js:47-48`) | Moved an x-term with its sign kept; left one side's x-terms out | Combining like terms; negative x terms | **Boxes & Circles L1, L3-L6** (L4 "negative x terms") | partial | `boxes` · 4 |
| `skipped-fraction`, `added-constant` (`twoStep.js:44-54`) | Undid the constant but not the multiply; added instead of cancelled | Order of operations / undoing in order | **Value it L1-L3** (evaluating `3x + 4`) is the forward direction only | partial | `value` · 1 |
| `untouched` (`addBoth.js:44,51`) | Gave the other side as x | Equation idea: the value is not on the other side | none | none | none |
| `zeroed-side` (`cards/bothSides.js:132-133`) | Added an amount that made the side without x zero | Equation idea | none | none | none |
| `frac-swapped`, `frac-no-divide`, `frac-reduced-wrong`, `unsimplified` (`generateStrange.js:44-61`; `cards/strange.js:85`) | Top and bottom swapped; the divisor left out; only top or bottom reduced; not in lowest terms | Fractions as numbers; simplifying | none | none | none |
| `dist-product` (`distributeMove.js:35`) | A wrong product that matches no named slip | n/a | none | none | none |

**Count: 33 slip words. Clean 13, partial 13, none 7.** (Not counted: `unmatched` and `unreadable`.) **Count it / Build it's own words that match in kind (obs):** `battle-as-party`, `party-as-battle`, `sign-dropped`, `wrong-winner`, `removed-part`, `dist-one`, `inside-sign-lost`, `neg-first`, `outer-as-term`, `invisible-one`, and Value it's `no-parens`, `added`, `neg-neg`, `sign-lost`, `top-only`, `bottom-only`, `upside-down` (`lightCards.js:28-130`, `value.js:82-100`). The Solve-it and Count/Build words for the same slip are **different words** (for example `first-only` against `dist-one`), so a teacher reading the class sheet cannot add them up (inf).

### 2B. The wrong value at the check (not a tag)

A wrong value typed at `x =` is judged by the check (`Not balanced`), not by a tag. The skill underneath is **substituting a number for x and working it out** (`3 × (−4) = −12`). Its home is **Value it L1-L4**, which also has the right words for the mistakes (`no-parens`, `neg-neg`, `sign-lost`, `top-only`). (obs, `engine/value.js:75-100`; the Solve check is `engine/solveTerms.js:substitutionLines`).

### 2C. Skills with no home in Count it / Build it

1. **Simplifying a fraction** (`9/6` → `3/2`): needed by Strange solutions (three slip words, one nudge). Group It teaches *a fraction of a number*, not fractions as numbers.
2. **Dividing integers as its own skill, and dividing by a negative** (`−15 ÷ (−3)`): Group It L4-L7 teaches `1/n` of a number, which is dividing by a positive. Nothing teaches a negative divisor, which Solve it's Divide button allows (loop §1C, rev 2.4).
3. **The equation ideas**: do the same thing to both sides; an amount you add versus the value of x; the other side is not the answer. These are the Add to both sides card's own job (Numeric Level 1 "See why it works"); no earlier card is a prerequisite.
4. **Undoing in order** (`skipped-fraction`): Value it teaches evaluating forward only.

*Not* in this list, although it might seem to be: **signed multiplication** (Group It L1-L3: `4(−3)`, `−4(5)`, `−3(−4)`, `−(−5)`), **combining like terms with negatives** (Boxes & Circles L3-L6), and **fraction of a number** (Group It L4-L7, Value it L4).

---

## Part 3. Notation audit

All three areas use the typographic minus (`−`, U+2212; `MINUS` in `engine/expr.js:4`), so the minus glyph is consistent (obs). Everything below was compared in the code and in the pictures (`shots/ci-*`, `bx-*`, `got-*`, `gi-*`, `val-*` against `sv-*`).

### 3A. Inconsistencies against the loop spec, and where they happen

"Places" = distinct formatting or drawing sites (a function or a view) that write the thing in that way. The counts are what I found by grep and by reading, so treat them as approximate (obs for the sites named, inf for the totals).

| # | Thing | Count it / Build it | Solve it (the loop's current rules) | Places (count) | Cosmetic or confusing |
|---|---|---|---|---|---|
| 1 | A negative number after `+` | `5 + (−8)`, `−5 + (−4)` (parentheses): `expr.js:42-48`, `terms.js:57-61`; Boxes' model level `−5x + (−2)` | `x + 8 = −4`, `x − 5 = 10`: a negative term is written as `− 5`, never `+ (−5)` (`solveTerms.js:26-37`, `addBoth.js:30`); parentheses appear only in the check (`3 × (−4) = −12`, loop §4) | Count/Build: 6 writers (`expr`, `terms`, `combine`, `value`, `termGroups`, `lassoMat`); Solve: 8 (`solveTerms`, `addBoth`, `divide`, `flip`, `twoStep`, `distSolve`, `bothSides`, `solveScreen`) | **Confusing.** A student who learned `x + (−5)` and is shown `x − 5` has to know the two are the same; Flip It teaches exactly that rewrite, but only inside Count it |
| 2 | Negative as the first term | `−4 + 12` (a leading minus) | `−x + 3 = 8`, `−2 = x − 8` | same writers | cosmetic (the same) |
| 3 | Subtracting a negative | `5 − (−3)`, `x − (−5)` (parentheses) | `7x − (x − 6)`: parentheses around a group, never around a lone negative | Count/Build 3 (`expr`, `terms`, `boxMat`); Solve 1 (`solveTerms` group) | **Confusing**: `−(` means "opposite of a group" in Solve and "subtract a negative number" in Count it |
| 4 | Multiplication | `3(3)` for 3x at x = 3 ("a number next to parentheses means multiply", `valueFeedback`); `3 · 2x = 6x` in Groups of Terms' Check it (`termGroups.js:117`); `2 × 4` in Value it's help (`valueFeedback.js:9`); the old One-step help says "Take 2 of each side" | `3 × (−4)` in the check rows; `3 · x` in a blue dot on the Divide hint (Build Q Part 3); `3 · 2` labels over the distribute blanks; `⅓(15)` with a clickable × | `×` appears in 20 source files and `·` in 26 (many are comments); parentheses-multiplication in Value it's help and the Mats | **Confusing**: three symbols for one operation (parentheses, ×, ·) with no rule about which is used where |
| 5 | Fractions | `1/4(−20)` in text; drawn with a slash in Group It, stacked in Groups of Terms (`termGroups.js:97` "the view draws fractions stacked"); `−(3/4)x` in Value it | `1/4(8x + 8)` in text, drawn stacked `lx-sfrac` (`solveScreen.js:123`); the old One-step draws `x/2 = 6` with a slash | 3 text writers + 4 drawings in Count/Build; stacked in Solve | cosmetic to confusing: the old One-step card uses a slash for what the new cards stack |
| 6 | Parentheses with spaces | `2 ( 4x + 2 )` with a space inside (`got-L1-start`) | `4 (x + 2)` (`sv-distribute-solve-L3-start`) | n/a | cosmetic |
| 7 | The opposite box | Boxes & Circles draws −x as **−□** (a box with a dash) and labels the key "□ = x" (`boxes-L2-model-start`) | Divide draws an **x inside** each box (`sv-divide-it-L2-stuck1`); Flip it's light "No opposite box" exists (`flipScreen.js:82`) | 3 drawings (`boxMat`, `groupDiagram`, `addBothMat`) | **Confusing**: an empty box with a key against a box with an x in it |
| 8 | The equals sign and the answer | `= ?` with an underline, then the typed answer (`ci-L1-start`) | `x = [ ]` with one green button (Check, Next, Go...) | 2 | cosmetic |
| 9 | Colours (what each one means) | `--opposite` magenta "always with an underline": came from an opposite; `--groups` blue: how many groups; `--inside` green: inside a group; `--cancel` vermillion: always a slash (`style.css:3-7`); 14 colour tokens in about 1,450 CSS lines | blue `#0072b2` = the operation or "click here" (134 uses); accent purple `#7b3fb0` = the step being worked on; green `#1b6e3a`, red `#a3281b`; **58 distinct tokens** in 1,328 CSS lines, mostly hard-coded hex; Divide **reuses `is-opposite` (magenta) for negative counters and `is-inside` (green) for positive** (`groupDiagram.js:31`) | CSS: 2 palettes; Divide's counters re-use Group It's classes | **Confusing**: magenta means "opposite of" in Count it and "negative" in Divide; blue means "how many groups" in Group It and "the operation" in Solve it |
| 10 | The frame | step bar on top; the sentence **below**; a `?` tour button; "Streak 0 · Best 0"; a 2.5 s auto-advance | no step bar; messages are pop-ups; no streak; nothing on a timer (loop §2); a moves panel | n/a | **Confusing** at the seam: the old **One-step** card (Solve it, live) is drawn in Count it's frame (`sv-one-step-L4-stuck2`: "Streak 0 · Best 0", a step bar, the sentence at the bottom), while its neighbours are not |
| 11 | Words for the same idea | "party" and "battle"; "groups of"; "boxes" (Boxes & Circles); "opposite" (Group It: "opposite (negative) groups"); "Flip" is a Flip It step (turning a subtraction into adding the opposite), a Group It step (turning groups into their opposites) and Solve it's "Flip everything (× −1)" | "Party/Battle" bubble on Add (its own copy); "boxes" in Divide ("one of the 3 x boxes is ⅓"); "Take a fraction", "Flip everything", "Trade places" | n/a | **Confusing**: "Flip" has three meanings; "Take" is a Group It step and a Divide move |
| 12 | Writing the problem on the Mat | Handwritten font (Kalam) for the problem on the Mat; Lexend for text (`style.css` 2 families) | The same two fonts | 2 | consistent |
| 13 | Counter drawings | 8 separate counter drawings (`mat.js:36`, `lassoMat.js:52`, `boxMat.js:48`, `termGroupMat.js:55`, `valueMat.js:56`, `addBothMat.js:95`, `groupDiagram.js:24`, and the old One-step Mat `solveMat.js`) | (shared by Add and Divide) | 8 | **Cosmetic to confusing**: sizes and grouping differ; a counter in a seesaw looks different from the same counter on Count it's Mat |
| 14 | The signed-number writer itself | `const signed = (v) => (v < 0 ? ...)` copied **22 times** (`engine/termGroups, fluency, bothSides, value, terms, solve, groups, distSolve, numericLevel, divideNumeric, addBoth, switchSides, divide, flip, solve2, twoStep, solveTerms; play/lightPlay, bigPlay; view/lassoMat, valueMat, solveMat`) | | 22 | invisible to students; it is why #1 can drift |

**Total inconsistencies listed: 14. Confusing for a student moving between sections: 7 (#1, #3, #4, #7, #9, #10, #11). Cosmetic: 7.** (Judgement; the first column of evidence is in the table.)

### 3B. Pictures to compare

`ci-L1-start` / `got-L1-start` / `val-L1-start` against `sv-add-both-L2-stuck1`, `sv-distribute-solve-L3-start`, `sv-divide-it-L2-stuck1` and `sv-one-step-L4-stuck2`.

---

## Part 4. Loop fit, pack by pack

### 4A. What the loop can and cannot do today (obs)

The shared loop (`engine/solveLoop.js`) owns the moves, the `x =` row, the check by substitution, the forced-move rule, Undo/Start over, the help ladder and the stuck count (`solveLoop.js:1-13`). A card supplies a board (`startBoard`, `alone`), its moves (`reduce`), slips, and registers its help by **shape** in the scaffold registry (`solveit/registry.js`, `solveit/shape.js:23-37`). Four hard limits that matter here:

1. **The board is an equation**: two sides of terms (`solveTerms.js:2`); `alone(board)` asks "is x alone on a side?" (`solveLoop.js:21`).
2. **The goal is `x = value`**, one whole number (loop spec §2B "Answers: one whole number typed into `x =`"; only Strange solutions types a fraction, through its own two-box answer, `cards/strange.js`).
3. **The check is "drop the value into each x"**, then one operation per Next (`solveTerms.js`, loop §4).
4. **An unregistered shape is an error** (`solveit/registry.js:40-41` logs "No scaffold registered for shape ..."; `tests/registry.test.js` and `tests/shapeCoverage.test.js` fail on it): every new state needs its own entry.

Pieces the loop has that Count it / Build it would want (obs): the grab layer (reorder, combine by dragging one term onto a like term and typing the sum, tap a minus into `+ −2`, drag the factor onto the parenthesis and type each product; `lightsGrab.js`, `view/lightsGrabPointer.js`), the hover preview, the spotlight with Undo (`view/spotlight.js`), nudges for mechanical steps (combine, calculate a product; `engine/nudge.js`), the lights, and `recordProblem` into the class sheet.

### 4B. The kinds of loop

- **Equation-solving loop** (the Solve it one): none of the Count/Build packs *is* this.
- **Expression-simplifying loop**: a goal of an equivalent simpler expression, checked by evaluating at a test value. **Does not exist today** (inf: no one-sided board, no test-value check, no goal row other than `x =`).
- **Counting or modelling task, not a loop**: a picture is built or read and a number or expression is typed.

### 4C. Pack by pack

"✔" = the piece applies as the loop has it; "◐" = it applies with work (named); "✘" = does not apply or is missing. Sizes are for making the pack a configuration of a loop, **not** counting the loop work that would be shared (the new expression board and check, which are listed once in 4D).

| Pack · levels | Kind | Board and moves | Grab layer | Hover preview | Spotlight + Undo | Hint ladder + registry | Nudges | Forced move | Check by substitution | Lights | Class-sheet events | What is missing |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Combine it L1-3; Flip It L1-4** (two numbers → a number) | **Counting/modelling** (no equation, no x) | ✘ | ✘ | ✘ | ◐ (an error, then Undo, would replace "wrong → support") | ◐ (new shapes `a + b`, `a − b`, each with a ladder; the party/battle bubble exists on Add as another copy) | ✘ (nothing to combine by hand) | ✘ | ✘ (evaluate, no x) | ✘ | ✔ (`recordProblem` is shared) | A one-sided board and a check; or these stay as they are. **Size: needs a new engine** |
| **Combine it L4-5; Flip It L5** (3-4 numbers → a number) | Expression-simplifying (to a number) | ◐ (a row of numbers; "combine two" exists) | ◐ (combine constants and tap-the-minus exist; no `=`) | ◐ | ◐ | ◐ (shapes `p + q + r` exist only as Add's S5/S6 "stacked") | ✔ (the combine nudge: "Drag one onto the other to combine them") | ✘ | ◐ (evaluate; no x) | ◐ ("fewer terms") | ✔ | The big-number walk and the counters walk would be rungs (adapters). **Size: L** |
| **Flip It L1-4** (a subtraction) | Counting/modelling | ✘ | ◐ (tap the minus → `+ −2` is already a term-layer move) | ✘ | ◐ | ◐ | ✘ | ✘ | ✘ | ✘ | ✔ | **Size: M** (the Rewrite support is the loop's tap-the-minus) |
| **Group It L1-7** (groups, bars, counters) | **Counting/modelling** | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✔ | The drawing is the point, not a rewriting of an expression. **Size: needs a new engine, or stays a modelling card** |
| **Boxes & Circles L1, 3-6** (combine like terms) | Expression-simplifying | ◐ (one-sided; combine like terms exists, "x-terms typed whole") | ◐ (combine exists; the Box & Circle lasso is a different gesture) | ◐ | ◐ | ◐ (new shapes: sums of x-terms and numbers) | ✔ (combine nudge covers two x-terms or two numbers) | ✘ | ◐ (test value, new) | ◐ | ✔ | The box/circle/counters picture would be a rung (adapter). **Size: L** |
| **Boxes L2** (read the model) | **Counting/modelling** | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✔ | Picture → expression; not a loop. **Needs a new engine** |
| **Groups of Terms L1-8** (distribute) | Expression-simplifying | ◐ (the distribute move exists; one-sided board does not) | ✔ (drag the factor onto the parenthesis; tap-minus; the invisible 1; a fraction factor: `distributeMove.js`, Build P/U) | ✔ | ✔ | ◐ (a distribute shape exists on Solve cards; the counters-groups walk would be a rung) | ✔ (calculate-a-product nudge) | ✘ | ◐ | ◐ | ✔ | **Strongest fit.** The Groups walk (#24) would become an adapter rung. **Size: M-L** |
| **Distribute, then combine L1-5** | Expression-simplifying | ◐ (distribute + combine both exist as moves) | ✔ | ✔ | ✔ | ◐ | ✔ | ✘ | ◐ | ◐ | ✔ | The two-stage walk (#25) as a rung; typed rounds (#26) become moves. **Size: L** |
| **Value it L1-4** (evaluate at x) | **Evaluating** (the loop's check phase is this task) | ✘ | ✘ | ✘ | ◐ | ✘ | ✘ | ✘ | ✔ (the check "drop the value into each x, then one operation per Next" does this; `solveTerms.js`) | ✘ | ✔ | Needs an expression with no `=` and no verdict "Balanced". The filled-box picture (#28) would be a rung. **Size: M** |

### 4D. What a migration would have to add once, shared by all (inf)

1. **A one-sided "expression" board** (`startBoard` returns one list; `alone`, `lightsOf` and the check assume two sides).
2. **A goal and a check for expressions**: "fully simplified" as a light, and a check that evaluates the original and the result at a test value (new; the substitution renderer can be reused for the writing).
3. **Shapes and registry entries** for every state (each expression state needs a ladder or "waits for Undo"; the standing tests fail on an unregistered one).
4. **One term format.** `terms.js` (22 importers) against `solveTerms.js` (31 importers): either a converter at each seam or a rewrite of Build it's term code. Note that the Light mat draws the problem as **one text string**, not per-term elements (`lightMat.js:25-52`), so no term in Count/Build can be grabbed today.
5. **Rungs as adapters**: the walks (counters, circles, groups) hold their own session, so each rung is "make a sub-problem, hold the sub-session, draw it in the reserved space, leave the frame behind" (this is the same plan as `docs/architecture/SOLVE-IT-ONE-SYSTEM.md` Part 1B; I checked the Combine it parts: still true).

### 4E. Risks for any migration (obs unless marked)

- **Saved progress and pack ids.** Progress is keyed by pack id and level count (`engine/progress.js`); a pack must stay in `PACKS` with the same level count (the `retired: true` pattern, `packs/index.js:129`). The home sections list is only data (`SECTIONS`, `packs/index.js:271-275`). **Risk low if ids and level counts do not change.**
- **Save-code bits.** Layout v15, one symbol longer than v14, carries one bit per level in a fixed pack order (`progress.js:~255-360`); "don't change what a code means" (CLAUDE.md). Count it / Build it occupy bits 0-40 in the order flipit, lasso, boxes, groups-of-terms, combineit, distribute-combine, value. **Risk low if untouched**, but any **new pack id** (for a refactored card) needs a v16 layout.
- **Class-sheet columns.** The sheet has one column per pack-level (`teacher/Code.gs:376-391`, limits 30 packs × 20 levels, `Code.gs:24`; PACKS has 18 now). The per-problem rows carry free-text `supports` and `answers` tags (`Code.gs:444`). Count it / Build it already write `circle`, `rewrite`, `cloze`, `partyBattle`, `fullWalk`, `boxcircle`, `arrows`, `labels` (obs: the `supportsShown.push` calls); the loop writes `hint`, `model`, `move`, `guided`, `crossoff`, `forced`. CLAUDE.md says the class-sheet event words must not change unless you ask for exactly that, so a migration that renames them is a change you would have to ask for (inf).
- **The parity net.** `tests/parity/scenarios.mjs` covers Add to both sides and Divide it only (25 scripted runs); the baseline has 70 screens (31 of Add/Divide plus the opening of three newer cards); for Count it / Build it it checks **save codes only**. **A net for these seven packs would have to be built first**: scripted runs per pack and level (event records and state traces), and screens at 1366×768 and 1366×650. Estimated at 40 levels × about 3 states. (inf)
- **Tests.** `tests/shapeCoverage.test.js`, `registry.test.js`, `generatorReports.test.js` and the real-browser `screenSweep.test.js` (every Solve it card, every level, honest path) protect Solve it only. Count it / Build it have 19 test files (3,164 lines) by dominant import, and 25 more files (3,113 lines) test code both families share (Part 5).
- **Fading.** Only Combine it/Flip It's two-term light mode fades (`skills.js`); an expression loop would have to say where that goes (inf).

### 4F. Karl's parked idea: the drag feature in Build it's Combine and Distribute

**What it would be (inf):** Boxes & Circles' combine like terms (drag a term onto a like term, type the sum) and Groups of Terms / Distribute then combine (drag the factor onto the parenthesis, type each product).

**As a bolt-on** (add the drag to each card as it is):
- **What exists to reuse (obs):** the slot logic `lightsGrab.js` (143 lines, pure, imports Add's `signed`), `distributeMove.js` (87), the pointer layer `view/lightsGrabPointer.js` (255). They are written against the Solve loop's term format.
- **What is new (inf):** (1) the light mat draws the problem as one text string, so each card needs a per-term row (new view, like `solveScreen`'s equation row); (2) a small reducer per card holding the *current expression* between drags (today the typed answer is the only state); (3) a converter from `terms.js` to the drag layer's format and back; (4) the typed sum/products blanks; (5) how a drag interacts with the support ladder and the walk (does a drag count as an attempt, does I'm stuck show the arrows?).
- **Size (inf):** **L for the two cards**: about 0.8-1.5k new source lines and about 0.5k test lines, plus a net for the parity-less cards.
- **Risks:** low for saved data (no pack ids or levels change); medium for class-sheet words (a drag is a new support kind, which needs a word); medium for tests (nothing protects these cards' screens today).

**As a migration to the shared term layer** (the Build cards become configurations of the term layer, Solve it's):
- **Size (inf):** **M per card, L overall (about 3-5k lines moved or rewritten)** for the cards that touch terms (Boxes, Groups of Terms, Distribute then combine, Value it): `terms.js` has 22 importers; 4D items 1-4 are needed first. The saving: the *next* card is configuration (about 0.5k), and the drag, nudges, Undo and spotlight are free.
- **Risks:** the ones in 4E, in full; the walks become adapter rungs, so the "type first, walk as the last rung" structure of light mode has to be rebuilt as the ladder.

---

## Part 5. How much code is shared or duplicated

**Method (obs).** Lines are physical lines (`wc -l`). I built the import graph of `src/` and walked it from each section's play adapters (a script in my scratch folder, not committed). Test files are assigned to the family whose files they import most. These are measurements of the files, not of behaviour.

### 5A. Totals

| | Files | Lines |
|---|---|---|
| `src/` JavaScript | 249 | **28,405** |
| `src/style.css` | 1 | **3,905** |
| Test files (`tests/*.test.js`) | 97 | **15,199** |
| Test harness (`tests/features/walk.mjs` 2,476, `parity/*` 428, `typing/sweep.mjs` 252, `helpers` 67) | 7 | 3,223 |
| Parity baseline data (`tests/parity/baseline`) | | 563,662 bytes of JSON, 70 screen pictures |
| Teacher sheet (`teacher/Code.gs`) | 1 | 465 |
| Specs and docs (`*.md`) | | about 10,700 |

### 5B. By family (source JavaScript, from the import graph)

| Family | Files | Lines |
|---|---|---|
| Count it + Build it only | 71 | 6,587 |
| Solve it (live) only | 94 | 13,103 |
| Shared by Count/Build and Solve (live) | 35 | 3,560 |
| Shared by Count/Build and the old Solve cards | 8 | 779 |
| Old Solve cards only (One-step, Two-step old, Switch sides) | 14 | 962 |
| Shared by live and old Solve | 4 | 141 |
| App shell (main, progress, sync, diagnostic, packmap, account, fluency...) | 23 | 3,273 |

**Why "shared" is large (obs):** `play/walkLightPlay.js:58-63` imports every Build it play adapter (it is the table of "which walk goes with which card"), and `engine/lightCards.js` imports Solve it's old typed checkers; the graph therefore treats most of the Count/Build engines as one family.

### 5C. By pack and role, Count it + Build it (named files, lines)

| Group | Engine | Play | View | Packs | Total |
|---|---|---|---|---|---|
| Combine it + Flip It (walks, light mode) | 1,433 | 302 | 749 | 37 | **2,521** |
| Group It | 563 | 51 | 568 | 0 | **1,182** |
| Boxes & Circles | 1,378 | 178 | 901 | 0 | **2,457** |
| Groups of Terms | 929 | 113 | 689 | 0 | **1,731** |
| Distribute, then combine | 692 | 190 | 179 | 0 | **1,061** |
| Value it | 333 | 26 | 172 | 0 | **531** |
| Shared light layer (adapter table, cards table, tour, log, fluency) | 805 | 82 | 487 | 0 | **1,374** |
| **Total** | | | | | **10,857** |

CSS for Count it / Build it: about **1,067** lines (Group It through Value it, `style.css:983-2049`) plus **371** for the diagnostic and fluency (`2050-2420`) and 16 for Value it. Tests by dominant family: Count/Build **19 files, 3,164 lines**; shared **25 files, 3,113 lines**.

### 5D. By role, Solve it (named files, lines)

| Group | Lines |
|---|---|
| The loop itself (`solveLoop`, `solveTerms`, `shape`, `registry`, `honest`, `multiplyMenu`, `nudge`, the check pieces) | 1,942 |
| The term layer and lights (grab, drag, hover, panel, spotlight, fit) | 2,742 |
| Shared screens (`solveScreen`, `addBothScreen`, `addBothMat`, `lightScreen`, pointer) | 2,547 |
| Card configs (`cards/*`, `divideMoves`, `addMove`, ...) | 2,259 |
| Help rungs per shape | 542 |
| Problem forms and generators (new cards) | 1,478 |
| Per-card screens, feedback and adapters | 1,311 |
| Numeric levels ("See why it works") | 793 |
| **Old cards: One-step (live), Two-step (retired), Switch sides (retired)** | **1,178** |
| **Total** | **14,792** |

CSS for Solve it: about **1,328** lines (`style.css:2578-3905`). Tests: Solve it live **35 files, 5,850 lines**; old cards **3 files, 527 lines**. **The loop and its layers (rows 1-3) are about 7.2k lines; a card on top costs about 0.5k** (inf, summed from the files: Flip `cards/flip` 168 + `generateFlip` 106 + `rungs/flip` 73 + `flipScreen` 145 + `flipFeedback` 32 = 524; Two-step 544; Distribute-solve 547; Strange about 480).

### 5E. The ten biggest duplicated or near-duplicated pieces (obs)

Exact 6-line runs found across files (a script; near-duplicates with renamed variables are not found, so these are minimums):

| # | Duplicate | Files and lines | Lines |
|---|---|---|---|
| 1 | The Group It session and the Groups of Terms session share their step reducers | `engine/lassoSession.js` ↔ `engine/termGroupSession.js` (biggest run 9 lines at 186/212) | 65 |
| 2 | The Group It Mat and the Groups of Terms Mat share counter-row drawing | `view/lassoMat.js` ↔ `view/termGroupMat.js` (18 lines at 71/80) | 65 |
| 3 | Two Solve cards' reducers share a 27-line block | `engine/cards/distribute.js` ↔ `engine/cards/twoStep.js` (27 lines at 80/94) | 55 |
| 4 | `bothSides` and `distribute` card configs | `engine/cards/bothSides.js` ↔ `cards/distribute.js` | 44 |
| 5 | The old One-step and Value it light reducers (same rung machine) | `engine/solveLight.js` ↔ `engine/valueLight.js` (15 lines at 73/63) | 30 |
| 6 | Divide and Flip screens | `view/divideScreen.js` ↔ `view/flipScreen.js` (12 lines at 81/31) | 27 |
| 7 | `bothSides` and `twoStep` card configs | `engine/cards/bothSides.js` ↔ `cards/twoStep.js` | 24 |
| 8 | Palette builders (`button()` written 10 times: `controls`, `bigControls`, `lassoControls`, `boxControls`, `boxLightControls`, `termGroupControls`, `lightControls`, `walkLightControls`, `distributeTypedControls`, `addBothControls`) | biggest pair `view/divideControls` ↔ `view/numericControls` (20 lines), `controls` ↔ `lassoControls` (22) | about 150 across the ten |
| 9 | Helpers redefined per file: `signed` (22 copies), `const range =` (18 generator files), `const say =` (21 engines), `function el(` (9 Mats), `function html(` (6), `const clone =` (5 sessions), `gcd` (5), `counter` drawing (8) | see Part 3 #13-14 | about 100 lines in copies, 70+ call sites |
| 10 | `crossHint` and `factorHint` (two near-identical hint overlays) | `view/crossHint.js` ↔ `view/factorHint.js` (15 lines at 32/31) | 15 |

**Sum of exact repeats found: about 0.55k lines.** About 0.23k are inside Count it / Build it's own files (rows 1, 2, 8), about 0.17k inside Solve it (rows 3, 4, 6, 7, 10), and **one crosses the line: row 5 (30 lines), the old One-step reducer, which was written from Value it's** (it goes if One-step is removed). Helpers (row 9) are copied on both sides. (obs: the script's output; inf: near-duplicates with renamed variables would add some.)

### 5F. Code that exists only for retired or superseded cards

| What | Files | Source lines |
|---|---|---|
| **Two-step (old) and Switch sides** (both retired; their pack entries stay in `PACKS` for saved levels): `generateSwitch`, `generateSolve2`, `switchSides`, `switchPlay`, `switchMat`, `switchFeedback`, `switchPointer` | 7 | **437** (obs: the files that become unreachable from `main.js` if their play adapters and generators are removed; scenario A) |
| **One-step (live, but superseded in part)** and what only it still holds up: `solveLight`, `solve`, `solve2`, `equation`, `generateSolve`, `solveLightPlay`, `solveMat`, `solveFeedback`, `solve2Rows`, `undoConstant` | 10 | **741** more (scenario B total: 17 files, **1,178**) |
| Old typed-diagnostic entries in `lightCards.js` (`solve`, `addBoth`, `divide`: about 25 lines) and the probes in `diagnostic.js:22-38` | 2 | about 40 (these stay while the diagnostic reads those cards) |
| CSS for the old Mat (`.solve-mat`, `.sv-*`, `.sw-*`): rules mentioning them | | about **161** |
| Tests: `solve.test.js` 174, `solve2.test.js` 198, `switch.test.js` 155 | 3 | **527** |
| `?light=0` (the pre-light step-by-step path): the old adapter selection in `main.js:66` and `PLAY` | | about 20 (the adapters themselves are the walks, still live) |
| The hidden Distribute drill (`distributeDrill.js`, listed in `OLD-CARDS-INVENTORY.md` §5) | 0 | **gone already** (Build M; obs: no such file) |

Every file in `src/` is reachable from `main.js` (obs: a script found none unreachable), so there is no dead file in the strict sense; "dead" here means "kept only for a retired card or a card Karl is considering retiring".

### 5G. The honest estimate (inf, with reasoning)

**Retiring the dead code.**
- Scenario A (Two-step old + Switch sides code removed; One-step stays): **437 source lines + 155 test lines + about 20 CSS lines ≈ 0.6k lines, 1.3% of the 47.5k total** (28,405 + 3,905 + 15,199).
- Scenario B (also One-step; the diagnostic repointed first): **1,178 source + 527 test + about 161 CSS ≈ 1.9k lines, about 4%**. It removes 17 files. It does **not** remove the pack entries, the save-code bits or the legacy-credit table (`progress.js:107-116`), which must stay.
- What it *adds*: a Multiply card for `x / a = b` first (about 0.5k lines if it is the size of Flip it, Part 6).

**Migrating Count it and Build it onto the loop** (a statement about size, not a recommendation).
- *What could go away (inf):* per-pack session reducers (about 2.6k: `session` 184, `bigSession` 185, `lassoSession` 238, `termSession` 328, `termGroupSession` 278, `distributeSession` 105, `lightSession` 282, `boxLight` 239, `groupLight` 211, `walkLight` 158, `valueLight` 81, `distributeTyped` 127, `boxModel` 185), their controls and feedback views (about 1.7k) and adapters (about 0.9k): **about 5.2k** in the best case.
- *What must stay or be written (inf):* the drawings (about 2.6k: `mat`, `boxMat`, `lassoMat`, `termGroupMat`, `groupLightMat`, `valueMat`, `lightMat`, ...), the generators and validators (about 1.9k: content), the feedback words, and **a loop card per pack** (about 0.5k each, 7 packs: about 3.5k) and **the new expression machinery** in 4D (about 2-3k).
- *Net:* during the migration both exist, so the code grows by about **+3k to +6k**. After: **roughly −1k to +3k** from today, i.e. **about flat**. The duplication that sharing would remove is small (Part 5E: about 0.25k exact repeats inside Count/Build); most of Count/Build is content a migration keeps. **The gain, if any, shows in the cost of the next card**: about 0.5k for a loop card against 0.5k-2.5k for a Count/Build card, and in not needing to write each new help twice.
- *Uncertainty:* the estimate rests on the new expression machinery's size, which I could not measure because it does not exist; if it is 5k instead of 2-3k the net moves by +2k.

---

## Part 6. Retiring One-step equations

**State today (obs).** `one-step` is **live**: shown 3 levels (saved levels 3-5; saved 1-2 are hidden because Add to both sides took them), `packs/index.js:90-103`, listed in the Solve it section (`packs/index.js:274`), played by `solveLightPlay` (`main.js:73`).

### 6A. Where it is used

| Where | Detail | Evidence |
|---|---|---|
| Section list and card | `SECTIONS` solve list; `oneStep` object with `firstLevel: 3` | `packs/index.js:90-103,274` |
| Adapter | `'one-step': solveLightPlay` (also serves the retired `two-step`) | `main.js:73-74`; `play/solveLightPlay.js:20` |
| Placement quiz | probes `one-step` levels **[2, 4]** ("x − a = b, and x / a = b"); **order matters** for saved diagnostics (a problem keeps its seed from its probe index) | `engine/diagnostic.js:22,47-52`; tests `diagnostic.test.js:23,91,127,133,211,357-361` |
| Legacy credit into live cards | Add to both sides L2 ← One-step L1, L3 ← One-step L2; Divide it L2 ← One-step L3, L3 ← One-step L5 | `engine/progress.js:101-116` |
| Save codes | 8 bits reserved in every layout that has Solve it bits (5 used) | `progress.js:255-360`; parity `savecode:one-step-L1..L5` (`tests/parity/INTENDED-CHANGES.md:411-415`) |
| Class sheet | one column per saved level (`one-step-3`...); the sheet merges "finished anywhere stays finished" | `teacher/Code.gs:376-391` |
| Test links | **none** (`public/test-links.json` has no `one-step` link or entry) | obs: searched |
| Tests naming it | `solve.test.js` (whole file), `diagnostic.test.js`, `packs.test.js:11,27`, `progress.test.js:69-138`, `savecode.test.js:14,264`, `distSolve.test.js:431`, `flip.test.js:196`, `twoStep.test.js:313`, `switch.test.js:149`; `tests/features/walk.mjs:1527` clicks the diagnostic's One-step probe | obs: grep |
| Streak "one-step tips" | a different thing (the first-time tip on a new pad), not this card | `engine/tour.js:39` |

### 6B. Files used only by it (and who else needs them)

`engine/solveLight.js` (also imported by the retired Switch sides' `switchSides.js`), `engine/solve.js` (also `generateSolve`, `generateSwitch`, `equation.js`), `engine/generateSolve.js` (also `generateSwitch`), `play/solveLightPlay.js` (also the retired Two-step), `view/solveMat.js` (also `switchMat`), `view/solveFeedback.js`, `view/undoConstant.js`, and the `solve` entry in `lightCards.js:190-196,227` (used by the diagnostic). They are all gone from the graph only if the retired Two-step and Switch sides code goes too (Part 5F scenario B). Tests: `solve.test.js` (174 lines).

### 6C. What content it alone still covers (obs)

| One-step level | Form | Covered by another live card? |
|---|---|---|
| Saved 3 (shown 1) | `ax = b`, a 2-6, answers 2-12 positive, at most 36 counters | **Yes**: Divide it Levels 2-6 (a 2-6, answers ±2..6) |
| Saved 4 (shown 2) | **`x / a = b`**, a 2-6, b 2-12, x = a·b ≤ 36 | **No.** Whole-number Multiply is a greyed move on every card except Divide it, where it is *explained, not applied* (loop §1C; `divideBlank.js:12-14,50-54`); `x/a` appears nowhere else (obs: no other generator writes it). Fractions as coefficients appear only inside a parenthesis (Distribute more: `1/4(8x + 8)`) |
| Saved 5 (shown 3) | all four forms mixed | Partly: Add (x ± a), Divide (ax) cover three of the four forms; `x/a` does not |

Whole answers are all positive and at most 36 (`generateSolve.js:2-3`). There is no `−x = b` here (Flip everything has it).

### 6D. What must exist first

1. **A card or level where Multiply by a whole number is a live move for `x / a = b`** (a Multiply card, or promoting Divide it's "explained" option to "applied"). It would be about the size of Flip it (about 0.5k source lines, inf). Spec `OLD-CARDS-INVENTORY.md` §3E rates it "medium, the smallest of the new engine pieces".
2. **A repointed placement quiz.** The `one-step` probe's second item (L4, `x / a = b`) needs another card to read it; the first (L2, `x − a = b`) is already covered by the Add probe. Replace the probe **in the same position in the list** (saved places depend on the index; `diagnostic.js:26,32`); removing it would shift every later problem's seed.
3. **Keep `one-step` in `PACKS` with `retired: true`** and its 8 save-code bits (as Switch sides and the old Two-step are, `packs/index.js:129,142`); keep `LEGACY_ADD_BOTH` and `LEGACY_DIVIDE` reading it.
4. Update the exact-list tests (Part 7).
5. Decide the fate of the retired adapters: a retired card's `?pack=` link still opens it today (`main.js:652` checks `retired` only for resume); scenario B removes the code, so those links stop playing (inf).

---

## Part 7. Splitting Solve it into two sections

### 7A. Where "section" is used (obs)

| Place | What it does with sections | Evidence |
|---|---|---|
| The data | `SECTIONS`: `{ id, title, blurb, packs: [ids] }` for `count`, `build`, `solve`; `sectionById`, `sectionOf` | `packs/index.js:271-275` |
| The home screen | `landing()` draws one big panel per section (`h('button', 'section-panel sec-<id>')`) and `sectionBar()` one tab and dropdown per section; both are built from `SECTIONS` | `view/packmap.js:92-110,112-127` |
| Layout and colour (CSS) | **`.landing` is `repeat(3, minmax(0, 1fr))`**; one colour line per section id (`.sec-count`, `.sec-build`, `.sec-solve`) and per-card tint lines; an entrance animation delay for the first three panels | `style.css:2439-2441,2449-2453,2495-2496,2501-2503` |
| The diagnostic | `DIAGNOSTIC_SECTIONS = ['count', 'build', 'solve']`; each probe names its section; saved per section in `mat.diag.v2` | `engine/diagnostic.js:14-43`; `diagStore.js:53`; `main.js:667-683` |
| Progress and the class sheet | **No section concept**: progress and columns are per pack and level | `progress.js`; `teacher/Code.gs:376-391` |
| Test links | The page's own `Live / Testing / Retired` groups are not the app's sections | `public/test-links.json` |
| Build X's planned menu and section-gold logic | **Not in the repo** (searched code, specs, decision log, handoff, test links for "Build X" and "gold": no match). I cannot say what it needs | obs |
| Section gold | **No such thing exists** in code (no match for `gold`) | obs |
| Tests | `SECTIONS.find(s => s.id === 'solve').packs` is asserted exactly in `distSolve.test.js:431`, `flip.test.js:196`, `switch.test.js:149`, `twoStep.test.js:313`, `packs.test.js:42+`; `diagnostic.test.js:211` asserts the Solve probes | obs |

### 7B. How hard a second Solve it section is (inf)

**Mostly a config change, plus about five small edits:**
1. Add a `SECTIONS` entry and move card ids between the lists (data only).
2. `style.css`: one `--sec` colour line, the card tint line, and **change `.landing` from 3 columns** (4 panels would wrap to a second row otherwise) and the animation delays.
3. The diagnostic: either keep one Solve diagnostic and give its probes a `section` of whichever half they belong to, or leave the new section without one (`diagnosticBar` is skipped when `diags[sec.id]` is missing, `packmap.js:122`). **The Solve diagnostic's probes (`one-step`, `two-step`→new Two-step, `add-both`, `divide-it`) are all in the basic half**, so the 8th-grade section would simply have no diagnostic today.
4. Update the five exact-list tests.
5. Check the dropdown width: `.section-bar` is a flex row (`style.css:2486`), so four tabs fit, but the dropdown of 6 or more cards uses `packs-${Math.min(6, n)}` (`packmap.js:123`).

**Nothing else breaks:** unlock is within a pack only (`progress.js:32-38`), so there is no cross-card gate to preserve; there is no section-level progress to split; and the class sheet does not know sections.

### 7C. The current Solve it cards, in order (obs, `packs/index.js`)

| # | Card (id) | Saved levels | Shown | What it teaches | Prerequisite on another card (obs unless marked) |
|---|---|---|---|---|---|
| 1 | Add to both sides (`add-both`) | 6 | 5 + "See why it works" | `x + a = b` ... both forms, x on the right, bigger | none |
| 2 | Divide it (`divide-it`) | 6 | 5 + "See why it works" | `ax = b`, take a fraction of both sides | none (independent of 1) |
| 3 | Flip everything (`flip-everything`) | 6 (saved 1 is reserved, not built) | 5 | `−x = b`, `b = −x`, `−ax = b` | Level 3 uses **Trade places** (Add L5); Level 4 uses **Take a fraction** (Divide) (`cards/flip.js:25-26`) |
| 4 | One-step equations (`one-step`) | 5 (8 bits) | 3 (saved 3-5) | `ax = b`, `x / a = b`, mixed | none; **old card** (Part 6) |
| 5 | Two-step equations (`two-step-equations`) | 7 | 7 | `ax + b = c` and the other forms | Add + Divide; Level 3 uses **Trade places**; Level 5 uses **Flip everything** (`cards/twoStep.js:29-30`) |
| 6 | Distribute, combine, solve (`distribute-solve`) | 5 | 5 | `a(x + c) = b`, `n + a(x + c) = b`, like x-terms | The **distribute move** (new on this card) then "finish as in Two-step" (pack comment); optional link "Practice distributing first" → Build it's `distribute-combine` |
| 7 | **Variables on both sides** (`variables-both-sides`) | 5 | 5 | `ax = bx + c`... negatives, parentheses | **Level 5 uses the distribute move from card 6** (`cards/bothSides.js:9`); finishes "as in Two-step" |
| 8 | Distribute more (`distribute-more`) | 5 | 5 | the invisible −1, a fraction factor | Distribute (6) and Variables on both sides (7): "finish as on Variables on both sides" |
| 9 | Strange solutions (`strange-solutions`) | 5 | **3** (saved 4-5 hidden until V2) | fraction answers, simplifying, `x = 0` | Variables on both sides (7); L5 "mixed, with distributing" needs card 8 (hidden) |
| — | Switch sides (`switch`), Two-step old (`two-step`) | 6, 7 | retired (not in any section) | | |

**Totals:** 9 live cards, **43 levels shown**, 50 saved level bits (+13 on the two retired cards).

**If the cut is "an 8th grade level that starts at Variables on both sides":** the 8th-grade section would hold cards 7, 8, 9 = **13 shown levels**; the basic section cards 1-6 = **30 shown levels**. The only prerequisite that crosses that line is VBS Level 5 ← the distribute move from card 6 (in the basic half). Distribute more and Strange then lean on VBS (inside the 8th grade half). Nothing in the app enforces order across cards, so the cut is a presentation choice, not a code constraint (obs: `isLevelUnlocked`, `progress.js:32-38`).

---

## Questions for Karl (recommended option first)

1. **Where does the 8th-grade cut fall?** (a) Cards 7-9 (Variables on both sides, Distribute more, Strange solutions) as the 8th-grade section, with Distribute, combine, solve in the basic section; (b) also move Distribute, combine, solve; (c) another cut. (a) keeps the one cross-card prerequisite (VBS L5 ← distribute) pointing from the 8th-grade section back to the basic one.
2. **What should a "Need a refresher?" button do when pressed?** (a) Open the Count it / Build it level with `startLevel`, the way "Practice distributing first" does, accepting that Back goes home and the Solve problem in progress is replaced; (b) open it and add a "Back to my problem" (needs a small return stack that does not exist); (c) a link that opens a new tab.
3. **Which skills get a refresher first?** (a) The 13 clean matches: Combine it L2-L3 (adding signed numbers), Group It L1-L3 (signed multiplication), Groups of Terms L1-L5 and Distribute then combine L2 (distributing); (b) also the 13 partial ones.
4. **Skills with no home** (simplifying fractions, dividing by a negative, the equation ideas): build a Count it level for them, or leave Solve it's own cards to teach them?
5. **Retiring One-step:** which first, (a) a Multiply card for `x / a = b`, or (b) promote Divide it's explained Multiply option to a live move? Either way the placement quiz's One-step probe needs a replacement **in the same slot**.
6. **What counts as "a Count it support used from Solve it" on the class sheet?** Should a refresher visit appear as its own event word, as the Count it level's normal record, or not at all? (CLAUDE.md says do not change the existing words, so a new word is an "exactly what Karl asks for".)
7. **A parity net for Count it and Build it before any migration or bolt-on?** The net protects Add/Divide only today.
8. **Where is Build X's planned menu and section-gold logic written down?** I could not find it in the repo; if it is on another branch or in the design chat, I need it to judge Part 7.
9. **The old One-step card is drawn in Count it's frame** (step bar, streak, sentence at the bottom) while its neighbours are not: is that acceptable until it is retired?

---

## Links to look at

All links are the live site's address plus the card, level and seed; `nosignin=1` skips the sign-in. A first-time tour appears on a device that has not seen the site (the `ci-tour` picture); the others were taken after it was dismissed. Most of the later states need one or two key presses after it opens, shown in the right column. Pictures of each are in `docs/audit/shots/` (same name).

### Count it and Build it

| Shot | Link | What to do after it opens |
|---|---|---|
| `ci-tour` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=1&seed=7&nosignin=1 | (just open it) |
| `ci-L1-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=1&seed=7&nosignin=1 | (just open it) |
| `ci-L1-stuck1` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=1&seed=7&nosignin=1 | press I'm stuck |
| `ci-L1-teach` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=1&seed=7&nosignin=1 | press Teach me step-by-step |
| `ci-L1-signslip-circle` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=1&seed=2&nosignin=1 | type −3, then press Check |
| `ci-L1-signslip-cloze` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=1&seed=2&nosignin=1 | type −3, then press Check, then press I'm stuck |
| `ci-L1-signslip-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=1&seed=2&nosignin=1 | type −3, then press Check, then press I'm stuck, then press I'm stuck |
| `ci-L3-battle-as-party` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=3&seed=3&nosignin=1 | type −9, then press Check |
| `ci-L3-fade-upfront` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=3&seed=3&nosignin=1 | type −9, then press Check, then press Battle!, then type 3, then press Check, then press Check |
| `ci-L4-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=4&seed=7&nosignin=1 | (just open it) |
| `ci-L4-wrong-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=4&seed=7&nosignin=1 | type 99, then press Check |
| `ci-L5-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=5&seed=7&nosignin=1 | (just open it) |
| `ci-L5-wrong-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=combineit&level=5&seed=7&nosignin=1 | type 99, then press Check |
| `fi-L1-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=flipit&level=1&seed=7&nosignin=1 | (just open it) |
| `fi-L1-stuck1-rewrite` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=flipit&level=1&seed=7&nosignin=1 | press I'm stuck |
| `fi-L1-stuck2-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=flipit&level=1&seed=7&nosignin=1 | press I'm stuck, then press I'm stuck |
| `fi-L5-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=flipit&level=5&seed=7&nosignin=1 | (just open it) |
| `fi-L5-wrong-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=flipit&level=5&seed=7&nosignin=1 | type 99, then press Check |
| `gi-L1-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=lasso&level=1&seed=7&nosignin=1 | (just open it) |
| `gi-L1-signslip-cloze` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=lasso&level=1&seed=2&nosignin=1 | type 6, then press Check |
| `gi-L1-cloze-wrong-pick` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=lasso&level=1&seed=2&nosignin=1 | type 6, then press Check, then click a cloze choice |
| `gi-L1-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=lasso&level=1&seed=7&nosignin=1 | press Teach me step-by-step |
| `gi-L2-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=lasso&level=2&seed=7&nosignin=1 | (just open it) |
| `gi-L2-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=lasso&level=2&seed=7&nosignin=1 | press Teach me step-by-step |
| `gi-L4-fraction-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=lasso&level=4&seed=7&nosignin=1 | press Teach me step-by-step |
| `gi-L4-removed-part` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=lasso&level=4&seed=2&nosignin=1 | type −10, then press Check |
| `bx-L1-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=boxes&level=1&seed=7&nosignin=1 | (just open it) |
| `bx-L1-wrong-boxes` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=boxes&level=1&seed=7&nosignin=1 | type 1x, then press Check |
| `bx-L1-wrong2-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=boxes&level=1&seed=7&nosignin=1 | type 1x, then press Check, then type 2x, then press Check |
| `bx-L1-teach` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=boxes&level=1&seed=7&nosignin=1 | press Teach me step-by-step |
| `bx-L3-rewrite-button` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=boxes&level=3&seed=7&nosignin=1 | click Rewrite subtractions |
| `bx-L4-invisible-one` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=boxes&level=4&seed=1&nosignin=1 | type 11x+2, then press Check |
| `bx-L5-teach-rewrite` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=boxes&level=5&seed=7&nosignin=1 | press Teach me step-by-step |
| `bx-L2-model-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=boxes&level=2&seed=7&nosignin=1 | (just open it) |
| `bx-L2-model-wrong1-key` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=boxes&level=2&seed=7&nosignin=1 | type 1x, then press Check |
| `bx-L2-model-wrong2-columns` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=boxes&level=2&seed=7&nosignin=1 | type 1x, then press Check, then type 2x, then press Check |
| `bx-L2-model-teach` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=boxes&level=2&seed=7&nosignin=1 | press Teach me step-by-step |
| `got-L1-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=groups-of-terms&level=1&seed=7&nosignin=1 | (just open it) |
| `got-L1-dist-one-arrows` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=groups-of-terms&level=1&seed=1&nosignin=1 | type 2x+2, then press Check |
| `got-L2-inside-sign-lost` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=groups-of-terms&level=2&seed=1&nosignin=1 | type 9x+3, then press Check |
| `got-L4-neg-first-hidden1` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=groups-of-terms&level=4&seed=2&nosignin=1 | type −3x+4, then press Check |
| `got-L1-outer-as-term-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=groups-of-terms&level=1&seed=1&nosignin=1 | type 2x+3, then press Check |
| `got-L1-stuck1-arrows` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=groups-of-terms&level=1&seed=7&nosignin=1 | press I'm stuck |
| `got-L1-teach` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=groups-of-terms&level=1&seed=7&nosignin=1 | press Teach me step-by-step |
| `got-L6-fraction-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=groups-of-terms&level=6&seed=7&nosignin=1 | press Teach me step-by-step |
| `dc-L1-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-combine&level=1&seed=7&nosignin=1 | (just open it) |
| `dc-L1-dist-one-arrows` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-combine&level=1&seed=1&nosignin=1 | type −3x−12, then press Check |
| `dc-L3-inside-sign-lost` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-combine&level=3&seed=1&nosignin=1 | type −6x−6, then press Check |
| `dc-L2-neg-first-hidden1` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-combine&level=2&seed=5&nosignin=1 | type x−3, then press Check |
| `dc-L1-teach-walk` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-combine&level=1&seed=7&nosignin=1 | press Teach me step-by-step |
| `dc-L4-typed-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-combine&level=4&seed=7&nosignin=1 | (just open it) |
| `dc-L4-show-me` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-combine&level=4&seed=7&nosignin=1 | click Show me |
| `dc-L5-typed-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-combine&level=5&seed=7&nosignin=1 | (just open it) |
| `val-L1-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=value&level=1&seed=7&nosignin=1 | (just open it) |
| `val-L1-rung1` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=value&level=1&seed=7&nosignin=1 | press I'm stuck |
| `val-L1-rung2` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=value&level=1&seed=7&nosignin=1 | press I'm stuck, then press I'm stuck |
| `val-L1-rung3` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=value&level=1&seed=7&nosignin=1 | press I'm stuck, then press I'm stuck, then press I'm stuck |
| `val-L4-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=value&level=4&seed=7&nosignin=1 | (just open it) |
| `val-L4-teach` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=value&level=4&seed=7&nosignin=1 | press Teach me step-by-step |
| `dc-L4-hint-after-3-wrong` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-combine&level=4&seed=7&nosignin=1 | type 1, then press Check, then type 1, then press Check, then type 1, then press Check |

### Solve it, for comparison (Part 3)

| Shot | Link | What to do after it opens |
|---|---|---|
| `sv-add-both-L2-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=add-both&level=2&seed=7&nosignin=1 | (just open it) |
| `sv-add-both-L2-stuck1` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=add-both&level=2&seed=7&nosignin=1 | click I’m stuck once |
| `sv-divide-it-L2-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=divide-it&level=2&seed=7&nosignin=1 | (just open it) |
| `sv-divide-it-L2-stuck1` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=divide-it&level=2&seed=7&nosignin=1 | click I’m stuck once |
| `sv-flip-everything-L2-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=flip-everything&level=2&seed=7&nosignin=1 | (just open it) |
| `sv-two-step-equations-L1-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=two-step-equations&level=1&seed=7&nosignin=1 | (just open it) |
| `sv-distribute-solve-L1-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-solve&level=1&seed=7&nosignin=1 | (just open it) |
| `sv-distribute-solve-L3-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-solve&level=3&seed=7&nosignin=1 | (just open it) |
| `sv-variables-both-sides-L2-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=variables-both-sides&level=2&seed=7&nosignin=1 | (just open it) |
| `sv-distribute-more-L3-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=distribute-more&level=3&seed=7&nosignin=1 | (just open it) |
| `sv-strange-solutions-L1-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=strange-solutions&level=1&seed=7&nosignin=1 | (just open it) |
| `sv-one-step-L3-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=one-step&level=3&seed=7&nosignin=1 | (just open it) |
| `sv-one-step-L4-start` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=one-step&level=4&seed=7&nosignin=1 | (just open it) |
| `sv-one-step-L4-stuck2` | https://karlmaukskoepke.github.io/AlgebraMat/?pack=one-step&level=4&seed=7&nosignin=1 | press S twice (I'm stuck) |

The `home` picture is the pack map (`/` with no pack), seed-free: https://karlmaukskoepke.github.io/AlgebraMat/?nosignin=1

**Notes on the pictures.** They were taken with sound off and the first-time tour and pad tips already dismissed (except `ci-tour`), on Vite's dev server built from `d22163a`, at 1366×768, one fixed seed per scenario (the seed is in the link). Where a wrong answer was needed, I picked one that the tagger reads as the named slip (`engine/lightCards.js`), so the problem in the picture is the first of that seed's set. Not pictured: the sign read-back (#5, shows on a later problem), the 60-second fluency challenge and the Group It / Boxes drag gestures themselves (the pictures show the state a drag starts from).

---

## What surprised me

1. **Signed multiplication is covered** (Group It L1-L3), so the "no home" list is shorter than you thought: simplifying fractions, dividing by a negative and the equation ideas.
2. **Only two scaffolds in the whole of Count it and Build it fade** (the party-or-battle question and the sign read-back, on two cards). Everything else starts fresh on each problem.
3. **The old One-step card is drawn in Count it's frame** (step bar, streak, the sentence below), in the middle of Solve it's cards.
4. **The two sections are less separate in code than on the home screen.** One file (`walkLightPlay.js`) imports every Build it adapter, and `lightCards.js`, which every Count/Build card uses, imports Solve it's old typed checkers.
5. **The same slip has different names on each side** (`first-only` against `dist-one`), so the class sheet cannot add them up.
6. **The light-mode problem is one text string**, not separate terms, so "add the drag feature to Build it" is a new row-of-terms view plus a small reducer, not just a pointer layer.
7. **The parity net protects only Add to both sides and Divide it.** Forty Count it / Build it levels have no screen or trace baseline.
8. **Build X's menu and section-gold logic are not in the repo.**
9. **Divide it reuses Group It's magenta and green** for negative and positive counters; in Group It they mean "opposite of" and "inside a group".

---

## A short message to Karl

The report is at `docs/audit/LOOP-FIT-AND-SCAFFOLDS.md`, with 75 pictures in `docs/audit/shots/`. Top five findings:

1. **The scaffolds lift out well.** 31 of the 36 scaffolds in Count it and Build it are pure logic or pure drawings; the tangled part is the screen frame around them. Solve it already borrows a few (Combine it's walks inside Add to both sides; Group It's counter inside Divide it).
2. **Prerequisite map:** of Solve it's 33 slip words, 13 point straight at a Count it / Build it level, 13 partly, and 7 have no home. No level teaches simplifying fractions, dividing by a negative, or the equation ideas themselves.
3. **Loop fit:** the loop is built for equations (two-sided board, `x =`, check by dropping the value in). Only Groups of Terms and Distribute then combine use moves it already has; Combine it L1-3, Flip It, Group It, Boxes L2 and Value it are not loops. An expression board and an evaluate-at-a-test-value check would have to exist first.
4. **Code size:** 28.4k JavaScript lines, 3.9k CSS, 15.2k test lines. Retiring the old Solve cards is worth about 1.9k lines (about 4%). Sharing code with Count it / Build it would not obviously shrink the total (about flat after, more during): the saving is in the cost of each new card (about 0.5k lines against 0.5-2.5k).
5. **One-step and sections:** `x / a = b` is taught by no other live card, and the placement quiz still probes it. A second Solve it section is mostly a config change plus a CSS grid change and a few tests; there is no section-level progress or gold in the repo.

One fact worth having in hand before any plan: the parity net does not cover Count it or Build it at all.
