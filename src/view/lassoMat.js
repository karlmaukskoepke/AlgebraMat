// Renders the Group It Mat as inline SVG (SPEC-LASSO.md §2), from a view state:
//
//   { script: 'whole' | 'fraction', problem, wroteOne, groups: [{ terms, taken, flipped }],
//     opposite, answer }
//
// Whole numbers draw separate oval groups; a fraction draws one bar split
// into d connected groups. For − groups, tapping a − flips its group: the
// original stays, and its opposite is redrawn to the right (no −) after an
// arrow, and that is what gets counted. Optional, while playing: `tap`
// ('groups' makes the groups tappable, 'flip' the − marks), `next` (the
// lit-up part to deal into), `oneOpen` / `oneText` (the hidden 1 to type,
// and what's typed so far), `totalText` (what's being typed on the pad,
// shown after the arrow), and `fx` (view-only effects: `justFlipped` group
// indices to turn over, and the hint's `show`).
//
// Colors carry meaning, as in the notes: blue = how many groups (A, the
// fraction, the bar, the take bracket), green = inside a group (B, the
// groups, their counters), magenta = opposite (the − marks, flipped counters).

import { MINUS } from '../engine/expr.js';
import { isOpposite, isFraction } from '../engine/groups.js';
import {
  LASSO_VIEW, LASSO_HEIGHT, PART_HEIGHT, COUNTER_PITCH, CHAIN_WIDTH,
  groupWidth, counterPitch, rowPitch, stackCenters, rowXs, takenRuns, wholeColumns, fractionColumns,
} from './lassoLayout.js';

export { CHAIN_WIDTH };

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

function counter(sign, x, y, cls, size = GLYPH) {
  const h = size / 2;
  const g = el('g', { class: `counter ${cls}`, transform: `translate(${x} ${y})`, 'data-sign': sign });
  g.append(line(-h, 0, h, 0, 'mark'));
  if (sign === '+') g.append(line(0, -h, 0, h, 'mark'));
  return g;
}

const opposites = (terms) => terms.map((t) => ({ ...t, sign: t.sign === '+' ? '-' : '+' }));

// A row of counters in a group of `width`. A redrawn (flipped) group is magenta
// and turns over like a card when it has just been drawn (`turning`).
function counterRow(terms, cx, cy, { width, base = COUNTER_PITCH, magenta = false, turning = false }) {
  const pitch = rowPitch(terms.length, width, base);
  const size = Math.min(GLYPH, pitch - 4);
  const g = el('g', { class: `row${turning ? ' flip-in' : ''}` });
  rowXs(terms.length, cx, pitch).forEach((x, i) => {
    g.append(counter(terms[i].sign, x, cy, magenta ? 'is-opposite' : 'is-inside', size));
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
  else if (s.oneOpen) {
    // The hidden 1: an arrow points at the gap; the student types the number.
    const slot = html('span', `one-slot${s.fx?.hint?.show?.slot ? ' hint-pulse' : ''}`, s.oneText || '?');
    slot.setAttribute('aria-label', 'The hidden number: type a 1');
    slot.append(el('svg', { class: 'slot-arrow', viewBox: '0 0 24 34', 'aria-hidden': 'true' }, [
      el('path', { d: 'M12 33 V6 M4 14 L12 5 L20 14' }),
    ]));
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

// ---------- Arrows, and the count: → 8 ----------
// Arrows are drawn shapes, not font glyphs, so they read the same in any font.
// `draw` makes the arrow draw itself in (the group was just flipped).

function arrow(x1, x2, y, cls, draw = false) {
  return el('path', {
    d: `M ${x1} ${y} H ${x2} M ${x2 - 9} ${y - 7} L ${x2} ${y} L ${x2 - 9} ${y + 7}`,
    class: `arrow ${cls}${draw ? ' draw-in' : ''}`, pathLength: draw ? 1 : null,
  });
}

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
// minus would read as "=", so only words get underlined. A dashed ring shows
// it can be tapped.
function oppMark(s, x, y, { index, flipped }) {
  const tap = s.tap === 'flip' && !flipped;
  const g = el('g', {
    class: `opp-mark-group${tap ? ' tappable' : ''}${flipped ? ' is-flipped' : ''}`,
    'data-action': tap ? 'flip' : null, 'data-index': tap ? index : null,
  });
  if (tap) g.append(el('circle', { cx: x, cy: y - 2, r: 27, class: 'mark-hit' }));
  g.append(el('text', { x, y: y + 11, class: 'opp-mark', 'text-anchor': 'middle' }, [MINUS]));
  return g;
}

const turning = (s, i) => Boolean(s.fx?.justFlipped?.includes(i));
const hinted = (s, i) => Boolean(s.fx?.hint?.show?.groups?.includes(i));

// ---------- Whole-number groups ----------

function wholeScript(svg, s) {
  const expected = Math.abs(s.problem.inside.value);
  const base = counterPitch(expected);
  const w = groupWidth(expected);
  const cols = wholeColumns(w, s.opposite);
  const ys = stackCenters(s.groups.length);
  s.groups.forEach((group, i) => {
    const tap = s.tap === 'groups' || (s.tap === 'flip' && !group.flipped);
    const g = el('g', {
      class: `lasso${tap ? ' tappable' : ''}${hinted(s, i) && !group.flipped ? ' hint-blink-group' : ''}`, 'data-lasso': i,
      'data-action': tap ? (s.tap === 'flip' ? 'flip' : 'group') : null, 'data-index': tap ? i : null,
    });
    g.append(el('ellipse', { cx: cols.origX, cy: ys[i], rx: w / 2, ry: LASSO_HEIGHT / 2, class: 'lasso-oval is-inside' }));
    g.append(counterRow(group.terms, cols.origX, ys[i], { width: w, base }));
    svg.append(g);
    if (!s.opposite) return;
    svg.append(oppMark(s, cols.markX, ys[i], { index: i, flipped: group.flipped }));
    if (!group.flipped) return;
    // Flipped: an arrow to the group redrawn as its opposite, with no −.
    svg.append(arrow(cols.arrow[0], cols.arrow[1], ys[i], 'is-opposite', turning(s, i)));
    const again = el('g', { class: `lasso redrawn${hinted(s, i) ? ' hint-blink-group' : ''}`, 'data-redrawn': i });
    again.append(el('ellipse', { cx: cols.redrawX, cy: ys[i], rx: w / 2, ry: LASSO_HEIGHT / 2, class: 'lasso-oval is-inside' }));
    again.append(counterRow(opposites(group.terms), cols.redrawX, ys[i], { width: w, base, magenta: true, turning: turning(s, i) }));
    svg.append(again);
  });
  const midY = ys.length ? (ys[0] + ys[ys.length - 1]) / 2 + 10 : LASSO_VIEW.height / 2;
  svg.append(chain(s, cols.chainX, midY));
  return cols.width;
}

// ---------- Fraction groups: one bar, d connected groups ----------

function fractionScript(svg, s) {
  const each = Math.abs(s.problem.inside.value) / s.problem.count.d;
  const base = counterPitch(Math.max(2, each));
  const w = groupWidth(Math.max(2, each));
  const cols = fractionColumns(w, s.opposite);
  const H = LASSO_VIEW.height;
  const d = s.groups.length;
  const top = (H - d * PART_HEIGHT) / 2;
  const yOf = (i) => top + i * PART_HEIGHT;
  const anyTaken = s.groups.some((g) => g.taken);
  const cx = cols.left + w / 2;

  s.groups.forEach((part, i) => {
    const tap = s.tap === 'groups';
    const next = s.next === i;
    const cls = ['part', part.taken ? 'is-taken' : anyTaken && s.tap !== 'groups' ? 'is-left' : '', next ? 'is-next' : '',
      tap ? 'tappable' : '', hinted(s, i) && !part.flipped ? 'hint-blink-group' : '']
      .filter(Boolean).join(' ');
    const g = el('g', { class: cls, 'data-part': i, 'data-action': tap ? 'group' : null, 'data-index': tap ? i : null });
    g.append(el('rect', { x: cols.left, y: yOf(i), width: w, height: PART_HEIGHT, class: 'bar-part' }));
    if (next) g.append(el('rect', { x: cols.left + 4, y: yOf(i) + 4, width: w - 8, height: PART_HEIGHT - 8, rx: 6, class: 'next-ring' }));
    g.append(counterRow(part.terms, cx, yOf(i) + PART_HEIGHT / 2, { width: w, base }));
    svg.append(g);
  });
  if (d) svg.append(el('rect', { x: cols.left, y: top, width: w, height: d * PART_HEIGHT, rx: 4, class: 'bar-outline' }));

  // The "take n" bracket beside each run of taken parts.
  const runs = takenRuns(s.groups.map((g) => g.taken));
  runs.forEach(([a, b]) => {
    const path = `M ${cols.bx - 8} ${yOf(a) + 3} H ${cols.bx} V ${yOf(b + 1) - 3} H ${cols.bx - 8}`;
    svg.append(el('path', { d: path, class: 'take-bracket' }));
  });
  const taken = s.groups.map((g, i) => i).filter((i) => s.groups[i].taken);
  const flipped = s.opposite && taken.length > 0 && taken.every((i) => s.groups[i].flipped);
  if (runs.length) {
    const [a, b] = runs[0];
    const y = (yOf(a) + yOf(b + 1)) / 2;
    const label = `take ${taken.length}`;
    if (!s.opposite) {
      svg.append(el('text', { x: cols.bx + 10, y: y + 8, class: 'take-label' }, [label]));
      svg.append(chain(s, cols.bx + 76, y + 8));
    } else {
      // The label rides above the arrow that comes after the flip.
      svg.append(el('text', { x: cols.bx + 8, y: y - 12, class: 'take-label' }, [label]));
      if (flipped) {
        svg.append(arrow(cols.arrow[0], cols.arrow[1], y, 'is-opposite', Boolean(s.fx?.justFlipped?.length)));
        // The parts taken, redrawn as opposites in a bar of their own.
        const n = taken.length;
        const top2 = Math.max(2, Math.min(H - n * PART_HEIGHT - 2, y - (n * PART_HEIGHT) / 2));
        const cx2 = cols.redrawLeft + w / 2;
        taken.forEach((idx, k) => {
          const g = el('g', { class: `part redrawn${hinted(s, idx) ? ' hint-blink-group' : ''}`, 'data-redrawn': idx });
          g.append(el('rect', { x: cols.redrawLeft, y: top2 + k * PART_HEIGHT, width: w, height: PART_HEIGHT, class: 'bar-part' }));
          g.append(counterRow(opposites(s.groups[idx].terms), cx2, top2 + k * PART_HEIGHT + PART_HEIGHT / 2,
            { width: w, base, magenta: true, turning: Boolean(s.fx?.justFlipped?.includes(idx)) }));
          svg.append(g);
        });
        svg.append(el('rect', { x: cols.redrawLeft, y: top2, width: w, height: n * PART_HEIGHT, rx: 4, class: 'bar-outline' }));
        svg.append(chain(s, cols.chainX, top2 + (n * PART_HEIGHT) / 2 + 8));
      }
    }
  }

  // One − for the whole bar. Flipping it flips the groups taken.
  if (s.opposite && d) svg.append(oppMark(s, cols.markX, top + (d * PART_HEIGHT) / 2, { index: 0, flipped }));
  return cols.width;
}

export function renderLassoMat(s) {
  const svg = el('svg', {
    class: `mat lasso-mat script-${s.script}`,
    viewBox: `0 0 ${LASSO_VIEW.width} ${LASSO_VIEW.height}`,
    role: 'group',
    'aria-label': 'The Group It Mat',
  });
  svg.append(foreign(0, 18, 300, 150, html('div', `lasso-left${s.oneOpen ? ' needs-one' : ''}`, problemText(s), meaningText(s.problem))));
  if (s.answer !== null && s.answer !== undefined) {
    svg.append(foreign(0, 268, 300, 64, html('div', 'lasso-left', finalText(s))));
  }
  const width = isFraction(s.problem) ? fractionScript(svg, s) : wholeScript(svg, s);
  svg.setAttribute('viewBox', `0 0 ${width} ${LASSO_VIEW.height}`);
  return svg;
}
