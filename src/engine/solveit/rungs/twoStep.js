// Two-step equations' help, as entries of the scaffold registry (../registry.js), keyed by shape (../shape.js). Basic form (Build K): the
// reminder only, the same on I'm stuck and after Undo. It lights the move the student needs (with its preview on the equation) and says
// it with the real numbers; recorded as a reminder (`hint`). No seesaw, counters or Teach me yet. A shape another card already has keeps
// that card's entry (`3x = 15` is Divide it's D1; `−3x = 15`, `−x = 5`, `x = −(5)` and `x = ⅓(15)` are Flip everything's): only the
// shapes with a number still beside x, or the other side still to combine, are new here.

import { signed } from '../../solveTerms.js';
import { otherNums } from '../../addBothMoves.js';
import { ADD_RUNGS } from './add.js';

// I'm stuck opens the same reminder the hint after Undo shows.
const opened = (s, api, r) => (r ? api.say(s, r.key, r.params ?? {}) : api.say(s, 'aFindX'));

// W1 `ax + c = b`: Add to both sides' reminder (the number beside x outlined, the Add blank open, "What would we add to both sides to
// eliminate it?"), with these numbers.
const W1 = { ladder: ['hintPopup'], hintPopup: { word: 'hint', after: (s, before) => ADD_RUNGS.S1.hintPopup.after(s, before) } };
W1.hintPopup.open = (s, api, shape) => opened(s, api, W1.hintPopup.after(s, null, shape));

// W2 `ax = b + k`: the two numbers on the other side lit, "Put them together".
const W2 = {
  ladder: ['hintPopup'],
  hintPopup: {
    word: 'hint',
    after(s) {
      const [b, k] = otherNums(s.board);
      if (!b || !k) return null;
      s.hint = { kind: 'sum', ids: [b.id, k.id] };
      return { target: 'otherSide', key: 'wCombineHint', params: { g1: signed(b.v), g2: signed(k.v) } };
    },
  },
};

W2.hintPopup.open = (s, api, shape) => opened(s, api, W2.hintPopup.after(s, null, shape));

// W3 and W4: an Add that did not cancel the number beside x, or zeroed the other side, waits for Undo (the loop's "Undo first").
const WAITING = { waiting: true };

export const TWO_STEP_RUNGS = { W1, W2, W3: WAITING, W4: WAITING };
