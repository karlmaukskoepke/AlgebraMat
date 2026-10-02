// A Combine it problem on Flip It's engine with Rewrite left out (nothing is subtracted): it starts at Draw, and
// `combine` tells the Mat to draw only the answer under the problem (SPEC-COMBINE.md §3).

import { newSession } from './session.js';

export function newCombineSession(problem) {
  const s = newSession(problem);
  s.step = 'draw';
  s.combine = true;
  s.feedback = { key: 'drawIntro' };
  return s;
}
