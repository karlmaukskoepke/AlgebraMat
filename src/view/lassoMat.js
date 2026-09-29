// Renders the Lasso Mat as inline SVG (SPEC-LASSO.md §2), from a view state:
//
// whole-number problems, e.g. −2(−4):
//   { script: 'whole', problem, wroteOne, lassos: [{ opposite, terms: [{ kind, sign }] }],
//     total, flipped, answer }
// fraction problems, e.g. 2/3(−6):
//   { script: 'fraction', problem, whole: [terms], parts: [{ terms, taken }],
//     total, flipped, answer }
// Optional, while playing: `tap` ('lassos', 'whole' or 'parts' makes those
// tappable), `slot`
// (show the tappable gap for the hidden 1), and `totalText` / `answerText`
// (what's being typed on the pad, shown in the arrow chain).
//
// Colors carry meaning, as in the notes: blue = how many groups (A, the
// fraction, split parts, the take bracket), green = inside a group (B, the
// lassos, their counters), magenta + underline = opposite.

import { MINUS } from '../engine/expr.js';
import { isOpposite, isFraction } from '../engine/groups.js';
import {
  LASSO_VIEW, LEFT_X, STACK_X, LASSO_HEIGHT, LASSO_GAP, PART_HEIGHT, PART_GAP,
  lassoWidth, stackCenters, rowXs, wholeRows, takenRuns,
} from './lassoLayout.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HTML_NS = 'http://www.w3.org/1999/xhtml';
const GLYPH = 18; // counter size inside a lasso

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

// Terms flip to their opposite (and turn magenta) after "opp.".
const shown = (term, flipped) => (flipped ? (term.sign === '+' ? '-' : '+') : term.sign);

function counterRow(terms, cx, cy, { flipped = false } = {}) {
  const g = el('g', { class: 'row' });
  rowXs(terms.length, cx).forEach((x, i) => {
    g.append(counter(shown(terms[i], flipped), x, cy, flipped ? 'is-opposite' : 'is-inside'));
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

// ---------- The arrow chain: → −8, then opp. → 8 ----------
// Arrows are drawn shapes, not font glyphs, so they read the same in any font.

function arrow(x1, x2, y, cls) {
  return el('path', { d: `M ${x1} ${y} H ${x2} M ${x2 - 9} ${y - 7} L ${x2} ${y} L ${x2 - 9} ${y + 7}`, class: `arrow ${cls}` });
}

export const CHAIN_WIDTH = 186; // first arrow → end of a two-digit answer like "−20"

const has = (v) => v !== null && v !== undefined;

function chain(s, x, y) {
  const g = el('g', { class: 'chain' });
  const totalText = has(s.total) ? signed(s.total) : s.totalText;
  if (!has(totalText)) return g;
  const ay = y - 9; // arrows sit at the middle of the digits
  g.append(arrow(x, x + 30, ay, 'is-ink'));
  g.append(el('text', { x: x + 38, y, class: `chain-total${has(s.total) ? '' : ' is-typing'}` }, [totalText]));
  if (s.flipped) {
    const x2 = x + 96;
    g.append(el('text', { x: x2 + 17, y: ay - 11, class: 'chain-opp', 'text-anchor': 'middle' }, ['opp.']));
    g.append(line(x2 + 2, ay - 7, x2 + 32, ay - 7, 'chain-opp-underline'));
    g.append(arrow(x2, x2 + 34, ay + 4, 'is-opposite'));
    const shownAnswer = has(s.answer) ? signed(s.answer) : (s.answerText ?? '?');
    g.append(el('text', { x: x2 + 42, y, class: `chain-answer is-opposite${has(s.answer) ? '' : ' is-typing'}` }, [shownAnswer]));
  }
  return g;
}

// ---------- Whole-number groups ----------

function wholeScript(svg, s) {
  const ys = stackCenters(s.lassos.length);
  const widest = Math.max(Math.abs(s.problem.inside.value), ...s.lassos.map((l) => l.terms.length));
  const w = lassoWidth(widest);
  s.lassos.forEach((lasso, i) => {
    const tap = s.tap === 'lassos';
    const g = el('g', {
      class: `lasso${tap ? ' tappable' : ''}`, 'data-lasso': i,
      'data-action': tap ? 'lasso' : null, 'data-index': tap ? i : null,
    });
    g.append(el('ellipse', { cx: STACK_X, cy: ys[i], rx: w / 2, ry: LASSO_HEIGHT / 2, class: 'lasso-oval is-inside' }));
    if (lasso.opposite) {
      // A magenta minus: the sign itself is the shape cue. An underline under a
      // lone minus would read as "=", so only words get underlined.
      g.append(el('text', { x: STACK_X - w / 2 - 20, y: ys[i] + 11, class: 'opp-mark', 'text-anchor': 'middle' }, [MINUS]));
    }
    g.append(counterRow(lasso.terms, STACK_X, ys[i], { flipped: s.flipped }));
    svg.append(g);
  });
  const midY = ys.length ? (ys[0] + ys[ys.length - 1]) / 2 + 10 : LASSO_VIEW.height / 2;
  svg.append(chain(s, STACK_X + w / 2 + 18, midY));
}

// ---------- Fraction groups ----------

function fractionScript(svg, s) {
  // The whole group, in the left column under the meaning.
  const rows = wholeRows(s.whole.length);
  const perRow = Math.max(3, ...rows);
  const wholeH = 40 + 30 * Math.max(0, rows.length - 1);
  const wy = 205;
  const wholeTap = s.tap === 'whole';
  const wholeG = el('g', { class: `whole-group${wholeTap ? ' tappable' : ''}`, 'data-action': wholeTap ? 'whole' : null });
  wholeG.append(el('ellipse', {
    cx: LEFT_X, cy: wy, rx: lassoWidth(perRow) / 2, ry: wholeH / 2, class: 'lasso-oval is-inside whole',
  }));
  svg.append(wholeG);
  let k = 0;
  rows.forEach((count, r) => {
    const y = wy - (30 * (rows.length - 1)) / 2 + r * 30;
    wholeG.append(counterRow(s.whole.slice(k, k + count), LEFT_X, y));
    k += count;
  });

  // The split parts, stacked on the right, in blue.
  const ys = stackCenters(s.parts.length, { height: PART_HEIGHT, gap: PART_GAP });
  const each = Math.abs(s.problem.inside.value) / s.problem.count.d;
  const w = lassoWidth(Math.max(2, each, ...s.parts.map((p) => p.terms.length)));
  const anyTaken = s.parts.some((p) => p.taken);
  s.parts.forEach((part, i) => {
    const tap = s.tap === 'parts';
    const g = el('g', {
      class: `part${part.taken ? ' is-taken' : anyTaken ? ' is-left' : ''}${tap ? ' tappable' : ''}`, 'data-part': i,
      'data-action': tap ? 'part' : null, 'data-index': tap ? i : null,
    });
    g.append(el('ellipse', { cx: STACK_X, cy: ys[i], rx: w / 2, ry: PART_HEIGHT / 2, class: 'lasso-oval is-groups' }));
    g.append(counterRow(part.terms, STACK_X, ys[i], { flipped: s.flipped && part.taken }));
    svg.append(g);
  });

  // The "take n" bracket beside each run of taken parts, and the chain after it.
  const bx = STACK_X + w / 2 + 14;
  const runs = takenRuns(s.parts.map((p) => p.taken));
  runs.forEach(([a, b]) => {
    const top = ys[a] - PART_HEIGHT / 2 + 2;
    const bottom = ys[b] + PART_HEIGHT / 2 - 2;
    const path = `M ${bx - 8} ${top} H ${bx} V ${bottom} H ${bx - 8}`;
    svg.append(el('path', { d: path, class: 'take-bracket' }));
  });
  if (runs.length) {
    const [a, b] = runs[0];
    const y = (ys[a] + ys[b]) / 2 + 8;
    const taken = s.parts.filter((p) => p.taken).length;
    svg.append(el('text', { x: bx + 10, y, class: 'take-label' }, [`take ${taken}`]));
    svg.append(chain(s, bx + 76, y));
  }
}

export function renderLassoMat(s) {
  const svg = el('svg', {
    class: `mat lasso-mat script-${s.script}`,
    viewBox: `0 0 ${LASSO_VIEW.width} ${LASSO_VIEW.height}`,
    role: 'group',
    'aria-label': 'The Lasso Mat',
  });
  svg.append(foreign(0, 18, 300, 140, html('div', 'lasso-left', problemText(s), meaningText(s.problem))));
  if (s.answer !== null && s.answer !== undefined) {
    svg.append(foreign(0, 262, 300, 64, html('div', 'lasso-left', finalText(s))));
  }
  if (isFraction(s.problem)) fractionScript(svg, s);
  else wholeScript(svg, s);
  return svg;
}
