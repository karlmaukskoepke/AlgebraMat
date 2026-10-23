// Add to both sides' board, as pure helpers (SPEC-ADD-TO-BOTH-SIDES.md). The equation is a board of terms: an x, and numbers. Since
// Build E (P4) the card is a configuration of the shared Solve it loop (engine/cards/add.js); its help is the scaffold registry's
// (engine/solveit/rungs/add.js). What stays here is what the card, its help, its screen and its seesaw all read: making the board, which
// side x is on, combining two numbers, the move written out (the work row) and the board after it. No state, no DOM.

import { constantOf, signed, formatAddBoth, tagAddBoth } from './addBoth.js';

let counter = 0;
const nextId = () => `t${++counter}`;
export const xTerm = () => ({ id: nextId(), kind: 'x' });
export const num = (v) => ({ id: nextId(), kind: 'num', v });

export function startBoard(p) {
  const xSide = [xTerm(), num(constantOf(p))];
  const other = [num(p.b)];
  return p.mirror ? { left: other, right: xSide } : { left: xSide, right: other };
}

export const sideOf = (board, id) => (board.left.some((t) => t.id === id) ? 'left' : board.right.some((t) => t.id === id) ? 'right' : null);
export const find = (board, id) => [...board.left, ...board.right].find((t) => t.id === id);
// (a factor times a parenthesis holds an x too: `3(x + 2)`, Build M)
export const hasX = (t) => t.kind === 'x' || t.kind === 'group';
export const xSideOf = (board) => (board.left.some(hasX) ? 'left' : 'right');
export const otherSideOf = (board) => (xSideOf(board) === 'left' ? 'right' : 'left');
export const countTerms = (board) => board.left.length + board.right.length;
export const sumNums = (terms) => terms.filter((t) => t.kind === 'num').reduce((s, t) => s + t.v, 0);
// A side as written in the notes: "x + 3", "−6 + −3" (a negative number after a plus).
export const sideValueText = (terms) => terms.map((t) => (t.kind === 'x' ? 'x' : signed(t.v))).join(' + ');
export const boardText = (board) => `${sideValueText(board.left)} = ${sideValueText(board.right)}`;

// Groups that can be combined: any two numbers on the same side. Same signs make a Party, opposite signs a Battle.
export function combinable(board) {
  const out = [];
  for (const side of ['left', 'right']) {
    const nums = board[side].filter((t) => t.kind === 'num');
    for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) out.push({ side, a: nums[i].id, b: nums[j].id });
  }
  return out;
}
export const unresolved = (board) => combinable(board).length > 0;
export const kindOf = (a, b) => (Math.sign(a) === Math.sign(b) ? 'party' : 'battle');

// A side with nothing left on it says 0 (a side is never empty).
const keepZero = (terms) => (terms.length ? terms : [{ id: nextId(), kind: 'num', v: 0 }]);

// Combine two numbers on one side into their sum (a Battle leaves what is left of the bigger; equal ones leave nothing).
export function combineTerms(board, aId, bId) {
  const a = find(board, aId);
  const b = find(board, bId);
  const side = sideOf(board, aId);
  if (!a || !b || a.kind !== 'num' || b.kind !== 'num' || side !== sideOf(board, bId) || a.id === b.id) return null;
  const total = a.v + b.v;
  const terms = [];
  for (const t of board[side]) {
    if (t.id === a.id) { if (total !== 0) terms.push({ id: nextId(), kind: 'num', v: total }); } else if (t.id !== b.id) terms.push(t);
  }
  return { ...board, [side]: keepZero(terms) };
}

// Is x alone on its side (and so, once the other side is one number, solved)? What does the board say x is?
export const xAlone = (board) => board[xSideOf(board)].length === 1;
export function boardAnswer(board) {
  if (!xAlone(board)) return null;
  const other = board[otherSideOf(board)];
  return other.length === 1 && other[0].kind === 'num' ? other[0].v : null;
}

// Help reads the equation on screen, never the original problem (Build A): the number now next to x, and the move that cancels it.
export const xConstantTerm = (board) => board[xSideOf(board)].find((t) => t.kind === 'num') ?? null;
export const cancelAmount = (board) => { const c = xConstantTerm(board); return c ? -c.v : null; };
export const otherNums = (board) => board[otherSideOf(board)].filter((t) => t.kind === 'num');
// x alone with two numbers on the other side (x = −3 + 5): the two numbers, as the row reads them.
export const alonePair = (board) => { const nums = otherNums(board); return nums.length >= 2 ? [nums[0], nums[1]] : null; };
// x alone with a party of two negatives still to put together (x = −2 + −13, Build I, Part 3): the pair, or null.
export const negativeParty = (board) => { const nums = otherNums(board); return xAlone(board) && nums.length === 2 && nums.every((t) => t.v < 0) ? nums : null; };

// The move: the numbers on x's side cancel on their own; the other side just gets the amount added (left as separate terms), unless the
// amount cancels it to 0 (the zero-the-wrong-side slip shows the 0 they were after).
export function lightBoard(board, amount) {
  const xSide = xSideOf(board);
  const other = xSide === 'left' ? 'right' : 'left';
  const sum = sumNums(board[xSide]) + amount;
  const xt = board[xSide].find((t) => t.kind === 'x');
  const otherSum = sumNums(board[other]) + amount;
  // (what is left beside x keeps its place: before x when the number was written first, `4 + 3x`; Build K)
  const first = board[xSide][0].kind === 'num';
  const left = sum !== 0 ? [num(sum)] : [];
  return { ...board, [xSide]: first ? [...left, xt] : [xt, ...left], [other]: otherSum === 0 ? [num(0)] : [...board[other], num(amount)] };
}

// What a move looked like before x's side was simplified: both sides with the added amount (coloured), and the numbers on x's side that
// are about to combine (struck through, then dropped). Shown as a line above the new equation.
export function workLine(board, amount) {
  const xSide = xSideOf(board);
  const otherZero = sumNums(board[xSide === 'left' ? 'right' : 'left']) + amount === 0;       // the other side cancels to 0 too
  const side = (terms, isX) => [...terms.map((t) => (t.kind === 'x' ? { x: true, ...(t.coef !== undefined ? { coef: t.coef } : {}) } : { v: t.v, struck: isX || otherZero })), { v: amount, added: true, struck: isX || otherZero }];
  return { left: side(board.left, xSide === 'left'), right: side(board.right, xSide === 'right'), amount };
}

// The seesaw's two-action move: how far it tips (positive: the left side is heavier).
export const tilt = (s) => s.leftDelta - s.rightDelta;
export const balanced = (s) => tilt(s) === 0;

export { formatAddBoth, tagAddBoth };
