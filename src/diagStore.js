// The diagnostics' saved places, on this device (mat.diag.v2): one per section of the home screen (Count it, Build it).
// Stopping part way keeps the answers, but a diagnostic isn't done until its last problem. Fails quietly like the other
// stores. (mat.diag.v1, from when there was one diagnostic of every card, is split between the sections the first time.)

import { totalOf, probesOf } from './engine/diagnostic.js';

export const DIAG_KEY = 'mat.diag.v2';
export const OLD_DIAG_KEY = 'mat.diag.v1';

// Whatever was saved for a section, as a clean state or null.
export function readDiag(raw, section = 'all') {
  if (!raw || typeof raw !== 'object' || !Number.isInteger(raw.seed) || raw.seed < 0) return null;
  const total = totalOf(section);
  const answers = Array.isArray(raw.answers) ? raw.answers.slice(0, total)
    .map((a) => ({ typed: typeof a?.typed === 'string' ? a.typed.slice(0, 24) : '', skipped: Boolean(a?.skipped) })) : [];
  return { seed: raw.seed, section, index: answers.length, entry: '', answers, done: answers.length >= total };
}

// The old single diagnostic's answers, cut into the sections' parts (same seed, so every problem is the same one).
export function splitOldDiag(raw) {
  if (!raw || typeof raw !== 'object' || !Number.isInteger(raw.seed) || !Array.isArray(raw.answers)) return {};
  const out = {};
  let at = 0;
  for (const section of ['count', 'build']) {
    const count = probesOf(section).filter((p) => p.pack !== 'value').reduce((n, p) => n + p.levels.length, 0);
    const mine = raw.answers.slice(at, at + count);
    if (mine.length) out[section] = { seed: raw.seed, answers: mine };
    at += count;
  }
  return out;
}

function readAll() {
  try {
    const v2 = JSON.parse(localStorage.getItem(DIAG_KEY));
    if (v2 && typeof v2 === 'object') return v2;
  } catch { /* fall through to the old key */ }
  try { return splitOldDiag(JSON.parse(localStorage.getItem(OLD_DIAG_KEY))); } catch { return {}; }
}

export function loadDiag(section) {
  return readDiag(readAll()[section], section);
}

export function saveDiag(state) {
  const all = readAll();
  all[state.section] = { seed: state.seed, answers: state.answers };
  try { localStorage.setItem(DIAG_KEY, JSON.stringify(all)); } catch { /* storage blocked or full */ }
}

export function clearDiag(section) {
  const all = readAll();
  delete all[section];
  try { localStorage.setItem(DIAG_KEY, JSON.stringify(all)); } catch { /* storage blocked */ }
}
