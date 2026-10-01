// Messages for the integer problems that run on Boxes & Circles' steps (Combine it's Level 3 and Flip It's
// mixed Level 5, SPEC-COMBINE.md): counters only, no boxes, and the answer is a single number. Anything not
// listed here falls back to Boxes & Circles' table.

import { TERM_FEEDBACK } from './termFeedback.js';

const word = (sign) => (sign === '+' ? 'positive' : 'negative');

export const INTEGER_FEEDBACK = {
  // ⓪ Rewrite (Flip It's mixed level): subtracting is adding the opposite
  rewriteIntro: () => 'Is anything subtracted? Add the opposite: tap the − in front and the number after it. If it’s all addition, tap “Nothing to rewrite.”',
  flipBoth: () => 'Flip both: the − in front, and the number after it.',
  notNegative: () => 'That one is added, so it stays. Tap a term with a − in front of it.',
  somethingToRewrite: () => 'Look again: something is being subtracted. Flip it to add the opposite.',
  rewriteDone: () => 'Rewritten! Now pick + or − and tap above each number to draw its counters.',
  nothingToRewriteOk: () => 'Right, it’s all addition. Now pick + or − and tap above each number to draw its counters.',
  hintRewrite: () => 'Flip both parts of each wiggling term: the − in front, and the number after it, so it’s added instead.',
  hintNothing: () => 'Every term is added. Tap “Nothing to rewrite.”',

  // ② Draw
  drawIntro: () => 'Pick + or −, then tap above a number to add a counter. Tap a counter to take it away. Then Check.',
  pickPieceFirst: () => 'Pick + or − first.',
  columnFull: () => 'That’s more than any number needs. Tap a counter to take it away, or Undo.',
  drawDone: () => 'Everything’s drawn! Now cancel pairs: tap a + and then a −. Any order.',
  drawDoneNoCancel: () => 'Everything’s drawn, and nothing cancels! Type what you have.',
  hintDraw: () => 'The dashed counters show what goes above each number. Pick that counter, then tap above the number until it matches.',

  // ③ Cancel
  cancelIntro: () => 'Cancel pairs: tap a + and then a −, in either order, from any numbers.',
  cancelPick: () => 'Now tap its opposite.',
  pairIsPlusMinus: () => 'A pair is one + and one −. Tap an opposite.',
  cancelDone: () => 'All the pairs are canceled! Now type what’s left, like 5 or −3.',
  hintCancel: () => 'Try the blinking pair: a + with a −.',

  // ④ Answer: one number
  typeAnswer: () => 'Type your answer first, like 5 or −3.',
  answerUnreadable: () => 'Type a number, like 5 or −3. The − button makes it negative.',
  combineAll: () => 'Type just one number: the total.',
  noZeroTerm: () => 'Count who is left. Are they positive or negative, and how many?',
  checkBoxes: () => 'Type just a number, no x.',
  checkNumbers: () => 'Count the counters that are left: are they positive or negative, and how many?',
  hintAnswer: ({ n }) => (n
    ? `The blinking counters are what’s left. They’re all ${word(n)}, so the answer is ${word(n)}. Count them.`
    : 'Every counter canceled. Nobody is left: type 0.'),
};

export function integerFeedbackText(fb) {
  const f = fb && (INTEGER_FEEDBACK[fb.key] ?? TERM_FEEDBACK[fb.key]);
  return f ? f(fb.params ?? {}) : '';
}
