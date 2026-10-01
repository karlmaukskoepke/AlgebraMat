import { describe, it, expect } from 'vitest';
import {
  newBigSession, reduceBig as reduce, bigSteps, meetingNumbers, rightChoice, rightOp, rightSign, bigAnswer, hasCombine, isBig,
} from '../src/engine/bigSession.js';
import { bigHintFor } from '../src/engine/bigHints.js';
import { bigFeedbackText } from '../src/view/bigFeedback.js';
import { bigNotes, bigViewState } from '../src/play/bigPlay.js';
import { sumExpression } from '../src/engine/combine.js';
import { combineit } from '../src/packs/combineit.js';
import { termParts } from '../src/engine/terms.js';
import { viewFor, exprLayout } from '../src/view/boxLayout.js';

const big = (...values) => ({ ...sumExpression(values), mode: 'integers-big' });
const run = (s, ...a) => a.reduce(reduce, s);
const check = { type: 'check' };
const choose = (c) => ({ type: 'choose', choice: c });
const op = (o) => ({ type: 'chooseOp', op: o });
const sign = (v) => ({ type: 'chooseSign', sign: v });
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));

// Circle every term with its operation: parts are [n0] [op1][n1] [op2][n2]...
function circleAll(s) {
  const parts = termParts(s.problem);
  let t = s;
  for (let term = 0; term < s.problem.terms.length; term++) {
    const idx = parts.map((p, i) => (p.term === term ? i : -1)).filter((i) => i >= 0);
    t = run(t, { type: 'drawShape', from: idx[0], to: idx.at(-1) });
  }
  return run(t, check);
}

describe('Combine it Level 4: two terms', () => {
  const P = big(-23, 41);                                                            // −23 + 41 = 18, a battle

  it('has the steps, and starts with circles only (no tool to pick)', () => {
    expect(isBig(P)).toBe(true);
    expect(bigSteps(P).map((t) => t.id)).toEqual(['boxcircle', 'partyBattle', 'addSub', 'sign', 'answer']);
    expect(bigSteps(P).map((t) => t.label)).toEqual(['Circle', 'Party or Battle?', 'Add or Subtract?', 'Sign', 'Answer']);
    expect(newBigSession(P)).toMatchObject({ step: 'boxcircle', tool: 'circle', feedback: { key: 'bigCircleIntro' } });
  });

  it('circles each term with its sign (Boxes & Circles\' checks), then asks party or battle', () => {
    let s = newBigSession(P);
    s = run(s, { type: 'drawShape', from: 0, to: 0 }, check);
    expect(s.feedback.key).toBe('circleMissing');
    s = run(s, { type: 'drawShape', from: 2, to: 2 }, check);                          // just the 41, not the + in front
    expect(s).toMatchObject({ step: 'boxcircle', feedback: { key: 'includeSign', bad: true }, tries: { boxcircle: 2 } });
    s = run(s, { type: 'drawShape', from: 1, to: 2 }, check);
    expect(s).toMatchObject({ step: 'partyBattle', feedback: { key: 'bigPartyIntro' } });
  });

  it('walks through battle, subtract, the sign of the bigger value, and the typed answer', () => {
    let s = circleAll(newBigSession(P));
    expect(rightChoice(P)).toBe('battle');
    expect(rightOp(P)).toBe('subtract');
    expect(rightSign(P)).toBe('+');                                                    // 41 is bigger and positive
    s = run(s, choose('party'));
    expect(s).toMatchObject({ step: 'partyBattle', feedback: { key: 'sameOrDifferent', bad: true }, tries: { partyBattle: 1 } });
    s = run(s, choose('battle'));
    expect(s).toMatchObject({ step: 'addSub', choice: 'battle', feedback: { key: 'bigBattleOk' } });
    s = run(s, op('add'));
    expect(s.feedback).toMatchObject({ key: 'bigOpOff', params: { choice: 'battle' }, bad: true });
    s = run(s, op('subtract'));
    expect(s).toMatchObject({ step: 'sign', op: 'subtract' });
    s = run(s, sign('-'));
    expect(s.feedback).toMatchObject({ key: 'bigSignOff', bad: true });
    s = run(s, sign('+'));
    expect(s).toMatchObject({ step: 'answer', sign: '+', feedback: { key: 'bigAnswerIntro' } });
    s = run(s, ...typed('18'), check);
    expect(s).toMatchObject({ step: 'done', finalText: '18', feedback: { key: 'correct', params: { answer: '18' } } });
  });

  it('a party adds and keeps the shared sign, and the answer is typed with it', () => {
    const Q = big(-48, -19);
    expect(rightChoice(Q)).toBe('party');
    expect(rightOp(Q)).toBe('add');
    expect(rightSign(Q)).toBe('-');
    let s = run(circleAll(newBigSession(Q)), choose('party'), op('add'), sign('-'));
    expect(s.step).toBe('answer');
    s = run(s, ...typed('67'), check);                                                 // forgot the −
    expect(s).toMatchObject({ step: 'answer', feedback: { key: 'bigAnswerSign', params: { sign: '-' }, bad: true } });
    expect(bigFeedbackText(s.feedback)).toBe('The size is right! Now the sign: you found negative, so the answer is negative.');
    s = run(s, { type: 'backspace' }, { type: 'backspace' }, ...typed('-67'), check);
    expect(s).toMatchObject({ step: 'done', finalText: '−67' });
  });

  it('a wrong size says to redo the operation, never the number', () => {
    let s = run(circleAll(newBigSession(P)), choose('battle'), op('subtract'), sign('+'), ...typed('64'), check);
    expect(s.feedback).toMatchObject({ key: 'bigAnswerSize', params: { op: 'subtract' } });
    expect(bigFeedbackText(s.feedback)).not.toMatch(/18/);
    expect(run(circleAll(newBigSession(P)), choose('battle'), op('subtract'), sign('+'), check).feedback.key).toBe('typeAnswer');
    expect(run(circleAll(newBigSession(P)), choose('battle'), op('subtract'), sign('+'), ...typed('-'), check).feedback.key).toBe('answerUnreadable');
  });

  it('the pad types digits and a −, up to 5 characters, only while Combine or Answer is open', () => {
    let s = run(circleAll(newBigSession(P)), choose('battle'), op('subtract'), sign('+'));
    s = run(s, ...typed('123456789'));
    expect(s.entry).toHaveLength(5);
    expect(reduce(s, { type: 'typeChar', ch: 'x' })).toBe(s);
    const early = newBigSession(P);
    expect(reduce(early, { type: 'digit', digit: 1 })).toBe(early);
  });

  it('nothing from a later step works early, and Undo takes back the latest circle', () => {
    let s = newBigSession(P);
    for (const a of [choose('battle'), op('add'), sign('+'), { type: 'tapTerm', term: 0 }]) expect(reduce(s, a)).toBe(s);
    s = run(s, { type: 'drawShape', from: 0, to: 0 }, { type: 'undo' });
    expect(s.shapes).toEqual([]);
  });
});

describe('Combine it Level 4: three terms', () => {
  const T = big(-23, 41, -15);                                                       // −23 and −15 share a sign: −38, then 41 − 38 = 3

  it('has a Combine step after Circle', () => {
    expect(hasCombine(T)).toBe(true);
    expect(bigSteps(T).map((t) => t.id)).toEqual(['boxcircle', 'combine', 'partyBattle', 'addSub', 'sign', 'answer']);
    expect(circleAll(newBigSession(T))).toMatchObject({ step: 'combine', feedback: { key: 'bigCombineIntro' } });
    expect(meetingNumbers(T)).toMatchObject({ a: -38, b: 41, pair: [0, 2], other: 1, partial: -38 });
  });

  it('taps the two that share a sign (a third tap is refused, a repeat tap puts one back), then types what they make', () => {
    let s = circleAll(newBigSession(T));
    s = run(s, { type: 'tapTerm', term: 2 }, { type: 'tapTerm', term: 0 });
    expect(s.picked).toEqual([0, 2]);
    expect(run(s, { type: 'tapTerm', term: 1 }).feedback.key).toBe('twoOnly');
    expect(run(s, { type: 'tapTerm', term: 2 }).picked).toEqual([0]);
    expect(run(circleAll(newBigSession(T)), check).feedback.key).toBe('pickTwo');
    const wrongPair = run(circleAll(newBigSession(T)), { type: 'tapTerm', term: 0 }, { type: 'tapTerm', term: 1 }, check);
    expect(wrongPair).toMatchObject({ step: 'combine', feedback: { key: 'wrongPair', bad: true }, tries: { combine: 1 } });
    expect(run(s, check).feedback.key).toBe('typeCombine');
    expect(run(s, ...typed('38'), check).feedback).toMatchObject({ key: 'combineOff', bad: true });
    s = run(s, ...typed('-38'), check);
    expect(s).toMatchObject({ step: 'partyBattle', entry: '', feedback: { key: 'combineDone' } });
  });

  it('then it is a battle of −38 against 41: subtract, and the winner is positive', () => {
    expect(rightChoice(T)).toBe('battle');
    expect(rightSign(T)).toBe('+');
    let s = run(circleAll(newBigSession(T)), { type: 'tapTerm', term: 0 }, { type: 'tapTerm', term: 2 }, ...typed('-38'), check);
    s = run(s, choose('battle'), op('subtract'), sign('+'), ...typed('3'), check);
    expect(s).toMatchObject({ step: 'done', finalText: '3' });
    expect(bigAnswer(T)).toBe(3);
  });

  it('shows what it has worked out, a line a step', () => {
    let s = run(circleAll(newBigSession(T)), { type: 'tapTerm', term: 0 }, { type: 'tapTerm', term: 2 }, ...typed('-3'));
    expect(bigNotes(s)).toEqual(['−23 + (−15) = −3']);
    s = run(s, { type: 'backspace' }, ...typed('38'), check);
    expect(bigNotes(s)).toEqual(['−23 + (−15) = −38']);
    s = run(s, choose('battle'), op('subtract'), sign('+'));
    expect(bigNotes(s)).toEqual(['−23 + (−15) = −38', 'battle', 'subtract: 41 − 38', 'sign: +']);
  });

  it('the Mat has no counters, so it makes room for the notes, not for pieces', () => {
    expect(viewFor(T).y).toBeGreaterThan(0);
    const layout = exprLayout(T);
    expect(layout.width).toBeLessThan(700);
    const view = bigViewState(run(circleAll(newBigSession(T)), { type: 'tapTerm', term: 0 }));
    expect(view).toMatchObject({ tap: 'terms', picked: [0], key: false });
  });
});

describe('Combine it Level 4 hints', () => {
  const P = big(-23, 41);
  const wrongTimes = (s, k, a) => { for (let i = 0; i < k; i++) s = reduce(s, a); return s; };

  it('wait for three wrong tries, then show the move', () => {
    expect(bigHintFor(newBigSession(P))).toBeNull();
    expect(bigHintFor(wrongTimes(newBigSession(P), 2, check))).toBeNull();
    const circle = bigHintFor(wrongTimes(newBigSession(P), 3, check));
    expect(circle).toMatchObject({ key: 'hintBigCircle', show: { terms: [0, 1] } });
    let s = circleAll(newBigSession(P));
    expect(bigHintFor(wrongTimes(s, 3, choose('party')))).toMatchObject({ key: 'hintBigPartyBattle', params: { a: -23, b: 41, same: false } });
    s = run(s, choose('battle'));
    expect(bigHintFor(wrongTimes(s, 3, op('add')))).toMatchObject({ key: 'hintBigAddSub', params: { choice: 'battle' } });
    s = run(s, op('subtract'));
    const sg = bigHintFor(wrongTimes(s, 3, sign('-')));
    expect(sg).toMatchObject({ key: 'hintBigSign', show: { terms: [1] } });          // 41 is the bigger value
    expect(bigFeedbackText(sg)).toMatch(/bigger one/);
  });

  it('Combine blinks the pair, and the answer hint names the sign, never the number', () => {
    const T = big(-23, 41, -15);
    let s = circleAll(newBigSession(T));
    expect(bigHintFor(wrongTimes(s, 3, check)) ?? null).toBeNull();                  // an unpicked Check isn't a wrong try
    s = run(s, { type: 'tapTerm', term: 0 }, { type: 'tapTerm', term: 1 });
    expect(bigHintFor(wrongTimes(s, 3, check))).toMatchObject({ key: 'hintCombine', show: { terms: [0, 2] } });
    let a = run(circleAll(newBigSession(P)), choose('battle'), op('subtract'), sign('+'));
    a = wrongTimes(a, 3, check);
    a = run(a, ...typed('9'), check, check, check);
    const hint = bigHintFor(a);
    expect(hint).toMatchObject({ key: 'hintBigAnswer', params: { op: 'subtract', sign: '+' } });
    expect(bigFeedbackText(hint)).not.toMatch(/18/);
  });

  it('every message has words', () => {
    for (const key of ['bigCircleIntro', 'bigCombineIntro', 'twoOnly', 'pickTwo', 'wrongPair', 'typeCombine', 'combineOff', 'combineDone', 'hintCombine',
      'bigPartyIntro', 'bigPartyOk', 'bigBattleOk', 'bigSignParty', 'bigSignBattle', 'bigAnswerIntro', 'typeAnswer', 'answerUnreadable', 'sameOrDifferent']) {
      expect(bigFeedbackText({ key, params: {} }), key).toMatch(/\w/);
    }
  });
});

describe('Combine it Level 4 problems', () => {
  it('the pack hands out big problems with the right mode, and each plays through the steps', () => {
    expect(combineit.levels).toBe(4);
    expect(combineit.levelNames).toHaveLength(4);
    for (const seed of [1, 7, 99, 20260930]) {
      for (const p of combineit.generate(4, seed)) {
        expect(p.mode).toBe('integers-big');
        let s = circleAll(newBigSession(p));
        expect(s.step).toBe(hasCombine(p) ? 'combine' : 'partyBattle');
        if (hasCombine(p)) {
          const { pair, partial } = meetingNumbers(p);
          s = run(s, { type: 'tapTerm', term: pair[0] }, { type: 'tapTerm', term: pair[1] }, ...typed(String(partial)), check);
        }
        s = run(s, choose(rightChoice(p)), op(rightOp(p)), sign(rightSign(p)), ...typed(String(bigAnswer(p))), check);
        expect(s.step, JSON.stringify(p)).toBe('done');
      }
    }
  });
});
