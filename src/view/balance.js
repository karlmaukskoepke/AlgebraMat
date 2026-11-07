// The pan balance for "Try a number" (Build V2), drawn in the Mat's own code in the look of Karl's finished page, "Balanced or Not?"
// (karlmaukskoepke/Balanced_Or_Not-, js/balance.js): the same drawing size, stand, beam, chains and pans, the same pieces and colours,
// the same size rule and the same easing. What it shows is only what the student tried (never the solved value).
//
//   - Each x is a block stamped with the tried value (a fraction prints as a fraction, `3/2`); the number of blocks is the x-term's
//     number in front of x, so a fraction needs no half-blocks. A value of 0 is a dashed block marked 0. A negative block value floats as
//     a blue-edged balloon (his page's x-balloon).
//   - The numbers are ONE net number per side, as on his page: a green ball for a positive number, a red balloon on a string for a negative
//     one (his way of drawing a subtracted number), its sign printed on it.
//   - The totals with their working sit under the pans (`4(3/2) + 2 = 8`).
//   - The beam tilts toward the heavier side; equal sides sit level. The tilt grows with the difference and is capped: his curve
//     (cap · (|d| / D)^0.6, cap 18°), with D = 10 here (a difference of 10 or more tilts to the cap; the words still give the exact
//     amount). His page scales D to each equation's slider range; here there is no slider. Under reduced motion the beam snaps.
//   - What differs from his page, on purpose: an x-term with a minus (`−6x`) gives blocks stamped with the opposite value (his 12 equations
//     have none); pieces are capped in size and fold onto more rows when a pan is crowded (a large number in front of x or a long fraction),
//     never the text of the work.
// It is a picture: role img, its name the same sentence as the line under it. Nothing in it is a control.

import { linear } from '../engine/bothSides.js';
import { fracText, lowest } from '../engine/fraction.js';

const NS = 'http://www.w3.org/2000/svg';
const VB_W = 900;
const VB_H = 470;
const PIVOT = { x: 450, y: 150 };
const BEAM_HALF = 255;
const HANG = 120;
const PAN_HALF = 185;
const S1 = 24;
const FLOOR = 30;
const PIECE_MAX = 58;                     // (a cap of the Mat's: the pieces of a large value still fit a pan)
const GAP_IN_GROUP = 4;
const GAP_BETWEEN = 10;
export const MAX_TILT = 18;
export const TILT_POWER = 0.6;
export const TILT_FULL = 10;              // a difference of this size or more tilts to the cap
const FOLLOW_MS = 70;
const EXPR_DY = 66;
const STRING = 30;
const C = { blue: '#1F5FBF', green: '#1E7A36', red: '#C0262D', ink: '#111111', string: '#4A4A4A', chain: '#8A96A3' };

const sizeOf = (v) => Math.min(PIECE_MAX, Math.max(FLOOR, S1 * Math.sqrt(Math.abs(v))));
const num = (f) => f.n / f.d;

// The tilt for a signed difference left − right (exact): negative angles lean left (his page's sign: the heavier side goes down)
export function tiltFor(diff) {
  if (diff.n === 0) return 0;
  const sign = diff.n > 0 ? -1 : 1;
  return sign * MAX_TILT * Math.min(1, Math.abs(num(diff)) / TILT_FULL) ** TILT_POWER;
}

// A side as his model: the x-groups as written (each x-term, a group's x part), one net number, and whether the number comes first
export function sideModel(side) {
  const groups = [];
  side.forEach((q) => {
    if (q.k === 'x') groups.push(q.c);
    else if (q.k === 'g') groups.push((q.f * (q.a ?? 1)) / (q.d ?? 1));
  });
  return { groups, c: linear(side).b, constFirst: side[0]?.k === 'n' };
}

function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined) e.setAttribute(k, String(v));
  if (parent) parent.append(e);
  return e;
}
const textWidth = (str, size) => [...str].reduce((w, ch) => w + (ch === ' ' ? 0.3 : ch === '/' ? 0.32 : ch === '+' || ch === '−' ? 0.6 : 0.58), 0) * size;
const fitFont = (label, room, pref) => { const w = textWidth(label, pref); return Math.max(10, w > room ? (pref * room) / w : pref); };

// the pieces of one side: weights (on the pan) and floats (balloons), in written order
function sidePieces(model, v) {
  const weights = [];
  const floats = [];
  let g = 0;
  const pushC = () => {
    if (!model.c) return;
    const p = { group: g++, order: 0, label: `${model.c > 0 ? '+' : '−'}${Math.abs(model.c)}`, size: sizeOf(model.c), shape: model.c > 0 ? 'ball' : 'balloon' };
    (model.c > 0 ? weights : floats).push(p);
  };
  if (model.constFirst) pushC();
  model.groups.forEach((k) => {
    const value = lowest({ n: Math.sign(k) * v.n, d: v.d });          // (a minus in front of x: each block is the opposite value)
    const label = fracText(value);
    for (let i = 0; i < Math.abs(k); i++) {
      const p = { group: g, order: i, label, size: value.n === 0 ? FLOOR : sizeOf(num(value)) };
      if (value.n > 0) { p.shape = 'box'; weights.push(p); } else if (value.n === 0) { p.shape = 'zero-box'; weights.push(p); } else { p.shape = 'x-balloon'; floats.push(p); }
    }
    g += 1;
  });
  if (!model.constFirst) pushC();
  return { weights, floats };
}

const rowWidth = (list) => list.reduce((w, p, i) => w + p.size + (i === 0 ? 0 : list[i - 1].group === p.group ? GAP_IN_GROUP : GAP_BETWEEN), 0);
const maxRise = () => PIVOT.y + HANG - BEAM_HALF * Math.sin((MAX_TILT * Math.PI) / 180) - 4;

// weights in rows on the pan (more rows when crowded), balloons spread over the rim on strings (his crowded layout, used always: it is
// his single-row layout whenever one row fits)
function layoutSide(model, v) {
  const ps = sidePieces(model, v);
  const maxW = 2 * PAN_HALF - 8;
  const rows = [];
  let row = null;
  ps.weights.forEach((p, i) => {
    let gap = i === 0 ? 0 : ps.weights[i - 1].group === p.group ? GAP_IN_GROUP : GAP_BETWEEN;
    if (!row || row.w + gap + p.size > maxW) { row = { items: [], gaps: [], w: 0, h: 0 }; rows.push(row); gap = 0; }
    row.items.push(p); row.gaps.push(gap); row.w += gap + p.size; row.h = Math.max(row.h, p.size);
  });
  let y = 0;
  rows.forEach((r) => {
    let px = -r.w / 2;
    r.items.forEach((p, k) => { px += r.gaps[k]; p.cx = px + p.size / 2; p.cy = y - p.size / 2; px += p.size; });
    y -= r.h + 4;
  });
  const weightTop = rows.length ? -y - 4 : 0;
  const n = ps.floats.length;
  const span = 2 * PAN_HALF - 50;
  // floats: one row of balloons when they fit over the pan, else spread at two heights (his crowded rule)
  const oneRow = rowWidth(ps.floats) <= maxW;
  let fx = -rowWidth(ps.floats) / 2;
  ps.floats.forEach((p, i) => {
    if (oneRow) { fx += i === 0 ? 0 : ps.floats[i - 1].group === p.group ? GAP_IN_GROUP : GAP_BETWEEN; p.cx = fx + p.size / 2; fx += p.size; }
    else p.cx = n === 1 ? 0 : -span / 2 + (span * (i + 0.5)) / n;
    const base = weightTop ? weightTop + 8 : 0;
    const len = Math.max(12, Math.min(oneRow ? STRING : i % 2 === 0 ? 26 : 72, maxRise() - base - 14 - p.size));
    p.stringTop = -(base + len);
    p.cy = p.stringTop - p.size / 2 - 6;
    p.layer = n === 1 ? 'front' : i % 2 === 0 ? 'back' : 'front';
  });
  return { weights: ps.weights, floats: ps.floats };
}

function label(g, p, color, italic = false) {
  const t = el('text', { x: p.cx, y: p.cy, 'font-size': italic ? Math.min(30, p.size * 0.7) : fitFont(p.label, p.size - 6, Math.min(30, p.size * 0.5)), fill: color, class: 'bon-label' }, g);
  t.textContent = p.label;
}
function drawWeight(g, p) {
  const item = el('g', { 'data-shape': p.shape, 'data-label': p.label }, g);
  const s = p.size;
  el('ellipse', { cx: p.cx, cy: 1, rx: s * 0.48, ry: 4, fill: '#000000', opacity: 0.18 }, item);
  if (p.shape === 'ball') {
    el('circle', { cx: p.cx, cy: p.cy, r: s / 2, fill: 'url(#bon-ball)', stroke: '#0F4A20', 'stroke-width': 1.5 }, item);
    label(item, p, '#FFFFFF');
    return;
  }
  const zero = p.shape === 'zero-box';
  const x0 = p.cx - s / 2;
  const y0 = p.cy - s / 2;
  el('rect', { x: x0, y: y0, width: s, height: s, rx: 3, fill: zero ? 'url(#bon-hatch)' : 'url(#bon-box)', stroke: C.blue, 'stroke-width': 3, 'stroke-dasharray': zero ? '6 4' : undefined, filter: zero ? undefined : 'url(#bon-shadow)' }, item);
  if (!zero) el('path', { d: `M${x0 + 4},${y0 + s - 5} L${x0 + 4},${y0 + 4} L${x0 + s - 5},${y0 + 4}`, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, opacity: 0.8 }, item);
  label(item, p, C.ink);
}
function drawFloat(g, p) {
  const item = el('g', { 'data-shape': p.shape, 'data-label': p.label }, g);
  const s = p.size;
  el('line', { x1: p.cx, y1: 0, x2: p.cx, y2: p.cy + s / 2 + 6, stroke: C.string, 'stroke-width': 2 }, item);
  el('path', { d: `M${p.cx - 5},${p.cy + s / 2 + 7} L${p.cx},${p.cy + s / 2 - 1} L${p.cx + 5},${p.cy + s / 2 + 7} Z`, fill: p.shape === 'balloon' ? '#8E141C' : C.blue }, item);
  if (p.shape === 'balloon') {
    el('circle', { cx: p.cx, cy: p.cy, r: s / 2, fill: 'url(#bon-balloon)', stroke: '#7A1016', 'stroke-width': 1.5 }, item);
    label(item, p, '#FFFFFF');
  } else {
    el('rect', { x: p.cx - s / 2, y: p.cy - s / 2, width: s, height: s, rx: s * 0.28, fill: 'url(#bon-xballoon)', stroke: C.blue, 'stroke-width': 3 }, item);
    label(item, p, C.ink);
  }
}
function defs(svg) {
  const d = el('defs', {}, svg);
  const lin = (id, stops, x2 = 0, y2 = 1) => { const g = el('linearGradient', { id, x1: 0, y1: 0, x2, y2 }, d); stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g)); };
  const rad = (id, stops) => { const g = el('radialGradient', { id, cx: '35%', cy: '30%', r: '75%' }, d); stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g)); };
  lin('bon-metal', [[0, '#7D8996'], [0.5, '#4A5562'], [1, '#2C343D']]);
  lin('bon-post', [[0, '#56616D'], [0.5, '#8995A2'], [1, '#3A444F']], 1, 0);
  lin('bon-box', [[0, '#F4F8FE'], [1, '#BFD1F0']], 1, 1);
  lin('bon-pan', [[0, '#9AA6B3'], [1, '#4A5562']]);
  rad('bon-ball', [[0, '#7FD49A'], [0.55, '#2E9A4E'], [1, '#145A28']]);
  rad('bon-balloon', [[0, '#FF9B9B'], [0.5, '#D6323C'], [1, '#8E141C']]);
  rad('bon-xballoon', [[0, '#FFFFFF'], [0.6, '#D7E4FA'], [1, '#9FB9E6']]);
  const hatch = el('pattern', { id: 'bon-hatch', width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, d);
  el('rect', { width: 8, height: 8, fill: '#EDEDED' }, hatch);
  el('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: '#C9C9C9', 'stroke-width': 3 }, hatch);
  const f = el('filter', { id: 'bon-shadow', x: '-30%', y: '-30%', width: '160%', height: '160%' }, d);
  el('feDropShadow', { dx: 0, dy: 2, stdDeviation: 2, 'flood-color': '#000000', 'flood-opacity': 0.3 }, f);
}

const reducedMotion = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
// the beam's angle carried across redraws (the Mat redraws often): the new drawing eases from where the last one was
let lastAngle = { key: null, angle: 0 };

// The balance for one try: { problem, value, result: { left, right, diff, heavier, line, work } }. Returns the svg.
export function renderBalance({ problem, value, result, key }) {
  const svg = el('svg', { viewBox: `0 0 ${VB_W} ${VB_H}`, role: 'img', class: 'bon-balance', 'aria-label': result.line, 'data-heavier': result.heavier });
  el('title', {}, svg).textContent = result.line;
  defs(svg);
  el('ellipse', { cx: PIVOT.x, cy: 422, rx: 110, ry: 7, fill: '#000000', opacity: 0.15 }, svg);
  el('path', { d: 'M368,422 L532,422 L508,394 L392,394 Z', fill: 'url(#bon-metal)' }, svg);
  el('rect', { x: PIVOT.x - 9, y: PIVOT.y, width: 18, height: 246, fill: 'url(#bon-post)' }, svg);
  const back = { left: el('g', {}, svg), right: el('g', {}, svg) };
  const beam = el('g', { class: 'bon-beam' }, svg);
  el('rect', { x: PIVOT.x - BEAM_HALF - 10, y: PIVOT.y - 7, width: 2 * BEAM_HALF + 20, height: 14, rx: 7, fill: 'url(#bon-metal)' }, beam);
  el('path', { d: `M${PIVOT.x - 5},${PIVOT.y} L${PIVOT.x},${PIVOT.y - 46} L${PIVOT.x + 5},${PIVOT.y} Z`, fill: '#3A444F' }, beam);
  [-1, 1].forEach((d) => el('circle', { cx: PIVOT.x + d * BEAM_HALF, cy: PIVOT.y, r: 5, fill: '#FFFFFF', stroke: '#3A444F', 'stroke-width': 2.5 }, beam));
  el('circle', { cx: PIVOT.x, cy: PIVOT.y, r: 12, fill: 'url(#bon-post)', stroke: '#2C343D', 'stroke-width': 3 }, svg);
  const pan = { left: el('g', {}, svg), right: el('g', {}, svg) };
  const front = { left: el('g', {}, svg), right: el('g', {}, svg) };
  const under = { left: el('g', {}, svg), right: el('g', {}, svg) };
  const bowl = `M${-PAN_HALF},0 Q0,44 ${PAN_HALF},0 Z`;
  for (const side of ['left', 'right']) {
    const lay = layoutSide(sideModel(problem[side]), value);
    [-0.55, 0.55].forEach((k) => el('line', { x1: 0, y1: -HANG, x2: k * PAN_HALF, y2: -9, stroke: C.chain, 'stroke-width': 2.5, 'stroke-dasharray': '5 3' }, back[side]));
    lay.floats.filter((p) => p.layer === 'back').forEach((p) => drawFloat(back[side], p));
    el('path', { d: bowl, fill: 'url(#bon-pan)' }, pan[side]);
    el('ellipse', { cx: 0, cy: 0, rx: PAN_HALF, ry: 10, fill: '#B9C3CE', stroke: '#4A5562', 'stroke-width': 2 }, pan[side]);
    lay.weights.forEach((p) => drawWeight(pan[side], p));
    [-1, 1].forEach((k) => el('line', { x1: 0, y1: -HANG, x2: k * (PAN_HALF - 4), y2: 0, stroke: C.chain, 'stroke-width': 2.5, 'stroke-dasharray': '5 3' }, front[side]));
    el('circle', { cx: 0, cy: -HANG, r: 5, fill: '#3A444F' }, front[side]);
    lay.floats.filter((p) => p.layer === 'front').forEach((p) => drawFloat(front[side], p));
    // the total with its working, under the pan (rides with it, never rotates)
    const w = result.work[side];
    const t = el('text', { x: 0, y: EXPR_DY, 'font-size': fitFont(w, 2 * PAN_HALF + 50, 38), class: 'bon-expr', 'data-total': side }, under[side]);
    t.textContent = w;
  }
  const place = (angle) => {
    const rad = (angle * Math.PI) / 180;
    beam.setAttribute('transform', `rotate(${angle.toFixed(3)} ${PIVOT.x} ${PIVOT.y})`);
    const pos = { left: [PIVOT.x - BEAM_HALF * Math.cos(rad), PIVOT.y - BEAM_HALF * Math.sin(rad) + HANG], right: [PIVOT.x + BEAM_HALF * Math.cos(rad), PIVOT.y + BEAM_HALF * Math.sin(rad) + HANG] };
    for (const side of ['left', 'right']) {
      const tr = `translate(${pos[side][0].toFixed(2)} ${pos[side][1].toFixed(2)})`;
      for (const g of [back[side], pan[side], front[side], under[side]]) g.setAttribute('transform', tr);
    }
    svg.setAttribute('data-angle', angle.toFixed(3));
  };
  const signed = { n: result.left.n * result.right.d - result.right.n * result.left.d, d: result.left.d * result.right.d };
  const target = tiltFor(signed);
  svg.setAttribute('data-target-angle', target.toFixed(3));
  const from = lastAngle.key === key ? lastAngle.angle : 0;
  lastAngle = { key, angle: target };
  if (reducedMotion() || typeof requestAnimationFrame !== 'function' || from === target) { place(target); return svg; }
  // his easing: a short exponential follow toward the target, and a little settle when the beam arrives at level
  place(from);
  let angle = from;
  let last = null;
  let wobble = target === 0 && from !== 0 ? { start: null, amp: from > 0 ? 1.6 : -1.6 } : null;
  const step = (ts) => {
    if (!svg.isConnected && last !== null) return;
    const dt = last === null ? 16 : Math.min(64, ts - last);
    last = ts;
    const gap = target - angle;
    angle = Math.abs(gap) < 0.02 ? target : angle + gap * (1 - Math.exp(-dt / FOLLOW_MS));
    let off = 0;
    if (wobble) {
      if (wobble.start === null) wobble.start = ts;
      const t = ts - wobble.start;
      if (t > 650) wobble = null; else off = wobble.amp * Math.exp(-t / 170) * Math.sin((2 * Math.PI * t) / 300);
    }
    place(angle + off);
    if (Math.abs(target - angle) < 0.02 && !wobble) { place(target); return; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return svg;
}
