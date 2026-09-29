// Every pack, in pack-map order. Packs with `comingSoon` show as a card only
// (SPEC-LASSO.md §5); they have no levels yet, so they take no room in saves.
import { flipit } from './flipit.js';
import { generateLassoLevel } from '../engine/generateLasso.js';

export const lasso = {
  id: 'lasso',
  title: 'Lasso',
  subtitle: 'The meaning of multiplication as groups and opposites',
  blurb: 'Lasso the groups, fill them, count them, then flip for the opposite.',
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
  generate: (level, seed) => generateLassoLevel(level, seed),
};

const soon = (id, title, subtitle) => ({ id, title, subtitle, levels: 0, comingSoon: true });

export const PACKS = [
  flipit,
  lasso,
  soon('boxes', 'Boxes & Circles', 'Combining like terms'),
  soon('groups-of-terms', 'Groups of Terms', 'The distributive property'),
  soon('distribute-combine', 'Distribute, then combine', 'Distributing, then combining like terms'),
];
export const packById = (id) => PACKS.find((p) => p.id === id);
