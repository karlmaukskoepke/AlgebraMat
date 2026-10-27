// Strange solutions' words (Build V): its own keys, then Variables on both sides' (which falls back to the shared ones).

import { bothSidesFeedbackText } from './bothSidesFeedback.js';

const M = {
  sSimplify: (p) => (p.second ? 'Can you simplify this further? Divide the top and the bottom by the same number.' : 'Can you simplify this further?'),
  sNoDecimal: () => 'Write it as a fraction, like 5/2.',
  sZeroBottom: () => 'The bottom of a fraction can’t be 0.',
  typeAnswer: () => 'Type your answer: the top, then / and the bottom (a whole number needs only the top).',
  answerUnreadable: () => 'I can’t read that. Type the top, then / and the bottom, with − on the top if it’s negative.',
  sDivideFront: (p) => (p.minus ? 'x has a minus: flip both sides (· −1) to get x alone.' : `Divide by ${p.a}, the number in front of x: then x is alone.`),
  sFlipFirst: () => 'x has a minus: flip both sides (· −1) to get x alone.',
  wWrong: (p) => `When x = ${p.typed}, the equation is not balanced.${p.more === 'frac-swapped' ? ' Check which number goes on top: x is the number divided by the number in front of x.'
    : p.more === 'frac-no-divide' ? ' Remember to divide by the number in front of x: the answer can be a fraction.' : ''}`,
  // the reminders (engine/solveit/rungs/strange.js)
  sDivideHint: (p) => `To get one x, divide both sides by ${p.neg ? '−' : ''}${p.a}. The answer can be a fraction: that is fine.`,
  sSimplifyHint: (p) => `Simplify ${p.f}: divide the top and bottom by the same number, then type x.`,
  sTypeHint: (p) => `x is ${p.f}. Type it in x =: the top, then /, then the bottom.`,
  sFlipHint: () => 'x has a minus: flip both sides (· −1) to get x alone.',
  sNegHint: (p) => `x is the opposite of ${p.f}. Simplify it, then type x with its sign.`,
  sNoXHint: () => 'x disappeared. Is this statement ever true?',
};

export function strangeFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : bothSidesFeedbackText(fb);
}
