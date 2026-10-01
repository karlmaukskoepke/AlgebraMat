// Every pack, in pack-map order. Packs with `comingSoon` show as a card only
// (SPEC-LASSO.md §5); they have no levels yet, so they take no room in saves.
import { flipit } from './flipit.js';
import { generateLassoLevel } from '../engine/generateLasso.js';
import { generateTermLevel } from '../engine/generateTerms.js';

// Group It (built as "Lasso"; its id stays 'lasso' so saved progress and
// save codes from before the rename still work).
export const lasso = {
  id: 'lasso',
  title: 'Group It',
  subtitle: 'The meaning of multiplication as groups and opposites',
  blurb: 'Make the groups, fill them, flip the opposites, then count.',
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

// Boxes & Circles is still a Coming-soon card (no levels, nothing in saves), but
// its finished steps can be played at ?pack=boxes&level=N while it's built.
const boxes = {
  ...soon('boxes', 'Boxes & Circles', 'Combining like terms'),
  previewLevels: 5,
  levelNames: ['only + terms', 'subtracting numbers', 'negative x terms', 'subtracting a negative', 'everything mixed'],
  generate: (level, seed) => generateTermLevel(level, seed),
};

export const PACKS = [
  flipit,
  lasso,
  boxes,
  soon('groups-of-terms', 'Groups of Terms', 'The distributive property'),
  soon('distribute-combine', 'Distribute, then combine', 'Distributing, then combining like terms'),
];
export const packById = (id) => PACKS.find((p) => p.id === id);
