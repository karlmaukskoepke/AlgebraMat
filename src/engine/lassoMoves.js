// Move validators for the Group It pack (SPEC-LASSO.md §3). Each returns
// { ok, feedbackKey, params? }; the wording lives in view/lassoFeedback.js.
// Pure logic, no DOM.

import { lassoCount, evaluateGroups, isOpposite, isFraction } from './groups.js';

const pass = (feedbackKey, params) => ({ ok: true, feedbackKey, params });
const fail = (feedbackKey, params) => ({ ok: false, feedbackKey, params });

// Most counters one group can take while filling (B is at most ±8; room to overshoot).
export const MAX_PER_GROUP = 12;
// Groups a student can make (the most is 5; one extra so "too many" can happen).
export const MAX_GROUPS_MADE = 6;
// Parts of a fraction bar (sixths are the most; one extra so "too many" can happen).
export const MAX_PARTS = 7;
// Counters dealt into a fraction bar (|B| is at most 12; room to overshoot).
export const MAX_DEALT = 14;

const signOf = (v) => (v > 0 ? '+' : '-');

// ① Groups: the hidden 1 written (for −(B)), then |A| groups — or, for a
// fraction, d groups joined into one bar.
export function validateGroups(problem, { count, wroteOne }) {
  if (problem.hidden1 && !wroteOne) return fail('writeOne');
  if (isFraction(problem)) {
    const d = problem.count.d;
    if (count !== d) return fail('partCount', { d, have: count });
    return pass('partsDone', { d });
  }
  const n = lassoCount(problem);
  if (count !== n) return fail('groupCount', { n, have: count });
  return pass('groupsDone');
}

// ② + or − groups: − for opposite groups.
export function validateGroupSign(problem, sign) {
  const right = isOpposite(problem) ? '-' : '+';
  if (sign !== right) return fail(isFraction(problem) ? 'lookAtFractionSign' : 'lookAtSign');
  return pass(right === '-' ? 'oppositeGroups' : 'plusGroups', { fraction: isFraction(problem) });
}

// ③ Fill, one group: it must hold exactly one group of B. `index` names it.
export function validateGroup(problem, terms, index = 0) {
  const b = problem.inside.value;
  const sign = signOf(b);
  const count = Math.abs(b);
  if (terms.length === 0) return fail('emptyGroup', { b, index });
  if (terms.some((t) => t.sign !== sign)) return fail('needGroupType', { b, count, sign, index });
  if (terms.length !== count) return fail('groupCountAgain', { b, have: terms.length, index });
  return pass('groupOk');
}

// ③ Fill, every group, in any order.
export function validateFill(problem, groups) {
  for (let i = 0; i < groups.length; i++) {
    const res = validateGroup(problem, groups[i].terms, i);
    if (!res.ok) return res;
  }
  return pass(isOpposite(problem) ? 'fillDoneOpp' : 'fillDone');
}

// ③ Fill, fraction bar: all of B dealt out, one part after the next.
// Dealing in turn keeps the parts equal, so only the sign and total can be off.
export function validateDeal(problem, groups) {
  const b = problem.inside.value;
  const sign = signOf(b);
  const count = Math.abs(b);
  const terms = groups.flatMap((g) => g.terms);
  if (terms.length === 0 || terms.some((t) => t.sign !== sign)) return fail('dealType', { b, count, sign });
  if (terms.length !== count) return fail('dealCount', { b, have: terms.length });
  return pass('dealDone', { n: problem.count.n, size: b / problem.count.d });
}

// ④ Take: exactly n parts.
export function validateTake(problem, groups) {
  const n = problem.count.n;
  const taken = groups.filter((g) => g.taken).length;
  if (taken !== n) return fail('takeN', { n, have: taken });
  return pass(isOpposite(problem) ? 'takeDoneOpp' : 'takeDone');
}

const noValue = (v) => v === null || v === undefined || Number.isNaN(v);

// Count: the total after any flip — the answer.
export function validateCount(problem, value) {
  if (noValue(value)) return fail('typeAnswer');
  if (value !== evaluateGroups(problem)) return fail(isFraction(problem) ? 'countTaken' : 'countAll');
  return pass('correct', { answer: value });
}
