// Seeded problem sets for Distribute, combine, solve (Build M, basic form). Five levels, displayed 1-5 = saved 1-5 (no walkthrough level).
// Five problems a level, no repeated answers or equations, whole answers 2 to 9 in size (never 0 or ±1), the factor 2 to 5 in size, the
// number in the parenthesis 1 to 9 in size, a number before it up to 12. Every row stays within the loop's limits: the number an Add must
// cancel after distributing (and combining) is at most 15 in size and never 0, the other side at most 45 in size and never 0; the
// parenthesis is never 0 at the answer. No accidental balances: a slip's value is never the answer. Each level has the sign mix below.
// Every problem is verified by substitution when it is made (makeDistSolve).

import { mulberry32, pickSet } from './generate.js';
import { makeDistSolve, slipValuesOf } from './distSolve.js';

export const DIST_LEVEL_COUNT = 5;
export const MAX_ADD = 15;
export const MAX_SIDE = 45;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const POSITIVE = range(2, 9);
const BOTH = [...range(-9, -2), ...POSITIVE];
const CS = [...range(-9, -1), ...range(1, 9)];

export const slipSafe = (p) => slipValuesOf(p).every(({ v }) => v !== p.x);
// the number beside x once distributed and put together (what Add must cancel)
export const addAmountOf = (p) => p.n + p.f * p.c;
function fits(p) {
  const k = addAmountOf(p);
  return Math.abs(p.f * p.c) <= MAX_ADD && k !== 0 && Math.abs(k) <= MAX_ADD && p.b !== 0 && Math.abs(p.b) <= MAX_SIDE
    && p.x + p.c !== 0 && (!p.n || p.b !== p.n) && slipSafe(p);
}

function candidates({ factors, ns = [0], bxs = [0], xs = POSITIVE, level }) {
  const out = [];
  for (const f of factors) for (const c of CS) for (const n of ns) for (const bx of bxs) for (const xFirst of bx ? [false, true] : [false]) for (const x of xs) {
    if (bx && (f + bx < 2 || f + bx > 6)) continue;
    const p = makeDistSolve({ level, f, c, n, bx, xFirst, x });
    if (fits(p)) out.push(p);
  }
  return out;
}
const g = (test, count = 1) => ({ test, count });
const any = (count = 1) => g(() => true, count);

export const DIST_LEVELS = {
  // 1: a(x ± c) = b (Karl's levels 1 and 2, merged): both signs of c, twice each; positive answers
  1: { candidates: () => candidates({ factors: range(2, 5), level: 1 }), groups: [g((p) => p.c > 0, 2), g((p) => p.c < 0, 2), any()] },
  // 2: −a(x ± c) = b (a negative factor; Flip first is helpful too): both signs of c, one negative answer
  2: { candidates: () => candidates({ factors: range(-5, -2), xs: BOTH, level: 2 }), groups: [g((p) => p.c > 0), g((p) => p.c < 0), g((p) => p.x < 0), g((p) => p.x > 0), any()] },
  // 3: n + a(x ± c) = b: both signs of c
  3: { candidates: () => candidates({ factors: range(2, 5), ns: range(1, 12), level: 3 }), groups: [g((p) => p.c > 0, 2), g((p) => p.c < 0, 2), any()] },
  // 4: n − a(x ± c) = b (the minus before the factor is tapped first): both signs of c, one negative answer
  4: { candidates: () => candidates({ factors: range(-5, -2), ns: range(1, 12), xs: BOTH, level: 4 }), groups: [g((p) => p.c > 0), g((p) => p.c < 0), g((p) => p.x < 0), g((p) => p.x > 0), any()] },
  // 5: like x-terms: a(x ± c) + bx = d and bx + a(x ± c) = d, either sign of b (the x-terms put together make 2 to 6)
  5: {
    candidates: () => candidates({ factors: range(2, 5), bxs: [-4, -3, -2, -1, 1, 2, 3, 4], level: 5 }),
    groups: [g((p) => p.xFirst && p.c > 0), g((p) => !p.xFirst && p.c < 0), g((p) => p.bx < 0), g((p) => p.bx > 0), any()],
  },
};

export function generateDistSolveLevel(level, seed) {
  const spec = DIST_LEVELS[level];
  if (!spec) throw new Error(`Unknown Distribute, combine, solve level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level + 613, 0x9e3779b1)) >>> 0);
  return pickSet({ candidates: spec.candidates(), groups: spec.groups, answerOf: (p) => p.x, rng, label: `Distribute, combine, solve level ${level}` });
}

// Slip collisions: a wrong value that fits two slips (reported, not prevented; a slip that is the answer is prevented: slipSafe). The
// product slips (the piece not multiplied, the sign lost) never collide: they differ unless the factor is ±1.
export function slipCollisionsOf(p) {
  const by = new Map();
  for (const { tag, v } of slipValuesOf(p)) by.set(v, [...new Set([...(by.get(v) ?? []), tag])]);
  return [...by.entries()].filter(([, tags]) => tags.length > 1).map(([value, tags]) => ({ value, tags }));
}
export function slipCollisions(level, seeds = 200) {
  let problems = 0;
  const counts = {};
  for (let seed = 1; seed <= seeds; seed++) {
    for (const p of generateDistSolveLevel(level, seed)) {
      problems += 1;
      for (const c of slipCollisionsOf(p)) { const k = c.tags.join(' = '); counts[k] = (counts[k] ?? 0) + 1; }
    }
  }
  return { problems, counts };
}
