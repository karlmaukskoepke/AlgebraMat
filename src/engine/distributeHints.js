// Hints for Write it, after 3 wrong tries (the other steps use their own packs' hints). A hint shows what
// to do and never does it. Pure logic, no DOM: distributeHintFor(session) → null | { key, params, show, src }.

import { HINT_AFTER } from './hints.js';
import { formatDistribute } from './distribute.js';
import { groupProblem } from './distributeSession.js';
import { answerText } from './termGroups.js';

export function distributeHintFor(s) {
  if (!s || s.stage !== 'line' || (s.tries.line ?? 0) < HINT_AFTER) return null;
  return {
    key: 'hintLine',
    params: { whole: formatDistribute(s.problem), group: answerText(groupProblem(s.problem)) },
    show: {},
    src: 'dist',
  };
}
