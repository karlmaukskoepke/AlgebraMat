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
import { readInteger, classify } from './scaffold.js';
import { evaluate as evaluateProblem, formatProblem } from './expr.js';

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

// What the minus in front of a group problem means, as a closed passage (Karl, 2026-10-03): −1/2(−4) means ____. Four
// choices cover the opposite or not, and the number inside as written or with its sign changed; only one is right.
// Each wrong one says what is off.
export function groupCloze(problem) {
  const { neg, n, d } = problem.count;
  const b = problem.inside.value;
  const of = d > 1 ? `${n}/${d} of` : `${n} ${n === 1 ? 'group' : 'groups'} of`;
  const signedNum = (v) => (v < 0 ? `−${-v}` : `${v}`);
  const make = (opp, flipInside) => {
    const inner = flipInside ? -b : b;
    return {
      opp, flipInside,
      text: `${opp ? 'the opposite of ' : ''}${of} ${signedNum(inner)}`,
      right: opp === neg && !flipInside,
      reason: opp !== neg
        ? (neg ? 'The minus in front means “the opposite of”.' : 'There’s no minus in front, so nothing is turned into its opposite.')
        : 'Look at the number in the parentheses: is it positive or negative?',
    };
  };
  const all = [make(true, false), make(false, false), make(true, true), make(false, true)];
  const turn = (n + Math.abs(b)) % 4;             // the right one doesn't always sit in the same place
  const choices = all.map((_, i) => all[(i + turn) % 4]).map((c, index) => ({ ...c, index }));
  return { sentence: `${formatGroups(problem)} means ____.`, choices };
}

// pad: 'integer' types a number (± and digits); 'algebra' types terms (x, + and − too).
export const CARDS = {
  // Combine it Levels 1–3 and Flip It Levels 1–4: two numbers, joined by + or −.
  twoTerm: {
    pad: 'integer',
    problemText: formatProblem,
    answerText: (p) => String(evaluateProblem(p)).replace('-', '−'),
    check: (p, text) => classify(p, text),
  },
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
    signCloze: groupCloze,        // a sign mistake gets the closed passage before the full walk
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



// Which card config plays a pack's level (light mode and the diagnostic use the same one).
export function cardIdFor(packId, level) {
  if (packId === 'combineit') return level <= 3 ? 'twoTerm' : 'integers';
  if (packId === 'flipit') return level <= 4 ? 'twoTerm' : 'integers';
  return { lasso: 'group', boxes: 'boxes', 'groups-of-terms': 'termGroups', 'distribute-combine': 'distribute' }[packId] ?? null;
}
