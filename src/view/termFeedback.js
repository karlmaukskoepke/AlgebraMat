// Every Boxes & Circles message in one table (like view/feedback.js for Flip It).
// Keys come from engine/termMoves.js and engine/termSession.js.

export const TERM_FEEDBACK = {
  // ⓪ Rewrite
  rewriteIntro: () => 'Subtracting a negative? Flip both signs: tap the − in front and the − inside the parentheses. Or tap “Nothing to rewrite.”',
  flipBoth: () => 'Flip both signs: the operation in front and the sign inside the parentheses.',
  notNegative: () => 'Only a − (−…) term needs flipping. Tap one of those.',
  somethingToRewrite: () => 'Look again: one term subtracts a negative. Flip both of its signs.',
  rewriteDone: () => 'Rewritten! Now box the x terms and circle the numbers, signs and all.',
  nothingToRewriteOk: () => 'Right, nothing to rewrite. Now box the x terms and circle the numbers.',

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
  boxCircleDone: () => 'Boxed and circled, signs and all! Now draw each term above it: pick a piece, then tap above the term.',

  // ② Draw
  drawIntro: () => 'Pick a piece — box, − box, + or − — then tap above a term to add one. Tap a piece to take it away.',
  pickPieceFirst: () => 'Pick a piece first: box, − box, + or −.',
  columnFull: () => 'That’s more than any term needs. Tap a piece to take it away, or Undo.',
  drawBoxes: () => 'This term has an x: draw boxes above it.',
  drawCounters: () => 'This one is a number: use + and − counters, not boxes.',
  needPieces: ({ text, phrase }) => `This term is ${text}, so it needs ${phrase}.`,
  countAgain: ({ text, have, count }) => `Count again — you have ${have}, and ${text} needs ${count}.`,
  drawDone: () => 'Everything’s drawn! Now cancel pairs: tap a piece, then its opposite. Boxes or numbers first — your choice.',
  drawDoneNoCancel: () => 'Everything’s drawn, and nothing cancels! Now type what you have, like 2x + 2.',

  // ③ Cancel
  cancelIntro: () => 'Cancel pairs: tap a piece, then its opposite. A box pairs with a − box, and + pairs with −.',
  cancelPick: () => 'Now tap its opposite.',
  cancelPaired: () => 'Canceled! Keep going.',
  alreadyCanceled: () => 'That one’s already canceled.',
  notLikeTerms: () => 'A box and a number aren’t like terms — they don’t cancel.',
  pairIsPlusMinus: () => 'A pair is one + and one −. Tap an opposite.',
  cancelDone: () => 'All the pairs are canceled! Now type what’s left, like 2x + 2.',

  // ④ Answer
  typeAnswer: () => 'Type your answer first, like 2x + 2.',
  answerUnreadable: () => 'Type it like 2x + 2: numbers, x, + and −.',
  combineAll: () => 'Combine all the x terms into one, and all the numbers into one.',
  noZeroTerm: () => 'Leave out a part that’s 0.',
  checkBoxes: () => 'Look at the boxes that are left: what sign, and how many?',
  checkNumbers: () => 'Look at the numbers that are left: what sign, and how many?',
  correct: ({ answer }) => `Yes! The answer is ${answer}.`,
};

export function termFeedbackText(fb) {
  const f = fb && TERM_FEEDBACK[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
