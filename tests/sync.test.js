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
    expect(second.progress.packs.value.levels).toEqual([true, true, false, false]);
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

// ---------- Google sign-in, from the app's side ----------
import { makeScript } from './helpers/fakeSheet.js';
import { validAuth as valid2, periodLabel } from '../src/engine/sync.js';

const CLIENT = '1234567890-abc.apps.googleusercontent.com';
const KEY = 'a-long-secret-the-teacher-made-up-0123456789';
const TOKEN = 'G'.repeat(40);
const info = (email = 's1234567@school.org') => ({ aud: CLIENT, sub: '1099', iss: 'https://accounts.google.com', exp: String(Math.floor(Date.now() / 1000) + 3000), hd: 'school.org', email, email_verified: 'true' });
const classBook = (script, ids = [['1234567', '3']]) => {
  const book = new FakeBook();
  const dir = book.insertSheet('Directory');
  dir.appendRow(['StudentID', 'Period']);
  for (const [id, period] of ids) dir.appendRow([script.studentKey(id), period]);
  return book;
};
const makeClass = (props = {}, tokens = { [TOKEN]: info() }) => makeScript({ properties: { GOOGLE_CLIENT_ID: CLIENT, ALLOWED_DOMAIN: 'school.org', ID_KEY: KEY, ...props }, tokens });

function gphone(book, script, extra = {}) {
  const device = { progress: newProgress(PACKS), events: [], runs: [], store: { endpoint: null, auth: null, cursor: newCursor(), lastSync: null } };
  device.sync = createSync({
    load: () => device.store, save: (s) => { device.store = s; },
    getProgress: () => device.progress, setProgress: (p) => { device.progress = p; },
    getEvents: () => device.events, getRuns: () => device.runs, packs: PACKS,
    // like doPost: a refusal comes back as { ok: false, error, code }
    send: async (_u, req) => { try { return script.handle(JSON.parse(JSON.stringify(req)), book); } catch (e) { return { ok: false, error: e.message, code: e.code }; } },
    getInfo: async () => { const g = JSON.parse(script.doGet().text); return { google: g.google, numberSignin: g.numberSignin, retired: g.retired }; },
    ...extra,
  });
  return device;
}

describe('signing in with Google, from the app', () => {
  it('knows the three kinds of sign-in; Google needs only the token, nothing typed', () => {
    expect(valid2({ mode: 'google', idToken: 'abc' })).toBe(true);
    expect(valid2({ mode: 'google', idToken: '' })).toBe(false);
    expect(valid2({ mode: 'device', id: 'S-1', token: 't' })).toBe(true);
    expect(valid2({ mode: 'device', id: 'S-1' })).toBe(false);
    expect(authOf({ mode: 'google', idToken: 'abc', period: '3' })).toEqual({ mode: 'google', idToken: 'abc' });
    expect(authOf({ mode: 'device', id: 'S-1', token: 't', label: 'P3' })).toEqual({ mode: 'device', id: 'S-1', token: 't' });
    expect(studentLabel({ mode: 'device', id: 'S-1', token: 't', label: 'P3' })).toBe('P3');
    expect(studentLabel({ mode: 'device', id: 'S-1', token: 't' })).toBe('Signed in');
    expect([periodLabel('3'), periodLabel('B'), periodLabel('TEST'), periodLabel('')]).toEqual(['P3', 'PB', 'Test', 'Signed in']);
  });

  it('asks the class what it offers, signs in once with Google, then syncs with the device token alone', async () => {
    const script = makeClass();
    const book = classBook(script);
    const d = gphone(book, script);
    d.sync.setEndpoint(URL_);
    expect(d.sync.classInfo()).toBe(null);
    expect(await d.sync.probe()).toEqual({ google: CLIENT, numberSignin: false, retired: false });
    d.progress.packs.value.levels[0] = true;
    d.events.push(ev(1));
    expect(await d.sync.signIn({ mode: 'google', idToken: TOKEN })).toMatchObject({ ok: true });
    expect(d.store.auth).toMatchObject({ mode: 'device', label: 'P3' });
    expect(d.store.auth.id).toMatch(/^S-/);
    expect(JSON.stringify(d.store)).not.toContain(TOKEN);            // the Google token is not kept
    expect(d.sync.status()).toMatchObject({ state: 'ready', label: 'P3' });
    d.events.push(ev(2));
    expect(await d.sync.now()).toMatchObject({ ok: true });
    expect(book.sheets.Log.rows).toHaveLength(3);

    // a second phone, same school account: levels come back
    const second = gphone(book, script);
    second.sync.setEndpoint(URL_);
    await second.sync.signIn({ mode: 'google', idToken: TOKEN });
    expect(second.progress.packs.value.levels[0]).toBe(true);
  });

  it('the label follows the student when the class list moves them to another period', async () => {
    const script = makeClass();
    const book = classBook(script);
    const d = gphone(book, script);
    d.sync.setEndpoint(URL_);
    await d.sync.signIn({ mode: 'google', idToken: TOKEN });
    expect(d.sync.status().label).toBe('P3');
    book.sheets.Directory.rows[1][1] = '6';
    await d.sync.now();
    expect(d.sync.status().label).toBe('P6');
  });

  it('a refused Google sign-in keeps nothing and says so: not a school account, not on the class list, not set up', async () => {
    const refused = async (script, book) => {
      const d = gphone(book, script);
      d.sync.setEndpoint(URL_);
      const res = await d.sync.signIn({ mode: 'google', idToken: TOKEN });
      expect(d.store.auth).toBe(null);
      return res;
    };
    let script = makeClass({}, {});
    expect(await refused(script, classBook(script))).toMatchObject({ ok: false, error: expect.stringMatching(/Google sign-in did not work/) });
    script = makeClass({}, { [TOKEN]: info('s9999999@school.org') });
    expect(await refused(script, classBook(script))).toMatchObject({ ok: false, error: expect.stringMatching(/not on the class list/) });
    script = makeClass({}, { [TOKEN]: info('someone@gmail.com') });
    expect(await refused(script, classBook(script))).toMatchObject({ ok: false, error: expect.stringMatching(/school account/) });
    script = makeClass();
    expect(await refused(script, new FakeBook())).toMatchObject({ ok: false, error: expect.stringMatching(/class list/) });
    const d = gphone(classBook(script), script);
    d.sync.setEndpoint(URL_);
    expect(await d.sync.signIn({ period: '3', number: '12' })).toMatchObject({ ok: false, error: expect.stringMatching(/signs in with Google/) });
  });

  it('when the sheet no longer knows the device, the student is signed out with a reason', async () => {
    const script = makeClass();
    const book = classBook(script);
    const d = gphone(book, script);
    d.sync.setEndpoint(URL_);
    await d.sync.signIn({ mode: 'google', idToken: TOKEN });
    book.sheets.Devices.rows.length = 1;                           // the teacher cleared the devices
    expect(await d.sync.now()).toMatchObject({ ok: false, error: expect.stringMatching(/sign in again/i) });
    expect(d.sync.status().state).toBe('signed-out');
    expect(d.store.auth).toBe(null);
  });

  it('after the sheet retires, it says so, and the device keeps everything', async () => {
    const script = makeClass({ RETIRE_ON: '2020-01-01' });
    const d = gphone(classBook(script), script);
    d.sync.setEndpoint(URL_);
    expect(await d.sync.probe()).toMatchObject({ retired: true });
    expect(await d.sync.signIn({ mode: 'google', idToken: TOKEN })).toMatchObject({ ok: false, error: expect.stringMatching(/retired/) });
    expect(d.progress.packs.flipit.levels.some(Boolean)).toBe(false);
  });
});

describe('after a refused sign-in', () => {
  it('the button goes back to Sign in (it does not stay on a warning), and nothing is kept in memory or on the device', async () => {
    const script = makeClass({}, {});                               // Google refuses the token
    const seen = [];
    const d = gphone(classBook(script), script, { onChange: (status) => seen.push(status.state) });
    d.sync.setEndpoint(URL_);
    const res = await d.sync.signIn({ mode: 'google', idToken: TOKEN });
    expect(res.ok).toBe(false);
    expect(seen.at(-1)).toBe('signed-out');
    expect(d.sync.status().state).toBe('signed-out');
    expect(d.store.auth).toBe(null);
    expect(d.store.cursor).toEqual({ eventsT: 0, runsT: 0 });
  });

  it('a sign-in that works ends ready, and the button shows the period', async () => {
    const script = makeClass();
    const seen = [];
    const d = gphone(classBook(script), script, { onChange: (status) => seen.push(`${status.state}:${status.label ?? ''}`) });
    d.sync.setEndpoint(URL_);
    await d.sync.signIn({ mode: 'google', idToken: TOKEN });
    expect(seen.at(-1)).toBe('ready:P3');
  });
});

describe('the built-in class address', () => {
  it('is a real class sheet address, or empty (students then need the class link)', async () => {
    const { DEFAULT_CLASS } = await import('../src/syncConfig.js');
    expect(DEFAULT_CLASS === '' || normalizeEndpoint(DEFAULT_CLASS) === DEFAULT_CLASS).toBe(true);
  });
});

describe('saying why the class sheet could not be reached', () => {
  it('names the reason in words a teacher can act on', async () => {
    const { explainFailure } = await import('../src/sync.js');
    const abort = Object.assign(new Error('x'), { name: 'AbortError' });
    expect(explainFailure(abort)).toMatch(/took too long/);
    expect(explainFailure(new Error('HTTP 403'))).toMatch(/answered HTTP 403/);
    expect(explainFailure(new SyntaxError('Unexpected token <'))).toMatch(/web page, not data.*Anyone/);
    expect(explainFailure(new TypeError('Failed to fetch'))).toMatch(/blocked or offline.*Anyone.*script\.google\.com/);
    expect(explainFailure(new Error('weird'))).toMatch(/\(weird\)/);
    for (const e of [abort, new TypeError('x'), new Error('HTTP 500')]) expect(explainFailure(e)).toMatch(/still saved on this device/);
  });

  it('the sign-in dialog hears why the first check failed, and a failed check is not read as "no Google"', async () => {
    const script = makeClass();
    const d = gphone(classBook(script), script, { getInfo: async () => { throw Object.assign(new Error('boom'), { userMessage: 'Couldn’t reach the class sheet (HTTP 403).' }); } });
    d.sync.setEndpoint(URL_);
    expect(await d.sync.probe()).toBe(null);
    expect(d.sync.classInfo()).toBe(null);
    expect(d.sync.probeError()).toBe('Couldn’t reach the class sheet (HTTP 403).');
  });
});
