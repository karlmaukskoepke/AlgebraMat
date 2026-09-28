// Every Lasso message in one table (like view/feedback.js for Flip It).
// Keys come from engine/lassoMoves.js and engine/lassoSession.js.

import { MINUS } from '../engine/expr.js';

const signed = (n) => (n < 0 ? `${MINUS}${-n}` : `${n}`);
const kind = (sign, count) => `${count} ${sign === '+' ? 'positive' : 'negative'}${count === 1 ? '' : 's'}`;
const lassos = (n) => `${n} lasso${n === 1 ? '' : 's'}`;

export const LASSO_FEEDBACK = {
  // ① Groups
  groupsIntroHidden: () => 'There’s 1 hidden group — tap the gap before the ( to write the 1.',
  groupsIntro: () => 'Draw one lasso for each group: tap Add lasso, then Check.',
  writeOne: () => 'There’s 1 hidden group — write the 1.',
  writeOneFirst: () => 'Write the hidden 1 first — tap the gap before the (.',
  tooManyLassos: () => 'That’s more lassos than any problem needs. Tap one to erase it.',
  groupCount: ({ n, have }) => `The number of groups is ${n} — you have ${lassos(have)}.`,
  groupsDone: () => 'Are these + groups, or − groups (the opposite)?',

  // ② + or −
  lookAtSign: () => 'Look at the sign in front of the groups.',
  plusGroups: () => 'Plus groups! Pick + or −, then tap the first lasso to fill it.',
  oppositeGroups: () => 'Opposite groups — each lasso gets a −. Pick + or −, then tap the first lasso to fill it.',

  // ③ Fill
  pickSignFirst: () => 'Pick + or − first.',
  fillIntro: () => 'Tap the first lasso to add a counter. When it’s one group, tap each other lasso to copy it.',
  lassoFull: () => 'That’s more than one group needs. Undo takes one back.',
  fixFirstGroup: ({ b, count, sign }) => `Fill the first lasso first: a group of ${signed(b)} is ${kind(sign, count)}.`,
  groupOk: () => 'That’s one group.',
  copied: () => 'Copied! Tap the next empty lasso, then Check.',
  needGroupType: ({ b, count, sign }) => `Each group is ${signed(b)}, so each lasso needs ${kind(sign, count)}.`,
  groupCountAgain: ({ b, have }) => `This lasso has ${have} — each group is ${signed(b)}.`,
  copyEachGroup: ({ b }) => `Tap each empty lasso to fill it with a group of ${signed(b)}.`,
  fillDone: () => 'Groups filled! Count every counter in every lasso and type the total.',

  // ④ Count and ⑤ Opposite
  countAll: () => 'Count all the counters in all the lassos.',
  countDoneOpp: ({ total }) => `That’s ${signed(total)} in the groups. They’re opposite groups — tap opp. to flip every counter.`,
  tapOppFirst: () => 'Tap opp. first to flip every counter.',
  oppDone: ({ total }) => `Flipped! Now type the opposite of ${signed(total)}.`,
  oppositeOf: ({ total }) => `The opposite of ${signed(total)} is…?`,

  typeAnswer: () => 'Type a number first.',
  correct: ({ answer }) => `Yes! The answer is ${signed(answer)}.`,
};

export function lassoFeedbackText(fb) {
  const f = fb && LASSO_FEEDBACK[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
