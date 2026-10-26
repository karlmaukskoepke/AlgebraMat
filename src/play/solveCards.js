// The Solve it cards' play adapters, as configuration of the shared one (./solvePlay.js; Build E). Each names its loop, its layers, its
// screen and its own buttons; everything else is shared. (Replaces addBothPlay.js and divideMovesPlay.js.)

import { makeSolvePlay } from './solvePlay.js';
import { logLights } from './lightsLog.js';
// Add to both sides: the loop card (engine/cards/add.js) under its term layer (engine/addBothLights.js), on its screen
import { formatAddBoth } from '../engine/addBoth.js';
import { solve as addLoop, reduceAddBoth } from '../engine/cards/add.js';
import { xAlone } from '../engine/addBothMoves.js';
import { newLightsSession, withLights, lightsAnswerLive, lightsSummary, combineOpen, calcOpen, blankOpen, amountMode, seesawAdd, ADD_SPOT } from '../engine/addBothLights.js';
import { renderAddBothScreen, introOpen as addIntroOpen } from '../view/addBothScreen.js';
import { lightsFeedbackText } from '../view/addBothLightsFeedback.js';
import { makeAddBothControls } from '../view/addBothControls.js';
import { bindLightsMat } from '../view/lightsPointer.js';
// Divide it: the loop card (engine/divideMoves.js) under its fraction blank (engine/divideBlank.js), on its screen
import { newDivide, reduceDivide, DIVIDE_SPOT, solve as divideLoop } from '../engine/divideMoves.js';
import { formatDivide } from '../engine/divide.js';
import { withFractionBlank, typingOpen } from '../engine/divideBlank.js';
import { renderDivideScreen, introOpen as divideIntroOpen } from '../view/divideScreen.js';
import { divideFeedbackText } from '../view/divideFeedback.js';
import { bindValueDrag, bindForwardKey } from '../view/solveScreen.js';
import { bindHelpTimer } from '../view/helpTimer.js';
import { bindFractionKeys } from '../view/fractionKeys.js';
import { bindTypingKeys } from '../view/typingKeys.js';
// Flip everything: the loop card (engine/cards/flip.js) under the shared Multiply menu (engine/multiplyMenu.js), on its screen
import { newFlip, reduceFlip, solve as flipLoop, FLIP_SPOT, FLIP_MENU } from '../engine/cards/flip.js';
import { formatFlip } from '../engine/flip.js';
import { renderFlipScreen, introOpen as flipIntroOpen } from '../view/flipScreen.js';
import { flipFeedbackText } from '../view/flipFeedback.js';
import { buildSolvePad } from '../view/divideControls.js';
// Two-step equations: the loop card (engine/cards/twoStep.js) under the shared Multiply menu and Add's term layer, on Add's screen
import { newTwoStep, solve as twoLoop, xAlone as twoAlone, TWO_STEP_MENU, TWO_STEP_SPOT, TWO_STEP_LAYER } from '../engine/cards/twoStep.js';
import { formatTwoStep } from '../engine/twoStep.js';
import { startLights } from '../engine/addBothLights.js';
import { renderTwoStepScreen, introOpen as twoIntroOpen } from '../view/twoStepScreen.js';
import { twoStepFeedbackText } from '../view/twoStepFeedback.js';
// Distribute, combine, solve: the loop card (engine/cards/distribute.js) under the Multiply menu and Add's term layer with the distribute move
import { newDistSolve, solve as distLoop, xAlone as distAlone, DIST_MENU, DIST_SPOT, DIST_LAYER } from '../engine/cards/distribute.js';
import { formatDistSolve } from '../engine/distSolve.js';
import { renderDistSolveScreen, introOpen as distIntroOpen } from '../view/distSolveScreen.js';
import { distSolveFeedbackText } from '../view/distSolveFeedback.js';
import { bindFactorHint } from '../view/factorHint.js';
import { bindBlankKeys } from '../view/blankKeys.js';
// Variables on both sides (Build R): the loop card under the Multiply menu and Add's term layer (x-terms across the =, the distribute move)
import { newBothSides, solve as bothLoop, xAlone as bothAlone, BOTH_MENU, BOTH_SPOT, BOTH_LAYER } from '../engine/cards/bothSides.js';
import { formatBoth } from '../engine/bothSides.js';
import { renderBothSidesScreen, introOpen as bothIntroOpen } from '../view/bothSidesScreen.js';
import { bothSidesFeedbackText } from '../view/bothSidesFeedback.js';
import { bindCrossHint } from '../view/crossHint.js';

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
  padOpen: (s) => s.stage !== 'done' && !s.sub && (((blankOpen(s) || seesawAdd(s)) && amountMode(s)) || combineOpen(s) || Boolean(s.lx?.distribute)
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
      case 'cntBox': return { type: 'cnt', act: { type: 'tapBox', zone: Number(d.box) } };
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
      case 'whoWon': return { type: 'whoWon', value: d.value };
      case 'crossNext': return { type: 'crossNext' };
      case 'abandon': return { type: 'abandon' };
      default: return null;
    }
  },
});

// ---------- Divide it ----------

export const divideMovesPlay = makeSolvePlay({
  pack: 'divide-it',
  grab: false,                     // (no terms to pick up: the honest path uses the moves)
  loop: divideLoop,
  layer: withFractionBlank(reduceDivide),
  spot: DIVIDE_SPOT,
  introOpen: divideIntroOpen,
  format: formatDivide,
  newSession: (problem, { forceMove = false } = {}) => newDivide(problem, { level: problem.logLevel ?? 2, forceMove }),
  feedbackText: divideFeedbackText,
  // the keypad types into x = and into the Multiply menu's blanks (Build N: the blanks too, whether or not x = is live)
  buildControls: (root, dispatch) => buildSolvePad(root, dispatch, (s) => divideLoop.answerLive(s) || typingOpen(s)),
  renderMat: (s) => renderDivideScreen(s),
  bindMat: (root, dispatch, getSession) => {
    const off = [bindTypingKeys(root, dispatch, getSession), bindValueDrag(root, dispatch), bindForwardKey(root), bindHelpTimer(root), bindFractionKeys(root, dispatch, getSession), bindBlankKeys(root, dispatch)];
    return () => off.forEach((f) => f());
  },
  padOpen: (s) => s.stage !== 'done' && !s.sub && (typingOpen(s) || (divideLoop.answerLive(s) && (s.typing === 'answer' || divideLoop.alone(s)))),
  matAction(d) {
    switch (d.action) {
      case 'multOpen': return { type: 'multOpen' };
      case 'divPick': return { type: 'divPick' };
      case 'multPick': return { type: 'multPick', kind: d.kind };
      case 'take': return { type: 'take', n: Number(d.n), ...(d.from === 'list' ? { fromList: true } : {}) };
      case 'deal': return { type: 'deal', group: Number(d.group) };
      case 'dealRound': return { type: 'dealRound' };
      case 'keep': return { type: 'keep', group: Number(d.group) };
      default: return null;
    }
  },
});

// ---------- Flip everything ----------

let flipTaught = null;  // the first Trade places of a level is pointed out once

export const flipPlay = makeSolvePlay({
  pack: 'flip-everything',
  grab: false,                     // (no terms to pick up: the honest path uses the moves)
  loop: flipLoop,
  layer: FLIP_MENU.withMenu(reduceFlip),
  spot: FLIP_SPOT,
  introOpen: flipIntroOpen,
  format: formatFlip,
  newSession: (problem, { forceMove = false, flags = null } = {}) => {
    flipTaught = flags ?? flipTaught ?? {};
    return { ...newFlip(problem, { level: problem.logLevel ?? 2, forceMove, introTrade: !flipTaught.trade, introFlip: !flipTaught.flip }), divNegIntro: !flipTaught.divneg };
  },
  feedbackText: flipFeedbackText,
  buildControls: (root, dispatch) => buildSolvePad(root, dispatch, (s) => flipLoop.answerLive(s) || FLIP_MENU.typingOpen(s)),
  renderMat: (s) => renderFlipScreen(s),
  bindMat: (root, dispatch, getSession) => {
    const off = [bindTypingKeys(root, dispatch, getSession), bindValueDrag(root, dispatch), bindForwardKey(root), bindHelpTimer(root), bindFractionKeys(root, dispatch, getSession, FLIP_MENU), bindBlankKeys(root, dispatch)];
    return () => off.forEach((f) => f());
  },
  padOpen: (s) => s.stage !== 'done' && !s.sub && (FLIP_MENU.typingOpen(s) || (flipLoop.answerLive(s) && (s.typing === 'answer' || flipLoop.alone(s)))),
  effects(before, s) {
    if (s.tradeCount > 0 && flipTaught) flipTaught.trade = true;
    if (s.flipCount > 0 && flipTaught) flipTaught.flip = true;
    if (s.divNegCount > 0 && flipTaught) flipTaught.divneg = true;          // (dividing by a negative is pointed out once a level too: Build P)
  },
  matAction(d) {
    switch (d.action) {
      case 'multOpen': return { type: 'multOpen' };
      case 'divPick': return { type: 'divPick' };
      case 'multPick': return { type: 'multPick', kind: d.kind };
      case 'flipPick': return { type: 'flipPick' };
      case 'take': return { type: 'take', n: Number(d.n), ...(d.from === 'list' ? { fromList: true } : {}) };
      default: return null;
    }
  },
});

// ---------- Two-step equations ----------

let twoTaught = null;   // the first Trade places and the first flip of a level are pointed out once

// Add to both sides' Mat buttons that a move-only card uses too (no seesaw, no counters): Apply, dragging a number into the blank
const ADD_MAT = new Set(['lxApply']);
// A product clicked to be worked out (Build P, Part 2)
const calcAction = (d) => (d.action === 'lxCalc' ? { type: 'lxCalc', id: d.id } : null);

export const twoStepPlay = makeSolvePlay({
  pack: 'two-step-equations',
  loop: twoLoop,
  layer: TWO_STEP_LAYER,
  spot: TWO_STEP_SPOT,
  introOpen: twoIntroOpen,
  format: formatTwoStep,
  newSession: (problem, { forceMove = false, flags = null } = {}) => {
    twoTaught = flags ?? twoTaught ?? {};
    return { ...startLights(newTwoStep(problem, { level: problem.logLevel ?? 1, forceMove, introTrade: !twoTaught.trade, introFlip: !twoTaught.flip })), divNegIntro: !twoTaught.divneg };
  },
  feedbackText: twoStepFeedbackText,
  buildControls: makeAddBothControls((s) => lightsAnswerLive(s, twoLoop) || combineOpen(s) || TWO_STEP_MENU.typingOpen(s)),
  bindMat: (root, dispatch, getSession) => {
    const off = [bindLightsMat(root, dispatch, getSession), bindFractionKeys(root, dispatch, getSession, TWO_STEP_MENU)];
    return () => off.forEach((f) => f?.());
  },
  renderMat: (s) => renderTwoStepScreen(s),
  padOpen: (s) => s.stage !== 'done' && !s.sub && (((blankOpen(s) || seesawAdd(s)) && amountMode(s)) || combineOpen(s) || TWO_STEP_MENU.typingOpen(s)
    || (lightsAnswerLive(s, twoLoop) && (s.typing === 'answer' || s.ui?.focus === 'answer' || twoAlone(s.board)))),
  effects(before, s) {
    if (s.tradeCount > 0 && twoTaught) twoTaught.trade = true;
    if (s.flipCount > 0 && twoTaught) twoTaught.flip = true;
    if (s.divNegCount > 0 && twoTaught) twoTaught.divneg = true;
  },
  matAction(d) {
    if (ADD_MAT.has(d.action)) return { type: d.action };
    switch (d.action) {
      case 'multOpen': return { type: 'multOpen' };
      case 'divPick': return { type: 'divPick' };
      case 'multPick': return { type: 'multPick', kind: d.kind };
      case 'flipPick': return { type: 'flipPick' };
      case 'take': return { type: 'take', n: Number(d.n), ...(d.from === 'list' ? { fromList: true } : {}) };
      default: return null;
    }
  },
});

// ---------- Distribute, combine, solve (Build M) ----------

// The distribute move's blanks and a sum of two x-terms take the x key too (on touch, the pad shows it).
const xKey = (s) => Boolean(s.lx?.combine) && [...s.board.left, ...s.board.right].find((t) => t.id === s.lx.combine.a)?.kind === 'x';

let distTaught = null;  // dividing by a negative is pointed out once a level (Build P)

export const distSolvePlay = makeSolvePlay({
  pack: 'distribute-solve',
  loop: distLoop,
  layer: DIST_LAYER,
  spot: DIST_SPOT,
  introOpen: distIntroOpen,
  format: formatDistSolve,
  newSession: (problem, { forceMove = false, flags = null } = {}) => {
    distTaught = flags ?? distTaught ?? {};
    return { ...startLights(newDistSolve(problem, { level: problem.logLevel ?? 1, forceMove })), divNegIntro: !distTaught.divneg };
  },
  effects(before, s) {
    if (s.divNegCount > 0 && distTaught) distTaught.divneg = true;         // (dividing by a negative is pointed out once a level: Build P)
  },
  feedbackText: distSolveFeedbackText,
  buildControls: makeAddBothControls((s) => lightsAnswerLive(s, distLoop) || combineOpen(s) || calcOpen(s) || Boolean(s.lx?.distribute) || DIST_MENU.typingOpen(s), xKey),
  bindMat: (root, dispatch, getSession) => {
    const off = [bindLightsMat(root, dispatch, getSession), bindFractionKeys(root, dispatch, getSession, DIST_MENU), bindFactorHint(root)];
    return () => off.forEach((f) => f?.());
  },
  renderMat: (s) => renderDistSolveScreen(s),
  padOpen: (s) => s.stage !== 'done' && !s.sub && (((blankOpen(s) || seesawAdd(s)) && amountMode(s)) || combineOpen(s) || calcOpen(s) || Boolean(s.lx?.distribute) || DIST_MENU.typingOpen(s)
    || (lightsAnswerLive(s, distLoop) && (s.typing === 'answer' || s.ui?.focus === 'answer' || distAlone(s.board)))),
  matAction(d) {
    if (ADD_MAT.has(d.action)) return { type: d.action };
    if (calcAction(d)) return calcAction(d);
    switch (d.action) {
      case 'multOpen': return { type: 'multOpen' };
      case 'divPick': return { type: 'divPick' };
      case 'multPick': return { type: 'multPick', kind: d.kind };
      case 'flipPick': return { type: 'flipPick' };
      case 'take': return { type: 'take', n: Number(d.n), ...(d.from === 'list' ? { fromList: true } : {}) };
      case 'focus': return d.target === 'dist' ? { type: 'focus', target: 'dist', index: Number(d.index) } : null;
      default: return null;
    }
  },
});

// ---------- Variables on both sides (Build R), and Distribute more (Build U) on the same card ----------
// Distribute more is Variables on both sides' card with its own problems (a fuller parenthesis: the invisible −1, a fraction factor) and
// its own pack: the loop, the layers, the screen and the help are the same.

const bothPlay = (pack) => {
  let bothTaught = null;  // dividing by a negative is pointed out once a level (Build P)

  return makeSolvePlay({
    pack,
    loop: bothLoop,
    layer: BOTH_LAYER,
    spot: BOTH_SPOT,
    introOpen: bothIntroOpen,
    format: formatBoth,
    newSession: (problem, { flags = null } = {}) => {
      bothTaught = flags ?? bothTaught ?? {};
      return { ...startLights(newBothSides(problem, { level: problem.logLevel ?? 1 })), divNegIntro: !bothTaught.divneg };
    },
    effects(before, s) {
      if (s.divNegCount > 0 && bothTaught) bothTaught.divneg = true;
    },
    feedbackText: bothSidesFeedbackText,
    buildControls: makeAddBothControls((s) => lightsAnswerLive(s, bothLoop) || combineOpen(s) || calcOpen(s) || Boolean(s.lx?.distribute) || BOTH_MENU.typingOpen(s), xKey),
    bindMat: (root, dispatch, getSession) => {
      const off = [bindLightsMat(root, dispatch, getSession), bindFractionKeys(root, dispatch, getSession, BOTH_MENU), bindFactorHint(root), bindCrossHint(root)];
      return () => off.forEach((f) => f?.());
    },
    renderMat: (s) => renderBothSidesScreen(s),
    padOpen: (s) => s.stage !== 'done' && !s.sub && (((blankOpen(s) || seesawAdd(s)) && amountMode(s)) || combineOpen(s) || calcOpen(s) || Boolean(s.lx?.distribute) || BOTH_MENU.typingOpen(s)
      || (lightsAnswerLive(s, bothLoop) && (s.typing === 'answer' || s.ui?.focus === 'answer' || bothAlone(s.board)))),
    matAction(d) {
      if (ADD_MAT.has(d.action)) return { type: d.action };
      if (calcAction(d)) return calcAction(d);
      switch (d.action) {
        case 'addPick': return { type: 'addPick', kind: d.kind };
        case 'multOpen': return { type: 'multOpen' };
        case 'divPick': return { type: 'divPick' };
        case 'multPick': return { type: 'multPick', kind: d.kind };
        case 'flipPick': return { type: 'flipPick' };
        case 'take': return { type: 'take', n: Number(d.n), ...(d.from === 'list' ? { fromList: true } : {}) };
        case 'focus': return d.target === 'dist' ? { type: 'focus', target: 'dist', index: Number(d.index) } : null;
        default: return null;
      }
    },
  });
};
export const bothSidesPlay = bothPlay('variables-both-sides');
export const distMorePlay = bothPlay('distribute-more');
