// Every pack on the pack map, in order. Lasso is a locked "Coming soon" card in v1.
import { flipit } from './flipit.js';
import { generateLassoLevel } from '../engine/generateLasso.js';

// Lasso's 7 levels are counted in progress and save codes already, so codes
// made now keep working. The card stays "Coming soon" until Lasso step 5
// turns on its level flow (SPEC-LASSO.md §8).
export const lasso = {
  id: 'lasso',
  title: 'Lasso',
  blurb: 'Coming soon.',
  levels: 7,
  levelNames: [
    'positive groups',
    'opposite of one group',
    'opposite of several groups',
    'unit fraction of a group',
    'opposite unit fraction',
    'fraction of a group',
    'opposite fraction',
  ],
  // Levels built so far (whole-number groups). Reachable only at
  // ?pack=lasso&level=N until Lasso step 5 opens the card.
  playable: 3,
  comingSoon: true,
  generate: (level, seed) => generateLassoLevel(level, seed),
};

export const PACKS = [flipit, lasso];
export const packById = (id) => PACKS.find((p) => p.id === id);
