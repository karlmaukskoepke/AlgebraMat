import { describe, it, expect } from 'vitest';
import { makeGroups } from '../src/engine/groups.js';
import { newLassoSession, reduceLasso } from '../src/engine/lassoSession.js';
import { lassoHintFor } from '../src/engine/lassoHints.js';
import { LASSO_FEEDBACK, lassoFeedbackText } from '../src/view/lassoFeedback.js';

const run = (s, ...actions) => actions.reduce(reduceLasso, s);
const times = (n, a) => Array.from({ length: n }, () => a);
const tap = (i) => ({ type: 'tapGroup', index: i });
const check = { type: 'check' };

const p3m2 = makeGroups({ n: 3 }, -2);                           // 3(−2)
const pmm5 = makeGroups({ neg: true, n: 1 }, -5, { hidden1: true }); // −(−5)
const pm2m4 = makeGroups({ neg: true, n: 2 }, -4);               // −2(−4)
const p23m6 = makeGroups({ n: 2, d: 3 }, -6);                    // 2/3(−6)

describe('Group It hints', () => {
  it('wait for 3 wrong tries on the same step', () => {
    let s = run(newLassoSession(p3m2), { type: 'addGroup' }, check, check);
    expect(lassoHintFor(s)).toBeNull();
    s = run(s, check);
    expect(lassoHintFor(s)).toMatchObject({ key: 'hintGroups', params: { n: 3, have: 1 }, show: { button: 'addGroup' } });
  });

  it('Groups: too many blinks the extras; the hidden 1 pulses its gap', () => {
    const s = run(newLassoSession(p3m2), ...times(5, { type: 'addGroup' }), check, check, check);
    expect(lassoHintFor(s).show).toEqual({ groups: [3, 4] });
    const h = run(newLassoSession(pmm5), ...times(3, { type: 'addGroup' }));
    expect(lassoHintFor(h)).toMatchObject({ key: 'hintWriteOne', show: { slot: true } });
  });

  it('+ or −: pulses the right button', () => {
    const s = run(newLassoSession(pm2m4), ...times(2, { type: 'addGroup' }), check, ...times(3, { type: 'chooseSign', sign: '+' }));
    expect(lassoHintFor(s)).toMatchObject({ key: 'hintSign', params: { sign: '-' }, show: { button: 'chooseSign:-' } });
  });

  it('Fill: blinks every group that is not yet one group of B', () => {
    const s = run(newLassoSession(p3m2), ...times(3, { type: 'addGroup' }), check, { type: 'chooseSign', sign: '+' },
      { type: 'pickSign', sign: '-' }, tap(0), tap(0), tap(2), check, check, check);
    expect(lassoHintFor(s)).toMatchObject({ key: 'hintFill', show: { button: 'pickSign:-', groups: [1, 2] } });
  });

  it('Fractions: deal, take and count hints', () => {
    let s = run(newLassoSession(p23m6), ...times(3, { type: 'addGroup' }), check, { type: 'chooseSign', sign: '+' },
      { type: 'pickSign', sign: '-' }, tap(0), check, check, check);
    expect(lassoHintFor(s)).toMatchObject({ key: 'hintDeal', show: { button: 'pickSign:-' } });
    s = run(s, ...[1, 2, 0, 1, 2].map(tap), check, check, check, check);
    expect(lassoHintFor(s)).toMatchObject({ key: 'hintTake', show: { groups: [0, 1] } });
    s = run(s, tap(0), tap(2), check, ...times(3, { type: 'digit', digit: 4 }), check);
    s = run(s, { type: 'backspace' }, check, { type: 'backspace' }, { type: 'digit', digit: 9 }, check);
    expect(lassoHintFor(s)).toMatchObject({ key: 'hintCountTaken', params: { sign: '-' }, show: { groups: [0, 2] } });
  });

  it('Count (whole numbers): after the flip, the sign of what is left', () => {
    let s = run(newLassoSession(pm2m4), ...times(2, { type: 'addGroup' }), check, { type: 'chooseSign', sign: '-' },
      { type: 'pickSign', sign: '-' }, ...times(4, tap(0)), ...times(4, tap(1)), check, { type: 'flipAll' });
    for (const v of [7, 9, 6]) s = run(s, { type: 'backspace' }, { type: 'digit', digit: v }, check);
    expect(lassoHintFor(s)).toMatchObject({ key: 'hintCount', params: { sign: '+' }, show: { groups: [0, 1] } });
  });

  it('every hint key has a message, with no "lasso" in it', () => {
    for (const key of ['hintWriteOne', 'hintGroups', 'hintParts', 'hintSign', 'hintFill', 'hintDeal', 'hintTake', 'hintCount', 'hintCountTaken']) {
      expect(LASSO_FEEDBACK, key).toHaveProperty(key);
      const text = lassoFeedbackText({ key, params: { n: 2, have: 1, sign: '-', fraction: false, b: -2, count: 2 } });
      expect(text.length).toBeGreaterThan(10);
      expect(text).not.toMatch(/lasso/i);
    }
  });
});
