// Renders the Mat as inline SVG: counter zones above their numbers,
// the problem (Lexend) and the student's rewritten line (Kalam).

import { MINUS } from '../engine/expr.js';
import { COUNTER_SIZE, COUNTER_PITCH, counterPositions } from './layout.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const VIEW = { width: 640, height: 350 };
const COLUMN = { left: 170, op: 320, right: 470 };
const ZONE_BASE_Y = 170;   // center of the bottom counter row
const PROBLEM_Y = 245;     // baseline of the problem line
const REWRITE_Y = 320;     // baseline of the rewritten line

function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) node.append(c);
  return node;
}

function stroke(x1, y1, x2, y2, cls) {
  return el('line', { x1, y1, x2, y2, class: cls });
}

// A counter is a stroked + or − (never a text glyph), with an optional cancel slash.
function counter({ sign, magenta, canceled }, x, y) {
  const h = COUNTER_SIZE / 2;
  const s = COUNTER_PITCH / 2 - 6;
  const g = el('g', {
    class: `counter${magenta ? ' is-opposite' : ''}${canceled ? ' is-canceled' : ''}`,
    transform: `translate(${x} ${y})`,
    'data-sign': sign,
  });
  g.append(el('rect', { class: 'hit', x: -COUNTER_PITCH / 2, y: -COUNTER_PITCH / 2, width: COUNTER_PITCH, height: COUNTER_PITCH }));
  g.append(stroke(-h, 0, h, 0, 'mark'));
  if (sign === '+') g.append(stroke(0, -h, 0, h, 'mark'));
  if (canceled) g.append(stroke(-s, s, s, -s, 'slash'));
  return g;
}

function zone(z, cx) {
  const g = el('g', { class: 'zone' });
  counterPositions(z.count).forEach((p, i) => {
    g.append(counter({ sign: z.sign, magenta: z.magenta, canceled: i < z.canceled }, cx + p.x, ZONE_BASE_Y + p.y));
  });
  return g;
}

const signed = (n, explicitPlus) => (n < 0 ? `${MINUS}${-n}` : explicitPlus ? `+${n}` : `${n}`);

function text(str, x, y, cls) {
  return el('text', { x, y, class: cls, 'text-anchor': 'middle' }, [str]);
}

// One line of the expression: left term, op, right term, each centered in its column.
function line(y, cls, { left, op, right, flipped = {} }) {
  const g = el('g', { class: cls });
  g.append(text(left, COLUMN.left, y, 'term'));
  g.append(text(op, COLUMN.op, y, `op${flipped.op ? ' is-opposite' : ''}`));
  g.append(text(right, COLUMN.right, y, `term${flipped.right ? ' is-opposite' : ''}`));
  return g;
}

// Magenta is always paired with an underline. Drawn from measured text, so
// they are re-placed once the web fonts have loaded.
function placeUnderlines(svg) {
  svg.querySelectorAll('.underline').forEach((u) => u.remove());
  svg.querySelectorAll('text.is-opposite').forEach((t) => {
    const b = t.getBBox();
    const y = b.y + b.height + 2;
    t.after(stroke(b.x, y, b.x + b.width, y, 'underline'));
  });
}

/**
 * state = {
 *   problem,                         // from engine/expr.js
 *   rewritten: { op, right } | null // flips so far, for the Kalam line
 *   zones: [{ sign, count, magenta, canceled }, { ... }]  // left, right
 * }
 */
export function renderMat(state) {
  const { problem, rewritten, zones } = state;
  const svg = el('svg', {
    class: 'mat',
    viewBox: `0 0 ${VIEW.width} ${VIEW.height}`,
    role: 'img',
    'aria-label': 'The Mat',
  });

  zones.forEach((z, i) => svg.append(zone(z, i === 0 ? COLUMN.left : COLUMN.right)));

  const r = problem.right.value;
  svg.append(line(PROBLEM_Y, 'problem', {
    left: signed(problem.left.value),
    op: problem.op === '+' ? '+' : MINUS,
    right: r < 0 ? `(${signed(r)})` : signed(r),
  }));

  if (rewritten) {
    svg.append(line(REWRITE_Y, 'rewritten', {
      left: signed(problem.left.value),
      op: rewritten.op === '+' ? '+' : MINUS,
      right: `(${signed(rewritten.right, true)})`,
      flipped: { op: rewritten.op !== problem.op, right: rewritten.right !== r },
    }));
  }

  requestAnimationFrame(() => placeUnderlines(svg));
  document.fonts?.ready.then(() => placeUnderlines(svg));
  return svg;
}
