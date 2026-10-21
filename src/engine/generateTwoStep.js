// Seeded problem sets for Two-step equations, the new card (Build K, basic form). Seven levels, displayed 1-7 = saved 1-7 (no
// walkthrough level). Five problems a level, no repeated answers or equations, whole answers 2 to 9 in size (never 0 or ±1), a from 2 to
// 5, b from 1 to 12, |c| at most 30. No accidental balances: a slip's value is never the answer. Each level has the form and sign mix
// below. Every problem is verified by substitution when it is made (makeTwoStep).

import { mulberry32, pickSet } from './generate.js';
import { makeTwoStep, slipValuesOf, constOf, coefOf } from './twoStep.js';
import { substitutionLines } from './solveTerms.js';

export const TWO_STEP_LEVEL_COUNT = 7;
export const MAX_C = 30;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const POSITIVE = range(2, 9);
const NEGATIVE = range(-9, -2);

// No accidental balance: none of the declared slips gives the answer.
export const slipSafe = (p) => slipValuesOf(p).every(({ v }) => v !== p.x);

function candidates(forms, xs, { mirror = [false] } = {}) {
  const out = [];
  for (const form of forms) {
    for (const m of mirror) {
      for (const a of range(2, 5)) {
        for (const b of range(1, 12)) {
          for (const x of xs) {
            const p = makeTwoStep(form, a, b, x, m);
            if (p.c !== 0 && Math.abs(p.c) <= MAX_C && slipSafe(p)) out.push(p);
          }
        }
      }
    }
  }
  return out;
}
const g = (test, count = 1) => ({ test, count });
const any = (count = 1) => g(() => true, count);
const isForm = (form) => (p) => p.form === form;

export const TWO_STEP_LEVELS = {
  // 1: ax + b = c, positive answers; a big and a small number in front of x
  1: { candidates: () => candidates(['ax+b'], POSITIVE), groups: [g((p) => p.a >= 4), g((p) => p.a <= 3), any(3)] },
  // 2: ax − b = c, positive answers; c negative in one (2x − 9 = −5), positive in two
  2: { candidates: () => candidates(['ax-b'], POSITIVE), groups: [g((p) => p.c < 0), g((p) => p.c > 0, 2), g((p) => p.a >= 4), any()] },
  // 3: x on the right (the symmetric property: Trade places first): c = b + ax, c = ax + b, c = ax − b, one of each
  3: {
    candidates: () => candidates(['ax+b', 'ax-b', 'b+ax'], POSITIVE, { mirror: [true] }),
    groups: [g(isForm('b+ax')), g(isForm('ax+b')), g(isForm('ax-b')), any(2)],
  },
  // 4: b + ax = c (the x term second)
  4: { candidates: () => candidates(['b+ax'], POSITIVE), groups: [g((p) => p.a >= 4), g((p) => p.a <= 3), any(3)] },
  // 5: b − ax = c (a negative coefficient): c negative in two, positive in one
  5: { candidates: () => candidates(['b-ax'], POSITIVE), groups: [g((p) => p.c < 0, 2), g((p) => p.c > 0), g((p) => p.a >= 4), any()] },
  // 6: negative answers, the three plain forms, some mirrored
  6: {
    candidates: () => candidates(['ax+b', 'ax-b', 'b+ax'], NEGATIVE, { mirror: [false, true] }),
    groups: [g(isForm('ax+b')), g(isForm('ax-b')), g(isForm('b+ax')), g((p) => p.mirror), any()],
  },
  // 7: all forms mixed, both signs of the answer, mirrored and not
  7: {
    candidates: () => candidates(['ax+b', 'ax-b', 'b+ax', 'b-ax'], [...NEGATIVE, ...POSITIVE], { mirror: [false, true] }),
    groups: [
      g((p) => p.form === 'b-ax' && p.x < 0), g((p) => p.form === 'b-ax' && p.x > 0), g((p) => p.mirror && p.x < 0),
      g((p) => !p.mirror && p.x > 0 && p.form !== 'b-ax'), any(),
    ],
  },
};

export function generateTwoStepLevel(level, seed) {
  const spec = TWO_STEP_LEVELS[level];
  if (!spec) throw new Error(`Unknown Two-step equations level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level + 409, 0x9e3779b1)) >>> 0);
  return pickSet({ candidates: spec.candidates(), groups: spec.groups, answerOf: (p) => p.x, rng, label: `Two-step equations level ${level}` });
}

// ---------- the generator's reports (loop spec §3B, §8) ----------

const boardOf = (p) => {
  const x = { kind: 'x', coef: coefOf(p) };
  const n = { kind: 'num', v: constOf(p) };
  const xs = p.form === 'b+ax' || p.form === 'b-ax' ? [n, x] : [x, n];
  const os = [{ kind: 'num', v: p.c }];
  return p.mirror ? { left: os, right: xs } : { left: xs, right: os };
};
// Rows on the longest honest path: the original, Trade places when x is on the right, the Add move and the student's combining folded
// to one row, a flip folded to one row (a negative coefficient), the finishing fraction's work row and its new equation; then the
// x = [ ] row and its button; and the check (the equation, a line each, then the mark), which sits beside the work. A wrong value always
// shows the full check, so that is what is counted.
export function stackRowsFor(p) {
  const moves = 1 + (p.mirror ? 1 : 0) + 1 + (coefOf(p) < 0 ? 1 : 0) + 2;
  const check = substitutionLines(boardOf(p), p.x).lines.length + 2;
  return { moves, answer: 2, check, total: moves + 2 + check };
}
export function worstCaseRows(level, seeds = 200) {
  let worst = { moves: 0, answer: 0, check: 0, total: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    for (const p of generateTwoStepLevel(level, seed)) {
      const r = stackRowsFor(p);
      if (r.total > worst.total) worst = r;
    }
  }
  return worst;
}

// Slip collisions: a wrong value that fits two slips (or is the answer), so the tag order decides. Reported, not prevented (a slip that
// is the answer is prevented: slipSafe).
export function slipCollisionsOf(p) {
  const by = new Map();
  for (const { tag, v } of slipValuesOf(p)) by.set(v, [...new Set([...(by.get(v) ?? []), tag])]);
  return [...by.entries()].filter(([v, tags]) => tags.length > 1 || v === p.x).map(([value, tags]) => ({ value, tags }));
}
export function slipCollisions(level, seeds = 200) {
  let problems = 0;
  const counts = {};
  for (let seed = 1; seed <= seeds; seed++) {
    for (const p of generateTwoStepLevel(level, seed)) {
      problems += 1;
      for (const c of slipCollisionsOf(p)) { const k = c.tags.join(' = '); counts[k] = (counts[k] ?? 0) + 1; }
    }
  }
  return { problems, counts };
}
