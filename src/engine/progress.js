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
