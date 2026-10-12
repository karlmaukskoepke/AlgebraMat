// The play adapter for Add to both sides, "light build" (engine/addBothMoves.js, view/lightScreen.js).

import { newAddBoth, reduceAddBoth, owesMove } from '../engine/addBothMoves.js';
import { formatAddBoth } from '../engine/addBoth.js';
import { renderLightScreen } from '../view/lightScreen.js';
import { buildAddBothControls } from '../view/addBothControls.js';
import { bindAddBothMat } from '../view/addBothPointer.js';
import { addBothFeedbackText } from '../view/addBothFeedback.js';
import { recordProblem } from '../lightStore.js';

let taught = null;      // what this level has already shown the student (the first Trade places is pointed out once)

export const addBothPlay = {
  noStreak: true,       // no streaks on this card: the stuck count is what is kept
  noSteps: true,        // no steps bar
  noAuto: true,         // nothing advances on a timer: every pause ends with a green Next
  owesMove,             // a correct guess makes the next problem a move (and adds one if it was the last)
  lineInMat: true,      // the line (every message) is on the Mat, above the equation
  steps: () => [],
  newSession: (problem, { forceMove = false, flags = null } = {}) => {
    taught = flags ?? taught ?? {};
    return newAddBoth(problem, { level: problem.logLevel ?? 2, forceMove, introTrade: !taught.trade });
  },
  reduce: reduceAddBoth,
  feedbackText: addBothFeedbackText,
  buildControls: buildAddBothControls,
  bindMat: bindAddBothMat,
  effects(before, s) {
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'add-both', level: s.problem.logLevel ?? null, problem: formatAddBoth(s.problem) });
    }
    if (s.tradeCount > 0 && taught) taught.trade = true;
    return { hint: null };
  },
  renderMat: (s) => renderLightScreen(s),
  // A tap on a button, a group, the x (the guess's drop) or a chip comes to the Mat's click handler as data-*.
  matAction(d) {
    switch (d.action) {
      case 'choose': return { type: 'choose', move: d.move };
      case 'greyMove': return { type: 'greyMove' };
      case 'path': return { type: 'path', value: d.value };
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
