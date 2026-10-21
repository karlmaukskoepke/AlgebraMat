// Seeded problem sets for Flip everything (SPEC-FLIP-IT.md rev 1.2 §2): saved levels 2-6 are the generator's 1-5 (saved Level 1, numbers
// only, is reserved: its "See why it works" is not built yet). Five problems a level, no repeated answers or equations, whole answers
// (never 0 or ±1, and never ±a when a ≥ 2, so "gave the number in front" never collides with the answer), both signs of b in every
// level. Every problem is verified by substitution when it is made (makeFlip).

import { mulberry32, pickSet } from './generate.js';
import { makeFlip, slipValuesOf } from './flip.js';
import { substitutionLines } from './solveTerms.js';

export const FLIP_LEVEL_COUNT = 5;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// Every problem with a from `as`, |x| from `minX` to `maxX`, |b| at most `maxB`, x on the left and/or right.
function candidates({ as, minX = 2, maxX, maxB, sides }) {
  const out = [];
  for (const a of as) {
    for (const m of range(minX, maxX)) {
      if ((a > 1 && m === a) || a * m > maxB) continue;
      for (const x of [m, -m]) for (const mirror of sides) out.push(makeFlip(a, x, mirror));
    }
  }
  return out;
}
const posB = (p) => p.b > 0;
const negB = (p) => p.b < 0;
const any = (count = 1) => ({ test: () => true, count });
const g = (test, count = 1) => ({ test, count });
const isForm = (a1, mirror) => (p) => (a1 ? p.a === 1 : p.a > 1) && p.mirror === mirror;

export const FLIP_LEVELS = {
  // L1 (shown Level 1): −x = b, b from 2 to 15 in size, two positive and two negative b.
  1: { candidates: () => candidates({ as: [1], maxX: 15, maxB: 15, sides: [false] }), groups: [g(posB, 2), g(negB, 2), any()] },
  // L2: b = −x (x on the right; Trade places is live), the same numbers.
  2: { candidates: () => candidates({ as: [1], maxX: 15, maxB: 15, sides: [true] }), groups: [g(posB, 2), g(negB, 2), any()] },
  // L3: −ax = b, a from 2 to 6 (at least three different a), answers 2 to 9 in size, |b| ≤ 36; two positive and two negative b.
  3: {
    candidates: () => candidates({ as: [2, 3, 4, 5, 6], maxX: 9, maxB: 36, sides: [false] }),
    groups: [g((p) => p.a === 2 && posB(p)), g((p) => p.a === 3 && negB(p)), g((p) => (p.a === 4 || p.a === 5) && posB(p)), g((p) => p.a === 6 && negB(p)), any()],
  },
  // L4: mixed, all four forms (−x = b, b = −x, −ax = b, b = −ax): one of each, two with x on the right at least; both signs of b.
  4: {
    candidates: () => [...candidates({ as: [1], maxX: 12, maxB: 12, sides: [false, true] }), ...candidates({ as: [2, 3, 4, 5, 6], maxX: 9, maxB: 36, sides: [false, true] })],
    groups: [g((p) => isForm(true, false)(p) && posB(p)), g((p) => isForm(true, true)(p) && negB(p)), g((p) => isForm(false, false)(p) && negB(p)), g((p) => isForm(false, true)(p) && posB(p)), any()],
  },
  // L5: bigger numbers, the same forms: at least three answers of 8 or more in size, |b| ≤ 36 (the loop's counter limit).
  5: {
    candidates: () => [...candidates({ as: [1], minX: 8, maxX: 20, maxB: 20, sides: [false, true] }), ...candidates({ as: [2, 3, 4], minX: 5, maxX: 18, maxB: 36, sides: [false, true] })],
    groups: [
      g((p) => isForm(true, false)(p) && posB(p)), g((p) => isForm(true, true)(p) && negB(p)),
      g((p) => isForm(false, false)(p) && negB(p) && Math.abs(p.x) >= 8), g((p) => isForm(false, true)(p) && posB(p)), any(),
    ],
  },
};

// The card's saved level (1-6) → its problems. Saved Level 1 (numbers only) is not built: a link to it plays the first equation level.
export function generateFlipLevel(savedLevel, seed) {
  const level = Math.max(1, savedLevel - 1);
  const spec = FLIP_LEVELS[level];
  if (!spec) throw new Error(`Unknown Flip everything level: ${savedLevel}`);
  const rng = mulberry32((seed ^ Math.imul(level + 307, 0x9e3779b1)) >>> 0);
  return pickSet({ candidates: spec.candidates(), groups: spec.groups, answerOf: (p) => p.x, rng, label: `Flip everything level ${savedLevel}` });
}

// ---------- the generator's reports (loop spec §3B, §8) ----------

const boardOf = (p) => {
  const xs = [{ kind: 'x', coef: -p.a }];
  const bs = [{ kind: 'num', v: p.b }];
  return p.mirror ? { left: bs, right: xs } : { left: xs, right: bs };
};
// Rows on the longest honest path: the original, Trade places when x is on the right, a flip folded to one row (−ax only), the finishing
// move's work row and its new equation; then the x = [ ] row and its button; and the check (the equation, a line each, then the mark),
// which sits beside the work.
export function stackRowsFor(p) {
  const moves = 1 + (p.mirror ? 1 : 0) + (p.a > 1 ? 1 : 0) + 2;
  const check = substitutionLines(boardOf(p), p.x).lines.length + 2;
  return { moves, answer: 2, check, total: moves + 2 + check };
}
export function worstCaseRows(savedLevel, seeds = 200) {
  let worst = { moves: 0, answer: 0, check: 0, total: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    for (const p of generateFlipLevel(savedLevel, seed)) {
      const r = stackRowsFor(p);
      if (r.total > worst.total) worst = r;
    }
  }
  return worst;
}

// Slip collisions: a wrong value that fits two slips (or is the answer), so the tag order decides. Reported, not prevented.
export function slipCollisionsOf(p) {
  const by = new Map();
  for (const { tag, v } of slipValuesOf(p)) by.set(v, [...new Set([...(by.get(v) ?? []), tag])]);
  return [...by.entries()].filter(([v, tags]) => tags.length > 1 || v === p.x).map(([value, tags]) => ({ value, tags }));
}
export function slipCollisions(savedLevel, seeds = 200) {
  let problems = 0;
  const counts = {};
  for (let seed = 1; seed <= seeds; seed++) {
    for (const p of generateFlipLevel(savedLevel, seed)) {
      problems += 1;
      for (const c of slipCollisionsOf(p)) { const k = c.tags.join(' = '); counts[k] = (counts[k] ?? 0) + 1; }
    }
  }
  return { problems, counts };
}
