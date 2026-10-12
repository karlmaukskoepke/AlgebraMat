// The Mat while a tutorial is on (play/addBothTutorial.js): the tutorial's own board for the numbers-only parts, the real board
// for the counters and symbols parts, and a panel with what that part needs. Skip tutorial is always there.

import { quizProblemSvg, quizRevealSvg, TITLES } from './tutorialMat.js';
import { boardBlock, trayFor, panelFor, html, drawBalance, equationSvg, sideButtons, actionRow, groupShape, angleFor } from './addBothMat.js';
import { readyForQuiz, quizItem, readoutOf, sideText } from '../engine/numericTutorial.js';
import { MINUS } from '../engine/expr.js';

const btn = (label, action, cls = 'btn', data = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [`data-${k}`, v])) });

function bar(tut, extra) {
  const b = html('div', 'ab-tutbar');
  const part = tut.phase === 'numeric' ? 'with numbers' : tut.phase === 'box' ? 'with counters and a box' : 'with symbols';
  b.append(html('p', 'ab-tutname', [`Tutorial: ${TITLES[tut.kind]}`, html('span', 'ab-tutpart', [` ${part}`])]));
  if (extra) b.append(extra);
  // the first time through, the tutorial is not skippable; a replay (by choice) can be left at any point
  if (tut.replay) b.append(btn('Back to my problem', 'skipTutorial', 'btn btn-quiet'));
  return b;
}

function numericPanel(tut) {
  const t = tut.t;
  const panel = html('aside', 'ab-panel', [], { 'aria-label': 'Tutorial' });
  panel.append(bar(tut));
  const body = html('div', 'ab-moves');
  const sub = html('div', 'ab-sub');
  if (t.stage === 'quiz' || t.stage === 'quizDone') return panel;       // the quiz is on the Mat, under the problem

  if (t.kind === 'add') {
    const blank = html('span', `ab-blank${t.menu === 'add' ? ' is-active' : ''}${t.amountEntry ? '' : ' is-empty'}`, [t.amountEntry ? t.amountEntry.replace('-', MINUS) : '\u00a0']);
    const add = html('button', `btn btn-move ab-move${t.menu === 'add' ? ' is-on' : ''}`, ['Add ', blank, ' to both sides'], { type: 'button', 'data-action': 'choose', 'data-move': 'add' });
    add.disabled = Boolean(t.pending);
    body.append(add);
  } else if (t.kind === 'trade') {
    body.append(btn('Trade places', 'trade', 'btn btn-move ab-move'));
    if (t.traded && t.item < 1) sub.append(btn('Another one ▸', 'nextItem', 'btn'));
  } else {
    sub.append(btn(t.flipMode ? 'Back to crossing' : 'Change a sign', 'flipMode', `btn${t.flipMode ? ' is-on' : ''}`), btn('Change every sign', 'flipAll', 'btn'));
  }
  panel.append(body);
  if (sub.childNodes.length) panel.append(sub);
  return panel;
}

// The numbers stand on the balance as groups of counters (a 0 is just the number), tipped by the readout.
const itemOf = (term) => {
  if (term.v === 0) return { type: 'token', id: term.id, v: 0, width: 76, height: 60 };
  const g = groupShape(Math.abs(term.v));
  return { type: 'group', id: term.id, v: term.v, n: Math.abs(term.v), shape: g, width: g.width, height: g.height };
};

function numericBoard(tut) {
  const t = tut.t;
  const r = readoutOf(t.board);
  const tap = t.kind === 'cross' ? (id) => (t.flipMode || t.crossed === id ? 'flipSign' : t.crossed ? null : 'cross') : () => null;
  const top = html('div', 'ab-boardwrap');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'mat value-mat addboth-mat tutorial-mat');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', `Tutorial: ${TITLES[t.kind]}`);
  const geo = drawBalance(svg, { left: t.board.left.map(itemOf), right: t.board.right.map(itemOf) }, {
    top: 120, readout: { text: r.text, cls: r.balanced ? 'is-good' : 'is-bad', y: 54, size: 46 },
    building: false, zonesOn: false, tapAction: tap, cls: (id) => (t.crossed === id ? ' is-crossing' : ''), angle: angleFor(r.left - r.right), anim: t.anim,
  });
  const [, , vw, vh] = svg.getAttribute('viewBox').split(' ').map(Number);
  top.style.setProperty('--ar', String(vw / (vh + 150)));
  top.append(svg);
  if (t.kind === 'add' && t.menu === 'add' && (t.pending || /^-?\d+$/.test(t.amountEntry))) top.append(sideButtons(geo, t.amountEntry, t.pending));
  top.append(equationSvg({ left: sideText(t.board.left), right: sideText(t.board.right) }, geo));
  // Undo (red) on the left; Go or Continue (green) on the right
  const going = (t.kind === 'add' && t.pending?.both) || (t.kind === 'cross' && t.crossed !== null);
  const ready = readyForQuiz(t) && !t.pending && !t.crossed;
  const row = actionRow({
    undo: t.history.length > 0,
    go: going ? 'Go ▶' : ready ? 'Continue ▸' : null,
    goAction: going ? 'go' : 'continue',
    goDisabled: going && !r.balanced,
  });
  if (row) top.append(row);
  return top;
}

// The quiz: the problem, then the question (bold, in its own spot), then the two answers right under it.
function quizBlock(tut) {
  const t = tut.t;
  const block = html('div', 'ab-quiz');
  block.append(quizProblemSvg(t));
  if (t.stage === 'quiz') {
    const item = quizItem(t);
    block.append(html('p', 'ab-question', [item.ask, html('br'), 'Does it keep the balance, or upset it?']));
    block.append(html('div', 'ab-answers', [btn('Keeps the balance', 'quiz', 'btn ab-answer', { value: 'keeps' }), btn('Upsets the balance', 'quiz', 'btn ab-answer', { value: 'upsets' })]));
    const reveal = quizRevealSvg(t);
    if (reveal) block.append(reveal);
  } else block.append(actionRow({ go: 'Continue ▸', goAction: 'continue' }));
  return block;
}

export function renderTutorialGame(s) {
  const { tut } = s;
  const wrap = html('div', 'ab-game is-tutorial');
  const main = html('div', 'ab-main');
  let panel;
  if (tut.phase === 'numeric') {
    main.append(tut.t.stage === 'quiz' || tut.t.stage === 'quizDone' ? quizBlock(tut) : numericBoard(tut));
    panel = numericPanel(tut);
  } else {
    main.append(boardBlock(tut.eng));
    const tray = trayFor(tut.eng);
    if (tray) main.append(tray);
    panel = panelFor(tut.eng);
    panel.prepend(bar(tut));
    if (tut.eng.stage === 'done') main.append(actionRow({ go: 'Continue ▸', goAction: 'continue' }));
  }
  wrap.append(main, panel);
  return wrap;
}

export { quizItem };
