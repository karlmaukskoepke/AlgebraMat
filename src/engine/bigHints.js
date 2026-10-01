// Combine it Level 4 hints after 3 wrong tries on the same step (SPEC-COMBINE.md §3). A hint shows the
// move and never makes it. bigHintFor(state) → null | { key, params, show: { terms: [term indexes to blink] } }.

import { HINT_AFTER } from './hints.js';
import { termHintFor } from './termHints.js';
import { meetingNumbers, rightChoice, bigAnswer } from './bigSession.js';

export function bigHintFor(s) {
  if (!s || s.step === 'done' || (s.tries[s.step] ?? 0) < HINT_AFTER) return null;
  const { problem } = s;
  const all = problem.terms.map((_, i) => i);
  const nums = meetingNumbers(problem);

  switch (s.step) {
    case 'boxcircle': {
      const hint = termHintFor(s);
      return hint ? { ...hint, key: 'hintBigCircle' } : null;
    }
    case 'combine':
      return { key: 'hintCombine', show: { terms: nums.pair } };
    case 'partyBattle':
      return { key: 'hintBigPartyBattle', params: { a: nums.a, b: nums.b, same: rightChoice(problem) === 'party' }, show: { terms: all } };
    case 'addSub':
      return { key: 'hintBigAddSub', params: { choice: s.choice }, show: { terms: all } };
    case 'sign': {
      // A party's numbers share the sign; in a battle the bigger one wins, so it blinks (for three terms,
      // that's the combined pair or the odd one out).
      const aWins = Math.abs(nums.a) > Math.abs(nums.b);
      const winner = s.choice === 'party' ? all : nums.pair ? (aWins ? nums.pair : [nums.other]) : [aWins ? 0 : 1];
      return { key: 'hintBigSign', params: { choice: s.choice }, show: { terms: winner } };
    }
    case 'answer':
      return { key: 'hintBigAnswer', params: { op: s.op, sign: s.sign, negative: bigAnswer(problem) < 0 }, show: { terms: all } };
    default:
      return null;
  }
}
