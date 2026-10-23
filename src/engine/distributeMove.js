// The distribute move, the shared part (Build M; lifted out of the hidden Distribute drill, which it replaces): a factor times a
// parenthesis (`3(x + 2)`, a `group` term) is multiplied into each piece. The student drags the factor onto the parenthesis and types one
// product per piece (the x blank has its x printed after it, so the coefficient is typed with its sign); the app checks the products and,
// when they are right, writes the new row from them, bringing every other term down. Nothing is worked out for the student. The move
// itself (its blanks, Undo, judging) is Add's term layer's (engine/addBothLights.js), turned on by a card with `distribute: true`.
// Also here: the Add move's board for a card whose x side can hold several numbers or a parenthesis (`addBoardKeep`). Pure: no DOM.

import { signed } from './solveTerms.js';
import { newId } from './lightsGrab.js';
import { hasX, sumNums, num } from './addBothMoves.js';

// The labels over the blanks: "3 · x", "3 · 2", "−2 · x", "−2 · −2" (a negative piece keeps its sign).
export const productLabels = (g) => g.inner.map((t) => `${signed(g.factor)} · ${t.kind === 'x' ? 'x' : signed(t.v)}`);
// What each blank should hold: the number in front of x, or the number.
export const rightProducts = (g) => g.inner.map((t) => g.factor * (t.kind === 'x' ? (t.coef ?? 1) : t.v));
// A typed piece: a whole number with its sign (`3`, `−4`); in the x blank the x is printed, so it is the number in front of x. NaN if not.
export const pieceOf = (entry) => (/^-?\d+$/.test(entry ?? '') ? Number(entry) : NaN);
export const pieceTyped = (entry) => /\d/.test(entry ?? '');

// What a wrong piece looks like (the slips declared for the card): the piece not multiplied (`2` for 3 · 2), or the right size with the
// sign lost (`4` for −2 · 2). Recorded as the answer's tag.
export function productSlip(g, k, typed) {
  const t = g.inner[k];
  const v = t.kind === 'x' ? (t.coef ?? 1) : t.v;
  const right = g.factor * v;
  if (typed === v && right !== v) return 'dist-unmultiplied';
  if (typed === -right) return 'dist-sign-lost';
  return 'dist-product';
}

// The board after distributing: the products in the place of the parenthesis, every other term brought down as it was.
export function distributeBoard(board, groupId) {
  const side = board.left.some((t) => t.id === groupId) ? 'left' : 'right';
  const at = board[side].findIndex((t) => t.id === groupId);
  const g = board[side][at];
  const made = g.inner.map((t) => (t.kind === 'x' ? { id: newId(), kind: 'x', coef: g.factor * (t.coef ?? 1) } : { id: newId(), kind: 'num', v: g.factor * t.v }));
  const terms = [...board[side]];
  terms.splice(at, 1, ...made);
  return { board: { ...board, [side]: terms }, made };
}

// The Add move's board where x's side may hold a parenthesis or several numbers (Build M): an amount that cancels one of several numbers
// takes that one away (or all of them, if it cancels their sum) and leaves the rest as they are; any other amount is written beside them
// (nothing is put together for the student). With one number or none, it is the Add card's board: the number and the amount make one.
// The other side just gets the amount (or says 0, when it cancels).
export function addBoardKeep(board, amount) {
  const xSide = board.left.some(hasX) ? 'left' : 'right';
  const other = xSide === 'left' ? 'right' : 'left';
  const mine = board[xSide];
  const ns = mine.filter((t) => t.kind === 'num');
  let next;
  if (ns.length <= 1) {
    const sum = sumNums(mine) + amount;
    if (ns.length === 1) next = sum === 0 ? mine.filter((t) => t !== ns[0]) : mine.map((t) => (t === ns[0] ? num(sum) : t));
    else next = sum === 0 ? mine : [...mine, num(sum)];
  } else {
    const one = ns.find((t) => t.v === -amount);
    if (one) next = mine.filter((t) => t !== one);
    else if (sumNums(mine) + amount === 0) next = mine.filter((t) => t.kind !== 'num');
    else next = [...mine, num(amount)];
  }
  const otherSum = sumNums(board[other]) + amount;
  const onlyNums = board[other].every((t) => t.kind === 'num');
  return { ...board, [xSide]: next, [other]: onlyNums && otherSum === 0 ? [num(0)] : [...board[other], num(amount)] };
}

// The line the move leaves above it: the amount on both sides; struck only where numbers really cancel (the one it cancels, or all).
export function addWorkKeep(board, amount) {
  const xSide = board.left.some(hasX) ? 'left' : 'right';
  const ns = board[xSide].filter((t) => t.kind === 'num');
  const one = ns.length > 1 ? ns.find((t) => t.v === -amount) : null;
  const all = !one && sumNums(board[xSide]) + amount === 0;
  const otherZero = board[xSide === 'left' ? 'right' : 'left'].every((t) => t.kind === 'num') && sumNums(board[xSide === 'left' ? 'right' : 'left']) + amount === 0;
  const side = (terms, isX) => [
    ...terms.map((t) => (t.kind === 'x' ? { x: true, ...(t.coef !== undefined ? { coef: t.coef } : {}) }
      : t.kind === 'num' ? { v: t.v, struck: (isX && (one ? t === one : all || ns.length === 1)) || (!isX && otherZero) } : { term: t })),
    { v: amount, added: true, struck: (isX && (Boolean(one) || all || ns.length === 1)) || (!isX && otherZero) },
  ];
  return { left: side(board.left, xSide === 'left'), right: side(board.right, xSide === 'right'), amount };
}
