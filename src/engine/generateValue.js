// Seeded problem sets for the Value it pack (SPEC-VALUE.md §2). Every problem is small enough to draw as filled boxes:
// at most 5 boxes, at most 24 counters inside them. Levels: positive values in positive expressions; negative values
// in positive expressions; everything mixed (negative terms, positive and negative values); fractional coefficients
// (x is a multiple of the bottom number, so the answer is a whole number).

import { mulberry32, pickSet, PROBLEMS_PER_LEVEL } from './generate.js';
import { makeValue, xTerm, numTerm, answerText, den } from './value.js';
import { isX, effective } from './terms.js';

export const VALUE_LEVEL_COUNT = 4;
export const MAX_BOXES = 5;
export const MAX_COUNTERS = 24;

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const drawable = (p) => p.expr.terms.every((t) => !isX(t) || (den(t) > 1
  ? Math.abs(p.x) <= MAX_COUNTERS
  : Math.abs(t.value) <= MAX_BOXES && Math.abs(t.value * p.x) <= MAX_COUNTERS));

// The forms, as term lists for a coefficient a, a number b and the value.
const FORMS = {
  'ax': (a, b, d) => [xTerm('+', a, d)],
  'ax+b': (a, b, d) => [xTerm('+', a, d), numTerm('+', b)],
  'b+ax': (a, b, d) => [numTerm('+', b), xTerm('+', a, d)],
  'ax-b': (a, b, d) => [xTerm('+', a, d), numTerm('-', b)],
  'b-ax': (a, b, d) => [numTerm('+', b), xTerm('-', a, d)],
  '-ax+b': (a, b, d) => [xTerm('+', -a, d), numTerm('+', b)],
  '-ax-b': (a, b, d) => [xTerm('+', -a, d), numTerm('-', b)],
};

function candidates(forms, values, { aMin = 2, aMax = 5, bMax = 9 } = {}) {
  const out = [];
  for (const form of forms) {
    for (const a of range(aMin, aMax)) {
      for (const b of range(1, bMax)) {
        if (form === 'ax' && b > 1) continue;
        for (const x of values) {
          const p = makeValue(FORMS[form](a, b), x);
          p.form = form;
          if (drawable(p)) out.push(p);
        }
      }
    }
  }
  return out;
}

// Fractional coefficients: top and bottom numbers (proper fractions), and for each bottom number the values of x that are
// multiples of it (up to 24 counters in the picture), both signs.
const FRACTIONS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5]];
const multiplesOf = (d) => range(1, Math.floor(MAX_COUNTERS / d)).flatMap((k) => [k * d, -k * d]);

function fractionCandidates(forms) {
  const out = [];
  for (const form of forms) {
    for (const [n, d] of FRACTIONS) {
      for (const b of range(1, 9)) {
        if (form === 'ax' && b > 1) continue;
        for (const x of multiplesOf(d)) {
          const p = makeValue(FORMS[form](n, b, d), x);
          p.form = form;
          out.push(p);
        }
      }
    }
  }
  return out.filter(drawable);
}

const positives = range(2, 9);
const negatives = range(-9, -2);
const either = [...negatives, ...positives];
const bigCoefficient = (p) => p.expr.terms.some((t) => isX(t) && Math.abs(t.value) > 1);
const smallAnswers = (p) => (Math.abs(Number(answerText(p).replace('−', '-'))) <= 30 ? 3 : 1);

export const VALUE_LEVELS = {
  // 1: positive values in positive expressions.
  1: {
    candidates: () => candidates(['ax', 'ax+b', 'b+ax'], positives),
    groups: [
      { test: (p) => p.form === 'ax+b' && bigCoefficient(p), count: 1 },
      { test: (p) => p.form === 'b+ax' && bigCoefficient(p), count: 1 },
      { test: (p) => p.form === 'ax' && bigCoefficient(p), count: 1 },
      { test: bigCoefficient, count: 1 },
      { test: () => true, count: 1 },
    ],
  },
  // 2: negative values in positive expressions.
  2: {
    candidates: () => candidates(['ax', 'ax+b', 'b+ax'], negatives),
    groups: [
      { test: (p) => p.form === 'ax+b' && bigCoefficient(p), count: 1 },
      { test: (p) => p.form === 'b+ax' && bigCoefficient(p), count: 1 },
      { test: (p) => p.form === 'ax' && bigCoefficient(p), count: 1 },
      { test: bigCoefficient, count: 1 },
      { test: () => true, count: 1 },
    ],
  },
  // 3: everything mixed.
  3: {
    candidates: () => candidates(['ax+b', 'ax-b', 'b-ax', '-ax+b', '-ax-b'], either, { aMin: 1 }),
    groups: [
      { test: (p) => p.form === 'b-ax' && p.x < 0, count: 1 },
      { test: (p) => (p.form === '-ax+b' || p.form === '-ax-b') && p.x < 0, count: 1 },
      { test: (p) => p.form === 'ax-b' && p.x < 0, count: 1 },
      { test: (p) => p.x > 0 && p.expr.terms.some((t) => isX(t) && effective(t) < 0), count: 1 },
      { test: () => true, count: 1 },
    ],
  },
};

const negativeCoefficient = (p) => p.expr.terms.some((t) => isX(t) && effective(t) < 0);

VALUE_LEVELS[4] = {
  candidates: () => fractionCandidates(['ax', 'ax+b', 'b+ax', 'ax-b', 'b-ax', '-ax+b', '-ax-b']),
  groups: [
    { test: (p) => p.x < 0 && !negativeCoefficient(p), count: 1 },
    { test: (p) => p.x > 0 && negativeCoefficient(p), count: 1 },
    { test: (p) => p.x < 0 && negativeCoefficient(p), count: 1 },
    { test: (p) => p.x > 0 && !negativeCoefficient(p) && p.form !== 'ax', count: 1 },
    { test: () => true, count: 1 },
  ],
};

export function generateValueLevel(level, seed) {
  const spec = VALUE_LEVELS[level];
  if (!spec) throw new Error(`Unknown Value it level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level, 0x85ebca6b)) >>> 0);
  return pickSet({
    candidates: spec.candidates(), groups: spec.groups, weight: smallAnswers, answerOf: answerText, rng, label: `Value it level ${level}`,
  });
}

export { PROBLEMS_PER_LEVEL };
