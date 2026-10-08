// Solve it: two-step equations (SPEC-SOLVE.md §7). `2x + 3 = 13` is 5; `5 − 2x = −3` is 4; `13 = 2x + 3` is the same
// equation turned round. A problem is { kind: 'solve2', form, mirror, a, b, c, x }: `a` is the number joined to x (always
// positive as written), `b` the number added or subtracted, `c` the other side, `x` the solution (a whole number,
// which can be negative). Forms: 'ax+b', 'ax-b', 'b+ax', 'b-ax'; `mirror` puts the x side on the right.
// Written as A·x + B = C, the coefficient A is −a for 'b-ax', and B is −b for 'ax-b'. Pure logic, no DOM.

import { MINUS } from './expr.js';

export const FORMS2 = ['ax+b', 'ax-b', 'b+ax', 'b-ax'];
const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

export const coefOf = (p) => (p.form === 'b-ax' ? -p.a : p.a);          // A
export const constOf = (p) => (p.form === 'ax-b' ? -p.b : p.b);         // B
export const leftOf2 = (p, v) => coefOf(p) * v + constOf(p);

export function makeSolve2(form, a, b, x, mirror = false) {
  if (!FORMS2.includes(form)) throw new Error(`Unknown form: ${form}`);
  if (!Number.isInteger(a) || a < 2 || !Number.isInteger(b) || b < 1 || !Number.isInteger(x) || x === 0) throw new Error(`Bad equation: ${form}, ${a}, ${b}, ${x}`);
  const p = { kind: 'solve2', form, mirror, a, b, c: 0, x };
  p.c = leftOf2(p, x);
  return p;
}

export const answerOf = (p) => p.x;
export const answerText = (p) => signed(p.x);

// The x side as written, with `v` for x.
const exprText = (p, v = 'x') => {
  switch (p.form) {
    case 'ax+b': return `${p.a}${v} + ${p.b}`;
    case 'ax-b': return `${p.a}${v} ${MINUS} ${p.b}`;
    case 'b+ax': return `${p.b} + ${p.a}${v}`;
    default: return `${p.b} ${MINUS} ${p.a}${v}`;
  }
};
export const formatEquation = (p) => (p.mirror ? `${signed(p.c)} = ${exprText(p)}` : `${exprText(p)} = ${signed(p.c)}`);

// The equation with a typed answer put in for x, as segments for the Mat. `sub` marks the value; `joined` puts it
// right beside the number before it (2(5): next to a bracket means multiply).
export function substituteSegments(p, t) {
  const v = { text: `(${signed(t)})`, sub: true, joined: true };
  let expr;
  switch (p.form) {
    case 'ax+b': expr = [{ text: `${p.a}` }, v, { text: `+ ${p.b}` }]; break;
    case 'ax-b': expr = [{ text: `${p.a}` }, v, { text: `${MINUS} ${p.b}` }]; break;
    case 'b+ax': expr = [{ text: `${p.b}` }, { text: `+ ${p.a}` }, v]; break;
    default: expr = [{ text: `${p.b}` }, { text: `${MINUS} ${p.a}` }, v];
  }
  return p.mirror ? [{ text: `${signed(p.c)} =` }, ...expr] : [...expr, { text: `= ${signed(p.c)}` }];
}

// Does a typed answer balance the equation?
export function balanceOf(p, t) {
  const left = leftOf2(p, t);
  const text = signed(left);
  const right = signed(p.c);
  return { left, text, balanced: left === p.c, right, mirror: p.mirror };
}

// ---------- What a wrong answer looked like ----------

// With the equation as A·x + B = C (x = (C − B)/A), the slips and the answer each would give (NaN when it isn't a whole
// number, so it can't be typed):
//   divided-one-term    divided the x term and the other side by A, but not the number: C/A − B
//   stopped-early       undid the number but not the multiplying: C − B
//   skipped-constant    divided but forgot the number: C/A
//   constant-wrong-way  added the number when it should be taken away, or the reverse: (C + B)/A
//   multiplied          multiplied by A instead of dividing: (C − B)·A
//   untouched           gave the other side as x: C
//   sign-flipped        the opposite of x (a negative coefficient dropped, or a sign slip): −x
const whole = (n) => (Number.isInteger(n) ? n : NaN);
export function slipsOf(p) {
  const A = coefOf(p); const B = constOf(p); const C = p.c;
  return {
    'divided-one-term': whole(C / A) - B,
    'stopped-early': C - B,
    'skipped-constant': whole(C / A),
    'constant-wrong-way': whole((C + B) / A),
    multiplied: (C - B) * A,
    untouched: C,
    [A < 0 ? 'sign-lost' : 'sign-flipped']: -p.x,
  };
}

// Tag a typed integer; a slip that happens to give the right answer isn't tagged (the answer is right).
export function tagSolve2(p, typed) {
  if (typed === p.x) return null;
  for (const [tag, value] of Object.entries(slipsOf(p))) if (value === typed) return tag;
  return 'unmatched';
}

// A typed answer: an integer (typed with the pad). { correct, typed, tag } or { unreadable: true }.
export function checkSolve2(p, text) {
  const t = String(text).replace(/−/g, '-').trim();
  if (!/^-?\d+$/.test(t)) return { unreadable: true, correct: false, tag: 'unreadable' };
  const typed = Number(t);
  return { correct: typed === p.x, typed, tag: tagSolve2(p, typed) };
}

// What the messages need to say with this equation's own numbers: dividing every term by a (when it comes out even).
const piece = (n, a) => (n % a === 0 ? `${signed(n / a)}` : `${signed(n)}/${a}`);
export function messageParams(p) {
  const A = coefOf(p); const B = constOf(p);
  const a = p.a;
  const tail = A > 0
    ? `${a}x ÷ ${a} = x, ${signed(B)} ÷ ${a} = ${piece(B, a)}, and ${signed(p.c)} ÷ ${a} = ${piece(p.c, a)}`
    : '';
  return { a, b: p.b, negative: A < 0, divideAll: tail, constant: B > 0 ? 'added' : 'taken away', undoWord: B > 0 ? 'take it away' : 'add it back' };
}
