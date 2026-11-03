// Fractions of x's help (Build AA), as entries of the scaffold registry (../registry.js), keyed by shape (../shape.js). On a fraction of x,
// on the model-first levels (1 and 3), the first rung of I'm stuck is the model (the box cut into equal parts, engine/fractionsModel.js);
// the second is the reminder (the move to make, said in the form on the screen, its move lit with its preview), which then repeats. On
// Levels 2, 4, 5 and 6 the move comes first (Build AC, Karl 2026-11-03): the reminder, then the model drawn on the current equation, then
// the reminder again. A minus in front of the fraction asks for −1 first, and the model waits for the flip. After a move and Undo the hint
// is the reminder; after a wrong value and Undo it is the model on Levels 1 and 3, the reminder on the others (the card's spotlight,
// engine/cards/fractions.js). Fraction words for `⅔x` ("⅔ of x"), divide-by words for `2x/3` and `x/3` (Build T's rule).

import { signed, fractionText } from '../../solveTerms.js';
import { ratioText } from '../../solveTerms.js';
import { newModel, modelFirst, problemOfShape } from '../../fractionsModel.js';

const record = (s, word) => { if (!s.supportsShown.includes(word)) s.supportsShown.push(word); };
// `⅔x` or `2x/3` as the screen writes it
const fx = (top, q, form) => {
  const m = top < 0 ? '−' : '';
  const a = Math.abs(top);
  return form === 'over' ? `${m}${a === 1 ? '' : a}x/${q}` : `${m}${ratioText(a, q)}x`;
};
// Multiply's whole number lit, its preview on the equation, the amount ready to type
const litMultiply = (s) => { s.mopts = { kind: null, entry: '', lit: 'whole' }; s.ui = { ...(s.ui ?? {}), preview: 'whole' }; };
const litDivide = (s) => { s.mopts = { kind: null, entry: '', lit: 'div' }; s.ui = { ...(s.ui ?? {}), preview: 'div' }; };
const litFlip = (s) => { s.ui = { ...(s.ui ?? {}), preview: 'flip' }; };

const REMINDERS = {
  // ⅓x = 4 (fraction words) / x/3 = 4 (divide-by words): multiply both sides by 3
  FU(s, { params: p }) {
    litMultiply(s);
    return { target: 'coef', key: 'xUnitHint', params: { q: p.q, b: signed(p.b), frac: fractionText(p.q), form: 'times' }, move: 'mult' };
  },
  FUD(s, { params: p }) {
    litMultiply(s);
    return { target: 'coef', key: 'xUnitHint', params: { q: p.q, b: signed(p.b), frac: fractionText(p.q), form: 'over' }, move: 'mult' };
  },
  // ⅔x = 6: divide both sides by 2 (one part is ⅓x = 3), the bridge to the model; 2x/3 = 6: multiply both sides by 3 to cancel the divide
  FP(s, { params: p }) {
    if (p.b % p.p === 0 && p.p > 1 && p.p <= 6) {
      litDivide(s);
      return { target: 'coef', key: 'xNonUnitHint', params: { p: p.p, q: p.q, b: signed(p.b), part: signed(p.b / p.p), frac: ratioText(p.p, p.q), unit: fractionText(p.q) }, move: 'divOption' };
    }
    litMultiply(s);
    return { target: 'coef', key: 'xOverHint', params: { p: p.p, q: p.q, b: signed(p.b), was: fx(p.top, p.q, 'times'), form: 'times' }, move: 'mult' };
  },
  FPD(s, { params: p }) {
    litMultiply(s);
    return { target: 'coef', key: 'xOverHint', params: { p: p.p, q: p.q, b: signed(p.b), was: fx(p.top, p.q, 'over'), form: 'over' }, move: 'mult' };
  },
  // −⅔x = 6: multiply both sides by −1 first (Karl, 2026-11-03: then the box can be drawn), where Flip everything is live; else the multiply
  FN(s, { params: p }) {
    if (s.level >= 4) {
      litFlip(s);
      return { target: 'coef', key: 'xNegFirst', params: { was: fx(p.top, p.q, p.form), q: p.q, form: p.form }, move: 'flip' };
    }
    litMultiply(s);
    return { target: 'coef', key: 'xOverHint', params: { p: p.p, q: p.q, b: signed(p.b), was: fx(p.top, p.q, p.form), form: p.form }, move: 'mult' };
  },
  // 2x = 18 after the multiply: divide both sides by 2
  FW(s, { params: p }) {
    litDivide(s);
    return { target: 'coef', key: 'xWholeHint', params: { a: p.a, b: signed(p.b) }, move: 'divOption' };
  },
  // −2x = 18, −x = 12: flip
  FWN(s, { params: p }) {
    litFlip(s);
    return { target: 'coef', key: 'fFlipHint', params: { neg: p.a === 1 ? '−x' : `−${p.a}x`, b: signed(p.b), a: p.a, frac: fractionText(p.a) }, move: 'flip' };
  },
  // x = 3(4): x is alone; the other side is a product
  FM(s, { params: p }) {
    return { target: 'answer', key: 'xTimesHint', params: { m: signed(p.m), b: signed(p.b) } };
  },
};

const hintPopup = (id) => ({
  word: 'hint',
  open(s, { say }, shape) {
    s.hint = { kind: 'coef' };
    const r = REMINDERS[id](s, shape);
    return say(s, r.key, r.params);
  },
  after(s, before, shape) {
    s.hint = { kind: 'coef' };
    record(s, 'hint');
    return REMINDERS[id](s, shape);
  },
});

// The model rung: the box cut into equal parts (of the original problem on Levels 1 and 3, of the equation on screen on the others). If it
// is up already, the reminder. A minus in front of the fraction (Levels 4-6): not drawn until the flip; it says so, Flip everything lit,
// recorded as a reminder (`hint`).
const flipFirst = (s, shape) => shape?.id === 'FN' && s.level >= 4;
const model = (id) => ({
  word: 'model',
  wordFor: (s, shape) => (s.model || flipFirst(s, shape) ? 'hint' : 'model'),
  open(s, api, shape) {
    if (s.model) { record(s, 'hint'); return hintPopup(id).open(s, api, shape); }
    if (flipFirst(s, shape)) {
      s.hint = { kind: 'coef' };
      litFlip(s);
      return api.say(s, 'xModelFlipFirst', { was: fx(shape.params.top, shape.params.q, shape.params.form) });
    }
    const p = modelFirst(s) ? s.problem : problemOfShape(shape.params);
    s.model = newModel(p, { help: true });
    return api.say(s, 'mCutAsk', { q: p.q });
  },
});

// Levels 1 and 3: the model, then the reminder (repeating). Levels 2, 4, 5, 6: the reminder, the model, then the reminder (repeating).
const withModel = (id) => ({
  ladder: ['model', 'hintPopup'],
  ladderFor: (s) => (modelFirst(s) ? ['model', 'hintPopup'] : ['hintPopup', 'model', 'hintPopup']),
  model: model(id),
  hintPopup: hintPopup(id),
});
const reminderOnly = (id) => ({ ladder: ['hintPopup'], hintPopup: hintPopup(id) });

export const FRACTIONS_RUNGS = {
  FU: withModel('FU'), FUD: withModel('FUD'), FP: withModel('FP'), FPD: withModel('FPD'), FN: withModel('FN'),
  FW: reminderOnly('FW'), FWN: reminderOnly('FWN'), FM: reminderOnly('FM'),
};
