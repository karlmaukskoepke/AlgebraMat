// Light mode for Groups of Terms (Karl, 2026-10-03): the shared groups-of-terms light mode (engine/groupLight.js)
// with this card's own walk, the groups session.

import { createGroupLight, insideExpression, walkOf } from './groupLight.js';
import { newTermGroupSession, reduceTermGroups } from './termGroupSession.js';
import { CARDS } from './lightCards.js';

export { insideExpression, walkOf };

const light = createGroupLight({
  card: CARDS.termGroups,
  groupProblem: (problem) => problem,
  outer: (problem) => `${problem.count.neg ? '−' : ''}${problem.count.n}`,
  newWalk: (problem, group) => group ?? newTermGroupSession(problem),   // the hidden-1 session, if it was used, carries on
  reduceWalk: reduceTermGroups,
});

export const newTermGroupLight = light.newSession;
export const reduceTermGroupLight = light.reduce;
