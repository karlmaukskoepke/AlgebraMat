import { describe, it, expect } from 'vitest';
import { makeAddBoth } from '../src/engine/addBoth.js';
import {
  newAddBoth, reduceAddBoth, boardText, combinable, kindOf, balanced, tilt, effTerms, substitutionSteps,
} from '../src/engine/addBothMoves.js';

const run = (s, ...actions) => actions.reduce(reduceAddBoth, s);
const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const P = (form, a, b, mirror = false) => makeAddBoth(form, a, form === 'x+a' ? b - a : b + a, mirror);
const start = (p = P('x+a', 3, -6), level = 4) => newAddBoth(p, { level });
// the bare move: choose Add, type the amount, Go
const move = (s, amount) => run(s, { type: 'choose', move: 'add' }, ...typed(String(amount)), { type: 'go' });
const answer = (s, text) => run(s, ...typed(text), { type: 'check' });

// the scaffold's way: tap two groups, say Party or Battle, type how many are left
function combineOne(s, pair) {
  const a = s.board[pair.side].find((t) => t.id === pair.a);
  const b = s.board[pair.side].find((t) => t.id === pair.b);
  return run(s, { type: 'select', id: pair.a }, { type: 'select', id: pair.b }, { type: 'kind', value: kindOf(a.v, b.v) }, ...typed(String(a.v + b.v)), { type: 'check' });
}
const combineAll = (s) => { let t = s; while (combinable(t.board).length) t = combineOne(t, combinable(t.board)[0]); return t; };

describe('the bare screen', () => {
  it('starts with the choice prompt, the equation as written, nothing scaffolded, and the lights off', () => {
    const s = start();
    expect(s.feedback.key).toBe('aChoose');
    expect([s.scaffold, s.stage, s.counterMode]).toEqual([false, 'moves', false]);
    expect(s.lights).toEqual({ fewer: 'off', solved: 'off' });
    expect(boardText(s.board)).toBe('x + 3 = −6');
    expect(boardText(start(P('x-a', 5, -2)).board)).toBe('x + −5 = −2');
    expect(boardText(start(P('x+a', 3, 7, true)).board)).toBe('7 = x + 3');
  });
  it('the choice buttons only set the prompt and where typing goes', () => {
    expect(run(start(), { type: 'path', value: 'guess' }).typing).toBe('answer');
    const m = run(start(), { type: 'path', value: 'move' });
    expect([m.path, m.feedback.key]).toEqual(['move', 'aMovePrompt']);
    expect(run(start(), { type: 'greyMove' }).feedback.key).toBe('aLater');
  });
});

describe('path B: one move in one action', () => {
  it('adds the amount to both sides, cancels on x\'s side by itself, and leaves the other side unsimplified', () => {
    const s = move(start(), -3);
    expect(boardText(s.board)).toBe('x = −6 + −3');                                    // the value is never shown
    expect(s.lights).toEqual({ fewer: 'green', solved: 'green' });
    expect(s.feedback.key).toBe('aSolvedBoard');
    expect(s.history).toHaveLength(1);
  });
  it('shows a partial cancel as one number on x\'s side, grey (neutral) with its own message', () => {
    const s = move(start(), -5);
    expect(boardText(s.board)).toBe('x + −2 = −6 + −5');
    expect([s.lights.fewer, s.feedback.key]).toEqual(['neutral', 'aPartial']);
  });
  it('is red when it adds the same sign (terms the same, the number next to x bigger)', () => {
    const s = move(start(), 3);
    expect(boardText(s.board)).toBe('x + 6 = −6 + 3');
    expect([s.lights.fewer, s.feedback.key, s.reds]).toEqual(['red', 'aRed', 1]);
  });
  it('works with x on the right, and after a second move the other side keeps every term', () => {
    let s = move(start(P('x-a', 5, -2, true)), 2);                                      // −2 = x − 5, add 2 (partial)
    expect(boardText(s.board)).toBe('−2 + 2 = x + −3');
    s = move(s, 3);
    expect(boardText(s.board)).toBe('−2 + 2 + 3 = x');
    expect(s.lights.solved).toBe('green');
  });
  it('counts terms as if each side were combined', () => {
    expect(effTerms(start().board)).toBe(3);
    expect(effTerms(move(start(), -3).board)).toBe(2);
  });
  it('never takes 0, nothing, or a huge number', () => {
    expect(run(start(), { type: 'choose', move: 'add' }, { type: 'go' }).feedback.key).toBe('aAmountZero');
    expect(run(start(), { type: 'choose', move: 'add' }, ...typed('0'), { type: 'go' }).feedback.key).toBe('aAmountZero');
    expect(run(start(), { type: 'choose', move: 'add' }, ...typed('99'), { type: 'go' }).feedback.key).toBe('aAmountBig');
  });
  it('a number dragged into the blank fills it', () => {
    const s = run(start(), { type: 'setAmount', value: 3 });
    expect([s.menu, s.amountEntry]).toEqual(['add', '3']);
  });
  it('typing goes to the blank while the move is open, to the answer otherwise, unless a field was tapped', () => {
    let s = run(start(), { type: 'choose', move: 'add' }, ...typed('4'));
    expect([s.amountEntry, s.entry]).toEqual(['4', '']);
    s = run(s, { type: 'focus', target: 'answer' }, ...typed('2'));
    expect([s.amountEntry, s.entry]).toEqual(['4', '2']);
    expect(run(start(), ...typed('5')).entry).toBe('5');
  });
});

describe('undo and the wrong-move handling', () => {
  it('undo reverses the whole move; after a red or grey move the next click to point at is Undo', () => {
    let s = move(start(), 3);
    expect(s.undoCue).toBe(true);
    expect(move(start(), -3).undoCue).toBe(false);
    s = run(s, { type: 'undo' });
    expect(boardText(s.board)).toBe('x + 3 = −6');
    expect([s.feedback.key, s.undoCue]).toEqual(['aUndone', false]);
    expect(s.lights).toEqual({ fewer: 'off', solved: 'off' });
    expect(run(move(start(), -3), { type: 'undo' }).feedback.key).toBe('aUndone');
  });
  it('three reds in a row offer Start over and point to I\'m stuck', () => {
    let s = start();
    for (let i = 0; i < 3; i++) s = move(s, 3);
    expect([s.reds, s.startOver, s.feedback.key]).toEqual([3, true, 'aRed3']);
    s = run(s, { type: 'startOver' });
    expect([boardText(s.board), s.startOver]).toEqual(['x + 3 = −6', false]);
  });
  it('a good move in between starts the count again', () => {
    let s = move(move(start(), 3), 3);
    s = run(s, { type: 'undo' }, { type: 'undo' }, ...[]);
    expect(s.reds).toBe(0);
  });
});

describe('path A: guess x', () => {
  it('a right guess when x is already alone just finishes', () => {
    const s = answer(move(start(), -3), '−9');
    expect([s.stage, s.finalText, s.feedback.key]).toEqual(['done', '−9', 'aCorrect']);
  });
  it('a right guess earlier starts the click-through: Add, Go with the amount filled in, then the match tap', () => {
    let s = answer(start(), '−9');
    expect([s.walk.step, s.feedback.key]).toEqual(['move', 'aCorrectWalk']);
    expect(run(s, ...typed('5'), { type: 'check' }).feedback.key).toBe('aWalkFirst');
    s = run(s, { type: 'choose', move: 'add' });
    expect([s.walk.step, s.amountEntry]).toEqual(['go', '-3']);
    s = run(s, { type: 'go' });
    expect([s.walk.step, s.feedback.key, boardText(s.board)]).toEqual(['match', 'aWalkMatch', 'x = −6 + −3']);
    s = run(s, { type: 'matchGuess' });
    expect([s.stage, s.clean]).toEqual(['done', true]);
  });
  it('the click-through only accepts the right amount, and Undo goes back a step', () => {
    let s = run(answer(start(), '−9'), { type: 'choose', move: 'add' }, { type: 'backspace' }, { type: 'backspace' }, ...typed('2'));
    expect(run(s, { type: 'go' }).feedback.key).toBe('aForced');
    s = run(answer(start(), '−9'), { type: 'choose', move: 'add' }, { type: 'go' });
    s = run(s, { type: 'undo' });
    expect(s.walk.step).toBe('go');
  });
  it('a wrong first guess: named, the substitution a click at a time, Undo takes it back and points to the move', () => {
    let s = answer(start(), '5');
    expect([s.feedback.key, s.guessCheck.typed, s.guessCheck.step, s.guessCheck.lines.length, s.wrongs, s.stuck]).toEqual(['aGuessed', 5, 0, 2, 1, 0]);
    expect(s.feedback.params.typed).toBe('5');
    expect(run(s, ...typed('2')).entry).toBe('');                                          // typing waits
    expect(run(s, { type: 'undo' })).toBe(s);                                              // Undo only once the substitution is shown
    s = run(s, { type: 'nextLine' });
    expect(s.guessCheck.step).toBe(1);
    s = run(s, { type: 'nextLine' });
    expect([s.guessCheck.step, s.feedback.key]).toEqual([2, 'aUndoGuess']);
    expect(run(s, { type: 'nextLine' })).toBe(s);
    s = run(s, { type: 'undo' });
    expect([s.guessCheck, s.path, s.feedback.key, s.stuck, s.history.length]).toEqual([null, 'move', 'aSimplerFirst', 0, 0]);
    s = run(s, { type: 'choose', move: 'add' });
    expect(s.menu).toBe('add');                                                            // the move is open as usual
  });
  it('the substitution is written as the equation is, then what it comes to', () => {
    expect(substitutionSteps(P('x-a', 5, -2), 5)).toEqual(['5 − 5 = −2', '0 ≠ −2   ✗ Not balanced']);
    expect(substitutionSteps(P('x-a', 5, -2), 3)[1]).toBe('−2 = −2   ✓ Balanced');
    expect(substitutionSteps(P('x+a', 3, 7, true), 10)).toEqual(['7 = 10 + 3', '7 ≠ 13   ✗ Not balanced']);
  });
  it('a wrong value typed after a move names the slip, shows the substitution at once, and the student retypes', () => {
    let s = answer(move(start(), -3), '−3');                                               // x + 3 = −6: added instead of the opposite
    expect([s.feedback.key, s.tag, s.stage, s.guessCheck]).toEqual(['aWrong', 'wrong-op', 'moves', null]);
    expect(s.subst).toEqual(substitutionSteps(s.problem, -3));
    expect(answer(move(start(), -3), '−6').tag).toBe('untouched');
    expect(answer(move(start(P('x+a', 4, -2)), -4), '6').tag).toBe('sign-flipped');
    s = answer(s, '−9');
    expect(s.stage).toBe('done');
  });
  it('a move shows its work line: the added amount on both sides, x\'s numbers struck as they combine', () => {
    const s = move(start(), -3);
    expect(s.work.left).toEqual([{ x: true }, { v: 3, struck: true }, { v: -3, added: true, struck: true }]);
    expect(s.work.right).toEqual([{ v: -6, struck: false }, { v: -3, added: true, struck: false }]);
    expect(run(s, { type: 'undo' }).work).toBeNull();
  });
  it('reads unreadable answers', () => {
    expect(run(start(), { type: 'check' }).feedback.key).toBe('typeAnswer');
  });
});

describe('I\'m stuck and Teach me bring in the scaffold, one rung at a time', () => {
  it('rung 1 at L4–L6: the seesaw model with counters, the number next to x highlighted; nothing opens by itself before', () => {
    const s0 = start();
    expect(s0.scaffold).toBe(false);
    const s = run(s0, { type: 'stuck' });
    expect([s.scaffold, s.counterMode, s.stuck, s.rung, s.stage, s.feedback.key]).toEqual([true, true, 1, 1, 'moves', 'aStuck1']);
    expect(s.hint.kind).toBe('cancel');
    expect(boardText(s.board)).toBe(boardText(s0.board));                                  // the same equation, pre-built
  });
  it('rung 1 at L2–L3 with no move made: the board starts empty and the student builds the equation', () => {
    let s = run(start(P('x+a', 3, -6), 2), { type: 'stuck' });
    expect([s.stage, s.feedback.key]).toEqual(['build', 'aBuild']);
    s = run(s, { type: 'drop', piece: 'x', side: 'left' }, ...Array(3).fill({ type: 'drop', piece: '+', side: 'left' }), ...Array(6).fill({ type: 'drop', piece: '-', side: 'right' }));
    expect(s.stage).toBe('moves');
  });
  it('rung 1 at L2–L3 after a move has been made redraws the current equation, unsimplified side included', () => {
    const s = run(move(start(P('x+a', 3, -6), 2), -5), { type: 'stuck' });
    expect(s.stage).toBe('moves');
    expect(boardText(s.board)).toBe('x + −2 = −6 + −5');
  });
  it('rung 2 opens the two-action move; rung 3 pre-fills the amount; the stuck count adds up', () => {
    let s = run(start(), { type: 'stuck' }, { type: 'stuck' });
    expect([s.menu, s.stuck]).toEqual(['add', 2]);
    s = run(s, { type: 'stuck' });
    expect([s.amountEntry, s.stuck, s.feedback.key]).toEqual(['-3', 3, 'aStuck3']);
  });
  it('in the scaffold: add to one side (tilt), the other (balanced), Go, then the combining ritual, then judged', () => {
    let s = run(start(), { type: 'stuck' }, { type: 'choose', move: 'add' }, ...typed('−3'), { type: 'addTo', side: 'left' });
    expect(boardText(s.board)).toBe('x + 3 + −3 = −6');
    expect([tilt(s), balanced(s)]).toEqual([-3, false]);
    expect(run(s, { type: 'go' }).feedback.key).toBe('aGoNotYet');
    s = run(s, { type: 'addTo', side: 'right' }, { type: 'go' });
    expect([s.resolving, s.feedback.key]).toEqual([true, 'aCombineGroups']);
    expect(run(s, { type: 'choose', move: 'add' }).feedback.key).toBe('aSimplifyFirst');
    s = combineAll(s);
    expect(boardText(s.board)).toBe('x = −9');
    expect(s.lights).toEqual({ fewer: 'green', solved: 'green' });
    expect(s.feedback.key).toBe('aSolvedBoard');
  });
  it('the scaffold\'s combining asks Party or Battle, then how many are left (cross off is a scaffold, not the answer)', () => {
    let s = run(start(), { type: 'stuck' }, { type: 'choose', move: 'add' }, ...typed('−3'), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });
    const [pair] = combinable(s.board);
    s = run(s, { type: 'select', id: pair.a }, { type: 'select', id: pair.b });
    expect(s.feedback.key).toBe('aPartyOrBattle');
    expect(run(s, { type: 'kind', value: 'party' }).feedback.key).toBe('aKindWrong');
    s = run(s, { type: 'kind', value: 'battle' }, { type: 'crossOff' });
    expect(s.combining.crossed).toBe(true);
    s = run(s, ...typed('5'), { type: 'check' });
    expect(s.feedback.key).toBe('aCountWrong');
  });
  it('Teach me: the scaffold on a forced path, only the right amount, and it counts as a Teach me', () => {
    let s = run(start(), { type: 'teach' });
    expect([s.taught, s.forced, s.scaffold, s.menu, s.amountEntry]).toEqual([1, true, true, 'add', '-3']);
    s = run(s, ...[{ type: 'toggleSign' }]);
    s = run(start(), { type: 'teach' }, { type: 'backspace' }, { type: 'backspace' }, ...typed('2'), { type: 'addTo', side: 'left' });
    expect(s.feedback.key).toBe('aForced');
  });
  it('a typed answer once the scaffold is on finishes the problem', () => {
    const s = answer(run(start(), { type: 'stuck' }), '−9');
    expect(s.stage).toBe('done');
    expect(s.clean).toBe(false);
  });
  it('help while x is alone says to work it out', () => {
    expect(run(move(start(), -3), { type: 'stuck' }).feedback.key).toBe('aStuckSolved');
  });
});

describe('building the equation in the scaffold (L2–L3)', () => {
  const built = (extra) => run(start(P('x-a', 2, 3), 3), { type: 'stuck' }, ...extra);
  it('takes the box on its own side, one-signed groups, and removes with a tap', () => {
    let s = built([{ type: 'drop', piece: '-', side: 'left' }, { type: 'drop', piece: '-', side: 'left' }]);       // x − 2 = 3
    expect(s.built.constant).toBe(-2);
    expect(run(s, { type: 'drop', piece: '+', side: 'left' }).feedback.key).toBe('aBuildOneSign');
    expect(run(s, { type: 'zone', side: 'left' }).feedback.key).toBe('aPickFirst');
    expect(run(s, { type: 'drop', piece: 'x', side: 'right' }).feedback.key).toBe('aBuildXSide');
    s = run(s, { type: 'buildRemove', side: 'left' });
    expect(s.built.constant).toBe(-1);
    s = run(s, { type: 'drop', piece: '-', side: 'left' }, ...Array(3).fill({ type: 'drop', piece: '+', side: 'right' }));
    expect(s.stage).toBe('build');                                                       // the box is still to come
    s = run(s, { type: 'pickPiece', piece: 'x' }, { type: 'zone', side: 'left' });
    expect([s.stage, s.feedback.key]).toEqual(['moves', 'aBuilt']);
  });
  it('typing is not offered while building', () => {
    expect(run(built([]), ...typed('5')).entry).toBe('');
  });
});
