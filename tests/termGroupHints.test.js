import { describe, it, expect } from 'vitest';
import { makeTermGroups } from '../src/engine/termGroups.js';
import { newTermGroupSession, reduceTermGroups as reduce } from '../src/engine/termGroupSession.js';
import { termGroupHintFor } from '../src/engine/termGroupHints.js';
import { termGroupFeedbackText } from '../src/view/termGroupFeedback.js';

const x = (value) => ({ kind: 'x', value });
const n = (value) => ({ kind: 'int', value });
const run = (s, ...a) => a.reduce(reduce, s);
const check = { type: 'check' };
const add = { type: 'addGroup' };
const tap = (index) => ({ type: 'tapGroup', index });
const pick = (pieceType, sign) => ({ type: 'pickPiece', pieceType, sign });
const sign = (s) => ({ type: 'chooseSign', sign: s });
const times = (s, k, ...a) => { for (let i = 0; i < k; i++) s = run(s, ...a); return s; };

const WHOLE = makeTermGroups({ n: 3 }, [x(2), n(-1)]);                          // 3(2x − 1)
const OPP = makeTermGroups({ neg: true, n: 2 }, [x(1), n(-4)]);                 // −2(x − 4)
const HIDDEN = makeTermGroups({ neg: true, n: 1 }, [x(1), n(3)], { hidden1: true });
const FRACTION = makeTermGroups({ n: 1, d: 2 }, [x(4), n(6)]);                  // 1/2(4x + 6)

const atFill = (p, s = '+') => run(newTermGroupSession(p), ...Array(p.count.d > 1 ? p.count.d : p.count.n).fill(add), check, sign(s));

describe('Groups of Terms hints', () => {
  it('wait for three wrong tries on the step', () => {
    expect(termGroupHintFor(newTermGroupSession(WHOLE))).toBeNull();
    expect(termGroupHintFor(times(newTermGroupSession(WHOLE), 2, check))).toBeNull();
    expect(termGroupHintFor(times(newTermGroupSession(WHOLE), 3, check))).toMatchObject({ key: 'hintGroups' });
  });

  it('Groups: pulses Add group, blinks the extras, and points at the hidden 1', () => {
    expect(termGroupHintFor(times(newTermGroupSession(WHOLE), 3, check)).show).toEqual({ button: 'addGroup' });
    const many = times(run(newTermGroupSession(WHOLE), add, add, add, add), 3, check);
    expect(termGroupHintFor(many).show).toEqual({ groups: [3] });
    expect(termGroupHintFor(times(newTermGroupSession(HIDDEN), 3, check))).toBeNull();                 // an empty Check isn't a wrong try
    expect(termGroupHintFor(times(run(newTermGroupSession(HIDDEN), { type: 'digit', digit: 2 }), 3, check))).toMatchObject({ key: 'hintWriteOne', show: { slot: true } });
    expect(termGroupHintFor(times(newTermGroupSession(FRACTION), 3, check)).key).toBe('hintParts');
  });

  it('+ or −: pulses the right button', () => {
    const atSign = run(newTermGroupSession(OPP), add, add, check);
    expect(termGroupHintFor(times(atSign, 3, sign('+')))).toMatchObject({ key: 'hintSign', show: { button: 'chooseSign:-' } });
    expect(termGroupHintFor(times(run(newTermGroupSession(WHOLE), add, add, add, check), 3, sign('-'))).show.button).toBe('chooseSign:+');
  });

  it('Fill: pulses the next piece to pick, then Copy to all, and blinks the groups that are off', () => {
    let s = times(atFill(WHOLE), 3, check);
    const hint = termGroupHintFor(s);
    expect(hint).toMatchObject({ key: 'hintFillTerms', show: { button: 'pickPiece:box:+', groups: [0, 1, 2] } });
    expect(termGroupFeedbackText(hint)).toMatch(/Each group is \(2x − 1\): 2 boxes and 1 negative/);
    s = run(s, pick('box', '+'), tap(0), tap(0));
    expect(termGroupHintFor(s).show.button).toBe('pickPiece:counter:-');
    s = run(s, pick('counter', '-'), tap(0));
    expect(termGroupHintFor(s).show.button).toBe('copyAll');
    s = run(s, { type: 'copyAll' }, pick('box', '+'), tap(2));                       // the third group gets an extra
    expect(termGroupHintFor(s).show.groups).toEqual([2]);
  });

  it('Fill, fraction: pulses the kind to deal', () => {
    let s = times(atFill(FRACTION), 3, check);
    expect(termGroupHintFor(s)).toMatchObject({ key: 'hintDealTerms', show: { button: 'pickPiece:box:+' } });
    s = run(s, pick('counter', '+'), tap(0));
    expect(termGroupHintFor(s).show.button).toBe('pickPiece:counter:+');             // finish the kind in progress
  });

  it('Take: blinks the first n parts as an example', () => {
    let s = atFill(FRACTION);
    for (const [type, k] of [['box', 4], ['counter', 6]]) {
      s = run(s, pick(type, '+'));
      for (let i = 0; i < k; i++) s = run(s, tap(i % 2));
    }
    s = times(run(s, check), 3, check);
    expect(termGroupHintFor(s)).toMatchObject({ key: 'hintTake', params: { n: 1 }, show: { groups: [0] } });
  });

  it('Answer: blinks the groups and names the signs, not the counts', () => {
    let s = atFill(WHOLE);
    s = run(s, pick('box', '+'), tap(0), tap(0), pick('counter', '-'), tap(0), { type: 'copyAll' }, check);
    s = times(run(s, { type: 'typeChar', ch: 'x' }), 3, check);
    const hint = termGroupHintFor(s);
    expect(hint).toMatchObject({ key: 'hintAnswerTerms', params: { x: '+', n: '-' }, show: { groups: [0, 1, 2] } });
    expect(termGroupFeedbackText(hint)).toBe('Look at the blinking groups together: the boxes are positive and the numbers are negative. Count each kind, then type it.');
    expect(termGroupFeedbackText(hint)).not.toMatch(/\d/);
  });

  it('every hint key has words', () => {
    for (const key of ['hintFillTerms', 'hintDealTerms', 'hintAnswerTerms', 'hintWriteOne', 'hintGroups', 'hintParts', 'hintSign', 'hintTake']) {
      expect(termGroupFeedbackText({ key, params: { text: '2x − 1', need: '2 boxes', x: '+', n: '-', n2: 1, sign: '+', fraction: false, have: 1 } })).toMatch(/\w/);
    }
  });
});
