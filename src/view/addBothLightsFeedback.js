// What the Add to both sides card says under ?ui=lights (SPEC-LIGHTS-EXPERIMENT-ADD.md): the card's own messages, except where they
// name something the flagged screen no longer has (the Guess x / Use a move choice, "Add ___ to both sides", Go), plus three new ones.

import { addBothFeedbackText } from './addBothFeedback.js';

const LX = {
  lxFindX: () => 'Find x.',
  lxShowMove: () => 'Nice. Now show it with a move.',
  // round 2 (SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md)
  lxMustMove: () => 'Show this one with a move: use Add, or drag the number across the line.',
  lxXCross: () => 'That moves x. Try the number.',
  lxCombineAsk: (p) => `What is ${p.sum}? Type it in the box.`,
  lxCombineWrong: (p) => `${p.sum} is not ${String(p.typed).replace('-', '−')}. Try the sum again, or Undo.`,
  lxCombined: () => 'Combined: one term instead of two.',
  lxCombinedAlone: () => 'Combined. Now type what x is.',
  lxNegShown: (p) => `Subtracting is adding a negative: this is ${p.neg}, a negative number. Tap its minus again to go back.`,
  lxUndone: () => 'Undone.',
  lxZero: () => 'Adding 0 keeps everything the same. Undo it and try a different number.',
  aPickAmount: () => 'What do you add to both sides? Type it in the box.',
  aAmountSet: (p) => `The box says ${p.amount}. Is that what you need to add to cancel? Change it with ± if not.`,
  aStuckHint: (p) => `Look at the ${p.constant} next to x. What would we add to both sides to eliminate it? Type it in the box.`,
  aUndone: () => 'Undone. Try a different number in the box.',
  aGreen: () => 'Fewer terms: that move helped. Press Next.',
};

export function lightsFeedbackText(fb) {
  const f = fb && LX[fb.key];
  return f ? f(fb.params ?? {}) : addBothFeedbackText(fb);
}
