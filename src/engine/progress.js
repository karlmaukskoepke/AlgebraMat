// The progress object (SPEC §7): which levels of which packs are finished.
// Pure logic, no DOM. Saving (localStorage, save code) comes in Step 6.
//
// { v: 1, packs: { flipit: { levels: [true, false, false, false] } } }

export const PROGRESS_VERSION = 1;

export function newProgress(packs) {
  const out = { v: PROGRESS_VERSION, packs: {} };
  for (const p of packs) {
    if (p.levels) out.packs[p.id] = { levels: Array(p.levels).fill(false) };
  }
  return out;
}

const levelsOf = (progress, packId) => progress.packs[packId]?.levels ?? [];

export const isLevelDone = (progress, packId, level) => levelsOf(progress, packId)[level - 1] === true;

// Level 1 is always open; each later level opens when the one before is done.
export function isLevelUnlocked(progress, packId, level) {
  const levels = levelsOf(progress, packId);
  if (level < 1 || level > levels.length) return false;
  return level === 1 || levels[level - 2] === true;
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
    const levels = Array.isArray(src[id]?.levels) ? src[id].levels : [];
    entry.levels = entry.levels.map((_, i) => levels[i] === true);
  }
  return out;
}

// Union of two progress objects: a level finished in either stays finished.
export function mergeProgress(a, b) {
  const out = structuredClone(a);
  for (const [id, entry] of Object.entries(out.packs)) {
    const other = b.packs[id]?.levels ?? [];
    entry.levels = entry.levels.map((done, i) => done || other[i] === true);
  }
  return out;
}

// ---------- Save code ----------
//
// "MAT-" + 4 symbols: [version][data][data][checksum].
// Symbols: 31 characters with no look-alikes (no 0/O, no 1/I/L). The SPEC
// says "base32", but taking those five out of 0–9A–Z leaves 31, so the code
// is base 31. v1 data is a bitmask of finished levels, packed in PACK_BITS
// order: Flip It uses bits 0–3, and the rest of the two data symbols
// (31² = 961 values, about 9 bits) is room for the next pack. A future
// version symbol can change the layout.

export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const CODE_PREFIX = 'MAT';
const BASE = CODE_ALPHABET.length; // 31 (prime, which makes the checksum strong)
const CODE_VERSION = 1;
const PACK_BITS = [{ id: 'flipit', levels: 4 }];

const checksum = (values) => values.reduce((sum, v, i) => sum + (i + 2) * v, 0) % BASE;

export function encodeProgress(progress) {
  let bits = 0;
  let shift = 0;
  for (const { id, levels } of PACK_BITS) {
    const done = progress.packs[id]?.levels ?? [];
    for (let i = 0; i < levels; i++) if (done[i] === true) bits |= 1 << (shift + i);
    shift += levels;
  }
  const values = [CODE_VERSION, Math.floor(bits / BASE), bits % BASE];
  values.push(checksum(values));
  return `${CODE_PREFIX}-${values.map((v) => CODE_ALPHABET[v]).join('')}`;
}

// Returns a progress object, or null if the code doesn't check out.
// Forgiving about case, spaces, dashes and a missing "MAT" prefix.
export function decodeProgress(code, packs) {
  if (typeof code !== 'string') return null;
  let s = code.toUpperCase().replace(/[\s-]/g, '');
  if (s.startsWith(CODE_PREFIX) && s.length === CODE_PREFIX.length + 4) s = s.slice(CODE_PREFIX.length);
  if (s.length !== 4) return null;
  const values = [...s].map((ch) => CODE_ALPHABET.indexOf(ch));
  if (values.some((v) => v < 0)) return null;
  const [version, hi, lo, check] = values;
  if (checksum([version, hi, lo]) !== check || version !== CODE_VERSION) return null;
  const bits = hi * BASE + lo;
  const raw = { packs: {} };
  let shift = 0;
  for (const { id, levels } of PACK_BITS) {
    raw.packs[id] = { levels: Array.from({ length: levels }, (_, i) => Boolean(bits & (1 << (shift + i)))) };
    shift += levels;
  }
  if (bits >= 1 << shift) return null; // bits set for packs that don't exist yet
  return normalizeProgress(raw, packs);
}
