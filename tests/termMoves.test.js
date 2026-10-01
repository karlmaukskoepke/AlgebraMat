import { describe, it, expect } from 'vitest';
import { makeTerm, makeExpression } from '../src/engine/terms.js';
import { validateShapes, shapeInfo, overlaps } from '../src/engine/termMoves.js';

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
