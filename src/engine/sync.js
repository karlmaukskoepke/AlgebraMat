// Class-sheet sync: the pure parts (SPEC-SYNC.md). A student is a period and a teacher-given number (anonymous). The phone
// sends its progress, the problems and runs the sheet hasn't seen, and merges the sheet's progress back in: a level
// finished on any device stays finished. No names, nothing identifying.

import { normalizeProgress, mergeProgress } from './progress.js';

export const PROTOCOL = 1;
export const MAX_SENT = 200;          // problems (and, separately, runs) in one request; the rest go in the next

export const cleanId = (v) => String(v ?? '').trim().toUpperCase();
const ID = /^[A-Z0-9]{1,12}$/;
export const validAuth = (a) => Boolean(a) && ID.test(cleanId(a.period)) && ID.test(cleanId(a.number));
export const authOf = (a) => ({ period: cleanId(a.period), number: cleanId(a.number) });
export const studentLabel = (a) => `${cleanId(a.period)}-${cleanId(a.number)}`;

// A class link (the whole https://script.google.com/macros/s/…/exec address) or just its long id, as the address to use.
export function normalizeEndpoint(text) {
  const t = String(text ?? '').trim();
  const full = /^https:\/\/script\.google\.com\/macros\/s\/([\w-]{20,})\/exec$/.exec(t);
  if (full) return t;
  if (/^[\w-]{20,}$/.test(t)) return `https://script.google.com/macros/s/${t}/exec`;
  return null;
}

export const newCursor = () => ({ eventsT: 0, runsT: 0 });

const after = (list, t) => list.filter((x) => Number.isFinite(x?.t) && x.t > t).sort((a, b) => a.t - b.t).slice(0, MAX_SENT);

export function buildRequest({ auth, progress, events, runs, cursor = newCursor() }) {
  const packs = {};
  for (const [id, p] of Object.entries(progress?.packs ?? {})) {
    packs[id] = { levels: [...(p.levels ?? [])].map((d) => d === true) };
    if (Number.isInteger(p.open) && p.open > 1) packs[id].open = p.open;
  }
  return { v: PROTOCOL, auth: authOf(auth), progress: { packs }, events: after(events ?? [], cursor.eventsT), runs: after(runs ?? [], cursor.runsT) };
}

// Where the next request starts, once the sheet has taken this one.
export function advance(cursor, request) {
  const last = (list) => (list.length ? list[list.length - 1].t : null);
  return { eventsT: last(request.events) ?? cursor.eventsT, runsT: last(request.runs) ?? cursor.runsT };
}

// Is there more waiting than one request carries?
export const moreToSend = (request) => request.events.length >= MAX_SENT || request.runs.length >= MAX_SENT;

// The progress after taking the sheet's in: a level finished on either side stays finished.
export function takeFromSheet(progress, fromSheet, packs) {
  if (!fromSheet || typeof fromSheet !== 'object') return progress;
  return mergeProgress(progress, normalizeProgress(fromSheet, packs));
}

// Did merging add anything? (So the screen is redrawn only when it did.)
export function progressChanged(before, after) {
  return JSON.stringify(before.packs) !== JSON.stringify(after.packs);
}
