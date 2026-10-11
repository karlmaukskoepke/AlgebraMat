// Which tutorials this student has played through, on this device (mat.tutorials.v1). A tutorial plays once, then only by
// choice (Karl, 2026-10-11): it justifies the new move, but it is never a barrier. A blocked store just means it plays
// each time, which is harmless.

export const TUTORIALS_KEY = 'mat.tutorials.v1';

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(TUTORIALS_KEY));
    return raw && typeof raw === 'object' ? raw : {};
  } catch { return {}; }
}

export const tutorialSeen = (kind) => read()[kind] === true;

export function markTutorialSeen(kind) {
  try { localStorage.setItem(TUTORIALS_KEY, JSON.stringify({ ...read(), [kind]: true })); } catch { /* storage blocked */ }
}

// The tutorials a level of Add to both sides calls for, in the order they play: add (every level), trade places (from L4),
// cross the border (L6). `all` includes the ones already played (a replay by choice).
export function tutorialsFor(level, { all = false } = {}) {
  const kinds = ['add', ...(level >= 4 ? ['trade'] : []), ...(level >= 6 ? ['cross'] : [])];
  return all ? kinds : kinds.filter((k) => !tutorialSeen(k));
}
