// Groups of Terms' play adapter (SPEC-GROUPS-OF-TERMS.md §3): the same interface as Group It's,
// so the shared play screen runs it.

import { termGroupHintFor } from '../engine/termGroupHints.js';
import { newTermGroupSession, reduceTermGroups, stepsFor, nextPart, oneOpen } from '../engine/termGroupSession.js';
import { prettyAnswer } from '../engine/terms.js';
import { renderTermGroupMat } from '../view/termGroupMat.js';
import { buildTermGroupControls } from '../view/termGroupControls.js';
import { termGroupFeedbackText } from '../view/termGroupFeedback.js';

// The session, plus what the Mat should make tappable or show being typed.
export function termGroupViewState(s) {
  return {
    ...s,
    tap: ['groups', 'fill', 'take'].includes(s.step) ? 'groups' : s.step === 'flip' ? 'flip' : null,
    next: s.script === 'fraction' && s.step === 'fill' ? nextPart(s) : null,
    oneOpen: oneOpen(s),
    oneText: oneOpen(s) ? s.entry.digits : '',
    // The answer: what's being typed after the arrow, then what was written once it's right.
    totalText: s.step === 'answer' ? prettyAnswer(s.typed) || '?' : undefined,
    answer: s.finalText ?? null,
    checkIt: s.step === 'checkit',
  };
}

export const termGroupPlay = {
  steps: (session) => stepsFor(session.problem),
  newSession: newTermGroupSession,
  reduce: reduceTermGroups,
  feedbackText: termGroupFeedbackText,
  buildControls: buildTermGroupControls,
  // View-only effects for one render: the hint, which groups just flipped (to turn them over),
  // and which pieces were just added (to pop them in).
  effects(before, session) {
    const fx = { hint: termGroupHintFor(session), justFlipped: [], added: [] };
    if (!before) return fx; // `before` is only passed for a move within the same problem
    session.groups.forEach((g, i) => {
      if (g.flipped && !before.groups[i]?.flipped) fx.justFlipped.push(i);
      const had = before.groups[i]?.pieces.length ?? 0;
      for (let k = had; k < g.pieces.length; k++) fx.added.push({ group: i, index: k });
    });
    return fx;
  },
  renderMat: (session, fx = {}) => renderTermGroupMat({ ...termGroupViewState(session), fx }),

  matAction({ action, index }) {
    if (action === 'group') return { type: 'tapGroup', index: Number(index) };
    if (action === 'flip') return { type: 'flipGroup', index: Number(index) };
    return null;
  },
};
