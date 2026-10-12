// The play adapter for Divide it's equation levels (engine/divideMoves.js, view/divideScreen.js).

import { newDivide, reduceDivide, owesMove } from '../engine/divideMoves.js';
import { formatDivide } from '../engine/divide.js';
import { renderDivideScreen, renderDivideTucked, divideTrayAvailable, divideCanOpenMoves } from '../view/divideScreen.js';
import { TUCKED, withTuckedUi, tuckedEffects, tuckedAction, bindTucked } from '../view/tuckedLayout.js';
import { buildDivideControls } from '../view/divideControls.js';
import { divideFeedbackText } from '../view/divideFeedback.js';
import { bindValueDrag } from '../view/solveScreen.js';
import { recordProblem } from '../lightStore.js';

// The tucked layout pilot (?layout=tucked): the same card and engine, placed by the shared tucked shell. Off, nothing changes.
const TUCK = { moveId: 'fraction', trayAvailable: divideTrayAvailable, canOpenMoves: divideCanOpenMoves };
const reduceTucked = withTuckedUi(reduceDivide, TUCK);

export const divideMovesPlay = {
  noStreak: true,
  noSteps: true,
  noAuto: true,
  lineInMat: true,
  owesMove,
  steps: () => [],
  newSession: (problem, { forceMove = false } = {}) => newDivide(problem, { level: problem.logLevel ?? 2, forceMove }),
  reduce: TUCKED ? reduceTucked : reduceDivide,
  feedbackText: divideFeedbackText,
  buildControls: buildDivideControls,
  effects(before, s) {
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'divide-it', level: s.problem.logLevel ?? null, problem: formatDivide(s.problem) });
    }
    return TUCKED ? { hint: null, tucked: tuckedEffects(before, s, TUCK) } : { hint: null };
  },
  renderMat: (s, fx) => (TUCKED ? renderDivideTucked(s, fx) : renderDivideScreen(s)),
  bindMat(root, dispatch) {
    const unDrag = bindValueDrag(root, dispatch);
    const unTuck = TUCKED ? bindTucked(root, dispatch) : null;
    return () => { unDrag(); unTuck?.(); };
  },
  matAction(d) {
    const tk = TUCKED ? tuckedAction(d) : null;
    if (tk) return tk;
    switch (d.action) {
      case 'choose': return { type: 'choose', move: d.move };
      case 'greyMove': return { type: 'greyMove', move: d.move };
      case 'placeValue': return { type: 'placeValue' };
      case 'foldNext': return { type: 'foldNext' };
      case 'path': return { type: 'path', value: d.value };
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
      default: return null;
    }
  },
};
