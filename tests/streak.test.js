import { describe, it, expect, beforeEach } from 'vitest';
import { afterAnswer, readBests, bestFor, withBest } from '../src/engine/streak.js';
import { loadBests, saveBest, tipSeen, markTipSeen, STREAKS_KEY, TIPS_KEY } from '../src/lightStore.js';
import { tipTour, currentStep, advance, TIPS } from '../src/engine/tour.js';

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
  };
});

describe('streaks', () => {
  it('a clean answer adds one, a wrong typed answer goes back to zero, and asking for help leaves it', () => {
    expect(afterAnswer(0, { clean: true })).toBe(1);
    expect(afterAnswer(4, { clean: true, wrongs: 0 })).toBe(5);
    expect(afterAnswer(4, { clean: false, wrongs: 1 })).toBe(0);
    expect(afterAnswer(4, { clean: false, wrongs: 0, stuck: 1 })).toBe(4);     // I'm stuck, then right: no change
    expect(afterAnswer(4, { clean: false })).toBe(0);                          // no count of wrongs: treated as a miss
  });

  it('keeps the best per card and level, and only ever raises it', () => {
    let bests = {};
    bests = withBest(bests, 'boxes', 2, 4);
    expect(bestFor(bests, 'boxes', 2)).toBe(4);
    expect(withBest(bests, 'boxes', 2, 3)).toBe(bests);        // not a record: the same object back
    expect(withBest(bests, 'boxes', 2, 4)).toBe(bests);
    bests = withBest(bests, 'boxes', 2, 9);
    bests = withBest(bests, 'flipit', 1, 2);
    expect(bestFor(bests, 'boxes', 2)).toBe(9);
    expect(bestFor(bests, 'flipit', 1)).toBe(2);
    expect(bestFor(bests, 'boxes', 3)).toBe(0);
    expect(bestFor(bests, 'lasso', 1)).toBe(0);
  });

  it('reads saved data defensively', () => {
    expect(readBests(null)).toEqual({});
    expect(readBests('x')).toEqual({});
    expect(readBests({ boxes: { 1: 5, 2: -1, 3: 'a', 4: 2.5 }, bad: 7, flipit: null })).toEqual({ boxes: { 1: 5 } });
  });

  it('is saved per device, and survives a store that throws', () => {
    expect(loadBests()).toEqual({});
    expect(saveBest('boxes', 1, 3)).toBe(3);
    expect(saveBest('boxes', 1, 2)).toBe(3);
    expect(saveBest('boxes', 1, 8)).toBe(8);
    expect(JSON.parse(localStorage.getItem(STREAKS_KEY))).toEqual({ boxes: { 1: 8 } });
    globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    expect(loadBests()).toEqual({});
    expect(() => saveBest('boxes', 1, 2)).not.toThrow();
  });
});

describe('one-step tips', () => {
  it('shows once per device each', () => {
    expect(tipSeen('algebra-pad')).toBe(false);
    markTipSeen('algebra-pad');
    markTipSeen('algebra-pad');
    expect(tipSeen('algebra-pad')).toBe(true);
    expect(JSON.parse(localStorage.getItem(TIPS_KEY))).toEqual(['algebra-pad']);
  });

  it('a tip is a one-step tour that Next ends', () => {
    const t = tipTour('algebra-pad');
    expect(currentStep(t)).toBe(TIPS['algebra-pad']);
    expect(currentStep(t).target).toBe('pad');
    expect(advance(t, 'next').done).toBe(true);
  });
});
