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
    expect(boardText({ left: [x(), num(3)], right: [num(-6), num(-3)] })).toBe('x + 3 = −6 + −3');
  });
});

describe('substituting a value, one operation at a time', () => {
  it('a × (value) = b: two lines, the product underlined first, its result after', () => {
    const r = run([x(3)], [num(-12)], -4);
    expect(r.texts).toEqual(['3 × (−4) = −12', '−12 = −12']);
    expect(r.ok).toBe(true);
    expect(r.lines[0].segs.find((s) => s.cls === 'is-op').text).toBe('3 × (−4)');
    expect(r.lines[1].segs.find((s) => s.cls === 'is-res').text).toBe('−12');
    expect(r.lines[1].op).toBe(false);
  });
  it('x + a = b: the sum of the value and the number', () => {
    const r = run([x(), num(3)], [num(-6)], -9);
    expect(r.texts).toEqual(['(−9) + 3 = −6', '−6 = −6']);
    expect(r.ok).toBe(true);
    expect(r.lines[0].segs.filter((s) => s.cls === 'is-op').map((s) => s.text).join('')).toBe('(−9) + 3');
    expect(run([x(), num(3)], [num(-6)], -3).ok).toBe(false);
  });
  it('a simplified state with an unsimplified side: the left is worked first, then the right, a step a line', () => {
    const r = run([x()], [num(-6), num(-3)], -9);
    expect(r.texts).toEqual(['−9 = −6 + −3', '−9 = −9']);
    const r2 = run([x(), num(-2)], [num(11), num(-8)], 5);
    expect(r2.texts).toEqual(['(5) + −2 = 11 + −8'.replace('(5)', '5'), '3 = 11 + −8', '3 = 3']);
    expect(r2.ok).toBe(true);
  });
  it('a fraction of a part: the inner part first, then the fraction', () => {
    const r = run([x()], [frac(3, num(-12))], -4);
    expect(r.texts).toEqual(['−4 = ⅓(−12)', '−4 = −4']);
    expect(r.ok).toBe(true);
    const r3 = run([x(2)], [frac(2, num(6), num(6))], 6);
    expect(r3.texts).toEqual(['2 × 6 = ½(6 + 6)', '12 = ½(6 + 6)', '12 = ½(12)', '12 = 6']);
    expect(r3.ok).toBe(false);
  });
  it('a wrong value ends not balanced', () => {
    const r = run([x(3)], [num(-12)], 5);
    expect(r.texts).toEqual(['3 × 5 = −12', '15 = −12']);
    expect(r.ok).toBe(false);
  });
});
