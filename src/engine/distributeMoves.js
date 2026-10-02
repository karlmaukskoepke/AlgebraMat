// The Write it step of Distribute, then combine (SPEC-DISTRIBUTE.md §3): after the group is opened,
// the student writes the whole line with the group's terms in its place and every other term as it was
// (`2(3x − 4) − x + 5` → `6x − 8 − x + 5`). Returns { ok, feedbackKey, params? }; the wording lives in
// view/distributeFeedback.js. Pure logic, no DOM.

import { parseAnswer, effective } from './terms.js';
import { distributedTerms, distributedText, evaluateDistribute } from './distribute.js';

const pass = (feedbackKey, params) => ({ ok: true, feedbackKey, params });
const fail = (feedbackKey, params) => ({ ok: false, feedbackKey, params });

export function validateLine(problem, text) {
  const read = parseAnswer(text);
  if (!read.ok) return read.reason === 'empty' ? fail('typeAnswer') : fail('answerUnreadable');
  const want = distributedTerms(problem).map((t) => ({ kind: t.kind, value: effective(t) }));
  const same = read.terms.length === want.length
    && read.terms.every((t, i) => t.kind === want[i].kind && t.value === want[i].value);
  if (same) return pass('lineOk', { line: distributedText(problem) });

  const total = evaluateDistribute(problem);
  if (read.combined && read.x === total.x && read.n === total.n) return fail('lineTooSoon');
  // The right pieces with a sign wrong somewhere: the sign of a term is the operation in front of it.
  if (read.terms.length === want.length && read.terms.every((t, i) => t.kind === want[i].kind && Math.abs(t.value) === Math.abs(want[i].value))) {
    return fail('lineSigns');
  }
  if (read.terms.length < want.length) return fail('lineMissing');
  return fail('lineOff');
}
