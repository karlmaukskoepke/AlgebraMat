import { describe, it, expect } from 'vitest';
import { makeDivide } from '../src/engine/divide.js';
import { newDivide, reduceDivide, boardText, answerLive, owesMove, xAlone, substitutionSteps } from '../src/engine/divideMoves.js';

const run = (s, ...a) => a.reduce(reduceDivide, s);
const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const P = (a, x) => makeDivide(a, x);
const start = (p = P(3, -4)) => newDivide(p, { level: 3 });
const take = (s, n) => run(s, ...(s.path ? [] : [{ type: 'path', value: 'move' }]), { type: 'choose', move: 'fraction' }, { type: 'take', n });
const clickThrough = (s) => { let t = s; while (t.sub && t.sub.step < 3) t = run(t, { type: 'nextLine' }); return t; };

describe('the choice, and the one move', () => {
  it('starts with the choice; the fraction move waits for the move path; the answer row is greyed until x is alone', () => {
    const s = start();
    expect([s.path, s.feedback.key, boardText(s.board)]).toEqual([null, 'aChoose', '3x = −12']);
    expect(run(s, { type: 'choose', move: 'fraction' }).feedback.key).toBe('aChooseFirst');
    expect(run(s, ...typed('5')).entry).toBe('');
    const m = run(s, { type: 'path', value: 'move' });
    expect(run(m, ...typed('5')).entry).toBe('');
    expect(run(run(s, { type: 'path', value: 'guess' }), { type: 'choose', move: 'fraction' }).feedback.key).toBe('aGuessing');
    expect(run(m, { type: 'path', value: 'guess' })).toBe(m);
  });
  it('a fraction that splits both sides runs in one action: ⅓(3x) = ⅓(−12), then x = ⅓(−12), the value never shown', () => {
    const s = take(start(), 3);
    expect(boardText(s.board)).toBe('x = ⅓(−12)');
    expect(boardText(s.rows[1].board)).toBe('⅓(3x) = ⅓(−12)');
    expect(s.rows.map((r) => r.type)).toEqual(['eq', 'work', 'eq']);
    expect([s.lights.smaller, s.lights.onebox, xAlone(s.board), answerLive(s), s.feedback.key]).toEqual(['green', 'green', true, true, 'aSolvedBoard']);
  });
  it('a partial move shows the smaller numbers: ½ on 4x = 24 leaves 2x = 12 and the second light grey', () => {
    const s = take(start(P(4, 6)), 2);
    expect(boardText(s.board)).toBe('2x = 12');
    expect([s.lights.smaller, s.lights.onebox, xAlone(s.board), s.feedback.key]).toEqual(['green', 'neutral', false, 'dPartial']);
    expect(boardText(take(run(s, { type: 'choose', move: 'fraction' }), 2).board)).toBe('x = ½(12)');
  });
  it('a fraction that does not split is a failed attempt: shown, never committed, Undo takes it back, three in a row offer Start over', () => {
    let s = take(start(), 2);                                                                // 3 boxes cannot make 2 groups
    expect([boardText(s.board), s.fail.boxesSplit, s.fail.countersSplit, s.reds, s.feedback.key]).toEqual(['3x = −12', false, true, 1, 'dFail']);
    expect(s.rows.at(-1)).toMatchObject({ type: 'work', failed: true });
    s = run(s, { type: 'undo' });
    expect([s.fail, s.rows.length, s.reds]).toEqual([null, 1, 0]);
    s = take(start(), 5);
    expect([s.fail.boxesSplit, s.fail.countersSplit, s.feedback.params.left]).toEqual([false, false, 2]);
    s = run(s, { type: 'take', n: 4 }, { type: 'take', n: 2 });                              // a new try replaces the failed one; they still count
    expect([s.rows.length, s.reds, s.startOver, s.feedback.key]).toEqual([2, 3, true, 'dFail3']);
    expect(run(s, { type: 'startOver' }).path).toBeNull();
  });
});

describe('plugging a typed value back in', () => {
  it('a right value: a line a click, then the problem is done', () => {
    let s = run(take(start(), 3), ...typed('−4'), { type: 'check' });
    expect([s.sub.kind, s.sub.ok, s.sub.lines]).toEqual(['value', true, ['3 × (−4) = −12', '−12 = −12']]);
    s = clickThrough(s);
    s = run(s, { type: 'nextLine' });
    expect([s.stage, s.finalText, s.clean, s.feedback.key]).toEqual(['done', '−4', true, 'aCorrect']);
  });
  it('a wrong value names the slip at the end and clears the row; each slip of the spec gets its message', () => {
    const wrong = (typed_) => clickThrough(run(take(start(), 3), ...typed(typed_), { type: 'check' }));
    const s = wrong('−36');
    expect([s.feedback.key, s.feedback.params.tag, s.entry, s.stage]).toEqual(['dWrong', 'multiplied', '', 'moves']);
    expect(wrong('−9').feedback.params.tag).toBe('undid-add');
    expect(wrong('−6').feedback).toMatchObject({ params: { tag: 'wrong-groups', groups: 2 } });
  });
  it('a guess: the original equation is plugged, a wrong one asks for Undo and goes to the move; a right one owes a move', () => {
    let s = clickThrough(run(start(), { type: 'path', value: 'guess' }, ...typed('5'), { type: 'check' }));
    expect(s.feedback.key).toBe('aUndoGuess');
    s = run(s, { type: 'undo' });
    expect([s.path, s.sub, s.feedback.key]).toEqual(['move', null, 'aSimplerFirst']);
    let g = run(start(), { type: 'path', value: 'guess' }, ...typed('−4'), { type: 'check' });
    g = run(clickThrough(g), { type: 'nextLine' });
    expect([g.stage, owesMove(g)]).toEqual(['done', true]);
    const forced = newDivide(P(3, -4), { level: 3, forceMove: true });
    expect([forced.path, forced.feedback.key]).toEqual(['move', 'aMustMove']);
  });
  it('writes the substitution a × (value) = b, with a negative value in parentheses', () => {
    expect(substitutionSteps(P(5, 3), 3)).toEqual(['5 × 3 = 15', '15 = 15']);
    expect(substitutionSteps(P(5, 3), -2)).toEqual(['5 × (−2) = 15', '−10 = 15']);
  });
});

describe('help', () => {
  it('the first I\'m stuck outlines the number in front of x and asks what fraction leaves one box; the second points at the fraction', () => {
    let s = run(start(), { type: 'stuck' });
    expect([s.path, s.menu, s.hint, s.feedback.key, s.stuck]).toEqual(['move', 'fraction', { kind: 'coef' }, 'dStuckHint', 1]);
    s = run(s, { type: 'stuck' });
    expect([s.hint, s.feedback.key, s.stuck]).toEqual([{ kind: 'fraction', n: 3 }, 'dStuckGuided', 2]);
    expect(run(take(start(), 3), { type: 'stuck' }).feedback.key).toBe('aStuckSolved');
  });
  it('Teach me forces the right fraction', () => {
    let s = run(start(), { type: 'teach' });
    expect([s.taught, s.forced, s.hint]).toEqual([1, true, { kind: 'fraction', n: 3 }]);
    s = run(s, { type: 'take', n: 2 });
    expect(s.feedback.key).toBe('dForced');
    expect(boardText(run(s, { type: 'take', n: 3 }).board)).toBe('x = ⅓(−12)');
  });
});
