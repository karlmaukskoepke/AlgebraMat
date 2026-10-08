// The Value it Mat: the problem, x's value, and, as the supports come, the problem with x replaced by its value in
// parentheses, then each term as filled boxes (a box holds the value of x as counters; a negative box has a dash and
// holds the opposite), and then the sum. Inline SVG; the layout is a pure function so it can be tested.

import { MINUS } from '../engine/expr.js';
import { formatValueExpr, substituteSegments, termWorths } from '../engine/value.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  node.append(...children);
  return node;
}
const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

export const CELL = 24;       // one counter's cell
const PAD = 8;
const BOX_GAP = 14;
const GROUP_GAP = 56;
export const VIEW_WIDTH = 1000;

// A box holding n counters: how they sit in it (up to 3 rows).
export function boxShape(n) {
  const rows = n > 6 ? 3 : n > 3 ? 2 : 1;
  const cols = Math.ceil(n / rows);
  return { rows, cols, width: cols * CELL + PAD * 2, height: rows * CELL + PAD * 2 };
}

// Where everything sits in the model: one group per term, left to right. An x term is |coefficient| boxes, each holding
// |x| counters of x's sign (a negative box has the dash); a fraction of x is ONE box holding the |x| counters in d equal
// parts, the top number of them taken; a number is its counters in a small grid.
export function modelLayout(problem) {
  const worths = termWorths(problem);
  const groups = worths.map((w, i) => {
    if (w.x && w.d > 1) {
      const part = boxShape(Math.abs(problem.x) / w.d);
      const width = w.d * part.width + (w.coef < 0 ? 14 : 0);
      return { ...w, term: i, type: 'parts', count: Math.abs(w.coef), parts: w.d, part, shape: { ...part, width: w.d * part.width }, width, height: part.height };
    }
    if (w.x) {
      const shape = boxShape(Math.abs(problem.x));
      const count = Math.abs(w.coef);
      const width = count * shape.width + (count - 1) * BOX_GAP + (w.coef < 0 ? 14 : 0);
      return { ...w, term: i, type: 'boxes', count, shape, width, height: shape.height };
    }
    const shape = boxShape(Math.abs(w.coef));
    return { ...w, term: i, type: 'counters', count: Math.abs(w.coef), shape, width: shape.cols * CELL, height: shape.rows * CELL };
  });
  const total = groups.reduce((sum, g) => sum + g.width, 0) + GROUP_GAP * Math.max(0, groups.length - 1);
  let x = Math.max(20, (Math.max(VIEW_WIDTH, total + 40) - total) / 2);
  groups.forEach((g) => { g.x = x; x += g.width + GROUP_GAP; });
  return { groups, width: Math.max(VIEW_WIDTH, total + 40), height: Math.max(0, ...groups.map((g) => g.height)) };
}

function counterMark(cx, cy, sign) {
  const g = el('g', { class: 'bm-mark' });
  g.append(el('line', { x1: cx - 8, y1: cy, x2: cx + 8, y2: cy, class: 'mark' }));
  if (sign === '+') g.append(el('line', { x1: cx, y1: cy - 8, x2: cx, y2: cy + 8, class: 'mark' }));
  return g;
}

function counterGrid(svg, x, y, shape, n, sign, inset) {
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / shape.cols);
    const col = i % shape.cols;
    svg.append(counterMark(x + inset + col * CELL + CELL / 2, y + inset + row * CELL + CELL / 2, sign));
  }
}

// The sum of the worths, as the student will add them: "−12 + 6".
export const sumText = (problem) => termWorths(problem).map((w, i) => (i === 0 ? signed(w.worth) : (w.worth < 0 ? `+ (${signed(w.worth)})` : `+ ${w.worth}`))).join(' ');

export function renderValueMat({ problem, rung = 0, typed = '', done = false, finalText = '' }) {
  const showModel = rung >= 2;
  const layout = showModel ? modelLayout(problem) : null;
  const width = layout?.width ?? VIEW_WIDTH;
  const height = showModel ? 150 + layout.height + 190 : 360;
  const svg = el('svg', { class: 'mat value-mat', viewBox: `0 0 ${width} ${height}`, role: 'group', 'aria-label': 'The Value it Mat' });
  const mid = width / 2;

  // The problem, big; with the value of x in its own color. After the first support it is the substituted line.
  const line = el('text', { x: mid, y: 90, 'text-anchor': 'middle', class: 'vm-problem' });
  if (rung >= 1) {
    for (const seg of substituteSegments(problem)) {
      const t = el('tspan', { class: seg.sub ? 'vm-sub' : null, dx: seg.joined ? 0 : 16 }, [seg.text]);
      line.append(t);
    }
  } else {
    line.append(el('tspan', {}, [formatValueExpr(problem)]));
  }
  svg.append(line);
  svg.append(el('text', { x: mid, y: 150, 'text-anchor': 'middle', class: 'vm-given' }, [
    el('tspan', {}, ['x = ']), el('tspan', { class: 'vm-sub' }, [signed(problem.x)])]));

  let y = 190;
  if (showModel) {
    const top = y + 10;
    layout.groups.forEach((g, i) => {
      const baseY = top + (layout.height - g.height) / 2;
      if (g.type === 'boxes') {
        const dash = g.coef < 0 ? 14 : 0;
        for (let b = 0; b < g.count; b++) {
          const bx = g.x + dash + b * (g.shape.width + BOX_GAP);
          svg.append(el('rect', { x: bx, y: baseY, width: g.shape.width, height: g.shape.height, rx: 6, class: 'vm-box' }));
          if (dash) svg.append(el('line', { x1: bx - 12, y1: baseY + g.shape.height / 2, x2: bx, y2: baseY + g.shape.height / 2, class: 'mark vm-dash' }));
          counterGrid(svg, bx, baseY, g.shape, Math.abs(problem.x), problem.x < 0 ? '-' : '+', PAD);
        }
      } else if (g.type === 'parts') {
        // One box, split into equal parts: the parts taken have a solid outline and a light fill, the rest are dashed.
        const dash = g.coef < 0 ? 14 : 0;
        const bx = g.x + dash;
        for (let k = 0; k < g.parts; k++) {
          const taken = k < g.count;
          svg.append(el('rect', { x: bx + k * g.part.width, y: baseY, width: g.part.width, height: g.part.height, class: `vm-part${taken ? ' is-taken' : ''}` }));
          counterGrid(svg, bx + k * g.part.width, baseY, g.part, Math.abs(problem.x) / g.parts, problem.x < 0 ? '-' : '+', PAD);
        }
        svg.append(el('rect', { x: bx, y: baseY, width: g.parts * g.part.width, height: g.part.height, rx: 6, class: 'vm-box' }));
        if (dash) svg.append(el('line', { x1: bx - 12, y1: baseY + g.part.height / 2, x2: bx, y2: baseY + g.part.height / 2, class: 'mark vm-dash' }));
      } else {
        counterGrid(svg, g.x, baseY, g.shape, g.count, g.coef < 0 ? '-' : '+', 0);
      }
      // What the term comes to, under it.
      svg.append(el('text', { x: g.x + g.width / 2, y: top + layout.height + 40, 'text-anchor': 'middle', class: 'vm-worth' }, [signed(g.worth)]));
      if (i > 0) svg.append(el('text', { x: g.x - GROUP_GAP / 2, y: top + layout.height / 2 + 10, 'text-anchor': 'middle', class: 'vm-plus' }, ['+']));
    });
    y = top + layout.height + 70;
  }
  if (rung >= 3) {
    svg.append(el('text', { x: mid, y: y + 30, 'text-anchor': 'middle', class: 'vm-sum' }, [sumText(problem)]));
    y += 56;
  }

  // The answer line.
  const text = done ? finalText : typed.replace(/-/g, MINUS);
  const ans = el('text', { x: mid, y: y + 60, 'text-anchor': 'middle', class: `vm-answer${text ? '' : ' is-empty'}${done ? ' is-done' : ''}` }, [`= ${text || '?'}`]);
  svg.append(ans);
  if (!done) svg.append(el('line', { x1: mid - 70, y1: y + 74, x2: mid + 70, y2: y + 74, class: 'vm-rule' }));
  svg.setAttribute('viewBox', `0 0 ${width} ${y + 96}`);
  return svg;
}
