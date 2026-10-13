// What this device remembers about the class sheet (mat.sync.v1): the class address, who the student is, and how much has
// been sent. Fails quietly like the other stores.

import { newCursor } from './engine/sync.js';

export const SYNC_KEY = 'mat.sync.v1';
const empty = () => ({ endpoint: null, auth: null, cursor: newCursor(), lastSync: null });

// A Google sign-in is kept as this device's own token ({ mode: 'device', id, token, label }); an older number sign-in as a period and a
// number. Dropping the device token on load signed every Google student out at each page load (the bug that stopped sign-in lasting).
function savedAuth(a) {
  if (!a || typeof a !== 'object') return null;
  if (a.mode === 'device') return typeof a.id === 'string' && a.id !== '' && typeof a.token === 'string' && a.token !== '' ? { mode: 'device', id: a.id, token: a.token, label: typeof a.label === 'string' ? a.label : '' } : null;
  return typeof a.period === 'string' && typeof a.number === 'string' ? { period: a.period, number: a.number } : null;
}

export function loadSync() {
  try {
    const raw = JSON.parse(localStorage.getItem(SYNC_KEY));
    if (!raw || typeof raw !== 'object') return empty();
    return {
      endpoint: typeof raw.endpoint === 'string' ? raw.endpoint : null,
      auth: savedAuth(raw.auth),
      cursor: { eventsT: Number(raw.cursor?.eventsT) || 0, runsT: Number(raw.cursor?.runsT) || 0 },
      lastSync: Number.isFinite(raw.lastSync) ? raw.lastSync : null,
    };
  } catch { return empty(); }
}

export function saveSync(state) {
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(state)); } catch { /* storage blocked or full */ }
}
