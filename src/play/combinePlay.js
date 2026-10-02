// Combine it's play adapter (SPEC-COMBINE.md §3): Levels 1 and 2 are Flip It's engine and Mat
// with Rewrite left out, since nothing is subtracted: Draw → Party or Battle → Cancel → Answer.
// Levels 3 and 4 come in later builds.

import { STEPS } from '../engine/session.js';
import { newCombineSession } from '../engine/combineSession.js';
import { buildControls } from '../view/controls.js';
import { flipitPlay } from './flipitPlay.js';

const LABELS = { draw: 'Draw', partyBattle: 'Party or Battle?', cancel: 'Cancel', answer: 'Answer' };

// Flip It's palette without "Nothing to rewrite".
export function buildCombineControls(root, dispatch) {
  const controls = buildControls(root, dispatch);
  const nothing = root.querySelector('[data-action="nothingToRewrite"]');
  if (nothing) nothing.closest('.group').style.display = 'none';
  return controls;
}

export { newCombineSession };

export const combinePlay = {
  ...flipitPlay,
  steps: () => STEPS.filter((id) => id !== 'rewrite').map((id) => ({ id, label: LABELS[id] })),
  newSession: newCombineSession,
  buildControls: buildCombineControls,
};
