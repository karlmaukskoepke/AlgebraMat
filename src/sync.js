// Runs the class-sheet sync (engine/sync.js is the logic; this is the talking). Built with what it needs handed in, so
// a test can give it a fake sheet. One request at a time; a request asked for during another follows it.

import {
  PROTOCOL, validAuth, authOf, studentLabel, periodLabel, buildRequest, advance, moreToSend, takeFromSheet, progressChanged, normalizeEndpoint,
} from './engine/sync.js';

const TIMEOUT_MS = 15000;
const DELAY_MS = 4000;

export function createSync({ load, save, getProgress, setProgress, getEvents, getRuns, packs, send = defaultSend, getInfo = defaultInfo, onChange = () => {}, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let state = load();
  let busy = false;
  let again = false;
  let timer = null;
  let error = null;
  let info = null;            // what the class sheet says about itself: { google, numberSignin }

  const set = (patch) => { state = { ...state, ...patch }; save(state); };
  const changed = () => onChange(api.status());

  async function once() {
    const request = buildRequest({ auth: state.auth, progress: getProgress(), events: getEvents(), runs: getRuns(), cursor: state.cursor });
    const res = await send(state.endpoint, request);
    if (!res?.ok) throw Object.assign(new Error(res?.error || 'The class sheet said no'), { userMessage: res?.error || 'The class sheet said no.', code: res?.code });
    // A first Google sign-in is answered with this device's own token: from now on that is the sign-in.
    if (res.device?.token) set({ auth: { mode: 'device', id: res.device.id, token: res.device.token, label: periodLabel(res.period) } });
    else if (state.auth?.mode === 'device' && res.period !== undefined && state.auth.label !== periodLabel(res.period)) set({ auth: { ...state.auth, label: periodLabel(res.period) } });   // their period changed
    const before = getProgress();
    const merged = takeFromSheet(before, res.progress, packs);
    if (progressChanged(before, merged)) setProgress(merged);
    set({ cursor: advance(state.cursor, request), lastSync: Date.now() });
    return moreToSend(request);
  }

  async function run() {
    if (!state.endpoint || !state.auth) return { ok: false, error: 'Not signed in' };
    if (busy) { again = true; return { ok: true, queued: true }; }
    busy = true;
    changed();
    try {
      let more = true;
      while (more) more = await once();
      error = null;
      return { ok: true };
    } catch (e) {
      error = e?.userMessage ?? 'Couldn’t reach the class sheet. Your progress is still saved on this device.';
      // The sheet no longer knows this device (its token was removed, or it is a new class): sign in again.
      if (e?.code === 'auth' && state.auth?.mode === 'device') set({ auth: null, cursor: { eventsT: 0, runsT: 0 }, lastSync: null });
      return { ok: false, error };
    } finally {
      busy = false;
      changed();
      if (again) { again = false; api.request(); }
    }
  }

  const api = {
    status() {
      if (!state.endpoint) return { state: 'off' };
      if (!state.auth) return { state: 'signed-out' };
      return { state: busy ? 'syncing' : error ? 'error' : 'ready', label: studentLabel(state.auth), lastSync: state.lastSync, error };
    },
    endpoint: () => state.endpoint,
    // A class link the teacher shared (or its id). False if it isn't one.
    setEndpoint(text) {
      const url = normalizeEndpoint(text);
      if (!url) return false;
      if (url !== state.endpoint) set({ endpoint: url, auth: null, cursor: { eventsT: 0, runsT: 0 }, lastSync: null });
      changed();
      return true;
    },
    // What the class sheet offers: { google: client id or null, numberSignin }. Null if it can't be reached.
    async probe() {
      if (!state.endpoint) return null;
      try { info = await getInfo(state.endpoint); } catch { info = null; }
      return info;
    },
    classInfo: () => info,
    // Sign in as a period and a number, or with a Google ID token plus a period and number. Nothing is kept unless the
    // sheet takes it.
    async signIn(auth) {
      if (!state.endpoint) return { ok: false, error: 'Ask your teacher for the class link first.' };
      if (!validAuth(auth)) return { ok: false, error: 'Use letters and numbers only for the period and the student number.' };
      const before = state;
      state = { ...state, auth: authOf(auth), cursor: { eventsT: 0, runsT: 0 } };
      const res = await run();
      if (!res.ok) { state = before; return res; }
      save(state);
      changed();
      return res;
    },
    signOut() { set({ auth: null, cursor: { eventsT: 0, runsT: 0 }, lastSync: null }); error = null; changed(); },
    // Soon, not at once: a level finishing asks several times.
    request() {
      if (!state.endpoint || !state.auth) return;
      clearTimer(timer);
      timer = setTimer(() => { timer = null; run(); }, DELAY_MS);
    },
    now: run,
  };
  return api;
}

async function defaultInfo(endpoint) {
  const res = await fetch(endpoint, { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return { google: typeof body.google === 'string' ? body.google : null, numberSignin: body.numberSignin !== false, retired: body.retired === true };
}

async function defaultSend(endpoint, request) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    // text/plain keeps this a "simple" request, so the browser doesn't need the sheet to answer a preflight.
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(request), signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export { PROTOCOL };
