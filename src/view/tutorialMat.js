// The Mat for the numeric tutorials (engine/numericTutorial.js): an equation of plain numbers with its readout, the
// numbers as tokens either side of the border, and, in the quiz, the scenario and (after a miss) the two equations side by
// side. Trading places is animated: the sides rotate around the = sign without mirroring anything.

import { MINUS } from '../engine/expr.js';
import { drawSeesaw, angleFor } from './addBothMat.js';
import { readoutOf, equationText, quizItem, quizBoard } from '../engine/numericTutorial.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  node.append(...children);
  return node;
}
const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

export const VIEW_WIDTH = 900;
const TOKEN_H = 60;
const GAP = 46;
const MIDDLE = 110;
const tokenWidth = (v) => Math.max(76, 34 + signed(v).length * 24);

export const TITLES = { add: 'Adding to both sides', trade: 'Trading places', cross: 'Crossing the border' };

// Lay out one side's tokens left to right: [{ id, v, x, width }] and the side's width.
export function layoutSide(terms) {
  let x = 0;
  const out = terms.map((t) => { const width = tokenWidth(t.v); const item = { id: t.id, v: t.v, x, width }; x += width + GAP; return item; });
  return { items: out, width: Math.max(0, x - GAP) };
}

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function drawBoard(svg, b, W, y, opts = {}) {
  const l = layoutSide(b.left);
  const r = layoutSide(b.right);
  const total = l.width + MIDDLE + r.width;
  const x0 = (W - total) / 2;
  const borderX = x0 + l.width + MIDDLE / 2;
  if (opts.angle !== undefined) drawSeesaw(svg, borderX, y - 74, total / 2 + 20, opts.angle);
  svg.append(el('line', { x1: borderX, y1: y - 12, x2: borderX, y2: y + TOKEN_H + 12, class: 'sv-border' }));
  svg.append(el('text', { x: borderX, y: y + TOKEN_H / 2 + 14, 'text-anchor': 'middle', class: 'vm-plus ab-equals' }, ['=']));
  const sides = [];
  for (const [side, layout, startX] of [['left', l, x0], ['right', r, x0 + l.width + MIDDLE]]) {
    const g = el('g', { class: `tu-side tu-${side}` });
    layout.items.forEach((it, i) => {
      if (i > 0) g.append(el('text', { x: startX + it.x - GAP / 2, y: y + TOKEN_H / 2 + 12, 'text-anchor': 'middle', class: 'ab-plus' }, ['+']));
      const action = opts.tap ? opts.tap(it.id) : null;
      const cls = `ab-token${opts.crossed === it.id ? ' is-crossing' : ''}`;
      const tok = el('g', { class: cls, ...(action ? { 'data-action': action, 'data-id': it.id, role: 'button', tabindex: '0', 'aria-label': `Number ${signed(it.v)}` } : {}) });
      tok.append(el('rect', { x: startX + it.x, y, width: it.width, height: TOKEN_H, rx: 12, class: 'ab-token-box' }));
      tok.append(el('text', { x: startX + it.x + it.width / 2, y: y + TOKEN_H / 2 + 12, 'text-anchor': 'middle', class: 'ab-token-text' }, [signed(it.v)]));
      g.append(tok);
    });
    svg.append(g);
    sides.push({ g, side, layout, startX });
  }
  svg.setAttribute('data-border-x', String(borderX));
  return { l, r, x0, sides };
}

// Trading places: the side now on the left travels up and over from the right; the one now on the right travels down and over.
function animateTrade(sides, l, r) {
  if (reduceMotion()) return;
  const [left, right] = sides;
  const frames = (dx, arc) => [{ transform: `translate(${dx}px, 0px)` }, { transform: `translate(${dx / 2}px, ${arc}px)`, offset: 0.5 }, { transform: 'translate(0px, 0px)' }];
  requestAnimationFrame(() => {
    try {
      left.g.animate(frames(r.width + MIDDLE, -70), { duration: 900, easing: 'ease-in-out' });
      right.g.animate(frames(-(l.width + MIDDLE), 70), { duration: 900, easing: 'ease-in-out' });
    } catch { /* animation not available: the sides just swap */ }
  });
}

export function renderTutorialMat(t) {
  const svg = el('svg', { class: 'mat value-mat addboth-mat tutorial-mat', viewBox: `0 0 ${VIEW_WIDTH} 520`, role: 'group', 'aria-label': `Tutorial: ${TITLES[t.kind]}` });
  const W = VIEW_WIDTH;
  svg.append(el('text', { x: W / 2, y: 60, 'text-anchor': 'middle', class: 'tu-title' }, [TITLES[t.kind]]));
  let y = 120;

  if (t.stage === 'quiz' || t.stage === 'quizDone') {
    const item = quizItem(t);
    const b = quizBoard(t);
    const r = readoutOf(b);
    if (item) svg.append(el('text', { x: W / 2, y, 'text-anchor': 'middle', class: 'tu-scenario' }, [item.say]));
    y += 56;
    svg.append(el('text', { x: W / 2, y, 'text-anchor': 'middle', class: 'ab-check' }, [equationText(b)]));
    svg.append(el('text', { x: W / 2, y: y + 40, 'text-anchor': 'middle', class: `ab-readout ${r.balanced ? 'is-good' : 'is-bad'}` }, [r.text]));
    y += 100;
    if (t.reveal) {
      for (const [label, eq, read] of [['before', t.reveal.before, t.reveal.beforeRead], ['after', t.reveal.after, t.reveal.afterRead]]) {
        svg.append(el('text', { x: W / 2, y, 'text-anchor': 'middle', class: 'tu-reveal-label' }, [label === 'before' ? 'Before' : 'After']));
        svg.append(el('text', { x: W / 2, y: y + 42, 'text-anchor': 'middle', class: 'ab-check' }, [eq]));
        svg.append(el('text', { x: W / 2, y: y + 82, 'text-anchor': 'middle', class: `ab-readout ${read.includes('Unbalanced') ? 'is-bad' : 'is-good'}` }, [read]));
        y += 110;
      }
    } else if (t.stage === 'quiz') {
      svg.append(el('text', { x: W / 2, y: y + 20, 'text-anchor': 'middle', class: 'ab-note' }, ['Does it keep the balance, or upset it?']));
      y += 60;
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${y + 20}`);
    return svg;
  }

  const r = readoutOf(t.board);
  svg.append(el('text', { x: W / 2, y, 'text-anchor': 'middle', class: `ab-readout tu-readout ${r.balanced ? 'is-good' : 'is-bad'}` }, [r.text]));
  y += 60;
  const tap = t.kind === 'cross' ? (id) => (t.flipMode || t.crossed === id ? 'flipSign' : t.crossed ? null : 'cross') : null;
  y += 80;
  const drawn = drawBoard(svg, t.board, W, y, { tap, crossed: t.crossed, angle: angleFor(r.left - r.right) });
  if (t.anim === 'trade') animateTrade(drawn.sides, drawn.l, drawn.r);
  y += TOKEN_H + 60;
  if (t.kind === 'add' && t.menu === 'add') {
    svg.append(el('text', { x: W / 2, y, 'text-anchor': 'middle', class: 'ab-note' }, [`Amount: ${t.amountEntry ? t.amountEntry.replace('-', MINUS) : '?'}`]));
    y += 50;
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${y + 20}`);
  return svg;
}
