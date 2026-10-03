// What light mode needs to know about each card (SPEC-SCAFFOLD.md §8): how a problem reads, how a typed answer is
// checked, and what a wrong answer looked like (the tag goes in the anonymous log). Pure logic, no DOM.
// Cards with no targeted support yet drop a wrong answer into their full walk; the tags tell us which supports to
// build next.

import { formatExpression, formatAnswer, evaluate, parseAnswer } from './terms.js';
import { validateAnswer as validateTerms } from './termMoves.js';
import { validateAnswer as validateGroupTerms } from './termGroupMoves.js';
import { validateCount } from './lassoMoves.js';
import { evaluateGroups, formatGroups } from './groups.js';
import { formatTermGroups, evaluateTermGroups } from './termGroups.js';
import { formatDistribute, distributedExpression } from './distribute.js';
import { readInteger } from './scaffold.js';

const UNREADABLE = new Set(['typeAnswer', 'answerUnreadable']);

// What a wrong typed answer looked like, from the numbers: `want` and the parsed `read` are { x, n }.
export function tagTerms(want, read) {
  if (!read.ok) return 'unreadable';
  if (!read.combined && read.x === want.x && read.n === want.n) return 'uncombined';
  if (read.x === -want.x && read.n === -want.n) {
    if (want.x === 0) return want.n < 0 ? 'sign-dropped' : 'wrong-winner';
    return 'sign-flipped';
  }
  if (read.x === want.x) return 'n-off';
  if (read.n === want.n) return 'x-off';
  return 'unmatched';
}

// A checker built on a pack's own answer validator: { correct, tag, unreadable }.
function termsChecker(want, validate) {
  return (problem, text) => {
    const res = validate(problem, text);
    if (res.ok) return { correct: true, tag: null };
    if (UNREADABLE.has(res.feedbackKey)) return { correct: false, tag: 'unreadable' };
    return { correct: false, tag: tagTerms(want(problem), parseAnswer(text)) };
  };
}

function checkGroups(problem, text) {
  const t = readInteger(text);
  if (t === null) return { correct: false, tag: 'unreadable' };
  const r = evaluateGroups(problem);
  if (validateCount(problem, t).ok) return { correct: true, tag: null };
  if (t === -r) return { correct: false, tag: r < 0 ? 'sign-dropped' : 'wrong-winner' };
  return { correct: false, tag: 'unmatched' };
}

// pad: 'integer' types a number (± and digits); 'algebra' types terms (x, + and − too).
export const CARDS = {
  // Combine it Levels 4–5 and Flip It Level 5: three or more integers.
  integers: {
    pad: 'integer',
    problemText: formatExpression,
    answerText: (p) => formatAnswer(evaluate(p)),
    check: termsChecker(evaluate, validateTerms),
  },
  boxes: {
    pad: 'algebra',
    problemText: formatExpression,
    answerText: (p) => formatAnswer(evaluate(p)),
    check: termsChecker(evaluate, validateTerms),
  },
  group: {
    pad: 'integer',
    problemText: formatGroups,
    answerText: (p) => formatAnswer({ x: 0, n: evaluateGroups(p) }),
    check: checkGroups,
  },
  termGroups: {
    pad: 'algebra',
    problemText: formatTermGroups,
    answerText: (p) => formatAnswer(evaluateTermGroups(p)),
    check: termsChecker((p) => evaluateTermGroups(p), validateGroupTerms),
  },
  distribute: {
    pad: 'algebra',
    problemText: formatDistribute,
    answerText: (p) => formatAnswer(evaluate(distributedExpression(p))),
    check: termsChecker((p) => evaluate(distributedExpression(p)), (p, text) => validateTerms(distributedExpression(p), text)),
  },
};


