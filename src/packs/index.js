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
import { generateSolve2Level } from '../engine/generateSolve2.js';
import { generateSwitchLevel } from '../engine/generateSwitch.js';
import { generateAddBothLevel } from '../engine/generateAddBoth.js';
import { generateTwoStepLevel } from '../engine/generateTwoStep.js';
import { generateFlipLevel } from '../engine/generateFlip.js';
import { generateDivideLevel } from '../engine/generateDivide.js';
import { generateDistSolveLevel } from '../engine/generateDistSolve.js';
import { generateBothLevel } from '../engine/generateBoth.js';

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
  subtitle: 'Multiplying and dividing',
  blurb: 'Undo the one thing stuck to x.',
  levels: 5,
  levelNames: ['x + a = b', 'x − a = b', 'ax = b', 'x / a = b', 'all four mixed'],
  // Add to both sides has taken over the first two (x + a, x − a), so this card opens at its third, shown as Level 1, until
  // the multiply and divide cards replace it. The saved levels keep their numbers.
  firstLevel: 3,
  generate: (level, seed) => generateSolveLevel(level, seed),
};

// Add to both sides (SPEC-ADD-TO-BOTH-SIDES.md): the pilot of the moves-based Solve it. Level 1 is numeric (no x); levels 2–6 are
// the equations. It replaces One-step equations' first two levels and Switch sides (see engine/progress.js, withLegacyCredit).
// The card opens at the equations (Level 2, shown as Level 1); the numeric walkthrough is the optional "See why it works"
// button on the card (Karl, 2026-10-18). Its saved level keeps its number, so save codes and the class sheet are unchanged.
export const addBoth = {
  id: 'add-both',
  firstLevel: 2,
  whyLevel: 1,
  title: 'Add to both sides',
  subtitle: 'Cancel the number next to x with its opposite',
  blurb: 'Add the opposite to both sides, and cancel the pairs.',
  levels: 6,
  levelNames: ['numbers only', 'x + a = b', 'x − a = b', 'both forms', 'x on the right', 'all four forms, bigger'],
  generate: (level, seed) => generateAddBothLevel(level, seed),
};

// Switch sides (SPEC-SOLVE.md §8): the other way to solve it: the number is dragged across the border and switches teams.
export const switchSides = {
  id: 'switch',
  retired: true,        // off the home screen (Add to both sides replaced it); its saved levels are kept for the two-step card
  title: 'Switch sides',
  subtitle: 'Counters cross the border and switch teams',
  blurb: 'Drag the number across the equals sign: it becomes its opposite.',
  levels: 6,
  levelNames: ['x + a = b', 'x − a = b', 'negative answers', 'x on the right', 'two-step', 'two-step, negatives'],
  generate: (level, seed) => generateSwitchLevel(level, seed),
};

// Two-step equations (SPEC-SOLVE.md §7): undo the number first, then the multiplying. Same supports as One-step. Retired in Build K: the
// new Two-step equations card (below) replaced it. It is kept here, with its saved levels, so they still count (engine/progress.js).
export const twoStep = {
  id: 'two-step',
  retired: true,
  title: 'Two-step equations',
  subtitle: 'Undoing two operations',
  blurb: 'Undo the number first, then the multiplying.',
  levels: 7,
  levelNames: ['ax + b = c', 'ax − b = c', 'b + ax = c', 'x on the right', 'b − ax = c', 'negative answers', 'all mixed'],
  generate: (level, seed) => generateSolve2Level(level, seed),
};

// Divide it (SPEC-DIVIDE-IT.md, light build): Level 1 is numeric; levels 2–6 are the five equation levels (the generator's 1–5).
// Like Add to both sides, the card opens at Level 2 (shown as Level 1) and the numeric level is "See why it works".
export const divideIt = {
  id: 'divide-it',
  firstLevel: 2,
  whyLevel: 1,
  title: 'Divide it',
  subtitle: 'Taking a fraction of both sides',
  blurb: 'Take a fraction of both sides until one box is left.',
  levels: 6,
  levelNames: ['numbers only', 'ax = b, a = 2 or 3', 'a = 2 to 5', 'bigger numbers', 'a = 4 or 6', 'all mixed'],
  generate: (level, seed) => generateDivideLevel(level - 1, seed),                    // level 1 → numeric (0), 2–6 → the five equation sets
};

// Flip everything (SPEC-FLIP-IT.md rev 1.2, Build J, basic form): x with a minus (`−x = 12`, `12 = −x`, `−3x = 12`). Six saved levels like
// Add to both sides and Divide it: saved Level 1 (numbers only) is reserved for its "See why it works", not built yet, so the card has no
// button for it; it opens at saved Level 2 (shown as Level 1). Not `flipit`: that id is Count it's subtraction card.
export const flipEverything = {
  id: 'flip-everything',
  firstLevel: 2,
  title: 'Flip everything',
  subtitle: 'When x has a minus',
  blurb: 'Multiply both sides by −1 to take the minus off x.',
  levels: 6,
  levelNames: ['numbers only', '−x = b', 'b = −x', '−ax = b', 'all four forms', 'bigger numbers'],
  generate: (level, seed) => generateFlipLevel(level, seed),
};

// Two-step equations, the new card (Build K, basic form): `3x + 4 = 19` in two moves, Add to both sides (the student combines the other
// side) and take a fraction (or, from Level 5, flip). Seven levels, shown as saved (no walkthrough). Not `two-step`: that id is the old
// card's, whose seven saved levels keep their meaning.
export const twoStepEquations = {
  id: 'two-step-equations',
  title: 'Two-step equations',
  subtitle: 'Add, combine, then take a fraction',
  blurb: 'Cancel the number beside x, combine, then take a fraction of both sides.',
  levels: 7,
  levelNames: ['ax + b = c', 'ax − b = c', 'x on the right', 'b + ax = c', 'b − ax = c', 'negative answers', 'all mixed'],
  generate: (level, seed) => generateTwoStepLevel(level, seed),
};

// Distribute, combine, solve (Build M, basic form): `3(x + 2) = 15`: drag the factor onto the parenthesis and type each product, combine,
// then finish as in Two-step. Five levels, shown as saved (no walkthrough: "Practice distributing first" opens Build it's Distribute, then
// combine). Not `distribute-combine`: that id is Build it's card (expressions), and `distribute-drill` was the hidden drill it replaces.
export const distributeSolve = {
  id: 'distribute-solve',
  title: 'Distribute, combine, solve',
  subtitle: 'Multiply each piece, then solve',
  blurb: 'Drag the number onto the parentheses, type each product, combine, then solve.',
  levels: 5,
  levelNames: ['a(x ± c) = b', '−a(x ± c) = b', 'n + a(x ± c) = b', 'n − a(x ± c) = b', 'like x-terms'],
  practice: { pack: 'distribute-combine', label: 'Practice distributing first' },
  generate: (level, seed) => generateDistSolveLevel(level, seed),
};

// Variables on both sides (Build R, basic form): `5x + 2 = 3x + 10`: get the x-terms on one side (Add an x-term, or drag one across the
// =), combine, then finish as in Two-step; x = waits until x is on one side. Five levels, shown as saved (no walkthrough). It replaces the
// "Multi-step equations (soon)" placeholder, which had no levels and so nothing saved.
export const variablesBothSides = {
  id: 'variables-both-sides',
  title: 'Variables on both sides',
  subtitle: 'Get x on one side, then solve',
  blurb: 'Move an x-term across the = (or add its opposite), combine, then solve.',
  levels: 5,
  levelNames: ['ax = bx + c', 'ax + b = cx + d', 'more x on the right', 'negatives', 'parentheses'],
  generate: (level, seed) => generateBothLevel(level, seed),
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
  addBoth,
  divideIt,
  flipEverything,
  oneStep,
  switchSides,
  twoStep,
  twoStepEquations,
  distributeSolve,
  variablesBothSides,
];

// The home screen's three sections (Karl, 2026-10-04): which cards live under each, and its color (a pastel).
export const SECTIONS = [
  { id: 'count', title: 'Count it', blurb: 'Adding, subtracting and multiplying numbers', packs: ['combineit', 'flipit', 'lasso'] },
  { id: 'build', title: 'Build it', blurb: 'Expressions, with boxes, circles and groups', packs: ['boxes', 'groups-of-terms', 'distribute-combine', 'value'] },
  { id: 'solve', title: 'Solve it', blurb: 'Solving equations', packs: ['add-both', 'divide-it', 'flip-everything', 'one-step', 'two-step-equations', 'distribute-solve', 'variables-both-sides'] },
];
export const sectionById = (id) => SECTIONS.find((s) => s.id === id);
export const sectionOf = (packId) => SECTIONS.find((s) => s.packs.includes(packId));
// Packs still being built are reachable by ?pack= but are not on the home screen, in progress or in save codes (none now).
export const HIDDEN_PACKS = [];
// A card's "See why it works" walkthrough: a level before the one it opens at, played from a button on the card, not a level dot.
export const isWhyLevel = (pack, level) => Boolean(pack?.whyLevel) && level === pack.whyLevel;
export const WHY_LABEL = 'See why it works';
// The number a level is called on screen: a card that opens at a later level counts from 1.
export const levelNumber = (pack, level) => level - ((pack?.firstLevel ?? 1) - 1);
export const packById = (id) => PACKS.find((p) => p.id === id) ?? HIDDEN_PACKS.find((p) => p.id === id);
