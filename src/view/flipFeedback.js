// What Flip everything says (SPEC-FLIP-IT.md rev 1.2), always with the real numbers. Keys it does not define fall through to Divide it's
// (the shared fraction move: a fraction that does not split, the blank) and then Add to both sides' (the check, Trade places, "Yes!").

import { divideFeedbackText } from './divideFeedback.js';

const M = {
  // the reminder: I'm stuck, and the hint after Undo (solveit/rungs/flip.js)
  fFlipHint: (p) => (p.a > 1
    ? `${p.neg} has a minus. To get rid of it, multiply both sides by −1: Flip everything. Then divide both sides by ${p.a} (that is, multiply by ${p.frac}).`
    : `${p.neg} means x has a minus. To get rid of it, multiply both sides by −1: Flip everything.`),
  // after typing the number without its sign (12 for −x = 12), or the number in front of x ignored
  fSignHint: (p) => (p.a > 1
    ? `In ${p.neg} = ${p.b} the minus belongs to x. Flip everything first: multiply both sides by −1.`
    : `${p.neg} = ${p.b} means the opposite of x is ${p.b}, so x is not ${p.b}. Flip everything: multiply both sides by −1.`),
  fNegHint: (p) => `x is alone. −(${p.b}) means the opposite of ${p.b}. Work it out and type x.`,
  fFracHint: (p) => `x is ${p.words}. Work it out, then type x.`,      // (Build T: "15 divided by 3" or "⅓ of 15", as drawn)
  // a flip of x with no minus (the spotlight, then Undo)
  fWorse: (p) => `Flipping ${p.was} = ${p.b} made ${p.now} = ${p.nb}: now x has a minus. Press Undo.`,
  fWrong: (p) => `When x = ${p.typed}, the equation is not balanced.`,
  fTraded: () => 'The same equation with the sides traded: x is on the left now.',
  aLaterLevel: () => 'That move unlocks on a later level.',
  // the first flip of a level that helps (Build K)
  fFlipIntro: () => 'Multiplying both sides by −1 flips every sign. −x becomes x.',
  // dividing by a negative with the Divide button, once a level (Build P, Part 9)
  dDivNegIntro: (p) => (Number(p.n) === 1 ? 'Dividing by −1 does the same thing as multiplying by −1: every sign flips.' : `Dividing by −${p.n} flips every sign, just like multiplying by a negative does, and then divides by ${p.n}.`),
};

export function flipFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : divideFeedbackText(fb);
}
