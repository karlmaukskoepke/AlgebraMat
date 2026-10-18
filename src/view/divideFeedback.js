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
  dPickFraction: () => 'Pick a fraction of both sides. Which one leaves one box?',
  dUndone: () => 'Undone. Pick a different fraction.',
  dForced: (p) => `For this one, take ${p.frac} of both sides.`,
  dFail: (p) => {
    if (!p.boxesSplit && !p.countersSplit) return `${p.boxes} boxes can't make ${p.n} equal groups, and ${p.b} can't be shared into ${p.n} equal groups (${p.left} left over). Press Undo and try another fraction.`;
    if (!p.boxesSplit) return `${p.boxes} boxes can't make ${p.n} equal groups. Press Undo and try another fraction.`;
    return `${p.b} can't be shared into ${p.n} equal groups (${p.left} left over). Press Undo and try another fraction.`;
  },
  dFail3: (p) => `${p.frac} doesn't split evenly. Press Undo and try another fraction. Try I’m stuck.`,
  // I'm stuck at a state with x not alone: the counters (the number in front outlined), then choosing and dealing, then guided
  dModel: (p) => `${p.boxes} boxes and ${p.size} counters. What fraction of both sides leaves one box? Choose it, share the counters, and keep one group.`,
  dStuck2: () => 'Choose a fraction of both sides: the boxes and the counters split into that many groups. Then share out every counter and keep one group.',
  dDealPrompt: (p) => `${p.boxes} boxes make ${p.n} groups of ${p.per}. Now share the ${p.size} counters into ${p.n} equal groups: tap a group to give it one counter.`,
  dDealt: (p) => (p.holds ? `${p.got} of ${p.total} shared. Groups hold ${p.holds}.` : `${p.got} of ${p.total} shared.`),
  dAllShared: () => 'All the counters are shared already. Tap a group to keep it, or Undo.',
  dNoRound: (p) => `Not enough counters left for a whole round of ${p.n}. Tap groups one at a time.`,
  dKeepReady: (p) => `Shared evenly. Tap one group to keep it: that is ${p.frac} of it.`,
  dShareFirst: (p) => `Share all the counters first: ${p.left} still in the pile.`,
  dUneven: (p) => `Groups hold ${p.holds}. They must hold the same number before you keep one.`,
  dStuckGuided: (p) => `${p.boxes} boxes: take ${p.frac} of both sides to leave one box. Tap ${p.frac}, then share out the counters and keep one group.`,
  dTeach: (p) => `Step by step: ${p.boxes} boxes, so take ${p.frac} of both sides. Tap ${p.frac}.`,
  // I'm stuck at x alone with an unevaluated side (x = ⅓(6)): the diagram of the right side, on every rung
  dDiag1: (p) => `What is ${p.frac} of ${p.val}? Share the counters into ${p.n} equal groups: tap a group to give it a counter.`,
  dDiag2: (p) => `Share the ${p.size} counters into ${p.n} equal groups: tap a group to give it a counter. Then keep 1 of the ${p.n} groups.`,
  dDiag3: (p) => `The counters are already in ${p.n} equal groups, with 1 of the ${p.n} kept. Count it, and type what x is.`,
  dDiagKept: (p) => `You kept 1 of the groups: that is ${p.frac} of it. Count what is in it, and type x.`,
  dWrong: (p) => (SLIP[p.tag] ?? SLIP.unmatched)(p),
};

export function divideFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : addBothFeedbackText(fb);
}
