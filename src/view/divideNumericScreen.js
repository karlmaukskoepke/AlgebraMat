// The numeric level's screen (Level 1 of Divide it): the line, the readout of the two sides, the equation, "Take ⅓ of the left / of
// the right", Undo and Go; or a quiz item (the question in bold with the part that matters in blue, the answers, and room above
// them for what happened); or the watched walkthrough on 3x = 6, every step staying on screen.

import { html, actionRow } from './addBothMat.js';
import { equationRow, movePanel, lineBlock } from './lightScreen.js';
import { divideNumericFeedbackText } from './divideNumericFeedback.js';
import { readoutOf, sideText, askParts } from '../engine/divideNumeric.js';
import { fractionText } from '../engine/divide.js';

const blue = (parts) => parts.map((part) => (part.blue ? html('span', 'is-blue', [part.text]) : part.text));
const sideEls = (pair, n) => [html('span', 'lb-num', [sideText(pair, n)])];

function doBlock(s) {
  const p = s.problem;
  const r = readoutOf(p, s.nLeft, s.nRight);
  const done = s.stage === 'done';
  const block = html('div', 'lb-eqblock lb-numblock');
  block.append(html('div', `lb-readout ${r.balanced ? 'is-good' : 'is-bad'}`, [r.text]));
  block.append(equationRow(sideEls(p.left, s.nLeft), sideEls(p.right, s.nRight), 'is-long'));
  const f = fractionText(p.n);
  const on = s.menu === 'fraction' && !done;
  const sides = html('div', `lb-fractionrow${on ? '' : ' is-hidden'}`);
  for (const side of ['left', 'right']) {
    const taken = side === 'left' ? s.nLeft : s.nRight;
    const b = html('button', 'btn lb-sidebtn', [`Take ${f} of the ${side}`], { type: 'button', 'data-action': 'takeSide', 'data-side': side });
    b.disabled = !on || Boolean(taken);
    if (on && !taken && (!s.pending || !s.pending.both)) b.classList.add('is-target');
    sides.append(b);
  }
  block.append(sides);
  const row = actionRow({ undo: !done && s.history.length > 0, go: done ? 'Next problem ▸' : s.menu === 'fraction' ? 'Go ▶' : null, goAction: done ? 'next' : 'go', goDisabled: !done && !s.pending?.both });
  if (row) { if (s.pending?.both || done) row.querySelector('.btn-go')?.classList.add('is-target'); block.append(row); }
  return block;
}

function quizBlock(s) {
  const p = s.problem;
  const r = readoutOf(p, 0, 0);
  const block = html('div', 'ab-quiz');
  block.append(html('div', 'lb-readout is-good', [r.text]), equationRow(sideEls(p.left, 0), sideEls(p.right, 0), 'is-long'));
  const list = html('ol', 'lb-subst lb-reveal');
  if (s.reveal) {
    list.append(html('li', '', [s.reveal.lines[0]]), html('li', '', [s.reveal.lines[1]]));
    list.append(html('li', s.reveal.ok ? 'is-good' : 'is-bad', [s.reveal.ok ? '✓ Balanced' : '✗ Unbalanced']));
  }
  block.append(list);
  const answered = Boolean(s.answered);
  block.append(html('p', 'ab-question', [...blue(askParts(p)), html('br'), 'Does it keep the balance, or upset it?']));
  const label = { keeps: 'Keeps the balance', upsets: 'Upsets the balance' };
  block.append(html('div', 'ab-answers', p.order.map((v) => {
    const b = html('button', `btn ab-answer${answered && s.answered.value === v ? ' is-chosen' : ''}`, [label[v]], { type: 'button', 'data-action': 'quiz', 'data-value': v });
    b.disabled = answered;
    return b;
  })));
  if (s.reveal) block.append(html('div', 'ab-actions', [html('span'), html('button', 'btn btn-go is-target', ['Next ▸'], { type: 'button', 'data-action': s.stage === 'review' ? 'quizNext' : 'next' })]));
  return block;
}

function walkBlock(s) {
  const step = s.walk.step;
  const at = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'end'].indexOf(step);
  const block = html('div', 'lb-eqblock lb-walk');
  block.append(html('div', 'lb-balance', ['Balanced ✓']));
  const el = (text, cls = '') => html('span', cls, [text]);
  const frac = (inner) => html('span', 'lb-frac', [html('span', 'is-blue', [fractionText(3)]), `(${inner})`]);
  const rows = [equationRow([el('3x')], [el('6')])];
  if (at >= 2) rows.push(equationRow([frac('3x')], [frac('6')], 'lb-work'));
  if (at >= 3) rows.push(equationRow([el('x')], [frac('6')]));
  if (at >= 4) rows.push(equationRow([el('x')], [el('2')]));
  const stack = html('div', 'lb-stack lb-walkstack');
  rows.forEach((r, i) => stack.append(html('div', `lb-rowwrap${i < rows.length - 1 ? ' is-settled' : ''}${r.classList.contains('lb-work') ? ' has-work' : ''}`, [r])));
  stack.append(html('ol', 'lb-subst', at >= 5 ? [html('li', 'is-good', ['3 × 2 = 6   ✓ Balanced'])] : []));
  block.append(stack);
  const going = step === 'b';
  if (going) {
    const row = html('div', 'lb-fractionrow');
    row.append(html('button', 'btn lb-frac-btn is-target', [html('span', 'lb-frac-main', [`× ${fractionText(3)}`]), html('span', 'lb-frac-sub', ['÷ 3'])], { type: 'button', 'data-action': 'go' }));
    block.append(row);
  }
  const finished = step === 'end';
  const row = actionRow({ go: ['c', 'd', 'e', 'f', 'g'].includes(step) || finished ? 'Next ▸' : null, goAction: finished ? 'next' : 'wtNext' });
  if (row) { row.querySelector('.btn-go')?.classList.add('is-target'); block.append(row); }
  return block;
}

export function renderDivideNumericScreen(s) {
  const wrap = html('div', 'lb-game');
  const walking = s.stage === 'walk' || s.walk?.step === 'end';
  if (walking) wrap.append(html('p', 'lb-tag', ['Walkthrough']));
  wrap.append(lineBlock({ ...s, path: 'move', stage: s.stage === 'done' ? 'done' : 'play', scaffold: true }, divideNumericFeedbackText));
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  main.append(walking ? walkBlock(s) : s.problem.item === 'quiz' ? quizBlock(s) : doBlock(s));
  const greenFrom = walking && ['d', 'e', 'f', 'g', 'end'].includes(s.walk.step);
  body.append(main, movePanel({
    active: 'fraction', menu: s.menu, typing: null, amountEntry: '', path: null, walkStep: walking && s.walk.step === 'a' ? 'move' : null,
    target: !walking && s.problem.item !== 'quiz' && !s.menu && !s.pending && s.stage === 'moves',
    disabled: (!walking && (s.problem.item === 'quiz' || s.stage === 'done' || Boolean(s.pending))) || (walking && s.walk.step !== 'a'),
    lights: { fewer: greenFrom ? 'green' : 'off', solved: greenFrom ? 'green' : 'off' }, off: !greenFrom,
  }));
  wrap.append(body);
  return wrap;
}
