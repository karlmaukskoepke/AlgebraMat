// The play adapter for Value it in light mode (engine/valueLight.js): evaluate an expression for a value of x.

import { newValueLight, reduceValueLight } from '../engine/valueLight.js';
import { formatValue } from '../engine/value.js';
import { renderValueMat } from '../view/valueMat.js';
import { buildWalkLightControls } from '../view/walkLightControls.js';
import { valueFeedbackText } from '../view/valueFeedback.js';
import { recordProblem } from '../lightStore.js';
import { startIntro } from '../view/tour.js';

export const valueLightPlay = {
  steps: () => [{ id: 'answer', label: 'Evaluate it' }],
  newSession: newValueLight,
  reduce: reduceValueLight,
  feedbackText: valueFeedbackText,
  buildControls: (root, dispatch) => buildWalkLightControls(root, dispatch, 'integer'),
  effects(before, s) {
    if (!before && s.stage !== 'done') startIntro({ algebra: false });
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'value', level: s.problem.logLevel ?? null, problem: formatValue(s.problem) });
    }
    return { hint: null };
  },
  renderMat: (s) => renderValueMat({ problem: s.problem, rung: s.rung, typed: s.entry, done: s.stage === 'done', finalText: s.finalText }),
  matAction: () => null,
};
