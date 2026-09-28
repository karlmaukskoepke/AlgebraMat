import { describe, it, expect } from 'vitest';
import { makeProblem } from '../src/engine/expr.js';
import { newSession, reduce } from '../src/engine/session.js';
import { hintFor, HINT_AFTER } from '../src/engine/hints.js';
import { FEEDBACK } from '../src/view/feedback.js';

const run = (s, ...actions) => actions.reduce(reduce, s);
const times = (n, action) => Array.from({ length: n }, () => action);
const taps = (zone, n) => times(n, { type: 'tapZone', zone });

describe('hints', () => {
  it('appear only after 3 wrong tries on a step', () => {
    let s = newSession(makeProblem(2, '-', 6));
    s = run(s, ...times(HINT_AFTER - 1, { type: 'nothingToRewrite' }));
    expect(hintFor(s)).toBeNull();
    s = run(s, { type: 'nothingToRewrite' });
    expect(hintFor(s)).toMatchObject({ key: 'hintRewrite', show: { flip: ['op', 'sign'] } });
  });

  it('Rewrite: points only at pieces not yet flipped, and never flips them', () => {
    let s = run(newSession(makeProblem(2, '-', 6)), ...times(3, { type: 'nothingToRewrite' }), { type: 'flip', part: 'op' });
    expect(hintFor(s).show.flip).toEqual(['sign']);
    expect(s.flips).toEqual({ op: true, sign: false });
  });

  it('Rewrite on addition: points at "Nothing to rewrite"', () => {
    const s = run(newSession(makeProblem(-4, '+', -5)), ...times(3, { type: 'flip', part: 'op' }));
    expect(hintFor(s)).toMatchObject({ key: 'hintNothing', show: { nothingButton: true } });
  });

  it('Draw: ghost counters show the target type and count for each zone', () => {
    let s = run(newSession(makeProblem(5, '-', -3)), { type: 'flip', part: 'op' }, { type: 'flip', part: 'sign' });
    s = run(s, ...times(3, { type: 'check' }));
    expect(hintFor(s)).toMatchObject({
      key: 'hintDraw', params: { left: 5, right: 3 },
      show: { ghosts: [{ sign: '+', count: 5 }, { sign: '+', count: 3 }] },
    });
  });

  it('Party or Battle: names the rewritten signs', () => {
    let s = run(newSession(makeProblem(2, '-', 6)), { type: 'flip', part: 'op' }, { type: 'flip', part: 'sign' },
      { type: 'pickSign', sign: '+' }, ...taps(0, 2), { type: 'pickSign', sign: '-' }, ...taps(1, 6), { type: 'check' });
    s = run(s, ...times(3, { type: 'choose', choice: 'party' }));
    expect(hintFor(s)).toMatchObject({ key: 'hintPartyBattle', params: { a: 2, b: -6, same: false } });
  });

  it('Cancel: points at one live + and one live −', () => {
    let s = run(newSession(makeProblem(2, '-', 6)), { type: 'flip', part: 'op' }, { type: 'flip', part: 'sign' },
      { type: 'pickSign', sign: '+' }, ...taps(0, 2), { type: 'pickSign', sign: '-' }, ...taps(1, 6), { type: 'check' },
      { type: 'choose', choice: 'battle' });
    // three same-sign pairs
    for (let i = 0; i < 3; i++) s = run(s, { type: 'tapCounter', zone: 1, index: 0 }, { type: 'tapCounter', zone: 1, index: 1 }, { type: 'tapCounter', zone: 1, index: 0 });
    expect(hintFor(s)).toMatchObject({ key: 'hintCancel', show: { pair: [{ zone: 0, index: 0 }, { zone: 1, index: 0 }] } });
    // after one real pair, the hint moves to the next live pair
    s = run(s, { type: 'tapCounter', zone: 0, index: 0 }, { type: 'tapCounter', zone: 1, index: 0 });
    expect(hintFor(s).show.pair).toEqual([{ zone: 0, index: 1 }, { zone: 1, index: 1 }]);
  });

  it('Answer: says which sign survived', () => {
    let s = run(newSession(makeProblem(5, '-', -3)), { type: 'flip', part: 'op' }, { type: 'flip', part: 'sign' },
      { type: 'pickSign', sign: '+' }, ...taps(0, 5), ...taps(1, 3), { type: 'check' }, { type: 'choose', choice: 'party' });
    s = run(s, { type: 'digit', digit: 2 }, ...times(3, { type: 'check' }));
    expect(hintFor(s)).toMatchObject({ key: 'hintAnswer', params: { sign: '+', none: false } });
  });

  it('every hint key has a message', () => {
    for (const k of ['hintRewrite', 'hintNothing', 'hintDraw', 'hintPartyBattle', 'hintCancel', 'hintAnswer']) {
      expect(FEEDBACK).toHaveProperty(k);
    }
  });
});
