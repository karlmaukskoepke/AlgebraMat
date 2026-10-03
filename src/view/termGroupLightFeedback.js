// Messages for light mode on Groups of Terms (Karl, 2026-10-03). While a step of the card's own walk is showing the
// walk's messages show (`src: 'tg'`, view/termGroupFeedback.js; `src: 'bc'` for Box & Circle, view/termFeedback.js),
// led by why it's there when the session says so.

import { termGroupFeedbackText } from './termGroupFeedback.js';
import { termFeedbackText } from './termFeedback.js';

export const TG_LIGHT = {
  tgIntro: () => 'Type the answer: the number out front multiplies everything inside the parentheses. Then Check.',
  tgCorrect: ({ answer }) => `Yes! The answer is ${answer}.`,
  tgArrows: ({ outer }) => `${outer} distributes to both terms: each arrow is a multiplication. Try the answer again.`,
  tgInside: () => 'Box the x term and circle the number inside the parentheses, with the sign in front of each. Then Check, and I’ll draw the arrows.',
  tgInsideDone: ({ outer }) => `Boxed and circled, signs and all. Now ${outer} distributes to both terms: each arrow is a multiplication. Try the answer again.`,
  tgOne: () => 'A − in front of the parentheses is −1 group. Write the hidden 1 in the gap, then Check, and I’ll draw the arrows.',
  tgOneDone: ({ outer }) => `Now it reads ${outer}(…): ${outer} distributes to both terms, and each arrow is a multiplication. Try the answer again.`,
  tgZeroTerm: () => 'One of those terms is zero (0x, or 0 on its own), so it isn’t really there. Take it out and type what’s left.',
  typeAnswer: () => 'Type your answer with the pad, then Check.',
  answerUnreadable: () => 'I can’t read that. Type terms like 2x + 3, with x, + and −.',
  // Why the walk opened.
  tgWrong: () => 'Not quite. Let’s go step by step.',
  tgOuter: () => 'Look at the number out front: it isn’t a term to add, it says how many groups. Let’s make the groups.',
  tgStuck: () => 'No problem. Let’s go step by step.',
  tgTeach: () => 'Here’s the step-by-step way.',
};

export function termGroupLightFeedbackText(fb) {
  if (!fb) return '';
  if (fb.src === 'tg' || fb.src === 'bc') {
    const base = fb.src === 'bc' ? termFeedbackText(fb) : termGroupFeedbackText(fb);
    return fb.lead ? `${TG_LIGHT[fb.lead]()} ${base}` : base;
  }
  const f = TG_LIGHT[fb.key];
  return f ? f(fb.params ?? {}) : termGroupFeedbackText(fb);       // hints are the walk's
}
