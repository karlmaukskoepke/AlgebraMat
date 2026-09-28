// Lasso step 2: hard-coded problems drawn on the static Lasso Mat, so the
// visuals can be checked against the notes before the moves are built.
// Shown only at ?demo=lasso; the pack map still says Lasso is coming soon.

import { makeGroups } from '../engine/groups.js';
import { renderLassoMat } from './lassoMat.js';

const terms = (sign, n) => Array.from({ length: n }, () => ({ kind: 'int', sign }));
const lassos = (count, sign, n, opposite = false) =>
  Array.from({ length: count }, () => ({ opposite, terms: terms(sign, n) }));

export const DEMOS = [
  {
    caption: '3(−2): three groups of −2, counted.',
    state: {
      script: 'whole', problem: makeGroups({ n: 3 }, -2),
      lassos: lassos(3, '-', 2), total: -6, flipped: false, answer: -6,
    },
  },
  {
    caption: '−2(−4): opposite groups, filled, then flipped with opp.',
    state: {
      script: 'whole', problem: makeGroups({ neg: true, n: 2 }, -4),
      lassos: lassos(2, '-', 4, true), total: -8, flipped: true, answer: 8,
    },
  },
  {
    caption: '−(−5): the hidden 1 written in; counted, not yet flipped.',
    state: {
      script: 'whole', problem: makeGroups({ neg: true, n: 1 }, -5, { hidden1: true }), wroteOne: true,
      lassos: lassos(1, '-', 5, true), total: -5, flipped: false, answer: null,
    },
  },
  {
    caption: '−3(4): the opposite of 3 groups of 4, flipped with opp.',
    state: {
      script: 'whole', problem: makeGroups({ neg: true, n: 3 }, 4),
      lassos: lassos(3, '+', 4, true), total: 12, flipped: true, answer: -12,
    },
  },
  {
    caption: '2/3(−6): split into 3 equal parts, take 2.',
    state: {
      script: 'fraction', problem: makeGroups({ n: 2, d: 3 }, -6),
      whole: [], parts: [0, 1, 2].map((i) => ({ terms: terms('-', 2), taken: i < 2 })),
      total: -4, flipped: false, answer: -4,
    },
  },
  {
    caption: '−1/4(−12): mid-split — some counters still in the whole group.',
    state: {
      script: 'fraction', problem: makeGroups({ neg: true, n: 1, d: 4 }, -12),
      whole: terms('-', 4), parts: [3, 3, 1, 1].map((n) => ({ terms: terms('-', n), taken: false })),
      total: null, flipped: false, answer: null,
    },
  },
  {
    caption: '−3/5(10): sixths are the most parts; here fifths, taken and flipped.',
    state: {
      script: 'fraction', problem: makeGroups({ neg: true, n: 3, d: 5 }, 10),
      whole: [], parts: [0, 1, 2, 3, 4].map((i) => ({ terms: terms('+', 2), taken: i < 3 })),
      total: 6, flipped: true, answer: -6,
    },
  },
];

export function showLassoDemo(root) {
  const page = document.createElement('main');
  page.className = 'lasso-demo';
  const h = document.createElement('h1');
  h.textContent = 'Lasso Mat — static preview';
  page.append(h);
  for (const { caption, state } of DEMOS) {
    const fig = document.createElement('figure');
    const cap = document.createElement('figcaption');
    cap.textContent = caption;
    fig.append(renderLassoMat(state), cap);
    page.append(fig);
  }
  root.replaceChildren(page);
}
