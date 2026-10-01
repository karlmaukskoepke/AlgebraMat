// The pieces a term draws above itself in Boxes & Circles (SPEC-BOXES.md §2).
// Pure logic, no DOM.
//
// A variable term draws boxes (□ is x, −□ is −x). A number draws + or − counters.
// A piece is { type: 'box' | 'counter', sign: '+' | '-', canceled, opposite }:
// `opposite` marks pieces from a term that was rewritten (`− (−7)` is +7), which
// the notes draw in magenta. Pieces of one term are listed in reading order
// (top-left first); see view/boxLayout.js for where they sit.

import { isX, pieceCount, pieceSign, needsRewrite } from './terms.js';

export const makePiece = (type, sign, opposite = false) => ({ type, sign, canceled: false, opposite });

// All the pieces a term should draw: |worth| of them, of the right type and sign.
export function piecesFor(term) {
  const type = isX(term) ? 'box' : 'counter';
  return Array.from({ length: pieceCount(term) }, () => makePiece(type, pieceSign(term), needsRewrite(term)));
}

// One column of pieces per term.
export const piecesForExpression = (expr) => expr.terms.map(piecesFor);

// Boxes cancel with negative boxes, and counters with counters of the other sign.
export const canCancel = (a, b) => a.type === b.type && a.sign !== b.sign && !a.canceled && !b.canceled;

// What's left after canceling: { x, n } counts, signed (3 boxes and 1 negative box → x: 2).
export function remaining(columns) {
  const total = { x: 0, n: 0 };
  for (const piece of columns.flat()) {
    if (piece.canceled) continue;
    total[piece.type === 'box' ? 'x' : 'n'] += piece.sign === '+' ? 1 : -1;
  }
  return total;
}

// Cancel every pair that can be canceled, taking pieces in reading order, term
// by term. A copy; the input isn't changed. Used by previews and tests: in the
// game the student chooses the pairs.
export function cancelAll(columns) {
  const out = columns.map((col) => col.map((p) => ({ ...p })));
  for (const type of ['box', 'counter']) {
    const at = (sign) => out.flatMap((col, c) => col.map((p, i) => [c, i, p]))
      .filter(([, , p]) => p.type === type && p.sign === sign).map(([c, i]) => [c, i]);
    const plus = at('+');
    const minus = at('-');
    for (let k = 0; k < Math.min(plus.length, minus.length); k++) {
      for (const [c, i] of [plus[k], minus[k]]) out[c][i].canceled = true;
    }
  }
  return out;
}

// Is every possible pair canceled? (Each kind has only one sign left, or nothing.)
export function fullyCanceled(columns) {
  for (const type of ['box', 'counter']) {
    const live = columns.flat().filter((p) => p.type === type && !p.canceled);
    if (live.some((p) => p.sign === '+') && live.some((p) => p.sign === '-')) return false;
  }
  return true;
}
