// The Flip It pack: subtracting, especially subtracting a negative (SPEC §6).
import { generateLevel } from '../engine/generate.js';

export const flipit = {
  id: 'flipit',
  title: 'Flip It',
  blurb: 'Subtract by adding the opposite.',
  levels: 4,
  levelNames: [
    'positive − negative',
    'negative − negative',
    'number − positive',
    'mixed, some addition',
  ],
  generate: (level, seed) => generateLevel(level, seed),
};
