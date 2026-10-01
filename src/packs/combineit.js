// The Combine it pack: adding integers (SPEC-COMBINE.md). Levels 1 to 3 are playable; Level 4 is
// added when it's built, so this pack lists only the levels that work. Levels 1 and 2 are Flip It's
// two-term problems; Level 3 has three or four terms and runs on the integer steps (mode 'integers').
import { generateCombineLevel } from '../engine/generateCombine.js';

export const combineit = {
  id: 'combineit',
  title: 'Combine it',
  subtitle: 'Adding integers',
  blurb: 'Add positives and negatives with counters: party or battle?',
  levels: 3,
  levelNames: ['positive + negative', 'negative + negative', 'three or more numbers'],
  generate: (level, seed) => generateCombineLevel(level, seed).map((p) => (level >= 3 ? { ...p, mode: 'integers' } : p)),
};
