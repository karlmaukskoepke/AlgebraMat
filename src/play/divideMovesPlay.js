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
import { recordProblem } from '../lightStore.js';

export const divideMovesPlay = {
  noStreak: true,
  noSteps: true,
  noAuto: true,
  lineInMat: true,
  lightDesign: true,    // no pad on a keyboard, a pop-up keypad on touch, the header fades (Build D)
  padOpen: (s) => s.stage !== 'done' && !s.sub && solve.answerLive(s) && (s.typing === 'answer' || solve.alone(s)),
  owesMove,
  steps: () => [],
  newSession: (problem, { forceMove = false } = {}) => newDivide(problem, { level: problem.logLevel ?? 2, forceMove }),
  // an error waits for Undo, then a hint (Build C, Part 2); the openings' pop-ups round it (Build D, Part 1)
  reduce: withIntro(withSpotlight(reduceDivide, DIVIDE_SPOT), introOpen),
  feedbackText: divideFeedbackText,
  buildControls: buildDivideControls,
  effects(before, s) {
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'divide-it', level: s.problem.logLevel ?? null, problem: formatDivide(s.problem) });
    }
    return { hint: null };
  },
  renderMat: (s) => renderDivideScreen(s),
  bindMat: (root, dispatch) => {
    const off = [bindValueDrag(root, dispatch), bindForwardKey(root), bindHelpTimer(root)];
    return () => off.forEach((f) => f());
  },
  matAction(d) {
    switch (d.action) {
      case 'choose': return { type: 'choose', move: d.move };
      case 'greyMove': return { type: 'greyMove', move: d.move };
      case 'placeValue': return { type: 'placeValue' };
      case 'foldNext': return { type: 'foldNext' };
      case 'take': return { type: 'take', n: Number(d.n) };
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
