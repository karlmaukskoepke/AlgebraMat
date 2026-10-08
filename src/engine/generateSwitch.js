// Seeded problem sets for the Switch sides card (SPEC-SOLVE.md §8): the same equations as One-step and Two-step, but the
// student moves the number across the border and it switches teams. Levels: x + a = b; x − a = b; negative answers
// (x + 4 = −2); x on the right (12 = x + 5); two-step (2x + 6 = 14); two-step with negative answers. Five a level, no
// repeated answers. Problems are One-step ('solve') and Two-step ('solve2') problems, so their checking is shared.

import { mulberry32, pickSet, PROBLEMS_PER_LEVEL } from './generate.js';
import { makeSolve } from './solve.js';
import { SOLVE_LEVELS } from './generateSolve.js';
import { SOLVE2_LEVELS } from './generateSolve2.js';

export const SWITCH_LEVEL_COUNT = 6;

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const FORMS = ['x+a', 'x-a'];

// One-step x ± a = b for answers x, within what can be drawn (at most 24 counters on a side).
function oneStep(xs, { mirror = false } = {}) {
  const out = [];
  for (const form of FORMS) {
    for (const a of range(2, 9)) {
      for (const x of xs) {
        const p = makeSolve(form, a, x, mirror);
        if (p.b !== 0 && Math.abs(p.b) <= 24) out.push(p);
      }
    }
  }
  return out;
}

const POSITIVE = range(1, 12);
const NEGATIVE = range(-12, -1);
const both = [...NEGATIVE, ...POSITIVE];
const small = (p) => (Math.abs(p.x) <= 8 ? 3 : 1);
const anyTwo = (n = 2) => ({ test: () => true, count: n });

const SWITCH_LEVELS = {
  1: { candidates: () => SOLVE_LEVELS[1].candidates(), groups: SOLVE_LEVELS[1].groups },
  2: { candidates: () => SOLVE_LEVELS[2].candidates(), groups: SOLVE_LEVELS[2].groups },
  // 3: negative answers, with a negative right side in at least three (x + 4 = −2)
  3: {
    candidates: () => oneStep(NEGATIVE),
    groups: [{ test: (p) => p.form === 'x+a' && p.b < 0, count: 2 }, { test: (p) => p.form === 'x-a', count: 1 }, { test: (p) => p.b > 0, count: 1 }, anyTwo(1)],
  },
  // 4: the same turned round, the number on the right with x, some negative
  4: {
    candidates: () => oneStep(both, { mirror: true }),
    groups: [{ test: (p) => p.form === 'x+a' && p.x > 0, count: 1 }, { test: (p) => p.form === 'x-a' && p.x > 0, count: 1 }, { test: (p) => p.x < 0, count: 2 }, anyTwo(1)],
  },
  // 5: two-step, positive: switch the number, then share among the boxes
  5: {
    candidates: () => [1, 2, 3].flatMap((l) => SOLVE2_LEVELS[l].candidates()),
    groups: [{ test: (p) => p.form === 'ax+b', count: 1 }, { test: (p) => p.form === 'ax-b', count: 1 }, { test: (p) => p.form === 'b+ax', count: 1 }, anyTwo(2)],
  },
  // 6: two-step with negative answers (some turned round)
  6: {
    candidates: () => SOLVE2_LEVELS[6].candidates(),
    groups: [{ test: (p) => p.form === 'ax+b', count: 1 }, { test: (p) => p.form === 'ax-b', count: 1 }, { test: (p) => p.form === 'b+ax', count: 1 }, { test: (p) => p.mirror, count: 1 }, anyTwo(1)],
  },
};

export function generateSwitchLevel(level, seed) {
  const spec = SWITCH_LEVELS[level];
  if (!spec) throw new Error(`Unknown Switch sides level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level + 80, 0x85ebca6b)) >>> 0);
  return pickSet({
    candidates: spec.candidates(), groups: spec.groups, weight: small, answerOf: (p) => p.x, rng, label: `Switch sides level ${level}`,
  });
}

export { PROBLEMS_PER_LEVEL };
