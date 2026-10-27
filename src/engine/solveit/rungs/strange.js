// Strange solutions' help (Build V), as entries of the scaffold registry (../registry.js), keyed by shape (../shape.js). Basic form: the
// reminder only, the same on I'm stuck and after Undo, recorded as a reminder (`hint`). Every other shape on this card is Variables on both
// sides' (V1, VE) or the ones it borrows (W1, W2, D1, F2, F5 …), with their entries.
//   SD  `6x = 15`: Divide it's reminder (the Divide button lit with its preview), said for a fraction: the answer can be a fraction
//   SR  `x = 15/6`: "Simplify 15/6: divide the top and bottom by the same number, then type x."
//   SQ  `x = 5/2`: "x is 5/2. Type it in x =: the top, then /, then the bottom."
//   SF  `−x = 15/6`: Flip lit, "x has a minus: flip both sides (· −1)."
//   SM  `x = −(15/6)`: "x is the opposite of 15/6. Simplify it, then type x with its sign."
//   NT, NF  no x left: "x disappeared. Is this statement ever true?" (V2 adds its two buttons)

import { DIVIDE_RUNGS } from './divide.js';
import { MINUS } from '../../expr.js';

const fr = (p) => `${p.n < 0 ? MINUS : ''}${Math.abs(p.n)}/${p.d}`;
const entry = (after) => {
  const e = { ladder: ['hintPopup'], hintPopup: { word: 'hint', after } };
  e.hintPopup.open = (s, api, shape) => { const r = e.hintPopup.after(s, null, shape); if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint'); return r ? api.say(s, r.key, r.params ?? {}) : api.say(s, 'aFindX'); };
  return e;
};

function divideHint(s, before, shape) {
  const r = DIVIDE_RUNGS.D1.hintPopup.after(s, before);
  return r && r.key === 'dReminder' ? { ...r, key: 'sDivideHint', params: { a: Math.abs(shape?.params?.a ?? r.params.boxes), neg: (shape?.params?.a ?? 1) < 0 } } : r;
}

export const STRANGE_RUNGS = {
  SD: entry(divideHint),
  SR: entry((s, before, shape) => ({ target: 'answer', key: 'sSimplifyHint', params: { f: fr(shape.params) } })),
  SQ: entry((s, before, shape) => ({ target: 'answer', key: 'sTypeHint', params: { f: fr(shape.params) } })),
  SF: entry(() => ({ target: 'coef', key: 'sFlipHint', move: 'flip' })),
  SM: entry((s, before, shape) => ({ target: 'answer', key: 'sNegHint', params: { f: fr(shape.params) } })),
  NT: entry(() => ({ target: 'answer', key: 'sNoXHint' })),
  NF: entry(() => ({ target: 'answer', key: 'sNoXHint' })),
};
