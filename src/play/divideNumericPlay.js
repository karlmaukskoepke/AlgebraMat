// The play adapter for Level 1 of Divide it: the numeric level (engine/divideNumeric.js).

import { newDivideNumeric, reduceDivideNumeric } from '../engine/divideNumeric.js';
import { renderDivideNumericScreen } from '../view/divideNumericScreen.js';
import { buildNumericControls } from '../view/numericControls.js';
import { divideNumericFeedbackText } from '../view/divideNumericFeedback.js';

export const divideNumericPlay = {
  noStreak: true,
  noSteps: true,
  noAuto: true,
  lineInMat: true,
  steps: () => [],
  newSession: (problem) => newDivideNumeric(problem),
  reduce: reduceDivideNumeric,
  feedbackText: divideNumericFeedbackText,
  buildControls: buildNumericControls,
  effects: () => ({ hint: null }),
  renderMat: (s) => renderDivideNumericScreen(s),
  matAction(d) {
    switch (d.action) {
      case 'choose': return { type: 'choose', move: d.move };
      case 'greyMove': return { type: 'greyMove' };
      case 'takeSide': return { type: 'takeSide', side: d.side };
      case 'go': return { type: 'go' };
      case 'undo': return { type: 'undo' };
      case 'quiz': return { type: 'quiz', value: d.value };
      case 'quizNext': return { type: 'quizNext' };
      case 'wtNext': return { type: 'wtNext' };
      case 'next': return { type: 'next' };
      default: return null;
    }
  },
};
