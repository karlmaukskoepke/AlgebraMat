// Flip everything and the fraction that follows it, the moves themselves (lifted out of the Flip everything card in Build K so the
// Two-step card uses the same ones): both sides times −1, written out as `−1 × (−x) = −1 × (12)`, and a fraction of both sides that
// splits, each committed through the loop with the lights from the shapes before and after. The board is one x term (with its number in
// front) and one number on the other side. A flip is helpful when x had a minus; a flip of x with no minus is legal but waits for Undo,
// and says what happened in the real numbers. A card says how its boards are read (`shape`), what x alone is, and how it talks. No DOM.

import { lightsOf } from './solveit/shape.js';
import { signed } from './solveTerms.js';
import { numTerm } from './divideBoard.js';
import { applyFraction, coefOn, otherTerm, mapSides, xWith } from './fractionMove.js';

let counter = 0;
const id = () => `f${++counter}`;
const timesTerm = (f, inner) => ({ id: id(), kind: 'times', f, inner });
const negTerm = (inner) => ({ id: id(), kind: 'neg', inner });
const coefText = (c) => (c === 1 ? 'x' : c === -1 ? '−x' : `${signed(c)}x`);

// Flip everything: the work row `−1 × (−x) = −1 × (12)` and the board after it. The flip that finishes (x alone) leaves the other side
// as `−(12)`; a flip that does not finish (`−3x = 12` → `3x = −12`, or the unhelpful `3x = −12` → `−3x = 12`) shows the new numbers.
export function applyFlip(board) {
  const a = coefOn(board);
  const b = otherTerm(board).v;
  const work = mapSides(board, (terms) => [timesTerm(-1, [terms[0]])]);
  const next = -a === 1
    ? mapSides(board, (terms, mine) => (mine ? xWith(terms[0], 1) : [negTerm([numTerm(b)])]))
    : mapSides(board, (terms, mine) => (mine ? xWith(terms[0], -a) : [numTerm(-b)]));
  return { work, next };
}

// o: { shape(board), alone(board), say }. A flip is helpful when x had a minus (No opposite box goes green on Flip everything); a flip of
// x with no minus waits for Undo, and the new minus on x is lit with what happened.
export function commitFlip(s, api, o) {
  const before = s.board;
  const a = coefOn(before);
  const b = otherTerm(before).v;
  api.pushHistory(s);
  s.hint = null;
  const { work, next } = applyFlip(before);
  const helpful = a < 0;
  api.commit(s, { rows: [{ type: 'work', board: work }, { type: 'eq', board: next }], next, label: { flip: true }, helpful, lights: lightsOf(o.shape(before), o.shape(next)) });
  s.fail = null;
  if (!helpful) return o.say(s, 'fWorse', { was: coefText(a), now: coefText(-a), b: signed(b), nb: signed(-b) }, true);
  return o.say(s, o.alone(next) ? 'aSolvedBoard' : 'aFindX');
}

// A fraction that splits is always helpful (the number in front of x gets smaller). Taking −⅓ of `−3x = 12` finishes in one move.
export function commitFraction(s, n, sign, api, o) {
  const before = s.board;
  const { work, next } = applyFraction(before, n, sign);
  api.commit(s, { rows: [{ type: 'work', board: work }, { type: 'eq', board: next }], next, label: { n, ...(sign < 0 ? { sign } : {}) }, helpful: true, lights: lightsOf(o.shape(before), o.shape(next)) });
  s.fail = null;
  return o.say(s, o.alone(next) ? 'aSolvedBoard' : 'aFindX');
}
