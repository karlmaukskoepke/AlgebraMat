// Flip It's play adapter: everything the shared play screen (main.js) needs
// to run one Flip It problem. Behavior is exactly as before the adapters.

import { newSession, reduce, STEPS } from '../engine/session.js';
import { hintFor } from '../engine/hints.js';
import { renderMat } from '../view/mat.js';
import { buildControls } from '../view/controls.js';
import { feedbackText } from '../view/feedback.js';

const LABELS = {
  rewrite: 'Rewrite', draw: 'Draw', partyBattle: 'Party or Battle?', cancel: 'Cancel', answer: 'Answer',
};

export const flipitPlay = {
  steps: () => STEPS.map((id) => ({ id, label: LABELS[id] })),
  newSession,
  reduce,
  feedbackText,
  buildControls,

  // View-only effects for one render: which piece just flipped, which
  // counters were just canceled (to animate), and the current hint.
  effects(before, session) {
    const fx = { hint: hintFor(session), justFlipped: null, justCanceled: [] };
    if (!before) return fx; // `before` is only passed for a move within the same problem
    for (const part of ['op', 'sign']) {
      if (before.flips[part] !== session.flips[part]) fx.justFlipped = part;
    }
    session.zones.forEach((zone, z) => zone.forEach((c, index) => {
      if (c.canceled && !before.zones[z]?.[index]?.canceled) fx.justCanceled.push({ zone: z, index });
    }));
    return fx;
  },

  renderMat: (session, fx) => renderMat(session, fx),

  // A tap on the Mat → an action (or null).
  matAction({ action, part, zone, index }) {
    if (action === 'flip') return { type: 'flip', part };
    if (action === 'zone') return { type: 'tapZone', zone: Number(zone) };
    if (action === 'counter') return { type: 'tapCounter', zone: Number(zone), index: Number(index) };
    return null;
  },
};
