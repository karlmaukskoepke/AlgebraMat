// Group It's play adapter (SPEC-LASSO.md §3): the same interface as Flip It's,
// so the shared play screen runs either pack, for both step scripts.

import { MINUS } from '../engine/expr.js';
import { newLassoSession, reduceLasso, stepsFor, nextPart, oneOpen } from '../engine/lassoSession.js';
import { lassoHintFor } from '../engine/lassoHints.js';
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
  const tap = ['groups', 'fill', 'take'].includes(s.step) ? 'groups' : s.step === 'flip' ? 'flip' : null;
  return {
    ...s,
    tap,
    next: s.script === 'fraction' && s.step === 'fill' ? nextPart(s) : null,
    oneOpen: oneOpen(s),
    oneText: oneOpen(s) ? s.entry.digits : '',
    totalText: s.step === 'count' ? entryText(s.entry) : undefined,
  };
}

export const lassoPlay = {
  steps: (session) => stepsFor(session.problem),
  newSession: newLassoSession,
  reduce: reduceLasso,
  feedbackText: lassoFeedbackText,
  buildControls: buildLassoControls,
  // View-only effects for one render: the hint, and which groups just flipped
  // (to animate them turning over).
  effects(before, session) {
    const fx = { hint: lassoHintFor(session), justFlipped: [] };
    if (!before) return fx; // `before` is only passed for a move within the same problem
    session.groups.forEach((g, i) => { if (g.flipped && !before.groups[i]?.flipped) fx.justFlipped.push(i); });
    return fx;
  },
  renderMat: (session, fx = {}) => renderLassoMat({ ...lassoViewState(session), fx }),

  matAction({ action, index }) {
    if (action === 'group') return { type: 'tapGroup', index: Number(index) };
    if (action === 'flip') return { type: 'flipGroup', index: Number(index) };
    return null;
  },
};
