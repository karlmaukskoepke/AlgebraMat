// The Distribute drill (?drill=distribute; SPEC-LIGHTS-EXPERIMENT-ADD-rev02.md B6): its pack (hidden: never on the home
// screen, in progress, in save codes or on the class sheet) and its play adapter, on the lights screen.

import { newDrill, reduceDrill, drillSummary, DRILL_PROBLEMS } from '../engine/distributeDrill.js';
import { lightsAnswerLive, combineOpen } from '../engine/addBothLights.js';
import { renderAddBothScreen } from '../view/addBothScreen.js';
import { lightsFeedbackText } from '../view/addBothLightsFeedback.js';
import { makeAddBothControls } from '../view/addBothControls.js';
import { bindLightsMat } from '../view/lightsPointer.js';
import { LIGHTS_LOG_KEY, logLights } from './addBothPlay.js';

export const distributeDrillPack = {
  id: 'distribute-drill',
  hidden: true,
  title: 'Distribute drill',
  subtitle: 'Grab the terms',
  levels: 1,
  levelNames: ['the two drill problems'],
  generate: () => DRILL_PROBLEMS.map((p) => ({ ...p })),
};

export const distributeDrillPlay = {
  noStreak: true,
  noSteps: true,
  noAuto: true,
  lineInMat: true,
  lightDesign: true,
  padOpen: (s) => s.stage !== 'done',
  steps: () => [],
  newSession: (problem) => newDrill(DRILL_PROBLEMS.find((p) => p.id === problem.id) ?? DRILL_PROBLEMS[0]),
  reduce: reduceDrill,
  feedbackText: lightsFeedbackText,
  // the pad types into x = [ ], a sum's blank and the products' blanks
  buildControls: makeAddBothControls((s) => lightsAnswerLive(s) || combineOpen(s) || Boolean(s.lx?.distribute)),
  bindMat: (root, dispatch, getSession) => bindLightsMat(root, dispatch, getSession),
  effects(before, s) {
    if (before && before.step !== 'done' && s.step === 'done') logLights(drillSummary(s));   // this device only, never the class sheet
    return { hint: null };
  },
  renderMat: (s) => renderAddBothScreen(s),
  matAction(d) {
    switch (d.action) {
      case 'focus': return { type: 'focus', target: d.target, index: d.index };
      case 'lxApply': return { type: 'lxApply' };
      case 'go': return { type: 'go' };
      case 'undo': case 'check': case 'next': case 'greyMove': case 'choose': return { type: d.action };
      default: return null;
    }
  },
};
export { LIGHTS_LOG_KEY };
