// Light mode for Distribute, then combine's first rounds (Karl, 2026-10-03): the same supports as Groups of Terms
// (engine/groupLight.js) for the group in the problem, then the card's own walk (Groups of Terms' steps on the group,
// Write it, then Boxes & Circles on the opened line).
//
//   5 + 2(4x + 1) → 5 + 8x + 1     the number out front reached one term only: the arrows, then retype
//   3 − 3(2x − 1) → …              a negative term inside lost its sign: box and circle the terms inside, then the arrows
//   4 − (2x + 5) → 4 − 2x + 5      the minus reached the first term only: write the hidden 1, then the arrows
//   5 + 2(2x + 3) → …              the 2 was added as a term: straight to the groups

import { createGroupLight, insideExpression, walkOf } from './groupLight.js';
import { newDistributeSession, reduceDistribute, groupProblem } from './distributeSession.js';
import { groupParts } from './distribute.js';
import { CARDS } from './lightCards.js';

export { insideExpression, walkOf };

// What's out front, as written: "2", "−3" (a subtracted group), "−1" (a subtracted hidden 1).
const outer = (problem) => {
  const [group] = groupParts(problem);
  return `${group.op === '-' ? '−' : ''}${group.hiddenOne ? 1 : group.n}`;
};

const light = createGroupLight({
  card: CARDS.distribute,
  groupProblem,
  outer,
  ownWalk: true,
  newWalk: (problem, group) => {
    const walk = newDistributeSession(problem);
    if (group?.wroteOne) {                                              // the hidden 1 was already written
      walk.tg = { ...walk.tg, wroteOne: true, feedback: { key: 'oneWritten' } };
      walk.feedback = { ...walk.tg.feedback, src: 'tg' };
    }
    return walk;
  },
  reduceWalk: reduceDistribute,
});

export const newDistributeLight = light.newSession;
export const reduceDistributeLight = light.reduce;
