import { describe, it, expect } from 'vitest';
import { sumExpression, intTerm, total, subtracted, counterTotal, meeting, combineFirst, termsText, signOfTerm } from '../src/engine/combine.js';
import { makeExpression } from '../src/engine/terms.js';

describe('Combine it model', () => {
  it('writes sums the way Flip It writes problems: the first number as it is, then + (negative)', () => {
    expect(termsText(sumExpression([5, -8, 2]))).toBe('5 + (−8) + 2');
    expect(termsText(sumExpression([-3, -4, 6, -2]))).toBe('−3 + (−4) + 6 + (−2)');
    expect(termsText(makeExpression([intTerm('+', 5), intTerm('-', -3), intTerm('+', -7), intTerm('-', 2)]))).toBe('5 − (−3) + (−7) − 2');
  });

  it('totals them, subtracting where there is a −', () => {
    expect(total(sumExpression([5, -8, 2]))).toBe(-1);
    expect(total(makeExpression([intTerm('+', 5), intTerm('-', -3), intTerm('+', -7), intTerm('-', 2)]))).toBe(-1); // 5 + 3 − 7 − 2
  });

  it('finds the subtracted terms, whatever the sign of the number', () => {
    const e = makeExpression([intTerm('+', 5), intTerm('-', -3), intTerm('+', -7), intTerm('-', 2)]);
    expect(subtracted(e)).toEqual([1, 3]);
    expect(subtracted(sumExpression([1, 2, 3]))).toEqual([]);
  });

  it('counts the counters drawn, and signs each term as it is worth', () => {
    const e = makeExpression([intTerm('+', 5), intTerm('-', -3), intTerm('-', 2)]);
    expect(counterTotal(e)).toBe(10);
    expect(e.terms.map(signOfTerm)).toEqual(['+', '+', '-']);
  });

  it('calls two numbers a party (same signs) or a battle (different)', () => {
    expect(meeting(-23, -15)).toBe('party');
    expect(meeting(23, 15)).toBe('party');
    expect(meeting(-23, 41)).toBe('battle');
  });

  it('three terms: combine the two that share a sign first, leaving a battle', () => {
    expect(combineFirst(sumExpression([-23, 41, -15]))).toEqual({ pair: [0, 2], other: 1, partial: -38 });
    expect(combineFirst(sumExpression([30, -12, 25]))).toEqual({ pair: [0, 2], other: 1, partial: 55 });
    expect(combineFirst(sumExpression([-5, -6, -7]))).toBeNull();
  });
});
