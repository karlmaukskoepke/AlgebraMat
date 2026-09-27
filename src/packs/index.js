// Every pack on the pack map, in order. Lasso is a locked "Coming soon" card in v1.
import { flipit } from './flipit.js';

export const lasso = {
  id: 'lasso',
  title: 'Lasso',
  blurb: 'Coming soon.',
  levels: 0,
  comingSoon: true,
};

export const PACKS = [flipit, lasso];
export const packById = (id) => PACKS.find((p) => p.id === id);
