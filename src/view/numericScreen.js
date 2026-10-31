// The numeric level's screen (Level 1 of Add to both sides, SPEC-ADD-TO-BOTH-SIDES.md §3D): the line, the balance with the
// numbers standing on it as groups of counters and a big readout, the equation, Undo and Go; or, for a quiz item, the
// problem, the question in bold and its two answers right under it, and the before / after after a miss.

import { crossOut } from './crossOut.js';
import { numericFeedbackText } from './numericFeedback.js';
import { signed } from '../engine/addBoth.js';
import { html, drawBalance, equationSvg, sideButtons, actionRow, groupShape, angleFor } from './addBothMat.js';
import { movePanel, equationRow, workTerms, addPhrase } from './lightScreen.js';
import { readoutOf, sideText, equationText, askParts } from '../engine/numericLevel.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  node.append(...children);
  return node;
}
const W = 620;

const itemOf = (term) => {
  if (term.v === 0) return { type: 'token', id: term.id, v: 0, width: 76, height: 60 };
  const g = groupShape(Math.abs(term.v));
  return { type: 'group', id: term.id, v: term.v, n: Math.abs(term.v), shape: g, width: g.width, height: g.height };
};

function balanceBlock(s) {
  const r = readoutOf(s.board);
  const block = html('div', 'ab-boardwrap');
  const svg = el('svg', { class: 'mat value-mat addboth-mat', role: 'group', 'aria-label': 'The balance' });
  const geo = drawBalance(svg, { left: s.board.left.map(itemOf), right: s.board.right.map(itemOf) }, {
    top: 120, readout: { text: r.text, cls: r.balanced ? 'is-good' : 'is-bad', y: 54, size: 46 },
    building: false, zonesOn: false, angle: angleFor(r.left - r.right),
  });
  const [, , vw, vh] = svg.getAttribute('viewBox').split(' ').map(Number);
  block.style.setProperty('--ar', String(vw / (vh + 150)));
  block.append(svg);
  if (s.menu === 'add' && (s.pending || /^-?\d+$/.test(s.amountEntry))) {
    const sb = sideButtons(geo, s.amountEntry, s.pending);
    // only the one next place to click is highlighted: the left side first, then the right
    const [l, r] = sb.querySelectorAll('button');
    if (!s.pending) l.classList.add('is-target'); else if (!s.pending.both) (s.pending.side === 'left' ? r : l).classList.add('is-target');
    block.append(sb);
  }
  block.append(equationSvg({ left: sideText(s.board.left), right: sideText(s.board.right) }, geo));
  const done = s.stage === 'done';
  const row = actionRow({
    undo: !done && s.history.length > 0,
    go: done ? 'Next problem ▸' : s.menu === 'add' ? 'Go ▶' : null,
    goAction: done ? 'next' : 'go',
    goDisabled: !done && (!(s.pending?.both) || !r.balanced),
  });
  if (row) {
    if (s.pending?.both || done) row.querySelector('.btn-go')?.classList.add('is-target');
    block.append(addPhrase(s), row);
  }
  return block;
}

// The watched walkthrough on x + 3 = 5 (SPEC-ADD-TO-BOTH-SIDES.md §3D item 6): a balance indicator on top, then one animation
// a click, each click on the one highlighted place.
function walkBlock(s) {
  const step = s.walk.step;
  const block = html('div', 'lb-eqblock lb-walk');
  block.append(html('div', 'lb-balance', ['Balanced ✓'], { 'aria-label': 'The equation is balanced' }));
  const x = () => html('span', 'lb-x', ['x']);
  const num = (v, cls = '') => html('span', `lb-num ${cls}`.trim(), [signed(v)]);
  const plus = () => html('span', 'lb-plus', ['+']);
  const added = (cls = '') => num(-3, `is-added ${cls}`.trim());
  const at = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'end'].indexOf(step);
  // nothing is erased: every step stays on screen, a row under the one before
  const rows = [equationRow([x(), plus(), num(3)], [num(5)])];
  if (at >= 2 && at < 3) rows.push(equationRow([x(), plus(), num(3), plus(), added()], [num(5), plus(), added()], 'lb-work'));
  if (at >= 3) {
    rows.push(equationRow([x(), crossOut([plus(), num(3, 'is-struck')]), crossOut([plus(), added('is-struck')])], [num(5), plus(), added()], 'lb-work'));     // (crossed out sign and all: Build W)
    rows.push(equationRow([x()], [num(5), plus(), num(-3)]));
  }
  if (at >= 4) rows.push(equationRow([x()], [num(2)]));
  const stack = html('div', 'lb-stack lb-walkstack');
  rows.forEach((r, i) => stack.append(html('div', `lb-rowwrap${i < rows.length - 1 ? ' is-settled' : ''}${r.classList.contains('lb-work') ? ' has-work' : ''}`, [r])));
  stack.append(html('ol', 'lb-subst', at >= 5 ? [html('li', 'is-good', ['2 + 3 = 5   ✓ Balanced'])] : []));
  block.append(stack);
  const going = step === 'b';
  const finished = step === 'end';
  const row = actionRow({ go: going ? 'Go ▶' : ['c', 'd', 'e', 'f', 'g'].includes(step) ? 'Next ▸' : finished ? 'Next ▸' : null, goAction: going ? 'go' : finished ? 'next' : 'wtNext' });
  if (row) { row.querySelector('.btn-go')?.classList.add('is-target'); block.append(row); }
  return block;
}

function quizBlock(s) {
  const p = s.problem;
  const block = html('div', 'ab-quiz');
  const before = s.board;
  const r = readoutOf(before);
  // the equation and its readout stay put for the whole item
  const svg = el('svg', { class: 'mat value-mat addboth-mat', viewBox: `0 0 ${W} 150`, role: 'group', 'aria-label': 'The equation' });
  svg.append(el('text', { x: W / 2, y: 60, 'text-anchor': 'middle', class: 'ab-eq' }, [equationText(before)]));
  svg.append(el('text', { x: W / 2, y: 118, 'text-anchor': 'middle', class: `ab-readout ${r.balanced ? 'is-good' : 'is-bad'}`, style: 'font-size:40px' }, [r.text]));
  block.append(svg);
  // room for what happened (the equation after, what each side comes to, Balanced or Unbalanced), reserved above the question so
  // nothing moves when an answer is picked: the answers just sit a little lower
  const list = html('ol', 'lb-subst lb-reveal');
  if (s.reveal) {
    // the equation after the change, with what was added in blue, then what each side comes to
    const side = (terms) => terms.flatMap((t, i) => [...(i ? [' + '] : []), t.blue ? html('span', 'is-blue', [t.text]) : t.text]);
    list.append(html('li', '', [...side(s.reveal.after.left), ' = ', ...side(s.reveal.after.right)]));
    list.append(html('li', '', [s.reveal.lines[2]]));
    list.append(html('li', s.reveal.ok ? 'is-good' : 'is-bad', [s.reveal.ok ? '✓ Balanced' : '✗ Unbalanced']));
  }
  block.append(list);
  const answered = Boolean(s.answered);
  block.append(html('p', 'ab-question', [...askParts(p).map((part) => (part.blue ? html('span', 'is-blue', [part.text]) : part.text)), html('br'), 'Does it keep the balance, or upset it?']));
  const label = { keeps: 'Keeps the balance', upsets: 'Upsets the balance' };
  block.append(html('div', 'ab-answers', p.order.map((v) => {
    const b = html('button', `btn ab-answer${answered && s.answered.value === v ? ' is-chosen' : ''}`, [label[v]], { type: 'button', 'data-action': 'quiz', 'data-value': v });
    b.disabled = answered;
    return b;
  })));
  if (s.reveal) block.append(html('div', 'ab-actions', [html('span'), html('button', 'btn btn-go is-target', ['Next ▸'], { type: 'button', 'data-action': s.stage === 'review' ? 'quizNext' : 'next' })]));
  return block;
}

export function renderNumericScreen(s) {
  const wrap = html('div', 'lb-game');
  const line = html('div', `lb-line${s.feedback?.bad ? ' is-bad' : ''}${s.stage === 'done' ? ' is-good' : ''}`, [html('p', 'lb-text', [numericFeedbackText(s.feedback)])], { role: 'status', 'aria-live': 'polite' });
  wrap.append(line);
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  const walking = s.stage === 'walk' || s.walk?.step === 'end';
  if (walking) wrap.insertBefore(html('p', 'lb-tag', ['Walkthrough']), line);
  main.append(walking ? walkBlock(s) : s.problem.item === 'quiz' ? quizBlock(s) : balanceBlock(s));
  const greenFrom = walking && ['d', 'e', 'f', 'g', 'end'].includes(s.walk.step);
  body.append(main, movePanel({
    menu: s.menu, typing: null, amountEntry: s.amountEntry, path: null, walkStep: walking && s.walk.step === 'a' ? 'move' : null,
    target: !walking && s.problem.item !== 'quiz' && !s.menu && !s.pending && s.stage === 'moves',
    disabled: (!walking && (s.problem.item === 'quiz' || s.stage === 'done' || Boolean(s.pending))) || (walking && s.walk.step !== 'a'),
    lights: greenFrom ? { fewer: 'green', solved: 'green' } : { fewer: 'off', solved: 'off' }, off: !greenFrom,
  }));
  wrap.append(body);
  return wrap;
}
