import { describe, it, expect } from 'vitest';
import { makeTerm, makeExpression } from '../src/engine/terms.js';
import { validateShapes, shapeInfo, overlaps, validateDraw, validateAnswer, piecePhrase } from '../src/engine/termMoves.js';
import { piecesForExpression, makePiece } from '../src/engine/termPieces.js';

const x = (op, v) => makeTerm('x', op, v);
const n = (op, v) => makeTerm('int', op, v);
const box = (from, to = from) => ({ kind: 'box', from, to });
const circle = (from, to = from) => ({ kind: 'circle', from, to });

// 3x − 5 + 7 − x   parts: 0:3x | 1:− 2:5 | 3:+ 4:7 | 5:− 6:x
const EX1 = makeExpression([x('+', 3), n('-', 5), n('+', 7), x('-', 1)]);
const RIGHT1 = [box(0), circle(1, 2), circle(3, 4), box(5, 6)];
// −5 − 2x − x − (−7)   parts: 0:−5 | 1:− 2:2x | 3:− 4:x | 5:− 6:(−7)
const EX2 = makeExpression([n('+', -5), x('-', 2), x('-', 1), n('-', -7)]);
const RIGHT2 = [circle(0), box(1, 2), box(3, 4), circle(5, 6)];

describe('what a shape surrounds', () => {
  it('knows whole terms from pieces of terms', () => {
    expect(shapeInfo(EX1, box(0))).toMatchObject({ term: 0, complete: true, hasOp: false, hasNum: true });
    expect(shapeInfo(EX1, circle(1, 2))).toMatchObject({ term: 1, complete: true, hasOp: true, hasNum: true });
    expect(shapeInfo(EX1, box(6))).toMatchObject({ term: 3, complete: false, hasOp: false, hasNum: true });
    expect(shapeInfo(EX1, box(5))).toMatchObject({ term: 3, complete: false, hasOp: true, hasNum: false });
    expect(shapeInfo(EX1, circle(2, 3)).term).toBeNull();           // the 5 and the next term's +
    expect(shapeInfo(EX1, circle(2, 3)).terms).toEqual([1, 2]);
  });

  it('reads a shape drawn right to left the same way', () => {
    expect(shapeInfo(EX1, circle(2, 1))).toMatchObject({ term: 1, complete: true });
  });

  it('finds overlaps', () => {
    expect(overlaps(box(5, 6), box(6))).toBe(true);
    expect(overlaps(box(0), circle(1, 2))).toBe(false);
    expect(overlaps(circle(2, 1), circle(2, 3))).toBe(true);
  });
});

describe('Box & Circle check', () => {
  it('passes the notes\' two examples', () => {
    expect(validateShapes(EX1, RIGHT1)).toMatchObject({ ok: true, feedbackKey: 'boxCircleDone' });
    expect(validateShapes(EX2, RIGHT2)).toMatchObject({ ok: true });
  });

  it('does not care what order the shapes were drawn in', () => {
    expect(validateShapes(EX1, [...RIGHT1].reverse()).ok).toBe(true);
    expect(validateShapes(EX1, [RIGHT1[1], RIGHT1[3], RIGHT1[0], RIGHT1[2]]).ok).toBe(true);
  });

  it('asks for the sign in front when the box has only the number', () => {
    const shapes = [RIGHT1[0], RIGHT1[1], RIGHT1[2], box(6)];
    expect(validateShapes(EX1, shapes)).toMatchObject({ ok: false, feedbackKey: 'includeSign', params: { op: '−' } });
    expect(validateShapes(EX1, [circle(2), ...RIGHT1.filter((s) => s !== RIGHT1[1])]))
      .toMatchObject({ feedbackKey: 'includeSign', params: { op: '−' } });
  });

  it('asks for the number when only the operation is shaped', () => {
    expect(validateShapes(EX1, [RIGHT1[0], RIGHT1[1], RIGHT1[2], box(5)])).toMatchObject({ feedbackKey: 'includeNumber', params: { op: '−' } });
  });

  it('wants one term at a time', () => {
    expect(validateShapes(EX1, [box(0), circle(1, 4), box(5, 6)])).toMatchObject({ feedbackKey: 'twoTerms' });
    expect(validateShapes(EX1, [box(0, 2), ...RIGHT1.slice(2)])).toMatchObject({ feedbackKey: 'twoTerms' });
  });

  it('names the wrong shape: a box on a number, a circle on an x term', () => {
    expect(validateShapes(EX1, [box(0), box(1, 2), RIGHT1[2], RIGHT1[3]])).toMatchObject({ ok: false, feedbackKey: 'circleIt' });
    expect(validateShapes(EX1, [circle(0), RIGHT1[1], RIGHT1[2], RIGHT1[3]])).toMatchObject({ ok: false, feedbackKey: 'boxIt' });
  });

  it('says what is missing: an x term first or a number, whichever comes first in the expression', () => {
    expect(validateShapes(EX1, [])).toMatchObject({ feedbackKey: 'boxMissing' });                  // 3x
    expect(validateShapes(EX1, RIGHT1.slice(1))).toMatchObject({ feedbackKey: 'boxMissing' });     // 3x
    expect(validateShapes(EX1, [RIGHT1[0], RIGHT1[2], RIGHT1[3]])).toMatchObject({ feedbackKey: 'circleMissing' }); // − 5
    expect(validateShapes(EX1, RIGHT1.slice(0, 3))).toMatchObject({ feedbackKey: 'boxMissing' });  // − x
    expect(validateShapes(EX2, RIGHT2.slice(1))).toMatchObject({ feedbackKey: 'circleMissing' });  // −5
  });

  it('treats the subtracted negative as a number, with the whole "− (−7)" in its circle', () => {
    expect(validateShapes(EX2, [...RIGHT2.slice(0, 3), circle(6)])).toMatchObject({ feedbackKey: 'includeSign' });
    expect(validateShapes(EX2, [...RIGHT2.slice(0, 3), circle(5, 6)]).ok).toBe(true);
  });

  it('treats a negative first term as one part, so its circle is whole already', () => {
    expect(shapeInfo(EX2, circle(0))).toMatchObject({ term: 0, complete: true });
  });
});

describe('Draw check', () => {
  it('passes the right pieces and names the first term that is off', () => {
    const right = piecesForExpression(EX1);
    expect(validateDraw(EX1, right)).toMatchObject({ ok: true, feedbackKey: 'drawDone' });
    const short = right.map((c) => [...c]);
    short[2] = short[2].slice(1);
    expect(validateDraw(EX1, short)).toMatchObject({ ok: false, feedbackKey: 'countAgain', params: { text: '+ 7', have: 6, count: 7 } });
    const swapped = right.map((c) => [...c]);
    swapped[1] = Array(5).fill(makePiece('counter', '+'));
    expect(validateDraw(EX1, swapped)).toMatchObject({ feedbackKey: 'needPieces', params: { text: '− 5', phrase: '5 negatives' } });
    expect(validateDraw(EX1, [[], [], [], []])).toMatchObject({ feedbackKey: 'needPieces', params: { text: '3x', phrase: '3 boxes' } });
  });

  it('wants boxes on x terms and counters on numbers', () => {
    const right = piecesForExpression(EX1);
    const mixed = right.map((c) => [...c]);
    mixed[3] = [makePiece('counter', '-')];
    expect(validateDraw(EX1, mixed)).toMatchObject({ feedbackKey: 'drawBoxes', params: { text: '− x' } });
    mixed[3] = right[3];
    mixed[1] = [makePiece('box', '-'), ...right[1].slice(1)];
    expect(validateDraw(EX1, mixed)).toMatchObject({ feedbackKey: 'drawCounters' });
  });

  it('puts the count in words', () => {
    expect(piecePhrase(x('-', 4))).toBe('4 negative boxes');
    expect(piecePhrase(x('+', 1))).toBe('1 box');
    expect(piecePhrase(n('-', 5))).toBe('5 negatives');
    expect(piecePhrase(n('-', -7))).toBe('7 positives');
    expect(piecePhrase(n('+', 1))).toBe('1 positive');
  });
});

describe('Answer check', () => {
  it('accepts the notes\' answers in either order', () => {
    expect(validateAnswer(EX1, '2x + 2')).toMatchObject({ ok: true, params: { answer: '2x + 2' } });
    expect(validateAnswer(EX1, '2+2x').ok).toBe(true);
    expect(validateAnswer(EX2, '-3x+2').ok).toBe(true);
    expect(validateAnswer(EX2, '−3x + 2').ok).toBe(true);
  });

  it('says which kind is off, boxes first, never the number', () => {
    expect(validateAnswer(EX1, '3x + 2')).toMatchObject({ ok: false, feedbackKey: 'checkBoxes' });
    expect(validateAnswer(EX1, '2x + 5')).toMatchObject({ feedbackKey: 'checkNumbers' });
    expect(validateAnswer(EX1, '3x + 5')).toMatchObject({ feedbackKey: 'checkBoxes' });
    expect(validateAnswer(EX1, '2x')).toMatchObject({ feedbackKey: 'checkNumbers' });
    expect(validateAnswer(EX1, '2')).toMatchObject({ feedbackKey: 'checkBoxes' });
  });

  it('wants it readable and combined', () => {
    expect(validateAnswer(EX1, '')).toMatchObject({ feedbackKey: 'typeAnswer' });
    expect(validateAnswer(EX1, '2x+')).toMatchObject({ feedbackKey: 'answerUnreadable' });
    expect(validateAnswer(EX1, '2x + 3 − 1')).toMatchObject({ feedbackKey: 'combineAll' });
    expect(validateAnswer(EX1, 'x + x + 2')).toMatchObject({ feedbackKey: 'combineAll' });
    expect(validateAnswer(EX1, '2x + 2 + 0')).toMatchObject({ feedbackKey: 'noZeroTerm' });
  });

  it('takes x and 1x, −x and −1x as the same', () => {
    const e = makeExpression([x('+', 3), n('+', 1), x('-', 2)]);   // 3x + 1 − 2x = x + 1
    for (const t of ['x+1', '1x+1', '1+x', '1+1x']) expect(validateAnswer(e, t).ok, t).toBe(true);
  });
});
