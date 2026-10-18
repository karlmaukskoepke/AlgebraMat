import { describe, it, expect } from 'vitest';
import { makeAddBoth } from '../src/engine/addBoth.js';
import { oppositeOf } from '../src/engine/addBoth.js';
import {
  newAddBoth, reduceAddBoth, boardText, kindOf, balanced, tilt, xTerms, substitutionSteps, owesMove, tradePending, tradeAvailable,
} from '../src/engine/addBothMoves.js';

const run = (s, ...actions) => actions.reduce(reduceAddBoth, s);
const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const P = (form, a, b, mirror = false) => makeAddBoth(form, a, form === 'x+a' ? b - a : b + a, mirror);
const start = (p = P('x+a', 3, -6), level = 4) => newAddBoth(p, { level });
// the bare move: choose Add, type the amount, Go
const move = (s, amount) => run(s, { type: 'choose', move: 'add' }, ...typed(String(amount)), { type: 'go' });
const answer = (s, text) => run(s, ...typed(text), { type: 'check' });

// the scaffold's way: the next two numbers on a side are highlighted and the student says Party or Battle; the right answer combines them
function combineOne(s) {
  const a = s.board[s.combining ? (s.board.left.some((t) => t.id === s.combining.a) ? 'left' : 'right') : 'left'].find((t) => t.id === s.combining.a);
  const b = [...s.board.left, ...s.board.right].find((t) => t.id === s.combining.b);
  return run(s, { type: 'kind', value: kindOf(a.v, b.v) });
}
const combineAll = (s) => { let t = s; while (t.combining) t = combineOne(t); return t; };

describe('the bare screen', () => {
  it('starts on "Find x.", the equation as written, nothing scaffolded, and the lights off', () => {
    const s = start();
    expect(s.feedback.key).toBe('aFindX');
    expect([s.scaffold, s.stage, s.counterMode]).toEqual([false, 'moves', false]);
    expect(s.lights).toEqual({ fewer: 'off', solved: 'off' });
    expect(boardText(s.board)).toBe('x + 3 = −6');
    expect(boardText(start(P('x-a', 5, -2)).board)).toBe('x + −5 = −2');
    expect(boardText(start(P('x+a', 3, 7, true)).board)).toBe('7 = x + 3');
  });
  it('there is no choice (Build C): the move and the x = row are both live at once; a greyed move only explains', () => {
    expect(run(start(), { type: 'choose', move: 'add' }).menu).toBe('add');
    expect(run(start(), ...typed('5')).entry).toBe('5');                                      // a value typed now is a guess
    const s0 = start();
    expect(run(s0, { type: 'path', value: 'guess' })).toBe(s0);                               // the old choice is gone: nothing happens
    expect(run(start(), { type: 'greyMove' }).feedback.key).toBe('aLater');
  });
  it('owes a move after a correct guess, and only then', () => {
    const win = (s) => { let t = run(s, ...typed('−9'), { type: 'check' }); while (t.stage !== 'done') t = run(t, { type: 'nextLine' }); return t; };
    expect(owesMove(win(start()))).toBe(true);
    expect(owesMove(start())).toBe(false);
    expect(owesMove(finishByMove(start()))).toBe(false);
  });
});

describe('path B: one move in one action', () => {
  it('adds the amount to both sides, cancels on x\'s side by itself, and leaves the other side unsimplified', () => {
    const s = move(start(), -3);
    expect(boardText(s.board)).toBe('x = −6 + −3');                                    // the value is never shown
    expect(s.lights).toEqual({ fewer: 'green', solved: 'green' });
    expect(s.feedback.key).toBe('aSolvedBoard');
    expect(s.history).toHaveLength(1);
    expect(s.rows.map((r) => r.type)).toEqual(['eq', 'work', 'eq']);                    // the work stack keeps every row
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
    let s = move(start(P('x-a', 5, -2, true)), 1);                                      // −2 = x − 5, add 1 (partial)
    expect(boardText(s.board)).toBe('−2 + 1 = x + −4');
    s = move(s, 4);
    expect(boardText(s.board)).toBe('−2 + 1 + 4 = x');
    expect(s.lights.solved).toBe('green');
  });
  it('judges x\'s side only (the other side is never read)', () => {
    expect(xTerms(start().board)).toBe(2);
    expect(xTerms(move(start(), -3).board)).toBe(1);
  });
  it('never takes 0, nothing, or a huge number', () => {
    const open = () => run(start(), { type: 'choose', move: 'add' });
    expect(run(open(), { type: 'go' }).feedback.key).toBe('aAmountZero');
    expect(run(open(), ...typed('0'), { type: 'go' }).feedback.key).toBe('aAmountZero');
    expect(run(open(), ...typed('99'), { type: 'go' }).feedback.key).toBe('aAmountBig');
  });
  it('a number dragged into the blank fills it', () => {
    const s = run(start(), { type: 'setAmount', value: 3 });
    expect([s.menu, s.amountEntry]).toEqual(['add', '3']);
  });
  it('typing goes to the blank while the move is open, to the answer once x is alone, unless a field was tapped', () => {
    let s = run(start(), { type: 'choose', move: 'add' }, ...typed('4'));
    expect([s.amountEntry, s.entry]).toEqual(['4', '']);
    expect(run(move(start(), -3), ...typed('5')).entry).toBe('5');
    s = run(start(), ...typed('2'));
    expect(s.entry).toBe('2');
  });
  it('catches zeroing the side without x: shown, Undo, the blank is cleared, the number next to x is highlighted', () => {
    let s = move(start(P('x+a', 3, -5)), 5);                                              // x + 3 = −5, add 5
    expect(boardText(s.board)).toBe('x + 8 = 0');                                          // the 0 they were after, and x + 8
    expect([s.zeroOther, s.feedback.key, s.undoCue, s.reds]).toEqual([true, 'aZeroOther', true, 1]);
    expect(s.work.right).toEqual([{ v: -5, struck: true }, { v: 5, added: true, struck: true }]);
    s = run(s, { type: 'undo' });
    expect([boardText(s.board), s.feedback.key, s.menu, s.amountEntry, s.zeroOther]).toEqual(['x + 3 = −5', 'aZeroUndone', 'add', '', false]);
    expect(s.hint).toEqual({ kind: 'cancel', id: s.board.left.find((t) => t.kind === 'num').id });
    expect(run(s, ...typed('2')).hint).toBeNull();                                         // the highlight goes once they type
  });
});

describe('undo and the wrong-move handling', () => {
  it('undo reverses the whole move; after a red or grey move the next click to point at is Undo', () => {
    let s = move(start(), 3);
    expect(s.undoCue).toBe(true);
    expect(move(start(), -3).undoCue).toBe(false);
    s = run(s, { type: 'undo' });
    expect(boardText(s.board)).toBe('x + 3 = −6');
    expect([s.feedback.key, s.undoCue, s.amountEntry]).toEqual(['aUndone', false, '']);
    expect(s.rows).toHaveLength(1);
    expect(s.lights).toEqual({ fewer: 'off', solved: 'off' });
    expect(run(move(start(), -3), { type: 'undo' }).feedback.key).toBe('aUndone');
  });
  it('three reds in a row offer Start over and point to I\'m stuck', () => {
    let s = start();
    for (let i = 0; i < 3; i++) s = move(s, 3);
    expect([s.reds, s.startOver, s.feedback.key]).toEqual([3, true, 'aRed3']);
    s = run(s, { type: 'startOver' });
    expect([boardText(s.board), s.startOver, s.feedback.key, s.rows.length]).toEqual(['x + 3 = −6', false, 'aStartedOver', 1]);
  });
  it('a good move in between starts the count again', () => {
    let s = move(move(start(), 3), 3);
    s = run(s, { type: 'undo' }, { type: 'undo' }, ...[]);
    expect(s.reds).toBe(0);
  });
});

// a correct value typed, then the substitution clicked through to the end
const clickThrough = (s) => { let t = s; while (t.sub && t.sub.step < 3) t = run(t, { type: 'nextLine' }); return t; };
const finishByMove = (s) => clickThrough(answer(move(s, oppositeOf(s.problem)), String(s.problem.x)));

describe('plugging a typed value back in: a line a click', () => {
  it('a right value when x is alone: the row shows it, then two lines and Balanced, a click each, then the problem is done', () => {
    let s = answer(move(start(), -3), '−9');
    expect([s.stage, s.sub.kind, s.sub.step, s.sub.ok, s.feedback.key]).toEqual(['moves', 'value', 0, true, 'aPlugIn']);
    expect(run(s, ...typed('2'))).toBe(s);                                                   // typing waits for the clicks
    expect(run(s, { type: 'check' })).toEqual(s);
    s = run(s, { type: 'nextLine' }, { type: 'nextLine' });
    expect([s.stage, s.sub.step]).toEqual(['moves', 2]);
    s = run(s, { type: 'nextLine' });
    expect([s.stage, s.step, s.finalText, s.feedback.key, s.clean]).toEqual(['done', 'done', '−9', 'aCorrect', true]);
    expect(run(s, { type: 'nextLine' })).toBe(s);
  });
  it('a right guess is the same: no walkthrough, the next problem is owed a move', () => {
    let s = answer(run(start()), '−9');
    expect([s.sub.kind, s.sub.ok, s.feedback.key]).toEqual(['guess', true, 'aPlugIn']);
    s = clickThrough(s);
    expect([s.stage, owesMove(s)]).toEqual(['done', true]);
  });
  it('a wrong guess: named, equations a click at a time, Not balanced on its own line, then Undo takes it back to the move', () => {
    let s = answer(start(), '5');
    expect([s.feedback.key, s.sub.typed, s.sub.step, s.sub.lines.length, s.wrongs, s.stuck]).toEqual(['aGuessed', 5, 0, 2, 1, 0]);
    expect(s.feedback.params.typed).toBe('5');
    expect(run(s, { type: 'undo' })).toBe(s);                                              // Undo only once the substitution is shown
    s = run(s, { type: 'nextLine' }, { type: 'nextLine' });
    expect([s.sub.step, s.feedback.key]).toEqual([2, 'aGuessed']);
    s = run(s, { type: 'nextLine' });
    expect([s.sub.step, s.feedback.key]).toEqual([3, 'aUndoGuess']);
    expect(run(s, { type: 'nextLine' })).toBe(s);
    s = run(s, { type: 'undo' });
    expect([s.sub, s.feedback.key, s.stuck, s.history.length, s.entry]).toEqual([null, 'aSimplerFirst', 0, 0, '']);
    s = run(s, { type: 'choose', move: 'add' });
    expect(s.menu).toBe('add');                                                            // the move is open as usual
  });
  it('the substitution is written as the equation is, then what it comes to', () => {
    expect(substitutionSteps(P('x-a', 5, -2), 5)).toEqual(['5 − 5 = −2', '0 = −2']);
    expect(substitutionSteps(P('x-a', 5, -2), 3)).toEqual(['3 − 5 = −2', '−2 = −2']);
    expect(substitutionSteps(P('x+a', 3, -6), -9)).toEqual(['(−9) + 3 = −6', '−6 = −6']);              // a negative goes in parentheses
    expect(substitutionSteps(P('x+a', 3, 7, true), 10)).toEqual(['7 = 10 + 3', '7 = 13']);
  });
  it('a wrong value typed after a move: plugged in, the slip named at the end, the row clears and the student retypes', () => {
    let s = answer(move(start(), -3), '−3');                                               // x + 3 = −6: added instead of the opposite
    expect([s.sub.ok, s.sub.tag, s.stage]).toEqual([false, 'wrong-op', 'moves']);
    s = clickThrough(s);
    expect([s.feedback.key, s.feedback.params.tag, s.entry, s.stage, s.wrongs]).toEqual(['aWrong', 'wrong-op', '', 'moves', 1]);
    expect(run(s, { type: 'undo' })).toBe(s);
    expect(answer(clickThrough(answer(move(start(), -3), '−6')), '').feedback.key).toBe('typeAnswer');
    expect(clickThrough(answer(move(start(), -3), '−6')).feedback.params.tag).toBe('untouched');
    expect(clickThrough(answer(move(start(P('x+a', 4, -2)), -4), '6')).feedback.params.tag).toBe('sign-flipped');
    s = answer(s, '−9');                                                                   // typing again clears the old substitution
    expect([s.sub.ok, s.sub.step]).toEqual([true, 0]);
    expect(clickThrough(s).stage).toBe('done');
  });
  it('help after a value is typed opens the scaffold as usual', () => {
    const g = run(start(), ...typed('4'));
    const s = run(g, { type: 'stuck' }, { type: 'stuck' });
    expect([s.scaffold, s.stuck]).toEqual([true, 2]);
    expect(run(answer(g, '4'), { type: 'stuck' }).stuck).toBe(0);                          // not while the lines are being clicked through
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
  it('the first I\'m stuck is only a reminder: the number next to x outlined, "what would we add to eliminate it?", the Add blank open, no model', () => {
    const s = run(start(), { type: 'stuck' });
    expect([s.scaffold, s.stuck, s.menu, s.feedback.key, s.feedback.params.constant]).toEqual([false, 1, 'add', 'aStuckHint', '+3']);
    expect(s.hint).toEqual({ kind: 'cancel', id: s.board.left.find((t) => t.kind === 'num').id });
    expect(run(s, ...typed('2')).hint).toBeNull();                                         // the outline goes once they start typing
    expect(run(move(start(), -3), { type: 'stuck' }).scaffold).toBe(false);                // x alone: just "work out what x is"
  });
  it('rung 1 at L4–L6: the seesaw model with counters, the number next to x highlighted; nothing opens by itself before', () => {
    const s0 = start();
    expect(s0.scaffold).toBe(false);
    const s = run(s0, { type: 'stuck' }, { type: 'stuck' });
    expect([s.scaffold, s.counterMode, s.stuck, s.rung, s.stage, s.feedback.key]).toEqual([true, true, 2, 1, 'moves', 'aStuck1']);
    expect(s.hint.kind).toBe('cancel');
    expect(boardText(s.board)).toBe(boardText(s0.board));                                  // the same equation, pre-built
  });
  it('rung 1 at L2–L3 with no move made: the board starts empty and the student builds the equation', () => {
    let s = run(start(P('x+a', 3, -6), 2), { type: 'stuck' }, { type: 'stuck' });
    expect([s.stage, s.feedback.key]).toEqual(['build', 'aBuild']);
    s = run(s, { type: 'drop', piece: 'x', side: 'left' }, ...Array(3).fill({ type: 'drop', piece: '+', side: 'left' }), ...Array(6).fill({ type: 'drop', piece: '-', side: 'right' }));
    expect(s.stage).toBe('moves');
  });
  it('rung 1 at L2–L3 after a move has been made redraws the current equation, unsimplified side included', () => {
    const s = run(move(start(P('x+a', 3, -6), 2), -5), { type: 'stuck' }, { type: 'stuck' });
    expect(s.stage).toBe('moves');
    expect(boardText(s.board)).toBe('x + −2 = −6 + −5');
  });
  it('rung 2 opens the two-action move; rung 3 pre-fills the amount; the stuck count adds up', () => {
    let s = run(start(), { type: 'stuck' }, { type: 'stuck' }, { type: 'stuck' });
    expect([s.menu, s.stuck]).toEqual(['add', 3]);
    s = run(s, { type: 'stuck' });
    expect([s.amountEntry, s.stuck, s.feedback.key]).toEqual(['-3', 4, 'aStuck3']);
  });
  it('in the scaffold: add to one side (tilt), the other (balanced), Go, then the combining ritual, then judged', () => {
    let s = run(start(), { type: 'stuck' }, { type: 'stuck' }, { type: 'choose', move: 'add' }, ...typed('−3'), { type: 'addTo', side: 'left' });
    expect(boardText(s.board)).toBe('x + 3 + −3 = −6');
    expect([tilt(s), balanced(s)]).toEqual([-3, false]);
    expect(run(s, { type: 'go' }).feedback.key).toBe('aGoNotYet');
    s = run(s, { type: 'addTo', side: 'right' }, { type: 'go' });
    expect([s.resolving, s.feedback.key, s.combining.step]).toEqual([true, 'aPartyOrBattle', 'kind']);   // the first pair is highlighted for them
    expect(run(s, { type: 'choose', move: 'add' })).toBe(s);                                   // nothing else is open while a pair waits
    s = combineAll(s);
    expect(boardText(s.board)).toBe('x = −6 + −3');                                       // the other side is left for the student (Build A)
    expect(s.lights).toEqual({ fewer: 'green', solved: 'green' });
    expect([s.feedback.key, s.feedback.params.alone]).toEqual(['aKindRight', true]);
  });
  it('the scaffold\'s combining: the pair beside x cancels on its own; on the other side a right answer only confirms (Build A)', () => {
    let s = run(start(), { type: 'stuck' }, { type: 'stuck' }, { type: 'choose', move: 'add' }, ...typed('−3'), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });
    const first = s.combining;
    expect(s.board.left.some((t) => t.id === first.a)).toBe(true);                       // the left side comes first
    expect(run(s, { type: 'kind', value: 'party' }).feedback.key).toBe('aKindWrong');
    expect(run(s, { type: 'kind', value: 'party' }).combining).toEqual(first);
    s = run(s, { type: 'kind', value: 'battle' });                                         // +3 and −3: a Battle, they cancel
    expect(boardText(s.board)).toBe('x = −6 + −3');
    expect(s.feedback.params.before).toBe('Battle! 3 and −3 make 0.');
    expect(s.combining.step).toBe('kind');                                                 // now the other side
    s = run(s, { type: 'kind', value: 'party' });
    expect([boardText(s.board), s.combining, s.feedback.key, s.hint.kind]).toEqual(['x = −6 + −3', null, 'aKindRight', 'sum']);   // never writes x = −9
  });
  it('in the scaffold the answer row waits until x is alone', () => {
    const s = run(start(), { type: 'stuck' }, { type: 'stuck' });
    expect(run(s, ...typed('5')).entry).toBe('');
  });
  it('Teach me: the scaffold on a forced path, only the right amount, and it counts as a Teach me', () => {
    let s = run(start(), { type: 'teach' });
    expect([s.taught, s.forced, s.scaffold, s.menu, s.amountEntry]).toEqual([1, true, true, 'add', '-3']);
    s = run(s, ...[{ type: 'toggleSign' }]);
    s = run(start(), { type: 'teach' }, { type: 'backspace' }, { type: 'backspace' }, ...typed('2'), { type: 'addTo', side: 'left' });
    expect(s.feedback.key).toBe('aForced');
  });
  it('a typed answer once the scaffold has got x alone is plugged back in, and then finishes the problem', () => {
    let s = run(start(), { type: 'stuck' }, { type: 'stuck' }, { type: 'choose', move: 'add' }, ...typed('−3'), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });
    s = clickThrough(answer(combineAll(s), '−9'));
    expect(s.stage).toBe('done');
    expect(s.clean).toBe(false);
  });
  it('x alone with numbers still to put together: stuck 1 reminds; later asks outline the two numbers and ask for the sum in words, never the seesaw or the value (Build A)', () => {
    let s = run(move(start(), -3), { type: 'stuck' });
    expect([s.scaffold, s.feedback.key]).toEqual([false, 'aStuckSolved']);
    s = run(s, { type: 'stuck' });
    expect([s.scaffold, s.feedback.key, s.feedback.params.sum, s.feedback.params.level, s.hint.kind, s.hint.ids.length]).toEqual([false, 'aStuckSum', '−6 + −3', 1, 'sum', 2]);
    s = run(s, { type: 'stuck' }, { type: 'stuck' }, { type: 'stuck' });
    expect([s.scaffold, s.combining, s.feedback.params.level, boardText(s.board)]).toEqual([false, null, 3, 'x = −6 + −3']);
    expect(s.supportsShown).toEqual(['hint']);
  });
  it('help while x is alone says to work it out', () => {
    expect(run(move(start(), -3), { type: 'stuck' }).feedback.key).toBe('aStuckSolved');
  });
});

describe('building the equation in the scaffold (L2–L3)', () => {
  const built = (extra) => run(start(P('x-a', 2, 3), 3), { type: 'stuck' }, { type: 'stuck' }, ...extra);
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

describe('Trade places (Level 5 on: x on the right)', () => {
  const mirror = () => newAddBoth(P('x+a', 3, 7, true), { level: 5, introTrade: true });
  it('is pointed out the first time: the line says so from the start and Add waits until the sides are traded', () => {
    let s = mirror();
    expect([s.feedback.key, tradePending(s), tradeAvailable(s)]).toEqual(['aTradeIntro', true, true]);
    expect(run(s, { type: 'choose', move: 'add' }).feedback.key).toBe('aTradeFirst');
    s = run(s, { type: 'choose', move: 'trade' });
    expect(boardText(s.board)).toBe('x + 3 = 7');
    expect([s.feedback.key, s.tradeCount, tradePending(s), tradeAvailable(s)]).toEqual(['aTraded', 1, false, false]);
    expect(s.rows.map((r) => r.type)).toEqual(['eq', 'eq']);                                 // rewritten below the original
    s = run(s, { type: 'choose', move: 'add' }, ...typed('−3'), { type: 'go' });
    expect(boardText(s.board)).toBe('x = 7 + −3');
    expect(run(s, { type: 'undo' }).board.left.length).toBe(2);
  });
  it('is not offered with x on the left, below Level 5, or in the scaffold; after the first time it is optional', () => {
    expect(tradeAvailable(newAddBoth(P('x+a', 3, 7), { level: 5, introTrade: true }))).toBe(false);
    expect(tradeAvailable(newAddBoth(P('x+a', 3, 7, true), { level: 4 }))).toBe(false);
    const later = newAddBoth(P('x+a', 3, 7, true), { level: 5, introTrade: false });
    expect([later.feedback.key, tradePending(later), tradeAvailable(later)]).toEqual(['aFindX', false, true]);
    expect(run(later, { type: 'stuck' }, { type: 'stuck' }).scaffold).toBe(true);
  });
});
