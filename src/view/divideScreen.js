// The Divide it screen, light build (SPEC-DIVIDE-IT.md on the pattern of SPEC-ADD-TO-BOTH-SIDES.md): the line on top, the work stack
// (the equation, each move beneath it, the x = [ ] row with Check and Next, the substitution), the fractions row under it ("Take
// ½ ⅓ ¼ ⅕ ⅙ of both sides", each stacked × ⅓ over ÷ 3), Undo, the help row, and the move panel with "Take a fraction" active.

import { html, actionRow } from './addBothMat.js';
import { stackRows, answerBlock, helpRow, movePanel, lineBlock } from './lightScreen.js';
import { divideFeedbackText } from './divideFeedback.js';
import { answerLive, helpOk, xAlone } from '../engine/divideMoves.js';
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

function bareBlock(s) {
  const block = html('div', 'lb-eqblock');
  block.append(html('div', 'lb-stack', [...stackRows(s), answerBlock(s, answerLive)]));
  const done = s.stage === 'done';
  const row = actionRow({ undo: true });
  const undo = row.querySelector('.btn-undo');
  const wrongGuess = s.sub?.kind === 'guess' && !s.sub.ok && s.sub.step >= 3;
  undo.disabled = done || !((s.history.length > 0 && !s.sub) || wrongGuess);
  if (!undo.disabled && (Boolean(s.fail) || wrongGuess)) undo.classList.add('is-target');
  block.append(fractionRow(s), row);
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
