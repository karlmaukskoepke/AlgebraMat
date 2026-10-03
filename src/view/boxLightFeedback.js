// Messages for light mode on Boxes & Circles (Karl, 2026-10-03). While a step of the card's own walk is showing, the
// walk's messages show (`src: 'ts'`, view/termFeedback.js), led by why it's there when the session says so.

import { termFeedbackText } from './termFeedback.js';

const SHAPES = 'a box around each x term, a circle around each number, signs and all';

const BL = {
  blIntro: () => 'Type the answer, then Check. Stuck? Draw boxes and circles first, or press “I’m stuck.”',
  blCorrect: ({ answer }) => `Yes! The answer is ${answer}.`,
  blWrongBoxes: () => `Not quite. Draw boxes and circles first: ${SHAPES}. Then try the answer again.`,
  blStuckBoxes: () => `Let’s draw boxes and circles first: ${SHAPES}. Then type the answer.`,
  blBoxesOn: () => `Draw ${SHAPES}, then Check. Then type the answer.`,
  blBoxesDone: () => 'Everything is boxed and circled. Look at the boxes, then at the circles, and type the answer again.',
  blRewriteIntro: () => 'Subtracting is adding the opposite. Tap a − in front, then the sign of the number after it. Rewrite as many as you like, then press Done.',
  blRewriteMore: () => 'Tap another subtraction to rewrite it, or press Done.',
  blRewriteDone: () => 'Rewritten! Now type the answer.',
  blNothingRewritten: () => 'Nothing was rewritten. Type the answer when you’re ready.',
  blNotSub: () => 'That one isn’t a subtraction. Tap a − in front of a term.',
  blZeroTerm: () => 'One of those terms is zero (0x, or 0 on its own), so it isn’t really there. Take it out and type what’s left.',
  blInvisibleOne: () => 'Look at an x with no number in front. It has an invisible 1: x is 1x. Write the 1 next to it, then count all the x’s again.',
  // Why the walk opened.
  blWrong: () => 'Not quite. Let’s go step by step.',
  blStuck: () => 'No problem. Let’s go step by step.',
  blTeach: () => 'Here’s the step-by-step way.',
  typeAnswer: () => 'Type your answer with the pad, then Check.',
  answerUnreadable: () => 'I can’t read that. Type terms like 2x + 3, with x, + and −.',
};

export function boxLightFeedbackText(fb) {
  if (!fb) return '';
  if (fb.src === 'ts') {
    const base = termFeedbackText(fb);
    return fb.lead ? `${BL[fb.lead]()} ${base}` : base;
  }
  const f = BL[fb.key];
  return f ? f(fb.params ?? {}) : termFeedbackText(fb);          // hints are the walk's
}
