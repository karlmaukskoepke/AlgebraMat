// The Combine it pack: adding integers (SPEC-COMBINE.md). Levels 1 to 3 are Flip It's two-term problems (Level 3
// mixes parties and battles, so the student has to decide); Level 4 has three or four terms and runs on the
// integer steps (mode 'integers'); Level 5 has big numbers and no counters (mode 'integers-big').
import { generateCombineLevel } from '../engine/generateCombine.js';

export const combineit = {
  id: 'combineit',
  title: 'Combine it',
  subtitle: 'Adding integers',
  blurb: 'Add positives and negatives with counters: party or battle?',
  levels: 5,
  levelNames: ['positive + negative', 'negative + negative', 'party or battle?', 'three or more numbers', 'big numbers, no counters'],
  generate: (level, seed) => generateCombineLevel(level, seed).map((p) => (
    level === 4 ? { ...p, mode: 'integers' } : level === 5 ? { ...p, mode: 'integers-big' } : { ...p, level })),
};
