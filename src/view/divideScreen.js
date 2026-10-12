// The Divide it screen, light build (SPEC-DIVIDE-IT.md on the pattern of SPEC-ADD-TO-BOTH-SIDES.md): the line on top, the work stack
// (the equation, each move beneath it, the x = [ ] row with Check and Next, the substitution), the fractions row under it ("Take
// ½ ⅓ ¼ ⅕ ⅙ of both sides", each stacked × ⅓ over ÷ 3), Undo, the help row, and the move panel with "Take a fraction" active.

import { html, actionRow } from './addBothMat.js';
import { stackRows, answerBlock, helpRow, movePanel, lineBlock } from './lightScreen.js';
import { divideFeedbackText } from './divideFeedback.js';
import { answerLive, helpOk, xAlone, coefOf, pileSize, DEAL_ROUND_LEVEL } from '../engine/divideMoves.js';
import { FRACTIONS, fractionText } from '../engine/divide.js';

// "Take [½][⅓][¼][⅕][⅙] of both sides": shown once the move is chosen (its room is always kept so nothing shifts).
function fractionRow(s) {
  const on = s.stage === 'moves' && s.menu === 'fraction' && !s.sub;
  const row = html('div', `lb-fractionrow${on ? '' : ' is-hidden'}`, [html('strong', '', ['Take'])]);
  const forced = s.forced && !xAlone(s.board);
  for (const n of FRACTIONS) {
    const b = html('button', `btn lb-frac-btn${s.hint?.kind === 'fraction' && s.hint.n === n ? ' is-target' : ''}`, [html('span', 'lb-frac-main', [`× ${fractionText(n)}`]), html('span', 'lb-frac-sub', [`÷ ${n}`])], { type: 'button', 'data-action': 'take', 'data-n': n, 'aria-label': `Take ${fractionText(n)} of both sides` });
    b.disabled = !on || (forced && n !== s.board.left[0].coef);
    row.append(b);
  }
  row.append(html('strong', '', ['of both sides']));
  if (!on) row.setAttribute('aria-hidden', 'true');
  return row;
}

// The counters (from I'm stuck / Teach me): the boxes on the left, the pile on the right. Once a fraction is chosen, n empty groups appear on
// the right and the boxes split into the same n on the left. A tap on a group deals it one counter (or keeps it, when all are shared
// evenly); Deal a round gives every group one. A count and the groups' sizes are always written under it.
function modelBlock(s) {
  const board = s.board;
  const boxes = coefOf(board);
  const size = pileSize(board);
  const sign = board.right[0].kind === 'num' && board.right[0].v < 0 ? '−' : '+';
  const deal = s.deal;
  const dealt = deal ? deal.groups.reduce((a, b) => a + b, 0) : 0;
  const counter = () => html('span', `dv-counter${sign === '−' ? ' is-neg' : ''}`, [sign]);
  const model = html('div', 'dv-model');
  // left: the boxes, in n groups once a fraction is chosen
  const left = html('div', 'dv-side dv-boxes');
  const per = deal ? boxes / deal.n : boxes;
  for (let g = 0; g < (deal ? deal.n : 1); g++) {
    const cluster = html('div', `dv-cluster${deal ? ' is-split' : ''}`);
    for (let i = 0; i < per; i++) cluster.append(html('span', 'dv-box', ['x']));
    left.append(cluster);
  }
  // right: the pile, and the groups
  const right = html('div', 'dv-side dv-pile');
  const pile = html('div', 'dv-poolwrap');
  for (let i = 0; i < size - dealt; i++) pile.append(counter());
  right.append(pile);
  if (deal) {
    const groups = html('div', 'dv-groups');
    deal.groups.forEach((count, g) => {
      const b = html('button', 'dv-group', [], { type: 'button', 'data-action': 'deal', 'data-group': g, 'aria-label': `Group ${g + 1}: ${count} counters` });
      for (let i = 0; i < count; i++) b.append(counter());
      b.dataset.keep = g;
      groups.append(b);
    });
    right.append(groups);
  }
  model.append(left, html('div', 'dv-border'), right);
  const wrap = html('div', 'dv-modelwrap', [model]);
  if (deal) {
    const readout = html('p', 'dv-readout', [`${dealt} of ${size} shared · groups hold ${deal.groups.join(', ')}`]);
    const even = dealt === size && deal.groups.every((c) => c === deal.groups[0]);
    const row = html('div', 'dv-actions');
    if (s.level >= DEAL_ROUND_LEVEL) row.append(html('button', 'btn', ['Deal a round'], { type: 'button', 'data-action': 'dealRound' }));
    wrap.append(readout);
    if (even) {
      // keeping: tapping a group now keeps it
      for (const b of model.querySelectorAll('.dv-group')) b.setAttribute('data-action', 'keep');
      wrap.append(html('p', 'dv-hint', ['Tap a group to keep it.']));
    } else if (row.childElementCount) wrap.append(row);
  }
  return wrap;
}

function bareBlock(s) {
  const block = html('div', `lb-eqblock${s.scaffold ? ' dv-scaffold' : ''}`);
  if (s.scaffold && !xAlone(s.board)) block.append(modelBlock(s));
  block.append(html('div', 'lb-stack', [...stackRows(s), answerBlock(s, answerLive)]));
  const done = s.stage === 'done';
  const row = actionRow({ undo: true });
  const undo = row.querySelector('.btn-undo');
  const wrongGuess = s.sub?.kind === 'guess' && !s.sub.ok && s.sub.step >= 3;
  undo.disabled = done || !((s.history.length > 0 && !s.sub) || wrongGuess);
  if (!undo.disabled && (Boolean(s.fail) || wrongGuess)) undo.classList.add('is-target');
  if (!s.deal) block.append(fractionRow(s));                       // while the counters are being dealt, Undo is the way to pick another fraction
  block.append(row);
  return block;
}

function panelBlock(s) {
  const solved = xAlone(s.board) && s.lights.smaller === 'green' ? 'green' : 'off';
  return movePanel({
    active: 'fraction', menu: s.menu, typing: s.typing, amountEntry: '', path: s.path,
    disabled: s.stage === 'done' || Boolean(s.sub),
    locked: s.stage === 'moves' && s.path !== 'move',
    target: s.path === 'move' && !s.menu && !s.sub && s.stage === 'moves' && !xAlone(s.board),
    lights: { fewer: s.lights.smaller, solved },
    whys: { smaller: s.lights.smaller, onebox: s.lights.onebox === 'neutral' ? 'off' : s.lights.onebox },
  });
}

export function renderDivideScreen(s) {
  const wrap = html('div', 'lb-game lb-eqcard');
  wrap.append(lineBlock(s, divideFeedbackText));
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  main.append(bareBlock(s), helpRow(s, helpOk));
  body.append(main, panelBlock(s));
  wrap.append(body);
  return wrap;
}
