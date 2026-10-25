import { describe, it, expect } from 'vitest';
import { makeDivide } from '../src/engine/divide.js';
import { newDivide, reduceDivide, boardText, answerLive, owesMove, xAlone, subView, startOverOk } from '../src/engine/divideMoves.js';
import { lineText } from '../src/engine/solveTerms.js';
import { divideFeedbackText } from '../src/view/divideFeedback.js';

const run = (s, ...a) => a.reduce(reduceDivide, s);
const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const P = (a, x) => makeDivide(a, x);
const start = (p = P(3, -4)) => newDivide(p, { level: 3 });
const move = (s) => run(s, { type: 'choose', move: 'fraction' });
const FIND_X = 'Find x.';
const take = (s, n) => run(move(s), { type: 'take', n });
const line = (s) => divideFeedbackText(s.feedback);
// placing the value on x, then a click a line until the check is written
const clickThrough = (s) => { let t = run(s, { type: 'placeValue' }); while (t.sub && t.sub.step < t.sub.lines.length + 1) t = run(t, { type: 'nextLine' }); return t; };
const shown = (s) => subView(s.sub).lines.map(lineText);

describe('no choice: the move and x = are live at every state (Build C)', () => {
  it('starts on "Find x."; the fraction move is live at once, and so is the answer row (a value typed now is a guess)', () => {
    const s = start();
    expect([s.feedback.key, line(s), boardText(s.board), answerLive(s)]).toEqual(['aFindX', FIND_X, '3x = −12', true]);
    expect(run(s, { type: 'choose', move: 'fraction' }).menu).toBe('fraction');
    expect(run(s, ...typed('5')).entry).toBe('5');
    expect(run(s, { type: 'path', value: 'guess' })).toBe(s);                                 // the old choice is gone: nothing happens
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
    expect([s.fail, s.rows.length, s.reds, s.feedback.key]).toEqual([null, 1, 0, 'dUndone']);
    s = take(start(), 5);
    expect([s.fail.boxesSplit, s.fail.countersSplit, s.feedback.params.left]).toEqual([false, false, 2]);
    s = run(s, { type: 'take', n: 4 }, { type: 'take', n: 2 });                              // a new try replaces the failed one; they still count
    expect([s.rows.length, s.reds, s.feedback.key]).toEqual([2, 3, 'dFail3']);
    expect(line(s)).toContain('Try I’m stuck.');
    expect(startOverOk(s)).toBe(true);                                                       // Start over no longer waits for three reds
  });
});

describe('the prompt (Build C)', () => {
  it('after a partial move the line is the prompt again; a value typed then is a guess; a move goes on as usual', () => {
    let s = start(P(4, -4));                                                                  // 4x = −16
    expect(line(s)).toBe(FIND_X);
    s = take(s, 2);                                                                          // ½: 2x = −8
    expect([boardText(s.board), line(s), answerLive(s)]).toEqual(['2x = −8', FIND_X, true]);
    const g = run(s, ...typed('4'), { type: 'check' });
    expect(g.sub.kind).toBe('guess');
    const m = run(s, { type: 'choose', move: 'fraction' });
    expect(m.menu).toBe('fraction');
    const f = run(m, { type: 'take', n: 2 });
    expect([boardText(f.board), answerLive(f)]).toEqual(['x = ½(−8)', true]);
  });
  it('holds at every state of every legal path from 6x = 12 and 4x = −16; a failed attempt undone says so', () => {
    for (const [a, x] of [[6, 2], [6, -3], [4, -4], [4, 5]]) {
      for (const first of [2, 3, 6, 4].filter((n) => a % n === 0 && n < a)) {
        let s = take(start(P(a, x)), first);
        expect(xAlone(s.board)).toBe(false);
        expect(line(s)).toBe(FIND_X);
        s = take(s, 5);                                                                       // the next move folds the first; ⅕ does not split
        expect(s.rows.map((r) => r.type)).toEqual(['eq', 'fold', 'work']);
        s = run(s, { type: 'undo' });
        expect(s.feedback.key).toBe('dUndone');
      }
    }
  });
});

describe('folding, Undo and Start over (loop §1C, §1D, §3A)', () => {
  it('a partial move leaves two rows; going on (here, typing a value) folds it to one row; nothing before it can be undone', () => {
    let s = take(start(P(4, -4)), 2);
    expect(s.rows.map((r) => r.type)).toEqual(['eq', 'work', 'eq']);
    expect(s.history.length).toBe(1);
    s = run(s, ...typed('4'));
    expect(s.rows.map((r) => r.type)).toEqual(['eq', 'fold']);
    expect(s.rows[1]).toMatchObject({ label: { n: 2 } });
    expect(boardText(s.rows[1].board)).toBe('2x = −8');
    expect(s.history.length).toBe(0);
    expect(run(s, { type: 'undo' })).toBe(s);                                                // nothing is reversible after the fold
  });
  it('Undo of the current move returns to the same state', () => {
    const s = run(take(start(P(4, -4)), 2), { type: 'undo' });
    expect([boardText(s.board), s.rows.length, s.menu, s.feedback.key]).toEqual(['4x = −16', 1, null, 'dUndone']);
  });
  it('Start over is greyed on the untouched original and live the moment anything is done; it wipes the work and keeps the stuck count', () => {
    let s = start();
    expect(startOverOk(s)).toBe(false);
    expect(run(s, { type: 'startOver' })).toBe(s);
    s = run(s, { type: 'stuck' }, { type: 'stuck' });
    expect([startOverOk(s), s.stuck]).toEqual([true, 2]);
    s = run(s, { type: 'choose', move: 'fraction' }, { type: 'take', n: 3 }, { type: 'startOver' });
    expect([boardText(s.board), s.rows.length, s.scaffold, s.stuck, s.feedback.key]).toEqual(['3x = −12', 1, false, 2, 'aStartedOver']);
  });
});

describe('plugging a typed value back in (loop §4)', () => {
  it('a right value: placed on x, then a line a click, then the problem is done', () => {
    let s = run(take(start(), 3), ...typed('−4'), { type: 'check' });
    expect([s.sub.kind, s.sub.ok, s.sub.placing, s.sub.target, s.feedback.key]).toEqual(['value', true, true, 'original', 'aPlace']);
    expect(shown(s)).toEqual([]);                                                            // nothing is written until the value is placed on x
    s = run(s, { type: 'placeValue' });
    expect(shown(s)).toEqual(['3(−4) = −12']);                                           // the copy is written beside it at once (Build D)
    s = run(s, { type: 'nextLine' });
    expect(shown(s)).toEqual(['3(−4) = −12', '−12 = −12']);
    s = run(s, { type: 'nextLine' });
    expect([s.stage, s.finalText, s.clean, s.feedback.key, subView(s.sub).mark]).toEqual(['done', '−4', true, 'aCorrect', true]);
  });
  it('B1: a correct guess renders the equation as written, with the coefficient, on every form, at the first state and after a partial move', () => {
    for (const [a, x] of [[2, -5], [3, 4], [4, -6], [5, 3], [6, -3], [3, -4]]) {
      const p = P(a, x);
      const first = shown(run(start(p), ...typed(String(x)), { type: 'check' }, { type: 'placeValue' }))[0];
      expect(first).toBe(`${a}(${x < 0 ? `−${-x}` : x}) = ${p.b < 0 ? `−${-p.b}` : p.b}`);
    }
    // after a partial move: a correct guess is plugged into the ORIGINAL equation, not the simplified one
    const s = run(take(start(P(6, -3)), 2), ...typed('−3'), { type: 'check' }, { type: 'placeValue' });
    expect([s.sub.target, shown(s)[0]]).toEqual(['original', '6(−3) = −18']);
  });
  it('a wrong guess is plugged into the CURRENT equation, ends red, asks for Undo, then points at the move', () => {
    let s = take(start(P(6, -3)), 2);                                                         // 3x = −9
    s = clickThrough(run(s, ...typed('5'), { type: 'check' }));
    expect([s.sub.target, shown(s)[0], s.sub.ok, s.feedback.key]).toEqual(['current', '3(5) = −9', false, 'aUndoGuess']);
    s = run(s, { type: 'undo' });
    expect([s.sub, s.feedback.key]).toEqual([null, 'aSimplerFirst']);
  });
  it('a wrong value names the slip at the end, shows the full check, and clears the row', () => {
    const wrong = (typed_) => clickThrough(run(take(start(), 3), ...typed(typed_), { type: 'check' }));
    const s = wrong('−36');
    expect([s.feedback.key, s.feedback.params.tag, s.entry, s.stage]).toEqual(['dWrong', 'multiplied', '', 'moves']);
    expect(wrong('−9').feedback.params.tag).toBe('undid-add');
    expect(wrong('−6').feedback).toMatchObject({ params: { tag: 'wrong-groups', groups: 2 } });
  });
  it('a correct guess at the first state owes a move; a student who made a move first is free', () => {
    let g = clickThrough(run(start(), ...typed('−4'), { type: 'check' }));
    expect([g.stage, owesMove(g)]).toEqual(['done', true]);
    const forced = newDivide(P(3, -4), { level: 3, forceMove: true });
    expect([forced.mustMove, forced.feedback.key, answerLive(forced)]).toEqual([true, 'aMustMove', false]);   // x = waits for one move
    expect(answerLive(take(forced, 3))).toBe(true);
    g = clickThrough(run(take(start(P(6, -3)), 2), ...typed('−3'), { type: 'check' }));
    expect([g.stage, owesMove(g)]).toEqual(['done', false]);
  });
});

describe('I’m stuck: rungs restart at each state; the diagram is on every rung, at x alone too (brief B2)', () => {
  it('two rungs (D4): rung 1 is the counters with the fractions live and the number in front outlined, and typing allowed; rung 2 is guided', () => {
    let s = run(start(), { type: 'stuck' });
    expect([s.scaffold, s.menu, s.hint, s.feedback.key, answerLive(s), s.stuck]).toEqual([true, 'fraction', { kind: 'coef' }, 'dModel', true, 1]);
    s = run(s, { type: 'take', n: 3 });                                                      // the dealing starts at once, and typing stays allowed (Check works after any deal)
    expect([s.deal.n, answerLive(s)]).toEqual([3, true]);
    s = run(s, { type: 'deal', group: 0 }, ...typed('−4'));
    expect(run(s, { type: 'check' }).sub).toMatchObject({ kind: 'guess', ok: true });
    s = run(start(), { type: 'stuck' }, { type: 'stuck' });
    expect([s.hint, s.feedback.key, s.stuck]).toEqual([{ kind: 'fraction', n: 3 }, 'dStuckGuided', 2]);
    s = run(s, { type: 'stuck' });                                                           // asking again stays at the guided rung
    expect([s.feedback.key, s.stuck]).toEqual(['dStuckGuided', 3]);
  });
  it('the counters are dealt by hand, one group kept, and that takes the fraction of both sides', () => {
    let s = run(start(), { type: 'stuck' }, { type: 'take', n: 3 });
    expect(s.deal).toEqual({ n: 3, groups: [0, 0, 0] });
    expect(run(s, { type: 'keep', group: 0 }).feedback.key).toBe('dShareFirst');
    for (let i = 0; i < 12; i++) s = run(s, { type: 'deal', group: i % 3 });
    expect(s.feedback.key).toBe('dKeepReady');
    s = run(s, { type: 'keep', group: 1 });
    expect([boardText(s.board), s.deal, s.scaffold]).toEqual(['x = ⅓(−12)', null, false]);          // the new state starts bare
  });
  it('after a partial move the rungs start again at the model, drawn for the new state', () => {
    let s = run(take(start(P(6, -3)), 2), { type: 'stuck' });
    expect([boardText(s.board), s.feedback.key, s.hint, s.stuck]).toEqual(['3x = −9', 'dModel', { kind: 'coef' }, 1]);
  });
  it('at x = ⅓(6) (D3): two rungs, the diagram on both, the student can deal at once, no numeral is printed', () => {
    for (const [a, x] of [[3, 2], [5, 7], [6, -3], [3, -6]]) {
      let s = take(start(P(a, x)), a);
      const rows = s.rows.length;
      s = run(s, { type: 'stuck' });
      expect([s.rows.length, s.diag.n, s.diag.size, s.diag.groups, s.diag.kept, s.feedback.key]).toEqual([rows, a, Math.abs(a * x), Array(a).fill(0), null, 'dDiag1']);
      expect(s.diag.neg).toBe(x < 0);
      expect(line(s)).toContain(`What is ${['', '', '½', '⅓', '¼', '⅕', '⅙'][a]} of ${x * a < 0 ? '−' : ''}${Math.abs(a * x)}? Share the counters into ${a} equal groups`);
      expect(answerLive(s)).toBe(true);                                                         // type at any point
      for (let i = 0; i < Math.abs(x) * a; i++) s = run(s, { type: 'deal', group: i % a });     // the first click already lets the student deal
      expect(s.diag.groups).toEqual(Array(a).fill(Math.abs(x)));
      expect(s.feedback.key).toBe('dKeepReady');
      expect(line(s)).not.toMatch(new RegExp(`(^|\\D)${Math.abs(x)}(\\D|$)`));                  // even groups: the size of a group is what the student finds
      s = run(s, { type: 'keep', group: 0 });
      expect([s.diag.kept, s.feedback.key, s.rows.length]).toEqual([0, 'dDiagKept', rows]);
      s = run(s, ...typed(String(x)), { type: 'check' });                                       // Check works after dealing
      expect(s.sub).toMatchObject({ kind: 'value', ok: true });
      // rung 2: already in equal groups with one bracketed; no numeral printed
      let g = run(take(start(P(a, x)), a), { type: 'stuck' }, { type: 'stuck' });
      expect([g.rows.length, g.diag.groups, g.diag.kept, g.diag.guided, g.feedback.key]).toEqual([rows, Array(a).fill(Math.abs(x)), 0, true, 'dDiag3']);
      expect(line(g)).not.toContain(String(Math.abs(x)));
      expect(run(g, { type: 'stuck' }).feedback.key).toBe('dDiag3');                            // there is no third rung
    }
  });
});

describe('the picture stays after the fraction is applied, until Next (D5)', () => {
  const dealt = (a, x) => {
    let s = run(start(P(a, x)), { type: 'stuck' }, { type: 'take', n: a });
    for (let i = 0; i < Math.abs(a * x); i++) s = run(s, { type: 'deal', group: i % a });
    return s;
  };
  it('keeping a group adds the work rows and leaves the picture, with the kept group marked', () => {
    const s = run(dealt(3, -4), { type: 'keep', group: 1 });
    expect(boardText(s.board)).toBe('x = ⅓(−12)');
    expect(s.rows.map((r) => r.type)).toEqual(['eq', 'work', 'eq']);
    expect(s.pic).toEqual({ n: 3, boxes: 3, size: 12, neg: true, groups: [4, 4, 4], kept: 1 });
    expect(s.scaffold).toBe(false);
  });
  it('Next folds the move and clears the picture; so does going on; Undo takes the whole move back', () => {
    const partial = run(dealt(2, -3), { type: 'keep', group: 0 });                          
    expect(partial.pic).not.toBeNull();
    let s = run(run(start(P(4, -4)), { type: 'stuck' }, { type: 'take', n: 2 }), ...Array.from({ length: 16 }, (_, i) => ({ type: 'deal', group: i % 2 })), { type: 'keep', group: 0 });
    expect([boardText(s.board), s.pic !== null, s.unfolded]).toEqual(['2x = −8', true, true]);
    expect(line(s)).toBe(FIND_X);
    const nxt = run(s, { type: 'foldNext' });
    expect([nxt.pic, nxt.unfolded, nxt.rows.map((r) => r.type)]).toEqual([null, false, ['eq', 'fold']]);
    expect(run(s, ...typed('4')).pic).toBeNull();
    const undone = run(s, { type: 'undo' });
    expect([undone.pic, boardText(undone.board)]).toEqual([null, '4x = −16']);
    // at x alone the picture waits for Next too
    const f = run(dealt(3, -4), { type: 'keep', group: 0 }, { type: 'foldNext' });
    expect([f.pic, boardText(f.board), answerLive(f)]).toEqual([null, 'x = ⅓(−12)', true]);
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
