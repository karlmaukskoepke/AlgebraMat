// The seesaw mirrors the check (Build H, Part 2). When the seesaw was opened by I'm stuck or Teach me and the student checks a value, the
// balance that solved for x is redrawn as the ORIGINAL equation, and each line of the check is drawn on it: the x box becomes that many
// counters in a box with a small x above it (so the student sees these are the x box), the numbers beside it are counters, and each press of
// Next combines what the line just written combined. The last line's beam is level when the value is right, and tips the way it really
// tips when it is not. Values over 12 are one box labelled with the number, not counters. Pure logic, no DOM; the drawing is
// view/addBothMat.js (boardItems, boardSvg). Only the seesaw's check: a check beside the equation is the check space alone.

import { substitutionLines } from './solveTerms.js';

export const COUNTER_LIMIT = 12;                                    // up to this many counters in a group; past it, one box with the number

// One thing on the balance: `x` an empty x box (the value is not in yet), `group` a number (counters, or a labelled box past the limit),
// and `xgroup` the same with the little x above: it is where x was.
const item = (type, id, v) => ({ type, id, v });
const fromTerm = (t, id) => (t.kind === 'x' ? item('x', id, 0) : item('group', id, t.v));
const fromItem = (it, id) => {
  if (it.k === 'sub') return item('xgroup', id, it.v);
  if (it.k === 'prod') return item('xgroup', id, it.a * it.v);
  if (it.k === 'neg') return item('xgroup', id, -it.v);
  return item('group', id, it.v);
};

// The mirror of the check on screen, or null when this check is not the seesaw's. { index, final, left, right, tilt, ok, board }:
//   index  which line is drawn (-1: the value has not been dropped in yet), final: the mark is up
//   tilt   how much heavier the left side is (0 while the value is not in, and for a right value); board: the equation being checked
export function checkMirror(s) {
  if (!s.scaffold || !s.sub || !s.rows?.[0]) return null;
  const target = s.sub.target === 'current' ? s.board : s.rows[0].board;
  if (s.sub.placing) {
    const ids = (side, terms) => terms.map((t, i) => fromTerm(t, `m${side}${i}`));
    return { index: -1, final: false, left: ids('l', target.left), right: ids('r', target.right), tilt: 0, ok: null, board: target };
  }
  const { states, lines } = substitutionLines(target, s.sub.typed);
  const total = s.sub.collapsed ? 2 : lines.length + 1;
  const final = s.sub.step >= total;
  const index = final ? states.length - 1 : s.sub.collapsed ? 0 : Math.max(0, Math.min(s.sub.step, states.length) - 1);
  const at = states[index];
  const draw = (side, items) => items.map((it, i) => fromItem(it, `m${side}${index}_${i}`));
  const left = draw('l', at.left);
  const right = draw('r', at.right);
  const sum = (list) => list.reduce((a, b) => a + b.v, 0);
  return { index, final, left, right, tilt: sum(left) - sum(right), ok: s.sub.ok, board: target };
}

// The mirror's words for the readout above the beam: nothing until the last line, then what the beam shows.
export function mirrorReadout(m) {
  if (!m.final) return '';
  if (m.tilt === 0) return 'Balanced ✓';
  return 'Not balanced ✗';                                          // (the beam shows which side is heavier; the words match the check's)
}
