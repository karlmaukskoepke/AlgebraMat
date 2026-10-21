// Two-step equations, the new card (Build K, basic form): `3x + 4 = 19` is solved in two moves, Add −4 to both sides (then the student
// combines the other side) and take ⅓ of both sides. A problem is { kind: 'two-step', form, a, b, c, x, mirror }: `a` is the size of the
// number in front of x (2 to 5), `b` the number added or subtracted (as written, 1 to 12), `c` the other side, `x` the whole-number answer
// (never 0 or ±1). Forms (as written): 'ax+b', 'ax-b', 'b+ax', 'b-ax'; `mirror` puts the x side on the right (`19 = 3x + 4`). Written as
// A·x + B = c, A is −a for 'b-ax' and B is −b for 'ax-b'. Every problem is built from its answer and checked by substitution. (Not the old
// card's `solve2` problems: those keep their own engine and meaning.) Pure logic, no DOM.

import { MINUS } from './expr.js';

export const FORMS = ['ax+b', 'ax-b', 'b+ax', 'b-ax'];
export const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

export const coefOf = (p) => (p.form === 'b-ax' ? -p.a : p.a);              // A
export const constOf = (p) => (p.form === 'ax-b' ? -p.b : p.b);             // B

export function makeTwoStep(form, a, b, x, mirror = false) {
  if (!FORMS.includes(form)) throw new Error(`Unknown form: ${form}`);
  if (!Number.isInteger(a) || a < 2 || a > 5) throw new Error(`Bad coefficient: ${a}`);
  if (!Number.isInteger(b) || b < 1 || b > 12) throw new Error(`Bad number: ${b}`);
  if (!Number.isInteger(x) || x === 0 || Math.abs(x) === 1) throw new Error(`Bad answer: ${x}`);
  const p = { kind: 'two-step', form, a, b, c: 0, x, mirror: Boolean(mirror) };
  p.c = coefOf(p) * x + constOf(p);
  if (coefOf(p) * p.x + constOf(p) !== p.c) throw new Error('substitution check failed');
  return p;
}

// The x side as written: "3x + 4", "3x − 4", "4 + 3x", "4 − 3x".
const xSideText = (p) => {
  switch (p.form) {
    case 'ax+b': return `${p.a}x + ${p.b}`;
    case 'ax-b': return `${p.a}x ${MINUS} ${p.b}`;
    case 'b+ax': return `${p.b} + ${p.a}x`;
    default: return `${p.b} ${MINUS} ${p.a}x`;
  }
};
export const formatTwoStep = (p) => (p.mirror ? `${signed(p.c)} = ${xSideText(p)}` : `${xSideText(p)} = ${signed(p.c)}`);
export const formOf = (p) => `${p.form}${p.mirror ? '-right' : ''}`;

// ---------- What a wrong answer looked like (loop spec §5; declared in the build brief) ----------
// One tag per wrong value, in this order (new tags, Build K):
//   skipped-fraction   typed the value of ax: the constant undone, the fraction not taken (15 for 3x + 4 = 19)
//   added-constant     typed c + B: the constant added instead of cancelled (23 for 3x + 4 = 19)
//   sign-flipped       the right size with the wrong sign (−5 for 3x + 4 = 19)
export function tagTwoStep(p, typed) {
  if (typed === p.x) return null;
  const B = constOf(p);
  if (typed === p.c - B) return 'skipped-fraction';
  if (typed === p.c + B) return 'added-constant';
  if (typed === -p.x) return 'sign-flipped';
  return 'unmatched';
}
export const slipValuesOf = (p) => {
  const B = constOf(p);
  return [{ tag: 'skipped-fraction', v: p.c - B }, { tag: 'added-constant', v: p.c + B }, { tag: 'sign-flipped', v: -p.x }];
};
