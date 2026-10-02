import { describe, it, expect } from 'vitest';
import { newTermSession, reduceTerms as reduce, termSteps, isIntegers, hasRewrite, rewritable } from '../src/engine/termSession.js';
import { needsRewrite, makeExpression, effective } from '../src/engine/terms.js';
import { validateAnswer } from '../src/engine/termMoves.js';
import { termHintFor } from '../src/engine/termHints.js';
import { intTerm, total, sumExpression } from '../src/engine/combine.js';
import { generateCombineLevel, generateFlipMixed } from '../src/engine/generateCombine.js';
import { integerFeedbackText } from '../src/view/integerFeedback.js';
import { combineit } from '../src/packs/combineit.js';
import { flipit } from '../src/packs/flipit.js';
import { piecesFor } from '../src/engine/termPieces.js';

const run = (s, ...a) => a.reduce(reduce, s);
const pick = (sign) => ({ type: 'pickPiece', pieceType: 'counter', sign });
const zone = (term) => ({ type: 'tapZone', term });
const piece = (term, index) => ({ type: 'tapPiece', term, index });
const check = { type: 'check' };
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'typeChar', ch }));

const sum = (values) => ({ ...sumExpression(values), mode: 'integers' });
const mixed = (...terms) => ({ ...makeExpression(terms.map(([op, v]) => intTerm(op, v, op === '-'))), mode: 'integers-flip' });

// Draw every term's counters the way a student would.
function draw(s) {
  let t = s;
  s.problem.terms.forEach((term, i) => {
    const e = effective(term);
    t = run(t, pick(e < 0 ? '-' : '+'), ...Array(Math.abs(e)).fill(zone(i)));
  });
  return run(t, check);
}

// Cancel every + with a −, in reading order.
function cancelAll(s) {
  let t = s;
  for (;;) {
    const all = t.pieces.flatMap((col, term) => col.map((p, index) => ({ term, index, p }))).filter((x) => !x.p.canceled);
    const plus = all.find((x) => x.p.sign === '+');
    const minus = all.find((x) => x.p.sign === '-');
    if (t.step !== 'cancel' || !plus || !minus) return t;
    t = run(t, piece(plus.term, plus.index), piece(minus.term, minus.index));
  }
}

describe('integer problems on the term steps', () => {
  it('Combine it Level 3 starts at Draw and has no Box & Circle or Rewrite', () => {
    const p = sum([5, -8, 2]);
    expect(isIntegers(p)).toBe(true);
    expect(hasRewrite(p)).toBe(false);
    expect(termSteps(p).map((t) => t.id)).toEqual(['draw', 'cancel', 'answer']);
    expect(newTermSession(p)).toMatchObject({ step: 'draw', feedback: { key: 'drawIntro' } });
    expect(integerFeedbackText(newTermSession(p).feedback)).toMatch(/Pick \+ or −/);
  });

  it('Flip It Level 5 starts at Rewrite, and goes on to Draw (not Box & Circle)', () => {
    const p = mixed(['+', 5], ['-', -3], ['+', -7]);
    expect(hasRewrite(p)).toBe(true);
    expect(termSteps(p).map((t) => t.id)).toEqual(['rewrite', 'draw', 'cancel', 'answer']);
    const s = run(newTermSession(p), { type: 'flip', term: 1, part: 'op' }, { type: 'flip', term: 1, part: 'num' });
    expect(s).toMatchObject({ step: 'draw', feedback: { key: 'rewriteDone' } });
    const none = mixed(['+', 5], ['+', -3]);
    expect(run(newTermSession(none), { type: 'nothingToRewrite' }).step).toBe('draw');
  });

  it('every subtraction is flipped in Flip It Level 5, `− 2` as well as `− (−3)`', () => {
    const p = mixed(['+', 5], ['-', -3], ['+', -7], ['-', 2]);
    expect(p.terms.map(needsRewrite)).toEqual([false, true, false, true]);
    expect(rewritable(p)).toEqual([1, 3]);
    // Boxes & Circles' own terms are unchanged: only `− (−7)` flips there.
    expect(needsRewrite({ kind: 'x', op: '-', value: 4 })).toBe(false);
    expect(needsRewrite({ kind: 'int', op: '-', value: -7 })).toBe(true);
    let s = newTermSession(p);
    s = run(s, { type: 'flip', term: 3, part: 'op' });
    expect(s).toMatchObject({ step: 'rewrite', feedback: { key: 'flipBoth' } });
    s = run(s, { type: 'flip', term: 3, part: 'num' }, { type: 'flip', term: 1, part: 'num' }, { type: 'flip', term: 1, part: 'op' });
    expect(s.step).toBe('draw');
    // Tapping a term that is added is a wrong try.
    expect(run(newTermSession(p), { type: 'flip', term: 0, part: 'num' })).toMatchObject({ tries: { rewrite: 1 }, feedback: { key: 'notNegative', bad: true } });
  });

  it('the pieces of a subtracted term are the opposite (magenta), with the sign it is worth', () => {
    const p = mixed(['+', 5], ['-', -3], ['-', 2]);
    expect(piecesFor(p.terms[1])).toEqual(Array(3).fill({ type: 'counter', sign: '+', canceled: false, opposite: true }));
    expect(piecesFor(p.terms[2])).toEqual(Array(2).fill({ type: 'counter', sign: '-', canceled: false, opposite: true }));
    expect(piecesFor(p.terms[0])[0].opposite).toBe(false);
  });

  it('Draw counts counters of the right sign for each term, Cancel pairs them, and the answer is one number', () => {
    const p = sum([5, -8, 2]);
    let s = draw(newTermSession(p));
    expect(s).toMatchObject({ step: 'cancel', feedback: { key: 'drawDone' } });
    s = cancelAll(s);
    expect(s.step).toBe('answer');
    s = run(s, ...typed('-1'), check);
    expect(s).toMatchObject({ step: 'done', finalText: '−1', feedback: { key: 'correct', params: { answer: '−1' } } });
  });

  it('a wrong draw says what the term needs', () => {
    const s = run(newTermSession(sum([5, -8, 2])), pick('+'), zone(0), check);
    expect(s.feedback.key).toBe('countAgain');
    const empty = run(newTermSession(sum([5, -8, 2])), check);
    expect(empty.feedback).toMatchObject({ key: 'needPieces', params: { phrase: '5 positives' } });
  });

  it('checks the answer as a number, and a total of zero is typed as 0', () => {
    expect(validateAnswer(sum([5, -8, 2]), '-1').ok).toBe(true);
    expect(validateAnswer(sum([5, -8, 2]), '1').feedbackKey).toBe('checkNumbers');
    expect(validateAnswer(sum([5, -8, 2]), '').feedbackKey).toBe('typeAnswer');
    expect(validateAnswer(sum([5, -8, 2]), '5-').feedbackKey).toBe('answerUnreadable');
    expect(validateAnswer(sum([5, -8, 2]), '1+2').feedbackKey).toBe('combineAll');
    expect(validateAnswer(sum([5, -8, 2]), '0').feedbackKey).toBe('noZeroTerm');
    const zero = mixed(['+', 5], ['-', 5], ['+', 3], ['-', 3]);
    expect(total(zero)).toBe(0);
    expect(validateAnswer(zero, '0')).toMatchObject({ ok: true, params: { answer: '0' } });
    expect(validateAnswer(zero, '-0').ok).toBe(true);
    expect(validateAnswer(zero, '1').feedbackKey).toBe('checkNumbers');
    expect(validateAnswer(zero, '').feedbackKey).toBe('typeAnswer');
  });

  it('plays a problem that comes to zero: everything cancels and the answer is 0', () => {
    const p = mixed(['+', 5], ['-', 5]);
    let s = run(newTermSession(p), { type: 'flip', term: 1, part: 'op' }, { type: 'flip', term: 1, part: 'num' });
    s = cancelAll(draw(s));
    expect(s.step).toBe('answer');
    expect(run(s, ...typed('0'), check)).toMatchObject({ step: 'done', finalText: '0' });
  });

  it('names the sign left in the answer hint, never the count', () => {
    let s = cancelAll(draw(newTermSession(sum([5, -8, 2]))));
    for (let i = 0; i < 3; i++) s = run(s, ...typed('4'), check, { type: 'backspace' });
    const hint = termHintFor(s);
    expect(hint).toMatchObject({ key: 'hintAnswer', params: { x: null, n: '-' } });
    const text = integerFeedbackText(hint);
    expect(text).toMatch(/negative/);
    expect(text).not.toMatch(/\d/);
  });

  it('plays every generated problem of both levels through to done', () => {
    const problems = [
      ...[1, 7, 99].flatMap((seed) => combineit.generate(3, seed)),
      ...[1, 7, 99].flatMap((seed) => flipit.generate(5, seed)),
    ];
    for (const p of problems) {
      let s = newTermSession(p);
      expect(s.step).toBe(hasRewrite(p) ? 'rewrite' : 'draw');
      if (s.step === 'rewrite') {
        s = rewritable(p).length === 0 ? run(s, { type: 'nothingToRewrite' })
          : run(s, ...rewritable(p).flatMap((t) => [{ type: 'flip', term: t, part: 'op' }, { type: 'flip', term: t, part: 'num' }]));
      }
      s = cancelAll(draw(s));
      const want = String(total(p)).replace('-', '-');
      s = run(s, ...typed(want), check);
      expect(s.step, JSON.stringify(p)).toBe('done');
    }
  });

  it('the packs hand out integer problems with the right mode', () => {
    expect(combineit.generate(3, 5).every((p) => p.mode === 'integers')).toBe(true);
    expect(combineit.generate(1, 5)[0].mode).toBeUndefined();
    expect(flipit.generate(5, 5).every((p) => p.mode === 'integers-flip')).toBe(true);
    expect(flipit.levels).toBe(5);
    expect(flipit.levelNames).toHaveLength(5);
    expect(generateFlipMixed(5).flatMap((p) => p.terms).filter((t) => t.op === '-').every((t) => t.flip === true)).toBe(true);
    expect(generateCombineLevel(3, 5).length).toBe(5);
  });
});

describe('the ± button on integer answers', () => {
  const atAnswer = () => {
    const t = cancelAll(draw(newTermSession(sum([5, -8, 2]))));
    expect(t.step).toBe('answer');
    return t;
  };

  it('flips a leading minus on what is typed, so ± then 1 reads −1', () => {
    let s = atAnswer();
    s = run(s, { type: 'toggleSign' }, ...typed('1'));
    expect(s.entry).toBe('-1');
    s = run(s, { type: 'toggleSign' });
    expect(s.entry).toBe('1');
    s = run(s, { type: 'toggleSign' });
    expect(s.entry).toBe('-1');
  });

  it('does nothing outside the answer step, or on algebra problems', () => {
    const early = newTermSession(sum([5, -8, 2]));
    expect(reduce(early, { type: 'toggleSign' })).toBe(early);
    const algebra = { ...makeExpression([{ kind: 'x', op: '+', value: 2 }, { kind: 'int', op: '+', value: 3 }]), level: 1 };
    const s = newTermSession(algebra);
    expect(reduce({ ...s, step: 'answer' }, { type: 'toggleSign' })).toMatchObject({ entry: '' });
  });
});

