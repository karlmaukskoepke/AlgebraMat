// Distribute, combine, solve (Build M, basic form): `3(x + 2) = 15` is solved by distributing (3 · x and 3 · 2, typed), combining, and
// finishing as in Two-step. A problem is { kind: 'distribute-solve', level, f, c, n, bx, xFirst, b, x }: `f` the factor (2 to 5, or −5 to
// −2), `c` the number in the parenthesis (as written, ±1 to ±9), `n` a number before the parenthesis (0 for none; `n − 2(x + 2)` is n with
// f = −2), `bx` the number in front of a second x-term (0 for none) and `xFirst` whether that term comes first, `b` the other side, `x` the
// whole-number answer (never 0 or ±1). Every problem is built from its answer and checked by substitution. Pure logic, no DOM.

import { MINUS } from './expr.js';
import { newId } from './lightsGrab.js';

export const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
const xs = (c) => (c === 1 ? 'x' : c === -1 ? `${MINUS}x` : `${signed(c)}x`);

// The left side's value at x.
export const valueAt = (p, x) => p.n + p.f * (x + p.c) + p.bx * x;

export function makeDistSolve({ level, f, c, n = 0, bx = 0, xFirst = false, x }) {
  if (!Number.isInteger(f) || Math.abs(f) < 2 || Math.abs(f) > 5) throw new Error(`Bad factor: ${f}`);
  if (!Number.isInteger(c) || c === 0 || Math.abs(c) > 9) throw new Error(`Bad number in the parenthesis: ${c}`);
  if (!Number.isInteger(x) || x === 0 || Math.abs(x) === 1) throw new Error(`Bad answer: ${x}`);
  const p = { kind: 'distribute-solve', level, f, c, n, bx, xFirst: Boolean(xFirst), b: 0, x };
  p.b = valueAt(p, x);
  if (valueAt(p, x) !== p.b || p.n + p.f * (p.x + p.c) + p.bx * p.x !== p.b) throw new Error('substitution check failed');
  return p;
}

// The board: [n, group] or [group], [group, bx·x] or [bx·x, group]; the other side one number.
export function startTerms(p) {
  const group = { id: newId(), kind: 'group', factor: p.f, inner: [{ id: newId(), kind: 'x', coef: 1 }, { id: newId(), kind: 'num', v: p.c }] };
  const left = [];
  if (p.n) left.push({ id: newId(), kind: 'num', v: p.n });
  const xt = p.bx ? { id: newId(), kind: 'x', coef: p.bx } : null;
  if (xt && p.xFirst) left.push(xt);
  left.push(group);
  if (xt && !p.xFirst) left.push(xt);
  return { left, right: [{ id: newId(), kind: 'num', v: p.b }] };
}

// As written: "3(x + 2) = 15", "−2(x − 4) = 6", "5 + 2(x + 3) = 21", "5 − 2(x + 2) = 3", "3(x + 2) − 2x = 21", "2x + 3(x − 1) = 12".
const groupText = (f, c) => `${f === 1 ? '' : f === -1 ? MINUS : signed(f)}(x ${c < 0 ? MINUS : '+'} ${Math.abs(c)})`;
export function formatDistSolve(p) {
  const parts = [];
  const push = (v, body) => { parts.push(parts.length ? `${v < 0 ? MINUS : '+'} ${body(Math.abs(v))}` : body(v)); };
  if (p.n) push(p.n, (v) => signed(v));
  if (p.bx && p.xFirst) push(p.bx, (v) => xs(v));
  push(p.f, (v) => groupText(v, p.c));
  if (p.bx && !p.xFirst) push(p.bx, (v) => xs(v));
  return `${parts.join(' ')} = ${signed(p.b)}`;
}

// ---------- What a wrong answer looked like (declared in the build brief) ----------
// One tag per wrong value, in this order (new tags, Build M):
//   first-only      distributed to the first term only: n + f·x + c = b (when that gives a whole number)
//   no-distribute   the factor left out: x + c + n = b (13 for 3(x + 2) = 15)
//   sign-flipped    the right size with the wrong sign
export function slipValuesOf(p) {
  const out = [];
  const whole = (v) => Number.isInteger(v) && !Object.is(v, -0);
  const firstOnly = (p.b - p.n - p.c) / (p.f + p.bx);
  if (whole(firstOnly)) out.push({ tag: 'first-only', v: firstOnly });
  const noDist = (p.b - p.n - p.c) / (1 + p.bx);
  if (1 + p.bx !== 0 && whole(noDist)) out.push({ tag: 'no-distribute', v: noDist });
  out.push({ tag: 'sign-flipped', v: -p.x });
  return out;
}
export function tagDistSolve(p, typed) {
  if (typed === p.x) return null;
  return slipValuesOf(p).find((s) => s.v === typed)?.tag ?? 'unmatched';
}
