// Seeded Boxes & Circles problem generators (SPEC-BOXES.md §4). Pure logic, no DOM.
//
// Unlike Flip It there is no short list of every problem, so each level builds
// a few hundred random candidates from the seed, then fills groups in order
// (e.g. "2 with a coefficient of 1") with the shared `pickSet`, never reusing
// an answer. Everything comes from the seed, so a seed always gives the same set.

import { mulberry32, pickSet, shuffle, PROBLEMS_PER_LEVEL } from './generate.js';
import {
  makeTerm, makeExpression, formatExpression, formatAnswer, evaluate, effective, isX, needsRewrite, totalPieces,
} from './terms.js';

export const MAX_VALUE = 9;           // coefficients and numbers are 1 to 9
export const MAX_TERMS = 6;
export const SMALL_PIECES = 16;       // pieces to draw per problem in Levels 1–2
export const MAX_PIECES = 24;         // and in Levels 3–5
const SMALL_MAX = 5;                  // Levels 1–2 lean toward values up to 5
const CANDIDATES = 700;

const pick = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

// A value from lo to hi; with `lean`, usually 5 or less.
const value = (rng, lo, hi, lean) => (lean && rng() < 0.85 ? pick(rng, lo, Math.min(hi, SMALL_MAX)) : pick(rng, lo, hi));

// ---------- What a candidate is made of ----------

const kindsOf = (expr) => expr.terms.map((t) => t.kind);
export const switches = (kinds) => kinds.reduce((n, k, i) => n + (i > 0 && k !== kinds[i - 1] ? 1 : 0), 0);

// Variable terms and numbers, with at least one kind appearing twice, and
// interleaved so they don't come already grouped (at least 2 changes of kind).
function sampleKinds(rng, count) {
  for (let tries = 0; tries < 200; tries++) {
    const kinds = Array.from({ length: count }, () => (rng() < 0.5 ? 'x' : 'int'));
    const nx = kinds.filter((k) => k === 'x').length;
    if (nx === 0 || nx === count) continue;
    if (switches(kinds) < 2) continue;
    return kinds;
  }
  return count === 4 ? ['x', 'int', 'x', 'int'] : ['x', 'int', 'x', 'int', 'x'];
}

// Level rules: how a term's sign and size are chosen.
//   negatives: 'none' (all +), 'numbers' (− numbers only), 'any' (− x terms too)
//   one: a coefficient of 1 (a bare x) is allowed
//   subNeg: how many `− (−…)` terms, as [min, max]
const LEVEL_SHAPE = {
  1: { negatives: 'none', one: false, subNeg: [0, 0], lean: true, terms: [4, 5], cap: SMALL_PIECES },
  2: { negatives: 'numbers', one: false, subNeg: [0, 0], lean: true, terms: [4, 5], cap: SMALL_PIECES },
  3: { negatives: 'any', one: true, subNeg: [0, 0], lean: false, terms: [4, 5], cap: MAX_PIECES },
  4: { negatives: 'any', one: true, subNeg: [1, 2], lean: false, terms: [4, 5], cap: MAX_PIECES },
  5: { negatives: 'any', one: true, subNeg: [0, 2], lean: false, terms: [5, 6], cap: MAX_PIECES },
};

function candidate(level, rng) {
  const shape = LEVEL_SHAPE[level];
  const count = pick(rng, shape.terms[0], shape.terms[1]);
  const kinds = sampleKinds(rng, count);
  const subNegCount = pick(rng, shape.subNeg[0], shape.subNeg[1]);
  const later = Array.from({ length: count - 1 }, (_, i) => i + 1);
  const subNegAt = new Set(shuffle(later, rng).slice(0, subNegCount));

  const terms = kinds.map((kind, i) => {
    const lo = kind === 'x' && !shape.one ? 2 : 1;
    const v = value(rng, lo, MAX_VALUE, shape.lean);
    // A bare x (coefficient 1) is common enough to meet in a set of five.
    const mag = kind === 'x' && shape.one && rng() < 0.25 ? 1 : v;
    // Level 2 only subtracts numbers after the first term; a negative first term waits for Level 3.
    const negative = shape.negatives === 'none' ? false
      : shape.negatives === 'numbers' ? i > 0 && kind === 'int' && rng() < 0.45
        : rng() < 0.4;
    if (subNegAt.has(i)) return makeTerm(kind, '-', -mag);                 // − (−7)
    if (i === 0) return makeTerm(kind, '+', negative ? -mag : mag);        // a negative first term keeps its sign
    return makeTerm(kind, negative ? '-' : '+', mag);                      // − 5 is a negative number
  });
  return makeExpression(terms);
}

// ---------- Facts about a candidate (the mix rules use these) ----------

const negNumbers = (expr) => expr.terms.filter((t) => !isX(t) && effective(t) < 0).length;
const posNumbers = (expr) => expr.terms.filter((t) => !isX(t) && effective(t) > 0).length;
const xSigns = (expr) => {
  const xs = expr.terms.filter(isX).map(effective);
  return { pos: xs.filter((c) => c > 0).length, neg: xs.filter((c) => c < 0).length };
};
export const hasBareX = (expr) => expr.terms.some((t) => isX(t) && Math.abs(effective(t)) === 1);
export const boxesCancel = (expr) => { const s = xSigns(expr); return s.pos > 0 && s.neg > 0; };
export const numbersCancel = (expr) => posNumbers(expr) > 0 && negNumbers(expr) > 0;
export const hasSubNeg = (expr) => expr.terms.some(needsRewrite);
export const hasNegativeX = (expr) => xSigns(expr).neg > 0;
export const hasNegativeNumber = (expr) => negNumbers(expr) > 0;

// One kind cancels completely, leaving only a box term or only a number.
const oneKindGone = (expr) => {
  const { x, n } = evaluate(expr);
  return (x === 0) !== (n === 0);
};
const bothGone = (expr) => {
  const { x, n } = evaluate(expr);
  return x === 0 && n === 0;
};

// Base rule for a level: what every candidate must satisfy.
const BASE = {
  1: () => true,
  2: (e) => hasNegativeNumber(e),
  3: (e) => hasNegativeX(e),
  4: () => true,
  5: () => true,
};

const answerOf = (expr) => formatAnswer(evaluate(expr));

// ---------- The levels ----------

const any = () => true;
const not = (test) => (e) => !test(e);
const both = (a, b) => (e) => a(e) && b(e);

// Groups: how many problems of each kind. A problem fills one group.
// `keep` leaves both kinds in the answer; one kind may vanish (the answer is
// just `3x` or just `5`) in at most one problem a set, in Levels 3–5.
function groupsFor(level, rng) {
  const keep = not(oneKindGone);
  const vanish = rng() < 0.5 ? 1 : 0; // at most 1 problem per set, Levels 3–5
  const free = (n) => ({ test: keep, count: n });
  switch (level) {
    case 1:
      return [free(PROBLEMS_PER_LEVEL)];
    case 2:
      return [
        { test: both(numbersCancel, keep), count: 2 },
        free(PROBLEMS_PER_LEVEL - 2),
      ];
    case 3:
      return [
        { test: both(hasBareX, keep), count: 2 },
        { test: both(boxesCancel, keep), count: 2 },
        ...(vanish ? [{ test: oneKindGone, count: 1 }, free(0)] : [free(1)]),
      ];
    case 4:
      return [
        { test: both(hasBareX, keep), count: 1 },
        { test: both(boxesCancel, keep), count: 2 },
        ...(vanish ? [{ test: oneKindGone, count: 1 }, free(1)] : [free(2)]),
      ];
    case 5: // some problems subtract a negative, and some have nothing to rewrite
      return [
        { test: both(hasSubNeg, keep), count: 2 },
        { test: both(not(hasSubNeg), keep), count: 2 },
        vanish ? { test: oneKindGone, count: 1 } : free(1),
      ];
    default:
      throw new Error(`Unknown level: ${level}`);
  }
}

export const TERM_LEVELS = Object.keys(LEVEL_SHAPE).map(Number);

// Five expressions for a level, the same every time for one seed.
export function generateTermLevel(level, seed) {
  const shape = LEVEL_SHAPE[level];
  if (!shape) throw new Error(`Unknown level: ${level}`);
  const rng = mulberry32((seed ^ (level * 0x9e3779b1)) >>> 0);
  const seen = new Set();
  const candidates = [];
  for (let i = 0; i < CANDIDATES; i++) {
    const expr = candidate(level, rng);
    const text = formatExpression(expr);
    if (seen.has(text) || bothGone(expr) || totalPieces(expr) > shape.cap || !BASE[level](expr)) continue;
    if (level === 4 && !hasSubNeg(expr)) continue; // every Level 4 problem subtracts a negative
    seen.add(text);
    candidates.push(expr);
  }
  return pickSet({
    candidates,
    groups: groupsFor(level, rng),
    answerOf,
    rng,
    label: `Boxes & Circles level ${level}`,
  });
}
