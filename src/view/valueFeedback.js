// Messages for Value it's light mode.

const FIRST = 'Replace each x with its value, in parentheses.';

const V = {
  vIntro: () => 'Put the value in for x, work it out, and type the answer. Then Check.',
  vCorrect: ({ answer }) => `Yes! The answer is ${answer}.`,
  vSubstitute: () => `${FIRST} A number next to parentheses means multiply. Work it out, then try again.`,
  vTag_no_parens: () => 'Without parentheses it looks like one number, or a plus. The value goes in parentheses: 2x means 2 times x, so 2(4) is 2 × 4. Try again.',
  vTag_added: () => '2x means 2 times x, not 2 plus x. The value goes in parentheses, and the number next to it multiplies. Try again.',
  vTag_neg_neg: () => 'Look at the signs: a negative times a negative is positive. Careful with each parenthesis, then try again.',
  vTag_sign_lost: () => 'The value of x is negative: keep its sign when you put it in the parentheses. Try again.',
  vTag_sign_flipped: () => 'You have the opposite of the answer. Check each sign as you put the value in the parentheses, then try again.',
  vTag_unmatched: () => `${FIRST} A number next to parentheses means multiply. Work it out, then try again.`,
  vModel: () => 'Here is each term as boxes. Every box holds the value of x as counters. Count what each term makes, then add them up.',
  vModelWrong: () => 'Not yet. Here is each term as boxes. Every box holds the value of x as counters. Count what each term makes, then add them up.',
  vTag_top_only: () => 'You used only the top number. The bottom number says how many equal parts to split the value into; the top number says how many of those parts to take. Try again.',
  vTag_bottom_only: () => 'You used only the bottom number. The top number says how many of the equal parts to take. Try again.',
  vTag_upside_down: () => 'Check which number is on top. The bottom number splits the value into equal parts, and the top number counts how many parts you take. Try again.',
  vModelFrac: () => 'The box holds the value of x as counters, split into equal parts: the bottom number is how many parts, the top number is how many parts you take (solid). Count those, then add up the terms.',
  vModelWrongFrac: () => 'Not yet. The box holds the value of x as counters, split into equal parts: the bottom number is how many parts, the top number is how many parts you take (solid). Count those, then add up the terms.',
  vWork: () => 'Each term is worked out. Add them up and type the answer.',
  vTeach: () => 'Step by step: each box holds the value of x as counters. Here is what each term makes. Add them up and type the answer.',
  typeAnswer: () => 'Type your answer with the pad, then Check.',
  answerUnreadable: () => 'I can’t read that. Type a whole number, with − if it’s negative.',
};

export function valueFeedbackText(fb) {
  const f = fb && V[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
