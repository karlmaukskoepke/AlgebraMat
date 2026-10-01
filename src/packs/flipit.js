// The Flip It pack: subtracting, especially subtracting a negative (SPEC §6).
import { generateLevel } from '../engine/generate.js';
import { generateFlipMixed } from '../engine/generateCombine.js';

export const flipit = {
  id: 'flipit',
  title: 'Flip It',
  subtitle: 'Subtraction with negative numbers',
  blurb: 'Subtract by adding the opposite.',
  levels: 5,
  levelNames: [
    'positive − negative',
    'negative − negative',
    'number − positive',
    'mixed, some addition',
    'add and subtract, 3 or 4 numbers',
  ],
  // Level 5 is three or four integers, adding and subtracting (SPEC-COMBINE.md §4): it runs on the integer steps.
  generate: (level, seed) => (level === 5
    ? generateFlipMixed(seed).map((p) => ({ ...p, mode: 'integers-flip' }))
    : generateLevel(level, seed)),
};
