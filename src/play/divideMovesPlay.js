// The play adapter for Divide it's equation levels (engine/divideMoves.js, view/divideScreen.js).

import { newDivide, reduceDivide, owesMove, DIVIDE_SPOT, solve } from '../engine/divideMoves.js';
import { withSpotlight } from '../engine/spotlight.js';
import { formatDivide } from '../engine/divide.js';
import { renderDivideScreen, introOpen } from '../view/divideScreen.js';
import { buildDivideControls } from '../view/divideControls.js';
import { divideFeedbackText } from '../view/divideFeedback.js';
import { bindValueDrag, bindForwardKey } from '../view/solveScreen.js';
import { bindHelpTimer } from '../view/helpTimer.js';
import { withIntro } from './withIntro.js';
import { withFractionBlank, fracOpen, fracOf } from '../engine/divideBlank.js';
import { bindMultiplyHover } from '../view/multiplyOptions.js';
import { recordProblem } from '../lightStore.js';

// The fraction blank's keys and the move's preview: "/" goes to the bottom of the fraction; hovering the move (or coming near it)
// previews it on the equation.
// The fraction blank's keys; the Multiply options' hover previews (Build D-2, Part 4); and, when the blank has sat open a while with no
// unit fraction in it, the pop-up "Enter a unit fraction, like ⅕ or ½." (once each time the blank opens).
const STUCK_AFTER = 7000;
function bindFractionKeys(root, dispatch, getSession) {
  const onKey = (e) => {
    idle = Date.now();
    if ((e.key === '/' || e.key === 'Divide') && getSession() && fracOpen(getSession())) { e.preventDefault(); e.stopImmediatePropagation(); dispatch({ type: 'fracSlash' }); }
  };
  let idle = Date.now();
  let wasOpen = false;
  let told = false;
  const onPress = () => { idle = Date.now(); };
  const tick = () => {
    const s = getSession();
    const open = Boolean(s) && fracOpen(s) && root.isConnected;
    if (open && !wasOpen) { idle = Date.now(); told = false; }
    wasOpen = open;
    if (!open || told || fracOf(s.fb) || Date.now() - idle < STUCK_AFTER) return;
    told = true;
    dispatch({ type: 'fracStuck' });
  };
  const timer = setInterval(tick, 500);
  window.addEventListener('keydown', onKey, true);
  document.addEventListener('pointerdown', onPress, true);
  const offHover = bindMultiplyHover(root, dispatch, getSession);
  return () => { clearInterval(timer); window.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', onPress, true); offHover(); };
}

export const divideMovesPlay = {
  noStreak: true,
  noSteps: true,
  noAuto: true,
  lineInMat: true,
  lightDesign: true,    // no pad on a keyboard, a pop-up keypad on touch, the header fades (Build D)
  padOpen: (s) => s.stage !== 'done' && !s.sub && (fracOpen(s) || (solve.answerLive(s) && (s.typing === 'answer' || solve.alone(s)))),
  owesMove,
  steps: () => [],
  newSession: (problem, { forceMove = false } = {}) => newDivide(problem, { level: problem.logLevel ?? 2, forceMove }),
  // an error waits for Undo, then a hint (Build C, Part 2); the openings' pop-ups round it (Build D, Part 1)
  reduce: withIntro(withSpotlight(withFractionBlank(reduceDivide), DIVIDE_SPOT), introOpen),
  feedbackText: divideFeedbackText,
  buildControls: buildDivideControls,
  effects(before, s) {
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'divide-it', level: s.problem.logLevel ?? null, problem: formatDivide(s.problem) });
    }
    return { hint: null };
  },
  renderMat: (s) => renderDivideScreen(s),
  bindMat: (root, dispatch, getSession) => {
    const off = [bindValueDrag(root, dispatch), bindForwardKey(root), bindHelpTimer(root), bindFractionKeys(root, dispatch, getSession)];
    return () => off.forEach((f) => f());
  },
  matAction(d) {
    switch (d.action) {
      case 'choose': return { type: 'choose', move: d.move };
      case 'multOpen': return { type: 'multOpen' };
      case 'multPick': return { type: 'multPick', kind: d.kind };
      case 'greyMove': return { type: 'greyMove', move: d.move };
      case 'placeValue': return { type: 'placeValue' };
      case 'foldNext': return { type: 'foldNext' };
      case 'take': return { type: 'take', n: Number(d.n), ...(d.from === 'list' ? { fromList: true } : {}) };
      case 'go': return { type: 'go' };
      case 'deal': return { type: 'deal', group: Number(d.group) };
      case 'dealRound': return { type: 'dealRound' };
      case 'keep': return { type: 'keep', group: Number(d.group) };
      case 'nextLine': return { type: 'nextLine' };
      case 'next': return { type: 'next' };
      case 'check': return { type: 'check' };
      case 'focus': return { type: 'focus', target: d.target };
      case 'stuck': return { type: 'stuck' };
      case 'teach': return { type: 'teach' };
      case 'startOver': return { type: 'startOver' };
      case 'undo': return { type: 'undo' };
      case 'spotDismiss': return { type: 'spotDismiss' };
      case 'introNext': return { type: 'introNext' };
      default: return null;
    }
  },
};
