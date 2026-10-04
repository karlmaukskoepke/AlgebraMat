import { describe, it, expect } from 'vitest';
import {
  validAuth, authOf, studentLabel, normalizeEndpoint, buildRequest, advance, moreToSend, takeFromSheet, progressChanged, newCursor, MAX_SENT,
} from '../src/engine/sync.js';
import { createSync } from '../src/sync.js';
import { newProgress } from '../src/engine/progress.js';
import { PACKS } from '../src/packs/index.js';
import { FakeBook, gs } from './helpers/fakeSheet.js';

const ID = 'AKfycbxExampleDeploymentId1234567890abcdef';
const URL_ = `https://script.google.com/macros/s/${ID}/exec`;
const ev = (t) => ({ t, pack: 'value', level: 1, problem: `p${t}`, answers: [], supports: [], stuck: 0, taught: 0, clean: true });

describe('who a student is', () => {
  it('is a period and a number, letters and digits only, up to 12', () => {
    expect(validAuth({ period: '3', number: '12' })).toBe(true);
    expect(validAuth({ period: ' b ', number: 'a7' })).toBe(true);
    expect(validAuth({ period: '3', number: '' })).toBe(false);
    expect(validAuth({ period: '3', number: 'a b' })).toBe(false);
    expect(validAuth({ period: '3', number: '1234567890123' })).toBe(false);
    expect(validAuth(null)).toBe(false);
    expect(authOf({ period: ' b ', number: 'a7' })).toEqual({ period: 'B', number: 'A7' });
    expect(studentLabel({ period: '3', number: 'a7' })).toBe('3-A7');
  });

  it('reaches the class by its link, or just the long id from it', () => {
    expect(normalizeEndpoint(URL_)).toBe(URL_);
    expect(normalizeEndpoint(`  ${ID} `)).toBe(URL_);
    expect(normalizeEndpoint('https://example.com/exec')).toBe(null);
    expect(normalizeEndpoint('short')).toBe(null);
    expect(normalizeEndpoint('')).toBe(null);
  });
});

describe('what is sent', () => {
  it('carries the levels, and only the problems and runs after the cursor, oldest first', () => {
    const progress = newProgress(PACKS);
    progress.packs.value.levels = [true, false, false];
    progress.packs.boxes.open = 3;
    const req = buildRequest({
      auth: { period: '3', number: 'a7' }, progress, events: [ev(30), ev(10), ev(20)], runs: [{ c: 'adding', s: 5, t: 15, tier: 0 }],
      cursor: { eventsT: 10, runsT: 0 },
    });
    expect(req.auth).toEqual({ period: '3', number: 'A7' });
    expect(req.progress.packs.value).toEqual({ levels: [true, false, false] });
    expect(req.progress.packs.boxes.open).toBe(3);
    expect(req.progress.packs.flipit.open).toBeUndefined();
    expect(req.events.map((e) => e.t)).toEqual([20, 30]);
    expect(req.runs).toHaveLength(1);
    expect(advance(newCursor(), req)).toEqual({ eventsT: 30, runsT: 15 });
    expect(advance({ eventsT: 99, runsT: 99 }, { events: [], runs: [] })).toEqual({ eventsT: 99, runsT: 99 });
  });

  it('sends at most 200 problems at a time, and says there is more', () => {
    const many = Array.from({ length: MAX_SENT + 50 }, (_, i) => ev(i + 1));
    const req = buildRequest({ auth: { period: '3', number: '1' }, progress: newProgress(PACKS), events: many, runs: [] });
    expect(req.events).toHaveLength(MAX_SENT);
    expect(moreToSend(req)).toBe(true);
    expect(moreToSend({ events: [], runs: [] })).toBe(false);
  });
});

describe('what comes back', () => {
  it('adds the sheet\'s levels to ours, never taking one away', () => {
    const mine = newProgress(PACKS);
    mine.packs.flipit.levels[0] = true;
    const theirs = { packs: { flipit: { levels: [false, true] }, value: { levels: [true] } } };
    const merged = takeFromSheet(mine, theirs, PACKS);
    expect(merged.packs.flipit.levels.slice(0, 3)).toEqual([true, true, false]);
    expect(merged.packs.value.levels[0]).toBe(true);
    expect(progressChanged(mine, merged)).toBe(true);
    expect(progressChanged(merged, takeFromSheet(merged, theirs, PACKS))).toBe(false);
    expect(takeFromSheet(mine, null, PACKS)).toBe(mine);
  });
});

// The whole thing: the app's side talking to the class sheet's script, on a stand-in sheet.
function phone(book, { events = [], runs = [], progress = newProgress(PACKS), saved = {} } = {}) {
  const device = { progress, events, runs, store: { endpoint: null, auth: null, cursor: newCursor(), lastSync: null, ...saved }, timers: [] };
  device.sync = createSync({
    load: () => device.store, save: (s) => { device.store = s; },
    getProgress: () => device.progress, setProgress: (p) => { device.progress = p; },
    getEvents: () => device.events, getRuns: () => device.runs, packs: PACKS,
    send: async (_url, req) => gs.handle(JSON.parse(JSON.stringify(req)), book),
    setTimer: (fn) => { device.timers.push(fn); return device.timers.length; }, clearTimer: () => {},
  });
  return device;
}

describe('syncing with the class sheet', () => {
  it('needs the class link first, then a valid period and number; nothing is kept if the sheet says no', async () => {
    const book = new FakeBook();
    const a = phone(book);
    expect(a.sync.status().state).toBe('off');
    expect(await a.sync.signIn({ period: '3', number: '1' })).toMatchObject({ ok: false });
    expect(a.sync.setEndpoint('nope')).toBe(false);
    expect(a.sync.setEndpoint(URL_)).toBe(true);
    expect(a.sync.status().state).toBe('signed-out');
    expect(await a.sync.signIn({ period: '3', number: 'a b' })).toMatchObject({ ok: false });
    expect(a.store.auth).toBe(null);
    expect(await a.sync.signIn({ period: '3', number: '1' })).toMatchObject({ ok: true });
    expect(a.store.auth).toEqual({ period: '3', number: '1' });
    expect(a.sync.status()).toMatchObject({ state: 'ready', label: '3-1' });
    expect(book.sheets.Students.rows).toHaveLength(2);
  });

  it('moves a student to a second device: levels come back, problems are not doubled', async () => {
    const book = new FakeBook();
    const progress = newProgress(PACKS);
    progress.packs.value.levels = [true, true, false];
    const first = phone(book, { progress, events: [ev(1), ev(2)], runs: [{ c: 'adding', s: 9, t: 5, tier: 1 }] });
    first.sync.setEndpoint(URL_);
    await first.sync.signIn({ period: '3', number: '1' });
    expect(book.sheets.Log.rows).toHaveLength(3);
    expect(book.sheets.Fluency.rows).toHaveLength(2);

    const second = phone(book);
    second.sync.setEndpoint(URL_);
    await second.sync.signIn({ period: '3', number: '1' });
    expect(second.progress.packs.value.levels).toEqual([true, true, false]);
    second.progress.packs.flipit.levels[0] = true;
    await second.sync.now();
    await first.sync.now();
    expect(first.progress.packs.flipit.levels[0]).toBe(true);
    expect(book.sheets.Log.rows).toHaveLength(3);                  // nothing sent twice
  });

  it('sends only what is new each time, and asks for a sync soon, not at once', async () => {
    const book = new FakeBook();
    const d = phone(book, { events: [ev(1)] });
    d.sync.setEndpoint(URL_);
    await d.sync.signIn({ period: '3', number: '1' });
    d.events.push(ev(2), ev(3));
    d.sync.request();
    expect(d.timers).toHaveLength(1);
    await d.sync.now();
    expect(book.sheets.Log.rows).toHaveLength(4);
    expect(d.store.cursor.eventsT).toBe(3);
  });

  it('sends everything even when it takes several requests', async () => {
    const book = new FakeBook();
    const d = phone(book, { events: Array.from({ length: 450 }, (_, i) => ev(i + 1)) });
    d.sync.setEndpoint(URL_);
    await d.sync.signIn({ period: '3', number: '1' });
    expect(book.sheets.Log.rows).toHaveLength(451);
  });

  it('keeps working offline: an unreachable sheet is an error message, and the next try catches up', async () => {
    const book = new FakeBook();
    let up = false;
    const d = phone(book, { events: [ev(1)] });
    d.sync = createSync({
      load: () => d.store, save: (s) => { d.store = s; }, getProgress: () => d.progress, setProgress: (p) => { d.progress = p; },
      getEvents: () => d.events, getRuns: () => d.runs, packs: PACKS,
      send: async (_u, req) => { if (!up) throw new Error('offline'); return gs.handle(JSON.parse(JSON.stringify(req)), book); },
    });
    d.sync.setEndpoint(URL_);
    expect(await d.sync.signIn({ period: '3', number: '1' })).toMatchObject({ ok: false, error: expect.stringMatching(/Couldn’t reach/) });
    expect(d.store.auth).toBe(null);
    up = true;
    expect(await d.sync.signIn({ period: '3', number: '1' })).toMatchObject({ ok: true });
    expect(book.sheets.Log.rows).toHaveLength(2);
    up = false;
    d.events.push(ev(2));
    expect(await d.sync.now()).toMatchObject({ ok: false });
    expect(d.sync.status().state).toBe('error');
    up = true;
    await d.sync.now();
    expect(d.sync.status().state).toBe('ready');
    expect(book.sheets.Log.rows).toHaveLength(3);
  });

  it('signing out forgets who the student is, not the class', async () => {
    const book = new FakeBook();
    const d = phone(book);
    d.sync.setEndpoint(URL_);
    await d.sync.signIn({ period: '3', number: '1' });
    d.sync.signOut();
    expect(d.sync.status().state).toBe('signed-out');
    expect(d.sync.endpoint()).toBe(URL_);
    expect(await d.sync.now()).toMatchObject({ ok: false });
  });
});
