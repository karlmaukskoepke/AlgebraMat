// Messages for Combine it's Level 4 (big numbers, no counters; SPEC-COMBINE.md §3). Keys not listed here fall
// back to Boxes & Circles' table (the Circle step's checks) and then Flip It's (Party or Battle).

import { TERM_FEEDBACK } from './termFeedback.js';
import { FEEDBACK } from './feedback.js';
import { MINUS } from '../engine/expr.js';

const signed = (n) => (n < 0 ? `${MINUS}${-n}` : `${n}`);
const word = (sign) => (sign === '+' ? 'positive' : 'negative');

export const BIG_FEEDBACK = {
  // ① Circle
  bigCircleIntro: () => 'Circle each number, taking the sign in front with it: drag across it from the sign. Do the same for every number.',
  boxCircleIntro: () => 'Circle each number, taking the sign in front with it: drag across it from the sign. Do the same for every number.',
  hintBigCircle: () => 'Circle every number with the sign in front of it. The blinking ones aren’t done yet.',

  // ② Combine (three terms)
  bigCombineIntro: () => 'Three numbers! Two of them have the same sign: tap those two, then type what they make together, with its sign.',
  twoOnly: () => 'Just two: tap one again to put it back.',
  pickTwo: () => 'Tap the two numbers that have the same sign.',
  wrongPair: () => 'Those two have different signs. Find the two with the same sign.',
  typeCombine: () => 'Type what those two make together, with its sign.',
  combineOff: () => 'Those two have the same sign, so they join together. Add their values, and keep the sign they share.',
  combineDone: () => 'Combined! Now there are two numbers left. Party or Battle?',
  hintCombine: () => 'The blinking two have the same sign. Tap them, add their values, and keep the sign.',

  // ③ Party or Battle
  bigPartyIntro: () => 'Circled! Look at the signs: are they the same (a Party) or different (a Battle)?',
  bigPartyOk: () => 'Party! Same signs join together. Do you add or subtract their values?',
  bigBattleOk: () => 'Battle! Different signs fight. Do you add or subtract their values?',
  hintBigPartyBattle: ({ a, b, same }) =>
    `${signed(a)} is ${a > 0 ? 'positive' : 'negative'} and ${signed(b)} is ${b > 0 ? 'positive' : 'negative'}: ${same ? 'same signs, so it’s a Party.' : 'different signs, so it’s a Battle.'}`,

  // ④ Add or Subtract
  bigOpOff: ({ choice }) => (choice === 'party'
    ? 'In a party the numbers join together. Add their values.'
    : 'In a battle they fight: subtract the smaller value from the larger.'),
  hintBigAddSub: ({ choice }) => (choice === 'party'
    ? 'A party joins its numbers together, so add the values (ignore the signs for now).'
    : 'A battle cancels, so take the smaller value away from the larger (ignore the signs for now).'),

  // ⑤ Sign
  bigSignParty: () => 'Now the sign: what sign do they share?',
  bigSignBattle: () => 'Now the sign: who wins the battle, and what sign does the winner have?',
  bigSignOff: ({ choice }) => (choice === 'party'
    ? 'A party keeps the sign they all share. Look at the signs.'
    : 'In a battle, the bigger value wins and the answer has its sign. Which value is bigger?'),
  hintBigSign: ({ choice }) => (choice === 'party'
    ? 'They all have the same sign, and the answer keeps it.'
    : 'The blinking value is the bigger one: it wins, and the answer has its sign.'),

  // ⑥ Answer
  bigAnswerIntro: () => 'Now put it together: type the answer, with the sign you found.',
  typeAnswer: () => 'Type your answer first, with its sign.',
  answerUnreadable: () => 'Type a number. The − button makes it negative.',
  bigAnswerSize: ({ op }) => `Check the ${op === 'add' ? 'addition' : 'subtraction'} of the values again.`,
  bigAnswerSign: ({ sign }) => `The size is right! Now the sign: you found ${word(sign)}, so the answer is ${word(sign)}.`,
  hintBigAnswer: ({ op, sign }) => `${op === 'add' ? 'Add' : 'Subtract'} the values, then give it the sign you found (${word(sign)}).`,
  correct: ({ answer }) => `Yes! The answer is ${answer}.`,
};

export function bigFeedbackText(fb) {
  const f = fb && (BIG_FEEDBACK[fb.key] ?? TERM_FEEDBACK[fb.key] ?? FEEDBACK[fb.key]);
  return f ? f(fb.params ?? {}) : '';
}
