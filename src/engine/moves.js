// Move validators. Each returns { ok, feedbackKey, params? }.
// Feedback text lives in one table (src/view/feedback.js).
// Pure logic, no DOM.

import { rewrite, evaluate, partyOrBattle, isSubtraction } from './expr.js';

// Most counters a zone can hold (|n| ≤ 12).
export const MAX_PER_ZONE = 12;

const pass = (feedbackKey, params) => ({ ok: true, feedbackKey, params });
const fail = (feedbackKey, params) => ({ ok: false, feedbackKey, params });

// ① Rewrite. flips = { op, sign }: which pieces the student has flipped.
export function validateRewrite(problem, flips) {
  const n = (flips.op ? 1 : 0) + (flips.sign ? 1 : 0);
  if (!isSubtraction(problem)) return n ? fail('alreadyAddition') : fail('rewriteIntro');
  if (n === 2) return pass('rewriteDone');
  return n === 1 ? fail('flipBoth') : fail('rewriteIntro');
}

// ① "Nothing to rewrite" is the right move only on addition problems.
export function validateNothingToRewrite(problem) {
  return isSubtraction(problem) ? fail('notAddition') : pass('nothingToRewriteOk');
}

// The two numbers the counter zones must show, after rewriting.
export function zoneTargets(problem) {
  const r = rewrite(problem);
  return [r.left.value, r.right.value];
}

// ② Draw. zones = [[{ sign }...], [{ sign }...]] for the left and right numbers.
export function validateDraw(problem, zones) {
  const targets = zoneTargets(problem);
  for (let i = 0; i < targets.length; i++) {
    const n = targets[i];
    const sign = n > 0 ? '+' : '-';
    const need = Math.abs(n);
    const counters = zones[i] ?? [];
    if (counters.length === 0 || counters.some((c) => c.sign !== sign)) {
      return fail('needType', { zone: i, n, count: need, sign });
    }
    if (counters.length !== need) {
      return fail('countAgain', { zone: i, n, have: counters.length });
    }
  }
  return pass('drawDone');
}

// ③ Party (same signs → add) or Battle (different signs → cancel).
export function validatePartyBattle(problem, choice) {
  if (choice !== partyOrBattle(problem)) return fail('sameOrDifferent');
  return pass(choice === 'party' ? 'partyOk' : 'battleOk');
}

// ④ Cancel: a pair is one + and one −, neither already canceled.
export function validatePair(a, b) {
  if (a.canceled || b.canceled) return fail('alreadyCanceled');
  if (a.sign === b.sign) return fail('pairNeedsBoth');
  return pass('pairCanceled');
}

// ④ Cancel is complete when at most one kind of counter is left.
export function isCancelComplete(zones) {
  const left = new Set(zones.flat().filter((c) => !c.canceled).map((c) => c.sign));
  return left.size <= 1;
}

// ⑤ Answer: only the correct signed integer passes.
export function validateAnswer(problem, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return fail('typeAnswer');
  if (!Number.isInteger(value) || value !== evaluate(problem)) return fail('countWhoIsLeft');
  return pass('correct', { answer: value });
}
