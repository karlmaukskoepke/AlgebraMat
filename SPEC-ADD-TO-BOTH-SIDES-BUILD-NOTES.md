# Add to both sides: build notes (Claude Code's review of the pilot spec, 2026-10-11)

*For Karl and the design chat. The spec (`SPEC-ADD-TO-BOTH-SIDES.md`) and the decision log (`DECISION-LOG.md`) are saved unchanged. This file is what building it turned up: what checks out, what contradicts itself, what the spec doesn't say, and the order I'd build in. Items marked **Decide** need an answer before I build that part; everything else I'd build as proposed.*

## 1. What I checked by code

Every sample bank and every typed-answer slip example in the spec was recomputed (`x + a = b` and `x − a = b`, both sides).

- **All 30 sample problems are right**, including every answer, and every slip example gives exactly the wrong answer the spec says (`x+3=−6` → −3, `x−5=−2` → −7, `x−5=−2` → 7, `7=x+3` → 10, and so on). The L1 mix (3 Party, 2 Battle), the L2/L3 minimums, the L5 forms and negative-answer counts all hold.
- **One thing doesn't:** §2 says L4 has **3 x-on-the-right and 2 x-on-the-left**, but the L4 sample bank is all five on the right (and the level table says the L3 forms are "mixed in"). Which is meant? **Decide** (I'd build the written rule, 3 right + 2 left, and regenerate the sample bank).

## 2. Places the spec contradicts or overlaps itself

1. **When is a move "committed", and what does the light see?** §3A/3D say Go enables when the two adds balance, and §3D lists *cancel the pairs* as the step after. §3F says lights are judged "after a committed move" and count terms "after pairs cancel and like numbers combine". If lights are judged at Go, the pairs are not cancelled yet, so every correct move would be red (terms went up). **Proposal:** Go commits the two adds; the new pairs pulse; the student cancels them; **once no pair is left to cancel, like numbers combine automatically** (a short animation) **and the lights judge**. If a move creates no pair (the red example, `x+3=−6` plus +3), the lights judge at Go. **Decide.**
2. **Combining like numbers** (`−6 + −3` → `−9`) is not in any menu. With the proposal above it is automatic (in counters it is just a bigger pile). Fine to leave automatic?
3. **Slip rows 1 and 2** of the typed-answer table are the same slip ("added the same number, not its opposite", `b + a` for `x + a = b`, `b − a` for `x − a = b`). Row 2's message ("which makes it −10") doesn't match its example (`x−5=−2` → −7). I'd merge them into one slip with a message per form.
4. **Slip rows 4 and 6** (`x+5=2` → 3; `x+4=−2` → 6) are both "the opposite of the right answer", i.e. right size, wrong team. I'd tag them once and say "Battle!" in the message only when the numbers have opposite signs (`x+5=2`).
5. **Row 1's message** says "You added +3 to the right". A typed answer has no moves behind it, so it can't know that. Reword to "The +3 needs its opposite to cancel".

## 3. What the spec doesn't say (and my proposed default)

- **Where "x alone" counts as done in counter mode.** The box alone on a side, any number of counters on the other. Default: yes.
- **Early answer, every time?** A correct early answer must be followed by the drag-check *and* a first good move (§4) before the problem completes. That is 5 problems × 6 levels of extra steps for a student who simply knows the answer. **Decide:** every problem, or only the first early answer in each level (then a quick drag-check)?
- **Tutorial replay.** "Every time the card is opened" needs no save bit. The tutorials for Trade places (L4) and Cross the border (L6) replay when that level is opened. Default: no extra bit; replay on each open of the card (3A), at L4 (3B) and at L6 (3C).
- **Stuck count needs no new data.** The log already records `stuck` and `taught` per problem with the scrambled id. A per-level total is a sum over the log. Only the *display* of streaks has to be switched off for this card.
- **The diagnostic** takes three problems, not two per card as the diagnostic does now. It needs a small generalization (a card can say which problems it samples and a function that turns the results into "open up to level n"). Straightforward.
- **Dragging the typed value onto x** (early-answer check) is a new component; so is the order-of-operations click-through. Both need tap alternatives (already required).

## 4. Save codes and the old Solve it cards (the part with real consequences)

Old Solve it has three cards in the save code (One-step 8 bits, Two-step 8, Switch sides 6 = 22 bits). The new Solve it replaces them one card at a time, so the plain approach of adding a bit-slot per new card makes every student's code longer each release (13 data symbols now, 14 with this card, and growing).

**Proposal:** save code **v13** keeps Count it and Build it exactly as they are (41 bits) and holds only the **new Solve it cards** after them (6 bits for this one). Old Solve it bits are **read** from older codes (v10 to v12) and **mapped** onto the new cards, but never written again. A student's code gets *shorter* (10 data symbols with this card), and each new card adds a few bits. The same mapping runs once on the progress already stored in a browser.

**Old levels to new levels** (a new level is done only if *all* its old counterparts are done, so nobody gets credit they didn't earn and nobody loses any):

| New level | Done when the old levels are done |
|---|---|
| L1 `x + a = b` | One-step L1 |
| L2 `x − a = b` | One-step L2 |
| L3 mixed | Switch sides L1 **and** L2 |
| L4 x on the right | Switch sides L4 |
| L5 all forms, bigger | Switch sides L3 **and** L4 |
| L6 Cross the border | not mapped (the move is new; it unlocks by finishing L5 and its tutorial) |

Your guess in §9 was close; I split L3 and L5 so each needs both of its old counterparts. Old One-step L3–L5 (multiply, divide, mixed) and Switch sides L5–L6 (two-step) carry over to the cards that replace them later; until then they stay playable. **Decide** (see §5, interim layout).

## 5. Interim Solve it while the new cards arrive

New order (decision log): add to both sides → multiply/divide → fraction equations → two-step → distribute, combine, solve → variables on both sides. Until each is built:

- Solve it shows **Add to both sides** (new), **One-step equations** (old, showing only the multiply/divide levels L3–L5 renumbered 1–3), **Two-step equations** (old, unchanged), and **Multi-step** (soon).
- **Switch sides leaves the screen** (its levels are folded into the new card by the table above; its two-step levels stay in the save data for the card that replaces two-step).
- The Solve it diagnostic keeps its current four problems and gains the new card's three when the card ships.

**Decide:** is that interim layout right, or do you want old One-step L1–L2 and Switch sides left visible until all the new cards exist?

## 6. Build order (each step ships and is tested)

1. **Generator and checks.** Problems by level with the form counts, ranges and no repeated answers; every problem verified by substitution; the slip tagger (typed answers) with the merged rows. *(Pure logic; I'll do this first.)*
2. **The moves engine.** State for a problem: the equation as terms, add-to-left, add-to-right, cancel a pair, auto-combine, Undo (both actions together), Trade places, Cross the border, the balance readout and tilt, the lights, the wrong-move ladder, "I'm stuck" rungs, Teach me's forced path, early answer. All pure, so tests cover it before any screen exists.
3. **The Mat for it.** The counter board (build from chips at L1–L2, pre-built at L3), the symbols board, the move menu, readout, lights and Undo; tap alternatives for every drag; 44 px targets; 390 px wide. *(The biggest piece.)*
4. **Tutorials** (add to both sides; Trade places; Cross the border) with their quizzes. They are the same engine with numbers and no x.
5. **Save code v13, migration of stored progress, diagnostic, log fields, retiring Switch sides from the screen.**
6. **Progress loss on updates** (spec §9.10, must be fixed before rollout). I haven't been able to reproduce this. **Need from you:** which browser and device, whether it happened right after a deploy or after closing the browser, and whether a Save code restored it. Meanwhile I'll audit every place progress is read and written for a way a deploy or a changed save layout could drop it.

Steps 1 and 2 touch no screen, so they can be merged early; the card appears for students when step 3 is done.

## 7. Decisions made while building (Karl, 2026-10-11)

- **Tutorials play once per student, then only by choice** (a replay button). They justify the new move's logic and matter, but they are not a barrier. This replaces "every time the card is opened" in the spec, and applies to every card's tutorial. Kept in the browser (`mat.tutorials.v1`), so a new device sees it once more.
- **Combining groups:** tap two groups, say Party or Battle, then type how many are left; "Cross off for me" is an extra scaffold that still asks for the count.
- **Building from counters is only at L1–L2.** The first look was changed after Karl's review: the board starts empty and the student drags the □, + and − up from a tray (tap a piece, then tap a side, as the alternative).
- **Screen layout:** Balanced/Unbalanced word and a seesaw on the dashed border at the top; the board (box and counters) above the equation; the moves in a "Balancing moves" panel beside it (under it on phones); Fewer terms / x alone / x on the left as checkboxes; only help and the pad at the bottom.
- **The models stand on the balance** (Karl, 2026-10-12): the beam at the top tips, and the box and counters stand on it, so what is added shows on that side. The equation sits under it; Undo (red) and Go/Continue (green) sit under the equation. The side panel pairs each move with its goal checkboxes. The add buttons ("Add −3 here") appear under each side only once a number is in the blank.
- **Tutorial:** not skippable the first time (Karl found it quick), a replay by choice can be left at any point. It suggests +3 then −2 so both a positive and a negative are tried before the quiz. The quiz puts its question, in bold, right above its two answers.

## 8. Revision 2 ("light build") (Karl, 2026-10-12): what was built, and the defaults I took

The spec is `SPEC-ADD-TO-BOTH-SIDES.md` (revision 1 is `…-REV1.md`; `…-AS-BUILT.md` describes the earlier build and is superseded).

**Built:** the numeric level L1 (two "do" items, three quiz items, seeded, no accidental balance, quiz answers in a shuffled order); L2–L6 are the old equation levels 1–5 shifted (the Cross the border level is gone); the bare screen (the line above the equation, the equation with Undo and Go under it, the Move / Why? panel with all eight moves and only Add active, Solved for x last, the `x = [ ]` answer row); one-action Go with automatic simplifying on x's side only and the other side left as separate terms; Fewer terms counts terms as if each side were combined; Guess x / Use a move buttons; a right guess gets the three-tap click-through (Add, Go with the amount filled in, then a button showing the value matching the other side); a wrong guess names the slip and offers Put it back in; three reds offer Start over and say "try I'm stuck"; the scaffold (seesaw, counters, tray, the two-action move, the combining ritual, and building from an empty board at L2–L3 when no move has been made) comes in only from I'm stuck or Teach me and stays for the rest of the problem. Removed: the steps bar, the "?" button, Replay, the tutorials (L1 replaces them), Trade places and Cross the border (greyed in the list), and the faded panel while simplifying.

**Defaults I took on the spec's open questions (§9), so nothing waits on them:**
1. The unfinished sentence: after Undo the line says "Add the opposite of +3 to both sides."
2. The move list is as proposed (Add, Take a fraction, Multiply, Flip everything, Distribute, Combine like terms, Trade places, Cross the border).
3. Greyed moves show **no** Why? boxes.
4. **Solved for x** turns green when x is alone (before the value is typed).
5. The Guess x / Use a move buttons are on the line at the start.
6. The click-through taps are the student's own actions on highlighted buttons.
7. Put it back in is offered, never automatic.
8. Red stays for a move that makes things worse (terms up or the number next to x bigger).
9. L1 opens first and levels open in order as on every card (so it gates L2); replaying a level is the normal level replay.
10. Old-level mapping, diagnostic thresholds and the class-sheet fields are still the next build (save code v13).

**Typing:** the pad types into the blank while the move is open and into `x = [ ]` otherwise; tapping the answer field sends typing to it.
