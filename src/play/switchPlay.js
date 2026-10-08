// The play adapter for the Switch sides card (engine/switchSides.js): move the number across the border, then find x.

import { newSwitch, reduceSwitch } from '../engine/switchSides.js';
import { formatEquation } from '../engine/equation.js';
import { renderSwitchMat } from '../view/switchMat.js';
import { bindSwitchMat } from '../view/switchPointer.js';
import { buildWalkLightControls } from '../view/walkLightControls.js';
import { switchFeedbackText } from '../view/switchFeedback.js';
import { recordProblem } from '../lightStore.js';
import { startIntro } from '../view/tour.js';

export const switchPlay = {
  steps: () => [{ id: 'move', label: 'Switch sides' }, { id: 'answer', label: 'Find x' }],
  newSession: newSwitch,
  reduce: reduceSwitch,
  feedbackText: switchFeedbackText,
  buildControls: (root, dispatch) => buildWalkLightControls(root, dispatch, 'integer'),
  bindMat: bindSwitchMat,
  effects(before, s) {
    if (!before && s.stage !== 'done') startIntro({ algebra: false });
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'switch', level: s.problem.logLevel ?? null, problem: formatEquation(s.problem) });
    }
    return { hint: null };
  },
  renderMat: renderSwitchMat,
  matAction: () => null,
};
