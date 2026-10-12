// The play adapter for Level 1 of Add to both sides: the numeric level (engine/numericLevel.js).

import { newNumeric, reduceNumeric } from '../engine/numericLevel.js';
import { renderNumericScreen } from '../view/numericScreen.js';
import { buildNumericControls } from '../view/numericControls.js';
import { numericFeedbackText } from '../view/numericFeedback.js';

export const addBothNumericPlay = {
  noStreak: true,
  noSteps: true,
  noAuto: true,
  lineInMat: true,
  steps: () => [],
  newSession: (problem) => newNumeric(problem),
  reduce: reduceNumeric,
  feedbackText: numericFeedbackText,
  buildControls: buildNumericControls,
  effects: () => ({ hint: null }),
  renderMat: (s) => renderNumericScreen(s),
  matAction(d) {
    switch (d.action) {
      case 'choose': return { type: 'choose', move: d.move };
      case 'greyMove': return { type: 'greyMove' };
      case 'addTo': return { type: 'addTo', side: d.side };
      case 'go': return { type: 'go' };
      case 'undo': return { type: 'undo' };
      case 'quiz': return { type: 'quiz', value: d.value };
      case 'quizNext': return { type: 'quizNext' };
      case 'next': return { type: 'next' };
      case 'wtNext': return { type: 'wtNext' };
      default: return null;
    }
  },
};
