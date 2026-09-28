// Group problems for the Lasso pack (SPEC-LASSO.md): A(B) means A groups of B.
// Pure logic, no DOM.
//
// A is stored as a sign plus a fraction n/d (d = 1 for whole numbers):
//   3(−2)    → { neg: false, n: 3, d: 1 },  B = −2
//   −(−5)    → { neg: true,  n: 1, d: 1 },  B = −5, hidden1: true (written without the 1)
//   −2/3(−6) → { neg: true,  n: 2, d: 3 },  B = −6
// B is a term, like Flip It's: { kind: 'int', value }. Groups of Terms will
// later put variable terms inside the parentheses.

import { MINUS } from './expr.js';

export function makeGroups({ neg = false, n, d = 1 }, b, { hidden1 = false } = {}) {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Bad group count: ${n}`);
  if (!Number.isInteger(d) || d < 1) throw new Error(`Bad denominator: ${d}`);
  if (!Number.isInteger(b) || b === 0) throw new Error(`Bad group value: ${b}`);
  if (b % d !== 0) throw new Error(`${b} doesn't split into ${d} equal parts`);
  if (hidden1 && !(neg && n === 1 && d === 1)) throw new Error('Only −(B) hides a 1');
  return { kind: 'groups', count: { neg, n, d }, inside: { kind: 'int', value: b }, hidden1 };
}

export const isFraction = (p) => p.count.d > 1;
export const isOpposite = (p) => p.count.neg;

// Whole-number problems: how many lassos to draw (|A|).
export const lassoCount = (p) => (isFraction(p) ? 1 : p.count.n);

// Fraction problems: the size of each equal part (B / d).
export const partValue = (p) => p.inside.value / p.count.d;

// What the lassos hold before any opposite: A's size times B (the notes' "→ −8").
export const groupTotal = (p) => p.count.n * partValue(p);

// The answer: the opposite of the total when the groups are opposite.
export const evaluateGroups = (p) => (isOpposite(p) ? -groupTotal(p) : groupTotal(p));

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

// "3(−2)", "−(−5)", "−1(−5)", "2/3(−6)", "−2/3(−6)". The view draws fractions stacked.
export function formatGroups(p) {
  const { neg, n, d } = p.count;
  const size = p.hidden1 ? '' : d > 1 ? `${n}/${d}` : `${n}`;
  return `${neg ? MINUS : ''}${size}(${signed(p.inside.value)})`;
}
