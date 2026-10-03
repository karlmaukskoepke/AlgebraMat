// The fluency challenges' runs, on this device (mat.fluency.v1). Fails quietly like the other stores.

import { readRuns, addRun } from './engine/highscores.js';

export const FLUENCY_KEY = 'mat.fluency.v1';

export function loadRuns() {
  try { return readRuns(JSON.parse(localStorage.getItem(FLUENCY_KEY))); } catch { return []; }
}

// Save one finished round; returns the runs including it.
export function saveRun(run) {
  const runs = addRun(loadRuns(), run);
  try { localStorage.setItem(FLUENCY_KEY, JSON.stringify(runs)); } catch { /* storage blocked or full */ }
  return runs;
}
