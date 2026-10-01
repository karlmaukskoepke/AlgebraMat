// Boxes & Circles' play adapter (SPEC-BOXES.md): the same interface as Flip It's
// and Group It's, so the shared play screen runs it. Built so far: Box & Circle.

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
    answer: s.answer,
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
  matAction: () => null,           // the Mat is dragged, not tapped: see bindMat
  bindMat: bindBoxMat,
};
