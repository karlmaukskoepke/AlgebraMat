// What Variables on both sides says (Build R), always with the real numbers. Keys it does not define fall through to Distribute's words
// (the distribute move, combining x-terms), and through them to Two-step's and Add to both sides'.

import { distSolveFeedbackText } from './distSolveFeedback.js';

export const ONE_SIDE_NOTE = 'Get x on one side first.';
const M = {
  vMoveXHint: (p) => `Move this x-term to the other side. Drag it across the =, or use Add. (${p.term} is the one with the smaller number in front.)`,
  vPickX: () => 'What x-term do you add to both sides? Type the number in front of x, with its sign.',
  vOneSide: () => ONE_SIDE_NOTE,
  vRed: (p) => (p.before ? `Adding to both sides is used to eliminate terms by adding the opposite. ${p.before} + ${p.added} did not eliminate the term. Press Undo and try again.`
    : `${p.added} did not eliminate any term. Press Undo and try again.`),
  vPartial: (p) => `${p.before} was only partially canceled by the ${p.added} you added: ${p.left} is still here. What would have completely canceled the ${p.before}? Press Undo.`,
};

export function bothSidesFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : distSolveFeedbackText(fb);
}
