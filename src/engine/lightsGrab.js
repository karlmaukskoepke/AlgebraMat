// "Grab the terms" (SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md, Part B), behind ?ui=lights: what a term dragged on the newest row does.
// Pure: no DOM. The terms are the card's own board terms (addBothMoves.js), each grabbed with its sign. Where a drop lands is a
// slot: a gap between the terms of a side ({ side, at }), or onto a like term ({ side, onto }). Dropping on the other side is a
// cross, which the wrapper sends to the engine's own `go` (the drag supplies the amount, so it is not a new move).

import { signed } from './addBoth.js';
import { MINUS } from './expr.js';

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
export const likeKey = (t) => (t.kind === 'num' ? 'num' : t.kind === 'x' ? 'x' : null);
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

// What dropping `id` on `slot` does: cross (constants only), snap back an x that crossed, combine onto a like term, reorder, or nothing.
export function outcomeOf(board, id, slot) {
  const f = findTerm(board, id);
  if (!f || !slot) return { kind: 'none' };
  if (slot.side !== f.side) {
    if (f.term.kind !== 'num') return { kind: 'snapX' };
    return { kind: 'cross', amount: -f.term.v };
  }
  if (slot.onto) {
    const target = findTerm(board, slot.onto)?.term;
    return isLike(f.term, target) ? { kind: 'combine', a: f.term.id, b: target.id, side: f.side } : { kind: 'none' };
  }
  if (!Number.isInteger(slot.at) || slot.at === f.at) return { kind: 'none' };
  return { kind: 'reorder', side: f.side, from: f.at, to: slot.at };
}

// The board with a term moved within its side (`to` counts the side's terms without it).
export function reorderBoard(board, id, to) {
  const f = findTerm(board, id);
  const rest = board[f.side].filter((t) => t.id !== id);
  rest.splice(Math.max(0, Math.min(to, rest.length)), 0, f.term);
  return { ...board, [f.side]: rest };
}

let counter = 0;
// The board with two like terms replaced by their sum, in the place of the first of them (a sum of 0 leaves nothing; a side is never
// empty, so an empty side says 0).
export function combineBoard(board, a, b, total) {
  const fa = findTerm(board, a);
  const fb = findTerm(board, b);
  const first = Math.min(fa.at, fb.at);
  const terms = [];
  board[fa.side].forEach((t, i) => {
    if (i === first && total !== 0) terms.push({ id: `g${++counter}`, kind: 'num', v: total });
    if (t.id !== a && t.id !== b) terms.push(t);
  });
  return { ...board, [fa.side]: terms.length ? terms : [{ id: `g${++counter}`, kind: 'num', v: 0 }] };
}

// How a term is written in a row (B4): a negative number after the first term is written as subtraction, "− 2", unless its minus
// was tapped to show it as a negative number, "+ −2". `op` is the sign before the term (null for the first), `body` the term.
export function termText(t, i, negShown = false) {
  const body = t.kind === 'x' ? `${t.coef > 1 ? t.coef : ''}x` : signed(t.v);
  if (i === 0) return { op: null, body, neg: t.kind === 'num' && t.v < 0 };
  if (t.kind === 'num' && t.v < 0 && !negShown) return { op: MINUS, body: String(-t.v), subtracted: true };
  return { op: '+', body, neg: t.kind === 'num' && t.v < 0 };
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
