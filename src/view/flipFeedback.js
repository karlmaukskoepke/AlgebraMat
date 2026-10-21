// What Flip everything says (SPEC-FLIP-IT.md rev 1.2), always with the real numbers. Keys it does not define fall through to Divide it's
// (the shared fraction move: a fraction that does not split, the blank) and then Add to both sides' (the check, Trade places, "Yes!").

import { divideFeedbackText } from './divideFeedback.js';

const M = {
  // the reminder: I'm stuck, and the hint after Undo (solveit/rungs/flip.js)
  fFlipHint: (p) => (p.a > 1
    ? `${p.neg} has a minus. To get rid of it, multiply both sides by −1: Flip everything. Then take ${p.frac} of both sides.`
    : `${p.neg} means x has a minus. To get rid of it, multiply both sides by −1: Flip everything.`),
  // after typing the number without its sign (12 for −x = 12), or the number in front of x ignored
  fSignHint: (p) => (p.a > 1
    ? `In ${p.neg} = ${p.b} the minus belongs to x. Flip everything first: multiply both sides by −1.`
    : `${p.neg} = ${p.b} means the opposite of x is ${p.b}, so x is not ${p.b}. Flip everything: multiply both sides by −1.`),
  fNegHint: (p) => `x is alone. −(${p.b}) means the opposite of ${p.b}. Work it out and type x.`,
  fFracHint: (p) => (p.neg
    ? `x is alone. ${p.f}(${p.b}) is the opposite of 1 of ${p.n} equal groups of ${p.b}. Work it out and type x.`
    : `x is alone. ${p.f}(${p.b}) is 1 of ${p.n} equal groups of ${p.b}. Work it out and type x.`),
  // a flip of x with no minus (the spotlight, then Undo)
  fWorse: (p) => `Flipping ${p.was} = ${p.b} made ${p.now} = ${p.nb}: now x has a minus. Press Undo.`,
  fWrong: (p) => `When x = ${p.typed}, the equation is not balanced.`,
  fTraded: () => 'The same equation with the sides traded: x is on the left now.',
  aLaterLevel: () => 'That move unlocks on a later level.',
};

export function flipFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : divideFeedbackText(fb);
}
