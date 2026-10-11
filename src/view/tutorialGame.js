// The Mat while a tutorial is on (play/addBothTutorial.js): the tutorial's own board for the numbers-only parts, the real board
// for the counters and symbols parts, and a panel with what that part needs. Skip tutorial is always there.

import { renderTutorialMat, TITLES } from './tutorialMat.js';
import { boardBlock, trayFor, panelFor, html } from './addBothMat.js';
import { readyForQuiz, quizItem } from '../engine/numericTutorial.js';
import { MINUS } from '../engine/expr.js';

const btn = (label, action, cls = 'btn', data = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [`data-${k}`, v])) });

function bar(tut, extra) {
  const b = html('div', 'ab-tutbar');
  const part = tut.phase === 'numeric' ? 'with numbers' : tut.phase === 'box' ? 'with counters and a box' : 'with symbols';
  b.append(html('p', 'ab-tutname', [`Tutorial: ${TITLES[tut.kind]}`, html('span', 'ab-tutpart', [` ${part}`])]));
  if (extra) b.append(extra);
  b.append(btn('Skip tutorial', 'skipTutorial', 'btn btn-quiet'));
  return b;
}

function numericPanel(tut) {
  const t = tut.t;
  const panel = html('aside', 'ab-panel', [], { 'aria-label': 'Tutorial' });
  panel.append(bar(tut));
  const body = html('div', 'ab-moves');
  const sub = html('div', 'ab-sub');
  if (t.stage === 'quiz') {
    body.append(btn('Keeps the balance', 'quiz', 'btn btn-move ab-move', { value: 'keeps' }), btn('Upsets the balance', 'quiz', 'btn btn-move ab-move', { value: 'upsets' }));
    panel.append(body);
    return panel;
  }
  if (t.stage === 'quizDone') { panel.append(btn('Continue ▸', 'continue', 'btn btn-primary ab-move')); return panel; }

  if (t.kind === 'add') {
    const blank = html('span', `ab-blank${t.menu === 'add' ? ' is-active' : ''}${t.amountEntry ? '' : ' is-empty'}`, [t.amountEntry ? t.amountEntry.replace('-', MINUS) : '___']);
    const add = html('button', `btn btn-move ab-move${t.menu === 'add' ? ' is-on' : ''}`, ['Add ', blank, ' to both sides'], { type: 'button', 'data-action': 'choose', 'data-move': 'add' });
    add.disabled = Boolean(t.pending);
    body.append(add);
    if (t.menu === 'add') {
      const l = btn('Add to left', 'addTo', 'btn ab-side', { side: 'left' });
      const r = btn('Add to right', 'addTo', 'btn ab-side', { side: 'right' });
      l.disabled = Boolean(t.pending && (t.pending.both || t.pending.side === 'left'));
      r.disabled = Boolean(t.pending && (t.pending.both || t.pending.side === 'right'));
      const go = btn('Go ▶', 'go', 'btn btn-primary');
      go.disabled = !(t.pending?.both);
      sub.append(l, r, go);
    }
  } else if (t.kind === 'trade') {
    const trade = btn('Trade places', 'trade', 'btn btn-move ab-move');
    body.append(trade);
    if (t.traded && t.item < 1) sub.append(btn('Another one ▸', 'nextItem', 'btn'));
  } else {
    sub.append(btn(t.flipMode ? 'Back to crossing' : 'Change a sign', 'flipMode', `btn${t.flipMode ? ' is-on' : ''}`), btn('Change every sign', 'flipAll', 'btn'));
    const go = btn('Go ▶', 'go', 'btn btn-primary');
    go.disabled = t.crossed === null;
    sub.append(go);
  }
  if (t.history.length) sub.append(btn('↶ Undo', 'undo', 'btn btn-quiet'));
  panel.append(body);
  if (sub.childNodes.length) panel.append(sub);
  if (readyForQuiz(t) && !t.pending && !t.crossed) panel.append(btn('Continue ▸', 'continue', 'btn btn-primary ab-continue'));
  return panel;
}

export function renderTutorialGame(s) {
  const { tut } = s;
  const wrap = html('div', 'ab-game is-tutorial');
  const main = html('div', 'ab-main');
  let panel;
  if (tut.phase === 'numeric') {
    main.append(renderTutorialMat(tut.t));
    panel = numericPanel(tut);
  } else {
    main.append(boardBlock(tut.eng));
    const tray = trayFor(tut.eng);
    if (tray) main.append(tray);
    panel = panelFor(tut.eng);
    panel.prepend(bar(tut, tut.eng.stage === 'done' ? btn('Continue ▸', 'continue', 'btn btn-primary') : null));
  }
  wrap.append(main, panel);
  return wrap;
}

export { quizItem };
