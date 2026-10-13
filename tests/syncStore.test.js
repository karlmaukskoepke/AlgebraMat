import { describe, it, expect, beforeEach } from 'vitest';
import { loadSync, saveSync, SYNC_KEY } from '../src/syncStore.js';

beforeEach(() => { globalThis.localStorage = (() => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })(); });

describe('what this device remembers about the class sheet', () => {
  it('keeps a Google student signed in across a reload (the device token survives)', () => {
    const state = { endpoint: 'https://script.google.com/macros/s/AKfycbxExampleDeploymentId1234567890abcdef/exec', auth: { mode: 'device', id: 'S-abc1234567', token: 'tok', label: 'P3' }, cursor: { eventsT: 5, runsT: 7 }, lastSync: 123 };
    saveSync(state);
    expect(loadSync()).toEqual(state);
  });
  it('still keeps a period-and-number sign-in, and drops a half-saved or unknown one', () => {
    saveSync({ endpoint: 'x', auth: { period: '3', number: 'A7' }, cursor: {}, lastSync: null });
    expect(loadSync().auth).toEqual({ period: '3', number: 'A7' });
    saveSync({ endpoint: 'x', auth: { mode: 'device', id: 'S-1' }, cursor: {}, lastSync: null });      // no token
    expect(loadSync().auth).toBeNull();
    saveSync({ endpoint: 'x', auth: { nonsense: true }, cursor: {}, lastSync: null });
    expect(loadSync().auth).toBeNull();
    localStorage.setItem(SYNC_KEY, 'not json');
    expect(loadSync().auth).toBeNull();
  });
});
