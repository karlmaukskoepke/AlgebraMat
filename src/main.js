import './style.css';
import { PROBLEMS_PER_LEVEL } from './engine/generate.js';
import { newSession, reduce, STEPS } from './engine/session.js';
import {
  completeLevel, isPackComplete, isLevelUnlocked, normalizeProgress, mergeProgress,
  encodeProgress, decodeProgress,
} from './engine/progress.js';
import { createStore } from './storage.js';
import { PACKS, packById } from './packs/index.js';
import { renderMat } from './view/mat.js';
import { buildControls } from './view/controls.js';
import { feedbackText } from './view/feedback.js';
import { renderPackMap, renderLevelDone } from './view/packmap.js';
import { showSaveCode, askForCode } from './view/codes.js';

const $ = (id) => document.getElementById(id);
const newSeed = () => Math.floor(Math.random() * 2 ** 32);

// ?seed=123 replays a fixed set (handy for projecting the same problems to a
// class). ?level=2 (with or without a seed) opens that level directly.
const params = new URLSearchParams(location.search);
const urlSeed = Number(params.get('seed'));
const fixedSeed = Number.isInteger(urlSeed) && urlSeed > 0 ? urlSeed : null;

// Progress and the level in play are saved under one key (SPEC §7). If
// storage is blocked, everything still works from memory for this visit.
const store = createStore('mat.v1');
const saved = store.load();
let progress = normalizeProgress(saved, PACKS);
let homeNote = null;

let play = null; // { pack, level, seed, problems, index, session, finished }

function persist() {
  const current = play && !play.finished
    ? { pack: play.pack.id, level: play.level, seed: play.seed, index: play.index }
    : null;
  store.save({ ...progress, current });
}
let nextTimer = null;

const matRoot = $('mat');
const feedback = $('feedback');
const controls = buildControls($('controls'), dispatch);

function showScreen(name) {
  $('home').hidden = name !== 'home';
  $('play').hidden = name !== 'play';
  window.scrollTo(0, 0);
}

const STORAGE_NOTE = 'Progress won’t be remembered on this device. Use Save code to keep it.';

function goHome() {
  clearTimeout(nextTimer);
  play = null;
  persist();
  renderPackMap($('home'), progress, PACKS, {
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
  clearTimeout(nextTimer);
  const pack = packById(packId);
  const seed = resume?.seed ?? fixedSeed ?? newSeed();
  const problems = pack.generate(level, seed);
  const index = resume?.index ?? 0;
  play = { pack, level, seed, problems, index, session: newSession(problems[index]), finished: false };
  $('title').textContent = `${pack.title.toUpperCase()} · Level ${level}`;
  persist();
  showScreen('play');
  render();
}

function dispatch(action) {
  if (!play || play.finished) return;
  if (action.type === 'next') return nextProblem();
  const before = play.session;
  play.session = reduce(before, action);
  if (play.session !== before) render(before);
}

function nextProblem() {
  clearTimeout(nextTimer);
  if (play.index + 1 >= PROBLEMS_PER_LEVEL) return finishLevel();
  play.index += 1;
  play.session = newSession(play.problems[play.index]);
  persist();
  render();
}

function finishLevel() {
  const { pack, level } = play;
  progress = completeLevel(progress, pack.id, level);
  play.finished = true;
  persist();
  render();
  feedback.textContent = '';
  renderLevelDone(matRoot, {
    pack, level,
    packComplete: isPackComplete(progress, pack.id),
    onNext: () => startLevel(pack.id, level + 1),
    onMap: goHome,
    onReplay: () => startLevel(pack.id, level),
  });
}

function renderSteps(session) {
  const current = STEPS.indexOf(session.step);
  $('steps').querySelectorAll('li').forEach((li, i) => {
    const step = STEPS[i];
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

function render(before) {
  const { session, finished } = play;
  renderSteps(session);
  renderDots();
  controls.update(finished ? { ...session, step: 'levelDone' } : session);
  if (finished) return;

  matRoot.replaceChildren(renderMat(session));
  feedback.textContent = feedbackText(session.feedback);
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
  if (!t) return;
  const { action, part, zone, index: i } = t.dataset;
  if (action === 'flip') dispatch({ type: 'flip', part });
  if (action === 'zone') dispatch({ type: 'tapZone', zone: Number(zone) });
  if (action === 'counter') dispatch({ type: 'tapCounter', zone: Number(zone), index: Number(i) });
});

$('back').addEventListener('click', goHome);
$('save-code').addEventListener('click', () => showSaveCode(encodeProgress(progress)));

// A saved level in play, if it still makes sense to resume.
function savedCurrent() {
  const c = saved?.current;
  if (!c || typeof c !== 'object') return null;
  const pack = packById(c.pack);
  const ok = pack && !pack.comingSoon && isLevelUnlocked(progress, pack.id, c.level)
    && Number.isInteger(c.seed) && c.seed >= 0
    && Number.isInteger(c.index) && c.index >= 0 && c.index < PROBLEMS_PER_LEVEL;
  return ok ? c : null;
}

const urlLevel = Number(params.get('level'));
const resume = savedCurrent();
if (Number.isInteger(urlLevel) && urlLevel >= 1 && urlLevel <= packById('flipit').levels) {
  startLevel('flipit', urlLevel);
} else if (resume) {
  startLevel(resume.pack, resume.level, resume);
} else {
  goHome();
}
