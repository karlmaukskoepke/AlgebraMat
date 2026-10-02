// Every pack, in pack-map order. Packs with `comingSoon` show as a card only
// (SPEC-LASSO.md §5); they have no levels yet, so they take no room in saves.
import { combineit } from './combineit.js';
import { flipit } from './flipit.js';
import { generateLassoLevel } from '../engine/generateLasso.js';
import { generateTermLevel } from '../engine/generateTerms.js';
import { generateTermGroupsLevel } from '../engine/generateTermGroups.js';
import { generateDistributeLevel } from '../engine/generateDistribute.js';

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

// Boxes & Circles: combining like terms with boxes, circles and counters.
// Each problem carries its level, which tells the session whether it starts with Rewrite.
export const boxes = {
  id: 'boxes',
  title: 'Boxes & Circles',
  subtitle: 'Combining like terms',
  blurb: 'Box the x terms, circle the numbers, draw, cancel pairs, then type what’s left.',
  levels: 5,
  levelNames: ['only + terms', 'subtracting numbers', 'negative x terms', 'subtracting a negative', 'everything mixed'],
  generate: (level, seed) => generateTermLevel(level, seed).map((expr) => ({ ...expr, level })),
};

// Groups of Terms: the distributive property, A groups of B where B has two terms.
export const groupsOfTerms = {
  id: 'groups-of-terms',
  title: 'Groups of Terms',
  subtitle: 'The distributive property',
  blurb: 'Make the groups, fill them with boxes and counters, flip the opposites, then write what they make.',
  levels: 8,
  levelNames: ['all positive', 'a negative number', 'a negative x term', 'opposite groups', 'challenge: number first',
    'unit fraction of a group', 'fraction of a group', 'challenge: negative fractions'],
  generate: (level, seed) => generateTermGroupsLevel(level, seed),
};

// Distribute, then combine (SPEC-DISTRIBUTE.md): still a Coming-soon card while it's built round by round, but
// a round that's built opens from a link (?pack=distribute-combine&level=2). Rounds 1 to 3 so far.
export const distributeCombine = {
  id: 'distribute-combine',
  title: 'Distribute, then combine',
  subtitle: 'Distributing, then combining like terms',
  blurb: 'Open the groups first, then combine like terms.',
  levels: 3,
  levelNames: ['A + B(Cx + D)', 'the invisible 1', 'subtracting a group'],
  comingSoon: true,
  generate: (level, seed) => generateDistributeLevel(level, seed),
};

export const PACKS = [
  combineit,
  flipit,
  lasso,
  boxes,
  groupsOfTerms,
  distributeCombine,
];
export const packById = (id) => PACKS.find((p) => p.id === id);
