// A log of how the moves are made on the light-design cards: one line a problem, on this device only (never synced), newest 500 kept.

export const LIGHTS_LOG_KEY = 'mat.lights.v1';
export function logLights(line) {
  try {
    const list = JSON.parse(localStorage.getItem(LIGHTS_LOG_KEY) ?? '[]');
    const next = [...(Array.isArray(list) ? list : []), line].slice(-500);
    localStorage.setItem(LIGHTS_LOG_KEY, JSON.stringify(next));
  } catch { /* storage blocked or full */ }
}
