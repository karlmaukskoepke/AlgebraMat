// Seeded problem sets for the Distribute, then combine pack's 5 levels (SPEC-DISTRIBUTE.md §2).
// Rounds 1 to 3 enumerate every allowed problem (small values, drawn on the Mat); rounds 4 and 5
// are too wide to enumerate, so they sample candidates with the seeded RNG. Either way the set is
// picked into required groups without repeating an answer.

import { mulberry32, pickSet, PROBLEMS_PER_LEVEL } from './generate.js';
import {
  makeDistribute, groupPart, termPart, answerText, openPieces, evaluateDistribute, startsWithGroup, groupParts, looseTerms,
} from './distribute.js';

export const DISTRIBUTE_LEVEL_COUNT = 5;
export const MAX_DRAWN = 20; // pieces on the Mat once the groups are open (rounds 1 to 3)

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const signs = (lo, hi) => range(lo, hi).flatMap((v) => [v, -v]);
const x = (value) => ({ kind: 'x', value });
const num = (value) => ({ kind: 'int', value });
const any = () => true;
const even = () => 1;

const SMALL_WEIGHT = 4;
const preferSmall = (p) => (openPieces(p) <= 12 ? SMALL_WEIGHT : 1);
const bothNonzero = (p) => { const a = evaluateDistribute(p); return a.x !== 0 && a.n !== 0; };
const notBlank = (p) => { const a = evaluateDistribute(p); return a.x !== 0 || a.n !== 0; };
const preferBoth = (p) => (bothNonzero(p) ? 3 : 1);

// ---------- Test helpers (also the groups' tests) ----------

const firstLoose = (p) => looseTerms(p)[0];
const looseIsX = (p) => firstLoose(p).kind === 'x';
const groupOp = (p) => groupParts(p)[0].op;
const groupN = (p) => groupParts(p)[0].n;
const hasNegativeInside = (p) => groupParts(p).some((g) => g.inside.some((t) => t.value < 0));
const allPositiveInside = (p) => !hasNegativeInside(p);
const numberFirstInside = (p) => groupParts(p).some((g) => g.inside[0].kind === 'int');
const twoLoose = (p) => looseTerms(p).length >= 2;
const twoGroups = (p) => groupParts(p).length >= 2;
const hiddenOne = (p) => groupParts(p).some((g) => g.hiddenOne);

// A loose term that comes first keeps its sign in the value; one that comes later is written with an operation.
const looseFirst = (kind, value) => termPart(kind, '+', value);
const looseAfter = (kind, op, value) => termPart(kind, op, value);

// All the (C, D) pairs for the two terms inside a group, x first (as Karl writes them).
const insidePairs = (cMax, dMax) => signs(1, cMax).flatMap((c) => signs(1, dMax).map((d) => [x(c), num(d)]));

const drawable = (p) => openPieces(p) <= MAX_DRAWN && bothNonzero(p);

// ---------- Rounds 1 to 3: enumerate ----------

// Round 1: A + B(Cx + D) and B(Cx + D) + A. A is a number or an x term.
function round1() {
  const out = [];
  for (const kind of ['x', 'int']) {
    for (const n of range(2, 4)) {
      for (const inside of insidePairs(3, 5)) {
        for (const a of signs(1, 6)) {
          out.push(makeDistribute([looseFirst(kind, a), groupPart('+', n, inside)]));
        }
        for (const a of range(1, 6)) {
          out.push(makeDistribute([groupPart('+', n, inside), looseAfter(kind, '+', a)]));
        }
      }
    }
  }
  return out.filter(drawable);
}

// Round 2: A + (Bx + C) and A − (Bx + C): the invisible 1.
function round2() {
  const out = [];
  for (const kind of ['x', 'int']) {
    for (const op of ['+', '-']) {
      for (const inside of insidePairs(4, 6)) {
        for (const a of signs(1, 6)) {
          out.push(makeDistribute([looseFirst(kind, a), groupPart(op, 1, inside, { hiddenOne: true })]));
        }
      }
    }
  }
  return out.filter(drawable);
}

// Round 3: A − B(Cx + D), integer A, C and D.
function round3() {
  const out = [];
  for (const n of range(2, 4)) {
    for (const inside of insidePairs(3, 5)) {
      for (const a of signs(1, 6)) {
        out.push(makeDistribute([looseFirst('int', a), groupPart('-', n, inside)]));
      }
    }
  }
  return out.filter(drawable);
}

// ---------- Rounds 4 and 5: sample ----------

const CANDIDATES = 900;
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const oneOf = (rng, list) => list[Math.floor(rng() * list.length)];
const signed = (rng, v) => (rng() < 0.5 ? -v : v);
const kindOf = (rng) => (rng() < 0.5 ? 'x' : 'int');

// Two terms inside a group, x first, or (with `mixOrder`) number first half the time.
function insideOf(rng, { cMax, dMax, mixOrder }) {
  const c = x(signed(rng, int(rng, 1, cMax)));
  const d = num(signed(rng, int(rng, 1, dMax)));
  return mixOrder && rng() < 0.5 ? [d, c] : [c, d];
}

// A group with its count; a single group hides its 1.
function groupOfRng(rng, op, nMax, cfg, { allowOne = true } = {}) {
  const n = int(rng, allowOne ? 1 : 2, nMax);
  return groupPart(op, n, insideOf(rng, cfg), { hiddenOne: n === 1 });
}

// The loose terms for the sampled shapes: one x and one number, in either order.
const loosePair = (rng, max) => {
  const values = [int(rng, 1, max), int(rng, 1, max)];
  const kinds = rng() < 0.5 ? ['x', 'int'] : ['int', 'x'];
  return kinds.map((kind, i) => ({ kind, value: values[i] }));
};

function round4(rng) {
  const cfg = { cMax: 6, dMax: 9, mixOrder: false };
  const out = [];
  while (out.length < CANDIDATES) {
    const kind = kindOf(rng);
    const a = int(rng, 1, 12);
    const shape = int(rng, 1, 5);
    let parts;
    if (shape === 1) parts = [looseFirst(kind, signed(rng, a)), groupOfRng(rng, '+', 9, cfg, { allowOne: false })];
    else if (shape === 2) parts = [groupOfRng(rng, '+', 9, cfg, { allowOne: false }), looseAfter(kind, '+', a)];
    else if (shape === 3) parts = [looseFirst(kind, signed(rng, a)), groupPart('+', 1, insideOf(rng, cfg), { hiddenOne: true })];
    else if (shape === 4) parts = [looseFirst(kind, signed(rng, a)), groupPart('-', 1, insideOf(rng, cfg), { hiddenOne: true })];
    else parts = [looseFirst(kind, signed(rng, a)), groupOfRng(rng, '-', 9, cfg, { allowOne: false })];
    const p = makeDistribute(parts);
    if (notBlank(p)) out.push(p);
  }
  return out;
}

function round5(rng) {
  const cfg = { cMax: 6, dMax: 9, mixOrder: true };
  const out = [];
  while (out.length < CANDIDATES) {
    const shape = int(rng, 1, 6);
    const op = rng() < 0.5 ? '+' : '-';
    const [l1, l2] = loosePair(rng, 12);
    let parts;
    if (shape === 1) { // B(Cx + D) − A
      parts = [groupOfRng(rng, '+', 9, cfg, { allowOne: false }), looseAfter(kindOf(rng), '-', int(rng, 1, 12))];
    } else if (shape === 2) { // −B(Cx + D) + A
      parts = [groupOfRng(rng, '-', 9, cfg, { allowOne: false }), looseAfter(kindOf(rng), '+', int(rng, 1, 12))];
    } else if (shape === 3) { // B(Cx + D) ± T1 ± T2
      parts = [groupOfRng(rng, '+', 9, cfg, { allowOne: false }), looseAfter(l1.kind, op, l1.value), looseAfter(l2.kind, rng() < 0.5 ? '+' : '-', l2.value)];
    } else if (shape === 4) { // T1 ± B(Cx + D) ± T2
      parts = [looseFirst(l1.kind, signed(rng, l1.value)), groupOfRng(rng, op, 9, cfg), looseAfter(l2.kind, rng() < 0.5 ? '+' : '-', l2.value)];
    } else if (shape === 5) { // T1 ± T2 ± B(Cx + D)
      parts = [looseFirst(l1.kind, signed(rng, l1.value)), looseAfter(l2.kind, rng() < 0.5 ? '+' : '-', l2.value), groupOfRng(rng, op, 9, cfg)];
    } else { // B(Cx + D) ± T ± C(Ex + F): groups on both sides of a term
      parts = [groupOfRng(rng, '+', 6, cfg, { allowOne: false }), looseAfter(l1.kind, rng() < 0.5 ? '+' : '-', l1.value), groupOfRng(rng, op, 6, cfg)];
    }
    const p = makeDistribute(parts);
    if (notBlank(p)) out.push(p);
  }
  return out;
}

// ---------- Levels ----------

export const DISTRIBUTE_LEVELS = {
  // A + B(Cx + D) and B(Cx + D) + A: two of each form, mixing a number and an x term for A.
  1: {
    weight: preferSmall,
    build: () => ({
      candidates: round1(),
      groups: [
        { test: (p) => startsWithGroup(p) && looseIsX(p), count: 1 },
        { test: (p) => startsWithGroup(p) && !looseIsX(p), count: 1 },
        { test: (p) => !startsWithGroup(p) && looseIsX(p), count: 1 },
        { test: (p) => !startsWithGroup(p) && !looseIsX(p), count: 1 },
        { test: any, count: 1 },
      ],
    }),
  },

  // A + (Bx + C) and A − (Bx + C): at least 2 of each op, the 1 invisible.
  2: {
    weight: preferSmall,
    build: () => ({
      candidates: round2(),
      groups: [
        { test: (p) => groupOp(p) === '-' && looseIsX(p), count: 1 },
        { test: (p) => groupOp(p) === '-' && !looseIsX(p), count: 1 },
        { test: (p) => groupOp(p) === '+' && looseIsX(p), count: 1 },
        { test: (p) => groupOp(p) === '+' && !looseIsX(p), count: 1 },
        { test: (p) => groupOp(p) === '-', count: 1 },
      ],
    }),
  },

  // A − B(Cx + D): the sign trap. At least 3 with a negative inside.
  3: {
    weight: preferSmall,
    build: () => ({
      candidates: round3(),
      groups: [{ test: hasNegativeInside, count: 3 }, { test: allPositiveInside, count: 1 }, { test: any, count: 1 }],
    }),
  },

  // Mixed forms of rounds 1 to 3, larger values.
  4: {
    weight: preferBoth,
    build: (rng) => ({
      candidates: round4(rng),
      groups: [
        { test: hiddenOne, count: 1 },
        { test: (p) => groupOp(p) === '-' && groupN(p) > 1, count: 1 },
        { test: startsWithGroup, count: 1 },
        { test: hasNegativeInside, count: 1 },
        { test: any, count: 1 },
      ],
    }),
  },

  // Mixed forms, groups either side of a term, number-first insides.
  5: {
    weight: preferBoth,
    build: (rng) => ({
      candidates: round5(rng),
      groups: [
        { test: twoLoose, count: 2 },
        { test: twoGroups, count: 1 },
        { test: numberFirstInside, count: 1 },
        { test: any, count: 1 },
      ],
    }),
  },
};

export function generateDistributeLevel(level, seed) {
  const spec = DISTRIBUTE_LEVELS[level];
  if (!spec) throw new Error(`Unknown Distribute level: ${level}`);
  // Mix the level into the seed so levels don't mirror each other under one ?seed= link.
  const rng = mulberry32((seed ^ Math.imul(level, 0x9e3779b1)) >>> 0);
  const { candidates, groups } = spec.build(rng);
  return pickSet({
    candidates, groups, weight: spec.weight ?? even, answerOf: answerText, rng, label: `Distribute level ${level}`,
  });
}

export { PROBLEMS_PER_LEVEL };
