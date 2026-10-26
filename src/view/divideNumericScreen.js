// The numeric level's screen (Level 1 of Divide it, SPEC-DIVIDE-IT.md §3A, on the shared Solve it loop): the line; the work stack, in which every
// action writes the fraction applied (in blue) and what each side becomes, with Balanced or Unbalanced; "Take ⅓ of the left / of the right",
// Undo and Go; or a quiz item (the question in bold with the part that matters in blue, the answers, and the evidence in blue rows);
// or the watched walkthrough on 3x = 6 with the group diagram. The picture is the seesaw of Add to both sides' Level 1 (counters
// grouped as the expression reads, the beam tipping or levelling), in the reserved picture area under the Move / Why? panel.

import { html, actionRow, drawBalance, groupShape, angleFor } from './addBothMat.js';
import { equationRow, movePanel } from './lightScreen.js';
import { lineBlock } from './solveScreen.js';
import { groupDiagram } from './groupDiagram.js';
import { divideNumericFeedbackText } from './divideNumericFeedback.js';
import { readoutOf, askParts, workRows, segsOf } from '../engine/divideNumeric.js';
import { fractionText } from '../engine/divide.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const svgEl = (name, attrs = {}) => { const n = document.createElementNS(SVG_NS, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
const blue = (parts) => parts.map((part) => (part.blue ? html('span', 'is-blue', [part.text]) : part.text));
const segEls = (segs) => segs.map((seg) => (seg.blue ? html('span', 'is-blue', [seg.text]) : seg.text));

// ---------- the work stack: the equation with the fraction in blue, then what each side comes to ----------

function workStack(rows) {
  return rows.map((row) => {
    const eq = equationRow([html('span', 'lb-num', segEls(row.left.map ? row.left : [{ text: row.left }]))], [html('span', 'lb-num', segEls(row.right.map ? row.right : [{ text: row.right }]))], `is-long${row.type === 'values' ? ' lb-work' : ''}`);
    const kids = [eq];
    if (row.type === 'eq' && row.tag) kids.push(html('span', 'lb-rowtag', [row.tag]));
    if (row.mark) kids.push(html('span', `lb-rowmark ${row.mark.good ? 'is-good' : 'is-bad'}`, [row.values ? `${row.values}  ${row.mark.text}` : row.mark.text]));
    return html('div', `lb-rowwrap is-settled${row.type === 'values' ? ' has-work' : ''}`, kids);
  });
}

// ---------- the seesaw: each side's counters grouped as the expression reads ----------

const groupItem = (id, n) => { const g = groupShape(n); return { type: 'group', id, v: n, n, shape: g, width: g.width, height: g.height }; };
const sideItems = (pair, n, tag) => (n ? [groupItem(`${tag}f`, (pair[0] * pair[1]) / n)] : Array.from({ length: pair[0] }, (_, i) => groupItem(`${tag}${i}`, pair[1])));

function seesaw(p, nLeft, nRight) {
  const r = readoutOf(p, nLeft, nRight);
  const svg = svgEl('svg', { class: 'mat value-mat addboth-mat gd-seesaw', role: 'img', 'aria-label': 'The balance' });
  drawBalance(svg, { left: sideItems(p.left, nLeft, 'l'), right: sideItems(p.right, nRight, 'r') }, {
    top: 70, readout: { text: r.text, cls: r.balanced ? 'is-good' : 'is-bad', y: 40, size: 34 }, building: false, zonesOn: false, angle: angleFor(r.left - r.right),
  });
  return html('div', 'sv-seesaw', [svg]);
}

// ---------- the "do" items ----------

function doBlock(s) {
  const p = s.problem;
  const done = s.stage === 'done';
  const block = html('div', 'lb-eqblock lb-numblock');
  block.append(html('div', 'lb-stack', [html('div', 'lb-rows lb-numrows', workStack(workRows(s)))]));
  const f = fractionText(p.n);
  const on = s.menu === 'fraction' && !done;
  const sides = html('div', `lb-fractionrow${on ? '' : ' is-off'}`);
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

// ---------- the quiz items ----------

function quizBlock(s) {
  const p = s.problem;
  const r = readoutOf(p, 0, 0);
  const block = html('div', 'ab-quiz');
  block.append(html('div', 'lb-readout is-good', [r.text]), equationRow([html('span', 'lb-num', segEls(segsOf(p.left, 0)))], [html('span', 'lb-num', segEls(segsOf(p.right, 0)))], 'is-long'));
  // the evidence, in rows (the fraction applied is blue, as it is in the question), then Balanced or Unbalanced; its room is reserved
  const list = html('div', 'lb-reveal-rows');
  if (s.reveal) list.append(...workStack(s.reveal.rows));
  block.append(list);
  const answered = Boolean(s.answered);
  block.append(html('p', 'ab-question', [...blue(askParts(p)), html('br'), 'Does it keep the balance, or upset it?']));
  const label = { keeps: 'Keeps the balance', upsets: 'Upsets the balance' };
  block.append(html('div', 'ab-answers', p.order.map((v) => {
    const b = html('button', `btn ab-answer${answered && s.answered.value === v ? ' is-chosen' : ''}`, [label[v]], { type: 'button', 'data-action': 'quiz', 'data-value': v });
    b.disabled = answered;
    return b;
  })));
  // the Next button's room is always kept, so nothing moves when an answer is picked
  const next = html('button', 'btn btn-go is-target', ['Next ▸'], { type: 'button', 'data-action': s.stage === 'review' ? 'quizNext' : 'next' });
  if (!s.reveal) { next.style.visibility = 'hidden'; next.disabled = true; }
  block.append(html('div', 'ab-actions', [html('span'), next]));
  return block;
}

// ---------- the watched walkthrough on 3x = 6 ----------

const WALK_STEPS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'end'];

function walkBlock(s) {
  const step = s.walk.step;
  const at = WALK_STEPS.indexOf(step);
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
  stack.append(html('ol', 'lb-subst', at >= 5 ? [html('li', 'is-good', ['3(2) = 6   ✓ Balanced'])] : []));
  block.append(stack);
  if (step === 'b') {
    const row = html('div', 'lb-fractionrow');
    row.append(html('button', 'btn lb-frac-btn is-target', [html('span', 'lb-frac-main', [`× ${fractionText(3)}`]), html('span', 'lb-frac-sub', ['÷ 3'])], { type: 'button', 'data-action': 'go' }));
    block.append(row);
  }
  const finished = step === 'end';
  const row = actionRow({ go: ['c', 'd', 'e', 'f', 'g'].includes(step) || finished ? 'Next ▸' : null, goAction: finished ? 'next' : 'wtNext' });
  if (row) { row.querySelector('.btn-go')?.classList.add('is-target'); block.append(row); }
  return block;
}

// The group diagram of the walkthrough: three groups of x on the left, 6 counters in three groups of 2 on the right; at ⅓ a bracket
// round 1 of the 3 groups on each side and the others fade; then the kept group alone. (Here, and only here, the counters of the 2 may be shown.)
function walkDiagram(s) {
  const at = WALK_STEPS.indexOf(s.walk.step);
  const o = { n: 3, boxes: 3, size: 6, neg: false, groups: [2, 2, 2], pile: 0, kept: null, only: false };
  let caption = '';
  if (at === 2) { o.kept = 0; caption = 'take 1 of the 3 groups: that is what multiplying by ⅓ does'; }                 // the stack has just added ⅓(3x) = ⅓(6)
  if (at >= 3) { o.kept = 0; o.only = true; caption = 'the kept group alone: one box, and what is in it'; }       // x = ⅓(6): the kept group
  return groupDiagram({ ...o, caption });
}

export function renderDivideNumericScreen(s) {
  const wrap = html('div', 'lb-game lb-eqcard sv-card');
  const walking = s.stage === 'walk' || s.walk?.step === 'end';
  const line = lineBlock(s, divideNumericFeedbackText);
  if (walking) line.append(html('span', 'lb-walktag', ['Walkthrough']));          // a label on the line's edge, so nothing moves
  wrap.append(line);
  const body = html('div', 'lb-body');
  const main = html('div', 'lb-main');
  main.append(walking ? walkBlock(s) : s.problem.item === 'quiz' ? quizBlock(s) : doBlock(s));
  const greenFrom = walking && ['d', 'e', 'f', 'g', 'end'].includes(s.walk.step);
  const panel = movePanel({
    active: 'fraction', menu: s.menu, typing: null, amountEntry: '', path: null, walkStep: walking && s.walk.step === 'a' ? 'move' : null,
    target: !walking && s.problem.item !== 'quiz' && !s.menu && !s.pending && s.stage === 'moves',
    disabled: (!walking && (s.problem.item === 'quiz' || s.stage === 'done' || Boolean(s.pending))) || (walking && s.walk.step !== 'a'),
    lights: { fewer: 'off', solved: greenFrom ? 'green' : 'off' }, off: !greenFrom,
    whys: { fewer: 'off', nofrac: 'off', smaller: greenFrom ? 'green' : 'off', onebox: greenFrom ? 'green' : 'off', noopp: 'off', xleft: 'off', simple: 'off' },
  });
  // the picture area: the seesaw (do items; quiz items once answered, to show what happened), or the group diagram (walkthrough)
  const p = s.problem;
  let picture;
  if (walking) picture = walkDiagram(s);
  else if (p.item === 'quiz') picture = seesaw(p, s.answered ? p.nLeft : 0, s.answered ? p.nRight : 0);
  else picture = seesaw(p, s.nLeft, s.nRight);
  body.append(main, html('div', 'sv-side', [panel, html('div', 'sv-diagram sv-picture', [picture])]));
  wrap.append(body);
  return wrap;
}
