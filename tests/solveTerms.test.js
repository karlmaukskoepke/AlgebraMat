import { describe, it, expect } from 'vitest';
import { substitutionLines, lineText, boardText } from '../src/engine/solveTerms.js';

const x = (coef) => ({ kind: 'x', ...(coef ? { coef } : {}) });
const num = (v) => ({ kind: 'num', v });
const frac = (n, ...inner) => ({ kind: 'frac', n, inner });
const run = (left, right, v) => { const r = substitutionLines({ left, right }, v); return { texts: r.lines.map(lineText), ...r }; };

describe('writing a state', () => {
  it('writes terms, coefficients and fractions', () => {
    expect(boardText({ left: [x(3)], right: [num(-12)] })).toBe('3x = −12');
    expect(boardText({ left: [x()], right: [frac(3, num(-12))] })).toBe('x = ⅓(−12)');
    expect(boardText({ left: [x(), num(3)], right: [num(-6), num(-3)] })).toBe('x + 3 = −6 − 3');
  });
});

describe('substituting a value, one operation at a time', () => {
  it('a × (value) = b: two lines, the product underlined first, its result after', () => {
    const r = run([x(3)], [num(-12)], -4);
    expect(r.texts).toEqual(['3(−4) = −12', '−12 = −12']);
    expect(r.ok).toBe(true);
    expect(r.lines[0].segs.filter((s) => s.cls.split(' ').includes('is-op')).map((s) => s.text).join('')).toBe('3(−4)');
    expect(r.lines[1].segs.find((s) => s.cls === 'is-res').text).toBe('−12');
    expect(r.lines[1].op).toBe(false);
  });
  it('x + a = b: the sum of the value and the number', () => {
    const r = run([x(), num(3)], [num(-6)], -9);
    expect(r.texts).toEqual(['(−9) + 3 = −6', '−6 = −6']);
    expect(r.ok).toBe(true);
    expect(r.lines[0].segs.filter((s) => s.cls.split(' ').includes('is-op')).map((s) => s.text).join('')).toBe('(−9) + 3');
    expect(run([x(), num(3)], [num(-6)], -3).ok).toBe(false);
  });
  it('a simplified state with an unsimplified side: the left is worked first, then the right, a step a line', () => {
    const r = run([x()], [num(-6), num(-3)], -9);
    expect(r.texts).toEqual(['−9 = −6 − 3', '−9 = −9']);
    const r2 = run([x(), num(-2)], [num(11), num(-8)], 5);
    expect(r2.texts).toEqual(['5 − 2 = 11 − 8', '3 = 11 − 8', '3 = 3']);
    expect(r2.ok).toBe(true);
  });
  it('a fraction of a part: the inner part first, then the fraction', () => {
    const r = run([x()], [frac(3, num(-12))], -4);
    expect(r.texts).toEqual(['−4 = ⅓(−12)', '−4 = −4']);
    expect(r.ok).toBe(true);
    const r3 = run([x(2)], [frac(2, num(6), num(6))], 6);
    expect(r3.texts).toEqual(['2(6) = ½(6 + 6)', '12 = ½(6 + 6)', '12 = ½(12)', '12 = 6']);
    expect(r3.ok).toBe(false);
  });
  it('a wrong value ends not balanced', () => {
    const r = run([x(3)], [num(-12)], 5);
    expect(r.texts).toEqual(['3(5) = −12', '15 = −12']);
    expect(r.ok).toBe(false);
  });
});

describe('the renderer rule (loop §4): the equation as written, x replaced by the value, negatives in parentheses, the coefficient with the value in parentheses (Build T: never ×)', () => {
  const x = (c = 1) => ({ kind: 'x', coef: c });
  const n = (v) => ({ kind: 'num', v });
  const first = (board, v) => lineText(substitutionLines(board, v).lines[0]);
  it('passes every case of the brief', () => {
    expect(first({ left: [x(3)], right: [n(-12)] }, -4)).toBe('3(−4) = −12');
    expect(first({ left: [x(), n(-6)], right: [n(9)] }, 15)).toBe('15 − 6 = 9');
    expect(first({ left: [x(-3)], right: [n(12)] }, -4)).toBe('−3(−4) = 12');
    expect(first({ left: [n(12)], right: [x(-1)] }, -12)).toBe('12 = −(−12)');
    expect(first({ left: [n(7)], right: [x(), n(3)] }, 4)).toBe('7 = 4 + 3');
  });
  it('never drops the coefficient and never shows a times sign, for every coefficient and sign', () => {
    for (const a of [2, 3, 4, 5, 6, -2, -3, -6]) for (const v of [-9, -2, 3, 8]) {
      const line = first({ left: [x(a)], right: [n(a * v)] }, v);
      expect(line.startsWith(`${a < 0 ? '−' : ''}${Math.abs(a)}(`)).toBe(true);
      expect(line).not.toMatch(/×/);
    }
  });
});
