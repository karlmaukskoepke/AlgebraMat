// Seeded problem sets for the Lasso pack's 7 levels (SPEC-LASSO.md §4).
// Same machinery and rules as Flip It: every allowed problem is enumerated,
// shuffled with a seeded RNG, and picked into required groups without
// repeating an answer. No zero anywhere.

import { mulberry32, pickSet, PROBLEMS_PER_LEVEL } from './generate.js';
import { makeGroups, evaluateGroups, groupTotal } from './groups.js';

export const LASSO_LEVEL_COUNT = 7;
export const MAX_GROUPS = 5;        // whole-number lassos
export const MAX_IN_GROUP = 5;      // counters per lasso (Levels 1 and 3)
export const MAX_COUNTERS = 20;     // |A·B| for whole-number groups
export const MAX_SINGLE_GROUP = 8;  // Level 2's one lasso: B up to ±8
// What a fraction can be taken of, by denominator (Karl, 2026-10-03): the number is shared between the parts, so it
// can be bigger than the parts' counters would suggest. Thirds up to 18, fourths 24, fifths 30, sixths 24, eighths 24.
export const MAX_DEAL_BY_DENOMINATOR = { 2: 16, 3: 18, 4: 24, 5: 30, 6: 24, 8: 24 };
export const DENOMINATORS = Object.keys(MAX_DEAL_BY_DENOMINATOR).map(Number);
export const MAX_DEAL = Math.max(...Object.values(MAX_DEAL_BY_DENOMINATOR)); // counters to deal out in fraction problems

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const signedRange = (max) => [...range(1, max).map((v) => -v), ...range(1, max)];

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const any = () => true;
const posB = (p) => p.inside.value > 0;
const negB = (p) => p.inside.value < 0;
const even = () => 1;

// Early levels lean small: problems with at most 10 counters are 4× as likely.
const SMALL_WEIGHT = 4;
const preferSmall = (p) => (Math.abs(groupTotal(p)) * p.count.d <= 10 ? SMALL_WEIGHT : 1);

// A mix of positive and negative B: at least 2 of each, then 1 more of either.
const bMix = [
  { test: posB, count: 2 },
  { test: negB, count: 2 },
  { test: any, count: 1 },
];

function wholeGroups(neg) {
  const out = [];
  for (const n of range(2, MAX_GROUPS)) {
    for (const b of signedRange(MAX_IN_GROUP)) {
      if (Math.abs(n * b) <= MAX_COUNTERS) out.push(makeGroups({ neg, n }, b));
    }
  }
  return out;
}

function fractionGroups(neg, unit) {
  const out = [];
  for (const d of DENOMINATORS) {
    // Lowest terms only (2/3, not 4/6): the friendly fractions from the notes.
    const numerators = unit ? [1] : range(2, d - 1).filter((n) => gcd(n, d) === 1);
    for (const n of numerators) {
      for (const b of signedRange(MAX_DEAL_BY_DENOMINATOR[d])) {
        if (b % d === 0) out.push(makeGroups({ neg, n, d }, b));
      }
    }
  }
  return out;
}

export const LASSO_LEVELS = {
  // Positive groups: 3(−2), 4(3).
  1: { weight: preferSmall, build: () => ({ candidates: wholeGroups(false), groups: bMix }) },

  // Opposite of one group: −(−5), −(4), −1(−3). At least 2 hide the 1.
  2: {
    weight: preferSmall,
    build: () => {
      const candidates = [];
      for (const b of signedRange(MAX_SINGLE_GROUP)) {
        candidates.push(makeGroups({ neg: true, n: 1 }, b, { hidden1: true }));
        candidates.push(makeGroups({ neg: true, n: 1 }, b));
      }
      return {
        candidates,
        groups: [
          { test: (p) => p.hidden1, count: 2 },
          { test: posB, count: 1 },
          { test: negB, count: 1 },
          { test: any, count: 1 },
        ],
      };
    },
  },

  // Opposite of several groups: −3(5), −2(−4).
  3: { build: () => ({ candidates: wholeGroups(true), groups: bMix }) },

  // Unit fraction of a group: 1/4(−16) → here |B| ≤ 12, e.g. 1/4(−12).
  4: { build: () => ({ candidates: fractionGroups(false, true), groups: bMix }) },
  5: { build: () => ({ candidates: fractionGroups(true, true), groups: bMix }) },

  // Fraction of a group: 2/3(−6), 4/5(−10).
  6: { build: () => ({ candidates: fractionGroups(false, false), groups: bMix }) },
  7: { build: () => ({ candidates: fractionGroups(true, false), groups: bMix }) },
};

export function generateLassoLevel(level, seed) {
  const spec = LASSO_LEVELS[level];
  if (!spec) throw new Error(`Unknown Lasso level: ${level}`);
  // Mix the level into the seed so levels that differ only by an opposite
  // (1 and 3, 4 and 5, 6 and 7) don't mirror each other under one ?seed= link.
  const rng = mulberry32((seed ^ Math.imul(level, 0x9e3779b1)) >>> 0);
  const { candidates, groups } = spec.build(rng);
  return pickSet({
    candidates, groups, weight: spec.weight ?? even, answerOf: evaluateGroups, rng, label: `Lasso level ${level}`,
  });
}

export { PROBLEMS_PER_LEVEL };
