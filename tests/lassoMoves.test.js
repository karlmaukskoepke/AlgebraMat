import { describe, it, expect } from 'vitest';
import { makeGroups } from '../src/engine/groups.js';
import {
  validateGroups, validateGroupSign, validateGroup, validateFill, validateDeal, validateTake, validateCount,
} from '../src/engine/lassoMoves.js';
import { newLassoSession, reduceLasso, stepsFor, nextPart } from '../src/engine/lassoSession.js';

const t = (sign, n) => Array.from({ length: n }, () => ({ kind: 'int', sign }));
const grp = (sign, n, extra = {}) => ({ terms: t(sign, n), taken: false, flipped: false, ...extra });
const run = (s, ...actions) => actions.reduce(reduceLasso, s);
const times = (n, a) => Array.from({ length: n }, () => a);
const tap = (i) => ({ type: 'tapGroup', index: i });
const type = (v) => [
  ...(v < 0 ? [{ type: 'toggleSign' }] : []),
  ...[...String(Math.abs(v))].map((d) => ({ type: 'digit', digit: Number(d) })),
  { type: 'check' },
];
const signs = (g) => g.terms.map((x) => x.sign).join('');

const p3m2 = makeGroups({ n: 3 }, -2);                           // 3(−2)
const p5p2 = makeGroups({ n: 5 }, 2);                            // 5(2)
const pm2m4 = makeGroups({ neg: true, n: 2 }, -4);               // −2(−4)
const pmm5 = makeGroups({ neg: true, n: 1 }, -5, { hidden1: true }); // −(−5)
const pm3p4 = makeGroups({ neg: true, n: 3 }, 4);                // −3(4)
const p23m6 = makeGroups({ n: 2, d: 3 }, -6);                    // 2/3(−6)
const pm14m12 = makeGroups({ neg: true, n: 1, d: 4 }, -12);      // −1/4(−12)
const p15p10 = makeGroups({ n: 1, d: 5 }, 10);                   // 1/5(10)

describe('Group It validators', () => {
  it('① Groups: |A| groups (d for a fraction), and the hidden 1 written first', () => {
    expect(validateGroups(p3m2, { count: 3, wroteOne: true }).ok).toBe(true);
    expect(validateGroups(p3m2, { count: 2, wroteOne: true })).toMatchObject({ ok: false, feedbackKey: 'groupCount', params: { n: 3, have: 2 } });
    expect(validateGroups(pmm5, { count: 1, wroteOne: false })).toMatchObject({ ok: false, feedbackKey: 'writeOne' });
    expect(validateGroups(pmm5, { count: 1, wroteOne: true }).ok).toBe(true);
    expect(validateGroups(p23m6, { count: 3, wroteOne: true })).toMatchObject({ ok: true, feedbackKey: 'partsDone' });
    expect(validateGroups(p23m6, { count: 2, wroteOne: true })).toMatchObject({ feedbackKey: 'partCount', params: { d: 3, have: 2 } });
  });

  it('② + or −: right for every sign of A, fractions too', () => {
    expect(validateGroupSign(p3m2, '+').ok).toBe(true);
    expect(validateGroupSign(p3m2, '-')).toMatchObject({ ok: false, feedbackKey: 'lookAtSign' });
    for (const p of [pm2m4, pmm5, pm3p4]) {
      expect(validateGroupSign(p, '-')).toMatchObject({ ok: true, feedbackKey: 'oppositeGroups' });
      expect(validateGroupSign(p, '+').ok).toBe(false);
    }
    expect(validateGroupSign(pm14m12, '+')).toMatchObject({ ok: false, feedbackKey: 'lookAtFractionSign' });
    expect(validateGroupSign(p23m6, '+')).toMatchObject({ ok: true, params: { fraction: true } });
  });

  it('③ Fill: every group holds exactly B, in any order; names the group that is off', () => {
    expect(validateGroup(p3m2, t('-', 2)).ok).toBe(true);
    expect(validateGroup(p3m2, t('+', 2))).toMatchObject({ feedbackKey: 'needGroupType' });
    expect(validateGroup(p3m2, t('-', 3), 1)).toMatchObject({ feedbackKey: 'groupCountAgain', params: { have: 3, index: 1 } });
    expect(validateFill(p3m2, [grp('-', 2), grp('-', 2), grp('-', 2)])).toMatchObject({ ok: true, feedbackKey: 'fillDone' });
    expect(validateFill(p3m2, [grp('-', 2), grp('-', 0), grp('-', 2)])).toMatchObject({ feedbackKey: 'emptyGroup', params: { index: 1 } });
    expect(validateFill(pm2m4, [grp('-', 4), grp('-', 4)])).toMatchObject({ ok: true, feedbackKey: 'fillDoneOpp' });
  });

  it('③ Fill, fraction bar: all of B dealt, with the right sign', () => {
    expect(validateDeal(p23m6, [grp('-', 2), grp('-', 2), grp('-', 2)])).toMatchObject({ ok: true, feedbackKey: 'dealDone', params: { n: 2 } });
    expect(validateDeal(p23m6, [grp('-', 2), grp('-', 2), grp('-', 1)])).toMatchObject({ feedbackKey: 'dealCount', params: { have: 5 } });
    expect(validateDeal(p23m6, [grp('+', 2), grp('+', 2), grp('+', 2)]).feedbackKey).toBe('dealType');
    expect(validateDeal(p23m6, [grp('-', 0), grp('-', 0), grp('-', 0)]).feedbackKey).toBe('dealType');
  });

  it('④ Take: exactly n parts', () => {
    const parts = [grp('-', 2, { taken: true }), grp('-', 2, { taken: true }), grp('-', 2)];
    expect(validateTake(p23m6, parts)).toMatchObject({ ok: true, feedbackKey: 'takeDone' });
    expect(validateTake(p23m6, parts.slice(1))).toMatchObject({ ok: false, feedbackKey: 'takeN', params: { n: 2, have: 1 } });
    expect(validateTake(pm14m12, [grp('-', 3, { taken: true }), grp('-', 3), grp('-', 3), grp('-', 3)]).feedbackKey).toBe('takeDoneOpp');
  });

  it('Count: the answer, after any flip', () => {
    expect(validateCount(p3m2, -6).ok).toBe(true);
    expect(validateCount(pm2m4, 8).ok).toBe(true);
    expect(validateCount(pm2m4, -8)).toMatchObject({ ok: false, feedbackKey: 'countAll' });
    expect(validateCount(p23m6, -4).ok).toBe(true);
    expect(validateCount(pm14m12, -3)).toMatchObject({ ok: false, feedbackKey: 'countTaken' });
    expect(validateCount(p3m2, null).feedbackKey).toBe('typeAnswer');
  });
});

describe('Group It session: whole-number groups', () => {
  it('uses Groups → + or − → Fill → Flip → Count', () => {
    expect(stepsFor(p3m2).map((x) => x.id)).toEqual(['groups', 'sign', 'fill', 'flip', 'count']);
  });

  it('5(2) = 10: pick +, then tap every group twice, in any order; Flip is skipped', () => {
    let s = run(newLassoSession(p5p2), ...times(5, { type: 'addGroup' }), { type: 'check' });
    expect(s.step).toBe('sign');
    s = run(s, { type: 'chooseSign', sign: '+' }, tap(0));
    expect(s.feedback.key).toBe('pickSignFirst');
    s = run(s, { type: 'pickSign', sign: '+' }, ...[4, 2, 0, 1, 3, 3, 1, 0, 2, 4].map(tap));
    expect(s.groups.map((g) => g.terms.length)).toEqual([2, 2, 2, 2, 2]);
    s = run(s, { type: 'check' });
    expect(s.step).toBe('count');
    expect(s.skipped).toEqual(['flip']);
    s = run(s, ...type(10));
    expect(s).toMatchObject({ step: 'done', answer: 10, feedback: { key: 'correct' } });
  });

  it('a half-filled group gets named at Check', () => {
    let s = run(newLassoSession(p3m2), ...times(3, { type: 'addGroup' }), { type: 'check' }, { type: 'chooseSign', sign: '+' },
      { type: 'pickSign', sign: '-' }, ...[0, 0, 2, 2, 1].map(tap), { type: 'check' });
    expect(s.feedback).toMatchObject({ key: 'groupCountAgain', params: { index: 1, have: 1 }, bad: true });
    s = run(s, tap(1), { type: 'check' });
    expect(s.step).toBe('count');
  });

  it('−2(−4) = 8: − groups, fill, tap each − to flip, then count 8', () => {
    let s = run(newLassoSession(pm2m4), ...times(2, { type: 'addGroup' }), { type: 'check' }, { type: 'chooseSign', sign: '-' });
    expect(s.opposite).toBe(true);
    s = run(s, { type: 'pickSign', sign: '-' }, ...times(4, tap(1)), ...times(4, tap(0)), { type: 'check' });
    expect(s).toMatchObject({ step: 'flip', feedback: { key: 'fillDoneOpp' } });
    s = run(s, { type: 'check' });
    expect(s.feedback.key).toBe('tapFlip');
    s = run(s, { type: 'flipGroup', index: 1 });
    expect(s.groups.map((g) => [g.flipped, signs(g)])).toEqual([[false, '----'], [true, '++++']]);
    expect(s).toMatchObject({ step: 'flip', feedback: { key: 'flipMore' } });
    s = run(s, { type: 'flipGroup', index: 1 }); // already flipped: nothing happens
    expect(s.groups[1].flipped).toBe(true);
    s = run(s, tap(0)); // tapping the group itself flips it too
    expect(s).toMatchObject({ step: 'count', feedback: { key: 'flipDone' } });
    s = run(s, ...type(-8));
    expect(s.feedback).toMatchObject({ key: 'countAll', bad: true });
    s = run(s, { type: 'backspace' }, { type: 'toggleSign' }, { type: 'digit', digit: 8 }, { type: 'check' });
    expect(s).toMatchObject({ step: 'done', answer: 8 });
  });

  it('Flip all flips every group at once', () => {
    const s = run(newLassoSession(pm3p4), ...times(3, { type: 'addGroup' }), { type: 'check' }, { type: 'chooseSign', sign: '-' },
      { type: 'pickSign', sign: '+' }, ...[0, 1, 2].flatMap((i) => times(4, tap(i))), { type: 'check' }, { type: 'flipAll' });
    expect(s.step).toBe('count');
    expect(s.groups.every((g) => g.flipped && signs(g) === '----')).toBe(true);
    expect(run(s, ...type(-12)).answer).toBe(-12);
  });

  it('−(−5): the hidden 1 must be written before any group', () => {
    let s = run(newLassoSession(pmm5), { type: 'addGroup' });
    expect(s.feedback).toMatchObject({ key: 'writeOneFirst', bad: true });
    expect(s.groups).toHaveLength(0);
    s = run(s, { type: 'writeOne' }, { type: 'addGroup' }, { type: 'check' });
    expect(s.step).toBe('sign');
  });

  it('Undo takes back the latest counter; tapping a group in Groups erases it', () => {
    let s = run(newLassoSession(p3m2), ...times(4, { type: 'addGroup' }), tap(3));
    expect(s.groups).toHaveLength(3);
    s = run(s, { type: 'check' }, { type: 'chooseSign', sign: '+' }, { type: 'pickSign', sign: '-' }, tap(2), tap(0), { type: 'undo' });
    expect(s.groups.map((g) => g.terms.length)).toEqual([0, 0, 1]);
  });

  it('caps groups and counters, and ignores moves outside their step', () => {
    let s = run(newLassoSession(p3m2), ...times(9, { type: 'addGroup' }));
    expect(s.groups).toHaveLength(6);
    expect(s.feedback.key).toBe('tooManyGroups');
    const before = s;
    for (const a of [{ type: 'pickSign', sign: '+' }, { type: 'flipAll' }, { type: 'digit', digit: 3 }, { type: 'undo' }]) {
      expect(reduceLasso(before, a)).toBe(before);
    }
    s = run(newLassoSession(p3m2), ...times(3, { type: 'addGroup' }), { type: 'check' }, { type: 'chooseSign', sign: '+' },
      { type: 'pickSign', sign: '-' }, ...times(15, tap(0)));
    expect(s.groups[0].terms).toHaveLength(12);
    expect(s.feedback.key).toBe('groupFull');
  });
});

describe('Group It session: fraction groups', () => {
  it('uses Groups → + or − → Fill → Take → Flip → Count', () => {
    expect(stepsFor(p23m6).map((x) => x.id)).toEqual(['groups', 'sign', 'fill', 'take', 'flip', 'count']);
  });

  it('1/5(10) = 2: five groups in a bar, dealt one at a time, top to bottom, twice around', () => {
    let s = run(newLassoSession(p15p10), ...times(5, { type: 'addGroup' }), { type: 'check' }, { type: 'chooseSign', sign: '+' },
      { type: 'pickSign', sign: '+' });
    expect(nextPart(s)).toBe(0);
    s = run(s, tap(2));
    expect(s.feedback.key).toBe('dealHere');
    expect(s.history).toHaveLength(0);
    for (let k = 0; k < 10; k++) {
      expect(nextPart(s)).toBe(k % 5);
      s = run(s, tap(k % 5));
    }
    expect(s.groups.map((g) => g.terms.length)).toEqual([2, 2, 2, 2, 2]);
    s = run(s, { type: 'check' });
    expect(s).toMatchObject({ step: 'take', feedback: { key: 'dealDone' } });
    s = run(s, tap(3), { type: 'check' });
    expect(s).toMatchObject({ step: 'count', skipped: ['flip'] });
    expect(run(s, ...type(2))).toMatchObject({ step: 'done', answer: 2 });
  });

  it('2/3(−6) = −4: take 2, count −4', () => {
    let s = run(newLassoSession(p23m6), ...times(3, { type: 'addGroup' }), { type: 'check' }, { type: 'chooseSign', sign: '+' },
      { type: 'pickSign', sign: '-' }, ...[0, 1, 2, 0, 1, 2].map(tap), { type: 'check' }, tap(0), tap(2), tap(2), { type: 'check' });
    expect(s.feedback).toMatchObject({ key: 'takeN', bad: true });
    s = run(s, tap(1), { type: 'check' }, ...type(-4));
    expect(s).toMatchObject({ step: 'done', answer: -4 });
  });

  it('−1/4(−12) = 3: the one − flips only the groups taken', () => {
    let s = run(newLassoSession(pm14m12), ...times(4, { type: 'addGroup' }), { type: 'check' }, { type: 'chooseSign', sign: '-' },
      { type: 'pickSign', sign: '-' }, ...times(12, null).map((_, k) => tap(k % 4)), { type: 'check' }, tap(0), { type: 'check' });
    expect(s).toMatchObject({ step: 'flip', feedback: { key: 'takeDoneOpp' } });
    s = run(s, { type: 'flipGroup', index: 0 });
    expect(s.step).toBe('count');
    expect(s.groups.map((g) => [g.flipped, signs(g)])).toEqual([[true, '+++'], [false, '---'], [false, '---'], [false, '---']]);
    expect(run(s, ...type(3))).toMatchObject({ step: 'done', answer: 3 });
  });

  it('Undo takes back the latest deal, and the lit-up group follows', () => {
    const s = run(newLassoSession(p23m6), ...times(3, { type: 'addGroup' }), { type: 'check' }, { type: 'chooseSign', sign: '+' },
      { type: 'pickSign', sign: '-' }, tap(0), tap(1), { type: 'undo' });
    expect(s.groups.map((g) => g.terms.length)).toEqual([1, 0, 0]);
    expect(nextPart(s)).toBe(1);
  });

  it('caps parts at 7', () => {
    const s = run(newLassoSession(p23m6), ...times(9, { type: 'addGroup' }));
    expect(s.groups).toHaveLength(7);
    expect(s.feedback.key).toBe('tooManyGroups');
  });
});

describe('Group It feedback table', async () => {
  const { readFileSync } = await import('node:fs');
  const { LASSO_FEEDBACK, lassoFeedbackText } = await import('../src/view/lassoFeedback.js');

  it('has a message for every key the engine can produce', () => {
    const src = ['lassoMoves.js', 'lassoSession.js']
      .map((f) => readFileSync(new URL(`../src/engine/${f}`, import.meta.url), 'utf8')).join('\n');
    const keys = new Set();
    for (const m of src.matchAll(/'(\w+)'/g)) if (/^[a-z]+[A-Z]\w*$/.test(m[1]) || ['correct', 'writeOne'].includes(m[1])) keys.add(m[1]);
    for (const k of ['addGroup', 'tapGroup', 'writeOne', 'pickSign', 'chooseSign', 'flipGroup', 'flipAll', 'toggleSign']) keys.delete(k);
    expect(keys.size).toBeGreaterThan(25);
    for (const k of keys) expect(LASSO_FEEDBACK, `missing "${k}"`).toHaveProperty(k);
  });

  it('says "group", never "lasso"', () => {
    for (const [k, f] of Object.entries(LASSO_FEEDBACK)) {
      const text = f({ n: 2, d: 3, b: -2, count: 2, sign: '-', have: 1, index: 0, total: -4, answer: 4, fraction: true })
        + f({ fraction: false, n: 1, b: 2, count: 2, sign: '+', have: 1, index: 2 });
      expect(text, k).not.toMatch(/lasso/i);
    }
  });

  it('reads well', () => {
    expect(lassoFeedbackText({ key: 'groupCount', params: { n: 3, have: 2 } })).toBe('The number of groups is 3 — you have 2 groups.');
    expect(lassoFeedbackText({ key: 'needGroupType', params: { b: -2, count: 2, sign: '-' } })).toBe('Each group is −2, so each group needs 2 negatives.');
    expect(lassoFeedbackText({ key: 'groupCountAgain', params: { b: -2, have: 3, index: 1 } })).toBe('The second group has 3 — each group is −2.');
  });
});
