import { describe, it, expect } from 'vitest';
import { createStore } from '../src/storage.js';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    map: m,
  };
}

const throwing = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('SecurityError'); },
  removeItem() { throw new Error('SecurityError'); },
};

describe('storage', () => {
  it('saves and loads JSON under one key', () => {
    const backend = fakeStorage();
    const store = createStore('mat.v1', backend);
    expect(store.available).toBe(true);
    expect(store.load()).toBeNull();
    store.save({ v: 1, packs: {} });
    expect(backend.map.get('mat.v1')).toBe('{"v":1,"packs":{}}');
    expect(createStore('mat.v1', backend).load()).toEqual({ v: 1, packs: {} });
    expect([...backend.map.keys()]).toEqual(['mat.v1']); // the probe key is cleaned up
  });

  it('works in memory when localStorage throws', () => {
    const store = createStore('mat.v1', throwing);
    expect(store.available).toBe(false);
    expect(store.load()).toBeNull();
    expect(store.save({ a: 1 })).toBe(false);
    expect(store.load()).toEqual({ a: 1 });
  });

  it('works in memory when there is no localStorage at all', () => {
    const store = createStore('mat.v1', undefined);
    expect(store.available).toBe(false);
    store.save({ a: 2 });
    expect(store.load()).toEqual({ a: 2 });
  });

  it('survives corrupt saved data', () => {
    const backend = fakeStorage();
    backend.setItem('mat.v1', '{not json');
    expect(createStore('mat.v1', backend).load()).toBeNull();
  });

  it('falls back to memory if a write starts failing (quota)', () => {
    const backend = fakeStorage();
    const store = createStore('mat.v1', backend);
    backend.setItem = () => { throw new Error('QuotaExceededError'); };
    expect(store.save({ b: 1 })).toBe(false);
    expect(store.available).toBe(false);
    expect(store.load()).toEqual({ b: 1 });
  });
});
