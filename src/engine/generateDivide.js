// Seeded problem sets for Divide it (SPEC-DIVIDE-IT.md §2): five levels shown (a sixth is reserved in the save code), five
// problems each, no repeated answers or equations, whole-number answers (never 0 or ±1), negative and positive answers in the
// mix. A problem whose answer equals a is dropped: the slip "gave the number of boxes" would then be the right answer
// (BUILD-NOTES §2.1). Every problem is verified by substitution when it is made (makeDivide).

import { mulberry32, pickSet } from './generate.js';
import { makeDivide } from './divide.js';

export const DIVIDE_LEVEL_COUNT = 5;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// Every problem with a from `as`, |x| from 2 up to `maxX` (and b at most `maxB` in size), x ≠ a.
function candidates({ as, maxX, maxB }) {
  const out = [];
  for (const a of as) {
    for (const m of range(2, maxX)) {
      if (m === a || a * m > maxB) continue;
      for (const x of [m, -m]) out.push(makeDivide(a, x));
    }
  }
  return out;
}
const neg = (p) => p.x < 0;
const pos = (p) => p.x > 0;
const any = (count = 1) => ({ test: () => true, count });
const g = (test, count = 1) => ({ test, count });

export const DIVIDE_LEVELS = {
  // L1: a = 2 or 3, answers 2–5 (at most 15 counters). Two of each coefficient, two negative and two positive answers.
  1: {
    candidates: () => candidates({ as: [2, 3], maxX: 5, maxB: 15 }),
    groups: [g((p) => p.a === 2 && neg(p)), g((p) => p.a === 2 && pos(p)), g((p) => p.a === 3 && neg(p)), g((p) => p.a === 3 && pos(p)), any()],
  },
  // L2: a = 2–5, answers 2–6 (at most 30 counters). One of each a, two negative and two positive answers.
  2: {
    candidates: () => candidates({ as: [2, 3, 4, 5], maxX: 6, maxB: 30 }),
    groups: [g((p) => p.a === 2 && neg(p)), g((p) => p.a === 3 && pos(p)), g((p) => p.a === 4 && neg(p)), g((p) => p.a === 5 && pos(p)), any()],
  },
  // L3: a = 2–5, up to 36 counters, two negative and two positive answers.
  3: {
    candidates: () => candidates({ as: [2, 3, 4, 5], maxX: 18, maxB: 36 }),
    groups: [g(neg, 2), g(pos, 2), any()],
  },
  // L4: a = 4 or 6 (composite: several fractions are legal), up to 36 counters. Two of each, two negative and two positive.
  4: {
    candidates: () => candidates({ as: [4, 6], maxX: 9, maxB: 36 }),
    groups: [g((p) => p.a === 4 && neg(p)), g((p) => p.a === 4 && pos(p)), g((p) => p.a === 6 && neg(p)), g((p) => p.a === 6 && pos(p)), any()],
  },
  // L5: a = 2–6 mixed, up to 36 counters, two negative and two positive, at least three different coefficients.
  5: {
    candidates: () => candidates({ as: [2, 3, 4, 5, 6], maxX: 18, maxB: 36 }),
    groups: [g((p) => p.a === 5 && neg(p)), g((p) => p.a === 3 && pos(p)), g((p) => (p.a === 4 || p.a === 6) && neg(p)), g(pos), any()],
  },
};

export function generateDivideLevel(level, seed) {
  if (level === 0) return generateDivideNumeric(seed);          // the card's Level 1 (numbers only)
  const spec = DIVIDE_LEVELS[level];
  if (!spec) throw new Error(`Unknown Divide it level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level + 211, 0x9e3779b1)) >>> 0);
  return pickSet({ candidates: spec.candidates(), groups: spec.groups, answerOf: (p) => p.x, rng, label: `Divide it level ${level}` });
}

// ---------- Level 1: the numeric level (SPEC-DIVIDE-IT.md §3A on the light-build pattern) ----------
// Five items on `p × q = r × s` (both sides worth V, a multiple of 6, so ⅓ and ½ both split it): two "do" items (take ⅓, then ½,
// of the left side and then of the right), three quiz items ("does it keep the balance or upset it?": ⅓ of one side only, ⅓ of
// both sides, ⅓ of the left and ½ of the right) and then a watched walkthrough on 3x = 6. Nothing may balance by accident.

const PAIRS = { 12: [[2, 6], [3, 4], [4, 3], [6, 2]], 18: [[2, 9], [3, 6], [6, 3], [9, 2]], 24: [[3, 8], [4, 6], [6, 4], [8, 3]], 30: [[5, 6], [6, 5]], 36: [[4, 9], [6, 6], [9, 4]] };
const pickOne = (list, rng) => list[Math.floor(rng() * list.length)];

export function generateDivideNumeric(seed) {
  const rng = mulberry32((seed ^ 0x7f4a7c15) >>> 0);
  const used = new Set();
  const base = (item) => {
    for (let tries = 0; tries < 200; tries++) {
      const v = pickOne([12, 18, 24, 30, 36], rng);
      const left = pickOne(PAIRS[v], rng);
      const right = pickOne(PAIRS[v], rng);
      const key = `${left}-${right}`;
      if (left[0] === right[0] || used.has(key)) continue;
      used.add(key);
      return { kind: 'divide-numeric', item, left, right, v };
    }
    throw new Error('Divide it level 1: no start equation');
  };
  const side = () => (rng() < 0.5 ? 'left' : 'right');
  const items = [];
  items.push({ ...base('do'), n: 3 });
  items.push({ ...base('do'), n: 2 });
  const one = pickOne([2, 3], rng);
  items.push({ ...base('quiz'), scenario: 'one', n: one, nLeft: 0, nRight: 0, ...(side() === 'left' ? { nLeft: one } : { nRight: one }) });
  const both = pickOne([2, 3], rng);
  items.push({ ...base('quiz'), scenario: 'both', n: both, nLeft: both, nRight: both });
  const [nl, nr] = rng() < 0.5 ? [3, 2] : [2, 3];
  items.push({ ...base('quiz'), scenario: 'different', n: nl, nLeft: nl, nRight: nr, last: true });
  items.forEach((it, i) => {
    it.id = `dn${i}`;
    if (it.item === 'quiz') {
      const l = it.nLeft ? it.v / it.nLeft : it.v;
      const r = it.nRight ? it.v / it.nRight : it.v;
      it.correct = l === r ? 'keeps' : 'upsets';
      if (it.correct !== (it.scenario === 'both' ? 'keeps' : 'upsets')) throw new Error('Divide it level 1: accidental balance');
      it.order = rng() < 0.5 ? ['keeps', 'upsets'] : ['upsets', 'keeps'];
    }
  });
  return items;
}
