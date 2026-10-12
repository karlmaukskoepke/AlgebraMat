// What Divide it says on the line (SPEC-DIVIDE-IT.md §5, in the light-build voice). Keys it does not define fall through to Add to
// both sides' (the choice, plugging back in, "Yes!", and so on).

import { addBothFeedbackText } from './addBothFeedback.js';

const SLIP = {
  'undid-add': (p) => `${p.a}x means ${p.a} boxes, not ${p.a} more. Share the ${p.b} among the ${p.a} boxes.`,
  multiplied: (p) => `${p.a} boxes with ${p.b} in each would be ${p.typed}. We want what is in one box.`,
  'gave-boxes': (p) => `${p.a} is how many boxes. How many ${p.word} are in each one?`,
  'ignored-front': (p) => `Put ${p.typed} back in: ${p.a} boxes of ${p.typed} is ${p.product}, not ${p.b}.`,
  'wrong-team': (p) => `Right size, wrong team. ${p.a} boxes of ${p.typed} is ${p.product}, not ${p.b}.`,
  'wrong-groups': (p) => `You shared into ${p.groups} groups, but there are ${p.a} boxes. One group per box.`,
  halfway: (p) => `${p.typed} is what is in each group of ${p.per} boxes. Keep going until it is one box.`,
  unmatched: (p) => `Put ${p.typed} back in: ${p.a} boxes of ${p.typed} is ${p.product}, not ${p.b}. Share the ${p.b} evenly among the ${p.a} boxes.`,
};

const M = {
  dMovePrompt: () => 'Choose “Take a fraction of both sides”.',
  dPickFraction: () => 'Pick a fraction of both sides. Which one leaves one box?',
  dPartial: (p) => `${p.frac} of both sides: ${p.boxes} boxes are left. Take another fraction, or type your guess for x.`,
  dUndone: () => 'Undone. Pick a different fraction.',
  dForced: (p) => `For this one, take ${p.frac} of both sides.`,
  dFail: (p) => {
    if (!p.boxesSplit && !p.countersSplit) return `${p.boxes} boxes can't make ${p.n} equal groups, and ${p.b} can't be shared into ${p.n} equal groups (${p.left} left over). Press Undo and try another fraction.`;
    if (!p.boxesSplit) return `${p.boxes} boxes can't make ${p.n} equal groups. Press Undo and try another fraction.`;
    return `${p.b} can't be shared into ${p.n} equal groups (${p.left} left over). Press Undo and try another fraction.`;
  },
  dFail3: (p) => `${p.frac} doesn't split evenly. Press Undo, or Start over, and try I’m stuck.`,
  dModel: (p) => `Here are the ${p.boxes} boxes and the ${p.size} counters. Take a fraction of both sides: the boxes and the counters split into that many groups.`,
  dDealPrompt: (p) => `${p.boxes} boxes make ${p.n} groups of ${p.per}. Now share the ${p.size} counters into ${p.n} equal groups: tap a group to give it one counter.`,
  dDealt: (p) => `${p.got} of ${p.total} shared. Groups hold ${p.holds}.`,
  dAllShared: () => 'All the counters are shared already. Tap a group to keep it, or Undo.',
  dNoRound: (p) => `Not enough counters left for a whole round of ${p.n}. Tap groups one at a time.`,
  dKeepReady: (p) => `Shared evenly: ${p.each} in each group. Tap one group to keep it: that is ${p.frac} of both sides.`,
  dShareFirst: (p) => `Share all the counters first: ${p.left} still in the pile.`,
  dUneven: (p) => `Groups hold ${p.holds}. They must hold the same number before you keep one.`,
  dStuckHint: (p) => `Look at the ${p.boxes} in front of x: ${p.boxes} boxes. What fraction of both sides leaves one box?`,
  dStuckGuided: (p) => `${p.boxes} boxes: take ${p.frac} of both sides to leave one box. Tap ${p.frac}.`,
  dTeach: (p) => `Step by step: ${p.boxes} boxes, so take ${p.frac} of both sides. Tap ${p.frac}.`,
  dWrong: (p) => (SLIP[p.tag] ?? SLIP.unmatched)(p),
};

export function divideFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : addBothFeedbackText(fb);
}
