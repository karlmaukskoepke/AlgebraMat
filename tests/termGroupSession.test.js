import { describe, it, expect } from 'vitest';
import { makeTermGroups } from '../src/engine/termGroups.js';
import { newTermGroupSession, reduceTermGroups as reduce, stepsFor, nextPart, kindInProgress } from '../src/engine/termGroupSession.js';
import { validateGroup, validateFill, validateDeal, describeB, maxInGroup } from '../src/engine/termGroupMoves.js';
import { termGroupFeedbackText } from '../src/view/termGroupFeedback.js';
import { generateTermGroupsLevel } from '../src/engine/generateTermGroups.js';
import { piecesOfGroup, answerText } from '../src/engine/termGroups.js';

const x = (value) => ({ kind: 'x', value });
const n = (value) => ({ kind: 'int', value });
const run = (s, ...actions) => actions.reduce(reduce, s);
const check = { type: 'check' };
const add = { type: 'addGroup' };
const tap = (index) => ({ type: 'tapGroup', index });
const pick = (pieceType, sign) => ({ type: 'pickPiece', pieceType, sign });
const sign = (s) => ({ type: 'chooseSign', sign: s });

const WHOLE = makeTermGroups({ n: 3 }, [x(2), n(-1)]);                          // 3(2x − 1)
const OPP = makeTermGroups({ neg: true, n: 2 }, [x(1), n(-4)]);                 // −2(x − 4)
const HIDDEN = makeTermGroups({ neg: true, n: 1 }, [x(1), n(3)], { hidden1: true }); // −(x + 3)
const FRACTION = makeTermGroups({ n: 1, d: 2 }, [x(4), n(6)]);                  // 1/2(4x + 6)

const atFill = (p = WHOLE, s = '+') => run(newTermGroupSession(p), ...Array(p.count.d > 1 ? p.count.d : p.count.n).fill(add), check, sign(s));

describe('Groups of Terms session: Groups and + or −', () => {
  it('starts at Groups with the right script, and the step bars list the later steps too', () => {
    expect(newTermGroupSession(WHOLE)).toMatchObject({ step: 'groups', script: 'whole', wroteOne: true });
    expect(newTermGroupSession(FRACTION).script).toBe('fraction');
    expect(stepsFor(WHOLE).map((t) => t.id)).toEqual(['groups', 'sign', 'fill', 'flip', 'answer', 'checkit']);
    expect(stepsFor(FRACTION).map((t) => t.id)).toEqual(['groups', 'sign', 'fill', 'take', 'flip', 'answer', 'checkit']);
  });

  it('needs one group per group in the problem (the bottom number for a fraction)', () => {
    let s = run(newTermGroupSession(WHOLE), add, add, check);
    expect(s).toMatchObject({ step: 'groups', feedback: { key: 'groupCount', params: { n: 3, have: 2 }, bad: true }, tries: { groups: 1 } });
    s = run(s, add, check);
    expect(s).toMatchObject({ step: 'sign', groups: expect.any(Array) });
    expect(s.groups).toHaveLength(3);
    expect(run(newTermGroupSession(FRACTION), add, check).feedback.key).toBe('partCount');
    expect(run(newTermGroupSession(FRACTION), add, add, check).step).toBe('sign');
  });

  it('erases a tapped group, and stops at too many', () => {
    const s = run(newTermGroupSession(WHOLE), add, add, tap(0));
    expect(s.groups).toHaveLength(1);
    const many = run(newTermGroupSession(WHOLE), ...Array(8).fill(add));
    expect(many.groups).toHaveLength(6);
    expect(many.feedback.key).toBe('tooManyGroups');
  });

  it('types the hidden 1 first for −(B), and only a 1 will do', () => {
    let s = newTermGroupSession(HIDDEN);
    expect(s.wroteOne).toBe(false);
    expect(run(s, add).feedback).toMatchObject({ key: 'writeOneFirst', bad: true });
    expect(run(s, check).feedback.key).toBe('typeOne');
    s = run(s, { type: 'digit', digit: 2 }, check);
    expect(s.feedback).toMatchObject({ key: 'notOne', bad: true });
    s = run(s, { type: 'backspace' }, { type: 'digit', digit: 1 }, check);
    expect(s).toMatchObject({ wroteOne: true, feedback: { key: 'oneWritten' }, entry: { digits: '' } });
    expect(run(s, add, check).step).toBe('sign');
    expect(run(newTermGroupSession(WHOLE), { type: 'digit', digit: 1 }).entry.digits).toBe('');   // no pad when nothing is hidden
  });

  it('checks + or −: wrong choice is a wrong try, right choice goes to Fill', () => {
    const atSign = run(newTermGroupSession(OPP), add, add, check);
    expect(run(atSign, sign('+')).feedback).toMatchObject({ key: 'lookAtSign', bad: true });
    expect(run(atSign, sign('-'))).toMatchObject({ step: 'fill', opposite: true, feedback: { key: 'oppositeGroups' } });
    expect(run(atFill(WHOLE, '+')).opposite).toBe(false);
  });
});

describe('Groups of Terms session: Fill, whole-number groups', () => {
  it('needs a piece picked, adds it to the tapped group, and Undo takes it back', () => {
    let s = atFill();
    expect(run(s, tap(0)).feedback.key).toBe('pickPieceFirst');
    s = run(s, pick('box', '+'), tap(0), tap(0));
    expect(s.groups[0].pieces).toEqual([{ type: 'box', sign: '+' }, { type: 'box', sign: '+' }]);
    s = run(s, { type: 'undo' });
    expect(s.groups[0].pieces).toHaveLength(1);
    s = run(s, { type: 'undo' }, { type: 'undo' });
    expect(s.groups[0].pieces).toHaveLength(0);
  });

  it('Copy to all repeats the first group, and Undo takes the whole copy back', () => {
    let s = atFill();
    expect(run(s, { type: 'copyAll' }).feedback.key).toBe('copyNeedsFirst');
    s = run(s, pick('box', '+'), tap(0), tap(0), pick('counter', '-'), tap(0), { type: 'copyAll' });
    expect(s.groups.map((g) => g.pieces.length)).toEqual([3, 3, 3]);
    expect(s.feedback.key).toBe('copied');
    expect(s.groups[2].pieces).toEqual(s.groups[0].pieces);
    s = run(s, { type: 'undo' });
    expect(s.groups.map((g) => g.pieces.length)).toEqual([3, 0, 0]);
  });

  it('checks every group, naming the first one that is off, without counting the pieces for them', () => {
    let s = run(atFill(), pick('box', '+'), tap(0), tap(0), pick('counter', '-'), tap(0), { type: 'copyAll' });
    s = run(s, pick('box', '+'), tap(1));            // the second group now has an extra box
    s = run(s, check);
    expect(s).toMatchObject({ step: 'fill', feedback: { key: 'groupOff', params: { index: 1 }, bad: true }, tries: { fill: 1 } });
    expect(termGroupFeedbackText(s.feedback)).toBe('The second group isn’t (2x − 1) yet. Each group needs 2 boxes and 1 negative.');
    expect(run(atFill(), check).feedback.key).toBe('emptyGroup');
  });

  it('a wrong sign is wrong too (a box is not a negative box)', () => {
    let s = run(atFill(), pick('box', '-'), tap(0), tap(0), pick('counter', '-'), tap(0), { type: 'copyAll' }, check);
    expect(s.feedback.key).toBe('groupOff');
  });

  it('passes when every group is one group of B (in any order), and goes on', () => {
    const right = (s0) => run(s0, pick('counter', '-'), tap(0), pick('box', '+'), tap(0), tap(0), { type: 'copyAll' }, check);
    expect(right(atFill())).toMatchObject({ step: 'answer', skipped: ['flip'], feedback: { key: 'fillDone' } });
    const opp = run(atFill(OPP, '-'), pick('box', '+'), tap(0), pick('counter', '-'), tap(0), tap(0), tap(0), tap(0), { type: 'copyAll' }, check);
    expect(opp).toMatchObject({ step: 'flip', opposite: true, feedback: { key: 'fillDoneOpp' } });
  });

  it('fills a group by hand too, and stops a group at what it needs plus two', () => {
    const s = run(atFill(), pick('box', '+'), ...Array(8).fill(tap(0)));
    expect(s.groups[0].pieces).toHaveLength(maxInGroup(WHOLE));
    expect(s.feedback.key).toBe('groupFull');
  });

  it('nothing else works in Fill', () => {
    const s = atFill();
    for (const a of [add, { type: 'digit', digit: 1 }, sign('-')]) expect(reduce(s, a)).toBe(s);
  });
});

describe('Groups of Terms session: Fill, fraction bar (deal one kind at a time)', () => {
  const atDeal = () => atFill(FRACTION, '+');

  it('deals into the lit-up part, top to bottom and around', () => {
    let s = run(atDeal(), pick('box', '+'));
    expect(nextPart(s)).toBe(0);
    s = run(s, tap(0));
    expect(nextPart(s)).toBe(1);
    expect(run(s, tap(0)).feedback.key).toBe('dealHere');
    s = run(s, tap(1), tap(0));
    expect(nextPart(s)).toBe(1);
    expect(s.groups.map((g) => g.pieces.length)).toEqual([2, 1]);
  });

  it('finishes one kind before the other, either order, and says so without a wrong try', () => {
    let s = run(atDeal(), pick('box', '+'), tap(0));
    expect(kindInProgress(s)).toBe('box');
    s = run(s, pick('counter', '+'), tap(0));
    expect(s.feedback.key).toBe('finishKind');
    expect(s.tries).toEqual({});
    expect(s.groups[0].pieces).toHaveLength(1);
    s = run(s, pick('box', '+'), tap(1), tap(0), tap(1));                    // all 4 boxes dealt
    expect(kindInProgress(s)).toBeNull();
    expect(nextPart(run(s, pick('counter', '+')))).toBe(0);                    // counters start at the top again
    const counters = run(atDeal(), pick('counter', '+'), tap(0), tap(1), tap(0), tap(1), tap(0), tap(1), pick('box', '+'), tap(0));
    expect(counters.feedback.key).not.toBe('finishKind');
  });

  it('passes when all of B is dealt equally, and checks every way it can be off', () => {
    const deal = (s, type, signV, times) => {
      let t = run(s, pick(type, signV));
      for (let i = 0; i < times; i++) t = run(t, tap(i % 2));
      return t;
    };
    let s = deal(deal(atDeal(), 'box', '+', 4), 'counter', '+', 6);
    s = run(s, check);
    expect(s).toMatchObject({ step: 'take', feedback: { key: 'dealDone' } });
    const short = run(deal(atDeal(), 'box', '+', 4), check);
    expect(short.feedback).toMatchObject({ key: 'dealOff', bad: true });
    expect(termGroupFeedbackText(short.feedback)).toBe('Deal out all of (4x + 6): 4 boxes and 6 positives, one kind at a time.');
    const wrongSign = run(deal(deal(atDeal(), 'box', '-', 4), 'counter', '+', 6), check);
    expect(wrongSign.feedback.key).toBe('dealOff');
    expect(run(atDeal(), check).feedback.key).toBe('dealOff');
  });

  it('has no Copy to all', () => {
    const s = run(atDeal(), pick('box', '+'), tap(0));
    expect(reduce(s, { type: 'copyAll' })).toBe(s);
  });
});

describe('Groups of Terms moves', () => {
  it('words B for the messages', () => {
    expect(describeB(WHOLE)).toBe('2 boxes and 1 negative');
    expect(describeB(FRACTION)).toBe('4 boxes and 6 positives');
    expect(describeB(makeTermGroups({ n: 2 }, [n(5), x(-1)]))).toBe('5 positives and 1 negative box');
  });

  it('accepts a group in any order', () => {
    const pieces = piecesOfGroup(WHOLE).reverse();
    expect(validateGroup(WHOLE, pieces).ok).toBe(true);
    expect(validateFill(WHOLE, [{ pieces }, { pieces }]).feedbackKey).toBe('fillDone');
  });

  it('plays every generated problem through Fill (whole by Copy to all, fractions by dealing)', () => {
    for (let level = 1; level <= 8; level++) {
      for (const p of generateTermGroupsLevel(level, 77)) {
        const fraction = p.count.d > 1;
        let s = run(newTermGroupSession(p), ...(p.hidden1 ? [{ type: 'digit', digit: 1 }, check] : []));
        s = run(s, ...Array(fraction ? p.count.d : p.count.n).fill(add), check, sign(p.count.neg ? '-' : '+'));
        expect(s.step, `${level}`).toBe('fill');
        if (fraction) {
          for (const type of ['counter', 'box']) {
            const kind = piecesOfGroup(p).filter((q) => q.type === type);
            s = run(s, pick(type, kind[0].sign));
            for (let i = 0; i < kind.length; i++) s = run(s, tap(i % p.count.d));
          }
        } else {
          for (const q of piecesOfGroup(p)) s = run(s, pick(q.type, q.sign), tap(0));
          s = run(s, { type: 'copyAll' });
        }
        s = run(s, check);
        expect(s.step, `${level}: ${JSON.stringify(s.feedback)}`).not.toBe('fill');
      }
    }
  });
});

describe('Groups of Terms session: Take and Flip', () => {
  const dealAll = (s0, p) => {
    let s = s0;
    for (const type of ['counter', 'box']) {
      const kind = piecesOfGroup(p).filter((q) => q.type === type);
      s = run(s, pick(type, kind[0].sign));
      for (let i = 0; i < kind.length; i++) s = run(s, tap(i % p.count.d));
    }
    return s;
  };
  const fillWhole = (s0, p) => {
    let s = s0;
    for (const q of piecesOfGroup(p)) s = run(s, pick(q.type, q.sign), tap(0));
    return run(s, { type: 'copyAll' }, check);
  };
  const NEG_FRACTION = makeTermGroups({ neg: true, n: 2, d: 3 }, [x(3), n(-6)]);        // −2/3(3x − 6)

  it('takes parts of a fraction: tap to take, tap again to put back, exactly n', () => {
    let s = dealAll(atFill(NEG_FRACTION, '-'), NEG_FRACTION);
    s = run(s, check);
    expect(s.step).toBe('take');
    s = run(s, tap(0), tap(0), tap(1));
    expect(s.groups.map((g) => g.taken)).toEqual([false, true, false]);
    s = run(s, check);
    expect(s).toMatchObject({ step: 'take', feedback: { key: 'takeN', bad: true }, tries: { take: 1 } });
    s = run(s, tap(2), check);
    expect(s).toMatchObject({ step: 'flip', feedback: { key: 'takeDoneOpp' } });
  });

  it('a + fraction skips Flip after Take', () => {
    let s = dealAll(atFill(FRACTION, '+'), FRACTION);
    s = run(s, check, tap(1), check);
    expect(s).toMatchObject({ step: 'answer', skipped: ['flip'], feedback: { key: 'takeDone' } });
  });

  it('flips − groups one at a time, or all at once, and goes on when every group has flipped', () => {
    let s = fillWhole(atFill(OPP, '-'), OPP);
    expect(s.step).toBe('flip');
    s = run(s, { type: 'flipGroup', index: 0 });
    expect(s).toMatchObject({ step: 'flip', feedback: { key: 'flipMore' } });
    expect(s.groups.map((g) => g.flipped)).toEqual([true, false]);
    expect(run(s, { type: 'flipGroup', index: 0 })).toBe(s);                        // already flipped: nothing
    s = run(s, tap(1));                                                              // tapping the group flips it too
    expect(s).toMatchObject({ step: 'answer', feedback: { key: 'flipDone' } });
    const all = run(fillWhole(atFill(OPP, '-'), OPP), { type: 'flipAll' });
    expect(all).toMatchObject({ step: 'answer' });
    expect(all.groups.every((g) => g.flipped)).toBe(true);
  });

  it('the one − on a fraction bar flips the parts taken, and only those', () => {
    let s = dealAll(atFill(NEG_FRACTION, '-'), NEG_FRACTION);
    s = run(s, check, tap(0), tap(2), check);
    s = run(s, { type: 'flipGroup', index: 0 });
    expect(s.step).toBe('answer');
    expect(s.groups.map((g) => g.flipped)).toEqual([true, false, true]);
  });

  it('keeps the original pieces when a group is flipped (the view draws the opposite)', () => {
    const s = run(fillWhole(atFill(OPP, '-'), OPP), { type: 'flipAll' });
    expect(s.groups[0].pieces).toEqual(piecesOfGroup(OPP));
  });

  it('check in Flip says how to flip, and nothing but flips works there', () => {
    const s = fillWhole(atFill(OPP, '-'), OPP);
    expect(run(s, check).feedback.key).toBe('tapFlip');
    expect(reduce(s, add)).toBe(s);
    expect(reduce(s, pick('box', '+'))).toBe(s);
  });
});

describe('Groups of Terms session: Answer and Check it', () => {
  const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));
  const toAnswer = (p) => {
    const fraction = p.count.d > 1;
    let s = run(newTermGroupSession(p), ...(p.hidden1 ? [{ type: 'digit', digit: 1 }, check] : []));
    s = run(s, ...Array(fraction ? p.count.d : p.count.n).fill(add), check, sign(p.count.neg ? '-' : '+'));
    if (fraction) {
      for (const type of ['counter', 'box']) {
        const kind = piecesOfGroup(p).filter((q) => q.type === type);
        s = run(s, pick(type, kind[0].sign));
        for (let i = 0; i < kind.length; i++) s = run(s, tap(i % p.count.d));
      }
      s = run(s, check);
      for (let i = 0; i < p.count.n; i++) s = run(s, tap(i));
      s = run(s, check);
    } else {
      for (const q of piecesOfGroup(p)) s = run(s, pick(q.type, q.sign), tap(0));
      s = run(s, { type: 'copyAll' }, check);
    }
    if (s.step === 'flip') s = run(s, { type: 'flipAll' }, ...(fraction ? [{ type: 'flipGroup', index: 0 }] : []));
    return s;
  };

  it('types the answer with the pad and keys, and takes it back with Backspace', () => {
    let s = toAnswer(WHOLE);
    expect(s.step).toBe('answer');
    s = run(s, ...typed('6x+3'), { type: 'backspace' }, ...typed('-3'));
    expect(s.typed).toBe('6x+-3');
    s = run(s, { type: 'backspace' }, { type: 'backspace' }, ...typed('3'));
    expect(s.typed).toBe('6x+3');
  });

  it('accepts the right answer in either order, as x or 1x, and goes to Check it', () => {
    for (const [p, text, shown] of [[WHOLE, '6x-3', '6x − 3'], [WHOLE, '-3+6x', '−3 + 6x'], [OPP, '-2x+8', '−2x + 8'], [FRACTION, '2x+3', '2x + 3']]) {
      const s = run(toAnswer(p), ...typed(text), check);
      expect(s, text).toMatchObject({ step: 'checkit', finalText: shown, feedback: { key: 'correct' } });
    }
    const one = run(toAnswer(makeTermGroups({ n: 1, d: 2 }, [x(2), n(4)])), ...typed('1x+2'), check);   // 1/2(2x + 4) = x + 2
    expect(one.step).toBe('checkit');
  });

  it('says what is wrong without giving the number', () => {
    const wrongTry = (t) => run(toAnswer(WHOLE), ...typed(t), check);
    expect(wrongTry('').feedback.key).toBe('typeAnswer');
    expect(wrongTry('').tries.answer ?? 0).toBe(0);
    expect(wrongTry('6x+').feedback.key).toBe('answerUnreadable');
    expect(wrongTry('6x+3-6').feedback.key).toBe('combineAll');
    expect(wrongTry('6x+0').feedback.key).toBe('noZeroTerm');
    expect(wrongTry('3x-3').feedback.key).toBe('checkBoxes');
    expect(wrongTry('6x+3').feedback.key).toBe('checkNumbers');
    expect(wrongTry('6x+3').tries.answer).toBe(1);
    expect(termGroupFeedbackText(wrongTry('6x+3').feedback)).toMatch(/numbers/);
  });

  it('stops typing at 12 characters, ignores other characters, and the pad only works in Answer', () => {
    const s = run(toAnswer(WHOLE), ...typed('1234567890123456'));
    expect(s.typed).toHaveLength(12);
    expect(reduce(s, { type: 'typeChar', ch: 'q' })).toBe(s);
    const early = atFill();
    expect(reduce(early, { type: 'typeChar', ch: 'x' })).toBe(early);
  });

  it('Check it is the last step: nothing changes it', () => {
    const s = run(toAnswer(WHOLE), ...typed('6x-3'), check);
    for (const a of [add, check, { type: 'digit', digit: 1 }, { type: 'undo' }]) expect(reduce(s, a)).toBe(s);
  });

  it('plays every generated problem to Check it with the right answer', () => {
    for (let level = 1; level <= 8; level++) {
      for (const p of generateTermGroupsLevel(level, 31)) {
        const s = run(toAnswer(p), ...typed(answerText(p).replace(/\s/g, '').replace(/−/g, '-')), check);
        expect(s.step, `${level} ${answerText(p)}`).toBe('checkit');
      }
    }
  });
});
