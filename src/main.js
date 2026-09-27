import './style.css';
import { generateLevel, PROBLEMS_PER_LEVEL } from './engine/generate.js';
import { newSession, reduce, STEPS } from './engine/session.js';
import { renderMat } from './view/mat.js';
import { buildControls } from './view/controls.js';
import { feedbackText } from './view/feedback.js';

// Step 4: one level's problems played in a row, so every move can be tried.
// Level flow, unlocks and the pack map come in Step 5.
const LEVEL = 4;
const newSeed = () => Math.floor(Math.random() * 2 ** 32);

// ?seed=123 replays a fixed set (handy for projecting the same problems to a class).
const urlSeed = Number(new URLSearchParams(location.search).get('seed'));
let problems = generateLevel(LEVEL, Number.isInteger(urlSeed) && urlSeed > 0 ? urlSeed : newSeed());
let index = 0;
let session = newSession(problems[index]);

const $ = (id) => document.getElementById(id);
const matRoot = $('mat');
const feedback = $('feedback');
const controls = buildControls($('controls'), dispatch);
let nextTimer = null;

function dispatch(action) {
  if (action.type === 'next') return nextProblem();
  const before = session;
  session = reduce(session, action);
  if (session !== before) render(before);
}

function nextProblem() {
  clearTimeout(nextTimer);
  index += 1;
  if (index >= PROBLEMS_PER_LEVEL) {
    problems = generateLevel(LEVEL, newSeed());
    index = 0;
  }
  session = newSession(problems[index]);
  render();
}

function renderSteps() {
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
  $('dots').querySelectorAll('.dot').forEach((d, i) => {
    const solved = i < index || (i === index && session.step === 'done');
    d.classList.toggle('done', solved);
    d.classList.toggle('current', !solved && i === index);
  });
  $('dots').setAttribute('aria-label', `Problem ${index + 1} of ${PROBLEMS_PER_LEVEL}`);
}

function render(before) {
  matRoot.replaceChildren(renderMat(session));
  feedback.textContent = feedbackText(session.feedback);
  // restart the shake/celebrate animation on repeated messages
  feedback.classList.remove('bad', 'celebrate');
  void feedback.offsetWidth;
  if (session.feedback?.bad) feedback.classList.add('bad');
  if (session.step === 'done') feedback.classList.add('celebrate');
  renderSteps();
  renderDots();
  controls.update(session);

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

$('title').textContent = `FLIP IT · Level ${LEVEL}`;
render();
