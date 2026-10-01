import { describe, it, expect } from 'vitest';
import {
  generateTermGroupsLevel, TERM_GROUPS_LEVEL_COUNT, MAX_PIECES, MAX_DEAL, MAX_BOXES, MAX_COUNTERS, MAX_GROUPS, PROBLEMS_PER_LEVEL,
} from '../src/engine/generateTermGroups.js';
import { isFraction, isOpposite, isNumberFirst, pieceTotal, formatTermGroups, answerText, xTerm, numTerm, groupCount } from '../src/engine/termGroups.js';

const SEEDS = Array.from({ length: 60 }, (_, i) => 1000 + i * 7919);
const sets = (level) => SEEDS.map((seed) => generateTermGroupsLevel(level, seed));
const hasNegative = (p) => p.inside.some((t) => t.value < 0);

describe('Groups of Terms levels', () => {
  it('has 8 levels of 5 problems, and rejects other levels', () => {
    expect(TERM_GROUPS_LEVEL_COUNT).toBe(8);
    for (let level = 1; level <= 8; level++) expect(generateTermGroupsLevel(level, 5)).toHaveLength(PROBLEMS_PER_LEVEL);
    expect(() => generateTermGroupsLevel(0, 1)).toThrow();
    expect(() => generateTermGroupsLevel(9, 1)).toThrow();
  });

  it('gives the same set for one seed and level, and different sets for different seeds', () => {
    for (let level = 1; level <= 8; level++) {
      expect(generateTermGroupsLevel(level, 42)).toEqual(generateTermGroupsLevel(level, 42));
      const texts = new Set(SEEDS.map((s) => generateTermGroupsLevel(level, s).map(formatTermGroups).join('|')));
      expect(texts.size).toBeGreaterThan(20);
    }
  });

  it('never repeats a problem or an answer in a set, and never makes a zero', () => {
    for (let level = 1; level <= 8; level++) {
      for (const set of sets(level)) {
        expect(new Set(set.map(formatTermGroups)).size).toBe(5);
        expect(new Set(set.map(answerText)).size).toBe(5);
        for (const p of set) for (const t of p.inside) expect(t.value).not.toBe(0);
      }
    }
  });

  it('keeps every problem to whole coefficients and a drawable number of pieces', () => {
    for (let level = 1; level <= 8; level++) {
      for (const p of sets(level).flat()) {
        const { n, d } = p.count;
        for (const t of p.inside) expect(Number.isInteger((n * t.value) / d)).toBe(true);
        if (isFraction(p)) {
          expect(n).toBeLessThan(d);
          expect(d).toBeLessThanOrEqual(6);
          expect(pieceTotal(p)).toBeLessThanOrEqual(MAX_DEAL);
        } else {
          expect(groupCount(p)).toBeLessThanOrEqual(MAX_GROUPS);
          expect(Math.abs(xTerm(p).value)).toBeLessThanOrEqual(MAX_BOXES);
          expect(Math.abs(numTerm(p).value)).toBeLessThanOrEqual(MAX_COUNTERS);
          expect(pieceTotal(p)).toBeLessThanOrEqual(MAX_PIECES);
        }
      }
    }
  });

  it('Level 1: A positive, B all positive. Level 2: a negative number. Level 3: a negative x term', () => {
    for (const p of sets(1).flat()) expect([isOpposite(p), isFraction(p), hasNegative(p)]).toEqual([false, false, false]);
    for (const p of sets(2).flat()) {
      expect(isOpposite(p)).toBe(false);
      expect(xTerm(p).value).toBeGreaterThan(0);
      expect(numTerm(p).value).toBeLessThan(0);
    }
    for (const p of sets(3).flat()) {
      expect(isOpposite(p)).toBe(false);
      expect(xTerm(p).value).toBeLessThan(0);
    }
  });

  it('Level 4: A negative and B all positive, with at least 2 hiding the 1 each set', () => {
    for (const set of sets(4)) {
      expect(set.filter((p) => p.hidden1).length).toBeGreaterThanOrEqual(2);
      for (const p of set) expect([isOpposite(p), isFraction(p), hasNegative(p)]).toEqual([true, false, false]);
    }
  });

  it('x comes first in the early levels; the challenge levels (5 and 8) put the number first in at least 2 of 5', () => {
    for (const level of [1, 2, 3, 4, 6, 7]) for (const p of sets(level).flat()) expect(isNumberFirst(p)).toBe(false);
    for (const level of [5, 8]) {
      for (const set of sets(level)) {
        expect(set.filter(isNumberFirst).length).toBeGreaterThanOrEqual(2);
        expect(set.filter((p) => !isNumberFirst(p)).length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('Level 5: A negative, B has a negative. Levels 6 and 7: positive fractions (unit, then others). Level 8: negative fractions', () => {
    for (const p of sets(5).flat()) expect([isOpposite(p), isFraction(p), hasNegative(p)]).toEqual([true, false, true]);
    for (const p of sets(6).flat()) expect([isOpposite(p), isFraction(p), p.count.n]).toEqual([false, true, 1]);
    for (const p of sets(7).flat()) { expect([isOpposite(p), isFraction(p)]).toEqual([false, true]); expect(p.count.n).toBeGreaterThan(1); }
    for (const p of sets(8).flat()) { expect([isOpposite(p), isFraction(p)]).toEqual([true, true]); }
  });

  it('mixes the signs in the fraction levels', () => {
    for (const level of [6, 7]) for (const set of sets(level)) {
      expect(set.filter(hasNegative).length).toBeGreaterThanOrEqual(3);
      expect(set.filter((p) => !hasNegative(p)).length).toBeGreaterThanOrEqual(1);
    }
  });
});
