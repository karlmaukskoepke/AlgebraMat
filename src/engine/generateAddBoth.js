// Seeded problem sets for Add to both sides (SPEC-ADD-TO-BOTH-SIDES.md §2, revision 2). Six levels, five problems each, no
// repeated answers or equations; negative answers are in on purpose (positive-only invites mental math that skips the opposite).
// Every problem is verified by substitution when it is made (makeAddBoth), and the sets are checked again in tests.
//
// L1 numeric (numbers only: two "do" and three "quiz" items)   L2 x + a = b   L3 x − a = b   L4 both forms mixed
// L5 x on the right, some on the left   L6 all four forms, bigger numbers
// (The equation levels 1–5 below are the card's levels 2–6.)

import { mulberry32, pickSet, PROBLEMS_PER_LEVEL } from './generate.js';
import { makeAddBoth, isBattle, slipsOf } from './addBoth.js';
import { substitutionLines } from './solveTerms.js';

export const ADD_BOTH_LEVEL_COUNT = 6;
export const EQUATION_LEVEL_COUNT = 5;

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// All the problems of some forms, with a in [aLo, aHi] and b in [bLo, bHi] (b never 0, and x never 0).
function candidates({ forms, mirrors = [false], aLo, aHi, bLo, bHi }) {
  const out = [];
  for (const form of forms) {
    for (const mirror of mirrors) {
      for (const a of range(aLo, aHi)) {
        for (const b of range(bLo, bHi)) {
          if (b === 0) continue;
          const x = form === 'x+a' ? b - a : b + a;
          if (x === 0) continue;
          out.push(makeAddBoth(form, a, x, mirror));
        }
      }
    }
  }
  return out;
}

const neg = (p) => p.x < 0;
const pos = (p) => p.x > 0;
const any = (count) => ({ test: () => true, count });

export const ADD_BOTH_LEVELS = {
  // 1: x + a = b. Three Parties (b negative: negative answers) and two Battles (one with a positive answer).
  1: {
    candidates: () => candidates({ forms: ['x+a'], aLo: 1, aHi: 9, bLo: -9, bHi: 12 }),
    groups: [{ test: (p) => !isBattle(p), count: 3 }, { test: (p) => isBattle(p) && pos(p), count: 1 }, { test: isBattle, count: 1 }],
  },
  // 2: x − a = b. At least two Battles with b negative, at least one Party, answers of both signs.
  2: {
    candidates: () => candidates({ forms: ['x-a'], aLo: 2, aHi: 9, bLo: -9, bHi: 12 }),
    groups: [{ test: (p) => isBattle(p) && neg(p), count: 1 }, { test: (p) => isBattle(p) && pos(p), count: 1 }, { test: (p) => !isBattle(p), count: 1 }, { test: isBattle, count: 1 }, any(1)],
  },
  // 3: both forms, at least two of each, at least two negative and two positive answers.
  3: {
    candidates: () => candidates({ forms: ['x+a', 'x-a'], aLo: 2, aHi: 9, bLo: -10, bHi: 12 }),
    groups: [
      { test: (p) => p.form === 'x+a' && neg(p), count: 1 }, { test: (p) => p.form === 'x-a' && neg(p), count: 1 },
      { test: (p) => p.form === 'x+a' && pos(p), count: 1 }, { test: (p) => p.form === 'x-a' && pos(p), count: 1 }, any(1),
    ],
  },
  // 4: three with x on the right, two on the left, at least two negative answers.
  4: {
    candidates: () => candidates({ forms: ['x+a', 'x-a'], mirrors: [false, true], aLo: 1, aHi: 9, bLo: -9, bHi: 12 }),
    groups: [
      { test: (p) => p.mirror && neg(p), count: 1 }, { test: (p) => !p.mirror && neg(p), count: 1 },
      { test: (p) => p.mirror && p.form === 'x+a', count: 1 }, { test: (p) => p.mirror, count: 1 }, { test: (p) => !p.mirror, count: 1 },
    ],
  },
  // 5: all four forms, bigger numbers, at least two negative answers.
  5: {
    candidates: () => candidates({ forms: ['x+a', 'x-a'], mirrors: [false, true], aLo: 1, aHi: 14, bLo: -15, bHi: 15 }),
    groups: [
      { test: (p) => p.form === 'x+a' && !p.mirror && neg(p), count: 1 }, { test: (p) => p.form === 'x-a' && !p.mirror, count: 1 },
      { test: (p) => p.form === 'x+a' && p.mirror && neg(p), count: 1 }, { test: (p) => p.form === 'x-a' && p.mirror, count: 1 },
      any(1),
    ],
  },
};

// Banned answers (loop spec §8): never 0, 1 or −1.
export const allowedAnswer = (x) => Math.abs(x) >= 2;

// Answers at most 15 in size (the spec's limit on every number in a problem).
const withinLimit = (p) => Math.abs(p.x) <= 15 && Math.abs(p.b) <= 15 && p.a <= 14;

// The equation sets: level 1 is the card's L2, ... level 5 is the card's L6.
export function generateEquationLevel(level, seed) {
  const spec = ADD_BOTH_LEVELS[level];
  if (!spec) throw new Error(`Unknown Add to both sides level: ${level}`);
  const rng = mulberry32((seed ^ Math.imul(level + 120, 0x85ebca6b)) >>> 0);
  // no answer of 0, 1 or −1 (loop spec §8; Build F). They are skipped while picking, not taken out of the pool, so the pool is shuffled
  // as before and only a set that drew one of them changes.
  const groups = spec.groups.map((g) => ({ ...g, test: (p) => allowedAnswer(p.x) && g.test(p) }));
  const set = pickSet({
    candidates: spec.candidates().filter(withinLimit), groups, answerOf: (p) => p.x, rng, label: `Add to both sides level ${level}`,
  });
  return set;
}

// ---------- Level 1: the numeric level (§3D) ----------
// Five items on `a + b = c + d` (both sides worth the same, 5 to 9): two "do" items (add +p, then a negative −q, to each
// side, left then right) and three quiz items ("does it keep the balance or upset it?"). The shape is fixed, the numbers vary.

const pick = (list, rng) => list[Math.floor(rng() * list.length)];

function startEquation(rng, taken) {
  for (let tries = 0; tries < 200; tries++) {
    const total = 5 + Math.floor(rng() * 5);
    const l = 1 + Math.floor(rng() * (total - 1));
    const r = 1 + Math.floor(rng() * (total - 1));
    const key = `${Math.max(l, total - l)}-${Math.max(r, total - r)}`;
    if (l === r || l === total - r || taken.has(key)) continue;       // the two sides must not look alike
    taken.add(key);
    return { left: [l, total - l], right: [r, total - r], total };
  }
  throw new Error('Add to both sides level 1: no start equation');
}

export function numericItemOutcome(item) {
  const l = item.left.reduce((s, n) => s + n, 0) + item.addLeft;
  const r = item.right.reduce((s, n) => s + n, 0) + item.addRight;
  return l === r ? 'keeps' : 'upsets';
}

export function generateNumericLevel(seed) {
  const rng = mulberry32((seed ^ 0x5bd1e995) >>> 0);
  const taken = new Set();
  const items = [];
  const base = (kind) => ({ kind: 'addboth-numeric', item: kind, ...startEquation(rng, taken) });
  const side = () => (rng() < 0.5 ? 'left' : 'right');

  items.push({ ...base('do'), amount: pick([2, 3, 4], rng), addLeft: 0, addRight: 0 });
  items.push({ ...base('do'), amount: -pick([2, 3], rng), addLeft: 0, addRight: 0 });
  const p = pick([2, 3, 4], rng);
  const one = side();
  items.push({ ...base('quiz'), amount: p, addLeft: one === 'left' ? p : 0, addRight: one === 'right' ? p : 0, scenario: 'one' });
  const q = pick([2, 3, 4], rng);
  items.push({ ...base('quiz'), amount: q, addLeft: q, addRight: q, scenario: 'both' });
  const lp = pick([2, 3, 4], rng);
  const rp = pick([1, 2, 3, 4].filter((n) => n !== lp), rng);
  items.push({ ...base('quiz'), amount: lp, addLeft: lp, addRight: rp, scenario: 'different' });

  items[items.length - 1].last = true;            // after the fifth item comes the watched walkthrough (§3D item 6)
  for (const it of items) {
    if (it.item === 'quiz') {
      it.correct = numericItemOutcome(it);
      it.order = rng() < 0.5 ? ['keeps', 'upsets'] : ['upsets', 'keeps'];
    }
    it.id = `n${items.indexOf(it)}`;
  }
  // nothing may balance by accident: every quiz item's outcome is what its scenario says
  for (const it of items.filter((i) => i.item === 'quiz')) {
    if (it.correct !== (it.scenario === 'both' ? 'keeps' : 'upsets')) throw new Error('Add to both sides level 1: accidental balance');
  }
  return items;
}

// The card's levels: 1 is numeric, 2–6 are the equation sets 1–5.
export function generateAddBothLevel(level, seed) {
  if (level === 1) return generateNumericLevel(seed);
  if (level >= 2 && level <= 6) return generateEquationLevel(level - 1, seed);
  throw new Error(`Unknown Add to both sides level: ${level}`);
}

export { PROBLEMS_PER_LEVEL };

// ---------- the generator's reports (loop spec §3B, §8; Build F) ----------

// Rows of the work stack for one problem on its longest honest path: the original, Trade places when x is on the right (Level 5 up),
// the move's work row and its new equation; then the x = [ ] row and its button, and the check (a line each, then the mark).
export function stackRowsFor(p, level) {
  const trade = p.mirror && level >= 5 ? 1 : 0;
  const moves = 1 + trade + 2;
  const xs = [{ kind: 'x' }, { kind: 'num', v: p.form === 'x-a' ? -p.a : p.a }];
  const board = p.mirror ? { left: [{ kind: 'num', v: p.b }], right: xs } : { left: xs, right: [{ kind: 'num', v: p.b }] };
  const check = substitutionLines(board, p.x).lines.length + 1;
  return { moves, answer: 2, check, total: moves + 2 + check };
}
// The worst case of a card level over many seeds (the screen reserves it).
export function worstCaseRows(level, seeds = 200) {
  let worst = { moves: 0, answer: 0, check: 0, total: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    for (const p of generateAddBothLevel(level, seed)) {
      const r = stackRowsFor(p, level);
      if (r.total > worst.total) worst = r;
    }
  }
  return worst;
}

// Slip collisions: a wrong value that fits two slips (or the answer), so the tag order decides what the class sheet records. Reported,
// not prevented: the card's tag order (addBoth.js tagAddBoth) is the rule.
export function slipCollisionsOf(p) {
  const values = Object.entries(slipsOf(p)).map(([tag, v]) => ({ tag, v }));
  if (isBattle(p)) values.push({ tag: 'sizes-added', v: -(Math.abs(p.b) + p.a) });
  const by = new Map();
  for (const { tag, v } of values) by.set(v, [...new Set([...(by.get(v) ?? []), tag])]);
  return [...by.entries()].filter(([v, tags]) => tags.length > 1 || v === p.x).map(([value, tags]) => ({ value, tags }));
}
export function slipCollisions(level, seeds = 200) {
  let problems = 0;
  const counts = {};
  for (let seed = 1; seed <= seeds; seed++) {
    for (const p of generateAddBothLevel(level, seed)) {
      problems += 1;
      for (const c of slipCollisionsOf(p)) { const k = c.tags.join(' = '); counts[k] = (counts[k] ?? 0) + 1; }
    }
  }
  return { problems, counts };
}
