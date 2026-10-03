import { describe, it, expect } from 'vitest';
import { MINUS as M } from '../src/engine/expr.js';
import {
  makeGroups, isFraction, isOpposite, lassoCount, partValue, groupTotal, evaluateGroups, formatGroups,
} from '../src/engine/groups.js';
import {
  generateLassoLevel, LASSO_LEVEL_COUNT, MAX_GROUPS, MAX_IN_GROUP, MAX_COUNTERS, MAX_SINGLE_GROUP,
  MAX_DEAL_BY_DENOMINATOR, DENOMINATORS, PROBLEMS_PER_LEVEL,
} from '../src/engine/generateLasso.js';

describe('group problems: A(B) means A groups of B', () => {
  it('matches every worked example in the notes', () => {
    const cases = [
      // [A, B, options, text, total before opposite, answer]
      [{ n: 3 }, -2, {}, `3(${M}2)`, -6, -6],
      [{ neg: true, n: 1 }, -2, { hidden1: true }, `${M}(${M}2)`, -2, 2],
      [{ neg: true, n: 2 }, -4, {}, `${M}2(${M}4)`, -8, 8],
      [{ n: 4 }, -3, {}, `4(${M}3)`, -12, -12],
      [{ neg: true, n: 1 }, -5, { hidden1: true }, `${M}(${M}5)`, -5, 5],
      [{ neg: true, n: 5 }, -2, {}, `${M}5(${M}2)`, -10, 10],
      [{ neg: true, n: 3 }, 4, {}, `${M}3(4)`, 12, -12],
      [{ n: 2, d: 3 }, -6, {}, `2/3(${M}6)`, -4, -4],
      [{ n: 1, d: 4 }, -16, {}, `1/4(${M}16)`, -4, -4],
      [{ n: 4, d: 5 }, -10, {}, `4/5(${M}10)`, -8, -8],
    ];
    for (const [a, b, opts, text, total, answer] of cases) {
      const p = makeGroups(a, b, opts);
      expect(formatGroups(p)).toBe(text);
      expect(groupTotal(p)).toBe(total);
      expect(evaluateGroups(p)).toBe(answer);
    }
  });

  it('knows how many lassos and how big each part is', () => {
    expect(lassoCount(makeGroups({ n: 3 }, -2))).toBe(3);
    expect(lassoCount(makeGroups({ neg: true, n: 1 }, 4, { hidden1: true }))).toBe(1);
    const frac = makeGroups({ neg: true, n: 2, d: 3 }, -6);
    expect(isFraction(frac) && isOpposite(frac)).toBe(true);
    expect(lassoCount(frac)).toBe(1); // one whole group, then split
    expect(partValue(frac)).toBe(-2);
    expect(formatGroups(makeGroups({ neg: true, n: 1 }, -5))).toBe(`${M}1(${M}5)`);
  });

  it('rejects impossible problems', () => {
    expect(() => makeGroups({ n: 0 }, 3)).toThrow();
    expect(() => makeGroups({ n: 2 }, 0)).toThrow();
    expect(() => makeGroups({ n: 1, d: 4 }, 6)).toThrow(); // 6 doesn't split into 4 equal parts
    expect(() => makeGroups({ n: 3 }, 2, { hidden1: true })).toThrow();
  });

  it('leaves room for variable terms inside the groups', () => {
    expect(makeGroups({ n: 3 }, -2).inside).toEqual({ kind: 'int', value: -2 });
  });
});

const SEEDS = Array.from({ length: 150 }, (_, i) => i * 7919 + 3);
const count = (ps, f) => ps.filter(f).length;
const levels = Array.from({ length: LASSO_LEVEL_COUNT }, (_, i) => i + 1);

describe.each(levels)('Lasso level %i', (level) => {
  it('meets the shared rules for every seed', () => {
    for (const seed of SEEDS) {
      const ps = generateLassoLevel(level, seed);
      expect(ps).toHaveLength(PROBLEMS_PER_LEVEL);
      const answers = ps.map(evaluateGroups);
      expect(new Set(answers).size).toBe(ps.length);
      for (const p of ps) {
        expect(p.inside.value).not.toBe(0);
        expect(evaluateGroups(p)).not.toBe(0);
        expect(Number.isInteger(evaluateGroups(p))).toBe(true);
      }
      // mixed signs inside the groups
      expect(count(ps, (p) => p.inside.value > 0)).toBeGreaterThanOrEqual(1);
      expect(count(ps, (p) => p.inside.value < 0)).toBeGreaterThanOrEqual(1);
    }
  });

  it('gives the same problems for the same seed, and varies across seeds', () => {
    expect(generateLassoLevel(level, 42)).toEqual(generateLassoLevel(level, 42));
    const sets = new Set(SEEDS.slice(0, 20).map((s) => JSON.stringify(generateLassoLevel(level, s))));
    expect(sets.size).toBeGreaterThan(15);
  });
});

describe('Lasso level rules (SPEC-LASSO.md §4)', () => {
  const all = (level) => SEEDS.flatMap((s) => generateLassoLevel(level, s));

  it('level 1: positive whole groups, 2–5 lassos of up to 5, at least 2 of each sign of B', () => {
    for (const seed of SEEDS) {
      const ps = generateLassoLevel(1, seed);
      expect(count(ps, (p) => p.inside.value > 0)).toBeGreaterThanOrEqual(2);
      expect(count(ps, (p) => p.inside.value < 0)).toBeGreaterThanOrEqual(2);
    }
    for (const p of all(1)) {
      expect(p.count).toMatchObject({ neg: false, d: 1 });
      expect(p.count.n).toBeGreaterThanOrEqual(2);
      expect(p.count.n).toBeLessThanOrEqual(MAX_GROUPS);
      expect(Math.abs(p.inside.value)).toBeLessThanOrEqual(MAX_IN_GROUP);
      expect(Math.abs(groupTotal(p))).toBeLessThanOrEqual(MAX_COUNTERS);
    }
  });

  it('level 2: opposite of one group, B up to ±8, at least 2 hide the 1', () => {
    for (const seed of SEEDS) {
      expect(count(generateLassoLevel(2, seed), (p) => p.hidden1)).toBeGreaterThanOrEqual(2);
    }
    for (const p of all(2)) {
      expect(p.count).toEqual({ neg: true, n: 1, d: 1 });
      expect(Math.abs(p.inside.value)).toBeLessThanOrEqual(MAX_SINGLE_GROUP);
    }
    expect(all(2).some((p) => !p.hidden1)).toBe(true); // −1(B) appears too
  });

  it('level 3: opposite of 2–5 groups', () => {
    for (const p of all(3)) {
      expect(p.count.neg).toBe(true);
      expect(p.count.d).toBe(1);
      expect(p.count.n).toBeGreaterThanOrEqual(2);
      expect(p.count.n).toBeLessThanOrEqual(MAX_GROUPS);
      expect(Math.abs(p.inside.value)).toBeLessThanOrEqual(MAX_IN_GROUP);
      expect(Math.abs(groupTotal(p))).toBeLessThanOrEqual(MAX_COUNTERS);
      expect(Math.sign(evaluateGroups(p))).toBe(-Math.sign(p.inside.value));
    }
  });

  it.each([[4, false], [5, true]])('level %i: unit fractions (opposite: %s)', (level, neg) => {
    const seen = new Set();
    for (const p of all(level)) {
      expect(p.count.neg).toBe(neg);
      expect(p.count.n).toBe(1);
      expect(p.count.d).toBeGreaterThanOrEqual(2);
      expect(DENOMINATORS).toContain(p.count.d);
      expect(Math.abs(p.inside.value) % p.count.d).toBe(0);
      expect(Math.abs(p.inside.value)).toBeLessThanOrEqual(MAX_DEAL_BY_DENOMINATOR[p.count.d]);
      seen.add(p.count.d);
    }
    expect(seen).toEqual(new Set([2, 3, 4, 5, 6, 8]));
  });

  it.each([[6, false], [7, true]])('level %i: non-unit fractions (opposite: %s)', (level, neg) => {
    const seen = new Set();
    for (const p of all(level)) {
      expect(p.count.neg).toBe(neg);
      expect(p.count.n).toBeGreaterThan(1);
      expect(p.count.n).toBeLessThan(p.count.d);
      expect(DENOMINATORS).toContain(p.count.d);
      expect(Math.abs(p.inside.value) % p.count.d).toBe(0);
      expect(Math.abs(p.inside.value)).toBeLessThanOrEqual(MAX_DEAL_BY_DENOMINATOR[p.count.d]);
      seen.add(`${p.count.n}/${p.count.d}`);
    }
    // every friendly fraction up to eighths shows up somewhere
    expect(seen).toEqual(new Set(['2/3', '3/4', '2/5', '3/5', '4/5', '5/6', '3/8', '5/8', '7/8'])); // lowest terms only
  });

  it('levels 1–2 lean toward small totals', () => {
    const small = (ps) => count(ps, (p) => Math.abs(groupTotal(p)) <= 10) / ps.length;
    expect(small(all(1))).toBeGreaterThan(0.6);
  });

  it('levels that differ only by an opposite do not mirror each other', () => {
    const strip = (ps) => JSON.stringify(ps.map((p) => [p.count.n, p.count.d, p.inside.value]));
    for (const [a, b] of [[1, 3], [4, 5], [6, 7]]) {
      const same = SEEDS.slice(0, 30).filter((s) => strip(generateLassoLevel(a, s)) === strip(generateLassoLevel(b, s)));
      expect(same.length).toBeLessThan(3);
    }
  });

  it('rejects unknown levels', () => {
    expect(() => generateLassoLevel(8, 1)).toThrow();
  });
});

describe('how big a number a fraction can be taken of (Karl, 2026-10-03)', () => {
  it('thirds to 18, fourths to 24, fifths to 30, sixths and eighths to 24, with the eighths in', () => {
    expect(MAX_DEAL_BY_DENOMINATOR).toEqual({ 2: 16, 3: 18, 4: 24, 5: 30, 6: 24, 8: 24 });
    const biggest = {};
    for (const level of [4, 5, 6, 7]) {
      for (let seed = 1; seed <= 400; seed++) {
        for (const p of generateLassoLevel(level, seed)) {
          biggest[p.count.d] = Math.max(biggest[p.count.d] ?? 0, Math.abs(p.inside.value));
        }
      }
    }
    expect(biggest[3]).toBeGreaterThan(12);          // bigger than before
    expect(biggest[5]).toBeGreaterThan(20);
    expect(biggest[8]).toBeGreaterThan(12);
  });
});
