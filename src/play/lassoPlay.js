// Lasso's play adapter (SPEC-LASSO.md §3): the same interface as Flip It's,
// so the shared play screen runs either pack, for both step scripts.

import { MINUS } from '../engine/expr.js';
import { newLassoSession, reduceLasso, stepsFor } from '../engine/lassoSession.js';
import { renderLassoMat } from '../view/lassoMat.js';
import { buildLassoControls } from '../view/lassoControls.js';
import { lassoFeedbackText } from '../view/lassoFeedback.js';

// What's on the pad, as it should read in the arrow chain.
function entryText(entry) {
  if (entry.digits === '') return entry.negative ? MINUS : '?';
  return `${entry.negative && entry.digits !== '0' ? MINUS : ''}${entry.digits}`;
}

// The session, plus what the Mat should make tappable or show as being typed.
export function lassoViewState(s) {
  return {
    ...s,
    tap: s.step === 'groups' || s.step === 'fill' ? 'lassos'
      : s.step === 'whole' ? 'whole'
        : s.step === 'split' || s.step === 'take' ? 'parts' : null,
    slot: s.step === 'groups' && s.problem.hidden1 && !s.wroteOne,
    totalText: s.step === 'count' ? entryText(s.entry) : undefined,
    answerText: s.step === 'opposite' && s.flipped ? entryText(s.entry) : undefined,
  };
}

export const lassoPlay = {
  steps: (session) => stepsFor(session.problem),
  newSession: newLassoSession,
  reduce: reduceLasso,
  feedbackText: lassoFeedbackText,
  buildControls: buildLassoControls,
  effects: () => ({ hint: null }), // Lasso hints come in Lasso step 6
  renderMat: (session) => renderLassoMat(lassoViewState(session)),

  matAction({ action, index }) {
    if (action === 'writeOne') return { type: 'writeOne' };
    if (action === 'lasso') return { type: 'tapLasso', index: Number(index) };
    if (action === 'whole') return { type: 'tapWhole' };
    if (action === 'part') return { type: 'tapPart', index: Number(index) };
    return null;
  },
};
