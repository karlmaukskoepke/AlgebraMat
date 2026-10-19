// The Solve it cards' play adapters, as configuration of the shared one (./solvePlay.js; Build E). Each names its loop, its layers, its
// screen and its own buttons; everything else is shared. (Replaces addBothPlay.js and divideMovesPlay.js.)

import { makeSolvePlay } from './solvePlay.js';
import { logLights } from './lightsLog.js';
// Add to both sides: the loop card (engine/cards/add.js) under its term layer (engine/addBothLights.js), on its screen
import { formatAddBoth } from '../engine/addBoth.js';
import { solve as addLoop, reduceAddBoth } from '../engine/cards/add.js';
import { xAlone } from '../engine/addBothMoves.js';
import { newLightsSession, withLights, lightsAnswerLive, lightsSummary, combineOpen, blankOpen, amountMode, ADD_SPOT } from '../engine/addBothLights.js';
import { renderAddBothScreen, introOpen as addIntroOpen } from '../view/addBothScreen.js';
import { lightsFeedbackText } from '../view/addBothLightsFeedback.js';
import { makeAddBothControls } from '../view/addBothControls.js';
import { bindLightsMat } from '../view/lightsPointer.js';
// Divide it: the loop card (engine/divideMoves.js) under its fraction blank (engine/divideBlank.js), on its screen
import { newDivide, reduceDivide, DIVIDE_SPOT, solve as divideLoop } from '../engine/divideMoves.js';
import { formatDivide } from '../engine/divide.js';
import { withFractionBlank, fracOpen } from '../engine/divideBlank.js';
import { renderDivideScreen, introOpen as divideIntroOpen } from '../view/divideScreen.js';
import { buildDivideControls } from '../view/divideControls.js';
import { divideFeedbackText } from '../view/divideFeedback.js';
import { bindValueDrag, bindForwardKey } from '../view/solveScreen.js';
import { bindHelpTimer } from '../view/helpTimer.js';
import { bindFractionKeys } from '../view/fractionKeys.js';

// ---------- Add to both sides ----------

let taught = null;      // what this level has already shown the student (the first Trade places is pointed out once)

export const addBothPlay = makeSolvePlay({
  pack: 'add-both',
  loop: addLoop,
  layer: withLights(reduceAddBoth),
  spot: ADD_SPOT,
  introOpen: addIntroOpen,
  format: formatAddBoth,
  newSession: (problem, { forceMove = false, flags = null } = {}) => {
    taught = flags ?? taught ?? {};
    return newLightsSession(problem, { level: problem.logLevel ?? 2, forceMove, introTrade: !taught.trade });
  },
  feedbackText: lightsFeedbackText,
  // the pad types into x = [ ], into the amount's blank, and into the blank of a sum being combined
  buildControls: makeAddBothControls((s) => lightsAnswerLive(s) || combineOpen(s)),
  bindMat: (root, dispatch, getSession) => bindLightsMat(root, dispatch, getSession),
  renderMat: (s) => renderAddBothScreen(s),
  // the keypad pops up on touch only while a field is in use: the amount's blank, a sum's blank, x = once tapped or at the last step
  padOpen: (s) => s.stage !== 'done' && !s.sub && ((blankOpen(s) && amountMode(s)) || combineOpen(s) || Boolean(s.lx?.distribute)
    || (lightsAnswerLive(s) && (s.typing === 'answer' || s.ui?.focus === 'answer' || xAlone(s.board)))),
  effects(before, s) {
    if (before && before.step !== 'done' && s.step === 'done') logLights({ ...lightsSummary(s), problem: formatAddBoth(s.problem) });
    if (s.tradeCount > 0 && taught) taught.trade = true;
  },
  matAction(d) {
    switch (d.action) {
      case 'lxApply': return { type: 'lxApply' };
      case 'addTo': return { type: 'addTo', side: d.side };
      // Count it's counters at x alone (Build C, Part 3): its Mat's taps and the tray's buttons go to the walk
      case 'zone': return /^\d+$/.test(d.zone ?? '') ? { type: 'cnt', act: { type: 'tapZone', zone: Number(d.zone) } } : { type: 'zone', side: d.side };   // (the seesaw's sides are named, the counters' zones numbered)
      case 'counter': return { type: 'cnt', act: { type: 'tapCounter', zone: Number(d.zone), index: Number(d.index) } };
      case 'cntPick': return { type: 'cnt', act: { type: 'pickSign', sign: d.sign } };
      case 'cntCheck': return { type: 'cnt', act: { type: 'check' } };
      case 'cntChoose': return { type: 'cnt', act: { type: 'choose', choice: d.value } };
      case 'bigOp': return { type: 'cnt', act: { type: 'chooseOp', op: d.value } };
      case 'bigSign': return { type: 'cnt', act: { type: 'chooseSign', sign: d.value } };
      case 'pickPiece': return { type: 'pickPiece', piece: d.piece };
      case 'buildRemove': return { type: 'buildRemove', side: d.side, what: d.what };
      case 'buildTap': return { type: 'buildTap', group: d.group, sign: d.sign, remove: Boolean(d.remove) };
      case 'select': return { type: 'select', id: d.id };
      case 'kind': return { type: 'kind', value: d.value };
      case 'crossNext': return { type: 'crossNext' };
      case 'abandon': return { type: 'abandon' };
      default: return null;
    }
  },
});

// ---------- Divide it ----------

export const divideMovesPlay = makeSolvePlay({
  pack: 'divide-it',
  loop: divideLoop,
  layer: withFractionBlank(reduceDivide),
  spot: DIVIDE_SPOT,
  introOpen: divideIntroOpen,
  format: formatDivide,
  newSession: (problem, { forceMove = false } = {}) => newDivide(problem, { level: problem.logLevel ?? 2, forceMove }),
  feedbackText: divideFeedbackText,
  buildControls: buildDivideControls,
  renderMat: (s) => renderDivideScreen(s),
  bindMat: (root, dispatch, getSession) => {
    const off = [bindValueDrag(root, dispatch), bindForwardKey(root), bindHelpTimer(root), bindFractionKeys(root, dispatch, getSession)];
    return () => off.forEach((f) => f());
  },
  padOpen: (s) => s.stage !== 'done' && !s.sub && (fracOpen(s) || (divideLoop.answerLive(s) && (s.typing === 'answer' || divideLoop.alone(s)))),
  matAction(d) {
    switch (d.action) {
      case 'multOpen': return { type: 'multOpen' };
      case 'multPick': return { type: 'multPick', kind: d.kind };
      case 'take': return { type: 'take', n: Number(d.n), ...(d.from === 'list' ? { fromList: true } : {}) };
      case 'deal': return { type: 'deal', group: Number(d.group) };
      case 'dealRound': return { type: 'dealRound' };
      case 'keep': return { type: 'keep', group: Number(d.group) };
      default: return null;
    }
  },
});
