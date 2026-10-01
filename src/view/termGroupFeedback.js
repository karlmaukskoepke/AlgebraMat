// Every Groups of Terms message in one table. The group-making and + or − messages are
// Group It's (the keys come from engine/termGroupMoves.js, which reuses Group It's checks);
// the Fill messages are this pack's. Keys not listed here fall back to Group It's table.

import { LASSO_FEEDBACK } from './lassoFeedback.js';

const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
const nth = (i) => ORDINAL[i] ?? `number ${i + 1}`;
const kindWord = (kind) => (kind === 'box' ? 'boxes' : 'counters');

export const TERM_GROUP_FEEDBACK = {
  // ② + or −: what to do next is a piece, not a counter
  plusGroups: ({ fraction }) => (fraction
    ? 'Plus! Pick a piece, then tap the lit-up group to deal the first one.'
    : 'Plus groups! Pick a piece, then tap the first group to add it. Copy to all repeats it.'),
  oppositeGroups: ({ fraction }) => (fraction
    ? 'Opposite! The bar gets a −. Pick a piece, then tap the lit-up group to deal the first one.'
    : 'Opposite groups: each gets a −. Pick a piece, then tap the first group to add it. Copy to all repeats it.'),

  // ③ Fill, whole-number groups
  pickPieceFirst: () => 'Pick a piece first: box, − box, + or −.',
  fillIntro: () => 'Keep adding pieces to the first group, then Copy to all. Tap any group to add to just that one.',
  copyNeedsFirst: () => 'Build the first group first, then Copy to all.',
  copied: () => 'Copied! Look over every group, then Check.',
  groupFull: () => 'That’s more than it needs. Undo takes one back.',
  groupOk: () => 'That’s one group.',
  emptyGroup: ({ index, text, need }) => `The ${nth(index)} group is empty. Each group is (${text}): ${need}.`,
  groupOff: ({ index, text, need }) => `The ${nth(index)} group isn’t (${text}) yet. Each group needs ${need}.`,
  fillDone: () => 'Groups filled! The next build adds the answer.',
  fillDoneOpp: () => 'Groups filled! They’re opposite groups. The next build adds the flip and the answer.',

  // ③ Fill, fraction bar: one kind of piece at a time
  dealIntro: () => 'Keep going: deal one piece at a time into the lit-up group. Finish the boxes before the counters, or the other way round.',
  dealHere: () => 'Deal in order: the next piece goes in the lit-up group.',
  finishKind: ({ kind }) => `Finish dealing the ${kindWord(kind)} first, then the other kind.`,
  dealOff: ({ text, need }) => `Deal out all of (${text}): ${need}, one kind at a time.`,
  dealUneven: () => 'The groups should be equal. Undo, and deal one piece at a time into the lit-up group.',
  dealDone: ({ n }) => `Equal groups! The next build adds taking ${n}, flipping and the answer.`,
};

export function termGroupFeedbackText(fb) {
  const f = fb && (TERM_GROUP_FEEDBACK[fb.key] ?? LASSO_FEEDBACK[fb.key]);
  return f ? f(fb.params ?? {}) : '';
}
