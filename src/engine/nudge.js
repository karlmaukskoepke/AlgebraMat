// The nudge rule (loop spec rev 2.5, §2A; Build P, Part 1): after about 2.5 seconds with nothing happening, the app nudges when the next
// step is MECHANICAL and there is only one thing to do: put two like terms together (combine) or work out a factor times a number
// (calculate a product). It never nudges a choice of move: that is the thinking, and it waits for I'm stuck. A nudge is not help: it
// changes nothing in the state and records nothing on the class sheet. This is the pure half (what to nudge, if anything); the screen
// half is view/nudge.js. Pure logic, no DOM.

import { isLike } from './lightsGrab.js';
import { signed, fractionText } from './solveTerms.js';
import { MINUS } from './expr.js';

// x alone on its side: the side holds one term, x with nothing in front of it (`x = −3 + 5` is typed, never nudged)
export function xAloneOn(board) {
  for (const side of ['left', 'right']) {
    const terms = board[side];
    if (terms.length === 1 && terms[0].kind === 'x' && (terms[0].coef ?? 1) === 1) return true;
  }
  return false;
}
const xSideOf = (board) => (board.left.some((t) => t.kind === 'x' || t.kind === 'group') ? 'left' : 'right');

// Nothing else is going on: no check, no move half made or waiting for Undo, no help, nothing typed, nothing being combined or distributed.
export function quietState(s) {
  if (!s || s.stage !== 'moves' || s.sub || s.needUndo || s.scaffold || s.pic || s.fail || s.menu || s.pending || s.hint || s.teachFlow) return false;
  if (s.entry || s.amountEntry || s.combining || s.resolving) return false;
  if (s.lx?.combine || s.lx?.distribute || s.lx?.calc) return false;
  return true;
}

// The first two like terms on a side (numbers, or x-terms), x's side first: { a, b, side }, or null.
export function combinablePair(board) {
  const first = xSideOf(board);
  for (const side of [first, first === 'left' ? 'right' : 'left']) {
    const terms = board[side];
    for (let i = 0; i < terms.length; i++) {
      for (let j = i + 1; j < terms.length; j++) {
        if ((terms[i].kind === 'num' || terms[i].kind === 'x') && isLike(terms[i], terms[j])) return { a: terms[i].id, b: terms[j].id, side };
      }
    }
  }
  return null;
}

// A factor times a number left by a division or a fraction (`⅓(15)`, or `(15)/3` in division form): { id, side }, or null.
export function productOf(board) {
  for (const side of ['left', 'right']) {
    for (const t of board[side]) {
      if (t.kind === 'frac' && t.inner?.length === 1 && t.inner[0].kind === 'num' && t.inner[0].v % t.n === 0) return { id: t.id, side };
    }
  }
  return null;
}

// A product's words (Build P, Part 2): `⅓ · 15`, `⅓(−15)` (Build U: no times sign) (or `15 ÷ 3`, in division form: a fraction the Divide button made), the number, the divisor
export function calcParams(s, t) {
  const div = Boolean(s.divIds?.includes(t.id));
  const b = t.inner[0].v;
  const neg = t.sign < 0;
  return {
    div,
    expr: div ? `${signed(b)} ÷ ${neg ? `(${MINUS}${t.n})` : t.n}` : `${neg ? MINUS : ''}${fractionText(t.n)}${b < 0 ? `(${signed(b)})` : ` · ${b}`}`,
    b: signed(b),
    by: `${neg ? MINUS : ''}${t.n}`,
    of: `${neg ? MINUS : ''}${fractionText(t.n)} of ${signed(b)}`,   // (Build T: fraction words for a fraction, no division words)
    n: t.n,
    neg,
  };
}

// What to nudge on this state: { kind: 'calc', id, side, div } (a product to work out: Build P, Part 2) or { kind: 'combine', a, b, side },
// or null. Only while x is not alone: at x alone the student types x (the solved value is never displayed).
export function nudgeOf(s) {
  if (!quietState(s) || !s.board || xAloneOn(s.board)) return null;
  const calc = productOf(s.board);
  if (calc) return { kind: 'calc', ...calc, div: Boolean(s.divIds?.includes(calc.id)) };
  const pair = combinablePair(s.board);
  if (pair) return { kind: 'combine', ...pair };
  return null;
}
