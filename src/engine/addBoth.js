// Add to both sides (SPEC-ADD-TO-BOTH-SIDES.md): solve `x + a = b` and `x − a = b` by adding the opposite to both sides.
// A problem is { kind: 'addboth', form, mirror, a, b, x }: form is 'x+a' or 'x-a' (the coefficient of x is always 1),
// `a` the number added to or taken from x, `b` the other side, `x` the solution. `mirror: true` puts x on the right
// (`7 = x + 3`). Every problem is built from its solution and checked by substitution. Pure logic, no DOM.

import { MINUS } from './expr.js';

export const ADD_BOTH_FORMS = ['x+a', 'x-a'];
export const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

// The number as it sits in the equation, with its sign: +a for x + a, −a for x − a.
export const constantOf = (p) => (p.form === 'x-a' ? -p.a : p.a);
// What the x side comes to for a value v of x.
export const xSideValue = (p, v) => v + constantOf(p);

export function makeAddBoth(form, a, x, mirror = false) {
  if (!ADD_BOTH_FORMS.includes(form)) throw new Error(`Unknown form: ${form}`);
  if (!Number.isInteger(a) || a < 1 || !Number.isInteger(x) || x === 0) throw new Error(`Bad equation: ${form}, ${a}, ${x}`);
  const p = { kind: 'addboth', form, mirror, a, b: 0, x };
  p.b = xSideValue(p, x);
  if (p.b === 0) throw new Error('b must not be 0: the problem would be half solved');
  if (xSideValue(p, p.x) !== p.b) throw new Error('substitution check failed');
  return p;
}

export const answerOf = (p) => p.x;
export const answerText = (p) => signed(p.x);

const xSideText = (p) => `x ${p.form === 'x-a' ? MINUS : '+'} ${p.a}`;
export const formatAddBoth = (p) => (p.mirror ? `${signed(p.b)} = ${xSideText(p)}` : `${xSideText(p)} = ${signed(p.b)}`);

// The move's number: what to add to both sides to cancel the one next to x.
export const oppositeOf = (p) => -constantOf(p);

// Party or Battle? The opposite lands on the other side's number: the same sign is a Party, opposite signs a Battle.
export const isBattle = (p) => Math.sign(oppositeOf(p)) !== Math.sign(p.b);

// Does a typed answer put x back in and balance the equation?
export const balances = (p, typed) => xSideValue(p, typed) === p.b;

// ---------- What a wrong answer looked like ----------

//   wrong-op     added the same number instead of its opposite (b + a for x + a = b; b − a for x − a = b)
//   untouched    gave the other side as x
//   sign-flipped the right size on the wrong team (the opposite of x)
//   sizes-added  treated a Battle as a Party: added the sizes of the two numbers (only for a Battle)
export function slipsOf(p) {
  const wrongOp = p.b + constantOf(p);
  const slips = { 'wrong-op': wrongOp, untouched: p.b, 'sign-flipped': -p.x };
  if (isBattle(p)) slips['sizes-added'] = Math.abs(p.b) + p.a;       // (for a Party the sizes do add up: that is the answer)
  return slips;
}

// Tag a typed integer (null when it is right). In order, so a number that fits two slips gets the first.
export function tagAddBoth(p, typed) {
  if (typed === p.x) return null;
  const slips = slipsOf(p);
  for (const tag of ['wrong-op', 'untouched', 'sign-flipped', 'sizes-added']) if (slips[tag] === typed) return tag;
  if (isBattle(p) && -(Math.abs(p.b) + p.a) === typed) return 'sizes-added';
  return 'unmatched';
}

// A typed answer: an integer, from the pad. { correct, typed, tag } or { unreadable: true }.
export function checkAddBoth(p, text) {
  const t = String(text).replace(/−/g, '-').trim();
  if (!/^-?\d+$/.test(t)) return { unreadable: true, correct: false, tag: 'unreadable' };
  const typed = Number(t);
  return { correct: typed === p.x, typed, tag: tagAddBoth(p, typed) };
}
