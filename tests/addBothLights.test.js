import { describe, it, expect } from 'vitest';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { reduceAddBoth, newAddBoth, boardText } from '../src/engine/addBothMoves.js';
import {
  newLightsSession, withLights, lightsAnswerLive, blankOpen, moveOwed, lightsSummary,
} from '../src/engine/addBothLights.js';
import { makeRecord } from '../src/engine/eventlog.js';

const reduce = withLights(reduceAddBoth);
const run = (s, ...actions) => actions.reduce(reduce, s);
const typed = (text) => [...text].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const start = () => newLightsSession({ ...makeAddBoth('x+a', 8, 3), logLevel: 2 }, { level: 2 });   // x + 8 = 11, x = 3
const choose = { type: 'choose', move: 'add' };
const steps = (s) => run(s, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' });

describe('?ui=lights: no Guess x / Use a move choice (idea C)', () => {
  it('opens on "Find x." with x = live and the Add move usable at once', () => {
    const s = start();
    expect(s.feedback.key).toBe('lxFindX');
    expect(lightsAnswerLive(s)).toBe(true);
    expect(run(s, choose).menu).toBe('add');
  });
  it('a typed value before any move is a guess, checked against the original', () => {
    let s = run(start(), ...typed('5'), { type: 'check' });
    expect(s.sub.kind).toBe('guess');
    s = steps(s);
    expect(s.feedback.key).toBe('aUndoGuess');
    s = run(s, { type: 'undo' });
    expect([s.sub, s.entry, s.feedback.key]).toEqual([null, '', 'aSimplerFirst']);
    expect(lightsSummary(s).typedBeforeMove).toBe(true);
  });
  it('a correct guess on the original asks for the move on the same problem: x = greys, Add pulses, then it comes back', () => {
    let s = steps(run(start(), ...typed('3'), { type: 'check' }));
    expect(s.stage).toBe('moves');
    expect(s.feedback.key).toBe('lxShowMove');
    expect(moveOwed(s)).toBe(true);
    expect(lightsAnswerLive(s)).toBe(false);
    expect(run(s, ...typed('3'))).toBe(s);                                   // greyed: typing does nothing
    s = run(s, choose, ...typed('-8'), { type: 'go' });
    expect(moveOwed(s)).toBe(false);
    expect(lightsAnswerLive(s)).toBe(true);
    s = steps(run(s, ...typed('3'), { type: 'check' }));
    expect(s.stage).toBe('done');
    expect(s.lx.guessedRight).toBe(true);
  });
});

describe('?ui=lights: the preview and the blank (ideas A and B)', () => {
  it('the preview is view state only; on touch the first tap previews and the second chooses', () => {
    const s = start();
    const p = run(s, { type: 'ui', patch: { preview: true } });
    expect(p.ui.preview).toBe(true);
    expect(p.board).toBe(s.board);
    const t1 = run(s, { ...choose, touch: true });
    expect([t1.ui.preview, t1.menu]).toEqual([true, null]);
    const t2 = run(t1, { ...choose, touch: true });
    expect([t2.menu, t2.ui.preview, t2.ui.focus]).toEqual(['add', false, 'blank']);
    expect(t2.lx.log).toMatchObject({ previews: 1, chosenAfterPreview: 1 });
  });
  it('hovering on and off again before doing anything counts as one look', () => {
    const s = run(start(), { type: 'ui', patch: { preview: true } }, { type: 'ui', patch: { preview: false } }, { type: 'ui', patch: { preview: true } });
    expect(s.lx.log.previews).toBe(1);
  });
  it('choosing again, or Esc, cancels back to S0 with the blank cleared', () => {
    const open = run(start(), choose, ...typed('-8'));
    expect(open.amountEntry).toBe('-8');
    for (const s of [run(open, choose), run(open, { type: 'lxCancel' })]) {
      expect([s.menu, s.amountEntry, blankOpen(s), s.feedback.key]).toEqual([null, '', false, 'lxFindX']);
    }
  });
  it('digits go to the open blank first; a tap on x = takes them there', () => {
    let s = run(start(), choose, ...typed('8'));
    expect([s.amountEntry, s.entry]).toEqual(['8', '']);
    s = run(s, { type: 'focus', target: 'answer' }, ...typed('4'));
    expect([s.amountEntry, s.entry]).toEqual(['8', '4']);
    s = run(s, { type: 'focus', target: 'amount' }, { type: 'backspace' });
    expect(s.amountEntry).toBe('');
  });
  it('apply with an empty box does nothing but shake it', () => {
    const open = run(start(), choose);
    const s = run(open, { type: 'go' });
    expect([s.ui.shake, s.history.length, s.rows.length, s.feedback]).toEqual([true, 0, 1, open.feedback]);
  });
  it('the move runs through the card\'s own go: the work row, then x = 11 + −8, then Next commits it', () => {
    let s = run(start(), choose, ...typed('-8'), { type: 'go' });
    expect(s.rows.map((r) => r.type)).toEqual(['eq', 'work', 'eq']);
    expect(boardText(s.board)).toBe('x = 11 + −8');                            // the other side is never combined
    expect(s.lights).toEqual({ fewer: 'green', solved: 'green' });
    expect([s.lx.awaitNext, s.history.length, s.ui.focus]).toEqual([2, 1, 'next']);
    s = run(s, { type: 'lxNext' });
    expect([s.lx.awaitNext, s.lx.rules, s.history.length]).toEqual([null, [2], 0]);
    expect(run(s, { type: 'undo' })).toBe(s);                                  // Undo no longer reaches it
    expect(s.lx.log.nextPressed).toBe(1);
  });
  it('typing in x = or Check commits the waiting move instead (never blocks)', () => {
    const s = run(start(), choose, ...typed('-8'), { type: 'go' }, ...typed('3'));
    expect([s.entry, s.lx.awaitNext, s.lx.rules, s.lx.log.implicitCommits]).toEqual(['3', null, [2], 1]);
  });
  it('an unhelpful amount is the red path; Undo puts the student back in S2 with the box cleared and focused', () => {
    let s = run(start(), choose, ...typed('8'), { type: 'go' });
    expect([s.lights.fewer, s.undoCue, s.lx.awaitNext, s.feedback.key]).toEqual(['red', true, null, 'aRed']);
    expect(s.lx.log.sameSignRed).toBe(1);
    s = run(s, { type: 'undo' });
    expect([blankOpen(s), s.amountEntry, s.ui.focus, s.rows.length]).toEqual([true, '', 'blank', 1]);
  });
  it('a partly cancelling move keeps today\'s grey; a 0 is allowed and simply does not help', () => {
    expect(run(start(), choose, ...typed('-3'), { type: 'go' }).lights.fewer).toBe('neutral');
    const z = run(start(), choose, ...typed('0'), { type: 'go' });
    expect([z.lights.fewer, z.feedback.key, z.undoCue]).toEqual(['neutral', 'lxZero', true]);
  });
  it('a dragged number fills the blank (from S0 too)', () => {
    const s = run(start(), { type: 'setAmount', value: 8 });
    expect([blankOpen(s), s.amountEntry, s.feedback.key]).toEqual([true, '8', 'aAmountSet']);
  });
  it('I\'m stuck\'s first rung opens the blank in the equation row (cleared); the next brings in the seesaw', () => {
    let s = run(start(), { type: 'stuck' });
    expect([blankOpen(s), s.amountEntry, s.hint?.kind, s.feedback.key]).toEqual([true, '', 'cancel', 'aStuckHint']);
    s = run(s, { type: 'stuck' });
    expect(s.scaffold).toBe(true);
    expect(s.lx.log.stuck).toBe(2);
  });
});

describe('?ui=lights: the log', () => {
  it('a finished problem\'s summary, and typedBeforeMove rides on the card\'s own record only when set', () => {
    const s = steps(run(start(), { type: 'ui', patch: { preview: true } }, choose, ...typed('-8'), { type: 'go' }, { type: 'lxNext' }, ...typed('3'), { type: 'check' }));
    expect(s.stage).toBe('done');
    expect(lightsSummary(s)).toMatchObject({ level: 2, previews: 1, previewedBeforeChoose: true, typedBeforeMove: false, sameSignRed: 0, nextPressed: 1, stuck: 0, teach: 0 });
    const meta = { t: 1, pack: 'add-both', level: 2, problem: 'x + 8 = 11' };
    expect(makeRecord({ ...s, typedBeforeMove: false }, meta).typedBeforeMove).toBe(false);
    const plain = newAddBoth(makeAddBoth('x+a', 8, 3), { level: 2 });
    expect('typedBeforeMove' in makeRecord(plain, meta)).toBe(false);
  });
});
