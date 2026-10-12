// The numeric level's screen (Level 1 of Add to both sides, SPEC-ADD-TO-BOTH-SIDES.md §3D): the line, the balance with the
// numbers standing on it as groups of counters and a big readout, the equation, Undo and Go; or, for a quiz item, the
// problem, the question in bold and its two answers right under it, and the before / after after a miss.

import { numericFeedbackText } from './numericFeedback.js';
import { html, drawBalance, equationSvg, sideButtons, actionRow, groupShape, angleFor } from './addBothMat.js';
import { movePanel } from './lightScreen.js';
import { readoutOf, sideText, equationText, askOf, quizAfter } from '../engine/numericLevel.js';

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
  if (s.menu === 'add' && (s.pending || /^-?\d+$/.test(s.amountEntry))) block.append(sideButtons(geo, s.amountEntry, s.pending));
  block.append(equationSvg({ left: sideText(s.board.left), right: sideText(s.board.right) }, geo));
  const done = s.stage === 'done';
  const row = actionRow({
    undo: !done && s.history.length > 0,
    go: s.menu === 'add' ? 'Go ▶' : null,
    goDisabled: !(s.pending?.both) || !r.balanced,
  });
  if (row) block.append(row);
  return block;
}

function quizBlock(s) {
  const p = s.problem;
  const block = html('div', 'ab-quiz');
  const before = s.board;
  const r = readoutOf(before);
  const svg = el('svg', { class: 'mat value-mat addboth-mat', viewBox: `0 0 ${W} 150`, role: 'group', 'aria-label': 'The equation' });
  svg.append(el('text', { x: W / 2, y: 60, 'text-anchor': 'middle', class: 'ab-eq' }, [equationText(before)]));
  svg.append(el('text', { x: W / 2, y: 118, 'text-anchor': 'middle', class: `ab-readout ${r.balanced ? 'is-good' : 'is-bad'}`, style: 'font-size:40px' }, [r.text]));
  block.append(svg);
  block.append(html('p', 'ab-question', [askOf(p), html('br'), 'Does it keep the balance, or upset it?']));
  const label = { keeps: 'Keeps the balance', upsets: 'Upsets the balance' };
  block.append(html('div', 'ab-answers', p.order.map((v) => html('button', 'btn ab-answer', [label[v]], { type: 'button', 'data-action': 'quiz', 'data-value': v }))));
  if (s.reveal) {
    const rev = el('svg', { class: 'mat value-mat addboth-mat', viewBox: `0 0 ${W} 250`, role: 'group', 'aria-label': 'Before and after' });
    let y = 36;
    for (const [name, eq, read] of [['Before', s.reveal.before, s.reveal.beforeRead], ['After', s.reveal.after, s.reveal.afterRead]]) {
      rev.append(el('text', { x: W / 2, y, 'text-anchor': 'middle', class: 'tu-reveal-label' }, [name]));
      rev.append(el('text', { x: W / 2, y: y + 42, 'text-anchor': 'middle', class: 'ab-check' }, [eq]));
      rev.append(el('text', { x: W / 2, y: y + 82, 'text-anchor': 'middle', class: `ab-readout ${read.includes('Unbalanced') ? 'is-bad' : 'is-good'}` }, [read]));
      y += 110;
    }
    block.append(rev);
  }
  void quizAfter;
  return block;
}

export function renderNumericScreen(s) {
  const wrap = html('div', 'lb-game');
  const line = html('div', `lb-line${s.feedback?.bad ? ' is-bad' : ''}${s.stage === 'done' ? ' is-good' : ''}`, [html('p', 'lb-text', [numericFeedbackText(s.feedback)])], { role: 'status', 'aria-live': 'polite' });
  wrap.append(line);
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  main.append(s.problem.item === 'quiz' ? quizBlock(s) : balanceBlock(s));
  body.append(main, movePanel({
    menu: s.menu, typing: null, amountEntry: s.amountEntry, path: null, walkStep: null,
    disabled: s.problem.item === 'quiz' || s.stage === 'done' || Boolean(s.pending), lights: { fewer: 'off', solved: 'off' }, off: true,
  }));
  wrap.append(body);
  return wrap;
}
