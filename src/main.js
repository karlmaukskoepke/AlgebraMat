import './style.css';
import { PROBLEMS_PER_LEVEL } from './engine/generate.js';
import {
  completeLevel, isPackComplete, isLevelUnlocked, normalizeProgress, mergeProgress, withLegacyCredit,
  encodeProgress, decodeProgress, doneCount, nextLevel, isLevelPlaced, placedOpening, PROGRESS_VERSION,
} from './engine/progress.js';
import { createStore } from './storage.js';
import { PACKS, SECTIONS, HIDDEN_PACKS, packById, levelNumber, isWhyLevel, WHY_LABEL, lastLevelOf, forcedMoveOn } from './packs/index.js';
import { flipitPlay } from './play/flipitPlay.js';
import { combinePlay } from './play/combinePlay.js';
import { lightPlay, flipLightPlay } from './play/lightPlay.js';
import {
  combineIntegerLightPlay, flipIntegerLightPlay, bigLightPlay, lassoLightPlay,
} from './play/walkLightPlay.js';
import { boxLightPlay } from './play/boxLightPlay.js';
import { boxModelPlay } from './play/boxModelPlay.js';
import { termGroupLightPlay } from './play/termGroupLightPlay.js';
import { distributeLightPlay } from './play/distributeLightPlay.js';
import { valueLightPlay } from './play/valueLightPlay.js';
import { addBothPlay, divideMovesPlay, flipPlay, twoStepPlay, distSolvePlay, bothSidesPlay, distMorePlay, strangePlay, fractionsPlay } from './play/solveCards.js';
import { divideNumericPlay } from './play/divideNumericPlay.js';
import { addBothNumericPlay } from './play/addBothNumericPlay.js';
import { boxPlay } from './play/boxPlay.js';
import { afterAnswer } from './engine/streak.js';
import { loadBests, saveBest, loadLog } from './lightStore.js';
import { createSync } from './sync.js';
import { loadSync, saveSync, loadInfo, saveInfo } from './syncStore.js';
import { loadGoogle } from './googleSignIn.js';
import { DEFAULT_CLASS } from './syncConfig.js';
import { showAccount, accountLabel } from './view/account.js';
import { bestFor } from './engine/streak.js';
import { integerPlay } from './play/integerPlay.js';
import { bigPlay } from './play/bigPlay.js';
import { lassoPlay } from './play/lassoPlay.js';
import { termGroupPlay } from './play/termGroupPlay.js';
import { distributePlay } from './play/distributePlay.js';
import { distributeTypedPlay } from './play/distributeTypedPlay.js';
import { renderPackMap, renderLevelDone } from './view/packmap.js';
import { showSaveCode, askForCode } from './view/codes.js';
import { endTour } from './view/tour.js';
import { endDragDemo } from './view/dragDemo.js';
import { newFluency, reduceFluency } from './engine/fluency.js';
import { createFluencyView } from './view/fluency.js';
import { loadRuns, saveRun } from './fluencyStore.js';
import { bestScore } from './engine/highscores.js';
import { CHALLENGES } from './engine/fluency.js';
import {
  diagnosticItems, itemAnswer, newDiagnostic, reduceDiagnostic, readout, applyReadout, upgradePlacement, totalOf, DIAGNOSTIC_SECTIONS,
} from './engine/diagnostic.js';
import { createDiagnosticView } from './view/diagnostic.js';
import { loadDiag, saveDiag, clearDiag, saveOldPlacement } from './diagStore.js';
import { redrawMat, finishFlips } from './view/keepRows.js';
import { finishRewrites } from './view/rewriteAnim.js';
import { chooseSize } from './view/fitSize.js';
import { nextMove } from './engine/solveit/honest.js';
import { snapshot, changesSince, SEEN_KEY } from './engine/status.js';
import { demoProgress, demoSeen } from './engine/demo.js';
import {
  canTestOut, chooserDue, testOutSeed, testOutProblems, ALL_TAUGHT, checkResult, quiet, HELP_ACTIONS, passCredit, suggestedLevel, attemptRecords,
  PASS_WORD, FAIL_WORD, TEST_OUT_PROBLEMS,
} from './engine/testOut.js';
import { setNoHelp } from './engine/noHelp.js';
import { holdRecords, heldRecords, appendRecords } from './lightStore.js';
import { closeFirst } from './view/visit.js';
import { askNoHelp, renderTestOutBar, renderTestOutFail, passNote, openPassNote } from './view/testOut.js';
import { levelStarted, markStarted } from './startedStore.js';

const $ = (id) => document.getElementById(id);

// Each pack's play adapter: its steps, session, Mat, controls and messages.
// A pack can use a different adapter for some levels (Combine it's Level 4 and Flip It's Level 5 run on the
// integer steps, and Combine it's Level 5 its own), so each entry is the adapter or a function of the level.
// Light mode is how nearly every level plays (SPEC-SCAFFOLD.md): type the answer, with supports that come in when a
// wrong answer or I'm stuck calls for them, and the card's full walk as the last rung. ?light=0 plays the old
// step-by-step way instead. (Distribute's typed Rounds 4 and 5 were already typed.)
const LIGHT = new URLSearchParams(location.search).get('light') !== '0';
const PLAY = {
  combineit: (level) => (level >= 5 ? (LIGHT ? bigLightPlay : bigPlay) : level === 4 ? (LIGHT ? combineIntegerLightPlay : integerPlay)
    : LIGHT ? lightPlay : combinePlay),
  flipit: (level) => (level >= 5 ? (LIGHT ? flipIntegerLightPlay : integerPlay) : LIGHT ? flipLightPlay : flipitPlay),
  lasso: LIGHT ? lassoLightPlay : lassoPlay,
  boxes: (level) => (level === 2 ? boxModelPlay : LIGHT ? boxLightPlay : boxPlay),   // Level 2 reads a model (no walk)
  'groups-of-terms': LIGHT ? termGroupLightPlay : termGroupPlay,
  value: valueLightPlay,
  'divide-it': (level) => (level === 1 ? divideNumericPlay : divideMovesPlay),   // Level 1 is numeric (no x)
  'add-both': (level) => (level === 1 ? addBothNumericPlay : addBothPlay),   // Level 1 is numeric (no x): "See why it works"
  'flip-everything': flipPlay,                                                   // (its Level 1, numbers only, is not built yet: Build J)
  'two-step-equations': twoStepPlay,                                             // the new Two-step card (Build K); `two-step` is the old one
  'distribute-solve': distSolvePlay,
  'variables-both-sides': bothSidesPlay,                                            // Variables on both sides (Build R)
  'distribute-more': distMorePlay,                                                  // Distribute more (Build U)
  'strange-solutions': strangePlay,                                                 // Strange solutions (Build V)
  'fractions-of-x': fractionsPlay,                                                  // Fractions of x (Build AA)
  'distribute-combine': (level) => (level >= 4 ? distributeTypedPlay : LIGHT ? distributeLightPlay : distributePlay),
};
const adapterFor = (packId, level) => (typeof PLAY[packId] === 'function' ? PLAY[packId](level) : PLAY[packId]);
const newSeed = () => Math.floor(Math.random() * 2 ** 32);
// Every problem knows which level it was played at, for the anonymous log. (Not `level`: a few packs read that to
// decide how a problem plays, such as whether it starts with Rewrite.)
const levelled = (problems, level) => problems.map((p) => ({ ...p, logLevel: level }));

// ?seed=123 replays a fixed set (handy for projecting the same problems to a
// class). ?level=2 (with or without a seed) opens that level directly.
const params = new URLSearchParams(location.search);
const urlSeed = Number(params.get('seed'));
const fixedSeed = Number.isInteger(urlSeed) && urlSeed > 0 ? urlSeed : null;
// ?choose=0 never asks "Start with help" or "Try with no help"; ?choose=1 asks on a test link too, where a seed would skip it (testers; Build AE)
const CHOOSE = ['0', '1'].includes(params.get('choose')) ? params.get('choose') : null;

// Progress and the level in play are saved under one key (SPEC §7). If
// storage is blocked, everything still works from memory for this visit.
// Combine it gained a level in the middle (the mixed party-or-battle round), so a level in play that was
// saved before that (no `layout`) means a different level now and isn't resumed. Boxes & Circles gained its
// "read the model" level (layout 3) the same way.
const SAVE_LAYOUT = 3;
const store = createStore('mat.v1');
// A safety net: if a save would ever lower the number of finished levels (it never should), the copy that was there is kept here.
const backupStore = createStore('mat.v1.backup');
const saved = store.load();
// (a save from before Build X has no `v: 2`: any legacy credit in it showed as finished, so it stays earned; credit from now on is placed)
let progress = normalizeProgress(saved, PACKS, { legacyEarned: Boolean(saved) && saved.v !== PROGRESS_VERSION });
let homeNote = null;

// Ask the browser not to clear this site's saved progress when it's short on space or the site hasn't been opened in a
// while (Safari does that after about a week). It may say no; nothing else changes either way.
try { navigator.storage?.persist?.(); } catch { /* not supported: nothing to do */ }

let play = null; // { pack, adapter, level, seed, problems, index, session, finished }

function saveProgress() {
  const current = play && !play.finished && !play.testOut      // (a test-out is never resumed: Build Z)
    ? { pack: play.pack.id, level: play.level, seed: play.seed, index: play.index, ...(play.placedFrom ? { placedFrom: play.placedFrom } : {}) }
    : null;
  try {
    const before = store.load();
    if (before && doneCount(normalizeProgress(before, PACKS)) > doneCount(progress)) backupStore.save(before);
  } catch { /* the check is only a safety net */ }
  store.save({ ...progress, current, layout: SAVE_LAYOUT });
}
function persist() {
  saveProgress();
  sync.request();            // soon, if signed in to a class sheet
}

// The class sheet (SPEC-SYNC.md): signed in, progress, problems and runs go to the teacher's sheet, and levels finished
// on another device come back.
const sync = createSync({
  load: loadSync, save: saveSync, loadInfo, saveInfo,
  getProgress: () => progress,
  setProgress: (p) => { progress = p; saveProgress(); if (!$('home').hidden) goHome({ keepView: true }); },
  getEvents: loadLog, getRuns: loadRuns, packs: PACKS,
  onChange: (status) => {
    const b = document.querySelector('[data-home="account"]');
    if (b) b.textContent = accountLabel(status);
  },
});
// A class link in the address (?class=…) is remembered.
if (params.get('class')) sync.setEndpoint(params.get('class'));
else if (DEFAULT_CLASS && !sync.endpoint()) sync.setEndpoint(DEFAULT_CLASS);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync.request(); });
window.addEventListener('online', () => sync.request());
let nextTimer = null;

const matRoot = $('mat');
const feedback = $('feedback');
const hintLine = $('hint');

// The palette belongs to the pack, so it's rebuilt when the pack changes
// (on a fresh element, so old click handlers go with the old one).
let controls = null;
let controlsFor = null;
function useControls(adapter) {
  if (controlsFor === adapter) return;
  const old = $('controls');
  const fresh = old.cloneNode(false);
  old.replaceWith(fresh);
  controls = adapter.buildControls(fresh, dispatch);
  controlsFor = adapter;
}

// Some packs' Mats are dragged rather than tapped (Boxes & Circles), so they
// bring their own pointer listeners, bound once on the Mat's container.
let matBoundFor = null;
let unbindMat = null;
function useMat(adapter) {
  if (matBoundFor === adapter) return;
  unbindMat?.();
  unbindMat = adapter.bindMat ? adapter.bindMat(matRoot, dispatch, () => play?.session) : null;
  matBoundFor = adapter;
}

// The fluency challenge or the diagnostic, while one is on the screen: { kind, view, timer?, state, ... }.
let quiz = null;
function endQuiz() {
  if (!quiz) return;
  clearInterval(quiz.timer);
  quiz.view.destroy();
  quiz = null;
}

function showScreen(name) {
  $('home').hidden = name !== 'home';
  $('play').hidden = name !== 'play';
  $('quiz').hidden = name !== 'quiz';
  window.scrollTo(0, 0);
}

// Save codes are hidden from students (Karl, 2026-10-19: Chromebooks remember progress and Google sign-in is the backup). The code
// itself still works: ?codes=1 brings back Save code and Enter code, for a teacher moving a student by hand.
const CODES = params.get('codes') === '1';
$('save-code').hidden = !CODES;
const STORAGE_NOTE = CODES ? 'Progress won’t be remembered on this device. Use Save code to keep it.' : 'Progress won’t be remembered on this device. Sign in to keep it.';

function diagStatus(section) {
  const d = loadDiag(section);
  return { status: !d ? 'none' : d.done ? 'done' : d.index > 0 ? 'partial' : 'none', index: d?.index ?? 0, total: totalOf(section) };
}

// The home screen is always the three big panels (and the top menu): no section is remembered or left open (Karl, 2026-10-08).
try { localStorage.removeItem('mat.section.v1'); } catch { /* storage blocked */ }

// What the student saw on the menu last time (engine/status.js): anything that improved since shines once. Fails quietly.
const loadSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY)); } catch { return null; } };
const saveSeen = (seen) => { try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch { /* storage blocked */ } };

function goHome({ keepView = false, openCard = null } = {}) {
  endTour();
  endDragDemo();
  endQuiz();
  endTestOut();
  clearTimeout(nextTimer);
  play = null;
  persist();
  const runs = loadRuns();
  const now = Date.now();
  const seenNow = snapshot(progress, PACKS, SECTIONS);
  const shine = changesSince(loadSeen(), seenNow, PACKS);
  saveSeen(seenNow);
  renderPackMap($('home'), progress, PACKS, {
    shine,
    keepView,
    sections: SECTIONS,
    diags: Object.fromEntries(DIAGNOSTIC_SECTIONS.map((id) => [id, diagStatus(id)])),
    bests: Object.fromEntries(CHALLENGES.map((c) => [c.id, bestScore(runs, c.id, 'all', now)])),
    onDiagnostic: (id) => startDiagnostic(id),
    onFluency: startFluency,
    onPlay: (packId, level) => openLevel(packId, level),
    onTestOut: offerTestOut,
    canTry: (packId, level) => canTestOut(progress, packById(packId), level, SECTIONS),
    openCard,
    onSaveCode: CODES ? () => showSaveCode(encodeProgress(progress)) : null,
    onEnterCode: CODES ? () => askForCode(restoreFromCode) : null,
    onAccount: () => showAccount(sync, () => { if (!$('home').hidden) goHome({ keepView: true }); }),
    account: sync.status(),
    note: homeNote ?? (store.available ? null : STORAGE_NOTE),
    noteWarm: Boolean(homeNote && openCard),                    // (a test-out passed: the warm message, big)
  });
  showScreen('home');
}

function restoreFromCode(text) {
  const restored = decodeProgress(text, PACKS);
  if (!restored) return false;
  progress = mergeProgress(progress, restored);
  homeNote = 'Code accepted — your levels are back.';
  goHome();
  homeNote = null;
  return true;
}

// resume = { seed, index } picks up a level after a reload.
function startLevel(packId, level, resume = null) {
  endTour();
  endDragDemo();
  endQuiz();
  endTestOut();
  clearTimeout(nextTimer);
  const pack = packById(packId);
  const adapter = adapterFor(pack.id, level);
  markStarted(pack.id, level);                     // (a level started with help is in progress: it opens with no chooser, Build AE)
  const seed = resume?.seed ?? fixedSeed ?? newSeed();
  const problems = levelled(pack.generate(level, seed), level);
  const flags = {};                 // things a card has shown the student in this level (Add to both sides: Trade places)
  let index = resume?.index ?? 0;
  // A placed level (by a no-help pass, the placement quiz or an older card's credit: Build X) needs one more problem to be earned, so it
  // opens on the level's last problem with the dots before it filled in silver (credited, not worked). Karl, 2026-11-07 (Build V2, Part A).
  const placedFrom = resume ? (Number.isInteger(resume.placedFrom) ? resume.placedFrom : 0)
    : placedOpening(progress, pack, level, problems.length, PROBLEMS_PER_LEVEL, SECTIONS);
  if (!resume && placedFrom) index = placedFrom;
  if (index >= problems.length) {          // a reload in the extra, move-only problem after a correct guess
    const extra = adapter.owesMove && forcedMoveOn(pack, level) ? extraProblem(pack, level, seed, problems) : null;
    if (extra) problems.push(extra); else index = 0;
  }
  play = {
    pack, adapter, level, seed, problems, index, flags, session: adapter.newSession(problems[index], { flags }), finished: false,
    practicing: false, streak: 0, best: bestFor(loadBests(), pack.id, level), placedFrom,
  };
  useControls(adapter);
  useMat(adapter);
  $('title').textContent = `${pack.title.toUpperCase()} · ${isWhyLevel(pack, level) ? WHY_LABEL : `Level ${levelNumber(pack, level)}`}`;
  // a card that links to another card's practice, near the level dots (Build M: Distribute, combine, solve opens Build it's Distribute,
  // then combine; only a link: that card is unchanged)
  $('practice').hidden = !pack.practice;
  if (pack.practice) $('practice').textContent = pack.practice.label;
  persist();
  showScreen('play');
  render();
}

// ---------- Fluency challenges and the diagnostic ----------

function startFluency(id) {
  endTour();
  endDragDemo();
  endQuiz();
  endTestOut();
  clearTimeout(nextTimer);
  play = null;
  let state = newFluency(id, newSeed());
  let previousBest = 0;
  const view = createFluencyView($('quiz'), {
    challenge: id,
    getRuns: loadRuns,
    onBack: goHome,
    onAction: (a) => send(a),
  });
  quiz = { kind: 'fluency', view, timer: null };
  const send = (a) => {
    const was = state.status;
    if (a.type === 'start') a = { ...a, seed: newSeed() };
    state = reduceFluency(state, { ...a, now: Date.now() });
    if (was !== 'playing' && state.status === 'playing') {
      previousBest = bestScore(loadRuns(), id, 'all', Date.now());
      clearInterval(quiz.timer);
      quiz.timer = setInterval(() => send({ type: 'tick' }), 100);
    }
    if (was === 'playing' && state.status === 'ended') {
      clearInterval(quiz.timer);
      saveRun({ c: id, s: state.correct, t: Date.now(), tier: state.topTier });
      sync.request();
    }
    view.render(state, { previousBest });
  };
  showScreen('quiz');
  view.render(state);
}

function startDiagnostic(section, retake = false) {
  endTour();
  endDragDemo();
  endQuiz();
  endTestOut();
  clearTimeout(nextTimer);
  play = null;
  if (retake) clearDiag(section);
  let state = loadDiag(section) ?? newDiagnostic(fixedSeed ?? newSeed(), section);   // (?seed= gives the same problems: a test link)
  const items = diagnosticItems(state.seed, section);
  const back = () => goHome();
  const finish = () => {
    const rows = readout(state.seed, state.answers, items, section);
    progress = applyReadout(progress, rows);
    persist();
    view.render(state, items, rows, 'I opened the levels you’re ready for. Start where it says, or pick any open level on the pack map.');
  };
  const view = createDiagnosticView($('quiz'), {
    onAction: (a) => {
      const next = reduceDiagnostic(state, a, items);
      if (next === state) return;
      const answered = next.answers.length !== state.answers.length;
      state = next;
      if (answered) saveDiag(state);
      if (state.done) finish(); else view.render(state, items);
    },
    onStop: back,
    onMap: back,
    onPlay: (packId, level) => openLevel(packId, level),
    onRetake: () => startDiagnostic(section, true),
  });
  quiz = { kind: 'diagnostic', view };
  showScreen('quiz');
  if (state.done) finish(); else view.render(state, items);
}

function dispatch(action) {
  if (!play || play.finished) return;
  if (play.testOut) return testOutDispatch(action);
  if (action.type === 'next') return nextProblem();
  const before = play.session;
  play.session = play.adapter.reduce(before, action);
  if (play.session !== before) render(before);
}

// ---------- Test out (Build Z): two problems of a locked level, with no help ----------
// play.testOut = { attempt, over: null | 'pass' | 'fail', timer }. The no-help switch is on for as long as the attempt is on screen.

const levelText = (pack, level) => `Level ${levelNumber(pack, level)}`;
const RESULT_WAIT = 1500;          // the check's Balanced or Not balanced stays on screen this long (any key or click goes on at once)

// The locked-level door (Build AE replaces Build Z's panel): "Try with no help" (2 problems) and Not now.
function offerTestOut(packId, level) {
  const pack = packById(packId);
  if (!canTestOut(progress, pack, level, SECTIONS)) return;
  const from = document.activeElement;
  askNoHelp({ levelText: levelText(pack, level), locked: true }, {
    onHelp: () => {},
    onTry: () => startTestOut(packId, level, 0),
    returnFocus: () => (from?.isConnected ? from : document.querySelector(`.card-view [data-try-level="${level}"]`)),
  });
}

// ---------- The no-help choice (Build AE): a fresh open level asks "Start with help" or "Try with no help" ----------
// Every way into a level comes here (the card page, the level popup, Next level, the placement quiz's Start, a link). A level that is in
// progress, placed or earned, a Count it or Build it level, and any link with a seed open as today (engine/testOut.js, chooserDue). The
// panel opens over the card page: from anywhere else the card page opens first. Escape or a tap outside leaves the student on the card.
function openLevel(packId, level) {
  const pack = packById(packId);
  const due = pack && chooserDue({ progress, pack, level, sections: SECTIONS, started: levelStarted(pack.id, level), choose: CHOOSE, fixedSeed });
  if (!due) return startLevel(packId, level);
  const onCard = !$('home').hidden && Boolean($('home').querySelector('.card-view'));
  const from = onCard ? document.activeElement : null;
  if (!onCard) goHome({ openCard: pack.id });
  askNoHelp({ levelText: levelText(pack, level) }, {
    onHelp: () => startLevel(packId, level),
    onTry: () => startTestOut(packId, level, 0, { open: true }),
    returnFocus: () => (from?.isConnected && from !== document.body ? from : document.querySelector(`.card-view .level-btn[data-level="${level}"]`)),
  });
}

function startTestOut(packId, level, attempt, { open = false } = {}) {
  endTour();
  endDragDemo();
  endQuiz();
  endTestOut();
  clearTimeout(nextTimer);
  const pack = packById(packId);
  const adapter = adapterFor(pack.id, level);
  const seed = testOutSeed(fixedSeed, attempt, newSeed);
  const problems = levelled(testOutProblems(pack, level, seed), level);
  const flags = ALL_TAUGHT();
  setNoHelp(true);
  holdRecords(true);
  closeFirst();                                     // (no "Find the value of x." pop-up either)
  $('play').classList.add('is-testout');
  play = {
    pack, adapter, level, seed, problems, index: 0, flags, finished: false, practicing: false, streak: 0, best: 0,
    session: quiet(adapter.newSession(problems[0], { flags, forceMove: false })),
    testOut: { attempt, over: null, timer: null, open, raw: null },
  };
  useControls(adapter);
  useMat(adapter);
  $('title').textContent = `${pack.title.toUpperCase()} · ${levelText(pack, level)}`;
  $('practice').hidden = true;
  persist();
  showScreen('play');
  render();
  drawTestOutBar();
}

function drawTestOutBar() {
  if (!play?.testOut) return;
  renderTestOutBar($('testout-bar'), {
    index: play.index, total: TEST_OUT_PROBLEMS, levelText: levelText(play.pack, play.level), over: play.testOut.over,
    onGiveUp: () => (play.testOut.open ? helpOn(play.testOut.raw ?? play.session) : endAttempt('fail', { gaveUp: true })),
  });
}

function endTestOut() {
  if (play?.testOut && !play.testOut.over) {
    logAttempt('fail');                                                   // left in the middle (← Packs): logged as a give-up
    if (play.testOut.open) markStarted(play.pack.id, play.level);         // (an open level is now in progress: no chooser next time)
  }
  flushAttempt(true);
  setNoHelp(false);
  holdRecords(false);
  $('play').classList.remove('is-testout');
  $('testout-bar').hidden = true;
  if (play?.testOut) { clearTimeout(play.testOut.timer); play.testOut.skip?.(); }
}

function testOutDispatch(action) {
  const t = play.testOut;
  if (t.over) { if (action.type === 'next' && t.over === 'pass') t.go?.(); return; }
  if (HELP_ACTIONS.has(action.type)) return;                                  // no I'm stuck, no Teach me
  if (action.type === 'next') {
    if (checkResult(play.session) !== 'right' || play.index + 1 >= play.problems.length) return;
    play.index += 1;
    play.session = quiet(play.adapter.newSession(play.problems[play.index], { flags: play.flags, forceMove: false }));
    play.fit = null;
    render();
    drawTestOutBar();
    return;
  }
  const before = play.session;
  const next = play.adapter.reduce(before, action);
  if (next === before) return;
  play.session = quiet(next);
  t.raw = next;                                                               // (what the card would show with help: Build AE's miss)
  render(before);
  const result = checkResult(play.session);
  if (result === 'wrong' && t.open) helpOn(next);                             // a miss on an open level: help comes on, same problem
  else if (result === 'wrong') endAttempt('fail', { typed: play.session.answers.at(-1)?.typed ?? null });
  else if (result === 'right' && play.index + 1 >= play.problems.length) endAttempt('pass');
}

// The attempt is over: its rows go to the class sheet with the attempt's word; a pass places the levels. The result shows after the check
// has been on screen a moment (a give-up at once).
function endAttempt(outcome, { typed = null, gaveUp = false } = {}) {
  const t = play.testOut;
  if (t.over) return;
  const { pack, level } = play;
  logAttempt(outcome);
  drawTestOutBar();
  const note = t.open ? openPassNote : passNote;
  const show = outcome === 'pass'
    ? () => { homeNote = note(levelText(pack, level)); goHome({ openCard: pack.id }); homeNote = null; }
    : () => showTestOutFail(typed);
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    clearTimeout(t.timer);
    window.removeEventListener('pointerdown', skip, true);
    window.removeEventListener('keydown', skip, true);
    if (play?.testOut === t) show();
  };
  const skip = (e) => { if (e?.target?.closest?.('#back')) return; e?.preventDefault?.(); e?.stopPropagation?.(); go(); };
  t.go = go;
  t.skip = () => { done = true; window.removeEventListener('pointerdown', skip, true); window.removeEventListener('keydown', skip, true); };
  if (gaveUp) return go();
  t.timer = setTimeout(go, RESULT_WAIT);
  setTimeout(() => { if (!done) { window.addEventListener('pointerdown', skip, true); window.addEventListener('keydown', skip, true); } }, 0);
}

// The attempt's rows (each problem's usual record, the attempt's word in its supports) and, for a pass, the placed levels.
function logAttempt(outcome) {
  const t = play.testOut;
  const { pack, level } = play;
  t.over = outcome;
  const entries = [...heldRecords()];
  if (outcome === 'fail' && checkResult(play.session) !== 'right') {
    entries.push({ session: play.session, meta: { t: Date.now(), pack: pack.id, level, problem: play.adapter.format?.(play.session.problem) ?? '' } });
  }
  holdRecords(false);
  appendRecords(attemptRecords(entries, outcome === 'pass' ? PASS_WORD : FAIL_WORD));
  if (outcome === 'pass' && !pack.comingSoon && !pack.hidden) progress = passCredit(progress, pack.id, level);
  persist();
}

// A miss or Give up on a level that was open (Build AE): the attempt stops being one. Help comes on and the same problem carries on, with the
// usual path after a wrong value (the check's Not balanced, Undo, the hint); the problems already solved count on the level as usual (the
// level's five problems, from the same seed: the attempt's two are its first two). The attempt's rows stay held until this problem ends
// (solved, or left), then go to the class sheet with `test-out-fail`; the rest of the level logs as any level does.
function helpOn(session) {
  const { pack, level } = play;
  const t = play.testOut;
  if (!t || t.over) return;
  t.over = 'help';
  clearTimeout(t.timer);
  setNoHelp(false);
  $('play').classList.remove('is-testout');
  $('testout-bar').hidden = true;
  play.testOut = null;
  play.attemptTail = true;
  play.problems = levelled(pack.generate(level, play.seed), level);
  play.flags = { model: true };                     // (the model never draws itself here: the help ladder still has it)
  play.best = bestFor(loadBests(), pack.id, level);
  play.session = session;
  markStarted(pack.id, level);
  persist();
  render();
}
function flushAttempt(includeCurrent) {
  if (!play?.attemptTail) return;
  play.attemptTail = false;
  const entries = [...heldRecords()];
  if (includeCurrent && play.session && play.session.step !== 'done' && play.session.stage !== 'done') {
    entries.push({ session: play.session, meta: { t: Date.now(), pack: play.pack.id, level: play.level, problem: play.adapter.format?.(play.session.problem) ?? '' } });
  }
  holdRecords(false);
  appendRecords(attemptRecords(entries, FAIL_WORD));
}

function showTestOutFail(typed) {
  const { pack, level } = play;
  const t = play.testOut;
  play.finished = true;
  controls.update({ ...play.session, step: 'levelDone' }, null);
  hintLine.hidden = true;
  feedback.textContent = '';
  const to = suggestedLevel(progress, pack, level);
  renderTestOutFail(matRoot, {
    suggestText: levelText(pack, to),
    typed: typed === null ? null : String(typed).replace('-', '−'),
    onSuggested: () => startLevel(pack.id, to),
    onRetry: () => startTestOut(pack.id, level, t.attempt + 1),
    onMap: () => goHome({ openCard: pack.id }),
  });
}

// The standing browser tests (tests/screenSweep.test.js) drive the dev server's page with the card's own actions: only in development
if (import.meta.env?.DEV) {
  window.__mat = { dispatch: (a) => dispatch(a), session: () => play?.session, adapter: () => play?.adapter, nextMove: () => nextMove(play.session, { grab: play.adapter.grab !== false }) };
}

// A card can owe a move problem (Add to both sides: a correct guess forces the next problem to be solved with a move, and if that
// was the last problem of the level, one more is added). The extra problem is one the level didn't already have.
function extraProblem(pack, level, seed, used) {
  for (let k = 1; k <= 20; k++) {
    const fresh = levelled(pack.generate(level, (seed + 1000 * k) >>> 0), level).find((c) => !used.some((u) => u.x === c.x));
    if (fresh) return fresh;
  }
  return null;
}

function nextProblem() {
  clearTimeout(nextTimer);
  const owed = forcedMoveOn(play.pack, play.level) && Boolean(play.adapter.owesMove?.(play.session));   // (not on a level that lists it off: Build AC)
  if (play.index + 1 >= play.problems.length) {
    // (a placed level's one problem is never followed by another, even after a correct guess: Build V2, Part A)
    const extra = owed && !play.placedFrom && play.problems.length === PROBLEMS_PER_LEVEL ? extraProblem(play.pack, play.level, play.seed, play.problems) : null;
    if (extra) play.problems.push(extra);
    else {
      if (!play.practicing) return finishLevel();
      play.seed = newSeed();                // practice goes on with a fresh set, for as long as the student likes
      play.problems = levelled(play.pack.generate(play.level, play.seed), play.level);
      play.index = -1;
    }
  }
  play.index += 1;
  play.session = play.adapter.newSession(play.problems[play.index], { forceMove: owed, flags: play.flags });
  play.fit = null;
  persist();
  render();
}

function finishLevel() {
  const { pack, level } = play;
  // (a level finished on an old card counts on its new card straight away, not only at the next load: Build K)
  if (!pack.comingSoon && !pack.hidden) progress = withLegacyCredit(completeLevel(progress, pack.id, level)); // a round opened from a link isn't saved yet
  play.finished = true;
  persist();
  render();
  feedback.textContent = '';
  renderLevelDone(matRoot, {
    pack, level,
    packComplete: !pack.hidden && isPackComplete(progress, pack.id),
    nextPack: pack.hidden ? undefined : PACKS[PACKS.indexOf(pack) + 1],
    best: play.best,
    onNext: () => openLevel(pack.id, level + 1),
    onMap: goHome,
    onPractice: startPractice,
  });
}

// "Keep practicing": the same level, as many problems as the student likes (fresh sets, the streak going), with a
// Next level button in the header the whole time.
function startPractice() {
  play.practicing = true;
  play.placedFrom = 0;
  play.finished = false;
  play.seed = newSeed();
  play.problems = levelled(play.pack.generate(play.level, play.seed), play.level);
  play.index = 0;
  play.session = play.adapter.newSession(play.problems[0], { flags: play.flags });
  play.fit = null;
  persist();
  render();
}

// The header's streak and Next level button. A streak is problems in a row with no wrong typed answer; only the
// modes that type the answer have one.
function renderStreak() {
  const { session, streak, best, practicing, pack, level } = play;
  const has = session && 'clean' in session && !play.adapter.noStreak;
  $('streak').hidden = !has;
  if (has) {
    $('streak').textContent = `Streak ${streak} · Best ${Math.max(best, streak)}`;
    $('streak').setAttribute('aria-label', `Streak ${streak}, best ${Math.max(best, streak)}`);
  }
  $('dots').hidden = practicing;
  $('next-level').hidden = !(practicing && level < lastLevelOf(pack) && isLevelUnlocked(progress, pack.id, level + 1));
}

// The step bar is the pack's (and, in Group It, the problem's) list of steps.
function renderSteps(session) {
  const steps = play.adapter.steps(session);
  const bar = $('steps');
  bar.hidden = Boolean(play.adapter.noSteps);        // the light-build cards have no steps bar
  const phase = play.adapter.phaseLabel?.(session); // a pack that runs in phases names the one in play
  if (phase) bar.dataset.phase = phase; else delete bar.dataset.phase;
  const labels = steps.map((x) => x.label).join('|');
  if (bar.dataset.labels !== labels) {
    bar.replaceChildren(...steps.map((x, i) => {
      const li = document.createElement('li');
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = String(i + 1);
      li.append(num, ` ${x.label}`);
      return li;
    }));
    bar.dataset.labels = labels;
  }
  const ids = steps.map((x) => x.id);
  const current = ids.indexOf(session.step);
  bar.querySelectorAll('li').forEach((li, i) => {
    const step = ids[i];
    const done = session.step === 'done' || i < current || session.skipped.includes(step);
    li.classList.toggle('done', done);
    li.classList.toggle('current', !done && i === current);
    if (!done && i === current) li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
  });
}

function renderDots() {
  const { index, session, finished } = play;
  const dots = $('dots');
  while (dots.children.length < play.problems.length) dots.append(Object.assign(document.createElement('span'), { className: 'dot' }));
  while (dots.children.length > play.problems.length && (play.testOut || dots.children.length > PROBLEMS_PER_LEVEL)) dots.lastElementChild.remove();   // (a test-out has 2)
  $('dots').querySelectorAll('.dot').forEach((d, i) => {
    const solved = finished || i < index || (i === index && session.step === 'done');
    const credited = i < (play.placedFrom ?? 0);       // (a placed level's credited problems: silver, Build V2 Part A)
    d.classList.toggle('done', solved && !credited);
    d.classList.toggle('placed', credited);
    d.classList.toggle('current', !solved && i === index);
  });
  $('dots').setAttribute('aria-label', `Problem ${Math.min(index + 1, play.problems.length)} of ${play.problems.length}`);
}

// On a phone the Mat is scaled to the screen's width, and a drawing built for a wide screen has a lot of empty space
// at its sides, so the problem comes out small. Crop the drawing's width to what's in it (never shrinking again within
// one problem, so it doesn't zoom back and forth as the student works).
const phoneWidth = () => window.matchMedia('(max-width: 600px)').matches || window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches;
function fitMatToPhone(svg) {
  if (!svg || !phoneWidth() || !svg.viewBox?.baseVal?.width) return;
  const vb = svg.viewBox.baseVal;
  let box;
  try { box = svg.getBBox(); } catch { return; }
  if (!box.width) return;
  const PAD = 14;
  const fit = play.fit = {
    x0: Math.min(play.fit?.x0 ?? Infinity, box.x - PAD),
    x1: Math.max(play.fit?.x1 ?? -Infinity, box.x + box.width + PAD),
  };
  const x0 = Math.max(vb.x, fit.x0);
  const x1 = Math.min(vb.x + vb.width, fit.x1);
  if (x1 - x0 < 200 || x1 - x0 >= vb.width) return;
  svg.setAttribute('viewBox', `${x0} ${vb.y} ${x1 - x0} ${vb.height}`);
}

// A new window size: a Solve it card's text size is chosen again for the new room (Build S)
let resized = null;
window.addEventListener('resize', () => {
  clearTimeout(resized);
  resized = setTimeout(() => { if (play?.adapter?.keepRows && !play.finished && !document.getElementById('play').hidden) render(); }, 150);
});

// Turning the phone: the Mat was cropped (or not) for the old shape, so draw it again for the new one.
window.matchMedia('(orientation: portrait)').addEventListener('change', () => {
  if (!play || play.finished || document.getElementById('play').hidden) return;
  play.fit = null;
  matRoot.replaceChildren(play.adapter.renderMat(play.session, {}));
  fitMatToPhone(matRoot.firstElementChild);
});

// The light design (Build D, Part 1): keyboard first, the keypad only when needed; the header fades to a thin strip.
// On a device with a physical keyboard the number pad is gone and the student types straight into the fields; on a touch screen with
// no keyboard a compact keypad pops up only while a field is in use (the adapter's `padOpen`), and goes on Check and Next.
let inputMode = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(hover: hover)').matches ? 'touch' : 'keys';
document.body.dataset.input = inputMode;
// (on the window, registered before any card's keys: a card that takes the digit stops it there, and the keypad must still go; Build N)
window.addEventListener('keydown', (e) => {
  if (inputMode !== 'keys' && /^[0-9]$/.test(e.key)) { inputMode = 'keys'; document.body.dataset.input = inputMode; }
}, true);
// The header and the level dots show at the start of each problem for about 3 seconds, then fade to a thin strip; the pointer at the
// top of the screen (or the keyboard in the header) brings them back.
let headerTimer = null;
let headerHover = false;
function showHeader() {
  clearTimeout(headerTimer);
  $('play').classList.add('hdr-show');
  headerTimer = setTimeout(() => { if (!headerHover) $('play').classList.remove('hdr-show'); headerTimer = null; }, 3000);
}
document.addEventListener('mousemove', (e) => {
  if (!play?.adapter?.lightDesign) return;
  const bar = document.querySelector('#play .topbar');
  const near = e.clientY < 28 || (headerHover && bar && e.clientY < bar.getBoundingClientRect().bottom + 12);
  if (near === headerHover) return;
  headerHover = near;
  if (near) $('play').classList.add('hdr-show');
  else if (!headerTimer) $('play').classList.remove('hdr-show');
});
let shownFor = null;

function render(before) {
  const { session, finished } = play;
  const { adapter } = play;
  $('play').classList.toggle('is-light', Boolean(adapter.lightDesign));
  if (adapter.lightDesign) {
    $('play').dataset.pad = !finished && adapter.padOpen?.(session) ? 'open' : 'closed';
    if (shownFor !== session.problem) { shownFor = session.problem; showHeader(); }     // a new problem: the header shows for a moment
  }
  const fx = adapter.effects(before, session);
  // A problem just finished: the streak grows with a clean answer and goes back to zero after any other.
  if (session.step === 'done' && before && before.step !== 'done' && 'clean' in session && !adapter.noStreak) {
    play.streak = afterAnswer(play.streak, session);
    if (play.streak > play.best) play.best = saveBest(play.pack.id, play.level, play.streak);
  }
  renderSteps(session);
  renderDots();
  renderStreak();
  controls.update(finished ? { ...session, step: 'levelDone' } : session, fx.hint);
  hintLine.hidden = finished || !fx.hint;
  if (finished) return;

  // (a Solve it card keeps the rows already on screen, so a redraw never replays their animations, and its text size is chosen once a
  // problem, from the problem's worst case, so it never changes while the student works: Build S)
  if (adapter.keepRows) {
    const sized = `${play.pack.id}|${play.level}|${play.seed}|${play.index}|${window.innerWidth}x${window.innerHeight}`;
    if (play.sized !== sized) { play.sized = sized; chooseSize(matRoot, adapter, session); }
    redrawMat(matRoot, adapter.renderMat(session, fx));
  } else {
    matRoot.style.removeProperty('--eq-size');
    matRoot.style.removeProperty('--work-size');
    matRoot.replaceChildren(adapter.renderMat(session, fx));
  }
  fitMatToPhone(matRoot.firstElementChild);
  hintLine.textContent = fx.hint ? `Hint: ${adapter.feedbackText(fx.hint)}` : '';
  feedback.textContent = adapter.feedbackText(session.feedback);
  feedback.hidden = Boolean(adapter.lineInMat);       // the line is on the Mat, above the equation, on the light-build cards
  // restart the shake/celebrate animation on repeated messages
  feedback.classList.remove('bad', 'celebrate');
  void feedback.offsetWidth;
  if (session.feedback?.bad) feedback.classList.add('bad');
  if (session.step === 'done') feedback.classList.add('celebrate');

  if (session.step === 'done' && before?.step !== 'done' && !play.testOut) earnPlaced(session);
  if (session.step === 'done' && before?.step !== 'done' && play.attemptTail) flushAttempt(false);   // (the miss's problem ended: Build AE)
  if (session.step === 'done' && before?.step !== 'done' && !adapter.noAuto) {
    nextTimer = setTimeout(nextProblem, 2500);
  }
}

// A placed level (credited by the placement quiz or an older card, Build X) is earned by one problem of it finished on the card with at
// most a reminder: no Teach me, no picture, no guided step, no move offered (the class-sheet words `hint` and `crossoff` only). A short note
// says so; the level goes on as usual.
const MINIMAL_SUPPORT = ['hint', 'crossoff'];
const minimalSupport = (s) => !(s.taught > 0) && (s.supportsShown ?? []).every((w) => MINIMAL_SUPPORT.includes(w));
function earnPlaced(session) {
  const { pack, level } = play;
  if (play.placedFrom) return;                      // (opened on its last problem: finishing it earns the level, Build V2 Part A)
  if (pack.comingSoon || pack.hidden || !isLevelPlaced(progress, pack.id, level) || !minimalSupport(session)) return;
  progress = completeLevel(progress, pack.id, level);
  persist();
  const note = $('earned-note');
  if (!note) return;
  note.textContent = `Level ${levelNumber(pack, level)} earned!`;
  note.hidden = false;
  clearTimeout(earnPlaced.timer);
  earnPlaced.timer = setTimeout(() => { note.hidden = true; }, 3500);
}

// a key or a click first finishes a flip's cross-off still playing, then does what it does (Build Q, Part 5)
for (const type of ['keydown', 'pointerdown']) document.addEventListener(type, () => { finishFlips(matRoot); finishRewrites(matRoot); }, true);

matRoot.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action]');
  if (!t || !play) return;
  const action = play.adapter.matAction(t.dataset);
  if (action) dispatch(action);
});

// Keyboard: type numbers (top row or number pad), Backspace, "-" for the sign,
// and Enter to Check, the same as tapping the pad. Both packs' palettes use the
// same buttons, so this drives whichever is showing (and respects what's disabled).
document.addEventListener('keydown', (e) => {
  if (!play || play.finished || e.ctrlKey || e.metaKey || e.altKey) return;
  if ($('play').hidden || $('dialog').open) return;
  const t = e.target;
  if (t instanceof HTMLElement) {
    if (t.matches('input, textarea, select, [contenteditable]')) return;
    // A focused button elsewhere (Packs, Save code) keeps its own Enter.
    if (t.matches('button, a') && !t.closest('#controls')) return;
  }
  // The first button that exists wins. A button can also name its own key with
  // data-key (a letter, or Backspace), which is how a pack's palette gets quick keys.
  const candidates = [];
  const letter = /^[a-z]$/i.test(e.key);
  if (/^[0-9]$/.test(e.key)) candidates.push(`.pad button[data-digit="${e.key}"]`);
  else if (e.key === 'Backspace' || e.key === 'Delete') candidates.push('.pad button[data-action="backspace"]', 'button[data-key="Backspace"]');
  else if (e.key === '-' || e.key === '−') candidates.push('.pad button[data-action="toggleSign"]', '.pad button[data-key="-"]', 'button[data-key="-"]');
  else if (e.key === '+') candidates.push('.pad button[data-key="+"]', 'button[data-key="+"]');
  else if (e.key === 'Enter' && !e.repeat) // Enter moves forward through anything: Check, a green Next (of any kind), or Go once an amount is in
    candidates.push('button[data-action="check"]', 'button[data-action="next"]', 'button[data-action="nextLine"]', 'button[data-action="foldNext"]', '[data-x][data-action="placeValue"]', 'button[data-action="quizNext"]', 'button[data-action="wtNext"]', 'button[data-action="go"]');
  else if (letter) candidates.push(`button[data-key="${e.key.toLowerCase()}"]`);
  if (!candidates.length) return;
  // Of the buttons that exist, the first enabled one wins (Backspace is the
  // pad's delete while typing and Undo otherwise).
  // (The Mat has keys of its own too: Party! and Battle! under the words that call for them.)
  const found = candidates.flatMap((sel) => [...$('controls').querySelectorAll(sel), ...matRoot.querySelectorAll(sel)]);
  const b = found.find((x) => !x.disabled) ?? found[0];
  if (!b && letter) return; // a letter nothing uses: leave it alone
  e.preventDefault(); // a focused pad button shouldn't also press itself
  if (b && !b.disabled) b.click();
});

$('back').addEventListener('click', goHome);
$('next-level').addEventListener('click', () => openLevel(play.pack.id, play.level + 1));
$('practice').addEventListener('click', () => { const to = play?.pack.practice?.pack; if (to) startLevel(to, nextLevel(progress, to) ?? 1); });
$('save-code').addEventListener('click', () => showSaveCode(encodeProgress(progress)));

// A saved level in play, if it still makes sense to resume.
function savedCurrent() {
  const c = saved?.current;
  if (!c || typeof c !== 'object') return null;
  if (c.pack === 'combineit' && !(saved.layout >= 2)) return null;
  if (c.pack === 'boxes' && !(saved.layout >= 3)) return null;
  const pack = packById(c.pack);
  const ok = pack && !pack.comingSoon && !pack.retired && isLevelUnlocked(progress, pack.id, c.level)
    && Number.isInteger(c.seed) && c.seed >= 0
    && Number.isInteger(c.index) && c.index >= 0 && c.index <= PROBLEMS_PER_LEVEL;
  return ok ? c : null;
}

// ?level=N opens a Flip It level; ?pack=groupit&level=N opens a Group It level
// (?pack=lasso, its id from before the rename, still works); ?pack=boxes&level=N
// opens a Boxes & Circles level.
// A placement saved before Build L opens the new Two-step levels it showed the student knows (Build M, Part 1): once, when the device
// loads it. It only opens levels; nothing is credited, and the result is then saved as today's.
if (params.get('olddiag') === 'solve' && Number.isInteger(urlSeed) && urlSeed >= 0 && !loadDiag('solve')) {
  const items = diagnosticItems(urlSeed, 'solve');
  saveOldPlacement('solve', urlSeed, items.map((it) => (it.pack === 'two-step' ? { typed: itemAnswer(it).replace(/ /g, '').replace(/−/g, '-'), skipped: false } : { typed: '', skipped: true })));
}
for (const section of DIAGNOSTIC_SECTIONS) {
  const d = loadDiag(section);
  if (!d?.legacy) continue;
  progress = upgradePlacement(progress, readout(d.seed, d.answers, diagnosticItems(d.seed, section), section));
  saveDiag({ ...d, legacy: false });
  persist();
}
// Testing only (Build X): ?demo=… puts this device in a fixed progress state for the test-links page (engine/demo.js). It is merged in,
// so it never lowers what a device has; the test-links buttons start a fresh student first. ?menu=1 opens the home screen.
// It is applied once per device (a reload of the same link does not put it back, so the shine and "New levels added!" can be seen to go).
const demoApplied = () => { try { return localStorage.getItem('mat.demo.v1'); } catch { return null; } };
if (params.get('demo') && demoProgress(params.get('demo'), PACKS) && demoApplied() !== params.get('demo')) {
  const seen = demoSeen(params.get('demo'), PACKS, SECTIONS);
  if (seen) saveSeen(seen);
  progress = mergeProgress(progress, demoProgress(params.get('demo'), PACKS));
  try { localStorage.setItem('mat.demo.v1', params.get('demo')); } catch { /* storage blocked: applied each load */ }
  persist();
}
sync.request();   // signed in to a class sheet? catch up
const urlLevel = Number(params.get('level'));
const askedPack = packById(params.get('pack') === 'groupit' ? 'lasso' : params.get('pack') ?? 'flipit');
// A link to a retired card (Build AA) opens the card that replaced it, at its first level, with a short note: One-step equations →
// Fractions of x; Switch sides and the old Two-step → Two-step equations. It never crashes on a card that is gone.
const MOVED = { 'one-step': 'fractions-of-x', switch: 'two-step-equations', 'two-step': 'two-step-equations' };
const movedTo = askedPack?.retired && MOVED[askedPack.id] ? packById(MOVED[askedPack.id]) : null;
const urlPack = movedTo ?? askedPack;
const resume = savedCurrent();
if (DIAGNOSTIC_SECTIONS.includes(params.get('diag'))) {
  startDiagnostic(params.get('diag'));                // ?diag=solve opens a section's diagnostic (a test link, Build L)
} else if (movedTo) {
  startLevel(movedTo.id, movedTo.firstLevel ?? 1);
  showMovedNote();
} else if (urlPack && PLAY[urlPack.id] && Number.isInteger(urlLevel) && urlLevel >= 1 && urlLevel <= lastLevelOf(urlPack)) {
  openLevel(urlPack.id, urlLevel);
} else if (resume && !params.get('menu')) {
  startLevel(resume.pack, resume.level, resume);
} else {
  goHome();
}

// The note for a link to a retired card (Build AA): a small pop-up at the top of the play screen; it goes with the first click or key.
function showMovedNote() {
  const note = document.createElement('div');
  note.className = 'moved-note';
  note.setAttribute('role', 'status');
  note.textContent = 'That set has moved. Here is the new one.';
  document.body.append(note);
  const off = () => { note.remove(); window.removeEventListener('pointerdown', off, true); window.removeEventListener('keydown', off, true); };
  setTimeout(() => { window.addEventListener('pointerdown', off, true); window.addEventListener('keydown', off, true); }, 300);
}

// Sign in at the start of every visit (Karl, 2026-10-12). A student who signed in before has this device's token and is signed in
// silently, so only a signed-out student sees this. "Not now" skips it; it asks again next visit. It opens at once from what this
// device remembers about the class sheet (the sheet is asked again behind it), and Google's button is fetched ahead of time.
// (?nosignin=1 skips it for testing.) Offline, there is nothing to sign in to, so it stays quiet.
if (!params.get('nosignin') && sync.status().state === 'signed-out' && navigator.onLine !== false) {
  if (loadInfo(sync.endpoint())?.google) loadGoogle().catch(() => {});
  showAccount(sync, () => { if (!$('home').hidden) goHome({ keepView: true }); }, { prompt: true });
}
