// Every Boxes & Circles message in one table (like view/feedback.js for Flip It).
// Keys come from engine/termMoves.js and engine/termSession.js.

export const TERM_FEEDBACK = {
  // ① Box & Circle
  boxCircleIntro: () => 'Box the x terms and circle the numbers. Drag across a term, and take the sign in front with it!',
  boxToolOn: () => 'Box it: drag across an x term, from the sign in front to the end.',
  circleToolOn: () => 'Circle it: drag across a number, from the sign in front to the end.',
  pickToolFirst: () => 'Pick Box or Circle first.',
  includeSign: ({ op }) => `Take the sign in front with it: drag from the ${op} across the number.`,
  includeNumber: ({ op }) => `Take the number too: the ${op} belongs with it.`,
  twoTerms: () => 'One term at a time — this shape has two.',
  boxIt: () => 'That one has an x: box it.',
  circleIt: () => 'That’s just a number: no x. Circle it.',
  boxMissing: () => 'An x term is still not boxed.',
  circleMissing: () => 'A number is still not circled.',
  boxCircleDone: () => 'Boxed and circled, signs and all! Next is Draw, coming in the next build.',
};

export function termFeedbackText(fb) {
  const f = fb && TERM_FEEDBACK[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
