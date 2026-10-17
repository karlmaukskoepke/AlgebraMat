# SPEC: Build A, parity tests (P0) and Add's help reads the current equation (P1)  (rev 1.0, 2026-10-17)

**For:** Claude Code. **Model:** Claude Opus 5.5 (P0 needs care; P1 is small). **Session:** fresh. **Branch:** new, from `main`: `build-a/add-help-current-equation`. **Parallel work:** Build B (lights round 2) runs on a different branch; do not touch `addBothLights.js` or any `?ui=lights` code in this build.
**Read first:** `docs/scaffolds/SCAFFOLD-INVENTORY.md` (items A-GUIDE #6, A-TEACH #9, A-ALONE #2, A-COMB #7, A-MOVEFB #15, §3A, §3B), `docs/architecture/SOLVE-IT-ONE-SYSTEM.md` (phases P0, P1), `SPEC-SOLVE-IT-LOOP.md` rev 1.2 (§2, §6), the Add spec.
**Why:** (P0) every later phase moves code around, and nothing today proves students' experience didn't change; (P1) today's Add help gives wrong or answer-revealing help at the moments students need it most. Karl will test P1 with real students, so it must be small and safe.
**Do not touch:** Count it, Build it, save-code logic (`progress.js`), the class-sheet event words (`hint`, `model`, `move`, `guided`, `crossoff`, `forced`) and tags, the level tables, the problem generators, the lights experiment.

---
## Part 1 (P0). Parity tests: prove nothing changed

Build a small **parity harness** under `tests/parity/` (plain node scripts or the existing test runner; whatever the repo uses) that records a **baseline from the current `main` commit** and can be re-run after any later change. It must be runnable with one command and print PASS / FAIL per check.

1. **Problems:** for Add and Divide, every level (L1–L6), seeds 1–30: the generated problems (equation, answer, level), written to a JSON baseline.
2. **Save codes:** encode and decode round-trips for a set of progress states (empty, each level done, everything done) on the current save-code version (v14); the baseline strings must be identical after any change.
3. **Class-sheet events:** drive each card's engine with scripted action sequences (a clean solve; a red move then Undo; a wrong guess then Undo; I'm stuck ×4 then a solve; Teach me; a forced-move problem) and record the **event payloads** sent at problem end (the fields at `eventlog.js:17-19`: `supports`, `stuck`, `taught`, tags, wrongs). Baseline = today's output.
4. **Engine traces:** the same scripted sequences, recording the state after every action (board rows, lights, message ids). Baseline = today's output. **P1 will deliberately change a few of these**: when it does, the harness must let me list each intended change in `tests/parity/INTENDED-CHANGES.md` (state, before, after, reason), and every difference **not** on that list is a failure.
5. **Screens:** screenshots at 1366×768 and 1366×650 of the key states of Add and Divide (opening, after a helpful move, a red move, I'm stuck rung 1–4 on Add and rung 1–2 on Divide, Teach me, wrong guess, forced move, end of problem), flag off, fixed seeds; compare by pixel diff with a small tolerance. Baseline = today's.
6. A `README` in `tests/parity/` in plain language: how to run it, how to re-baseline (only on purpose), what each check protects.

Report P0 separately before starting P1: how many checks, how long it takes to run, anything flaky.

---
## Part 2 (P1). Add's help reads the equation on screen

All changes are **in Add's own engine and messages** (`addBothMoves.js`, `addBothFeedback.js`, the Add screen) plus the one shared rung noted in 2.6. List each one in `INTENDED-CHANGES.md`.

**2.1 Guided rung (A-GUIDE) reads the current board.** Today it pre-fills `oppositeOf(s.problem)` (`addBothMoves.js:215, 224-227`). It must use **the number now next to x** on the newest row: the opposite of the *current* c. After a partial move (`x + 3 = 5 + −5`... or whatever remains) it must offer the opposite of **that** number, and the message `aStuck3` must name that number.

**2.2 Teach me (A-TEACH) reads the current board.** Today `addBothMoves.js:518-523` forces the original opposite and refuses any other amount, including the one that would work (`add-18`: at `x = −4 + −8` it tells the student to add −8 again). It must use the current c, accept exactly the amount that cancels it, and **never be offered at all as "add again" when x is already alone** (see 2.3).

**2.3 When x is alone, nothing tells the student to add.** At `x = b + k` (inventory S2): rung 0 stays as today ("x is alone, work out the right side": it is already right). Rungs 1+ and **Teach me** at this shape must not draw the seesaw with nothing to do and must not say "add" anything. For this build, use only what exists, text and outline:
- the **two numbers on the right side are outlined** (the same outline style as the number next to x in rung 0);
- the line asks for the sum in plain words: "What is −3 + 5? Is it a party (same signs) or a battle (opposite signs)?" with the **numbers read from the current row**;
- no counters, no seesaw, no pre-filled value. Every ask at this shape gives this same help (it gets slightly more explicit each time: ask 1 the outline and the question; ask 2 adds "In a battle the bigger team wins"/"In a party the teams join" matching the sign pattern; ask 3 adds "Count the counters on each side" as text). **None of them ever writes the value.**
- The real count-and-cancel picture is **P5** (embedding Combine it). **Do not wire up** the unreachable A-COUNT code (`addBothMoves.js:455-461, 631-644`) and **do not delete it** either.

**2.4 The app never writes the answer (A-COMB).** Today picking Party/Battle correctly **combines the pair for the student**, and at x alone this prints `x = −12` (`add-17b`), which breaks loop §2 ("the solved value is never displayed"). Change: **a correct Party/Battle pick confirms and highlights, and does nothing to the equation.** ("Yes, a battle: the bigger team wins.") A wrong pick gets the existing nudge. The student must **type** the value in the `x =` row. In the scaffold (seesaw) after Go, when a side has two numbers *and x is not yet alone* (the pair is the x-cancelling pair, `x + 3 + −3`), the existing automatic cancelling of the zero pair stays as it is: it never shows an answer.

**2.5 Move feedback names the number now there (A-MOVEFB).** `aPartial` ("The +8 is still there", `add-09`) must name **the number that actually remains next to x** (`resolve`, `addBothMoves.js:143-161`; `addBothFeedback.js`).

**2.6 "Undo first" (applies to Add and to the shared loop).** If the student asks for I'm stuck or Teach me **while a red, grey or zero move is waiting for Undo** (Add: `s.undoCue` / `s.zeroOther`; Divide on the loop: `s.needUndo` / `s.fail`), the **first rung** is: one sentence saying what happened ("That move made the equation bigger. Let's undo it first.") with **Undo highlighted**, and **no other help opens**. After Undo, the ladder starts at rung 0 for the state Undo returns to. Implement it **once in the shared loop** (`solveLoop.js`, the ladder machinery) and call it from Add. Counting: it counts as one I'm stuck click (loop §6 says every click counts) and records the existing support word `hint`; add nothing new to the class sheet.

**2.7 The six unjudged Why? lights (classic Add panel).** Remove the fallback that copies Fewer terms' green into the six lights Add doesn't judge (`lightScreen.js:288`, `o.whys?.[key] ?? (fewer === 'green' ? 'green' : 'off')`). On Add only **Fewer terms** and **Solved for x** show state; the others stay in the dashed "off" state. Divide's lights are unchanged. Do not rename "Why?" in this build (the rename belongs to Build B, flag-scoped).

---
## Acceptance
1. **P0 report first** (as above). Then P1.
2. **All parity checks pass except the items listed in `INTENDED-CHANGES.md`**; every listed change matches 2.1–2.7 and nothing else.
3. **Screenshots of the real build (1366×768), seed 7, Add L2 and L4**, named `ba-NN-...` in `docs/build-a/`, with a short `BUILD-A-REPORT.md`:
   1. A partial move, then I'm stuck ×4: rung 3 names and offers the **current** number (compare to `add-10`).
   2. The same state, Teach me: accepts the amount that works (compare to `add-18`).
   3. A correct move reaching `x = b + k`, then I'm stuck ×3: outline and the plain-words question; **no value anywhere**; Teach me at the same state.
   4. Party/Battle pick (right and wrong): confirms, does not combine; `x =` still empty.
   5. `aPartial` after a partial move, naming the remaining number.
   6. A red move, then I'm stuck: the "Undo first" line with Undo highlighted; then Undo; then I'm stuck again (rung 0 on the restored state). Same on Divide (a fraction that doesn't split).
   7. The Add panel with only Fewer terms and Solved for x live.
4. Report: anything you could not do and why; every file changed; whether the "Undo first" rung needed changes to the Divide screen; anything that surprised you.

## Out of scope (later phases)
The shape classifier and lights from shape (P2); the shared ladder and registry (P3); moving Add onto the loop (P4); count-and-cancel via Combine it (P5, which replaces 2.3's text-only help); reminder-first on every card (P5); the pieces library and colours (P6); the drag layer (P7); the Why? to Goals rename (Build B).

## Decisions recorded from Karl (2026-10-17)
- Which layout becomes the single Solve it screen (classic, tucked drawer, or the lights layout): **decided after the classroom tests**.
- Count it's pictures inside Solve it help: they need not match exactly, but the **feel must not be considerably different**.
- **Opposite box:** a box with a minus (−□) is correct, as Build it draws it. (Flip it spec now rev 1.1.)
- Help used in Solve it does **not** switch on Count it's supports; a shared record is a later decision.
- Magenta/green meanings: decided in the colour pass.
