// The play adapter for Add to both sides (engine/addBothMoves.js): the moves, the board, and the answer pad.

import { newAddBoth, reduceAddBoth } from '../engine/addBothMoves.js';
import { formatAddBoth } from '../engine/addBoth.js';
import { renderAddBothMat } from '../view/addBothMat.js';
import { buildAddBothControls } from '../view/addBothControls.js';
import { bindAddBothMat } from '../view/addBothPointer.js';
import { addBothFeedbackText } from '../view/addBothFeedback.js';
import { recordProblem } from '../lightStore.js';
import { renderTutorialGame } from '../view/tutorialGame.js';
import { startTutorial, reduceTutorialSession } from './addBothTutorial.js';
import { tutorialsFor } from '../tutorialStore.js';

export const addBothPlay = {
  noStreak: true,       // no streaks on this card: the stuck count is what is kept (SPEC-ADD-TO-BOTH-SIDES.md §1)
  steps: (s) => [...(s?.tut ? [{ id: 'tutorial', label: 'Tutorial' }] : []), ...(s && s.level <= 2 ? [{ id: 'build', label: 'Build it' }] : []), { id: 'moves', label: 'Get x alone' }],
  // The first time a student meets a move, its tutorial plays; after that, only if they ask for it.
  newSession(problem) {
    const s = newAddBoth(problem, { level: problem.logLevel ?? 1 });
    return startTutorial(s, tutorialsFor(s.level));
  },
  reduce(s, action) {
    if (s.tut) return reduceTutorialSession(s, action);
    if (action.type === 'replayTutorial') return startTutorial(s, tutorialsFor(s.level, { all: true }), true);
    return reduceAddBoth(s, action);
  },
  feedbackText: addBothFeedbackText,
  buildControls: buildAddBothControls,
  bindMat: (root, dispatch, get) => bindAddBothMat(root, dispatch, () => { const s = get(); return s?.tut ? (s.tut.eng ?? { stage: 'tutorial' }) : s; }),
  effects(before, s) {
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'add-both', level: s.problem.logLevel ?? null, problem: formatAddBoth(s.problem) });
    }
    return { hint: null };
  },
  renderMat: (s) => (s.tut ? renderTutorialGame(s) : renderAddBothMat(s)),
  // A tap on a group, the x box (the early answer's drop) or a chip comes to the Mat's click handler as data-*.
  matAction(d) {
    switch (d.action) {
      case 'select': return { type: 'select', id: d.id };
      case 'cross': return { type: 'cross', id: d.id };
      case 'flipSign': return { type: 'flipSign', id: d.id };
      case 'dropValue': return { type: 'dropValue' };
      case 'choose': return { type: 'choose', move: d.move };
      case 'addTo': return { type: 'addTo', side: d.side };
      case 'go': return { type: 'go' };
      case 'kind': return { type: 'kind', value: d.value };
      case 'crossOff': return { type: 'crossOff' };
      case 'abandon': return { type: 'abandon' };
      case 'nextLine': return { type: 'nextLine' };
      case 'pickPiece': return { type: 'pickPiece', piece: d.piece };
      case 'zone': return { type: 'zone', side: d.side };
      case 'buildRemove': return { type: 'buildRemove', side: d.side, what: d.what };
      case 'quiz': return { type: 'quiz', value: d.value };
      case 'trade': return { type: 'trade' };
      case 'nextItem': return { type: 'nextItem' };
      case 'flipAll': return { type: 'flipAll' };
      case 'flipMode': return { type: 'flipMode' };
      case 'continue': return { type: 'continue' };
      case 'skipTutorial': return { type: 'skipTutorial' };
      case 'replayTutorial': return { type: 'replayTutorial' };
      case 'undo': return { type: 'undo' };
      case 'buildTap': return { type: 'buildTap', group: d.group, sign: d.sign, remove: Boolean(d.remove) };
      default: return null;
    }
  },
};
