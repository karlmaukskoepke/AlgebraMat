import { describe, it, expect } from 'vitest';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { reduceAddBoth } from '../src/engine/cards/add.js';
import { newLightsSession, withLights, ADD_SPOT } from '../src/engine/addBothLights.js';
import { makeDivide } from '../src/engine/divide.js';
import { newDivide, reduceDivide, DIVIDE_SPOT } from '../src/engine/divideMoves.js';
import { withSpotlight, spotOf } from '../src/engine/spotlight.js';
import { withFractionBlank } from '../src/engine/divideBlank.js';
import { divideFeedbackText } from '../src/view/divideFeedback.js';

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
    const g = run(add, start(), ...typed('4'), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(spotOf(g, ADD_SPOT)).toMatchObject({ kind: 'error', target: 'subst' });
    expect(spotOf(run(add, g, { type: 'undo' }), ADD_SPOT)).toMatchObject({ kind: 'hint', target: 'xnum' });
  });
  it('a wrong value: Undo only closes the pop-up (nothing to take back), then the x-alone reminder', () => {
    let s = run(add, move(start(), -8), { type: 'lxNext' }, ...typed('3'), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(spotOf(s, ADD_SPOT)).toMatchObject({ kind: 'error', target: 'subst' });
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
  it('lights the side that broke; Undo, then the boxes and the fractions to choose from (Build D)', () => {
    let s = run(div, newDivide(makeDivide(5, -3), { level: 3 }), { type: 'choose', move: 'fraction' }, { type: 'take', n: 2 });
    expect(spotOf(s, DIVIDE_SPOT)).toMatchObject({ kind: 'error', target: 'failSide' });
    expect(run(div, s, { type: 'take', n: 5 })).toBe(s);
    s = run(div, s, { type: 'undo' });
    expect(spotOf(s, DIVIDE_SPOT)).toMatchObject({ kind: 'hint', target: 'coef', choose: true });
    expect([s.feedback.key, s.hint.kind, s.reds]).toEqual(['dWhichFraction', 'coef', 1]);
  });
});

// Build D, Part 2: checking a value, and the slips that shape the hint after Undo
describe('Build D: the value checked is dragged into x; a slip shapes the hint after Undo', () => {
  it('the value waits to be dragged into x, then the copy and a line a Next', () => {
    let s = run(add, start(), ...typed('4'), { type: 'check' });
    expect([s.sub.placing, s.sub.step, s.feedback.key]).toEqual([true, 0, 'aPlace']);
    expect(run(add, s, { type: 'nextLine' })).toBe(s);
    s = run(add, s, { type: 'placeValue' });
    expect([s.sub.placing, s.sub.step]).toEqual([false, 1]);
  });
  it('typing the opposite of the number next to x: its own words, then the Add move with that amount in the blank', () => {
    let s = run(add, start(), ...typed('−8'), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect([s.sub.tag, s.feedback.key, spotOf(s, ADD_SPOT)?.kind]).toEqual(['gave-opposite', 'aUndoGuess', 'error']);
    s = run(add, s, { type: 'undo' });
    expect([s.feedback.key, s.menu, s.amountEntry, s.spot.move]).toEqual(['aOppHint', 'add', '-8', 'add']);
  });
  it('added sizes at x alone: after Undo, party or battle at the two numbers', () => {
    const eleven = newLightsSession({ ...makeAddBoth('x+a', 8, 3), logLevel: 2 }, { level: 2 });            // x + 8 = 11 → x = 11 − 8
    let s = run(add, move(eleven, -8), { type: 'lxNext' }, ...typed('19'), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect([s.feedback.key, s.feedback.params.tag]).toEqual(['aWrong', 'wrong-op']);                         // 19 is also 11 + 8: the tag stays
    s = run(add, s, { type: 'undo' });
    expect([s.feedback.key, s.alone?.step, spotOf(s, ADD_SPOT)?.kind]).toEqual(['aAlonePB', 'pb', 'ask']);
  });
});

describe('Build D-2: an addition that did not cancel is said in the student\'s numbers', () => {
  it('+8 added to x + 8: "+8 + +8 did not eliminate the term", the two added numbers lit with the sum', () => {
    const s = move(start(), 8);
    expect([s.feedback.key, s.feedback.params.before, s.feedback.params.added]).toEqual(['aRed', '+8', '+8']);
    expect(spotOf(s, ADD_SPOT)).toMatchObject({ kind: 'error', target: 'xnum', label: 'got bigger', lit: ['workpair'] });
  });
});

describe('Build D-2, Parts 2 and 5: the x = cursor; the seesaw’s Add typed once', () => {
  it('x = shows its cursor once clicked, until anything else happens', () => {
    let s = run(add, start(), { type: 'focus', target: 'answer' });
    expect(s.ui.fieldCursor).toBe(true);
    s = run(add, s, { type: 'digit', digit: 3 });
    expect(s.ui.fieldCursor).toBe(false);
    s = run(add, start(), { type: 'focus', target: 'answer' }, { type: 'ui', patch: { fieldCursor: false } });
    expect(s.ui.fieldCursor).toBe(false);
  });
  it('the number typed once goes onto both sides; typing again takes it back off first; Go commits it', () => {
    let s = run(add, start(), { type: 'stuck' }, { type: 'stuck' });
    expect(s.scaffold).toBeTruthy();
    if (s.menu !== 'add') s = run(add, s, { type: 'choose', move: 'add' });
    s = run(add, s, ...typed('-8'));
    expect([s.pending?.both, s.pending?.auto, s.leftDelta, s.rightDelta]).toEqual([true, true, -8, -8]);
    s = run(add, s, { type: 'backspace' });
    expect([s.pending, s.leftDelta, s.rightDelta, s.amountEntry]).toEqual([null, 0, 0, '-']);
    s = run(add, s, ...typed('8'), { type: 'go' });
    expect([s.pending, s.menu, s.history.length > 0]).toEqual([null, null, true]);
  });
});

// Build F, Part 3: the help gaps
describe('Build F: Divide it\'s reminder after Undo, and a wrong seesaw move\'s picture', () => {
  const div = withSpotlight(withFractionBlank(reduceDivide), DIVIDE_SPOT);              // (as the app composes it)
  it('Divide: after Undo the Divide button (Build O) is lit with its preview, said in real numbers, and recorded as a reminder', () => {
    let s = run(div, newDivide(makeDivide(5, -3), { level: 3 }), ...typed('4'), { type: 'check' }, { type: 'placeValue' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(spotOf(s, DIVIDE_SPOT)).toMatchObject({ kind: 'error' });
    s = run(div, s, { type: 'undo' });
    expect(spotOf(s, DIVIDE_SPOT)).toMatchObject({ kind: 'hint', target: 'coef', move: 'divOption' });
    expect([s.feedback.key, s.feedback.params.boxes, s.feedback.params.frac, s.mopts, s.ui.preview]).toEqual(['dReminder', 5, '⅕', { kind: null, entry: '', lit: 'div' }, 'div']);
    expect(divideFeedbackText(s.feedback)).toBe('To get one x, divide both sides by 5 (that is, multiply by ⅕): one of the 5 x boxes is ⅕.');
    expect(s.supportsShown).toContain('hint');
    // the lit option is the move: picking it opens Divide's blank (and the hint goes)
    const f = run(div, s, { type: 'divPick' });
    expect([spotOf(f, DIVIDE_SPOT), f.mopts]).toEqual([null, { kind: 'div', entry: '' }]);
  });
  it('the seesaw: a move that only partly cancels is an error over its picture, the pair beside x kept for it; Undo, then the reminder', () => {
    let s = run(add, start(), { type: 'stuck' }, { type: 'stuck' });                       // Level 3 (saved 4): the seesaw, Add open
    expect([s.scaffold, s.menu]).toEqual([true, 'add']);
    s = run(add, s, ...typed('-3'), { type: 'go' }, { type: 'kind', value: 'battle' }, { type: 'crossNext' }, { type: 'kind', value: 'party' });
    expect(spotOf(s, ADD_SPOT)).toMatchObject({ kind: 'error', target: 'slip', label: 'still here', lit: ['slipOther'] });
    expect(s.slipPair).toMatchObject({ a: 8, b: -3, kind: 'battle' });
    expect(run(add, s, { type: 'stuck' })).toBe(s);                                       // only Undo
    s = run(add, s, { type: 'undo' });
    expect(spotOf(s, ADD_SPOT)).toMatchObject({ kind: 'hint', target: 'xnum', move: 'add' });
    expect([s.feedback.key, s.slipPair, s.scaffold]).toEqual(['aStuckHint', undefined, true]);
  });
  it('the seesaw: a move that makes the number beside x bigger is "got bigger"; a right move keeps no picture', () => {
    const red = run(add, start(), { type: 'stuck' }, { type: 'stuck' }, ...typed('3'), { type: 'go' }, { type: 'kind', value: 'party' }, { type: 'kind', value: 'battle' });
    expect(spotOf(red, ADD_SPOT)).toMatchObject({ kind: 'error', target: 'slip', label: 'got bigger' });
    expect(red.slipPair).toMatchObject({ a: 8, b: 3, kind: 'party' });
    const right = run(add, start(), { type: 'stuck' }, { type: 'stuck' }, ...typed('-8'), { type: 'go' }, { type: 'kind', value: 'battle' }, { type: 'crossNext' }, { type: 'kind', value: 'party' });
    expect([spotOf(right, ADD_SPOT)?.kind ?? null, right.slipPair]).toEqual([null, undefined]);
  });
});
