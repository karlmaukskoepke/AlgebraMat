// Light mode's play adapter for Distribute, then combine's first rounds (see engine/distributeLight.js): the student
// types the answer, a wrong one gets the support that answers it (arrows, or Box & Circle then arrows, or the hidden 1
// then arrows), and a second one the card's own walk (distributePlay).

import { newDistributeLight, reduceDistributeLight } from '../engine/distributeLight.js';
import { newDistributeSession } from '../engine/distributeSession.js';
import { distributePlay, buildDistributeControls } from './distributePlay.js';
import { termGroupPlay, termGroupViewState } from './termGroupPlay.js';
import { boxPlay, boxViewState } from './boxPlay.js';
import { buildLightPlayControls } from './lightPlay.js';
import { buildBoxLightControls } from '../view/boxLightControls.js';
import { renderBoxMat } from '../view/boxMat.js';
import { renderTermGroupMat } from '../view/termGroupMat.js';
import { renderGroupLightMat } from '../view/groupLightMat.js';
import { distributeLightFeedbackText } from '../view/distributeLightFeedback.js';
import { bindBoxMat } from '../view/boxPointer.js';
import { formatDistribute } from '../engine/distribute.js';
import { recordProblem } from '../lightStore.js';
import { startIntro } from '../view/tour.js';
import { maybeShowDragDemo } from '../view/dragDemo.js';

const STEPS = {
  light: [{ id: 'answer', label: 'Answer' }],
  inside: [{ id: 'boxcircle', label: 'Box & Circle' }, { id: 'answer', label: 'Answer' }],
  one: [{ id: 'groups', label: 'Write the 1' }, { id: 'answer', label: 'Answer' }],
};

export const distributeLightPlay = {
  steps: (s) => (s.stage === 'walk' ? distributePlay.steps(s.walk) : STEPS[s.stage === 'support' ? s.support : 'light']),
  phaseLabel: (s) => (s.stage === 'walk' ? distributePlay.phaseLabel(s.walk) : null),
  newSession: newDistributeLight,
  reduce: reduceDistributeLight,
  feedbackText: distributeLightFeedbackText,
  buildControls: (root, dispatch) => buildLightPlayControls(
    root, dispatch, buildDistributeControls, (r, d) => buildBoxLightControls(r, d, { asks: false }), newDistributeSession, (s) => s.walk),
  effects(before, s) {
    if (!before && s.stage !== 'done') startIntro({ algebra: true });
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'distribute-combine', level: s.problem.logLevel ?? s.problem.level ?? null, problem: formatDistribute(s.problem) });
    }
    if (s.stage === 'support' && s.support === 'inside') {
      if (!(before?.stage === 'support' && before.support === 'inside')) maybeShowDragDemo(s.ts.problem.terms[0].kind === 'x' ? 'box' : 'circle');
      return { ...boxPlay.effects(before?.ts ?? null, s.ts), hint: null };
    }
    if (s.stage === 'support' && s.support === 'one') return { ...termGroupPlay.effects(before?.g ?? null, s.g), hint: null };
    if (s.stage === 'walk') return distributePlay.effects(before?.stage === 'walk' ? before.walk : null, s.walk);
    return { hint: null };
  },
  renderMat(s, fx = {}) {
    if (s.stage === 'walk') return distributePlay.renderMat(s.walk, fx);
    if (s.stage === 'support' && s.support === 'one') {
      return renderTermGroupMat({ ...termGroupViewState(s.g), context: formatDistribute(s.problem), fx });
    }
    if (s.stage === 'support') return renderBoxMat({ ...boxViewState(s.ts), notes: [formatDistribute(s.problem)], fx });
    return renderGroupLightMat({ problem: s.problem, arrows: s.arrows, fresh: s.arrowsFresh, typed: s.stage === 'done' ? s.finalText : s.entry, done: s.stage === 'done' });
  },
  matAction: (d) => distributePlay.matAction(d),
  // The inside terms are boxed and circled with a lasso; the walk's combine step has one too.
  bindMat: (root, dispatch, getSession) => bindBoxMat(root, dispatch, () => {
    const s = getSession();
    if (s?.stage === 'support' && s.support === 'inside') return s.ts;
    if (s?.stage === 'walk' && s.walk.stage === 'ts') return s.walk.ts;
    return { step: 'inactive', shapes: [], problem: s?.problem };
  }),
};
