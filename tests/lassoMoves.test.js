import { describe, it, expect } from 'vitest';
import { makeGroups } from '../src/engine/groups.js';
import {
  validateGroups, validateGroupSign, validateGroup, validateFill, validateCount, validateOppositeAnswer,
} from '../src/engine/lassoMoves.js';
import { newLassoSession, reduceLasso, stepsFor } from '../src/engine/lassoSession.js';

const t = (sign, n) => Array.from({ length: n }, () => ({ kind: 'int', sign }));
const lasso = (sign, n) => ({ opposite: false, terms: t(sign, n) });
const run = (s, ...actions) => actions.reduce(reduceLasso, s);
const times = (n, a) => Array.from({ length: n }, () => a);
const type = (v) => [
  ...(v < 0 ? [{ type: 'toggleSign' }] : []),
  ...[...String(Math.abs(v))].map((d) => ({ type: 'digit', digit: Number(d) })),
  { type: 'check' },
];

const p3m2 = makeGroups({ n: 3 }, -2);                           // 3(−2)
const pm2m4 = makeGroups({ neg: true, n: 2 }, -4);               // −2(−4)
const pmm5 = makeGroups({ neg: true, n: 1 }, -5, { hidden1: true }); // −(−5)
const pm3p4 = makeGroups({ neg: true, n: 3 }, 4);                // −3(4)

describe('Lasso validators', () => {
  it('① Groups: needs |A| lassos, and the hidden 1 written first', () => {
    expect(validateGroups(p3m2, { count: 3, wroteOne: true }).ok).toBe(true);
    expect(validateGroups(p3m2, { count: 2, wroteOne: true })).toMatchObject({ ok: false, feedbackKey: 'groupCount', params: { n: 3, have: 2 } });
    expect(validateGroups(pmm5, { count: 1, wroteOne: false })).toMatchObject({ ok: false, feedbackKey: 'writeOne' });
    expect(validateGroups(pmm5, { count: 1, wroteOne: true }).ok).toBe(true);
  });

  it('② + or −: right for every sign of A', () => {
    expect(validateGroupSign(p3m2, '+').ok).toBe(true);
    expect(validateGroupSign(p3m2, '-')).toMatchObject({ ok: false, feedbackKey: 'lookAtSign' });
    for (const p of [pm2m4, pmm5, pm3p4]) {
      expect(validateGroupSign(p, '-')).toMatchObject({ ok: true, feedbackKey: 'oppositeGroups' });
      expect(validateGroupSign(p, '+').ok).toBe(false);
    }
  });

  it('③ Fill: each lasso holds exactly B, with the right type', () => {
    expect(validateFill(p3m2, [lasso('-', 2), lasso('-', 2), lasso('-', 2)]).ok).toBe(true);
    expect(validateFill(p3m2, [lasso('+', 2), lasso('-', 2), lasso('-', 2)])).toMatchObject({ feedbackKey: 'needGroupType', params: { b: -2, count: 2, sign: '-', index: 0 } });
    expect(validateFill(p3m2, [lasso('-', 2), lasso('-', 3), lasso('-', 2)])).toMatchObject({ feedbackKey: 'groupCountAgain', params: { have: 3, b: -2, index: 1 } });
    expect(validateFill(p3m2, [lasso('-', 2), lasso('-', 2), lasso('-', 0)])).toMatchObject({ feedbackKey: 'copyEachGroup', params: { index: 2 } });
    expect(validateFill(pm3p4, [lasso('+', 4), lasso('+', 4), lasso('+', 4)]).ok).toBe(true); // the inside is +4 even for opposite groups
    expect(validateGroup(p3m2, [], 0).feedbackKey).toBe('needGroupType');
  });

  it('④ Count and ⑤ Opposite: only the right signed integers', () => {
    expect(validateCount(p3m2, -6)).toMatchObject({ ok: true, feedbackKey: 'correct' });
    expect(validateCount(p3m2, 6)).toMatchObject({ ok: false, feedbackKey: 'countAll' });
    expect(validateCount(p3m2, null).feedbackKey).toBe('typeAnswer');
    expect(validateCount(pm2m4, -8)).toMatchObject({ ok: true, feedbackKey: 'countDoneOpp', params: { total: -8 } });
    expect(validateCount(pm2m4, 8).ok).toBe(false); // count first, then flip
    expect(validateOppositeAnswer(pm2m4, 8)).toMatchObject({ ok: true, feedbackKey: 'correct' });
    expect(validateOppositeAnswer(pm2m4, -8)).toMatchObject({ ok: false, feedbackKey: 'oppositeOf', params: { total: -8 } });
  });
});

describe('Lasso session: whole-number groups', () => {
  it('uses the five whole-number steps', () => {
    expect(stepsFor(p3m2).map((x) => x.id)).toEqual(['groups', 'sign', 'fill', 'count', 'opposite']);
  });

  it('3(−2) = −6: plus groups skip Opposite', () => {
    let s = newLassoSession(p3m2);
    s = run(s, ...times(2, { type: 'addLasso' }), { type: 'check' });
    expect(s.feedback).toMatchObject({ key: 'groupCount', bad: true });
    s = run(s, { type: 'addLasso' }, { type: 'check' });
    expect(s.step).toBe('sign');
    s = run(s, { type: 'chooseSign', sign: '-' });
    expect(s.feedback.key).toBe('lookAtSign');
    s = run(s, { type: 'chooseSign', sign: '+' });
    expect(s.step).toBe('fill');
    expect(s.lassos.every((l) => !l.opposite)).toBe(true);

    s = run(s, { type: 'tapLasso', index: 0 });
    expect(s.feedback.key).toBe('pickSignFirst');
    s = run(s, { type: 'pickSign', sign: '-' }, ...times(2, { type: 'tapLasso', index: 0 }));
    s = run(s, { type: 'tapLasso', index: 1 }, { type: 'tapLasso', index: 2 });
    expect(s.lassos.map((l) => l.terms.length)).toEqual([2, 2, 2]);
    s = run(s, { type: 'check' });
    expect(s.step).toBe('count');

    s = run(s, ...type(6));
    expect(s.feedback.key).toBe('countAll');
    s = run(s, { type: 'backspace' }, { type: 'toggleSign' }, { type: 'digit', digit: 6 }, { type: 'check' });
    expect(s).toMatchObject({ step: 'done', total: -6, answer: -6, skipped: ['opposite'] });
    expect(s.tries).toEqual({ groups: 1, sign: 1, count: 1 });
  });

  it('−2(−4) = 8: opposite groups, count −8, one opp. tap flips every group', () => {
    let s = run(newLassoSession(pm2m4), ...times(2, { type: 'addLasso' }), { type: 'check' }, { type: 'chooseSign', sign: '-' });
    expect(s.lassos.every((l) => l.opposite)).toBe(true);
    s = run(s, { type: 'pickSign', sign: '-' }, ...times(4, { type: 'tapLasso', index: 0 }), { type: 'tapLasso', index: 1 }, { type: 'check' }, ...type(-8));
    expect(s).toMatchObject({ step: 'opposite', total: -8, flipped: false });
    expect(s.feedback.key).toBe('countDoneOpp');

    s = run(s, { type: 'digit', digit: 8 });
    expect(s.entry.digits).toBe(''); // the pad waits for opp.
    s = run(s, { type: 'check' });
    expect(s.feedback.key).toBe('tapOppFirst');
    s = run(s, { type: 'flip' });
    expect(s.flipped).toBe(true);
    s = run(s, ...type(-8));
    expect(s.feedback).toMatchObject({ key: 'oppositeOf', params: { total: -8 } });
    s = run(s, { type: 'toggleSign' }, { type: 'check' });
    expect(s).toMatchObject({ step: 'done', answer: 8 });
  });

  it('−(−5): the hidden 1 must be written before any lasso', () => {
    let s = newLassoSession(pmm5);
    expect(s.feedback.key).toBe('groupsIntroHidden');
    s = run(s, { type: 'addLasso' });
    expect(s).toMatchObject({ lassos: [], feedback: { key: 'writeOneFirst' } });
    s = run(s, { type: 'check' });
    expect(s.feedback.key).toBe('writeOne');
    s = run(s, { type: 'writeOne' }, { type: 'addLasso' }, { type: 'check' });
    expect(s.step).toBe('sign');
  });

  it('copying waits until the first group is right', () => {
    let s = run(newLassoSession(p3m2), ...times(3, { type: 'addLasso' }), { type: 'check' }, { type: 'chooseSign', sign: '+' },
      { type: 'pickSign', sign: '-' }, { type: 'tapLasso', index: 0 }, { type: 'tapLasso', index: 1 });
    expect(s.feedback.key).toBe('fixFirstGroup');
    expect(s.lassos[1].terms).toEqual([]);
  });

  it('Undo takes back the latest counter or copy; tapping a lasso in Groups erases it', () => {
    let s = run(newLassoSession(p3m2), ...times(4, { type: 'addLasso' }), { type: 'tapLasso', index: 3 });
    expect(s.lassos).toHaveLength(3);
    s = run(s, { type: 'check' }, { type: 'chooseSign', sign: '+' }, { type: 'pickSign', sign: '-' },
      ...times(2, { type: 'tapLasso', index: 0 }), { type: 'tapLasso', index: 2 });
    s = run(s, { type: 'undo' });
    expect(s.lassos.map((l) => l.terms.length)).toEqual([2, 0, 0]);
    s = run(s, { type: 'undo' });
    expect(s.lassos.map((l) => l.terms.length)).toEqual([1, 0, 0]);
  });

  it('caps lassos and counters, and ignores moves outside their step', () => {
    let s = run(newLassoSession(p3m2), ...times(9, { type: 'addLasso' }));
    expect(s.lassos).toHaveLength(6);
    expect(s.feedback.key).toBe('tooManyLassos');
    const s0 = newLassoSession(p3m2);
    expect(reduceLasso(s0, { type: 'flip' })).toBe(s0);
    expect(reduceLasso(s0, { type: 'digit', digit: 3 })).toBe(s0);
    expect(reduceLasso(s0, { type: 'chooseSign', sign: '+' })).toBe(s0);
  });

  it('fraction problems wait for Lasso step 4', () => {
    expect(() => newLassoSession(makeGroups({ n: 2, d: 3 }, -6))).toThrow();
  });
});

describe('Lasso feedback table', async () => {
  const { readFileSync } = await import('node:fs');
  const { LASSO_FEEDBACK, lassoFeedbackText } = await import('../src/view/lassoFeedback.js');

  it('has a message for every key the Lasso engine can produce', () => {
    const src = ['lassoMoves.js', 'lassoSession.js']
      .map((f) => readFileSync(new URL(`../src/engine/${f}`, import.meta.url), 'utf8')).join('\n');
    const keys = new Set();
    for (const m of src.matchAll(/(?:pass|fail|note\(s,)\s*\(?'(\w+)'|feedbackKey: '(\w+)'|key: (?:problem\.hidden1 \? )?'(\w+)'(?: : '(\w+)')?/g)) {
      for (const k of m.slice(1)) if (k) keys.add(k);
    }
    expect(keys.size).toBeGreaterThan(20);
    for (const k of keys) expect(LASSO_FEEDBACK, `missing "${k}"`).toHaveProperty(k);
  });

  it('matches the spec wording', () => {
    expect(lassoFeedbackText({ key: 'groupCount', params: { n: 3, have: 2 } })).toBe('The number of groups is 3 — you have 2 lassos.');
    expect(lassoFeedbackText({ key: 'needGroupType', params: { b: -2, count: 2, sign: '-' } })).toBe('Each group is −2, so each lasso needs 2 negatives.');
    expect(lassoFeedbackText({ key: 'groupCountAgain', params: { b: -2, have: 3 } })).toBe('This lasso has 3 — each group is −2.');
    expect(lassoFeedbackText({ key: 'oppositeOf', params: { total: -8 } })).toBe('The opposite of −8 is…?');
  });
});
