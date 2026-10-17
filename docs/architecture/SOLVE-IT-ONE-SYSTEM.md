# One Solve it system, and what to borrow from Count it and Build it (read-only)  (2026-10-17)

**What this is.** An architecture and a migration plan for making every Solve it card one system, with each card only a problem type inside it. It is read from the code as it stands at `main` = `0415e23`. **No app code was changed, Count it and Build it were only read, and nothing was prototyped.** The only new files are in `docs/architecture/`.

**Read first:** `docs/scaffolds/SCAFFOLD-INVENTORY.md` (shape ids S1-S7, D1-D2 and rung ids come from there), `docs/lights-and-moves/LIGHTS-EXPERIMENT-REPORT.md`, `docs/design/SPEC-SOLVE-IT-LOOP.md` rev 1.2, and the Add, Divide and Flip specs.

**Lights round 2: not built.** No branch or document for it exists (remote branches checked 2026-10-17; the newest lights work is round 1, merged into main behind `?ui=lights`). Karl chose to run this report now anyway. Everything here about the manipulation layer is planned from round 1's code plus the prompt's description (reorder, combine by typing the sum, cross the border, distribute), and is marked *inferred*.

*Observed* = a file and line, a screenshot (`shots/…`, 1366×768, seed 7, dev server), or a script I ran. *Inferred* = my reading, with the reason.

---

## Summary

- **Count it and Build it are already built the way Solve it needs.** Every card is a pure reducer (`newSession(problem)` and `reduce(state, action)`, no DOM) plus a separate drawing (`renderMat(state) → <svg>`), joined by a "play adapter" object with one shared shape (`flipitPlay.js:14-45`). Solve it's two cards already use the same adapter shape. So a Count it walk **can run inside a Solve it rung unchanged**, fed a sub-problem made from the current equation. Example: `x = −3 + 5` → Combine it's problem `−3 + 5`.
- **What can be used unchanged:** Combine it's light mode with its wrong-answer → support ladder (the missing `x = b + k` help), the big-number walk, Boxes & Circles' integer and like-term walks, Group It's group drawings, Groups of Terms' arrows, and Value it's filled-box substitution picture.
- **What needs an adapter:** all of them, thinly. Each one must be given a sub-problem in its own data format and kept inside a reserved area of the Solve it screen. Their palettes, the bottom feedback line, the step bar, the streak and the 2.5 s auto-advance must be left behind. There are also size limits to work around (Flip It's counters stop at 12 per zone; Add's numbers go to 15).
- **The three biggest migration risks:**
  1. **Moving Add onto the shared loop changes things students will notice** (rungs restart per equation, Undo required after a red move, the choice at every state), and the lights experiment is wired to Add's private fields.
  2. **Student data and supports cross the section line.** Solve it writes into Count it's device "skills" store and into the class sheet's `supports` column through `lightStore.js`. Embedding Combine it's help would start turning Count it's supports on for that device unless the adapter keeps its tags apart.
  3. **The look.** There are eight separate counter drawings, and the colours mean different things in different areas (magenta is "opposite" in Count it but "negative" in Divide). Making it look like one system means either drawing new pieces or living with Count it's look, because Count it may not be edited.
- **Phase order I'd choose:** P0 parity harness → P1 fix Add's two state-blind rungs in place → P2 shape classifier and lights → P3 scaffold registry and shared ladder, Divide first → P4 Add onto the loop with the lights wrapper carried across → P5 the new rungs (Undo first; count-and-cancel by embedding Combine it) → P6 pieces layer and one screen → P7 manipulation layer (after round 2 is tested) → P8 the other cards as configuration.
- **Questions:** five, in Part 4, all answered by Karl on 2026-10-17.

---

## Part 1. What Count it and Build it already have (read-only)

**Which code is live.** The default is light mode (`main.js:65`, `?light=0` turns it off). The live adapters are the `*Light*` ones (`main.js:68-82`): Combine it L1-3 `lightPlay`, L4 `combineIntegerLightPlay`, L5+ `bigLightPlay`; Flip It `flipLightPlay` / `flipIntegerLightPlay`; Group It `lassoLightPlay`; Boxes & Circles `boxLightPlay` (L2 `boxModelPlay`); Groups of Terms `termGroupLightPlay`; Distribute, then combine `distributeLightPlay` (L4+ `distributeTypedPlay`); Value it `valueLightPlay`.

### 1A. Pieces, pictures, interactions and scaffolds Solve it could use

| # | What | Where | What it does | Data in → out | Assumes about its screen | Shot |
|---|---|---|---|---|---|---|
| C1 | **Combine it light mode**: type, then supports on request or after a wrong answer | `engine/lightSession.js` (282 lines) + `engine/scaffold.js` | Rungs: circle each number with its sign → rewrite a subtraction → the sign cloze (read aloud) → Party or Battle? → the full counters walk. **This is "add two signed numbers" help, built and tested.** | `newLightSession({left, op, right}, skills)` → state with `stage`, `support`, `tags`, `stuck`, `taught`, `wrongs` | Its own palette (`lightControls.js`); the feedback line at the bottom of the page (`main.js:512-514`); the step bar; the streak; Sound; a 2.5 s auto-advance when done (`main.js:521`) | `combineit-L1-b-stuck1`, `-c-stuck2` |
| C2 | **The wrong-answer → help table** | `engine/scaffold.js:28-75` | `classify(problem, typed)` → `sign-dropped`, `wrong-winner`, `battle-as-party`, `party-as-battle`, `minus-as-minus`, `unmatched`; `FIRST_SUPPORT`, `nextRung` | problem + typed text → `{correct, tag}`; tag → support id | none (pure) | none |
| C3 | **Flip It / Combine it counters walk**: Rewrite → Draw → Party or Battle? → Cancel pairs → Answer | `engine/session.js`, `engine/moves.js`; drawing `view/mat.js` | The student draws counters, chooses Party/Battle, taps pairs to cancel, and types what's left | `newSession({left, op, right})`; actions `tapZone`, `tapCounter`, `choose`, `digit`, `check` | **At most 12 counters per zone** (`moves.js:8`); an 860-wide SVG; the shared palette (`controls.js`) | `combineit-L1-c-stuck2`, `combineit-L4-b-stuck1` |
| C4 | **Big-number walk** (no counters): Circle → Party or Battle? → Add or Subtract? → Sign → Answer | `engine/bigSession.js` | Reasoning steps for numbers 11-60 | `newBigSession({mode: 'integers-big', terms})` | Boxes & Circles' drag-to-circle (`boxPointer.js`) | `combineit-L5-b-stuck1` |
| C5 | **Boxes & Circles walk**: Box & Circle → Draw → Cancel → Answer (with Rewrite at L4-5); also the integer mode for 3+ numbers | `engine/termSession.js`, `engine/terms.js`, `engine/termPieces.js`; drawing `view/boxMat.js`, `view/boxLayout.js` | Combining like terms: a box round each x term, a circle round each number, pieces drawn above, cancel the pairs. `mode: 'integers'` runs the same walk on numbers only | `terms.js` expression `[{kind: 'x'\|'int', op, value}]` (`terms.js:1-12`) | Drag across terms (`boxPointer.js`); its own palette (`boxLightControls.js`); the drag demo once per device | `boxes-L1-c-stuck2` |
| C6 | **Read the model**: □ = x, −□ = −x, ± counters; say each column | `engine/boxModel.js`, `view/boxMat.js` (`hideText`) | Picture → expression, with spoken column labels | expression → state | as C5 | `boxes-L2-a-start`, `-c-stuck2` |
| C7 | **Group It**: groups of a number, − groups flipped to their opposites, fraction bars (take 1 of d parts) | `engine/lassoSession.js`, `engine/groups.js`; drawing `view/lassoMat.js`, `view/lassoLayout.js` | A(B) as groups; Flip makes the opposite groups; a fraction takes n of d connected parts | `{neg, n, d}` count + B | an 860×330 drawing in two columns (`lassoLayout.js:1-7`); its palette | `lasso-L1-b-stuck1` |
| C8 | **Groups of Terms**: n groups of (Cx + D), with the distributing arrows (Check it) | `engine/termGroupSession.js`, `engine/termGroups.js`; drawing `view/termGroupMat.js`; light `engine/groupLight.js`, `view/groupLightMat.js` | Fill the groups, flip − groups, type the opened line; light mode shows the arrows from the number out front | `makeTermGroups(...)` | as C7 | `groups-of-terms-L1-b-stuck1` |
| C9 | **Distribute, then combine**: Groups of Terms on the group, Write it, then Boxes & Circles on the line; typed rounds with hints after 3 tries | `engine/distributeSession.js`, `engine/distributeLight.js`, `engine/distributeTyped.js` (`helpLines`, `typedHintFor`) | Distribute then combine, as two linked walks | `distribute.js` parts `[{type: 'group'\|'term'}]` | as C8 | `distribute-combine-L1-*`, `-L4-d-wrong` |
| C10 | **Value it**: x replaced by its value in parentheses → filled boxes (each box holds the value as counters; a −box holds the opposite) → the sum | `engine/valueLight.js`, `engine/value.js`; drawing `view/valueMat.js` (`boxShape`, `modelLayout` exported) | **A picture of substitution**: what Solve it's check rows only write as numbers | `{expr, x}` | the 860-wide Mat; walk palette | `value-L1-b-stuck1`, `-c-stuck2` |
| C11 | **Drawing helpers**: `el`, `counter(sign, x, y, cls, size)` | `view/lassoMat.js:33-58` | One SVG counter (a − mark, plus a | for +) | sign, position, class | the CSS under `.lasso-mat` (`style.css`, 27 rules) | none |
| C12 | **Wrong answer → help on the Build it cards** | `lightCards.js` `tagTerms`, `tagTermGroups`, `tagDistribute`, `groupCloze`; `boxLight.js:1-10` (the `0x + 13` and `x − 8x` slips) | Tags that pick the first support | expression + typed text → tag | none (pure) | none |

### 1B. Can Solve it use each one unchanged? The smallest adapter

All engines are pure and take plain data, so **every one of them can be imported unchanged.** The adapter is always a wrapper in Solve it's own code that does four jobs:
- **(1) Make the sub-problem** from the current shape.
- **(2) Hold the sub-session** as a field of the Solve it state, e.g. `s.helper = { kind: 'combine', state }`, and pass the helper's actions through.
- **(3) Draw its Mat** inside the reserved scaffold area. The Mats are SVGs with a `viewBox`, so they scale.
- **(4) Leave the parts that belong to Count it's screen behind:** palette, bottom feedback line, step bar, streak, auto-advance. Count it's light mode and walks make none of these themselves. `main.js` adds them around the adapter (`main.js:155-163, 495-523`), so a nested sub-session never triggers them. Observed: `render()` only reads the outer adapter.

| Piece | Use unchanged? | Smallest adapter (Solve it side only) | Limits to plan around |
|---|---|---|---|
| C1 + C2 Combine it light mode | **Yes, the engine** | S2 `x = b + k` → `makeProblem(int(b), '+', int(k))` (`expr.js:10`). When it reports `done`, the typed sum becomes the value typed for x, then the normal substitution check | (a) counters stop at 12 per zone, Add's numbers go to 15, so route sizes 13-15 to C4. (b) It **writes its tags into its own state**, and the adapter must not copy them into the Solve it session (Risk 2). (c) It wants the device `skills` (`lightSession.js:46`): pass `emptySkills()`, or the real ones (Q4) |
| C3 counters walk | Yes | the same, via C1's `fullWalk`, or directly | 12 per zone; starts at Rewrite (fine for `b + k`, where Rewrite is "nothing to rewrite") |
| C4 big numbers | Yes | for sizes 13+ | needs `boxPointer` dragging to circle |
| C5 Boxes & Circles | Yes | S5 (`x = b + k₁ + k₂`) → integer mode; later Two-step, Distribute and Variables on both sides → like terms on one side (convert the board's side to `terms.js` form: `{kind, op, value}`) | the board formats differ (Part 2, layer 2); pieces stop at `min(10, count + 2)` per term (`termMoves.js:76`) |
| C6 read the model | Yes | Flip it: "what does this side show?" with an opposite box | none |
| C7 Group It | Yes, the drawing | Flip it's "counters turn to their opposites" picture; Divide's fraction bar already borrows its helpers | its layout is two columns at 860×330 |
| C8 / C9 distribute | Yes | the Distribute card: `a(x + c) = b` → `makeTermGroups` for the side with the group | as C7 |
| C10 Value it | Yes; `boxShape` and `modelLayout` are exported | **the substitution check as a picture** (loop §4), any card, as a rung on a wrong value | x up to its own ranges |
| C11 `counter`, `el` | Yes (already imported) | a `pieces/` layer re-exports them (Part 2, layer 6) | styled by `.lasso-mat` CSS |

### 1C. Where Solve it already imports from Count it / Build it, and what would break

Observed (grep of every import in Solve it's files):

| Solve it file | Imports | From | If that file changed |
|---|---|---|---|
| `view/groupDiagram.js:15` | `el`, `counter` | `view/lassoMat.js` (Group It) | A change to `counter`'s arguments or the `.lasso-mat .counter` CSS breaks or restyles **Divide's** scaffold. `groupDiagram` also tags its own SVG `lasso-mat` (`groupDiagram.js:76`), so all 27 `.lasso-mat` CSS rules reach Divide's picture. The other way round, Solve it can't change `counter` without changing Group It; that's the rule Karl set. |
| `engine/addBothMoves.js:10` | `emptySkills` | `engine/skills.js` (Count it's light-mode supports) | Add carries Count it's `on` skills record (`addBothMoves.js:109`) for no use. Harmless today; coupling. |
| `play/addBothPlay.js:9`, `divideMovesPlay.js:10`, `addBothLightsPlay.js:11` | `recordProblem` | `lightStore.js` (written for Count it's light mode) | Every Solve it problem also runs `afterProblem(skills, …)` (`lightStore.js:25-29`). Solve it's tags don't match the `SKILL` table today (`scaffold.js:69-75`), so nothing changes. **If Solve it ever records Combine it's tags, it will turn on Count it's supports** for that device. |
| `engine/*` (Add, Divide, loop, terms) | `MINUS`, `typeInto`, `isTyping` | `engine/expr.js`, `engine/entry.js` (Flip It's model, the shared pad) | One-character constant and typing rules; low risk. |

Count it / Build it import **nothing** from Solve it (observed: no file outside Solve it imports `lightScreen`, `solveScreen`, `solveLoop`, `addBoth*`, `divide*`).

### 1D. What the three areas each draw their own way (a student would see the difference)

- **Eight counter drawings:**
  - `mat.js:36` (Flip It, Combine it)
  - `lassoMat.js:52` (Group It; also Divide through `groupDiagram`)
  - `boxMat.js:48` (Boxes & Circles)
  - `termGroupMat.js:55` (Groups of Terms)
  - `valueMat.js:56` (Value it)
  - `addBothMat.js:69` (Add's seesaw)
  - `solveMat.js:104` (the old one-step card)
  - `groupDiagram.js:24`'s grid on top of `counter`
  
  Their sizes and grouping differ: Add draws dashed group boxes on the seesaw (`add-03`); Count it draws loose counters in dashed zones (`combineit-L1-c-stuck2`).
- **Colours mean different things.**
  - **Magenta:** `--opposite` is "always with an underline" and means "came from an opposite" (a rewritten term, a flipped group) in Count it and Build it (`style.css:4`, `termPieces.js:7`). **Divide uses the same class for negative counters** (`groupDiagram.js:31`, `neg ? 'is-opposite' : 'is-inside'`; `div-02`), so in Solve it magenta means "negative".
  - **Green:** `--inside` is "inside a group" (Group It); in Divide it means "positive".
  - **Blue:** `--groups` (`#0072b2`) is "how many groups" in Group It, and in Solve it the same blue means "the operation" and "click here".
- **Boxes and the opposite box.**
  - Boxes & Circles draws −x as **−□** (a box with a dash in front, `boxes-L2-a-start`). Karl's poster decision (branch `claude/friendly-faraday-xzolrt`, commit `cdba0e4`) is "opposite box −□".
  - `SPEC-FLIP-IT.md` §1 rev 1.0 said "never as 'a box with a minus'"; rev 1.1 (2026-10-17) now says −□, matching Boxes & Circles.
  - Divide draws `x` inside its boxes (`div-02`); Boxes & Circles draws an empty □ with a key "□ = x". They still differ (an x inside, or an empty □ with a key); not decided yet.
- **The screen.**
  - Count it and Build it: the step bar on top, the feedback sentence at the **bottom** above the palette, a "?" button, a streak ("Streak 0 · Best 0"), a 2.5 s auto-advance.
  - Solve it: the line at the **top**, no step bar, no "?", no streak, nothing on a timer (loop §2).
  - The fonts differ too: Count it's problem and handwriting (Kalam) versus Solve it's stack.
  - A Count it piece embedded in Solve it must come without its frame, or the two styles will sit on one screen.
- **Signs.** Count it writes `−4 + 12` and `5 + (−8)` (parentheses for a negative after +, `combine.js:4-6`). Add writes `x + −6` and `−6 + −3` (no parentheses, `lightScreen.js:93-114`). The same sum looks different in the two sections.

---

## Part 2. One system: the target architecture

```
                 ┌──────────────────────────────────────────────────────────┐
  7  SCREEN      │  one Solve it screen: line · stack · x = [ ] · panel     │  view/solveit/screen.js
                 │  (moves + Goals lights) · help corner · pad · tray        │  (from lightScreen, solveScreen, lightsScreen, tuckedLayout)
                 └────────────▲───────────────────────────────▲─────────────┘
  5  MANIPULATION │ preview, typed blank, drag terms, reorder │  view state only (s.ui), like tucked and lights round 1
                 └────────────┼───────────────────────────────┼─────────────┘
  6  PIECES      counters · boxes · −□ · groups · seesaw · bars │  view/solveit/pieces.js: own drawings + re-exports of
                 └────────────┼───────────────────────────────┼──  lassoMat.counter, valueMat.boxShape (never edited)
                              │ actions                         │ draw(state)
                 ┌────────────┴─────────────────────────────────┴───────────┐
  1  ENGINE      │  solveLoop: states, choice, moves, judge, Undo, fold,    │  engine/solveLoop.js (grown)
                 │  forced move, substitution, help ladder                   │
                 └───▲───────────────▲───────────────────▲──────────────────┘
  2  SHAPES      shapeOf(state) → S1…, D1…   lightsOf(prev, now)            engine/solveit/shape.js (new)
                     │                       │
  3  SCAFFOLDS   registry: shape → [rung, rung, …]; rungs may embed a       engine/solveit/rungs/*.js (new; Add's and
                 Count it / Build it engine as a helper (C1, C5, C7, C10)   Divide's rungs moved here)
                     │
  4  CARDS       config only: generator · levels · live moves · slips ·     engine/cards/add.js, divide.js, flip.js, …
                 words · first-guess rule · lights shown
```

### Layer 1. Engine: one state model, one loop

**What `solveLoop.js` already provides** (observed, `solveLoop.js:1-285`):
- the choice at every state;
- guesses and final values through the shared substitution renderer;
- the forced-move rule;
- `commit` (helpful → new state; unhelpful → `needUndo`), folding and `foldNext`;
- Undo of only the unfolded move;
- Start over;
- the help ladder with rungs reset per state;
- Teach me;
- the answer-row rules;
- card hooks: `reduce`, `rungs`, `teach`, `answerBlocked`, `answerOpen`, `afterUndo`, `nextNeeded`, `movePromptKey`, `undoKey`, `params`, `touched`.

**What Add's reducer does that the loop cannot today** (observed in `addBothMoves.js`):
1. **A stage other than moves.** The build stage at L2-L3 (`:180-185`), and the `resolving` interlude while Party/Battle pairs are combined (`:402, 547-552`). The loop knows only `moves` and `done`. **Needed:** a card-owned `phase` the loop checks before its own actions (it already lets `card.reduce` go first, `solveLoop.js:152`).
2. **A two-action move inside the scaffold** (`pending` half-moves and tilt, `:365-390`). This fits as card or rung state, but `answerLive`/`helpOk` need a hook for "a half-move is open" (`answerBlocked` exists).
3. **Moves that aren't judged** (Trade places, `:344-356`): it rewrites the board without lights and doesn't count as red. **Needed:** `commit({ judged: false })`.
4. **No Undo gate**, and the path is fixed per problem. These are older rules; the loop's are the spec's (inventory Q1). This is a behaviour change, not a missing feature.
5. **Its own substitution** (`substitutionSteps`, `:604-620`, `sub.step >= 3` hard-coded). It goes away: the loop's renderer already passes Add's cases (audit registry #3).

**Verdict (inferred from the hooks):** the loop needs three small additions (a card phase, `judged: false`, a "help may open here" hook), not a rewrite. Add is the card that has to change.

### Layer 2. Shape classifier

`shapeOf(state)` and `lightsOf(prevShape, shape)` as in the inventory 3B, in a new `engine/solveit/shape.js`. It must be **order-free and sign-normalised**, and take the state, not just the board, because waiting-for-Undo is a flag.

**One board model for every card** (inferred from what the coming cards need). A side is a list of terms:
- `{kind: 'x', coef}` (coef may be a fraction later),
- `{kind: 'num', v}`,
- `{kind: 'frac', n, inner}` (Divide's `⅟a(b)`),
- `{kind: 'group', n, inside: [terms]}` (Distribute).

Add's and Divide's boards are already subsets of this (`addBothMoves.js:20-27`, `divideMoves.js:15-19`).

**Converters to Count it / Build it formats:**
- `toFlipIt(b, k)` → `{left, op, right}`
- `toTerms(side)` → `[{kind: 'x'|'int', op, value}]`
- `toTermGroups(group)`

They live in Solve it's code (layer 3's helpers), so nothing in Count it or Build it changes.

**Lights.** Solved for x and One box read one shape; Fewer terms and Smaller numbers compare two shapes. This replaces:
- Add's `judge` (`addBothMoves.js:84-88`),
- Divide's hard-coded `smaller: 'green'` (`divideMoves.js:227`),
- the classic panel's copying of Fewer terms' green into six other lights (`lightScreen.js:288`).

### Layer 3. Scaffold registry

**A rung is a small object:**
```
{ id: 'S2.count', shows: 'counters', does: 'cancel pairs, count, type x', uses: ['combine'],
  when: (shape, slip) => shape.id === 'S2',
  open(state, shape) → state,          // reads shape.params, never state.problem
  reduce(state, action) → state | undefined,
  view: 'helper' | 'seesaw' | 'groups' | 'line-only' }
```
- **The registry** is `shape id → ordered rungs`. A known slip picks only where to start (inventory Q5).
- **The ladder machinery** stays in the loop: the stuck count, reset per state, the supports log with old names plus a `shape` field.
- **Helpers:** rungs that embed a Count it or Build it engine hold it in `s.helper` and pass actions through.
- **Teach me** is the same rungs in forced mode.

**Which existing rungs move in** (from inventory 3D):
- **as they are:** A-REM, A-SEE, A-BUILD, A-TWO, A-ZERO, D-MODEL, D-DEAL, D-PIC, D-GUIDE, D-DIAG1, D-DIAG2;
- **after a rewrite to read the shape:** A-GUIDE and A-TEACH;
- **new:**
  - "Undo first" (every waiting state),
  - S2 count-and-cancel (embeds C1, C4 for sizes 13+),
  - S5 (embeds C5's integer mode),
  - DF "why it didn't split" (Divide's own boxes).

### Layer 4. Cards as configuration

```
export default card({
  id, title, levels: [{ forms, ranges, mixes, live: ['add'], lights: ['fewer','solved'], collapse: false }, …],
  generate(level, seed),                 // verified by substitution (the shared generator checks)
  start(problem) → board,
  moves: { add: { amount: 'integer', apply(board, k) → { rows, next } } },   // or fraction, flip, trade, …
  slips: { typed: tag(p, v) → tag, messages }, words: { … },
  firstGuess: 'force-next' | 'owe-same',  // the loop rule, or the lights experiment's
})
```

**Rough size of each card's own file** (inferred: today's card logic minus what moves into layers 1-3):

| Card | Today | As configuration | New pieces it brings |
|---|---|---|---|
| **Add to both sides** | `addBothMoves.js` 677 + `addBoth.js` 69 + messages 162 + lights wrapper 212 | ~150 lines: forms, the amount move with auto-cancel on x's side, Trade places (unjudged), slips, words | none |
| **Divide it** | `divideMoves.js` 240 + `divide.js` 74 + messages 51 | ~100: the fraction move, `takeFraction`, slips, words | none |
| **Flip it** (not built) | none | ~80: Flip everything (no amount), Take a fraction reused from Divide, slips, the one named guess message | shapes `−ax = b`, `−x = b`, `x = −(b)`; rung "flip both sides" (C7's flip picture); the opposite-box piece |
| **Fraction equations** | none | ~80: Multiply both sides | shapes `(1/a)x = b`, `x = a(b)`; rung via C10's boxes |
| **Two-step** | old `solve2.js` (not on the loop) | ~60: Add + Divide moves together | shapes `ax + c = b`, `ax = b + k` (combine first: S2 rung reused) |
| **Distribute / Combine** | none on the loop | ~80: Distribute, Combine like terms | the `group` term; rungs from C8/C9 and C5 |
| **Variables on both sides** | none | ~60 | x terms on both sides; C5 for like terms |

### Layer 5. Manipulation layer

**Round 1's pattern is already right** (observed): `withLights(reduce)` wraps a reducer (`addBothLights.js:72`) and keeps hover/preview/focus in `s.ui`, the same pattern as the tucked layout's `withTuckedUi` (`tuckedLayout.js:30`).

**Target:** one `withManipulation(loop.reduce)`.
- **Gestures become loop actions:**
  - drop a number into the blank → `setAmount`;
  - type the sum → `combine` (a new loop action: the student's own combining replaces S2 → S7, and is the only way S7 is reached);
  - drag a term across = → `cross` (Cross the border, a move);
  - reorder → a view-only change, or `reorder` with `judged: false`;
  - drag a number onto a group → `distribute`.
- **The engine keeps one canonical board; the shape classifier ignores order.** Round 2's own details are unknown (not built), so this is *inferred*.

### Layer 6. Pieces library

A `view/solveit/pieces.js` with one look:
- `counter(sign)`, `box({ opposite })`, `group(…)`, `bar(n, kept)`, `seesaw(items)`.
- **Can it be a thin layer that re-exports Count it's drawings?** Only partly (observed from the exports):
  - `lassoMat.js` exports `el` and `counter`; `valueMat.js` exports `boxShape` and `modelLayout`. Those can be re-exported unchanged.
  - Boxes & Circles' box and opposite-box drawing (`boxMat.js` `pieceNode`, `counterMarks`) and Flip It's counter (`mat.js:36`) are **not exported**. Solve it can only use them by embedding the whole Mat, or by drawing its own copy, which adds a ninth counter drawing.
- **Recommendation (inferred):**
  - Solve it's pieces layer **draws its own counter and boxes once, matching Count it's look** (the same marks, sizes and colour tokens), and re-exports `counter`/`boxShape` where they fit.
  - Embedded Count it Mats keep their own drawing. This is the honest cost of "don't touch Count it": some inconsistency stays inside embedded helpers (Q2).

### Layer 7. The screen

- **One component** (`view/solveit/screen.js`) for every card: the line, the stack (one row builder), `x = [ ]`, the panel (moves + Goals lights from `lightsOf`), the help corner, the pad, and a reserved tray for pictures and helpers.
- **Today there are four copies:** `lightScreen.js`, `solveScreen.js`, `lightsScreen.js`, `tuckedLayout.js` (audit registry #2, #5, #6).
- **The tucked shell and round 1's lights layout are the two candidates**; Karl's tests should pick one (Q1).

**Per layer: what becomes it, what's deleted, what's new**

| Layer | From existing | Deleted | New |
|---|---|---|---|
| 1 Engine | `solveLoop.js`, `solveTerms.js` | Add's `climb`, `teach`, Undo, `check` and `substitutionSteps` copies; `numericLevel.js` merged with `divideNumeric.js` (refactor R8) | a card phase, `judged: false`, `combine`/`cross` actions |
| 2 Shapes | Add's `judge`, `xTerms`; Divide's `xAlone`, `coefOf` | the six-light fallback | `shape.js`, the board converters |
| 3 Scaffolds | Add's rungs (#1-#9 of the inventory), Divide's (#19-#25) | `aStuckSolved`; the unreachable count step (rebuilt as a helper) | registry, "Undo first", the helper wrapper, S2/S5/DF rungs |
| 4 Cards | `addBoth.js`, `divide.js`, generators, messages | most of `addBothMoves.js` | `cards/*.js`; a shared generator check (refactor R9) |
| 5 Manipulation | `addBothLights.js`, `lightsPointer.js` | lights' own commit (`lx.awaitNext`), replaced by the loop's fold | `withManipulation` |
| 6 Pieces | `drawBalance`, `groupDiagram`, `counterMark` | Add's own counter drawing | `pieces.js` |
| 7 Screen | `lightScreen`, `solveScreen`, `lightsScreen`, `tuckedLayout`, `divideScreen` | three of the four shells | `screen.js` |

---

## Part 3. Migration plan

**Rules for every phase.** It ships on its own, behind a flag where behaviour changes. Count it and Build it files are never edited. The class sheet keeps its old words (`supports`: `hint`, `model`, `move`, `guided`, `crossoff`, `forced`), and a new `shape` field is added, never renamed.

**Parity tests, run on every phase:**
- **(a) Problems:** the same seeds give the same problems, for every card and level (snapshot `generate(level, seed)` for seeds 1-200).
- **(b) Save codes:** the same save codes (encode/decode round trip of every level combination, v14).
- **(c) Class-sheet records:** for scripted runs of each card, the same `makeRecord` output (`eventlog.js:10-24`) apart from the new `shape` field.
- **(d) Screens:** screenshots equal with the flag off (the dev-server script used for these reports, at 1366×768).
- **(e) Count it and Build it:** their own tests and screenshots unchanged (they must not move at all).

| Phase | What | Size | Model | Touches | Could go wrong |
|---|---|---|---|---|---|
| **P0** | **Parity harness**: the five checks above as tests and a screenshot script; `happy-dom` for screen tests (refactor R0) | S | Sonnet 5.5 | `tests/`, a dev dependency | flaky screenshots (fix fonts and seeds) |
| **P1** | **Fix Add's two state-blind rungs in place**: the guided amount and Teach me use the current number, not `oppositeOf(s.problem)` (`addBothMoves.js:215, 225-226, 518-523`); Teach me at x alone opens the S2 text instead of "add −8 again" | S | Sonnet 5.5 | `addBothMoves.js` | **ships a student-visible fix now**; tiny diff; nothing else moves |
| **P2** | **Shape classifier + lights from the shape**, behind `?shape=1` on both engines; `shape` added to each `supports` entry in the log | S-M | Opus 5.5 | new `shape.js`; one line in each card to call it; `eventlog.js` (additive) | the classifier disagrees with today's lights on an edge case. Run both and log the differences for a week before switching |
| **P3** | **Scaffold registry + the loop's ladder reading it, Divide first** (Divide is already on the loop, so this is a pure move) | M | Opus 5.5 | `divideMoves.js` rungs → `rungs/divide.js` | Divide's behaviour shifts. Parity: every rung's state and message identical on scripted runs |
| **P4** | **Add onto the loop (refactor R7)**, behind `?addloop=1`, with the lights wrapper carried across (below) | L | Fable 5.1 or Opus 5.5 | `addBothMoves.js` → `cards/add.js` + rungs; `addBothLights.js`; `addBothPlay.js` | **the biggest risk**: student-visible changes (rungs restart per state; Undo required; choice per state); the build stage, Trade places intro and zero-other behaviour lost; characterisation tests first (R7's precondition) |
| **P5** | **New rungs**: "Undo first" (every waiting state, both cards); S2 count-and-cancel by embedding Combine it's light mode (C1), with C4 for sizes 13-15; Divide's DF picture | M | Opus 5.5 | `rungs/*`, the helper wrapper, the tray | Count it's frame leaks in (palette, auto-advance); its tags reach Count it's skills (keep them in `s.helper` only) |
| **P6** | **Pieces layer + one screen** | M-L | Opus 5.5 | `pieces.js`, `screen.js`; the four shells retired | layout regressions at 1366×768 and 650 tall; the fit test must gate it |
| **P7** | **Manipulation layer** (after Karl has tested round 2) | L | Fable 5.1 | `withManipulation`, new loop actions | the state space doubles (inventory 3E); the classifier and registry must already be order-free |
| **P8** | **Each new card as configuration**: Flip it first (it reuses Divide's move and rungs), then Fraction equations, Two-step, Distribute/Combine, Variables on both sides | M each | Opus 5.5 | `cards/*.js`, new shapes and rungs | a card that needs a loop feature that doesn't exist yet. Add it to the loop, never to the card |

**Why this order, against the prompt's (a)-(g):**
- **P0 comes first** because every later phase claims parity, and nothing measures it today (the audit found no screen tests).
- **P1 is pulled forward:** it's a two-line bug fix that students feel now, and waiting for P4 means months.
- **The registry starts on Divide (P3) before Add moves:** Divide is already on the loop, so the registry is proven on the easy card.
- **The count-and-cancel rung (P5) waits until after the Add port (P4)**, so it's built once, in the registry, not first in Add's private `climb`.

**Carrying the lights experiment across in P4 (so it isn't built twice).** Observed: `withLights(reduce = reduceAddBoth)` already takes the reducer as a parameter (`addBothLights.js:72`), so it can wrap `loop.reduce` instead. What it reads from Add's private state has to be mapped:

| Lights wrapper uses | Today (Add) | On the loop |
|---|---|---|
| "a move is waiting for Next" | its own `lx.awaitNext` + `commit()` (`addBothLights.js:60-67`) | **delete it**: the loop's `unfolded` + `foldNext` are the same idea (`solveLoop.js:101, 224-229`); `lxNext` → `foldNext` |
| no Guess x / Use a move | sets `path` just in time (`:69-70, 122-126`) | a loop option `choice: 'none'`, with `answerLive` true from the first frame; the hack goes |
| a correct guess owes the move on the same problem | rewrites a finished state back to `moves` (`:170-176`) | the card's `firstGuess: 'owe-same'` |
| the blank, preview, focus | `s.ui` (view only) | unchanged: becomes layer 5 |
| `menu === 'add'`, `amountEntry`, `pending`, `combining`, `resolving`, `lights.fewer`, `zeroOther`, `lastAmount` | Add's fields | the card config's move state and `lightsOf`; each read in `addBothLights.js` (26 places by grep) checked by the P4 characterisation tests |
| its test log `mat.lights.v1` and `typedBeforeMove` | local + one line in `eventlog.js:22` | unchanged (additive) |

After P4, `addBothLights.js` shrinks to view state and logging (inferred: about a third of its 212 lines).

---

## Part 4. Questions (batch 1)

Recommended option first. Answers are recorded here when given.

**Q1. Which screen becomes the one Solve it screen?**
- **(A) Recommended:** decide after your classroom test of lights round 1/2. Until then, build the layers (P0-P5) so they don't care which screen draws them. *Evidence:* two shells are being tested now, the tucked layout on Divide and the lights layout on Add, and they disagree on where the moves and help go.
- (B) The tucked shell now.
- (C) The lights layout now.

*Answer (Karl, 2026-10-17): (A). Decided after the classroom tests.*

**Q2. When a Count it helper runs inside a Solve it rung, how much of Count it's look is acceptable?**
- **(A) Recommended:** its Mat and drawing as they are (its counters, its fonts), but never its frame (step bar, bottom line, streak, palette, auto-advance). Solve it's line and pad drive it. *Evidence:* the Mats are separable SVGs (`renderMat` returns one `<svg>`); the frame comes from `main.js`, not the Mat.
- (B) Redraw it all in Solve it's own pieces. This duplicates the drawing and means the engines must expose more than they do.
- (C) The whole Count it screen, as is, in a panel.

*Answer (Karl, 2026-10-17): close to (A). Count it's pictures need not match exactly, but the feel must not be considerably different.*

**Q3. The opposite box: which drawing is the system's?**
- **(A) Recommended:** −□ (a box with a dash in front), as Boxes & Circles draws it and your poster decision says. Change `SPEC-FLIP-IT.md` §1 to match. *Evidence:* `boxes-L2-a-start`; branch `claude/friendly-faraday-xzolrt` commit `cdba0e4`.
- (B) A separate opposite-box drawing (Flip spec §1), which Count it wouldn't have.
- (C) Decide when Flip it is built.

*Answer (Karl, 2026-10-17): (A). −□, as Build it draws it. `SPEC-FLIP-IT.md` is now rev 1.1 to match.*

**Q4. Should help used inside Solve it count toward Count it's supports (the device "skills" that keep a support switched on)?**
- **(A) Recommended:** no. Solve it's helpers start with no skills, and their tags stay out of `afterProblem`. *Evidence:* `lightStore.js:25-29` updates Count it's skills from every Solve it problem's tags; Combine it's tags would match `SKILL` (`scaffold.js:69-75`) and change Count it.
- (B) Yes: one student, one set of supports across sections.
- (C) Count them, but in a separate store.

*Answer (Karl, 2026-10-17): (A). Help used in Solve it does not switch on Count it's supports; a shared record is a later decision.*

**Q5. Magenta and green: what do they mean in Solve it?**
- **(A) Recommended:** keep Count it's meanings (magenta = came from an opposite; green = inside a group). Divide's negative counters become black − marks like Count it's. *Evidence:* `style.css:4-7`; `groupDiagram.js:31` uses `is-opposite` for "negative".
- (B) Keep Divide's (magenta = negative) and accept that the sections differ.
- (C) Decide in the palette pass (lights-and-moves Q8).

*Answer (Karl, 2026-10-17): (C). Decided in the colour pass.*

---

## Not covered (honest gaps)

- **Lights round 2** doesn't exist yet. Layer 5 and P7 are planned from round 1 and the prompt.
- **Count it and Build it** were read through their engine headers, exports, adapters and the lines cited, plus 60 screenshots of their start, I'm stuck, wrong-answer and Teach me states. I didn't trace every step of every walk.
- **The 2.5 s auto-advance and the frame:** I read in `main.js` that an embedded sub-session doesn't trigger them; I haven't run a prototype to prove it (none was allowed).
- **Line counts** for the card files after migration are estimates.
- **Distribute, then combine's typed rounds (L4+)** have no I'm stuck or Teach me buttons (the clicks found nothing, `distribute-combine-L4-*`). Their help is the hint after three tries.
