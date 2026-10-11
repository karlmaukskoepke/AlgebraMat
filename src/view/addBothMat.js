// The Add to both sides Mat (SPEC-ADD-TO-BOTH-SIDES.md §3): the equation, the balance readout and the lights, and the
// board: the box for x and the numbers as groups of counters (or as symbols), either side of a dashed border. Groups can be
// tapped (to combine two, to cross the border); while building (L1–L2) there are chips to add counters. Inline SVG; the
// layout is plain data (`boardItems`) so it can be tested.

import { MINUS } from '../engine/expr.js';
import { formatAddBoth, signed } from '../engine/addBoth.js';
import { xSideOf, tilt, balanced, kindOf } from '../engine/addBothMoves.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

export const VIEW_WIDTH = 900;
const CELL = 24;
const BOX_W = 76;
const BOX_H = 64;
const TOKEN_H = 56;
const GAP = 44;
const MIDDLE = 100;
const MAX_COLS = 12;

// How a group of n counters sits: up to 3 rows.
export function groupShape(n) {
  const rows = n > 6 ? 3 : n > 3 ? 2 : 1;
  const cols = Math.min(MAX_COLS, Math.max(1, Math.ceil(n / rows)));
  return { rows, cols, width: cols * CELL + 20, height: rows * CELL + 20 };
}

// What is on the board, as data: each side's items with their widths. `mode` is 'counters' or 'symbols'.
export function boardItems(s) {
  const counters = s.counterMode;
  const item = (t) => {
    if (t.kind === 'x') return { type: 'x', id: t.id, width: BOX_W, height: BOX_H };
    if (!counters || (t.v === 0 && !t.slot)) return { type: 'token', id: t.id, slot: t.slot, v: t.v, width: Math.max(72, 28 + String(signed(t.v)).length * 22), height: TOKEN_H };
    // (a building slot is drawn wide enough for its chips, and tall enough for a row of nine)
    const g = groupShape(t.slot ? Math.max(Math.abs(t.v), 9) : Math.abs(t.v));
    return { type: 'group', id: t.id, slot: t.slot, v: t.v, n: Math.abs(t.v), shape: g, width: t.slot ? Math.max(g.width, 160) : g.width, height: g.height };
  };
  const board = s.stage === 'build' ? buildBoard(s) : s.board;
  return { left: board.left.map(item), right: board.right.map(item) };
}

// While building (L1–L2): the x box and the groups the student has made so far (empty ones are drawn as dashed slots).
function buildBoard(s) {
  const xSide = s.problem.mirror ? 'right' : 'left';
  const x = { id: 'bx', kind: 'x' };
  const constant = { id: 'bc', kind: 'num', v: s.built.constant, slot: 'constant' };
  const other = { id: 'bo', kind: 'num', v: s.built.other, slot: 'other' };
  return xSide === 'left' ? { left: [x, constant], right: [other] } : { left: [other], right: [x, constant] };
}

const sideWidth = (items) => items.reduce((w, i) => w + i.width, 0) + GAP * Math.max(0, items.length - 1);
const rowHeight = (items) => Math.max(BOX_H, ...items.map((i) => i.height));

function counterMark(parent, cx, cy, sign, cls) {
  const g = el('g', { class: `bm-mark${cls ? ` ${cls}` : ''}` });
  g.append(el('line', { x1: cx - 8, y1: cy, x2: cx + 8, y2: cy, class: 'mark' }));
  if (sign > 0) g.append(el('line', { x1: cx, y1: cy - 8, x2: cx, y2: cy + 8, class: 'mark' }));
  parent.append(g);
}

function lamp(parent, x, y, label, state) {
  const g = el('g', { class: `ab-lamp is-${state}` });
  g.append(el('circle', { cx: x, cy: y, r: 13, class: 'ab-lamp-dot' }));
  g.append(el('text', { x, y: y + 6, 'text-anchor': 'middle', class: 'ab-lamp-glyph' }, [state === 'green' ? '✓' : state === 'red' ? '✗' : state === 'neutral' ? '–' : '']));
  g.append(el('text', { x: x + 22, y: y + 8, class: 'ab-lamp-label' }, [label]));
  parent.append(g);
}

const tiltText = (s) => {
  if (balanced(s)) return 'Balanced ✓';
  const n = Math.abs(tilt(s));
  return `Unbalanced ✗  the ${tilt(s) > 0 ? 'left' : 'right'} side is heavier by ${n}`;
};

export function renderAddBothMat(s) {
  const items = boardItems(s);
  const W = Math.max(VIEW_WIDTH, sideWidth(items.left) + MIDDLE + sideWidth(items.right) + 60);
  const svg = el('svg', { class: 'mat value-mat addboth-mat', viewBox: `0 0 ${W} 520`, role: 'group', 'aria-label': 'The Add to both sides Mat' });
  svg.append(el('text', { x: W / 2, y: 70, 'text-anchor': 'middle', class: 'vm-problem ab-problem' }, [formatAddBoth(s.problem)]));

  // the balance readout, and the lights
  let y = 112;
  if (s.stage !== 'build') {
    svg.append(el('text', { x: W / 2, y, 'text-anchor': 'middle', class: `ab-readout ${balanced(s) ? 'is-good' : 'is-bad'}` }, [tiltText(s)]));
    y += 34;
    const names = [['fewer', 'Fewer terms'], ['xAlone', 'x alone'], ...(s.level >= 4 ? [['xLeft', 'x on the left']] : [])];
    const width = names.length * 210;
    names.forEach(([key, label], i) => lamp(svg, W / 2 - width / 2 + 24 + i * 210, y, label, s.lights[key]));
    y += 44;
  } else y += 20;

  // the board
  const h = Math.max(rowHeight(items.left), rowHeight(items.right));
  const total = sideWidth(items.left) + MIDDLE + sideWidth(items.right);
  const x0 = (W - total) / 2;
  const top = y + 30;
  const borderX = x0 + sideWidth(items.left) + MIDDLE / 2;
  svg.append(el('line', { x1: borderX, y1: top - 22, x2: borderX, y2: top + h + 22, class: 'sv-border' }));
  svg.append(el('text', { x: borderX, y: top + h / 2 + 14, 'text-anchor': 'middle', class: 'vm-plus ab-equals' }, ['=']));
  svg.setAttribute('data-border-x', String(borderX));
  const cls = (id) => `${s.selected === id ? ' is-selected' : ''}${s.combining && (s.combining.a === id || s.combining.b === id) ? ' is-combining' : ''}${s.hint?.kind === 'cancel' && s.hint.id === id ? ' is-hint' : ''}${s.pending?.kind === 'cross' && s.pending.id === id ? ' is-crossing' : ''}`;
  const tapAction = (id) => (s.menu === 'cross' ? (s.pending?.kind === 'cross' && s.pending.id === id ? 'flipSign' : 'cross') : 'select');
  const struck = struckCounts(s);

  const drawSide = (list, startX) => {
    let cx = startX;
    list.forEach((it, i) => {
      const cy = top + (h - it.height) / 2;
      if (i > 0) svg.append(el('text', { x: cx - GAP / 2, y: top + h / 2 + 12, 'text-anchor': 'middle', class: 'ab-plus' }, ['+']));
      if (it.type === 'x') {
        const clickable = s.early?.step === 'drag';
        const box = el('g', { class: `ab-x${clickable ? ' is-target' : ''}`, 'data-x': '1', ...(clickable ? { 'data-action': 'dropValue', role: 'button', tabindex: '0', 'aria-label': 'Put your answer in for x' } : {}) });
        box.append(el('rect', { x: cx, y: cy, width: BOX_W, height: BOX_H, rx: 6, class: 'vm-box' }));
        box.append(el('text', { x: cx + BOX_W / 2, y: cy + BOX_H / 2 + 12, 'text-anchor': 'middle', class: 'sv-x' }, ['x']));
        svg.append(box);
      } else if (it.type === 'token') {
        const g = el('g', { class: `ab-token${cls(it.id)}`, 'data-action': tapAction(it.id), 'data-id': it.id, role: 'button', tabindex: '0', 'aria-label': `Group ${signed(it.v)}` });
        g.append(el('rect', { x: cx, y: cy, width: it.width, height: it.height, rx: 12, class: 'ab-token-box' }));
        g.append(el('text', { x: cx + it.width / 2, y: cy + it.height / 2 + 12, 'text-anchor': 'middle', class: 'ab-token-text' }, [signed(it.v)]));
        svg.append(g);
      } else {
        const attrs = s.stage === 'build'
          ? { 'data-group': it.slot }
          : { 'data-action': tapAction(it.id), 'data-id': it.id, role: 'button', tabindex: '0', 'aria-label': `Group of ${signed(it.v)}` };
        const g = el('g', { class: `ab-group${cls(it.id)}${it.v < 0 ? ' is-negative' : ''}`, ...attrs });
        g.append(el('rect', { x: cx, y: cy, width: it.width, height: it.height, rx: 12, class: 'ab-group-box' }));
        const k = struck[it.id] ?? 0;
        for (let n = 0; n < it.n; n++) {
          const mx = cx + 10 + (n % it.shape.cols) * CELL + CELL / 2;
          const my = cy + 10 + Math.floor(n / it.shape.cols) * CELL + CELL / 2;
          counterMark(g, mx, my, Math.sign(it.v), n < k ? 'sv-struck' : '');
          if (n < k) g.append(el('line', { x1: mx - 9, y1: my + 9, x2: mx + 9, y2: my - 9, class: 'sv-slash' }));
        }
        svg.append(g);
      }
      cx += it.width + GAP;
    });
  };
  drawSide(items.left, x0);
  drawSide(items.right, x0 + sideWidth(items.left) + MIDDLE);

  // building: chips under each group
  let bottom = top + h + 40;
  if (s.stage === 'build') {
    const chip = (cx0, slot, sign, label) => {
      const g = el('g', { class: 'ab-chip-btn', 'data-action': 'buildTap', 'data-group': slot, 'data-sign': sign, role: 'button', tabindex: '0', 'aria-label': `Add a ${sign === '+' ? 'positive' : 'negative'} counter` });
      g.append(el('rect', { x: cx0, y: bottom, width: 64, height: 48, rx: 12, class: 'ab-chip-box' }));
      g.append(el('text', { x: cx0 + 32, y: bottom + 33, 'text-anchor': 'middle', class: 'ab-chip-text' }, [label]));
      svg.append(g);
    };
    const place = (list, startX) => {
      let cx = startX;
      list.forEach((it) => {
        if (it.type === 'group' || it.type === 'token') {
          const mid = cx + it.width / 2;
          const slot = it.slot;
          chip(mid - 76, slot, '+', '+');
          chip(mid + 12, slot, '-', MINUS);
          const rm = el('g', { class: 'ab-chip-btn', 'data-action': 'buildTap', 'data-group': slot, 'data-remove': '1', role: 'button', tabindex: '0', 'aria-label': 'Take a counter off' });
          rm.append(el('rect', { x: mid - 66, y: bottom + 58, width: 132, height: 40, rx: 12, class: 'ab-chip-box is-quiet' }));
          rm.append(el('text', { x: mid, y: bottom + 84, 'text-anchor': 'middle', class: 'ab-chip-small' }, ['take one off']));
          svg.append(rm);
        }
        cx += it.width + GAP;
      });
    };
    place(items.left, x0);
    place(items.right, x0 + sideWidth(items.left) + MIDDLE);
    bottom += 110;
  }

  // the early answer: the number to drop onto x, and the steps of the check
  if (s.early?.step === 'drag') {
    const g = el('g', { class: 'ab-chip', 'data-chip': '1', role: 'img', 'aria-label': `Your answer ${signed(s.early.typed)}` });
    g.append(el('circle', { cx: W / 2, cy: bottom + 28, r: 34, class: 'ab-chip-dot' }));
    g.append(el('text', { x: W / 2, y: bottom + 40, 'text-anchor': 'middle', class: 'ab-chip-value' }, [signed(s.early.typed)]));
    svg.append(g);
    svg.append(el('text', { x: W / 2, y: bottom + 92, 'text-anchor': 'middle', class: 'ab-note' }, ['Drag it onto x, or tap x']));
    bottom += 110;
  }
  if (s.early?.step === 'check' || s.early?.step === 'move') {
    const lines = s.early.step === 'check' ? s.early.lines.slice(0, s.early.shown + 1) : s.early.lines;
    lines.forEach((line, i) => {
      const last = i === s.early.lines.length - 1;
      const bad = last && line.includes('Unbalanced');
      svg.append(el('text', { x: W / 2, y: bottom + 36 + i * 48, 'text-anchor': 'middle', class: `ab-check${last ? (bad ? ' is-bad' : ' is-good') : ''}` }, [line]));
    });
    bottom += lines.length * 48 + 40;
  }

  // the answer line
  const done = s.stage === 'done';
  const text = done ? s.finalText : s.entry.replace(/-/g, MINUS);
  const showAnswer = s.stage !== 'build';
  if (showAnswer) {
    svg.append(el('text', { x: W / 2, y: bottom + 40, 'text-anchor': 'middle', class: `vm-answer${text ? '' : ' is-empty'}${done ? ' is-done' : ''}` }, [`x = ${text || '?'}`]));
    if (!done) svg.append(el('line', { x1: W / 2 - 70, y1: bottom + 54, x2: W / 2 + 130, y2: bottom + 54, class: 'vm-rule' }));
    bottom += 70;
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${bottom + 20}`);
  return svg;
}

// While two groups are being combined and the student has asked to cross them off: the pairs struck, as counts per group id.
function struckCounts(s) {
  const c = s.combining;
  if (!c || !c.crossed || c.kind !== 'battle') return {};
  const find = (id) => [...s.board.left, ...s.board.right].find((t) => t.id === id);
  const a = find(c.a);
  const b = find(c.b);
  if (!a || !b || kindOf(a.v, b.v) !== 'battle') return {};
  const pairs = Math.min(Math.abs(a.v), Math.abs(b.v));
  return { [a.id]: pairs, [b.id]: pairs };
}

export { xSideOf };
