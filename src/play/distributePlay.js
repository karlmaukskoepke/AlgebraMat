// Distribute, then combine's play adapter (SPEC-DISTRIBUTE.md): the same interface as the other packs', so the
// shared play screen runs it. It hands each step to the pack that already teaches it: Groups of Terms for
// ① distribute, a Write it step of its own, then Boxes & Circles for ② combine.

import { termGroupPlay, termGroupViewState } from './termGroupPlay.js';
import { boxPlay, boxViewState } from './boxPlay.js';
import { buildTermGroupControls } from '../view/termGroupControls.js';
import { buildBoxControls } from '../view/boxControls.js';
import { renderTermGroupMat } from '../view/termGroupMat.js';
import { renderBoxMat } from '../view/boxMat.js';
import { renderLineMat } from '../view/distributeMat.js';
import { distributeFeedbackText } from '../view/distributeFeedback.js';
import { bindBoxMat } from '../view/boxPointer.js';
import { newDistributeSession, reduceDistribute, distributeSteps, phaseLabel, groupProblem } from '../engine/distributeSession.js';
import { distributeHintFor } from '../engine/distributeHints.js';
import { formatDistribute, hasSubtractedGroup, addOppositeSegments } from '../engine/distribute.js';
import { answerText as groupAnswerText } from '../engine/termGroups.js';
import { prettyAnswer } from '../engine/terms.js';

// What a palette shows when it isn't the one in use: everything off.
const INACTIVE = { step: 'inactive', shapes: [], drawn: [], pairs: [], snapshots: [], skipped: [], tries: {} };

// Both packs' palettes live in the one footer; only the active one is shown and enabled. At Check it, Groups of
// Terms' Next → moves on to Write it (not to the next problem).
export function buildDistributeControls(root, dispatch) {
  root.innerHTML = '';
  const groupsRoot = document.createElement('div');
  const boxRoot = document.createElement('div');
  groupsRoot.className = boxRoot.className = 'dist-controls';
  root.append(groupsRoot, boxRoot);
  let stage = 'tg';
  const send = (action) => dispatch(action.type === 'next' && stage === 'tg' ? { type: 'continue' } : action);
  const groups = buildTermGroupControls(groupsRoot, send);
  const boxes = buildBoxControls(boxRoot, send);

  return {
    update(s, hint = null) {
      stage = s.stage ?? stage;
      const finished = s.step === 'levelDone';
      const useBoxes = s.stage === 'ts';
      groupsRoot.hidden = useBoxes;
      boxRoot.hidden = !useBoxes;
      if (finished) {
        groups.update({ ...INACTIVE, problem: s.tg?.problem, script: 'whole' });
        boxes.update({ ...INACTIVE, problem: s.ts?.problem });
      } else if (useBoxes) {
        groups.update({ ...INACTIVE, problem: s.tg.problem, script: 'whole' });
        boxes.update({ ...s.ts }, hint);
      } else {
        // Write it types with the answer pad: show it as Groups of Terms' Answer step.
        groups.update(s.stage === 'line' ? { ...s.tg, step: 'answer' } : s.tg, hint);
        boxes.update({ ...INACTIVE, problem: s.ts?.problem });
      }
    },
  };
}

// The Mat for each stage. The group gets the whole problem in its left column, so you can see what it's part of.
function renderMat(s, fx = {}) {
  // A subtracted group gets the magenta "subtract = add the opposite" once the student has chosen − groups.
  const opposite = hasSubtractedGroup(s.problem) ? addOppositeSegments(s.problem) : null;
  if (s.stage === 'tg') {
    const chosen = !['groups', 'sign'].includes(s.tg.step);
    return renderTermGroupMat({ ...termGroupViewState(s.tg), context: formatDistribute(s.problem), contextNote: chosen ? opposite : null, fx });
  }
  if (s.stage === 'line') {
    return renderLineMat({ problemText: formatDistribute(s.problem), groupText: groupAnswerText(groupProblem(s.problem)), typed: prettyAnswer(s.line), note: opposite });
  }
  return renderBoxMat({ ...boxViewState(s.ts), fx });
}

export const distributePlay = {
  steps: distributeSteps,
  phaseLabel,
  newSession: newDistributeSession,
  reduce: reduceDistribute,
  feedbackText: distributeFeedbackText,
  buildControls: buildDistributeControls,

  // The active sub-pack's effects (the hint, what just flipped or was added), tagged with where they came from.
  effects(before, s) {
    const same = before && before.stage === s.stage;
    if (s.stage === 'tg') {
      const fx = termGroupPlay.effects(same ? before.tg : null, s.tg);
      return { ...fx, hint: fx.hint && { ...fx.hint, src: 'tg' } };
    }
    if (s.stage === 'line') return { hint: distributeHintFor(s) };
    const fx = boxPlay.effects(same ? before.ts : null, s.ts);
    return { ...fx, hint: fx.hint && { ...fx.hint, src: 'ts' } };
  },
  renderMat,
  matAction: (d) => termGroupPlay.matAction(d) ?? boxPlay.matAction(d),
  // Box & Circle (in ② combine) is dragged: hand the pointer the Boxes & Circles session inside.
  bindMat: (root, dispatch, getSession) => bindBoxMat(root, dispatch, () => {
    const s = getSession();
    return s?.stage === 'ts' ? s.ts : { step: 'inactive', shapes: [], problem: s?.problem };
  }),
};
