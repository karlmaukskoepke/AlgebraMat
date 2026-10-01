import { describe, it, expect } from 'vitest';
import {
  makeTerm, makeExpression, effective, needsRewrite, rewriteTerm, pieceCount, pieceSign, evaluate, totalPieces,
  numberText, termText, formatExpression, termParts, formatAnswer, parseAnswer,
} from '../src/engine/terms.js';

const x = (op, value) => makeTerm('x', op, value);
const n = (op, value) => makeTerm('int', op, value);
const expr = (...terms) => makeExpression(terms);

// The notes' two examples.
const ex1 = expr(x('+', 3), n('-', 5), n('+', 7), x('-', 1));        // 3x − 5 + 7 − x
const ex2 = expr(n('+', -5), x('-', 2), x('-', 1), n('-', -7));      // −5 − 2x − x − (−7)

describe('terms', () => {
  it('values a term by its operation times its sign', () => {
    expect(effective(x('+', 3))).toBe(3);
    expect(effective(n('-', 5))).toBe(-5);
    expect(effective(x('-', 1))).toBe(-1);
    expect(effective(n('+', -5))).toBe(-5);   // a negative first term
    expect(effective(n('-', -7))).toBe(7);    // subtracting a negative
  });

  it('draws as many pieces as its worth, of its sign', () => {
    expect([pieceCount(x('-', 2)), pieceSign(x('-', 2))]).toEqual([2, '-']);
    expect([pieceCount(x('+', 1)), pieceSign(x('+', 1))]).toEqual([1, '+']);
    expect([pieceCount(n('-', -7)), pieceSign(n('-', -7))]).toEqual([7, '+']);
    expect(totalPieces(ex1)).toBe(3 + 5 + 7 + 1);
  });

  it('adds up the boxes and the numbers separately (the notes\' answers)', () => {
    expect(evaluate(ex1)).toEqual({ x: 2, n: 2 });    // = 2x + 2
    expect(evaluate(ex2)).toEqual({ x: -3, n: 2 });   // = −3x + 2
  });

  it('needs a rewrite only when subtracting a negative, and the rewrite keeps its worth', () => {
    expect(ex2.terms.map(needsRewrite)).toEqual([false, false, false, true]);
    expect(ex1.terms.some(needsRewrite)).toBe(false);
    const t = n('-', -7);
    expect(rewriteTerm(t)).toEqual(n('+', 7));
    expect(effective(rewriteTerm(t))).toBe(effective(t));
    expect(rewriteTerm(n('-', 5))).toEqual(n('-', 5));
  });
});

describe('writing terms', () => {
  it('writes a coefficient of 1 as a bare x', () => {
    expect(numberText(x('+', 1))).toBe('x');
    expect(numberText(x('+', -1))).toBe('−x');
    expect(numberText(x('+', -4))).toBe('−4x');
    expect(numberText(n('+', 9))).toBe('9');
  });

  it('writes terms the way the notes do', () => {
    expect(formatExpression(ex1)).toBe('3x − 5 + 7 − x');
    expect(formatExpression(ex2)).toBe('−5 − 2x − x − (−7)');
    expect(termText(x('-', -2))).toBe('− (−2x)');
    expect(termText(x('+', 1))).toBe('+ x');
  });

  it('splits terms into an operation and a number, the first term having only a number', () => {
    expect(termParts(ex1).map((p) => `${p.term}${p.part}:${p.text}`)).toEqual([
      '0num:3x', '1op:−', '1num:5', '2op:+', '2num:7', '3op:−', '3num:x',
    ]);
    expect(termParts(ex2).map((p) => p.text)).toEqual(['−5', '−', '2x', '−', 'x', '−', '(−7)']);
  });

  it('writes answers with the box term first', () => {
    expect(formatAnswer({ x: 2, n: 2 })).toBe('2x + 2');
    expect(formatAnswer({ x: -3, n: 2 })).toBe('−3x + 2');
    expect(formatAnswer({ x: 1, n: -2 })).toBe('x − 2');
    expect(formatAnswer({ x: -1, n: 0 })).toBe('−x');
    expect(formatAnswer({ x: 0, n: -4 })).toBe('−4');
    expect(formatAnswer({ x: 0, n: 0 })).toBe('0');
  });
});

describe('reading typed answers', () => {
  const read = (t) => { const r = parseAnswer(t); return r.ok ? { x: r.x, n: r.n, combined: r.combined } : r.reason; };

  it('reads either order, with or without spaces, with the keyboard minus or the real one', () => {
    for (const t of ['2x + 2', '2x+2', '2+2x', ' 2 x +2 ']) expect(read(t)).toEqual({ x: 2, n: 2, combined: true });
    expect(read('-3x+2')).toEqual({ x: -3, n: 2, combined: true });
    expect(read('−3x + 2')).toEqual({ x: -3, n: 2, combined: true });
    expect(read('2 − 3x')).toEqual({ x: -3, n: 2, combined: true });
  });

  it('reads x and 1x the same, and -x and -1x', () => {
    expect(read('x + 1')).toEqual(read('1x + 1'));
    expect(read('−x')).toEqual({ x: -1, n: 0, combined: true });
    expect(read('-1x')).toEqual({ x: -1, n: 0, combined: true });
    expect(read('5')).toEqual({ x: 0, n: 5, combined: true });
  });

  it('can read an answer that is not combined, and says so', () => {
    expect(read('2x + 3 − 1')).toEqual({ x: 0 + 2, n: 2, combined: false });
    expect(read('x + x')).toEqual({ x: 2, n: 0, combined: false });
    expect(read('2x + 0')).toEqual({ x: 2, n: 0, combined: false });
  });

  it('rejects what cannot be read', () => {
    for (const t of ['', '   ', '+', '2x3', '2x 3', 'x+', '2++3', '2+-3', 'xx', '12345', '3x−', null, 7]) {
      expect(typeof read(t), String(t)).toBe('string');
    }
  });

  it('round-trips every answer a problem can have', () => {
    for (let a = -27; a <= 27; a++) for (let b = -27; b <= 27; b++) {
      const r = parseAnswer(formatAnswer({ x: a, n: b }));
      expect(r.ok && r.x === a && r.n === b && (a === 0 && b === 0 ? true : r.combined)).toBe(true);
    }
  });
});
