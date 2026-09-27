import { describe, it, expect } from 'vitest';
import { makeProblem } from '../src/engine/expr.js';
import { newSession, reduce, entryValue } from '../src/engine/session.js';

const run = (state, ...actions) => actions.reduce(reduce, state);
const taps = (zone, n) => Array.from({ length: n }, () => ({ type: 'tapZone', zone }));

describe('session: full walk-throughs', () => {
  it('Battle: 2 − 6 = −4', () => {
    let s = newSession(makeProblem(2, '-', 6));
    s = run(s, { type: 'flip', part: 'op' });
    expect(s.step).toBe('rewrite');
    expect(s.feedback.key).toBe('flipBoth');
    s = run(s, { type: 'flip', part: 'sign' });
    expect(s.step).toBe('draw');

    s = run(s, { type: 'pickSign', sign: '+' }, ...taps(0, 2), { type: 'pickSign', sign: '-' }, ...taps(1, 6), { type: 'check' });
    expect(s.step).toBe('partyBattle');
    expect(s.tidy).toBe(true);

    s = run(s, { type: 'choose', choice: 'party' });
    expect(s.feedback.key).toBe('sameOrDifferent');
    s = run(s, { type: 'choose', choice: 'battle' });
    expect(s.step).toBe('cancel');

    // same-sign tap is rejected and shakes
    s = run(s, { type: 'tapCounter', zone: 1, index: 0 }, { type: 'tapCounter', zone: 1, index: 1 });
    expect(s.feedback.key).toBe('pairNeedsBoth');
    expect(s.shake).toEqual({ zone: 1, index: 1 });
    // first selection is kept; pair it with a plus
    s = run(s, { type: 'tapCounter', zone: 0, index: 0 });
    expect(s.zones[0][0].canceled && s.zones[1][0].canceled).toBe(true);
    s = run(s, { type: 'tapCounter', zone: 0, index: 1 }, { type: 'tapCounter', zone: 1, index: 1 });
    expect(s.step).toBe('answer');

    s = run(s, { type: 'digit', digit: 4 }, { type: 'check' });
    expect(s.feedback.key).toBe('countWhoIsLeft');
    s = run(s, { type: 'toggleSign' }, { type: 'check' });
    expect(entryValue(s.entry)).toBe(-4);
    expect(s.step).toBe('done');
    expect(s.tries).toEqual({ partyBattle: 1, cancel: 1, answer: 1 });
  });

  it('Party skips Cancel: 5 − (−3) = 8', () => {
    let s = newSession(makeProblem(5, '-', -3));
    s = run(s, { type: 'flip', part: 'sign' }, { type: 'flip', part: 'op' },
      { type: 'pickSign', sign: '+' }, ...taps(0, 5), ...taps(1, 3), { type: 'check' },
      { type: 'choose', choice: 'party' });
    expect(s.step).toBe('answer');
    expect(s.skipped).toEqual(['cancel']);
    s = run(s, { type: 'digit', digit: 8 }, { type: 'check' });
    expect(s.step).toBe('done');
  });

  it('addition: "Nothing to rewrite" is the move; flipping is refused', () => {
    let s = newSession(makeProblem(-4, '+', -5));
    s = run(s, { type: 'flip', part: 'op' });
    expect(s.step).toBe('rewrite');
    expect(s.flips).toEqual({ op: false, sign: false });
    expect(s.feedback.key).toBe('alreadyAddition');
    s = run(s, { type: 'nothingToRewrite' });
    expect(s.step).toBe('draw');
  });

  it('"Nothing to rewrite" on subtraction is wrong', () => {
    const s = run(newSession(makeProblem(2, '-', 6)), { type: 'nothingToRewrite' });
    expect(s.step).toBe('rewrite');
    expect(s.feedback.key).toBe('notAddition');
  });

  it('tapping a flipped piece undoes it', () => {
    const s = run(newSession(makeProblem(2, '-', 6)), { type: 'flip', part: 'op' }, { type: 'flip', part: 'op' });
    expect(s.flips.op).toBe(false);
  });

  it('Draw: needs a sign first, removes on tap, caps at 12', () => {
    let s = run(newSession(makeProblem(-4, '+', -5)), { type: 'nothingToRewrite' }, { type: 'tapZone', zone: 0 });
    expect(s.feedback.key).toBe('pickSignFirst');
    s = run(s, { type: 'pickSign', sign: '-' }, ...taps(0, 13));
    expect(s.zones[0]).toHaveLength(12);
    expect(s.feedback.key).toBe('zoneFull');
    s = run(s, { type: 'tapCounter', zone: 0, index: 3 });
    expect(s.zones[0]).toHaveLength(11);
  });

  it('answer pad: two digits max, leading zero replaced', () => {
    let s = newSession(makeProblem(1, '+', 1));
    s.step = 'answer';
    s = run(s, { type: 'digit', digit: 0 }, { type: 'digit', digit: 2 }, { type: 'digit', digit: 3 }, { type: 'digit', digit: 4 });
    expect(s.entry.digits).toBe('23');
    s = run(s, { type: 'backspace' });
    expect(s.entry.digits).toBe('2');
  });

  it('ignores actions outside their step', () => {
    const s0 = newSession(makeProblem(2, '-', 6));
    expect(reduce(s0, { type: 'choose', choice: 'battle' })).toBe(s0);
    expect(reduce(s0, { type: 'digit', digit: 1 })).toBe(s0);
  });
});
