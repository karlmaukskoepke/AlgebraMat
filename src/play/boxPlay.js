// Boxes & Circles' play adapter (SPEC-BOXES.md): the same interface as Flip It's
// and Group It's, so the shared play screen runs it. Built so far: Box & Circle, Draw, Cancel and Answer.

import { prettyAnswer } from '../engine/terms.js';
import { newTermSession, reduceTerms, shapeComplete, TERM_STEPS } from '../engine/termSession.js';
import { renderBoxMat } from '../view/boxMat.js';
import { buildBoxControls } from '../view/boxControls.js';
import { termFeedbackText } from '../view/termFeedback.js';
import { bindBoxMat } from '../view/boxPointer.js';

// The session, as the Mat draws it: shapes know whether they're finished.
export function boxViewState(s) {
  return {
    expr: s.problem,
    shapes: s.shapes.map((shape) => ({ ...shape, complete: shapeComplete(s.problem, shape) })),
    selecting: s.selecting,
    pieces: s.pieces,
    key: s.step === 'draw',
    tap: s.step === 'draw' ? 'zones' : s.step === 'cancel' ? 'pieces' : null,
    selected: s.selected,
    answer: s.step === 'answer' ? { text: prettyAnswer(s.entry), done: false }
      : s.step === 'done' ? { text: s.finalText, done: true } : null,
  };
}

export const boxPlay = {
  steps: () => TERM_STEPS,
  newSession: newTermSession,
  reduce: reduceTerms,
  feedbackText: termFeedbackText,
  buildControls: buildBoxControls,
  effects: () => ({ hint: null }), // hints come in the last Boxes & Circles build
  renderMat: (session, fx = {}) => renderBoxMat({ ...boxViewState(session), fx }),
  // Box & Circle is dragged (see bindMat); Draw and Cancel are tapped.
  matAction: (d) => {
    if (d.action === 'zone') return { type: 'tapZone', term: Number(d.term) };
    if (d.action === 'piece') return { type: 'tapPiece', term: Number(d.term), index: Number(d.index) };
    return null;
  },
  bindMat: bindBoxMat,
};
