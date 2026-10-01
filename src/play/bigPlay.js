// Combine it Level 4's play adapter (SPEC-COMBINE.md §3): circle the numbers, then Party or Battle, Add or
// Subtract, the sign, and the answer. Three-term problems add a Combine step first.

import { newBigSession, reduceBig, bigSteps, meetingNumbers, hasCombine } from '../engine/bigSession.js';
import { bigHintFor } from '../engine/bigHints.js';
import { effective, prettyAnswer, parseAnswer } from '../engine/terms.js';
import { MINUS } from '../engine/expr.js';
import { shapeComplete } from '../engine/termSession.js';
import { renderBoxMat } from '../view/boxMat.js';
import { buildBigControls } from '../view/bigControls.js';
import { bigFeedbackText } from '../view/bigFeedback.js';
import { bindBoxMat } from '../view/boxPointer.js';

const signed = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
const inParens = (v) => (v < 0 ? `(${signed(v)})` : signed(v));

// What the student has worked out so far, a line per step (Kalam, above the expression).
export function bigNotes(s) {
  const notes = [];
  const { problem } = s;
  const values = problem.terms.map(effective);
  const passed = (id) => ['combine', 'partyBattle', 'addSub', 'sign', 'answer', 'done'].indexOf(s.step) > ['combine', 'partyBattle', 'addSub', 'sign', 'answer', 'done'].indexOf(id);

  if (hasCombine(problem)) {
    const { pair, partial } = meetingNumbers(problem);
    if (s.step === 'combine' && s.picked.length === 2) {
      const [i, j] = s.picked;
      const typed = parseAnswer(s.entry).ok ? prettyAnswer(s.entry) : s.entry === '-' ? MINUS : '?';
      notes.push(`${signed(values[i])} + ${inParens(values[j])} = ${typed}`);
    } else if (passed('combine')) {
      notes.push(`${signed(values[pair[0]])} + ${inParens(values[pair[1]])} = ${signed(partial)}`);
    }
  }
  const { a, b } = meetingNumbers(problem);
  if (s.choice) notes.push(s.choice);
  if (s.op) {
    const [hi, lo] = Math.abs(a) >= Math.abs(b) ? [Math.abs(a), Math.abs(b)] : [Math.abs(b), Math.abs(a)];
    notes.push(s.op === 'add' ? `add: ${hi} + ${lo}` : `subtract: ${hi} ${MINUS} ${lo}`);
  }
  if (s.sign) notes.push(`sign: ${s.sign === '-' ? MINUS : '+'}`);
  return notes;
}

export function bigViewState(s) {
  const typing = s.step === 'answer';
  return {
    expr: s.problem,
    shapes: s.shapes.map((shape) => ({ ...shape, complete: shapeComplete(s.problem, shape) })),
    selecting: s.selecting,
    rewritten: [],
    flipped: [],
    pieces: s.pieces,
    key: false,
    tap: s.step === 'combine' ? 'terms' : null,
    picked: s.step === 'combine' ? s.picked : [],
    notes: bigNotes(s),
    answer: typing ? { text: prettyAnswer(s.entry), done: false } : s.step === 'done' ? { text: s.finalText, done: true } : null,
  };
}

export const bigPlay = {
  steps: (s) => bigSteps(s.problem),
  newSession: newBigSession,
  reduce: reduceBig,
  feedbackText: bigFeedbackText,
  buildControls: buildBigControls,
  // View-only effects for one render: the hint, and the newest shape (to fade it in).
  effects(before, session) {
    const fx = { hint: bigHintFor(session), added: [], canceled: [], flipped: [], shape: null };
    if (before && session.shapes.length > before.shapes.length) fx.shape = session.shapes.length - 1;
    return fx;
  },
  renderMat: (session, fx = {}) => renderBoxMat({ ...bigViewState(session), fx }),
  matAction: (d) => (d.action === 'term' ? { type: 'tapTerm', term: Number(d.term) } : null),
  bindMat: bindBoxMat,
};
