import { describe, it, expect } from 'vitest';
import { makeTerm, makeExpression } from '../src/engine/terms.js';
import { newTermSession, reduceTerms } from '../src/engine/termSession.js';
import { termHintFor } from '../src/engine/termHints.js';
import { termFeedbackText } from '../src/view/termFeedback.js';

const x = (op, v) => makeTerm('x', op, v);
const n = (op, v) => makeTerm('int', op, v);
const EX = makeExpression([x('+', 3), n('-', 5), n('+', 7), x('-', 1)]);   // 3x − 5 + 7 − x
const SUBNEG = { ...makeExpression([x('+', 4), x('-', -2), n('+', 3)]), level: 4 };
const run = (s, ...a) => a.reduce(reduceTerms, s);
const tool = (t) => ({ type: 'pickTool', tool: t });
const draw = (from, to) => ({ type: 'drawShape', from, to });
const check = { type: 'check' };
const wrongTimes = (s, k, action = check) => { for (let i = 0; i < k; i++) s = reduceTerms(s, action); return s; };

describe('Boxes & Circles hints', () => {
  it('wait for three wrong tries on the step', () => {
    expect(termHintFor(newTermSession(EX))).toBeNull();
    expect(termHintFor(wrongTimes(newTermSession(EX), 2))).toBeNull();
    expect(termHintFor(wrongTimes(newTermSession(EX), 3))).toMatchObject({ key: 'hintBoxCircle' });
  });

  it('Box & Circle: blinks the terms not done yet', () => {
    let s = run(newTermSession(EX), tool('box'), draw(0, 0));                  // 3x boxed
    s = wrongTimes(s, 3);
    expect(termHintFor(s).show.terms).toEqual([1, 2, 3]);
    s = run(s, tool('circle'), draw(1, 2), draw(3, 4));                       // 3 and +7 done; −x not boxed
    expect(termHintFor(s).show.terms).toEqual([3]);
  });

  it('Rewrite: wiggles the unflipped signs, or pulses Nothing to rewrite', () => {
    let s = wrongTimes(newTermSession(SUBNEG), 3, { type: 'flip', term: 0, part: 'num' });
    expect(termHintFor(s)).toMatchObject({ key: 'hintRewrite', show: { parts: [1, 2] } });
    s = run(s, { type: 'flip', term: 1, part: 'op' });
    expect(termHintFor(s).show.parts).toEqual([2]);
    const plain = wrongTimes(newTermSession({ ...EX, level: 5 }), 3, { type: 'flip', term: 0, part: 'op' });
    expect(termHintFor(plain)).toMatchObject({ key: 'hintNothing', show: { button: 'nothingToRewrite' } });
  });

  const atDraw = () => run(newTermSession(EX), tool('box'), draw(0, 0), draw(5, 6), tool('circle'), draw(1, 2), draw(3, 4), check);

  it('Draw: ghosts for the terms that are off, and the piece button to pulse', () => {
    let s = wrongTimes(atDraw(), 3);
    const hint = termHintFor(s);
    expect(hint.show.ghosts.map((g) => [g.term, g.type, g.sign, g.count])).toEqual([[0, 'box', '+', 3], [1, 'counter', '-', 5], [2, 'counter', '+', 7], [3, 'box', '-', 1]]);
    expect(hint.show.button).toBe('pickPiece:box:+');
    s = run(s, { type: 'pickPiece', pieceType: 'box', sign: '+' }, ...Array(3).fill({ type: 'tapZone', term: 0 }));
    expect(termHintFor(s).show.ghosts.map((g) => g.term)).toEqual([1, 2, 3]);
  });

  const atCancel = () => {
    let s = atDraw();
    s = run(s, { type: 'pickPiece', pieceType: 'box', sign: '+' }, ...Array(3).fill({ type: 'tapZone', term: 0 }),
      { type: 'pickPiece', pieceType: 'box', sign: '-' }, { type: 'tapZone', term: 3 },
      { type: 'pickPiece', pieceType: 'counter', sign: '-' }, ...Array(5).fill({ type: 'tapZone', term: 1 }),
      { type: 'pickPiece', pieceType: 'counter', sign: '+' }, ...Array(7).fill({ type: 'tapZone', term: 2 }), check);
    return s;
  };

  it('Cancel: blinks a pair that cancels, and the match for a picked piece', () => {
    let s = atCancel();
    expect(s.step).toBe('cancel');
    s = wrongTimes(s, 3, { type: 'tapPiece', term: 0, index: 0 }); // picks, then tries the same one again: no wrong try
    s = { ...s, tries: { cancel: 3 }, selected: null };
    const pair = termHintFor(s).show.pieces;
    expect(pair).toHaveLength(2);
    const [a, b] = pair.map(({ term, index }) => s.pieces[term][index]);
    expect(a.type).toBe(b.type);
    expect(a.sign).not.toBe(b.sign);
    s = { ...s, selected: { term: 1, index: 0 } };
    const [first, second] = termHintFor(s).show.pieces;
    expect(first).toEqual({ term: 1, index: 0 });
    expect(s.pieces[second.term][second.index]).toMatchObject({ type: 'counter', sign: '+' });
  });

  it('Answer: blinks what is left and names the signs, not the counts', () => {
    let s = atCancel();
    for (const [a, b] of [[[0, 0], [3, 0]], ...[0, 1, 2, 3, 4].map((i) => [[1, i], [2, i]])]) {
      s = run(s, { type: 'tapPiece', term: a[0], index: a[1] }, { type: 'tapPiece', term: b[0], index: b[1] });
    }
    expect(s.step).toBe('answer');
    s = wrongTimes(s, 3, { type: 'digit', digit: 1 });
    s = wrongTimes({ ...s, entry: '9' }, 3);
    const hint = termHintFor(s);
    expect(hint).toMatchObject({ key: 'hintAnswer', params: { x: '+', n: '+' } });
    expect(hint.show.pieces).toHaveLength(4);       // 2 boxes + 2 counters
    expect(termFeedbackText(hint)).toMatch(/boxes are positive.*numbers are positive/);
    expect(termFeedbackText(hint)).not.toMatch(/\d/);
  });

  it('every hint key has words', () => {
    for (const key of ['hintRewrite', 'hintNothing', 'hintBoxCircle', 'hintDraw', 'hintCancel', 'hintAnswer']) {
      expect(termFeedbackText({ key, params: { kind: 'box', x: '-', n: null } })).toMatch(/\w/);
    }
  });
});
