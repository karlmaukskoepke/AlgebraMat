// What Level 1 of Divide it says on the line.
import { divideFeedbackText } from './divideFeedback.js';

const M = {
  dnStart: (p) => `Numbers only: this equation is balanced. Choose “Take a fraction of both sides” and take ${p.frac} of each side.`,
  dnSuggest: (p) => `Take ${p.frac}: it is already chosen. Take it of the left side, then of the right.`,
  dnQuiz: () => 'Quick question. Read it below, then pick an answer.',
  dnOtherSide: () => 'You took it of this side already. Now take the same fraction of the other side.',
  dnTookOne: (p) => `${p.frac} of the ${p.side}: ${p.readout}. One side got smaller than the other.`,
  dnBalanced: (p) => `${p.frac} of both sides: ${p.readout}. Press Go.`,
  dnUnbalanced: (p) => `Not the same fraction: ${p.readout}.`,
  dnGoNotYet: () => 'Go works when the same fraction was taken of both sides.',
  dnDone: (p) => `${p.frac} of both sides kept the balance: ${p.readout}`,
  dnUndone: () => 'Undone.',
  dnQuizRight: (p) => `Yes! It ${p.correct === 'keeps' ? 'keeps' : 'upsets'} the balance.`,
  dnQuizWrong: (p) => `You said ${p.said}. Look: it ${p.correct === 'keeps' ? 'keeps' : 'upsets'} the balance.`,
  dwA: () => 'We don’t know x yet, but the = sign tells us both sides are balanced. Tap “Take a fraction of both sides”.',
  dwB: () => '3 boxes: take ⅓ of both sides to leave one box. Tap ⅓.',
  dwC: () => 'Take 1 of the 3 groups on each side: that is what × ⅓ does. Press Next.',
  dwD: () => 'Only the kept group is left: one box, x, and ⅓ of the 6. Press Next.',
  dwE: () => 'Now we have x = 2. Press Next.',
  dwF: () => '2 is the amount that makes it balance. Press Next.',
  dwG: () => 'Taking a fraction of both sides can leave one box. Press Next to go on.',
  dwEnd: () => 'Taking a fraction of both sides can leave one box.',
};

export const divideNumericFeedbackText = (fb) => (fb && M[fb.key] ? M[fb.key](fb.params ?? {}) : divideFeedbackText(fb));
