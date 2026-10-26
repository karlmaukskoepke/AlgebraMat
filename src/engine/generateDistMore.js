// Seeded problem sets for Distribute more (Build U, basic form): equations that need distributing (a group beside other terms, a negative
// factor, the invisible −1, a fraction factor), combining like terms, then x on both sides, as on Karl's quiz review sheet (sections 4 and
// 5). Five levels, displayed 1-5 = saved 1-5 (no walkthrough). Five problems a level, no repeated answers (so no repeated equations),
// whole answers 2 to 9 in size (never 0 or ±1). Numbers in front of x are 2 to 9 in size outside a parenthesis (1 on the right is allowed:
// `x + 15`, `2 − x`); a fraction factor's products are whole. Every number written, and every product a distribute writes, is at most 15
// in size and never 0 (the Add move's limit), and every x-term a distribute writes is at most 9 in size (the Add x-term's limit); once
// the x-terms are put together the number in front of x is 2 to 6 in size (one Divide finishes it); the side left once the numbers are
// put together is at most 30 in size, and never 0. No accidental balances: a slip's value is never the answer. Each level has the sign mix below.
// Every problem is verified by substitution when it is made (makeBoth).

import { mulberry32, pickSet } from './generate.js';
import { makeBoth, slipValuesOf, linear } from './bothSides.js';

export const DIST_MORE_LEVEL_COUNT = 5;
export const MAX_NUM = 15;
export const MAX_SIDE = 30;
const KIND = 'distribute-more';
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const POSITIVE = range(2, 9);
const BOTH = [...range(-9, -2), ...POSITIVE];
const INSIDE = [...range(-9, -1), ...range(1, 9)];
const ADDED = [...range(-12, -1), ...range(1, 12)];
// the fractions Karl's sheet uses, as [top, bottom]
const FRACTIONS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]];

export const slipSafe = (p) => slipValuesOf(p).every(({ v }) => v !== p.x);
const share = (q, v) => (q.f * v) / (q.d ?? 1);
// the numbers a problem writes (and a distribute writes), and the x-terms a distribute writes
function fits(p) {
  const pieces = [...p.left, ...p.right];
  const nums = pieces.flatMap((q) => (q.k === 'n' ? [q.v] : q.k === 'g' ? [q.c, share(q, q.c)] : []));
  if (nums.some((v) => !Number.isInteger(v) || v === 0 || Math.abs(v) > MAX_NUM)) return false;
  const xs = pieces.flatMap((q) => (q.k === 'x' ? [q.c] : q.k === 'g' ? [share(q, q.a ?? 1)] : []));
  if (xs.some((v) => !Number.isInteger(v) || v === 0 || Math.abs(v) > 9)) return false;
  const L = linear(p.left);
  const R = linear(p.right);
  const k = Math.abs(L.a - R.a);
  // (each side's numbers never put together to 0: `2(x + 2) − 4` would leave 0 beside the x-term)
  return k >= 2 && k <= 6 && L.b !== 0 && R.b !== 0 && Math.abs(R.b - L.b) <= MAX_SIDE && Math.abs(p.x) >= 2 && Math.abs(p.x) <= 9 && slipSafe(p);
}
const x = (c) => ({ k: 'x', c });
const n = (v) => ({ k: 'n', v });
// a(x + c) with a whole factor; the invisible 1, −(ax + c); a fraction, (f/d)(ax + c)
const grp = (f, c, a = 1) => ({ k: 'g', f, a, c });
const minusOne = (c, a = 1) => ({ k: 'g', f: -1, a, c, hidden: true });
const frac = (f, d, a, c) => ({ k: 'g', f, d, a, c });
// the right side: an x-term and a number, `cx + e` (or `e + cx`), e chosen so that x is the answer
function right(c, e, numFirst = false) { return numFirst ? [n(e), x(c)] : [x(c), n(e)]; }
function keep(out, level, left, rc, ans, numFirst = false) {
  const lv = linear(left);
  const e = lv.a * ans + lv.b - rc * ans;                             // the number on the right that makes x the answer
  if (!Number.isInteger(e) || e === 0) return;
  try { const p = makeBoth({ level, left, right: right(rc, e, numFirst), x: ans, kind: KIND }); if (fits(p)) out.push(p); } catch { /* not a solution */ }
}

// what a problem is (for the levels' sign mixes and Level 5's mix)
const groupOf = (p) => [...p.left, ...p.right].find((q) => q.k === 'g');
export const formOf = (p) => {
  const g = groupOf(p);
  if (g.d > 1) return g.f < 0 ? 'negfrac' : 'frac';
  if (g.hidden) return p.left.indexOf(g) === 0 ? 'minus-start' : p.left[0].k === 'x' ? 'minus-x' : 'minus-n';
  if (g.f < 0) return 'neg';
  return p.left.length > 1 ? 'plus' : 'pos';
};

const LEVEL1 = () => {
  const out = [];
  // 1: a(x + b) + c = dx + e: a group plus a number, x on both sides; positive answers
  for (const a of range(2, 6)) for (const b of INSIDE) for (const c of ADDED) for (const d of range(1, 9)) for (const ans of POSITIVE) {
    if (d === a) continue;
    keep(out, 1, [grp(a, b), n(c)], d, ans);
  }
  return out;
};
const LEVEL2 = () => {
  const out = [];
  // 2: −a(x − b) = cx + d, and a(x − b) = cx + d with either sign inside; both signs of the answer
  for (const a of range(2, 6)) for (const b of INSIDE) for (const c of range(1, 9)) for (const ans of BOTH) {
    keep(out, 2, [grp(-a, b)], c, ans);
    keep(out, 2, [grp(a, b)], c, ans);
  }
  return out;
};
const LEVEL3 = () => {
  const out = [];
  // 3: the invisible −1: px − (x − b) = qx + r, n − (cx + d) = ex + f, and −(cx + d) = ex + f at the start of a side
  for (const p of range(2, 9)) for (const b of INSIDE) for (const q of range(1, 9)) for (const ans of BOTH) keep(out, 3, [x(p), minusOne(b)], q, ans);
  for (const m of range(1, 12)) for (const a of range(1, 5)) for (const d of INSIDE) for (const e of [...range(-9, -1), ...range(1, 9)]) for (const ans of BOTH) keep(out, 3, [n(m), minusOne(d, a)], e, ans);
  for (const a of range(2, 5)) for (const d of INSIDE) for (const e of range(1, 9)) for (const ans of BOTH) keep(out, 3, [minusOne(d, a)], e, ans);
  return out;
};
const fractionGroups = (level, sign) => {
  const out = [];
  // a fraction of a group: (p/q)(ax + b) = cx + d, the products whole (`⅔(6x + 9)` gives 4x + 6)
  for (const [t, d] of FRACTIONS) for (const a of range(1, 15)) for (const b of [...range(-15, -1), ...range(1, 15)]) {
    if ((t * a) % d || (t * b) % d) continue;
    for (const c of [...range(-9, -1), ...range(1, 9)]) for (const ans of sign > 0 ? POSITIVE : BOTH) for (const numFirst of [false, true]) keep(out, level, [frac(sign * t, d, a, b)], c, ans, numFirst);
  }
  return out;
};

export const DIST_MORE_LEVELS = {
  1: { candidates: LEVEL1, groups: [{ test: (p) => p.left[1].v < 0, count: 2 }, { test: (p) => p.left[1].v > 0, count: 1 }, { test: (p) => p.left[0].c < 0, count: 1 }, { test: () => true, count: 1 }] },
  2: { candidates: LEVEL2, groups: [{ test: (p) => formOf(p) === 'neg', count: 3 }, { test: (p) => formOf(p) === 'pos' && groupOf(p).c < 0, count: 1 }, { test: (p) => p.x < 0, count: 1 }] },
  3: { candidates: LEVEL3, groups: [{ test: (p) => formOf(p) === 'minus-x', count: 2 }, { test: (p) => formOf(p) === 'minus-n', count: 2 }, { test: (p) => formOf(p) === 'minus-start', count: 1 }] },
  // (a fraction with a top above 1, `⅔`, `¾`, `⅗`, at least twice: Karl's sheet's own)
  4: { candidates: () => fractionGroups(4, 1), groups: [{ test: (p) => groupOf(p).f > 1, count: 2 }, { test: (p) => groupOf(p).d === 3, count: 1 }, { test: (p) => groupOf(p).d === 4, count: 1 }, { test: () => true, count: 1 }] },
  5: {
    candidates: () => [...fractionGroups(5, -1), ...[1, 2, 3].flatMap((lv) => candidatesOf(lv)).map((p) => ({ ...p, level: 5 })), ...fractionGroups(5, 1)],
    groups: [{ test: (p) => formOf(p) === 'negfrac' && groupOf(p).f < -1, count: 1 }, { test: (p) => formOf(p) === 'negfrac', count: 1 }, { test: (p) => ['plus', 'neg', 'pos'].includes(formOf(p)), count: 1 }, { test: (p) => formOf(p).startsWith('minus'), count: 1 }, { test: (p) => formOf(p) === 'frac', count: 1 }],
  },
};

const CACHE = {};
const candidatesOf = (level) => (CACHE[level] ??= DIST_MORE_LEVELS[level].candidates());   // (the same list every time: made once)
export function generateDistMoreLevel(level, seed) {
  const spec = DIST_MORE_LEVELS[level];
  if (!spec) throw new Error(`Unknown Distribute more level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level + 907, 0x9e3779b1)) >>> 0);
  return pickSet({ candidates: candidatesOf(level), groups: spec.groups, answerOf: (p) => p.x, rng, label: `Distribute more level ${level}` });
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
    for (const p of generateDistMoreLevel(level, seed)) {
      problems += 1;
      for (const c of slipCollisionsOf(p)) { const k = c.tags.join(' = '); counts[k] = (counts[k] ?? 0) + 1; }
    }
  }
  return { problems, counts };
}
