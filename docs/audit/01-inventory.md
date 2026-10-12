# 01 · Inventory of The Mat

*Audit of commit `17835f7` (2026-10-12). "Observed" = seen in the file and line cited. "Inferred" = my reading, with the reason.*

## 0. Where the documents are (Phase 0)

- **Observed:** there is no `docs/design/` and no `docs/handoff/` folder. Every design document sits at the repo root: `SPEC-SOLVE-IT-LOOP.md` (rev 1.1), the card specs `SPEC-ADD-TO-BOTH-SIDES.md` (rev 2.3), `SPEC-DIVIDE-IT.md` (rev 2.1), `SPEC-FLIP-IT.md` (rev 1.0, designed, not built), the brief `BUILD-BRIEF-DIVIDE-IT-2026-10-12-a.md`, the handoff `DESIGN-HANDOFF.md`, `DECISION-LOG.md`, build notes for Add and Divide, and 14 older specs for Count it / Build it and the engine. `README.md` (657 lines) is mostly a changelog.
- **Observed:** 30 screenshots (`*.png`, about 2.3 MB) sit at the repo root. Inferred: leftovers from earlier sessions' reviews; they are not referenced by the app.
- **Observed:** `SPEC-ADD-TO-BOTH-SIDES.md` is still rev 2.3. The loop (§"Required edits") asks for rev 2.4; that edit has not been made, so the Add spec still contains lines the loop overrides ("the choice is fixed for the problem" line 10 and 44; "Start over is live only after three red moves" line 35).

## 1. Sections, cards and levels

Source: `src/packs/index.js:153-174` (PACKS, SECTIONS), `src/packs/combineit.js`, `src/packs/flipit.js`.

| Section | Card (id) | Levels | Play adapter (`src/main.js:64-77`) | Notes |
|---|---|---|---|---|
| Count it | Combine it (`combineit`) | 5 | `lightPlay` L1-3, `combineIntegerLightPlay` L4, `bigLightPlay` L5 | |
| Count it | Flip It (`flipit`) | 5 | `flipLightPlay` L1-4, `flipIntegerLightPlay` L5 | Name collides with the designed Solve it card "Flip it" (`SPEC-FLIP-IT.md`). |
| Count it | Group It (`lasso`) | 7 | `lassoLightPlay` | Id stays `lasso` for old saves. |
| Build it | Boxes & Circles (`boxes`) | 6 | `boxModelPlay` L2, `boxLightPlay` others | |
| Build it | Groups of Terms (`groups-of-terms`) | 8 | `termGroupLightPlay` | |
| Build it | Distribute, then combine (`distribute-combine`) | 5 | `distributeLightPlay` L1-3, `distributeTypedPlay` L4-5 | |
| Build it | Value it (`value`) | 4 | `valueLightPlay` | Save code reserves 5. |
| Solve it | Add to both sides (`add-both`) | 6 | `addBothNumericPlay` L1, `addBothPlay` L2-6 | Light-build pilot. Not on the shared loop. |
| Solve it | Divide it (`divide-it`) | 6 | `divideNumericPlay` L1, `divideMovesPlay` L2-6 | On the shared loop. |
| Solve it | One-step equations (`one-step`) | 5 (shows 3-5) | `solveLightPlay` | Old card, still live. `firstLevel: 3`, shown as Levels 1-3 (ax = b, x/a = b, mixed). |
| Solve it | Two-step equations (`two-step`) | 7 | `solveLightPlay` | Old card, still live. |
| Solve it | Multi-step equations | 0 | none | "Coming soon" card. |
| (retired) | Switch sides (`switch`) | 6 | `switchPlay` | `retired: true`, off the menu, **but still playable by `?pack=switch&level=N`** (`main.js:587` checks only `PLAY[id]`), and a finished level is saved. |

- **Old content that overlaps a new card (observed):** One-step "Level 1" on screen is `ax = b` (`packs/index.js:97`), the same task as Divide it. Both are on the Solve it menu.
- **`?light=0` (observed, `main.js:63`):** switches Count it / Build it to the older step-by-step adapters (`combinePlay`, `flipitPlay`, `lassoPlay`, `boxPlay`, `termGroupPlay`, `distributePlay`, `integerPlay`, `bigPlay`). Inferred: a teacher/debug path; it keeps eight adapters alive.

## 2. Entry points

- `index.html`: one page. A shared header (`← Packs`, title, streak, five dots, Next level, Save code), a steps bar, `#mat`, `#feedback`, `#hint`, and `#controls` (the palette/pad). `#home`, `#quiz` (fluency and diagnostic), `#dialog`.
- `src/main.js` (593 lines): loads progress, builds the home screen (`view/packmap.js`), starts levels (`startLevel`, line 235), routes every action to the card's adapter (`dispatch`), renders, saves, syncs, handles the keyboard (Enter moves forward through Check, Next, Go: lines 548-552).
- URL parameters: `?pack=&level=` opens a level; `?seed=` fixes the problem set; `?class=` sets the class sheet; `?light=0` (above).
- **Inferred:** the page shell (header, steps bar, feedback line at the bottom, palette) was built for Count it; the Solve it cards switch parts of it off with adapter flags (`noSteps`, `noAuto`, `noStreak`, `lineInMat`) and draw their own line, stack and help row inside `#mat`.

## 3. How a card is configured (observed)

Three layers, in three folders:
1. **Pack** (`src/packs/index.js`): `{ id, title, subtitle, blurb, levels, levelNames, generate(level, seed), firstLevel?, retired?, comingSoon? }` plus its place in `SECTIONS`.
2. **Play adapter** (`src/play/*.js`, 22 files): `{ steps, newSession, reduce, renderMat, buildControls, effects, feedbackText, matAction, bindMat?, owesMove?, noSteps?, noAuto?, noStreak?, lineInMat?, phaseLabel? }`, chosen per level in `main.js:64-77`.
3. **Engine and view** (`src/engine/` 73 files, `src/view/` 69 files): each card has its own session/reducer, generator, hints/slips and Mat. Only Divide it uses the loop's card-config shape (`createSolveLoop(card)`, `src/engine/solveLoop.js:17-32`: `startBoard, alone, extra, snapshotExtra, resetState, tag, slip, collapse, reduce, rungs, teach, answerBlocked, answerOpen, nextNeeded`).

## 4. Save code and stored progress

- **Format (observed, `src/engine/progress.js:142-275`):** `MAT-` + version symbol + data symbols + checksum, base 31 (no look-alikes). The data is a bitmask: **one bit per level**, packed in each layout's pack order. Current version **v14** (16 data symbols, 75 bits used). Versions 1-14 still decode. v11/v12 lost low bits to floating point; v13+ use BigInt (`progress.js:155-160`).
- **What the code carries:** finished levels only. **Not** the diagnostic's opened levels (`open`), not a "skipped" L1, not supports, streaks or logs.
- **localStorage keys (observed):** `mat.v1` (progress + level in play, `main.js:97`), `mat.v1.backup` (written, never read), `mat.sync.v1`, `mat.skills.v1`, `mat.events.v1` (500-record log), `mat.fluency.v1`, diagnostic store (`diagStore.js`), `mat.tour.v1`, speech and install-prompt flags.
- **Migrations (observed):** `normalizeProgress` (`progress.js:74-94`) realigns Combine it (4→5 levels) and Boxes (5→6), then `withLegacyCredit` gives Add to both sides and Divide it credit from One-step and Switch sides (`progress.js:96-131`).

## 5. Generators and verifiers

- One generator per card (`src/engine/generate*.js`, 13 files). Shared helpers `mulberry32`, `pickSet` in `generate.js`.
- **Verified by substitution in code (observed):** Add (`addBoth.js:22` throws if the check fails), Divide (`divide.js:13`). Others were not audited line by line.
- **Worst-case row count (observed):** only Divide it reports it (`generateDivide.js:113-134`, tested in `tests/divide.test.js:91-105`: 8 rows prime a, 9 composite). Add does not.
- **Slip collisions:** Divide resolves collisions by a fixed priority order (one tag per wrong value, `divide.js:49-60`); neither generator *reports* collisions as the loop §8 asks. Inferred from reading; no test named for it.

## 6. Sheet sync

- App side: `src/engine/sync.js` (pure), `src/sync.js` (requests), `src/syncStore.js` (device memory), `src/view/account.js`, `src/googleSignIn.js`, `src/syncConfig.js` (a default class address is committed, line 4).
- Sheet side: `teacher/Code.gs` (merge, scrambled id by HMAC-SHA-256 with `ID_KEY`, formula-injection guard), `teacher/RosterSync.gs` (private roster → Directory tab), `teacher/SETUP.md`, two `.xlsx` templates.
- Sent: levels done and opened, the anonymous problem log, fluency runs (`engine/sync.js:51-58`). Merge is a union (`takeFromSheet`, line 67).

## 7. Deployment

- `.github/workflows/ci-deploy.yml`: on every push and PR, `npm ci`, `npm test`, `npm run build`; **deploys to GitHub Pages only from `main`**. `BASE_PATH` is `/<repo name>/`. A comment says the base will change when the final URL is decided (that change moves the site to a new origin: see 03 §C).
- No service worker. A web manifest (`public/manifest.webmanifest`) allows home-screen installs.

## 8. Tests

- Vitest, `environment: 'node'` (`vite.config.js`). 63 files, 931 tests, all passing at `17835f7`.
- **Engine-heavy.** Tests import engine modules and some view *text* and *layout* helpers; **no test renders a screen** (no DOM). So "the stack blanks", "the layout reflows", "a button is live when it shouldn't be" can only be caught by hand today.
- Good coverage on the save code (`savecode.test.js`), progress migration (`progress.test.js`), the class sheet (`classSheet.test.js` with a fake sheet), the loop on Divide it (`divideMoves.test.js`, including "the prompt never changes"), the renderer (`solveTerms.test.js`, including the loop's five cases). **No test for `syncStore.js`.**

## 9. Duplicated or legacy code (details in 02)

- Two Solve it screen stacks: `view/lightScreen.js` (Add) and `view/solveScreen.js` (shared, used by Divide only). Each has its own `lineBlock`, `termsOf`, `stackRows`, `answerBlock`, `nextButton`, `helpRow`.
- Two Solve it engines: `engine/addBothMoves.js` (677 lines, own loop) and `engine/solveLoop.js` (278 lines, used by Divide only).
- Two numeric-level stacks: `engine/numericLevel.js` + `view/numericScreen.js` (Add L1) and `engine/divideNumeric.js` + `view/divideNumericScreen.js` (Divide L1).
- Two fraction-of-a-group drawings: `lassoMat.js` `fractionScript` (Group It) and `groupDiagram.js` (Divide).
- About a dozen number pads (one shared `buildPad` in `view/quiz.js:20` used only by fluency and the diagnostic).
- The `html()` helper is defined in `addBothMat.js:18` and again in `groupDiagram.js:17`; `el()` in several Mats.
- The operation blue `#0072b2` is written out 31 times in `style.css` (it equals `--groups`); `.lb-line` is restyled in four places with different `min-height` (`style.css:2768, 2814, 2902, 2987`).
- Legacy reachable paths: the `?light=0` adapters, the retired Switch sides via `?pack=switch`.

## 10. Size and complexity hotspots

| File | Lines | Why it matters |
|---|---|---|
| `src/style.css` | 3181 | One file for every card; later rules override earlier ones (four `.lb-line` blocks). |
| `src/engine/addBothMoves.js` | 677 | A second copy of the loop, plus the scaffold, building, combining, Trade places. |
| `src/main.js` | 593 | Routing, saving, sync, keyboard, phone fitting, streaks, all in one. |
| `src/view/termGroupMat.js` | 375 | |
| `src/view/lightScreen.js` | 335 | Add's screen, but also the home of `movePanel`, `equationRow`, `moveIcon` that Divide imports. |
| `src/engine/progress.js` | 328 | Progress, migration, legacy credit and the save code together. |
| `src/view/addBothMat.js` | 322 | Add's Mat, but also the home of `html`, `actionRow`, `drawBalance` that the "shared" screen imports. |
