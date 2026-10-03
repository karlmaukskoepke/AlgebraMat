// The play adapter for Boxes & Circles' "read the model" round (engine/boxModel.js): a picture of boxes and counters,
// and the student types the expression it shows. No walk.

import { newBoxModel, reduceBoxModel, columnLabels } from '../engine/boxModel.js';
import { piecesForExpression } from '../engine/termPieces.js';
import { formatExpression, prettyAnswer } from '../engine/terms.js';
import { renderBoxMat } from '../view/boxMat.js';
import { buildBoxModelControls } from '../view/boxModelControls.js';
import { boxModelFeedbackText } from '../view/boxModelFeedback.js';
import { speak } from '../view/speech.js';
import { recordProblem } from '../lightStore.js';
import { startIntro } from '../view/tour.js';

export const boxModelPlay = {
  steps: (s) => (s?.hint >= 2
    ? [{ id: 'say', label: 'Say it' }, { id: 'answer', label: 'Answer' }]
    : [{ id: 'answer', label: 'Write the expression' }]),
  newSession: newBoxModel,
  reduce: reduceBoxModel,
  feedbackText: boxModelFeedbackText,
  buildControls: buildBoxModelControls,
  effects(before, s) {
    if (!before && s.stage !== 'done') startIntro({ algebra: true });
    if (before && before.step !== 'done' && s.step === 'done') {
      recordProblem(s, { pack: 'boxes', level: s.problem.logLevel ?? null, problem: formatExpression(s.problem) });
    }
    // The labels are read aloud once they appear (once: the id changes each time).
    if (before && s.spoken && s.spoken.id !== before.spoken?.id) speak(s.spoken.text);
    return { hint: null };
  },
  // The picture only: the columns of pieces, with the expression left out until the labels are asked for.
  renderMat: (s, fx = {}) => renderBoxMat({
    expr: s.problem, shapes: [], selecting: null, rewritten: [], flipped: [], pieces: piecesForExpression(s.problem),
    key: true, tap: null, selected: null, hideText: true, columnLabels: s.said?.length ? columnLabels(s.problem).map((t, i) => (s.said.includes(i) ? t : null)) : null,
    columnFocus: s.stage === 'cloze' ? s.col : null,
    answer: { text: s.stage === 'done' ? s.finalText : prettyAnswer(s.entry), done: s.stage === 'done' }, fx,
  }),
  matAction: () => null,
};
