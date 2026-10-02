// Rounds 4 and 5's play adapter (SPEC-DISTRIBUTE.md §5): the same interface as the other packs', so the shared
// play screen runs it. No drawing: Open it, then Answer, typed, with help as hints (and Show me in Round 4).

import { newTypedSession, reduceTyped, TYPED_STEPS, typedHintFor, helpLines } from '../engine/distributeTyped.js';
import { formatDistribute } from '../engine/distribute.js';
import { prettyAnswer } from '../engine/terms.js';
import { renderTypedMat } from '../view/distributeTypedMat.js';
import { buildTypedControls } from '../view/distributeTypedControls.js';
import { distributeFeedbackText } from '../view/distributeFeedback.js';

export const distributeTypedPlay = {
  steps: () => TYPED_STEPS,
  newSession: newTypedSession,
  reduce: reduceTyped,
  feedbackText: distributeFeedbackText,
  buildControls: buildTypedControls,
  effects: (before, s) => ({ hint: typedHintFor(s) }),
  renderMat: (s, fx = {}) => renderTypedMat({
    problemText: formatDistribute(s.problem),
    step: s.step,
    typed: prettyAnswer(s.entry),
    openedText: s.openedText,
    answerText: s.finalText,
    help: fx.hint ? helpLines(s) : null,
  }),
  matAction: () => null,
};
