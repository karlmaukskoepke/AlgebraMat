// The Mat for light mode on Groups of Terms: the problem, with the arrows over the top when they've been asked for
// (from the number out front to each term inside), and the answer being typed. SVG in the same 860×340 box as the
// other Mats, styled like Groups of Terms' own (the same word and arrow classes).

import { MINUS } from '../engine/expr.js';
import { termText } from '../engine/terms.js';
import { textWidth } from './boxLayout.js';
import { prettyAnswer } from '../engine/terms.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const FONT = 64;
const BASE_Y = 190;

function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

// The problem as separate words, so the arrows can point at them: 3 ( 2x − 1 ).
export function problemWords(problem) {
  const { neg, n, d } = problem.count;
  const [t1, t2] = problem.inside;
  return [
    { text: `${neg ? MINUS : ''}${d > 1 ? `${n}/${d}` : n}`, kind: 'a' },
    { text: '(', kind: 'paren' },
    { text: termText({ ...t1, op: '+' }, true), kind: 'term' },
    { text: t2.value < 0 ? MINUS : '+', kind: 'op' },
    { text: termText({ ...t2, value: Math.abs(t2.value), op: '+' }, true), kind: 'term' },
    { text: ')', kind: 'paren' },
  ];
}

// `arrows` draws them (`fresh`: drawing themselves in, once); `typed` is what's been typed, `done` says it's right.
export function renderGroupLightMat({ problem, arrows, fresh = false, typed, done }) {
  const svg = el('svg', { class: 'mat lasso-mat tg-mat light-group-mat', viewBox: '0 0 860 340', role: 'group', 'aria-label': 'Type the answer' });
  const words = problemWords(problem);
  const gaps = words.map((w) => (w.kind === 'paren' && w.text === '(' ? 6 : 16));
  const widths = words.map((w) => textWidth(w.text, FONT));
  const total = widths.reduce((sum, w, i) => sum + w + (i < words.length - 1 ? gaps[i] : 0), 0);
  let x = (860 - total) / 2;
  const placed = words.map((w, i) => {
    const out = { ...w, cx: x + widths[i] / 2 };
    x += widths[i] + gaps[i];
    return out;
  });
  const g = el('g', { class: 'check-it light-words' });
  for (const w of placed) {
    g.append(el('text', {
      x: w.cx, y: BASE_Y, 'text-anchor': 'middle', style: `font-size:${FONT}px`,
      class: `tg-word is-${w.kind === 'a' ? 'groups' : w.kind === 'term' ? 'inside' : 'ink'}`,
    }, [w.text]));
  }
  if (arrows) {
    // An arrow from the number out front over the top to each term, drawing itself in.
    const a = placed[0];
    placed.filter((w) => w.kind === 'term').forEach((term, k) => {
      const top = BASE_Y - FONT - 14 - k * 22;
      const from = BASE_Y - FONT + 2;
      g.append(el('path', {
        d: `M ${a.cx} ${from} V ${top} H ${term.cx} V ${from} M ${term.cx - 9} ${from - 11} L ${term.cx} ${from + 2} L ${term.cx + 9} ${from - 11}`,
        class: `arrow is-groups check-arrow${fresh ? ' draw-in' : ''}`, pathLength: 1,
      }));
    });
  }
  svg.append(g);
  const shown = prettyAnswer(typed);
  svg.append(el('text', {
    x: 430, y: BASE_Y + 96, 'text-anchor': 'middle', class: `light-answer${done ? ' is-done' : ''}${!done && !shown ? ' is-empty' : ''}`,
  }, [`= ${shown || '?'}`]));
  return svg;
}
