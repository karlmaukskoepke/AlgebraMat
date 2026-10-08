// The Uber diagnostic (Karl, 2026-10-03): about two problems from each card, at two different levels, typed with no
// support and no right or wrong shown until the end. Stopping part way saves the place (it isn't done until the last
// problem). The readout says where each card's mastery is, and recommends AND opens levels. Pure logic.

import { PACKS, packById } from '../packs/index.js';
import { CARDS, cardIdFor } from './lightCards.js';
import { typeInto, isTyping } from './entry.js';
import { openLevels } from './progress.js';

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
];

// The sections that have a diagnostic ('all' is every probe, in order).
export const DIAGNOSTIC_SECTIONS = ['count', 'build', 'solve'];
export const probesOf = (section = 'all') => PROBES.filter((p) => section === 'all' || p.section === section);

// The problems for a seed: [{ pack, level, problem }], in order.
export function diagnosticItems(seed, section = 'all') {
  return PROBES.flatMap(({ pack, levels, section: of }, p) => (section === 'all' || of === section
    ? levels.map((level, i) => ({ pack, level, problem: packById(pack).generate(level, (seed + p * 7 + i * 13) >>> 0)[0] }))
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
// the level after it; otherwise from the start.
export function readout(seed, answers, items = diagnosticItems(seed), section = 'all') {
  return probesOf(section).map(({ pack, levels }) => {
    const mine = items.map((it, i) => ({ it, a: answers[i], i })).filter((x) => x.it.pack === pack);
    const right = mine.map((x) => isRight(x.it, x.a?.typed));
    const total = packById(pack).levels;
    const rec = right.every(Boolean) ? Math.min(total, levels[1] + 1)
      : right[0] ? Math.min(total, levels[0] + 1)
        : right[1] ? levels[0] : 1;
    const standing = right.every(Boolean) ? 'strong' : right.some(Boolean) ? 'growing' : 'start';
    return {
      pack, rec, standing,
      problems: mine.map((x, k) => ({ lead: itemLead(x.it), level: x.it.level, text: itemText(x.it), answer: itemAnswer(x.it), typed: x.a?.typed ?? '', skipped: Boolean(x.a?.skipped), right: right[k] })),
    };
  });
}

// The progress with the recommended levels opened.
export const applyReadout = (progress, results) => results.reduce((p, r) => openLevels(p, r.pack, r.rec), progress);

export const STANDING = { strong: 'Strong', growing: 'Getting there', start: 'Start here' };
export const packTitle = (id) => PACKS.find((p) => p.id === id)?.title ?? id;
