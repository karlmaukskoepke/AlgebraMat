// Metallic progress (Build X, Part 4; Karl, 2026-10-26): the status of a card and of a section on the home screen. Pure logic, no DOM.
//
// A level is none, placed (credited by the placement quiz or by a finished level on an older card) or earned (finished on this card):
// engine/progress.js, levelState. Only the levels a card displays count: from its `firstLevel` (so not a "See why it works" level, which
// comes before it) to its `lastLevel` (so not hidden levels, such as Strange solutions 4-5 before they ship). Retired and coming-soon
// cards have no status.
//
//   plain   nothing placed or earned
//   green   begun: under half of the displayed levels placed or earned
//   silver  half or more placed or earned (exactly half is silver: a choice, Karl said "more than 50%"), not every level earned
//   gold    every displayed level earned (placed levels count for green and silver, never for gold)
//
// A section is gold when every card in it that has a status is gold.

import { levelState } from './progress.js';

export const STATUSES = ['plain', 'green', 'silver', 'gold'];
export const rankOf = (status) => STATUSES.indexOf(status);

// The saved level numbers a card shows, in order.
export function displayedLevels(pack) {
  if (!pack || pack.comingSoon || pack.retired || !pack.levels) return [];
  const first = pack.firstLevel ?? 1;
  const last = Math.min(pack.lastLevel ?? pack.levels, pack.levels);
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, i) => first + i);
}

// The status from the levels' states alone (the table the tests check): `states` is a list of 'none' | 'placed' | 'earned'.
export function statusOf(states) {
  const n = states.length;
  const earned = states.filter((s) => s === 'earned').length;
  const done = earned + states.filter((s) => s === 'placed').length;
  if (n > 0 && earned === n) return 'gold';
  if (done === 0) return 'plain';
  return done * 2 >= n ? 'silver' : 'green';
}

// { status, states, shown, done, earned, placed } for a card, or null for a card with no status (retired, coming soon, no levels).
export function cardStatus(progress, pack) {
  const levels = displayedLevels(pack);
  if (!levels.length) return null;
  const states = levels.map((l) => levelState(progress, pack.id, l));
  const earned = states.filter((s) => s === 'earned').length;
  const placed = states.filter((s) => s === 'placed').length;
  return { status: statusOf(states), states, levels, shown: levels.length, done: earned + placed, earned, placed };
}

// { status: 'gold' | null, gold, cards } for a section: how many of its cards are gold, of those that have a status.
export function sectionStatus(progress, section, packs) {
  const cards = section.packs.map((id) => packs.find((p) => p.id === id)).map((p) => cardStatus(progress, p)).filter(Boolean);
  const gold = cards.filter((c) => c.status === 'gold').length;
  return { status: cards.length > 0 && gold === cards.length ? 'gold' : null, gold, cards: cards.length };
}

// The words beside a status: "3 of 5" (levels placed or earned, of those shown), and the status in words for a screen reader.
export const countText = (c) => `${c.done} of ${c.shown}`;
export const STATUS_WORDS = { plain: 'not started', green: 'started', silver: 'more than half done', gold: 'every level earned' };
export const sectionText = (s) => (s.status === 'gold' ? 'Every card gold' : `${s.gold} of ${s.cards} cards gold`);

// ---------- What the student saw last time (the one-time shine and "New levels added!") ----------
//
// A snapshot of every card's status and level states, and every section's, kept on the device when the home screen is shown. The next
// time, anything that improved shines once: a card whose status went up (green, silver, gold), a level that went from placed to earned,
// a section that turned gold. A card that shows more levels than it did (a pack's displayed-level count grew: Strange solutions when its
// Levels 4-5 ship) says "New levels added!" once, and its status is worked out honestly over all of them (a gold card can become silver:
// it keeps every level it earned). The first snapshot on a device shines nothing.

const CODE = { none: 'N', placed: 'P', earned: 'E' };

export function snapshot(progress, packs, sections) {
  const out = { packs: {}, sections: {} };
  for (const p of packs) {
    const c = cardStatus(progress, p);
    if (c) out.packs[p.id] = { status: c.status, shown: c.shown, states: c.states.map((s) => CODE[s]).join('') };
  }
  for (const s of sections) out.sections[s.id] = sectionStatus(progress, s, packs).status ?? 'none';
  return out;
}

// What changed since `seen` (a snapshot, or null): { cards: Set of pack ids to shine, levels: { packId: [saved level numbers] },
// sections: Set of section ids to shine, grew: Set of pack ids that show more levels than before }.
export function changesSince(seen, now, packs) {
  const out = { cards: new Set(), levels: {}, sections: new Set(), grew: new Set() };
  if (!seen || typeof seen !== 'object' || !seen.packs) return out;
  for (const [id, card] of Object.entries(now.packs)) {
    const was = seen.packs[id];
    if (!was || typeof was !== 'object') continue;                     // a card this device has not seen yet: nothing to compare
    if (Number(was.shown) < card.shown) { out.grew.add(id); continue; }
    const pack = packs.find((p) => p.id === id);
    const first = pack?.firstLevel ?? 1;
    const turned = [...card.states].map((s, i) => (s === 'E' && String(was.states ?? '')[i] === 'P' ? first + i : null)).filter(Boolean);
    if (turned.length) out.levels[id] = turned;
    if (rankOf(card.status) > rankOf(was.status) || turned.length) out.cards.add(id);
  }
  for (const [id, status] of Object.entries(now.sections)) {
    if (status === 'gold' && seen.sections?.[id] && seen.sections[id] !== 'gold') out.sections.add(id);
  }
  return out;
}

// What to remember after showing the home screen: the new snapshot, except that a card whose levels grew keeps its "New levels added!"
// until it has been shown (it is shown with this snapshot, so the next one is plain).
export const SEEN_KEY = 'mat.seen.v1';
