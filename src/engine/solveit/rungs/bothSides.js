// Variables on both sides' help, as entries of the scaffold registry (../registry.js), keyed by shape (../shape.js). Basic form (Build R):
// the reminder only, the same on I'm stuck and after Undo, recorded as a reminder (`hint`). With x on both sides (V1) it lights the x-term
// with the smaller number in front (so the x-term left keeps a plus; moving the other is fine too), with a ghost of it gliding across the
// =: "Move this x-term to the other side. Drag it across the =, or use Add." With a parenthesis (VP) it is Build M's reminder: the factor
// and the parenthesis lit. Once x is on one side the shapes are Distribute's and Two-step's (E2: "3x and −2x are like terms. Drag one onto
// the other to combine them."; W1, W2, D1 …), with their entries. No Teach me, seesaw, counters or box pictures yet.

import { DISTRIBUTE_RUNGS } from './distribute.js';

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

export const BOTH_RUNGS = {
  V1: entry(moveXHint),
  VP: { ladder: ['hintPopup'], hintPopup: DISTRIBUTE_RUNGS.P1.hintPopup },
};
