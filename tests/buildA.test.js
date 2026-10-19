// Build A (docs/build-a/SPEC-BUILD-A-ADD-HELP-AND-PARITY.md, P1): Add's help reads the equation on screen, never writes the value,
// and says "Undo first" while a move waits for Undo, on Add and on the shared loop (Divide).
import { describe, it, expect } from 'vitest';
import { newAddBoth, reduceAddBoth, boardText } from '../src/engine/addBothMoves.js';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { newDivide, reduceDivide } from '../src/engine/divideMoves.js';
import { makeDivide } from '../src/engine/divide.js';
import { addBothFeedbackText } from '../src/view/addBothFeedback.js';
import { divideFeedbackText } from '../src/view/divideFeedback.js';

const run = (reduce) => (s, ...actions) => actions.reduce((st, a) => reduce(st, a), s);
const add = run(reduceAddBoth);
const div = run(reduceDivide);
const type = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const addMove = (k) => [{ type: 'choose', move: 'add' }, ...type(k), { type: 'go' }];
const stuck = { type: 'stuck' };

// x + 8 = −4 (answer −12); adding −5 leaves x + 3 = −4 + −5
const start = () => newAddBoth(makeAddBoth('x+a', 8, -12), { level: 4 });
const partial = () => add(start(), ...addMove(-5));

// A partial move made inside the seesaw: −5 to both sides, the +8 and −5 beside x combine to +3, the other side stays −4 + −5.
// (Build D: a battle's pairs stay crossed off until Next)
const scaffoldPartial = () => add(start(), stuck, stuck, { type: 'choose', move: 'add' }, ...type(-5), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' },
  { type: 'kind', value: 'battle' }, { type: 'crossNext' }, { type: 'kind', value: 'party' });

describe('Add: the guided rung and Teach me use the number now next to x', () => {
  it('after a partial move in the seesaw, the guided rung offers the opposite of the +3 now there, not of the original +8', () => {
    let s = scaffoldPartial();
    expect([boardText(s.board), s.lights.fewer]).toEqual(['x + 3 = −4 + −5', 'neutral']);
    s = add(s, stuck, stuck);
    expect([s.feedback.key, s.amountEntry, s.hint]).toEqual(['aStuck3', '-3', { kind: 'amount', amount: -3 }]);
    expect(addBothFeedbackText(s.feedback)).toBe('−3 cancels the +3. Add it to both sides yourself.');
  });
  it('Teach me there accepts the amount that works and refuses the original one', () => {
    let s = add(scaffoldPartial(), { type: 'teach' });
    expect([s.forcedAmount, s.amountEntry]).toEqual([-3, '-3']);
    expect(add(s, { type: 'addTo', side: 'left', amount: -8 }).feedback.key).toBe('aForced');
    s = add(s, { type: 'addTo', side: 'left', amount: -3 }, { type: 'addTo', side: 'right', amount: -3 }, { type: 'go' });
    expect(s.feedback.key).toBe('aPartyOrBattle');                                      // accepted: the pair beside x is asked about
  });
  it('a partial move is said in the student\'s numbers: the +8 there was and the −5 added (Build D-2)', () => {
    expect(addBothFeedbackText(partial().feedback)).toBe('+8 was only partially canceled by the −5 you added. What value instead of −5 would have completely canceled the +8?');
    expect(partial().feedback.params.con).toBe('+3');                                    // the number left, still named for the hint
  });
  it('on the bare screen the same partial move waits for Undo, so I\'m stuck says Undo first', () => {
    expect([add(partial(), stuck).feedback.key, add(partial(), stuck).feedback.params.reason]).toEqual(['aUndoFirstHelp', 'partial']);
  });
});

describe('Add: x alone with two numbers on the other side (Build C, Part 3 replaces the words-only help)', () => {
  const alone = () => add(start(), ...addMove(-8));
  it('asks Party or battle at the numbers, then the counters; the value is never written', () => {
    let s = add(alone(), stuck);
    expect(s.feedback.key).toBe('aAlonePB');
    s = add(s, { type: 'kind', value: 'party' }, stuck);
    expect([s.feedback.key, s.alone.walk.step, boardText(s.board)]).toEqual(['aAloneCounters', 'draw', 'x = −4 + −8']);
    for (const k of ['aAlonePB', 'aAloneRight', 'aAloneCounters', 'aAloneCount']) expect(addBothFeedbackText({ key: k, params: { sum: '−4 + −8', kind: 'party' } })).not.toContain('12');
  });
  it('Teach me starts at party or battle at the numbers (Build D), never says to add again, and counts as a Teach me', () => {
    const s = add(alone(), { type: 'teach' });
    expect([s.feedback.key, s.alone.step, s.forced, s.scaffold, s.taught, s.amountEntry]).toEqual(['aAlonePB', 'pb', false, false, 1, '']);
    expect(add(s, { type: 'teach' }).alone.step).toBe('counters');                       // asked again: the counters
  });
});

describe('Add: Party / Battle never writes the answer', () => {
  it('a right pick on the other side confirms; the numbers stay and x = is still empty', () => {
    let s = add(start(), stuck, stuck, { type: 'choose', move: 'add' }, ...type(-8), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });
    s = add(s, { type: 'kind', value: 'battle' }, { type: 'crossNext' });               // +8 and −8 beside x cancel (crossed off, then Next)
    expect(boardText(s.board)).toBe('x = −4 + −8');
    expect(add(s, { type: 'kind', value: 'battle' }).feedback.key).toBe('aKindWrong');   // a wrong pick: the old nudge
    s = add(s, { type: 'kind', value: 'party' });
    expect([boardText(s.board), s.entry, s.combining, addBothFeedbackText(s.feedback)]).toEqual(['x = −4 + −8', '', null, 'Yes, a party: the teams join. Work it out and type x.']);
  });
});

describe('Undo first', () => {
  it('Add: I\'m stuck after a red move says so, opens nothing, and counts; after Undo the ladder starts again', () => {
    let s = add(start(), ...addMove(8));
    s = add(s, stuck);
    expect([s.feedback.key, s.feedback.params.reason, s.scaffold, s.hint, s.stuck, s.supportsShown]).toEqual(['aUndoFirstHelp', 'red', false, null, 1, ['hint']]);
    expect(addBothFeedbackText(s.feedback)).toBe('That move made the equation bigger. Let’s undo it first: press Undo.');
    s = add(s, { type: 'undo' }, stuck);
    expect([boardText(s.board), s.feedback.key, s.stuck]).toEqual(['x + 8 = −4', 'aStuckHint', 2]);   // rung 0 on the restored state
  });
  it('Add: the other side zeroed, and Teach me, give the same first rung', () => {
    const s = add(start(), ...addMove(4), { type: 'teach' });
    expect([s.feedback.params.reason, s.taught, s.forced, s.scaffold]).toEqual(['zero', 1, false, false]);
  });
  it('Divide (shared loop): a fraction that does not split, then I\'m stuck, then Undo and I\'m stuck again', () => {
    let s = div(newDivide(makeDivide(5, -3), { level: 3 }), { type: 'choose', move: 'fraction' }, { type: 'take', n: 2 }, stuck);
    expect([s.feedback.key, s.scaffold, s.stuck, s.supportsShown]).toEqual(['aUndoFirstHelp', false, 1, ['hint']]);
    expect(divideFeedbackText(s.feedback)).toBe('That fraction doesn’t split evenly. Let’s undo it first: press Undo.');
    s = div(s, { type: 'undo' }, stuck);
    expect([s.feedback.key, s.scaffold, s.stuck]).toEqual(['dModel', true, 2]);         // the ladder's first rung on the restored state
  });
});
