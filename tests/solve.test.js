import { describe, it, expect } from 'vitest';
import {
  makeSolve, leftOf, formatEquation, answerText, substituteSegments, balanceOf, tagSolve, checkSolve,
} from '../src/engine/solve.js';
import { generateSolveLevel, MAX_SIDE } from '../src/engine/generateSolve.js';
import { PACKS, packById } from '../src/packs/index.js';
import { newProgress, encodeProgress, decodeProgress } from '../src/engine/progress.js';

const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));

const PLUS = makeSolve('x+a', 5, 7);     // x + 5 = 12
const MINUS = makeSolve('x-a', 3, 9);    // x − 3 = 6
const TIMES = makeSolve('ax', 4, 6);     // 4x = 24
const OVER = makeSolve('x/a', 4, 12);    // x/4 = 3

describe('equations', () => {
  it('are built from their solution, so the right side is right', () => {
    expect([PLUS, MINUS, TIMES, OVER].map((p) => p.b)).toEqual([12, 6, 24, 3]);
    expect([PLUS, MINUS, TIMES, OVER].map(formatEquation)).toEqual(['x + 5 = 12', 'x − 3 = 6', '4x = 24', 'x/4 = 3']);
    expect([PLUS, MINUS, TIMES, OVER].map(answerText)).toEqual(['7', '9', '6', '12']);
  });

  it('refuse a division that does not come out even', () => {
    expect(() => makeSolve('x/a', 4, 10)).toThrow();
    expect(() => makeSolve('x+a', 0, 3)).toThrow();
    expect(() => makeSolve('nope', 2, 3)).toThrow();
  });

  it('put a typed answer back in and say whether the sides balance', () => {
    expect(balanceOf(PLUS, 7)).toMatchObject({ balanced: true, text: '12' });
    expect(balanceOf(PLUS, 12)).toMatchObject({ balanced: false, text: '17', right: '12' });
    expect(balanceOf(OVER, 7)).toMatchObject({ balanced: false, text: '7/4' });
    expect(balanceOf(MINUS, 2)).toMatchObject({ balanced: false, text: '−1' });
    expect(leftOf('ax', 4, 6)).toBe(24);
    expect(substituteSegments(PLUS, 12).map((s) => s.text)).toEqual(['(12)', '+ 5', '= 12']);
    expect(substituteSegments(TIMES, 3).map((s) => s.text)).toEqual(['4', '(3)', '= 24']);
  });
});

describe('what a wrong answer looked like', () => {
  it('is named', () => {
    expect(tagSolve(PLUS, 17)).toBe('wrong-op');       // 12 + 5
    expect(tagSolve(PLUS, 12)).toBe('untouched');
    expect(tagSolve(PLUS, -7)).toBe('flipped');         // 5 − 12
    expect(tagSolve(MINUS, 3)).toBe('wrong-op');        // 6 − 3
    expect(tagSolve(TIMES, 96)).toBe('wrong-op');       // 24 × 4
    expect(tagSolve(TIMES, 20)).toBe('other-op');       // 24 − 4
    expect(tagSolve(OVER, 28)).toBe('unmatched');
    expect(tagSolve(OVER, 7)).toBe('other-op');         // 3 + 4
    expect(tagSolve(PLUS, 7)).toBeNull();
  });

  it('reads typed text', () => {
    expect(checkSolve(PLUS, '7')).toMatchObject({ correct: true, typed: 7 });
    expect(checkSolve(PLUS, '17')).toMatchObject({ correct: false, tag: 'wrong-op' });
    expect(checkSolve(PLUS, '').unreadable).toBe(true);
    expect(checkSolve(PLUS, '−').unreadable).toBe(true);
  });
});

describe('the problems', () => {
  it('are five a level, drawable, with no repeated answers, from a fixed seed', () => {
    const forms = { 1: ['x+a'], 2: ['x-a'], 3: ['ax'], 4: ['x/a'] };
    for (let seed = 1; seed <= 150; seed++) {
      for (let level = 1; level <= 5; level++) {
        const set = generateSolveLevel(level, seed);
        expect(set).toHaveLength(5);
        expect(new Set(set.map((p) => p.x)).size).toBe(5);
        for (const p of set) {
          expect(Number.isInteger(p.x) && p.x > 0).toBe(true);
          expect(Math.max(p.b, p.x)).toBeLessThanOrEqual(MAX_SIDE);
          expect(leftOf(p.form, p.a, p.x)).toBe(p.b);
          if (forms[level]) expect(forms[level]).toContain(p.form);
        }
        if (level === 5) expect(new Set(set.map((p) => p.form)).size).toBe(4);
        if (level === 2) expect(set.every((p) => p.b > 0)).toBe(true);
      }
    }
    expect(generateSolveLevel(3, 9)).toEqual(generateSolveLevel(3, 9));
  });

  it('are a pack of five levels, with room for more in the save code', () => {
    const pack = packById('one-step');
    expect(pack).toMatchObject({ levels: 5, title: 'One-step equations' });
    expect(pack.levelNames).toHaveLength(5);
    expect(pack.generate(4, 3)).toEqual(generateSolveLevel(4, 3));
    const progress = newProgress(PACKS);
    progress.packs['one-step'].levels = [true, false, true, true, true];
    const code = encodeProgress(progress);
    expect(decodeProgress(code, PACKS).packs['one-step'].levels).toEqual([true, false, true, true, true]);
    expect(decodeProgress(encodeProgress(newProgress(PACKS), 9), PACKS).packs['one-step'].levels).toEqual(Array(5).fill(false));
  });
});
