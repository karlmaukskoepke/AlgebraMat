// Light mode's per-device memory (SPEC-SCAFFOLD.md §5 and §6): which supports are on, and the anonymous log of
// problems. Both live in this device's localStorage under their own keys, are never sent anywhere, and fail
// quietly (a blocked or full store means light mode just starts fresh each visit).

import { emptySkills, readSkills, afterProblem } from './engine/skills.js';
import { makeRecord, appendRecord } from './engine/eventlog.js';

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
