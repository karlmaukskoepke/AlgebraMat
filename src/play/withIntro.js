// The two openings of the light design (Build D, Part 1), round a card's reducer: the one-time "Find the value of x." on the very first
// problem of a visit goes at the first action, and the forced-move pop-up (the problem after a correct guess) goes with the green Next
// (`introNext`) or the first action. A hover is not an action. `isOpen(s)`: is the forced-move pop-up up?

import { closeFirst } from '../view/visit.js';

export const withIntro = (reduce, isOpen) => (state, action) => {
  if (action.type === 'ui') return reduce(state, action);
  if (action.type === 'introNext') return isOpen(state) ? { ...state, introSeen: true } : state;
  const s = reduce(state, action);
  if (s === state) return s;
  closeFirst();
  return isOpen(state) && !s.introSeen ? { ...s, introSeen: true } : s;
};
