// The levels a student has started with help on this device (Build AE): a level started is "in progress" and opens straight into play,
// with no chooser ("Start with help" or "Try with no help"). Remembered in this browser only, under its own key (`mat.started.v1`,
// { packId: [saved level numbers] }): never in the save code, never synced, never on the class sheet. If storage is refused, nothing is
// remembered and the chooser simply asks again: the safe side (Start with help is always the default).

export const STARTED_KEY = 'mat.started.v1';

const defaultStore = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
function read(store) {
  try {
    const v = JSON.parse(store.getItem(STARTED_KEY));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch { return {}; }
}
export function levelStarted(packId, level, { store = defaultStore() } = {}) {
  if (!store) return false;
  const list = read(store)[packId];
  return Array.isArray(list) && list.includes(level);
}
export function markStarted(packId, level, { store = defaultStore() } = {}) {
  if (!store) return;
  try {
    const all = read(store);
    const list = Array.isArray(all[packId]) ? all[packId] : [];
    if (!list.includes(level)) store.setItem(STARTED_KEY, JSON.stringify({ ...all, [packId]: [...list, level] }));
  } catch { /* storage refused or full */ }
}
