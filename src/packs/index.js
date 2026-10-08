// Every pack, in pack-map order. Packs with `comingSoon` show as a card only
// (SPEC-LASSO.md §5); they have no levels yet, so they take no room in saves.
import { combineit } from './combineit.js';
import { flipit } from './flipit.js';
import { generateLassoLevel } from '../engine/generateLasso.js';
import { generateTermLevel } from '../engine/generateTerms.js';
import { generateModelLevel } from '../engine/generateModel.js';
import { generateTermGroupsLevel } from '../engine/generateTermGroups.js';
import { generateDistributeLevel } from '../engine/generateDistribute.js';
import { generateValueLevel } from '../engine/generateValue.js';
import { generateSolveLevel } from '../engine/generateSolve.js';

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

// Boxes & Circles: combining like terms with boxes, circles and counters. Level 2 goes the other way: read a model
// (a picture of boxes and counters) and write the expression. The other levels are the old 2 to 5, a level later; each
// of their problems carries its original level (`level`), which tells the session whether it starts with Rewrite.
export const boxes = {
  id: 'boxes',
  title: 'Boxes & Circles',
  subtitle: 'Combining like terms',
  blurb: 'Box the x terms, circle the numbers, draw, cancel pairs, then type what’s left.',
  levels: 6,
  levelNames: ['only + terms', 'read the model', 'subtracting numbers', 'negative x terms', 'subtracting a negative', 'everything mixed'],
  generate: (level, seed) => (level === 2
    ? generateModelLevel(seed)
    : generateTermLevel(level > 2 ? level - 1 : level, seed).map((expr) => ({ ...expr, level: level > 2 ? level - 1 : level }))),
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

// Distribute, then combine (SPEC-DISTRIBUTE.md): open the groups first (Groups of Terms' steps, then Write it),
// then combine like terms (Boxes & Circles); Rounds 4 and 5 are typed, with help as hints.
export const distributeCombine = {
  id: 'distribute-combine',
  title: 'Distribute, then combine',
  subtitle: 'Distributing, then combining like terms',
  blurb: 'Open the groups first, then combine like terms.',
  levels: 5,
  levelNames: ['A + B(Cx + D)', 'the invisible 1', 'subtracting a group', 'mixed, bigger numbers', 'everything mixed'],
  // Each problem carries its round: Round 4 offers Show me, Round 5 doesn't.
  generate: (level, seed) => generateDistributeLevel(level, seed).map((p) => ({ ...p, level })),
};

// Value it (SPEC-VALUE.md): evaluate an expression for a value of x. Light mode only; the supports are the problem with
// x in parentheses, then boxes filled with the value's counters, then the sum.
export const valueIt = {
  id: 'value',
  title: 'Value it',
  subtitle: 'Evaluating expressions',
  blurb: 'Put the value in for x, then work it out.',
  levels: 4,
  levelNames: ['positive values', 'negative values', 'everything mixed', 'fractions of x'],
  generate: (level, seed) => generateValueLevel(level, seed),
};

// One-step equations (SPEC-SOLVE.md): find x in x + a = b, x − a = b, ax = b, x/a = b. Light mode only; the supports are
// your answer put back in (does it balance?), then the equation as a balance of a box and counters, then the undo.
export const oneStep = {
  id: 'one-step',
  title: 'One-step equations',
  subtitle: 'Adding, subtracting, multiplying and dividing',
  blurb: 'Undo the one thing stuck to x.',
  levels: 5,
  levelNames: ['x + a = b', 'x − a = b', 'ax = b', 'x / a = b', 'all four mixed'],
  generate: (level, seed) => generateSolveLevel(level, seed),
};

// The rest of the equations are still to come: they show as cards under Solve it, with no levels (so they take no room in saves).
const soon = (id, title, subtitle) => ({ id, title, subtitle, comingSoon: true, levels: 0, levelNames: [] });

export const PACKS = [
  combineit,
  flipit,
  lasso,
  boxes,
  groupsOfTerms,
  distributeCombine,
  valueIt,
  oneStep,
  soon('two-step', 'Two-step equations', 'Undoing two operations'),
  soon('multi-step', 'Multi-step equations', 'Variables on both sides'),
];

// The home screen's three sections (Karl, 2026-10-04): which cards live under each, and its color (a pastel).
export const SECTIONS = [
  { id: 'count', title: 'Count it', blurb: 'Adding, subtracting and multiplying numbers', packs: ['combineit', 'flipit', 'lasso'] },
  { id: 'build', title: 'Build it', blurb: 'Expressions, with boxes, circles and groups', packs: ['boxes', 'groups-of-terms', 'distribute-combine', 'value'] },
  { id: 'solve', title: 'Solve it', blurb: 'Solving equations', packs: ['one-step', 'two-step', 'multi-step'] },
];
export const sectionById = (id) => SECTIONS.find((s) => s.id === id);
export const sectionOf = (packId) => SECTIONS.find((s) => s.packs.includes(packId));
export const packById = (id) => PACKS.find((p) => p.id === id);
