import { describe, it, expect } from 'vitest';
import { makeGroups } from '../src/engine/groups.js';
import {
  validateGroups, validateGroupSign, validateGroup, validateFill, validateCount, validateOppositeAnswer,
  validateWhole, validateSplit, validateTake, validateOppositeChoice,
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

});

describe('Lasso fraction validators', () => {
  const p = makeGroups({ n: 2, d: 3 }, -6);
  const part = (n, taken = false) => ({ terms: t('-', n), taken });

  it('① Whole: B drawn in one lasso', () => {
    expect(validateWhole(p, t('-', 6)).ok).toBe(true);
    expect(validateWhole(p, t('+', 6))).toMatchObject({ feedbackKey: 'wholeType', params: { b: -6, count: 6, sign: '-' } });
    expect(validateWhole(p, t('-', 5))).toMatchObject({ feedbackKey: 'wholeCount', params: { have: 5 } });
  });

  it('② Split: d parts, all dealt, all equal', () => {
    expect(validateSplit(p, { whole: [], parts: [part(2), part(2), part(2)] }).ok).toBe(true);
    expect(validateSplit(p, { whole: [], parts: [part(3), part(3)] })).toMatchObject({ feedbackKey: 'splitParts', params: { d: 3, have: 2 } });
    expect(validateSplit(p, { whole: t('-', 1), parts: [part(2), part(2), part(1)] }).feedbackKey).toBe('dealAll');
    expect(validateSplit(p, { whole: [], parts: [part(3), part(2), part(1)] }).feedbackKey).toBe('unequalParts');
  });

  it('③ Take: exactly n parts', () => {
    expect(validateTake(p, [part(2, true), part(2, true), part(2)]).ok).toBe(true);
    expect(validateTake(p, [part(2, true), part(2), part(2)])).toMatchObject({ feedbackKey: 'takeN', params: { n: 2, have: 1 } });
  });

  it('⑤ "No opposite" passes only when A > 0, opp. only when A < 0', () => {
    expect(validateOppositeChoice(p, 'none').ok).toBe(true);
    expect(validateOppositeChoice(p, 'opp')).toMatchObject({ ok: false, feedbackKey: 'notOpposite' });
    const neg = makeGroups({ neg: true, n: 1, d: 4 }, -12);
    expect(validateOppositeChoice(neg, 'opp').ok).toBe(true);
    expect(validateOppositeChoice(neg, 'none')).toMatchObject({ ok: false, feedbackKey: 'isOppositeGroup' });
  });
});

describe('Lasso session: fraction groups', () => {
  it('uses the five fraction steps', () => {
    expect(stepsFor(makeGroups({ n: 2, d: 3 }, -6)).map((x) => x.id)).toEqual(['whole', 'split', 'take', 'count', 'opposite']);
  });

  it('2/3(−6) = −4: draw, split, take 2, count, No opposite', () => {
    let s = newLassoSession(makeGroups({ n: 2, d: 3 }, -6));
    expect(s).toMatchObject({ script: 'fraction', step: 'whole' });
    s = run(s, { type: 'tapWhole' });
    expect(s.feedback.key).toBe('pickSignFirst');
    s = run(s, { type: 'pickSign', sign: '-' }, ...times(7, { type: 'tapWhole' }), { type: 'check' });
    expect(s.feedback.key).toBe('wholeCount');
    s = run(s, { type: 'undo' }, { type: 'check' });
    expect(s.step).toBe('split');

    s = run(s, ...times(2, { type: 'addPart' }), { type: 'check' });
    expect(s.feedback).toMatchObject({ key: 'splitParts', params: { d: 3, have: 2 } });
    s = run(s, { type: 'addPart' }, ...times(3, { type: 'tapPart', index: 0 }), { type: 'check' });
    expect(s.feedback.key).toBe('dealAll');
    s = run(s, ...times(3, { type: 'tapPart', index: 1 }), { type: 'check' });
    expect(s.feedback.key).toBe('unequalParts');
    s = run(s, { type: 'undo' }, { type: 'undo' }, { type: 'undo' }); // three deals back into the whole
    expect(s.whole).toHaveLength(3);
    s = run(s, { type: 'tapPart', index: 1 }, { type: 'tapPart', index: 1 }, { type: 'tapPart', index: 2 },
      { type: 'tapPart', index: 2 }, { type: 'tapPart', index: 2 });
    expect(s.feedback.key).toBe('allDealt');
    expect(s.parts.map((x) => x.terms.length)).toEqual([3, 2, 1]);
    s = run(s, { type: 'undo' }, { type: 'undo' }, { type: 'tapPart', index: 1 }, { type: 'tapPart', index: 2 }, { type: 'undo' });
    // parts are now [3, 3, 0] with 0 left… rebuild a fair split from scratch
    s = run(newLassoSession(makeGroups({ n: 2, d: 3 }, -6)), { type: 'pickSign', sign: '-' }, ...times(6, { type: 'tapWhole' }), { type: 'check' },
      ...times(3, { type: 'addPart' }), ...[0, 1, 2, 0, 1, 2].map((i) => ({ type: 'tapPart', index: i })), { type: 'check' });
    expect(s.step).toBe('take');

    s = run(s, { type: 'tapPart', index: 0 }, { type: 'check' });
    expect(s.feedback.key).toBe('takeN');
    s = run(s, { type: 'tapPart', index: 2 }, { type: 'check' });
    expect(s.step).toBe('count');
    s = run(s, ...type(-6));
    expect(s.feedback.key).toBe('countTaken');
    s = run(s, { type: 'backspace' }, { type: 'digit', digit: 4 }, { type: 'check' });
    expect(s).toMatchObject({ step: 'opposite', total: -4 });
    expect(s.feedback.key).toBe('oppOrNot');
    s = run(s, { type: 'flip' });
    expect(s.feedback.key).toBe('notOpposite');
    s = run(s, { type: 'noOpposite' });
    expect(s).toMatchObject({ step: 'done', answer: -4, skipped: ['opposite'] });
  });

  it('−1/4(−12) = 3: opposite fraction flips, then asks for the answer', () => {
    let s = run(newLassoSession(makeGroups({ neg: true, n: 1, d: 4 }, -12)), { type: 'pickSign', sign: '-' },
      ...times(12, { type: 'tapWhole' }), { type: 'check' }, ...times(4, { type: 'addPart' }),
      ...Array.from({ length: 12 }, (_, i) => ({ type: 'tapPart', index: i % 4 })), { type: 'check' },
      { type: 'tapPart', index: 3 }, { type: 'check' }, ...type(-3));
    expect(s).toMatchObject({ step: 'opposite', total: -3 });
    s = run(s, { type: 'noOpposite' });
    expect(s.feedback.key).toBe('isOppositeGroup');
    s = run(s, { type: 'flip' });
    expect(s.flipped).toBe(true);
    s = run(s, ...type(-3));
    expect(s.feedback.key).toBe('oppositeOf');
    s = run(s, { type: 'toggleSign' }, { type: 'check' });
    expect(s).toMatchObject({ step: 'done', answer: 3 });
  });

  it('Undo in Whole takes back counters only; in Split, parts and deals only', () => {
    let s = run(newLassoSession(makeGroups({ n: 1, d: 2 }, 4)), { type: 'pickSign', sign: '+' }, ...times(4, { type: 'tapWhole' }), { type: 'check' });
    s = run(s, { type: 'undo' });
    expect(s.whole).toHaveLength(4); // can't undo into the checked whole
    s = run(s, { type: 'addPart' }, { type: 'addPart' }, { type: 'tapPart', index: 0 }, { type: 'undo' }, { type: 'undo' });
    expect(s.parts).toHaveLength(1);
    expect(s.whole).toHaveLength(4);
  });

  it('ignores whole-number moves, and caps parts', () => {
    const s0 = newLassoSession(makeGroups({ n: 2, d: 3 }, -6));
    expect(reduceLasso(s0, { type: 'addLasso' })).toBe(s0);
    let s = run(s0, { type: 'pickSign', sign: '-' }, ...times(6, { type: 'tapWhole' }), { type: 'check' }, ...times(9, { type: 'addPart' }));
    expect(s.parts).toHaveLength(7);
    expect(s.feedback.key).toBe('tooManyParts');
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
