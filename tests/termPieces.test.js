import { describe, it, expect } from 'vitest';
import { makeTerm, makeExpression, evaluate } from '../src/engine/terms.js';
import { piecesFor, piecesForExpression, makePiece, canCancel, cancelAll, remaining, fullyCanceled } from '../src/engine/termPieces.js';
import { generateTermLevel } from '../src/engine/generateTerms.js';

const x = (op, v) => makeTerm('x', op, v);
const n = (op, v) => makeTerm('int', op, v);
const EX1 = makeExpression([x('+', 3), n('-', 5), n('+', 7), x('-', 1)]);   // 3x − 5 + 7 − x

describe('pieces a term draws', () => {
  it('draws boxes for x terms and counters for numbers, of the term\'s worth', () => {
    expect(piecesFor(x('-', 2))).toEqual([makePiece('box', '-'), makePiece('box', '-')]);
    expect(piecesFor(x('+', 1))).toEqual([makePiece('box', '+')]);
    expect(piecesFor(n('-', 5))).toHaveLength(5);
    expect(piecesFor(n('-', 5)).every((p) => p.type === 'counter' && p.sign === '-' && !p.opposite)).toBe(true);
    expect(piecesFor(n('+', -5)).every((p) => p.sign === '-')).toBe(true); // a negative first term
  });

  it('draws a subtracted negative as magenta + counters (the notes\' "is +7")', () => {
    const pieces = piecesFor(n('-', -7));
    expect(pieces).toHaveLength(7);
    expect(pieces.every((p) => p.sign === '+' && p.opposite)).toBe(true);
    expect(piecesFor(x('-', -2)).every((p) => p.type === 'box' && p.sign === '+' && p.opposite)).toBe(true);
  });

  it('makes one column per term', () => {
    expect(piecesForExpression(EX1).map((c) => c.length)).toEqual([3, 5, 7, 1]);
  });
});

describe('canceling', () => {
  it('pairs a box with a negative box, and a counter with an opposite counter, nothing else', () => {
    const box = makePiece('box', '+');
    const negBox = makePiece('box', '-');
    const plus = makePiece('counter', '+');
    const minus = makePiece('counter', '-');
    expect(canCancel(box, negBox)).toBe(true);
    expect(canCancel(plus, minus)).toBe(true);
    expect(canCancel(box, minus)).toBe(false);   // a box and a number aren't like terms
    expect(canCancel(box, box)).toBe(false);     // a pair is one + and one −
    expect(canCancel({ ...box, canceled: true }, negBox)).toBe(false);
  });

  it('cancels the notes\' Example 1 down to 2x + 2', () => {
    const start = piecesForExpression(EX1);
    const done = cancelAll(start);
    expect(remaining(done)).toEqual({ x: 2, n: 2 });
    expect(remaining(done)).toEqual(evaluate(EX1));
    expect(fullyCanceled(done)).toBe(true);
    expect(fullyCanceled(start)).toBe(false);
    expect(done.flat().filter((p) => p.canceled && p.type === 'box')).toHaveLength(2);      // 1 pair
    expect(done.flat().filter((p) => p.canceled && p.type === 'counter')).toHaveLength(10); // 5 pairs
  });

  it('takes pieces in reading order, and never changes what it was given', () => {
    const start = piecesForExpression(EX1);
    const copy = JSON.parse(JSON.stringify(start));
    const done = cancelAll(start);
    expect(start).toEqual(copy);
    expect(done[0][0].canceled).toBe(true);   // the top-left box, as in the notes
    expect(done[0][2].canceled).toBe(false);
  });

  it('always leaves exactly what the expression comes to (every generated problem)', () => {
    for (const level of [1, 2, 3, 4, 5]) for (let seed = 1; seed <= 60; seed++) {
      for (const e of generateTermLevel(level, seed * 17)) {
        const done = cancelAll(piecesForExpression(e));
        expect(remaining(done)).toEqual(evaluate(e));
        expect(fullyCanceled(done)).toBe(true);
      }
    }
  });
});
