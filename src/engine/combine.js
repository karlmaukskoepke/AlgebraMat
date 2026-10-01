// The Combine it model (SPEC-COMBINE.md): signed whole numbers added together, and Flip It's
// mixed level, where some are subtracted. Pure logic, no DOM.
//
// Two-term problems for Levels 1 and 2 are Flip It's (engine/expr.js: { left, op, right }).
// Anything longer is an expression of integer terms from engine/terms.js:
//   5 + (−8) + 2         → [{ int, '+', 5 }, { int, '+', −8 }, { int, '+', 2 }]
//   5 − (−3) + (−7) − 2  → ops '+', '-', '+', '-'
// where `value` is the number as written and `op` is the operation in front of it.

import { makeTerm, makeExpression, effective, formatExpression } from './terms.js';

export const intTerm = (op, value) => makeTerm('int', op, value);

// An addition expression from signed numbers: [5, −8, 2] → 5 + (−8) + 2.
export const sumExpression = (values) => makeExpression(values.map((v, i) => intTerm('+', v)));

// The total of an expression: each term is worth its operation times its number.
export const total = (expr) => expr.terms.reduce((sum, t) => sum + effective(t), 0);

export const termsText = (expr) => formatExpression(expr);

// Which terms are subtracted (their operation in front is −): the ones Flip It's Rewrite flips,
// whatever the sign of the number (− 2 and − (−3) both flip).
export const subtracted = (expr) => expr.terms.map((t, i) => (t.op === '-' ? i : -1)).filter((i) => i >= 0);

// How many counters are drawn for an expression (each term draws |worth| of them).
export const counterTotal = (expr) => expr.terms.reduce((sum, t) => sum + Math.abs(t.value), 0);

// Signs of the terms as they're worth: '+' or '-'.
export const signOfTerm = (t) => (effective(t) < 0 ? '-' : '+');

// Level 4 (no counters): how the two numbers meet. Same signs is a party, different is a battle.
export const meeting = (a, b) => (Math.sign(a) === Math.sign(b) ? 'party' : 'battle');

// Level 4, three terms: the two that share a sign are combined first (a party), leaving one number
// of each sign (a battle). Returns { pair: [i, j], other, partial } or null if all three share a sign.
export function combineFirst(expr) {
  const values = expr.terms.map(effective);
  const pos = values.map((v, i) => (v > 0 ? i : -1)).filter((i) => i >= 0);
  const neg = values.map((v, i) => (v < 0 ? i : -1)).filter((i) => i >= 0);
  const pair = pos.length === 2 && neg.length === 1 ? pos : neg.length === 2 && pos.length === 1 ? neg : null;
  if (!pair) return null;
  const other = values.map((_, i) => i).find((i) => !pair.includes(i));
  return { pair, other, partial: values[pair[0]] + values[pair[1]] };
}
