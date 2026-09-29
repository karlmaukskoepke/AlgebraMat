// Renders the Group It Mat as inline SVG (SPEC-LASSO.md §2), from a view state:
//
//   { script: 'whole' | 'fraction', problem, wroteOne, groups: [{ terms, taken, flipped }],
//     opposite, answer }
//
// Whole numbers draw separate oval groups; a fraction draws one bar split
// into d connected groups. Optional, while playing: `tap` ('groups' makes the
// groups tappable, 'flip' the − marks), `next` (the lit-up part to deal into),
// `slot` (the tappable gap for the hidden 1) and `totalText` (what's being
// typed on the pad, shown after the arrow).
//
// Colors carry meaning, as in the notes: blue = how many groups (A, the
// fraction, the bar, the take bracket), green = inside a group (B, the
// groups, their counters), magenta = opposite (the − marks, flipped counters).

import { MINUS } from '../engine/expr.js';
import { isOpposite, isFraction } from '../engine/groups.js';
import {
  LASSO_VIEW, STACK_X, LASSO_HEIGHT, PART_HEIGHT,
  lassoWidth, stackCenters, rowXs, takenRuns,
} from './lassoLayout.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HTML_NS = 'http://www.w3.org/1999/xhtml';
const GLYPH = 18; // counter size inside a group

function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  }
  node.append(...children);
  return node;
}

function html(tag, cls, ...children) {
  const node = document.createElementNS(HTML_NS, tag);
  if (cls) node.setAttribute('class', cls);
  node.append(...children.filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
const line = (x1, y1, x2, y2, cls) => el('line', { x1, y1, x2, y2, class: cls });

function counter(sign, x, y, cls) {
  const h = GLYPH / 2;
  const g = el('g', { class: `counter ${cls}`, transform: `translate(${x} ${y})`, 'data-sign': sign });
  g.append(line(-h, 0, h, 0, 'mark'));
  if (sign === '+') g.append(line(0, -h, 0, h, 'mark'));
  return g;
}

// Flipped groups hold their opposites already; they're drawn magenta.
function counterRow(terms, cx, cy, flipped = false) {
  const g = el('g', { class: 'row' });
  rowXs(terms.length, cx).forEach((x, i) => {
    g.append(counter(terms[i].sign, x, cy, flipped ? 'is-opposite' : 'is-inside'));
  });
  return g;
}

// ---------- The left column: problem, meaning, final line (HTML in SVG) ----------

function fraction(n, d) {
  return html('span', 'frac groups', html('span', 'num', `${n}`), html('span', 'den', `${d}`));
}

// The problem with its meaning colors: −2(−4) → magenta −, blue 2, green (−4).
function problemText(s) {
  const p = s.problem;
  const { neg, n, d } = p.count;
  const parts = [];
  if (neg) parts.push(html('span', 'opp-sign', MINUS));
  if (d > 1) parts.push(fraction(n, d));
  else if (!p.hidden1) parts.push(html('span', 'groups', `${n}`));
  else if (s.wroteOne) parts.push(html('span', 'groups written', '1'));
  else if (s.slot) {
    const slot = html('span', 'one-slot', '1?');
    slot.setAttribute('data-action', 'writeOne');
    slot.setAttribute('role', 'button');
    slot.setAttribute('aria-label', 'Write the hidden 1');
    parts.push(slot);
  }
  parts.push(html('span', 'inside', `(${signed(p.inside.value)})`));
  return html('div', 'lasso-problem', ...parts);
}

// "opposite of 2 groups of −4", "2/3 of a group of −6", as in the notes.
function meaningText(p) {
  const { n, d } = p.count;
  const size = d > 1 ? [fraction(n, d), ' of a group of '] : [html('span', 'groups', `${n}`), n === 1 ? ' group of ' : ' groups of '];
  return html('div', 'lasso-meaning',
    isOpposite(p) ? html('span', 'opp', 'opposite of') : null,
    isOpposite(p) ? ' ' : null,
    ...size,
    html('span', 'inside', signed(p.inside.value)));
}

function finalText(s) {
  const p = s.problem;
  const { neg, n, d } = p.count;
  const size = d > 1 ? fraction(n, d) : `${p.hidden1 && !s.wroteOne ? '' : n}`;
  return html('div', 'lasso-final', neg ? MINUS : '', size, `(${signed(p.inside.value)}) = ${signed(s.answer)}`);
}

function foreign(x, y, width, height, child) {
  const fo = el('foreignObject', { x, y, width, height });
  fo.append(child);
  return fo;
}

// ---------- The arrow and the count: → 8 ----------
// Arrows are drawn shapes, not font glyphs, so they read the same in any font.

function arrow(x1, x2, y, cls) {
  return el('path', { d: `M ${x1} ${y} H ${x2} M ${x2 - 9} ${y - 7} L ${x2} ${y} L ${x2 - 9} ${y + 7}`, class: `arrow ${cls}` });
}

export const CHAIN_WIDTH = 110; // arrow → end of a two-digit answer like "−20"

const has = (v) => v !== null && v !== undefined;

function chain(s, x, y) {
  const g = el('g', { class: 'chain' });
  const text = has(s.answer) ? signed(s.answer) : s.totalText;
  if (!has(text)) return g;
  g.append(arrow(x, x + 30, y - 9, 'is-ink'));
  g.append(el('text', { x: x + 38, y, class: `chain-total${has(s.answer) ? '' : ' is-typing'}` }, [text]));
  return g;
}

// ---------- The − marks: tap one to flip ----------

// A magenta minus beside a group (or the bar). An underline under a lone
// minus would read as "=", so only words get underlined. Once flipped, an
// arrow arcs from the − over into the group: the group became its opposite.
function oppMark(s, x, y, { index, flipped, tipX, tipY }) {
  const tap = s.tap === 'flip' && !flipped;
  const g = el('g', {
    class: `opp-mark-group${tap ? ' tappable' : ''}${flipped ? ' is-flipped' : ''}`,
    'data-action': tap ? 'flip' : null, 'data-index': tap ? index : null,
  });
  if (tap) g.append(el('circle', { cx: x, cy: y - 2, r: 24, class: 'mark-hit' }));
  g.append(el('text', { x, y: y + 11, class: 'opp-mark', 'text-anchor': 'middle' }, [MINUS]));
  if (flipped) {
    const x0 = x + 4, y0 = y - 16;
    g.append(el('path', {
      d: `M ${x0} ${y0} Q ${(x0 + tipX) / 2} ${y0 - 26} ${tipX} ${tipY} M ${tipX - 9} ${tipY - 5} L ${tipX} ${tipY} L ${tipX - 3} ${tipY - 10}`,
      class: 'flip-arrow',
    }));
  }
  return g;
}

// ---------- Whole-number groups ----------

function wholeScript(svg, s) {
  const ys = stackCenters(s.groups.length);
  const widest = Math.max(Math.abs(s.problem.inside.value), ...s.groups.map((g) => g.terms.length));
  const w = lassoWidth(widest);
  const left = STACK_X - w / 2;
  s.groups.forEach((group, i) => {
    const tap = s.tap === 'groups' || (s.tap === 'flip' && !group.flipped);
    const g = el('g', {
      class: `lasso${tap ? ' tappable' : ''}`, 'data-lasso': i,
      'data-action': tap ? (s.tap === 'flip' ? 'flip' : 'group') : null, 'data-index': tap ? i : null,
    });
    g.append(el('ellipse', { cx: STACK_X, cy: ys[i], rx: w / 2, ry: LASSO_HEIGHT / 2, class: 'lasso-oval is-inside' }));
    g.append(counterRow(group.terms, STACK_X, ys[i], group.flipped));
    svg.append(g);
    if (s.opposite) {
      svg.append(oppMark(s, left - 24, ys[i], { index: i, flipped: group.flipped, tipX: left + 16, tipY: ys[i] - LASSO_HEIGHT / 2 + 4 }));
    }
  });
  const midY = ys.length ? (ys[0] + ys[ys.length - 1]) / 2 + 10 : LASSO_VIEW.height / 2;
  svg.append(chain(s, STACK_X + w / 2 + 18, midY));
}

// ---------- Fraction groups: one bar, d connected groups ----------

function fractionScript(svg, s) {
  const d = s.groups.length;
  const each = Math.abs(s.problem.inside.value) / s.problem.count.d;
  const w = lassoWidth(Math.max(2, each, ...s.groups.map((g) => g.terms.length)));
  const left = STACK_X - w / 2;
  const top = (LASSO_VIEW.height - d * PART_HEIGHT) / 2;
  const yOf = (i) => top + i * PART_HEIGHT;
  const anyTaken = s.groups.some((g) => g.taken);

  s.groups.forEach((part, i) => {
    const tap = s.tap === 'groups';
    const next = s.next === i;
    const cls = ['part', part.taken ? 'is-taken' : anyTaken && s.tap !== 'groups' ? 'is-left' : '', next ? 'is-next' : '', tap ? 'tappable' : '']
      .filter(Boolean).join(' ');
    const g = el('g', { class: cls, 'data-part': i, 'data-action': tap ? 'group' : null, 'data-index': tap ? i : null });
    g.append(el('rect', { x: left, y: yOf(i), width: w, height: PART_HEIGHT, class: 'bar-part' }));
    if (next) g.append(el('rect', { x: left + 4, y: yOf(i) + 4, width: w - 8, height: PART_HEIGHT - 8, rx: 6, class: 'next-ring' }));
    g.append(counterRow(part.terms, STACK_X, yOf(i) + PART_HEIGHT / 2, part.flipped));
    svg.append(g);
  });
  if (d) svg.append(el('rect', { x: left, y: top, width: w, height: d * PART_HEIGHT, rx: 4, class: 'bar-outline' }));

  // The "take n" bracket beside each run of taken parts, and the count after it.
  const bx = STACK_X + w / 2 + 14;
  const runs = takenRuns(s.groups.map((g) => g.taken));
  runs.forEach(([a, b]) => {
    const path = `M ${bx - 8} ${yOf(a) + 3} H ${bx} V ${yOf(b + 1) - 3} H ${bx - 8}`;
    svg.append(el('path', { d: path, class: 'take-bracket' }));
  });
  if (runs.length) {
    const [a, b] = runs[0];
    const y = (yOf(a) + yOf(b + 1)) / 2 + 8;
    const taken = s.groups.filter((g) => g.taken).length;
    svg.append(el('text', { x: bx + 10, y, class: 'take-label' }, [`take ${taken}`]));
    svg.append(chain(s, bx + 76, y));
  }

  // One − for the whole bar. Flipping it flips the groups taken.
  if (s.opposite && d) {
    const flipped = s.groups.some((g) => g.flipped);
    const first = s.groups.findIndex((g) => g.taken);
    const tipY = first >= 0 ? yOf(first) + 8 : top + 8;
    svg.append(oppMark(s, left - 24, top + (d * PART_HEIGHT) / 2, { index: 0, flipped, tipX: left + 14, tipY }));
  }
}

export function renderLassoMat(s) {
  const svg = el('svg', {
    class: `mat lasso-mat script-${s.script}`,
    viewBox: `0 0 ${LASSO_VIEW.width} ${LASSO_VIEW.height}`,
    role: 'group',
    'aria-label': 'The Group It Mat',
  });
  svg.append(foreign(0, 18, 300, 140, html('div', 'lasso-left', problemText(s), meaningText(s.problem))));
  if (s.answer !== null && s.answer !== undefined) {
    svg.append(foreign(0, 262, 300, 64, html('div', 'lasso-left', finalText(s))));
  }
  if (isFraction(s.problem)) fractionScript(svg, s);
  else wholeScript(svg, s);
  return svg;
}
