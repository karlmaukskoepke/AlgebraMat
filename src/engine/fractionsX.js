// Fractions of x (Build AA, Karl 2026-11-01): solve `⅓x = 4`, `x/3 = 4`, `⅔x = 6` and their negatives and mirrors, every answer whole and
// every part whole. A problem is { kind: 'fracx', p, q, neg, b, x, mirror, form }: the equation `(±p/q)x = b` (or `b = (±p/q)x` when
// mirror), written `⅔x` (form 'times', a fraction times x) or `2x/3` (form 'over', the x over the bottom, `x/3` when p is 1). p from 1 to 5,
// q from 2 to 6, p < q, in lowest terms; b is divisible by p so one part (b/p) is whole; x = q·b/(±p). Built from its solution and checked
// by substitution. Pure logic, no DOM.

import { MINUS } from './expr.js';
import { ratioText } from './solveTerms.js';

export const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
export const gcd = (a, b) => { let x = Math.abs(a); let y = Math.abs(b); while (y) [x, y] = [y, x % y]; return x; };

export function makeFracX({ p, q, neg = false, x, mirror = false, form = 'times' }) {
  if (!Number.isInteger(q) || q < 2 || q > 6) throw new Error(`Bad bottom: ${q}`);
  if (!Number.isInteger(p) || p < 1 || p >= q || gcd(p, q) !== 1) throw new Error(`Bad top: ${p}/${q}`);
  if (!Number.isInteger(x) || x === 0 || Math.abs(x) === 1 || Math.abs(x) > 36) throw new Error(`Bad answer: ${x}`);
  if (x % q !== 0) throw new Error(`A part is not whole: x = ${x}, q = ${q}`);
  const b = ((neg ? -p : p) * x) / q;
  const p0 = { kind: 'fracx', p, q, neg: Boolean(neg), b, x, mirror: Boolean(mirror), form };
  // substitution: (±p/q)(x) = b, exactly
  if ((neg ? -p : p) * x !== q * b || !Number.isInteger(b) || b % p !== 0) throw new Error('substitution check failed');
  return p0;
}

// The fraction's signed top
export const topOf = (p) => (p.neg ? -p.p : p.p);
// One part: what 1/q of x is (b/p, signed as the given number over the fraction's sign)
export const partOf = (p) => p.x / p.q;

// `⅔x`, `−⅓x`, `2x/3`, `x/3`, `−x/3` as plain text
export function fxText(top, q, form) {
  const m = top < 0 ? MINUS : '';
  const a = Math.abs(top);
  if (form === 'over') return `${m}${a === 1 ? '' : a}x/${q}`;
  return `${m}${ratioText(a, q)}x`;                                     // `⅔x` (one character for the fraction, as the screen's rows read)
}
export const formatFracX = (p) => {
  const xs = fxText(topOf(p), p.q, p.form);
  return p.mirror ? `${signed(p.b)} = ${xs}` : `${xs} = ${signed(p.b)}`;
};

// ---------- What a wrong answer looked like (slips; new tags, Build AA) ----------
//   fx-sign     the right size with the wrong sign (the minus lost)
//   fx-given    gave the given number (`6` for `⅔x = 6`)
//   fx-part     gave one part's value (`3`: stopped at one part; p ≥ 2)
//   fx-top      multiplied by the top only (`12` for `⅔x = 6`)
//   fx-bottom   multiplied by the bottom without dividing by the top (`18` for `⅔x = 6`; p ≥ 2)
//   fx-divided  divided by the bottom instead of multiplying (`2` for `⅔x = 6`, when it comes out whole)
export function slipValuesOf(p) {
  const out = [{ tag: 'fx-sign', v: -p.x }, { tag: 'fx-given', v: p.b }];
  if (p.p > 1) out.push({ tag: 'fx-part', v: p.b / p.p }, { tag: 'fx-top', v: p.b * p.p }, { tag: 'fx-bottom', v: p.b * p.q });
  if (p.b % p.q === 0) out.push({ tag: 'fx-divided', v: p.b / p.q });
  return out;
}
export function tagFracX(p, typed) {
  if (typed === p.x) return null;
  const hit = slipValuesOf(p).find((s) => s.v === typed);
  return hit ? hit.tag : 'unmatched';
}
