// Seeded problem sets for Divide it (SPEC-DIVIDE-IT.md §2): five levels shown (a sixth is reserved in the save code), five
// problems each, no repeated answers or equations, whole-number answers (never 0 or ±1), negative and positive answers in the
// mix. A problem whose answer equals a is dropped: the slip "gave the number of boxes" would then be the right answer
// (BUILD-NOTES §2.1). Every problem is verified by substitution when it is made (makeDivide).

import { mulberry32, pickSet } from './generate.js';
import { makeDivide } from './divide.js';

export const DIVIDE_LEVEL_COUNT = 5;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// Every problem with a from `as`, |x| from 2 up to `maxX` (and b at most `maxB` in size), x ≠ a.
function candidates({ as, maxX, maxB }) {
  const out = [];
  for (const a of as) {
    for (const m of range(2, maxX)) {
      if (m === a || a * m > maxB) continue;
      for (const x of [m, -m]) out.push(makeDivide(a, x));
    }
  }
  return out;
}
const neg = (p) => p.x < 0;
const pos = (p) => p.x > 0;
const any = (count = 1) => ({ test: () => true, count });
const g = (test, count = 1) => ({ test, count });

export const DIVIDE_LEVELS = {
  // L1: a = 2 or 3, answers 2–5 (at most 15 counters). Two of each coefficient, two negative and two positive answers.
  1: {
    candidates: () => candidates({ as: [2, 3], maxX: 5, maxB: 15 }),
    groups: [g((p) => p.a === 2 && neg(p)), g((p) => p.a === 2 && pos(p)), g((p) => p.a === 3 && neg(p)), g((p) => p.a === 3 && pos(p)), any()],
  },
  // L2: a = 2–5, answers 2–6 (at most 30 counters). One of each a, two negative and two positive answers.
  2: {
    candidates: () => candidates({ as: [2, 3, 4, 5], maxX: 6, maxB: 30 }),
    groups: [g((p) => p.a === 2 && neg(p)), g((p) => p.a === 3 && pos(p)), g((p) => p.a === 4 && neg(p)), g((p) => p.a === 5 && pos(p)), any()],
  },
  // L3: a = 2–5, up to 36 counters, two negative and two positive answers.
  3: {
    candidates: () => candidates({ as: [2, 3, 4, 5], maxX: 18, maxB: 36 }),
    groups: [g(neg, 2), g(pos, 2), any()],
  },
  // L4: a = 4 or 6 (composite: several fractions are legal), up to 36 counters. Two of each, two negative and two positive.
  4: {
    candidates: () => candidates({ as: [4, 6], maxX: 9, maxB: 36 }),
    groups: [g((p) => p.a === 4 && neg(p)), g((p) => p.a === 4 && pos(p)), g((p) => p.a === 6 && neg(p)), g((p) => p.a === 6 && pos(p)), any()],
  },
  // L5: a = 2–6 mixed, up to 36 counters, two negative and two positive, at least three different coefficients.
  5: {
    candidates: () => candidates({ as: [2, 3, 4, 5, 6], maxX: 18, maxB: 36 }),
    groups: [g((p) => p.a === 5 && neg(p)), g((p) => p.a === 3 && pos(p)), g((p) => (p.a === 4 || p.a === 6) && neg(p)), g(pos), any()],
  },
};

export function generateDivideLevel(level, seed) {
  const spec = DIVIDE_LEVELS[level];
  if (!spec) throw new Error(`Unknown Divide it level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level + 211, 0x9e3779b1)) >>> 0);
  return pickSet({ candidates: spec.candidates(), groups: spec.groups, answerOf: (p) => p.x, rng, label: `Divide it level ${level}` });
}
