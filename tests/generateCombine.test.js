import { describe, it, expect } from 'vitest';
import {
  generateCombineLevel, generateFlipMixed, COMBINE_LEVEL_COUNT, MAX_SMALL, MAX_MANY, MAX_COUNTERS, BIG_MIN, BIG_MAX, PROBLEMS_PER_LEVEL,
} from '../src/engine/generateCombine.js';
import { evaluate as evaluateTwo, formatProblem, partyOrBattle } from '../src/engine/expr.js';
import { total, counterTotal, subtracted, combineFirst, meeting, termsText } from '../src/engine/combine.js';

const SEEDS = Array.from({ length: 60 }, (_, i) => 1000 + i * 7919);
const sets = (level) => SEEDS.map((seed) => generateCombineLevel(level, seed));
const answerOf = (level, p) => (level <= 2 ? evaluateTwo(p) : total(p));
const text = (level, p) => (level <= 2 ? formatProblem(p) : termsText(p));
const values = (p) => (p.terms ? p.terms.map((t) => t.value) : [p.left.value, p.right.value]);

describe('Combine it levels', () => {
  it('has 4 levels of 5 problems, and rejects other levels', () => {
    expect(COMBINE_LEVEL_COUNT).toBe(4);
    for (let level = 1; level <= 4; level++) expect(generateCombineLevel(level, 5)).toHaveLength(PROBLEMS_PER_LEVEL);
    expect(() => generateCombineLevel(0, 1)).toThrow();
    expect(() => generateCombineLevel(5, 1)).toThrow();
  });

  it('gives the same set for one seed and level, and different sets for different seeds', () => {
    for (let level = 1; level <= 4; level++) {
      expect(generateCombineLevel(level, 42)).toEqual(generateCombineLevel(level, 42));
      expect(new Set(SEEDS.map((s) => generateCombineLevel(level, s).map((p) => text(level, p)).join('|'))).size).toBeGreaterThan(20);
    }
  });

  it('never repeats a problem or an answer in a set, and never makes a zero', () => {
    for (let level = 1; level <= 4; level++) {
      for (const set of sets(level)) {
        expect(new Set(set.map((p) => text(level, p))).size).toBe(5);
        expect(new Set(set.map((p) => answerOf(level, p))).size).toBe(5);
        for (const p of set) { expect(answerOf(level, p)).not.toBe(0); for (const v of values(p)) expect(v).not.toBe(0); }
      }
    }
  });

  it('Level 1: a positive and a negative (all battles), at least 2 positive and 2 negative answers, numbers up to 12', () => {
    for (const set of sets(1)) {
      expect(set.filter((p) => evaluateTwo(p) > 0).length).toBeGreaterThanOrEqual(2);
      expect(set.filter((p) => evaluateTwo(p) < 0).length).toBeGreaterThanOrEqual(2);
      for (const p of set) {
        expect(p.op).toBe('+');
        expect(partyOrBattle(p)).toBe('battle');
        for (const v of values(p)) expect(Math.abs(v)).toBeLessThanOrEqual(MAX_SMALL);
      }
    }
  });

  it('Level 2: negatives and negatives (all parties)', () => {
    for (const p of sets(2).flat()) {
      expect(p.op).toBe('+');
      expect(partyOrBattle(p)).toBe('party');
      expect(values(p).every((v) => v < 0 && v >= -MAX_SMALL)).toBe(true);
    }
  });

  it('Level 3: three or four terms, both signs, small numbers and few counters, a mix of answers and lengths', () => {
    for (const set of sets(3)) {
      expect(set.filter((p) => total(p) > 0).length).toBeGreaterThanOrEqual(2);
      expect(set.filter((p) => total(p) < 0).length).toBeGreaterThanOrEqual(2);
      expect(set.filter((p) => p.terms.length === 3).length).toBeGreaterThanOrEqual(2);
      expect(set.filter((p) => p.terms.length === 4).length).toBeGreaterThanOrEqual(2);
      for (const p of set) {
        expect(p.terms.every((t) => t.op === '+')).toBe(true);
        expect(values(p).some((v) => v > 0) && values(p).some((v) => v < 0)).toBe(true);
        expect(counterTotal(p)).toBeLessThanOrEqual(MAX_COUNTERS);
        for (const v of values(p)) expect(Math.abs(v)).toBeLessThanOrEqual(MAX_MANY);
      }
    }
  });

  it('Level 4: values 11 to 60, two terms (a party and a battle in each set) and two with three terms (a pair that shares a sign)', () => {
    for (const set of sets(4)) {
      const two = set.filter((p) => p.terms.length === 2);
      const three = set.filter((p) => p.terms.length === 3);
      expect(three.length).toBeGreaterThanOrEqual(2);
      expect(two.some((p) => meeting(...values(p)) === 'party')).toBe(true);
      expect(two.some((p) => meeting(...values(p)) === 'battle')).toBe(true);
      for (const p of three) expect(combineFirst(p)).not.toBeNull();
      for (const p of set) for (const v of values(p)) { expect(Math.abs(v)).toBeGreaterThanOrEqual(BIG_MIN); expect(Math.abs(v)).toBeLessThanOrEqual(BIG_MAX); }
    }
  });
});

describe("Flip It's mixed level", () => {
  const mixed = SEEDS.map((s) => generateFlipMixed(s));

  it('gives 5 problems, the same for one seed, different for others, with distinct answers', () => {
    expect(generateFlipMixed(7)).toHaveLength(5);
    expect(generateFlipMixed(7)).toEqual(generateFlipMixed(7));
    expect(new Set(mixed.map((set) => set.map(termsText).join('|'))).size).toBeGreaterThan(20);
    for (const set of mixed) {
      expect(new Set(set.map(termsText)).size).toBe(5);
      expect(new Set(set.map(total)).size).toBe(5);
    }
  });

  it('is 3 or 4 terms with small numbers, with the first term added', () => {
    for (const p of mixed.flat()) {
      expect([3, 4]).toContain(p.terms.length);
      expect(p.terms[0].op).toBe('+');
      expect(counterTotal(p)).toBeLessThanOrEqual(MAX_COUNTERS);
      for (const v of values(p)) { expect(v).not.toBe(0); expect(Math.abs(v)).toBeLessThanOrEqual(MAX_MANY); }
    }
  });

  it('has variety: one with nothing to rewrite, one subtraction, two or more subtractions, a negative first number', () => {
    for (const set of mixed) {
      expect(set.filter((p) => subtracted(p).length === 0).length).toBeGreaterThanOrEqual(1);
      expect(set.filter((p) => subtracted(p).length === 1).length).toBeGreaterThanOrEqual(1);
      expect(set.filter((p) => subtracted(p).length >= 2).length).toBeGreaterThanOrEqual(2);
      expect(set.filter((p) => p.terms[0].value < 0).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('can have a zero answer (as Flip It\'s Level 4 does)', () => {
    expect(mixed.flat().some((p) => total(p) === 0)).toBe(true);
  });
});
