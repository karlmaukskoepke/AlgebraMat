// Exact fractions for Strange solutions (Build V): an answer may be a fraction (`5/2`, `−3/4`) or 0. A fraction is { n, d }: whole
// numbers, d > 0, the sign on the top. Nothing here reduces a fraction unless asked (`lowest`): the student simplifies. Pure logic.

import { MINUS } from './expr.js';

export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
// a fraction from a top and a bottom, the sign moved to the top (never reduced)
export const frac = (n, d = 1) => (d < 0 ? { n: -n, d: -d } : { n, d });
export const lowest = (f) => { const g = gcd(f.n, f.d) || 1; return { n: f.n / g, d: f.d / g }; };
export const isLowest = (f) => gcd(f.n, f.d) === 1 || (f.n === 0 && f.d === 1);
// the same number (15/6 and 5/2)
export const same = (a, b) => a.n * b.d === b.n * a.d;
export const isWhole = (f) => f.n % f.d === 0;
export const add = (a, b) => (a.d === b.d ? { n: a.n + b.n, d: a.d } : { n: a.n * b.d + b.n * a.d, d: a.d * b.d });
export const times = (k, f) => ({ n: k * f.n, d: f.d });
export const neg = (f) => ({ n: -f.n, d: f.d });

// As written: `5/2`, `−3/4`, `7` (a bottom of 1 is a whole number)
export const fracText = (f) => (f.d === 1 ? `${f.n < 0 ? MINUS : ''}${Math.abs(f.n)}` : `${f.n < 0 ? MINUS : ''}${Math.abs(f.n)}/${f.d}`);

// What was typed in x = [ ]/[ ]: { top, bottom } as text (the minus in the top). A whole number is the top alone. Returns { value } (a
// fraction, not reduced), or { key } for what to say.
export function readFraction(top, bottom) {
  const t = String(top ?? '').replace(/−/g, '-');
  const b = String(bottom ?? '');
  if (t === '' || t === '-') return { key: 'typeAnswer' };
  if (!/^-?\d+$/.test(t)) return { key: 'answerUnreadable' };
  if (b === '') return { value: { n: Number(t), d: 1 } };
  if (!/^\d+$/.test(b)) return { key: 'answerUnreadable' };
  if (Number(b) === 0) return { key: 'sZeroBottom' };
  return { value: frac(Number(t), Number(b)) };
}
