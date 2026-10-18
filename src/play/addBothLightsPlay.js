// The play adapter for the "Lights" experiment on Add to both sides (?ui=lights, Levels 2–3; SPEC-LIGHTS-EXPERIMENT-ADD.md).
// The card's own adapter (addBothPlay.js) with the wrapper reducer, the flagged screen, its pointer/keyboard layer, and the log.

import { formatAddBoth } from '../engine/addBoth.js';
import { reduceAddBoth } from '../engine/addBothMoves.js';
import { newLightsSession, withLights, lightsAnswerLive, lightsSummary, combineOpen } from '../engine/addBothLights.js';
import { renderLightsScreen } from '../view/lightsScreen.js';
import { lightsFeedbackText } from '../view/addBothLightsFeedback.js';
import { makeAddBothControls } from '../view/addBothControls.js';
import { bindLightsMat } from '../view/lightsPointer.js';
import { recordProblem } from '../lightStore.js';
import { addBothPlay } from './addBothPlay.js';

// The first test's log (§6): one line a problem, on this device only (never synced), newest 500 kept.
export const LIGHTS_LOG_KEY = 'mat.lights.v1';
function logLights(line) {
  try {
    const list = JSON.parse(localStorage.getItem(LIGHTS_LOG_KEY) ?? '[]');
    const next = [...(Array.isArray(list) ? list : []), line].slice(-500);
    localStorage.setItem(LIGHTS_LOG_KEY, JSON.stringify(next));
  } catch { /* storage blocked or full */ }
  console.info('[ui=lights]', JSON.stringify(line));
}

const reduce = withLights(reduceAddBoth);

export const addBothLightsPlay = {
  ...addBothPlay,
  // a correct first guess makes the next problem a move (round 2, A1: the card's own owesMove)
  newSession: (problem, opts = {}) => newLightsSession(problem, { level: problem.logLevel ?? 2, forceMove: Boolean(opts.forceMove) }),
  reduce,
  feedbackText: lightsFeedbackText,
  // the pad types into x = [ ], and into the blank of a sum being combined (B3)
  buildControls: makeAddBothControls((s) => lightsAnswerLive(s) || combineOpen(s)),
  bindMat: bindLightsMat,
  effects(before, s) {
    if (before && before.step !== 'done' && s.step === 'done') {
      const line = { ...lightsSummary(s), problem: formatAddBoth(s.problem) };
      recordProblem({ ...s, typedBeforeMove: s.lx.log.typedBeforeMove }, { pack: 'add-both', level: s.problem.logLevel ?? null, problem: formatAddBoth(s.problem) });
      logLights(line);
    }
    return { hint: null };
  },
  renderMat: (s) => renderLightsScreen(s),
  matAction(d) {
    if (d.action === 'lxNext') return { type: 'lxNext' };
    if (d.action === 'lxApply') return { type: 'lxApply' };
    return addBothPlay.matAction(d);
  },
};
