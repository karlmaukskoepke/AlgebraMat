// Seeded problem sets for One-step equations (SPEC-SOLVE.md §2). Every problem is drawable as boxes and counters: at
// most 36 counters on a side. Levels: x + a = b; x − a = b; ax = b; x/a = b; all four mixed. Answers are whole
// numbers and positive for now (negatives and fractions get their own levels later). Five a level, no repeated answers.

import { mulberry32, pickSet, PROBLEMS_PER_LEVEL } from './generate.js';
import { makeSolve } from './solve.js';

export const SOLVE_LEVEL_COUNT = 5;
export const MAX_SIDE = 36;

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// All the problems of a form: a joined to x, and the solution x, within what can be drawn.
function candidates(form) {
  const out = [];
  const as = form === 'x+a' || form === 'x-a' ? range(2, 12) : range(2, 6);
  const xs = form === 'x/a' ? range(2, 12) : range(2, 12);
  for (const a of as) {
    for (const x of xs) {
      if (form === 'x-a' && x <= a) continue;                // keep b positive
      if (form === 'x/a' && x * a > MAX_SIDE) continue;        // x = a·b: b stays small enough to draw
      let p;
      if (form === 'x/a') {
        // here the number to pick is b (the right side); the solution is a·b
        p = makeSolve('x/a', a, a * x);
        if (p.b > 12) continue;
      } else p = makeSolve(form, a, x);
      if (Math.max(p.b, p.x) > MAX_SIDE) continue;
      out.push(p);
    }
  }
  return out;
}

const small = (p) => (p.x <= 20 ? 3 : 1);

const SINGLE = (form) => ({
  candidates: () => candidates(form),
  groups: [
    { test: (p) => p.a >= 5, count: 1 },
    { test: (p) => p.a <= 3, count: 1 },
    { test: () => true, count: 3 },
  ],
});

export const SOLVE_LEVELS = {
  1: SINGLE('x+a'),
  2: SINGLE('x-a'),
  3: SINGLE('ax'),
  4: SINGLE('x/a'),
  // 5: all four forms, mixed (at least one of each of the first three, and the dividing one)
  5: {
    candidates: () => ['x+a', 'x-a', 'ax', 'x/a'].flatMap(candidates),
    groups: [
      { test: (p) => p.form === 'x+a', count: 1 },
      { test: (p) => p.form === 'x-a', count: 1 },
      { test: (p) => p.form === 'ax', count: 1 },
      { test: (p) => p.form === 'x/a', count: 1 },
      { test: () => true, count: 1 },
    ],
  },
};

export function generateSolveLevel(level, seed) {
  const spec = SOLVE_LEVELS[level];
  if (!spec) throw new Error(`Unknown One-step equations level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level, 0x85ebca6b)) >>> 0);
  return pickSet({
    candidates: spec.candidates(), groups: spec.groups, weight: small, answerOf: (p) => p.x, rng, label: `One-step equations level ${level}`,
  });
}

export { PROBLEMS_PER_LEVEL };
