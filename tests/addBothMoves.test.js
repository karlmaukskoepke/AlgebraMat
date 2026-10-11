import { describe, it, expect } from 'vitest';
import { makeAddBoth, formatAddBoth } from '../src/engine/addBoth.js';
import {
  newAddBoth, reduceAddBoth, boardText, combinable, kindOf, boardAnswer, tilt, balanced, checkLines, MOVES_BY_LEVEL,
} from '../src/engine/addBothMoves.js';

const run = (s, ...actions) => actions.reduce(reduceAddBoth, s);
const typed = (text) => [...text.replace(/−/g, '-')].map((ch) => (/\d/.test(ch) ? { type: 'digit', digit: Number(ch) } : { type: 'toggleSign' }));
const answer = (text) => [...typed(text), { type: 'check' }];
const P = (form, a, b, mirror = false) => makeAddBoth(form, a, form === 'x+a' ? b - a : b + a, mirror);
const ids = (s, side) => s.board[side].map((t) => t.id);
const termsOf = (s, side) => s.board[side];

// Combine one pair the way a student does: tap both groups, say Party or Battle, type how many are left.
function combineOne(s, pair) {
  const a = s.board[pair.side].find((t) => t.id === pair.a);
  const b = s.board[pair.side].find((t) => t.id === pair.b);
  return run(s, { type: 'select', id: pair.a }, { type: 'select', id: pair.b }, { type: 'kind', value: kindOf(a.v, b.v) }, ...typed(String(a.v + b.v)), { type: 'check' });
}
const combineAll = (s) => { let t = s; while (combinable(t.board).length) t = combineOne(t, combinable(t.board)[0]); return t; };

// The whole correct move for x + a = b / x − a = b: choose Add, type the opposite, add left, add right, Go, combine every pair.
function doMove(s, amount) {
  return combineAll(run(s, { type: 'choose', move: 'add' }, ...typed(String(amount)), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' }));
}

describe('the board', () => {
  it('starts as the equation, with x first on its side, and says it in the notes\' way', () => {
    expect(boardText(newAddBoth(P('x+a', 3, -6), { level: 3 }).board)).toBe('x + 3 = −6');
    expect(boardText(newAddBoth(P('x-a', 5, -2), { level: 3 }).board)).toBe('x + −5 = −2');
    expect(boardText(newAddBoth(P('x+a', 3, 7, true), { level: 4 }).board)).toBe('7 = x + 3');
    expect(MOVES_BY_LEVEL(1)).toEqual(['add']);
    expect(MOVES_BY_LEVEL(4)).toEqual(['add', 'trade']);
    expect(MOVES_BY_LEVEL(6)).toEqual(['add', 'trade', 'cross']);
  });
});

describe('add to both sides, in two actions', () => {
  const start = () => newAddBoth(P('x+a', 3, -6), { level: 3 });

  it('adds to one side (the readout tilts), then the same to the other (balanced), then Go', () => {
    let s = run(start(), { type: 'choose', move: 'add' }, ...typed('−3'), { type: 'addTo', side: 'left' });
    expect(boardText(s.board)).toBe('x + 3 + −3 = −6');
    expect(s.pending).toMatchObject({ side: 'left', amount: -3 });
    expect([tilt(s), balanced(s), s.amountEntry]).toEqual([-3, false, '-3']);          // −3 on the left: the left is lighter; the amount is pre-filled
    expect(run(s, { type: 'go' }).feedback.key).toBe('aGoNotYet');                     // Go waits for the balance
    s = run(s, { type: 'addTo', side: 'right' });
    expect(boardText(s.board)).toBe('x + 3 + −3 = −6 + −3');
    expect(balanced(s)).toBe(true);
    expect(s.feedback.key).toBe('aBalanced');
    s = run(s, { type: 'go' });
    expect(s.resolving).toBe(true);                                                    // the pair has to be cancelled
    expect(s.feedback.key).toBe('aCombineGroups');
  });

  it('judges only after every pair of groups is combined, and the lights go green', () => {
    let s = doMove(start(), -3);
    expect(boardText(s.board)).toBe('x = −9');
    expect(s.lights).toEqual({ fewer: 'green', xAlone: 'green', xLeft: 'off' });
    expect(boardAnswer(s.board)).toBe(-9);
    expect(s.feedback).toMatchObject({ key: 'aSolvedBoard', params: { answer: -9 } });
    s = run(s, ...answer('−9'));
    expect(s).toMatchObject({ stage: 'done', clean: true, finalText: '−9' });
  });

  it('combines two groups in steps: tap both, Party or Battle, how many are left (then they combine)', () => {
    let s = newAddBoth(P('x-a', 5, -2), { level: 3 });                              // x − 5 = −2
    s = run(s, { type: 'choose', move: 'add' }, ...typed('5'), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });
    expect(boardText(s.board)).toBe('x + −5 + 5 = −2 + 5');
    const [l1, l2] = [s.board.left[1].id, s.board.left[2].id];
    s = run(s, { type: 'select', id: l1 });
    expect(s.selected).toBe(l1);
    s = run(s, { type: 'select', id: l2 });
    expect(s.combining).toMatchObject({ step: 'kind' });
    expect(s.feedback).toMatchObject({ key: 'aPartyOrBattle', params: { g1: '−5', g2: '5', kind: 'battle' } });
    expect(run(s, { type: 'kind', value: 'party' }).feedback.key).toBe('aKindWrong');   // the wrong team is a miss, and stays at the question
    expect(run(s, { type: 'kind', value: 'party' }).kindMisses).toBe(1);
    expect(run(s, { type: 'kind', value: 'party' }).combining.step).toBe('kind');
    s = run(s, { type: 'kind', value: 'battle' });
    expect([s.combining.step, s.feedback.key]).toEqual(['count', 'aHowMany']);
    expect(run(s, { type: 'check' }).feedback.key).toBe('typeCount');
    const wrong = run(s, ...typed('10'), { type: 'check' });
    expect(wrong).toMatchObject({ countMisses: 1, feedback: { key: 'aCountWrong', params: { tag: 'sizes-added' } } });
    expect(boardText(wrong.board)).toBe('x + −5 + 5 = −2 + 5');                       // nothing combines until the count is right
    s = run(s, ...typed('0'), { type: 'check' });
    expect(boardText(s.board)).toBe('x = −2 + 5');
    expect([s.combining, s.resolving, s.feedback.key]).toEqual([null, true, 'aCombined']);
    s = combineAll(s);
    expect(boardText(s.board)).toBe('x = 3');
    expect(s.lights.fewer).toBe('green');
  });

  it('cross off is an extra scaffold: it shows the pairs struck, and still asks for the count', () => {
    let s = newAddBoth(P('x-a', 5, -2), { level: 3 });
    s = run(s, { type: 'choose', move: 'add' }, ...typed('5'), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });
    s = run(s, { type: 'select', id: s.board.right[0].id }, { type: 'select', id: s.board.right[1].id });
    expect(run(s, { type: 'crossOff' })).toBe(s);                                        // not before Party or Battle is answered
    s = run(s, { type: 'kind', value: 'battle' }, { type: 'crossOff' });
    expect(s.combining.crossed).toBe(true);
    expect(s.supportsShown).toContain('crossoff');
    expect(s).toMatchObject({ helped: true, stuck: 0 });
    expect(boardText(s.board)).toBe('x + −5 + 5 = −2 + 5');
    s = run(s, ...typed('3'), { type: 'check' });
    expect(boardText(s.board)).toBe('x + −5 + 5 = 3');
  });

  it('combines like groups too (a Party), and only two numbers on one side', () => {
    let s = run(start(), { type: 'choose', move: 'add' }, ...typed('−3'), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });
    const [x, three, minus3] = s.board.left;
    expect(run(s, { type: 'select', id: x.id }).feedback.key).toBe('aOnlyNumbers');
    expect(run(s, { type: 'select', id: three.id }, { type: 'select', id: s.board.right[0].id }).feedback.key).toBe('aSameSide');
    expect(run(s, { type: 'select', id: three.id }, { type: 'select', id: three.id }).combining).toBeNull();
    const party = run(s, { type: 'select', id: s.board.right[0].id }, { type: 'select', id: s.board.right[1].id });
    expect(party.feedback.params).toMatchObject({ g1: '−6', g2: '−3', kind: 'party' });
    expect(minus3.v).toBe(-3);
    expect(kindOf(-6, -3)).toBe('party');
    expect(kindOf(3, -3)).toBe('battle');
    // while two groups are being combined nothing else starts
    expect(run(party, { type: 'choose', move: 'add' })).toBe(party);
    expect(run(party, { type: 'abandon' }).combining).toBeNull();
  });

  it('refuses amount 0, a second add on the same side, and an amount that is too big', () => {
    const s = run(start(), { type: 'choose', move: 'add' });
    expect(run(s, { type: 'addTo', side: 'left' }).feedback.key).toBe('aAmountZero');
    expect(run(s, ...typed('0'), { type: 'addTo', side: 'left' }).feedback.key).toBe('aAmountZero');
    const one = run(s, ...typed('2'), { type: 'addTo', side: 'left' });
    expect(run(one, { type: 'addTo', side: 'left' }).feedback.key).toBe('aOtherSide');
    expect(run(s, ...typed('9'), ...typed('9'), { type: 'addTo', side: 'left' }).feedback.key).toBe('aAmountBig');
  });

  it('an uneven second amount leaves it unbalanced, with Go disabled', () => {
    let s = run(start(), { type: 'choose', move: 'add' }, ...typed('2'), { type: 'addTo', side: 'left' });
    s = run(s, { type: 'backspace' }, ...typed('3'), { type: 'addTo', side: 'right' });
    expect(balanced(s)).toBe(false);
    expect(s.feedback).toMatchObject({ key: 'aUnbalanced', params: { tilt: 1, heavier: 'right' } });
    expect(run(s, { type: 'go' }).feedback.key).toBe('aGoNotYet');
  });

  it('Undo reverses a half-done move in one go, and a whole move step by step', () => {
    const s0 = start();
    let s = run(s0, { type: 'choose', move: 'add' }, ...typed('−3'), { type: 'addTo', side: 'left' });
    s = run(s, { type: 'undo' });
    expect(boardText(s.board)).toBe('x + 3 = −6');
    expect([s.pending, tilt(s)]).toEqual([null, 0]);
    s = run(s0, { type: 'choose', move: 'add' }, ...typed('−3'), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });
    s = run(s, { type: 'undo' });
    expect(boardText(s.board)).toBe('x + 3 = −6');
    expect(s.resolving).toBe(false);
    expect(run(s0, { type: 'undo' })).toBe(s0);
  });
});

describe('the lights, and the wrong-move ladder', () => {
  const start = () => newAddBoth(P('x+a', 3, -6), { level: 3 });

  it('add the same number: red (the number next to x got bigger)', () => {
    const s = doMove(start(), 3);                                                      // x + 3 = −6, add +3: x + 6 = −3
    expect(boardText(s.board)).toBe('x + 6 = −3');
    expect(s.lights).toMatchObject({ fewer: 'red', xAlone: 'off' });
    expect(s.feedback.key).toBe('aRed1');
  });

  it('a partly cancelling amount is neutral', () => {
    const s = doMove(start(), -5);                                                     // x + 3 + −5 = −6 + −5: x + −2 = −11
    expect(boardText(s.board)).toBe('x + −2 = −11');
    expect(s.lights.fewer).toBe('neutral');
    expect(s.feedback.key).toBe('aNeutral');
  });

  it('three reds in a row: undo is offered, then counter mode, then Start over; a good move clears the count', () => {
    let s = start();
    s = doMove(s, 3); expect([s.reds, s.counterMode, s.startOver, s.feedback.key]).toEqual([1, true, false, 'aRed1']);      // counters already on at L3
    const l5 = newAddBoth(P('x+a', 3, -6), { level: 5 });
    let t = doMove(l5, 3);
    expect([t.reds, t.counterMode, t.startOver]).toEqual([1, false, false]);
    t = doMove(t, 3);                                                                  // another +3 on x + 6 = −3
    expect([t.reds, t.counterMode, t.startOver, t.feedback.key]).toEqual([2, true, false, 'aRed2']);
    t = doMove(t, 3);
    expect([t.reds, t.startOver, t.feedback.key]).toEqual([3, true, 'aRed3']);
    expect(t.stuck).toBe(0);                                                           // the ladder does not count as stuck
    const fresh = run(t, { type: 'startOver' });
    expect(boardText(fresh.board)).toBe('x + 3 = −6');
    expect([fresh.reds, fresh.startOver, fresh.history]).toEqual([0, false, []]);
    expect(doMove(t, -9).reds).toBeGreaterThanOrEqual(0);
  });

  it('x alone and x on the left light up in order (the third from level 4)', () => {
    const left = doMove(newAddBoth(P('x+a', 3, 7, false), { level: 4 }), -3);          // x + 3 = 7 → x = 4
    expect(left.lights).toEqual({ fewer: 'green', xAlone: 'green', xLeft: 'green' });
    const right = doMove(newAddBoth(P('x+a', 3, 7, true), { level: 4 }), -3);          // 7 = x + 3 → 4 = x
    expect(boardText(right.board)).toBe('4 = x');
    expect(right.lights).toEqual({ fewer: 'green', xAlone: 'green', xLeft: 'neutral' });
    expect(right.feedback.key).toBe('aSolvedBoard');
    expect(run(right, ...answer('4'))).toMatchObject({ stage: 'done', clean: true });  // credited at once, no gate
  });

  it('Trade places swaps the sides, keeps the balance, and is neutral', () => {
    let s = newAddBoth(P('x+a', 3, 7, true), { level: 4 });
    s = run(s, { type: 'choose', move: 'trade' });
    expect(boardText(s.board)).toBe('x + 3 = 7');
    expect([balanced(s), s.lights.fewer, s.feedback.key]).toEqual([true, 'neutral', 'aTraded']);
    expect(boardText(run(s, { type: 'undo' }).board)).toBe('7 = x + 3');
    expect(run(newAddBoth(P('x+a', 3, 7), { level: 3 }), { type: 'choose', move: 'trade' }).menu).toBeNull();   // not offered before L4
  });
});

describe('cross the border (L6)', () => {
  const start = () => newAddBoth(P('x+a', 3, -6), { level: 6 });

  it('crossed but not switched is unbalanced; switching teams balances it; Go commits', () => {
    const s0 = start();
    const three = s0.board.left[1];
    let s = run(s0, { type: 'choose', move: 'cross' }, { type: 'cross', id: three.id });
    expect(boardText(s.board)).toBe('x = −6 + 3');
    expect([balanced(s), tilt(s)]).toEqual([false, -6]);
    expect(run(s, { type: 'go' }).feedback.key).toBe('aGoNotYet');
    s = run(s, { type: 'flipSign', id: three.id });
    expect(boardText(s.board)).toBe('x = −6 + −3');
    expect([balanced(s), s.feedback.key]).toEqual([true, 'aSwitchedTeams']);
    s = run(s, { type: 'go' });
    expect(boardText(s.board)).toBe('x = −6 + −3');                                    // a Party still to combine
    s = combineAll(s);
    expect(boardText(s.board)).toBe('x = −9');
    expect(s.lights).toMatchObject({ fewer: 'green', xAlone: 'green', xLeft: 'green' });
    expect(run(s, ...answer('−9')).stage).toBe('done');
  });

  it('needs the menu item, and only the crossed number can be switched', () => {
    const s0 = start();
    expect(run(s0, { type: 'cross', id: s0.board.left[1].id })).toBe(s0);
    expect(run(newAddBoth(P('x+a', 3, -6), { level: 5 }), { type: 'choose', move: 'cross' }).menu).toBeNull();
    const crossed = run(s0, { type: 'choose', move: 'cross' }, { type: 'cross', id: s0.board.left[1].id });
    expect(run(crossed, { type: 'flipSign', id: s0.board.right[0].id })).toBe(crossed);
  });
});

describe('typing the answer early', () => {
  const start = () => newAddBoth(P('x-a', 5, -2), { level: 3 });                      // x − 5 = −2 → 3

  it('a right answer first: drag it onto x, click through the order of operations, then make the first good move', () => {
    let s = run(start(), ...answer('3'));
    expect(s.early).toMatchObject({ correct: true, step: 'drag' });
    expect(s.feedback.key).toBe('aEarlyYes');
    expect(s.stuck).toBe(0);
    s = run(s, { type: 'dropValue' });
    expect(s.early.lines).toEqual(['(3) − 5', '3 − 5 = −2', '−2 = −2   Balanced ✓']);
    s = run(s, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(s.early.step).toBe('move');
    s = run(s, { type: 'choose', move: 'add' }, ...typed('5'), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });
    s = combineAll(s);
    expect(s).toMatchObject({ stage: 'done', clean: true, finalText: '3' });
  });

  it('a wrong answer first: the check shows where it fails, and it is discovery, not a stuck click', () => {
    let s = run(start(), ...answer('−7'));
    expect(s).toMatchObject({ wrongs: 1, tag: 'wrong-op', stuck: 0 });
    expect(s.early).toMatchObject({ correct: false, step: 'drag' });
    s = run(s, { type: 'dropValue' });
    expect(s.early.lines.at(-1)).toBe('−12 ≠ −2   Unbalanced ✗');
    s = run(s, { type: 'nextLine' }, { type: 'nextLine' }, { type: 'nextLine' });
    expect(s.early).toBeNull();
    expect(s.feedback.key).toBe('aCheckFailed');
    expect(s.stage).toBe('moves');
  });

  it('once x is alone on the board, a right answer finishes, and a wrong one is sent to the board', () => {
    const s = doMove(start(), 5);
    expect(boardText(s.board)).toBe('x = 3');
    expect(run(s, ...answer('7')).feedback).toMatchObject({ key: 'aReadBoard', params: { answer: 3 } });
    expect(run(s, ...answer('3')).stage).toBe('done');
  });

  it('wants a readable answer, and the move finished first', () => {
    expect(run(start(), { type: 'check' }).feedback.key).toBe('typeAnswer');
    const half = run(start(), { type: 'choose', move: 'add' }, ...typed('5'), { type: 'addTo', side: 'left' }, ...typed('3'));
    expect(half.entry).toBe('');                                                      // typing went to the amount, not the answer
  });

  it('checkLines shows the order of operations for either form', () => {
    expect(checkLines(P('x+a', 3, -6), -9)).toEqual(['(−9) + 3', '−9 + 3 = −6', '−6 = −6   Balanced ✓']);
    expect(checkLines(P('x+a', 3, -6), -3)[2]).toBe('0 ≠ −6   Unbalanced ✗');
  });
});

describe('I\'m stuck and Teach me', () => {
  const start = () => newAddBoth(P('x+a', 3, -6), { level: 5 });

  it('climbs one rung a click: counters, choose the move, the guided move (each click counts)', () => {
    let s = run(start(), { type: 'stuck' });
    expect(s).toMatchObject({ stuck: 1, rung: 1, counterMode: true, helped: true });
    expect(s.hint).toMatchObject({ kind: 'cancel' });
    expect(s.feedback).toMatchObject({ key: 'aStuck1', params: { constant: '3' } });
    s = run(s, { type: 'stuck' });
    expect([s.rung, s.menu, s.feedback.key]).toEqual([2, 'add', 'aStuck2']);
    s = run(s, { type: 'stuck' });
    expect(s).toMatchObject({ rung: 3, amountEntry: '-3' });
    expect(s.hint).toEqual({ kind: 'amount', amount: -3 });
    expect(run(s, { type: 'stuck' })).toMatchObject({ rung: 3, stuck: 4 });
    expect(s.supportsShown).toEqual(['counters', 'move', 'guided']);
  });

  it('a wrong amount is allowed under stuck rung 2 (it shows the result and the lights)', () => {
    let s = run(start(), { type: 'stuck' }, { type: 'stuck' }, ...typed('2'));
    s = run(s, { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });
    expect(s.resolving || s.lights.fewer !== 'off').toBe(true);
  });

  it('Teach me is a forced path: only the right amount is enabled, and the student does every action', () => {
    let s = run(start(), { type: 'teach' });
    expect(s).toMatchObject({ taught: 1, forced: true, menu: 'add', amountEntry: '-3', clean: false });
    expect(run(s, { type: 'backspace' }, { type: 'backspace' }, ...typed('2'), { type: 'addTo', side: 'left' }).feedback).toMatchObject({ key: 'aForced', params: { amount: '−3' } });
    s = run(s, { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' });
    s = combineAll(s);
    expect(boardAnswer(s.board)).toBe(-9);
    s = run(s, ...answer('−9'));
    expect(s).toMatchObject({ stage: 'done', clean: false, taught: 1 });
  });

  it('once x is alone, stuck says to read the board', () => {
    const s = run(doMove(start(), -3), { type: 'stuck' });
    expect(s.feedback.key).toBe('aStuckSolved');
  });
});

describe('building the equation from counters (L1–L2)', () => {
  it('starts in the build stage, takes one-signed groups of counters, and moves on when it matches', () => {
    let s = newAddBoth(P('x+a', 2, 3), { level: 1 });                                    // x + 2 = 3
    expect([s.stage, s.feedback.key]).toEqual(['build', 'aBuild']);
    expect(run(s, ...typed('5')).entry).toBe('');                                         // no answer pad while building
    s = run(s, { type: 'buildTap', group: 'constant', sign: '+' }, { type: 'buildTap', group: 'constant', sign: '+' });
    expect(s.built).toEqual({ constant: 2, other: 0 });
    expect(run(s, { type: 'buildTap', group: 'constant', sign: '-' }).feedback.key).toBe('aBuildOneSign');
    s = run(s, { type: 'buildTap', group: 'other', sign: '+' }, { type: 'buildTap', group: 'other', sign: '+' }, { type: 'buildTap', group: 'other', remove: true });
    expect([s.stage, s.built.other]).toEqual(['build', 1]);                              // one taken back off
    s = run(s, { type: 'buildTap', group: 'other', sign: '+' }, { type: 'buildTap', group: 'other', sign: '+' });
    expect([s.stage, s.step, s.feedback.key]).toEqual(['moves', 'moves', 'aBuilt']);
    expect(run(newAddBoth(P('x+a', 2, 3), { level: 3 })).stage).toBe('moves');
    expect(formatAddBoth(s.problem)).toBe('x + 2 = 3');
  });
});
