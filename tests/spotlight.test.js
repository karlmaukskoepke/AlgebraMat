import { describe, it, expect } from 'vitest';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { reduceAddBoth } from '../src/engine/addBothMoves.js';
import { newLightsSession, withLights, ADD_SPOT } from '../src/engine/addBothLights.js';
import { makeDivide } from '../src/engine/divide.js';
import { newDivide, reduceDivide, DIVIDE_SPOT } from '../src/engine/divideMoves.js';
import { withSpotlight, spotOf } from '../src/engine/spotlight.js';

// The spotlight message (Build C, Part 2): an error waits for Undo, then a hint pops up.
const add = withSpotlight(withLights(reduceAddBoth), ADD_SPOT);
const run = (r, s, ...actions) => actions.reduce(r, s);
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const start = () => newLightsSession({ ...makeAddBoth('x+a', 8, -12), logLevel: 4 }, { level: 4 });       // x + 8 = −4
// (after an Undo the move stays chosen, its blank cleared: the amount is typed straight in)
const move = (s, n) => run(add, s, ...(s.menu === 'add' ? [] : [{ type: 'choose', move: 'add' }]), ...typed(String(n)), { type: 'go' });

describe('Add to both sides: errors and the hint after Undo', () => {
  it('a red move is an error: the number next to x is lit, labelled, and every action but Undo is ignored', () => {
    const s = move(start(), 8);
    expect(spotOf(s, ADD_SPOT)).toMatchObject({ kind: 'error', target: 'xnum', label: 'got bigger' });
    for (const a of [{ type: 'stuck' }, { type: 'teach' }, { type: 'check' }, { type: 'choose', move: 'add' }, { type: 'digit', digit: 3 }, { type: 'ui', patch: { preview: true } }, { type: 'startOver' }]) {
      expect(run(add, s, a)).toBe(s);
    }
  });
  it('Undo clears it and pops up the reminder: the number next to x outlined, "What would we add…", the Add move to make', () => {
    const s = run(add, move(start(), 8), { type: 'undo' });
    expect(spotOf(s, ADD_SPOT)).toMatchObject({ kind: 'hint', target: 'xnum', move: 'add' });
    expect(s.feedback).toMatchObject({ key: 'aStuckHint', params: { constant: '+8' }, bad: false });
    expect(s.hint.kind).toBe('cancel');
    expect(s.supportsShown).toEqual([]);                                   // not asked for: nothing on the class sheet
  });
  it('the hint goes when the student starts the move, or taps Got it; the line goes back to the prompt', () => {
    const h = run(add, move(start(), 8), { type: 'undo' });
    expect(spotOf(run(add, h, { type: 'digit', digit: 8 }), ADD_SPOT)).toBe(null);
    const g = run(add, h, { type: 'spotDismiss' });
    expect([spotOf(g, ADD_SPOT), g.feedback.key]).toEqual([null, 'aFindX']);
  });
  it('partly cancelling, zeroing the other side and a wrong guess are errors too, each lighting its own thing', () => {
    expect(spotOf(move(start(), -5), ADD_SPOT)).toMatchObject({ target: 'xnum', label: 'still here' });
    expect(spotOf(move(start(), 4), ADD_SPOT)).toMatchObject({ target: 'otherSide', label: 'now 0' });
    const g = run(add, start(), ...typed('4'), { type: 'check' }, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(spotOf(g, ADD_SPOT)).toMatchObject({ target: 'subst', label: 'not balanced' });
    expect(spotOf(run(add, g, { type: 'undo' }), ADD_SPOT)).toMatchObject({ kind: 'hint', target: 'xnum' });
  });
  it('a wrong value: Undo only closes the pop-up (nothing to take back), then the x-alone reminder', () => {
    let s = run(add, move(start(), -8), { type: 'lxNext' }, ...typed('3'), { type: 'check' }, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(spotOf(s, ADD_SPOT)).toMatchObject({ target: 'answer', label: 'check this' });
    s = run(add, s, { type: 'undo' });
    expect([s.rows.length, spotOf(s, ADD_SPOT)?.target, s.feedback.key]).toEqual([3, 'answer', 'aStuckSolved']);
  });
  it('three red moves in a row, each undone, still offer Start over', () => {
    let s = start();
    for (let i = 0; i < 3; i++) s = run(add, move(s, 8), { type: 'undo' });
    expect([s.reds, s.startOver]).toEqual([3, true]);
  });
});

describe('Divide it: a fraction that does not split', () => {
  const div = withSpotlight(reduceDivide, DIVIDE_SPOT);
  it('lights the side that broke; Undo, then "Pick a fraction of both sides…" at the number in front, the fraction move to make', () => {
    let s = run(div, newDivide(makeDivide(5, -3), { level: 3 }), { type: 'choose', move: 'fraction' }, { type: 'take', n: 2 });
    expect(spotOf(s, DIVIDE_SPOT)).toMatchObject({ kind: 'error', target: 'failSide' });
    expect(run(div, s, { type: 'take', n: 5 })).toBe(s);
    s = run(div, s, { type: 'undo' });
    expect(spotOf(s, DIVIDE_SPOT)).toMatchObject({ kind: 'hint', target: 'coef', move: 'fraction' });
    expect([s.feedback.key, s.hint.kind, s.reds]).toEqual(['dPickFraction', 'coef', 1]);
  });
});
