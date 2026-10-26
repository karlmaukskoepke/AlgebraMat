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

const sg = (v) => (v < 0 ? `−${-v}` : `${v}`);
const WORDS = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };

const M = {
  dWhichFraction: (p) => `We want only one of the ${WORDS[p.boxes] ?? p.boxes} x boxes.\n${p.div ? 'What should we divide both sides by?' : 'What fraction of these boxes should we find?'}`,
  // the Multiply options (Build D-2, Part 4)
  dUnitFraction: () => 'Enter a unit fraction, like ⅕ or ½.',
  dWholeNo: (p) => `${sg(p.n)}(${p.a}x) makes ${sg(p.made)}x: still not one x. Try dividing both sides.`,
  dZeroNo: () => 'Times 0 makes both sides 0, and x is gone. Try dividing both sides.',
  dFlipNo: (p) => `−1(${p.a}x) makes −${p.a}x: the sign changes, but there are still ${p.a} x’s. Try dividing both sides.`,
  // the Divide option (Build L): one digit, a minus allowed
  dDivOneDigit: () => 'Enter a one-digit number to divide by.',
  dDivZero: () => 'You can’t divide by 0. Pick a number to divide both sides by.',
  dDivBad: (p) => (p.typed < 0 && !p.neg ? 'Divide by a positive number here: 2, 3, 4, 5 or 6.' : p.neg ? 'Divide both sides by 2, 3, 4, 5 or 6, or by −2 to −6.' : 'Divide both sides by 2, 3, 4, 5 or 6.'),
  dBlankBad: () => 'Type a fraction of both sides: 1 over 2, 3, 4, 5 or 6 (like 1/5).',
  dPickFraction: () => 'Pick a fraction of both sides. Which one leaves one box?',
  dReminder: (p) => `To get one x, divide both sides by ${p.boxes} (that is, multiply by ${p.frac}): one of the ${p.boxes} x boxes is ${p.frac}.`,
  dUndone: () => 'Undone. Pick a different fraction.',
  dForced: (p) => `For this one, take ${p.frac} of both sides.`,
  dFail: (p) => {
    const again = p.div ? 'Press Undo and try another number to divide by.' : 'Press Undo and try another fraction.';   // (Build T: as drawn)
    if (!p.boxesSplit && !p.countersSplit) return `${p.boxes} boxes can't make ${p.n} equal groups, and ${p.b} can't be shared into ${p.n} equal groups (${p.left} left over). ${again}`;
    if (!p.boxesSplit) return `${p.boxes} boxes can't make ${p.n} equal groups. ${again}`;
    return `${p.b} can't be shared into ${p.n} equal groups (${p.left} left over). ${again}`;
  },
  dFail3: (p) => (p.div ? `Dividing by ${p.n} doesn't come out even. Press Undo and try another number. Try I’m stuck.` : `${p.frac} doesn't split evenly. Press Undo and try another fraction. Try I’m stuck.`),
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
  dDiag1: (p) => `What is ${p.what ?? `${p.frac} of ${p.val}`}? Share the counters into ${p.n} equal groups: tap a group to give it a counter.`,
  dDiag2: (p) => `Share the ${p.size} counters into ${p.n} equal groups: tap a group to give it a counter. Then keep 1 of the ${p.n} groups.`,
  dDiag3: (p) => `The counters are already in ${p.n} equal groups, with 1 of the ${p.n} kept. Count it, and type what x is.`,
  dDiagKept: (p) => `You kept 1 of the groups: that is ${p.what ?? `${p.frac} of it`}. Count what is in it, and type x.`,
  // a value that does not balance (Build D, Part 2): what the check showed; the slip's own words are kept for the class's notes
  dWrong: (p) => `When x = ${p.typed}, the equation is not balanced.`,
  dSlip: (p) => (SLIP[p.tag] ?? SLIP.unmatched)(p),
};

export function divideFeedbackText(fb) {
  const f = fb && M[fb.key];
  return f ? f(fb.params ?? {}) : addBothFeedbackText(fb);
}
