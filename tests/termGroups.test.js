import { describe, it, expect } from 'vitest';
import {
  makeTermGroups, formatTermGroups, evaluateTermGroups, groupTotal, answerText, groupPieces, partPieces,
  pieceTotal, groupCount, isNumberFirst, distributeLines, xTerm, numTerm, isFraction, isOpposite,
} from '../src/engine/termGroups.js';

const x = (value) => ({ kind: 'x', value });
const n = (value) => ({ kind: 'int', value });

describe('term groups: the model', () => {
  it('writes the problem the way the notes do', () => {
    expect(formatTermGroups(makeTermGroups({ n: 3 }, [x(2), n(-1)]))).toBe('3(2x − 1)');
    expect(formatTermGroups(makeTermGroups({ neg: true, n: 2 }, [x(1), n(-4)]))).toBe('−2(x − 4)');
    expect(formatTermGroups(makeTermGroups({ neg: true, n: 1 }, [x(1), n(3)], { hidden1: true }))).toBe('−(x + 3)');
    expect(formatTermGroups(makeTermGroups({ neg: true, n: 1 }, [x(1), n(3)]))).toBe('−1(x + 3)');
    expect(formatTermGroups(makeTermGroups({ n: 1, d: 2 }, [x(4), n(6)]))).toBe('1/2(4x + 6)');
    expect(formatTermGroups(makeTermGroups({ neg: true, n: 2, d: 3 }, [n(6), x(-3)]))).toBe('−2/3(6 − 3x)');
    expect(formatTermGroups(makeTermGroups({ n: 3 }, [x(-1), n(2)]))).toBe('3(−x + 2)');
    expect(formatTermGroups(makeTermGroups({ n: 4 }, [n(-5), x(2)]))).toBe('4(−5 + 2x)');
  });

  it('works out the answer: boxes and numbers, opposite when the groups are', () => {
    const a = makeTermGroups({ n: 3 }, [x(2), n(-1)]);
    expect(groupTotal(a)).toEqual({ x: 6, n: -3 });
    expect(answerText(a)).toBe('6x − 3');
    const b = makeTermGroups({ neg: true, n: 2 }, [x(1), n(-4)]);
    expect(groupTotal(b)).toEqual({ x: 2, n: -8 });          // "2x − 8", then opp.
    expect(evaluateTermGroups(b)).toEqual({ x: -2, n: 8 });
    expect(answerText(b)).toBe('−2x + 8');
    const c = makeTermGroups({ neg: true, n: 1 }, [x(1), n(3)], { hidden1: true });
    expect(answerText(c)).toBe('−x − 3');
    const d = makeTermGroups({ n: 2, d: 3 }, [x(3), n(-6)]);
    expect(answerText(d)).toBe('2x − 4');
    expect(answerText(makeTermGroups({ neg: true, n: 1, d: 2 }, [n(6), x(4)]))).toBe('−2x − 3');
  });

  it('lists the pieces: |C| boxes and |D| counters in a group, dealt out for a fraction', () => {
    const a = makeTermGroups({ n: 3 }, [x(2), n(-1)]);
    expect(groupPieces(a)).toEqual({ boxes: 2, boxSign: '+', counters: 1, counterSign: '-' });
    expect(groupCount(a)).toBe(3);
    expect(pieceTotal(a)).toBe(9);
    const f = makeTermGroups({ n: 2, d: 3 }, [x(-3), n(6)]);
    expect(groupPieces(f)).toEqual({ boxes: 3, boxSign: '-', counters: 6, counterSign: '+' });
    expect(partPieces(f)).toMatchObject({ boxes: 1, counters: 2 });
    expect(groupCount(f)).toBe(1);
    expect(pieceTotal(f)).toBe(9);
    expect(isFraction(f)).toBe(true);
    expect(isOpposite(a)).toBe(false);
  });

  it('knows the order B is written in, and finds its terms', () => {
    const a = makeTermGroups({ n: 3 }, [n(2), x(-1)]);
    expect(isNumberFirst(a)).toBe(true);
    expect(xTerm(a)).toEqual(x(-1));
    expect(numTerm(a)).toEqual(n(2));
    expect(isNumberFirst(makeTermGroups({ n: 3 }, [x(1), n(2)]))).toBe(false);
  });

  it('gives the distributing arrows for Check it, one line per term in the order written', () => {
    const lines = (p) => distributeLines(p).map((l) => l.text);
    expect(lines(makeTermGroups({ n: 3 }, [x(2), n(-1)]))).toEqual(['3 · 2x = 6x', '3 · (−1) = −3']);
    expect(lines(makeTermGroups({ neg: true, n: 2 }, [x(1), n(-4)]))).toEqual(['−2 · x = −2x', '−2 · (−4) = 8']);
    expect(lines(makeTermGroups({ n: 1, d: 2 }, [x(4), n(6)]))).toEqual(['1/2 · 4x = 2x', '1/2 · 6 = 3']);
    expect(lines(makeTermGroups({ neg: true, n: 2, d: 3 }, [n(6), x(-3)]))).toEqual(['−2/3 · 6 = −4', '−2/3 · (−3x) = 2x']);
    expect(distributeLines(makeTermGroups({ n: 3 }, [x(2), n(-1)])).map((l) => l.product)).toEqual([x(6), n(-3)]);
  });

  it('refuses problems that are not allowed', () => {
    expect(() => makeTermGroups({ n: 0 }, [x(1), n(1)])).toThrow();
    expect(() => makeTermGroups({ n: 2 }, [x(1)])).toThrow();
    expect(() => makeTermGroups({ n: 2 }, [x(1), x(2)])).toThrow();
    expect(() => makeTermGroups({ n: 2 }, [x(0), n(1)])).toThrow();
    expect(() => makeTermGroups({ n: 1, d: 2 }, [x(3), n(2)])).toThrow();   // 3 doesn't split in half
    expect(() => makeTermGroups({ n: 2 }, [x(1), n(1)], { hidden1: true })).toThrow();
    expect(() => makeTermGroups({ n: 1 }, [x(1), n(1)], { hidden1: true })).toThrow();   // only −(B) hides a 1
  });
});
