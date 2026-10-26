// Variables on both sides' help, as entries of the scaffold registry (../registry.js), keyed by shape (../shape.js). Basic form (Build R):
// the reminder only, the same on I'm stuck and after Undo, recorded as a reminder (`hint`). With x on both sides (V1) it lights the x-term
// with the smaller number in front (so the x-term left keeps a plus; moving the other is fine too), with a ghost of it gliding across the
// =: "Move this x-term to the other side. Drag it across the =, or use Add." With a parenthesis (VP) it is Build M's reminder: the factor
// and the parenthesis lit. Once x is on one side the shapes are Distribute's and Two-step's (E2: "3x and −2x are like terms. Drag one onto
// the other to combine them."; W1, W2, D1 …), with their entries. No Teach me, seesaw, counters or box pictures yet.

import { DISTRIBUTE_RUNGS } from './distribute.js';
import { termText } from '../../lightsGrab.js';
import { MINUS } from '../../expr.js';

const entry = (after) => {
  const e = { ladder: ['hintPopup'], hintPopup: { word: 'hint', after } };
  e.hintPopup.open = (s, api, shape) => { const r = e.hintPopup.after(s, null, shape); return r ? api.say(s, r.key, r.params ?? {}) : api.say(s, 'aFindX'); };
  return e;
};
const coefText = (c) => (c === 1 ? 'x' : c === -1 ? '−x' : `${c < 0 ? '−' : ''}${Math.abs(c)}x`);

// V1: the smaller x-term lit, to be moved across the =
function moveXHint(s, before, shape) {
  const p = shape?.params;
  if (!p?.small) return null;
  s.hint = { kind: 'cross', id: p.small };
  return { target: 'hinted', key: 'vMoveXHint', params: { term: coefText(p.c) } };
}

// VE (Build U): the two like terms not yet put together lit, on the side that has them: "6 and −4 are like terms. Drag one onto the other
// to combine them."
function likeHint(s, before, shape) {
  const p = shape?.params;
  const pair = (p?.ids ?? []).map((id) => [...s.board.left, ...s.board.right].find((t) => t.id === id)).filter(Boolean);
  if (pair.length < 2) return null;
  s.hint = { kind: 'sum', ids: pair.map((t) => t.id) };
  const said = (t) => termText(t, 0).body.replace('-', MINUS);
  return { target: 'hinted', key: 'mCombineHint', params: { g1: said(pair[0]), g2: said(pair[1]) } };
}

// VG, VH, VF (Build U): a parenthesis to distribute, said for its factor (Build M's reminder; the invisible 1 tapped first; a fraction's
// own words)
const DISTRIBUTE = { ladder: ['hintPopup'], hintPopup: DISTRIBUTE_RUNGS.P1.hintPopup };
export const BOTH_RUNGS = {
  V1: entry(moveXHint),
  VP: DISTRIBUTE, VG: DISTRIBUTE, VH: DISTRIBUTE, VF: DISTRIBUTE,
  VE: entry(likeHint),
};
