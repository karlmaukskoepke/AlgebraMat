// The term model for Boxes & Circles (SPEC-BOXES.md §5). Pure logic, no DOM.
//
// An expression is a list of terms like `3x − 5 + 7 − x`. A term is
//   { kind: 'x' | 'int', op: '+' | '-', value }
// where `value` is the signed number as written, and `op` is the operation in
// front of it. The first term has no operation shown (its `op` is always '+'),
// and a negative first term keeps its sign in `value`: `−5` is { op: '+', value: -5 }.
// Subtracting a negative, `− (−7)`, is { op: '-', value: -7 }.
//
// What a term is *worth* is its effective coefficient: the operation times the
// number's sign. `− 4x` is −4, `+ x` is 1, and `− (−7)` is +7.

import { MINUS } from './expr.js';

export const makeTerm = (kind, op, value) => ({ kind, op, value });
export const makeExpression = (terms) => ({ terms });

// Signed coefficient: `− 4x` → −4, `− (−7)` → 7.
export const effective = (term) => (term.op === '-' ? -term.value : term.value);

export const isX = (term) => term.kind === 'x';

// Subtracting a negative needs the Rewrite step: `− (−7)` → `+ (+7)`, "is +7".
export const needsRewrite = (term) => term.op === '-' && term.value < 0;

export const rewriteTerm = (term) => (needsRewrite(term) ? { ...term, op: '+', value: -term.value } : term);

// How many pieces a term draws above itself, and which kind (+ or −).
export const pieceCount = (term) => Math.abs(effective(term));
export const pieceSign = (term) => (effective(term) < 0 ? '-' : '+');

// What the expression comes to: { x, n } (the box total and the number total).
export function evaluate(expr) {
  const total = { x: 0, n: 0 };
  for (const t of expr.terms) total[isX(t) ? 'x' : 'n'] += effective(t);
  return total;
}

// Pieces drawn in all (a measure of how long a problem takes to draw).
export const totalPieces = (expr) => expr.terms.reduce((sum, t) => sum + pieceCount(t), 0);

// ---------- Writing terms ----------

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);

// The number part, with x if it's a variable: 3 → "3x", 1 → "x", −1 → "−x", −7 → "−7".
export function numberText(term) {
  if (!isX(term)) return signed(term.value);
  const c = term.value;
  const mag = Math.abs(c) === 1 ? '' : `${Math.abs(c)}`;
  return `${c < 0 ? MINUS : ''}${mag}x`;
}

// A term as the student reads it: "3x" first; "− 5", "+ x", "− (−7)" after.
export function termText(term, isFirst = false) {
  if (isFirst) return numberText(term);
  const body = term.value < 0 ? `(${numberText(term)})` : numberText(term);
  return `${term.op === '-' ? MINUS : '+'} ${body}`;
}

export const formatExpression = (expr) => expr.terms.map((t, i) => termText(t, i === 0)).join(' ');

// The two tappable parts of a term: its operation and its number. The first
// term has only a number (a negative first term keeps its sign in the number).
export function termParts(expr) {
  const parts = [];
  expr.terms.forEach((t, i) => {
    if (i > 0) parts.push({ term: i, part: 'op', text: t.op === '-' ? MINUS : '+' });
    parts.push({ term: i, part: 'num', text: i === 0 || t.value >= 0 ? numberText(t) : `(${numberText(t)})` });
  });
  return parts;
}

// The combined answer as written: "2x + 2", "−3x + 2", "x − 2", "5", "−x". "0" if nothing is left.
export function formatAnswer({ x, n }) {
  const out = [];
  if (x !== 0) out.push(numberText({ kind: 'x', value: x }));
  if (n !== 0) out.push(x === 0 ? signed(n) : `${n < 0 ? MINUS : '+'} ${Math.abs(n)}`);
  return out.length ? out.join(' ') : '0';
}

// ---------- Reading what a student types ----------
//
// Characters: digits, x, +, − (or the keyboard's -), and spaces. Returns
//   { ok: true, terms: [{ kind, value }], x, n, combined }
// where `combined` says each kind appears at most once and nothing is a zero
// term, so `2x + 3 − 1` is readable but not combined. Or { ok: false, reason }.

export function parseAnswer(text) {
  if (typeof text !== 'string') return { ok: false, reason: 'empty' };
  const s = text.replace(/\s+/g, '').replace(/[−–—]/g, '-');
  if (s === '') return { ok: false, reason: 'empty' };
  const terms = [];
  let i = 0;
  while (i < s.length) {
    let sign = 1;
    if (s[i] === '+' || s[i] === '-') {
      sign = s[i] === '-' ? -1 : 1;
      i++;
    } else if (terms.length > 0) {
      return { ok: false, reason: 'unreadable' }; // terms after the first need a + or −
    }
    const digits = /^\d+/.exec(s.slice(i))?.[0] ?? '';
    i += digits.length;
    const hasX = s[i] === 'x';
    if (hasX) i++;
    if (digits === '' && !hasX) return { ok: false, reason: 'unreadable' };
    if (digits.length > 3) return { ok: false, reason: 'unreadable' };
    const magnitude = digits === '' ? 1 : parseInt(digits, 10);
    terms.push({ kind: hasX ? 'x' : 'int', value: sign * magnitude });
  }
  const x = terms.filter((t) => t.kind === 'x').reduce((sum, t) => sum + t.value, 0);
  const n = terms.filter((t) => t.kind === 'int').reduce((sum, t) => sum + t.value, 0);
  const kinds = terms.map((t) => t.kind);
  const combined = new Set(kinds).size === kinds.length && terms.every((t) => t.value !== 0);
  return { ok: true, terms, x, n, combined };
}
