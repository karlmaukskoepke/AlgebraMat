import { describe, it, expect } from 'vitest';
import { makeDivide } from '../src/engine/divide.js';
import { newDivide, reduceDivide, DIVIDE_SPOT, boardText } from '../src/engine/divideMoves.js';
import { withSpotlight, spotOf } from '../src/engine/spotlight.js';
import { withFractionBlank, fracOpen, fracOf, canPreview } from '../src/engine/divideBlank.js';

// Build D, Part 4: Divide it's move is a blank (a fraction typed), and a fraction that does not split is followed by the list
const R = withSpotlight(withFractionBlank(reduceDivide), DIVIDE_SPOT);
const run = (s, ...actions) => actions.reduce(R, s);
const start = () => newDivide({ ...makeDivide(5, -3), logLevel: 3 }, { level: 3 });      // 5x = −15
const digit = (d) => ({ type: 'digit', digit: d });

describe('Divide it: the fraction blank and the list after a fraction that does not split', () => {
  it('reads 1/5 typed as one over five, and takes it of both sides', () => {
    expect(fracOf({ num: '1', den: '5' })).toEqual({ n: 5 });
    expect(fracOf({ num: '', den: '3' })).toEqual({ n: 3 });
    expect([fracOf({ num: '2', den: '5' }), fracOf({ num: '1', den: '9' })]).toEqual([null, null]);
    let s = start();
    expect(canPreview(s)).toBe(true);
    s = run(s, { type: 'choose', move: 'fraction' });
    expect(fracOpen(s)).toBe(true);
    s = run(s, digit(1), { type: 'fracSlash' }, digit(5));
    expect(s.fb).toMatchObject({ num: '1', den: '5' });
    s = run(s, { type: 'go' });
    expect(boardText(s.board)).toBe('x = ⅕(−15)');
  });
  it('a fraction that fails is crossed off; after Undo the list is offered and the right one applies at once with its picture', () => {
    let s = run(start(), { type: 'choose', move: 'fraction' }, digit(1), digit(2), { type: 'go' });
    expect([s.feedback.key, s.tried]).toEqual(['dFail', [2]]);
    s = run(s, { type: 'undo' });
    expect([s.feedback.key, s.spot.choose, s.menu]).toEqual(['dWhichFraction', true, 'fraction']);
    s = run(s, { type: 'take', n: 3, fromList: true });
    expect([s.feedback.key, s.tried]).toEqual(['dFail', [2, 3]]);
    s = run(s, { type: 'undo' }, { type: 'take', n: 5, fromList: true });
    expect([boardText(s.board), s.pic.kept, s.pic.groups, spotOf(s, DIVIDE_SPOT)]).toEqual(['x = ⅕(−15)', 0, [3, 3, 3, 3, 3], null]);
  });
});
