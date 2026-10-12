import { describe, it, expect } from 'vitest';
import {
  makeAddBoth, formatAddBoth, answerText, constantOf, oppositeOf, isBattle, balances, slipsOf, tagAddBoth, checkAddBoth,
} from '../src/engine/addBoth.js';
import { generateAddBothLevel, generateEquationLevel, ADD_BOTH_LEVELS } from '../src/engine/generateAddBoth.js';

const P = (form, a, b, mirror = false) => makeAddBoth(form, a, form === 'x+a' ? b - a : b + a, mirror);

// The spec's sample banks (SPEC-ADD-TO-BOTH-SIDES.md §2), as [form, a, b, answer, mirror].
const BANKS = {
  1: [['x+a', 3, -6, -9], ['x+a', 4, -2, -6], ['x+a', 7, -5, -12], ['x+a', 5, 2, -3], ['x+a', 6, 10, 4]],
  2: [['x-a', 5, -2, 3], ['x-a', 3, -6, -3], ['x-a', 4, 3, 7], ['x-a', 6, -1, 5], ['x-a', 2, -9, -7]],
  3: [['x+a', 8, 3, -5], ['x-a', 7, -4, 3], ['x-a', 2, 5, 7], ['x+a', 9, -1, -10], ['x-a', 4, -10, -6]],
  4: [['x+a', 3, 7, 4, true], ['x-a', 5, -2, 3, true], ['x+a', 9, 5, -4, true], ['x+a', 1, -8, -9, true], ['x-a', 4, 6, 10, true]],
  5: [['x+a', 12, -3, -15], ['x-a', 9, -6, 3, true], ['x-a', 11, 4, 15], ['x+a', 14, 8, -6, true], ['x+a', 10, 2, -8]],
  6: [['x+a', 6, -4, -10], ['x-a', 7, 2, 9], ['x-a', 4, -9, -5], ['x+a', 8, 1, -7], ['x-a', 9, -2, 7]],
};

describe('a problem', () => {
  it('is built from its solution, written in the notes\' way, and checked by substitution', () => {
    const p = makeAddBoth('x-a', 5, 3);
    expect(p).toMatchObject({ b: -2, x: 3 });
    expect(formatAddBoth(p)).toBe('x − 5 = −2');
    expect(formatAddBoth(makeAddBoth('x+a', 3, 4, true))).toBe('7 = x + 3');
    expect(answerText(makeAddBoth('x+a', 3, -9))).toBe('−9');
    expect(balances(p, 3)).toBe(true);
    expect(balances(p, 5)).toBe(false);                  // the answer for x − 5 = −2 is 3, not 5
    expect(constantOf(p)).toBe(-5);
    expect(oppositeOf(p)).toBe(5);
  });

  it('refuses what is half solved or not an equation of the card', () => {
    expect(() => makeAddBoth('x+a', 3, -3)).toThrow(/b must not be 0/);
    expect(() => makeAddBoth('x+a', 3, 0)).toThrow();
    expect(() => makeAddBoth('x+a', 0, 4)).toThrow();
    expect(() => makeAddBoth('ax', 2, 4)).toThrow();
  });

  it('is a Party when the opposite lands on a same-sign number, a Battle when the signs differ', () => {
    expect(isBattle(P('x+a', 3, -6))).toBe(false);       // −3 meets −6
    expect(isBattle(P('x+a', 5, 2))).toBe(true);         // −5 meets +2
    expect(isBattle(P('x-a', 5, -2))).toBe(true);        // +5 meets −2
    expect(isBattle(P('x-a', 4, 3))).toBe(false);        // +4 meets +3
  });
});

describe('the spec\'s sample banks', () => {
  it('are all correct problems', () => {
    for (const [level, rows] of Object.entries(BANKS)) {
      for (const [form, a, b, x, mirror = false] of rows) {
        const p = makeAddBoth(form, a, x, mirror);
        expect(p.b, `L${level} ${form} a=${a}`).toBe(b);
        expect(balances(p, x)).toBe(true);
      }
    }
  });
});

describe('what a wrong answer looked like', () => {
  it('names each slip with the spec\'s own examples', () => {
    expect(tagAddBoth(P('x+a', 3, -6), -3)).toBe('wrong-op');      // −6 + 3
    expect(tagAddBoth(P('x+a', 4, -2), 2)).toBe('wrong-op');
    expect(tagAddBoth(P('x-a', 5, -2), -7)).toBe('wrong-op');      // −2 − 5
    expect(tagAddBoth(P('x+a', 3, -6), -6)).toBe('untouched');
    expect(tagAddBoth(P('x+a', 5, 2), 3)).toBe('sign-flipped');    // Battle, wrong team
    expect(tagAddBoth(P('x+a', 4, -2), 6)).toBe('sign-flipped');
    expect(tagAddBoth(P('x+a', 7, -5), 12)).toBe('sign-flipped');
    expect(tagAddBoth(P('x-a', 5, -2), 7)).toBe('sizes-added');    // 5 + 2 for a Battle
    expect(tagAddBoth(P('x-a', 3, -6), 9)).toBe('sizes-added');
    expect(tagAddBoth(P('x+a', 3, 7, true), 10)).toBe('wrong-op'); // 7 = x + 3 → 10
    expect(tagAddBoth(P('x+a', 3, -6), -9)).toBeNull();            // the right answer
    expect(tagAddBoth(P('x+a', 3, -6), 100)).toBe('unmatched');
  });

  it('never tags the right answer, for any problem the generator makes', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (let level = 1; level <= 5; level++) {
        for (const p of generateEquationLevel(level, seed)) {
          for (const [tag, value] of Object.entries(slipsOf(p))) expect(value, `${formatAddBoth(p)} ${tag}`).not.toBe(p.x);
        }
      }
    }
  });

  it('reads typed text', () => {
    const p = P('x-a', 5, -2);
    expect(checkAddBoth(p, '3')).toMatchObject({ correct: true, typed: 3, tag: null });
    expect(checkAddBoth(p, '−7')).toMatchObject({ correct: false, tag: 'wrong-op' });
    expect(checkAddBoth(p, '').unreadable).toBe(true);
    expect(checkAddBoth(p, '-').unreadable).toBe(true);
  });
});

describe('the problems', () => {
  const sets = [];
  for (let seed = 1; seed <= 200; seed++) for (let level = 1; level <= 5; level++) sets.push({ level, seed, set: generateEquationLevel(level, seed) });

  it('are five a level, verified by substitution, never already solved, within the limits, with no repeats', () => {
    for (const { level, set } of sets) {
      expect(set).toHaveLength(5);
      expect(new Set(set.map((p) => p.x)).size).toBe(5);
      expect(new Set(set.map(formatAddBoth)).size).toBe(5);
      for (const p of set) {
        expect(p.kind).toBe('addboth');
        expect(balances(p, p.x)).toBe(true);
        expect(p.b !== 0 && p.x !== 0).toBe(true);
        expect(Math.abs(p.b)).toBeLessThanOrEqual(level >= 5 ? 15 : 12);
        expect(Math.abs(p.x)).toBeLessThanOrEqual(15);
        expect(p.a).toBeLessThanOrEqual(level >= 5 ? 14 : 9);
        expect(p.b).toBeGreaterThanOrEqual(level === 3 ? -10 : level >= 5 ? -15 : -9);
        if (level === 2 || level === 3) expect(p.a).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('follow each level\'s mix', () => {
    for (const { level, set } of sets) {
      const count = (f) => set.filter(f).length;
      if (level === 1) {
        expect(set.every((p) => p.form === 'x+a' && !p.mirror)).toBe(true);
        expect(count((p) => !isBattle(p))).toBe(3);                              // Parties
        expect(count(isBattle)).toBe(2);
        expect(count((p) => isBattle(p) && p.x > 0)).toBeGreaterThanOrEqual(1);
      }
      if (level === 2) {
        expect(set.every((p) => p.form === 'x-a' && !p.mirror)).toBe(true);
        expect(count((p) => isBattle(p) && p.b < 0)).toBeGreaterThanOrEqual(2);
        expect(count((p) => !isBattle(p))).toBeGreaterThanOrEqual(1);
        expect(count((p) => p.x < 0) >= 1 && count((p) => p.x > 0) >= 1).toBe(true);
      }
      if (level === 3) {
        expect(count((p) => p.form === 'x+a') >= 2 && count((p) => p.form === 'x-a') >= 2).toBe(true);
        expect(count((p) => p.x < 0) >= 2 && count((p) => p.x > 0) >= 2).toBe(true);
        expect(set.every((p) => !p.mirror)).toBe(true);
      }
      if (level === 4) {
        expect(count((p) => p.mirror)).toBe(3);
        expect(count((p) => !p.mirror)).toBe(2);
        expect(count((p) => p.x < 0)).toBeGreaterThanOrEqual(2);
      }
      if (level === 5) {
        for (const form of ['x+a', 'x-a']) for (const mirror of [false, true]) expect(count((p) => p.form === form && Boolean(p.mirror) === mirror)).toBeGreaterThanOrEqual(1);
        expect(count((p) => p.x < 0)).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('are the same for the same seed and different for another', () => {
    expect(generateEquationLevel(4, 9)).toEqual(generateEquationLevel(4, 9));
    expect(generateEquationLevel(4, 9)).not.toEqual(generateEquationLevel(4, 10));
    expect(generateAddBothLevel(5, 9)).toEqual(generateEquationLevel(4, 9));           // the card's L5 is the equation set 4
    expect(() => generateAddBothLevel(7, 1)).toThrow();
    expect(Object.keys(ADD_BOTH_LEVELS)).toHaveLength(5);
  });
});

describe('level 1: the numeric level', () => {
  it('is two "do" items then three quiz items, with numbers that vary, never balancing by accident', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const set = generateAddBothLevel(1, seed);
      expect(set.map((i) => i.item)).toEqual(['do', 'do', 'quiz', 'quiz', 'quiz']);
      expect(set[0].amount).toBeGreaterThan(0);
      expect(set[1].amount).toBeLessThan(0);
      for (const it of set) {
        const l = it.left.reduce((s, n) => s + n, 0);
        const r = it.right.reduce((s, n) => s + n, 0);
        expect(l).toBe(r);                                                           // each starts balanced
        expect(l).toBeGreaterThanOrEqual(5);
        expect(l).toBeLessThanOrEqual(9);
      }
      expect(new Set(set.map((i) => `${i.left}|${i.right}`)).size).toBe(5);
      expect(set.slice(2).map((i) => i.correct)).toEqual(['upsets', 'keeps', 'upsets']);
      for (const q of set.slice(2)) expect([...q.order].sort()).toEqual(['keeps', 'upsets']);
    }
  });
  it('is the same for the same seed', () => {
    expect(generateAddBothLevel(1, 4)).toEqual(generateAddBothLevel(1, 4));
    expect(generateAddBothLevel(1, 4)).not.toEqual(generateAddBothLevel(1, 5));
  });
});
