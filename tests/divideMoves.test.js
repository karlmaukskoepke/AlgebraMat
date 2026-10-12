import { describe, it, expect } from 'vitest';
import { makeDivide } from '../src/engine/divide.js';
import { newDivide, reduceDivide, boardText, answerLive, owesMove, xAlone, subView, startOverOk } from '../src/engine/divideMoves.js';
import { CHOICE_PROMPT } from '../src/engine/solveLoop.js';
import { lineText } from '../src/engine/solveTerms.js';
import { divideFeedbackText } from '../src/view/divideFeedback.js';

const run = (s, ...a) => a.reduce(reduceDivide, s);
const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const P = (a, x) => makeDivide(a, x);
const start = (p = P(3, -4)) => newDivide(p, { level: 3 });
const move = (s) => run(s, ...(s.path ? [] : [{ type: 'path', value: 'move' }]), { type: 'choose', move: 'fraction' });
const take = (s, n) => run(move(s), { type: 'take', n });
const line = (s) => divideFeedbackText(s.feedback);
// placing the value on x, then a click a line until the check is written
const clickThrough = (s) => { let t = run(s, { type: 'placeValue' }); while (t.sub && t.sub.step < t.sub.lines.length + 1) t = run(t, { type: 'nextLine' }); return t; };
const shown = (s) => subView(s.sub).lines.map(lineText);

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
  it('a fraction that does not split is a failed attempt: shown, never committed, a new try replaces it, Undo takes it back, three in a row only add "Try I’m stuck."', () => {
    let s = take(start(), 2);                                                                // 3 boxes cannot make 2 groups
    expect([boardText(s.board), s.fail.boxesSplit, s.fail.countersSplit, s.reds, s.feedback.key]).toEqual(['3x = −12', false, true, 1, 'dFail']);
    expect(s.rows.at(-1)).toMatchObject({ type: 'work', failed: true });
    s = run(s, { type: 'undo' });
    expect([s.fail, s.rows.length, s.reds, s.path, s.feedback.key]).toEqual([null, 1, 0, null, 'aChoose']);
    s = take(start(), 5);
    expect([s.fail.boxesSplit, s.fail.countersSplit, s.feedback.params.left]).toEqual([false, false, 2]);
    s = run(s, { type: 'take', n: 4 }, { type: 'take', n: 2 });                              // a new try replaces the failed one; they still count
    expect([s.rows.length, s.reds, s.feedback.key]).toEqual([2, 3, 'dFail3']);
    expect(line(s)).toContain('Try I’m stuck.');
    expect(startOverOk(s)).toBe(true);                                                       // Start over no longer waits for three reds
  });
});

describe('the prompt never changes (brief C1)', () => {
  it('after every move, a partial one included, the line is the shared prompt, and both buttons work', () => {
    let s = start(P(4, -4));                                                                  // 4x = −16
    expect(line(s)).toBe(CHOICE_PROMPT);
    s = take(s, 2);                                                                          // ½: 2x = −8
    expect(boardText(s.board)).toBe('2x = −8');
    expect([line(s), s.feedback.key, s.path]).toEqual([CHOICE_PROMPT, 'aChoose', null]);
    // Guess x leads to guess mode: the x = row is live and the moves are greyed
    const g = run(s, { type: 'path', value: 'guess' });
    expect([g.path, answerLive(g), run(g, { type: 'choose', move: 'fraction' }).feedback.key]).toEqual(['guess', true, 'aGuessing']);
    // Use a move leads to move mode: the x = row stays greyed, the fraction row goes live
    const m = run(s, { type: 'path', value: 'move' }, { type: 'choose', move: 'fraction' });
    expect([m.path, answerLive(m), m.menu]).toEqual(['move', false, 'fraction']);
    // the finishing move: x alone, no choice, the row goes live
    const f = run(m, { type: 'take', n: 2 });
    expect([boardText(f.board), answerLive(f)]).toEqual(['x = ½(−8)', true]);
  });
  it('holds at every state of every legal path from 6x = 12 and 4x = −16, and after a failed attempt is undone', () => {
    for (const [a, x] of [[6, 2], [6, -3], [4, -4], [4, 5]]) {
      for (const first of [2, 3, 6, 4].filter((n) => a % n === 0 && n < a)) {
        let s = take(start(P(a, x)), first);
        expect(xAlone(s.board)).toBe(false);
        expect(line(s)).toBe(CHOICE_PROMPT);
        s = run(s, { type: 'path', value: 'move' });                                           // acting on the choice folds the move
        expect(s.rows.map((r) => r.type)).toEqual(['eq', 'fold']);
        s = take(s, 5);                                                                       // a fraction that does not split
        s = run(s, { type: 'undo' });
        expect([line(s), s.path]).toEqual([CHOICE_PROMPT, null]);
      }
    }
  });
});

describe('folding, Undo and Start over (loop §1C, §1D, §3A)', () => {
  it('a partial move leaves two rows and the choice; acting on the choice folds it to one row; nothing before it can be undone', () => {
    let s = take(start(P(4, -4)), 2);
    expect(s.rows.map((r) => r.type)).toEqual(['eq', 'work', 'eq']);
    expect(s.history.length).toBe(1);
    s = run(s, { type: 'path', value: 'move' });
    expect(s.rows.map((r) => r.type)).toEqual(['eq', 'fold']);
    expect(s.rows[1]).toMatchObject({ label: { n: 2 } });
    expect(boardText(s.rows[1].board)).toBe('2x = −8');
    expect(s.history.length).toBe(0);
    expect(run(s, { type: 'undo' })).toBe(s);                                                // nothing is reversible after the fold
  });
  it('Undo of the current move returns to the same state with the choice showing', () => {
    const s = run(take(start(P(4, -4)), 2), { type: 'undo' });
    expect([boardText(s.board), s.rows.length, s.path, s.menu, line(s)]).toEqual(['4x = −16', 1, null, null, CHOICE_PROMPT]);
  });
  it('Start over is greyed on the untouched original and live the moment anything is done; it wipes the work and keeps the stuck count', () => {
    let s = start();
    expect(startOverOk(s)).toBe(false);
    expect(run(s, { type: 'startOver' })).toBe(s);
    s = run(s, { type: 'path', value: 'move' }, { type: 'stuck' }, { type: 'stuck' });
    expect([startOverOk(s), s.stuck]).toEqual([true, 2]);
    s = run(s, { type: 'choose', move: 'fraction' }, { type: 'take', n: 3 }, { type: 'startOver' });
    expect([boardText(s.board), s.rows.length, s.path, s.scaffold, s.stuck, line(s)]).toEqual(['3x = −12', 1, null, false, 2, CHOICE_PROMPT]);
  });
});

describe('plugging a typed value back in (loop §4)', () => {
  it('a right value: placed on x, then a line a click, then the problem is done', () => {
    let s = run(take(start(), 3), ...typed('−4'), { type: 'check' });
    expect([s.sub.kind, s.sub.ok, s.sub.placing, s.sub.target, s.feedback.key]).toEqual(['value', true, true, 'original', 'aPlace']);
    expect(shown(s)).toEqual([]);                                                            // nothing is written until the value is placed on x
    s = run(s, { type: 'placeValue' });
    expect(shown(s)).toEqual(['3 × (−4) = −12']);
    s = run(s, { type: 'nextLine' });
    expect(shown(s)).toEqual(['3 × (−4) = −12', '−12 = −12']);
    s = run(s, { type: 'nextLine' });
    expect([s.stage, s.finalText, s.clean, s.feedback.key, subView(s.sub).mark]).toEqual(['done', '−4', true, 'aCorrect', true]);
  });
  it('B1: a correct guess renders the equation as written, with the coefficient, on every form, at the first state and after a partial move', () => {
    for (const [a, x] of [[2, -5], [3, 4], [4, -6], [5, 3], [6, -3], [3, -4]]) {
      const p = P(a, x);
      const first = shown(run(start(p), { type: 'path', value: 'guess' }, ...typed(String(x)), { type: 'check' }, { type: 'placeValue' }))[0];
      expect(first).toBe(`${a} × ${x < 0 ? `(−${-x})` : x} = ${p.b < 0 ? `−${-p.b}` : p.b}`);
    }
    // after a partial move: a correct guess is plugged into the ORIGINAL equation, not the simplified one
    const s = run(take(start(P(6, -3)), 2), { type: 'path', value: 'guess' }, ...typed('−3'), { type: 'check' }, { type: 'placeValue' });
    expect([s.sub.target, shown(s)[0]]).toEqual(['original', '6 × (−3) = −18']);
  });
  it('a wrong guess is plugged into the CURRENT equation, ends red, asks for Undo, then points at the move', () => {
    let s = take(start(P(6, -3)), 2);                                                         // 3x = −9
    s = clickThrough(run(s, { type: 'path', value: 'guess' }, ...typed('5'), { type: 'check' }));
    expect([s.sub.target, shown(s)[0], s.sub.ok, s.feedback.key]).toEqual(['current', '3 × 5 = −9', false, 'aUndoGuess']);
    s = run(s, { type: 'undo' });
    expect([s.path, s.sub, s.feedback.key]).toEqual(['move', null, 'aSimplerFirst']);
  });
  it('a wrong value names the slip at the end, shows the full check, and clears the row', () => {
    const wrong = (typed_) => clickThrough(run(take(start(), 3), ...typed(typed_), { type: 'check' }));
    const s = wrong('−36');
    expect([s.feedback.key, s.feedback.params.tag, s.entry, s.stage]).toEqual(['dWrong', 'multiplied', '', 'moves']);
    expect(wrong('−9').feedback.params.tag).toBe('undid-add');
    expect(wrong('−6').feedback).toMatchObject({ params: { tag: 'wrong-groups', groups: 2 } });
  });
  it('a correct guess at the first state owes a move; a student who made a move first is free', () => {
    let g = clickThrough(run(start(), { type: 'path', value: 'guess' }, ...typed('−4'), { type: 'check' }));
    expect([g.stage, owesMove(g)]).toEqual(['done', true]);
    const forced = newDivide(P(3, -4), { level: 3, forceMove: true });
    expect([forced.path, forced.feedback.key]).toEqual(['move', 'aMustMove']);
    g = clickThrough(run(take(start(P(6, -3)), 2), { type: 'path', value: 'guess' }, ...typed('−3'), { type: 'check' }));
    expect([g.stage, owesMove(g)]).toEqual(['done', false]);
  });
});

describe('I’m stuck: rungs restart at each state; the diagram is on every rung, at x alone too (brief B2)', () => {
  it('rung 1 shows the counters with the number in front outlined; rung 2 the fractions; rung 3 the guided fraction', () => {
    let s = run(start(), { type: 'path', value: 'move' }, { type: 'stuck' });
    expect([s.scaffold, s.hint, s.feedback.key, answerLive(s), s.stuck]).toEqual([true, { kind: 'coef' }, 'dModel', true, 1]);
    s = run(s, { type: 'stuck' });
    expect([s.menu, s.feedback.key, answerLive(s), s.stuck]).toEqual(['fraction', 'dStuck2', false, 2]);
    s = run(s, { type: 'stuck' });
    expect([s.hint, s.feedback.key, s.stuck]).toEqual([{ kind: 'fraction', n: 3 }, 'dStuckGuided', 3]);
  });
  it('the counters are dealt by hand, one group kept, and that takes the fraction of both sides', () => {
    let s = run(start(), { type: 'path', value: 'move' }, { type: 'stuck' }, { type: 'stuck' }, { type: 'take', n: 3 });
    expect(s.deal).toEqual({ n: 3, groups: [0, 0, 0] });
    expect(run(s, { type: 'keep', group: 0 }).feedback.key).toBe('dShareFirst');
    for (let i = 0; i < 12; i++) s = run(s, { type: 'deal', group: i % 3 });
    expect(s.feedback.key).toBe('dKeepReady');
    s = run(s, { type: 'keep', group: 1 });
    expect([boardText(s.board), s.deal, s.scaffold]).toEqual(['x = ⅓(−12)', null, false]);          // the new state starts bare
  });
  it('after a partial move the rungs start again at the model, drawn for the new state', () => {
    let s = run(take(start(P(6, -3)), 2), { type: 'path', value: 'move' }, { type: 'stuck' });
    expect([boardText(s.board), s.feedback.key, s.hint, s.stuck]).toEqual(['3x = −9', 'dModel', { kind: 'coef' }, 1]);
  });
  it('at x = ⅓(6): the diagram on every rung, the equation never leaves, no numeral is printed', () => {
    const at = (a, x) => take(start(P(a, x)), a);
    for (const [a, x] of [[3, 2], [5, 7], [6, -3]]) {
      let s = at(a, x);
      const rows = s.rows.length;
      s = run(s, { type: 'stuck' });
      expect([s.rows.length, s.diag.n, s.diag.size, s.diag.groups, s.feedback.key]).toEqual([rows, a, Math.abs(a * x), null, 'dDiag1']);
      expect(s.diag.neg).toBe(x < 0);
      expect(line(s)).toContain(`Share the ${Math.abs(a * x)} into ${a} equal groups`);
      s = run(s, { type: 'stuck' });
      expect([s.rows.length, s.diag.groups, s.diag.kept, s.feedback.key]).toEqual([rows, Array(a).fill(0), null, 'dDiag2']);
      for (let i = 0; i < Math.abs(x) * a; i++) s = run(s, { type: 'deal', group: i % a });
      expect(s.diag.groups).toEqual(Array(a).fill(Math.abs(x)));
      expect(s.feedback.key).toBe('dKeepReady');
      expect(line(s)).not.toMatch(new RegExp(`(^|\\D)${Math.abs(x)}(\\D|$)`));                  // even groups: the size of a group is what the student finds
      s = run(s, { type: 'keep', group: 0 });
      expect([s.diag.kept, s.feedback.key, s.rows.length]).toEqual([0, 'dDiagKept', rows]);
      s = run(s, { type: 'stuck' });
      expect([s.rows.length, s.diag.groups, s.diag.kept, s.diag.guided, s.feedback.key]).toEqual([rows, Array(a).fill(Math.abs(x)), 0, true, 'dDiag3']);
      expect(line(s)).not.toContain(String(Math.abs(x)));                                      // no numeral is printed
      expect(answerLive(s)).toBe(true);                                                         // the student counts the kept group and types it
    }
  });
});

describe('the lights, and the greyed moves', () => {
  it('Smaller numbers and One box are judged after the move; a partial move leaves One box grey', () => {
    expect(take(start(P(6, -3)), 2).lights).toEqual({ smaller: 'green', onebox: 'off' });
    expect(take(start(), 3).lights).toEqual({ smaller: 'green', onebox: 'green' });
  });
  it('a greyed move from an earlier card says it is not needed; from a later card, that it unlocks later', () => {
    const s = start();
    expect(run(s, { type: 'greyMove', move: 'add' }).feedback.key).toBe('aNotNeeded');
    expect(run(s, { type: 'greyMove', move: 'trade' }).feedback.key).toBe('aNotNeeded');
    expect(run(s, { type: 'greyMove', move: 'flip' }).feedback.key).toBe('aLater');
    expect(run(s, { type: 'greyMove', move: 'distribute' }).feedback.key).toBe('aLater');
  });
});
