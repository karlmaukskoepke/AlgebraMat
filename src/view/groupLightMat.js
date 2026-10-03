// The Mat for light mode on Groups of Terms: the problem, with the arrows over the top when they've been asked for
// (from the number out front to each term inside), and the answer being typed. SVG in the same 860×340 box as the
// other Mats, styled like Groups of Terms' own (the same word and arrow classes).

import { MINUS } from '../engine/expr.js';
import { termText, numberText } from '../engine/terms.js';
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

// The problem as separate words, so the arrows can point at them: 3 ( 2x − 1 ), or 5 + 2 ( 3x − 4 ) for Distribute.
// `from` is the number out front (what the arrows leave) and `to` the terms inside (what they point at).
export function problemLayout(problem) {
  return problem.kind === 'distribute' ? distributeLayout(problem) : groupLayout(problem);
}

export const problemWords = (problem) => problemLayout(problem).words;

function groupLayout(problem) {
  const { neg, n, d } = problem.count;
  const [t1, t2] = problem.inside;
  const words = [
    { text: `${neg ? MINUS : ''}${d > 1 ? `${n}/${d}` : n}`, kind: 'a' },
    { text: '(', kind: 'paren' },
    { text: termText({ ...t1, op: '+' }, true), kind: 'term' },
    { text: t2.value < 0 ? MINUS : '+', kind: 'op' },
    { text: termText({ ...t2, value: Math.abs(t2.value), op: '+' }, true), kind: 'term' },
    { text: ')', kind: 'paren' },
  ];
  return { words, from: 0, to: [2, 4] };
}

// Distribute, then combine: loose terms and one group, in the order they're written. A hidden 1 is shown as a 1 (the
// arrows leave it); a subtracted group's − stands in front of its number.
function distributeLayout(problem) {
  const words = [];
  let from = null;
  const to = [];
  problem.parts.forEach((part, i) => {
    if (part.type === 'term') {
      if (i > 0) words.push({ text: part.term.op === '-' ? MINUS : '+', kind: 'op' });
      words.push({ text: numberText(part.term), kind: 'loose' });
      return;
    }
    const sign = part.op === '-' ? MINUS : '+';
    if (i > 0) words.push({ text: sign, kind: 'op' });
    from = words.length;
    words.push({ text: `${i === 0 && part.op === '-' ? MINUS : ''}${part.hiddenOne ? 1 : part.n}`, kind: 'a' });
    words.push({ text: '(', kind: 'paren' });
    const [t1, t2] = part.inside;
    to.push(words.length);
    words.push({ text: numberText(t1), kind: 'term' });
    words.push({ text: t2.value < 0 ? MINUS : '+', kind: 'op' });
    to.push(words.length);
    words.push({ text: numberText({ ...t2, value: Math.abs(t2.value) }), kind: 'term' });
    words.push({ text: ')', kind: 'paren' });
  });
  return { words, from, to };
}

// `arrows` draws them (`fresh`: drawing themselves in, once); `typed` is what's been typed, `done` says it's right.
export function renderGroupLightMat({ problem, arrows, fresh = false, typed, done }) {
  const svg = el('svg', { class: 'mat lasso-mat tg-mat light-group-mat', viewBox: '0 0 860 340', role: 'group', 'aria-label': 'Type the answer' });
  const { words, from, to } = problemLayout(problem);
  // The biggest size that fits across the Mat (a longer problem is set a little smaller).
  let font = FONT;
  const layout = (size) => {
    const widths = words.map((w) => textWidth(w.text, size));
    const gaps = words.map((w) => (w.kind === 'paren' && w.text === '(' ? 6 : 16));
    return { widths, gaps, total: widths.reduce((sum, w, i) => sum + w + (i < words.length - 1 ? gaps[i] : 0), 0) };
  };
  while (font > 36 && layout(font).total > 800) font -= 4;
  const { widths, gaps, total } = layout(font);
  let x = (860 - total) / 2;
  const placed = words.map((w, i) => {
    const out = { ...w, cx: x + widths[i] / 2 };
    x += widths[i] + gaps[i];
    return out;
  });
  const g = el('g', { class: 'check-it light-words' });
  for (const w of placed) {
    g.append(el('text', {
      x: w.cx, y: BASE_Y, 'text-anchor': 'middle', style: `font-size:${font}px`,
      class: `tg-word is-${w.kind === 'a' ? 'groups' : w.kind === 'term' ? 'inside' : 'ink'}`,
    }, [w.text]));
  }
  if (arrows && from !== null) {
    // An arrow from the number out front over the top to each term inside, drawing itself in.
    const a = placed[from];
    to.map((i) => placed[i]).forEach((term, k) => {
      const top = BASE_Y - font - 14 - k * 22;
      const start = BASE_Y - font + 2;
      g.append(el('path', {
        d: `M ${a.cx} ${start} V ${top} H ${term.cx} V ${start} M ${term.cx - 9} ${start - 11} L ${term.cx} ${start + 2} L ${term.cx + 9} ${start - 11}`,
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
