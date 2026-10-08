// The One-step equations Mat: the equation, then (as the supports come) your answer put back in with whether the two
// sides balance, then the equation as a balance of one box (x, a number we don't know) and counters, then the undo done
// to both sides and what's left. Inline SVG; the pictures are plain data (`balanceRows`) so they can be tested.

import { MINUS } from '../engine/expr.js';
import { formatEquation, substituteSegments, balanceOf, leftOf } from '../engine/solve.js';
import { boxShape, CELL } from './valueMat.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  node.append(...children);
  return node;
}
const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

export const VIEW_WIDTH = 760;     // the least width; a wide picture widens it
const PAD = 8;
const BOX_W = 76;
const BOX_H = 64;
const PART_W = 44;
const GAP = 18;          // between things on one side
const MIDDLE = 90;       // around the equals sign
const ROW_GAP = 36;

// ---------- the pictures, as data ----------
// Items: { type: 'box', parts, taken, count }   a box for x (in `parts` equal parts, `taken` of them lit); `count` of them
//        { type: 'counters', n, sign, struck, added }   n counters ('+' or '−'), `struck` of them crossed out
//        { type: 'groups', count, size }  `count` separate groups of `size` counters
const box = (extra = {}) => ({ type: 'box', parts: 1, taken: 0, count: 1, ...extra });
const counters = (n, extra = {}) => ({ type: 'counters', n, sign: '+', struck: 0, added: false, ...extra });

// The balance for an equation: what is on each side.
function balance(p) {
  switch (p.form) {
    case 'x+a': return { left: [box(), counters(p.a)], right: [counters(p.b)] };
    case 'x-a': return { left: [box(), counters(p.a, { sign: '-' })], right: [counters(p.b)] };
    case 'ax': return { left: [box({ count: p.a })], right: [counters(p.b)] };
    default: return { left: [box({ parts: p.a, taken: 1 })], right: [counters(p.b)] };
  }
}

// The same thing with the undo done to both sides, and then what is left (a box on one side, counters on the other).
function undone(p) {
  switch (p.form) {
    case 'x+a':
      return {
        label: `Take ${p.a} away from both sides`,
        left: [box(), counters(p.a, { struck: p.a })],
        right: [counters(p.b, { struck: p.a })],
      };
    case 'x-a':
      return {
        label: `Put ${p.a} on both sides`,
        left: [box(), counters(p.a, { sign: '-', struck: p.a }), counters(p.a, { added: true, struck: p.a })],
        right: [counters(p.b), counters(p.a, { added: true })],
      };
    case 'ax':
      return {
        label: `Share the counters equally: ${p.a} boxes, ${p.a} groups`,
        left: [box({ count: p.a })],
        right: [{ type: 'groups', count: p.a, size: p.b / p.a }],
      };
    default:
      return {
        label: `Take ${p.a} of each side`,
        left: [box({ parts: p.a, taken: p.a })],
        right: [{ type: 'groups', count: p.a, size: p.b }],
      };
  }
}

export function balanceRows(p, rung) {
  if (rung < 2) return [];
  if (rung === 2) return [{ label: 'The balance', ...balance(p) }];
  return [
    { label: undone(p).label, ...undone(p) },
    { label: 'What’s left', left: [box()], right: [counters(p.x)], solved: true },
  ];
}

// ---------- drawing ----------
const itemWidth = (it) => {
  if (it.type === 'box') return it.parts > 1 ? it.parts * PART_W : it.count * BOX_W + (it.count - 1) * 14;
  if (it.type === 'counters') return boxShape(it.n).cols * CELL;
  return it.count * boxShape(it.size).cols * CELL + (it.count - 1) * 14;
};
const itemHeight = (it) => {
  if (it.type === 'box') return BOX_H;
  if (it.type === 'counters') return boxShape(it.n).rows * CELL;
  return boxShape(it.size).rows * CELL;
};
const sideWidth = (items) => items.reduce((w, it) => w + itemWidth(it), 0) + GAP * Math.max(0, items.length - 1);
const rowHeight = (row) => Math.max(BOX_H, ...[...row.left, ...row.right].map(itemHeight));

function mark(svg, cx, cy, sign, cls) {
  const g = el('g', { class: `bm-mark${cls ? ` ${cls}` : ''}` });
  g.append(el('line', { x1: cx - 8, y1: cy, x2: cx + 8, y2: cy, class: 'mark' }));
  if (sign === '+') g.append(el('line', { x1: cx, y1: cy - 8, x2: cx, y2: cy + 8, class: 'mark' }));
  svg.append(g);
}

function drawCounters(svg, x, y, h, n, sign, struck = 0, added = false) {
  const shape = boxShape(n);
  const top = y + (h - shape.rows * CELL) / 2;
  for (let i = 0; i < n; i++) {
    const cx = x + (i % shape.cols) * CELL + CELL / 2;
    const cy = top + Math.floor(i / shape.cols) * CELL + CELL / 2;
    const out = i >= n - struck;
    mark(svg, cx, cy, sign, `${added ? 'sv-added' : ''}${out ? ' sv-struck' : ''}`.trim());
    if (out) svg.append(el('line', { x1: cx - 9, y1: cy + 9, x2: cx + 9, y2: cy - 9, class: 'sv-slash' }));
  }
}

function drawSide(svg, x, y, h, items) {
  let cx = x;
  for (const it of items) {
    const w = itemWidth(it);
    if (it.type === 'box') {
      const by = y + (h - BOX_H) / 2;
      if (it.parts > 1) {
        for (let k = 0; k < it.parts; k++) svg.append(el('rect', { x: cx + k * PART_W, y: by, width: PART_W, height: BOX_H, class: `vm-part${k < it.taken ? ' is-taken' : ''}` }));
        svg.append(el('rect', { x: cx, y: by, width: w, height: BOX_H, rx: 6, class: 'vm-box' }));
        svg.append(el('text', { x: cx + w / 2, y: by + BOX_H / 2 + 12, 'text-anchor': 'middle', class: 'sv-x' }, ['x']));
      } else {
        for (let b = 0; b < it.count; b++) {
          const bx = cx + b * (BOX_W + 14);
          svg.append(el('rect', { x: bx, y: by, width: BOX_W, height: BOX_H, rx: 6, class: 'vm-box' }));
          svg.append(el('text', { x: bx + BOX_W / 2, y: by + BOX_H / 2 + 12, 'text-anchor': 'middle', class: 'sv-x' }, ['x']));
        }
      }
    } else if (it.type === 'counters') {
      drawCounters(svg, cx, y, h, it.n, it.sign, it.struck, it.added);
    } else {
      const gw = boxShape(it.size).cols * CELL;
      for (let g = 0; g < it.count; g++) {
        const gx = cx + g * (gw + 14);
        drawCounters(svg, gx, y, h, it.size, '+');
        svg.append(el('rect', { x: gx - 3, y: y + (h - boxShape(it.size).rows * CELL) / 2 - 3, width: gw + 6, height: boxShape(it.size).rows * CELL + 6, rx: 6, class: 'sv-group' }));
      }
    }
    cx += w + GAP;
  }
}

const rowWidth = (row) => sideWidth(row.left) + MIDDLE + sideWidth(row.right);

function drawRow(svg, row, y, width) {
  const h = rowHeight(row);
  const x0 = Math.max(10, (width - rowWidth(row)) / 2);
  svg.append(el('text', { x: width / 2, y: y + 22, 'text-anchor': 'middle', class: 'sv-label' }, [row.label]));
  const top = y + 38;
  drawSide(svg, x0, top, h, row.left);
  svg.append(el('text', { x: x0 + sideWidth(row.left) + MIDDLE / 2, y: top + h / 2 + 16, 'text-anchor': 'middle', class: 'vm-plus' }, ['=']));
  drawSide(svg, x0 + sideWidth(row.left) + MIDDLE, top, h, row.right);
  return top + h + ROW_GAP;
}

export function renderSolveMat({ problem, rung = 0, tried = null, typed = '', done = false, finalText = '' }) {
  const rows = balanceRows(problem, rung);
  const W = Math.max(VIEW_WIDTH, ...rows.map((r) => rowWidth(r) + 40));
  const svg = el('svg', { class: 'mat value-mat solve-mat', viewBox: `0 0 ${W} 400`, role: 'group', 'aria-label': 'The Solve it Mat' });
  svg.append(el('text', { x: W / 2, y: 80, 'text-anchor': 'middle', class: 'vm-problem' }, [formatEquation(problem)]));
  let y = 130;

  // The answer put back in: does it balance?
  if (tried !== null && (rung >= 1 || done)) {
    const line = el('text', { x: W / 2, y: y + 30, 'text-anchor': 'middle', class: 'sv-check' });
    substituteSegments(problem, tried).forEach((seg, i) => line.append(el('tspan', { class: seg.sub ? 'vm-sub' : null, dx: i === 0 || seg.joined ? 0 : 14 }, [seg.text])));
    svg.append(line);
    const bal = balanceOf(problem, tried);
    svg.append(el('text', { x: W / 2, y: y + 76, 'text-anchor': 'middle', class: `sv-verdict ${bal.balanced ? 'is-good' : 'is-bad'}` },
      [bal.balanced ? `${bal.text} = ${bal.right}   ✓ balanced` : `${bal.text} ≠ ${bal.right}   ✗ not balanced`]));
    y += 110;
  }

  for (const row of rows) y = drawRow(svg, row, y, W);

  const text = done ? finalText : typed.replace(/-/g, MINUS);
  svg.append(el('text', { x: W / 2, y: y + 56, 'text-anchor': 'middle', class: `vm-answer${text ? '' : ' is-empty'}${done ? ' is-done' : ''}` }, [`x = ${text || '?'}`]));
  if (!done) svg.append(el('line', { x1: W / 2 - 70, y1: y + 70, x2: W / 2 + 130, y2: y + 70, class: 'vm-rule' }));
  svg.setAttribute('viewBox', `0 0 ${W} ${y + 92}`);
  return svg;
}

export { leftOf, signed };
