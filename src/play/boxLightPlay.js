// Light mode's play adapter for Boxes & Circles (see engine/boxLight.js): the student types the answer; Draw boxes &
// circles and Rewrite subtractions are there to ask for; a wrong answer brings in the boxes and circles, and a second
// one the card's own walk (boxPlay).

import { newBoxLight, reduceBoxLight, rewriteView } from '../engine/boxLight.js';
import { newTermSession, termSteps } from '../engine/termSession.js';
import { termParts, formatExpression } from '../engine/terms.js';
import { boxPlay, boxViewState } from './boxPlay.js';
import { buildLightPlayControls } from './lightPlay.js';
import { buildBoxControls } from '../view/boxControls.js';
import { buildBoxLightControls } from '../view/boxLightControls.js';
import { renderBoxMat } from '../view/boxMat.js';
import { boxLightFeedbackText } from '../view/boxLightFeedback.js';
import { bindBoxMat } from '../view/boxPointer.js';
import { recordProblem } from '../lightStore.js';
import { startIntro } from '../view/tour.js';
import { maybeShowDragDemo } from '../view/dragDemo.js';

const STEPS = {
  light: [{ id: 'answer', label: 'Answer' }],
  boxcircle: [{ id: 'boxcircle', label: 'Box & Circle' }, { id: 'answer', label: 'Answer' }],
  rewrite: [{ id: 'rewrite', label: 'Rewrite' }, { id: 'answer', label: 'Answer' }],
};

// The rewrite support as the Mat shows it: every subtraction can flip, the flipped parts are magenta, and a term being
// rewritten gets a dashed line round its − and round the number after it.
function rewriteViewState(s) {
  const problem = rewriteView(s.problem);
  const view = boxViewState({ ...s.ts, problem, step: 'rewrite', flips: s.rw });
  const rings = [...new Set(termParts(problem).filter((p) => s.rw[`${p.term}:${p.part}`]).map((p) => p.term))];
  return { ...view, rings, tap: 'parts' };
}

export const boxLightPlay = {
  steps: (s) => (s.stage === 'walk' ? termSteps(s.ts.problem) : STEPS[s.stage === 'support' ? s.support : 'light']),
  newSession: newBoxLight,
  reduce: reduceBoxLight,
  feedbackText: boxLightFeedbackText,
  buildControls: (root, dispatch) => buildLightPlayControls(root, dispatch, buildBoxControls, buildBoxLightControls, newTermSession, (s) => s.ts),
  effects(before, s) {
    if (!before && s.stage !== 'done') startIntro({ algebra: true });
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'boxes', level: s.problem.logLevel ?? s.problem.level ?? null, problem: formatExpression(s.problem) });
    }
    if (s.stage === 'walk') return boxPlay.effects(before?.stage === 'walk' ? before.ts : null, s.ts);
    if (s.stage === 'support' && s.support === 'boxcircle') {
      if (!(before?.stage === 'support' && before.support === 'boxcircle')) maybeShowDragDemo(s.problem.terms[0].kind === 'x' ? 'box' : 'circle');
      return { ...boxPlay.effects(before?.ts ?? null, s.ts), hint: null };
    }
    return { hint: null };
  },
  renderMat(s, fx = {}) {
    if (s.stage === 'walk') return boxPlay.renderMat(s.ts, fx);
    if (s.stage === 'support' && s.support === 'rewrite') return renderBoxMat({ ...rewriteViewState(s), fx });
    if (s.stage === 'support') return renderBoxMat({ ...boxViewState(s.ts), fx });
    // Typing: the expression (with any boxes, circles or rewrites kept) and the answer line.
    const done = s.stage === 'done';
    const view = boxViewState({ ...s.ts, step: done ? 'done' : 'answer', entry: s.entry, finalText: s.finalText });
    return renderBoxMat({ ...view, tap: null, key: false, fx });
  },
  matAction: (d) => (d.action === 'part' ? { type: 'flipPart', index: Number(d.part) } : boxPlay.matAction(d)),
  // The boxes and circles are dragged: the pointer sees that step's session (the support's or the walk's), else an idle one.
  bindMat: (root, dispatch, getSession) => bindBoxMat(root, dispatch, () => {
    const s = getSession();
    const live = s && (s.stage === 'walk' || (s.stage === 'support' && s.support === 'boxcircle'));
    return live ? s.ts : { step: 'inactive', shapes: [], problem: s?.problem };
  }),
};

