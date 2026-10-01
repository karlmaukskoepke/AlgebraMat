// Move validators for Boxes & Circles (SPEC-BOXES.md §2). Each returns
// { ok, feedbackKey, params? }; the wording lives in view/termFeedback.js.
// Pure logic, no DOM.

import { termParts, termText, isX } from './terms.js';
import { MINUS } from './expr.js';

const pass = (feedbackKey, params) => ({ ok: true, feedbackKey, params });
const fail = (feedbackKey, params) => ({ ok: false, feedbackKey, params });

// A shape is { kind: 'box' | 'circle', from, to }: it goes around the parts
// from..to of the expression (indexes into termParts), in either order.
const span = (shape) => [Math.min(shape.from, shape.to), Math.max(shape.from, shape.to)];

// What a shape surrounds: the terms it touches, and whether it is exactly one
// whole term (its operation and its number).
export function shapeInfo(expr, shape) {
  const parts = termParts(expr);
  const [lo, hi] = span(shape);
  const covered = parts.filter((_, i) => i >= lo && i <= hi);
  const terms = [...new Set(covered.map((p) => p.term))];
  const term = terms.length === 1 ? terms[0] : null;
  const mine = term === null ? [] : parts.filter((p) => p.term === term);
  const hasOp = covered.some((p) => p.part === 'op');
  const hasNum = covered.some((p) => p.part === 'num');
  return {
    terms, term, hasOp, hasNum,
    complete: term !== null && covered.length === mine.length,
  };
}

// Do two shapes share any part?
export const overlaps = (a, b) => {
  const [a1, a2] = span(a);
  const [b1, b2] = span(b);
  return a1 <= b2 && b1 <= a2;
};

const opOf = (expr, term) => (expr.terms[term].op === '-' ? MINUS : '+');

// ① Box & Circle: every variable term boxed and every number circled, each
// shape around exactly one term including the operation in front. Shapes that
// are wrong are named before missing ones, so the feedback is about what the
// student drew.
export function validateShapes(expr, shapes) {
  const infos = shapes.map((shape) => ({ shape, ...shapeInfo(expr, shape) }));

  for (const info of infos) {
    if (info.term === null) return fail('twoTerms');
  }
  for (const info of infos) {
    const term = expr.terms[info.term];
    const want = isX(term) ? 'box' : 'circle';
    if (info.shape.kind !== want) return fail(isX(term) ? 'boxIt' : 'circleIt', { text: termText(term, info.term === 0) });
  }
  for (const info of infos) {
    if (info.complete) continue;
    const term = expr.terms[info.term];
    if (!info.hasOp && info.term > 0) { // the first term has no operation to include
      return fail('includeSign', { op: opOf(expr, info.term), text: termText(term, false) });
    }
    if (!info.hasNum) return fail('includeNumber', { op: opOf(expr, info.term) });
  }
  const done = new Set(infos.map((i) => i.term));
  for (let i = 0; i < expr.terms.length; i++) {
    if (done.has(i)) continue;
    return fail(isX(expr.terms[i]) ? 'boxMissing' : 'circleMissing', { text: termText(expr.terms[i], i === 0) });
  }
  return pass('boxCircleDone');
}
