import { describe, it, expect } from 'vitest';
import {
  generateDistributeLevel, DISTRIBUTE_LEVEL_COUNT, MAX_DRAWN, PROBLEMS_PER_LEVEL,
} from '../src/engine/generateDistribute.js';
import {
  formatDistribute, answerText, evaluateDistribute, openPieces, groupParts, looseTerms, startsWithGroup,
} from '../src/engine/distribute.js';

const SEEDS = Array.from({ length: 40 }, (_, i) => 1000 + i * 7919);
const sets = (level) => SEEDS.map((seed) => generateDistributeLevel(level, seed));
const bothParts = (p) => { const a = evaluateDistribute(p); return a.x !== 0 && a.n !== 0; };

describe('Distribute, then combine levels', () => {
  it('has 5 levels of 5 problems, and rejects other levels', () => {
    expect(DISTRIBUTE_LEVEL_COUNT).toBe(5);
    for (let level = 1; level <= 5; level++) expect(generateDistributeLevel(level, 5)).toHaveLength(PROBLEMS_PER_LEVEL);
    expect(() => generateDistributeLevel(0, 1)).toThrow();
    expect(() => generateDistributeLevel(6, 1)).toThrow();
  });

  it('gives the same set for one seed and level, and different sets for different seeds', () => {
    for (let level = 1; level <= 5; level++) {
      expect(generateDistributeLevel(level, 42)).toEqual(generateDistributeLevel(level, 42));
      const texts = new Set(SEEDS.map((s) => generateDistributeLevel(level, s).map(formatDistribute).join('|')));
      expect(texts.size).toBeGreaterThan(20);
    }
  });

  it('never repeats a problem or an answer in a set, and never makes a blank answer', () => {
    for (let level = 1; level <= 5; level++) {
      for (const set of sets(level)) {
        expect(new Set(set.map(formatDistribute)).size).toBe(5);
        expect(new Set(set.map(answerText)).size).toBe(5);
        for (const p of set) expect(answerText(p)).not.toBe('0');
      }
    }
  });

  it('rounds 1 to 3 stay small enough to draw, and the answer has both an x part and a number', () => {
    for (let level = 1; level <= 3; level++) {
      for (const p of sets(level).flat()) {
        expect(openPieces(p)).toBeLessThanOrEqual(MAX_DRAWN);
        expect(bothParts(p)).toBe(true);
        for (const g of groupParts(p)) {
          expect(g.n).toBeLessThanOrEqual(4);
          for (const t of g.inside) expect(Math.abs(t.value)).toBeLessThanOrEqual(level === 2 ? 6 : 5);
        }
      }
    }
  });

  it('Round 1: A + B(Cx + D) and B(Cx + D) + A, at least 2 of each', () => {
    for (const set of sets(1)) {
      for (const p of set) {
        expect(groupParts(p)).toHaveLength(1);
        expect(groupParts(p)[0].op).toBe('+');
        expect(groupParts(p)[0].n).toBeGreaterThanOrEqual(2);
        expect(looseTerms(p)).toHaveLength(1);
        if (startsWithGroup(p)) expect(looseTerms(p)[0].value).toBeGreaterThan(0);
      }
      expect(set.filter(startsWithGroup).length).toBeGreaterThanOrEqual(2);
      expect(set.filter((p) => !startsWithGroup(p)).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('Round 2: A + (Bx + C) and A − (Bx + C) with the 1 hidden, at least 2 of each op', () => {
    for (const set of sets(2)) {
      for (const p of set) {
        const [g] = groupParts(p);
        expect([g.n, g.hiddenOne, startsWithGroup(p)]).toEqual([1, true, false]);
      }
      expect(set.filter((p) => groupParts(p)[0].op === '-').length).toBeGreaterThanOrEqual(2);
      expect(set.filter((p) => groupParts(p)[0].op === '+').length).toBeGreaterThanOrEqual(2);
    }
  });

  it('Round 3: A − B(Cx + D) with an integer A, and mostly a negative inside', () => {
    for (const set of sets(3)) {
      for (const p of set) {
        const [g] = groupParts(p);
        expect(g.op).toBe('-');
        expect(g.n).toBeGreaterThanOrEqual(2);
        expect(looseTerms(p)[0].kind).toBe('int');
        expect(startsWithGroup(p)).toBe(false);
      }
      expect(set.filter((p) => groupParts(p)[0].inside.some((t) => t.value < 0)).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('Rounds 4 and 5 mix the forms, with larger values', () => {
    const r4 = sets(4);
    for (const set of r4) {
      expect(set.some((p) => groupParts(p)[0].hiddenOne)).toBe(true);
      expect(set.some((p) => groupParts(p)[0].op === '-' && groupParts(p)[0].n > 1)).toBe(true);
      expect(set.some(startsWithGroup)).toBe(true);
    }
    expect(r4.flat().some((p) => groupParts(p)[0].n >= 6)).toBe(true);
    for (const set of sets(5)) {
      expect(set.filter((p) => looseTerms(p).length >= 2).length).toBeGreaterThanOrEqual(2);
      expect(set.some((p) => groupParts(p).length === 2)).toBe(true);
      expect(set.some((p) => groupParts(p).some((g) => g.inside[0].kind === 'int'))).toBe(true);
    }
  });
});
