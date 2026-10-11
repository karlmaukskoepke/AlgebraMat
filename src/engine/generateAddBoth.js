// Seeded problem sets for Add to both sides (SPEC-ADD-TO-BOTH-SIDES.md §2). Six levels, five problems each, no repeated
// answers or equations; negative answers are in on purpose (positive-only invites mental math that skips the opposite).
// Every problem is verified by substitution when it is made (makeAddBoth), and the sets are checked again in tests.
//
// L1 x + a = b (Party and Battle)   L2 x − a = b   L3 both forms mixed   L4 x on the right, some on the left
// L5 all four forms, bigger numbers   L6 the L5 forms with x on the left (the new move, Cross the border)

import { mulberry32, pickSet, PROBLEMS_PER_LEVEL } from './generate.js';
import { makeAddBoth, isBattle } from './addBoth.js';

export const ADD_BOTH_LEVEL_COUNT = 6;

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// All the problems of some forms, with a in [aLo, aHi] and b in [bLo, bHi] (b never 0, and x never 0).
function candidates({ forms, mirrors = [false], aLo, aHi, bLo, bHi }) {
  const out = [];
  for (const form of forms) {
    for (const mirror of mirrors) {
      for (const a of range(aLo, aHi)) {
        for (const b of range(bLo, bHi)) {
          if (b === 0) continue;
          const x = form === 'x+a' ? b - a : b + a;
          if (x === 0) continue;
          out.push(makeAddBoth(form, a, x, mirror));
        }
      }
    }
  }
  return out;
}

const neg = (p) => p.x < 0;
const pos = (p) => p.x > 0;
const any = (count) => ({ test: () => true, count });

export const ADD_BOTH_LEVELS = {
  // 1: x + a = b. Three Parties (b negative: negative answers) and two Battles (one with a positive answer).
  1: {
    candidates: () => candidates({ forms: ['x+a'], aLo: 1, aHi: 9, bLo: -9, bHi: 12 }),
    groups: [{ test: (p) => !isBattle(p), count: 3 }, { test: (p) => isBattle(p) && pos(p), count: 1 }, { test: isBattle, count: 1 }],
  },
  // 2: x − a = b. At least two Battles with b negative, at least one Party, answers of both signs.
  2: {
    candidates: () => candidates({ forms: ['x-a'], aLo: 2, aHi: 9, bLo: -9, bHi: 12 }),
    groups: [{ test: (p) => isBattle(p) && neg(p), count: 1 }, { test: (p) => isBattle(p) && pos(p), count: 1 }, { test: (p) => !isBattle(p), count: 1 }, { test: isBattle, count: 1 }, any(1)],
  },
  // 3: both forms, at least two of each, at least two negative and two positive answers.
  3: {
    candidates: () => candidates({ forms: ['x+a', 'x-a'], aLo: 2, aHi: 9, bLo: -10, bHi: 12 }),
    groups: [
      { test: (p) => p.form === 'x+a' && neg(p), count: 1 }, { test: (p) => p.form === 'x-a' && neg(p), count: 1 },
      { test: (p) => p.form === 'x+a' && pos(p), count: 1 }, { test: (p) => p.form === 'x-a' && pos(p), count: 1 }, any(1),
    ],
  },
  // 4: three with x on the right, two on the left, at least two negative answers.
  4: {
    candidates: () => candidates({ forms: ['x+a', 'x-a'], mirrors: [false, true], aLo: 1, aHi: 9, bLo: -9, bHi: 12 }),
    groups: [
      { test: (p) => p.mirror && neg(p), count: 1 }, { test: (p) => !p.mirror && neg(p), count: 1 },
      { test: (p) => p.mirror && p.form === 'x+a', count: 1 }, { test: (p) => p.mirror, count: 1 }, { test: (p) => !p.mirror, count: 1 },
    ],
  },
  // 5: all four forms, bigger numbers, at least two negative answers.
  5: {
    candidates: () => candidates({ forms: ['x+a', 'x-a'], mirrors: [false, true], aLo: 1, aHi: 14, bLo: -15, bHi: 15 }),
    groups: [
      { test: (p) => p.form === 'x+a' && !p.mirror && neg(p), count: 1 }, { test: (p) => p.form === 'x-a' && !p.mirror, count: 1 },
      { test: (p) => p.form === 'x+a' && p.mirror && neg(p), count: 1 }, { test: (p) => p.form === 'x-a' && p.mirror, count: 1 },
      any(1),
    ],
  },
  // 6: the L5 forms with x on the left only (the focus is the new move).
  6: {
    candidates: () => candidates({ forms: ['x+a', 'x-a'], aLo: 1, aHi: 14, bLo: -15, bHi: 15 }),
    groups: [{ test: (p) => p.form === 'x+a' && neg(p), count: 1 }, { test: (p) => p.form === 'x-a' && pos(p), count: 1 }, { test: (p) => p.form === 'x-a' && neg(p), count: 1 }, { test: (p) => p.form === 'x+a' && pos(p), count: 1 }, any(1)],
  },
};

// Answers at most 15 in size (the spec's limit on every number in a problem).
const withinLimit = (p) => Math.abs(p.x) <= 15 && Math.abs(p.b) <= 15 && p.a <= 14;

export function generateAddBothLevel(level, seed) {
  const spec = ADD_BOTH_LEVELS[level];
  if (!spec) throw new Error(`Unknown Add to both sides level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level + 120, 0x85ebca6b)) >>> 0);
  const set = pickSet({
    candidates: spec.candidates().filter(withinLimit), groups: spec.groups, answerOf: (p) => p.x, rng, label: `Add to both sides level ${level}`,
  });
  return set;
}

export { PROBLEMS_PER_LEVEL };
