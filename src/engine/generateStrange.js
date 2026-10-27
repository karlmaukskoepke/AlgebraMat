// Seeded problem sets for Strange solutions (Build V, basic form): `ax + b = cx + d` whose answer is a fraction or 0, solved as on Variables
// on both sides; the divide that finishes writes `x = 15/6` and the student simplifies and types x. Five saved levels (displayed as saved,
// no walkthrough); Build V builds Levels 1-3, Levels 4-5 (no solution, infinitely many, a mix with distributing) are V2's and are hidden.
//   1  a fraction answer already in lowest terms (`2x + 3 = 4x − 2` gives 5/2)
//   2  a fraction answer to simplify (`10x − 4 = 4x + 5` gives 9/6, so 3/2)
//   3  x = 0 (the two numbers match: `7x − 6 = 2x − 6`), twice, mixed with two of Level 1 and one of Level 2
// Numbers in front of x are 2 to 9 in size (the left one positive), different on the two sides; put together they are 2 to 6 in size (one
// Divide, one digit, finishes it). The numbers are 1 to 15 in size; put together, at most 30. Answers p/q in lowest terms with q 2 to 6 and
// |p| at most 15, improper (never a mixed number); never whole except 0 (Level 3); never ±1. No repeated answers or equations in a level
// (Level 3's two zeros are different equations: the one deliberate repeat). No accidental balances: a slip's value is never the answer.
// Every problem is verified by substitution with exact fractions when it is made.

import { mulberry32, pickSet } from './generate.js';
import { linear, formatBoth } from './bothSides.js';
import { frac, lowest, same, isLowest, gcd, neg, fracText } from './fraction.js';

export const STRANGE_LEVEL_COUNT = 5;
export const STRANGE_SHOWN = 3;                 // the levels students see in Build V (4 and 5 are V2's)
export const MAX_NUM = 15;
export const MAX_SIDE = 30;
const KIND = 'strange-solutions';
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const COEF = [...range(-9, -2), ...range(2, 9)];
const NUM = [...range(-15, -1), ...range(1, 15)];

// A side's value at x = p/q, exactly: { n, d } (Ax + B with x a fraction)
const sideAt = (side, f) => { const { a, b } = linear(side); return { n: a * f.n + b * f.d, d: f.d }; };

// The problem: { kind, level, left, right, ans, raw, x }: `ans` the answer in lowest terms, `raw` the fraction the divide row writes when
// x is collected on the left ((D − B) over (A − C), the sign on top), `x` the answer as a number (for sorting and old helpers only).
export function makeStrange({ level, left, right }) {
  const L = linear(left);
  const R = linear(right);
  if (L.a === R.a) throw new Error('x disappears: V2');
  const raw = frac(R.b - L.b, L.a - R.a);
  const ans = lowest(raw);
  const p = { kind: KIND, level, left, right, ans, raw, x: ans.n / ans.d };
  if (!same(sideAt(left, ans), sideAt(right, ans))) throw new Error(`substitution check failed: ${formatBoth(p)}, x = ${fracText(ans)}`);
  return p;
}

// ---------- What a wrong answer looked like (declared in the build brief; new tags, Build V) ----------
//   sign-flipped        the right size with the wrong sign
//   frac-swapped        top and bottom swapped (2/5 for 5/2)
//   frac-no-divide      the divisor left out: the top alone (9 for 9/6)
//   frac-reduced-wrong  only the top or only the bottom divided (9/6 made 3/6 or 9/2)
//   x-sign-lost         an x-term moved with its sign kept: (D − B) / (A + C)
//   half-collected      one side's x-terms left out: (D − B) / A
// An unsimplified right answer (15/6) is not a slip: it is nudged, tag `unsimplified` (the card's).
function rawSlips(p) {
  const { a: A, b: B } = linear(p.left);
  const { a: C, b: D } = linear(p.right);
  const out = [];
  const push = (tag, f) => { if (f && f.d !== 0) out.push({ tag, v: frac(f.n, f.d) }); };
  push('sign-flipped', neg(p.ans));
  if (p.ans.n !== 0) push('frac-swapped', { n: p.ans.d, d: p.ans.n });
  if (p.raw.d > 1) push('frac-no-divide', { n: p.raw.n, d: 1 });
  const g = gcd(p.raw.n, p.raw.d);
  if (g > 1) { push('frac-reduced-wrong', { n: p.raw.n / g, d: p.raw.d }); push('frac-reduced-wrong', { n: p.raw.n, d: p.raw.d / g }); }
  if (A + C !== 0) push('x-sign-lost', { n: D - B, d: A + C });
  push('half-collected', { n: D - B, d: A });
  return out;
}
// (at x = 0 every slip gives 0 too: none is a different value, so a zero has none)
export const slipValuesOf = (p) => rawSlips(p).filter((s) => !same(s.v, p.ans));
// The tag of a typed value (a fraction), or null when it is the answer
export function tagStrange(p, typed) {
  if (same(typed, p.ans)) return null;
  return slipValuesOf(p).find((s) => same(s.v, typed))?.tag ?? 'unmatched';
}

// ---------- the levels ----------
const x = (c) => ({ k: 'x', c });
const n = (v) => ({ k: 'n', v });
function fits(p) {
  const nums = [...p.left, ...p.right].filter((q) => q.k === 'n').map((q) => q.v);
  if (nums.some((v) => v === 0 || Math.abs(v) > MAX_NUM)) return false;
  const k = Math.abs(p.raw.d);
  if (Math.abs(linear(p.left).a - linear(p.right).a) < 2 || Math.abs(linear(p.left).a - linear(p.right).a) > 6) return false;
  if (Math.abs(p.raw.n) > MAX_SIDE || k < 1) return false;
  if (p.ans.n === 0) return true;
  return p.ans.d >= 2 && p.ans.d <= 6 && Math.abs(p.ans.n) <= 15 && Math.abs(p.ans.n) !== p.ans.d && rawSlips(p).every(({ v }) => !same(v, p.ans));
}
// every `Ax + B = Cx + D` with A positive, C either sign, the numbers either sign
function all(level, keepIt) {
  const out = [];
  for (const A of range(2, 9)) for (const C of COEF) for (const B of NUM) for (const D of NUM) {
    const k = A - C;
    if (Math.abs(k) < 2 || Math.abs(k) > 6 || Math.abs(D - B) > MAX_SIDE) continue;
    const p = makeStrange({ level, left: [x(A), n(B)], right: [x(C), n(D)] });
    if (fits(p) && keepIt(p)) out.push(p);
  }
  return out;
}
const simple = (p) => p.ans.n !== 0 && isLowest(p.raw);
const toSimplify = (p) => p.ans.n !== 0 && !isLowest(p.raw);
const zero = (p) => p.ans.n === 0;
const negative = (p) => p.ans.n < 0;
const subtracts = (p) => p.left[1].v < 0 || p.right[1].v < 0;

export const STRANGE_LEVELS = {
  1: { candidates: () => all(1, simple), groups: [{ test: negative, count: 2 }, { test: (p) => !negative(p), count: 2 }, { test: (p) => p.right[0].c < 0, count: 1 }] },
  2: { candidates: () => all(2, toSimplify), groups: [{ test: negative, count: 1 }, { test: (p) => !negative(p) && subtracts(p), count: 2 }, { test: (p) => p.raw.d === 6, count: 1 }, { test: () => true, count: 1 }] },
  // (two zeros in different equations, so a student does not expect it: the one repeated answer, on purpose)
  3: {
    candidates: () => [...all(3, zero), ...all(3, simple), ...all(3, toSimplify)],
    groups: [{ test: (p) => zero(p) && p.left[1].v < 0, count: 1 }, { test: (p) => zero(p) && p.left[1].v > 0, count: 1 }, { test: simple, count: 2 }, { test: toSimplify, count: 1 }],
  },
};

const CACHE = {};
const candidatesOf = (level) => (CACHE[level] ??= STRANGE_LEVELS[level].candidates());
// (a zero's answer key is its equation, so the two zeros may repeat the answer and never the equation)
const answerKey = (p) => (p.ans.n === 0 ? `0:${formatBoth(p)}` : fracText(p.ans));
export function generateStrangeLevel(level, seed) {
  const spec = STRANGE_LEVELS[level];
  if (!spec) throw new Error(`Strange solutions level ${level} is not built yet`);
  const rng = mulberry32((seed ^ Math.imul(level + 1301, 0x9e3779b1)) >>> 0);
  return pickSet({ candidates: candidatesOf(level), groups: spec.groups, answerOf: answerKey, rng, label: `Strange solutions level ${level}` });
}

// Slip collisions: a wrong value that fits two slips (reported, not prevented).
export function slipCollisions(level, seeds = 200) {
  let problems = 0;
  const counts = {};
  for (let seed = 1; seed <= seeds; seed++) {
    for (const p of generateStrangeLevel(level, seed)) {
      problems += 1;
      const by = new Map();
      for (const { tag, v } of slipValuesOf(p)) { const k = fracText(lowest(v)); by.set(k, [...new Set([...(by.get(k) ?? []), tag])]); }
      for (const tags of by.values()) if (tags.length > 1) { const k = tags.join(' = '); counts[k] = (counts[k] ?? 0) + 1; }
    }
  }
  return { problems, counts };
}
