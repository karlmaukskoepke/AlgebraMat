// Groups of Terms' play adapter (SPEC-GROUPS-OF-TERMS.md §3): the same interface as Group It's,
// so the shared play screen runs it. Built so far: Groups, + or −, and Fill.

import { newTermGroupSession, reduceTermGroups, stepsFor, nextPart, oneOpen } from '../engine/termGroupSession.js';
import { renderTermGroupMat } from '../view/termGroupMat.js';
import { buildTermGroupControls } from '../view/termGroupControls.js';
import { termGroupFeedbackText } from '../view/termGroupFeedback.js';

// The session, plus what the Mat should make tappable or show being typed.
export function termGroupViewState(s) {
  return {
    ...s,
    tap: ['groups', 'fill'].includes(s.step) ? 'groups' : null,
    next: s.script === 'fraction' && s.step === 'fill' ? nextPart(s) : null,
    oneOpen: oneOpen(s),
    oneText: oneOpen(s) ? s.entry.digits : '',
  };
}

export const termGroupPlay = {
  steps: (session) => stepsFor(session.problem),
  newSession: newTermGroupSession,
  reduce: reduceTermGroups,
  feedbackText: termGroupFeedbackText,
  buildControls: buildTermGroupControls,
  effects: () => ({ hint: null, justFlipped: [] }), // hints come in the last Groups of Terms build
  renderMat: (session, fx = {}) => renderTermGroupMat({ ...termGroupViewState(session), fx }),

  matAction({ action, index }) {
    if (action === 'group') return { type: 'tapGroup', index: Number(index) };
    return null;
  },
};
