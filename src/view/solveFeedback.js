// Messages for One-step equations' light mode. The form key says which equation: Plus (x + a), Minus (x − a),
// ax, Over (x/a).

const UNDO = {
  Plus: 'x has a number added to it, so take that number away from both sides.',
  Minus: 'x has a number taken away from it, so add that number to both sides.',
  ax: 'x is multiplied by a number, so divide both sides by that number: share the counters equally among the boxes.',
  Over: 'x is divided by a number, so multiply both sides by that number: take that many copies of each side.',
};
const NOT = 'Put your answer in for x: the two sides don’t balance.';

const S = {
  sIntro: () => 'Find x: type the number that makes both sides equal. Then Check.',
  sCorrect: ({ answer }) => `Yes! x = ${answer}, and it balances: both sides are the same.`,
  // a wrong answer, after putting it back into the equation
  sTag_wrong_op: ({ form }) => `${NOT} You did the same thing as the equation, which makes it bigger or smaller the wrong way. To get x alone, undo it: ${UNDO[form]} Try again.`,
  sTag_other_op: ({ form }) => `${NOT} That’s a different operation from the one in the equation. ${UNDO[form]} Try again.`,
  sTag_untouched: () => `${NOT} The right side isn’t x: something is still stuck to x on the left. Undo it on both sides, then try again.`,
  sTag_flipped: () => `${NOT} Careful with the order: take the smaller number from the larger. Try again.`,
  sTag_unmatched: ({ form }) => `${NOT} ${UNDO[form]} Try again.`,
  sCheck: ({ form }) => `Here is your last answer put back in for x. ${UNDO[form]} Try again.`,
  sModel: ({ form }) => `Here is the equation as a balance. The box is x: we don’t know how many counters it holds. ${UNDO[form]}`,
  sModelWrong: ({ form }) => `Not yet. Here is the equation as a balance. The box is x: we don’t know how many counters it holds. ${UNDO[form]}`,
  sWork: () => 'Here is the undo, done on both sides. What’s left is x. Type it and Check.',
  sTeach: ({ form }) => `Step by step: the box is x. ${UNDO[form]} What’s left is x. Type it and Check.`,
  typeAnswer: () => 'Type your answer with the pad, then Check.',
  answerUnreadable: () => 'I can’t read that. Type a whole number.',
};

export function solveFeedbackText(fb) {
  const f = fb && S[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
