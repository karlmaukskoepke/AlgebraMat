// The play adapter for Add to both sides, "light build" (engine/addBothMoves.js, view/lightScreen.js).

import { newAddBoth, reduceAddBoth } from '../engine/addBothMoves.js';
import { formatAddBoth } from '../engine/addBoth.js';
import { renderLightScreen } from '../view/lightScreen.js';
import { buildAddBothControls } from '../view/addBothControls.js';
import { bindAddBothMat } from '../view/addBothPointer.js';
import { addBothFeedbackText } from '../view/addBothFeedback.js';
import { recordProblem } from '../lightStore.js';

export const addBothPlay = {
  noStreak: true,       // no streaks on this card: the stuck count is what is kept
  noSteps: true,        // no steps bar
  lineInMat: true,      // the line (every message) is on the Mat, above the equation
  steps: () => [],
  newSession: (problem) => newAddBoth(problem, { level: problem.logLevel ?? 2 }),
  reduce: reduceAddBoth,
  feedbackText: addBothFeedbackText,
  buildControls: buildAddBothControls,
  bindMat: bindAddBothMat,
  effects(before, s) {
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'add-both', level: s.problem.logLevel ?? null, problem: formatAddBoth(s.problem) });
    }
    return { hint: null };
  },
  renderMat: (s) => renderLightScreen(s),
  // A tap on a button, a group, the x (the guess's drop) or a chip comes to the Mat's click handler as data-*.
  matAction(d) {
    switch (d.action) {
      case 'choose': return { type: 'choose', move: d.move };
      case 'greyMove': return { type: 'greyMove' };
      case 'path': return { type: 'path', value: d.value };
      case 'putBack': return { type: 'putBack' };
      case 'nextLine': return { type: 'nextLine' };
      case 'matchGuess': return { type: 'matchGuess' };
      case 'dropValue': return { type: 'dropValue' };
      case 'go': return { type: 'go' };
      case 'undo': return { type: 'undo' };
      case 'addTo': return { type: 'addTo', side: d.side };
      case 'zone': return { type: 'zone', side: d.side };
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
