// Seeded problem sets for Variables on both sides (Build R, basic form). Five levels, displayed 1-5 = saved 1-5 (no walkthrough). Five
// problems a level, no repeated answers (so no repeated equations), whole answers 2 to 9 in size (never 0 or ±1). The numbers in front of
// x are 2 to 9 in size and differ on the two sides; once the x-terms are put together the number in front of x is 2 to 6 in size (one
// Divide finishes it). Every number written, and every product a distribute writes, is at most 15 in size and never 0 (the Add move's
// limit), so any number may be moved; the side left once the numbers are put together is at most 30 in size. No accidental balances: a
// slip's value is never the answer. Each level has the sign mix below. Every problem is verified by substitution when it is made (makeBoth).

import { mulberry32, pickSet } from './generate.js';
import { makeBoth, slipValuesOf, linear } from './bothSides.js';

export const BOTH_LEVEL_COUNT = 5;
export const MAX_NUM = 15;
export const MAX_SIDE = 30;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const POSITIVE = range(2, 9);
const BOTH = [...range(-9, -2), ...POSITIVE];
const NONZERO = [...range(-15, -1), ...range(1, 15)];
const COEF = range(2, 9);

export const slipSafe = (p) => slipValuesOf(p).every(({ v }) => v !== p.x);
// The pieces' numbers (and a parenthesis's products) are at most 15 in size and not 0; the x-terms put together are 2 to 6 in size.
function fits(p) {
  const nums = [...p.left, ...p.right].flatMap((q) => (q.k === 'n' ? [q.v] : q.k === 'g' ? [q.f * q.c] : []));
  if (nums.some((v) => v === 0 || Math.abs(v) > MAX_NUM)) return false;
  const L = linear(p.left);
  const R = linear(p.right);
  const k = Math.abs(L.a - R.a);
  return k >= 2 && k <= 6 && Math.abs(R.b - L.b) <= MAX_SIDE && slipSafe(p);
}
const x = (c) => ({ k: 'x', c });
const n = (v) => ({ k: 'n', v });
const grp = (f, c) => ({ k: 'g', f, c });
function keep(out, level, left, right, ans) {
  try { const p = makeBoth({ level, left, right, x: ans }); if (fits(p)) out.push(p); } catch { /* not a solution */ }
}
// the constant that makes x the answer: rhs constant d = value of the left − value of the right's x part
const solveFor = (lhsVal, rhsXPart) => lhsVal - rhsXPart;

export const BOTH_LEVELS = {
  // 1: ax = bx + c, a > b, positive coefficients, one constant; positive answers
  1: {
    candidates: () => {
      const out = [];
      for (const a of COEF) for (const b of COEF) for (const ans of POSITIVE) {
        if (a <= b) continue;
        keep(out, 1, [x(a)], [x(b), n(solveFor(a * ans, b * ans))], ans);
      }
      return out;
    },
    groups: [{ test: () => true, count: 5 }],
  },
  // 2: ax + b = cx + d, the larger number in front of x on the left; both signs of b and of d
  2: {
    candidates: () => {
      const out = [];
      for (const a of COEF) for (const c of COEF) for (const b of NONZERO) for (const ans of POSITIVE) {
        if (a <= c) continue;
        keep(out, 2, [x(a), n(b)], [x(c), n(solveFor(a * ans + b, c * ans))], ans);
      }
      return out;
    },
    groups: [{ test: (p) => p.left[1].v > 0, count: 2 }, { test: (p) => p.left[1].v < 0, count: 1 }, { test: (p) => p.right[1].v < 0, count: 1 }, { test: () => true, count: 1 }],
  },
  // 3: the same forms with the larger number in front of x on the right (moving the left x-term leaves x on the right: Trade places)
  3: {
    candidates: () => {
      const out = [];
      for (const a of COEF) for (const c of COEF) for (const b of NONZERO) for (const ans of POSITIVE) {
        if (c <= a) continue;
        keep(out, 3, [x(a), n(b)], [x(c), n(solveFor(a * ans + b, c * ans))], ans);
      }
      return out;
    },
    groups: [{ test: (p) => p.left[1].v > 0, count: 2 }, { test: (p) => p.left[1].v < 0, count: 1 }, { test: (p) => p.right[1].v < 0, count: 1 }, { test: () => true, count: 1 }],
  },
  // 4: negative numbers in front of x and subtraction: ax − b = −cx + d and −ax + b = cx − d; negative answers too
  4: {
    candidates: () => {
      const out = [];
      for (const a of COEF) for (const c of COEF) for (const b of range(1, 15)) for (const ans of BOTH) {
        keep(out, 4, [x(a), n(-b)], [x(-c), n(solveFor(a * ans - b, -c * ans))], ans);
        keep(out, 4, [x(-a), n(b)], [x(c), n(solveFor(-a * ans + b, c * ans))], ans);
      }
      return out;
    },
    groups: [{ test: (p) => p.x < 0, count: 1 }, { test: (p) => p.left[0].c > 0, count: 2 }, { test: (p) => p.left[0].c < 0, count: 2 }],
  },
  // 5: groups: a(x + b) = cx + d and a(x + b) = c(x + d); both signs inside the parenthesis
  5: {
    candidates: () => {
      const out = [];
      for (const a of range(2, 5)) for (const b of [...range(-9, -1), ...range(1, 9)]) for (const c of COEF) for (const ans of POSITIVE) {
        if (a === c) continue;
        keep(out, 5, [grp(a, b)], [x(c), n(solveFor(a * (ans + b), c * ans))], ans);
        for (const d of [...range(-9, -1), ...range(1, 9)]) keep(out, 5, [grp(a, b)], [grp(c, d)], ans);
      }
      return out;
    },
    groups: [{ test: (p) => p.right[0].k === 'x', count: 2 }, { test: (p) => p.right[0].k === 'g', count: 2 }, { test: (p) => p.left[0].c < 0, count: 1 }],
  },
};

const CACHE = {};
export function generateBothLevel(level, seed) {
  const spec = BOTH_LEVELS[level];
  if (!spec) throw new Error(`Unknown Variables on both sides level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level + 811, 0x9e3779b1)) >>> 0);
  CACHE[level] ??= spec.candidates();                                   // (the same list every time: made once)
  return pickSet({ candidates: CACHE[level], groups: spec.groups, answerOf: (p) => p.x, rng, label: `Variables on both sides level ${level}` });
}

// Slip collisions: a wrong value that fits two slips (reported, not prevented).
export function slipCollisionsOf(p) {
  const by = new Map();
  for (const { tag, v } of slipValuesOf(p)) by.set(v, [...new Set([...(by.get(v) ?? []), tag])]);
  return [...by.entries()].filter(([, tags]) => tags.length > 1).map(([value, tags]) => ({ value, tags }));
}
export function slipCollisions(level, seeds = 200) {
  let problems = 0;
  const counts = {};
  for (let seed = 1; seed <= seeds; seed++) {
    for (const p of generateBothLevel(level, seed)) {
      problems += 1;
      for (const c of slipCollisionsOf(p)) { const k = c.tags.join(' = '); counts[k] = (counts[k] ?? 0) + 1; }
    }
  }
  return { problems, counts };
}
