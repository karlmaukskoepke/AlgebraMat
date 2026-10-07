// What this device remembers about the class sheet (mat.sync.v1): the class address, who the student is, and how much has
// been sent. Fails quietly like the other stores.

import { newCursor } from './engine/sync.js';

export const SYNC_KEY = 'mat.sync.v1';
const empty = () => ({ endpoint: null, auth: null, cursor: newCursor(), lastSync: null });

export function loadSync() {
  try {
    const raw = JSON.parse(localStorage.getItem(SYNC_KEY));
    if (!raw || typeof raw !== 'object') return empty();
    return {
      endpoint: typeof raw.endpoint === 'string' ? raw.endpoint : null,
      auth: raw.auth && typeof raw.auth.period === 'string' && typeof raw.auth.number === 'string' ? { period: raw.auth.period, number: raw.auth.number } : null,
      cursor: { eventsT: Number(raw.cursor?.eventsT) || 0, runsT: Number(raw.cursor?.runsT) || 0 },
      lastSync: Number.isFinite(raw.lastSync) ? raw.lastSync : null,
    };
  } catch { return empty(); }
}

export function saveSync(state) {
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(state)); } catch { /* storage blocked or full */ }
}
