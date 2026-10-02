// Distribute, then combine problems (SPEC-DISTRIBUTE.md): an expression with a group
// in it, like `2(3x − 4) − x + 5`. Open the groups first (① distribute), then combine
// like terms (② combine). Pure logic, no DOM.
//
// A problem is a list of parts, in the order they're written:
//   { type: 'group', op: '+' | '-', n, inside: [t1, t2], hiddenOne }
//       the group B(Cx + D); `op` is the operation in front (a leading '-' is a leading minus),
//       `n` is how many groups, and `hiddenOne` says the 1 isn't written: (x + 2), −(x + 2).
//       `inside` is two terms { kind: 'x' | 'int', value } as written (one x, one number).
//   { type: 'term', term }   a loose term, in Boxes & Circles' model (engine/terms.js).
//       The first part keeps its sign in `value`; later parts have a positive value, the op says the sign.
//
//   2(3x − 4) − x + 5  → [group + 2 (3x, −4), term − x, term + 5]
//   5 − 2(2x − 3)      → [term 5, group − 2 (2x, −3)]
//
// ① is the same expression with the groups opened, as Boxes & Circles terms with no
// rewriting needed: `5 − 4x + 6` (subtract = add the opposite, but the sign stays on the term).

import { MINUS } from './expr.js';
import { makeTerm, makeExpression, effective, numberText, termText, formatExpression, evaluate, formatAnswer } from './terms.js';
import { makeTermGroups, insideText } from './termGroups.js';

export const groupPart = (op, n, inside, { hiddenOne = false } = {}) => ({
  type: 'group', op, n, inside: inside.map((t) => ({ kind: t.kind, value: t.value })), hiddenOne,
});
export const termPart = (kind, op, value) => ({ type: 'term', term: makeTerm(kind, op, value) });

export function makeDistribute(parts) {
  if (!Array.isArray(parts) || parts.length < 2) throw new Error('A distribute problem needs at least two parts');
  if (!parts.some((p) => p.type === 'group')) throw new Error('A distribute problem needs a group');
  parts.forEach((part, i) => {
    if (part.type === 'group') {
      if (part.op !== '+' && part.op !== '-') throw new Error(`Bad operation: ${part.op}`);
      if (part.hiddenOne && part.n !== 1) throw new Error('Only a single group hides its 1');
      makeTermGroups({ neg: part.op === '-', n: part.n }, part.inside); // validates n and the two terms
    } else if (part.type === 'term') {
      const { op, value } = part.term;
      if (!Number.isInteger(value) || value === 0) throw new Error(`Bad term value: ${value}`);
      if (i === 0 && op !== '+') throw new Error('The first term keeps its sign in the number');
      if (i > 0 && value < 0) throw new Error('A later term is written with its operation, not a negative number');
    } else throw new Error(`Bad part: ${part.type}`);
  });
  return { kind: 'distribute', parts };
}

export const groupParts = (p) => p.parts.filter((x) => x.type === 'group');
export const looseTerms = (p) => p.parts.filter((x) => x.type === 'term').map((x) => x.term);
export const startsWithGroup = (p) => p.parts[0].type === 'group';
export const hasHiddenOne = (p) => groupParts(p).some((g) => g.hiddenOne);

// A group part as a Groups of Terms problem (for the lasso, the deal-out and the arrows check).
// A subtracted group has the opposite count: − 2(2x − 3) is "−2 groups of (2x − 3)".
export const groupOf = (part) => makeTermGroups({ neg: part.op === '-', n: part.n }, part.inside, { hidden1: part.hiddenOne });

// ---------- Writing ----------

const groupBody = (part) => `${part.hiddenOne ? '' : part.n}(${insideText(part)})`;

// "2(3x − 4) − x + 5", "5 − 2(2x − 3)", "4 − (x + 2)", "−2(x + 1) + 5".
export function formatDistribute(p) {
  return p.parts.map((part, i) => {
    if (part.type === 'term') return i === 0 ? numberText(part.term) : termText(part.term);
    return i === 0 ? `${part.op === '-' ? MINUS : ''}${groupBody(part)}` : `${part.op === '-' ? MINUS : '+'} ${groupBody(part)}`;
  }).join(' ');
}

// ---------- Subtract = add the opposite ----------

// A group that's subtracted after something: 5 − 2(2x − 3).
export const hasSubtractedGroup = (p) => p.parts.some((part, i) => i > 0 && part.type === 'group' && part.op === '-');

// The same problem as adding the opposite, in segments so the view can underline the changed part:
// `5 − 2(2x − 3)` → [5] [+ −2 (opposite)] [(2x − 3)], the notes' magenta "+ −2".
export function addOppositeSegments(p) {
  const out = [];
  p.parts.forEach((part, i) => {
    if (part.type === 'term') {
      out.push({ text: i === 0 ? numberText(part.term) : termText(part.term) });
    } else if (i > 0 && part.op === '-') {
      out.push({ text: `+ ${MINUS}${part.hiddenOne ? '' : part.n}`, opp: true }, { text: `(${insideText(part)})`, joined: true });
    } else {
      out.push({ text: `${i > 0 ? '+ ' : ''}${part.hiddenOne ? '' : part.n}(${insideText(part)})` });
    }
  });
  return out;
}
export const formatAddOpposite = (p) => addOppositeSegments(p).reduce((text, seg) => (text ? text + (seg.joined ? '' : ' ') : '') + seg.text, '');

// ---------- ① distribute ----------

// The terms after the groups are opened, in order, as Boxes & Circles terms: `6x − 8 − x + 5`.
export function distributedTerms(p) {
  const out = [];
  for (const part of p.parts) {
    if (part.type === 'term') {
      out.push({ kind: part.term.kind, value: effective(part.term) });
    } else {
      const sign = part.op === '-' ? -1 : 1;
      for (const t of part.inside) out.push({ kind: t.kind, value: sign * part.n * t.value });
    }
  }
  return out.map((t, i) => (i === 0
    ? makeTerm(t.kind, '+', t.value)
    : makeTerm(t.kind, t.value < 0 ? '-' : '+', Math.abs(t.value))));
}

export const distributedExpression = (p) => makeExpression(distributedTerms(p));
export const distributedText = (p) => formatExpression(distributedExpression(p));

// ---------- ② combine ----------

// What it comes to: { x, n }.
export const evaluateDistribute = (p) => evaluate(distributedExpression(p));
export const answerText = (p) => formatAnswer(evaluateDistribute(p));

// Pieces drawn once the groups are open (a measure of how long it takes to draw).
export const openPieces = (p) => distributedTerms(p).reduce((sum, t) => sum + Math.abs(effective(t)), 0);
