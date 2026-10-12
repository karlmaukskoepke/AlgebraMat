// The Add to both sides Mat (SPEC-ADD-TO-BOTH-SIDES.md §3), redrawn after Karl's first look. From the top: the word Balanced or
// Unbalanced with a seesaw that rests on the dashed border and tips as things are added; the counters and the x box (the board),
// either side of that dashed border; the equation under them; a tray of pieces to drag up (while building, and while adding);
// and, beside it all, a "Balancing moves" panel with the moves and the checkboxes. The board is an SVG; the tray and the panel
// are plain buttons, so every target is a real 44 px. The layout is plain data (`boardItems`) so it can be tested.

import { MINUS } from '../engine/expr.js';
import { formatAddBoth, signed } from '../engine/addBoth.js';
import { xSideOf, tilt, balanced, kindOf, sideValueText } from '../engine/addBothMoves.js';

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
const BEAM_PAD = 46;

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

// Has an amount been typed (or is a move under way)? Only then do the places to put it appear.
export const hasAmount = (s) => Boolean(s.pending) || (/^-?\d+$/.test(s.amountEntry ?? '') && Number(s.amountEntry) !== 0);

const tiltText = (s) => {
  if (balanced(s)) return 'Balanced ✓';
  return `Unbalanced ✗   the ${tilt(s) > 0 ? 'left' : 'right'} side is heavier by ${Math.abs(tilt(s))}`;
};
// The seesaw tips toward the heavier side, up to 8 degrees.
const tipAngle = (s) => (s.stage === 'build' ? 0 : Math.max(-8, Math.min(8, -tilt(s) * 2.5)));
let lastAngle = 0;
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const angleFor = (delta) => Math.max(-8, Math.min(8, -delta * 2.5));

// The board with, when an amount is being added, one button under each side ("Add −3 here"): the action sits on the side it
// changes. They are real buttons laid over the drawing (placed by percentages of its size), so they stay 44 px or more.
export function boardBlock(s) {
  const { top, bottom, geo, sideBtnsOn } = boardSvg(s);
  const block = html('div', 'ab-boardwrap');
  const [, , vw, vh] = top.getAttribute('viewBox').split(' ').map(Number);
  block.style.setProperty('--ar', String(vw / (vh + 150)));
  block.append(top);
  if (sideBtnsOn) block.append(sideButtons(geo, s.amountEntry, s.pending));
  block.append(bottom);
  const done = s.stage === 'done';
  const flow = !done && s.stage === 'moves' && !s.combining && !s.resolving && (s.menu === 'add' || s.pending?.kind === 'cross');
  const row = actionRow({
    undo: !done && s.stage !== 'build' && s.history.length > 0,
    go: flow ? 'Go ▶' : null,
    goDisabled: !(s.pending?.both) || s.leftDelta !== s.rightDelta,
  });
  if (row) block.append(row);
  return block;
}

// The balance (Karl: the models stand on the seesaw). The beam tips; the board's items (the x box, groups of counters or
// numbers) stand on it, so what is added to a side shows up on that side of the balance. A pivot sits under the middle, and
// the dashed border runs up and down through it. `ctx`: { top (room for the readout), readout: {text, cls, size}, building,
// zonesOn, early, tapAction(id), cls(id), struck, angle, anim, hint, dropText }.
export function drawBalance(svg, items, ctx) {
  const lw = Math.max(sideWidth(items.left), sideWidth(items.right));   // both sides alike, so the border (and the pivot) is the middle
  const rw = lw;
  const W = Math.max(VIEW_WIDTH, lw + MIDDLE + rw + 40);
  const x0 = (W - (lw + MIDDLE + rw)) / 2;
  const borderX = x0 + lw + MIDDLE / 2;
  const h = Math.max(rowHeight(items.left), rowHeight(items.right), 96);
  const zoneH = h + 28;
  const zoneTop = (ctx.top ?? 64) + BEAM_PAD;
  const beamY = zoneTop + zoneH + 12;
  const split = beamY + 64;
  const { building } = ctx;
  svg.setAttribute('viewBox', `0 0 ${W} ${split}`);
  svg.setAttribute('data-border-x', String(borderX));

  if (ctx.readout) svg.append(el('text', { x: W / 2, y: ctx.readout.y ?? 34, 'text-anchor': 'middle', class: `ab-readout ${ctx.readout.cls ?? ''}`, ...(ctx.readout.size ? { style: `font-size:${ctx.readout.size}px` } : {}) }, [ctx.readout.text]));
  svg.append(el('line', { x1: borderX, y1: zoneTop - 14, x2: borderX, y2: split, class: 'sv-border', 'data-border': '1' }));

  // everything on the beam tips with it, about the pivot
  const rot = el('g', { class: 'ab-rot', style: `transform-origin: ${borderX}px ${beamY}px; transform: rotate(${ctx.angle ?? 0}deg)` });
  svg.append(rot);
  const zone = (side, zx, zw) => {
    const g = el('g', { class: `ab-zone${ctx.zonesOn ? ' is-on' : ''}`, 'data-zone': side, ...(ctx.zonesOn ? { 'data-action': 'zone', 'data-side': side, role: 'button', tabindex: '0', 'aria-label': `Put it on the ${side} side` } : {}) });
    if (ctx.zonesOn || ctx.building) g.append(el('rect', { x: zx, y: zoneTop, width: zw, height: zoneH, rx: 16, class: 'ab-zone-box' }));
    rot.append(g);
  };
  zone('left', x0, lw);
  zone('right', x0 + lw + MIDDLE, rw);
  rot.append(el('line', { x1: x0, y1: beamY, x2: x0 + lw + MIDDLE + rw, y2: beamY, class: 'ab-beam-bar' }));
  for (const bx of [x0, x0 + lw + MIDDLE + rw]) rot.append(el('circle', { cx: bx, cy: beamY, r: 13, class: 'ab-beam-end' }));

  const stand = beamY - 10;                                   // what stands on the beam rests here
  const drawSide = (list, startX, sw, side) => {
    const out = el('g', { class: `ab-sideg ab-sideg-${side}` });
    const used = list.reduce((w, i) => w + i.width, 0) + GAP * Math.max(0, list.length - 1);
    let cx = startX + (sw - used) / 2;
    if (!list.length && building) out.append(el('text', { x: startX + sw / 2, y: zoneTop + zoneH / 2 + 8, 'text-anchor': 'middle', class: 'ab-drophere' }, [ctx.dropText ?? 'drop here']));
    list.forEach((it, i) => {
      const cy = stand - it.height;
      if (i > 0) out.append(el('text', { x: cx - GAP / 2, y: stand - 22, 'text-anchor': 'middle', class: 'ab-plus' }, ['+']));
      if (it.type === 'x') {
        const early = ctx.early;
        const attrs = building
          ? { 'data-action': 'buildRemove', 'data-side': side, 'data-what': 'x', role: 'button', tabindex: '0', 'aria-label': 'Take the box back off' }
          : early ? { 'data-action': 'dropValue', role: 'button', tabindex: '0', 'aria-label': 'Put your answer in for x' } : {};
        const box = el('g', { class: `ab-x${early ? ' is-target' : ''}`, 'data-x': '1', ...attrs });
        box.append(el('rect', { x: cx, y: cy, width: BOX_W, height: BOX_H, rx: 6, class: 'vm-box' }));
        box.append(el('text', { x: cx + BOX_W / 2, y: cy + BOX_H / 2 + 12, 'text-anchor': 'middle', class: 'sv-x' }, ['x']));
        out.append(box);
      } else if (it.type === 'token') {
        const g = el('g', { class: `ab-token${ctx.cls?.(it.id) ?? ''}`, ...(ctx.tapAction?.(it.id) ? { 'data-action': ctx.tapAction(it.id), 'data-id': it.id } : {}), 'data-numval': it.v, role: 'button', tabindex: '0', 'aria-label': `Group ${signed(it.v)}` });
        g.append(el('rect', { x: cx, y: cy, width: it.width, height: it.height, rx: 12, class: 'ab-token-box' }));
        g.append(el('text', { x: cx + it.width / 2, y: cy + it.height / 2 + 12, 'text-anchor': 'middle', class: 'ab-token-text' }, [signed(it.v)]));
        out.append(g);
      } else {
        const attrs = building
          ? { 'data-action': 'buildRemove', 'data-side': side, role: 'button', tabindex: '0', 'aria-label': `Take a counter off the ${side} side` }
          : { ...(ctx.tapAction?.(it.id) ? { 'data-action': ctx.tapAction(it.id), 'data-id': it.id } : {}), 'data-numval': it.v, role: 'button', tabindex: '0', 'aria-label': `Group of ${signed(it.v)}` };
        const g = el('g', { class: `ab-group${ctx.cls?.(it.id) ?? ''}${it.v < 0 ? ' is-negative' : ''}`, ...attrs });
        g.append(el('rect', { x: cx, y: cy, width: it.width, height: it.height, rx: 12, class: 'ab-group-box' }));
        const k = ctx.struck?.[it.id] ?? 0;
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
    rot.append(out);
    return out;
  };
  const gl = drawSide(items.left, x0, lw, 'left');
  const gr = drawSide(items.right, x0 + lw + MIDDLE, rw, 'right');

  // the pivot, in front
  svg.append(el('polygon', { points: `${borderX - 24},${beamY + 52} ${borderX + 24},${beamY + 52} ${borderX},${beamY + 4}`, class: 'ab-pivot' }));

  // the beam eases from where it was to where it is now
  const angle = ctx.angle ?? 0;
  if (!reduceMotion() && angle !== lastAngle && typeof rot.animate === 'function') {
    rot.animate([{ transform: `rotate(${lastAngle}deg)` }, { transform: `rotate(${angle}deg)` }], { duration: 650, easing: 'cubic-bezier(.3,1.6,.5,1)' });
  }
  lastAngle = angle;

  // Trade places: the side now on the left travels up and over from the right, the other down and over, around the border.
  if (ctx.anim === 'trade' && !reduceMotion()) {
    const dist = lw + MIDDLE;
    const arc = (dx, dy) => [{ transform: `translate(${dx}px, 0px)` }, { transform: `translate(${dx / 2}px, ${dy}px)`, offset: 0.5 }, { transform: 'translate(0px, 0px)' }];
    requestAnimationFrame(() => { try { gl.animate(arc(dist, -60), { duration: 900, easing: 'ease-in-out' }); gr.animate(arc(-dist, 60), { duration: 900, easing: 'ease-in-out' }); } catch { /* no animation: the sides just swap */ } });
  }
  return { W, x0, lw, middle: MIDDLE, borderX, split };
}

// The equation under the balance, in a drawing of its own so buttons can sit between: the border runs through the =.
export function equationSvg(text, geo, lines = []) {
  const { W, borderX } = geo;
  const eq = el('svg', { class: 'mat value-mat addboth-mat ab-eqsvg', role: 'img', 'aria-label': 'The equation so far' });
  let y = 52;
  eq.append(el('line', { x1: borderX, y1: 0, x2: borderX, y2: y + 12, class: 'sv-border' }));
  eq.append(el('rect', { x: borderX - 22, y: y - 40, width: 44, height: 54, class: 'ab-eqhalo' }));          // the border passes behind the =
  eq.append(el('text', { x: borderX - 34, y, 'text-anchor': 'end', class: 'ab-eq' }, [text.left]));
  eq.append(el('text', { x: borderX, y, 'text-anchor': 'middle', class: 'ab-eq ab-equals' }, ['=']));
  eq.append(el('text', { x: borderX + 34, y, 'text-anchor': 'start', class: 'ab-eq' }, [text.right]));
  y += 24;
  lines.forEach((line, i) => {
    eq.append(el('text', { x: W / 2, y: y + 40 + i * 48, 'text-anchor': 'middle', class: `ab-check${line.cls ? ` ${line.cls}` : ''}` }, [line.text]));
  });
  y += lines.length * 48 + (lines.length ? 30 : 0);
  eq.setAttribute('viewBox', `0 0 ${W} ${y + 12}`);
  return eq;
}

export function boardSvg(s) {
  const items = boardItems(s);
  const building = s.stage === 'build';
  const svg = el('svg', { class: 'mat value-mat addboth-mat', role: 'group', 'aria-label': 'The Add to both sides Mat' });
  const cls = (id) => `${s.selected === id ? ' is-selected' : ''}${s.combining && (s.combining.a === id || s.combining.b === id) ? ' is-combining' : ''}${s.hint?.kind === 'cancel' && s.hint.id === id ? ' is-hint' : ''}${s.pending?.kind === 'cross' && s.pending.id === id ? ' is-crossing' : ''}`;
  const tapAction = (id) => (building ? null : s.menu === 'cross' ? (s.pending?.kind === 'cross' && s.pending.id === id ? 'flipSign' : 'cross') : 'select');
  const geo = drawBalance(svg, items, {
    top: 64,
    readout: { text: building ? 'Build the equation' : tiltText(s), cls: building ? '' : balanced(s) ? 'is-good' : 'is-bad' },
    building, zonesOn: building || (s.stage === 'moves' && s.menu === 'add' && hasAmount(s) && !s.combining),
    early: s.early?.step === 'drag', tapAction, cls, struck: struckCounts(s), angle: tipAngle(s), anim: s.anim,
  });
  const sideBtnsOn = !building && s.stage === 'moves' && s.menu === 'add' && hasAmount(s) && !s.combining && !s.resolving && s.pending?.kind !== 'cross';
  const base = building ? s.base : s.board;
  let lines = [];
  if (s.early?.step === 'check' || s.early?.step === 'move') {
    const shown = s.early.step === 'check' ? s.early.lines.slice(0, s.early.shown + 1) : s.early.lines;
    lines = shown.map((text, i) => ({ text, cls: i === s.early.lines.length - 1 ? (text.includes('Unbalanced') ? 'is-bad' : 'is-good') : '' }));
  }
  const bottom = equationSvg({ left: sideValueText(base.left), right: sideValueText(base.right) }, geo, lines);
  return { top: svg, bottom, geo, sideBtnsOn };
}

// Undo on the left (red), Go or Continue on the right (green): right under the equation, where the action is.
export function actionRow({ undo = false, go = null, goAction = 'go', goDisabled = false }) {
  if (!undo && !go) return null;
  const row = html('div', 'ab-actions');
  row.append(undo ? html('button', 'btn btn-undo', ['↶ Undo'], { type: 'button', 'data-action': 'undo', 'data-key': 'u' }) : html('span'));
  if (go) {
    const g = html('button', 'btn btn-go', [go], { type: 'button', 'data-action': goAction });
    g.disabled = goDisabled;
    row.append(g);
  }
  return row;
}

// The buttons under each side: "Add −9 here". `pending` fades the side that has had its share.
export function sideButtons(geo, amountEntry, pending) {
  const row = html('div', 'ab-sidebtns');
  const amount = amountEntry ? amountEntry.replace('-', MINUS) : '___';
  row.style.setProperty('--left', `${geo.x0 / geo.W * 100}%`);
  row.style.setProperty('--side', `${geo.lw / geo.W * 100}%`);
  row.style.setProperty('--gap', `${geo.middle / geo.W * 100}%`);
  row.style.setProperty('--mid', `${geo.borderX / geo.W * 100}%`);
  for (const side of ['left', 'right']) {
    const b = html('button', 'btn ab-sidebtn', [`Add ${amount} here`], { type: 'button', 'data-action': 'addTo', 'data-side': side });
    b.disabled = Boolean(pending && (pending.both || pending.side === side));
    row.append(b);
  }
  return row;
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
  const adding = s.stage === 'moves' && s.menu === 'add' && hasAmount(s) && s.counterMode && !s.combining;
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
