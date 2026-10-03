// Light mode's play adapter for Groups of Terms (see engine/termGroupLight.js): the student types the answer, a wrong
// one gets the support that answers it (arrows, or Box & Circle then arrows, or the hidden 1 then arrows), and a second
// one the groups walk (termGroupPlay).

import { newTermGroupLight, reduceTermGroupLight } from '../engine/termGroupLight.js';
import { newTermGroupSession, stepsFor } from '../engine/termGroupSession.js';
import { termGroupPlay } from './termGroupPlay.js';
import { boxPlay, boxViewState } from './boxPlay.js';
import { buildLightPlayControls } from './lightPlay.js';
import { buildTermGroupControls } from '../view/termGroupControls.js';
import { buildBoxLightControls } from '../view/boxLightControls.js';
import { renderBoxMat } from '../view/boxMat.js';
import { renderGroupLightMat } from '../view/groupLightMat.js';
import { termGroupLightFeedbackText } from '../view/termGroupLightFeedback.js';
import { bindBoxMat } from '../view/boxPointer.js';
import { formatTermGroups } from '../engine/termGroups.js';
import { recordProblem } from '../lightStore.js';
import { startIntro } from '../view/tour.js';
import { maybeShowDragDemo } from '../view/dragDemo.js';

const STEPS = {
  light: [{ id: 'answer', label: 'Answer' }],
  inside: [{ id: 'boxcircle', label: 'Box & Circle' }, { id: 'answer', label: 'Answer' }],
  one: [{ id: 'groups', label: 'Write the 1' }, { id: 'answer', label: 'Answer' }],
};

export const termGroupLightPlay = {
  steps: (s) => (s.stage === 'walk' ? stepsFor(s.problem) : STEPS[s.stage === 'support' ? s.support : 'light']),
  newSession: newTermGroupLight,
  reduce: reduceTermGroupLight,
  feedbackText: termGroupLightFeedbackText,
  buildControls: (root, dispatch) => buildLightPlayControls(
    root, dispatch, buildTermGroupControls, (r, d) => buildBoxLightControls(r, d, { asks: false }), newTermGroupSession, (s) => s.g),
  effects(before, s) {
    if (!before && s.stage !== 'done') startIntro({ algebra: true });
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'groups-of-terms', level: s.problem.logLevel ?? null, problem: formatTermGroups(s.problem) });
    }
    if (s.stage === 'support' && s.support === 'inside') {
      if (!(before?.stage === 'support' && before.support === 'inside')) maybeShowDragDemo(s.ts.problem.terms[0].kind === 'x' ? 'box' : 'circle');
      return { ...boxPlay.effects(before?.ts ?? null, s.ts), hint: null };
    }
    if (s.stage === 'support' && s.support === 'one') return { ...termGroupPlay.effects(before?.g ?? null, s.g), hint: null };
    if (s.stage === 'walk') return termGroupPlay.effects(before?.stage === 'walk' ? before.g : null, s.g);
    return { hint: null };
  },
  renderMat(s, fx = {}) {
    if (s.stage === 'walk') return termGroupPlay.renderMat(s.g, fx);
    if (s.stage === 'support' && s.support === 'one') return termGroupPlay.renderMat(s.g, fx);
    if (s.stage === 'support') {
      // Box & Circle on the terms inside, with the whole problem noted above them.
      return renderBoxMat({ ...boxViewState(s.ts), notes: [formatTermGroups(s.problem)], fx });
    }
    return renderGroupLightMat({ problem: s.problem, arrows: s.arrows, fresh: s.arrowsFresh, typed: s.stage === 'done' ? s.finalText : s.entry, done: s.stage === 'done' });
  },
  matAction: (d) => termGroupPlay.matAction(d),
  // The inside terms are boxed and circled with a lasso: the pointer sees that session, or an idle one.
  bindMat: (root, dispatch, getSession) => bindBoxMat(root, dispatch, () => {
    const s = getSession();
    return s?.stage === 'support' && s.support === 'inside' ? s.ts : { step: 'inactive', shapes: [], problem: s?.problem };
  }),
};
