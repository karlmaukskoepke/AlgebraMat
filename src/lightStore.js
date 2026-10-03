// Light mode's per-device memory (SPEC-SCAFFOLD.md §5 and §6): which supports are on, and the anonymous log of
// problems. Both live in this device's localStorage under their own keys, are never sent anywhere, and fail
// quietly (a blocked or full store means light mode just starts fresh each visit).

import { emptySkills, readSkills, afterProblem } from './engine/skills.js';
import { makeRecord, appendRecord } from './engine/eventlog.js';
import { readBests, withBest, bestFor } from './engine/streak.js';

export const SKILLS_KEY = 'mat.skills.v1';
export const LOG_KEY = 'mat.events.v1';

function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked or full */ }
}

export const loadSkills = () => (readJson(SKILLS_KEY) ? readSkills(readJson(SKILLS_KEY)) : emptySkills());
export const loadLog = () => (Array.isArray(readJson(LOG_KEY)) ? readJson(LOG_KEY) : []);

// A problem is finished (right, by the typed answer or by the full walk): update the supports and log it.
export function recordProblem(session, meta) {
  const skills = afterProblem(loadSkills(), {
    tags: session.tags, wrongs: session.wrongs, stuck: session.stuck, on: session.on,
  });
  writeJson(SKILLS_KEY, skills);
  writeJson(LOG_KEY, appendRecord(loadLog(), makeRecord(session, { t: Date.now(), ...meta })));
  return skills;
}

// ---------- The tour (SPEC-SCAFFOLD.md §1b) ----------

export const TOUR_KEY = 'mat.tour.v1';

// Has this device seen the spotlight tour? (A blocked store means it shows each visit, which is harmless.)
export function tourSeen() {
  try { return localStorage.getItem(TOUR_KEY) === 'seen'; } catch { return false; }
}

export function markTourSeen() {
  try { localStorage.setItem(TOUR_KEY, 'seen'); } catch { /* storage blocked */ }
}

// ---------- One-step tips (SPEC-SCAFFOLD.md §8): shown once per device each ----------

export const TIPS_KEY = 'mat.tips.v1';

export function tipSeen(id) {
  const seen = readJson(TIPS_KEY);
  return Array.isArray(seen) && seen.includes(id);
}

export function markTipSeen(id) {
  const seen = readJson(TIPS_KEY);
  const list = Array.isArray(seen) ? seen : [];
  if (!list.includes(id)) writeJson(TIPS_KEY, [...list, id]);
}

// ---------- Streaks (SPEC-SCAFFOLD.md §9): the best run of clean answers, per card and level, on this device ----------

export const STREAKS_KEY = 'mat.streaks.v1';

export const loadBests = () => readBests(readJson(STREAKS_KEY));

// A streak just ended or grew: keep it if it beats the best. Returns the best for that level.
export function saveBest(pack, level, n) {
  const bests = loadBests();
  const next = withBest(bests, pack, level, n);
  if (next !== bests) writeJson(STREAKS_KEY, next);
  return bestFor(next, pack, level);
}
