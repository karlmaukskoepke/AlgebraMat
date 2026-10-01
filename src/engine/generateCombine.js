// Seeded problem sets for the Combine it pack's 4 levels (SPEC-COMBINE.md §2) and Flip It's
// mixed Level 5 (§4). Same machinery and rules as the other packs: candidates are shuffled with
// a seeded RNG and picked into required groups without repeating an answer.

import { mulberry32, pickSet, PROBLEMS_PER_LEVEL } from './generate.js';
import { makeProblem, evaluate as evaluateTwo } from './expr.js';
import { formatExpression } from './terms.js';
import { sumExpression, intTerm, total, counterTotal, subtracted, combineFirst, meeting } from './combine.js';
import { makeExpression } from './terms.js';

export const COMBINE_LEVEL_COUNT = 4;
export const MAX_SMALL = 12;       // Levels 1 and 2: the numbers 1 to 12
export const MAX_MANY = 9;         // Level 3 and Flip It's Level 5: the numbers 1 to 9 on 3 or 4 terms
export const MAX_COUNTERS = 20;    // counters drawn for 3 or 4 terms
export const BIG_MIN = 11;         // Level 4: 11 to 60
export const BIG_MAX = 60;

const CANDIDATES = 4000;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const any = () => true;
const even = () => 1;

// ---------- Levels 1 and 2: two terms, Flip It's problem shape ----------

const SMALL = range(1, 6);
const preferSmall = (p) => (Math.abs(p.left.value) <= 6 && Math.abs(p.right.value) <= 6 ? 6 : 1);

function twoTerms(keep) {
  const out = [];
  const values = [...range(1, MAX_SMALL).map((v) => -v), ...range(1, MAX_SMALL)];
  for (const a of values) for (const b of values) {
    const p = makeProblem(a, '+', b);
    if (keep(a, b)) out.push(p);
  }
  return out;
}

// ---------- Levels 3, 4 and Flip It's Level 5: longer expressions, sampled ----------

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const signed = (rng, lo, hi) => (rng() < 0.5 ? -1 : 1) * (lo + Math.floor(rng() * (hi - lo + 1)));

function sampled(build, rng, ok) {
  const seen = new Set();
  const out = [];
  for (let i = 0; i < CANDIDATES; i++) {
    const expr = build(rng);
    const text = formatExpression(expr);
    if (seen.has(text) || !ok(expr)) continue;
    seen.add(text);
    out.push(expr);
  }
  return out;
}

const hasBothSigns = (expr) => expr.terms.some((t) => t.value > 0) && expr.terms.some((t) => t.value < 0);
const termCount = (expr) => expr.terms.length;

const LEVEL_3 = {
  weight: (e) => (counterTotal(e) <= 12 ? 4 : 1),
  build: (rng) => {
    const n = 3 + Math.floor(rng() * 2);
    return sumExpression(Array.from({ length: n }, () => signed(rng, 1, MAX_MANY)));
  },
  ok: (e) => hasBothSigns(e) && counterTotal(e) <= MAX_COUNTERS && total(e) !== 0,
  groups: () => [
    { test: (e) => total(e) > 0 && termCount(e) === 3, count: 1 },
    { test: (e) => total(e) > 0 && termCount(e) === 4, count: 1 },
    { test: (e) => total(e) < 0 && termCount(e) === 3, count: 1 },
    { test: (e) => total(e) < 0 && termCount(e) === 4, count: 1 },
    { test: any, count: 1 },
  ],
};

// Level 4: two terms (a party or a battle), or three where two share a sign and one doesn't.
const bigTwo = (rng) => sumExpression([signed(rng, BIG_MIN, BIG_MAX), signed(rng, BIG_MIN, BIG_MAX)]);
const bigThree = (rng) => {
  const same = rng() < 0.5 ? 1 : -1;
  const values = [same * (BIG_MIN + Math.floor(rng() * (BIG_MAX - BIG_MIN + 1))),
    same * (BIG_MIN + Math.floor(rng() * (BIG_MAX - BIG_MIN + 1))),
    -same * (BIG_MIN + Math.floor(rng() * (BIG_MAX - BIG_MIN + 1)))];
  // The odd one out can be anywhere, so students have to look for the pair.
  const at = Math.floor(rng() * 3);
  const odd = values.pop();
  values.splice(at, 0, odd);
  return sumExpression(values);
};
const isParty = (e) => termCount(e) === 2 && meeting(e.terms[0].value, e.terms[1].value) === 'party';
const isBattle = (e) => termCount(e) === 2 && meeting(e.terms[0].value, e.terms[1].value) === 'battle';

const LEVEL_4 = {
  build: (rng) => (rng() < 0.45 ? bigThree(rng) : bigTwo(rng)),
  ok: (e) => total(e) !== 0 && (termCount(e) === 2 || combineFirst(e) !== null),
  groups: () => [
    { test: isParty, count: 1 },
    { test: isBattle, count: 1 },
    { test: (e) => termCount(e) === 3, count: 2 },
    { test: any, count: 1 },
  ],
};

// ---------- The levels ----------

export const COMBINE_LEVELS = {
  // A positive and a negative: all battles. At least 2 positive and 2 negative answers.
  1: {
    weight: preferSmall,
    build: () => ({
      candidates: twoTerms((a, b) => Math.sign(a) !== Math.sign(b) && a + b !== 0),
      groups: [
        { test: (p) => evaluateTwo(p) > 0, count: 2 },
        { test: (p) => evaluateTwo(p) < 0, count: 2 },
        { test: any, count: 1 },
      ],
    }),
    answerOf: evaluateTwo,
  },

  // Negatives and negatives: all parties.
  2: {
    weight: preferSmall,
    build: () => ({ candidates: twoTerms((a, b) => a < 0 && b < 0), groups: [{ test: any, count: PROBLEMS_PER_LEVEL }] }),
    answerOf: evaluateTwo,
  },

  3: { answerOf: total, sampled: LEVEL_3 },
  4: { answerOf: total, sampled: LEVEL_4 },
};

export function generateCombineLevel(level, seed) {
  const spec = COMBINE_LEVELS[level];
  if (!spec) throw new Error(`Unknown Combine it level: ${level}`);
  // Mix the level into the seed so levels don't mirror each other under one ?seed= link.
  const rng = mulberry32((seed ^ Math.imul(level, 0x9e3779b1)) >>> 0);
  if (spec.sampled) {
    const { build, ok, groups, weight } = spec.sampled;
    return pickSet({
      candidates: sampled(build, rng, ok), groups: groups(), weight: weight ?? even, answerOf: spec.answerOf, rng, label: `Combine it level ${level}`,
    });
  }
  const { candidates, groups } = spec.build();
  return pickSet({ candidates, groups, weight: spec.weight ?? even, answerOf: spec.answerOf, rng, label: `Combine it level ${level}` });
}

// ---------- Flip It's Level 5: three or four integers, adding and subtracting ----------

const MIXED_SEED = 0x51f15e;

const mixedBuild = (rng) => {
  const n = 3 + Math.floor(rng() * 2);
  const terms = Array.from({ length: n }, (_, i) => {
    const op = i === 0 ? '+' : (rng() < 0.5 ? '-' : '+');
    return intTerm(op, signed(rng, 1, MAX_MANY), op === '-');
  });
  return makeExpression(terms);
};

export function generateFlipMixed(seed) {
  const rng = mulberry32((seed ^ MIXED_SEED) >>> 0);
  const ok = (e) => counterTotal(e) <= MAX_COUNTERS;
  return pickSet({
    candidates: sampled(mixedBuild, rng, ok),
    groups: [
      { test: (e) => subtracted(e).length === 0, count: 1 },     // nothing to rewrite
      { test: (e) => subtracted(e).length === 1, count: 1 },
      { test: (e) => subtracted(e).length >= 2, count: 2 },
      { test: (e) => e.terms[0].value < 0, count: 1 },           // a negative first number
    ],
    weight: (e) => (counterTotal(e) <= 12 ? 4 : 1),
    answerOf: total,
    rng,
    label: 'Flip It level 5',
  });
}

export { PROBLEMS_PER_LEVEL };
