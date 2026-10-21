import { describe, it, expect } from 'vitest';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { reduceAddBoth } from '../src/engine/cards/add.js';
import { newLightsSession, withLights, ADD_SPOT } from '../src/engine/addBothLights.js';
import { makeDivide } from '../src/engine/divide.js';
import { newDivide, reduceDivide, DIVIDE_SPOT } from '../src/engine/divideMoves.js';
import { withSpotlight, spotOf } from '../src/engine/spotlight.js';
import { withFractionBlank, fracOpen } from '../src/engine/divideBlank.js';
import { substitutionLines, xCount } from '../src/engine/solveTerms.js';

// Build H, Part 1: the quick fixes that live in the engine (the rest are looks, checked by the walks in tests/features).
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const digit = (d) => ({ type: 'digit', digit: d });

describe('the substituted value is blue, even when it is the operation about to happen (item 2)', () => {
  it('every value dropped into x carries is-blue in the first line, alongside is-op when it is being worked out', () => {
    const board = { left: [{ kind: 'x' }, { kind: 'num', v: -3 }], right: [{ kind: 'num', v: -1 }] };
    const line = substitutionLines(board, -4).lines[0].segs;
    const value = line.find((s) => s.text === '(−4)');
    expect(value.cls.split(' ')).toEqual(expect.arrayContaining(['is-blue', 'is-op']));
    const coef = substitutionLines({ left: [{ kind: 'x', coef: 3 }], right: [{ kind: 'num', v: -12 }] }, -4).lines[0].segs;
    expect(coef.find((s) => s.text === '(−4)').cls.split(' ')).toContain('is-blue');
  });
});

describe('an equation with more than one x takes a drop in each (item 3)', () => {
  const two = { left: [{ kind: 'x' }, { kind: 'num', v: 3 }], right: [{ kind: 'x', coef: 2 }, { kind: 'num', v: -1 }] };
  const start = () => {
    const s = newDivide({ ...makeDivide(5, -3), logLevel: 3 }, { level: 3 });
    s.board = two; s.rows = [{ type: 'eq', board: two }]; s.problem = { ...s.problem, x: 4 };      // x + 3 = 2x − 1, a state no card has yet
    return s;
  };
  const R = (s, a) => reduceDivide(s, a);
  it('counts the x terms', () => {
    expect(xCount(two)).toBe(2);
    expect(xCount({ left: [{ kind: 'x', coef: 5 }], right: [{ kind: 'num', v: -15 }] })).toBe(1);
  });
  it('the value waits until every x has it, whichever x it is dropped on; the first lines appear then', () => {
    let s = R(start(), { type: 'digit', digit: 4 });
    s = R(s, { type: 'check' });
    expect([s.sub.xs, s.sub.placing, s.sub.filled]).toEqual([2, true, []]);
    s = R(s, { type: 'placeValue', index: 1 });
    expect([s.sub.placing, s.sub.filled, s.sub.step]).toEqual([true, [1], 0]);
    s = R(s, { type: 'placeValue', index: 1 });                       // the same x again: nothing new
    expect(s.sub.filled).toEqual([1]);
    s = R(s, { type: 'placeValue' });                                  // no x named: the next empty one
    expect([s.sub.placing, s.sub.filled, s.sub.step]).toEqual([false, [1, 0], 1]);
  });
  it('one x is as before: a single drop', () => {
    let s = newDivide({ ...makeDivide(5, -3), logLevel: 3 }, { level: 3 });
    s = reduceDivide(s, { type: 'toggleSign' });
    for (const d of [1, 5]) s = reduceDivide(s, digit(d));
    s = reduceDivide(s, { type: 'check' });
    s = reduceDivide(s, { type: 'placeValue' });
    expect([s.sub.xs, s.sub.placing, s.sub.step]).toEqual([1, false, 1]);
  });
});

describe('Not balanced keeps its reason lit (item 1) and the numbers stay lit at "Now type x" (item 5)', () => {
  const add = withSpotlight(withLights(reduceAddBoth), ADD_SPOT);
  const div = withSpotlight(withFractionBlank(reduceDivide), DIVIDE_SPOT);
  const run = (r, s, ...actions) => actions.reduce(r, s);
  it('a wrong guess or a wrong value lights the last row of the check with the label, on both cards', () => {
    const a = newLightsSession({ ...makeAddBoth('x+a', 8, -12), logLevel: 4 }, { level: 4 });          // x + 8 = −4
    const g = run(add, a, ...typed('4'), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(spotOf(g, ADD_SPOT)).toMatchObject({ kind: 'error', target: 'subst', lit: ['substLast'] });
    const d = run(div, newDivide({ ...makeDivide(5, -3), logLevel: 3 }, { level: 3 }), ...typed('4'), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(spotOf(d, DIVIDE_SPOT)).toMatchObject({ kind: 'error', lit: ['substLast'] });
  });
  it('after the right Party or Battle at x alone, the two numbers are lit with the field', () => {
    const s0 = newLightsSession({ ...makeAddBoth('x+a', 8, 3), logLevel: 4 }, { level: 2 });             // x + 8 = 11
    let s = run(add, s0, { type: 'choose', move: 'add' }, ...typed('-8'), { type: 'go' }, { type: 'stuck' });
    expect(spotOf(s, ADD_SPOT)).toMatchObject({ kind: 'ask', target: 'otherSide' });
    s = run(add, s, { type: 'kind', value: 'battle' });
    expect(spotOf(s, ADD_SPOT)).toMatchObject({ kind: 'ask', target: 'answer', lit: ['otherSide'] });
  });
});

describe('Divide it: a slash in the whole-number blank opens the fraction blank (item 7); a box is retyped by tapping it (item 8)', () => {
  const R = withSpotlight(withFractionBlank(reduceDivide), DIVIDE_SPOT);
  const run = (s, ...actions) => actions.reduce(R, s);
  const start = () => newDivide({ ...makeDivide(5, -3), logLevel: 3 }, { level: 3 });
  it('1, /, 5 makes 1/5: what was typed is the top, the cursor goes to the bottom', () => {
    let s = run(start(), { type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, digit(1));
    expect(s.mopts).toMatchObject({ kind: 'whole', entry: '1' });
    s = run(s, { type: 'fracSlash' });
    expect([s.mopts, fracOpen(s), s.fb]).toEqual([null, true, { num: '1', den: '', part: 'den' }]);
    s = run(s, digit(5));
    expect(s.fb).toMatchObject({ num: '1', den: '5' });
  });
  it('the slash typed as a character does the same; an empty whole-number blank gives an empty top', () => {
    const s = run(start(), { type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, { type: 'typeChar', ch: '/' });
    expect([fracOpen(s), s.fb]).toEqual([true, { num: '', den: '', part: 'den' }]);
  });
  it('a top that is more than one digit gets the unit-fraction pop-up', () => {
    const s = run(start(), { type: 'multOpen' }, { type: 'multPick', kind: 'whole' }, digit(1), digit(2), { type: 'fracSlash' });
    expect(s.feedback).toMatchObject({ key: 'dUnitFraction' });
  });
  it('tapping a box clears it and puts the cursor in it', () => {
    let s = run(start(), { type: 'choose', move: 'fraction' }, digit(1), digit(5));
    expect(s.fb).toMatchObject({ num: '1', den: '5' });
    s = run(s, { type: 'focus', target: 'num' });
    expect(s.fb).toEqual({ num: '', den: '5', part: 'num' });
    s = run(s, { type: 'focus', target: 'den' });
    expect(s.fb).toEqual({ num: '', den: '', part: 'den' });
  });
});
