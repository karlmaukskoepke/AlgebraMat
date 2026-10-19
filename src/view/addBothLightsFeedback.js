// What the Add to both sides card says under ?ui=lights (SPEC-LIGHTS-EXPERIMENT-ADD.md): the card's own messages, except where they
// name something the flagged screen no longer has (the Guess x / Use a move choice, "Add ___ to both sides", Go), plus three new ones.

import { addBothFeedbackText } from './addBothFeedback.js';

const LX = {
  lxShowMove: () => 'Nice. Now show it with a move.',
  // round 2 (SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md)
  lxMustMove: () => 'Show this one with a move first.',
  lxXCross: (p) => `x is already on the ${p.side === 'right' ? 'right' : 'left'} side of the equation. Let’s keep x there. Try moving a number.`,
  lxCombineAsk: (p) => (p.x ? `What is ${p.sum}? Type the number in front of x.` : `What is ${p.sum}? Type it in the box.`),
  lxCombineWrong: (p) => `${p.sum} is not ${String(p.typed).replace('-', '−')}. Press Undo and try again.`,
  lxCombined: () => 'Combined: one term instead of two.',
  lxCombinedAlone: () => 'Combined. Now type what x is.',
  lxNegShown: (p) => `Subtracting is adding a negative: this is ${p.neg}, a negative number. Tap its minus again to go back.`,
  lxUndone: () => 'Undone.',
  // the Distribute drill (B6)
  dxStart: () => 'Solve it by grabbing the terms. Start with the parentheses: drag the number in front of them onto them.',
  dxDragOnly: () => 'In this drill, grab the terms instead: drag them.',
  dxFlipped: () => 'Flipped: every term took its opposite, on both sides.',
  dxFlipHint: () => 'There is a negative in front of x. Flip everything: take the opposite of both sides.',
  dxMultAsk: () => 'Multiply both sides by 1 over a number: type the number.',
  dxMultNo: (p) => `1/${p.n} doesn’t split every term evenly. Try another number.`,
  dxMultiplied: () => 'Both sides multiplied: every term is smaller.',
  dxNegFactor: (p) => `Subtracting is adding a negative: the factor is ${p.neg}. Now drag ${p.neg} onto the parentheses.`,
  dxTapMinusFirst: (p) => `Tap the minus first, so ${p.factor} is a negative number.`,
  dxProducts: () => 'Multiply each term in the parentheses. Type each product; Enter goes to the next.',
  dxTypeX: () => 'Type every piece, including the x.',
  dxProductWrong: (p) => `${p.product} is not ${p.typed}. Try that one again, or Undo.`,
  dxDistributed: () => 'Distributed. Now put the numbers together: drag one number onto the other.',
  dxCrossed: () => 'Across the line: the pair on that side cancels.',
  dxGroupCross: () => 'Open the parentheses first: drag the number in front of them onto them.',
  dxRight: (p) => `x = ${p.answer}. That’s it!`,
  dxWrong: (p) => `x = ${p.typed} doesn’t make it balance. Keep going with the terms, then try again.`,
  lxZero: () => 'Adding 0 keeps everything the same. Undo it and try a different number.',
  aPickAmount: () => 'What do you add to both sides? Type it in the box.',
  aAmountSet: (p) => `The box says ${p.amount}. Is that what you need to add to cancel? Change it with ± if not.`,
  aOppHint: (p) => `Add ${p.opposite} to both sides to cancel the ${p.constant}. Press Go.`,
  aStuckHint: (p) => `Look at the ${p.constant} next to x. What would we add to both sides to eliminate it? Type it in the box.`,
  aUndone: () => 'Undone. Try a different number in the box.',
  aGreen: () => 'Fewer terms: that move helped. Press Next.',
};

export function lightsFeedbackText(fb) {
  const f = fb && LX[fb.key];
  return f ? f(fb.params ?? {}) : addBothFeedbackText(fb);
}
