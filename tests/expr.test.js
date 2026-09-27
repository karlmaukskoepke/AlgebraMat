import { describe, it, expect } from 'vitest';
import {
  makeProblem, rewrite, evaluate, partyOrBattle, formatProblem, isSubtraction, MINUS,
} from '../src/engine/expr.js';

describe('expr', () => {
  it('stores terms with a kind so variables can be added later', () => {
    const p = makeProblem(5, '-', -3);
    expect(p.left).toEqual({ kind: 'int', value: 5 });
    expect(p.right).toEqual({ kind: 'int', value: -3 });
  });

  it('rejects unknown operations', () => {
    expect(() => makeProblem(1, '*', 2)).toThrow();
  });

  it('rewrites subtraction as adding the opposite', () => {
    expect(rewrite(makeProblem(5, '-', -3))).toEqual(makeProblem(5, '+', 3));
    expect(rewrite(makeProblem(2, '-', 6))).toEqual(makeProblem(2, '+', -6));
    expect(rewrite(makeProblem(-4, '-', 5))).toEqual(makeProblem(-4, '+', -5));
  });

  it('leaves addition unchanged', () => {
    const p = makeProblem(-4, '+', -5);
    expect(rewrite(p)).toBe(p);
    expect(isSubtraction(p)).toBe(false);
  });

  it('evaluates, and rewriting keeps the value', () => {
    for (const [a, op, b, v] of [[5, '-', -3, 8], [-2, '-', -6, 4], [2, '-', 6, -4], [-4, '+', -5, -9], [3, '-', 3, 0]]) {
      const p = makeProblem(a, op, b);
      expect(evaluate(p)).toBe(v);
      expect(evaluate(rewrite(p))).toBe(v);
    }
  });

  it('decides party or battle from the rewritten signs', () => {
    expect(partyOrBattle(makeProblem(5, '-', -3))).toBe('party');   // 5 + 3
    expect(partyOrBattle(makeProblem(-4, '-', 5))).toBe('party');   // −4 + (−5)
    expect(partyOrBattle(makeProblem(-2, '-', -6))).toBe('battle'); // −2 + 6
    expect(partyOrBattle(makeProblem(2, '-', 6))).toBe('battle');   // 2 + (−6)
    expect(partyOrBattle(makeProblem(3, '+', 4))).toBe('party');
    expect(partyOrBattle(makeProblem(-3, '+', -4))).toBe('party');
    expect(partyOrBattle(makeProblem(3, '+', -4))).toBe('battle');
    expect(partyOrBattle(makeProblem(-3, '+', 4))).toBe('battle');
  });

  it('formats like the notes', () => {
    const m = MINUS;
    expect(formatProblem(makeProblem(5, '-', -3))).toBe(`5 ${m} (${m}3)`);
    expect(formatProblem(makeProblem(-2, '-', -6))).toBe(`${m}2 ${m} (${m}6)`);
    expect(formatProblem(makeProblem(2, '-', 6))).toBe(`2 ${m} 6`);
    expect(formatProblem(makeProblem(5, '+', 3), { explicitPlus: true })).toBe('5 + (+3)');
    expect(formatProblem(makeProblem(2, '+', -6), { explicitPlus: true })).toBe(`2 + (${m}6)`);
  });
});
