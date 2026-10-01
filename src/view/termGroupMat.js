// Renders the Groups of Terms Mat as inline SVG (SPEC-GROUPS-OF-TERMS.md §2–3), from a view state:
//
//   { problem,                                  an engine/termGroups.js problem
//     groups: [{ pieces, taken, flipped }],     whole numbers: one oval each; fractions: one bar part each
//     opposite,                                 the groups are − groups (a − beside them, then the flip)
//     answer: string | null,                    the final line, "6x − 3", once it's right
//     totalText: string | null,                 what's being typed, shown after the arrow
//     checkIt: boolean,                         draw the distributing arrows (Check it)
//     tap, next, fx }                           as in Group It's Mat
//
// A piece is { type: 'box' | 'counter', sign: '+' | '-' }: a box is x, a negative
// box is −x (a short dash at its left), and counters are + and −, as in Boxes & Circles.
// It reuses Group It's geometry and colors: blue = how many groups, green = inside a
// group, magenta = opposite. A − group's original stays; its opposite is redrawn to the
// right (no −) after an arrow, and that is what gets read for the answer.

import { MINUS } from '../engine/expr.js';
import { isOpposite, isFraction, insideText, formatTermGroups, distributeLines, distributeSum, partPieces, groupPieces } from '../engine/termGroups.js';
import {
  LASSO_VIEW, CHAIN_WIDTH,
  groupWidth, counterPitch, rowPitch, stackCenters, rowXs, takenRuns, wholeColumns, fractionColumns,
} from './lassoLayout.js';
import { textWidth } from './boxLayout.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HTML_NS = 'http://www.w3.org/1999/xhtml';
const GLYPH = 18; // piece size inside a group
// A little taller than Group It's (50 and 48): the drawing is wider here, so it scales down
// and these keep every oval and part at least 44px on a Chromebook.
const OVAL_H = 56;
const PART_H = 54;

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

const line = (x1, y1, x2, y2, cls) => el('line', { x1, y1, x2, y2, class: cls });
const has = (v) => v !== null && v !== undefined;

// ---------- Pieces ----------

// A counter: a + or − mark. A box: a square; a negative box has a short dash touching its left.
function piece(spec, x, y, cls, size = GLYPH, popped = false) {
  const h = size / 2;
  const g = el('g', { class: `tg-piece ${spec.type === 'box' ? 'tg-box' : 'counter'} ${cls}${popped ? ' pop-in' : ''}`, transform: `translate(${x} ${y})`, 'data-sign': spec.sign, 'data-type': spec.type });
  if (spec.type === 'box') {
    const neg = spec.sign === '-';
    const left = neg ? -h * 0.55 : -h;
    const side = neg ? size * 0.78 : size * 0.86;
    g.append(el('rect', { x: left, y: -side / 2, width: side, height: side, rx: 2, class: 'box-outline' }));
    if (neg) g.append(line(-h - 2, 0, left, 0, 'mark'));
  } else {
    g.append(line(-h, 0, h, 0, 'mark'));
    if (spec.sign === '+') g.append(line(0, -h, 0, h, 'mark'));
  }
  return g;
}

const opposites = (pieces) => pieces.map((p) => ({ ...p, sign: p.sign === '+' ? '-' : '+' }));

// A row of pieces in a group of `width`. A redrawn (flipped) group is magenta
// and turns over like a card when it has just been drawn (`turning`).
function pieceRow(pieces, cx, cy, { width, base, magenta = false, turning = false, popped = [] }) {
  const pitch = rowPitch(pieces.length, width, base);
  const size = Math.min(GLYPH, pitch - 6);
  const g = el('g', { class: `row${turning ? ' flip-in' : ''}` });
  rowXs(pieces.length, cx, pitch).forEach((x, i) => g.append(piece(pieces[i], x, cy, magenta ? 'is-opposite' : 'is-inside', size, popped.includes(i))));
  return g;
}

// ---------- The left column: problem, meaning, final line (HTML in SVG) ----------

function fraction(n, d) {
  return html('span', 'frac groups', html('span', 'num', `${n}`), html('span', 'den', `${d}`));
}

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
  parts.push(html('span', 'inside', `(${insideText(p)})`));
  return html('div', 'lasso-problem tg-problem', ...parts);
}

// "opposite of 3 groups of (2x − 1)", "1/2 of a group of (4x + 6)", as in the notes.
function meaningText(p) {
  const { n, d } = p.count;
  const size = d > 1 ? [fraction(n, d), ' of a group of '] : [html('span', 'groups', `${p.hidden1 ? 1 : n}`), (p.hidden1 ? 1 : n) === 1 ? ' group of ' : ' groups of '];
  return html('div', 'lasso-meaning',
    isOpposite(p) ? html('span', 'opp', 'opposite of') : null,
    isOpposite(p) ? ' ' : null,
    ...size,
    html('span', 'inside', `(${insideText(p)})`));
}

function finalText(p, answer) {
  return html('div', 'lasso-final tg-final', `${formatTermGroups(p)} = ${answer}`);
}

function foreign(x, y, width, height, child) {
  const fo = el('foreignObject', { x, y, width, height });
  fo.append(child);
  return fo;
}

// ---------- Arrows and the count ----------

function arrow(x1, x2, y, cls, draw = false) {
  return el('path', {
    d: `M ${x1} ${y} H ${x2} M ${x2 - 9} ${y - 7} L ${x2} ${y} L ${x2 - 9} ${y + 7}`,
    class: `arrow ${cls}${draw ? ' draw-in' : ''}`, pathLength: draw ? 1 : null,
  });
}

function chain(s, x, y) {
  const g = el('g', { class: 'chain' });
  const text = has(s.answer) ? s.answer : s.totalText;
  if (!has(text)) return g;
  g.append(arrow(x, x + 30, y - 9, 'is-ink'));
  g.append(el('text', { x: x + 38, y, class: `chain-total tg-total${has(s.answer) ? '' : ' is-typing'}` }, [text]));
  return g;
}

// A magenta minus beside a group (or the bar); tap it to flip (a dashed ring shows it can be tapped).
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

// How far right the count after the arrow reaches ("→ −2x + 8" is longer than Group It's "→ −20").
const chainRight = (s, x) => {
  const text = has(s.answer) ? s.answer : s.totalText;
  return has(text) ? x + 38 + textWidth(text, 26) + 14 : 0;
};

// The pieces just added to group i, to pop in.
const poppedIn = (s, i) => (s.fx?.added ?? []).filter((a) => a.group === i).map((a) => a.index);

const turning = (s, i) => Boolean(s.fx?.justFlipped?.includes(i));
const hinted = (s, i) => Boolean(s.fx?.hint?.show?.groups?.includes(i));

// ---------- Whole-number groups: one oval each ----------

function wholeScript(svg, s) {
  const g1 = groupPieces(s.problem);
  const expected = g1.boxes + g1.counters;
  const base = counterPitch(expected);
  const w = groupWidth(expected);
  const cols = wholeColumns(w, s.opposite);
  const ys = stackCenters(s.groups.length, { height: OVAL_H });
  s.groups.forEach((group, i) => {
    const tap = s.tap === 'groups' || (s.tap === 'flip' && !group.flipped);
    const g = el('g', {
      class: `lasso${tap ? ' tappable' : ''}${hinted(s, i) && !group.flipped ? ' hint-blink-group' : ''}`, 'data-lasso': i,
      'data-action': tap ? (s.tap === 'flip' ? 'flip' : 'group') : null, 'data-index': tap ? i : null,
    });
    g.append(el('ellipse', { cx: cols.origX, cy: ys[i], rx: w / 2, ry: OVAL_H / 2, class: 'lasso-oval is-inside' }));
    g.append(pieceRow(group.pieces, cols.origX, ys[i], { width: w, base, popped: poppedIn(s, i) }));
    svg.append(g);
    if (!s.opposite) return;
    svg.append(oppMark(s, cols.markX, ys[i], { index: i, flipped: group.flipped }));
    if (!group.flipped) return;
    svg.append(arrow(cols.arrow[0], cols.arrow[1], ys[i], 'is-opposite', turning(s, i)));
    const again = el('g', { class: `lasso redrawn${hinted(s, i) ? ' hint-blink-group' : ''}`, 'data-redrawn': i });
    again.append(el('ellipse', { cx: cols.redrawX, cy: ys[i], rx: w / 2, ry: OVAL_H / 2, class: 'lasso-oval is-inside' }));
    again.append(pieceRow(opposites(group.pieces), cols.redrawX, ys[i], { width: w, base, magenta: true, turning: turning(s, i) }));
    svg.append(again);
  });
  const midY = ys.length ? (ys[0] + ys[ys.length - 1]) / 2 + 10 : LASSO_VIEW.height / 2;
  svg.append(chain(s, cols.chainX, midY));
  return Math.max(cols.width, chainRight(s, cols.chainX));
}

// ---------- Fraction groups: one bar, d connected parts ----------

function fractionScript(svg, s) {
  const part = partPieces(s.problem);
  const each = Math.max(2, part.boxes + part.counters);
  const base = counterPitch(each);
  const w = groupWidth(each);
  const cols = fractionColumns(w, s.opposite);
  const H = LASSO_VIEW.height;
  const d = s.groups.length;
  const top = (H - d * PART_H) / 2;
  const yOf = (i) => top + i * PART_H;
  const anyTaken = s.groups.some((g) => g.taken);
  const cx = cols.left + w / 2;

  s.groups.forEach((group, i) => {
    const tap = s.tap === 'groups';
    const next = s.next === i;
    const cls = ['part', group.taken ? 'is-taken' : anyTaken && s.tap !== 'groups' ? 'is-left' : '', next ? 'is-next' : '',
      tap ? 'tappable' : '', hinted(s, i) && !group.flipped ? 'hint-blink-group' : '']
      .filter(Boolean).join(' ');
    const g = el('g', { class: cls, 'data-part': i, 'data-action': tap ? 'group' : null, 'data-index': tap ? i : null });
    g.append(el('rect', { x: cols.left, y: yOf(i), width: w, height: PART_H, class: 'bar-part' }));
    if (next) g.append(el('rect', { x: cols.left + 4, y: yOf(i) + 4, width: w - 8, height: PART_H - 8, rx: 6, class: 'next-ring' }));
    g.append(pieceRow(group.pieces, cx, yOf(i) + PART_H / 2, { width: w, base, popped: poppedIn(s, i) }));
    svg.append(g);
  });
  if (d) svg.append(el('rect', { x: cols.left, y: top, width: w, height: d * PART_H, rx: 4, class: 'bar-outline' }));

  const runs = takenRuns(s.groups.map((g) => g.taken));
  runs.forEach(([a, b]) => {
    svg.append(el('path', { d: `M ${cols.bx - 8} ${yOf(a) + 3} H ${cols.bx} V ${yOf(b + 1) - 3} H ${cols.bx - 8}`, class: 'take-bracket' }));
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
      svg.append(el('text', { x: cols.bx + 8, y: y - 12, class: 'take-label' }, [label]));
      if (flipped) {
        svg.append(arrow(cols.arrow[0], cols.arrow[1], y, 'is-opposite', Boolean(s.fx?.justFlipped?.length)));
        const n = taken.length;
        const top2 = Math.max(2, Math.min(H - n * PART_H - 2, y - (n * PART_H) / 2));
        const cx2 = cols.redrawLeft + w / 2;
        taken.forEach((idx, k) => {
          const g = el('g', { class: `part redrawn${hinted(s, idx) ? ' hint-blink-group' : ''}`, 'data-redrawn': idx });
          g.append(el('rect', { x: cols.redrawLeft, y: top2 + k * PART_H, width: w, height: PART_H, class: 'bar-part' }));
          g.append(pieceRow(opposites(s.groups[idx].pieces), cx2, top2 + k * PART_H + PART_H / 2,
            { width: w, base, magenta: true, turning: Boolean(s.fx?.justFlipped?.includes(idx)) }));
          svg.append(g);
        });
        svg.append(el('rect', { x: cols.redrawLeft, y: top2, width: w, height: n * PART_H, rx: 4, class: 'bar-outline' }));
        svg.append(chain(s, cols.chainX, top2 + (n * PART_H) / 2 + 8));
      }
    }
  }
  if (s.opposite && d) svg.append(oppMark(s, cols.markX, top + (d * PART_H) / 2, { index: 0, flipped }));
  return Math.max(cols.width, chainRight(s, s.opposite ? cols.chainX : cols.bx + 76));
}

// ---------- Check it: the distributing arrows (the shorthand) ----------
//
//        ┌──────┐ ┌────┐
//        ↓      ↓ ↓    │          an arrow from A to each term of B,
//     3 ( 2x  −  1 )            then the two products written out,
//     3 · 2x = 6x                and the combined line.
//     3 · (−1) = −3

const CHECK_FONT = 38;
const CHECK_X = 18;

function checkIt(svg, s) {
  const p = s.problem;
  const { neg, n, d } = p.count;
  const aText = `${neg ? MINUS : ''}${d > 1 ? `${n}/${d}` : n}`;
  const lines = distributeLines(p);
  // Lay the problem out as separate words so the arrows can point at them.
  const [t1, t2] = p.inside;
  const words = [
    { text: aText, kind: 'a' },
    { text: '(', kind: 'paren' },
    { text: termLabel(t1), kind: 'term', index: 0 },
    { text: t2.value < 0 ? MINUS : '+', kind: 'op' },
    { text: termLabel({ ...t2, value: Math.abs(t2.value) }), kind: 'term', index: 1 },
    { text: ')', kind: 'paren' },
  ];
  let x = CHECK_X;
  const baseY = 112;
  const placed = words.map((w) => {
    const width = textWidth(w.text, CHECK_FONT);
    const out = { ...w, x: x + width / 2, left: x, width };
    x += width + (w.kind === 'paren' && w.text === '(' ? 4 : 10);
    return out;
  });
  const g = el('g', { class: 'check-it' });
  for (const w of placed) {
    g.append(el('text', {
      x: w.x, y: baseY, 'text-anchor': 'middle',
      class: `tg-word is-${w.kind === 'a' ? 'groups' : w.kind === 'term' ? 'inside' : 'ink'}`,
    }, [w.text]));
  }
  // An arrow from A over the top to each term, drawing itself in.
  const a = placed[0];
  placed.filter((w) => w.kind === 'term').forEach((term, k) => {
    const top = baseY - CHECK_FONT - 8 - k * 16;
    const x1 = a.x;
    const x2 = term.x;
    g.append(el('path', {
      d: `M ${x1} ${baseY - CHECK_FONT + 2} V ${top} H ${x2} V ${baseY - CHECK_FONT + 2} M ${x2 - 7} ${baseY - CHECK_FONT - 6} L ${x2} ${baseY - CHECK_FONT + 4} L ${x2 + 7} ${baseY - CHECK_FONT - 6}`,
      class: 'arrow is-groups check-arrow draw-in', pathLength: 1,
    }));
  });
  // The products, one per arrow.
  lines.forEach((l, k) => {
    g.append(el('text', { x: CHECK_X, y: baseY + 52 + k * 38, class: 'tg-product' }, [l.text]));
  });
  svg.append(g);
  // The combined line the arrows lead to, in the order B is written.
  svg.append(el('text', { x: CHECK_X, y: baseY + 52 + lines.length * 38 + 10, class: 'tg-product tg-sum' }, [`= ${distributeSum(p)}`]));
}

// A term's own text: 2x, −x, 5, −3.
function termLabel(t) {
  const c = t.value;
  if (t.kind === 'int') return c < 0 ? `${MINUS}${-c}` : `${c}`;
  const mag = Math.abs(c) === 1 ? '' : `${Math.abs(c)}`;
  return `${c < 0 ? MINUS : ''}${mag}x`;
}

// ---------- The whole Mat ----------

export function renderTermGroupMat(s) {
  const svg = el('svg', {
    class: `mat lasso-mat tg-mat script-${isFraction(s.problem) ? 'fraction' : 'whole'}`,
    viewBox: `0 0 ${LASSO_VIEW.width} ${LASSO_VIEW.height}`,
    role: 'group',
    'aria-label': 'The Groups of Terms Mat',
  });
  if (s.checkIt) {
    checkIt(svg, s);
  } else {
    svg.append(foreign(0, 18, 300, 150, html('div', `lasso-left${s.oneOpen ? ' needs-one' : ''}`, problemText(s), meaningText(s.problem))));
    if (has(s.answer)) svg.append(foreign(0, 256, 300, 78, html('div', 'lasso-left', finalText(s.problem, s.answer))));
  }
  const width = isFraction(s.problem) ? fractionScript(svg, s) : wholeScript(svg, s);
  svg.setAttribute('viewBox', `0 0 ${width} ${LASSO_VIEW.height}`);
  return svg;
}

export { CHAIN_WIDTH };
