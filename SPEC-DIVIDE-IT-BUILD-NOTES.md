# Divide it: build notes (Claude Code's review of the spec, 2026-10-11)

*For Karl and the design chat. `SPEC-DIVIDE-IT.md` is saved unchanged. This is what checking it by code turned up, where it overlaps or leaves gaps, and what I'd build by default. Items marked **Decide** change what I build; everything else I'd build as proposed.*

## 1. What I checked by code

- **All 25 sample problems have the right answers**, with the form counts you listed: L1 two each of a = 2 and 3; L2 has a = 2, 3, 4, 5; L4 has two a = 4 and three a = 6; L5 has five different coefficients; every level has at least 2 positive and 2 negative answers; no b is over 36.
- **Every typed-answer slip example gives exactly the wrong answer the spec says** (`3x=−12` → −9, −15, −36, 3, −12, 4, −6, −3; `4x=24` → 8; `6x=12` → 6, 4; `6x=−18` → −9, −6; `4x=24` → 12).

## 2. Where the spec contradicts itself or leaves a gap

1. **Two sample problems break the generator's own rule.** `3x=9` (answer 3) and `4x=16` (answer 4) have answer = a, so the slip "Gave the number of boxes" (`3`, `4`) *is* the correct answer. §7 says every slip's wrong answer must differ from the right one. **Proposal:** the generator drops any problem whose answer equals a (so L1 can't use 2x=4 or 3x=9, L2 can't use 4x=16 or 5x=25, and so on) and I replace those two sample items.
2. **Several slips can give the same wrong number.** `6x=12` → 6 is "undid subtraction" (12 − 6), "gave the number of boxes", and "stopped halfway after ½" all at once; `2x=8` → 2 is both "gave the boxes" and "÷4"; `5x=15` → 5 is "boxes" and "÷3". **Proposal:** one tag per wrong value, in this order: ignored the number in front, wrong team, multiplied, stopped halfway, wrong number of groups, gave the number of boxes, undid addition. The message for the first match is what is shown.
3. **"Legal fractions" (§7) simplifies.** Because a always divides b, the fractions that work on both sides are exactly the divisors of a from 2 to 6: a = 4 allows ½ and ¼, a = 6 allows ½, ⅓ and ⅙, and a prime a allows only its own. So **every L4 problem has two legal first fractions**, and the "at least 2 problems" rule is automatic.
3b. **Composite coefficients appear before L4.** L2 and L3 include a = 4, where ½ is legal and doesn't finish. §2 says L4 is where that starts. **Decide:** at L2–L3, is ½ on `4x` (a) allowed, turning on the light and leaving `2x = …` to finish, or (b) shown as "right idea, not one box yet" with no light? I'd build (a), since the move really is legal and the same engine handles it, and the light just stays neutral at the end.
4. **L4–L5 are "symbols only" but the model is dealing and keeping.** The spec describes dealing counters and keeping a group (§3B), and says symbols only at L4–L5, with counters appearing on stuck rung 1. It never says what the symbol move is. **Decide.** My proposal: in symbols, tapping `× ⅓` runs the whole move. A fraction that splits both sides shows the record `⅓(3x) = ⅓(−12)` and then `x = −4`; one that doesn't shows the failed picture (the boxes or the counters that don't split) with Undo. The student still chooses the fraction and sees both sides change, but no deal and no keep. Is that right, or do you want a symbolic version of the keep tap?
5. **"Groups arrive pre-built" at L3** and **Deal a round** at L3 could mean the groups are drawn as soon as you pick the fraction (as at L1–L2) or that the counters are already dealt. I'd read it as: at L3 the empty groups are there and **Deal a round** is a new shortcut. **Decide** if you meant something else.
6. **The card opens with the tutorial "every time."** Per your decision today, it plays **once per student, then by choice** through a replay button (the same rule as the new tutorials on Add to both sides). The diagnostic doesn't change that.
7. **Prerequisite gate (§9.9).** No card gates another card today: levels open in order within a card, and nothing stops a student from starting any card. I'd keep it so and list Add to both sides first. **Decide** only if you want a lock.

## 3. Defaults I'd use for the other open questions

| § 9 question | What I'd do |
|---|---|
| 2. The ÷ bridge at L5 | No extra screen. At L5 the first problem shows one extra line: "⅓ of 12 and 12 ÷ 3 are the same thing." |
| 3. Printed notes | Rename the notes' "Sharing Among Boxes" to "Divide it" in the same pass as the "Switch sides → Cross the border" rename. |
| 4. Keep tap | Keep the tap (it is the student saying "both sides"). |
| 5. Larger values at L5 | Stay at 36 counters. |
| 6. Deal a round at L3 | Yes, L3. |
| 7. Light wording | "Smaller numbers" and "One box" as written. |
| 8. Failed attempts | Count toward the wrong-move ladder, never toward the stuck count. |

## 4. Old levels to new levels

Old One-step `ax = b` (old L3) is a = 2 to 6 with positive answers 2 to 12. Old L5 mixes all four forms. A new level is done only if its old counterpart is done, so nobody re-earns and nobody gets credit they didn't earn:

| New level | Done when |
|---|---|
| L1, L2 | old One-step L3 |
| L3 | old One-step L5 |
| L4, L5 | not mapped (composite coefficients and negatives are new) |

Old One-step `x/a = b` (L4) maps to Fraction equations when it is built. Until then the old One-step card stays on Solve it showing only L4 and L5 (renumbered 1 and 2), so those levels remain playable. The old L3 bit stays in older codes (read only), as for the other old cards.

## 5. What it reuses from Add to both sides

The Mat frame (balance and seesaw on the dashed border, the Balancing moves panel with checkboxes, tray), the tutorial engine and store, the lights, the stuck and teach ladders, the failed-attempt ladder (the red-move ladder there), the early-answer drag-check, and the "no streaks" setting. New: the fraction buttons (stacked `× ⅓` over `÷ 3`), the pile and groups with mirroring on the boxes, dealing and evenness readout, keeping one group, and the record `⅓(3x) = ⅓(−12)`.

## 6. Build order

1. Generator and checks (levels, form counts, answer = a excluded, legal fractions, slip tagger with the priority above).
2. The moves engine (pure): fraction pick, groups, deal, deal a round, evenness, keep, failed attempts, lights, stuck and teach paths, early answer, Undo.
3. The Mat and panel.
4. The tutorial (the numeric tutorial with the quiz, then the box version), once then by choice.
5. Save code, migration, diagnostic (one L2-type, one L4-type, one L5-type), log fields, register on Solve it.

I'd start this after the Add to both sides tutorials and save code are in, since they share the tutorial store and the v13 layout.

## 7. Karl's answers (2026-10-12)

1. **L4–L5 symbols.** Tapping `× ⅓` runs the whole move and shows both whole sides in parentheses with the fraction outside: `⅓(3x) = ⅓(−12)`. A fraction that doesn't split evenly shows its failed picture, and **Undo must be readily available**. Undo (red) and Continue/Go (green) sit under the equation, on the left and right, as on Add to both sides.
2. **`4x` at L2–L3.** `½` is allowed (it is legal and doesn't finish).
3. **The balance carries the models.** The boxes and counters stand on the seesaw at the top, so a move shows up on the left or right of the balance (built that way for Add to both sides; Divide it reuses it).
4. **The side panel pairs each move with its goals** (a green, red or grey checkbox beside the move that works toward it). Divide it adds its fraction buttons there, each with its light.

## 8. Build, step 1 (2026-10-12): the problems and the slip tagger

Built and tested, no screen yet: `src/engine/divide.js` (problem model, the five fractions, which fractions split which side, the typed-answer slip tagger with one tag per wrong value in the priority order of §2.2) and `src/engine/generateDivide.js` (levels 1–5 with the spec's form counts; a problem whose answer equals a is dropped; every set is verified by substitution). `tests/divide.test.js` checks every slip example in the spec and 750 generated sets.

**Before building the screen I need a decision.** The spec was written before Add to both sides became the "light build" pilot (a bare screen, Guess x or Use a move chosen first, a work stack, Level 1 numeric, scaffolds only from I'm stuck / Teach me). My proposal for Divide it on that pattern:
- **L1 is a numeric level** (`3 × 4 = 2 × 6`; ⅓ of one side upsets the balance, ⅓ of both keeps it; the keeps/upsets quiz; a watched `3x = 6` walkthrough), so the dealing-by-hand levels shift up and the five equation levels become L2–L6 as on the pilot.
- **Bare screen:** the move list with *Take a fraction of both sides* active, its five stacked buttons (`× ⅓` over `÷ 3`) in a row under the equation. Tapping a fraction runs the whole move on both sides in one action: the work stack shows `⅓(3x) = ⅓(−12)`, then `x = −4` unsimplified until typed, and the student types the value. A fraction that does not split shows which side breaks (the boxes or the counters) with Undo. No dealing and no keep tap on the bare screen.
- **The counters** (a pile shared into groups, dealing a round, keeping one group) are the scaffold from I'm stuck / Teach me, as the counters are on the pilot.
- Everything else follows the pilot: path choice, plug back in line by line, Enter moves forward, the lighter first I'm stuck (outline the number in front of x: "how many boxes? what fraction of both sides leaves one box?").

## 9. Build, step 2 (2026-10-12): the card, on the light-build pattern (Karl: "go with the light build pattern")

Built and on the Solve it screen, after Add to both sides. Six levels: **Level 1 is numeric**, Levels 2–6 are the five equation sets (the spec's L1–L5).

- **Level 1 (numeric):** `3 × 4 = 2 × 6`-type items with the balance readout; two "do" items (take ⅓, then ½, of the left side, then of the right, then Go), three quiz items (⅓ of one side only upsets; ⅓ of both keeps; ⅓ of the left and ½ of the right upsets; the "TAKE ⅓ of …" part in blue; either answer shows what happened, then a green Next), then a watched `3x = 6` walkthrough that keeps every step on screen and ends by plugging 2 back in. No seesaw picture yet, only the readout.
- **Equation levels:** the bare screen. Guess x or Use a move, fixed; the move list has "Take a fraction of both sides" active; choosing it opens a row of five stacked buttons (`× ⅓` over `÷ 3`); tapping one takes that fraction of both sides in one action. The work stack shows `⅓(3x) = ⅓(−12)` (the fraction in blue) and then `x = ⅓(−12)` unsimplified on the finishing move (the value is never shown before it is typed), or the smaller numbers on a partial move (`½` on `4x = 24` leaves `2x = 12`).
- **A fraction that does not split** is a failed attempt: its row is shown in red with ✗, the line names the side that broke ("3 boxes can't make 2 equal groups", "12 can't be shared into 5 equal groups (2 left over)"), Undo is highlighted, a new try replaces it, and three in a row offer Start over. It counts toward that ladder, never toward the stuck count.
- **Lights:** Smaller numbers (green after a move that splits) and One box (green when the coefficient is 1; grey until then). They never go red. The other Why? boxes in the panel follow the good move, as on Add to both sides.
- **Plugging back in** (every typed value): the original equation outlined, `3 × (−4) = −12`, a line a click. A correct guess makes the next problem a move (and adds a sixth problem if it was the last). Enter moves forward through everything.
- **Slips** (§5) in the priority order of §2.2: ignored the number in front, wrong team, multiplied, stopped halfway, wrong number of groups, gave the number of boxes, undid addition. Each has its message, shown after the substitution.
- **Help:** the first I'm stuck outlines the number in front of x ("3 boxes. What fraction of both sides leaves one box?") with the fraction row open; the second points at the right fraction; Teach me allows only the right fraction. **Not built yet:** the counters scaffold (a pile shared into groups, dealing a round, keeping one group), as a further rung of I'm stuck.
- **Progress:** save code **v14** (16 data symbols, one longer; v13 codes still read). Old One-step `ax = b` (level 3) credits Divide it Level 2 and the old mixed level (5) credits Level 3; Level 1 is never credited. The diagnostic gets three problems (the spec's L2, L4 and L5 types, the card's Levels 3, 5, 6): a wrong first opens Levels 1–2, then 1–4, 1–5, 1–6; a right first problem skips the numeric Level 1.
- **Still open:** the old One-step card (its multiply/divide levels) stays on the screen until the Fraction equations card replaces its other levels; the tutorial's "once then by choice" replay; the printed-notes rename ("Sharing Among Boxes" → "Divide it").
