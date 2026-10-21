// Take a fraction of both sides, the move itself (lifted out of Divide it in Build J so Flip everything uses the same one): choosing
// it, trying a fraction (one that does not split fails visibly and waits for Undo, the fractions tried are remembered), and the board
// and work row a fraction that splits makes. The board is one x term (any coefficient, either side) and one number on the other side.
// A card says what happens when the fraction splits (Divide it may deal it by hand first). Pure: no DOM.

import { signed, fractionText } from './solveTerms.js';
import { xTerm, numTerm, fracOf } from './divideBoard.js';
import { takeFraction, FRACTIONS } from './divide.js';

// ---------- the board: x (with its number in front) on one side, a number on the other ----------
export const xSideOf = (board) => (board.left.some((t) => t.kind === 'x') ? 'left' : 'right');
const otherSideOf = (board) => (xSideOf(board) === 'left' ? 'right' : 'left');
export const xOf = (board) => board[xSideOf(board)].find((t) => t.kind === 'x');
export const coefOn = (board) => xOf(board).coef ?? 1;
export const otherTerm = (board) => board[otherSideOf(board)][0];
// the same board with each side's terms made by `f(term, isXSide)`, the left side first (so new terms are numbered as Divide's were)
export const mapSides = (board, f) => {
  const xs = xSideOf(board);
  return { left: f(board.left, xs === 'left'), right: f(board.right, xs === 'right') };
};
// a fraction of a side: `⅓(…)`, or `−⅓(…)` when the fraction is negative (Flip everything's one-move −⅓)
const fracTerm = (n, inner, sign) => (sign < 0 ? { ...fracOf(n, inner), sign: -1 } : fracOf(n, inner));

// The work row (`⅓(3x) = ⅓(−12)`) and the board after taking sign/n of both sides. The side away from x stays unsimplified on the move
// that finishes (x alone with a plain 1 in front), so the value is never shown before it is typed; a partial move shows the new numbers.
export function applyFraction(board, n, sign = 1) {
  const a = coefOn(board);
  const b = otherTerm(board).v;
  const work = mapSides(board, (terms) => [fracTerm(n, [terms[0]], sign)]);
  const na = (a * sign) / n;
  const next = na === 1
    ? mapSides(board, (terms, mine) => (mine ? [xTerm(1)] : [fracTerm(n, [numTerm(b)], sign)]))
    : mapSides(board, (terms, mine) => (mine ? [xTerm(na)] : [numTerm((b * sign) / n)]));
  return { work, next };
}

// What a failed try says: which side broke (the boxes are counted by their size: −3x is three boxes).
export function failParams(board, n, res) {
  return { n, frac: fractionText(n), boxes: Math.abs(coefOn(board)), b: signed(otherTerm(board).v), left: res.leftOver, boxesSplit: res.boxesSplit, countersSplit: res.countersSplit };
}

// Choosing the move: blocked while something waits for Undo; at x alone there is nothing to take.
export function chooseFraction(s, api, say, alone) {
  const g = api.blockMove(s);
  if (g) return g;
  if (alone(s.board)) return say(s, 'aSolvedBoard');
  s.menu = 'fraction';
  s.fail = null;
  return say(s, 'dPickFraction');
}

// Trying a fraction (`take`, with `sign: -1` for a negative one where the card allows it). A new try replaces a failed one; a forced
// path takes only the fraction that leaves one box. A fraction that does not split writes its failed row and waits for Undo; one that
// splits goes to `split(s, n, sign)`, the card's.
export function takeStep(s, action, api, say, split) {
  if (s.menu !== 'fraction' || !FRACTIONS.includes(action.n)) return 'ignore';
  const g = api.blockMove(s);
  if (g) return g === 'ignore' ? g : 'ignore';
  const n = action.n;
  const sign = action.sign === -1 ? -1 : 1;
  if ((s.fail || s.deal) && s.history.length) { const reds = s.reds; api.restore(s, s.history.pop()); s.reds = reds; }   // a new try replaces the last one
  const a = coefOn(s.board);
  if (s.forced && n !== Math.abs(a)) return say(s, 'dForced', { frac: fractionText(Math.abs(a)) }, true);
  const check = takeFraction({ a, b: otherTerm(s.board).v }, n);
  api.pushHistory(s);
  s.hint = null;
  if (!check.ok) {
    if (!s.tried.includes(n)) s.tried = [...s.tried, n];
    s.fail = { n, boxesSplit: check.boxesSplit, countersSplit: check.countersSplit };
    s.reds += 1;
    const work = mapSides(s.board, (terms) => [fracTerm(n, [terms[0]], sign)]);
    s.rows.push({ type: 'work', board: work, failed: true });
    return say(s, s.reds >= 3 ? 'dFail3' : 'dFail', failParams(s.board, n, check), true);
  }
  return split(s, n, sign, check);
}
