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
