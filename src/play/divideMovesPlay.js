// The play adapter for Divide it's equation levels (engine/divideMoves.js, view/divideScreen.js).

import { newDivide, reduceDivide, owesMove, DIVIDE_SPOT } from '../engine/divideMoves.js';
import { withSpotlight } from '../engine/spotlight.js';
import { formatDivide } from '../engine/divide.js';
import { renderDivideScreen } from '../view/divideScreen.js';
import { buildDivideControls } from '../view/divideControls.js';
import { divideFeedbackText } from '../view/divideFeedback.js';
import { bindValueDrag } from '../view/solveScreen.js';
import { recordProblem } from '../lightStore.js';

export const divideMovesPlay = {
  noStreak: true,
  noSteps: true,
  noAuto: true,
  lineInMat: true,
  owesMove,
  steps: () => [],
  newSession: (problem, { forceMove = false } = {}) => newDivide(problem, { level: problem.logLevel ?? 2, forceMove }),
  reduce: withSpotlight(reduceDivide, DIVIDE_SPOT),            // an error waits for Undo, then a hint (Build C, Part 2)
  feedbackText: divideFeedbackText,
  buildControls: buildDivideControls,
  effects(before, s) {
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'divide-it', level: s.problem.logLevel ?? null, problem: formatDivide(s.problem) });
    }
    return { hint: null };
  },
  renderMat: (s) => renderDivideScreen(s),
  bindMat: (root, dispatch) => bindValueDrag(root, dispatch),
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
      default: return null;
    }
  },
};
