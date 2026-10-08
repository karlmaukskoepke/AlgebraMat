// The play adapter for One-step equations in light mode (engine/solveLight.js): find x.

import { newSolveLight, reduceSolveLight } from '../engine/solveLight.js';
import { formatEquation } from '../engine/solve.js';
import { renderSolveMat } from '../view/solveMat.js';
import { buildWalkLightControls } from '../view/walkLightControls.js';
import { solveFeedbackText } from '../view/solveFeedback.js';
import { recordProblem } from '../lightStore.js';
import { startIntro } from '../view/tour.js';

export const solveLightPlay = {
  steps: () => [{ id: 'answer', label: 'Find x' }],
  newSession: newSolveLight,
  reduce: reduceSolveLight,
  feedbackText: solveFeedbackText,
  buildControls: (root, dispatch) => buildWalkLightControls(root, dispatch, 'integer'),
  effects(before, s) {
    if (!before && s.stage !== 'done') startIntro({ algebra: false });
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'one-step', level: s.problem.logLevel ?? null, problem: formatEquation(s.problem) });
    }
    return { hint: null };
  },
  renderMat: (s) => renderSolveMat({ problem: s.problem, rung: s.rung, tried: s.tried, typed: s.entry, done: s.stage === 'done', finalText: s.finalText }),
  matAction: () => null,
};
