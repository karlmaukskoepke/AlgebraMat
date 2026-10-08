// The Switch sides Mat: the equation as a balance with a border down the middle. The number that is added to or taken
// from x can be dragged (or tapped) across the border; when it crosses, it switches teams (+4 becomes −4). The pairs that
// then meet their opposites cancel, and what is left is x's box and its counters. Pictures are plain data (`switchRows`),
// drawn by solveMat.js.

import { renderSolveMat } from './solveMat.js';
import { moveInfo } from '../engine/switchSides.js';
import { coefOf } from '../engine/solve2.js';

const signOf = (v) => (v < 0 ? '-' : '+');
const box = (extra = {}) => ({ type: 'box', parts: 1, taken: 0, count: 1, neg: false, ...extra });
const counters = (n, extra = {}) => ({ type: 'counters', n, sign: '+', struck: 0, added: false, ...extra });

// Put the x side on the left, or on the right if the equation is turned round.
const place = (p, row) => (p.mirror ? { ...row, left: row.right, right: row.left } : row);

// The x side as the equation is written: boxes and the number (the number first for b + ax). `without` leaves the number out.
function xSide(p, constant) {
  const boxes = box({ count: p.kind === 'solve2' ? p.a : 1 });
  const first = p.kind === 'solve2' && p.form === 'b+ax';
  return constant ? (first ? [constant, boxes] : [boxes, constant]) : [boxes];
}

// How many pairs cancel on the other side: as many as the two groups have, when they are opposite.
export const pairsThatCancel = (info) => (signOf(info.other) !== signOf(-info.B) ? Math.min(Math.abs(info.other), info.n) : 0);

export function switchRows(p, { moved = false, rung = 0, done = false } = {}) {
  const info = moveInfo(p);
  const level = done ? 3 : rung;
  const other = counters(Math.abs(info.other), { sign: signOf(info.other) });
  if (!moved) {
    const constant = counters(info.n, { sign: signOf(info.B), movable: true });
    return [place(p, { label: `Drag the ${info.con} across the border (or tap it)`, left: xSide(p, constant), right: [other], border: true })];
  }
  const pairs = level >= 2 ? pairsThatCancel(info) : 0;
  const crossed = counters(info.n, { sign: signOf(-info.B), moved: true, struck: pairs });
  const rows = [place(p, {
    label: level >= 2 ? 'The pairs cancel' : `It switched teams: ${info.con} became ${info.flipped}`,
    left: xSide(p),
    right: [pairs ? { ...other, struck: pairs } : other, crossed],
    border: true,
  })];
  if (level >= 3) {
    const D = info.other - info.B;                                       // what the boxes come to
    if (info.two) {
      rows.push(place(p, {
        label: `Share the counters equally: ${p.a} boxes, ${p.a} groups`,
        left: [box({ count: p.a })],
        right: [{ type: 'groups', count: p.a, size: Math.abs(p.x), sign: signOf(D) }],
        border: true,
      }));
    }
    rows.push(place(p, { label: 'What’s left', left: [box()], right: [counters(Math.abs(p.x), { sign: signOf(D) })], border: true, solved: true }));
  }
  return rows;
}

export function renderSwitchMat(s) {
  const p = s.problem;
  const done = s.stage === 'done';
  const rows = switchRows(p, { moved: s.moved || done, rung: s.rung, done });
  return renderSolveMat({
    problem: p, rung: s.rung, tried: s.tried, typed: s.entry, done, finalText: s.finalText, rows,
    record: s.moved || done ? moveInfo(p).rec : '', showCheck: s.rung >= 1,
  });
}

export { coefOf };
