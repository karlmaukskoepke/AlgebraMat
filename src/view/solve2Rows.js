// The pictures for Two-step equations, as data (drawn by solveMat.js): the equation as a balance of boxes and counters,
// then the undo done to both sides, constant first (Karl: "undo the constants first"), by adding the opposite, then the sharing out among the
// boxes, then what is left. A negative coefficient (5 − 2x = −3) has boxes of the opposite of x, and ends with a flip.
//
// Items: { type: 'box', parts, taken, count, neg }   `neg`: boxes holding the opposite of x (labelled −x)
//        { type: 'counters', n, sign, struck, added }
//        { type: 'groups', count, size, sign }

import { coefOf, constOf } from '../engine/solve2.js';
import { undoConstant } from './undoConstant.js';

const box = (extra = {}) => ({ type: 'box', parts: 1, taken: 0, count: 1, neg: false, ...extra });
const counters = (n, extra = {}) => ({ type: 'counters', n, sign: '+', struck: 0, added: false, ...extra });
const signOf = (v) => (v < 0 ? '-' : '+');

// Put the x side on the left, or on the right if the equation is turned round.
const place = (p, row) => (p.mirror ? { ...row, left: row.right, right: row.left } : row);

// The x side's items in the order the equation is written (the number first for b + ax and b − ax).
const xSide = (p, boxes, rest) => (p.form === 'b+ax' || p.form === 'b-ax' ? [...rest, boxes] : [boxes, ...rest]);

export function twoStepRows(p, rung) {
  if (rung < 2) return [];
  const A = coefOf(p);
  const B = constOf(p);
  const C = p.c;
  const D = C - B;                                   // what the boxes come to
  const boxes = box({ count: p.a, neg: A < 0 });
  const constant = counters(Math.abs(B), { sign: signOf(B) });
  const right = counters(Math.abs(C), { sign: signOf(C) });
  if (rung === 2) return [place(p, { label: 'The balance', left: xSide(p, boxes, [constant]), right: [right] })];

  // 1. undo the number on both sides: add its opposite to both, and the pairs cancel (never "take away")
  const undo = undoConstant(B, C, (rest) => xSide(p, boxes, rest));
  // 2. share what is left equally among the boxes; 3. what is left
  const share = {
    label: `Share the counters equally: ${p.a} boxes, ${p.a} groups`,
    left: [boxes],
    right: [{ type: 'groups', count: p.a, size: Math.abs(p.x), sign: signOf(D) }],
  };
  const left = { label: A < 0 ? 'What’s left: the opposite of x' : 'What’s left', left: [box({ neg: A < 0 })], right: [counters(Math.abs(p.x), { sign: signOf(D) })], solved: A > 0 };
  const rows = [place(p, undo), place(p, share), place(p, left)];
  // 4. a negative coefficient: flip both sides to the opposite
  if (A < 0) rows.push(place(p, { label: 'Flip both sides to the opposite', left: [box()], right: [counters(Math.abs(p.x), { sign: signOf(p.x) })], solved: true }));
  return rows;
}
