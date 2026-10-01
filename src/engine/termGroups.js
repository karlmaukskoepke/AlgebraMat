// Group problems with two terms inside the parentheses, for the Groups of Terms
// pack (SPEC-GROUPS-OF-TERMS.md): A(B) is A groups of B, and B is `Cx + D`.
// Pure logic, no DOM.
//
// A is stored like Group It's (engine/groups.js): a sign plus a fraction n/d.
// B is two terms in the order they're written, each { kind: 'x' | 'int', value }
// with the value signed as it reads after its operation:
//   3(2x − 1)   → count { neg: false, n: 3, d: 1 }, inside [x 2, int −1]
//   −(x + 3)    → count { neg: true,  n: 1, d: 1 }, hidden1: true
//   1/2(6 + 4x) → count { neg: false, n: 1, d: 2 }, inside [int 6, x 4]   (the challenge levels write the number first)

import { MINUS } from './expr.js';
import { numberText, formatAnswer } from './terms.js';

export function makeTermGroups({ neg = false, n, d = 1 }, inside, { hidden1 = false } = {}) {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Bad group count: ${n}`);
  if (!Number.isInteger(d) || d < 1) throw new Error(`Bad denominator: ${d}`);
  if (!Array.isArray(inside) || inside.length !== 2) throw new Error('B needs two terms');
  const kinds = inside.map((t) => t.kind).sort().join();
  if (kinds !== 'int,x') throw new Error('B needs one x term and one number');
  for (const t of inside) {
    if (!Number.isInteger(t.value) || t.value === 0) throw new Error(`Bad term value: ${t.value}`);
    if (t.value % d !== 0) throw new Error(`${t.value} doesn't split into ${d} equal parts`);
  }
  if (hidden1 && !(neg && n === 1 && d === 1)) throw new Error('Only −(B) hides a 1');
  return { kind: 'termgroups', count: { neg, n, d }, inside: inside.map((t) => ({ kind: t.kind, value: t.value })), hidden1 };
}

export const isFraction = (p) => p.count.d > 1;
export const isOpposite = (p) => p.count.neg;

export const xTerm = (p) => p.inside.find((t) => t.kind === 'x');
export const numTerm = (p) => p.inside.find((t) => t.kind === 'int');

// B is written number first (the challenge levels).
export const isNumberFirst = (p) => p.inside[0].kind === 'int';

// Whole-number problems: how many ovals to draw (|A|).
export const groupCount = (p) => (isFraction(p) ? 1 : p.count.n);

// The pieces one group holds: |C| boxes and |D| counters, each with the sign of its term.
export const groupPieces = (p) => {
  const x = xTerm(p);
  const num = numTerm(p);
  return {
    boxes: Math.abs(x.value), boxSign: x.value < 0 ? '-' : '+',
    counters: Math.abs(num.value), counterSign: num.value < 0 ? '-' : '+',
  };
};

// Fraction problems: what each equal part holds (B divided by d).
export const partPieces = (p) => {
  const g = groupPieces(p);
  return { ...g, boxes: g.boxes / p.count.d, counters: g.counters / p.count.d };
};

// All the pieces drawn before any flip: n groups of B (whole), or B whole for a fraction.
export const pieceTotal = (p) => {
  const g = groupPieces(p);
  return (isFraction(p) ? 1 : p.count.n) * (g.boxes + g.counters);
};

// What the groups hold before an opposite: { x, n } (the notes' "6 boxes, 3 negatives").
export function groupTotal(p) {
  const { n, d } = p.count;
  return { x: (n * xTerm(p).value) / d, n: (n * numTerm(p).value) / d };
}

// The answer: the opposite of the total when the groups are opposite. { x, n }.
export function evaluateTermGroups(p) {
  const t = groupTotal(p);
  return isOpposite(p) ? { x: -t.x, n: -t.n } : t;
}

// The answer as typed: "6x − 3", "−2x + 8".
export const answerText = (p) => formatAnswer(evaluateTermGroups(p));

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

// "3(2x − 1)", "−(x + 3)", "−1(x + 3)", "1/2(4x + 6)", "−2/3(6 − 3x)". The view draws fractions stacked.
export function formatTermGroups(p) {
  const { neg, n, d } = p.count;
  const size = p.hidden1 ? '' : d > 1 ? `${n}/${d}` : `${n}`;
  const [first, second] = p.inside;
  const rest = `${second.value < 0 ? MINUS : '+'} ${numberText({ ...second, value: Math.abs(second.value) })}`;
  return `${neg ? MINUS : ''}${size}(${numberText(first)} ${rest})`;
}

// The shorthand for Check it: one line per term of B, in the order written.
//   3(2x − 1)      → "3 · 2x = 6x", "3 · (−1) = −3"
//   −2(x − 4)      → "−2 · x = −2x", "−2 · (−4) = 8"
//   1/2(4x + 6)    → "1/2 · 4x = 2x", "1/2 · 6 = 3"
// `a` is A as it reads (with its sign), and `product` is the term it makes.
export function distributeLines(p) {
  const { neg, n, d } = p.count;
  const a = `${neg ? MINUS : ''}${d > 1 ? `${n}/${d}` : n}`;
  const sign = neg ? -1 : 1;
  return p.inside.map((t) => {
    const value = (sign * n * t.value) / d;
    const product = { kind: t.kind, value };
    const shown = t.value < 0 ? `(${numberText(t)})` : numberText(t);
    return { a, term: t, product, text: `${a} · ${shown} = ${numberText(product)}` };
  });
}
