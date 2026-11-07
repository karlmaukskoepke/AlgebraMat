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
export const STRANGE_SHOWN = 5;                 // every level is shown since Build V2 (Build V showed 1-3)
export const MAX_NUM = 15;
export const MAX_SIDE = 30;
const KIND = 'strange-solutions';
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const COEF = [...range(-9, -2), ...range(2, 9)];
const NUM = [...range(-15, -1), ...range(1, 15)];

// A side's value at x = p/q, exactly: { n, d } (Ax + B with x a fraction)
const sideAt = (side, f) => { const { a, b } = linear(side); return { n: a * f.n + b * f.d, d: f.d }; };

// The problem: { kind, level, type, left, right, ans, raw, x }: `type` one, none (no solution) or all (infinitely many: Build V2); `ans` the
// answer in lowest terms, `raw` the fraction the divide row writes when x is collected on the left ((D − B) over (A − C), the sign on
// top), `x` the answer as a number (for sorting and old helpers only). A problem with no solution or infinitely many has no `ans`, `raw` or
// `x` (null): the same x-terms on both sides, so x disappears and the numbers left make a false or a true statement.
export const typeOf = (left, right) => { const L = linear(left); const R = linear(right); return L.a !== R.a ? 'one' : L.b === R.b ? 'all' : 'none'; };
export function makeStrange({ level, left, right, form = null }) {
  const L = linear(left);
  const R = linear(right);
  if (L.a === R.a) {
    const type = L.b === R.b ? 'all' : 'none';
    // (verified by substitution: every x gives the same difference, D − B, on 0, 1 and 2)
    const diff = (x) => (R.a * x + R.b) - (L.a * x + L.b);
    if (diff(0) !== diff(1) || diff(1) !== diff(2) || (type === 'all') !== (diff(0) === 0)) throw new Error(`substitution check failed: ${formatBoth({ left, right })}`);
    return { kind: KIND, level, type, left, right, ans: null, raw: null, x: null, ...(form ? { form } : {}) };
  }
  const raw = frac(R.b - L.b, L.a - R.a);
  const ans = lowest(raw);
  const p = { kind: KIND, level, type: 'one', left, right, ans, raw, x: ans.n / ans.d, ...(form ? { form } : {}) };
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
export const slipValuesOf = (p) => (p.ans ? rawSlips(p).filter((s) => !same(s.v, p.ans)) : []);
// The tag of a typed value (a fraction), or null when it is the answer
export function tagStrange(p, typed) {
  if (!p.ans) return 'unmatched';
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

// ---------- Levels 4 and 5 (Build V2, Karl 2026-11-02): no solution, infinitely many, or one ----------
// Level 4: `Ax + B = Cx + D` (with subtraction, negatives, a group, and Karl's shapes whose x-terms are not yet put together: `5 + x + x =
// 2x + 5`), three of five strange (both kinds), two ordinary (a fraction, and the zero case `3x + 4 = 4`). The first
// problem is always Karl's form: positive numbers, the x-terms the same (`5x + 3 = 5x + 7`).
// Level 5: distributing as on Distribute more (a negative factor, the invisible −1, a fraction factor), with a fraction answer, 0, no
// solution and infinitely many.
// Numbers written are 1 to 15 in size; what a distribute writes is whole, a number at most 15 and an x-term at most 9 in size; an x-term
// written is at most 9. Answers as in Levels 1-3 (lowest terms, q 2 to 6, |p| at most 15, never ±1, never whole except 0).
const POS = range(2, 9);
const SMALL = [...range(-9, -1), ...range(1, 9)];
const g = (f, c, a = 1, d = 1) => ({ k: 'g', f, a, c, ...(d > 1 ? { d } : {}) });
const minusOne = (c, a = 1) => ({ k: 'g', f: -1, a, c, hidden: true });
const shareOf = (q, v) => (q.f * v) / (q.d ?? 1);
const LV_FRACTIONS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]];
function fitsWritten(p) {
  const pieces = [...p.left, ...p.right];
  const nums = pieces.flatMap((q) => (q.k === 'n' ? [q.v] : q.k === 'g' ? [q.c, shareOf(q, q.c)] : []));
  if (nums.some((v) => !Number.isInteger(v) || v === 0 || Math.abs(v) > MAX_NUM)) return false;
  const xs = pieces.flatMap((q) => (q.k === 'x' ? [q.c] : q.k === 'g' ? [shareOf(q, q.a ?? 1)] : []));
  if (xs.some((v) => !Number.isInteger(v) || v === 0 || Math.abs(v) > 9)) return false;
  // (a side's x-terms put together never make 0 on their own: that is the cancel across the =)
  const L = linear(p.left); const R = linear(p.right);
  if ((p.left.some((q) => q.k !== 'n') && L.a === 0) || (p.right.some((q) => q.k !== 'n') && R.a === 0)) return false;
  if (Math.abs(L.b) > MAX_SIDE || Math.abs(R.b) > MAX_SIDE) return false;
  if (p.type !== 'one') return Math.abs(L.a) >= 1 && Math.abs(L.a) <= 9;
  const k = Math.abs(L.a - R.a);
  if (k < 2 || k > 6 || Math.abs(p.raw.n) > MAX_SIDE) return false;
  if (p.ans.n === 0) return true;
  return p.ans.d >= 2 && p.ans.d <= 6 && Math.abs(p.ans.n) <= 15 && Math.abs(p.ans.n) !== p.ans.d && rawSlips(p).every(({ v }) => !same(v, p.ans));
}
function tryMake(out, level, left, right, form) {
  let p;
  try { p = makeStrange({ level, left, right, form }); } catch { return; }
  if (fitsWritten(p)) out.push(p);
}
// the right side for a left side: the same x-terms with the same number (all), another number (none)
function strangeRights(left, { numFirst = false, single = false } = {}) {
  const L = linear(left);
  const out = [];
  const side = (b) => (single ? [x(L.a)] : numFirst ? [n(b), x(L.a)] : [x(L.a), n(b)]);
  if (L.b !== 0) out.push({ type: 'all', right: side(L.b) });
  for (const D of NUM) if (D !== L.b && Math.abs(D - L.b) <= 12) out.push({ type: 'none', right: side(D) });
  return out;
}
function level4() {
  const out = [];
  // Karl's form: positive coefficient and numbers, the x-terms the same (B different: none; B the same: all)
  for (const A of POS) for (const B of range(1, 15)) for (const D of range(1, 15)) tryMake(out, 4, [x(A), n(B)], [x(A), n(D)], 'karl');
  // negatives and subtraction: either sign of x and of the numbers; the number first on the right sometimes
  for (const A of [...range(-9, -2), ...POS]) for (const B of NUM) for (const { right } of strangeRights([x(A), n(B)], { numFirst: true })) {
    if (A > 0 && B > 0 && right[0].v > 0) continue;
    tryMake(out, 4, [x(A), n(B)], right, 'signed');
  }
  // a group: `2x + 6 = 2(x + 3)` (all), `3(x + 2) = 3x + 5` (none)
  for (const f of range(2, 6)) for (const c of SMALL) {
    const grp = g(f, c);
    for (const { right } of strangeRights([grp])) tryMake(out, 4, [grp], right, 'group');
    tryMake(out, 4, [x(f), n(f * c)], [grp], 'group');
  }
  // Karl's shapes with the x-terms not yet put together: `5 + x + x = 2x + 5`, `2x + 3 + x = 3x + 3`, `3x − 6 + x = 4x + 1`
  for (const B of NUM) for (const D of NUM) {
    if (Math.abs(D - B) > 12) continue;
    tryMake(out, 4, [n(B), x(1), x(1)], [x(2), n(D)], 'unmerged');
    for (const A of range(2, 5)) tryMake(out, 4, [x(A), n(B), x(1)], [x(A + 1), n(D)], 'unmerged');
  }
  // ordinary: Level 1-3's fractions, `4x + 1 = x + 5` (x alone on the right), and the zero case `3x + 4 = 4`
  for (const p of [...all(4, simple), ...all(4, toSimplify)]) out.push({ ...p, type: 'one', form: 'fraction' });
  for (const A of POS) for (const B of NUM) for (const D of NUM) tryMake(out, 4, [x(A), n(B)], [x(1), n(D)], 'fraction');
  for (const A of range(2, 6)) for (const B of NUM) tryMake(out, 4, [x(A), n(B)], [n(B)], 'zero');
  return out;
}
// Level 5's left sides: a group alone, a group and a number, a group and an x-term, the invisible −1 after an x-term or a number, a fraction
function level5Lefts() {
  const out = [];
  for (const f of [...range(-6, -2), ...range(2, 6)]) for (const c of SMALL) {
    out.push([g(f, c)]);
    for (const e of [-8, -5, -3, -1, 2, 4, 7]) out.push([g(f, c), n(e)]);
    for (const k of [-3, -1, 1, 2, 3]) out.push([g(f, c), x(k)]);
  }
  for (const c of SMALL) {
    for (const k of [2, 3, 4, 5, 6, 7]) out.push([x(k), minusOne(c)]);
    for (const e of [3, 5, 8, 10, 12]) out.push([n(e), minusOne(c)]);
    out.push([minusOne(c)]);
  }
  for (const [f, d] of LV_FRACTIONS) for (const a of [1, 2, 3, 4, 6, 8, 9]) for (const c of SMALL) {
    if ((f * a) % d || (f * c) % d) continue;
    out.push([g(f, c, a, d)]);
    out.push([g(-f, c, a, d)]);
  }
  return out;
}
const formOf5 = (left) => {
  const q = left.find((t) => t.k === 'g');
  return q.d > 1 ? 'fraction-factor' : q.hidden ? 'invisible-1' : q.f < 0 ? 'negative-factor' : 'factor';
};
// (the pool is thinned evenly, every 10th one-solution candidate and every 4th no-solution one, so a set is drawn quickly: about 35,000
// candidates, as many as Level 4; infinitely many and every 0 answer are all kept)
function level5() {
  const out = [];
  let nOne = 0;
  let nNone = 0;
  const keepEvery = (count, every) => count % every === 0;
  for (const left of level5Lefts()) {
    const form = formOf5(left);
    for (const side of [strangeRights(left), strangeRights(left, { numFirst: true }).filter(({ right }) => right[0].v < 0 || left.length > 1)]) {
      for (const { type, right } of side) if (type === 'all' || keepEvery(nNone++, 4)) tryMake(out, 5, left, right, form);
    }
    // one solution: a fraction or 0, the right side `Cx + D`
    const L = linear(left);
    for (const C of [...range(-9, -1), ...range(1, 9)]) {
      const k = L.a - C;
      if (Math.abs(k) < 2 || Math.abs(k) > 6) continue;
      for (const D of NUM) {
        const top = D - L.b;
        if (top !== 0 && top % k === 0) continue;                    // (a whole answer: not on this card)
        if (top !== 0 && !keepEvery(nOne++, 10)) continue;
        tryMake(out, 5, left, [x(C), n(D)], form);
      }
    }
  }
  return out;
}
const isType = (t) => (p) => p.type === t;
const fractionOne = (p) => p.type === 'one' && p.ans.n !== 0;
STRANGE_LEVELS[4] = {
  candidates: level4,
  groups: [
    { test: (p) => p.form === 'karl', count: 1 },
    // (both kinds always: one infinitely many and one no solution besides Karl's form, so a student must decide each time)
    { test: (p) => p.type === 'all' && p.form !== 'karl', count: 1 },
    { test: (p) => p.type === 'none' && p.form !== 'karl', count: 1 },
    { test: fractionOne, count: 1 },
    // (the zero case in every set: "solution is 0 is not the same as there is no solution", Karl's reflection question)
    { test: (p) => p.form === 'zero', count: 1 },
  ],
  first: 'karl',
  // (the shapes that need a step first, a combine or a distribute, come up more often than the plain signed ones)
  weight: (p) => (p.form === 'unmerged' || p.form === 'group' ? 4 : 1),
};
STRANGE_LEVELS[5] = {
  candidates: level5,
  groups: [
    { test: isType('none'), count: 1 },
    { test: isType('all'), count: 1 },
    { test: fractionOne, count: 1 },
    { test: (p) => p.type === 'one' && p.ans.n === 0, count: 1 },
    { test: (p) => p.type !== 'one' || p.ans.n !== 0, count: 1 },
  ],
};

const CACHE = {};
const candidatesOf = (level) => (CACHE[level] ??= STRANGE_LEVELS[level].candidates());
// (a zero's answer key is its equation, so the two zeros may repeat the answer and never the equation)
const answerKey = (p) => (!p.ans ? `${p.type}:${formatBoth(p)}` : p.ans.n === 0 ? `0:${formatBoth(p)}` : fracText(p.ans));
export function generateStrangeLevel(level, seed) {
  const spec = STRANGE_LEVELS[level];
  if (!spec) throw new Error(`Strange solutions level ${level} is not built yet`);
  const rng = mulberry32((seed ^ Math.imul(level + 1301, 0x9e3779b1)) >>> 0);
  const set = pickSet({ candidates: candidatesOf(level), groups: spec.groups, ...(spec.weight ? { weight: spec.weight } : {}), answerOf: answerKey, rng, label: `Strange solutions level ${level}` });
  if (!spec.first) return set;
  // (Level 4 starts with Karl's form; the rest stay shuffled)
  const at = set.findIndex((p) => p.form === spec.first);
  return [set[at], ...set.filter((_, i) => i !== at)];
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
