// The fluency challenge screen: a start screen with the high scores, a round (a clock, the problem, the answer being
// typed, the right answer flashing after a miss), and the end screen. One view built once; `render(state)` updates it.

import { h, buildPad, bindKeys, shown } from './quiz.js';
import { challengeById, DURATION_MS, timeLeft } from '../engine/fluency.js';
import { PERIODS, topRuns, bestScore } from '../engine/highscores.js';

const clock = (ms) => `${Math.floor(Math.ceil(ms / 1000) / 60)}:${String(Math.ceil(ms / 1000) % 60).padStart(2, '0')}`;
const dateText = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// The high scores of one challenge, with a tab for each period.
function scoresPanel(runs, challenge, now, period, onPeriod) {
  const list = topRuns(runs, challenge, period, now, 5);
  return h('section', { class: 'scores', 'aria-label': 'High scores' },
    h('div', { class: 'score-tabs', role: 'tablist' }, ...PERIODS.map((p) => h('button', {
      type: 'button', role: 'tab', class: `btn score-tab${p.id === period ? ' is-on' : ''}`, 'aria-selected': String(p.id === period), dataset: { period: p.id },
    }, p.label))),
    list.length
      ? h('ol', { class: 'score-list' }, ...list.map((r) => h('li', {}, h('span', { class: 'score-n' }, String(r.s)), h('span', { class: 'score-date' }, dateText(r.t)))))
      : h('p', { class: 'score-none' }, 'No scores yet. Yours goes here.'));
}

export function createFluencyView(root, { challenge, getRuns, onAction, onBack }) {
  const info = challengeById(challenge);
  let period = 'month';
  let last = null;
  let scoreHost = null;

  const back = h('button', { type: 'button', class: 'btn btn-quiet', dataset: { go: 'back' } }, '← Back');
  const title = h('div', { class: 'title' }, info.title.toUpperCase());
  const timer = h('div', { class: 'quiz-timer', 'aria-live': 'off' }, clock(DURATION_MS));
  const score = h('div', { class: 'quiz-score' }, '0');
  const bar = h('div', { class: 'quiz-bar' }, h('div', { class: 'quiz-bar-fill' }));
  const top = h('header', { class: 'topbar quiz-top' }, back, title, h('div', { class: 'quiz-stats' }, timer, score));

  const problem = h('div', { class: 'quiz-problem' });
  const answer = h('div', { class: 'quiz-answer' });
  const flash = h('div', { class: 'quiz-flash', role: 'status', hidden: true });
  const tierNote = h('div', { class: 'quiz-tier' });
  const playPanel = h('div', { class: 'quiz-play' }, tierNote, problem, answer, flash);

  const startButton = h('button', { type: 'button', class: 'btn btn-primary', dataset: { go: 'start' } }, 'Start');
  const readyPanel = h('div', { class: 'quiz-panel' },
    h('h2', {}, info.title),
    h('p', { class: 'quiz-blurb' }, `${info.blurb} You have 60 seconds. Type the answer and press Check. It gets harder the more you get right.`),
    h('p', { class: 'quiz-blurb' }, 'A wrong answer shows you the right one and pauses you for a moment, so it costs time, not points.'),
    startButton);
  const againButton = h('button', { type: 'button', class: 'btn btn-primary', dataset: { go: 'start' } }, 'Play again');
  const endTitle = h('h2', {}, 'Time!');
  const endScore = h('div', { class: 'quiz-final' });
  const endNote = h('p', { class: 'quiz-blurb' });
  const endPanel = h('div', { class: 'quiz-panel' }, endTitle, endScore, endNote, againButton);
  scoreHost = h('div', { class: 'score-host' });

  const stage = h('div', { class: 'quiz-stage' }, playPanel, readyPanel, endPanel, scoreHost);
  const check = h('button', { type: 'button', class: 'btn btn-primary', dataset: { go: 'check' } }, 'Check ✓');
  const pad = buildPad((a) => onAction(a), 'integer');
  const footer = h('footer', { class: 'palette quiz-palette' }, h('div', { class: 'palette-row' }, check), pad.el);

  root.replaceChildren(top, bar, stage, footer);
  root.classList.add('is-quiz');

  root.onclick = (e) => {
    const go = e.target.closest('[data-go]')?.dataset.go;
    if (go === 'back') return onBack();
    if (go === 'start') return onAction({ type: 'start' });
    if (go === 'check') return onAction({ type: 'check' });
    const p = e.target.closest('[data-period]')?.dataset.period;
    if (p) { period = p; if (last) paintScores(last); }
  };
  const unbind = bindKeys(() => 'integer', (a) => {
    if (a.type === 'enter') return onAction({ type: last?.status === 'playing' ? 'check' : 'start' });
    onAction(a);
  });

  function paintScores(s) {
    scoreHost.replaceChildren(scoresPanel(getRuns(), challenge, Date.now(), period, null));
    scoreHost.hidden = s.status === 'playing';
  }

  return {
    render(s, extra = {}) {
      last = s;
      const playing = s.status === 'playing';
      playPanel.hidden = !playing;
      readyPanel.hidden = s.status !== 'ready';
      endPanel.hidden = s.status !== 'ended';
      pad.setEnabled(playing && !s.flash);
      check.disabled = !playing || Boolean(s.flash) || s.entry === '' || s.entry === '-';
      timer.textContent = clock(playing ? timeLeft(s) : s.status === 'ready' ? DURATION_MS : 0);
      timer.classList.toggle('is-low', playing && timeLeft(s) <= 10000);
      score.textContent = `✓ ${s.correct}`;
      bar.firstChild.style.width = `${playing ? (timeLeft(s) / DURATION_MS) * 100 : s.status === 'ready' ? 100 : 0}%`;
      if (playing) {
        problem.textContent = s.problem.text;
        answer.textContent = '';
        answer.append(h('span', { class: 'dist-eq' }, '='), h('span', { class: `quiz-typed${s.entry ? '' : ' is-empty'}` }, shown(s.entry) || '?'));
        flash.hidden = !s.flash;
        if (s.flash) flash.textContent = `The answer is ${String(s.flash.answer).replace('-', '−')}`;
        tierNote.textContent = s.tier > 0 ? `Getting harder: step ${s.tier + 1}` : '';
      }
      if (s.status === 'ended') {
        const before = extra.previousBest ?? bestScore(getRuns(), challenge, 'all', Date.now());
        endScore.textContent = String(s.correct);
        endNote.textContent = `${s.correct === 1 ? '1 correct' : `${s.correct} correct`}${s.wrong ? `, ${s.wrong} missed` : ''}. ${s.correct > before ? 'A new best!' : `Your best is ${before}.`}`;
      }
      paintScores(s);
      const main = s.status === 'ready' ? startButton : s.status === 'ended' ? againButton : check;
      if (s.status !== 'playing' && document.activeElement === document.body) main.focus?.({ preventScroll: true });
    },
    destroy() { unbind(); root.classList.remove('is-quiz'); root.onclick = null; },
  };
}
