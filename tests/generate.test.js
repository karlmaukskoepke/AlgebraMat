import { describe, it, expect } from 'vitest';
import { generateLevel, PROBLEMS_PER_LEVEL, MAX_ABS, SMALL_MAX } from '../src/engine/generate.js';
import { evaluate, partyOrBattle } from '../src/engine/expr.js';

const SEEDS = Array.from({ length: 200 }, (_, i) => i * 7919 + 1);
const count = (ps, f) => ps.filter(f).length;

describe.each([1, 2, 3, 4])('level %i', (level) => {
  it('meets the shared constraints for every seed', () => {
    for (const seed of SEEDS) {
      const ps = generateLevel(level, seed);
      expect(ps).toHaveLength(PROBLEMS_PER_LEVEL);
      for (const p of ps) {
        for (const t of [p.left, p.right]) {
          expect(t.kind).toBe('int');
          expect(t.value).not.toBe(0);
          expect(Math.abs(t.value)).toBeLessThanOrEqual(MAX_ABS);
        }
        if (level < 4) expect(evaluate(p)).not.toBe(0);
      }
      const answers = ps.map(evaluate);
      expect(new Set(answers).size).toBe(answers.length);
    }
  });

  it('gives the same problems for the same seed', () => {
    expect(generateLevel(level, 42)).toEqual(generateLevel(level, 42));
  });

  it('gives different problems for different seeds', () => {
    const sets = new Set(SEEDS.slice(0, 20).map((s) => JSON.stringify(generateLevel(level, s))));
    expect(sets.size).toBeGreaterThan(15);
  });
});

describe('level-specific rules', () => {
  it('level 1: positive − (negative), always a Party', () => {
    for (const seed of SEEDS) for (const p of generateLevel(1, seed)) {
      expect(p.op).toBe('-');
      expect(p.left.value).toBeGreaterThan(0);
      expect(p.right.value).toBeLessThan(0);
      expect(partyOrBattle(p)).toBe('party');
    }
  });

  it('level 2: negative − (negative), always a Battle, at least 2 of each winner', () => {
    for (const seed of SEEDS) {
      const ps = generateLevel(2, seed);
      for (const p of ps) {
        expect(p.op).toBe('-');
        expect(p.left.value).toBeLessThan(0);
        expect(p.right.value).toBeLessThan(0);
        expect(partyOrBattle(p)).toBe('battle');
      }
      expect(count(ps, (p) => evaluate(p) > 0)).toBeGreaterThanOrEqual(2);
      expect(count(ps, (p) => evaluate(p) < 0)).toBeGreaterThanOrEqual(2);
    }
  });

  it('level 3: number − positive, at least 2 Party and 2 Battle', () => {
    for (const seed of SEEDS) {
      const ps = generateLevel(3, seed);
      for (const p of ps) {
        expect(p.op).toBe('-');
        expect(p.right.value).toBeGreaterThan(0);
      }
      expect(count(ps, (p) => partyOrBattle(p) === 'party')).toBeGreaterThanOrEqual(2);
      expect(count(ps, (p) => partyOrBattle(p) === 'battle')).toBeGreaterThanOrEqual(2);
    }
  });

  it('level 4: 1–2 addition problems, the rest subtraction, both counts occur', () => {
    const seen = new Set();
    for (const seed of SEEDS) {
      const adds = count(generateLevel(4, seed), (p) => p.op === '+');
      expect(adds).toBeGreaterThanOrEqual(1);
      expect(adds).toBeLessThanOrEqual(2);
      seen.add(adds);
    }
    expect(seen).toEqual(new Set([1, 2]));
  });

  it('levels 1–2 lean toward small numbers but still use the full range', () => {
    const maxOp = (p) => Math.max(Math.abs(p.left.value), Math.abs(p.right.value));
    const smallShare = (level) => {
      const ps = SEEDS.flatMap((s) => generateLevel(level, s));
      return count(ps, (p) => maxOp(p) <= SMALL_MAX) / ps.length;
    };
    for (const level of [1, 2]) {
      expect(smallShare(level)).toBeGreaterThan(0.5);
      expect(smallShare(level)).toBeGreaterThan(smallShare(3) + 0.2);
      const ps = SEEDS.flatMap((s) => generateLevel(level, s));
      expect(ps.some((p) => maxOp(p) > SMALL_MAX)).toBe(true);
    }
  });

  it('rejects unknown levels', () => {
    expect(() => generateLevel(5, 1)).toThrow();
  });
});
