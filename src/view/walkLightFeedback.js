// Messages for light mode on the cards without targeted supports (SPEC-SCAFFOLD.md §8). While the full walk is on,
// the walk's own messages show (the card's text function).

import { MINUS } from '../engine/expr.js';

const WL = {
  wlIntro: ({ pad }) => (pad === 'algebra' ? 'Type the answer with the pad, then Check.' : 'Type the answer with the pad, then Check.'),
  wlCorrect: ({ answer }) => `Yes! The answer is ${String(answer).replace(/-/g, MINUS)}.`,
  wlWalk: () => 'Not quite. Let’s go step by step.',
  wlStuck: () => 'No problem. Let’s go step by step.',
  typeAnswer: () => 'Type your answer with the pad, then Check.',
  answerUnreadable: ({ pad } = {}) => (pad === 'algebra'
    ? 'I can’t read that. Type terms like 2x + 3, with x, + and −.'
    : 'I can’t read that. Type just a number, like −2 or 7.'),
};

export function walkLightFeedbackText(fb, walkText) {
  if (!fb) return '';
  if (fb.src === 'walk') return walkText(fb);
  const f = WL[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
