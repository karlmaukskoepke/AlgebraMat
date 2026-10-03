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
  groupsIntroHidden: () => 'There’s a hidden 1 in front of the ( — write the number of groups in the gap the arrow points to (it’s 1), then Check.',
  groupsIntro: () => 'Make one group for each group in the problem: tap Add group, then Check.',
  partsIntro: ({ d }) => `The bottom number is ${d}: tap Add part of group to make ${d} equal parts in one bar, then Check.`,
  writeOne: () => 'Type the hidden 1 first, then Check.',
  writeOneFirst: () => 'Type the hidden 1 first — the arrow points to where it goes.',
  typeOne: () => 'Type the number 1 for the gap, then Check.',
  notOne: () => 'The hidden number in front of the ( is 1. Type the number 1 in the gap.',
  oneWritten: () => 'Yes, the hidden number is 1! Now make one group for each group in the problem: tap Add group, then Check.',
  tooManyGroups: () => 'That’s more groups than any problem needs. Tap one to erase it.',
  groupCount: ({ n, have }) => `The number of groups is ${n} — you have ${groups(have)}.`,
  partCount: ({ d, have }) => `The bottom number is ${d}, so make ${d} groups — you have ${have}.`,
  groupsDone: () => 'Are these positive groups, or opposite (negative) groups?',
  partsDone: () => 'Is this bar positive, or opposite (negative)?',

  // ② + or −
  lookAtSign: () => 'Not quite. Are these positive groups, or opposite (negative) groups? Look at the sign in front of the groups.',
  lookAtFractionSign: () => 'Not quite. Is this bar positive, or opposite (negative)? Look at the sign in front of the fraction.',
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
  dealEach: ({ b, d }) => `The whole group has a total value of ${signed(b)}. Share the ${Math.abs(b)} between the ${d} parts: don’t put ${Math.abs(b)} in each part.`,
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
  flipMore: () => 'Flipped — the new group is drawn on the right. Keep going: tap the next −.',
  flipDone: ({ fraction }) => (fraction
    ? 'Flipped! Now count the counters in the new groups on the right, and type the total.'
    : 'All flipped! Now count every counter in the new groups on the right, and type the total.'),

  // Count
  countAll: () => 'Count all the counters in all the groups.',
  countTaken: () => 'Count the counters in the groups you took.',

  // Hints (after 3 wrong tries on a step)
  hintWriteOne: () => 'The hidden number in front of the ( is 1. Type the number 1 for the blinking gap, then Check.',
  hintGroups: ({ n, have }) => (have > n
    ? `The number in front is ${n}. Tap the blinking groups to erase them.`
    : `The number in front is ${n}, so make ${n} group${n === 1 ? '' : 's'}: tap Add group until there are ${n}.`),
  hintParts: ({ n, have }) => (have > n
    ? `The bottom number is ${n}. Tap the blinking groups to erase them.`
    : `The bottom number is ${n}, so the bar needs ${n} parts: tap Add part of group until there are ${n}.`),
  hintSign: ({ sign, fraction }) => (sign === '-'
    ? `There’s a − in front of the ${fraction ? 'fraction' : 'groups'}: that means opposite. Tap − groups.`
    : `Nothing in front of the ${fraction ? 'fraction' : 'groups'} says opposite. Tap + groups.`),
  hintFill: ({ b, count, sign }) => `Each group is ${signed(b)}: pick the ${sign === '+' ? '+' : '−'} counter, then fill each blinking group until it has ${count}. Undo takes one back.`,
  hintDeal: ({ b, count, sign }) => `The whole group is ${signed(b)}: pick the ${sign === '+' ? '+' : '−'} counter and deal ${count} in all, one at a time into the lit-up group.`,
  hintTake: ({ n }) => `The top number is ${n}: take ${n} group${n === 1 ? '' : 's'} — like the blinking one${n === 1 ? '' : 's'}.`,
  hintCount: ({ sign }) => `Count every counter in the blinking groups. They’re all ${sign === '+' ? 'positive' : 'negative'}, so the answer is ${sign === '+' ? 'positive' : 'negative'}.`,
  hintCountTaken: ({ sign }) => `Count only the counters in the groups you took (they blink). They’re ${sign === '+' ? 'positive' : 'negative'}, so the answer is ${sign === '+' ? 'positive' : 'negative'}.`,

  countRemoved: () => 'That’s what’s left in the parts you didn’t take. Taking a part means keeping it: count only the counters in the part you took.',
  typeAnswer: () => 'Type a number first.',
  correct: ({ answer }) => `Yes! The answer is ${signed(answer)}.`,
};

export function lassoFeedbackText(fb) {
  const f = fb && LASSO_FEEDBACK[fb.key];
  return f ? f(fb.params ?? {}) : '';
}
