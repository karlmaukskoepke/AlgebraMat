// Switch sides as a pure reducer (SPEC-SOLVE.md §8). First the move: the number that is added to or subtracted from x is
// dragged (or tapped) across the border, and it switches teams: +4 becomes −4. Then the student adds up the other side
// (and, in a two-step equation, shares it among the boxes) and types x, as in One-step and Two-step: Check puts the answer
// back in, and a wrong answer climbs the same supports, which here are the check, the pairs cancelling, and what's left.
// Teach me and I'm stuck before the move make the move.

import { newSolveLight, reduceSolveLight } from './solveLight.js';
import { coefOf, constOf } from './solve2.js';
import { MINUS } from './expr.js';

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
const withSign = (v) => (v < 0 ? `${MINUS}${-v}` : `+${v}`);

// The move for an equation: the number, where it goes, what it becomes, and how the work is written.
export function moveInfo(p) {
  const two = p.kind === 'solve2';
  const B = two ? constOf(p) : (p.form === 'x-a' ? -p.a : p.a);          // the number as it sits in the equation, with its sign
  const other = two ? p.c : p.b;                                          // what is on the other side
  const lead = two ? `${coefOf(p)}x` : 'x';
  const sum = `${signed(other)} + ${signed(-B)}`;
  return {
    two, B, other, n: Math.abs(B),
    con: withSign(B), flipped: withSign(-B),
    rec: p.mirror ? `${sum} = ${lead}` : `${lead} = ${sum}`,
    sum,
    left: signed(other - B),                                               // what the other side comes to
  };
}

export function newSwitch(problem) {
  return { ...newSolveLight(problem), step: 'move', moved: false, feedback: { key: 'wIntro', params: moveInfo(problem) } };
}

const say = (s, key, params, bad = false) => { s.feedback = { key, params: { ...moveInfo(s.problem), ...params }, bad }; return s; };

export function reduceSwitch(state, action) {
  if (state.stage === 'done') return state;
  const info = moveInfo(state.problem);
  // The move itself: the group crossed the border (or was tapped).
  if (action.type === 'move') {
    if (state.moved) return state;
    const s = structuredClone(state);
    s.moved = true;
    s.step = 'answer';
    return say(s, 'wMoved');
  }
  // Answers wait for the move.
  if (!state.moved && action.type === 'check') {
    const s = structuredClone(state);
    return say(s, 'wFirst', undefined, true);
  }
  // Stuck or Teach me before the move: the move is made for them (and counted).
  if (!state.moved && (action.type === 'stuck' || action.type === 'teach')) {
    const s = structuredClone(state);
    s.moved = true;
    s.step = 'answer';
    s.helped = true;
    if (action.type === 'stuck') { s.stuck += 1; return say(s, 'wMovedForYou'); }
    s.taught += 1;
    s.rung = 3;
    s.supportsShown = [...new Set([...s.supportsShown, 'balance', 'undo'])];
    return say(s, 'wTeach');
  }
  const next = reduceSolveLight(state, action);
  if (next === state) return state;
  // the messages carry the numbers of this move
  return { ...next, feedback: next.feedback ? { ...next.feedback, params: { ...next.feedback.params, ...info } } : next.feedback };
}
