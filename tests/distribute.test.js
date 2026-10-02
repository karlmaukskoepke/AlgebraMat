import { describe, it, expect } from 'vitest';
import {
  makeDistribute, groupPart, termPart, formatDistribute, distributedText, answerText, evaluateDistribute,
  distributedTerms, groupOf, openPieces, startsWithGroup, hasHiddenOne,
} from '../src/engine/distribute.js';
import { distributeLines } from '../src/engine/termGroups.js';

const x = (value) => ({ kind: 'x', value });
const num = (value) => ({ kind: 'int', value });

// The notes' examples.
const notes1 = makeDistribute([groupPart('+', 2, [x(3), num(-4)]), termPart('x', '-', 1), termPart('int', '+', 5)]);
const notes2 = makeDistribute([groupPart('+', 3, [x(1), num(2)]), termPart('x', '-', 5)]);
const notes3 = makeDistribute([termPart('int', '+', 5), groupPart('-', 2, [x(2), num(-3)])]);

describe('distribute problems', () => {
  it('writes the problem, the opened line and the answer for the notes\' examples', () => {
    expect(formatDistribute(notes1)).toBe('2(3x − 4) − x + 5');
    expect(distributedText(notes1)).toBe('6x − 8 − x + 5');
    expect(answerText(notes1)).toBe('5x − 3');

    expect(formatDistribute(notes2)).toBe('3(x + 2) − 5x');
    expect(distributedText(notes2)).toBe('3x + 6 − 5x');
    expect(answerText(notes2)).toBe('−2x + 6');

    expect(formatDistribute(notes3)).toBe('5 − 2(2x − 3)');
    expect(distributedText(notes3)).toBe('5 − 4x + 6');
    expect(answerText(notes3)).toBe('−4x + 11');
  });

  it('hides the 1 and keeps a leading minus', () => {
    const p = makeDistribute([termPart('int', '+', 4), groupPart('-', 1, [x(1), num(2)], { hiddenOne: true })]);
    expect(formatDistribute(p)).toBe('4 − (x + 2)');
    expect(distributedText(p)).toBe('4 − x − 2');
    expect(answerText(p)).toBe('−x + 2');
    expect(hasHiddenOne(p)).toBe(true);

    const lead = makeDistribute([groupPart('-', 2, [num(3), x(-1)]), termPart('int', '+', 5)]);
    expect(formatDistribute(lead)).toBe('−2(3 − x) + 5');
    expect(distributedText(lead)).toBe('−6 + 2x + 5');
    expect(startsWithGroup(lead)).toBe(true);
  });

  it('opens the groups as Boxes & Circles terms: the operation carries the sign, nothing to rewrite', () => {
    const terms = distributedTerms(notes3);
    expect(terms).toEqual([
      { kind: 'int', op: '+', value: 5 },
      { kind: 'x', op: '-', value: 4 },
      { kind: 'int', op: '+', value: 6 },
    ]);
    expect(evaluateDistribute(notes3)).toEqual({ x: -4, n: 11 });
    expect(openPieces(notes3)).toBe(15);
  });

  it('gives a subtracted group the opposite count, for the arrows check', () => {
    const g = groupOf(notes3.parts[1]);
    expect(g.count).toMatchObject({ neg: true, n: 2 });
    expect(distributeLines(g).map((l) => l.text)).toEqual(['−2 · 2x = −4x', '−2 · (−3) = 6']);
  });

  it('rejects malformed problems', () => {
    expect(() => makeDistribute([termPart('int', '+', 1), termPart('int', '+', 2)])).toThrow();
    expect(() => makeDistribute([groupPart('+', 2, [x(1), num(1)])])).toThrow();
    expect(() => makeDistribute([termPart('int', '-', 3), groupPart('+', 2, [x(1), num(1)])])).toThrow();
    expect(() => makeDistribute([termPart('int', '+', 3), termPart('int', '+', -2), groupPart('+', 2, [x(1), num(1)])])).toThrow();
    expect(() => makeDistribute([termPart('int', '+', 3), groupPart('+', 2, [x(1), num(1)], { hiddenOne: true })])).toThrow();
    expect(() => makeDistribute([termPart('int', '+', 3), groupPart('+', 2, [x(1), x(2)])])).toThrow();
  });
});
