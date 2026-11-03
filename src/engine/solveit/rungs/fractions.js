// Fractions of x's help (Build AA), as entries of the scaffold registry (../registry.js), keyed by shape (../shape.js). On a fraction of x
// the first rung of I'm stuck is the model (the box cut into equal parts, engine/fractionsModel.js); the second is the reminder (the move
// to make, said in the form on the screen, its move lit with its preview), which then repeats. After a move and Undo the hint is the
// reminder; after a wrong value and Undo it is the model (the card's spotlight, engine/cards/fractions.js). Fraction words for `⅔x`
// ("⅔ of x"), divide-by words for `2x/3` and `x/3` (Build T's rule).

import { signed, fractionText } from '../../solveTerms.js';
import { ratioText } from '../../solveTerms.js';
import { newModel } from '../../fractionsModel.js';

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
  // −⅔x = 6: flip first, or multiply first; the reminder names the flip where it is live, else the multiply
  FN(s, { params: p }) {
    if (s.level >= 4) {
      litFlip(s);
      return { target: 'coef', key: 'xNegHint', params: { was: fx(p.top, p.q, p.form), q: p.q, form: p.form }, move: 'flip' };
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

// The model rung: the box cut into equal parts (of the original problem). If it is up already, the reminder.
const model = (id) => ({
  word: 'model',
  open(s, api, shape) {
    if (s.model) { record(s, 'hint'); return hintPopup(id).open(s, api, shape); }
    s.model = newModel(s.problem, { help: true });
    return api.say(s, 'mCutAsk', { q: s.problem.q });
  },
});

const withModel = (id) => ({ ladder: ['model', 'hintPopup'], model: model(id), hintPopup: hintPopup(id) });
const reminderOnly = (id) => ({ ladder: ['hintPopup'], hintPopup: hintPopup(id) });

export const FRACTIONS_RUNGS = {
  FU: withModel('FU'), FUD: withModel('FUD'), FP: withModel('FP'), FPD: withModel('FPD'), FN: withModel('FN'),
  FW: reminderOnly('FW'), FWN: reminderOnly('FWN'), FM: reminderOnly('FM'),
};
