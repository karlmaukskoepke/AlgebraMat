// What the Add to both sides card says under ?ui=lights (SPEC-LIGHTS-EXPERIMENT-ADD.md): the card's own messages, except where they
// name something the flagged screen no longer has (the Guess x / Use a move choice, "Add ___ to both sides", Go), plus three new ones.

import { addBothFeedbackText } from './addBothFeedback.js';

const CROSS_TAIL = {
  number: () => 'Try moving the number.',
  numbers: () => 'Try moving a number.',
  divide: (p) => (p.a === '−1' ? 'To get x from −x, divide both sides by −1.' : `To get one x from ${p.a}x, divide both sides by ${p.a}.`),
  alone: () => 'x is already alone. Type its value.',
  combine: () => 'Combine the x-terms first: drag one onto the other.',
  distribute: (p) => `Drag the ${p.factor} onto its parenthesis to multiply it in.`,
  work: () => 'Work out the numbers beside x first.',
};

const LX = {
  lxShowMove: () => 'Nice. Now show it with a move.',
  // round 2 (SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md)
  lxMustMove: () => 'Show this one with a move first.',
  // (Build T: the last sentence fits the shape of x's side, never a move that does not apply)
  lxXCross: (p) => `x is already on the ${p.side === 'right' ? 'right' : 'left'} side of the equation. Let’s keep x there. ${CROSS_TAIL[p.tail ?? 'numbers'](p)}`,
  lxXInGroup: (p) => `The other side has an x too, inside the parenthesis. Drag the ${p.factor} onto its parenthesis first.`,
  lxSayAlone: (p) => p.text,
  lxWorkFirst: (p) => (p.what ? `Work out ${p.what} first: click the ${p.div ? 'fraction bar' : '×'}.` : 'Work this out first, then move it.'),
  // a drop that cannot work says why, and the term goes back (Build S: never a silent drop)
  lxUnlike: (p) => (p.group ? 'A parenthesis has to be distributed before anything joins it. Drag its number onto the parenthesis first.' : 'Only like terms combine: an x-term with an x-term, a number with a number.'),
  lxFactorParen: (p) => `Drag the ${p.factor} onto its parenthesis to multiply it in.`,
  lxCombineAsk: (p) => (p.x ? `What is ${p.sum}? Type the number in front of x.` : `What is ${p.sum}? Type it in the box.`),
  lxCombineWrong: (p) => `${p.sum} is not ${String(p.typed).replace('-', '−')}. Press Undo and try again.`,
  lxCombined: () => 'Combined: one term instead of two.',
  // Undo after a wrong typed amount: back in its blank (Build T, Part 3)
  lxCombineRetry: (p) => (p.x ? `Try again: what is ${p.sum}? Type the number in front of x.` : `Try again: what is ${p.sum}? Type it in the box.`),
  lxCalcRetry: (p) => (p.div ? `Try again: what is ${p.expr}? What times ${p.by} makes ${p.b}? Type it in the box.` : `Try again: what is ${p.expr}? It is ${p.of}. Type it in the box.`),
  // a product worked out (Build P, Part 2)
  lxCalcAsk: (p) => `What is ${p.expr}? Type it in the box.`,
  lxCalcWrong: (p) => `${p.expr} is not ${p.typed}. Press Undo and try again.`,
  lxCalculated: () => 'Worked out: one number.',
  mCalcHint: (p) => (p.div ? `${p.expr}: what times ${p.by} makes ${p.b}? Click the fraction bar and type it.` : `${p.expr} is ${p.of}: split ${p.b} into ${p.n} equal groups and take ${p.neg ? 'the opposite of ' : ''}one. Click the × and type it.`),
  lxCombinedAlone: () => 'Combined. Now type what x is.',
  lxNegShown: (p) => `Subtracting is adding a negative: this is ${p.neg}, a negative number. Tap its minus again to go back.`,
  lxUndone: () => 'Undone.',
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
