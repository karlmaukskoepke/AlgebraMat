// Flip everything (SPEC-FLIP-IT.md rev 1.2): solve an equation where x has a minus (`−x = 12`, `12 = −x`, `−3x = 12`) by multiplying both
// sides by −1, then (from `−ax`) taking a fraction. A problem is { kind: 'flip', a, b, x, mirror }: the equation `−ax = b` (or `b = −ax`
// when mirror), a from 1 to 6, x = b / (−a) the whole-number answer. Every problem is built from its solution and checked by
// substitution. Pure logic, no DOM.

import { MINUS } from './expr.js';

export const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

export function makeFlip(a, x, mirror = false) {
  if (!Number.isInteger(a) || a < 1 || a > 6) throw new Error(`Bad coefficient: ${a}`);
  if (!Number.isInteger(x) || x === 0 || Math.abs(x) === 1) throw new Error(`Bad answer: ${x}`);
  if (a > 1 && Math.abs(x) === a) throw new Error(`Answer ±a: ${x}`);
  const p = { kind: 'flip', a, b: -a * x, x, mirror: Boolean(mirror) };
  if (-p.a * p.x !== p.b) throw new Error('substitution check failed');
  return p;
}

const xText = (a) => (a === 1 ? `${MINUS}x` : `${MINUS}${a}x`);
export const formatFlip = (p) => (p.mirror ? `${signed(p.b)} = ${xText(p.a)}` : `${xText(p.a)} = ${signed(p.b)}`);
export const formOf = (p) => `${p.a === 1 ? 'neg-x' : 'neg-ax'}${p.mirror ? '-right' : ''}`;

// ---------- What a wrong answer looked like (spec §5) ----------
// One tag per wrong value, in this order (the existing tags, as Build J asks; no new one was needed):
//   sign-flipped    the right size with the wrong sign (12 for −x = 12: the minus on x ignored; 4 for −3x = 12)
//   ignored-front   gave b or its opposite (the number in front of x ignored: 12 or −12 for −3x = 12)
//   gave-boxes      gave the number in front, ±a (a ≥ 2)
export function tagFlip(p, typed) {
  if (typed === p.x) return null;
  if (typed === -p.x) return 'sign-flipped';
  if (typed === p.b || typed === -p.b) return 'ignored-front';
  if (p.a > 1 && Math.abs(typed) === p.a) return 'gave-boxes';
  return 'unmatched';
}
// (for −x = b the number on the other side is the opposite of x, so "ignored the number in front" is the same value as the sign slip)
export const slipValuesOf = (p) => [
  { tag: 'sign-flipped', v: -p.x },
  ...(p.a > 1 ? [{ tag: 'ignored-front', v: p.b }, { tag: 'ignored-front', v: -p.b }, { tag: 'gave-boxes', v: p.a }, { tag: 'gave-boxes', v: -p.a }] : [{ tag: 'ignored-front', v: p.b }]),
];
