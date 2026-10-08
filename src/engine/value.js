// Value it: evaluate an expression for a value of x (SPEC-VALUE.md). `2x + 6, x = 4` is 14; `(3/4)x − 2, x = 8` is 4.
// A problem is { kind: 'value', expr, x }: the expression is Boxes & Circles' terms (engine/terms.js), x is an integer.
// An x term may have a fractional coefficient: its `d` is the bottom number and `value` the top (so `(3/4)x` is
// { kind: 'x', op, value: 3, d: 4 }); x is then a multiple of d, so the answer is always a whole number.
// Pure logic, no DOM.

import { MINUS } from './expr.js';
import { makeTerm, makeExpression, effective, isX, numberText, termText } from './terms.js';

export const makeValue = (terms, x) => {
  if (!Number.isInteger(x) || x === 0) throw new Error(`Bad value of x: ${x}`);
  for (const t of terms) {
    if (isX(t) && den(t) > 1 && x % den(t) !== 0) throw new Error(`x must be a multiple of ${den(t)}`);
  }
  return { kind: 'value', expr: makeExpression(terms), x };
};
// An x term: `value` is the number on top (or the whole coefficient), `d` the number on the bottom (left out for a whole number).
export const xTerm = (op, value, d = 1) => (d > 1 ? { ...makeTerm('x', op, value), d } : makeTerm('x', op, value));
export const numTerm = (op, value) => makeTerm('int', op, value);

export const den = (t) => t.d ?? 1;
export const hasFraction = (p) => p.expr.terms.some((t) => isX(t) && den(t) > 1);

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

// What each term is worth for this x (exact: x is a multiple of every bottom number).
const worthOf = (t, x) => (isX(t) ? (effective(t) * x) / den(t) : effective(t));

export function answerOf(p) {
  return p.expr.terms.reduce((sum, t) => sum + worthOf(t, p.x), 0);
}
export const answerText = (p) => signed(answerOf(p));

// One term as written: "2x", "x", "(3/4)x"; after the first term with its operation: "+ 6", "− (1/2)x".
function termTextV(t, isFirst) {
  if (!(isX(t) && den(t) > 1)) return isFirst ? numberText(t) : termText(t, false);
  const body = `(${Math.abs(t.value)}/${den(t)})x`;
  if (isFirst) return `${t.value < 0 ? MINUS : ''}${body}`;
  return `${t.op === '-' ? MINUS : '+'} ${t.value < 0 ? `${MINUS}${body}` : body}`;
}
export const formatValueExpr = (p) => p.expr.terms.map((t, i) => termTextV(t, i === 0)).join(' ');
export const formatValue = (p) => `${formatValueExpr(p)}, x = ${signed(p.x)}`;

// Each term worked out. For an x term, `coef` is its top number with its sign, `d` the bottom number (1 for a whole
// number), and `worth` what it comes to.
export function termWorths(p) {
  return p.expr.terms.map((t) => (isX(t)
    ? { x: true, coef: effective(t), d: den(t), worth: worthOf(t, p.x) }
    : { x: false, coef: effective(t), d: 1, worth: effective(t) }));
}

// The problem with each x replaced by its value in parentheses, as segments for the Mat:
// `5 − 2x, x = −3` → [5] [− 2] [(−3)]. `sub` marks the value, `text` is what's written.
export function substituteSegments(p) {
  const out = [];
  p.expr.terms.forEach((t, i) => {
    if (!isX(t)) {
      out.push({ text: i === 0 ? signed(t.value) : `${t.op === '-' ? MINUS : '+'} ${signed(t.value)}` });
      return;
    }
    const lead = i === 0 ? '' : `${t.op === '-' ? MINUS : '+'} `;
    const c = t.value;
    const mag = den(t) > 1 ? `(${Math.abs(c)}/${den(t)})` : Math.abs(c) === 1 ? '' : `${Math.abs(c)}`;
    const neg = i === 0 && c < 0 ? MINUS : '';
    out.push({ text: `${lead}${neg}${mag}` }, { text: `(${signed(p.x)})`, sub: true, joined: mag !== '' || neg !== '' });
  });
  return out;
}
export const formatSubstituted = (p) => substituteSegments(p).reduce((s, seg) => (s ? s + (seg.joined ? '' : ' ') : '') + seg.text, '');

// ---------- What a wrong answer looked like ----------

// What the answer would be if every x term were read a certain way: contribution(a, v, d) for an x term with top number
// a (signed), x = v, bottom number d. Number terms are what they are.
const withX = (p, contribution) => p.expr.terms.reduce((sum, t) => sum + (isX(t) ? contribution(effective(t), p.x, den(t)) : effective(t)), 0);

const concat = (a, v, d) => (d > 1 ? (a * v) / d : v >= 0 ? Math.sign(a) * Number(`${Math.abs(a)}${v}`) : a + v);   // 2x, x = 4 read as "24"; x = −2: "2 − 2"
const added = (a, v, d) => (d > 1 ? (a * v) / d : a + v);                                                         // 2x read as 2 + x
const dropped = (a, v, d) => (a * Math.abs(v)) / d;                                                               // the sign of x ignored
const negNeg = (a, v, d) => (a < 0 && v < 0 ? -((Math.abs(a) * Math.abs(v)) / d) : (a * v) / d);                  // − times − left negative
// Fractions: only the top number used (3/4 of 8 read as 3 × 8), only the bottom (8 ÷ 4), or the fraction upside down.
const topOnly = (a, v) => a * v;
const bottomOnly = (a, v, d) => (Math.sign(a) * v) / d;
const upsideDown = (a, v, d) => ((d * v) % a === 0 ? (d * v) / a : NaN);

// Tag a typed integer: 'no-parens' (the value written next to the number, not multiplied), 'added' (2x read as 2 + x),
// 'neg-neg' (a negative times a negative left negative), 'sign-lost' (x's negative sign dropped), 'sign-flipped', and
// for fractions 'top-only', 'bottom-only', 'upside-down'; else 'unmatched'. A slip that happens to give the right
// answer isn't tagged: the answer is right.
export function tagValue(p, typed) {
  const right = answerOf(p);
  if (typed === right) return null;
  const hasNegativeX = p.expr.terms.some((t) => isX(t) && effective(t) < 0);
  if (hasFraction(p)) {
    if (typed === withX(p, topOnly)) return 'top-only';
    if (typed === withX(p, bottomOnly)) return 'bottom-only';
    if (typed === withX(p, upsideDown)) return 'upside-down';
    if (p.x < 0 && hasNegativeX && typed === withX(p, negNeg)) return 'neg-neg';
    if (p.x < 0 && typed === withX(p, dropped)) return 'sign-lost';
    if (typed === -right) return 'sign-flipped';
    return 'unmatched';
  }
  const everyCoefficientIsOne = p.expr.terms.every((t) => !isX(t) || Math.abs(t.value) === 1);
  if (!everyCoefficientIsOne || p.x < 0) { if (typed === withX(p, concat)) return 'no-parens'; }
  if (p.x < 0 && typed === withX(p, negNeg) && hasNegativeX) return 'neg-neg';
  if (p.x > 0 && !everyCoefficientIsOne && typed === withX(p, added)) return 'added';
  if (p.x < 0 && typed === withX(p, dropped)) return 'sign-lost';
  if (typed === -right) return 'sign-flipped';
  if (typed === withX(p, added)) return 'added';
  return 'unmatched';
}

// A typed answer: an integer (typed with the ± pad). { correct, tag } or { unreadable: true }.
export function checkValue(p, text) {
  const t = String(text).replace(/−/g, '-').trim();
  if (!/^-?\d+$/.test(t)) return { unreadable: true, correct: false, tag: 'unreadable' };
  const typed = Number(t);
  return { correct: typed === answerOf(p), tag: tagValue(p, typed) };
}
