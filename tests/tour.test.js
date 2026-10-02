import { describe, it, expect, beforeEach } from 'vitest';
import { tourSteps, startTour, currentStep, advance } from '../src/engine/tour.js';
import { tourSeen, markTourSeen, TOUR_KEY } from '../src/lightStore.js';

const ids = (t) => t.steps.map((s) => s.id);

describe('the spotlight tour', () => {
  it('the first-time tour lights up the problem, the pad, Check, I\'m stuck, then what the help looks like', () => {
    const t = startTour(true);
    expect(ids(t)).toEqual(['problem', 'pad', 'check', 'stuck', 'help']);
    expect(t.steps.find((s) => s.id === 'stuck').needs).toBe('press');
    expect(currentStep(t).id).toBe('problem');
  });

  it('a replay only points at I\'m stuck: no required press, and no help step', () => {
    const t = startTour(false);
    expect(ids(t)).toEqual(['problem', 'pad', 'check', 'stuck']);
    expect(t.steps.find((s) => s.id === 'stuck').needs).toBe('next');
    expect(tourSteps({ required: false }).find((s) => s.id === 'stuck').text).not.toMatch(/Try it now/);
  });

  it('Next moves on for the plain steps, and does nothing at the I\'m stuck step', () => {
    let t = startTour(true);
    for (const id of ['pad', 'check', 'stuck']) { t = advance(t, 'next'); expect(currentStep(t).id).toBe(id); }
    expect(advance(t, 'next')).toBe(t);                      // the student has to press it
    expect(advance(t, 'press')).not.toBe(t);
    t = advance(t, 'press');
    expect(currentStep(t).id).toBe('help');
  });

  it('pressing does nothing at a Next step, and the last Next ends the tour', () => {
    let t = startTour(true);
    expect(advance(t, 'press')).toBe(t);
    t = { ...t, index: 4 };
    t = advance(t, 'next');
    expect(t.done).toBe(true);
    expect(currentStep(t)).toBeNull();
    expect(advance(t, 'next')).toBe(t);
  });

  it('skipping ends it from any step, and a missing feature can be passed', () => {
    expect(advance(startTour(true), 'skip').done).toBe(true);
    expect(currentStep(advance(startTour(true), 'pass')).id).toBe('pad');
    let t = { ...startTour(true), index: 3 };
    expect(currentStep(advance(t, 'pass')).id).toBe('help');   // even the pressed step, if there's no such button
  });
});

describe('remembering the tour', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); } };
  });

  it('is unseen until it has been seen, once per device', () => {
    expect(TOUR_KEY).toBe('mat.tour.v1');
    expect(tourSeen()).toBe(false);
    markTourSeen();
    expect(tourSeen()).toBe(true);
  });

  it('survives a store that throws (it just shows again)', () => {
    globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    expect(tourSeen()).toBe(false);
    expect(() => markTourSeen()).not.toThrow();
  });
});
