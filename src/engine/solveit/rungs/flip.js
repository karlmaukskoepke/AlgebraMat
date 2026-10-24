// Flip everything's help, as entries of the scaffold registry (../registry.js), keyed by shape (../shape.js). Basic form (Build J): every
// shape has the reminder only, the same on I'm stuck and after Undo. It lights the move the student needs, with its preview on the
// equation, in words with the real numbers; recorded as a reminder (`hint`). No seesaw, counters, opposite-box picture or Teach me yet.
// After a fraction that did not split, the shared fraction cycle (Divide it's: the boxes and the counters, the fractions tried crossed off).

import { fractionText, signed } from '../../solveTerms.js';
import { fractionCycleHint } from './divide.js';

const record = (s) => { if (!s.supportsShown.includes('hint')) s.supportsShown.push('hint'); };
const xText = (a) => (a === 1 ? '−x' : `−${a}x`);

// Each reminder: what to set up on the screen, and what it says: { target, key, params, move }.
const REMINDERS = {
  // −x = b: Flip everything lit, its preview on the equation
  F1(s, shape, tag) {
    s.ui = { ...(s.ui ?? {}), preview: 'flip' };
    const key = tag === 'sign-flipped' || tag === 'ignored-front' ? 'fSignHint' : 'fFlipHint';
    return { target: 'coef', key, params: { neg: '−x', b: signed(shape.params.b), a: 1 }, move: 'flip' };
  },
  // −ax = b: the flip first (either order works; the reminder names one), then the fraction
  F2(s, shape, tag) {
    s.ui = { ...(s.ui ?? {}), preview: 'flip' };
    const a = shape.params.a;
    const key = tag === 'sign-flipped' || tag === 'ignored-front' ? 'fSignHint' : 'fFlipHint';
    return { target: 'coef', key, params: { neg: xText(a), b: signed(shape.params.b), a, frac: fractionText(a) }, move: 'flip' };
  },
  // ax = b after a flip: Multiply's options open with Divide lit and previewed (Build L) (Divide it's reminder, with these numbers)
  F3(s, shape) {
    s.mopts = { kind: null, entry: '', lit: 'div' };              // (Build O: the Divide button is lit, not Multiply's options)
    s.ui = { ...(s.ui ?? {}), preview: 'div' };
    return { target: 'coef', key: 'dReminder', params: { boxes: shape.params.a, frac: fractionText(shape.params.a) }, move: 'divOption' };
  },
  // x = −(b): x is alone; the other side is the opposite of a number
  F4(s, shape) {
    return { target: 'answer', key: 'fNegHint', params: { b: signed(shape.params.b) } };
  },
  // x = ⅟a(b) or −⅟a(b): x is alone; the other side is a fraction of a number
  F5(s, shape) {
    const f = `${shape.params.sign < 0 ? '−' : ''}${fractionText(shape.params.n)}`;
    return { target: 'answer', key: 'fFracHint', params: { f, b: signed(shape.params.b), n: shape.params.n, neg: shape.params.sign < 0 } };
  },
};

// One entry per shape: a ladder of one rung (it repeats), and the same reminder after Undo (a slip can shape its words).
const entry = (id) => ({
  ladder: ['hintPopup'],
  hintPopup: {
    word: 'hint',
    open(s, { say }, shape) {
      s.hint = { kind: 'coef' };
      const r = REMINDERS[id](s, shape, null);
      return say(s, r.key, r.params);
    },
    after(s, before, shape) {
      const cycle = fractionCycleHint(s, before);
      if (cycle) return cycle;
      s.hint = { kind: 'coef' };
      const tag = before?.sub?.tag ?? (before?.feedback?.params?.tag ?? null);
      record(s);
      return REMINDERS[id](s, shape, tag);
    },
  },
});

export const FLIP_RUNGS = { F1: entry('F1'), F2: entry('F2'), F3: entry('F3'), F4: entry('F4'), F5: entry('F5'), FF: { waiting: true } };
