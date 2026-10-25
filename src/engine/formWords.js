// Help words that follow the form on the screen (Build T, Part 2; loop §6): a fraction the Divide button made is drawn with a fraction
// bar (`(15)/3`, its id in `s.divIds`) and is talked about as a division ("15 divided by 3"); one the Fraction option made is drawn
// `⅓(15)` and is talked about as a fraction of a number ("⅓ of 15"). Pure text, no DOM.

import { MINUS } from './expr.js';
import { signed, fractionText, sideText } from './solveTerms.js';

export const divForm = (s, t) => Boolean(t && s?.divIds?.includes(t.id));

// `15 divided by 3`, `15 divided by −3` / `⅓ of 15`, `−⅓ of 15`; a part of several terms in parentheses: `(15 − 6) divided by 3`
export function fracWords(t, div) {
  const one = t.inner.length === 1 && t.inner[0].kind === 'num';
  const inner = one ? signed(t.inner[0].v) : `(${sideText(t.inner)})`;
  const neg = t.sign < 0;
  return div ? `${inner} divided by ${neg ? MINUS : ''}${t.n}` : `${neg ? MINUS : ''}${fractionText(t.n)} of ${inner}`;
}

// What x is, said in the form on the screen, at x alone on a fraction (`x = (15)/3`, `x = ⅓(15)`) or a flip's `x = −(12)`; null otherwise
export function aloneWords(s, t) {
  if (t?.kind === 'frac') return `x is ${fracWords(t, divForm(s, t))}. Work it out, then type x.`;
  if (t?.kind === 'neg') return `x is the opposite of ${sideText(t.inner)}. Work it out, then type x.`;
  return null;
}
