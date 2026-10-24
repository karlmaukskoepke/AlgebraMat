// The moves panel of the light design (Build D, Part 1): the narrow panel of lights round 2, made the only panel on every Solve it card.
// The move icons, one under the other, each a 44 px target, and beside each the small collapsed lights (round dots) of the goals it
// serves; a dot opens into its goal on hover, focus or a tap (Karl kept them, rev 2). Headed "Moves" (Build O); no labels. Hovering a move (or
// focusing it) shows its name beside it; on a card with a preview, the move's preview shows on the equation too (the card's pointer
// code does that, starting faintly as the pointer comes near). The five moves are the properties of equality, in order (Build O): Add,
// Multiply, Divide (a second way in to multiplying by 1/n), Flip everything, Trade places. A card says which are live; the rest are greyed (a tap says why).

import { html } from './addBothMat.js';
import { moveIcon } from './lightScreen.js';

// Build O (loop rev 2.4): headed "Moves"; each move's name, on hover and focus, is its property of equality; a larger symbol floats to the
// left of each button (drawn, with an accessible name), as a cue to what the move does.
export const PANEL_MOVES = [
  { id: 'add', label: 'Addition property of equality: add the same number to both sides', symbol: 'plus', lights: [['fewer', 'Fewer terms']] },
  { id: 'multiply', label: 'Multiplication property of equality', symbol: 'times', lights: [['nofrac', 'No fractions'], ['smaller', 'Smaller numbers'], ['onebox', 'One box']] },
  { id: 'divide', label: 'Division property of equality', symbol: 'divide', lights: [] },
  { id: 'flip', label: 'Multiplication property of equality: multiply both sides by −1', symbol: 'flip', lights: [['noopp', 'No opposite box']] },
  { id: 'trade', label: 'Symmetric property of equality: if a = b, then b = a', symbol: 'trade', lights: [['xleft', 'x on the left']] },
];
// The goals reached by hand (a drag, not a button): no icon, a small row under the moves.
const BY_HAND = [['simple', 'Each side simplified'], ['fewerHand', 'Fewer terms (by hand)']];

const MARK = { green: '✓', red: '✗', neutral: '–', off: '' };
const SAID = { green: 'reached', red: 'went the wrong way', neutral: 'no change', off: 'not judged here' };
// A light: a small round dot; hover, keyboard focus or a tap opens it in place into a pill with its goal (one at a time).
function dot(key, name, state, open, flash) {
  return html('button', `lx-dot is-${state}${open ? ' is-open' : ''}${flash ? ' is-flash' : ''}`, [html('span', 'lx-mark', [MARK[state]]), html('span', 'lx-pill', [name])], {
    type: 'button', 'data-light': key, 'data-fk': `light:${key}`, 'aria-label': `${name}: ${SAID[state]}`, 'aria-expanded': String(open),
  });
}

// Narrow pictograms (about 50 px): the shape of the move, the part that changes in blue.
const SVG_NS = 'http://www.w3.org/2000/svg';
const GREY = '#8a8576';
const BLUE = '#0072b2';
function svgEl(name, attrs = {}, kids = []) {
  const n = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...kids);
  return n;
}
const txt = (x, y, text, fill = GREY, size = 12) => svgEl('text', { x, y, 'text-anchor': 'middle', fill, 'font-size': size, 'font-weight': 700, 'font-family': 'Lexend, system-ui, sans-serif' }, [text]);
const dashBox = (x, y) => svgEl('rect', { x, y, width: 8, height: 11, rx: 2, fill: 'none', stroke: BLUE, 'stroke-width': 1.5, 'stroke-dasharray': '2 1.5' });
const MINI = {
  add: () => [txt(5, 18, '+', BLUE, 13), dashBox(10, 8), txt(26, 18, '=', GREY, 13), txt(37, 18, '+', BLUE, 13), dashBox(42, 8)],
  multiply: () => [txt(5, 18, 'n', BLUE, 12), txt(13, 18, '( )', GREY, 11), txt(26, 18, '=', GREY, 13), txt(35, 18, 'n', BLUE, 12), txt(43, 18, '( )', GREY, 11)],
  // `( )/n = ( )/n` (Build O): parentheses over a fraction bar, n beneath, on both sides
  divide: () => [txt(10, 11, '( )', GREY, 10), svgEl('path', { d: 'M3 14 H17', stroke: BLUE, 'stroke-width': 1.6 }), txt(10, 24, 'n', BLUE, 10), txt(26, 18, '=', GREY, 13),
    txt(42, 11, '( )', GREY, 10), svgEl('path', { d: 'M35 14 H49', stroke: BLUE, 'stroke-width': 1.6 }), txt(42, 24, 'n', BLUE, 10)],
  flip: () => [txt(9, 18, '−x', GREY, 12), svgEl('path', { d: 'M19 14 H31', stroke: BLUE, 'stroke-width': 1.8, 'marker-end': 'url(#lx-ah)' }), txt(42, 18, 'x', BLUE, 13)],
};
// The floating symbols (Build O): + × ÷, a small circle of two arrows (Flip everything), a double arrow (Trade places). 26 px, in ink.
const INK = '#2b2a26';
const line = (d, w = 3) => svgEl('path', { d, stroke: INK, 'stroke-width': w, 'stroke-linecap': 'round', fill: 'none' });
const head = (d) => svgEl('path', { d, fill: INK });
const SYMBOLS = {
  plus: ['Plus sign', () => [line('M13 4 V22'), line('M4 13 H22')]],
  times: ['Times sign', () => [line('M6 6 L20 20'), line('M20 6 L6 20')]],
  divide: ['Division sign', () => [line('M4 13 H22'), svgEl('circle', { cx: 13, cy: 6, r: 2.4, fill: INK }), svgEl('circle', { cx: 13, cy: 20, r: 2.4, fill: INK })]],
  flip: ['Circle of two arrows', () => [line('M5.5 10.5 A8 8 0 0 1 19.5 8', 2.6), head('M22.5 5.5 L21 12 L15.5 8.5 Z'), line('M20.5 15.5 A8 8 0 0 1 6.5 18', 2.6), head('M3.5 20.5 L5 14 L10.5 17.5 Z')]],
  trade: ['Double arrow', () => [line('M7 13 H19', 2.6), head('M2 13 L9 7.5 V18.5 Z'), head('M24 13 L17 7.5 V18.5 Z')]],
};
export function moveSymbol(name) {
  const [said, draw] = SYMBOLS[name];
  const svg = svgEl('svg', { class: 'lx-symbol', viewBox: '0 0 26 26', width: 26, height: 26, role: 'img', 'aria-label': said, focusable: 'false' }, draw());
  return html('span', 'lx-symcell', [svg]);
}

export function miniIcon(id) {
  if (id === 'trade') { const svg = moveIcon('trade'); svg.setAttribute('width', 40); svg.setAttribute('height', 28); return svg; }
  const svg = svgEl('svg', { class: 'lb-icon lx-mini', viewBox: '0 0 52 26', width: 48, height: 24, 'aria-hidden': 'true', focusable: 'false' });
  svg.append(svgEl('defs', {}, [svgEl('marker', { id: 'lx-ah', markerWidth: 6, markerHeight: 6, refX: 4.5, refY: 3, orient: 'auto' }, [svgEl('path', { d: 'M0 0 L6 3 L0 6 z', fill: BLUE })])]), ...MINI[id]());
  return svg;
}

// moves: { [id]: { live, greyed (drawn greyed but keeps its own action: a tap says why; Build O), move (the card's data-move, if not the id), action (its data-action, if not choose), attrs (more attributes), flyout, pressed, preview, ring (a steady ring: the move owed), pulse (the
// move to click now), focus } } ; anything not named is greyed. `disabled`: every live move is off for now (a check being stepped...).
// `lights`: { key: state } (a light not named is off); `open`: the light opened by hover or a tap; `flash`: lights that flash once;
// `hand`: a card's own goals reached by hand, after the two (Distribute, combine, solve: No parentheses, Build M).
export function narrowPanel(moves, { disabled = false, lights = {}, open = null, flash = [], hand = null } = {}) {
  const el = html('aside', 'lb-panel lx-panel', [html('div', 'lx-head', ['Moves'])], { 'aria-label': 'Moves and goals' });
  const grid = html('div', 'lx-pgrid');
  const dots = (list, cls = '') => html('div', `lx-dots${cls}`, list.map(([key, name]) => dot(key, name, lights[key] ?? 'off', open === key, flash.includes(key))));
  for (const m of PANEL_MOVES) {
    const o = moves[m.id];
    const id = o?.move ?? m.id;
    let b;
    if (o?.live) {
      b = html('button', `btn btn-move lb-move lx-move${o.greyed ? ' is-grey' : ''}${o.pressed ? ' is-on' : ''}${o.preview ? ' is-preview' : ''}${o.near ? ' is-near' : ''}${o.ring ? ' is-target is-ring' : ''}${o.pulse ? ' is-target' : ''}`, [miniIcon(m.id)], {
        type: 'button', 'data-action': o.action ?? 'choose', 'data-move': id, 'aria-label': m.label, 'data-tip': m.label, 'data-fk': id, 'aria-pressed': String(Boolean(o.pressed)),
        ...(o.greyed ? { 'aria-disabled': 'true' } : {}),
        ...(o.attrs ?? {}),
      });
      b.disabled = disabled || Boolean(o.off);
      if (o.focus) b.dataset.lxFocus = '1';
      if (o.flyout) b = html('div', 'lx-movewrap', [b, o.flyout]);          // the Multiply options, beside the button (Build D-2)
    } else {
      b = html('button', 'btn lb-move lx-move is-grey', [miniIcon(m.id)], { type: 'button', 'data-action': 'greyMove', 'data-move': o?.move ?? m.id, 'aria-disabled': 'true', 'aria-label': m.label, 'data-tip': m.label });
    }
    grid.append(moveSymbol(m.symbol), b, dots(m.lights));
  }
  el.append(grid, html('div', 'lx-hand', [dots([...BY_HAND, ...(hand ?? [])], ' is-row')], { 'aria-label': 'Goals reached by hand' }),
    html('div', 'lx-solvedrow', [html('span', 'lx-solvedlabel', ['Solved for x']), dots([['solved', 'Solved for x']], ' is-row')]));
  return el;
}
