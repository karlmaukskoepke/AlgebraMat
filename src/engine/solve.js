// Solve it: one-step equations (SPEC-SOLVE.md). `x + 5 = 12` is 7; `3x = 12` is 4; `x/4 = 3` is 12.
// A problem is { kind: 'solve', form, a, b, x }: form is 'x+a', 'x-a', 'ax' or 'x/a', `a` the number joined to x,
// `b` the right-hand side and `x` the solution (always a whole number, so the pad stays the integer pad).
// Pure logic, no DOM.

import { MINUS } from './expr.js';

export const FORMS = ['x+a', 'x-a', 'ax', 'x/a'];
const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

// What the left side comes to for a value v of x (a number; not a whole number for x/a unless v is a multiple of a).
export function leftOf(form, a, v) {
  switch (form) {
    case 'x+a': return v + a;
    case 'x-a': return v - a;
    case 'ax': return a * v;
    case 'x/a': return v / a;
    default: throw new Error(`Unknown form: ${form}`);
  }
}

// The problem is built from its solution, so the right side is always right.
export function makeSolve(form, a, x) {
  if (!FORMS.includes(form)) throw new Error(`Unknown form: ${form}`);
  if (!Number.isInteger(a) || a < 1 || !Number.isInteger(x) || x === 0) throw new Error(`Bad equation: ${form}, ${a}, ${x}`);
  const b = leftOf(form, a, x);
  if (!Number.isInteger(b)) throw new Error('x/a needs x to be a multiple of a');
  return { kind: 'solve', form, a, b, x };
}

export const answerOf = (p) => p.x;
export const answerText = (p) => signed(p.x);

// The left side as written, with `v` in place of x ("x", or "(7)").
const leftText = (p, v) => {
  switch (p.form) {
    case 'x+a': return `${v} + ${p.a}`;
    case 'x-a': return `${v} ${MINUS} ${p.a}`;
    case 'ax': return v === 'x' ? `${p.a}x` : `${p.a}${v}`;
    default: return `${v}/${p.a}`;
  }
};
export const formatEquation = (p) => `${leftText(p, 'x')} = ${signed(p.b)}`;

// The equation with a typed answer put in for x, as segments for the Mat: `x + 5 = 12`, 7 → [(7)] [+ 5 = 12].
// `sub` marks the value. For ax the value sits beside the number (3(7)), which means multiply.
export function substituteSegments(p, t) {
  const v = `(${signed(t)})`;
  switch (p.form) {
    case 'x+a': return [{ text: v, sub: true }, { text: `+ ${p.a}` }, { text: `= ${signed(p.b)}` }];
    case 'x-a': return [{ text: v, sub: true }, { text: `${MINUS} ${p.a}` }, { text: `= ${signed(p.b)}` }];
    case 'ax': return [{ text: `${p.a}` }, { text: v, sub: true, joined: true }, { text: `= ${signed(p.b)}` }];
    default: return [{ text: v, sub: true }, { text: `/ ${p.a}` }, { text: `= ${signed(p.b)}` }];
  }
}

// Does a typed answer balance the equation? `left` is what the left side comes to, written as a number or a fraction.
export function balanceOf(p, t) {
  const left = leftOf(p.form, p.a, t);
  const balanced = left === p.b;
  const text = Number.isInteger(left) ? signed(left) : `${signed(t)}/${p.a}`;
  return { left, text, balanced, right: signed(p.b) };
}

// ---------- What a wrong answer looked like ----------

// Each form's slips, with the answer each would give:
//   wrong-op   did the same operation as the equation instead of the opposite (x + 5 = 12 → 12 + 5)
//   other-op   used a different operation (3x = 12 → 12 − 3; x/4 = 3 → 3 + 4; x + 5 = 12 → 12 ÷ 5 can't be typed)
//   untouched  gave the right side as x (x + 5 = 12 → 12)
//   flipped    the numbers the wrong way round (x + 5 = 12 → 5 − 12)
const SLIPS = {
  'x+a': (p) => ({ 'wrong-op': p.b + p.a, untouched: p.b, flipped: p.a - p.b }),
  'x-a': (p) => ({ 'wrong-op': p.b - p.a, untouched: p.b, flipped: p.a - p.b }),
  'ax': (p) => ({ 'wrong-op': p.b * p.a, 'other-op': p.b - p.a, untouched: p.b }),
  'x/a': (p) => ({ 'wrong-op': p.b / p.a, 'other-op': p.b + p.a, untouched: p.b }),
};

// Tag a typed integer; a slip that happens to give the right answer isn't tagged (the answer is right).
export function tagSolve(p, typed) {
  if (typed === p.x) return null;
  for (const [tag, value] of Object.entries(SLIPS[p.form](p))) if (value === typed) return tag;
  return 'unmatched';
}

// A typed answer: an integer (typed with the pad). { correct, tag } or { unreadable: true }.
export function checkSolve(p, text) {
  const t = String(text).replace(/−/g, '-').trim();
  if (!/^-?\d+$/.test(t)) return { unreadable: true, correct: false, tag: 'unreadable' };
  const typed = Number(t);
  return { correct: typed === p.x, typed, tag: tagSolve(p, typed) };
}
