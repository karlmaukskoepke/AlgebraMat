// The Mat for the numeric tutorials (engine/numericTutorial.js). While exploring, the numbers stand on the balance as groups of
// counters (the same balance as the real card: see tutorialGame.js); here is the quiz: the scenario, and (after a miss) the two
// equations side by side with their readouts.

import { readoutOf, equationText, quizBoard, QUIZ_LENGTH } from '../engine/numericTutorial.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(name, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

export const VIEW_WIDTH = 760;
export const TITLES = { add: 'Adding to both sides', trade: 'Trading places', cross: 'Crossing the border' };

// The problem the quiz is about: its title, the equation, and the readout (big, with room round it).
export function quizProblemSvg(t) {
  const W = VIEW_WIDTH;
  const svg = el('svg', { class: 'mat value-mat addboth-mat tutorial-mat', viewBox: `0 0 ${W} 190`, role: 'group', 'aria-label': `Quiz: ${TITLES[t.kind]}` });
  const b = quizBoard(t);
  const r = readoutOf(b);
  svg.append(el('text', { x: W / 2, y: 40, 'text-anchor': 'middle', class: 'tu-title' }, [`Quick quiz  ${Math.min(t.quiz + 1, QUIZ_LENGTH(t.kind))} of ${QUIZ_LENGTH(t.kind)}`]));
  svg.append(el('text', { x: W / 2, y: 110, 'text-anchor': 'middle', class: 'ab-eq' }, [equationText(b)]));
  svg.append(el('text', { x: W / 2, y: 160, 'text-anchor': 'middle', class: `ab-readout ${r.balanced ? 'is-good' : 'is-bad'}`, style: 'font-size:40px' }, [r.text]));
  return svg;
}

// After a miss: the equation before and after, side by side with their readouts.
export function quizRevealSvg(t) {
  if (!t.reveal) return null;
  const W = VIEW_WIDTH;
  const svg = el('svg', { class: 'mat value-mat addboth-mat tutorial-mat', viewBox: `0 0 ${W} 250`, role: 'group', 'aria-label': 'Before and after' });
  let y = 36;
  for (const [label, eq, read] of [['Before', t.reveal.before, t.reveal.beforeRead], ['After', t.reveal.after, t.reveal.afterRead]]) {
    svg.append(el('text', { x: W / 2, y, 'text-anchor': 'middle', class: 'tu-reveal-label' }, [label]));
    svg.append(el('text', { x: W / 2, y: y + 42, 'text-anchor': 'middle', class: 'ab-check' }, [eq]));
    svg.append(el('text', { x: W / 2, y: y + 82, 'text-anchor': 'middle', class: `ab-readout ${read.includes('Unbalanced') ? 'is-bad' : 'is-good'}` }, [read]));
    y += 110;
  }
  return svg;
}
