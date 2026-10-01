// Seeded problem sets for the Groups of Terms pack's 8 levels (SPEC-GROUPS-OF-TERMS.md §4).
// Same machinery and rules as the other packs: every allowed problem is
// enumerated, shuffled with a seeded RNG, and picked into required groups
// without repeating an answer. No zero anywhere.

import { mulberry32, pickSet, PROBLEMS_PER_LEVEL } from './generate.js';
import { makeTermGroups, evaluateTermGroups, pieceTotal, isNumberFirst, isOpposite, isFraction } from './termGroups.js';
import { formatAnswer } from './terms.js';

export const TERM_GROUPS_LEVEL_COUNT = 8;
export const MAX_GROUPS = 5;       // whole-number ovals
export const MAX_BOXES = 4;        // boxes in one group
export const MAX_COUNTERS = 5;     // counters in one group
export const MAX_PIECES = 20;      // all the pieces drawn for a whole-number problem
export const MAX_DEAL = 14;        // pieces to deal out in a fraction problem
export const MAX_DENOMINATOR = 6;

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const x = (value) => ({ kind: 'x', value });
const num = (value) => ({ kind: 'int', value });
const any = () => true;
const even = () => 1;
const hasNegative = (p) => p.inside.some((t) => t.value < 0);
const allPositive = (p) => !hasNegative(p);
const numberFirst = (p) => isNumberFirst(p);

// Early levels lean small: problems with at most 12 pieces are 4× as likely.
const SMALL_WEIGHT = 4;
const preferSmall = (p) => (pieceTotal(p) <= 12 ? SMALL_WEIGHT : 1);

// The signs a level allows for C (the x term) and D (the number): each is 1 or −1.
const SIGNS = {
  allPositive: [[1, 1]],
  negativeNumber: [[1, -1]],
  negativeX: [[-1, 1], [-1, -1]],
  anySigns: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
};

// Whole-number A. `neg` is the opposite; `withOne` also builds −(B) / −1(B) for A = 1.
function wholeProblems({ neg, signs, orders = ['x'], single = false }) {
  const out = [];
  const counts = neg && single ? [1, ...range(2, MAX_GROUPS)] : range(2, MAX_GROUPS);
  for (const n of counts) {
    for (const [sc, sd] of signs) {
      for (const c of range(1, MAX_BOXES)) {
        for (const d of range(1, MAX_COUNTERS)) {
          const terms = { x: x(sc * c), int: num(sd * d) };
          for (const order of orders) {
            const inside = order === 'x' ? [terms.x, terms.int] : [terms.int, terms.x];
            const p = makeTermGroups({ neg, n }, inside);
            if (pieceTotal(p) > MAX_PIECES) continue;
            out.push(p);
            if (neg && n === 1) out.push(makeTermGroups({ neg, n }, inside, { hidden1: true }));
          }
        }
      }
    }
  }
  return out;
}

// Fraction A: the denominator divides both C and D, in lowest terms (2/3, not 4/6).
function fractionProblems({ neg, unit, orders = ['x'] }) {
  const out = [];
  for (const d of range(2, MAX_DENOMINATOR)) {
    const numerators = unit ? [1] : range(2, d - 1).filter((n) => gcd(n, d) === 1);
    for (const n of numerators) {
      for (const [sc, sd] of SIGNS.anySigns) {
        for (const c of range(1, 12).filter((v) => v % d === 0)) {
          for (const dd of range(1, 12).filter((v) => v % d === 0)) {
            if (c + dd > MAX_DEAL) continue;
            const terms = { x: x(sc * c), int: num(sd * dd) };
            for (const order of orders) {
              out.push(makeTermGroups({ neg, n, d }, order === 'x' ? [terms.x, terms.int] : [terms.int, terms.x]));
            }
          }
        }
      }
    }
  }
  return out;
}

const mixSigns = [
  { test: hasNegative, count: 3 },
  { test: allPositive, count: 1 },
  { test: any, count: 1 },
];

export const TERM_GROUPS_LEVELS = {
  // A positive, B all positive: 3(2x + 1).
  1: { weight: preferSmall, build: () => ({ candidates: wholeProblems({ neg: false, signs: SIGNS.allPositive }), groups: [{ test: any, count: 5 }] }) },

  // A positive, B has a negative number: 3(2x − 1).
  2: { weight: preferSmall, build: () => ({ candidates: wholeProblems({ neg: false, signs: SIGNS.negativeNumber }), groups: [{ test: any, count: 5 }] }) },

  // A positive, B has a negative x term (the number either sign): 3(−x + 2), 2(−2x − 1).
  3: { weight: preferSmall, build: () => ({ candidates: wholeProblems({ neg: false, signs: SIGNS.negativeX }), groups: [{ test: any, count: 5 }] }) },

  // A negative, B all positive: −2(x + 4). At least 2 hide the 1: −(x + 3).
  4: {
    weight: preferSmall,
    build: () => ({
      candidates: wholeProblems({ neg: true, signs: SIGNS.allPositive, single: true }),
      groups: [{ test: (p) => p.hidden1, count: 2 }, { test: any, count: 3 }],
    }),
  },

  // ★ Challenge: A negative, B with negatives, and the number can come first. At least 2 number-first.
  5: {
    weight: preferSmall,
    build: () => ({
      candidates: wholeProblems({ neg: true, signs: SIGNS.anySigns, orders: ['x', 'int'], single: true }).filter(hasNegative),
      groups: [{ test: numberFirst, count: 2 }, { test: (p) => !numberFirst(p), count: 1 }, { test: any, count: 2 }],
    }),
  },

  // Unit fraction of a group: 1/2(4x + 6). Fraction levels mix signs.
  6: { build: () => ({ candidates: fractionProblems({ neg: false, unit: true }), groups: mixSigns }) },

  // Fraction of a group: 2/3(3x − 6).
  7: { build: () => ({ candidates: fractionProblems({ neg: false, unit: false }), groups: mixSigns }) },

  // ★ Challenge: negative fractions, and the number can come first.
  8: {
    build: () => ({
      candidates: fractionProblems({ neg: true, unit: false, orders: ['x', 'int'] }).concat(fractionProblems({ neg: true, unit: true, orders: ['x', 'int'] })),
      groups: [{ test: numberFirst, count: 2 }, { test: (p) => !numberFirst(p), count: 1 }, { test: hasNegative, count: 1 }, { test: any, count: 1 }],
    }),
  },
};

// One answer key per problem, so no set repeats an answer.
export const answerKey = (p) => formatAnswer(evaluateTermGroups(p));

export function generateTermGroupsLevel(level, seed) {
  const spec = TERM_GROUPS_LEVELS[level];
  if (!spec) throw new Error(`Unknown Groups of Terms level: ${level}`);
  // Mix the level into the seed so levels that differ only a little don't mirror each other under one ?seed= link.
  const rng = mulberry32((seed ^ Math.imul(level, 0x9e3779b1)) >>> 0);
  const { candidates, groups } = spec.build(rng);
  return pickSet({
    candidates, groups, weight: spec.weight ?? even, answerOf: answerKey, rng, label: `Groups of Terms level ${level}`,
  });
}

export { PROBLEMS_PER_LEVEL, isOpposite, isFraction };
