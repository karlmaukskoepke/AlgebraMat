// Distribute, then combine's own messages: the Write it step and the hand-off to ② combine. Everything else
// is Groups of Terms' or Boxes & Circles' table, picked by the `src` the session puts on each message.

import { termGroupFeedbackText } from './termGroupFeedback.js';
import { termFeedbackText } from './termFeedback.js';

export const DISTRIBUTE_FEEDBACK = {
  hintLine: ({ whole, group }) => `Copy the problem ${whole}, but write ${group} where the group was. Keep each other term's sign: it's the operation in front.`,
  lineIntro: ({ group }) => `Now write the whole problem with the group opened: ${group} goes where the group was, and the other terms stay as they are. Don't combine yet!`,
  lineOk: ({ line }) => `Opened! ${line}. Now ② combine: box the x terms and circle the numbers, signs and all.`,
  lineTooSoon: () => 'That’s already combined! First write every term, just opened up. We combine in step ②.',
  lineSigns: () => 'Right terms, but check a sign. A term’s sign is the operation in front of it: − 4x is a negative 4x.',
  lineMissing: () => 'Some terms are missing. Copy the other terms of the problem too.',
  lineOff: () => 'Not quite. Put the opened group in the group’s place and copy the other terms as they are.',
  typeAnswer: () => 'Type the line with the pad: x, +, − and digits.',
  answerUnreadable: () => 'I can’t read that. Try something like 6x − 8 − x + 5.',
};

export function distributeFeedbackText(fb) {
  if (!fb) return '';
  if (fb.src === 'dist') {
    const f = DISTRIBUTE_FEEDBACK[fb.key];
    return f ? f(fb.params ?? {}) : '';
  }
  return fb.src === 'tg' ? termGroupFeedbackText(fb) : termFeedbackText(fb);
}
