// The progress object (SPEC §7): which levels of which packs are finished.
// Pure logic, no DOM. Saving (localStorage, save code) comes in Step 6.
//
// { v: 2, packs: { flipit: { levels: [true, false, false, false], placed: [false, true, false, false] } } }
//
// Since Build X a level is none, placed or earned (Karl, 2026-10-26). `levels[i]` true is EARNED: finished by doing it on this card (every
// level saved as finished before Build X is earned: nobody is demoted). `placed[i]` true is PLACED: credited by the placement quiz or by a
// finished level on an older card (the legacy credit), not yet earned; one problem on the level earns it. A level is never both: earned
// beats placed beats none, in every merge. `placed` is left out when nothing is placed. A placed level counts as finished for opening the
// next level, as the credit did before. Save codes and the class sheet's level columns carry earned only (the sheet has its own placed
// column, Code.gs). v 2 marks a save made since Build X; a save without it is read with any legacy credit as earned, as it showed before.

export const PROGRESS_VERSION = 2;

export function newProgress(packs) {
  const out = { v: PROGRESS_VERSION, packs: {} };
  for (const p of packs) {
    if (p.levels && !p.comingSoon) {
      out.packs[p.id] = { levels: Array(p.levels).fill(false) };
      // A card that shows only its later levels (One-step equations, while the new cards replace its first ones) opens at
      // `first`. The saved levels keep their own numbers, so nothing in a save code or on the class sheet is renumbered.
      if (p.firstLevel > 1) out.packs[p.id].first = p.firstLevel;
      // A card that shows only its earlier levels (Strange solutions, Build V: 3 of its 5, the others not built yet) ends at `last`: the
      // levels after it are saved (all false) but are never open, never offered and never needed to complete the card.
      if (p.lastLevel && p.lastLevel < p.levels) out.packs[p.id].last = p.lastLevel;
    }
  }
  return out;
}

const levelsOf = (progress, packId) => progress.packs[packId]?.levels ?? [];
const firstOf = (progress, packId) => progress.packs[packId]?.first ?? 1;
const lastOf = (progress, packId) => progress.packs[packId]?.last ?? levelsOf(progress, packId).length;

export const isLevelEarned = (progress, packId, level) => levelsOf(progress, packId)[level - 1] === true;
export const isLevelPlaced = (progress, packId, level) => !isLevelEarned(progress, packId, level) && progress.packs[packId]?.placed?.[level - 1] === true;
export const levelState = (progress, packId, level) => (isLevelEarned(progress, packId, level) ? 'earned' : isLevelPlaced(progress, packId, level) ? 'placed' : 'none');
// Finished, earned or placed: what opens the next level, and what the old "done" meant.
export const isLevelDone = (progress, packId, level) => isLevelEarned(progress, packId, level) || isLevelPlaced(progress, packId, level);

// Keep an entry tidy: a placed level that is earned is just earned, and no `placed` at all when nothing is placed.
function tidy(entry) {
  if (!entry) return entry;
  if (Array.isArray(entry.placed)) {
    entry.placed = entry.levels.map((earned, i) => !earned && entry.placed[i] === true);
    if (!entry.placed.some(Boolean)) delete entry.placed;
  }
  return entry;
}

// Level 1 is always open; each later level opens when the one before is done, or when the diagnostic opened it
// (`open` is the highest level the diagnostic opened for that pack; the levels below it are open too).
export function isLevelUnlocked(progress, packId, level) {
  const levels = levelsOf(progress, packId);
  if (level < 1 || level > levels.length) return false;
  const first = firstOf(progress, packId);
  if (level < first || level > lastOf(progress, packId)) return false;
  return level === first || isLevelDone(progress, packId, level - 1) || level <= (progress.packs[packId]?.open ?? 0);
}

// The diagnostic opens levels up to `level` in a pack (never closing any that were already open).
export function openLevels(progress, packId, level) {
  const out = structuredClone(progress);
  const entry = out.packs[packId];
  if (!entry) return out;
  entry.open = Math.max(entry.open ?? 0, Math.min(level, entry.levels.length));
  if (entry.open <= 1) delete entry.open;
  return out;
}

// How many levels are finished in all, earned or placed (progress only ever grows, so a save that lowers it is a bug worth a backup;
// a placed level turning earned keeps the count).
export const doneCount = (progress) => Object.values(progress?.packs ?? {}).reduce((n, e) => n
  + (e.levels ?? []).filter((d, i) => d === true || e.placed?.[i] === true).length, 0);

// Every displayed level finished (earned or placed). (Gold, every displayed level earned, is engine/status.js.)
export function isPackComplete(progress, packId) {
  const first = firstOf(progress, packId);
  const last = lastOf(progress, packId);
  return last >= first && levelsOf(progress, packId).length > 0
    && Array.from({ length: last - first + 1 }, (_, i) => isLevelDone(progress, packId, first + i)).every(Boolean);
}

// Earned: the level was finished on this card (a placed level becomes earned; placed never overwrites earned).
export function completeLevel(progress, packId, level) {
  const out = structuredClone(progress);
  const levels = out.packs[packId]?.levels;
  if (!levels || level < 1 || level > levels.length) throw new Error(`No level ${level} in ${packId}`);
  levels[level - 1] = true;
  tidy(out.packs[packId]);
  return out;
}

// Placed: the levels a card displays below `upTo` that are not earned (the placement quiz's levels below the one it starts the student
// at, Build X). Only displayed levels: never a "See why it works" level, never a hidden one.
export function placeLevels(progress, packId, upTo) {
  const out = structuredClone(progress);
  const entry = out.packs[packId];
  if (!entry) return out;
  const top = Math.min(upTo - 1, lastOf(out, packId));
  for (let l = firstOf(out, packId); l <= top; l++) {
    if (entry.levels[l - 1]) continue;
    entry.placed = entry.placed ?? entry.levels.map(() => false);
    entry.placed[l - 1] = true;
  }
  tidy(entry);
  return out;
}

// The level to offer next: the first open level not yet done, or null if all are done.
export function nextLevel(progress, packId) {
  const levels = levelsOf(progress, packId);
  const first = firstOf(progress, packId);
  const i = levels.findIndex((_, k) => k >= first - 1 && k < lastOf(progress, packId) && !isLevelDone(progress, packId, k + 1));
  return i === -1 ? null : i + 1;
}

// ---------- Loading saved progress ----------

// Rebuild a progress object from anything read back (localStorage, a code):
// keep only known packs and levels, fill the rest as unfinished.
// `legacyEarned`: a save from before Build X (no `v: 2`), whose legacy credit showed as finished, keeps it as earned.
export function normalizeProgress(raw, packs, { legacyEarned = false } = {}) {
  const out = newProgress(packs);
  const src = raw && typeof raw === 'object' && raw.packs && typeof raw.packs === 'object' ? raw.packs : {};
  for (const [id, entry] of Object.entries(out.packs)) {
    let levels = Array.isArray(src[id]?.levels) ? src[id].levels : [];
    // Progress saved before Combine it's mixed party-or-battle round (4 levels): the round slots in at Level 3,
    // counted as done once the old Level 3 (three or more numbers, now Level 4) was.
    if (id === 'combineit' && levels.length === 4) levels = [levels[0], levels[1], levels[2], levels[2], levels[3]];
    // Progress saved before Boxes & Circles' "read the model" round (5 levels): the round slots in at Level 2, counted as
    // done once the old Level 2 was, and a level the diagnostic opened shifts with the levels after it.
    let open = src[id]?.open;
    if (id === 'boxes' && levels.length === 5) {
      levels = [levels[0], levels[1], levels[1], levels[2], levels[3], levels[4]];
      if (Number.isInteger(open) && open >= 2) open += 1;
    }
    entry.levels = entry.levels.map((_, i) => levels[i] === true);
    const placed = Array.isArray(src[id]?.placed) ? src[id].placed : [];
    if (placed.some((x) => x === true)) entry.placed = entry.levels.map((_, i) => placed[i] === true);
    tidy(entry);
    if (Number.isInteger(open) && open > 1) entry.open = Math.min(open, entry.levels.length);
  }
  return withLegacyCredit(out, { earned: legacyEarned });
}

// Add to both sides (revision 2.2) replaces One-step equations' first two levels and Switch sides' first four, so a student who
// finished those has not lost anything (Karl, 2026-10-12): L2 ← One-step L1; L3 ← One-step L2; L4 ← Switch sides L1 and L2;
// L5 ← Switch sides L4; L6 ← Switch sides L3 and L4. The numeric Level 1 is new and nothing earns it, so it is left open but
// not required. The old cards' own levels keep their numbers (they are still saved, in codes and on the class sheet), so this
// is worked out each time progress is loaded or merged, and it only ever adds.
const done = (p, id, level) => p.packs[id]?.levels?.[level - 1] === true;
const LEGACY_ADD_BOTH = [
  null,
  (p) => done(p, 'one-step', 1),
  (p) => done(p, 'one-step', 2),
  (p) => done(p, 'switch', 1) && done(p, 'switch', 2),
  (p) => done(p, 'switch', 4),
  (p) => done(p, 'switch', 3) && done(p, 'switch', 4),
];

// Divide it (the numeric Level 1 and the five equation levels): the old One-step `ax = b` level (3) covers its Level 2, and the old
// mixed level (5) its Level 3. Level 1 is never credited, and Levels 4–6 (composite coefficients, mixed) are new.
const LEGACY_DIVIDE = [null, (p) => done(p, 'one-step', 3), (p) => done(p, 'one-step', 5)];

// Two-step equations, the new card (Build K): an old level counts where its problems are the same form. Old Two-step L1 (ax + b) → 1;
// L2 (ax − b) → 2; L4 (the three forms with x on the right) → 3; L3 (b + ax) → 4; L5 (b − ax) → 5; L6 (negative answers) → 6; L7 (all mixed)
// → 7. Switch sides' two-step levels: L5 (ax + b, ax − b and b + ax, positive answers) → 1, 2 and 4; L6 (negative answers, some turned
// round) → 6. Nothing else is credited.
const LEGACY_TWO_STEP = [
  (p) => done(p, 'two-step', 1) || done(p, 'switch', 5),
  (p) => done(p, 'two-step', 2) || done(p, 'switch', 5),
  (p) => done(p, 'two-step', 4),
  (p) => done(p, 'two-step', 3) || done(p, 'switch', 5),
  (p) => done(p, 'two-step', 5),
  (p) => done(p, 'two-step', 6) || done(p, 'switch', 6),
  (p) => done(p, 'two-step', 7),
];

// The new Two-step card's level for an old Two-step level, read off the table above (the level an old level credits on its own).
export function newTwoStepLevel(oldLevel) {
  const only = { packs: { 'two-step': { levels: Array.from({ length: 7 }, (_, i) => i === oldLevel - 1) } } };
  const i = LEGACY_TWO_STEP.findIndex((rule) => rule(only));
  return i + 1;
}

// Since Build X the credit is PLACED (the student earns it with one problem on the level); before, it was written as finished, and those
// levels stay earned. `earned` writes it as earned: a save from before Build X, whose credit showed as finished.
function creditPack(progress, id, rules, earned) {
  const entry = progress.packs[id];
  if (!entry) return;
  let top = 0;
  rules.forEach((rule, i) => {
    if (rule && rule(progress) && !entry.levels[i]) {
      if (earned) entry.levels[i] = true;
      else { entry.placed = entry.placed ?? entry.levels.map(() => false); entry.placed[i] = true; }
    }
    if (entry.levels[i] || entry.placed?.[i]) top = i + 1;
  });
  tidy(entry);
  if (top >= 2) entry.open = Math.max(entry.open ?? 0, top);
}

// Fractions of x (Build AA): the old One-step `x/a = b` level (4) or its mixed level (5) places Levels 1 and 2 (unit fractions, the model
// and the algebra); nothing credits Levels 3-6.
const LEGACY_FRACTIONS = [
  (p) => done(p, 'one-step', 4) || done(p, 'one-step', 5),
  (p) => done(p, 'one-step', 4) || done(p, 'one-step', 5),
];

export function withLegacyCredit(progress, { earned = false } = {}) {
  creditPack(progress, 'fractions-of-x', LEGACY_FRACTIONS, false);
  creditPack(progress, 'add-both', LEGACY_ADD_BOTH, earned);
  creditPack(progress, 'divide-it', LEGACY_DIVIDE, earned);
  creditPack(progress, 'two-step-equations', LEGACY_TWO_STEP, earned);
  return progress;
}

// Union of two progress objects: a level finished in either stays finished, earned beats placed beats none.
export function mergeProgress(a, b) {
  const out = structuredClone(a);
  for (const [id, entry] of Object.entries(out.packs)) {
    const other = b.packs[id]?.levels ?? [];
    const otherPlaced = b.packs[id]?.placed ?? [];
    const placed = entry.levels.map((_, i) => entry.placed?.[i] === true || otherPlaced[i] === true);
    entry.levels = entry.levels.map((done, i) => done || other[i] === true);
    if (placed.some(Boolean)) entry.placed = placed;
    tidy(entry);
    const open = Math.max(entry.open ?? 0, b.packs[id]?.open ?? 0);
    if (open > 1) entry.open = open;
  }
  return out;
}

// ---------- Save code ----------
//
// "MAT-" + [version][data…][checksum], using 31 symbols with no look-alikes
// (no 0/O, no 1/I/L). The SPEC says "base32", but removing those five from
// 0–9A–Z leaves 31, so codes are base 31. Data is a bitmask of finished
// levels, packed in each layout's pack order.
//
//   v1: 2 data symbols (961 values):    Flip It (4 bits)          → MAT-XXXX
//   v2: 3 data symbols (29,791 values): Flip It (4) + Group It (7)   → MAT-XXXXX
//   v3: 4 data symbols (923,521 values): + Boxes & Circles (5)      → MAT-XXXXXX
//   v4: + Groups of Terms (8);  v5: Flip It 5 levels, + Combine it (4)
//   v6: 7 data symbols (about 34.7 bits): + Distribute, then combine (5)  → MAT-XXXXXXXXX (34 bits in use)
//   v7: 8 data symbols (about 39.6 bits): Combine it gains a level (5), 35 bits in use
//   v8: Boxes & Circles gains a level (6), 36 bits in use
//   v9: 9 data symbols (about 44.6 bits): + Value it (5, room for its later levels), 41 bits in use
//   v10: 10 data symbols (about 49.5 bits): + One-step equations (8, room for its later levels), 49 bits in use
//   v11: 12 data symbols (about 59.4 bits): + Two-step equations (8, room for one more level), 57 bits in use
//   v12: 13 data symbols (about 64.4 bits): + Switch sides (6), 63 bits in use
//   v13: 14 data symbols (about 69.4 bits): + Add to both sides (6), 69 bits in use
//   v14: 16 data symbols (about 79.3 bits): + Divide it (6), 75 bits in use
//   v15: 17 data symbols (about 84.2 bits): + Flip everything (6), 81 bits in use (Build J)
//   v16: 18 data symbols (about 89.2 bits): + Two-step equations, the new card (7), 88 bits in use (Build K)
//   v17: 19 data symbols (about 94.1 bits): + Distribute, combine, solve (5), 93 bits in use (Build M)
//
// The data is a whole number of up to 75 bits, so it is worked out with BigInt: a plain JavaScript number holds only 53 bits
// exactly, and v11 and v12 codes (57 and 63 bits) were written with plain numbers, which rounded the low bits (Count it and
// Build it's levels). Those codes can still be read, but what they carry for those cards may be wrong; v13 is exact.
//
//   v18-v20: + Variables on both sides (5), Distribute more (5), Strange solutions (5): 108 bits in 22 symbols
//   v21: 24 data symbols (about 118.9 bits): + Fractions of x (6), 114 bits in use (Build AA)
//
// New codes are always v21 (the line said v17 until Build AA; it was v20); older codes (written down earlier) still work, and a code from before Combine it's
// mixed round (or Boxes & Circles' read-the-model round) brings its levels back in the right places (see
// normalizeProgress). (Group It's pack id is still `lasso`.) v8 uses 36 of about 39.6 bits.

export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const CODE_PREFIX = 'MAT';
const BASE = CODE_ALPHABET.length; // 31 (prime, which makes the checksum strong)
const LAYOUTS = {
  1: { data: 2, packs: [{ id: 'flipit', levels: 4 }] },
  2: { data: 3, packs: [{ id: 'flipit', levels: 4 }, { id: 'lasso', levels: 7 }] },
  3: { data: 4, packs: [{ id: 'flipit', levels: 4 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 5 }] },
  4: {
    data: 5,
    packs: [{ id: 'flipit', levels: 4 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 5 }, { id: 'groups-of-terms', levels: 8 }],
  },
  5: {
    data: 6,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 5 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 4 },
    ],
  },
  6: {
    data: 7,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 5 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 4 }, { id: 'distribute-combine', levels: 5 },
    ],
  },
  7: {
    data: 8,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 5 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
    ],
  },
  8: {
    data: 8,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
    ],
  },
  // Value it, with room for 5 levels (it has 3 now; the fractions come next), so adding them won't need a new version.
  9: {
    data: 9,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 },
    ],
  },
  // One-step equations, with room for 8 levels (5 now; negatives and fractions come later), 49 bits in use.
  10: {
    data: 10,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 },
    ],
  },
  // Two-step equations, with room for 8 levels (7 now), 57 bits in use.
  11: {
    data: 12,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 }, { id: 'two-step', levels: 8 },
    ],
  },
  // Switch sides, 6 levels, 63 of about 64.4 bits.
  12: {
    data: 13,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 }, { id: 'two-step', levels: 8 }, { id: 'switch', levels: 6 },
    ],
  },
  // Add to both sides, 6 levels: 69 of about 69.4 bits. The old cards keep their places (One-step equations and Two-step still
  // play, and Switch sides' last levels are for the two-step card that replaces it); the old ones retire when theirs ships.
  13: {
    data: 14,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 }, { id: 'two-step', levels: 8 }, { id: 'switch', levels: 6 },
      { id: 'add-both', levels: 6 },
    ],
  },
  // Divide it, 6 levels (a numeric Level 1 and five equation levels): 75 bits, in 16 symbols.
  14: {
    data: 16,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 }, { id: 'two-step', levels: 8 }, { id: 'switch', levels: 6 },
      { id: 'add-both', levels: 6 }, { id: 'divide-it', levels: 6 },
    ],
  },
  // Flip everything, 6 levels (Build J), appended at the end: 81 bits, in 17 symbols (about 84.2 bits). v1-v14 codes read as before.
  15: {
    data: 17,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 }, { id: 'two-step', levels: 8 }, { id: 'switch', levels: 6 },
      { id: 'add-both', levels: 6 }, { id: 'divide-it', levels: 6 }, { id: 'flip-everything', levels: 6 },
    ],
  },
  // Two-step equations, the new card, 7 levels (Build K), appended at the end: 88 bits, in 18 symbols. v1-v15 codes read as before.
  16: {
    data: 18,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 }, { id: 'two-step', levels: 8 }, { id: 'switch', levels: 6 },
      { id: 'add-both', levels: 6 }, { id: 'divide-it', levels: 6 }, { id: 'flip-everything', levels: 6 }, { id: 'two-step-equations', levels: 7 },
    ],
  },
  // Distribute, combine, solve, 5 levels (Build M), appended at the end: 93 bits, in 19 symbols (about 94.1). v1-v16 codes read as before.
  17: {
    data: 19,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 }, { id: 'two-step', levels: 8 }, { id: 'switch', levels: 6 },
      { id: 'add-both', levels: 6 }, { id: 'divide-it', levels: 6 }, { id: 'flip-everything', levels: 6 }, { id: 'two-step-equations', levels: 7 },
      { id: 'distribute-solve', levels: 5 },
    ],
  },
  // Variables on both sides, 5 levels (Build R), appended at the end: 98 bits, in 20 symbols (about 99.1). v1-v17 codes read as before.
  18: {
    data: 20,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 }, { id: 'two-step', levels: 8 }, { id: 'switch', levels: 6 },
      { id: 'add-both', levels: 6 }, { id: 'divide-it', levels: 6 }, { id: 'flip-everything', levels: 6 }, { id: 'two-step-equations', levels: 7 },
      { id: 'distribute-solve', levels: 5 }, { id: 'variables-both-sides', levels: 5 },
    ],
  },
  // Distribute more, 5 levels (Build U), appended at the end: 103 bits, in 21 symbols (about 104.1). v1-v18 codes read as before.
  19: {
    data: 21,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 }, { id: 'two-step', levels: 8 }, { id: 'switch', levels: 6 },
      { id: 'add-both', levels: 6 }, { id: 'divide-it', levels: 6 }, { id: 'flip-everything', levels: 6 }, { id: 'two-step-equations', levels: 7 },
      { id: 'distribute-solve', levels: 5 }, { id: 'variables-both-sides', levels: 5 }, { id: 'distribute-more', levels: 5 },
    ],
  },
  // Strange solutions, 5 levels (Build V; 3 shown until V2), appended at the end: 108 bits, in 22 symbols (about 109.0). v1-v19 codes read
  // as before.
  20: {
    data: 22,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 }, { id: 'two-step', levels: 8 }, { id: 'switch', levels: 6 },
      { id: 'add-both', levels: 6 }, { id: 'divide-it', levels: 6 }, { id: 'flip-everything', levels: 6 }, { id: 'two-step-equations', levels: 7 },
      { id: 'distribute-solve', levels: 5 }, { id: 'variables-both-sides', levels: 5 }, { id: 'distribute-more', levels: 5 }, { id: 'strange-solutions', levels: 5 },
    ],
  },
  // Fractions of x, 6 levels (Build AA), appended at the end: 114 bits, in 24 symbols (about 118.9; 23 hold only about 113.9). v1-v20 codes
  // read as before.
  21: {
    data: 24,
    packs: [
      { id: 'flipit', levels: 5 }, { id: 'lasso', levels: 7 }, { id: 'boxes', levels: 6 },
      { id: 'groups-of-terms', levels: 8 }, { id: 'combineit', levels: 5 }, { id: 'distribute-combine', levels: 5 },
      { id: 'value', levels: 5 }, { id: 'one-step', levels: 8 }, { id: 'two-step', levels: 8 }, { id: 'switch', levels: 6 },
      { id: 'add-both', levels: 6 }, { id: 'divide-it', levels: 6 }, { id: 'flip-everything', levels: 6 }, { id: 'two-step-equations', levels: 7 },
      { id: 'distribute-solve', levels: 5 }, { id: 'variables-both-sides', levels: 5 }, { id: 'distribute-more', levels: 5 }, { id: 'strange-solutions', levels: 5 },
      { id: 'fractions-of-x', levels: 6 },
    ],
  },
};
export const CODE_VERSION = 21;

// Weighted sum mod 31. Weights 2, 3, 4, … are all nonzero mod 31 and differ
// by 1 between neighbors, so any single typo or neighbor swap is caught.
const checksum = (values) => values.reduce((sum, v, i) => sum + (i + 2) * v, 0) % BASE;

const BIG_BASE = BigInt(BASE);

function toDigits(value, count) {
  const out = [];
  let v = value;
  for (let i = 0; i < count; i++) {
    out.unshift(Number(v % BIG_BASE));
    v /= BIG_BASE;
  }
  return out;
}

const fromDigits = (digits) => digits.reduce((v, x) => v * BIG_BASE + BigInt(x), 0n);

// A code carries EARNED levels only (Build X): a placed level is not in it, so a restored code gives back earned levels, and any legacy
// credit is worked out again from the old cards' levels, as placed. What the placement quiz placed is not in a code (it is on the device
// and in the class sheet's placed column); a teacher moving a student by code moves their earned levels.
export function encodeProgress(progress, version = CODE_VERSION) {
  const layout = LAYOUTS[version];
  let bits = 0n;
  let shift = 0;
  for (const { id, levels } of layout.packs) {
    const done = progress.packs[id]?.levels ?? [];
    for (let i = 0; i < levels; i++) if (done[i] === true) bits += 1n << BigInt(shift + i);
    shift += levels;
  }
  const values = [version, ...toDigits(bits, layout.data)];
  values.push(checksum(values));
  return `${CODE_PREFIX}-${values.map((v) => CODE_ALPHABET[v]).join('')}`;
}

// Returns a progress object, or null if the code doesn't check out.
// Forgiving about case, spaces, dashes and a missing "MAT" prefix.
export function decodeProgress(code, packs) {
  if (typeof code !== 'string') return null;
  let s = code.toUpperCase().replace(/[\s-]/g, '');
  const lengths = Object.values(LAYOUTS).map((l) => l.data + 2);
  if (s.startsWith(CODE_PREFIX) && lengths.includes(s.length - CODE_PREFIX.length)) s = s.slice(CODE_PREFIX.length);
  const values = [...s].map((ch) => CODE_ALPHABET.indexOf(ch));
  if (values.length < 3 || values.some((v) => v < 0)) return null;
  const [version] = values;
  const layout = LAYOUTS[version];
  if (!layout || values.length !== layout.data + 2) return null;
  const check = values[values.length - 1];
  const body = values.slice(0, -1);
  if (checksum(body) !== check) return null;

  const bits = fromDigits(body.slice(1));
  const raw = { packs: {} };
  let shift = 0;
  for (const { id, levels } of layout.packs) {
    raw.packs[id] = { levels: Array.from({ length: levels }, (_, i) => ((bits >> BigInt(shift + i)) & 1n) === 1n) };
    shift += levels;
  }
  if (bits >= 1n << BigInt(shift)) return null; // bits set for packs this version doesn't have
  return normalizeProgress(raw, packs);
}
