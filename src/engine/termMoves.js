// Move validators for Boxes & Circles (SPEC-BOXES.md §2). Each returns
// { ok, feedbackKey, params? }; the wording lives in view/termFeedback.js.
// Pure logic, no DOM.

import { termParts, termText, isX, pieceCount, pieceSign, evaluate, formatAnswer, parseAnswer } from './terms.js';
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

// ---------- ② Draw ----------

// Most pieces one term's column can hold: what it needs plus two spare (up to 10), so
// "too many" can happen but the Mat only has to make room for a few extra.
export const maxPieces = (term) => Math.min(10, pieceCount(term) + 2);

// What a term should draw, in words: "4 negative boxes", "1 box", "5 negatives", "7 positives".
export function piecePhrase(term) {
  const count = pieceCount(term);
  const neg = pieceSign(term) === '-';
  if (isX(term)) return `${count} ${neg ? 'negative ' : ''}box${count === 1 ? '' : 'es'}`;
  return `${count} ${neg ? 'negative' : 'positive'}${count === 1 ? '' : 's'}`;
}

// Every term has the right pieces: boxes for an x term, counters for a number,
// of the sign the term is worth, and the right number of them. Feedback is about
// the first term (in reading order) that's off.
export function validateDraw(expr, columns) {
  for (let i = 0; i < expr.terms.length; i++) {
    const term = expr.terms[i];
    const column = columns[i] ?? [];
    const text = termText(term, i === 0);
    const type = isX(term) ? 'box' : 'counter';
    if (column.some((p) => p.type !== type)) return fail(isX(term) ? 'drawBoxes' : 'drawCounters', { text });
    if (column.length === 0 || column.some((p) => p.sign !== pieceSign(term))) {
      return fail('needPieces', { text, phrase: piecePhrase(term) });
    }
    if (column.length !== pieceCount(term)) return fail('countAgain', { text, have: column.length, count: pieceCount(term) });
  }
  return pass('drawDone');
}

// ---------- ④ Answer ----------

// The typed expression: readable, fully combined, and right. Feedback says which
// kind is off (the boxes or the numbers) without giving the number.
export function validateAnswer(expr, text) {
  const read = parseAnswer(text);
  // Integer problems can come to zero (Flip It's mixed level): that's typed as a plain 0.
  const total = evaluate(expr);
  if (total.x === 0 && total.n === 0) {
    if (!read.ok) return read.reason === 'empty' ? fail('typeAnswer') : fail('answerUnreadable');
    const plainZero = read.terms.length === 1 && read.terms[0].kind === 'int' && read.terms[0].value === 0;
    return plainZero && /^[-−+]?0+$/.test(String(text).replace(/\s/g, '')) ? pass('correct', { answer: '0' }) : fail('checkNumbers');
  }
  if (!read.ok) return read.reason === 'empty' ? fail('typeAnswer') : fail('answerUnreadable');
  if (!read.combined) return fail(read.terms.some((t) => t.value === 0) ? 'noZeroTerm' : 'combineAll');
  const want = evaluate(expr);
  if (read.x !== want.x) return fail('checkBoxes');
  if (read.n !== want.n) return fail('checkNumbers');
  return pass('correct', { answer: formatAnswer(want) });
}
