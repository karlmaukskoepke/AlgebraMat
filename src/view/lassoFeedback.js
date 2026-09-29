// Every Group It message in one table (like view/feedback.js for Flip It).
// Keys come from engine/lassoMoves.js and engine/lassoSession.js.

import { MINUS } from '../engine/expr.js';

const signed = (n) => (n < 0 ? `${MINUS}${-n}` : `${n}`);
const kind = (sign, count) => `${count} ${sign === '+' ? 'positive' : 'negative'}${count === 1 ? '' : 's'}`;
const groups = (n) => `${n} group${n === 1 ? '' : 's'}`;
const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
const nth = (i) => ORDINAL[i] ?? `number ${i + 1}`;

export const LASSO_FEEDBACK = {
  // ① Groups
  groupsIntroHidden: () => 'There’s 1 hidden group — tap the gap before the ( to write the 1.',
  groupsIntro: () => 'Make one group for each group in the problem: tap Add group, then Check.',
  partsIntro: ({ d }) => `The bottom number is ${d}: tap Add group to make ${d} equal groups in one bar, then Check.`,
  writeOne: () => 'There’s 1 hidden group — write the 1.',
  writeOneFirst: () => 'Write the hidden 1 first — tap the gap before the (.',
  tooManyGroups: () => 'That’s more groups than any problem needs. Tap one to erase it.',
  groupCount: ({ n, have }) => `The number of groups is ${n} — you have ${groups(have)}.`,
  partCount: ({ d, have }) => `The bottom number is ${d}, so make ${d} groups — you have ${have}.`,
  groupsDone: () => 'Are these + groups, or − groups (the opposite)?',
  partsDone: () => 'Is this bar + or − (the opposite)?',

  // ② + or −
  lookAtSign: () => 'Look at the sign in front of the groups.',
  lookAtFractionSign: () => 'Look at the sign in front of the fraction.',
  plusGroups: ({ fraction }) => (fraction
    ? 'Plus! Pick + or −, then tap the lit-up group to deal the first counter.'
    : 'Plus groups! Pick + or −, then tap any group to add a counter.'),
  oppositeGroups: ({ fraction }) => (fraction
    ? 'Opposite! The bar gets a −. Pick + or −, then tap the lit-up group to deal the first counter.'
    : 'Opposite groups — each group gets a −. Pick + or −, then tap any group to add a counter.'),

  // ③ Fill
  pickSignFirst: () => 'Pick + or − first.',
  fillIntro: () => 'Tap any group to add a counter. Fill every group, then Check.',
  groupFull: () => 'That’s more than it needs. Undo takes one back.',
  groupOk: () => 'That’s one group.',
  emptyGroup: ({ b, index }) => `The ${nth(index)} group is empty — every group is ${signed(b)}.`,
  needGroupType: ({ b, count, sign }) => `Each group is ${signed(b)}, so each group needs ${kind(sign, count)}.`,
  groupCountAgain: ({ b, have, index }) => `The ${nth(index)} group has ${have} — each group is ${signed(b)}.`,
  fillDone: () => 'Groups filled! Count every counter and type the total.',
  fillDoneOpp: () => 'Groups filled! They’re opposite groups — tap each − to flip its group, or tap Flip all.',

  // ③ Fill, fraction bar
  dealIntro: () => 'Keep going: tap the lit-up group. Deal one at a time, top to bottom, then around again.',
  dealHere: () => 'Deal in order — the next counter goes in the lit-up group.',
  dealType: ({ b, count, sign }) => `The whole group is ${signed(b)}, so deal ${kind(sign, count)}.`,
  dealCount: ({ b, have }) => `You dealt ${have} — the whole group is ${signed(b)}.`,
  dealDone: ({ n }) => `Equal groups! Now take ${n} — tap each group you take.`,

  // ④ Take
  takeIntro: ({ n }) => `Tap a group to take it (tap again to put it back). The top number says ${n}.`,
  takeN: () => 'The top number says how many groups to take.',
  takeDone: () => 'Now count the counters in the groups you took, and type the total.',
  takeDoneOpp: () => 'It’s the opposite — tap the − to flip the groups you took.',

  // Flip
  tapFlip: () => 'Tap each − to flip its group, or tap Flip all.',
  tapFlipBar: () => 'Tap the − to flip the groups you took.',
  flipMore: () => 'Flipped! Keep going — tap the next −.',
  flipDone: ({ fraction }) => (fraction
    ? 'Flipped! Now count the counters in the groups you took, and type the total.'
    : 'All flipped! Now count every counter and type the total.'),

  // Count
  countAll: () => 'Count all the counters in all the groups.',
  countTaken: () => 'Count the counters in the groups you took.',

  typeAnswer: () => 'Type a number first.',
  correct: ({ answer }) => `Yes! The answer is ${signed(answer)}.`,
};

export function lassoFeedbackText(fb) {
  const f = fb && LASSO_FEEDBACK[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
