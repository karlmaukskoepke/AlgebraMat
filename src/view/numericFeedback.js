// What the numeric level (Level 1 of Add to both sides) says on the line.

const M = {
  nlStart: (p) => `Numbers only: this equation is balanced. Choose “Add ___ to both sides” and add a ${p.amount > 0 ? 'positive' : 'negative'} number to both sides.`,
  nlSuggest: (p) => `Try adding ${p.amount}: it is already in the blank. Add it to the left side, then to the right.`,
  nlQuiz: () => 'Quick question. Read it below, then pick an answer.',
  nlZero: () => 'Add a number that isn’t 0.',
  nlBig: () => 'Try a smaller number.',
  nlSign: (p) => `This time, add a ${p.word} number.`,
  nlOtherSide: () => 'You added to this side already. Now add the same to the other side.',
  nlAddedOne: (p) => `${p.amount} on the ${p.side}: ${p.readout}. One side got more than the other.`,
  nlBalanced: (p) => `${p.amount} on both sides: ${p.readout}. Press Go.`,
  nlUnbalanced: (p) => `Not the same amount: ${p.readout}. Both sides must hold the same amount.`,
  nlGoNotYet: () => 'Go works when both sides got the same amount.',
  nlDone: (p) => `${p.amount} on both sides kept the balance: ${p.readout}`,
  nlUndone: () => 'Undone.',
  nlLater: () => 'That move unlocks on a later card.',
  nlQuizRight: (p) => `Yes! It ${p.correct === 'keeps' ? 'keeps' : 'upsets'} the balance.`,
  wtA: () => 'We don’t know x yet, but the = sign tells us both sides are balanced. Tap “Add ___ to both sides”.',
  wtB: () => 'To cancel the +3 we add its opposite, −3, to both sides. It is in the blank. Press Go.',
  wtC: () => 'The −3 is now on both sides. Press Next.',
  wtD: () => 'The +3 and −3 cancel. Press Next.',
  wtE: () => 'Now we have x = 2. Press Next.',
  wtF: () => '2 is the amount that makes it balance. Press Next.',
  wtG: () => 'Adding to both sides can make the problem simpler. Press Next to go on.',
  wtEnd: () => 'Adding to both sides can make the problem simpler.',
  nlQuizWrong: () => 'Not quite. Compare the before and after, then try again.',
};

export function numericFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
