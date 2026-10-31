// The moves panel of the light design (Build D, Part 1): the narrow panel of lights round 2, made the only panel on every Solve it card.
// The moves, one under the other: since Build W, square buttons with one large plain symbol each (no lights on screen, no floating
// symbols; `?lights=1` brings back the collapsed lights beside them, a dot opening into its goal on hover, focus or a tap). Headed "Moves" (Build O); no labels. Hovering a move (or
// focusing it) shows its name beside it; on a card with a preview, the move's preview shows on the equation too (the card's pointer
// code does that, starting faintly as the pointer comes near). The five moves are the properties of equality, in order (Build O): Add,
// Multiply, Divide (a second way in to multiplying by 1/n), Flip everything, Trade places. A card says which are live; the rest are greyed (a tap says why).

import { html } from './addBothMat.js';

// Build O (loop rev 2.4): headed "Moves"; each move's name, on hover and focus, is its property of equality. (Build O's floating symbols
// left of each button went in Build W: the symbol is on the button now.)
export const PANEL_MOVES = [
  { id: 'add', label: 'Addition property of equality: add the same number to both sides', lights: [['fewer', 'Fewer terms']] },
  // (Smaller numbers and One box sit beside Divide, the move that usually earns them: Build P, Part 9, Karl's answer to Build O)
  { id: 'multiply', label: 'Multiplication property of equality', lights: [['nofrac', 'No fractions']] },
  { id: 'divide', label: 'Division property of equality', lights: [['smaller', 'Smaller numbers'], ['onebox', 'One box']] },
  { id: 'flip', label: 'Multiplication property of equality: multiply both sides by −1', lights: [['noopp', 'No opposite box']] },
  { id: 'trade', label: 'Symmetric property of equality: if a = b, then b = a', lights: [['xleft', 'x on the left']] },
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

// The move symbols (Build W, Karl 2026-10-26): one large plain symbol on each square button and nothing else drawn on it. The buttons no
// longer draw the move's equation form (the preview on the equation shows the work on both sides), and no symbol floats beside a button.
//   Add +   Multiply ×   Divide ÷   Flip everything ×(−1) (one short label)   Trade places two curved arrows making a circle (the recycling
//   look: no equals sign, no plus or minus; it replaced Build Q's two arrow icons).
// Each symbol has its own accessible name (the button's name is the formal property). Drawn on a 40 grid, scaled by the button's CSS.
const SVG_NS = 'http://www.w3.org/2000/svg';
const INK = '#2b2a26';
function svgEl(name, attrs = {}, kids = []) {
  const n = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...kids);
  return n;
}
const line = (d, w = 4.6) => svgEl('path', { d, stroke: INK, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' });
const head = (d) => svgEl('path', { d, fill: INK, stroke: INK, 'stroke-width': 1.2, 'stroke-linejoin': 'round' });
export const GLYPHS = {
  add: ['Plus sign', () => [line('M20 6 V34'), line('M6 20 H34')]],
  multiply: ['Times sign', () => [line('M9 9 L31 31'), line('M31 9 L9 31')]],
  divide: ['Division sign', () => [line('M6 20 H34'), svgEl('circle', { cx: 20, cy: 9.5, r: 3.6, fill: INK }), svgEl('circle', { cx: 20, cy: 30.5, r: 3.6, fill: INK })]],
  // two arrows chasing each other round a circle (radius 13 about the centre): the upper one runs left to right, the lower right to left
  trade: ['Two curved arrows making a circle', () => [line('M7.6 15.2 A13 13 0 0 1 28.4 10.1', 4), head('M33.6 13.4 L24.6 11.9 L30.9 5.3 Z'),
    line('M32.4 24.8 A13 13 0 0 1 11.6 29.9', 4), head('M6.4 26.6 L15.4 28.1 L9.1 34.7 Z')]],
};
export function moveGlyph(id) {
  if (id === 'flip') {
    // ×(−1) as one short label: a drawn × the height of the digits (Lexend's own × is small), then (−1). (The times sign is allowed on
    // the Moves panel only.)
    const t = svgEl('text', { x: 21, y: 29.5, fill: INK, 'font-size': 27, 'font-weight': 800, 'font-family': 'Lexend, system-ui, sans-serif' }, ['(−1)']);
    return svgEl('svg', { class: 'lb-icon lx-glyph is-wide', viewBox: '0 0 80 40', role: 'img', 'aria-label': 'Times negative one', focusable: 'false' },
      [line('M5 13 L17 25', 3.8), line('M17 13 L5 25', 3.8), t]);
  }
  const [said, draw] = GLYPHS[id];
  return svgEl('svg', { class: 'lb-icon lx-glyph', viewBox: '0 0 40 40', role: 'img', 'aria-label': said, focusable: 'false' }, draw());
}

// The goal lights are not on screen for students (Build W, Part 2: Karl, "an extra detail students do not pay attention to"). They are
// still worked out everywhere (the helpful / unhelpful judgement, the class sheet and the nudges use them); `?lights=1` draws them beside
// the moves exactly as before, for a teacher or for debugging.
let SHOW_LIGHTS = typeof location !== 'undefined' && new URLSearchParams(location.search).get('lights') === '1';
export const showLights = () => SHOW_LIGHTS;
export const setShowLights = (on) => { SHOW_LIGHTS = Boolean(on); };

// moves: { [id]: { live, greyed (drawn greyed but keeps its own action: a tap says why; Build O), move (the card's data-move, if not the id), action (its data-action, if not choose), attrs (more attributes), flyout, pressed, preview, ring (a steady ring: the move owed), pulse (the
// move to click now), focus } } ; anything not named is greyed. `disabled`: every live move is off for now (a check being stepped...).
// `lights`: { key: state } (a light not named is off); `open`: the light opened by hover or a tap; `flash`: lights that flash once;
// `hand`: a card's own goals reached by hand, after the two (Distribute, combine, solve: No parentheses, Build M).
export function narrowPanel(moves, { disabled = false, lights = {}, open = null, flash = [], hand = null } = {}) {
  const withLights = SHOW_LIGHTS;
  const el = html('aside', `lb-panel lx-panel${withLights ? ' has-lights' : ''}`, [html('div', 'lx-head', ['Moves'])], { 'aria-label': withLights ? 'Moves and goals' : 'Moves' });
  const grid = html('div', 'lx-pgrid');
  const dots = (list, cls = '') => html('div', `lx-dots${cls}`, list.map(([key, name]) => dot(key, name, lights[key] ?? 'off', open === key, flash.includes(key))));
  for (const m of PANEL_MOVES) {
    const o = moves[m.id];
    const id = o?.move ?? m.id;
    let b;
    if (o?.live) {
      b = html('button', `btn btn-move lb-move lx-move${o.greyed ? ' is-grey' : ''}${o.pressed ? ' is-on' : ''}${o.preview ? ' is-preview' : ''}${o.near ? ' is-near' : ''}${o.ring ? ' is-target is-ring' : ''}${o.pulse ? ' is-target' : ''}`, [moveGlyph(m.id)], {
        type: 'button', 'data-action': o.action ?? 'choose', 'data-move': id, 'aria-label': m.label, 'data-tip': m.label, 'data-fk': id, 'aria-pressed': String(Boolean(o.pressed)),
        ...(o.greyed ? { 'aria-disabled': 'true' } : {}),
        ...(o.attrs ?? {}),
      });
      b.disabled = disabled || Boolean(o.off);
      if (o.focus) b.dataset.lxFocus = '1';
      if (o.flyout) b = html('div', 'lx-movewrap', [b, o.flyout]);          // the Multiply options, beside the button (Build D-2)
    } else {
      b = html('button', 'btn lb-move lx-move is-grey', [moveGlyph(m.id)], { type: 'button', 'data-action': 'greyMove', 'data-move': o?.move ?? m.id, 'aria-disabled': 'true', 'aria-label': m.label, 'data-tip': m.label });
    }
    grid.append(b);
    if (withLights) grid.append(dots(m.lights));
  }
  el.append(grid);
  if (withLights) {
    el.append(html('div', 'lx-hand', [dots([...BY_HAND, ...(hand ?? [])], ' is-row')], { 'aria-label': 'Goals reached by hand' }),
      html('div', 'lx-solvedrow', [html('span', 'lx-solvedlabel', ['Solved for x']), dots([['solved', 'Solved for x']], ' is-row')]));
  }
  return el;
}
