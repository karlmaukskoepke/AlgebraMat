// Move validators for the Lasso pack (SPEC-LASSO.md §3). Each returns
// { ok, feedbackKey, params? }; the wording lives in view/lassoFeedback.js.
// Pure logic, no DOM.

import { lassoCount, groupTotal, evaluateGroups, isOpposite } from './groups.js';

const pass = (feedbackKey, params) => ({ ok: true, feedbackKey, params });
const fail = (feedbackKey, params) => ({ ok: false, feedbackKey, params });

// Most counters one lasso can take while filling (B is at most ±8; room to overshoot).
export const MAX_IN_LASSO = 12;
// Lassos a student can draw (the most groups is 5; one extra so "too many" can happen).
export const MAX_LASSOS = 6;

const groupSign = (p) => (p.inside.value > 0 ? '+' : '-');

// ① Groups: the hidden 1 written (for −(B)), and exactly |A| lassos.
export function validateGroups(problem, { count, wroteOne }) {
  if (problem.hidden1 && !wroteOne) return fail('writeOne');
  const n = lassoCount(problem);
  if (count !== n) return fail('groupCount', { n, have: count });
  return pass('groupsDone');
}

// ② + or − groups: − for opposite groups.
export function validateGroupSign(problem, sign) {
  const right = isOpposite(problem) ? '-' : '+';
  if (sign !== right) return fail('lookAtSign');
  return pass(right === '-' ? 'oppositeGroups' : 'plusGroups');
}

// ③ Fill, one lasso: it must hold exactly one group of B.
export function validateGroup(problem, terms, index = 0) {
  const b = problem.inside.value;
  const sign = groupSign(problem);
  const count = Math.abs(b);
  if (terms.length === 0 && index > 0) return fail('copyEachGroup', { b, index });
  if (terms.length === 0 || terms.some((t) => t.sign !== sign)) return fail('needGroupType', { b, count, sign, index });
  if (terms.length !== count) return fail('groupCountAgain', { b, have: terms.length, index });
  return pass('groupOk');
}

// ③ Fill, every lasso.
export function validateFill(problem, lassos) {
  for (let i = 0; i < lassos.length; i++) {
    const res = validateGroup(problem, lassos[i].terms, i);
    if (!res.ok) return res;
  }
  return pass('fillDone');
}

const noValue = (v) => v === null || v === undefined || Number.isNaN(v);

// ④ Count: the total in all the lassos, before any opposite.
export function validateCount(problem, value) {
  if (noValue(value)) return fail('typeAnswer');
  if (value !== groupTotal(problem)) return fail('countAll');
  return isOpposite(problem) ? pass('countDoneOpp', { total: value }) : pass('correct', { answer: value });
}

// ⑤ Opposite: the answer after flipping every group.
export function validateOppositeAnswer(problem, value) {
  if (noValue(value)) return fail('typeAnswer');
  if (value !== evaluateGroups(problem)) return fail('oppositeOf', { total: groupTotal(problem) });
  return pass('correct', { answer: value });
}

// ---------- Fraction groups (SPEC-LASSO.md §3b) ----------

// Most parts a student can draw (sixths are the most; one extra so "too many" can happen).
export const MAX_PARTS = 7;

// ① Whole: the whole group B, drawn in one lasso.
export function validateWhole(problem, terms) {
  const b = problem.inside.value;
  const sign = b > 0 ? '+' : '-';
  const count = Math.abs(b);
  if (terms.length === 0 || terms.some((t) => t.sign !== sign)) return fail('wholeType', { b, count, sign });
  if (terms.length !== count) return fail('wholeCount', { b, have: terms.length });
  return pass('wholeDone', { d: problem.count.d });
}

// ② Split: d parts, every counter dealt out, all parts equal.
export function validateSplit(problem, { whole, parts }) {
  const d = problem.count.d;
  if (parts.length !== d) return fail('splitParts', { d, have: parts.length });
  if (whole.length > 0) return fail('dealAll');
  const sizes = parts.map((p) => p.terms.length);
  if (sizes.some((n) => n !== sizes[0])) return fail('unequalParts');
  return pass('splitDone', { n: problem.count.n, size: problem.inside.value / d });
}

// ③ Take: exactly n parts.
export function validateTake(problem, parts) {
  const n = problem.count.n;
  const taken = parts.filter((p) => p.taken).length;
  if (taken !== n) return fail('takeN', { n, have: taken });
  return pass('takeDone');
}

// ⑤ Opposite or not: "No opposite" passes only when A > 0; opp. only when A < 0.
export function validateOppositeChoice(problem, choice) {
  const right = isOpposite(problem) ? 'opp' : 'none';
  if (choice !== right) return fail(right === 'opp' ? 'isOppositeGroup' : 'notOpposite');
  return pass(right === 'opp' ? 'oppDone' : 'correct');
}
