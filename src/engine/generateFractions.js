// Seeded problem sets for Fractions of x (Build AA): six saved levels, shown as saved (no walkthrough). Five problems a level, no repeated
// answers or equations, whole answers (never 0 or ±1, at most 36 in size), a whole part (b divisible by p), at most 6 parts. Every problem
// is verified by substitution when it is made (makeFracX).
//   L1  ⅓x = b              unit fractions, visual first (positive)
//   L2  x/q = b, ⅓x = b     unit fractions, the algebraic way: both forms (the first problem is ⅓x, for the one-time instruction)
//   L3  ⅔x = b              non-unit fractions, visual first (positive)
//   L4  −⅔x = b, ⅔x = −b    negatives (Flip everything live)
//   L5  b = ⅔x              x on the right, with the negative twins (Trade places live)
//   L6  everything, the division forms `2x/3` included

import { mulberry32, pickSet } from './generate.js';
import { makeFracX, slipValuesOf, gcd } from './fractionsX.js';
import { substitutionLines } from './solveTerms.js';

export const FRACTIONS_LEVELS = 6;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// every problem with the fractions `tops` over `qs`, |x| from minX to 36, |b| at most maxB, each sign, side and form asked for
function candidates({ unit, qs = [2, 3, 4, 5, 6], minX = 4, maxB = 12, negs = [false], xSigns = [1], sides = [false], forms = ['times'] }) {
  const out = [];
  for (const q of qs) {
    for (const p of range(1, q - 1)) {
      if (gcd(p, q) !== 1 || (unit === true && p !== 1) || (unit === false && p === 1)) continue;
      for (let m = q; m <= 36; m += q) {
        if (m < minX) continue;
        for (const sx of xSigns) {
          for (const neg of negs) {
            const x = sx * m;
            const b = ((neg ? -p : p) * x) / q;
            if (Math.abs(b) > maxB || Math.abs(b) < 2) continue;
            if (p > 1 && Math.abs(b) === p) continue;                      // (one part of 1: the model's parts would be ones)
            for (const mirror of sides) for (const form of forms) out.push(makeFracX({ p, q, neg, x, mirror, form }));
          }
        }
      }
    }
  }
  return out;
}
const g = (test, count = 1) => ({ test, count });
const any = (count = 1) => ({ test: () => true, count });
const posB = (p) => p.b > 0;
const negB = (p) => p.b < 0;
const unitP = (p) => p.p === 1;

export const LEVEL_SPECS = {
  1: { candidates: () => candidates({ unit: true }), groups: [g((p) => p.q === 2), g((p) => p.q === 3), g((p) => p.q >= 4), any(2)] },
  2: {
    candidates: () => candidates({ unit: true, forms: ['times', 'over'] }),
    groups: [g((p) => p.form === 'times'), g((p) => p.form === 'over', 2), g((p) => p.form === 'times'), any()],
    first: (p) => p.form === 'times',
  },
  3: { candidates: () => candidates({ unit: false, maxB: 15 }), groups: [g((p) => p.q === 3), g((p) => p.q === 4 || p.q === 5), g((p) => p.p >= 3), any(2)] },
  4: {
    candidates: () => [
      ...candidates({ unit: null, maxB: 15, negs: [true], xSigns: [1, -1] }),
      ...candidates({ unit: null, maxB: 15, negs: [false], xSigns: [-1] }),
    ],
    groups: [g((p) => p.neg && posB(p) && !unitP(p)), g((p) => p.neg && negB(p)), g((p) => !p.neg && negB(p) && !unitP(p)), g((p) => !p.neg && negB(p)), g(unitP)],
  },
  5: {
    candidates: () => candidates({ unit: null, maxB: 15, negs: [false, true], xSigns: [1, -1], sides: [true] }),
    groups: [g((p) => !p.neg && posB(p) && !unitP(p)), g((p) => p.neg && posB(p)), g((p) => !p.neg && negB(p)), g((p) => p.neg && negB(p)), any()],
  },
  6: {
    candidates: () => candidates({ unit: null, maxB: 15, negs: [false, true], xSigns: [1, -1], sides: [false, true], forms: ['times', 'over'] }),
    groups: [
      g((p) => p.form === 'over' && !unitP(p) && !p.mirror), g((p) => p.form === 'over' && unitP(p)), g((p) => p.form === 'times' && p.neg),
      g((p) => p.mirror && negB(p)), g((p) => p.form === 'times' && !unitP(p) && posB(p)),
    ],
  },
};

const sameEq = (a, b) => a.p === b.p && a.q === b.q && a.neg === b.neg && a.b === b.b && a.mirror === b.mirror && a.form === b.form;

export function generateFractionsLevel(level, seed) {
  const spec = LEVEL_SPECS[level];
  if (!spec) throw new Error(`Unknown Fractions of x level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level + 811, 0x9e3779b1)) >>> 0);
  const set = pickSet({ candidates: spec.candidates(), groups: spec.groups, answerOf: (p) => p.x, rng, label: `Fractions of x level ${level}` });
  // (Level 2's one-time instruction is about tapping `⅓x`: its first problem is in that form)
  if (spec.first && !spec.first(set[0])) {
    const i = set.findIndex(spec.first);
    [set[0], set[i]] = [set[i], set[0]];
  }
  for (let i = 0; i < set.length; i++) for (let j = 0; j < i; j++) if (sameEq(set[i], set[j])) throw new Error('repeated equation');
  return set;
}

// ---------- the generator's reports (loop spec §3B, §8) ----------

// Rows on the longest honest path: the original, Trade places when x is on the right, a flip (negative fraction), the divide by the top
// folded (p ≥ 2), then the multiply's work row and its new equation; then x = [ ] and its button; the check (the equation, a line each,
// then the mark) beside the work. The model's bridge row ("one part") takes the divide's place when the model is used.
export function stackRowsFor(p) {
  const moves = 1 + (p.mirror ? 1 : 0) + (p.neg ? 1 : 0) + (p.p > 1 ? 1 : 0) + 2;
  const check = 2 + (p.form === 'over' && p.p > 1 ? 2 : 1) + 1;
  return { moves, answer: 2, check, total: moves + 2 + check };
}
export function worstCaseRows(level, seeds = 200) {
  let worst = { moves: 0, answer: 0, check: 0, total: 0 };
  for (let seed = 1; seed <= seeds; seed++) for (const p of generateFractionsLevel(level, seed)) { const r = stackRowsFor(p); if (r.total > worst.total) worst = { ...r, problem: p }; }
  return worst;
}
export function slipCollisionsOf(p) {
  const by = new Map();
  for (const { tag, v } of slipValuesOf(p)) by.set(v, [...new Set([...(by.get(v) ?? []), tag])]);
  return [...by.entries()].filter(([v, tags]) => tags.length > 1 || v === p.x).map(([value, tags]) => ({ value, tags }));
}
export function slipCollisions(level, seeds = 200) {
  let problems = 0;
  const counts = {};
  for (let seed = 1; seed <= seeds; seed++) {
    for (const p of generateFractionsLevel(level, seed)) {
      problems += 1;
      for (const c of slipCollisionsOf(p)) { const k = c.tags.join(' = ') + (c.value === p.x ? ' = answer' : ''); counts[k] = (counts[k] ?? 0) + 1; }
    }
  }
  return { problems, counts };
}
export { substitutionLines };
