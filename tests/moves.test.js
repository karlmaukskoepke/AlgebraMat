import { describe, it, expect } from 'vitest';
import { makeProblem } from '../src/engine/expr.js';
import {
  validateRewrite, validateNothingToRewrite, validateDraw, zoneTargets,
  validatePartyBattle, validatePair, isCancelComplete, validateAnswer,
} from '../src/engine/moves.js';

const sub = makeProblem(5, '-', -3);
const add = makeProblem(-4, '+', -5);
const c = (sign, canceled = false) => ({ sign, canceled });
const many = (sign, n) => Array.from({ length: n }, () => c(sign));

describe('① Rewrite', () => {
  it('passes only when both signs are flipped', () => {
    expect(validateRewrite(sub, { op: true, sign: true })).toMatchObject({ ok: true, feedbackKey: 'rewriteDone' });
    expect(validateRewrite(sub, { op: false, sign: false }).ok).toBe(false);
  });

  it('fails one flip with flipBoth', () => {
    expect(validateRewrite(sub, { op: true, sign: false })).toMatchObject({ ok: false, feedbackKey: 'flipBoth' });
    expect(validateRewrite(sub, { op: false, sign: true })).toMatchObject({ ok: false, feedbackKey: 'flipBoth' });
  });

  it('fails flipping on an addition problem with alreadyAddition', () => {
    expect(validateRewrite(add, { op: true, sign: false })).toMatchObject({ ok: false, feedbackKey: 'alreadyAddition' });
    expect(validateRewrite(add, { op: true, sign: true })).toMatchObject({ ok: false, feedbackKey: 'alreadyAddition' });
  });

  it('"Nothing to rewrite" passes only on addition problems', () => {
    expect(validateNothingToRewrite(add)).toMatchObject({ ok: true });
    expect(validateNothingToRewrite(sub)).toMatchObject({ ok: false, feedbackKey: 'notAddition' });
  });
});

describe('② Draw', () => {
  it('targets the rewritten numbers, including the flipped (magenta) zone', () => {
    expect(zoneTargets(sub)).toEqual([5, 3]);             // 5 − (−3) → 5 + (+3)
    expect(zoneTargets(makeProblem(2, '-', 6))).toEqual([2, -6]);
    expect(zoneTargets(add)).toEqual([-4, -5]);           // addition: unchanged
  });

  it('passes the right type and count in each zone', () => {
    expect(validateDraw(sub, [many('+', 5), many('+', 3)]).ok).toBe(true);
    expect(validateDraw(makeProblem(2, '-', 6), [many('+', 2), many('-', 6)]).ok).toBe(true);
  });

  it('rejects the wrong type, naming the number and what it needs', () => {
    // Drew the original −3 instead of the flipped +3.
    expect(validateDraw(sub, [many('+', 5), many('-', 3)])).toMatchObject({
      ok: false, feedbackKey: 'needType', params: { zone: 1, n: 3, count: 3, sign: '+' },
    });
    expect(validateDraw(add, [many('+', 4), many('-', 5)])).toMatchObject({
      ok: false, feedbackKey: 'needType', params: { zone: 0, n: -4, count: 4, sign: '-' },
    });
  });

  it('rejects a mixed zone and an empty zone as the wrong type', () => {
    expect(validateDraw(sub, [[...many('+', 4), c('-')], many('+', 3)]).feedbackKey).toBe('needType');
    expect(validateDraw(sub, [[], many('+', 3)]).feedbackKey).toBe('needType');
  });

  it('rejects the wrong count with countAgain', () => {
    expect(validateDraw(sub, [many('+', 4), many('+', 3)])).toMatchObject({
      ok: false, feedbackKey: 'countAgain', params: { zone: 0, n: 5, have: 4 },
    });
  });
});

describe('③ Party or Battle', () => {
  const cases = [
    // [a, op, b, answer]  (decided on the rewritten signs)
    [5, '-', -3, 'party'],   // 5 + 3
    [-4, '-', 5, 'party'],   // −4 + (−5)
    [-2, '-', -6, 'battle'], // −2 + 6
    [2, '-', 6, 'battle'],   // 2 + (−6)
    [3, '+', 4, 'party'],
    [-3, '+', -4, 'party'],
    [3, '+', -4, 'battle'],
    [-3, '+', 4, 'battle'],
  ];
  it.each(cases)('%i %s %i is a %s', (a, op, b, right) => {
    const p = makeProblem(a, op, b);
    const wrongChoice = right === 'party' ? 'battle' : 'party';
    expect(validatePartyBattle(p, right).ok).toBe(true);
    expect(validatePartyBattle(p, wrongChoice)).toMatchObject({ ok: false, feedbackKey: 'sameOrDifferent' });
  });
});

describe('④ Cancel', () => {
  it('accepts one + and one −, rejects same-sign pairs', () => {
    expect(validatePair(c('+'), c('-')).ok).toBe(true);
    expect(validatePair(c('-'), c('+')).ok).toBe(true);
    expect(validatePair(c('+'), c('+'))).toMatchObject({ ok: false, feedbackKey: 'pairNeedsBoth' });
    expect(validatePair(c('-'), c('-'))).toMatchObject({ ok: false, feedbackKey: 'pairNeedsBoth' });
    expect(validatePair(c('+', true), c('-')).ok).toBe(false);
  });

  it('completes exactly when one kind (or nothing) remains', () => {
    expect(isCancelComplete([[c('+'), c('+')], [c('-'), c('-'), c('-')]])).toBe(false);
    expect(isCancelComplete([[c('+', true), c('+')], [c('-', true), c('-'), c('-')]])).toBe(false);
    expect(isCancelComplete([[c('+', true), c('+', true)], [c('-', true), c('-', true), c('-')]])).toBe(true);
    expect(isCancelComplete([[c('+', true)], [c('-', true)]])).toBe(true); // 1 − 1 = 0
  });
});

describe('⑤ Answer', () => {
  it('accepts only the correct signed integer', () => {
    const p = makeProblem(2, '-', 6);
    expect(validateAnswer(p, -4)).toMatchObject({ ok: true, feedbackKey: 'correct' });
    expect(validateAnswer(p, 4)).toMatchObject({ ok: false, feedbackKey: 'countWhoIsLeft' });
    expect(validateAnswer(p, -3).ok).toBe(false);
    expect(validateAnswer(p, -4.5).ok).toBe(false);
    expect(validateAnswer(p, null)).toMatchObject({ ok: false, feedbackKey: 'typeAnswer' });
    expect(validateAnswer(makeProblem(3, '-', 3), 0).ok).toBe(true);
  });
});
