# Scaffolds and equation states: inventory (read-only)  (2026-10-17)

**What this is.** What exists today for I'm stuck, Teach me, hints and forced-move help on **Add to both sides** and **Divide it**, and every equation shape a student can be looking at on those two cards. It is the groundwork for keying help to the **state of the equation** instead of to the card. **No app code was changed and nothing was prototyped.** The only new files are in `docs/scaffolds/`.

**Read against:** `docs/design/SPEC-SOLVE-IT-LOOP.md` rev 1.2, `SPEC-ADD-TO-BOTH-SIDES.md` rev 2.3, `SPEC-DIVIDE-IT.md` rev 2.2, `SPEC-FLIP-IT.md` rev 1.0, `SPEC-ADD-TO-BOTH-SIDES-BUILD-NOTES.md` §15, and `docs/lights-and-moves/LIGHTS-EXPERIMENT-REPORT.md`. Code at `main` = `0415e23` (the lights experiment is merged, behind `?ui=lights`).

**How to read the evidence.** *Observed* means I saw it in a file and line, in a screenshot (`shots/…`, 1366×768, real build, seed 7), or by running the engine in a script. *Inferred* is marked, with the reason.

---

## Summary

- **31 help items** across the two cards: 16 on Add, 2 more that only exist under `?ui=lights`, and 13 on Divide (one of them is the tucked layout's version of the same counters).
- **None of them is shared between the cards.** Every rung, picture and Teach me path is written separately for each card. The shared loop (`solveLoop.js`) has the ladder machinery, but only Divide uses it; Add has its own copy. What the cards *do* share is a handful of message strings, plus two drawings the scaffolds borrow from Level 1 (the seesaw, the group diagram).
- **9 core equation shapes** (7 on Add, 2 on Divide). That becomes 20 if you count x-on-the-right twins and the scaffold-only half-moves. **Divide is a small tree** (at most 3 deep). **Add is a tangle:** it doesn't require Undo after a red or grey move, so moves can stack (`x = −6 + 3 + −6`, observed).

**The three biggest problems**
1. **Add's help is keyed to the original problem, not to the equation on screen.** The guided rung and Teach me use `oppositeOf(s.problem)` (`addBothMoves.js:215, 225-226, 518-523`). After any move that doesn't finish the job, the guided rung says "−8 cancels the +3" (`add-10`). Teach me also refuses the amount that would work (seen in the engine script). At `x = −4 + −8`, Teach me tells the student to add −8 to both sides again (`add-18`). Divide doesn't have this bug, because it reads the current board.
2. **The help students need most doesn't exist.** Every Add problem ends at `x = b + k` (add two signed integers). There the ladder gives text, then text again over the seesaw with nothing to do, then a Party/Battle question that **does the combining for the student and shows `x = −12` before they type it** (`add-15`, `add-16`, `add-17`, `add-17b`). That breaks two loop rules: "the solved value is never displayed" (§2) and "every rung gives something to do" (§6). The "count what's left" step and "Cross off for me" are still in the code, but nothing can reach them (`addBothMoves.js:455-461, 631-644`).
3. **There are two ladders with different rules.** Add has 4 rungs (reminder, model, two-action, guided). They don't restart at a new state, and the scaffold stays up until the problem ends. Divide has 2 rungs on the loop: they restart at each state, and the picture lasts until the state ends. On top of that, Add can stack moves without Undo, which multiplies the states a state-keyed help system would have to cover.

**Questions for you** are in Part 4 (five, multiple choice). Answers: *pending*.

---

## Part 1. Inventory

**Shapes notation.** `c` = the number next to x as it now stands (signed), `b` = the other side, `k` = an amount added, `a` = the coefficient, `v` = a single number. The Add screen writes `x − 6` as **`x + −6`** (observed: `lightScreen.js:93-114` joins terms with + and a signed number).

### 1A. Add to both sides (engine `src/engine/addBothMoves.js`, messages `src/view/addBothFeedback.js`, screen `src/view/lightScreen.js`, picture `src/view/addBothMat.js`)

| # | Id / name | Trigger | Shape it assumes | Levels | Where (file:lines) | Shows | Shot |
|---|---|---|---|---|---|---|---|
| 1 | **A-REM** Reminder (rung 0) | 1st I'm stuck on the bare screen | `x + c = …`. **Reads the current c** (observed: `−2` after a partial move) | L2-L6 | `addBothMoves.js:195-205`; text `aStuckHint` `addBothFeedback.js:95`; outline `lightScreen.js:105-111` | The number next to x outlined, the Add blank open, and the question "What would we add to both sides to eliminate it?" | `add-02` |
| 2 | **A-ALONE** "x is alone, work it out" | I'm stuck when x is alone (1st ask; also the 2nd ask, over the seesaw) | `x = b + k` | L2-L6 | `addBothMoves.js:199, 220`; `aStuckSolved` `:99` | **Text only** on the 1st ask. On the 2nd, the same text with the seesaw drawn and nothing to do | `add-15`, `add-16` |
| 3 | **A-SEE** Model it: the seesaw | 2nd I'm stuck (rung 1); also the first step of Teach me | Any. It redraws the current board, the unsimplified side included (observed `add-10`: `−4 + −5` as two groups) | L2-L6 (pre-built at L4-L6, or at L2-L3 once a move has been made) | `enterScaffold` `:173-188`, rung `:222`; `drawBalance` `addBothMat.js:115`, `boardBlock` `:92`; screen `lightScreen.js:325-331` | Balanced ✓ word, the seesaw with the x box and counter groups, the number next to x highlighted. **It replaces the work stack** (loop §6 calls this a bug) | `add-03` |
| 4 | **A-BUILD** Build the equation | Rung 1 at L2-L3 when no move has been made yet | `x + c = b` (the original, from `s.problem`) | L2-L3 | `:180-185`, `:291-327`, `:557-580`; tray `addBothMat.js:289` | An empty seesaw; the student drags □, + and − up (or taps a piece, then a side) | `add-08`, `add-24` |
| 5 | **A-TWO** Choose the move: two actions | 3rd I'm stuck (rung 2) | Any | L2-L6 | rung `:223`; `addTo` `:365-390`; `go` `:394-404`; side buttons `addBothMat.js:267` | "Add ___ here" under each side. The beam tips after one side ("heavier by 8"), levels after both, then Go | `add-04`, `add-06` |
| 6 | **A-GUIDE** Guided amount | 4th I'm stuck (rung 3) | **The original `x + c = b`** (`oppositeOf(s.problem)`) | L2-L6 | `:224-227`; `aStuck3` `:98` | The opposite pre-filled in the seesaw's side buttons. **Wrong after a partial or red move** (observed `add-10`: "−8 cancels the +3") | `add-05`, `add-10` |
| 7 | **A-COMB** Combining ritual (Party / Battle) | After Go in the scaffold, whenever a side has two numbers; also the 3rd ask at x alone | `… + p + q` on one side | L2-L6 | `select` `:427-438`, `kind` `:440-454`, `startPair` `:591-600`, x alone `:219`; buttons `lightScreen.js:303-309` | The two groups highlighted, then "Party or Battle?". A right pick **combines them for the student** (no count to type). At x alone this **shows `x = −12`** (`add-17b`) | `add-17`, `add-17b` |
| 8 | **A-COUNT** Count what's left / Cross off for me | **Unreachable.** Nothing sets `combining.step = 'count'` (grep: only reads of it, `:252, 456, 652, 665`) | `p + q` | none | `crossOff` `:455-461`, `checkCount` `:631-644`; messages `aHowMany`, `aCrossedOff`, `aCountWrong` `:73-79` | Nothing today. This is the student-does-it half of combining (spec §4 rung 2) | none |
| 9 | **A-TEACH** Teach me | Teach me button | **The original `x + c = b`** (`:518-523`) | L2-L6 | `:509-525`; refusal `aForced` `:373, 410`; text `aTeach` `:100` | The seesaw with the opposite pre-filled; only that amount is accepted. **At x alone it still says "Add −8 to the left…"** (`add-18`) | `add-07`, `add-18` |
| 10 | **A-ZERO** Zeroed the other side | A move that makes the side without x 0 | `x + c′ = 0` | L2-L6 | flag `:414`, line `:150-153`, after Undo `:491-495` | "The right side is 0, but x isn't any more alone." After Undo: the number next to x outlined, "What do we add to both sides to eliminate this?" | `add-12`, `add-13` |
| 11 | **A-WG** After a wrong guess | Undo after a red substitution | `x + c = b` (the original; Add only allows guesses there) | L2-L6 | `:470-477`; `aSimplerFirst` `:105` | "Let's make the equation simpler first…", with the Add icon highlighted (`lightScreen.js:315`) | `add-19`, `add-20` |
| 12 | **A-MUST** Forced-move problem | The problem after a correct first guess | any original | L2-L6 | `newAddBoth` `:113`; `aMustMove` `:47` | "Let's try solving this one using a move." No choice buttons | `add-21` |
| 13 | **A-TRADE** Trade places, first time | L5+, x on the right, the first time in a level | `b = x + c` | L5-L6 | `TRADE_LEVEL` `:118-122`, `choose` `:344-357`; panel `lightScreen.js:275-277, 314` | "x is on the right. Click Trade places…", Trade highlighted, Add waits until it's clicked | `add-22` |
| 14 | **A-RED3** Three reds | The third red or zero move in a row | any | L2-L6 | `:148-156`; `aRed3` `:89` | "…or try I'm stuck." and Start over turns on (the spec version is older than loop rev 1.2) | none |
| 15 | **A-MOVEFB** Move feedback | Every judged move | `x + c′ = b + k` | L2-L6 | `resolve` `:143-161`; `aRed`, `aPartial`, `aGreen` `:85-90` | Red / grey line, Undo pulsing. **`aPartial` names the original c** ("The +8 is still there", `add-09`, where the number is now +3) | `add-09`, `add-11` |
| 16 | **A-SLIP** Typed-value slips | A wrong value typed when x is alone | the original (`problemParams(s.problem)` `:129`) | L2-L6 | tags `addBoth.js:47-61`; messages `addBothFeedback.js:13-24` | The substitution, then a slip line. Correct to use the original here (loop §1B) | none |
| 17 | **A-LX-REM** Reminder in the ghost row (`?ui=lights`) | 1st I'm stuck under the flag | as #1 | L2-L3 | `addBothLights.js:178-181`; `lightsFeedbackText` `addBothLightsFeedback.js:13` | The blank in the equation row `x + 8 + [▁] = 11 + [ ]`, focused | `add-23` |
| 18 | **A-LX-OWED** Owed move (`?ui=lights`) | A correct guess on the original | `x + c = b` | L2-L3 | `addBothLights.js:170-176`, `moveOwed` `:41` | "Nice. Now show it with a move." The field greys and Add pulses (same problem, not the next one) | `lx-09` (lights report) |

Under the flag, rungs 2-4 and Teach me are the classic ones (#3-#9) unchanged: the wrapper calls the same engine (`addBothLights.js:128`). `add-24` shows the build seesaw under the flag.

### 1B. Divide it (card config `src/engine/divideMoves.js` on the shared loop `src/engine/solveLoop.js`; messages `src/view/divideFeedback.js`; screen `src/view/divideScreen.js`; picture `src/view/groupDiagram.js`)

| # | Id / name | Trigger | Shape it assumes | Levels | Where (file:lines) | Shows | Shot |
|---|---|---|---|---|---|---|---|
| 19 | **D-MODEL** Model it and deal it (rung 1) | 1st I'm stuck, x not alone | `ax = b`, **read from the board** (correct after a partial move: "2 boxes and 4 counters", `div-13`) | L2-L6 | rung `divideMoves.js:173-184`; `dModel` `divideFeedback.js:29`; drawing `divideScreen.js:34-73`, `groupDiagram.js:51` | The a boxes and the pile of \|b\| counters, the coefficient outlined, the fractions live, "What fraction of both sides leaves one box?" | `div-02`, `div-13` |
| 20 | **D-DEAL** Dealing and keeping | Taking a fraction while the scaffold is up | `ax = b` | L2-L6 (Deal a round from L4, `DEAL_ROUND_LEVEL` `:38`) | `take` `:127-128`, `deal` `:132-141`, `dealRound` `:142-149`, `keep` `:150-164` | n empty groups; tap to deal one counter at a time; "7 of 15 shared · groups hold 2, 2, 1, 1, 1"; keeping a group takes the fraction | `div-03`, `div-04` |
| 21 | **D-PIC** The picture stays until Next | Keeping a group (the move is applied) | the new state | L2-L6 | `commitFraction` `:223-234`; `diagramBlock` `divideScreen.js:58-62` | The kept group marked, "You kept 1 of the 3 groups.", until Next folds the move | `div-14` |
| 22 | **D-GUIDE** Guided (rung 2) | 2nd and later I'm stuck | `ax = b` (current a) | L2-L6 | `:185-200`; fraction highlight `divideScreen.js:23` | The matching fraction button highlighted; the student still deals and keeps | `div-05` |
| 23 | **D-DIAG1** x alone: the pile (rung 1) | 1st I'm stuck at `x = ⅟a(b)` | `x = ⅟a(b)` | L2-L6 | `diagOf` `:44-47`, rung `:175-178`; `dDiag1` `divideFeedback.js:41` | The work stack stays; one pile of \|b\| counters next to an a-part bar; "What is ⅕ of −15? Share the counters into 5 equal groups" | `div-09` |
| 24 | **D-DIAG2** x alone: guided groups (rung 2) | 2nd I'm stuck there | `x = ⅟a(b)` | L2-L6 | `:187-194`; `dDiag3` `:43` | The counters already in a equal groups, one kept; count it and type. No numeral printed | `div-10` |
| 25 | **D-TEACH** Teach me | Teach me button | `ax = b` (current a) **or** `x = ⅟a(b)` | L2-L6 | `teach` `:202-213`; `dForced` `:116`; fractions locked `divideScreen.js:20-25` | Only ⅟a accepted, the student deals and keeps. At x alone: deal the pile, keep one | `div-06`, `div-16` |
| 26 | **D-FAIL** Failed fraction | A fraction that doesn't split | `ax = b` | L2-L6 | `:120-126`; `dFail` `divideFeedback.js:22-26` | A red ✗ work row; the line names the side that broke; Undo pulsing. **No picture** (the tray says "counters appear here when you ask for help") | `div-07` |
| 27 | **D-WG** After a wrong guess (shared loop) | Undo after a red substitution | the current state | L2-L6 | `solveLoop.js:233-238` (`card.nextNeeded` is not supplied by Divide); icon target `divideScreen.js:90` | "Let's make the equation simpler first…", with the move icon highlighted | `div-11` |
| 28 | **D-MUST** Forced-move problem (shared loop) | A correct guess at the first state | any | L2-L6 | `solveLoop.js:50`, `owesMove` `:285` | "Let's try solving this one using a move." | none |
| 29 | **D-RED3** Three failed tries | The third failed fraction in a row | `ax = b` | L2-L6 | `:125`; `dFail3` `divideFeedback.js:27` | "…Try I'm stuck." | none |
| 30 | **D-SLIP** Typed-value slips | A wrong value when x is alone | the original | L2-L6 | tags `divide.js:49-60`; `slip` `divideMoves.js:87-91`; messages `divideFeedback.js:6-15` | The substitution, then the slip line | none |
| 31 | **D-TUCK** The counters tray (`?layout=tucked`) | As #19-#25 | as #19-#25 | L2-L6 | `tuckedLayout.js:30-159`; `divideScreen.js:105-160` | The same diagram in a slide-up tray | `div-15` |

Levels 1 (numeric) on both cards have no I'm stuck and no Teach me, as both specs require (observed: the numeric screens have no help row).

### 1C. Duplicates: the same job done in two places

| Job | Add | Divide / shared loop |
|---|---|---|
| The help ladder (rung counter, which rung, what counts) | `climb` `addBothMoves.js:191-228` (4 rungs, never reset per state) | `solveLoop.js:260-269` + `rungs` `divideMoves.js:172-201` (2 rungs, reset in `commit` `solveLoop.js:99`) |
| Teach me | `addBothMoves.js:509-525` | `solveLoop.js:270-279` + `divideMoves.js:202-213` |
| After a wrong guess | `addBothMoves.js:470-477` | `solveLoop.js:233-238` |
| Three reds | `addBothMoves.js:148-156` | `divideMoves.js:122-125` |
| Teach me refusing a different amount | `aForced` `addBothMoves.js:373, 410` | `dForced` `divideMoves.js:116` |
| Help at x alone | text only, `addBothMoves.js:199, 220` | a picture, `divideMoves.js:175-178, 187-194` |
| Outlining a number in the equation | `lightScreen.js:102-111` (`cancel` and `coef`) | `solveScreen.js:47` (`coef`) |
| Drawing counters | `addBothMat.js:69` `counterMark` | `lassoMat.js` `counter` (borrowed by `groupDiagram.js:18`) |

The ladder, Teach me and the wrong-guess follow-up are the important three: each one is the same rule written twice, and the Add copy follows older rules.

---

## Part 2. The state space

### 2A. Every shape a student can be looking at

Normalised with signs kept. "R" = the same shape with x on the right (Add L5-L6, until or unless the student uses Trade places).

**Add to both sides: equation shapes (the work stack's newest row)**

| Id | Shape | How it's reached | Observed |
|---|---|---|---|
| **S1** | `x + c = b` | The original. Also any fully combined state that isn't solved (a scaffold partial move gives `x + c′ = b′`, the same shape with new numbers) | `add-01` |
| **S2** | `x = b + k` | One correct move. **Where nearly every problem ends.** Two kinds: **S2p** Party (b and k the same sign), **S2b** Battle. Edge case: `x = 0 + k` (after S4) | `add-14` |
| **S3** | `x + c′ = b + k` | A move that doesn't finish: grey (partly cancelled, or overshoots the sign: `x + 3` + −5 → `x + −2`) or red (c′ bigger). Under `?ui=lights` also `k = 0` | `add-09`, `add-11` |
| **S4** | `x + c′ = 0` | The side without x zeroed (`addBothMoves.js:239`) | `add-12` |
| **S5** | `x = b + k₁ + k₂ (+ …)` | Moves stacked without Undo, the last one finishing (observed: `x = −6 + 3 + −6`) | engine script |
| **S6** | `x + c′ = b + k₁ + k₂ (+ …)` | Moves stacked without Undo, not finished | engine script |
| **S7** | `x = v` | **Only through the scaffold's combining**, which means the answer was shown | `add-17b` |

**Add: scaffold-only rows (inside the seesaw)**

| Id | Shape | Reached by |
|---|---|---|
| **T0** | Partly built (`x`, then `x + 3`, then `x + 3 = −2`…) | A-BUILD, L2-L3 |
| **T1** | `x + c + k = b` (unbalanced) | The first half of A-TWO |
| **T2** | `x + c + k = b + k` (both sides, nothing combined) | The second half of A-TWO, before Go and the Party/Battle pairs |

**Add under `?ui=lights`:** **P1** `x + c + [▁] = b + [ ]` is the preview or typing row (the amount mirrored). Rows can be applied but not yet committed (`lx.awaitNext`), so Undo still reaches them. A correct guess leaves the *same* problem at S1 with the move owed.

**Divide it**

| Id | Shape | How | Observed |
|---|---|---|---|
| **D1** | `ax = b` (a = 2-6) | The original, or after a partial move (`4x = 8` → ½ → `2x = 4`; `6x` → `3x` or `2x`) | `div-01`, `div-12` |
| **D2** | `x = ⅟a(b)` | The finishing move (`divideMoves.js:30-32`). The right side is never evaluated by the app | `div-08` |
| **DF** | `⅟n(ax) = ⅟n(b)  ✗` over D1 | A fraction that doesn't split; the board is unchanged until Undo | `div-07` |

Picture states sit on top of D1 and D2 and are not new equations: the pile, n groups being dealt, the kept group (until Next), and at D2 the pile and then the guided groups.

**Check rows (both cards).** These are what the student sees after typing a value; they aren't equation states for help. Add: `g + c = b` → `v = b` → mark, always in the original (`addBothMoves.js:604-611`). Divide: `a × (g) = b` → `p = b` → mark, in the current equation for a wrong guess and the original otherwise (`solveLoop.js:196-198`).

### 2B. Transitions

```
ADD (bare screen; R twins on L5-L6 mirror every arrow; Undo goes back one arrow)

            add −c (the opposite)
   S1 ────────────────────────────────► S2  x = b + k ──type──► check
 x + c = b                                     ▲
   │  add k, not −c, other side ≠ 0            │ add −c′
   ├──────────────────────────────────► S3 ────┤
   │                                     │  ▲  │ add k₂ (not finishing)
   │  add −b (zeroes the side without x) │  └──┘──► S6 ──add−c″──► S5 ──type──► check
   └──────────────────────────────────► S4 ──add −c′──► S2 (x = 0 + k)
   S1R ──Trade places──► S1          (any of S3/S4/S6 → Undo → the state before)

ADD (scaffold, I'm stuck 2+ or Teach me)
   S1/S3/S4 ──one side──► T1 ──other side──► T2 ──Go──► Party/Battle pairs ──► S1-shape (x + c′ = b′) or S7
   S2/S5 ──3rd ask──► Party/Battle pairs ──► S7 (answer shown)

DIVIDE
   D1 ──⅟a──► D2 ──type──► check
   D1 ──⅟n, n divides a, n < a──► D1′ (smaller a) ──⅟a′──► D2
   D1 ──⅟n, n doesn't divide a──► DF ──Undo / new try──► D1
```

### 2C. How many, and what kind

- **Core shapes: 9** (Add S1-S7, Divide D1-D2). **With everything: 20** (Add S1-S7 plus 7 R twins, T0-T2, P1; Divide D1, D2, DF).
- **Divide is a small tree.** Every path is 1-3 moves long, a failed try always returns to the same D1, and every node is read straight off the board (`coef`, `right[0].kind`).
- **Add is a tangle, but it doesn't have to be.** The finishing path is one move (S1 → S2). The tangle comes from Add's engine not requiring Undo after a red, grey or zero move: `choose` and `go` don't check `undoCue` (`addBothMoves.js:338-362, 393-424`). So S3 → S6 → S5 chains are open-ended (they're only bounded by |amount| ≤ 15), and several paths reach the same shape. Under the loop's rule (`needUndo` blocks moves, `solveLoop.js:111-117`), Add collapses to a star: S1 → S2, plus three dead ends (S3, S4, wrong guess) that only lead back through Undo. S5 and S6 disappear.

---

## Part 3. Fit (proposals; nothing built)

### 3A. Shape → which rungs apply

✓ exists and is right · ✗ exists but wrong for this shape · **MISSING**

| Shape | Rung 0: reminder | Rung 1: model it | Rung 2: do it | Rung 3: guided | Teach me |
|---|---|---|---|---|---|
| **S1** `x + c = b` | ✓ A-REM | ✓ A-SEE / A-BUILD | ✓ A-TWO | ✓ A-GUIDE | ✓ A-TEACH |
| **S2p** `x = b + k`, Party | ✗ A-ALONE (text only) | ✗ seesaw with nothing to do | ✗ A-COMB combines it for them and shows the value | **MISSING**: the groups join, the student counts and types | ✗ A-TEACH tells them to add −c again |
| **S2b** `x = b + k`, Battle | ✗ as S2p | ✗ as S2p | ✗ as S2p | **MISSING**: tap pairs to cancel (or "Cross off for me"), count what's left, pick its team, type x. *This is the `−3 + 5` help.* | **MISSING** (same) |
| **S3** `x + c′ = b + k` (waits for Undo) | **MISSING**: "Undo first" (one sentence on what happened, Undo highlighted); then the S1 ladder on the state Undo returns to | ✓ (redraws k) | ✓ | ✗ uses the original c | ✗ forces −c and refuses −c′ |
| **S4** `x + c′ = 0` | ✓ A-ZERO after Undo; **MISSING** the same "Undo first" before it | ✓ | ✓ | ✗ | ✗ |
| **S5 / S6** stacked | gone if Undo is required (Q1) | | | | |
| **S7** `x = v` | nothing needed ("type it") | | | | |
| **T1 / T2** | inside A-TWO: ✓ the tilt messages | | | | |
| **D1** `ax = b` | **MISSING** if the reminder rule applies to Divide (Q4) | ✓ D-MODEL | ✓ D-DEAL | ✓ D-GUIDE | ✓ D-TEACH |
| **D1′** after a partial move | (as D1) | ✓ (reads the board) | ✓ | ✓ | ✓ |
| **DF** failed fraction | **MISSING**: "Undo first" | **MISSING**: the picture of why it didn't split (Divide §6 asks the picture to name the side that broke; today it's text only) | | | |
| **D2** `x = ⅟a(b)` | | ✓ D-DIAG1 | ✓ (deal and keep) | ✓ D-DIAG2 | ✓ D-TEACH |
| **R twins** | as their S shape, with the highlight on the right side | | | | |

### 3B. Classifying the shape on every state, from data the app already holds

**Inferred, from the board formats.** Both boards are already plain data: Add is `{left, right}` lists of `{kind: 'x'}` and `{kind: 'num', v}` (`addBothMoves.js:20-27`); Divide is `{left: [{kind: 'x', coef}], right: [{kind: 'num'} | {kind: 'frac', n, inner}]}` (`divideMoves.js:15-19`). One pure function in the engine could read either:

```
shapeOf(board) → { id, xSide, coef, xConst: [numbers next to x], other: [terms on the other side], params }

  coef ≠ 1                                   → D1  (params: a, b)
  x alone, other = one fraction              → D2  (params: n, inner)
  x alone, other = one number                → S7
  x alone, other = two numbers               → S2  (Party if same sign, else Battle; params: b, k)
  x alone, other = three or more             → S5
  not alone, other = [0]                     → S4
  not alone, other = one number              → S1  (params: c, b)
  not alone, other = two numbers             → S3
  not alone, other = three or more           → S6
  (x on the right → the R twin)
```

- **It has to be order-free and sign-normalised** (`x + −2` and `x − 2` are the same shape). The lights experiment's next round makes that necessary, not just tidy (3E).
- **The ladder then becomes `rungsFor(shape)`, not `rungsFor(card)`.** Each rung reads its numbers from `params`, never from `s.problem`. That one rule removes problem 1.
- **Waiting for Undo is not in the board.** S3, S4 and DF are told apart by the state's flags (`s.undoCue` / `s.zeroOther` on Add, `s.needUndo` / `s.fail` on Divide). So the classifier takes `(state)`, or `(board, flags)`, not just the board.

**Could the same function compute the Goals lights (loop §8)? Mostly yes.**
- **Solved for x** = "x alone" and **One box** = `coef === 1`: these read one shape.
- **Fewer terms** and **Smaller numbers** compare the shape before with the shape after. Add already does this for Fewer terms (`judge(before, after)` `addBothMoves.js:84-88`, which counts x's side only). Divide doesn't: it hard-codes Smaller numbers green on any successful fraction (`divideMoves.js:227`).
- So: `lightsOf(shapeOf(prev), shapeOf(now))`, run on every state, including states the card didn't expect first. That's exactly what loop §8 asks for, and it also gives the counts the yellow "partly done" light needs (`VISION-FIT.md` report 2, on branch `claude/focused-gauss-2m69wo`).
- **One blocker to remove first:** Add's classic panel copies Fewer terms' green into six other lights it doesn't judge (`lightScreen.js:288`, `o.whys?.[key] ?? (fewer === 'green' ? 'green' : 'off')`; visible in `add-15`: No fractions, One box, No opposite box all green on an Add problem).

### 3C. When the mistake is known, and when it isn't

**Known today**
- Add, typed value: `wrong-op`, `untouched`, `sign-flipped`, `sizes-added` (`addBoth.js:47-61`).
- Add, move: same sign (red), partly cancelled (grey), zeroed the other side (`s.zeroOther`).
- Add, combining count: `sizes-added`, `sign-flipped` (`checkCount`, unreachable today).
- Divide, typed value: 7 tags (`divide.js:49-60`).
- Divide, move: boxes didn't split, counters didn't split (`takeFraction` `divide.js:31-36`).

**Proposal**
- **Help = f(shape, last known slip or none).** A known slip changes **only where rung 1 starts and what it points at**, never which picture is used and never whether help opens.
  - S2b with `sizes-added`: open the counters at the cancel-the-pairs step.
  - S2 with `sign-flipped`: open at "which team has more?".
  - S3 from a same-sign move: "Undo first", then outline c and show it as its opposite.
  - DF: draw the boxes that don't split.
- **Unknown mistake (`unmatched`, or none): the shape's default ladder.**
- Both follow the loop: nothing opens on its own (§6), and a wrong *guess* gets no slip message (§1B), except Flip it's one named misconception.
- **Blind spot:** a typed-value slip is tagged against the **original** problem (correct for the message), but the help has to act on the **current** shape. For example, `sizes-added` on `x − 5 = −2` is about `−2 + 5` at S2b. Turning tag + shape into a rung needs a small table per card. It's small, but it doesn't exist yet.

### 3D. Reuse, split or rewrite

| Reuse unchanged | Split | Rewrite |
|---|---|---|
| A-REM (already reads the current c) · A-SEE · A-BUILD · A-TWO · A-ZERO · A-WG · A-TRADE · A-MUST · D-MODEL · D-DEAL · D-PIC · D-GUIDE · D-DIAG1 · D-DIAG2 · D-TEACH · D-FAIL's message · the seesaw `drawBalance` · `groupDiagram` | **A-COMB**: separate the Party/Battle question from the auto-combine, and bring back A-COUNT (the code is there) so the student counts and types. This becomes the missing S2 rung. · **`climb`**: split "which shape am I in" from "what this rung does" (today one function decides both) · **A-MOVEFB**: use the current c in `aPartial` | **A-GUIDE** and **A-TEACH** (read the shape, not `s.problem`) · **A-ALONE** (replaced by the S2 ladder) · **the Add ladder onto the loop** (refactor plan R7, on branch `claude/friendly-faraday-xzolrt`), so rungs restart per state and Undo is required after red · **new**: an "Undo first" rung, the DF picture |

### 3E. Risks

- **Save codes: no risk** while level counts and meanings stay the same. A save code is one bit per level (`progress.js:142-275`, v14). The level in play is saved only as `{pack, level, seed, index}` (`main.js:116`), so no scaffold or state is saved.
- **The class sheet: a real risk.**
  - Each finished problem sends `supports` (the names `hint`, `model`, `move`, `guided`, `crossoff`, `forced`), plus `stuck` and `taught`, to the sheet (`eventlog.js:17-19` → `teacher/Code.gs:444`).
  - The names already mean different things on the two cards: `model` is the seesaw on Add (`addBothMoves.js:209`) and model-and-deal on Divide (`divideMoves.js:182`).
  - Re-keying rungs by shape changes what those words mean in the middle of the year. **Keep the old words and add a new field** (for example `shape: 'S2b'` per support) rather than renaming.
  - `stuck` per level must still count every click (loop §6).
  - The same record feeds `skills.js` `afterProblem` through `tags`. Don't rename tags.
- **Count it / Build it overlap.**
  - `groupDiagram.js` imports `el` and `counter` from Group It's `lassoMat.js` (`groupDiagram.js:18`). Changing the counter drawing for a new S2 picture would change Count it.
  - Add's build step copies Build it's "pick a piece, tap a side" behaviour in its own code (comment `addBothMoves.js:295`). That's a separate copy, so no shared risk (inferred from the imports).
  - All screens share one `style.css`.
- **The lights experiment.**
  - **What's built** (merged, `?ui=lights`, Add L2-L3): no Guess x / Use a move choice, so the guess-or-move fork goes away. A 0 is allowed (`x + c = b + 0` joins S3). A correct guess leaves the *same* problem owed (S1, move owed). Applied rows wait for Next, so Undo still reaches them (`lx.awaitNext`). Moves can still stack after a red move (`canChoose` doesn't check `undoCue`, `addBothLights.js:39`).
  - **Branch name:** there is **no `exp/lights-add` branch.** The experiment was built on `claude/new-session-yadpxi` and merged (`LIGHTS-EXPERIMENT-REPORT.md:7`).
  - **The drag-and-drop round isn't in the repo.** I couldn't find a spec or code for drag-and-drop manipulation of terms on any branch, so everything below is **inferred from your description in the prompt**:
    - Reordered rows (`c + x = b`, `b = c + x`) break any classifier that reads positions. Hence "order-free" above.
    - `x + −2` is already how Add displays things, so the display isn't new; mixing it with `x − 2` (if students can type or drag either) is.
    - **Unsimplified x's side becomes a resting state.** Today x's side always auto-cancels; if students cancel pairs by dragging, `x + 3 + −3 = b + −3` (today only the scaffold's T2) becomes a real state with its own help ("cancel the pair").
    - A term dragged across the = (Cross the border) adds `x = b − c` without the both-sides row.
    - Taken together this roughly doubles Add's shapes (inferred: each S shape gains an "x's side not yet cancelled" twin) and makes the "Undo first" question more pressing.

---

## Part 4. Questions (batch 1)

Recommended option first. Answers are recorded here when given.

**Q1. When a student asks for help in a state that's waiting for Undo (a red or grey move, the other side zeroed, a failed fraction), what should I'm stuck do?**
- **(A) Recommended:** its first rung is "Undo first": one sentence on what happened, with Undo highlighted. Then the normal ladder for the state Undo returns to. *Evidence:* today Add's guided rung says "−8 cancels the +3" there (`add-10`), and Teach me refuses the amount that works. Loop §1C has Undo return to the same state. It also removes S5 and S6.
- (B) Treat the red state as a new equation and help from there. *Evidence:* the algebra is valid (`x + 8 = 0` is solvable), but it teaches stacking moves.
- (C) Grey out I'm stuck until Undo is pressed.

*Answer: pending.*

**Q2. How long does a scaffold picture stay?**
- **(A) Recommended:** until the equation state ends; the next state starts bare. That's loop §6, and Divide already does it.
- (B) Until the problem ends: Add spec §4 and Add today. *Evidence:* at S2 the seesaw from the earlier state stays and redraws, but has nothing to do (`add-16`).
- (C) Each card decides.

*Answer: pending.*

**Q3. The missing help at `x = −3 + 5` (S2): what should the student do?**
- **(A) Recommended:** the two groups as counters. "Party or Battle?" first; then the student taps pairs to cancel (or "Cross off for me"), counts what's left and types x. The app never combines for them. *Evidence:* the count step and Cross off are already written but unreachable (`addBothMoves.js:455-461, 631-644`). Today's auto-combine shows `x = −12` (`add-17b`).
- (B) The Party/Battle question only, then the student types x.
- (C) Keep today's auto-combine.

*Answer: pending.*

**Q4. Should the text reminder rung come first on every shape and every card?**
- **(A) Recommended:** yes, a reminder first (outline the key number and ask the move's question, with the move open), then the picture. That includes Divide and the x-alone shapes. *Evidence:* your rule in `SPEC-ADD-TO-BOTH-SIDES-BUILD-NOTES.md` §15 says to apply this to later cards; Divide rev 2.2 starts at the picture.
- (B) Add only, as now.
- (C) Drop it everywhere and start with the picture.

*Answer: pending.*

**Q5. When the mistake is known (a typed slip, a same-sign move, a fraction that doesn't split), how much should help change?**
- **(A) Recommended:** only where rung 1 starts and what it points at (for example, `sizes-added` opens the counters at "cancel the pairs"). Same pictures, same ladder, nothing opens on its own.
- (B) A known slip opens its own scaffold automatically. *Evidence:* this conflicts with loop §6, "Nothing opens automatically".
- (C) Slips stay as messages; help ignores them.

*Answer: pending.*

---

## Not covered (honest gaps)

- I didn't screenshot the three-reds message (A-RED3, D-RED3), the forced Divide problem (D-MUST), or a typed-value slip on either card. Their behaviour is from the code at the lines cited.
- Several Add shots at 768 show the help row and pad cut off at the bottom of the screen in scaffold mode (`add-03`, `add-16`). That's the known fit problem (the lights report measures 187 px of overflow); I didn't measure it again.
- I drove the engine scripts in Node against `src/` directly (the probes are not committed). The screenshots come from the dev server at seed 7.
- Flip it was read for context only; it isn't built.
