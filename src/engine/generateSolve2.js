// Seeded problem sets for Two-step equations (SPEC-SOLVE.md §7). Every problem is drawable as boxes and counters: at most
// 5 boxes, 30 counters on the other side, and a number added or subtracted of 12 at most. Levels: ax + b = c; ax − b = c;
// b + ax = c; the same turned round (c = ax + b); b − ax = c (a negative coefficient, and c can be negative: 5 − 2x = −3);
// negative answers; everything mixed. Five a level, no repeated answers.

import { mulberry32, pickSet, PROBLEMS_PER_LEVEL } from './generate.js';
import { makeSolve2 } from './solve2.js';

export const SOLVE2_LEVEL_COUNT = 7;
export const MAX_C = 30;

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const POSITIVE = range(1, 9);
const NEGATIVE = range(-9, -1);

// All the problems of some forms, for some answers x, within what can be drawn. `keep` filters further.
function candidates(forms, xs, { mirror = [false], bMax = 12, keep = () => true } = {}) {
  const out = [];
  for (const form of forms) {
    for (const flip of mirror) {
      for (const a of range(2, 5)) {
        for (const b of range(1, bMax)) {
          for (const x of xs) {
            const p = makeSolve2(form, a, b, x, flip);
            if (p.c !== 0 && Math.abs(p.c) <= MAX_C && keep(p)) out.push(p);
          }
        }
      }
    }
  }
  return out;
}

const small = (p) => (Math.abs(p.x) <= 6 ? 3 : 1);
const positiveC = (p) => p.c > 0;

const FIVE = (extra = []) => [...extra, { test: (p) => p.a >= 4, count: 1 }, { test: (p) => p.a <= 3, count: 1 }, { test: () => true, count: 5 }];
const trim = (groups) => { let left = PROBLEMS_PER_LEVEL; return groups.map((g) => { const count = Math.min(g.count, left); left -= count; return { ...g, count }; }).filter((g) => g.count > 0); };

export const SOLVE2_LEVELS = {
  1: { candidates: () => candidates(['ax+b'], POSITIVE, { keep: positiveC }), groups: trim(FIVE()) },
  2: { candidates: () => candidates(['ax-b'], POSITIVE, { keep: positiveC }), groups: trim(FIVE()) },
  3: { candidates: () => candidates(['b+ax'], POSITIVE, { keep: positiveC }), groups: trim(FIVE()) },
  // 4: the same turned round (x on the right)
  4: {
    candidates: () => candidates(['ax+b', 'ax-b', 'b+ax'], POSITIVE, { mirror: [true], keep: positiveC }),
    groups: trim([
      { test: (p) => p.form === 'ax+b', count: 1 }, { test: (p) => p.form === 'ax-b', count: 1 }, { test: (p) => p.form === 'b+ax', count: 1 },
      { test: () => true, count: 2 },
    ]),
  },
  // 5: a negative coefficient, with c negative in at least two (5 − 2x = −3)
  5: {
    candidates: () => candidates(['b-ax'], POSITIVE, { bMax: 12 }),
    groups: trim([
      { test: (p) => p.c < 0, count: 2 }, { test: (p) => p.c > 0, count: 1 }, { test: (p) => p.a >= 4, count: 1 }, { test: () => true, count: 1 },
    ]),
  },
  // 6: negative answers, in the three plain forms, some turned round
  6: {
    candidates: () => candidates(['ax+b', 'ax-b', 'b+ax'], NEGATIVE, { mirror: [false, true] }),
    groups: trim([
      { test: (p) => p.form === 'ax+b', count: 1 }, { test: (p) => p.form === 'ax-b', count: 1 }, { test: (p) => p.form === 'b+ax', count: 1 },
      { test: (p) => p.mirror, count: 1 }, { test: () => true, count: 1 },
    ]),
  },
  // 7: everything mixed
  7: {
    candidates: () => candidates(['ax+b', 'ax-b', 'b+ax', 'b-ax'], [...NEGATIVE, ...POSITIVE], { mirror: [false, true] }),
    groups: trim([
      { test: (p) => p.form === 'b-ax' && p.x < 0, count: 1 }, { test: (p) => p.form === 'b-ax' && p.x > 0, count: 1 },
      { test: (p) => p.mirror && p.x < 0, count: 1 }, { test: (p) => p.x < 0 && !p.mirror, count: 1 }, { test: () => true, count: 1 },
    ]),
  },
};

export function generateSolve2Level(level, seed) {
  const spec = SOLVE2_LEVELS[level];
  if (!spec) throw new Error(`Unknown Two-step equations level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level + 40, 0x85ebca6b)) >>> 0);
  return pickSet({
    candidates: spec.candidates(), groups: spec.groups, weight: small, answerOf: (p) => p.x, rng, label: `Two-step equations level ${level}`,
  });
}

export { PROBLEMS_PER_LEVEL };
