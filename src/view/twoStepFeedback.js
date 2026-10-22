// What the Two-step card says (Build K), always with the real numbers. Keys it does not define fall through to Add to both sides' term
// layer (the Add move, combining, the check) and then to Flip everything's (the flip, and through it Divide it's fraction move).

import { lightsFeedbackText } from './addBothLightsFeedback.js';
import { addBothFeedbackText } from './addBothFeedback.js';
import { flipFeedbackText } from './flipFeedback.js';

const WORD = { 2: 'two', 3: 'three', 4: 'four', 5: 'five' };

const M = {
  // a fraction or a flip tapped while a side has two terms (Karl's rule "B")
  wOneTerm: () => 'That move works once each side is one term.',
  // Add at `3x = 15` with the number in front of x: the x boxes are not a number to cancel
  wBoxes: (p) => `${p.ax} is ${WORD[p.boxes] ?? p.boxes} x boxes, not a ${p.boxes} to cancel. Adding ${p.amount} does not take them away. To get one x, divide both sides by ${p.boxes} (that is, multiply by ${p.frac}): one of the ${WORD[p.boxes] ?? p.boxes} x boxes is ${p.frac}.`,
  // the reminder at `3x = 19 + −4`: the other side is still two numbers
  wCombineHint: (p) => `${p.g1} and ${p.g2} are on the same side. Put them together: drag one onto the other and type what they make.`,
  wWrong: (p) => `When x = ${p.typed}, the equation is not balanced.`,
  aTraded: () => 'The same equation with the sides traded: x is on the left now.',
};

export function twoStepFeedbackText(fb) {
  const f = fb && M[fb.key];
  if (f) return f(fb.params ?? {});
  const lights = lightsFeedbackText(fb);
  return lights !== addBothFeedbackText(fb) ? lights : flipFeedbackText(fb);
}
