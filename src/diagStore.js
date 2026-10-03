// The diagnostic's saved place, on this device (mat.diag.v1): stopping part way keeps the answers, but it isn't done
// until the last problem. Fails quietly like the other stores.

import { TOTAL } from './engine/diagnostic.js';

export const DIAG_KEY = 'mat.diag.v1';

// Whatever was saved, as a clean state or null.
export function readDiag(raw) {
  if (!raw || typeof raw !== 'object' || !Number.isInteger(raw.seed) || raw.seed < 0) return null;
  const answers = Array.isArray(raw.answers) ? raw.answers.slice(0, TOTAL)
    .map((a) => ({ typed: typeof a?.typed === 'string' ? a.typed.slice(0, 24) : '', skipped: Boolean(a?.skipped) })) : [];
  return { seed: raw.seed, index: answers.length, entry: '', answers, done: answers.length >= TOTAL };
}

export function loadDiag() {
  try { return readDiag(JSON.parse(localStorage.getItem(DIAG_KEY))); } catch { return null; }
}

export function saveDiag(state) {
  try { localStorage.setItem(DIAG_KEY, JSON.stringify({ seed: state.seed, answers: state.answers })); } catch { /* storage blocked or full */ }
}

export function clearDiag() {
  try { localStorage.removeItem(DIAG_KEY); } catch { /* storage blocked */ }
}
