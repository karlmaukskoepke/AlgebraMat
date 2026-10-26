// Distribute, combine, solve's help, as entries of the scaffold registry (../registry.js), keyed by shape (../shape.js). Basic form (Build
// M): the reminder only, the same on I'm stuck and after Undo, recorded as a reminder (`hint`). It lights what to do next with the real
// numbers: for a parenthesis, the factor and the parenthesis ("Drag the 3 onto the parenthesis to multiply it by each piece.", with the
// ghost hand); for terms not yet put together, the two like terms ("Drag one onto the other to combine them."). No Teach me, seesaw,
// counters or area pictures yet. A shape another card already has keeps that card's entry (W1, W2, D1, F1, F2, F4, F5).

import { signed, factorText } from '../../solveTerms.js';
import { MINUS } from '../../expr.js';
import { termText } from '../../lightsGrab.js';
import { ADD_RUNGS } from './add.js';
import { TWO_STEP_RUNGS } from './twoStep.js';
import { productOf, calcParams } from '../../nudge.js';

const opened = (s, api, r) => (r ? api.say(s, r.key, r.params ?? {}) : api.say(s, 'aFindX'));
const entry = (after) => {
  const e = { ladder: ['hintPopup'], hintPopup: { word: 'hint', after } };
  e.hintPopup.open = (s, api, shape) => opened(s, api, e.hintPopup.after(s, null, shape));
  return e;
};
const groupOf = (s) => [...s.board.left, ...s.board.right].find((t) => t.kind === 'group');

// P1-P5: the factor and the parenthesis lit. A subtracted factor needs its minus tapped first (Level 4).
function distributeHint(s) {
  const g = groupOf(s);
  if (!g) return null;
  s.hint = { kind: 'factor', id: g.id };
  const side = s.board.left.includes(g) ? s.board.left : s.board.right;
  const shown = (s.lx?.negIds ?? []).includes(g.id);
  // the invisible 1 (Build U): its minus tapped first; a fraction factor: each piece is that fraction of its term
  if (g.hidden && !shown) return { target: 'factor', key: 'mTapOneHint' };
  if (g.den > 1) return { target: 'factor', key: 'mFracHint', params: { factor: factorText(g.factor, g.den) } };
  const subtracted = g.factor < 0 && side.indexOf(g) > 0 && !shown;
  if (subtracted) return { target: 'factor', key: 'mTapMinusHint', params: { factor: signed(g.factor), size: String(-g.factor) } };
  return { target: 'factor', key: 'mDistributeHint', params: { factor: signed(g.factor) } };
}
const P = entry(distributeHint);

// E1 and E2: the first two like terms lit (numbers beside x, or x-terms).
function likeHint(kind) {
  return (s) => {
    const side = s.board.left.some((t) => t.kind === 'x') ? s.board.left : s.board.right;
    const pair = side.filter((t) => t.kind === kind).slice(0, 2);
    if (pair.length < 2) return null;
    s.hint = { kind: 'sum', ids: pair.map((t) => t.id) };
    const said = (t) => termText(t, 0).body.replace('-', MINUS);
    return { target: 'hinted', key: 'mCombineHint', params: { g1: said(pair[0]), g2: said(pair[1]) } };
  };
}

// P6 and E4: the other side still two numbers (an Add cancelled the number beside x): Two-step's W2 reminder, "Put them together".
const OTHER = { ladder: ['hintPopup'], hintPopup: TWO_STEP_RUNGS.W2.hintPopup };

// Q1 `x + 2 = ⅓(15)`: the product lit, to be worked out (Build P, Part 2: "⅓ · 15 is ⅓ of 15. Click the dot and type it.");
// after an Add that did not cancel was undone, Add to both sides' reminder for the number beside x, as before.
function calcHint(s) {
  const f = productOf(s.board);
  if (!f) return null;
  const t = [...s.board.left, ...s.board.right].find((u) => u.id === f.id);
  s.hint = { kind: 'calc', id: t.id };
  return { target: 'calc', key: 'mCalcHint', params: calcParams(s, t) };
}
const Q1 = entry((s, before) => (before?.needUndo && before?.feedback?.key !== 'lxCalcWrong' ? ADD_RUNGS.S1.hintPopup.after(s, before) : calcHint(s)));
// Q4 `x + 2 = 5` (the product worked out): Add to both sides' reminder for the number beside x.
const Q4 = entry((s, before) => ADD_RUNGS.S1.hintPopup.after(s, before));

export const DISTRIBUTE_RUNGS = {
  P1: P, P2: P, P3: P, P4: P, P5: P, P6: OTHER,
  E1: entry(likeHint('num')), E2: entry(likeHint('x')), E4: OTHER,
  Q1,
  Q2: { none: 'mWorkOut' },                       // x is alone: the other side is the student's to work out, then type x
  Q3: { waiting: true },
  Q4,
  Q5: { none: 'mWorkOut' },                       // x is alone: the student works out the other side and types x
};
