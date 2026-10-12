// Divide it (SPEC-DIVIDE-IT.md): solve `ax = b` by keeping 1/n of both sides. A problem is { kind: 'divide', a, b, x }: a boxes
// on the left (a from 2 to 6), b counters on the right, x = b / a the whole-number answer. Positive coefficients only; every
// problem is built from its solution and checked by substitution. Pure logic, no DOM.

import { MINUS } from './expr.js';

export const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

export function makeDivide(a, x) {
  if (!Number.isInteger(a) || a < 2 || a > 6) throw new Error(`Bad coefficient: ${a}`);
  if (!Number.isInteger(x) || x === 0 || Math.abs(x) === 1) throw new Error(`Bad answer: ${x}`);
  const p = { kind: 'divide', a, b: a * x, x };
  if (p.a * p.x !== p.b) throw new Error('substitution check failed');
  return p;
}

export const answerOf = (p) => p.x;
export const answerText = (p) => signed(p.x);
export const formatDivide = (p) => `${p.a}x = ${signed(p.b)}`;

// Does a typed answer put x back in and balance the equation (a × typed = b)?
export const balances = (p, typed) => p.a * typed === p.b;

// ---------- The fractions on the menu: ½ ⅓ ¼ ⅕ ⅙ (never a divisor above 6) ----------

export const FRACTIONS = [2, 3, 4, 5, 6];
export const fractionText = (n) => ({ 2: '½', 3: '⅓', 4: '¼', 5: '⅕', 6: '⅙' }[n]);

// What taking 1/n of both sides does to this problem: the boxes split into n equal groups only if n divides a, the counters
// only if n divides b. Because a divides b, every divisor of a also divides b, so "legal" is "n divides a".
export function takeFraction(p, n) {
  const boxesSplit = p.a % n === 0;
  const countersSplit = p.b % n === 0;
  if (!boxesSplit || !countersSplit) return { ok: false, boxesSplit, countersSplit, leftOver: p.b % n === 0 ? 0 : Math.abs(p.b) % n };
  return { ok: true, boxesSplit, countersSplit, a: p.a / n, b: p.b / n, finishes: p.a / n === 1 };
}
// The fractions that work on both sides (every n from 2 to 6 dividing a); the one that finishes is n = a.
export const legalFractions = (p) => FRACTIONS.filter((n) => takeFraction(p, n).ok);

// ---------- What a wrong answer looked like (§5) ----------
// A number can fit more than one slip, so each wrong value gets one tag, in this order (BUILD-NOTES §2.2):
//   ignored-front   gave b (ignored the number in front of x)
//   wrong-team      the right size with the wrong sign (−x)
//   multiplied      a × b
//   halfway         stopped after a fraction that was legal but did not finish (b / n for n dividing a, n < a)
//   wrong-groups    shared into a number of groups that is not the number of boxes (b / n, n from 2 to 6)
//   gave-boxes      gave a, the number of boxes
//   undid-add       b + a or b − a, as if x were added to something
export function tagDivide(p, typed) {
  if (typed === p.x) return null;
  if (typed === p.b) return 'ignored-front';
  if (typed === -p.x) return 'wrong-team';
  if (typed === p.a * p.b) return 'multiplied';
  const groups = groupsOf(p, typed);
  if (groups && groups < p.a && p.a % groups === 0) return 'halfway';
  if (groups && groups !== p.a) return 'wrong-groups';
  if (typed === p.a) return 'gave-boxes';
  if (typed === p.b + p.a || typed === p.b - p.a) return 'undid-add';
  return 'unmatched';
}
// How many equal groups would the counters have been shared into to get this value in each? (null if it is not b / n for n 2–6.)
export function groupsOf(p, typed) {
  if (typed === 0) return null;
  const n = p.b / typed;
  return Number.isInteger(n) && n >= 2 && n <= 6 ? n : null;
}

// A typed answer: an integer, from the pad. { correct, typed, tag } or { unreadable: true }.
export function checkDivide(p, text) {
  const t = String(text).replace(/−/g, '-').trim();
  if (!/^-?\d+$/.test(t)) return { unreadable: true, correct: false, tag: 'unreadable' };
  const typed = Number(t);
  return { correct: typed === p.x, typed, tag: tagDivide(p, typed) };
}
