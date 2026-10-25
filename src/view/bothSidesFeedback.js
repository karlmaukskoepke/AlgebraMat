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
  // the wrong cancel (Build T, Part 4)
  vZeroSide: (p) => `We want the x-terms on one side and the numbers on the other. That Add took everything off one side. Undo, then ${p.x ? 'cancel just one x-term' : p.beside ? 'cancel just the number beside x' : 'try another move'}.`,
  vNoCancelX: (p) => `Add so that one x-term cancels.${p.term ? ` To cancel ${p.term}, add ${p.amount}.` : ''} Press Undo.`,
  vZeroHint: (p) => `Add ${p.amount} to both sides: the ${p.term} cancels, and the x-term that is left keeps a plus. Press Go.`,
  vZeroHintNum: (p) => `Add ${p.opposite} to both sides to cancel the ${p.constant} beside x. Press Go.`,
  vPartial: (p) => `${p.before} was only partially canceled by the ${p.added} you added: ${p.left} is still here. What would have completely canceled the ${p.before}? Press Undo.`,
};

export function bothSidesFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : distSolveFeedbackText(fb);
}
