// Every feedback message in one table, so the wording is easy to edit.
// Keys come from engine/moves.js and engine/session.js.

import { MINUS } from '../engine/expr.js';

const signed = (n) => (n < 0 ? `${MINUS}${-n}` : `${n}`);
const kind = (sign, count) => {
  const word = sign === '+' ? 'positive' : 'negative';
  return `${count} ${word}${count === 1 ? '' : 's'}`;
};

export const FEEDBACK = {
  rewriteIntro: () => `Rewrite: tap signs to flip them — or tap “Nothing to rewrite.”`,
  flipBoth: () => 'Flip both signs!',
  alreadyAddition: () => 'It’s already addition — nothing to rewrite.',
  notAddition: () => 'It’s subtraction — flip both signs to rewrite it.',
  rewriteDone: () => 'Rewritten! Now pick + or −, then tap above each number to draw.',
  nothingToRewriteOk: () => 'Right — already addition. Now pick + or −, then tap above each number to draw.',

  drawIntro: () => 'Tap above a number to add a counter. Tap a counter to remove it. Then Check.',
  pickSignFirst: () => 'Pick + or − first.',
  zoneFull: () => 'That’s 12 — the most one number needs.',
  needType: ({ n, count, sign }) => `That number is ${signed(n)}, so it needs ${kind(sign, count)}.`,
  countAgain: ({ n, have }) => `Count again — you have ${have}, the number is ${signed(n)}.`,
  drawDone: () => 'Nice drawing! Party or Battle?',

  sameOrDifferent: () => 'Look at the signs — are they the same or different?',
  partyOk: () => 'Party! Same signs join together. Count them all.',
  battleOk: () => 'Battle! Tap one + and one − to cancel a pair.',

  pickPartner: ({ sign }) => `Now tap a ${sign === '+' ? '−' : '+'} to pair with it.`,
  pairNeedsBoth: () => 'A pair is one + and one −.',
  alreadyCanceled: () => 'That one is already canceled.',
  pairCanceled: () => 'Nice! Cancel another pair.',
  cancelDone: () => 'Only one kind left! Count who is left.',

  answerIntro: () => 'Count who is left. Use ± for the sign.',
  typeAnswer: () => 'Type a number first.',
  countWhoIsLeft: () => 'Count who is left.',
  correct: ({ answer }) => `Yes! The answer is ${signed(answer)}.`,

  // Hints, shown after 3 wrong tries on a step. They show the move; the
  // student still makes it.
  hintRewrite: () => 'Watch the wiggling signs: tap each one to flip it.',
  hintNothing: () => 'It already says +. Tap “Nothing to rewrite.”',
  hintDraw: ({ left, right }) =>
    `Draw ${kind(left > 0 ? '+' : '-', Math.abs(left))} on the left and ${kind(right > 0 ? '+' : '-', Math.abs(right))} on the right. The faint ones show where.`,
  hintPartyBattle: ({ a, b, same }) =>
    `${signed(a)} is ${a > 0 ? 'positive' : 'negative'} and ${signed(b)} is ${b > 0 ? 'positive' : 'negative'}: ${same ? 'same signs, so it’s a Party.' : 'different signs, so it’s a Battle.'}`,
  hintCancel: () => 'Tap the two blinking counters: one + and one −.',
  hintAnswer: ({ sign, none }) => (none
    ? 'Every counter canceled. Nobody is left.'
    : `Count the ones without a slash. They are ${sign === '+' ? 'positives' : 'negatives'}.`),
};

export function feedbackText(fb) {
  const f = fb && FEEDBACK[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
