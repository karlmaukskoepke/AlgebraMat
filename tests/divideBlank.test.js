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

// Build D-2, Part 4: one Multiply button with three options; one digit each in the fraction; the unit-fraction pop-up. Build L: the options
// are Multiply, Divide and Fraction (the −1 option left: Flip everything is its own button); on Divide it, Divide is the move, Multiply is
// explained, and Fraction is greyed.
describe('Build D-2 and Build L: Divide it’s Multiply options and the fraction blank', () => {
  it('opens three options; Divide opens its blank; Fraction is greyed here; a second click closes them', () => {
    let s = run(start(), { type: 'multOpen' });
    expect([Boolean(s.mopts), s.menu]).toEqual([true, null]);
    expect(run(s, { type: 'multOpen' }).mopts).toBe(null);
    s = run(s, { type: 'ui', patch: { preview: 'div' } });
    expect(s.ui.preview).toBe('div');
    expect(run(s, { type: 'multPick', kind: 'frac' }).feedback.key).toBe('aLater');
    s = run(s, { type: 'multPick', kind: 'div' });
    expect([s.mopts, fracOpen(s)]).toEqual([{ kind: 'div', entry: '' }, false]);
  });
  it('a whole number, or −1 typed in it, is solid, then Go says why it does not leave one x', () => {
    let s = run(start(), { type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, digit(3), { type: 'go' });
    expect(s.feedback).toMatchObject({ key: 'dWholeNo', params: { n: 3, a: 5, made: 15 } });
    expect(boardText(s.board)).toBe('5x = −15');
    s = run(start(), { type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, digit(1), { type: 'toggleSign' }, { type: 'go' });
    expect(s.feedback.key).toBe('dFlipNo');                                  // (−1 is Flip everything, which Divide it explains)
    expect(run(s, { type: 'undo' }).mopts).toBe(null);
    expect(run(start(), { type: 'multOpen' }, { type: 'multPick', kind: 'div' }, { type: 'toggleSign' }, digit(1), { type: 'go' }).feedback.key).toBe('dFlipNo');
  });
  it('dividing by 5 is taking ⅕ of both sides: the same rows, lights and history', () => {
    const div = run(start(), { type: 'multOpen' }, { type: 'multPick', kind: 'div' }, digit(5), { type: 'go' });
    const frac = run(start(), { type: 'choose', move: 'fraction' }, digit(1), digit(5), { type: 'go' });
    const view = (s) => JSON.stringify({ rows: s.rows, board: s.board, lights: s.lights, feedback: s.feedback, history: s.history.length, menu: s.menu }).replace(/"id":"[^"]*"/g, '');
    expect(view(div)).toBe(view(frac));
    expect(boardText(div.board)).toBe('x = ⅕(−15)');
    expect(div.mopts).toBe(null);
  });
  it('Divide takes one digit (a second one gets the pop-up), ignores a slash, and refuses 0, 1, 7-9 and, here, a negative', () => {
    let s = run(start(), { type: 'multOpen' }, { type: 'multPick', kind: 'div' }, digit(5), digit(5));
    expect([s.mopts.entry, s.feedback.key]).toEqual(['5', 'dDivOneDigit']);
    expect(run(s, { type: 'fracSlash' }).mopts.entry).toBe('5');
    expect(run(s, { type: 'typeChar', ch: '/' }).mopts.entry).toBe('5');
    const tryIt = (...keys) => run(start(), { type: 'multOpen' }, { type: 'multPick', kind: 'div' }, ...keys, { type: 'go' });
    expect(tryIt(digit(0)).feedback.key).toBe('dDivZero');
    expect(tryIt(digit(7)).feedback.key).toBe('dDivBad');
    expect(tryIt(digit(1)).feedback.key).toBe('dDivBad');
    const neg = tryIt({ type: 'toggleSign' }, digit(5));
    expect([neg.feedback.key, neg.feedback.params.typed, boardText(neg.board), neg.mopts]).toEqual(['dDivBad', -5, '5x = −15', { kind: 'div', entry: '-5' }]);
  });
  it('dividing by a number that does not split fails visibly, as the fraction did, and the fraction cycle follows Undo', () => {
    let s = run(start(), { type: 'multOpen' }, { type: 'multPick', kind: 'div' }, digit(2), { type: 'go' });
    expect([s.feedback.key, s.tried]).toEqual(['dFail', [2]]);
    s = run(s, { type: 'undo' });
    expect([s.feedback.key, s.spot.choose, s.menu]).toEqual(['dWhichFraction', true, 'fraction']);
  });
  it('one digit on top, then the cursor is on the bottom; 66 is not a unit fraction', () => {
    let s = run(start(), { type: 'choose', move: 'fraction' }, digit(1));
    expect(s.fb).toMatchObject({ num: '1', part: 'den' });
    s = run(s, digit(5));
    expect([fracOf(s.fb), s.feedback?.key ?? null]).toEqual([{ n: 5 }, null]);
    s = run(s, digit(5));
    expect([s.fb.den, s.feedback.key]).toEqual(['5', 'dUnitFraction']);
    s = run(start(), { type: 'choose', move: 'fraction' }, digit(6), digit(6));
    expect([s.fb.num, s.fb.den, s.feedback.key]).toEqual(['6', '6', 'dUnitFraction']);
    expect(run(start(), { type: 'choose', move: 'fraction' }, { type: 'fracStuck' }).feedback.key).toBe('dUnitFraction');
  });
});
