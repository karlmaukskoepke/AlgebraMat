// Every pack on the pack map, in order. Lasso is a locked "Coming soon" card in v1.
import { flipit } from './flipit.js';

// Lasso's 7 levels are counted in progress and save codes already, so codes
// made now keep working. The card stays "Coming soon" until Lasso step 5
// turns on its level flow (SPEC-LASSO.md §8).
export const lasso = {
  id: 'lasso',
  title: 'Lasso',
  blurb: 'Coming soon.',
  levels: 7,
  comingSoon: true,
};

export const PACKS = [flipit, lasso];
export const packById = (id) => PACKS.find((p) => p.id === id);
