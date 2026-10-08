// The progress object (SPEC §7): which levels of which packs are finished.
// Pure logic, no DOM. Saving (localStorage, save code) comes in Step 6.
//
// { v: 1, packs: { flipit: { levels: [true, false, false, false] } } }

export const PROGRESS_VERSION = 1;

export function newProgress(packs) {
  const out = { v: PROGRESS_VERSION, packs: {} };
  for (const p of packs) {
    if (p.levels && !p.comingSoon) out.packs[p.id] = { levels: Array(p.levels).fill(false) };
  }
  return out;
}

const levelsOf = (progress, packId) => progress.packs[packId]?.levels ?? [];

export const isLevelDone = (progress, packId, level) => levelsOf(progress, packId)[level - 1] === true;

// Level 1 is always open; each later level opens when the one before is done, or when the diagnostic opened it
// (`open` is the highest level the diagnostic opened for that pack; the levels below it are open too).
export function isLevelUnlocked(progress, packId, level) {
  const levels = levelsOf(progress, packId);
  if (level < 1 || level > levels.length) return false;
  return level === 1 || levels[level - 2] === true || level <= (progress.packs[packId]?.open ?? 0);
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

export function isPackComplete(progress, packId) {
  const levels = levelsOf(progress, packId);
  return levels.length > 0 && levels.every(Boolean);
}

export function completeLevel(progress, packId, level) {
  const out = structuredClone(progress);
  const levels = out.packs[packId]?.levels;
  if (!levels || level < 1 || level > levels.length) throw new Error(`No level ${level} in ${packId}`);
  levels[level - 1] = true;
  return out;
}

// The level to offer next: the first open level not yet done, or null if all are done.
export function nextLevel(progress, packId) {
  const levels = levelsOf(progress, packId);
  const i = levels.findIndex((done) => !done);
  return i === -1 ? null : i + 1;
}

// ---------- Loading saved progress ----------

// Rebuild a progress object from anything read back (localStorage, a code):
// keep only known packs and levels, fill the rest as unfinished.
export function normalizeProgress(raw, packs) {
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
    if (Number.isInteger(open) && open > 1) entry.open = Math.min(open, entry.levels.length);
  }
  return out;
}

// Union of two progress objects: a level finished in either stays finished.
export function mergeProgress(a, b) {
  const out = structuredClone(a);
  for (const [id, entry] of Object.entries(out.packs)) {
    const other = b.packs[id]?.levels ?? [];
    entry.levels = entry.levels.map((done, i) => done || other[i] === true);
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
//
// New codes are always v10; older codes (written down earlier) still work, and a code from before Combine it's
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
};
export const CODE_VERSION = 10;

// Weighted sum mod 31. Weights 2, 3, 4, … are all nonzero mod 31 and differ
// by 1 between neighbors, so any single typo or neighbor swap is caught.
const checksum = (values) => values.reduce((sum, v, i) => sum + (i + 2) * v, 0) % BASE;

function toDigits(value, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.unshift(value % BASE);
    value = Math.floor(value / BASE);
  }
  return out;
}

const fromDigits = (digits) => digits.reduce((v, x) => v * BASE + x, 0);

export function encodeProgress(progress, version = CODE_VERSION) {
  const layout = LAYOUTS[version];
  let bits = 0;
  let shift = 0;
  for (const { id, levels } of layout.packs) {
    const done = progress.packs[id]?.levels ?? [];
    for (let i = 0; i < levels; i++) if (done[i] === true) bits += 2 ** (shift + i);
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
    raw.packs[id] = { levels: Array.from({ length: levels }, (_, i) => Math.floor(bits / 2 ** (shift + i)) % 2 === 1) };
    shift += levels;
  }
  if (bits >= 2 ** shift) return null; // bits set for packs this version doesn't have
  return normalizeProgress(raw, packs);
}
