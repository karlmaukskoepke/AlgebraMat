import './style.css';
import { PROBLEMS_PER_LEVEL } from './engine/generate.js';
import {
  completeLevel, isPackComplete, isLevelUnlocked, normalizeProgress, mergeProgress,
  encodeProgress, decodeProgress,
} from './engine/progress.js';
import { createStore } from './storage.js';
import { PACKS, packById } from './packs/index.js';
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
import { boxPlay } from './play/boxPlay.js';
import { afterAnswer } from './engine/streak.js';
import { loadBests, saveBest } from './lightStore.js';
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
  diagnosticItems, newDiagnostic, reduceDiagnostic, readout, applyReadout, TOTAL as DIAG_TOTAL,
} from './engine/diagnostic.js';
import { createDiagnosticView } from './view/diagnostic.js';
import { loadDiag, saveDiag, clearDiag } from './diagStore.js';

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

// Progress and the level in play are saved under one key (SPEC §7). If
// storage is blocked, everything still works from memory for this visit.
// Combine it gained a level in the middle (the mixed party-or-battle round), so a level in play that was
// saved before that (no `layout`) means a different level now and isn't resumed. Boxes & Circles gained its
// "read the model" level (layout 3) the same way.
const SAVE_LAYOUT = 3;
const store = createStore('mat.v1');
const saved = store.load();
let progress = normalizeProgress(saved, PACKS);
let homeNote = null;

// Ask the browser not to clear this site's saved progress when it's short on space or the site hasn't been opened in a
// while (Safari does that after about a week). It may say no; nothing else changes either way.
try { navigator.storage?.persist?.(); } catch { /* not supported: nothing to do */ }

let play = null; // { pack, adapter, level, seed, problems, index, session, finished }

function persist() {
  const current = play && !play.finished
    ? { pack: play.pack.id, level: play.level, seed: play.seed, index: play.index }
    : null;
  store.save({ ...progress, current, layout: SAVE_LAYOUT });
}
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

const STORAGE_NOTE = 'Progress won’t be remembered on this device. Use Save code to keep it.';

function diagStatus() {
  const d = loadDiag();
  return { status: !d ? 'none' : d.done ? 'done' : d.index > 0 ? 'partial' : 'none', index: d?.index ?? 0, total: DIAG_TOTAL };
}

function goHome() {
  endTour();
  endDragDemo();
  endQuiz();
  clearTimeout(nextTimer);
  play = null;
  persist();
  const runs = loadRuns();
  const now = Date.now();
  renderPackMap($('home'), progress, PACKS, {
    diag: diagStatus(),
    bests: Object.fromEntries(CHALLENGES.map((c) => [c.id, bestScore(runs, c.id, 'all', now)])),
    onDiagnostic: () => startDiagnostic(),
    onFluency: startFluency,
    onPlay: startLevel,
    onSaveCode: () => showSaveCode(encodeProgress(progress)),
    onEnterCode: () => askForCode(restoreFromCode),
    note: homeNote ?? (store.available ? null : STORAGE_NOTE),
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
  clearTimeout(nextTimer);
  const pack = packById(packId);
  const adapter = adapterFor(pack.id, level);
  const seed = resume?.seed ?? fixedSeed ?? newSeed();
  const problems = levelled(pack.generate(level, seed), level);
  const index = resume?.index ?? 0;
  play = {
    pack, adapter, level, seed, problems, index, session: adapter.newSession(problems[index]), finished: false,
    practicing: false, streak: 0, best: bestFor(loadBests(), pack.id, level),
  };
  useControls(adapter);
  useMat(adapter);
  $('title').textContent = `${pack.title.toUpperCase()} · Level ${level}`;
  persist();
  showScreen('play');
  render();
}

// ---------- Fluency challenges and the diagnostic ----------

function startFluency(id) {
  endTour();
  endDragDemo();
  endQuiz();
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
    }
    view.render(state, { previousBest });
  };
  showScreen('quiz');
  view.render(state);
}

function startDiagnostic(retake = false) {
  endTour();
  endDragDemo();
  endQuiz();
  clearTimeout(nextTimer);
  play = null;
  if (retake) clearDiag();
  let state = loadDiag() ?? newDiagnostic(newSeed());
  const items = diagnosticItems(state.seed);
  const finish = () => {
    const rows = readout(state.seed, state.answers, items);
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
    onStop: goHome,
    onMap: goHome,
    onPlay: startLevel,
    onRetake: () => startDiagnostic(true),
  });
  quiz = { kind: 'diagnostic', view };
  showScreen('quiz');
  if (state.done) finish(); else view.render(state, items);
}

function dispatch(action) {
  if (!play || play.finished) return;
  if (action.type === 'next') return nextProblem();
  const before = play.session;
  play.session = play.adapter.reduce(before, action);
  if (play.session !== before) render(before);
}

function nextProblem() {
  clearTimeout(nextTimer);
  if (play.index + 1 >= PROBLEMS_PER_LEVEL) {
    if (!play.practicing) return finishLevel();
    play.seed = newSeed();                // practice goes on with a fresh set, for as long as the student likes
    play.problems = levelled(play.pack.generate(play.level, play.seed), play.level);
    play.index = -1;
  }
  play.index += 1;
  play.session = play.adapter.newSession(play.problems[play.index]);
  play.fit = null;
  persist();
  render();
}

function finishLevel() {
  const { pack, level } = play;
  if (!pack.comingSoon) progress = completeLevel(progress, pack.id, level); // a round opened from a link isn't saved yet
  play.finished = true;
  persist();
  render();
  feedback.textContent = '';
  renderLevelDone(matRoot, {
    pack, level,
    packComplete: isPackComplete(progress, pack.id),
    nextPack: PACKS[PACKS.indexOf(pack) + 1],
    best: play.best,
    onNext: () => startLevel(pack.id, level + 1),
    onMap: goHome,
    onPractice: startPractice,
  });
}

// "Keep practicing": the same level, as many problems as the student likes (fresh sets, the streak going), with a
// Next level button in the header the whole time.
function startPractice() {
  play.practicing = true;
  play.finished = false;
  play.seed = newSeed();
  play.problems = levelled(play.pack.generate(play.level, play.seed), play.level);
  play.index = 0;
  play.session = play.adapter.newSession(play.problems[0]);
  play.fit = null;
  persist();
  render();
}

// The header's streak and Next level button. A streak is problems in a row with no wrong typed answer; only the
// modes that type the answer have one.
function renderStreak() {
  const { session, streak, best, practicing, pack, level } = play;
  const has = session && 'clean' in session;
  $('streak').hidden = !has;
  if (has) {
    $('streak').textContent = `Streak ${streak} · Best ${Math.max(best, streak)}`;
    $('streak').setAttribute('aria-label', `Streak ${streak}, best ${Math.max(best, streak)}`);
  }
  $('dots').hidden = practicing;
  $('next-level').hidden = !(practicing && level < pack.levels && isLevelUnlocked(progress, pack.id, level + 1));
}

// The step bar is the pack's (and, in Group It, the problem's) list of steps.
function renderSteps(session) {
  const steps = play.adapter.steps(session);
  const bar = $('steps');
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
  $('dots').querySelectorAll('.dot').forEach((d, i) => {
    const solved = finished || i < index || (i === index && session.step === 'done');
    d.classList.toggle('done', solved);
    d.classList.toggle('current', !solved && i === index);
  });
  $('dots').setAttribute('aria-label', `Problem ${Math.min(index + 1, PROBLEMS_PER_LEVEL)} of ${PROBLEMS_PER_LEVEL}`);
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

// Turning the phone: the Mat was cropped (or not) for the old shape, so draw it again for the new one.
window.matchMedia('(orientation: portrait)').addEventListener('change', () => {
  if (!play || play.finished || document.getElementById('play').hidden) return;
  play.fit = null;
  matRoot.replaceChildren(play.adapter.renderMat(play.session, {}));
  fitMatToPhone(matRoot.firstElementChild);
});

function render(before) {
  const { session, finished } = play;
  const { adapter } = play;
  const fx = adapter.effects(before, session);
  // A problem just finished: the streak grows with a clean answer and goes back to zero after any other.
  if (session.step === 'done' && before && before.step !== 'done' && 'clean' in session) {
    play.streak = afterAnswer(play.streak, session);
    if (play.streak > play.best) play.best = saveBest(play.pack.id, play.level, play.streak);
  }
  renderSteps(session);
  renderDots();
  renderStreak();
  controls.update(finished ? { ...session, step: 'levelDone' } : session, fx.hint);
  hintLine.hidden = finished || !fx.hint;
  if (finished) return;

  matRoot.replaceChildren(adapter.renderMat(session, fx));
  fitMatToPhone(matRoot.firstElementChild);
  hintLine.textContent = fx.hint ? `Hint: ${adapter.feedbackText(fx.hint)}` : '';
  feedback.textContent = adapter.feedbackText(session.feedback);
  // restart the shake/celebrate animation on repeated messages
  feedback.classList.remove('bad', 'celebrate');
  void feedback.offsetWidth;
  if (session.feedback?.bad) feedback.classList.add('bad');
  if (session.step === 'done') feedback.classList.add('celebrate');

  if (session.step === 'done' && before?.step !== 'done') {
    nextTimer = setTimeout(nextProblem, 2500);
  }
}

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
  else if (e.key === 'Enter' && !e.repeat) candidates.push('button[data-action="check"]');
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
$('next-level').addEventListener('click', () => startLevel(play.pack.id, play.level + 1));
$('save-code').addEventListener('click', () => showSaveCode(encodeProgress(progress)));

// A saved level in play, if it still makes sense to resume.
function savedCurrent() {
  const c = saved?.current;
  if (!c || typeof c !== 'object') return null;
  if (c.pack === 'combineit' && !(saved.layout >= 2)) return null;
  if (c.pack === 'boxes' && !(saved.layout >= 3)) return null;
  const pack = packById(c.pack);
  const ok = pack && !pack.comingSoon && isLevelUnlocked(progress, pack.id, c.level)
    && Number.isInteger(c.seed) && c.seed >= 0
    && Number.isInteger(c.index) && c.index >= 0 && c.index < PROBLEMS_PER_LEVEL;
  return ok ? c : null;
}

// ?level=N opens a Flip It level; ?pack=groupit&level=N opens a Group It level
// (?pack=lasso, its id from before the rename, still works); ?pack=boxes&level=N
// opens a Boxes & Circles level.
const urlLevel = Number(params.get('level'));
const urlPack = packById(params.get('pack') === 'groupit' ? 'lasso' : params.get('pack') ?? 'flipit');
const resume = savedCurrent();
if (urlPack && PLAY[urlPack.id] && Number.isInteger(urlLevel) && urlLevel >= 1 && urlLevel <= urlPack.levels) {
  startLevel(urlPack.id, urlLevel);
} else if (resume) {
  startLevel(resume.pack, resume.level, resume);
} else {
  goHome();
}
