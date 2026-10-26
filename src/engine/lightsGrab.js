// "Grab the terms" (SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md, Part B), behind ?ui=lights: what a term dragged on the newest row does.
// Pure: no DOM. The terms are the card's own board terms (addBothMoves.js), each grabbed with its sign. Where a drop lands is a
// slot: a gap between the terms of a side ({ side, at }), or onto a like term ({ side, onto }). Dropping on the other side is a
// cross, which the wrapper sends to the engine's own `go` (the drag supplies the amount, so it is not a new move).

import { signed } from './addBoth.js';
import { MINUS } from './expr.js';
import { fractionText, factorText } from './solveTerms.js';

// Combining like terms automatically (no blank to type) starts at this level. Never, in this round (B3).
export const AUTO_COMBINE_FROM_LEVEL = Infinity;

const SIDES = ['left', 'right'];
export const otherSide = (side) => (side === 'left' ? 'right' : 'left');
export const findTerm = (board, id) => {
  for (const side of SIDES) {
    const at = board[side].findIndex((t) => t.id === id);
    if (at >= 0) return { side, at, term: board[side][at] };
  }
  return null;
};

// Like terms: two numbers, or two x terms with the same variable part.
export const likeKey = (t) => (t.kind === 'num' ? 'num' : t.kind === 'x' ? 'x' : null);    // (a parenthesis is like nothing)
export const isLike = (a, b) => Boolean(a && b && a.id !== b.id && likeKey(a) && likeKey(a) === likeKey(b));

// Every slot a held term can go to, in reading order (left side, then right): for each side, a gap before each term and after the
// last, with "onto" a like term between them. The held term is left out of its own side, so its own place is one gap.
export function slotsFor(board, id) {
  const held = findTerm(board, id)?.term;
  if (!held) return [];
  const out = [];
  for (const side of SIDES) {
    const terms = board[side].filter((t) => t.id !== id);
    terms.forEach((t, i) => {
      out.push({ side, at: i });
      if (side === findTerm(board, id).side && isLike(held, t)) out.push({ side, onto: t.id });
    });
    out.push({ side, at: terms.length });
  }
  return out;
}
export const homeSlot = (board, id) => { const f = findTerm(board, id); return f ? { side: f.side, at: f.at } : null; };
export const sameSlot = (a, b) => Boolean(a && b) && a.side === b.side && a.at === b.at && a.onto === b.onto;

// What dropping `id` on `slot` does: cross (a number), snap back an x that would leave the only side with x, carry an x across when
// the other side has x too (crossX: no card uses it yet, Build D), combine onto a like term, reorder, or nothing.
export function outcomeOf(board, id, slot) {
  const f = findTerm(board, id);
  if (!f || !slot) return { kind: 'none' };
  if (slot.side !== f.side) {
    // (an x-term lands right after the first x-term there, beside its like term, as Add's x-term option writes it: Build T)
    if (f.term.kind === 'x') return board[slot.side].some((t) => t.kind === 'x') ? { kind: 'crossX', side: slot.side, at: board[slot.side].findIndex((t) => t.kind === 'x') + 1 } : { kind: 'snapX' };
    if (f.term.kind !== 'num') return { kind: 'snapX' };
    return { kind: 'cross', amount: -f.term.v, at: slot.at ?? board[slot.side].length };
  }
  if (slot.onto) {
    const target = findTerm(board, slot.onto)?.term;
    return isLike(f.term, target) ? { kind: 'combine', a: f.term.id, b: target.id, side: f.side } : { kind: 'none' };
  }
  if (!Number.isInteger(slot.at) || slot.at === f.at) return { kind: 'none' };
  return { kind: 'reorder', side: f.side, from: f.at, to: slot.at };
}

// A term carried across the line: gone from its side (a side left empty says 0), its opposite in the slot on the other side. The new
// term is marked `fresh` (a preview draws it in red).
export function crossBoard(board, id, at) {
  const f = findTerm(board, id);
  const to = otherSide(f.side);
  const moved = f.term.kind === 'x' ? { id: newId(), kind: 'x', coef: -(f.term.coef ?? 1), fresh: true } : { id: newId(), kind: 'num', v: -f.term.v, fresh: true };
  const from = board[f.side].filter((t) => t.id !== id);
  const dest = [...board[to]];
  dest.splice(Math.max(0, Math.min(at, dest.length)), 0, moved);
  return { ...board, [f.side]: from.length ? from : [{ id: newId(), kind: 'num', v: 0 }], [to]: dest };
}

// What the equation would look like if the held term were dropped on `slot` (Build D, Part 3): drawn in grey in place while dragging.
// null when nothing would change shape (back where it was, onto a like term, an x that cannot cross).
export function previewBoard(board, id, slot) {
  const out = outcomeOf(board, id, slot);
  if (out.kind === 'reorder') return reorderBoard(board, id, out.to);
  if (out.kind === 'cross' || out.kind === 'crossX') return crossBoard(board, id, out.at);
  return null;
}

// The board with a term moved within its side (`to` counts the side's terms without it).
export function reorderBoard(board, id, to) {
  const f = findTerm(board, id);
  const rest = board[f.side].filter((t) => t.id !== id);
  rest.splice(Math.max(0, Math.min(to, rest.length)), 0, f.term);
  return { ...board, [f.side]: rest };
}

let counter = 0;
export const newId = () => `g${++counter}`;
// The board with two like terms replaced by their sum (a number, or the x coefficient), in the place of the first of them (a sum of 0
// leaves nothing; a side is never empty, so an empty side says 0).
export function combineBoard(board, a, b, total) {
  const fa = findTerm(board, a);
  const fb = findTerm(board, b);
  const first = Math.min(fa.at, fb.at);
  const terms = [];
  board[fa.side].forEach((t, i) => {
    if (i === first && total !== 0) terms.push(fa.term.kind === 'x' ? { id: newId(), kind: 'x', coef: total } : { id: newId(), kind: 'num', v: total });
    if (t.id !== a && t.id !== b) terms.push(t);
  });
  return { ...board, [fa.side]: terms.length ? terms : [{ id: newId(), kind: 'num', v: 0 }] };
}

// How a term is written in a row (B4): a negative term after the first is written as subtraction, "− 2", "− 2x", "− 2(x + 2)", unless
// its minus was tapped to show it as a negative, "+ −2". `op` is the sign before the term (null for the first), `body` the term.
export const valueOf = (t) => (t.kind === 'num' ? t.v : t.kind === 'x' ? (t.coef ?? 1) : t.kind === 'group' ? t.factor : 1);
const coefText = (c) => (c === 1 ? '' : c === -1 ? MINUS : signed(c));
function bodyOf(t, v, one = false) {
  if (t.kind === 'num') return signed(v);
  if (t.kind === 'x') return `${coefText(v)}x`;
  if (t.kind === 'frac') return `${t.sign < 0 ? MINUS : ''}${fractionText(t.n)}(${sideText(t.inner)})`;     // `⅓(15)` (Build M: divided first)
  if (t.kind === 'neg') return `${MINUS}(${sideText(t.inner)})`;
  // a fraction factor (Build U): `⅔(6x + 9)`; the invisible 1 once its minus is tapped: `−1(x − 6)`
  if (t.den > 1) return `${factorText(v, t.den)}(${sideText(t.inner)})`;
  return `${t.hidden && one ? signed(v) : coefText(v)}(${sideText(t.inner)})`;
}
export function termText(t, i, negShown = false) {
  const v = valueOf(t);
  const neg = v < 0;
  const one = t.kind === 'group' && t.hidden && negShown;            // (the invisible 1, shown)
  if (i === 0) return { op: null, body: bodyOf(t, v, one), neg };
  if (neg && !negShown) return { op: MINUS, body: bodyOf(t, -v), subtracted: true };
  return { op: '+', body: bodyOf(t, v, one), neg };
}
// A side as it reads, "11 − 8".
export const sideText = (terms, negIds = []) => terms.map((t, i) => {
  const { op, body } = termText(t, i, negIds.includes(t.id));
  return op ? `${op} ${body}` : body;
}).join(' ');
// The two terms of a sum, as they read where they sit: "11 − 8".
export function pairText(board, a, b) {
  const side = findTerm(board, a).side;
  return sideText(board[side].filter((t) => t.id === a || t.id === b));
}
// The term a crossing shows over the line: the opposite sign, "+ 2" for "− 2".
export const crossedText = (v) => (-v < 0 ? `${MINUS} ${v}` : `+ ${-v}`);
