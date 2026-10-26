// Variables on both sides (Build R, basic form): `5x + 2 = 3x + 10` is solved by getting the x-terms on one side (an Add of an x-term, or
// dragging one across the =), combining them, then finishing as in Two-step. Level 5 has a parenthesis: `3(x + 2) = 5x − 4`, distributed
// with Build M's move first. A problem is { kind: 'variables-both-sides', level, left, right, x }: each side a list of pieces, `{ k: 'x',
// c }` (c in front of x), `{ k: 'n', v }` (a number) or `{ k: 'g', f, c }` (f(x + c)); `x` the whole-number answer (never 0 or ±1). Every
// problem is built from its answer and checked by substitution. Pure logic, no DOM.
// Distribute more (Build U) uses the same pieces with a fuller group: `{ k: 'g', f, d, a, c, hidden }` is f/d · (ax + c): a fraction factor
// (d > 1, the sign on f), an x inside with a number in front (a, default 1), and the invisible 1 (`hidden`: f is −1, written as a bare
// minus, `7x − (x − 6)`).

import { MINUS } from './expr.js';
import { newId } from './lightsGrab.js';

export const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
const xText = (c) => (c === 1 ? 'x' : c === -1 ? `${MINUS}x` : `${signed(c)}x`);

// A side's value at x, and its straight-line form: A·x + B
const share = (q, v) => (q.f * v) / (q.d ?? 1);
const pieceAt = (q, x) => (q.k === 'x' ? q.c * x : q.k === 'g' ? share(q, (q.a ?? 1) * x + q.c) : q.v);
export const sideAt = (side, x) => side.reduce((s, q) => s + pieceAt(q, x), 0);
export const linear = (side) => side.reduce((o, q) => (q.k === 'x' ? { a: o.a + q.c, b: o.b } : q.k === 'g' ? { a: o.a + share(q, q.a ?? 1), b: o.b + share(q, q.c) } : { a: o.a, b: o.b + q.v }), { a: 0, b: 0 });

export function makeBoth({ level, left, right, x, kind = 'variables-both-sides' }) {
  if (!Number.isInteger(x) || x === 0 || Math.abs(x) === 1) throw new Error(`Bad answer: ${x}`);
  const p = { kind, level, left, right, x };
  if (sideAt(left, x) !== sideAt(right, x)) throw new Error(`substitution check failed: ${formatBoth(p)}, x = ${x}`);
  const L = linear(left);
  const R = linear(right);
  if (L.a === R.a) throw new Error('the same number of x on both sides');
  if ((R.b - L.b) / (L.a - R.a) !== x) throw new Error('the answer does not solve it');
  return p;
}

// The board: each piece a term (a parenthesis is a Build M group).
const termOf = (q) => (q.k === 'x' ? { id: newId(), kind: 'x', coef: q.c } : q.k === 'n' ? { id: newId(), kind: 'num', v: q.v }
  : { id: newId(), kind: 'group', factor: q.f, ...(q.d > 1 ? { den: q.d } : {}), ...(q.hidden ? { hidden: true } : {}), inner: [{ id: newId(), kind: 'x', coef: q.a ?? 1 }, { id: newId(), kind: 'num', v: q.c }] });
export const startTerms = (p) => ({ left: p.left.map(termOf), right: p.right.map(termOf) });

// As written: "5x + 2 = 3x + 10", "4x − 3 = −2x + 9", "3(x + 2) = 5x − 4", "2(x − 1) = 4(x + 3)".
const fracText = (f, d) => `${f < 0 ? MINUS : ''}${Math.abs(f)}/${d}`;
const groupText = (f, c, a = 1, d = 1) => `${d > 1 ? fracText(f, d) : f === 1 ? '' : f === -1 ? MINUS : signed(f)}(${xText(a)} ${c < 0 ? MINUS : '+'} ${Math.abs(c)})`;
function sideText(side) {
  const parts = [];
  side.forEach((q) => {
    const v = q.k === 'x' ? q.c : q.k === 'g' ? q.f : q.v;
    const body = (m) => (q.k === 'x' ? xText(m) : q.k === 'g' ? groupText(m, q.c, q.a, q.d) : signed(m));
    parts.push(parts.length ? `${v < 0 ? MINUS : '+'} ${body(Math.abs(v))}` : body(v));
  });
  return parts.join(' ');
}
export const formatBoth = (p) => `${sideText(p.left)} = ${sideText(p.right)}`;

// ---------- What a wrong answer looked like (declared in the build brief; new tags, Build R) ----------
//   x-sign-lost     an x-term moved with its sign kept (adding 3x instead of −3x): (D − B) / (A + C), when whole
//   half-collected  one side's x-terms left out (x only half collected): (D − B) / A, when whole
//   sign-flipped    the right size with the wrong sign
// (Ax + B = Cx + D after any distributing. A combine of x-terms by adding the sizes is recorded where it is typed: `sizes-added`.)
// Distribute more (Build U) adds the distributing slips, each the value the equation gives with that piece done wrong:
//   first-only      the factor multiplied into the x-term only (`−(x − 6)` read as −x − 6, `3(x + 2)` as 3x + 2)
//   one-lost        the invisible 1's minus lost (`7x − (x − 6)` read as 7x + x − 6)
//   frac-top        a fraction factor's top used alone (`⅔(6x + 9)` read as 2(6x + 9))
const whole = (v) => Number.isFinite(v) && Number.isInteger(v) && !Object.is(v, -0);
function variantValue(p, change) {
  const side = (list) => list.map((q) => (q.k === 'g' ? change(q) : [q])).flat();
  const L = linear(side(p.left));
  const R = linear(side(p.right));
  return L.a === R.a ? null : (R.b - L.b) / (L.a - R.a);
}
function distributeSlips(p) {
  const g = [...p.left, ...p.right].find((q) => q.k === 'g');
  if (p.kind !== 'distribute-more' || !g) return [];
  const out = [];
  const add = (tag, v) => { if (whole(v) && v !== p.x) out.push({ tag, v }); };
  add('first-only', variantValue(p, (q) => [{ k: 'x', c: (q.f * (q.a ?? 1)) / (q.d ?? 1) }, { k: 'n', v: q.c }]));
  if (g.hidden) add('one-lost', variantValue(p, (q) => [{ ...q, f: 1, hidden: false }]));
  if (g.d > 1) add('frac-top', variantValue(p, (q) => [{ ...q, d: 1 }]));
  return out;
}
export function slipValuesOf(p) {
  const { a: A, b: B } = linear(p.left);
  const { a: C, b: D } = linear(p.right);
  const out = [...distributeSlips(p)];
  if (A + C !== 0 && whole((D - B) / (A + C))) out.push({ tag: 'x-sign-lost', v: (D - B) / (A + C) });
  if (A !== 0 && whole((D - B) / A)) out.push({ tag: 'half-collected', v: (D - B) / A });
  out.push({ tag: 'sign-flipped', v: -p.x });
  return out;
}
export function tagBoth(p, typed) {
  if (typed === p.x) return null;
  return slipValuesOf(p).find((s) => s.v === typed)?.tag ?? 'unmatched';
}
