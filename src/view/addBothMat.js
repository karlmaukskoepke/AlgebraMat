// The Add to both sides Mat (SPEC-ADD-TO-BOTH-SIDES.md §3), redrawn after Karl's first look. From the top: the word Balanced or
// Unbalanced with a seesaw that rests on the dashed border and tips as things are added; the counters and the x box (the board),
// either side of that dashed border; the equation under them; a tray of pieces to drag up (while building, and while adding);
// and, beside it all, a "Balancing moves" panel with the moves and the checkboxes. The board is an SVG; the tray and the panel
// are plain buttons, so every target is a real 44 px. The layout is plain data (`boardItems`) so it can be tested.

import { MINUS } from '../engine/expr.js';
import { formatAddBoth, signed } from '../engine/addBoth.js';
import { xSideOf, tilt, balanced, kindOf, sideValueText, MOVES_BY_LEVEL } from '../engine/addBothMoves.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  node.append(...children);
  return node;
}
export function html(tag, cls, children = [], attrs = {}) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  node.append(...[].concat(children));
  return node;
}

export const VIEW_WIDTH = 620;
const CELL = 26;
const BOX_W = 80;
const BOX_H = 68;
const TOKEN_H = 60;
const GAP = 46;
const MIDDLE = 90;
const MAX_COLS = 9;
const MIN_SIDE = 230;
const BEAM_Y = 112;

// How a group of n counters sits: up to 3 rows.
export function groupShape(n) {
  const rows = n > 6 ? 3 : n > 3 ? 2 : 1;
  const cols = Math.min(MAX_COLS, Math.max(1, Math.ceil(n / rows)));
  return { rows, cols, width: cols * CELL + 22, height: rows * CELL + 22 };
}

// What is on the board, as data: each side's items with their widths. While building, only what the student has put up.
export function boardItems(s) {
  const counters = s.counterMode || s.stage === 'build';
  const item = (t) => {
    if (t.kind === 'x') return { type: 'x', id: t.id, width: BOX_W, height: BOX_H };
    if (!counters || t.v === 0) return { type: 'token', id: t.id, v: t.v, width: Math.max(76, 30 + String(signed(t.v)).length * 24), height: TOKEN_H };
    const g = groupShape(Math.abs(t.v));
    return { type: 'group', id: t.id, slot: t.slot, v: t.v, n: Math.abs(t.v), shape: g, width: g.width, height: g.height };
  };
  const board = s.stage === 'build' ? buildBoard(s) : s.board;
  return { left: board.left.map(item), right: board.right.map(item) };
}

// While building: the x box (once it is up) and the groups of counters on each side.
function buildBoard(s) {
  const xRight = Boolean(s.problem.mirror);
  const x = s.built.x ? [{ id: 'bx', kind: 'x' }] : [];
  const constant = s.built.constant !== 0 ? [{ id: 'bc', kind: 'num', v: s.built.constant, slot: 'constant' }] : [];
  const other = s.built.other !== 0 ? [{ id: 'bo', kind: 'num', v: s.built.other, slot: 'other' }] : [];
  return xRight ? { left: other, right: [...x, ...constant] } : { left: [...x, ...constant], right: other };
}

const sideWidth = (items) => Math.max(MIN_SIDE, items.reduce((w, i) => w + i.width, 0) + GAP * Math.max(0, items.length - 1) + 40);
const rowHeight = (items) => Math.max(BOX_H, ...items.map((i) => i.height));

function counterMark(parent, cx, cy, sign, cls) {
  const g = el('g', { class: `bm-mark${cls ? ` ${cls}` : ''}` });
  g.append(el('line', { x1: cx - 8, y1: cy, x2: cx + 8, y2: cy, class: 'mark' }));
  if (sign > 0) g.append(el('line', { x1: cx, y1: cy - 8, x2: cx, y2: cy + 8, class: 'mark' }));
  parent.append(g);
}

const tiltText = (s) => {
  if (balanced(s)) return 'Balanced ✓';
  return `Unbalanced ✗   the ${tilt(s) > 0 ? 'left' : 'right'} side is heavier by ${Math.abs(tilt(s))}`;
};
// The seesaw tips toward the heavier side, up to 8 degrees.
const tipAngle = (s) => (s.stage === 'build' ? 0 : Math.max(-8, Math.min(8, -tilt(s) * 2.5)));
let lastAngle = 0;
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// The seesaw: a beam on a pivot at the border, tipped `angle` degrees (it eases from where it was).
export function drawSeesaw(svg, cx, cy, half, angle) {
  const pivot = el('g', { transform: `translate(${cx} ${cy})` });
  pivot.append(el('polygon', { points: '-22,46 22,46 0,2', class: 'ab-pivot' }));
  const beam = el('g', { class: 'ab-beam', style: `transform: rotate(${angle}deg)` });
  beam.append(el('line', { x1: -half, y1: 0, x2: half, y2: 0, class: 'ab-beam-bar' }));
  for (const sx of [-half, half]) beam.append(el('circle', { cx: sx, cy: 0, r: 13, class: 'ab-beam-end' }));
  pivot.append(beam);
  svg.append(pivot);
  if (!reduceMotion() && angle !== lastAngle && typeof beam.animate === 'function') {
    beam.animate([{ transform: `rotate(${lastAngle}deg)` }, { transform: `rotate(${angle}deg)` }], { duration: 650, easing: 'cubic-bezier(.3,1.6,.5,1)' });
  }
  lastAngle = angle;
}
export const angleFor = (delta) => Math.max(-8, Math.min(8, -delta * 2.5));

export function renderAddBothMat(s) {
  const wrap = html('div', `ab-game${s.stage === 'build' ? ' is-building' : ''}`);
  const main = html('div', 'ab-main');
  main.append(boardSvg(s));
  const tray = trayFor(s);
  if (tray) main.append(tray);
  wrap.append(main, panelFor(s, { replay: true }));
  return wrap;
}

export function boardSvg(s) {
  const items = boardItems(s);
  const lw = Math.max(sideWidth(items.left), sideWidth(items.right));   // both sides alike, so the border (and the seesaw's pivot) is the middle
  const rw = lw;
  const W = Math.max(VIEW_WIDTH, lw + MIDDLE + rw + 40);
  const svg = el('svg', { class: 'mat value-mat addboth-mat', viewBox: `0 0 ${W} 520`, role: 'group', 'aria-label': 'The Add to both sides Mat' });
  const x0 = (W - (lw + MIDDLE + rw)) / 2;
  const borderX = x0 + lw + MIDDLE / 2;
  svg.setAttribute('data-border-x', String(borderX));

  // ---- the balance: the word, and the seesaw on the dashed border ----
  const building = s.stage === 'build';
  svg.append(el('text', { x: W / 2, y: 40, 'text-anchor': 'middle', class: `ab-readout ${building ? '' : balanced(s) ? 'is-good' : 'is-bad'}` }, [building ? 'Build the equation' : tiltText(s)]));
  drawSeesaw(svg, borderX, BEAM_Y, (lw + MIDDLE + rw) / 2, tipAngle(s));

  // ---- the board ----
  const top = BEAM_Y + 78;
  const h = Math.max(rowHeight(items.left), rowHeight(items.right), 96);
  const zonesOn = building || (s.stage === 'moves' && s.menu === 'add' && !s.combining);
  const zoneTop = top - 14;
  const zoneH = h + 28;
  const zone = (side, zx, zw) => {
    const g = el('g', { class: `ab-zone${zonesOn ? ' is-on' : ''}`, 'data-zone': side, ...(zonesOn ? { 'data-action': 'zone', 'data-side': side, role: 'button', tabindex: '0', 'aria-label': `Put it on the ${side} side` } : {}) });
    g.append(el('rect', { x: zx, y: zoneTop, width: zw, height: zoneH, rx: 16, class: 'ab-zone-box' }));
    svg.append(g);
  };
  zone('left', x0, lw);
  zone('right', x0 + lw + MIDDLE, rw);
  svg.append(el('line', { x1: borderX, y1: BEAM_Y + 46, x2: borderX, y2: zoneTop + zoneH + 78, class: 'sv-border' }));

  const cls = (id) => `${s.selected === id ? ' is-selected' : ''}${s.combining && (s.combining.a === id || s.combining.b === id) ? ' is-combining' : ''}${s.hint?.kind === 'cancel' && s.hint.id === id ? ' is-hint' : ''}${s.pending?.kind === 'cross' && s.pending.id === id ? ' is-crossing' : ''}`;
  const tapAction = (id) => (s.menu === 'cross' ? (s.pending?.kind === 'cross' && s.pending.id === id ? 'flipSign' : 'cross') : 'select');
  const struck = struckCounts(s);

  const drawSide = (list, startX, sw, side) => {
    const out = el('g', { class: `ab-sideg ab-sideg-${side}` });
    const used = list.reduce((w, i) => w + i.width, 0) + GAP * Math.max(0, list.length - 1);
    let cx = startX + (sw - used) / 2;
    if (!list.length && building) out.append(el('text', { x: startX + sw / 2, y: top + h / 2 + 8, 'text-anchor': 'middle', class: 'ab-drophere' }, ['drop here']));
    list.forEach((it, i) => {
      const cy = top + (h - it.height) / 2;
      if (i > 0) out.append(el('text', { x: cx - GAP / 2, y: top + h / 2 + 12, 'text-anchor': 'middle', class: 'ab-plus' }, ['+']));
      if (it.type === 'x') {
        const early = s.early?.step === 'drag';
        const attrs = building
          ? { 'data-action': 'buildRemove', 'data-side': side, 'data-what': 'x', role: 'button', tabindex: '0', 'aria-label': 'Take the box back off' }
          : early ? { 'data-action': 'dropValue', role: 'button', tabindex: '0', 'aria-label': 'Put your answer in for x' } : {};
        const box = el('g', { class: `ab-x${early ? ' is-target' : ''}`, 'data-x': '1', ...attrs });
        box.append(el('rect', { x: cx, y: cy, width: BOX_W, height: BOX_H, rx: 6, class: 'vm-box' }));
        box.append(el('text', { x: cx + BOX_W / 2, y: cy + BOX_H / 2 + 12, 'text-anchor': 'middle', class: 'sv-x' }, ['x']));
        out.append(box);
      } else if (it.type === 'token') {
        const g = el('g', { class: `ab-token${cls(it.id)}`, 'data-action': tapAction(it.id), 'data-id': it.id, 'data-numval': it.v, role: 'button', tabindex: '0', 'aria-label': `Group ${signed(it.v)}` });
        g.append(el('rect', { x: cx, y: cy, width: it.width, height: it.height, rx: 12, class: 'ab-token-box' }));
        g.append(el('text', { x: cx + it.width / 2, y: cy + it.height / 2 + 12, 'text-anchor': 'middle', class: 'ab-token-text' }, [signed(it.v)]));
        out.append(g);
      } else {
        const attrs = building
          ? { 'data-action': 'buildRemove', 'data-side': side, role: 'button', tabindex: '0', 'aria-label': `Take a counter off the ${side} side` }
          : { 'data-action': tapAction(it.id), 'data-id': it.id, 'data-numval': it.v, role: 'button', tabindex: '0', 'aria-label': `Group of ${signed(it.v)}` };
        const g = el('g', { class: `ab-group${cls(it.id)}${it.v < 0 ? ' is-negative' : ''}`, ...attrs });
        g.append(el('rect', { x: cx, y: cy, width: it.width, height: it.height, rx: 12, class: 'ab-group-box' }));
        const k = struck[it.id] ?? 0;
        for (let n = 0; n < it.n; n++) {
          const mx = cx + 11 + (n % it.shape.cols) * CELL + CELL / 2;
          const my = cy + 11 + Math.floor(n / it.shape.cols) * CELL + CELL / 2;
          counterMark(g, mx, my, Math.sign(it.v), n < k ? 'sv-struck' : '');
          if (n < k) g.append(el('line', { x1: mx - 9, y1: my + 9, x2: mx + 9, y2: my - 9, class: 'sv-slash' }));
        }
        out.append(g);
      }
      cx += it.width + GAP;
    });
    svg.append(out);
    return out;
  };

  const gl = drawSide(items.left, x0, lw, 'left');
  const gr = drawSide(items.right, x0 + lw + MIDDLE, rw, 'right');
  // Trade places: the side now on the left travels up and over from the right, the other down and over, around the border.
  if (s.anim === 'trade' && !reduceMotion()) {
    const dist = lw + MIDDLE;
    const arc = (dx, dy) => [{ transform: `translate(${dx}px, 0px)` }, { transform: `translate(${dx / 2}px, ${dy}px)`, offset: 0.5 }, { transform: 'translate(0px, 0px)' }];
    requestAnimationFrame(() => { try { gl.animate(arc(dist, -60), { duration: 900, easing: 'ease-in-out' }); gr.animate(arc(-dist, 60), { duration: 900, easing: 'ease-in-out' }); } catch { /* no animation: the sides just swap */ } });
  }

  // ---- the equation, under the board, with the border through the = ----
  let y = zoneTop + zoneH + 56;
  const base = s.stage === 'build' ? s.base : s.board;
  svg.append(el('text', { x: borderX - 34, y, 'text-anchor': 'end', class: 'ab-eq' }, [sideValueText(base.left)]));
  svg.append(el('text', { x: borderX, y, 'text-anchor': 'middle', class: 'ab-eq ab-equals' }, ['=']));
  svg.append(el('text', { x: borderX + 34, y, 'text-anchor': 'start', class: 'ab-eq' }, [sideValueText(base.right)]));
  y += 24;

  // ---- the early answer's drag-check lines ----
  if (s.early?.step === 'check' || s.early?.step === 'move') {
    const lines = s.early.step === 'check' ? s.early.lines.slice(0, s.early.shown + 1) : s.early.lines;
    lines.forEach((line, i) => {
      const last = i === s.early.lines.length - 1;
      const bad = last && line.includes('Unbalanced');
      svg.append(el('text', { x: W / 2, y: y + 40 + i * 48, 'text-anchor': 'middle', class: `ab-check${last ? (bad ? ' is-bad' : ' is-good') : ''}` }, [line]));
    });
    y += lines.length * 48 + 30;
  }

  // ---- the answer line ----
  if (!building) {
    const done = s.stage === 'done';
    const text = done ? s.finalText : s.entry.replace(/-/g, MINUS);
    svg.append(el('text', { x: W / 2, y: y + 48, 'text-anchor': 'middle', class: `vm-answer${text ? '' : ' is-empty'}${done ? ' is-done' : ''}` }, [`x = ${text || '?'}`]));
    if (!done) svg.append(el('line', { x1: W / 2 - 70, y1: y + 62, x2: W / 2 + 130, y2: y + 62, class: 'vm-rule' }));
    y += 74;
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${y + 16}`);
  return svg;
}

// ---------- the tray: pieces to drag up ----------

function chip(label, attrs, cls = '') {
  const b = html('button', `ab-piece ${cls}`.trim(), [label], { type: 'button', ...attrs });
  return b;
}

export function trayFor(s) {
  if (s.early?.step === 'drag') {
    const t = html('div', 'ab-tray');
    t.append(html('p', 'ab-tray-note', ['Drag your answer up onto the x (or tap the x)']));
    t.append(chip(signed(s.early.typed), { 'data-chip': '1', 'aria-label': `Your answer ${signed(s.early.typed)}` }, 'is-answer'));
    return t;
  }
  const adding = s.stage === 'moves' && s.menu === 'add' && s.counterMode && !s.combining;
  if (s.stage !== 'build' && !adding) return null;
  const t = html('div', 'ab-tray');
  t.append(html('p', 'ab-tray-note', [s.stage === 'build' ? 'Drag up onto a side (or tap one, then tap a side)' : 'Drag a counter up onto each side']));
  const row = html('div', 'ab-tray-row');
  if (s.stage === 'build') {
    row.append(chip('x', { 'data-piece': 'x', 'data-action': 'pickPiece', 'aria-label': 'The box for x' }, `is-box${s.pick === 'x' ? ' is-picked' : ''}`));
  }
  row.append(chip('+', { 'data-piece': '+', 'data-action': 'pickPiece', 'aria-label': 'Plus counter' }, s.pick === '+' ? 'is-picked' : ''));
  row.append(chip(MINUS, { 'data-piece': '-', 'data-action': 'pickPiece', 'aria-label': 'Minus counter' }, s.pick === '-' ? 'is-picked' : ''));
  t.append(row);
  return t;
}

// ---------- the Balancing moves panel ----------

export function panelFor(s, { replay = false } = {}) {
  const panel = html('aside', 'ab-panel', [], { 'aria-label': 'Balancing moves' });
  panel.append(html('h3', 'ab-panel-title', ['Balancing moves']));
  const done = s.stage === 'done';
  const building = s.stage === 'build';
  const combining = Boolean(s.combining);
  const mid = Boolean(s.pending);
  const checking = s.early?.step === 'drag' || s.early?.step === 'check';
  const choosing = !building && !done && !combining && !mid && !checking;
  const allowed = MOVES_BY_LEVEL(s.level);

  const moves = html('div', 'ab-moves');
  const blankText = s.amountEntry ? s.amountEntry.replace('-', MINUS) : '___';
  const blank = html('span', `ab-blank${s.menu === 'add' ? ' is-active' : ''}${s.amountEntry ? '' : ' is-empty'}`, [blankText], { 'data-blank': '1' });
  const labels = {
    add: ['Add ', blank, ' to both sides'],
    trade: ['Trade places'],
    cross: ['Cross the border'],
  };
  for (const m of allowed) {
    const b = html('button', `btn btn-move ab-move${s.menu === m ? ' is-on' : ''}`, labels[m], { type: 'button', 'data-action': 'choose', 'data-move': m });
    b.disabled = !choosing || s.stage !== 'moves';
    moves.append(b);
  }
  panel.append(moves);

  const sub = html('div', 'ab-sub');
  const crossing = s.pending?.kind === 'cross';
  if (!building && !done && !combining && (s.menu === 'add' || crossing)) {
    if (!crossing) {
      const l = html('button', 'btn ab-side', ['Add to left'], { type: 'button', 'data-action': 'addTo', 'data-side': 'left' });
      const r = html('button', 'btn ab-side', ['Add to right'], { type: 'button', 'data-action': 'addTo', 'data-side': 'right' });
      l.disabled = Boolean(mid && s.pending.side === 'left');
      r.disabled = Boolean(mid && s.pending.side === 'right');
      sub.append(l, r);
    }
    const go = html('button', 'btn btn-primary', ['Go ▶'], { type: 'button', 'data-action': 'go' });
    go.disabled = !(mid && s.pending.both) || s.leftDelta !== s.rightDelta;
    sub.append(go);
  }
  if (combining) {
    const inKind = s.combining.step === 'kind';
    if (inKind) {
      sub.append(html('button', 'btn btn-party', ['Party!'], { type: 'button', 'data-action': 'kind', 'data-value': 'party' }),
        html('button', 'btn btn-battle', ['Battle!'], { type: 'button', 'data-action': 'kind', 'data-value': 'battle' }));
    } else if (!s.combining.crossed && s.combining.kind === 'battle') {
      sub.append(html('button', 'btn', ['Cross off for me'], { type: 'button', 'data-action': 'crossOff' }));
    }
    sub.append(html('button', 'btn btn-quiet', ['Never mind'], { type: 'button', 'data-action': 'abandon' }));
  }
  if (s.early?.step === 'check') sub.append(html('button', 'btn btn-primary', ['Next ▸'], { type: 'button', 'data-action': 'nextLine' }));
  if (sub.childNodes.length) panel.append(sub);

  // the checkboxes: what a good move earns
  const names = [['fewer', 'Fewer terms'], ['xAlone', 'x alone'], ...(s.level >= 4 ? [['xLeft', 'x on the left']] : [])];
  const goals = html('ul', 'ab-goals', [], { 'aria-label': 'Goals' });
  for (const [key, label] of names) {
    const state = building ? 'off' : s.lights[key];
    const box = html('span', `ab-checkbox is-${state}`, [state === 'green' ? '✓' : state === 'red' ? '✗' : state === 'neutral' ? '–' : ''], { 'aria-hidden': 'true' });
    goals.append(html('li', `ab-goal is-${state}`, [box, html('span', 'ab-goal-label', [label])]));
  }
  panel.append(goals);
  if (replay && !done) {
    panel.append(html('button', 'btn btn-quiet ab-replay', ['Replay tutorial'], { type: 'button', 'data-action': 'replayTutorial' }));
  }
  return panel;
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

export { xSideOf, formatAddBoth };
