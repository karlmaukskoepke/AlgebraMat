// The play adapter for Add to both sides, every equation level (engine/addBothMoves.js under the layer in engine/addBothLights.js,
// view/addBothScreen.js): the light design (Build D, 2026-10-18), with the terms grabbed by pointer or keyboard. (It was lights round 2,
// behind ?ui=grab; Karl kept it, so the flag is gone.)

import { formatAddBoth } from '../engine/addBoth.js';
import { reduceAddBoth, xAlone } from '../engine/addBothMoves.js';
import { newLightsSession, withLights, lightsAnswerLive, lightsSummary, combineOpen, blankOpen, amountMode, ADD_SPOT } from '../engine/addBothLights.js';
import { withSpotlight } from '../engine/spotlight.js';
import { renderAddBothScreen, introOpen } from '../view/addBothScreen.js';
import { lightsFeedbackText } from '../view/addBothLightsFeedback.js';
import { makeAddBothControls } from '../view/addBothControls.js';
import { bindLightsMat } from '../view/lightsPointer.js';
import { recordProblem } from '../lightStore.js';
import { withIntro } from './withIntro.js';

// A log of how the moves are made: one line a problem, on this device only (never synced), newest 500 kept.
export const LIGHTS_LOG_KEY = 'mat.lights.v1';
export function logLights(line) {
  try {
    const list = JSON.parse(localStorage.getItem(LIGHTS_LOG_KEY) ?? '[]');
    const next = [...(Array.isArray(list) ? list : []), line].slice(-500);
    localStorage.setItem(LIGHTS_LOG_KEY, JSON.stringify(next));
  } catch { /* storage blocked or full */ }
}

// the card's layer round the engine, and the spotlight round both: an error waits for Undo, then a hint (Build C, Part 2); the
// openings' pop-ups round all of it (Build D, Part 1)
const reduce = withIntro(withSpotlight(withLights(reduceAddBoth), ADD_SPOT), introOpen);
let taught = null;      // what this level has already shown the student (the first Trade places is pointed out once)

export const addBothPlay = {
  noStreak: true,       // no streaks on this card: the stuck count is what is kept
  noSteps: true,        // no steps bar
  noAuto: true,         // nothing advances on a timer: every pause ends with a green Next
  lineInMat: true,      // the line is on the Mat (for screen readers: what the card says is a pop-up)
  lightDesign: true,    // no pad on a keyboard, a pop-up keypad on touch, the header fades (Build D)
  // the keypad pops up on touch only while a field is in use: the amount's blank, a sum's blank, x = once tapped or at the last step
  padOpen: (s) => s.stage !== 'done' && !s.sub && ((blankOpen(s) && amountMode(s)) || combineOpen(s) || Boolean(s.lx?.distribute) || s.combining?.step === 'count'
    || (lightsAnswerLive(s) && (s.typing === 'answer' || s.ui?.focus === 'answer' || xAlone(s.board)))),
  owesMove: (s) => s.stage === 'done' && s.sub?.kind === 'guess' && s.sub.ok,   // a correct guess makes the next problem a move
  steps: () => [],
  newSession: (problem, { forceMove = false, flags = null } = {}) => {
    taught = flags ?? taught ?? {};
    return newLightsSession(problem, { level: problem.logLevel ?? 2, forceMove, introTrade: !taught.trade });
  },
  reduce,
  feedbackText: lightsFeedbackText,
  // the pad types into x = [ ], into the amount's blank, and into the blank of a sum being combined
  buildControls: makeAddBothControls((s) => lightsAnswerLive(s) || combineOpen(s)),
  bindMat: (root, dispatch, getSession) => bindLightsMat(root, dispatch, getSession),
  effects(before, s) {
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'add-both', level: s.problem.logLevel ?? null, problem: formatAddBoth(s.problem) });
      logLights({ ...lightsSummary(s), problem: formatAddBoth(s.problem) });
    }
    if (s.tradeCount > 0 && taught) taught.trade = true;
    return { hint: null };
  },
  renderMat: (s) => renderAddBothScreen(s),
  // A tap on a button, a group or a chip comes to the Mat's click handler as data-*.
  matAction(d) {
    switch (d.action) {
      case 'choose': return { type: 'choose', move: d.move };
      case 'greyMove': return { type: 'greyMove' };
      case 'lxNext': return { type: 'lxNext' };
      case 'introNext': return { type: 'introNext' };
      case 'lxApply': return { type: 'lxApply' };
      case 'spotDismiss': return { type: 'spotDismiss' };
      case 'nextLine': return { type: 'nextLine' };
      case 'next': return { type: 'next' };
      case 'check': return { type: 'check' };
      case 'focus': return { type: 'focus', target: d.target };
      case 'stuck': return { type: 'stuck' };
      case 'teach': return { type: 'teach' };
      case 'startOver': return { type: 'startOver' };
      case 'go': return { type: 'go' };
      case 'undo': return { type: 'undo' };
      case 'addTo': return { type: 'addTo', side: d.side };
      // Count it's counters at x alone (Build C, Part 3): its Mat's taps and the tray's buttons go to the walk
      case 'zone': return d.zone !== undefined ? { type: 'cnt', act: { type: 'tapZone', zone: Number(d.zone) } } : { type: 'zone', side: d.side };
      case 'counter': return { type: 'cnt', act: { type: 'tapCounter', zone: Number(d.zone), index: Number(d.index) } };
      case 'cntPick': return { type: 'cnt', act: { type: 'pickSign', sign: d.sign } };
      case 'cntCheck': return { type: 'cnt', act: { type: 'check' } };
      case 'cntChoose': return { type: 'cnt', act: { type: 'choose', choice: d.value } };
      case 'pickPiece': return { type: 'pickPiece', piece: d.piece };
      case 'buildRemove': return { type: 'buildRemove', side: d.side, what: d.what };
      case 'buildTap': return { type: 'buildTap', group: d.group, sign: d.sign, remove: Boolean(d.remove) };
      case 'select': return { type: 'select', id: d.id };
      case 'kind': return { type: 'kind', value: d.value };
      case 'crossOff': return { type: 'crossOff' };
      case 'abandon': return { type: 'abandon' };
      default: return null;
    }
  },
};
