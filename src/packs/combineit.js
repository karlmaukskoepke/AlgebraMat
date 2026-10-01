// The Combine it pack: adding integers (SPEC-COMBINE.md). Levels 1 and 2 are playable; Levels 3 and 4
// are added as they're built, so this pack lists only the levels that work.
import { generateCombineLevel } from '../engine/generateCombine.js';

export const combineit = {
  id: 'combineit',
  title: 'Combine it',
  subtitle: 'Adding integers',
  blurb: 'Add positives and negatives with counters: party or battle?',
  levels: 2,
  levelNames: ['positive + negative', 'negative + negative'],
  generate: (level, seed) => generateCombineLevel(level, seed),
};
