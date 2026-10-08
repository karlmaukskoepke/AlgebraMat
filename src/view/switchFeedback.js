// Messages for the Switch sides card. Anything not here (dividing every term, say) is said as in One-step and Two-step.

import { solveFeedbackText } from './solveFeedback.js';

const NOT = 'Put your answer in for x: the two sides don’t balance.';
const AFTER = ({ rec, two }) => `After switching sides: ${rec}. Add up the other side${two ? ', then share it among the boxes' : ''}.`;

const W = {
  wIntro: ({ con }) => `Switch sides: drag the ${con} across the border (or tap it). When a counter crosses, it switches teams.`,
  wFirst: ({ con }) => `Switch sides first: drag the ${con} across the border, or tap it.`,
  wMoved: ({ con, flipped, two }) => `The ${con} crossed the border and switched teams: it is ${flipped} now. Add up the other side${two ? ', share it among the boxes,' : ''} and type x.`,
  wMovedForYou: ({ con, flipped, two }) => `I moved it for you: the ${con} crossed the border and switched teams, so it is ${flipped} now. Add up the other side${two ? ', share it among the boxes,' : ''} and type x.`,
  // slips: the number crossed but did not switch teams (x + 4 = −2 → −2 + 4)
  sTag_wrong_op: ({ con, flipped, rec }) => `${NOT} The ${con} crossed the border, but it didn’t switch teams: it should be ${flipped}. ${rec}. Try again.`,
  tTag_constant_wrong_way: ({ con, flipped, rec }) => `${NOT} The ${con} crossed the border, but it didn’t switch teams: it should be ${flipped}. ${rec}. Try again.`,
  sTag_untouched: (p) => `${NOT} That is what was already on the other side: the counter that crossed changes it. ${AFTER(p)} Try again.`,
  tTag_untouched: (p) => `${NOT} That is what was already on the other side: the counter that crossed changes it. ${AFTER(p)} Try again.`,
  sTag_flipped: (p) => `${NOT} You have the numbers the wrong way round. ${AFTER(p)} Try again.`,
  tTag_sign_flipped: (p) => `${NOT} You have the opposite of x. Check the signs. ${AFTER(p)} Try again.`,
  sTag_other_op: (p) => `${NOT} ${AFTER(p)} Try again.`,
  sTag_unmatched: (p) => `${NOT} ${AFTER(p)} Try again.`,
  tTag_stopped_early: ({ rec, a }) => `${NOT} You switched sides, but x is still multiplied by ${a}: ${rec}. Share what is on the other side among the ${a} boxes. Try again.`,
  tTag_skipped_constant: (p) => `${NOT} You shared it among the boxes, but the number that crossed changes the other side first. ${AFTER(p)} Try again.`,
  tTag_unmatched: (p) => `${NOT} ${AFTER(p)} Try again.`,
  sCheck: (p) => `Here is your last answer put back in for x. ${AFTER(p)} Try again.`,
  tCheck: (p) => `Here is your last answer put back in for x. ${AFTER(p)} Try again.`,
  sModel: ({ flipped }) => `The ${flipped} that crossed meets its opposite on the other side, and the pairs cancel. Count what is left and type x.`,
  sModelWrong: ({ flipped }) => `Not yet. The ${flipped} that crossed meets its opposite on the other side, and the pairs cancel. Count what is left and type x.`,
  tModel: ({ flipped }) => `The ${flipped} that crossed meets its opposite on the other side, and the pairs cancel. What is left is shared among the boxes: type x.`,
  tModelWrong: ({ flipped }) => `Not yet. The ${flipped} that crossed meets its opposite on the other side, and the pairs cancel. What is left is shared among the boxes: type x.`,
  sWork: () => 'The pairs are cancelled and here is what is left: one box and its counters. Type x and Check.',
  tWork: () => 'The pairs are cancelled, what is left is shared among the boxes, and one box has its counters. Type x and Check.',
  sTeach: ({ con, flipped, rec }) => `Step by step: the ${con} crosses the border and switches teams, ${flipped}: ${rec}. The pairs cancel, and what is left is x. Type it and Check.`,
  tTeach: ({ con, flipped, rec }) => `Step by step: the ${con} crosses the border and switches teams, ${flipped}: ${rec}. The pairs cancel, the rest is shared among the boxes, and one box is x. Type it and Check.`,
};
W.wTeach = (p) => (p.two ? W.tTeach(p) : W.sTeach(p));

export function switchFeedbackText(fb) {
  const f = fb && W[fb.key];
  return f ? f(fb.params ?? {}) : solveFeedbackText(fb);
}
