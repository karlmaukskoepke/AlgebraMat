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
import { withFractionBlank, fracOpen, canPreview } from '../engine/divideBlank.js';
import { recordProblem } from '../lightStore.js';

// The fraction blank's keys and the move's preview: "/" goes to the bottom of the fraction; hovering the move (or coming near it)
// previews it on the equation.
function bindFractionKeys(root, dispatch, getSession) {
  const MOVE = '[data-move="fraction"]';
  const onKey = (e) => {
    if ((e.key === '/' || e.key === 'Divide') && getSession() && fracOpen(getSession())) { e.preventDefault(); e.stopImmediatePropagation(); dispatch({ type: 'fracSlash' }); }
  };
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const b = root.querySelector(`${MOVE}:not(:disabled)`);
    const s = getSession();
    if (!b || !s) return;
    const r = b.getBoundingClientRect();
    const d = Math.hypot(Math.max(r.left - e.clientX, 0, e.clientX - r.right), Math.max(r.top - e.clientY, 0, e.clientY - r.bottom));
    const want = d <= 40 && canPreview(s);
    if (want !== Boolean(s.ui?.preview)) dispatch({ type: 'ui', patch: { preview: want } });
  };
  window.addEventListener('keydown', onKey, true);
  document.addEventListener('pointermove', onMove);
  return () => { window.removeEventListener('keydown', onKey, true); document.removeEventListener('pointermove', onMove); };
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
