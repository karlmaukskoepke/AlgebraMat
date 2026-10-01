// The play adapter for integer problems that run on Boxes & Circles' steps (SPEC-COMBINE.md): Combine it's
// Level 3 (Draw → Cancel → Answer) and Flip It's mixed Level 5 (Rewrite → Draw → Cancel → Answer). Counters only,
// in a column above each number; the answer is a single number.

import { boxPlay, boxViewState } from './boxPlay.js';
import { buildBoxControls } from '../view/boxControls.js';
import { renderBoxMat } from '../view/boxMat.js';
import { integerFeedbackText } from '../view/integerFeedback.js';

// Boxes & Circles' palette without what integers don't use: the Box and Circle tools, the box pieces, and the
// x and + keys of the answer pad (the answer is just digits and a −).
export function buildIntegerControls(root, dispatch) {
  const controls = buildBoxControls(root, dispatch);
  const drop = (selector) => root.querySelectorAll(selector).forEach((b) => b.remove());
  drop('[data-action="pickTool"]');
  drop('[data-action="pickPiece"][data-piece-type="box"]');
  drop('.pad [data-key="x"], .pad [data-key="+"]');
  root.querySelectorAll('.palette-row .group').forEach((g) => { if (!g.children.length) g.remove(); });
  return controls;
}

// The Mat has no mystery-box key to show.
const viewState = (s) => ({ ...boxViewState(s), key: false });

export const integerPlay = {
  ...boxPlay,
  feedbackText: integerFeedbackText,
  buildControls: buildIntegerControls,
  renderMat: (session, fx = {}) => renderBoxMat({ ...viewState(session), fx }),
};
