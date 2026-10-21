import { describe, it, expect } from 'vitest';
import { makeDivide, formatDivide, tagDivide, checkDivide, legalFractions, takeFraction, balances, answerText } from '../src/engine/divide.js';
import { generateDivideLevel } from '../src/engine/generateDivide.js';

const P = (a, x) => makeDivide(a, x);

describe('a Divide it problem', () => {
  it('is built from its answer and checked by substitution', () => {
    const p = P(3, -4);
    expect([p.a, p.b, p.x, formatDivide(p), answerText(p)]).toEqual([3, -12, -4, '3x = −12', '−4']);
    expect(balances(p, -4)).toBe(true);
    expect(balances(p, 4)).toBe(false);
    expect(() => makeDivide(3, 1)).toThrow();
    expect(() => makeDivide(3, 0)).toThrow();
    expect(() => makeDivide(7, 2)).toThrow();
  });
  it('lists the fractions that split both sides: the divisors of a from 2 to 6; only n = a finishes', () => {
    expect(legalFractions(P(3, -4))).toEqual([3]);
    expect(legalFractions(P(4, -6))).toEqual([2, 4]);
    expect(legalFractions(P(6, 2))).toEqual([2, 3, 6]);
    expect(takeFraction(P(6, 2), 2)).toMatchObject({ ok: true, a: 3, b: 6, finishes: false });
    expect(takeFraction(P(6, 2), 6)).toMatchObject({ ok: true, a: 1, b: 2, finishes: true });
  });
  it('shows which side breaks for a fraction that does not split', () => {
    expect(takeFraction(P(3, -4), 2)).toMatchObject({ ok: false, boxesSplit: false, countersSplit: true });     // 3 boxes, −12
    expect(takeFraction(P(3, -4), 4)).toMatchObject({ ok: false, boxesSplit: false, countersSplit: true });
    expect(takeFraction(P(3, -4), 5)).toMatchObject({ ok: false, boxesSplit: false, countersSplit: false, leftOver: 2 });
  });
});

describe('what a wrong answer looked like (the spec §5 examples, one tag each)', () => {
  const tag = (a, x, typed) => tagDivide(P(a, x), typed);
  it('3x = −12', () => {
    expect([-9, -15].map((t) => tag(3, -4, t))).toEqual(['undid-add', 'undid-add']);
    expect(tag(3, -4, -36)).toBe('multiplied');
    expect(tag(3, -4, 3)).toBe('gave-boxes');
    expect(tag(3, -4, -12)).toBe('ignored-front');
    expect(tag(3, -4, 4)).toBe('wrong-team');
    expect([-6, -3].map((t) => tag(3, -4, t))).toEqual(['wrong-groups', 'wrong-groups']);
  });
  it('stopped halfway', () => {
    expect([6, 4].map((t) => tag(6, 2, t))).toEqual(['halfway', 'halfway']);                  // after ½ and after ⅓
    expect([-9, -6].map((t) => tag(6, -3, t))).toEqual(['halfway', 'halfway']);
    expect(tag(4, 6, 12)).toBe('halfway');                                                     // 4x = 24 after ½
    expect(tag(4, 6, 8)).toBe('wrong-groups');                                                 // ÷3
  });
  it('is null for the right answer and says unmatched for anything else', () => {
    expect(tag(3, -4, -4)).toBeNull();
    expect(tag(3, -4, 7)).toBe('unmatched');
    expect(checkDivide(P(3, -4), '−4')).toMatchObject({ correct: true, tag: null });
    expect(checkDivide(P(3, -4), '')).toMatchObject({ unreadable: true });
  });
});

describe('the generator', () => {
  const sets = [];
  for (let level = 1; level <= 5; level++) for (let seed = 0; seed < 150; seed++) sets.push({ level, seed, set: generateDivideLevel(level, seed) });
  const of = (level) => sets.filter((s) => s.level === level);

  it('makes five problems, answers never 0 or ±1 or equal to a, no repeats, every one verified by substitution', () => {
    for (const { set } of sets) {
      expect(set).toHaveLength(5);
      expect(new Set(set.map((p) => p.x)).size).toBe(5);
      expect(new Set(set.map(formatDivide)).size).toBe(5);
      for (const p of set) {
        expect(p.a * p.x).toBe(p.b);
        expect([0, 1, -1, p.a].includes(p.x)).toBe(false);
        expect(Number.isInteger(p.b / p.a)).toBe(true);
      }
    }
  });
  it('keeps the same set for the same seed and changes it for another', () => {
    expect(generateDivideLevel(3, 9)).toEqual(generateDivideLevel(3, 9));
    expect(generateDivideLevel(3, 9)).not.toEqual(generateDivideLevel(3, 10));
  });
  it('has the form counts of the spec', () => {
    const signs = (set) => [set.filter((p) => p.x < 0).length, set.filter((p) => p.x > 0).length];
    for (const { set } of sets) expect(Math.min(...signs(set))).toBeGreaterThanOrEqual(2);
    for (const { set } of of(1)) { expect(set.filter((p) => p.a === 2).length).toBeGreaterThanOrEqual(2); expect(set.filter((p) => p.a === 3).length).toBeGreaterThanOrEqual(2); expect(set.every((p) => [2, 3].includes(p.a) && Math.abs(p.b) <= 15 && Math.abs(p.x) <= 5)).toBe(true); }
    for (const { set } of of(2)) { for (const a of [2, 3, 4, 5]) expect(set.some((p) => p.a === a)).toBe(true); expect(set.every((p) => Math.abs(p.b) <= 30 && Math.abs(p.x) <= 6)).toBe(true); }
    for (const { set } of of(3)) expect(set.every((p) => p.a >= 2 && p.a <= 5 && Math.abs(p.b) <= 36)).toBe(true);
    for (const { set } of of(4)) { expect(set.filter((p) => p.a === 4).length).toBeGreaterThanOrEqual(2); expect(set.filter((p) => p.a === 6).length).toBeGreaterThanOrEqual(2); expect(set.every((p) => legalFractions(p).length >= 2)).toBe(true); }
    for (const { set } of of(5)) expect(new Set(set.map((p) => p.a)).size).toBeGreaterThanOrEqual(3);
  });
  it('never lets a wrong answer a slip produces equal the right answer', () => {
    for (const { set } of sets) for (const p of set) for (const t of [p.b, -p.x, p.a * p.b, p.a, p.b + p.a, p.b - p.a]) expect(t === p.x).toBe(false);
  });
});

import { stackRowsFor, worstCaseRows, generateDivideLevel as genLevel } from '../src/engine/generateDivide.js';
describe('the generator: never ±a, and the worst-case work-stack height it reports (loop §3B, §8)', () => {
  it('no problem on any level has an answer of 0, ±1 or ±a, and b is never ±a', () => {
    for (let level = 1; level <= 5; level++) for (let seed = 0; seed < 60; seed++) for (const p of genLevel(level, seed)) {
      expect([0, 1, -1, p.a, -p.a]).not.toContain(p.x);
      expect([p.a, -p.a]).not.toContain(p.b);
      expect(p.a * p.x).toBe(p.b);                                                              // verified by substitution
    }
  });
  // (Build I: the check has one more row, the equation itself above the line with the value in it)
  it('a prime coefficient is 9 rows at most; a composite one (a partial move is legal) is 10', () => {
    expect(stackRowsFor({ a: 3, b: -12, x: -4 })).toEqual({ moves: 3, answer: 2, check: 4, total: 9 });
    expect(stackRowsFor({ a: 6, b: 12, x: 2 })).toEqual({ moves: 4, answer: 2, check: 4, total: 10 });
    for (let level = 1; level <= 5; level++) expect(worstCaseRows(level).total).toBeLessThanOrEqual(10);
    expect(worstCaseRows(1).total).toBe(9);                                                      // generator level 1 = the card's Level 2: a is 2 or 3, no partial move
    expect([2, 3, 4, 5].map((l) => worstCaseRows(l).total)).toEqual([10, 10, 10, 10]);           // the card's Levels 3-6 have a composite a, so a partial move is legal
  });
});
