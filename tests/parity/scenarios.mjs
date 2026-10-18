// The scripted runs the parity harness replays on Add to both sides and Divide it (tests/parity/README.md). Each scenario is a
// problem, the options it starts with, and a list of actions in the order a student would make them. The harness records the
// state after every action (the trace) and the class-sheet record at the end (the event). Pure data plus two tiny helpers.
// (Since Build C there is no Guess x / Use a move choice: a value typed while x is not alone is a guess, and a move is always live.)

import { makeAddBoth } from '../../src/engine/addBoth.js';
import { makeDivide } from '../../src/engine/divide.js';

// Typing a signed whole number on the pad: the digits, then ± for a negative.
export const type = (n) => [...String(Math.abs(n))].map((d) => ({ type: 'digit', digit: Number(d) })).concat(n < 0 ? [{ type: 'toggleSign' }] : []);
const times = (n, action) => Array.from({ length: n }, () => action);

const A = (form, a, x, mirror = false) => makeAddBoth(form, a, x, mirror);
const addMove = (k) => [{ type: 'choose', move: 'add' }, ...type(k), { type: 'go' }];
const addCheck = (v) => [...type(v), { type: 'check' }, { type: 'placeValue' }, ...times(2, { type: 'nextLine' })];   // (Build D: the value is dragged into x first)

// x + 8 = −4 (answer −12) is the Level 4 problem the inventory's screenshots use (seed 7).
const P = A('x+a', 8, -12);

export const ADD_SCENARIOS = {
  'clean-move': { problem: P, opts: { level: 4 }, actions: [...addMove(-8), ...addCheck(-12)] },
  // after Undo the move stays chosen and its blank is cleared: the student types the new amount straight away
  'red-then-undo': { problem: P, opts: { level: 4 }, actions: [...addMove(8), { type: 'undo' }, ...type(-8), { type: 'go' }, ...addCheck(-12)] },
  // after the Undo the hint opens the Add move with its blank cleared: the amount is typed straight in
  'wrong-guess-then-undo': { problem: P, opts: { level: 4 }, actions: [...addCheck(4), { type: 'undo' }, ...type(-8), { type: 'go' }, ...addCheck(-12)] },
  'correct-guess': { problem: P, opts: { level: 4 }, actions: [...addCheck(-12)] },
  'stuck-x4-then-solve': {
    problem: P, opts: { level: 4 },
    actions: [...times(4, { type: 'stuck' }), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' },
      { type: 'kind', value: 'battle' }, { type: 'kind', value: 'party' }, ...addCheck(-12)],
  },
  'teach-me': {
    problem: P, opts: { level: 4 },
    actions: [{ type: 'teach' }, { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' },
      { type: 'kind', value: 'battle' }, { type: 'kind', value: 'party' }, ...addCheck(-12)],
  },
  'forced-move': { problem: A('x-a', 5, 3), opts: { level: 4, forceMove: true }, actions: [...addMove(5), ...addCheck(3)] },
  // the states Build A changes: a partial move, x alone with two numbers, a red move waiting for Undo
  'partial-then-stuck-x4': { problem: P, opts: { level: 4 }, actions: [...addMove(-5), ...times(4, { type: 'stuck' }), { type: 'addTo', side: 'left' }, { type: 'addTo', side: 'right' }, { type: 'go' }] },
  'partial-then-teach': { problem: P, opts: { level: 4 }, actions: [...addMove(-5), { type: 'teach' }, { type: 'addTo', side: 'left', amount: -3 }, { type: 'addTo', side: 'right', amount: -3 }, { type: 'go' }] },
  'x-alone-then-stuck-x4': { problem: P, opts: { level: 4 }, actions: [...addMove(-8), ...times(4, { type: 'stuck' }), { type: 'kind', value: 'battle' }, { type: 'kind', value: 'party' }, ...addCheck(-12)] },
  'x-alone-then-teach': { problem: P, opts: { level: 4 }, actions: [...addMove(-8), { type: 'teach' }, ...addCheck(-12)] },
  'red-then-stuck': { problem: P, opts: { level: 4 }, actions: [...addMove(8), { type: 'stuck' }, { type: 'stuck' }, { type: 'undo' }, { type: 'stuck' }] },
  'zero-other-then-undo-stuck': { problem: P, opts: { level: 4 }, actions: [...addMove(4), { type: 'stuck' }, { type: 'undo' }, { type: 'stuck' }] },
  'L2-build': { problem: A('x+a', 8, 3), opts: { level: 2 }, actions: [{ type: 'stuck' }, { type: 'stuck' }, { type: 'pickPiece', piece: 'x' }, { type: 'zone', side: 'left' }] },
  'L5-trade-places': { problem: A('x+a', 3, 2, true), opts: { level: 5, introTrade: true }, actions: [{ type: 'choose', move: 'trade' }, ...addMove(-3), ...addCheck(2)] },
};

const D = (a, x) => makeDivide(a, x);
const take = (n) => [{ type: 'choose', move: 'fraction' }, { type: 'take', n }];
const divCheck = (v) => [...type(v), { type: 'check' }, { type: 'placeValue' }, ...times(4, { type: 'nextLine' })];
const deal = (count, groups) => Array.from({ length: count }, (_, i) => ({ type: 'deal', group: i % groups }));

// 5x = −15 (answer −3) is the Level 3 problem of the screenshots; 4x = 8 the Level 5 composite one.
const Q = D(5, -3);

export const DIVIDE_SCENARIOS = {
  'clean-move': { problem: Q, opts: { level: 3 }, actions: [...take(5), ...divCheck(-3)] },
  'failed-then-undo': { problem: Q, opts: { level: 3 }, actions: [...take(2), { type: 'undo' }, ...take(5), ...divCheck(-3)] },
  'wrong-guess-then-undo': { problem: Q, opts: { level: 3 }, actions: [...divCheck(4), { type: 'undo' }, ...take(5), ...divCheck(-3)] },
  'correct-guess': { problem: Q, opts: { level: 3 }, actions: [...divCheck(-3)] },
  'stuck-x2-then-solve': { problem: Q, opts: { level: 3 }, actions: [{ type: 'stuck' }, { type: 'stuck' }, { type: 'take', n: 5 }, ...deal(15, 5), { type: 'keep', group: 0 }, { type: 'foldNext' }, ...divCheck(-3)] },
  'teach-me': { problem: Q, opts: { level: 3 }, actions: [{ type: 'teach' }, { type: 'take', n: 5 }, ...deal(15, 5), { type: 'keep', group: 0 }, ...divCheck(-3)] },
  'forced-move': { problem: D(3, 4), opts: { level: 2, forceMove: true }, actions: [...take(3), ...divCheck(4)] },
  'partial-composite': { problem: D(4, 2), opts: { level: 5 }, actions: [...take(2), { type: 'stuck' }, { type: 'stuck' }, ...take(2), ...divCheck(2)] },
  'x-alone-then-stuck-x2': { problem: Q, opts: { level: 3 }, actions: [...take(5), { type: 'stuck' }, { type: 'stuck' }, ...divCheck(-3)] },
  'failed-then-stuck': { problem: Q, opts: { level: 3 }, actions: [...take(2), { type: 'stuck' }, { type: 'stuck' }, { type: 'undo' }, { type: 'stuck' }] },
};
