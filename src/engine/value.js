// Value it: evaluate an expression for a value of x (SPEC-VALUE.md). `2x + 6, x = 4` is 14.
// A problem is { kind: 'value', expr, x }: the expression is Boxes & Circles' terms (engine/terms.js), x is an integer.
// Pure logic, no DOM.

import { MINUS } from './expr.js';
import { makeTerm, makeExpression, effective, isX, numberText, formatExpression, evaluate, parseAnswer } from './terms.js';

export const makeValue = (terms, x) => {
  if (!Number.isInteger(x) || x === 0) throw new Error(`Bad value of x: ${x}`);
  return { kind: 'value', expr: makeExpression(terms), x };
};
export const xTerm = (op, value) => makeTerm('x', op, value);
export const numTerm = (op, value) => makeTerm('int', op, value);

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

// What the expression comes to for this x.
export function answerOf(p) {
  const e = evaluate(p.expr);
  return e.x * p.x + e.n;
}
export const answerText = (p) => signed(answerOf(p));
export const formatValue = (p) => `${formatExpression(p.expr)}, x = ${signed(p.x)}`;

// Each term worked out: the x terms are (coefficient) × (x), the numbers are what they are.
export function termWorths(p) {
  return p.expr.terms.map((t) => {
    const coef = effective(t);
    return isX(t)
      ? { x: true, coef, worth: coef * p.x }
      : { x: false, coef, worth: coef };
  });
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
    const mag = Math.abs(c) === 1 ? '' : `${Math.abs(c)}`;
    const neg = i === 0 && c < 0 ? MINUS : '';
    out.push({ text: `${lead}${neg}${mag}` }, { text: `(${signed(p.x)})`, sub: true, joined: mag !== '' || neg !== '' });
  });
  return out;
}
export const formatSubstituted = (p) => substituteSegments(p).reduce((s, seg) => (s ? s + (seg.joined ? '' : ' ') : '') + seg.text, '');

// ---------- What a wrong answer looked like ----------

// What the answer would be if every x term were read a certain way.
const withX = (p, contribution) => p.expr.terms.reduce((sum, t) => sum + (isX(t) ? contribution(effective(t), p.x) : effective(t)), 0);

const concat = (a, v) => (v >= 0 ? Math.sign(a) * Number(`${Math.abs(a)}${v}`) : a + v);       // 2x, x = 4 read as "24"; x = −2: "2 − 2"
const added = (a, v) => a + v;                                                                    // 2x read as 2 + x
const dropped = (a, v) => a * Math.abs(v);                                                        // the sign of x ignored
const negNeg = (a, v) => (a < 0 && v < 0 ? -(Math.abs(a) * Math.abs(v)) : a * v);                  // − times − left negative

// Tag a typed integer: 'no-parens' (the value written next to the number, not multiplied), 'added' (2x read as 2 + x),
// 'neg-neg' (a negative times a negative left negative), 'sign-lost' (x's negative sign dropped), 'sign-flipped',
// else 'unmatched'. A slip that happens to give the right answer isn't tagged: the answer is right.
export function tagValue(p, typed) {
  const right = answerOf(p);
  if (typed === right) return null;
  const everyCoefficientIsOne = p.expr.terms.every((t) => !isX(t) || Math.abs(t.value) === 1);
  if (!everyCoefficientIsOne || p.x < 0) { if (typed === withX(p, concat)) return 'no-parens'; }
  if (p.x < 0 && typed === withX(p, negNeg) && p.expr.terms.some((t) => isX(t) && effective(t) < 0)) return 'neg-neg';
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

export { parseAnswer, numberText };
