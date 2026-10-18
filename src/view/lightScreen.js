// The shared pieces of the Solve it screens (SPEC-ADD-TO-BOTH-SIDES.md, revision 2.2, "light build"): the move list with its pictograms
// and Why? boxes, the work stack's rows, an equation row, the "Add [  ] to both sides" phrase of the numeric level. (Add to both sides
// itself is drawn by view/lightsScreen.js since Build C.) Plain HTML, so every target is a real 44 px and the text can be big.

import { MINUS } from '../engine/expr.js';
import { signed } from '../engine/addBoth.js';
import { fractionText } from '../engine/divide.js';
import { html } from './addBothMat.js';

const btn = (label, action, cls = 'btn', data = {}) => html('button', cls, [label], { type: 'button', 'data-action': action, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [`data-${k}`, v])) });

// The move list is the same on every card of the unit; only "Add ___ to both sides" is active here (order decided 2026-10-12).
const MOVES = [
  ['add', 'Add ___ to both sides'],
  ['cross', 'Cross the border'],
  ['fraction', 'Take a fraction of both sides'],
  ['multiply', 'Multiply both sides by ___'],
  ['flip', 'Flip everything'],
  ['trade', 'Trade places'],
  ['distribute', 'Distribute'],
  ['combine', 'Combine like terms'],
];

// One small pictogram per move (§3H): the equation shape in grey, the part that changes in colour (numbers from outside the
// equation in blue). The move's name is not in the button: it pops up beside it on hover (see .lb-move[data-tip]).
const SVG_NS = 'http://www.w3.org/2000/svg';
const GREY = '#8a8576';
const BLUE = '#0072b2';
const LIGHT = '#6fb6e0';
function svgEl(name, attrs = {}, kids = []) {
  const n = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...kids);
  return n;
}
const txt = (x, y, text, fill = GREY, size = 13, anchor = 'middle') => svgEl('text', { x, y, 'text-anchor': anchor, fill, 'font-size': size, 'font-weight': 700, 'font-family': 'Lexend, system-ui, sans-serif' }, [text]);
const box = (x, y, w = 12, h = 12, stroke = GREY, dash = '') => svgEl('rect', { x, y, width: w, height: h, rx: 3, fill: 'none', stroke, 'stroke-width': 1.6, ...(dash ? { 'stroke-dasharray': dash } : {}) });
const curve = (d, color = BLUE, marker = true) => svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': 1.8, 'stroke-linecap': 'round', ...(marker ? { 'marker-end': 'url(#lb-ah)' } : {}) });
// "( )": an empty place in parentheses, the part of the equation the move acts on
const blank = (x) => [txt(x, 18, '(', GREY, 17), txt(x + 14, 18, ')', GREY, 17)];
const ICONS = {
  // ( ) + □ = ( ) + □ : we add to whatever is there
  add: () => [...blank(6), txt(30, 17, '+', BLUE, 15), box(36, 7, 11, 13, BLUE, '2 2'), txt(56, 17, '=', GREY, 14), ...blank(64), txt(88, 17, '+', BLUE, 15), box(94, 7, 11, 13, BLUE, '2 2')],
  // ( ) + n = ( ) − n, the +n in light blue carried over (an arrow from above it) and becoming a darker −n
  cross: () => [...blank(6), txt(34, 18, '+n', LIGHT, 13), txt(60, 17, '=', GREY, 14), ...blank(68), txt(98, 18, '−n', BLUE, 13), curve('M34 6 Q 66 -8 98 6')],
  fraction: () => [txt(10, 10, '1', BLUE, 11), svgEl('line', { x1: 3, y1: 12, x2: 17, y2: 12, stroke: BLUE, 'stroke-width': 1.4 }), txt(10, 23, 'n', BLUE, 11), ...blank(22), txt(54, 17, '=', GREY, 14), txt(68, 10, '1', BLUE, 11), svgEl('line', { x1: 61, y1: 12, x2: 75, y2: 12, stroke: BLUE, 'stroke-width': 1.4 }), txt(68, 23, 'n', BLUE, 11), ...blank(80)],
  multiply: () => [txt(8, 18, 'n', BLUE, 14), ...blank(16), txt(48, 17, '=', GREY, 14), txt(62, 18, 'n', BLUE, 14), ...blank(70)],
  // −x = n → x = −n, with room for the arrow so it never covers an x
  flip: () => [txt(2, 18, '−x = n', GREY, 13, 'start'), curve('M52 13 H72'), txt(78, 18, 'x = −n', BLUE, 13, 'start')],
  // each box carried over the = and back: an arrow on top one way, an arrow underneath the other
  trade: () => [box(2, 7, 14, 14), txt(30, 18, '=', GREY, 14), box(44, 7, 14, 14), curve('M9 5 Q 30 -7 51 5'), curve('M51 23 Q 30 35 9 23')],
  distribute: () => [txt(6, 18, 'n', BLUE, 14), txt(16, 18, '(', GREY, 15), box(21, 8, 10, 12), txt(37, 18, '+', GREY, 13), box(42, 8, 10, 12), txt(57, 18, ')', GREY, 15), svgEl('path', { d: 'M6 5 Q 14 -2 26 7 M6 5 Q 22 -4 47 7', fill: 'none', stroke: BLUE, 'stroke-width': 1.3 })],
  combine: () => [txt(10, 18, '2x', GREY, 12), txt(24, 18, '+', GREY, 12), txt(38, 18, '3x', GREY, 12), txt(54, 18, '=', GREY, 12), txt(70, 18, '5x', BLUE, 13)],
};
const WIDTH = { add: 112, cross: 118, fraction: 102, multiply: 98, flip: 126, trade: 62, distribute: 62, combine: 82 };
export function moveIcon(id) {
  const svg = svgEl('svg', { class: 'lb-icon', viewBox: `0 -8 ${WIDTH[id]} ${id === 'trade' ? 40 : 34}`, width: WIDTH[id], height: id === 'trade' ? 40 : 34, 'aria-hidden': 'true', focusable: 'false' });
  svg.append(svgEl('defs', {}, [svgEl('marker', { id: 'lb-ah', markerWidth: 6, markerHeight: 6, refX: 4.5, refY: 3, orient: 'auto' }, [svgEl('path', { d: 'M0 0 L6 3 L0 6 z', fill: BLUE })])]), ...ICONS[id]());
  return svg;
}

// "Add [  ] to both sides", under the equation and above Undo and Go: where the amount is typed (or a number is dragged to). It is
// only visible once the Add move is chosen, but its room is always kept so nothing shifts.
export function addPhrase(s) {
  const on = s.menu === 'add' && s.stage === 'moves' && !s.sub && !s.combining && s.typing !== 'answer';
  const blank = html('span', `ab-typed lb-blank${s.amountEntry ? '' : ' is-empty is-blink'}`, [s.amountEntry ? s.amountEntry.replace('-', MINUS) : ' '], { 'data-blank': '1' });
  const row = html('div', `lb-addphrase${on ? '' : ' is-hidden'}`, [html('strong', '', ['Add']), blank, html('strong', '', ['to both sides'])]);
  if (!on) row.setAttribute('aria-hidden', 'true');
  return row;
}

// ---------- the bare equation ----------

// A side as it stands: x, and numbers joined by plus signs (a negative number after a plus, as in the notes). Only the newest
// equation is live: its numbers can be dragged, the guess slides onto its x, the number next to x can be highlighted.
function termsOf(side, s, live, plug = false) {
  const out = [];
  side.forEach((t, i) => {
    if (i > 0) out.push(html('span', 'lb-plus', ['+']));
    if (t.kind === 'frac') {
      out.push(html('span', 'lb-frac', [html('span', 'is-blue', [fractionText(t.n)]), '(', ...termsOf(t.inner, s, false, false), ')']));
    } else if (t.kind === 'x') {
      const xel = live && plug && s.sub?.kind === 'guess'
        ? html('span', 'lb-x lb-guess', [signed(s.sub.typed)], { 'data-x': '1' })              // the guess slides onto x
        : html('span', `lb-x${plug ? ' is-plugx' : ''}`, ['x'], { 'data-x': '1' });
      if (t.coef > 1 && !(live && plug && s.sub?.kind === 'guess')) out.push(html('span', 'lb-coef', [live && s.hint?.kind === 'coef' ? html('span', 'lb-hintbox', [String(t.coef)]) : String(t.coef), xel]));
      else out.push(xel);
    } else {
      const hint = live && ((s.hint?.kind === 'cancel' && s.hint.id === t.id) || (s.hint?.kind === 'sum' && s.hint.ids.includes(t.id)));
      const num = html('span', 'lb-num', [signed(t.v)], live ? { 'data-numval': t.v } : {});
      if (hint && i > 0 && s.hint.kind === 'cancel') {
        // the outline goes round the sign and the number together, so it is seen as a positive 7 (or a negative one)
        out.pop();
        out.push(html('span', 'lb-hintbox', [html('span', 'lb-plus', ['+']), num]));
      } else out.push(hint ? html('span', 'lb-hintbox', [num]) : num);
    }
  });
  return out;
}

// The line a move leaves above the new equation: the amount (coloured) on both sides, x's numbers struck as they combine.
export function workTerms(items) {
  const out = [];
  items.forEach((t, i) => {
    if (i > 0) out.push(html('span', 'lb-plus', ['+']));
    out.push(t.x ? html('span', 'lb-x', ['x']) : html('span', `lb-num${t.added ? ' is-added' : ''}${t.struck ? ' is-struck' : ''}`, [signed(t.v)]));
  });
  return out;
}

// An equation row: the left side, the border, the right side (each an array of elements).
export function equationRow(leftEls, rightEls, cls = '') {
  const eq = html('div', `lb-eq ${cls}`.trim());
  eq.append(html('div', 'lb-side lb-left', leftEls), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', rightEls));
  return eq;
}

const eqClass = (chars) => (chars > 30 ? ' is-xlong' : chars > 20 ? ' is-long' : '');
const charsOf = (list) => list.map((x) => (x.kind === 'frac' ? 5 + charsOf(x.inner) : x.kind === 'x' ? (x.coef > 1 ? 2 : 1) : x.x ? 1 : String(signed(x.v)).length + 3)).reduce((a, b) => a + b, 0);

// An animation plays once: a later render of the same state (typing a digit, say) draws it already settled.
let playedKey = null;

// The work stack (§3I): the equation, then each move made beneath it, the x = [ ] row with Check, the substitution in colour.
// Rows are added beneath as the work happens and stay until the next problem. Room for about seven rows is reserved.
export function stackRows(s) {
  const last = s.rows.length - 1;
  const key = s.work && s.rows.length > 1 ? `w${s.rows.length}:${JSON.stringify(s.work)}` : s.sub?.kind === 'guess' ? `g${s.sub.typed}` : null;
  const settledNow = key !== null && key === playedKey;
  playedKey = key;
  return s.rows.map((row, i) => {
    const newest = i >= last - 1 && s.rows.length > 1;           // the move just made (its work row and the new equation) animates
    const cls = `lb-rowwrap${!newest || settledNow ? ' is-settled' : ''}${row.type === 'work' ? ' has-work' : ''}`;
    if (row.type === 'work' && row.board) {
      // a move written as an equation: the fraction of both whole sides (a failed try is marked)
      const w = html('div', `lb-eq lb-work${row.failed ? ' is-failed' : ''}${eqClass(charsOf([...row.board.left, ...row.board.right]))}`, [], { 'aria-hidden': 'true' });
      w.append(html('div', 'lb-side lb-left', termsOf(row.board.left, s, false)), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', termsOf(row.board.right, s, false)));
      if (row.failed) w.append(html('span', 'lb-failmark', ['✗']));
      return html('div', `${cls} has-work`, [w]);
    }
    if (row.type === 'work') {
      const w = html('div', `lb-eq lb-work${eqClass(charsOf([...row.work.left, ...row.work.right]))}`, [], { 'aria-hidden': 'true' });
      w.append(html('div', 'lb-side lb-left', workTerms(row.work.left)), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', workTerms(row.work.right)));
      return html('div', cls, [w]);
    }
    const live = i === last;
    const plug = i === 0 && Boolean(s.sub);                  // the original equation is the one the value goes back into
    const eq = html('div', `lb-eq${eqClass(charsOf([...row.board.left, ...row.board.right]))}`, [], { role: 'img', 'aria-label': 'The equation' });
    eq.append(html('div', 'lb-side lb-left', termsOf(row.board.left, s, live, plug)), html('div', 'lb-border', [html('span', 'lb-equals', ['='])]), html('div', 'lb-side lb-right', termsOf(row.board.right, s, live, plug)));
    return html('div', `${cls}${plug ? ' is-plugrow' : ''}`, plug ? [html('span', 'lb-plugtag', ['plugging back into this equation']), eq] : [eq]);
  });
}

// ---------- the move panel ----------

export function checkbox(state) {
  return html('span', `ab-checkbox is-${state}`, [state === 'green' ? '✓' : state === 'red' ? '✗' : state === 'neutral' ? '–' : ''], { 'aria-hidden': 'true' });
}

// The Why? boxes, by the moves they go with (DECISION-LOG.md "Lights", SPEC-DIVIDE-IT.md §3E): Fewer terms for the top two moves,
// centred between them; the fraction and multiply moves share the size-and-fraction goals; Flip everything has the coefficient
// light; Trade places has x on the left; Distribute and Combine share "each side simplified".
const WHYS = [
  { rows: [0, 1], boxes: [['fewer', 'Fewer terms']] },
  { rows: [2, 3], boxes: [['nofrac', 'No fractions'], ['smaller', 'Smaller numbers'], ['onebox', 'One box']] },
  { rows: [4, 4], boxes: [['noopp', 'No opposite box']] },
  { rows: [5, 5], boxes: [['xleft', 'x on the left']] },
  { rows: [6, 7], boxes: [['simple', 'Each side simplified']] },
];

// The move panel: Move | Why?, one row a move, Solved for x last. `o`: { menu, typing, amountEntry, path, walkStep, disabled,
// locked, lights: { fewer, solved }, off (draw the boxes as not yet available), flash, target (point at Add), sub }.
export function movePanel(o) {
  const panel = html('aside', 'lb-panel', [], { 'aria-label': 'Moves' });
  panel.append(html('div', 'lb-head', [html('span', '', ['Move']), html('span', '', ['Why?'])]));
  const grid = html('div', 'lb-grid');
  const fewer = o.off ? 'off' : o.lights.fewer;
  MOVES.forEach(([id, label], i) => {
    if (id === (o.active ?? 'add')) {
      const target = o.target || o.walkStep === 'move';
      // (?ui=lights: no hover name on Add, the preview on the equation replaces it, so nothing sticks after a tap: `noTip`)
      const b = html('button', `btn btn-move lb-move${o.menu === id ? ' is-on' : ''}${o.preview ? ' is-preview' : ''}${target ? ' is-target' : ''}${o.locked ? ' is-grey' : ''}`, [moveIcon(id)], { type: 'button', 'data-action': 'choose', 'data-move': id, 'aria-label': label, ...(o.locked || o.noTip ? {} : { 'data-tip': label }), ...(o.noTip ? { 'data-fk': 'add', 'aria-pressed': String(o.menu === id) } : {}), style: `grid-row: ${i + 1}` });
      b.disabled = Boolean(o.disabled);
      grid.append(b);
    } else if (id === 'trade' && o.tradeOn) {
      // Trade places is live from Level 5, when x is on the right; the first time it is pointed out and Add waits for it
      grid.append(html('button', `btn btn-move lb-move${o.tradeTarget ? ' is-target' : ''}`, [moveIcon(id)], { type: 'button', 'data-action': 'choose', 'data-move': 'trade', 'aria-label': label, 'data-tip': label, style: `grid-row: ${i + 1}` }));
    } else {
      // a greyed move shows its icon only; its name is read aloud but not shown
      grid.append(html('button', 'btn lb-move is-grey', [moveIcon(id)], { type: 'button', 'data-action': 'greyMove', 'data-move': id, 'aria-disabled': 'true', 'aria-label': label, style: `grid-row: ${i + 1}` }));
    }
  });
  // each group of Why? boxes sits centred beside the moves it goes with. Only the lights a card judges show a state; the rest stay
  // faint outlines.
  for (const g of WHYS) {
    const items = g.boxes.map(([key, name]) => {
      const state = o.whys?.[key] ?? (key === 'fewer' ? fewer : 'off');   // a light this card doesn't judge stays off (Build A)
      return html('li', `ab-goal is-${state}${key === 'fewer' && o.flash ? ' is-flash' : ''}`, [checkbox(state), html('span', 'ab-goal-label', [name])]);
    });
    grid.append(html('ul', 'ab-goals lb-why', items, { style: `grid-row: ${g.rows[0] + 1} / ${g.rows[1] + 2}` }));
  }
  panel.append(grid);
  const solved = o.off ? 'off' : o.lights.solved;
  panel.append(html('div', 'lb-row lb-solved', [html('span', 'lb-solved-label', ['Solved for x']), html('ul', 'ab-goals', [html('li', `ab-goal is-${solved}`, [checkbox(solved)])])]));
  if (o.sub) panel.append(o.sub);
  return panel;
}
