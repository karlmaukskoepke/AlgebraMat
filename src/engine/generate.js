// Seeded Flip It problem generators. Pure logic, no DOM.
//
// Each level enumerates every allowed problem, shuffles them with a seeded
// RNG, then fills "groups" in order (e.g. 2 positive answers, 2 negative, 1 any),
// never reusing an answer. The candidate pools are small, so this always
// terminates and is fully deterministic for a given seed.

import { makeProblem, evaluate, partyOrBattle } from './expr.js';

export const PROBLEMS_PER_LEVEL = 5;
export const MAX_ABS = 12;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const POS = range(1, MAX_ABS);
const NEG = POS.map((n) => -n);
const ANY = [...NEG, ...POS];

function pairs(as, op, bs, keep = () => true) {
  const out = [];
  for (const a of as) for (const b of bs) {
    const p = makeProblem(a, op, b);
    if (keep(p)) out.push(p);
  }
  return out;
}

const any = () => true;
const nonzero = (p) => evaluate(p) !== 0;
const positiveAnswer = (p) => evaluate(p) > 0;
const negativeAnswer = (p) => evaluate(p) < 0;
const isParty = (p) => partyOrBattle(p) === 'party';
const isBattle = (p) => partyOrBattle(p) === 'battle';
const isAdd = (p) => p.op === '+';
const isSub = (p) => p.op === '-';

// Each level: build(rng) → { candidates, groups: [{ test, count }] }, counts sum to 5.
export const LEVELS = {
  // positive − (negative): always a Party after rewriting.
  1: {
    allowZero: false,
    build: () => ({
      candidates: pairs(POS, '-', NEG),
      groups: [{ test: any, count: 5 }],
    }),
  },
  // negative − (negative): always a Battle; mix who wins.
  2: {
    allowZero: false,
    build: () => ({
      candidates: pairs(NEG, '-', NEG, nonzero),
      groups: [
        { test: positiveAnswer, count: 2 },
        { test: negativeAnswer, count: 2 },
        { test: any, count: 1 },
      ],
    }),
  },
  // number − positive: Party when the first number is negative, Battle when positive.
  3: {
    allowZero: false,
    build: () => ({
      candidates: pairs(ANY, '-', POS, nonzero),
      groups: [
        { test: isParty, count: 2 },
        { test: isBattle, count: 2 },
        { test: any, count: 1 },
      ],
    }),
  },
  // Mixed: any subtraction, plus 1–2 addition problems. Zero answers allowed.
  4: {
    allowZero: true,
    build: (rng) => {
      const additions = rng() < 0.5 ? 1 : 2;
      return {
        candidates: [...pairs(ANY, '-', ANY), ...pairs(ANY, '+', ANY)],
        groups: [
          { test: isAdd, count: additions },
          { test: isSub, count: PROBLEMS_PER_LEVEL - additions },
        ],
      };
    },
  },
};

export function generateLevel(level, seed) {
  const spec = LEVELS[level];
  if (!spec) throw new Error(`Unknown level: ${level}`);
  const rng = mulberry32(seed);
  const { candidates, groups } = spec.build(rng);
  const pool = shuffle(candidates, rng);
  const usedAnswers = new Set();
  const picked = [];

  for (const { test, count } of groups) {
    let got = 0;
    for (const p of pool) {
      if (got === count) break;
      const answer = evaluate(p);
      if (usedAnswers.has(answer) || !test(p)) continue;
      usedAnswers.add(answer);
      picked.push(p);
      got++;
    }
    if (got < count) throw new Error(`Level ${level}: could not fill group`);
  }

  return shuffle(picked, rng);
}
