// Light mode's messages (SPEC-SCAFFOLD.md). Messages from the full walk are Flip It's; the session tags them `src: 'walk'`.

import { feedbackText as walkText } from './feedback.js';
import { MINUS } from '../engine/expr.js';

const term = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

export const LIGHT_FEEDBACK = {
  lightIntro: () => 'Type the answer, then Check. Stuck? Press “I’m stuck.”',
  lightCorrect: ({ answer }) => `Yes! The answer is ${String(answer).replace('-', MINUS)}.`,
  lightPartyBattle: ({ a, b }) => `Let’s look at ${term(a)} and ${term(b)}. Same signs, or different signs?`,
  lightSameOrDifferent: () => 'Look at the signs again: are they the same or different?',
  lightPartyOk: () => 'Party! Same signs join together. Now type the answer.',
  lightBattleOk: () => 'Battle! Different signs: the bigger side wins. Now type the answer.',
  lightCloze: ({ situation }) => (situation === 'battle'
    ? 'Finish the sentence: who is left standing? Pick one and listen.'
    : 'Finish the sentence: what is the party worth in all? Pick one and listen.'),
  clozeSign: () => 'Right size, but check the sign: is it negative or positive? Try another.',
  clozeSize: ({ situation }) => (situation === 'battle'
    ? 'Not that size. In a battle the two sides cancel, and what is left over wins. Try another.'
    : 'Not that size. In a party the two sides join together. Try another.'),
  lightClozeRight: ({ word }) => `Yes, ${word}! Now type the answer, with its sign.`,
  lightWalk: () => 'Let’s work it out with counters.',
  typeAnswer: () => 'Type your answer with the pad, then Check.',
  answerUnreadable: () => 'I can’t read that. Type just a number, like −2 or 7.',
};

export function lightFeedbackText(fb) {
  if (!fb) return '';
  if (fb.src === 'walk') return walkText(fb);
  const f = LIGHT_FEEDBACK[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
