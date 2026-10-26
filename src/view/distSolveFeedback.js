// What Distribute, combine, solve says (Build M), always with the real numbers. Keys it does not define fall through to the Two-step
// card's words (the Add move, combining, the check, the fraction and the flip), and through them to Add to both sides' term layer.

import { twoStepFeedbackText } from './twoStepFeedback.js';

// (a wrong product's second sentence, by what it looked like)
const PRODUCT_TIP = {
  'dist-sign-lost': ' Look at the signs.', 'dist-unmultiplied': ' Multiply this piece too.', 'dist-one-lost': ' The minus is −1: multiply this piece by −1 too.',
  'dist-frac-top': ' Divide by the bottom number too.', 'dist-frac-bottom': ' Multiply by the top number too.',
};
const M = {
  // the reminder at a parenthesis: the factor and the parenthesis lit (with the ghost hand)
  mDistributeHint: (p) => `Drag the ${p.factor} onto the parenthesis to multiply it by each piece.`,
  mTapMinusHint: (p) => `Tap the minus first, so ${p.factor} is a negative number. Then drag ${p.factor} onto the parenthesis to multiply it by each piece.`,
  // the reminder at terms not yet put together: the two like terms lit
  mCombineHint: (p) => `${p.g1} and ${p.g2} are like terms. Drag one onto the other to combine them.`,
  mWorkOut: () => 'x is alone. Work out the other side, then type what x is.',
  // the distribute move's own words
  dxProductsRetry: (p) => `Try again: type what ${p.labels} make, one in each box. Enter goes to the next.`,
  dxProducts: () => 'Multiply each piece in the parentheses. Type each product with its sign; Enter goes to the next.',
  dxTapMinusFirst: (p) => `Tap the minus first, so ${p.factor} is a negative number.`,
  dxNegFactor: (p) => `Subtracting is adding a negative: the factor is ${p.neg}. Now drag ${p.neg} onto the parenthesis.`,
  dxProductWrong: (p) => `${p.product} is not ${p.typed}.${PRODUCT_TIP[p.tag] ?? ''} Press Undo and try again.`,
  // the invisible 1 and a fraction factor (Build U, Distribute more)
  mTapOneHint: () => 'Tap the minus first: it means −1 times everything inside.',
  mFracHint: (p) => `Drag the ${p.factor} onto the parenthesis. Each piece is ${p.factor} of that term.`,
  dxTapMinusOne: () => 'Tap the minus first: it means −1 times everything inside.',
  dxOneShown: () => 'The minus means −1 times everything inside. Now drag the −1 onto the parenthesis.',
  dxOneHidden: () => 'Back to a minus with no number: it still means −1 times everything inside.',
  dxTypeOne: () => 'Type every piece, including the 1.',
  dxDistributed: () => 'Distributed: every piece multiplied.',
  dxTypeX: () => 'Type every piece, including the x.',
  dxXBoxes: (p) => `${p.typed} of what?`,
  wOneTerm: () => 'That move works once each side is one term.',
};

export function distSolveFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : twoStepFeedbackText(fb);
}
