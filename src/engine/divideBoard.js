// Divide it's board (`ax = b`: a boxes on the left, b counters on the right; after the finishing move `x = ⅟a(b)`) and the few
// readings of it that the card, its help (engine/solveit/rungs/divide.js) and its screen share. Pure: no DOM.

import { signed } from './solveTerms.js';

let counter = 0;
const id = () => `d${++counter}`;
export const xTerm = (coef) => ({ id: id(), kind: 'x', coef });
export const numTerm = (v) => ({ id: id(), kind: 'num', v });
export const fracOf = (n, inner) => ({ id: id(), kind: 'frac', n, inner, blue: true });

export const startBoard = (p) => ({ left: [xTerm(p.a)], right: [numTerm(p.b)] });
export const coefOf = (board) => board.left[0].coef;
export const xAlone = (board) => coefOf(board) === 1;

// The counters: a pile the size of the number on the right (at most 36), dealt into n groups, one kept.
export const DEAL_ROUND_LEVEL = 4;                                              // Deal a round arrives with the bigger levels (spec §2: Level 4)
export const pileSize = (board) => (board.right[0].kind === 'num' ? Math.min(36, Math.abs(board.right[0].v)) : 0);

// At x alone with an unevaluated side (`x = ⅓(6)`): the diagram of the right side only, on every rung (spec §5).
export function diagOf(board) {
  const t = board.right[0];
  return { n: t.n, size: Math.min(36, Math.abs(t.inner[0].v)), neg: t.inner[0].v < 0, val: signed(t.inner[0].v), groups: null, kept: null, guided: false };
}
