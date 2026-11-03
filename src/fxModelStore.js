// Fractions of x's model, drawn by itself once per device (Build AC, Karl 2026-11-03): the first time this device reaches the first problem
// of Level 1, and of Level 3. Remembered in this browser only, under its own key (`mat.fxmodel.v1`, a list of the levels already shown):
// never in the save code, never synced with sign-in, never on the class sheet. A teacher clears it by clearing the site's data. If storage
// is refused (a private window, a blocked store) the model is drawn each time: the safe side. `?model=auto` (testers) draws it every time.

export const FX_MODEL_KEY = 'mat.fxmodel.v1';

function seenLevels(store) {
  try {
    const v = JSON.parse(store.getItem(FX_MODEL_KEY));
    return Array.isArray(v) ? v : [];
  } catch { return []; }                                       // (refused or unreadable: nothing seen, so it is drawn)
}

const defaultStore = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
const forced = () => { try { return new URLSearchParams(globalThis.location?.search ?? '').get('model') === 'auto'; } catch { return false; } };

// Should the model draw itself on this level's first problem? (Then call markModelShown.)
export function modelAutoDue(level, { store = defaultStore(), force = forced() } = {}) {
  if (force || !store) return true;
  return !seenLevels(store).includes(level);
}
export function markModelShown(level, { store = defaultStore() } = {}) {
  if (!store) return;
  try {
    const seen = seenLevels(store);
    if (!seen.includes(level)) store.setItem(FX_MODEL_KEY, JSON.stringify([...seen, level]));
  } catch { /* storage refused or full: drawn again next time */ }
}
