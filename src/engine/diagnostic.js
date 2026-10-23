// The Uber diagnostic (Karl, 2026-10-03): about two problems from each card, at two different levels, typed with no
// support and no right or wrong shown until the end. Stopping part way saves the place (it isn't done until the last
// problem). The readout says where each card's mastery is, and recommends AND opens levels. Pure logic.

import { PACKS, packById } from '../packs/index.js';
import { CARDS, cardIdFor } from './lightCards.js';
import { typeInto, isTyping } from './entry.js';
import { openLevels, newTwoStepLevel } from './progress.js';
import { isBattle } from './addBoth.js';

// Adding and subtracting first, then groups, then the algebra cards (the pack map's order). Two levels each: one
// early, one later. Each card belongs to a section of the home screen (Count it, Build it), which has its own
// diagnostic: a section's problems are the ones its cards contribute to the full list (so a problem keeps its seed).
export const PROBES = [
  { pack: 'combineit', levels: [2, 4], section: 'count' },
  { pack: 'flipit', levels: [2, 5], section: 'count' },
  { pack: 'lasso', levels: [2, 5], section: 'count' },
  { pack: 'boxes', levels: [3, 5], section: 'build' },
  { pack: 'groups-of-terms', levels: [2, 5], section: 'build' },
  { pack: 'distribute-combine', levels: [1, 3], section: 'build' },
  { pack: 'value', levels: [1, 3], section: 'build' },
  { pack: 'one-step', levels: [2, 4], section: 'solve' },   // x − a = b, and x / a = b
  // Two-step: ax − b = c, and b − ax = c (a negative coefficient), the old card's Levels 2 and 5 (the same problems, in the same order:
  // saved places depend on it). Build L: what they open is the new Two-step card (the old one is retired), each old level read through
  // Build K's legacy-credit table (old 2 → new 2, old 3 → new 4, old 5 → new 5, old 6 → new 6): a result opens the new card up to the
  // level that matches the one the old card would have started at.
  { pack: 'two-step', levels: [2, 5], section: 'solve', opens: { pack: 'two-step-equations', level: newTwoStepLevel } },
  // Add to both sides (SPEC-ADD-TO-BOTH-SIDES.md §8): an x − a = b Battle (level 3), then two of the bigger level 6, one with x on
  // the left and one with x on the right. L3 wrong opens L1–L3; L3 right and a level-6 wrong, L1–L5; both level-6 right, all six.
  // (Last in the list, so a Solve it diagnostic saved before it was added carries on with these three.)
  {
    pack: 'add-both', levels: [3, 6, 6], section: 'solve',
    pick: [(set) => set.find((p) => p.form === 'x-a' && isBattle(p)), (set) => set.find((p) => !p.mirror), (set) => set.find((p) => p.mirror)],
    rec: ([easy, left, right]) => (!easy ? 3 : left && right ? 6 : 5),
  },
  // Divide it: one problem each of the spec's L2, L4 and L5 types (the card's Levels 3, 5 and 6, as Level 1 is numeric). A wrong first
  // opens Levels 1–2; right and the second wrong, 1–4; the second right and the third wrong, 1–5; all right, 1–6. (Last, so a saved diagnostic carries on.)
  { pack: 'divide-it', levels: [3, 5, 6], section: 'solve', rec: ([easy, mid, hard]) => (!easy ? 2 : !mid ? 4 : !hard ? 5 : 6) },
];

// The sections that have a diagnostic ('all' is every probe, in order).
export const DIAGNOSTIC_SECTIONS = ['count', 'build', 'solve'];
export const probesOf = (section = 'all') => PROBES.filter((p) => section === 'all' || p.section === section);

// The problems for a seed: [{ pack, level, problem }], in order.
export function diagnosticItems(seed, section = 'all') {
  return PROBES.flatMap(({ pack, levels, section: of, pick }, p) => (section === 'all' || of === section
    ? levels.map((level, i) => {
      const set = packById(pack).generate(level, (seed + p * 7 + i * 13) >>> 0);
      return { pack, level, problem: pick?.[i]?.(set) ?? set[0] };
    })
    : []));
}

export const itemCard = (item) => CARDS[cardIdFor(item.pack, item.level)];
export const itemText = (item) => itemCard(item).problemText(item.problem);
export const itemAnswer = (item) => itemCard(item).answerText(item.problem);
export const itemPad = (item) => itemCard(item).pad;
export const itemLead = (item) => itemCard(item).lead ?? '=';
export const isRight = (item, typed) => Boolean(typed) && itemCard(item).check(item.problem, typed).correct;

// ---------- Taking it ----------

export function newDiagnostic(seed, section = 'all') {
  return { seed, section, index: 0, entry: '', answers: [], done: false };   // answers: [{ typed, skipped }]
}

export const totalOf = (section = 'all') => probesOf(section).reduce((n, p) => n + p.levels.length, 0);
export const TOTAL = totalOf();

// Pure: type, Next (records the entry), "I don't know" (records a skip). Nothing says whether it was right.
export function reduceDiagnostic(state, action, items = diagnosticItems(state.seed, state.section)) {
  if (state.done) return state;
  if (isTyping(action)) {
    const entry = typeInto(state.entry, action, itemPad(items[state.index]));
    return entry === state.entry ? state : { ...state, entry };
  }
  if (action.type === 'next' || action.type === 'skip') {
    const skipped = action.type === 'skip' || state.entry === '';
    const answers = [...state.answers, { typed: skipped ? '' : state.entry, skipped }];
    const index = state.index + 1;
    return { ...state, answers, entry: '', index, done: index >= items.length };
  }
  return state;
}

// ---------- The readout ----------

// How each card went, and the level to start at: both right → the level after the harder one; the easier one right →
// the level after it; otherwise from the start. A probe of a retired card says which card it opens now (`opens`, Build L). A result
// finished before Build L reads the same way (Build M, 2026-10-23: Karl): see upgradePlacement.
export function readout(seed, answers, items = diagnosticItems(seed), section = 'all') {
  return probesOf(section).map(({ pack, levels, rec: recOf, opens }) => {
    const mine = items.map((it, i) => ({ it, a: answers[i], i })).filter((x) => x.it.pack === pack);
    const right = mine.map((x) => isRight(x.it, x.a?.typed));
    const total = packById(pack).levels;
    const rec = recOf ? recOf(right) : right.every(Boolean) ? Math.min(total, levels[1] + 1)
      : right[0] ? Math.min(total, levels[0] + 1)
        : right[1] ? levels[0] : 1;
    const standing = right.every(Boolean) ? 'strong' : right.some(Boolean) ? 'growing' : 'start';
    const now = opens ? { pack: opens.pack, rec: opens.level(rec), probed: pack } : { pack, rec };
    return {
      ...now, standing,
      problems: mine.map((x, k) => ({ lead: itemLead(x.it), level: x.it.level, text: itemText(x.it), answer: itemAnswer(x.it), typed: x.a?.typed ?? '', skipped: Boolean(x.a?.skipped), right: right[k] })),
    };
  });
}

// The progress with the recommended levels opened.
// A student whose Add to both sides diagnostic shows they apply the move correctly (the x − a Battle was right, so level 5 or 6
// is recommended) skips Level 1, the numeric level: it is marked done. They can still play it.
const SKIPS_NUMERIC_L1 = { 'add-both': 5, 'divide-it': 4 };      // the recommended level from which Level 1 (numbers only) is skipped
export const applyReadout = (progress, results) => results.reduce((p, r) => {
  const opened = openLevels(p, r.pack, r.rec);
  if (r.rec >= (SKIPS_NUMERIC_L1[r.pack] ?? Infinity) && opened.packs[r.pack]) opened.packs[r.pack].levels[0] = true;
  return opened;
}, progress);

// A result finished before Build L (Build M, Part 1): when this device loads it, it opens on the new card the levels it showed the student
// knows, with the same mapping as a new placement. It only opens levels: nothing is credited as finished, and nothing already open closes.
export const upgradePlacement = (progress, results) => results.filter((r) => r.probed).reduce((p, r) => openLevels(p, r.pack, r.rec), progress);

// The level a result's button starts at: never below the card's first level (One-step equations opens at its saved Level 3, so a
// recommendation of 1 or 2 is its Level 1; it read "Start at Level -1" before Build M).
export const startLevelOf = (pack, rec) => Math.max(rec, pack?.firstLevel ?? 1);

export const STANDING = { strong: 'Strong', growing: 'Getting there', start: 'Start here' };
export const packTitle = (id) => PACKS.find((p) => p.id === id)?.title ?? id;
